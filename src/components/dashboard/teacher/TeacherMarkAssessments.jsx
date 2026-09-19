// src/components/dashboard/teacher/TeacherMarkAssessments.jsx
import React, { useState, useEffect } from 'react';
import { Card, Modal, Form, Button, Badge, Table, Alert, InputGroup } from 'react-bootstrap';
import { 
  FaSave, FaEye, FaCheckCircle, FaTimesCircle, 
  FaClock, FaFileAlt, FaUserGraduate,
  FaSpinner, FaExclamationTriangle,
  FaSearch, FaSync
} from 'react-icons/fa';
import { useLanguage } from '../../../context/LanguageContext';
import { useNotification } from '../../../hooks/useNotification';
import { syncGet, syncSend } from '../../../services/apiSync';
import { useAuth } from '../../../hooks/useAuth';

// ===== ALWAYS use English numbers =====
const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  return num.toString();
};

const TeacherMarkAssessments = () => {
  const { isArabic } = useLanguage();
  const { notify } = useNotification();
  
  const [classes, setClasses] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedAssessment, setSelectedAssessment] = useState('');
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [submissionContent, setSubmissionContent] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField] = useState('name');
  const [sortDirection] = useState('asc');

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

  useEffect(() => {
    loadInitialData();
  }, []);

  const { user } = useAuth();

  const loadInitialData = async () => {
    try {
      setLoading(true);

      const assignedClassCodes = Array.isArray(user?.assignedClasses) ? user.assignedClasses
        : Array.isArray(user?.assigned_classes) ? user.assigned_classes : [];

      const classesRes = await syncGet('/classes');
      const allClasses = Array.isArray(classesRes?.data) ? classesRes.data : [];
      const assigned = allClasses.filter(c => assignedClassCodes.some(code => String(code) === String(c.id) || String(code) === String(c.code)));
      setClasses(assigned);

      const assessRes = await syncGet('/assessments');
      const allAssessments = Array.isArray(assessRes?.data) ? assessRes.data : [];
      setAssessments(allAssessments);

      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClass) {
      loadStudents();
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedAssessment) {
      loadGrades();
    }
  }, [selectedAssessment]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const studentsRes = await syncGet('/students');
      const allStudents = Array.isArray(studentsRes?.data) ? studentsRes.data : [];

      // Students may store either the class code or the class name in
      // students.class_code, so match the selected class by id, code and name.
      const selectedClassRow = classes.find(c =>
        String(c.id) === String(selectedClass) || String(c.code) === String(selectedClass)
      );
      const classKeys = new Set([String(selectedClass), String(selectedClassRow?.id), String(selectedClassRow?.code), String(selectedClassRow?.name)].filter(v => v && v !== 'undefined' && v !== 'null'));

      const classStudents = allStudents
        .filter(s => classKeys.has(String(s.class_code)) || classKeys.has(String(s.classId)) || classKeys.has(String(s.className)))
        .map(s => ({ id: s.id, name: s.name, userId: s.userId || s.user_id, classId: s.class_code || s.classId, avatar: s.avatar || s.profilePhoto || null }));
      setStudents(classStudents);
      
      const initialGrades = classStudents.map(student => ({
        studentId: student.userId || student.id,
        studentName: student.name || 'Unknown',
        score: '',
        feedback: '',
        assessmentId: selectedAssessment || '',
        submitted: false,
        submissionDate: null,
        graded: false
      }));
      setGrades(initialGrades);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const loadGrades = async () => {
    try {
      if (!selectedAssessment) return;
      const res = await syncGet(`/assessments/${selectedAssessment}/submissions`);
      const submissions = Array.isArray(res?.data) ? res.data : [];
      if (submissions.length > 0) {
        setGrades(prev => prev.map(g => {
          const submission = submissions.find(s => String(s.studentId ?? s.student_id) === String(g.studentId));
          return submission ? {
            ...g,
            score: submission.score ?? '',
            feedback: submission.comment || submission.feedback || '',
            submitted: true,
            submissionDate: submission.submittedAt || submission.submitted_at || new Date().toISOString(),
            graded: submission.score != null && submission.score !== '',
            _serverId: submission.id || submission._serverId,
          } : g;
        }));
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleClassChange = (e) => {
    setSelectedClass(e.target.value);
    setSelectedAssessment('');
    setStudents([]);
    setGrades([]);
    setFilterStatus('all');
    setSearchTerm('');
  };

  const handleAssessmentChange = (e) => {
    setSelectedAssessment(e.target.value);
    if (selectedClass && !students.length) {
      loadStudents();
    }
  };

  const handleGradeChange = (studentId, field, value) => {
    setGrades(prev => prev.map(g => 
      g.studentId === studentId ? { ...g, [field]: value } : g
    ));
  };

  const handleViewSubmission = async (student) => {
    setSelectedStudent(student);
    try {
      const res = await syncGet(`/assessments/${selectedAssessment}/submissions`);
      const submissions = Array.isArray(res?.data) ? res.data : [];
      const submission = submissions.find(s => String(s.studentId ?? s.student_id) === String(student.userId || student.id));
      if (submission) {
        setSubmissionContent({
          content: submission.content || '',
          fileType: submission.fileType || submission.file_type || '',
          fileUrl: submission.fileUrl || submission.file_url || '',
          submittedAt: submission.submittedAt || submission.submitted_at,
        });
      } else {
        setSubmissionContent(null);
        notify(
          isArabic ? 'لا يوجد تقديم لهذا الطالب' : 'No submission found for this student',
          'warning'
        );
      }
    } catch {
      setSubmissionContent(null);
      notify(
        isArabic ? 'لا يوجد تقديم لهذا الطالب' : 'No submission found for this student',
        'warning'
      );
    }
    setShowSubmissionModal(true);
  };

  const handleSaveAll = async () => {
    if (!selectedAssessment) {
      setError('Please select an assessment');
      return;
    }

    const assessment = assessments.find(a => String(a.id) === String(selectedAssessment));
    const maxMarks = assessment ? (assessment.totalMarks || assessment.max_score || assessment.maxScore || 20) : 20;

    const invalidGrades = grades.filter(g => 
      g.score !== '' && (g.score < 0 || g.score > maxMarks)
    );

    if (invalidGrades.length > 0) {
      setError(`Invalid scores detected. Scores must be between 0 and ${maxMarks}`);
      return;
    }

    try {
      setSaving(true);
      const validGrades = grades.filter(g => g.score !== '' && g.score !== null);
      
      if (validGrades.length === 0) {
        setError('No grades to save');
        setSaving(false);
        return;
      }

      const studentsPayload = validGrades.map(g => ({
        student_id: g.studentId,
        score: parseFloat(g.score),
        comment: g.feedback || '',
      }));

      await syncSend('post', `/assessments/${selectedAssessment}/submissions`, { students: studentsPayload });
      
      await loadGrades();

      setSuccess(`Successfully saved ${validGrades.length} grades`);
      notify(
        isArabic ? `تم حفظ ${validGrades.length} درجة بنجاح` : `Successfully saved ${validGrades.length} grades`,
        'success'
      );
      setTimeout(() => setSuccess(''), 3000);
      setSaving(false);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const handleSaveIndividual = async (studentId) => {
    const grade = grades.find(g => g.studentId === studentId);
    if (!grade || grade.score === '') {
      setError('Please enter a score');
      return;
    }

    try {
      setSaving(true);
      const assessment = assessments.find(a => String(a.id) === String(selectedAssessment));
      const maxMarks = assessment ? (assessment.totalMarks || assessment.max_score || assessment.maxScore || 20) : 20;
      
      if (grade.score < 0 || grade.score > maxMarks) {
        throw new Error(`Score must be between 0 and ${maxMarks}`);
      }

      await syncSend('post', `/assessments/${selectedAssessment}/submissions`, {
        students: [{ student_id: grade.studentId, score: parseFloat(grade.score), comment: grade.feedback || '' }],
      });
      
      await loadGrades();

      setSuccess(`Grade saved for ${grade.studentName}`);
      notify(
        isArabic ? `تم حفظ درجة ${grade.studentName}` : `Grade saved for ${grade.studentName}`,
        'success'
      );
      setTimeout(() => setSuccess(''), 2000);
      setSaving(false);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const getAvailableAssessments = () => {
    if (!selectedClass) return [];
    return assessments.filter(a => a.classId === selectedClass);
  };

  // ===== GET FILTERED STUDENTS =====
  const getFilteredStudents = () => {
    let filtered = students.map((student) => ({
      ...student,
      grade: grades.find(g => g.studentId === student.id) || { score: '', feedback: '', submitted: false, graded: false }
    }));

    if (filterStatus !== 'all') {
      filtered = filtered.filter(s => {
        if (filterStatus === 'submitted') return s.grade.submitted;
        if (filterStatus === 'graded') return s.grade.graded;
        if (filterStatus === 'pending') return !s.grade.graded && s.grade.submitted;
        if (filterStatus === 'not_submitted') return !s.grade.submitted;
        return true;
      });
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        (s.name || s.firstName || '').toLowerCase().includes(term) ||
        (s.id || '').toLowerCase().includes(term)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (sortField) {
        case 'name':
          aVal = (a.name || a.firstName || '').toLowerCase();
          bVal = (b.name || b.firstName || '').toLowerCase();
          break;
        case 'score':
          aVal = a.grade.score || 0;
          bVal = b.grade.score || 0;
          break;
        case 'status':
          aVal = a.grade.submitted ? 'submitted' : 'not_submitted';
          bVal = b.grade.submitted ? 'submitted' : 'not_submitted';
          break;
        default:
          aVal = (a.name || a.firstName || '').toLowerCase();
          bVal = (b.name || b.firstName || '').toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  };

  // ===== GET STATUS BADGE =====
  const getStatusBadge = (submitted, graded) => {
    if (graded) {
      return <Badge bg="success" className="rounded-pill"><FaCheckCircle className="me-1" /> {isArabic ? 'مصحح' : 'Graded'}</Badge>;
    } else if (submitted) {
      return <Badge bg="warning" className="rounded-pill"><FaClock className="me-1" /> {isArabic ? 'بانتظار التصحيح' : 'Pending'}</Badge>;
    } else {
      return <Badge bg="secondary" className="rounded-pill"><FaTimesCircle className="me-1" /> {isArabic ? 'لم يقدم' : 'Not Submitted'}</Badge>;
    }
  };

  // ===== GET ASSESSMENT TYPE LABEL =====
  const getTypeLabel = (type) => {
    const labels = {
      'homework': isArabic ? 'واجب منزلي' : 'Homework',
      'assignment': isArabic ? 'مشروع' : 'Assignment',
      'test': isArabic ? 'اختبار' : 'Test',
      'exam': isArabic ? 'امتحان' : 'Exam',
      'classwork': isArabic ? 'عمل صفي' : 'Classwork',
      'quiz': isArabic ? 'اختبار قصير' : 'Quiz',
      'project': isArabic ? 'مشروع' : 'Project',
      'other': isArabic ? 'أخرى' : 'Other',
    };
    return labels[type] || type || 'Assignment';
  };

  // ===== GET ASSESSMENT TYPE COLOR =====
  const getTypeColor = (type) => {
    const colors = {
      'homework': '#8e44ad',
      'assignment': '#2d6a4f',
      'test': '#e67e22',
      'exam': '#c0392b',
      'classwork': '#2980b9',
      'quiz': '#16a085',
      'project': '#34495e',
      'other': '#6c757d',
    };
    return colors[type] || '#6c757d';
  };

  // ===== GET GRADE LETTER =====
  const getGradeLetter = (score, totalMarks) => {
    if (!score || score === '' || !totalMarks) return '-';
    const percentage = (parseFloat(score) / totalMarks) * 20;
    if (percentage >= 20) return 'A+';
    if (percentage >= 18) return 'A';
    if (percentage >= 16) return 'B+';
    if (percentage >= 14) return 'B';
    if (percentage >= 12) return 'C+';
    if (percentage >= 10) return 'C';
    if (percentage <= 9) return 'D';
    return 'F';
  };

  // ===== GET GRADE COLOR =====
  const getGradeColor = (score, totalMarks) => {
    if (!score || score === '') return '#6c757d';
    const percentage = (parseFloat(score) / totalMarks) * 100;
    if (percentage >= 80) return '#2ecc71';
    if (percentage >= 60) return '#f39c12';
    return '#e74c3c';
  };

  const filteredStudents = getFilteredStudents();
  const selectedAssessmentData = assessments.find(a => String(a.id) === String(selectedAssessment)) || null;

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted" style={arabicFontStyle}>
          {isArabic ? 'جاري التحميل...' : 'Loading...'}
        </p>
      </div>
    );
  }

  return (
    <div className="teacher-mark-assessments" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* ===== PAGE HEADER ===== */}
      <div className="d-flex flex-wrap flex-sm-nowrap justify-content-between align-items-center gap-2 gap-md-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ ...arabicFontStyle, color: '#4a9eff' }}>
            <FaFileAlt className="me-2" />
            {isArabic ? 'تصحيح التقييمات' : 'Mark Assessments'}
          </h4>
          <p className="text-muted mb-0" style={arabicFontStyle}>
            {isArabic ? 'تصحيح وتقييم أعمال الطلاب' : 'Grade and evaluate student work'}
          </p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <Button 
            variant="outline-primary" 
            size="sm" 
            onClick={loadInitialData}
            style={{ borderRadius: '12px', ...arabicFontStyle }}
          >
            <FaSync className="me-1" /> {isArabic ? 'تحديث' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* ===== SELECTION ===== */}
      <Card className="modern-card mb-4" style={{ 
        background: darkMode ? '#1a1a2e' : '#ffffff', 
        borderColor: darkMode ? '#2d2d44' : '#e9ecef' 
      }}>
        <Card.Body>
          <Row className="g-3">
            <Col md={5}>
              <Form.Label className="fw-semibold" style={arabicFontStyle}>
                {isArabic ? 'اختر الفصل' : 'Select Class'}
              </Form.Label>
              <Form.Select
                value={selectedClass}
                onChange={handleClassChange}
                style={{
                  ...arabicFontStyle,
                  background: darkMode ? '#2d2d44' : 'white',
                  color: darkMode ? '#e9ecef' : '#212529',
                  borderRadius: '12px',
                }}
              >
                <option value="">{isArabic ? 'اختر فصل' : 'Select a class'}</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} {cls.educationLevel ? `(${cls.educationLevel})` : ''}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={5}>
              <Form.Label className="fw-semibold" style={arabicFontStyle}>
                {isArabic ? 'اختر التقييم' : 'Select Assessment'}
              </Form.Label>
              <Form.Select
                value={selectedAssessment}
                onChange={handleAssessmentChange}
                disabled={!selectedClass}
                style={{
                  ...arabicFontStyle,
                  background: darkMode ? '#2d2d44' : 'white',
                  color: darkMode ? '#e9ecef' : '#212529',
                  borderRadius: '12px',
                }}
              >
                <option value="">{isArabic ? 'اختر تقييم' : 'Select an assessment'}</option>
                {getAvailableAssessments().map(a => (
                  <option key={a.id} value={a.id}>
                    {a.title} - {getTypeLabel(a.type)} ({a.status})
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2} className="d-flex align-items-end">
              <Button
                variant="success"
                className="w-100"
                onClick={handleSaveAll}
                disabled={!selectedAssessment || saving || students.length === 0}
                style={{ borderRadius: '12px', ...arabicFontStyle }}
              >
                {saving ? (
                  <><FaSpinner className="spinning me-2" /> {isArabic ? 'جاري...' : 'Saving...'}</>
                ) : (
                  <><FaSave className="me-2" /> {isArabic ? 'حفظ الكل' : 'Save All'}</>
                )}
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* ===== ASSESSMENT INFO ===== */}
      {selectedAssessmentData && (
        <div className="assessment-info-banner mb-3 p-3 rounded-3" style={{
          background: darkMode ? '#2d2d44' : '#f8f9fa',
          border: `1px solid ${darkMode ? '#3d3d5c' : '#e9ecef'}`,
          borderRadius: '12px',
        }}>
          <Row className="align-items-center">
            <Col md={4}>
              <div className="fw-bold" style={arabicFontStyle}>
                <FaFileAlt className="me-2 text-primary" />
                {selectedAssessmentData.title}
                <span
                  className="ms-2"
                  style={{
                    display: 'inline-block',
                    padding: '2px 10px',
                    borderRadius: '50px',
                    background: `${getTypeColor(selectedAssessmentData.type)}18`,
                    color: getTypeColor(selectedAssessmentData.type),
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    verticalAlign: 'middle',
                  }}
                >
                  {getTypeLabel(selectedAssessmentData.type)}
                </span>
              </div>
            </Col>
            <Col md={3}>
              <span className="text-muted" style={arabicFontStyle}>
                {isArabic ? 'المادة: ' : 'Subject: '}
                <span className="fw-semibold">{selectedAssessmentData.subject}</span>
              </span>
            </Col>
            <Col md={3}>
              <span className="text-muted" style={arabicFontStyle}>
                {isArabic ? 'الدرجة الكلية: ' : 'Total Marks: '}
                <span className="fw-semibold">{formatNumber(selectedAssessmentData.totalMarks)}</span>
              </span>
            </Col>
            <Col md={2}>
              <Badge bg={selectedAssessmentData.status === 'published' ? 'success' : 'warning'}>
                {selectedAssessmentData.status}
              </Badge>
            </Col>
          </Row>
        </div>
      )}

      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess('')} style={arabicFontStyle}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)} style={arabicFontStyle}>
          <FaExclamationTriangle className="me-2" />
          {error}
        </Alert>
      )}

      {/* ===== FILTERS ===== */}
      {selectedAssessment && students.length > 0 && (
        <Card className="modern-card mb-3" style={{ 
          background: darkMode ? '#1a1a2e' : '#ffffff', 
          borderColor: darkMode ? '#2d2d44' : '#e9ecef' 
        }}>
          <Card.Body className="p-2 p-md-3">
            <Row className="g-2 align-items-center">
              <Col xs={12} sm={4} md={3}>
                <InputGroup size="sm">
                  <InputGroup.Text style={{ background: 'transparent' }}>
                    <FaSearch size={12} />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder={isArabic ? 'بحث عن طالب...' : 'Search student...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529' }}
                  />
                </InputGroup>
              </Col>
              <Col xs={6} sm={4} md={3}>
                <Form.Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  size="sm"
                  style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px' }}
                >
                  <option value="all">{isArabic ? 'جميع الطلاب' : 'All Students'}</option>
                  <option value="submitted">{isArabic ? 'مقدم' : 'Submitted'}</option>
                  <option value="pending">{isArabic ? 'بانتظار التصحيح' : 'Pending Grading'}</option>
                  <option value="graded">{isArabic ? 'مصحح' : 'Graded'}</option>
                  <option value="not_submitted">{isArabic ? 'لم يقدم' : 'Not Submitted'}</option>
                </Form.Select>
              </Col>
              <Col xs={6} sm={4} md={3}>
                <span className="text-muted" style={{ ...arabicFontStyle, fontSize: '0.85rem' }}>
                  {formatNumber(filteredStudents.length)} {isArabic ? 'طالب' : 'students'}
                </span>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* ===== GRADING TABLE ===== */}
      {selectedAssessment && students.length > 0 ? (
        <Card className="modern-card" style={{ 
          background: darkMode ? '#1a1a2e' : '#ffffff', 
          borderColor: darkMode ? '#2d2d44' : '#e9ecef' 
        }}>
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table hover className="mb-0" style={arabicFontStyle}>
                <thead style={{ background: darkMode ? '#0d1117' : '#f8f9fa' }}>
                  <tr>
                    <th style={{ color: darkMode ? '#e9ecef' : '#212529' }}>#</th>
                    <th style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{isArabic ? 'الطالب' : 'Student'}</th>
                    <th style={{ color: darkMode ? '#e9ecef' : '#212529' }} className="d-none d-sm-table-cell">{isArabic ? 'المعرف' : 'ID'}</th>
                    <th style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{isArabic ? 'الحالة' : 'Status'}</th>
                    <th style={{ color: darkMode ? '#e9ecef' : '#212529' }} className="d-none d-md-table-cell">{isArabic ? 'التقديم' : 'Submission'}</th>
                    <th style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{isArabic ? 'الدرجة' : 'Score'}</th>
                    <th style={{ color: darkMode ? '#e9ecef' : '#212529' }} className="d-none d-md-table-cell">{isArabic ? 'التقييم' : 'Grade'}</th>
                    <th style={{ color: darkMode ? '#e9ecef' : '#212529' }} className="text-center">{isArabic ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, index) => {
                    const grade = grades.find(g => g.studentId === student.id);
                    const maxMarks = selectedAssessmentData ? selectedAssessmentData.totalMarks : 0;
                    const score = grade?.score || '';
                    const gradeLetter = getGradeLetter(score, maxMarks);
                    const gradeColor = getGradeColor(score, maxMarks);
                    const submitted = grade?.submitted || false;
                    const graded = grade?.graded || false;
                    
                    return (
                      <tr key={student.id}>
                        <td style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                          {formatNumber(index + 1)}
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="student-avatar-sm" style={{
                              background: `linear-gradient(135deg, #4a9eff, #2a7f9a)`,
                              width: isMobile ? '28px' : '36px',
                              height: isMobile ? '28px' : '36px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: '700',
                              fontSize: isMobile ? '0.6rem' : '0.85rem',
                              flexShrink: 0,
                              overflow: 'hidden'
                            }}>
                              {student.avatar ? (
                                <img src={student.avatar} alt={student.name || 'Student'} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                              ) : (
                                (student.name || student.firstName || 'U').charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <div className="fw-semibold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                                {student.name || student.firstName || 'Unknown'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="d-none d-sm-table-cell" style={{ color: darkMode ? '#adb5bd' : '#6c757d' }}>
                          {student.id}
                        </td>
                        <td>
                          {getStatusBadge(submitted, graded)}
                        </td>
                        <td className="d-none d-md-table-cell">
                          {submitted ? (
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="p-0 text-primary"
                              onClick={() => handleViewSubmission(student)}
                              style={{ textDecoration: 'none', fontSize: '0.8rem' }}
                            >
                              <FaEye className="me-1" /> {isArabic ? 'عرض' : 'View'}
                            </Button>
                          ) : (
                            <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                              <FaTimesCircle className="me-1" /> {isArabic ? 'لم يقدم' : 'Not submitted'}
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-1">
                            <Form.Control
                              type="number"
                              size="sm"
                              value={grade?.score || ''}
                              onChange={(e) => handleGradeChange(student.id, 'score', parseFloat(e.target.value) || '')}
                              min="0"
                              max={maxMarks}
                              step="0.5"
                              className={`grade-input ${score !== '' && (score < 0 || score > maxMarks) ? 'is-invalid' : ''}`}
                              style={{
                                width: isMobile ? '60px' : '80px',
                                background: darkMode ? '#2d2d44' : 'white',
                                color: darkMode ? '#e9ecef' : '#212529',
                                borderColor: graded ? '#2ecc71' : (darkMode ? '#2d2d44' : '#e9ecef'),
                                borderRadius: '8px',
                                ...arabicFontStyle
                              }}
                              disabled={!submitted}
                            />
                            <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                              / {formatNumber(maxMarks)}
                            </span>
                          </div>
                        </td>
                        <td className="d-none d-md-table-cell">
                          {score !== '' ? (
                            <Badge style={{ background: gradeColor, color: 'white', padding: '4px 10px', borderRadius: '8px' }}>
                              {gradeLetter}
                            </Badge>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>
                          <div className="d-flex gap-1 justify-content-center flex-wrap">
                            {submitted && (
                              <Button
                                variant="outline-primary"
                                size="sm"
                                className="action-btn"
                                onClick={() => handleViewSubmission(student)}
                                title={isArabic ? 'عرض التقديم' : 'View Submission'}
                                style={{ borderRadius: '6px' }}
                              >
                                <FaEye size={14} />
                              </Button>
                            )}
                            <Button
                              variant={graded ? 'outline-success' : 'outline-warning'}
                              size="sm"
                              className="action-btn"
                              onClick={() => handleSaveIndividual(student.id)}
                              disabled={saving || !submitted || grade?.score === ''}
                              title={isArabic ? 'حفظ الدرجة' : 'Save Grade'}
                              style={{ borderRadius: '6px' }}
                            >
                              {graded ? <FaCheckCircle size={14} /> : <FaSave size={14} />}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          </Card.Body>
          <Card.Footer className="d-flex justify-content-between align-items-center py-2 flex-wrap gap-2" style={{ borderColor: darkMode ? '#2d2d44' : '#e9ecef' }}>
            <span className="text-muted small" style={arabicFontStyle}>
              {isArabic 
                ? `عرض ${formatNumber(filteredStudents.length)} من ${formatNumber(students.length)} طالب`
                : `Showing ${formatNumber(filteredStudents.length)} of ${formatNumber(students.length)} students`}
            </span>
            <div className="d-flex gap-3">
              <span className="text-muted small" style={arabicFontStyle}>
                <span className="text-success">●</span> {isArabic ? 'مصحح' : 'Graded'}: {formatNumber(grades.filter(g => g.graded).length)}
              </span>
              <span className="text-muted small" style={arabicFontStyle}>
                <span className="text-warning">●</span> {isArabic ? 'بانتظار التصحيح' : 'Pending'}: {formatNumber(grades.filter(g => g.submitted && !g.graded).length)}
              </span>
              <span className="text-muted small" style={arabicFontStyle}>
                <span className="text-secondary">●</span> {isArabic ? 'لم يقدم' : 'Not submitted'}: {formatNumber(grades.filter(g => !g.submitted).length)}
              </span>
            </div>
          </Card.Footer>
        </Card>
      ) : selectedAssessment && students.length === 0 ? (
        <Card className="text-center py-5" style={{ 
          background: darkMode ? '#1a1a2e' : '#ffffff', 
          borderColor: darkMode ? '#2d2d44' : '#e9ecef',
          borderRadius: '16px',
        }}>
          <Card.Body>
            <FaUserGraduate size={48} className="text-muted opacity-25 mb-3" />
            <h5 style={arabicFontStyle}>{isArabic ? 'لا يوجد طلاب' : 'No Students'}</h5>
            <p className="text-muted" style={arabicFontStyle}>
              {isArabic ? 'لا يوجد طلاب مسجلين في هذا الفصل' : 'No students are registered in this class'}
            </p>
          </Card.Body>
        </Card>
      ) : !selectedClass ? (
        <Card className="text-center py-5" style={{ 
          background: darkMode ? '#1a1a2e' : '#ffffff', 
          borderColor: darkMode ? '#2d2d44' : '#e9ecef',
          borderRadius: '16px',
        }}>
          <Card.Body>
            <FaFileAlt size={48} className="text-muted opacity-25 mb-3" />
            <h5 style={arabicFontStyle}>{isArabic ? 'اختر فصل' : 'Select a Class'}</h5>
            <p className="text-muted" style={arabicFontStyle}>
              {isArabic ? 'يرجى اختيار فصل لبدء تصحيح التقييمات' : 'Please select a class to start marking assessments'}
            </p>
          </Card.Body>
        </Card>
      ) : !selectedAssessment ? (
        <Card className="text-center py-5" style={{ 
          background: darkMode ? '#1a1a2e' : '#ffffff', 
          borderColor: darkMode ? '#2d2d44' : '#e9ecef',
          borderRadius: '16px',
        }}>
          <Card.Body>
            <FaFileAlt size={48} className="text-muted opacity-25 mb-3" />
            <h5 style={arabicFontStyle}>{isArabic ? 'اختر تقييم' : 'Select an Assessment'}</h5>
            <p className="text-muted" style={arabicFontStyle}>
              {isArabic ? 'يرجى اختيار تقييم لتصحيحه' : 'Please select an assessment to mark'}
            </p>
          </Card.Body>
        </Card>
      ) : null}

      {/* ===== SUBMISSION VIEW MODAL ===== */}
      <Modal show={showSubmissionModal} onHide={() => setShowSubmissionModal(false)} centered size="lg" className="modern-modal">
        <Modal.Header closeButton className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Modal.Title style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
            <FaEye className="me-2 text-primary" />
            {isArabic ? 'تقديم الطالب' : 'Student Submission'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? '#0d1117' : 'white' }}>
          {selectedStudent && (
            <div>
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="student-avatar-md" style={{
                  background: `linear-gradient(135deg, #4a9eff, #2a7f9a)`,
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '1.2rem',
                  overflow: 'hidden'
                }}>
                  {selectedStudent.avatar ? (
                    <img src={selectedStudent.avatar} alt={selectedStudent.name || 'Student'} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  ) : (
                    (selectedStudent.name || selectedStudent.firstName || 'U').charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h6 className="fw-bold mb-0" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                    {selectedStudent.name || selectedStudent.firstName || 'Unknown'}
                  </h6>
                  <small className="text-muted" style={arabicFontStyle}>
                    {isArabic ? 'المعرف: ' : 'ID: '}{selectedStudent.id}
                  </small>
                </div>
              </div>

              <hr style={{ borderColor: darkMode ? '#2d2d44' : '#e9ecef' }} />

              {submissionContent ? (
                <div className="submission-content">
                  <div className="submission-meta mb-3">
                    <div className="d-flex gap-3 flex-wrap">
                      <span className="text-muted" style={arabicFontStyle}>
                        <FaClock className="me-1" />
                        {isArabic ? 'تاريخ التقديم: ' : 'Submitted: '}
                        <span className="fw-semibold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                          {submissionContent.submittedAt ? new Date(submissionContent.submittedAt).toLocaleString() : 'N/A'}
                        </span>
                      </span>
                      <span className="text-muted" style={arabicFontStyle}>
                        <FaFileAlt className="me-1" />
                        {isArabic ? 'نوع الملف: ' : 'File Type: '}
                        <span className="fw-semibold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                          {submissionContent.fileType || 'PDF'}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="submission-file-preview p-3 rounded-3" style={{
                    background: darkMode ? '#2d2d44' : '#f8f9fa',
                    border: `1px solid ${darkMode ? '#3d3d5c' : '#e9ecef'}`,
                    borderRadius: '12px',
                    minHeight: '200px'
                  }}>
                    {submissionContent.content ? (
                      <div className="submission-text" style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                        {submissionContent.content}
                      </div>
                    ) : submissionContent.fileUrl ? (
                      <div className="text-center py-4">
                        <FaFileAlt size={48} className="text-muted opacity-25 mb-3" />
                        <p style={arabicFontStyle}>
                          <a href={submissionContent.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary">
                            {isArabic ? 'عرض الملف المرفق' : 'View attached file'}
                          </a>
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-muted" style={arabicFontStyle}>
                          {isArabic ? 'لا يوجد محتوى لعرضه' : 'No content to display'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Quick grading in modal */}
                  <div className="mt-3 p-3 rounded-3" style={{
                    background: darkMode ? '#2d2d44' : '#f8f9fa',
                    border: `1px solid ${darkMode ? '#3d3d5c' : '#e9ecef'}`,
                    borderRadius: '12px'
                  }}>
                    <div className="d-flex align-items-center gap-3 flex-wrap">
                      <span className="fw-semibold" style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                        {isArabic ? 'الدرجة: ' : 'Score: '}
                      </span>
                      <Form.Control
                        type="number"
                        size="sm"
                        value={grades.find(g => g.studentId === selectedStudent.id)?.score || ''}
                        onChange={(e) => {
                          const newScore = parseFloat(e.target.value) || '';
                          handleGradeChange(selectedStudent.id, 'score', newScore);
                        }}
                        min="0"
                        max={selectedAssessmentData?.totalMarks || 100}
                        step="0.5"
                        style={{
                          width: '120px',
                          background: darkMode ? '#1a1a2e' : 'white',
                          color: darkMode ? '#e9ecef' : '#212529',
                          borderRadius: '8px',
                          ...arabicFontStyle
                        }}
                      />
                      <span className="text-muted" style={arabicFontStyle}>
                        / {formatNumber(selectedAssessmentData?.totalMarks || 100)}
                      </span>
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => {
                          handleSaveIndividual(selectedStudent.id);
                          setShowSubmissionModal(false);
                        }}
                        style={{ borderRadius: '8px', ...arabicFontStyle }}
                      >
                        <FaSave className="me-1" /> {isArabic ? 'حفظ' : 'Save'}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <FaExclamationTriangle size={48} className="text-warning mb-3" />
                  <p style={arabicFontStyle}>
                    {isArabic ? 'لا يوجد تقديم لهذا الطالب' : 'No submission found for this student'}
                  </p>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Button variant="secondary" onClick={() => setShowSubmissionModal(false)} style={{ ...arabicFontStyle, borderRadius: '12px' }}>
            {isArabic ? 'إغلاق' : 'Close'}
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .teacher-mark-assessments { padding: 0; }
        
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

        .action-btn {
          padding: 2px 6px !important;
          min-width: 26px;
          min-height: 26px;
          font-size: clamp(0.5rem, 0.6vw, 0.7rem) !important;
          border-radius: 6px !important;
        }

        .grade-input {
          transition: all 0.3s ease;
        }

        .grade-input:focus {
          border-color: #4a9eff;
          box-shadow: 0 0 0 3px rgba(74, 158, 255, 0.1);
        }

        .grade-input.is-invalid {
          border-color: #e74c3c;
        }

        .grade-input.is-invalid:focus {
          box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
        }

        .student-avatar-sm {
          transition: transform 0.3s ease;
        }

        .student-avatar-sm:hover {
          transform: scale(1.15);
        }

        .student-avatar-md {
          transition: transform 0.3s ease;
        }

        .student-avatar-md:hover {
          transform: scale(1.05);
        }

        .assessment-info-banner {
          transition: all 0.3s ease;
        }

        .assessment-info-banner:hover {
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }

        .submission-file-preview {
          transition: all 0.3s ease;
        }

        .submission-file-preview:hover {
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }

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

        @media (max-width: 576px) {
          .action-btn {
            padding: 1px 4px !important;
            min-width: 20px !important;
            min-height: 20px !important;
          }
          .action-btn svg {
            font-size: 10px !important;
          }
          .grade-input {
            width: 50px !important;
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
      `}</style>
    </div>
  );
};

export default TeacherMarkAssessments;