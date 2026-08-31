// src/components/dashboard/student/StudentDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, ProgressBar, Button, Form, Modal, Alert, Spinner, Pagination, InputGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaUser, 
  FaGraduationCap, 
  FaBook, 
  FaClock, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaUpload, 
  FaDownload, 
  FaEye, 
  FaSearch,
  FaCalendarAlt, 
  FaChartLine, 
  FaAward, 
  FaStar,
  FaChevronDown, 
  FaChevronUp, 
  FaPaperPlane, 
  FaFileAlt,
  FaExclamationTriangle, 
  FaInfoCircle,
  FaTrophy, 
  FaSchool, 
  FaBell,
  FaClipboardList, 
  FaTasks, 
  FaHourglassHalf, 
  FaCheckDouble,
  FaSync, 
  FaUserGraduate, 
  FaChartBar, 
  FaPercent,
  FaCalendarCheck,
  FaMoneyBillWave,
  FaCreditCard,
  FaWallet,
  FaChild,
  FaBookOpen,
  FaQuran,
  FaLanguage,
  FaCalculator,
  FaFlask,
  FaLaptop,
  FaRunning,
  FaPalette,
  FaGlobe,
  FaAtom,
  FaDna,
  FaBrain,
  FaMicroscope,
  FaMusic,
  FaRocket,
  FaUniversity,
  FaBuilding,
  FaSpinner,
  FaBullhorn,
  FaArrowRight
} from 'react-icons/fa';
import { useLanguage } from '../../../context/LanguageContext';
import { getTranslation } from '../../../utils/translations';
import { useNotification } from '../../../hooks/useNotification';
import { useAuth } from '../../../hooks/useAuth';

// ===== DEFAULT SUBJECTS BY LEVEL =====
const defaultSubjectsByCategory = {
  kindergarten: [
    { id: 'quran_k', name: "Qur'an", nameAr: 'القرآن الكريم', category: 'kindergarten' },
    { id: 'english_k', name: 'English', nameAr: 'اللغة الإنجليزية', category: 'kindergarten' },
    { id: 'french_k', name: 'French', nameAr: 'اللغة الفرنسية', category: 'kindergarten' },
    { id: 'arabic_k', name: 'Arabic', nameAr: 'اللغة العربية', category: 'kindergarten' }
  ],
  primary: [
    { id: 'quran_p', name: "Qur'an", nameAr: 'القرآن الكريم', category: 'primary' },
    { id: 'arabic_p', name: 'Arabic', nameAr: 'اللغة العربية', category: 'primary' },
    { id: 'english_p', name: 'English', nameAr: 'اللغة الإنجليزية', category: 'primary' },
    { id: 'french_p', name: 'French', nameAr: 'اللغة الفرنسية', category: 'primary' },
    { id: 'mathematics_p', name: 'Mathematics', nameAr: 'الرياضيات', category: 'primary' },
    { id: 'science_p', name: 'Science', nameAr: 'العلوم', category: 'primary' },
    { id: 'sports_p', name: 'Sports', nameAr: 'الرياضة', category: 'primary' },
    { id: 'ict_p', name: 'ICT', nameAr: 'تكنولوجيا المعلومات', category: 'primary' },
    { id: 'art_p', name: 'Art & Plastic', nameAr: 'الفنون التشكيلية', category: 'primary' },
    { id: 'geography_p', name: 'Geography', nameAr: 'الجغرافيا', category: 'primary' }
  ],
  secondary: [
    { id: 'quran_s', name: "Qur'an", nameAr: 'القرآن الكريم', category: 'secondary' },
    { id: 'arabic_s', name: 'Arabic', nameAr: 'اللغة العربية', category: 'secondary' },
    { id: 'english_s', name: 'English', nameAr: 'اللغة الإنجليزية', category: 'secondary' },
    { id: 'french_s', name: 'French', nameAr: 'اللغة الفرنسية', category: 'secondary' },
    { id: 'mathematics_s', name: 'Mathematics', nameAr: 'الرياضيات', category: 'secondary' },
    { id: 'svt_s', name: 'SVT (Biology)', nameAr: 'علوم الحياة والأرض', category: 'secondary' },
    { id: 'physics_s', name: 'Physics', nameAr: 'الفيزياء', category: 'secondary' },
    { id: 'sports_s', name: 'Sports', nameAr: 'الرياضة', category: 'secondary' },
    { id: 'ict_s', name: 'ICT', nameAr: 'تكنولوجيا المعلومات', category: 'secondary' },
    { id: 'geography_s', name: 'Geography', nameAr: 'الجغرافيا', category: 'secondary' }
  ],
  high_school: [
    { id: 'quran_h', name: "Qur'an", nameAr: 'القرآن الكريم', category: 'high_school' },
    { id: 'arabic_h', name: 'Arabic', nameAr: 'اللغة العربية', category: 'high_school' },
    { id: 'english_h', name: 'English', nameAr: 'اللغة الإنجليزية', category: 'high_school' },
    { id: 'french_h', name: 'French', nameAr: 'اللغة الفرنسية', category: 'high_school' },
    { id: 'mathematics_h', name: 'Mathematics', nameAr: 'الرياضيات', category: 'high_school' },
    { id: 'svt_h', name: 'SVT (Biology)', nameAr: 'علوم الحياة والأرض', category: 'high_school' },
    { id: 'physics_h', name: 'Physics', nameAr: 'الفيزياء', category: 'high_school' },
    { id: 'sports_h', name: 'Sports', nameAr: 'الرياضة', category: 'high_school' },
    { id: 'ict_h', name: 'ICT', nameAr: 'تكنولوجيا المعلومات', category: 'high_school' },
    { id: 'geography_h', name: 'Geography', nameAr: 'الجغرافيا', category: 'high_school' },
    { id: 'philosophy_h', name: 'Philosophy', nameAr: 'الفلسفة', category: 'high_school' }
  ]
};

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

const StudentDashboard = () => {
  const { language, isArabic } = useLanguage();
  const t = (key) => getTranslation(key, language);
  const { notify } = useNotification();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, absent: 0, late: 0, excused: 0, total: 0, monthlyPresent: 0, monthlyTotal: 0 });
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState(null);
  const [allStudents, setAllStudents] = useState([]);
  const [paymentStatus, setPaymentStatus] = useState({ status: 'pending', amount: 0, dueDate: '' });
  const [subjects, setSubjects] = useState([]);
  const [studentSubjects, setStudentSubjects] = useState([]);
  
  // ===== ANNOUNCEMENTS STATE =====
  const [announcements, setAnnouncements] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  
  // ===== FILTER STATE =====
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // ===== MODAL STATE =====
  const [showViewModal, setShowViewModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submissionNote, setSubmissionNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  // ===== LOAD ANNOUNCEMENTS =====
  const loadAnnouncements = () => {
    try {
      const allAnnouncements = JSON.parse(localStorage.getItem('announcements') || '[]');
      
      const publishedAnnouncements = allAnnouncements.filter(a => 
        a.status === 'published' && a.isActive !== false
      );
      
      const studentAnnouncements = publishedAnnouncements.filter(a => {
        const targetAudience = a.targetAudience || [];
        return targetAudience.includes('all') || targetAudience.includes('students');
      });
      
      const sortedAnnouncements = studentAnnouncements.sort((a, b) => {
        return new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date);
      });
      
      setAnnouncements(sortedAnnouncements.slice(0, 3));
      
      const allNotifications = JSON.parse(localStorage.getItem('school_notifications') || '[]');
      const unread = allNotifications.filter(n => {
        const isForStudent = n.targetAudience?.includes('all') || 
                            n.targetAudience?.includes('students');
        return isForStudent && !n.read;
      }).length;
      
      setUnreadNotifications(unread);
      
    } catch (error) {
      console.error('Error loading announcements:', error);
    }
  };

  // ===== LOAD SUBJECTS FOR STUDENT'S LEVEL =====
  const loadSubjectsForLevel = (level) => {
    try {
      console.log('📚 Loading subjects for level:', level);
      
      const allSubjects = JSON.parse(localStorage.getItem('school_subjects') || '[]');
      console.log('📚 Subjects from localStorage:', allSubjects.length);
      
      let levelSubjects = [];
      
      if (allSubjects.length > 0) {
        levelSubjects = allSubjects.filter(s => {
          const subjectLevel = s.category || s.level || s.educationLevel;
          return subjectLevel === level;
        });
        console.log('📚 Filtered subjects from localStorage:', levelSubjects.length);
      }
      
      if (levelSubjects.length === 0) {
        console.log('📚 No subjects in localStorage, using default subjects');
        const defaultSubjects = defaultSubjectsByCategory[level] || [];
        levelSubjects = defaultSubjects.map(s => ({
          ...s,
          category: level,
          level: level
        }));
        console.log('📚 Default subjects loaded:', levelSubjects.length);
      }
      
      setSubjects(levelSubjects);
      setStudentSubjects(levelSubjects);
      console.log('📚 Final subjects for student:', levelSubjects.length);
      return levelSubjects;
      
    } catch (error) {
      console.error('Error loading subjects:', error);
      const defaultSubjects = defaultSubjectsByCategory[level] || [];
      const fallbackSubjects = defaultSubjects.map(s => ({
        ...s,
        category: level,
        level: level
      }));
      setSubjects(fallbackSubjects);
      setStudentSubjects(fallbackSubjects);
      return fallbackSubjects;
    }
  };

  // ===== LOAD STUDENT DATA FROM LOCALSTORAGE =====
  const loadStudentData = () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Loading student dashboard data...');
      
      let currentUser = null;
      const currentUserStr = localStorage.getItem('currentUser');
      
      if (currentUserStr) {
        try {
          currentUser = JSON.parse(currentUserStr);
          console.log('👤 Current user from localStorage:', currentUser);
        } catch (e) {
          console.error('Error parsing currentUser:', e);
        }
      }
      
      if (!currentUser && user) {
        currentUser = user;
        console.log('👤 Current user from auth context:', currentUser);
      }
      
      if (!currentUser) {
        const users = JSON.parse(localStorage.getItem('school_users') || '[]');
        const studentUser = users.find(u => u.role === 'student');
        if (studentUser) {
          currentUser = studentUser;
          localStorage.setItem('currentUser', JSON.stringify(studentUser));
          console.log('👤 Found student from school_users:', currentUser);
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
          console.log('👤 Created user from student data:', currentUser);
        }
      }
      
      if (!currentUser) {
        setError(isArabic ? 'لم يتم العثور على المستخدم' : 'User not found');
        setLoading(false);
        return;
      }

      const allStudentsData = JSON.parse(localStorage.getItem('school_students') || '[]');
      setAllStudents(allStudentsData);
      
      let student = null;
      student = allStudentsData.find(s => s.id === currentUser.id || s.id === currentUser.studentId);
      if (!student && currentUser.email) {
        student = allStudentsData.find(s => s.email === currentUser.email);
      }
      if (!student && currentUser.name) {
        student = allStudentsData.find(s => s.name === currentUser.name || s.firstName === currentUser.name);
      }
      if (!student && allStudentsData.length > 0) {
        student = allStudentsData[0];
        console.log('📚 Using first student as fallback:', student);
      }
      
      if (!student) {
        setError(isArabic ? 'لم يتم العثور على بيانات الطالب' : 'Student data not found');
        setLoading(false);
        return;
      }

      setStudentData(student);
      console.log('📚 Student data:', student);

      const studentLevel = student.level || student.educationLevel || 'primary';
      
      const levelSubjects = loadSubjectsForLevel(studentLevel);
      console.log('📚 Subjects for level:', levelSubjects.length);

      const allClasses = JSON.parse(localStorage.getItem('school_classes') || '[]');
      const studentClass = allClasses.find(c => c.id === student.classId || c.id === student.class);
      setClasses(studentClass ? [studentClass] : []);
      console.log('📚 Student class:', studentClass);

      // ===== GET ASSESSMENTS =====
      const allAssessments = JSON.parse(localStorage.getItem('school_assessments') || '[]');
      const classAssessments = allAssessments.filter(a => {
        const isForClass = a.classId === student.classId || a.classId === student.class;
        const isAssigned = a.assignedStudents ? a.assignedStudents.includes(student.id) : true;
        const isPublished = a.status === 'published' || a.status === 'closed' || a.status === 'pending_marking';
        return isForClass && isAssigned && isPublished;
      });

      const allSubmissions = JSON.parse(localStorage.getItem('school_submissions') || '[]');
      const studentSubmissions = allSubmissions.filter(s => s.studentId === student.id);

      const enrichedAssessments = classAssessments.map(a => {
        const studentGrade = a.grades?.find(g => g.studentId === student.id);
        const submission = studentSubmissions.find(s => s.assessmentId === a.id);
        
        return {
          ...a,
          studentScore: studentGrade?.score || null,
          studentGrade: studentGrade,
          isGraded: !!studentGrade,
          hasSubmitted: !!submission,
          submissionId: submission?.id || null,
          submissionDate: submission?.submittedAt || null,
          status: studentGrade ? 'graded' : (submission ? 'submitted' : (a.status === 'closed' ? 'closed' : a.status)),
          canSubmit: a.status !== 'closed' && !studentGrade && !submission,
        };
      });

      setAssessments(enrichedAssessments);
      console.log('📝 Assessments:', enrichedAssessments.length);

      // ===== GET ATTENDANCE =====
      const allAttendance = JSON.parse(localStorage.getItem('school_attendance') || '[]');
      const studentAttendance = allAttendance.filter(r => 
        r.students?.some(s => s.studentId === student.id)
      );
      
      let present = 0, absent = 0, late = 0, excused = 0, total = 0;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      let monthlyPresent = 0, monthlyTotal = 0;
      
      studentAttendance.forEach(record => {
        const studentData = record.students?.find(s => s.studentId === student.id);
        if (studentData) {
          total++;
          const recordDate = new Date(record.date);
          if (recordDate >= thirtyDaysAgo) {
            monthlyTotal++;
          }
          switch (studentData.status) {
            case 'present': 
              present++; 
              if (recordDate >= thirtyDaysAgo) monthlyPresent++;
              break;
            case 'absent': absent++; break;
            case 'late': late++; break;
            case 'excused': excused++; break;
            default: break;
          }
        }
      });
      
      setAttendanceStats({ present, absent, late, excused, total, monthlyPresent, monthlyTotal });
      setAttendanceRecords(studentAttendance);
      console.log('📊 Attendance:', { present, absent, late, excused, total, monthlyPresent, monthlyTotal });

      // ===== GET PAYMENT STATUS =====
      const payments = JSON.parse(localStorage.getItem('school_payments') || '[]');
      const studentPayment = payments.find(p => p.studentId === student.id);
      if (studentPayment) {
        setPaymentStatus({
          status: studentPayment.status || 'pending',
          amount: studentPayment.amount || 0,
          dueDate: studentPayment.dueDate || '',
        });
      } else {
        const registrations = JSON.parse(localStorage.getItem('school_registrations') || '[]');
        const registration = registrations.find(r => r.studentId === student.id);
        if (registration) {
          setPaymentStatus({
            status: registration.paymentStatus || 'pending',
            amount: registration.fee || 0,
            dueDate: registration.createdAt || '',
          });
        }
      }
      console.log('💰 Payment status:', paymentStatus);

      // ===== LOAD ANNOUNCEMENTS =====
      loadAnnouncements();

      setLoading(false);
    } catch (err) {
      console.error('❌ Error loading student data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // ===== SETUP EFFECT =====
  useEffect(() => {
    loadStudentData();

    const handleStorageChange = (e) => {
      if (
        e.key === "school_assessments" ||
        e.key === "school_attendance" ||
        e.key === "school_students" ||
        e.key === "school_classes" ||
        e.key === "school_payments" ||
        e.key === "school_subjects" ||
        e.key === "school_submissions" ||
        e.key === "school_notifications" ||
        e.key === "currentUser" ||
        e.key === "announcements"
      ) {
        console.log("🔄 Storage changed, refreshing student data");
        loadStudentData();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    const handleAssessmentChanged = () => {
      console.log("📝 Assessment changed, refreshing");
      loadStudentData();
    };
    window.addEventListener("assessmentChanged", handleAssessmentChanged);

    const handleAttendanceUpdated = () => {
      console.log("📊 Attendance updated, refreshing");
      loadStudentData();
    };
    window.addEventListener("attendanceUpdated", handleAttendanceUpdated);

    const handlePaymentUpdated = () => {
      console.log("💰 Payment updated, refreshing student data");
      loadStudentData();
    };
    window.addEventListener("paymentUpdated", handlePaymentUpdated);

    const handleSubmissionChanged = () => {
      console.log("📤 Submission changed, refreshing");
      loadStudentData();
    };
    window.addEventListener("submissionChanged", handleSubmissionChanged);

    const handleNotificationAdded = () => {
      console.log("🔔 Notification added, refreshing student data");
      loadStudentData();
    };
    window.addEventListener("notificationAdded", handleNotificationAdded);

    const handleAnnouncementsUpdated = () => {
      console.log("📢 Announcements updated, refreshing");
      loadStudentData();
    };
    window.addEventListener("announcementsUpdated", handleAnnouncementsUpdated);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("assessmentChanged", handleAssessmentChanged);
      window.removeEventListener("attendanceUpdated", handleAttendanceUpdated);
      window.removeEventListener("paymentUpdated", handlePaymentUpdated);
      window.removeEventListener("submissionChanged", handleSubmissionChanged);
      window.removeEventListener("notificationAdded", handleNotificationAdded);
      window.removeEventListener("announcementsUpdated", handleAnnouncementsUpdated);
    };
  }, []);

  // ===== HANDLE REFRESH =====
  const handleRefresh = () => {
    setRefreshing(true);
    loadStudentData();
    setTimeout(() => {
      setRefreshing(false);
      notify(
        isArabic ? 'تم تحديث البيانات بنجاح' : 'Data refreshed successfully',
        'info'
      );
    }, 800);
  };

  // ===== HANDLE SUBMIT ASSESSMENT =====
  const handleSubmitAssessment = () => {
    if (!submissionFile && !submissionNote) {
      notify(
        isArabic ? 'يرجى إضافة ملف أو ملاحظات للتقديم' : 'Please add a file or notes to submit',
        'warning'
      );
      return;
    }

    setSubmitting(true);
    
    try {
      const allSubmissions = JSON.parse(localStorage.getItem('school_submissions') || '[]');
      console.log('📤 Current submissions count before:', allSubmissions.length);
      
      const newSubmission = {
        id: `SUB${String(Date.now()).slice(-6)}`,
        assessmentId: selectedAssessment.id,
        studentId: studentData.id,
        studentName: studentData.name || studentData.firstName || 'Student',
        content: submissionNote || 'No content provided',
        fileType: submissionFile ? submissionFile.type : null,
        fileName: submissionFile ? submissionFile.name : null,
        fileSize: submissionFile ? submissionFile.size : null,
        submittedAt: new Date().toISOString(),
        status: 'submitted'
      };
      
      console.log('📤 Creating submission:', newSubmission);
      
      allSubmissions.push(newSubmission);
      localStorage.setItem('school_submissions', JSON.stringify(allSubmissions));
      console.log('📤 Submissions saved. New count:', allSubmissions.length);
      
      const allAssessments = JSON.parse(localStorage.getItem('school_assessments') || '[]');
      const index = allAssessments.findIndex(a => a.id === selectedAssessment.id);
      
      if (index !== -1) {
        if (!allAssessments[index].submissions) {
          allAssessments[index].submissions = [];
        }
        
        allAssessments[index].submissions.push({
          studentId: studentData.id,
          submissionId: newSubmission.id,
          submittedAt: newSubmission.submittedAt
        });
        
        if (allAssessments[index].status === 'published') {
          allAssessments[index].status = 'pending_marking';
        }
        
        localStorage.setItem('school_assessments', JSON.stringify(allAssessments));
        console.log('📝 Assessment updated with submission reference');
      }
      
      const notifications = JSON.parse(localStorage.getItem('school_notifications') || '[]');
      const notification = {
        id: `NOT${String(Date.now()).slice(-6)}`,
        title: isArabic ? '📤 تم تقديم واجب' : '📤 Assignment Submitted',
        message: isArabic 
          ? `${studentData.name || studentData.firstName} قدم: ${selectedAssessment.title}`
          : `${studentData.name || studentData.firstName} submitted: ${selectedAssessment.title}`,
        type: 'submission',
        read: false,
        recipientRole: 'teacher',
        studentId: studentData.id,
        studentName: studentData.name || studentData.firstName,
        assessmentId: selectedAssessment.id,
        assessmentTitle: selectedAssessment.title,
        createdAt: new Date().toISOString(),
        time: new Date().toLocaleString(),
        link: '/dashboard/teacher/assessments',
      };
      notifications.push(notification);
      localStorage.setItem('school_notifications', JSON.stringify(notifications));
      
      window.dispatchEvent(new CustomEvent('submissionChanged', { 
        detail: { 
          submission: newSubmission,
          assessmentId: selectedAssessment.id,
          studentId: studentData.id
        }
      }));
      window.dispatchEvent(new CustomEvent('assessmentChanged'));
      window.dispatchEvent(new CustomEvent('notificationAdded', { detail: notification }));
      
      notify(
        isArabic ? '✅ تم تقديم الواجب بنجاح' : '✅ Assignment submitted successfully',
        'success'
      );
      
      setShowSubmitModal(false);
      setSubmissionFile(null);
      setSubmissionNote('');
      setSelectedAssessment(null);
      loadStudentData();
      
    } catch (error) {
      console.error('❌ Error submitting assignment:', error);
      notify(
        isArabic ? '❌ حدث خطأ أثناء تقديم الواجب' : '❌ Error submitting assignment',
        'error'
      );
    }
    setSubmitting(false);
  };

  // ===== HANDLE FILE UPLOAD =====
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSubmissionFile(file);
      console.log('📎 File selected:', file.name, file.type, file.size);
    }
  };

  // ===== FILTER ASSESSMENTS =====
  const filteredAssessments = assessments.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         a.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || a.status === filterStatus;
    const matchesSubject = filterSubject === 'all' || a.subject === filterSubject;
    return matchesSearch && matchesStatus && matchesSubject;
  });

  // ===== PAGINATION =====
  const totalPages = Math.ceil(filteredAssessments.length / itemsPerPage);
  const displayedAssessments = filteredAssessments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ===== SUBJECTS =====
  const subjectNames = [...new Set(assessments.map(a => a.subject))];

  // ===== CALCULATE STATS =====
  const stats = {
    total: assessments.length,
    graded: assessments.filter(a => a.isGraded).length,
    pending: assessments.filter(a => a.status === 'pending' || a.status === 'published').length,
    submitted: assessments.filter(a => a.hasSubmitted).length,
    averageScore: (() => {
      const graded = assessments.filter(a => a.isGraded);
      if (graded.length === 0) return 0;
      const total = graded.reduce((acc, a) => acc + (a.studentScore || 0), 0);
      return Math.round((total / graded.length / (graded[0]?.totalMarks || 100)) * 100);
    })(),
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

  // ===== GET STATUS BADGE =====
  const getStatusBadge = (status) => {
    const statuses = {
      graded: { bg: 'success', icon: <FaCheckCircle />, label: isArabic ? 'مصحح' : 'Graded' },
      pending: { bg: 'warning', icon: <FaHourglassHalf />, label: isArabic ? 'قيد الانتظار' : 'Pending' },
      submitted: { bg: 'info', icon: <FaPaperPlane />, label: isArabic ? 'مرسل' : 'Submitted' },
      closed: { bg: 'secondary', icon: <FaCheckCircle />, label: isArabic ? 'مغلق' : 'Closed' },
      published: { bg: 'primary', icon: <FaClock />, label: isArabic ? 'منشور' : 'Published' },
    };
    return statuses[status] || statuses.pending;
  };

  // ===== GET TYPE BADGE =====
  const getTypeBadge = (type) => {
    const types = {
      homework: { bg: 'primary', icon: <FaTasks />, label: isArabic ? 'واجب منزلي' : 'Homework' },
      assignment: { bg: 'warning', icon: <FaClipboardList />, label: isArabic ? 'مشروع' : 'Assignment' },
      quiz: { bg: 'info', icon: <FaCheckCircle />, label: isArabic ? 'اختبار قصير' : 'Quiz' },
      test: { bg: 'danger', icon: <FaFileAlt />, label: isArabic ? 'اختبار' : 'Test' },
      exam: { bg: 'danger', icon: <FaCheckCircle />, label: isArabic ? 'امتحان' : 'Exam' },
      project: { bg: 'success', icon: <FaFileAlt />, label: isArabic ? 'مشروع' : 'Project' },
      classwork: { bg: 'secondary', icon: <FaTasks />, label: isArabic ? 'عمل صفي' : 'Classwork' },
    };
    return types[type] || types.assignment;
  };

  // ===== GET GRADE COLOR =====
  const getGradeColor = (score, maxScore) => {
    if (score === null || score === undefined) return '#6c757d';
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return '#28a745';
    if (percentage >= 75) return '#5cb85c';
    if (percentage >= 60) return '#ffc107';
    if (percentage >= 50) return '#fd7e14';
    return '#dc3545';
  };

  // ===== GET TRANSLATED ANNOUNCEMENT =====
  const getTranslatedAnnouncement = (announcement) => {
    if (!announcement) return { title: '', content: '' };
    const title = isArabic ? (announcement.titleAr || announcement.title) : announcement.title;
    const content = isArabic ? (announcement.contentAr || announcement.content) : announcement.content;
    return { title, content };
  };

  // ===== RENDER STATES =====
  if (loading) {
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

  if (error) {
    return (
      <div className="text-center py-5">
        <FaExclamationTriangle size={48} className="text-warning mb-3" />
        <p className="text-danger" style={arabicFontStyle}>{error}</p>
        <Button variant="primary" onClick={loadStudentData} style={{ ...arabicFontStyle, borderRadius: '12px' }}>
          <FaSync className="me-2" /> {isArabic ? 'إعادة المحاولة' : 'Retry'}
        </Button>
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="text-center py-5">
        <FaUserGraduate size={48} className="text-muted opacity-25 mb-3" />
        <p className="text-muted" style={arabicFontStyle}>
          {isArabic ? 'لا توجد بيانات للطالب' : 'No student data found'}
        </p>
        <Button variant="primary" onClick={() => navigate('/login')} style={{ ...arabicFontStyle, borderRadius: '12px' }}>
          {isArabic ? 'تسجيل الدخول' : 'Login'}
        </Button>
      </div>
    );
  }

  // ===== GET STUDENT LEVEL =====
  const studentLevel = studentData.level || studentData.educationLevel || 'primary';
  const levelDisplay = getLevelDisplay(studentLevel);
  const levelColor = getLevelColor(studentLevel);
  const levelIcon = getLevelIcon(studentLevel);

  // ===== GET PAYMENT STATUS DISPLAY =====
  const getPaymentStatusDisplay = () => {
    if (paymentStatus.status === 'paid' || paymentStatus.status === 'approved') {
      return {
        label: isArabic ? '✅ مدفوع' : '✅ Paid',
        color: '#2ecc71',
        icon: <FaCheckCircle />,
        bg: 'rgba(46, 204, 113, 0.1)',
      };
    } else if (paymentStatus.status === 'pending') {
      return {
        label: isArabic ? '⏳ قيد الانتظار' : '⏳ Pending',
        color: '#f39c12',
        icon: <FaClock />,
        bg: 'rgba(243, 156, 18, 0.1)',
      };
    } else {
      return {
        label: isArabic ? '❌ غير مدفوع' : '❌ Unpaid',
        color: '#e74c3c',
        icon: <FaTimesCircle />,
        bg: 'rgba(231, 76, 60, 0.1)',
      };
    }
  };

  const paymentDisplay = getPaymentStatusDisplay();

  // ===== STATS CARDS =====
  const statsCards = [
    {
      label: isArabic ? 'المواد الدراسية' : 'Subjects',
      value: formatNumber(studentSubjects.length),
      icon: <FaBook />,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      shadow: '0 8px 30px rgba(102, 126, 234, 0.4)',
      subtitle: levelDisplay,
      subIcon: levelIcon,
      subColor: levelColor,
    },
    {
      label: isArabic ? 'المستوى التعليمي' : 'Education Level',
      value: levelDisplay,
      icon: levelIcon,
      gradient: `linear-gradient(135deg, ${levelColor}, ${levelColor}cc)`,
      shadow: `0 8px 30px ${levelColor}40`,
      subtitle: studentData.className || studentData.class || 'N/A',
      subIcon: <FaSchool />,
      subColor: '#6c757d',
    },
    {
      label: isArabic ? 'حالة التسجيل' : 'Registration Status',
      value: paymentDisplay.label,
      icon: paymentDisplay.icon,
      gradient: 'linear-gradient(135deg, #1a5f7a 0%, #2a7f9a 100%)',
      shadow: '0 8px 30px rgba(26, 95, 122, 0.4)',
      subtitle: paymentStatus.amount > 0 ? `${paymentStatus.amount} ${isArabic ? 'د.م.' : 'MAD'}` : (isArabic ? 'غير محدد' : 'N/A'),
      subIcon: <FaMoneyBillWave />,
      subColor: paymentDisplay.color,
    },
    {
      label: isArabic ? 'نسبة الحضور' : 'Attendance Rate',
      value: attendanceStats.total > 0 ? 
        `${Math.round((attendanceStats.present / attendanceStats.total) * 100)}%` : 
        '0%',
      icon: <FaCalendarCheck />,
      gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      shadow: '0 8px 30px rgba(17, 153, 142, 0.4)',
      subtitle: `${formatNumber(attendanceStats.present)}/${formatNumber(attendanceStats.total)} ${isArabic ? 'أيام' : 'days'}`,
      subIcon: <FaClock />,
      subColor: '#6c757d',
    },
  ];

  return (
    <div className="student-dashboard" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* ===== HEADER ===== */}
      <div className="dashboard-header mb-4">
        <div className="header-content">
          <div>
            <h4 className="fw-bold mb-1" style={{ ...arabicFontStyle, color: '#1a5f7a' }}>
              <FaGraduationCap className="me-2" />
              {isArabic ? 'لوحة تحكم الطالب' : 'Student Dashboard'}
            </h4>
            <p className="text-muted mb-0" style={arabicFontStyle}>
              {isArabic ? 'مرحباً بعودتك،' : 'Welcome back,'} {studentData.name || studentData.firstName || 'Student'} 👋
            </p>
          </div>
          <div className="header-actions">
            <Button variant="outline-primary" size="sm" className="me-2" onClick={handleRefresh} disabled={refreshing}>
              <FaSync className={refreshing ? 'spinning' : ''} /> {isArabic ? 'تحديث' : 'Refresh'}
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/dashboard/student/announcements')}>
              <FaBullhorn className="me-1" /> 
              {isArabic ? 'الإعلانات' : 'Announcements'}
              {unreadNotifications > 0 && (
                <Badge bg="danger" className="ms-2 rounded-pill" style={{ fontSize: '0.6rem' }}>
                  {unreadNotifications}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* ===== STUDENT PROFILE CARD ===== */}
      <Card className="shadow-sm border-0 mb-4 student-profile-card" style={{
        background: darkMode ? '#1a1a2e' : '#ffffff',
        border: `1px solid ${darkMode ? '#2d2d44' : '#e9ecef'}`,
        borderRadius: '20px',
        overflow: 'hidden',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <div className="card-top-bar" style={{
          height: '5px',
          background: `linear-gradient(90deg, ${levelColor}, ${levelColor}cc, #d4a373)`,
          transition: 'height 0.4s ease'
        }}></div>
        <Card.Body className="p-4">
          <div className="d-flex flex-wrap align-items-center gap-4">
            <div className="student-avatar-modern" style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${levelColor}, ${levelColor}cc)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '2rem',
              fontWeight: '700',
              flexShrink: 0,
              position: 'relative',
              boxShadow: `0 4px 20px ${levelColor}40`,
              transition: 'transform 0.4s ease'
            }}>
              {(studentData.name || studentData.firstName || 'S').charAt(0).toUpperCase()}
            </div>
            <div>
              <h5 className="fw-bold mb-1" style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                {studentData.name || studentData.firstName || 'Student'}
              </h5>
              <div className="d-flex flex-wrap gap-2">
                <span className="student-info-tag" style={{
                  ...arabicFontStyle,
                  fontSize: '0.75rem',
                  color: 'white',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 10px',
                  borderRadius: '50px',
                  background: levelColor,
                }}>
                  {levelIcon} {levelDisplay}
                </span>
                <span className="student-info-tag" style={{
                  ...arabicFontStyle,
                  fontSize: '0.75rem',
                  color: darkMode ? '#adb5bd' : '#6c757d',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 10px',
                  borderRadius: '50px',
                  background: darkMode ? '#2d2d44' : '#f8f9fa'
                }}>
                  <FaBook className="me-1" /> {studentData.className || studentData.class || 'N/A'}
                </span>
                <span className="student-info-tag" style={{
                  ...arabicFontStyle,
                  fontSize: '0.75rem',
                  color: darkMode ? '#adb5bd' : '#6c757d',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 10px',
                  borderRadius: '50px',
                  background: darkMode ? '#2d2d44' : '#f8f9fa'
                }}>
                  <FaUser className="me-1" /> ID: {studentData.id}
                </span>
                <span className="student-info-tag" style={{
                  ...arabicFontStyle,
                  fontSize: '0.75rem',
                  color: paymentDisplay.color,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 10px',
                  borderRadius: '50px',
                  background: paymentDisplay.bg,
                }}>
                  {paymentDisplay.icon} {paymentDisplay.label}
                </span>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* ===== STATS CARDS ===== */}
      <Row className="g-3 g-md-4 mb-4">
        {statsCards.map((stat, index) => (
          <Col key={index} xs={12} sm={6} md={3}>
            <div 
              className="stat-card-gradient"
              style={{ 
                background: stat.gradient,
                boxShadow: stat.shadow,
              }}
            >
              <div className="stat-card-gradient-bg1"></div>
              <div className="stat-card-gradient-bg2"></div>
              <div className="stat-card-gradient-bg3"></div>
              <div className="stat-card-gradient-content">
                <div className="stat-card-gradient-text">
                  <div className="stat-label-gradient" style={arabicFontStyle}>{stat.label}</div>
                  <div className="stat-number-gradient">{stat.value}</div>
                  <div className="stat-subtitle-gradient" style={{ 
                    ...arabicFontStyle, 
                    fontSize: '0.6rem', 
                    opacity: 0.8, 
                    marginTop: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: stat.subColor || 'rgba(255,255,255,0.7)',
                  }}>
                    {stat.subIcon} {stat.subtitle}
                  </div>
                </div>
                <div className="stat-icon-gradient">
                  {stat.icon}
                </div>
              </div>
              <div className="stat-progress-gradient">
                <div style={{ width: '100%' }}></div>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* ===== ATTENDANCE DETAILS ===== */}
      <Card className="shadow-sm border-0 mb-4 modern-card" style={{
        background: darkMode ? '#1a1a2e' : '#ffffff',
        border: `1px solid ${darkMode ? '#2d2d44' : '#e9ecef'}`,
      }}>
        <div className="card-top-bar" style={{
          height: '4px',
          background: 'linear-gradient(90deg, #2ecc71, #27ae60)',
          transition: 'height 0.4s ease'
        }}></div>
        <Card.Header className="bg-transparent border-0 p-3" style={{ borderBottom: `1px solid ${darkMode ? '#2d2d44' : '#e9ecef'}` }}>
          <h6 className="fw-bold mb-0" style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
            <FaCalendarCheck className="me-2 text-primary" />
            {isArabic ? 'تفاصيل الحضور' : 'Attendance Details'}
            <span className="text-muted ms-2" style={{ fontSize: '0.75rem' }}>
              ({formatNumber(attendanceStats.total)} {isArabic ? 'أيام مسجلة' : 'recorded days'})
            </span>
          </h6>
        </Card.Header>
        <Card.Body className="p-3">
          <Row className="g-3">
            <Col xs={6} sm={3}>
              <div className="text-center p-2 rounded-3" style={{ background: 'rgba(46, 204, 113, 0.1)' }}>
                <div className="text-success fw-bold" style={{ fontSize: '1.3rem' }}>{formatNumber(attendanceStats.present)}</div>
                <small className="text-muted" style={arabicFontStyle}>{isArabic ? 'حاضر' : 'Present'}</small>
              </div>
            </Col>
            <Col xs={6} sm={3}>
              <div className="text-center p-2 rounded-3" style={{ background: 'rgba(231, 76, 60, 0.1)' }}>
                <div className="text-danger fw-bold" style={{ fontSize: '1.3rem' }}>{formatNumber(attendanceStats.absent)}</div>
                <small className="text-muted" style={arabicFontStyle}>{isArabic ? 'غائب' : 'Absent'}</small>
              </div>
            </Col>
            <Col xs={6} sm={3}>
              <div className="text-center p-2 rounded-3" style={{ background: 'rgba(243, 156, 18, 0.1)' }}>
                <div className="text-warning fw-bold" style={{ fontSize: '1.3rem' }}>{formatNumber(attendanceStats.late)}</div>
                <small className="text-muted" style={arabicFontStyle}>{isArabic ? 'متأخر' : 'Late'}</small>
              </div>
            </Col>
            <Col xs={6} sm={3}>
              <div className="text-center p-2 rounded-3" style={{ background: 'rgba(52, 152, 219, 0.1)' }}>
                <div className="text-info fw-bold" style={{ fontSize: '1.3rem' }}>{formatNumber(attendanceStats.excused)}</div>
                <small className="text-muted" style={arabicFontStyle}>{isArabic ? 'معذور' : 'Excused'}</small>
              </div>
            </Col>
          </Row>
          {attendanceStats.total > 0 ? (
            <div className="mt-2">
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted small">{isArabic ? 'نسبة الحضور الإجمالية' : 'Overall Attendance Rate'}</span>
                <span className="fw-bold" style={{ 
                  color: (attendanceStats.present / attendanceStats.total) * 100 >= 75 ? '#2ecc71' : '#f39c12'
                }}>
                  {((attendanceStats.present / attendanceStats.total) * 100).toFixed(1)}%
                </span>
              </div>
              <ProgressBar 
                now={(attendanceStats.present / attendanceStats.total) * 100}
                variant={(attendanceStats.present / attendanceStats.total) * 100 >= 75 ? 'success' : 'warning'}
                style={{ height: '6px', borderRadius: '3px' }}
              />
              <div className="d-flex justify-content-between align-items-center mt-2">
                <span className="text-muted small">{isArabic ? 'نسبة الحضور الشهرية' : 'Monthly Attendance Rate'}</span>
                <span className="fw-bold" style={{ 
                  color: attendanceStats.monthlyTotal > 0 && (attendanceStats.monthlyPresent / attendanceStats.monthlyTotal) * 100 >= 75 ? '#2ecc71' : '#f39c12'
                }}>
                  {attendanceStats.monthlyTotal > 0 ? 
                    `${((attendanceStats.monthlyPresent / attendanceStats.monthlyTotal) * 100).toFixed(1)}%` : 
                    '0%'}
                </span>
              </div>
              <ProgressBar 
                now={attendanceStats.monthlyTotal > 0 ? (attendanceStats.monthlyPresent / attendanceStats.monthlyTotal) * 100 : 0}
                variant={attendanceStats.monthlyTotal > 0 && (attendanceStats.monthlyPresent / attendanceStats.monthlyTotal) * 100 >= 75 ? 'success' : 'warning'}
                style={{ height: '6px', borderRadius: '3px' }}
              />
              <small className="text-muted d-block mt-1" style={arabicFontStyle}>
                {isArabic 
                  ? `آخر 30 يوم: ${formatNumber(attendanceStats.monthlyPresent)}/${formatNumber(attendanceStats.monthlyTotal)} أيام حضور`
                  : `Last 30 days: ${formatNumber(attendanceStats.monthlyPresent)}/${formatNumber(attendanceStats.monthlyTotal)} days present`}
              </small>
            </div>
          ) : (
            <div className="text-center py-3">
              <FaClock size={32} className="text-muted opacity-25 mb-2" />
              <p className="text-muted" style={arabicFontStyle}>
                {isArabic ? 'لا توجد سجلات حضور بعد' : 'No attendance records yet'}
              </p>
              <small className="text-muted" style={arabicFontStyle}>
                {isArabic ? 'سيظهر الحضور بعد تسجيل المعلم' : 'Attendance will appear after teacher marks it'}
              </small>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* ===== SUBJECTS & ASSIGNMENTS CARD ===== */}
      <Card className="shadow-sm border-0 mb-4 modern-card" style={{
        background: darkMode ? '#1a1a2e' : '#ffffff',
        border: `1px solid ${darkMode ? '#2d2d44' : '#e9ecef'}`,
      }}>
        <div className="card-top-bar" style={{
          height: '4px',
          background: 'linear-gradient(90deg, #667eea, #764ba2)',
          transition: 'height 0.4s ease'
        }}></div>
        <Card.Header className="bg-transparent border-0 p-3" style={{ borderBottom: `1px solid ${darkMode ? '#2d2d44' : '#e9ecef'}` }}>
          <h6 className="fw-bold mb-0" style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
            <FaBookOpen className="me-2 text-primary" />
            {isArabic ? 'موادي الدراسية والواجبات' : 'My Subjects & Assignments'}
            <span className="text-muted ms-2" style={{ fontSize: '0.75rem' }}>
              ({formatNumber(studentSubjects.length)} {isArabic ? 'مادة' : 'subjects'})
            </span>
          </h6>
        </Card.Header>
        <Card.Body className="p-3">
          {studentSubjects.length === 0 ? (
            <div className="text-center py-3">
              <FaBookOpen size={32} className="text-muted opacity-25 mb-2" />
              <p className="text-muted" style={arabicFontStyle}>
                {isArabic ? 'لا توجد مواد لهذا المستوى' : 'No subjects for this level'}
              </p>
            </div>
          ) : (
            <Row className="g-2">
              {studentSubjects.map((subject, index) => {
                const subjectAssessments = assessments.filter(a => a.subject === subject.name);
                const hasAssignment = subjectAssessments.length > 0;
                const latestAssessment = subjectAssessments[0];
                const isGraded = latestAssessment?.isGraded;
                const canSubmit = latestAssessment?.canSubmit;
                
                return (
                  <Col key={index} xs={12} sm={6} lg={4}>
                    <div className="subject-card" style={{
                      background: darkMode ? '#1a1a2e' : '#f8f9fa',
                      border: `1px solid ${darkMode ? '#2d2d44' : '#e9ecef'}`,
                      borderRadius: '12px',
                      padding: '12px 16px',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}>
                      <div className="subject-icon" style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${levelColor}, ${levelColor}cc)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '0.9rem',
                        flexShrink: 0,
                      }}>
                        {getSubjectIcon(subject.name)}
                      </div>
                      <div className="flex-grow-1 min-width-0">
                        <div className="fw-semibold text-truncate" style={{ ...arabicFontStyle, fontSize: '0.85rem', color: darkMode ? '#e9ecef' : '#212529' }}>
                          {isArabic ? subject.nameAr || subject.name : subject.name}
                        </div>
                        {hasAssignment ? (
                          <div className="d-flex align-items-center gap-2">
                            <Badge bg={isGraded ? 'success' : (latestAssessment?.hasSubmitted ? 'info' : 'warning')} style={{ fontSize: '0.55rem' }}>
                              {isGraded ? (isArabic ? 'مصحح' : 'Graded') : (latestAssessment?.hasSubmitted ? (isArabic ? 'مرسل' : 'Submitted') : (isArabic ? 'قيد الانتظار' : 'Pending'))}
                            </Badge>
                            {canSubmit && (
                              <Button 
                                variant="outline-primary" 
                                size="sm"
                                onClick={() => {
                                  setSelectedAssessment(latestAssessment);
                                  setShowSubmitModal(true);
                                }}
                                style={{ 
                                  padding: '2px 8px', 
                                  fontSize: '0.6rem', 
                                  borderRadius: '6px',
                                  ...arabicFontStyle
                                }}
                              >
                                <FaUpload className="me-1" size={10} />
                                {isArabic ? 'تقديم' : 'Submit'}
                              </Button>
                            )}
                          </div>
                        ) : (
                          <small className="text-muted" style={{ ...arabicFontStyle, fontSize: '0.65rem' }}>
                            {isArabic ? 'لا توجد واجبات' : 'No assignments'}
                          </small>
                        )}
                      </div>
                      {hasAssignment && (
                        <Button 
                          variant="outline-secondary" 
                          size="sm"
                          onClick={() => {
                            setSelectedAssessment(latestAssessment);
                            setShowViewModal(true);
                          }}
                          style={{ 
                            padding: '2px 6px', 
                            fontSize: '0.6rem', 
                            borderRadius: '6px',
                            flexShrink: 0,
                          }}
                        >
                          <FaEye size={10} />
                        </Button>
                      )}
                    </div>
                  </Col>
                );
              })}
            </Row>
          )}
        </Card.Body>
      </Card>

      {/* ===== SEARCH & FILTER ===== */}
      {assessments.length > 0 && (
        <Card className="shadow-sm border-0 mb-4 modern-card" style={{
          background: darkMode ? '#1a1a2e' : '#ffffff',
          border: `1px solid ${darkMode ? '#2d2d44' : '#e9ecef'}`,
        }}>
          <div className="card-top-bar" style={{
            height: '4px',
            background: 'linear-gradient(90deg, #1a5f7a, #2a7f9a)',
            transition: 'height 0.4s ease'
          }}></div>
          <Card.Body className="p-2 p-md-3">
            <Row className="g-2 align-items-end">
              <Col xs={12} sm={12} md={5}>
                <InputGroup size="sm">
                  <InputGroup.Text style={{ background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529' }}>
                    <FaSearch size={12} />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder={isArabic ? 'بحث في التقييمات...' : 'Search assessments...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ 
                      fontSize: '0.8rem', 
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
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)} 
                  style={{ 
                    fontSize: '0.75rem', 
                    background: darkMode ? '#2d2d44' : 'white', 
                    color: darkMode ? '#e9ecef' : '#212529',
                    ...arabicFontStyle 
                  }}
                >
                  <option value="all">{isArabic ? 'جميع الحالات' : 'All Status'}</option>
                  <option value="graded">{isArabic ? 'مصحح' : 'Graded'}</option>
                  <option value="submitted">{isArabic ? 'مرسل' : 'Submitted'}</option>
                  <option value="pending">{isArabic ? 'قيد الانتظار' : 'Pending'}</option>
                  <option value="closed">{isArabic ? 'مغلق' : 'Closed'}</option>
                </Form.Select>
              </Col>
              <Col xs={6} sm={6} md={3}>
                <Form.Select 
                  size="sm" 
                  value={filterSubject} 
                  onChange={(e) => setFilterSubject(e.target.value)} 
                  style={{ 
                    fontSize: '0.75rem', 
                    background: darkMode ? '#2d2d44' : 'white', 
                    color: darkMode ? '#e9ecef' : '#212529',
                    ...arabicFontStyle 
                  }}
                >
                  <option value="all">{isArabic ? 'جميع المواد' : 'All Subjects'}</option>
                  {subjectNames.map((subject) => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col xs={12} sm={12} md={1}>
                <div className="text-muted small text-center" style={{ color: darkMode ? '#adb5bd' : '#6c757d', ...arabicFontStyle }}>
                  {formatNumber(filteredAssessments.length)}
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* ===== ASSESSMENTS TABLE ===== */}
      <Card className="shadow-sm border-0 modern-card" style={{
        background: darkMode ? '#1a1a2e' : '#ffffff',
        border: `1px solid ${darkMode ? '#2d2d44' : '#e9ecef'}`,
      }}>
        <div className="card-top-bar" style={{
          height: '4px',
          background: 'linear-gradient(90deg, #1a5f7a, #2a7f9a)',
          transition: 'height 0.4s ease'
        }}></div>
        <Card.Header className="bg-transparent border-0 p-3" style={{ borderBottom: `1px solid ${darkMode ? '#2d2d44' : '#e9ecef'}` }}>
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="fw-bold mb-0" style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
              <FaClipboardList className="me-2" />
              {isArabic ? 'التقييمات والواجبات' : 'Assessments & Assignments'}
            </h6>
            <span className="text-muted small" style={{ color: darkMode ? '#adb5bd' : '#6c757d', ...arabicFontStyle }}>
              {formatNumber(filteredAssessments.length)} {isArabic ? 'نتيجة' : 'results'}
            </span>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {assessments.length === 0 ? (
            <div className="text-center py-4">
              <FaClipboardList size={40} className="text-muted opacity-25 mb-2" />
              <p className="text-muted" style={{ ...arabicFontStyle, color: darkMode ? '#adb5bd' : '#6c757d' }}>
                {isArabic ? 'لا توجد تقييمات حتى الآن' : 'No assessments available yet'}
              </p>
            </div>
          ) : filteredAssessments.length === 0 ? (
            <div className="text-center py-4">
              <FaSearch size={40} className="text-muted opacity-25 mb-2" />
              <p className="text-muted" style={{ ...arabicFontStyle, color: darkMode ? '#adb5bd' : '#6c757d' }}>
                {isArabic ? 'لا توجد نتائج تطابق البحث' : 'No assessments match your search'}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead>
                  <tr>
                    <th style={arabicFontStyle}>{isArabic ? 'الواجب' : 'Assignment'}</th>
                    <th style={arabicFontStyle}>{isArabic ? 'المادة' : 'Subject'}</th>
                    <th style={arabicFontStyle}>{isArabic ? 'النوع' : 'Type'}</th>
                    <th style={arabicFontStyle}>{isArabic ? 'الدرجة' : 'Score'}</th>
                    <th style={arabicFontStyle}>{isArabic ? 'الحالة' : 'Status'}</th>
                    <th style={arabicFontStyle}>{isArabic ? 'تاريخ التسليم' : 'Due Date'}</th>
                    <th style={arabicFontStyle}>{isArabic ? 'الإجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedAssessments.map((assessment) => {
                    const statusInfo = getStatusBadge(assessment.isGraded ? 'graded' : (assessment.hasSubmitted ? 'submitted' : assessment.status));
                    const typeInfo = getTypeBadge(assessment.type);
                    const gradeColor = getGradeColor(assessment.studentScore, assessment.totalMarks);
                    
                    return (
                      <tr key={assessment.id}>
                        <td>
                          <div className="fw-semibold" style={{ ...arabicFontStyle, fontSize: '0.85rem', color: darkMode ? '#e9ecef' : '#212529' }}>{assessment.title}</div>
                          <small className="text-muted" style={{ ...arabicFontStyle, fontSize: '0.65rem', color: darkMode ? '#adb5bd' : '#6c757d' }}>{assessment.description?.substring(0, 50)}...</small>
                        </td>
                        <td style={{ ...arabicFontStyle, fontSize: '0.85rem', color: darkMode ? '#e9ecef' : '#212529' }}>{assessment.subject}</td>
                        <td>
                          <Badge bg={typeInfo.bg} className="px-2 py-1" style={{ fontSize: '0.6rem' }}>
                            {typeInfo.icon} {typeInfo.label}
                          </Badge>
                        </td>
                        <td>
                          {assessment.isGraded ? (
                            <div>
                              <span className="fw-bold" style={{ color: gradeColor }}>
                                {formatNumber(assessment.studentScore)}/{formatNumber(assessment.totalMarks)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted" style={{ ...arabicFontStyle, fontSize: '0.7rem', color: darkMode ? '#adb5bd' : '#6c757d' }}>{isArabic ? 'لم يصحح' : 'Not graded'}</span>
                          )}
                        </td>
                        <td>
                          <Badge bg={statusInfo.bg} className="px-2 py-1" style={{ fontSize: '0.6rem' }}>
                            {statusInfo.icon} {statusInfo.label}
                          </Badge>
                        </td>
                        <td style={{ ...arabicFontStyle, fontSize: '0.8rem', color: darkMode ? '#e9ecef' : '#212529' }}>{assessment.dueDate}</td>
                        <td>
                          <div className="d-flex gap-1">
                            <Button variant="outline-primary" size="sm" onClick={() => { setSelectedAssessment(assessment); setShowViewModal(true); }}>
                              <FaEye size={12} />
                            </Button>
                            {assessment.canSubmit && (
                              <Button variant="outline-success" size="sm" onClick={() => { setSelectedAssessment(assessment); setShowSubmitModal(true); }}>
                                <FaUpload size={12} />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* ===== PAGINATION ===== */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <Pagination size="sm" className="responsive-pagination">
            <Pagination.Prev onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} />
            {[...Array(Math.min(totalPages, 5))].map((_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <Pagination.Item key={pageNum} active={currentPage === pageNum} onClick={() => setCurrentPage(pageNum)}>
                  {formatNumber(pageNum)}
                </Pagination.Item>
              );
            })}
            {totalPages > 5 && currentPage < totalPages - 2 && <Pagination.Ellipsis />}
            <Pagination.Next onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} />
          </Pagination>
        </div>
      )}

      {/* ===== LATEST ANNOUNCEMENTS - MOVED TO BOTTOM ===== */}
      <Card className="shadow-sm border-0 mt-4 modern-card" style={{
        background: darkMode ? '#1a1a2e' : '#ffffff',
        border: `1px solid ${darkMode ? '#2d2d44' : '#e9ecef'}`,
        borderRadius: '16px',
        overflow: 'hidden',
      }}>
        <div className="card-top-bar" style={{
          height: '4px',
          background: 'linear-gradient(90deg, #c49a6c, #dbb88a)',
          transition: 'height 0.4s ease'
        }}></div>
        <Card.Header className="bg-transparent border-0 p-3 d-flex justify-content-between align-items-center" style={{ borderBottom: `1px solid ${darkMode ? '#2d2d44' : '#e9ecef'}` }}>
          <h6 className="fw-bold mb-0" style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
            <FaBullhorn className="me-2 text-warning" />
            {isArabic ? 'آخر الإعلانات' : 'Latest Announcements'}
          </h6>
          <Button 
            variant="link" 
            size="sm" 
            className="text-decoration-none"
            onClick={() => navigate('/dashboard/student/announcements')}
            style={{ color: '#c49a6c' }}
          >
            {isArabic ? 'عرض الكل' : 'View All'} <FaArrowRight size={12} className="ms-1" />
          </Button>
        </Card.Header>
        <Card.Body className="p-3">
          {announcements.length === 0 ? (
            <div className="text-center py-3">
              <FaBullhorn size={32} className="text-muted opacity-25 mb-2" />
              <p className="text-muted" style={{ ...arabicFontStyle, color: darkMode ? '#adb5bd' : '#6c757d' }}>
                {isArabic ? 'لا توجد إعلانات جديدة' : 'No new announcements'}
              </p>
              <Button 
                variant="outline-primary" 
                size="sm" 
                onClick={() => navigate('/dashboard/student/announcements')}
                style={{ borderRadius: '50px' }}
              >
                {isArabic ? 'عرض الإعلانات' : 'View Announcements'}
              </Button>
            </div>
          ) : (
            announcements.map((ann, index) => {
              const { title, content } = getTranslatedAnnouncement(ann);
              const isUrgent = ann.priority === 'high';
              
              return (
                <div 
                  key={ann.id} 
                  className={`announcement-item ${index < announcements.length - 1 ? 'border-bottom' : ''}`}
                  style={{ 
                    padding: '12px 0',
                    borderColor: darkMode ? '#2d2d44' : '#e9ecef',
                    cursor: 'pointer'
                  }}
                  onClick={() => navigate('/dashboard/student/announcements')}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <h6 className="mb-1 fw-semibold" style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                          {title}
                        </h6>
                        {isUrgent && (
                          <Badge bg="danger" className="rounded-pill" style={{ fontSize: '0.55rem' }}>
                            {isArabic ? 'عاجل' : 'Urgent'}
                          </Badge>
                        )}
                        {!ann.isRead && (
                          <Badge bg="info" className="rounded-pill" style={{ fontSize: '0.5rem' }}>
                            {isArabic ? 'جديد' : 'New'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted small mb-1" style={{ ...arabicFontStyle, fontSize: '0.8rem' }}>
                        {content && content.length > 100 ? content.substring(0, 100) + '...' : content}
                      </p>
                      <div className="d-flex align-items-center gap-3">
                        <small className="text-muted" style={{ fontSize: '0.65rem' }}>
                          <FaClock className="me-1" size={10} />
                          {ann.date || new Date(ann.createdAt).toLocaleDateString()}
                        </small>
                        <small className="text-muted" style={{ fontSize: '0.65rem' }}>
                          <FaUser className="me-1" size={10} />
                          {ann.author || (isArabic ? 'المسؤول' : 'Admin')}
                        </small>
                      </div>
                    </div>
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/dashboard/student/announcements');
                      }}
                      style={{ borderRadius: '50px', flexShrink: 0, marginLeft: '8px' }}
                    >
                      {isArabic ? 'اقرأ' : 'Read'}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </Card.Body>
      </Card>

      {/* ===== VIEW MODAL ===== */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} centered size="lg" className="modern-modal">
        <Modal.Header closeButton className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Modal.Title style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
            <FaEye className="me-2 text-primary" />
            {isArabic ? 'تفاصيل الواجب' : 'Assignment Details'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? '#0d1117' : 'white' }}>
          {selectedAssessment && (
            <div>
              <div className="view-assessment-header">
                <h5 className="fw-bold" style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>{selectedAssessment.title}</h5>
                <div className="d-flex flex-wrap gap-2 mt-2">
                  <Badge bg={getTypeBadge(selectedAssessment.type).bg}>
                    {getTypeBadge(selectedAssessment.type).icon} {getTypeBadge(selectedAssessment.type).label}
                  </Badge>
                  <Badge bg={getStatusBadge(selectedAssessment.isGraded ? 'graded' : (selectedAssessment.hasSubmitted ? 'submitted' : selectedAssessment.status)).bg}>
                    {getStatusBadge(selectedAssessment.isGraded ? 'graded' : (selectedAssessment.hasSubmitted ? 'submitted' : selectedAssessment.status)).icon} {getStatusBadge(selectedAssessment.isGraded ? 'graded' : (selectedAssessment.hasSubmitted ? 'submitted' : selectedAssessment.status)).label}
                  </Badge>
                </div>
              </div>
              <hr style={{ borderColor: darkMode ? '#2d2d44' : '#e9ecef' }} />
              <div className="view-assessment-body">
                <Row>
                  <Col md={6}>
                    <div className="detail-item">
                      <label className="text-muted small" style={{ ...arabicFontStyle, color: darkMode ? '#adb5bd' : '#6c757d' }}>{isArabic ? 'المادة' : 'Subject'}</label>
                      <p className="fw-semibold mb-0" style={{ color: darkMode ? '#e9ecef' : '#212529', ...arabicFontStyle }}>{selectedAssessment.subject}</p>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="detail-item">
                      <label className="text-muted small" style={{ ...arabicFontStyle, color: darkMode ? '#adb5bd' : '#6c757d' }}>{isArabic ? 'الدرجة الكلية' : 'Max Score'}</label>
                      <p className="fw-semibold mb-0" style={{ color: darkMode ? '#e9ecef' : '#212529', ...arabicFontStyle }}>{formatNumber(selectedAssessment.totalMarks)}</p>
                    </div>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <div className="detail-item">
                      <label className="text-muted small" style={{ ...arabicFontStyle, color: darkMode ? '#adb5bd' : '#6c757d' }}>{isArabic ? 'الدرجة' : 'Score'}</label>
                      <p className="fw-semibold mb-0" style={{ color: darkMode ? '#e9ecef' : '#212529', ...arabicFontStyle }}>
                        {selectedAssessment.isGraded ? `${formatNumber(selectedAssessment.studentScore)} / ${formatNumber(selectedAssessment.totalMarks)}` : (selectedAssessment.hasSubmitted ? isArabic ? 'بانتظار التصحيح' : 'Pending grading' : isArabic ? 'لم يصحح' : 'Not graded')}
                      </p>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="detail-item">
                      <label className="text-muted small" style={{ ...arabicFontStyle, color: darkMode ? '#adb5bd' : '#6c757d' }}>{isArabic ? 'تاريخ التسليم' : 'Due Date'}</label>
                      <p className="fw-semibold mb-0" style={{ color: darkMode ? '#e9ecef' : '#212529', ...arabicFontStyle }}>{selectedAssessment.dueDate}</p>
                    </div>
                  </Col>
                </Row>
                {selectedAssessment.description && (
                  <div className="detail-item mt-2">
                    <label className="text-muted small" style={{ ...arabicFontStyle, color: darkMode ? '#adb5bd' : '#6c757d' }}>{isArabic ? 'الوصف' : 'Description'}</label>
                    <p className="mb-0" style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>{selectedAssessment.description}</p>
                  </div>
                )}
                {selectedAssessment.isGraded && selectedAssessment.studentGrade?.gradedAt && (
                  <div className="detail-item mt-2">
                    <label className="text-muted small" style={{ ...arabicFontStyle, color: darkMode ? '#adb5bd' : '#6c757d' }}>{isArabic ? 'تاريخ التصحيح' : 'Graded on'}</label>
                    <p className="fw-semibold mb-0" style={{ color: darkMode ? '#e9ecef' : '#212529', ...arabicFontStyle }}>
                      {new Date(selectedAssessment.studentGrade.gradedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {selectedAssessment.hasSubmitted && selectedAssessment.submissionDate && (
                  <div className="detail-item mt-2">
                    <label className="text-muted small" style={{ ...arabicFontStyle, color: darkMode ? '#adb5bd' : '#6c757d' }}>{isArabic ? 'تاريخ التقديم' : 'Submitted on'}</label>
                    <p className="fw-semibold mb-0" style={{ color: darkMode ? '#e9ecef' : '#212529', ...arabicFontStyle }}>
                      {new Date(selectedAssessment.submissionDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Button variant="secondary" onClick={() => setShowViewModal(false)} style={arabicFontStyle}>
            {isArabic ? 'إغلاق' : 'Close'}
          </Button>
          {selectedAssessment?.canSubmit && (
            <Button variant="success" onClick={() => { setShowViewModal(false); setShowSubmitModal(true); }} style={arabicFontStyle}>
              <FaUpload className="me-2" /> {isArabic ? 'تقديم' : 'Submit'}
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* ===== SUBMIT MODAL ===== */}
      <Modal show={showSubmitModal} onHide={() => setShowSubmitModal(false)} centered size="md" className="modern-modal">
        <Modal.Header closeButton className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Modal.Title style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
            <FaUpload className="me-2 text-primary" />
            {isArabic ? 'تقديم الواجب' : 'Submit Assignment'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? '#0d1117' : 'white' }}>
          {selectedAssessment && (
            <>
              <Alert variant="info" className="mb-3" style={{ ...arabicFontStyle, background: darkMode ? '#1a2a3a' : '#e3f2fd' }}>
                <FaInfoCircle className="me-2" />
                <span>{isArabic ? 'تقديم: ' : 'Submitting: '} <strong>{selectedAssessment.title}</strong></span>
                <br />
                <small className="text-muted">{isArabic ? 'المادة: ' : 'Subject: '} {selectedAssessment.subject}</small>
                <br />
                <small className="text-muted">{isArabic ? 'تاريخ التسليم: ' : 'Due Date: '} {selectedAssessment.dueDate}</small>
              </Alert>
              <Form.Group className="mb-3">
                <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                  <FaFileAlt className="me-2" />
                  {isArabic ? 'رفع الملف (اختياري)' : 'Upload File (Optional)'}
                </Form.Label>
                <Form.Control
                  type="file"
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.png"
                  style={{ 
                    background: darkMode ? '#2d2d44' : 'white', 
                    color: darkMode ? '#e9ecef' : '#212529',
                    borderColor: darkMode ? '#3d3d5c' : '#e9ecef',
                    borderRadius: '12px',
                  }}
                />
                <Form.Text className="text-muted" style={{ ...arabicFontStyle, color: darkMode ? '#adb5bd' : '#6c757d' }}>
                  {isArabic ? 'الملفات المدعومة: PDF, Word, PowerPoint, Excel, TXT, صور' : 'Supported files: PDF, Word, PowerPoint, Excel, TXT, Images'}
                </Form.Text>
                {submissionFile && (
                  <div className="mt-2 text-success" style={{ ...arabicFontStyle, fontSize: '0.85rem' }}>
                    <FaCheckCircle className="me-1" /> {isArabic ? 'تم اختيار الملف: ' : 'File selected: '} {submissionFile.name}
                  </div>
                )}
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                  {isArabic ? 'ملاحظات (اختياري)' : 'Notes (Optional)'}
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={submissionNote}
                  onChange={(e) => setSubmissionNote(e.target.value)}
                  placeholder={isArabic ? 'أضف أي ملاحظات إضافية...' : 'Add any additional notes...'}
                  style={{ 
                    ...arabicFontStyle,
                    background: darkMode ? '#2d2d44' : 'white', 
                    color: darkMode ? '#e9ecef' : '#212529',
                    borderColor: darkMode ? '#3d3d5c' : '#e9ecef',
                    borderRadius: '12px',
                  }}
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Button variant="secondary" onClick={() => setShowSubmitModal(false)} style={arabicFontStyle}>
            {isArabic ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button variant="success" onClick={handleSubmitAssessment} disabled={submitting} style={arabicFontStyle}>
            {submitting ? (
              <>
                <FaSpinner className="spinning me-2" />
                {isArabic ? 'جاري التقديم...' : 'Submitting...'}
              </>
            ) : (
              <>
                <FaPaperPlane className="me-2" />
                {isArabic ? 'تقديم' : 'Submit'}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        @keyframes floatBubble {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-10px, -15px) scale(1.1); }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        .student-dashboard { padding: 0; }

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
          gap: 12px;
        }

        .header-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .card-top-bar {
          transition: height 0.4s ease;
        }
        .student-profile-card:hover .card-top-bar,
        .modern-card:hover .card-top-bar {
          height: 6px;
        }

        .student-profile-card {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .student-profile-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.08) !important;
        }

        .student-avatar-modern {
          transition: transform 0.4s ease;
        }
        .student-profile-card:hover .student-avatar-modern {
          transform: scale(1.08) rotate(-5deg);
        }

        .student-info-tag {
          transition: all 0.3s ease;
        }
        .student-profile-card:hover .student-info-tag {
          transform: translateY(-1px);
        }

        .stat-card-gradient {
          border-radius: 16px;
          padding: 16px 20px;
          color: white;
          position: relative;
          overflow: hidden;
          min-height: 110px;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: default;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .stat-card-gradient:hover {
          transform: translateY(-6px) scale(1.02);
          box-shadow: 0 16px 50px rgba(0,0,0,0.25) !important;
        }

        .stat-card-gradient-bg1 {
          position: absolute;
          top: -40px;
          right: -40px;
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
          animation: floatBubble 8s ease-in-out infinite;
        }
        .stat-card-gradient-bg2 {
          position: absolute;
          bottom: -30px;
          left: -30px;
          width: 70px;
          height: 70px;
          border-radius: 50%;
          background: rgba(255,255,255,0.06);
          animation: floatBubble 6s ease-in-out infinite reverse;
        }
        .stat-card-gradient-bg3 {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 150px;
          height: 150px;
          border-radius: 50%;
          background: rgba(255,255,255,0.03);
          animation: floatBubble 10s ease-in-out infinite;
        }

        .stat-card-gradient-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
          z-index: 1;
          width: 100%;
        }

        .stat-card-gradient-text {
          flex: 1;
          min-width: 0;
        }

        .stat-label-gradient {
          font-size: 0.6rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          opacity: 0.9;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .stat-number-gradient {
          font-size: 1.6rem;
          font-weight: 700;
          line-height: 1.2;
          margin-top: 2px;
        }
        .stat-subtitle-gradient {
          font-size: 0.6rem;
          opacity: 0.8;
          margin-top: 2px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .stat-icon-gradient {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          backdrop-filter: blur(5px);
          transition: all 0.4s ease;
          flex-shrink: 0;
        }
        .stat-card-gradient:hover .stat-icon-gradient {
          transform: rotate(10deg) scale(1.1);
          background: rgba(255,255,255,0.3);
        }

        .stat-progress-gradient {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: rgba(255,255,255,0.2);
          border-radius: 0 0 16px 16px;
          overflow: hidden;
          z-index: 1;
        }
        .stat-progress-gradient div {
          height: 100%;
          background: rgba(255,255,255,0.6);
          border-radius: 0 0 16px 16px;
          transition: width 1.5s ease;
          width: 100%;
        }

        .modern-card {
          border-radius: 16px !important;
          transition: all 0.3s ease;
          overflow: hidden;
        }
        .modern-card:hover {
          box-shadow: 0 8px 30px rgba(0,0,0,0.06) !important;
        }

        .announcement-item {
          transition: background 0.2s ease;
          border-radius: 8px;
          padding: 8px 12px;
          cursor: pointer;
        }
        .announcement-item:hover {
          background: rgba(196, 154, 108, 0.05);
        }

        .subject-card {
          transition: all 0.3s ease;
        }

        .subject-card:hover .subject-icon {
          transform: scale(1.1);
        }

        .subject-icon {
          transition: transform 0.3s ease;
        }

        .table th {
          font-weight: 600;
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #6c757d;
          border-bottom: 2px solid #e9ecef;
          padding: 10px 16px;
        }
        .table td {
          vertical-align: middle;
          padding: 10px 16px;
          font-size: 0.85rem;
        }

        .detail-item { margin-bottom: 8px; }
        .detail-item label { display: block; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px; color: #6c757d; margin-bottom: 2px; }

        .responsive-pagination .page-link {
          padding: 4px 10px;
          font-size: 0.75rem;
        }

        .view-assessment-header {
          margin-bottom: 4px;
        }
        .view-assessment-body {
          margin-top: 4px;
        }

        .modern-modal .modal-content {
          border-radius: 20px !important;
          border: none !important;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
          overflow: hidden;
        }

        .dashboard-wrapper.rtl .stat-card-gradient-content {
          flex-direction: row-reverse;
        }
        .dashboard-wrapper.rtl .stat-icon-gradient {
          margin-left: 0;
          margin-right: 12px;
        }
        .dashboard-wrapper.rtl .stat-label-gradient {
          text-align: right;
        }

        .dashboard-wrapper.dark-theme .modern-card {
          background: #1a1a2e !important;
          border-color: #2d2d44 !important;
        }
        .dashboard-wrapper.dark-theme .table td {
          color: #e9ecef !important;
        }
        .dashboard-wrapper.dark-theme .table th {
          color: #adb5bd !important;
          border-color: #2d2d44 !important;
        }
        .dashboard-wrapper.dark-theme .student-profile-card {
          background: #1a1a2e !important;
          border-color: #2d2d44 !important;
        }
        .dashboard-wrapper.dark-theme .modal-content {
          background: #1a1a2e !important;
        }
        .dashboard-wrapper.dark-theme .modal-body {
          background: #0d1117 !important;
        }
        .dashboard-wrapper.dark-theme .modal-header {
          background: #1a1a2e !important;
        }
        .dashboard-wrapper.dark-theme .modal-footer {
          background: #1a1a2e !important;
        }
        .dashboard-wrapper.dark-theme .announcement-item:hover {
          background: rgba(196, 154, 108, 0.08);
        }

        @media (max-width: 768px) {
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
          .student-avatar-modern {
            width: 60px !important;
            height: 60px !important;
            font-size: 1.5rem !important;
          }
          .stat-card-gradient {
            min-height: 90px !important;
            padding: 12px 14px !important;
          }
          .stat-number-gradient {
            font-size: 1.3rem !important;
          }
          .stat-icon-gradient {
            width: 32px !important;
            height: 32px !important;
            font-size: 0.9rem !important;
          }
          .stat-subtitle-gradient {
            font-size: 0.5rem !important;
          }
          .table th,
          .table td {
            font-size: 0.75rem;
            padding: 8px 12px;
          }
          .student-info-tag {
            font-size: 0.65rem !important;
            padding: 1px 8px !important;
          }
          .student-profile-card .p-4 {
            padding: 16px !important;
          }
          .subject-card {
            padding: 10px 12px !important;
          }
          .subject-card .subject-icon {
            width: 30px !important;
            height: 30px !important;
            font-size: 0.75rem !important;
          }
          .announcement-item {
            padding: 8px 0 !important;
          }
        }

        @media (max-width: 576px) {
          .stat-card-gradient {
            min-height: 80px !important;
            padding: 10px 12px !important;
            border-radius: 12px !important;
          }
          .stat-number-gradient {
            font-size: 1.1rem !important;
          }
          .stat-label-gradient {
            font-size: 0.5rem !important;
          }
          .stat-icon-gradient {
            width: 28px !important;
            height: 28px !important;
            font-size: 0.7rem !important;
          }
          .stat-subtitle-gradient {
            font-size: 0.45rem !important;
          }
          .student-avatar-modern {
            width: 50px !important;
            height: 50px !important;
            font-size: 1.2rem !important;
          }
          .student-profile-card .d-flex {
            flex-direction: column;
            align-items: center !important;
            text-align: center;
          }
          .table th,
          .table td {
            font-size: 0.65rem;
            padding: 6px 8px;
          }
          .header-actions .btn {
            font-size: 0.7rem !important;
            padding: 4px 10px !important;
          }
          .stat-card-gradient-bg1 {
            width: 50px;
            height: 50px;
            top: -20px;
            right: -20px;
          }
          .stat-card-gradient-bg2 {
            width: 35px;
            height: 35px;
            bottom: -15px;
            left: -15px;
          }
          .subject-card {
            padding: 8px 10px !important;
          }
          .subject-card .subject-icon {
            width: 26px !important;
            height: 26px !important;
            font-size: 0.65rem !important;
          }
          .subject-card .fw-semibold {
            font-size: 0.75rem !important;
          }
          .announcement-item h6 {
            font-size: 0.8rem !important;
          }
          .announcement-item p {
            font-size: 0.7rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default StudentDashboard;