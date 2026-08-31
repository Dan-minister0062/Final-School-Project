// src/components/dashboard/student/StudentResults.jsx
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Badge, Table, Modal, ProgressBar } from 'react-bootstrap';
import {
  FaGraduationCap,
  FaFileAlt,
  FaCheckCircle,
  FaClock,
  FaSync,
  FaExclamationTriangle,
  FaChartBar,
  FaBook,
  FaUsers,
  FaCalendarAlt,
  FaDownload,
  FaPrint,
  FaEye,
} from 'react-icons/fa';
import { useLanguage } from '../../../context/LanguageContext';
import { useNotification } from '../../../hooks/useNotification';

// ===== ALWAYS use English numbers =====
const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  return num.toString();
};

const StudentResults = () => {
  const { isArabic } = useLanguage();
  const { notify } = useNotification();
  const [darkMode, setDarkMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [student, setStudent] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [filteredAssessments, setFilteredAssessments] = useState([]);
  const [stats, setStats] = useState({
    totalAssessments: 0,
    gradedAssessments: 0,
    averageScore: 0,
    highestScore: 0,
    lowestScore: 0,
    totalMarks: 0,
    earnedMarks: 0,
  });
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

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

  // ===== LOAD STUDENT DATA =====
  const loadData = () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Loading student results data...');
      
      // Get current user from localStorage
      const currentUserStr = localStorage.getItem('currentUser');
      if (!currentUserStr) {
        setError(isArabic ? 'لم يتم العثور على المستخدم' : 'User not found');
        setLoading(false);
        return;
      }

      const currentUser = JSON.parse(currentUserStr);
      console.log('👨‍🎓 Current user:', currentUser);

      if (currentUser.role !== 'student') {
        setError(isArabic ? 'هذه الصفحة مخصصة للطلاب فقط' : 'This page is for students only');
        setLoading(false);
        return;
      }

      setStudent(currentUser);

      // Get all assessments from localStorage
      const allAssessments = JSON.parse(localStorage.getItem('school_assessments') || '[]');
      console.log('📝 All assessments:', allAssessments.length);

      // Get classes from localStorage
      const allClasses = JSON.parse(localStorage.getItem('school_classes') || '[]');
      console.log('📚 All classes:', allClasses.length);

      // Find student's class
      const studentClass = allClasses.find(c => c.id === currentUser.classId || c.id === currentUser.class);
      console.log('📚 Student class:', studentClass);

      // Filter assessments for student's class
      const classAssessments = allAssessments.filter(a => {
        // Check if assessment is for student's class
        const isForClass = a.classId === currentUser.classId || a.classId === currentUser.class;
        
        // Check if student is specifically assigned (if assignedStudents exists)
        const isAssigned = a.assignedStudents ? a.assignedStudents.includes(currentUser.id) : true;
        
        // Only show published or graded assessments
        const isPublished = a.status === 'published' || a.status === 'closed' || a.status === 'pending_marking';
        
        return isForClass && isAssigned && isPublished;
      });

      console.log('📝 Student assessments:', classAssessments.length);

      // Enrich assessments with class name and student's grade
      const enrichedAssessments = classAssessments.map(a => {
        const classInfo = allClasses.find(c => c.id === a.classId);
        const studentGrade = a.grades?.find(g => g.studentId === currentUser.id);
        return {
          ...a,
          className: classInfo?.name || a.className || 'N/A',
          studentScore: studentGrade?.score || null,
          studentGrade: studentGrade,
          isGraded: !!studentGrade,
        };
      });

      setAssessments(enrichedAssessments);
      setFilteredAssessments(enrichedAssessments);

      // Calculate statistics
      calculateStats(enrichedAssessments);

      setLoading(false);
    } catch (err) {
      console.error('❌ Error loading results:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // ===== CALCULATE STATISTICS =====
  const calculateStats = (assessmentsData) => {
    const graded = assessmentsData.filter(a => a.isGraded);
    const totalAssessments = assessmentsData.length;
    const gradedAssessments = graded.length;
    
    // Calculate average score
    let avgScore = 0;
    let highestScore = 0;
    let lowestScore = 100;
    let totalEarned = 0;
    let totalMax = 0;

    graded.forEach(a => {
      const score = a.studentScore || 0;
      const maxScore = a.totalMarks || 100;
      const percentage = (score / maxScore) * 100;
      
      totalEarned += score;
      totalMax += maxScore;
      
      if (percentage > highestScore) highestScore = percentage;
      if (percentage < lowestScore) lowestScore = percentage;
    });

    avgScore = graded.length > 0 ? (totalEarned / totalMax) * 100 : 0;

    setStats({
      totalAssessments,
      gradedAssessments,
      averageScore: avgScore,
      highestScore: highestScore === 100 ? 0 : highestScore,
      lowestScore: lowestScore === 100 ? 0 : lowestScore,
      totalMarks: totalMax,
      earnedMarks: totalEarned,
    });
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

  // ===== APPLY FILTERS =====
  useEffect(() => {
    let filtered = [...assessments];

    if (subjectFilter !== 'all') {
      filtered = filtered.filter(a => a.subject === subjectFilter);
    }

    if (statusFilter === 'graded') {
      filtered = filtered.filter(a => a.isGraded);
    } else if (statusFilter === 'pending') {
      filtered = filtered.filter(a => !a.isGraded);
    }

    setFilteredAssessments(filtered);
  }, [assessments, subjectFilter, statusFilter]);

  // ===== GET UNIQUE SUBJECTS =====
  const getUniqueSubjects = () => {
    const subjects = new Set(assessments.map(a => a.subject).filter(Boolean));
    return Array.from(subjects);
  };

  // ===== GET STATUS BADGE =====
  const getStatusBadge = (assessment) => {
    if (assessment.isGraded) {
      const percentage = (assessment.studentScore / assessment.totalMarks) * 100;
      if (percentage >= 90) return { color: 'success', label: isArabic ? 'ممتاز' : 'Excellent' };
      if (percentage >= 75) return { color: 'primary', label: isArabic ? 'جيد جداً' : 'Very Good' };
      if (percentage >= 60) return { color: 'info', label: isArabic ? 'جيد' : 'Good' };
      if (percentage >= 50) return { color: 'warning', label: isArabic ? 'مقبول' : 'Pass' };
      return { color: 'danger', label: isArabic ? 'ضعيف' : 'Needs Improvement' };
    }
    return { color: 'secondary', label: isArabic ? 'بانتظار التصحيح' : 'Pending' };
  };

  // ===== FORMAT DATE =====
  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString(isArabic ? 'ar-TN' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  // ===== SETUP EFFECT =====
  useEffect(() => {
    loadData();

    // Listen for storage changes
    const handleStorageChange = (e) => {
      if (e.key === "school_assessments") {
        console.log("🔄 Assessments changed, refreshing results");
        loadData();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // Listen for custom events
    const handleAssessmentChanged = () => {
      console.log("📝 Assessment changed, refreshing results");
      loadData();
    };
    window.addEventListener("assessmentChanged", handleAssessmentChanged);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("assessmentChanged", handleAssessmentChanged);
    };
  }, []);

  // ===== RENDER STATES =====
  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted" style={arabicFontStyle}>
          {isArabic ? 'جاري تحميل النتائج...' : 'Loading results...'}
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

  // ===== RENDER =====
  return (
    <div className="student-results" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* ===== PAGE HEADER ===== */}
      <div className="d-flex flex-wrap flex-sm-nowrap justify-content-between align-items-center gap-2 gap-md-3 mb-3 mb-md-4">
        <div className="flex-grow-1 min-width-0">
          <h4 className="fw-bold mb-0 mb-sm-1" style={{ 
            ...arabicFontStyle, 
            color: '#4a9eff', 
            fontSize: isArabic ? 'clamp(1rem, 2vw, 1.5rem)' : 'clamp(0.95rem, 1.8vw, 1.4rem)' 
          }}>
            <FaGraduationCap className="me-2" /> 
            {isArabic ? 'نتائجي الدراسية' : 'My Academic Results'}
          </h4>
          <p className="text-muted mb-0 d-none d-sm-block" style={{ 
            ...arabicFontStyle, 
            fontSize: isArabic ? 'clamp(0.8rem, 1vw, 0.95rem)' : 'clamp(0.75rem, 0.9vw, 0.9rem)' 
          }}>
            {student ? (
              isArabic 
                ? `عرض جميع نتائجك الدراسية - ${student.name || student.firstName || 'Student'}`
                : `View all your academic results - ${student.name || student.firstName || 'Student'}`
            ) : (
              isArabic ? 'عرض جميع نتائجك الدراسية' : 'View all your academic results'
            )}
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
        <Col xs={6} sm={4} lg={2}>
          <div className="stat-card-mini" style={{ 
            background: darkMode ? '#1a1a2e' : '#ffffff',
            border: `1px solid ${darkMode ? '#2d2d44' : '#e9ecef'}`,
            borderRadius: '12px',
            padding: '12px 16px',
            textAlign: 'center'
          }}>
            <div className="stat-number-mini" style={{ fontSize: '1.5rem', fontWeight: '700', color: '#4a9eff' }}>
              {formatNumber(stats.totalAssessments)}
            </div>
            <div className="stat-label-mini" style={{ fontSize: '0.7rem', color: '#6c757d' }}>
              {isArabic ? 'إجمالي التقييمات' : 'Total Assessments'}
            </div>
          </div>
        </Col>
        <Col xs={6} sm={4} lg={2}>
          <div className="stat-card-mini" style={{ 
            background: darkMode ? '#1a1a2e' : '#ffffff',
            border: `1px solid ${darkMode ? '#2d2d44' : '#e9ecef'}`,
            borderRadius: '12px',
            padding: '12px 16px',
            textAlign: 'center'
          }}>
            <div className="stat-number-mini" style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2ecc71' }}>
              {formatNumber(stats.gradedAssessments)}
            </div>
            <div className="stat-label-mini" style={{ fontSize: '0.7rem', color: '#6c757d' }}>
              {isArabic ? 'تم التصحيح' : 'Graded'}
            </div>
          </div>
        </Col>
        <Col xs={6} sm={4} lg={2}>
          <div className="stat-card-mini" style={{ 
            background: darkMode ? '#1a1a2e' : '#ffffff',
            border: `1px solid ${darkMode ? '#2d2d44' : '#e9ecef'}`,
            borderRadius: '12px',
            padding: '12px 16px',
            textAlign: 'center'
          }}>
            <div className="stat-number-mini" style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f39c12' }}>
              {stats.averageScore > 0 ? `${stats.averageScore.toFixed(1)}%` : 'N/A'}
            </div>
            <div className="stat-label-mini" style={{ fontSize: '0.7rem', color: '#6c757d' }}>
              {isArabic ? 'المعدل العام' : 'Average Score'}
            </div>
          </div>
        </Col>
        <Col xs={6} sm={4} lg={2}>
          <div className="stat-card-mini" style={{ 
            background: darkMode ? '#1a1a2e' : '#ffffff',
            border: `1px solid ${darkMode ? '#2d2d44' : '#e9ecef'}`,
            borderRadius: '12px',
            padding: '12px 16px',
            textAlign: 'center'
          }}>
            <div className="stat-number-mini" style={{ fontSize: '1.5rem', fontWeight: '700', color: '#9b59b6' }}>
              {stats.highestScore > 0 ? `${stats.highestScore.toFixed(1)}%` : 'N/A'}
            </div>
            <div className="stat-label-mini" style={{ fontSize: '0.7rem', color: '#6c757d' }}>
              {isArabic ? 'أعلى درجة' : 'Highest Score'}
            </div>
          </div>
        </Col>
        <Col xs={6} sm={4} lg={2}>
          <div className="stat-card-mini" style={{ 
            background: darkMode ? '#1a1a2e' : '#ffffff',
            border: `1px solid ${darkMode ? '#2d2d44' : '#e9ecef'}`,
            borderRadius: '12px',
            padding: '12px 16px',
            textAlign: 'center'
          }}>
            <div className="stat-number-mini" style={{ fontSize: '1.5rem', fontWeight: '700', color: '#e74c3c' }}>
              {stats.lowestScore > 0 ? `${stats.lowestScore.toFixed(1)}%` : 'N/A'}
            </div>
            <div className="stat-label-mini" style={{ fontSize: '0.7rem', color: '#6c757d' }}>
              {isArabic ? 'أقل درجة' : 'Lowest Score'}
            </div>
          </div>
        </Col>
        <Col xs={6} sm={4} lg={2}>
          <div className="stat-card-mini" style={{ 
            background: darkMode ? '#1a1a2e' : '#ffffff',
            border: `1px solid ${darkMode ? '#2d2d44' : '#e9ecef'}`,
            borderRadius: '12px',
            padding: '12px 16px',
            textAlign: 'center'
          }}>
            <div className="stat-number-mini" style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1abc9c' }}>
              {formatNumber(assessments.filter(a => a.isGraded).length)}
            </div>
            <div className="stat-label-mini" style={{ fontSize: '0.7rem', color: '#6c757d' }}>
              {isArabic ? 'المواد المكتملة' : 'Completed Subjects'}
            </div>
          </div>
        </Col>
      </Row>

      {/* ===== FILTERS ===== */}
      <Card className="modern-card mb-4" style={{ background: darkMode ? '#1a1a2e' : '#ffffff', borderColor: darkMode ? '#2d2d44' : '#e9ecef' }}>
        <Card.Body className="p-3 p-md-4">
          <Row className="g-2 g-md-3">
            <Col xs={12} md={5} lg={6}>
              <Form.Select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                style={{
                  ...arabicFontStyle,
                  background: darkMode ? '#2d2d44' : 'white',
                  color: darkMode ? '#e9ecef' : '#212529',
                  borderRadius: '12px',
                  borderColor: darkMode ? '#2d2d44' : '#e9ecef',
                }}
              >
                <option value="all">{isArabic ? 'جميع المواد' : 'All Subjects'}</option>
                {getUniqueSubjects().map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={12} md={5} lg={5}>
              <Form.Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  ...arabicFontStyle,
                  background: darkMode ? '#2d2d44' : 'white',
                  color: darkMode ? '#e9ecef' : '#212529',
                  borderRadius: '12px',
                  borderColor: darkMode ? '#2d2d44' : '#e9ecef',
                }}
              >
                <option value="all">{isArabic ? 'جميع الحالات' : 'All Status'}</option>
                <option value="graded">{isArabic ? 'مصحح' : 'Graded'}</option>
                <option value="pending">{isArabic ? 'بانتظار التصحيح' : 'Pending'}</option>
              </Form.Select>
            </Col>
            <Col xs={12} md={2}>
              <span className="text-muted d-flex align-items-center" style={{ ...arabicFontStyle, fontSize: '0.85rem' }}>
                {formatNumber(filteredAssessments.length)} {isArabic ? 'تقييم' : 'assessments'}
              </span>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* ===== ASSESSMENTS LIST ===== */}
      {assessments.length === 0 ? (
        <Card className="text-center py-5" style={{ 
          background: darkMode ? '#1a1a2e' : '#ffffff', 
          borderColor: darkMode ? '#2d2d44' : '#e9ecef',
          borderRadius: '16px',
        }}>
          <Card.Body>
            <FaFileAlt size={48} className="text-muted opacity-25 mb-3" />
            <h5 style={arabicFontStyle}>
              {isArabic ? 'لا توجد نتائج' : 'No results available'}
            </h5>
            <p className="text-muted" style={arabicFontStyle}>
              {isArabic 
                ? 'لم يتم نشر أي نتائج حتى الآن' 
                : 'No results have been published yet'}
            </p>
          </Card.Body>
        </Card>
      ) : filteredAssessments.length === 0 ? (
        <Card className="text-center py-5" style={{ 
          background: darkMode ? '#1a1a2e' : '#ffffff', 
          borderColor: darkMode ? '#2d2d44' : '#e9ecef',
          borderRadius: '16px',
        }}>
          <Card.Body>
            <FaSearch size={48} className="text-muted opacity-25 mb-3" />
            <h5 style={arabicFontStyle}>
              {isArabic ? 'لا توجد نتائج' : 'No results found'}
            </h5>
            <p className="text-muted" style={arabicFontStyle}>
              {isArabic 
                ? 'لا توجد نتائج تطابق معايير البحث' 
                : 'No results match your filters'}
            </p>
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-3 g-md-4">
          {filteredAssessments.map(assessment => {
            const status = getStatusBadge(assessment);
            const percentage = assessment.isGraded 
              ? (assessment.studentScore / assessment.totalMarks) * 100 
              : 0;
            
            return (
              <Col key={assessment.id} xs={12} md={6} lg={4}>
                <Card className="result-card h-100" style={{ 
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
                  <div className="result-card-topbar" style={{
                    height: '4px',
                    background: `linear-gradient(90deg, ${assessment.isGraded ? '#2ecc71' : '#f39c12'}, ${assessment.isGraded ? '#27ae60' : '#e67e22'})`
                  }}></div>
                  <Card.Body className="p-3 p-md-4">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h6 className="fw-bold mb-0" style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                          {assessment.title}
                        </h6>
                        <small className="text-muted d-block" style={arabicFontStyle}>
                          <FaBook className="me-1" size={12} />
                          {assessment.subject} • {assessment.className}
                        </small>
                      </div>
                      <Badge bg={status.color} style={{ borderRadius: '8px', fontSize: '0.65rem' }}>
                        {status.label}
                      </Badge>
                    </div>

                    <div className="result-details mt-3" style={{
                      padding: '10px 12px',
                      background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                      borderRadius: '10px',
                    }}>
                      {assessment.isGraded ? (
                        <>
                          <div className="d-flex justify-content-between align-items-center">
                            <span style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                              {isArabic ? 'الدرجة: ' : 'Score: '}
                              <strong>{formatNumber(assessment.studentScore)}</strong>
                              <span className="text-muted"> / {formatNumber(assessment.totalMarks)}</span>
                            </span>
                            <span className="fw-bold" style={{ 
                              color: percentage >= 75 ? '#2ecc71' : percentage >= 50 ? '#f39c12' : '#e74c3c',
                              fontSize: '1.1rem',
                            }}>
                              {percentage.toFixed(0)}%
                            </span>
                          </div>
                          <ProgressBar 
                            now={percentage} 
                            variant={percentage >= 75 ? 'success' : percentage >= 50 ? 'warning' : 'danger'}
                            style={{ height: '4px', borderRadius: '2px', marginTop: '4px' }}
                          />
                          {assessment.studentGrade?.gradedAt && (
                            <small className="text-muted d-block mt-1" style={arabicFontStyle}>
                              <FaCalendarAlt className="me-1" size={10} />
                              {isArabic ? 'تاريخ التصحيح: ' : 'Graded on: '}
                              {formatDate(assessment.studentGrade.gradedAt)}
                            </small>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-2">
                          <FaClock size={24} className="text-muted opacity-25 mb-1" />
                          <p className="text-muted mb-0" style={arabicFontStyle}>
                            {isArabic ? 'بانتظار تصحيح المعلم' : 'Waiting for teacher to grade'}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="d-flex gap-2 mt-3">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="flex-grow-1"
                        onClick={() => { setSelectedAssessment(assessment); setShowDetailsModal(true); }}
                        style={{ 
                          ...arabicFontStyle, 
                          borderRadius: '12px',
                          fontSize: isMobile ? '0.75rem' : '0.85rem'
                        }}
                      >
                        <FaEye className="me-2" size={isMobile ? 12 : 14} />
                        {isArabic ? 'عرض التفاصيل' : 'View Details'}
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* ===== DETAILS MODAL ===== */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg" centered className="modern-modal">
        <Modal.Header closeButton className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Modal.Title style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
            <FaFileAlt className="me-2 text-primary" />
            {isArabic ? 'تفاصيل التقييم' : 'Assessment Details'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? '#0d1117' : 'white' }}>
          {selectedAssessment && (
            <div>
              <div className="mb-3">
                <h5 className="fw-bold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                  {selectedAssessment.title}
                </h5>
                <div className="d-flex flex-wrap gap-3 mt-2">
                  <Badge bg="secondary" style={{ borderRadius: '8px' }}>
                    <FaBook className="me-1" size={12} /> {selectedAssessment.subject}
                  </Badge>
                  <Badge bg="info" style={{ borderRadius: '8px' }}>
                    <FaUsers className="me-1" size={12} /> {selectedAssessment.className}
                  </Badge>
                  <Badge bg="secondary" style={{ borderRadius: '8px' }}>
                    <FaFileAlt className="me-1" size={12} /> {selectedAssessment.type}
                  </Badge>
                </div>
              </div>

              <hr style={{ borderColor: darkMode ? '#2d2d44' : '#e9ecef' }} />

              {selectedAssessment.description && (
                <div className="mb-3">
                  <h6 className="fw-bold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                    {isArabic ? 'الوصف' : 'Description'}
                  </h6>
                  <p style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                    {selectedAssessment.description}
                  </p>
                </div>
              )}

              <Row className="g-3">
                <Col md={6}>
                  <div className="detail-item">
                    <label className="text-muted small" style={arabicFontStyle}>
                      {isArabic ? 'تاريخ الاستحقاق' : 'Due Date'}
                    </label>
                    <p className="fw-semibold mb-0" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                      {formatDate(selectedAssessment.dueDate)}
                    </p>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="detail-item">
                    <label className="text-muted small" style={arabicFontStyle}>
                      {isArabic ? 'الحالة' : 'Status'}
                    </label>
                    <p className="fw-semibold mb-0" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                      <Badge bg={getStatusBadge(selectedAssessment).color}>
                        {getStatusBadge(selectedAssessment).label}
                      </Badge>
                    </p>
                  </div>
                </Col>
              </Row>

              {selectedAssessment.isGraded && (
                <>
                  <hr style={{ borderColor: darkMode ? '#2d2d44' : '#e9ecef' }} />
                  <h6 className="fw-bold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                    <FaCheckCircle className="me-2 text-success" />
                    {isArabic ? 'النتيجة' : 'Result'}
                  </h6>
                  <Row className="g-3">
                    <Col md={4}>
                      <div className="detail-item">
                        <label className="text-muted small" style={arabicFontStyle}>
                          {isArabic ? 'الدرجة المحصل عليها' : 'Score Obtained'}
                        </label>
                        <p className="fw-bold mb-0" style={{ color: '#2ecc71', fontSize: '1.3rem' }}>
                          {formatNumber(selectedAssessment.studentScore)}
                        </p>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="detail-item">
                        <label className="text-muted small" style={arabicFontStyle}>
                          {isArabic ? 'الدرجة الكلية' : 'Total Marks'}
                        </label>
                        <p className="fw-bold mb-0" style={{ color: '#4a9eff', fontSize: '1.3rem' }}>
                          {formatNumber(selectedAssessment.totalMarks)}
                        </p>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="detail-item">
                        <label className="text-muted small" style={arabicFontStyle}>
                          {isArabic ? 'النسبة المئوية' : 'Percentage'}
                        </label>
                        <p className="fw-bold mb-0" style={{ 
                          color: ((selectedAssessment.studentScore / selectedAssessment.totalMarks) * 100) >= 75 ? '#2ecc71' : '#f39c12',
                          fontSize: '1.3rem'
                        }}>
                          {((selectedAssessment.studentScore / selectedAssessment.totalMarks) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </Col>
                  </Row>
                  <ProgressBar 
                    now={(selectedAssessment.studentScore / selectedAssessment.totalMarks) * 100}
                    variant={((selectedAssessment.studentScore / selectedAssessment.totalMarks) * 100) >= 75 ? 'success' : 'warning'}
                    style={{ height: '8px', borderRadius: '4px', marginTop: '8px' }}
                  />
                </>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)} style={{ ...arabicFontStyle, borderRadius: '12px' }}>
            {isArabic ? 'إغلاق' : 'Close'}
          </Button>
          {selectedAssessment?.isGraded && (
            <Button variant="primary" onClick={() => {
              // Print functionality
              window.print();
            }} style={{ ...arabicFontStyle, borderRadius: '12px' }}>
              <FaPrint className="me-2" />
              {isArabic ? 'طباعة' : 'Print'}
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      <style>{`
        .student-results {
          padding: 0;
          max-width: 100vw;
          overflow-x: hidden;
        }

        .student-results * {
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

        .modern-modal .modal-content {
          border-radius: 20px !important;
          border: none !important;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
          overflow: hidden;
        }

        .stat-card-mini {
          transition: all 0.3s ease;
        }

        .stat-card-mini:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }

        .result-card {
          transition: all 0.3s ease;
        }

        .result-card-topbar {
          transition: height 0.3s ease;
        }

        .result-card:hover .result-card-topbar {
          height: 6px;
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

        .result-details {
          transition: background 0.3s ease;
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

        /* ===== PRINT STYLES ===== */
        @media print {
          .student-results .btn,
          .student-results .modern-card .card-body .row .col-12,
          .student-results .page-header .d-flex .btn,
          .student-results .stat-card-mini {
            display: none !important;
          }
          .student-results .modern-modal .modal-content {
            box-shadow: none !important;
            border: 1px solid #dee2e6 !important;
          }
          .student-results .modern-modal .modal-header {
            background: #f8f9fa !important;
          }
          .student-results .modern-modal .modal-footer {
            display: none !important;
          }
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
          .result-card .p-3 {
            padding: 12px !important;
          }
          .result-card h6 {
            font-size: 0.85rem !important;
          }
          .result-details {
            padding: 8px 10px !important;
          }
          .result-details span {
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
        }

        @media (max-width: 400px) {
          .stat-number-mini {
            font-size: 1rem !important;
          }
          .stat-label-mini {
            font-size: 0.5rem !important;
          }
          .result-card .p-3 {
            padding: 8px !important;
          }
          .result-card h6 {
            font-size: 0.75rem !important;
          }
          .result-details span {
            font-size: 0.65rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default StudentResults;