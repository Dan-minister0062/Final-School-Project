// src/components/dashboard/student/StudentResults.jsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, ProgressBar, Form, InputGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaSearch, FaFilter, FaDownload, FaFilePdf, FaPrint,
  FaGraduationCap, FaBook, FaChartLine, FaAward,
  FaCheckCircle, FaTimesCircle, FaClock, FaStar,
  FaEye, FaChevronDown, FaChevronUp, FaSync,
  FaTrophy, FaMedal, FaCertificate, FaRocket,
  FaArrowUp, FaArrowDown, FaPercent, FaChartBar,
  FaCalendarAlt, FaUser, FaSchool, FaClipboardCheck,
  FaInfoCircle, FaExclamationTriangle, FaSave, FaTimes,
  FaBookOpen, FaQuran, FaLanguage, FaCalculator,
  FaFlask, FaLaptop, FaRunning, FaPalette, FaGlobe,
  FaAtom, FaDna, FaBrain, FaMicroscope, FaMusic,
  FaUniversity, FaBuilding, FaChild
} from 'react-icons/fa';
import { useLanguage } from '../../../context/LanguageContext';
import { getTranslation } from '../../../utils/translations';
import { useNotification } from '../../../hooks/useNotification';
import { useAuth } from '../../../hooks/useAuth';
import { syncGet } from '../../../services/apiSync';

// ===== ARABIC FONT STYLE =====
const getArabicFontStyle = (isArabic) => ({
  fontFamily: isArabic ? '"Hacen Tunisia", "Hacen Tunisia Bd", "Noto Sans Arabic", "Vazirmatn", "Traditional Arabic", "Arabic Typesetting", serif' : 'inherit',
  lineHeight: isArabic ? '1.8' : '1.6',
  letterSpacing: isArabic ? '0.5px' : '0px',
  fontSize: isArabic ? 'clamp(0.9rem, 1.1vw, 1.05rem)' : 'clamp(0.85rem, 1vw, 1rem)',
});

// ===== NUMBER FORMATTING - ALWAYS ENGLISH =====
const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  return num.toString();
};

// ===== SUBJECT ICON MAPPING =====
const getSubjectIcon = (subjectName) => {
  const name = subjectName.toLowerCase();
  if (name.includes('quran')) return <FaQuran />;
  if (name.includes('arabic')) return <FaLanguage />;
  if (name.includes('mathematics') || name.includes('math')) return <FaCalculator />;
  if (name.includes('science')) return <FaFlask />;
  if (name.includes('svt') || name.includes('biology')) return <FaDna />;
  if (name.includes('physics')) return <FaAtom />;
  if (name.includes('chemistry')) return <FaMicroscope />;
  if (name.includes('english')) return <FaLanguage />;
  if (name.includes('french')) return <FaLanguage />;
  if (name.includes('sports')) return <FaRunning />;
  if (name.includes('ict') || name.includes('computer')) return <FaLaptop />;
  if (name.includes('art') || name.includes('plastic')) return <FaPalette />;
  if (name.includes('geography')) return <FaGlobe />;
  if (name.includes('philosophy')) return <FaBrain />;
  if (name.includes('music')) return <FaMusic />;
  return <FaBookOpen />;
};

const StudentResults = () => {
  const { language, isArabic } = useLanguage();
  const t = (key) => getTranslation(key, language);
  const { notify } = useNotification();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredStat, setHoveredStat] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [exporting, setExporting] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);
  const [studentData, setStudentData] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [studentSubjects, setStudentSubjects] = useState([]);

  // ===== Arabic Font Style =====
  const arabicFontStyle = getArabicFontStyle(isArabic);

  // ===== CHECK DARK MODE & MOBILE =====
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

  // ===== GET LEVEL ICON =====
  const getLevelIcon = (level) => {
    const icons = {
      kindergarten: <FaChild />,
      primary: <FaSchool />,
      secondary: <FaBuilding />,
      high_school: <FaUniversity />,
    };
    return icons[level] || <FaSchool />;
  };

  // ===== GET LEVEL COLOR =====
  const getLevelColor = (level) => {
    const colors = {
      kindergarten: '#f39c12',
      primary: '#2d6a4f',
      secondary: '#c49a6c',
      high_school: '#9b59b6',
    };
    return colors[level] || '#6c757d';
  };

  // ===== GET GRADE FROM SCORE =====
  const getGradeFromScore = (score, maxMarks) => {
    if (score === null || score === undefined) return null;
    const percentage = (score / maxMarks) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 75) return 'A-';
    if (percentage >= 70) return 'B+';
    if (percentage >= 65) return 'B';
    if (percentage >= 60) return 'B-';
    if (percentage >= 55) return 'C+';
    if (percentage >= 50) return 'C';
    if (percentage >= 45) return 'D';
    return 'F';
  };

  // ===== GET GRADE COLOR =====
  const getGradeColor = (grade) => {
    if (!grade) return '#6c757d';
    const gradeMap = {
      'A+': '#28a745',
      'A': '#28a745',
      'A-': '#40c057',
      'B+': '#5cb85c',
      'B': '#ffc107',
      'B-': '#ffc107',
      'C+': '#fd7e14',
      'C': '#fd7e14',
      'D': '#dc3545',
      'F': '#dc3545',
    };
    return gradeMap[grade] || '#6c757d';
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

  // ===== LOAD SUBJECTS FOR STUDENT'S LEVEL =====
  const loadSubjectsForLevel = (allSubjects, level) => {
    if (allSubjects.length === 0) {
      setSubjects([]);
      setStudentSubjects([]);
      return [];
    }
    setSubjects(allSubjects);
    const levelSubjects = allSubjects.filter(s =>
      (s.level || s.level_key || s.category) === level
    );
    setStudentSubjects(levelSubjects);
    return levelSubjects;
  };

  // ===== LOAD RESULTS =====
  const loadResults = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Loading student results...');
      
      // Get current user from auth context
      if (!user) {
        setError(isArabic ? 'لم يتم العثور على المستخدم' : 'User not found');
        setLoading(false);
        return;
      }

      // Fetch student profile from /students to get class info
      let student = null;
      try {
        const studentsRes = await syncGet('/students');
        const rows = Array.isArray(studentsRes?.data) ? studentsRes.data : [];
        // students endpoint returns { id: students.id, userId: users.id, code, name, email, class_code, classId, className, level }
        student = rows.find(s => s.userId === user.id || s.id === user.id);
        if (!student && user.email) {
          student = rows.find(s => s.email === user.email);
        }
        if (!student && user.name) {
          student = rows.find(s => s.name === user.name);
        }
        if (!student && rows.length > 0) {
          // Fallback: first student record
          student = rows[0];
        }
      } catch (e) {
        console.warn('⚠️ Could not load students list:', e);
      }

      // Fallback: map from auth user directly if available
      if (!student && user) {
        if (user.className || user.class_name || user.class_code || user.level) {
          student = {
            id: user.id,
            userId: user.id,
            name: user.name || 'Student',
            email: user.email,
            class_code: user.class_code || user.classCode || '',
            classId: user.classId || user.class_id || null,
            className: user.className || user.class_name || '',
            level: user.level || '',
          };
        }
      }

      if (!student) {
        setError(isArabic ? 'لم يتم العثور على بيانات الطالب' : 'Student data not found');
        setLoading(false);
        return;
      }

      setStudentData(student);
      
      // Get student level
      const studentLevel = student.level || student.educationLevel || '';

      // Fetch subjects, assessments and submissions from the server
      const [subjectsRes, assessmentsRes, submissionsRes] = await Promise.all([
        syncGet('/subjects'),
        syncGet('/assessments'),
        syncGet('/submissions'),
      ]);

      const allSubjectsRows = Array.isArray(subjectsRes?.data) ? subjectsRes.data : [];
      // /subjects returns { data: [...], allData: [...] } – allData is unpaginated
      const allSubjects = allSubjectsRows.length > 0 ? allSubjectsRows : (Array.isArray(subjectsRes?.allData) ? subjectsRes.allData : []);
      const assessments = Array.isArray(assessmentsRes?.data) ? assessmentsRes.data : [];
      const submissions = Array.isArray(submissionsRes?.data) ? submissionsRes.data : [];

      console.log('📚 Subjects from server:', allSubjects.length);
      console.log('📝 Assessments from server:', assessments.length);
      console.log('📤 Submissions from server:', submissions.length);

      // Filter subjects for student's level
      const levelSubjects = loadSubjectsForLevel(allSubjects, studentLevel);
      console.log('📚 Subjects for level:', levelSubjects.length);

      // Build submissions lookup keyed by assessmentId
      const submissionsByAssessment = {};
      submissions.forEach(s => {
        const key = String(s.assessmentId || s.assessment_id);
        if (!submissionsByAssessment[key]) submissionsByAssessment[key] = s;
      });

      // Build results from server assessments - one row per assessment
      // (subject + type + title + score), so multiple assessments of the
      // same subject each appear with their own grade and type.
      const resultsData = assessments
        .filter((a) => a.subject)
        .map((assessment) => {
          const sub = submissionsByAssessment[String(assessment.id || assessment._serverId)];
          const graded =
            sub && (sub.status === 'graded' || sub.score != null) && sub.score != null;
          const totalMarks =
            assessment.totalMarks || assessment.maxScore || assessment.max_score || 20;
          const score = graded ? Number(sub.score) : null;
          const type = assessment.type || 'assignment';

          return {
            id: graded
              ? sub._serverId || sub.id
              : `assessment_${assessment.id || assessment._serverId}`,
            subject: assessment.subject || '',
            subjectAr:
              assessment.subjectAr ||
              assessment.subjectName ||
              assessment.subject ||
              '',
            type: type,
            assessmentTitle: assessment.title || '',
            semester: 'First Semester',
            score,
            maxMarks: totalMarks,
            grade: graded ? getGradeFromScore(score, totalMarks) : null,
            status: graded ? 'graded' : 'pending',
            date:
              graded && sub.submittedAt
                ? String(sub.submittedAt).split('T')[0]
                : '',
            teacher:
              assessment.teacherName || assessment.teacher_name || 'Teacher',
            remarks: graded ? sub.comment || sub.feedback || '' : '',
            isExam: graded && type === 'exam',
            percentage: graded ? ((score / totalMarks) * 100).toFixed(1) : null,
            academicYear: new Date().getFullYear().toString(),
            examId:
              assessment.id ||
              assessment._serverId ||
              (graded && sub.assessmentId),
          };
        });

      setResults(resultsData);
      console.log('📝 Total results:', resultsData.length);
      console.log('📝 Exam results found:', resultsData.filter(r => r.isExam && r.status === 'graded').length);

      setLoading(false);
    } catch (err) {
      console.error('❌ Error loading results:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // ===== SETUP EFFECT =====
  useEffect(() => {
    loadResults();

    const handleStorageChange = (e) => {
      if (e.key === "school_assessments") {
        console.log("🔄 Data changed, refreshing results");
        loadResults();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    const handleAssessmentChanged = () => {
      console.log("📝 Assessment changed, refreshing results");
      loadResults();
    };
    window.addEventListener("assessmentChanged", handleAssessmentChanged);

    const handleResultsUpdated = () => {
      console.log("📊 Results updated, refreshing");
      loadResults();
    };
    window.addEventListener("resultsUpdated", handleResultsUpdated);

    // Auto-refresh grades from the server (DB-backed): poll while the tab is
    // visible so a freshly graded submission appears without a manual reload.
    const refreshFromServer = () => {
      if (document.visibilityState === "visible") {
        loadResults();
      }
    };
    const handleVisible = () => refreshFromServer();
    document.addEventListener("visibilitychange", handleVisible);
    const pollTimer = setInterval(refreshFromServer, 30000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("assessmentChanged", handleAssessmentChanged);
      window.removeEventListener("resultsUpdated", handleResultsUpdated);
      document.removeEventListener("visibilitychange", handleVisible);
      clearInterval(pollTimer);
    };
  }, []);

  // ===== FILTERED RESULTS =====
  const filteredResults = results.filter(r => {
    const subjectDisplay = isArabic ? r.subjectAr : r.subject;
    const matchesSearch = subjectDisplay.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         r.teacher.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         getTypeLabel(r.type).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = filterSubject === 'all' || r.subject === filterSubject;
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchesType = filterType === 'all' || r.type === filterType;
    return matchesSearch && matchesSubject && matchesStatus && matchesType;
  });

  // ===== STATS =====
  const gradedResults = results.filter(r => r.status === 'graded' && r.score !== null);
  const pendingResults = results.filter(r => r.status === 'pending');
  const examOnlyResults = results.filter(r => r.type === 'exam' && r.status === 'graded');
  const resultTypes = Array.from(new Set(results.map(r => r.type))).filter(Boolean);
  
  const stats = {
    total: results.length || 0,
    graded: gradedResults.length,
    pending: pendingResults.length,
    exams: examOnlyResults.length,
    average: (() => {
      if (gradedResults.length === 0) return 0;
      const total = gradedResults.reduce((acc, curr) => acc + (curr.score || 0), 0);
      return Math.round(total / gradedResults.length);
    })(),
  };

  // ===== PIVOT RESULTS: one row per subject, one column per assessment type =====
  const PIVOT_ORDER = ['homework', 'assignment', 'test', 'classwork', 'exam'];

  const buildPivotResults = (rows) => {
    const bySubject = {};
    const order = [...PIVOT_ORDER];

    rows.forEach(r => {
      if (!r.subject) return;
      const key = String(r.subject).toLowerCase();
      if (!bySubject[key]) {
        bySubject[key] = {
          key,
          subject: r.subject,
          subjectAr: r.subjectAr || r.subject,
          semester: r.semester || 'First Semester',
          types: {},
          assessments: [],
          totalScore: 0,
          totalMax: 0,
          teacher: '',
          date: '',
          count: 0,
          gradedCount: 0,
        };
      }
      const group = bySubject[key];
      if (!group.types[r.type]) group.types[r.type] = [];
      group.types[r.type].push(r);
      group.assessments.push(r);
      group.count++;
      if (r.status === 'graded' && r.score != null) {
        group.gradedCount++;
        group.totalScore += Number(r.score);
        group.totalMax += Number(r.maxMarks || 20);
      }
      if (r.teacher && !group.teacher) group.teacher = r.teacher;
      if (r.date && r.date > group.date) group.date = r.date;
    });

    Object.keys(bySubject).forEach(key => {
      const g = bySubject[key];
      Object.keys(g.types).forEach(t => {
        if (!order.includes(t)) order.push(t);
      });
      const pct = g.totalMax > 0 ? (g.totalScore / g.totalMax) * 100 : 0;
      g.totalPercentage = Math.round(pct);
      g.grade = g.gradedCount > 0 ? getGradeFromScore(pct, 100) : 'N/A';
      g.status = g.count > 0 && g.gradedCount === g.count ? 'graded' : 'pending';
    });

    return { rows: Object.values(bySubject), types: order };
  };

  const pivotData = buildPivotResults(filteredResults);
  const pivotRows = pivotData.rows;
  const pivotTypes = pivotData.types;

  // ===== GET STATUS BADGE =====
  const getStatusBadge = (status, isExam) => {
    if (status === 'graded') {
      return { bg: 'success', icon: <FaCheckCircle />, label: isArabic ? 'مصحح' : 'Graded' };
    }
    return { bg: 'warning', icon: <FaClock />, label: isArabic ? 'قيد الانتظار' : 'Pending' };
  };

  // ===== HANDLE REFRESH =====
  const handleRefresh = () => {
    loadResults();
    notify(
      isArabic ? 'تم تحديث النتائج' : 'Results refreshed',
      'info'
    );
  };

  // ===== HANDLE EXPORT PDF =====
  const handleExportPDF = () => {
    setExporting(true);
    notify(
      isArabic ? 'جاري تصدير النتائج...' : 'Exporting results...',
      'info'
    );
    
    setTimeout(() => {
      try {
        const printWindow = window.open('', '_blank', 'width=900,height=700');
        if (!printWindow) {
          notify(
            isArabic ? 'يرجى السماح للنوافذ المنبثقة' : 'Please allow popups',
            'warning'
          );
          setExporting(false);
          return;
        }

        let tableRows = '';
        const dataToExport = filteredResults.length > 0 ? filteredResults : results;
        const printPivot = buildPivotResults(dataToExport);
        printPivot.rows.forEach(row => {
          const statusInfo = getStatusBadge(row.status, false);
          const subject = isArabic ? row.subjectAr : row.subject;
          const teacher = isArabic ? getTranslatedTeacher(row.teacher) : row.teacher;
          const typeCells = printPivot.types.map(type => {
            const items = row.types[type] || [];
            if (items.length === 0) {
              return '<td style="text-align:center;color:#6c757d">-</td>';
            }
            return `
              <td style="text-align:center">
                ${items.map(it => it.status === 'graded' && it.score != null
                  ? `<span style="font-weight:bold;color:${getGradeColor(it.grade)}" title="${it.assessmentTitle || ''}">${formatNumber(it.score)}/${formatNumber(it.maxMarks || 20)}</span>`
                  : `<span style="color:#6c757d" title="${it.assessmentTitle || ''}">…</span>`
                ).join('<br/>')}
              </td>`;
          }).join('');
          const statusCellColor = statusInfo.bg === 'success' ? '#28a745' : '#f39c12';

          tableRows += `
            <tr>
              <td>${subject}<br/><small style="color:#6c757d;">${formatNumber(row.count)} ${isArabic ? 'تقييم' : 'assessments'}</small></td>
              <td>${row.semester}</td>
              ${typeCells}
              <td style="text-align:center;font-weight:bold;color:${row.gradedCount > 0 ? getGradeColor(row.grade) : '#6c757d'}">
                ${row.gradedCount > 0 ? `${formatNumber(row.totalScore)}/${formatNumber(row.totalMax || 20)}` : '-'}
              </td>
              <td style="text-align:center">
                ${row.gradedCount > 0 ? `<span style="background:${getGradeColor(row.grade)};color:white;padding:2px 10px;border-radius:50px;font-size:0.7rem;">${row.grade}</span>` : '-'}
              </td>
              <td style="text-align:center">
                <span style="background:${statusCellColor};color:white;padding:2px 10px;border-radius:50px;font-size:0.7rem;">${statusInfo.label}</span>
              </td>
              <td>${teacher}</td>
              <td>${row.date || '-'}</td>
            </tr>
          `;
        });

        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${isArabic ? 'نتائج الطالب' : 'Student Results'}</title>
              <style>
                body { padding: 40px; font-family: Arial, sans-serif; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1a5f7a; padding-bottom: 20px; }
                .header h2 { color: #1a5f7a; margin-bottom: 5px; font-size: 24px; }
                .header p { color: #6c757d; margin: 0; }
                .stats { display: flex; justify-content: space-around; margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; flex-wrap: wrap; }
                .stat-item { text-align: center; padding: 5px 10px; }
                .stat-label { font-size: 0.7rem; color: #6c757d; text-transform: uppercase; }
                .stat-value { font-size: 1.1rem; font-weight: bold; color: #2d3436; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                table th { background: #1a5f7a; color: white; padding: 10px; text-align: left; font-weight: 600; }
                table td { padding: 8px 10px; border-bottom: 1px solid #dee2e6; }
                table tr:nth-child(even) { background: #f8f9fa; }
                .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 0.8rem; border-top: 1px solid #dee2e6; padding-top: 15px; }
              </style>
            </head>
            <body>
              <div class="header">
                <h2>${isArabic ? 'نتائج الطالب' : 'Student Results'}</h2>
                <p>${studentData?.name || 'Student'} | ${new Date().toLocaleDateString()}</p>
              </div>
              
              <div class="stats">
                <div class="stat-item">
                  <div class="stat-label">${isArabic ? 'إجمالي التقييمات' : 'Total Assessments'}</div>
                  <div class="stat-value">${formatNumber(stats.total)}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">${isArabic ? 'مصحح' : 'Graded'}</div>
                  <div class="stat-value" style="color:#28a745">${formatNumber(stats.graded)}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">${isArabic ? 'قيد الانتظار' : 'Pending'}</div>
                  <div class="stat-value" style="color:#f39c12">${formatNumber(stats.pending)}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">${isArabic ? 'المعدل' : 'Average'}</div>
                  <div class="stat-value" style="color:#11998e">${stats.graded > 0 ? `${formatNumber(stats.average)}/${formatNumber(20)}` : '-'}</div>
                </div>
              </div>
              
              <table>
                <thead>
                  <tr>
                    <th>${isArabic ? 'المادة' : 'Subject'}</th>
                    <th>${isArabic ? 'الفصل' : 'Semester'}</th>
                    ${printPivot.types.map(type => `<th style="text-align:center">${getTypeLabel(type)}</th>`).join('')}
                    <th style="text-align:center">${isArabic ? 'الدرجة' : 'Score'}</th>
                    <th style="text-align:center">${isArabic ? 'التقدير' : 'Grade'}</th>
                    <th style="text-align:center">${isArabic ? 'الحالة' : 'Status'}</th>
                    <th>${isArabic ? 'المعلم' : 'Teacher'}</th>
                    <th>${isArabic ? 'التاريخ' : 'Date'}</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRows}
                </tbody>
              </table>
              
              <div class="footer">
                ${isArabic ? 'تم الطباعة من مدرسة الفتح' : 'Printed from Madrassat Al Fath'} | ${new Date().toLocaleDateString()}
              </div>
            </body>
          </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
        
        notify(
          isArabic ? 'تم تصدير النتائج بنجاح' : 'Results exported successfully',
          'success'
        );
      } catch (error) {
        notify(
          isArabic ? 'حدث خطأ أثناء تصدير النتائج' : 'Error exporting results',
          'error'
        );
      }
      setExporting(false);
    }, 1500);
  };

  // ===== HANDLE PRINT =====
  const handlePrint = () => {
    setPrinting(true);
    setTimeout(() => {
      try {
        window.print();
        notify(
          isArabic ? 'تم فتح الطباعة' : 'Print dialog opened',
          'info'
        );
      } catch (error) {
        notify(
          isArabic ? 'حدث خطأ أثناء الطباعة' : 'Error printing',
          'error'
        );
      }
      setPrinting(false);
    }, 1000);
  };

  // ===== TRANSLATION HELPERS =====
  const getTranslatedTeacher = (teacher) => {
    const teacherMap = {
      'Ustadh Khalid': isArabic ? 'الأستاذ خالد' : 'Ustadh Khalid',
      'Ustadh Ahmed': isArabic ? 'الأستاذ أحمد' : 'Ustadh Ahmed',
      'Ustadhah Mariam': isArabic ? 'الأستاذة مريم' : 'Ustadhah Mariam',
      'Ustadhah Fatimah': isArabic ? 'الأستاذة فاطمة' : 'Ustadhah Fatimah',
      'Ustadh Omar': isArabic ? 'الأستاذ عمر' : 'Ustadh Omar',
      'Ustadhah Huda': isArabic ? 'الأستاذة هدى' : 'Ustadhah Huda',
    };
    return teacherMap[teacher] || teacher;
  };

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
        <Button variant="primary" onClick={loadResults} style={{ ...arabicFontStyle, borderRadius: '12px' }}>
          <FaSync className="me-2" /> {isArabic ? 'إعادة المحاولة' : 'Retry'}
        </Button>
      </div>
    );
  }

  // ===== GET STUDENT LEVEL =====
  const studentLevel = studentData?.level || studentData?.educationLevel || '';
  const levelDisplay = getLevelDisplay(studentLevel);
  const levelColor = getLevelColor(studentLevel);
  const levelIcon = getLevelIcon(studentLevel);

  // ===== STATS CARDS =====
  const statsCards = [
    {
      label: isArabic ? 'التقييمات' : 'Assessments',
      value: formatNumber(stats.total),
      icon: <FaBook />,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      shadow: '0 8px 30px rgba(102, 126, 234, 0.4)',
      subtitle: levelDisplay,
      subIcon: levelIcon,
      subColor: 'rgba(255,255,255,0.9)',
    },
    {
      label: isArabic ? 'امتحانات مصححة' : 'Graded Exams',
      value: formatNumber(stats.exams),
      icon: <FaStar />,
      gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      shadow: '0 8px 30px rgba(17, 153, 142, 0.4)',
      subtitle: `${stats.exams} ${isArabic ? 'امتحان مصحح' : 'exams graded'}`,
      subIcon: <FaCheckCircle />,
      subColor: 'rgba(255,255,255,0.9)',
    },
    {
      label: isArabic ? 'بانتظار التصحيح' : 'Pending',
      value: formatNumber(stats.pending),
      icon: <FaClock />,
      gradient: 'linear-gradient(135deg, #f2994a 0%, #f2c94c 100%)',
      shadow: '0 8px 30px rgba(242, 153, 74, 0.4)',
      subtitle: `${stats.pending} ${isArabic ? 'بانتظار التصحيح' : 'waiting'}`,
      subIcon: <FaClock />,
      subColor: 'rgba(255,255,255,0.9)',
    },
    {
      label: isArabic ? 'المعدل' : 'Average',
      value: stats.graded > 0 ? `${formatNumber(stats.average)}/20` : '-',
      icon: <FaChartLine />,
      gradient: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
      shadow: '0 8px 30px rgba(235, 51, 73, 0.4)',
      subtitle: stats.graded > 0 ? `${formatNumber(stats.graded)} ${isArabic ? 'مواد مصححة' : 'subjects graded'}` : isArabic ? 'لا توجد نتائج' : 'No results',
      subIcon: <FaPercent />,
      subColor: 'rgba(255,255,255,0.9)',
    },
  ];

  return (
    <div className="student-results" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* ===== HEADER ===== */}
      <div className="dashboard-header mb-4">
        <div className="header-content">
          <div>
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
              {isArabic 
                ? `عرض جميع المواد والنتائج الدراسية (${formatNumber(results.length)} مواد)`
                : `View all subjects and academic results (${formatNumber(results.length)} subjects)`}
            </p>
          </div>
          <div className="d-flex gap-1 gap-sm-2 flex-wrap flex-shrink-0">
            <Button 
              variant="outline-primary" 
              size="sm" 
              onClick={handleRefresh}
              style={{ 
                ...arabicFontStyle, 
                borderRadius: '12px',
                fontSize: isArabic ? 'clamp(0.65rem, 0.8vw, 0.85rem)' : 'clamp(0.6rem, 0.75vw, 0.8rem)',
                padding: isMobile ? '4px 8px' : '4px 12px'
              }}
            >
              <FaSync className="me-1" /> {isArabic ? 'تحديث' : 'Refresh'}
            </Button>
            <Button 
              variant="outline-secondary" 
              size="sm" 
              onClick={handleExportPDF}
              disabled={exporting}
              style={{ 
                ...arabicFontStyle, 
                borderRadius: '12px',
                fontSize: isArabic ? 'clamp(0.65rem, 0.8vw, 0.85rem)' : 'clamp(0.6rem, 0.75vw, 0.8rem)',
                padding: isMobile ? '4px 8px' : '4px 12px'
              }}
            >
              {exporting ? (
                <><span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> {isArabic ? 'جاري التصدير...' : 'Exporting...'}</>
              ) : (
                <><FaFilePdf className="me-1" /> {isArabic ? 'تصدير PDF' : 'Export PDF'}</>
              )}
            </Button>
            <Button 
              variant="outline-dark" 
              size="sm" 
              onClick={handlePrint}
              disabled={printing}
              style={{ 
                ...arabicFontStyle, 
                borderRadius: '12px',
                fontSize: isArabic ? 'clamp(0.65rem, 0.8vw, 0.85rem)' : 'clamp(0.6rem, 0.75vw, 0.8rem)',
                padding: isMobile ? '4px 8px' : '4px 12px'
              }}
            >
              {printing ? (
                <><span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> {isArabic ? 'جاري الطباعة...' : 'Printing...'}</>
              ) : (
                <><FaPrint className="me-1" /> {isArabic ? 'طباعة' : 'Print'}</>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* ===== STATS CARDS ===== */}
      <Row className="g-2 g-sm-3 g-md-4 mb-3 mb-md-4">
        {statsCards.map((stat, index) => (
          <Col key={index} xs={6} sm={6} md={3} className="px-1 px-sm-2">
            <Card className="stats-card-enhanced h-100 text-center" style={{
              background: darkMode ? '#1a1a2e' : '#ffffff',
              border: 'none',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = darkMode ? '0 8px 30px rgba(0,0,0,0.4)' : '0 8px 30px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)';
            }}>
              <div className="stats-card-topbar" style={{
                height: '4px',
                background: stat.gradient,
                borderRadius: '16px 16px 0 0',
              }} />
              <Card.Body className="p-2 p-sm-3 p-md-4">
                <div className="stats-icon-wrapper mb-1 mb-sm-2" style={{
                  display: 'inline-flex',
                  padding: 'clamp(6px, 1vw, 12px)',
                  borderRadius: '12px',
                  background: 'rgba(74, 158, 255, 0.15)',
                  color: '#4a9eff',
                }}>
                  <span style={{ fontSize: 'clamp(1.2rem, 2vw, 1.8rem)' }}>
                    {stat.icon}
                  </span>
                </div>
                <h2 className="fw-bold mb-0" style={{
                  ...arabicFontStyle,
                  fontSize: 'clamp(1rem, 1.8vw, 1.6rem)',
                  color: darkMode ? '#e9ecef' : '#212529',
                }}>
                  {stat.value}
                </h2>
                <p className="text-muted mb-0" style={{
                  ...arabicFontStyle,
                  fontSize: 'clamp(0.5rem, 0.7vw, 0.7rem)',
                  opacity: 0.8,
                }}>
                  {stat.label}
                </p>
                <small className="text-muted d-block" style={{
                  ...arabicFontStyle,
                  fontSize: 'clamp(0.45rem, 0.6vw, 0.6rem)',
                  opacity: 0.7,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                }}>
                  {stat.subIcon} {stat.subtitle}
                </small>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* ===== SEARCH & FILTER ===== */}
      <Card className="shadow-sm border-0 mb-4 modern-card" style={{
        background: darkMode ? '#1a1a2e' : '#ffffff',
        border: `1px solid ${darkMode ? '#2d2d44' : '#e9ecef'}`,
        borderRadius: '16px',
        overflow: 'hidden',
      }}>
        <div className="card-top-bar" style={{
          height: '4px',
          background: 'linear-gradient(90deg, #1a5f7a, #2a7f9a)',
          transition: 'height 0.4s ease'
        }}></div>
        <Card.Body className="p-2 p-md-3">
          <Row className="g-1 g-md-2 align-items-center">
            <Col xs={12} sm={12} md={4}>
              <InputGroup size="sm">
                <InputGroup.Text style={{ background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px 0 0 12px' }}>
                  <FaSearch size={12} />
                </InputGroup.Text>
                <Form.Control
                  placeholder={isArabic ? 'بحث عن مادة...' : 'Search subject...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ 
                    fontSize: 'clamp(0.6rem, 0.8vw, 0.8rem)', 
                    background: darkMode ? '#2d2d44' : 'white', 
                    color: darkMode ? '#e9ecef' : '#212529',
                    ...arabicFontStyle 
                  }}
                />
              </InputGroup>
            </Col>
            <Col xs={6} sm={6} md={3}>
              <Form.Select 
                size="sm" 
                value={filterSubject} 
                onChange={(e) => setFilterSubject(e.target.value)} 
                style={{ 
                  fontSize: 'clamp(0.55rem, 0.7vw, 0.75rem)', 
                  background: darkMode ? '#2d2d44' : 'white', 
                  color: darkMode ? '#e9ecef' : '#212529',
                  borderRadius: '12px',
                  ...arabicFontStyle 
                }}
              >
                <option value="all">{isArabic ? 'جميع المواد' : 'All Subjects'}</option>
                {studentSubjects.map((subject) => (
                  <option key={subject.id} value={subject.name}>
                    {isArabic ? subject.nameAr || subject.name : subject.name}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={6} sm={6} md={3}>
              <Form.Select 
                size="sm" 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)} 
                style={{ 
                  fontSize: 'clamp(0.55rem, 0.7vw, 0.75rem)', 
                  background: darkMode ? '#2d2d44' : 'white', 
                  color: darkMode ? '#e9ecef' : '#212529',
                  borderRadius: '12px',
                  ...arabicFontStyle 
                }}
              >
                <option value="all">{isArabic ? 'جميع الأنواع' : 'All Types'}</option>
                {resultTypes.map((type) => (
                  <option key={type} value={type}>
                    {getTypeLabel(type)}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={6} sm={6} md={2}>
              <Form.Select 
                size="sm" 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)} 
                style={{ 
                  fontSize: 'clamp(0.55rem, 0.7vw, 0.75rem)', 
                  background: darkMode ? '#2d2d44' : 'white', 
                  color: darkMode ? '#e9ecef' : '#212529',
                  borderRadius: '12px',
                  ...arabicFontStyle 
                }}
              >
                <option value="all">{isArabic ? 'جميع الحالات' : 'All Status'}</option>
                <option value="graded">{isArabic ? 'مصحح' : 'Graded'}</option>
                <option value="pending">{isArabic ? 'قيد الانتظار' : 'Pending'}</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* ===== RESULTS TABLE - All Subjects in One Page ===== */}
      <Card className="shadow-sm border-0 modern-card" style={{
        background: darkMode ? '#1a1a2e' : '#ffffff',
        border: `1px solid ${darkMode ? '#2d2d44' : '#e9ecef'}`,
        borderRadius: '16px',
        overflow: 'hidden',
      }}>
        <div className="card-top-bar" style={{
          height: '4px',
          background: 'linear-gradient(90deg, #1a5f7a, #2a7f9a)',
          transition: 'height 0.4s ease'
        }}></div>
        <Card.Header className="bg-transparent border-0 p-2 p-md-3" style={{ borderBottom: `1px solid ${darkMode ? '#2d2d44' : '#e9ecef'}` }}>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h6 className="fw-bold mb-0" style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? 'clamp(0.8rem, 1vw, 0.9rem)' : 'clamp(0.85rem, 1.1vw, 1.05rem)' }}>
              <FaGraduationCap className="me-2" />
              {isArabic ? 'التقييمات والنتائج' : 'Assessments & Results'}
            </h6>
            <span className="text-muted small" style={{ color: darkMode ? '#adb5bd' : '#6c757d', ...arabicFontStyle, fontSize: isMobile ? '0.6rem' : '0.7rem' }}>
              {formatNumber(results.length)} {isArabic ? 'تقييم' : 'assessments'}
            </span>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="mb-0" style={arabicFontStyle}>
              <thead style={{ background: darkMode ? '#0d1117' : '#f8f9fa' }}>
                <tr>
                  <th style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? 'clamp(0.5rem, 0.6vw, 0.65rem)' : 'clamp(0.6rem, 0.8vw, 0.85rem)', padding: isMobile ? '6px 8px' : '8px 12px' }}>#</th>
                  <th style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? 'clamp(0.5rem, 0.6vw, 0.65rem)' : 'clamp(0.6rem, 0.8vw, 0.85rem)', padding: isMobile ? '6px 8px' : '8px 12px' }}>{isArabic ? 'المادة' : 'Subject'}</th>
                  <th style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? 'clamp(0.5rem, 0.6vw, 0.65rem)' : 'clamp(0.6rem, 0.8vw, 0.85rem)', padding: isMobile ? '6px 8px' : '8px 12px' }} className="d-none d-sm-table-cell">{isArabic ? 'الفصل' : 'Semester'}</th>
                  {pivotTypes.map(type => (
                    <th key={type} style={{ color: getTypeColor(type), fontSize: isMobile ? 'clamp(0.5rem, 0.6vw, 0.65rem)' : 'clamp(0.6rem, 0.8vw, 0.85rem)', padding: isMobile ? '6px 8px' : '8px 12px', textAlign: 'center' }}>
                      {getTypeLabel(type)}
                    </th>
                  ))}
                  <th style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? 'clamp(0.5rem, 0.6vw, 0.65rem)' : 'clamp(0.6rem, 0.8vw, 0.85rem)', padding: isMobile ? '6px 8px' : '8px 12px' }}>{isArabic ? 'الدرجة' : 'Score'}</th>
                  <th style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? 'clamp(0.5rem, 0.6vw, 0.65rem)' : 'clamp(0.6rem, 0.8vw, 0.85rem)', padding: isMobile ? '6px 8px' : '8px 12px' }} className="d-none d-sm-table-cell">{isArabic ? 'التقدير' : 'Grade'}</th>
                  <th style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? 'clamp(0.5rem, 0.6vw, 0.65rem)' : 'clamp(0.6rem, 0.8vw, 0.85rem)', padding: isMobile ? '6px 8px' : '8px 12px' }}>{isArabic ? 'الحالة' : 'Status'}</th>
                  <th style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? 'clamp(0.5rem, 0.6vw, 0.65rem)' : 'clamp(0.6rem, 0.8vw, 0.85rem)', padding: isMobile ? '6px 8px' : '8px 12px' }} className="d-none d-md-table-cell">{isArabic ? 'المعلم' : 'Teacher'}</th>
                  <th style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? 'clamp(0.5rem, 0.6vw, 0.65rem)' : 'clamp(0.6rem, 0.8vw, 0.85rem)', padding: isMobile ? '6px 8px' : '8px 12px' }} className="d-none d-md-table-cell">{isArabic ? 'التاريخ' : 'Date'}</th>
                </tr>
              </thead>
              <tbody>
                {pivotRows.length === 0 ? (
                  <tr>
                    <td colSpan={8 + pivotTypes.length} className="text-center py-4">
                      <p className="text-muted" style={arabicFontStyle}>
                        {isArabic ? 'لا توجد نتائج لعرضها' : 'No results to display'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  pivotRows.map((row, index) => {
                    const statusInfo = getStatusBadge(row.status, false);
                    const subjectDisplay = isArabic ? row.subjectAr : row.subject;
                    const teacherDisplay = isArabic ? getTranslatedTeacher(row.teacher) : row.teacher;
                    const rowGradeColor = row.gradedCount > 0 ? getGradeColor(row.grade) : '#6c757d';

                    return (
                      <tr key={row.key || index}>
                        <td style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? 'clamp(0.6rem, 0.7vw, 0.75rem)' : 'clamp(0.7rem, 0.8vw, 0.85rem)', padding: isMobile ? '4px 6px' : '6px 12px' }}>
                          {formatNumber(index + 1)}
                        </td>
                        <td style={{ padding: isMobile ? '4px 6px' : '6px 12px' }}>
                          <div className="d-flex align-items-center gap-2">
                            <div className="subject-icon-sm" style={{
                              width: isMobile ? '22px' : '28px',
                              height: isMobile ? '22px' : '28px',
                              borderRadius: '50%',
                              background: `linear-gradient(135deg, ${levelColor}, ${levelColor}cc)`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: isMobile ? '0.5rem' : '0.7rem',
                              flexShrink: 0,
                            }}>
                              {getSubjectIcon(row.subject)}
                            </div>
                            <span className="fw-semibold" style={{ ...arabicFontStyle, fontSize: isMobile ? 'clamp(0.65rem, 0.75vw, 0.8rem)' : 'clamp(0.75rem, 0.9vw, 0.95rem)', color: darkMode ? '#e9ecef' : '#212529' }}>
                              {subjectDisplay}
                              <span className="text-muted d-block" style={{ fontSize: isMobile ? '0.45rem' : '0.55rem' }}>
                                {formatNumber(row.count)} {isArabic ? 'تقييم' : 'assessments'}
                              </span>
                            </span>
                          </div>
                        </td>
                        <td style={{ ...arabicFontStyle, fontSize: isMobile ? 'clamp(0.6rem, 0.7vw, 0.75rem)' : 'clamp(0.7rem, 0.8vw, 0.85rem)', color: darkMode ? '#e9ecef' : '#212529', padding: isMobile ? '4px 6px' : '6px 12px' }} className="d-none d-sm-table-cell">
                          {row.semester || '-'}
                        </td>
                        {pivotTypes.map(type => {
                          const items = row.types[type] || [];
                          return (
                            <td key={type} style={{ padding: isMobile ? '4px 6px' : '6px 12px' }}>
                              {items.length === 0 ? (
                                <span className="text-muted" style={{ fontSize: isMobile ? '0.6rem' : '0.7rem' }}>-</span>
                              ) : items.map((it, i) => (
                                <div key={i} style={{ marginBottom: items.length > 1 ? '4px' : '0' }}>
                                  {it.status === 'graded' && it.score != null ? (
                                    <span
                                      className="fw-bold"
                                      title={it.assessmentTitle || ''}
                                      style={{
                                        color: getGradeColor(it.grade),
                                        fontSize: isMobile ? 'clamp(0.6rem, 0.7vw, 0.8rem)' : 'clamp(0.7rem, 0.8vw, 0.95rem)',
                                        whiteSpace: 'nowrap',
                                      }}
                                    >
                                      {formatNumber(it.score)}/{formatNumber(it.maxMarks || 20)}
                                    </span>
                                  ) : (
                                    <span className="text-muted" title={it.assessmentTitle || ''} style={{ fontSize: isMobile ? '0.6rem' : '0.7rem' }}>
                                      ⏳
                                    </span>
                                  )}
                                  {items.length > 1 && it.assessmentTitle && (
                                    <small className="text-muted d-block" style={{ fontSize: isMobile ? '0.4rem' : '0.5rem' }}>
                                      {it.assessmentTitle}
                                    </small>
                                  )}
                                </div>
                              ))
                              }
                            </td>
                          );
                        })}
                        <td style={{ padding: isMobile ? '4px 6px' : '6px 12px' }}>
                          {row.gradedCount > 0 ? (
                            <span className="fw-bold" style={{ color: rowGradeColor, fontSize: isMobile ? 'clamp(0.6rem, 0.7vw, 0.8rem)' : 'clamp(0.7rem, 0.8vw, 0.95rem)' }}>
                              {formatNumber(row.totalScore)}/{formatNumber(row.totalMax || 20)}
                            </span>
                          ) : (
                            <span className="text-muted" style={{ ...arabicFontStyle, fontSize: isMobile ? 'clamp(0.6rem, 0.7vw, 0.75rem)' : 'clamp(0.7rem, 0.8vw, 0.85rem)' }}>
                              -
                            </span>
                          )}
                          {row.gradedCount > 0 && row.totalPercentage > 0 && (
                            <div className="text-muted small" style={{ fontSize: isMobile ? '0.45rem' : '0.55rem' }}>
                              {row.totalPercentage}%
                            </div>
                          )}
                        </td>
                        <td style={{ padding: isMobile ? '4px 6px' : '6px 12px' }} className="d-none d-sm-table-cell">
                          {row.gradedCount > 0 && row.grade ? (
                            <Badge style={{ background: rowGradeColor, color: 'white', padding: isMobile ? '2px 6px' : '4px 10px', fontSize: isMobile ? '0.5rem' : '0.6rem' }}>
                              {row.grade}
                            </Badge>
                          ) : (
                            <span className="text-muted" style={{ ...arabicFontStyle, fontSize: isMobile ? 'clamp(0.6rem, 0.7vw, 0.75rem)' : 'clamp(0.7rem, 0.8vw, 0.85rem)' }}>
                              -
                            </span>
                          )}
                        </td>
                        <td style={{ padding: isMobile ? '4px 6px' : '6px 12px' }}>
                          <Badge bg={statusInfo.bg} className="px-2 py-1" style={{ fontSize: isMobile ? '0.45rem' : '0.6rem' }}>
                            {statusInfo.icon} <span className="d-none d-sm-inline">{statusInfo.label}</span>
                            <span className="d-sm-none">{statusInfo.label.substring(0, 2)}</span>
                          </Badge>
                        </td>
                        <td style={{ ...arabicFontStyle, fontSize: isMobile ? 'clamp(0.6rem, 0.7vw, 0.75rem)' : 'clamp(0.7rem, 0.8vw, 0.85rem)', color: darkMode ? '#e9ecef' : '#212529', padding: isMobile ? '4px 6px' : '6px 12px' }} className="d-none d-md-table-cell">
                          {teacherDisplay || '-'}
                        </td>
                        <td style={{ ...arabicFontStyle, fontSize: isMobile ? 'clamp(0.6rem, 0.7vw, 0.75rem)' : 'clamp(0.7rem, 0.8vw, 0.85rem)', color: darkMode ? '#e9ecef' : '#212529', padding: isMobile ? '4px 6px' : '6px 12px' }} className="d-none d-md-table-cell">
                          {row.date ? new Date(row.date).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@100..900&family=Vazirmatn:wght@100..900&display=swap');

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

        .dashboard-header {
          background: var(--bg-card);
          border-radius: 16px;
          padding: 16px 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          border: 1px solid var(--border-color);
        }
        .dashboard-wrapper.dark-theme .dashboard-header {
          background: #1a1a2e;
          border-color: #2d2d44;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        .stats-card-enhanced {
          transition: all 0.3s ease;
        }
        
        .stats-card-enhanced .stats-icon-wrapper {
          transition: all 0.3s ease;
        }
        
        .stats-card-enhanced:hover .stats-icon-wrapper {
          transform: scale(1.1);
        }

        .card-top-bar {
          transition: height 0.4s ease;
        }
        .modern-card:hover .card-top-bar {
          height: 6px;
        }

        .modern-card {
          border-radius: 16px !important;
          border: 1px solid ${darkMode ? '#2d2d44' : '#e9ecef'} !important;
          transition: all 0.3s ease;
          overflow: hidden;
          background: ${darkMode ? '#1a1a2e' : '#ffffff'} !important;
        }

        .subject-icon-sm {
          transition: transform 0.3s ease;
        }
        .subject-icon-sm:hover {
          transform: scale(1.15);
        }

        .table th {
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #6c757d;
          border-bottom: 2px solid ${darkMode ? '#2d2d44' : '#e9ecef'};
        }
        .table td {
          vertical-align: middle;
          border-bottom: 1px solid ${darkMode ? '#2d2d44' : '#e9ecef'};
        }
        .table tbody tr {
          transition: background-color 0.2s;
        }
        .table tbody tr:hover {
          background-color: rgba(0,0,0,0.02);
        }
        .dashboard-wrapper.dark-theme .table tbody tr:hover {
          background-color: rgba(255,255,255,0.02);
        }

        @media (max-width: 768px) {
          .dashboard-header {
            padding: 12px 16px;
          }
          .header-content {
            flex-direction: column;
            align-items: stretch;
          }
          .stats-card-enhanced .p-2 {
            padding: 8px !important;
          }
          .stats-card-enhanced h2 {
            font-size: 1rem !important;
          }
          .stats-card-enhanced .stats-icon-wrapper {
            padding: 4px !important;
          }
          .stats-card-enhanced .stats-icon-wrapper svg {
            width: 16px !important;
            height: 16px !important;
          }
        }

        @media (max-width: 576px) {
          .stats-card-enhanced {
            min-height: 60px !important;
          }
          .stats-card-enhanced .stats-icon-wrapper svg {
            width: 14px !important;
            height: 14px !important;
          }
          .table td, .table th {
            font-size: 0.6rem !important;
            padding: 4px 6px !important;
          }
          .table .badge {
            font-size: 0.45rem !important;
            padding: 2px 4px !important;
          }
          .modern-card .p-2 {
            padding: 8px !important;
          }
          .modern-card .g-1 {
            gap: 2px !important;
          }
          .modern-card .form-select,
          .modern-card .form-control {
            font-size: 0.55rem !important;
            padding: 3px 4px !important;
          }
          .subject-icon-sm {
            width: 20px !important;
            height: 20px !important;
            font-size: 0.45rem !important;
          }
        }

        @media (max-width: 400px) {
          .stats-card-enhanced {
            min-height: 50px !important;
            padding: 6px !important;
          }
          .stats-card-enhanced h2 {
            font-size: 0.8rem !important;
          }
          .stats-card-enhanced p {
            font-size: 0.4rem !important;
          }
          .stats-card-enhanced .stats-icon-wrapper {
            padding: 2px !important;
          }
          .stats-card-enhanced .stats-icon-wrapper svg {
            width: 12px !important;
            height: 12px !important;
          }
          .table td, .table th {
            font-size: 0.5rem !important;
            padding: 3px 4px !important;
          }
          .subject-icon-sm {
            width: 16px !important;
            height: 16px !important;
            font-size: 0.4rem !important;
          }
        }

        /* ===== RTL SUPPORT ===== */
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
        [dir="rtl"] .form-select {
          background-position: left 0.75rem center !important;
          padding-right: 0.75rem !important;
          padding-left: 2rem !important;
        }

        /* ===== PRINT STYLES ===== */
        @media print {
          .header-actions .btn,
          .modern-card .card-body .row .col-12,
          .dashboard-header .header-actions,
          .stats-card-enhanced,
          .modern-card .card-top-bar {
            display: none !important;
          }
          .modern-card {
            border: none !important;
            box-shadow: none !important;
          }
          .table-responsive .table {
            width: 100% !important;
          }
          .table-responsive .table td,
          .table-responsive .table th {
            padding: 4px 6px !important;
            font-size: 10px !important;
          }
          body {
            background: white !important;
          }
          .student-results {
            padding: 10px !important;
          }
          .dashboard-header {
            border: none !important;
            box-shadow: none !important;
            padding: 10px !important;
          }
          .dashboard-header h4 {
            font-size: 14px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default StudentResults;