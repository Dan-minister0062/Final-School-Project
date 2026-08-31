// src/components/dashboard/admin/ParentsManagement.jsx
import React, { useState, useEffect } from "react";
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
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import {
  FaUsers,
  FaSearch,
  FaFilter,
  FaEye,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaChild,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaSync,
  FaDownload,
  FaPrint,
  FaExclamationTriangle,
  FaSpinner,
  FaUserTie,
  FaCalendarAlt,
  FaIdCard,
  FaUserCircle,
  FaBirthdayCake,
  FaVenusMars,
  FaGlobe,
  FaIdBadge,
  FaCity,
  FaBriefcase,
  FaBuilding,
  FaPhoneAlt,
  FaHandshake,
  FaStar,
  FaAward,
  FaRocket,
  FaTimes as FaTimesIcon,
  FaUserPlus,
  FaUserGraduate,
  FaSchool,
  FaGraduationCap,
  FaEdit,
  FaTrash,
  FaPlus,
  FaSave,
  FaUser,
  FaLock,
  FaUnlock,
} from "react-icons/fa";
import { useLanguage } from "../../../context/LanguageContext";
import { useAuth } from "../../../hooks/useAuth";
import { useNotification } from "../../../hooks/useNotification";
import userDataService from "../../../services/userDataService";
import { format, formatDistanceToNow, isValid } from "date-fns";
import { ar, enUS } from "date-fns/locale";

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
  if (num === undefined || num === null) return "0";
  return num.toString();
};

const ParentsManagement = () => {
  const { isArabic } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notify } = useNotification();

  // State
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalParents, setTotalParents] = useState(0);
  const [selectedParent, setSelectedParent] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const locale = isArabic ? ar : enUS;

  // ===== GENDER OPTIONS =====
  const genderOptions = [
    { value: "male", label: isArabic ? "ذكر" : "Male" },
    { value: "female", label: isArabic ? "أنثى" : "Female" },
    { value: "other", label: isArabic ? "أخرى" : "Other" },
  ];

  // ===== LEVEL CATEGORIES =====
  const levelCategories = [
    { value: "kindergarten", label: isArabic ? "أولي" : "Kindergarten", color: "#f39c12" },
    { value: "primary", label: isArabic ? "ابتدائي" : "Primary", color: "#3498db" },
    { value: "secondary", label: isArabic ? "إعدادي" : "Secondary", color: "#2ecc71" },
    { value: "high_school", label: isArabic ? "ثانوي" : "High School", color: "#9b59b6" }
  ];

  // ===== EMERGENCY CONTACT RELATIONSHIP OPTIONS =====
  const relationshipOptions = [
    { value: "father", label: isArabic ? "أب" : "Father" },
    { value: "mother", label: isArabic ? "أم" : "Mother" },
    { value: "brother", label: isArabic ? "أخ" : "Brother" },
    { value: "sister", label: isArabic ? "أخت" : "Sister" },
    { value: "guardian", label: isArabic ? "ولي أمر" : "Guardian" },
    { value: "uncle", label: isArabic ? "عم/خال" : "Uncle" },
    { value: "aunt", label: isArabic ? "عمة/خالة" : "Aunt" },
    { value: "grandfather", label: isArabic ? "جد" : "Grandfather" },
    { value: "grandmother", label: isArabic ? "جدة" : "Grandmother" },
    { value: "cousin", label: isArabic ? "ابن عم/خال" : "Cousin" },
    { value: "friend", label: isArabic ? "صديق" : "Friend" },
    { value: "neighbor", label: isArabic ? "جار" : "Neighbor" },
    { value: "other", label: isArabic ? "أخرى" : "Other" },
  ];

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

  // Arabic font style
  const arabicFontStyle = {
    fontFamily: isArabic
      ? '"Hacen Tunisia", "Hacen Tunisia Bd", "Noto Sans Arabic", "Vazirmatn", "Traditional Arabic", "Arabic Typesetting", serif'
      : "inherit",
    lineHeight: isArabic ? "1.8" : "1.6",
    letterSpacing: isArabic ? "0.5px" : "0px",
    fontSize: isArabic
      ? "clamp(0.95rem, 1.2vw, 1.1rem)"
      : "clamp(0.9rem, 1.1vw, 1.05rem)",
  };

  // ===== HELPER: Get parent name =====
  const getParentName = (parent) => {
    if (parent.firstName && parent.lastName) {
      return `${parent.firstName} ${parent.lastName}`.trim();
    }
    if (parent.name) {
      return parent.name;
    }
    return "N/A";
  };

  // ===== HELPER: Get children names as array =====
  const getChildrenNames = (parent) => {
    if (parent.childrenNames && Array.isArray(parent.childrenNames)) {
      return parent.childrenNames;
    }
    if (parent.childrenNames && typeof parent.childrenNames === "string") {
      return parent.childrenNames.split(",").map((s) => s.trim()).filter(Boolean);
    }
    if (parent.children_names && Array.isArray(parent.children_names)) {
      return parent.children_names;
    }
    if (parent.children_names && typeof parent.children_names === "string") {
      return parent.children_names.split(",").map((s) => s.trim()).filter(Boolean);
    }
    if (parent.children && Array.isArray(parent.children)) {
      return parent.children.map((c) => c.name || c);
    }
    return [];
  };

  // ===== HELPER: Get children count =====
  const getChildrenCount = (parent) => {
    const children = getChildrenNames(parent);
    return children.length;
  };

  // ===== HELPER: Get children names as string =====
  const getChildrenNamesString = (parent) => {
    const children = getChildrenNames(parent);
    return children.join(", ");
  };

  // ===== FETCH PARENTS =====
  const fetchParents = () => {
    setLoading(true);
    setError(null);

    try {
      console.log('📚 Fetching parents...');
      
      let parentsData = JSON.parse(localStorage.getItem('school_parents') || '[]');
      console.log('📚 Parents from school_parents:', parentsData.length);
      
      if (parentsData.length === 0) {
        const allUsers = JSON.parse(localStorage.getItem('school_users') || '[]');
        parentsData = allUsers.filter(u => u.role === 'parent');
        console.log('📚 Parents from school_users:', parentsData.length);
      }
      
      if (parentsData.length === 0) {
        try {
          const allUsers = userDataService.getUsers();
          parentsData = allUsers.filter(u => u.role === 'parent');
          console.log('📚 Parents from userDataService:', parentsData.length);
        } catch (e) {
          console.warn('Could not get parents from userDataService:', e);
        }
      }

      const mappedParents = parentsData.map(p => {
        const firstName = p.firstName || '';
        const lastName = p.lastName || '';
        const name = p.name || `${firstName} ${lastName}`.trim() || 'Unknown Parent';
        
        return {
          ...p,
          id: p.id || `PRN${String(Date.now()).slice(-6)}`,
          firstName: firstName,
          lastName: lastName,
          name: name,
          displayName: getParentName(p) || name,
          displayChildren: getChildrenNames(p),
          displayChildrenCount: getChildrenCount(p),
          displayChildrenString: getChildrenNamesString(p),
          displayCity: p.city || 'N/A',
          displayDateOfBirth: p.dateOfBirth || null,
          displayGender: p.gender
            ? genderOptions.find((g) => g.value === p.gender)?.label || p.gender
            : 'N/A',
          displayNationality: p.nationality || 'N/A',
          displayCin: p.cin || 'N/A',
          displayOccupation: p.occupation || 'N/A',
          displayEmployer: p.employer || 'N/A',
          displayEmergencyContact: p.emergencyContactName || 'N/A',
          displayEmergencyRelationship: p.emergencyContactRelationship || 'N/A',
          displayEmergencyPhone: p.emergencyContactPhone || 'N/A',
          status: p.status || 'active',
          email: p.email || '',
          phone: p.phone || '',
          created_at: p.created_at || p.createdAt || new Date().toISOString(),
          last_login: p.last_login || null,
        };
      });

      let filtered = mappedParents;
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.displayName.toLowerCase().includes(searchLower) ||
            (p.id && p.id.toLowerCase().includes(searchLower)) ||
            (p.phone && p.phone.includes(searchTerm)) ||
            (p.email && p.email.toLowerCase().includes(searchLower)) ||
            p.displayChildren.some((c) => c.toLowerCase().includes(searchLower)) ||
            (p.displayCity && p.displayCity.toLowerCase().includes(searchLower)) ||
            (p.displayOccupation && p.displayOccupation.toLowerCase().includes(searchLower))
        );
      }
      if (filterStatus !== "all") {
        filtered = filtered.filter((p) => p.status === filterStatus);
      }

      filtered.sort((a, b) => a.displayName.localeCompare(b.displayName));

      setParents(filtered);
      setTotalParents(filtered.length);
      setTotalPages(Math.ceil(filtered.length / 10));
      
      console.log('✅ Parents loaded:', filtered.length);
    } catch (error) {
      console.error("❌ Error fetching parents:", error);
      setError(
        isArabic
          ? "فشل في تحميل بيانات أولياء الأمور"
          : "Failed to load parents data"
      );
      setParents([]);
      setTotalParents(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // ===== LISTEN FOR USER DATA CHANGES =====
  useEffect(() => {
    fetchParents();
    
    const handleUsersUpdated = () => {
      console.log('🔄 Users updated, refreshing parents...');
      fetchParents();
    };
    
    window.addEventListener('usersUpdated', handleUsersUpdated);
    window.addEventListener('storage', (e) => {
      if (e.key === 'school_users' || e.key === 'school_parents') {
        console.log('🔄 Storage changed, refreshing parents...');
        fetchParents();
      }
    });
    
    try {
      const unsubscribe = userDataService.addListener(() => {
        console.log('🔄 userDataService changed, refreshing parents...');
        fetchParents();
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
      fetchParents();
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  // ===== PAGE CHANGE EFFECT =====
  useEffect(() => {
    fetchParents();
  }, [filterStatus]);

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

  // ===== GET STATUS BADGE =====
  const getStatusBadge = (status) => {
    const variants = {
      active: { variant: "success", label: isArabic ? "نشط" : "Active" },
      inactive: { variant: "secondary", label: isArabic ? "غير نشط" : "Inactive" },
      pending: { variant: "warning", label: isArabic ? "قيد الانتظار" : "Pending" },
      suspended: { variant: "danger", label: isArabic ? "موقوف" : "Suspended" },
    };
    return variants[status] || variants.inactive;
  };

  // ===== STATUS OPTIONS =====
  const statusOptions = [
    { value: "all", label: isArabic ? "الكل" : "All" },
    { value: "active", label: isArabic ? "نشط" : "Active" },
    { value: "inactive", label: isArabic ? "غير نشط" : "Inactive" },
    { value: "pending", label: isArabic ? "قيد الانتظار" : "Pending" },
    { value: "suspended", label: isArabic ? "موقوف" : "Suspended" },
  ];

  // ===== GET DISPLAY PARENTS =====
  const getDisplayParents = () => {
    const start = (currentPage - 1) * 10;
    const end = start + 10;
    return parents.slice(start, end);
  };

  const displayParents = getDisplayParents();

  // ===== HANDLE VIEW PARENT =====
  const handleViewParent = (parent) => {
    setSelectedParent(parent);
    setShowViewModal(true);
  };

  // ===== HANDLE REFRESH =====
  const handleRefresh = () => {
    fetchParents();
    notify(isArabic ? "تم تحديث البيانات" : "Data refreshed", "info");
  };

  // ===== HANDLE EXPORT =====
  const handleExport = () => {
    try {
      const headers = ['ID', 'Name', 'Email', 'Phone', 'City', 'Children', 'Children Count', 'Occupation', 'Employer', 'Status'];
      const rows = parents.map(p => [
        p.id || 'N/A',
        p.displayName,
        p.email || 'N/A',
        p.phone || 'N/A',
        p.displayCity || 'N/A',
        p.displayChildrenString || 'N/A',
        p.displayChildrenCount || 0,
        p.displayOccupation || 'N/A',
        p.displayEmployer || 'N/A',
        p.status || 'N/A'
      ]);
      
      const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `parents_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      notify(isArabic ? "تم تصدير البيانات بنجاح" : "Data exported successfully", "success");
    } catch (error) {
      console.error('Error exporting data:', error);
      notify(isArabic ? "❌ حدث خطأ أثناء التصدير" : "❌ Error exporting data", "error");
    }
  };

  // ===== STATS =====
  const totalParentsCount = parents.length;
  const activeParents = parents.filter((p) => p.status === "active").length;
  const pendingParents = parents.filter((p) => p.status === "pending").length;
  const inactiveParents = parents.filter(
    (p) => p.status === "inactive" || p.status === "suspended"
  ).length;
  const totalChildren = parents.reduce(
    (sum, p) => sum + p.displayChildrenCount,
    0
  );

  return (
    <div className="parents-management" dir={isArabic ? "rtl" : "ltr"}>
      {/* Page Header */}
      <div className="page-header d-flex justify-content-between align-items-center flex-wrap gap-2 gap-md-3 mb-3 mb-md-4">
        <div>
          <h4
            className="fw-bold mb-0"
            style={{
              ...arabicFontStyle,
              color: "#c49a6c",
              fontSize: "clamp(1rem, 1.8vw, 1.5rem)",
            }}
          >
            <FaUsers className="me-2" />
            {isArabic ? "أولياء الأمور" : "Parents"}
          </h4>
          <p
            className="text-muted mb-0"
            style={{
              ...arabicFontStyle,
              fontSize: "clamp(0.7rem, 0.9vw, 0.85rem)",
            }}
          >
            {isArabic
              ? `عرض جميع أولياء الأمور المسجلين في النظام (${formatNumber(totalParentsCount)})`
              : `View all parents registered in the system (${formatNumber(totalParentsCount)})`}
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
              fontSize: "clamp(0.6rem, 0.8vw, 0.8rem)"
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
              fontSize: "clamp(0.6rem, 0.8vw, 0.8rem)"
            }}
          >
            <FaDownload className="me-1" />{" "}
            <span className="d-none d-sm-inline">
              {isArabic ? "تصدير" : "Export"}
            </span>
          </Button>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <Row className="g-2 g-md-3 g-lg-4 mb-3 mb-md-4">
        <Col xs={6} md={3} className="px-1 px-sm-2">
          <Card className="stats-card-enhanced h-100 text-center" style={{ 
            background: darkMode ? '#1a1a2e' : '#ffffff', 
            borderColor: darkMode ? '#2d2d44' : '#e9ecef',
            border: 'none',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}>
            <div className="stats-card-topbar" style={{ height: '4px', background: 'linear-gradient(135deg, #c49a6c, #dbb88a)', borderRadius: '16px 16px 0 0' }} />
            <Card.Body className="p-2 p-sm-3 p-md-4">
              <div className="stats-icon-wrapper mb-1 mb-sm-2" style={{ display: 'inline-flex', padding: 'clamp(6px, 1vw, 12px)', borderRadius: '12px', background: 'rgba(196, 154, 108, 0.15)', color: '#c49a6c' }}>
                <span style={{ fontSize: 'clamp(1.2rem, 2vw, 1.8rem)' }}><FaUsers /></span>
              </div>
              <h2 className="fw-bold mb-0" style={{ ...arabicFontStyle, fontSize: 'clamp(1rem, 1.8vw, 1.6rem)', color: darkMode ? '#e9ecef' : '#212529' }}>
                {formatNumber(totalParentsCount)}
              </h2>
              <p className="text-muted mb-0" style={{ ...arabicFontStyle, fontSize: 'clamp(0.5rem, 0.7vw, 0.7rem)', opacity: 0.8 }}>
                {isArabic ? "الإجمالي" : "Total"}
              </p>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3} className="px-1 px-sm-2">
          <Card className="stats-card-enhanced h-100 text-center" style={{ 
            background: darkMode ? '#1a1a2e' : '#ffffff', 
            borderColor: darkMode ? '#2d2d44' : '#e9ecef',
            border: 'none',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}>
            <div className="stats-card-topbar" style={{ height: '4px', background: 'linear-gradient(135deg, #2ecc71, #27ae60)', borderRadius: '16px 16px 0 0' }} />
            <Card.Body className="p-2 p-sm-3 p-md-4">
              <div className="stats-icon-wrapper mb-1 mb-sm-2" style={{ display: 'inline-flex', padding: 'clamp(6px, 1vw, 12px)', borderRadius: '12px', background: 'rgba(46, 204, 113, 0.15)', color: '#2ecc71' }}>
                <span style={{ fontSize: 'clamp(1.2rem, 2vw, 1.8rem)' }}><FaCheckCircle /></span>
              </div>
              <h2 className="fw-bold mb-0" style={{ ...arabicFontStyle, fontSize: 'clamp(1rem, 1.8vw, 1.6rem)', color: darkMode ? '#e9ecef' : '#212529' }}>
                {formatNumber(activeParents)}
              </h2>
              <p className="text-muted mb-0" style={{ ...arabicFontStyle, fontSize: 'clamp(0.5rem, 0.7vw, 0.7rem)', opacity: 0.8 }}>
                {isArabic ? "نشط" : "Active"}
              </p>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3} className="px-1 px-sm-2">
          <Card className="stats-card-enhanced h-100 text-center" style={{ 
            background: darkMode ? '#1a1a2e' : '#ffffff', 
            borderColor: darkMode ? '#2d2d44' : '#e9ecef',
            border: 'none',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}>
            <div className="stats-card-topbar" style={{ height: '4px', background: 'linear-gradient(135deg, #3498db, #2980b9)', borderRadius: '16px 16px 0 0' }} />
            <Card.Body className="p-2 p-sm-3 p-md-4">
              <div className="stats-icon-wrapper mb-1 mb-sm-2" style={{ display: 'inline-flex', padding: 'clamp(6px, 1vw, 12px)', borderRadius: '12px', background: 'rgba(52, 152, 219, 0.15)', color: '#3498db' }}>
                <span style={{ fontSize: 'clamp(1.2rem, 2vw, 1.8rem)' }}><FaChild /></span>
              </div>
              <h2 className="fw-bold mb-0" style={{ ...arabicFontStyle, fontSize: 'clamp(1rem, 1.8vw, 1.6rem)', color: darkMode ? '#e9ecef' : '#212529' }}>
                {formatNumber(totalChildren)}
              </h2>
              <p className="text-muted mb-0" style={{ ...arabicFontStyle, fontSize: 'clamp(0.5rem, 0.7vw, 0.7rem)', opacity: 0.8 }}>
                {isArabic ? "إجمالي الأبناء" : "Total Children"}
              </p>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3} className="px-1 px-sm-2">
          <Card className="stats-card-enhanced h-100 text-center" style={{ 
            background: darkMode ? '#1a1a2e' : '#ffffff', 
            borderColor: darkMode ? '#2d2d44' : '#e9ecef',
            border: 'none',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}>
            <div className="stats-card-topbar" style={{ height: '4px', background: 'linear-gradient(135deg, #e74c3c, #c0392b)', borderRadius: '16px 16px 0 0' }} />
            <Card.Body className="p-2 p-sm-3 p-md-4">
              <div className="stats-icon-wrapper mb-1 mb-sm-2" style={{ display: 'inline-flex', padding: 'clamp(6px, 1vw, 12px)', borderRadius: '12px', background: 'rgba(231, 76, 60, 0.15)', color: '#e74c3c' }}>
                <span style={{ fontSize: 'clamp(1.2rem, 2vw, 1.8rem)' }}><FaTimesCircle /></span>
              </div>
              <h2 className="fw-bold mb-0" style={{ ...arabicFontStyle, fontSize: 'clamp(1rem, 1.8vw, 1.6rem)', color: darkMode ? '#e9ecef' : '#212529' }}>
                {formatNumber(inactiveParents)}
              </h2>
              <p className="text-muted mb-0" style={{ ...arabicFontStyle, fontSize: 'clamp(0.5rem, 0.7vw, 0.7rem)', opacity: 0.8 }}>
                {isArabic ? "غير نشط" : "Inactive"}
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="modern-card mb-3 mb-md-4" style={{
        background: darkMode ? "#1a1a2e" : "#ffffff",
        borderColor: darkMode ? "#2d2d44" : "#e9ecef",
      }}>
        <Card.Body className="p-2 p-md-3">
          <Row className="g-1 g-md-2 align-items-center">
            <Col xs={12} sm={6} md={4} lg={4} className="px-1 px-sm-2">
              <InputGroup size="sm">
                <InputGroup.Text style={{
                  background: "transparent",
                  borderColor: darkMode ? "#2d2d44" : "#ced4da",
                }}>
                  <FaSearch size={12} />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder={isArabic ? "بحث بالاسم أو المعرف أو البريد أو الهاتف..." : "Search by name, ID, email, phone..."}
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
                  <Button variant="outline-secondary" size="sm" onClick={() => setSearchTerm("")} style={{ borderRadius: "0 12px 12px 0" }}>
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
                style={{
                  ...arabicFontStyle,
                  background: darkMode ? "#2d2d44" : "white",
                  color: darkMode ? "#e9ecef" : "#212529",
                  borderRadius: "12px",
                  fontSize: "clamp(0.55rem, 0.7vw, 0.75rem)",
                }}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={6} sm={3} md={3} lg={3} className="px-1 px-sm-2">
              <Button variant="outline-primary" size="sm" className="w-100" style={{
                ...arabicFontStyle,
                borderRadius: "12px",
                fontSize: "clamp(0.6rem, 0.8vw, 0.8rem)",
              }} onClick={fetchParents}>
                <FaSearch className="me-1" /> <span className="d-none d-sm-inline">{isArabic ? "بحث" : "Search"}</span>
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Parents Table */}
      <Card className="modern-card" style={{
        background: darkMode ? "#1a1a2e" : "#ffffff",
        borderColor: darkMode ? "#2d2d44" : "#e9ecef",
      }}>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <FaSpinner className="spinning" size={40} style={{ color: '#3498db' }} />
              <p className="mt-2 text-muted" style={arabicFontStyle}>{isArabic ? "جاري التحميل..." : "Loading..."}</p>
            </div>
          ) : error ? (
            <Alert variant="danger" className="m-3" style={arabicFontStyle}>{error}</Alert>
          ) : displayParents.length === 0 ? (
            <div className="text-center py-5">
              <FaUsers size={48} className="text-muted opacity-25 mb-3" />
              <p style={arabicFontStyle}>{isArabic ? "لا توجد بيانات مطابقة للبحث" : "No matching data found"}</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <Table hover className="mb-0" style={arabicFontStyle}>
                  <thead style={{ background: darkMode ? "#0d1117" : "#f8f9fa" }}>
                    <tr>
                      <th style={{ color: darkMode ? "#e9ecef" : "#212529", whiteSpace: "nowrap", fontSize: "clamp(0.6rem, 0.8vw, 0.85rem)" }}>#</th>
                      <th style={{ color: darkMode ? "#e9ecef" : "#212529", whiteSpace: "nowrap", fontSize: "clamp(0.6rem, 0.8vw, 0.85rem)" }}>{isArabic ? "ولي الأمر" : "Parent"}</th>
                      <th style={{ color: darkMode ? "#e9ecef" : "#212529", whiteSpace: "nowrap", fontSize: "clamp(0.6rem, 0.8vw, 0.85rem)" }} className="d-none d-lg-table-cell">{isArabic ? "معلومات الاتصال" : "Contact"}</th>
                      <th style={{ color: darkMode ? "#e9ecef" : "#212529", whiteSpace: "nowrap", fontSize: "clamp(0.6rem, 0.8vw, 0.85rem)" }}>{isArabic ? "الأبناء" : "Children"}</th>
                      <th style={{ color: darkMode ? "#e9ecef" : "#212529", whiteSpace: "nowrap", fontSize: "clamp(0.6rem, 0.8vw, 0.85rem)" }} className="d-none d-md-table-cell">{isArabic ? "المهنة" : "Occupation"}</th>
                      <th style={{ color: darkMode ? "#e9ecef" : "#212529", whiteSpace: "nowrap", fontSize: "clamp(0.6rem, 0.8vw, 0.85rem)" }} className="d-none d-sm-table-cell">{isArabic ? "الحالة" : "Status"}</th>
                      <th style={{ color: darkMode ? "#e9ecef" : "#212529", whiteSpace: "nowrap", fontSize: "clamp(0.6rem, 0.8vw, 0.85rem)" }} className="d-none d-md-table-cell">{isArabic ? "آخر تسجيل دخول" : "Last Login"}</th>
                      <th className="text-center" style={{ color: darkMode ? "#e9ecef" : "#212529", whiteSpace: "nowrap", fontSize: "clamp(0.6rem, 0.8vw, 0.85rem)" }}>{isArabic ? "عرض" : "View"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayParents.map((parent, index) => {
                      const statusBadge = getStatusBadge(parent.status);
                      const children = parent.displayChildren || [];
                      const childrenCount = parent.displayChildrenCount || 0;

                      return (
                        <tr key={parent.id}>
                          <td style={{ color: darkMode ? "#e9ecef" : "#212529", fontSize: "clamp(0.55rem, 0.7vw, 0.8rem)" }}>
                            {formatNumber((currentPage - 1) * 10 + index + 1)}
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-1 gap-md-2">
                              <div className="parent-avatar-sm" style={{
                                background: `linear-gradient(135deg, #c49a6c, #dbb88a)`,
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
                              }}>
                                {parent.displayName.charAt(0).toUpperCase()}
                              </div>
                              <div className="parent-info" style={{ minWidth: 0 }}>
                                <div className="fw-semibold text-truncate" style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529", fontSize: "clamp(0.6rem, 0.8vw, 0.85rem)" }}>
                                  {parent.displayName}
                                </div>
                                <small className="text-muted d-none d-md-block" style={{ ...arabicFontStyle, fontSize: "clamp(0.45rem, 0.55vw, 0.65rem)" }}>
                                  <FaIdCard className="me-1" size={10} /> {isArabic ? "رقم" : "ID"}: {parent.id}
                                </small>
                              </div>
                            </div>
                          </td>
                          <td className="d-none d-lg-table-cell">
                            <div style={{ fontSize: "clamp(0.5rem, 0.6vw, 0.7rem)", color: darkMode ? "#adb5bd" : "#6c757d" }}>
                              <div className="text-truncate" style={{ maxWidth: "120px" }}><FaEnvelope className="me-1 text-muted" size={10} /> {parent.email}</div>
                              {parent.phone && (
                                <div className="text-truncate" style={{ maxWidth: "120px" }}><FaPhone className="me-1 text-muted" size={10} /> {parent.phone}</div>
                              )}
                            </div>
                          </td>
                          <td>
                            <div>
                              <Badge style={{ background: "#c49a6c", color: "white", fontSize: "clamp(0.45rem, 0.55vw, 0.65rem)", padding: "3px 10px", borderRadius: "8px" }}>
                                {formatNumber(childrenCount)} {isArabic ? "طفل" : "child"}{childrenCount !== 1 ? (isArabic ? "أطفال" : "ren") : ""}
                              </Badge>
                              {children.length > 0 && (
                                <div className="mt-1">
                                  <small className="text-muted" style={{ ...arabicFontStyle, fontSize: "clamp(0.45rem, 0.55vw, 0.6rem)" }}>
                                    {children.slice(0, 3).join(", ")}
                                    {children.length > 3 && ` +${formatNumber(children.length - 3)}`}
                                  </small>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="d-none d-md-table-cell">
                            {parent.displayOccupation && parent.displayOccupation !== "N/A" ? (
                              <span style={{ fontSize: "clamp(0.55rem, 0.7vw, 0.75rem)", color: darkMode ? "#e9ecef" : "#212529" }}>
                                {parent.displayOccupation}
                              </span>
                            ) : (
                              <span className="text-muted" style={{ fontSize: "clamp(0.5rem, 0.6vw, 0.65rem)" }}>N/A</span>
                            )}
                          </td>
                          <td className="d-none d-sm-table-cell">
                            <Badge bg={statusBadge.variant} className="px-2 py-1" style={{ fontSize: "clamp(0.45rem, 0.55vw, 0.65rem)", borderRadius: "8px" }}>
                              {statusBadge.label}
                            </Badge>
                          </td>
                          <td className="d-none d-md-table-cell">
                            <small className="text-muted" style={{ ...arabicFontStyle, color: darkMode ? "#adb5bd" : "#6c757d", fontSize: "clamp(0.5rem, 0.6vw, 0.7rem)" }}>
                              <FaClock className="me-1" size={10} />
                              {formatTime(parent.last_login)}
                            </small>
                          </td>
                          <td>
                            <div className="d-flex gap-1 justify-content-center">
                              <Button variant="outline-primary" size="sm" className="action-btn" onClick={() => handleViewParent(parent)} title={isArabic ? "عرض التفاصيل" : "View Details"} style={{ borderRadius: "6px" }}>
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center p-2 p-md-3 border-top flex-wrap gap-2" style={{ borderColor: darkMode ? "#2d2d44" : "#e9ecef" }}>
                  <div className="text-muted small" style={{ ...arabicFontStyle, color: darkMode ? "#adb5bd" : "#6c757d", fontSize: "clamp(0.55rem, 0.7vw, 0.75rem)" }}>
                    {isArabic ? `عرض ${formatNumber(displayParents.length)} من ${formatNumber(totalParents)} ولي أمر` : `Showing ${formatNumber(displayParents.length)} of ${formatNumber(totalParents)} parents`}
                  </div>
                  <Pagination className="mb-0 responsive-pagination">
                    <Pagination.Prev onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} />
                    {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                      let pageNum;
                      if (totalPages <= 5) { pageNum = i + 1; }
                      else if (currentPage <= 3) { pageNum = i + 1; }
                      else if (currentPage >= totalPages - 2) { pageNum = totalPages - 4 + i; }
                      else { pageNum = currentPage - 2 + i; }
                      return (
                        <Pagination.Item key={pageNum} active={pageNum === currentPage} onClick={() => setCurrentPage(pageNum)} style={{ color: darkMode ? "#e9ecef" : "#212529" }}>
                          {formatNumber(pageNum)}
                        </Pagination.Item>
                      );
                    })}
                    <Pagination.Next onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} />
                  </Pagination>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      {/* ===== VIEW PARENT MODAL ===== */}
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
            {isArabic ? "تفاصيل ولي الأمر" : "Parent Details"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
          style={{
            background: darkMode ? "#1a1a2e" : "#ffffff",
            maxHeight: "70vh",
            overflowY: "auto",
          }}
        >
          {selectedParent && (
            <div style={arabicFontStyle}>
              <div className="text-center mb-3">
                <div
                  className="parent-avatar-lg mx-auto"
                  style={{
                    background: "linear-gradient(135deg, #c49a6c, #dbb88a)",
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
                    boxShadow: "0 8px 30px rgba(196, 154, 108, 0.3)",
                  }}
                >
                  {selectedParent.displayName.charAt(0).toUpperCase()}
                </div>
                <h5
                  className="fw-bold mt-3"
                  style={{
                    color: darkMode ? "#e9ecef" : "#212529",
                    fontSize: "clamp(1rem, 1.5vw, 1.25rem)",
                  }}
                >
                  {selectedParent.displayName}
                </h5>
                <Badge
                  bg="primary"
                  className="mt-1"
                  style={{ borderRadius: "8px", fontSize: "clamp(0.6rem, 0.8vw, 0.8rem)" }}
                >
                  {isArabic ? "ولي أمر" : "Parent"}
                </Badge>
                <div className="mt-2">
                  <Badge
                    bg={getStatusBadge(selectedParent.status).variant}
                    className="px-3 py-2"
                    style={{ borderRadius: "8px", fontSize: "clamp(0.6rem, 0.8vw, 0.8rem)" }}
                  >
                    {getStatusBadge(selectedParent.status).label}
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
                    {isArabic ? "رقم الهوية" : "ID"}: {selectedParent.id}
                  </small>
                </div>
              </div>

              <hr />

              <div
                className="parent-details"
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
                      {selectedParent.displayName}
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
                    <span className="fw-semibold">{selectedParent.email}</span>
                  </Col>
                </Row>
                {selectedParent.phone && (
                  <Row className="mb-2">
                    <Col md={4}>
                      <strong className="text-muted">
                        <FaPhone className="me-1" />{" "}
                        {isArabic ? "رقم الهاتف" : "Phone"}
                      </strong>
                    </Col>
                    <Col md={8}>
                      <span className="fw-semibold">
                        {selectedParent.phone}
                      </span>
                    </Col>
                  </Row>
                )}
                {selectedParent.address && (
                  <Row className="mb-2">
                    <Col md={4}>
                      <strong className="text-muted">
                        <FaMapMarkerAlt className="me-1" />{" "}
                        {isArabic ? "العنوان" : "Address"}
                      </strong>
                    </Col>
                    <Col md={8}>
                      <span className="fw-semibold">
                        {selectedParent.address}
                      </span>
                    </Col>
                  </Row>
                )}
                {selectedParent.displayCity &&
                  selectedParent.displayCity !== "N/A" && (
                    <Row className="mb-2">
                      <Col md={4}>
                        <strong className="text-muted">
                          <FaCity className="me-1" />{" "}
                          {isArabic ? "المدينة" : "City"}
                        </strong>
                      </Col>
                      <Col md={8}>
                        <span className="fw-semibold">
                          {selectedParent.displayCity}
                        </span>
                      </Col>
                    </Row>
                  )}
                {selectedParent.displayDateOfBirth && (
                  <Row className="mb-2">
                    <Col md={4}>
                      <strong className="text-muted">
                        <FaBirthdayCake className="me-1" />{" "}
                        {isArabic ? "تاريخ الميلاد" : "Date of Birth"}
                      </strong>
                    </Col>
                    <Col md={8}>
                      <span className="fw-semibold">
                        {safeFormatDate(
                          selectedParent.displayDateOfBirth,
                          "PPP",
                          { locale }
                        )}
                      </span>
                    </Col>
                  </Row>
                )}
                {selectedParent.displayGender &&
                  selectedParent.displayGender !== "N/A" && (
                    <Row className="mb-2">
                      <Col md={4}>
                        <strong className="text-muted">
                          <FaVenusMars className="me-1" />{" "}
                          {isArabic ? "الجنس" : "Gender"}
                        </strong>
                      </Col>
                      <Col md={8}>
                        <span className="fw-semibold">
                          {selectedParent.displayGender}
                        </span>
                      </Col>
                    </Row>
                  )}
                {selectedParent.displayNationality &&
                  selectedParent.displayNationality !== "N/A" && (
                    <Row className="mb-2">
                      <Col md={4}>
                        <strong className="text-muted">
                          <FaGlobe className="me-1" />{" "}
                          {isArabic ? "الجنسية" : "Nationality"}
                        </strong>
                      </Col>
                      <Col md={8}>
                        <span className="fw-semibold">
                          {selectedParent.displayNationality}
                        </span>
                      </Col>
                    </Row>
                  )}
                {selectedParent.displayCin &&
                  selectedParent.displayCin !== "N/A" && (
                    <Row className="mb-2">
                      <Col md={4}>
                        <strong className="text-muted">
                          <FaIdBadge className="me-1" />{" "}
                          {isArabic ? "رقم الهوية" : "CIN"}
                        </strong>
                      </Col>
                      <Col md={8}>
                        <span className="fw-semibold">
                          {selectedParent.displayCin}
                        </span>
                      </Col>
                    </Row>
                  )}

                {/* Professional Information */}
                <div className="section-divider mt-3">
                  <span className="section-divider-label">
                    <FaBriefcase className="me-2" />{" "}
                    {isArabic ? "معلومات مهنية" : "Professional Information"}
                  </span>
                </div>

                {selectedParent.displayOccupation &&
                  selectedParent.displayOccupation !== "N/A" && (
                    <Row className="mb-2">
                      <Col md={4}>
                        <strong className="text-muted">
                          <FaBriefcase className="me-1" />{" "}
                          {isArabic ? "المهنة" : "Occupation"}
                        </strong>
                      </Col>
                      <Col md={8}>
                        <span className="fw-semibold">
                          {selectedParent.displayOccupation}
                        </span>
                      </Col>
                    </Row>
                  )}
                {selectedParent.displayEmployer &&
                  selectedParent.displayEmployer !== "N/A" && (
                    <Row className="mb-2">
                      <Col md={4}>
                        <strong className="text-muted">
                          <FaBuilding className="me-1" />{" "}
                          {isArabic ? "جهة العمل" : "Employer"}
                        </strong>
                      </Col>
                      <Col md={8}>
                        <span className="fw-semibold">
                          {selectedParent.displayEmployer}
                        </span>
                      </Col>
                    </Row>
                  )}

                {/* Children Information */}
                <div className="section-divider mt-3">
                  <span className="section-divider-label">
                    <FaChild className="me-2" />{" "}
                    {isArabic ? "الأبناء" : "Children"}
                  </span>
                </div>

                <Row className="mb-2">
                  <Col md={4}>
                    <strong className="text-muted">
                      <FaChild className="me-1" />{" "}
                      {isArabic ? "عدد الأبناء" : "Children Count"}
                    </strong>
                  </Col>
                  <Col md={8}>
                    <span className="fw-semibold">
                      {formatNumber(selectedParent.displayChildrenCount)}
                    </span>
                  </Col>
                </Row>
                {selectedParent.displayChildren &&
                  selectedParent.displayChildren.length > 0 && (
                    <Row className="mb-2">
                      <Col md={4}>
                        <strong className="text-muted">
                          {isArabic ? "أسماء الأبناء" : "Children Names"}
                        </strong>
                      </Col>
                      <Col md={8}>
                        <div className="d-flex flex-wrap gap-1">
                          {selectedParent.displayChildren.map((child, idx) => (
                            <Badge
                              key={idx}
                              style={{
                                background: "#c49a6c",
                                color: "white",
                                borderRadius: "8px",
                                padding: "4px 10px",
                                fontSize: "clamp(0.5rem, 0.6vw, 0.7rem)",
                              }}
                            >
                              {child}
                            </Badge>
                          ))}
                        </div>
                      </Col>
                    </Row>
                  )}

                {/* Emergency Contact */}
                {selectedParent.displayEmergencyContact &&
                  selectedParent.displayEmergencyContact !== "N/A" && (
                    <>
                      <div className="section-divider mt-3">
                        <span className="section-divider-label">
                          <FaPhoneAlt className="me-2" />{" "}
                          {isArabic ? "جهة اتصال طارئة" : "Emergency Contact"}
                        </span>
                      </div>
                      <Row className="mb-2">
                        <Col md={4}>
                          <strong className="text-muted">
                            <FaUserCircle className="me-1" />{" "}
                            {isArabic ? "الاسم" : "Name"}
                          </strong>
                        </Col>
                        <Col md={8}>
                          <span className="fw-semibold">
                            {selectedParent.displayEmergencyContact}
                          </span>
                        </Col>
                      </Row>
                      {selectedParent.displayEmergencyRelationship &&
                        selectedParent.displayEmergencyRelationship !==
                          "N/A" && (
                          <Row className="mb-2">
                            <Col md={4}>
                              <strong className="text-muted">
                                <FaHandshake className="me-1" />{" "}
                                {isArabic ? "العلاقة" : "Relationship"}
                              </strong>
                            </Col>
                            <Col md={8}>
                              <span className="fw-semibold">
                                {selectedParent.displayEmergencyRelationship}
                              </span>
                            </Col>
                          </Row>
                        )}
                      {selectedParent.displayEmergencyPhone &&
                        selectedParent.displayEmergencyPhone !== "N/A" && (
                          <Row className="mb-2">
                            <Col md={4}>
                              <strong className="text-muted">
                                <FaPhone className="me-1" />{" "}
                                {isArabic ? "رقم الهاتف" : "Phone"}
                              </strong>
                            </Col>
                            <Col md={8}>
                              <span className="fw-semibold">
                                {selectedParent.displayEmergencyPhone}
                              </span>
                            </Col>
                          </Row>
                        )}
                    </>
                  )}

                {/* Registration Info */}
                <div className="section-divider mt-3">
                  <span className="section-divider-label">
                    <FaCalendarAlt className="me-2" />{" "}
                    {isArabic ? "معلومات التسجيل" : "Registration Info"}
                  </span>
                </div>
                <Row className="mb-2">
                  <Col md={4}>
                    <strong className="text-muted">
                      <FaCalendarAlt className="me-1" />{" "}
                      {isArabic ? "تاريخ التسجيل" : "Registered"}
                    </strong>
                  </Col>
                  <Col md={8}>
                    <span className="fw-semibold">
                      {safeFormatDate(
                        selectedParent.created_at || selectedParent.createdAt,
                        "PPP",
                        { locale }
                      )}
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
                      {formatTime(selectedParent.last_login)}
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

      {/* Styles */}
      <style>{`
        .parents-management { padding: 0; }
        .spinning { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

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
          .action-btn { padding: 2px 4px !important; min-width: 22px; min-height: 22px; font-size: 0.5rem !important; }
          .action-btn svg { font-size: 8px !important; }
          .action-btn-responsive { font-size: 0.6rem !important; padding: 3px 6px !important; }
          .action-btn-responsive svg { font-size: 10px !important; }
        }
        
        @media (max-width: 576px) {
          .action-btn { padding: 1px 3px !important; min-width: 18px; min-height: 18px; }
          .action-btn svg { font-size: 7px !important; }
          .action-btn-responsive { font-size: 0.5rem !important; padding: 2px 4px !important; }
          .action-btn-responsive svg { font-size: 8px !important; }
        }

        .stats-card-enhanced { transition: all 0.3s ease; cursor: pointer; }
        .stats-card-enhanced .stats-icon-wrapper { transition: all 0.3s ease; }
        .stats-card-enhanced:hover .stats-icon-wrapper { transform: scale(1.1); }
        .stats-card-enhanced:hover { transform: translateY(-5px); box-shadow: ${darkMode ? '0 8px 30px rgba(0,0,0,0.4)' : '0 8px 30px rgba(0,0,0,0.1)'} !important; }

        .modern-card { border-radius: 16px; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.06); transition: all 0.3s; }
        .parent-avatar-sm { transition: transform 0.3s ease; }
        .parent-avatar-sm:hover { transform: scale(1.15); }
        .parent-avatar-lg { transition: transform 0.3s ease; }
        .parent-avatar-lg:hover { transform: scale(1.05); }

        .section-divider {
          display: flex;
          align-items: center;
          margin: 16px 0 12px;
        }
        .section-divider::before {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(to right, transparent, ${darkMode ? "#2d2d44" : "#e9ecef"});
        }
        .section-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(to left, transparent, ${darkMode ? "#2d2d44" : "#e9ecef"});
        }
        .section-divider-label {
          padding: 0 16px;
          font-weight: 600;
          font-size: clamp(0.7rem, 0.9vw, 0.85rem);
          color: ${darkMode ? "#adb5bd" : "#6c757d"};
          white-space: nowrap;
        }

        .modern-modal .modal-content {
          border-radius: 20px !important;
          border: none !important;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
          overflow: hidden;
        }

        .responsive-pagination .page-link { padding: 4px 8px; font-size: clamp(0.55rem, 0.7vw, 0.75rem); }
        @media (max-width: 576px) {
          .responsive-pagination .page-link { padding: 2px 6px; font-size: 0.5rem; }
          .responsive-pagination .page-item:not(.active) .page-link { display: none; }
          .responsive-pagination .page-item.active .page-link { display: block; }
          .responsive-pagination .page-item.prev .page-link, .responsive-pagination .page-item.next .page-link { display: block; }
        }

        @media (max-width: 1200px) { .parents-management .table-responsive { overflow-x: auto; -webkit-overflow-scrolling: touch; } }
        @media (max-width: 768px) {
          .parents-management .page-header { flex-direction: column; align-items: stretch !important; }
          .parents-management .table td, .parents-management .table th { padding: 4px 3px !important; }
          .parents-management .table td .fw-semibold { font-size: 0.6rem !important; }
          .parents-management .table td small { font-size: 0.45rem !important; max-width: 60px !important; }
          .parents-management .table .badge { font-size: 0.4rem !important; padding: 2px 4px !important; }
          .parents-management .stats-card-enhanced .p-2 { padding: 4px !important; }
          .parents-management .stats-card-enhanced h2 { font-size: 0.9rem !important; }
          .parents-management .stats-card-enhanced p { font-size: 0.45rem !important; }
          .parents-management .stats-card-enhanced .stats-icon-wrapper { padding: 4px !important; }
          .parents-management .stats-card-enhanced .stats-icon-wrapper svg { font-size: 14px !important; }
        }
        @media (max-width: 576px) {
          .parents-management .page-header .d-flex { flex-wrap: wrap; gap: 3px !important; }
          .parents-management .page-header .btn { font-size: 0.55rem !important; padding: 3px 6px !important; }
          .parents-management .page-header h4 { font-size: 0.85rem !important; }
          .parents-management .page-header p { font-size: 0.6rem !important; }
          .parents-management .modern-card .p-2 { padding: 4px !important; }
          .parents-management .modern-card .g-1 { gap: 2px !important; }
          .parents-management .modern-card .form-select, .parents-management .modern-card .form-control { font-size: 0.55rem !important; padding: 3px 4px !important; }
          .parents-management .modern-card .btn { font-size: 0.55rem !important; padding: 3px 4px !important; }
          .parents-management .modern-card .input-group-text { padding: 3px 6px !important; }
          .parents-management .modern-card .input-group-text svg { font-size: 10px !important; }
          .parents-management .stats-card-enhanced { min-height: 60px !important; }
          .parents-management .stats-card-enhanced .stats-icon-wrapper svg { width: 14px !important; height: 14px !important; }
          .parents-management .table td, .parents-management .table th { padding: 0.3rem; font-size: 0.65rem; }
          .parents-management .modern-modal .modal-header { padding: 12px 16px 0 !important; }
          .parents-management .modern-modal .modal-body { padding: 12px 16px 16px !important; }
          .parents-management .modern-modal .modal-footer { padding: 8px 16px 16px !important; }
          .section-divider-label { font-size: 0.65rem; padding: 0 8px; }
          .parent-details .row { margin-bottom: 4px !important; }
          .parent-details .row .col-md-4 { font-size: 0.7rem !important; }
          .parent-details .row .col-md-8 { font-size: 0.7rem !important; }
        }

        [dir="rtl"] .me-1 { margin-right: 0 !important; margin-left: 0.25rem !important; }
        [dir="rtl"] .me-2 { margin-right: 0 !important; margin-left: 0.5rem !important; }
        [dir="rtl"] .ms-1 { margin-left: 0 !important; margin-right: 0.25rem !important; }
        [dir="rtl"] .ms-2 { margin-left: 0 !important; margin-right: 0.5rem !important; }
      `}</style>
    </div>
  );
};

export default ParentsManagement;