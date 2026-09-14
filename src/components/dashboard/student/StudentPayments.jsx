// src/components/dashboard/student/StudentPayments.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Table, Badge, Button, Form, Modal, Spinner } from 'react-bootstrap';
import {
  FaMoneyBillWave, FaCheckCircle, FaClock,
  FaSync, FaDownload, FaFilePdf, FaFile, FaEye, FaTimes,
  FaCalendarAlt, FaCoins, FaUserGraduate, FaSearch, FaFilter,
  FaReceipt, FaWallet, FaInfoCircle
} from 'react-icons/fa';
import { useLanguage } from '../../../context/LanguageContext';
import { useNotification } from '../../../hooks/useNotification';
import { syncGet } from '../../../services/apiSync';

const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  return num.toString();
};

const StudentPayments = () => {
  const { isArabic } = useLanguage();
  const { notify } = useNotification();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthNamesAr = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'ماي', 'يونيو',
    'يوليوز', 'غشت', 'شتنبر', 'أكتوبر', 'نونبر', 'دجنبر'
  ];
  const getMonthName = (m) => (isArabic ? monthNamesAr[m - 1] : monthNames[m - 1]);

  const arabicFontStyle = {
    fontFamily: isArabic
      ? '"Hacen Tunisia", "Hacen Tunisia Bd", "Noto Sans Arabic", "Vazirmatn", "Traditional Arabic", "Arabic Typesetting", serif'
      : 'inherit',
    lineHeight: isArabic ? '1.8' : '1.6',
    letterSpacing: isArabic ? '0.5px' : '0px',
    fontSize: isArabic ? 'clamp(0.9rem, 1.1vw, 1.05rem)' : 'clamp(0.85rem, 1vw, 1rem)',
  };

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

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await syncGet('/payments', { month: selectedMonth, year: selectedYear });
      const rows = Array.isArray(res?.data) ? res.data : [];
      const mapped = rows.map(p => ({
        id: p.id,
        studentName: p.studentName || p.student_name || 'Student',
        className: p.className || p.class_name || 'N/A',
        month: p.month,
        year: p.year,
        amount: p.amount || 0,
        type: p.category || p.type || 'full',
        status: p.status || 'pending',
        method: p.method || null,
        hasReceipt: !!p.receipt,
        receiptData: p.receipt || null,
        receiptName: p.receiptName || p.receipt_name || null,
        notes: p.notes || '',
        paidAt: p.paidAt || p.paid_at || null,
        createdAt: p.createdAt || p.created_at || null,
        _serverId: p._serverId || p.id,
      }));
      mapped.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
      setPayments(mapped);
    } catch (err) {
      console.error('Error loading payments:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    loadPayments();
    const handlePaymentUpdated = () => loadPayments();
    const handlePaymentApproved = () => loadPayments();
    window.addEventListener('paymentUpdated', handlePaymentUpdated);
    window.addEventListener('paymentApproved', handlePaymentApproved);
    return () => {
      window.removeEventListener('paymentUpdated', handlePaymentUpdated);
      window.removeEventListener('paymentApproved', handlePaymentApproved);
    };
  }, [loadPayments]);

  const filteredPayments = payments.filter(p => {
    const monthMatch = p.month === selectedMonth && p.year === selectedYear;
    const statusMatch = filterStatus === 'all' || p.status === filterStatus;
    const searchMatch = !searchTerm ||
      (p.studentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.className || '').toLowerCase().includes(searchTerm.toLowerCase());
    return monthMatch && statusMatch && searchMatch;
  });

  const stats = {
    total: filteredPayments.length,
    approved: filteredPayments.filter(p => p.status === 'approved').length,
    pending: filteredPayments.filter(p => p.status === 'pending').length,
    submitted: filteredPayments.filter(p => p.status === 'submitted').length,
    rejected: filteredPayments.filter(p => p.status === 'rejected').length,
    totalDue: filteredPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
    totalPaid: filteredPayments.filter(p => p.status === 'approved').reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: { bg: 'warning', text: 'dark', icon: <FaClock />, label: isArabic ? 'قيد الانتظار' : 'Pending' },
      submitted: { bg: 'info', text: 'dark', icon: <FaFile />, label: isArabic ? 'تم الإرسال' : 'Submitted' },
      approved: { bg: 'success', icon: <FaCheckCircle />, label: isArabic ? 'معتمد' : 'Approved' },
      rejected: { bg: 'danger', icon: <FaTimes />, label: isArabic ? 'مرفوض' : 'Rejected' },
      paid: { bg: 'success', icon: <FaCheckCircle />, label: isArabic ? 'مدفوع' : 'Paid' },
      due: { bg: 'secondary', icon: <FaClock />, label: isArabic ? 'مستحق' : 'Due' },
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

  const handleDownloadReceipt = (payment) => {
    try {
      const receiptData = payment.receiptData || payment.receipt;
      if (!receiptData) {
        notify(isArabic ? 'لا يوجد إيصال للتحميل' : 'No receipt to download', 'warning');
        return;
      }
      const byteCharacters = atob(receiptData.includes(',') ? receiptData.split(',')[1] : receiptData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = payment.receiptName || `receipt-${payment.month}-${payment.year}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      notify(isArabic ? 'تم تحميل الإيصال بنجاح' : 'Receipt downloaded successfully', 'success');
    } catch (err) {
      console.error('Download error:', err);
      notify(isArabic ? 'فشل تحميل الإيصال' : 'Failed to download receipt', 'error');
    }
  };

  const handleViewDetail = (payment) => {
    setSelectedPayment(payment);
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 text-muted" style={arabicFontStyle}>
            {isArabic ? 'جاري تحميل المدفوعات...' : 'Loading payments...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-payments" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h4 className="mb-1 fw-bold" style={{ color: darkMode ? '#e9ecef' : '#212529', ...arabicFontStyle }}>
            <FaMoneyBillWave className="me-2 text-success" />
            {isArabic ? 'المدفوعات' : 'My Payments'}
          </h4>
          <p className="text-muted mb-0" style={arabicFontStyle}>
            {isArabic
              ? 'عرض جميع مدفوعاتك وحالة الاعتماد'
              : 'View all your payments and approval status'}
          </p>
        </div>
        <Button
          variant="outline-primary"
          onClick={loadPayments}
          style={{ borderRadius: '10px', ...arabicFontStyle }}
        >
          <FaSync className={loading ? 'fa-spin' : ''} /> {isArabic ? 'تحديث' : 'Refresh'}
        </Button>
      </div>

      <Row className="g-3 mb-4">
        <Col xs={6} md={3}>
          <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px', background: darkMode ? '#1a1a2e' : '#f8f9fa' }}>
            <Card.Body className="text-center">
              <div className="mb-2" style={{ fontSize: '1.5rem', color: '#0d6efd' }}><FaWallet /></div>
              <h5 className="mb-0 fw-bold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{formatNumber(stats.total)}</h5>
              <small className="text-muted" style={arabicFontStyle}>{isArabic ? 'إجمالي' : 'Total'}</small>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px', background: darkMode ? '#1a1a2e' : '#f8f9fa' }}>
            <Card.Body className="text-center">
              <div className="mb-2" style={{ fontSize: '1.5rem', color: '#198754' }}><FaCheckCircle /></div>
              <h5 className="mb-0 fw-bold" style={{ color: '#198754' }}>{formatNumber(stats.approved)}</h5>
              <small className="text-muted" style={arabicFontStyle}>{isArabic ? 'معتمد' : 'Approved'}</small>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px', background: darkMode ? '#1a1a2e' : '#f8f9fa' }}>
            <Card.Body className="text-center">
              <div className="mb-2" style={{ fontSize: '1.5rem', color: '#ffc107' }}><FaClock /></div>
              <h5 className="mb-0 fw-bold" style={{ color: '#ffc107' }}>{formatNumber(stats.pending + stats.submitted)}</h5>
              <small className="text-muted" style={arabicFontStyle}>{isArabic ? 'قيد الانتظار' : 'Pending'}</small>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px', background: darkMode ? '#1a1a2e' : '#f8f9fa' }}>
            <Card.Body className="text-center">
              <div className="mb-2" style={{ fontSize: '1.5rem', color: '#0d6efd' }}><FaCoins /></div>
              <h5 className="mb-0 fw-bold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{formatNumber(stats.totalPaid)}</h5>
              <small className="text-muted" style={arabicFontStyle}>{isArabic ? 'المدفوع' : 'Paid'}</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '12px', background: darkMode ? '#1a1a2e' : '#ffffff' }}>
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col xs={12} md={3}>
              <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                <FaCalendarAlt className="me-1" /> {isArabic ? 'الشهر' : 'Month'}
              </Form.Label>
              <Form.Select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                style={{ borderRadius: '10px', ...arabicFontStyle }}
              >
                {monthNames.map((name, i) => (
                  <option key={i + 1} value={i + 1}>{isArabic ? monthNamesAr[i] : name}</option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={12} md={3}>
              <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                <FaCalendarAlt className="me-1" /> {isArabic ? 'السنة' : 'Year'}
              </Form.Label>
              <Form.Select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                style={{ borderRadius: '10px', ...arabicFontStyle }}
              >
                {[2024, 2025, 2026, 2027].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={12} md={3}>
              <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                <FaFilter className="me-1" /> {isArabic ? 'الحالة' : 'Status'}
              </Form.Label>
              <Form.Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ borderRadius: '10px', ...arabicFontStyle }}
              >
                <option value="all">{isArabic ? 'الكل' : 'All'}</option>
                <option value="pending">{isArabic ? 'قيد الانتظار' : 'Pending'}</option>
                <option value="submitted">{isArabic ? 'تم الإرسال' : 'Submitted'}</option>
                <option value="approved">{isArabic ? 'معتمد' : 'Approved'}</option>
                <option value="rejected">{isArabic ? 'مرفوض' : 'Rejected'}</option>
              </Form.Select>
            </Col>
            <Col xs={12} md={3}>
              <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                <FaSearch className="me-1" /> {isArabic ? 'بحث' : 'Search'}
              </Form.Label>
              <Form.Control
                type="text"
                placeholder={isArabic ? 'بحث بالاسم أو الفصل...' : 'Search by name or class...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ borderRadius: '10px', ...arabicFontStyle }}
              />
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm" style={{ borderRadius: '12px', background: darkMode ? '#1a1a2e' : '#ffffff' }}>
        <Card.Body className="p-0">
          {filteredPayments.length === 0 ? (
            <div className="text-center py-5">
              <FaMoneyBillWave size={48} className="text-muted mb-3" />
              <h5 style={{ color: darkMode ? '#e9ecef' : '#212529', ...arabicFontStyle }}>
                {isArabic ? 'لا توجد مدفوعات' : 'No payments found'}
              </h5>
              <p className="text-muted" style={arabicFontStyle}>
                {isArabic
                  ? 'لم يتم تسجيل أي مدفوعات لهذا الشهر بعد'
                  : 'No payments recorded for this month yet'}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table className="mb-0" style={{ ...arabicFontStyle }}>
                <thead style={{ background: darkMode ? '#0d1117' : '#f8f9fa' }}>
                  <tr>
                    <th style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#495057', borderBottom: 'none' }}>
                      {isArabic ? 'الشهر' : 'Month'}
                    </th>
                    <th style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#495057', borderBottom: 'none' }}>
                      {isArabic ? 'المبلغ' : 'Amount'}
                    </th>
                    <th style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#495057', borderBottom: 'none' }}>
                      {isArabic ? 'النوع' : 'Type'}
                    </th>
                    <th style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#495057', borderBottom: 'none' }}>
                      {isArabic ? 'الحالة' : 'Status'}
                    </th>
                    <th style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#495057', borderBottom: 'none' }}>
                      {isArabic ? 'الفصل' : 'Class'}
                    </th>
                    <th style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#495057', borderBottom: 'none' }} className="text-center">
                      {isArabic ? 'إجراءات' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment, index) => (
                    <tr key={payment.id || index} style={{ borderBottom: `1px solid ${darkMode ? '#2d2d44' : '#f0f0f0'}` }}>
                      <td style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                        <div className="d-flex align-items-center gap-2">
                          <FaCalendarAlt className="text-muted" size={12} />
                          <span>{getMonthName(payment.month)} {payment.year}</span>
                        </div>
                      </td>
                      <td style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                        <span className="fw-bold">{formatNumber(payment.amount)}</span>
                        <small className="text-muted ms-1">{isArabic ? 'د.م' : 'MAD'}</small>
                      </td>
                      <td>{getTypeBadge(payment.type)}</td>
                      <td>{getStatusBadge(payment.status)}</td>
                      <td style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                        {payment.className}
                      </td>
                      <td className="text-center">
                        <div className="d-flex gap-1 justify-content-center">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleViewDetail(payment)}
                            title={isArabic ? 'التفاصيل' : 'Details'}
                            style={{ borderRadius: '8px' }}
                          >
                            <FaEye size={14} />
                          </Button>
                          {payment.hasReceipt && (
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => handleDownloadReceipt(payment)}
                              title={isArabic ? 'تحميل الإيصال' : 'Download Receipt'}
                              style={{ borderRadius: '8px' }}
                            >
                              <FaDownload size={14} />
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
      </Card>

      <Modal
        show={showDetailModal}
        onHide={() => { setShowDetailModal(false); setSelectedPayment(null); }}
        centered
        size="lg"
      >
        <Modal.Header closeButton style={{ background: darkMode ? '#1a1a2e' : '#f8f9fa' }}>
          <Modal.Title style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
            <FaReceipt className="me-2" />
            {isArabic ? 'تفاصيل الدفعة' : 'Payment Details'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? '#1a1a2e' : '#ffffff' }}>
          {selectedPayment && (
            <div>
              <Row className="g-3">
                <Col xs={12} md={6}>
                  <Card className="border-0" style={{ background: darkMode ? '#2d2d44' : '#f8f9fa', borderRadius: '10px' }}>
                    <Card.Body>
                      <h6 className="fw-bold mb-3" style={{ color: darkMode ? '#e9ecef' : '#495057', ...arabicFontStyle }}>
                        <FaUserGraduate className="me-2" />
                        {isArabic ? 'معلومات الطالب' : 'Student Information'}
                      </h6>
                      <div className="mb-2" style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                        <strong>{isArabic ? 'الاسم:' : 'Name:'}</strong> {selectedPayment.studentName}
                      </div>
                      <div className="mb-2" style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                        <strong>{isArabic ? 'الفصل:' : 'Class:'}</strong> {selectedPayment.className}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xs={12} md={6}>
                  <Card className="border-0" style={{ background: darkMode ? '#2d2d44' : '#f8f9fa', borderRadius: '10px' }}>
                    <Card.Body>
                      <h6 className="fw-bold mb-3" style={{ color: darkMode ? '#e9ecef' : '#495057', ...arabicFontStyle }}>
                        <FaMoneyBillWave className="me-2" />
                        {isArabic ? 'معلومات الدفعة' : 'Payment Information'}
                      </h6>
                      <div className="mb-2" style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                        <strong>{isArabic ? 'المبلغ:' : 'Amount:'}</strong> {formatNumber(selectedPayment.amount)} {isArabic ? 'د.م' : 'MAD'}
                      </div>
                      <div className="mb-2" style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                        <strong>{isArabic ? 'الشهر:' : 'Month:'}</strong> {getMonthName(selectedPayment.month)} {selectedPayment.year}
                      </div>
                      <div className="mb-2" style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                        <strong>{isArabic ? 'النوع:' : 'Type:'}</strong> {getTypeBadge(selectedPayment.type)}
                      </div>
                      <div className="mb-2">
                        <strong style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>{isArabic ? 'الحالة:' : 'Status:'}</strong>{' '}
                        {getStatusBadge(selectedPayment.status)}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                {selectedPayment.paidAt && (
                  <Col xs={12}>
                    <div className="alert alert-success mb-0" style={{ borderRadius: '10px', ...arabicFontStyle }}>
                      <FaCheckCircle className="me-2" />
                      {isArabic ? 'تم الدفع في:' : 'Paid on:'}{' '}
                      {new Date(selectedPayment.paidAt).toLocaleDateString(isArabic ? 'ar' : 'en')}
                    </div>
                  </Col>
                )}

                {selectedPayment.notes && (
                  <Col xs={12}>
                    <Card className="border-0" style={{ background: darkMode ? '#2d2d44' : '#f8f9fa', borderRadius: '10px' }}>
                      <Card.Body>
                        <h6 className="fw-bold mb-2" style={{ color: darkMode ? '#e9ecef' : '#495057', ...arabicFontStyle }}>
                          <FaInfoCircle className="me-2" />
                          {isArabic ? 'ملاحظات' : 'Notes'}
                        </h6>
                        <p className="mb-0" style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                          {selectedPayment.notes}
                        </p>
                      </Card.Body>
                    </Card>
                  </Col>
                )}

                {selectedPayment.hasReceipt && (
                  <Col xs={12}>
                    <Card className="border-0" style={{ background: darkMode ? '#2d2d44' : '#f8f9fa', borderRadius: '10px' }}>
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-center">
                          <h6 className="fw-bold mb-0" style={{ color: darkMode ? '#e9ecef' : '#495057', ...arabicFontStyle }}>
                            <FaFilePdf className="me-2 text-danger" />
                            {isArabic ? 'الإيصال' : 'Receipt'}
                          </h6>
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => handleDownloadReceipt(selectedPayment)}
                            style={{ borderRadius: '8px', ...arabicFontStyle }}
                          >
                            <FaDownload className="me-1" /> {isArabic ? 'تحميل' : 'Download'}
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                )}
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer style={{ background: darkMode ? '#1a1a2e' : '#f8f9fa' }}>
          <Button
            variant="secondary"
            onClick={() => { setShowDetailModal(false); setSelectedPayment(null); }}
            style={{ borderRadius: '10px', ...arabicFontStyle }}
          >
            <FaTimes className="me-1" /> {isArabic ? 'إغلاق' : 'Close'}
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .student-payments .table th { font-weight: 600; }
        .student-payments .table td { vertical-align: middle; padding: 0.75rem; }
        .student-payments .table tr:hover { background: ${darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'}; }
        @media (max-width: 768px) {
          .student-payments .table { font-size: 0.85rem; }
        }
      `}</style>
    </div>
  );
};

export default StudentPayments;
