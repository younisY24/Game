/**
 * نقطة الدخول الرئيسية لـ API
 * يوجه الطلبات إلى العمال المناسبين
 */

import { handleLeaderboardRequest } from './leaderboard-worker.js';
import { handleAuthRequest } from './auth-worker.js';
import { handleAchievementsRequest } from './achievements-worker.js';
import { handleDailyRewardsRequest } from './daily-rewards.js';
import { handleMultiplayerRequest } from './multiplayer-worker.js';
import { trackAdView, trackAdReward } from './ads-tracker.js';
import { trackEvent } from './analytics-worker.js';

// تكوين CORS
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  async fetch(request, env) {
    // التعامل مع طلبات OPTIONS (CORS preflight)
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname.split('/').filter(Boolean);
    
    try {
      // تتبع جميع الطلبات
      await trackEvent(env, {
        type: 'api_request',
        endpoint: url.pathname,
        method: request.method,
        timestamp: Date.now()
      });

      // توجيه الطلبات إلى العمال المناسبين
      if (path[0] === 'api' && path[1] === 'leaderboard') {
        return handleLeaderboardRequest(request, env, path);
      }
      
      if (path[0] === 'api' && path[1] === 'auth') {
        return handleAuthRequest(request, env, path);
      }
      
      if (path[0] === 'api' && path[1] === 'achievements') {
        return handleAchievementsRequest(request, env, path);
      }
      
      if (path[0] === 'api' && path[1] === 'rewards') {
        return handleDailyRewardsRequest(request, env, path);
      }
      
      if (path[0] === 'api' && path[1] === 'multiplayer') {
        return handleMultiplayerRequest(request, env, path);
      }
      
      if (path[0] === 'api' && path[1] === 'ads') {
        if (path[2] === 'view') {
          return trackAdView(request, env);
        }
        if (path[2] === 'reward') {
          return trackAdReward(request, env);
        }
      }

      // نقطة نهاية غير معروفة
      return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
        status: 404,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json',
        },
      });
      
    } catch (error) {
      console.error('API Error:', error);
      await trackEvent(env, {
        type: 'api_error',
        endpoint: url.pathname,
        error: error.message,
        timestamp: Date.now()
      });
      
      return new Response(JSON.stringify({ 
        error: 'Internal Server Error',
        details: error.message 
      }), {
        status: 500,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json',
        },
      });
    }
  }
};
