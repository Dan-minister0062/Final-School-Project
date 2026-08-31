// src/components/dashboard/teacher/TeacherAttendance.jsx
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Button, Badge, Table, Alert, ProgressBar } from 'react-bootstrap';
import { 
  FaSave, 
  FaUndo, 
  FaHistory, 
  FaCheckDouble, 
  FaUserGraduate,
  FaSync,
  FaExclamationTriangle,
  FaSpinner,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaUserCheck,
  FaChartBar,
  FaCalendarAlt,
  FaUsers,
  FaArrowRight,
} from 'react-icons/fa';
import { useLanguage } from '../../../context/LanguageContext';
import { useNotification } from '../../../hooks/useNotification';
import { teacherService } from '../../../services/teacherService';

// ===== ALWAYS use English numbers =====
const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  return num.toString();
};

const TeacherAttendance = () => {
  const { isArabic } = useLanguage();
  const { notify } = useNotification();
  const [darkMode, setDarkMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [teacher, setTeacher] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    total: 0,
    overallPresent: 0,
    overallAbsent: 0,
    overallLate: 0,
    overallExcused: 0,
    overallTotalDays: 0,
  });

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

  // ===== LOAD DATA =====
  const loadData = () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Loading teacher attendance data...');
      
      // Get current teacher
      const currentTeacher = teacherService.getCurrentTeacher();
      console.log('👨‍🏫 Current teacher:', currentTeacher);
      
      if (!currentTeacher) {
        setError(isArabic ? 'لم يتم العثور على المعلم' : 'Teacher not found');
        setLoading(false);
        return;
      }
      
      setTeacher(currentTeacher);
      
      // Get assigned classes
      const assignedClasses = teacherService.getAssignedClasses(currentTeacher.id);
      console.log('📚 Assigned classes:', assignedClasses.length);
      setClasses(assignedClasses);
      
      setLoading(false);
    } catch (err) {
      console.error('❌ Error loading data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // ===== LOAD ATTENDANCE =====
  const loadAttendance = () => {
    if (!selectedClass) {
      setError(isArabic ? 'الرجاء اختيار فصل أولاً' : 'Please select a class first');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log(`📚 Loading attendance for class: ${selectedClass} on ${selectedDate}`);
      
      // Get students for the selected class
      const allStudents = JSON.parse(localStorage.getItem('school_students') || '[]');
      console.log(`📚 All students: ${allStudents.length}`);
      
      const classStudents = allStudents.filter(s => 
        s.classId === selectedClass || s.class === selectedClass || s.class_name === selectedClass
      );
      console.log(`📚 Students in class: ${classStudents.length}`);
      
      setStudents(classStudents);

      // Get existing attendance record for this specific date
      const attendanceRecords = JSON.parse(localStorage.getItem('school_attendance') || '[]');
      const existingRecord = attendanceRecords.find(
        r => r.classId === selectedClass && r.date === selectedDate
      );
      
      if (existingRecord && existingRecord.students) {
        setAttendanceData(existingRecord.students);
        updateStats(existingRecord.students);
      } else {
        // Create new attendance record for this date
        const initialAttendance = classStudents.map(student => ({
          studentId: student.id,
          studentName: student.name || student.firstName || 'Unknown',
          status: 'present'
        }));
        setAttendanceData(initialAttendance);
        updateStats(initialAttendance);
      }
      
      // Calculate overall stats
      const overallStats = getOverallAttendanceStats();
      setAttendanceStats(prev => ({
        ...prev,
        overallPresent: overallStats.present,
        overallAbsent: overallStats.absent,
        overallLate: overallStats.late,
        overallExcused: overallStats.excused,
        overallTotalDays: overallStats.totalDays,
      }));
      
      setLoading(false);
    } catch (err) {
      console.error('❌ Error loading attendance:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // ===== UPDATE STATS =====
  const updateStats = (data) => {
    const stats = {
      present: data.filter(a => a.status === 'present').length,
      absent: data.filter(a => a.status === 'absent').length,
      late: data.filter(a => a.status === 'late').length,
      excused: data.filter(a => a.status === 'excused').length,
      total: data.length,
    };
    setAttendanceStats(prev => ({ ...prev, ...stats }));
  };

  // ===== CALCULATE OVERALL ATTENDANCE STATS =====
  const getOverallAttendanceStats = () => {
    try {
      const allRecords = JSON.parse(localStorage.getItem('school_attendance') || '[]');
      const classRecords = allRecords.filter(r => r.classId === selectedClass);
      
      if (classRecords.length === 0) {
        return { totalDays: 0, present: 0, absent: 0, late: 0, excused: 0 };
      }
      
      let present = 0;
      let absent = 0;
      let late = 0;
      let excused = 0;
      
      classRecords.forEach(record => {
        record.students.forEach(student => {
          switch (student.status) {
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
        });
      });
      
      return { totalDays: classRecords.length, present, absent, late, excused };
    } catch (err) {
      console.error('Error calculating overall stats:', err);
      return { totalDays: 0, present: 0, absent: 0, late: 0, excused: 0 };
    }
  };

  // ===== LOAD HISTORY =====
  const loadHistory = () => {
    try {
      const attendanceRecords = JSON.parse(localStorage.getItem('school_attendance') || '[]');
      let filteredHistory = attendanceRecords;
      
      if (selectedClass) {
        filteredHistory = filteredHistory.filter(r => r.classId === selectedClass);
      }
      
      // Sort by date (newest first)
      filteredHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      setHistory(filteredHistory.slice(0, 50));
    } catch (err) {
      console.error('Error loading history:', err);
      setError(err.message);
    }
  };

  // ===== EFFECTS =====
  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedDate) {
      loadAttendance();
    }
  }, [selectedClass, selectedDate]);

  useEffect(() => {
    if (showHistory) {
      loadHistory();
    }
  }, [showHistory, selectedClass]);

  // ===== HANDLE STATUS CHANGE =====
  const handleStatusChange = (studentId, status) => {
    setAttendanceData(prev => {
      const updated = prev.map(item => 
        item.studentId === studentId ? { ...item, status } : item
      );
      updateStats(updated);
      return updated;
    });
  };

  // ===== HANDLE MARK ALL PRESENT =====
  const handleMarkAllPresent = () => {
    setAttendanceData(prev => {
      const updated = prev.map(item => ({ ...item, status: 'present' }));
      updateStats(updated);
      return updated;
    });
  };

  // ===== HANDLE SAVE ATTENDANCE =====
  const handleSaveAttendance = () => {
    try {
      setSaving(true);
      setError(null);
      
      if (attendanceData.length === 0) {
        setError(isArabic ? 'لا يوجد طلاب لتسجيل الحضور' : 'No students to mark attendance');
        setSaving(false);
        return;
      }

      // Get existing attendance records
      let attendanceRecords = JSON.parse(localStorage.getItem('school_attendance') || '[]');
      
      // Check if a record exists for this class and date
      const existingIndex = attendanceRecords.findIndex(
        r => r.classId === selectedClass && r.date === selectedDate
      );
      
      const record = {
        classId: selectedClass,
        date: selectedDate,
        students: attendanceData.map(s => ({
          studentId: s.studentId,
          studentName: s.studentName,
          status: s.status
        })),
        teacherId: teacher?.id,
        teacherName: teacher?.name || teacher?.firstName || 'Unknown',
        updatedAt: new Date().toISOString(),
      };
      
      if (existingIndex !== -1) {
        // Update existing record - this OVERWRITES the attendance for that day
        attendanceRecords[existingIndex] = { 
          ...attendanceRecords[existingIndex], 
          ...record,
          createdAt: attendanceRecords[existingIndex].createdAt || new Date().toISOString(),
        };
        console.log(`✅ Updated attendance for ${selectedDate}`);
      } else {
        // Create new record - this ADDS a new day's attendance
        record.createdAt = new Date().toISOString();
        attendanceRecords.push(record);
        console.log(`✅ Created new attendance for ${selectedDate}`);
      }
      
      localStorage.setItem('school_attendance', JSON.stringify(attendanceRecords));
      
      // Calculate stats for this day
      const presentCount = attendanceData.filter(a => a.status === 'present').length;
      const totalCount = attendanceData.length;
      
      setSuccess(
        isArabic 
          ? `✅ تم تسجيل الحضور بنجاح (${presentCount}/${totalCount} طالب)`
          : `✅ Attendance saved successfully (${presentCount}/${totalCount} students)`
      );
      
      // Send notification
      sendAttendanceNotification(selectedClass, presentCount, totalCount);
      
      setTimeout(() => setSuccess(''), 4000);
      setSaving(false);
      
      if (showHistory) {
        loadHistory();
      }
      
      notify(
        isArabic ? 'تم حفظ الحضور بنجاح' : 'Attendance saved successfully',
        'success'
      );
      
      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent('attendanceUpdated', { 
        detail: { classId: selectedClass, date: selectedDate, students: attendanceData }
      }));
      
    } catch (err) {
      console.error('❌ Error saving attendance:', err);
      setError(err.message);
      setSaving(false);
    }
  };

  // ===== SEND ATTENDANCE NOTIFICATION =====
  const sendAttendanceNotification = (classId, present, total) => {
    try {
      const className = classes.find(c => c.id === classId)?.name || 'Unknown';
      const notifications = JSON.parse(localStorage.getItem('school_notifications') || '[]');
      
      // Find parents of absent/late students
      const absentStudents = attendanceData
        .filter(a => a.status === 'absent' || a.status === 'late')
        .map(a => {
          const student = students.find(s => s.id === a.studentId);
          return student?.parentId || student?.parent;
        })
        .filter(Boolean);
      
      // Send notification to teacher
      const notification = {
        id: `NOT${String(notifications.length + 1).padStart(3, '0')}`,
        title: '📊 Attendance Recorded',
        message: `Attendance for ${className} on ${selectedDate}: ${present}/${total} students present`,
        type: 'attendance',
        read: false,
        recipientRole: 'teacher',
        recipientId: teacher?.id,
        createdAt: new Date().toISOString(),
        time: new Date().toLocaleString(),
        link: '/dashboard/teacher/attendance',
      };
      notifications.push(notification);
      
      // Send notifications to parents of absent/late students
      absentStudents.forEach(parentId => {
        const student = students.find(s => s.parentId === parentId || s.parent === parentId);
        if (student) {
          const status = attendanceData.find(a => a.studentId === student.id)?.status || 'absent';
          const parentNotification = {
            id: `NOT${String(notifications.length + 1).padStart(3, '0')}`,
            title: '📊 Student Attendance Alert',
            message: `Your child ${student.name || student.firstName || 'Unknown'} was ${getStatusLabel(status)} on ${selectedDate}`,
            type: 'attendance',
            read: false,
            recipientRole: 'parent',
            recipientId: parentId,
            studentId: student.id,
            createdAt: new Date().toISOString(),
            time: new Date().toLocaleString(),
            link: '/dashboard/parent/child-results',
          };
          notifications.push(parentNotification);
        }
      });
      
      localStorage.setItem('school_notifications', JSON.stringify(notifications));
      
      // Dispatch events
      window.dispatchEvent(new CustomEvent('notificationAdded'));
      
    } catch (err) {
      console.error('Error sending attendance notification:', err);
    }
  };

  // ===== HANDLE RESET =====
  const handleReset = () => {
    if (window.confirm(isArabic ? 'هل أنت متأكد من إعادة تعيين النموذج؟' : 'Are you sure you want to reset?')) {
      loadAttendance();
    }
  };

  // ===== HANDLE REFRESH =====
  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
    if (selectedClass) {
      loadAttendance();
    }
    setTimeout(() => {
      setRefreshing(false);
      notify(
        isArabic ? 'تم تحديث البيانات' : 'Data refreshed',
        'info'
      );
    }, 800);
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
  if (loading && classes.length === 0) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted" style={arabicFontStyle}>
          {isArabic ? 'جاري تحميل البيانات...' : 'Loading data...'}
        </p>
      </div>
    );
  }

  if (error && classes.length === 0) {
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

  return (
    <div className="teacher-attendance" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* ===== PAGE HEADER ===== */}
      <div className="d-flex flex-wrap flex-sm-nowrap justify-content-between align-items-center gap-2 gap-md-3 mb-3 mb-md-4">
        <div className="flex-grow-1 min-width-0">
          <h4 className="fw-bold mb-0 mb-sm-1" style={{ 
            ...arabicFontStyle, 
            color: '#4a9eff', 
            fontSize: isArabic ? 'clamp(1rem, 2vw, 1.5rem)' : 'clamp(0.95rem, 1.8vw, 1.4rem)' 
          }}>
            <FaCalendarAlt className="me-2" /> 
            {isArabic ? 'تسجيل الحضور' : 'Attendance'}
          </h4>
          <p className="text-muted mb-0 d-none d-sm-block" style={{ 
            ...arabicFontStyle, 
            fontSize: isArabic ? 'clamp(0.8rem, 1vw, 0.95rem)' : 'clamp(0.75rem, 0.9vw, 0.9rem)' 
          }}>
            {isArabic 
              ? `تسجيل ومتابعة حضور الطلاب (${formatNumber(classes.length)} فصول)`
              : `Record and track student attendance (${formatNumber(classes.length)} classes)`}
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
          <Button 
            variant="outline-info" 
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            style={{ 
              ...arabicFontStyle, 
              borderRadius: '12px',
              fontSize: isArabic ? 'clamp(0.65rem, 0.8vw, 0.85rem)' : 'clamp(0.6rem, 0.75vw, 0.8rem)',
              padding: isMobile ? '4px 8px' : '4px 12px'
            }}
          >
            <FaHistory className="me-1" /> 
            {showHistory ? (isArabic ? 'إخفاء السجل' : 'Hide History') : (isArabic ? 'عرض السجل' : 'View History')}
          </Button>
        </div>
      </div>

      {/* ===== STATS SUMMARY ===== */}
      {selectedClass && students.length > 0 && (
        <Row className="g-2 g-sm-3 mb-3 mb-md-4">
          <Col xs={6} sm={3}>
            <div className="stat-card-mini" style={{ 
              background: darkMode ? '#1a1a2e' : '#ffffff',
              border: `1px solid ${darkMode ? '#2d2d44' : '#e9ecef'}`,
              borderRadius: '12px',
              padding: '12px 16px',
              textAlign: 'center'
            }}>
              <div className="stat-number-mini" style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2ecc71' }}>
                {formatNumber(attendanceStats.present)}
              </div>
              <div className="stat-label-mini" style={{ fontSize: '0.7rem', color: '#6c757d' }}>
                <FaCheckCircle className="me-1 text-success" size={12} />
                {isArabic ? 'حاضر' : 'Present'}
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
              <div className="stat-number-mini" style={{ fontSize: '1.5rem', fontWeight: '700', color: '#e74c3c' }}>
                {formatNumber(attendanceStats.absent)}
              </div>
              <div className="stat-label-mini" style={{ fontSize: '0.7rem', color: '#6c757d' }}>
                <FaTimesCircle className="me-1 text-danger" size={12} />
                {isArabic ? 'غائب' : 'Absent'}
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
                {formatNumber(attendanceStats.late)}
              </div>
              <div className="stat-label-mini" style={{ fontSize: '0.7rem', color: '#6c757d' }}>
                <FaClock className="me-1 text-warning" size={12} />
                {isArabic ? 'متأخر' : 'Late'}
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
                {formatNumber(attendanceStats.excused)}
              </div>
              <div className="stat-label-mini" style={{ fontSize: '0.7rem', color: '#6c757d' }}>
                <FaUserCheck className="me-1 text-info" size={12} />
                {isArabic ? 'معذور' : 'Excused'}
              </div>
            </div>
          </Col>
        </Row>
      )}

      {/* ===== OVERALL ATTENDANCE STATS ===== */}
      {selectedClass && students.length > 0 && attendanceStats.overallTotalDays > 0 && (
        <div className="overall-attendance-stats mb-3 p-3 rounded-3" style={{
          background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
          border: `1px solid ${darkMode ? '#2d2d44' : '#e9ecef'}`,
          borderRadius: '12px',
        }}>
          <h6 className="fw-bold mb-2" style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
            <FaChartBar className="me-2" />
            {isArabic ? 'إحصائيات الحضور الإجمالية' : 'Overall Attendance Statistics'}
          </h6>
          <Row className="g-2">
            <Col xs={6} sm={3}>
              <div className="text-center p-2 rounded-3" style={{ background: 'rgba(46, 204, 113, 0.1)' }}>
                <div className="text-success fw-bold">{formatNumber(attendanceStats.overallPresent)}</div>
                <small className="text-muted">{isArabic ? 'حاضر' : 'Present'}</small>
              </div>
            </Col>
            <Col xs={6} sm={3}>
              <div className="text-center p-2 rounded-3" style={{ background: 'rgba(231, 76, 60, 0.1)' }}>
                <div className="text-danger fw-bold">{formatNumber(attendanceStats.overallAbsent)}</div>
                <small className="text-muted">{isArabic ? 'غائب' : 'Absent'}</small>
              </div>
            </Col>
            <Col xs={6} sm={3}>
              <div className="text-center p-2 rounded-3" style={{ background: 'rgba(243, 156, 18, 0.1)' }}>
                <div className="text-warning fw-bold">{formatNumber(attendanceStats.overallLate)}</div>
                <small className="text-muted">{isArabic ? 'متأخر' : 'Late'}</small>
              </div>
            </Col>
            <Col xs={6} sm={3}>
              <div className="text-center p-2 rounded-3" style={{ background: 'rgba(52, 152, 219, 0.1)' }}>
                <div className="text-info fw-bold">{formatNumber(attendanceStats.overallExcused)}</div>
                <small className="text-muted">{isArabic ? 'معذور' : 'Excused'}</small>
              </div>
            </Col>
          </Row>
          <div className="mt-2">
            <small className="text-muted" style={arabicFontStyle}>
              {isArabic 
                ? `إجمالي أيام الحضور المسجلة: ${formatNumber(attendanceStats.overallTotalDays)}` 
                : `Total attendance days recorded: ${formatNumber(attendanceStats.overallTotalDays)}`}
            </small>
          </div>
        </div>
      )}

      {/* ===== ERROR/SUCCESS MESSAGES ===== */}
      {error && (
        <Alert variant="danger" className="mb-3" style={arabicFontStyle}>
          <FaExclamationTriangle className="me-2" />
          {error}
          <Button variant="outline-danger" size="sm" className="ms-2" onClick={() => setError(null)}>
            {isArabic ? 'إغلاق' : 'Close'}
          </Button>
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" className="mb-3" style={arabicFontStyle}>
          <FaCheckCircle className="me-2" />
          {success}
          <Button variant="outline-success" size="sm" className="ms-2" onClick={() => setSuccess('')}>
            {isArabic ? 'إغلاق' : 'Close'}
          </Button>
        </Alert>
      )}

      {/* ===== ATTENDANCE FORM ===== */}
      <Card className="modern-card mb-4" style={{ background: darkMode ? '#1a1a2e' : '#ffffff', borderColor: darkMode ? '#2d2d44' : '#e9ecef' }}>
        <Card.Body className="p-3 p-md-4">
          <Row className="g-2 g-md-3 mb-3">
            <Col xs={12} sm={6} md={4}>
              <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                <FaUsers className="me-2" />
                {isArabic ? 'اختر الفصل' : 'Select Class'}
              </Form.Label>
              <Form.Select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                style={{
                  ...arabicFontStyle,
                  background: darkMode ? '#2d2d44' : 'white',
                  color: darkMode ? '#e9ecef' : '#212529',
                  borderRadius: '12px',
                  borderColor: darkMode ? '#2d2d44' : '#e9ecef',
                }}
              >
                <option value="">{isArabic ? 'اختر فصل' : 'Select a class'}</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} 
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={12} sm={6} md={3}>
              <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                <FaCalendarAlt className="me-2" />
                {isArabic ? 'التاريخ' : 'Date'}
              </Form.Label>
              <Form.Control
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                  ...arabicFontStyle,
                  background: darkMode ? '#2d2d44' : 'white',
                  color: darkMode ? '#e9ecef' : '#212529',
                  borderRadius: '12px',
                  borderColor: darkMode ? '#2d2d44' : '#e9ecef',
                }}
              />
            </Col>
            <Col xs={6} md={3} className="d-flex align-items-end">
              <Button 
                variant="primary" 
                onClick={loadAttendance}
                disabled={!selectedClass || loading}
                className="w-100"
                style={{
                  ...arabicFontStyle,
                  borderRadius: '12px',
                  fontSize: isMobile ? '0.75rem' : '0.85rem',
                }}
              >
                {loading ? (
                  <>
                    <FaSpinner className="spinning me-2" />
                    {isArabic ? 'جاري التحميل...' : 'Loading...'}
                  </>
                ) : (
                  <>{isArabic ? 'تحميل' : 'Load'}</>
                )}
              </Button>
            </Col>
            <Col xs={6} md={2} className="d-flex align-items-end">
              <Button 
                variant="success" 
                onClick={handleSaveAttendance}
                disabled={saving || !selectedClass || students.length === 0}
                className="w-100"
                style={{
                  ...arabicFontStyle,
                  borderRadius: '12px',
                  fontSize: isMobile ? '0.75rem' : '0.85rem',
                }}
              >
                {saving ? (
                  <>
                    <FaSpinner className="spinning me-2" />
                    {isArabic ? 'جاري الحفظ...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <FaSave className="me-1" /> {isArabic ? 'حفظ' : 'Save'}
                  </>
                )}
              </Button>
            </Col>
          </Row>

          {/* ===== MARK ALL PRESENT BUTTON ===== */}
          {selectedClass && students.length > 0 && (
            <div className="d-flex flex-wrap gap-2 gap-md-3 mb-3">
              <Button 
                variant="outline-success" 
                size="sm"
                onClick={handleMarkAllPresent}
                style={{
                  ...arabicFontStyle,
                  borderRadius: '12px',
                  fontSize: isMobile ? '0.7rem' : '0.8rem',
                }}
              >
                <FaCheckDouble className="me-1" />
                {isArabic ? 'تحديد الكل حاضر' : 'Mark All Present'}
              </Button>
              <Button 
                variant="outline-secondary" 
                size="sm"
                onClick={handleReset}
                disabled={!selectedClass}
                style={{
                  ...arabicFontStyle,
                  borderRadius: '12px',
                  fontSize: isMobile ? '0.7rem' : '0.8rem',
                }}
              >
                <FaUndo className="me-1" />
                {isArabic ? 'إعادة تعيين' : 'Reset'}
              </Button>
              <span className="text-muted d-flex align-items-center" style={arabicFontStyle}>
                <FaUserGraduate className="me-1" />
                {isArabic ? 'إجمالي الطلاب: ' : 'Total Students: '}
                <strong className="ms-1">{formatNumber(students.length)}</strong>
              </span>
              <span className="text-success d-flex align-items-center" style={arabicFontStyle}>
                <FaCheckCircle className="me-1" />
                {isArabic ? 'حاضر: ' : 'Present: '}
                <strong className="ms-1">{formatNumber(attendanceStats.present)}</strong>
              </span>
              <span className="text-danger d-flex align-items-center" style={arabicFontStyle}>
                <FaTimesCircle className="me-1" />
                {isArabic ? 'غائب: ' : 'Absent: '}
                <strong className="ms-1">{formatNumber(attendanceStats.absent)}</strong>
              </span>
              <span className="text-warning d-flex align-items-center" style={arabicFontStyle}>
                <FaClock className="me-1" />
                {isArabic ? 'متأخر: ' : 'Late: '}
                <strong className="ms-1">{formatNumber(attendanceStats.late)}</strong>
              </span>
              <span className="text-info d-flex align-items-center" style={arabicFontStyle}>
                <FaUserCheck className="me-1" />
                {isArabic ? 'معذور: ' : 'Excused: '}
                <strong className="ms-1">{formatNumber(attendanceStats.excused)}</strong>
              </span>
            </div>
          )}

          {/* ===== STUDENTS TABLE ===== */}
          {selectedClass && students.length > 0 && !loading && (
            <div className="table-responsive">
              <Table hover className="attendance-table mb-0" style={arabicFontStyle}>
                <thead style={{ background: darkMode ? '#0d1117' : '#f8f9fa' }}>
                  <tr>
                    <th style={{ color: darkMode ? '#e9ecef' : '#212529', width: '50px' }}>#</th>
                    <th style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{isArabic ? 'اسم الطالب' : 'Student Name'}</th>
                    <th style={{ color: darkMode ? '#e9ecef' : '#212529' }} className="d-none d-sm-table-cell">{isArabic ? 'المعرف' : 'Student ID'}</th>
                    <th style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{isArabic ? 'الحالة' : 'Status'}</th>
                    <th style={{ color: darkMode ? '#e9ecef' : '#212529' }} className="text-center">{isArabic ? 'الإجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, index) => {
                    const attendance = attendanceData.find(a => a.studentId === student.id);
                    
                    return (
                      <tr key={student.id}>
                        <td style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                          {formatNumber(index + 1)}
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="student-avatar-sm" style={{
                              width: isMobile ? '28px' : '32px',
                              height: isMobile ? '28px' : '32px',
                              borderRadius: '50%',
                              background: `linear-gradient(135deg, ${getStatusBadge(attendance?.status || 'present') === 'success' ? '#2ecc71' : getStatusBadge(attendance?.status || 'present') === 'danger' ? '#e74c3c' : getStatusBadge(attendance?.status || 'present') === 'warning' ? '#f39c12' : '#3498db'}, ${getStatusBadge(attendance?.status || 'present') === 'success' ? '#27ae60' : getStatusBadge(attendance?.status || 'present') === 'danger' ? '#c0392b' : getStatusBadge(attendance?.status || 'present') === 'warning' ? '#e67e22' : '#2980b9'})`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: '700',
                              fontSize: isMobile ? '0.6rem' : '0.75rem',
                              flexShrink: 0,
                            }}>
                              {(student.name || student.firstName || 'U').charAt(0).toUpperCase()}
                            </div>
                            <span style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                              {student.name || student.firstName || 'Unknown'}
                            </span>
                          </div>
                        </td>
                        <td className="d-none d-sm-table-cell" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                          {student.id}
                        </td>
                        <td>
                          <Badge bg={getStatusBadge(attendance?.status || 'present')}>
                            {getStatusIcon(attendance?.status || 'present')} {getStatusLabel(attendance?.status || 'present')}
                          </Badge>
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm" role="group" style={{ flexWrap: isMobile ? 'wrap' : 'nowrap', gap: isMobile ? '2px' : '0' }}>
                            {['present', 'absent', 'late', 'excused'].map(status => (
                              <Button
                                key={status}
                                variant={attendance?.status === status ? getStatusBadge(status) : 'outline-secondary'}
                                className={attendance?.status === status ? 'active' : ''}
                                onClick={() => handleStatusChange(student.id, status)}
                                size={isMobile ? 'sm' : 'sm'}
                                style={{
                                  fontSize: isMobile ? '0.5rem' : '0.65rem',
                                  padding: isMobile ? '2px 4px' : '4px 8px',
                                  borderRadius: '4px',
                                  border: attendance?.status === status ? 'none' : '1px solid #dee2e6',
                                }}
                              >
                                {isMobile ? getStatusLabel(status).substring(0, 2) : getStatusLabel(status)}
                              </Button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}

          {/* ===== EMPTY STATES ===== */}
          {selectedClass && students.length === 0 && !loading && (
            <div className="text-center py-4">
              <FaUserGraduate size={48} className="text-muted opacity-25 mb-3" />
              <p className="text-muted" style={arabicFontStyle}>
                {isArabic ? 'لا يوجد طلاب في هذا الفصل' : 'No students in this class'}
              </p>
              <Button 
                variant="outline-primary" 
                size="sm"
                onClick={() => window.location.href = '/dashboard/teacher/my-students'}
                style={{ ...arabicFontStyle, borderRadius: '12px' }}
              >
                <FaArrowRight className="me-2" />
                {isArabic ? 'عرض طلابي' : 'View My Students'}
              </Button>
            </div>
          )}

          {!selectedClass && (
            <div className="text-center py-4">
              <FaUsers size={48} className="text-muted opacity-25 mb-3" />
              <p className="text-muted" style={arabicFontStyle}>
                {isArabic ? 'الرجاء اختيار فصل لعرض الطلاب' : 'Please select a class to view students'}
              </p>
              {classes.length === 0 && (
                <p className="text-muted small" style={arabicFontStyle}>
                  {isArabic ? 'لا توجد فصول مكلف بها' : 'No classes assigned'}
                </p>
              )}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* ===== ATTENDANCE HISTORY ===== */}
      {showHistory && (
        <Card className="modern-card" style={{ background: darkMode ? '#1a1a2e' : '#ffffff', borderColor: darkMode ? '#2d2d44' : '#e9ecef' }}>
          <Card.Header className="modern-card-header" style={{ borderColor: darkMode ? '#2d2d44' : '#e9ecef' }}>
            <h6 className="fw-bold mb-0" style={{ ...arabicFontStyle, color: '#4a9eff' }}>
              <FaHistory className="me-2" />
              {isArabic ? 'سجل الحضور' : 'Attendance History'}
            </h6>
          </Card.Header>
          <Card.Body className="p-0">
            {history.length > 0 ? (
              <div className="table-responsive">
                <Table hover className="mb-0" style={arabicFontStyle}>
                  <thead style={{ background: darkMode ? '#0d1117' : '#f8f9fa' }}>
                    <tr>
                      <th style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{isArabic ? 'التاريخ' : 'Date'}</th>
                      <th style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{isArabic ? 'الفصل' : 'Class'}</th>
                      <th style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{isArabic ? 'الطالب' : 'Student'}</th>
                      <th style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{isArabic ? 'الحالة' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.slice(0, 20).map((record, index) => (
                      record.students && record.students.map((student, sIndex) => (
                        <tr key={`${index}-${sIndex}`}>
                          <td style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                            {new Date(record.date).toLocaleDateString()}
                          </td>
                          <td style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                            {classes.find(c => c.id === record.classId)?.name || 'N/A'}
                          </td>
                          <td style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                            {student.studentName || 'Unknown'}
                          </td>
                          <td>
                            <Badge bg={getStatusBadge(student.status)}>
                              {getStatusIcon(student.status)} {getStatusLabel(student.status)}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    ))}
                  </tbody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-4">
                <FaHistory size={48} className="text-muted opacity-25 mb-3" />
                <p className="text-muted" style={arabicFontStyle}>
                  {isArabic ? 'لا توجد سجلات حضور' : 'No attendance records found'}
                </p>
                {selectedClass && (
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={() => window.location.href = '/dashboard/teacher/attendance'}
                    style={{ ...arabicFontStyle, borderRadius: '12px' }}
                  >
                    <FaCalendarAlt className="me-2" />
                    {isArabic ? 'تسجيل حضور جديد' : 'Record New Attendance'}
                  </Button>
                )}
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@100..900&family=Vazirmatn:wght@100..900&display=swap');

        .teacher-attendance {
          padding: 0;
          max-width: 100vw;
          overflow-x: hidden;
        }

        .teacher-attendance * {
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

        .modern-card {
          border-radius: 16px !important;
          border: 1px solid ${darkMode ? '#2d2d44' : '#e9ecef'} !important;
          transition: all 0.3s ease;
          overflow: hidden;
          background: ${darkMode ? '#1a1a2e' : '#ffffff'} !important;
        }

        .modern-card-header {
          background: transparent;
          border-bottom: 1px solid ${darkMode ? '#2d2d44' : '#e9ecef'};
          padding: 12px 16px;
        }

        .stat-card-mini {
          transition: all 0.3s ease;
        }

        .stat-card-mini:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }

        .stat-number-mini {
          transition: color 0.3s ease;
        }

        .stat-card-mini:hover .stat-number-mini {
          transform: scale(1.05);
        }

        .attendance-table th,
        .attendance-table td {
          vertical-align: middle;
        }

        .attendance-table tbody tr {
          transition: background-color 0.2s;
        }

        .attendance-table tbody tr:hover {
          background-color: rgba(0,0,0,0.02);
        }

        .student-avatar-sm {
          transition: transform 0.3s ease;
        }

        .student-avatar-sm:hover {
          transform: scale(1.15);
        }

        .btn-group .btn {
          transition: all 0.2s ease;
        }

        .btn-group .btn:hover {
          transform: scale(1.05);
        }

        .btn-group .btn.active {
          transform: scale(1.05);
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }

        .overall-attendance-stats {
          transition: all 0.3s ease;
        }

        .overall-attendance-stats:hover {
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
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

        /* ===== RESPONSIVE ===== */
        @media (max-width: 768px) {
          .stat-card-mini {
            padding: 8px 12px !important;
          }
          .stat-number-mini {
            font-size: 1.2rem !important;
          }
          .stat-label-mini {
            font-size: 0.6rem !important;
          }
          .attendance-table {
            font-size: 0.75rem !important;
          }
          .attendance-table .btn-group .btn {
            font-size: 0.5rem !important;
            padding: 2px 4px !important;
          }
          .modern-card .p-3 {
            padding: 12px !important;
          }
          .modern-card .p-4 {
            padding: 16px !important;
          }
          .overall-attendance-stats {
            padding: 12px !important;
          }
        }

        @media (max-width: 576px) {
          .stat-number-mini {
            font-size: 1rem !important;
          }
          .stat-label-mini {
            font-size: 0.5rem !important;
          }
          .stat-label-mini .me-1 {
            margin-right: 0 !important;
            margin-left: 2px !important;
          }
          [dir="rtl"] .stat-label-mini .me-1 {
            margin-left: 0 !important;
            margin-right: 2px !important;
          }
          .attendance-table td .btn-group {
            gap: 2px !important;
          }
          .attendance-table td .btn-group .btn {
            font-size: 0.45rem !important;
            padding: 1px 3px !important;
            min-width: 20px !important;
          }
          .modern-card .d-flex.flex-wrap {
            gap: 4px !important;
          }
          .modern-card .d-flex.flex-wrap .btn {
            font-size: 0.6rem !important;
            padding: 3px 6px !important;
          }
          .modern-card .d-flex.flex-wrap span {
            font-size: 0.6rem !important;
          }
          .overall-attendance-stats .row .col-6 {
            padding: 2px !important;
          }
          .overall-attendance-stats .text-center {
            padding: 4px !important;
          }
        }

        @media (max-width: 400px) {
          .stat-number-mini {
            font-size: 0.85rem !important;
          }
          .stat-label-mini {
            font-size: 0.45rem !important;
          }
          .attendance-table td .btn-group .btn {
            font-size: 0.4rem !important;
            padding: 1px 2px !important;
            min-width: 16px !important;
          }
          .attendance-table td .d-flex.align-items-center.gap-2 .student-avatar-sm {
            width: 22px !important;
            height: 22px !important;
            font-size: 0.5rem !important;
          }
          .attendance-table td span {
            font-size: 0.65rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default TeacherAttendance;