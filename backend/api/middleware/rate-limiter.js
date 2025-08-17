/**
 * وسائط تحديد معدل الطلبات
 * - منع الاستخدام المفرط
 * - حماية من هجمات DDoS
 */

import { getDBConnection } from '../utils/database.js';

// تكوينات معدل الطلبات
const RATE_LIMIT_CONFIG = {
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  maxRequests: 100,         // 100 طلب في النافذة
  keyPrefix: 'rl:'
};

// تخزين العدادات مؤقتاً
const requestCounts = new Map();

// دالة لتنظيف العدادات القديمة
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestCounts.entries()) {
    if (now - value.timestamp > RATE_LIMIT_CONFIG.windowMs) {
      requestCounts.delete(key);
    }
  }
}, 60000); // كل دقيقة

export const rateLimiter = async (req, res, next) => {
  try {
    // تحديد مفتاح التقييد (بناءً على IP والمسار)
    const ip = req.headers['cf-connecting-ip'] || 
              req.ip || 
              'unknown';
    const path = req.path;
    const key = `${RATE_LIMIT_CONFIG.keyPrefix}${ip}:${path}`;
    
    // استخدام D1 لتخزين العدادات (أكثر موثوقية)
    const db = await getDBConnection();
    
    // جلب العداد الحالي
    let countRecord = await db.prepare(
      'SELECT count, timestamp FROM rate_limits WHERE key = ?'
    ).bind(key).first();
    
    const now = Date.now();
    
    if (!countRecord) {
      // إنشاء سجل جديد
      await db.prepare(`
        INSERT INTO rate_limits (key, count, timestamp)
        VALUES (?, 1, ?)
      `).bind(key, now).run();
      
      return next();
    }
    
    // التحقق من نافذة الوقت
    const timePassed = now - countRecord.timestamp;
    
    if (timePassed > RATE_LIMIT_CONFIG.windowMs) {
      // إعادة تعيين العداد
      await db.prepare(`
        UPDATE rate_limits 
        SET count = 1, timestamp = ?
        WHERE key = ?
      `).bind(now, key).run();
      
      return next();
    }
    
    // التحقق من تجاوز الحد
    if (countRecord.count >= RATE_LIMIT_CONFIG.maxRequests) {
      return res.status(429).json({
        error: 'تم تجاوز الحد الأقصى للطلبات',
        details: `يرجى الانتظار ${Math.ceil((RATE_LIMIT_CONFIG.windowMs - timePassed) / 1000)} ثانية قبل المحاولة مرة أخرى`
      });
    }
    
    // زيادة العداد
    await db.prepare(`
      UPDATE rate_limits 
      SET count = count + 1 
      WHERE key = ?
    `).bind(key).run();
    
    next();
    
  } catch (error) {
    console.error('Rate limiting error:', error);
    // في حالة فشل التقييد، نسمح بالطلب لتجنب حظر المستخدمين
    next();
  }
};

// تكوين معدل طلبات مخصص لـ API الحساسة
export const sensitiveRateLimiter = (windowMs = 5 * 60 * 1000, maxRequests = 20) => {
  return async (req, res, next) => {
    try {
      const ip = req.headers['cf-connecting-ip'] || req.ip || 'unknown';
      const path = req.path;
      const key = `sensitive:${ip}:${path}`;
      
      const db = await getDBConnection();
      
      let countRecord = await db.prepare(
        'SELECT count, timestamp FROM rate_limits WHERE key = ?'
      ).bind(key).first();
      
      const now = Date.now();
      
      if (!countRecord) {
        await db.prepare(`
          INSERT INTO rate_limits (key, count, timestamp)
          VALUES (?, 1, ?)
        `).bind(key, now).run();
        
        return next();
      }
      
      const timePassed = now - countRecord.timestamp;
      
      if (timePassed > windowMs) {
        await db.prepare(`
          UPDATE rate_limits 
          SET count = 1, timestamp = ?
          WHERE key = ?
        `).bind(now, key).run();
        
        return next();
      }
      
      if (countRecord.count >= maxRequests) {
        return res.status(429).json({
          error: 'تم تجاوز الحد الأقصى للطلبات الحساسة',
          details: `يرجى الانتظار ${Math.ceil((windowMs - timePassed) / 1000)} ثانية قبل المحاولة مرة أخرى`
        });
      }
      
      await db.prepare(`
        UPDATE rate_limits 
        SET count = count + 1 
        WHERE key = ?
      `).bind(key).run();
      
      next();
      
    } catch (error) {
      console.error('Sensitive rate limiting error:', error);
      next();
    }
  };
};
