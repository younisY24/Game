/**
 * معالج الوضع الأونلاين
 * - إنشاء غرف
 * - إدارة الاتصالات
 * - مزامنة النقاط
 */

import { v4 as uuidv4 } from 'uuid';

// تخزين الغرف النشطة
const activeRooms = new Map();

export async function handleMultiplayerRequest(request, env, path) {
  const url = new URL(request.url);
  const method = request.method;
  
  // إنشاء غرفة جديدة
  if (method === 'POST' && path[2] === 'room') {
    return createRoom(request, env);
  }
  
  // الانضمام إلى غرفة
  if (method === 'POST' && path[2] === 'join') {
    return joinRoom(request, env);
  }
  
  // مزامنة النقاط
  if (method === 'POST' && path[2] === 'sync') {
    return syncScores(request, env);
  }
  
  // غرفة الويب سوكيت
  if (request.headers.get('Upgrade') === 'websocket') {
    return handleWebSocket(request, env, path);
  }
  
  return new Response(JSON.stringify({ error: 'Invalid multiplayer request' }), {
    status: 400,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
  });
}

function createRoom(request, env) {
  const roomId = uuidv4().substring(0, 8).toUpperCase();
  const maxPlayers = 2; // عدد اللاعبين في الغرفة
  
  // إنشاء الغرفة
  activeRooms.set(roomId, {
    id: roomId,
    players: [],
    maxPlayers: maxPlayers,
    createdAt: Date.now(),
    status: 'waiting'
  });
  
  return new Response(JSON.stringify({ 
    roomId: roomId,
    status: 'waiting',
    players: []
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

function joinRoom(request, env) {
  const { roomId, playerId } = await request.json();
  
  if (!roomId || !playerId) {
    return new Response(JSON.stringify({ error: 'بيانات غير كافية' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const room = activeRooms.get(roomId);
  if (!room) {
    return new Response(JSON.stringify({ error: 'الغرفة غير موجودة' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  if (room.players.length >= room.maxPlayers) {
    return new Response(JSON.stringify({ error: 'الغرفة ممتلئة' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // إضافة اللاعب إلى الغرفة
  room.players.push({
    id: playerId,
    score: 0,
    connected: true
  });
  
  // إذا اكتمل عدد اللاعبين، ابدأ المباراة
  if (room.players.length === room.maxPlayers) {
    room.status = 'active';
    room.startTime = Date.now();
  }
  
  return new Response(JSON.stringify(room), {
    headers: { 'Content-Type': 'application/json' }
  });
}

function syncScores(request, env) {
  const { roomId, playerId, score } = await request.json();
  
  const room = activeRooms.get(roomId);
  if (!room) {
    return new Response(JSON.stringify({ error: 'الغرفة غير موجودة' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // تحديث نقاط اللاعب
  const player = room.players.find(p => p.id === playerId);
  if (player) {
    player.score = score;
  }
  
  // إرسال التحديثات إلى جميع اللاعبين عبر الويب سوكيت
  if (room.webSockets) {
    room.webSockets.forEach(ws => {
      ws.send(JSON.stringify({
        type: 'scoreUpdate',
        playerId: playerId,
        score: score
      }));
    });
  }
  
  return new Response(JSON.stringify({
    success: true,
    roomId: roomId,
    scores: room.players.map(p => ({ id: p.id, score: p.score }))
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleWebSocket(request, env, path) {
  const url = new URL(request.url);
  const roomId = url.searchParams.get('room');
  
  if (!roomId || !activeRooms.has(roomId)) {
    return new Response('Room not found', { status: 404 });
  }
  
  const room = activeRooms.get(roomId);
  const [client, server] = Object.values(new WebSocketPair());
  
  // إعداد الاتصال
  server.accept();
  
  // إضافة الاتصال إلى الغرفة
  if (!room.webSockets) {
    room.webSockets = new Set();
  }
  room.webSockets.add(server);
  
  // إرسال حالة الغرفة الحالية
  server.send(JSON.stringify({
    type: 'roomState',
    status: room.status,
    players: room.players
  }));
  
  // معالجة الرسائل الواردة
  server.addEventListener('message', event => {
    try {
      const data = JSON.parse(event.data);
      
      if (data.type === 'playerReady') {
        // تحديث حالة اللاعب
        const player = room.players.find(p => p.id === data.playerId);
        if (player) {
          player.ready = true;
          
          // إذا كان الجميع جاهزين، ابدأ المباراة
          if (room.players.every(p => p.ready)) {
            room.status = 'active';
            room.startTime = Date.now();
            
            // إعلام الجميع ببدء المباراة
            room.webSockets.forEach(ws => {
              ws.send(JSON.stringify({ type: 'gameStart' }));
            });
          }
        }
      }
    } catch (e) {
      console.error('WebSocket message error:', e);
    }
  });
  
  // تنظيف عند الإغلاق
  server.addEventListener('close', () => {
    room.webSockets.delete(server);
    
    // إذا لم يتبقَ أي لاعبين، احذف الغرفة
    if (room.webSockets.size === 0) {
      activeRooms.delete(roomId);
    }
  });
  
  return new Response(null, {
    status: 101,
    webSocket: client,
  });
}
