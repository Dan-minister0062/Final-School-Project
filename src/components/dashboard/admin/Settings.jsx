import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';
import { FaSave, FaSchool, FaCalendarAlt, FaCog, FaExclamationTriangle } from 'react-icons/fa';
import { useLanguage } from '../../../context/LanguageContext';
import { useNotification } from '../../../hooks/useNotification';
import api from '../../../services/api';

// ===== SETTINGS COMPONENT WITH SAVE FUNCTIONALITY =====
const Settings = () => {
  const { language, isArabic } = useLanguage();
  const { notify } = useNotification();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    schoolName: 'Madrassat Al Fath',
    schoolEmail: 'info@madrassatalfath.edu',
    schoolPhone: '+123 456 7890',
    schoolAddress: '123 Education Street, City',
    schoolDescription: 'Nurturing Young Minds with Islamic Values',
    schoolWebsite: 'www.madrassatalfath.edu',
    schoolLogo: null,
    language: 'en',
    enableRegistration: true,
    enableAttendance: true,
    enableGrades: true,
    enableNotifications: true,
    maintenanceMode: false,
  });

  // ===== ARABIC FONT STYLE =====
  const arabicFontStyle = {
    fontFamily: isArabic ? '"Hacen Tunisia", "Hacen Tunisia Bd", "Noto Sans Arabic", "Vazirmatn", "Traditional Arabic", "Arabic Typesetting", serif' : 'inherit',
    lineHeight: isArabic ? '1.8' : '1.6',
    letterSpacing: isArabic ? '0.5px' : '0px',
    fontSize: isArabic ? 'clamp(0.9rem, 1.1vw, 1.05rem)' : 'clamp(0.85rem, 1vw, 1rem)',
  };

  // Load settings from MySQL through the API on mount
  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (token && !token.startsWith('demo-')) {
        api.get('/settings').then((res) => {
          const data = res.data?.data;
          if (data && typeof data === 'object') {
            setSettings(prev => ({ ...prev, ...data }));
          }
        }).catch(() => {});
      }
    } catch (e) {
      console.error('Error loading settings:', e);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = () => {
    setLoading(true);
    api.post('/settings', { settings })
      .then(() => {
        setLoading(false);
        notify(
          isArabic ? 'تم حفظ الإعدادات بنجاح' : 'Settings saved successfully',
          'success'
        );
      })
      .catch((error) => {
        setLoading(false);
        notify(
          error.response?.data?.message ||
            (isArabic ? 'فشل حفظ الإعدادات' : 'Failed to save settings'),
          'error'
        );
      });
  };

  const handleReset = () => {
    if (window.confirm(isArabic ? 'هل أنت متأكد من إعادة تعيين الإعدادات؟' : 'Are you sure you want to reset settings?')) {
      const defaults = {
        schoolName: 'Madrassat Al Fath',
        schoolEmail: 'info@madrassatalfath.edu',
        schoolPhone: '+123 456 7890',
        schoolAddress: '123 Education Street, City',
        schoolDescription: 'Nurturing Young Minds with Islamic Values',
        schoolWebsite: 'www.madrassatalfath.edu',
        schoolLogo: null,
        language: 'en',
        enableRegistration: true,
        enableAttendance: true,
        enableGrades: true,
        enableNotifications: true,
        maintenanceMode: false,
      };
      setSettings(defaults);
      // Persist the defaults back to MySQL
      api.post('/settings', { settings: defaults }).catch(() => {});
      notify(
        isArabic ? 'تم إعادة تعيين الإعدادات' : 'Settings reset successfully',
        'info'
      );
    }
  };

  return (
    <div className="container py-4" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="fw-bold" style={arabicFontStyle}>{isArabic ? 'الإعدادات' : 'Settings'}</h2>
          <p className="text-muted" style={arabicFontStyle}>{isArabic ? 'تكوين إعدادات المدرسة' : 'Configure school settings'}</p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <Button 
            variant="outline-secondary" 
            onClick={handleReset}
            disabled={loading}
            style={arabicFontStyle}
          >
            {isArabic ? 'إعادة تعيين' : 'Reset'}
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSave}
            disabled={loading}
            style={arabicFontStyle}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                {isArabic ? 'جاري الحفظ...' : 'Saving...'}
              </>
            ) : (
              <>
                <FaSave className="me-2" /> {isArabic ? 'حفظ الإعدادات' : 'Save Settings'}
              </>
            )}
          </Button>
        </div>
      </div>

      <Row className="g-4">
        {/* ===== SCHOOL INFORMATION ===== */}
        <Col md={6}>
          <Card className="shadow-sm border-0 h-100 modern-card">
            <Card.Header className="bg-transparent border-bottom">
              <h6 className="fw-bold mb-0" style={arabicFontStyle}>
                <FaSchool className="me-2 text-primary" />
                {isArabic ? 'معلومات المدرسة' : 'School Information'}
              </h6>
            </Card.Header>
            <Card.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label style={arabicFontStyle}>{isArabic ? 'اسم المدرسة' : 'School Name'}</Form.Label>
                  <Form.Control
                    type="text"
                    name="schoolName"
                    value={settings.schoolName}
                    onChange={handleChange}
                    style={arabicFontStyle}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label style={arabicFontStyle}>{isArabic ? 'البريد الإلكتروني' : 'School Email'}</Form.Label>
                  <Form.Control
                    type="email"
                    name="schoolEmail"
                    value={settings.schoolEmail}
                    onChange={handleChange}
                    style={arabicFontStyle}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label style={arabicFontStyle}>{isArabic ? 'رقم الهاتف' : 'School Phone'}</Form.Label>
                  <Form.Control
                    type="text"
                    name="schoolPhone"
                    value={settings.schoolPhone}
                    onChange={handleChange}
                    style={arabicFontStyle}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label style={arabicFontStyle}>{isArabic ? 'العنوان' : 'School Address'}</Form.Label>
                  <Form.Control
                    type="text"
                    name="schoolAddress"
                    value={settings.schoolAddress}
                    onChange={handleChange}
                    style={arabicFontStyle}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label style={arabicFontStyle}>{isArabic ? 'الموقع الإلكتروني' : 'Website'}</Form.Label>
                  <Form.Control
                    type="text"
                    name="schoolWebsite"
                    value={settings.schoolWebsite}
                    onChange={handleChange}
                    style={arabicFontStyle}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label style={arabicFontStyle}>{isArabic ? 'وصف المدرسة' : 'School Description'}</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="schoolDescription"
                    value={settings.schoolDescription}
                    onChange={handleChange}
                    style={arabicFontStyle}
                  />
                </Form.Group>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* ===== GENERAL SETTINGS ===== */}
        <Col md={6}>
          <Card className="shadow-sm border-0 h-100 modern-card">
            <Card.Header className="bg-transparent border-bottom">
              <h6 className="fw-bold mb-0" style={arabicFontStyle}>
                <FaCog className="me-2 text-warning" />
                {isArabic ? 'الإعدادات العامة' : 'General Settings'}
              </h6>
            </Card.Header>
            <Card.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label style={arabicFontStyle}>{isArabic ? 'اللغة الافتراضية' : 'Default Language'}</Form.Label>
                  <Form.Select
                    name="language"
                    value={settings.language}
                    onChange={handleChange}
                    style={{ ...arabicFontStyle, paddingRight: isArabic ? '2rem' : '0.75rem' }}
                  >
                    <option value="en">English</option>
                    <option value="ar">العربية</option>
                  </Form.Select>
                </Form.Group>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* ===== FEATURES ===== */}
        <Col md={12}>
          <Card className="shadow-sm border-0 modern-card">
            <Card.Header className="bg-transparent border-bottom">
              <h6 className="fw-bold mb-0" style={arabicFontStyle}>
                <FaCog className="me-2 text-warning" />
                {isArabic ? 'الميزات والإعدادات' : 'Features & Settings'}
              </h6>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3} sm={6} xs={12}>
                  <Form.Check
                    type="switch"
                    id="enableRegistration"
                    label={isArabic ? 'تفعيل التسجيل' : 'Enable Registration'}
                    name="enableRegistration"
                    checked={settings.enableRegistration}
                    onChange={handleChange}
                    className="mb-2"
                    style={arabicFontStyle}
                  />
                </Col>
                <Col md={3} sm={6} xs={12}>
                  <Form.Check
                    type="switch"
                    id="enableAttendance"
                    label={isArabic ? 'تفعيل الحضور' : 'Enable Attendance'}
                    name="enableAttendance"
                    checked={settings.enableAttendance}
                    onChange={handleChange}
                    className="mb-2"
                    style={arabicFontStyle}
                  />
                </Col>
                <Col md={3} sm={6} xs={12}>
                  <Form.Check
                    type="switch"
                    id="enableGrades"
                    label={isArabic ? 'تفعيل الدرجات' : 'Enable Grades'}
                    name="enableGrades"
                    checked={settings.enableGrades}
                    onChange={handleChange}
                    className="mb-2"
                    style={arabicFontStyle}
                  />
                </Col>
                <Col md={3} sm={6} xs={12}>
                  <Form.Check
                    type="switch"
                    id="enableNotifications"
                    label={isArabic ? 'تفعيل الإشعارات' : 'Enable Notifications'}
                    name="enableNotifications"
                    checked={settings.enableNotifications}
                    onChange={handleChange}
                    className="mb-2"
                    style={arabicFontStyle}
                  />
                </Col>
              </Row>
              <Row className="mt-3">
                <Col md={12}>
                  <Form.Check
                    type="switch"
                    id="maintenanceMode"
                    label={
                      <span className={settings.maintenanceMode ? 'text-danger' : ''} style={arabicFontStyle}>
                        {isArabic ? 'وضع الصيانة' : 'Maintenance Mode'}
                      </span>
                    }
                    name="maintenanceMode"
                    checked={settings.maintenanceMode}
                    onChange={handleChange}
                  />
                  {settings.maintenanceMode && (
                    <div className="text-danger small mt-2" style={arabicFontStyle}>
                      <FaExclamationTriangle className="me-1" />
                      {isArabic ? 'المدرسة في وضع الصيانة. سيتم تعطيل الوصول.' : 'School is in maintenance mode. Access will be disabled.'}
                    </div>
                  )}
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <style>{`
        .modern-card {
          border-radius: 16px !important;
          overflow: hidden;
          transition: all 0.3s ease;
          background: #ffffff;
          border: 1px solid #e9ecef !important;
        }
        .modern-card:hover {
          box-shadow: 0 8px 30px rgba(0,0,0,0.06) !important;
        }
        .modern-card .card-header {
          padding: 16px 20px;
          background: transparent;
          border-bottom: 1px solid #e9ecef;
        }
        .modern-card .card-body {
          padding: 20px;
        }

        .form-control, .form-select {
          border-radius: 10px;
          border: 2px solid #e9ecef;
          transition: all 0.3s ease;
          padding: 8px 14px;
        }
        .form-control:focus, .form-select:focus {
          border-color: #1a5f7a;
          box-shadow: 0 0 0 0.2rem rgba(26, 95, 122, 0.15);
        }

        .form-switch .form-check-input {
          width: 48px;
          height: 24px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .form-switch .form-check-input:checked {
          background-color: #1a5f7a;
          border-color: #1a5f7a;
        }
        .form-switch .form-check-input:focus {
          box-shadow: 0 0 0 0.2rem rgba(26, 95, 122, 0.15);
        }
        .form-switch .form-check-label {
          cursor: pointer;
          padding-left: 8px;
        }

        .btn {
          border-radius: 50px !important;
          padding: 8px 24px !important;
          font-weight: 600 !important;
          transition: all 0.3s ease !important;
        }
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .btn-primary {
          background: #1a5f7a;
          border-color: #1a5f7a;
        }
        .btn-primary:hover {
          background: #0d4b66;
          border-color: #0d4b66;
        }
        .btn-outline-secondary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }

        /* RTL fixes */
        [dir="rtl"] .form-switch .form-check-label {
          padding-left: 0;
          padding-right: 8px;
        }
        [dir="rtl"] .me-2 {
          margin-right: 0 !important;
          margin-left: 0.5rem !important;
        }
        [dir="rtl"] .ms-2 {
          margin-left: 0 !important;
          margin-right: 0.5rem !important;
        }
        [dir="rtl"] .form-select {
          background-position: left 0.75rem center !important;
          padding-right: 0.75rem !important;
          padding-left: 2rem !important;
        }

        @media (max-width: 768px) {
          .modern-card .card-body {
            padding: 16px !important;
          }
          .modern-card .card-header {
            padding: 12px 16px !important;
          }
          .form-control, .form-select {
            font-size: 0.85rem !important;
            padding: 6px 12px !important;
          }
          .btn {
            padding: 6px 16px !important;
            font-size: 0.85rem !important;
          }
          .form-switch .form-check-input {
            width: 40px;
            height: 20px;
          }
        }

        @media (max-width: 576px) {
          .modern-card .card-body {
            padding: 12px !important;
          }
          .modern-card .card-header {
            padding: 10px 12px !important;
          }
          .form-control, .form-select {
            font-size: 0.75rem !important;
            padding: 4px 10px !important;
          }
          .btn {
            padding: 4px 12px !important;
            font-size: 0.75rem !important;
          }
          .form-switch .form-check-input {
            width: 36px;
            height: 18px;
          }
          .form-switch .form-check-label {
            font-size: 0.75rem !important;
          }
          .d-flex.gap-2 {
            gap: 8px !important;
          }
          .row .col-12 {
            margin-bottom: 8px;
          }
        }

        @media (max-width: 400px) {
          .modern-card .card-body {
            padding: 8px !important;
          }
          .form-control, .form-select {
            font-size: 0.65rem !important;
            padding: 3px 8px !important;
          }
          .btn {
            padding: 3px 10px !important;
            font-size: 0.65rem !important;
          }
          .form-switch .form-check-input {
            width: 32px;
            height: 16px;
          }
          .form-switch .form-check-label {
            font-size: 0.65rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Settings;