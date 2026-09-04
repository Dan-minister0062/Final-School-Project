// src/components/dashboard/admin/UsersManagement.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Button,
  Table,
  Modal,
  Form,
  Alert,
  InputGroup,
  Pagination,
  Dropdown,
  Nav,
  Tab,
  ProgressBar,
  Image,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import {
  FaUsers,
  FaUserPlus,
  FaSearch,
  FaFilter,
  FaEye,
  FaEdit,
  FaTrash,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaSync,
  FaDownload,
  FaPrint,
  FaChevronDown,
  FaChevronUp,
  FaExclamationTriangle,
  FaSpinner,
  FaUserTie,
  FaCalendarAlt,
  FaIdCard,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaUserCircle,
  FaShieldAlt,
  FaLock,
  FaUnlock,
  FaBan,
  FaCheck,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaUserCog,
  FaMailBulk,
  FaEnvelopeOpen,
  FaUserCheck,
  FaUserTimes,
  FaClock,
  FaGraduationCap,
  FaSchool,
  FaBuilding,
  FaThList,
  FaTh,
  FaSave,
  FaTimes,
  FaPlus,
  FaArrowRight,
  FaArrowLeft,
  FaRocket,
  FaStar,
  FaPaperPlane,
  FaBook,
  FaBookOpen,
  FaUsers as FaUsersIcon,
  FaPlusCircle,
  FaMinusCircle,
  FaBriefcase,
  FaBirthdayCake,
  FaVenusMars,
  FaGlobe,
  FaIdBadge,
  FaImage,
  FaFileAlt,
  FaCertificate,
  FaHandshake,
  FaUserMd,
  FaHospital,
  FaPhoneAlt,
  FaChild,
  FaAddressBook,
  FaUniversity,
  FaGraduationCap as FaGraduation,
  FaChalkboard,
  FaClipboardList,
  FaSchool as FaSchoolIcon,
  FaCity,
  FaCamera,
} from "react-icons/fa";
import { useLanguage } from "../../../context/LanguageContext";
import { useAuth } from "../../../hooks/useAuth";
import { useNotification } from "../../../hooks/useNotification";
import userDataService from "../../../services/userDataService";
import { teacherService } from "../../../services/teacherService";
import {
  fetchServerClasses,
  toCatalogClasses,
} from "../../../services/classService";
import { format, formatDistanceToNow, isValid } from "date-fns";
import { ar, enUS } from "date-fns/locale";

// ===== SAFE DATE FORMAT FUNCTION =====
const safeFormatDate = (date, formatStr = "PPP", options = {}) => {
  if (!date) return "N/A";
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!isValid(dateObj)) return "N/A";
    return format(dateObj, formatStr, options);
  } catch (error) {
    return "N/A";
  }
};

const safeFormatDistanceToNow = (date, options = {}) => {
  if (!date) return "Not logged in yet";
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!isValid(dateObj)) return "Not logged in yet";
    return formatDistanceToNow(dateObj, { addSuffix: true, ...options });
  } catch (error) {
    return "Not logged in yet";
  }
};

// ===== ALWAYS use English numbers =====
const formatNumber = (num) => {
  if (num === undefined || num === null) return "0";
  return num.toString();
};

const UsersManagement = () => {
  const { isArabic } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notify } = useNotification();

  // ===== STATE =====
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showBulkActionModal, setShowBulkActionModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showResendInviteModal, setShowResendInviteModal] = useState(false);
  const [bulkAction, setBulkAction] = useState("");
  const [processingAction, setProcessingAction] = useState(false);
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [viewMode, setViewMode] = useState("list");
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");

  // ===== SUBJECTS & CLASSES DATA =====
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);

  // ===== ARABIC FONT STYLE =====
  const arabicFontStyle = {
    fontFamily: isArabic
      ? '"Hacen Tunisia", "Hacen Tunisia Bd", "Noto Sans Arabic", "Vazirmatn", "Traditional Arabic", "Arabic Typesetting", serif'
      : "inherit",
    lineHeight: isArabic ? "1.8" : "1.6",
    letterSpacing: isArabic ? "0.5px" : "0px",
    fontSize: isArabic
      ? "clamp(0.85rem, 1.1vw, 1.05rem)"
      : "clamp(0.8rem, 1vw, 1rem)",
  };

  // ===== COMPLETE CLASSES LIST WITH ARABIC NAMES =====
  const completeClassesList = [
    // ===== KINDERGARTEN =====
    { 
      id: "kindergarten_intro", 
      name: "Introductory", 
      nameAr: "استئناس",
      level: "kindergarten" 
    },
    { 
      id: "kindergarten_prep1a", 
      name: "Preparatory 1 -A-", 
      nameAr: "التمهيدي الأول  -أ-",
      level: "kindergarten" 
    },
    { 
      id: "kindergarten_prep1b", 
      name: "Preparatory 1 -B-", 
      nameAr: "التمهيدي الأول  -ب-",
      level: "kindergarten" 
    },
    { 
      id: "kindergarten_prep2a", 
      name: "Preparatory 2 -A-", 
      nameAr: "التمهيدي الثاني  -أ-",
      level: "kindergarten" 
    },
    { 
      id: "kindergarten_prep2b", 
      name: "Preparatory 2 -B-", 
      nameAr: "التمهيدي الثاني  -ب-",
      level: "kindergarten" 
    },
    
    // ===== PRIMARY =====
    { 
      id: "primary_1a", 
      name: "1 -A-", 
      nameAr: "أول ابتدائي  -أ-",
      level: "primary" 
    },
    { 
      id: "primary_1b", 
      name: "1 -B-", 
      nameAr: "أول ابتدائي  -ب-",
      level: "primary" 
    },
    { 
      id: "primary_2a", 
      name: "2 -A-", 
      nameAr: "الثاني ابتدائي  -أ-",
      level: "primary" 
    },
    { 
      id: "primary_2b", 
      name: "2 -B-", 
      nameAr: "الثاني ابتدائي   -ب-",
      level: "primary" 
    },
    { 
      id: "primary_3a", 
      name: "3 -A-", 
      nameAr: "الثالث ابتدائي -أ-",
      level: "primary" 
    },
    { 
      id: "primary_3b", 
      name: "3 -B-", 
      nameAr: "الثالث ابتدائي  -ب-",
      level: "primary" 
    },
    { 
      id: "primary_4a", 
      name: "4 -A-", 
      nameAr: "الرابع ابتدائي  -أ-",
      level: "primary" 
    },
    { 
      id: "primary_4b", 
      name: "4 -B-", 
      nameAr: "الرابع ابتدائي  -ب-",
      level: "primary" 
    },
    { 
      id: "primary_5a", 
      name: "5 -A-", 
      nameAr: "الخامس ابتدائي  -أ-",
      level: "primary" 
    },
    { 
      id: "primary_5b", 
      name: "5 -B-", 
      nameAr: "الخامس ابتدائي  -ب-",
      level: "primary" 
    },
    { 
      id: "primary_6a", 
      name: "6 -A-", 
      nameAr: "السادس ابتدائي  -أ-",
      level: "primary" 
    },
    { 
      id: "primary_6b", 
      name: "6 -B-", 
      nameAr: "السادس ابتدائي  -ب-",
      level: "primary" 
    },
    
    // ===== SECONDARY =====
    { 
      id: "secondary_1a", 
      name: "Secondary 1 -A-", 
      nameAr: "أولى إعدادي  -أ-",
      level: "secondary" 
    },
    { 
      id: "secondary_1b", 
      name: "Secondary 1 -B-", 
      nameAr: "أولى إعدادي  -ب-",
      level: "secondary" 
    },
    { 
      id: "secondary_2a", 
      name: "Secondary 2 -A-", 
      nameAr: "الثانية إعدادي  -أ-",
      level: "secondary" 
    },
    { 
      id: "secondary_2b", 
      name: "Secondary 2 -B-", 
      nameAr: "الثانيةعدادي  -ب-",
      level: "secondary" 
    },
    { 
      id: "secondary_3a", 
      name: "Secondary 3 -A-", 
      nameAr: "الثالثة إعدادي  -أ-",
      level: "secondary" 
    },
    { 
      id: "secondary_3b", 
      name: "Secondary 3 -B-", 
      nameAr: "الثالثة إعدادي  -ب-",
      level: "secondary" 
    },
    
    // ===== HIGH SCHOOL =====
    { 
      id: "highschool_common_core", 
      name: "Common Core Science", 
      nameAr: "جذع مشترك علوم",
      level: "high_school" 
    },
    { 
      id: "highschool_1st_bac_experimental", 
      name: "1st Baccalaureate Experimental Sciences", 
      nameAr: "الأولى باك علوم تجريبية",
      level: "high_school" 
    },
    { 
      id: "highschool_2nd_bac_physical", 
      name: "2nd Baccalaureate Physical Sciences", 
      nameAr: "الثانية باك علوم فيزيائية",
      level: "high_school" 
    },
  ];

  // ===== COMPLETE SUBJECTS LIST WITH ARABIC NAMES =====
  const completeSubjectsList = {
    kindergarten: [
      { value: 'quran_k', label: "Qur'an", labelAr: 'القرآن الكريم' },
      { value: 'english_k', label: 'English', labelAr: 'اللغة الإنجليزية' },
      { value: 'french_k', label: 'French', labelAr: 'اللغة الفرنسية' },
      { value: 'arabic_k', label: 'Arabic', labelAr: 'اللغة العربية' },
      { value: 'math_k', label: 'Mathematics', labelAr: 'الرياضيات' },
      { value: 'art_k', label: 'Art', labelAr: 'الفنون' }
    ],
    primary: [
      { value: 'quran_p', label: "Qur'an", labelAr: 'التربية الإسلامية والقرآن الكريم' },
      { value: 'arabic_p', label: 'Arabic', labelAr: 'اللغة العربية' },
      { value: 'english_p', label: 'English', labelAr: 'اللغة الإنجليزية' },
      { value: 'french_p', label: 'French', labelAr: 'اللغة الفرنسية' },
      { value: 'mathematics_p', label: 'Mathematics', labelAr: 'الرياضيات' },
      { value: 'science_p', label: 'Science', labelAr: 'النشاط العلمي' },
      { value: 'sports_p', label: 'Sports', labelAr: 'الرياضة' },
      { value: 'ict_p', label: 'ICT', labelAr: ' الإعلاميات' },
      { value: 'art_p', label: 'Art', labelAr: 'التربية التشكيلية' },
      { value: 'geography_p', label: 'Geography', labelAr: 'الاجتماعيات' }
    ],
    secondary: [
      { value: 'quran_s', label: "Qur'an", labelAr: 'التربية الإسلامية والقرآن الكريم' },
      { value: 'arabic_s', label: 'Arabic', labelAr: 'اللغة العربية' },
      { value: 'english_s', label: 'English', labelAr: 'اللغة الإنجليزية' },
      { value: 'french_s', label: 'French', labelAr: 'اللغة الفرنسية' },
      { value: 'mathematics_s', label: 'Mathematics', labelAr: 'الرياضيات' },
      { value: 'svt_s', label: 'SVT (Biology)', labelAr: 'علوم الحياة والأرض' },
      { value: 'physics_s', label: 'Physics', labelAr: 'الفيزياء' },
      { value: 'sports_s', label: 'Sports', labelAr: 'الرياضة' },
      { value: 'ict_s', label: 'ICT', labelAr: ' الاعلاميات' },
      { value: 'geography_s', label: 'Geography', labelAr: 'الاجتماعيات' }
    ],
    high_school: [
      { value: 'quran_h', label: "Qur'an", labelAr: 'التربية الإسلامية والقرآن الكريم' },
      { value: 'arabic_h', label: 'Arabic', labelAr: 'اللغة العربية' },
      { value: 'english_h', label: 'English', labelAr: 'اللغة الإنجليزية' },
      { value: 'french_h', label: 'French', labelAr: 'اللغة الفرنسية' },
      { value: 'mathematics_h', label: 'Mathematics', labelAr: 'الرياضيات' },
      { value: 'svt_h', label: 'SVT (Biology)', labelAr: 'علوم الحياة والأرض' },
      { value: 'physics_h', label: 'Physics', labelAr: 'الفيزياء' },
      { value: 'sports_h', label: 'Sports', labelAr: 'الرياضة' },
      { value: 'ict_h', label: 'ICT', labelAr: ' الإعلاميات' },
      { value: 'geography_h', label: 'Geography', labelAr: 'الاجتماعيات' },
      { value: 'philosophy_h', label: 'Philosophy', labelAr: 'الفلسفة' }
    ]
  };

  // ===== QUALIFICATIONS LIST =====
  const qualificationsList = [
    { value: "baccalaureate", label: isArabic ? "بكالوريا" : "Baccalaureate" },
    { value: "bsc", label: isArabic ? "بكالوريوس علوم" : "BSc" },
    { value: "licence", label: isArabic ? " اجازة" : "Licence" },
    { value: "master", label: isArabic ? "ماجستير" : "Master" },
    { value: "doctorate", label: isArabic ? "دكتوراه" : "Doctorate" },
  ];

  // ===== LEVEL CATEGORIES =====
  const levelCategories = [
    {
      value: "kindergarten",
      label: isArabic ? "أولي" : "Kindergarten",
      icon: <FaChild />,
      color: "#f39c12",
      gradient: "linear-gradient(135deg, #f39c12, #e67e22)",
    },
    {
      value: "primary",
      label: isArabic ? "ابتدائي" : "Primary",
      icon: <FaSchool />,
      color: "#3498db",
      gradient: "linear-gradient(135deg, #3498db, #2980b9)",
    },
    {
      value: "secondary",
      label: isArabic ? "إعدادي" : "Secondary",
      icon: <FaGraduationCap />,
      color: "#2ecc71",
      gradient: "linear-gradient(135deg, #2ecc71, #27ae60)",
    },
    {
      value: "high_school",
      label: isArabic ? "ثانوي" : "High School",
      icon: <FaUniversity />,
      color: "#9b59b6",
      gradient: "linear-gradient(135deg, #9b59b6, #8e44ad)",
    },
  ];

  // ===== GENDER OPTIONS =====
  const genderOptions = [
    { value: "male", label: isArabic ? "ذكر" : "Male" },
    { value: "female", label: isArabic ? "أنثى" : "Female" },
  ];

  // ===== EMPLOYMENT TYPES =====
  const employmentTypes = [
    { value: "full_time", label: isArabic ? "دوام كامل" : "Full Time" },
    { value: "part_time", label: isArabic ? "دوام جزئي" : "Part Time" },
  ];

  // ===== RELATIONSHIP OPTIONS =====
  const relationshipOptions = [
    { value: "father", label: isArabic ? "أب" : "Father" },
    { value: "mother", label: isArabic ? "أم" : "Mother" },
    { value: "brother", label: isArabic ? "أخ" : "Brother" },
    { value: "sister", label: isArabic ? "أخت" : "Sister" },
    { value: "guardian", label: isArabic ? "ولي أمر" : "Guardian" },
    { value: "other", label: isArabic ? "أخرى" : "Other" },
  ];

  // ===== GET SUBJECTS FOR LEVEL WITH ARABIC SUPPORT =====
  const getSubjectsForLevel = (level) => {
    try {
      // First try to get from localStorage
      const storedSubjects = localStorage.getItem('school_subjects');
      if (storedSubjects) {
        const parsed = JSON.parse(storedSubjects);
        if (parsed && parsed[level]) {
          const subjectsList = parsed[level];
          return subjectsList.map((s) => ({
            value: s.value,
            label: isArabic ? (s.labelAr || s.label) : s.label,
          }));
        }
      }
      
      // Fallback to completeSubjectsList
      const subjectsList = completeSubjectsList[level] || [];
      return subjectsList.map((s) => ({
        value: s.value,
        label: isArabic ? (s.labelAr || s.label) : s.label,
      }));
    } catch (e) {
      console.error("Error getting subjects:", e);
      // Fallback to completeSubjectsList
      const subjectsList = completeSubjectsList[level] || [];
      return subjectsList.map((s) => ({
        value: s.value,
        label: isArabic ? (s.labelAr || s.label) : s.label,
      }));
    }
  };

  // ===== GET SUBJECT LABEL WITH ARABIC SUPPORT =====
  const getSubjectDisplay = (subjectValue) => {
    // Search in completeSubjectsList
    for (const [level, subjects] of Object.entries(completeSubjectsList)) {
      const found = subjects.find((s) => s.value === subjectValue);
      if (found) {
        return isArabic ? (found.labelAr || found.label) : found.label;
      }
    }
    
    // Try localStorage
    try {
      const storedSubjects = localStorage.getItem('school_subjects');
      if (storedSubjects) {
        const parsed = JSON.parse(storedSubjects);
        for (const [level, subjects] of Object.entries(parsed)) {
          const found = subjects.find((s) => s.value === subjectValue);
          if (found) {
            return isArabic ? (found.labelAr || found.label) : found.label;
          }
        }
      }
    } catch (e) {
      console.error('Error getting subject from localStorage:', e);
    }
    
    return subjectValue;
  };

  // ===== GET CLASS NAME WITH ARABIC SUPPORT =====
  const getClassName = (classId) => {
    // First check in completeClassesList
    const classFromList = completeClassesList.find((c) => c.id === classId);
    if (classFromList) {
      return isArabic ? (classFromList.nameAr || classFromList.name) : classFromList.name;
    }
    
    // Try to get from classes state
    const found = classes.find((c) => c.id === classId);
    if (found) {
      return isArabic ? (found.nameAr || found.name) : found.name;
    }
    
    // Try localStorage
    try {
      const storedClasses = JSON.parse(localStorage.getItem('school_classes') || '[]');
      const stored = storedClasses.find(c => c.id === classId);
      if (stored) {
        return isArabic ? (stored.nameAr || stored.name) : stored.name;
      }
    } catch (e) {
      console.error('Error getting class from localStorage:', e);
    }
    
    return classId;
  };

  // ===== GET CLASS NAME FOR DISPLAY IN TABLE =====
  const getClassDisplayName = (classId) => {
    const classInfo = completeClassesList.find(c => c.id === classId);
    if (classInfo) {
      return isArabic ? (classInfo.nameAr || classInfo.name) : classInfo.name;
    }
    return classId;
  };

  // ===== GET AVAILABLE CLASSES WITH ARABIC NAMES =====
  const getAvailableClassesWithNames = (level) => {
    const filtered = completeClassesList.filter((c) => c.level === level);
    return filtered.map((c) => ({
      ...c,
      displayName: isArabic ? (c.nameAr || c.name) : c.name,
    }));
  };

  // ===== FORM DATA =====
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    nationality: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    cin: "",
    profilePhoto: null,
    role: "teacher",
    status: "active",
    password: "",
    confirmPassword: "",
    level: "",
    subjects: [],
    qualifications: [],
    specialization: "",
    experienceYears: "",
    employmentType: "",
    previousSchool: "",
    assignedClasses: [],
    // Parent specific fields
    childrenNames: "",
    occupation: "",
    employer: "",
    emergencyContactName: "",
    emergencyContactRelationship: "",
    emergencyContactPhone: "",
  });

  const [editFormData, setEditFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    nationality: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    cin: "",
    profilePhoto: null,
    role: "",
    status: "",
    level: "",
    subjects: [],
    qualifications: [],
    specialization: "",
    experienceYears: "",
    employmentType: "",
    previousSchool: "",
    assignedClasses: [],
    childrenNames: "",
    occupation: "",
    employer: "",
    emergencyContactName: "",
    emergencyContactRelationship: "",
    emergencyContactPhone: "",
  });

  const locale = isArabic ? ar : enUS;

  // ===== Check dark mode =====
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark =
        document.documentElement.getAttribute("data-bs-theme") === "dark" ||
        document.querySelector(".dashboard-wrapper.dark-theme") !== null;
      setDarkMode(isDark);
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-bs-theme"],
    });
    return () => observer.disconnect();
  }, []);

  // ===== ROLE OPTIONS (Removed Student) =====
  const roleOptions = [
    {
      value: "admin",
      label: isArabic ? "مدير" : "Admin",
      icon: <FaUserTie />,
      color: "#1a5f7a",
      gradient: "linear-gradient(135deg, #1a5f7a, #2a8fb0)",
    },
    {
      value: "teacher",
      label: isArabic ? "معلم" : "Teacher",
      icon: <FaChalkboardTeacher />,
      color: "#2d6a4f",
      gradient: "linear-gradient(135deg, #2d6a4f, #40916c)",
    },
    {
      value: "parent",
      label: isArabic ? "ولي أمر" : "Parent",
      icon: <FaUsers />,
      color: "#c49a6c",
      gradient: "linear-gradient(135deg, #c49a6c, #dbb88a)",
    },
  ];

  const statusOptions = [
    {
      value: "active",
      label: isArabic ? "نشط" : "Active",
      color: "#2ecc71",
      icon: <FaCheckCircle />,
    },
    {
      value: "inactive",
      label: isArabic ? "غير نشط" : "Inactive",
      color: "#95a5a6",
      icon: <FaTimesCircle />,
    },
    {
      value: "pending",
      label: isArabic ? "قيد الانتظار" : "Pending",
      color: "#f39c12",
      icon: <FaClock />,
    },
    {
      value: "suspended",
      label: isArabic ? "موقوف" : "Suspended",
      color: "#e74c3c",
      icon: <FaBan />,
    },
  ];

  // ===== SUBSCRIBE TO USER DATA SERVICE =====
  useEffect(() => {
    loadUsers();

    if (userDataService && typeof userDataService.addListener === "function") {
      const unsubscribe = userDataService.addListener(
        (action, data, updatedUsers) => {
          console.log("📢 User data changed:", action);
          setUsers([...updatedUsers]);
          updateStats(updatedUsers);
        },
      );

      return () => {
        if (unsubscribe) unsubscribe();
      };
    } else {
      console.warn("userDataService.addListener is not available");
      return () => {};
    }
  }, []);

  const loadUsers = () => {
    setLoading(true);
    try {
      // Load from school_users first
      const usersData = JSON.parse(localStorage.getItem("school_users") || "[]");
      
      // Also load from role-specific storage for completeness
      const teachers = JSON.parse(localStorage.getItem("school_teachers") || "[]");
      const parents = JSON.parse(localStorage.getItem("school_parents") || "[]");
      
      // Merge data (usersData should have all, but we ensure completeness)
      let allUsers = [...usersData];
      
      // Add any teachers not in usersData
      teachers.forEach(teacher => {
        if (!allUsers.find(u => u.id === teacher.id)) {
          allUsers.push(teacher);
        }
      });
      
      // Add any parents not in usersData
      parents.forEach(parent => {
        if (!allUsers.find(u => u.id === parent.id)) {
          allUsers.push(parent);
        }
      });
      
      setUsers([...allUsers]);
      updateStats(allUsers);
      setError(null);
    } catch (err) {
      console.error("Error loading users:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (usersData) => {
    const data = usersData || users;
    setTotalUsers(data.length);
    setTotalPages(Math.ceil(data.length / 10));
  };

  // ===== GET CLASSES =====
  const getClasses = () => {
    return completeClassesList;
  };

  // ===== FETCH CLASSES =====
  const fetchClasses = () => {
    setClasses(completeClassesList);
  };

  // ===== FETCH SUBJECTS =====
  const fetchSubjects = () => {
    setSubjects([]);
  };

  // ===== UPDATE AVAILABLE CLASSES BASED ON LEVEL =====
  useEffect(() => {
    if (formData.level) {
      const filtered = classes.filter((c) => c.level === formData.level);
      setAvailableClasses(filtered);
    } else {
      setAvailableClasses([]);
    }
  }, [formData.level, classes]);

  // ===== UPDATE AVAILABLE SUBJECTS BASED ON LEVEL =====
  useEffect(() => {
    if (formData.level) {
      const subjectsData = getSubjectsForLevel(formData.level);
      setAvailableSubjects(subjectsData);
    } else {
      setAvailableSubjects([]);
    }
  }, [formData.level]);

  // ===== HANDLE LEVEL CHANGE =====
  const handleLevelChange = (level) => {
    setFormData((prev) => ({
      ...prev,
      level,
      subjects: [],
      assignedClasses: [],
    }));
  };

  // ===== INITIAL LOAD =====
  useEffect(() => {
    fetchClasses();

    fetchServerClasses().then((rows) => {
      if (rows) setClasses(toCatalogClasses(rows, completeClassesList));
    });

    fetchSubjects();
  }, []);

  // ===== MAP ASSIGNED CLASS IDs =====
  const mapAssignedClassIds = (assignedIds) => {
    try {
      const allClasses = JSON.parse(localStorage.getItem('school_classes') || '[]');
      
      if (!allClasses || allClasses.length === 0) {
        return assignedIds;
      }
      
      const mappedIds = assignedIds.map(assignedId => {
        // First try exact match
        let found = allClasses.find(c => c.id === assignedId);
        if (found) return found.id;
        
        // Try matching by name or Arabic name
        const classMapping = completeClassesList.find(c => c.id === assignedId);
        if (classMapping) {
          const nameMatch = allClasses.find(c => 
            c.name === classMapping.name || 
            c.nameAr === classMapping.nameAr
          );
          if (nameMatch) return nameMatch.id;
        }
        
        return assignedId;
      });
      
      return mappedIds;
    } catch (error) {
      console.error('Error mapping class IDs:', error);
      return assignedIds;
    }
  };

  // ===== SAVE USER TO STORAGE =====
  const saveUserToStorage = (userData) => {
    try {
      console.log("💾 Saving user to storage:", userData);
      
      const userToSave = {
        ...userData,
        id: userData.id || `USR${String(Date.now()).slice(-6)}`,
        name: userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
        createdAt: userData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: userData.status || 'active',
      };

      // Save to school_users
      const users = JSON.parse(localStorage.getItem("school_users") || "[]");
      const existingUserIndex = users.findIndex((u) => u.id === userToSave.id);
      
      if (existingUserIndex === -1) {
        users.push(userToSave);
        localStorage.setItem("school_users", JSON.stringify(users));
      } else {
        users[existingUserIndex] = {
          ...users[existingUserIndex],
          ...userToSave,
        };
        localStorage.setItem("school_users", JSON.stringify(users));
      }

      // If user is a teacher, save to school_teachers
      if (userToSave.role === "teacher") {
        const teachers = JSON.parse(localStorage.getItem("school_teachers") || "[]");
        const existingTeacherIndex = teachers.findIndex((t) => t.id === userToSave.id);
        
        const teacherData = {
          id: userToSave.id,
          name: userToSave.name,
          firstName: userToSave.firstName || '',
          lastName: userToSave.lastName || '',
          email: userToSave.email || '',
          phone: userToSave.phone || '',
          address: userToSave.address || '',
          city: userToSave.city || '',
          dateOfBirth: userToSave.dateOfBirth || '',
          gender: userToSave.gender || '',
          nationality: userToSave.nationality || '',
          cin: userToSave.cin || '',
          role: 'teacher',
          status: userToSave.status || 'active',
          password: userToSave.password || 'password123',
          level: userToSave.level || '',
          educationLevel: userToSave.level || '',
          subjects: userToSave.subjects || [],
          qualifications: userToSave.qualifications || [],
          specialization: userToSave.specialization || '',
          experienceYears: userToSave.experienceYears || '',
          employmentType: userToSave.employmentType || '',
          previousSchool: userToSave.previousSchool || '',
          assignedClasses: userToSave.assignedClasses || [],
          classes: userToSave.assignedClasses || [],
          emergencyContactName: userToSave.emergencyContactName || '',
          emergencyContactRelationship: userToSave.emergencyContactRelationship || '',
          emergencyContactPhone: userToSave.emergencyContactPhone || '',
          createdAt: userToSave.createdAt,
          updatedAt: new Date().toISOString(),
        };
        
        if (existingTeacherIndex === -1) {
          teachers.push(teacherData);
          localStorage.setItem("school_teachers", JSON.stringify(teachers));
        } else {
          teachers[existingTeacherIndex] = {
            ...teachers[existingTeacherIndex],
            ...teacherData,
          };
          localStorage.setItem("school_teachers", JSON.stringify(teachers));
        }

        try {
          teacherService.saveTeacher(teacherData);
        } catch (e) {
          console.warn("Could not save to teacherService:", e);
        }
      }

      // If user is a parent, save to school_parents
      if (userToSave.role === "parent") {
        const parents = JSON.parse(localStorage.getItem("school_parents") || "[]");
        const existingParentIndex = parents.findIndex((p) => p.id === userToSave.id);
        
        const parentData = {
          id: userToSave.id,
          name: userToSave.name,
          firstName: userToSave.firstName || '',
          lastName: userToSave.lastName || '',
          email: userToSave.email || '',
          phone: userToSave.phone || '',
          address: userToSave.address || '',
          city: userToSave.city || '',
          dateOfBirth: userToSave.dateOfBirth || '',
          gender: userToSave.gender || '',
          nationality: userToSave.nationality || '',
          cin: userToSave.cin || '',
          role: 'parent',
          status: userToSave.status || 'active',
          password: userToSave.password || 'password123',
          childrenNames: userToSave.childrenNames || '',
          occupation: userToSave.occupation || '',
          employer: userToSave.employer || '',
          emergencyContactName: userToSave.emergencyContactName || '',
          emergencyContactRelationship: userToSave.emergencyContactRelationship || '',
          emergencyContactPhone: userToSave.emergencyContactPhone || '',
          createdAt: userToSave.createdAt,
          updatedAt: new Date().toISOString(),
        };
        
        if (existingParentIndex === -1) {
          parents.push(parentData);
          localStorage.setItem("school_parents", JSON.stringify(parents));
        } else {
          parents[existingParentIndex] = {
            ...parents[existingParentIndex],
            ...parentData,
          };
          localStorage.setItem("school_parents", JSON.stringify(parents));
        }
      }

      window.dispatchEvent(new CustomEvent('usersUpdated', { 
        detail: { user: userToSave, action: 'save' }
      }));

      return true;
    } catch (error) {
      console.error("❌ Error saving user to storage:", error);
      return false;
    }
  };

  // ===== HANDLE SORT =====
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // ===== GET SORT ICON =====
  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort className="ms-1" />;
    return sortDirection === "asc" ? (
      <FaSortUp className="ms-1" />
    ) : (
      <FaSortDown className="ms-1" />
    );
  };

  // ===== GET ROLE DISPLAY =====
  const getRoleDisplay = (role) => {
    const found = roleOptions.find((r) => r.value === role);
    return found ? found.label : role;
  };

  const getRoleColor = (role) => {
    const found = roleOptions.find((r) => r.value === role);
    return found ? found.color : "#6c757d";
  };

  const getRoleIcon = (role) => {
    const found = roleOptions.find((r) => r.value === role);
    return found ? found.icon : <FaUserCircle />;
  };

  // ===== GET STATUS DISPLAY =====
  const getStatusDisplay = (status) => {
    const found = statusOptions.find((s) => s.value === status);
    return found ? found.label : status;
  };

  const getStatusColor = (status) => {
    const found = statusOptions.find((s) => s.value === status);
    return found ? found.color : "#6c757d";
  };

  const getStatusIcon = (status) => {
    const found = statusOptions.find((s) => s.value === status);
    return found ? found.icon : <FaCheckCircle />;
  };

  // ===== GET QUALIFICATION DISPLAY =====
  const getQualificationDisplay = (qual) => {
    const found = qualificationsList.find((q) => q.value === qual);
    return found ? found.label : qual;
  };

  // ===== GET LEVEL LABEL =====
  const getLevelLabel = (level) => {
    const found = levelCategories.find((l) => l.value === level);
    return found ? found.label : level;
  };

  // ===== FORMAT TIME =====
  const formatTime = (date) => {
    if (!date) return isArabic ? "لم يسجل الدخول بعد" : "Not logged in yet";
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (!isValid(dateObj)) {
        return isArabic ? "لم يسجل الدخول بعد" : "Not logged in yet";
      }
      return formatDistanceToNow(dateObj, { addSuffix: true, locale });
    } catch {
      return isArabic ? "منذ قليل" : "Just now";
    }
  };

  // ===== HANDLE REFRESH =====
  const handleRefresh = () => {
    loadUsers();
    notify(isArabic ? "تم تحديث البيانات" : "Data refreshed", "info");
  };

  // ===== HANDLE EXPORT =====
  const handleExport = () => {
    try {
      const headers = [
        "ID",
        "Name",
        "Email",
        "Phone",
        "City",
        "Role",
        "Status",
        "Last Login",
      ];
      const rows = users.map((u) => [
        u.id || "N/A",
        u.firstName
          ? `${u.firstName} ${u.lastName || ""}`.trim()
          : u.name || "N/A",
        u.email || "N/A",
        u.phone || "N/A",
        u.city || "N/A",
        getRoleDisplay(u.role),
        getStatusDisplay(u.status),
        u.last_login
          ? safeFormatDate(u.last_login, "dd/MM/yyyy HH:mm")
          : "N/A",
      ]);

      const csvContent = [headers, ...rows]
        .map((row) => row.join(","))
        .join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users_export_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      notify(
        isArabic ? "تم تصدير البيانات بنجاح" : "Data exported successfully",
        "success",
      );
    } catch (error) {
      console.error("Error exporting data:", error);
      notify(
        isArabic ? "❌ حدث خطأ أثناء التصدير" : "❌ Error exporting data",
        "error",
      );
    }
  };

  // ===== VALIDATION =====
  const validateForm = () => {
    const errors = [];

    if (!formData.firstName)
      errors.push(isArabic ? "الاسم الأول مطلوب" : "First name is required");
    if (!formData.lastName)
      errors.push(isArabic ? "الاسم الأخير مطلوب" : "Last name is required");
    if (!formData.email)
      errors.push(isArabic ? "البريد الإلكتروني مطلوب" : "Email is required");
    if (!formData.phone)
      errors.push(isArabic ? "رقم الهاتف مطلوب" : "Phone number is required");
    if (!formData.password || formData.password.length < 6)
      errors.push(
        isArabic
          ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل"
          : "Password must be at least 6 characters",
      );
    if (formData.password !== formData.confirmPassword) {
      errors.push(
        isArabic ? "كلمة المرور غير متطابقة" : "Passwords do not match",
      );
    }

    if (formData.role === "teacher") {
      if (!formData.level)
        errors.push(
          isArabic
            ? "المستوى التعليمي مطلوب للمعلم"
            : "Education level is required for teacher",
        );
      if (!formData.subjects || formData.subjects.length === 0)
        errors.push(
          isArabic
            ? "يجب اختيار مادة على الأقل"
            : "At least one subject is required",
        );
    }

    if (formData.role === "parent") {
      if (!formData.childrenNames)
        errors.push(
          isArabic ? "أسماء الأطفال مطلوبة" : "Children names are required",
        );
    }

    return errors;
  };

  // ===== HANDLE ADD USER =====
  const handleAddUser = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      notify(errors.join("\n"), "warning");
      return;
    }

    setProcessingAction(true);
    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      const userId = `USR${String(Date.now()).slice(-6)}`;

      let userData = {
        id: userId,
        name: fullName,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        role: formData.role,
        phone: formData.phone,
        address: formData.address || "",
        city: formData.city || "",
        dateOfBirth: formData.dateOfBirth || "",
        gender: formData.gender || "",
        nationality: formData.nationality || "",
        cin: formData.cin || "",
        status: "active",
        password: formData.password,
        avatar: formData.profilePhoto || "",
        profilePhoto: formData.profilePhoto || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        emergencyContactName: formData.emergencyContactName || "",
        emergencyContactRelationship: formData.emergencyContactRelationship || "",
        emergencyContactPhone: formData.emergencyContactPhone || "",
      };

      if (formData.role === "teacher") {
        const mappedAssignedClasses = mapAssignedClassIds(formData.assignedClasses || []);
        userData = {
          ...userData,
          level: formData.level || "",
          educationLevel: formData.level || "",
          subjects: formData.subjects || [],
          qualifications: formData.qualifications || [],
          specialization: formData.specialization || "",
          experienceYears: formData.experienceYears || "",
          employmentType: formData.employmentType || "",
          previousSchool: formData.previousSchool || "",
          assignedClasses: mappedAssignedClasses,
          classes: mappedAssignedClasses,
        };
      }

      if (formData.role === "parent") {
        userData = {
          ...userData,
          childrenNames: formData.childrenNames || "",
          occupation: formData.occupation || "",
          employer: formData.employer || "",
        };
      }

      const saved = saveUserToStorage(userData);
      
      if (saved) {
        try {
          userDataService.addUser(userData);
        } catch (e) {
          console.warn("Could not add to userDataService:", e);
        }

        const notifications = JSON.parse(
          localStorage.getItem("school_notifications") || "[]",
        );
        const notification = {
          id: `NOT${String(notifications.length + 1).padStart(3, "0")}`,
          title: `👤 New ${getRoleDisplay(formData.role)} Added`,
          message: `${fullName} has been added as a ${getRoleDisplay(formData.role)}.`,
          type: "user",
          read: false,
          recipientRole: "admin",
          createdAt: new Date().toISOString(),
          time: new Date().toLocaleString(),
          link: "/dashboard/admin/users",
        };
        notifications.push(notification);
        localStorage.setItem(
          "school_notifications",
          JSON.stringify(notifications),
        );

        window.dispatchEvent(new CustomEvent('usersUpdated', { 
          detail: { user: userData, action: 'add' }
        }));
        window.dispatchEvent(new CustomEvent('notificationAdded', { 
          detail: notification 
        }));

        notify(
          isArabic
            ? `✅ تم إضافة ${getRoleDisplay(formData.role)} بنجاح`
            : `✅ ${getRoleDisplay(formData.role)} added successfully`,
          "success",
        );

        setShowAddUserModal(false);
        resetFormData();
        loadUsers();
      } else {
        notify(
          isArabic ? "❌ حدث خطأ أثناء حفظ المستخدم" : "❌ Error saving user",
          "error",
        );
      }
    } catch (error) {
      console.error("❌ Error adding user:", error);
      notify(
        isArabic ? "❌ حدث خطأ أثناء إضافة المستخدم" : "❌ Error adding user",
        "error",
      );
    } finally {
      setProcessingAction(false);
    }
  };

  // ===== RESET FORM DATA =====
  const resetFormData = () => {
    setFormData({
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      gender: "",
      nationality: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      cin: "",
      profilePhoto: null,
      role: "teacher",
      status: "active",
      password: "",
      confirmPassword: "",
      level: "",
      subjects: [],
      qualifications: [],
      specialization: "",
      experienceYears: "",
      employmentType: "",
      previousSchool: "",
      assignedClasses: [],
      childrenNames: "",
      occupation: "",
      employer: "",
      emergencyContactName: "",
      emergencyContactRelationship: "",
      emergencyContactPhone: "",
    });
    setActiveTab("personal");
  };

  // ===== HANDLE EDIT USER =====
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditFormData({
      firstName: user.firstName || user.name?.split(" ")[0] || "",
      lastName: user.lastName || user.name?.split(" ").slice(1).join(" ") || "",
      dateOfBirth: user.dateOfBirth || "",
      gender: user.gender || "",
      nationality: user.nationality || "",
      phone: user.phone || "",
      email: user.email || "",
      address: user.address || "",
      city: user.city || "",
      cin: user.cin || "",
      profilePhoto: user.profilePhoto || user.avatar || null,
      role: user.role || "",
      status: user.status || "",
      level: user.level || "",
      subjects: user.subjects || [],
      qualifications: user.qualifications || [],
      specialization: user.specialization || "",
      experienceYears: user.experienceYears || "",
      employmentType: user.employmentType || "",
      previousSchool: user.previousSchool || "",
      assignedClasses: user.assignedClasses || [],
      childrenNames: user.childrenNames || "",
      occupation: user.occupation || "",
      employer: user.employer || "",
      emergencyContactName: user.emergencyContactName || "",
      emergencyContactRelationship: user.emergencyContactRelationship || "",
      emergencyContactPhone: user.emergencyContactPhone || "",
    });
    setShowEditModal(true);
  };

  // ===== HANDLE SAVE EDIT =====
  const handleSaveEdit = async () => {
    setProcessingAction(true);
    try {
      const updatedUser = {
        ...selectedUser,
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        name: `${editFormData.firstName} ${editFormData.lastName}`.trim(),
        email: editFormData.email,
        phone: editFormData.phone,
        address: editFormData.address,
        city: editFormData.city,
        dateOfBirth: editFormData.dateOfBirth,
        gender: editFormData.gender,
        nationality: editFormData.nationality,
        cin: editFormData.cin,
        status: editFormData.status,
        updatedAt: new Date().toISOString(),
        emergencyContactName: editFormData.emergencyContactName || selectedUser?.emergencyContactName || "",
        emergencyContactRelationship: editFormData.emergencyContactRelationship || selectedUser?.emergencyContactRelationship || "",
        emergencyContactPhone: editFormData.emergencyContactPhone || selectedUser?.emergencyContactPhone || "",
        profilePhoto: editFormData.profilePhoto || "",
        avatar: editFormData.profilePhoto || selectedUser?.avatar || "",
      };

      if (editFormData.role === "teacher") {
        const mappedAssignedClasses = mapAssignedClassIds(editFormData.assignedClasses || []);
        updatedUser.level = editFormData.level;
        updatedUser.educationLevel = editFormData.level;
        updatedUser.subjects = editFormData.subjects;
        updatedUser.qualifications = editFormData.qualifications;
        updatedUser.specialization = editFormData.specialization;
        updatedUser.experienceYears = editFormData.experienceYears;
        updatedUser.employmentType = editFormData.employmentType;
        updatedUser.previousSchool = editFormData.previousSchool;
        updatedUser.assignedClasses = mappedAssignedClasses;
        updatedUser.classes = mappedAssignedClasses;
      }

      if (editFormData.role === "parent") {
        updatedUser.childrenNames = editFormData.childrenNames;
        updatedUser.occupation = editFormData.occupation;
        updatedUser.employer = editFormData.employer;
      }

      const saved = saveUserToStorage(updatedUser);
      
      if (saved) {
        notify(
          isArabic ? "تم تحديث بيانات المستخدم بنجاح" : "User data updated successfully",
          "success",
        );
        setShowEditModal(false);
        loadUsers();
      } else {
        notify(
          isArabic ? "❌ فشل تحديث المستخدم" : "❌ Failed to update user",
          "error",
        );
      }
    } catch (error) {
      console.error("Error updating user:", error);
      notify(
        isArabic ? "❌ حدث خطأ أثناء تحديث المستخدم" : "❌ Error updating user",
        "error",
      );
    } finally {
      setProcessingAction(false);
    }
  };

  // ===== HANDLE DELETE USER =====
  const handleDeleteUser = async () => {
    setProcessingAction(true);
    try {
      const users = JSON.parse(localStorage.getItem("school_users") || "[]");
      const updatedUsers = users.filter((u) => u.id !== selectedUser.id);
      localStorage.setItem("school_users", JSON.stringify(updatedUsers));

      if (selectedUser.role === "teacher") {
        const teachers = JSON.parse(localStorage.getItem("school_teachers") || "[]");
        const updatedTeachers = teachers.filter((t) => t.id !== selectedUser.id);
        localStorage.setItem("school_teachers", JSON.stringify(updatedTeachers));
      }

      if (selectedUser.role === "parent") {
        const parents = JSON.parse(localStorage.getItem("school_parents") || "[]");
        const updatedParents = parents.filter((p) => p.id !== selectedUser.id);
        localStorage.setItem("school_parents", JSON.stringify(updatedParents));
      }

      try {
        userDataService.deleteUser(selectedUser.id);
      } catch (e) {
        console.warn("Could not delete from userDataService:", e);
      }

      notify(
        isArabic ? "تم حذف المستخدم بنجاح" : "User deleted successfully",
        "success",
      );
      setShowDeleteConfirm(false);
      loadUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      notify(
        isArabic ? "❌ حدث خطأ أثناء حذف المستخدم" : "❌ Error deleting user",
        "error",
      );
    } finally {
      setProcessingAction(false);
    }
  };

  // ===== HANDLE TOGGLE STATUS =====
  const handleToggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      const users = JSON.parse(localStorage.getItem("school_users") || "[]");
      const index = users.findIndex((u) => u.id === userId);
      if (index !== -1) {
        users[index].status = newStatus;
        localStorage.setItem("school_users", JSON.stringify(users));
        
        const user = users[index];
        if (user.role === "teacher") {
          const teachers = JSON.parse(localStorage.getItem("school_teachers") || "[]");
          const tIndex = teachers.findIndex((t) => t.id === userId);
          if (tIndex !== -1) {
            teachers[tIndex].status = newStatus;
            localStorage.setItem("school_teachers", JSON.stringify(teachers));
          }
        }
        if (user.role === "parent") {
          const parents = JSON.parse(localStorage.getItem("school_parents") || "[]");
          const pIndex = parents.findIndex((p) => p.id === userId);
          if (pIndex !== -1) {
            parents[pIndex].status = newStatus;
            localStorage.setItem("school_parents", JSON.stringify(parents));
          }
        }

        notify(
          isArabic
            ? `تم ${newStatus === "active" ? "تفعيل" : "تعطيل"} المستخدم بنجاح`
            : `User ${newStatus === "active" ? "activated" : "deactivated"} successfully`,
          "success",
        );
        loadUsers();
      }
    } catch (error) {
      console.error("Error toggling status:", error);
      notify(isArabic ? "❌ حدث خطأ" : "❌ Error occurred", "error");
    }
  };

  // ===== HANDLE RESET PASSWORD =====
  const handleResetPassword = async () => {
    setProcessingAction(true);
    try {
      const users = JSON.parse(localStorage.getItem("school_users") || "[]");
      const index = users.findIndex((u) => u.id === selectedUser.id);
      if (index !== -1) {
        const newPassword = "password123";
        users[index].password = newPassword;
        localStorage.setItem("school_users", JSON.stringify(users));
        
        notify(
          isArabic
            ? `تم إعادة تعيين كلمة المرور إلى: ${newPassword}`
            : `Password reset to: ${newPassword}`,
          "success",
        );
        setShowResetPasswordModal(false);
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      notify(
        isArabic
          ? "❌ حدث خطأ أثناء إعادة تعيين كلمة المرور"
          : "❌ Error resetting password",
        "error",
      );
    } finally {
      setProcessingAction(false);
    }
  };

  // ===== HANDLE RESEND INVITE =====
  const handleResendInvite = async () => {
    setProcessingAction(true);
    try {
      notify(
        isArabic
          ? `✅ تم إعادة إرسال الدعوة إلى ${selectedUser.email}`
          : `✅ Invitation resent to ${selectedUser.email}`,
        "success",
      );
      setShowResendInviteModal(false);
    } catch (error) {
      console.error("Error resending invite:", error);
      notify(
        isArabic
          ? "❌ حدث خطأ أثناء إعادة إرسال الدعوة"
          : "❌ Error resending invitation",
        "error",
      );
    } finally {
      setProcessingAction(false);
    }
  };

  // ===== HANDLE BULK ACTION =====
  const handleBulkAction = async () => {
    setProcessingAction(true);
    try {
      const results = userDataService.bulkAction(selectedUsers, bulkAction);

      if (results && results.length > 0) {
        notify(
          isArabic
            ? `تم تنفيذ الإجراء بنجاح على ${results.length} مستخدم`
            : `Action completed for ${results.length} users`,
          "success",
        );
        setSelectedUsers([]);
        setSelectAll(false);
        setShowBulkActionModal(false);
        loadUsers();
      }
    } catch (error) {
      console.error("Error performing bulk action:", error);
      notify(isArabic ? "❌ حدث خطأ" : "❌ Error occurred", "error");
    } finally {
      setProcessingAction(false);
    }
  };

  // ===== HANDLE SELECT ALL =====
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((u) => u.id));
    }
    setSelectAll(!selectAll);
  };

  // ===== HANDLE SELECT USER =====
  const handleSelectUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  // ===== GET FILTERED USERS =====
  const getFilteredUsers = () => {
    let filtered = users;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.name?.toLowerCase().includes(searchLower) ||
          u.email?.toLowerCase().includes(searchLower) ||
          u.phone?.includes(searchTerm) ||
          u.firstName?.toLowerCase().includes(searchLower) ||
          u.lastName?.toLowerCase().includes(searchLower) ||
          (u.id && u.id.toLowerCase().includes(searchLower)),
      );
    }

    if (filterRole !== "all") {
      filtered = filtered.filter((u) => u.role === filterRole);
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((u) => u.status === filterStatus);
    }

    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (sortField) {
        case "name":
          aVal = a.firstName
            ? `${a.firstName} ${a.lastName || ""}`.trim()
            : a.name || "";
          bVal = b.firstName
            ? `${b.firstName} ${b.lastName || ""}`.trim()
            : b.name || "";
          break;
        case "role":
          aVal = getRoleDisplay(a.role);
          bVal = getRoleDisplay(b.role);
          break;
        case "status":
          aVal = getStatusDisplay(a.status);
          bVal = getStatusDisplay(b.status);
          break;
        default:
          aVal = a.id || "";
          bVal = b.id || "";
      }

      aVal = String(aVal).toLowerCase();
      bVal = String(bVal).toLowerCase();

      if (sortDirection === "asc") {
        return aVal.localeCompare(bVal);
      } else {
        return bVal.localeCompare(aVal);
      }
    });

    return filtered;
  };

  const displayUsers = getFilteredUsers();

  // ===== STATS =====
  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === "active").length,
    inactive: users.filter((u) => u.status === "inactive").length,
    pending: users.filter((u) => u.status === "pending").length,
    suspended: users.filter((u) => u.status === "suspended").length,
    admins: users.filter((u) => u.role === "admin").length,
    teachers: users.filter((u) => u.role === "teacher").length,
    parents: users.filter((u) => u.role === "parent").length,
  };

  // ===== STATS CARDS CONFIGURATION =====
  const statsCards = [
    {
      key: "total",
      icon: <FaUsers size={28} />,
      color: "#4a9eff",
      gradient: "linear-gradient(135deg, #4a9eff, #2a7f9a)",
      value: formatNumber(stats.total),
      label: isArabic ? "إجمالي المستخدمين" : "Total Users",
    },
    {
      key: "active",
      icon: <FaUserCheck size={28} />,
      color: "#2ecc71",
      gradient: "linear-gradient(135deg, #2ecc71, #27ae60)",
      value: formatNumber(stats.active),
      label: isArabic ? "نشط" : "Active",
    },
    {
      key: "pending",
      icon: <FaClock size={28} />,
      color: "#f39c12",
      gradient: "linear-gradient(135deg, #f39c12, #e67e22)",
      value: formatNumber(stats.pending),
      label: isArabic ? "قيد الانتظار" : "Pending",
    },
    {
      key: "inactive",
      icon: <FaUserTimes size={28} />,
      color: "#e74c3c",
      gradient: "linear-gradient(135deg, #e74c3c, #c0392b)",
      value: formatNumber(stats.suspended + stats.inactive),
      label: isArabic ? "غير نشط" : "Inactive",
    },
  ];

  // ===== RENDER ROLE-SPECIFIC FIELDS =====
  const renderRoleSpecificFields = () => {
    switch (formData.role) {
      case "teacher":
        return (
          <div className="role-fields-container fade-in">
            <div className="section-divider">
              <span className="section-divider-label">
                <FaChalkboardTeacher className="me-2" />{" "}
                {isArabic ? "المعلومات المهنية" : "Professional Information"}
              </span>
            </div>

            <Form.Group className="mb-3">
              <Form.Label
                className="fw-semibold"
                style={{
                  ...arabicFontStyle,
                  color: darkMode ? "#e9ecef" : "#212529",
                }}
              >
                <FaSchool className="me-2" />{" "}
                {isArabic ? "المستوى التعليمي" : "Education Level"} *
              </Form.Label>
              <Form.Select
                value={formData.level}
                onChange={(e) => handleLevelChange(e.target.value)}
                className="form-select-lg"
                style={{
                  ...arabicFontStyle,
                  background: darkMode ? "#2d2d44" : "white",
                  color: darkMode ? "#e9ecef" : "#212529",
                  borderRadius: "12px",
                  fontSize: "clamp(0.75rem, 0.9vw, 1rem)",
                }}
              >
                <option value="">
                  {isArabic
                    ? "اختر المستوى التعليمي"
                    : "Select Education Level"}
                </option>
                {levelCategories.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            {formData.level && (
              <Form.Group className="mb-3">
                <Form.Label
                  className="fw-semibold"
                  style={{
                    ...arabicFontStyle,
                    color: darkMode ? "#e9ecef" : "#212529",
                  }}
                >
                  <FaBook className="me-2" /> {isArabic ? "المواد" : "Subjects"}{" "}
                  *
                </Form.Label>
                <div
                  className="subjects-grid p-3 rounded-3"
                  style={{
                    background: darkMode ? "#1a1a2e" : "#f8f9fa",
                    border: `1px solid ${darkMode ? "#2d2d44" : "#e9ecef"}`,
                    borderRadius: "12px",
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(160px, 1fr))",
                    gap: "6px",
                  }}
                >
                  {availableSubjects.map((subject) => (
                    <Form.Check
                      key={subject.value}
                      type="checkbox"
                      id={`subject-${subject.value}`}
                      label={subject.label}
                      checked={formData.subjects.includes(subject.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            subjects: [...formData.subjects, subject.value],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            subjects: formData.subjects.filter(
                              (s) => s !== subject.value,
                            ),
                          });
                        }
                      }}
                      className="subject-check"
                      style={{
                        ...arabicFontStyle,
                        color: darkMode ? "#e9ecef" : "#212529",
                        fontSize: "clamp(0.7rem, 0.85vw, 0.9rem)",
                      }}
                    />
                  ))}
                </div>
                <Form.Text className="text-muted" style={arabicFontStyle}>
                  {isArabic
                    ? "اختر مادة واحدة أو أكثر"
                    : "Select one or more subjects"}
                </Form.Text>
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Label
                className="fw-semibold"
                style={{
                  ...arabicFontStyle,
                  color: darkMode ? "#e9ecef" : "#212529",
                }}
              >
                <FaGraduationCap className="me-2" />{" "}
                {isArabic ? "المؤهلات العلمية" : "Qualifications"}
              </Form.Label>
              <div
                className="qualifications-grid p-3 rounded-3"
                style={{
                  background: darkMode ? "#1a1a2e" : "#f8f9fa",
                  border: `1px solid ${darkMode ? "#2d2d44" : "#e9ecef"}`,
                  borderRadius: "12px",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                  gap: "6px",
                }}
              >
                {qualificationsList.map((qual) => (
                  <Form.Check
                    key={qual.value}
                    type="checkbox"
                    id={`qual-${qual.value}`}
                    label={qual.label}
                    checked={formData.qualifications.includes(qual.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          qualifications: [
                            ...formData.qualifications,
                            qual.value,
                          ],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          qualifications: formData.qualifications.filter(
                            (q) => q !== qual.value,
                          ),
                        });
                      }
                    }}
                    className="qual-check"
                    style={{
                      ...arabicFontStyle,
                      color: darkMode ? "#e9ecef" : "#212529",
                      fontSize: "clamp(0.7rem, 0.85vw, 0.9rem)",
                    }}
                  />
                ))}
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label
                className="fw-semibold"
                style={{
                  ...arabicFontStyle,
                  color: darkMode ? "#e9ecef" : "#212529",
                }}
              >
                <FaBriefcase className="me-2" />{" "}
                {isArabic ? "التخصص" : "Specialization"}
              </Form.Label>
              <Form.Control
                type="text"
                value={formData.specialization}
                onChange={(e) =>
                  setFormData({ ...formData, specialization: e.target.value })
                }
                placeholder={isArabic ? "أدخل التخصص" : "Enter specialization"}
                className="form-control-lg"
                style={{
                  ...arabicFontStyle,
                  background: darkMode ? "#2d2d44" : "white",
                  color: darkMode ? "#e9ecef" : "#212529",
                  borderRadius: "12px",
                  fontSize: "clamp(0.75rem, 0.9vw, 1rem)",
                }}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label
                className="fw-semibold"
                style={{
                  ...arabicFontStyle,
                  color: darkMode ? "#e9ecef" : "#212529",
                }}
              >
                <FaClock className="me-2" />{" "}
                {isArabic ? "سنوات الخبرة" : "Years of Experience"}
              </Form.Label>
              <Form.Control
                type="number"
                min="0"
                max="50"
                value={formData.experienceYears}
                onChange={(e) =>
                  setFormData({ ...formData, experienceYears: e.target.value })
                }
                placeholder={
                  isArabic
                    ? "أدخل عدد سنوات الخبرة"
                    : "Enter years of experience"
                }
                className="form-control-lg"
                style={{
                  ...arabicFontStyle,
                  background: darkMode ? "#2d2d44" : "white",
                  color: darkMode ? "#e9ecef" : "#212529",
                  borderRadius: "12px",
                  fontSize: "clamp(0.75rem, 0.9vw, 1rem)",
                }}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label
                className="fw-semibold"
                style={{
                  ...arabicFontStyle,
                  color: darkMode ? "#e9ecef" : "#212529",
                }}
              >
                <FaBriefcase className="me-2" />{" "}
                {isArabic ? "نوع التوظيف" : "Employment Type"}
              </Form.Label>
              <Form.Select
                value={formData.employmentType}
                onChange={(e) =>
                  setFormData({ ...formData, employmentType: e.target.value })
                }
                className="form-select-lg"
                style={{
                  ...arabicFontStyle,
                  background: darkMode ? "#2d2d44" : "white",
                  color: darkMode ? "#e9ecef" : "#212529",
                  borderRadius: "12px",
                  fontSize: "clamp(0.75rem, 0.9vw, 1rem)",
                }}
              >
                <option value="">
                  {isArabic ? "اختر نوع التوظيف" : "Select Employment Type"}
                </option>
                {employmentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label
                className="fw-semibold"
                style={{
                  ...arabicFontStyle,
                  color: darkMode ? "#e9ecef" : "#212529",
                }}
              >
                <FaBuilding className="me-2" />{" "}
                {isArabic ? "المدرسة السابقة" : "Previous School"}
              </Form.Label>
              <Form.Control
                type="text"
                value={formData.previousSchool}
                onChange={(e) =>
                  setFormData({ ...formData, previousSchool: e.target.value })
                }
                placeholder={
                  isArabic
                    ? "أدخل المدرسة السابقة"
                    : "Enter previous school"
                }
                className="form-control-lg"
                style={{
                  ...arabicFontStyle,
                  background: darkMode ? "#2d2d44" : "white",
                  color: darkMode ? "#e9ecef" : "#212529",
                  borderRadius: "12px",
                  fontSize: "clamp(0.75rem, 0.9vw, 1rem)",
                }}
              />
            </Form.Group>

            {formData.level && (
              <Form.Group className="mb-3">
                <Form.Label
                  className="fw-semibold"
                  style={{
                    ...arabicFontStyle,
                    color: darkMode ? "#e9ecef" : "#212529",
                  }}
                >
                  <FaBuilding className="me-2" />{" "}
                  {isArabic ? "الفصول المكلف بها" : "Assigned Classes"}
                </Form.Label>
                <div
                  className="classes-grid p-3 rounded-3"
                  style={{
                    background: darkMode ? "#1a1a2e" : "#f8f9fa",
                    border: `1px solid ${darkMode ? "#2d2d44" : "#e9ecef"}`,
                    borderRadius: "12px",
                    maxHeight: "200px",
                    overflowY: "auto",
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(140px, 1fr))",
                    gap: "6px",
                  }}
                >
                  {availableClasses.map((c) => {
                    // Get class name based on language
                    const className = isArabic ? (c.nameAr || c.name) : c.name;
                    return (
                      <Form.Check
                        key={c.id}
                        type="checkbox"
                        id={`class-${c.id}`}
                        label={className}
                        checked={formData.assignedClasses.includes(c.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              assignedClasses: [
                                ...formData.assignedClasses,
                                c.id,
                              ],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              assignedClasses: formData.assignedClasses.filter(
                                (id) => id !== c.id,
                              ),
                            });
                          }
                        }}
                        className="class-check"
                        style={{
                          ...arabicFontStyle,
                          color: darkMode ? "#e9ecef" : "#212529",
                          fontSize: "clamp(0.7rem, 0.85vw, 0.9rem)",
                        }}
                      />
                    );
                  })}
                </div>
                <Form.Text className="text-muted" style={arabicFontStyle}>
                  {isArabic
                    ? "يمكنك اختيار فصل واحد أو أكثر"
                    : "You can select one or more classes"}
                </Form.Text>
              </Form.Group>
            )}
          </div>
        );

      case "parent":
        return (
          <div className="role-fields-container fade-in">
            <div className="section-divider">
              <span className="section-divider-label">
                <FaUsers className="me-2" />{" "}
                {isArabic ? "معلومات إضافية" : "Additional Information"}
              </span>
            </div>

            <Form.Group className="mb-3">
              <Form.Label
                className="fw-semibold"
                style={{
                  ...arabicFontStyle,
                  color: darkMode ? "#e9ecef" : "#212529",
                }}
              >
                <FaChild className="me-2" />{" "}
                {isArabic ? "أسماء الأطفال" : "Children Names"} *
              </Form.Label>
              <Form.Control
                type="text"
                value={formData.childrenNames}
                onChange={(e) =>
                  setFormData({ ...formData, childrenNames: e.target.value })
                }
                placeholder={
                  isArabic
                    ? "أدخل أسماء الأطفال مفصولة بفواصل"
                    : "Enter children names separated by commas"
                }
                className="form-control-lg"
                style={{
                  ...arabicFontStyle,
                  background: darkMode ? "#2d2d44" : "white",
                  color: darkMode ? "#e9ecef" : "#212529",
                  borderRadius: "12px",
                  fontSize: "clamp(0.75rem, 0.9vw, 1rem)",
                }}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label
                className="fw-semibold"
                style={{
                  ...arabicFontStyle,
                  color: darkMode ? "#e9ecef" : "#212529",
                }}
              >
                <FaBriefcase className="me-2" />{" "}
                {isArabic ? "المهنة" : "Occupation"}
              </Form.Label>
              <Form.Control
                type="text"
                value={formData.occupation}
                onChange={(e) =>
                  setFormData({ ...formData, occupation: e.target.value })
                }
                placeholder={isArabic ? "أدخل المهنة" : "Enter occupation"}
                className="form-control-lg"
                style={{
                  ...arabicFontStyle,
                  background: darkMode ? "#2d2d44" : "white",
                  color: darkMode ? "#e9ecef" : "#212529",
                  borderRadius: "12px",
                  fontSize: "clamp(0.75rem, 0.9vw, 1rem)",
                }}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label
                className="fw-semibold"
                style={{
                  ...arabicFontStyle,
                  color: darkMode ? "#e9ecef" : "#212529",
                }}
              >
                <FaBuilding className="me-2" />{" "}
                {isArabic ? "جهة العمل" : "Employer"}
              </Form.Label>
              <Form.Control
                type="text"
                value={formData.employer}
                onChange={(e) =>
                  setFormData({ ...formData, employer: e.target.value })
                }
                placeholder={isArabic ? "أدخل جهة العمل" : "Enter employer"}
                className="form-control-lg"
                style={{
                  ...arabicFontStyle,
                  background: darkMode ? "#2d2d44" : "white",
                  color: darkMode ? "#e9ecef" : "#212529",
                  borderRadius: "12px",
                  fontSize: "clamp(0.75rem, 0.9vw, 1rem)",
                }}
              />
            </Form.Group>
          </div>
        );

      default:
        return null;
    }
  };

  // ===== RENDER EMERGENCY CONTACT =====
  const renderEmergencyContact = () => {
    return (
      <div className="emergency-fields-container">
        <Form.Group className="mb-3">
          <Form.Label
            className="fw-semibold"
            style={{
              ...arabicFontStyle,
              color: darkMode ? "#e9ecef" : "#212529",
            }}
          >
            <FaUserCircle className="me-2" /> {isArabic ? "الاسم" : "Name"}
          </Form.Label>
          <Form.Control
            type="text"
            value={formData.emergencyContactName}
            onChange={(e) =>
              setFormData({ ...formData, emergencyContactName: e.target.value })
            }
            placeholder={
              isArabic ? "أدخل اسم جهة الاتصال" : "Enter emergency contact name"
            }
            className="form-control-lg"
            style={{
              ...arabicFontStyle,
              background: darkMode ? "#2d2d44" : "white",
              color: darkMode ? "#e9ecef" : "#212529",
              borderRadius: "12px",
              fontSize: "clamp(0.75rem, 0.9vw, 1rem)",
            }}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label
            className="fw-semibold"
            style={{
              ...arabicFontStyle,
              color: darkMode ? "#e9ecef" : "#212529",
            }}
          >
            <FaHandshake className="me-2" />{" "}
            {isArabic ? "العلاقة" : "Relationship"}
          </Form.Label>
          <Form.Select
            value={formData.emergencyContactRelationship}
            onChange={(e) =>
              setFormData({
                ...formData,
                emergencyContactRelationship: e.target.value,
              })
            }
            className="form-select-lg"
            style={{
              ...arabicFontStyle,
              background: darkMode ? "#2d2d44" : "white",
              color: darkMode ? "#e9ecef" : "#212529",
              borderRadius: "12px",
              fontSize: "clamp(0.75rem, 0.9vw, 1rem)",
            }}
          >
            <option value="">
              {isArabic ? "اختر العلاقة" : "Select Relationship"}
            </option>
            {relationshipOptions.map((rel) => (
              <option key={rel.value} value={rel.value}>
                {rel.label}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label
            className="fw-semibold"
            style={{
              ...arabicFontStyle,
              color: darkMode ? "#e9ecef" : "#212529",
            }}
          >
            <FaPhone className="me-2" /> {isArabic ? "رقم الهاتف" : "Phone"}
          </Form.Label>
          <Form.Control
            type="tel"
            value={formData.emergencyContactPhone}
            onChange={(e) =>
              setFormData({
                ...formData,
                emergencyContactPhone: e.target.value,
              })
            }
            placeholder={isArabic ? "أدخل رقم الهاتف" : "Enter phone number"}
            className="form-control-lg"
            style={{
              ...arabicFontStyle,
              background: darkMode ? "#2d2d44" : "white",
              color: darkMode ? "#e9ecef" : "#212529",
              borderRadius: "12px",
              fontSize: "clamp(0.75rem, 0.9vw, 1rem)",
            }}
          />
        </Form.Group>
      </div>
    );
  };

  // ============================================================
  // ===== RENDER (JSX) =====
  // ============================================================
  return (
    <div className="users-management" dir={isArabic ? "rtl" : "ltr"}>
      {/* Page Header */}
      <div className="page-header d-flex justify-content-between align-items-center flex-wrap gap-2 gap-md-3 mb-3 mb-md-4">
        <div>
          <h4
            className="fw-bold mb-0"
            style={{
              ...arabicFontStyle,
              color: "#1a5f7a",
              fontSize: "clamp(1rem, 1.8vw, 1.5rem)",
            }}
          >
            <FaUsers className="me-2" />
            {isArabic ? "إدارة المستخدمين" : "Users Management"}
          </h4>
          <p
            className="text-muted mb-0"
            style={{
              ...arabicFontStyle,
              fontSize: "clamp(0.7rem, 0.9vw, 0.85rem)",
            }}
          >
            {isArabic
              ? `إدارة جميع المستخدمين في النظام (${formatNumber(totalUsers)})`
              : `Manage all users in the system (${formatNumber(totalUsers)})`}
          </p>
        </div>
        <div className="d-flex gap-1 gap-sm-2 flex-wrap">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="action-btn-responsive"
            style={{
              ...arabicFontStyle,
              borderRadius: "12px",
              fontSize: "clamp(0.6rem, 0.8vw, 0.8rem)",
            }}
          >
            <FaSync className={loading ? "spinning" : ""} />{" "}
            <span className="d-none d-sm-inline">
              {isArabic ? "تحديث" : "Refresh"}
            </span>
          </Button>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={handleExport}
            className="action-btn-responsive"
            style={{
              ...arabicFontStyle,
              borderRadius: "12px",
              fontSize: "clamp(0.6rem, 0.8vw, 0.8rem)",
            }}
          >
            <FaDownload className="me-1" />{" "}
            <span className="d-none d-sm-inline">
              {isArabic ? "تصدير" : "Export"}
            </span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowAddUserModal(true)}
            className="action-btn-responsive"
            style={{
              ...arabicFontStyle,
              borderRadius: "12px",
              fontSize: "clamp(0.6rem, 0.8vw, 0.8rem)",
            }}
          >
            <FaUserPlus className="me-1" />{" "}
            <span className="d-none d-sm-inline">
              {isArabic ? "إضافة مستخدم" : "Add User"}
            </span>
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
                background: darkMode ? "#1a1a2e" : "#ffffff",
                borderColor: darkMode ? "#2d2d44" : "#e9ecef",
                border: "none",
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: darkMode
                  ? "0 4px 20px rgba(0,0,0,0.3)"
                  : "0 4px 20px rgba(0,0,0,0.06)",
                transition: "all 0.3s ease",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.boxShadow = darkMode
                  ? "0 8px 30px rgba(0,0,0,0.4)"
                  : "0 8px 30px rgba(0,0,0,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = darkMode
                  ? "0 4px 20px rgba(0,0,0,0.3)"
                  : "0 4px 20px rgba(0,0,0,0.06)";
              }}
            >
              <div
                className="stats-card-topbar"
                style={{
                  height: "4px",
                  background: stat.gradient,
                  borderRadius: "16px 16px 0 0",
                }}
              />
              <Card.Body className="p-2 p-sm-3 p-md-4">
                <div
                  className="stats-icon-wrapper mb-1 mb-sm-2"
                  style={{
                    display: "inline-flex",
                    padding: "clamp(6px, 1vw, 12px)",
                    borderRadius: "12px",
                    background: `${stat.color}15`,
                    color: stat.color,
                  }}
                >
                  <span style={{ fontSize: "clamp(1.2rem, 2vw, 1.8rem)" }}>
                    {stat.icon}
                  </span>
                </div>
                <h2
                  className="fw-bold mb-0"
                  style={{
                    ...arabicFontStyle,
                    fontSize: "clamp(1rem, 1.8vw, 1.6rem)",
                    color: darkMode ? "#e9ecef" : "#212529",
                  }}
                >
                  {stat.value}
                </h2>
                <p
                  className="text-muted mb-0"
                  style={{
                    ...arabicFontStyle,
                    fontSize: "clamp(0.5rem, 0.7vw, 0.7rem)",
                    opacity: 0.8,
                  }}
                >
                  {stat.label}
                </p>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Role Stats */}
      <Row className="g-2 g-md-3 mb-3 mb-md-4">
        {roleOptions.map((role) => (
          <Col key={role.value} xs={4} md={4} className="px-1 px-sm-2">
            <div
              className="role-stat-enhanced"
              style={{
                background: darkMode ? "#1a1a2e" : "#ffffff",
                border: `1px solid ${darkMode ? "#2d2d44" : "#e9ecef"}`,
                borderRadius: "14px",
                padding: "12px 16px",
                cursor: "pointer",
                transition: "all 0.3s ease",
                borderLeft: `4px solid ${role.color}`,
                boxShadow: darkMode
                  ? "0 2px 12px rgba(0,0,0,0.2)"
                  : "0 2px 12px rgba(0,0,0,0.04)",
              }}
              onClick={() => setFilterRole(role.value)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = darkMode
                  ? "0 8px 24px rgba(0,0,0,0.3)"
                  : "0 8px 24px rgba(0,0,0,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = darkMode
                  ? "0 2px 12px rgba(0,0,0,0.2)"
                  : "0 2px 12px rgba(0,0,0,0.04)";
              }}
            >
              <div className="d-flex align-items-center gap-3">
                <div
                  className="role-icon-wrapper"
                  style={{
                    color: role.color,
                    fontSize: "clamp(1.2rem, 1.8vw, 1.8rem)",
                    transition: "transform 0.3s ease",
                  }}
                >
                  {role.icon}
                </div>
                <div className="flex-grow-1">
                  <span
                    className="fw-bold d-block"
                    style={{
                      color: role.color,
                      fontSize: "clamp(1rem, 1.6vw, 1.5rem)",
                      lineHeight: "1.2",
                    }}
                  >
                    {formatNumber(stats[role.value + "s"] || 0)}
                  </span>
                  <span
                    className="text-muted"
                    style={{
                      ...arabicFontStyle,
                      fontSize: "clamp(0.5rem, 0.7vw, 0.7rem)",
                    }}
                  >
                    {role.label}
                  </span>
                </div>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* Filters */}
      <Card
        className="modern-card mb-3 mb-md-4"
        style={{
          background: darkMode ? "#1a1a2e" : "#ffffff",
          borderColor: darkMode ? "#2d2d44" : "#e9ecef",
        }}
      >
        <Card.Body className="p-2 p-md-3">
          <Row className="g-1 g-md-2 align-items-center">
            <Col xs={12} sm={6} md={4} lg={4} className="px-1 px-sm-2">
              <InputGroup size="sm">
                <InputGroup.Text
                  style={{
                    background: "transparent",
                    borderColor: darkMode ? "#2d2d44" : "#ced4da",
                  }}
                >
                  <FaSearch size={12} />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder={
                    isArabic
                      ? "بحث بالاسم أو المعرف أو البريد..."
                      : "Search by name, ID, email..."
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-control-sm"
                  style={{
                    ...arabicFontStyle,
                    background: darkMode ? "#2d2d44" : "white",
                    color: darkMode ? "#e9ecef" : "#212529",
                    fontSize: "clamp(0.6rem, 0.8vw, 0.8rem)",
                  }}
                />
                {searchTerm && (
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setSearchTerm("")}
                    style={{ borderRadius: "0 12px 12px 0" }}
                  >
                    <FaTimesCircle size={12} />
                  </Button>
                )}
              </InputGroup>
            </Col>
            <Col xs={6} sm={3} md={3} lg={3} className="px-1 px-sm-2">
              <Form.Select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="form-select-sm"
                style={{
                  ...arabicFontStyle,
                  background: darkMode ? "#2d2d44" : "white",
                  color: darkMode ? "#e9ecef" : "#212529",
                  borderRadius: "12px",
                  fontSize: "clamp(0.55rem, 0.7vw, 0.75rem)",
                }}
              >
                <option value="all">
                  {isArabic ? "جميع الأدوار" : "All Roles"}
                </option>
                {roleOptions.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={6} sm={3} md={3} lg={3} className="px-1 px-sm-2">
              <Form.Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="form-select-sm"
                style={{
                  ...arabicFontStyle,
                  background: darkMode ? "#2d2d44" : "white",
                  color: darkMode ? "#e9ecef" : "#212529",
                  borderRadius: "12px",
                  fontSize: "clamp(0.55rem, 0.7vw, 0.75rem)",
                }}
              >
                <option value="all">
                  {isArabic ? "جميع الحالات" : "All Status"}
                </option>
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={6} sm={6} md={2} lg={2} className="px-1 px-sm-2">
              <div className="d-flex gap-1">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="flex-grow-1"
                  style={{
                    ...arabicFontStyle,
                    borderRadius: "12px",
                    fontSize: "clamp(0.6rem, 0.8vw, 0.8rem)",
                  }}
                  onClick={() =>
                    setViewMode(viewMode === "list" ? "grid" : "list")
                  }
                >
                  {viewMode === "list" ? (
                    <FaTh size={14} />
                  ) : (
                    <FaThList size={14} />
                  )}
                </Button>
                {selectedUsers.length > 0 && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-grow-1"
                    style={{
                      ...arabicFontStyle,
                      borderRadius: "12px",
                      fontSize: "clamp(0.6rem, 0.8vw, 0.8rem)",
                    }}
                    onClick={() => setShowBulkActionModal(true)}
                  >
                    <FaMailBulk className="me-1" size={12} />{" "}
                    {formatNumber(selectedUsers.length)}
                  </Button>
                )}
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Users Table/Grid */}
      {loading ? (
        <div className="text-center py-5">
          <FaSpinner
            className="spinning"
            size={40}
            style={{ color: "#3498db" }}
          />
          <p className="mt-2 text-muted" style={arabicFontStyle}>
            {isArabic ? "جاري تحميل المستخدمين..." : "Loading users..."}
          </p>
        </div>
      ) : error ? (
        <div className="text-center py-5">
          <FaExclamationTriangle size={48} className="text-warning mb-3" />
          <p className="text-danger" style={arabicFontStyle}>
            {error}
          </p>
          <Button variant="primary" onClick={loadUsers} style={arabicFontStyle}>
            <FaSync className="me-2" /> {isArabic ? "إعادة المحاولة" : "Retry"}
          </Button>
        </div>
      ) : displayUsers.length === 0 ? (
        <Card
          className="modern-card text-center py-5"
          style={{
            background: darkMode ? "#1a1a2e" : "#ffffff",
            borderColor: darkMode ? "#2d2d44" : "#e9ecef",
          }}
        >
          <Card.Body>
            <FaUsers size={48} className="text-muted opacity-25 mb-3" />
            <h5 style={arabicFontStyle}>
              {isArabic ? "لا توجد مستخدمين" : "No users found"}
            </h5>
            <p className="text-muted" style={arabicFontStyle}>
              {isArabic
                ? "حاول تعديل فلتر البحث"
                : "Try adjusting your search filters"}
            </p>
          </Card.Body>
        </Card>
      ) : viewMode === "list" ? (
        <Card
          className="modern-card"
          style={{
            background: darkMode ? "#1a1a2e" : "#ffffff",
            borderColor: darkMode ? "#2d2d44" : "#e9ecef",
          }}
        >
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table hover className="mb-0" style={arabicFontStyle}>
                <thead style={{ background: darkMode ? "#0d1117" : "#f8f9fa" }}>
                  <tr>
                    <th
                      style={{ width: "30px" }}
                      className="d-none d-sm-table-cell"
                    >
                      <Form.Check
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th
                      onClick={() => handleSort("name")}
                      style={{
                        cursor: "pointer",
                        color: darkMode ? "#e9ecef" : "#212529",
                        fontSize: "clamp(0.6rem, 0.8vw, 0.85rem)",
                      }}
                    >
                      {isArabic ? "المستخدم" : "User"} {getSortIcon("name")}
                    </th>
                    <th
                      className="d-none d-lg-table-cell"
                      style={{
                        color: darkMode ? "#e9ecef" : "#212529",
                        fontSize: "clamp(0.6rem, 0.8vw, 0.85rem)",
                      }}
                    >
                      {isArabic ? "معلومات الاتصال" : "Contact"}
                    </th>
                    <th
                      onClick={() => handleSort("role")}
                      style={{
                        cursor: "pointer",
                        color: darkMode ? "#e9ecef" : "#212529",
                        fontSize: "clamp(0.6rem, 0.8vw, 0.85rem)",
                      }}
                      className="d-none d-sm-table-cell"
                    >
                      {isArabic ? "الدور" : "Role"} {getSortIcon("role")}
                    </th>
                    <th
                      onClick={() => handleSort("status")}
                      style={{
                        cursor: "pointer",
                        color: darkMode ? "#e9ecef" : "#212529",
                        fontSize: "clamp(0.6rem, 0.8vw, 0.85rem)",
                      }}
                      className="d-none d-sm-table-cell"
                    >
                      {isArabic ? "الحالة" : "Status"} {getSortIcon("status")}
                    </th>
                    <th
                      className="d-none d-md-table-cell"
                      style={{
                        color: darkMode ? "#e9ecef" : "#212529",
                        fontSize: "clamp(0.6rem, 0.8vw, 0.85rem)",
                      }}
                    >
                      {isArabic ? "آخر تسجيل دخول" : "Last Login"}
                    </th>
                    <th
                      className="text-center"
                      style={{
                        color: darkMode ? "#e9ecef" : "#212529",
                        fontSize: "clamp(0.6rem, 0.8vw, 0.85rem)",
                      }}
                    >
                      {isArabic ? "إجراءات" : "Actions"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="d-none d-sm-table-cell">
                        <Form.Check
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                        />
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-1 gap-md-2">
                          <div
                            className="user-avatar-sm"
                            style={{
                              background: `linear-gradient(135deg, ${getRoleColor(user.role)}, ${getRoleColor(user.role)}cc)`,
                              width: "clamp(28px, 3vw, 36px)",
                              height: "clamp(28px, 3vw, 36px)",
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              fontWeight: "700",
                              fontSize: "clamp(0.6rem, 0.7vw, 0.85rem)",
                              flexShrink: 0,
                            }}
                          >
                            {user.avatar ? (
                              <Image
                                src={user.avatar}
                                roundedCircle
                                fluid
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                            ) : (
                              (user.firstName || user.name || "U")
                                .charAt(0)
                                .toUpperCase()
                            )}
                          </div>
                          <div className="user-info" style={{ minWidth: 0 }}>
                            <div
                              className="fw-semibold text-truncate"
                              style={{
                                color: darkMode ? "#e9ecef" : "#212529",
                                fontSize: "clamp(0.6rem, 0.8vw, 0.85rem)",
                              }}
                            >
                              {user.firstName
                                ? `${user.firstName} ${user.lastName || ""}`.trim()
                                : user.name}
                            </div>
                            <small
                              className="text-muted d-none d-md-block"
                              style={{
                                fontSize: "clamp(0.45rem, 0.55vw, 0.65rem)",
                              }}
                            >
                              <FaIdCard className="me-1" size={10} /> {user.id}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td className="d-none d-lg-table-cell">
                        <div
                          style={{
                            fontSize: "clamp(0.5rem, 0.6vw, 0.7rem)",
                            color: darkMode ? "#e9ecef" : "#212529",
                          }}
                        >
                          <div
                            className="text-truncate"
                            style={{ maxWidth: "140px" }}
                          >
                            <FaEnvelope className="me-1 text-muted" size={10} />{" "}
                            {user.email}
                          </div>
                          {user.phone && (
                            <div
                              className="text-truncate"
                              style={{ maxWidth: "140px" }}
                            >
                              <FaPhone className="me-1 text-muted" size={10} />{" "}
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="d-none d-sm-table-cell">
                        <Badge
                          className="d-flex align-items-center gap-1 px-2 py-1 role-badge"
                          style={{
                            background: getRoleColor(user.role),
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            fontSize: "clamp(0.45rem, 0.55vw, 0.65rem)",
                          }}
                        >
                          {getRoleIcon(user.role)}
                          {getRoleDisplay(user.role)}
                        </Badge>
                      </td>
                      <td className="d-none d-sm-table-cell">
                        <Badge
                          className="d-flex align-items-center gap-1 px-2 py-1 status-badge"
                          style={{
                            background: `${getStatusColor(user.status)}15`,
                            color: getStatusColor(user.status),
                            border: `1px solid ${getStatusColor(user.status)}30`,
                            borderRadius: "8px",
                            fontSize: "clamp(0.45rem, 0.55vw, 0.65rem)",
                          }}
                        >
                          {getStatusIcon(user.status)}
                          {getStatusDisplay(user.status)}
                        </Badge>
                      </td>
                      <td className="d-none d-md-table-cell">
                        <small
                          className="text-muted"
                          style={{
                            ...arabicFontStyle,
                            color: darkMode ? "#adb5bd" : "#6c757d",
                            fontSize: "clamp(0.5rem, 0.6vw, 0.7rem)",
                          }}
                        >
                          <FaClock className="me-1" size={10} />
                          {formatTime(user.last_login)}
                        </small>
                      </td>
                      <td>
                        <div className="d-flex gap-1 justify-content-center flex-wrap">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="action-btn"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowViewModal(true);
                            }}
                            title={isArabic ? "عرض التفاصيل" : "View Details"}
                          >
                            <FaEye size={14} />
                          </Button>
                          <Button
                            variant="outline-warning"
                            size="sm"
                            className="action-btn"
                            onClick={() => handleEditUser(user)}
                            title={isArabic ? "تعديل" : "Edit"}
                          >
                            <FaEdit size={14} />
                          </Button>
                          <Button
                            variant={
                              user.status === "active"
                                ? "outline-danger"
                                : "outline-success"
                            }
                            size="sm"
                            className="action-btn"
                            onClick={() =>
                              handleToggleStatus(user.id, user.status)
                            }
                            title={
                              user.status === "active"
                                ? isArabic
                                  ? "تعطيل"
                                  : "Deactivate"
                                : isArabic
                                  ? "تفعيل"
                                  : "Activate"
                            }
                          >
                            {user.status === "active" ? (
                              <FaBan size={14} />
                            ) : (
                              <FaCheck size={14} />
                            )}
                          </Button>
                          {user.status === "pending" && (
                            <Button
                              variant="outline-info"
                              size="sm"
                              className="action-btn"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowResendInviteModal(true);
                              }}
                              title={
                                isArabic
                                  ? "إعادة إرسال الدعوة"
                                  : "Resend Invite"
                              }
                            >
                              <FaPaperPlane size={14} />
                            </Button>
                          )}
                          <Button
                            variant="outline-info"
                            size="sm"
                            className="action-btn"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowResetPasswordModal(true);
                            }}
                            title={
                              isArabic
                                ? "إعادة تعيين كلمة المرور"
                                : "Reset Password"
                            }
                          >
                            <FaSync size={14} />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="action-btn"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDeleteConfirm(true);
                            }}
                            title={isArabic ? "حذف" : "Delete"}
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                className="d-flex justify-content-between align-items-center p-2 p-md-3 border-top flex-wrap gap-2"
                style={{ borderColor: darkMode ? "#2d2d44" : "#e9ecef" }}
              >
                <div
                  className="text-muted small"
                  style={{
                    ...arabicFontStyle,
                    color: darkMode ? "#adb5bd" : "#6c757d",
                    fontSize: "clamp(0.55rem, 0.7vw, 0.75rem)",
                  }}
                >
                  {isArabic
                    ? `عرض ${formatNumber(displayUsers.length)} من ${formatNumber(totalUsers)} مستخدم`
                    : `Showing ${formatNumber(displayUsers.length)} of ${formatNumber(totalUsers)} users`}
                </div>
                <Pagination className="mb-0 responsive-pagination">
                  <Pagination.Prev
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  />
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
                      <Pagination.Item
                        key={pageNum}
                        active={pageNum === currentPage}
                        onClick={() => setCurrentPage(pageNum)}
                        style={{ color: darkMode ? "#e9ecef" : "#212529" }}
                      >
                        {formatNumber(pageNum)}
                      </Pagination.Item>
                    );
                  })}
                  <Pagination.Next
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                  />
                </Pagination>
              </div>
            )}
          </Card.Body>
        </Card>
      ) : (
        // Grid View
        <Row className="g-3 g-md-4">
          {displayUsers.map((user) => (
            <Col key={user.id} lg={4} md={6} className="px-1 px-sm-2">
              <Card
                className="user-grid-card h-100"
                style={{
                  background: darkMode ? "#1a1a2e" : "#ffffff",
                  borderColor: darkMode ? "#2d2d44" : "#e9ecef",
                  borderRadius: "16px",
                  border: "1px solid",
                  transition: "all 0.3s ease",
                  boxShadow: darkMode
                    ? "0 2px 12px rgba(0,0,0,0.2)"
                    : "0 2px 12px rgba(0,0,0,0.04)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-6px)";
                  e.currentTarget.style.boxShadow = darkMode
                    ? "0 12px 36px rgba(0,0,0,0.3)"
                    : "0 12px 36px rgba(0,0,0,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = darkMode
                    ? "0 2px 12px rgba(0,0,0,0.2)"
                    : "0 2px 12px rgba(0,0,0,0.04)";
                }}
              >
                <Card.Body className="text-center p-3 p-md-4">
                  <div className="position-relative d-inline-block">
                    <div
                      className="user-avatar-lg mx-auto"
                      style={{
                        background: `linear-gradient(135deg, ${getRoleColor(user.role)}, ${getRoleColor(user.role)}cc)`,
                        width: "clamp(60px, 8vw, 80px)",
                        height: "clamp(60px, 8vw, 80px)",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: "700",
                        fontSize: "clamp(1.5rem, 2.5vw, 2rem)",
                        margin: "0 auto",
                        boxShadow: `0 8px 25px ${getRoleColor(user.role)}40`,
                      }}
                    >
                      {user.avatar ? (
                        <Image
                          src={user.avatar}
                          roundedCircle
                          fluid
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        (user.firstName || user.name || "U")
                          .charAt(0)
                          .toUpperCase()
                      )}
                    </div>
                    <div
                      className="status-dot"
                      style={{
                        position: "absolute",
                        bottom: "4px",
                        right: "4px",
                        width: "14px",
                        height: "14px",
                        borderRadius: "50%",
                        background: getStatusColor(user.status),
                        border: `3px solid ${darkMode ? "#1a1a2e" : "#ffffff"}`,
                      }}
                    />
                  </div>
                  <h5
                    className="fw-bold mt-3 mb-1"
                    style={{
                      color: darkMode ? "#e9ecef" : "#212529",
                      fontSize: "clamp(0.9rem, 1.2vw, 1.1rem)",
                    }}
                  >
                    {user.firstName
                      ? `${user.firstName} ${user.lastName || ""}`.trim()
                      : user.name}
                  </h5>
                  <Badge
                    className="mb-2 role-badge"
                    style={{
                      background: getRoleColor(user.role),
                      color: "white",
                      padding: "4px 12px",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "clamp(0.55rem, 0.7vw, 0.7rem)",
                    }}
                  >
                    {getRoleIcon(user.role)} {getRoleDisplay(user.role)}
                  </Badge>
                  <div className="text-muted small">
                    <div
                      style={{
                        color: darkMode ? "#adb5bd" : "#6c757d",
                        fontSize: "clamp(0.55rem, 0.7vw, 0.7rem)",
                      }}
                    >
                      <FaEnvelope className="me-1" size={12} /> {user.email}
                    </div>
                    {user.phone && (
                      <div
                        style={{
                          color: darkMode ? "#adb5bd" : "#6c757d",
                          fontSize: "clamp(0.55rem, 0.7vw, 0.7rem)",
                        }}
                      >
                        <FaPhone className="me-1" size={12} /> {user.phone}
                      </div>
                    )}
                  </div>
                  <div className="mt-2">
                    <Badge
                      className="status-badge"
                      style={{
                        background: `${getStatusColor(user.status)}15`,
                        color: getStatusColor(user.status),
                        border: `1px solid ${getStatusColor(user.status)}30`,
                        padding: "2px 10px",
                        borderRadius: "8px",
                        fontSize: "clamp(0.5rem, 0.65vw, 0.65rem)",
                      }}
                    >
                      {getStatusIcon(user.status)}{" "}
                      {getStatusDisplay(user.status)}
                    </Badge>
                  </div>
                  <div className="mt-2 text-muted small">
                    <FaClock className="me-1" size={10} />
                    <span
                      style={{
                        color: darkMode ? "#adb5bd" : "#6c757d",
                        fontSize: "clamp(0.5rem, 0.6vw, 0.65rem)",
                      }}
                    >
                      {formatTime(user.last_login)}
                    </span>
                  </div>
                  <div className="mt-3 d-flex gap-1 justify-content-center flex-wrap">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="action-btn"
                      onClick={() => {
                        setSelectedUser(user);
                        setShowViewModal(true);
                      }}
                    >
                      <FaEye size={14} />
                    </Button>
                    <Button
                      variant="outline-warning"
                      size="sm"
                      className="action-btn"
                      onClick={() => handleEditUser(user)}
                    >
                      <FaEdit size={14} />
                    </Button>
                    <Button
                      variant={
                        user.status === "active"
                          ? "outline-danger"
                          : "outline-success"
                      }
                      size="sm"
                      className="action-btn"
                      onClick={() => handleToggleStatus(user.id, user.status)}
                    >
                      {user.status === "active" ? (
                        <FaBan size={14} />
                      ) : (
                        <FaCheck size={14} />
                      )}
                    </Button>
                    {user.status === "pending" && (
                      <Button
                        variant="outline-info"
                        size="sm"
                        className="action-btn"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowResendInviteModal(true);
                        }}
                      >
                        <FaPaperPlane size={14} />
                      </Button>
                    )}
                    <Button
                      variant="outline-info"
                      size="sm"
                      className="action-btn"
                      onClick={() => {
                        setSelectedUser(user);
                        setShowResetPasswordModal(true);
                      }}
                    >
                      <FaSync size={14} />
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      className="action-btn"
                      onClick={() => {
                        setSelectedUser(user);
                        setShowDeleteConfirm(true);
                      }}
                    >
                      <FaTrash size={14} />
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* ===== ADD USER MODAL ===== */}
      <Modal
        show={showAddUserModal}
        onHide={() => setShowAddUserModal(false)}
        centered
        size="xl"
        className="modern-modal add-user-modal"
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header
          closeButton
          style={{
            borderBottom: darkMode ? "1px solid #2d2d44" : "1px solid #e9ecef",
          }}
        >
          <Modal.Title
            style={{
              ...arabicFontStyle,
              color: darkMode ? "#e9ecef" : "#212529",
            }}
          >
            <FaUserPlus className="me-2 text-primary" />
            {isArabic ? "إضافة مستخدم جديد" : "Add New User"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
          style={{
            background: darkMode ? "#1a1a2e" : "#ffffff",
            maxHeight: "70vh",
            overflowY: "auto",
          }}
        >
          <Form onSubmit={(e) => e.preventDefault()}>
            {/* Role Selection */}
            <div className="role-selector-container mb-4">
              <label
                className="fw-semibold d-block mb-3"
                style={{
                  ...arabicFontStyle,
                  color: darkMode ? "#e9ecef" : "#212529",
                  fontSize: "clamp(0.8rem, 1vw, 0.95rem)",
                }}
              >
                {isArabic ? "اختر الدور" : "Select Role"} *
              </label>
              <div className="d-flex gap-2 gap-md-3 flex-wrap role-cards">
                {roleOptions.map((role) => (
                  <div
                    key={role.value}
                    className={`role-card ${formData.role === role.value ? "active" : ""}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setFormData({ ...formData, role: role.value });
                      setActiveTab("personal");
                    }}
                    style={{
                      background:
                        formData.role === role.value
                          ? role.gradient
                          : darkMode
                            ? "#1a1a2e"
                            : "#f8f9fa",
                      border:
                        formData.role === role.value
                          ? `2px solid ${role.color}`
                          : `2px solid ${darkMode ? "#2d2d44" : "#e9ecef"}`,
                      cursor: "pointer",
                      padding: "10px 16px",
                      borderRadius: "14px",
                      transition: "all 0.3s ease",
                      flex: "1",
                      minWidth: "80px",
                      textAlign: "center",
                      color:
                        formData.role === role.value
                          ? "white"
                          : darkMode
                            ? "#e9ecef"
                            : "#212529",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "clamp(1.2rem, 1.8vw, 1.8rem)",
                        marginBottom: "4px",
                      }}
                    >
                      {role.icon}
                    </div>
                    <div
                      className="fw-semibold"
                      style={{ fontSize: "clamp(0.65rem, 0.8vw, 0.85rem)" }}
                    >
                      {role.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="form-tabs mb-4">
              <div
                className="d-flex gap-2 flex-wrap"
                style={{
                  borderBottom: `2px solid ${darkMode ? "#2d2d44" : "#e9ecef"}`,
                }}
              >
                <button
                  type="button"
                  className={`form-tab ${activeTab === "personal" ? "active" : ""}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveTab("personal");
                  }}
                  style={{
                    padding: "8px 14px",
                    border: "none",
                    background: "transparent",
                    fontWeight: activeTab === "personal" ? "700" : "500",
                    color:
                      activeTab === "personal"
                        ? "#4a9eff"
                        : darkMode
                          ? "#adb5bd"
                          : "#6c757d",
                    borderBottom:
                      activeTab === "personal"
                        ? "3px solid #4a9eff"
                        : "3px solid transparent",
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                    fontSize: "clamp(0.6rem, 0.8vw, 0.85rem)",
                  }}
                >
                  <FaUserCircle className="me-1" />{" "}
                  {isArabic ? "معلومات شخصية" : "Personal Info"}
                </button>
                {formData.role && formData.role !== "admin" && (
                  <button
                    type="button"
                    className={`form-tab ${activeTab === "role" ? "active" : ""}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveTab("role");
                    }}
                    style={{
                      padding: "8px 14px",
                      border: "none",
                      background: "transparent",
                      fontWeight: activeTab === "role" ? "700" : "500",
                      color:
                        activeTab === "role"
                          ? "#4a9eff"
                          : darkMode
                            ? "#adb5bd"
                            : "#6c757d",
                      borderBottom:
                        activeTab === "role"
                          ? "3px solid #4a9eff"
                          : "3px solid transparent",
                      transition: "all 0.3s ease",
                      cursor: "pointer",
                      fontSize: "clamp(0.6rem, 0.8vw, 0.85rem)",
                    }}
                  >
                    {formData.role === "teacher" ? (
                      <FaChalkboardTeacher className="me-1" />
                    ) : (
                      <FaUsersIcon className="me-1" />
                    )}
                    {formData.role === "teacher"
                      ? isArabic
                        ? "معلومات مهنية"
                        : "Professional"
                      : isArabic
                        ? "معلومات إضافية"
                        : "Additional"}
                  </button>
                )}
                {formData.role && formData.role !== "admin" && (
                  <button
                    type="button"
                    className={`form-tab ${activeTab === "emergency" ? "active" : ""}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveTab("emergency");
                    }}
                    style={{
                      padding: "8px 14px",
                      border: "none",
                      background: "transparent",
                      fontWeight: activeTab === "emergency" ? "700" : "500",
                      color:
                        activeTab === "emergency"
                          ? "#4a9eff"
                          : darkMode
                            ? "#adb5bd"
                            : "#6c757d",
                      borderBottom:
                        activeTab === "emergency"
                          ? "3px solid #4a9eff"
                          : "3px solid transparent",
                      transition: "all 0.3s ease",
                      cursor: "pointer",
                      fontSize: "clamp(0.6rem, 0.8vw, 0.85rem)",
                    }}
                  >
                    <FaPhoneAlt className="me-1" />{" "}
                    {isArabic ? "اتصال طارئ" : "Emergency"}
                  </button>
                )}
              </div>
            </div>

            {/* Tab Content - Personal Info */}
            {activeTab === "personal" && (
              <div className="fade-in">
                <Form.Group className="mb-4 text-center">
                  <Form.Label
                    className="fw-semibold d-block"
                    style={{
                      ...arabicFontStyle,
                      color: darkMode ? "#e9ecef" : "#212529",
                      fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
                    }}
                  >
                    {isArabic ? "الصورة الشخصية" : "Profile Photo"}
                  </Form.Label>
                  <div className="d-flex flex-column align-items-center gap-2">
                    <div
                      style={{
                        width: "clamp(90px, 10vw, 120px)",
                        height: "clamp(90px, 10vw, 120px)",
                        borderRadius: "50%",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: darkMode ? "#2d2d44" : "#f1f3f5",
                        border: `2px dashed ${darkMode ? "#4a9eff" : "#adb5bd"}`,
                        color: darkMode ? "#adb5bd" : "#6c757d",
                      }}
                    >
                      {formData.profilePhoto ? (
                        <img
                          src={formData.profilePhoto}
                          alt="Profile"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <FaUserCircle size={48} />
                      )}
                    </div>
                    <div className="d-flex gap-2">
                      <Form.Control
                        type="file"
                        accept="image/*"
                        className="d-none"
                        id="add-user-photo-input"
                        onChange={(e) => {
                          const file = e.target.files && e.target.files[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (ev) =>
                            setFormData({
                              ...formData,
                              profilePhoto: ev.target.result,
                            });
                          reader.readAsDataURL(file);
                          e.target.value = "";
                        }}
                      />
                      <label
                        htmlFor="add-user-photo-input"
                        className="btn btn-sm"
                        style={{
                          background: "#4a9eff",
                          color: "#fff",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontWeight: "600",
                        }}
                      >
                        <FaCamera className="me-1" />
                        {isArabic ? "اختيار صورة" : "Choose Photo"}
                      </label>
                      {formData.profilePhoto && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          style={{ borderRadius: "8px", fontWeight: "600" }}
                          onClick={() =>
                            setFormData({ ...formData, profilePhoto: null })
                          }
                        >
                          <FaTimes className="me-1" />
                          {isArabic ? "إزالة" : "Remove"}
                        </button>
                      )}
                    </div>
                  </div>
                </Form.Group>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label
                        className="fw-semibold"
                        style={{
                          ...arabicFontStyle,
                          color: darkMode ? "#e9ecef" : "#212529",
                          fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
                        }}
                      >
                        {isArabic ? "الاسم الأول" : "First Name"} *
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            firstName: e.target.value,
                          })
                        }
                        placeholder={
                          isArabic ? "أدخل الاسم الأول" : "Enter first name"
                        }
                        className="form-control-lg"
                        style={{
                          ...arabicFontStyle,
                          background: darkMode ? "#2d2d44" : "white",
                          color: darkMode ? "#e9ecef" : "#212529",
                          borderRadius: "12px",
                          fontSize: "clamp(0.75rem, 0.9vw, 1rem)",
                        }}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label
                        className="fw-semibold"
                        style={{
                          ...arabicFontStyle,
                          color: darkMode ? "#e9ecef" : "#212529",
                          fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
                        }}
                      >
                        {isArabic ? "الاسم الأخير" : "Last Name"} *
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                        placeholder={
                          isArabic ? "أدخل الاسم الأخير" : "Enter last name"
                        }
                        className="form-control-lg"
                        style={{
                          ...arabicFontStyle,
                          background: darkMode ? "#2d2d44" : "white",
                          color: darkMode ? "#e9ecef" : "#212529",
                          borderRadius: "12px",
                          fontSize: "clamp(0.75rem, 0.9vw, 1rem)",
                        }}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label
                        className="fw-semibold"
                        style={{
                          ...arabicFontStyle,
                          color: darkMode ? "#e9ecef" : "#212529",
                          fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
                        }}
                      >
                        <FaBirthdayCake className="me-1" />{" "}
                        {isArabic ? "تاريخ الميلاد" : "Date of Birth"}
                      </Form.Label>
                      <Form.Control
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            dateOfBirth: e.target.value,
                          })
                        }
                        className="form-control-lg"
                        style={{
                          ...arabicFontStyle,
                          background: darkMode ? "#2d2d44" : "white",
                          color: darkMode ? "#e9ecef" : "#212529",
                          borderRadius: "12px",
                          fontSize: "clamp(0.75rem, 0.9vw, 1rem)",
                        }}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label
                        className="fw-semibold"
                        style={{
                          ...arabicFontStyle,
                          color: darkMode ? "#e9ecef" : "#212529",
                          fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
                        }}
                      >
                        <FaVenusMars className="me-1" />{" "}
                        {isArabic ? "الجنس" : "Gender"}
                      </Form.Label>
                      <Form.Select
                        value={formData.gender}
                        onChange={(e) =>
                          setFormData({ ...formData, gender: e.target.value })
                        }
                        className="form-select-lg"
                        style={{
                          ...arabicFontStyle,
                          background: darkMode ? "#2d2d44" : "white",
                          color: darkMode ? "#e9ecef" : "#212529",
                          borderRadius: "12px",
                          fontSize: "clamp(0.75rem, 0.9vw, 1rem)",
                        }}
                      >
                        <option value="">
                          {isArabic ? "اختر الجنس" : "Select Gender"}
                        </option>
                        {genderOptions.map((g) => (
                          <option key={g.value} value={g.value}>
                            {g.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label
                        className="fw-semibold"
                        style={{
                          ...arabicFontStyle,
                          color: darkMode ? "#e9ecef" : "#212529",
                          fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
                        }}
                      >
                        <FaGlobe className="me-1" />{" "}
                        {isArabic ? "الجنسية" : "Nationality"}
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.nationality}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            nationality: e.target.value,
                          })
                        }
                        placeholder={
                          isArabic ? "أدخل الجنسية" : "Enter nationality"
                        }
                        className="form-control-lg"
                        style={{
                          ...arabicFontStyle,
                          background: darkMode ? "#2d2d44" : "white",
                          color: darkMode ? "#e9ecef" : "#212529",
                          borderRadius: "12px",
                          fontSize: "clamp(0.75rem, 0.9vw, 1rem)",
                        }}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label
                        className="fw-semibold"
                        style={{
                          ...arabicFontStyle,
                          color: darkMode ? "#e9ecef" : "#212529",
                          fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
                        }}
                      >
                        <FaIdBadge className="me-1" />{" "}
                        {isArabic ? "رقم البطاقة الوطنية" : "CIN"}
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.cin}
                        onChange={(e) =>
                          setFormData({ ...formData, cin: e.target.value })
                        }
                        placeholder={
                          isArabic ? "أدخل رقم البطاقة" : "Enter CIN number"
                        }
                        className="form-control-lg"
                        style={{
                          ...arabicFontStyle,
                          background: darkMode ? "#2d2d44" : "white",
                          color: darkMode ? "#e9ecef" : "#212529",
                          borderRadius: "12px",
                          fontSize: "clamp(0.75rem, 0.9vw, 1rem)",
                        }}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label
                        className="fw-semibold"
                        style={{
                          ...arabicFontStyle,
                          color: darkMode ? "#e9ecef" : "#212529",
                          fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
                        }}
                      >
                        <FaEnvelope className="me-1" />{" "}
                        {isArabic ? "البريد الإلكتروني" : "Email"} *
                      </Form.Label>
                      <Form.Control
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder={
                          isArabic
                            ? "أدخل البريد الإلكتروني"
                            : "Enter email address"
                        }
                        className="form-control-lg"
                        style={{
                          ...arabicFontStyle,
                          background: darkMode ? "#2d2d44" : "white",
                          color: darkMode ? "#e9ecef" : "#212529",
                          borderRadius: "12px",
                          fontSize: "clamp(0.75rem, 0.9vw, 1rem)",
                        }}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label
                        className="fw-semibold"
                        style={{
                          ...arabicFontStyle,
                          color: darkMode ? "#e9ecef" : "#212529",
                          fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
                        }}
                      >
                        <FaPhone className="me-1" />{" "}
                        {isArabic ? "رقم الهاتف" : "Phone"} *
                      </Form.Label>
                      <Form.Control
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        placeholder={
                          isArabic ? "أدخل رقم الهاتف" : "Enter phone number"
                        }
                        className="form-control-lg"
                        style={{
                          ...arabicFontStyle,
                          background: darkMode ? "#2d2d44" : "white",
                          color: darkMode ? "#e9ecef" : "#212529",
                          borderRadius: "12px",
                          fontSize: "clamp(0.75rem, 0.9vw, 1rem)",
                        }}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label
                        className="fw-semibold"
                        style={{
                          ...arabicFontStyle,
                          color: darkMode ? "#e9ecef" : "#212529",
                          fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
                        }}
                      >
                        <FaMapMarkerAlt className="me-1" />{" "}
                        {isArabic ? "العنوان" : "Address"}
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                        placeholder={
                          isArabic ? "أدخل العنوان" : "Enter address"
                        }
                        className="form-control-lg"
                        style={{
                          ...arabicFontStyle,
                          background: darkMode ? "#2d2d44" : "white",
                          color: darkMode ? "#e9ecef" : "#212529",
                          borderRadius: "12px",
                          fontSize: "clamp(0.75rem, 0.9vw, 1rem)",
                        }}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label
                        className="fw-semibold"
                        style={{
                          ...arabicFontStyle,
                          color: darkMode ? "#e9ecef" : "#212529",
                          fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
                        }}
                      >
                        <FaCity className="me-1" />{" "}
                        {isArabic ? "المدينة" : "City"}
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.city}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                        placeholder={isArabic ? "أدخل المدينة" : "Enter city"}
                        className="form-control-lg"
                        style={{
                          ...arabicFontStyle,
                          background: darkMode ? "#2d2d44" : "white",
                          color: darkMode ? "#e9ecef" : "#212529",
                          borderRadius: "12px",
                          fontSize: "clamp(0.75rem, 0.9vw, 1rem)",
                        }}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {/* Password Fields - Added for all users */}
                <div className="section-divider mt-3">
                  <span className="section-divider-label">
                    <FaLock className="me-2" />{" "}
                    {isArabic ? "معلومات الحساب" : "Account Information"}
                  </span>
                </div>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label
                        className="fw-semibold"
                        style={{
                          ...arabicFontStyle,
                          color: darkMode ? "#e9ecef" : "#212529",
                          fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
                        }}
                      >
                        <FaLock className="me-1" />{" "}
                        {isArabic ? "كلمة المرور" : "Password"} *
                      </Form.Label>
                      <Form.Control
                        type="password"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            password: e.target.value,
                          })
                        }
                        placeholder={
                          isArabic ? "أدخل كلمة المرور" : "Enter password"
                        }
                        className="form-control-lg"
                        style={{
                          ...arabicFontStyle,
                          background: darkMode ? "#2d2d44" : "white",
                          color: darkMode ? "#e9ecef" : "#212529",
                          borderRadius: "12px",
                          fontSize: "clamp(0.75rem, 0.9vw, 1rem)",
                        }}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label
                        className="fw-semibold"
                        style={{
                          ...arabicFontStyle,
                          color: darkMode ? "#e9ecef" : "#212529",
                          fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
                        }}
                      >
                        <FaUnlock className="me-1" />{" "}
                        {isArabic ? "تأكيد كلمة المرور" : "Confirm Password"} *
                      </Form.Label>
                      <Form.Control
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            confirmPassword: e.target.value,
                          })
                        }
                        placeholder={
                          isArabic
                            ? "أعد إدخال كلمة المرور"
                            : "Re-enter password"
                        }
                        className="form-control-lg"
                        style={{
                          ...arabicFontStyle,
                          background: darkMode ? "#2d2d44" : "white",
                          color: darkMode ? "#e9ecef" : "#212529",
                          borderRadius: "12px",
                          fontSize: "clamp(0.75rem, 0.9vw, 1rem)",
                        }}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label
                    className="fw-semibold"
                    style={{
                      ...arabicFontStyle,
                      color: darkMode ? "#e9ecef" : "#212529",
                      fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
                    }}
                  >
                    {isArabic ? "الحالة" : "Status"}
                  </Form.Label>
                  <Form.Select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="form-select-lg"
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? "#2d2d44" : "white",
                      color: darkMode ? "#e9ecef" : "#212529",
                      borderRadius: "12px",
                      fontSize: "clamp(0.75rem, 0.9vw, 1rem)",
                    }}
                  >
                    {statusOptions.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
            )}

            {/* Role-Specific Tab */}
            {activeTab === "role" &&
              formData.role &&
              formData.role !== "admin" && (
                <div className="fade-in">{renderRoleSpecificFields()}</div>
              )}

            {/* Emergency Contact Tab */}
            {activeTab === "emergency" &&
              formData.role &&
              formData.role !== "admin" && (
                <div className="fade-in">{renderEmergencyContact()}</div>
              )}
          </Form>
        </Modal.Body>
        <Modal.Footer
          style={{
            borderTop: darkMode ? "1px solid #2d2d44" : "1px solid #e9ecef",
          }}
        >
          <Button
            variant="secondary"
            onClick={() => setShowAddUserModal(false)}
            disabled={processingAction}
            style={{
              ...arabicFontStyle,
              borderRadius: "12px",
              fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
            }}
          >
            {isArabic ? "إلغاء" : "Cancel"}
          </Button>
          <Button
            variant="primary"
            onClick={handleAddUser}
            disabled={processingAction}
            style={{
              ...arabicFontStyle,
              borderRadius: "12px",
              padding: "8px 24px",
              fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
            }}
          >
            {processingAction ? (
              <>
                <FaSpinner className="spinning me-2" />{" "}
                {isArabic ? "جاري..." : "Adding..."}
              </>
            ) : (
              <>
                <FaRocket className="me-2" />{" "}
                {isArabic ? "إضافة مستخدم" : "Add User"}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===== VIEW USER MODAL ===== */}
      <Modal
        show={showViewModal}
        onHide={() => setShowViewModal(false)}
        centered
        size="lg"
        className="modern-modal"
      >
        <Modal.Header
          closeButton
          style={{
            borderBottom: darkMode ? "1px solid #2d2d44" : "1px solid #e9ecef",
          }}
        >
          <Modal.Title
            style={{
              ...arabicFontStyle,
              color: darkMode ? "#e9ecef" : "#212529",
            }}
          >
            <FaUserTie className="me-2 text-primary" />
            {isArabic ? "تفاصيل المستخدم" : "User Details"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
          style={{
            background: darkMode ? "#1a1a2e" : "#ffffff",
            maxHeight: "70vh",
            overflowY: "auto",
          }}
        >
          {selectedUser && (
            <div style={arabicFontStyle}>
              <div className="text-center mb-3">
                <div
                  className="user-avatar-lg mx-auto"
                  style={{
                    background: `linear-gradient(135deg, ${getRoleColor(selectedUser.role)}, ${getRoleColor(selectedUser.role)}cc)`,
                    width: "clamp(80px, 12vw, 120px)",
                    height: "clamp(80px, 12vw, 120px)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: "700",
                    fontSize: "clamp(2rem, 4vw, 3rem)",
                    margin: "0 auto",
                    boxShadow: `0 8px 30px ${getRoleColor(selectedUser.role)}40`,
                  }}
                >
                  {selectedUser.avatar ? (
                    <Image
                      src={selectedUser.avatar}
                      roundedCircle
                      fluid
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    (selectedUser.firstName || selectedUser.name || "U")
                      .charAt(0)
                      .toUpperCase()
                  )}
                </div>
                <h5
                  className="fw-bold mt-3"
                  style={{
                    color: darkMode ? "#e9ecef" : "#212529",
                    fontSize: "clamp(1rem, 1.5vw, 1.25rem)",
                  }}
                >
                  {selectedUser.firstName
                    ? `${selectedUser.firstName} ${selectedUser.lastName || ""}`.trim()
                    : selectedUser.name}
                </h5>
                <Badge
                  className="role-badge"
                  style={{
                    background: getRoleColor(selectedUser.role),
                    color: "white",
                    padding: "4px 14px",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "clamp(0.6rem, 0.8vw, 0.8rem)",
                  }}
                >
                  {getRoleIcon(selectedUser.role)}{" "}
                  {getRoleDisplay(selectedUser.role)}
                </Badge>
                <div className="mt-2">
                  <Badge
                    className="status-badge"
                    style={{
                      background: `${getStatusColor(selectedUser.status)}15`,
                      color: getStatusColor(selectedUser.status),
                      border: `1px solid ${getStatusColor(selectedUser.status)}30`,
                      padding: "4px 14px",
                      borderRadius: "8px",
                      fontSize: "clamp(0.6rem, 0.8vw, 0.8rem)",
                    }}
                  >
                    {getStatusIcon(selectedUser.status)}{" "}
                    {getStatusDisplay(selectedUser.status)}
                  </Badge>
                </div>
                <div className="mt-2">
                  <small
                    className="text-muted"
                    style={{
                      ...arabicFontStyle,
                      fontSize: "clamp(0.6rem, 0.8vw, 0.8rem)",
                    }}
                  >
                    <FaIdCard className="me-1" />{" "}
                    {isArabic ? "رقم الهوية" : "ID"}: {selectedUser.id}
                  </small>
                </div>
              </div>

              <hr />

              <div
                className="user-details"
                style={{ color: darkMode ? "#e9ecef" : "#212529" }}
              >
                {/* Personal Information */}
                <h6
                  className="fw-bold text-primary"
                  style={{ fontSize: "clamp(0.8rem, 1vw, 1rem)" }}
                >
                  <FaUserCircle className="me-2" />{" "}
                  {isArabic ? "معلومات شخصية" : "Personal Information"}
                </h6>

                <Row className="mb-2">
                  <Col md={4}>
                    <strong className="text-muted">
                      {isArabic ? "الاسم الكامل" : "Full Name"}
                    </strong>
                  </Col>
                  <Col md={8}>
                    <span className="fw-semibold">
                      {selectedUser.firstName
                        ? `${selectedUser.firstName} ${selectedUser.lastName || ""}`.trim()
                        : selectedUser.name}
                    </span>
                  </Col>
                </Row>
                <Row className="mb-2">
                  <Col md={4}>
                    <strong className="text-muted">
                      <FaEnvelope className="me-1" />{" "}
                      {isArabic ? "البريد الإلكتروني" : "Email"}
                    </strong>
                  </Col>
                  <Col md={8}>
                    <span className="fw-semibold">{selectedUser.email}</span>
                  </Col>
                </Row>
                {selectedUser.phone && (
                  <Row className="mb-2">
                    <Col md={4}>
                      <strong className="text-muted">
                        <FaPhone className="me-1" />{" "}
                        {isArabic ? "رقم الهاتف" : "Phone"}
                      </strong>
                    </Col>
                    <Col md={8}>
                      <span className="fw-semibold">{selectedUser.phone}</span>
                    </Col>
                  </Row>
                )}
                {selectedUser.address && (
                  <Row className="mb-2">
                    <Col md={4}>
                      <strong className="text-muted">
                        <FaMapMarkerAlt className="me-1" />{" "}
                        {isArabic ? "العنوان" : "Address"}
                      </strong>
                    </Col>
                    <Col md={8}>
                      <span className="fw-semibold">
                        {selectedUser.address}
                      </span>
                    </Col>
                  </Row>
                )}
                {selectedUser.city && (
                  <Row className="mb-2">
                    <Col md={4}>
                      <strong className="text-muted">
                        <FaBuilding className="me-1" />{" "}
                        {isArabic ? "المدينة" : "City"}
                      </strong>
                    </Col>
                    <Col md={8}>
                      <span className="fw-semibold">{selectedUser.city}</span>
                    </Col>
                  </Row>
                )}
                {selectedUser.dateOfBirth && (
                  <Row className="mb-2">
                    <Col md={4}>
                      <strong className="text-muted">
                        <FaBirthdayCake className="me-1" />{" "}
                        {isArabic ? "تاريخ الميلاد" : "Date of Birth"}
                      </strong>
                    </Col>
                    <Col md={8}>
                      <span className="fw-semibold">
                        {safeFormatDate(selectedUser.dateOfBirth, "PPP", { locale })}
                      </span>
                    </Col>
                  </Row>
                )}
                {selectedUser.gender && (
                  <Row className="mb-2">
                    <Col md={4}>
                      <strong className="text-muted">
                        <FaVenusMars className="me-1" />{" "}
                        {isArabic ? "الجنس" : "Gender"}
                      </strong>
                    </Col>
                    <Col md={8}>
                      <span className="fw-semibold">
                        {genderOptions.find(
                          (g) => g.value === selectedUser.gender,
                        )?.label || selectedUser.gender}
                      </span>
                    </Col>
                  </Row>
                )}

                {selectedUser.role === "teacher" && (
                  <>
                    <hr />
                    <h6
                      className="fw-bold text-success"
                      style={{ fontSize: "clamp(0.8rem, 1vw, 1rem)" }}
                    >
                      <FaBriefcase className="me-2" />{" "}
                      {isArabic ? "معلومات مهنية" : "Professional Information"}
                    </h6>
                    {selectedUser.level && (
                      <Row className="mb-2">
                        <Col md={4}>
                          <strong className="text-muted">
                            <FaSchool className="me-1" />{" "}
                            {isArabic ? "المستوى" : "Level"}
                          </strong>
                        </Col>
                        <Col md={8}>
                          <span className="fw-semibold">
                            {getLevelLabel(selectedUser.level)}
                          </span>
                        </Col>
                      </Row>
                    )}
                    {selectedUser.subjects &&
                      selectedUser.subjects.length > 0 && (
                        <Row className="mb-2">
                          <Col md={4}>
                            <strong className="text-muted">
                              <FaBook className="me-1" />{" "}
                              {isArabic ? "المواد" : "Subjects"}
                            </strong>
                          </Col>
                          <Col md={8}>
                            <div className="d-flex flex-wrap gap-1">
                              {selectedUser.subjects.map((s, idx) => (
                                <Badge
                                  key={idx}
                                  bg="secondary"
                                  style={{ borderRadius: "6px" }}
                                >
                                  {getSubjectDisplay(s)}
                                </Badge>
                              ))}
                            </div>
                          </Col>
                        </Row>
                      )}
                    {selectedUser.qualifications &&
                      selectedUser.qualifications.length > 0 && (
                        <Row className="mb-2">
                          <Col md={4}>
                            <strong className="text-muted">
                              <FaGraduationCap className="me-1" />{" "}
                              {isArabic ? "المؤهلات" : "Qualifications"}
                            </strong>
                          </Col>
                          <Col md={8}>
                            <div className="d-flex flex-wrap gap-1">
                              {selectedUser.qualifications.map((q, idx) => (
                                <Badge
                                  key={idx}
                                  bg="secondary"
                                  style={{ borderRadius: "6px" }}
                                >
                                  {getQualificationDisplay(q)}
                                </Badge>
                              ))}
                            </div>
                          </Col>
                        </Row>
                      )}
                    {selectedUser.specialization && (
                      <Row className="mb-2">
                        <Col md={4}>
                          <strong className="text-muted">
                            <FaBriefcase className="me-1" />{" "}
                            {isArabic ? "التخصص" : "Specialization"}
                          </strong>
                        </Col>
                        <Col md={8}>
                          <span className="fw-semibold">
                            {selectedUser.specialization}
                          </span>
                        </Col>
                      </Row>
                    )}
                    {selectedUser.experienceYears && (
                      <Row className="mb-2">
                        <Col md={4}>
                          <strong className="text-muted">
                            <FaClock className="me-1" />{" "}
                            {isArabic ? "سنوات الخبرة" : "Experience"}
                          </strong>
                        </Col>
                        <Col md={8}>
                          <span className="fw-semibold">
                            {selectedUser.experienceYears}{" "}
                            {isArabic ? "سنوات" : "years"}
                          </span>
                        </Col>
                      </Row>
                    )}
                    {selectedUser.assignedClasses &&
                      selectedUser.assignedClasses.length > 0 && (
                        <Row className="mb-2">
                          <Col md={4}>
                            <strong className="text-muted">
                              <FaBuilding className="me-1" />{" "}
                              {isArabic ? "الفصول" : "Classes"}
                            </strong>
                          </Col>
                          <Col md={8}>
                            <div className="d-flex flex-wrap gap-1">
                              {selectedUser.assignedClasses.map((c, idx) => (
                                <Badge
                                  key={idx}
                                  bg="secondary"
                                  style={{ borderRadius: "6px" }}
                                >
                                  {getClassName(c)}
                                </Badge>
                              ))}
                            </div>
                          </Col>
                        </Row>
                      )}
                  </>
                )}

                {selectedUser.role === "parent" && (
                  <>
                    <hr />
                    <h6
                      className="fw-bold text-warning"
                      style={{ fontSize: "clamp(0.8rem, 1vw, 1rem)" }}
                    >
                      <FaUsers className="me-2" />{" "}
                      {isArabic ? "معلومات إضافية" : "Additional Information"}
                    </h6>
                    {selectedUser.childrenNames && (
                      <Row className="mb-2">
                        <Col md={4}>
                          <strong className="text-muted">
                            <FaChild className="me-1" />{" "}
                            {isArabic ? "الأطفال" : "Children"}
                          </strong>
                        </Col>
                        <Col md={8}>
                          <span className="fw-semibold">
                            {selectedUser.childrenNames}
                          </span>
                        </Col>
                      </Row>
                    )}
                    {selectedUser.occupation && (
                      <Row className="mb-2">
                        <Col md={4}>
                          <strong className="text-muted">
                            <FaBriefcase className="me-1" />{" "}
                            {isArabic ? "المهنة" : "Occupation"}
                          </strong>
                        </Col>
                        <Col md={8}>
                          <span className="fw-semibold">
                            {selectedUser.occupation}
                          </span>
                        </Col>
                      </Row>
                    )}
                    {selectedUser.employer && (
                      <Row className="mb-2">
                        <Col md={4}>
                          <strong className="text-muted">
                            <FaBuilding className="me-1" />{" "}
                            {isArabic ? "جهة العمل" : "Employer"}
                          </strong>
                        </Col>
                        <Col md={8}>
                          <span className="fw-semibold">
                            {selectedUser.employer}
                          </span>
                        </Col>
                      </Row>
                    )}
                  </>
                )}

                <hr />

                {/* Emergency Contact */}
                {(selectedUser.emergencyContactName ||
                  selectedUser.emergencyContactRelationship ||
                  selectedUser.emergencyContactPhone) && (
                  <>
                    <h6
                      className="fw-bold text-info"
                      style={{ fontSize: "clamp(0.8rem, 1vw, 1rem)" }}
                    >
                      <FaPhoneAlt className="me-2" />{" "}
                      {isArabic ? "جهة اتصال طارئة" : "Emergency Contact"}
                    </h6>
                    {selectedUser.emergencyContactName && (
                      <Row className="mb-2">
                        <Col md={4}>
                          <strong className="text-muted">
                            <FaUserCircle className="me-1" />{" "}
                            {isArabic ? "الاسم" : "Name"}
                          </strong>
                        </Col>
                        <Col md={8}>
                          <span className="fw-semibold">
                            {selectedUser.emergencyContactName}
                          </span>
                        </Col>
                      </Row>
                    )}
                    {selectedUser.emergencyContactRelationship && (
                      <Row className="mb-2">
                        <Col md={4}>
                          <strong className="text-muted">
                            <FaHandshake className="me-1" />{" "}
                            {isArabic ? "العلاقة" : "Relationship"}
                          </strong>
                        </Col>
                        <Col md={8}>
                          <span className="fw-semibold">
                            {selectedUser.emergencyContactRelationship}
                          </span>
                        </Col>
                      </Row>
                    )}
                    {selectedUser.emergencyContactPhone && (
                      <Row className="mb-2">
                        <Col md={4}>
                          <strong className="text-muted">
                            <FaPhone className="me-1" />{" "}
                            {isArabic ? "رقم الهاتف" : "Phone"}
                          </strong>
                        </Col>
                        <Col md={8}>
                          <span className="fw-semibold">
                            {selectedUser.emergencyContactPhone}
                          </span>
                        </Col>
                      </Row>
                    )}
                  </>
                )}

                <hr />

                {/* Registration Info */}
                <h6
                  className="fw-bold text-secondary"
                  style={{ fontSize: "clamp(0.8rem, 1vw, 1rem)" }}
                >
                  <FaCalendarAlt className="me-2" />{" "}
                  {isArabic ? "معلومات التسجيل" : "Registration Info"}
                </h6>
                <Row className="mb-2">
                  <Col md={4}>
                    <strong className="text-muted">
                      <FaCalendarAlt className="me-1" />{" "}
                      {isArabic ? "تاريخ التسجيل" : "Registered"}
                    </strong>
                  </Col>
                  <Col md={8}>
                    <span className="fw-semibold">
                      {safeFormatDate(selectedUser.created_at || selectedUser.createdAt, "PPP", { locale })}
                    </span>
                  </Col>
                </Row>
                <Row className="mb-2">
                  <Col md={4}>
                    <strong className="text-muted">
                      <FaClock className="me-1" />{" "}
                      {isArabic ? "آخر تسجيل دخول" : "Last Login"}
                    </strong>
                  </Col>
                  <Col md={8}>
                    <span className="fw-semibold">
                      {formatTime(selectedUser.last_login)}
                    </span>
                  </Col>
                </Row>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer
          style={{
            borderTop: darkMode ? "1px solid #2d2d44" : "1px solid #e9ecef",
          }}
        >
          <Button
            variant="secondary"
            onClick={() => setShowViewModal(false)}
            style={{
              ...arabicFontStyle,
              borderRadius: "12px",
              fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
            }}
          >
            {isArabic ? "إغلاق" : "Close"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===== EDIT USER MODAL (FIXED: Now includes all fields) ===== */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        centered
        size="lg"
        className="modern-modal"
      >
        <Modal.Header
          closeButton
          style={{
            borderBottom: darkMode ? "1px solid #2d2d44" : "1px solid #e9ecef",
          }}
        >
          <Modal.Title
            style={{
              ...arabicFontStyle,
              color: darkMode ? "#e9ecef" : "#212529",
            }}
          >
            <FaEdit className="me-2 text-warning" />
            {isArabic ? "تعديل بيانات المستخدم" : "Edit User Data"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
          style={{
            background: darkMode ? "#1a1a2e" : "#ffffff",
            maxHeight: "70vh",
            overflowY: "auto",
          }}
        >
          <Form>
            {/* ===== PROFILE PHOTO ===== */}
            <Form.Group className="mb-4 text-center">
              <Form.Label
                className="fw-semibold d-block"
                style={{
                  ...arabicFontStyle,
                  color: darkMode ? "#e9ecef" : "#212529",
                  fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
                }}
              >
                {isArabic ? "الصورة الشخصية" : "Profile Photo"}
              </Form.Label>
              <div className="d-flex flex-column align-items-center gap-2">
                <div
                  style={{
                    width: "clamp(90px, 10vw, 120px)",
                    height: "clamp(90px, 10vw, 120px)",
                    borderRadius: "50%",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: darkMode ? "#2d2d44" : "#f1f3f5",
                    border: `2px dashed ${darkMode ? "#4a9eff" : "#adb5bd"}`,
                    color: darkMode ? "#adb5bd" : "#6c757d",
                  }}
                >
                  {editFormData.profilePhoto ? (
                    <img
                      src={editFormData.profilePhoto}
                      alt="Profile"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <FaUserCircle size={48} />
                  )}
                </div>
                <div className="d-flex gap-2">
                  <Form.Control
                    type="file"
                    accept="image/*"
                    className="d-none"
                    id="edit-user-photo-input"
                    onChange={(e) => {
                      const file = e.target.files && e.target.files[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) =>
                        setEditFormData({
                          ...editFormData,
                          profilePhoto: ev.target.result,
                        });
                      reader.readAsDataURL(file);
                      e.target.value = "";
                    }}
                  />
                  <label
                    htmlFor="edit-user-photo-input"
                    className="btn btn-sm"
                    style={{
                      background: "#4a9eff",
                      color: "#fff",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                  >
                    <FaCamera className="me-1" />
                    {isArabic ? "اختيار صورة" : "Choose Photo"}
                  </label>
                  {editFormData.profilePhoto && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      style={{ borderRadius: "8px", fontWeight: "600" }}
                      onClick={() =>
                        setEditFormData({ ...editFormData, profilePhoto: null })
                      }
                    >
                      <FaTimes className="me-1" />
                      {isArabic ? "إزالة" : "Remove"}
                    </button>
                  )}
                </div>
              </div>
            </Form.Group>

            {/* ===== BASIC INFO ===== */}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label
                    style={{
                      ...arabicFontStyle,
                      color: darkMode ? "#e9ecef" : "#212529",
                      fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
                    }}
                  >
                    {isArabic ? "الاسم الأول" : "First Name"} *
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={editFormData.firstName}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        firstName: e.target.value,
                      })
                    }
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? "#2d2d44" : "white",
                      color: darkMode ? "#e9ecef" : "#212529",
                      borderRadius: "12px",
                      fontSize: "clamp(0.75rem, 0.9vw, 1rem)",
                    }}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label
                    style={{
                      ...arabicFontStyle,
                      color: darkMode ? "#e9ecef" : "#212529",
                      fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
                    }}
                  >
                    {isArabic ? "الاسم الأخير" : "Last Name"} *
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={editFormData.lastName}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        lastName: e.target.value,
                      })
                    }
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? "#2d2d44" : "white",
                      color: darkMode ? "#e9ecef" : "#212529",
                      borderRadius: "12px",
                      fontSize: "clamp(0.75rem, 0.9vw, 1rem)",
                    }}
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* ===== PERSONAL INFO (Date of Birth, Gender, Nationality, City, CIN) ===== */}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label
                    style={{
                      ...arabicFontStyle,
                      color: darkMode ? "#e9ecef" : "#212529",
                      fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
                    }}
                  >
                    <FaBirthdayCake className="me-1" />{" "}
                    {isArabic ? "تاريخ الميلاد" : "Date of Birth"}
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={editFormData.dateOfBirth}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        dateOfBirth: e.target.value,
                      })
                    }
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? "#2d2d44" : "white",
                      color: darkMode ? "#e9ecef" : "#212529",
                      borderRadius: "12px",
                      fontSize: "clamp(0.75rem, 0.9vw, 1rem)",
                    }}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label
                    style={{
                      ...arabicFontStyle,
                      color: darkMode ? "#e9ecef" : "#212529",
                      fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
                    }}
                  >
                    <FaVenusMars className="me-1" />{" "}
                    {isArabic ? "الجنس" : "Gender"}
                  </Form.Label>
                  <Form.Select
                    value={editFormData.gender}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, gender: e.target.value })
                    }
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? "#2d2d44" : "white",
                      color: darkMode ? "#e9ecef" : "#212529",
                      borderRadius: "12px",
                      fontSize: "clamp(0.75rem, 0.9vw, 1rem)",
                    }}
                  >
                    <option value="">
                      {isArabic ? "اختر الجنس" : "Select Gender"}
                    </option>
                    {genderOptions.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label
                    style={{
                      ...arabicFontStyle,
                      color: darkMode ? "#e9ecef" : "#212529",
                      fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
                    }}
                  >
                    <FaGlobe className="me-1" />{" "}
                    {isArabic ? "الجنسية" : "Nationality"}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={editFormData.nationality}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        nationality: e.target.value,
                      })
                    }
                    placeholder={isArabic ? "أدخل الجنسية" : "Enter nationality"}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? "#2d2d44" : "white",
                      color: darkMode ? "#e9ecef" : "#212529",
                      borderRadius: "12px",
                      fontSize: "clamp(0.75rem, 0.9vw, 1rem)",
                    }}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label
                    style={{
                      ...arabicFontStyle,
                      color: darkMode ? "#e9ecef" : "#212529",
                      fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
                    }}
                  >
                    <FaIdBadge className="me-1" />{" "}
                    {isArabic ? "رقم البطاقة الوطنية" : "CIN"}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={editFormData.cin}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, cin: e.target.value })
                    }
                    placeholder={isArabic ? "أدخل رقم البطاقة" : "Enter CIN"}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? "#2d2d44" : "white",
                      color: darkMode ? "#e9ecef" : "#212529",
                      borderRadius: "12px",
                      fontSize: "clamp(0.75rem, 0.9vw, 1rem)",
                    }}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label
                    style={{
                      ...arabicFontStyle,
                      color: darkMode ? "#e9ecef" : "#212529",
                      fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
                    }}
                  >
                    <FaCity className="me-1" />{" "}
                    {isArabic ? "المدينة" : "City"}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={editFormData.city}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, city: e.target.value })
                    }
                    placeholder={isArabic ? "أدخل المدينة" : "Enter city"}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? "#2d2d44" : "white",
                      color: darkMode ? "#e9ecef" : "#212529",
                      borderRadius: "12px",
                      fontSize: "clamp(0.75rem, 0.9vw, 1rem)",
                    }}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label
                    style={{
                      ...arabicFontStyle,
                      color: darkMode ? "#e9ecef" : "#212529",
                      fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
                    }}
                  >
                    <FaEnvelope className="me-1" />{" "}
                    {isArabic ? "البريد الإلكتروني" : "Email"} *
                  </Form.Label>
                  <Form.Control
                    type="email"
                    value={editFormData.email}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, email: e.target.value })
                    }
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? "#2d2d44" : "white",
                      color: darkMode ? "#e9ecef" : "#212529",
                      borderRadius: "12px",
                      fontSize: "clamp(0.75rem, 0.9vw, 1rem)",
                    }}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label
                style={{
                  ...arabicFontStyle,
                  color: darkMode ? "#e9ecef" : "#212529",
                  fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
                }}
              >
                <FaPhone className="me-1" /> {isArabic ? "رقم الهاتف" : "Phone"}
              </Form.Label>
              <Form.Control
                type="tel"
                value={editFormData.phone}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, phone: e.target.value })
                }
                style={{
                  ...arabicFontStyle,
                  background: darkMode ? "#2d2d44" : "white",
                  color: darkMode ? "#e9ecef" : "#212529",
                  borderRadius: "12px",
                  fontSize: "clamp(0.75rem, 0.9vw, 1rem)",
                }}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label
                style={{
                  ...arabicFontStyle,
                  color: darkMode ? "#e9ecef" : "#212529",
                  fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
                }}
              >
                <FaMapMarkerAlt className="me-1" />{" "}
                {isArabic ? "العنوان" : "Address"}
              </Form.Label>
              <Form.Control
                type="text"
                value={editFormData.address}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, address: e.target.value })
                }
                style={{
                  ...arabicFontStyle,
                  background: darkMode ? "#2d2d44" : "white",
                  color: darkMode ? "#e9ecef" : "#212529",
                  borderRadius: "12px",
                  fontSize: "clamp(0.75rem, 0.9vw, 1rem)",
                }}
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label
                    style={{
                      ...arabicFontStyle,
                      color: darkMode ? "#e9ecef" : "#212529",
                      fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
                    }}
                  >
                    {isArabic ? "الدور" : "Role"}
                  </Form.Label>
                  <Form.Select
                    value={editFormData.role}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, role: e.target.value })
                    }
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? "#2d2d44" : "white",
                      color: darkMode ? "#e9ecef" : "#212529",
                      borderRadius: "12px",
                      fontSize: "clamp(0.75rem, 0.9vw, 1rem)",
                    }}
                  >
                    {roleOptions.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label
                    style={{
                      ...arabicFontStyle,
                      color: darkMode ? "#e9ecef" : "#212529",
                      fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
                    }}
                  >
                    {isArabic ? "الحالة" : "Status"}
                  </Form.Label>
                  <Form.Select
                    value={editFormData.status}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        status: e.target.value,
                      })
                    }
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? "#2d2d44" : "white",
                      color: darkMode ? "#e9ecef" : "#212529",
                      borderRadius: "12px",
                      fontSize: "clamp(0.75rem, 0.9vw, 1rem)",
                    }}
                  >
                    {statusOptions.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            {/* ===== EMERGENCY CONTACT (for all) ===== */}
            <div className="section-divider mt-3">
              <span className="section-divider-label">
                <FaPhoneAlt className="me-2" />{" "}
                {isArabic ? "جهة اتصال طارئة" : "Emergency Contact"}
              </span>
            </div>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label
                    style={{
                      ...arabicFontStyle,
                      color: darkMode ? "#e9ecef" : "#212529",
                      fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
                    }}
                  >
                    <FaUserCircle className="me-1" />{" "}
                    {isArabic ? "الاسم" : "Name"}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={editFormData.emergencyContactName}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        emergencyContactName: e.target.value,
                      })
                    }
                    placeholder={isArabic ? "الاسم" : "Name"}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? "#2d2d44" : "white",
                      color: darkMode ? "#e9ecef" : "#212529",
                      borderRadius: "12px",
                      fontSize: "clamp(0.75rem, 0.9vw, 1rem)",
                    }}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label
                    style={{
                      ...arabicFontStyle,
                      color: darkMode ? "#e9ecef" : "#212529",
                      fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
                    }}
                  >
                    <FaHandshake className="me-1" />{" "}
                    {isArabic ? "العلاقة" : "Relationship"}
                  </Form.Label>
                  <Form.Select
                    value={editFormData.emergencyContactRelationship}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        emergencyContactRelationship: e.target.value,
                      })
                    }
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? "#2d2d44" : "white",
                      color: darkMode ? "#e9ecef" : "#212529",
                      borderRadius: "12px",
                      fontSize: "clamp(0.75rem, 0.9vw, 1rem)",
                    }}
                  >
                    <option value="">
                      {isArabic ? "اختر العلاقة" : "Select Relationship"}
                    </option>
                    {relationshipOptions.map((rel) => (
                      <option key={rel.value} value={rel.value}>
                        {rel.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label
                    style={{
                      ...arabicFontStyle,
                      color: darkMode ? "#e9ecef" : "#212529",
                      fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
                    }}
                  >
                    <FaPhone className="me-1" />{" "}
                    {isArabic ? "رقم الهاتف" : "Phone"}
                  </Form.Label>
                  <Form.Control
                    type="tel"
                    value={editFormData.emergencyContactPhone}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        emergencyContactPhone: e.target.value,
                      })
                    }
                    placeholder={isArabic ? "رقم الهاتف" : "Phone"}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? "#2d2d44" : "white",
                      color: darkMode ? "#e9ecef" : "#212529",
                      borderRadius: "12px",
                      fontSize: "clamp(0.75rem, 0.9vw, 1rem)",
                    }}
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* ===== TEACHER-SPECIFIC FIELDS ===== */}
            {editFormData.role === "teacher" && (
              <>
                <div className="section-divider mt-3">
                  <span className="section-divider-label">
                    <FaChalkboardTeacher className="me-2" />{" "}
                    {isArabic ? "المعلومات المهنية" : "Professional Info"}
                  </span>
                </div>

                <Form.Group className="mb-3">
                  <Form.Label
                    style={{
                      ...arabicFontStyle,
                      color: darkMode ? "#e9ecef" : "#212529",
                      fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
                    }}
                  >
                    <FaSchool className="me-1" />{" "}
                    {isArabic ? "المستوى التعليمي" : "Education Level"}
                  </Form.Label>
                  <Form.Select
                    value={editFormData.level}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, level: e.target.value })
                    }
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? "#2d2d44" : "white",
                      color: darkMode ? "#e9ecef" : "#212529",
                      borderRadius: "12px",
                      fontSize: "clamp(0.75rem, 0.9vw, 1rem)",
                    }}
                  >
                    <option value="">
                      {isArabic ? "اختر المستوى" : "Select Level"}
                    </option>
                    {levelCategories.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label
                    style={{
                      ...arabicFontStyle,
                      color: darkMode ? "#e9ecef" : "#212529",
                      fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
                    }}
                  >
                    <FaBook className="me-1" />{" "}
                    {isArabic ? "المواد" : "Subjects"}
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={editFormData.subjects?.join(", ") || ""}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        subjects: e.target.value.split(",").map(s => s.trim()).filter(Boolean),
                      })
                    }
                    placeholder={isArabic ? "افصل المواد بفواصل" : "Separate subjects with commas"}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? "#2d2d44" : "white",
                      color: darkMode ? "#e9ecef" : "#212529",
                      borderRadius: "12px",
                      fontSize: "clamp(0.75rem, 0.9vw, 1rem)",
                    }}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label
                    style={{
                      ...arabicFontStyle,
                      color: darkMode ? "#e9ecef" : "#212529",
                      fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
                    }}
                  >
                    <FaGraduationCap className="me-1" />{" "}
                    {isArabic ? "المؤهلات" : "Qualifications"}
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={editFormData.qualifications?.join(", ") || ""}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        qualifications: e.target.value.split(",").map(q => q.trim()).filter(Boolean),
                      })
                    }
                    placeholder={isArabic ? "افصل المؤهلات بفواصل" : "Separate qualifications with commas"}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? "#2d2d44" : "white",
                      color: darkMode ? "#e9ecef" : "#212529",
                      borderRadius: "12px",
                      fontSize: "clamp(0.75rem, 0.9vw, 1rem)",
                    }}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label
                    style={{
                      ...arabicFontStyle,
                      color: darkMode ? "#e9ecef" : "#212529",
                      fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
                    }}
                  >
                    <FaBriefcase className="me-1" />{" "}
                    {isArabic ? "التخصص" : "Specialization"}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={editFormData.specialization}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        specialization: e.target.value,
                      })
                    }
                    placeholder={isArabic ? "أدخل التخصص" : "Enter specialization"}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? "#2d2d44" : "white",
                      color: darkMode ? "#e9ecef" : "#212529",
                      borderRadius: "12px",
                      fontSize: "clamp(0.75rem, 0.9vw, 1rem)",
                    }}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label
                    style={{
                      ...arabicFontStyle,
                      color: darkMode ? "#e9ecef" : "#212529",
                      fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
                    }}
                  >
                    <FaClock className="me-1" />{" "}
                    {isArabic ? "سنوات الخبرة" : "Experience (years)"}
                  </Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    max="50"
                    value={editFormData.experienceYears}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        experienceYears: e.target.value,
                      })
                    }
                    placeholder={isArabic ? "سنوات الخبرة" : "Years of experience"}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? "#2d2d44" : "white",
                      color: darkMode ? "#e9ecef" : "#212529",
                      borderRadius: "12px",
                      fontSize: "clamp(0.75rem, 0.9vw, 1rem)",
                    }}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label
                    style={{
                      ...arabicFontStyle,
                      color: darkMode ? "#e9ecef" : "#212529",
                      fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
                    }}
                  >
                    <FaBriefcase className="me-1" />{" "}
                    {isArabic ? "نوع التوظيف" : "Employment Type"}
                  </Form.Label>
                  <Form.Select
                    value={editFormData.employmentType}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        employmentType: e.target.value,
                      })
                    }
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? "#2d2d44" : "white",
                      color: darkMode ? "#e9ecef" : "#212529",
                      borderRadius: "12px",
                      fontSize: "clamp(0.75rem, 0.9vw, 1rem)",
                    }}
                  >
                    <option value="">
                      {isArabic ? "اختر نوع التوظيف" : "Select Employment Type"}
                    </option>
                    {employmentTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label
                    style={{
                      ...arabicFontStyle,
                      color: darkMode ? "#e9ecef" : "#212529",
                      fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
                    }}
                  >
                    <FaBuilding className="me-1" />{" "}
                    {isArabic ? "المدرسة السابقة" : "Previous School"}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={editFormData.previousSchool}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        previousSchool: e.target.value,
                      })
                    }
                    placeholder={isArabic ? "المدرسة السابقة" : "Previous school"}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? "#2d2d44" : "white",
                      color: darkMode ? "#e9ecef" : "#212529",
                      borderRadius: "12px",
                      fontSize: "clamp(0.75rem, 0.9vw, 1rem)",
                    }}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label
                    style={{
                      ...arabicFontStyle,
                      color: darkMode ? "#e9ecef" : "#212529",
                      fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
                    }}
                  >
                    <FaBuilding className="me-1" />{" "}
                    {isArabic ? "الفصول المكلف بها" : "Assigned Classes"}
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={editFormData.assignedClasses?.join(", ") || ""}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        assignedClasses: e.target.value.split(",").map(c => c.trim()).filter(Boolean),
                      })
                    }
                    placeholder={isArabic ? "افصل الفصول بفواصل" : "Separate classes with commas"}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? "#2d2d44" : "white",
                      color: darkMode ? "#e9ecef" : "#212529",
                      borderRadius: "12px",
                      fontSize: "clamp(0.75rem, 0.9vw, 1rem)",
                    }}
                  />
                  <Form.Text className="text-muted" style={arabicFontStyle}>
                    {isArabic
                      ? "أدخل معرفات الفصول مفصولة بفواصل (مثال: primary_1a, primary_1b)"
                      : "Enter class IDs separated by commas (e.g., primary_1a, primary_1b)"}
                  </Form.Text>
                </Form.Group>
              </>
            )}

            {/* ===== PARENT-SPECIFIC FIELDS ===== */}
            {editFormData.role === "parent" && (
              <>
                <div className="section-divider mt-3">
                  <span className="section-divider-label">
                    <FaUsers className="me-2" />{" "}
                    {isArabic ? "معلومات إضافية" : "Additional Info"}
                  </span>
                </div>

                <Form.Group className="mb-3">
                  <Form.Label
                    style={{
                      ...arabicFontStyle,
                      color: darkMode ? "#e9ecef" : "#212529",
                      fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
                    }}
                  >
                    <FaChild className="me-1" />{" "}
                    {isArabic ? "أسماء الأطفال" : "Children Names"}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={editFormData.childrenNames}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        childrenNames: e.target.value,
                      })
                    }
                    placeholder={isArabic ? "أسماء الأطفال مفصولة بفواصل" : "Children names separated by commas"}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? "#2d2d44" : "white",
                      color: darkMode ? "#e9ecef" : "#212529",
                      borderRadius: "12px",
                      fontSize: "clamp(0.75rem, 0.9vw, 1rem)",
                    }}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label
                    style={{
                      ...arabicFontStyle,
                      color: darkMode ? "#e9ecef" : "#212529",
                      fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
                    }}
                  >
                    <FaBriefcase className="me-1" />{" "}
                    {isArabic ? "المهنة" : "Occupation"}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={editFormData.occupation}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        occupation: e.target.value,
                      })
                    }
                    placeholder={isArabic ? "أدخل المهنة" : "Enter occupation"}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? "#2d2d44" : "white",
                      color: darkMode ? "#e9ecef" : "#212529",
                      borderRadius: "12px",
                      fontSize: "clamp(0.75rem, 0.9vw, 1rem)",
                    }}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label
                    style={{
                      ...arabicFontStyle,
                      color: darkMode ? "#e9ecef" : "#212529",
                      fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
                    }}
                  >
                    <FaBuilding className="me-1" />{" "}
                    {isArabic ? "جهة العمل" : "Employer"}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={editFormData.employer}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        employer: e.target.value,
                      })
                    }
                    placeholder={isArabic ? "أدخل جهة العمل" : "Enter employer"}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? "#2d2d44" : "white",
                      color: darkMode ? "#e9ecef" : "#212529",
                      borderRadius: "12px",
                      fontSize: "clamp(0.75rem, 0.9vw, 1rem)",
                    }}
                  />
                </Form.Group>
              </>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer
          style={{
            borderTop: darkMode ? "1px solid #2d2d44" : "1px solid #e9ecef",
          }}
        >
          <Button
            variant="secondary"
            onClick={() => setShowEditModal(false)}
            disabled={processingAction}
            style={{
              ...arabicFontStyle,
              borderRadius: "12px",
              fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
            }}
          >
            {isArabic ? "إلغاء" : "Cancel"}
          </Button>
          <Button
            variant="warning"
            onClick={handleSaveEdit}
            disabled={processingAction}
            style={{
              ...arabicFontStyle,
              borderRadius: "12px",
              fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
            }}
          >
            {processingAction ? (
              <>
                <FaSpinner className="spinning me-2" />{" "}
                {isArabic ? "جاري..." : "Saving..."}
              </>
            ) : (
              <>
                <FaSave className="me-2" />{" "}
                {isArabic ? "حفظ التغييرات" : "Save Changes"}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===== DELETE CONFIRMATION MODAL ===== */}
      <Modal
        show={showDeleteConfirm}
        onHide={() => setShowDeleteConfirm(false)}
        centered
        className="modern-modal"
      >
        <Modal.Header
          closeButton
          style={{
            borderBottom: darkMode ? "1px solid #2d2d44" : "1px solid #e9ecef",
          }}
        >
          <Modal.Title
            style={{
              ...arabicFontStyle,
              color: darkMode ? "#e9ecef" : "#212529",
            }}
          >
            <FaExclamationTriangle className="me-2 text-danger" />
            {isArabic ? "تأكيد الحذف" : "Confirm Delete"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? "#1a1a2e" : "#ffffff" }}>
          <p
            style={{
              ...arabicFontStyle,
              color: darkMode ? "#e9ecef" : "#212529",
            }}
          >
            {isArabic
              ? `هل أنت متأكد من حذف المستخدم "${selectedUser?.firstName ? `${selectedUser.firstName} ${selectedUser.lastName || ""}`.trim() : selectedUser?.name}"؟ هذا الإجراء لا يمكن التراجع عنه.`
              : `Are you sure you want to delete user "${selectedUser?.firstName ? `${selectedUser.firstName} ${selectedUser.lastName || ""}`.trim() : selectedUser?.name}"? This action cannot be undone.`}
          </p>
          {selectedUser?.role === "admin" && (
            <Alert variant="danger" style={arabicFontStyle}>
              <FaExclamationTriangle className="me-2" />
              {isArabic
                ? "تحذير: هذا المستخدم هو مدير. حذفه قد يؤثر على النظام."
                : "Warning: This user is an admin. Deleting may affect the system."}
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer
          style={{
            borderTop: darkMode ? "1px solid #2d2d44" : "1px solid #e9ecef",
          }}
        >
          <Button
            variant="secondary"
            onClick={() => setShowDeleteConfirm(false)}
            disabled={processingAction}
            style={{
              ...arabicFontStyle,
              borderRadius: "12px",
              fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
            }}
          >
            {isArabic ? "إلغاء" : "Cancel"}
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteUser}
            disabled={processingAction}
            style={{
              ...arabicFontStyle,
              borderRadius: "12px",
              fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
            }}
          >
            {processingAction ? (
              <>
                <FaSpinner className="spinning me-2" />{" "}
                {isArabic ? "جاري..." : "Deleting..."}
              </>
            ) : (
              <>
                <FaTrash className="me-2" />{" "}
                {isArabic ? "تأكيد الحذف" : "Confirm Delete"}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===== RESET PASSWORD MODAL ===== */}
      <Modal
        show={showResetPasswordModal}
        onHide={() => setShowResetPasswordModal(false)}
        centered
        className="modern-modal"
      >
        <Modal.Header
          closeButton
          style={{
            borderBottom: darkMode ? "1px solid #2d2d44" : "1px solid #e9ecef",
          }}
        >
          <Modal.Title
            style={{
              ...arabicFontStyle,
              color: darkMode ? "#e9ecef" : "#212529",
            }}
          >
            <FaSync className="me-2 text-info" />
            {isArabic ? "إعادة تعيين كلمة المرور" : "Reset Password"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? "#1a1a2e" : "#ffffff" }}>
          <p
            style={{
              ...arabicFontStyle,
              color: darkMode ? "#e9ecef" : "#212529",
            }}
          >
            {isArabic
              ? `سيتم إعادة تعيين كلمة المرور للمستخدم "${selectedUser?.firstName ? `${selectedUser.firstName} ${selectedUser.lastName || ""}`.trim() : selectedUser?.name}" إلى "password123"`
              : `The password for user "${selectedUser?.firstName ? `${selectedUser.firstName} ${selectedUser.lastName || ""}`.trim() : selectedUser?.name}" will be reset to "password123"`}
          </p>
        </Modal.Body>
        <Modal.Footer
          style={{
            borderTop: darkMode ? "1px solid #2d2d44" : "1px solid #e9ecef",
          }}
        >
          <Button
            variant="secondary"
            onClick={() => setShowResetPasswordModal(false)}
            disabled={processingAction}
            style={{
              ...arabicFontStyle,
              borderRadius: "12px",
              fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
            }}
          >
            {isArabic ? "إلغاء" : "Cancel"}
          </Button>
          <Button
            variant="info"
            onClick={handleResetPassword}
            disabled={processingAction}
            style={{
              ...arabicFontStyle,
              color: "white",
              borderRadius: "12px",
              fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
            }}
          >
            {processingAction ? (
              <>
                <FaSpinner className="spinning me-2" />{" "}
                {isArabic ? "جاري..." : "Processing..."}
              </>
            ) : (
              <>
                <FaSync className="me-2" />{" "}
                {isArabic ? "تأكيد إعادة التعيين" : "Confirm Reset"}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===== RESEND INVITE MODAL ===== */}
      <Modal
        show={showResendInviteModal}
        onHide={() => setShowResendInviteModal(false)}
        centered
        className="modern-modal"
      >
        <Modal.Header
          closeButton
          style={{
            borderBottom: darkMode ? "1px solid #2d2d44" : "1px solid #e9ecef",
          }}
        >
          <Modal.Title
            style={{
              ...arabicFontStyle,
              color: darkMode ? "#e9ecef" : "#212529",
            }}
          >
            <FaPaperPlane className="me-2 text-info" />
            {isArabic ? "إعادة إرسال الدعوة" : "Resend Invitation"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? "#1a1a2e" : "#ffffff" }}>
          <p
            style={{
              ...arabicFontStyle,
              color: darkMode ? "#e9ecef" : "#212529",
            }}
          >
            {isArabic
              ? `سيتم إعادة إرسال دعوة التفعيل إلى ${selectedUser?.email}`
              : `The activation invitation will be resent to ${selectedUser?.email}`}
          </p>
          <div
            className="p-3 rounded-3"
            style={{
              background: darkMode ? "#2d2d44" : "#f8f9fa",
              borderRadius: "12px",
            }}
          >
            <div className="d-flex align-items-center gap-3">
              <div
                className="user-avatar-sm"
                style={{
                  background: `linear-gradient(135deg, ${getRoleColor(selectedUser?.role)}, ${getRoleColor(selectedUser?.role)}cc)`,
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: "700",
                  fontSize: "0.9rem",
                  flexShrink: 0,
                }}
              >
                {(selectedUser?.firstName || selectedUser?.name || "U")
                  .charAt(0)
                  .toUpperCase()}
              </div>
              <div>
                <div
                  className="fw-semibold"
                  style={{ color: darkMode ? "#e9ecef" : "#212529" }}
                >
                  {selectedUser?.firstName
                    ? `${selectedUser.firstName} ${selectedUser.lastName || ""}`.trim()
                    : selectedUser?.name}
                </div>
                <div className="text-muted small" style={arabicFontStyle}>
                  <FaEnvelope className="me-1" size={12} />{" "}
                  {selectedUser?.email}
                </div>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer
          style={{
            borderTop: darkMode ? "1px solid #2d2d44" : "1px solid #e9ecef",
          }}
        >
          <Button
            variant="secondary"
            onClick={() => setShowResendInviteModal(false)}
            disabled={processingAction}
            style={{
              ...arabicFontStyle,
              borderRadius: "12px",
              fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
            }}
          >
            {isArabic ? "إلغاء" : "Cancel"}
          </Button>
          <Button
            variant="info"
            onClick={handleResendInvite}
            disabled={processingAction}
            style={{
              ...arabicFontStyle,
              color: "white",
              borderRadius: "12px",
              fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
            }}
          >
            {processingAction ? (
              <>
                <FaSpinner className="spinning me-2" />{" "}
                {isArabic ? "جاري..." : "Sending..."}
              </>
            ) : (
              <>
                <FaPaperPlane className="me-2" />{" "}
                {isArabic ? "إعادة إرسال" : "Resend"}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===== BULK ACTION MODAL ===== */}
      <Modal
        show={showBulkActionModal}
        onHide={() => setShowBulkActionModal(false)}
        centered
        className="modern-modal"
      >
        <Modal.Header
          closeButton
          style={{
            borderBottom: darkMode ? "1px solid #2d2d44" : "1px solid #e9ecef",
          }}
        >
          <Modal.Title
            style={{
              ...arabicFontStyle,
              color: darkMode ? "#e9ecef" : "#212529",
            }}
          >
            <FaMailBulk className="me-2 text-primary" />
            {isArabic ? "إجراءات متعددة" : "Bulk Actions"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? "#1a1a2e" : "#ffffff" }}>
          <p
            style={{
              ...arabicFontStyle,
              color: darkMode ? "#e9ecef" : "#212529",
            }}
          >
            {isArabic
              ? `تم اختيار ${formatNumber(selectedUsers.length)} مستخدم. اختر الإجراء الذي تريد تنفيذه:`
              : `${formatNumber(selectedUsers.length)} users selected. Choose an action to perform:`}
          </p>
          <Form.Group>
            <Form.Select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              style={{
                ...arabicFontStyle,
                background: darkMode ? "#2d2d44" : "white",
                color: darkMode ? "#e9ecef" : "#212529",
                borderRadius: "12px",
                fontSize: "clamp(0.75rem, 0.9vw, 1rem)",
              }}
            >
              <option value="">
                {isArabic ? "اختر إجراء..." : "Select action..."}
              </option>
              <option value="activate">
                {isArabic ? "تفعيل" : "Activate"}
              </option>
              <option value="deactivate">
                {isArabic ? "تعطيل" : "Deactivate"}
              </option>
              <option value="suspend">{isArabic ? "تعليق" : "Suspend"}</option>
              <option value="delete">{isArabic ? "حذف" : "Delete"}</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer
          style={{
            borderTop: darkMode ? "1px solid #2d2d44" : "1px solid #e9ecef",
          }}
        >
          <Button
            variant="secondary"
            onClick={() => setShowBulkActionModal(false)}
            disabled={processingAction}
            style={{
              ...arabicFontStyle,
              borderRadius: "12px",
              fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
            }}
          >
            {isArabic ? "إلغاء" : "Cancel"}
          </Button>
          <Button
            variant="primary"
            onClick={handleBulkAction}
            disabled={processingAction || !bulkAction}
            style={{
              ...arabicFontStyle,
              borderRadius: "12px",
              fontSize: "clamp(0.7rem, 0.9vw, 0.9rem)",
            }}
          >
            {processingAction ? (
              <>
                <FaSpinner className="spinning me-2" />{" "}
                {isArabic ? "جاري..." : "Processing..."}
              </>
            ) : (
              <>
                <FaCheck className="me-2" /> {isArabic ? "تنفيذ" : "Execute"}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Print Styles */}
      <style>{`
        @media print {
          .users-management .page-header .btn,
          .users-management .stats-card-enhanced,
          .users-management .role-stat-enhanced,
          .users-management .modern-card .card-footer,
          .users-management .modern-card thead,
          .users-management .modern-card tbody tr td:last-child,
          .users-management .modern-card tbody tr td:first-child,
          .users-management .modern-card .form-check,
          .users-management .page-header .d-flex.gap-2,
          .users-management .modern-card .text-muted.small,
          .users-management .pagination {
            display: none !important;
          }
          .users-management .modern-card {
            border: none !important;
            box-shadow: none !important;
          }
          .users-management .modern-card tbody tr {
            page-break-inside: avoid;
          }
          .users-management .modern-card .table {
            width: 100% !important;
          }
          .users-management .modern-card .table td,
          .users-management .modern-card .table th {
            padding: 8px !important;
          }
          .users-management .page-header h4 {
            font-size: 18px !important;
          }
          .users-management .modern-card .table th {
            background: #f8f9fa !important;
            color: #212529 !important;
          }
          .users-management .modern-card .table td {
            color: #212529 !important;
          }
          .users-management .modern-card .badge {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>

      <style>{`
        /* ===== RESPONSIVE ACTION BUTTONS ===== */
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

        /* ===== RESPONSIVE TABLE ===== */
        @media (max-width: 1200px) {
          .users-management .table-responsive {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
        }

        @media (max-width: 768px) {
          .users-management .table td,
          .users-management .table th {
            padding: 4px 3px !important;
          }
          .users-management .table td .fw-semibold {
            font-size: 0.6rem !important;
          }
          .users-management .table td small {
            font-size: 0.45rem !important;
            max-width: 60px !important;
          }
          .users-management .table .badge {
            font-size: 0.4rem !important;
            padding: 2px 4px !important;
          }
          .users-management .table .badge svg {
            font-size: 6px !important;
          }
          .users-management .stats-card-enhanced .p-2 {
            padding: 4px !important;
          }
          .users-management .stats-card-enhanced h2 {
            font-size: 0.9rem !important;
          }
          .users-management .stats-card-enhanced p {
            font-size: 0.45rem !important;
          }
          .users-management .stats-card-enhanced .stats-icon-wrapper {
            padding: 4px !important;
          }
          .users-management .stats-card-enhanced .stats-icon-wrapper svg {
            font-size: 14px !important;
          }
          .users-management .role-stat-enhanced {
            padding: 8px 12px !important;
          }
          .users-management .role-stat-enhanced .role-icon-wrapper {
            font-size: 1.2rem !important;
          }
          .users-management .role-stat-enhanced .fw-bold {
            font-size: 1rem !important;
          }
          .user-grid-card .p-3 {
            padding: 12px !important;
          }
        }

        @media (max-width: 576px) {
          .users-management .page-header {
            flex-direction: column;
            align-items: stretch !important;
          }
          .users-management .page-header .d-flex {
            flex-wrap: wrap;
            gap: 3px !important;
          }
          .users-management .page-header .btn {
            font-size: 0.55rem !important;
            padding: 3px 6px !important;
          }
          .users-management .page-header h4 {
            font-size: 0.85rem !important;
          }
          .users-management .page-header p {
            font-size: 0.6rem !important;
          }
          .users-management .modern-card .p-2 {
            padding: 4px !important;
          }
          .users-management .modern-card .g-1 {
            gap: 2px !important;
          }
          .users-management .modern-card .col-md-3,
          .users-management .modern-card .col-md-2 {
            padding: 0 2px !important;
          }
          .users-management .modern-card .form-select,
          .users-management .modern-card .form-control {
            font-size: 0.55rem !important;
            padding: 3px 4px !important;
          }
          .users-management .modern-card .btn {
            font-size: 0.55rem !important;
            padding: 3px 4px !important;
          }
          .users-management .modern-card .input-group-text {
            padding: 3px 6px !important;
          }
          .users-management .modern-card .input-group-text svg {
            font-size: 10px !important;
          }
          .users-management .stats-card-enhanced {
            min-height: 60px !important;
          }
          .users-management .stats-card-enhanced .stats-icon-wrapper svg {
            width: 14px !important;
            height: 14px !important;
          }
          .users-management .role-stat-enhanced {
            padding: 6px 8px !important;
          }
          .users-management .role-stat-enhanced .role-icon-wrapper {
            font-size: 1rem !important;
          }
          .users-management .role-stat-enhanced .fw-bold {
            font-size: 0.85rem !important;
          }
          .users-management .role-stat-enhanced .text-muted {
            font-size: 0.45rem !important;
          }
          .user-grid-card .p-3 {
            padding: 8px !important;
          }
          .user-grid-card h5 {
            font-size: 0.85rem !important;
          }
          .user-grid-card .user-avatar-lg {
            width: 50px !important;
            height: 50px !important;
            font-size: 1.2rem !important;
          }
        }

        /* ===== RESPONSIVE PAGINATION ===== */
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
          .users-management .modern-card .card-footer {
            flex-direction: column;
            align-items: center !important;
            gap: 4px !important;
          }
        }

        /* ===== STATS CARDS ENHANCED ===== */
        .stats-card-enhanced {
          transition: all 0.3s ease;
        }
        
        .stats-card-enhanced .stats-icon-wrapper {
          transition: all 0.3s ease;
        }
        
        .stats-card-enhanced:hover .stats-icon-wrapper {
          transform: scale(1.1);
        }

        .role-stat-enhanced {
          transition: all 0.3s ease;
        }
        
        .role-stat-enhanced .role-icon-wrapper {
          transition: transform 0.3s ease;
        }
        
        .role-stat-enhanced:hover .role-icon-wrapper {
          transform: scale(1.15);
        }

        .users-management .modern-card {
          border-radius: 16px;
          border: none;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          transition: all 0.3s;
        }
        
        .users-management .spinning {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .users-management .user-avatar-sm {
          transition: transform 0.3s ease;
        }

        .users-management .user-avatar-sm:hover {
          transform: scale(1.15);
        }

        .users-management .user-avatar-lg {
          transition: transform 0.3s ease;
        }

        .users-management .user-avatar-lg:hover {
          transform: scale(1.05);
        }

        .users-management .modern-modal .modal-content {
          border-radius: 20px !important;
          border: none !important;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
          overflow: hidden;
        }

        .users-management .role-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        .users-management .role-card:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 8px 30px rgba(0,0,0,0.12);
        }

        .users-management .role-card.active {
          box-shadow: 0 8px 30px rgba(0,0,0,0.15);
        }

        .users-management .form-tab {
          transition: all 0.3s ease;
        }

        .users-management .form-tab:hover {
          color: #4a9eff !important;
        }

        .users-management .fade-in {
          animation: fadeIn 0.4s ease forwards;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .users-management .section-divider {
          display: flex;
          align-items: center;
          margin: 24px 0 20px;
        }

        .users-management .section-divider::before {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(to right, transparent, ${darkMode ? "#2d2d44" : "#e9ecef"});
        }

        .users-management .section-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(to left, transparent, ${darkMode ? "#2d2d44" : "#e9ecef"});
        }

        .users-management .section-divider-label {
          padding: 0 16px;
          font-weight: 600;
          font-size: clamp(0.75rem, 0.9vw, 0.95rem);
          color: ${darkMode ? "#adb5bd" : "#6c757d"};
          white-space: nowrap;
        }

        .users-management .subjects-grid,
        .users-management .qualifications-grid,
        .users-management .classes-grid {
          transition: all 0.3s ease;
        }

        .users-management .subjects-grid .form-check,
        .users-management .qualifications-grid .form-check,
        .users-management .classes-grid .form-check {
          padding: 6px 12px;
          border-radius: 8px;
          transition: background 0.2s ease;
        }

        .users-management .subjects-grid .form-check:hover,
        .users-management .qualifications-grid .form-check:hover,
        .users-management .classes-grid .form-check:hover {
          background: rgba(74, 158, 255, 0.05);
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
        [dir="rtl"] .section-divider-label .me-2 {
          margin-right: 0 !important;
          margin-left: 0.5rem !important;
        }

        /* ===== RTL CHECKBOX SPACING FIX ===== */
        [dir="rtl"] .subject-check,
        [dir="rtl"] .qual-check,
        [dir="rtl"] .class-check {
          padding-left: 0 !important;
          padding-right: 1.5rem !important;
        }

        [dir="rtl"] .subject-check .form-check-input,
        [dir="rtl"] .qual-check .form-check-input,
        [dir="rtl"] .class-check .form-check-input {
          margin-left: 0 !important;
          margin-right: -1.5rem !important;
        }

        [dir="rtl"] .subject-check .form-check-label,
        [dir="rtl"] .qual-check .form-check-label,
        [dir="rtl"] .class-check .form-check-label {
          padding-left: 0 !important;
          padding-right: 0.5rem !important;
        }

        [dir="rtl"] .subjects-grid .form-check,
        [dir="rtl"] .qualifications-grid .form-check,
        [dir="rtl"] .classes-grid .form-check {
          padding-left: 0 !important;
          padding-right: 1.5rem !important;
        }

        /* ===== RTL CHECKBOX FORCE LTR OVERRIDE ===== */
        /* Force all checkbox grid containers to LTR */
        [dir="rtl"] .subjects-grid,
        [dir="rtl"] .qualifications-grid,
        [dir="rtl"] .classes-grid {
          direction: ltr !important;
          text-align: left !important;
        }

        /* Force individual checkbox items to LTR */
        [dir="rtl"] .subjects-grid .form-check,
        [dir="rtl"] .qualifications-grid .form-check,
        [dir="rtl"] .classes-grid .form-check,
        [dir="rtl"] .subject-check,
        [dir="rtl"] .qual-check,
        [dir="rtl"] .class-check {
          direction: ltr !important;
          text-align: left !important;
          padding-left: 1.5rem !important;
          padding-right: 0 !important;
        }

        /* Keep checkbox input on the left */
        [dir="rtl"] .subjects-grid .form-check-input,
        [dir="rtl"] .qualifications-grid .form-check-input,
        [dir="rtl"] .classes-grid .form-check-input,
        [dir="rtl"] .subject-check .form-check-input,
        [dir="rtl"] .qual-check .form-check-input,
        [dir="rtl"] .class-check .form-check-input {
          margin-left: -1.5rem !important;
          margin-right: 0 !important;
          float: left !important;
        }

        /* Keep Arabic label text right-aligned with proper spacing */
        [dir="rtl"] .subjects-grid .form-check-label,
        [dir="rtl"] .qualifications-grid .form-check-label,
        [dir="rtl"] .classes-grid .form-check-label,
        [dir="rtl"] .subject-check .form-check-label,
        [dir="rtl"] .qual-check .form-check-label,
        [dir="rtl"] .class-check .form-check-label {
          padding-left: 0 !important;
          padding-right: 0.5rem !important;
          text-align: right !important;
          display: inline-block !important;
        }
      `}</style>
    </div>
  );
};

export default UsersManagement;