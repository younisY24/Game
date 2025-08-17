/**
 * معالج لوحة المتصدرين
 * - جلب القائمة
 * - تحديث النقاط
 */

export async function handleLeaderboardRequest(request, env, path) {
  const method = request.method;
  
  // جلب لوحة المتصدرين
  if (method === 'GET' && path[2] === 'top') {
    return getTopPlayers(request, env);
  }
  
  // تحديث النقاط
  if (method === 'POST' && path[2] === 'score') {
    return updateScore(request, env);
  }
  
  return new Response(JSON.stringify({ error: 'Invalid leaderboard request' }), {
    status: 400,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
  });
}

async function getTopPlayers(request, env) {
  try {
    // جلب جميع اللاعبين من KV
    const listResponse = await env.PLAYERS.list();
    const keys = listResponse.keys;
    
    // جلب بيانات كل لاعب
    const players = [];
    for (const key of keys) {
      const playerData = await env.PLAYERS.get(key.name);
      if (playerData) {
        const player = JSON.parse(playerData);
        players.push({
          id: key.name,
          name: player.name,
          score: player.bestScore,
          avatar: player.avatar
        });
      }
    }
    
    // فرز اللاعبين حسب النقاط
    players.sort((a, b) => b.score - a.score);
    
    // إرجاع أعلى 50 لاعباً
    return new Response(JSON.stringify(players.slice(0, 50)), {
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30' // تحديث كل 30 ثانية
      }
    });
    
  } catch (error) {
    console.error('Leaderboard error:', error);
    return new Response(JSON.stringify({ 
      error: 'فشل في جلب لوحة المتصدرين',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function updateScore(request, env) {
  try {
    const { playerId, score, crystals } = await request.json();
    
    // التحقق من صحة المدخلات
    if (!playerId || score === undefined || crystals === undefined) {
      return new Response(JSON.stringify({ 
        error: 'بيانات غير كاملة' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // جلب بيانات اللاعب
    const playerData = await env.PLAYERS.get(playerId);
    if (!playerData) {
      return new Response(JSON.stringify({ 
        error: 'اللاعب غير موجود' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const profile = JSON.parse(playerData);
    
    // تحديث أفضل درجة
    if (score > profile.bestScore) {
      profile.bestScore = score;
    }
    
    // تحديث الكريستالات
    profile.crystals = (profile.crystals || 0) + crystals;
    
    // حفظ التحديثات
    await env.PLAYERS.put(playerId, JSON.stringify(profile));
    
    // تحديث لوحة المتصدرين في D1 (اختياري)
    try {
      await env.DB.prepare(`
        INSERT INTO leaderboard (player_id, score, updated_at)
        VALUES (?, ?, datetime('now'))
        ON CONFLICT(player_id) DO UPDATE SET
          score = max(excluded.score, leaderboard.score),
          updated_at = datetime('now')
      `).bind(playerId, score).run();
    } catch (dbError) {
      console.error('D1 update failed:', dbError);
      // نستمر حتى لو فشل D1
    }
    
    return new Response(JSON.stringify({
      bestScore: profile.bestScore,
      crystals: profile.crystals
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Score update error:', error);
    return new Response(JSON.stringify({ 
      error: 'فشل في تحديث النقاط',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
