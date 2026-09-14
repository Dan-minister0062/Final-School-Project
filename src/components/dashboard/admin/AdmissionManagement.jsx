// src/components/dashboard/admin/AdmissionManagement.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Badge,
  Spinner,
  Alert,
  Modal,
  Form,
  InputGroup,
  Pagination,
  OverlayTrigger,
  Tooltip,
} from 'react-bootstrap';
import {
  FaEye,
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaFilter,
  FaSearch,
  FaInfoCircle,
  FaExclamationTriangle,
  FaFileAlt,
  FaUsers,
  FaSync,
  FaSpinner,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaUserGraduate,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaCity,
  FaBirthdayCake,
  FaVenusMars,
  FaGlobe,
  FaIdCard,
  FaUserTie,
  FaHandshake,
  FaPhoneAlt,
  FaSchool,
  FaGraduationCap,
  FaBuilding,
  FaCalendarAlt,
  FaClipboardList,
  FaUserPlus,
  FaLock,
  FaUnlock,
  FaSave,
  FaUserCircle,
} from 'react-icons/fa';
import { useLanguage } from '../../../context/LanguageContext';
import { getTranslation } from '../../../utils/translations';
import { useNotification } from '../../../hooks/useNotification';
import api from '../../../services/api';
import { syncGet, syncSend } from '../../../services/apiSync';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

// ===== FORMAT NUMBER - MUST BE DEFINED BEFORE COMPONENT =====
const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  return num.toString();
};

// ===== Safe date formatting (never crashes the view modal) =====
const safeFormatDate = (value, dateFormat) => {
  try {
    if (!value) return '-';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '-';
    return format(d, dateFormat);
  } catch {
    return '-';
  }
};

// ===== Validation schema for edit modal =====
const editSchema = yup.object().shape({
  studentName: yup.string().required('Student name is required'),
  dob: yup.string().required('Date of birth is required'),
  level: yup.string().required('Level is required'),
  previousSchool: yup.string().nullable(),
  specialNeeds: yup.string().nullable(),
  placeOfBirth: yup.string().nullable(),
  gender: yup.string().nullable(),
  nationality: yup.string().nullable(),
  address: yup.string().nullable(),
  city: yup.string().nullable(),
  academicYear: yup.string().nullable(),
  requestedClass: yup.string().nullable(),
  admissionType: yup.string().nullable(),
  parentName: yup.string().required('Parent name is required'),
  parentEmail: yup.string().email('Invalid email').required('Email is required'),
  parentPhone: yup.string().required('Phone is required'),
  parentAddress: yup.string().required('Address is required'),
  parentPassword: yup.string().nullable(),
  relationship: yup.string().nullable(),
  cinId: yup.string().nullable(),
  emergencyContact: yup.string().nullable(),
  emergencyRelationship: yup.string().nullable(),
  emergencyPhone: yup.string().nullable(),
  message: yup.string().nullable(),
  hasAttendedBefore: yup.boolean().nullable(),
  previousGrade: yup.string().nullable(),
  lastAcademicYear: yup.string().nullable(),
  specialAssistance: yup.boolean().nullable(),
  authorizedPickup: yup.string().nullable(),
  massarNumber: yup.string().nullable(),
  academicTrack: yup.string().nullable(),
});

const AdmissionManagement = () => {
  const { language, isArabic } = useLanguage();
  const t = (key) => getTranslation(key, language);
  const { notify } = useNotification();

  // ---- State ----
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [actionLoading, setActionLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [classesList, setClassesList] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const fullListRef = useRef([]);

  // ---- React Hook Form for edit ----
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(editSchema),
  });

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

  // ===== Check mobile =====
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ===== ARABIC FONT STYLE =====
  const arabicFontStyle = {
    fontFamily: isArabic
      ? '"Hacen Tunisia", "Hacen Tunisia Bd", "Noto Sans Arabic", "Vazirmatn", "Traditional Arabic", "Arabic Typesetting", serif'
      : 'inherit',
    lineHeight: isArabic ? '1.8' : '1.6',
    letterSpacing: isArabic ? '0.5px' : '0px',
    fontSize: isArabic
      ? 'clamp(0.85rem, 1.1vw, 1.05rem)'
      : 'clamp(0.8rem, 1vw, 1rem)',
  };

  // ===== Build the snake_case payload for server-backed admission edits =====
  const buildServerEditPayload = (data, requestedClassName, requestedClassId) => {
    const nameParts = String(data.studentName || '').trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    return {
      first_name: firstName,
      last_name: lastName,
      studentName: data.studentName ?? undefined,
      dob: data.dob || null,
      level: data.level ?? null,
      previous_school: data.previousSchool || null,
      special_needs: data.specialNeeds || null,
      place_of_birth: data.placeOfBirth || null,
      gender: data.gender || null,
      nationality: data.nationality || null,
      address: data.address || null,
      city: data.city || null,
      academic_year: data.academicYear || null,
      requested_class: requestedClassName || data.requestedClass || null,
      admission_type: data.admissionType || null,
      parent_name: data.parentName || null,
      relationship: data.relationship || null,
      parent_phone: data.parentPhone || '',
      parent_email: data.parentEmail || '',
      parent_address: data.parentAddress || null,
      cin_id: data.cinId || null,
      parent_password: data.parentPassword || null,
      emergency_contact: data.emergencyContact || null,
      emergency_relationship: data.emergencyRelationship || null,
      emergency_phone: data.emergencyPhone || null,
      additional_notes: data.message || null,
      terms_agreed: true,
      has_attended_before: !!data.hasAttendedBefore,
      previous_grade: data.previousGrade || null,
      last_academic_year: data.lastAcademicYear || null,
      special_assistance: !!data.specialAssistance,
      authorized_pickup: data.authorizedPickup || null,
      massar_number: data.massarNumber || null,
      academic_track: data.academicTrack || null,
      admin_notes: data.adminNotes || null,
    };
  };

  // ---- Fetch admissions from API ----
  const fetchAdmissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const serverRes = await syncGet('/registrations');
      const serverRows = Array.isArray(serverRes?.data) ? serverRes.data : [];

      const normalized = serverRows.map((r) => ({
        ...r,
        id: r._serverId ?? r.id,
        _serverId: r._serverId ?? r.id,
        studentName: r.studentName || r.full_name || `${r.first_name || ''} ${r.last_name || ''}`.trim() || 'Unknown Student',
        dob: r.dob || r.dateOfBirth || null,
        studentPhoto: r.studentPhoto || null,
        academicYear: r.academic_year || r.academicYear || '',
        level: r.level || '',
        requestedClass: r.requested_class || r.requestedClass || '',
        admissionType: r.admission_type || r.admissionType || '',
        parentName: r.parent_name || r.parentName || '',
        relationship: r.relationship || '',
        parentEmail: r.parent_email || r.parentEmail || '',
        parentPhone: r.parent_phone || r.parentPhone || '',
        parentAddress: r.parent_address || r.parentAddress || '',
        cinId: r.cin_id || r.cinId || '',
        parentPassword: r.parent_password || r.parentPassword || '',
        emergencyContact: r.emergency_contact || r.emergencyContact || '',
        emergencyRelationship: r.emergency_relationship || r.emergencyRelationship || '',
        emergencyPhone: r.emergency_phone || r.emergencyPhone || '',
        message: r.additional_notes || r.message || '',
        previousSchool: r.previous_school || r.previousSchool || '',
        specialNeeds: r.special_needs || r.specialNeeds || '',
        hasAttendedBefore: r.has_attended_before ?? r.hasAttendedBefore ?? false,
        specialAssistance: r.special_assistance ?? r.specialAssistance ?? false,
        authorizedPickup: r.authorized_pickup || r.authorizedPickup || '',
        previousGrade: r.previous_grade || r.previousGrade || '',
        lastAcademicYear: r.last_academic_year || r.lastAcademicYear || '',
        reportCard: r.reportCard || null,
        schoolCertificate: r.schoolCertificate || null,
        massarNumber: r.massar_number || r.massarNumber || '',
        academicTrack: r.academic_track || r.academicTrack || '',
        termsAgreed: r.terms_agreed ?? true,
        status: r.status || 'pending',
        adminNotes: r.admin_notes || r.adminNotes || '',
        classId: r.classId || r.class_id || null,
        paymentStatus: r.payment_status || r.paymentStatus || null,
        paymentAmount: r.payment_amount ?? r.paymentAmount ?? null,
        paymentRequestedAt: r.payment_requested_at || r.paymentRequestedAt || null,
        paymentPaidAt: r.payment_paid_at || r.paymentPaidAt || null,
        createdAt: r.submitted_at || r.createdAt || new Date().toISOString(),
        updatedAt: r.updatedAt || r.createdAt || new Date().toISOString(),
      }));

      fullListRef.current = normalized;

      let filtered = normalized;
      if (filterStatus !== 'all') {
        filtered = filtered.filter(a => a.status === filterStatus);
      }
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(a =>
          a.studentName.toLowerCase().includes(term) ||
          a.parentName.toLowerCase().includes(term) ||
          a.parentEmail.toLowerCase().includes(term)
        );
      }

      filtered.sort((a, b) => {
        let aVal = a[sortBy] || '';
        let bVal = b[sortBy] || '';
        if (sortBy === 'createdAt') {
          aVal = new Date(a.createdAt);
          bVal = new Date(b.createdAt);
        } else {
          aVal = String(aVal).toLowerCase();
          bVal = String(bVal).toLowerCase();
        }
        if (sortOrder === 'asc') return aVal > bVal ? 1 : -1;
        return aVal < bVal ? 1 : -1;
      });

      const pageSize = 10;
      const start = (currentPage - 1) * pageSize;
      const end = start + pageSize;
      const paginated = filtered.slice(start, end);

      setAdmissions(paginated);
      setTotalPages(Math.max(1, Math.ceil(filtered.length / pageSize)));

      const pending = normalized.filter(a => a.status === 'pending').length;
      const approved = normalized.filter(a => a.status === 'approved').length;
      const rejected = normalized.filter(a => a.status === 'rejected').length;
      setStats({ total: normalized.length, pending, approved, rejected });

      console.log('📊 Admissions loaded:', { total: normalized.length, pending, approved, rejected, displayed: paginated.length });
    } catch (err) {
      console.error('Error fetching admissions:', err);
      setAdmissions([]);
      setTotalPages(1);
      notify(err.message || (isArabic ? 'فشل تحميل الطلبات' : 'Failed to load admissions'), 'error');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filterStatus, searchTerm, sortBy, sortOrder, notify, isArabic]);

  // ---- Load available classes ----
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const res = await api.get('/admin/classes');
        const data = Array.isArray(res.data?.data) ? res.data.data : [];
        if (data.length) {
          setClassesList(data);
          return;
        }
        throw new Error('empty');
      } catch (e) {
        const fallback = [
          ['kindergarden', 'Kindergarden', ['Introductory', 'Preparatory 1 -A-', 'Preparatory 1 -B-', 'Preparatory 2 -A-', 'Preparatory 2 -B-']],
          ['primary', 'Primary', ['1 -A-', '1 -B-', '2 -A-', '2 -B-', '3 -A-', '3 -B-', '4 -A-', '4 -B-', '5 -A-', '5 -B-', '6 -A-', '6 -B-']],
          ['secondary', 'Secondary', ['Secondary 1 -A-', 'Secondary 1 -B-', 'Secondary 2 -A-', 'Secondary 2 -B-', 'Secondary 3 -A-', 'Secondary 3 -B-']],
          ['high_school', 'High School', ['Common Core Science', '1st Baccalaureate Experimental Sciences', '2nd Baccalaureate Physical Sciences']],
        ];
        setClassesList(
          fallback.flatMap(([levelKey, level, names]) =>
            names.map((n) => ({ id: n, name: n, level, level_key: levelKey }))
          )
        );
      }
    };
    loadClasses();
  }, [isArabic]);

  // ---- Fetch on mount and when dependencies change ----
  useEffect(() => {
    fetchAdmissions();
  }, [fetchAdmissions]);

  // ---- Listen for custom events ----
  useEffect(() => {
    const handleRegistrationSubmitted = () => {
      console.log('📝 Registration submitted event received');
      setTimeout(fetchAdmissions, 300);
    };
    window.addEventListener('registrationSubmitted', handleRegistrationSubmitted);
    window.addEventListener('newNotification', handleRegistrationSubmitted);
    
    return () => {
      window.removeEventListener('registrationSubmitted', handleRegistrationSubmitted);
      window.removeEventListener('newNotification', handleRegistrationSubmitted);
    };
  }, [fetchAdmissions]);

  // ---- Refresh handler ----
  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      fetchAdmissions();
      setRefreshing(false);
      notify(
        isArabic ? 'تم تحديث البيانات بنجاح' : 'Data refreshed successfully',
        'info'
      );
    }, 800);
  };

  // ---- Handlers ----
  const handleView = (admission) => {
    setSelectedAdmission(admission);
    setShowDetailModal(true);
  };

  const handleEdit = (admission) => {
    setSelectedAdmission(admission);
    const fields = editSchema.describe().fields || {};
    Object.keys(fields).forEach(key => {
      setValue(key, admission[key] || '');
    });
    const match =
      classesList.find((c) => String(c.id) === String(admission.requestedClass)) ||
      classesList.find((c) => String(c.name) === String(admission.requestedClass)) ||
      (admission.classId != null ? classesList.find((c) => String(c.id) === String(admission.classId)) : undefined);
    if (match) {
      setValue('requestedClass', String(match.id));
    }
    setShowEditModal(true);
  };

  const handleDelete = (admission) => {
    setSelectedAdmission(admission);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedAdmission) return;
    setActionLoading(true);
    try {
      const regId = selectedAdmission._serverId || selectedAdmission.id;
      await syncSend('delete', `/registrations/${regId}`);
      notify(isArabic ? 'تم حذف الطلب بنجاح' : 'Admission deleted successfully', 'success');
      setShowDeleteModal(false);
      setSelectedAdmission(null);
      fetchAdmissions();
    } catch (err) {
      console.error(err);
      notify(err.message || (isArabic ? 'فشل حذف الطلب' : 'Failed to delete admission'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    setActionLoading(true);
    try {
      const admission = fullListRef.current.find(a => String(a.id) === String(id)) || null;
      const regId = admission?._serverId || id;
      await syncSend('patch', `/registrations/${regId}/status`, { status: newStatus });
      const statusLabel = newStatus === 'approved' ? (isArabic ? 'تم القبول' : 'Approved') : (isArabic ? 'تم الرفض' : 'Rejected');
      notify(isArabic ? `تم ${statusLabel} الطلب بنجاح` : `Admission ${statusLabel} successfully`, 'success');
      fetchAdmissions();
    } catch (err) {
      console.error(err);
      notify(err.message || (isArabic ? 'فشل تحديث الحالة' : 'Failed to update status'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const onSubmitEdit = async (data) => {
    if (!selectedAdmission) return;
    setActionLoading(true);
    const selectedClass =
      classesList.find((c) => String(c.id) === String(data.requestedClass)) ||
      classesList.find((c) => String(c.name) === String(data.requestedClass));
    const requestedClassName = selectedClass ? selectedClass.name : (data.requestedClass || '');
    const requestedClassId = selectedClass
      ? selectedClass.id
      : data.requestedClass && !/^\d+$/.test(String(data.requestedClass)) ? null : data.requestedClass || null;
    
    // Server-backed admission -> persist edit to MySQL
    try {
      const payload = buildServerEditPayload(data, requestedClassName, requestedClassId);
      const regId = selectedAdmission._serverId || selectedAdmission.id;
      await syncSend('put', `/registrations/${regId}`, payload);
      notify(isArabic ? 'تم تحديث الطلب بنجاح' : 'Admission updated successfully', 'success');
      setShowEditModal(false);
      setSelectedAdmission(null);
      fetchAdmissions();
    } catch (err) {
      console.error(err);
      notify(err.message || (isArabic ? 'فشل تحديث الطلب' : 'Failed to update admission'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ---- Pagination ----
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // ===== GET SORT ICON =====
  const getSortIcon = (field) => {
    if (sortBy !== field) return <FaSort className="ms-1" size={10} />;
    return sortOrder === 'asc' ? <FaSortUp className="ms-1" size={10} /> : <FaSortDown className="ms-1" size={10} />;
  };

  // ---- Status badge component ----
  const StatusBadge = ({ status }) => {
    const variants = {
      pending: { bg: 'warning', text: 'dark', icon: <FaClock />, label: isArabic ? 'قيد الانتظار' : 'Pending' },
      approved: { bg: 'success', text: 'white', icon: <FaCheckCircle />, label: isArabic ? 'مقبول' : 'Approved' },
      rejected: { bg: 'danger', text: 'white', icon: <FaTimesCircle />, label: isArabic ? 'مرفوض' : 'Rejected' },
    };
    const v = variants[status] || variants.pending;
    return (
      <Badge bg={v.bg} text={v.text} className="d-flex align-items-center gap-1" style={{ ...arabicFontStyle, fontSize: 'clamp(0.55rem, 0.7vw, 0.75rem)' }}>
        {v.icon} {v.label}
      </Badge>
    );
  };

  // ===== STATS CARDS CONFIGURATION =====
  const statsCards = [
    {
      key: 'total',
      icon: <FaFileAlt size={24} />,
      color: '#4a9eff',
      gradient: 'linear-gradient(135deg, #4a9eff, #2a7f9a)',
      value: formatNumber(stats.total),
      label: isArabic ? 'الإجمالي' : 'Total'
    },
    {
      key: 'pending',
      icon: <FaClock size={24} />,
      color: '#f39c12',
      gradient: 'linear-gradient(135deg, #f39c12, #e67e22)',
      value: formatNumber(stats.pending),
      label: isArabic ? 'قيد الانتظار' : 'Pending'
    },
    {
      key: 'approved',
      icon: <FaCheckCircle size={24} />,
      color: '#2ecc71',
      gradient: 'linear-gradient(135deg, #2ecc71, #27ae60)',
      value: formatNumber(stats.approved),
      label: isArabic ? 'مقبول' : 'Approved'
    },
    {
      key: 'rejected',
      icon: <FaTimesCircle size={24} />,
      color: '#e74c3c',
      gradient: 'linear-gradient(135deg, #e74c3c, #c0392b)',
      value: formatNumber(stats.rejected),
      label: isArabic ? 'مرفوض' : 'Rejected'
    }
  ];

  // ---- Render table rows ----
  const renderRow = (admission) => (
    <tr key={admission.id}>
      <td>
        <div className="d-flex align-items-center gap-1 gap-md-2">
          <div
            className="d-flex align-items-center justify-content-center rounded-circle"
            style={{
              width: isMobile ? '28px' : '34px',
              height: isMobile ? '28px' : '34px',
              background: '#e8f6ef',
              color: '#2d6a4f',
              flexShrink: 0,
              fontSize: isMobile ? '0.6rem' : '0.8rem',
              fontWeight: '600'
            }}
          >
            <FaUserGraduate size={isMobile ? 12 : 14} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="fw-semibold text-truncate" style={{ ...arabicFontStyle, fontSize: isMobile ? 'clamp(0.7rem, 1vw, 0.85rem)' : 'clamp(0.65rem, 0.8vw, 0.85rem)', color: darkMode ? '#e9ecef' : '#212529' }}>
              {admission.studentName}
            </div>
            {admission.status === 'pending' && (
              <Badge bg="info" className="ms-1" style={{ ...arabicFontStyle, fontSize: 'clamp(0.4rem, 0.5vw, 0.5rem)' }}>
                {isArabic ? 'جديد' : 'New'}
              </Badge>
            )}
          </div>
        </div>
      </td>
      <td className="d-none d-sm-table-cell" style={{ ...arabicFontStyle, fontSize: isMobile ? 'clamp(0.7rem, 1vw, 0.8rem)' : 'clamp(0.65rem, 0.8vw, 0.8rem)', color: darkMode ? '#e9ecef' : '#212529' }}>
        {admission.parentName}
      </td>
      <td className="d-none d-md-table-cell">
        {admission.level && (
          <Badge bg="info" text="dark" style={{ ...arabicFontStyle, fontSize: 'clamp(0.45rem, 0.55vw, 0.6rem)' }}>
            {isArabic ? 
              { kindergarden: 'أولي', primary: 'ابتدائي', secondary: 'إعدادي', high_school: 'ثانوي' }[admission.level] || admission.level 
              : admission.level}
          </Badge>
        )}
        {admission.requestedClass && (
          <Badge bg="secondary" className="ms-1" style={{ ...arabicFontStyle, fontSize: 'clamp(0.4rem, 0.5vw, 0.55rem)' }}>
            {admission.requestedClass}
          </Badge>
        )}
      </td>
      <td className="d-none d-sm-table-cell">
        <StatusBadge status={admission.status} />
      </td>
      <td className="d-none d-md-table-cell" style={{ ...arabicFontStyle, fontSize: isMobile ? 'clamp(0.7rem, 1vw, 0.8rem)' : 'clamp(0.65rem, 0.8vw, 0.8rem)', color: darkMode ? '#e9ecef' : '#212529' }}>
        {safeFormatDate(admission.createdAt, 'dd/MM/yyyy')}
      </td>
      <td>
        <div className="d-flex gap-1 flex-wrap justify-content-center">
          <OverlayTrigger placement="top" overlay={<Tooltip>{isArabic ? 'عرض' : 'View'}</Tooltip>}>
            <Button variant="outline-primary" size="sm" className="action-btn" onClick={() => handleView(admission)}>
              <FaEye size={isMobile ? 10 : 12} />
            </Button>
          </OverlayTrigger>
          <OverlayTrigger placement="top" overlay={<Tooltip>{isArabic ? 'تعديل' : 'Edit'}</Tooltip>}>
            <Button variant="outline-warning" size="sm" className="action-btn" onClick={() => handleEdit(admission)}>
              <FaEdit size={isMobile ? 10 : 12} />
            </Button>
          </OverlayTrigger>
          {admission.status === 'pending' && (
            <>
              <OverlayTrigger placement="top" overlay={<Tooltip>{isArabic ? 'قبول' : 'Approve'}</Tooltip>}>
                <Button
                  variant="outline-success"
                  size="sm"
                  className="action-btn"
                  onClick={() => updateStatus(admission.id, 'approved')}
                  disabled={actionLoading}
                >
                  <FaCheckCircle size={isMobile ? 10 : 12} />
                </Button>
              </OverlayTrigger>
              <OverlayTrigger placement="top" overlay={<Tooltip>{isArabic ? 'رفض' : 'Reject'}</Tooltip>}>
                <Button
                  variant="outline-danger"
                  size="sm"
                  className="action-btn"
                  onClick={() => updateStatus(admission.id, 'rejected')}
                  disabled={actionLoading}
                >
                  <FaTimesCircle size={isMobile ? 10 : 12} />
                </Button>
              </OverlayTrigger>
            </>
          )}
          <OverlayTrigger placement="top" overlay={<Tooltip>{isArabic ? 'حذف' : 'Delete'}</Tooltip>}>
            <Button variant="outline-danger" size="sm" className="action-btn" onClick={() => handleDelete(admission)}>
              <FaTrash size={isMobile ? 10 : 12} />
            </Button>
          </OverlayTrigger>
        </div>
      </td>
    </tr>
  );

  // ---- Classes filtered by the selected level (edit modal) ----
  const currentLevel = watch('level');
  const normLevelKey = (v) =>
    String(v || '').toLowerCase() === 'kindergarden' ? 'kindergarten'
      : String(v || '').toLowerCase() === 'highschool' ? 'high_school'
      : String(v || '').toLowerCase();
  const filteredClasses = currentLevel
    ? classesList.filter(
        (c) =>
          normLevelKey(c.level_key) === normLevelKey(currentLevel) ||
          String(c.level || '').toLowerCase() === String(currentLevel).toLowerCase()
      )
    : classesList;

  return (
    <div className="admission-management" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* ===== PAGE HEADER ===== */}
      <div className="page-header d-flex flex-wrap flex-sm-nowrap justify-content-between align-items-center gap-2 gap-md-3 mb-3 mb-md-4">
        <div className="flex-grow-1 min-width-0">
          <h4 className="fw-bold mb-0 mb-sm-1" style={{ 
            ...arabicFontStyle, 
            color: '#1a5f7a', 
            fontSize: isArabic ? 'clamp(1rem, 2vw, 1.5rem)' : 'clamp(0.95rem, 1.8vw, 1.4rem)' 
          }}>
            <FaUsers className="me-2" style={{ color: '#1a5f7a' }} />
            {isArabic ? 'إدارة التسجيلات' : 'Admission Management'}
          </h4>
          <p className="text-muted mb-0 d-none d-sm-block" style={{ 
            ...arabicFontStyle, 
            fontSize: isArabic ? 'clamp(0.8rem, 1vw, 0.95rem)' : 'clamp(0.75rem, 0.9vw, 0.9rem)' 
          }}>
            {isArabic ? 'استعراض وإدارة طلبات التسجيل المقدمة من أولياء الأمور' : 'Review and manage registration requests submitted by parents'}
          </p>
        </div>
        <div className="d-flex gap-1 gap-sm-2 flex-wrap flex-shrink-0">
          <Button 
            variant="outline-primary" 
            size="sm" 
            onClick={handleRefresh}
            disabled={loading}
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

      {/* ===== STATS CARDS - Enhanced with Gradient Topbars ===== */}
      <Row className="g-2 g-sm-3 g-md-4 mb-3 mb-md-4">
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
                    padding: isMobile ? '6px' : '12px',
                    borderRadius: '12px',
                    background: `${stat.color}15`,
                    color: stat.color
                  }}
                >
                  <span style={{ fontSize: isMobile ? '1.2rem' : '1.8rem' }}>
                    {stat.icon}
                  </span>
                </div>
                <h2 
                  className="fw-bold mb-0" 
                  style={{ 
                    ...arabicFontStyle, 
                    fontSize: isMobile ? '1rem' : '1.6rem',
                    color: darkMode ? '#e9ecef' : '#212529'
                  }}
                >
                  {stat.value}
                </h2>
                <p 
                  className="text-muted mb-0" 
                  style={{ 
                    ...arabicFontStyle, 
                    fontSize: isMobile ? '0.5rem' : '0.7rem',
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

      {/* ===== FILTER BAR ===== */}
      <Card className="modern-card mb-3 mb-md-4" style={{ background: darkMode ? '#1a1a2e' : '#ffffff', borderColor: darkMode ? '#2d2d44' : '#e9ecef' }}>
        <Card.Body className="p-2 p-md-3">
          <Row className="g-1 g-md-2 align-items-center">
            <Col xs={12} sm={6} md={5} lg={5} className="px-1 px-sm-2">
              <InputGroup size="sm">
                <InputGroup.Text style={{ background: 'transparent', borderColor: darkMode ? '#2d2d44' : '#ced4da' }}>
                  <FaSearch size={isMobile ? 10 : 12} />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder={isArabic ? 'بحث بالاسم أو البريد' : 'Search by name or email'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-control-sm"
                  style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? 'clamp(0.6rem, 0.8vw, 0.8rem)' : 'clamp(0.6rem, 0.8vw, 0.8rem)' }}
                />
                {searchTerm && (
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setSearchTerm('')}
                    style={{ borderRadius: '0 12px 12px 0' }}
                  >
                    <FaTimesCircle size={isMobile ? 10 : 12} />
                  </Button>
                )}
              </InputGroup>
            </Col>
            <Col xs={6} sm={3} md={3} lg={3} className="px-1 px-sm-2">
              <Form.Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="form-select-sm"
                style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: isMobile ? 'clamp(0.55rem, 0.7vw, 0.75rem)' : 'clamp(0.6rem, 0.8vw, 0.8rem)' }}
              >
                <option value="all">{isArabic ? 'جميع الحالات' : 'All Status'}</option>
                <option value="pending">{isArabic ? 'قيد الانتظار' : 'Pending'}</option>
                <option value="approved">{isArabic ? 'مقبول' : 'Approved'}</option>
                <option value="rejected">{isArabic ? 'مرفوض' : 'Rejected'}</option>
              </Form.Select>
            </Col>
            <Col xs={6} sm={3} md={3} lg={3} className="px-1 px-sm-2">
              <Form.Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="form-select-sm"
                style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: isMobile ? 'clamp(0.55rem, 0.7vw, 0.75rem)' : 'clamp(0.6rem, 0.8vw, 0.8rem)' }}
              >
                <option value="createdAt">{isArabic ? 'تاريخ التسجيل' : 'Date'}</option>
                <option value="studentName">{isArabic ? 'اسم الطالب' : 'Student Name'}</option>
                <option value="status">{isArabic ? 'الحالة' : 'Status'}</option>
              </Form.Select>
            </Col>
            <Col xs={6} sm={6} md={1} lg={1} className="px-1 px-sm-2">
              <Button
                variant="outline-secondary"
                size="sm"
                className="w-100"
                onClick={() => { 
                  setSearchTerm(''); 
                  setFilterStatus('all'); 
                  setSortBy('createdAt');
                  setCurrentPage(1); 
                }}
                style={{ ...arabicFontStyle, borderRadius: '12px', fontSize: isMobile ? 'clamp(0.55rem, 0.7vw, 0.75rem)' : 'clamp(0.6rem, 0.8vw, 0.8rem)' }}
              >
                <FaFilter size={isMobile ? 10 : 12} />
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* ===== TABLE ===== */}
      <Card className="modern-card" style={{ background: darkMode ? '#1a1a2e' : '#ffffff', borderColor: darkMode ? '#2d2d44' : '#e9ecef' }}>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <FaSpinner className="spinning" size={isMobile ? 30 : 40} style={{ color: '#3498db' }} />
              <p className="mt-2 text-muted" style={arabicFontStyle}>{isArabic ? 'جاري تحميل الطلبات...' : 'Loading admissions...'}</p>
            </div>
          ) : error ? (
            <Alert variant="danger" className="m-3">{error}</Alert>
          ) : admissions.length === 0 ? (
            <div className="text-center py-5">
              <FaFileAlt size={isMobile ? 30 : 50} className="text-muted mb-3" />
              <p style={arabicFontStyle}>{isArabic ? 'لا توجد طلبات تسجيل حالياً' : 'No admissions found'}</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0" style={arabicFontStyle}>
                <thead style={{ background: darkMode ? '#0d1117' : '#f8f9fa' }}>
                  <tr>
                    <th style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? 'clamp(0.55rem, 0.7vw, 0.7rem)' : 'clamp(0.6rem, 0.8vw, 0.85rem)' }}>
                      {isArabic ? 'الطالب' : 'Student'}
                    </th>
                    <th style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? 'clamp(0.55rem, 0.7vw, 0.7rem)' : 'clamp(0.6rem, 0.8vw, 0.85rem)' }} className="d-none d-sm-table-cell">
                      {isArabic ? 'ولي الأمر' : 'Parent'}
                    </th>
                    <th style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? 'clamp(0.55rem, 0.7vw, 0.7rem)' : 'clamp(0.6rem, 0.8vw, 0.85rem)' }} className="d-none d-md-table-cell">
                      {isArabic ? 'المستوى / الصف' : 'Level / Class'}
                    </th>
                    <th 
                      onClick={() => {
                        if (sortBy === 'status') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('status');
                          setSortOrder('asc');
                        }
                      }}
                      style={{ cursor: 'pointer', color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? 'clamp(0.55rem, 0.7vw, 0.7rem)' : 'clamp(0.6rem, 0.8vw, 0.85rem)' }}
                      className="d-none d-sm-table-cell"
                    >
                      {isArabic ? 'الحالة' : 'Status'} {getSortIcon('status')}
                    </th>
                    <th 
                      onClick={() => {
                        if (sortBy === 'createdAt') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('createdAt');
                          setSortOrder('asc');
                        }
                      }}
                      style={{ cursor: 'pointer', color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? 'clamp(0.55rem, 0.7vw, 0.7rem)' : 'clamp(0.6rem, 0.8vw, 0.85rem)' }}
                      className="d-none d-md-table-cell"
                    >
                      {isArabic ? 'تاريخ التسجيل' : 'Date'} {getSortIcon('createdAt')}
                    </th>
                    <th className="text-center" style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? 'clamp(0.55rem, 0.7vw, 0.7rem)' : 'clamp(0.6rem, 0.8vw, 0.85rem)' }}>
                      {isArabic ? 'الإجراءات' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {admissions.map(renderRow)}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
        {!loading && !error && admissions.length > 0 && (
          <Card.Footer className="d-flex flex-column flex-sm-row justify-content-between align-items-center py-2 gap-2" style={{ borderColor: darkMode ? '#2d2d44' : '#e9ecef' }}>
            <div className="text-muted small" style={{ ...arabicFontStyle, fontSize: isMobile ? 'clamp(0.55rem, 0.7vw, 0.75rem)' : 'clamp(0.6rem, 0.8vw, 0.8rem)' }}>
              {isArabic ? `عرض ${admissions.length} من ${stats.total}` : `Showing ${admissions.length} of ${stats.total}`}
            </div>
            <Pagination size="sm" className="mb-0 responsive-pagination">
              <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />
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
                  <Pagination.Item key={pageNum} active={pageNum === currentPage} onClick={() => handlePageChange(pageNum)}>
                    {pageNum}
                  </Pagination.Item>
                );
              })}
              {totalPages > (isMobile ? 3 : 5) && <Pagination.Ellipsis />}
              <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} />
            </Pagination>
          </Card.Footer>
        )}
      </Card>

      {/* ===== DETAIL MODAL ===== */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} centered size="lg" className="modern-modal">
        <Modal.Header closeButton style={{ borderBottom: darkMode ? '1px solid #2d2d44' : '1px solid #e9ecef' }}>
          <Modal.Title style={arabicFontStyle}>
            <FaInfoCircle className="me-2" style={{ color: '#1a5f7a' }} />
            {isArabic ? 'تفاصيل الطلب' : 'Admission Details'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? '#1a1a2e' : '#ffffff', maxHeight: '70vh', overflowY: 'auto' }}>
          {selectedAdmission && (
            <div style={arabicFontStyle}>
              <h6 className="fw-bold text-primary" style={{ fontSize: isMobile ? 'clamp(0.8rem, 1vw, 1rem)' : 'clamp(0.9rem, 1.2vw, 1.1rem)' }}>
                <FaUserGraduate className="me-2" /> {isArabic ? 'معلومات الطالب' : 'Student Information'}
              </h6>
              <Row className="mb-2">
                <Col xs={5} md={4}><strong className="text-muted" style={{ fontSize: isMobile ? '0.7rem' : 'inherit' }}>{isArabic ? 'الاسم الكامل' : 'Full Name'}</strong></Col>
                <Col xs={7} md={8}><span style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.7rem' : 'inherit' }}>{selectedAdmission.studentName || '-'}</span></Col>
              </Row>
              <Row className="mb-2">
                <Col xs={5} md={4}><strong className="text-muted" style={{ fontSize: isMobile ? '0.7rem' : 'inherit' }}><FaBirthdayCake className="me-1" /> {isArabic ? 'تاريخ الميلاد' : 'Date of Birth'}</strong></Col>
                <Col xs={7} md={8}><span style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.7rem' : 'inherit' }}>{safeFormatDate(selectedAdmission.dob, 'dd/MM/yyyy')}</span></Col>
              </Row>
              <Row className="mb-2">
                <Col xs={5} md={4}><strong className="text-muted" style={{ fontSize: isMobile ? '0.7rem' : 'inherit' }}><FaVenusMars className="me-1" /> {isArabic ? 'الجنس' : 'Gender'}</strong></Col>
                <Col xs={7} md={8}><span style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.7rem' : 'inherit' }}>{selectedAdmission.gender ? (isArabic ? (selectedAdmission.gender === 'male' ? 'ذكر' : 'أنثى') : selectedAdmission.gender) : '-'}</span></Col>
              </Row>
              <Row className="mb-2">
                <Col xs={5} md={4}><strong className="text-muted" style={{ fontSize: isMobile ? '0.7rem' : 'inherit' }}><FaGlobe className="me-1" /> {isArabic ? 'الجنسية' : 'Nationality'}</strong></Col>
                <Col xs={7} md={8}><span style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.7rem' : 'inherit' }}>{selectedAdmission.nationality || '-'}</span></Col>
              </Row>
              <Row className="mb-2">
                <Col xs={5} md={4}><strong className="text-muted" style={{ fontSize: isMobile ? '0.7rem' : 'inherit' }}><FaMapMarkerAlt className="me-1" /> {isArabic ? 'العنوان' : 'Address'}</strong></Col>
                <Col xs={7} md={8}><span style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.7rem' : 'inherit' }}>{selectedAdmission.address || '-'}</span></Col>
              </Row>

              <hr />

              <h6 className="fw-bold text-success" style={{ fontSize: isMobile ? 'clamp(0.8rem, 1vw, 1rem)' : 'clamp(0.9rem, 1.2vw, 1.1rem)' }}>
                <FaClipboardList className="me-2" /> {isArabic ? 'معلومات التسجيل' : 'Admission Information'}
              </h6>
              <Row className="mb-2">
                <Col xs={5} md={4}><strong className="text-muted" style={{ fontSize: isMobile ? '0.7rem' : 'inherit' }}><FaGraduationCap className="me-1" /> {isArabic ? 'المستوى' : 'Level'}</strong></Col>
                <Col xs={7} md={8}><span style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.7rem' : 'inherit' }}>{isArabic ? { kindergarden: 'أولي', primary: 'ابتدائي', secondary: 'إعدادي', high_school: 'ثانوي' }[selectedAdmission.level] || selectedAdmission.level : selectedAdmission.level}</span></Col>
              </Row>
              <Row className="mb-2">
                <Col xs={5} md={4}><strong className="text-muted" style={{ fontSize: isMobile ? '0.7rem' : 'inherit' }}><FaBuilding className="me-1" /> {isArabic ? 'الصف المطلوب' : 'Requested Class'}</strong></Col>
                <Col xs={7} md={8}><span style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.7rem' : 'inherit' }}>{(() => { const reqClass = selectedAdmission.requestedClass || selectedAdmission.classId; if (!reqClass) return '-'; const found = classesList.find(c => String(c.id) === String(reqClass)); return found ? found.name : reqClass; })()}</span></Col>
              </Row>

              <hr />

              <h6 className="fw-bold text-warning" style={{ fontSize: isMobile ? 'clamp(0.8rem, 1vw, 1rem)' : 'clamp(0.9rem, 1.2vw, 1.1rem)' }}>
                <FaUserTie className="me-2" /> {isArabic ? 'معلومات ولي الأمر' : 'Parent/Guardian Information'}
              </h6>
              <Row className="mb-2">
                <Col xs={5} md={4}><strong className="text-muted" style={{ fontSize: isMobile ? '0.7rem' : 'inherit' }}>{isArabic ? 'الاسم' : 'Name'}</strong></Col>
                <Col xs={7} md={8}><span className="fw-semibold" style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.7rem' : 'inherit' }}>{selectedAdmission.parentName || '-'}</span></Col>
              </Row>
              <Row className="mb-2">
                <Col xs={5} md={4}><strong className="text-muted" style={{ fontSize: isMobile ? '0.7rem' : 'inherit' }}><FaEnvelope className="me-1" /> {isArabic ? 'البريد الإلكتروني' : 'Email'}</strong></Col>
                <Col xs={7} md={8}><span style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.7rem' : 'inherit' }}>{selectedAdmission.parentEmail || '-'}</span></Col>
              </Row>
              <Row className="mb-2">
                <Col xs={5} md={4}><strong className="text-muted" style={{ fontSize: isMobile ? '0.7rem' : 'inherit' }}><FaPhone className="me-1" /> {isArabic ? 'رقم الهاتف' : 'Phone'}</strong></Col>
                <Col xs={7} md={8}><span style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.7rem' : 'inherit' }}>{selectedAdmission.parentPhone || '-'}</span></Col>
              </Row>
              <Row className="mb-2">
                <Col xs={5} md={4}><strong className="text-muted" style={{ fontSize: isMobile ? '0.7rem' : 'inherit' }}><FaMapMarkerAlt className="me-1" /> {isArabic ? 'العنوان' : 'Address'}</strong></Col>
                <Col xs={7} md={8}><span style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.7rem' : 'inherit' }}>{selectedAdmission.parentAddress || '-'}</span></Col>
              </Row>

              <hr />

              <h6 className="fw-bold text-danger" style={{ fontSize: isMobile ? 'clamp(0.8rem, 1vw, 1rem)' : 'clamp(0.9rem, 1.2vw, 1.1rem)' }}>
                <FaPhoneAlt className="me-2" /> {isArabic ? 'جهة اتصال الطوارئ' : 'Emergency Contact'}
              </h6>
              <Row className="mb-2">
                <Col xs={5} md={4}><strong className="text-muted" style={{ fontSize: isMobile ? '0.7rem' : 'inherit' }}>{isArabic ? 'الاسم' : 'Name'}</strong></Col>
                <Col xs={7} md={8}><span style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.7rem' : 'inherit' }}>{selectedAdmission.emergencyContact || '-'}</span></Col>
              </Row>
              <Row className="mb-2">
                <Col xs={5} md={4}><strong className="text-muted" style={{ fontSize: isMobile ? '0.7rem' : 'inherit' }}><FaPhone className="me-1" /> {isArabic ? 'رقم الهاتف' : 'Phone'}</strong></Col>
                <Col xs={7} md={8}><span style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.7rem' : 'inherit' }}>{selectedAdmission.emergencyPhone || '-'}</span></Col>
              </Row>

              <hr />

              <h6 className="fw-bold" style={{ fontSize: isMobile ? 'clamp(0.8rem, 1vw, 1rem)' : 'clamp(0.9rem, 1.2vw, 1.1rem)' }}>
                {isArabic ? 'حالة الطلب' : 'Status & Admin'}
              </h6>
              <Row className="mb-2">
                <Col xs={5} md={4}><strong className="text-muted" style={{ fontSize: isMobile ? '0.7rem' : 'inherit' }}>{isArabic ? 'الحالة' : 'Status'}</strong></Col>
                <Col xs={7} md={8}><StatusBadge status={selectedAdmission.status} /></Col>
              </Row>
              <Row className="mb-2">
                <Col xs={5} md={4}><strong className="text-muted" style={{ fontSize: isMobile ? '0.7rem' : 'inherit' }}><FaCalendarAlt className="me-1" /> {isArabic ? 'تاريخ التقديم' : 'Submitted At'}</strong></Col>
                <Col xs={7} md={8}><span style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.7rem' : 'inherit' }}>{safeFormatDate(selectedAdmission.createdAt, 'dd/MM/yyyy HH:mm')}</span></Col>
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer style={{ borderTop: darkMode ? '1px solid #2d2d44' : '1px solid #e9ecef' }}>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)} style={{ ...arabicFontStyle, borderRadius: '12px', fontSize: isMobile ? 'clamp(0.7rem, 0.9vw, 0.9rem)' : 'clamp(0.8rem, 1vw, 1rem)' }}>
            {isArabic ? 'إغلاق' : 'Close'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===== EDIT MODAL ===== */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered size="lg" className="modern-modal">
        <Modal.Header closeButton style={{ borderBottom: darkMode ? '1px solid #2d2d44' : '1px solid #e9ecef' }}>
          <Modal.Title style={arabicFontStyle}>
            <FaEdit className="me-2" style={{ color: '#f39c12' }} />
            {isArabic ? 'تعديل الطلب' : 'Edit Admission'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit(onSubmitEdit)}>
          <Modal.Body style={{ background: darkMode ? '#1a1a2e' : '#ffffff', maxHeight: '70vh', overflowY: 'auto' }}>
            <Row>
              <Col md={6} xs={12}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? 'clamp(0.7rem, 0.9vw, 0.9rem)' : 'clamp(0.8rem, 1vw, 1rem)' }}>
                    {isArabic ? 'اسم الطالب' : 'Student Name'} *
                  </Form.Label>
                  <Form.Control {...register('studentName')} isInvalid={!!errors.studentName} style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: isMobile ? 'clamp(0.75rem, 0.9vw, 1rem)' : 'clamp(0.85rem, 1vw, 1.1rem)' }} />
                  <Form.Control.Feedback type="invalid">{errors.studentName?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6} xs={12}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? 'clamp(0.7rem, 0.9vw, 0.9rem)' : 'clamp(0.8rem, 1vw, 1rem)' }}>
                    <FaBirthdayCake className="me-1" /> {isArabic ? 'تاريخ الميلاد' : 'Date of Birth'} *
                  </Form.Label>
                  <Form.Control type="date" {...register('dob')} isInvalid={!!errors.dob} style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: isMobile ? 'clamp(0.75rem, 0.9vw, 1rem)' : 'clamp(0.85rem, 1vw, 1.1rem)' }} />
                  <Form.Control.Feedback type="invalid">{errors.dob?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6} xs={12}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? 'clamp(0.7rem, 0.9vw, 0.9rem)' : 'clamp(0.8rem, 1vw, 1rem)' }}>
                    <FaGraduationCap className="me-1" /> {isArabic ? 'المستوى' : 'Level'} *
                  </Form.Label>
                  <Form.Select
                    {...register('level')}
                    onChange={(e) => {
                      register('level').onChange(e);
                      const currentClass = watch('requestedClass');
                      if (currentClass) {
                        const stillValid = classesList.some(
                          (c) =>
                            String(c.id) === String(currentClass) &&
                            (String(c.level_key || '').toLowerCase() === String(e.target.value).toLowerCase() ||
                             String(c.level || '').toLowerCase() === String(e.target.value).toLowerCase())
                        );
                        if (!stillValid) setValue('requestedClass', '');
                      }
                    }}
                    isInvalid={!!errors.level}
                    style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: isMobile ? 'clamp(0.75rem, 0.9vw, 1rem)' : 'clamp(0.85rem, 1vw, 1.1rem)' }}
                  >
                    <option value="">{isArabic ? 'اختر المستوى' : 'Select Level'}</option>
                    <option value="kindergarden">{isArabic ? 'أولي' : 'Kindergarden'}</option>
                    <option value="primary">{isArabic ? 'ابتدائي' : 'Primary'}</option>
                    <option value="secondary">{isArabic ? 'إعدادي' : 'Secondary'}</option>
                    <option value="high_school">{isArabic ? 'ثانوي' : 'High School'}</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{errors.level?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6} xs={12}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? 'clamp(0.7rem, 0.9vw, 0.9rem)' : 'clamp(0.8rem, 1vw, 1rem)' }}>
                    <FaSchool className="me-1" /> {isArabic ? 'المدرسة السابقة' : 'Previous School'}
                  </Form.Label>
                  <Form.Control {...register('previousSchool')} style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: isMobile ? 'clamp(0.75rem, 0.9vw, 1rem)' : 'clamp(0.85rem, 1vw, 1.1rem)' }} />
                </Form.Group>
              </Col>
            </Row>

            <hr />
            <h6 className="fw-bold" style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? 'clamp(0.8rem, 1vw, 1rem)' : 'clamp(0.9rem, 1.2vw, 1.1rem)' }}>
              <FaUserTie className="me-2" /> {isArabic ? 'معلومات ولي الأمر' : 'Parent Information'}
            </h6>
            <Row>
              <Col md={6} xs={12}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? 'clamp(0.7rem, 0.9vw, 0.9rem)' : 'clamp(0.8rem, 1vw, 1rem)' }}>
                    {isArabic ? 'اسم ولي الأمر' : 'Parent Name'} *
                  </Form.Label>
                  <Form.Control {...register('parentName')} isInvalid={!!errors.parentName} style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: isMobile ? 'clamp(0.75rem, 0.9vw, 1rem)' : 'clamp(0.85rem, 1vw, 1.1rem)' }} />
                  <Form.Control.Feedback type="invalid">{errors.parentName?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6} xs={12}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? 'clamp(0.7rem, 0.9vw, 0.9rem)' : 'clamp(0.8rem, 1vw, 1rem)' }}>
                    <FaEnvelope className="me-1" /> {isArabic ? 'البريد الإلكتروني' : 'Email'} *
                  </Form.Label>
                  <Form.Control {...register('parentEmail')} isInvalid={!!errors.parentEmail} style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: isMobile ? 'clamp(0.75rem, 0.9vw, 1rem)' : 'clamp(0.85rem, 1vw, 1.1rem)' }} />
                  <Form.Control.Feedback type="invalid">{errors.parentEmail?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6} xs={12}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? 'clamp(0.7rem, 0.9vw, 0.9rem)' : 'clamp(0.8rem, 1vw, 1rem)' }}>
                    <FaPhone className="me-1" /> {isArabic ? 'رقم الهاتف' : 'Phone'} *
                  </Form.Label>
                  <Form.Control {...register('parentPhone')} isInvalid={!!errors.parentPhone} style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: isMobile ? 'clamp(0.75rem, 0.9vw, 1rem)' : 'clamp(0.85rem, 1vw, 1.1rem)' }} />
                  <Form.Control.Feedback type="invalid">{errors.parentPhone?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6} xs={12}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? 'clamp(0.7rem, 0.9vw, 0.9rem)' : 'clamp(0.8rem, 1vw, 1rem)' }}>
                    <FaMapMarkerAlt className="me-1" /> {isArabic ? 'العنوان' : 'Address'} *
                  </Form.Label>
                  <Form.Control {...register('parentAddress')} isInvalid={!!errors.parentAddress} style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: isMobile ? 'clamp(0.75rem, 0.9vw, 1rem)' : 'clamp(0.85rem, 1vw, 1.1rem)' }} />
                  <Form.Control.Feedback type="invalid">{errors.parentAddress?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <hr />
            <h6 className="fw-bold" style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? 'clamp(0.8rem, 1vw, 1rem)' : 'clamp(0.9rem, 1.2vw, 1.1rem)' }}>
              <FaPhoneAlt className="me-2" /> {isArabic ? 'جهة اتصال الطوارئ' : 'Emergency Contact'}
            </h6>
            <Row>
              <Col md={4} xs={12}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? 'clamp(0.7rem, 0.9vw, 0.9rem)' : 'clamp(0.8rem, 1vw, 1rem)' }}>
                    {isArabic ? 'الاسم' : 'Name'}
                  </Form.Label>
                  <Form.Control {...register('emergencyContact')} style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: isMobile ? 'clamp(0.75rem, 0.9vw, 1rem)' : 'clamp(0.85rem, 1vw, 1.1rem)' }} />
                </Form.Group>
              </Col>
              <Col md={4} xs={12}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? 'clamp(0.7rem, 0.9vw, 0.9rem)' : 'clamp(0.8rem, 1vw, 1rem)' }}>
                    {isArabic ? 'صلة القرابة' : 'Relationship'}
                  </Form.Label>
                  <Form.Select {...register('emergencyRelationship')} style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: isMobile ? 'clamp(0.75rem, 0.9vw, 1rem)' : 'clamp(0.85rem, 1vw, 1.1rem)' }}>
                    <option value="">{isArabic ? 'اختر صلة القرابة' : 'Select Relationship'}</option>
                    <option value="father">{isArabic ? 'الأب' : 'Father'}</option>
                    <option value="mother">{isArabic ? 'الأم' : 'Mother'}</option>
                    <option value="sister">{isArabic ? 'الأخت' : 'Sister'}</option>
                    <option value="brother">{isArabic ? 'الأخ' : 'Brother'}</option>
                    <option value="other">{isArabic ? 'أخرى' : 'Other'}</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4} xs={12}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? 'clamp(0.7rem, 0.9vw, 0.9rem)' : 'clamp(0.8rem, 1vw, 1rem)' }}>
                    <FaPhone className="me-1" /> {isArabic ? 'رقم الهاتف' : 'Phone'}
                  </Form.Label>
                  <Form.Control {...register('emergencyPhone')} style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: isMobile ? 'clamp(0.75rem, 0.9vw, 1rem)' : 'clamp(0.85rem, 1vw, 1.1rem)' }} />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer style={{ borderTop: darkMode ? '1px solid #2d2d44' : '1px solid #e9ecef' }}>
            <Button variant="secondary" onClick={() => setShowEditModal(false)} style={{ ...arabicFontStyle, borderRadius: '12px', fontSize: isMobile ? 'clamp(0.7rem, 0.9vw, 0.9rem)' : 'clamp(0.8rem, 1vw, 1rem)' }}>
              {isArabic ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button variant="primary" type="submit" disabled={actionLoading} style={{ ...arabicFontStyle, borderRadius: '12px', fontSize: isMobile ? 'clamp(0.7rem, 0.9vw, 0.9rem)' : 'clamp(0.8rem, 1vw, 1rem)' }}>
              {actionLoading ? (
                <>
                  <FaSpinner className="spinning me-2" /> {isArabic ? 'جاري الحفظ...' : 'Saving...'}
                </>
              ) : (
                isArabic ? 'حفظ التغييرات' : 'Save Changes'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ===== DELETE CONFIRM MODAL ===== */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered className="modern-modal">
        <Modal.Header closeButton style={{ borderBottom: darkMode ? '1px solid #2d2d44' : '1px solid #e9ecef' }}>
          <Modal.Title style={arabicFontStyle}>
            <FaExclamationTriangle className="me-2 text-danger" />
            {isArabic ? 'تأكيد الحذف' : 'Confirm Deletion'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? '#1a1a2e' : '#ffffff' }}>
          <p style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.85rem' : 'inherit' }}>
            {isArabic
              ? `هل أنت متأكد من حذف طلب التسجيل للطالب "${selectedAdmission?.studentName}"؟`
              : `Are you sure you want to delete the admission for student "${selectedAdmission?.studentName}"?`}
          </p>
          <small className="text-muted" style={{ ...arabicFontStyle, fontSize: isMobile ? '0.7rem' : 'inherit' }}>
            {isArabic ? 'هذا الإجراء لا يمكن التراجع عنه.' : 'This action cannot be undone.'}
          </small>
        </Modal.Body>
        <Modal.Footer style={{ borderTop: darkMode ? '1px solid #2d2d44' : '1px solid #e9ecef' }}>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} style={{ ...arabicFontStyle, borderRadius: '12px', fontSize: isMobile ? 'clamp(0.7rem, 0.9vw, 0.9rem)' : 'clamp(0.8rem, 1vw, 1rem)' }}>
            {isArabic ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button variant="danger" onClick={confirmDelete} disabled={actionLoading} style={{ ...arabicFontStyle, borderRadius: '12px', fontSize: isMobile ? 'clamp(0.7rem, 0.9vw, 0.9rem)' : 'clamp(0.8rem, 1vw, 1rem)' }}>
            {actionLoading ? (
              <>
                <FaSpinner className="spinning me-2" /> {isArabic ? 'جاري الحذف...' : 'Deleting...'}
              </>
            ) : (
              isArabic ? 'حذف' : 'Delete'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Styles */}
      <style>{`
        .admission-management {
          padding: 0;
          max-width: 100vw;
          overflow-x: hidden;
        }

        .admission-management * {
          box-sizing: border-box;
        }

        .min-width-0 {
          min-width: 0;
        }

        .action-btn {
          padding: ${isMobile ? '2px 4px !important' : '2px 6px !important'};
          min-width: ${isMobile ? '22px !important' : '26px !important'};
          min-height: ${isMobile ? '22px !important' : '26px !important'};
          font-size: ${isMobile ? '0.5rem !important' : '0.65rem !important'};
          border-radius: 6px !important;
        }
        
        .action-btn svg {
          font-size: ${isMobile ? '8px !important' : '12px !important'};
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

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        [dir="rtl"] .page-header {
          flex-direction: row-reverse;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 768px) {
          .action-btn {
            padding: 1px 3px !important;
            min-width: 18px !important;
            min-height: 18px !important;
            font-size: 0.45rem !important;
          }
          .action-btn svg {
            font-size: 7px !important;
          }
        }

        @media (max-width: 576px) {
          .page-header {
            flex-direction: column;
            align-items: stretch !important;
          }
          [dir="rtl"] .page-header {
            align-items: stretch !important;
          }
          .page-header .d-flex {
            justify-content: flex-start;
          }
          [dir="rtl"] .page-header .d-flex {
            justify-content: flex-end;
          }
          
          .page-header h4 {
            font-size: 0.85rem !important;
          }
          
          .responsive-pagination .page-link {
            padding: 2px 6px;
            font-size: 0.5rem;
          }
          
          /* Stats cards - 2 per row on mobile */
          .admission-management .row > .col-6 {
            flex: 0 0 50%;
            max-width: 50%;
            padding: 4px;
          }
          
          /* Filter selects - 2 per row on mobile */
          .admission-management .row > .col-6 {
            flex: 0 0 50%;
            max-width: 50%;
          }
          
          /* Modal body columns */
          .modern-modal .modal-body .row > .col-6 {
            flex: 0 0 100%;
            max-width: 100%;
          }
          .modern-modal .modal-body .row > .col-4 {
            flex: 0 0 100%;
            max-width: 100%;
          }
        }

        @media (max-width: 400px) {
          .stat-card-enhanced .p-2.p-sm-3.p-md-4 {
            padding: 6px !important;
          }
          .stat-card-enhanced .stats-icon-wrapper {
            padding: 4px !important;
          }
          .stat-card-enhanced .stats-icon-wrapper span {
            font-size: 1rem !important;
          }
          .stat-card-enhanced h2 {
            font-size: 0.85rem !important;
          }
        }

        /* RTL Fixes */
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
        [dir="rtl"] .modal-header .me-2 {
          margin-right: 0 !important;
          margin-left: 0.5rem !important;
        }
      `}</style>
    </div>
  );
};

export default AdmissionManagement;