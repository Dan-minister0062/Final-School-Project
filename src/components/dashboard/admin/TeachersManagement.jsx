// src/components/dashboard/admin/TeachersManagement.jsx
import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Badge, Button, Table, 
  Modal, Form, Alert, InputGroup, Pagination 
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
  FaUsers, FaUserPlus, FaSearch, FaFilter, FaEye, 
  FaEdit, FaTrash, FaEnvelope, FaPhone, FaMapMarkerAlt,
  FaCheckCircle, FaTimesCircle, FaSync, FaDownload, FaPrint,
  FaChevronDown, FaChevronUp, FaExclamationTriangle,
  FaSpinner, FaUserTie, FaCalendarAlt, FaIdCard,
  FaUserGraduate, FaChalkboardTeacher, FaUserCircle,
  FaBook, FaClock, FaSchool, FaGraduationCap,
  FaBuilding, FaBriefcase, FaBirthdayCake, FaVenusMars,
  FaGlobe, FaIdBadge, FaPhoneAlt, FaHandshake,
  FaChild, FaCity, FaMapPin, FaUserMd, FaSearchPlus,
  FaGripLines, FaChartLine, FaAward, FaCertificate,
  FaRocket, FaStar, FaMedal, FaTrophy,
  FaUniversity, FaSort, FaSortUp, FaSortDown,
  FaTimes as FaTimesIcon
} from 'react-icons/fa';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../hooks/useAuth';
import { useNotification } from '../../../hooks/useNotification';
import userDataService from '../../../services/userDataService';
import { fetchServerClasses, toCatalogClasses } from '../../../services/classService';
import { format, formatDistanceToNow, isValid } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

// ===== SAFE DATE FORMAT =====
const safeFormatDate = (date, formatStr = "PPP", options = {}) => {
  if (!date) return "N/A";
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!isValid(dateObj)) return "N/A";
    return format(dateObj, formatStr, options);
  } catch {
    return "N/A";
  }
};

// ===== ALWAYS use English numbers =====
const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  return num.toString();
};

const TeachersManagement = () => {
  const { isArabic } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notify } = useNotification();
  
  // State
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTeachersCount, setTotalTeachersCount] = useState(0);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [allSubjects, setAllSubjects] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState('asc');

  const locale = isArabic ? ar : enUS;

  // ===== COMPLETE CLASSES LIST =====
  const completeClassesList = [
    { id: 'kindergarten_intro', name: isArabic ? 'تمهيدي' : 'Introductory', level: 'kindergarten' },
    { id: 'kindergarten_prep1a', name: isArabic ? 'تحضيري 1 -أ-' : 'Preparatory 1 -A-', level: 'kindergarten' },
    { id: 'kindergarten_prep1b', name: isArabic ? 'تحضيري 1 -ب-' : 'Preparatory 1 -B-', level: 'kindergarten' },
    { id: 'kindergarten_prep2a', name: isArabic ? 'تحضيري 2 -أ-' : 'Preparatory 2 -A-', level: 'kindergarten' },
    { id: 'kindergarten_prep2b', name: isArabic ? 'تحضيري 2 -ب-' : 'Preparatory 2 -B-', level: 'kindergarten' },
    { id: 'primary_1a', name: isArabic ? '1 -أ-' : '1 -A-', level: 'primary' },
    { id: 'primary_1b', name: isArabic ? '1 -ب-' : '1 -B-', level: 'primary' },
    { id: 'primary_2a', name: isArabic ? '2 -أ-' : '2 -A-', level: 'primary' },
    { id: 'primary_2b', name: isArabic ? '2 -ب-' : '2 -B-', level: 'primary' },
    { id: 'primary_3a', name: isArabic ? '3 -أ-' : '3 -A-', level: 'primary' },
    { id: 'primary_3b', name: isArabic ? '3 -ب-' : '3 -B-', level: 'primary' },
    { id: 'primary_4a', name: isArabic ? '4 -أ-' : '4 -A-', level: 'primary' },
    { id: 'primary_4b', name: isArabic ? '4 -ب-' : '4 -B-', level: 'primary' },
    { id: 'primary_5a', name: isArabic ? '5 -أ-' : '5 -A-', level: 'primary' },
    { id: 'primary_5b', name: isArabic ? '5 -ب-' : '5 -B-', level: 'primary' },
    { id: 'primary_6a', name: isArabic ? '6 -أ-' : '6 -A-', level: 'primary' },
    { id: 'primary_6b', name: isArabic ? '6 -ب-' : '6 -B-', level: 'primary' },
    { id: 'secondary_1a', name: isArabic ? 'إعدادي 1 -أ-' : 'Secondary 1 -A-', level: 'secondary' },
    { id: 'secondary_1b', name: isArabic ? 'إعدادي 1 -ب-' : 'Secondary 1 -B-', level: 'secondary' },
    { id: 'secondary_2a', name: isArabic ? 'إعدادي 2 -أ-' : 'Secondary 2 -A-', level: 'secondary' },
    { id: 'secondary_2b', name: isArabic ? 'إعدادي 2 -ب-' : 'Secondary 2 -B-', level: 'secondary' },
    { id: 'secondary_3a', name: isArabic ? 'إعدادي 3 -أ-' : 'Secondary 3 -A-', level: 'secondary' },
    { id: 'secondary_3b', name: isArabic ? 'إعدادي 3 -ب-' : 'Secondary 3 -B-', level: 'secondary' },
    { id: 'highschool_common_core', name: isArabic ? 'جذع مشترك علوم' : 'Common Core Science', level: 'high_school' },
    { id: 'highschool_1st_bac_experimental', name: isArabic ? 'بكالوريا 1 علوم تجريبية' : '1st Baccalaureate Experimental Sciences', level: 'high_school' },
    { id: 'highschool_2nd_bac_physical', name: isArabic ? 'بكالوريا 2 علوم فيزيائية' : '2nd Baccalaureate Physical Sciences', level: 'high_school' }
  ];

  // ===== QUALIFICATIONS LIST =====
  const qualificationsList = [
    { value: 'baccalaureate', label: isArabic ? 'بكالوريا' : 'Baccalaureate' },
    { value: 'bsc', label: isArabic ? 'بكالوريوس علوم' : 'BSc' },
    { value: 'master', label: isArabic ? 'ماجستير' : 'Master' },
    { value: 'doctorate', label: isArabic ? 'دكتوراه' : 'Doctorate' }
  ];

  // ===== LEVEL CATEGORIES =====
  const levelCategories = [
    { value: 'kindergarten', label: isArabic ? 'أولي' : 'Kindergarten', icon: <FaChild />, color: '#f39c12', gradient: 'linear-gradient(135deg, #f39c12, #e67e22)' },
    { value: 'primary', label: isArabic ? 'ابتدائي' : 'Primary', icon: <FaSchool />, color: '#3498db', gradient: 'linear-gradient(135deg, #3498db, #2980b9)' },
    { value: 'secondary', label: isArabic ? 'إعدادي' : 'Secondary', icon: <FaGraduationCap />, color: '#2ecc71', gradient: 'linear-gradient(135deg, #2ecc71, #27ae60)' },
    { value: 'high_school', label: isArabic ? 'ثانوي' : 'High School', icon: <FaUniversity />, color: '#9b59b6', gradient: 'linear-gradient(135deg, #9b59b6, #8e44ad)' }
  ];

  // ===== GENDER OPTIONS =====
  const genderOptions = [
    { value: 'male', label: isArabic ? 'ذكر' : 'Male' },
    { value: 'female', label: isArabic ? 'أنثى' : 'Female' },
    { value: 'other', label: isArabic ? 'أخرى' : 'Other' }
  ];

  // ===== EMPLOYMENT TYPES =====
  const employmentTypes = [
    { value: 'full_time', label: isArabic ? 'دوام كامل' : 'Full Time' },
    { value: 'part_time', label: isArabic ? 'دوام جزئي' : 'Part Time' }
  ];

  // ===== SUBJECTS BY CATEGORY =====
  const getSubjectsByCategory = () => {
    const defaultSubjects = {
      kindergarten: [
        { value: 'islamic_education_k', label: isArabic ? 'تربية إسلامية' : 'Islamic Education' },
        { value: 'arabic_k', label: isArabic ? 'لغة عربية' : 'Arabic Language' },
        { value: 'mathematics_k', label: isArabic ? 'رياضيات' : 'Mathematics' },
        { value: 'science_k', label: isArabic ? 'علوم' : 'Science' },
        { value: 'art_k', label: isArabic ? 'فنون' : 'Art' }
      ],
      primary: [
        { value: 'islamic_education_p', label: isArabic ? 'تربية إسلامية' : 'Islamic Education' },
        { value: 'arabic_p', label: isArabic ? 'لغة عربية' : 'Arabic Language' },
        { value: 'mathematics_p', label: isArabic ? 'رياضيات' : 'Mathematics' },
        { value: 'science_p', label: isArabic ? 'علوم' : 'Science' },
        { value: 'english_p', label: isArabic ? 'لغة إنجليزية' : 'English Language' },
        { value: 'social_studies_p', label: isArabic ? 'دراسات اجتماعية' : 'Social Studies' },
        { value: 'art_p', label: isArabic ? 'فنون' : 'Art' }
      ],
      secondary: [
        { value: 'islamic_education_s', label: isArabic ? 'تربية إسلامية' : 'Islamic Education' },
        { value: 'arabic_s', label: isArabic ? 'لغة عربية' : 'Arabic Language' },
        { value: 'mathematics_s', label: isArabic ? 'رياضيات' : 'Mathematics' },
        { value: 'physics_s', label: isArabic ? 'فيزياء' : 'Physics' },
        { value: 'chemistry_s', label: isArabic ? 'كيمياء' : 'Chemistry' },
        { value: 'biology_s', label: isArabic ? 'أحياء' : 'Biology' },
        { value: 'english_s', label: isArabic ? 'لغة إنجليزية' : 'English Language' },
        { value: 'french_s', label: isArabic ? 'لغة فرنسية' : 'French Language' },
        { value: 'history_s', label: isArabic ? 'تاريخ' : 'History' },
        { value: 'geography_s', label: isArabic ? 'جغرافيا' : 'Geography' }
      ],
      high_school: [
        { value: 'islamic_education_h', label: isArabic ? 'تربية إسلامية' : 'Islamic Education' },
        { value: 'arabic_h', label: isArabic ? 'لغة عربية' : 'Arabic Language' },
        { value: 'mathematics_h', label: isArabic ? 'رياضيات' : 'Mathematics' },
        { value: 'physics_h', label: isArabic ? 'فيزياء' : 'Physics' },
        { value: 'chemistry_h', label: isArabic ? 'كيمياء' : 'Chemistry' },
        { value: 'biology_h', label: isArabic ? 'أحياء' : 'Biology' },
        { value: 'english_h', label: isArabic ? 'لغة إنجليزية' : 'English Language' },
        { value: 'french_h', label: isArabic ? 'لغة فرنسية' : 'French Language' },
        { value: 'philosophy_h', label: isArabic ? 'فلسفة' : 'Philosophy' },
        { value: 'history_h', label: isArabic ? 'تاريخ' : 'History' },
        { value: 'geography_h', label: isArabic ? 'جغرافيا' : 'Geography' }
      ]
    };
    return defaultSubjects;
  };

  // ===== HELPER FUNCTIONS =====
  const getSubjectDisplay = (subjectValue) => {
    if (!subjectValue) return 'N/A';
    const subjectsData = getSubjectsByCategory();
    for (const category of Object.values(subjectsData)) {
      const found = category.find(s => s.value === subjectValue);
      if (found) return found.label;
    }
    return subjectValue;
  };

  const getClassName = (classId) => {
    if (!classId) return 'N/A';
    const found = dbClassCatalog.find(c => c.id === classId) ||
      completeClassesList.find(c => c.id === classId);
    return found ? found.name : classId;
  };

  const getQualificationDisplay = (qual) => {
    const found = qualificationsList.find(q => q.value === qual);
    return found ? found.label : qual;
  };

  const getLevelLabel = (level) => {
    const found = levelCategories.find(l => l.value === level);
    return found ? found.label : level;
  };

  const getLevelColor = (level) => {
    const found = levelCategories.find(l => l.value === level);
    return found ? found.color : '#6c757d';
  };

  const getTeacherName = (teacher) => {
    if (teacher.firstName && teacher.lastName) {
      return `${teacher.firstName} ${teacher.lastName}`.trim();
    }
    if (teacher.name) {
      return teacher.name;
    }
    return 'N/A';
  };

  const getTeacherSubject = (teacher) => {
    if (teacher.subject && typeof teacher.subject === 'string' && teacher.subject) {
      return getSubjectDisplay(teacher.subject);
    }
    if (teacher.subjects && Array.isArray(teacher.subjects) && teacher.subjects.length > 0) {
      return teacher.subjects.map(s => getSubjectDisplay(s));
    }
    return 'N/A';
  };

  const getTeacherClasses = (teacher) => {
    if (teacher.assignedClasses && Array.isArray(teacher.assignedClasses) && teacher.assignedClasses.length > 0) {
      return teacher.assignedClasses.map(id => getClassName(id));
    }
    if (teacher.classes && Array.isArray(teacher.classes) && teacher.classes.length > 0) {
      return teacher.classes;
    }
    if (teacher.assigned_classes && Array.isArray(teacher.assigned_classes) && teacher.assigned_classes.length > 0) {
      return teacher.assigned_classes.map(id => getClassName(id));
    }
    return [];
  };

  const getTeacherQualifications = (teacher) => {
    if (teacher.qualifications && Array.isArray(teacher.qualifications) && teacher.qualifications.length > 0) {
      return teacher.qualifications.map(q => getQualificationDisplay(q));
    }
    if (teacher.qualification && typeof teacher.qualification === 'string' && teacher.qualification) {
      if (teacher.qualification.includes(',')) {
        return teacher.qualification.split(',').map(q => q.trim());
      }
      return [teacher.qualification];
    }
    return [];
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

  // ===== MySQL class catalog (same fields/shape as completeClassesList) =====
  const [dbClassCatalog, setDbClassCatalog] = useState([]);
  useEffect(() => {
    fetchServerClasses().then((rows) => {
      if (rows) setDbClassCatalog(toCatalogClasses(rows, completeClassesList));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Arabic font style
  const arabicFontStyle = {
    fontFamily: isArabic ? '"Hacen Tunisia", "Hacen Tunisia Bd", "Noto Sans Arabic", "Vazirmatn", "Traditional Arabic", "Arabic Typesetting", serif' : 'inherit',
    lineHeight: isArabic ? '1.8' : '1.6',
    letterSpacing: isArabic ? '0.5px' : '0px',
    fontSize: isArabic ? 'clamp(0.85rem, 1.1vw, 1.05rem)' : 'clamp(0.8rem, 1vw, 1rem)',
  };

  // ===== HANDLE SORT =====
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // ===== GET SORT ICON =====
  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort className="ms-1" />;
    return sortDirection === 'asc' ? <FaSortUp className="ms-1" /> : <FaSortDown className="ms-1" />;
  };

  // ===== FETCH TEACHERS - FIXED =====
  const fetchTeachers = () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📚 Fetching teachers...');
      
      // 1. Try to get teachers from school_teachers first
      let teachersData = JSON.parse(localStorage.getItem('school_teachers') || '[]');
      console.log('📚 Teachers from school_teachers:', teachersData.length);
      
      // 2. If no teachers in school_teachers, try school_users
      if (teachersData.length === 0) {
        const allUsers = JSON.parse(localStorage.getItem('school_users') || '[]');
        teachersData = allUsers.filter(u => u.role === 'teacher');
        console.log('📚 Teachers from school_users:', teachersData.length);
      }
      
      // 3. If still no teachers, try userDataService
      if (teachersData.length === 0) {
        try {
          const allUsers = userDataService.getUsers();
          teachersData = allUsers.filter(u => u.role === 'teacher');
          console.log('📚 Teachers from userDataService:', teachersData.length);
        } catch (e) {
          console.warn('Could not get teachers from userDataService:', e);
        }
      }

      // Map teachers with display data
      const mappedTeachers = teachersData.map(teacher => {
        // Ensure teacher has all required fields
        const firstName = teacher.firstName || '';
        const lastName = teacher.lastName || '';
        const name = teacher.name || `${firstName} ${lastName}`.trim() || 'Unknown Teacher';
        
        return {
          ...teacher,
          id: teacher.id || `TCH${String(Date.now()).slice(-6)}`,
          firstName: firstName,
          lastName: lastName,
          name: name,
          displayName: getTeacherName(teacher) || name,
          displaySubject: getTeacherSubject(teacher),
          displayClasses: getTeacherClasses(teacher),
          displayQualifications: getTeacherQualifications(teacher),
          displayLevel: teacher.level ? getLevelLabel(teacher.level) : 'N/A',
          displayLevelColor: teacher.level ? getLevelColor(teacher.level) : '#6c757d',
          displaySpecialization: teacher.specialization || 'N/A',
          displayExperience: teacher.experienceYears || teacher.experience || 0,
          displayEmploymentType: teacher.employmentType ? 
            employmentTypes.find(e => e.value === teacher.employmentType)?.label || teacher.employmentType : 'N/A',
          displayPreviousSchool: teacher.previousSchool || 'N/A',
          displayGender: teacher.gender ? 
            genderOptions.find(g => g.value === teacher.gender)?.label || teacher.gender : 'N/A',
          displayCity: teacher.city || 'N/A',
          displayDateOfBirth: teacher.dateOfBirth || null,
          displayNationality: teacher.nationality || 'N/A',
          displayCin: teacher.cin || 'N/A',
          displayEmergencyContact: teacher.emergencyContactName || 'N/A',
          displayEmergencyRelationship: teacher.emergencyContactRelationship || 'N/A',
          displayEmergencyPhone: teacher.emergencyContactPhone || 'N/A',
          status: teacher.status || 'active',
          email: teacher.email || '',
          phone: teacher.phone || '',
          created_at: teacher.created_at || teacher.createdAt || new Date().toISOString(),
          last_login: teacher.last_login || null,
        };
      });
      
      // Apply filters
      let filtered = mappedTeachers;
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter(t =>
          t.displayName.toLowerCase().includes(searchLower) ||
          (t.id && t.id.toLowerCase().includes(searchLower)) ||
          (t.phone && t.phone.includes(searchTerm)) ||
          (t.email && t.email.toLowerCase().includes(searchLower)) ||
          (t.department && t.department.toLowerCase().includes(searchLower)) ||
          (typeof t.displaySubject === 'string' && t.displaySubject.toLowerCase().includes(searchLower)) ||
          t.displayClasses.some(c => c.toLowerCase().includes(searchLower)) ||
          t.displaySpecialization.toLowerCase().includes(searchLower)
        );
      }
      if (filterStatus !== 'all') {
        filtered = filtered.filter(t => t.status === filterStatus);
      }
      if (filterSubject !== 'all') {
        filtered = filtered.filter(t => {
          const subject = typeof t.displaySubject === 'string' ? t.displaySubject : '';
          return subject === filterSubject;
        });
      }
      
      // Sort
      filtered.sort((a, b) => {
        let aVal, bVal;
        switch (sortField) {
          case 'id':
            aVal = a.id || '';
            bVal = b.id || '';
            break;
          case 'name':
            aVal = a.displayName || '';
            bVal = b.displayName || '';
            break;
          case 'subject':
            aVal = typeof a.displaySubject === 'string' ? a.displaySubject : '';
            bVal = typeof b.displaySubject === 'string' ? b.displaySubject : '';
            break;
          case 'status':
            aVal = a.status || '';
            bVal = b.status || '';
            break;
          case 'experience':
            aVal = a.displayExperience || 0;
            bVal = b.displayExperience || 0;
            break;
          default:
            aVal = a.id || '';
            bVal = b.id || '';
        }
        
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
        
        if (sortDirection === 'asc') {
          return aVal.localeCompare(bVal);
        } else {
          return bVal.localeCompare(aVal);
        }
      });
      
      const subjects = [...new Set(mappedTeachers.map(t => 
        typeof t.displaySubject === 'string' ? t.displaySubject : 'N/A'
      ).filter(s => s !== 'N/A'))];
      setAllSubjects(subjects);
      
      const classes = [...new Set(mappedTeachers.flatMap(t => t.displayClasses || []))];
      setAllClasses(classes);
      
      setTeachers(filtered);
      setTotalTeachersCount(filtered.length);
      setTotalPages(Math.ceil(filtered.length / 10));
      
      console.log('✅ Teachers loaded:', filtered.length);
    } catch (error) {
      console.error('❌ Error fetching teachers:', error);
      setError(isArabic ? 'فشل في تحميل بيانات المعلمين' : 'Failed to load teachers data');
      setTeachers([]);
      setTotalTeachersCount(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // ===== LISTEN FOR USER DATA CHANGES =====
  useEffect(() => {
    fetchTeachers();
    
    // Listen for user data changes
    const handleUsersUpdated = () => {
      console.log('🔄 Users updated, refreshing teachers...');
      fetchTeachers();
    };
    
    window.addEventListener('usersUpdated', handleUsersUpdated);
    window.addEventListener('storage', (e) => {
      if (e.key === 'school_users' || e.key === 'school_teachers') {
        console.log('🔄 Storage changed, refreshing teachers...');
        fetchTeachers();
      }
    });
    
    // Try to subscribe to userDataService
    try {
      const unsubscribe = userDataService.addListener(() => {
        console.log('🔄 userDataService changed, refreshing teachers...');
        fetchTeachers();
      });
      return () => {
        if (unsubscribe) unsubscribe();
        window.removeEventListener('usersUpdated', handleUsersUpdated);
      };
    } catch (e) {
      console.warn('Could not subscribe to userDataService:', e);
      return () => {
        window.removeEventListener('usersUpdated', handleUsersUpdated);
      };
    }
  }, []);

  // ===== SEARCH EFFECT =====
  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchTeachers();
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm, sortField, sortDirection]);

  // ===== PAGE CHANGE EFFECT =====
  useEffect(() => {
    fetchTeachers();
  }, [currentPage, filterStatus, filterSubject]);

  // ===== FORMAT TIME - SAFE =====
  const formatTime = (date) => {
    if (!date) return isArabic ? 'لم يسجل الدخول بعد' : 'Not logged in yet';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (!isValid(dateObj)) {
        return isArabic ? 'لم يسجل الدخول بعد' : 'Not logged in yet';
      }
      return formatDistanceToNow(dateObj, { addSuffix: true, locale });
    } catch {
      return isArabic ? 'منذ قليل' : 'Just now';
    }
  };

  // ===== GET STATUS BADGE =====
  const getStatusBadge = (status) => {
    const variants = {
      active: { variant: 'success', label: isArabic ? 'نشط' : 'Active' },
      inactive: { variant: 'secondary', label: isArabic ? 'غير نشط' : 'Inactive' },
      pending: { variant: 'warning', label: isArabic ? 'قيد الانتظار' : 'Pending' },
      suspended: { variant: 'danger', label: isArabic ? 'موقوف' : 'Suspended' }
    };
    return variants[status] || variants.inactive;
  };

  // ===== STATUS OPTIONS =====
  const statusOptions = [
    { value: 'all', label: isArabic ? 'الكل' : 'All' },
    { value: 'active', label: isArabic ? 'نشط' : 'Active' },
    { value: 'inactive', label: isArabic ? 'غير نشط' : 'Inactive' },
    { value: 'pending', label: isArabic ? 'قيد الانتظار' : 'Pending' },
    { value: 'suspended', label: isArabic ? 'موقوف' : 'Suspended' }
  ];

  // ===== GET DISPLAY TEACHERS =====
  const getDisplayTeachers = () => {
    const start = (currentPage - 1) * 10;
    const end = start + 10;
    return teachers.slice(start, end);
  };

  const displayTeachers = getDisplayTeachers();

  // ===== HANDLE VIEW TEACHER =====
  const handleViewTeacher = (teacher) => {
    setSelectedTeacher(teacher);
    setShowViewModal(true);
  };

  // ===== HANDLE REFRESH =====
  const handleRefresh = () => {
    fetchTeachers();
    notify(isArabic ? 'تم تحديث البيانات' : 'Data refreshed', 'info');
  };

  // ===== HANDLE EXPORT =====
  const handleExport = () => {
    try {
      const headers = ['ID', 'Name', 'Email', 'Phone', 'City', 'Subject', 'Level', 'Classes', 'Qualifications', 'Experience', 'Status'];
      const rows = teachers.map(t => [
        t.id || 'N/A',
        t.displayName,
        t.email || 'N/A',
        t.phone || 'N/A',
        t.displayCity || 'N/A',
        typeof t.displaySubject === 'string' ? t.displaySubject : (t.displaySubject || []).join('; '),
        t.displayLevel || 'N/A',
        (t.displayClasses || []).join('; '),
        (t.displayQualifications || []).join('; '),
        t.displayExperience || 0,
        t.status || 'N/A'
      ]);
      
      const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `teachers_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      notify(isArabic ? 'تم تصدير البيانات بنجاح' : 'Data exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting data:', error);
      notify(isArabic ? '❌ حدث خطأ أثناء التصدير' : '❌ Error exporting data', 'error');
    }
  };

  // ===== STATS =====
  const totalTeachers = teachers.length;
  const activeTeachers = teachers.filter(t => t.status === 'active').length;
  const pendingTeachers = teachers.filter(t => t.status === 'pending').length;
  const inactiveTeachers = teachers.filter(t => t.status === 'inactive' || t.status === 'suspended').length;
  const avgExperience = teachers.length > 0 
    ? Math.round(teachers.reduce((sum, t) => sum + (t.displayExperience || 0), 0) / teachers.length) 
    : 0;

  // ===== STATS CARDS CONFIGURATION =====
  const statsCards = [
    {
      key: 'total',
      icon: <FaChalkboardTeacher size={28} />,
      color: '#4a9eff',
      gradient: 'linear-gradient(135deg, #4a9eff, #2a7f9a)',
      value: formatNumber(totalTeachers),
      label: isArabic ? 'إجمالي المعلمين' : 'Total Teachers'
    },
    {
      key: 'active',
      icon: <FaCheckCircle size={28} />,
      color: '#2ecc71',
      gradient: 'linear-gradient(135deg, #2ecc71, #27ae60)',
      value: formatNumber(activeTeachers),
      label: isArabic ? 'نشط' : 'Active'
    },
    {
      key: 'pending',
      icon: <FaClock size={28} />,
      color: '#f39c12',
      gradient: 'linear-gradient(135deg, #f39c12, #e67e22)',
      value: formatNumber(pendingTeachers),
      label: isArabic ? 'قيد الانتظار' : 'Pending'
    },
    {
      key: 'experience',
      icon: <FaStar size={28} />,
      color: '#9b59b6',
      gradient: 'linear-gradient(135deg, #9b59b6, #8e44ad)',
      value: formatNumber(avgExperience),
      label: isArabic ? 'متوسط الخبرة (سنوات)' : 'Avg Experience (yrs)'
    }
  ];

  // ===== RENDER =====
  return (
    <div className="teachers-management" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Page Header */}
      <div className="page-header d-flex justify-content-between align-items-center flex-wrap gap-2 gap-md-3 mb-3 mb-md-4">
        <div>
          <h4 className="fw-bold mb-0" style={{ ...arabicFontStyle, color: '#2d6a4f', fontSize: 'clamp(1rem, 1.8vw, 1.5rem)' }}>
            <FaChalkboardTeacher className="me-2" /> 
            {isArabic ? 'المعلمون' : 'Teachers'}
          </h4>
          <p className="text-muted mb-0" style={{ ...arabicFontStyle, fontSize: 'clamp(0.7rem, 0.9vw, 0.85rem)' }}>
            {isArabic 
              ? `عرض جميع المعلمين المسجلين في النظام (${formatNumber(totalTeachers)})`
              : `View all teachers registered in the system (${formatNumber(totalTeachers)})`}
          </p>
        </div>
        <div className="d-flex gap-1 gap-sm-2 flex-wrap">
          <Button 
            variant="outline-primary" 
            size="sm" 
            onClick={handleRefresh}
            disabled={loading}
            className="action-btn-responsive"
            style={{ ...arabicFontStyle, borderRadius: '12px', fontSize: 'clamp(0.6rem, 0.8vw, 0.8rem)' }}
          >
            <FaSync className={loading ? 'spinning' : ''} /> <span className="d-none d-sm-inline">{isArabic ? 'تحديث' : 'Refresh'}</span>
          </Button>
          <Button 
            variant="outline-secondary" 
            size="sm" 
            onClick={handleExport}
            className="action-btn-responsive"
            style={{ ...arabicFontStyle, borderRadius: '12px', fontSize: 'clamp(0.6rem, 0.8vw, 0.8rem)' }}
          >
            <FaDownload className="me-1" /> <span className="d-none d-sm-inline">{isArabic ? 'تصدير' : 'Export'}</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <Row className="g-2 g-md-3 g-lg-4 mb-3 mb-md-4">
        {statsCards.map((stat) => (
          <Col key={stat.key} xs={6} sm={6} md={3} className="px-1 px-sm-2">
            <Card 
              className="stats-card-enhanced h-100 text-center" 
              style={{ 
                background: darkMode ? '#1a1a2e' : '#ffffff', 
                borderColor: darkMode ? '#2d2d44' : '#e9ecef',
                border: 'none',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = darkMode ? '0 8px 30px rgba(0,0,0,0.4)' : '0 8px 30px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)';
              }}
            >
              <div 
                className="stats-card-topbar" 
                style={{
                  height: '4px',
                  background: stat.gradient,
                  borderRadius: '16px 16px 0 0'
                }}
              />
              <Card.Body className="p-2 p-sm-3 p-md-4">
                <div 
                  className="stats-icon-wrapper mb-1 mb-sm-2"
                  style={{
                    display: 'inline-flex',
                    padding: 'clamp(6px, 1vw, 12px)',
                    borderRadius: '12px',
                    background: `${stat.color}15`,
                    color: stat.color
                  }}
                >
                  <span style={{ fontSize: 'clamp(1.2rem, 2vw, 1.8rem)' }}>
                    {stat.icon}
                  </span>
                </div>
                <h2 
                  className="fw-bold mb-0" 
                  style={{ 
                    ...arabicFontStyle, 
                    fontSize: 'clamp(1rem, 1.8vw, 1.6rem)',
                    color: darkMode ? '#e9ecef' : '#212529'
                  }}
                >
                  {stat.value}
                </h2>
                <p 
                  className="text-muted mb-0" 
                  style={{ 
                    ...arabicFontStyle, 
                    fontSize: 'clamp(0.5rem, 0.7vw, 0.7rem)',
                    opacity: 0.8
                  }}
                >
                  {stat.label}
                </p>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Filters */}
      <Card className="modern-card mb-3 mb-md-4" style={{ background: darkMode ? '#1a1a2e' : '#ffffff', borderColor: darkMode ? '#2d2d44' : '#e9ecef' }}>
        <Card.Body className="p-2 p-md-3">
          <Row className="g-1 g-md-2 align-items-center">
            <Col xs={12} sm={6} md={4} lg={4} className="px-1 px-sm-2">
              <InputGroup size="sm">
                <InputGroup.Text style={{ background: 'transparent', borderColor: darkMode ? '#2d2d44' : '#ced4da' }}>
                  <FaSearch size={12} />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder={isArabic ? 'بحث بالاسم أو المعرف أو البريد أو الهاتف...' : 'Search by name, ID, email, phone...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-control-sm"
                  style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.6rem, 0.8vw, 0.8rem)' }}
                />
                {searchTerm && (
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setSearchTerm('')}
                    style={{ borderRadius: '0 12px 12px 0' }}
                  >
                    <FaTimesIcon size={12} />
                  </Button>
                )}
              </InputGroup>
            </Col>
            <Col xs={6} sm={3} md={3} lg={3} className="px-1 px-sm-2">
              <Form.Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="form-select-sm"
                style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.55rem, 0.7vw, 0.75rem)' }}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={6} sm={3} md={3} lg={3} className="px-1 px-sm-2">
              <Form.Select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="form-select-sm"
                style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.55rem, 0.7vw, 0.75rem)' }}
              >
                <option value="all">{isArabic ? 'جميع المواد' : 'All Subjects'}</option>
                {allSubjects.map((subject) => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={6} sm={6} md={2} lg={2} className="px-1 px-sm-2">
              <Button 
                variant="outline-primary" 
                size="sm" 
                className="w-100"
                style={{ ...arabicFontStyle, borderRadius: '12px', fontSize: 'clamp(0.6rem, 0.8vw, 0.8rem)' }}
                onClick={fetchTeachers}
              >
                <FaSearch className="me-1" /> <span className="d-none d-sm-inline">{isArabic ? 'بحث' : 'Search'}</span>
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Teachers Table */}
      <Card className="modern-card" style={{ background: darkMode ? '#1a1a2e' : '#ffffff', borderColor: darkMode ? '#2d2d44' : '#e9ecef' }}>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <FaSpinner className="spinning" size={40} style={{ color: '#3498db' }} />
              <p className="mt-2 text-muted" style={arabicFontStyle}>{isArabic ? 'جاري التحميل...' : 'Loading...'}</p>
            </div>
          ) : error ? (
            <Alert variant="danger" className="m-3">{error}</Alert>
          ) : teachers.length === 0 ? (
            <div className="text-center py-5">
              <FaChalkboardTeacher size={50} className="text-muted mb-3" />
              <p style={arabicFontStyle}>{isArabic ? 'لا يوجد معلمين مطابقين للبحث' : 'No matching teachers found'}</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0" style={{ ...arabicFontStyle }}>
                <thead style={{ background: darkMode ? '#0d1117' : '#f8f9fa' }}>
                  <tr>
                    <th 
                      onClick={() => handleSort('id')}
                      style={{ cursor: 'pointer', color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.6rem, 0.8vw, 0.85rem)' }}
                    >
                      <span className="d-none d-md-inline">{isArabic ? 'المعرف' : 'ID'}</span>
                      <span className="d-md-none">#</span>
                      {getSortIcon('id')}
                    </th>
                    <th 
                      onClick={() => handleSort('name')}
                      style={{ cursor: 'pointer', color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.6rem, 0.8vw, 0.85rem)' }}
                    >
                      {isArabic ? 'المعلم' : 'Teacher'} {getSortIcon('name')}
                    </th>
                    <th className="d-none d-lg-table-cell" style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.6rem, 0.8vw, 0.85rem)' }}>
                      {isArabic ? 'معلومات الاتصال' : 'Contact'}
                    </th>
                    <th className="d-none d-xl-table-cell" style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.6rem, 0.8vw, 0.85rem)' }}>
                      {isArabic ? 'المؤهلات' : 'Qualifications'}
                    </th>
                    <th 
                      onClick={() => handleSort('subject')}
                      style={{ cursor: 'pointer', color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.6rem, 0.8vw, 0.85rem)' }}
                      className="d-none d-md-table-cell"
                    >
                      {isArabic ? 'المادة' : 'Subject'} {getSortIcon('subject')}
                    </th>
                    <th className="d-none d-lg-table-cell" style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.6rem, 0.8vw, 0.85rem)' }}>
                      {isArabic ? 'المستوى' : 'Level'}
                    </th>
                    <th className="d-none d-xl-table-cell" style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.6rem, 0.8vw, 0.85rem)' }}>
                      {isArabic ? 'الفصول' : 'Classes'}
                    </th>
                    <th 
                      onClick={() => handleSort('experience')}
                      style={{ cursor: 'pointer', color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.6rem, 0.8vw, 0.85rem)' }}
                      className="d-none d-sm-table-cell"
                    >
                      {isArabic ? 'الخبرة' : 'Experience'} {getSortIcon('experience')}
                    </th>
                    <th 
                      onClick={() => handleSort('status')}
                      style={{ cursor: 'pointer', color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.6rem, 0.8vw, 0.85rem)' }}
                      className="d-none d-sm-table-cell"
                    >
                      {isArabic ? 'الحالة' : 'Status'} {getSortIcon('status')}
                    </th>
                    <th className="text-center" style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.6rem, 0.8vw, 0.85rem)' }}>
                      {isArabic ? 'عرض' : 'View'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayTeachers.map((teacher, index) => {
                    const statusBadge = getStatusBadge(teacher.status);
                    const qualifications = teacher.displayQualifications || [];
                    const subject = teacher.displaySubject || 'N/A';
                    const classes = teacher.displayClasses || [];
                    const level = teacher.displayLevel || 'N/A';
                    const experience = teacher.displayExperience || 0;
                    
                    return (
                      <tr key={teacher.id}>
                        <td style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.55rem, 0.7vw, 0.8rem)' }}>
                          {formatNumber((currentPage - 1) * 10 + index + 1)}
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-1 gap-md-2">
                            <div 
                              className="teacher-avatar-sm"
                              style={{
                                background: `linear-gradient(135deg, #2d6a4f, #40916c)`,
                                width: 'clamp(28px, 3vw, 36px)',
                                height: 'clamp(28px, 3vw, 36px)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: '700',
                                fontSize: 'clamp(0.6rem, 0.7vw, 0.85rem)',
                                flexShrink: 0
                              }}
                            >
                              {teacher.displayName.charAt(0).toUpperCase()}
                            </div>
                            <div className="teacher-info" style={{ minWidth: 0 }}>
                              <div className="fw-semibold text-truncate" style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.6rem, 0.8vw, 0.85rem)' }}>
                                {teacher.displayName}
                              </div>
                              <small className="text-muted d-none d-md-block" style={{ ...arabicFontStyle, fontSize: 'clamp(0.45rem, 0.55vw, 0.65rem)' }}>
                                <FaIdCard className="me-1" size={10} /> {isArabic ? 'رقم' : 'ID'}: {teacher.id}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td className="d-none d-lg-table-cell">
                          <div style={{ fontSize: 'clamp(0.5rem, 0.6vw, 0.7rem)', color: darkMode ? '#adb5bd' : '#6c757d' }}>
                            <div className="text-truncate" style={{ maxWidth: '120px' }}><FaEnvelope className="me-1 text-muted" size={10} /> {teacher.email}</div>
                            {teacher.phone && (
                              <div className="text-truncate" style={{ maxWidth: '120px' }}><FaPhone className="me-1 text-muted" size={10} /> {teacher.phone}</div>
                            )}
                          </div>
                        </td>
                        <td className="d-none d-xl-table-cell">
                          <div className="d-flex flex-wrap gap-1">
                            {qualifications.length > 0 ? (
                              qualifications.slice(0, 2).map((qual, idx) => (
                                <Badge key={idx} bg="secondary" style={{ fontSize: 'clamp(0.4rem, 0.5vw, 0.55rem)', padding: '2px 6px', borderRadius: '6px' }}>
                                  {qual}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted" style={{ fontSize: 'clamp(0.5rem, 0.6vw, 0.65rem)' }}>N/A</span>
                            )}
                            {qualifications.length > 2 && (
                              <Badge bg="secondary" style={{ fontSize: 'clamp(0.4rem, 0.5vw, 0.55rem)', padding: '2px 6px', borderRadius: '6px' }}>
                                +{formatNumber(qualifications.length - 2)}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="d-none d-md-table-cell">
                          {subject !== 'N/A' ? (
                            <Badge bg="secondary" style={{ fontSize: 'clamp(0.45rem, 0.55vw, 0.6rem)', padding: '3px 8px', borderRadius: '6px' }}>
                              {typeof subject === 'string' ? subject : subject.join(', ')}
                            </Badge>
                          ) : (
                            <span className="text-muted" style={{ fontSize: 'clamp(0.5rem, 0.6vw, 0.65rem)' }}>N/A</span>
                          )}
                        </td>
                        <td className="d-none d-lg-table-cell">
                          {level !== 'N/A' ? (
                            <Badge style={{ 
                              fontSize: 'clamp(0.4rem, 0.5vw, 0.55rem)', 
                              padding: '2px 6px', 
                              borderRadius: '6px',
                              background: teacher.displayLevelColor || '#6c757d',
                              color: 'white'
                            }}>
                              {level}
                            </Badge>
                          ) : (
                            <span className="text-muted" style={{ fontSize: 'clamp(0.5rem, 0.6vw, 0.65rem)' }}>N/A</span>
                          )}
                        </td>
                        <td className="d-none d-xl-table-cell">
                          <div className="d-flex flex-wrap gap-1">
                            {classes.length > 0 ? (
                              classes.slice(0, 2).map((cls, idx) => (
                                <Badge key={idx} bg="secondary" style={{ fontSize: 'clamp(0.4rem, 0.5vw, 0.55rem)', padding: '2px 6px', borderRadius: '6px' }}>
                                  {cls}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted" style={{ fontSize: 'clamp(0.5rem, 0.6vw, 0.65rem)' }}>N/A</span>
                            )}
                            {classes.length > 2 && (
                              <Badge bg="secondary" style={{ fontSize: 'clamp(0.4rem, 0.5vw, 0.55rem)', padding: '2px 6px', borderRadius: '6px' }}>
                                +{formatNumber(classes.length - 2)}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="d-none d-sm-table-cell">
                          <span className="fw-semibold" style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.55rem, 0.7vw, 0.8rem)' }}>
                            {formatNumber(experience)} {isArabic ? 'سنوات' : 'yrs'}
                          </span>
                        </td>
                        <td className="d-none d-sm-table-cell">
                          <Badge bg={statusBadge.variant} className="px-2 py-1" style={{ fontSize: 'clamp(0.45rem, 0.55vw, 0.65rem)', borderRadius: '6px' }}>
                            {statusBadge.label}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex gap-1 justify-content-center">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="action-btn"
                              onClick={() => handleViewTeacher(teacher)}
                              title={isArabic ? 'عرض التفاصيل' : 'View Details'}
                              style={{ borderRadius: '6px' }}
                            >
                              <FaEye size={14} />
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
        </Card.Body>
        {!loading && !error && teachers.length > 0 && (
          <Card.Footer className="d-flex justify-content-between align-items-center py-2 flex-wrap gap-2">
            <div className="text-muted small" style={{ ...arabicFontStyle, fontSize: 'clamp(0.55rem, 0.7vw, 0.75rem)' }}>
              {isArabic ? `عرض ${displayTeachers.length} من ${teachers.length}` : `Showing ${displayTeachers.length} of ${teachers.length}`}
            </div>
            <Pagination size="sm" className="mb-0 responsive-pagination">
              <Pagination.Prev onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} />
              {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                const page = i + 1;
                return (
                  <Pagination.Item key={page} active={page === currentPage} onClick={() => setCurrentPage(page)}>
                    {page}
                  </Pagination.Item>
                );
              })}
              {totalPages > 5 && <Pagination.Ellipsis />}
              <Pagination.Next onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} />
            </Pagination>
          </Card.Footer>
        )}
      </Card>

      {/* ===== VIEW TEACHER MODAL ===== */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} centered size="lg" className="modern-modal">
        <Modal.Header closeButton style={{ borderBottom: darkMode ? '1px solid #2d2d44' : '1px solid #e9ecef' }}>
          <Modal.Title style={arabicFontStyle}>
            <FaUserTie className="me-2 text-primary" />
            {isArabic ? 'تفاصيل المعلم' : 'Teacher Details'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? '#1a1a2e' : '#ffffff', maxHeight: '70vh', overflowY: 'auto' }}>
          {selectedTeacher && (
            <div style={arabicFontStyle}>
              <div className="text-center mb-3">
                <div 
                  className="teacher-avatar-lg mx-auto"
                  style={{
                    background: 'linear-gradient(135deg, #2d6a4f, #40916c)',
                    width: 'clamp(80px, 12vw, 120px)',
                    height: 'clamp(80px, 12vw, 120px)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: 'clamp(2rem, 4vw, 3rem)',
                    margin: '0 auto',
                    boxShadow: '0 8px 30px rgba(45, 106, 79, 0.3)'
                  }}
                >
                  {selectedTeacher.displayName.charAt(0).toUpperCase()}
                </div>
                <h5 className="fw-bold mt-3" style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(1rem, 1.5vw, 1.25rem)' }}>
                  {selectedTeacher.displayName}
                </h5>
                <Badge bg="primary" className="mt-1" style={{ borderRadius: '8px', fontSize: 'clamp(0.6rem, 0.8vw, 0.8rem)' }}>
                  {isArabic ? 'معلم' : 'Teacher'}
                </Badge>
                {selectedTeacher.department && (
                  <div className="text-muted mt-1" style={{ ...arabicFontStyle, fontSize: 'clamp(0.7rem, 0.9vw, 0.9rem)' }}>
                    <FaSchool className="me-1" size={12} /> {selectedTeacher.department}
                  </div>
                )}
                <div className="mt-2">
                  <Badge bg={getStatusBadge(selectedTeacher.status).variant} className="px-3 py-2" style={{ borderRadius: '8px', fontSize: 'clamp(0.6rem, 0.8vw, 0.8rem)' }}>
                    {getStatusBadge(selectedTeacher.status).label}
                  </Badge>
                </div>
                <div className="mt-2">
                  <small className="text-muted" style={{ ...arabicFontStyle, fontSize: 'clamp(0.6rem, 0.8vw, 0.8rem)' }}>
                    <FaIdCard className="me-1" /> {isArabic ? 'رقم الهوية' : 'ID'}: {selectedTeacher.id}
                  </small>
                </div>
              </div>

              <hr />

              <div className="teacher-details" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                {/* Personal Information */}
                <h6 className="fw-bold text-primary" style={{ fontSize: 'clamp(0.8rem, 1vw, 1rem)' }}>
                  <FaUserCircle className="me-2" /> {isArabic ? 'معلومات شخصية' : 'Personal Information'}
                </h6>
                
                <Row className="mb-2"><Col md={4}><strong className="text-muted">{isArabic ? 'الاسم الكامل' : 'Full Name'}</strong></Col><Col md={8}><span className="fw-semibold">{selectedTeacher.displayName}</span></Col></Row>
                <Row className="mb-2"><Col md={4}><strong className="text-muted"><FaEnvelope className="me-1" /> {isArabic ? 'البريد الإلكتروني' : 'Email'}</strong></Col><Col md={8}><span className="fw-semibold">{selectedTeacher.email}</span></Col></Row>
                {selectedTeacher.phone && (
                  <Row className="mb-2"><Col md={4}><strong className="text-muted"><FaPhone className="me-1" /> {isArabic ? 'رقم الهاتف' : 'Phone'}</strong></Col><Col md={8}><span className="fw-semibold">{selectedTeacher.phone}</span></Col></Row>
                )}
                {selectedTeacher.address && (
                  <Row className="mb-2"><Col md={4}><strong className="text-muted"><FaMapMarkerAlt className="me-1" /> {isArabic ? 'العنوان' : 'Address'}</strong></Col><Col md={8}><span className="fw-semibold">{selectedTeacher.address}</span></Col></Row>
                )}
                {selectedTeacher.displayCity && selectedTeacher.displayCity !== 'N/A' && (
                  <Row className="mb-2"><Col md={4}><strong className="text-muted"><FaCity className="me-1" /> {isArabic ? 'المدينة' : 'City'}</strong></Col><Col md={8}><span className="fw-semibold">{selectedTeacher.displayCity}</span></Col></Row>
                )}
                {selectedTeacher.displayDateOfBirth && (
                  <Row className="mb-2"><Col md={4}><strong className="text-muted"><FaBirthdayCake className="me-1" /> {isArabic ? 'تاريخ الميلاد' : 'Date of Birth'}</strong></Col><Col md={8}><span className="fw-semibold">{safeFormatDate(selectedTeacher.displayDateOfBirth, 'PPP', { locale })}</span></Col></Row>
                )}
                {selectedTeacher.displayGender && selectedTeacher.displayGender !== 'N/A' && (
                  <Row className="mb-2"><Col md={4}><strong className="text-muted"><FaVenusMars className="me-1" /> {isArabic ? 'الجنس' : 'Gender'}</strong></Col><Col md={8}><span className="fw-semibold">{selectedTeacher.displayGender}</span></Col></Row>
                )}
                {selectedTeacher.displayNationality && selectedTeacher.displayNationality !== 'N/A' && (
                  <Row className="mb-2"><Col md={4}><strong className="text-muted"><FaGlobe className="me-1" /> {isArabic ? 'الجنسية' : 'Nationality'}</strong></Col><Col md={8}><span className="fw-semibold">{selectedTeacher.displayNationality}</span></Col></Row>
                )}
                {selectedTeacher.displayCin && selectedTeacher.displayCin !== 'N/A' && (
                  <Row className="mb-2"><Col md={4}><strong className="text-muted"><FaIdBadge className="me-1" /> {isArabic ? 'رقم الهوية' : 'CIN'}</strong></Col><Col md={8}><span className="fw-semibold">{selectedTeacher.displayCin}</span></Col></Row>
                )}
                
                <hr />

                {/* Professional Information */}
                <h6 className="fw-bold text-success" style={{ fontSize: 'clamp(0.8rem, 1vw, 1rem)' }}>
                  <FaBriefcase className="me-2" /> {isArabic ? 'معلومات مهنية' : 'Professional Information'}
                </h6>
                
                {selectedTeacher.department && (
                  <Row className="mb-2"><Col md={4}><strong className="text-muted"><FaSchool className="me-1" /> {isArabic ? 'القسم' : 'Department'}</strong></Col><Col md={8}><span className="fw-semibold">{selectedTeacher.department}</span></Col></Row>
                )}
                {selectedTeacher.displayLevel && selectedTeacher.displayLevel !== 'N/A' && (
                  <Row className="mb-2"><Col md={4}><strong className="text-muted"><FaGraduationCap className="me-1" /> {isArabic ? 'المستوى التعليمي' : 'Education Level'}</strong></Col><Col md={8}><span className="fw-semibold">{selectedTeacher.displayLevel}</span></Col></Row>
                )}
                {selectedTeacher.displayQualifications && selectedTeacher.displayQualifications.length > 0 && (
                  <Row className="mb-2"><Col md={4}><strong className="text-muted"><FaGraduationCap className="me-1" /> {isArabic ? 'المؤهلات' : 'Qualifications'}</strong></Col><Col md={8}><div className="d-flex flex-wrap gap-1">{selectedTeacher.displayQualifications.map((qual, idx) => (<Badge key={idx} bg="secondary" style={{ borderRadius: '6px' }}>{qual}</Badge>))}</div></Col></Row>
                )}
                {selectedTeacher.displaySubject && selectedTeacher.displaySubject !== 'N/A' && (
                  <Row className="mb-2"><Col md={4}><strong className="text-muted"><FaBook className="me-1" /> {isArabic ? 'المادة' : 'Subject'}</strong></Col><Col md={8}><Badge bg="secondary" style={{ borderRadius: '6px' }}>{selectedTeacher.displaySubject}</Badge></Col></Row>
                )}
                {selectedTeacher.displaySpecialization && selectedTeacher.displaySpecialization !== 'N/A' && (
                  <Row className="mb-2"><Col md={4}><strong className="text-muted"><FaBriefcase className="me-1" /> {isArabic ? 'التخصص' : 'Specialization'}</strong></Col><Col md={8}><span className="fw-semibold">{selectedTeacher.displaySpecialization}</span></Col></Row>
                )}
                {selectedTeacher.displayClasses && selectedTeacher.displayClasses.length > 0 && (
                  <Row className="mb-2"><Col md={4}><strong className="text-muted"><FaBuilding className="me-1" /> {isArabic ? 'الفصول' : 'Classes'}</strong></Col><Col md={8}><div className="d-flex flex-wrap gap-1">{selectedTeacher.displayClasses.map((cls, idx) => (<Badge key={idx} bg="secondary" style={{ borderRadius: '6px' }}>{cls}</Badge>))}</div></Col></Row>
                )}
                {selectedTeacher.displayExperience > 0 && (
                  <Row className="mb-2"><Col md={4}><strong className="text-muted"><FaClock className="me-1" /> {isArabic ? 'سنوات الخبرة' : 'Experience'}</strong></Col><Col md={8}><span className="fw-semibold">{formatNumber(selectedTeacher.displayExperience)} {isArabic ? 'سنوات' : 'years'}</span></Col></Row>
                )}
                {selectedTeacher.displayEmploymentType && selectedTeacher.displayEmploymentType !== 'N/A' && (
                  <Row className="mb-2"><Col md={4}><strong className="text-muted"><FaBriefcase className="me-1" /> {isArabic ? 'نوع التوظيف' : 'Employment Type'}</strong></Col><Col md={8}><span className="fw-semibold">{selectedTeacher.displayEmploymentType}</span></Col></Row>
                )}
                {selectedTeacher.displayPreviousSchool && selectedTeacher.displayPreviousSchool !== 'N/A' && (
                  <Row className="mb-2"><Col md={4}><strong className="text-muted"><FaSchool className="me-1" /> {isArabic ? 'المدرسة السابقة' : 'Previous School'}</strong></Col><Col md={8}><span className="fw-semibold">{selectedTeacher.displayPreviousSchool}</span></Col></Row>
                )}

                <hr />

                {/* Emergency Contact */}
                {selectedTeacher.displayEmergencyContact && selectedTeacher.displayEmergencyContact !== 'N/A' && (
                  <>
                    <h6 className="fw-bold text-danger" style={{ fontSize: 'clamp(0.8rem, 1vw, 1rem)' }}>
                      <FaPhoneAlt className="me-2" /> {isArabic ? 'جهة اتصال طارئة' : 'Emergency Contact'}
                    </h6>
                    <Row className="mb-2"><Col md={4}><strong className="text-muted"><FaUserCircle className="me-1" /> {isArabic ? 'الاسم' : 'Name'}</strong></Col><Col md={8}><span className="fw-semibold">{selectedTeacher.displayEmergencyContact}</span></Col></Row>
                    {selectedTeacher.displayEmergencyRelationship && selectedTeacher.displayEmergencyRelationship !== 'N/A' && (
                      <Row className="mb-2"><Col md={4}><strong className="text-muted"><FaHandshake className="me-1" /> {isArabic ? 'العلاقة' : 'Relationship'}</strong></Col><Col md={8}><span className="fw-semibold">{selectedTeacher.displayEmergencyRelationship}</span></Col></Row>
                    )}
                    {selectedTeacher.displayEmergencyPhone && selectedTeacher.displayEmergencyPhone !== 'N/A' && (
                      <Row className="mb-2"><Col md={4}><strong className="text-muted"><FaPhone className="me-1" /> {isArabic ? 'رقم الهاتف' : 'Phone'}</strong></Col><Col md={8}><span className="fw-semibold">{selectedTeacher.displayEmergencyPhone}</span></Col></Row>
                    )}
                    <hr />
                  </>
                )}

                {/* Registration Info */}
                <h6 className="fw-bold text-info" style={{ fontSize: 'clamp(0.8rem, 1vw, 1rem)' }}>
                  <FaCalendarAlt className="me-2" /> {isArabic ? 'معلومات التسجيل' : 'Registration Info'}
                </h6>
                <Row className="mb-2"><Col md={4}><strong className="text-muted"><FaCalendarAlt className="me-1" /> {isArabic ? 'تاريخ التسجيل' : 'Registered'}</strong></Col><Col md={8}><span className="fw-semibold">{safeFormatDate(selectedTeacher.created_at || selectedTeacher.createdAt, 'PPP', { locale })}</span></Col></Row>
                <Row className="mb-2"><Col md={4}><strong className="text-muted"><FaClock className="me-1" /> {isArabic ? 'آخر تسجيل دخول' : 'Last Login'}</strong></Col><Col md={8}><span className="fw-semibold">{formatTime(selectedTeacher.last_login)}</span></Col></Row>

                {selectedTeacher.bio && (
                  <div className="mt-3 p-3 rounded-3" style={{ background: darkMode ? '#2d2d44' : '#f8f9fa', borderRadius: '12px' }}>
                    <span className="text-muted d-block mb-1" style={{ ...arabicFontStyle, fontSize: 'clamp(0.7rem, 0.9vw, 0.9rem)' }}>{isArabic ? 'نبذة' : 'Bio'}</span>
                    <p className="mb-0" style={arabicFontStyle}>{selectedTeacher.bio}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer style={{ borderTop: darkMode ? '1px solid #2d2d44' : '1px solid #e9ecef' }}>
          <Button variant="secondary" onClick={() => setShowViewModal(false)} style={{ ...arabicFontStyle, borderRadius: '12px', fontSize: 'clamp(0.7rem, 0.9vw, 0.9rem)' }}>
            {isArabic ? 'إغلاق' : 'Close'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Styles */}
      <style>{`
        @media print {
          .teachers-management .page-header .btn,
          .teachers-management .stats-card-enhanced,
          .teachers-management .modern-card .card-footer,
          .teachers-management .modern-card thead,
          .teachers-management .modern-card tbody tr td:last-child,
          .teachers-management .modern-card tbody tr td:first-child,
          .teachers-management .modern-card .form-check,
          .teachers-management .page-header .d-flex.gap-2,
          .teachers-management .modern-card .text-muted.small,
          .teachers-management .pagination {
            display: none !important;
          }
          .teachers-management .modern-card {
            border: none !important;
            box-shadow: none !important;
          }
          .teachers-management .modern-card tbody tr {
            page-break-inside: avoid;
          }
          .teachers-management .modern-card .table {
            width: 100% !important;
          }
          .teachers-management .modern-card .table td,
          .teachers-management .modern-card .table th {
            padding: 8px !important;
          }
          .teachers-management .page-header h4 {
            font-size: 18px !important;
          }
          .teachers-management .modern-card .table th {
            background: #f8f9fa !important;
            color: #212529 !important;
          }
          .teachers-management .modern-card .table td {
            color: #212529 !important;
          }
          .teachers-management .modern-card .badge {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }

        .action-btn {
          padding: 2px 6px !important;
          min-width: 26px;
          min-height: 26px;
          font-size: clamp(0.5rem, 0.6vw, 0.7rem) !important;
          border-radius: 6px !important;
        }
        
        .action-btn-responsive {
          font-size: clamp(0.6rem, 0.8vw, 0.8rem) !important;
          padding: 4px 10px !important;
        }
        
        @media (max-width: 768px) {
          .action-btn {
            padding: 2px 4px !important;
            min-width: 22px;
            min-height: 22px;
            font-size: 0.5rem !important;
          }
          .action-btn svg {
            font-size: 8px !important;
          }
          .action-btn-responsive {
            font-size: 0.6rem !important;
            padding: 3px 6px !important;
          }
          .action-btn-responsive svg {
            font-size: 10px !important;
          }
        }
        
        @media (max-width: 576px) {
          .action-btn {
            padding: 1px 3px !important;
            min-width: 18px;
            min-height: 18px;
          }
          .action-btn svg {
            font-size: 7px !important;
          }
          .action-btn-responsive {
            font-size: 0.5rem !important;
            padding: 2px 4px !important;
          }
          .action-btn-responsive svg {
            font-size: 8px !important;
          }
        }

        @media (max-width: 1200px) {
          .teachers-management .table-responsive {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
        }

        @media (max-width: 768px) {
          .teachers-management .table td,
          .teachers-management .table th {
            padding: 4px 3px !important;
          }
          .teachers-management .table td .fw-semibold {
            font-size: 0.6rem !important;
          }
          .teachers-management .table td small {
            font-size: 0.45rem !important;
            max-width: 60px !important;
          }
          .teachers-management .table .badge {
            font-size: 0.4rem !important;
            padding: 2px 4px !important;
          }
          .teachers-management .table .badge svg {
            font-size: 6px !important;
          }
          .teachers-management .stats-card-enhanced .p-2 {
            padding: 4px !important;
          }
          .teachers-management .stats-card-enhanced h2 {
            font-size: 0.9rem !important;
          }
          .teachers-management .stats-card-enhanced p {
            font-size: 0.45rem !important;
          }
          .teachers-management .stats-card-enhanced .stats-icon-wrapper {
            padding: 4px !important;
          }
          .teachers-management .stats-card-enhanced .stats-icon-wrapper svg {
            font-size: 14px !important;
          }
        }

        @media (max-width: 576px) {
          .teachers-management .page-header {
            flex-direction: column;
            align-items: stretch !important;
          }
          .teachers-management .page-header .d-flex {
            flex-wrap: wrap;
            gap: 3px !important;
          }
          .teachers-management .page-header .btn {
            font-size: 0.55rem !important;
            padding: 3px 6px !important;
          }
          .teachers-management .page-header h4 {
            font-size: 0.85rem !important;
          }
          .teachers-management .page-header p {
            font-size: 0.6rem !important;
          }
          .teachers-management .modern-card .p-2 {
            padding: 4px !important;
          }
          .teachers-management .modern-card .g-1 {
            gap: 2px !important;
          }
          .teachers-management .modern-card .col-md-3,
          .teachers-management .modern-card .col-md-2 {
            padding: 0 2px !important;
          }
          .teachers-management .modern-card .form-select,
          .teachers-management .modern-card .form-control {
            font-size: 0.55rem !important;
            padding: 3px 4px !important;
          }
          .teachers-management .modern-card .btn {
            font-size: 0.55rem !important;
            padding: 3px 4px !important;
          }
          .teachers-management .modern-card .input-group-text {
            padding: 3px 6px !important;
          }
          .teachers-management .modern-card .input-group-text svg {
            font-size: 10px !important;
          }
          .teachers-management .stats-card-enhanced {
            min-height: 60px !important;
          }
          .teachers-management .stats-card-enhanced .stats-icon-wrapper svg {
            width: 14px !important;
            height: 14px !important;
          }
        }

        .responsive-pagination .page-link {
          padding: 4px 8px;
          font-size: clamp(0.55rem, 0.7vw, 0.75rem);
        }

        @media (max-width: 576px) {
          .responsive-pagination .page-link {
            padding: 2px 6px;
            font-size: 0.5rem;
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
          .teachers-management .modern-card .card-footer {
            flex-direction: column;
            align-items: center !important;
            gap: 4px !important;
          }
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

        .teachers-management .modern-card {
          border-radius: 16px;
          border: none;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          transition: all 0.3s;
        }
        
        .teachers-management .spinning {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .teachers-management .teacher-avatar-sm {
          transition: transform 0.3s ease;
        }

        .teachers-management .teacher-avatar-sm:hover {
          transform: scale(1.15);
        }

        .teachers-management .teacher-avatar-lg {
          transition: transform 0.3s ease;
        }

        .teachers-management .teacher-avatar-lg:hover {
          transform: scale(1.05);
        }

        .teachers-management .modern-modal .modal-content {
          border-radius: 20px !important;
          border: none !important;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
          overflow: hidden;
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

export default TeachersManagement;