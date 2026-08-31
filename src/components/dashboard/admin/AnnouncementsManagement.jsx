// src/components/dashboard/admin/AnnouncementsManagement.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Container, Row, Col, Card, Badge, Button, Table, 
  Modal, Form, Alert, InputGroup, Pagination 
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
  FaBullhorn, FaPlus, FaEdit, FaTrash, FaEye, FaSearch,
  FaSync, FaCheckCircle, FaTimesCircle, FaExclamationTriangle,
  FaSpinner, FaSave, FaTimes, FaFilter, FaDownload,
  FaPrint, FaClock, FaCalendarAlt, FaUser, FaEnvelope,
  FaBell, FaPaperPlane, FaImage, FaVideo, FaFile,
  FaCloudUploadAlt, FaUpload, FaArchive, FaEyeSlash,
  FaTag, FaUsers, FaStar, FaRegStar, FaShare, FaArrowRight,
  FaRocket, FaInfoCircle, FaChild, FaUserGraduate, FaChalkboardTeacher,
  FaUserPlus
} from 'react-icons/fa';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../hooks/useAuth';
import { useNotification } from '../../../hooks/useNotification';
import announcementService from '../../../services/announcementService';
import notificationService from '../../../services/notificationService';
import userDataService from '../../../services/userDataService';
import { format, formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import {
  getTranslation,
  getAnnouncementTitle,
  getAnnouncementContent,
  getAnnouncementTranslation,
  getAnnouncementKeys,
  getAllAnnouncements,
  translateAnnouncement
} from '../../../utils/translations';

// ===== ALWAYS use English numbers =====
const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  return num.toString();
};

// ===== Helper to save announcements to localStorage =====
const saveAnnouncementsToStorage = (announcements) => {
  try {
    localStorage.setItem('announcements', JSON.stringify(announcements));
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'announcements',
      newValue: JSON.stringify(announcements)
    }));
    return true;
  } catch (error) {
    console.error('Error saving announcements to localStorage:', error);
    return false;
  }
};

// ===== Helper to get announcements from localStorage =====
const getAnnouncementsFromStorage = () => {
  try {
    const stored = localStorage.getItem('announcements');
    if (stored) {
      const data = JSON.parse(stored);
      return Array.isArray(data) ? data : [];
    }
    return [];
  } catch (error) {
    console.error('Error getting announcements from localStorage:', error);
    return [];
  }
};

const AnnouncementsManagement = () => {
  const { isArabic, language } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notify } = useNotification();
  const tableRef = useRef(null);

  // ===== STATE =====
  const [announcements, setAnnouncements] = useState([]);
  const [allAnnouncementsData, setAllAnnouncementsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSendAlert, setShowSendAlert] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [processingAction, setProcessingAction] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [itemsPerPage] = useState(10);
  const [isMobile, setIsMobile] = useState(false);
  const [sendingAlert, setSendingAlert] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [mediaType, setMediaType] = useState('none');
  const [predefinedAnnouncementKey, setPredefinedAnnouncementKey] = useState('');
  const [announcementKeys, setAnnouncementKeys] = useState([]);

  // ===== FORM DATA =====
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'announcement',
    priority: 'medium',
    status: 'published',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    targetAudience: [],
    isActive: true,
    translationKey: ''
  });

  const [editFormData, setEditFormData] = useState({
    title: '',
    titleAr: '',
    content: '',
    contentAr: '',
    type: 'announcement',
    priority: 'medium',
    status: 'published',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    targetAudience: [],
    isActive: true,
    translationKey: ''
  });

  // ===== TYPE OPTIONS =====
  const typeOptions = [
    { value: 'announcement', label: isArabic ? 'إعلان' : 'Announcement', icon: <FaBullhorn />, color: '#c49a6c' },
    { value: 'event', label: isArabic ? 'حدث' : 'Event', icon: <FaCalendarAlt />, color: '#2ecc71' },
    { value: 'meeting', label: isArabic ? 'اجتماع' : 'Meeting', icon: <FaUsers />, color: '#f39c12' },
    { value: 'exam', label: isArabic ? 'امتحان' : 'Exam', icon: <FaCheckCircle />, color: '#e74c3c' },
    { value: 'news', label: isArabic ? 'خبر' : 'News', icon: <FaTag />, color: '#9b59b6' },
    { value: 'registration', label: isArabic ? 'تسجيل' : 'Registration', icon: <FaUserPlus />, color: '#4a9eff' }
  ];

  const priorityOptions = [
    { value: 'high', label: isArabic ? 'عالي' : 'High', color: '#e74c3c' },
    { value: 'medium', label: isArabic ? 'متوسط' : 'Medium', color: '#f39c12' },
    { value: 'low', label: isArabic ? 'منخفض' : 'Low', color: '#2ecc71' }
  ];

  const statusOptions = [
    { value: 'published', label: isArabic ? 'منشور' : 'Published', color: '#2ecc71' },
    { value: 'draft', label: isArabic ? 'مسودة' : 'Draft', color: '#6c757d' },
    { value: 'archived', label: isArabic ? 'مؤرشف' : 'Archived', color: '#e74c3c' }
  ];

  const audienceOptions = [
    { value: 'students', label: isArabic ? 'الطلاب' : 'Students', icon: <FaUserGraduate /> },
    { value: 'parents', label: isArabic ? 'أولياء الأمور' : 'Parents', icon: <FaUsers /> },
    { value: 'teachers', label: isArabic ? 'المعلمين' : 'Teachers', icon: <FaChalkboardTeacher /> },
    { value: 'all', label: isArabic ? 'الجميع' : 'All', icon: <FaUsers /> }
  ];

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

  // ===== Load announcement keys from translations =====
  useEffect(() => {
    const keys = getAnnouncementKeys(language);
    setAnnouncementKeys(keys);
  }, [language]);

  // ===== ARABIC FONT STYLE =====
  const arabicFontStyle = {
    fontFamily: isArabic ? '"Hacen Tunisia", "Hacen Tunisia Bd", "Noto Sans Arabic", "Vazirmatn", "Traditional Arabic", "Arabic Typesetting", serif' : 'inherit',
    lineHeight: isArabic ? '1.8' : '1.6',
    letterSpacing: isArabic ? '0.5px' : '0px',
    fontSize: isArabic ? 'clamp(0.95rem, 1.2vw, 1.1rem)' : 'clamp(0.9rem, 1.1vw, 1.05rem)',
  };

  // ===== GET TYPE LABEL =====
  const getTypeLabel = (type) => {
    const found = typeOptions.find(t => t.value === type);
    return found ? found.label : type;
  };

  const getTypeIcon = (type) => {
    const found = typeOptions.find(t => t.value === type);
    return found ? found.icon : <FaBullhorn />;
  };

  const getTypeColor = (type) => {
    const found = typeOptions.find(t => t.value === type);
    return found ? found.color : '#6c757d';
  };

  const getPriorityLabel = (priority) => {
    const found = priorityOptions.find(p => p.value === priority);
    return found ? found.label : priority;
  };

  const getPriorityColor = (priority) => {
    const found = priorityOptions.find(p => p.value === priority);
    return found ? found.color : '#6c757d';
  };

  const getStatusLabel = (status) => {
    const found = statusOptions.find(s => s.value === status);
    return found ? found.label : status;
  };

  const getStatusColor = (status) => {
    const found = statusOptions.find(s => s.value === status);
    return found ? found.color : '#6c757d';
  };

  const getAudienceLabel = (audience) => {
    const found = audienceOptions.find(a => a.value === audience);
    return found ? found.label : audience;
  };

  const getAudienceIcon = (audience) => {
    const found = audienceOptions.find(a => a.value === audience);
    return found ? found.icon : <FaUsers />;
  };

  // ===== TARGET AUDIENCE HANDLERS =====
  const handleAudienceToggle = (audienceValue, isEdit = false) => {
    const currentTargets = isEdit ? editFormData.targetAudience : formData.targetAudience;
    const setTargets = isEdit ? setEditFormData : setFormData;
    
    if (audienceValue === 'all') {
      const allValues = audienceOptions.map(a => a.value);
      setTargets(prev => ({ ...prev, targetAudience: allValues }));
    } else {
      let newTargets;
      if (currentTargets.includes(audienceValue)) {
        newTargets = currentTargets.filter(v => v !== audienceValue);
        if (newTargets.includes('all')) {
          newTargets = newTargets.filter(v => v !== 'all');
        }
      } else {
        newTargets = [...currentTargets, audienceValue];
        const allValues = audienceOptions.map(a => a.value);
        if (newTargets.length === allValues.length - 1) {
          newTargets = allValues;
        }
      }
      setTargets(prev => ({ ...prev, targetAudience: newTargets }));
    }
  };

  const isAudienceSelected = (audienceValue, isEdit = false) => {
    const currentTargets = isEdit ? editFormData.targetAudience : formData.targetAudience;
    return currentTargets.includes(audienceValue);
  };

  const isAllSelected = (isEdit = false) => {
    const currentTargets = isEdit ? editFormData.targetAudience : formData.targetAudience;
    const allValues = audienceOptions.map(a => a.value);
    return allValues.every(v => currentTargets.includes(v));
  };

  // ===== LOAD ANNOUNCEMENTS =====
  const loadAnnouncements = () => {
    setLoading(true);
    setError(null);

    try {
      const loaded = getAnnouncementsFromStorage();
      
      const sorted = loaded.sort((a, b) => {
        return new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date);
      });

      setAllAnnouncementsData(sorted);
      
      let filtered = [...sorted];
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter(a =>
          (a.title || '').toLowerCase().includes(searchLower) ||
          (a.titleAr || '').toLowerCase().includes(searchLower) ||
          (a.content || '').toLowerCase().includes(searchLower) ||
          (a.contentAr || '').toLowerCase().includes(searchLower) ||
          (a.author || '').toLowerCase().includes(searchLower)
        );
      }
      if (filterType !== 'all') {
        filtered = filtered.filter(a => a.type === filterType);
      }
      if (filterPriority !== 'all') {
        filtered = filtered.filter(a => a.priority === filterPriority);
      }
      if (filterStatus !== 'all') {
        filtered = filtered.filter(a => a.status === filterStatus);
      }

      setTotalItems(filtered.length);
      setTotalPages(Math.ceil(filtered.length / itemsPerPage));
      
      const start = (currentPage - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      const paginated = filtered.slice(start, end);
      setAnnouncements(paginated);
    } catch (error) {
      console.error('Error loading announcements:', error);
      setError(isArabic ? 'فشل في تحميل الإعلانات' : 'Failed to load announcements');
      setAnnouncements([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // ===== LISTEN FOR CHANGES =====
  useEffect(() => {
    loadAnnouncements();
    
    const handleStorageChange = (e) => {
      if (e.key === 'announcements') {
        loadAnnouncements();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    const handleAnnouncementsUpdated = () => {
      loadAnnouncements();
    };
    window.addEventListener('announcementsUpdated', handleAnnouncementsUpdated);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('announcementsUpdated', handleAnnouncementsUpdated);
    };
  }, []);

  // ===== EFFECTS =====
  useEffect(() => {
    loadAnnouncements();
  }, [currentPage, filterType, filterPriority, filterStatus]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (currentPage === 1) {
        loadAnnouncements();
      } else {
        setCurrentPage(1);
      }
    }, 500);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  // ===== HANDLE PREDEFINED ANNOUNCEMENT SELECTION =====
  const handlePredefinedAnnouncementSelect = (key, isEdit = false) => {
    const setTarget = isEdit ? setEditFormData : setFormData;
    const currentData = isEdit ? editFormData : formData;
    
    if (key) {
      const translation = getAnnouncementTranslation(key, language);
      setTarget(prev => ({
        ...prev,
        title: translation.title,
        content: translation.content,
        translationKey: key
      }));
    } else {
      setTarget(prev => ({
        ...prev,
        title: '',
        content: '',
        translationKey: ''
      }));
    }
    setPredefinedAnnouncementKey(key);
  };

  // ===== GET TRANSLATED CONTENT =====
  const getTranslatedTitle = (announcement) => {
    if (!announcement) return '';
    // If there's a translation key, use it
    if (announcement.translationKey) {
      const translation = getAnnouncementTranslation(announcement.translationKey, language);
      if (translation.title !== announcement.translationKey) {
        return translation.title;
      }
    }
    // Otherwise use stored translations
    return isArabic ? (announcement.titleAr || announcement.title) : announcement.title;
  };

  const getTranslatedContent = (announcement) => {
    if (!announcement) return '';
    // If there's a translation key, use it
    if (announcement.translationKey) {
      const translation = getAnnouncementTranslation(announcement.translationKey, language);
      if (translation.content !== announcement.translationKey) {
        return translation.content;
      }
    }
    // Otherwise use stored translations
    return isArabic ? (announcement.contentAr || announcement.content) : announcement.content;
  };

  // ===== HANDLE FILE UPLOAD =====
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedFile(file);
      setPreviewUrl(reader.result);
      
      if (file.type.startsWith('image/')) {
        setMediaType('image');
      } else if (file.type.startsWith('video/')) {
        setMediaType('video');
      } else {
        setMediaType('file');
      }
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setMediaType('none');
  };

  // ===== SEND NOTIFICATIONS TO TARGET AUDIENCE =====
  const sendNotificationsToAudience = (announcement) => {
    try {
      const targetAudience = announcement.targetAudience || ['all'];
      const allUsers = JSON.parse(localStorage.getItem('school_users') || '[]');
      const allStudents = JSON.parse(localStorage.getItem('school_students') || '[]');
      const allParents = JSON.parse(localStorage.getItem('school_parents') || '[]');
      const allTeachers = allUsers.filter(u => u.role === 'teacher');

      let recipients = [];

      if (targetAudience.includes('all')) {
        recipients = [...allUsers, ...allStudents, ...allParents];
      } else {
        if (targetAudience.includes('students')) {
          recipients = [...recipients, ...allStudents];
        }
        if (targetAudience.includes('parents')) {
          recipients = [...recipients, ...allParents];
        }
        if (targetAudience.includes('teachers')) {
          recipients = [...recipients, ...allTeachers];
        }
      }

      const uniqueRecipients = [];
      const seenIds = new Set();
      recipients.forEach(r => {
        if (r.id && !seenIds.has(r.id)) {
          seenIds.add(r.id);
          uniqueRecipients.push(r);
        }
      });

      console.log(`📢 Sending announcement to ${uniqueRecipients.length} recipients`);

      const title = getTranslatedTitle(announcement);
      const titleAr = announcement.titleAr || announcement.title;
      const message = getTranslatedContent(announcement);
      const messageAr = announcement.contentAr || announcement.content;

      const notification = {
        id: `NOT${String(Date.now()).slice(-6)}`,
        title: `📢 ${title}`,
        titleAr: `📢 ${titleAr}`,
        message: message.substring(0, 200) + (message.length > 200 ? '...' : ''),
        messageAr: messageAr.substring(0, 200) + (messageAr.length > 200 ? '...' : ''),
        type: 'announcement',
        priority: announcement.priority || 'medium',
        read: false,
        recipientRole: 'all',
        announcementId: announcement.id,
        author: announcement.author || 'Admin',
        createdAt: new Date().toISOString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        link: '/announcements',
        targetAudience: targetAudience,
        translationKey: announcement.translationKey || null
      };

      const allNotifications = JSON.parse(localStorage.getItem('school_notifications') || '[]');
      allNotifications.push(notification);
      localStorage.setItem('school_notifications', JSON.stringify(allNotifications));

      window.dispatchEvent(new CustomEvent('notificationAdded', { detail: notification }));
      window.dispatchEvent(new CustomEvent('newNotification', { 
        detail: {
          title: notification.title,
          titleAr: notification.titleAr,
          message: notification.message,
          messageAr: notification.messageAr,
          type: 'announcement',
          link: '/announcements'
        }
      }));

      const existingAnnouncements = JSON.parse(localStorage.getItem('announcements') || '[]');
      const updatedAnnouncements = existingAnnouncements.map(a => {
        if (a.id === announcement.id) {
          return { ...a, notified: true, notifiedAt: new Date().toISOString() };
        }
        return a;
      });
      localStorage.setItem('announcements', JSON.stringify(updatedAnnouncements));

      console.log(`✅ Notification sent to ${uniqueRecipients.length} users`);

    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  };

  // ===== HANDLE ADD ANNOUNCEMENT =====
  const handleAddAnnouncement = () => {
    if (!formData.title || !formData.title.trim()) {
      notify(
        isArabic ? 'يرجى إدخال عنوان الإعلان' : 'Please enter announcement title',
        'warning'
      );
      return;
    }
    if (!formData.content || !formData.content.trim()) {
      notify(
        isArabic ? 'يرجى إدخال محتوى الإعلان' : 'Please enter announcement content',
        'warning'
      );
      return;
    }
    if (formData.targetAudience.length === 0) {
      notify(
        isArabic ? 'يرجى اختيار الجمهور المستهدف' : 'Please select target audience',
        'warning'
      );
      return;
    }

    setProcessingAction(true);

    try {
      let titleAr = formData.title.trim();
      let contentAr = formData.content.trim();

      // If there's a translation key, use the translations
      if (formData.translationKey) {
        const translation = getAnnouncementTranslation(formData.translationKey, 'ar');
        const enTranslation = getAnnouncementTranslation(formData.translationKey, 'en');
        titleAr = translation.title !== formData.translationKey ? translation.title : titleAr;
        contentAr = translation.content !== formData.translationKey ? translation.content : contentAr;
        
        // Use English version as main title if available
        if (enTranslation.title !== formData.translationKey) {
          formData.title = enTranslation.title;
        }
        if (enTranslation.content !== formData.translationKey) {
          formData.content = enTranslation.content;
        }
      } else {
        // Auto-generate Arabic translation if no translation key
        // (Keep the existing translateToArabic logic if needed)
        // For now, just use the same content for both languages
        titleAr = formData.title.trim();
        contentAr = formData.content.trim();
      }

      console.log('📢 Announcement data:', {
        title: formData.title.trim(),
        titleAr: titleAr,
        content: formData.content.trim(),
        contentAr: contentAr,
        translationKey: formData.translationKey
      });

      const newAnnouncement = {
        id: Date.now() + '_' + Math.random().toString(36).slice(2, 8),
        title: formData.title.trim(),
        titleAr: titleAr,
        content: formData.content.trim(),
        contentAr: contentAr,
        type: formData.type || 'announcement',
        priority: formData.priority || 'medium',
        status: formData.status || 'published',
        date: formData.date || new Date().toISOString().split('T')[0],
        time: formData.time || new Date().toTimeString().slice(0, 5),
        targetAudience: formData.targetAudience || [],
        isActive: formData.isActive !== false,
        author: user?.displayName || user?.name || (isArabic ? 'المسؤول' : 'Admin'),
        authorId: user?.id || null,
        image: mediaType === 'image' ? previewUrl : null,
        video: mediaType === 'video' ? previewUrl : null,
        mediaType: mediaType !== 'none' ? mediaType : null,
        views: 0,
        likes: 0,
        comments: 0,
        notified: false,
        translationKey: formData.translationKey || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const existing = getAnnouncementsFromStorage();
      const updated = [...existing, newAnnouncement];
      
      const saved = saveAnnouncementsToStorage(updated);
      
      if (!saved) {
        throw new Error('Failed to save to localStorage');
      }

      setAllAnnouncementsData(updated);
      
      window.dispatchEvent(new CustomEvent('announcementsUpdated', {
        detail: { announcement: newAnnouncement }
      }));

      if (formData.status === 'published') {
        sendNotificationsToAudience(newAnnouncement);
      }

      notify(
        isArabic ? 'تم إضافة الإعلان بنجاح' : 'Announcement added successfully',
        'success'
      );
      
      resetFormData();
      setShowAddModal(false);
      loadAnnouncements();
    } catch (error) {
      console.error('Error adding announcement:', error);
      notify(
        isArabic ? 'فشل في إضافة الإعلان: ' + error.message : 'Failed to add announcement: ' + error.message,
        'error'
      );
    } finally {
      setProcessingAction(false);
    }
  };

  // ===== RESET FORM DATA =====
  const resetFormData = () => {
    setFormData({
      title: '',
      content: '',
      type: 'announcement',
      priority: 'medium',
      status: 'published',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      targetAudience: [],
      isActive: true,
      translationKey: ''
    });
    setPredefinedAnnouncementKey('');
    setSelectedFile(null);
    setPreviewUrl(null);
    setMediaType('none');
  };

  // ===== HANDLE EDIT ANNOUNCEMENT =====
  const handleEditAnnouncement = (ann) => {
    setSelectedAnnouncement(ann);
    
    // If there's a translation key, get the translations
    let titleAr = ann.titleAr || ann.title;
    let contentAr = ann.contentAr || ann.content;
    
    if (ann.translationKey) {
      const translation = getAnnouncementTranslation(ann.translationKey, 'ar');
      if (translation.title !== ann.translationKey) {
        titleAr = translation.title;
      }
      if (translation.content !== ann.translationKey) {
        contentAr = translation.content;
      }
    }
    
    setEditFormData({
      title: ann.title || '',
      titleAr: titleAr,
      content: ann.content || '',
      contentAr: contentAr,
      type: ann.type || 'announcement',
      priority: ann.priority || 'medium',
      status: ann.status || 'published',
      date: ann.date || new Date().toISOString().split('T')[0],
      time: ann.time || new Date().toTimeString().slice(0, 5),
      targetAudience: ann.targetAudience || [],
      isActive: ann.isActive !== false,
      translationKey: ann.translationKey || ''
    });
    setPredefinedAnnouncementKey(ann.translationKey || '');
    
    if (ann.image || ann.video) {
      setPreviewUrl(ann.image || ann.video);
      setMediaType(ann.mediaType || 'image');
    }
    setShowEditModal(true);
  };

  // ===== HANDLE SAVE EDIT =====
  const handleSaveEdit = () => {
    if (!editFormData.title || !editFormData.title.trim()) {
      notify(
        isArabic ? 'يرجى إدخال عنوان الإعلان' : 'Please enter announcement title',
        'warning'
      );
      return;
    }
    if (!editFormData.content || !editFormData.content.trim()) {
      notify(
        isArabic ? 'يرجى إدخال محتوى الإعلان' : 'Please enter announcement content',
        'warning'
      );
      return;
    }
    if (editFormData.targetAudience.length === 0) {
      notify(
        isArabic ? 'يرجى اختيار الجمهور المستهدف' : 'Please select target audience',
        'warning'
      );
      return;
    }

    setProcessingAction(true);
    try {
      let titleAr = editFormData.titleAr || editFormData.title.trim();
      let contentAr = editFormData.contentAr || editFormData.content.trim();

      // If there's a translation key, use the translations
      if (editFormData.translationKey) {
        const translation = getAnnouncementTranslation(editFormData.translationKey, 'ar');
        const enTranslation = getAnnouncementTranslation(editFormData.translationKey, 'en');
        titleAr = translation.title !== editFormData.translationKey ? translation.title : titleAr;
        contentAr = translation.content !== editFormData.translationKey ? translation.content : contentAr;
        
        // Use English version as main title if available
        if (enTranslation.title !== editFormData.translationKey) {
          editFormData.title = enTranslation.title;
        }
        if (enTranslation.content !== editFormData.translationKey) {
          editFormData.content = enTranslation.content;
        }
      }

      const existing = getAnnouncementsFromStorage();
      const updatedAnnouncements = existing.map(a => {
        if (a.id === selectedAnnouncement.id) {
          return {
            ...a,
            title: editFormData.title.trim(),
            titleAr: titleAr,
            content: editFormData.content.trim(),
            contentAr: contentAr,
            type: editFormData.type || 'announcement',
            priority: editFormData.priority || 'medium',
            status: editFormData.status || 'published',
            date: editFormData.date || new Date().toISOString().split('T')[0],
            time: editFormData.time || new Date().toTimeString().slice(0, 5),
            targetAudience: editFormData.targetAudience || [],
            isActive: editFormData.isActive !== false,
            translationKey: editFormData.translationKey || null,
            updatedAt: new Date().toISOString(),
            image: mediaType === 'image' ? previewUrl : a.image,
            video: mediaType === 'video' ? previewUrl : a.video,
            mediaType: mediaType !== 'none' ? mediaType : a.mediaType,
          };
        }
        return a;
      });

      const saved = saveAnnouncementsToStorage(updatedAnnouncements);
      
      if (!saved) {
        throw new Error('Failed to save to localStorage');
      }

      setAllAnnouncementsData(updatedAnnouncements);
      window.dispatchEvent(new CustomEvent('announcementsUpdated'));

      if (editFormData.status === 'published' && selectedAnnouncement.status !== 'published') {
        const updatedAnn = updatedAnnouncements.find(a => a.id === selectedAnnouncement.id);
        if (updatedAnn) {
          sendNotificationsToAudience(updatedAnn);
        }
      }

      notify(
        isArabic ? 'تم تحديث الإعلان بنجاح' : 'Announcement updated successfully',
        'success'
      );
      
      setShowEditModal(false);
      loadAnnouncements();
    } catch (error) {
      console.error('Error updating announcement:', error);
      notify(
        isArabic ? 'فشل في تحديث الإعلان' : 'Failed to update announcement',
        'error'
      );
    } finally {
      setProcessingAction(false);
    }
  };

  // ===== HANDLE DELETE ANNOUNCEMENT =====
  const handleDeleteAnnouncement = () => {
    setProcessingAction(true);
    try {
      const existing = getAnnouncementsFromStorage();
      const updated = existing.filter(a => a.id !== selectedAnnouncement.id);
      
      const saved = saveAnnouncementsToStorage(updated);
      
      if (!saved) {
        throw new Error('Failed to save to localStorage');
      }

      setAllAnnouncementsData(updated);
      window.dispatchEvent(new CustomEvent('announcementsUpdated'));

      notify(
        isArabic ? 'تم حذف الإعلان بنجاح' : 'Announcement deleted successfully',
        'success'
      );
      
      setShowDeleteConfirm(false);
      loadAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      notify(
        isArabic ? 'فشل في حذف الإعلان' : 'Failed to delete announcement',
        'error'
      );
    } finally {
      setProcessingAction(false);
    }
  };

  // ===== HANDLE TOGGLE STATUS =====
  const handleToggleStatus = (announcementId, currentStatus) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    try {
      const existing = getAnnouncementsFromStorage();
      const updatedAnnouncements = existing.map(a => {
        if (a.id === announcementId) {
          return { ...a, status: newStatus, updatedAt: new Date().toISOString() };
        }
        return a;
      });

      const saved = saveAnnouncementsToStorage(updatedAnnouncements);
      
      if (!saved) {
        throw new Error('Failed to save to localStorage');
      }

      setAllAnnouncementsData(updatedAnnouncements);
      window.dispatchEvent(new CustomEvent('announcementsUpdated'));

      if (newStatus === 'published') {
        const updatedAnn = updatedAnnouncements.find(a => a.id === announcementId);
        if (updatedAnn) {
          sendNotificationsToAudience(updatedAnn);
        }
      }

      notify(
        isArabic ? `تم ${newStatus === 'published' ? 'نشر' : 'إلغاء نشر'} الإعلان بنجاح` : 
        `Announcement ${newStatus === 'published' ? 'published' : 'unpublished'} successfully`,
        'success'
      );
      
      loadAnnouncements();
    } catch (error) {
      console.error('Error toggling status:', error);
      notify(
        isArabic ? 'فشل في تغيير حالة الإعلان' : 'Failed to change announcement status',
        'error'
      );
    }
  };

  // ===== HANDLE SEND ALERT =====
  const handleSendAlert = (announcement) => {
    setSendingAlert(true);
    setTimeout(() => {
      try {
        sendNotificationsToAudience(announcement);
        
        notify(
          isArabic ? 'تم إرسال التنبيه بنجاح' : 'Alert sent successfully',
          'success'
        );
      } catch (error) {
        console.error('Error sending alert:', error);
        notify(
          isArabic ? 'فشل في إرسال التنبيه' : 'Failed to send alert',
          'error'
        );
      } finally {
        setSendingAlert(false);
        setShowSendAlert(false);
      }
    }, 1500);
  };

  // ===== EXPORT FUNCTIONALITY =====
  const handleExport = () => {
    try {
      let exportData = [...allAnnouncementsData];
      
      if (filterType !== 'all') {
        exportData = exportData.filter(a => a.type === filterType);
      }
      if (filterPriority !== 'all') {
        exportData = exportData.filter(a => a.priority === filterPriority);
      }
      if (filterStatus !== 'all') {
        exportData = exportData.filter(a => a.status === filterStatus);
      }
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        exportData = exportData.filter(a =>
          (a.title || '').toLowerCase().includes(searchLower) ||
          (a.titleAr || '').toLowerCase().includes(searchLower) ||
          (a.content || '').toLowerCase().includes(searchLower) ||
          (a.contentAr || '').toLowerCase().includes(searchLower)
        );
      }

      if (exportData.length === 0) {
        notify(
          isArabic ? 'لا توجد بيانات للتصدير' : 'No data to export',
          'warning'
        );
        return;
      }

      const headers = isArabic 
        ? ['#', 'العنوان', 'العنوان (عربي)', 'النوع', 'الأولوية', 'الحالة', 'التاريخ', 'المؤلف', 'الجمهور المستهدف']
        : ['#', 'Title', 'Title (Arabic)', 'Type', 'Priority', 'Status', 'Date', 'Author', 'Target Audience'];

      const rows = exportData.map((ann, index) => [
        index + 1,
        getTranslatedTitle(ann),
        ann.titleAr || ann.title,
        getTypeLabel(ann.type),
        getPriorityLabel(ann.priority),
        getStatusLabel(ann.status),
        ann.date || ann.createdAt,
        ann.author || 'Admin',
        (ann.targetAudience || []).map(a => getAudienceLabel(a)).join(', ')
      ]);

      let csvContent = headers.join(',') + '\n';
      rows.forEach(row => {
        csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `announcements_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      notify(
        isArabic ? 'تم تصدير البيانات بنجاح' : 'Data exported successfully',
        'success'
      );
    } catch (error) {
      console.error('Export error:', error);
      notify(
        isArabic ? 'فشل في تصدير البيانات' : 'Failed to export data',
        'error'
      );
    }
  };

  // ===== PRINT FUNCTIONALITY =====
  const handlePrint = () => {
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        notify(
          isArabic ? 'يرجى السماح بالنوافذ المنبثقة للطباعة' : 'Please allow popups for printing',
          'warning'
        );
        return;
      }

      const currentData = announcements.length > 0 ? announcements : allAnnouncementsData;
      
      if (currentData.length === 0) {
        notify(
          isArabic ? 'لا توجد بيانات للطباعة' : 'No data to print',
          'warning'
        );
        return;
      }

      const title = isArabic ? 'قائمة الإعلانات' : 'Announcements List';
      const dateStr = new Date().toLocaleDateString(isArabic ? 'ar-TN' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      let tableRows = '';
      currentData.forEach((ann, index) => {
        const displayTitle = getTranslatedTitle(ann);
        const displayContent = getTranslatedContent(ann);
        tableRows += `
          <tr>
            <td>${index + 1}</td>
            <td>${displayTitle}</td>
            <td>${getTypeLabel(ann.type)}</td>
            <td>${getPriorityLabel(ann.priority)}</td>
            <td>${getStatusLabel(ann.status)}</td>
            <td>${ann.date || ann.createdAt}</td>
            <td>${ann.author || 'Admin'}</td>
            <td>${(ann.targetAudience || []).map(a => getAudienceLabel(a)).join(', ')}</td>
          </tr>
        `;
      });

      const printHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title}</title>
            <style>
              body {
                font-family: ${isArabic ? '"Hacen Tunisia", "Noto Sans Arabic", serif' : 'Arial, sans-serif'};
                padding: 40px;
                color: #212529;
                direction: ${isArabic ? 'rtl' : 'ltr'};
              }
              .print-header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #c49a6c;
                padding-bottom: 20px;
              }
              .print-header h1 {
                color: #c49a6c;
                margin: 0;
                font-size: 24px;
              }
              .print-header p {
                color: #6c757d;
                margin: 5px 0 0;
                font-size: 14px;
              }
              .print-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
              }
              .print-table th {
                background: #f8f9fa;
                color: #212529;
                font-weight: 600;
                padding: 12px 15px;
                border: 1px solid #dee2e6;
                text-align: ${isArabic ? 'right' : 'left'};
              }
              .print-table td {
                padding: 10px 15px;
                border: 1px solid #dee2e6;
                text-align: ${isArabic ? 'right' : 'left'};
              }
              .print-table tr:nth-child(even) {
                background: #f8f9fa;
              }
              .print-footer {
                margin-top: 30px;
                text-align: center;
                color: #6c757d;
                font-size: 12px;
                border-top: 1px solid #dee2e6;
                padding-top: 20px;
              }
              @media print {
                body { padding: 20px; }
              }
            </style>
          </head>
          <body>
            <div class="print-header">
              <h1>${title}</h1>
              <p>${isArabic ? 'تم إنشاء التقرير في' : 'Generated on'} ${dateStr}</p>
              <p style="font-size:12px;color:#adb5bd;margin-top:4px;">
                ${isArabic ? `إجمالي الإعلانات: ${formatNumber(currentData.length)}` : `Total Announcements: ${formatNumber(currentData.length)}`}
              </p>
            </div>
            <table class="print-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>${isArabic ? 'العنوان' : 'Title'}</th>
                  <th>${isArabic ? 'النوع' : 'Type'}</th>
                  <th>${isArabic ? 'الأولوية' : 'Priority'}</th>
                  <th>${isArabic ? 'الحالة' : 'Status'}</th>
                  <th>${isArabic ? 'التاريخ' : 'Date'}</th>
                  <th>${isArabic ? 'المؤلف' : 'Author'}</th>
                  <th>${isArabic ? 'الجمهور المستهدف' : 'Target Audience'}</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
            <div class="print-footer">
              ${isArabic ? '© جميع الحقوق محفوظة - نظام إدارة المدرسة' : '© All Rights Reserved - School Management System'}
            </div>
            <script>
              window.onload = function() { window.print(); }
            <\/script>
          </body>
        </html>
      `;

      printWindow.document.write(printHtml);
      printWindow.document.close();
    } catch (error) {
      console.error('Print error:', error);
      notify(
        isArabic ? 'فشل في الطباعة' : 'Failed to print',
        'error'
      );
    }
  };

  // ===== CALCULATE STATS =====
  const stats = {
    total: allAnnouncementsData.length,
    published: allAnnouncementsData.filter(a => a.status === 'published').length,
    draft: allAnnouncementsData.filter(a => a.status === 'draft').length,
    archived: allAnnouncementsData.filter(a => a.status === 'archived').length,
  };

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

  return (
    <div className="announcements-management" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Page Header */}
      <div className="page-header d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ ...arabicFontStyle, color: '#c49a6c', fontSize: isArabic ? 'clamp(1.1rem, 1.8vw, 1.5rem)' : 'clamp(1rem, 1.6vw, 1.4rem)' }}>
            <FaBullhorn className="me-2" /> 
            {isArabic ? 'إدارة الإعلانات' : 'Announcements Management'}
          </h4>
          <p className="text-muted mb-0" style={{ ...arabicFontStyle, fontSize: isArabic ? 'clamp(0.9rem, 1.1vw, 1.05rem)' : 'clamp(0.85rem, 1vw, 1rem)' }}>
            {isArabic 
              ? `عرض جميع الإعلانات في النظام (${formatNumber(totalItems)})`
              : `View all announcements in the system (${formatNumber(totalItems)})`}
          </p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <Button 
            variant="outline-primary" 
            size="sm" 
            onClick={loadAnnouncements}
            disabled={loading}
            style={{ ...arabicFontStyle, borderRadius: '12px' }}
          >
            <FaSync className={loading ? 'spinning' : ''} /> {isArabic ? 'تحديث' : 'Refresh'}
          </Button>
          {!isMobile && (
            <>
              <Button 
                variant="outline-secondary" 
                size="sm" 
                onClick={handleExport}
                style={{ ...arabicFontStyle, borderRadius: '12px' }}
              >
                <FaDownload className="me-1" /> {isArabic ? 'تصدير' : 'Export'}
              </Button>
              <Button 
                variant="outline-secondary" 
                size="sm" 
                onClick={handlePrint}
                style={{ ...arabicFontStyle, borderRadius: '12px' }}
              >
                <FaPrint className="me-1" /> {isArabic ? 'طباعة' : 'Print'}
              </Button>
            </>
          )}
          <Button 
            variant="primary" 
            size="sm" 
            onClick={() => {
              resetFormData();
              setShowAddModal(true);
            }}
            style={{ ...arabicFontStyle, borderRadius: '12px' }}
          >
            <FaPlus className="me-1" /> {isArabic ? 'إضافة إعلان' : 'Add Announcement'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <Row className="g-3 g-md-4 mb-4">
        <Col xs={6} md={3}>
          <div className="stat-card-enhanced total-card">
            <div className="stat-card-gradient-bar"></div>
            <div className="stat-card-content">
              <div className="stat-icon-wrapper total-icon">
                <FaBullhorn />
              </div>
              <div className="stat-info">
                <span className="stat-number">{formatNumber(stats.total)}</span>
                <span className="stat-label">{isArabic ? 'الإجمالي' : 'Total'}</span>
              </div>
            </div>
            <div className="stat-card-shimmer"></div>
          </div>
        </Col>
        <Col xs={6} md={3}>
          <div className="stat-card-enhanced active-card">
            <div className="stat-card-gradient-bar"></div>
            <div className="stat-card-content">
              <div className="stat-icon-wrapper active-icon">
                <FaCheckCircle />
              </div>
              <div className="stat-info">
                <span className="stat-number">{formatNumber(stats.published)}</span>
                <span className="stat-label">{isArabic ? 'منشور' : 'Published'}</span>
              </div>
            </div>
            <div className="stat-card-shimmer"></div>
          </div>
        </Col>
        <Col xs={6} md={3}>
          <div className="stat-card-enhanced children-card">
            <div className="stat-card-gradient-bar"></div>
            <div className="stat-card-content">
              <div className="stat-icon-wrapper children-icon">
                <FaEyeSlash />
              </div>
              <div className="stat-info">
                <span className="stat-number">{formatNumber(stats.draft)}</span>
                <span className="stat-label">{isArabic ? 'مسودة' : 'Draft'}</span>
              </div>
            </div>
            <div className="stat-card-shimmer"></div>
          </div>
        </Col>
        <Col xs={6} md={3}>
          <div className="stat-card-enhanced inactive-card">
            <div className="stat-card-gradient-bar"></div>
            <div className="stat-card-content">
              <div className="stat-icon-wrapper inactive-icon">
                <FaArchive />
              </div>
              <div className="stat-info">
                <span className="stat-number">{formatNumber(stats.archived)}</span>
                <span className="stat-label">{isArabic ? 'مؤرشف' : 'Archived'}</span>
              </div>
            </div>
            <div className="stat-card-shimmer"></div>
          </div>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="modern-card mb-4" style={{ background: darkMode ? '#1a1a2e' : '#ffffff', borderColor: darkMode ? '#2d2d44' : '#e9ecef' }}>
        <Card.Body>
          <Row className="g-3">
            <Col xs={12} md={6} lg={4}>
              <InputGroup>
                <InputGroup.Text style={{ background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px 0 0 12px' }}>
                  <FaSearch className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder={isArabic ? 'بحث بالعنوان أو المحتوى...' : 'Search by title or content...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
            <Col xs={4} md={2} lg={2}>
              <Form.Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px' }}
              >
                <option value="all">{isArabic ? 'جميع الأنواع' : 'All Types'}</option>
                {typeOptions.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={4} md={2} lg={2}>
              <Form.Select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px' }}
              >
                <option value="all">{isArabic ? 'جميع الأولويات' : 'All Priorities'}</option>
                {priorityOptions.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={4} md={2} lg={2}>
              <Form.Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px' }}
              >
                <option value="all">{isArabic ? 'جميع الحالات' : 'All Status'}</option>
                {statusOptions.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={12} md={12} lg={2} className="d-flex gap-2">
              <Button 
                variant="outline-secondary" 
                size="sm" 
                className="flex-grow-1"
                onClick={handleExport}
                style={{ ...arabicFontStyle, borderRadius: '12px' }}
                title={isArabic ? 'تصدير' : 'Export'}
              >
                <FaDownload /> 
              </Button>
              <Button 
                variant="outline-secondary" 
                size="sm" 
                className="flex-grow-1"
                onClick={handlePrint}
                style={{ ...arabicFontStyle, borderRadius: '12px' }}
                title={isArabic ? 'طباعة' : 'Print'}
              >
                <FaPrint /> 
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Announcements Table */}
      <Card className="modern-card" style={{ background: darkMode ? '#1a1a2e' : '#ffffff', borderColor: darkMode ? '#2d2d44' : '#e9ecef' }}>
        <Card.Body className="p-0" ref={tableRef}>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 text-muted" style={arabicFontStyle}>
                {isArabic ? 'جاري تحميل الإعلانات...' : 'Loading announcements...'}
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-5">
              <FaExclamationTriangle size={48} className="text-warning mb-3" />
              <p className="text-danger" style={arabicFontStyle}>{error}</p>
              <Button variant="primary" onClick={loadAnnouncements} style={{ ...arabicFontStyle, borderRadius: '12px' }}>
                <FaSync className="me-2" /> {isArabic ? 'إعادة المحاولة' : 'Retry'}
              </Button>
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-5">
              <FaBullhorn size={48} className="text-muted opacity-25 mb-3" />
              <p style={arabicFontStyle}>
                {isArabic ? 'لا توجد إعلانات لعرضها' : 'No announcements to display'}
              </p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <Table hover className="mb-0" style={arabicFontStyle}>
                  <thead style={{ background: darkMode ? '#0d1117' : '#f8f9fa' }}>
                    <tr>
                      <th style={{ color: darkMode ? '#e9ecef' : '#212529', whiteSpace: 'nowrap', width: isMobile ? '40px' : 'auto' }}>
                        {isArabic ? '#' : '#'}
                      </th>
                      <th style={{ color: darkMode ? '#e9ecef' : '#212529', whiteSpace: 'nowrap' }}>
                        {isArabic ? 'العنوان' : 'Title'}
                      </th>
                      {!isMobile && (
                        <th style={{ color: darkMode ? '#e9ecef' : '#212529', whiteSpace: 'nowrap' }}>
                          {isArabic ? 'النوع' : 'Type'}
                        </th>
                      )}
                      <th style={{ color: darkMode ? '#e9ecef' : '#212529', whiteSpace: 'nowrap' }}>
                        {isArabic ? 'الأولوية' : 'Priority'}
                      </th>
                      <th style={{ color: darkMode ? '#e9ecef' : '#212529', whiteSpace: 'nowrap' }}>
                        {isArabic ? 'الحالة' : 'Status'}
                      </th>
                      {!isMobile && (
                        <th style={{ color: darkMode ? '#e9ecef' : '#212529', whiteSpace: 'nowrap' }}>
                          {isArabic ? 'التاريخ' : 'Date'}
                        </th>
                      )}
                      <th className="text-center" style={{ color: darkMode ? '#e9ecef' : '#212529', whiteSpace: 'nowrap', width: isMobile ? '100px' : 'auto' }}>
                        {isArabic ? 'إجراءات' : 'Actions'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {announcements.map((ann, index) => {
                      const globalIndex = (currentPage - 1) * itemsPerPage + index + 1;
                      const typeColor = getTypeColor(ann.type);
                      const priorityColor = getPriorityColor(ann.priority);
                      const statusColor = getStatusColor(ann.status);
                      const displayTitle = getTranslatedTitle(ann);
                      
                      return (
                        <tr key={ann.id}>
                          <td style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.75rem' : 'inherit' }}>
                            {formatNumber(globalIndex)}
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div 
                                className="announcement-avatar-sm"
                                style={{
                                  background: `linear-gradient(135deg, ${typeColor}, ${typeColor}dd)`,
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
                                }}
                              >
                                {displayTitle.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="fw-semibold" style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.8rem' : 'inherit' }}>
                                  {displayTitle}
                                </div>
                                {!isMobile && (
                                  <small className="text-muted" style={{ ...arabicFontStyle, fontSize: '0.65rem' }}>
                                    <FaUser className="me-1" size={10} /> {ann.author || (isArabic ? 'المسؤول' : 'Admin')}
                                  </small>
                                )}
                              </div>
                            </div>
                          </td>
                          {!isMobile && (
                            <td>
                              <Badge 
                                style={{ 
                                  background: typeColor,
                                  color: 'white',
                                  padding: '4px 12px',
                                  borderRadius: '8px',
                                  fontSize: '0.7rem'
                                }}
                              >
                                {getTypeIcon(ann.type)} {getTypeLabel(ann.type)}
                              </Badge>
                            </td>
                          )}
                          <td>
                            <Badge 
                              style={{ 
                                background: priorityColor,
                                color: 'white',
                                padding: isMobile ? '3px 8px' : '4px 12px',
                                borderRadius: '8px',
                                fontSize: isMobile ? '0.6rem' : '0.7rem'
                              }}
                            >
                              {getPriorityLabel(ann.priority)}
                            </Badge>
                          </td>
                          <td>
                            <Badge 
                              style={{ 
                                background: statusColor,
                                color: 'white',
                                padding: isMobile ? '3px 8px' : '4px 12px',
                                borderRadius: '8px',
                                fontSize: isMobile ? '0.6rem' : '0.7rem'
                              }}
                            >
                              {getStatusLabel(ann.status)}
                            </Badge>
                          </td>
                          {!isMobile && (
                            <td>
                              <div style={{ fontSize: isMobile ? '0.7rem' : '0.8rem', color: darkMode ? '#adb5bd' : '#6c757d' }}>
                                <FaCalendarAlt className="me-1" size={12} />
                                {ann.date || format(new Date(ann.createdAt), 'yyyy-MM-dd')}
                              </div>
                              <small style={{ fontSize: '0.6rem', color: darkMode ? '#6c757d' : '#adb5bd' }}>
                                <FaClock className="me-1" size={10} />
                                {ann.time || format(new Date(ann.createdAt), 'HH:mm')}
                              </small>
                            </td>
                          )}
                          <td>
                            <div className="d-flex gap-1 justify-content-center flex-wrap">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => { setSelectedAnnouncement(ann); setShowViewModal(true); }}
                                title={isArabic ? 'عرض' : 'View'}
                                style={{ borderRadius: '8px', padding: isMobile ? '2px 6px' : '4px 8px', fontSize: isMobile ? '0.6rem' : 'inherit' }}
                              >
                                <FaEye style={{ fontSize: isMobile ? '0.6rem' : 'inherit' }} />
                              </Button>
                              <Button
                                variant="outline-warning"
                                size="sm"
                                onClick={() => handleEditAnnouncement(ann)}
                                title={isArabic ? 'تعديل' : 'Edit'}
                                style={{ borderRadius: '8px', padding: isMobile ? '2px 6px' : '4px 8px', fontSize: isMobile ? '0.6rem' : 'inherit' }}
                              >
                                <FaEdit style={{ fontSize: isMobile ? '0.6rem' : 'inherit' }} />
                              </Button>
                              <Button
                                variant={ann.status === 'published' ? 'outline-secondary' : 'outline-success'}
                                size="sm"
                                onClick={() => handleToggleStatus(ann.id, ann.status)}
                                title={ann.status === 'published' ? (isArabic ? 'إلغاء النشر' : 'Unpublish') : (isArabic ? 'نشر' : 'Publish')}
                                style={{ borderRadius: '8px', padding: isMobile ? '2px 6px' : '4px 8px', fontSize: isMobile ? '0.6rem' : 'inherit' }}
                              >
                                {ann.status === 'published' ? <FaEyeSlash style={{ fontSize: isMobile ? '0.6rem' : 'inherit' }} /> : <FaCheckCircle style={{ fontSize: isMobile ? '0.6rem' : 'inherit' }} />}
                              </Button>
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => { setSelectedAnnouncement(ann); setShowSendAlert(true); }}
                                title={isArabic ? 'إرسال تنبيه' : 'Send Alert'}
                                style={{ borderRadius: '8px', padding: isMobile ? '2px 6px' : '4px 8px', fontSize: isMobile ? '0.6rem' : 'inherit' }}
                              >
                                <FaPaperPlane style={{ fontSize: isMobile ? '0.6rem' : 'inherit' }} />
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => { setSelectedAnnouncement(ann); setShowDeleteConfirm(true); }}
                                title={isArabic ? 'حذف' : 'Delete'}
                                style={{ borderRadius: '8px', padding: isMobile ? '2px 6px' : '4px 8px', fontSize: isMobile ? '0.6rem' : 'inherit' }}
                              >
                                <FaTrash style={{ fontSize: isMobile ? '0.6rem' : 'inherit' }} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center p-3 border-top gap-2" style={{ borderColor: darkMode ? '#2d2d44' : '#e9ecef' }}>
                  <div className="text-muted small" style={{ ...arabicFontStyle, color: darkMode ? '#adb5bd' : '#6c757d', fontSize: isMobile ? '0.65rem' : 'inherit' }}>
                    {isArabic 
                      ? `عرض ${formatNumber(announcements.length)} من ${formatNumber(totalItems)} إعلان`
                      : `Showing ${formatNumber(announcements.length)} of ${formatNumber(totalItems)} announcements`}
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
        </Card.Body>
      </Card>

      {/* ===== ADD ANNOUNCEMENT MODAL ===== */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered size={isMobile ? 'md' : 'lg'} className="modern-modal">
        <Modal.Header closeButton className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Modal.Title style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '1rem' : 'inherit' }}>
            <FaPlus className="me-2 text-primary" />
            {isArabic ? 'إضافة إعلان جديد' : 'Add New Announcement'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? '#0d1117' : 'white' }}>
          <Form>
            {/* Predefined Announcement Selection */}
            <Form.Group className="mb-3">
              <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.85rem' : 'inherit' }}>
                {isArabic ? 'إعلان جاهز (اختياري)' : 'Predefined Announcement (Optional)'}
              </Form.Label>
              <Form.Select
                value={predefinedAnnouncementKey}
                onChange={(e) => handlePredefinedAnnouncementSelect(e.target.value, false)}
                style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: isMobile ? '0.85rem' : 'inherit' }}
              >
                <option value="">{isArabic ? '-- اختر إعلاناً جاهزاً --' : '-- Select Predefined Announcement --'}</option>
                {announcementKeys.map(key => {
                  const translation = getAnnouncementTranslation(key, language);
                  return (
                    <option key={key} value={key}>
                      {translation.title || key}
                    </option>
                  );
                })}
              </Form.Select>
              <small className="text-muted" style={{ ...arabicFontStyle, fontSize: '0.65rem' }}>
                {isArabic 
                  ? 'اختر إعلاناً جاهزاً وسيتم ملء العنوان والمحتوى تلقائياً' 
                  : 'Select a predefined announcement and it will auto-fill the title and content'}
              </small>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.85rem' : 'inherit' }}>
                {isArabic ? 'العنوان' : 'Title'} *
              </Form.Label>
              <Form.Control
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={isArabic ? 'أدخل عنوان الإعلان' : 'Enter announcement title'}
                style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: isMobile ? '0.85rem' : 'inherit' }}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.85rem' : 'inherit' }}>
                {isArabic ? 'المحتوى' : 'Content'} *
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder={isArabic ? 'أدخل محتوى الإعلان' : 'Enter announcement content'}
                style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: isMobile ? '0.85rem' : 'inherit' }}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.85rem' : 'inherit' }}>
                {isArabic ? 'رفع وسائط' : 'Upload Media'}
              </Form.Label>
              <div className="media-upload-area" style={{ background: darkMode ? '#2d2d44' : '#f8f9fa', borderColor: darkMode ? '#3d3d5c' : '#dee2e6' }}>
                {previewUrl ? (
                  <div className="media-preview">
                    {mediaType === 'image' && <img src={previewUrl} alt="Preview" style={{ maxHeight: '200px', maxWidth: '100%', borderRadius: '8px' }} />}
                    {mediaType === 'video' && <video src={previewUrl} controls style={{ maxHeight: '200px', maxWidth: '100%', borderRadius: '8px' }} />}
                    {mediaType === 'file' && <div><FaFile size={40} className="text-muted" /> <p style={arabicFontStyle}>{selectedFile?.name}</p></div>}
                    <Button variant="danger" size="sm" onClick={removeFile} className="mt-2" style={{ ...arabicFontStyle, borderRadius: '50px', fontSize: isMobile ? '0.7rem' : 'inherit' }}>
                      <FaTimes className="me-1" /> {isArabic ? 'إزالة' : 'Remove'}
                    </Button>
                  </div>
                ) : (
                  <div>
                    <FaCloudUploadAlt size={40} className="text-muted mb-2" />
                    <p className="text-muted small" style={arabicFontStyle}>{isArabic ? 'اسحب الملف هنا أو انقر للتصفح' : 'Drag and drop file here or click to browse'}</p>
                    <Form.Control type="file" accept="image/*,video/*" onChange={handleFileUpload} style={{ display: 'none' }} id="fileUpload" />
                    <Button variant="outline-primary" size="sm" onClick={() => document.getElementById('fileUpload').click()} style={{ ...arabicFontStyle, borderRadius: '50px', fontSize: isMobile ? '0.7rem' : 'inherit' }}>
                      <FaUpload className="me-1" /> {isArabic ? 'اختر ملف' : 'Choose File'}
                    </Button>
                    <small className="d-block text-muted mt-2" style={{ ...arabicFontStyle, fontSize: '0.6rem' }}>
                      {isArabic ? 'يدعم الصور والفيديوهات (حجم أقصى: 10 ميجابايت)' : 'Supports images and videos (Max size: 10MB)'}
                    </small>
                  </div>
                )}
              </div>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.85rem' : 'inherit' }}>
                    {isArabic ? 'النوع' : 'Type'} *
                  </Form.Label>
                  <Form.Select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: isMobile ? '0.85rem' : 'inherit' }}
                  >
                    {typeOptions.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.85rem' : 'inherit' }}>
                    {isArabic ? 'الأولوية' : 'Priority'} *
                  </Form.Label>
                  <Form.Select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: isMobile ? '0.85rem' : 'inherit' }}
                  >
                    {priorityOptions.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.85rem' : 'inherit' }}>
                    {isArabic ? 'الحالة' : 'Status'} *
                  </Form.Label>
                  <Form.Select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: isMobile ? '0.85rem' : 'inherit' }}
                  >
                    {statusOptions.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.85rem' : 'inherit' }}>
                    {isArabic ? 'الجمهور المستهدف' : 'Target Audience'} *
                  </Form.Label>
                  <div className="audience-checkbox-group" style={{ 
                    background: darkMode ? '#2d2d44' : '#f8f9fa', 
                    borderRadius: '12px', 
                    padding: '12px 16px',
                    border: `1px solid ${darkMode ? '#3d3d5c' : '#dee2e6'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div className="mb-2 pb-2" style={{ borderBottom: `1px solid ${darkMode ? '#3d3d5c' : '#dee2e6'}` }}>
                      <Form.Check
                        type="checkbox"
                        id="select-all-audience"
                        label={
                          <span style={{ ...arabicFontStyle, fontWeight: 'bold', color: darkMode ? '#e9ecef' : '#212529' }}>
                            {isArabic ? 'تحديد الكل' : 'Select All'}
                          </span>
                        }
                        checked={isAllSelected(false)}
                        onChange={() => {
                          if (isAllSelected(false)) {
                            setFormData(prev => ({ ...prev, targetAudience: [] }));
                          } else {
                            const allValues = audienceOptions.map(a => a.value);
                            setFormData(prev => ({ ...prev, targetAudience: allValues }));
                          }
                        }}
                        style={{ ...arabicFontStyle }}
                      />
                    </div>
                    <div className="d-flex flex-wrap gap-3">
                      {audienceOptions.map((audience) => (
                        <Form.Check
                          key={audience.value}
                          type="checkbox"
                          id={`audience-${audience.value}`}
                          label={
                            <span style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                              {getAudienceIcon(audience.value)} {audience.label}
                            </span>
                          }
                          checked={isAudienceSelected(audience.value, false)}
                          onChange={() => handleAudienceToggle(audience.value, false)}
                          style={{ ...arabicFontStyle }}
                        />
                      ))}
                    </div>
                  </div>
                  <small className="text-muted" style={{ ...arabicFontStyle, fontSize: '0.6rem', marginTop: '4px', display: 'block' }}>
                    {isArabic ? 'اختر الجمهور المستهدف لهذا الإعلان' : 'Select the target audience for this announcement'}
                  </small>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.85rem' : 'inherit' }}>
                    {isArabic ? 'التاريخ' : 'Date'} *
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: isMobile ? '0.85rem' : 'inherit' }}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.85rem' : 'inherit' }}>
                    {isArabic ? 'الوقت' : 'Time'} *
                  </Form.Label>
                  <Form.Control
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: isMobile ? '0.85rem' : 'inherit' }}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Check
                type="switch"
                id="announcementStatus"
                label={isArabic ? 'الإعلان نشط' : 'Announcement Active'}
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                style={{ ...arabicFontStyle, fontSize: isMobile ? '0.85rem' : 'inherit' }}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Button variant="secondary" onClick={() => setShowAddModal(false)} disabled={processingAction} style={{ ...arabicFontStyle, borderRadius: '12px', fontSize: isMobile ? '0.8rem' : 'inherit' }}>
            {isArabic ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAddAnnouncement} 
            disabled={processingAction} 
            style={{ ...arabicFontStyle, borderRadius: '12px', fontSize: isMobile ? '0.8rem' : 'inherit' }}
          >
            {processingAction ? (
              <><FaSpinner className="spinning me-2" /> {isArabic ? 'جاري...' : 'Adding...'}</>
            ) : (
              <><FaSave className="me-2" /> {isArabic ? 'إضافة' : 'Add'}</>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===== EDIT ANNOUNCEMENT MODAL ===== */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered size={isMobile ? 'md' : 'lg'} className="modern-modal">
        <Modal.Header closeButton className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Modal.Title style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '1rem' : 'inherit' }}>
            <FaEdit className="me-2 text-warning" />
            {isArabic ? 'تعديل الإعلان' : 'Edit Announcement'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? '#0d1117' : 'white' }}>
          <Form>
            {/* Predefined Announcement Selection for Edit */}
            <Form.Group className="mb-3">
              <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.85rem' : 'inherit' }}>
                {isArabic ? 'إعلان جاهز (اختياري)' : 'Predefined Announcement (Optional)'}
              </Form.Label>
              <Form.Select
                value={predefinedAnnouncementKey}
                onChange={(e) => handlePredefinedAnnouncementSelect(e.target.value, true)}
                style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: isMobile ? '0.85rem' : 'inherit' }}
              >
                <option value="">{isArabic ? '-- اختر إعلاناً جاهزاً --' : '-- Select Predefined Announcement --'}</option>
                {announcementKeys.map(key => {
                  const translation = getAnnouncementTranslation(key, language);
                  return (
                    <option key={key} value={key}>
                      {translation.title || key}
                    </option>
                  );
                })}
              </Form.Select>
              <small className="text-muted" style={{ ...arabicFontStyle, fontSize: '0.65rem' }}>
                {isArabic 
                  ? 'اختر إعلاناً جاهزاً وسيتم ملء العنوان والمحتوى تلقائياً' 
                  : 'Select a predefined announcement and it will auto-fill the title and content'}
              </small>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.85rem' : 'inherit' }}>
                {isArabic ? 'العنوان' : 'Title'} *
              </Form.Label>
              <Form.Control
                type="text"
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: isMobile ? '0.85rem' : 'inherit' }}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.85rem' : 'inherit' }}>
                {isArabic ? 'المحتوى' : 'Content'} *
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={editFormData.content}
                onChange={(e) => setEditFormData({ ...editFormData, content: e.target.value })}
                style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: isMobile ? '0.85rem' : 'inherit' }}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.85rem' : 'inherit' }}>
                {isArabic ? 'رفع وسائط' : 'Upload Media'}
              </Form.Label>
              <div className="media-upload-area" style={{ background: darkMode ? '#2d2d44' : '#f8f9fa', borderColor: darkMode ? '#3d3d5c' : '#dee2e6' }}>
                {previewUrl ? (
                  <div className="media-preview">
                    {mediaType === 'image' && <img src={previewUrl} alt="Preview" style={{ maxHeight: '200px', maxWidth: '100%', borderRadius: '8px' }} />}
                    {mediaType === 'video' && <video src={previewUrl} controls style={{ maxHeight: '200px', maxWidth: '100%', borderRadius: '8px' }} />}
                    {mediaType === 'file' && <div><FaFile size={40} className="text-muted" /> <p style={arabicFontStyle}>{selectedFile?.name}</p></div>}
                    <Button variant="danger" size="sm" onClick={removeFile} className="mt-2" style={{ ...arabicFontStyle, borderRadius: '50px', fontSize: isMobile ? '0.7rem' : 'inherit' }}>
                      <FaTimes className="me-1" /> {isArabic ? 'إزالة' : 'Remove'}
                    </Button>
                  </div>
                ) : (
                  <div>
                    <FaCloudUploadAlt size={40} className="text-muted mb-2" />
                    <p className="text-muted small" style={arabicFontStyle}>{isArabic ? 'اسحب الملف هنا أو انقر للتصفح' : 'Drag and drop file here or click to browse'}</p>
                    <Form.Control type="file" accept="image/*,video/*" onChange={handleFileUpload} style={{ display: 'none' }} id="fileUploadEdit" />
                    <Button variant="outline-primary" size="sm" onClick={() => document.getElementById('fileUploadEdit').click()} style={{ ...arabicFontStyle, borderRadius: '50px', fontSize: isMobile ? '0.7rem' : 'inherit' }}>
                      <FaUpload className="me-1" /> {isArabic ? 'اختر ملف' : 'Choose File'}
                    </Button>
                  </div>
                )}
              </div>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.85rem' : 'inherit' }}>
                    {isArabic ? 'النوع' : 'Type'} *
                  </Form.Label>
                  <Form.Select
                    value={editFormData.type}
                    onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                    style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: isMobile ? '0.85rem' : 'inherit' }}
                  >
                    {typeOptions.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.85rem' : 'inherit' }}>
                    {isArabic ? 'الأولوية' : 'Priority'} *
                  </Form.Label>
                  <Form.Select
                    value={editFormData.priority}
                    onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value })}
                    style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: isMobile ? '0.85rem' : 'inherit' }}
                  >
                    {priorityOptions.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.85rem' : 'inherit' }}>
                    {isArabic ? 'الحالة' : 'Status'} *
                  </Form.Label>
                  <Form.Select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: isMobile ? '0.85rem' : 'inherit' }}
                  >
                    {statusOptions.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.85rem' : 'inherit' }}>
                    {isArabic ? 'الجمهور المستهدف' : 'Target Audience'} *
                  </Form.Label>
                  <div className="audience-checkbox-group" style={{ 
                    background: darkMode ? '#2d2d44' : '#f8f9fa', 
                    borderRadius: '12px', 
                    padding: '12px 16px',
                    border: `1px solid ${darkMode ? '#3d3d5c' : '#dee2e6'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div className="mb-2 pb-2" style={{ borderBottom: `1px solid ${darkMode ? '#3d3d5c' : '#dee2e6'}` }}>
                      <Form.Check
                        type="checkbox"
                        id="select-all-audience-edit"
                        label={
                          <span style={{ ...arabicFontStyle, fontWeight: 'bold', color: darkMode ? '#e9ecef' : '#212529' }}>
                            {isArabic ? 'تحديد الكل' : 'Select All'}
                          </span>
                        }
                        checked={isAllSelected(true)}
                        onChange={() => {
                          if (isAllSelected(true)) {
                            setEditFormData(prev => ({ ...prev, targetAudience: [] }));
                          } else {
                            const allValues = audienceOptions.map(a => a.value);
                            setEditFormData(prev => ({ ...prev, targetAudience: allValues }));
                          }
                        }}
                        style={{ ...arabicFontStyle }}
                      />
                    </div>
                    <div className="d-flex flex-wrap gap-3">
                      {audienceOptions.map((audience) => (
                        <Form.Check
                          key={audience.value}
                          type="checkbox"
                          id={`audience-edit-${audience.value}`}
                          label={
                            <span style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                              {getAudienceIcon(audience.value)} {audience.label}
                            </span>
                          }
                          checked={isAudienceSelected(audience.value, true)}
                          onChange={() => handleAudienceToggle(audience.value, true)}
                          style={{ ...arabicFontStyle }}
                        />
                      ))}
                    </div>
                  </div>
                  <small className="text-muted" style={{ ...arabicFontStyle, fontSize: '0.6rem', marginTop: '4px', display: 'block' }}>
                    {isArabic ? 'اختر الجمهور المستهدف لهذا الإعلان' : 'Select the target audience for this announcement'}
                  </small>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.85rem' : 'inherit' }}>
                    {isArabic ? 'التاريخ' : 'Date'} *
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={editFormData.date}
                    onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                    style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: isMobile ? '0.85rem' : 'inherit' }}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.85rem' : 'inherit' }}>
                    {isArabic ? 'الوقت' : 'Time'} *
                  </Form.Label>
                  <Form.Control
                    type="time"
                    value={editFormData.time}
                    onChange={(e) => setEditFormData({ ...editFormData, time: e.target.value })}
                    style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: isMobile ? '0.85rem' : 'inherit' }}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Check
                type="switch"
                id="editAnnouncementStatus"
                label={isArabic ? 'الإعلان نشط' : 'Announcement Active'}
                checked={editFormData.isActive}
                onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                style={{ ...arabicFontStyle, fontSize: isMobile ? '0.85rem' : 'inherit' }}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Button variant="secondary" onClick={() => setShowEditModal(false)} disabled={processingAction} style={{ ...arabicFontStyle, borderRadius: '12px', fontSize: isMobile ? '0.8rem' : 'inherit' }}>
            {isArabic ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button variant="warning" onClick={handleSaveEdit} disabled={processingAction} style={{ ...arabicFontStyle, borderRadius: '12px', fontSize: isMobile ? '0.8rem' : 'inherit' }}>
            {processingAction ? (
              <><FaSpinner className="spinning me-2" /> {isArabic ? 'جاري...' : 'Saving...'}</>
            ) : (
              <><FaSave className="me-2" /> {isArabic ? 'حفظ التغييرات' : 'Save Changes'}</>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===== VIEW ANNOUNCEMENT MODAL ===== */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} centered size="lg" className="modern-modal">
        <Modal.Header closeButton className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Modal.Title style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '1rem' : 'inherit' }}>
            <FaEye className="me-2 text-primary" />
            {isArabic ? 'تفاصيل الإعلان' : 'Announcement Details'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? '#0d1117' : 'white' }}>
          {selectedAnnouncement && (
            <div>
              <div className="text-center mb-4">
                <div 
                  className="announcement-avatar-lg mx-auto"
                  style={{
                    background: `linear-gradient(135deg, ${getTypeColor(selectedAnnouncement.type)}, ${getTypeColor(selectedAnnouncement.type)}dd)`,
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '2.5rem',
                    margin: '0 auto',
                    boxShadow: `0 8px 30px ${getTypeColor(selectedAnnouncement.type)}40`
                  }}
                >
                  {getTranslatedTitle(selectedAnnouncement).charAt(0).toUpperCase()}
                </div>
                <h5 className="fw-bold mt-3" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                  {getTranslatedTitle(selectedAnnouncement)}
                </h5>
                <Badge style={{ background: getTypeColor(selectedAnnouncement.type), color: 'white', borderRadius: '8px' }}>
                  {getTypeIcon(selectedAnnouncement.type)} {getTypeLabel(selectedAnnouncement.type)}
                </Badge>
                <div className="mt-2">
                  <Badge style={{ background: getPriorityColor(selectedAnnouncement.priority), color: 'white', borderRadius: '8px' }}>
                    {isArabic ? 'الأولوية:' : 'Priority:'} {getPriorityLabel(selectedAnnouncement.priority)}
                  </Badge>
                  <Badge style={{ background: getStatusColor(selectedAnnouncement.status), color: 'white', borderRadius: '8px', marginLeft: '4px' }}>
                    {getStatusLabel(selectedAnnouncement.status)}
                  </Badge>
                </div>
              </div>

              {(selectedAnnouncement.image || selectedAnnouncement.video) && (
                <div className="mb-3">
                  {selectedAnnouncement.mediaType === 'image' && (
                    <img src={selectedAnnouncement.image} alt={selectedAnnouncement.title} className="img-fluid rounded" style={{ maxHeight: '300px', width: '100%', objectFit: 'cover' }} />
                  )}
                  {selectedAnnouncement.mediaType === 'video' && (
                    <video src={selectedAnnouncement.video} controls className="img-fluid rounded" style={{ maxHeight: '300px', width: '100%' }} />
                  )}
                </div>
              )}

              <div className="detail-item">
                <label className="text-muted small" style={arabicFontStyle}>{isArabic ? 'المحتوى' : 'Content'}</label>
                <p className="fw-semibold mb-0" style={{ color: darkMode ? '#e9ecef' : '#212529', whiteSpace: 'pre-wrap' }}>
                  {getTranslatedContent(selectedAnnouncement)}
                </p>
              </div>

              <Row className="mt-3">
                <Col md={6}>
                  <div className="detail-item">
                    <label className="text-muted small" style={arabicFontStyle}>
                      <FaUser className="me-1" /> {isArabic ? 'المؤلف' : 'Author'}
                    </label>
                    <p className="fw-semibold mb-0" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                      {selectedAnnouncement.author || (isArabic ? 'المسؤول' : 'Admin')}
                    </p>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="detail-item">
                    <label className="text-muted small" style={arabicFontStyle}>
                      <FaCalendarAlt className="me-1" /> {isArabic ? 'التاريخ والوقت' : 'Date & Time'}
                    </label>
                    <p className="fw-semibold mb-0" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                      {selectedAnnouncement.date || format(new Date(selectedAnnouncement.createdAt), 'PPP')}
                      {selectedAnnouncement.time && ` - ${selectedAnnouncement.time}`}
                    </p>
                  </div>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <div className="detail-item">
                    <label className="text-muted small" style={arabicFontStyle}>
                      <FaEye className="me-1" /> {isArabic ? 'المشاهدات' : 'Views'}
                    </label>
                    <p className="fw-semibold mb-0" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                      {formatNumber(selectedAnnouncement.views || 0)}
                    </p>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="detail-item">
                    <label className="text-muted small" style={arabicFontStyle}>
                      <FaUsers className="me-1" /> {isArabic ? 'الجمهور المستهدف' : 'Target Audience'}
                    </label>
                    <div className="d-flex flex-wrap gap-1">
                      {(selectedAnnouncement.targetAudience || []).map((audience, idx) => (
                        <Badge key={idx} bg="secondary" className="px-2" style={{ ...arabicFontStyle, fontSize: '0.65rem' }}>
                          {getAudienceIcon(audience)} {getAudienceLabel(audience)}
                        </Badge>
                      ))}
                      {(!selectedAnnouncement.targetAudience || selectedAnnouncement.targetAudience.length === 0) && (
                        <span className="text-muted" style={{ ...arabicFontStyle, fontSize: '0.65rem' }}>
                          {isArabic ? 'غير محدد' : 'Not specified'}
                        </span>
                      )}
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Button variant="secondary" onClick={() => setShowViewModal(false)} style={{ ...arabicFontStyle, borderRadius: '12px', fontSize: isMobile ? '0.8rem' : 'inherit' }}>
            {isArabic ? 'إغلاق' : 'Close'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===== SEND ALERT MODAL ===== */}
      <Modal show={showSendAlert} onHide={() => setShowSendAlert(false)} centered className="modern-modal">
        <Modal.Header closeButton className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Modal.Title style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '1rem' : 'inherit' }}>
            <FaPaperPlane className="me-2 text-success" />
            {isArabic ? 'إرسال تنبيه' : 'Send Alert'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? '#0d1117' : 'white' }}>
          {selectedAnnouncement && (
            <>
              <div className="text-center mb-3">
                <div className="rounded-circle bg-success bg-opacity-10 d-inline-flex p-3 mb-2">
                  <FaBell size={32} className="text-success" />
                </div>
                <h5 style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                  {isArabic ? 'إرسال تنبيه للجميع' : 'Send Alert to All'}
                </h5>
                <p className="text-muted" style={arabicFontStyle}>
                  {isArabic 
                    ? `سيتم إرسال هذا التنبيه للجمهور المستهدف: "${getTranslatedTitle(selectedAnnouncement)}"`
                    : `This alert will be sent to the target audience: "${selectedAnnouncement.title}"`}
                </p>
              </div>
              <Alert variant="info" style={{ ...arabicFontStyle, fontSize: isMobile ? '0.8rem' : 'inherit' }}>
                <FaInfoCircle className="me-2" />
                {isArabic 
                  ? 'سيستلم الجمهور المستهدف هذا التنبيه عبر الإشعارات.' 
                  : 'The target audience will receive this alert via notifications.'}
              </Alert>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Button variant="secondary" onClick={() => setShowSendAlert(false)} disabled={sendingAlert} style={{ ...arabicFontStyle, borderRadius: '12px', fontSize: isMobile ? '0.8rem' : 'inherit' }}>
            {isArabic ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button variant="success" onClick={() => handleSendAlert(selectedAnnouncement)} disabled={sendingAlert} style={{ ...arabicFontStyle, borderRadius: '12px', fontSize: isMobile ? '0.8rem' : 'inherit' }}>
            {sendingAlert ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                {isArabic ? 'جاري الإرسال...' : 'Sending...'}
              </>
            ) : (
              <>
                <FaPaperPlane className="me-2" /> {isArabic ? 'إرسال التنبيه' : 'Send Alert'}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===== DELETE CONFIRMATION MODAL ===== */}
      <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered className="modern-modal">
        <Modal.Header closeButton className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Modal.Title style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '1rem' : 'inherit' }}>
            <FaExclamationTriangle className="me-2 text-danger" />
            {isArabic ? 'تأكيد الحذف' : 'Confirm Delete'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? '#0d1117' : 'white' }}>
          <p style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.85rem' : 'inherit' }}>
            {isArabic
              ? `هل أنت متأكد من حذف الإعلان "${getTranslatedTitle(selectedAnnouncement)}"؟ هذا الإجراء لا يمكن التراجع عنه.`
              : `Are you sure you want to delete announcement "${selectedAnnouncement?.title}"? This action cannot be undone.`}
          </p>
          {selectedAnnouncement?.status === 'published' && (
            <Alert variant="warning" style={{ ...arabicFontStyle, fontSize: isMobile ? '0.8rem' : 'inherit' }}>
              {isArabic
                ? 'تحذير: هذا الإعلان منشور وقد شاهده بعض المستخدمين.'
                : 'Warning: This announcement is published and may have been viewed by users.'}
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)} disabled={processingAction} style={{ ...arabicFontStyle, borderRadius: '12px', fontSize: isMobile ? '0.8rem' : 'inherit' }}>
            {isArabic ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button variant="danger" onClick={handleDeleteAnnouncement} disabled={processingAction} style={{ ...arabicFontStyle, borderRadius: '12px', fontSize: isMobile ? '0.8rem' : 'inherit' }}>
            {processingAction ? (
              <><FaSpinner className="spinning me-2" /> {isArabic ? 'جاري...' : 'Deleting...'}</>
            ) : (
              <><FaTrash className="me-2" /> {isArabic ? 'تأكيد الحذف' : 'Confirm Delete'}</>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .announcements-management {
          padding: 0;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .stat-card-enhanced {
          background: ${darkMode ? '#1a1a2e' : '#ffffff'};
          border: 1px solid ${darkMode ? '#2d2d44' : '#e9ecef'};
          border-radius: 16px;
          padding: 20px 24px;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          height: 100%;
          min-height: 100px;
          position: relative;
          overflow: hidden;
          cursor: pointer;
        }

        .stat-card-enhanced:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 16px 48px rgba(0,0,0,0.12);
        }

        .stat-card-gradient-bar {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          transition: height 0.4s ease;
        }

        .stat-card-enhanced:hover .stat-card-gradient-bar {
          height: 6px;
        }

        .total-card .stat-card-gradient-bar {
          background: linear-gradient(90deg, #c49a6c, #dbb88a);
        }

        .active-card .stat-card-gradient-bar {
          background: linear-gradient(90deg, #2ecc71, #27ae60);
        }

        .children-card .stat-card-gradient-bar {
          background: linear-gradient(90deg, #4a9eff, #6ab0ff);
        }

        .inactive-card .stat-card-gradient-bar {
          background: linear-gradient(90deg, #e74c3c, #c0392b);
        }

        .stat-card-content {
          display: flex;
          align-items: center;
          gap: 16px;
          position: relative;
          z-index: 1;
        }

        .stat-icon-wrapper {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          flex-shrink: 0;
          transition: transform 0.3s ease;
        }

        .stat-card-enhanced:hover .stat-icon-wrapper {
          transform: scale(1.1) rotate(-5deg);
        }

        .total-icon {
          background: rgba(196, 154, 108, 0.15);
          color: #c49a6c;
        }

        .active-icon {
          background: rgba(46, 204, 113, 0.15);
          color: #2ecc71;
        }

        .children-icon {
          background: rgba(74, 158, 255, 0.15);
          color: #4a9eff;
        }

        .inactive-icon {
          background: rgba(231, 76, 60, 0.15);
          color: #e74c3c;
        }

        .stat-info {
          flex: 1;
          min-width: 0;
        }

        .stat-number {
          display: block;
          font-size: 1.8rem;
          font-weight: 700;
          color: ${darkMode ? '#e9ecef' : '#1a1a2e'};
          line-height: 1.2;
          letter-spacing: -0.5px;
        }

        .stat-label {
          font-size: 0.75rem;
          color: ${darkMode ? '#adb5bd' : '#6c757d'};
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
          margin-top: 2px;
        }

        .stat-card-shimmer {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
          transition: left 0.6s ease;
          pointer-events: none;
        }

        .stat-card-enhanced:hover .stat-card-shimmer {
          left: 100%;
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

        .modern-modal .modal-header {
          padding: 20px 24px 0;
          border-bottom: none;
        }

        .modern-modal .modal-body {
          padding: 16px 24px 24px;
        }

        .modern-modal .modal-footer {
          padding: 8px 24px 20px;
          border-top: none;
        }

        .modern-modal .modal-header .btn-close {
          transition: transform 0.3s ease;
        }

        .modern-modal .modal-header .btn-close:hover {
          transform: rotate(90deg);
        }

        .media-upload-area {
          border: 2px dashed ${darkMode ? '#3d3d5c' : '#dee2e6'};
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          transition: all 0.3s ease;
          background: ${darkMode ? '#2d2d44' : '#f8f9fa'};
        }

        .media-upload-area:hover {
          border-color: #c49a6c;
          background: ${darkMode ? '#3d3d5c' : 'rgba(196, 154, 108, 0.05)'};
        }

        .media-preview {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .announcement-avatar-sm {
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          flex-shrink: 0;
          transition: transform 0.3s ease;
        }

        .announcement-avatar-sm:hover {
          transform: scale(1.15);
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

        .audience-checkbox-group .form-check {
          margin-bottom: 4px;
        }

        .audience-checkbox-group .form-check-input:checked {
          background-color: #c49a6c;
          border-color: #c49a6c;
        }

        @media (max-width: 992px) {
          .stat-card-enhanced {
            min-height: 90px;
            padding: 18px 20px;
          }
          .stat-number {
            font-size: 1.6rem;
          }
        }

        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
            align-items: stretch !important;
          }
          .stat-card-enhanced {
            padding: 16px 18px;
            min-height: 80px;
          }
          .stat-number {
            font-size: 1.4rem;
          }
          .stat-icon-wrapper {
            width: 42px;
            height: 42px;
            font-size: 1.1rem;
          }
          .table-responsive {
            font-size: 0.85rem;
          }
          .table td, .table th {
            padding: 0.5rem;
          }
          .audience-checkbox-group .d-flex {
            flex-direction: column;
            gap: 6px !important;
          }
        }

        @media (max-width: 576px) {
          .stat-card-enhanced {
            padding: 12px 14px;
            min-height: 70px;
          }
          .stat-number {
            font-size: 1.1rem;
          }
          .stat-icon-wrapper {
            width: 34px;
            height: 34px;
            font-size: 0.9rem;
          }
          .stat-label {
            font-size: 0.6rem;
          }
          .table td, .table th {
            padding: 0.3rem;
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
          .audience-checkbox-group .d-flex {
            flex-direction: column;
            gap: 4px !important;
          }
          .table-responsive table thead tr th:nth-child(3),
          .table-responsive table tbody tr td:nth-child(3),
          .table-responsive table thead tr th:nth-child(6),
          .table-responsive table tbody tr td:nth-child(6) {
            display: none;
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
      `}</style>
    </div>
  );
};

export default AnnouncementsManagement;