// src/context/LanguageContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  // ===== GET SAVED LANGUAGE FROM LOCALSTORAGE =====
  // Default to 'ar' (Arabic) if no saved preference
  const getSavedLanguage = () => {
    const saved = localStorage.getItem('language');
    // If saved language exists and is valid, use it
    if (saved && (saved === 'ar' || saved === 'en')) {
      return saved;
    }
    // Default to Arabic
    return 'ar';
  };

  const [language, setLanguage] = useState(getSavedLanguage);
  const [isChanging, setIsChanging] = useState(false);

  // ===== TOGGLE LANGUAGE =====
const toggleLanguage = () => {
  const newLang = language === 'en' ? 'ar' : 'en';
  setLanguage(newLang);
  localStorage.setItem('language', newLang);
  
  // Dispatch event for any components that need to react
  window.dispatchEvent(new CustomEvent('languageChange', { 
    detail: { language: newLang } 
  }));
  
  // Update document attributes immediately
  updateDocumentAttributes(newLang);
};
  // ===== UPDATE DOCUMENT ATTRIBUTES =====
  const updateDocumentAttributes = (lang) => {
    // Set direction (RTL for Arabic, LTR for English)
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    
    // Update body class
    document.body.className = lang === 'ar' ? 'rtl-mode' : 'ltr-mode';
    
    // Update Bootstrap theme direction
    document.documentElement.setAttribute('data-bs-theme', 'light');
    
    // Update title
    if (lang === 'ar') {
      document.title = 'مدرسة الفتح الخاصة - نظام إدارة المدرسة';
    } else {
      document.title = 'Madrassat Al Fath - School Management System';
    }
  };

  // ===== APPLY LANGUAGE ON MOUNT AND CHANGE =====
  useEffect(() => {
    // Apply language settings when component mounts or language changes
    updateDocumentAttributes(language);
    
    // Also update any meta tags for RTL
    const metaViewport = document.querySelector('meta[name="viewport"]');
    if (metaViewport) {
      metaViewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes';
    }
    
    // Add RTL class to body for any custom styles
    if (language === 'ar') {
      document.body.classList.add('rtl-mode');
      document.body.classList.remove('ltr-mode');
    } else {
      document.body.classList.add('ltr-mode');
      document.body.classList.remove('rtl-mode');
    }
  }, [language]);

  // ===== LISTEN FOR STORAGE CHANGES (for multi-tab support) =====
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'language' && e.newValue) {
        const newLang = e.newValue;
        if (newLang === 'ar' || newLang === 'en') {
          setLanguage(newLang);
          updateDocumentAttributes(newLang);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // ===== TRANSLATIONS =====
  const translations = {
    en: {
      welcome: 'Welcome',
      dashboard: 'Dashboard',
      students: 'Students',
      teachers: 'Teachers',
      classes: 'Classes',
      parents: 'Parents',
      announcements: 'Announcements',
      registrations: 'Registrations',
      reports: 'Reports',
      settings: 'Settings',
      profile: 'Profile',
      logout: 'Logout',
      refresh: 'Refresh',
      loading: 'Loading...',
      noData: 'No data available',
      error: 'An error occurred',
      retry: 'Retry',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      view: 'View',
      add: 'Add',
      search: 'Search',
      filter: 'Filter',
      export: 'Export',
      print: 'Print',
      overview: 'Overview',
      myClasses: 'My Classes',
      myStudents: 'My Students',
      attendance: 'Attendance',
      assignments: 'Assignments',
      timetable: 'Timetable',
      notifications: 'Notifications',
      welcomeBack: 'Welcome back',
      noNotifications: 'No notifications',
      markAllRead: 'Mark all as read',
      viewAll: 'View all',
      loadingNotifications: 'Loading notifications...',
    },
    ar: {
      welcome: 'مرحباً',
      dashboard: 'لوحة التحكم',
      students: 'الطلاب',
      teachers: 'المعلمون',
      classes: 'الفصول',
      parents: 'أولياء الأمور',
      announcements: 'الإعلانات',
      registrations: 'التسجيلات',
      reports: 'التقارير',
      settings: 'الإعدادات',
      profile: 'الملف الشخصي',
      logout: 'تسجيل خروج',
      refresh: 'تحديث',
      loading: 'جاري التحميل...',
      noData: 'لا توجد بيانات',
      error: 'حدث خطأ',
      retry: 'إعادة المحاولة',
      save: 'حفظ',
      cancel: 'إلغاء',
      delete: 'حذف',
      edit: 'تعديل',
      view: 'عرض',
      add: 'إضافة',
      search: 'بحث',
      filter: 'تصفية',
      export: 'تصدير',
      print: 'طباعة',
      overview: 'نظرة عامة',
      myClasses: 'فصولي',
      myStudents: 'طلابي',
      attendance: 'الحضور',
      assignments: 'الواجبات',
      timetable: 'الجدول',
      notifications: 'الإشعارات',
      welcomeBack: 'مرحباً بعودتك',
      noNotifications: 'لا توجد إشعارات',
      markAllRead: 'تحديد الكل كمقروء',
      viewAll: 'عرض الكل',
      loadingNotifications: 'جاري تحميل الإشعارات...',
    }
  };

  const t = (key) => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  const isArabic = language === 'ar';
  const isEnglish = language === 'en';

  return (
    <LanguageContext.Provider 
      value={{ 
        language, 
        toggleLanguage, 
        isArabic, 
        isEnglish, 
        t,
        setLanguage // Expose setLanguage for direct control if needed
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};