// src/components/dashboard/admin/PaymentsManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Row, Col, Card, Table, Badge, Button, Form, Modal,
  Alert, Pagination, InputGroup, Spinner, ProgressBar,
} from 'react-bootstrap';
import {
  FaMoneyBillWave, FaSearch, FaCheckCircle, FaClock, FaExclamationTriangle,
  FaFileAlt, FaUserGraduate, FaDownload, FaUpload, FaEdit, FaTrash,
  FaPlus, FaCalendarAlt, FaCoins, FaPercent, FaCheck, FaTimes,
  FaEye, FaSync, FaUserPlus, FaBirthdayCake, FaVenusMars, FaMapMarkerAlt,
  FaCity, FaPhone, FaEnvelope, FaUser, FaSort, FaSortUp, FaSortDown,
  FaSpinner, FaFileInvoice, FaUserCheck
} from 'react-icons/fa';
import { useLanguage } from '../../../context/LanguageContext';
import { useNotification } from '../../../hooks/useNotification';
import api from '../../../services/api';
import notificationService from '../../../services/notificationService';
import userDataService from '../../../services/userDataService';

// ===== FORMAT NUMBER =====
const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  return num.toString();
};

// ===== GENERATE STUDENT ID =====
const generateStudentId = () => {
  const year = new Date().getFullYear();
  const allUsers = userDataService.getUsers();
  const students = allUsers.filter(u => u.role === 'student');
  
  let maxNum = 0;
  students.forEach(s => {
    if (s.id && s.id.startsWith(`STU/${year}/`)) {
      const parts = s.id.split('/');
      if (parts.length === 3) {
        const num = parseInt(parts[2], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
  });
  
  const nextNum = maxNum + 1;
  const paddedNum = String(nextNum).padStart(3, '0');
  return `STU/${year}/${paddedNum}`;
};

const PaymentsManagement = () => {
  const { isArabic } = useLanguage();
  const { notify } = useNotification();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const monthNamesAr = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'ماي', 'يونيو',
    'يوليوز', 'غشت', 'شتنبر', 'أكتوبر', 'نونبر', 'دجنبر',
  ];
  const getMonthName = (m) => (isArabic ? monthNamesAr[m - 1] : monthNames[m - 1]);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const [payments, setPayments] = useState([]);
  const [dueStudents, setDueStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showViewReceiptModal, setShowViewReceiptModal] = useState(false);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState(null);
  const [receiptPreviewIsPdf, setReceiptPreviewIsPdf] = useState(false);
  const [receiptPreviewName, setReceiptPreviewName] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [sortField, setSortField] = useState('studentName');
  const [sortDirection, setSortDirection] = useState('asc');
  const [darkMode, setDarkMode] = useState(false);
  const [processingPaymentId, setProcessingPaymentId] = useState(null);
  const itemsPerPage = 10;

  // ===== PAYMENT FORM STATE =====
  const [formType, setFormType] = useState('full');
  const [formAmount, setFormAmount] = useState('');
  const [formMethod, setFormMethod] = useState('cash');
  const [formNotes, setFormNotes] = useState('');
  const [formReceiptFile, setFormReceiptFile] = useState(null);
  
  // ===== STUDENT PROFILE FIELDS FOR PAYMENT =====
  const [formStudentName, setFormStudentName] = useState('');
  const [formParentEmail, setFormParentEmail] = useState('');
  const [formParentPhone, setFormParentPhone] = useState('');
  const [formDateOfBirth, setFormDateOfBirth] = useState('');
  const [formGender, setFormGender] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formLevel, setFormLevel] = useState('');
  const [formClassName, setFormClassName] = useState('');
  
  const [receiptFile, setReceiptFile] = useState(null);
  const [rejectNotes, setRejectNotes] = useState('');

  // ===== PAYMENT METHODS =====
  const paymentMethods = [
    { value: 'cash', label: isArabic ? 'نقداً' : 'Cash' },
    { value: 'bank_transfer', label: isArabic ? 'تحويل بنكي' : 'Bank Transfer' },
    { value: 'card', label: isArabic ? 'بطاقة بنكية' : 'Card' },
    { value: 'cheque', label: isArabic ? 'شيك' : 'Cheque' },
    { value: 'other', label: isArabic ? 'أخرى' : 'Other' },
  ];

  const genderOptions = [
    { value: 'male', label: isArabic ? 'ذكر' : 'Male' },
    { value: 'female', label: isArabic ? 'أنثى' : 'Female' },
    { value: 'other', label: isArabic ? 'أخرى' : 'Other' }
  ];

  const levelOptions = [
    { value: '', label: isArabic ? 'اختر المستوى' : 'Select Level' },
    { value: 'kindergarten', label: isArabic ? 'أولي' : 'Kindergarten' },
    { value: 'primary', label: isArabic ? 'ابتدائي' : 'Primary' },
    { value: 'secondary', label: isArabic ? 'إعدادي' : 'Secondary' },
    { value: 'high_school', label: isArabic ? 'ثانوي' : 'High School' }
  ];

  const getPaymentMethodLabel = (method) => {
    const found = paymentMethods.find((m) => m.value === method);
    return found ? found.label : method || '-';
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

  // ===== CREATE STUDENT FROM PAYMENT DATA =====
  const createOrUpdateStudentFromPayment = (payment) => {
    try {
      const allUsers = userDataService.getUsers();
      
      const existingStudent = allUsers.find(u => 
        u.role === 'student' && 
        (u.email === payment.parentEmail || 
         u.name === payment.studentName ||
         u.parentEmail === payment.parentEmail)
      );
      
      const fullName = payment.studentName || '';
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const studentData = {
        name: fullName,
        firstName: firstName,
        lastName: lastName,
        email: payment.parentEmail || '',
        role: 'student',
        phone: payment.phone || '',
        address: payment.address || '',
        city: payment.city || '',
        dateOfBirth: payment.dateOfBirth || '',
        gender: payment.gender || '',
        level: payment.level || '',
        className: payment.className || '',
        parentName: payment.parentName || '',
        parentEmail: payment.parentEmail || '',
        parentPhone: payment.parentPhone || '',
        status: 'active',
        paymentStatus: 'paid',
        paymentApprovedAt: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        needsProfileCompletion: !(payment.dateOfBirth && payment.gender && payment.address && payment.city),
      };

      if (existingStudent) {
        const updated = userDataService.updateUser(existingStudent.id, {
          ...studentData,
          id: existingStudent.id,
          paymentStatus: 'paid',
          paymentApprovedAt: new Date().toISOString(),
        });
        console.log('✅ Student payment status updated:', existingStudent.id);
        return updated;
      } else {
        const studentId = generateStudentId();
        const newStudent = {
          ...studentData,
          id: studentId,
          created_at: new Date().toISOString(),
        };
        const result = userDataService.addUser(newStudent);
        console.log('✅ New student created from payment:', result);
        return result;
      }
    } catch (error) {
      console.error('❌ Error creating/updating student from payment:', error);
      return null;
    }
  };

  // ===== READ APPROVED ADMISSIONS =====
  const readApprovedAdmissions = useCallback(() => {
    try {
      // First try to read from 'registrations'
      const registrationsRaw = localStorage.getItem('registrations');
      if (registrationsRaw) {
        const parsed = JSON.parse(registrationsRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const approved = parsed.filter(r => r.status === 'approved');
          if (approved.length > 0) {
            console.log('📋 Found approved registrations:', approved.length);
            return approved.map(r => ({
              admissionId: r.id || `reg-${Date.now()}`,
              studentName: r.studentName || `${r.firstName || ''} ${r.lastName || ''}`.trim() || 'Unknown Student',
              parentEmail: r.parentEmail || r.email || '',
              level: r.level || '',
              className: r.className || r.requestedClass || '',
              dateOfBirth: r.dateOfBirth || r.dob || '',
              gender: r.gender || '',
              address: r.address || '',
              city: r.city || '',
              phone: r.phone || '',
              parentName: r.parentName || '',
              parentPhone: r.parentPhone || '',
              amount: 500,
              createdAt: r.submittedAt || r.createdAt || new Date().toISOString(),
            }));
          }
        }
      }

      // Fallback to registration_requests
      const raw = localStorage.getItem('registration_requests');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      
      return parsed
        .filter((r) => r && r.status === 'approved' && (r.firstName || r.studentName))
        .map((r) => ({
          admissionId: r.id ?? r._serverId ?? `local-${Math.random().toString(36).slice(2, 10)}`,
          studentName: r.firstName && r.lastName ? `${r.firstName} ${r.lastName}` : r.studentName || r.firstName || '',
          parentEmail: r.parentEmail || r.parent_email || '',
          level: r.level || r.classId || '',
          className: r.requestedClass || r.className || '',
          dateOfBirth: r.dateOfBirth || '',
          gender: r.gender || '',
          address: r.address || '',
          city: r.city || '',
          phone: r.phone || '',
          parentName: r.parentName || '',
          parentPhone: r.parentPhone || '',
          amount: 500,
          createdAt: r.approvedAt || r.updatedAt || r.createdAt || new Date().toISOString(),
        }));
    } catch (e) {
      console.error('Error reading approved admissions:', e);
      return [];
    }
  }, []);

  // ===== READ LOCAL PAYMENTS =====
  const readLocalPayments = useCallback(() => {
    try {
      const raw = localStorage.getItem('student_payments');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Error reading local payments:', e);
      return [];
    }
  }, []);

  // ===== WRITE LOCAL PAYMENTS =====
  const writeLocalPayments = useCallback((list) => {
    try {
      localStorage.setItem('student_payments', JSON.stringify(list));
    } catch (e) {
      console.error('Error writing local payments:', e);
    }
  }, []);

  // ===== UPDATE LOCAL PAYMENT =====
  const updateLocalPayment = useCallback((id, updater) => {
    const list = readLocalPayments();
    const idx = list.findIndex((r) => String(r.id ?? r._serverId) === String(id));
    if (idx === -1) return false;
    list[idx] = { ...list[idx], ...updater(list[idx]) };
    writeLocalPayments(list);
    return true;
  }, [readLocalPayments, writeLocalPayments]);

  // ===== MAP ROWS =====
  const mapLocalRow = useCallback((r) => ({
    id: r.id,
    _serverId: r._serverId || null,
    admissionId: r.admissionId || null,
    studentName: r.studentName || '-',
    parentEmail: r.parentEmail || '',
    level: r.level || '-',
    className: r.className || '',
    month: r.month || new Date().getMonth() + 1,
    year: r.year || new Date().getFullYear(),
    amount: r.amount || 500,
    type: r.type || 'full',
    status: r.status || 'pending',
    method: r.method || null,
    hasReceipt: !!r.receipt,
    receiptData: r.receipt || null,
    receiptName: r.receiptName || null,
    notes: r.notes || '',
    paidAt: r.paidAt || null,
    approvedAt: r.approvedAt || null,
    createdAt: r.createdAt || new Date().toISOString(),
    dateOfBirth: r.dateOfBirth || '',
    gender: r.gender || '',
    address: r.address || '',
    city: r.city || '',
    phone: r.phone || '',
    parentName: r.parentName || '',
    parentPhone: r.parentPhone || '',
    parentEmail: r.parentEmail || '',
  }), []);

  // ===== BUILD ROWS =====
  const buildRows = useCallback((paymentRows) => {
    const monthPayments = paymentRows.filter(
      (p) => p.month === selectedMonth && p.year === selectedYear,
    );
    
    const allDue = readApprovedAdmissions();
    
    const seenAdmissionIds = new Set(
      monthPayments.filter((p) => p.admissionId != null).map((p) => String(p.admissionId)),
    );
    
    const due = allDue
      .filter((s) => !seenAdmissionIds.has(String(s.admissionId)))
      .map((s) => ({
        id: `due-${s.admissionId}`,
        _serverId: null,
        admissionId: s.admissionId,
        studentName: s.studentName || 'Unknown Student',
        parentEmail: s.parentEmail || '',
        level: s.level || '',
        className: s.className || '',
        month: selectedMonth,
        year: selectedYear,
        amount: s.amount || 500,
        type: 'full',
        status: 'due',
        method: null,
        hasReceipt: false,
        receiptData: null,
        receiptName: null,
        notes: '',
        paidAt: null,
        approvedAt: null,
        createdAt: s.createdAt || new Date().toISOString(),
        dateOfBirth: s.dateOfBirth || '',
        gender: s.gender || '',
        address: s.address || '',
        city: s.city || '',
        phone: s.phone || '',
        parentName: s.parentName || '',
        parentPhone: s.parentPhone || '',
        parentEmail: s.parentEmail || '',
      }));
    
    return [...monthPayments, ...due].sort((a, b) =>
      String(a.studentName).localeCompare(String(b.studentName)),
    );
  }, [selectedMonth, selectedYear, readApprovedAdmissions]);

  // ===== FETCH DATA =====
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const localPayments = readLocalPayments().map(mapLocalRow);
      setPayments(localPayments);
      setDueStudents(readApprovedAdmissions());
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError(err.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [mapLocalRow, readLocalPayments, readApprovedAdmissions]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ===== LISTEN FOR STORAGE CHANGES =====
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'registrations' || event.key === 'registration_requests' || event.key === 'student_payments') {
        console.log('🔔 Storage changed:', event.key);
        setTimeout(fetchData, 300);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    const handleQueueUpdate = () => {
      console.log('📝 Registration/update event received');
      setTimeout(fetchData, 300);
    };
    window.addEventListener('registrationSubmitted', handleQueueUpdate);
    window.addEventListener('newNotification', handleQueueUpdate);
    window.addEventListener('paymentQueueUpdated', handleQueueUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('registrationSubmitted', handleQueueUpdate);
      window.removeEventListener('newNotification', handleQueueUpdate);
      window.removeEventListener('paymentQueueUpdated', handleQueueUpdate);
    };
  }, [fetchData]);

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

  // ===== FILTERED ROWS =====
  const allRows = buildRows(payments);

  const filteredRows = allRows.filter((p) => {
    const statusOk = filterStatus === 'all' || p.status === filterStatus;
    let searchOk = true;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      searchOk =
        (p.studentName || '').toLowerCase().includes(q) ||
        (p.parentEmail || '').toLowerCase().includes(q);
    }
    return statusOk && searchOk;
  }).sort((a, b) => {
    let aVal, bVal;
    switch (sortField) {
      case 'studentName':
        aVal = a.studentName || '';
        bVal = b.studentName || '';
        break;
      case 'amount':
        aVal = a.amount || 0;
        bVal = b.amount || 0;
        break;
      case 'status':
        aVal = a.status || '';
        bVal = b.status || '';
        break;
      case 'month':
        aVal = a.month || 0;
        bVal = b.month || 0;
        break;
      default:
        aVal = a.studentName || '';
        bVal = b.studentName || '';
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

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / itemsPerPage));
  const displayedRows = filteredRows.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, selectedMonth, selectedYear, sortField, sortDirection]);

  // ===== STATS =====
  const monthRows = allRows.filter((p) => p.status !== 'due');
  const stats = {
    total: monthRows.length,
    due: allRows.filter((p) => p.status === 'due').length,
    pending: monthRows.filter((p) => p.status === 'pending').length,
    submitted: monthRows.filter((p) => p.status === 'submitted').length,
    approved: monthRows.filter((p) => p.status === 'approved').length,
    collected: monthRows
      .filter((p) => p.status === 'approved')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
    completionRate: monthRows.length > 0 
      ? Math.round((monthRows.filter((p) => p.status === 'approved').length / monthRows.length) * 100)
      : 0,
    pendingReceipts: monthRows.filter((p) => p.status === 'submitted').length,
  };

  // ===== BADGES =====
  const getStatusBadge = (status) => {
    const map = {
      due: { bg: 'secondary', icon: <FaClock />, label: isArabic ? 'لم يُسدد' : 'Not Paid' },
      pending: { bg: 'warning', text: 'dark', icon: <FaClock />, label: isArabic ? 'قيد الانتظار' : 'Pending' },
      submitted: { bg: 'info', text: 'dark', icon: <FaUpload />, label: isArabic ? 'إيصال بانتظار المراجعة' : 'Receipt Submitted' },
      approved: { bg: 'success', icon: <FaCheckCircle />, label: isArabic ? 'معتمد' : 'Approved' },
      rejected: { bg: 'danger', icon: <FaTimes />, label: isArabic ? 'مرفوض' : 'Rejected' },
    };
    const v = map[status] || map.pending;
    return (
      <Badge bg={v.bg} text={v.text || 'white'} className="px-2 py-1" style={arabicFontStyle}>
        {v.icon} {v.label}
      </Badge>
    );
  };

  const getTypeBadge = (type) => {
    if (type === 'half') {
      return <Badge bg="warning" text="dark" style={arabicFontStyle}>{isArabic ? 'نصف' : 'Half'}</Badge>;
    }
    return <Badge bg="primary" style={arabicFontStyle}>{isArabic ? 'كامل' : 'Full'}</Badge>;
  };

  // ===== FILE HELPERS =====
  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // ===== NOTIFY PARENT =====
  const notifyParentOfPayment = (payment, status, notes) => {
    try {
      const monthName = getMonthName(payment.month || selectedMonth);
      const year = payment.year || selectedYear;
      const approved = status === 'approved';
      const title = approved
        ? (isArabic ? '✅ تم اعتماد دفعتك' : '✅ Payment Approved')
        : (isArabic ? '❌ تم رفض دفعتك' : '❌ Payment Rejected');
      const message = approved
        ? (isArabic
            ? `تم اعتماد دفعة ${payment.studentName} لشهر ${monthName} ${year}`
            : `Payment for ${payment.studentName} (${monthName} ${year}) has been approved`)
        : (isArabic
            ? `تم رفض دفعة ${payment.studentName} لشهر ${monthName} ${year}${notes ? ` - السبب: ${notes}` : ''}`
            : `Payment for ${payment.studentName} (${monthName} ${year}) has been rejected${notes ? ` - Reason: ${notes}` : ''}`);
      notificationService.addNotification(title, message, 'payment', '/dashboard/parent/payments', {
        payment_id: String(payment.id ?? payment._serverId ?? ''),
        student_name: payment.studentName,
        month: payment.month || selectedMonth,
        year: payment.year || selectedYear,
        status,
        parent_email: payment.parentEmail || '',
        amount: payment.amount != null ? payment.amount : null,
      });
    } catch (e) {
      console.error('Error sending payment notification:', e);
    }
  };

  // ===== GENERATE MONTHLY PAYMENTS =====
  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const localPayments = readLocalPayments();
      const list = [...localPayments];
      let created = 0;
      
      const dueStudentsList = readApprovedAdmissions();
      
      dueStudentsList.forEach((s) => {
        const exists = list.some(
          (p) =>
            String(p.admissionId) === String(s.admissionId) &&
            p.month === selectedMonth &&
            p.year === selectedYear,
        );
        if (!exists) {
          list.push({
            id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            admissionId: s.admissionId,
            studentName: s.studentName,
            parentEmail: s.parentEmail,
            level: s.level,
            className: s.className,
            month: selectedMonth,
            year: selectedYear,
            amount: s.amount || 500,
            type: 'full',
            status: 'pending',
            method: null,
            receipt: null,
            receiptName: null,
            notes: '',
            paidAt: null,
            approvedAt: null,
            createdAt: new Date().toISOString(),
            dateOfBirth: s.dateOfBirth || '',
            gender: s.gender || '',
            address: s.address || '',
            city: s.city || '',
            phone: s.phone || '',
            parentName: s.parentName || '',
            parentPhone: s.parentPhone || '',
          });
          created++;
        }
      });
      
      writeLocalPayments(list);
      
      notify(
        isArabic
          ? `تم إنشاء ${created} دفعة شهرية`
          : `${created} monthly payments generated`,
        created > 0 ? 'success' : 'info',
      );
      fetchData();
    } catch (err) {
      console.error(err);
      notify(err.message || 'Failed to generate monthly payments', 'error');
    } finally {
      setGenerating(false);
    }
  };

  // ===== OPEN RECORD/EDIT MODAL - AUTO-FILL FROM REGISTRATION DATA =====
  const openPayModal = (payment) => {
    setSelectedPayment(payment);
    
    // Auto-fill form with payment data (which comes from registration)
    setFormType(payment.type || 'full');
    setFormAmount(payment.amount != null ? String(payment.amount) : '');
    setFormMethod(payment.method || 'cash');
    setFormNotes(payment.notes || '');
    setFormReceiptFile(null);
    
    // ===== AUTO-FILL STUDENT INFORMATION FROM PAYMENT DATA =====
    // This data comes from the registration that was approved
    setFormStudentName(payment.studentName || '');
    setFormParentEmail(payment.parentEmail || '');
    setFormParentPhone(payment.parentPhone || '');
    setFormDateOfBirth(payment.dateOfBirth || '');
    setFormGender(payment.gender || '');
    setFormAddress(payment.address || '');
    setFormCity(payment.city || '');
    setFormPhone(payment.phone || '');
    setFormLevel(payment.level || '');
    setFormClassName(payment.className || '');
    
    console.log('📋 Opening payment record with data:', {
      studentName: payment.studentName,
      parentEmail: payment.parentEmail,
      dateOfBirth: payment.dateOfBirth,
      gender: payment.gender,
      address: payment.address,
      city: payment.city,
      level: payment.level,
      className: payment.className,
    });
    
    setShowPayModal(true);
  };

  // ===== SAVE PAYMENT =====
  const handleSavePayment = async () => {
    if (!selectedPayment) return;
    setActionLoading(true);
    setProcessingPaymentId(selectedPayment.id);
    const amount = formAmount !== '' ? Number(formAmount) : null;

    const studentData = {
      studentName: formStudentName || selectedPayment.studentName,
      parentEmail: formParentEmail || selectedPayment.parentEmail,
      parentPhone: formParentPhone || selectedPayment.parentPhone,
      dateOfBirth: formDateOfBirth,
      gender: formGender,
      address: formAddress,
      city: formCity,
      phone: formPhone,
      level: formLevel || selectedPayment.level,
      className: formClassName || selectedPayment.className,
    };

    try {
      const list = readLocalPayments();
      const idx = list.findIndex(p => p.id === selectedPayment.id);
      
      const updatedPayment = {
        ...selectedPayment,
        ...studentData,
        amount,
        type: formType,
        method: formMethod,
        notes: formNotes,
        updatedAt: new Date().toISOString(),
      };
      
      if (idx !== -1) {
        list[idx] = updatedPayment;
      } else {
        list.push(updatedPayment);
      }
      
      writeLocalPayments(list);
      
      if (formReceiptFile) {
        const base64 = await fileToBase64(formReceiptFile);
        const updatedList = readLocalPayments();
        const updateIdx = updatedList.findIndex(p => p.id === selectedPayment.id);
        if (updateIdx !== -1) {
          updatedList[updateIdx].receipt = base64;
          updatedList[updateIdx].receiptName = formReceiptFile.name;
          updatedList[updateIdx].status = 'submitted';
          writeLocalPayments(updatedList);
        }
      }
      
      notify(
        isArabic ? 'تم حفظ الدفعة بنجاح' : 'Payment saved successfully',
        'success'
      );
      setShowPayModal(false);
      setSelectedPayment(null);
      fetchData();
    } catch (err) {
      console.error(err);
      notify(err.message || 'Failed to save payment', 'error');
    } finally {
      setActionLoading(false);
      setProcessingPaymentId(null);
    }
  };

  // ===== UPLOAD RECEIPT =====
  const openReceiptModal = (payment) => {
    setSelectedPayment(payment);
    setReceiptFile(null);
    setShowReceiptModal(true);
  };

  const handleUploadReceipt = async () => {
    if (!selectedPayment || !receiptFile) return;
    setActionLoading(true);
    setProcessingPaymentId(selectedPayment.id);
    try {
      const base64 = await fileToBase64(receiptFile);
      const list = readLocalPayments();
      const idx = list.findIndex(p => p.id === selectedPayment.id);
      if (idx !== -1) {
        list[idx].receipt = base64;
        list[idx].receiptName = receiptFile.name;
        if (list[idx].status !== 'approved') {
          list[idx].status = 'submitted';
        }
        list[idx].updatedAt = new Date().toISOString();
        writeLocalPayments(list);
        
        notify(isArabic ? 'تم رفع الإيصال' : 'Receipt uploaded', 'success');
        setShowReceiptModal(false);
        setSelectedPayment(null);
        fetchData();
      }
    } catch (err) {
      console.error(err);
      notify(err.message || 'Failed to upload receipt', 'error');
    } finally {
      setActionLoading(false);
      setProcessingPaymentId(null);
    }
  };

  // ===== DOWNLOAD RECEIPT =====
  const downloadReceipt = async (payment) => {
    try {
      if (payment.receiptData) {
        const a = document.createElement('a');
        a.href = payment.receiptData;
        a.download = payment.receiptName || `payment-receipt-${payment.id}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }
      notify(
        isArabic ? 'لا يوجد إيصال لهذه الدفعة' : 'No receipt for this payment',
        'info'
      );
    } catch (err) {
      console.error(err);
      notify(err.message || 'Failed to download receipt', 'error');
    }
  };

  // ===== VIEW RECEIPT =====
  const openViewReceipt = async (payment) => {
    try {
      if (payment.receiptData) {
        setReceiptPreviewUrl(payment.receiptData);
        setReceiptPreviewIsPdf(
          /\.pdf$/i.test(payment.receiptName || '') ||
          String(payment.receiptData).startsWith('data:application/pdf'),
        );
        setReceiptPreviewName(payment.receiptName || `payment-receipt-${payment.id}`);
        setShowViewReceiptModal(true);
        return;
      }
      notify(
        isArabic ? 'لا يوجد إيصال لهذه الدفعة' : 'No receipt for this payment',
        'info'
      );
    } catch (err) {
      console.error(err);
      notify(err.message || 'Failed to load receipt', 'error');
    }
  };

  // ===== APPROVE PAYMENT =====
  const handleApprove = async (payment) => {
    if (!payment) {
      notify(isArabic ? '❌ البيانات غير مكتملة' : '❌ Incomplete data', 'error');
      return;
    }
    
    setActionLoading(true);
    setProcessingPaymentId(payment.id);
    
    try {
      console.log('💰 Approving payment for:', payment.studentName);
      
      // Update payment status in localStorage
      const list = readLocalPayments();
      const idx = list.findIndex(p => p.id === payment.id);
      
      if (idx !== -1) {
        list[idx].status = 'approved';
        list[idx].paidAt = new Date().toISOString();
        list[idx].approvedAt = new Date().toISOString();
        list[idx].updatedAt = new Date().toISOString();
        writeLocalPayments(list);
        console.log('✅ Payment status updated to approved');
      }
      
      // Update the registration status
      try {
        const registrations = JSON.parse(localStorage.getItem('registrations') || '[]');
        const regIdx = registrations.findIndex(r => r.id === payment.admissionId);
        if (regIdx !== -1) {
          registrations[regIdx].paymentStatus = 'paid';
          registrations[regIdx].paymentPaidAt = new Date().toISOString();
          localStorage.setItem('registrations', JSON.stringify(registrations));
          console.log('✅ Registration payment status updated');
        }
      } catch (e) {
        console.log('Could not update registration payment status:', e);
      }
      
      // CREATE STUDENT IN USER DATA SERVICE
      const studentResult = createOrUpdateStudentFromPayment(payment);

      if (studentResult) {
        const studentName = payment.studentName || 'Student';
        const studentId = studentResult.id || '';

        // Dispatch events for real-time updates
        window.dispatchEvent(new CustomEvent('paymentApproved', {
          detail: { payment, student: studentResult }
        }));
        window.dispatchEvent(new CustomEvent('usersUpdated', {
          detail: { action: 'add', user: studentResult }
        }));
        
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('refreshStudents'));
          try {
            userDataService.notifyListeners();
          } catch (e) {
            console.warn('Could not notify listeners:', e);
          }
        }, 300);

        notifyParentOfPayment(payment, 'approved');

        notificationService.addNotification(
          isArabic ? `🎓 تم إضافة طالب جديد: ${studentName}` : `🎓 New Student Added: ${studentName}`,
          isArabic 
            ? `تم إنشاء حساب الطالب ${studentName} برقم ${studentId} بعد تأكيد الدفعة`
            : `Student account ${studentName} created with ID ${studentId} after payment confirmation`,
          'student_added',
          '/dashboard/admin/students'
        );

        notify(
          isArabic
            ? `✅ تم اعتماد الدفعة وتم ${studentResult.created_at ? 'إنشاء حساب' : 'تحديث بيانات'} الطالب ${studentName} (${studentId})`
            : `✅ Payment approved and student ${studentResult.created_at ? 'created' : 'updated'} for ${studentName} (${studentId})`,
          'success'
        );
      } else {
        notify(
          isArabic ? '✅ تم اعتماد الدفعة' : '✅ Payment approved',
          'success'
        );
      }

      fetchData();
    } catch (err) {
      console.error('Error approving payment:', err);
      notify(err.message || 'Failed to approve payment', 'error');
    } finally {
      setActionLoading(false);
      setProcessingPaymentId(null);
    }
  };

  // ===== REJECT/REMOVE PAYMENT =====
  const openRejectModal = (payment) => {
    setSelectedPayment(payment);
    setRejectNotes('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!selectedPayment) return;
    setActionLoading(true);
    setProcessingPaymentId(selectedPayment.id);
    try {
      const list = readLocalPayments();
      const idx = list.findIndex(p => p.id === selectedPayment.id);
      
      if (idx !== -1) {
        list[idx].status = 'rejected';
        list[idx].notes = rejectNotes || list[idx].notes;
        list[idx].updatedAt = new Date().toISOString();
        writeLocalPayments(list);
        
        notify(isArabic ? 'تم رفض الدفعة' : 'Payment rejected', 'success');
        notifyParentOfPayment(selectedPayment, 'rejected', rejectNotes);
        setShowRejectModal(false);
        setSelectedPayment(null);
        fetchData();
      }
    } catch (err) {
      console.error(err);
      notify(err.message || 'Failed to reject payment', 'error');
    } finally {
      setActionLoading(false);
      setProcessingPaymentId(null);
    }
  };

  // ===== DELETE PAYMENT =====
  const openDeleteModal = (payment) => {
    setSelectedPayment(payment);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!selectedPayment) return;
    setActionLoading(true);
    setProcessingPaymentId(selectedPayment.id);
    try {
      const list = readLocalPayments();
      const filtered = list.filter(p => p.id !== selectedPayment.id);
      writeLocalPayments(filtered);
      
      notify(isArabic ? 'تم حذف الدفعة' : 'Payment deleted', 'success');
      setShowDeleteModal(false);
      setSelectedPayment(null);
      fetchData();
    } catch (err) {
      console.error(err);
      notify(err.message || 'Failed to delete payment', 'error');
    } finally {
      setActionLoading(false);
      setProcessingPaymentId(null);
    }
  };

  // ===== STATS CARDS =====
  const statsCards = [
    {
      key: 'total',
      icon: <FaFileAlt size={28} />,
      color: '#4a9eff',
      gradient: 'linear-gradient(135deg, #4a9eff, #2a7f9a)',
      value: formatNumber(stats.total),
      label: `${isArabic ? 'دفعات' : 'Payments'} (${getMonthName(selectedMonth)} ${selectedYear})`
    },
    {
      key: 'due',
      icon: <FaClock size={28} />,
      color: '#95a5a6',
      gradient: 'linear-gradient(135deg, #95a5a6, #7f8c8d)',
      value: formatNumber(stats.due),
      label: isArabic ? 'لم يُسدد بعد' : 'Not Paid Yet'
    },
    {
      key: 'pending',
      icon: <FaSpinner size={28} />,
      color: '#f39c12',
      gradient: 'linear-gradient(135deg, #f39c12, #e67e22)',
      value: formatNumber(stats.pending),
      label: isArabic ? 'قيد الانتظار' : 'Pending'
    },
    {
      key: 'submitted',
      icon: <FaUpload size={28} />,
      color: '#1abc9c',
      gradient: 'linear-gradient(135deg, #1abc9c, #16a085)',
      value: formatNumber(stats.submitted),
      label: isArabic ? 'إيصالات للمراجعة' : 'Receipts to Review'
    },
    {
      key: 'approved',
      icon: <FaCheckCircle size={28} />,
      color: '#2ecc71',
      gradient: 'linear-gradient(135deg, #2ecc71, #27ae60)',
      value: formatNumber(stats.approved),
      label: isArabic ? 'مدفوع ومعتمد' : 'Approved'
    },
    {
      key: 'collected',
      icon: <FaCoins size={28} />,
      color: '#27ae60',
      gradient: 'linear-gradient(135deg, #27ae60, #1e8449)',
      value: `${formatNumber(stats.collected)} MAD`,
      label: isArabic ? 'المبلغ المحصل' : 'Collected'
    }
  ];

  // ===== RENDER ACTION BUTTONS - 3 Buttons: Approve, Record, Remove =====
  const renderActions = (p) => {
    const isDisabled = actionLoading;
    const isProcessing = processingPaymentId === p.id;
    const isApproved = p.status === 'approved';
    const isRejected = p.status === 'rejected';
    const isPending = p.status === 'pending' || p.status === 'submitted';
    const isDue = p.status === 'due';
    
    // Show Approve button for: due, pending, submitted
    const showApprove = isDue || isPending;
    
    // Show Record button for: due, pending, rejected
    const showRecord = isDue || isPending || isRejected;
    
    // Show Remove/Delete button for: pending, submitted, rejected (not for approved or due)
    const showRemove = isPending || isRejected;
    
    // Show Delete button for: due (to remove from list)
    const showDelete = isDue;
    
    return (
      <div className="d-flex justify-content-center gap-1 flex-wrap">
        {/* APPROVE BUTTON */}
        {showApprove && (
          <Button 
            variant="outline-success" 
            size="sm" 
            className="action-btn" 
            onClick={() => handleApprove(p)} 
            disabled={isDisabled || isProcessing} 
            title={isArabic ? 'اعتماد الدفعة' : 'Approve payment'} 
            style={arabicFontStyle}
          >
            {isProcessing ? (
              <FaSpinner className="spinning" size={12} />
            ) : (
              <FaCheckCircle size={12} />
            )}
            <span className="d-none d-sm-inline">{isArabic ? 'اعتماد' : 'Approve'}</span>
          </Button>
        )}
        
        {/* RECORD BUTTON */}
        {showRecord && (
          <Button 
            variant="outline-primary" 
            size="sm" 
            className="action-btn" 
            onClick={() => openPayModal(p)} 
            title={isArabic ? 'تسجيل / تعديل الدفعة' : 'Record / Edit payment'} 
            style={arabicFontStyle}
            disabled={isDisabled || isProcessing}
          >
            <FaEdit size={12} /> 
            <span className="d-none d-sm-inline">{isArabic ? 'تسجيل' : 'Record'}</span>
          </Button>
        )}
        
        {/* REMOVE / DELETE BUTTON */}
        {showRemove && (
          <Button 
            variant="outline-danger" 
            size="sm" 
            className="action-btn" 
            onClick={() => openRejectModal(p)} 
            disabled={isDisabled || isProcessing} 
            title={isArabic ? 'رفض الدفعة' : 'Reject payment'} 
            style={arabicFontStyle}
          >
            <FaTimes size={12} />
            <span className="d-none d-sm-inline">{isArabic ? 'رفض' : 'Reject'}</span>
          </Button>
        )}
        
        {/* DELETE BUTTON (for due status) */}
        {showDelete && (
          <Button 
            variant="outline-danger" 
            size="sm" 
            className="action-btn" 
            onClick={() => openDeleteModal(p)} 
            disabled={isDisabled || isProcessing} 
            title={isArabic ? 'حذف' : 'Delete'} 
            style={arabicFontStyle}
          >
            <FaTrash size={12} />
            <span className="d-none d-sm-inline">{isArabic ? 'حذف' : 'Delete'}</span>
          </Button>
        )}
        
        {/* APPROVED BADGE */}
        {isApproved && (
          <Badge bg="success" className="d-flex align-items-center gap-1 px-2 py-1" style={arabicFontStyle}>
            <FaCheckCircle size={12} /> {isArabic ? 'معتمد' : 'Approved'}
          </Badge>
        )}
        
        {/* REJECTED BADGE */}
        {isRejected && (
          <Badge bg="danger" className="d-flex align-items-center gap-1 px-2 py-1" style={arabicFontStyle}>
            <FaTimes size={12} /> {isArabic ? 'مرفوض' : 'Rejected'}
          </Badge>
        )}
      </div>
    );
  };

  return (
    <div className="payments-management" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* ===== PAGE HEADER ===== */}
      <div className="page-header d-flex justify-content-between align-items-center flex-wrap gap-2 gap-md-3 mb-3 mb-md-4">
        <div>
          <h4 className="fw-bold mb-0" style={{ ...arabicFontStyle, color: '#1a5f7a', fontSize: 'clamp(1rem, 1.8vw, 1.5rem)' }}>
            <FaMoneyBillWave className="me-2" style={{ color: '#2ecc71' }} />
            {isArabic ? 'إدارة المدفوعات الشهرية' : 'Monthly Payments Management'}
          </h4>
          <p className="text-muted mb-0" style={{ ...arabicFontStyle, fontSize: 'clamp(0.7rem, 0.9vw, 0.85rem)' }}>
            {isArabic
              ? 'تسجيل دفع كل طالب شهرياً (دفعة كاملة أو نصف) ومراجعة إيصالات الدفع قبل الاعتماد'
              : 'Record every student monthly payment (full or half) and review payment receipts before approval'}
          </p>
        </div>
        <div className="d-flex gap-1 gap-sm-2 flex-wrap">
          <Button 
            variant="outline-primary" 
            size="sm" 
            onClick={fetchData}
            disabled={loading}
            className="action-btn-responsive"
            style={{ ...arabicFontStyle, borderRadius: '12px', fontSize: 'clamp(0.6rem, 0.8vw, 0.8rem)' }}
          >
            <FaSync className={loading ? 'spinning' : ''} /> <span className="d-none d-sm-inline">{isArabic ? 'تحديث' : 'Refresh'}</span>
          </Button>
          <Button 
            variant="primary" 
            size="sm" 
            onClick={handleGenerate}
            disabled={generating || loading}
            className="action-btn-responsive"
            style={{ ...arabicFontStyle, borderRadius: '12px', fontSize: 'clamp(0.6rem, 0.8vw, 0.8rem)' }}
          >
            {generating ? (
              <>
                <FaSpinner className="spinning me-1" /> {isArabic ? 'جاري الإنشاء...' : 'Generating...'}
              </>
            ) : (
              <>
                <FaPlus className="me-1" /> <span className="d-none d-sm-inline">{isArabic ? 'إنشاء دفعات الشهر' : 'Generate Month'}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ===== STATS CARDS ===== */}
      <Row className="g-2 g-md-3 g-lg-4 mb-3 mb-md-4">
        {statsCards.map((stat) => (
          <Col key={stat.key} xs={6} sm={4} md={4} lg={2} xl={2} className="px-1 px-sm-2">
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

      {/* ===== FILTERS ===== */}
      <Card className="modern-card mb-3 mb-md-4" style={{ background: darkMode ? '#1a1a2e' : '#ffffff', borderColor: darkMode ? '#2d2d44' : '#e9ecef' }}>
        <Card.Body className="p-2 p-md-3">
          <Row className="g-1 g-md-2 align-items-end">
            <Col xs={12} sm={6} md={3} lg={3} className="px-1 px-sm-2">
              <Form.Group>
                <Form.Label style={{ ...arabicFontStyle, fontSize: 'clamp(0.6rem, 0.8vw, 0.8rem)', color: darkMode ? '#adb5bd' : '#6c757d' }}>
                  <FaCalendarAlt className="me-1" /> {isArabic ? 'الشهر' : 'Month'}
                </Form.Label>
                <Form.Select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="form-select-sm"
                  style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: 'clamp(0.55rem, 0.7vw, 0.75rem)' }}
                >
                  {monthNames.map((name, i) => (
                    <option key={i + 1} value={i + 1}>
                      {isArabic ? monthNamesAr[i] : name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6} md={2} lg={2} className="px-1 px-sm-2">
              <Form.Group>
                <Form.Label style={{ ...arabicFontStyle, fontSize: 'clamp(0.6rem, 0.8vw, 0.8rem)', color: darkMode ? '#adb5bd' : '#6c757d' }}>
                  {isArabic ? 'السنة' : 'Year'}
                </Form.Label>
                <Form.Control
                  type="number"
                  min="2020"
                  className="form-control-sm"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value) || now.getFullYear())}
                  style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: 'clamp(0.55rem, 0.7vw, 0.75rem)' }}
                />
              </Form.Group>
            </Col>
            <Col xs={12} sm={6} md={4} lg={4} className="px-1 px-sm-2">
              <InputGroup size="sm">
                <InputGroup.Text style={{ background: 'transparent', borderColor: darkMode ? '#2d2d44' : '#ced4da' }}>
                  <FaSearch size={12} />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder={isArabic ? 'بحث بالاسم أو البريد' : 'Search by name or email'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-control-sm"
                  style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.55rem, 0.7vw, 0.75rem)' }}
                />
                {searchTerm && (
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setSearchTerm('')}
                    style={{ borderRadius: '0 12px 12px 0' }}
                  >
                    <FaTimesCircle size={12} />
                  </Button>
                )}
              </InputGroup>
            </Col>
            <Col xs={6} sm={3} md={2} lg={2} className="px-1 px-sm-2">
              <Form.Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="form-select-sm"
                style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: 'clamp(0.55rem, 0.7vw, 0.75rem)' }}
              >
                <option value="all">{isArabic ? 'جميع الحالات' : 'All Status'}</option>
                <option value="due">{isArabic ? 'لم يُسدد' : 'Not Paid'}</option>
                <option value="pending">{isArabic ? 'قيد الانتظار' : 'Pending'}</option>
                <option value="submitted">{isArabic ? 'إيصال مرسل' : 'Receipt Submitted'}</option>
                <option value="approved">{isArabic ? 'معتمد' : 'Approved'}</option>
                <option value="rejected">{isArabic ? 'مرفوض' : 'Rejected'}</option>
              </Form.Select>
            </Col>
            <Col xs={6} sm={3} md={1} lg={1} className="px-1 px-sm-2">
              <Button
                variant="primary"
                size="sm"
                className="w-100"
                onClick={handleGenerate}
                disabled={generating || loading}
                style={{ ...arabicFontStyle, borderRadius: '12px', fontSize: 'clamp(0.55rem, 0.7vw, 0.75rem)' }}
              >
                <FaPlus size={12} />
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* ===== PAYMENTS TABLE ===== */}
      <Card className="modern-card" style={{ background: darkMode ? '#1a1a2e' : '#ffffff', borderColor: darkMode ? '#2d2d44' : '#e9ecef' }}>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <FaSpinner className="spinning" size={40} style={{ color: '#3498db' }} />
              <p className="mt-2 text-muted" style={arabicFontStyle}>{isArabic ? 'جاري تحميل المدفوعات...' : 'Loading payments...'}</p>
            </div>
          ) : error ? (
            <Alert variant="danger" className="m-3">{error}</Alert>
          ) : displayedRows.length === 0 ? (
            <div className="text-center py-5">
              <FaMoneyBillWave size={50} className="text-muted mb-3" />
              <p style={arabicFontStyle}>
                {isArabic
                  ? 'لا توجد دفعات لهذا الشهر. اضغط "إنشاء دفعات الشهر" لتوليد دفعات كل الطلاب.'
                  : 'No payments for this month. Click "Generate Month" to create payments for all students.'}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0" style={arabicFontStyle}>
                <thead style={{ background: darkMode ? '#0d1117' : '#f8f9fa' }}>
                  <tr>
                    <th 
                      onClick={() => handleSort('studentName')}
                      style={{ cursor: 'pointer', color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.6rem, 0.8vw, 0.85rem)' }}
                    >
                      {isArabic ? 'الطالب' : 'Student'} {getSortIcon('studentName')}
                    </th>
                    <th 
                      onClick={() => handleSort('month')}
                      style={{ cursor: 'pointer', color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.6rem, 0.8vw, 0.85rem)' }}
                      className="d-none d-md-table-cell"
                    >
                      {isArabic ? 'الشهر' : 'Month'} {getSortIcon('month')}
                    </th>
                    <th style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.6rem, 0.8vw, 0.85rem)' }} className="d-none d-sm-table-cell">
                      {isArabic ? 'نوع الدفعة' : 'Type'}
                    </th>
                    <th 
                      onClick={() => handleSort('amount')}
                      style={{ cursor: 'pointer', color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.6rem, 0.8vw, 0.85rem)' }}
                      className="d-none d-sm-table-cell"
                    >
                      {isArabic ? 'المبلغ' : 'Amount'} {getSortIcon('amount')}
                    </th>
                    <th style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.6rem, 0.8vw, 0.85rem)' }} className="d-none d-lg-table-cell">
                      {isArabic ? 'طريقة الدفع' : 'Method'}
                    </th>
                    <th 
                      onClick={() => handleSort('status')}
                      style={{ cursor: 'pointer', color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.6rem, 0.8vw, 0.85rem)' }}
                      className="d-none d-sm-table-cell"
                    >
                      {isArabic ? 'الحالة' : 'Status'} {getSortIcon('status')}
                    </th>
                    <th style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.6rem, 0.8vw, 0.85rem)' }} className="d-none d-md-table-cell">
                      {isArabic ? 'الإيصال' : 'Receipt'}
                    </th>
                    <th className="text-center" style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.6rem, 0.8vw, 0.85rem)' }}>
                      {isArabic ? 'الإجراءات' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayedRows.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="d-flex align-items-center gap-1 gap-md-2">
                          <div
                            className="d-flex align-items-center justify-content-center rounded-circle"
                            style={{ 
                              width: 'clamp(28px, 3vw, 34px)', 
                              height: 'clamp(28px, 3vw, 34px)', 
                              background: '#e8f6ef', 
                              color: '#2ecc71',
                              flexShrink: 0,
                              fontSize: 'clamp(0.6rem, 0.7vw, 0.8rem)'
                            }}
                          >
                            <FaUserGraduate size={14} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div className="fw-semibold text-truncate" style={{ ...arabicFontStyle, fontSize: 'clamp(0.65rem, 0.8vw, 0.85rem)', color: darkMode ? '#e9ecef' : '#212529' }}>
                              {p.studentName}
                            </div>
                            {p.className && (
                              <small className="text-muted d-none d-md-block text-truncate" style={{ ...arabicFontStyle, fontSize: 'clamp(0.45rem, 0.55vw, 0.65rem)' }}>
                                {p.className}
                              </small>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="d-none d-md-table-cell" style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.6rem, 0.75vw, 0.8rem)' }}>
                        <div>{getMonthName(p.month)}</div>
                        <small className="text-muted" style={{ fontSize: 'clamp(0.45rem, 0.55vw, 0.6rem)' }}>{p.year}</small>
                      </td>
                      <td className="d-none d-sm-table-cell">{getTypeBadge(p.type)}</td>
                      <td className="d-none d-sm-table-cell" style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.6rem, 0.75vw, 0.8rem)' }}>
                        <strong>{p.amount != null ? `${p.amount} MAD` : '-'}</strong>
                      </td>
                      <td className="d-none d-lg-table-cell">
                        {p.method
                          ? <Badge bg="light" text="dark" style={{ ...arabicFontStyle, fontSize: 'clamp(0.45rem, 0.55vw, 0.6rem)' }}>{getPaymentMethodLabel(p.method)}</Badge>
                          : '-'}
                      </td>
                      <td className="d-none d-sm-table-cell">{getStatusBadge(p.status)}</td>
                      <td className="d-none d-md-table-cell">
                        {p.hasReceipt ? (
                          <div className="d-flex gap-1 flex-wrap">
                            <Button variant="outline-primary" size="sm" className="action-btn" onClick={() => openViewReceipt(p)} title={isArabic ? 'عرض الإيصال' : 'View receipt'} style={arabicFontStyle}>
                              <FaEye size={12} />
                            </Button>
                            <Button variant="outline-secondary" size="sm" className="action-btn" onClick={() => downloadReceipt(p)} title={isArabic ? 'تنزيل الإيصال' : 'Download receipt'} style={arabicFontStyle}>
                              <FaDownload size={12} />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted" style={{ ...arabicFontStyle, fontSize: 'clamp(0.55rem, 0.7vw, 0.75rem)' }}>-</span>
                        )}
                      </td>
                      <td className="text-center">{renderActions(p)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
        {!loading && !error && filteredRows.length > 0 && (
          <Card.Footer className="d-flex justify-content-between align-items-center py-2 flex-wrap gap-2" style={{ borderColor: darkMode ? '#2d2d44' : '#e9ecef' }}>
            <div className="text-muted small" style={{ ...arabicFontStyle, fontSize: 'clamp(0.55rem, 0.7vw, 0.75rem)' }}>
              {isArabic
                ? `عرض ${displayedRows.length} من ${filteredRows.length}`
                : `Showing ${displayedRows.length} of ${filteredRows.length}`}
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

      {/* ===== RECORD / EDIT PAYMENT MODAL - AUTO-FILLED ===== */}
      <Modal show={showPayModal} onHide={() => setShowPayModal(false)} centered size="lg" className="modern-modal">
        <Modal.Header closeButton style={{ borderBottom: darkMode ? '1px solid #2d2d44' : '1px solid #e9ecef' }}>
          <Modal.Title style={arabicFontStyle}>
            <FaMoneyBillWave className="me-2" style={{ color: '#2ecc71' }} />
            {selectedPayment?.status === 'due'
              ? (isArabic ? 'تسجيل دفعة جديدة' : 'Record New Payment')
              : (isArabic ? 'تعديل الدفعة' : 'Edit Payment')}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? '#1a1a2e' : '#ffffff', maxHeight: '70vh', overflowY: 'auto' }}>
          {selectedPayment && (
            <>
              {/* Student Information Section - AUTO-FILLED FROM REGISTRATION */}
              <div className="section-divider">
                <span className="section-divider-label">
                  <FaUser className="me-2" /> {isArabic ? 'معلومات الطالب (من طلب التسجيل)' : 'Student Information (from registration)'}
                </span>
              </div>
              
              <Form.Group className="mb-3">
                <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.7rem, 0.9vw, 0.9rem)' }}>
                  {isArabic ? 'اسم الطالب' : 'Student Name'}
                </Form.Label>
                <Form.Control
                  type="text"
                  value={formStudentName}
                  onChange={(e) => setFormStudentName(e.target.value)}
                  placeholder={isArabic ? 'أدخل اسم الطالب' : 'Enter student name'}
                  style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: 'clamp(0.75rem, 0.9vw, 1rem)' }}
                />
              </Form.Group>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.7rem, 0.9vw, 0.9rem)' }}>
                      {isArabic ? 'بريد ولي الأمر' : 'Parent Email'}
                    </Form.Label>
                    <Form.Control
                      type="email"
                      value={formParentEmail}
                      onChange={(e) => setFormParentEmail(e.target.value)}
                      placeholder={isArabic ? 'أدخل بريد ولي الأمر' : 'Enter parent email'}
                      style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: 'clamp(0.75rem, 0.9vw, 1rem)' }}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.7rem, 0.9vw, 0.9rem)' }}>
                      {isArabic ? 'هاتف ولي الأمر' : 'Parent Phone'}
                    </Form.Label>
                    <Form.Control
                      type="tel"
                      value={formParentPhone}
                      onChange={(e) => setFormParentPhone(e.target.value)}
                      placeholder={isArabic ? 'أدخل هاتف ولي الأمر' : 'Enter parent phone'}
                      style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: 'clamp(0.75rem, 0.9vw, 1rem)' }}
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.7rem, 0.9vw, 0.9rem)' }}>
                      <FaBirthdayCake className="me-1" /> {isArabic ? 'تاريخ الميلاد' : 'Date of Birth'}
                    </Form.Label>
                    <Form.Control
                      type="date"
                      value={formDateOfBirth}
                      onChange={(e) => setFormDateOfBirth(e.target.value)}
                      style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: 'clamp(0.75rem, 0.9vw, 1rem)' }}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.7rem, 0.9vw, 0.9rem)' }}>
                      <FaVenusMars className="me-1" /> {isArabic ? 'الجنس' : 'Gender'}
                    </Form.Label>
                    <Form.Select
                      value={formGender}
                      onChange={(e) => setFormGender(e.target.value)}
                      style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: 'clamp(0.75rem, 0.9vw, 1rem)' }}
                    >
                      <option value="">{isArabic ? 'اختر' : 'Select'}</option>
                      {genderOptions.map((g) => (
                        <option key={g.value} value={g.value}>{g.label}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.7rem, 0.9vw, 0.9rem)' }}>
                      <FaMapMarkerAlt className="me-1" /> {isArabic ? 'العنوان' : 'Address'}
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={formAddress}
                      onChange={(e) => setFormAddress(e.target.value)}
                      placeholder={isArabic ? 'أدخل العنوان' : 'Enter address'}
                      style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: 'clamp(0.75rem, 0.9vw, 1rem)' }}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.7rem, 0.9vw, 0.9rem)' }}>
                      <FaCity className="me-1" /> {isArabic ? 'المدينة' : 'City'}
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={formCity}
                      onChange={(e) => setFormCity(e.target.value)}
                      placeholder={isArabic ? 'أدخل المدينة' : 'Enter city'}
                      style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: 'clamp(0.75rem, 0.9vw, 1rem)' }}
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.7rem, 0.9vw, 0.9rem)' }}>
                      {isArabic ? 'المستوى' : 'Level'}
                    </Form.Label>
                    <Form.Select
                      value={formLevel}
                      onChange={(e) => setFormLevel(e.target.value)}
                      style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: 'clamp(0.75rem, 0.9vw, 1rem)' }}
                    >
                      {levelOptions.map((l) => (
                        <option key={l.value} value={l.value}>{l.label}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.7rem, 0.9vw, 0.9rem)' }}>
                      {isArabic ? 'الفصل' : 'Class'}
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={formClassName}
                      onChange={(e) => setFormClassName(e.target.value)}
                      placeholder={isArabic ? 'أدخل الفصل' : 'Enter class'}
                      style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: 'clamp(0.75rem, 0.9vw, 1rem)' }}
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <hr />
              
              {/* Payment Information Section */}
              <div className="section-divider">
                <span className="section-divider-label">
                  <FaMoneyBillWave className="me-2" /> {isArabic ? 'معلومات الدفع' : 'Payment Information'}
                </span>
              </div>
              
              <p className="mb-1" style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                <strong>{isArabic ? 'الشهر' : 'Month'}:</strong> {getMonthName(selectedMonth)} {selectedYear}
              </p>
              
              <Form.Group className="mb-3">
                <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.7rem, 0.9vw, 0.9rem)' }}>
                  <FaPercent className="me-1" /> {isArabic ? 'نوع الدفعة' : 'Payment Type'}
                </Form.Label>
                <div className="d-flex gap-3">
                  <Form.Check
                    type="radio"
                    id="pay-full"
                    label={isArabic ? 'دفعة كاملة' : 'Full Payment'}
                    checked={formType === 'full'}
                    onChange={() => {
                      setFormType('full');
                      if (selectedPayment.amount != null) {
                        setFormAmount(String(selectedPayment.amount));
                      }
                    }}
                    style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}
                  />
                  <Form.Check
                    type="radio"
                    id="pay-half"
                    label={isArabic ? 'نصف دفعة' : 'Half Payment'}
                    checked={formType === 'half'}
                    onChange={() => {
                      setFormType('half');
                      if (selectedPayment.amount != null) {
                        setFormAmount(String(Number(selectedPayment.amount) / 2));
                      }
                    }}
                    style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}
                  />
                </div>
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.7rem, 0.9vw, 0.9rem)' }}>
                  {isArabic ? 'المبلغ (درهم)' : 'Amount (MAD)'}
                </Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  step="0.01"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder={isArabic ? 'أدخل المبلغ' : 'Enter amount'}
                  style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: 'clamp(0.75rem, 0.9vw, 1rem)' }}
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.7rem, 0.9vw, 0.9rem)' }}>
                  {isArabic ? 'طريقة الدفع' : 'Payment Method'}
                </Form.Label>
                <Form.Select
                  value={formMethod}
                  onChange={(e) => setFormMethod(e.target.value)}
                  style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: 'clamp(0.75rem, 0.9vw, 1rem)' }}
                >
                  {paymentMethods.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </Form.Select>
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.7rem, 0.9vw, 0.9rem)' }}>
                  {isArabic ? 'ملاحظات' : 'Notes'}
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: 'clamp(0.75rem, 0.9vw, 1rem)' }}
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.7rem, 0.9vw, 0.9rem)' }}>
                  <FaUpload className="me-1" /> {isArabic ? 'إيصال / إثبات الدفع (اختياري)' : 'Payment Receipt / Evidence (optional)'}
                </Form.Label>
                <Form.Control
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => setFormReceiptFile(e.target.files?.[0] || null)}
                  style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: 'clamp(0.75rem, 0.9vw, 1rem)' }}
                />
                <Form.Text muted style={arabicFontStyle}>
                  {isArabic
                    ? 'ملف PDF للإيصال ليتمكن المشرف من تنزيله قبل الاعتماد'
                    : 'PDF file of the receipt so the admin can download it before approval'}
                </Form.Text>
              </Form.Group>
              
              <div className="d-flex align-items-center gap-2 text-muted">
                <FaExclamationTriangle className="text-warning" />
                <small style={arabicFontStyle}>
                  {isArabic
                    ? 'ستُسجل الدفعة في سجل المدفوعات الشهرية لهذا الطالب'
                    : 'The payment will be recorded in this student monthly payments log'}
                </small>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer style={{ borderTop: darkMode ? '1px solid #2d2d44' : '1px solid #e9ecef' }}>
          <Button variant="secondary" onClick={() => setShowPayModal(false)} style={{ ...arabicFontStyle, borderRadius: '12px', fontSize: 'clamp(0.7rem, 0.9vw, 0.9rem)' }}>
            {isArabic ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button variant="success" onClick={handleSavePayment} disabled={actionLoading} style={{ ...arabicFontStyle, borderRadius: '12px', fontSize: 'clamp(0.7rem, 0.9vw, 0.9rem)' }}>
            {actionLoading ? (
              <>
                <FaSpinner className="spinning me-2" /> {isArabic ? 'جاري الحفظ...' : 'Saving...'}
              </>
            ) : (
              <><FaCheckCircle className="me-1" /> {isArabic ? 'حفظ الدفعة' : 'Save Payment'}</>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===== UPLOAD RECEIPT MODAL ===== */}
      <Modal show={showReceiptModal} onHide={() => setShowReceiptModal(false)} centered className="modern-modal">
        <Modal.Header closeButton style={{ borderBottom: darkMode ? '1px solid #2d2d44' : '1px solid #e9ecef' }}>
          <Modal.Title style={arabicFontStyle}>
            <FaUpload className="me-2" style={{ color: '#f39c12' }} />
            {isArabic ? 'رفع إيصال الدفع' : 'Upload Payment Receipt'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? '#1a1a2e' : '#ffffff' }}>
          {selectedPayment && (
            <>
              <p style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                <strong>{isArabic ? 'الطالب' : 'Student'}:</strong> {selectedPayment.studentName}
              </p>
              <Form.Group>
                <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.7rem, 0.9vw, 0.9rem)' }}>
                  {isArabic ? 'اختر ملف الإيصال / الإثبات' : 'Choose receipt / evidence file'}
                </Form.Label>
                <Form.Control
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: 'clamp(0.75rem, 0.9vw, 1rem)' }}
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer style={{ borderTop: darkMode ? '1px solid #2d2d44' : '1px solid #e9ecef' }}>
          <Button variant="secondary" onClick={() => setShowReceiptModal(false)} style={{ ...arabicFontStyle, borderRadius: '12px', fontSize: 'clamp(0.7rem, 0.9vw, 0.9rem)' }}>
            {isArabic ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button variant="info" onClick={handleUploadReceipt} disabled={actionLoading || !receiptFile} style={{ ...arabicFontStyle, color: 'white', borderRadius: '12px', fontSize: 'clamp(0.7rem, 0.9vw, 0.9rem)' }}>
            {actionLoading ? (
              <>
                <FaSpinner className="spinning me-2" /> {isArabic ? 'جاري الرفع...' : 'Uploading...'}
              </>
            ) : (
              <><FaUpload className="me-1" /> {isArabic ? 'رفع' : 'Upload'}</>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===== VIEW RECEIPT MODAL ===== */}
      <Modal show={showViewReceiptModal} onHide={() => setShowViewReceiptModal(false)} centered size="lg" className="modern-modal">
        <Modal.Header closeButton style={{ borderBottom: darkMode ? '1px solid #2d2d44' : '1px solid #e9ecef' }}>
          <Modal.Title style={arabicFontStyle}>
            <FaEye className="me-2" style={{ color: '#1a5f7a' }} />
            {isArabic ? 'معاينة إيصال الدفع' : 'Payment Receipt Preview'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? '#1a1a2e' : '#ffffff' }}>
          <div className="mb-2 text-muted small" style={arabicFontStyle}>
            {isArabic ? 'الإيصال المرفوع من ولي الأمر' : 'Receipt uploaded by the parent'}
            {receiptPreviewName ? ` — ${receiptPreviewName}` : ''}
          </div>
          {receiptPreviewUrl && (receiptPreviewIsPdf ? (
            <iframe src={receiptPreviewUrl} title={receiptPreviewName || 'Receipt'} style={{ width: '100%', height: '520px', border: `1px solid ${darkMode ? '#2d2d44' : '#dee2e6'}`, borderRadius: '8px' }} />
          ) : (
            <img src={receiptPreviewUrl} alt={receiptPreviewName || 'Receipt'} style={{ width: '100%', maxHeight: '520px', objectFit: 'contain', borderRadius: '8px', border: `1px solid ${darkMode ? '#2d2d44' : '#dee2e6'}` }} />
          ))}
        </Modal.Body>
        <Modal.Footer style={{ borderTop: darkMode ? '1px solid #2d2d44' : '1px solid #e9ecef' }}>
          <Button variant="secondary" onClick={() => setShowViewReceiptModal(false)} style={{ ...arabicFontStyle, borderRadius: '12px', fontSize: 'clamp(0.7rem, 0.9vw, 0.9rem)' }}>
            {isArabic ? 'إغلاق' : 'Close'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===== REJECT MODAL ===== */}
      <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)} centered className="modern-modal">
        <Modal.Header closeButton style={{ borderBottom: darkMode ? '1px solid #2d2d44' : '1px solid #e9ecef' }}>
          <Modal.Title style={arabicFontStyle}>
            <FaTimes className="me-2 text-danger" />
            {isArabic ? 'رفض الدفعة' : 'Reject Payment'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? '#1a1a2e' : '#ffffff' }}>
          {selectedPayment && (
            <>
              <p style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                <strong>{isArabic ? 'الطالب' : 'Student'}:</strong> {selectedPayment.studentName}
              </p>
              <Form.Group>
                <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.7rem, 0.9vw, 0.9rem)' }}>
                  {isArabic ? 'سبب الرفض' : 'Reason for rejection'}
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  placeholder={isArabic ? 'مثال: الإيصال غير واضح' : 'e.g. Receipt is not clear'}
                  style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: 'clamp(0.75rem, 0.9vw, 1rem)' }}
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer style={{ borderTop: darkMode ? '1px solid #2d2d44' : '1px solid #e9ecef' }}>
          <Button variant="secondary" onClick={() => setShowRejectModal(false)} style={{ ...arabicFontStyle, borderRadius: '12px', fontSize: 'clamp(0.7rem, 0.9vw, 0.9rem)' }}>
            {isArabic ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button variant="danger" onClick={handleReject} disabled={actionLoading} style={{ ...arabicFontStyle, borderRadius: '12px', fontSize: 'clamp(0.7rem, 0.9vw, 0.9rem)' }}>
            {actionLoading ? (
              <>
                <FaSpinner className="spinning me-2" /> {isArabic ? 'جاري الحفظ...' : 'Saving...'}
              </>
            ) : (
              isArabic ? 'تأكيد الرفض' : 'Confirm Rejection'
            )}
          </Button>
        </Modal.Footer>
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
          <p style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
            {isArabic
              ? `هل أنت متأكد من حذف دفعة "${selectedPayment?.studentName}" لشهر ${getMonthName(selectedMonth)}؟`
              : `Are you sure you want to delete the payment for "${selectedPayment?.studentName}" for ${getMonthName(selectedMonth)}?`}
          </p>
        </Modal.Body>
        <Modal.Footer style={{ borderTop: darkMode ? '1px solid #2d2d44' : '1px solid #e9ecef' }}>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} style={{ ...arabicFontStyle, borderRadius: '12px', fontSize: 'clamp(0.7rem, 0.9vw, 0.9rem)' }}>
            {isArabic ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={actionLoading} style={{ ...arabicFontStyle, borderRadius: '12px', fontSize: 'clamp(0.7rem, 0.9vw, 0.9rem)' }}>
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

      <style>{`
        .payments-management { padding: 0; }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }

        [dir="rtl"] .page-header { flex-direction: row-reverse; }

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

        .responsive-pagination .page-link {
          padding: 4px 8px;
          font-size: clamp(0.55rem, 0.7vw, 0.75rem);
        }

        .section-divider {
          display: flex;
          align-items: center;
          margin: 20px 0 16px;
        }

        .section-divider::before {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(to right, transparent, ${darkMode ? '#2d2d44' : '#e9ecef'});
        }

        .section-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(to left, transparent, ${darkMode ? '#2d2d44' : '#e9ecef'});
        }

        .section-divider-label {
          padding: 0 16px;
          font-weight: 600;
          font-size: clamp(0.75rem, 0.9vw, 0.95rem);
          color: ${darkMode ? '#adb5bd' : '#6c757d'};
          white-space: nowrap;
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

        @media (max-width: 768px) {
          .action-btn {
            padding: 2px 4px !important;
            min-width: 22px;
            min-height: 22px;
            font-size: 0.5rem !important;
          }
          .action-btn svg { font-size: 8px !important; }
          .action-btn-responsive {
            font-size: 0.6rem !important;
            padding: 3px 6px !important;
          }
          .action-btn-responsive svg { font-size: 10px !important; }
        }

        @media (max-width: 576px) {
          .page-header {
            flex-direction: column;
            align-items: stretch !important;
          }
          .responsive-pagination .page-link { padding: 2px 6px; font-size: 0.5rem; }
          .responsive-pagination .page-item:not(.active) .page-link { display: none; }
          .responsive-pagination .page-item.active .page-link { display: block; }
          .responsive-pagination .page-item.prev .page-link,
          .responsive-pagination .page-item.next .page-link { display: block; }
          .action-btn {
            padding: 1px 3px !important;
            min-width: 18px;
            min-height: 18px;
          }
          .action-btn svg { font-size: 7px !important; }
          .action-btn-responsive {
            font-size: 0.5rem !important;
            padding: 2px 4px !important;
          }
          .action-btn-responsive svg { font-size: 8px !important; }
        }
      `}</style>
    </div>
  );
};

export default PaymentsManagement;