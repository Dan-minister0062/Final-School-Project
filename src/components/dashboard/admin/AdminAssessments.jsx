// src/components/dashboard/admin/AdminAssessments.jsx
import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Table, Modal, Form, Row, Col, Alert, Nav, Tab } from 'react-bootstrap';
import { 
  FaFileAlt, FaEye, FaCheck, FaTimes, FaSearch, FaSync, 
  FaSpinner, FaExclamationTriangle, FaDownload, FaFilePdf,
  FaFileWord, FaFileImage, FaFile, FaClock, FaUserGraduate,
  FaChalkboardTeacher, FaBook, FaCalendarAlt, FaInfoCircle,
  FaUser, FaEnvelope, FaIdCard, FaGraduationCap, FaUsers,
  FaCheckCircle, FaClock as FaClockIcon, FaPaperPlane,
  FaUpload, FaFilter, FaSort, FaArrowRight, FaArrowLeft,
  FaBell, FaFileExcel, FaFilePowerpoint, FaFileCode, FaStar,
  FaTrash
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

// ===== DOWNLOAD FILE HELPER =====
const downloadFileHelper = (content, fileName, fileType) => {
  try {
    // If content is a data URL
    if (content && content.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = content;
      link.download = fileName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    }
    
    // If content is base64 (no data: prefix)
    if (content && content.length > 0) {
      let mimeType = fileType || 'application/octet-stream';
      let base64Data = content;
      
      if (!content.startsWith('data:')) {
        const ext = fileName ? fileName.split('.').pop().toLowerCase() : '';
        const mimeMap = {
          'pdf': 'application/pdf',
          'doc': 'application/msword',
          'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'gif': 'image/gif',
          'txt': 'text/plain',
          'xls': 'application/vnd.ms-excel',
          'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'ppt': 'application/vnd.ms-powerpoint',
          'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        };
        if (mimeMap[ext]) {
          mimeType = mimeMap[ext];
        }
        base64Data = `data:${mimeType};base64,${content}`;
      }
      
      const link = document.createElement('a');
      link.href = base64Data;
      link.download = fileName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    }
    
    return false;
  } catch (err) {
    console.error('Download error:', err);
    return false;
  }
};

const AdminAssessments = () => {
  const { isArabic } = useLanguage();
  const { notify } = useNotification();
  const [darkMode, setDarkMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  
  // Pending assessments (from teachers)
  const [pendingAssessments, setPendingAssessments] = useState([]);
  const [filteredPending, setFilteredPending] = useState([]);
  
  // All assessments (sent to students)
  const [allAssessments, setAllAssessments] = useState([]);
  const [filteredAll, setFilteredAll] = useState([]);
  
  // Student submissions (direct from students to teachers)
  const [studentSubmissions, setStudentSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemType, setSelectedItemType] = useState('assessment');
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
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

  // ===== LOAD DATA =====
  const loadData = () => {
    try {
      setLoading(true);
      
      // 1. Load pending assessments (from teachers waiting for admin approval)
      const pendingAssessments = JSON.parse(localStorage.getItem('pending_assessments') || '[]');
      const pending = pendingAssessments.filter(a => a.status === 'pending');
      console.log('📋 Pending assessments:', pending.length);
      setPendingAssessments(pending);
      setFilteredPending(pending);

      // 2. Load all assessments (from school_assessments)
      const allAssessments = JSON.parse(localStorage.getItem('school_assessments') || '[]');
      console.log('📝 All assessments:', allAssessments.length);
      setAllAssessments(allAssessments);
      setFilteredAll(allAssessments);

      // 3. Load student submissions (direct from students to teachers)
      // Admin can see all submissions that students send to teachers
      const submissions = JSON.parse(localStorage.getItem('school_submissions') || '[]');
      // Only show submissions that are submitted (not drafts)
      const submittedSubmissions = submissions.filter(s => s.status === 'submitted');
      console.log('📤 Student submissions:', submittedSubmissions.length);
      setStudentSubmissions(submittedSubmissions);
      setFilteredSubmissions(submittedSubmissions);

      // 4. Check for new notifications
      checkForNewNotifications(pending, submittedSubmissions);

      setLoading(false);
    } catch (err) {
      console.error('Error loading admin assessments:', err);
      setLoading(false);
    }
  };

  // ===== CHECK FOR NEW NOTIFICATIONS =====
  const checkForNewNotifications = (pending, submissions) => {
    try {
      const adminNotifications = JSON.parse(localStorage.getItem('admin_notifications') || '[]');
      const unreadNotifications = adminNotifications.filter(n => !n.read);
      
      // Check for new submissions that admin hasn't seen
      const seenSubmissions = JSON.parse(localStorage.getItem('admin_seen_submissions') || '[]');
      const newSubmissions = submissions.filter(s => {
        return !seenSubmissions.find(f => f.submissionId === s.id);
      });
      
      const hasNew = unreadNotifications.length > 0 || newSubmissions.length > 0;
      setHasNewNotifications(hasNew);
      
      console.log('🔔 New notifications:', hasNew);
    } catch (e) {
      console.warn('Error checking notifications:', e);
    }
  };

  // ===== APPLY FILTERS =====
  useEffect(() => {
    // Filter pending assessments
    let filtered = [...pendingAssessments];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(a => 
        a.title?.toLowerCase().includes(term) ||
        a.teacherName?.toLowerCase().includes(term) ||
        a.subject?.toLowerCase().includes(term) ||
        a.className?.toLowerCase().includes(term)
      );
    }
    setFilteredPending(filtered);

    // Filter all assessments
    let filteredAllAssess = [...allAssessments];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredAllAssess = filteredAllAssess.filter(a => 
        a.title?.toLowerCase().includes(term) ||
        a.teacherName?.toLowerCase().includes(term) ||
        a.subject?.toLowerCase().includes(term) ||
        a.className?.toLowerCase().includes(term)
      );
    }
    if (statusFilter !== 'all') {
      filteredAllAssess = filteredAllAssess.filter(a => a.status === statusFilter);
    }
    if (typeFilter !== 'all') {
      filteredAllAssess = filteredAllAssess.filter(a => a.type === typeFilter);
    }
    setFilteredAll(filteredAllAssess);

    // Filter student submissions
    let filteredSubs = [...studentSubmissions];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredSubs = filteredSubs.filter(s => 
        (s.title || '').toLowerCase().includes(term) ||
        (s.studentName || '').toLowerCase().includes(term) ||
        (s.subject || '').toLowerCase().includes(term) ||
        (s.teacherName || '').toLowerCase().includes(term) ||
        (s.className || '').toLowerCase().includes(term)
      );
    }
    setFilteredSubmissions(filteredSubs);

  }, [pendingAssessments, allAssessments, studentSubmissions, searchTerm, statusFilter, typeFilter]);

  // ===== SETUP =====
  useEffect(() => {
    loadData();

    const handleStorageChange = (e) => {
      if (e.key === "pending_assessments" || 
          e.key === "school_assessments" || 
          e.key === "school_submissions" ||
          e.key === "admin_notifications") {
        loadData();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    const handleAssessmentSent = () => {
      loadData();
    };
    window.addEventListener("assessmentSent", handleAssessmentSent);

    const handleSubmissionChanged = () => {
      loadData();
    };
    window.addEventListener("submissionChanged", handleSubmissionChanged);

    // Listen for new student submissions
    const handleStudentSubmission = () => {
      loadData();
    };
    window.addEventListener("studentSubmission", handleStudentSubmission);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("assessmentSent", handleAssessmentSent);
      window.removeEventListener("submissionChanged", handleSubmissionChanged);
      window.removeEventListener("studentSubmission", handleStudentSubmission);
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
      'pending_approval': 'warning',
      'approved': 'success',
      'rejected': 'danger',
      'published': 'success',
      'pending_marking': 'warning',
      'sent_to_students': 'primary',
      'closed': 'dark',
      'draft': 'secondary',
      'submitted': 'info',
      'graded': 'success'
    };
    return statusMap[status] || 'secondary';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'pending': isArabic ? 'بانتظار المراجعة' : 'Pending Review',
      'pending_approval': isArabic ? 'بانتظار الموافقة' : 'Pending Approval',
      'approved': isArabic ? 'موافق عليه' : 'Approved',
      'rejected': isArabic ? 'مرفوض' : 'Rejected',
      'published': isArabic ? 'منشور' : 'Published',
      'pending_marking': isArabic ? 'بانتظار التصحيح' : 'Pending Marking',
      'sent_to_students': isArabic ? 'مرسل للطلاب' : 'Sent to Students',
      'closed': isArabic ? 'مغلق' : 'Closed',
      'draft': isArabic ? 'مسودة' : 'Draft',
      'submitted': isArabic ? 'تم التقديم' : 'Submitted',
      'graded': isArabic ? 'مصحح' : 'Graded'
    };
    return labels[status] || status;
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

    const success = downloadFileHelper(content, fileName, fileType);
    
    if (success) {
      notify(
        isArabic ? `✅ تم تحميل الملف: ${fileName}` : `✅ File downloaded: ${fileName}`,
        'success'
      );
    } else {
      notify(
        isArabic ? '❌ حدث خطأ أثناء تحميل الملف' : '❌ Error downloading file',
        'error'
      );
    }
  };

  // ===== HANDLE DELETE =====
  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    
    setDeleting(true);
    try {
      let deleted = false;
      
      // Check if it's a pending assessment
      if (selectedItemType === 'pending' || itemToDelete._type === 'pending') {
        let pendingAssessments = JSON.parse(localStorage.getItem('pending_assessments') || '[]');
        const index = pendingAssessments.findIndex(a => a.id === itemToDelete.id);
        if (index !== -1) {
          pendingAssessments.splice(index, 1);
          localStorage.setItem('pending_assessments', JSON.stringify(pendingAssessments));
          deleted = true;
        }
        
        // Also remove from admin notifications
        let adminNotifications = JSON.parse(localStorage.getItem('admin_notifications') || '[]');
        const notifIndex = adminNotifications.findIndex(n => n.id === itemToDelete.id);
        if (notifIndex !== -1) {
          adminNotifications.splice(notifIndex, 1);
          localStorage.setItem('admin_notifications', JSON.stringify(adminNotifications));
        }
      }
      
      // Check if it's an assessment
      if (selectedItemType === 'assessment' || itemToDelete._type === 'assessment') {
        let allAssessments = JSON.parse(localStorage.getItem('school_assessments') || '[]');
        const index = allAssessments.findIndex(a => a.id === itemToDelete.id);
        if (index !== -1) {
          allAssessments.splice(index, 1);
          localStorage.setItem('school_assessments', JSON.stringify(allAssessments));
          deleted = true;
        }
      }
      
      // Check if it's a submission
      if (selectedItemType === 'submission' || itemToDelete._type === 'submission') {
        let submissions = JSON.parse(localStorage.getItem('school_submissions') || '[]');
        const index = submissions.findIndex(s => s.id === itemToDelete.id);
        if (index !== -1) {
          submissions.splice(index, 1);
          localStorage.setItem('school_submissions', JSON.stringify(submissions));
          deleted = true;
        }
      }
      
      if (deleted) {
        notify(
          isArabic ? '✅ تم الحذف بنجاح' : '✅ Deleted successfully',
          'success'
        );
        loadData();
        setShowDeleteModal(false);
        setItemToDelete(null);
      } else {
        notify(
          isArabic ? '❌ لم يتم العثور على العنصر' : '❌ Item not found',
          'warning'
        );
      }
    } catch (err) {
      console.error('Error deleting item:', err);
      notify(
        isArabic ? '❌ حدث خطأ أثناء الحذف' : '❌ Error deleting item',
        'error'
      );
    } finally {
      setDeleting(false);
    }
  };

  // ===== HANDLE APPROVE =====
  const handleApprove = (assessment) => {
    setActionLoading(true);
    try {
      let pendingAssessments = JSON.parse(localStorage.getItem('pending_assessments') || '[]');
      const index = pendingAssessments.findIndex(a => a.id === assessment.id);
      if (index !== -1) {
        pendingAssessments[index].status = 'approved';
        pendingAssessments[index].reviewedAt = new Date().toISOString();
        pendingAssessments[index].reviewedBy = 'Admin';
        localStorage.setItem('pending_assessments', JSON.stringify(pendingAssessments));
      }

      let adminNotifications = JSON.parse(localStorage.getItem('admin_notifications') || '[]');
      const notifIndex = adminNotifications.findIndex(n => n.id === assessment.id);
      if (notifIndex !== -1) {
        adminNotifications[notifIndex].status = 'approved';
        adminNotifications[notifIndex].reviewedAt = new Date().toISOString();
        localStorage.setItem('admin_notifications', JSON.stringify(adminNotifications));
      }

      let storedAssessments = JSON.parse(localStorage.getItem('school_assessments') || '[]');
      const assessIndex = storedAssessments.findIndex(a => a.id === assessment.assessmentId);
      if (assessIndex !== -1) {
        storedAssessments[assessIndex].status = 'pending_approval';
        storedAssessments[assessIndex].approvedByAdmin = true;
        storedAssessments[assessIndex].approvedAt = new Date().toISOString();
        localStorage.setItem('school_assessments', JSON.stringify(storedAssessments));
      }

      notify(
        isArabic ? '✅ تم الموافقة على التقييم بنجاح' : '✅ Assessment approved successfully',
        'success'
      );

      loadData();
      setShowViewModal(false);
    } catch (err) {
      console.error('Error approving assessment:', err);
      notify(
        isArabic ? '❌ حدث خطأ أثناء الموافقة' : '❌ Error approving assessment',
        'error'
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ===== HANDLE REJECT =====
  const handleReject = (assessment) => {
    if (!window.confirm(isArabic ? 'هل أنت متأكد من رفض هذا التقييم؟' : 'Are you sure you want to reject this assessment?')) {
      return;
    }

    setActionLoading(true);
    try {
      let pendingAssessments = JSON.parse(localStorage.getItem('pending_assessments') || '[]');
      const index = pendingAssessments.findIndex(a => a.id === assessment.id);
      if (index !== -1) {
        pendingAssessments[index].status = 'rejected';
        pendingAssessments[index].reviewedAt = new Date().toISOString();
        pendingAssessments[index].reviewedBy = 'Admin';
        localStorage.setItem('pending_assessments', JSON.stringify(pendingAssessments));
      }

      let adminNotifications = JSON.parse(localStorage.getItem('admin_notifications') || '[]');
      const notifIndex = adminNotifications.findIndex(n => n.id === assessment.id);
      if (notifIndex !== -1) {
        adminNotifications[notifIndex].status = 'rejected';
        adminNotifications[notifIndex].reviewedAt = new Date().toISOString();
        localStorage.setItem('admin_notifications', JSON.stringify(adminNotifications));
      }

      let storedAssessments = JSON.parse(localStorage.getItem('school_assessments') || '[]');
      const assessIndex = storedAssessments.findIndex(a => a.id === assessment.assessmentId);
      if (assessIndex !== -1) {
        storedAssessments[assessIndex].status = 'rejected';
        storedAssessments[assessIndex].rejectedByAdmin = true;
        storedAssessments[assessIndex].rejectedAt = new Date().toISOString();
        localStorage.setItem('school_assessments', JSON.stringify(storedAssessments));
      }

      notify(
        isArabic ? '✅ تم رفض التقييم' : '✅ Assessment rejected',
        'info'
      );

      loadData();
      setShowViewModal(false);
    } catch (err) {
      console.error('Error rejecting assessment:', err);
      notify(
        isArabic ? '❌ حدث خطأ أثناء الرفض' : '❌ Error rejecting assessment',
        'error'
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ===== MARK SUBMISSION AS SEEN =====
  const markSubmissionAsSeen = (submissionId) => {
    try {
      const seenSubmissions = JSON.parse(localStorage.getItem('admin_seen_submissions') || '[]');
      if (!seenSubmissions.find(s => s.submissionId === submissionId)) {
        seenSubmissions.push({
          submissionId: submissionId,
          seenAt: new Date().toISOString()
        });
        localStorage.setItem('admin_seen_submissions', JSON.stringify(seenSubmissions));
      }
    } catch (e) {
      console.warn('Error marking submission as seen:', e);
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

  // ===== STATS =====
  const stats = {
    pending: pendingAssessments.length,
    total: allAssessments.length,
    submitted: studentSubmissions.length,
    active: allAssessments.filter(a => a.status === 'published' || a.status === 'sent_to_students').length
  };

  return (
    <div className="admin-assessments" dir={isArabic ? 'rtl' : 'ltr'}>
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
              {isArabic ? 'لوحة التقييمات' : 'Assessments Dashboard'}
            </h4>
            {hasNewNotifications && (
              <Badge 
                style={{ 
                  background: '#e74c3c', 
                  color: 'white',
                  borderRadius: '50%',
                  padding: '4px 10px',
                  animation: 'pulse-warning 1.5s infinite'
                }}
              >
                <FaBell className="me-1" />
                {isArabic ? 'جديد' : 'New'}
              </Badge>
            )}
          </div>
          <p className="text-muted mb-0 d-none d-sm-block" style={{ 
            ...arabicFontStyle, 
            fontSize: isArabic ? 'clamp(0.8rem, 1vw, 0.95rem)' : 'clamp(0.75rem, 0.9vw, 0.9rem)' 
          }}>
            {isArabic 
              ? `عرض وإدارة جميع التقييمات والتقديمات`
              : `View and manage all assessments and submissions`}
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
            <div className="stat-number-mini" style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f39c12' }}>
              {formatNumber(stats.pending)}
              {hasNewNotifications && stats.pending > 0 && (
                <span style={{ 
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  background: '#e74c3c',
                  borderRadius: '50%',
                  marginLeft: '4px',
                  animation: 'pulse-warning 1.5s infinite'
                }} />
              )}
            </div>
            <div className="stat-label-mini" style={{ fontSize: '0.7rem', color: '#6c757d' }}>
              {isArabic ? 'بانتظار المراجعة' : 'Pending Review'}
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
            <div className="stat-number-mini" style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2ecc71' }}>
              {formatNumber(stats.active)}
            </div>
            <div className="stat-label-mini" style={{ fontSize: '0.7rem', color: '#6c757d' }}>
              {isArabic ? 'تقييمات نشطة' : 'Active Assessments'}
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
              {formatNumber(stats.submitted)}
              {hasNewNotifications && stats.submitted > 0 && (
                <span style={{ 
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  background: '#e74c3c',
                  borderRadius: '50%',
                  marginLeft: '4px',
                  animation: 'pulse-warning 1.5s infinite'
                }} />
              )}
            </div>
            <div className="stat-label-mini" style={{ fontSize: '0.7rem', color: '#6c757d' }}>
              {isArabic ? 'تقديمات الطلاب' : 'Student Submissions'}
            </div>
          </div>
        </Col>
      </Row>

      {/* ===== SEARCH AND FILTERS ===== */}
      <Card className="modern-card mb-4" style={{ background: darkMode ? '#1a1a2e' : '#ffffff', borderColor: darkMode ? '#2d2d44' : '#e9ecef' }}>
        <Card.Body className="p-3 p-md-4">
          <Row className="g-2 g-md-3">
            <Col xs={12} md={4} lg={5}>
              <div className="position-relative">
                <FaSearch className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                <Form.Control
                  type="text"
                  placeholder={isArabic ? 'بحث عن تقييم، معلم، طالب...' : 'Search assessments, teachers, students...'}
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
                <option value="pending_approval">{isArabic ? 'بانتظار الموافقة' : 'Pending Approval'}</option>
                <option value="sent_to_students">{isArabic ? 'مرسل للطلاب' : 'Sent to Students'}</option>
                <option value="closed">{isArabic ? 'مغلق' : 'Closed'}</option>
              </Form.Select>
            </Col>
            <Col xs={6} md={3} lg={3}>
              <Form.Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                style={{
                  ...arabicFontStyle,
                  background: darkMode ? '#2d2d44' : 'white',
                  color: darkMode ? '#e9ecef' : '#212529',
                  borderRadius: '12px',
                  borderColor: darkMode ? '#2d2d44' : '#e9ecef',
                }}
              >
                <option value="all">{isArabic ? 'جميع الأنواع' : 'All Types'}</option>
                <option value="homework">{isArabic ? 'واجب منزلي' : 'Homework'}</option>
                <option value="assignment">{isArabic ? 'مشروع' : 'Assignment'}</option>
                <option value="test">{isArabic ? 'اختبار' : 'Test'}</option>
                <option value="exam">{isArabic ? 'امتحان' : 'Exam'}</option>
                <option value="classwork">{isArabic ? 'عمل صفي' : 'Classwork'}</option>
              </Form.Select>
            </Col>
            <Col xs={12} md={2}>
              <Button 
                variant="outline-secondary" 
                size="sm" 
                className="w-100"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setTypeFilter('all');
                }}
                style={{ ...arabicFontStyle, borderRadius: '12px' }}
              >
                <FaFilter className="me-1" /> {isArabic ? 'مسح' : 'Clear'}
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* ===== TABS ===== */}
      <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
        <Nav variant="tabs" className="mb-4" style={{ borderBottom: `2px solid ${darkMode ? '#2d2d44' : '#e9ecef'}` }}>
          <Nav.Item>
            <Nav.Link 
              eventKey="pending" 
              style={{ 
                color: activeTab === 'pending' ? '#f39c12' : darkMode ? '#adb5bd' : '#6c757d',
                fontWeight: activeTab === 'pending' ? 'bold' : 'normal',
                borderBottom: activeTab === 'pending' ? '2px solid #f39c12' : 'none',
                ...arabicFontStyle,
                position: 'relative'
              }}
            >
              <FaClockIcon className="me-2" /> 
              {isArabic ? 'بانتظار المراجعة' : 'Pending Review'}
              {pendingAssessments.length > 0 && (
                <Badge className="ms-2" style={{ background: '#f39c12', color: 'white', borderRadius: '50px' }}>
                  {formatNumber(pendingAssessments.length)}
                </Badge>
              )}
              {hasNewNotifications && pendingAssessments.length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-8px',
                  width: '10px',
                  height: '10px',
                  background: '#e74c3c',
                  borderRadius: '50%',
                  animation: 'pulse-warning 1.5s infinite'
                }} />
              )}
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link 
              eventKey="all" 
              style={{ 
                color: activeTab === 'all' ? '#4a9eff' : darkMode ? '#adb5bd' : '#6c757d',
                fontWeight: activeTab === 'all' ? 'bold' : 'normal',
                borderBottom: activeTab === 'all' ? '2px solid #4a9eff' : 'none',
                ...arabicFontStyle
              }}
            >
              <FaFileAlt className="me-2" /> 
              {isArabic ? 'جميع التقييمات' : 'All Assessments'}
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link 
              eventKey="submissions" 
              style={{ 
                color: activeTab === 'submissions' ? '#2ecc71' : darkMode ? '#adb5bd' : '#6c757d',
                fontWeight: activeTab === 'submissions' ? 'bold' : 'normal',
                borderBottom: activeTab === 'submissions' ? '2px solid #2ecc71' : 'none',
                ...arabicFontStyle,
                position: 'relative'
              }}
            >
              <FaUpload className="me-2" /> 
              {isArabic ? 'تقديمات الطلاب' : 'Student Submissions'}
              {studentSubmissions.length > 0 && (
                <Badge className="ms-2" style={{ background: '#2ecc71', color: 'white', borderRadius: '50px' }}>
                  {formatNumber(studentSubmissions.length)}
                </Badge>
              )}
              {hasNewNotifications && studentSubmissions.length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-8px',
                  width: '10px',
                  height: '10px',
                  background: '#e74c3c',
                  borderRadius: '50%',
                  animation: 'pulse-warning 1.5s infinite'
                }} />
              )}
            </Nav.Link>
          </Nav.Item>
        </Nav>

        <Tab.Content>
          {/* ===== PENDING ASSESSMENTS TAB ===== */}
          <Tab.Pane eventKey="pending">
            {filteredPending.length === 0 ? (
              <div className="text-center py-5">
                <FaFileAlt size={48} className="text-muted opacity-25 mb-3" />
                <h5 style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                  {isArabic ? 'لا توجد تقييمات بانتظار المراجعة' : 'No assessments pending review'}
                </h5>
                <p className="text-muted" style={arabicFontStyle}>
                  {isArabic 
                    ? 'جميع التقييمات قد تمت مراجعتها' 
                    : 'All assessments have been reviewed'}
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
                      <th style={{ color: darkMode ? '#e9ecef' : '#212529' }} className="text-center">{isArabic ? 'إجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPending.map((assessment) => (
                      <tr key={assessment.id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <FaChalkboardTeacher className="text-primary" />
                            <span style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                              {assessment.teacherName}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                            {assessment.title}
                          </div>
                          {assessment.attachmentName && (
                            <Badge bg="info" style={{ fontSize: '0.6rem' }}>
                              <FaFile className="me-1" size={10} />
                              {assessment.attachmentName}
                            </Badge>
                          )}
                        </td>
                        <td className="d-none d-md-table-cell">{getTypeLabel(assessment.type)}</td>
                        <td className="d-none d-sm-table-cell">{assessment.subject}</td>
                        <td>
                          <Badge bg={getStatusBadge(assessment.status)}>
                            {getStatusLabel(assessment.status)}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex gap-1 justify-content-center flex-wrap">
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              className="action-btn"
                              onClick={() => {
                                setSelectedItem(assessment);
                                setSelectedItemType('pending');
                                setShowViewModal(true);
                              }}
                              title={isArabic ? 'عرض التفاصيل' : 'View Details'}
                            >
                              <FaEye size={14} />
                            </Button>
                            <Button 
                              variant="outline-success" 
                              size="sm"
                              className="action-btn"
                              onClick={() => handleApprove(assessment)}
                              disabled={actionLoading}
                              title={isArabic ? 'موافقة' : 'Approve'}
                            >
                              <FaCheck size={14} />
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              className="action-btn"
                              onClick={() => handleReject(assessment)}
                              disabled={actionLoading}
                              title={isArabic ? 'رفض' : 'Reject'}
                            >
                              <FaTimes size={14} />
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              className="action-btn"
                              onClick={() => {
                                const item = { ...assessment, _type: 'pending' };
                                handleDeleteClick(item);
                              }}
                              title={isArabic ? 'حذف' : 'Delete'}
                            >
                              <FaTrash size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Tab.Pane>

          {/* ===== ALL ASSESSMENTS TAB ===== */}
          <Tab.Pane eventKey="all">
            {filteredAll.length === 0 ? (
              <div className="text-center py-5">
                <FaFileAlt size={48} className="text-muted opacity-25 mb-3" />
                <h5 style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                  {isArabic ? 'لا توجد تقييمات' : 'No assessments found'}
                </h5>
                <p className="text-muted" style={arabicFontStyle}>
                  {isArabic 
                    ? 'لم يتم إنشاء أي تقييمات بعد' 
                    : 'No assessments have been created yet'}
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
                      <th style={{ color: darkMode ? '#e9ecef' : '#212529' }} className="d-none d-md-table-cell">{isArabic ? 'الفصل' : 'Class'}</th>
                      <th style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{isArabic ? 'الحالة' : 'Status'}</th>
                      <th style={{ color: darkMode ? '#e9ecef' : '#212529' }} className="text-center">{isArabic ? 'إجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAll.map((assessment) => (
                      <tr key={assessment.id}>
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
                            {assessment.title}
                          </div>
                          {assessment.attachmentName && (
                            <Badge bg="info" style={{ fontSize: '0.6rem' }}>
                              <FaFile className="me-1" size={10} />
                              {assessment.attachmentName}
                            </Badge>
                          )}
                        </td>
                        <td className="d-none d-md-table-cell">{getTypeLabel(assessment.type)}</td>
                        <td className="d-none d-sm-table-cell">{assessment.subject}</td>
                        <td className="d-none d-md-table-cell">{assessment.className || 'N/A'}</td>
                        <td>
                          <Badge bg={getStatusBadge(assessment.status)}>
                            {getStatusLabel(assessment.status)}
                          </Badge>
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
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              className="action-btn"
                              onClick={() => {
                                const item = { ...assessment, _type: 'assessment' };
                                handleDeleteClick(item);
                              }}
                              title={isArabic ? 'حذف' : 'Delete'}
                            >
                              <FaTrash size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Tab.Pane>

          {/* ===== STUDENT SUBMISSIONS TAB (Admin as Intermediary) ===== */}
          <Tab.Pane eventKey="submissions">
            {filteredSubmissions.length === 0 ? (
              <div className="text-center py-5">
                <FaUpload size={48} className="text-muted opacity-25 mb-3" />
                <h5 style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                  {isArabic ? 'لا توجد تقديمات من الطلاب' : 'No student submissions'}
                </h5>
                <p className="text-muted" style={arabicFontStyle}>
                  {isArabic 
                    ? 'لم يقدم أي طالب تقييمات للمعلمين بعد' 
                    : 'No students have submitted assessments to teachers yet'}
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <Table hover className="assessment-table" style={arabicFontStyle}>
                  <thead style={{ background: darkMode ? '#0d1117' : '#f8f9fa' }}>
                    <tr>
                      <th style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{isArabic ? 'الطالب' : 'Student'}</th>
                      <th style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{isArabic ? 'المعلم' : 'Teacher'}</th>
                      <th style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{isArabic ? 'التقييم' : 'Assessment'}</th>
                      <th style={{ color: darkMode ? '#e9ecef' : '#212529' }} className="d-none d-md-table-cell">{isArabic ? 'النوع' : 'Type'}</th>
                      <th style={{ color: darkMode ? '#e9ecef' : '#212529' }} className="d-none d-sm-table-cell">{isArabic ? 'المادة' : 'Subject'}</th>
                      <th style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{isArabic ? 'المرفق' : 'Attachment'}</th>
                      <th style={{ color: darkMode ? '#e9ecef' : '#212529' }} className="text-center">{isArabic ? 'إجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubmissions.map((submission) => (
                      <tr key={submission.id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <FaUserGraduate className="text-success" />
                            <span style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                              {submission.studentName || 'Student'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <FaChalkboardTeacher className="text-primary" />
                            <span style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                              {submission.teacherName || 'Unknown'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                            {submission.title || 'Assessment'}
                          </div>
                          <small className="text-muted d-block d-md-none" style={arabicFontStyle}>
                            {getTypeLabel(submission.type)} • {submission.subject || 'N/A'}
                          </small>
                        </td>
                        <td className="d-none d-md-table-cell">
                          <Badge bg="info" style={{ fontSize: '0.6rem' }}>
                            {getTypeLabel(submission.type)}
                          </Badge>
                        </td>
                        <td className="d-none d-sm-table-cell">
                          <Badge bg="secondary" style={{ fontSize: '0.6rem' }}>
                            {submission.subject || 'N/A'}
                          </Badge>
                        </td>
                        <td>
                          {submission.fileName || submission.attachmentName ? (
                            <Badge bg="info" style={{ fontSize: '0.6rem', cursor: 'pointer' }} 
                              onClick={() => {
                                const item = { 
                                  ...submission, 
                                  content: submission.attachment || submission.content,
                                  fileName: submission.fileName || submission.attachmentName,
                                  fileType: submission.fileType || submission.attachmentType
                                };
                                handleDownloadFile(item);
                              }}
                            >
                              {getFileIcon(submission.fileType || submission.attachmentType).icon}
                              <span className="ms-1">
                                {submission.fileName || submission.attachmentName}
                              </span>
                              <FaDownload size={10} className="ms-1" />
                            </Badge>
                          ) : submission.content ? (
                            <Badge bg="warning" style={{ fontSize: '0.6rem' }}>
                              <FaFileCode className="me-1" />
                              {isArabic ? 'نص' : 'Text'}
                            </Badge>
                          ) : (
                            <span className="text-muted" style={{ fontSize: '0.6rem' }}>
                              {isArabic ? 'لا يوجد' : 'None'}
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
                                setSelectedItem(submission);
                                setSelectedItemType('submission');
                                markSubmissionAsSeen(submission.id);
                                setShowViewModal(true);
                              }}
                              title={isArabic ? 'عرض التفاصيل' : 'View Details'}
                            >
                              <FaEye size={14} />
                            </Button>
                            {(submission.fileName || submission.attachmentName || submission.content || submission.attachment) && (
                              <Button 
                                variant="outline-info" 
                                size="sm"
                                className="action-btn"
                                onClick={() => {
                                  const item = { 
                                    ...submission, 
                                    content: submission.attachment || submission.content,
                                    fileName: submission.fileName || submission.attachmentName,
                                    fileType: submission.fileType || submission.attachmentType
                                  };
                                  handleDownloadFile(item);
                                }}
                                title={isArabic ? 'تحميل' : 'Download'}
                              >
                                <FaDownload size={14} />
                              </Button>
                            )}
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              className="action-btn"
                              onClick={() => {
                                const item = { ...submission, _type: 'submission' };
                                handleDeleteClick(item);
                              }}
                              title={isArabic ? 'حذف' : 'Delete'}
                            >
                              <FaTrash size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>

      {/* ===== VIEW DETAILS MODAL ===== */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg" centered className="modern-modal">
        <Modal.Header closeButton className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Modal.Title style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
            <FaEye className="me-2 text-primary" />
            {selectedItemType === 'pending' 
              ? (isArabic ? 'تفاصيل التقييم (بانتظار المراجعة)' : 'Assessment Details (Pending Review)')
              : selectedItemType === 'submission'
              ? (isArabic ? 'تقديم الطالب' : 'Student Submission')
              : (isArabic ? 'تفاصيل التقييم' : 'Assessment Details')}
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
                        {selectedItem.teacherName || selectedItem.teacher || 'Unknown'}
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
                {/* Student info for submissions */}
                {selectedItemType === 'submission' && (
                  <Row className="mt-2">
                    <Col md={12}>
                      <div className="d-flex align-items-center gap-2">
                        <FaUserGraduate className="text-success" />
                        <span className="fw-semibold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                          {isArabic ? 'الطالب: ' : 'Student: '}
                        </span>
                        <span style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                          {selectedItem.studentName || 'Student'}
                        </span>
                      </div>
                    </Col>
                  </Row>
                )}
                {/* File type info for submissions */}
                {selectedItemType === 'submission' && (selectedItem.fileName || selectedItem.attachmentName) && (
                  <Row className="mt-2">
                    <Col md={12}>
                      <div className="d-flex align-items-center gap-2">
                        <FaFile className="text-info" />
                        <span className="fw-semibold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                          {isArabic ? 'نوع الملف: ' : 'File Type: '}
                        </span>
                        <span style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                          {getFileTypeLabel(selectedItem.fileType || selectedItem.attachmentType)}
                        </span>
                      </div>
                    </Col>
                  </Row>
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
                    maxHeight: '150px',
                    overflowY: 'auto'
                  }}>
                    {selectedItem.description || selectedItem.content}
                  </div>
                </div>
              )}

              {/* Attachment - For Teacher's Assessment */}
              {selectedItem.attachmentName && selectedItemType !== 'submission' && (
                <div className="attachment-section mb-3">
                  <h6 className="fw-bold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                    {isArabic ? 'المرفق:' : 'Attachment:'}
                  </h6>
                  <div className="p-3 rounded-3 d-flex align-items-center gap-3" style={{
                    background: darkMode ? '#2d2d44' : '#f8f9fa',
                    border: `1px solid ${darkMode ? '#3d3d5c' : '#e9ecef'}`,
                    borderRadius: '12px'
                  }}>
                    {getFileIcon(selectedItem.attachmentType).icon}
                    <div>
                      <div className="fw-semibold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                        {selectedItem.attachmentName}
                      </div>
                      <div className="text-muted small">
                        {getFileTypeLabel(selectedItem.attachmentType)}
                      </div>
                    </div>
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      className="ms-auto"
                      onClick={() => handleDownloadFile(selectedItem)}
                      style={{ ...arabicFontStyle, borderRadius: '10px' }}
                    >
                      <FaDownload className="me-1" />
                      {isArabic ? 'تحميل' : 'Download'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Student Submission File */}
              {selectedItemType === 'submission' && (selectedItem.fileName || selectedItem.attachmentName || selectedItem.content || selectedItem.attachment) && (
                <div className="submission-attachment-section mb-3">
                  <h6 className="fw-bold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                    {isArabic ? 'محتوى تقديم الطالب:' : 'Student Submission Content:'}
                  </h6>
                  <div className="p-3 rounded-3" style={{
                    background: darkMode ? '#2d2d44' : '#f8f9fa',
                    border: `1px solid ${darkMode ? '#3d3d5c' : '#e9ecef'}`,
                    borderRadius: '12px'
                  }}>
                    {(selectedItem.fileName || selectedItem.attachmentName) && (
                      <div className="d-flex align-items-center gap-3 mb-2">
                        {getFileIcon(selectedItem.fileType || selectedItem.attachmentType).icon}
                        <div>
                          <div className="fw-semibold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                            {selectedItem.fileName || selectedItem.attachmentName}
                          </div>
                          <div className="text-muted small">
                            {getFileTypeLabel(selectedItem.fileType || selectedItem.attachmentType)}
                          </div>
                        </div>
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          className="ms-auto"
                          onClick={() => {
                            const item = { 
                              ...selectedItem, 
                              content: selectedItem.attachment || selectedItem.content,
                              fileName: selectedItem.fileName || selectedItem.attachmentName,
                              fileType: selectedItem.fileType || selectedItem.attachmentType
                            };
                            handleDownloadFile(item);
                          }}
                          style={{ ...arabicFontStyle, borderRadius: '10px' }}
                        >
                          <FaDownload className="me-1" />
                          {isArabic ? 'تحميل' : 'Download'}
                        </Button>
                      </div>
                    )}
                    {selectedItem.content && selectedItem.content.length > 0 && (
                      <div className="mt-2 p-2 rounded-3" style={{
                        background: darkMode ? '#1a1a2e' : '#ffffff',
                        border: `1px solid ${darkMode ? '#3d3d5c' : '#e9ecef'}`,
                        borderRadius: '8px',
                        ...arabicFontStyle,
                        color: darkMode ? '#e9ecef' : '#212529',
                        maxHeight: '150px',
                        overflowY: 'auto',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {selectedItem.content}
                      </div>
                    )}
                    {selectedItem.attachment && selectedItem.attachment.length > 0 && !selectedItem.fileName && !selectedItem.content && (
                      <div className="text-center py-3">
                        <Badge bg="info" style={{ fontSize: '0.9rem' }}>
                          <FaFile className="me-2" />
                          {isArabic ? 'يوجد ملف مرفق' : 'File attached'}
                        </Badge>
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          className="ms-2"
                          onClick={() => {
                            const item = { 
                              ...selectedItem, 
                              content: selectedItem.attachment,
                              fileName: 'attachment'
                            };
                            handleDownloadFile(item);
                          }}
                          style={{ ...arabicFontStyle, borderRadius: '10px' }}
                        >
                          <FaDownload className="me-1" />
                          {isArabic ? 'تحميل' : 'Download'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Status Info */}
              {selectedItem.status && (
                <div className="status-info mt-3 p-3 rounded-3" style={{
                  background: selectedItem.status === 'approved' || selectedItem.status === 'sent_to_students' ? '#d4edda' : 
                             selectedItem.status === 'rejected' ? '#f8d7da' : 
                             selectedItem.status === 'pending' || selectedItem.status === 'pending_approval' ? '#fff3cd' : 
                             '#e2e3e5',
                  border: `1px solid ${selectedItem.status === 'approved' || selectedItem.status === 'sent_to_students' ? '#c3e6cb' : 
                             selectedItem.status === 'rejected' ? '#f5c6cb' : 
                             selectedItem.status === 'pending' || selectedItem.status === 'pending_approval' ? '#ffeaa7' : 
                             '#d6d8db'}`,
                  borderRadius: '12px'
                }}>
                  <div className="d-flex align-items-center gap-2">
                    <Badge bg={getStatusBadge(selectedItem.status)}>
                      {getStatusLabel(selectedItem.status)}
                    </Badge>
                    <span className="fw-semibold" style={{ 
                      color: selectedItem.status === 'approved' || selectedItem.status === 'sent_to_students' ? '#155724' : 
                             selectedItem.status === 'rejected' ? '#721c24' : 
                             selectedItem.status === 'pending' || selectedItem.status === 'pending_approval' ? '#856404' : 
                             '#383d41'
                    }}>
                      {selectedItem.status === 'approved' ? (isArabic ? '✅ تم الموافقة على هذا التقييم' : '✅ This assessment has been approved') :
                       selectedItem.status === 'sent_to_students' ? (isArabic ? '✅ تم إرسال هذا التقييم للطلاب' : '✅ This assessment has been sent to students') :
                       selectedItem.status === 'rejected' ? (isArabic ? '❌ تم رفض هذا التقييم' : '❌ This assessment has been rejected') :
                       selectedItem.status === 'pending' || selectedItem.status === 'pending_approval' ? (isArabic ? '⏳ بانتظار المراجعة' : '⏳ Pending review') :
                       (isArabic ? '📋 الحالة: ' : 'Status: ') + getStatusLabel(selectedItem.status)}
                    </span>
                  </div>
                  {selectedItem.reviewedAt && (
                    <div className="mt-1 text-muted small" style={{ 
                      color: selectedItem.status === 'approved' || selectedItem.status === 'sent_to_students' ? '#155724' : 
                             selectedItem.status === 'rejected' ? '#721c24' : 
                             '#383d41'
                    }}>
                      {isArabic ? 'تاريخ المراجعة: ' : 'Reviewed at: '}
                      {formatDate(selectedItem.reviewedAt)}
                    </div>
                  )}
                  {selectedItem.sentAt && (
                    <div className="mt-1 text-muted small">
                      {isArabic ? 'تاريخ الإرسال: ' : 'Sent at: '}
                      {formatDate(selectedItem.sentAt)}
                    </div>
                  )}
                  {/* Submission date for student submissions */}
                  {selectedItemType === 'submission' && selectedItem.submittedAt && (
                    <div className="mt-1 text-muted small">
                      {isArabic ? 'تاريخ التقديم: ' : 'Submitted at: '}
                      {formatDate(selectedItem.submittedAt)}
                    </div>
                  )}
                  {/* Student info for submissions */}
                  {selectedItemType === 'submission' && (
                    <div className="mt-2">
                      <Badge bg="info" style={{ fontSize: '0.7rem' }}>
                        <FaInfoCircle className="me-1" />
                        {isArabic 
                          ? 'هذا التقديم مرسل مباشرة من الطالب إلى المعلم' 
                          : 'This submission is sent directly from student to teacher'}
                      </Badge>
                    </div>
                  )}
                </div>
              )}

              {/* Action buttons for pending */}
              {selectedItemType === 'pending' && selectedItem.status === 'pending' && (
                <div className="action-section mt-3 d-flex gap-2 justify-content-end">
                  <Button 
                    variant="danger" 
                    onClick={() => handleReject(selectedItem)}
                    disabled={actionLoading}
                    style={{ ...arabicFontStyle, borderRadius: '12px' }}
                  >
                    <FaTimes className="me-2" />
                    {isArabic ? 'رفض' : 'Reject'}
                  </Button>
                  <Button 
                    variant="success" 
                    onClick={() => handleApprove(selectedItem)}
                    disabled={actionLoading}
                    style={{ ...arabicFontStyle, borderRadius: '12px' }}
                  >
                    {actionLoading ? (
                      <>
                        <FaSpinner className="spinning me-2" />
                        {isArabic ? 'جاري...' : 'Processing...'}
                      </>
                    ) : (
                      <>
                        <FaCheck className="me-2" />
                        {isArabic ? 'موافقة' : 'Approve'}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Button variant="secondary" onClick={() => setShowViewModal(false)} style={{ ...arabicFontStyle, borderRadius: '12px' }}>
            {isArabic ? 'إغلاق' : 'Close'}
          </Button>
          {selectedItem && (
            <Button 
              variant="danger" 
              onClick={() => {
                setShowViewModal(false);
                const item = { ...selectedItem, _type: selectedItemType };
                handleDeleteClick(item);
              }}
              style={{ ...arabicFontStyle, borderRadius: '12px' }}
            >
              <FaTrash className="me-1" /> {isArabic ? 'حذف' : 'Delete'}
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* ===== DELETE CONFIRMATION MODAL ===== */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered className="modern-modal">
        <Modal.Header closeButton className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Modal.Title style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
            <FaExclamationTriangle className="me-2 text-danger" />
            {isArabic ? 'تأكيد الحذف' : 'Confirm Delete'}
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
              ? `هل أنت متأكد من حذف هذا العنصر؟`
              : `Are you sure you want to delete this item?`}
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
              {itemToDelete.studentName && (
                <div className="mt-1 d-flex align-items-center gap-2">
                  <FaUserGraduate className="text-success" size={12} />
                  <span className="text-muted small">
                    {isArabic ? 'الطالب: ' : 'Student: '}
                    {itemToDelete.studentName}
                  </span>
                </div>
              )}
              {itemToDelete.type && (
                <div className="mt-1 d-flex align-items-center gap-2">
                  <FaFileAlt className="text-warning" size={12} />
                  <span className="text-muted small">
                    {isArabic ? 'النوع: ' : 'Type: '}
                    {getTypeLabel(itemToDelete.type)}
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
                <FaTrash className="me-1" /> {isArabic ? 'تأكيد الحذف' : 'Confirm Delete'}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .admin-assessments {
          padding: 0;
          max-width: 100vw;
          overflow-x: hidden;
        }

        .admin-assessments * {
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

        .nav-tabs .nav-link {
          border: none;
          padding: 12px 20px;
          transition: all 0.3s ease;
        }

        .nav-tabs .nav-link:hover {
          background: transparent;
          color: #4a9eff;
        }

        .nav-tabs .nav-link.active {
          background: transparent;
          border: none;
          color: #4a9eff;
        }

        .badge-clickable {
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .badge-clickable:hover {
          opacity: 0.8;
          transform: scale(1.05);
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
          .nav-tabs .nav-link {
            padding: 8px 10px;
            font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminAssessments;