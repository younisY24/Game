/**
 * مسارات الوضع الأونلاين
 * - إنشاء غرف اللعب
 * - مزامنة النقاط
 * - إدارة الجلسات
 */

import { v4 as uuidv4 } from 'uuid';
import { getDBConnection } from '../utils/database.js';

// تخزين الغرف النشطة في الذاكرة
const activeRooms = new Map();

// إنشاء غرفة لعب جديدة
export const createRoom = async (req, res) => {
  try {
    const { playerId, maxPlayers = 2 } = req.body;
    
    // التحقق من صحة المدخلات
    if (!playerId) {
      return res.status(400).json({ error: 'معرف اللاعب مطلوب' });
    }
    
    if (maxPlayers < 2 || maxPlayers > 4) {
      return res.status(400).json({ 
        error: 'عدد اللاعبين غير صالح', 
        details: 'يجب أن يكون بين 2 و4' 
      });
    }
    
    // إنشاء معرف غرفة فريد
    const roomId = uuidv4().substring(0, 8).toUpperCase();
    
    // إنشاء الغرفة
    activeRooms.set(roomId, {
      id: roomId,
      hostId: playerId,
      players: [{
        id: playerId,
        ready: false,
        score: 0
      }],
      maxPlayers: maxPlayers,
      status: 'waiting',
      createdAt: Date.now()
    });
    
    res.status(201).json({
      roomId,
      room: activeRooms.get(roomId)
    });
    
  } catch (error) {
    console.error('Room creation error:', error);
    res.status(500).json({ 
      error: 'فشل في إنشاء الغرفة',
      details: error.message 
    });
  }
};

// الانضمام إلى غرفة موجودة
export const joinRoom = async (req, res) => {
  try {
    const { roomId, playerId } = req.body;
    
    // التحقق من صحة المدخلات
    if (!roomId || !playerId) {
      return res.status(400).json({ error: 'بيانات غير كافية' });
    }
    
    // التحقق من وجود الغرفة
    if (!activeRooms.has(roomId)) {
      return res.status(404).json({ error: 'الغرفة غير موجودة' });
    }
    
    const room = activeRooms.get(roomId);
    
    // التحقق من اكتمال الغرفة
    if (room.players.length >= room.maxPlayers) {
      return res.status(400).json({ error: 'الغرفة ممتلئة' });
    }
    
    // التحقق من وجود اللاعب مسبقاً
    if (room.players.some(p => p.id === playerId)) {
      return res.status(400).json({ error: 'اللاعب موجود مسبقاً في الغرفة' });
    }
    
    // إضافة اللاعب إلى الغرفة
    room.players.push({
      id: playerId,
      ready: false,
      score: 0
    });
    
    // إذا اكتمل العدد، غيّر الحالة إلى جاهز
    if (room.players.length === room.maxPlayers) {
      room.status = 'ready';
    }
    
    res.json({
      roomId,
      room
    });
    
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({ 
      error: 'فشل في الانضمام إلى الغرفة',
      details: error.message 
    });
  }
};

// مزامنة النقاط أثناء اللعب
export const syncScores = async (req, res) => {
  try {
    const { roomId, playerId, score } = req.body;
    
    // التحقق من صحة المدخلات
    if (!roomId || !playerId || score === undefined) {
      return res.status(400).json({ error: 'بيانات غير كافية' });
    }
    
    // التحقق من وجود الغرفة
    if (!activeRooms.has(roomId)) {
      return res.status(404).json({ error: 'الغرفة غير موجودة' });
    }
    
    const room = activeRooms.get(roomId);
    
    // التحقق من وجود اللاعب في الغرفة
    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      return res.status(404).json({ error: 'اللاعب غير موجود في الغرفة' });
    }
    
    // تحديث نقاط اللاعب
    room.players[playerIndex].score = score;
    
    // إذا اكتملت النقاط، احسب النتيجة النهائية
    let gameEnded = false;
    let winnerId = null;
    
    if (room.players.every(p => p.score > 0)) {
      gameEnded = true;
      const winner = room.players.reduce((prev, current) => 
        (prev.score > current.score) ? prev : current
      );
      winnerId = winner.id;
    }
    
    res.json({
      roomId,
      scores: room.players.map(p => ({ id: p.id, score: p.score })),
      gameEnded,
      winnerId
    });
    
  } catch (error) {
    console.error('Score sync error:', error);
    res.status(500).json({ 
      error: 'فشل في مزامنة النقاط',
      details: error.message 
    });
  }
};

// إنهاء جلسة اللعب
export const endMultiplayerSession = async (req, res) => {
  try {
    const { roomId, playerId } = req.body;
    
    // التحقق من صحة المدخلات
    if (!roomId || !playerId) {
      return res.status(400).json({ error: 'بيانات غير كافية' });
    }
    
    // التحقق من وجود الغرفة
    if (!activeRooms.has(roomId)) {
      return res.status(404).json({ error: 'الغرفة غير موجودة' });
    }
    
    const room = activeRooms.get(roomId);
    
    // التحقق من أن اللاعب هو المضيف
    if (room.hostId !== playerId) {
      return res.status(403).json({ error: 'غير مصرح لك بإنهاء الجلسة' });
    }
    
    // حفظ النتائج في قاعدة البيانات
    const db = await getDBConnection();
    
    for (const player of room.players) {
      await db.prepare(`
        INSERT INTO multiplayer_sessions (room_id, player_id, score, ended_at)
        VALUES (?, ?, ?, datetime('now'))
      `).bind(roomId, player.id, player.score).run();
      
      // تحديث أفضل نتيجة للاعب
      await db.prepare(`
        UPDATE players 
        SET best_score = MAX(best_score, ?)
        WHERE id = ?
      `).bind(player.score, player.id).run();
    }
    
    // إزالة الغرفة من الذاكرة
    activeRooms.delete(roomId);
    
    res.json({
      message: 'تم إنهاء الجلسة وحفظ النتائج',
      roomId
    });
    
  } catch (error) {
    console.error('Session end error:', error);
    res.status(500).json({ 
      error: 'فشل في إنهاء الجلسة',
      details: error.message 
    });
  }
};

// تعيين مسارات الوضع الأونلاين
export const setupMultiplayerRoutes = (app) => {
  app.post('/api/multiplayer/create', createRoom);
  app.post('/api/multiplayer/join', joinRoom);
  app.post('/api/multiplayer/sync', syncScores);
  app.post('/api/multiplayer/end', endMultiplayerSession);
};
