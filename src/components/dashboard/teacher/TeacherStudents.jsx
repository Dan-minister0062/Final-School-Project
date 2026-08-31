// src/components/dashboard/teacher/TeacherStudents.jsx
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Table, Modal, Form, Badge, ProgressBar } from 'react-bootstrap';
import { 
  FaSearch, 
  FaUserGraduate, 
  FaEye, 
  FaChartBar, 
  FaCalendarAlt, 
  FaBook,
  FaSync,
  FaExclamationTriangle,
  FaSpinner,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaUser,
  FaGraduationCap,
  FaUsers,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaUserCheck,
} from 'react-icons/fa';
import { useLanguage } from '../../../context/LanguageContext';
import { useNotification } from '../../../hooks/useNotification';
import { teacherService } from '../../../services/teacherService';

// ===== ALWAYS use English numbers =====
const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  return num.toString();
};

const TeacherStudents = () => {
  const { isArabic } = useLanguage();
  const { notify } = useNotification();
  const [darkMode, setDarkMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    classId: '',
    educationLevel: ''
  });
  const [classes, setClasses] = useState([]);
  const [teacher, setTeacher] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [studentAttendance, setStudentAttendance] = useState({});

  // ===== ARABIC FONT STYLE =====
  const arabicFontStyle = {
    fontFamily: isArabic ? '"Hacen Tunisia", "Hacen Tunisia Bd", "Noto Sans Arabic", "Vazirmatn", "Traditional Arabic", "Arabic Typesetting", serif' : 'inherit',
    lineHeight: isArabic ? '1.8' : '1.6',
    letterSpacing: isArabic ? '0.5px' : '0px',
    fontSize: isArabic ? 'clamp(0.9rem, 1.1vw, 1.05rem)' : 'clamp(0.85rem, 1vw, 1rem)',
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

  // ===== CALCULATE STUDENT ATTENDANCE PERCENTAGE =====
  const calculateStudentAttendance = (studentId) => {
    try {
      const allRecords = JSON.parse(localStorage.getItem('school_attendance') || '[]');
      
      // Find all records that contain this student
      const studentRecords = allRecords.filter(r => 
        r.students && r.students.some(s => s.studentId === studentId)
      );
      
      if (studentRecords.length === 0) {
        return { 
          percentage: 0, 
          present: 0, 
          absent: 0, 
          late: 0, 
          excused: 0, 
          total: 0,
          presentDays: 0,
          totalDays: 0,
        };
      }
      
      let present = 0;
      let absent = 0;
      let late = 0;
      let excused = 0;
      let total = 0;
      
      // Count each day's status for this student
      studentRecords.forEach(record => {
        const studentData = record.students.find(s => s.studentId === studentId);
        if (studentData) {
          total++;
          switch (studentData.status) {
            case 'present':
              present++;
              break;
            case 'absent':
              absent++;
              break;
            case 'late':
              late++;
              break;
            case 'excused':
              excused++;
              break;
            default:
              break;
          }
        }
      });
      
      // Calculate percentage: (present / total) * 100
      const percentage = total > 0 ? (present / total) * 100 : 0;
      
      return {
        percentage,
        present,
        absent,
        late,
        excused,
        total,
        presentDays: present,
        totalDays: total,
      };
    } catch (err) {
      console.error('Error calculating attendance:', err);
      return { 
        percentage: 0, 
        present: 0, 
        absent: 0, 
        late: 0, 
        excused: 0, 
        total: 0,
        presentDays: 0,
        totalDays: 0,
      };
    }
  };

  // ===== LOAD DATA =====
  const loadData = () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Loading teacher students data...');
      
      // Get current teacher
      const currentTeacher = teacherService.getCurrentTeacher();
      console.log('👨‍🏫 Current teacher:', currentTeacher);
      
      if (!currentTeacher) {
        setError(isArabic ? 'لم يتم العثور على المعلم' : 'Teacher not found');
        setLoading(false);
        return;
      }
      
      setTeacher(currentTeacher);
      
      // Get assigned students - pass teacher ID explicitly
      const assignedStudents = teacherService.getAssignedStudents(currentTeacher.id);
      console.log('👨‍🎓 Assigned students loaded:', assignedStudents.length);
      
      // Get assigned classes
      const assignedClasses = teacherService.getAssignedClasses(currentTeacher.id);
      console.log('📚 Assigned classes:', assignedClasses.length);
      
      // Enrich students with class name and attendance data
      const enrichedStudents = assignedStudents.map(student => {
        const classInfo = assignedClasses.find(c => c.id === student.classId || c.id === student.class);
        const attendance = calculateStudentAttendance(student.id);
        
        return {
          ...student,
          className: classInfo?.name || student.className || student.class || 'N/A',
          classLevel: classInfo?.level || student.level || 'N/A',
          attendance: attendance,
        };
      });
      
      setStudents(enrichedStudents);
      setFilteredStudents(enrichedStudents);
      setClasses(assignedClasses);
      
      // Calculate attendance for all students
      const attendanceMap = {};
      enrichedStudents.forEach(student => {
        attendanceMap[student.id] = student.attendance;
      });
      setStudentAttendance(attendanceMap);
      
      setLoading(false);
    } catch (err) {
      console.error('❌ Error loading students data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // ===== HANDLE REFRESH =====
  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
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
    loadData();

    // Listen for teacher data changes
    const unsubscribeTeacher = teacherService.addListener((data) => {
      console.log('👨‍🏫 Teacher data changed, refreshing students:', data);
      loadData();
    });

    // Listen for storage changes
    const handleStorageChange = (e) => {
      if (
        e.key === "school_students" ||
        e.key === "school_classes" ||
        e.key === "school_users" ||
        e.key === "school_attendance"
      ) {
        console.log("🔄 Storage changed, refreshing students");
        loadData();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // Listen for student added events
    const handleStudentAdded = () => {
      console.log("👨‍🎓 Student added event, refreshing students");
      loadData();
    };
    window.addEventListener("studentAdded", handleStudentAdded);

    // Listen for attendance updated events
    const handleAttendanceUpdated = () => {
      console.log("📊 Attendance updated, refreshing students");
      loadData();
    };
    window.addEventListener("attendanceUpdated", handleAttendanceUpdated);

    const handleUsersUpdated = () => {
      console.log("👤 Users updated, refreshing students");
      loadData();
    };
    window.addEventListener("usersUpdated", handleUsersUpdated);

    return () => {
      if (unsubscribeTeacher) unsubscribeTeacher();
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("studentAdded", handleStudentAdded);
      window.removeEventListener("attendanceUpdated", handleAttendanceUpdated);
      window.removeEventListener("usersUpdated", handleUsersUpdated);
    };
  }, []);

  // ===== APPLY FILTERS =====
  useEffect(() => {
    let filtered = [...students];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        (s.name || '').toLowerCase().includes(term) ||
        (s.firstName || '').toLowerCase().includes(term) ||
        (s.lastName || '').toLowerCase().includes(term) ||
        (s.id || '').toLowerCase().includes(term) ||
        (s.email || '').toLowerCase().includes(term)
      );
    }

    if (filters.classId) {
      filtered = filtered.filter(s => s.classId === filters.classId || s.class === filters.classId);
    }

    if (filters.educationLevel) {
      filtered = filtered.filter(s => s.educationLevel === filters.educationLevel || s.level === filters.educationLevel);
    }

    setFilteredStudents(filtered);
  }, [students, searchTerm, filters]);

  // ===== HANDLE FILTER CHANGES =====
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // ===== HANDLE VIEW STUDENT =====
  const handleViewStudent = (student) => {
    // Refresh attendance data before showing
    const updatedAttendance = calculateStudentAttendance(student.id);
    const updatedStudent = {
      ...student,
      attendance: updatedAttendance,
    };
    setSelectedStudent(updatedStudent);
    setShowDetailsModal(true);
  };

  // ===== GET LEVEL DISPLAY =====
  const getLevelDisplay = (level) => {
    const levels = {
      kindergarten: isArabic ? 'أولي' : 'Kindergarten',
      primary: isArabic ? 'ابتدائي' : 'Primary',
      secondary: isArabic ? 'إعدادي' : 'Secondary',
      high_school: isArabic ? 'ثانوي' : 'High School',
    };
    return levels[level] || level || 'N/A';
  };

  // ===== GET LEVEL COLOR =====
  const getLevelColor = (level) => {
    const colors = {
      kindergarten: '#f39c12',
      primary: '#3498db',
      secondary: '#2ecc71',
      high_school: '#9b59b6',
    };
    return colors[level] || '#6c757d';
  };

  // ===== GET STATUS BADGE =====
  const getStatusBadge = (status) => {
    const statusMap = {
      'present': 'success',
      'absent': 'danger',
      'late': 'warning',
      'excused': 'info'
    };
    return statusMap[status] || 'secondary';
  };

  const getStatusIcon = (status) => {
    const iconMap = {
      'present': <FaCheckCircle />,
      'absent': <FaTimesCircle />,
      'late': <FaClock />,
      'excused': <FaUserCheck />
    };
    return iconMap[status] || <FaClock />;
  };

  const getStatusLabel = (status) => {
    const labels = {
      'present': isArabic ? 'حاضر' : 'Present',
      'absent': isArabic ? 'غائب' : 'Absent',
      'late': isArabic ? 'متأخر' : 'Late',
      'excused': isArabic ? 'معذور' : 'Excused'
    };
    return labels[status] || status;
  };

  // ===== RENDER STATES =====
  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted" style={arabicFontStyle}>
          {isArabic ? 'جاري تحميل الطلاب...' : 'Loading students...'}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-5">
        <FaExclamationTriangle size={48} className="text-warning mb-3" />
        <p className="text-danger" style={arabicFontStyle}>{error}</p>
        <Button variant="primary" onClick={loadData} style={{ ...arabicFontStyle, borderRadius: '12px' }}>
          <FaSync className="me-2" /> {isArabic ? 'إعادة المحاولة' : 'Retry'}
        </Button>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="teacher-students">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
          <div>
            <h4 className="fw-bold mb-0" style={{ ...arabicFontStyle, color: '#4a9eff' }}>
              <FaUserGraduate className="me-2" />
              {isArabic ? 'طلابي' : 'My Students'}
            </h4>
            <p className="text-muted mb-0" style={arabicFontStyle}>
              {isArabic ? 'عرض وإدارة الطلاب في فصولك' : 'View and manage students in your classes'}
            </p>
          </div>
          <Button 
            variant="outline-primary" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
            style={{ ...arabicFontStyle, borderRadius: '12px' }}
          >
            <FaSync className={refreshing ? 'spinning' : ''} /> 
            <span className="d-none d-sm-inline">{isArabic ? 'تحديث' : 'Refresh'}</span>
          </Button>
        </div>

        <Card className="text-center py-5" style={{ 
          background: darkMode ? '#1a1a2e' : '#ffffff', 
          borderColor: darkMode ? '#2d2d44' : '#e9ecef',
          borderRadius: '16px',
        }}>
          <Card.Body>
            <FaUserGraduate size={48} className="text-muted opacity-25 mb-3" />
            <h5 style={arabicFontStyle}>
              {isArabic ? 'لا يوجد طلاب مكلفين' : 'No students assigned'}
            </h5>
            <p className="text-muted" style={arabicFontStyle}>
              {isArabic 
                ? 'سيظهر طلاب الفصول المخصصة لك هنا' 
                : 'Students from your assigned classes will appear here'}
            </p>
            {teacher && (
              <p className="text-muted small" style={arabicFontStyle}>
                <FaUserGraduate className="me-1" />
                {isArabic ? 'المعلم: ' : 'Teacher: '} {teacher.name || teacher.firstName || teacher.displayName}
              </p>
            )}
          </Card.Body>
        </Card>
      </div>
    );
  }

  // ===== CALCULATE GENDER STATS =====
  const maleStudents = students.filter(s => s.gender === 'male' || s.gender === 'M' || s.gender === 'ذكر');
  const femaleStudents = students.filter(s => s.gender === 'female' || s.gender === 'F' || s.gender === 'أنثى');

  return (
    <div className="teacher-students" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* ===== PAGE HEADER ===== */}
      <div className="d-flex flex-wrap flex-sm-nowrap justify-content-between align-items-center gap-2 gap-md-3 mb-3 mb-md-4">
        <div className="flex-grow-1 min-width-0">
          <h4 className="fw-bold mb-0 mb-sm-1" style={{ 
            ...arabicFontStyle, 
            color: '#4a9eff', 
            fontSize: isArabic ? 'clamp(1rem, 2vw, 1.5rem)' : 'clamp(0.95rem, 1.8vw, 1.4rem)' 
          }}>
            <FaUserGraduate className="me-2" /> 
            {isArabic ? 'طلابي' : 'My Students'}
          </h4>
          <p className="text-muted mb-0 d-none d-sm-block" style={{ 
            ...arabicFontStyle, 
            fontSize: isArabic ? 'clamp(0.8rem, 1vw, 0.95rem)' : 'clamp(0.75rem, 0.9vw, 0.9rem)' 
          }}>
            {isArabic 
              ? `عرض وإدارة الطلاب في فصولك (${formatNumber(students.length)})`
              : `View and manage students in your classes (${formatNumber(students.length)})`}
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
              {formatNumber(students.length)}
            </div>
            <div className="stat-label-mini" style={{ fontSize: '0.7rem', color: '#6c757d' }}>
              {isArabic ? 'إجمالي الطلاب' : 'Total Students'}
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
              {formatNumber(classes.length)}
            </div>
            <div className="stat-label-mini" style={{ fontSize: '0.7rem', color: '#6c757d' }}>
              {isArabic ? 'الفصول المكلف بها' : 'Assigned Classes'}
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
            <div className="stat-number-mini" style={{ fontSize: '1.5rem', fontWeight: '700', color: '#3498db' }}>
              {formatNumber(maleStudents.length)}
            </div>
            <div className="stat-label-mini" style={{ fontSize: '0.7rem', color: '#6c757d' }}>
              <FaUser className="me-1" size={12} />
              {isArabic ? 'طلاب (ذكور)' : 'Male Students'}
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
            <div className="stat-number-mini" style={{ fontSize: '1.5rem', fontWeight: '700', color: '#e91e63' }}>
              {formatNumber(femaleStudents.length)}
            </div>
            <div className="stat-label-mini" style={{ fontSize: '0.7rem', color: '#6c757d' }}>
              <FaUser className="me-1" size={12} />
              {isArabic ? 'طلاب (إناث)' : 'Female Students'}
            </div>
          </div>
        </Col>
      </Row>

      {/* ===== FILTERS ===== */}
      <Card className="modern-card mb-4" style={{ background: darkMode ? '#1a1a2e' : '#ffffff', borderColor: darkMode ? '#2d2d44' : '#e9ecef' }}>
        <Card.Body className="p-3 p-md-4">
          <Row className="g-2 g-md-3">
            <Col xs={12} md={5} lg={5}>
              <div className="position-relative">
                <FaSearch className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                <Form.Control
                  type="text"
                  placeholder={isArabic ? 'بحث عن طالب...' : 'Search students...'}
                  value={searchTerm}
                  onChange={handleSearch}
                  className="ps-5"
                  style={{
                    ...arabicFontStyle,
                    background: darkMode ? '#2d2d44' : 'white',
                    color: darkMode ? '#e9ecef' : '#212529',
                    borderRadius: '12px',
                    borderColor: darkMode ? '#2d2d44' : '#e9ecef',
                  }}
                />
              </div>
            </Col>
            <Col xs={6} md={3} lg={3}>
              <Form.Select
                name="classId"
                value={filters.classId}
                onChange={handleFilterChange}
                style={{
                  ...arabicFontStyle,
                  background: darkMode ? '#2d2d44' : 'white',
                  color: darkMode ? '#e9ecef' : '#212529',
                  borderRadius: '12px',
                  borderColor: darkMode ? '#2d2d44' : '#e9ecef',
                }}
              >
                <option value="">{isArabic ? 'جميع الفصول' : 'All Classes'}</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={6} md={3} lg={3}>
              <Form.Select
                name="educationLevel"
                value={filters.educationLevel}
                onChange={handleFilterChange}
                style={{
                  ...arabicFontStyle,
                  background: darkMode ? '#2d2d44' : 'white',
                  color: darkMode ? '#e9ecef' : '#212529',
                  borderRadius: '12px',
                  borderColor: darkMode ? '#2d2d44' : '#e9ecef',
                }}
              >
                <option value="">{isArabic ? 'جميع المستويات' : 'All Levels'}</option>
                <option value="kindergarten">{isArabic ? 'أولي' : 'Kindergarten'}</option>
                <option value="primary">{isArabic ? 'ابتدائي' : 'Primary'}</option>
                <option value="secondary">{isArabic ? 'إعدادي' : 'Secondary'}</option>
                <option value="high_school">{isArabic ? 'ثانوي' : 'High School'}</option>
              </Form.Select>
            </Col>
            <Col xs={12} md={1}>
              <span className="text-muted d-flex align-items-center justify-content-center" style={{ ...arabicFontStyle, fontSize: '0.85rem' }}>
                {formatNumber(filteredStudents.length)} {isArabic ? 'طالب' : 'students'}
              </span>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* ===== STUDENT CARDS ===== */}
      {filteredStudents.length === 0 ? (
        <Card className="text-center py-5" style={{ 
          background: darkMode ? '#1a1a2e' : '#ffffff', 
          borderColor: darkMode ? '#2d2d44' : '#e9ecef',
          borderRadius: '16px',
        }}>
          <Card.Body>
            <FaSearch size={48} className="text-muted opacity-25 mb-3" />
            <h5 style={arabicFontStyle}>
              {isArabic ? 'لا توجد نتائج تطابق البحث' : 'No students match your search'}
            </h5>
            <p className="text-muted" style={arabicFontStyle}>
              {isArabic ? 'حاول تعديل كلمات البحث أو الفلاتر' : 'Try adjusting your search terms or filters'}
            </p>
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-3 g-md-4">
          {filteredStudents.map(student => {
            const levelColor = getLevelColor(student.level || student.educationLevel);
            const attendance = student.attendance || { percentage: 0, present: 0, absent: 0, late: 0, excused: 0, total: 0 };
            const attendancePercentage = attendance.percentage || 0;
            
            return (
              <Col key={student.id} xs={12} sm={6} lg={4} xl={3}>
                <Card className="student-card h-100" style={{ 
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
                  <div className="student-card-topbar" style={{
                    height: '4px',
                    background: `linear-gradient(90deg, ${levelColor}, ${levelColor}cc)`
                  }}></div>
                  <Card.Body className="p-3 p-md-4">
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <div className="student-avatar" style={{
                        width: isMobile ? '44px' : '56px',
                        height: isMobile ? '44px' : '56px',
                        borderRadius: '50%',
                        background: `${levelColor}15`,
                        color: levelColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: isMobile ? '1.2rem' : '1.5rem',
                        flexShrink: 0,
                      }}>
                        {(student.name || student.firstName || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-grow-1 min-width-0">
                        <h6 className="fw-bold mb-0 text-truncate" style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                          {student.name || student.firstName || 'Unknown'}
                        </h6>
                        <small className="text-muted d-block text-truncate" style={arabicFontStyle}>
                          {isArabic ? 'المعرف: ' : 'ID: '}{student.id}
                        </small>
                      </div>
                    </div>
                    
                    <div className="student-details" style={{
                      padding: '10px 12px',
                      background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                      borderRadius: '10px',
                    }}>
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <FaBook className="text-primary" size={isMobile ? 10 : 12} />
                        <span style={{ ...arabicFontStyle, fontSize: isMobile ? '0.75rem' : '0.85rem', color: darkMode ? '#e9ecef' : '#212529' }}>
                          {isArabic ? 'الفصل: ' : 'Class: '}
                          <strong>{student.className || 'N/A'}</strong>
                        </span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <FaGraduationCap className="text-success" size={isMobile ? 10 : 12} />
                        <span style={{ ...arabicFontStyle, fontSize: isMobile ? '0.75rem' : '0.85rem', color: darkMode ? '#e9ecef' : '#212529' }}>
                          {isArabic ? 'المستوى: ' : 'Level: '}
                          <strong>{getLevelDisplay(student.level || student.educationLevel)}</strong>
                        </span>
                      </div>
                    </div>

                    {/* ===== ATTENDANCE PROGRESS BAR ===== */}
                    <div className="mt-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted small" style={arabicFontStyle}>
                          <FaChartBar className="me-1" size={isMobile ? 10 : 12} />
                          {isArabic ? 'نسبة الحضور' : 'Attendance Rate'}
                          <span className="text-muted ms-1" style={{ fontSize: '0.6rem' }}>
                            ({formatNumber(attendance.total)} {isArabic ? 'يوم' : 'days'})
                          </span>
                        </span>
                        <span className={`fw-bold ${attendancePercentage >= 75 ? 'text-success' : attendancePercentage >= 50 ? 'text-warning' : 'text-danger'}`}>
                          {attendancePercentage.toFixed(0)}%
                        </span>
                      </div>
                      <ProgressBar 
                        now={attendancePercentage} 
                        variant={attendancePercentage >= 75 ? 'success' : attendancePercentage >= 50 ? 'warning' : 'danger'}
                        style={{ height: '6px', borderRadius: '3px' }}
                      />
                      <div className="d-flex justify-content-between mt-1">
                        <small className="text-muted" style={{ fontSize: '0.55rem' }}>
                          {isArabic ? 'حاضر: ' : 'Present: '}
                          <span className="text-success">{formatNumber(attendance.present)}</span>
                        </small>
                        <small className="text-muted" style={{ fontSize: '0.55rem' }}>
                          {isArabic ? 'غائب: ' : 'Absent: '}
                          <span className="text-danger">{formatNumber(attendance.absent)}</span>
                        </small>
                        <small className="text-muted" style={{ fontSize: '0.55rem' }}>
                          {isArabic ? 'متأخر: ' : 'Late: '}
                          <span className="text-warning">{formatNumber(attendance.late)}</span>
                        </small>
                        <small className="text-muted" style={{ fontSize: '0.55rem' }}>
                          {isArabic ? 'معذور: ' : 'Excused: '}
                          <span className="text-info">{formatNumber(attendance.excused)}</span>
                        </small>
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={() => handleViewStudent(student)}
                      className="w-100 mt-3"
                      style={{ 
                        ...arabicFontStyle, 
                        borderRadius: '12px',
                        fontSize: isMobile ? '0.75rem' : '0.85rem'
                      }}
                    >
                      <FaEye className="me-2" size={isMobile ? 12 : 14} />
                      {isArabic ? 'عرض التفاصيل' : 'View Details'}
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* ===== STUDENT DETAILS MODAL ===== */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg" centered className="modern-modal">
        <Modal.Header closeButton className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Modal.Title style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
            <FaUserGraduate className="me-2 text-primary" />
            {isArabic ? 'تفاصيل الطالب' : 'Student Details'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? '#0d1117' : 'white' }}>
          {selectedStudent && (
            <div>
              <div className="d-flex align-items-center gap-4 mb-4">
                <div className="student-avatar-lg" style={{
                  width: isMobile ? '60px' : '80px',
                  height: isMobile ? '60px' : '80px',
                  borderRadius: '50%',
                  background: 'rgba(74, 158, 255, 0.15)',
                  color: '#4a9eff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: isMobile ? '2rem' : '2.5rem',
                  flexShrink: 0,
                }}>
                  {(selectedStudent.name || selectedStudent.firstName || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h5 className="fw-bold mb-0" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                    {selectedStudent.name || selectedStudent.firstName || 'Unknown'}
                  </h5>
                  <p className="text-muted mb-0" style={arabicFontStyle}>
                    {isArabic ? 'المعرف: ' : 'ID: '}{selectedStudent.id}
                  </p>
                  {selectedStudent.email && (
                    <p className="text-muted mb-0" style={arabicFontStyle}>
                      <FaEnvelope className="me-1" size={12} /> {selectedStudent.email}
                    </p>
                  )}
                  {selectedStudent.phone && (
                    <p className="text-muted mb-0" style={arabicFontStyle}>
                      <FaPhone className="me-1" size={12} /> {selectedStudent.phone}
                    </p>
                  )}
                </div>
              </div>

              <Row className="g-3">
                <Col md={6}>
                  <div className="detail-item">
                    <label className="text-muted small" style={arabicFontStyle}>
                      <FaUser className="me-1" /> {isArabic ? 'الاسم الكامل' : 'Full Name'}
                    </label>
                    <p className="fw-semibold mb-0" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                      {selectedStudent.name || selectedStudent.firstName || 'N/A'}
                    </p>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="detail-item">
                    <label className="text-muted small" style={arabicFontStyle}>
                      <FaBook className="me-1" /> {isArabic ? 'الفصل' : 'Class'}
                    </label>
                    <p className="fw-semibold mb-0" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                      {selectedStudent.className || selectedStudent.class || 'N/A'}
                    </p>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="detail-item">
                    <label className="text-muted small" style={arabicFontStyle}>
                      <FaGraduationCap className="me-1" /> {isArabic ? 'المستوى' : 'Level'}
                    </label>
                    <p className="fw-semibold mb-0" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                      {getLevelDisplay(selectedStudent.level || selectedStudent.educationLevel)}
                    </p>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="detail-item">
                    <label className="text-muted small" style={arabicFontStyle}>
                      <FaCalendarAlt className="me-1" /> {isArabic ? 'تاريخ الميلاد' : 'Date of Birth'}
                    </label>
                    <p className="fw-semibold mb-0" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                      {selectedStudent.dateOfBirth || selectedStudent.dob || 'N/A'}
                    </p>
                  </div>
                </Col>
                {selectedStudent.address && (
                  <Col md={12}>
                    <div className="detail-item">
                      <label className="text-muted small" style={arabicFontStyle}>
                        <FaMapMarkerAlt className="me-1" /> {isArabic ? 'العنوان' : 'Address'}
                      </label>
                      <p className="fw-semibold mb-0" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                        {selectedStudent.address}
                      </p>
                    </div>
                  </Col>
                )}
                {selectedStudent.parentName && (
                  <Col md={12}>
                    <div className="detail-item">
                      <label className="text-muted small" style={arabicFontStyle}>
                        <FaUsers className="me-1" /> {isArabic ? 'ولي الأمر' : 'Parent/Guardian'}
                      </label>
                      <p className="fw-semibold mb-0" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                        {selectedStudent.parentName}
                        {selectedStudent.parentPhone && (
                          <span className="text-muted ms-2" style={arabicFontStyle}>
                            <FaPhone className="me-1" size={12} /> {selectedStudent.parentPhone}
                          </span>
                        )}
                      </p>
                    </div>
                  </Col>
                )}
              </Row>

              {/* ===== ATTENDANCE DETAILS IN MODAL ===== */}
              {selectedStudent.attendance && selectedStudent.attendance.total > 0 && (
                <>
                  <hr style={{ borderColor: darkMode ? '#2d2d44' : '#e9ecef' }} />
                  <h6 className="fw-bold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                    <FaChartBar className="me-2 text-primary" />
                    {isArabic ? 'ملخص الحضور' : 'Attendance Summary'}
                  </h6>
                  <Row className="g-2">
                    <Col xs={6} sm={3}>
                      <div className="text-center p-2 rounded-3" style={{ background: 'rgba(46, 204, 113, 0.1)' }}>
                        <div className="text-success fw-bold">{formatNumber(selectedStudent.attendance.present)}</div>
                        <small className="text-muted">{isArabic ? 'حاضر' : 'Present'}</small>
                      </div>
                    </Col>
                    <Col xs={6} sm={3}>
                      <div className="text-center p-2 rounded-3" style={{ background: 'rgba(231, 76, 60, 0.1)' }}>
                        <div className="text-danger fw-bold">{formatNumber(selectedStudent.attendance.absent)}</div>
                        <small className="text-muted">{isArabic ? 'غائب' : 'Absent'}</small>
                      </div>
                    </Col>
                    <Col xs={6} sm={3}>
                      <div className="text-center p-2 rounded-3" style={{ background: 'rgba(243, 156, 18, 0.1)' }}>
                        <div className="text-warning fw-bold">{formatNumber(selectedStudent.attendance.late)}</div>
                        <small className="text-muted">{isArabic ? 'متأخر' : 'Late'}</small>
                      </div>
                    </Col>
                    <Col xs={6} sm={3}>
                      <div className="text-center p-2 rounded-3" style={{ background: 'rgba(52, 152, 219, 0.1)' }}>
                        <div className="text-info fw-bold">{formatNumber(selectedStudent.attendance.excused)}</div>
                        <small className="text-muted">{isArabic ? 'معذور' : 'Excused'}</small>
                      </div>
                    </Col>
                  </Row>
                  <div className="mt-2">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-muted small">{isArabic ? 'نسبة الحضور الإجمالية' : 'Overall Attendance Rate'}</span>
                      <span className="fw-bold" style={{ 
                        color: selectedStudent.attendance.percentage >= 75 ? '#2ecc71' : selectedStudent.attendance.percentage >= 50 ? '#f39c12' : '#e74c3c'
                      }}>
                        {selectedStudent.attendance.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <ProgressBar 
                      now={selectedStudent.attendance.percentage} 
                      variant={selectedStudent.attendance.percentage >= 75 ? 'success' : selectedStudent.attendance.percentage >= 50 ? 'warning' : 'danger'}
                      style={{ height: '8px', borderRadius: '4px' }}
                    />
                    <small className="text-muted d-block mt-1" style={arabicFontStyle}>
                      {isArabic 
                        ? `إجمالي الأيام المسجلة: ${formatNumber(selectedStudent.attendance.total)}` 
                        : `Total recorded days: ${formatNumber(selectedStudent.attendance.total)}`}
                    </small>
                  </div>
                </>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)} style={{ ...arabicFontStyle, borderRadius: '12px' }}>
            {isArabic ? 'إغلاق' : 'Close'}
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@100..900&family=Vazirmatn:wght@100..900&display=swap');

        .teacher-students {
          padding: 0;
          max-width: 100vw;
          overflow-x: hidden;
        }

        .teacher-students * {
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

        .student-card {
          transition: all 0.3s ease;
        }

        .student-card-topbar {
          transition: height 0.3s ease;
        }

        .student-card:hover .student-card-topbar {
          height: 6px;
        }

        .student-avatar {
          transition: transform 0.3s ease;
        }

        .student-card:hover .student-avatar {
          transform: scale(1.1);
        }

        .student-avatar-lg {
          transition: transform 0.3s ease;
        }

        .student-avatar-lg:hover {
          transform: scale(1.05);
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

        .stat-card-mini {
          transition: all 0.3s ease;
        }

        .stat-card-mini:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }

        .student-details {
          transition: background 0.3s ease;
        }

        /* Progress bar styles */
        .progress {
          background-color: ${darkMode ? '#2d2d44' : '#e9ecef'};
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
        [dir="rtl"] .ps-5 {
          padding-left: 1rem !important;
          padding-right: 3rem !important;
        }
        [dir="rtl"] .start-0 {
          left: auto !important;
          right: 0 !important;
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
          .student-card .p-3 {
            padding: 12px !important;
          }
          .student-card h6 {
            font-size: 0.85rem !important;
          }
          .student-avatar {
            width: 36px !important;
            height: 36px !important;
            font-size: 1rem !important;
          }
          .student-details {
            padding: 8px 10px !important;
          }
          .student-details span {
            font-size: 0.7rem !important;
          }
          .modern-modal .modal-header {
            padding: 12px 16px 0 !important;
          }
          .modern-modal .modal-body {
            padding: 12px 16px 16px !important;
          }
          .modern-modal .modal-footer {
            padding: 8px 16px 16px !important;
          }
          .badge.d-flex {
            font-size: 0.45rem !important;
            padding: 2px 6px !important;
          }
        }

        @media (max-width: 400px) {
          .stat-number-mini {
            font-size: 1rem !important;
          }
          .stat-label-mini {
            font-size: 0.5rem !important;
          }
          .student-card .p-3 {
            padding: 8px !important;
          }
          .student-card h6 {
            font-size: 0.75rem !important;
          }
          .student-avatar {
            width: 32px !important;
            height: 32px !important;
            font-size: 0.85rem !important;
          }
          .student-details span {
            font-size: 0.65rem !important;
          }
          .badge.d-flex {
            font-size: 0.4rem !important;
            padding: 1px 4px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default TeacherStudents;