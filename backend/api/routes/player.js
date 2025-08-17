/**
 * مسارات إدارة بيانات اللاعب
 * - تسجيل الدخول/التسجيل
 * - الملف الشخصي
 * - الإعدادات
 */

import { validatePlayerData } from '../utils/validators.js';
import { encryptToken, verifyToken } from '../utils/encryption.js';
import { getDBConnection } from '../utils/database.js';

// تسجيل لاعب جديد
export const registerPlayer = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // التحقق من صحة المدخلات
    const validation = validatePlayerData({ name, email, password }, 'register');
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: 'بيانات غير صالحة', 
        details: validation.errors 
      });
    }
    
    const db = await getDBConnection();
    
    // التحقق من وجود البريد الإلكتروني مسبقاً
    const existingPlayer = await db.prepare(
      'SELECT * FROM players WHERE email = ?'
    ).bind(email).first();
    
    if (existingPlayer) {
      return res.status(409).json({ 
        error: 'البريد الإلكتروني مستخدم مسبقاً' 
      });
    }
    
    // إنشاء لاعب جديد
    const createdAt = new Date().toISOString();
    const token = encryptToken({ email });
    
    await db.prepare(`
      INSERT INTO players (name, email, password, token, created_at, last_login)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      name,
      email,
      password, // في الإنتاج: استخدم تشفيراً قوياً
      token,
      createdAt,
      createdAt
    ).run();
    
    // جلب بيانات اللاعب بعد الإنشاء
    const player = await db.prepare(
      'SELECT id, name, email, avatar, best_score, crystals FROM players WHERE email = ?'
    ).bind(email).first();
    
    res.status(201).json({
      player,
      token,
      message: 'تم إنشاء الحساب بنجاح'
    });
    
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      error: 'فشل في إنشاء الحساب',
      details: error.message 
    });
  }
};

// تسجيل الدخول
export const loginPlayer = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // التحقق من صحة المدخلات
    const validation = validatePlayerData({ email, password }, 'login');
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: 'بيانات غير صالحة', 
        details: validation.errors 
      });
    }
    
    const db = await getDBConnection();
    
    // التحقق من وجود اللاعب
    const player = await db.prepare(
      'SELECT * FROM players WHERE email = ?'
    ).bind(email).first();
    
    if (!player || player.password !== password) {
      return res.status(401).json({ 
        error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' 
      });
    }
    
    // تحديث وقت الدخول الأخير
    const lastLogin = new Date().toISOString();
    await db.prepare(
      'UPDATE players SET last_login = ? WHERE id = ?'
    ).bind(lastLogin, player.id).run();
    
    // إنشاء رمز مميز جديد
    const token = encryptToken({ id: player.id, email: player.email });
    
    res.json({
      player: {
        id: player.id,
        name: player.name,
        email: player.email,
        avatar: player.avatar,
        best_score: player.best_score,
        crystals: player.crystals
      },
      token,
      message: 'تم تسجيل الدخول بنجاح'
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'فشل في تسجيل الدخول',
      details: error.message 
    });
  }
};

// جلب الملف الشخصي
export const getPlayerProfile = async (req, res) => {
  try {
    const { playerId } = req.params;
    const db = await getDBConnection();
    
    const player = await db.prepare(`
      SELECT id, name, email, avatar, best_score, crystals, 
             daily_reward_day, last_daily_reward, achievements
      FROM players 
      WHERE id = ?
    `).bind(playerId).first();
    
    if (!player) {
      return res.status(404).json({ error: 'اللاعب غير موجود' });
    }
    
    // تحويل إنجازات اللاعب إلى مصفوفة
    const achievements = player.achievements 
      ? JSON.parse(player.achievements) 
      : [];
    
    res.json({
      ...player,
      achievements
    });
    
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ 
      error: 'فشل في جلب الملف الشخصي',
      details: error.message 
    });
  }
};

// تحديث الملف الشخصي
export const updatePlayerProfile = async (req, res) => {
  try {
    const { playerId } = req.params;
    const updates = req.body;
    const db = await getDBConnection();
    
    // التحقق من صحة التحديثات
    const validation = validatePlayerData(updates, 'update');
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: 'بيانات غير صالحة', 
        details: validation.errors 
      });
    }
    
    // جلب البيانات الحالية
    const player = await db.prepare(
      'SELECT * FROM players WHERE id = ?'
    ).bind(playerId).first();
    
    if (!player) {
      return res.status(404).json({ error: 'اللاعب غير موجود' });
    }
    
    // تحديث البيانات
    const updateFields = [];
    const updateValues = [];
    
    if (updates.name && updates.name !== player.name) {
      updateFields.push('name = ?');
      updateValues.push(updates.name);
    }
    
    if (updates.avatar && updates.avatar !== player.avatar) {
      updateFields.push('avatar = ?');
      updateValues.push(updates.avatar);
    }
    
    if (updates.bestScore && updates.bestScore > player.best_score) {
      updateFields.push('best_score = ?');
      updateValues.push(updates.bestScore);
    }
    
    if (updates.crystals) {
      updateFields.push('crystals = ?');
      updateValues.push(player.crystals + updates.crystals);
    }
    
    if (updateFields.length === 0) {
      return res.json({ message: 'لا توجد تحديثات جديدة' });
    }
    
    // إضافة معرف اللاعب إلى القيم
    updateValues.push(playerId);
    
    // تنفيذ التحديث
    await db.prepare(`
      UPDATE players 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `).bind(...updateValues).run();
    
    // جلب البيانات المحدثة
    const updatedPlayer = await db.prepare(`
      SELECT id, name, email, avatar, best_score, crystals
      FROM players 
      WHERE id = ?
    `).bind(playerId).first();
    
    res.json({
      player: updatedPlayer,
      message: 'تم تحديث الملف الشخصي بنجاح'
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      error: 'فشل في تحديث الملف الشخصي',
      details: error.message 
    });
  }
};

// تعيين مسارات اللاعب
export const setupPlayerRoutes = (app) => {
  app.post('/api/player/register', registerPlayer);
  app.post('/api/player/login', loginPlayer);
  app.get('/api/player/:playerId', getPlayerProfile);
  app.put('/api/player/:playerId', updatePlayerProfile);
};
