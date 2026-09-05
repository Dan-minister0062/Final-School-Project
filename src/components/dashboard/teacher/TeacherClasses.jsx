// src/components/dashboard/teacher/TeacherClasses.jsx
import React, { useState, useEffect } from "react";
import { Card, Row, Col, Button, Badge, Table, Modal, Form } from "react-bootstrap";
import { Link } from "react-router-dom";
import {
  FaChalkboardTeacher,
  FaUserGraduate,
  FaClock,
  FaCalendarAlt,
  FaSync,
  FaSearch,
  FaEye,
  FaEdit,
  FaTrash,
  FaPlus,
  FaSpinner,
  FaExclamationTriangle,
  FaBuilding,
  FaBook,
  FaUsers,
  FaArrowRight,
  FaGraduationCap,
} from "react-icons/fa";
import { useLanguage } from "../../../context/LanguageContext";
import { useNotification } from "../../../hooks/useNotification";
import { teacherService } from "../../../services/teacherService";

// ===== ALWAYS use English numbers =====
const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  return num.toString();
};

const TeacherClasses = () => {
  const { isArabic } = useLanguage();
  const { notify } = useNotification();
  const [darkMode, setDarkMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [classes, setClasses] = useState([]);
  const [teacher, setTeacher] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ===== ARABIC FONT STYLE =====
  const arabicFontStyle = {
    fontFamily: isArabic ? '"Hacen Tunisia", "Hacen Tunisia Bd", "Noto Sans Arabic", "Vazirmatn", "Traditional Arabic", "Arabic Typesetting", serif' : 'inherit',
    lineHeight: isArabic ? '1.8' : '1.6',
    letterSpacing: isArabic ? '0.5px' : '0px',
    fontSize: isArabic ? 'clamp(0.9rem, 1.1vw, 1.05rem)' : 'clamp(0.85rem, 1vw, 1rem)',
  };

  // ===== MAP CLASS NAME TO ARABIC/ENGLISH (FIXED) =====
  // We directly map English to Arabic using index matching instead of complex regex
  const getLocalizedClassName = (className, level) => {
    // If not Arabic, just return as is (or force English if you prefer)
    if (!isArabic) {
      return className;
    }
    
    // If already in Arabic, return as is
    if (/[\u0600-\u06FF]/.test(className)) return className;
    
    // English lookup arrays (Must match the ones in service)
    const englishLookup = {
      kindergarten: ['Introductory', 'Preparatory 1 -A-', 'Preparatory 1 -B-', 'Preparatory 2 -A-', 'Preparatory 2 -B-'],
      primary: ['1 -A-', '1 -B-', '2 -A-', '2 -B-', '3 -A-', '3 -B-', '4 -A-', '4 -B-', '5 -A-', '5 -B-', '6 -A-', '6 -B-'],
      secondary: ['Secondary 1 -A-', 'Secondary 1 -B-', 'Secondary 2 -A-', 'Secondary 2 -B-', 'Secondary 3 -A-', 'Secondary 3 -B-'],
      high_school: ['Common Core Science', '1st Baccalaureate Experimental Sciences', '2nd Baccalaureate Physical Sciences']
    };

    // Arabic lookup arrays
    const arabicLookup = {
      kindergarten: ['الاستئناس', 'التمهيدي الأول -أ-', 'التمهيدي الأول -ب-', 'التمهيدي الثاني -أ-', 'التمهيدي الثاني -ب-'],
      primary: ['الأول -أ-', 'الأول -ب-', 'الثاني -أ-', 'الثاني -ب-', 'الثالث -أ-', 'الثالث -ب-', 'الرابع -أ-', 'الرابع -ب-', 'الخامس -أ-', 'الخامس -ب-', 'السادس -أ-', 'السادس -ب-'],
      secondary: ['الأولى إعدادي -أ-', 'الأولى إعدادي -ب-', 'الثانية إعدادي -أ-', 'الثانية إعدادي -ب-', 'الثالثة إعدادي -أ-', 'الثالثة إعدادي -ب-'],
      high_school: ['جذع مشترك علمي', 'الأولى باكالوريا علوم تجريبية', 'الثانية باكالوريا علوم فيزيائية']
    };

    const englishList = englishLookup[level] || [];
    const arabicList = arabicLookup[level] || [];

    // Normalize strings for comparison (remove spaces and dashes)
    const normalize = (str) => str.replace(/[\s-]/g, '').toLowerCase();
    const cleanClassName = normalize(className);

    // Find index match
    const index = englishList.findIndex(name => normalize(name) === cleanClassName);
    
    if (index !== -1 && arabicList[index]) {
      return arabicList[index];
    }

    // Fallback to original
    return className;
  };

  // ===== Check dark mode & mobile =====
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.getAttribute('data-bs-theme') === 'dark' ||
        document.querySelector('.dashboard-wrapper.dark-theme') !== null;
      setDarkMode(isDark);
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-bs-theme'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ===== LOAD CLASSES DATA =====
  const loadClassesData = () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Loading teacher classes data...');
      
      // Get the current teacher
      const currentTeacher = teacherService.getCurrentTeacher();
      console.log('👨‍🏫 Current teacher:', currentTeacher);
      
      if (!currentTeacher) {
        console.warn('⚠️ No teacher found');
        setError(isArabic ? 'لم يتم العثور على المعلم' : 'Teacher not found');
        setLoading(false);
        return;
      }
      
      setTeacher(currentTeacher);
      
      // Get the teacher's assigned classes using the teacherService
      // IMPORTANT: We pass the language to the service so it automatically localizes it
      const assignedClasses = teacherService.getAssignedClasses(currentTeacher.id, null, isArabic ? 'ar' : 'en');
      console.log('📚 Assigned classes:', assignedClasses);
      
      // Get students for each class and ensure names are localized (just in case)
      const classesWithStudents = assignedClasses.map(cls => {
        const students = teacherService.getAssignedStudents(currentTeacher.id, [cls]);
        // Localize the class name just in case the service missed it
        const localizedName = getLocalizedClassName(cls.name, cls.level);
        return {
          ...cls,
          name: localizedName, 
          students: students || [],
          studentCount: students ? students.length : 0,
        };
      });
      
      setClasses(classesWithStudents);
      
      console.log('✅ Loaded classes with students:', classesWithStudents.length);
      setLoading(false);
    } catch (err) {
      console.error('❌ Error loading classes data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // ===== HANDLE REFRESH =====
  const handleRefresh = () => {
    setRefreshing(true);
    loadClassesData();
    setTimeout(() => {
      setRefreshing(false);
      if (notify) {
        notify(
          isArabic ? 'تم تحديث البيانات بنجاح' : 'Data refreshed successfully',
          'info'
        );
      }
    }, 800);
  };

  // ===== SETUP EFFECT =====
  useEffect(() => {
    loadClassesData();

    // Listen for teacher data changes
    const unsubscribeTeacher = teacherService.addListener((data) => {
      console.log('👨‍🏫 Teacher data changed, refreshing classes:', data);
      loadClassesData();
    });

    // Listen for storage changes
    const handleStorageChange = (e) => {
      if (
        e.key === "school_students" ||
        e.key === "school_classes" ||
        e.key === "school_users"
      ) {
        console.log("🔄 Storage changed, refreshing classes");
        loadClassesData();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // Listen for custom events
    const handleClassAssigned = () => {
      console.log("📚 Class assigned, refreshing classes");
      loadClassesData();
    };
    window.addEventListener("classAssigned", handleClassAssigned);

    const handleUsersUpdated = () => {
      console.log("👤 Users updated, refreshing classes");
      loadClassesData();
    };
    window.addEventListener("usersUpdated", handleUsersUpdated);

    // Listen for language change
    const handleLanguageChange = () => {
      console.log("🌐 Language changed, refreshing classes");
      loadClassesData();
    };
    window.addEventListener("languageChanged", handleLanguageChange);

    return () => {
      if (unsubscribeTeacher) unsubscribeTeacher();
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("classAssigned", handleClassAssigned);
      window.removeEventListener("usersUpdated", handleUsersUpdated);
      window.removeEventListener("languageChanged", handleLanguageChange);
    };
  }, [isArabic]); // Re-run when language changes

  // ===== FILTER CLASSES =====
  const getFilteredClasses = () => {
    if (!searchTerm) return classes;
    const searchLower = searchTerm.toLowerCase();
    return classes.filter(cls =>
      cls.name.toLowerCase().includes(searchLower) ||
      cls.level?.toLowerCase().includes(searchLower)
    );
  };

  const filteredClasses = getFilteredClasses();

  // ===== GET LEVEL DISPLAY (FIXED OPERATOR PRECEDENCE) =====
  const getLevelDisplay = (level) => {
    const levels = {
      kindergarten: isArabic ? 'أولي' : 'Kindergarten',
      primary: isArabic ? 'ابتدائي' : 'Primary',
      secondary: isArabic ? 'إعدادي' : 'Secondary',
      high_school: isArabic ? 'ثانوي' : 'High School',
    };
    // Must wrap the ternary in parentheses to prevent the || operator from breaking it
    return levels[level] || (isArabic ? 'غير محدد' : 'Unknown');
  };

  const getLevelColor = (level) => {
    const colors = {
      kindergarten: '#f39c12',
      primary: '#3498db',
      secondary: '#2ecc71',
      high_school: '#9b59b6',
    };
    return colors[level] || '#6c757d';
  };

  const getLevelIcon = (level) => {
    const icons = {
      kindergarten: <FaBuilding />,
      primary: <FaBook />,
      secondary: <FaUserGraduate />,
      high_school: <FaGraduationCap />,
    };
    return icons[level] || <FaBuilding />;
  };

  // ===== RENDER STATES =====
  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted" style={arabicFontStyle}>
          {isArabic ? 'جاري تحميل الفصول...' : 'Loading classes...'}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-5">
        <FaExclamationTriangle size={48} className="text-warning mb-3" />
        <p className="text-danger" style={arabicFontStyle}>{error}</p>
        <Button variant="primary" onClick={loadClassesData} style={{ ...arabicFontStyle, borderRadius: '12px' }}>
          <FaSync className="me-2" /> {isArabic ? 'إعادة المحاولة' : 'Retry'}
        </Button>
      </div>
    );
  }

  return (
    <div className="teacher-classes" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* ===== PAGE HEADER ===== */}
      <div className="page-header d-flex flex-wrap flex-sm-nowrap justify-content-between align-items-center gap-2 gap-md-3 mb-3 mb-md-4">
        <div className="flex-grow-1 min-width-0">
          <h4 className="fw-bold mb-0 mb-sm-1" style={{ 
            ...arabicFontStyle, 
            color: '#4a9eff', 
            fontSize: isArabic ? 'clamp(1rem, 2vw, 1.5rem)' : 'clamp(0.95rem, 1.8vw, 1.4rem)' 
          }}>
            <FaChalkboardTeacher className="me-2" /> 
            {isArabic ? 'فصولي الدراسية' : 'My Classes'}
          </h4>
          <p className="text-muted mb-0 d-none d-sm-block" style={{ 
            ...arabicFontStyle, 
            fontSize: isArabic ? 'clamp(0.8rem, 1vw, 0.95rem)' : 'clamp(0.75rem, 0.9vw, 0.9rem)' 
          }}>
            {isArabic 
              ? `عرض جميع الفصول المكلف بها (${formatNumber(classes.length)})`
              : `View all your assigned classes (${formatNumber(classes.length)})`}
          </p>
        </div>
        <div className="d-flex gap-1 gap-sm-2 flex-wrap flex-shrink-0">
          <Button 
            variant="outline-primary" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
            style={{ 
              ...arabicFontStyle, 
              borderRadius: '12px',
              fontSize: isArabic ? 'clamp(0.65rem, 0.8vw, 0.85rem)' : 'clamp(0.6rem, 0.75vw, 0.8rem)',
              padding: isMobile ? '4px 8px' : '4px 12px'
            }}
          >
            <FaSync className={refreshing ? 'spinning' : ''} /> 
            <span className="d-none d-sm-inline">{isArabic ? 'تحديث' : 'Refresh'}</span>
          </Button>
        </div>
      </div>

      {/* ===== STATS SUMMARY ===== */}
      <Row className="g-2 g-sm-3 mb-3 mb-md-4">
        <Col xs={6} sm={3}>
          <div className="stat-card-mini" style={{ 
            background: darkMode ? '#1a1a2e' : '#ffffff',
            border: `1px solid ${darkMode ? '#2d2d44' : '#e9ecef'}`,
            borderRadius: '12px',
            padding: '12px 16px',
            textAlign: 'center'
          }}>
            <div className="stat-number-mini" style={{ fontSize: '1.5rem', fontWeight: '700', color: '#4a9eff' }}>
              {formatNumber(classes.length)}
            </div>
            <div className="stat-label-mini" style={{ fontSize: '0.7rem', color: '#6c757d' }}>
              {isArabic ? 'إجمالي الفصول' : 'Total Classes'}
            </div>
          </div>
        </Col>
        <Col xs={6} sm={3}>
          <div className="stat-card-mini" style={{ 
            background: darkMode ? '#1a1a2e' : '#ffffff',
            border: `1px solid ${darkMode ? '#2d2d44' : '#e9ecef'}`,
            borderRadius: '12px',
            padding: '12px 16px',
            textAlign: 'center'
          }}>
            <div className="stat-number-mini" style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2ecc71' }}>
              {formatNumber(classes.reduce((sum, cls) => sum + (cls.studentCount || 0), 0))}
            </div>
            <div className="stat-label-mini" style={{ fontSize: '0.7rem', color: '#6c757d' }}>
              {isArabic ? 'إجمالي التلاميذ' : 'Total Students'}
            </div>
          </div>
        </Col>
        <Col xs={6} sm={3}>
          <div className="stat-card-mini" style={{ 
            background: darkMode ? '#1a1a2e' : '#ffffff',
            border: `1px solid ${darkMode ? '#2d2d44' : '#e9ecef'}`,
            borderRadius: '12px',
            padding: '12px 16px',
            textAlign: 'center'
          }}>
            <div className="stat-number-mini" style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f39c12' }}>
              {formatNumber(classes.filter(c => c.isActive !== false).length)}
            </div>
            <div className="stat-label-mini" style={{ fontSize: '0.7rem', color: '#6c757d' }}>
              {isArabic ? 'فصول نشطة' : 'Active Classes'}
            </div>
          </div>
        </Col>
        <Col xs={6} sm={3}>
          <div className="stat-card-mini" style={{ 
            background: darkMode ? '#1a1a2e' : '#ffffff',
            border: `1px solid ${darkMode ? '#2d2d44' : '#e9ecef'}`,
            borderRadius: '12px',
            padding: '12px 16px',
            textAlign: 'center'
          }}>
            <div className="stat-number-mini" style={{ fontSize: '1.5rem', fontWeight: '700', color: '#9b59b6' }}>
              {formatNumber(classes.filter(c => c.isActive === false).length)}
            </div>
            <div className="stat-label-mini" style={{ fontSize: '0.7rem', color: '#6c757d' }}>
              {isArabic ? 'فصول غير نشطة' : 'Inactive Classes'}
            </div>
          </div>
        </Col>
      </Row>

      {/* ===== SEARCH ===== */}
      {classes.length > 0 && (
        <div className="mb-3">
          <div className="search-wrapper" style={{ position: 'relative', maxWidth: '400px' }}>
            <FaSearch style={{ 
              position: 'absolute', 
              left: isArabic ? 'auto' : '12px', 
              right: isArabic ? '12px' : 'auto',
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: '#6c757d' 
            }} />
            <input
              type="text"
              className="form-control"
              placeholder={isArabic ? 'بحث عن فصل...' : 'Search for a class...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                paddingLeft: isArabic ? '12px' : '40px',
                paddingRight: isArabic ? '40px' : '12px',
                borderRadius: '12px',
                background: darkMode ? '#2d2d44' : '#ffffff',
                color: darkMode ? '#e9ecef' : '#212529',
                border: `1px solid ${darkMode ? '#2d2d44' : '#e9ecef'}`,
                ...arabicFontStyle,
              }}
            />
          </div>
        </div>
      )}

      {/* ===== CLASSES LIST ===== */}
      {filteredClasses.length === 0 ? (
        <Card className="modern-card text-center py-5" style={{ 
          background: darkMode ? '#1a1a2e' : '#ffffff', 
          borderColor: darkMode ? '#2d2d44' : '#e9ecef' 
        }}>
          <Card.Body>
            <FaChalkboardTeacher size={48} className="text-muted opacity-25 mb-3" />
            <h5 style={arabicFontStyle}>
              {searchTerm 
                ? (isArabic ? 'لا توجد فصول تطابق البحث' : 'No classes match your search')
                : (isArabic ? 'لا توجد فصول مكلف بها' : 'No assigned classes found')}
            </h5>
            <p className="text-muted" style={arabicFontStyle}>
              {searchTerm 
                ? (isArabic ? 'حاول تعديل كلمات البحث' : 'Try adjusting your search terms')
                : (isArabic ? 'لم يتم تعيين أي فصول لك بعد' : 'You haven\'t been assigned any classes yet')}
            </p>
            {teacher && (
              <p className="text-muted small" style={arabicFontStyle}>
                <FaChalkboardTeacher className="me-1" />
                {isArabic ? 'المعلم: ' : 'Teacher: '} {teacher.name || teacher.firstName || teacher.displayName}
              </p>
            )}
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-3 g-md-4">
          {filteredClasses.map((cls) => (
            <Col key={cls.id} xs={12} md={6} lg={4}>
              <Card className="class-card h-100" style={{ 
                background: darkMode ? '#1a1a2e' : '#ffffff', 
                borderColor: darkMode ? '#2d2d44' : '#e9ecef',
                borderRadius: '16px',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                boxShadow: darkMode ? '0 2px 12px rgba(0,0,0,0.2)' : '0 2px 12px rgba(0,0,0,0.04)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = darkMode ? '0 12px 36px rgba(0,0,0,0.3)' : '0 12px 36px rgba(0,0,0,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = darkMode ? '0 2px 12px rgba(0,0,0,0.2)' : '0 2px 12px rgba(0,0,0,0.04)';
              }}>
                <div className="class-card-topbar" style={{
                  height: '4px',
                  background: `linear-gradient(90deg, ${getLevelColor(cls.level)}, ${getLevelColor(cls.level)}cc)`
                }}></div>
                <Card.Body className="p-3 p-md-4">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="class-icon-wrapper" style={{
                        width: isMobile ? '36px' : '44px',
                        height: isMobile ? '36px' : '44px',
                        borderRadius: '12px',
                        background: `${getLevelColor(cls.level)}15`,
                        color: getLevelColor(cls.level),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: isMobile ? '1rem' : '1.2rem',
                      }}>
                        {getLevelIcon(cls.level)}
                      </div>
                      <div>
                        <h6 className="fw-bold mb-0" style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                          {cls.name}
                        </h6>
                        <small className="text-muted" style={arabicFontStyle}>
                          {getLevelDisplay(cls.level)}
                        </small>
                      </div>
                    </div>
                    <Badge 
                      className={cls.isActive !== false ? 'bg-success' : 'bg-secondary'}
                      style={{ 
                        borderRadius: '8px',
                        fontSize: isMobile ? '0.55rem' : '0.65rem',
                        padding: isMobile ? '3px 8px' : '4px 12px'
                      }}
                    >
                      {cls.isActive !== false 
                        ? (isArabic ? 'نشط' : 'Active') 
                        : (isArabic ? 'غير نشط' : 'Inactive')}
                    </Badge>
                  </div>

                  <div className="class-info-grid mt-3">
                    <div className="info-item d-flex align-items-center gap-2 mb-2">
                      <FaUserGraduate className="text-muted" size={isMobile ? 12 : 14} />
                      <span style={{ ...arabicFontStyle, fontSize: isMobile ? '0.8rem' : '0.9rem', color: darkMode ? '#e9ecef' : '#212529' }}>
                        {isArabic ? 'التلاميذ: ' : 'Students: '}
                        <strong>{formatNumber(cls.studentCount || 0)}</strong>
                      </span>
                    </div>
                    <div className="info-item d-flex align-items-center gap-2 mb-2">
                      <FaCalendarAlt className="text-muted" size={isMobile ? 12 : 14} />
                      <span style={{ ...arabicFontStyle, fontSize: isMobile ? '0.8rem' : '0.9rem', color: darkMode ? '#e9ecef' : '#212529' }}>
                        {isArabic ? 'الجدول: ' : 'Schedule: '}
                        {cls.schedule || (isArabic ? 'غير محدد' : 'Not set')}
                      </span>
                    </div>
                    <div className="info-item d-flex align-items-center gap-2">
                      <FaBuilding className="text-muted" size={isMobile ? 12 : 14} />
                      <span style={{ ...arabicFontStyle, fontSize: isMobile ? '0.8rem' : '0.9rem', color: darkMode ? '#e9ecef' : '#212529' }}>
                        {isArabic ? 'السعة: ' : 'Capacity: '}
                        {formatNumber(cls.capacity || 30)}
                      </span>
                    </div>
                  </div>

                  {/* Student progress bar */}
                  <div className="mt-3">
                    <div className="d-flex justify-content-between small text-muted" style={arabicFontStyle}>
                      <span>{isArabic ? 'نسبة الإشغال' : 'Occupancy'}</span>
                      <span>{cls.capacity ? Math.round(((cls.studentCount || 0) / cls.capacity) * 100) : 0}%</span>
                    </div>
                    <div className="progress" style={{ height: '4px', borderRadius: '2px' }}>
                      <div 
                        className="progress-bar" 
                        role="progressbar"
                        style={{
                          width: `${cls.capacity ? Math.min(Math.round(((cls.studentCount || 0) / cls.capacity) * 100), 100) : 0}%`,
                          background: `linear-gradient(90deg, ${getLevelColor(cls.level)}, ${getLevelColor(cls.level)}cc)`,
                          borderRadius: '2px'
                        }}
                      />
                    </div>
                  </div>
                </Card.Body>
                <Card.Footer className="bg-transparent border-0 p-3 p-md-4 pt-0">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="w-100"
                    onClick={() => { setSelectedClass(cls); setShowViewModal(true); }}
                    style={{ 
                      ...arabicFontStyle, 
                      borderRadius: '12px',
                      fontSize: isMobile ? '0.75rem' : '0.85rem'
                    }}
                  >
                    <FaEye className="me-2" size={isMobile ? 12 : 14} />
                    {isArabic ? 'عرض التفاصيل' : 'View Details'}
                    <FaArrowRight className="ms-2" size={isMobile ? 10 : 12} />
                  </Button>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* ===== VIEW CLASS MODAL ===== */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} centered size="lg" className="modern-modal">
        <Modal.Header closeButton className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Modal.Title style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
            <FaEye className="me-2 text-primary" />
            {isArabic ? 'تفاصيل الفصل' : 'Class Details'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? '#0d1117' : 'white' }}>
          {selectedClass && (
            <div>
              <div className="text-center mb-4">
                <div 
                  className="class-avatar-lg mx-auto"
                  style={{
                    background: `linear-gradient(135deg, ${getLevelColor(selectedClass.level)}, ${getLevelColor(selectedClass.level)}dd)`,
                    width: isMobile ? '80px' : '100px',
                    height: isMobile ? '80px' : '100px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: isMobile ? '2rem' : '2.5rem',
                    margin: '0 auto',
                    boxShadow: `0 8px 30px ${getLevelColor(selectedClass.level)}40`
                  }}
                >
                  {selectedClass.name.charAt(0).toUpperCase()}
                </div>
                <h5 className="fw-bold mt-3" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                  {selectedClass.name}
                </h5>
                <Badge style={{ background: getLevelColor(selectedClass.level), color: 'white', borderRadius: '8px' }}>
                  {getLevelIcon(selectedClass.level)} {getLevelDisplay(selectedClass.level)}
                </Badge>
                <div className="mt-2">
                  <Badge className={selectedClass.isActive !== false ? 'bg-success' : 'bg-secondary'} style={{ borderRadius: '8px' }}>
                    {selectedClass.isActive !== false 
                      ? (isArabic ? 'نشط' : 'Active') 
                      : (isArabic ? 'غير نشط' : 'Inactive')}
                  </Badge>
                </div>
              </div>

              <Row className="g-3">
                <Col md={6}>
                  <div className="detail-item">
                    <label className="text-muted small" style={arabicFontStyle}>
                      <FaUserGraduate className="me-1" /> {isArabic ? 'التلاميذ' : 'Students'}
                    </label>
                    <p className="fw-semibold mb-0" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                      {formatNumber(selectedClass.studentCount || 0)} / {formatNumber(selectedClass.capacity || 30)}
                    </p>
                    <div className="progress" style={{ height: '6px', borderRadius: '3px', marginTop: '4px' }}>
                      <div 
                        className="progress-bar" 
                        role="progressbar"
                        style={{
                          width: `${selectedClass.capacity ? Math.min(Math.round(((selectedClass.studentCount || 0) / selectedClass.capacity) * 100), 100) : 0}%`,
                          background: `linear-gradient(90deg, ${getLevelColor(selectedClass.level)}, ${getLevelColor(selectedClass.level)}cc)`,
                          borderRadius: '3px'
                        }}
                      />
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="detail-item">
                    <label className="text-muted small" style={arabicFontStyle}>
                      <FaClock className="me-1" /> {isArabic ? 'الجدول' : 'Schedule'}
                    </label>
                    <p className="fw-semibold mb-0" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                      {selectedClass.schedule || (isArabic ? 'غير محدد' : 'Not set')}
                    </p>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="detail-item">
                    <label className="text-muted small" style={arabicFontStyle}>
                      <FaChalkboardTeacher className="me-1" /> {isArabic ? 'المعلم' : 'Teacher'}
                    </label>
                    <p className="fw-semibold mb-0" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                      {teacher?.name || teacher?.firstName || selectedClass.teacher || (isArabic ? 'غير محدد' : 'Not set')}
                    </p>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="detail-item">
                    <label className="text-muted small" style={arabicFontStyle}>
                      <FaBuilding className="me-1" /> {isArabic ? 'المستوى' : 'Level'}
                    </label>
                    <p className="fw-semibold mb-0" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                      {getLevelDisplay(selectedClass.level)}
                    </p>
                  </div>
                </Col>
              </Row>

              {/* Students List */}
              {selectedClass.students && selectedClass.students.length > 0 && (
                <div className="mt-4">
                  <h6 className="fw-bold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                    <FaUsers className="me-2" /> {isArabic ? 'قائمة التلاميذ' : 'Students List'}
                  </h6>
                  <div className="students-list" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                    {selectedClass.students.map((student, index) => (
                      <div key={student.id || index} className="student-item d-flex align-items-center gap-2 py-1 border-bottom" style={{ borderColor: darkMode ? '#2d2d44' : '#e9ecef' }}>
                        <span className="badge bg-secondary rounded-circle" style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {index + 1}
                        </span>
                        <span style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                          {student.name || student.firstName || student.displayName || 'Unknown'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Button variant="secondary" onClick={() => setShowViewModal(false)} style={{ ...arabicFontStyle, borderRadius: '12px' }}>
            {isArabic ? 'إغلاق' : 'Close'}
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@100..900&family=Vazirmatn:wght@100..900&display=swap');

        .teacher-classes {
          padding: 0;
          max-width: 100vw;
          overflow-x: hidden;
        }

        .teacher-classes * {
          box-sizing: border-box;
        }

        .min-width-0 {
          min-width: 0;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        [dir="rtl"] .page-header {
          flex-direction: row-reverse;
        }

        @media (max-width: 576px) {
          .page-header {
            flex-direction: column;
            align-items: stretch !important;
          }
          [dir="rtl"] .page-header {
            align-items: stretch !important;
          }
          .page-header .d-flex {
            justify-content: flex-start;
          }
          [dir="rtl"] .page-header .d-flex {
            justify-content: flex-end;
          }
        }

        .class-card {
          transition: all 0.3s ease;
        }

        .class-card-topbar {
          transition: height 0.3s ease;
        }

        .class-card:hover .class-card-topbar {
          height: 6px;
        }

        .class-icon-wrapper {
          transition: transform 0.3s ease;
        }

        .class-card:hover .class-icon-wrapper {
          transform: scale(1.1) rotate(-5deg);
        }

        .modern-card {
          border-radius: 16px !important;
          border: 1px solid ${darkMode ? '#2d2d44' : '#e9ecef'} !important;
          transition: all 0.3s ease;
          overflow: hidden;
          background: ${darkMode ? '#1a1a2e' : '#ffffff'} !important;
        }

        .modern-modal .modal-content {
          border-radius: 20px !important;
          border: none !important;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
          overflow: hidden;
        }

        .class-avatar-lg {
          transition: transform 0.3s ease;
        }

        .class-avatar-lg:hover {
          transform: scale(1.05);
        }

        .detail-item {
          padding: 4px 0;
        }

        .detail-item label {
          display: block;
          font-size: 0.7rem;
          color: #6c757d;
          margin-bottom: 2px;
          font-weight: 500;
        }

        .detail-item p {
          font-size: 0.95rem;
          margin-bottom: 0;
        }

        .students-list {
          scrollbar-width: thin;
        }

        .students-list::-webkit-scrollbar {
          width: 4px;
        }

        .students-list::-webkit-scrollbar-track {
          background: transparent;
        }

        .students-list::-webkit-scrollbar-thumb {
          background: ${darkMode ? '#2d2d44' : '#e9ecef'};
          border-radius: 2px;
        }

        /* ===== RTL FIXES ===== */
        [dir="rtl"] .me-1 {
          margin-right: 0 !important;
          margin-left: 0.25rem !important;
        }
        [dir="rtl"] .me-2 {
          margin-right: 0 !important;
          margin-left: 0.5rem !important;
        }
        [dir="rtl"] .ms-1 {
          margin-left: 0 !important;
          margin-right: 0.25rem !important;
        }
        [dir="rtl"] .ms-2 {
          margin-left: 0 !important;
          margin-right: 0.5rem !important;
        }
        [dir="rtl"] .search-wrapper input {
          padding-right: 40px !important;
          padding-left: 12px !important;
        }
        [dir="rtl"] .search-wrapper .fa-search {
          right: 12px !important;
          left: auto !important;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 576px) {
          .stat-card-mini {
            padding: 8px 12px !important;
          }
          .stat-number-mini {
            font-size: 1.2rem !important;
          }
          .stat-label-mini {
            font-size: 0.6rem !important;
          }
          .class-card .p-3 {
            padding: 12px !important;
          }
          .class-card h6 {
            font-size: 0.85rem !important;
          }
          .class-icon-wrapper {
            width: 32px !important;
            height: 32px !important;
            font-size: 0.85rem !important;
          }
        }

        @media (max-width: 400px) {
          .stat-number-mini {
            font-size: 1rem !important;
          }
          .stat-label-mini {
            font-size: 0.5rem !important;
          }
          .class-card .p-3 {
            padding: 8px !important;
          }
          .class-card h6 {
            font-size: 0.75rem !important;
          }
          .class-icon-wrapper {
            width: 28px !important;
            height: 28px !important;
            font-size: 0.75rem !important;
          }
          .class-card .info-item span {
            font-size: 0.7rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default TeacherClasses;