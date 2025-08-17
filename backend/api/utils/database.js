/**
 * أدوات اتصال قاعدة البيانات
 * - إدارة الاتصالات
 * - استعلامات مساعدة
 */

import { createClient } from 'https://cdn.skypack.dev/@libsql/client';

// تكوين قاعدة البيانات
const DB_CONFIG = {
  url: process.env.DB_URL || 'file:game.db',
  authToken: process.env.DB_AUTH_TOKEN
};

let dbClient = null;

// الحصول على اتصال بقاعدة البيانات
export const getDBConnection = async () => {
  try {
    if (!dbClient) {
      dbClient = createClient({
        url: DB_CONFIG.url,
        authToken: DB_CONFIG.authToken
      });
      
      // تهيئة قاعدة البيانات إذا كانت جديدة
      await initializeDatabase(dbClient);
    }
    
    return dbClient;
  } catch (error) {
    console.error('Database connection error:', error);
    throw new Error('فشل في الاتصال بقاعدة البيانات');
  }
};

// تهيئة قاعدة البيانات
async function initializeDatabase(db) {
  try {
    // إنشاء جدول اللاعبين
    await db.execute(`
      CREATE TABLE IF NOT EXISTS players (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        password TEXT NOT NULL,
        token TEXT NOT NULL,
        avatar TEXT DEFAULT 'default.png',
        best_score INTEGER DEFAULT 0,
        crystals INTEGER DEFAULT 0,
        daily_reward_day INTEGER DEFAULT 1,
        last_daily_reward TEXT,
        achievements TEXT DEFAULT '[]',
        ad_views INTEGER DEFAULT 0,
        time_freeze_uses INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        last_login TEXT NOT NULL
      )
    `);
    
    // إنشاء جدول جلسات اللعب
    await db.execute(`
      CREATE TABLE IF NOT EXISTS game_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id TEXT NOT NULL,
        score INTEGER NOT NULL,
        crystals INTEGER NOT NULL,
        time INTEGER NOT NULL,
        played_at TEXT NOT NULL,
        FOREIGN KEY (player_id) REFERENCES players (id)
      )
    `);
    
    // إنشاء جدول جلسات اللعب الأونلاين
    await db.execute(`
      CREATE TABLE IF NOT EXISTS multiplayer_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id TEXT NOT NULL,
        player_id TEXT NOT NULL,
        score INTEGER NOT NULL,
        ended_at TEXT NOT NULL,
        FOREIGN KEY (player_id) REFERENCES players (id)
      )
    `);
    
    // إنشاء جدول لتقييد المعدل
    await db.execute(`
      CREATE TABLE IF NOT EXISTS rate_limits (
        key TEXT PRIMARY KEY,
        count INTEGER NOT NULL,
        timestamp INTEGER NOT NULL
      )
    `);
    
    // إنشاء جدول للتحليلات
    await db.execute(`
      CREATE TABLE IF NOT EXISTS analytics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// تنظيف الاتصال عند الإغلاق
export const closeDBConnection = async () => {
  if (dbClient) {
    await dbClient.close();
    dbClient = null;
  }
};

// وظيفة لاستعلامات الدُفعات
export const batchQueries = async (queries) => {
  const db = await getDBConnection();
  const results = [];
  
  for (const query of queries) {
    try {
      const result = await db.execute(query.sql, query.params);
      results.push({ success: true,  result });
    } catch (error) {
      results.push({ 
        success: false, 
        error: error.message,
        query: query.sql 
      });
    }
  }
  
  return results;
};
