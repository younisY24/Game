/**
 * معالج مصادقة اللاعبين
 * - تسجيل الدخول
 * - إنشاء حساب
 * - إدارة الملف الشخصي
 */

import { v4 as uuidv4 } from 'uuid';

// أسماء الصور الافتراضية
const DEFAULT_AVATARS = [
  'avatar1.png',
  'avatar2.png',
  'avatar3.png',
  'avatar4.png',
  'avatar5.png'
];

export async function handleAuthRequest(request, env, path) {
  const method = request.method;
  const url = new URL(request.url);
  
  // التحقق من رأس المصادقة
  const authHeader = request.headers.get('Authorization');
  let playerId = null;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    playerId = authHeader.substring(7);
  }
  
  // إنشاء حساب جديد
  if (method === 'POST' && path[2] === 'register') {
    return registerPlayer(request, env);
  }
  
  // تحديث الملف الشخصي
  if (method === 'PUT' && path[2] === 'profile' && playerId) {
    return updateProfile(request, env, playerId);
  }
  
  // جلب الملف الشخصي
  if (method === 'GET' && path[2] === 'profile' && playerId) {
    return getProfile(request, env, playerId);
  }
  
  return new Response(JSON.stringify({ error: 'Invalid auth request' }), {
    status: 400,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
  });
}

async function registerPlayer(request, env) {
  try {
    const { name } = await request.json();
    
    // التحقق من صحة المدخلات
    if (!name || name.length < 3 || name.length > 20) {
      return new Response(JSON.stringify({ 
        error: 'اسم غير صالح', 
        details: 'يجب أن يكون الاسم بين 3 و20 حرفاً' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // توليد معرف لاعب فريد
    const playerId = uuidv4();
    
    // إنشاء ملف لاعب افتراضي
    const playerData = {
      id: playerId,
      name: name,
      createdAt: Date.now(),
      lastLogin: Date.now(),
      bestScore: 0,
      crystals: 0,
      avatar: DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)],
      achievements: [],
      dailyRewardDay: 1,
      lastDailyReward: null
    };
    
    // حفظ البيانات في KV
    await env.PLAYERS.put(playerId, JSON.stringify(playerData));
    
    // إنشاء رمز مصادقة
    const token = btoa(`${playerId}:${Date.now()}`);
    
    return new Response(JSON.stringify({ 
      playerId: playerId,
      token: token,
      profile: playerData
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'فشل في تسجيل الحساب',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function getProfile(request, env, playerId) {
  try {
    const playerData = await env.PLAYERS.get(playerId);
    
    if (!playerData) {
      return new Response(JSON.stringify({ error: 'اللاعب غير موجود' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const profile = JSON.parse(playerData);
    
    // تحديث وقت الدخول الأخير
    profile.lastLogin = Date.now();
    await env.PLAYERS.put(playerId, JSON.stringify(profile));
    
    return new Response(JSON.stringify(profile), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'فشل في جلب الملف الشخصي',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function updateProfile(request, env, playerId) {
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
    
    // تحديث الاسم إذا تم توفيره
    if (updates.name && updates.name.length >= 3 && updates.name.length <= 20) {
      profile.name = updates.name;
    }
    
    // تحديث الصورة إذا تم توفيرها
    if (updates.avatar && DEFAULT_AVATARS.includes(updates.avatar)) {
      profile.avatar = updates.avatar;
    }
    
    // حفظ التحديثات
    await env.PLAYERS.put(playerId, JSON.stringify(profile));
    
    return new Response(JSON.stringify(profile), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'فشل في تحديث الملف',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
