/**
 * وسائط التحقق من الهوية
 * - التحقق من رموز المصادقة
 * - التأكد من صلاحية المستخدم
 */

import { verifyToken } from '../utils/encryption.js';

// وسطاء التحقق من الهوية
export const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      error: 'مصادقة مطلوبة',
      details: 'يرجى تسجيل الدخول للوصول إلى هذه الميزة'
    });
  }
  
  try {
    const payload = verifyToken(token);
    
    // تعيين معرف اللاعب في الطلب
    req.playerId = payload.id || payload.email;
    req.player = payload;
    
    next();
  } catch (error) {
    return res.status(403).json({ 
      error: 'رمز مصادقة غير صالح',
      details: 'يرجى تسجيل الدخول مرة أخرى'
    });
  }
};

// وسطاء التحقق من الصلاحيات
export const authorize = (roles = []) => {
  return (req, res, next) => {
    if (roles.length === 0) {
      return next(); // لا تطلب صلاحيات محددة
    }
    
    // في هذه اللعبة، لن نستخدم أدواراً معقدة
    // يمكن توسيع هذا في المستقبل
    next();
  };
};

// وسطاء التحقق من ملكية الموارد
export const checkResourceOwnership = (resourceParam = 'playerId') => {
  return (req, res, next) => {
    const requestedId = req.params[resourceParam];
    
    if (!requestedId) {
      return res.status(400).json({ 
        error: 'معرف المورد مطلوب',
        details: `المعلمة ${resourceParam} مفقودة`
      });
    }
    
    // التحقق من أن اللاعب يطلب موارده الخاصة
    if (req.playerId !== requestedId) {
      return res.status(403).json({ 
        error: 'وصول غير مصرح به',
        details: 'لا يمكنك الوصول إلى موارد لاعب آخر'
      });
    }
    
    next();
  };
};
