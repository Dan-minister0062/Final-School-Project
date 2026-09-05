// src/components/dashboard/student/StudentAnnouncements.jsx
import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Table, Modal, Form, Row, Col, Alert, Nav, Tab, Spinner } from 'react-bootstrap';
import { 
  FaFileAlt, FaEye, FaCheck, FaTimes, FaSearch, FaSync, 
  FaSpinner, FaExclamationTriangle, FaDownload, FaFilePdf,
  FaFileWord, FaFileImage, FaFile, FaClock, FaUserGraduate,
  FaChalkboardTeacher, FaBook, FaCalendarAlt, FaInfoCircle,
  FaUser, FaEnvelope, FaIdCard, FaGraduationCap, FaUsers,
  FaCheckCircle, FaClock as FaClockIcon, FaPaperPlane,
  FaUpload, FaFilter, FaSort, FaArrowRight, FaArrowLeft,
  FaBell, FaFileExcel, FaFilePowerpoint, FaFileCode, FaStar,
  FaTrash, FaInbox, FaUserCheck, FaPlus, FaEdit, FaSave,
  FaTimesCircle, FaCheckDouble, FaComment, FaReply
} from 'react-icons/fa';
import { useLanguage } from '../../../context/LanguageContext';
import { useNotification } from '../../../hooks/useNotification';

// ===== HELPER FUNCTIONS =====
const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  return num.toString();
};

// ===== GET FILE ICON =====
const getFileIcon = (fileType) => {
  if (!fileType) return { icon: <FaFile className="text-secondary" style={{ fontSize: '2rem' }} />, color: '#6c757d' };
  const type = fileType.toLowerCase();
  if (type.includes('pdf')) return { icon: <FaFilePdf className="text-danger" style={{ fontSize: '2rem' }} />, color: '#dc3545' };
  if (type.includes('word') || type.includes('doc')) return { icon: <FaFileWord className="text-primary" style={{ fontSize: '2rem' }} />, color: '#007bff' };
  if (type.includes('image') || type.includes('jpg') || type.includes('png') || type.includes('gif') || type.includes('jpeg')) return { icon: <FaFileImage className="text-success" style={{ fontSize: '2rem' }} />, color: '#28a745' };
  if (type.includes('excel') || type.includes('xls') || type.includes('xlsx')) return { icon: <FaFileExcel className="text-success" style={{ fontSize: '2rem' }} />, color: '#28a745' };
  if (type.includes('powerpoint') || type.includes('ppt') || type.includes('pptx')) return { icon: <FaFilePowerpoint className="text-danger" style={{ fontSize: '2rem' }} />, color: '#dc3545' };
  if (type.includes('text')) return { icon: <FaFileCode className="text-warning" style={{ fontSize: '2rem' }} />, color: '#ffc107' };
  return { icon: <FaFile className="text-secondary" style={{ fontSize: '2rem' }} />, color: '#6c757d' };
};

// ===== GET FILE TYPE LABEL =====
const getFileTypeLabel = (fileType) => {
  if (!fileType) return 'Unknown';
  const type = fileType.toLowerCase();
  if (type.includes('pdf')) return 'PDF Document';
  if (type.includes('word') || type.includes('doc')) return 'Word Document';
  if (type.includes('image') || type.includes('jpg') || type.includes('png') || type.includes('gif') || type.includes('jpeg')) return 'Image';
  if (type.includes('excel') || type.includes('xls') || type.includes('xlsx')) return 'Excel Spreadsheet';
  if (type.includes('powerpoint') || type.includes('ppt') || type.includes('pptx')) return 'PowerPoint Presentation';
  if (type.includes('text')) return 'Text File';
  return fileType;
};

// ===== GET FILE EXTENSION =====
const getFileExtension = (fileName) => {
  if (!fileName) return '';
  const parts = fileName.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};

// ===== GET MIME TYPE =====
const getMimeType = (fileName, fileType) => {
  if (fileType && fileType.startsWith('data:')) {
    const match = fileType.match(/^data:([^;]+);/);
    if (match) return match[1];
  }
  
  if (fileType && fileType !== 'text/plain') {
    return fileType;
  }
  
  const ext = getFileExtension(fileName);
  const mimeMap = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'txt': 'text/plain',
  };
  return mimeMap[ext] || 'application/octet-stream';
};

// ===== GET CURRENT USER =====
const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  } catch {
    return null;
  }
};

const StudentAnnouncements = () => {
  const { isArabic } = useLanguage();
  const { notify } = useNotification();
  const [darkMode, setDarkMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Student's assessments (received from teacher via student_assessments)
  const [myAssessments, setMyAssessments] = useState([]);
  const [filteredAssessments, setFilteredAssessments] = useState([]);
  
  // Student's submissions
  const [mySubmissions, setMySubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemType, setSelectedItemType] = useState('assessment');
  
  // Submission modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submissionFilePreview, setSubmissionFilePreview] = useState(null);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  
  // Delete modal - for both submissions and assignments
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState('submission'); // 'submission' or 'assignment'
  const [deleting, setDeleting] = useState(false);

  // ===== ARABIC FONT STYLE =====
  const arabicFontStyle = {
    fontFamily: isArabic ? '"Hacen Tunisia", "Hacen Tunisia Bd", "Noto Sans Arabic", "Vazirmatn", "Traditional Arabic", "Arabic Typesetting", serif' : 'inherit',
    lineHeight: isArabic ? '1.8' : '1.6',
    letterSpacing: isArabic ? '0.5px' : '0px',
    fontSize: isArabic ? 'clamp(0.9rem, 1.1vw, 1.05rem)' : 'clamp(0.85rem, 1vw, 1rem)',
  };

  // ===== Check dark mode =====
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

  // ===== GET STUDENT ID =====
  const getStudentId = () => {
    const user = getCurrentUser();
    if (user && user.id) {
      return user.id;
    }
    const studentId = localStorage.getItem('studentId');
    if (studentId) {
      return studentId;
    }
    return 'student_1';
  };

  const getStudentName = () => {
    const user = getCurrentUser();
    if (user && user.name) {
      return user.name;
    }
    return 'Student';
  };

  // ===== LOAD DATA =====
  const loadData = () => {
    try {
      setLoading(true);
      
      const studentId = getStudentId();
      
      // 1. Load assessments from student_assessments (sent by teacher)
      const studentAssessments = JSON.parse(localStorage.getItem('student_assessments') || '[]');
      const myStudentAssessments = studentAssessments.filter(a => a.studentId === studentId);
      
      console.log('📝 Student assessments from student_assessments:', myStudentAssessments.length);
      
      // 2. Load student's submissions from school_submissions
      const allSubmissions = JSON.parse(localStorage.getItem('school_submissions') || '[]');
      const studentSubmissions = allSubmissions.filter(s => s.studentId === studentId);
      console.log('📤 Student submissions:', studentSubmissions.length);
      setMySubmissions(studentSubmissions);
      setFilteredSubmissions(studentSubmissions);
      
      // Enrich assessments with submission data
      const enrichedAssessments = myStudentAssessments.map(a => {
        // Find submission for this assessment
        const submission = studentSubmissions.find(s => s.assessmentId === a.assessmentId || s.assessmentId === a.id);
        return {
          ...a,
          id: a.assessmentId || a.id,
          assessmentId: a.assessmentId || a.id,
          status: a.status || 'pending',
          hasSubmitted: !!submission,
          submissionId: submission?.id || null,
          grade: a.grade || submission?.grade || null,
          remarks: a.remarks || submission?.remarks || null,
          isGraded: (a.grade !== null && a.grade !== undefined) || (submission?.grade !== null && submission?.grade !== undefined),
          submittedAt: submission?.submittedAt || a.submittedAt || null,
          submissionData: submission || null,
          gradedAt: a.gradedAt || submission?.gradedAt || null,
          gradedBy: a.gradedBy || submission?.gradedBy || null,
        };
      });
      
      setMyAssessments(enrichedAssessments);
      setFilteredAssessments(enrichedAssessments);

      setLoading(false);
    } catch (err) {
      console.error('Error loading student announcements:', err);
      setLoading(false);
    }
  };

  // ===== APPLY FILTERS =====
  useEffect(() => {
    // Filter assessments
    let filtered = [...myAssessments];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(a => 
        (a.title || '').toLowerCase().includes(term) ||
        (a.teacherName || '').toLowerCase().includes(term) ||
        (a.subject || '').toLowerCase().includes(term) ||
        (a.className || '').toLowerCase().includes(term)
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(a => a.status === statusFilter);
    }
    setFilteredAssessments(filtered);

    // Filter submissions
    let filteredSubs = [...mySubmissions];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredSubs = filteredSubs.filter(s => 
        (s.title || '').toLowerCase().includes(term) ||
        (s.teacherName || '').toLowerCase().includes(term) ||
        (s.subject || '').toLowerCase().includes(term)
      );
    }
    setFilteredSubmissions(filteredSubs);

  }, [myAssessments, mySubmissions, searchTerm, statusFilter]);

  // ===== SETUP =====
  useEffect(() => {
    loadData();

    const handleStorageChange = (e) => {
      if (e.key === "student_assessments" || 
          e.key === "school_submissions" ||
          e.key === "school_assessments") {
        loadData();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    const handleAssessmentSent = () => {
      loadData();
    };
    window.addEventListener("assessmentSent", handleAssessmentSent);

    const handleStudentAssessmentsUpdated = () => {
      loadData();
    };
    window.addEventListener("studentAssessmentsUpdated", handleStudentAssessmentsUpdated);

    const handleSubmissionChanged = () => {
      loadData();
    };
    window.addEventListener("submissionChanged", handleSubmissionChanged);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("assessmentSent", handleAssessmentSent);
      window.removeEventListener("studentAssessmentsUpdated", handleStudentAssessmentsUpdated);
      window.removeEventListener("submissionChanged", handleSubmissionChanged);
    };
  }, []);

  // ===== HANDLE REFRESH =====
  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
    setTimeout(() => {
      setRefreshing(false);
      notify(
        isArabic ? 'تم تحديث البيانات بنجاح' : 'Data refreshed successfully',
        'info'
      );
    }, 800);
  };

  // ===== GET TYPE LABEL =====
  const getTypeLabel = (type) => {
    const labels = {
      'homework': isArabic ? 'واجب منزلي' : 'Homework',
      'assignment': isArabic ? 'مشروع' : 'Assignment',
      'test': isArabic ? 'اختبار' : 'Test',
      'exam': isArabic ? 'امتحان' : 'Exam',
      'project': isArabic ? 'مشروع' : 'Project',
      'classwork': isArabic ? 'عمل صفي' : 'Classwork'
    };
    return labels[type] || type || 'Assessment';
  };

  // ===== GET STATUS BADGE =====
  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': 'warning',
      'sent_to_students': 'primary',
      'published': 'success',
      'closed': 'dark',
      'submitted': 'info',
      'graded': 'success',
      'pending_approval': 'warning',
      'approved': 'success',
      'rejected': 'danger',
      'draft': 'secondary'
    };
    return statusMap[status] || 'secondary';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'pending': isArabic ? 'بانتظار' : 'Pending',
      'sent_to_students': isArabic ? 'مرسل' : 'Sent',
      'published': isArabic ? 'منشور' : 'Published',
      'closed': isArabic ? 'مغلق' : 'Closed',
      'submitted': isArabic ? 'مقدم' : 'Submitted',
      'graded': isArabic ? 'مصحح' : 'Graded',
      'pending_approval': isArabic ? 'بانتظار الموافقة' : 'Pending Approval',
      'approved': isArabic ? 'موافق' : 'Approved',
      'rejected': isArabic ? 'مرفوض' : 'Rejected',
      'draft': isArabic ? 'مسودة' : 'Draft'
    };
    return labels[status] || status;
  };

  // ===== CHECK IF SUBMISSION EXISTS =====
  const hasSubmitted = (assessmentId) => {
    return mySubmissions.some(s => s.assessmentId === assessmentId);
  };

  // ===== GET SUBMISSION STATUS =====
  const getSubmissionStatus = (assessmentId) => {
    const submission = mySubmissions.find(s => s.assessmentId === assessmentId);
    if (!submission) return null;
    return submission.status || 'submitted';
  };

  // ===== GET SUBMISSION GRADE =====
  const getSubmissionGrade = (assessmentId) => {
    // Check from submissions first
    const submission = mySubmissions.find(s => s.assessmentId === assessmentId);
    if (submission && (submission.grade !== undefined && submission.grade !== null)) {
      return submission.grade;
    }
    // Check from student_assessments
    const studentAssess = myAssessments.find(a => a.assessmentId === assessmentId || a.id === assessmentId);
    if (studentAssess && studentAssess.grade !== undefined && studentAssess.grade !== null) {
      return studentAssess.grade;
    }
    return null;
  };

  // ===== GET SUBMISSION REMARKS =====
  const getSubmissionRemarks = (assessmentId) => {
    // Check from submissions first
    const submission = mySubmissions.find(s => s.assessmentId === assessmentId);
    if (submission && submission.remarks) {
      return submission.remarks;
    }
    // Check from student_assessments
    const studentAssess = myAssessments.find(a => a.assessmentId === assessmentId || a.id === assessmentId);
    if (studentAssess && studentAssess.remarks) {
      return studentAssess.remarks;
    }
    return null;
  };

  // ===== GET GRADED BY =====
  const getGradedBy = (assessmentId) => {
    const submission = mySubmissions.find(s => s.assessmentId === assessmentId);
    if (submission && submission.gradedBy) {
      return submission.gradedBy;
    }
    const studentAssess = myAssessments.find(a => a.assessmentId === assessmentId || a.id === assessmentId);
    if (studentAssess && studentAssess.gradedBy) {
      return studentAssess.gradedBy;
    }
    return null;
  };

  // ===== HANDLE DOWNLOAD FILE =====
  const handleDownloadFile = (item) => {
    if (!item) {
      notify(
        isArabic ? 'لا يوجد ملف للتحميل' : 'No file to download',
        'warning'
      );
      return;
    }

    try {
      // Try multiple possible content sources
      let content = item.attachment || item.content || item.fileContent || '';
      let fileName = item.attachmentName || item.fileName || 'file';
      let fileType = item.attachmentType || item.fileType || 'text/plain';

      // If content is not found, try to get from localStorage by id
      if (!content && item.id) {
        try {
          const allSubmissions = JSON.parse(localStorage.getItem('school_submissions') || '[]');
          const found = allSubmissions.find(s => s.id === item.id);
          if (found) {
            content = found.attachment || found.content || found.fileContent || '';
            fileName = found.attachmentName || found.fileName || fileName;
            fileType = found.attachmentType || found.fileType || fileType;
          }
        } catch (e) {}
      }

      if (!content) {
        notify(
          isArabic ? '❌ لا يوجد ملف للتحميل' : '❌ No file to download',
          'warning'
        );
        return;
      }
      
      const mimeType = getMimeType(fileName, fileType);
      
      if (content && typeof content === 'string' && content.startsWith('data:')) {
        const base64Data = content.split(',')[1] || content;
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        notify(
          isArabic ? '✅ تم تحميل الملف بنجاح' : '✅ File downloaded successfully',
          'success'
        );
        return;
      }
      
      const blob = new Blob([content || 'No content available'], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      notify(
        isArabic ? '✅ تم تحميل الملف بنجاح' : '✅ File downloaded successfully',
        'success'
      );
      
    } catch (err) {
      console.error('Error downloading file:', err);
      notify(
        isArabic ? '❌ حدث خطأ أثناء التحميل' : '❌ Error downloading file',
        'error'
      );
    }
  };

  // ===== HANDLE DELETE ASSIGNMENT =====
  const handleDeleteAssignmentClick = (assessment) => {
    setItemToDelete(assessment);
    setDeleteType('assignment');
    setShowDeleteModal(true);
  };

  // ===== HANDLE DELETE SUBMISSION =====
  const handleDeleteSubmissionClick = (submission) => {
    setItemToDelete(submission);
    setDeleteType('submission');
    setShowDeleteModal(true);
  };

  // ===== CONFIRM DELETE =====
  const confirmDelete = () => {
    if (!itemToDelete) return;
    
    setDeleting(true);
    try {
      const studentId = getStudentId();
      
      if (deleteType === 'assignment') {
        // Delete assignment from student_assessments
        const studentAssessments = JSON.parse(localStorage.getItem('student_assessments') || '[]');
        const updatedAssessments = studentAssessments.filter(a => 
          !(a.assessmentId === itemToDelete.assessmentId && a.studentId === studentId)
        );
        localStorage.setItem('student_assessments', JSON.stringify(updatedAssessments));
        
        // Also remove from student_assessments_by_student if exists
        try {
          const studentAssessmentsByStudent = JSON.parse(localStorage.getItem('student_assessments_by_student') || '{}');
          if (studentAssessmentsByStudent[studentId]) {
            studentAssessmentsByStudent[studentId] = studentAssessmentsByStudent[studentId].filter(a => 
              a.assessmentId !== itemToDelete.assessmentId
            );
            localStorage.setItem('student_assessments_by_student', JSON.stringify(studentAssessmentsByStudent));
          }
        } catch (e) {}
        
        // If there's a submission for this assignment, delete it too
        const allSubmissions = JSON.parse(localStorage.getItem('school_submissions') || '[]');
        const updatedSubmissions = allSubmissions.filter(s => 
          !(s.assessmentId === itemToDelete.assessmentId && s.studentId === studentId)
        );
        localStorage.setItem('school_submissions', JSON.stringify(updatedSubmissions));
        
        // Remove from local state
        setMyAssessments(prev => prev.filter(a => a.assessmentId !== itemToDelete.assessmentId));
        setFilteredAssessments(prev => prev.filter(a => a.assessmentId !== itemToDelete.assessmentId));
        setMySubmissions(prev => prev.filter(s => s.assessmentId !== itemToDelete.assessmentId));
        setFilteredSubmissions(prev => prev.filter(s => s.assessmentId !== itemToDelete.assessmentId));
        
        notify(
          isArabic ? `✅ تم حذف التقييم "${itemToDelete.title}" بنجاح` : `✅ Assessment "${itemToDelete.title}" deleted successfully`,
          'success'
        );
        
      } else {
        // Delete submission
        const allSubmissions = JSON.parse(localStorage.getItem('school_submissions') || '[]');
        const updatedSubmissions = allSubmissions.filter(s => s.id !== itemToDelete.id);
        localStorage.setItem('school_submissions', JSON.stringify(updatedSubmissions));
        
        // Update student_assessments status back to pending
        const studentAssessments = JSON.parse(localStorage.getItem('student_assessments') || '[]');
        const assessIndex = studentAssessments.findIndex(a => 
          a.assessmentId === itemToDelete.assessmentId && a.studentId === studentId
        );
        if (assessIndex !== -1) {
          studentAssessments[assessIndex].status = 'pending';
          studentAssessments[assessIndex].submittedAt = null;
          studentAssessments[assessIndex].grade = null;
          studentAssessments[assessIndex].remarks = null;
          localStorage.setItem('student_assessments', JSON.stringify(studentAssessments));
        }
        
        // Also remove any admin notifications related to this submission
        const adminNotifications = JSON.parse(localStorage.getItem('admin_notifications') || '[]');
        const updatedAdminNotifs = adminNotifications.filter(n => n.submissionId !== itemToDelete.id);
        localStorage.setItem('admin_notifications', JSON.stringify(updatedAdminNotifs));
        
        // Remove from admin seen submissions
        const seenSubmissions = JSON.parse(localStorage.getItem('admin_seen_submissions') || '[]');
        const updatedSeen = seenSubmissions.filter(s => s.submissionId !== itemToDelete.id);
        localStorage.setItem('admin_seen_submissions', JSON.stringify(updatedSeen));
        
        // Remove from local state
        setMySubmissions(prev => prev.filter(s => s.id !== itemToDelete.id));
        setFilteredSubmissions(prev => prev.filter(s => s.id !== itemToDelete.id));
        
        // Update the assessment status in local state
        setMyAssessments(prev => prev.map(a => {
          if (a.assessmentId === itemToDelete.assessmentId) {
            return { ...a, status: 'pending', hasSubmitted: false, submissionData: null, grade: null, remarks: null, isGraded: false };
          }
          return a;
        }));
        setFilteredAssessments(prev => prev.map(a => {
          if (a.assessmentId === itemToDelete.assessmentId) {
            return { ...a, status: 'pending', hasSubmitted: false, submissionData: null, grade: null, remarks: null, isGraded: false };
          }
          return a;
        }));
        
        notify(
          isArabic ? '✅ تم حذف التقديم بنجاح' : '✅ Submission deleted successfully',
          'success'
        );
      }
      
      setShowDeleteModal(false);
      setItemToDelete(null);
      setDeleting(false);
      loadData();
      
      window.dispatchEvent(new CustomEvent('submissionChanged', { 
        detail: { action: 'delete', id: itemToDelete.id || itemToDelete.assessmentId }
      }));
      
    } catch (err) {
      console.error('Error deleting:', err);
      notify(
        isArabic ? '❌ حدث خطأ أثناء الحذف' : '❌ Error deleting',
        'error'
      );
      setDeleting(false);
    }
  };

  // ===== HANDLE SUBMIT ASSESSMENT =====
  const handleSubmitClick = (assessment) => {
    setSelectedAssessment(assessment);
    setSubmissionText('');
    setSubmissionFile(null);
    setSubmissionFilePreview(null);
    setShowSubmitModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        notify(
          isArabic ? 'حجم الملف كبير جداً. الحد الأقصى هو 10 ميجابايت' : 'File size is too large. Maximum is 10MB',
          'error'
        );
        return;
      }
      setSubmissionFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSubmissionFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const confirmSubmit = () => {
    if (!selectedAssessment) return;
    
    setSubmitting(true);
    try {
      const studentId = getStudentId();
      const studentName = getStudentName();
      
      // Create submission
      const submissions = JSON.parse(localStorage.getItem('school_submissions') || '[]');
      
      const newSubmission = {
        id: `SUB_${Date.now()}`,
        assessmentId: selectedAssessment.assessmentId || selectedAssessment.id,
        studentId: studentId,
        studentName: studentName,
        teacherId: selectedAssessment.teacherId,
        teacherName: selectedAssessment.teacherName,
        title: selectedAssessment.title,
        subject: selectedAssessment.subject,
        type: selectedAssessment.type,
        className: selectedAssessment.className,
        content: submissionText || '',
        status: 'submitted',
        submittedAt: new Date().toISOString(),
        forwardedToTeacher: false,
        forwardedAt: null,
        fileName: submissionFile ? submissionFile.name : null,
        fileType: submissionFile ? submissionFile.type : null,
        attachment: submissionFilePreview || null,
        grade: null,
        remarks: null,
        gradedAt: null,
        gradedBy: null
      };
      
      submissions.push(newSubmission);
      localStorage.setItem('school_submissions', JSON.stringify(submissions));
      
      // Update student_assessments to reflect submission
      const studentAssessments = JSON.parse(localStorage.getItem('student_assessments') || '[]');
      const assessIndex = studentAssessments.findIndex(a => 
        (a.assessmentId === selectedAssessment.assessmentId || a.id === selectedAssessment.id) && 
        a.studentId === studentId
      );
      if (assessIndex !== -1) {
        studentAssessments[assessIndex].status = 'submitted';
        studentAssessments[assessIndex].submittedAt = new Date().toISOString();
        localStorage.setItem('student_assessments', JSON.stringify(studentAssessments));
      }
      
      // Create notification for teacher
      const teacherNotifications = JSON.parse(localStorage.getItem('teacher_notifications') || '[]');
      teacherNotifications.push({
        id: `TEACH_NOTIF_${Date.now()}`,
        type: 'new_submission',
        title: isArabic ? `📝 تقديم جديد من طالب` : `📝 New submission from student`,
        message: isArabic 
          ? `الطالب ${studentName} قدم تقييم "${selectedAssessment.title}"`
          : `Student ${studentName} submitted "${selectedAssessment.title}"`,
        studentId: studentId,
        studentName: studentName,
        assessmentId: selectedAssessment.assessmentId || selectedAssessment.id,
        assessmentTitle: selectedAssessment.title,
        submissionId: newSubmission.id,
        read: false,
        createdAt: new Date().toISOString(),
        link: `/dashboard/teacher/assessments`
      });
      localStorage.setItem('teacher_notifications', JSON.stringify(teacherNotifications));
      
      // Also create notification for admin (so admin can see submission)
      const adminNotifications = JSON.parse(localStorage.getItem('admin_notifications') || '[]');
      adminNotifications.push({
        id: `ADMIN_NOTIF_${Date.now()}`,
        type: 'student_submission',
        title: isArabic ? `📝 تقديم جديد من طالب` : `📝 New student submission`,
        message: isArabic 
          ? `الطالب ${studentName} قدم تقييم "${selectedAssessment.title}" للمعلم ${selectedAssessment.teacherName}`
          : `Student ${studentName} submitted "${selectedAssessment.title}" to teacher ${selectedAssessment.teacherName}`,
        studentId: studentId,
        studentName: studentName,
        teacherId: selectedAssessment.teacherId,
        teacherName: selectedAssessment.teacherName,
        assessmentId: selectedAssessment.assessmentId || selectedAssessment.id,
        assessmentTitle: selectedAssessment.title,
        submissionId: newSubmission.id,
        read: false,
        createdAt: new Date().toISOString(),
        link: `/dashboard/admin/assessments`
      });
      localStorage.setItem('admin_notifications', JSON.stringify(adminNotifications));
      
      // Update admin seen submissions
      const seenSubmissions = JSON.parse(localStorage.getItem('admin_seen_submissions') || '[]');
      seenSubmissions.push({
        submissionId: newSubmission.id,
        seenAt: new Date().toISOString()
      });
      localStorage.setItem('admin_seen_submissions', JSON.stringify(seenSubmissions));
      
      notify(
        isArabic ? '✅ تم تقديم التقييم بنجاح' : '✅ Assessment submitted successfully',
        'success'
      );
      
      setShowSubmitModal(false);
      setSubmitting(false);
      loadData();
      
      window.dispatchEvent(new CustomEvent('submissionChanged', { 
        detail: { submission: newSubmission }
      }));
      window.dispatchEvent(new CustomEvent('notificationAdded', { 
        detail: { type: 'new_submission', submission: newSubmission }
      }));
      window.dispatchEvent(new CustomEvent('studentSubmission', { 
        detail: { submission: newSubmission }
      }));
      
    } catch (err) {
      console.error('Error submitting assessment:', err);
      notify(
        isArabic ? '❌ حدث خطأ أثناء التقديم' : '❌ Error submitting assessment',
        'error'
      );
      setSubmitting(false);
    }
  };

  // ===== FORMAT DATE =====
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch {
      return dateString;
    }
  };

  // ===== GET STATUS SUMMARY =====
  const getStats = () => {
    const total = myAssessments.length;
    const pending = myAssessments.filter(a => a.status === 'pending' || a.status === 'sent_to_students').length;
    const submitted = mySubmissions.filter(s => s.status === 'submitted' || s.status === 'pending').length;
    const graded = mySubmissions.filter(s => s.status === 'graded' || (s.grade !== null && s.grade !== undefined)).length;
    
    return { total, pending, submitted, graded };
  };

  // ===== RENDER LOADING =====
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

  const stats = getStats();

  return (
    <div className="student-announcements" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* ===== PAGE HEADER ===== */}
      <div className="d-flex flex-wrap flex-sm-nowrap justify-content-between align-items-center gap-2 gap-md-3 mb-3 mb-md-4">
        <div className="flex-grow-1 min-width-0">
          <div className="d-flex align-items-center gap-2">
            <h4 className="fw-bold mb-0 mb-sm-1" style={{ 
              ...arabicFontStyle, 
              color: '#4a9eff', 
              fontSize: isArabic ? 'clamp(1rem, 2vw, 1.5rem)' : 'clamp(0.95rem, 1.8vw, 1.4rem)' 
            }}>
              <FaFileAlt className="me-2" /> 
              {isArabic ? 'تقييماتي' : 'My Assessments'}
            </h4>
          </div>
          <p className="text-muted mb-0 d-none d-sm-block" style={{ 
            ...arabicFontStyle, 
            fontSize: isArabic ? 'clamp(0.8rem, 1vw, 0.95rem)' : 'clamp(0.75rem, 0.9vw, 0.9rem)' 
          }}>
            {isArabic 
              ? `عرض وإدارة التقييمات والتقديمات الخاصة بك`
              : `View and manage your assessments and submissions`}
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
              {formatNumber(stats.total)}
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
            <div className="stat-number-mini" style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f39c12' }}>
              {formatNumber(stats.pending)}
            </div>
            <div className="stat-label-mini" style={{ fontSize: '0.7rem', color: '#6c757d' }}>
              {isArabic ? 'بانتظار التقديم' : 'Pending Submission'}
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
              {formatNumber(stats.submitted)}
            </div>
            <div className="stat-label-mini" style={{ fontSize: '0.7rem', color: '#6c757d' }}>
              {isArabic ? 'تم التقديم' : 'Submitted'}
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
              {formatNumber(stats.graded)}
            </div>
            <div className="stat-label-mini" style={{ fontSize: '0.7rem', color: '#6c757d' }}>
              {isArabic ? 'مصحح' : 'Graded'}
            </div>
          </div>
        </Col>
      </Row>

      {/* ===== SEARCH AND FILTERS ===== */}
      <Card className="modern-card mb-4" style={{ background: darkMode ? '#1a1a2e' : '#ffffff', borderColor: darkMode ? '#2d2d44' : '#e9ecef' }}>
        <Card.Body className="p-3 p-md-4">
          <Row className="g-2 g-md-3">
            <Col xs={12} md={8}>
              <div className="position-relative">
                <FaSearch className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                <Form.Control
                  type="text"
                  placeholder={isArabic ? 'بحث عن تقييم، معلم، مادة...' : 'Search assessments, teachers, subjects...'}
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
            <Col xs={6} md={3}>
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
                <option value="pending">{isArabic ? 'بانتظار' : 'Pending'}</option>
                <option value="sent_to_students">{isArabic ? 'مرسل' : 'Sent'}</option>
                <option value="submitted">{isArabic ? 'مقدم' : 'Submitted'}</option>
                <option value="graded">{isArabic ? 'مصحح' : 'Graded'}</option>
                <option value="closed">{isArabic ? 'مغلق' : 'Closed'}</option>
              </Form.Select>
            </Col>
            <Col xs={6} md={1}>
              <Button 
                variant="outline-secondary" 
                size="sm" 
                className="w-100"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                style={{ ...arabicFontStyle, borderRadius: '12px' }}
              >
                <FaFilter className="me-1" /> {isArabic ? 'مسح' : 'Clear'}
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* ===== ASSESSMENTS LIST ===== */}
      {filteredAssessments.length === 0 ? (
        <div className="text-center py-5">
          <FaFileAlt size={48} className="text-muted opacity-25 mb-3" />
          <h5 style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
            {isArabic ? 'لا توجد تقييمات' : 'No assessments found'}
          </h5>
          <p className="text-muted" style={arabicFontStyle}>
            {isArabic 
              ? 'لم يتم إرسال أي تقييمات إليك بعد' 
              : 'No assessments have been sent to you yet'}
          </p>
        </div>
      ) : (
        <div className="table-responsive">
          <Table hover className="assessment-table" style={arabicFontStyle}>
            <thead style={{ background: darkMode ? '#0d1117' : '#f8f9fa' }}>
              <tr>
                <th style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{isArabic ? 'المعلم' : 'Teacher'}</th>
                <th style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{isArabic ? 'العنوان' : 'Title'}</th>
                <th style={{ color: darkMode ? '#e9ecef' : '#212529' }} className="d-none d-md-table-cell">{isArabic ? 'النوع' : 'Type'}</th>
                <th style={{ color: darkMode ? '#e9ecef' : '#212529' }} className="d-none d-sm-table-cell">{isArabic ? 'المادة' : 'Subject'}</th>
                <th style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{isArabic ? 'الحالة' : 'Status'}</th>
                <th style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{isArabic ? 'تقييمك' : 'Your Grade'}</th>
                <th style={{ color: darkMode ? '#e9ecef' : '#212529' }} className="text-center">{isArabic ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssessments.map((assessment) => {
                const submitted = hasSubmitted(assessment.assessmentId || assessment.id);
                const grade = getSubmissionGrade(assessment.assessmentId || assessment.id);
                const remarks = getSubmissionRemarks(assessment.assessmentId || assessment.id);
                const isGraded = grade !== null && grade !== undefined;
                const status = assessment.status || 'pending';
                const submission = mySubmissions.find(s => s.assessmentId === assessment.assessmentId || s.assessmentId === assessment.id);
                const showDelete = submitted && submission;
                const gradedBy = getGradedBy(assessment.assessmentId || assessment.id);
                
                return (
                  <tr key={assessment.id || assessment.assessmentId}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <FaChalkboardTeacher className="text-primary" />
                        <span style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                          {assessment.teacherName || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                        {assessment.title || 'Untitled'}
                      </div>
                      {assessment.attachmentName && (
                        <Badge bg="info" style={{ fontSize: '0.6rem' }}>
                          <FaFile className="me-1" size={10} />
                          {assessment.attachmentName}
                        </Badge>
                      )}
                    </td>
                    <td className="d-none d-md-table-cell">{getTypeLabel(assessment.type)}</td>
                    <td className="d-none d-sm-table-cell">{assessment.subject || 'N/A'}</td>
                    <td>
                      <Badge bg={getStatusBadge(status)}>
                        {getStatusLabel(status)}
                      </Badge>
                      {submitted && (
                        <Badge bg={isGraded ? 'success' : 'info'} className="ms-1" style={{ fontSize: '0.6rem' }}>
                          {isGraded ? '✅' : '📤'} {isGraded ? (isArabic ? 'مصحح' : 'Graded') : (isArabic ? 'مقدم' : 'Submitted')}
                        </Badge>
                      )}
                    </td>
                    <td>
                      {isGraded ? (
                        <div>
                          <span className="fw-bold" style={{ color: '#2ecc71' }}>
                            {formatNumber(grade)}
                          </span>
                          {remarks && (
                            <div className="text-muted small" style={{ fontSize: '0.65rem', marginTop: '2px' }}>
                              <FaComment className="me-1" size={10} />
                              <span>{remarks}</span>
                            </div>
                          )}
                          {gradedBy && (
                            <div className="text-muted small" style={{ fontSize: '0.55rem' }}>
                              {isArabic ? 'بواسطة: ' : 'By: '}{gradedBy}
                            </div>
                          )}
                        </div>
                      ) : submitted ? (
                        <Badge bg="info" style={{ fontSize: '0.7rem' }}>
                          <FaClock className="me-1" size={10} />
                          {isArabic ? 'بانتظار التصحيح' : 'Pending Grading'}
                        </Badge>
                      ) : (
                        <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                          {isArabic ? 'لم يتم التقديم' : 'Not Submitted'}
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="d-flex gap-1 justify-content-center flex-wrap">
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          className="action-btn"
                          onClick={() => {
                            setSelectedItem(assessment);
                            setSelectedItemType('assessment');
                            setShowViewModal(true);
                          }}
                          title={isArabic ? 'عرض التفاصيل' : 'View Details'}
                        >
                          <FaEye size={14} />
                        </Button>
                        {assessment.attachmentName && (
                          <Button 
                            variant="outline-info" 
                            size="sm"
                            className="action-btn"
                            onClick={() => handleDownloadFile(assessment)}
                            title={isArabic ? 'تحميل' : 'Download'}
                          >
                            <FaDownload size={14} />
                          </Button>
                        )}
                        {!submitted && status !== 'closed' && status !== 'graded' && (
                          <Button 
                            variant="outline-success" 
                            size="sm"
                            className="action-btn"
                            onClick={() => handleSubmitClick(assessment)}
                            title={isArabic ? 'تقديم' : 'Submit'}
                          >
                            <FaPaperPlane size={14} />
                          </Button>
                        )}
                        {/* Delete Assignment Button - Always visible for all assignments */}
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          className="action-btn"
                          onClick={() => handleDeleteAssignmentClick(assessment)}
                          title={isArabic ? 'حذف التقييم' : 'Delete Assessment'}
                        >
                          <FaTrash size={14} />
                        </Button>
                        {/* Delete Submission Button - only if submitted */}
                        {showDelete && (
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            className="action-btn"
                            onClick={() => handleDeleteSubmissionClick(submission)}
                            title={isArabic ? 'حذف التقديم' : 'Delete Submission'}
                          >
                            <FaTimes size={14} />
                          </Button>
                        )}
                        {submitted && (
                          <Badge bg={isGraded ? 'success' : 'warning'} style={{ fontSize: '0.6rem', padding: '4px 8px' }}>
                            {isGraded ? (
                              <><FaCheckCircle className="me-1" size={10} /> {formatNumber(grade)}</>
                            ) : (
                              <><FaClock className="me-1" size={10} /> {isArabic ? 'قيد المراجعة' : 'In Review'}</>
                            )}
                          </Badge>
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

      {/* ===== VIEW DETAILS MODAL (With Remarks) ===== */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg" centered className="modern-modal">
        <Modal.Header closeButton className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Modal.Title style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
            <FaEye className="me-2 text-primary" />
            {isArabic ? 'تفاصيل التقييم' : 'Assessment Details'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? '#0d1117' : 'white' }}>
          {selectedItem && (
            <div>
              {/* Teacher Info */}
              <div className="teacher-info p-3 rounded-3 mb-3" style={{
                background: darkMode ? '#2d2d44' : '#f8f9fa',
                border: `1px solid ${darkMode ? '#3d3d5c' : '#e9ecef'}`,
                borderRadius: '12px'
              }}>
                <Row>
                  <Col md={6}>
                    <div className="d-flex align-items-center gap-2">
                      <FaChalkboardTeacher className="text-primary" />
                      <span className="fw-semibold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                        {isArabic ? 'المعلم: ' : 'Teacher: '}
                      </span>
                      <span style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                        {selectedItem.teacherName || 'Unknown'}
                      </span>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="d-flex align-items-center gap-2">
                      <FaBook className="text-success" />
                      <span className="fw-semibold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                        {isArabic ? 'المادة: ' : 'Subject: '}
                      </span>
                      <span style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                        {selectedItem.subject || 'N/A'}
                      </span>
                    </div>
                  </Col>
                </Row>
                <Row className="mt-2">
                  <Col md={6}>
                    <div className="d-flex align-items-center gap-2">
                      <FaGraduationCap className="text-info" />
                      <span className="fw-semibold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                        {isArabic ? 'الفصل: ' : 'Class: '}
                      </span>
                      <span style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                        {selectedItem.className || 'N/A'}
                      </span>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="d-flex align-items-center gap-2">
                      <FaFileAlt className="text-primary" />
                      <span className="fw-semibold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                        {isArabic ? 'النوع: ' : 'Type: '}
                      </span>
                      <span style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                        {getTypeLabel(selectedItem.type)}
                      </span>
                    </div>
                  </Col>
                </Row>
                {selectedItem.totalMarks && (
                  <Row className="mt-2">
                    <Col md={6}>
                      <div className="d-flex align-items-center gap-2">
                        <FaStar className="text-warning" />
                        <span className="fw-semibold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                          {isArabic ? 'الدرجة الكلية: ' : 'Total Marks: '}
                        </span>
                        <span style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                          {selectedItem.totalMarks}
                        </span>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="d-flex align-items-center gap-2">
                        <FaClock className="text-warning" />
                        <span className="fw-semibold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                          {isArabic ? 'تاريخ التسليم: ' : 'Due Date: '}
                        </span>
                        <span style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                          {selectedItem.dueDate ? new Date(selectedItem.dueDate).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </Col>
                  </Row>
                )}
                {/* Submission info with Remarks */}
                {selectedItemType === 'assessment' && (
                  <>
                    {hasSubmitted(selectedItem.assessmentId || selectedItem.id) && (
                      <Row className="mt-2">
                        <Col md={12}>
                          <div className="d-flex align-items-center gap-2">
                            <FaPaperPlane className="text-success" />
                            <span className="fw-semibold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                              {isArabic ? 'حالة التقديم: ' : 'Submission Status: '}
                            </span>
                            <Badge bg={getSubmissionGrade(selectedItem.assessmentId || selectedItem.id) !== null ? 'success' : 'info'}>
                              {getSubmissionGrade(selectedItem.assessmentId || selectedItem.id) !== null 
                                ? (isArabic ? '✅ مصحح' : '✅ Graded')
                                : (isArabic ? '📤 مقدم' : '📤 Submitted')}
                            </Badge>
                            {getSubmissionGrade(selectedItem.assessmentId || selectedItem.id) !== null && (
                              <span className="fw-bold" style={{ color: '#2ecc71' }}>
                                {formatNumber(getSubmissionGrade(selectedItem.assessmentId || selectedItem.id))}
                              </span>
                            )}
                          </div>
                          {/* Display Remarks if graded */}
                          {selectedItem.isGraded && selectedItem.remarks && (
                            <div className="mt-2 p-2 rounded-3" style={{
                              background: darkMode ? '#2d2d44' : '#e8f5e9',
                              border: `1px solid ${darkMode ? '#3d3d5c' : '#c8e6c9'}`,
                              borderRadius: '8px'
                            }}>
                              <div className="d-flex align-items-start gap-2">
                                <FaComment className="text-success mt-1" />
                                <div>
                                  <span className="fw-semibold" style={{ color: darkMode ? '#e9ecef' : '#2e7d32' }}>
                                    {isArabic ? '📝 ملاحظات المعلم:' : '📝 Teacher\'s Remarks:'}
                                  </span>
                                  <p className="mb-0 mt-1" style={{ 
                                    color: darkMode ? '#e9ecef' : '#1b5e20',
                                    ...arabicFontStyle,
                                    whiteSpace: 'pre-wrap'
                                  }}>
                                    {selectedItem.remarks}
                                  </p>
                                  {selectedItem.gradedBy && (
                                    <div className="text-muted small mt-1" style={{ fontSize: '0.6rem' }}>
                                      {isArabic ? 'بواسطة: ' : 'By: '}{selectedItem.gradedBy}
                                      {selectedItem.gradedAt && ` • ${formatDate(selectedItem.gradedAt)}`}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </Col>
                      </Row>
                    )}
                    {!hasSubmitted(selectedItem.assessmentId || selectedItem.id) && 
                     selectedItem.status !== 'closed' && 
                     selectedItem.status !== 'graded' && (
                      <Row className="mt-2">
                        <Col md={12}>
                          <Button 
                            variant="success" 
                            size="sm"
                            onClick={() => {
                              setShowViewModal(false);
                              handleSubmitClick(selectedItem);
                            }}
                            style={{ ...arabicFontStyle, borderRadius: '10px' }}
                          >
                            <FaPaperPlane className="me-1" /> {isArabic ? 'تقديم الآن' : 'Submit Now'}
                          </Button>
                        </Col>
                      </Row>
                    )}
                  </>
                )}
              </div>

              {/* Description */}
              {(selectedItem.description || selectedItem.content) && (
                <div className="description-section mb-3">
                  <h6 className="fw-bold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                    {isArabic ? 'الوصف:' : 'Description:'}
                  </h6>
                  <div className="p-3 rounded-3" style={{
                    background: darkMode ? '#2d2d44' : '#f8f9fa',
                    border: `1px solid ${darkMode ? '#3d3d5c' : '#e9ecef'}`,
                    borderRadius: '12px',
                    ...arabicFontStyle,
                    color: darkMode ? '#e9ecef' : '#212529',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {selectedItem.description || selectedItem.content}
                  </div>
                </div>
              )}

              {/* Attachment - Complete file with download and preview */}
              {selectedItem.attachmentName && (
                <div className="attachment-section mb-3">
                  <h6 className="fw-bold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                    {isArabic ? 'المرفق:' : 'Attachment:'}
                  </h6>
                  <div className="p-3 rounded-3 d-flex align-items-center gap-3 flex-wrap" style={{
                    background: darkMode ? '#2d2d44' : '#f8f9fa',
                    border: `1px solid ${darkMode ? '#3d3d5c' : '#e9ecef'}`,
                    borderRadius: '12px'
                  }}>
                    {getFileIcon(selectedItem.attachmentType).icon}
                    <div className="flex-grow-1">
                      <div className="fw-semibold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                        {selectedItem.attachmentName}
                      </div>
                      <div className="text-muted small">
                        {getFileTypeLabel(selectedItem.attachmentType)} • 
                        {selectedItem.attachmentSize ? ` ${(selectedItem.attachmentSize / 1024).toFixed(1)} KB` : ''}
                      </div>
                    </div>
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={() => handleDownloadFile(selectedItem)}
                      style={{ ...arabicFontStyle, borderRadius: '10px' }}
                    >
                      <FaDownload className="me-1" />
                      {isArabic ? 'تحميل الملف' : 'Download File'}
                    </Button>
                  </div>
                  {/* File preview for images */}
                  {selectedItem.attachment && selectedItem.attachmentType && 
                   (selectedItem.attachmentType.includes('image') || selectedItem.attachmentType.includes('jpg') || 
                    selectedItem.attachmentType.includes('png') || selectedItem.attachmentType.includes('jpeg')) && (
                    <div className="mt-2 p-2 rounded-3" style={{
                      background: darkMode ? '#2d2d44' : '#f8f9fa',
                      border: `1px solid ${darkMode ? '#3d3d5c' : '#e9ecef'}`,
                      borderRadius: '12px',
                      textAlign: 'center'
                    }}>
                      <img 
                        src={selectedItem.attachment} 
                        alt="Attachment preview" 
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '300px',
                          borderRadius: '8px',
                          objectFit: 'contain'
                        }} 
                      />
                    </div>
                  )}
                  {/* PDF preview */}
                  {selectedItem.attachment && selectedItem.attachmentType && 
                   selectedItem.attachmentType.includes('pdf') && (
                    <div className="mt-2 p-2 rounded-3" style={{
                      background: darkMode ? '#2d2d44' : '#f8f9fa',
                      border: `1px solid ${darkMode ? '#3d3d5c' : '#e9ecef'}`,
                      borderRadius: '12px'
                    }}>
                      <div className="text-center">
                        <FaFilePdf size={48} className="text-danger mb-2" />
                        <p className="text-muted small">
                          {isArabic ? 'ملف PDF - اضغط على زر التحميل لفتحه' : 'PDF file - Click download to open'}
                        </p>
                        <Button 
                          variant="danger" 
                          size="sm"
                          onClick={() => handleDownloadFile(selectedItem)}
                          style={{ ...arabicFontStyle, borderRadius: '10px' }}
                        >
                          <FaFilePdf className="me-1" /> {isArabic ? 'فتح PDF' : 'Open PDF'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Student's own submission file (if submitted) */}
              {selectedItemType === 'assessment' && selectedItem.submissionData && (
                <div className="my-submission-section mb-3">
                  <h6 className="fw-bold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                    <FaPaperPlane className="me-2 text-success" />
                    {isArabic ? 'تقديمي' : 'My Submission'}
                    {selectedItem.submissionData && (
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        className="ms-2"
                        onClick={() => handleDeleteSubmissionClick(selectedItem.submissionData)}
                        title={isArabic ? 'حذف التقديم' : 'Delete Submission'}
                        style={{ ...arabicFontStyle, borderRadius: '8px' }}
                      >
                        <FaTrash size={12} className="me-1" /> {isArabic ? 'حذف' : 'Delete'}
                      </Button>
                    )}
                  </h6>
                  <div className="p-3 rounded-3" style={{
                    background: darkMode ? '#2d2d44' : '#f8f9fa',
                    border: `1px solid ${darkMode ? '#3d3d5c' : '#e9ecef'}`,
                    borderRadius: '12px'
                  }}>
                    {selectedItem.submissionData.content && (
                      <div className="mb-2 p-2 rounded-3" style={{
                        background: darkMode ? '#1a1a2e' : '#ffffff',
                        border: `1px solid ${darkMode ? '#3d3d5c' : '#e9ecef'}`,
                        borderRadius: '8px',
                        ...arabicFontStyle,
                        color: darkMode ? '#e9ecef' : '#212529',
                        maxHeight: '100px',
                        overflowY: 'auto',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {selectedItem.submissionData.content}
                      </div>
                    )}
                    {(selectedItem.submissionData.fileName || selectedItem.submissionData.attachmentName) && (
                      <div className="d-flex align-items-center gap-2 mt-2">
                        {getFileIcon(selectedItem.submissionData.fileType || selectedItem.submissionData.attachmentType).icon}
                        <span style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                          {selectedItem.submissionData.fileName || selectedItem.submissionData.attachmentName}
                        </span>
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          className="ms-auto"
                          onClick={() => handleDownloadFile(selectedItem.submissionData)}
                          style={{ ...arabicFontStyle, borderRadius: '8px' }}
                        >
                          <FaDownload size={12} className="me-1" /> {isArabic ? 'تحميل' : 'Download'}
                        </Button>
                      </div>
                    )}
                    {selectedItem.submissionData.attachment && 
                     selectedItem.submissionData.fileType && 
                     (selectedItem.submissionData.fileType.includes('image') || 
                      selectedItem.submissionData.fileType.includes('jpg') || 
                      selectedItem.submissionData.fileType.includes('png')) && (
                      <div className="mt-2 text-center">
                        <img 
                          src={selectedItem.submissionData.attachment} 
                          alt="Submission preview" 
                          style={{ 
                            maxWidth: '100%', 
                            maxHeight: '200px',
                            borderRadius: '8px',
                            objectFit: 'contain'
                          }} 
                        />
                      </div>
                    )}
                    {selectedItem.submissionData.submittedAt && (
                      <div className="mt-2 text-muted small">
                        {isArabic ? 'تاريخ التقديم: ' : 'Submitted at: '}
                        {formatDate(selectedItem.submissionData.submittedAt)}
                      </div>
                    )}
                    {selectedItem.isGraded && (
                      <div>
                        <div className="mt-2">
                          <Badge bg="success">
                            <FaCheckCircle className="me-1" size={12} />
                            {isArabic ? 'الدرجة: ' : 'Grade: '}{formatNumber(selectedItem.grade)}
                          </Badge>
                        </div>
                        {/* Show Remarks in submission section */}
                        {selectedItem.remarks && (
                          <div className="mt-2 p-2 rounded-3" style={{
                            background: darkMode ? '#2d2d44' : '#e8f5e9',
                            border: `1px solid ${darkMode ? '#3d3d5c' : '#c8e6c9'}`,
                            borderRadius: '8px'
                          }}>
                            <div className="d-flex align-items-start gap-2">
                              <FaComment className="text-success mt-1" />
                              <div>
                                <span className="fw-semibold" style={{ color: darkMode ? '#e9ecef' : '#2e7d32' }}>
                                  {isArabic ? '📝 ملاحظات المعلم:' : '📝 Teacher\'s Remarks:'}
                                </span>
                                <p className="mb-0 mt-1" style={{ 
                                  color: darkMode ? '#e9ecef' : '#1b5e20',
                                  ...arabicFontStyle,
                                  whiteSpace: 'pre-wrap'
                                }}>
                                  {selectedItem.remarks}
                                </p>
                                {selectedItem.gradedBy && (
                                  <div className="text-muted small mt-1" style={{ fontSize: '0.6rem' }}>
                                    {isArabic ? 'بواسطة: ' : 'By: '}{selectedItem.gradedBy}
                                    {selectedItem.gradedAt && ` • ${formatDate(selectedItem.gradedAt)}`}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {!selectedItem.isGraded && selectedItem.hasSubmitted && (
                      <div className="mt-2">
                        <Badge bg="warning">
                          <FaClock className="me-1" size={12} />
                          {isArabic ? 'بانتظار التصحيح' : 'Pending Grading'}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Status Info */}
              {selectedItem.status && (
                <div className="status-info mt-3 p-3 rounded-3" style={{
                  background: selectedItem.status === 'published' || selectedItem.status === 'sent_to_students' ? '#d4edda' : 
                             selectedItem.status === 'closed' ? '#e2e3e5' : 
                             selectedItem.status === 'graded' ? '#d4edda' :
                             '#fff3cd',
                  border: `1px solid ${selectedItem.status === 'published' || selectedItem.status === 'sent_to_students' || selectedItem.status === 'graded' ? '#c3e6cb' : 
                             selectedItem.status === 'closed' ? '#d6d8db' : 
                             '#ffeaa7'}`,
                  borderRadius: '12px'
                }}>
                  <div className="d-flex align-items-center gap-2">
                    <Badge bg={getStatusBadge(selectedItem.status)}>
                      {getStatusLabel(selectedItem.status)}
                    </Badge>
                    <span className="fw-semibold" style={{ 
                      color: selectedItem.status === 'published' || selectedItem.status === 'sent_to_students' ? '#155724' : 
                             selectedItem.status === 'closed' ? '#383d41' : 
                             selectedItem.status === 'graded' ? '#155724' :
                             '#856404'
                    }}>
                      {selectedItem.status === 'published' || selectedItem.status === 'sent_to_students' ? 
                        (isArabic ? '✅ هذا التقييم متاح لك' : '✅ This assessment is available to you') :
                       selectedItem.status === 'closed' ? 
                        (isArabic ? '🔒 هذا التقييم مغلق' : '🔒 This assessment is closed') :
                       selectedItem.status === 'graded' ? 
                        (isArabic ? '✅ تم تصحيح هذا التقييم' : '✅ This assessment has been graded') :
                       (isArabic ? '📋 الحالة: ' : 'Status: ') + getStatusLabel(selectedItem.status)}
                    </span>
                  </div>
                  {selectedItem.sentAt && (
                    <div className="mt-1 text-muted small">
                      {isArabic ? 'تاريخ الإرسال: ' : 'Sent at: '}
                      {formatDate(selectedItem.sentAt)}
                    </div>
                  )}
                  {selectedItem.dueDate && (
                    <div className="mt-1 text-muted small">
                      {isArabic ? 'تاريخ التسليم: ' : 'Due Date: '}
                      {new Date(selectedItem.dueDate).toLocaleDateString()}
                    </div>
                  )}
                  {selectedItem.isGraded && selectedItem.gradedAt && (
                    <div className="mt-1 text-muted small">
                      {isArabic ? 'تاريخ التصحيح: ' : 'Graded at: '}
                      {formatDate(selectedItem.gradedAt)}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Button variant="secondary" onClick={() => setShowViewModal(false)} style={{ ...arabicFontStyle, borderRadius: '12px' }}>
            {isArabic ? 'إغلاق' : 'Close'}
          </Button>
          {selectedItem && selectedItemType === 'assessment' && 
           !hasSubmitted(selectedItem.assessmentId || selectedItem.id) && 
           selectedItem.status !== 'closed' && 
           selectedItem.status !== 'graded' && (
            <Button 
              variant="success" 
              onClick={() => {
                setShowViewModal(false);
                handleSubmitClick(selectedItem);
              }}
              style={{ ...arabicFontStyle, borderRadius: '12px' }}
            >
              <FaPaperPlane className="me-1" /> {isArabic ? 'تقديم' : 'Submit'}
            </Button>
          )}
          {selectedItem && selectedItemType === 'assessment' && selectedItem.attachmentName && (
            <Button 
              variant="primary" 
              onClick={() => handleDownloadFile(selectedItem)}
              style={{ ...arabicFontStyle, borderRadius: '12px' }}
            >
              <FaDownload className="me-1" /> {isArabic ? 'تحميل' : 'Download'}
            </Button>
          )}
          {selectedItem && selectedItemType === 'assessment' && (
            <Button 
              variant="outline-danger" 
              onClick={() => {
                setShowViewModal(false);
                handleDeleteAssignmentClick(selectedItem);
              }}
              style={{ ...arabicFontStyle, borderRadius: '12px' }}
            >
              <FaTrash className="me-1" /> {isArabic ? 'حذف التقييم' : 'Delete Assessment'}
            </Button>
          )}
          {selectedItem && selectedItemType === 'assessment' && selectedItem.submissionData && (
            <Button 
              variant="outline-danger" 
              onClick={() => {
                setShowViewModal(false);
                handleDeleteSubmissionClick(selectedItem.submissionData);
              }}
              style={{ ...arabicFontStyle, borderRadius: '12px' }}
            >
              <FaTimes className="me-1" /> {isArabic ? 'حذف التقديم' : 'Delete Submission'}
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* ===== SUBMIT ASSESSMENT MODAL ===== */}
      <Modal show={showSubmitModal} onHide={() => setShowSubmitModal(false)} size="lg" centered className="modern-modal">
        <Modal.Header closeButton className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Modal.Title style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
            <FaPaperPlane className="me-2 text-success" />
            {isArabic ? 'تقديم التقييم' : 'Submit Assessment'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? '#0d1117' : 'white' }}>
          {selectedAssessment && (
            <div>
              <div className="p-3 rounded-3 mb-3" style={{
                background: darkMode ? '#2d2d44' : '#f8f9fa',
                border: `1px solid ${darkMode ? '#3d3d5c' : '#e9ecef'}`,
                borderRadius: '12px'
              }}>
                <Row>
                  <Col md={6}>
                    <div className="d-flex align-items-center gap-2">
                      <FaFileAlt className="text-primary" />
                      <span className="fw-semibold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                        {isArabic ? 'التقييم: ' : 'Assessment: '}
                      </span>
                      <span style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                        {selectedAssessment.title}
                      </span>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="d-flex align-items-center gap-2">
                      <FaChalkboardTeacher className="text-primary" />
                      <span className="fw-semibold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                        {isArabic ? 'المعلم: ' : 'Teacher: '}
                      </span>
                      <span style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                        {selectedAssessment.teacherName}
                      </span>
                    </div>
                  </Col>
                </Row>
                <Row className="mt-2">
                  <Col md={6}>
                    <div className="d-flex align-items-center gap-2">
                      <FaBook className="text-success" />
                      <span className="fw-semibold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                        {isArabic ? 'المادة: ' : 'Subject: '}
                      </span>
                      <span style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                        {selectedAssessment.subject}
                      </span>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="d-flex align-items-center gap-2">
                      <FaStar className="text-warning" />
                      <span className="fw-semibold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                        {isArabic ? 'الدرجة الكلية: ' : 'Total Marks: '}
                      </span>
                      <span style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                        {selectedAssessment.totalMarks || 20}
                      </span>
                    </div>
                  </Col>
                </Row>
              </div>

              <Form>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                    {isArabic ? 'نص التقديم (اختياري)' : 'Submission Text (Optional)'}
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    placeholder={isArabic ? 'اكتب تقديمك هنا...' : 'Write your submission here...'}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? '#2d2d44' : 'white',
                      color: darkMode ? '#e9ecef' : '#212529',
                      borderRadius: '12px',
                      borderColor: darkMode ? '#3d3d5c' : '#e9ecef',
                    }}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                    {isArabic ? 'رفع ملف (اختياري)' : 'Upload File (Optional)'}
                  </Form.Label>
                  <Form.Control
                    type="file"
                    onChange={handleFileChange}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? '#2d2d44' : 'white',
                      color: darkMode ? '#e9ecef' : '#212529',
                      borderRadius: '12px',
                      borderColor: darkMode ? '#3d3d5c' : '#e9ecef',
                    }}
                  />
                  {submissionFilePreview && submissionFile && (
                    <div className="mt-2 p-2 rounded-3" style={{
                      background: darkMode ? '#2d2d44' : '#f8f9fa',
                      border: `1px solid ${darkMode ? '#3d3d5c' : '#e9ecef'}`,
                      borderRadius: '8px'
                    }}>
                      <div className="d-flex align-items-center gap-2">
                        {getFileIcon(submissionFile.type).icon}
                        <span style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                          {submissionFile.name}
                        </span>
                        <span className="text-muted small ms-auto">
                          {(submissionFile.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                      {submissionFile.type && submissionFile.type.includes('image') && (
                        <div className="mt-2 text-center">
                          <img 
                            src={submissionFilePreview} 
                            alt="Preview" 
                            style={{ 
                              maxWidth: '100%', 
                              maxHeight: '200px',
                              borderRadius: '8px',
                              objectFit: 'contain'
                            }} 
                          />
                        </div>
                      )}
                    </div>
                  )}
                </Form.Group>
              </Form>

              <p
                className="text-muted text-center mt-2"
                style={{
                  ...arabicFontStyle,
                  fontSize: 'clamp(0.8rem, 0.9vw, 0.9rem)',
                }}
              >
                {isArabic
                  ? 'سيتم إرسال تقديمك مباشرة إلى المعلم وسيتمكن الإدارة من مراقبته'
                  : 'Your submission will be sent directly to the teacher and admin can monitor it'}
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Button variant="secondary" onClick={() => setShowSubmitModal(false)} disabled={submitting} style={{ ...arabicFontStyle, borderRadius: '12px' }}>
            <FaTimes className="me-1" /> {isArabic ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button variant="success" onClick={confirmSubmit} disabled={submitting} style={{ ...arabicFontStyle, borderRadius: '12px' }}>
            {submitting ? (
              <>
                <FaSpinner className="spinning me-2" />
                {isArabic ? 'جاري التقديم...' : 'Submitting...'}
              </>
            ) : (
              <>
                <FaPaperPlane className="me-1" /> 
                {isArabic ? 'تأكيد التقديم' : 'Submit'}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===== DELETE CONFIRMATION MODAL ===== */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered className="modern-modal">
        <Modal.Header closeButton className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Modal.Title style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
            <FaExclamationTriangle className="me-2 text-danger" />
            {deleteType === 'assignment' 
              ? (isArabic ? 'تأكيد حذف التقييم' : 'Confirm Delete Assessment')
              : (isArabic ? 'تأكيد حذف التقديم' : 'Confirm Delete Submission')}
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
            {deleteType === 'assignment'
              ? (isArabic
                ? `هل أنت متأكد من حذف التقييم "${itemToDelete?.title || 'Untitled'}"؟`
                : `Are you sure you want to delete the assessment "${itemToDelete?.title || 'Untitled'}"?`)
              : (isArabic
                ? `هل أنت متأكد من حذف تقديمك؟`
                : `Are you sure you want to delete your submission?`)}
          </p>
          {itemToDelete && (
            <div className="p-3 rounded-3" style={{
              background: darkMode ? '#2d2d44' : '#f8f9fa',
              border: `1px solid ${darkMode ? '#3d3d5c' : '#e9ecef'}`,
              borderRadius: '12px'
            }}>
              <div className="d-flex align-items-center gap-2">
                <FaFileAlt className="text-info" />
                <span style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                  {itemToDelete.title || 'Untitled'}
                </span>
              </div>
              {itemToDelete.teacherName && (
                <div className="mt-1 d-flex align-items-center gap-2">
                  <FaChalkboardTeacher className="text-primary" size={12} />
                  <span className="text-muted small">
                    {isArabic ? 'المعلم: ' : 'Teacher: '}
                    {itemToDelete.teacherName}
                  </span>
                </div>
              )}
              {itemToDelete.subject && (
                <div className="mt-1 d-flex align-items-center gap-2">
                  <FaBook className="text-success" size={12} />
                  <span className="text-muted small">
                    {isArabic ? 'المادة: ' : 'Subject: '}
                    {itemToDelete.subject}
                  </span>
                </div>
              )}
              {itemToDelete.fileName && (
                <div className="mt-1 d-flex align-items-center gap-2">
                  <FaFile className="text-info" size={12} />
                  <span className="text-muted small">
                    {isArabic ? 'الملف: ' : 'File: '}
                    {itemToDelete.fileName}
                  </span>
                </div>
              )}
              {itemToDelete.submittedAt && (
                <div className="mt-1 d-flex align-items-center gap-2">
                  <FaClock className="text-warning" size={12} />
                  <span className="text-muted small">
                    {isArabic ? 'تاريخ التقديم: ' : 'Submitted: '}
                    {formatDate(itemToDelete.submittedAt)}
                  </span>
                </div>
              )}
              {itemToDelete.grade && deleteType === 'submission' && (
                <div className="mt-1 d-flex align-items-center gap-2">
                  <FaCheckCircle className="text-success" size={12} />
                  <span className="text-muted small">
                    {isArabic ? 'الدرجة: ' : 'Grade: '}
                    {formatNumber(itemToDelete.grade)}
                  </span>
                </div>
              )}
              {itemToDelete.remarks && deleteType === 'submission' && (
                <div className="mt-1 d-flex align-items-center gap-2">
                  <FaComment className="text-info" size={12} />
                  <span className="text-muted small">
                    {isArabic ? 'ملاحظات: ' : 'Remarks: '}
                    {itemToDelete.remarks}
                  </span>
                </div>
              )}
              {deleteType === 'assignment' && (
                <div className="mt-2">
                  <Badge bg="warning" style={{ fontSize: '0.7rem' }}>
                    <FaInfoCircle className="me-1" size={10} />
                    {isArabic 
                      ? 'سيتم حذف هذا التقييم نهائياً من حسابك' 
                      : 'This assessment will be permanently deleted from your account'}
                  </Badge>
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
            {deleteType === 'assignment'
              ? (isArabic
                ? 'سيتم حذف هذا التقييم وجميع بياناته المرتبطة نهائياً'
                : 'This assessment and all associated data will be permanently deleted')
              : (isArabic
                ? 'هذا الإجراء لا يمكن التراجع عنه وسيتم حذف التقديم نهائياً'
                : 'This action cannot be undone and the submission will be permanently deleted')}
          </p>
        </Modal.Body>
        <Modal.Footer className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={deleting} style={{ ...arabicFontStyle, borderRadius: '12px' }}>
            <FaTimes className="me-1" /> {isArabic ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button variant="danger" onClick={confirmDelete} disabled={deleting} style={{ ...arabicFontStyle, borderRadius: '12px' }}>
            {deleting ? (
              <>
                <FaSpinner className="spinning me-2" />
                {isArabic ? 'جاري الحذف...' : 'Deleting...'}
              </>
            ) : (
              <>
                <FaTrash className="me-1" /> 
                {deleteType === 'assignment' 
                  ? (isArabic ? 'تأكيد حذف التقييم' : 'Confirm Delete')
                  : (isArabic ? 'تأكيد حذف التقديم' : 'Confirm Delete')}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .student-announcements {
          padding: 0;
          max-width: 100vw;
          overflow-x: hidden;
        }

        .student-announcements * {
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

        @keyframes pulse-warning {
          0% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(0.95);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
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
        }
      `}</style>
    </div>
  );
};

export default StudentAnnouncements;