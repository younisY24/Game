/**
 * معالج التحليلات
 * - جمع بيانات الاستخدام
 * - تتبع الأحداث
 * - إنشاء تقارير
 */

// أنواع الأحداث المسموح بها
const VALID_EVENT_TYPES = [
  'game_start',
  'game_end',
  'score_update',
  'ad_view',
  'ad_reward',
  'achievement_unlocked',
  'daily_reward_claimed',
  'purchase',
  'api_request',
  'api_error'
];

export async function trackEvent(env, event) {
  try {
    // التحقق من صحة نوع الحدث
    if (!VALID_EVENT_TYPES.includes(event.type)) {
      console.warn(`Invalid event type: ${event.type}`);
      return;
    }
    
    // إعداد البيانات
    const eventData = {
      ...event,
      timestamp: event.timestamp || Date.now(),
      environment: env.ENVIRONMENT || 'production',
      version: '1.0.0'
    };
    
    // تخزين الحدث في KV
    const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await env.ANALYTICS.put(eventId, JSON.stringify(eventData), {
      expirationTtl: 60 * 60 * 24 * 30 // تخزين لمدة 30 يوماً
    });
    
    // إذا كان D1 متاحاً، نخزن أيضاً فيه
    if (env.DB) {
      try {
        await env.DB.prepare(`
          INSERT INTO analytics (event_type, data, created_at)
          VALUES (?, ?, datetime('now'))
        `).bind(
          eventData.type,
          JSON.stringify(eventData)
        ).run();
      } catch (dbError) {
        console.error('D1 analytics error:', dbError);
        // نستمر حتى لو فشل D1
      }
    }
    
    // التجميع الدوري (كل 100 حدث)
    const eventCount = (await env.ANALYTICS.get('event_count', 'json')) || 0;
    await env.ANALYTICS.put('event_count', eventCount + 1);
    
    if ((eventCount + 1) % 100 === 0) {
      await aggregateAnalytics(env);
    }
    
  } catch (error) {
    console.error('Analytics tracking error:', error);
  }
}

async function aggregateAnalytics(env) {
  try {
    // جمع إحصائيات اليوم
    const today = new Date().toISOString().split('T')[0];
    
    // جلب جميع الأحداث من اليوم
    const listResponse = await env.ANALYTICS.list({
      prefix: 'event_',
      limit: 1000
    });
    
    const events = [];
    for (const key of listResponse.keys) {
      const eventData = await env.ANALYTICS.get(key.name, 'json');
      if (eventData && eventData.timestamp) {
        const eventDate = new Date(eventData.timestamp).toISOString().split('T')[0];
        if (eventDate === today) {
          events.push(eventData);
        }
      }
    }
    
    // حساب الإحصائيات
    const stats = {
      totalEvents: events.length,
      gameStarts: events.filter(e => e.type === 'game_start').length,
      gameEnds: events.filter(e => e.type === 'game_end').length,
      adViews: events.filter(e => e.type === 'ad_view').length,
      adRewards: events.filter(e => e.type === 'ad_reward').length,
      dailyRewards: events.filter(e => e.type === 'daily_reward_claimed').length,
      uniquePlayers: new Set(events.map(e => e.playerId).filter(Boolean)).size,
      averageSessionTime: calculateAverageSessionTime(events),
      timestamp: Date.now()
    };
    
    // حفظ الإحصائيات اليومية
    await env.ANALYTICS.put(`stats_${today}`, JSON.stringify(stats));
    
    // حذف الأحداث القديمة (أكثر من 30 يوماً)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    for (const key of listResponse.keys) {
      const eventData = await env.ANALYTICS.get(key.name, 'json');
      if (eventData && eventData.timestamp && eventData.timestamp < thirtyDaysAgo) {
        await env.ANALYTICS.delete(key.name);
      }
    }
    
  } catch (error) {
    console.error('Analytics aggregation error:', error);
  }
}

function calculateAverageSessionTime(events) {
  const startEvents = events.filter(e => e.type === 'game_start');
  const endEvents = events.filter(e => e.type === 'game_end');
  
  if (startEvents.length === 0) return 0;
  
  let totalDuration = 0;
  let sessionsCount = 0;
  
  for (const startEvent of startEvents) {
    const playerId = startEvent.playerId;
    if (!playerId) continue;
    
    // البحث عن نهاية الجلسة
    const endEvent = endEvents.find(e => 
      e.playerId === playerId && e.timestamp > startEvent.timestamp
    );
    
    if (endEvent) {
      totalDuration += (endEvent.timestamp - startEvent.timestamp);
      sessionsCount++;
    }
  }
  
  return sessionsCount > 0 ? totalDuration / sessionsCount : 0;
}

// API للإحصائيات (للاستخدام الداخلي)
export async function getAnalyticsStats(request, env) {
  try {
    const url = new URL(request.url);
    const authHeader = request.headers.get('Authorization');
    
    // التحقق من المصادقة
    if (authHeader !== `Bearer ${env.ANALYTICS_KEY}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const today = new Date().toISOString().split('T')[0];
    const stats = await env.ANALYTICS.get(`stats_${today}`, 'json') || {
      totalEvents: 0,
      gameStarts: 0,
      gameEnds: 0,
      adViews: 0,
      adRewards: 0,
      dailyRewards: 0,
      uniquePlayers: 0,
      averageSessionTime: 0,
      timestamp: Date.now()
    };
    
    return new Response(JSON.stringify(stats), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Analytics stats error:', error);
    return new Response(JSON.stringify({ 
      error: 'فشل في جلب الإحصائيات',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
