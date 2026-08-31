// src/components/dashboard/parent/ParentPayments.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Row, Col, Card, Table, Badge, Button, Form, Modal,
  Alert, Spinner, ProgressBar
} from 'react-bootstrap';
import {
  FaMoneyBillWave, FaDownload, FaUpload, FaCheckCircle, FaClock,
  FaTimes, FaUserGraduate, FaCalendarAlt, FaCoins, FaSync,
  FaFilePdf, FaFileImage, FaFile, FaEye, FaTrash,
  FaPlus, FaSearch, FaFilter, FaArrowRight, FaSpinner,
  FaMoneyBill, FaWallet, FaCreditCard, FaReceipt,
  FaEdit, FaSave, FaPen
} from 'react-icons/fa';
import { useLanguage } from '../../../context/LanguageContext';
import { useNotification } from '../../../hooks/useNotification';
import { useAuth } from '../../../hooks/useAuth';
import api from '../../../services/api';

const ParentPayments = () => {
  const { isArabic } = useLanguage();
  const { notify } = useNotification();
  const { user } = useAuth();

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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState('all');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editAmount, setEditAmount] = useState('');
  const [editNote, setEditNote] = useState('');

  const arabicFontStyle = {
    fontFamily: isArabic
      ? '"Hacen Tunisia", "Hacen Tunisia Bd", "Noto Sans Arabic", "Vazirmatn", "Traditional Arabic", "Arabic Typesetting", serif'
      : 'inherit',
    lineHeight: isArabic ? '1.8' : '1.6',
    letterSpacing: isArabic ? '0.5px' : '0px',
    fontSize: isArabic
      ? 'clamp(0.95rem, 1.15vw, 1.1rem)'
      : 'clamp(0.9rem, 1.05vw, 1.05rem)',
  };

  // ===== CHECK DARK MODE =====
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

  // ===== LOAD CHILDREN =====
  const loadChildren = useCallback(() => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const userId = currentUser?.id || user?.id || localStorage.getItem('userId');
      
      let allStudents = JSON.parse(localStorage.getItem('school_students') || '[]');
      
      if (allStudents.length === 0) {
        const allUsers = JSON.parse(localStorage.getItem('school_users') || '[]');
        allStudents = allUsers.filter(u => u.role === 'student');
      }
      
      let parentChildren = [];
      
      if (userId) {
        parentChildren = allStudents.filter(s => s.parentId === userId);
      }
      
      if (parentChildren.length === 0) {
        const parentName = currentUser?.name || user?.name || '';
        if (parentName) {
          parentChildren = allStudents.filter(s => s.parentName === parentName);
        }
      }
      
      if (parentChildren.length === 0) {
        const parents = JSON.parse(localStorage.getItem('school_parents') || '[]');
        const currentParent = parents.find(p => p.id === userId || p.email === currentUser?.email);
        
        if (currentParent) {
          const childNames = currentParent.childrenNames ? 
            currentParent.childrenNames.split(',').map(n => n.trim()) : [];
          
          if (childNames.length > 0) {
            parentChildren = allStudents.filter(s => {
              const studentName = s.name || s.firstName || '';
              return childNames.some(childName => studentName.includes(childName) || childName.includes(studentName));
            });
          }
        }
      }
      
      setChildren(parentChildren);
      
      if (parentChildren.length > 0 && selectedChild === 'all') {
        setSelectedChild(parentChildren[0].id);
      }
    } catch (error) {
      console.error('Error loading children:', error);
    }
  }, [user, selectedChild]);

  // ===== FETCH PAYMENTS =====
  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const allPayments = JSON.parse(localStorage.getItem('school_payments') || '[]');
      const registrations = JSON.parse(localStorage.getItem('school_registrations') || '[]');
      
      let allStudents = JSON.parse(localStorage.getItem('school_students') || '[]');
      if (allStudents.length === 0) {
        const allUsers = JSON.parse(localStorage.getItem('school_users') || '[]');
        allStudents = allUsers.filter(u => u.role === 'student');
      }
      
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const userId = currentUser?.id || user?.id || localStorage.getItem('userId');
      
      let parentChildren = [];
      if (userId) {
        parentChildren = allStudents.filter(s => s.parentId === userId);
      }
      if (parentChildren.length === 0) {
        const parentName = currentUser?.name || user?.name || '';
        if (parentName) {
          parentChildren = allStudents.filter(s => s.parentName === parentName);
        }
      }
      
      if (parentChildren.length === 0) {
        parentChildren = allStudents;
      }
      
      console.log('👨‍👩‍👦 Children for payments:', parentChildren.length);
      
      let paymentData = [];
      
      parentChildren.forEach(child => {
        const existingPayment = allPayments.find(p => 
          p.studentId === child.id && 
          p.month === selectedMonth && 
          p.year === selectedYear
        );
        
        const registration = registrations.find(r => r.studentId === child.id);
        const feeAmount = registration?.fee || 250;
        
        if (existingPayment) {
          paymentData.push({
            id: existingPayment.id || `PAY${Date.now()}`,
            studentId: child.id,
            studentName: child.name || child.firstName || 'Student',
            className: child.className || child.class || 'N/A',
            month: selectedMonth,
            year: selectedYear,
            amount: existingPayment.amount || feeAmount,
            type: existingPayment.type || 'full',
            status: existingPayment.status || 'pending',
            receipt: existingPayment.receipt || null,
            receiptData: existingPayment.receiptData || null,
            receiptName: existingPayment.receiptName || null,
            receiptType: existingPayment.receiptType || null,
            hasReceipt: !!existingPayment.receipt || !!existingPayment.receiptData,
            note: existingPayment.note || '',
            createdAt: existingPayment.createdAt || new Date().toISOString(),
            updatedAt: existingPayment.updatedAt || new Date().toISOString(),
          });
        } else {
          paymentData.push({
            id: `PAY${Date.now()}_${child.id}`,
            studentId: child.id,
            studentName: child.name || child.firstName || 'Student',
            className: child.className || child.class || 'N/A',
            month: selectedMonth,
            year: selectedYear,
            amount: feeAmount,
            type: 'full',
            status: 'pending',
            receipt: null,
            receiptData: null,
            receiptName: null,
            receiptType: null,
            hasReceipt: false,
            note: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      });
      
      if (selectedChild !== 'all') {
        paymentData = paymentData.filter(p => p.studentId === selectedChild);
      }
      
      console.log('💰 Payments generated:', paymentData.length);
      setPayments(paymentData);
      
      const existingPayments = JSON.parse(localStorage.getItem('school_payments') || '[]');
      paymentData.forEach(p => {
        if (p.id && !existingPayments.find(ep => ep.id === p.id)) {
          existingPayments.push({
            id: p.id,
            studentId: p.studentId,
            month: p.month,
            year: p.year,
            amount: p.amount,
            type: p.type,
            status: p.status,
            receipt: p.receipt,
            receiptData: p.receiptData,
            receiptName: p.receiptName,
            receiptType: p.receiptType,
            note: p.note,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
          });
        }
      });
      localStorage.setItem('school_payments', JSON.stringify(existingPayments));
      
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError(err.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, selectedChild, user]);

  useEffect(() => {
    loadChildren();
  }, [loadChildren]);

  useEffect(() => {
    if (children.length > 0 || selectedChild !== 'all') {
      fetchPayments();
    }
  }, [fetchPayments, children]);

  // ===== LISTEN FOR PAYMENT UPDATES =====
  useEffect(() => {
    const handlePaymentUpdated = () => {
      console.log('💰 Payment updated, refreshing');
      fetchPayments();
    };
    window.addEventListener('paymentUpdated', handlePaymentUpdated);
    window.addEventListener('storage', (e) => {
      if (e.key === 'school_payments') {
        fetchPayments();
      }
    });
    return () => {
      window.removeEventListener('paymentUpdated', handlePaymentUpdated);
      window.removeEventListener('storage', () => {});
    };
  }, [fetchPayments]);

  // ===== HANDLE REFRESH =====
  const handleRefresh = () => {
    setRefreshing(true);
    fetchPayments();
    setTimeout(() => {
      setRefreshing(false);
      if (notify) {
        notify(
          isArabic ? 'تم تحديث البيانات بنجاح' : 'Data refreshed successfully',
          'info'
        );
      }
    }, 600);
  };

  // ===== OPEN EDIT MODAL =====
  const openEditModal = (payment) => {
    setSelectedPayment(payment);
    setEditAmount(payment.amount?.toString() || '');
    setEditNote(payment.note || '');
    setShowEditModal(true);
  };

  // ===== HANDLE EDIT AMOUNT =====
  const handleEditAmount = () => {
    if (!selectedPayment) return;
    
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount <= 0) {
      if (notify) {
        notify(
          isArabic ? 'الرجاء إدخال مبلغ صحيح' : 'Please enter a valid amount',
          'warning'
        );
      }
      return;
    }

    setActionLoading(true);
    try {
      // Update payment in localStorage
      const allPayments = JSON.parse(localStorage.getItem('school_payments') || '[]');
      const index = allPayments.findIndex(p => p.id === selectedPayment.id);
      
      if (index !== -1) {
        allPayments[index].amount = amount;
        allPayments[index].note = editNote || '';
        allPayments[index].updatedAt = new Date().toISOString();
        localStorage.setItem('school_payments', JSON.stringify(allPayments));
      }
      
      // Update local state
      setPayments(prev => prev.map(p => {
        if (p.id === selectedPayment.id) {
          return { ...p, amount: amount, note: editNote || '' };
        }
        return p;
      }));
      
      // Dispatch event
      window.dispatchEvent(new CustomEvent('paymentUpdated', { 
        detail: { 
          paymentId: selectedPayment.id,
          studentId: selectedPayment.studentId,
          amount: amount
        }
      }));
      
      if (notify) {
        notify(
          isArabic ? '✅ تم تحديث المبلغ بنجاح' : '✅ Amount updated successfully',
          'success'
        );
      }
      
      setShowEditModal(false);
      setSelectedPayment(null);
      setEditAmount('');
      setEditNote('');
      
    } catch (err) {
      console.error('Error updating amount:', err);
      if (notify) {
        notify(
          isArabic ? 'حدث خطأ أثناء تحديث المبلغ' : 'Error updating amount',
          'error'
        );
      }
    } finally {
      setActionLoading(false);
    }
  };

  // ===== UPLOAD RECEIPT =====
  const openUploadModal = (payment) => {
    setSelectedPayment(payment);
    setReceiptFile(null);
    setReceiptPreview(null);
    setUploadProgress(0);
    setShowUploadModal(true);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        if (notify) {
          notify(
            isArabic ? 'حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت' : 'File size too large. Maximum 5MB.',
            'warning'
          );
        }
        e.target.value = '';
        return;
      }
      
      setReceiptFile(file);
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setReceiptPreview(event.target.result);
        };
        reader.readAsDataURL(file);
      } else {
        setReceiptPreview(null);
      }
    }
  };

  const handleUploadReceipt = async () => {
    if (!selectedPayment || !receiptFile) {
      if (notify) {
        notify(
          isArabic ? 'يرجى اختيار ملف للإيصال' : 'Please select a receipt file',
          'warning'
        );
      }
      return;
    }

    setActionLoading(true);
    setUploadProgress(10);
    
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          setUploadProgress(50);
          
          const base64Data = event.target.result;
          const base64String = base64Data.split(',')[1] || base64Data;
          
          setUploadProgress(70);
          
          const allPayments = JSON.parse(localStorage.getItem('school_payments') || '[]');
          const index = allPayments.findIndex(p => p.id === selectedPayment.id);
          
          if (index !== -1) {
            allPayments[index].status = 'submitted';
            allPayments[index].receiptData = base64String;
            allPayments[index].receiptName = receiptFile.name;
            allPayments[index].receiptType = receiptFile.type;
            allPayments[index].updatedAt = new Date().toISOString();
            allPayments[index].hasReceipt = true;
            
            localStorage.setItem('school_payments', JSON.stringify(allPayments));
          } else {
            const newPayment = {
              id: selectedPayment.id || `PAY${Date.now()}`,
              studentId: selectedPayment.studentId,
              month: selectedPayment.month,
              year: selectedPayment.year,
              amount: selectedPayment.amount,
              type: selectedPayment.type || 'full',
              status: 'submitted',
              receiptData: base64String,
              receiptName: receiptFile.name,
              receiptType: receiptFile.type,
              hasReceipt: true,
              note: selectedPayment.note || '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            allPayments.push(newPayment);
            localStorage.setItem('school_payments', JSON.stringify(allPayments));
          }
          
          setUploadProgress(90);
          
          const allStudents = JSON.parse(localStorage.getItem('school_students') || '[]');
          const studentIndex = allStudents.findIndex(s => s.id === selectedPayment.studentId);
          if (studentIndex !== -1) {
            allStudents[studentIndex].paymentStatus = 'submitted';
            allStudents[studentIndex].paymentUpdatedAt = new Date().toISOString();
            localStorage.setItem('school_students', JSON.stringify(allStudents));
          }
          
          // Create notification for admin
          const notifications = JSON.parse(localStorage.getItem('school_notifications') || '[]');
          const notification = {
            id: `NOT${String(Date.now()).slice(-6)}`,
            title: isArabic ? '📤 تم رفع إيصال دفع' : '📤 Payment Receipt Uploaded',
            message: isArabic 
              ? `${selectedPayment.studentName} قام برفع إيصال دفع بمبلغ ${selectedPayment.amount} MAD`
              : `${selectedPayment.studentName} uploaded a payment receipt of ${selectedPayment.amount} MAD`,
            type: 'payment',
            priority: 'high',
            read: false,
            recipientRole: 'admin',
            studentId: selectedPayment.studentId,
            studentName: selectedPayment.studentName,
            paymentId: selectedPayment.id,
            amount: selectedPayment.amount,
            createdAt: new Date().toISOString(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            link: '/dashboard/admin/payments',
          };
          notifications.push(notification);
          localStorage.setItem('school_notifications', JSON.stringify(notifications));
          
          setUploadProgress(100);
          
          window.dispatchEvent(new CustomEvent('paymentUpdated', { 
            detail: { 
              paymentId: selectedPayment.id,
              studentId: selectedPayment.studentId,
              status: 'submitted'
            }
          }));
          
          window.dispatchEvent(new CustomEvent('notificationAdded', { 
            detail: notification 
          }));
          
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'school_payments',
            newValue: JSON.stringify(allPayments)
          }));
          
          if (notify) {
            notify(
              isArabic ? '✅ تم رفع الإيصال بنجاح، في انتظار مراجعة المشرف' : '✅ Receipt uploaded successfully, awaiting admin review',
              'success'
            );
          }
          
          setTimeout(() => {
            setShowUploadModal(false);
            setSelectedPayment(null);
            setReceiptFile(null);
            setReceiptPreview(null);
            setUploadProgress(0);
            fetchPayments();
            setActionLoading(false);
          }, 500);
          
        } catch (err) {
          console.error('Error processing file:', err);
          if (notify) {
            notify(
              isArabic ? 'حدث خطأ أثناء معالجة الملف' : 'Error processing file',
              'error'
            );
          }
          setActionLoading(false);
          setUploadProgress(0);
        }
      };
      
      reader.onerror = () => {
        if (notify) {
          notify(
            isArabic ? 'حدث خطأ أثناء قراءة الملف' : 'Error reading file',
            'error'
          );
        }
        setActionLoading(false);
        setUploadProgress(0);
      };
      
      reader.readAsDataURL(receiptFile);
      
    } catch (err) {
      console.error('Error uploading receipt:', err);
      if (notify) {
        notify(
          err.response?.data?.message || (isArabic ? 'فشل رفع الإيصال' : 'Failed to upload receipt'),
          'error'
        );
      }
      setActionLoading(false);
      setUploadProgress(0);
    }
  };

  // ===== DOWNLOAD RECEIPT =====
  const downloadReceipt = async (payment) => {
    try {
      if (payment.receiptData) {
        const byteCharacters = atob(payment.receiptData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: payment.receiptType || 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = payment.receiptName || `payment-receipt-${payment.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        if (notify) {
          notify(
            isArabic ? '✅ تم تنزيل الإيصال بنجاح' : '✅ Receipt downloaded successfully',
            'success'
          );
        }
        return;
      }
      
      if (payment.receipt) {
        const a = document.createElement('a');
        a.href = payment.receipt;
        a.download = payment.receiptName || `payment-receipt-${payment.id}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }
      
      if (notify) {
        notify(
          isArabic ? 'لا يوجد إيصال لهذه الدفعة' : 'No receipt for this payment',
          'info'
        );
      }
    } catch (err) {
      console.error('Error downloading receipt:', err);
      if (notify) {
        notify(
          err.response?.data?.message || (isArabic ? 'فشل تنزيل الإيصال' : 'Failed to download receipt'),
          'error'
        );
      }
    }
  };

  // ===== VIEW RECEIPT =====
  const viewReceipt = (payment) => {
    if (payment.receiptData) {
      const byteCharacters = atob(payment.receiptData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: payment.receiptType || 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      window.open(url, '_blank');
      
      if (notify) {
        notify(
          isArabic ? '📄 تم فتح الإيصال في علامة تبويب جديدة' : '📄 Receipt opened in new tab',
          'info'
        );
      }
    }
  };

  // ===== STATUS BADGE =====
  const getStatusBadge = (status) => {
    const map = {
      pending: { bg: 'warning', text: 'dark', icon: <FaClock className="me-1" />, label: isArabic ? 'قيد الانتظار' : 'Pending' },
      submitted: { bg: 'info', text: 'dark', icon: <FaUpload className="me-1" />, label: isArabic ? 'قيد المراجعة' : 'Under Review' },
      approved: { bg: 'success', icon: <FaCheckCircle className="me-1" />, label: isArabic ? 'معتمد' : 'Approved' },
      rejected: { bg: 'danger', icon: <FaTimes className="me-1" />, label: isArabic ? 'مرفوض' : 'Rejected' },
      paid: { bg: 'success', icon: <FaCheckCircle className="me-1" />, label: isArabic ? 'مدفوع' : 'Paid' },
    };
    const v = map[status] || map.pending;
    return (
      <Badge bg={v.bg} text={v.text || 'white'} className="px-3 py-2 rounded-pill" style={arabicFontStyle}>
        {v.icon} {v.label}
      </Badge>
    );
  };

  const getTypeBadge = (type) => {
    if (type === 'half') {
      return <Badge bg="warning" text="dark" className="px-3 py-1 rounded-pill" style={arabicFontStyle}>{isArabic ? 'نصف' : 'Half'}</Badge>;
    }
    return <Badge bg="primary" className="px-3 py-1 rounded-pill" style={arabicFontStyle}>{isArabic ? 'كامل' : 'Full'}</Badge>;
  };

  // ===== STATS =====
  const stats = {
    total: payments.length,
    approved: payments.filter((p) => p.status === 'approved' || p.status === 'paid').length,
    submitted: payments.filter((p) => p.status === 'submitted').length,
    pending: payments.filter((p) => p.status === 'pending').length,
    totalDue: payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
    totalPaid: payments
      .filter((p) => p.status === 'approved' || p.status === 'paid')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
  };

  const statCards = [
    { 
      label: isArabic ? 'إجمالي الدفعات' : 'Total Payments', 
      value: stats.total, 
      icon: <FaCoins />, 
      color: '#1a5f7a',
      gradient: 'linear-gradient(135deg, #1a5f7a, #2a7f9a)'
    },
    { 
      label: isArabic ? 'مدفوع' : 'Paid', 
      value: stats.approved, 
      icon: <FaCheckCircle />, 
      color: '#2ecc71',
      gradient: 'linear-gradient(135deg, #11998e, #38ef7d)'
    },
    { 
      label: isArabic ? 'قيد المراجعة' : 'Under Review', 
      value: stats.submitted, 
      icon: <FaUpload />, 
      color: '#f39c12',
      gradient: 'linear-gradient(135deg, #f2994a, #f2c94c)'
    },
    { 
      label: isArabic ? 'معلق' : 'Pending', 
      value: stats.pending, 
      icon: <FaClock />, 
      color: '#e74c3c',
      gradient: 'linear-gradient(135deg, #eb3349, #f45c43)'
    },
  ];

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <div className="text-center py-5" dir={isArabic ? 'rtl' : 'ltr'}>
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted" style={arabicFontStyle}>
          {isArabic ? 'جاري تحميل الدفعات...' : 'Loading payments...'}
        </p>
      </div>
    );
  }

  return (
    <div className="parent-payments" dir={isArabic ? 'rtl' : 'ltr'}>
      <Container fluid className="py-3 py-md-4">
        {/* ===== HEADER ===== */}
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
          <div>
            <h3 className="fw-bold mb-1" style={{ ...arabicFontStyle, color: '#1a5f7a', fontSize: 'clamp(1.3rem, 2vw, 1.8rem)' }}>
              <FaMoneyBillWave className="me-2" style={{ color: '#2ecc71' }} />
              {isArabic ? 'مدفوعات الرسوم الشهرية' : 'Monthly Tuition Payments'}
            </h3>
            <p className="text-muted mb-0" style={{ ...arabicFontStyle, fontSize: 'clamp(0.85rem, 0.95vw, 1rem)' }}>
              {isArabic
                ? 'اطلع على دفعات أطفالك الشهرية وارفع إيصال الدفع للمراجعة'
                : 'View your children monthly payments and upload payment receipts for review'}
            </p>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <Button 
              variant="outline-primary" 
              size="sm" 
              onClick={handleRefresh}
              disabled={refreshing}
              style={{ borderRadius: '50px', ...arabicFontStyle, fontSize: 'clamp(0.75rem, 0.85vw, 0.9rem)' }}
            >
              <FaSync className={refreshing ? 'spinning' : 'me-1'} /> 
              {isArabic ? 'تحديث' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* ===== FILTERS ===== */}
        <Card className="shadow-sm border-0 mb-4" style={{
          background: darkMode ? '#1a1a2e' : '#ffffff',
          border: `1px solid ${darkMode ? '#2d2d44' : '#e9ecef'}`,
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
          <div className="card-top-bar" style={{ height: '3px', background: 'linear-gradient(90deg, #1a5f7a, #4a9eff)' }}></div>
          <Card.Body className="p-3">
            <Row className="g-2 align-items-end">
              <Col xs={6} sm={4} md={3}>
                <Form.Group>
                  <Form.Label style={{ ...arabicFontStyle, fontSize: '0.75rem', color: darkMode ? '#adb5bd' : '#6c757d' }}>
                    <FaCalendarAlt className="me-1" /> {isArabic ? 'الشهر' : 'Month'}
                  </Form.Label>
                  <Form.Select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? '#2d2d44' : 'white',
                      color: darkMode ? '#e9ecef' : '#212529',
                      borderColor: darkMode ? '#3d3d5c' : '#e9ecef',
                      borderRadius: '10px',
                      fontSize: 'clamp(0.8rem, 0.9vw, 0.9rem)'
                    }}
                  >
                    {monthNames.map((name, i) => (
                      <option key={i + 1} value={i + 1}>
                        {isArabic ? monthNamesAr[i] : name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={6} sm={4} md={3}>
                <Form.Group>
                  <Form.Label style={{ ...arabicFontStyle, fontSize: '0.75rem', color: darkMode ? '#adb5bd' : '#6c757d' }}>
                    {isArabic ? 'السنة' : 'Year'}
                  </Form.Label>
                  <Form.Control
                    type="number"
                    min="2020"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value) || now.getFullYear())}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? '#2d2d44' : 'white',
                      color: darkMode ? '#e9ecef' : '#212529',
                      borderColor: darkMode ? '#3d3d5c' : '#e9ecef',
                      borderRadius: '10px',
                      fontSize: 'clamp(0.8rem, 0.9vw, 0.9rem)'
                    }}
                  />
                </Form.Group>
              </Col>
              <Col xs={12} sm={4} md={3}>
                <Form.Group>
                  <Form.Label style={{ ...arabicFontStyle, fontSize: '0.75rem', color: darkMode ? '#adb5bd' : '#6c757d' }}>
                    <FaUserGraduate className="me-1" /> {isArabic ? 'الطالب' : 'Student'}
                  </Form.Label>
                  <Form.Select
                    value={selectedChild}
                    onChange={(e) => setSelectedChild(e.target.value)}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? '#2d2d44' : 'white',
                      color: darkMode ? '#e9ecef' : '#212529',
                      borderColor: darkMode ? '#3d3d5c' : '#e9ecef',
                      borderRadius: '10px',
                      fontSize: 'clamp(0.8rem, 0.9vw, 0.9rem)'
                    }}
                  >
                    <option value="all">{isArabic ? 'جميع الطلاب' : 'All Students'}</option>
                    {children.map((child) => (
                      <option key={child.id} value={child.id}>
                        {child.name || child.firstName || 'Student'}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* ===== STATS CARDS ===== */}
        <Row className="g-3 mb-4">
          {statCards.map((stat, index) => (
            <Col key={index} xs={6} sm={6} md={3}>
              <div 
                className="stat-card-modern"
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  background: darkMode ? '#1a1a2e' : '#ffffff',
                  border: `1px solid ${darkMode ? '#2d2d44' : '#e9ecef'}`,
                  borderRadius: '12px',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  height: 'clamp(80px, 10vw, 95px)',
                  transform: hoveredCard === index ? 'translateY(-3px)' : 'translateY(0)',
                  boxShadow: hoveredCard === index ? '0 8px 30px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                <div className="stat-top-bar" style={{
                  height: '3px',
                  background: stat.gradient,
                  transition: 'height 0.3s ease'
                }}></div>
                <div className="stat-body d-flex align-items-center justify-content-between p-3" style={{ height: 'calc(100% - 3px)' }}>
                  <div>
                    <div className="stat-label" style={{ 
                      ...arabicFontStyle, 
                      fontSize: 'clamp(0.5rem, 0.6vw, 0.65rem)', 
                      color: darkMode ? '#adb5bd' : '#6c757d',
                      textTransform: 'uppercase',
                      fontWeight: '600',
                      letterSpacing: '0.3px'
                    }}>
                      {stat.label}
                    </div>
                    <div className="stat-value" style={{ 
                      fontSize: 'clamp(1.2rem, 1.6vw, 1.6rem)', 
                      fontWeight: '700', 
                      color: darkMode ? '#e9ecef' : '#212529',
                      lineHeight: '1.2'
                    }}>
                      {stat.value}
                    </div>
                  </div>
                  <div className="stat-icon" style={{
                    width: 'clamp(32px, 4vw, 40px)',
                    height: 'clamp(32px, 4vw, 40px)',
                    borderRadius: '10px',
                    background: darkMode ? 'rgba(26, 95, 122, 0.15)' : 'rgba(26, 95, 122, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: stat.color,
                    fontSize: 'clamp(0.8rem, 1vw, 1.1rem)',
                    transition: 'all 0.3s ease'
                  }}>
                    {stat.icon}
                  </div>
                </div>
              </div>
            </Col>
          ))}
        </Row>

        {/* ===== PAYMENTS TABLE ===== */}
        <Card className="shadow-sm border-0" style={{
          background: darkMode ? '#1a1a2e' : '#ffffff',
          border: `1px solid ${darkMode ? '#2d2d44' : '#e9ecef'}`,
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
          <div className="card-top-bar" style={{ height: '3px', background: 'linear-gradient(90deg, #1a5f7a, #2a7f9a)' }}></div>
          <Card.Header className="bg-transparent border-0 p-3 p-md-4" style={{ borderBottom: `1px solid ${darkMode ? '#2d2d44' : '#e9ecef'}` }}>
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <h6 className="fw-bold mb-0" style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.9rem, 1.05vw, 1.1rem)' }}>
                <FaMoneyBillWave className="me-2" style={{ color: '#2ecc71' }} />
                {isArabic ? 'سجل الدفعات' : 'Payment History'}
                <Badge bg="light" className="ms-2 text-dark" style={arabicFontStyle}>
                  {formatNumber(payments.length)}
                </Badge>
              </h6>
              <div className="d-flex gap-2 align-items-center">
                <span className="text-muted small" style={{ ...arabicFontStyle, fontSize: 'clamp(0.7rem, 0.8vw, 0.85rem)' }}>
                  {isArabic ? 'المبلغ الإجمالي: ' : 'Total Amount: '}
                  <strong style={{ color: '#1a5f7a', fontSize: 'clamp(0.85rem, 0.95vw, 1rem)' }}>{formatNumber(stats.totalDue)} MAD</strong>
                </span>
              </div>
            </div>
          </Card.Header>
          <Card.Body className="p-0">
            {error ? (
              <Alert variant="danger" className="m-3" style={arabicFontStyle}>
                {error}
              </Alert>
            ) : payments.length === 0 ? (
              <div className="text-center py-5">
                <FaMoneyBillWave size={48} className="text-muted opacity-25 mb-3" />
                <p className="text-muted" style={{ ...arabicFontStyle, fontSize: 'clamp(0.9rem, 1vw, 1.05rem)' }}>
                  {isArabic
                    ? `لا توجد دفعات مسجلة لشهر ${getMonthName(selectedMonth)} ${selectedYear}`
                    : `No payments recorded for ${getMonthName(selectedMonth)} ${selectedYear}`}
                </p>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={handleRefresh}
                  style={{ borderRadius: '50px', ...arabicFontStyle }}
                >
                  <FaSync className="me-2" /> {isArabic ? 'تحديث' : 'Refresh'}
                </Button>
              </div>
            ) : (
              <div className="table-responsive">
                <Table hover className="mb-0" style={arabicFontStyle}>
                  <thead>
                    <tr>
                      <th style={{ ...arabicFontStyle, fontSize: 'clamp(0.65rem, 0.75vw, 0.75rem)', textTransform: 'uppercase', letterSpacing: '0.3px', color: darkMode ? '#adb5bd' : '#6c757d', borderBottom: `2px solid ${darkMode ? '#2d2d44' : '#e9ecef'}`, padding: '10px 16px' }}>
                        {isArabic ? 'الطالب' : 'Student'}
                      </th>
                      <th style={{ ...arabicFontStyle, fontSize: 'clamp(0.65rem, 0.75vw, 0.75rem)', textTransform: 'uppercase', letterSpacing: '0.3px', color: darkMode ? '#adb5bd' : '#6c757d', borderBottom: `2px solid ${darkMode ? '#2d2d44' : '#e9ecef'}`, padding: '10px 16px' }}>
                        {isArabic ? 'الشهر' : 'Month'}
                      </th>
                      <th style={{ ...arabicFontStyle, fontSize: 'clamp(0.65rem, 0.75vw, 0.75rem)', textTransform: 'uppercase', letterSpacing: '0.3px', color: darkMode ? '#adb5bd' : '#6c757d', borderBottom: `2px solid ${darkMode ? '#2d2d44' : '#e9ecef'}`, padding: '10px 16px' }}>
                        {isArabic ? 'النوع' : 'Type'}
                      </th>
                      <th style={{ ...arabicFontStyle, fontSize: 'clamp(0.65rem, 0.75vw, 0.75rem)', textTransform: 'uppercase', letterSpacing: '0.3px', color: darkMode ? '#adb5bd' : '#6c757d', borderBottom: `2px solid ${darkMode ? '#2d2d44' : '#e9ecef'}`, padding: '10px 16px' }}>
                        {isArabic ? 'المبلغ' : 'Amount'}
                      </th>
                      <th style={{ ...arabicFontStyle, fontSize: 'clamp(0.65rem, 0.75vw, 0.75rem)', textTransform: 'uppercase', letterSpacing: '0.3px', color: darkMode ? '#adb5bd' : '#6c757d', borderBottom: `2px solid ${darkMode ? '#2d2d44' : '#e9ecef'}`, padding: '10px 16px' }}>
                        {isArabic ? 'الحالة' : 'Status'}
                      </th>
                      <th className="text-center" style={{ ...arabicFontStyle, fontSize: 'clamp(0.65rem, 0.75vw, 0.75rem)', textTransform: 'uppercase', letterSpacing: '0.3px', color: darkMode ? '#adb5bd' : '#6c757d', borderBottom: `2px solid ${darkMode ? '#2d2d44' : '#e9ecef'}`, padding: '10px 16px' }}>
                        {isArabic ? 'الإيصال' : 'Receipt'}
                      </th>
                      <th className="text-center" style={{ ...arabicFontStyle, fontSize: 'clamp(0.65rem, 0.75vw, 0.75rem)', textTransform: 'uppercase', letterSpacing: '0.3px', color: darkMode ? '#adb5bd' : '#6c757d', borderBottom: `2px solid ${darkMode ? '#2d2d44' : '#e9ecef'}`, padding: '10px 16px' }}>
                        {isArabic ? 'إجراء' : 'Action'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id ?? `${p.studentName}-${p.month}-${p.year}`}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="d-flex align-items-center justify-content-center rounded-circle"
                              style={{ 
                                width: 'clamp(30px, 3.5vw, 36px)', 
                                height: 'clamp(30px, 3.5vw, 36px)', 
                                background: 'linear-gradient(135deg, #1a5f7a, #2a7f9a)',
                                color: 'white',
                                fontSize: 'clamp(0.7rem, 0.8vw, 0.85rem)',
                                fontWeight: '700',
                                flexShrink: 0
                              }}
                            >
                              {(p.studentName || 'S').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="fw-semibold" style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.85rem, 0.95vw, 0.95rem)' }}>
                                {p.studentName}
                              </div>
                              <small className="text-muted" style={{ ...arabicFontStyle, fontSize: 'clamp(0.6rem, 0.65vw, 0.7rem)' }}>
                                {p.className}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                          <div style={{ fontSize: 'clamp(0.85rem, 0.95vw, 0.95rem)' }}>{getMonthName(p.month)}</div>
                          <small className="text-muted" style={{ fontSize: 'clamp(0.6rem, 0.65vw, 0.7rem)' }}>{p.year}</small>
                        </td>
                        <td>{getTypeBadge(p.type || 'full')}</td>
                        <td>
                          <strong style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.9rem, 1vw, 1.05rem)' }}>
                            {p.amount != null ? `${formatNumber(p.amount)} MAD` : '-'}
                          </strong>
                        </td>
                        <td>{getStatusBadge(p.status)}</td>
                        <td className="text-center">
                          {(p.receiptData || p.receipt || p.hasReceipt) ? (
                            <div className="d-flex justify-content-center gap-1">
                              <Button 
                                variant="outline-primary" 
                                size="sm" 
                                onClick={() => viewReceipt(p)}
                                title={isArabic ? 'عرض الإيصال' : 'View Receipt'}
                                style={{ 
                                  borderRadius: '8px',
                                  padding: '2px 8px',
                                  fontSize: 'clamp(0.6rem, 0.7vw, 0.7rem)'
                                }}
                              >
                                <FaEye size={12} />
                              </Button>
                              <Button 
                                variant="outline-secondary" 
                                size="sm" 
                                onClick={() => downloadReceipt(p)}
                                title={isArabic ? 'تنزيل الإيصال' : 'Download Receipt'}
                                style={{ 
                                  borderRadius: '8px',
                                  padding: '2px 8px',
                                  fontSize: 'clamp(0.6rem, 0.7vw, 0.7rem)'
                                }}
                              >
                                <FaDownload size={12} />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-muted" style={{ fontSize: 'clamp(0.6rem, 0.7vw, 0.75rem)' }}>-</span>
                          )}
                        </td>
                        <td className="text-center">
                          <div className="d-flex justify-content-center gap-1 flex-wrap">
                            {/* Edit Button - Always visible */}
                            <Button
                              variant="outline-warning"
                              size="sm"
                              onClick={() => openEditModal(p)}
                              title={isArabic ? 'تعديل المبلغ' : 'Edit Amount'}
                              style={{ 
                                borderRadius: '8px',
                                padding: '2px 8px',
                                fontSize: 'clamp(0.6rem, 0.7vw, 0.7rem)',
                                borderColor: '#f39c12',
                                color: '#f39c12'
                              }}
                            >
                              <FaEdit size={12} />
                            </Button>
                            
                            {/* Upload Button - Only for pending/submitted */}
                            {p.status !== 'approved' && p.status !== 'paid' && (
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => openUploadModal(p)}
                                style={{ 
                                  borderRadius: '8px',
                                  padding: '2px 8px',
                                  fontSize: 'clamp(0.6rem, 0.7vw, 0.7rem)',
                                  backgroundColor: '#2ecc71',
                                  borderColor: '#2ecc71',
                                  color: 'white'
                                }}
                              >
                                <FaUpload size={12} />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
          <Card.Footer className="bg-transparent border-0 p-3" style={{ borderTop: `1px solid ${darkMode ? '#2d2d44' : '#e9ecef'}` }}>
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <span className="text-muted small" style={arabicFontStyle}>
                {isArabic ? 'إجمالي الدفعات: ' : 'Total Payments: '}
                <strong>{formatNumber(payments.length)}</strong>
              </span>
              <span className="text-muted small" style={arabicFontStyle}>
                {isArabic ? 'المبلغ الإجمالي: ' : 'Total Amount: '}
                <strong style={{ color: '#1a5f7a' }}>{formatNumber(stats.totalDue)} MAD</strong>
              </span>
              <Button 
                variant="outline-primary" 
                size="sm" 
                onClick={handleRefresh}
                disabled={refreshing}
                style={{ borderRadius: '50px', ...arabicFontStyle }}
              >
                <FaSync className={refreshing ? 'spinning' : 'me-1'} /> 
                {isArabic ? 'تحديث' : 'Refresh'}
              </Button>
            </div>
          </Card.Footer>
        </Card>

        {/* ===== EDIT AMOUNT MODAL ===== */}
        <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered size="md" className="modern-modal">
          <Modal.Header closeButton className="border-0" style={{ 
            background: darkMode ? '#1a1a2e' : 'white', 
            padding: '16px 24px 0',
            borderBottom: 'none'
          }}>
            <Modal.Title style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(1.1rem, 1.3vw, 1.3rem)' }}>
              <FaEdit className="me-2" style={{ color: '#f39c12' }} />
              {isArabic ? 'تعديل المبلغ' : 'Edit Amount'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ 
            background: darkMode ? '#0d1117' : 'white', 
            padding: '20px 24px'
          }}>
            {selectedPayment && (
              <>
                <div className="payment-info p-3 rounded-3 mb-3" style={{
                  background: darkMode ? '#2d2d44' : '#f8f9fa',
                  border: `1px solid ${darkMode ? '#3d3d5c' : '#e9ecef'}`,
                  borderRadius: '10px'
                }}>
                  <Row>
                    <Col md={6}>
                      <div className="info-item" style={{ marginBottom: '4px' }}>
                        <span className="text-muted" style={{ ...arabicFontStyle, fontSize: '0.8rem' }}>
                          {isArabic ? 'الطالب' : 'Student'}:
                        </span>
                        <span className="fw-semibold ms-2" style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                          {selectedPayment.studentName}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="text-muted" style={{ ...arabicFontStyle, fontSize: '0.8rem' }}>
                          {isArabic ? 'الفصل' : 'Class'}:
                        </span>
                        <span className="ms-2" style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                          {selectedPayment.className}
                        </span>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="info-item" style={{ marginBottom: '4px' }}>
                        <span className="text-muted" style={{ ...arabicFontStyle, fontSize: '0.8rem' }}>
                          {isArabic ? 'الشهر' : 'Month'}:
                        </span>
                        <span className="ms-2" style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                          {getMonthName(selectedPayment.month)} {selectedPayment.year}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="text-muted" style={{ ...arabicFontStyle, fontSize: '0.8rem' }}>
                          {isArabic ? 'المبلغ الحالي' : 'Current Amount'}:
                        </span>
                        <span className="fw-bold ms-2" style={{ color: '#1a5f7a', fontSize: '1rem' }}>
                          {selectedPayment.amount != null ? `${formatNumber(selectedPayment.amount)} MAD` : '-'}
                        </span>
                      </div>
                    </Col>
                  </Row>
                </div>

                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontWeight: '600' }}>
                    {isArabic ? 'المبلغ الجديد (MAD)' : 'New Amount (MAD)'}
                  </Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    step="10"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    placeholder={isArabic ? 'أدخل المبلغ...' : 'Enter amount...'}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? '#2d2d44' : 'white',
                      color: darkMode ? '#e9ecef' : '#212529',
                      borderColor: darkMode ? '#3d3d5c' : '#e9ecef',
                      borderRadius: '10px',
                      padding: '10px',
                      fontSize: 'clamp(0.9rem, 1vw, 1rem)'
                    }}
                  />
                </Form.Group>

                <Form.Group>
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontWeight: '600' }}>
                    {isArabic ? 'ملاحظات (اختياري)' : 'Notes (Optional)'}
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    placeholder={isArabic ? 'أضف ملاحظات...' : 'Add notes...'}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? '#2d2d44' : 'white',
                      color: darkMode ? '#e9ecef' : '#212529',
                      borderColor: darkMode ? '#3d3d5c' : '#e9ecef',
                      borderRadius: '10px',
                      padding: '10px',
                      fontSize: 'clamp(0.85rem, 0.9vw, 0.95rem)'
                    }}
                  />
                </Form.Group>
              </>
            )}
          </Modal.Body>
          <Modal.Footer className="border-0" style={{ 
            background: darkMode ? '#1a1a2e' : 'white', 
            padding: '8px 24px 16px',
            borderTop: 'none'
          }}>
            <Button 
              variant="secondary" 
              onClick={() => setShowEditModal(false)}
              disabled={actionLoading}
              style={{ ...arabicFontStyle, borderRadius: '50px', fontSize: 'clamp(0.85rem, 0.9vw, 0.95rem)', padding: '8px 20px' }}
            >
              <FaTimes className="me-2" /> {isArabic ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button 
              variant="warning" 
              onClick={handleEditAmount} 
              disabled={actionLoading || !editAmount}
              style={{ 
                ...arabicFontStyle, 
                borderRadius: '50px', 
                fontSize: 'clamp(0.85rem, 0.9vw, 0.95rem)', 
                padding: '8px 20px',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(243, 156, 18, 0.3)',
                backgroundColor: '#f39c12',
                borderColor: '#f39c12',
                color: 'white',
                fontWeight: '600'
              }}
              className="edit-submit-btn"
            >
              {actionLoading ? (
                <>
                  <FaSpinner className="spinning me-2" />
                  {isArabic ? 'جاري الحفظ...' : 'Saving...'}
                </>
              ) : (
                <><FaSave className="me-2" /> {isArabic ? 'حفظ المبلغ' : 'Save Amount'}</>
              )}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* ===== UPLOAD RECEIPT MODAL ===== */}
        <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)} centered size="lg" className="modern-modal">
          <Modal.Header closeButton className="border-0" style={{ 
            background: darkMode ? '#1a1a2e' : 'white', 
            padding: '16px 24px 0',
            borderBottom: 'none'
          }}>
            <Modal.Title style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(1.1rem, 1.3vw, 1.3rem)' }}>
              <FaUpload className="me-2" style={{ color: '#2ecc71' }} />
              {isArabic ? 'رفع إيصال الدفع' : 'Upload Payment Receipt'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ 
            background: darkMode ? '#0d1117' : 'white', 
            padding: '20px 24px'
          }}>
            {selectedPayment && (
              <>
                <div className="payment-info p-3 rounded-3 mb-3" style={{
                  background: darkMode ? '#2d2d44' : '#f8f9fa',
                  border: `1px solid ${darkMode ? '#3d3d5c' : '#e9ecef'}`,
                  borderRadius: '10px'
                }}>
                  <Row>
                    <Col md={6}>
                      <div className="info-item" style={{ marginBottom: '4px' }}>
                        <span className="text-muted" style={{ ...arabicFontStyle, fontSize: '0.8rem' }}>
                          {isArabic ? 'الطالب' : 'Student'}:
                        </span>
                        <span className="fw-semibold ms-2" style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                          {selectedPayment.studentName}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="text-muted" style={{ ...arabicFontStyle, fontSize: '0.8rem' }}>
                          {isArabic ? 'الفصل' : 'Class'}:
                        </span>
                        <span className="ms-2" style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                          {selectedPayment.className}
                        </span>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="info-item" style={{ marginBottom: '4px' }}>
                        <span className="text-muted" style={{ ...arabicFontStyle, fontSize: '0.8rem' }}>
                          {isArabic ? 'الشهر' : 'Month'}:
                        </span>
                        <span className="ms-2" style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                          {getMonthName(selectedPayment.month)} {selectedPayment.year}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="text-muted" style={{ ...arabicFontStyle, fontSize: '0.8rem' }}>
                          {isArabic ? 'المبلغ' : 'Amount'}:
                        </span>
                        <span className="fw-bold ms-2" style={{ color: '#1a5f7a', fontSize: '1rem' }}>
                          {selectedPayment.amount != null ? `${formatNumber(selectedPayment.amount)} MAD` : '-'}
                        </span>
                      </div>
                    </Col>
                  </Row>
                </div>

                <Form.Group>
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontWeight: '600', fontSize: 'clamp(0.9rem, 1vw, 1rem)' }}>
                    {isArabic ? 'اختر ملف الإيصال / إثبات الدفع' : 'Choose receipt / payment evidence file'}
                  </Form.Label>
                  <Form.Control
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,application/pdf,image/*"
                    onChange={handleFileSelect}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? '#2d2d44' : 'white',
                      color: darkMode ? '#e9ecef' : '#212529',
                      borderColor: darkMode ? '#3d3d5c' : '#e9ecef',
                      borderRadius: '10px',
                      padding: '10px',
                      fontSize: 'clamp(0.85rem, 0.9vw, 0.95rem)'
                    }}
                  />
                  <Form.Text className="text-muted d-block mt-1" style={{ ...arabicFontStyle, fontSize: 'clamp(0.7rem, 0.75vw, 0.8rem)' }}>
                    {isArabic
                      ? 'الملفات المدعومة: PDF, JPG, PNG, GIF, BMP (الحد الأقصى 5 ميجابايت)'
                      : 'Supported files: PDF, JPG, PNG, GIF, BMP (Max 5MB)'}
                  </Form.Text>
                </Form.Group>

                {receiptFile && (
                  <div className="mt-3 p-3 rounded-3" style={{
                    background: darkMode ? '#2d2d44' : '#f8f9fa',
                    border: `1px solid ${darkMode ? '#3d3d5c' : '#e9ecef'}`,
                    borderRadius: '10px'
                  }}>
                    <div className="d-flex align-items-center gap-3">
                      <div style={{ fontSize: '2rem' }}>
                        {receiptFile.type.includes('pdf') ? <FaFilePdf className="text-danger" /> :
                         receiptFile.type.includes('image') ? <FaFileImage className="text-success" /> :
                         <FaFile className="text-secondary" />}
                      </div>
                      <div className="flex-grow-1">
                        <div className="fw-semibold" style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: 'clamp(0.85rem, 0.9vw, 0.95rem)' }}>
                          {receiptFile.name}
                        </div>
                        <div className="text-muted small" style={{ ...arabicFontStyle, fontSize: 'clamp(0.65rem, 0.7vw, 0.75rem)' }}>
                          {(receiptFile.size / 1024).toFixed(1)} KB • {receiptFile.type || 'Unknown'}
                        </div>
                      </div>
                      {receiptPreview && (
                        <div style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: `1px solid ${darkMode ? '#3d3d5c' : '#e9ecef'}` }}>
                          <img src={receiptPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {actionLoading && uploadProgress > 0 && (
                  <div className="mt-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted" style={{ ...arabicFontStyle, fontSize: 'clamp(0.7rem, 0.75vw, 0.8rem)' }}>
                        {isArabic ? 'جاري الرفع...' : 'Uploading...'}
                      </span>
                      <span className="fw-semibold" style={{ color: '#1a5f7a', fontSize: 'clamp(0.7rem, 0.75vw, 0.8rem)' }}>
                        {uploadProgress}%
                      </span>
                    </div>
                    <ProgressBar 
                      now={uploadProgress} 
                      animated 
                      variant={uploadProgress < 100 ? 'primary' : 'success'}
                      style={{ height: '6px', borderRadius: '3px' }}
                    />
                  </div>
                )}
              </>
            )}
          </Modal.Body>
          <Modal.Footer className="border-0" style={{ 
            background: darkMode ? '#1a1a2e' : 'white', 
            padding: '8px 24px 16px',
            borderTop: 'none'
          }}>
            <Button 
              variant="secondary" 
              onClick={() => setShowUploadModal(false)}
              disabled={actionLoading}
              style={{ ...arabicFontStyle, borderRadius: '50px', fontSize: 'clamp(0.85rem, 0.9vw, 0.95rem)', padding: '8px 20px' }}
            >
              <FaTimes className="me-2" /> {isArabic ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button 
              variant="success" 
              onClick={handleUploadReceipt} 
              disabled={actionLoading || !receiptFile}
              style={{ 
                ...arabicFontStyle, 
                borderRadius: '50px', 
                fontSize: 'clamp(0.85rem, 0.9vw, 0.95rem)', 
                padding: '8px 20px',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(46, 204, 113, 0.4)',
                backgroundColor: '#2ecc71',
                borderColor: '#2ecc71',
                color: 'white',
                fontWeight: '600'
              }}
              className="upload-submit-btn"
            >
              {actionLoading ? (
                <>
                  <FaSpinner className="spinning me-2" />
                  {isArabic ? 'جاري الرفع...' : 'Uploading...'}
                </>
              ) : (
                <><FaUpload className="me-2" /> {isArabic ? 'رفع الإيصال' : 'Upload Receipt'}</>
              )}
            </Button>
          </Modal.Footer>
        </Modal>

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          .spinning {
            animation: spin 1s linear infinite;
          }

          .parent-payments { padding: 0; }

          .card-top-bar {
            transition: height 0.3s ease;
          }

          .stat-card-modern {
            transition: all 0.3s ease;
          }
          .stat-card-modern:hover .stat-top-bar {
            height: 4px;
          }
          .stat-card-modern:hover .stat-icon {
            transform: scale(1.1) rotate(-5deg);
            background: rgba(26, 95, 122, 0.15) !important;
          }

          .table th {
            font-weight: 600;
            font-size: clamp(0.65rem, 0.75vw, 0.75rem);
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }
          .table td {
            vertical-align: middle;
            padding: 10px 16px;
          }

          .edit-submit-btn {
            transition: all 0.3s ease !important;
            background-color: #f39c12 !important;
            border-color: #f39c12 !important;
            color: white !important;
            font-weight: 600 !important;
            box-shadow: 0 4px 15px rgba(243, 156, 18, 0.4) !important;
          }
          .edit-submit-btn:hover:not(:disabled) {
            transform: translateY(-3px) scale(1.03) !important;
            box-shadow: 0 8px 30px rgba(243, 156, 18, 0.5) !important;
            background-color: #e67e22 !important;
            border-color: #e67e22 !important;
          }

          .upload-submit-btn {
            transition: all 0.3s ease !important;
            background-color: #2ecc71 !important;
            border-color: #2ecc71 !important;
            color: white !important;
            font-weight: 600 !important;
            box-shadow: 0 4px 15px rgba(46, 204, 113, 0.4) !important;
          }
          .upload-submit-btn:hover:not(:disabled) {
            transform: translateY(-3px) scale(1.03) !important;
            box-shadow: 0 8px 30px rgba(46, 204, 113, 0.5) !important;
            background-color: #27ae60 !important;
            border-color: #27ae60 !important;
          }

          .modern-modal .modal-content {
            border-radius: 16px !important;
            border: none !important;
            box-shadow: 0 20px 60px rgba(0,0,0,0.15);
            overflow: hidden;
          }

          .info-item {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
          }

          .dashboard-wrapper.dark-theme .stat-card-modern {
            background: #1a1a2e !important;
            border-color: #2d2d44 !important;
          }
          .dashboard-wrapper.dark-theme .table td {
            color: #e9ecef !important;
          }
          .dashboard-wrapper.dark-theme .table th {
            color: #adb5bd !important;
            border-color: #2d2d44 !important;
          }
          .dashboard-wrapper.dark-theme .modal-content {
            background: #1a1a2e !important;
          }
          .dashboard-wrapper.dark-theme .modal-body {
            background: #0d1117 !important;
          }
          .dashboard-wrapper.dark-theme .modal-header {
            background: #1a1a2e !important;
          }
          .dashboard-wrapper.dark-theme .modal-footer {
            background: #1a1a2e !important;
          }

          .dashboard-wrapper.rtl .stat-body {
            flex-direction: row-reverse;
          }
          .dashboard-wrapper.rtl .stat-icon {
            margin-left: 0;
            margin-right: 12px;
          }
          .dashboard-wrapper.rtl .me-1 {
            margin-right: 0 !important;
            margin-left: 0.25rem !important;
          }
          .dashboard-wrapper.rtl .me-2 {
            margin-right: 0 !important;
            margin-left: 0.5rem !important;
          }
          .dashboard-wrapper.rtl .ms-1 {
            margin-left: 0 !important;
            margin-right: 0.25rem !important;
          }
          .dashboard-wrapper.rtl .ms-2 {
            margin-left: 0 !important;
            margin-right: 0.5rem !important;
          }

          @media (max-width: 768px) {
            .stat-card-modern {
              height: 75px !important;
            }
            .stat-value {
              font-size: 1.1rem !important;
            }
            .stat-icon {
              width: 28px !important;
              height: 28px !important;
              font-size: 0.75rem !important;
            }
            .stat-label {
              font-size: 0.45rem !important;
            }
            .table th,
            .table td {
              font-size: 0.7rem !important;
              padding: 6px 10px !important;
            }
            .table td .btn-sm {
              font-size: 0.6rem !important;
              padding: 2px 6px !important;
            }
            .info-item {
              font-size: 0.8rem !important;
            }
            .modal-body {
              padding: 16px !important;
            }
            .modal-header {
              padding: 12px 16px 0 !important;
            }
            .modal-footer {
              padding: 8px 16px 12px !important;
            }
          }

          @media (max-width: 576px) {
            .stat-card-modern {
              height: 65px !important;
            }
            .stat-value {
              font-size: 0.9rem !important;
            }
            .stat-icon {
              width: 24px !important;
              height: 24px !important;
              font-size: 0.65rem !important;
            }
            .stat-label {
              font-size: 0.4rem !important;
            }
            .table th,
            .table td {
              font-size: 0.6rem !important;
              padding: 4px 6px !important;
            }
            .table td .btn-sm {
              font-size: 0.55rem !important;
              padding: 1px 4px !important;
            }
            .table td .btn-sm svg {
              font-size: 10px !important;
            }
            .payment-info .row {
              flex-direction: column !important;
            }
            .payment-info .col-md-6 {
              width: 100% !important;
            }
            .info-item {
              font-size: 0.7rem !important;
            }
            .modal-body {
              padding: 12px !important;
            }
            .modal-header {
              padding: 10px 12px 0 !important;
            }
            .modal-footer {
              padding: 6px 12px 10px !important;
            }
            .modal-header .modal-title {
              font-size: 0.9rem !important;
            }
            .payment-info {
              padding: 10px !important;
            }
            .payment-info .fw-bold {
              font-size: 0.8rem !important;
            }
          }
        `}</style>
      </Container>
    </div>
  );
};

// ===== HELPER: formatNumber =====
const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  return num.toString();
};

export default ParentPayments;