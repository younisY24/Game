/**
 * أدوات التشفير
 * - تشفير البيانات الحساسة
 * - إنشاء وتحقق من الرموز المميزة
 */

import { createHash, randomBytes } from 'https://deno.land/std/crypto/mod.ts';

// مفتاح التشفير (يجب أن يكون سرياً)
const SECRET_KEY = process.env.SECRET_KEY || 
                  randomBytes(32).toString('hex');

// خوارزمية التشفير
const ALGORITHM = 'SHA-256';

// إنشاء رمز مميز
export const encryptToken = (payload) => {
  try {
    const timestamp = Date.now();
    const data = JSON.stringify({ ...payload, timestamp });
    
    // إنشاء توقيع
    const signature = createHMAC(data);
    
    // تجميع الرمز
    const token = `${btoa(data)}.${signature}`;
    
    return token;
  } catch (error) {
    console.error('Token encryption error:', error);
    throw new Error('فشل في إنشاء الرمز المميز');
  }
};

// التحقق من الرمز المميز
export const verifyToken = (token) => {
  try {
    const [encodedData, signature] = token.split('.');
    
    if (!encodedData || !signature) {
      throw new Error('تنسيق الرمز غير صحيح');
    }
    
    // فك تشفير البيانات
    const data = JSON.parse(atob(encodedData));
    
    // التحقق من التوقيع
    const expectedSignature = createHMAC(encodedData);
    if (signature !== expectedSignature) {
      throw new Error('التوقيع غير صالح');
    }
    
    // التحقق من صلاحية الرمز (ساعة واحدة)
    const age = Date.now() - data.timestamp;
    if (age > 60 * 60 * 1000) { // 1 ساعة
      throw new Error('الرمز منتهي الصلاحية');
    }
    
    return data;
  } catch (error) {
    console.error('Token verification error:', error);
    throw new Error('رمز مميز غير صالح');
  }
};

// تشفير كلمة المرور
export const hashPassword = (password) => {
  return createHash(ALGORITHM)
    .update(password + SECRET_KEY)
    .digest('hex');
};

// مقارنة كلمة المرور
export const verifyPassword = (password, hashedPassword) => {
  const hashed = hashPassword(password);
  return hashed === hashedPassword;
};

// إنشاء HMAC
function createHMAC(data) {
  return createHash(ALGORITHM)
    .update(data + SECRET_KEY)
    .digest('hex');
}

// توليد رمز عشوائي
export const generateRandomToken = (length = 32) => {
  return randomBytes(length)
    .toString('hex')
    .slice(0, length);
};

// تشفير البيانات الحساسة
export const encryptData = (data) => {
  // في نظام حقيقي، استخدم تشفيراً قوياً مثل AES
  // هنا نستخدم تشفيراً بسيطاً للتوضيح
  const buffer = Buffer.from(JSON.stringify(data));
  return buffer.toString('base64');
};

// فك تشفير البيانات
export const decryptData = (encryptedData) => {
  const buffer = Buffer.from(encryptedData, 'base64');
  return JSON.parse(buffer.toString('utf-8'));
};
