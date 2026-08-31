import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Nav } from 'react-bootstrap';
import { FaCog, FaSchool, FaUser, FaBell, FaShieldAlt, FaPalette, FaLanguage, FaSave } from 'react-icons/fa';
import { useLanguage } from '../../../context/LanguageContext';
import { getTranslation } from '../../../utils/translations';
import { useNotification } from '../../../hooks/useNotification';

const AdminSettings = () => {
  const { language, isArabic } = useLanguage();
  const t = (key) => getTranslation(key, language);
  const { notify } = useNotification();
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);

  const arabicFontStyle = {
    fontFamily: isArabic ? 'Traditional Arabic, "Arabic Typesetting", serif' : 'inherit',
    lineHeight: isArabic ? '1.4' : '1.6',
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      notify(isArabic ? 'تم حفظ الإعدادات بنجاح!' : 'Settings saved successfully!', 'success');
    }, 1500);
  };

  const tabs = [
    { key: 'general', label: isArabic ? 'عام' : 'General', icon: <FaCog /> },
    { key: 'school', label: isArabic ? 'المدرسة' : 'School', icon: <FaSchool /> },
    { key: 'profile', label: isArabic ? 'الملف الشخصي' : 'Profile', icon: <FaUser /> },
    { key: 'notifications', label: isArabic ? 'الإشعارات' : 'Notifications', icon: <FaBell /> },
    { key: 'security', label: isArabic ? 'الأمان' : 'Security', icon: <FaShieldAlt /> },
    { key: 'appearance', label: isArabic ? 'المظهر' : 'Appearance', icon: <FaPalette /> },
  ];

  return (
    <div className="admin-settings" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ ...arabicFontStyle, color: '#1a5f7a' }}>
            <FaCog className="me-2" />
            {isArabic ? 'الإعدادات' : 'Settings'}
          </h4>
          <p className="text-muted mb-0" style={arabicFontStyle}>
            {isArabic ? 'إدارة إعدادات النظام والمدرسة' : 'Manage system and school settings'}
          </p>
        </div>
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? (
            <>{isArabic ? 'جاري الحفظ...' : 'Saving...'}</>
          ) : (
            <><FaSave className="me-2" /> {isArabic ? 'حفظ الإعدادات' : 'Save Settings'}</>
          )}
        </Button>
      </div>

      <Row className="g-4">
        <Col lg={3}>
          <Card className="shadow-sm border-0 modern-card">
            <Card.Body className="p-2">
              <Nav variant="pills" className="flex-column settings-nav">
                {tabs.map((tab) => (
                  <Nav.Link
                    key={tab.key}
                    active={activeTab === tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className="d-flex align-items-center gap-2 py-2 px-3"
                  >
                    <span style={{ fontSize: '1.1rem' }}>{tab.icon}</span>
                    <span style={arabicFontStyle}>{tab.label}</span>
                  </Nav.Link>
                ))}
              </Nav>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={9}>
          <Card className="shadow-sm border-0 modern-card">
            <Card.Body className="p-4">
              {activeTab === 'general' && (
                <>
                  <h6 className="fw-bold mb-3" style={arabicFontStyle}>{isArabic ? 'الإعدادات العامة' : 'General Settings'}</h6>
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label style={arabicFontStyle}>{isArabic ? 'لغة النظام' : 'System Language'}</Form.Label>
                      <Form.Select>
                        <option value="en">English</option>
                        <option value="ar">العربية</option>
                      </Form.Select>
                    </Form.Group>
                    {/* REMOVED: Timezone field */}
                    {/* REMOVED: Currency field */}
                    <Form.Group className="mb-3">
                      <Form.Label style={arabicFontStyle}>{isArabic ? 'تنسيق التاريخ' : 'Date Format'}</Form.Label>
                      <Form.Select>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </Form.Select>
                    </Form.Group>
                  </Form>
                </>
              )}

              {activeTab === 'school' && (
                <>
                  <h6 className="fw-bold mb-3" style={arabicFontStyle}>{isArabic ? 'معلومات المدرسة' : 'School Information'}</h6>
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label style={arabicFontStyle}>{isArabic ? 'اسم المدرسة' : 'School Name'}</Form.Label>
                      <Form.Control defaultValue="Madrassat Al Fath" />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label style={arabicFontStyle}>{isArabic ? 'البريد الإلكتروني' : 'Email'}</Form.Label>
                      <Form.Control type="email" defaultValue="info@madrassatalfath.edu" />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label style={arabicFontStyle}>{isArabic ? 'الهاتف' : 'Phone'}</Form.Label>
                      <Form.Control defaultValue="+123 456 7890" />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label style={arabicFontStyle}>{isArabic ? 'العنوان' : 'Address'}</Form.Label>
                      <Form.Control as="textarea" rows={2} defaultValue="123 Education Street, City" />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label style={arabicFontStyle}>{isArabic ? 'الوصف' : 'Description'}</Form.Label>
                      <Form.Control as="textarea" rows={3} defaultValue="Nurturing Young Minds with Islamic Values" />
                    </Form.Group>
                  </Form>
                </>
              )}

              {activeTab === 'appearance' && (
                <>
                  <h6 className="fw-bold mb-3" style={arabicFontStyle}>{isArabic ? 'المظهر والثيم' : 'Appearance & Theme'}</h6>
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label style={arabicFontStyle}>{isArabic ? 'الوضع المظلم' : 'Dark Mode'}</Form.Label>
                      <Form.Check type="switch" label={isArabic ? 'تفعيل الوضع المظلم' : 'Enable Dark Mode'} />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label style={arabicFontStyle}>{isArabic ? 'اللون الأساسي' : 'Primary Color'}</Form.Label>
                      <Form.Control type="color" defaultValue="#1a5f7a" />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label style={arabicFontStyle}>{isArabic ? 'لون الخلفية' : 'Background Color'}</Form.Label>
                      <Form.Control type="color" defaultValue="#ffffff" />
                    </Form.Group>
                  </Form>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <style>{`
        .modern-card {
          border-radius: 16px !important;
          transition: all 0.3s ease;
          overflow: hidden;
        }
        .modern-card:hover {
          box-shadow: 0 8px 30px rgba(0,0,0,0.06) !important;
        }
        .settings-nav .nav-link {
          border-radius: 10px !important;
          color: #6c757d;
          transition: all 0.3s ease;
        }
        .settings-nav .nav-link:hover {
          background: rgba(26, 95, 122, 0.05);
          color: #1a5f7a;
        }
        .settings-nav .nav-link.active {
          background: #1a5f7a;
          color: white;
        }
        .settings-nav .nav-link .me-2 {
          margin-right: 8px !important;
        }
      `}</style>
    </div>
  );
};

export default AdminSettings;