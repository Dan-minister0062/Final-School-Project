// src/components/dashboard/admin/RegistrationsManagement.jsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Form, Modal, Alert, Pagination, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
  FaUserGraduate, FaUserPlus, FaCheckCircle, FaTimesCircle, FaEye,
  FaSearch, FaClock, FaEnvelope, FaPhone, FaCalendarAlt,
  FaMapMarkerAlt, FaUser, FaChild, FaSchool, FaBuilding,
  FaInfoCircle, FaExclamationTriangle, FaSync, FaFilter,
  FaChevronDown, FaChevronUp, FaUserCheck, FaUserTimes,
  FaSave, FaPrint, FaFileExcel, FaArrowRight, FaUsers, FaMoneyBillWave,
  FaSort, FaSortUp, FaSortDown, FaSpinner
} from 'react-icons/fa';
import { useLanguage } from '../../../context/LanguageContext';
import { getTranslation } from '../../../utils/translations';
import { useNotification } from '../../../hooks/useNotification';
import api from '../../../services/api';

// ===== ALWAYS use English numbers =====
const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  return num.toString();
};

const RegistrationsManagement = () => {
  const { language, isArabic } = useLanguage();
  const t = (key) => getTranslation(key, language);
  const { notify } = useNotification();
  const navigate = useNavigate();

  // ===== ARABIC FONT STYLE =====
  const arabicFontStyle = {
    fontFamily: isArabic ? '"Hacen Tunisia", "Hacen Tunisia Bd", "Noto Sans Arabic", "Vazirmatn", "Traditional Arabic", "Arabic Typesetting", serif' : 'inherit',
    lineHeight: isArabic ? '1.8' : '1.6',
    letterSpacing: isArabic ? '0.5px' : '0px',
    fontSize: isArabic ? 'clamp(0.85rem, 1.1vw, 1.05rem)' : 'clamp(0.8rem, 1vw, 1rem)',
  };

  // ===== STATE =====
  const [registrations, setRegistrations] = useState([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterLevel, setFilterLevel] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [classList, setClassList] = useState([]);
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const itemsPerPage = 5;

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

  // ===== LOAD CLASSES (for the approval class picker) =====
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const res = await api.get('/classes', { params: { per_page: 200 } });
        const rows = Array.isArray(res.data?.data)
          ? res.data.data
          : res.data?.data?.data;
        if (Array.isArray(rows)) setClassList(rows);
      } catch (e) {
        // Fallback to localStorage classes
        try {
          const stored = localStorage.getItem('classes');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) setClassList(parsed);
          }
        } catch (err) {
          console.error('Error loading classes:', err);
        }
      }
    };
    loadClasses();
  }, []);

  // ===== LOAD REGISTRATIONS =====
  const loadRegistrations = () => {
    setLoading(true);
    try {
      // First try to read from 'registrations' (from Admissions.jsx)
      let allRegistrations = [];
      
      const registrationsRaw = localStorage.getItem('registrations');
      if (registrationsRaw) {
        try {
          const parsed = JSON.parse(registrationsRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            allRegistrations = parsed.map(r => ({
              id: r.id || `reg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              studentName: r.studentName || `${r.firstName || ''} ${r.lastName || ''}`.trim() || 'Unknown Student',
              studentDob: r.dob || r.dateOfBirth || null,
              placeOfBirth: r.placeOfBirth || '',
              gender: r.gender || '',
              nationality: r.nationality || '',
              address: r.address || '',
              city: r.city || '',
              studentPhoto: r.studentPhoto || null,
              academicYear: r.academicYear || '',
              level: r.level || '',
              requestedClass: r.requestedClass || r.className || '',
              admissionType: r.admissionType || '',
              parentName: r.parentName || '',
              relationship: r.relationship || '',
              parentEmail: r.parentEmail || r.email || '',
              parentPhone: r.parentPhone || r.phone || '',
              parentAddress: r.parentAddress || r.address || '',
              cinId: r.cinId || '',
              parentPassword: r.parentPassword || '',
              emergencyContact: r.emergencyContact || '',
              emergencyRelationship: r.emergencyRelationship || '',
              emergencyPhone: r.emergencyPhone || '',
              message: r.additionalNotes || r.message || '',
              previousSchool: r.previousSchool || '',
              hasAttendedBefore: r.hasAttendedBefore ?? false,
              specialAssistance: r.specialAssistance ?? false,
              authorizedPickup: r.authorizedPickup || '',
              previousGrade: r.previousGrade || '',
              lastAcademicYear: r.lastAcademicYear || '',
              reportCard: r.reportCard || null,
              schoolCertificate: r.schoolCertificate || null,
              massarNumber: r.massarNumber || '',
              academicTrack: r.academicTrack || '',
              termsAgreed: r.termsAgreed ?? true,
              status: r.status || 'pending',
              admin_notes: r.adminNotes || r.admin_notes || '',
              classId: r.classId || r.class_id || r.requestedClass || null,
              paymentStatus: r.paymentStatus || r.payment_status || null,
              paymentAmount: r.paymentAmount ?? r.payment_amount ?? null,
              paymentRequestedAt: r.paymentRequestedAt || r.payment_requested_at || null,
              paymentPaidAt: r.paymentPaidAt || r.payment_paid_at || null,
              createdAt: r.submittedAt || r.createdAt || new Date().toISOString(),
              updatedAt: r.updatedAt || r.createdAt || new Date().toISOString(),
            }));
          }
        } catch (e) {
          console.error('Error parsing registrations:', e);
        }
      }

      // If no registrations found, try 'registration_requests'
      if (allRegistrations.length === 0) {
        const saved = localStorage.getItem('registration_requests');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              allRegistrations = parsed.map(r => ({
                id: r.id ?? r._serverId ?? `local-${Math.random().toString(36).slice(2, 10)}`,
                studentName: r.firstName && r.lastName
                  ? `${r.firstName} ${r.lastName}`
                  : r.studentName || r.firstName || '',
                studentDob: r.dob || r.studentDob || null,
                placeOfBirth: r.placeOfBirth || '',
                gender: r.gender || '',
                nationality: r.nationality || '',
                address: r.address || '',
                city: r.city || '',
                studentPhoto: r.studentPhoto || null,
                academicYear: r.academicYear || '',
                level: r.level || '',
                requestedClass: r.requestedClass || r.classId || '',
                admissionType: r.admissionType || '',
                parentName: r.parentName || '',
                relationship: r.relationship || '',
                parentEmail: r.parentEmail || '',
                parentPhone: r.parentPhone || '',
                parentAddress: r.parentAddress || '',
                cinId: r.cinId || '',
                parentPassword: r.parentPassword || '',
                emergencyContact: r.emergencyContact || '',
                emergencyRelationship: r.emergencyRelationship || '',
                emergencyPhone: r.emergencyPhone || '',
                message: r.additionalNotes || r.message || '',
                previousSchool: r.previousSchool || '',
                hasAttendedBefore: r.hasAttendedBefore ?? false,
                specialAssistance: r.specialAssistance ?? false,
                authorizedPickup: r.authorizedPickup || '',
                previousGrade: r.previousGrade || '',
                lastAcademicYear: r.lastAcademicYear || '',
                reportCard: r.reportCard || null,
                schoolCertificate: r.schoolCertificate || null,
                massarNumber: r.massarNumber || '',
                academicTrack: r.academicTrack || '',
                termsAgreed: r.termsAgreed ?? true,
                status: r.status || 'pending',
                admin_notes: r.admin_notes || r.adminNotes || '',
                classId: r.classId || r.class_id || r.requestedClass || null,
                paymentStatus: r.paymentStatus || r.payment_status || null,
                paymentAmount: r.paymentAmount ?? r.payment_amount ?? null,
                paymentRequestedAt: r.paymentRequestedAt || r.payment_requested_at || null,
                paymentPaidAt: r.paymentPaidAt || r.payment_paid_at || null,
                createdAt: r.createdAt || new Date().toISOString(),
                updatedAt: r.updatedAt || r.createdAt || new Date().toISOString(),
              }));
            }
          } catch (e) {
            console.error('Error parsing registration_requests:', e);
          }
        }
      }

      // If still no registrations, seed sample data
      if (allRegistrations.length === 0) {
        const sampleData = [
          {
            id: 1,
            studentName: isArabic ? 'أحمد عبد الله' : 'Ahmad Abdullah',
            studentDob: '2018-05-15',
            level: 'primary',
            requestedClass: '1 -A-',
            previousSchool: isArabic ? 'مدرسة النور' : 'Al Noor School',
            specialNeeds: '',
            parentName: isArabic ? 'عبد الله إبراهيم' : 'Abdullah Ibrahim',
            parentEmail: 'abdullah@email.com',
            parentPhone: '+212 537 350 200',
            parentAddress: 'Maghrib El Arabi B3 Oulad Oujih, Kenitra',
            parentPassword: 'encrypted_password',
            emergencyContact: isArabic ? 'فاطمة إبراهيم' : 'Fatimah Ibrahim',
            emergencyPhone: '+212 537 350 201',
            message: '',
            status: 'pending',
            createdAt: new Date().toISOString(),
          },
          {
            id: 2,
            studentName: isArabic ? 'فاطمة يوسف' : 'Fatimah Yusuf',
            studentDob: '2017-08-20',
            level: 'primary',
            requestedClass: '2 -B-',
            previousSchool: isArabic ? 'مدرسة الأمل' : 'Al Amal School',
            specialNeeds: '',
            parentName: isArabic ? 'يوسف محمد' : 'Yusuf Muhammad',
            parentEmail: 'yusuf@email.com',
            parentPhone: '+212 537 350 202',
            parentAddress: '123 Street, City',
            parentPassword: 'encrypted_password',
            emergencyContact: isArabic ? 'مريم يوسف' : 'Maryam Yusuf',
            emergencyPhone: '+212 537 350 203',
            message: '',
            status: 'pending',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            id: 3,
            studentName: isArabic ? 'محمد علي' : 'Muhammad Ali',
            studentDob: '2012-03-10',
            level: 'secondary',
            requestedClass: 'Secondary 1 -A-',
            previousSchool: isArabic ? 'مدرسة التوفيق' : 'Al Tawfiq School',
            specialNeeds: '',
            parentName: isArabic ? 'علي حسن' : 'Ali Hassan',
            parentEmail: 'ali@email.com',
            parentPhone: '+212 537 350 204',
            parentAddress: '789 Road, City',
            parentPassword: 'encrypted_password',
            emergencyContact: isArabic ? 'زينب علي' : 'Zainab Ali',
            emergencyPhone: '+212 537 350 205',
            message: '',
            status: 'approved',
            createdAt: new Date(Date.now() - 172800000).toISOString(),
          },
          {
            id: 4,
            studentName: isArabic ? 'عائشة إبراهيم' : 'Aisha Ibrahim',
            studentDob: '2018-11-25',
            level: 'primary',
            requestedClass: '3 -A-',
            previousSchool: '',
            specialNeeds: isArabic ? 'حساسية من المكسرات' : 'Nut allergy',
            parentName: isArabic ? 'إبراهيم أحمد' : 'Ibrahim Ahmad',
            parentEmail: 'ibrahim@email.com',
            parentPhone: '+212 537 350 206',
            parentAddress: '321 Boulevard, City',
            parentPassword: 'encrypted_password',
            emergencyContact: isArabic ? 'أحمد إبراهيم' : 'Ahmad Ibrahim',
            emergencyPhone: '+212 537 350 207',
            message: isArabic ? 'يسعدنا انضمام ابنتنا إلى مدرسة الفتح' : 'We are happy to join Madrassat Al Fath',
            status: 'rejected',
            createdAt: new Date(Date.now() - 259200000).toISOString(),
          },
          {
            id: 5,
            studentName: isArabic ? 'عمر حسن' : 'Omar Hassan',
            studentDob: '2011-09-30',
            level: 'secondary',
            requestedClass: 'Secondary 2 -B-',
            previousSchool: isArabic ? 'مدرسة النجاح' : 'Al Najah School',
            specialNeeds: '',
            parentName: isArabic ? 'حسن عمر' : 'Hassan Omar',
            parentEmail: 'hassan@email.com',
            parentPhone: '+212 537 350 208',
            parentAddress: '654 Lane, City',
            parentPassword: 'encrypted_password',
            emergencyContact: isArabic ? 'هدى حسن' : 'Huda Hassan',
            emergencyPhone: '+212 537 350 209',
            message: '',
            status: 'pending',
            createdAt: new Date(Date.now() - 345600000).toISOString(),
          },
        ];
        allRegistrations = sampleData;
        localStorage.setItem('registration_requests', JSON.stringify(sampleData));
      }

      allRegistrations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setRegistrations(allRegistrations);
      setFilteredRegistrations(allRegistrations);
      console.log('📊 Registrations loaded:', allRegistrations.length);
    } catch (e) {
      console.error('Error loading registrations:', e);
      setRegistrations([]);
      setFilteredRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  // ===== REFRESH =====
  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      loadRegistrations();
      setRefreshing(false);
      notify(
        isArabic ? 'تم تحديث البيانات بنجاح' : 'Data refreshed successfully',
        'info'
      );
    }, 800);
  };

  // ===== LOAD ON MOUNT =====
  useEffect(() => {
    loadRegistrations();

    const handleNewRegistration = (event) => {
      console.log('📢 New registration event received:', event.detail);
      setTimeout(loadRegistrations, 300);
    };

    const handleStorageChange = (event) => {
      if (event.key === 'registrations' || event.key === 'registration_requests') {
        console.log('🔔 Storage changed for:', event.key);
        setTimeout(loadRegistrations, 300);
      }
    };

    window.addEventListener('newRegistration', handleNewRegistration);
    window.addEventListener('registrationSubmitted', handleNewRegistration);
    window.addEventListener('newNotification', handleNewRegistration);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('newRegistration', handleNewRegistration);
      window.removeEventListener('registrationSubmitted', handleNewRegistration);
      window.removeEventListener('newNotification', handleNewRegistration);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isArabic]);

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
    if (sortField !== field) return <FaSort className="ms-1" size={10} />;
    return sortDirection === 'asc' ? <FaSortUp className="ms-1" size={10} /> : <FaSortDown className="ms-1" size={10} />;
  };

  // ===== FILTER =====
  useEffect(() => {
    let filtered = registrations;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.studentName.toLowerCase().includes(query) ||
        r.parentName.toLowerCase().includes(query) ||
        r.parentEmail.toLowerCase().includes(query) ||
        r.level.toLowerCase().includes(query) ||
        r.requestedClass.toLowerCase().includes(query)
      );
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(r => r.status === filterStatus);
    }
    
    if (filterLevel !== 'all') {
      filtered = filtered.filter(r => r.level.toLowerCase() === filterLevel.toLowerCase());
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (sortField) {
        case 'studentName':
          aVal = a.studentName || '';
          bVal = b.studentName || '';
          break;
        case 'parentName':
          aVal = a.parentName || '';
          bVal = b.parentName || '';
          break;
        case 'status':
          aVal = a.status || '';
          bVal = b.status || '';
          break;
        case 'level':
          aVal = a.level || '';
          bVal = b.level || '';
          break;
        case 'createdAt':
        default:
          aVal = new Date(a.createdAt || 0).getTime();
          bVal = new Date(b.createdAt || 0).getTime();
          break;
      }
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    setFilteredRegistrations(filtered);
    setCurrentPage(1);
  }, [searchQuery, filterStatus, filterLevel, registrations, sortField, sortDirection]);

  // ===== PAGINATION =====
  const totalPages = Math.ceil(filteredRegistrations.length / itemsPerPage);
  const displayedRegistrations = filteredRegistrations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ===== STATS =====
  const stats = {
    total: registrations.length,
    pending: registrations.filter(r => r.status === 'pending').length,
    approved: registrations.filter(r => r.status === 'approved').length,
    rejected: registrations.filter(r => r.status === 'rejected').length,
  };

  // ===== STATUS BADGE =====
  const getStatusBadge = (status) => {
    const statuses = {
      pending: { bg: 'warning', icon: <FaClock />, label: isArabic ? 'معلق' : 'Pending' },
      approved: { bg: 'success', icon: <FaCheckCircle />, label: isArabic ? 'مقبول' : 'Approved' },
      rejected: { bg: 'danger', icon: <FaTimesCircle />, label: isArabic ? 'مرفوض' : 'Rejected' },
    };
    return statuses[status] || statuses.pending;
  };

  // ===== LEVEL COLORS =====
  const getLevelColor = (level) => {
    const levels = {
      kindergarden: '#f39c12',
      primary: '#2d6a4f',
      secondary: '#c49a6c',
      high_school: '#6c757d',
    };
    const key = level?.toLowerCase() || '';
    return levels[key] || '#6c757d';
  };

  // ===== GET LEVEL LABEL =====
  const getLevelLabel = (level) => {
    const labels = {
      kindergarden: isArabic ? 'أولي' : 'Kindergarden',
      primary: isArabic ? 'ابتدائي' : 'Primary',
      secondary: isArabic ? 'إعدادي' : 'Secondary',
      high_school: isArabic ? 'ثانوي' : 'High School',
    };
    return labels[level?.toLowerCase()] || level;
  };

  // ===== HANDLE APPROVE =====
const handleApprove = async () => {
  if (!selectedRegistration) return;
  try {
    // Update local storage for registrations
    const registrationsRaw = localStorage.getItem('registrations');
    if (registrationsRaw) {
      const parsed = JSON.parse(registrationsRaw);
      const idx = parsed.findIndex(r => r.id === selectedRegistration.id);
      if (idx !== -1) {
        parsed[idx].status = 'approved';
        parsed[idx].adminNotes = adminNotes || '';
        parsed[idx].classId = selectedClass || null;
        parsed[idx].approvedAt = new Date().toISOString();
        parsed[idx].updatedAt = new Date().toISOString();
        localStorage.setItem('registrations', JSON.stringify(parsed));
      }
    }

    // Also update registration_requests
    const requestsRaw = localStorage.getItem('registration_requests');
    if (requestsRaw) {
      const parsed = JSON.parse(requestsRaw);
      const idx = parsed.findIndex(r => (r.id ?? r._serverId) === selectedRegistration.id);
      if (idx !== -1) {
        parsed[idx].status = 'approved';
        parsed[idx].admin_notes = adminNotes || '';
        parsed[idx].classId = selectedClass || null;
        parsed[idx].approvedAt = new Date().toISOString();
        parsed[idx].updatedAt = new Date().toISOString();
        localStorage.setItem('registration_requests', JSON.stringify(parsed));
      }
    }

    // ===== ADD TO PAYMENT QUEUE =====
    const paymentQueue = JSON.parse(localStorage.getItem('payment_queue') || '[]');
    const paymentEntry = {
      id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      registrationId: selectedRegistration.id,
      studentName: selectedRegistration.studentName,
      level: selectedRegistration.level,
      requestedClass: selectedRegistration.requestedClass || selectedClass || '',
      parentName: selectedRegistration.parentName,
      parentEmail: selectedRegistration.parentEmail,
      parentPhone: selectedRegistration.parentPhone,
      amount: 500, // Default amount - can be configured
      status: 'pending', // pending, paid, cancelled
      createdAt: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      adminNotes: adminNotes || '',
      dateOfBirth: selectedRegistration.studentDob || '',
      gender: selectedRegistration.gender || '',
      address: selectedRegistration.address || selectedRegistration.parentAddress || '',
      city: selectedRegistration.city || '',
      phone: selectedRegistration.parentPhone || '',
    };
    paymentQueue.unshift(paymentEntry);
    localStorage.setItem('payment_queue', JSON.stringify(paymentQueue));
    console.log('✅ Added to payment queue:', paymentEntry);

    setShowApproveModal(false);
    setSelectedRegistration(null);
    setAdminNotes('');
    setSelectedClass('');
    
    notify(
      isArabic 
        ? `✅ تم قبول تسجيل ${selectedRegistration.studentName} وتم إضافته إلى قائمة الدفع`
        : `✅ Registration approved for ${selectedRegistration.studentName} and added to payment queue`,
      'success'
    );
    
    // Dispatch event for payment page to refresh
    window.dispatchEvent(new CustomEvent('paymentQueueUpdated', { 
      detail: { paymentEntry } 
    }));
    window.dispatchEvent(new CustomEvent('newNotification', {
      detail: {
        title: isArabic ? `💰 طلب دفع جديد: ${selectedRegistration.studentName}` : `💰 New Payment Request: ${selectedRegistration.studentName}`,
        message: isArabic ? `تم إضافة ${selectedRegistration.studentName} إلى قائمة الدفع` : `${selectedRegistration.studentName} added to payment queue`,
        type: 'payment',
        link: '/dashboard/admin/payments'
      }
    }));
    
    loadRegistrations();
  } catch (e) {
    console.error('Approve failed:', e);
    notify(
      e.message || (isArabic ? 'فشل قبول التسجيل' : 'Failed to approve registration'),
      'error'
    );
  }
};

  // ===== HANDLE MARK PAID =====
  const handleMarkPaid = async (reg) => {
    try {
      // Update local storage
      const registrationsRaw = localStorage.getItem('registrations');
      if (registrationsRaw) {
        const parsed = JSON.parse(registrationsRaw);
        const idx = parsed.findIndex(r => r.id === reg.id);
        if (idx !== -1) {
          parsed[idx].paymentStatus = 'paid';
          parsed[idx].paymentPaidAt = new Date().toISOString();
          localStorage.setItem('registrations', JSON.stringify(parsed));
        }
      }

      // Also update registration_requests
      const requestsRaw = localStorage.getItem('registration_requests');
      if (requestsRaw) {
        const parsed = JSON.parse(requestsRaw);
        const idx = parsed.findIndex(r => (r.id ?? r._serverId) === reg.id);
        if (idx !== -1) {
          parsed[idx].paymentStatus = 'paid';
          parsed[idx].payment_paid_at = new Date().toISOString();
          localStorage.setItem('registration_requests', JSON.stringify(parsed));
        }
      }

      notify(
        isArabic ? `تم تسجيل دفع الرسوم لـ ${reg.studentName}` : `Payment recorded for ${reg.studentName}`,
        'success'
      );
      
      loadRegistrations();
    } catch (e) {
      console.error('Payment recording failed:', e);
      notify(
        e.message || (isArabic ? 'فشل تسجيل الدفع' : 'Failed to record payment'),
        'error'
      );
    }
  };

  // ===== HANDLE REJECT =====
  const handleReject = async () => {
    if (!selectedRegistration) return;
    try {
      // Update local storage
      const registrationsRaw = localStorage.getItem('registrations');
      if (registrationsRaw) {
        const parsed = JSON.parse(registrationsRaw);
        const idx = parsed.findIndex(r => r.id === selectedRegistration.id);
        if (idx !== -1) {
          parsed[idx].status = 'rejected';
          parsed[idx].adminNotes = adminNotes || '';
          parsed[idx].updatedAt = new Date().toISOString();
          localStorage.setItem('registrations', JSON.stringify(parsed));
        }
      }

      // Also update registration_requests
      const requestsRaw = localStorage.getItem('registration_requests');
      if (requestsRaw) {
        const parsed = JSON.parse(requestsRaw);
        const idx = parsed.findIndex(r => (r.id ?? r._serverId) === selectedRegistration.id);
        if (idx !== -1) {
          parsed[idx].status = 'rejected';
          parsed[idx].admin_notes = adminNotes || '';
          parsed[idx].updatedAt = new Date().toISOString();
          localStorage.setItem('registration_requests', JSON.stringify(parsed));
        }
      }

      setShowRejectModal(false);
      setSelectedRegistration(null);
      setAdminNotes('');
      
      notify(
        isArabic ? `تم رفض تسجيل ${selectedRegistration.studentName}` : `Rejected registration for ${selectedRegistration.studentName}`,
        'warning'
      );
      
      loadRegistrations();
    } catch (e) {
      console.error('Reject failed:', e);
      notify(
        e.message || (isArabic ? 'فشل رفض التسجيل' : 'Failed to reject registration'),
        'error'
      );
    }
  };

  // ===== TOGGLE EXPAND ROW =====
  const toggleExpand = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // ===== STATS CARDS CONFIGURATION =====
  const statsCards = [
    {
      key: 'total',
      icon: <FaUsers size={28} />,
      color: '#4a9eff',
      gradient: 'linear-gradient(135deg, #4a9eff, #2a7f9a)',
      value: formatNumber(stats.total),
      label: isArabic ? 'الإجمالي' : 'Total',
      detail: isArabic ? 'جميع طلبات التسجيل' : 'All registration requests'
    },
    {
      key: 'pending',
      icon: <FaClock size={28} />,
      color: '#f39c12',
      gradient: 'linear-gradient(135deg, #f39c12, #e67e22)',
      value: formatNumber(stats.pending),
      label: isArabic ? 'معلق' : 'Pending',
      detail: isArabic ? 'في انتظار المراجعة' : 'Awaiting review'
    },
    {
      key: 'approved',
      icon: <FaCheckCircle size={28} />,
      color: '#2ecc71',
      gradient: 'linear-gradient(135deg, #2ecc71, #27ae60)',
      value: formatNumber(stats.approved),
      label: isArabic ? 'مقبول' : 'Approved',
      detail: isArabic ? 'تم إنشاء الحسابات' : 'Accounts created'
    },
    {
      key: 'rejected',
      icon: <FaTimesCircle size={28} />,
      color: '#e74c3c',
      gradient: 'linear-gradient(135deg, #e74c3c, #c0392b)',
      value: formatNumber(stats.rejected),
      label: isArabic ? 'مرفوض' : 'Rejected',
      detail: isArabic ? 'طلبات مرفوضة' : 'Rejected requests'
    },
  ];

  // ===== EXPORT FUNCTION =====
  const handleExport = () => {
    try {
      const headers = ['Student Name', 'Level', 'Class', 'Parent Name', 'Parent Email', 'Parent Phone', 'Status', 'Date'];
      const rows = filteredRegistrations.map(r => [
        r.studentName,
        getLevelLabel(r.level),
        r.requestedClass || 'N/A',
        r.parentName,
        r.parentEmail,
        r.parentPhone || 'N/A',
        getStatusBadge(r.status).label,
        new Date(r.createdAt).toLocaleDateString()
      ]);
      
      const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `registrations_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      notify(isArabic ? 'تم تصدير البيانات بنجاح' : 'Data exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting data:', error);
      notify(isArabic ? '❌ حدث خطأ أثناء التصدير' : '❌ Error exporting data', 'error');
    }
  };

  // ===== MOBILE REGISTRATION CARD =====
  const MobileRegistrationCard = ({ registration }) => {
    const statusInfo = getStatusBadge(registration.status);
    const isExpanded = expandedRows[registration.id];
    const levelColor = getLevelColor(registration.level);

    return (
      <div 
        className="mobile-registration-card"
        style={{
          background: darkMode ? '#1a1a2e' : '#ffffff',
          border: `1px solid ${darkMode ? '#2d2d44' : '#e9ecef'}`,
          borderLeft: `4px solid ${levelColor}`,
          borderRadius: '12px',
          marginBottom: '10px',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
        }}
      >
        <div 
          className="mobile-registration-header" 
          onClick={() => toggleExpand(registration.id)}
          style={{ padding: '12px 14px', cursor: 'pointer' }}
        >
          <div className="d-flex align-items-start gap-2">
            <div 
              className="registration-avatar" 
              style={{ 
                background: levelColor,
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: '600',
                fontSize: 'clamp(0.7rem, 0.8vw, 0.85rem)',
                flexShrink: 0,
              }}
            >
              {registration.studentName.charAt(0)}
            </div>
            <div className="flex-grow-1" style={{ minWidth: 0 }}>
              <div className="fw-semibold" style={{ ...arabicFontStyle, fontSize: 'clamp(0.8rem, 1vw, 0.95rem)', color: darkMode ? '#e9ecef' : '#212529' }}>
                {registration.studentName}
              </div>
              <div className="d-flex flex-wrap gap-1 mt-1">
                <Badge bg={statusInfo.bg} className="px-2 py-1" style={{ ...arabicFontStyle, fontSize: 'clamp(0.45rem, 0.55vw, 0.6rem)' }}>
                  {statusInfo.icon} {statusInfo.label}
                </Badge>
                {registration.status === 'approved' && (
                  <Badge
                    bg={registration.paymentStatus === 'paid' ? 'success' : 'warning'}
                    className="px-2 py-1"
                    style={{ ...arabicFontStyle, fontSize: 'clamp(0.45rem, 0.55vw, 0.6rem)' }}
                  >
                    <FaMoneyBillWave size={10} className="me-1" />
                    {registration.paymentStatus === 'paid'
                      ? (isArabic ? 'مدفوع' : 'Paid')
                      : (isArabic ? 'طلب دفع' : 'Payment Requested')}
                  </Badge>
                )}
                <Badge style={{ background: levelColor, color: 'white', ...arabicFontStyle, fontSize: 'clamp(0.45rem, 0.55vw, 0.6rem)' }}>
                  {getLevelLabel(registration.level)}
                </Badge>
                {registration.requestedClass && (
                  <Badge bg="secondary" className="px-2 py-1" style={{ ...arabicFontStyle, fontSize: 'clamp(0.45rem, 0.55vw, 0.6rem)' }}>
                    {registration.requestedClass}
                  </Badge>
                )}
              </div>
            </div>
            <Button variant="link" className="p-0 text-muted" style={{ fontSize: '0.8rem' }}>
              {isExpanded ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
            </Button>
          </div>
        </div>

        {isExpanded && (
          <div className="mobile-registration-body" style={{ padding: '12px 14px 14px', borderTop: `1px solid ${darkMode ? '#2d2d44' : '#e9ecef'}`, background: darkMode ? '#0d1117' : '#f8f9fa' }}>
            <div className="row g-2">
              <div className="col-6">
                <div className="info-label" style={{ ...arabicFontStyle, fontSize: 'clamp(0.5rem, 0.6vw, 0.55rem)', color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
                  {isArabic ? 'ولي الأمر' : 'Parent'}
                </div>
                <div className="info-value" style={{ ...arabicFontStyle, fontSize: 'clamp(0.65rem, 0.75vw, 0.75rem)', fontWeight: '500', color: darkMode ? '#e9ecef' : '#212529' }}>
                  {registration.parentName}
                </div>
              </div>
              <div className="col-6">
                <div className="info-label" style={{ ...arabicFontStyle, fontSize: 'clamp(0.5rem, 0.6vw, 0.55rem)', color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
                  {isArabic ? 'التاريخ' : 'Date'}
                </div>
                <div className="info-value" style={{ ...arabicFontStyle, fontSize: 'clamp(0.65rem, 0.75vw, 0.75rem)', fontWeight: '500', color: darkMode ? '#e9ecef' : '#212529' }}>
                  {new Date(registration.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="row g-2 mt-1">
              <div className="col-6">
                <div className="info-label" style={{ ...arabicFontStyle, fontSize: 'clamp(0.5rem, 0.6vw, 0.55rem)', color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
                  {isArabic ? 'البريد الإلكتروني' : 'Email'}
                </div>
                <div className="info-value small" style={{ ...arabicFontStyle, fontSize: 'clamp(0.55rem, 0.65vw, 0.65rem)', color: darkMode ? '#adb5bd' : '#6c757d' }}>
                  {registration.parentEmail}
                </div>
              </div>
              <div className="col-6">
                <div className="info-label" style={{ ...arabicFontStyle, fontSize: 'clamp(0.5rem, 0.6vw, 0.55rem)', color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
                  {isArabic ? 'الهاتف' : 'Phone'}
                </div>
                <div className="info-value" style={{ ...arabicFontStyle, fontSize: 'clamp(0.65rem, 0.75vw, 0.75rem)', fontWeight: '500', color: darkMode ? '#e9ecef' : '#212529' }}>
                  {registration.parentPhone}
                </div>
              </div>
            </div>
            {registration.message && (
              <div className="mt-2">
                <div className="info-label" style={{ ...arabicFontStyle, fontSize: 'clamp(0.5rem, 0.6vw, 0.55rem)', color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
                  {isArabic ? 'ملاحظات' : 'Notes'}
                </div>
                <div className="info-value small text-muted" style={{ ...arabicFontStyle, fontSize: 'clamp(0.55rem, 0.65vw, 0.65rem)' }}>
                  {registration.message}
                </div>
              </div>
            )}
            <div className="mobile-registration-actions mt-3 d-flex gap-1 flex-wrap">
              <Button 
                variant="outline-primary" 
                size="sm" 
                className="action-btn"
                onClick={() => { setSelectedRegistration(registration); setShowViewModal(true); }}
                style={{ ...arabicFontStyle, borderRadius: '8px' }}
              >
                <FaEye size={12} />
              </Button>
              {registration.status === 'pending' && (
                <>
                  <Button 
                    variant="outline-success" 
                    size="sm" 
                    className="action-btn"
                    onClick={() => { setSelectedRegistration(registration); setShowApproveModal(true); }}
                    style={{ ...arabicFontStyle, borderRadius: '8px' }}
                  >
                    <FaCheckCircle size={12} />
                  </Button>
                  <Button 
                    variant="outline-danger" 
                    size="sm" 
                    className="action-btn"
                    onClick={() => { setSelectedRegistration(registration); setShowRejectModal(true); }}
                    style={{ ...arabicFontStyle, borderRadius: '8px' }}
                  >
                    <FaTimesCircle size={12} />
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <FaSpinner className="spinning" size={40} style={{ color: '#3498db' }} />
        <p className="mt-2 text-muted" style={arabicFontStyle}>{isArabic ? 'جاري التحميل...' : 'Loading...'}</p>
      </div>
    );
  }

  return (
    <div className="registrations-management" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* ===== PAGE HEADER ===== */}
      <div className="page-header d-flex justify-content-between align-items-center flex-wrap gap-2 gap-md-3 mb-3 mb-md-4">
        <div>
          <h4 className="fw-bold mb-0" style={{ ...arabicFontStyle, color: '#1a5f7a', fontSize: 'clamp(1rem, 1.8vw, 1.5rem)' }}>
            <FaUserPlus className="me-2" />
            {isArabic ? 'إدارة طلبات التسجيل' : 'Registration Management'}
          </h4>
          <p className="text-muted mb-0" style={{ ...arabicFontStyle, fontSize: 'clamp(0.7rem, 0.9vw, 0.85rem)' }}>
            {isArabic ? 'مراجعة وإدارة جميع طلبات التسجيل' : 'Review and manage all registration requests'}
          </p>
        </div>
        <div className="d-flex gap-1 gap-sm-2 flex-wrap">
          <Button 
            variant="outline-primary" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
            className="action-btn-responsive"
            style={{ ...arabicFontStyle, borderRadius: '12px', fontSize: 'clamp(0.6rem, 0.8vw, 0.8rem)' }}
          >
            <FaSync className={refreshing ? 'spinning' : ''} /> <span className="d-none d-sm-inline">{isArabic ? 'تحديث' : 'Refresh'}</span>
          </Button>
          <Button 
            variant="outline-secondary" 
            size="sm" 
            onClick={handleExport}
            className="action-btn-responsive"
            style={{ ...arabicFontStyle, borderRadius: '12px', fontSize: 'clamp(0.6rem, 0.8vw, 0.8rem)' }}
          >
            <FaFileExcel className="me-1" /> <span className="d-none d-sm-inline">{isArabic ? 'تصدير' : 'Export'}</span>
          </Button>
        </div>
      </div>

      {/* ===== STATS CARDS ===== */}
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
                <small className="text-muted d-none d-sm-block" style={{ ...arabicFontStyle, fontSize: 'clamp(0.4rem, 0.5vw, 0.55rem)' }}>
                  {stat.detail}
                </small>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* ===== SEARCH & FILTER ===== */}
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
                  placeholder={isArabic ? 'بحث بالاسم أو البريد...' : 'Search by name, email...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-control-sm"
                  style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.6rem, 0.8vw, 0.8rem)' }}
                />
                {searchQuery && (
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setSearchQuery('')}
                    style={{ borderRadius: '0 12px 12px 0' }}
                  >
                    <FaTimesCircle size={12} />
                  </Button>
                )}
              </InputGroup>
            </Col>
            <Col xs={6} sm={3} md={3} lg={3} className="px-1 px-sm-2">
              <Form.Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="form-select-sm"
                style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: 'clamp(0.55rem, 0.7vw, 0.75rem)' }}
              >
                <option value="all">{isArabic ? 'جميع الحالات' : 'All Status'}</option>
                <option value="pending">{isArabic ? 'معلق' : 'Pending'}</option>
                <option value="approved">{isArabic ? 'مقبول' : 'Approved'}</option>
                <option value="rejected">{isArabic ? 'مرفوض' : 'Rejected'}</option>
              </Form.Select>
            </Col>
            <Col xs={6} sm={3} md={3} lg={3} className="px-1 px-sm-2">
              <Form.Select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="form-select-sm"
                style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: 'clamp(0.55rem, 0.7vw, 0.75rem)' }}
              >
                <option value="all">{isArabic ? 'جميع المستويات' : 'All Levels'}</option>
                <option value="kindergarden">{isArabic ? 'أولي' : 'Kindergarden'}</option>
                <option value="primary">{isArabic ? 'ابتدائي' : 'Primary'}</option>
                <option value="secondary">{isArabic ? 'إعدادي' : 'Secondary'}</option>
                <option value="high_school">{isArabic ? 'ثانوي' : 'High School'}</option>
              </Form.Select>
            </Col>
            <Col xs={6} sm={6} md={2} lg={2} className="px-1 px-sm-2">
              <div className="text-muted text-center" style={{ ...arabicFontStyle, fontSize: 'clamp(0.55rem, 0.7vw, 0.75rem)', color: darkMode ? '#adb5bd' : '#6c757d' }}>
                {isArabic ? 'نتائج:' : 'Results:'} <span className="fw-bold" style={{ color: '#4a9eff' }}>{formatNumber(filteredRegistrations.length)}</span>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* ===== REGISTRATIONS TABLE - Desktop ===== */}
      <Card className="modern-card d-none d-md-block" style={{ background: darkMode ? '#1a1a2e' : '#ffffff', borderColor: darkMode ? '#2d2d44' : '#e9ecef' }}>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="mb-0 registrations-table" style={arabicFontStyle}>
              <thead style={{ background: darkMode ? '#0d1117' : '#f8f9fa' }}>
                <tr>
                  <th style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.6rem, 0.8vw, 0.85rem)' }}>
                    {isArabic ? 'الطالب' : 'Student'}
                  </th>
                  <th 
                    onClick={() => handleSort('parentName')}
                    style={{ cursor: 'pointer', color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.6rem, 0.8vw, 0.85rem)' }}
                  >
                    {isArabic ? 'ولي الأمر' : 'Parent'} {getSortIcon('parentName')}
                  </th>
                  <th 
                    onClick={() => handleSort('level')}
                    style={{ cursor: 'pointer', color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.6rem, 0.8vw, 0.85rem)' }}
                    className="d-none d-lg-table-cell"
                  >
                    {isArabic ? 'المستوى' : 'Level'} {getSortIcon('level')}
                  </th>
                  <th style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.6rem, 0.8vw, 0.85rem)' }} className="d-none d-xl-table-cell">
                    {isArabic ? 'الصف' : 'Class'}
                  </th>
                  <th 
                    onClick={() => handleSort('status')}
                    style={{ cursor: 'pointer', color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.6rem, 0.8vw, 0.85rem)' }}
                    className="d-none d-sm-table-cell"
                  >
                    {isArabic ? 'الحالة' : 'Status'} {getSortIcon('status')}
                  </th>
                  <th 
                    onClick={() => handleSort('createdAt')}
                    style={{ cursor: 'pointer', color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.6rem, 0.8vw, 0.85rem)' }}
                    className="d-none d-md-table-cell"
                  >
                    {isArabic ? 'التاريخ' : 'Date'} {getSortIcon('createdAt')}
                  </th>
                  <th className="text-center" style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.6rem, 0.8vw, 0.85rem)' }}>
                    {isArabic ? 'إجراءات' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayedRegistrations.map((reg) => {
                  const statusInfo = getStatusBadge(reg.status);
                  const levelColor = getLevelColor(reg.level);
                  return (
                    <tr key={reg.id} className="registration-row">
                      <td>
                        <div className="d-flex align-items-center gap-1 gap-md-2">
                          <div 
                            className="registration-avatar-sm" 
                            style={{ 
                              background: levelColor,
                              width: 'clamp(28px, 3vw, 32px)',
                              height: 'clamp(28px, 3vw, 32px)',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: '600',
                              fontSize: 'clamp(0.6rem, 0.7vw, 0.75rem)',
                              flexShrink: 0,
                            }}
                          >
                            {reg.studentName.charAt(0)}
                          </div>
                          <div>
                            <div className="fw-semibold" style={{ ...arabicFontStyle, fontSize: 'clamp(0.7rem, 0.85vw, 0.9rem)', color: darkMode ? '#e9ecef' : '#212529' }}>
                              {reg.studentName}
                            </div>
                            {reg.status === 'pending' && (
                              <Badge bg="info" className="ms-1" style={{ ...arabicFontStyle, fontSize: 'clamp(0.4rem, 0.5vw, 0.5rem)' }}>
                                {isArabic ? 'جديد' : 'New'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ ...arabicFontStyle, fontSize: 'clamp(0.65rem, 0.8vw, 0.8rem)', color: darkMode ? '#e9ecef' : '#212529' }}>
                        {reg.parentName}
                      </td>
                      <td className="d-none d-lg-table-cell">
                        <Badge style={{ background: levelColor, color: 'white', ...arabicFontStyle, fontSize: 'clamp(0.45rem, 0.55vw, 0.6rem)' }}>
                          {getLevelLabel(reg.level)}
                        </Badge>
                      </td>
                      <td className="d-none d-xl-table-cell">
                        {reg.requestedClass && (
                          <Badge bg="secondary" style={{ ...arabicFontStyle, fontSize: 'clamp(0.45rem, 0.55vw, 0.6rem)' }}>
                            {reg.requestedClass}
                          </Badge>
                        )}
                      </td>
                      <td className="d-none d-sm-table-cell">
                        <Badge bg={statusInfo.bg} className="px-2 py-1" style={{ ...arabicFontStyle, fontSize: 'clamp(0.45rem, 0.55vw, 0.6rem)' }}>
                          {statusInfo.icon} {statusInfo.label}
                        </Badge>
                        {reg.status === 'approved' && (
                          <Badge
                            bg={reg.paymentStatus === 'paid' ? 'success' : 'warning'}
                            className="ms-1 px-2 py-1"
                            style={{ ...arabicFontStyle, fontSize: 'clamp(0.4rem, 0.5vw, 0.55rem)' }}
                          >
                            <FaMoneyBillWave size={8} className="me-1" />
                            {reg.paymentStatus === 'paid'
                              ? (isArabic ? 'مدفوع' : 'Paid')
                              : (isArabic ? 'طلب دفع' : 'Payment Requested')}
                          </Badge>
                        )}
                      </td>
                      <td className="d-none d-md-table-cell" style={{ ...arabicFontStyle, fontSize: 'clamp(0.65rem, 0.8vw, 0.8rem)', color: darkMode ? '#e9ecef' : '#212529' }}>
                        {new Date(reg.createdAt).toLocaleDateString()}
                      </td>
                      <td className="text-center">
                        <div className="d-flex gap-1 justify-content-center flex-wrap">
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            className="action-btn" 
                            onClick={() => { setSelectedRegistration(reg); setShowViewModal(true); }}
                            title={isArabic ? 'عرض' : 'View'}
                          >
                            <FaEye size={12} />
                          </Button>
                          {reg.status === 'pending' && (
                            <>
                              <Button 
                                variant="outline-success" 
                                size="sm" 
                                className="action-btn" 
                                onClick={() => { setSelectedRegistration(reg); setShowApproveModal(true); }}
                                title={isArabic ? 'قبول' : 'Approve'}
                              >
                                <FaCheckCircle size={12} />
                              </Button>
                              <Button 
                                variant="outline-danger" 
                                size="sm" 
                                className="action-btn" 
                                onClick={() => { setSelectedRegistration(reg); setShowRejectModal(true); }}
                                title={isArabic ? 'رفض' : 'Reject'}
                              >
                                <FaTimesCircle size={12} />
                              </Button>
                            </>
                          )}
                          {reg.status === 'approved' && reg.paymentStatus !== 'paid' && (
                            <Button 
                              variant="outline-info" 
                              size="sm" 
                              className="action-btn" 
                              onClick={() => handleMarkPaid(reg)}
                              title={isArabic ? 'تسجيل الدفع' : 'Mark as Paid'}
                            >
                              <FaMoneyBillWave size={12} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
          {displayedRegistrations.length === 0 && (
            <div className="text-center py-4">
              <p className="text-muted" style={arabicFontStyle}>
                {isArabic ? 'لا توجد طلبات تسجيل' : 'No registration requests found'}
              </p>
            </div>
          )}
        </Card.Body>
        {!loading && filteredRegistrations.length > 0 && (
          <Card.Footer className="d-flex justify-content-between align-items-center py-2 flex-wrap gap-2" style={{ borderColor: darkMode ? '#2d2d44' : '#e9ecef' }}>
            <div className="text-muted small" style={{ ...arabicFontStyle, fontSize: 'clamp(0.55rem, 0.7vw, 0.75rem)' }}>
              {isArabic ? `عرض ${displayedRegistrations.length} من ${filteredRegistrations.length}` : `Showing ${displayedRegistrations.length} of ${filteredRegistrations.length}`}
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

      {/* ===== MOBILE REGISTRATION CARDS ===== */}
      <div className="d-md-none">
        {displayedRegistrations.map((reg) => (
          <MobileRegistrationCard key={reg.id} registration={reg} />
        ))}
        {displayedRegistrations.length === 0 && (
          <div className="text-center py-4">
            <p className="text-muted" style={arabicFontStyle}>
              {isArabic ? 'لا توجد طلبات تسجيل' : 'No registration requests found'}
            </p>
          </div>
        )}
        {totalPages > 1 && (
          <div className="d-flex justify-content-center mt-3">
            <Pagination size="sm" className="responsive-pagination">
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
          </div>
        )}
      </div>

      {/* ===== VIEW MODAL ===== */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} centered size="lg" className="modern-modal">
        <Modal.Header closeButton style={{ borderBottom: darkMode ? '1px solid #2d2d44' : '1px solid #e9ecef' }}>
          <Modal.Title style={arabicFontStyle}>
            <FaUserPlus className="me-2 text-primary" />
            {isArabic ? 'تفاصيل طلب التسجيل' : 'Registration Request Details'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? '#1a1a2e' : '#ffffff', maxHeight: '70vh', overflowY: 'auto' }}>
          {selectedRegistration && (
            <div style={arabicFontStyle}>
              <h6 className="fw-bold text-primary" style={{ fontSize: 'clamp(0.8rem, 1vw, 1rem)' }}>
                {isArabic ? 'معلومات الطالب' : 'Student Information'}
              </h6>
              <Row className="mb-2"><Col md={4}><strong className="text-muted">{isArabic ? 'الاسم الكامل' : 'Full Name'}</strong></Col><Col md={8}><span className="fw-semibold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{selectedRegistration.studentName}</span></Col></Row>
              <Row className="mb-2"><Col md={4}><strong className="text-muted">{isArabic ? 'تاريخ الميلاد' : 'Date of Birth'}</strong></Col><Col md={8}><span style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{selectedRegistration.studentDob ? new Date(selectedRegistration.studentDob).toLocaleDateString() : '-'}</span></Col></Row>
              <Row className="mb-2"><Col md={4}><strong className="text-muted">{isArabic ? 'مكان الميلاد' : 'Place of Birth'}</strong></Col><Col md={8}><span style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{selectedRegistration.placeOfBirth || '-'}</span></Col></Row>
              <Row className="mb-2"><Col md={4}><strong className="text-muted">{isArabic ? 'الجنس' : 'Gender'}</strong></Col><Col md={8}><span style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{selectedRegistration.gender ? (isArabic ? (selectedRegistration.gender === 'male' ? 'ذكر' : 'أنثى') : selectedRegistration.gender) : '-'}</span></Col></Row>
              <Row className="mb-2"><Col md={4}><strong className="text-muted">{isArabic ? 'الجنسية' : 'Nationality'}</strong></Col><Col md={8}><span style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{selectedRegistration.nationality || '-'}</span></Col></Row>
              <Row className="mb-2"><Col md={4}><strong className="text-muted">{isArabic ? 'العنوان' : 'Address'}</strong></Col><Col md={8}><span style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{selectedRegistration.address || '-'}</span></Col></Row>
              <Row className="mb-2"><Col md={4}><strong className="text-muted">{isArabic ? 'المدينة' : 'City'}</strong></Col><Col md={8}><span style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{selectedRegistration.city || '-'}</span></Col></Row>

              <hr />

              <h6 className="fw-bold text-success" style={{ fontSize: 'clamp(0.8rem, 1vw, 1rem)' }}>
                {isArabic ? 'معلومات التسجيل' : 'Admission Information'}
              </h6>
              <Row className="mb-2"><Col md={4}><strong className="text-muted">{isArabic ? 'السنة الدراسية' : 'Academic Year'}</strong></Col><Col md={8}><span style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{selectedRegistration.academicYear || '-'}</span></Col></Row>
              <Row className="mb-2"><Col md={4}><strong className="text-muted">{isArabic ? 'المستوى' : 'Level'}</strong></Col><Col md={8}><span style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{getLevelLabel(selectedRegistration.level)}</span></Col></Row>
              <Row className="mb-2"><Col md={4}><strong className="text-muted">{isArabic ? 'الصف المطلوب' : 'Requested Class'}</strong></Col><Col md={8}><span style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{selectedRegistration.requestedClass || '-'}</span></Col></Row>
              <Row className="mb-2"><Col md={4}><strong className="text-muted">{isArabic ? 'نوع التسجيل' : 'Admission Type'}</strong></Col><Col md={8}><span style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{selectedRegistration.admissionType || '-'}</span></Col></Row>

              <hr />

              <h6 className="fw-bold text-warning" style={{ fontSize: 'clamp(0.8rem, 1vw, 1rem)' }}>
                {isArabic ? 'معلومات ولي الأمر' : 'Parent/Guardian Information'}
              </h6>
              <Row className="mb-2"><Col md={4}><strong className="text-muted">{isArabic ? 'الاسم' : 'Name'}</strong></Col><Col md={8}><span className="fw-semibold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{selectedRegistration.parentName}</span></Col></Row>
              <Row className="mb-2"><Col md={4}><strong className="text-muted">{isArabic ? 'العلاقة' : 'Relationship'}</strong></Col><Col md={8}><span style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{selectedRegistration.relationship || '-'}</span></Col></Row>
              <Row className="mb-2"><Col md={4}><strong className="text-muted"><FaEnvelope className="me-1" /> {isArabic ? 'البريد الإلكتروني' : 'Email'}</strong></Col><Col md={8}><span style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{selectedRegistration.parentEmail}</span></Col></Row>
              <Row className="mb-2"><Col md={4}><strong className="text-muted"><FaPhone className="me-1" /> {isArabic ? 'رقم الهاتف' : 'Phone'}</strong></Col><Col md={8}><span style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{selectedRegistration.parentPhone}</span></Col></Row>
              <Row className="mb-2"><Col md={4}><strong className="text-muted">{isArabic ? 'العنوان' : 'Address'}</strong></Col><Col md={8}><span style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{selectedRegistration.parentAddress}</span></Col></Row>
              <Row className="mb-2"><Col md={4}><strong className="text-muted">{isArabic ? 'رقم البطاقة الوطنية' : 'CIN/ID'}</strong></Col><Col md={8}><span style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{selectedRegistration.cinId || '-'}</span></Col></Row>

              <hr />

              <h6 className="fw-bold text-danger" style={{ fontSize: 'clamp(0.8rem, 1vw, 1rem)' }}>
                {isArabic ? 'جهة اتصال الطوارئ' : 'Emergency Contact'}
              </h6>
              <Row className="mb-2"><Col md={4}><strong className="text-muted">{isArabic ? 'الاسم' : 'Name'}</strong></Col><Col md={8}><span style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{selectedRegistration.emergencyContact || '-'}</span></Col></Row>
              <Row className="mb-2"><Col md={4}><strong className="text-muted">{isArabic ? 'العلاقة' : 'Relationship'}</strong></Col><Col md={8}><span style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{selectedRegistration.emergencyRelationship || '-'}</span></Col></Row>
              <Row className="mb-2"><Col md={4}><strong className="text-muted"><FaPhone className="me-1" /> {isArabic ? 'رقم الهاتف' : 'Phone'}</strong></Col><Col md={8}><span style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{selectedRegistration.emergencyPhone || '-'}</span></Col></Row>

              <hr />

              <h6 className="fw-bold text-secondary" style={{ fontSize: 'clamp(0.8rem, 1vw, 1rem)' }}>
                {isArabic ? 'ملاحظات إضافية' : 'Additional Notes'}
              </h6>
              <Row className="mb-2"><Col md={4}><strong className="text-muted">{isArabic ? 'الملاحظات' : 'Notes'}</strong></Col><Col md={8}><span style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{selectedRegistration.message || '-'}</span></Col></Row>
              <Row className="mb-2"><Col md={4}><strong className="text-muted">{isArabic ? 'الموافقة على الشروط' : 'Terms Agreed'}</strong></Col><Col md={8}><span style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{selectedRegistration.termsAgreed ? (isArabic ? 'نعم' : 'Yes') : (isArabic ? 'لا' : 'No')}</span></Col></Row>

              <hr />

              <h6 className="fw-bold" style={{ fontSize: 'clamp(0.8rem, 1vw, 1rem)' }}>
                {isArabic ? 'حالة الطلب' : 'Status'}
              </h6>
              <Row className="mb-2"><Col md={4}><strong className="text-muted">{isArabic ? 'الحالة' : 'Status'}</strong></Col><Col md={8}><Badge bg={getStatusBadge(selectedRegistration.status).bg} style={arabicFontStyle}>{getStatusBadge(selectedRegistration.status).label}</Badge></Col></Row>
              <Row className="mb-2"><Col md={4}><strong className="text-muted">{isArabic ? 'ملاحظات الإدارة' : 'Admin Notes'}</strong></Col><Col md={8}><span style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{selectedRegistration.admin_notes || '-'}</span></Col></Row>
              <Row className="mb-2"><Col md={4}><strong className="text-muted">{isArabic ? 'تاريخ التقديم' : 'Submitted At'}</strong></Col><Col md={8}><span style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{selectedRegistration.createdAt ? new Date(selectedRegistration.createdAt).toLocaleString() : '-'}</span></Col></Row>

              {selectedRegistration.status === 'pending' && (
                <div className="mt-3 d-flex gap-2 flex-wrap">
                  <Button variant="success" onClick={() => { setShowViewModal(false); setShowApproveModal(true); }} style={{ ...arabicFontStyle, borderRadius: '12px' }}>
                    <FaCheckCircle className="me-2" /> {isArabic ? 'قبول وإنشاء حساب' : 'Approve & Create Account'}
                  </Button>
                  <Button variant="danger" onClick={() => { setShowViewModal(false); setShowRejectModal(true); }} style={{ ...arabicFontStyle, borderRadius: '12px' }}>
                    <FaTimesCircle className="me-2" /> {isArabic ? 'رفض' : 'Reject'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer style={{ borderTop: darkMode ? '1px solid #2d2d44' : '1px solid #e9ecef' }}>
          <Button variant="secondary" onClick={() => setShowViewModal(false)} style={{ ...arabicFontStyle, borderRadius: '12px', fontSize: 'clamp(0.7rem, 0.9vw, 0.9rem)' }}>
            {isArabic ? 'إغلاق' : 'Close'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===== APPROVE MODAL ===== */}
      <Modal show={showApproveModal} onHide={() => setShowApproveModal(false)} centered size="lg" className="modern-modal">
        <Modal.Header closeButton style={{ borderTop: darkMode ? '1px solid #2d2d44' : '1px solid #e9ecef' }}>
          <Modal.Title style={arabicFontStyle}>
            <FaCheckCircle className="me-2 text-success" />
            {isArabic ? 'قبول طلب التسجيل' : 'Approve Registration'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? '#1a1a2e' : '#ffffff' }}>
          {selectedRegistration && (
            <>
              <Alert variant="success" style={{ borderRadius: '12px' }}>
                <FaInfoCircle className="me-2" />
                <span style={arabicFontStyle}>
                  {isArabic
                    ? 'سيتم إنشاء حساب ولي الأمر وإرسال بيانات الدخول إلى البريد الإلكتروني.'
                    : 'A parent account will be created and login credentials will be sent to the email.'}
                </span>
              </Alert>

              <Row className="g-3 mb-3">
                <Col md={6}>
                  <div className="detail-item">
                    <label className="text-muted small" style={arabicFontStyle}>{isArabic ? 'الطالب' : 'Student'}</label>
                    <p className="fw-semibold mb-0" style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>{selectedRegistration.studentName}</p>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="detail-item">
                    <label className="text-muted small" style={arabicFontStyle}>{isArabic ? 'المستوى' : 'Level'}</label>
                    <p className="fw-semibold mb-0" style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>{getLevelLabel(selectedRegistration.level)}</p>
                  </div>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>{isArabic ? 'اختيار الفصل' : 'Select Class'}</Form.Label>
                <Form.Select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px' }}
                >
                  <option value="">{isArabic ? 'اختر الفصل' : 'Select Class'}</option>
                  {classList.map((cls) => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </Form.Select>
                {selectedRegistration.requestedClass && (
                  <Form.Text className="text-muted" style={arabicFontStyle}>
                    {isArabic ? 'الطلب المطلوب: ' : 'Requested: '} {selectedRegistration.requestedClass}
                  </Form.Text>
                )}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>{isArabic ? 'ملاحظات الإدارة' : 'Admin Notes'}</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={isArabic ? 'أدخل ملاحظاتك هنا...' : 'Enter your notes here...'}
                  style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px' }}
                />
              </Form.Group>

              <Alert variant="info" style={{ borderRadius: '12px' }}>
                <FaCheckCircle className="me-2 text-success" />
                <span style={arabicFontStyle}>
                  {isArabic
                    ? 'سيتم إرسال بريد إلكتروني إلى ولي الأمر يحتوي على بيانات الدخول.'
                    : 'An email will be sent to the parent with login credentials.'}
                </span>
              </Alert>
            </>
          )}
        </Modal.Body>
        <Modal.Footer style={{ borderTop: darkMode ? '1px solid #2d2d44' : '1px solid #e9ecef' }}>
          <Button variant="secondary" onClick={() => setShowApproveModal(false)} style={{ ...arabicFontStyle, borderRadius: '12px', fontSize: 'clamp(0.7rem, 0.9vw, 0.9rem)' }}>
            {isArabic ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button variant="success" onClick={handleApprove} style={{ ...arabicFontStyle, borderRadius: '12px', fontSize: 'clamp(0.7rem, 0.9vw, 0.9rem)' }}>
            <FaCheckCircle className="me-2" /> {isArabic ? 'قبول وإنشاء حساب' : 'Approve & Create Account'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===== REJECT MODAL ===== */}
      <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)} centered className="modern-modal">
        <Modal.Header closeButton style={{ borderTop: darkMode ? '1px solid #2d2d44' : '1px solid #e9ecef' }}>
          <Modal.Title style={arabicFontStyle}>
            <FaTimesCircle className="me-2 text-danger" />
            {isArabic ? 'رفض طلب التسجيل' : 'Reject Registration'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? '#1a1a2e' : '#ffffff' }}>
          {selectedRegistration && (
            <>
              <p style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                {isArabic
                  ? `هل أنت متأكد من رفض طلب تسجيل ${selectedRegistration.studentName}؟`
                  : `Are you sure you want to reject the registration request for ${selectedRegistration.studentName}?`}
              </p>
              <Form.Group className="mb-3">
                <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>{isArabic ? 'سبب الرفض' : 'Reason for Rejection'}</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={isArabic ? 'أدخل سبب الرفض هنا...' : 'Enter reason for rejection here...'}
                  style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px' }}
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer style={{ borderTop: darkMode ? '1px solid #2d2d44' : '1px solid #e9ecef' }}>
          <Button variant="secondary" onClick={() => setShowRejectModal(false)} style={{ ...arabicFontStyle, borderRadius: '12px', fontSize: 'clamp(0.7rem, 0.9vw, 0.9rem)' }}>
            {isArabic ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button variant="danger" onClick={handleReject} style={{ ...arabicFontStyle, borderRadius: '12px', fontSize: 'clamp(0.7rem, 0.9vw, 0.9rem)' }}>
            <FaTimesCircle className="me-2" /> {isArabic ? 'تأكيد الرفض' : 'Confirm Reject'}
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
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
        
        .spinning {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .modern-modal .modal-content {
          border-radius: 20px !important;
          border: none !important;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
          overflow: hidden;
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

        .modern-card {
          border-radius: 16px;
          border: none;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          transition: all 0.3s;
        }

        .detail-item {
          margin-bottom: 12px;
        }
        .detail-item label {
          display: block;
          font-size: clamp(0.6rem, 0.7vw, 0.7rem);
          color: #6c757d;
          margin-bottom: 2px;
          font-weight: 500;
        }
        .detail-item p {
          font-size: clamp(0.8rem, 0.95vw, 0.9rem);
          margin-bottom: 0;
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
          .page-header {
            flex-direction: column;
            align-items: stretch !important;
          }
          .page-header h4 {
            font-size: 0.85rem !important;
          }
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
          .stats-card-enhanced .d-none {
            display: none !important;
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
        [dir="rtl"] .form-select {
          background-position: left 0.75rem center !important;
          padding-right: 0.75rem !important;
          padding-left: 2rem !important;
        }
        [dir="rtl"] .modal-header .btn-close {
          margin-left: 0 !important;
          margin-right: auto !important;
        }
      `}</style>
    </div>
  );
};

export default RegistrationsManagement;