/**
 * وسائط إعدادات CORS
 * - تمكين الطلبات عبر المواقع
 * - تحديد المواقع المسموح بها
 */

// المواقع المسموح بها
const ALLOWED_ORIGINS = [
  'https://time-jump-game.pages.dev',
  'http://localhost:3000',
  'https://your-production-domain.com'
];

// الرؤوس المسموح بها
const ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'X-Requested-With',
  'Accept'
];

// الطرق المسموح بها
const ALLOWED_METHODS = [
  'GET',
  'POST',
  'PUT',
  'DELETE',
  'OPTIONS'
];

export const cors = (req, res, next) => {
  const origin = req.headers.origin;
  
  // تعيين رؤوس CORS
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // التحقق من الموقع الأصلي
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    // للسماح بجميع المواقع في التطوير
    if (process.env.NODE_ENV === 'development') {
      res.header('Access-Control-Allow-Origin', '*');
    }
  }
  
  res.header('Access-Control-Allow-Methods', ALLOWED_METHODS.join(', '));
  res.header('Access-Control-Allow-Headers', ALLOWED_HEADERS.join(', '));
  
  // معالجة طلبات OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
};

// دالة لتنظيف رؤوس CORS غير الضرورية
export const sanitizeCORSHeaders = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(body) {
    // إزالة رؤوس CORS من الاستجابة النهائية
    // (في بعض البيئات، قد تضيف Cloudflare رؤوس CORS الخاصة بها)
    if (res.get('Access-Control-Allow-Origin') === '*') {
      res.removeHeader('Access-Control-Allow-Credentials');
    }
    
    return originalSend.call(this, body);
  };
  
  next();
};
