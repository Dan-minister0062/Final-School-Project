// src/components/dashboard/student/StudentAnnouncements.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Container, Row, Col, Card, Badge, Button, Form, 
  InputGroup, Alert, Spinner, Pagination, Nav, Tab,
  Modal, Dropdown, ProgressBar
} from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaBell, FaBullhorn, FaCalendarAlt, FaClock, FaUser,
  FaEnvelope, FaCheckCircle, FaTimesCircle, FaExclamationTriangle,
  FaSearch, FaFilter, FaSort, FaEye, FaShare, FaBookmark,
  FaRegBookmark, FaThumbsUp, FaComment, FaPaperPlane,
  FaArrowRight, FaArrowLeft, FaSync, FaDownload,
  FaPrint, FaFile, FaImage, FaVideo, FaTag, FaUsers,
  FaStar, FaRegStar, FaInfoCircle, FaNewspaper,
  FaGraduationCap, FaChalkboardTeacher, FaUserGraduate,
  FaTrash, FaTrashAlt, FaCheckDouble, FaSpinner,
  FaTimes, FaFileAlt, FaBook, FaUpload, FaFilePdf, FaFileWord, FaFileImage,
  FaFileExcel, FaFilePowerpoint, FaFileCode, FaList, FaThList
} from 'react-icons/fa';
import { format, formatDistanceToNow, formatDistanceToNowStrict } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

// ===== FIXED IMPORT PATHS =====
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../hooks/useAuth';
import { useNotification } from '../../../hooks/useNotification';
import {
  getTranslation,
  getAnnouncementTitle,
  getAnnouncementContent,
  getAnnouncementTranslation,
  getAnnouncementKeys,
  getAllAnnouncements
} from '../../../utils/translations';

// ===== HELPER FUNCTIONS =====
const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  return num.toString();
};

// ===== GET FILE ICON =====
const getFileIconHelper = (fileType) => {
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
const getFileTypeLabelHelper = (fileType) => {
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

const getAnnouncementsFromStorage = () => {
  try {
    const stored = localStorage.getItem('announcements');
    if (stored) {
      const data = JSON.parse(stored);
      return Array.isArray(data) ? data : [];
    }
    return [];
  } catch (error) {
    console.error('Error getting announcements:', error);
    return [];
  }
};

const getNotificationsFromStorage = () => {
  try {
    const stored = localStorage.getItem('school_notifications');
    if (stored) {
      const data = JSON.parse(stored);
      return Array.isArray(data) ? data : [];
    }
    return [];
  } catch (error) {
    console.error('Error getting notifications:', error);
    return [];
  }
};

const saveNotificationsToStorage = (notifications) => {
  try {
    localStorage.setItem('school_notifications', JSON.stringify(notifications));
    return true;
  } catch (error) {
    console.error('Error saving notifications:', error);
    return false;
  }
};

const saveAnnouncementsToStorage = (announcements) => {
  try {
    localStorage.setItem('announcements', JSON.stringify(announcements));
    return true;
  } catch (error) {
    console.error('Error saving announcements:', error);
    return false;
  }
};

// ===== GET STUDENT ID =====
const getStudentId = (user) => {
  if (user?.id) return user.id;
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  return currentUser.id || currentUser.studentId;
};

// ===== GET TYPE LABELS =====
const getTypeLabel = (type, isArabic) => {
  const labels = {
    'homework': isArabic ? 'واجب منزلي' : 'Homework',
    'assignment': isArabic ? 'مشروع' : 'Assignment',
    'test': isArabic ? 'اختبار' : 'Test',
    'exam': isArabic ? 'امتحان' : 'Exam',
    'project': isArabic ? 'مشروع' : 'Project',
    'classwork': isArabic ? 'عمل صفي' : 'Classwork'
  };
  return labels[type] || type;
};

const getTypeIcon = (type) => {
  const icons = {
    'homework': <FaBook />,
    'assignment': <FaFileAlt />,
    'test': <FaCheckCircle />,
    'exam': <FaStar />,
    'project': <FaShare />,
    'classwork': <FaUsers />
  };
  return icons[type] || <FaBullhorn />;
};

const getTypeColor = (type) => {
  const colors = {
    'homework': '#4a9eff',
    'assignment': '#9b59b6',
    'test': '#f39c12',
    'exam': '#e74c3c',
    'project': '#2ecc71',
    'classwork': '#1abc9c'
  };
  return colors[type] || '#6c757d';
};

const getPriorityLabel = (priority, isArabic) => {
  const labels = {
    'high': isArabic ? 'عالي' : 'High',
    'medium': isArabic ? 'متوسط' : 'Medium',
    'low': isArabic ? 'منخفض' : 'Low'
  };
  return labels[priority] || priority;
};

const getPriorityColor = (priority) => {
  const colors = {
    'high': '#e74c3c',
    'medium': '#f39c12',
    'low': '#2ecc71'
  };
  return colors[priority] || '#6c757d';
};

const StudentAnnouncements = () => {
  const { isArabic, language } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notify } = useNotification();
  const notificationSound = useRef(null);

  // ===== STATE =====
  const [announcements, setAnnouncements] = useState([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [teacherAssessments, setTeacherAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(6);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemType, setSelectedItemType] = useState('announcement');
  const [unreadCount, setUnreadCount] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState('assessments');
  const [sortBy, setSortBy] = useState('newest');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionFile, setSubmissionFile] = useState(null);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [submissionFilter, setSubmissionFilter] = useState('all'); // 'all', 'submitted', 'pending'

  // ===== DELETE MODAL STATE =====
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  // ===== ARABIC FONT STYLE =====
  const arabicFontStyle = {
    fontFamily: isArabic ? '"Hacen Tunisia", "Hacen Tunisia Bd", "Noto Sans Arabic", "Vazirmatn", "Traditional Arabic", "Arabic Typesetting", serif' : 'inherit',
    lineHeight: isArabic ? '1.8' : '1.6',
    letterSpacing: isArabic ? '0.5px' : '0px',
    fontSize: isArabic ? 'clamp(0.95rem, 1.2vw, 1.1rem)' : 'clamp(0.9rem, 1.1vw, 1.05rem)',
  };

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

  // ===== TYPE & PRIORITY OPTIONS =====
  const typeOptions = [
    { value: 'all', label: isArabic ? 'الكل' : 'All' },
    { value: 'announcement', label: isArabic ? 'إعلان' : 'Announcement', icon: <FaBullhorn />, color: '#c49a6c' },
    { value: 'event', label: isArabic ? 'حدث' : 'Event', icon: <FaCalendarAlt />, color: '#2ecc71' },
    { value: 'meeting', label: isArabic ? 'اجتماع' : 'Meeting', icon: <FaUsers />, color: '#f39c12' },
    { value: 'exam', label: isArabic ? 'امتحان' : 'Exam', icon: <FaCheckCircle />, color: '#e74c3c' },
    { value: 'news', label: isArabic ? 'خبر' : 'News', icon: <FaNewspaper />, color: '#9b59b6' },
    { value: 'assessment', label: isArabic ? 'تقييم' : 'Assessment', icon: <FaFileAlt />, color: '#4a9eff' },
  ];

  const priorityOptions = [
    { value: 'all', label: isArabic ? 'الكل' : 'All' },
    { value: 'high', label: isArabic ? 'عالي' : 'High', color: '#e74c3c' },
    { value: 'medium', label: isArabic ? 'متوسط' : 'Medium', color: '#f39c12' },
    { value: 'low', label: isArabic ? 'منخفض' : 'Low', color: '#2ecc71' }
  ];

  const statusOptions = [
    { value: 'all', label: isArabic ? 'الكل' : 'All' },
    { value: 'read', label: isArabic ? 'مقروء' : 'Read', color: '#2ecc71' },
    { value: 'unread', label: isArabic ? 'غير مقروء' : 'Unread', color: '#e74c3c' }
  ];

  // ===== SUBMISSION FILTER OPTIONS =====
  const submissionFilterOptions = [
    { value: 'all', label: isArabic ? 'جميع التقييمات' : 'All Assessments' },
    { value: 'pending', label: isArabic ? 'غير مقدم' : 'Not Submitted' },
    { value: 'submitted', label: isArabic ? 'مقدم' : 'Submitted' },
    { value: 'graded', label: isArabic ? 'مصحح' : 'Graded' }
  ];

  // ===== GET TYPE LABELS =====
  const getTypeLabelLocal = (type) => {
    const found = typeOptions.find(t => t.value === type);
    return found ? found.label : type;
  };

  const getTypeIconLocal = (type) => {
    const found = typeOptions.find(t => t.value === type);
    return found ? found.icon : <FaBullhorn />;
  };

  const getTypeColorLocal = (type) => {
    const found = typeOptions.find(t => t.value === type);
    return found ? found.color : '#6c757d';
  };

  const getPriorityLabelLocal = (priority) => {
    const found = priorityOptions.find(p => p.value === priority);
    return found ? found.label : priority;
  };

  const getPriorityColorLocal = (priority) => {
    const found = priorityOptions.find(p => p.value === priority);
    return found ? found.color : '#6c757d';
  };

  // ===== GET TRANSLATED CONTENT =====
  const getTranslatedTitle = (item) => {
    if (!item) return '';
    if (item.translationKey) {
      const translation = getAnnouncementTranslation(item.translationKey, language);
      if (translation.title !== item.translationKey) {
        return translation.title;
      }
    }
    return isArabic ? (item.titleAr || item.title) : item.title;
  };

  const getTranslatedContent = (item) => {
    if (!item) return '';
    if (item.translationKey) {
      const translation = getAnnouncementTranslation(item.translationKey, language);
      if (translation.content !== item.translationKey) {
        return translation.content;
      }
    }
    return isArabic ? (item.contentAr || item.content) : item.content;
  };

  // ===== LOAD TEACHER ASSESSMENTS =====
  const loadTeacherAssessments = () => {
    try {
      const studentId = getStudentId(user);
      if (!studentId) return [];

      const studentAssessments = JSON.parse(localStorage.getItem('student_assessments') || '[]');
      const myAssessments = studentAssessments.filter(a => a.studentId === studentId);
      
      const unreadAssessments = myAssessments.filter(a => !a.read);
      setUnreadCount(prev => prev + unreadAssessments.length);
      
      return myAssessments;
    } catch (error) {
      console.error('Error loading teacher assessments:', error);
      return [];
    }
  };

  // ===== LOAD DATA =====
  const loadData = () => {
    setLoading(true);
    try {
      const allAnnouncements = getAnnouncementsFromStorage();
      const publishedAnnouncements = allAnnouncements.filter(a => a.status === 'published' && a.isActive !== false);
      
      const assessments = loadTeacherAssessments();
      setTeacherAssessments(assessments);
      
      const assessmentItems = assessments.map(a => ({
        id: `assess_${a.id}`,
        type: 'assessment',
        title: a.title,
        titleAr: a.title,
        content: a.description || '',
        contentAr: a.description || '',
        date: a.sentAt || new Date().toISOString(),
        priority: 'high',
        author: a.teacherName || 'Teacher',
        status: 'published',
        isActive: true,
        isRead: a.read || false,
        views: 0,
        likes: 0,
        assessmentData: a,
        attachment: a.attachment,
        attachmentName: a.attachmentName,
        attachmentType: a.attachmentType,
        dueDate: a.dueDate,
        totalMarks: a.totalMarks,
        subject: a.subject,
        className: a.className,
        teacherName: a.teacherName,
        assessmentStatus: a.status || 'pending',
        submitted: a.submitted || false,
        grade: a.grade || null,
        gradedAt: a.gradedAt || null
      }));
      
      const combinedItems = [...publishedAnnouncements, ...assessmentItems];
      
      const sortedItems = combinedItems.sort((a, b) => {
        const dateA = new Date(a.date || a.createdAt || a.sentAt);
        const dateB = new Date(b.date || b.createdAt || b.sentAt);
        if (sortBy === 'newest') return dateB - dateA;
        if (sortBy === 'oldest') return dateA - dateB;
        if (sortBy === 'popular') return (b.views || 0) - (a.views || 0);
        return dateB - dateA;
      });
      
      setAnnouncements(sortedItems);
      applyFilters(sortedItems);
    } catch (error) {
      console.error('Error loading data:', error);
      if (notify) {
        notify(isArabic ? 'فشل في تحميل البيانات' : 'Failed to load data', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // ===== APPLY FILTERS =====
  const applyFilters = (data = announcements) => {
    let filtered = [...data];
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(a =>
        (a.title || '').toLowerCase().includes(searchLower) ||
        (a.titleAr || '').toLowerCase().includes(searchLower) ||
        (a.content || '').toLowerCase().includes(searchLower) ||
        (a.contentAr || '').toLowerCase().includes(searchLower) ||
        (a.author || '').toLowerCase().includes(searchLower) ||
        (a.teacherName || '').toLowerCase().includes(searchLower)
      );
    }
    
    if (filterType !== 'all') {
      filtered = filtered.filter(a => a.type === filterType);
    }
    
    if (filterPriority !== 'all') {
      filtered = filtered.filter(a => a.priority === filterPriority);
    }
    
    if (filterStatus !== 'all') {
      if (filterStatus === 'read') {
        filtered = filtered.filter(a => a.isRead === true);
      } else if (filterStatus === 'unread') {
        filtered = filtered.filter(a => !a.isRead);
      }
    }
    
    // Apply submission filter for assessments
    if (submissionFilter !== 'all' && activeTab === 'assessments') {
      filtered = filtered.filter(a => {
        if (a.type !== 'assessment') return false;
        if (submissionFilter === 'submitted') return a.submitted === true;
        if (submissionFilter === 'pending') return a.submitted === false && !a.grade;
        if (submissionFilter === 'graded') return a.grade !== null && a.grade !== undefined;
        return true;
      });
    }
    
    setTotalItems(filtered.length);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginated = filtered.slice(start, end);
    setFilteredAnnouncements(paginated);
  };

  // ===== EFFECTS =====
  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [announcements, searchTerm, filterType, filterPriority, filterStatus, currentPage, submissionFilter, activeTab]);

  // ===== LISTEN FOR NEW NOTIFICATIONS =====
  useEffect(() => {
    const handleNewNotification = (event) => {
      const detail = event.detail;
      if (detail) {
        const isForStudent = detail.targetAudience?.includes('all') || 
                            detail.targetAudience?.includes('students');
        if (isForStudent) {
          setNotifications(prev => {
            const updated = [{
              ...detail,
              read: false,
              createdAt: new Date().toISOString()
            }, ...prev];
            return updated;
          });
          setUnreadCount(prev => prev + 1);
          playNotificationSound();
          if (notify) {
            notify(
              isArabic ? `📢 إعلان جديد: ${detail.titleAr || detail.title}` : 
              `📢 New Announcement: ${detail.title}`,
              'info'
            );
          }
        }
      }
    };

    const handleAnnouncementAdded = (event) => {
      const detail = event.detail;
      if (detail && detail.announcement) {
        const ann = detail.announcement;
        if (ann.status === 'published' && ann.isActive !== false) {
          const targetAudience = ann.targetAudience || [];
          if (targetAudience.includes('all') || targetAudience.includes('students')) {
            setAnnouncements(prev => [ann, ...prev]);
          }
        }
      }
    };

    const handleStudentAssessmentsUpdated = () => {
      loadData();
    };

    window.addEventListener('newNotification', handleNewNotification);
    window.addEventListener('announcementsUpdated', loadData);
    window.addEventListener('announcementAdded', handleAnnouncementAdded);
    window.addEventListener('studentAssessmentsUpdated', handleStudentAssessmentsUpdated);

    return () => {
      window.removeEventListener('newNotification', handleNewNotification);
      window.removeEventListener('announcementsUpdated', loadData);
      window.removeEventListener('announcementAdded', handleAnnouncementAdded);
      window.removeEventListener('studentAssessmentsUpdated', handleStudentAssessmentsUpdated);
    };
  }, []);

  // ===== PLAY NOTIFICATION SOUND =====
  const playNotificationSound = () => {
    try {
      if (notificationSound.current) {
        notificationSound.current.play().catch(() => {});
      }
    } catch (error) {
      console.log('Sound play error:', error);
    }
  };

  // ===== MARK NOTIFICATION AS READ =====
  const markAsRead = (notificationId) => {
    const updatedNotifications = notifications.map(n => {
      if (n.id === notificationId) {
        return { ...n, read: true };
      }
      return n;
    });
    setNotifications(updatedNotifications);
    
    const unread = updatedNotifications.filter(n => !n.read).length;
    setUnreadCount(unread);
    
    const allNotifications = getNotificationsFromStorage();
    const updatedAll = allNotifications.map(n => {
      if (n.id === notificationId) {
        return { ...n, read: true };
      }
      return n;
    });
    saveNotificationsToStorage(updatedAll);
  };

  // ===== MARK ALL NOTIFICATIONS AS READ =====
  const markAllNotificationsAsRead = () => {
    const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updatedNotifications);
    setUnreadCount(0);
    
    const allNotifications = getNotificationsFromStorage();
    const updatedAll = allNotifications.map(n => {
      if (n.targetAudience && (n.targetAudience.includes('all') || n.targetAudience.includes('students'))) {
        return { ...n, read: true };
      }
      return n;
    });
    saveNotificationsToStorage(updatedAll);
    
    if (notify) {
      notify(isArabic ? 'تم تحديد الكل كمقروء' : 'All marked as read', 'success');
    }
  };

  // ===== DELETE SINGLE ANNOUNCEMENT =====
  const handleDeleteClick = (item, e) => {
    e.stopPropagation();
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    if (!itemToDelete) return;
    
    setDeleting(true);
    try {
      if (itemToDelete.type === 'assessment' && itemToDelete.assessmentData) {
        const studentAssessments = JSON.parse(localStorage.getItem('student_assessments') || '[]');
        const updatedAssessments = studentAssessments.filter(a => a.id !== itemToDelete.assessmentData.id);
        localStorage.setItem('student_assessments', JSON.stringify(updatedAssessments));
        
        const schoolSubmissions = JSON.parse(localStorage.getItem('school_submissions') || '[]');
        const updatedSubmissions = schoolSubmissions.filter(s => s.studentId === getStudentId(user) && s.assessmentId !== itemToDelete.assessmentData.assessmentId);
        localStorage.setItem('school_submissions', JSON.stringify(updatedSubmissions));
        
        setTeacherAssessments(prev => prev.filter(a => a.id !== itemToDelete.assessmentData.id));
        setAnnouncements(prev => prev.filter(a => a.id !== itemToDelete.id));
        
        notify(
          isArabic ? '✅ تم حذف التقييم بنجاح' : '✅ Assessment deleted successfully',
          'success'
        );
      } else {
        const allAnnouncements = getAnnouncementsFromStorage();
        const updatedAnnouncements = allAnnouncements.filter(a => a.id !== itemToDelete.id);
        saveAnnouncementsToStorage(updatedAnnouncements);
        
        const allNotifications = getNotificationsFromStorage();
        const updatedNotifications = allNotifications.filter(n => n.announcementId !== itemToDelete.id);
        saveNotificationsToStorage(updatedNotifications);
        
        setAnnouncements(prev => prev.filter(a => a.id !== itemToDelete.id));
        
        notify(
          isArabic ? '✅ تم حذف الإعلان بنجاح' : '✅ Announcement deleted successfully',
          'success'
        );
      }
      
      setShowDeleteModal(false);
      setItemToDelete(null);
      loadData();
      
    } catch (error) {
      console.error('Error deleting item:', error);
      if (notify) {
        notify(
          isArabic ? '❌ فشل في حذف العنصر' : '❌ Failed to delete item',
          'error'
        );
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setItemToDelete(null);
    setDeleting(false);
  };

  // ===== DELETE ALL ANNOUNCEMENTS =====
  const handleDeleteAll = () => {
    const confirmDeleteAll = window.confirm(
      isArabic 
        ? 'هل أنت متأكد من حذف جميع الإعلانات؟ هذا الإجراء لا يمكن التراجع عنه.'
        : 'Are you sure you want to delete all announcements? This action cannot be undone.'
    );
    
    if (!confirmDeleteAll) return;
    
    setDeletingAll(true);
    try {
      const allAnnouncements = getAnnouncementsFromStorage();
      const studentAnnouncements = allAnnouncements.filter(a => {
        const targetAudience = a.targetAudience || [];
        return targetAudience.includes('all') || targetAudience.includes('students');
      });
      
      const updatedAnnouncements = allAnnouncements.filter(a => {
        const targetAudience = a.targetAudience || [];
        return !(targetAudience.includes('all') || targetAudience.includes('students'));
      });
      
      saveAnnouncementsToStorage(updatedAnnouncements);
      
      const allNotifications = getNotificationsFromStorage();
      const updatedNotifications = allNotifications.filter(n => {
        const isStudent = n.targetAudience?.includes('all') || n.targetAudience?.includes('students');
        return !isStudent;
      });
      saveNotificationsToStorage(updatedNotifications);
      
      setAnnouncements(prev => prev.filter(a => {
        const targetAudience = a.targetAudience || [];
        return !(targetAudience.includes('all') || targetAudience.includes('students'));
      }));
      
      if (notify) {
        notify(
          isArabic ? `تم حذف جميع الإعلانات (${studentAnnouncements.length})` : `Deleted all announcements (${studentAnnouncements.length})`,
          'success'
        );
      }
      
      loadData();
      
    } catch (error) {
      console.error('Error deleting all announcements:', error);
      if (notify) {
        notify(
          isArabic ? 'فشل في حذف جميع الإعلانات' : 'Failed to delete all announcements',
          'error'
        );
      }
    } finally {
      setDeletingAll(false);
    }
  };

  // ===== VIEW ANNOUNCEMENT =====
  const viewAnnouncement = (item) => {
    setSelectedItem(item);
    setSelectedItemType(item.type || 'announcement');
    setShowViewModal(true);
    
    if (item.type === 'assessment' && item.assessmentData) {
      try {
        const studentAssessments = JSON.parse(localStorage.getItem('student_assessments') || '[]');
        const updated = studentAssessments.map(a => {
          if (a.id === item.assessmentData.id) {
            return { ...a, read: true };
          }
          return a;
        });
        localStorage.setItem('student_assessments', JSON.stringify(updated));
        setSelectedItem({ ...item, isRead: true });
      } catch (e) {}
    }
    
    if (item.type !== 'assessment') {
      const allAnnouncements = getAnnouncementsFromStorage();
      const updatedAnnouncements = allAnnouncements.map(a => {
        if (a.id === item.id) {
          return { ...a, views: (a.views || 0) + 1 };
        }
        return a;
      });
      saveAnnouncementsToStorage(updatedAnnouncements);
      
      const updatedItem = { ...item, views: (item.views || 0) + 1 };
      setSelectedItem(updatedItem);
      setAnnouncements(prev => prev.map(a => a.id === item.id ? updatedItem : a));
    }
  };

  // ===== HANDLE SUBMIT ASSESSMENT =====
  const handleSubmitAssessment = (assessment) => {
    setSelectedAssessment(assessment);
    setSubmissionText('');
    setSubmissionFile(null);
    setShowSubmitModal(true);
  };

  const handleSubmissionSubmit = () => {
    if (!submissionText && !submissionFile) {
      notify(
        isArabic ? 'يرجى إدخال نص أو تحميل ملف' : 'Please enter text or upload a file',
        'warning'
      );
      return;
    }

    setSubmitting(true);
    try {
      const studentId = getStudentId(user);
      const studentAssessments = JSON.parse(localStorage.getItem('student_assessments') || '[]');
      
      const updated = studentAssessments.map(a => {
        if (a.id === selectedAssessment.assessmentData.id && a.studentId === studentId) {
          return {
            ...a,
            status: 'submitted',
            submittedAt: new Date().toISOString(),
            submissionContent: submissionText || '',
            submissionFileType: submissionFile?.type || null,
            submissionFileName: submissionFile?.name || null,
            read: true,
            submitted: true
          };
        }
        return a;
      });
      
      localStorage.setItem('student_assessments', JSON.stringify(updated));
      
      const schoolSubmissions = JSON.parse(localStorage.getItem('school_submissions') || '[]');
      const filteredSubmissions = schoolSubmissions.filter(
        s => !(s.assessmentId === selectedAssessment.assessmentData.assessmentId && s.studentId === studentId)
      );
      
      filteredSubmissions.push({
        id: `SUB_${Date.now()}`,
        assessmentId: selectedAssessment.assessmentData.assessmentId || selectedAssessment.assessmentData.id,
        studentId: studentId,
        studentName: user?.name || 'Student',
        teacherName: selectedAssessment.teacherName || selectedAssessment.assessmentData.teacherName,
        subject: selectedAssessment.subject || selectedAssessment.assessmentData.subject,
        className: selectedAssessment.className || selectedAssessment.assessmentData.className,
        type: selectedAssessment.type || selectedAssessment.assessmentData.type,
        title: selectedAssessment.title || selectedAssessment.assessmentData.title,
        content: submissionText || '',
        fileType: submissionFile?.type || null,
        fileName: submissionFile?.name || null,
        submittedAt: new Date().toISOString(),
        forwardedToTeacher: false,
        forwardedAt: null
      });
      localStorage.setItem('school_submissions', JSON.stringify(filteredSubmissions));
      
      const adminNotifications = JSON.parse(localStorage.getItem('admin_notifications') || '[]');
      adminNotifications.push({
        id: `ADMIN_NOTIF_${Date.now()}`,
        type: 'submission',
        title: isArabic ? `📤 تقديم جديد من طالب` : '📤 New student submission',
        message: isArabic 
          ? `الطالب ${user?.name || 'Student'} قدم: ${selectedAssessment.title}`
          : `Student ${user?.name || 'Student'} submitted: ${selectedAssessment.title}`,
        studentName: user?.name || 'Student',
        studentId: studentId,
        assessmentId: selectedAssessment.assessmentData.assessmentId || selectedAssessment.assessmentData.id,
        submissionId: `SUB_${Date.now()}`,
        read: false,
        createdAt: new Date().toISOString(),
        link: '/dashboard/admin/assessments'
      });
      localStorage.setItem('admin_notifications', JSON.stringify(adminNotifications));
      
      notify(
        isArabic ? '✅ تم إرسال التقييم بنجاح، في انتظار مراجعة الإدارة' : '✅ Assessment submitted successfully, waiting for admin review',
        'success'
      );
      
      setShowSubmitModal(false);
      loadData();
      
      window.dispatchEvent(new CustomEvent('submissionChanged', { 
        detail: { 
          assessmentId: selectedAssessment.assessmentData.assessmentId || selectedAssessment.assessmentData.id,
          studentId: studentId
        }
      }));
      window.dispatchEvent(new CustomEvent('notificationAdded', { 
        detail: { type: 'submission', studentName: user?.name || 'Student' }
      }));
      window.dispatchEvent(new CustomEvent('studentAssessmentsUpdated'));
      
    } catch (error) {
      console.error('Error submitting assessment:', error);
      notify(
        isArabic ? '❌ حدث خطأ أثناء الإرسال' : '❌ Error submitting assessment',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ===== HANDLE DOWNLOAD ATTACHMENT =====
  const handleDownloadAttachment = (item) => {
    if (!item.attachment && !item.attachmentName) {
      notify(
        isArabic ? 'لا يوجد ملف للتحميل' : 'No file to download',
        'warning'
      );
      return;
    }

    try {
      const fileName = item.attachmentName || 'file';
      const fileType = item.attachmentType || 'text/plain';
      const fileContent = item.attachment || '';
      
      const mimeType = getMimeType(fileName, fileType);
      
      if (fileContent && typeof fileContent === 'string' && fileContent.startsWith('data:')) {
        const base64Data = fileContent.split(',')[1] || fileContent;
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
      
      const info = `File: ${fileName}\nType: ${getFileTypeLabelHelper(fileType)}\n\nThis is a placeholder. The actual file content is stored in the system.`;
      const blob = new Blob([info], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      notify(
        isArabic ? '✅ تم تحميل الملف (نسخة نصية)' : '✅ File downloaded (text version)',
        'success'
      );
      
    } catch (err) {
      console.error('Error downloading attachment:', err);
      notify(
        isArabic ? '❌ حدث خطأ أثناء التحميل' : '❌ Error downloading',
        'error'
      );
    }
  };

  // ===== RENDER NOTIFICATION CARD =====
  const renderNotificationCard = (notification) => {
    const isUnread = !notification.read;
    const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { 
      addSuffix: true,
      locale: isArabic ? ar : enUS
    });
    
    const title = isArabic ? (notification.titleAr || notification.title) : notification.title;
    const message = isArabic ? (notification.messageAr || notification.message) : notification.message;
    
    return (
      <div 
        key={notification.id} 
        className={`notification-item ${isUnread ? 'unread' : 'read'}`}
        style={{
          background: darkMode ? '#1a1a2e' : '#ffffff',
          border: `1px solid ${isUnread ? '#c49a6c' : darkMode ? '#2d2d44' : '#e9ecef'}`,
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '12px',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          borderLeft: isUnread ? '4px solid #c49a6c' : '4px solid transparent'
        }}
        onClick={() => {
          markAsRead(notification.id);
          if (notification.link) {
            navigate(notification.link);
          }
        }}
      >
        <div className="d-flex justify-content-between align-items-start">
          <div className="d-flex align-items-start gap-3">
            <div 
              className="notification-icon"
              style={{
                background: isUnread ? 'rgba(196, 154, 108, 0.15)' : 'rgba(108, 117, 125, 0.1)',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: isUnread ? '#c49a6c' : '#6c757d'
              }}
            >
              {notification.type === 'announcement' ? <FaBullhorn /> :
               notification.type === 'event' ? <FaCalendarAlt /> :
               notification.type === 'exam' ? <FaCheckCircle /> :
               notification.type === 'meeting' ? <FaUsers /> :
               notification.type === 'assessment' ? <FaFileAlt /> :
               notification.type === 'submission' ? <FaUpload /> :
               <FaBell />}
            </div>
            <div className="flex-grow-1">
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <h6 className="mb-0 fw-bold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                  {title}
                </h6>
                {isUnread && (
                  <Badge style={{ background: '#c49a6c', color: 'white', borderRadius: '50px', fontSize: '0.6rem' }}>
                    {isArabic ? 'جديد' : 'New'}
                  </Badge>
                )}
                {notification.priority === 'high' && (
                  <Badge style={{ background: '#e74c3c', color: 'white', borderRadius: '50px', fontSize: '0.6rem' }}>
                    {isArabic ? 'عاجل' : 'Urgent'}
                  </Badge>
                )}
                {notification.type === 'submission' && (
                  <Badge style={{ background: '#2ecc71', color: 'white', borderRadius: '50px', fontSize: '0.55rem' }}>
                    {isArabic ? 'تم التقديم' : 'Submitted'}
                  </Badge>
                )}
              </div>
              <p className="mb-1" style={{ color: darkMode ? '#adb5bd' : '#6c757d', fontSize: '0.9rem' }}>
                {message}
              </p>
              <small style={{ color: darkMode ? '#6c757d' : '#adb5bd', fontSize: '0.7rem' }}>
                <FaClock className="me-1" /> {timeAgo}
                {notification.author && (
                  <> · <FaUser className="me-1" /> {notification.author}</>
                )}
              </small>
            </div>
          </div>
          {!notification.read && (
            <Button 
              variant="link" 
              size="sm" 
              className="p-0 text-muted"
              onClick={(e) => {
                e.stopPropagation();
                markAsRead(notification.id);
              }}
              style={{ fontSize: '0.7rem' }}
            >
              {isArabic ? 'تحديد كمقروء' : 'Mark read'}
            </Button>
          )}
        </div>
      </div>
    );
  };

  // ===== RENDER ANNOUNCEMENT CARD =====
  const renderAnnouncementCard = (item) => {
    const typeColor = getTypeColorLocal(item.type);
    const priorityColor = getPriorityColorLocal(item.priority);
    const title = getTranslatedTitle(item);
    const content = getTranslatedContent(item);
    const timeAgo = formatDistanceToNow(new Date(item.date || item.createdAt || item.sentAt), { 
      addSuffix: true,
      locale: isArabic ? ar : enUS
    });
    const isUrgent = item.priority === 'high';
    const isAssessment = item.type === 'assessment';
    const isSubmitted = item.submitted || false;
    const isGraded = item.grade !== null && item.grade !== undefined;
    
    // Determine card border color based on status
    let borderColor = darkMode ? '#2d2d44' : '#e9ecef';
    let statusBadgeColor = '#6c757d';
    let statusText = '';
    let statusIcon = null;
    
    if (isAssessment) {
      if (isGraded) {
        borderColor = '#2ecc71';
        statusBadgeColor = '#2ecc71';
        statusText = isArabic ? '✅ مصحح' : '✅ Graded';
        statusIcon = <FaCheckCircle className="text-success" />;
      } else if (isSubmitted) {
        borderColor = '#f39c12';
        statusBadgeColor = '#f39c12';
        statusText = isArabic ? '⏳ مقدم - بانتظار التصحيح' : '⏳ Submitted - Pending Grading';
        statusIcon = <FaClock className="text-warning" />;
      } else {
        borderColor = '#4a9eff';
        statusBadgeColor = '#4a9eff';
        statusText = isArabic ? '📝 غير مقدم' : '📝 Not Submitted';
        statusIcon = <FaFileAlt className="text-primary" />;
      }
    }
    
    return (
      <Col key={item.id} xs={12} md={6} lg={4}>
        <div 
          className="announcement-card h-100"
          style={{
            background: darkMode ? '#1a1a2e' : '#ffffff',
            border: `2px solid ${isUrgent ? '#e74c3c' : borderColor}`,
            borderRadius: '16px',
            padding: '20px',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            height: '100%',
            position: 'relative',
            overflow: 'hidden'
          }}
          onClick={() => viewAnnouncement(item)}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {/* Delete Button */}
          <Button
            variant="danger"
            size="sm"
            className="delete-btn"
            onClick={(e) => handleDeleteClick(item, e)}
            style={{
              position: 'absolute',
              top: '8px',
              right: isArabic ? 'auto' : '8px',
              left: isArabic ? '8px' : 'auto',
              zIndex: 20,
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              padding: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.5,
              transition: 'all 0.3s ease',
              background: darkMode 
                ? 'rgba(220, 53, 69, 0.2)' 
                : 'rgba(220, 53, 69, 0.1)',
              border: 'none',
              color: '#dc3545',
              fontSize: '0.8rem',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#dc3545';
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = darkMode 
                ? 'rgba(220, 53, 69, 0.2)' 
                : 'rgba(220, 53, 69, 0.1)';
              e.currentTarget.style.color = '#dc3545';
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.opacity = '0.5';
            }}
            title={isArabic ? 'حذف' : 'Delete'}
          >
            <FaTrash size={14} />
          </Button>

          {isUrgent && (
            <div 
              className="urgent-badge"
              style={{
                position: 'absolute',
                top: '0',
                right: isArabic ? 'auto' : '0',
                left: isArabic ? '0' : 'auto',
                background: '#e74c3c',
                color: 'white',
                padding: '4px 16px',
                fontSize: '0.65rem',
                fontWeight: 'bold',
                borderRadius: '0 0 8px 8px'
              }}
            >
              ⚡ {isArabic ? 'عاجل' : 'URGENT'}
            </div>
          )}
          
          {/* Assessment Status Badge - VISIBLE INDICATOR */}
          {isAssessment && (
            <div 
              className="assessment-status-badge"
              style={{
                position: 'absolute',
                top: '0',
                right: isArabic ? 'auto' : '0',
                left: isArabic ? '0' : 'auto',
                background: isGraded ? '#2ecc71' : isSubmitted ? '#f39c12' : '#4a9eff',
                color: 'white',
                padding: '4px 16px',
                fontSize: '0.65rem',
                fontWeight: 'bold',
                borderRadius: '0 0 8px 8px'
              }}
            >
              {isGraded ? '✓ ' + (isArabic ? 'مصحح' : 'Graded') : 
               isSubmitted ? (isArabic ? '✓ مقدم' : '✓ Submitted') : 
               (isArabic ? '✗ غير مقدم' : '✗ Not Submitted')}
            </div>
          )}
          
          <div className="d-flex justify-content-between align-items-start mb-2">
            <div className="d-flex align-items-center gap-2">
              <div 
                className="type-icon"
                style={{
                  background: `${typeColor}20`,
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: typeColor
                }}
              >
                {getTypeIconLocal(item.type)}
              </div>
              <Badge 
                style={{ 
                  background: priorityColor,
                  color: 'white',
                  borderRadius: '50px',
                  fontSize: '0.6rem'
                }}
              >
                {getPriorityLabelLocal(item.priority)}
              </Badge>
              {isAssessment && (
                <Badge 
                  style={{ 
                    background: statusBadgeColor,
                    color: 'white',
                    borderRadius: '50px',
                    fontSize: '0.55rem'
                  }}
                >
                  {statusIcon} {isSubmitted ? (isArabic ? 'مقدم' : 'Submitted') : (isArabic ? 'غير مقدم' : 'Not Submitted')}
                </Badge>
              )}
            </div>
            <small style={{ color: darkMode ? '#6c757d' : '#adb5bd', fontSize: '0.65rem' }}>
              <FaClock className="me-1" /> {timeAgo}
            </small>
          </div>
          
          <h5 
            className="fw-bold mb-2"
            style={{ 
              color: darkMode ? '#e9ecef' : '#212529',
              fontSize: isMobile ? '0.95rem' : '1.1rem',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              paddingRight: isArabic ? '0' : '32px',
              paddingLeft: isArabic ? '32px' : '0'
            }}
          >
            {title}
          </h5>
          
          <p 
            className="mb-3"
            style={{ 
              color: darkMode ? '#adb5bd' : '#6c757d',
              fontSize: '0.9rem',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {content}
          </p>
          
          {/* Assessment specific info */}
          {isAssessment && (
            <div className="assessment-info mb-2">
              <div className="d-flex gap-3 flex-wrap">
                <small style={{ color: darkMode ? '#6c757d' : '#adb5bd', fontSize: '0.65rem' }}>
                  <FaChalkboardTeacher className="me-1" />
                  {item.teacherName || 'Teacher'}
                </small>
                {item.dueDate && (
                  <small style={{ color: darkMode ? '#6c757d' : '#adb5bd', fontSize: '0.65rem' }}>
                    <FaCalendarAlt className="me-1" />
                    {isArabic ? 'تاريخ التسليم: ' : 'Due: '}
                    {new Date(item.dueDate).toLocaleDateString()}
                  </small>
                )}
                {item.totalMarks && (
                  <small style={{ color: darkMode ? '#6c757d' : '#adb5bd', fontSize: '0.65rem' }}>
                    <FaStar className="me-1" />
                    {isArabic ? 'الدرجة: ' : 'Marks: '}
                    {item.totalMarks}
                  </small>
                )}
                {isGraded && (
                  <small style={{ color: '#2ecc71', fontSize: '0.65rem', fontWeight: 'bold' }}>
                    <FaCheckCircle className="me-1" />
                    {isArabic ? `النتيجة: ${item.grade}/${item.totalMarks}` : `Grade: ${item.grade}/${item.totalMarks}`}
                  </small>
                )}
              </div>
            </div>
          )}
          
          <div className="d-flex justify-content-between align-items-center mt-auto pt-2 border-top" style={{ borderColor: darkMode ? '#2d2d44' : '#e9ecef' }}>
            <div className="d-flex gap-2">
              {item.type !== 'assessment' && (
                <>
                  <small style={{ color: darkMode ? '#6c757d' : '#adb5bd', fontSize: '0.65rem' }}>
                    <FaEye className="me-1" /> {formatNumber(item.views || 0)}
                  </small>
                  <small style={{ color: darkMode ? '#6c757d' : '#adb5bd', fontSize: '0.65rem' }}>
                    <FaThumbsUp className="me-1" /> {formatNumber(item.likes || 0)}
                  </small>
                </>
              )}
            </div>
            <div className="d-flex gap-1">
              {isAssessment && !isSubmitted && (
                <Button 
                  variant="success" 
                  size="sm"
                  className="px-2"
                  style={{ fontSize: '0.65rem', borderRadius: '8px' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSubmitAssessment(item);
                  }}
                >
                  <FaUpload className="me-1" size={10} />
                  {isArabic ? 'تقديم' : 'Submit'}
                </Button>
              )}
              {isAssessment && isSubmitted && !isGraded && (
                <Badge bg="warning" className="px-2 py-1 d-flex align-items-center gap-1" style={{ fontSize: '0.6rem' }}>
                  <FaClock size={10} />
                  {isArabic ? 'بانتظار التصحيح' : 'Pending Grading'}
                </Badge>
              )}
              {isAssessment && isGraded && (
                <Badge bg="success" className="px-2 py-1 d-flex align-items-center gap-1" style={{ fontSize: '0.6rem' }}>
                  <FaCheckCircle size={10} />
                  {isArabic ? `الدرجة: ${item.grade}/${item.totalMarks}` : `Grade: ${item.grade}/${item.totalMarks}`}
                </Badge>
              )}
              <Button 
                variant="link" 
                size="sm" 
                className="p-0 text-decoration-none"
                style={{ color: '#c49a6c', fontSize: '0.75rem' }}
                onClick={(e) => {
                  e.stopPropagation();
                  viewAnnouncement(item);
                }}
              >
                {isArabic ? 'اقرأ المزيد' : 'Read More'} <FaArrowRight className="ms-1" size={10} />
              </Button>
            </div>
          </div>
        </div>
      </Col>
    );
  };

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <div className="text-center py-5" dir={isArabic ? 'rtl' : 'ltr'}>
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted" style={arabicFontStyle}>
          {isArabic ? 'جاري تحميل الإعلانات...' : 'Loading announcements...'}
        </p>
      </div>
    );
  }

  // ===== FILTERED ASSESSMENTS BY STATUS =====
  const pendingAssessments = teacherAssessments.filter(a => !a.submitted && !a.grade);
  const submittedAssessments = teacherAssessments.filter(a => a.submitted && !a.grade);
  const gradedAssessments = teacherAssessments.filter(a => a.grade !== null && a.grade !== undefined);

  return (
    <div className="student-announcements" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Audio for notifications */}
      <audio ref={notificationSound} style={{ display: 'none' }}>
        <source src="/notification.mp3" type="audio/mpeg" />
      </audio>

      {/* Page Header */}
      <div className="page-header d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ ...arabicFontStyle, color: '#c49a6c', fontSize: isArabic ? 'clamp(1.1rem, 1.8vw, 1.5rem)' : 'clamp(1rem, 1.6vw, 1.4rem)' }}>
            <FaBell className="me-2" /> 
            {isArabic ? 'الإعلانات والإشعارات' : 'Announcements & Notifications'}
          </h4>
          <p className="text-muted mb-0" style={{ ...arabicFontStyle, fontSize: isArabic ? 'clamp(0.9rem, 1.1vw, 1.05rem)' : 'clamp(0.85rem, 1vw, 1rem)' }}>
            {isArabic 
              ? `ابق على اطلاع بآخر الإعلانات والتقييمات (${formatNumber(totalItems)} عنصر)`
              : `Stay updated with the latest announcements and assessments (${formatNumber(totalItems)} items)`}
          </p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          {unreadCount > 0 && (
            <Badge 
              style={{ 
                background: '#c49a6c', 
                color: 'white', 
                borderRadius: '50px',
                padding: '8px 16px',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <FaBell className={unreadCount > 0 ? 'animate-pulse' : ''} />
              {isArabic ? `${formatNumber(unreadCount)} إشعار جديد` : `${formatNumber(unreadCount)} new notification${unreadCount > 1 ? 's' : ''}`}
            </Badge>
          )}
          <Button 
            variant="outline-primary" 
            size="sm" 
            onClick={loadData}
            style={{ ...arabicFontStyle, borderRadius: '12px' }}
          >
            <FaSync className="me-1" /> {isArabic ? 'تحديث' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Assessment Status Summary Cards */}
      {teacherAssessments.length > 0 && (
        <Row className="g-2 g-md-3 mb-4">
          <Col xs={6} sm={4} md={3}>
            <div className="stat-summary-card" style={{
              background: darkMode ? '#1a1a2e' : '#ffffff',
              border: '2px solid #4a9eff',
              borderRadius: '12px',
              padding: '12px 16px',
              textAlign: 'center'
            }}>
              <div className="stat-number" style={{ fontSize: '1.5rem', fontWeight: '700', color: '#4a9eff' }}>
                {formatNumber(pendingAssessments.length)}
              </div>
              <div className="stat-label" style={{ fontSize: '0.65rem', color: '#6c757d' }}>
                {isArabic ? 'غير مقدم' : 'Not Submitted'}
              </div>
            </div>
          </Col>
          <Col xs={6} sm={4} md={3}>
            <div className="stat-summary-card" style={{
              background: darkMode ? '#1a1a2e' : '#ffffff',
              border: '2px solid #f39c12',
              borderRadius: '12px',
              padding: '12px 16px',
              textAlign: 'center'
            }}>
              <div className="stat-number" style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f39c12' }}>
                {formatNumber(submittedAssessments.length)}
              </div>
              <div className="stat-label" style={{ fontSize: '0.65rem', color: '#6c757d' }}>
                {isArabic ? 'مقدم - بانتظار التصحيح' : 'Submitted - Pending'}
              </div>
            </div>
          </Col>
          <Col xs={6} sm={4} md={3}>
            <div className="stat-summary-card" style={{
              background: darkMode ? '#1a1a2e' : '#ffffff',
              border: '2px solid #2ecc71',
              borderRadius: '12px',
              padding: '12px 16px',
              textAlign: 'center'
            }}>
              <div className="stat-number" style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2ecc71' }}>
                {formatNumber(gradedAssessments.length)}
              </div>
              <div className="stat-label" style={{ fontSize: '0.65rem', color: '#6c757d' }}>
                {isArabic ? 'مصحح' : 'Graded'}
              </div>
            </div>
          </Col>
          <Col xs={6} sm={4} md={3}>
            <div className="stat-summary-card" style={{
              background: darkMode ? '#1a1a2e' : '#ffffff',
              border: '2px solid #9b59b6',
              borderRadius: '12px',
              padding: '12px 16px',
              textAlign: 'center'
            }}>
              <div className="stat-number" style={{ fontSize: '1.5rem', fontWeight: '700', color: '#9b59b6' }}>
                {formatNumber(teacherAssessments.length)}
              </div>
              <div className="stat-label" style={{ fontSize: '0.65rem', color: '#6c757d' }}>
                {isArabic ? 'الإجمالي' : 'Total'}
              </div>
            </div>
          </Col>
        </Row>
      )}

      {/* Tabs */}
      <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
        <Nav variant="tabs" className="mb-4" style={{ borderBottom: `2px solid ${darkMode ? '#2d2d44' : '#e9ecef'}` }}>
          <Nav.Item>
            <Nav.Link 
              eventKey="assessments" 
              style={{ 
                color: activeTab === 'assessments' ? '#4a9eff' : darkMode ? '#adb5bd' : '#6c757d',
                fontWeight: activeTab === 'assessments' ? 'bold' : 'normal',
                borderBottom: activeTab === 'assessments' ? '2px solid #4a9eff' : 'none',
                ...arabicFontStyle,
                position: 'relative'
              }}
            >
              <FaFileAlt className="me-2" /> 
              {isArabic ? 'تقييماتي' : 'My Assessments'}
              {teacherAssessments.filter(a => !a.submitted && !a.grade).length > 0 && (
                <Badge className="ms-2" style={{ background: '#4a9eff', color: 'white', borderRadius: '50px' }}>
                  {formatNumber(teacherAssessments.filter(a => !a.submitted && !a.grade).length)}
                </Badge>
              )}
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link 
              eventKey="announcements" 
              style={{ 
                color: activeTab === 'announcements' ? '#c49a6c' : darkMode ? '#adb5bd' : '#6c757d',
                fontWeight: activeTab === 'announcements' ? 'bold' : 'normal',
                borderBottom: activeTab === 'announcements' ? '2px solid #c49a6c' : 'none',
                ...arabicFontStyle
              }}
            >
              <FaBullhorn className="me-2" /> 
              {isArabic ? 'الإعلانات' : 'Announcements'}
              <Badge className="ms-2" style={{ background: '#c49a6c', color: 'white', borderRadius: '50px' }}>
                {formatNumber(announcements.filter(a => a.type !== 'assessment').length)}
              </Badge>
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link 
              eventKey="notifications" 
              style={{ 
                color: activeTab === 'notifications' ? '#c49a6c' : darkMode ? '#adb5bd' : '#6c757d',
                fontWeight: activeTab === 'notifications' ? 'bold' : 'normal',
                borderBottom: activeTab === 'notifications' ? '2px solid #c49a6c' : 'none',
                ...arabicFontStyle,
                position: 'relative'
              }}
            >
              <FaBell className="me-2" /> 
              {isArabic ? 'الإشعارات' : 'Notifications'}
              {unreadCount > 0 && (
                <span 
                  className="ms-2"
                  style={{
                    background: '#e74c3c',
                    color: 'white',
                    borderRadius: '50%',
                    padding: '2px 8px',
                    fontSize: '0.7rem',
                    fontWeight: 'bold'
                  }}
                >
                  {formatNumber(unreadCount)}
                </span>
              )}
            </Nav.Link>
          </Nav.Item>
        </Nav>

        <Tab.Content>
          {/* ASSESSMENTS TAB */}
          <Tab.Pane eventKey="assessments">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
              <div className="d-flex gap-2 flex-wrap">
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={handleDeleteAll}
                  disabled={teacherAssessments.length === 0 || deletingAll}
                  style={{ ...arabicFontStyle, borderRadius: '50px' }}
                >
                  {deletingAll ? (
                    <>
                      <FaSpinner className="spinning me-1" />
                      {isArabic ? 'جاري الحذف...' : 'Deleting...'}
                    </>
                  ) : (
                    <>
                      <FaTrashAlt className="me-1" />
                      {isArabic ? 'حذف الكل' : 'Delete All'}
                    </>
                  )}
                </Button>
              </div>
              
              <div className="text-muted small" style={{ ...arabicFontStyle, fontSize: '0.75rem' }}>
                {isArabic 
                  ? `عرض ${formatNumber(filteredAnnouncements.filter(a => a.type === 'assessment').length)} من ${formatNumber(teacherAssessments.length)} تقييم`
                  : `Showing ${formatNumber(filteredAnnouncements.filter(a => a.type === 'assessment').length)} of ${formatNumber(teacherAssessments.length)} assessments`}
              </div>
            </div>

            {/* Submission Filter */}
            <div className="mb-3">
              <div className="d-flex flex-wrap gap-2">
                <Button
                  variant={submissionFilter === 'all' ? 'primary' : 'outline-secondary'}
                  size="sm"
                  onClick={() => setSubmissionFilter('all')}
                  style={{ ...arabicFontStyle, borderRadius: '50px' }}
                >
                  <FaList className="me-1" />
                  {isArabic ? 'الكل' : 'All'}
                  <Badge className="ms-1" style={{ background: 'rgba(255,255,255,0.2)' }}>
                    {formatNumber(teacherAssessments.length)}
                  </Badge>
                </Button>
                <Button
                  variant={submissionFilter === 'pending' ? 'primary' : 'outline-secondary'}
                  size="sm"
                  onClick={() => setSubmissionFilter('pending')}
                  style={{ ...arabicFontStyle, borderRadius: '50px' }}
                >
                  <FaFileAlt className="me-1" />
                  {isArabic ? 'غير مقدم' : 'Not Submitted'}
                  <Badge className="ms-1" style={{ background: 'rgba(255,255,255,0.2)' }}>
                    {formatNumber(pendingAssessments.length)}
                  </Badge>
                </Button>
                <Button
                  variant={submissionFilter === 'submitted' ? 'primary' : 'outline-secondary'}
                  size="sm"
                  onClick={() => setSubmissionFilter('submitted')}
                  style={{ ...arabicFontStyle, borderRadius: '50px' }}
                >
                  <FaUpload className="me-1" />
                  {isArabic ? 'مقدم' : 'Submitted'}
                  <Badge className="ms-1" style={{ background: 'rgba(255,255,255,0.2)' }}>
                    {formatNumber(submittedAssessments.length)}
                  </Badge>
                </Button>
                <Button
                  variant={submissionFilter === 'graded' ? 'primary' : 'outline-secondary'}
                  size="sm"
                  onClick={() => setSubmissionFilter('graded')}
                  style={{ ...arabicFontStyle, borderRadius: '50px' }}
                >
                  <FaCheckCircle className="me-1" />
                  {isArabic ? 'مصحح' : 'Graded'}
                  <Badge className="ms-1" style={{ background: 'rgba(255,255,255,0.2)' }}>
                    {formatNumber(gradedAssessments.length)}
                  </Badge>
                </Button>
              </div>
            </div>

            {/* Filter Bar */}
            <Card className="modern-card mb-4" style={{ background: darkMode ? '#1a1a2e' : '#ffffff', borderColor: darkMode ? '#2d2d44' : '#e9ecef' }}>
              <Card.Body>
                <Row className="g-3">
                  <Col xs={12} md={6}>
                    <InputGroup>
                      <InputGroup.Text style={{ background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px 0 0 12px' }}>
                        <FaSearch className="text-muted" />
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder={isArabic ? 'بحث في التقييمات...' : 'Search assessments...'}
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setCurrentPage(1);
                        }}
                        style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529' }}
                      />
                      {searchTerm && (
                        <Button 
                          variant="outline-secondary" 
                          onClick={() => setSearchTerm('')}
                          style={{ ...arabicFontStyle, borderRadius: '0 12px 12px 0' }}
                        >
                          <FaTimesCircle />
                        </Button>
                      )}
                    </InputGroup>
                  </Col>
                  <Col xs={6} md={3}>
                    <Form.Select
                      value={filterType}
                      onChange={(e) => {
                        setFilterType(e.target.value);
                        setCurrentPage(1);
                      }}
                      style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px' }}
                    >
                      {typeOptions.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col xs={6} md={3}>
                    <Form.Select
                      value={sortBy}
                      onChange={(e) => {
                        setSortBy(e.target.value);
                        setCurrentPage(1);
                      }}
                      style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px' }}
                    >
                      <option value="newest">{isArabic ? 'الأحدث' : 'Newest'}</option>
                      <option value="oldest">{isArabic ? 'الأقدم' : 'Oldest'}</option>
                      <option value="popular">{isArabic ? 'الأكثر مشاهدة' : 'Most Viewed'}</option>
                    </Form.Select>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {filteredAnnouncements.filter(a => a.type === 'assessment').length === 0 ? (
              <div className="text-center py-5">
                <FaFileAlt size={48} className="text-muted opacity-25 mb-3" />
                <h5 style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                  {isArabic ? 'لا توجد تقييمات' : 'No assessments'}
                </h5>
                <p className="text-muted" style={arabicFontStyle}>
                  {isArabic 
                    ? 'سوف تظهر هنا التقييمات الجديدة من المعلمين' 
                    : 'New assessments from teachers will appear here'}
                </p>
              </div>
            ) : (
              <>
                <Row className="g-4">
                  {filteredAnnouncements
                    .filter(a => a.type === 'assessment')
                    .map(renderAnnouncementCard)}
                </Row>

                {totalPages > 1 && (
                  <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center p-3 mt-4 border-top gap-2" style={{ borderColor: darkMode ? '#2d2d44' : '#e9ecef' }}>
                    <div className="text-muted small" style={{ ...arabicFontStyle, color: darkMode ? '#adb5bd' : '#6c757d', fontSize: isMobile ? '0.65rem' : 'inherit' }}>
                      {isArabic 
                        ? `عرض ${formatNumber(filteredAnnouncements.filter(a => a.type === 'assessment').length)} من ${formatNumber(teacherAssessments.length)} تقييم`
                        : `Showing ${formatNumber(filteredAnnouncements.filter(a => a.type === 'assessment').length)} of ${formatNumber(teacherAssessments.length)} assessments`}
                    </div>
                    <Pagination className="mb-0" size={isMobile ? 'sm' : 'md'}>
                      <Pagination.Prev 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      />
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
                          <Pagination.Item
                            key={pageNum}
                            active={pageNum === currentPage}
                            onClick={() => setCurrentPage(pageNum)}
                            style={{ color: darkMode ? '#e9ecef' : '#212529', borderRadius: '8px' }}
                          >
                            {formatNumber(pageNum)}
                          </Pagination.Item>
                        );
                      })}
                      <Pagination.Next 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      />
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </Tab.Pane>

          {/* ANNOUNCEMENTS TAB */}
          <Tab.Pane eventKey="announcements">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
              <div className="d-flex gap-2 flex-wrap">
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={handleDeleteAll}
                  disabled={announcements.filter(a => a.type !== 'assessment').length === 0 || deletingAll}
                  style={{ ...arabicFontStyle, borderRadius: '50px' }}
                >
                  {deletingAll ? (
                    <>
                      <FaSpinner className="spinning me-1" />
                      {isArabic ? 'جاري الحذف...' : 'Deleting...'}
                    </>
                  ) : (
                    <>
                      <FaTrashAlt className="me-1" />
                      {isArabic ? 'حذف الكل' : 'Delete All'}
                    </>
                  )}
                </Button>
              </div>
              
              <div className="text-muted small" style={{ ...arabicFontStyle, fontSize: '0.75rem' }}>
                {isArabic 
                  ? `عرض ${formatNumber(filteredAnnouncements.filter(a => a.type !== 'assessment').length)} من ${formatNumber(announcements.filter(a => a.type !== 'assessment').length)} إعلان`
                  : `Showing ${formatNumber(filteredAnnouncements.filter(a => a.type !== 'assessment').length)} of ${formatNumber(announcements.filter(a => a.type !== 'assessment').length)} announcements`}
              </div>
            </div>

            <Card className="modern-card mb-4" style={{ background: darkMode ? '#1a1a2e' : '#ffffff', borderColor: darkMode ? '#2d2d44' : '#e9ecef' }}>
              <Card.Body>
                <Row className="g-3">
                  <Col xs={12} md={6}>
                    <InputGroup>
                      <InputGroup.Text style={{ background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px 0 0 12px' }}>
                        <FaSearch className="text-muted" />
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder={isArabic ? 'بحث في الإعلانات...' : 'Search announcements...'}
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setCurrentPage(1);
                        }}
                        style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529' }}
                      />
                      {searchTerm && (
                        <Button 
                          variant="outline-secondary" 
                          onClick={() => setSearchTerm('')}
                          style={{ ...arabicFontStyle, borderRadius: '0 12px 12px 0' }}
                        >
                          <FaTimesCircle />
                        </Button>
                      )}
                    </InputGroup>
                  </Col>
                  <Col xs={6} md={3}>
                    <Form.Select
                      value={filterPriority}
                      onChange={(e) => {
                        setFilterPriority(e.target.value);
                        setCurrentPage(1);
                      }}
                      style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px' }}
                    >
                      {priorityOptions.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col xs={6} md={3}>
                    <Form.Select
                      value={sortBy}
                      onChange={(e) => {
                        setSortBy(e.target.value);
                        setCurrentPage(1);
                      }}
                      style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px' }}
                    >
                      <option value="newest">{isArabic ? 'الأحدث' : 'Newest'}</option>
                      <option value="oldest">{isArabic ? 'الأقدم' : 'Oldest'}</option>
                      <option value="popular">{isArabic ? 'الأكثر مشاهدة' : 'Most Viewed'}</option>
                    </Form.Select>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {filteredAnnouncements.filter(a => a.type !== 'assessment').length === 0 ? (
              <div className="text-center py-5">
                <FaBullhorn size={48} className="text-muted opacity-25 mb-3" />
                <h5 style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                  {isArabic ? 'لا توجد إعلانات' : 'No announcements'}
                </h5>
                <p className="text-muted" style={arabicFontStyle}>
                  {isArabic 
                    ? 'سوف تظهر هنا الإعلانات الجديدة من الإدارة والمعلمين' 
                    : 'New announcements from administration and teachers will appear here'}
                </p>
              </div>
            ) : (
              <>
                <Row className="g-4">
                  {filteredAnnouncements
                    .filter(a => a.type !== 'assessment')
                    .map(renderAnnouncementCard)}
                </Row>

                {totalPages > 1 && (
                  <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center p-3 mt-4 border-top gap-2" style={{ borderColor: darkMode ? '#2d2d44' : '#e9ecef' }}>
                    <div className="text-muted small" style={{ ...arabicFontStyle, color: darkMode ? '#adb5bd' : '#6c757d', fontSize: isMobile ? '0.65rem' : 'inherit' }}>
                      {isArabic 
                        ? `عرض ${formatNumber(filteredAnnouncements.filter(a => a.type !== 'assessment').length)} من ${formatNumber(announcements.filter(a => a.type !== 'assessment').length)} إعلان`
                        : `Showing ${formatNumber(filteredAnnouncements.filter(a => a.type !== 'assessment').length)} of ${formatNumber(announcements.filter(a => a.type !== 'assessment').length)} announcements`}
                    </div>
                    <Pagination className="mb-0" size={isMobile ? 'sm' : 'md'}>
                      <Pagination.Prev 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      />
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
                          <Pagination.Item
                            key={pageNum}
                            active={pageNum === currentPage}
                            onClick={() => setCurrentPage(pageNum)}
                            style={{ color: darkMode ? '#e9ecef' : '#212529', borderRadius: '8px' }}
                          >
                            {formatNumber(pageNum)}
                          </Pagination.Item>
                        );
                      })}
                      <Pagination.Next 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      />
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </Tab.Pane>

          {/* NOTIFICATIONS TAB */}
          <Tab.Pane eventKey="notifications">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                {isArabic ? 'الإشعارات' : 'Notifications'}
                {unreadCount > 0 && (
                  <Badge className="ms-2" style={{ background: '#e74c3c', color: 'white', borderRadius: '50px' }}>
                    {formatNumber(unreadCount)} {isArabic ? 'غير مقروء' : 'unread'}
                  </Badge>
                )}
              </h5>
              <div className="d-flex gap-2">
                {unreadCount > 0 && (
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    onClick={markAllNotificationsAsRead}
                    style={{ ...arabicFontStyle, borderRadius: '12px' }}
                  >
                    <FaCheckDouble className="me-1" /> 
                    {isArabic ? 'تحديد الكل كمقروء' : 'Mark all as read'}
                  </Button>
                )}
              </div>
            </div>

            {notifications.length === 0 ? (
              <div className="text-center py-5">
                <FaBell size={48} className="text-muted opacity-25 mb-3" />
                <h5 style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                  {isArabic ? 'لا توجد إشعارات' : 'No notifications'}
                </h5>
                <p className="text-muted" style={arabicFontStyle}>
                  {isArabic 
                    ? 'ستظهر هنا الإشعارات الجديدة' 
                    : 'New notifications will appear here'}
                </p>
              </div>
            ) : (
              <div className="notifications-list">
                {notifications.map(renderNotificationCard)}
              </div>
            )}
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>

      {/* ===== VIEW DETAILS MODAL ===== */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} centered size="lg" className="modern-modal">
        <Modal.Header closeButton className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Modal.Title style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '1rem' : 'inherit' }}>
            <FaEye className="me-2 text-primary" />
            {selectedItemType === 'assessment' 
              ? (isArabic ? 'تفاصيل التقييم' : 'Assessment Details')
              : (isArabic ? 'تفاصيل الإعلان' : 'Announcement Details')}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? '#0d1117' : 'white' }}>
          {selectedItem && (
            <div>
              <div className="text-center mb-4">
                <div 
                  className="announcement-avatar-lg mx-auto"
                  style={{
                    background: `linear-gradient(135deg, ${getTypeColorLocal(selectedItem.type)}, ${getTypeColorLocal(selectedItem.type)}dd)`,
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '2rem',
                    margin: '0 auto',
                    boxShadow: `0 8px 30px ${getTypeColorLocal(selectedItem.type)}40`
                  }}
                >
                  {getTranslatedTitle(selectedItem).charAt(0).toUpperCase()}
                </div>
                <h4 className="fw-bold mt-3" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                  {getTranslatedTitle(selectedItem)}
                </h4>
                <div className="d-flex justify-content-center gap-2 flex-wrap">
                  <Badge style={{ background: getTypeColorLocal(selectedItem.type), color: 'white', borderRadius: '8px' }}>
                    {getTypeIconLocal(selectedItem.type)} {getTypeLabelLocal(selectedItem.type)}
                  </Badge>
                  <Badge style={{ background: getPriorityColorLocal(selectedItem.priority), color: 'white', borderRadius: '8px' }}>
                    {getPriorityLabelLocal(selectedItem.priority)}
                  </Badge>
                  <Badge style={{ background: '#6c757d', color: 'white', borderRadius: '8px' }}>
                    <FaUser className="me-1" /> {selectedItem.author || selectedItem.teacherName || (isArabic ? 'المسؤول' : 'Admin')}
                  </Badge>
                  {selectedItem.type === 'assessment' && (
                    <>
                      <Badge style={{ background: '#4a9eff', color: 'white', borderRadius: '8px' }}>
                        <FaBook className="me-1" /> {selectedItem.subject}
                      </Badge>
                      <Badge style={{ background: selectedItem.submitted ? '#f39c12' : '#e74c3c', color: 'white', borderRadius: '8px' }}>
                        {selectedItem.submitted ? (isArabic ? '✓ مقدم' : '✓ Submitted') : (isArabic ? '✗ غير مقدم' : '✗ Not Submitted')}
                      </Badge>
                    </>
                  )}
                </div>
              </div>

              {/* Assessment specific info */}
              {selectedItemType === 'assessment' && selectedItem.assessmentData && (
                <div className="assessment-details mb-3 p-3 rounded-3" style={{
                  background: darkMode ? '#2d2d44' : '#f8f9fa',
                  border: `1px solid ${darkMode ? '#3d3d5c' : '#e9ecef'}`,
                  borderRadius: '12px'
                }}>
                  <Row>
                    <Col md={6}>
                      <div className="d-flex align-items-center gap-2">
                        <FaChalkboardTeacher className="text-primary" />
                        <span className="text-muted">{isArabic ? 'المعلم: ' : 'Teacher: '}</span>
                        <span style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                          {selectedItem.teacherName}
                        </span>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="d-flex align-items-center gap-2">
                        <FaBook className="text-success" />
                        <span className="text-muted">{isArabic ? 'المادة: ' : 'Subject: '}</span>
                        <span style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                          {selectedItem.subject}
                        </span>
                      </div>
                    </Col>
                  </Row>
                  <Row className="mt-2">
                    <Col md={6}>
                      <div className="d-flex align-items-center gap-2">
                        <FaUserGraduate className="text-info" />
                        <span className="text-muted">{isArabic ? 'الفصل: ' : 'Class: '}</span>
                        <span style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                          {selectedItem.className}
                        </span>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="d-flex align-items-center gap-2">
                        <FaCalendarAlt className="text-warning" />
                        <span className="text-muted">{isArabic ? 'تاريخ التسليم: ' : 'Due Date: '}</span>
                        <span style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                          {selectedItem.dueDate ? new Date(selectedItem.dueDate).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </Col>
                  </Row>
                  <Row className="mt-2">
                    <Col md={6}>
                      <div className="d-flex align-items-center gap-2">
                        <FaStar className="text-warning" />
                        <span className="text-muted">{isArabic ? 'الدرجة الكلية: ' : 'Total Marks: '}</span>
                        <span style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                          {formatNumber(selectedItem.totalMarks)}
                        </span>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="d-flex align-items-center gap-2">
                        <FaClock className="text-muted" />
                        <span className="text-muted">{isArabic ? 'الحالة: ' : 'Status: '}</span>
                        <Badge bg={selectedItem.submitted ? 'warning' : 'secondary'}>
                          {selectedItem.submitted ? (isArabic ? 'مقدم' : 'Submitted') : (isArabic ? 'غير مقدم' : 'Not Submitted')}
                        </Badge>
                      </div>
                    </Col>
                  </Row>
                  {selectedItem.grade && (
                    <Row className="mt-2">
                      <Col md={12}>
                        <div className="d-flex align-items-center gap-2">
                          <FaCheckCircle className="text-success" />
                          <span className="text-muted">{isArabic ? 'الدرجة: ' : 'Grade: '}</span>
                          <span className="fw-bold" style={{ color: '#2ecc71', fontSize: '1.1rem' }}>
                            {formatNumber(selectedItem.grade)} / {formatNumber(selectedItem.totalMarks)}
                          </span>
                        </div>
                      </Col>
                    </Row>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="detail-item">
                <p className="fw-semibold mb-0" style={{ color: darkMode ? '#e9ecef' : '#212529', whiteSpace: 'pre-wrap', fontSize: '1rem' }}>
                  {getTranslatedContent(selectedItem)}
                </p>
              </div>

              {/* Attachment */}
              {selectedItem.attachmentName && (
                <div className="mt-3">
                  <h6 className="fw-bold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                    {isArabic ? 'المرفق:' : 'Attachment:'}
                  </h6>
                  <div className="p-3 rounded-3 d-flex align-items-center gap-3" style={{
                    background: darkMode ? '#2d2d44' : '#f8f9fa',
                    border: `1px solid ${darkMode ? '#3d3d5c' : '#e9ecef'}`,
                    borderRadius: '12px'
                  }}>
                    {getFileIconHelper(selectedItem.attachmentType).icon}
                    <div>
                      <div className="fw-semibold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                        {selectedItem.attachmentName}
                      </div>
                      <div className="text-muted small">
                        {getFileTypeLabelHelper(selectedItem.attachmentType)}
                      </div>
                    </div>
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      className="ms-auto"
                      onClick={() => handleDownloadAttachment(selectedItem)}
                      style={{ ...arabicFontStyle, borderRadius: '10px' }}
                    >
                      <FaDownload className="me-1" />
                      {isArabic ? 'تحميل' : 'Download'}
                    </Button>
                  </div>
                </div>
              )}

              <Row className="mt-3">
                <Col md={6}>
                  <div className="detail-item">
                    <label className="text-muted small" style={arabicFontStyle}>
                      <FaCalendarAlt className="me-1" /> {isArabic ? 'التاريخ والوقت' : 'Date & Time'}
                    </label>
                    <p className="fw-semibold mb-0" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                      {selectedItem.date || format(new Date(selectedItem.createdAt || selectedItem.sentAt), 'PPP')}
                      {selectedItem.time && ` - ${selectedItem.time}`}
                    </p>
                  </div>
                </Col>
                {selectedItemType !== 'assessment' && (
                  <Col md={6}>
                    <div className="detail-item">
                      <label className="text-muted small" style={arabicFontStyle}>
                        <FaEye className="me-1" /> {isArabic ? 'المشاهدات' : 'Views'}
                      </label>
                      <p className="fw-semibold mb-0" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                        {formatNumber(selectedItem.views || 0)}
                      </p>
                    </div>
                  </Col>
                )}
              </Row>

              {/* Submit button for assessments - ONLY if not submitted */}
              {selectedItemType === 'assessment' && !selectedItem.submitted && (
                <div className="mt-3">
                  <Button 
                    variant="success" 
                    className="w-100"
                    onClick={() => {
                      setShowViewModal(false);
                      handleSubmitAssessment(selectedItem);
                    }}
                    style={{ ...arabicFontStyle, borderRadius: '12px' }}
                  >
                    <FaUpload className="me-2" />
                    {isArabic ? 'تقديم التقييم' : 'Submit Assessment'}
                  </Button>
                </div>
              )}

              {/* Already submitted indicator */}
              {selectedItemType === 'assessment' && selectedItem.submitted && !selectedItem.grade && (
                <div className="mt-3 p-3 rounded-3" style={{
                  background: 'rgba(243, 156, 18, 0.1)',
                  border: '1px solid #f39c12',
                  borderRadius: '12px',
                  textAlign: 'center'
                }}>
                  <FaCheckCircle className="text-warning me-2" />
                  <span className="fw-semibold" style={{ color: '#f39c12' }}>
                    {isArabic ? '✅ تم تقديم هذا التقييم بالفعل، في انتظار المراجعة' : '✅ This assessment has been submitted, waiting for review'}
                  </span>
                </div>
              )}

              {/* Graded indicator */}
              {selectedItemType === 'assessment' && selectedItem.grade && (
                <div className="mt-3 p-3 rounded-3" style={{
                  background: 'rgba(46, 204, 113, 0.1)',
                  border: '1px solid #2ecc71',
                  borderRadius: '12px',
                  textAlign: 'center'
                }}>
                  <FaCheckCircle className="text-success me-2" />
                  <span className="fw-semibold" style={{ color: '#2ecc71' }}>
                    {isArabic 
                      ? `✅ تم تصحيح التقييم: ${selectedItem.grade}/${selectedItem.totalMarks}` 
                      : `✅ Assessment graded: ${selectedItem.grade}/${selectedItem.totalMarks}`}
                  </span>
                </div>
              )}

              {/* Delete button in modal */}
              <div className="mt-3 d-flex justify-content-end">
                <Button 
                  variant="danger" 
                  size="sm"
                  onClick={() => {
                    setShowViewModal(false);
                    handleDeleteClick(selectedItem, { stopPropagation: () => {} });
                  }}
                  style={{ ...arabicFontStyle, borderRadius: '12px' }}
                >
                  <FaTrash className="me-1" /> 
                  {isArabic ? 'حذف هذا العنصر' : 'Delete this item'}
                </Button>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Button variant="secondary" onClick={() => setShowViewModal(false)} style={{ ...arabicFontStyle, borderRadius: '12px' }}>
            {isArabic ? 'إغلاق' : 'Close'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===== SUBMIT ASSESSMENT MODAL ===== */}
      <Modal show={showSubmitModal} onHide={() => setShowSubmitModal(false)} centered size="lg" className="modern-modal">
        <Modal.Header closeButton className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Modal.Title style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '1rem' : 'inherit' }}>
            <FaUpload className="me-2 text-success" />
            {isArabic ? 'تقديم التقييم' : 'Submit Assessment'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? '#0d1117' : 'white' }}>
          {selectedAssessment && (
            <div>
              <div className="assessment-info p-3 rounded-3 mb-3" style={{
                background: darkMode ? '#2d2d44' : '#f8f9fa',
                border: `1px solid ${darkMode ? '#3d3d5c' : '#e9ecef'}`,
                borderRadius: '12px'
              }}>
                <h6 className="fw-bold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                  {selectedAssessment.title}
                </h6>
                <div className="d-flex gap-3 flex-wrap mt-1">
                  <small className="text-muted">
                    <FaChalkboardTeacher className="me-1" />
                    {selectedAssessment.teacherName}
                  </small>
                  <small className="text-muted">
                    <FaBook className="me-1" />
                    {selectedAssessment.subject}
                  </small>
                  <small className="text-muted">
                    <FaCalendarAlt className="me-1" />
                    {selectedAssessment.dueDate ? new Date(selectedAssessment.dueDate).toLocaleDateString() : 'N/A'}
                  </small>
                </div>
              </div>

              <Form>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                    {isArabic ? 'نص التقديم' : 'Submission Text'}
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    placeholder={isArabic ? 'اكتب إجابتك هنا...' : 'Write your answer here...'}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? '#2d2d44' : 'white',
                      color: darkMode ? '#e9ecef' : '#212529',
                      borderRadius: '12px'
                    }}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                    <FaFile className="me-2" />
                    {isArabic ? 'رفع ملف (اختياري)' : 'Upload File (Optional)'}
                  </Form.Label>
                  <Form.Control
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setSubmissionFile(file);
                      }
                    }}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? '#2d2d44' : 'white',
                      color: darkMode ? '#e9ecef' : '#212529',
                      borderRadius: '12px'
                    }}
                  />
                  {submissionFile && (
                    <div className="mt-2 p-2 rounded-3" style={{
                      background: darkMode ? '#2d2d44' : '#f8f9fa',
                      border: `1px solid ${darkMode ? '#3d3d5c' : '#e9ecef'}`,
                      borderRadius: '8px'
                    }}>
                      <FaFile className="me-2" />
                      <span style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                        {submissionFile.name} ({(submissionFile.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                  )}
                </Form.Group>
              </Form>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Button variant="secondary" onClick={() => setShowSubmitModal(false)} style={{ ...arabicFontStyle, borderRadius: '12px' }}>
            {isArabic ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button variant="success" onClick={handleSubmissionSubmit} disabled={submitting} style={{ ...arabicFontStyle, borderRadius: '12px' }}>
            {submitting ? (
              <>
                <FaSpinner className="spinning me-2" />
                {isArabic ? 'جاري الإرسال...' : 'Submitting...'}
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

      {/* ===== DELETE CONFIRMATION MODAL ===== */}
      <Modal show={showDeleteModal} onHide={handleDeleteCancel} centered className="modern-modal">
        <Modal.Header closeButton className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Modal.Title style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '1rem' : 'inherit' }}>
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
              <FaTrashAlt size={28} className="text-danger" />
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
              ? `هل أنت متأكد من حذف "${getTranslatedTitle(itemToDelete)}"؟`
              : `Are you sure you want to delete "${getTranslatedTitle(itemToDelete)}"?`}
          </p>
          {itemToDelete?.type === 'assessment' && (
            <div className="mt-2 p-2 rounded-3" style={{
              background: darkMode ? '#2d2d44' : '#f8f9fa',
              border: `1px solid ${darkMode ? '#3d3d5c' : '#e9ecef'}`,
              borderRadius: '8px'
            }}>
              <div className="d-flex align-items-center gap-2">
                <FaFileAlt className="text-info" />
                <span className="text-muted small">
                  {isArabic ? 'التقييم: ' : 'Assessment: '}
                  <strong>{itemToDelete.subject}</strong>
                </span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <FaChalkboardTeacher className="text-primary" size={12} />
                <span className="text-muted small">
                  {isArabic ? 'المعلم: ' : 'Teacher: '}
                  {itemToDelete.teacherName}
                </span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <Badge bg={itemToDelete.submitted ? 'warning' : 'secondary'} style={{ fontSize: '0.55rem' }}>
                  {itemToDelete.submitted ? (isArabic ? 'مقدم' : 'Submitted') : (isArabic ? 'غير مقدم' : 'Not Submitted')}
                </Badge>
              </div>
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
          <Button variant="secondary" onClick={handleDeleteCancel} disabled={deleting} style={{ ...arabicFontStyle, borderRadius: '12px' }}>
            <FaTimes className="me-1" /> {isArabic ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm} disabled={deleting} style={{ ...arabicFontStyle, borderRadius: '12px' }}>
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
        .student-announcements {
          padding: 0;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .animate-pulse {
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .modern-card {
          background: ${darkMode ? '#1a1a2e' : '#ffffff'};
          border: 1px solid ${darkMode ? '#2d2d44' : '#e9ecef'};
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .modern-card:hover {
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }

        .modern-modal .modal-content {
          border-radius: 20px !important;
          border: none !important;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
          overflow: hidden;
        }

        .notification-item {
          transition: all 0.3s ease;
        }

        .notification-item:hover {
          transform: translateX(4px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }

        .notification-item.unread {
          background: ${darkMode ? 'rgba(196, 154, 108, 0.05)' : 'rgba(196, 154, 108, 0.03)'};
        }

        .announcement-card {
          transition: all 0.3s ease;
        }

        .announcement-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.1);
        }

        .announcement-card:hover .delete-btn {
          opacity: 1 !important;
        }

        .delete-btn {
          transition: all 0.3s ease;
        }

        .detail-item {
          padding: 8px 0;
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

        .announcement-avatar-lg {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 2.5rem;
          margin: 0 auto;
          transition: transform 0.3s ease;
        }

        .announcement-avatar-lg:hover {
          transform: scale(1.05);
        }

        .nav-tabs .nav-link {
          border: none;
          padding: 12px 20px;
          transition: all 0.3s ease;
        }

        .nav-tabs .nav-link:hover {
          background: transparent;
          color: #c49a6c;
        }

        .nav-tabs .nav-link.active {
          background: transparent;
          border: none;
          color: #c49a6c;
        }

        .stat-summary-card {
          transition: all 0.3s ease;
        }

        .stat-summary-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }

        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
            align-items: stretch !important;
          }
          .announcement-card {
            padding: 16px !important;
          }
          .nav-tabs .nav-link {
            padding: 10px 12px;
            font-size: 0.85rem;
          }
        }

        @media (max-width: 576px) {
          .announcement-card h5 {
            font-size: 0.9rem !important;
          }
          .announcement-card p {
            font-size: 0.8rem !important;
          }
          .nav-tabs .nav-link {
            padding: 8px 10px;
            font-size: 0.75rem;
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
          .delete-btn {
            width: 28px !important;
            height: 28px !important;
            font-size: 0.6rem !important;
            top: 6px !important;
            right: 6px !important;
          }
          .delete-btn svg {
            font-size: 12px !important;
          }
          .dashboard-wrapper.rtl .delete-btn {
            right: auto !important;
            left: 6px !important;
          }
          .stat-summary-card {
            padding: 8px 12px !important;
          }
          .stat-number {
            font-size: 1.2rem !important;
          }
          .stat-label {
            font-size: 0.55rem !important;
          }
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

        [dir="rtl"] .ms-3 {
          margin-left: 0 !important;
          margin-right: 1rem !important;
        }
      `}</style>
    </div>
  );
};

export default StudentAnnouncements;