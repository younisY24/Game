/**
 * أدوات التحقق من البيانات
 * - التأكد من صحة المدخلات
 * - منع البيانات غير الصحيحة
 */

// التحقق من صحة البريد الإلكتروني
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

// التحقق من صحة الاسم
const validateName = (name) => {
  return name && name.length >= 3 && name.length <= 20;
};

// التحقق من صحة كلمة المرور
const validatePassword = (password) => {
  // يجب أن تكون كلمة المرور 8 أحرف على الأقل
  return password && password.length >= 8;
};

// التحقق من صحة المدخلات حسب النوع
export const validatePlayerData = (data, type) => {
  const errors = [];
  
  switch (type) {
    case 'register':
      if (!validateName(data.name)) {
        errors.push({
          field: 'name',
          message: 'يجب أن يكون الاسم بين 3 و20 حرفاً'
        });
      }
      
      if (!validateEmail(data.email)) {
        errors.push({
          field: 'email',
          message: 'البريد الإلكتروني غير صالح'
        });
      }
      
      if (!validatePassword(data.password)) {
        errors.push({
          field: 'password',
          message: 'يجب أن تكون كلمة المرور 8 أحرف على الأقل'
        });
      }
      break;
      
    case 'login':
      if (!validateEmail(data.email)) {
        errors.push({
          field: 'email',
          message: 'البريد الإلكتروني غير صالح'
        });
      }
      
      if (!data.password) {
        errors.push({
          field: 'password',
          message: 'كلمة المرور مطلوبة'
        });
      }
      break;
      
    case 'update':
      if (data.name && !validateName(data.name)) {
        errors.push({
          field: 'name',
          message: 'يجب أن يكون الاسم بين 3 و20 حرفاً'
        });
      }
      
      if (data.email && !validateEmail(data.email)) {
        errors.push({
          field: 'email',
          message: 'البريد الإلكتروني غير صالح'
        });
      }
      
      if (data.password && !validatePassword(data.password)) {
        errors.push({
          field: 'password',
          message: 'يجب أن تكون كلمة المرور 8 أحرف على الأقل'
        });
      }
      break;
      
    default:
      errors.push({
        field: 'type',
        message: 'نوع التحقق غير معروف'
      });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// التحقق من صحة النتيجة
export const validateScore = (score) => {
  return {
    isValid: typeof score === 'number' && score >= 0,
    error: score < 0 ? 'النتيجة لا يمكن أن تكون سلبية' : null
  };
};

// التحقق من صحة الكريستالات
export const validateCrystals = (crystals) => {
  return {
    isValid: typeof crystals === 'number' && crystals >= 0,
    error: crystals < 0 ? 'عدد الكريستالات لا يمكن أن يكون سلبياً' : null
  };
};

// التحقق من صحة وقت اللعب
export const validateTime = (time) => {
  return {
    isValid: typeof time === 'number' && time >= 0,
    error: time < 0 ? 'الوقت لا يمكن أن يكون سلبياً' : null
  };
};

// التحقق من صحة الإعدادات
export const validateSettings = (settings) => {
  const errors = [];
  
  if (settings.musicVolume !== undefined && 
      (settings.musicVolume < 0 || settings.musicVolume > 100)) {
    errors.push({
      field: 'musicVolume',
      message: 'مستوى الصوت يجب أن يكون بين 0 و100'
    });
  }
  
  if (settings.soundEffectsVolume !== undefined && 
      (settings.soundEffectsVolume < 0 || settings.soundEffectsVolume > 100)) {
    errors.push({
      field: 'soundEffectsVolume',
      message: 'مستوى تأثيرات الصوت يجب أن يكون بين 0 و100'
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
