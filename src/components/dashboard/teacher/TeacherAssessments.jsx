// src/components/dashboard/teacher/TeacherAssessments.jsx
import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Table, Modal, Form, Row, Col, Alert } from 'react-bootstrap';
import { 
  FaPlus, FaEdit, FaTrash, FaEye, FaCheckCircle, FaClock, 
  FaFileAlt, FaSave, FaTimes, FaFilter, FaSearch, FaDownload,
  FaUsers, FaSpinner, FaExclamationTriangle, FaSync, FaArrowRight,
  FaBook, FaChalkboardTeacher, FaGraduationCap, FaUserGraduate,
  FaUser, FaEnvelope, FaIdCard, FaFile, FaUpload,
  FaTimesCircle, FaFilePdf, FaFileWord, FaFileImage, FaFileCode,
  FaUserCircle, FaInfoCircle, FaPrint, FaExternalLinkAlt,
  FaPaperPlane, FaUserCheck, FaBell, FaInbox, FaCheckDouble,
  FaTrashAlt, FaPen, FaCheck, FaUpload as FaUploadIcon
} from 'react-icons/fa';
import { useLanguage } from '../../../context/LanguageContext';
import { useNotification } from '../../../hooks/useNotification';
import { teacherService } from '../../../services/teacherService';

// ===== ALWAYS use English numbers =====
const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  return num.toString();
};

// ===== HELPER: Clean old notifications =====
const cleanOldNotifications = () => {
  try {
    const studentNotifs = JSON.parse(localStorage.getItem('student_notifications') || '[]');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cleaned = studentNotifs.filter(n => {
      const date = new Date(n.createdAt || n.sentAt || Date.now());
      return date > thirtyDaysAgo;
    });
    if (cleaned.length < studentNotifs.length) {
      localStorage.setItem('student_notifications', JSON.stringify(cleaned));
    }
  } catch (e) {
    console.warn('Error cleaning notifications:', e);
  }
};

const TeacherAssessments = () => {
  const { isArabic } = useLanguage();
  const { notify } = useNotification();
  const [darkMode, setDarkMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [assessments, setAssessments] = useState([]);
  const [filteredAssessments, setFilteredAssessments] = useState([]);
  const [forwardedSubmissions, setForwardedSubmissions] = useState([]);
  const [filteredForwarded, setFilteredForwarded] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('my_assessments');
  const [showModal, setShowModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [showForwardedViewModal, setShowForwardedViewModal] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState(null);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedStudentGrades, setSelectedStudentGrades] = useState([]);
  const [submissionContent, setSubmissionContent] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [teacher, setTeacher] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [gradeData, setGradeData] = useState({});
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedClassLevel, setSelectedClassLevel] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [gradingStudents, setGradingStudents] = useState([]);
  const [showSubmissionViewModal, setShowSubmissionViewModal] = useState(false);
  const [viewingSubmission, setViewingSubmission] = useState(null);
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentFileName, setAttachmentFileName] = useState('');
  const [teacherAssignedSubjects, setTeacherAssignedSubjects] = useState([]);
  const [selectedForwardedItem, setSelectedForwardedItem] = useState(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showForwardedGradeModal, setShowForwardedGradeModal] = useState(false);
  const [forwardedGradeData, setForwardedGradeData] = useState({});
  const [showDeleteForwardedModal, setShowDeleteForwardedModal] = useState(false);
  const [forwardedItemToDelete, setForwardedItemToDelete] = useState(null);

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

  // ===== FORM DATA =====
  const [formData, setFormData] = useState({
    title: '',
    type: 'homework',
    classId: '',
    subject: '',
    description: '',
    totalMarks: 20,
    dueDate: '',
    status: 'draft',
    assignedStudents: [],
    attachment: null,
    attachmentName: '',
    attachmentType: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // ===== GET TEACHER'S ASSIGNED CLASSES =====
  const getTeacherClasses = (teacherId) => {
    let classList = [];

    try {
      const teachers = JSON.parse(localStorage.getItem('school_teachers') || '[]');
      let teacher = null;
      
      if (teacherId) {
        teacher = teachers.find(t => t.id === teacherId);
      }
      
      if (!teacher) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        teacher = teachers.find(t => t.email === currentUser.email || t.id === currentUser.id);
      }
      
      if (teacher) {
        let classIds = [];
        if (teacher.assignedClasses && Array.isArray(teacher.assignedClasses)) {
          classIds = teacher.assignedClasses;
        } else if (teacher.classes && Array.isArray(teacher.classes)) {
          classIds = teacher.classes;
        }
        
        if (classIds.length > 0) {
          const allClasses = JSON.parse(localStorage.getItem('school_classes') || '[]');
          classIds.forEach(id => {
            const classId = typeof id === 'object' ? id.id || id : id;
            const foundClass = allClasses.find(c => c.id === classId);
            if (foundClass && !classList.find(c => c.id === foundClass.id)) {
              classList.push(foundClass);
            }
          });
        }
      }
    } catch (e) {
      console.warn('Error loading from school_teachers:', e);
    }

    if (classList.length === 0) {
      try {
        const users = JSON.parse(localStorage.getItem('school_users') || '[]');
        let user = null;
        
        if (teacherId) {
          user = users.find(u => u.id === teacherId);
        }
        
        if (!user) {
          const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
          user = users.find(u => u.email === currentUser.email || u.id === currentUser.id);
        }
        
        if (user && user.role === 'teacher') {
          let classIds = [];
          if (user.assignedClasses && Array.isArray(user.assignedClasses)) {
            classIds = user.assignedClasses;
          }
          
          if (classIds.length > 0) {
            const allClasses = JSON.parse(localStorage.getItem('school_classes') || '[]');
            classIds.forEach(id => {
              const classId = typeof id === 'object' ? id.id || id : id;
              const foundClass = allClasses.find(c => c.id === classId);
              if (foundClass && !classList.find(c => c.id === foundClass.id)) {
                classList.push(foundClass);
              }
            });
          }
        }
      } catch (e) {
        console.warn('Error loading from school_users:', e);
      }
    }

    if (classList.length === 0) {
      try {
        const serviceClasses = teacherService.getAssignedClasses(teacherId);
        if (serviceClasses && serviceClasses.length > 0) {
          classList = serviceClasses;
        }
      } catch (e) {
        console.warn('Error loading from teacherService:', e);
      }
    }

    return classList;
  };

  // ===== GET TEACHER'S ASSIGNED SUBJECTS =====
  const getTeacherSubjects = () => {
    try {
      const currentTeacher = teacherService.getCurrentTeacher();
      if (!currentTeacher) return [];
      
      let subjects = [];
      
      if (currentTeacher.subjects && Array.isArray(currentTeacher.subjects)) {
        subjects = currentTeacher.subjects;
      } else if (currentTeacher.assignedSubjects && Array.isArray(currentTeacher.assignedSubjects)) {
        subjects = currentTeacher.assignedSubjects;
      } else if (currentTeacher.subject) {
        subjects = [currentTeacher.subject];
      }
      
      if (subjects.length === 0) {
        try {
          const teachers = JSON.parse(localStorage.getItem('school_teachers') || '[]');
          const teacher = teachers.find(t => t.id === currentTeacher.id || t.email === currentTeacher.email);
          if (teacher) {
            if (teacher.subjects && Array.isArray(teacher.subjects)) {
              subjects = teacher.subjects;
            } else if (teacher.assignedSubjects && Array.isArray(teacher.assignedSubjects)) {
              subjects = teacher.assignedSubjects;
            } else if (teacher.subject) {
              subjects = [teacher.subject];
            }
          }
        } catch (e) {}
      }
      
      if (subjects.length === 0) {
        try {
          const users = JSON.parse(localStorage.getItem('school_users') || '[]');
          const user = users.find(u => u.id === currentTeacher.id || u.email === currentTeacher.email);
          if (user && user.role === 'teacher') {
            if (user.subjects && Array.isArray(user.subjects)) {
              subjects = user.subjects;
            } else if (user.assignedSubjects && Array.isArray(user.assignedSubjects)) {
              subjects = user.assignedSubjects;
            }
          }
        } catch (e) {}
      }
      
      return subjects;
    } catch (err) {
      console.error('Error getting teacher subjects:', err);
      return [];
    }
  };

  // ===== GET SUBJECTS FOR CLASS LEVEL =====
  const getSubjectsForLevel = (level) => {
    if (!level) return [];
    const allLevelSubjects = getDefaultSubjectsForLevel(level);
    const teacherSubjects = getTeacherSubjects();
    
    if (teacherSubjects.length === 0) {
      return allLevelSubjects;
    }
    
    const filteredSubjects = allLevelSubjects.filter(subject => {
      return teacherSubjects.some(teacherSubject => {
        const teacherSubjectName = typeof teacherSubject === 'object' 
          ? teacherSubject.name || teacherSubject.value || teacherSubject.label || ''
          : teacherSubject;
        const subjectName = typeof subject === 'object'
          ? subject.name || subject.value || subject.label || subject
          : subject;
        
        return teacherSubjectName.toLowerCase() === subjectName.toLowerCase() ||
               teacherSubjectName.toLowerCase().includes(subjectName.toLowerCase()) ||
               subjectName.toLowerCase().includes(teacherSubjectName.toLowerCase());
      });
    });
    
    if (filteredSubjects.length === 0 && teacherSubjects.length > 0) {
      return allLevelSubjects;
    }
    
    return filteredSubjects;
  };

  // ===== GET DEFAULT SUBJECTS FOR LEVEL =====
  const getDefaultSubjectsForLevel = (level) => {
    const defaultSubjectsByCategory = {
      kindergarten: [
        { value: 'quran_k', label: "Qur'an", labelAr: 'القرآن الكريم' },
        { value: 'english_k', label: 'English', labelAr: 'اللغة الإنجليزية' },
        { value: 'french_k', label: 'French', labelAr: 'اللغة الفرنسية' },
        { value: 'arabic_k', label: 'Arabic', labelAr: 'اللغة العربية' }
      ],
      primary: [
        { value: 'quran_p', label: "Qur'an", labelAr: 'القرآن الكريم' },
        { value: 'arabic_p', label: 'Arabic', labelAr: 'اللغة العربية' },
        { value: 'english_p', label: 'English', labelAr: 'اللغة الإنجليزية' },
        { value: 'french_p', label: 'French', labelAr: 'اللغة الفرنسية' },
        { value: 'mathematics_p', label: 'Mathematics', labelAr: 'الرياضيات' },
        { value: 'science_p', label: 'Science', labelAr: 'العلوم' },
        { value: 'sports_p', label: 'Sports', labelAr: 'الرياضة' },
        { value: 'ict_p', label: 'ICT', labelAr: 'تكنولوجيا المعلومات' },
        { value: 'art_p', label: 'Art & Plastic', labelAr: 'الفنون التشكيلية' },
        { value: 'geography_p', label: 'Geography', labelAr: 'الجغرافيا' }
      ],
      secondary: [
        { value: 'quran_s', label: "Qur'an", labelAr: 'القرآن الكريم' },
        { value: 'arabic_s', label: 'Arabic', labelAr: 'اللغة العربية' },
        { value: 'english_s', label: 'English', labelAr: 'اللغة الإنجليزية' },
        { value: 'french_s', label: 'French', labelAr: 'اللغة الفرنسية' },
        { value: 'mathematics_s', label: 'Mathematics', labelAr: 'الرياضيات' },
        { value: 'svt_s', label: 'SVT (Biology)', labelAr: 'علوم الحياة والأرض' },
        { value: 'physics_s', label: 'Physics', labelAr: 'الفيزياء' },
        { value: 'sports_s', label: 'Sports', labelAr: 'الرياضة' },
        { value: 'ict_s', label: 'ICT', labelAr: 'تكنولوجيا المعلومات' },
        { value: 'geography_s', label: 'Geography', labelAr: 'الجغرافيا' }
      ],
      high_school: [
        { value: 'quran_h', label: "Qur'an", labelAr: 'القرآن الكريم' },
        { value: 'arabic_h', label: 'Arabic', labelAr: 'اللغة العربية' },
        { value: 'english_h', label: 'English', labelAr: 'اللغة الإنجليزية' },
        { value: 'french_h', label: 'French', labelAr: 'اللغة الفرنسية' },
        { value: 'mathematics_h', label: 'Mathematics', labelAr: 'الرياضيات' },
        { value: 'svt_h', label: 'SVT (Biology)', labelAr: 'علوم الحياة والأرض' },
        { value: 'physics_h', label: 'Physics', labelAr: 'الفيزياء' },
        { value: 'sports_h', label: 'Sports', labelAr: 'الرياضة' },
        { value: 'ict_h', label: 'ICT', labelAr: 'تكنولوجيا المعلومات' },
        { value: 'geography_h', label: 'Geography', labelAr: 'الجغرافيا' },
        { value: 'philosophy_h', label: 'Philosophy', labelAr: 'الفلسفة' }
      ]
    };
    
    return defaultSubjectsByCategory[level] || [];
  };

  // ===== GET SUBJECT LABEL WITH ARABIC =====
  const getSubjectLabel = (subjectLabel) => {
    if (!subjectLabel) return '';
    const defaultSubjectsByCategory = {
      kindergarten: [
        { value: 'quran_k', label: "Qur'an", labelAr: 'القرآن الكريم' },
        { value: 'english_k', label: 'English', labelAr: 'اللغة الإنجليزية' },
        { value: 'french_k', label: 'French', labelAr: 'اللغة الفرنسية' },
        { value: 'arabic_k', label: 'Arabic', labelAr: 'اللغة العربية' }
      ],
      primary: [
        { value: 'quran_p', label: "Qur'an", labelAr: 'القرآن الكريم' },
        { value: 'arabic_p', label: 'Arabic', labelAr: 'اللغة العربية' },
        { value: 'english_p', label: 'English', labelAr: 'اللغة الإنجليزية' },
        { value: 'french_p', label: 'French', labelAr: 'اللغة الفرنسية' },
        { value: 'mathematics_p', label: 'Mathematics', labelAr: 'الرياضيات' },
        { value: 'science_p', label: 'Science', labelAr: 'العلوم' },
        { value: 'sports_p', label: 'Sports', labelAr: 'الرياضة' },
        { value: 'ict_p', label: 'ICT', labelAr: 'تكنولوجيا المعلومات' },
        { value: 'art_p', label: 'Art & Plastic', labelAr: 'الفنون التشكيلية' },
        { value: 'geography_p', label: 'Geography', labelAr: 'الجغرافيا' }
      ],
      secondary: [
        { value: 'quran_s', label: "Qur'an", labelAr: 'القرآن الكريم' },
        { value: 'arabic_s', label: 'Arabic', labelAr: 'اللغة العربية' },
        { value: 'english_s', label: 'English', labelAr: 'اللغة الإنجليزية' },
        { value: 'french_s', label: 'French', labelAr: 'اللغة الفرنسية' },
        { value: 'mathematics_s', label: 'Mathematics', labelAr: 'الرياضيات' },
        { value: 'svt_s', label: 'SVT (Biology)', labelAr: 'علوم الحياة والأرض' },
        { value: 'physics_s', label: 'Physics', labelAr: 'الفيزياء' },
        { value: 'sports_s', label: 'Sports', labelAr: 'الرياضة' },
        { value: 'ict_s', label: 'ICT', labelAr: 'تكنولوجيا المعلومات' },
        { value: 'geography_s', label: 'Geography', labelAr: 'الجغرافيا' }
      ],
      high_school: [
        { value: 'quran_h', label: "Qur'an", labelAr: 'القرآن الكريم' },
        { value: 'arabic_h', label: 'Arabic', labelAr: 'اللغة العربية' },
        { value: 'english_h', label: 'English', labelAr: 'اللغة الإنجليزية' },
        { value: 'french_h', label: 'French', labelAr: 'اللغة الفرنسية' },
        { value: 'mathematics_h', label: 'Mathematics', labelAr: 'الرياضيات' },
        { value: 'svt_h', label: 'SVT (Biology)', labelAr: 'علوم الحياة والأرض' },
        { value: 'physics_h', label: 'Physics', labelAr: 'الفيزياء' },
        { value: 'sports_h', label: 'Sports', labelAr: 'الرياضة' },
        { value: 'ict_h', label: 'ICT', labelAr: 'تكنولوجيا المعلومات' },
        { value: 'geography_h', label: 'Geography', labelAr: 'الجغرافيا' },
        { value: 'philosophy_h', label: 'Philosophy', labelAr: 'الفلسفة' }
      ]
    };
    
    for (const level of Object.keys(defaultSubjectsByCategory)) {
      const found = defaultSubjectsByCategory[level].find(s => s.label === subjectLabel);
      if (found) {
        return isArabic ? found.labelAr : found.label;
      }
    }
    return subjectLabel;
  };

  // ===== GET LEVEL LABEL =====
  const getLevelLabel = (level) => {
    const levels = {
      'kindergarten': isArabic ? 'أولي' : 'Kindergarten',
      'primary': isArabic ? 'ابتدائي' : 'Primary',
      'secondary': isArabic ? 'إعدادي' : 'Secondary',
      'high_school': isArabic ? 'ثانوي' : 'High School'
    };
    return levels[level] || level;
  };

  // ===== GET GRADE LETTER =====
  const getGradeLetter = (score, totalMarks) => {
    if (!score || score === '' || !totalMarks) return '-';
    const percentage = (parseFloat(score) / totalMarks) * 100;
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
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

  // ===== GET FILE ICON =====
  const getFileIcon = (fileType) => {
    if (!fileType) return { icon: <FaFile className="text-secondary" style={{ fontSize: '3rem' }} />, color: '#6c757d' };
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) return { icon: <FaFilePdf className="text-danger" style={{ fontSize: '3rem' }} />, color: '#dc3545' };
    if (type.includes('word') || type.includes('doc')) return { icon: <FaFileWord className="text-primary" style={{ fontSize: '3rem' }} />, color: '#007bff' };
    if (type.includes('image') || type.includes('jpg') || type.includes('png') || type.includes('gif') || type.includes('jpeg')) return { icon: <FaFileImage className="text-success" style={{ fontSize: '3rem' }} />, color: '#28a745' };
    if (type.includes('text')) return { icon: <FaFileCode className="text-warning" style={{ fontSize: '3rem' }} />, color: '#ffc107' };
    if (type.includes('excel') || type.includes('xls')) return { icon: <FaFileCode className="text-success" style={{ fontSize: '3rem' }} />, color: '#28a745' };
    if (type.includes('powerpoint') || type.includes('ppt')) return { icon: <FaFileCode className="text-danger" style={{ fontSize: '3rem' }} />, color: '#dc3545' };
    return { icon: <FaFile className="text-secondary" style={{ fontSize: '3rem' }} />, color: '#6c757d' };
  };

  // ===== GET FILE TYPE LABEL =====
  const getFileTypeLabel = (fileType) => {
    if (!fileType) return 'Unknown';
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) return 'PDF Document';
    if (type.includes('word') || type.includes('doc')) return 'Word Document';
    if (type.includes('image') || type.includes('jpg') || type.includes('png') || type.includes('gif') || type.includes('jpeg')) return 'Image';
    if (type.includes('text')) return 'Text File';
    if (type.includes('excel') || type.includes('xls')) return 'Excel Spreadsheet';
    if (type.includes('powerpoint') || type.includes('ppt')) return 'PowerPoint Presentation';
    return fileType;
  };

  // ===== LOAD DATA =====
  const loadData = () => {
    try {
      setLoading(true);
      setError(null);

      const currentTeacher = teacherService.getCurrentTeacher();
      
      if (!currentTeacher) {
        setError(isArabic ? 'لم يتم العثور على المعلم' : 'Teacher not found');
        setLoading(false);
        return;
      }
      
      setTeacher(currentTeacher);
      
      const assignedClasses = getTeacherClasses(currentTeacher.id);
      setClasses(assignedClasses);
      
      const subjects = getTeacherSubjects();
      setTeacherAssignedSubjects(subjects);
      
      const assignedStudents = teacherService.getAssignedStudents(currentTeacher.id);
      setStudents(assignedStudents);
      
      const allSubmissions = JSON.parse(localStorage.getItem('school_submissions') || '[]');
      setAllSubmissions(allSubmissions);
      
      const storedAssessments = JSON.parse(localStorage.getItem('school_assessments') || '[]');
      
      // Get teacher's own assessments only (not forwarded ones)
      const teacherAssessments = storedAssessments.filter(a => a.teacherId === currentTeacher.id);
      
      const enrichedAssessments = teacherAssessments.map(a => {
        const classInfo = assignedClasses.find(c => c.id === a.classId);
        const assessmentSubmissions = allSubmissions.filter(s => s.assessmentId === a.id);
        const grades = a.grades || [];
        
        return {
          ...a,
          className: classInfo?.name || a.className || 'N/A',
          classLevel: classInfo?.level || a.level || 'N/A',
          submissions: assessmentSubmissions,
          grades: grades,
          submissionCount: assessmentSubmissions.length,
          gradedCount: grades.filter(g => g.score !== undefined && g.score !== null).length,
          totalStudents: assignedStudents.filter(s => s.classId === a.classId || s.class === a.classId).length
        };
      });
      
      setAssessments(enrichedAssessments);
      setFilteredAssessments(enrichedAssessments);

      // ===== LOAD FORWARDED SUBMISSIONS (Assessment Submission Tab) =====
      const forwardedSubmissionsData = JSON.parse(localStorage.getItem('forwarded_submissions') || '[]');
      
      // Get submissions that were forwarded to this teacher
      const myForwarded = forwardedSubmissionsData.filter(f => {
        if (f.teacherId === currentTeacher.id) return true;
        if (f.teacherName && currentTeacher.name && f.teacherName.includes(currentTeacher.name)) return true;
        if (f.teacherEmail && currentTeacher.email && f.teacherEmail === currentTeacher.email) return true;
        return false;
      });
      
      // Enrich with submission data for forwarded tab
      const enrichedForwarded = myForwarded.map(f => {
        const submission = allSubmissions.find(s => s.id === f.submissionId);
        if (!submission) return null;
        
        const student = assignedStudents.find(s => s.id === submission.studentId) || 
                       { name: submission.studentName || 'Unknown', id: submission.studentId };
        
        const assessment = storedAssessments.find(a => a.id === submission.assessmentId);
        
        return {
          ...f,
          submission: submission,
          student: student,
          assessment: assessment,
          studentName: student.name || submission.studentName || 'Unknown',
          title: submission.title || assessment?.title || 'Assessment',
          subject: submission.subject || assessment?.subject || 'N/A',
          className: submission.className || assessment?.className || 'N/A',
          submittedAt: submission.submittedAt,
          content: submission.content,
          fileName: submission.fileName,
          fileType: submission.fileType,
          totalMarks: assessment?.totalMarks || 20,
          graded: f.graded || false,
          score: f.score || null,
          forwardedAt: f.forwardedAt || f.sentAt || new Date().toISOString()
        };
      }).filter(item => item !== null);
      
      setForwardedSubmissions(enrichedForwarded);
      setFilteredForwarded(enrichedForwarded);
      
      cleanOldNotifications();
      
      setLoading(false);
    } catch (err) {
      console.error('❌ Error loading assessments:', err);
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

  // ===== APPLY FILTERS =====
  useEffect(() => {
    let filtered = [...assessments];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(a => a.status === statusFilter);
    }

    if (classFilter !== 'all') {
      filtered = filtered.filter(a => a.classId === classFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(a => 
        a.title.toLowerCase().includes(term) ||
        (a.description || '').toLowerCase().includes(term) ||
        (a.subject || '').toLowerCase().includes(term)
      );
    }

    filtered.sort((a, b) => new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0));
    setFilteredAssessments(filtered);

    let forwardedFiltered = [...forwardedSubmissions];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      forwardedFiltered = forwardedFiltered.filter(f => 
        (f.title || '').toLowerCase().includes(term) ||
        (f.studentName || '').toLowerCase().includes(term) ||
        (f.subject || '').toLowerCase().includes(term) ||
        (f.className || '').toLowerCase().includes(term)
      );
    }

    forwardedFiltered.sort((a, b) => new Date(b.forwardedAt || 0) - new Date(a.forwardedAt || 0));
    setFilteredForwarded(forwardedFiltered);

  }, [assessments, forwardedSubmissions, statusFilter, classFilter, searchTerm]);

  // ===== SETUP EFFECT =====
  useEffect(() => {
    loadData();

    const unsubscribeTeacher = teacherService.addListener(() => {
      loadData();
    });

    const handleStorageChange = (e) => {
      if (e.key === "school_assessments" || e.key === "school_submissions" || e.key === "school_users" || e.key === "school_classes" || e.key === "school_teachers" || e.key === "forwarded_submissions") {
        loadData();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    const handleAssessmentChanged = () => {
      loadData();
    };
    window.addEventListener("assessmentChanged", handleAssessmentChanged);

    const handleSubmissionChanged = () => {
      loadData();
    };
    window.addEventListener("submissionChanged", handleSubmissionChanged);

    const handleSubmissionForwarded = () => {
      loadData();
    };
    window.addEventListener("submissionForwarded", handleSubmissionForwarded);

    return () => {
      if (unsubscribeTeacher) unsubscribeTeacher();
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("assessmentChanged", handleAssessmentChanged);
      window.removeEventListener("submissionChanged", handleSubmissionChanged);
      window.removeEventListener("submissionForwarded", handleSubmissionForwarded);
    };
  }, []);

  // ===== CHECK IF ASSESSMENT IS APPROVED BY ADMIN =====
  const isApprovedByAdmin = (assessment) => {
    if (assessment.approvedByAdmin === true) return true;
    
    try {
      const pendingAssessments = JSON.parse(localStorage.getItem('pending_assessments') || '[]');
      const pending = pendingAssessments.find(a => a.assessmentId === assessment.id);
      if (pending && pending.status === 'approved') return true;
    } catch (e) {}
    
    return false;
  };

  // ===== HANDLE SEND TO ADMIN =====
  const handleSendToAdmin = (assessment) => {
    try {
      const adminNotifications = JSON.parse(localStorage.getItem('admin_notifications') || '[]');
      
      const notification = {
        id: `NOTIF_${Date.now()}`,
        assessmentId: assessment.id,
        teacherId: assessment.teacherId,
        teacherName: assessment.teacherName || teacher?.name || 'Unknown Teacher',
        subject: assessment.subject,
        className: assessment.className || assessment.classId,
        type: assessment.type,
        title: assessment.title,
        description: assessment.description || '',
        totalMarks: assessment.totalMarks,
        dueDate: assessment.dueDate,
        attachment: assessment.attachment || null,
        attachmentName: assessment.attachmentName || '',
        attachmentType: assessment.attachmentType || '',
        status: 'pending',
        sentAt: new Date().toISOString(),
        read: false
      };
      
      adminNotifications.push(notification);
      localStorage.setItem('admin_notifications', JSON.stringify(adminNotifications));
      
      const pendingAssessments = JSON.parse(localStorage.getItem('pending_assessments') || '[]');
      pendingAssessments.push({
        ...notification,
        assessmentData: assessment,
        approvedByAdmin: false
      });
      localStorage.setItem('pending_assessments', JSON.stringify(pendingAssessments));
      
      let storedAssessments = JSON.parse(localStorage.getItem('school_assessments') || '[]');
      const index = storedAssessments.findIndex(a => a.id === assessment.id);
      if (index !== -1) {
        storedAssessments[index].status = 'pending_approval';
        storedAssessments[index].sentToAdminAt = new Date().toISOString();
        storedAssessments[index].approvedByAdmin = false;
        localStorage.setItem('school_assessments', JSON.stringify(storedAssessments));
      }
      
      notify(
        isArabic ? '✅ تم إرسال التقييم إلى الإدارة للمراجعة' : '✅ Assessment sent to admin for review',
        'success'
      );
      
      loadData();
    } catch (err) {
      console.error('Error sending to admin:', err);
      notify(
        isArabic ? '❌ حدث خطأ أثناء إرسال التقييم' : '❌ Error sending assessment',
        'error'
      );
    }
  };

  // ===== HANDLE SEND DIRECTLY TO STUDENTS =====
  const handleSendToStudents = (assessment) => {
    try {
      cleanOldNotifications();
      
      const classStudents = students.filter(s => s.classId === assessment.classId || s.class === assessment.classId);
      
      if (classStudents.length === 0) {
        notify(
          isArabic ? 'لا يوجد طلاب في هذا الفصل لإرسال التقييم' : 'No students in this class to send assessment',
          'warning'
        );
        return;
      }
      
      const studentAssessments = JSON.parse(localStorage.getItem('student_assessments') || '[]');
      const newStudentAssessments = [];
      const studentNotifs = [];
      
      classStudents.forEach(student => {
        const existing = studentAssessments.find(
          sa => sa.assessmentId === assessment.id && sa.studentId === student.id
        );
        
        if (!existing) {
          newStudentAssessments.push({
            id: `ST_ASSESS_${Date.now()}_${student.id}`,
            assessmentId: assessment.id,
            studentId: student.id,
            teacherId: assessment.teacherId,
            teacherName: assessment.teacherName || teacher?.name || 'Unknown Teacher',
            subject: assessment.subject,
            className: assessment.className || assessment.classId,
            type: assessment.type,
            title: assessment.title,
            totalMarks: assessment.totalMarks,
            dueDate: assessment.dueDate,
            sentAt: new Date().toISOString(),
            status: 'pending',
            submittedAt: null,
            grade: null,
            gradedAt: null,
            read: false
          });
        }
        
        const existingNotif = studentNotifs.find(
          sn => sn.studentId === student.id
        );
        
        if (!existingNotif) {
          studentNotifs.push({
            id: `ST_NOTIF_${Date.now()}_${student.id}`,
            studentId: student.id,
            assessmentId: assessment.id,
            teacherName: assessment.teacherName || teacher?.name || 'Unknown Teacher',
            title: assessment.title,
            subject: assessment.subject,
            type: assessment.type,
            sentAt: new Date().toISOString(),
            read: false,
            submitted: false
          });
        }
      });
      
      if (newStudentAssessments.length > 0) {
        const updatedStudentAssessments = [...studentAssessments, ...newStudentAssessments];
        localStorage.setItem('student_assessments', JSON.stringify(updatedStudentAssessments));
      }
      
      if (studentNotifs.length > 0) {
        const existingStudentNotifications = JSON.parse(localStorage.getItem('student_notifications') || '[]');
        const mergedNotifications = [...existingStudentNotifications, ...studentNotifs];
        localStorage.setItem('student_notifications', JSON.stringify(mergedNotifications));
      }
      
      let storedAssessments = JSON.parse(localStorage.getItem('school_assessments') || '[]');
      const index = storedAssessments.findIndex(a => a.id === assessment.id);
      if (index !== -1) {
        storedAssessments[index].status = 'sent_to_students';
        storedAssessments[index].sentToStudentsAt = new Date().toISOString();
        storedAssessments[index].studentCount = classStudents.length;
        localStorage.setItem('school_assessments', JSON.stringify(storedAssessments));
      }
      
      const pendingAssessments = JSON.parse(localStorage.getItem('pending_assessments') || '[]');
      const pendingIndex = pendingAssessments.findIndex(a => a.assessmentId === assessment.id);
      if (pendingIndex !== -1) {
        pendingAssessments[pendingIndex].status = 'approved';
        pendingAssessments[pendingIndex].sentToStudentsAt = new Date().toISOString();
        localStorage.setItem('pending_assessments', JSON.stringify(pendingAssessments));
      }
      
      notify(
        isArabic ? `✅ تم إرسال التقييم إلى ${classStudents.length} طالب` : `✅ Assessment sent to ${classStudents.length} students`,
        'success'
      );
      
      window.dispatchEvent(new CustomEvent('assessmentSent', { 
        detail: { assessment, students: classStudents }
      }));
      window.dispatchEvent(new CustomEvent('studentAssessmentsUpdated', { 
        detail: { assessment, students: classStudents }
      }));
      
      loadData();
    } catch (err) {
      console.error('Error sending to students:', err);
      if (err.name === 'QuotaExceededError' || err.code === 22) {
        try {
          cleanOldNotifications();
          notify(
            isArabic ? '🔄 جاري تنظيف البيانات القديمة وإعادة المحاولة...' : '🔄 Cleaning old data and retrying...',
            'info'
          );
          setTimeout(() => handleSendToStudents(assessment), 500);
        } catch (retryErr) {
          notify(
            isArabic ? '❌ مساحة التخزين ممتلئة. الرجاء حذف بعض البيانات القديمة.' : '❌ Storage is full. Please delete some old data.',
            'error'
          );
        }
      } else {
        notify(
          isArabic ? '❌ حدث خطأ أثناء إرسال التقييم للطلاب' : '❌ Error sending assessment to students',
          'error'
        );
      }
    }
  };

  // ===== HANDLE VIEW SUBMISSIONS (for My Assessments) =====
  const handleViewSubmissions = (assessment) => {
    setSelectedAssessment(assessment);
    
    const freshSubmissions = JSON.parse(localStorage.getItem('school_submissions') || '[]');
    const assessmentSubmissions = freshSubmissions.filter(s => s.assessmentId === assessment.id);
    
    const classStudents = students.filter(s => s.classId === assessment.classId || s.class === assessment.classId);
    const grades = assessment.grades || [];
    
    const studentResults = classStudents.map(student => {
      const submission = assessmentSubmissions.find(s => s.studentId === student.id);
      const grade = grades.find(g => g.studentId === student.id);
      
      return {
        student: student,
        submitted: !!submission,
        submissionDate: submission?.submittedAt || null,
        submissionContent: submission?.content || null,
        submissionFileType: submission?.fileType || null,
        submissionFileName: submission?.fileName || null,
        score: grade?.score || '',
        graded: !!grade,
        gradeLetter: getGradeLetter(grade?.score, assessment.totalMarks),
        gradeColor: getGradeColor(grade?.score, assessment.totalMarks)
      };
    });
    
    setSelectedStudentGrades(studentResults);
    setShowSubmissionModal(true);
  };

  // ===== HANDLE VIEW INDIVIDUAL SUBMISSION =====
  const handleViewIndividualSubmission = (studentResult) => {
    setViewingSubmission({
      student: studentResult.student,
      content: studentResult.submissionContent,
      fileType: studentResult.submissionFileType,
      fileName: studentResult.submissionFileName,
      submittedAt: studentResult.submissionDate,
      score: studentResult.score,
      graded: studentResult.graded,
      gradeLetter: studentResult.gradeLetter,
      gradeColor: studentResult.gradeColor,
      totalMarks: selectedAssessment?.totalMarks || 20
    });
    setShowSubmissionViewModal(true);
  };

  // ===== HANDLE VIEW FORWARDED SUBMISSION =====
  const handleViewForwardedSubmission = (forwardedItem) => {
    setSelectedForwardedItem(forwardedItem);
    setViewingSubmission({
      student: forwardedItem.student,
      studentName: forwardedItem.studentName,
      content: forwardedItem.content,
      fileType: forwardedItem.fileType,
      fileName: forwardedItem.fileName,
      submittedAt: forwardedItem.submittedAt,
      score: forwardedItem.score || '',
      graded: forwardedItem.graded || false,
      gradeLetter: getGradeLetter(forwardedItem.score, forwardedItem.totalMarks),
      gradeColor: getGradeColor(forwardedItem.score, forwardedItem.totalMarks),
      totalMarks: forwardedItem.totalMarks || 20,
      isForwarded: true,
      forwardedItem: forwardedItem
    });
    setShowForwardedViewModal(true);
  };

  // ===== HANDLE GRADE FORWARDED SUBMISSION =====
  const handleGradeForwarded = (forwardedItem) => {
    setSelectedForwardedItem(forwardedItem);
    const studentId = forwardedItem.student?.id || forwardedItem.studentId;
    setForwardedGradeData({ 
      [studentId || 'student']: forwardedItem.score || '' 
    });
    setShowForwardedGradeModal(true);
  };

  // ===== SUBMIT GRADE FOR FORWARDED SUBMISSION =====
  const handleSubmitForwardedGrade = () => {
    if (!selectedForwardedItem) return;
    
    try {
      const studentId = selectedForwardedItem.student?.id || selectedForwardedItem.studentId;
      const score = forwardedGradeData[studentId] || forwardedGradeData['student'];
      
      if (!score || score === '') {
        notify(
          isArabic ? '❌ الرجاء إدخال درجة' : '❌ Please enter a score',
          'warning'
        );
        return;
      }
      
      const allSubmissions = JSON.parse(localStorage.getItem('school_submissions') || '[]');
      const submissionIndex = allSubmissions.findIndex(s => s.id === selectedForwardedItem.submissionId);
      
      if (submissionIndex !== -1) {
        allSubmissions[submissionIndex].grade = parseFloat(score);
        allSubmissions[submissionIndex].gradedAt = new Date().toISOString();
        allSubmissions[submissionIndex].gradedBy = teacher?.name || 'Teacher';
        localStorage.setItem('school_submissions', JSON.stringify(allSubmissions));
      }
      
      const assessmentId = selectedForwardedItem.assessment?.id || selectedForwardedItem.submission?.assessmentId;
      if (assessmentId) {
        const storedAssessments = JSON.parse(localStorage.getItem('school_assessments') || '[]');
        const assessmentIndex = storedAssessments.findIndex(a => a.id === assessmentId);
        
        if (assessmentIndex !== -1) {
          const grades = storedAssessments[assessmentIndex].grades || [];
          const existingIndex = grades.findIndex(g => g.studentId === studentId);
          
          if (existingIndex !== -1) {
            grades[existingIndex].score = parseFloat(score);
            grades[existingIndex].gradedAt = new Date().toISOString();
          } else {
            grades.push({
              studentId: studentId,
              score: parseFloat(score),
              gradedAt: new Date().toISOString()
            });
          }
          
          storedAssessments[assessmentIndex].grades = grades;
          localStorage.setItem('school_assessments', JSON.stringify(storedAssessments));
        }
      }
      
      const forwardedSubmissionsData = JSON.parse(localStorage.getItem('forwarded_submissions') || '[]');
      const forwardedIndex = forwardedSubmissionsData.findIndex(f => f.submissionId === selectedForwardedItem.submissionId);
      
      if (forwardedIndex !== -1) {
        forwardedSubmissionsData[forwardedIndex].graded = true;
        forwardedSubmissionsData[forwardedIndex].score = parseFloat(score);
        forwardedSubmissionsData[forwardedIndex].gradedAt = new Date().toISOString();
        localStorage.setItem('forwarded_submissions', JSON.stringify(forwardedSubmissionsData));
      }
      
      const studentAssessments = JSON.parse(localStorage.getItem('student_assessments') || '[]');
      const studentAssessIndex = studentAssessments.findIndex(
        sa => sa.assessmentId === assessmentId && sa.studentId === studentId
      );
      
      if (studentAssessIndex !== -1) {
        studentAssessments[studentAssessIndex].grade = parseFloat(score);
        studentAssessments[studentAssessIndex].status = 'graded';
        studentAssessments[studentAssessIndex].gradedAt = new Date().toISOString();
        localStorage.setItem('student_assessments', JSON.stringify(studentAssessments));
      }
      
      const studentNotifications = JSON.parse(localStorage.getItem('student_notifications') || '[]');
      if (studentNotifications.length > 100) {
        const recent = studentNotifications.slice(-50);
        localStorage.setItem('student_notifications', JSON.stringify(recent));
      }
      
      const updatedNotifications = JSON.parse(localStorage.getItem('student_notifications') || '[]');
      updatedNotifications.push({
        id: `NOTIF_${Date.now()}`,
        studentId: studentId,
        type: 'grade_received',
        title: isArabic ? '📝 تم تصحيح تقديمك' : '📝 Your submission has been graded',
        message: isArabic 
          ? `تم تصحيح تقديمك في "${selectedForwardedItem.title}" وحصلت على ${score}/${selectedForwardedItem.totalMarks}`
          : `Your submission for "${selectedForwardedItem.title}" has been graded: ${score}/${selectedForwardedItem.totalMarks}`,
        read: false,
        createdAt: new Date().toISOString(),
        link: `/dashboard/student/assessments`
      });
      localStorage.setItem('student_notifications', JSON.stringify(updatedNotifications));
      
      notify(
        isArabic ? `✅ تم حفظ درجة الطالب: ${score}/${selectedForwardedItem.totalMarks}` : `✅ Student grade saved: ${score}/${selectedForwardedItem.totalMarks}`,
        'success'
      );
      
      setShowForwardedGradeModal(false);
      setForwardedGradeData({});
      loadData();
      
    } catch (err) {
      console.error('Error grading forwarded submission:', err);
      notify(
        isArabic ? '❌ حدث خطأ أثناء حفظ الدرجة' : '❌ Error saving grade',
        'error'
      );
    }
  };

  // ===== HANDLE DELETE FORWARDED SUBMISSION =====
  const handleDeleteForwarded = (forwardedItem) => {
    setForwardedItemToDelete(forwardedItem);
    setShowDeleteForwardedModal(true);
  };

  const confirmDeleteForwarded = () => {
    if (!forwardedItemToDelete) return;
    
    try {
      const forwardedData = JSON.parse(localStorage.getItem('forwarded_submissions') || '[]');
      const updatedForwarded = forwardedData.filter(f => f.submissionId !== forwardedItemToDelete.submissionId);
      localStorage.setItem('forwarded_submissions', JSON.stringify(updatedForwarded));
      
      notify(
        isArabic ? '✅ تم حذف التقديم المرسل بنجاح' : '✅ Forwarded submission deleted successfully',
        'success'
      );
      
      setShowDeleteForwardedModal(false);
      setForwardedItemToDelete(null);
      loadData();
    } catch (err) {
      console.error('Error deleting forwarded submission:', err);
      notify(
        isArabic ? '❌ حدث خطأ أثناء الحذف' : '❌ Error deleting',
        'error'
      );
    }
  };

  // ===== HANDLE DOWNLOAD FILE FROM FORWARDED =====
  const handleDownloadFileFromForwarded = (item) => {
    if (!item) {
      notify(
        isArabic ? 'لا يوجد ملف للتحميل' : 'No file to download',
        'warning'
      );
      return;
    }
    
    const { fileName, fileType, content } = item;
    
    if (!fileName && !content) {
      notify(
        isArabic ? 'لا يوجد ملف للتحميل' : 'No file to download',
        'warning'
      );
      return;
    }
    
    if (content && !fileName) {
      try {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `submission_${item.studentName || 'student'}_${new Date().toISOString().slice(0,10)}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        notify(
          isArabic ? '✅ تم تحميل الملف بنجاح' : '✅ File downloaded successfully',
          'success'
        );
        return;
      } catch (err) {
        console.error('Error downloading text file:', err);
      }
    }
    
    notify(
      isArabic 
        ? `📄 الملف "${fileName || 'submission'}" جاهز للتحميل. نوع الملف: ${getFileTypeLabel(fileType)}` 
        : `📄 File "${fileName || 'submission'}" is ready for download. File type: ${getFileTypeLabel(fileType)}`,
      'info'
    );
    
    try {
      const blob = new Blob([`File Name: ${fileName || 'submission'}\nFile Type: ${getFileTypeLabel(fileType)}\nSubmitted: ${new Date(item.submittedAt).toLocaleString()}\n\nNote: The actual file content is stored in the system.`], 
        { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName || 'submission'}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading file:', err);
    }
  };

  // ===== HANDLE DOWNLOAD FILE =====
  const handleDownloadFile = () => {
    if (!viewingSubmission) return;
    
    const { fileName, fileType, content, student, studentName } = viewingSubmission;
    
    if (!fileName && !content) {
      notify(
        isArabic ? 'لا يوجد ملف للتحميل' : 'No file to download',
        'warning'
      );
      return;
    }
    
    if (content && !fileName) {
      try {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `submission_${student?.id || studentName || 'student'}_${new Date().toISOString().slice(0,10)}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        notify(
          isArabic ? '✅ تم تحميل الملف بنجاح' : '✅ File downloaded successfully',
          'success'
        );
        return;
      } catch (err) {
        console.error('Error downloading text file:', err);
      }
    }
    
    notify(
      isArabic 
        ? `📄 الملف "${fileName || 'submission'}" جاهز للتحميل. نوع الملف: ${getFileTypeLabel(fileType)}` 
        : `📄 File "${fileName || 'submission'}" is ready for download. File type: ${getFileTypeLabel(fileType)}`,
      'info'
    );
    
    try {
      const blob = new Blob([`File Name: ${fileName || 'submission'}\nFile Type: ${getFileTypeLabel(fileType)}\nSubmitted: ${new Date(viewingSubmission.submittedAt).toLocaleString()}\n\nNote: The actual file content is stored in the system.`], 
        { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName || 'submission'}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading file:', err);
    }
  };

  // ===== HANDLE VIEW SUBMISSION FROM GRADE MODAL =====
  const handleViewSubmissionFromGrade = (student) => {
    const freshSubmissions = JSON.parse(localStorage.getItem('school_submissions') || '[]');
    const submission = freshSubmissions.find(s => s.studentId === student.id && s.assessmentId === selectedAssessment?.id);
    
    setViewingSubmission({
      student: student,
      content: submission?.content || null,
      fileType: submission?.fileType || null,
      fileName: submission?.fileName || null,
      submittedAt: submission?.submittedAt || null,
      score: gradeData[student.id] || '',
      graded: student.graded || false,
      gradeLetter: getGradeLetter(gradeData[student.id] || '', selectedAssessment?.totalMarks),
      gradeColor: getGradeColor(gradeData[student.id] || '', selectedAssessment?.totalMarks),
      totalMarks: selectedAssessment?.totalMarks || 20
    });
    setShowSubmissionViewModal(true);
  };

  // ===== HANDLE PREVIEW FILE =====
  const handlePreviewFile = () => {
    if (!viewingSubmission) return;
    
    const { fileName, fileType, content } = viewingSubmission;
    
    if (!fileName && !content) {
      notify(
        isArabic ? 'لا يوجد ملف للمعاينة' : 'No file to preview',
        'warning'
      );
      return;
    }
    
    if (content && !fileName) {
      notify(
        isArabic ? '📄 محتوى النص معروض في النافذة' : '📄 Text content is displayed in the window',
        'info'
      );
      return;
    }
    
    const fileTypeLower = (fileType || '').toLowerCase();
    
    if (fileTypeLower.includes('image') || fileTypeLower.includes('jpg') || fileTypeLower.includes('png') || fileTypeLower.includes('gif')) {
      notify(
        isArabic ? '🖼️ هذا ملف صورة. يمكنك تنزيله لعرضه.' : '🖼️ This is an image file. You can download it to view.',
        'info'
      );
      return;
    }
    
    if (fileTypeLower.includes('pdf')) {
      notify(
        isArabic ? '📄 هذا ملف PDF. يمكنك تنزيله لعرضه.' : '📄 This is a PDF file. You can download it to view.',
        'info'
      );
      return;
    }
    
    notify(
      isArabic 
        ? `📄 ملف "${fileName}" من نوع ${getFileTypeLabel(fileType)}. يمكنك تنزيله لعرضه.` 
        : `📄 File "${fileName}" is a ${getFileTypeLabel(fileType)}. You can download it to view.`,
      'info'
    );
  };

  // ===== HANDLE OPEN MODAL =====
  const handleOpenModal = (assessment = null) => {
    if (assessment) {
      setEditingAssessment(assessment);
      setFormData({
        title: assessment.title || '',
        type: assessment.type || 'homework',
        classId: assessment.classId || '',
        subject: assessment.subject || '',
        description: assessment.description || '',
        totalMarks: assessment.totalMarks || 20,
        dueDate: assessment.dueDate ? new Date(assessment.dueDate).toISOString().split('T')[0] : '',
        status: assessment.status || 'draft',
        assignedStudents: assessment.assignedStudents || [],
        attachment: null,
        attachmentName: assessment.attachmentName || '',
        attachmentType: assessment.attachmentType || ''
      });
      setAttachmentFileName(assessment.attachmentName || '');
      
      if (assessment.classId) {
        const selectedClass = classes.find(c => c.id === assessment.classId);
        if (selectedClass) {
          const level = selectedClass.level || selectedClass.educationLevel;
          setSelectedClassLevel(level);
          const subjects = getSubjectsForLevel(level);
          setAvailableSubjects(subjects);
        }
      }
    } else {
      setEditingAssessment(null);
      const defaultClassId = classes.length > 0 ? classes[0].id : '';
      setFormData({
        title: '',
        type: 'homework',
        classId: defaultClassId,
        subject: '',
        description: '',
        totalMarks: 20,
        dueDate: '',
        status: 'draft',
        assignedStudents: [],
        attachment: null,
        attachmentName: '',
        attachmentType: ''
      });
      setAttachmentFileName('');
      setAttachmentFile(null);
      
      if (defaultClassId) {
        const selectedClass = classes.find(c => c.id === defaultClassId);
        if (selectedClass) {
          const level = selectedClass.level || selectedClass.educationLevel;
          setSelectedClassLevel(level);
          const subjects = getSubjectsForLevel(level);
          setAvailableSubjects(subjects);
        }
      } else {
        setSelectedClassLevel('');
        setAvailableSubjects([]);
      }
    }
    setFormErrors({});
    setShowModal(true);
  };

  // ===== HANDLE CLOSE MODAL =====
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAssessment(null);
    setFormErrors({});
    setAvailableSubjects([]);
    setSelectedClassLevel('');
    setAttachmentFile(null);
    setAttachmentFileName('');
  };

  // ===== HANDLE FORM CHANGE =====
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'classId') {
      const selectedClass = classes.find(c => c.id === value);
      if (selectedClass) {
        const level = selectedClass.level || selectedClass.educationLevel;
        setSelectedClassLevel(level);
        const subjects = getSubjectsForLevel(level);
        setAvailableSubjects(subjects);
        
        if (subjects.length === 1) {
          setFormData(prev => ({ ...prev, classId: value, subject: subjects[0] }));
        } else {
          setFormData(prev => ({ ...prev, classId: value, subject: '' }));
        }
      } else {
        setSelectedClassLevel('');
        setAvailableSubjects([]);
        setFormData(prev => ({ ...prev, classId: value, subject: '' }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // ===== HANDLE FILE ATTACHMENT =====
  const handleFileAttachment = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        notify(
          isArabic ? 'حجم الملف كبير جداً. الحد الأقصى هو 10 ميجابايت' : 'File size is too large. Maximum is 10MB',
          'error'
        );
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Content = event.target.result;
        setFormData(prev => ({
          ...prev,
          attachment: base64Content,
          attachmentName: file.name,
          attachmentType: file.type
        }));
        setAttachmentFileName(file.name);
        notify(
          isArabic ? `✅ تم تحميل الملف: ${file.name}` : `✅ File uploaded: ${file.name}`,
          'success'
        );
      };
      reader.onerror = () => {
        notify(
          isArabic ? 'حدث خطأ أثناء قراءة الملف' : 'Error reading file',
          'error'
        );
      };
      reader.readAsDataURL(file);
    }
  };

  // ===== HANDLE REMOVE ATTACHMENT =====
  const handleRemoveAttachment = () => {
    setFormData(prev => ({
      ...prev,
      attachment: null,
      attachmentName: '',
      attachmentType: ''
    }));
    setAttachmentFileName('');
    setAttachmentFile(null);
    const fileInput = document.getElementById('attachmentUpload');
    if (fileInput) fileInput.value = '';
  };

  // ===== HANDLE STUDENT SELECTION =====
  const handleStudentToggle = (studentId) => {
    setFormData(prev => {
      const current = prev.assignedStudents || [];
      const updated = current.includes(studentId)
        ? current.filter(id => id !== studentId)
        : [...current, studentId];
      return { ...prev, assignedStudents: updated };
    });
  };

  // ===== HANDLE SELECT ALL STUDENTS =====
  const handleSelectAllStudents = () => {
    const classStudents = students.filter(s => s.classId === formData.classId || s.class === formData.classId);
    const allStudentIds = classStudents.map(s => s.id);
    setFormData(prev => ({
      ...prev,
      assignedStudents: prev.assignedStudents.length === allStudentIds.length ? [] : allStudentIds
    }));
  };

  // ===== GET CLASS STUDENTS =====
  const getClassStudents = (classId) => {
    return students.filter(s => s.classId === classId || s.class === classId);
  };

  // ===== VALIDATE FORM =====
  const validateForm = () => {
    const errors = {};
    
    if (!formData.title.trim()) {
      errors.title = isArabic ? 'عنوان التقييم مطلوب' : 'Assessment title is required';
    }
    if (!formData.type) {
      errors.type = isArabic ? 'نوع التقييم مطلوب' : 'Assessment type is required';
    }
    if (!formData.classId) {
      errors.classId = isArabic ? 'يرجى اختيار فصل' : 'Please select a class';
    }
    if (!formData.subject.trim()) {
      errors.subject = isArabic ? 'المادة مطلوبة' : 'Subject is required';
    }
    if (!formData.totalMarks || formData.totalMarks <= 0) {
      errors.totalMarks = isArabic ? 'الدرجة الكلية مطلوبة' : 'Total marks is required';
    }
    if (!formData.dueDate) {
      errors.dueDate = isArabic ? 'تاريخ الاستحقاق مطلوب' : 'Due date is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ===== HANDLE SUBMIT =====
  const handleSubmit = () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const now = new Date().toISOString();
      const assessmentData = {
        ...formData,
        teacherId: teacher?.id,
        teacherName: teacher?.name || teacher?.firstName || 'Unknown',
        totalMarks: parseFloat(formData.totalMarks),
        createdAt: editingAssessment?.createdAt || now,
        updatedAt: now,
        id: editingAssessment?.id || `ASSESS${String(Date.now()).slice(-6)}`,
        assignedStudents: formData.assignedStudents || [],
        attachment: formData.attachment || null,
        attachmentName: formData.attachmentName || '',
        attachmentType: formData.attachmentType || '',
        approvedByAdmin: false,
        sentToAdminAt: null,
        sentToStudentsAt: null
      };

      let storedAssessments = JSON.parse(localStorage.getItem('school_assessments') || '[]');
      
      if (editingAssessment) {
        const index = storedAssessments.findIndex(a => a.id === editingAssessment.id);
        if (index !== -1) {
          storedAssessments[index] = { ...storedAssessments[index], ...assessmentData };
        }
        notify(
          isArabic ? 'تم تحديث التقييم بنجاح' : 'Assessment updated successfully',
          'success'
        );
      } else {
        storedAssessments.push(assessmentData);
        notify(
          isArabic ? 'تم إنشاء التقييم بنجاح' : 'Assessment created successfully',
          'success'
        );
      }
      
      localStorage.setItem('school_assessments', JSON.stringify(storedAssessments));
      
      window.dispatchEvent(new CustomEvent('assessmentChanged', { 
        detail: { assessment: assessmentData, action: editingAssessment ? 'update' : 'create' }
      }));
      
      handleCloseModal();
      loadData();
    } catch (err) {
      console.error('Error saving assessment:', err);
      setFormErrors({ submit: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // ===== HANDLE DELETE ASSESSMENT =====
  const handleDeleteAssessment = (id) => {
    const assessment = assessments.find(a => a.id === id);
    const title = assessment?.title || 'Unknown';
    
    if (!window.confirm(isArabic 
      ? `هل أنت متأكد من حذف التقييم "${title}"؟ هذا الإجراء لا يمكن التراجع عنه.`
      : `Are you sure you want to delete the assessment "${title}"? This action cannot be undone.`
    )) {
      return;
    }
    
    try {
      let storedAssessments = JSON.parse(localStorage.getItem('school_assessments') || '[]');
      const filteredAssessments = storedAssessments.filter(a => a.id !== id);
      
      if (filteredAssessments.length === storedAssessments.length) {
        notify(
          isArabic ? '❌ لم يتم العثور على التقييم' : '❌ Assessment not found',
          'warning'
        );
        return;
      }
      
      localStorage.setItem('school_assessments', JSON.stringify(filteredAssessments));
      
      let pendingAssessments = JSON.parse(localStorage.getItem('pending_assessments') || '[]');
      const pendingFiltered = pendingAssessments.filter(a => a.assessmentId !== id && a.id !== id);
      if (pendingFiltered.length < pendingAssessments.length) {
        localStorage.setItem('pending_assessments', JSON.stringify(pendingFiltered));
      }
      
      let adminNotifications = JSON.parse(localStorage.getItem('admin_notifications') || '[]');
      const notifFiltered = adminNotifications.filter(n => n.assessmentId !== id && n.id !== id);
      if (notifFiltered.length < adminNotifications.length) {
        localStorage.setItem('admin_notifications', JSON.stringify(notifFiltered));
      }
      
      let allSubmissions = JSON.parse(localStorage.getItem('school_submissions') || '[]');
      const subFiltered = allSubmissions.filter(s => s.assessmentId !== id);
      if (subFiltered.length < allSubmissions.length) {
        localStorage.setItem('school_submissions', JSON.stringify(subFiltered));
      }
      
      let forwardedSubmissions = JSON.parse(localStorage.getItem('forwarded_submissions') || '[]');
      const forwardedFiltered = forwardedSubmissions.filter(f => f.assessmentId !== id);
      if (forwardedFiltered.length < forwardedSubmissions.length) {
        localStorage.setItem('forwarded_submissions', JSON.stringify(forwardedFiltered));
      }
      
      let studentAssessments = JSON.parse(localStorage.getItem('student_assessments') || '[]');
      const studentFiltered = studentAssessments.filter(sa => sa.assessmentId !== id);
      if (studentFiltered.length < studentAssessments.length) {
        localStorage.setItem('student_assessments', JSON.stringify(studentFiltered));
      }
      
      notify(
        isArabic ? `✅ تم حذف التقييم "${title}" بنجاح` : `✅ Assessment "${title}" deleted successfully`,
        'success'
      );
      
      window.dispatchEvent(new CustomEvent('assessmentChanged', { 
        detail: { id, action: 'delete' }
      }));
      
      loadData();
    } catch (err) {
      console.error('Error deleting assessment:', err);
      notify(
        isArabic ? '❌ حدث خطأ أثناء حذف التقييم' : '❌ Error deleting assessment',
        'error'
      );
    }
  };

  // ===== HANDLE STATUS CHANGE =====
  const handleStatusChange = (id, newStatus) => {
    try {
      let storedAssessments = JSON.parse(localStorage.getItem('school_assessments') || '[]');
      const index = storedAssessments.findIndex(a => a.id === id);
      if (index !== -1) {
        storedAssessments[index].status = newStatus;
        storedAssessments[index].updatedAt = new Date().toISOString();
        localStorage.setItem('school_assessments', JSON.stringify(storedAssessments));
        
        notify(
          isArabic ? 'تم تحديث حالة التقييم' : 'Assessment status updated',
          'info'
        );
        
        window.dispatchEvent(new CustomEvent('assessmentChanged', { 
          detail: { id, status: newStatus, action: 'statusChange' }
        }));
        
        loadData();
      }
    } catch (err) {
      console.error('Error updating status:', err);
      notify(
        isArabic ? 'حدث خطأ أثناء تحديث الحالة' : 'Error updating status',
        'error'
      );
    }
  };

  // ===== HANDLE GRADE (for My Assessments) =====
  const handleGradeAssessment = (assessment) => {
    setSelectedAssessment(assessment);
    
    const freshSubmissions = JSON.parse(localStorage.getItem('school_submissions') || '[]');
    const assessmentSubmissions = freshSubmissions.filter(s => s.assessmentId === assessment.id);
    
    const classStudents = students.filter(s => s.classId === assessment.classId || s.class === assessment.classId);
    const grades = assessment.grades || [];
    
    const initialGrades = {};
    const studentList = [];
    
    classStudents.forEach(student => {
      const submission = assessmentSubmissions.find(s => s.studentId === student.id);
      const existingGrade = grades.find(g => g.studentId === student.id);
      
      initialGrades[student.id] = existingGrade?.score || '';
      
      studentList.push({
        ...student,
        submitted: !!submission,
        submissionDate: submission?.submittedAt || null,
        submissionContent: submission?.content || null,
        submissionFileType: submission?.fileType || null,
        submissionFileName: submission?.fileName || null,
        existingGrade: existingGrade?.score || null,
        graded: !!existingGrade
      });
    });
    
    setGradingStudents(studentList);
    setGradeData(initialGrades);
    setShowGradeModal(true);
  };

  // ===== SUBMIT GRADES (for My Assessments) =====
  const handleSubmitGrades = () => {
    try {
      let storedAssessments = JSON.parse(localStorage.getItem('school_assessments') || '[]');
      const index = storedAssessments.findIndex(a => a.id === selectedAssessment.id);
      
      if (index === -1) {
        notify(isArabic ? 'التقييم غير موجود' : 'Assessment not found', 'error');
        return;
      }
      
      const grades = Object.entries(gradeData)
        .filter(([_, score]) => score !== '' && score !== null && score !== undefined)
        .map(([studentId, score]) => ({
          studentId,
          score: parseFloat(score),
          gradedAt: new Date().toISOString()
        }));
      
      if (grades.length === 0) {
        notify(
          isArabic ? 'لا توجد درجات لحفظها' : 'No grades to save',
          'warning'
        );
        return;
      }
      
      const existingGrades = storedAssessments[index].grades || [];
      const updatedGrades = [...existingGrades];
      
      grades.forEach(newGrade => {
        const existingIndex = updatedGrades.findIndex(g => g.studentId === newGrade.studentId);
        if (existingIndex !== -1) {
          updatedGrades[existingIndex] = newGrade;
        } else {
          updatedGrades.push(newGrade);
        }
      });
      
      storedAssessments[index].grades = updatedGrades;
      
      const classStudents = students.filter(s => s.classId === selectedAssessment.classId || s.class === selectedAssessment.classId);
      if (classStudents.length > 0 && updatedGrades.length >= classStudents.length) {
        storedAssessments[index].status = 'closed';
      } else if (updatedGrades.length > 0) {
        storedAssessments[index].status = 'pending_marking';
      }
      
      storedAssessments[index].updatedAt = new Date().toISOString();
      localStorage.setItem('school_assessments', JSON.stringify(storedAssessments));
      
      grades.forEach(grade => {
        const student = students.find(s => s.id === grade.studentId);
        if (student) {
          const studentAssessments = JSON.parse(localStorage.getItem('student_assessments') || '[]');
          const studentAssessIndex = studentAssessments.findIndex(
            sa => sa.assessmentId === selectedAssessment.id && sa.studentId === student.id
          );
          if (studentAssessIndex !== -1) {
            studentAssessments[studentAssessIndex].grade = grade.score;
            studentAssessments[studentAssessIndex].status = 'graded';
            studentAssessments[studentAssessIndex].gradedAt = new Date().toISOString();
            localStorage.setItem('student_assessments', JSON.stringify(studentAssessments));
          }
          
          const studentNotifications = JSON.parse(localStorage.getItem('student_notifications') || '[]');
          studentNotifications.push({
            id: `NOTIF_${Date.now()}`,
            studentId: student.id,
            type: 'grade_received',
            title: isArabic ? '📝 تم تصحيح تقديمك' : '📝 Your submission has been graded',
            message: isArabic 
              ? `تم تصحيح تقديمك في "${selectedAssessment.title}" وحصلت على ${grade.score}/${selectedAssessment.totalMarks}`
              : `Your submission for "${selectedAssessment.title}" has been graded: ${grade.score}/${selectedAssessment.totalMarks}`,
            read: false,
            createdAt: new Date().toISOString(),
            link: `/dashboard/student/assessments`
          });
          localStorage.setItem('student_notifications', JSON.stringify(studentNotifications));
        }
      });
      
      notify(
        isArabic ? `تم حفظ ${grades.length} درجة بنجاح` : `${grades.length} grades saved successfully`,
        'success'
      );
      
      window.dispatchEvent(new CustomEvent('assessmentChanged', { 
        detail: { id: selectedAssessment.id, action: 'graded' }
      }));
      window.dispatchEvent(new CustomEvent('studentAssessmentsUpdated', { 
        detail: { assessmentId: selectedAssessment.id }
      }));
      
      setShowGradeModal(false);
      setGradeData({});
      setGradingStudents([]);
      loadData();
    } catch (err) {
      console.error('Error saving grades:', err);
      notify(
        isArabic ? 'حدث خطأ أثناء حفظ الدرجات' : 'Error saving grades',
        'error'
      );
    }
  };

  // ===== GET STATUS BADGE =====
  const getStatusBadge = (status) => {
    const statusMap = {
      'draft': 'secondary',
      'published': 'success',
      'pending_approval': 'warning',
      'pending_marking': 'warning',
      'sent_to_students': 'primary',
      'closed': 'dark',
      'rejected': 'danger',
      'approved': 'success'
    };
    return statusMap[status] || 'secondary';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'draft': isArabic ? 'مسودة' : 'Draft',
      'published': isArabic ? 'منشور' : 'Published',
      'pending_approval': isArabic ? 'بانتظار موافقة الإدارة' : 'Pending Admin Approval',
      'pending_marking': isArabic ? 'بانتظار التصحيح' : 'Pending Marking',
      'sent_to_students': isArabic ? 'مرسل للطلاب' : 'Sent to Students',
      'closed': isArabic ? 'مغلق' : 'Closed',
      'rejected': isArabic ? 'مرفوض' : 'Rejected',
      'approved': isArabic ? 'موافق عليه من الإدارة' : 'Approved by Admin'
    };
    return labels[status] || status;
  };

  // ===== GET TYPE LABEL =====
  const getTypeLabel = (type) => {
    const labels = {
      'homework': isArabic ? 'واجب منزلي' : 'Homework',
      'assignment': isArabic ? 'مشروع' : 'Assignment',
      'test': isArabic ? 'اختبار' : 'Test',
      'exam': isArabic ? 'امتحان' : 'Exam',
      'classwork': isArabic ? 'عمل صفي' : 'Classwork'
    };
    return labels[type] || type;
  };

  // ===== GET SUBMISSION STATUS TEXT =====
  const getSubmissionStatus = (submitted, graded) => {
    if (graded) {
      return { text: isArabic ? 'مصحح' : 'Graded', color: '#2ecc71', icon: <FaCheckCircle className="me-1" /> };
    } else if (submitted) {
      return { text: isArabic ? 'بانتظار التصحيح' : 'Pending', color: '#f39c12', icon: <FaClock className="me-1" /> };
    } else {
      return { text: isArabic ? 'لم يقدم' : 'Not Submitted', color: '#e74c3c', icon: <FaTimesCircle className="me-1" /> };
    }
  };

  // ===== RENDER STATES =====
  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted" style={arabicFontStyle}>
          {isArabic ? 'جاري تحميل التقييمات...' : 'Loading assessments...'}
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

  // ===== STATS =====
  const pendingForwardedCount = forwardedSubmissions.filter(f => !f.graded).length;

  return (
    <div className="teacher-assessments" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* ===== PAGE HEADER ===== */}
      <div className="d-flex flex-wrap flex-sm-nowrap justify-content-between align-items-center gap-2 gap-md-3 mb-3 mb-md-4">
        <div className="flex-grow-1 min-width-0">
          <h4 className="fw-bold mb-0 mb-sm-1" style={{ 
            ...arabicFontStyle, 
            color: '#4a9eff', 
            fontSize: isArabic ? 'clamp(1rem, 2vw, 1.5rem)' : 'clamp(0.95rem, 1.8vw, 1.4rem)' 
          }}>
            <FaFileAlt className="me-2" /> 
            {isArabic ? 'التقييمات' : 'Assessments'}
          </h4>
          <p className="text-muted mb-0 d-none d-sm-block" style={{ 
            ...arabicFontStyle, 
            fontSize: isArabic ? 'clamp(0.8rem, 1vw, 0.95rem)' : 'clamp(0.75rem, 0.9vw, 0.9rem)' 
          }}>
            {isArabic 
              ? `إنشاء وإدارة التقييمات (${formatNumber(assessments.length)})`
              : `Create and manage assessments (${formatNumber(assessments.length)})`}
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
            variant="primary" 
            size="sm"
            onClick={() => handleOpenModal()}
            style={{ 
              ...arabicFontStyle, 
              borderRadius: '12px',
              fontSize: isArabic ? 'clamp(0.65rem, 0.8vw, 0.85rem)' : 'clamp(0.6rem, 0.75vw, 0.8rem)',
              padding: isMobile ? '4px 8px' : '4px 12px'
            }}
          >
            <FaPlus className="me-1" /> 
            {isArabic ? 'إنشاء تقييم' : 'Create'}
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
              {formatNumber(assessments.length)}
            </div>
            <div className="stat-label-mini" style={{ fontSize: '0.7rem', color: '#6c757d' }}>
              {isArabic ? 'إجمالي التقييمات' : 'Total Assessments'}
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
              {formatNumber(assessments.filter(a => a.status === 'published' || a.status === 'approved').length)}
            </div>
            <div className="stat-label-mini" style={{ fontSize: '0.7rem', color: '#6c757d' }}>
              {isArabic ? 'منشور' : 'Published'}
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
              {formatNumber(pendingForwardedCount)}
            </div>
            <div className="stat-label-mini" style={{ fontSize: '0.7rem', color: '#6c757d' }}>
              <FaInbox className="me-1" />
              {isArabic ? 'بانتظار التصحيح' : 'Pending Grading'}
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
              {formatNumber(forwardedSubmissions.length)}
            </div>
            <div className="stat-label-mini" style={{ fontSize: '0.7rem', color: '#6c757d' }}>
              <FaPaperPlane className="me-1" />
              {isArabic ? 'مرسل من الإدارة' : 'Forwarded from Admin'}
            </div>
          </div>
        </Col>
      </Row>

      {/* ===== TABS ===== */}
      <div className="tabs-container mb-4">
        <div className="d-flex gap-2 flex-wrap" style={{ borderBottom: `2px solid ${darkMode ? '#2d2d44' : '#e9ecef'}`, paddingBottom: '8px' }}>
          <button
            className={`tab-btn ${activeTab === 'my_assessments' ? 'active' : ''}`}
            onClick={() => setActiveTab('my_assessments')}
            style={{
              ...arabicFontStyle,
              background: 'transparent',
              border: 'none',
              padding: '8px 20px',
              fontWeight: activeTab === 'my_assessments' ? 'bold' : 'normal',
              color: activeTab === 'my_assessments' ? '#4a9eff' : (darkMode ? '#adb5bd' : '#6c757d'),
              borderBottom: activeTab === 'my_assessments' ? '3px solid #4a9eff' : 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <FaFileAlt /> {isArabic ? 'تقييماتي' : 'My Assessments'}
            <Badge bg="secondary" className="rounded-pill" style={{ fontSize: '0.65rem' }}>
              {formatNumber(assessments.length)}
            </Badge>
          </button>
          <button
            className={`tab-btn ${activeTab === 'submissions' ? 'active' : ''}`}
            onClick={() => setActiveTab('submissions')}
            style={{
              ...arabicFontStyle,
              background: 'transparent',
              border: 'none',
              padding: '8px 20px',
              fontWeight: activeTab === 'submissions' ? 'bold' : 'normal',
              color: activeTab === 'submissions' ? '#2ecc71' : (darkMode ? '#adb5bd' : '#6c757d'),
              borderBottom: activeTab === 'submissions' ? '3px solid #2ecc71' : 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              position: 'relative'
            }}
          >
            <FaInbox /> {isArabic ? 'تقديمات الطلاب' : 'Student Submissions'}
            {pendingForwardedCount > 0 && (
              <Badge bg="danger" className="rounded-pill" style={{ fontSize: '0.65rem', animation: 'pulse-warning 1.5s infinite' }}>
                {formatNumber(pendingForwardedCount)}
              </Badge>
            )}
            <Badge bg="secondary" className="rounded-pill" style={{ fontSize: '0.65rem' }}>
              {formatNumber(forwardedSubmissions.length)}
            </Badge>
          </button>
        </div>
      </div>

      {/* ===== FILTERS ===== */}
      <Card className="modern-card mb-4" style={{ background: darkMode ? '#1a1a2e' : '#ffffff', borderColor: darkMode ? '#2d2d44' : '#e9ecef' }}>
        <Card.Body className="p-3 p-md-4">
          <Row className="g-2 g-md-3">
            <Col xs={12} md={4} lg={4}>
              <div className="position-relative">
                <FaSearch className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                <Form.Control
                  type="text"
                  placeholder={isArabic ? 'بحث...' : 'Search...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
            {activeTab === 'my_assessments' && (
              <>
                <Col xs={6} md={3} lg={3}>
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
                    <option value="draft">{isArabic ? 'مسودة' : 'Draft'}</option>
                    <option value="published">{isArabic ? 'منشور' : 'Published'}</option>
                    <option value="pending_approval">{isArabic ? 'بانتظار الموافقة' : 'Pending Approval'}</option>
                    <option value="approved">{isArabic ? 'موافق عليه' : 'Approved'}</option>
                    <option value="pending_marking">{isArabic ? 'بانتظار التصحيح' : 'Pending Marking'}</option>
                    <option value="sent_to_students">{isArabic ? 'مرسل للطلاب' : 'Sent to Students'}</option>
                    <option value="closed">{isArabic ? 'مغلق' : 'Closed'}</option>
                    <option value="rejected">{isArabic ? 'مرفوض' : 'Rejected'}</option>
                  </Form.Select>
                </Col>
                <Col xs={6} md={3} lg={3}>
                  <Form.Select
                    value={classFilter}
                    onChange={(e) => setClassFilter(e.target.value)}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? '#2d2d44' : 'white',
                      color: darkMode ? '#e9ecef' : '#212529',
                      borderRadius: '12px',
                      borderColor: darkMode ? '#2d2d44' : '#e9ecef',
                    }}
                  >
                    <option value="all">{isArabic ? 'جميع الفصول' : 'All Classes'}</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} {cls.level ? `(${getLevelLabel(cls.level)})` : ''}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
                <Col xs={12} md={2}>
                  <span className="text-muted d-flex align-items-center" style={{ ...arabicFontStyle, fontSize: '0.85rem' }}>
                    {formatNumber(filteredAssessments.length)} {isArabic ? 'تقييم' : 'assessments'}
                  </span>
                </Col>
              </>
            )}
            {activeTab === 'submissions' && (
              <Col xs={12} md={6}>
                <span className="text-muted d-flex align-items-center" style={{ ...arabicFontStyle, fontSize: '0.85rem' }}>
                  <FaInbox className="me-2" />
                  {formatNumber(filteredForwarded.length)} {isArabic ? 'تقديم طالب' : 'student submissions'}
                  {filteredForwarded.filter(f => !f.graded).length > 0 && (
                    <Badge bg="warning" className="ms-2" style={{ fontSize: '0.7rem' }}>
                      {formatNumber(filteredForwarded.filter(f => !f.graded).length)} {isArabic ? 'بانتظار التصحيح' : 'pending'}
                    </Badge>
                  )}
                </span>
              </Col>
            )}
          </Row>
        </Card.Body>
      </Card>

      {/* ===== MY ASSESSMENTS TAB ===== */}
      {activeTab === 'my_assessments' && (
        <>
          {assessments.length === 0 ? (
            <Card className="text-center py-5" style={{ 
              background: darkMode ? '#1a1a2e' : '#ffffff', 
              borderColor: darkMode ? '#2d2d44' : '#e9ecef',
              borderRadius: '16px',
            }}>
              <Card.Body>
                <FaFileAlt size={48} className="text-muted opacity-25 mb-3" />
                <h5 style={arabicFontStyle}>
                  {isArabic ? 'لا توجد تقييمات' : 'No assessments'}
                </h5>
                <p className="text-muted" style={arabicFontStyle}>
                  {isArabic ? 'قم بإنشاء أول تقييم للبدء' : 'Create your first assessment to get started'}
                </p>
                {classes.length > 0 && (
                  <Button 
                    variant="primary" 
                    onClick={() => handleOpenModal()}
                    style={{ ...arabicFontStyle, borderRadius: '12px' }}
                  >
                    <FaPlus className="me-2" /> {isArabic ? 'إنشاء تقييم' : 'Create Assessment'}
                  </Button>
                )}
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
                  {isArabic ? 'لا توجد تقييمات تطابق معايير البحث' : 'No assessments match your search criteria'}
                </p>
              </Card.Body>
            </Card>
          ) : (
            <div className="table-responsive">
              <Table hover className="assessment-table" style={arabicFontStyle}>
                <thead style={{ background: darkMode ? '#0d1117' : '#f8f9fa' }}>
                  <tr>
                    <th style={{ color: darkMode ? '#e9ecef' : '#212529' }}>#</th>
                    <th style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{isArabic ? 'العنوان' : 'Title'}</th>
                    <th style={{ color: darkMode ? '#e9ecef' : '#212529' }} className="d-none d-sm-table-cell">{isArabic ? 'النوع' : 'Type'}</th>
                    <th style={{ color: darkMode ? '#e9ecef' : '#212529' }} className="d-none d-md-table-cell">{isArabic ? 'الفصل' : 'Class'}</th>
                    <th style={{ color: darkMode ? '#e9ecef' : '#212529' }} className="d-none d-md-table-cell">{isArabic ? 'المادة' : 'Subject'}</th>
                    <th style={{ color: darkMode ? '#e9ecef' : '#212529' }} className="d-none d-sm-table-cell">{isArabic ? 'الدرجة' : 'Marks'}</th>
                    <th style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{isArabic ? 'الحالة' : 'Status'}</th>
                    <th style={{ color: darkMode ? '#e9ecef' : '#212529' }} className="d-none d-md-table-cell">
                      {isArabic ? 'مقدمين' : 'Submissions'}
                    </th>
                    <th style={{ color: darkMode ? '#e9ecef' : '#212529' }} className="text-center">{isArabic ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssessments.map((assessment, index) => {
                    const submissionCount = assessment.submissionCount || 0;
                    const gradedCount = assessment.gradedCount || 0;
                    const totalStudents = assessment.totalStudents || 0;
                    const isApproved = isApprovedByAdmin(assessment);
                    
                    return (
                      <tr key={assessment.id}>
                        <td style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                          {formatNumber(index + 1)}
                        </td>
                        <td>
                          <div className="fw-semibold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                            {assessment.title}
                          </div>
                          <small className="text-muted d-sm-none" style={arabicFontStyle}>
                            {getTypeLabel(assessment.type)} • {assessment.subject}
                          </small>
                          {assessment.attachmentName && (
                            <div className="mt-1">
                              <Badge bg="info" style={{ fontSize: '0.6rem' }}>
                                <FaFile className="me-1" size={10} />
                                {assessment.attachmentName}
                              </Badge>
                            </div>
                          )}
                        </td>
                        <td className="d-none d-sm-table-cell">{getTypeLabel(assessment.type)}</td>
                        <td className="d-none d-md-table-cell">{assessment.className}</td>
                        <td className="d-none d-md-table-cell">{assessment.subject}</td>
                        <td className="d-none d-sm-table-cell">{formatNumber(assessment.totalMarks)}</td>
                        <td>
                          <Badge bg={getStatusBadge(assessment.status)}>
                            {getStatusLabel(assessment.status)}
                          </Badge>
                          {assessment.status === 'pending_approval' && !isApproved && (
                            <Badge bg="warning" className="ms-1 status-pending-approval" style={{ animation: 'pulse-warning 1.5s infinite' }}>
                              <FaClock size={10} className="me-1" />
                              {isArabic ? 'بانتظار المراجعة' : 'Awaiting Review'}
                            </Badge>
                          )}
                          {isApproved && (
                            <Badge bg="success" className="ms-1">
                              <FaCheckCircle size={10} className="me-1" />
                              {isArabic ? 'موافقة الإدارة' : 'Admin Approved'}
                            </Badge>
                          )}
                        </td>
                        <td className="d-none d-md-table-cell">
                          <Badge bg={submissionCount > 0 ? 'info' : 'secondary'} className="rounded-pill">
                            {formatNumber(submissionCount)} / {formatNumber(totalStudents)}
                          </Badge>
                          {gradedCount > 0 && (
                            <Badge bg="success" className="rounded-pill ms-1">
                              ✓ {formatNumber(gradedCount)}
                            </Badge>
                          )}
                        </td>
                        <td>
                          <div className="d-flex gap-1 justify-content-center flex-wrap">
                            {/* View Submissions Button */}
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              className="action-btn"
                              onClick={() => handleViewSubmissions(assessment)}
                              title={isArabic ? 'عرض التقديمات والنتائج' : 'View Submissions & Results'}
                            >
                              <FaEye size={14} />
                            </Button>
                            
                            {/* Send to Admin Button */}
                            {assessment.status !== 'pending_approval' && 
                             assessment.status !== 'sent_to_students' && 
                             assessment.status !== 'closed' && 
                             assessment.status !== 'rejected' && (
                              <Button 
                                variant="primary" 
                                size="sm"
                                className="action-btn send-to-admin-btn"
                                onClick={() => handleSendToAdmin(assessment)}
                                title={isArabic ? '📤 إرسال للإدارة للمراجعة' : '📤 Send to Admin for Review'}
                                style={{
                                  backgroundColor: '#0d6efd',
                                  color: 'white',
                                  border: '2px solid #0d6efd',
                                  fontWeight: 'bold',
                                  minWidth: '60px'
                                }}
                              >
                                <FaUploadIcon size={14} className="me-1" />
                                <span style={{ fontSize: '0.6rem' }}>
                                  {isArabic ? 'إرسال' : 'Send'}
                                </span>
                              </Button>
                            )}
                            
                            {/* Send to Students Button */}
                            {assessment.status === 'pending_approval' && isApproved && (
                              <Button 
                                variant="success" 
                                size="sm"
                                className="action-btn send-to-students-btn"
                                onClick={() => handleSendToStudents(assessment)}
                                title={isArabic ? '✅ موافقة الإدارة - إرسال للطلاب' : '✅ Admin Approved - Send to Students'}
                                style={{
                                  backgroundColor: '#28a745',
                                  color: 'white',
                                  border: '2px solid #28a745',
                                  fontWeight: 'bold',
                                  minWidth: '80px',
                                  animation: 'pulse-green 2s infinite'
                                }}
                              >
                                <FaPaperPlane size={14} className="me-1" />
                                <span style={{ fontSize: '0.6rem' }}>
                                  {isArabic ? 'إرسال للطلاب' : 'Send to Students'}
                                </span>
                              </Button>
                            )}
                            
                            {/* Grade Button */}
                            {assessment.status !== 'closed' && assessment.status !== 'pending_approval' && (
                              <Button 
                                variant="outline-success" 
                                size="sm"
                                className="action-btn"
                                onClick={() => handleGradeAssessment(assessment)}
                                title={isArabic ? 'تصحيح' : 'Grade'}
                              >
                                <FaCheck size={14} />
                              </Button>
                            )}
                            
                            {/* Edit Button */}
                            {assessment.status !== 'sent_to_students' && assessment.status !== 'closed' && assessment.status !== 'pending_approval' && (
                              <Button 
                                variant="outline-warning" 
                                size="sm"
                                className="action-btn"
                                onClick={() => handleOpenModal(assessment)}
                                title={isArabic ? 'تعديل' : 'Edit'}
                              >
                                <FaEdit size={14} />
                              </Button>
                            )}
                            
                            {/* Publish/Unpublish Button */}
                            {assessment.status !== 'closed' && 
                             assessment.status !== 'sent_to_students' && 
                             assessment.status !== 'pending_approval' && (
                              <Button 
                                variant={assessment.status === 'published' ? 'outline-secondary' : 'outline-success'}
                                size="sm"
                                className="action-btn"
                                onClick={() => handleStatusChange(
                                  assessment.id, 
                                  assessment.status === 'published' ? 'pending_marking' : 'published'
                                )}
                                title={assessment.status === 'published' ? 
                                  (isArabic ? 'إلغاء النشر' : 'Unpublish') : 
                                  (isArabic ? 'نشر' : 'Publish')}
                              >
                                {assessment.status === 'published' ? 
                                  <FaTimes size={14} /> : 
                                  <FaCheckCircle size={14} />}
                              </Button>
                            )}
                            
                            {/* Delete Button */}
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              className="action-btn"
                              onClick={() => handleDeleteAssessment(assessment.id)}
                              title={isArabic ? 'حذف التقييم' : 'Delete Assessment'}
                            >
                              <FaTrash size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}
        </>
      )}

      {/* ===== STUDENT SUBMISSIONS TAB (Forwarded from Admin) ===== */}
      {activeTab === 'submissions' && (
        <>
          {filteredForwarded.length === 0 ? (
            <Card className="text-center py-5" style={{ 
              background: darkMode ? '#1a1a2e' : '#ffffff', 
              borderColor: darkMode ? '#2d2d44' : '#e9ecef',
              borderRadius: '16px',
            }}>
              <Card.Body>
                <FaInbox size={48} className="text-muted opacity-25 mb-3" />
                <h5 style={arabicFontStyle}>
                  {isArabic ? 'لا توجد تقديمات طلاب' : 'No student submissions'}
                </h5>
                <p className="text-muted" style={arabicFontStyle}>
                  {isArabic 
                    ? 'سيظهر هنا تقديمات الطلاب التي يرسلها لك مدير المدرسة للمراجعة والتصحيح'
                    : 'Student submissions forwarded to you by the admin will appear here for review and grading'}
                </p>
              </Card.Body>
            </Card>
          ) : (
            <div className="table-responsive">
              <Table hover className="assessment-table" style={arabicFontStyle}>
                <thead style={{ background: darkMode ? '#0d1117' : '#f8f9fa' }}>
                  <tr>
                    <th style={{ color: darkMode ? '#e9ecef' : '#212529' }}>#</th>
                    <th style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{isArabic ? 'الطالب' : 'Student'}</th>
                    <th style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{isArabic ? 'التقييم' : 'Assessment'}</th>
                    <th style={{ color: darkMode ? '#e9ecef' : '#212529' }} className="d-none d-md-table-cell">{isArabic ? 'المادة' : 'Subject'}</th>
                    <th style={{ color: darkMode ? '#e9ecef' : '#212529' }} className="d-none d-sm-table-cell">{isArabic ? 'تاريخ التقديم' : 'Submitted'}</th>
                    <th style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{isArabic ? 'الحالة' : 'Status'}</th>
                    <th style={{ color: darkMode ? '#e9ecef' : '#212529' }} className="text-center">{isArabic ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredForwarded.map((item, index) => {
                    const isGraded = item.graded || false;
                    
                    return (
                      <tr key={item.submissionId || index} style={{
                        background: !isGraded ? (darkMode ? 'rgba(255, 193, 7, 0.05)' : 'rgba(255, 193, 7, 0.08)') : 'transparent'
                      }}>
                        <td style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                          {formatNumber(index + 1)}
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="student-avatar-sm" style={{
                              background: `linear-gradient(135deg, #2ecc71, #27ae60)`,
                              width: isMobile ? '28px' : '36px',
                              height: isMobile ? '28px' : '36px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: '700',
                              fontSize: isMobile ? '0.6rem' : '0.85rem',
                              flexShrink: 0
                            }}>
                              {(item.studentName || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="fw-semibold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                                {item.studentName}
                              </div>
                              <div className="text-muted small" style={{ fontSize: '0.65rem' }}>
                                <FaIdCard className="me-1" size={10} /> {item.student?.id || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="fw-semibold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                            {item.title}
                          </div>
                          <div className="text-muted small d-md-none">
                            {item.subject} • {item.className}
                          </div>
                          {item.fileName && (
                            <Badge bg="info" style={{ fontSize: '0.55rem' }}>
                              <FaFile className="me-1" size={10} />
                              {item.fileName}
                            </Badge>
                          )}
                        </td>
                        <td className="d-none d-md-table-cell">{item.subject}</td>
                        <td className="d-none d-sm-table-cell">
                          <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                            {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : 'N/A'}
                          </span>
                        </td>
                        <td>
                          {isGraded ? (
                            <Badge bg="success" className="rounded-pill">
                              <FaCheckCircle className="me-1" size={10} />
                              {isArabic ? 'مصحح' : 'Graded'}
                              {item.score !== undefined && item.score !== null && (
                                <span className="ms-1">
                                  ({formatNumber(item.score)}/{formatNumber(item.totalMarks)})
                                </span>
                              )}
                            </Badge>
                          ) : (
                            <Badge bg="warning" className="rounded-pill" style={{ animation: 'pulse-warning 1.5s infinite' }}>
                              <FaClock className="me-1" size={10} />
                              {isArabic ? 'بانتظار التصحيح' : 'Pending Grading'}
                            </Badge>
                          )}
                        </td>
                        <td>
                          <div className="d-flex gap-1 justify-content-center flex-wrap">
                            {/* View Button */}
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              className="action-btn"
                              onClick={() => handleViewForwardedSubmission(item)}
                              title={isArabic ? 'عرض التقديم' : 'View Submission'}
                            >
                              <FaEye size={14} />
                            </Button>
                            
                            {/* Grade Button - only if not graded */}
                            {!isGraded && (
                              <Button 
                                variant="outline-success" 
                                size="sm"
                                className="action-btn"
                                onClick={() => handleGradeForwarded(item)}
                                title={isArabic ? 'تصحيح' : 'Grade'}
                                style={{
                                  borderColor: '#28a745',
                                  color: '#28a745'
                                }}
                              >
                                <FaCheck size={14} />
                              </Button>
                            )}
                            
                            {/* Download Button */}
                            {(item.fileName || item.content) && (
                              <Button 
                                variant="outline-info" 
                                size="sm"
                                className="action-btn"
                                onClick={() => handleDownloadFileFromForwarded(item)}
                                title={isArabic ? 'تحميل الملف' : 'Download File'}
                              >
                                <FaDownload size={14} />
                              </Button>
                            )}
                            
                            {/* Show grade if graded */}
                            {isGraded && (
                              <Badge bg="success" className="d-flex align-items-center gap-1" style={{ fontSize: '0.7rem', padding: '4px 10px' }}>
                                <FaCheckCircle size={12} />
                                {formatNumber(item.score)}/{formatNumber(item.totalMarks)}
                              </Badge>
                            )}
                            
                            {/* Delete Button */}
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              className="action-btn"
                              onClick={() => handleDeleteForwarded(item)}
                              title={isArabic ? 'حذف التقديم' : 'Delete Submission'}
                            >
                              <FaTrashAlt size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}
        </>
      )}

      {/* ===== VIEW SUBMISSIONS MODAL (for My Assessments) ===== */}
      <Modal show={showSubmissionModal} onHide={() => setShowSubmissionModal(false)} centered size="lg" className="modern-modal">
        <Modal.Header closeButton className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Modal.Title style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
            <FaEye className="me-2 text-primary" />
            {isArabic ? 'تقديمات الطلاب والنتائج' : 'Student Submissions & Results'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? '#0d1117' : 'white' }}>
          {selectedAssessment && (
            <div>
              <div className="assessment-info mb-3 p-3 rounded-3" style={{
                background: darkMode ? '#2d2d44' : '#f8f9fa',
                border: `1px solid ${darkMode ? '#3d3d5c' : '#e9ecef'}`,
                borderRadius: '12px'
              }}>
                <h6 className="fw-bold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                  {selectedAssessment.title}
                </h6>
                <p className="text-muted small" style={arabicFontStyle}>
                  {isArabic ? 'الفصل: ' : 'Class: '}{selectedAssessment.className} • 
                  {isArabic ? ' المادة: ' : ' Subject: '}{selectedAssessment.subject} • 
                  {isArabic ? 'الدرجة الكلية: ' : 'Total Marks: '}{formatNumber(selectedAssessment.totalMarks)}
                </p>
              </div>

              <div className="table-responsive">
                <Table hover className="mb-0" style={arabicFontStyle}>
                  <thead style={{ background: darkMode ? '#0d1117' : '#f8f9fa' }}>
                    <tr>
                      <th style={{ color: darkMode ? '#e9ecef' : '#212529' }}>#</th>
                      <th style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{isArabic ? 'الطالب' : 'Student'}</th>
                      <th style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{isArabic ? 'الحالة' : 'Status'}</th>
                      <th style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{isArabic ? 'الدرجة' : 'Score'}</th>
                      <th style={{ color: darkMode ? '#e9ecef' : '#212529' }} className="d-none d-md-table-cell">{isArabic ? 'التقييم' : 'Grade'}</th>
                      <th style={{ color: darkMode ? '#e9ecef' : '#212529' }} className="text-center">{isArabic ? 'التقديم' : 'Submission'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedStudentGrades.map((item, index) => {
                      const statusInfo = getSubmissionStatus(item.submitted, item.graded);
                      
                      return (
                        <tr key={item.student.id}>
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
                                flexShrink: 0
                              }}>
                                {(item.student.name || item.student.firstName || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="fw-semibold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                                  {item.student.name || item.student.firstName || 'Unknown'}
                                </div>
                                <div className="text-muted small" style={{ fontSize: '0.65rem' }}>
                                  <FaIdCard className="me-1" size={10} /> {item.student.id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <Badge 
                              bg={item.graded ? 'success' : (item.submitted ? 'warning' : 'secondary')} 
                              className="rounded-pill"
                              style={{ fontSize: '0.7rem' }}
                            >
                              {statusInfo.icon} {statusInfo.text}
                            </Badge>
                          </td>
                          <td>
                            {item.score ? (
                              <span className="fw-bold" style={{ color: getGradeColor(item.score, selectedAssessment.totalMarks) }}>
                                {formatNumber(item.score)}
                              </span>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td className="d-none d-md-table-cell">
                            {item.gradeLetter !== '-' ? (
                              <Badge style={{ 
                                background: item.gradeColor, 
                                color: 'white', 
                                padding: '4px 10px', 
                                borderRadius: '8px' 
                              }}>
                                {item.gradeLetter}
                              </Badge>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>
                            {item.submitted ? (
                              <Button 
                                variant="outline-primary" 
                                size="sm"
                                className="action-btn"
                                onClick={() => handleViewIndividualSubmission(item)}
                                title={isArabic ? 'عرض التقديم' : 'View Submission'}
                              >
                                <FaFile size={14} />
                              </Button>
                            ) : (
                              <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                                <FaTimesCircle className="me-1" /> {isArabic ? 'لا يوجد' : 'None'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Button variant="secondary" onClick={() => setShowSubmissionModal(false)} style={{ ...arabicFontStyle, borderRadius: '12px' }}>
            {isArabic ? 'إغلاق' : 'Close'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===== VIEW INDIVIDUAL SUBMISSION MODAL ===== */}
      <Modal show={showSubmissionViewModal} onHide={() => setShowSubmissionViewModal(false)} centered size="lg" className="modern-modal">
        <Modal.Header closeButton className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Modal.Title style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
            <FaFileAlt className="me-2 text-primary" />
            {isArabic ? 'تقديم الطالب' : 'Student Submission'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? '#0d1117' : 'white' }}>
          {viewingSubmission && (
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
                  fontSize: '1.2rem'
                }}>
                  {(viewingSubmission.student?.name || viewingSubmission.studentName || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h6 className="fw-bold mb-0" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                    {viewingSubmission.student?.name || viewingSubmission.studentName || 'Unknown'}
                  </h6>
                  <small className="text-muted" style={arabicFontStyle}>
                    <FaIdCard className="me-1" /> {isArabic ? 'المعرف: ' : 'ID: '}{viewingSubmission.student?.id || 'N/A'}
                  </small>
                </div>
              </div>

              <hr style={{ borderColor: darkMode ? '#2d2d44' : '#e9ecef' }} />

              {viewingSubmission.content || viewingSubmission.fileName ? (
                <div className="submission-content">
                  <div className="submission-meta mb-3">
                    <div className="d-flex gap-3 flex-wrap">
                      <span className="text-muted" style={arabicFontStyle}>
                        <FaClock className="me-1" />
                        {isArabic ? 'تاريخ التقديم: ' : 'Submitted: '}
                        <span className="fw-semibold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                          {viewingSubmission.submittedAt ? new Date(viewingSubmission.submittedAt).toLocaleString() : 'N/A'}
                        </span>
                      </span>
                      {viewingSubmission.fileName && (
                        <span className="text-muted" style={arabicFontStyle}>
                          <FaFile className="me-1" />
                          {isArabic ? 'اسم الملف: ' : 'File Name: '}
                          <span className="fw-semibold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                            {viewingSubmission.fileName}
                          </span>
                        </span>
                      )}
                      {viewingSubmission.fileType && (
                        <span className="text-muted" style={arabicFontStyle}>
                          <FaInfoCircle className="me-1" />
                          {isArabic ? 'نوع الملف: ' : 'File Type: '}
                          <span className="fw-semibold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                            {getFileTypeLabel(viewingSubmission.fileType)}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="submission-file-preview p-4 rounded-3" style={{
                    background: darkMode ? '#2d2d44' : '#f8f9fa',
                    border: `1px solid ${darkMode ? '#3d3d5c' : '#e9ecef'}`,
                    borderRadius: '12px',
                    minHeight: '200px'
                  }}>
                    {viewingSubmission.content && viewingSubmission.content.length > 0 && !viewingSubmission.fileName ? (
                      <div className="submission-content-display" style={{
                        ...arabicFontStyle,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        maxHeight: '400px',
                        overflowY: 'auto',
                        padding: '12px',
                        background: darkMode ? '#1a1a2e' : '#ffffff',
                        borderRadius: '8px',
                        border: `1px solid ${darkMode ? '#2d2d44' : '#e9ecef'}`,
                        color: darkMode ? '#e9ecef' : '#212529'
                      }}>
                        {viewingSubmission.content}
                      </div>
                    ) : viewingSubmission.fileName ? (
                      <div className="text-center py-4">
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
                          {getFileIcon(viewingSubmission.fileType).icon}
                        </div>
                        <h6 className="fw-bold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                          {viewingSubmission.fileName}
                        </h6>
                        <p className="text-muted" style={arabicFontStyle}>
                          {isArabic ? 'نوع الملف: ' : 'File Type: '} 
                          <span className="fw-semibold">{getFileTypeLabel(viewingSubmission.fileType)}</span>
                        </p>
                        <p className="text-muted small" style={arabicFontStyle}>
                          {isArabic ? '📄 يمكنك تنزيل الملف باستخدام الزر أدناه' : '📄 You can download the file using the button below'}
                        </p>
                        
                        <Button 
                          variant="primary" 
                          size="md"
                          onClick={handleDownloadFile}
                          style={{ 
                            borderRadius: '10px', 
                            ...arabicFontStyle,
                            padding: '8px 20px'
                          }}
                        >
                          <FaDownload className="me-2" /> 
                          {isArabic ? 'تحميل' : 'Download'}
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <FaExclamationTriangle size={48} className="text-warning mb-3" />
                        <p style={arabicFontStyle}>
                          {isArabic ? 'لا يوجد محتوى لعرضه' : 'No content to display'}
                        </p>
                      </div>
                    )}
                  </div>

                  {viewingSubmission.graded && (
                    <div className="mt-3 p-3 rounded-3" style={{
                      background: darkMode ? '#2d2d44' : '#f8f9fa',
                      border: `1px solid ${darkMode ? '#3d3d5c' : '#e9ecef'}`,
                      borderRadius: '12px'
                    }}>
                      <div className="d-flex align-items-center gap-3 flex-wrap">
                        <span className="fw-semibold" style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                          {isArabic ? 'الدرجة: ' : 'Score: '}
                        </span>
                        <span className="fw-bold" style={{ fontSize: '1.2rem', color: viewingSubmission.gradeColor || '#2ecc71' }}>
                          {formatNumber(viewingSubmission.score)}
                        </span>
                        <span className="text-muted" style={arabicFontStyle}>
                          / {formatNumber(viewingSubmission.totalMarks || 20)}
                        </span>
                        <Badge style={{ 
                          background: viewingSubmission.gradeColor || '#2ecc71',
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '8px'
                        }}>
                          {viewingSubmission.gradeLetter || '-'}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-5">
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
          <Button variant="secondary" onClick={() => setShowSubmissionViewModal(false)} style={{ ...arabicFontStyle, borderRadius: '12px' }}>
            {isArabic ? 'إغلاق' : 'Close'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===== CREATE/EDIT MODAL ===== */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered className="modern-modal">
        <Modal.Header closeButton className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Modal.Title style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
            <FaFileAlt className="me-2 text-primary" />
            {editingAssessment ? 
              (isArabic ? 'تعديل التقييم' : 'Edit Assessment') : 
              (isArabic ? 'إنشاء تقييم جديد' : 'Create New Assessment')}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? '#0d1117' : 'white' }}>
          {formErrors.submit && (
            <Alert variant="danger" style={arabicFontStyle}>{formErrors.submit}</Alert>
          )}
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                    {isArabic ? 'عنوان التقييم *' : 'Assessment Title *'}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleFormChange}
                    isInvalid={!!formErrors.title}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? '#2d2d44' : 'white',
                      color: darkMode ? '#e9ecef' : '#212529',
                      borderRadius: '12px',
                    }}
                  />
                  <Form.Control.Feedback type="invalid" style={arabicFontStyle}>
                    {formErrors.title}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                    {isArabic ? 'نوع التقييم *' : 'Assessment Type *'}
                  </Form.Label>
                  <Form.Select
                    name="type"
                    value={formData.type}
                    onChange={handleFormChange}
                    isInvalid={!!formErrors.type}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? '#2d2d44' : 'white',
                      color: darkMode ? '#e9ecef' : '#212529',
                      borderRadius: '12px',
                    }}
                  >
                    <option value="homework">{isArabic ? 'واجب منزلي' : 'Homework'}</option>
                    <option value="assignment">{isArabic ? 'مشروع' : 'Assignment'}</option>
                    <option value="test">{isArabic ? 'اختبار' : 'Test'}</option>
                    <option value="exam">{isArabic ? 'امتحان' : 'Exam'}</option>
                    <option value="classwork">{isArabic ? 'عمل صفي' : 'Classwork'}</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid" style={arabicFontStyle}>
                    {formErrors.type}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                    <FaGraduationCap className="me-2" />
                    {isArabic ? 'الفصل *' : 'Class *'}
                  </Form.Label>
                  <Form.Select
                    name="classId"
                    value={formData.classId}
                    onChange={handleFormChange}
                    isInvalid={!!formErrors.classId}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? '#2d2d44' : 'white',
                      color: darkMode ? '#e9ecef' : '#212529',
                      borderRadius: '12px',
                    }}
                  >
                    <option value="">{isArabic ? 'اختر فصل' : 'Select Class'}</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} {cls.level ? `(${getLevelLabel(cls.level)})` : ''}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid" style={arabicFontStyle}>
                    {formErrors.classId}
                  </Form.Control.Feedback>
                  {formData.classId && (
                    <Form.Text className="text-muted" style={arabicFontStyle}>
                      <FaGraduationCap className="me-1" />
                      {isArabic 
                        ? `المستوى: ${getLevelLabel(selectedClassLevel)}` 
                        : `Level: ${getLevelLabel(selectedClassLevel)}`}
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                    <FaBook className="me-2" />
                    {isArabic ? 'المادة *' : 'Subject *'}
                  </Form.Label>
                  <Form.Select
                    name="subject"
                    value={formData.subject}
                    onChange={handleFormChange}
                    isInvalid={!!formErrors.subject}
                    disabled={!formData.classId || availableSubjects.length === 0}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? '#2d2d44' : 'white',
                      color: darkMode ? '#e9ecef' : '#212529',
                      borderRadius: '12px',
                    }}
                  >
                    <option value="">
                      {!formData.classId 
                        ? (isArabic ? 'اختر الفصل أولاً' : 'Select class first')
                        : availableSubjects.length === 0
                          ? (isArabic ? '⚠️ لا توجد مواد مخصصة لهذا المستوى' : '⚠️ No subjects assigned for this level')
                          : (isArabic ? 'اختر المادة' : 'Select Subject')
                      }
                    </option>
                    {availableSubjects.map((subject, index) => {
                      const subjectLabel = typeof subject === 'object' 
                        ? (subject.label || subject.name || subject.value || subject)
                        : subject;
                      const displayLabel = getSubjectLabel(subjectLabel);
                      return (
                        <option key={index} value={subjectLabel}>
                          {displayLabel}
                        </option>
                      );
                    })}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid" style={arabicFontStyle}>
                    {formErrors.subject}
                  </Form.Control.Feedback>
                  {formData.classId && (
                    <Form.Text className="text-muted" style={arabicFontStyle}>
                      <FaBook className="me-1" />
                      {availableSubjects.length > 0 
                        ? (isArabic 
                          ? `${availableSubjects.length} مادة مخصصة لك في هذا المستوى` 
                          : `${availableSubjects.length} subjects assigned to you for this level`)
                        : (isArabic 
                          ? '⚠️ لا توجد مواد مخصصة لك في هذا المستوى' 
                          : '⚠️ No subjects assigned to you for this level')
                      }
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                {isArabic ? 'الوصف / التعليمات' : 'Description / Instructions'}
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                style={{
                  ...arabicFontStyle,
                  background: darkMode ? '#2d2d44' : 'white',
                  color: darkMode ? '#e9ecef' : '#212529',
                  borderRadius: '12px',
                }}
              />
            </Form.Group>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                    {isArabic ? 'الدرجة الكلية *' : 'Total Marks *'}
                  </Form.Label>
                  <Form.Control
                    type="number"
                    name="totalMarks"
                    value={formData.totalMarks}
                    onChange={handleFormChange}
                    isInvalid={!!formErrors.totalMarks}
                    min="1"
                    step="0.5"
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? '#2d2d44' : 'white',
                      color: darkMode ? '#e9ecef' : '#212529',
                      borderRadius: '12px',
                    }}
                  />
                  <Form.Control.Feedback type="invalid" style={arabicFontStyle}>
                    {formErrors.totalMarks}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                    {isArabic ? 'تاريخ الاستحقاق *' : 'Due Date *'}
                  </Form.Label>
                  <Form.Control
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleFormChange}
                    isInvalid={!!formErrors.dueDate}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? '#2d2d44' : 'white',
                      color: darkMode ? '#e9ecef' : '#212529',
                      borderRadius: '12px',
                    }}
                  />
                  <Form.Control.Feedback type="invalid" style={arabicFontStyle}>
                    {formErrors.dueDate}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                    {isArabic ? 'الحالة' : 'Status'}
                  </Form.Label>
                  <Form.Select
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? '#2d2d44' : 'white',
                      color: darkMode ? '#e9ecef' : '#212529',
                      borderRadius: '12px',
                    }}
                  >
                    <option value="draft">{isArabic ? 'مسودة' : 'Draft'}</option>
                    <option value="published">{isArabic ? 'منشور' : 'Published'}</option>
                    <option value="pending_marking">{isArabic ? 'انتظار التصحيح' : 'Pending Marking'}</option>
                    <option value="closed">{isArabic ? 'مغلق' : 'Closed'}</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            {/* Attachment Upload */}
            <Form.Group className="mb-3">
              <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                <FaUpload className="me-2" />
                {isArabic ? 'رفع ملف المرفق (PDF, Word, صورة)' : 'Upload Attachment (PDF, Word, Image)'}
              </Form.Label>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <Form.Control
                  type="file"
                  id="attachmentUpload"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.bmp,.webp,.txt,.xls,.xlsx,.ppt,.pptx"
                  onChange={handleFileAttachment}
                  style={{
                    ...arabicFontStyle,
                    background: darkMode ? '#2d2d44' : 'white',
                    color: darkMode ? '#e9ecef' : '#212529',
                    borderRadius: '12px',
                    padding: '8px 12px',
                    flex: '1',
                    minWidth: '200px'
                  }}
                />
                {formData.attachmentName && (
                  <Button 
                    variant="outline-danger" 
                    size="sm"
                    onClick={handleRemoveAttachment}
                    style={{ borderRadius: '12px' }}
                    title={isArabic ? 'إزالة الملف' : 'Remove file'}
                  >
                    <FaTimes /> {isArabic ? 'إزالة' : 'Remove'}
                  </Button>
                )}
              </div>
              {formData.attachmentName && (
                <div className="mt-2 p-2 rounded-3" style={{
                  background: darkMode ? '#2d2d44' : '#f8f9fa',
                  border: `1px solid ${darkMode ? '#3d3d5c' : '#e9ecef'}`,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {getFileIcon(formData.attachmentType).icon}
                  <span style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                    <strong>{formData.attachmentName}</strong>
                    <span className="text-muted ms-2" style={{ fontSize: '0.75rem' }}>
                      ({getFileTypeLabel(formData.attachmentType)})
                    </span>
                  </span>
                </div>
              )}
              <Form.Text className="text-muted" style={arabicFontStyle}>
                {isArabic 
                  ? 'يدعم ملفات PDF و Word والصور. الحد الأقصى 10 ميجابايت' 
                  : 'Supports PDF, Word, and image files. Maximum 10MB'}
              </Form.Text>
            </Form.Group>

            {/* Student Selection */}
            {formData.classId && (
              <Form.Group className="mb-3">
                <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                  <FaUsers className="me-2" />
                  {isArabic ? 'تحديد الطلاب المستهدفين' : 'Select Target Students'}
                </Form.Label>
                <div className="student-selection p-3 rounded-3" style={{
                  background: darkMode ? '#1a1a2e' : '#f8f9fa',
                  border: `1px solid ${darkMode ? '#2d2d44' : '#e9ecef'}`,
                  borderRadius: '12px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}>
                  <Form.Check
                    type="checkbox"
                    id="selectAllStudents"
                    label={isArabic ? 'تحديد الكل' : 'Select All'}
                    checked={formData.assignedStudents?.length === getClassStudents(formData.classId).length && getClassStudents(formData.classId).length > 0}
                    onChange={handleSelectAllStudents}
                    style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}
                  />
                  <hr className="my-2" style={{ borderColor: darkMode ? '#2d2d44' : '#e9ecef' }} />
                  {getClassStudents(formData.classId).map(student => (
                    <Form.Check
                      key={student.id}
                      type="checkbox"
                      id={`student-${student.id}`}
                      label={student.name || student.firstName || 'Unknown'}
                      checked={formData.assignedStudents?.includes(student.id) || false}
                      onChange={() => handleStudentToggle(student.id)}
                      style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}
                    />
                  ))}
                  {getClassStudents(formData.classId).length === 0 && (
                    <p className="text-muted text-center mt-2" style={arabicFontStyle}>
                      {isArabic ? 'لا يوجد طلاب في هذا الفصل' : 'No students in this class'}
                    </p>
                  )}
                </div>
                <Form.Text className="text-muted" style={arabicFontStyle}>
                  {isArabic 
                    ? `تم اختيار ${formData.assignedStudents?.length || 0} طالب من ${getClassStudents(formData.classId).length}`
                    : `${formData.assignedStudents?.length || 0} students selected out of ${getClassStudents(formData.classId).length}`}
                </Form.Text>
              </Form.Group>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Button variant="secondary" onClick={handleCloseModal} style={{ ...arabicFontStyle, borderRadius: '12px' }}>
            {isArabic ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={submitting} style={{ ...arabicFontStyle, borderRadius: '12px' }}>
            {submitting ? (
              <>
                <FaSpinner className="spinning me-2" />
                {isArabic ? 'جاري الحفظ...' : 'Saving...'}
              </>
            ) : (
              <>
                <FaSave className="me-1" />
                {editingAssessment ? (isArabic ? 'تحديث' : 'Update') : (isArabic ? 'إنشاء' : 'Create')}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===== GRADE MODAL (for My Assessments) ===== */}
      <Modal show={showGradeModal} onHide={() => setShowGradeModal(false)} size="lg" centered className="modern-modal">
        <Modal.Header closeButton className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Modal.Title style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
            <FaCheckCircle className="me-2 text-success" />
            {isArabic ? 'تصحيح التقييم' : 'Grade Assessment'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? '#0d1117' : 'white' }}>
          {selectedAssessment && (
            <div>
              <div className="mb-3">
                <h6 className="fw-bold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                  {selectedAssessment.title}
                </h6>
                <p className="text-muted" style={arabicFontStyle}>
                  {isArabic ? 'الفصل: ' : 'Class: '}{selectedAssessment.className} • 
                  {isArabic ? ' المادة: ' : ' Subject: '}{selectedAssessment.subject} • 
                  {isArabic ? 'الدرجة الكلية: ' : 'Total Marks: '}{formatNumber(selectedAssessment.totalMarks)}
                </p>
              </div>
              <hr style={{ borderColor: darkMode ? '#2d2d44' : '#e9ecef' }} />
              <div className="student-grades" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {gradingStudents.map((student) => {
                  const score = gradeData[student.id] || '';
                  const statusInfo = getSubmissionStatus(student.submitted, student.graded);
                  
                  return (
                    <div key={student.id} className="d-flex align-items-center gap-3 py-2 border-bottom" style={{ borderColor: darkMode ? '#2d2d44' : '#e9ecef' }}>
                      <div className="d-flex align-items-center gap-2" style={{ minWidth: '180px' }}>
                        <div className="student-avatar-sm" style={{
                          background: `linear-gradient(135deg, #4a9eff, #2a7f9a)`,
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: '700',
                          fontSize: '0.75rem',
                          flexShrink: 0
                        }}>
                          {(student.name || student.firstName || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="fw-semibold" style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: '0.85rem' }}>
                            {student.name || student.firstName || 'Unknown'}
                          </div>
                          <div className="text-muted" style={{ fontSize: '0.6rem' }}>
                            <FaIdCard className="me-1" size={10} /> {student.id}
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ minWidth: '120px' }}>
                        <Badge 
                          bg={student.submitted ? (student.graded ? 'success' : 'warning') : 'secondary'} 
                          className="rounded-pill"
                          style={{ fontSize: '0.7rem' }}
                        >
                          {statusInfo.icon} {statusInfo.text}
                        </Badge>
                      </div>
                      
                      {student.submitted && (
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="p-0 text-primary"
                          style={{ textDecoration: 'none', fontSize: '0.75rem' }}
                          onClick={() => handleViewSubmissionFromGrade(student)}
                        >
                          <FaEye className="me-1" size={12} /> {isArabic ? 'عرض التقديم' : 'View Submission'}
                        </Button>
                      )}
                      
                      <div className="d-flex align-items-center gap-2 ms-auto">
                        <Form.Control
                          type="number"
                          min="0"
                          max={selectedAssessment.totalMarks}
                          step="0.5"
                          value={score}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            setGradeData(prev => ({
                              ...prev,
                              [student.id]: newValue
                            }));
                          }}
                          placeholder={isArabic ? 'الدرجة' : 'Score'}
                          disabled={!student.submitted}
                          style={{
                            ...arabicFontStyle,
                            background: darkMode ? '#2d2d44' : 'white',
                            color: darkMode ? '#e9ecef' : '#212529',
                            borderRadius: '8px',
                            width: '100px',
                            borderColor: student.graded ? '#2ecc71' : (darkMode ? '#2d2d44' : '#e9ecef'),
                          }}
                        />
                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                          / {formatNumber(selectedAssessment.totalMarks)}
                        </span>
                        {student.graded && score && (
                          <Badge style={{ 
                            background: getGradeColor(score, selectedAssessment.totalMarks),
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '8px',
                            fontSize: '0.7rem'
                          }}>
                            {getGradeLetter(score, selectedAssessment.totalMarks)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Button variant="secondary" onClick={() => setShowGradeModal(false)} style={{ ...arabicFontStyle, borderRadius: '12px' }}>
            {isArabic ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button variant="success" onClick={handleSubmitGrades} style={{ ...arabicFontStyle, borderRadius: '12px' }}>
            <FaSave className="me-2" />
            {isArabic ? 'حفظ الدرجات' : 'Save Grades'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===== FORWARDED GRADE MODAL ===== */}
      <Modal show={showForwardedGradeModal} onHide={() => setShowForwardedGradeModal(false)} size="lg" centered className="modern-modal">
        <Modal.Header closeButton className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Modal.Title style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
            <FaCheckCircle className="me-2 text-success" />
            {isArabic ? 'تصحيح تقديم الطالب' : 'Grade Student Submission'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? '#0d1117' : 'white' }}>
          {selectedForwardedItem && (
            <div>
              <div className="mb-3 p-3 rounded-3" style={{
                background: darkMode ? '#2d2d44' : '#f8f9fa',
                border: `1px solid ${darkMode ? '#3d3d5c' : '#e9ecef'}`,
                borderRadius: '12px'
              }}>
                <div className="d-flex align-items-center gap-3">
                  <div className="student-avatar-md" style={{
                    background: `linear-gradient(135deg, #2ecc71, #27ae60)`,
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '1.1rem'
                  }}>
                    {(selectedForwardedItem.studentName || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h6 className="fw-bold mb-0" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                      {selectedForwardedItem.studentName}
                    </h6>
                    <div className="text-muted small" style={arabicFontStyle}>
                      <FaIdCard className="me-1" size={12} /> {selectedForwardedItem.student?.id || 'N/A'}
                      <span className="mx-2">•</span>
                      {selectedForwardedItem.title}
                      <span className="mx-2">•</span>
                      {selectedForwardedItem.subject}
                    </div>
                  </div>
                </div>
                {selectedForwardedItem.fileName && (
                  <div className="mt-2">
                    <Badge bg="info" style={{ fontSize: '0.7rem' }}>
                      <FaFile className="me-1" size={10} />
                      {selectedForwardedItem.fileName}
                    </Badge>
                  </div>
                )}
                <div className="mt-2">
                  <Badge bg="secondary" style={{ fontSize: '0.7rem' }}>
                    <FaInbox className="me-1" size={10} />
                    {isArabic ? 'مرسل من الإدارة' : 'Forwarded from Admin'}
                  </Badge>
                </div>
              </div>

              <div className="d-flex align-items-center gap-3 p-3 rounded-3" style={{
                background: darkMode ? '#1a1a2e' : '#ffffff',
                border: `1px solid ${darkMode ? '#2d2d44' : '#e9ecef'}`,
                borderRadius: '12px'
              }}>
                <div className="flex-grow-1">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                    {isArabic ? 'الدرجة' : 'Score'}
                  </Form.Label>
                  <div className="d-flex align-items-center gap-2">
                    <Form.Control
                      type="number"
                      min="0"
                      max={selectedForwardedItem.totalMarks || 20}
                      step="0.5"
                      value={forwardedGradeData[selectedForwardedItem.student?.id || selectedForwardedItem.studentId || 'student'] || ''}
                      onChange={(e) => {
                        const studentId = selectedForwardedItem.student?.id || selectedForwardedItem.studentId || 'student';
                        setForwardedGradeData({
                          [studentId]: e.target.value
                        });
                      }}
                      placeholder={isArabic ? 'أدخل الدرجة' : 'Enter score'}
                      style={{
                        ...arabicFontStyle,
                        background: darkMode ? '#2d2d44' : 'white',
                        color: darkMode ? '#e9ecef' : '#212529',
                        borderRadius: '12px',
                        width: '150px',
                        borderColor: darkMode ? '#2d2d44' : '#e9ecef',
                      }}
                    />
                    <span className="text-muted" style={{ fontSize: '1rem' }}>
                      / {formatNumber(selectedForwardedItem.totalMarks || 20)}
                    </span>
                  </div>
                </div>
                <div className="text-center" style={{ minWidth: '80px' }}>
                  <div className="text-muted small">{isArabic ? 'التقدير' : 'Grade'}</div>
                  <div className="fw-bold" style={{ 
                    fontSize: '1.5rem',
                    color: getGradeColor(forwardedGradeData[selectedForwardedItem.student?.id || selectedForwardedItem.studentId || 'student'] || '', selectedForwardedItem.totalMarks || 20)
                  }}>
                    {getGradeLetter(forwardedGradeData[selectedForwardedItem.student?.id || selectedForwardedItem.studentId || 'student'] || '', selectedForwardedItem.totalMarks || 20)}
                  </div>
                </div>
              </div>

              <div className="mt-3 p-3 rounded-3" style={{
                background: darkMode ? '#1a1a2e' : '#f8f9fa',
                border: `1px solid ${darkMode ? '#2d2d44' : '#e9ecef'}`,
                borderRadius: '12px'
              }}>
                <p className="text-muted small mb-0" style={arabicFontStyle}>
                  <FaInfoCircle className="me-1" />
                  {isArabic 
                    ? 'بعد حفظ الدرجة، سيتم إعلام الطالب بالنتيجة وسيظهر التقدير في حساب الطالب'
                    : 'After saving the grade, the student will be notified and the grade will appear in their account'}
                </p>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Button variant="secondary" onClick={() => setShowForwardedGradeModal(false)} style={{ ...arabicFontStyle, borderRadius: '12px' }}>
            {isArabic ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button variant="success" onClick={handleSubmitForwardedGrade} style={{ ...arabicFontStyle, borderRadius: '12px' }}>
            <FaSave className="me-2" />
            {isArabic ? 'حفظ الدرجة' : 'Save Grade'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===== VIEW FORWARDED SUBMISSION MODAL ===== */}
      <Modal show={showForwardedViewModal} onHide={() => setShowForwardedViewModal(false)} centered size="lg" className="modern-modal">
        <Modal.Header closeButton className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Modal.Title style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
            <FaFileAlt className="me-2 text-primary" />
            {isArabic ? 'تقديم الطالب' : 'Student Submission'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? '#0d1117' : 'white' }}>
          {viewingSubmission && (
            <div>
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="student-avatar-md" style={{
                  background: `linear-gradient(135deg, #2ecc71, #27ae60)`,
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '1.2rem'
                }}>
                  {(viewingSubmission.student?.name || viewingSubmission.studentName || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h6 className="fw-bold mb-0" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                    {viewingSubmission.student?.name || viewingSubmission.studentName || 'Unknown'}
                  </h6>
                  <small className="text-muted" style={arabicFontStyle}>
                    <FaIdCard className="me-1" /> {isArabic ? 'المعرف: ' : 'ID: '}{viewingSubmission.student?.id || 'N/A'}
                  </small>
                </div>
                <div className="ms-auto">
                  <Badge bg={viewingSubmission.graded ? 'success' : 'warning'} className="rounded-pill" style={{ fontSize: '0.8rem' }}>
                    {viewingSubmission.graded ? (
                      <>
                        <FaCheckCircle className="me-1" /> {isArabic ? 'مصحح' : 'Graded'}
                      </>
                    ) : (
                      <>
                        <FaClock className="me-1" /> {isArabic ? 'بانتظار التصحيح' : 'Pending Grading'}
                      </>
                    )}
                  </Badge>
                </div>
              </div>

              <hr style={{ borderColor: darkMode ? '#2d2d44' : '#e9ecef' }} />

              {viewingSubmission.content || viewingSubmission.fileName ? (
                <div className="submission-content">
                  <div className="submission-meta mb-3">
                    <div className="d-flex gap-3 flex-wrap">
                      <span className="text-muted" style={arabicFontStyle}>
                        <FaClock className="me-1" />
                        {isArabic ? 'تاريخ التقديم: ' : 'Submitted: '}
                        <span className="fw-semibold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                          {viewingSubmission.submittedAt ? new Date(viewingSubmission.submittedAt).toLocaleString() : 'N/A'}
                        </span>
                      </span>
                      {viewingSubmission.fileName && (
                        <span className="text-muted" style={arabicFontStyle}>
                          <FaFile className="me-1" />
                          {isArabic ? 'اسم الملف: ' : 'File Name: '}
                          <span className="fw-semibold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                            {viewingSubmission.fileName}
                          </span>
                        </span>
                      )}
                      {viewingSubmission.fileType && (
                        <span className="text-muted" style={arabicFontStyle}>
                          <FaInfoCircle className="me-1" />
                          {isArabic ? 'نوع الملف: ' : 'File Type: '}
                          <span className="fw-semibold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                            {getFileTypeLabel(viewingSubmission.fileType)}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="submission-file-preview p-4 rounded-3" style={{
                    background: darkMode ? '#2d2d44' : '#f8f9fa',
                    border: `1px solid ${darkMode ? '#3d3d5c' : '#e9ecef'}`,
                    borderRadius: '12px',
                    minHeight: '200px'
                  }}>
                    {viewingSubmission.content && viewingSubmission.content.length > 0 && !viewingSubmission.fileName ? (
                      <div className="submission-content-display" style={{
                        ...arabicFontStyle,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        maxHeight: '400px',
                        overflowY: 'auto',
                        padding: '12px',
                        background: darkMode ? '#1a1a2e' : '#ffffff',
                        borderRadius: '8px',
                        border: `1px solid ${darkMode ? '#2d2d44' : '#e9ecef'}`,
                        color: darkMode ? '#e9ecef' : '#212529'
                      }}>
                        {viewingSubmission.content}
                      </div>
                    ) : viewingSubmission.fileName ? (
                      <div className="text-center py-4">
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
                          {getFileIcon(viewingSubmission.fileType).icon}
                        </div>
                        <h6 className="fw-bold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                          {viewingSubmission.fileName}
                        </h6>
                        <p className="text-muted" style={arabicFontStyle}>
                          {isArabic ? 'نوع الملف: ' : 'File Type: '} 
                          <span className="fw-semibold">{getFileTypeLabel(viewingSubmission.fileType)}</span>
                        </p>
                        <p className="text-muted small" style={arabicFontStyle}>
                          {isArabic ? '📄 يمكنك تنزيل الملف باستخدام الزر أدناه' : '📄 You can download the file using the button below'}
                        </p>
                        
                        <Button 
                          variant="primary" 
                          size="md"
                          onClick={handleDownloadFile}
                          style={{ 
                            borderRadius: '10px', 
                            ...arabicFontStyle,
                            padding: '8px 20px'
                          }}
                        >
                          <FaDownload className="me-2" /> 
                          {isArabic ? 'تحميل' : 'Download'}
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <FaExclamationTriangle size={48} className="text-warning mb-3" />
                        <p style={arabicFontStyle}>
                          {isArabic ? 'لا يوجد محتوى لعرضه' : 'No content to display'}
                        </p>
                      </div>
                    )}
                  </div>

                  {selectedForwardedItem && (
                    <div className="mt-3 p-3 rounded-3" style={{
                      background: darkMode ? '#2d2d44' : '#f8f9fa',
                      border: `1px solid ${darkMode ? '#3d3d5c' : '#e9ecef'}`,
                      borderRadius: '12px'
                    }}>
                      <div className="d-flex align-items-center gap-3 flex-wrap">
                        <span className="fw-semibold" style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                          {isArabic ? 'الدرجة: ' : 'Score: '}
                        </span>
                        {viewingSubmission.graded ? (
                          <>
                            <span className="fw-bold" style={{ fontSize: '1.2rem', color: viewingSubmission.gradeColor || '#2ecc71' }}>
                              {formatNumber(viewingSubmission.score)}
                            </span>
                            <span className="text-muted" style={arabicFontStyle}>
                              / {formatNumber(viewingSubmission.totalMarks || 20)}
                            </span>
                            <Badge style={{ 
                              background: viewingSubmission.gradeColor || '#2ecc71',
                              color: 'white',
                              padding: '4px 12px',
                              borderRadius: '8px'
                            }}>
                              {viewingSubmission.gradeLetter || '-'}
                            </Badge>
                          </>
                        ) : (
                          <span className="text-muted" style={arabicFontStyle}>
                            {isArabic ? 'بانتظار التصحيح' : 'Pending Grading'}
                          </span>
                        )}
                      </div>
                      {!viewingSubmission.graded && (
                        <div className="mt-2">
                          <Button 
                            variant="success" 
                            size="sm"
                            onClick={() => {
                              setShowForwardedViewModal(false);
                              handleGradeForwarded(selectedForwardedItem);
                            }}
                            style={{ ...arabicFontStyle, borderRadius: '10px' }}
                          >
                            <FaCheckCircle className="me-1" />
                            {isArabic ? 'تصحيح التقديم' : 'Grade Submission'}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-5">
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
          <Button variant="secondary" onClick={() => setShowForwardedViewModal(false)} style={{ ...arabicFontStyle, borderRadius: '12px' }}>
            {isArabic ? 'إغلاق' : 'Close'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===== DELETE FORWARDED CONFIRMATION MODAL ===== */}
      <Modal show={showDeleteForwardedModal} onHide={() => setShowDeleteForwardedModal(false)} centered className="modern-modal">
        <Modal.Header closeButton className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Modal.Title style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
            <FaExclamationTriangle className="me-2 text-danger" />
            {isArabic ? 'تأكيد حذف التقديم' : 'Confirm Delete Submission'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? '#0d1117' : 'white' }}>
          <div className="text-center mb-3">
            <div
              className="rounded-circle bg-danger bg-opacity-10 d-inline-flex p-3 mb-3"
              style={{
                width: '64px',
                height: '64px',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FaTrash size={28} className="text-danger" />
            </div>
          </div>
          <p
            style={{
              ...arabicFontStyle,
              fontSize: 'clamp(0.9rem, 1vw, 1.05rem)',
              textAlign: 'center',
              color: darkMode ? '#e9ecef' : '#212529',
            }}
          >
            {isArabic
              ? `هل أنت متأكد من حذف هذا التقديم؟`
              : `Are you sure you want to delete this submission?`}
          </p>
          {forwardedItemToDelete && (
            <div className="p-3 rounded-3" style={{
              background: darkMode ? '#2d2d44' : '#f8f9fa',
              border: `1px solid ${darkMode ? '#3d3d5c' : '#e9ecef'}`,
              borderRadius: '12px'
            }}>
              <div className="d-flex align-items-center gap-2">
                <FaFileAlt className="text-info" />
                <span style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                  {forwardedItemToDelete.title || 'Untitled'}
                </span>
              </div>
              {forwardedItemToDelete.studentName && (
                <div className="mt-1 d-flex align-items-center gap-2">
                  <FaUserGraduate className="text-success" size={12} />
                  <span className="text-muted small">
                    {isArabic ? 'الطالب: ' : 'Student: '}
                    {forwardedItemToDelete.studentName}
                  </span>
                </div>
              )}
              {forwardedItemToDelete.subject && (
                <div className="mt-1 d-flex align-items-center gap-2">
                  <FaBook className="text-primary" size={12} />
                  <span className="text-muted small">
                    {isArabic ? 'المادة: ' : 'Subject: '}
                    {forwardedItemToDelete.subject}
                  </span>
                </div>
              )}
            </div>
          )}
          <p
            className="text-muted text-center mt-3"
            style={{
              ...arabicFontStyle,
              fontSize: 'clamp(0.8rem, 0.9vw, 0.9rem)',
            }}
          >
            {isArabic
              ? 'هذا الإجراء لا يمكن التراجع عنه وسيتم حذف العنصر نهائياً'
              : 'This action cannot be undone and the item will be permanently deleted'}
          </p>
        </Modal.Body>
        <Modal.Footer className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Button variant="secondary" onClick={() => setShowDeleteForwardedModal(false)} style={{ ...arabicFontStyle, borderRadius: '12px' }}>
            <FaTimes className="me-1" /> {isArabic ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button variant="danger" onClick={confirmDeleteForwarded} style={{ ...arabicFontStyle, borderRadius: '12px' }}>
            <FaTrash className="me-1" /> {isArabic ? 'تأكيد الحذف' : 'Confirm Delete'}
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .teacher-assessments {
          padding: 0;
          max-width: 100vw;
          overflow-x: hidden;
        }

        .teacher-assessments * {
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

        .assessment-table th,
        .assessment-table td {
          vertical-align: middle;
        }

        .assessment-table tbody tr {
          transition: background-color 0.2s;
        }

        .assessment-table tbody tr:hover {
          background-color: rgba(0,0,0,0.02);
        }

        .action-btn {
          padding: 2px 6px !important;
          min-width: 26px;
          min-height: 26px;
          font-size: clamp(0.5rem, 0.6vw, 0.7rem) !important;
          border-radius: 6px !important;
        }

        .tab-btn {
          transition: all 0.3s ease;
        }

        .tab-btn:hover {
          opacity: 0.8;
        }

        .tab-btn.active {
          border-bottom: 3px solid #4a9eff;
          color: #4a9eff;
        }

        .send-to-admin-btn {
          background: linear-gradient(135deg, #0066ff, #0044cc) !important;
          color: white !important;
          border: 2px solid #0044cc !important;
          font-weight: bold !important;
          text-shadow: 0 1px 2px rgba(0,0,0,0.3) !important;
          box-shadow: 0 2px 8px rgba(0, 102, 255, 0.4) !important;
          transition: all 0.3s ease !important;
        }

        .send-to-admin-btn:hover {
          transform: scale(1.05) !important;
          box-shadow: 0 4px 20px rgba(0, 102, 255, 0.6) !important;
          background: linear-gradient(135deg, #0055ee, #0033bb) !important;
        }

        .send-to-students-btn {
          background: linear-gradient(135deg, #28a745, #1e7e34) !important;
          color: white !important;
          border: 2px solid #1e7e34 !important;
          font-weight: bold !important;
          text-shadow: 0 1px 2px rgba(0,0,0,0.3) !important;
          box-shadow: 0 2px 8px rgba(40, 167, 69, 0.4) !important;
          transition: all 0.3s ease !important;
        }

        .send-to-students-btn:hover {
          transform: scale(1.05) !important;
          box-shadow: 0 4px 20px rgba(40, 167, 69, 0.6) !important;
          background: linear-gradient(135deg, #219a3a, #166b2b) !important;
        }

        @keyframes pulse-warning {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        @keyframes pulse-green {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.02); }
        }
      `}</style>
    </div>
  );
};

export default TeacherAssessments;