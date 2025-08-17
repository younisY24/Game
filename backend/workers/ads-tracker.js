/**
 * معالج تتبع الإعلانات
 * - تتبع عرض الإعلانات
 * - منح المكافآت بعد المشاهدة
 * - منع الاحتيال
 */

// إعدادات الإعلانات
const AD_SETTINGS = {
  COOLDOWN: 30 * 60 * 1000, // 30 دقيقة بين الإعلانات
  MIN_WATCH_TIME: 5000,     // 5 ثوانٍ كحد أدنى للمشاهدة
  REWARD: {
    crystals: 100,
    continue: true
  }
};

// تخزين محاولات الإعلانات
const adAttempts = new Map();

export async function trackAdView(request, env) {
  try {
    const { playerId } = await request.json();
    
    if (!playerId) {
      return new Response(JSON.stringify({ error: 'معرف اللاعب مطلوب' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // التحقق من وقت التبريد
    const lastAdTime = adAttempts.get(playerId);
    const now = Date.now();
    
    if (lastAdTime && (now - lastAdTime < AD_SETTINGS.COOLDOWN)) {
      return new Response(JSON.stringify({ 
        error: 'الرجاء الانتظار قبل مشاهدة إعلان آخر',
        cooldownRemaining: AD_SETTINGS.COOLDOWN - (now - lastAdTime)
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // تسجيل محاولة الإعلان
    adAttempts.set(playerId, now);
    
    return new Response(JSON.stringify({
      success: true,
      adId: `ad_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      minWatchTime: AD_SETTINGS.MIN_WATCH_TIME
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Ad view error:', error);
    return new Response(JSON.stringify({ 
      error: 'فشل في بدء الإعلان',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function trackAdReward(request, env) {
  try {
    const { playerId, adId, watchTime } = await request.json();
    
    if (!playerId || !adId || watchTime === undefined) {
      return new Response(JSON.stringify({ error: 'بيانات غير كاملة' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // التحقق من وقت المشاهدة
    if (watchTime < AD_SETTINGS.MIN_WATCH_TIME) {
      return new Response(JSON.stringify({ 
        error: 'لم يتم مشاهدة الإعلان بالكامل',
        requiredTime: AD_SETTINGS.MIN_WATCH_TIME,
        watchedTime: watchTime
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // التحقق من صحة محاولة الإعلان
    const attemptTime = adAttempts.get(playerId);
    if (!attemptTime || (Date.now() - attemptTime > 60000)) {
      return new Response(JSON.stringify({ 
        error: 'محاولة إعلان غير صالحة' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // تحديث بيانات اللاعب
    const playerData = await env.PLAYERS.get(playerId);
    if (!playerData) {
      return new Response(JSON.stringify({ error: 'اللاعب غير موجود' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const profile = JSON.parse(playerData);
    
    // منح المكافأة
    profile.crystals = (profile.crystals || 0) + AD_SETTINGS.REWARD.crystals;
    profile.adViews = (profile.adViews || 0) + 1;
    
    // حفظ التحديثات
    await env.PLAYERS.put(playerId, JSON.stringify(profile));
    
    // مسح المحاولة بعد النجاح
    adAttempts.delete(playerId);
    
    return new Response(JSON.stringify({
      success: true,
      crystalsEarned: AD_SETTINGS.REWARD.crystals,
      totalCrystals: profile.crystals,
      adViews: profile.adViews
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Ad reward error:', error);
    return new Response(JSON.stringify({ 
      error: 'فشل في منح مكافأة الإعلان',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
