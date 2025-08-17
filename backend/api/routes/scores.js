/**
 * مسارات إدارة النقاط والنتائج
 * - لوحة المتصدرين
 * - إرسال النتائج
 * - سجل الألعاب
 */

import { getDBConnection } from '../utils/database.js';

// جلب لوحة المتصدرين
export const getLeaderboard = async (req, res) => {
  try {
    const db = await getDBConnection();
    
    // جلب أعلى 50 لاعباً
    const players = await db.prepare(`
      SELECT id, name, avatar, best_score 
      FROM players 
      ORDER BY best_score DESC 
      LIMIT 50
    `).all();
    
    res.json(players.results || []);
    
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ 
      error: 'فشل في جلب لوحة المتصدرين',
      details: error.message 
    });
  }
};

// إرسال نتيجة جديدة
export const submitScore = async (req, res) => {
  try {
    const { playerId } = req.params;
    const { score, crystals, time } = req.body;
    
    const db = await getDBConnection();
    
    // التحقق من وجود اللاعب
    const player = await db.prepare(
      'SELECT * FROM players WHERE id = ?'
    ).bind(playerId).first();
    
    if (!player) {
      return res.status(404).json({ error: 'اللاعب غير موجود' });
    }
    
    // تحديث أفضل نتيجة
    if (score > player.best_score) {
      await db.prepare(
        'UPDATE players SET best_score = ? WHERE id = ?'
      ).bind(score, playerId).run();
    }
    
    // تحديث الكريستالات
    const newCrystals = (player.crystals || 0) + (crystals || 0);
    await db.prepare(
      'UPDATE players SET crystals = ? WHERE id = ?'
    ).bind(newCrystals, playerId).run();
    
    // حفظ اللعبة في السجل
    const playedAt = new Date().toISOString();
    await db.prepare(`
      INSERT INTO game_sessions (player_id, score, crystals, time, played_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(playerId, score, crystals, time, playedAt).run();
    
    // تحديث إنجازات اللاعب
    await updatePlayerAchievements(db, playerId, score, crystals);
    
    res.json({
      bestScore: Math.max(score, player.best_score),
      crystals: newCrystals,
      message: 'تم حفظ النتيجة بنجاح'
    });
    
  } catch (error) {
    console.error('Score submission error:', error);
    res.status(500).json({ 
      error: 'فشل في حفظ النتيجة',
      details: error.message 
    });
  }
};

// جلب سجل الألعاب السابقة
export const getPlayerHistory = async (req, res) => {
  try {
    const { playerId } = req.params;
    const db = await getDBConnection();
    
    // التحقق من وجود اللاعب
    const player = await db.prepare(
      'SELECT id FROM players WHERE id = ?'
    ).bind(playerId).first();
    
    if (!player) {
      return res.status(404).json({ error: 'اللاعب غير موجود' });
    }
    
    // جلب آخر 10 جلسات لعب
    const sessions = await db.prepare(`
      SELECT id, score, crystals, time, played_at 
      FROM game_sessions 
      WHERE player_id = ? 
      ORDER BY played_at DESC 
      LIMIT 10
    `).bind(playerId).all();
    
    res.json(sessions.results || []);
    
  } catch (error) {
    console.error('Game history error:', error);
    res.status(500).json({ 
      error: 'فشل في جلب سجل الألعاب',
      details: error.message 
    });
  }
};

// تحديث إنجازات اللاعب
async function updatePlayerAchievements(db, playerId, score, crystals) {
  // قائمة الإنجازات
  const achievements = [
    { id: 'newbie', threshold: 500, reward: 50 },
    { id: 'speedster', threshold: 2500, reward: 200 },
    { id: 'master', threshold: 5000, reward: 500 }
  ];
  
  // جلب إنجازات اللاعب الحالية
  const player = await db.prepare(
    'SELECT achievements FROM players WHERE id = ?'
  ).bind(playerId).first();
  
  let currentAchievements = player.achievements 
    ? JSON.parse(player.achievements) 
    : [];
  
  let newCrystals = 0;
  
  // التحقق من الإنجازات الجديدة
  for (const achievement of achievements) {
    if (!currentAchievements.includes(achievement.id) && score >= achievement.threshold) {
      currentAchievements.push(achievement.id);
      newCrystals += achievement.reward;
    }
  }
  
  // تحديث الكريستالات إذا كانت هناك إنجازات جديدة
  if (newCrystals > 0) {
    await db.prepare(`
      UPDATE players 
      SET achievements = ?, crystals = crystals + ?
      WHERE id = ?
    `).bind(
      JSON.stringify(currentAchievements),
      newCrystals,
      playerId
    ).run();
  }
}

// تعيين مسارات النقاط
export const setupScoreRoutes = (app) => {
  app.get('/api/scores/leaderboard', getLeaderboard);
  app.post('/api/scores/submit/:playerId', submitScore);
  app.get('/api/scores/history/:playerId', getPlayerHistory);
};
