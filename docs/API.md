# 🌐 وثائق واجهة برمجة التطبيقات (API)  
**الإصدار**: `v1` | **النطاق**: `https://api.timejump.cf`  

## 🔑 نقاط النهاية الأساسية  
| النقطة | الطريقة | الوصف | المثال |  
|---------|----------|--------|---------|  
| `/player/auth` | `POST` | تسجيل دخول/إنشاء حساب | `{ "playerId": "guest_123" }` |  
| `/game/score` | `PUT` | حفظ النتيجة مع التحقق من الغش | `{ "score": 150, "token": "xyz" }` |  
| `/leaderboard/global` | `GET` | جلب المتصدرين (مع تصفية الوقت) | `?period=daily&limit=50` |  
| `/powerups/activate` | `POST` | تفعيل قدرة زمنية (يُحقَّق صحتها في Workers) | `{ "type": "time-freeze", "playerId": "123" }` |  

## ⚠️ سياسات الأمان  
- جميع الطلبات **مُشفَّرة بـ JWT** عبر `middleware/auth.js`.  
- الحد الأقصى لطلبات الـ API: **30 طلب/دقيقة** (Rate Limiting).  
