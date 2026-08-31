// src/components/dashboard/student/StudentResults.jsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, ProgressBar, Form, InputGroup, Pagination } from 'react-bootstrap';
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
import userDataService from '../../../services/userDataService';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);
  const [studentData, setStudentData] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [studentSubjects, setStudentSubjects] = useState([]);
  const itemsPerPage = 5;

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

  // ===== LOAD SUBJECTS FOR STUDENT'S LEVEL =====
  const loadSubjectsForLevel = (level) => {
    try {
      // Try to get from localStorage first
      const allSubjects = JSON.parse(localStorage.getItem('school_subjects') || '[]');
      
      if (allSubjects.length === 0) {
        // Try from userDataService
        const serviceSubjects = userDataService.getAllSubjects();
        if (serviceSubjects && Object.keys(serviceSubjects).length > 0) {
          const subjectsList = [];
          Object.keys(serviceSubjects).forEach(cat => {
            serviceSubjects[cat].forEach(s => {
              subjectsList.push({
                id: s.value,
                name: s.label,
                nameAr: s.labelAr || s.label,
                category: cat,
                isActive: true
              });
            });
          });
          setSubjects(subjectsList);
          const levelSubjects = subjectsList.filter(s => s.category === level);
          setStudentSubjects(levelSubjects);
          return levelSubjects;
        }
        return [];
      }
      
      setSubjects(allSubjects);
      const levelSubjects = allSubjects.filter(s => s.category === level);
      setStudentSubjects(levelSubjects);
      return levelSubjects;
    } catch (error) {
      console.error('Error loading subjects:', error);
      return [];
    }
  };

  // ===== LOAD RESULTS =====
  const loadResults = () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Loading student results...');
      
      // Get current user
      let currentUser = null;
      const currentUserStr = localStorage.getItem('currentUser');
      if (currentUserStr) {
        try {
          currentUser = JSON.parse(currentUserStr);
        } catch (e) {
          console.error('Error parsing currentUser:', e);
        }
      }
      
      if (!currentUser && user) {
        currentUser = user;
      }
      
      if (!currentUser) {
        const users = JSON.parse(localStorage.getItem('school_users') || '[]');
        const studentUser = users.find(u => u.role === 'student');
        if (studentUser) {
          currentUser = studentUser;
          localStorage.setItem('currentUser', JSON.stringify(studentUser));
        }
      }
      
      if (!currentUser) {
        const students = JSON.parse(localStorage.getItem('school_students') || '[]');
        if (students.length > 0) {
          const student = students[0];
          currentUser = {
            id: student.id,
            name: student.name || student.firstName || 'Student',
            email: student.email || 'student@school.com',
            role: 'student',
            studentId: student.id,
            classId: student.classId || student.class,
            ...student
          };
          localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
      }
      
      if (!currentUser) {
        setError(isArabic ? 'لم يتم العثور على المستخدم' : 'User not found');
        setLoading(false);
        return;
      }

      // Get student data
      const allStudents = JSON.parse(localStorage.getItem('school_students') || '[]');
      let student = allStudents.find(s => s.id === currentUser.id || s.id === currentUser.studentId);
      if (!student && currentUser.email) {
        student = allStudents.find(s => s.email === currentUser.email);
      }
      if (!student && currentUser.name) {
        student = allStudents.find(s => s.name === currentUser.name || s.firstName === currentUser.name);
      }
      if (!student && allStudents.length > 0) {
        student = allStudents[0];
      }
      
      if (!student) {
        setError(isArabic ? 'لم يتم العثور على بيانات الطالب' : 'Student data not found');
        setLoading(false);
        return;
      }

      setStudentData(student);
      
      // Get student level
      const studentLevel = student.level || student.educationLevel || 'primary';
      
      // Load subjects for student's level
      const levelSubjects = loadSubjectsForLevel(studentLevel);
      console.log('📚 Subjects for level:', levelSubjects.length);

      // Get assessments from localStorage
      const allAssessments = JSON.parse(localStorage.getItem('school_assessments') || '[]');
      
      // Filter assessments for this student's class
      const classAssessments = allAssessments.filter(a => {
        const isForClass = a.classId === student.classId || a.classId === student.class;
        const isAssigned = a.assignedStudents ? a.assignedStudents.includes(student.id) : true;
        const isPublished = a.status === 'published' || a.status === 'closed' || a.status === 'pending_marking';
        return isForClass && isAssigned && isPublished;
      });

      // Create results from assessments
      const resultsData = classAssessments.map(a => {
        const studentGrade = a.grades?.find(g => g.studentId === student.id);
        return {
          id: a.id,
          subject: a.subject,
          semester: a.semester || 'First Semester',
          score: studentGrade?.score ?? null,
          grade: studentGrade ? getGradeFromScore(studentGrade.score, a.totalMarks) : null,
          status: studentGrade ? 'graded' : 'pending',
          date: a.dueDate || a.createdAt?.split('T')[0] || '',
          teacher: a.teacherName || a.teacherId || 'Teacher',
          remarks: studentGrade?.remarks || '',
          maxMarks: a.totalMarks || 20,
        };
      });

      setResults(resultsData);
      console.log('📝 Results:', resultsData.length);

      setLoading(false);
    } catch (err) {
      console.error('❌ Error loading results:', err);
      setError(err.message);
      setLoading(false);
    }
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

  // ===== SETUP EFFECT =====
  useEffect(() => {
    loadResults();

    // Listen for storage changes
    const handleStorageChange = (e) => {
      if (e.key === "school_assessments") {
        console.log("🔄 Assessments changed, refreshing results");
        loadResults();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // Listen for custom events
    const handleAssessmentChanged = () => {
      console.log("📝 Assessment changed, refreshing results");
      loadResults();
    };
    window.addEventListener("assessmentChanged", handleAssessmentChanged);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("assessmentChanged", handleAssessmentChanged);
    };
  }, []);

  // ===== SUBJECTS =====
  const subjectNames = [...new Set(results.map(r => r.subject))];

  // ===== FILTERED RESULTS =====
  const filteredResults = results.filter(r => {
    const matchesSearch = r.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         r.teacher.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = filterSubject === 'all' || r.subject === filterSubject;
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchesSearch && matchesSubject && matchesStatus;
  });

  // ===== PAGINATION =====
  const totalPages = Math.ceil(filteredResults.length / itemsPerPage);
  const displayedResults = filteredResults.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ===== STATS =====
  const gradedResults = results.filter(r => r.status === 'graded');
  const pendingResults = results.filter(r => r.status === 'pending');
  
  const stats = {
    total: studentSubjects.length || results.length || 0,
    graded: gradedResults.length,
    pending: pendingResults.length,
    average: (() => {
      if (gradedResults.length === 0) return 0;
      const total = gradedResults.reduce((acc, curr) => acc + curr.score, 0);
      return Math.round(total / gradedResults.length);
    })(),
    highest: gradedResults.length > 0 ? Math.max(...gradedResults.map(r => r.score)) : 0,
    lowest: gradedResults.length > 0 ? Math.min(...gradedResults.map(r => r.score)) : 0,
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

  // ===== GET STATUS BADGE =====
  const getStatusBadge = (status) => {
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
        dataToExport.forEach(r => {
          const statusInfo = getStatusBadge(r.status);
          const subject = isArabic ? getTranslatedSubject(r.subject) : r.subject;
          const teacher = isArabic ? getTranslatedTeacher(r.teacher) : r.teacher;
          
          tableRows += `
            <tr>
              <td>${subject}</td>
              <td>${r.semester}</td>
              <td style="text-align:center;font-weight:bold;color:${r.status === 'graded' ? getGradeColor(r.grade) : '#6c757d'}">
                ${r.status === 'graded' ? `${r.score}/${r.maxMarks}` : '-'}
              </td>
              <td style="text-align:center">
                ${r.status === 'graded' ? `<span style="background:${getGradeColor(r.grade)};color:white;padding:2px 10px;border-radius:50px;font-size:0.7rem;">${r.grade}</span>` : '-'}
              </td>
              <td style="text-align:center">
                <span style="background:${statusInfo.bg === 'success' ? '#28a745' : '#f39c12'};color:white;padding:2px 10px;border-radius:50px;font-size:0.7rem;">${statusInfo.label}</span>
              </td>
              <td>${teacher}</td>
              <td>${r.date || '-'}</td>
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
                .stats { display: flex; justify-content: space-around; margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; }
                .stat-item { text-align: center; }
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
                  <div class="stat-label">${isArabic ? 'إجمالي المواد' : 'Total Subjects'}</div>
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
  const getTranslatedSubject = (subject) => {
    const subjectMap = {
      'Mathematics': isArabic ? 'الرياضيات' : 'Mathematics',
      'Science': isArabic ? 'العلوم' : 'Science',
      'English': isArabic ? 'اللغة الإنجليزية' : 'English',
      'Arabic': isArabic ? 'اللغة العربية' : 'Arabic',
      'Islamic Studies': isArabic ? 'الدراسات الإسلامية' : 'Islamic Studies',
      'French': isArabic ? 'اللغة الفرنسية' : 'French',
      'Biology': isArabic ? 'علم الأحياء' : 'Biology',
      'Physics': isArabic ? 'الفيزياء' : 'Physics',
      'Chemistry': isArabic ? 'الكيمياء' : 'Chemistry',
      'ICT': isArabic ? 'تكنولوجيا المعلومات' : 'ICT',
      'Art': isArabic ? 'الفنون' : 'Art',
      'Sports': isArabic ? 'الرياضة' : 'Sports',
      'Geography': isArabic ? 'الجغرافيا' : 'Geography',
      'Philosophy': isArabic ? 'الفلسفة' : 'Philosophy',
    };
    return subjectMap[subject] || subject;
  };

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
  const studentLevel = studentData?.level || studentData?.educationLevel || 'primary';
  const levelDisplay = getLevelDisplay(studentLevel);
  const levelColor = getLevelColor(studentLevel);
  const levelIcon = getLevelIcon(studentLevel);

  // ===== STATS CARDS - SAME AS DASHBOARD =====
  const statsCards = [
    {
      label: isArabic ? 'المواد الدراسية' : 'Subjects',
      value: formatNumber(studentSubjects.length || stats.total || 0),
      icon: <FaBook />,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      shadow: '0 8px 30px rgba(102, 126, 234, 0.4)',
      subtitle: levelDisplay,
      subIcon: levelIcon,
      subColor: 'rgba(255,255,255,0.9)',
    },
    {
      label: isArabic ? 'مصحح' : 'Graded',
      value: formatNumber(stats.graded),
      icon: <FaCheckCircle />,
      gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      shadow: '0 8px 30px rgba(17, 153, 142, 0.4)',
      subtitle: `${stats.graded} / ${stats.total}`,
      subIcon: <FaCheckCircle />,
      subColor: 'rgba(255,255,255,0.9)',
    },
    {
      label: isArabic ? 'قيد الانتظار' : 'Pending',
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
                ? `عرض جميع المواد والنتائج الدراسية (${formatNumber(studentSubjects.length)} مواد)`
                : `View all subjects and academic results (${formatNumber(studentSubjects.length)} subjects)`}
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
            <Col xs={12} sm={12} md={5}>
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
                  <option key={subject.id} value={subject.name}>{isArabic ? subject.nameAr || subject.name : subject.name}</option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={6} sm={6} md={3}>
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
            <Col xs={12} sm={12} md={1}>
              <div className="text-muted small text-center" style={{ color: darkMode ? '#adb5bd' : '#6c757d', ...arabicFontStyle, fontSize: 'clamp(0.6rem, 0.8vw, 0.8rem)' }}>
                {formatNumber(filteredResults.length)}
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* ===== SUBJECTS & RESULTS TABLE ===== */}
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
              {isArabic ? 'المواد والنتائج' : 'Subjects & Results'}
            </h6>
            <span className="text-muted small" style={{ color: darkMode ? '#adb5bd' : '#6c757d', ...arabicFontStyle, fontSize: isMobile ? '0.6rem' : '0.7rem' }}>
              {formatNumber(studentSubjects.length)} {isArabic ? 'مادة' : 'subjects'}
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
                  <th style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? 'clamp(0.5rem, 0.6vw, 0.65rem)' : 'clamp(0.6rem, 0.8vw, 0.85rem)', padding: isMobile ? '6px 8px' : '8px 12px' }}>{isArabic ? 'الدرجة' : 'Score'}</th>
                  <th style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? 'clamp(0.5rem, 0.6vw, 0.65rem)' : 'clamp(0.6rem, 0.8vw, 0.85rem)', padding: isMobile ? '6px 8px' : '8px 12px' }} className="d-none d-sm-table-cell">{isArabic ? 'التقدير' : 'Grade'}</th>
                  <th style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? 'clamp(0.5rem, 0.6vw, 0.65rem)' : 'clamp(0.6rem, 0.8vw, 0.85rem)', padding: isMobile ? '6px 8px' : '8px 12px' }}>{isArabic ? 'الحالة' : 'Status'}</th>
                  <th style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? 'clamp(0.5rem, 0.6vw, 0.65rem)' : 'clamp(0.6rem, 0.8vw, 0.85rem)', padding: isMobile ? '6px 8px' : '8px 12px' }} className="d-none d-md-table-cell">{isArabic ? 'المعلم' : 'Teacher'}</th>
                  <th style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? 'clamp(0.5rem, 0.6vw, 0.65rem)' : 'clamp(0.6rem, 0.8vw, 0.85rem)', padding: isMobile ? '6px 8px' : '8px 12px' }} className="d-none d-md-table-cell">{isArabic ? 'التاريخ' : 'Date'}</th>
                </tr>
              </thead>
              <tbody>
                {studentSubjects.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-4">
                      <p className="text-muted" style={arabicFontStyle}>
                        {isArabic ? 'لا توجد مواد لهذا المستوى' : 'No subjects for this level'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  studentSubjects.map((subject, index) => {
                    // Find if there's a result for this subject
                    const result = results.find(r => r.subject === subject.name);
                    const statusInfo = result ? getStatusBadge(result.status) : { bg: 'secondary', icon: <FaClock />, label: isArabic ? 'غير مسجل' : 'Not Recorded' };
                    const subjectDisplay = isArabic ? subject.nameAr || subject.name : subject.name;
                    
                    return (
                      <tr key={subject.id || index}>
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
                              {getSubjectIcon(subject.name)}
                            </div>
                            <span className="fw-semibold" style={{ ...arabicFontStyle, fontSize: isMobile ? 'clamp(0.65rem, 0.75vw, 0.8rem)' : 'clamp(0.75rem, 0.9vw, 0.95rem)', color: darkMode ? '#e9ecef' : '#212529' }}>
                              {subjectDisplay}
                            </span>
                          </div>
                        </td>
                        <td style={{ ...arabicFontStyle, fontSize: isMobile ? 'clamp(0.6rem, 0.7vw, 0.75rem)' : 'clamp(0.7rem, 0.8vw, 0.85rem)', color: darkMode ? '#e9ecef' : '#212529', padding: isMobile ? '4px 6px' : '6px 12px' }} className="d-none d-sm-table-cell">
                          {result?.semester || '-'}
                        </td>
                        <td style={{ padding: isMobile ? '4px 6px' : '6px 12px' }}>
                          {result && result.status === 'graded' ? (
                            <span className="fw-bold" style={{ color: getGradeColor(result.grade), fontSize: isMobile ? 'clamp(0.6rem, 0.7vw, 0.8rem)' : 'clamp(0.7rem, 0.8vw, 0.95rem)' }}>
                              {formatNumber(result.score)}/{formatNumber(result.maxMarks || 20)}
                            </span>
                          ) : (
                            <span className="text-muted" style={{ ...arabicFontStyle, fontSize: isMobile ? 'clamp(0.6rem, 0.7vw, 0.75rem)' : 'clamp(0.7rem, 0.8vw, 0.85rem)' }}>
                              -
                            </span>
                          )}
                        </td>
                        <td style={{ padding: isMobile ? '4px 6px' : '6px 12px' }} className="d-none d-sm-table-cell">
                          {result && result.status === 'graded' ? (
                            <Badge style={{ background: getGradeColor(result.grade), color: 'white', padding: isMobile ? '2px 6px' : '4px 10px', fontSize: isMobile ? '0.5rem' : '0.6rem' }}>
                              {result.grade}
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
                          {result?.teacher || '-'}
                        </td>
                        <td style={{ ...arabicFontStyle, fontSize: isMobile ? 'clamp(0.6rem, 0.7vw, 0.75rem)' : 'clamp(0.7rem, 0.8vw, 0.85rem)', color: darkMode ? '#e9ecef' : '#212529', padding: isMobile ? '4px 6px' : '6px 12px' }} className="d-none d-md-table-cell">
                          {result?.date || '-'}
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

      {/* ===== PAGINATION ===== */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <Pagination size="sm" className="responsive-pagination">
            <Pagination.Prev onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} />
            {[...Array(Math.min(totalPages, isMobile ? 3 : 5))].map((_, i) => {
              let pageNum;
              if (totalPages <= (isMobile ? 3 : 5)) {
                pageNum = i + 1;
              } else if (currentPage <= (isMobile ? 2 : 3)) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - (isMobile ? 1 : 2)) {
                pageNum = totalPages - (isMobile ? 2 : 4) + i;
              } else {
                pageNum = currentPage - (isMobile ? 1 : 2) + i;
              }
              return (
                <Pagination.Item key={pageNum} active={pageNum === currentPage} onClick={() => setCurrentPage(pageNum)} style={{ color: darkMode ? '#e9ecef' : '#212529', borderRadius: '8px' }}>
                  {formatNumber(pageNum)}
                </Pagination.Item>
              );
            })}
            <Pagination.Next onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} />
          </Pagination>
        </div>
      )}

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

        /* ===== ENHANCED STAT CARDS ===== */
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

        .responsive-pagination .page-link {
          padding: 4px 8px;
          font-size: clamp(0.55rem, 0.7vw, 0.75rem);
        }

        @media (max-width: 768px) {
          .responsive-pagination .page-link {
            padding: 2px 6px;
            font-size: 0.6rem;
          }
          .dashboard-header {
            padding: 12px 16px;
          }
          .header-content {
            flex-direction: column;
            align-items: stretch;
          }
          .header-actions {
            justify-content: center;
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
          .page-header {
            flex-direction: column;
            align-items: stretch !important;
          }
          .page-header .d-flex {
            flex-wrap: wrap;
            gap: 3px !important;
          }
          .page-header .btn {
            font-size: 0.55rem !important;
            padding: 3px 6px !important;
          }
          .page-header h4 {
            font-size: 0.85rem !important;
          }
          .page-header p {
            font-size: 0.6rem !important;
          }
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
          .table .btn {
            padding: 1px 4px !important;
            font-size: 0.45rem !important;
          }
          .table .btn svg {
            width: 8px !important;
            height: 8px !important;
          }
          .modern-card .p-2 {
            padding: 8px !important;
          }
          .modern-card .g-1 {
            gap: 2px !important;
          }
          .modern-card .col-md-3,
          .modern-card .col-md-2 {
            padding: 0 2px !important;
          }
          .modern-card .form-select,
          .modern-card .form-control {
            font-size: 0.55rem !important;
            padding: 3px 4px !important;
          }
          .modern-card .btn {
            font-size: 0.55rem !important;
            padding: 3px 4px !important;
          }
          .modern-card .input-group-text {
            padding: 3px 6px !important;
          }
          .modern-card .input-group-text svg {
            font-size: 10px !important;
          }
          .subject-icon-sm {
            width: 20px !important;
            height: 20px !important;
            font-size: 0.45rem !important;
          }
          .responsive-pagination .page-item:not(.active) .page-link {
            display: none;
          }
          .responsive-pagination .page-item.active .page-link {
            display: block;
          }
          .responsive-pagination .page-item.prev .page-link,
          .responsive-pagination .page-item.next .page-link {
            display: block;
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
          .modern-card .card-top-bar,
          .responsive-pagination {
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