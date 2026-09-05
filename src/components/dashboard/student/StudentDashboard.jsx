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
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, absent: 0, late: 0, excused: 0, total: 0, monthlyPresent: 0, monthlyTotal: 0 });
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState(null);
  const [allStudents, setAllStudents] = useState([]);
  const [paymentStatus, setPaymentStatus] = useState({ status: 'pending', amount: 0, dueDate: '' });
  const [subjects, setSubjects] = useState([]);
  const [studentSubjects, setStudentSubjects] = useState([]);
  
  // ===== ANNOUNCEMENTS & NOTIFICATIONS STATE - ALL DEFAULT TO 0 =====
  const [announcements, setAnnouncements] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadAssessments, setUnreadAssessments] = useState(0);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [newAnnouncementCount, setNewAnnouncementCount] = useState(0);
  
  // ===== MODAL STATE =====
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

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

  // ===== LOAD ANNOUNCEMENTS & NOTIFICATIONS =====
  const loadAnnouncementsAndNotifications = () => {
    try {
      const studentId = studentData?.id || user?.id || 'student_1';
      
      // Load announcements
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

      // Count new announcements (unread) - default to 0
      let newCount = 0;
      try {
        const readAnnouncements = JSON.parse(localStorage.getItem('read_announcements') || '[]');
        newCount = sortedAnnouncements.filter(a => {
          const readKey = `${a.id}_${studentId}`;
          return !readAnnouncements.includes(readKey);
        }).length;
      } catch (e) {
        console.warn('Error reading read_announcements:', e);
      }
      setNewAnnouncementCount(newCount);

      // Load notifications from school_notifications - default to 0
      let unread = 0;
      try {
        const allNotifications = JSON.parse(localStorage.getItem('school_notifications') || '[]');
        unread = allNotifications.filter(n => {
          const isForStudent = n.targetAudience?.includes('all') || 
                              n.targetAudience?.includes('students') ||
                              n.recipientRole === 'student' ||
                              n.studentId === studentId;
          return isForStudent && !n.read;
        }).length;
      } catch (e) {
        console.warn('Error reading school_notifications:', e);
      }
      setUnreadNotifications(unread);

      // Load unread assessments from student_assessments - default to 0
      let myUnreadAssessments = 0;
      try {
        const studentAssessments = JSON.parse(localStorage.getItem('student_assessments') || '[]');
        myUnreadAssessments = studentAssessments.filter(a => 
          a.studentId === studentId && !a.read
        ).length;
      } catch (e) {
        console.warn('Error reading student_assessments:', e);
      }
      setUnreadAssessments(myUnreadAssessments);

      // Check for new assessments from school_assessments - default to 0
      let newAssessments = 0;
      try {
        const allAssessments = JSON.parse(localStorage.getItem('school_assessments') || '[]');
        newAssessments = allAssessments.filter(a => 
          a.studentId === studentId && 
          (a.status === 'sent_to_students' || a.status === 'published') &&
          !a.readByStudent
        ).length;
      } catch (e) {
        console.warn('Error reading school_assessments:', e);
      }
      
      // Total notifications = sum of all - default to 0
      const total = unread + myUnreadAssessments + newAssessments + newCount;
      setTotalNotifications(total);
      
      console.log('🔔 Total notifications:', total, 
        '(Notifications:', unread, 
        'Assessments:', myUnreadAssessments, 
        'New:', newAssessments,
        'Announcements:', newCount, ')');
      
    } catch (error) {
      console.error('Error loading announcements:', error);
      // Set all to 0 on error
      setNewAnnouncementCount(0);
      setUnreadNotifications(0);
      setUnreadAssessments(0);
      setTotalNotifications(0);
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

      // ===== LOAD ANNOUNCEMENTS & NOTIFICATIONS =====
      loadAnnouncementsAndNotifications();

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
        e.key === "announcements" ||
        e.key === "student_assessments" ||
        e.key === "read_announcements"
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

    const handleStudentAssessmentsUpdated = () => {
      console.log("📝 Student assessments updated, refreshing");
      loadStudentData();
    };
    window.addEventListener("studentAssessmentsUpdated", handleStudentAssessmentsUpdated);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("assessmentChanged", handleAssessmentChanged);
      window.removeEventListener("attendanceUpdated", handleAttendanceUpdated);
      window.removeEventListener("paymentUpdated", handlePaymentUpdated);
      window.removeEventListener("submissionChanged", handleSubmissionChanged);
      window.removeEventListener("notificationAdded", handleNotificationAdded);
      window.removeEventListener("announcementsUpdated", handleAnnouncementsUpdated);
      window.removeEventListener("studentAssessmentsUpdated", handleStudentAssessmentsUpdated);
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
            <Button 
              variant="primary" 
              size="sm" 
              className="position-relative"
              onClick={() => navigate('/dashboard/student/announcements')}
            >
              <FaBell className="me-1" /> 
              {isArabic ? 'الإشعارات والإعلانات' : 'Notifications & Announcements'}
              {totalNotifications > 0 && (
                <Badge 
                  bg="danger" 
                  className="ms-2 rounded-pill notification-badge"
                  style={{ 
                    fontSize: '0.6rem',
                    animation: totalNotifications > 0 ? 'pulse-badge 2s infinite' : 'none'
                  }}
                >
                  {totalNotifications}
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

      {/* ===== SUBJECTS CARD ===== */}
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
            {isArabic ? 'موادي الدراسية' : 'My Subjects'}
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
                return (
                  <Col key={index} xs={12} sm={6} lg={3}>
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
                      </div>
                    </div>
                  </Col>
                );
              })}
            </Row>
          )}
        </Card.Body>
      </Card>

      {/* ===== LATEST ANNOUNCEMENTS ===== */}
      <Card className="shadow-sm border-0 modern-card" style={{
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
            {newAnnouncementCount > 0 && (
              <Badge bg="danger" className="ms-2 rounded-pill" style={{ fontSize: '0.55rem' }}>
                +{newAnnouncementCount}
              </Badge>
            )}
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
              const studentId = studentData?.id || user?.id || 'student_1';
              const readAnnouncements = JSON.parse(localStorage.getItem('read_announcements') || '[]');
              const readKey = `${ann.id}_${studentId}`;
              const isRead = readAnnouncements.includes(readKey);
              
              return (
                <div 
                  key={ann.id} 
                  className={`announcement-item ${index < announcements.length - 1 ? 'border-bottom' : ''}`}
                  style={{ 
                    padding: '12px 0',
                    borderColor: darkMode ? '#2d2d44' : '#e9ecef',
                    cursor: 'pointer'
                  }}
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
                        {!isRead && (
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
                      variant={!isRead ? "primary" : "outline-primary"} 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Mark as read when clicked
                        if (!isRead) {
                          const readList = JSON.parse(localStorage.getItem('read_announcements') || '[]');
                          if (!readList.includes(readKey)) {
                            readList.push(readKey);
                            localStorage.setItem('read_announcements', JSON.stringify(readList));
                            // Update local state
                            setNewAnnouncementCount(prev => Math.max(0, prev - 1));
                            setTotalNotifications(prev => Math.max(0, prev - 1));
                          }
                        }
                        navigate('/dashboard/student/announcements');
                      }}
                      style={{ borderRadius: '50px', flexShrink: 0, marginLeft: '8px' }}
                    >
                      {!isRead ? (isArabic ? 'اقرأ' : 'Read') : (isArabic ? 'فتح' : 'Open')}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </Card.Body>
      </Card>

      <style>{`
        @keyframes floatBubble {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-10px, -15px) scale(1.1); }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes pulse-badge {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        .student-dashboard { padding: 0; }

        .notification-badge {
          animation: pulse-badge 2s infinite;
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
        .dashboard-wrapper.dark-theme .student-profile-card {
          background: #1a1a2e !important;
          border-color: #2d2d44 !important;
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