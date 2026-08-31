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
  FaUserCircle, FaInfoCircle, FaPrint, FaExternalLinkAlt
} from 'react-icons/fa';
import { useLanguage } from '../../../context/LanguageContext';
import { useNotification } from '../../../hooks/useNotification';
import { teacherService } from '../../../services/teacherService';

// ===== DEFAULT SUBJECTS BY LEVEL =====
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

// ===== ALWAYS use English numbers =====
const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  return num.toString();
};

const TeacherAssessments = () => {
  const { isArabic } = useLanguage();
  const { notify } = useNotification();
  const [darkMode, setDarkMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [assessments, setAssessments] = useState([]);
  const [filteredAssessments, setFilteredAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
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
    totalMarks: 100,
    dueDate: '',
    status: 'published',
    assignedStudents: []
  });
  const [formErrors, setFormErrors] = useState({});

  // ===== GET SUBJECTS FOR LEVEL =====
  const getSubjectsForLevel = (level) => {
    if (!level) return [];
    const subjects = defaultSubjectsByCategory[level] || [];
    return subjects.map(s => s.label);
  };

  // ===== GET SUBJECT LABEL WITH ARABIC =====
  const getSubjectLabel = (subjectLabel) => {
    if (!subjectLabel) return '';
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

      console.log('🔄 Loading teacher assessments data...');
      
      const currentTeacher = teacherService.getCurrentTeacher();
      console.log('👨‍🏫 Current teacher:', currentTeacher);
      
      if (!currentTeacher) {
        setError(isArabic ? 'لم يتم العثور على المعلم' : 'Teacher not found');
        setLoading(false);
        return;
      }
      
      setTeacher(currentTeacher);
      
      const assignedClasses = teacherService.getAssignedClasses(currentTeacher.id);
      console.log('📚 Assigned classes:', assignedClasses.length);
      setClasses(assignedClasses);
      
      const assignedStudents = teacherService.getAssignedStudents(currentTeacher.id);
      console.log('👨‍🎓 Assigned students:', assignedStudents.length);
      setStudents(assignedStudents);
      
      const allSubmissions = JSON.parse(localStorage.getItem('school_submissions') || '[]');
      console.log('📤 All submissions in localStorage:', allSubmissions.length);
      allSubmissions.forEach((s, i) => {
        console.log(`  Submission ${i+1}:`, { 
          id: s.id, 
          studentId: s.studentId, 
          assessmentId: s.assessmentId,
          content: s.content ? s.content.substring(0, 50) + '...' : 'No content',
          fileType: s.fileType,
          fileName: s.fileName
        });
      });
      setAllSubmissions(allSubmissions);
      
      const storedAssessments = JSON.parse(localStorage.getItem('school_assessments') || '[]');
      console.log('📝 Stored assessments:', storedAssessments.length);
      
      const teacherAssessments = storedAssessments.filter(a => a.teacherId === currentTeacher.id);
      console.log('📝 Teacher assessments:', teacherAssessments.length);
      
      const enrichedAssessments = teacherAssessments.map(a => {
        const classInfo = assignedClasses.find(c => c.id === a.classId);
        const assessmentSubmissions = allSubmissions.filter(s => s.assessmentId === a.id);
        const grades = a.grades || [];
        
        console.log(`📊 Assessment ${a.id} (${a.title}) has ${assessmentSubmissions.length} submissions`);
        
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
  }, [assessments, statusFilter, classFilter, searchTerm]);

  // ===== SETUP EFFECT =====
  useEffect(() => {
    loadData();

    const unsubscribeTeacher = teacherService.addListener(() => {
      console.log('👨‍🏫 Teacher data changed, refreshing assessments');
      loadData();
    });

    const handleStorageChange = (e) => {
      if (e.key === "school_assessments" || e.key === "school_submissions" || e.key === "school_users" || e.key === "school_classes") {
        console.log("🔄 Storage changed, refreshing assessments");
        loadData();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    const handleAssessmentChanged = () => {
      console.log("📝 Assessment changed, refreshing");
      loadData();
    };
    window.addEventListener("assessmentChanged", handleAssessmentChanged);

    const handleSubmissionChanged = () => {
      console.log("📤 Submission changed, refreshing");
      loadData();
    };
    window.addEventListener("submissionChanged", handleSubmissionChanged);

    return () => {
      if (unsubscribeTeacher) unsubscribeTeacher();
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("assessmentChanged", handleAssessmentChanged);
      window.removeEventListener("submissionChanged", handleSubmissionChanged);
    };
  }, []);

  // ===== HANDLE VIEW SUBMISSIONS =====
  const handleViewSubmissions = (assessment) => {
    console.log('👁️ Viewing submissions for assessment:', assessment.id);
    setSelectedAssessment(assessment);
    
    const freshSubmissions = JSON.parse(localStorage.getItem('school_submissions') || '[]');
    const assessmentSubmissions = freshSubmissions.filter(s => s.assessmentId === assessment.id);
    console.log('📤 Assessment submissions found:', assessmentSubmissions.length);
    
    const classStudents = students.filter(s => s.classId === assessment.classId || s.class === assessment.classId);
    console.log('📚 Class students:', classStudents.length);
    
    const grades = assessment.grades || [];
    console.log('📊 Existing grades:', grades.length);
    
    const studentResults = classStudents.map(student => {
      const submission = assessmentSubmissions.find(s => s.studentId === student.id);
      const grade = grades.find(g => g.studentId === student.id);
      
      const hasSubmitted = !!submission;
      console.log(`  Student ${student.name || student.firstName}: submitted=${hasSubmitted}`);
      
      return {
        student: student,
        submitted: hasSubmitted,
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
    console.log('👁️ Viewing submission for student:', studentResult.student.id);
    setViewingSubmission({
      student: studentResult.student,
      content: studentResult.submissionContent,
      fileType: studentResult.submissionFileType,
      fileName: studentResult.submissionFileName,
      submittedAt: studentResult.submissionDate,
      score: studentResult.score,
      graded: studentResult.graded,
      gradeLetter: studentResult.gradeLetter,
      gradeColor: studentResult.gradeColor
    });
    setShowSubmissionViewModal(true);
  };

  // ===== HANDLE VIEW SUBMISSION FROM GRADE MODAL =====
  const handleViewSubmissionFromGrade = (student) => {
    console.log('👁️ Viewing submission from grade modal for student:', student.id);
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
      gradeColor: getGradeColor(gradeData[student.id] || '', selectedAssessment?.totalMarks)
    });
    setShowSubmissionViewModal(true);
  };

  // ===== HANDLE DOWNLOAD FILE =====
  const handleDownloadFile = () => {
    if (!viewingSubmission) return;
    
    const { fileName, fileType, content } = viewingSubmission;
    
    if (!fileName && !content) {
      notify(
        isArabic ? 'لا يوجد ملف للتحميل' : 'No file to download',
        'warning'
      );
      return;
    }
    
    // If there's actual content (text submission), create a text file
    if (content && !fileName) {
      try {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `submission_${viewingSubmission.student.id}_${new Date().toISOString().slice(0,10)}.txt`;
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
    
    // For file uploads, we need to simulate download with file info
    // Since we can't store actual file content in localStorage, we show a message
    notify(
      isArabic 
        ? `📄 الملف "${fileName || 'submission'}" جاهز للتحميل. نوع الملف: ${getFileTypeLabel(fileType)}` 
        : `📄 File "${fileName || 'submission'}" is ready for download. File type: ${getFileTypeLabel(fileType)}`,
      'info'
    );
    
    // Create a fake download to show the user
    try {
      const blob = new Blob([`File Name: ${fileName || 'submission'}\nFile Type: ${getFileTypeLabel(fileType)}\nSubmitted: ${new Date(viewingSubmission.submittedAt).toLocaleString()}\n\nNote: The actual file content is stored in the system. This is a placeholder download.`], 
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
    
    // If it's text content, show it in the modal (already shown)
    if (content && !fileName) {
      notify(
        isArabic ? '📄 محتوى النص معروض في النافذة' : '📄 Text content is displayed in the window',
        'info'
      );
      return;
    }
    
    // For files, try to open in new window
    const fileTypeLower = (fileType || '').toLowerCase();
    
    // If it's an image, we can show a preview
    if (fileTypeLower.includes('image') || fileTypeLower.includes('jpg') || fileTypeLower.includes('png') || fileTypeLower.includes('gif')) {
      notify(
        isArabic ? '🖼️ هذا ملف صورة. يمكنك تنزيله لعرضه.' : '🖼️ This is an image file. You can download it to view.',
        'info'
      );
      return;
    }
    
    // For PDF, try to open
    if (fileTypeLower.includes('pdf')) {
      notify(
        isArabic ? '📄 هذا ملف PDF. يمكنك تنزيله لعرضه.' : '📄 This is a PDF file. You can download it to view.',
        'info'
      );
      return;
    }
    
    // For other files
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
        totalMarks: assessment.totalMarks || 100,
        dueDate: assessment.dueDate ? new Date(assessment.dueDate).toISOString().split('T')[0] : '',
        status: assessment.status || 'published',
        assignedStudents: assessment.assignedStudents || []
      });
      
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
        totalMarks: 100,
        dueDate: '',
        status: 'published',
        assignedStudents: []
      });
      
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
        assignedStudents: formData.assignedStudents || []
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

  // ===== HANDLE DELETE =====
  const handleDelete = (id) => {
    if (!window.confirm(isArabic ? 'هل أنت متأكد من حذف هذا التقييم؟' : 'Are you sure you want to delete this assessment?')) {
      return;
    }
    
    try {
      let storedAssessments = JSON.parse(localStorage.getItem('school_assessments') || '[]');
      storedAssessments = storedAssessments.filter(a => a.id !== id);
      localStorage.setItem('school_assessments', JSON.stringify(storedAssessments));
      
      notify(
        isArabic ? 'تم حذف التقييم بنجاح' : 'Assessment deleted successfully',
        'success'
      );
      
      window.dispatchEvent(new CustomEvent('assessmentChanged', { 
        detail: { id, action: 'delete' }
      }));
      
      loadData();
    } catch (err) {
      console.error('Error deleting assessment:', err);
      notify(
        isArabic ? 'حدث خطأ أثناء حذف التقييم' : 'Error deleting assessment',
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

  // ===== HANDLE GRADE =====
  const handleGrade = (assessment) => {
    console.log('📝 Opening grade modal for assessment:', assessment.id);
    setSelectedAssessment(assessment);
    
    const freshSubmissions = JSON.parse(localStorage.getItem('school_submissions') || '[]');
    const assessmentSubmissions = freshSubmissions.filter(s => s.assessmentId === assessment.id);
    console.log('📤 Submissions for grading:', assessmentSubmissions.length);
    
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

  // ===== SUBMIT GRADES =====
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
      
      notify(
        isArabic ? `تم حفظ ${grades.length} درجة بنجاح` : `${grades.length} grades saved successfully`,
        'success'
      );
      
      window.dispatchEvent(new CustomEvent('assessmentChanged', { 
        detail: { id: selectedAssessment.id, action: 'graded' }
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
      'pending_marking': 'warning',
      'closed': 'dark'
    };
    return statusMap[status] || 'secondary';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'draft': isArabic ? 'مسودة' : 'Draft',
      'published': isArabic ? 'منشور' : 'Published',
      'pending_marking': isArabic ? 'بانتظار التصحيح' : 'Pending Marking',
      'closed': isArabic ? 'مغلق' : 'Closed'
    };
    return labels[status] || status;
  };

  // ===== GET TYPE LABEL =====
  const getTypeLabel = (type) => {
    const labels = {
      'homework': isArabic ? 'واجب منزلي' : 'Homework',
      'assignment': isArabic ? 'مشروع' : 'Assignment',
      'quiz': isArabic ? 'اختبار قصير' : 'Quiz',
      'test': isArabic ? 'اختبار' : 'Test',
      'exam': isArabic ? 'امتحان' : 'Exam',
      'project': isArabic ? 'مشروع' : 'Project',
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
              {formatNumber(assessments.filter(a => a.status === 'published').length)}
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
              {formatNumber(assessments.filter(a => a.status === 'pending_marking').length)}
            </div>
            <div className="stat-label-mini" style={{ fontSize: '0.7rem', color: '#6c757d' }}>
              {isArabic ? 'بانتظار التصحيح' : 'Pending'}
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
              {formatNumber(classes.length)}
            </div>
            <div className="stat-label-mini" style={{ fontSize: '0.7rem', color: '#6c757d' }}>
              {isArabic ? 'الفصول' : 'Classes'}
            </div>
          </div>
        </Col>
      </Row>

      {/* ===== FILTERS ===== */}
      <Card className="modern-card mb-4" style={{ background: darkMode ? '#1a1a2e' : '#ffffff', borderColor: darkMode ? '#2d2d44' : '#e9ecef' }}>
        <Card.Body className="p-3 p-md-4">
          <Row className="g-2 g-md-3">
            <Col xs={12} md={4} lg={4}>
              <div className="position-relative">
                <FaSearch className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                <Form.Control
                  type="text"
                  placeholder={isArabic ? 'بحث عن تقييم...' : 'Search assessments...'}
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
                <option value="pending_marking">{isArabic ? 'بانتظار التصحيح' : 'Pending Marking'}</option>
                <option value="closed">{isArabic ? 'مغلق' : 'Closed'}</option>
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
              {filteredAssessments.map(assessment => {
                const submissionCount = assessment.submissionCount || 0;
                const gradedCount = assessment.gradedCount || 0;
                const totalStudents = assessment.totalStudents || 0;
                
                return (
                  <tr key={assessment.id}>
                    <td>
                      <div className="fw-semibold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                        {assessment.title}
                      </div>
                      <small className="text-muted d-sm-none" style={arabicFontStyle}>
                        {getTypeLabel(assessment.type)} • {assessment.subject}
                      </small>
                    </td>
                    <td className="d-none d-sm-table-cell">{getTypeLabel(assessment.type)}</td>
                    <td className="d-none d-md-table-cell">{assessment.className}</td>
                    <td className="d-none d-md-table-cell">{assessment.subject}</td>
                    <td className="d-none d-sm-table-cell">{formatNumber(assessment.totalMarks)}</td>
                    <td>
                      <Badge bg={getStatusBadge(assessment.status)}>
                        {getStatusLabel(assessment.status)}
                      </Badge>
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
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          className="action-btn"
                          onClick={() => handleViewSubmissions(assessment)}
                          title={isArabic ? 'عرض التقديمات والنتائج' : 'View Submissions & Results'}
                        >
                          <FaEye size={14} />
                        </Button>
                        {assessment.status !== 'closed' && (
                          <Button 
                            variant="outline-success" 
                            size="sm"
                            className="action-btn"
                            onClick={() => handleGrade(assessment)}
                            title={isArabic ? 'تصحيح' : 'Grade'}
                          >
                            <FaCheckCircle size={14} />
                          </Button>
                        )}
                        <Button 
                          variant="outline-warning" 
                          size="sm"
                          className="action-btn"
                          onClick={() => handleOpenModal(assessment)}
                          title={isArabic ? 'تعديل' : 'Edit'}
                        >
                          <FaEdit size={14} />
                        </Button>
                        {assessment.status !== 'closed' && (
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
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          className="action-btn"
                          onClick={() => handleDelete(assessment.id)}
                          title={isArabic ? 'حذف' : 'Delete'}
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
                    <option value="quiz">{isArabic ? 'اختبار قصير' : 'Quiz'}</option>
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
                          ? (isArabic ? '⚠️ لا توجد مواد لهذا المستوى' : '⚠️ No subjects for this level')
                          : (isArabic ? 'اختر المادة' : 'Select Subject')
                      }
                    </option>
                    {availableSubjects.map((subject, index) => (
                      <option key={index} value={subject}>
                        {getSubjectLabel(subject)}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid" style={arabicFontStyle}>
                    {formErrors.subject}
                  </Form.Control.Feedback>
                  {formData.classId && availableSubjects.length > 0 && (
                    <Form.Text className="text-muted" style={arabicFontStyle}>
                      <FaBook className="me-1" />
                      {isArabic 
                        ? `${availableSubjects.length} مادة متاحة لهذا المستوى` 
                        : `${availableSubjects.length} subjects available for this level`}
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

      {/* ===== GRADE MODAL ===== */}
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
                  {isArabic ? ' المادة: ' : ' Subject: '}{selectedAssessment.subject}
                </p>
                <p className="text-muted" style={arabicFontStyle}>
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

      {/* ===== VIEW SUBMISSIONS AND RESULTS MODAL ===== */}
      <Modal show={showSubmissionModal} onHide={() => setShowSubmissionModal(false)} centered size="lg" className="modern-modal">
        <Modal.Header closeButton className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Modal.Title style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
            <FaEye className="me-2 text-primary" />
            {isArabic ? 'التقديمات والنتائج' : 'Submissions & Results'}
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

      {/* ===== VIEW INDIVIDUAL SUBMISSION MODAL - WITH PREVIEW & DOWNLOAD ===== */}
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
                  {(viewingSubmission.student.name || viewingSubmission.student.firstName || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h6 className="fw-bold mb-0" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                    {viewingSubmission.student.name || viewingSubmission.student.firstName || 'Unknown'}
                  </h6>
                  <small className="text-muted" style={arabicFontStyle}>
                    <FaIdCard className="me-1" /> {isArabic ? 'المعرف: ' : 'ID: '}{viewingSubmission.student.id}
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

                  {/* File Preview Section */}
                  <div className="submission-file-preview p-4 rounded-3" style={{
                    background: darkMode ? '#2d2d44' : '#f8f9fa',
                    border: `1px solid ${darkMode ? '#3d3d5c' : '#e9ecef'}`,
                    borderRadius: '12px',
                    minHeight: '200px'
                  }}>
                    {/* Check if it's a text/note submission */}
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
                        {/* File type icon */}
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
                          {isArabic ? '📄 يمكنك معاينة الملف أو تنزيله باستخدام الأزرار أدناه' : '📄 You can preview or download the file using the buttons below'}
                        </p>
                        
                        {/* Action Buttons */}
                        <div className="d-flex justify-content-center gap-3 mt-3 flex-wrap">
                          {/* Preview Button */}
                          <Button 
                            variant="outline-info" 
                            size="md"
                            onClick={handlePreviewFile}
                            style={{ 
                              borderRadius: '10px', 
                              ...arabicFontStyle,
                              padding: '8px 20px',
                              minWidth: '120px'
                            }}
                          >
                            <FaEye className="me-2" /> 
                            {isArabic ? 'معاينة' : 'Preview'}
                          </Button>
                          
                          {/* Download Button */}
                          <Button 
                            variant="primary" 
                            size="md"
                            onClick={handleDownloadFile}
                            style={{ 
                              borderRadius: '10px', 
                              ...arabicFontStyle,
                              padding: '8px 20px',
                              minWidth: '120px'
                            }}
                          >
                            <FaDownload className="me-2" /> 
                            {isArabic ? 'تحميل' : 'Download'}
                          </Button>
                        </div>
                        
                        {/* Student Notes */}
                        {viewingSubmission.content && viewingSubmission.content.length > 0 && (
                          <div className="mt-3 p-3 rounded-3" style={{
                            background: darkMode ? '#1a1a2e' : '#ffffff',
                            border: `1px solid ${darkMode ? '#2d2d44' : '#e9ecef'}`,
                            borderRadius: '8px',
                            textAlign: 'left',
                            ...arabicFontStyle,
                            color: darkMode ? '#adb5bd' : '#6c757d',
                            fontSize: '0.85rem'
                          }}>
                            <div><strong>{isArabic ? '📝 ملاحظات الطالب:' : '📝 Student Notes:'}</strong></div>
                            <div className="mt-1" style={{ whiteSpace: 'pre-wrap' }}>
                              {viewingSubmission.content}
                            </div>
                          </div>
                        )}
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

                  {/* Grade Info */}
                  {selectedAssessment && (
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
                              / {formatNumber(selectedAssessment.totalMarks)}
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

        .student-selection::-webkit-scrollbar {
          width: 4px;
        }

        .student-selection::-webkit-scrollbar-track {
          background: transparent;
        }

        .student-selection::-webkit-scrollbar-thumb {
          background: ${darkMode ? '#2d2d44' : '#e9ecef'};
          border-radius: 2px;
        }

        .student-grades::-webkit-scrollbar {
          width: 4px;
        }

        .student-grades::-webkit-scrollbar-track {
          background: transparent;
        }

        .student-grades::-webkit-scrollbar-thumb {
          background: ${darkMode ? '#2d2d44' : '#e9ecef'};
          border-radius: 2px;
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

        .submission-file-preview {
          transition: all 0.3s ease;
        }

        .submission-file-preview:hover {
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }

        .submission-content-display {
          max-height: 400px;
          overflow-y: auto;
        }

        .submission-content-display::-webkit-scrollbar {
          width: 4px;
        }

        .submission-content-display::-webkit-scrollbar-track {
          background: transparent;
        }

        .submission-content-display::-webkit-scrollbar-thumb {
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
          .assessment-table {
            font-size: 0.75rem !important;
          }
          .action-btn {
            padding: 1px 4px !important;
            min-width: 20px !important;
            min-height: 20px !important;
          }
          .action-btn svg {
            font-size: 10px !important;
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
          .student-avatar-sm {
            width: 24px !important;
            height: 24px !important;
            font-size: 0.55rem !important;
          }
          .student-avatar-md {
            width: 40px !important;
            height: 40px !important;
            font-size: 1rem !important;
          }
          .submission-content-display {
            max-height: 200px !important;
          }
        }

        @media (max-width: 400px) {
          .stat-number-mini {
            font-size: 1rem !important;
          }
          .stat-label-mini {
            font-size: 0.5rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default TeacherAssessments;