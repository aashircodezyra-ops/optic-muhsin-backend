const translations = {
  en: {
    // Auth
    'auth.register.success': 'Registration successful',
    'auth.login.success': 'Login successful',
    'auth.login.invalid': 'Invalid email or password',
    'auth.token.invalid': 'Invalid or expired token',
    'auth.unauthorized': 'Unauthorized access',
    
    // VIP
    'vip.required': 'VIP membership required',
    'vip.expired': 'Your VIP membership has expired',
    'vip.payment.success': 'VIP membership activated successfully',
    'vip.payment.failed': 'Payment failed',
    
    // Predictions
    'prediction.created': 'Prediction created successfully',
    'vip.required.create': 'VIP membership required to create predictions',
    'prediction.limit.reached': 'Daily prediction limit reached',
    'prediction.not.found': 'Prediction not found',
    'prediction.updated': 'Prediction updated successfully',
    'prediction.deleted': 'Prediction deleted successfully',
    
    // Comments
    'comment.created': 'Comment posted successfully',
    'comment.not.found': 'Comment not found',
    'comment.deleted': 'Comment deleted successfully',
    'comment.spam': 'Please wait before posting another comment',
    
    // General
    'error.server': 'Server error',
    'error.validation': 'Validation failed',
    'error.not.found': 'Resource not found',
    'success': 'Operation successful',
  },
  tr: {
    // Auth
    'auth.register.success': 'Kayıt başarılı',
    'auth.login.success': 'Giriş başarılı',
    'auth.login.invalid': 'Geçersiz e-posta veya şifre',
    'auth.token.invalid': 'Geçersiz veya süresi dolmuş token',
    'auth.unauthorized': 'Yetkisiz erişim',
    
    // VIP
    'vip.required': 'VIP üyelik gerekli',
    'vip.expired': 'VIP üyeliğinizin süresi doldu',
    'vip.payment.success': 'VIP üyelik başarıyla etkinleştirildi',
    'vip.payment.failed': 'Ödeme başarısız',
    
    // Predictions
    'prediction.created': 'Tahmin başarıyla oluşturuldu',
    'vip.required.create': 'Tahmin oluşturmak için VIP üyelik gerekli',
    'prediction.limit.reached': 'Günlük tahmin limitine ulaşıldı',
    'prediction.not.found': 'Tahmin bulunamadı',
    'prediction.updated': 'Tahmin güncellendi',
    'prediction.deleted': 'Tahmin silindi',
    
    // Comments
    'comment.created': 'Yorum başarıyla gönderildi',
    'comment.not.found': 'Yorum bulunamadı',
    'comment.deleted': 'Yorum silindi',
    'comment.spam': 'Lütfen başka bir yorum göndermeden önce bekleyin',
    
    // General
    'error.server': 'Sunucu hatası',
    'error.validation': 'Doğrulama başarısız',
    'error.not.found': 'Kaynak bulunamadı',
    'success': 'İşlem başarılı',
  },
  ar: {
    // Auth
    'auth.register.success': 'تم التسجيل بنجاح',
    'auth.login.success': 'تم تسجيل الدخول بنجاح',
    'auth.login.invalid': 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    'auth.token.invalid': 'رمز غير صالح أو منتهي الصلاحية',
    'auth.unauthorized': 'وصول غير مصرح به',
    
    // VIP
    'vip.required': 'عضوية VIP مطلوبة',
    'vip.expired': 'انتهت صلاحية عضوية VIP الخاصة بك',
    'vip.payment.success': 'تم تفعيل عضوية VIP بنجاح',
    'vip.payment.failed': 'فشلت عملية الدفع',
    
    // Predictions
    'prediction.created': 'تم إنشاء التوقع بنجاح',
    'vip.required.create': 'عضوية VIP مطلوبة لإنشاء التوقعات',
    'prediction.limit.reached': 'تم الوصول إلى حد التوقعات اليومي',
    'prediction.not.found': 'التوقع غير موجود',
    'prediction.updated': 'تم تحديث التوقع',
    'prediction.deleted': 'تم حذف التوقع',
    
    // Comments
    'comment.created': 'تم نشر التعليق بنجاح',
    'comment.not.found': 'التعليق غير موجود',
    'comment.deleted': 'تم حذف التعليق',
    'comment.spam': 'يرجى الانتظار قبل نشر تعليق آخر',
    
    // General
    'error.server': 'خطأ في الخادم',
    'error.validation': 'فشل التحقق',
    'error.not.found': 'المورد غير موجود',
    'success': 'تمت العملية بنجاح',
  },
};

const translate = (key, lang = 'en') => {
  return translations[lang]?.[key] || translations.en[key] || key;
};

module.exports = {
  translate,
  translations,
};

