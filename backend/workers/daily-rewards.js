/**
 * معالج المكافآت اليومية
 * - جلب حالة المكافأة
 * - المطالبة بالمكافأة
 * - تتبع السلسلة اليومية
 */

// مكافآت الأيام
const DAILY_REWARDS = [
  { day: 1, crystals: 100, streakBonus: 0 },
  { day: 2, crystals: 200, streakBonus: 0 },
  { day: 3, crystals: 300, streakBonus: 0 },
  { day: 4, crystals: 400, streakBonus: 50 },
  { day: 5, crystals: 500, streakBonus: 100 },
  { day: 6, crystals: 600, streakBonus: 150 },
  { day: 7, crystals: 1000, streakBonus: 300 }
];

export async function handleDailyRewardsRequest(request, env, path) {
  const method = request.method;
  const url = new URL(request.url);
  const playerId = url.searchParams.get('playerId');
  
  if (!playerId) {
    return new Response(JSON.stringify({ error: 'معرف اللاعب مطلوب' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // جلب حالة المكافأة
  if (method === 'GET' && path[2] === 'status') {
    return getRewardStatus(request, env, playerId);
  }
  
  // المطالبة بالمكافأة
  if (method === 'POST' && path[2] === 'claim') {
    return claimReward(request, env, playerId);
  }
  
  return new Response(JSON.stringify({ error: 'Invalid rewards request' }), {
    status: 400,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
  });
}

async function getRewardStatus(request, env, playerId) {
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
    
    // حساب حالة المكافأة
    const now = Date.now();
    const lastReward = profile.lastDailyReward ? new Date(profile.lastDailyReward) : null;
    const rewardDay = profile.dailyRewardDay || 1;
    
    let canClaim = false;
    let resetStreak = false;
    
    if (!lastReward) {
      // أول مكافأة
      canClaim = true;
    } else {
      const diffDays = Math.floor((now - lastReward) / (1000 * 60 * 60 * 24));
      
      if (diffDays >= 1) {
        canClaim = true;
        if (diffDays > 1) {
          resetStreak = true;
        }
      }
    }
    
    // تحديد اليوم الحالي
    let currentDay = rewardDay;
    if (resetStreak) {
      currentDay = 1;
    }
    
    return new Response(JSON.stringify({
      canClaim: canClaim,
      day: currentDay,
      resetStreak: resetStreak,
      reward: DAILY_REWARDS.find(r => r.day === currentDay) || DAILY_REWARDS[0],
      lastClaimed: profile.lastDailyReward
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Reward status error:', error);
    return new Response(JSON.stringify({ 
      error: 'فشل في جلب حالة المكافأة',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function claimReward(request, env, playerId) {
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
    
    // التحقق من إمكانية المطالبة
    const now = new Date();
    const lastReward = profile.lastDailyReward ? new Date(profile.lastDailyReward) : null;
    
    if (lastReward) {
      const diffDays = Math.floor((now - lastReward) / (1000 * 60 * 60 * 24));
      if (diffDays < 1) {
        return new Response(JSON.stringify({ 
          error: 'لم يحن الوقت بعد',
          details: 'يمكنك المطالبة بالمكافأة مرة واحدة يومياً' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // تحديد اليوم الحالي
    let currentDay = profile.dailyRewardDay || 1;
    const rewardConfig = DAILY_REWARDS.find(r => r.day === currentDay) || DAILY_REWARDS[0];
    
    // حساب المكافأة مع مكافأة السلسلة
    const totalCrystals = rewardConfig.crystals + (rewardConfig.streakBonus || 0);
    
    // تحديث رصيد اللاعب
    profile.crystals = (profile.crystals || 0) + totalCrystals;
    profile.lastDailyReward = now.toISOString();
    
    // تحديث يوم المكافأة (مع تكرار السلسلة)
    if (currentDay < DAILY_REWARDS.length) {
      profile.dailyRewardDay = currentDay + 1;
    } else {
      profile.dailyRewardDay = 1; // إعادة التعيين بعد اليوم 7
    }
    
    // حفظ التحديثات
    await env.PLAYERS.put(playerId, JSON.stringify(profile));
    
    return new Response(JSON.stringify({
      success: true,
      crystalsEarned: totalCrystals,
      totalCrystals: profile.crystals,
      day: currentDay,
      nextDay: profile.dailyRewardDay,
      streakBonus: rewardConfig.streakBonus
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Claim reward error:', error);
    return new Response(JSON.stringify({ 
      error: 'فشل في المطالبة بالمكافأة',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
