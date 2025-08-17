/**
 * معالج الإنجازات والتحديات
 * - جلب الإنجازات
 * - تحديث حالة الإنجازات
 * - منح المكافآت
 */

// تعريفات الإنجازات
const ACHIEVEMENTS = [
  {
    id: 'newbie',
    name: 'المبتدئ',
    description: 'الوصول إلى 500 نقطة',
    icon: '⭐',
    threshold: 500,
    reward: { crystals: 50 }
  },
  {
    id: 'jumper',
    name: 'القافز المحترف',
    description: 'جمع 50 كريستال',
    icon: '💎',
    threshold: 50,
    reward: { crystals: 100 }
  },
  {
    id: 'time_master',
    name: 'سيد الزمن',
    description: 'استخدام إيقاف الزمن 10 مرات',
    icon: '⏳',
    threshold: 10,
    reward: { crystals: 200 }
  },
  {
    id: 'speed_runner',
    name: 'عابر السرعة',
    description: 'الوصول إلى 5000 نقطة',
    icon: '⚡',
    threshold: 5000,
    reward: { crystals: 500 }
  },
  {
    id: 'ad_master',
    name: 'ساحر الإعلانات',
    description: 'مشاهدة 5 إعلانات',
    icon: '📺',
    threshold: 5,
    reward: { crystals: 150 }
  }
];

export async function handleAchievementsRequest(request, env, path) {
  const method = request.method;
  const url = new URL(request.url);
  const playerId = url.searchParams.get('playerId');
  
  if (!playerId) {
    return new Response(JSON.stringify({ error: 'معرف اللاعب مطلوب' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // جلب الإنجازات
  if (method === 'GET' && path[2] === 'all') {
    return getAchievements(request, env, playerId);
  }
  
  // تحديث حالة الإنجازات
  if (method === 'POST' && path[2] === 'update') {
    return updateAchievements(request, env, playerId);
  }
  
  return new Response(JSON.stringify({ error: 'Invalid achievements request' }), {
    status: 400,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
  });
}

async function getAchievements(request, env, playerId) {
  try {
    // جلب بيانات اللاعب
    const playerData = await env.PLAYERS.get(playerId);
    if (!playerData) {
      return new Response(JSON.stringify({ error: 'اللاعب غير موجود' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const profile = JSON.parse(playerData);
    
    // تحضير بيانات الإنجازات
    const playerAchievements = profile.achievements || [];
    const achievementsData = ACHIEVEMENTS.map(achievement => ({
      ...achievement,
      unlocked: playerAchievements.includes(achievement.id),
      progress: getAchievementProgress(profile, achievement)
    }));
    
    return new Response(JSON.stringify({
      achievements: achievementsData,
      totalUnlocked: playerAchievements.length
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Get achievements error:', error);
    return new Response(JSON.stringify({ 
      error: 'فشل في جلب الإنجازات',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function getAchievementProgress(profile, achievement) {
  switch (achievement.id) {
    case 'newbie':
    case 'speed_runner':
      return Math.min(1, profile.bestScore / achievement.threshold);
    case 'jumper':
      return Math.min(1, (profile.crystals || 0) / achievement.threshold);
    case 'time_master':
      return Math.min(1, (profile.timeFreezeUses || 0) / achievement.threshold);
    case 'ad_master':
      return Math.min(1, (profile.adViews || 0) / achievement.threshold);
    default:
      return 0;
  }
}

async function updateAchievements(request, env, playerId) {
  try {
    const updates = await request.json();
    const playerData = await env.PLAYERS.get(playerId);
    
    if (!playerData) {
      return new Response(JSON.stringify({ error: 'اللاعب غير موجود' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const profile = JSON.parse(playerData);
    const newUnlocks = [];
    
    // تحديث بيانات اللاعب
    if (updates.score !== undefined) {
      profile.bestScore = Math.max(profile.bestScore || 0, updates.score);
    }
    
    if (updates.crystals !== undefined) {
      profile.crystals = (profile.crystals || 0) + updates.crystals;
    }
    
    if (updates.timeFreezeUses !== undefined) {
      profile.timeFreezeUses = (profile.timeFreezeUses || 0) + updates.timeFreezeUses;
    }
    
    if (updates.adViews !== undefined) {
      profile.adViews = (profile.adViews || 0) + updates.adViews;
    }
    
    // تهيئة قائمة الإنجازات إذا لم تكن موجودة
    if (!profile.achievements) {
      profile.achievements = [];
    }
    
    // التحقق من الإنجازات الجديدة
    for (const achievement of ACHIEVEMENTS) {
      if (profile.achievements.includes(achievement.id)) continue;
      
      let achieved = false;
      
      switch (achievement.id) {
        case 'newbie':
        case 'speed_runner':
          achieved = profile.bestScore >= achievement.threshold;
          break;
        case 'jumper':
          achieved = (profile.crystals || 0) >= achievement.threshold;
          break;
        case 'time_master':
          achieved = (profile.timeFreezeUses || 0) >= achievement.threshold;
          break;
        case 'ad_master':
          achieved = (profile.adViews || 0) >= achievement.threshold;
          break;
      }
      
      if (achieved) {
        profile.achievements.push(achievement.id);
        profile.crystals = (profile.crystals || 0) + (achievement.reward.crystals || 0);
        newUnlocks.push(achievement);
      }
    }
    
    // حفظ التحديثات
    await env.PLAYERS.put(playerId, JSON.stringify(profile));
    
    return new Response(JSON.stringify({
      success: true,
      newUnlocks: newUnlocks.map(a => ({
        id: a.id,
        name: a.name,
        reward: a.reward
      })),
      totalCrystals: profile.crystals,
      achievements: profile.achievements
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Update achievements error:', error);
    return new Response(JSON.stringify({ 
      error: 'فشل في تحديث الإنجازات',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
