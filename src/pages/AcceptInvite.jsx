// src/pages/AcceptInvite.jsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, InputGroup, Badge } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { FaLock, FaUser, FaEnvelope, FaCheckCircle, FaArrowRight, FaEye, FaEyeSlash, FaPaperPlane } from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../hooks/useNotification';
import api from '../services/api';

const AcceptInvite = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { isArabic } = useLanguage();
  const { notify } = useNotification();
  
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Arabic font style
  const arabicFontStyle = {
    fontFamily: isArabic ? '"Hacen Tunisia", "Hacen Tunisia Bd", "Noto Sans Arabic", "Vazirmatn", "Traditional Arabic", "Arabic Typesetting", serif' : 'inherit',
    lineHeight: isArabic ? '1.8' : '1.6',
    letterSpacing: isArabic ? '0.5px' : '0px',
    fontSize: isArabic ? 'clamp(0.95rem, 1.2vw, 1.1rem)' : 'clamp(0.9rem, 1.1vw, 1.05rem)',
  };

  // Verify invite token
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await api.get(`/auth/accept-invite/${token}`);
        if (response.data.success) {
          setUserData(response.data.data.user);
        } else {
          setError(isArabic ? 'رابط الدعوة غير صالح أو منتهي الصلاحية' : 'Invalid or expired invitation link');
        }
      } catch (err) {
        console.error('Error verifying invite:', err);
        setError(isArabic ? 'حدث خطأ أثناء التحقق من الدعوة' : 'Error verifying invitation');
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token, isArabic]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 8) {
      notify(
        isArabic ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password must be at least 8 characters',
        'warning'
      );
      return;
    }

    if (password !== confirmPassword) {
      notify(
        isArabic ? 'كلمات المرور غير متطابقة' : 'Passwords do not match',
        'warning'
      );
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.post('/auth/set-password', {
        token,
        password
      });

      if (response.data.success) {
        setSuccess(true);
        notify(
          isArabic ? '✅ تم تفعيل حسابك بنجاح! يمكنك الآن تسجيل الدخول.' : '✅ Account activated successfully! You can now login.',
          'success'
        );
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      console.error('Error setting password:', err);
      notify(
        isArabic ? '❌ حدث خطأ أثناء تعيين كلمة المرور' : '❌ Error setting password',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Get role label
  const getRoleLabel = (role) => {
    const roles = {
      admin: isArabic ? 'مدير' : 'Admin',
      teacher: isArabic ? 'معلم' : 'Teacher',
      parent: isArabic ? 'ولي أمر' : 'Parent',
      student: isArabic ? 'طالب' : 'Student'
    };
    return roles[role] || role;
  };

  // Get role color
  const getRoleColor = (role) => {
    const colors = {
      admin: '#1a5f7a',
      teacher: '#2d6a4f',
      parent: '#c49a6c',
      student: '#6c757d'
    };
    return colors[role] || '#1a5f7a';
  };

  // Password strength indicator
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: isArabic ? 'ضعيف' : 'Weak', color: '#e74c3c' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    
    const strengths = [
      { score: 0, label: isArabic ? 'ضعيف جداً' : 'Very Weak', color: '#e74c3c' },
      { score: 1, label: isArabic ? 'ضعيف' : 'Weak', color: '#e67e22' },
      { score: 2, label: isArabic ? 'متوسط' : 'Medium', color: '#f39c12' },
      { score: 3, label: isArabic ? 'قوي' : 'Strong', color: '#2ecc71' },
      { score: 4, label: isArabic ? 'قوي جداً' : 'Very Strong', color: '#27ae60' },
    ];
    return strengths[score] || strengths[0];
  };

  const passwordStrength = getPasswordStrength(password);

  if (loading) {
    return (
      <div className="accept-invite-page py-5" style={{ background: 'linear-gradient(135deg, #f0f2f5 0%, #e8ecf1 100%)', minHeight: '100vh' }}>
        <Container>
          <Row className="justify-content-center">
            <Col lg={6} md={8}>
              <Card className="shadow-lg border-0 text-center p-5" style={{ borderRadius: '20px' }}>
                <Spinner animation="border" variant="primary" size="lg" />
                <p className="mt-4 text-muted" style={arabicFontStyle}>
                  {isArabic ? 'جاري التحقق من الدعوة...' : 'Verifying invitation...'}
                </p>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  if (error) {
    return (
      <div className="accept-invite-page py-5" style={{ background: 'linear-gradient(135deg, #f0f2f5 0%, #e8ecf1 100%)', minHeight: '100vh' }}>
        <Container>
          <Row className="justify-content-center">
            <Col lg={6} md={8}>
              <Card className="shadow-lg border-0 text-center p-5" style={{ borderRadius: '20px' }}>
                <div className="mb-4">
                  <div className="display-1 text-danger">🔗</div>
                </div>
                <h4 className="fw-bold text-danger" style={arabicFontStyle}>
                  {isArabic ? 'رابط غير صالح' : 'Invalid Link'}
                </h4>
                <p className="text-muted" style={arabicFontStyle}>{error}</p>
                <Button variant="primary" onClick={() => navigate('/')} style={arabicFontStyle}>
                  {isArabic ? 'العودة للرئيسية' : 'Back to Home'}
                </Button>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  if (success) {
    return (
      <div className="accept-invite-page py-5" style={{ background: 'linear-gradient(135deg, #f0f2f5 0%, #e8ecf1 100%)', minHeight: '100vh' }}>
        <Container>
          <Row className="justify-content-center">
            <Col lg={6} md={8}>
              <Card className="shadow-lg border-0 text-center p-5" style={{ borderRadius: '20px' }}>
                <div className="mb-4">
                  <div className="display-1 text-success">✅</div>
                </div>
                <h4 className="fw-bold text-success" style={arabicFontStyle}>
                  {isArabic ? 'تم تفعيل الحساب بنجاح!' : 'Account Activated!'}
                </h4>
                <p className="text-muted" style={arabicFontStyle}>
                  {isArabic
                    ? 'تم تفعيل حسابك بنجاح. سيتم توجيهك إلى صفحة تسجيل الدخول...'
                    : 'Your account has been activated. You will be redirected to login...'}
                </p>
                <div className="mt-3">
                  <Spinner animation="border" variant="primary" size="sm" />
                </div>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  return (
    <div className="accept-invite-page py-5" style={{ background: 'linear-gradient(135deg, #f0f2f5 0%, #e8ecf1 100%)', minHeight: '100vh' }}>
      <Container>
        <Row className="justify-content-center">
          <Col lg={6} md={8}>
            <Card className="shadow-lg border-0" style={{ borderRadius: '20px', overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ 
                background: 'linear-gradient(135deg, #1a5f7a 0%, #2a7f9a 100%)',
                padding: '30px',
                textAlign: 'center',
                color: 'white'
              }}>
                <h2 className="fw-bold mb-1" style={arabicFontStyle}>
                  {isArabic ? '🔑 تفعيل الحساب' : '🔑 Activate Account'}
                </h2>
                <p className="mb-0 opacity-75" style={arabicFontStyle}>
                  {isArabic
                    ? 'قم بتعيين كلمة المرور لتفعيل حسابك'
                    : 'Set your password to activate your account'}
                </p>
              </div>

              <Card.Body className="p-4">
                {/* User Info */}
                <div className="user-info-box p-3 mb-4" style={{ 
                  background: '#f8f9fa',
                  borderRadius: '12px',
                  borderLeft: isArabic ? 'none' : '4px solid #1a5f7a',
                  borderRight: isArabic ? '4px solid #1a5f7a' : 'none'
                }}>
                  <div className="d-flex align-items-center gap-3">
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${getRoleColor(userData?.role)}, ${getRoleColor(userData?.role)}cc)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '1.3rem',
                      fontWeight: '700',
                      flexShrink: 0
                    }}>
                      {userData?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div className="fw-bold" style={arabicFontStyle}>{userData?.name}</div>
                      <div className="text-muted small" style={arabicFontStyle}>
                        <FaEnvelope className="me-1" size={12} /> {userData?.email}
                      </div>
                      <Badge style={{ background: getRoleColor(userData?.role), color: 'white' }} className="mt-1">
                        {getRoleLabel(userData?.role)}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Password Form */}
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label style={arabicFontStyle}>
                      <FaLock className="me-1" /> 
                      {isArabic ? 'كلمة المرور الجديدة' : 'New Password'} *
                    </Form.Label>
                    <InputGroup>
                      <Form.Control
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={isArabic ? 'أدخل كلمة المرور' : 'Enter password'}
                        style={arabicFontStyle}
                        required
                      />
                      <Button
                        variant="outline-secondary"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ border: '1px solid #e9ecef' }}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </Button>
                    </InputGroup>
                    <Form.Text className="text-muted" style={arabicFontStyle}>
                      {isArabic ? 'يجب أن تكون كلمة المرور 8 أحرف على الأقل' : 'Password must be at least 8 characters'}
                    </Form.Text>
                    
                    {/* Password Strength Indicator */}
                    {password && (
                      <div className="mt-2">
                        <div className="d-flex justify-content-between align-items-center">
                          <small className="text-muted" style={arabicFontStyle}>
                            {isArabic ? 'قوة كلمة المرور:' : 'Password strength:'}
                          </small>
                          <small style={{ color: passwordStrength.color, fontWeight: '600' }}>
                            {passwordStrength.label}
                          </small>
                        </div>
                        <div style={{
                          height: '4px',
                          borderRadius: '2px',
                          background: '#e9ecef',
                          marginTop: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${(passwordStrength.score / 4) * 100}%`,
                            height: '100%',
                            background: passwordStrength.color,
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </div>
                    )}
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label style={arabicFontStyle}>
                      <FaLock className="me-1" /> 
                      {isArabic ? 'تأكيد كلمة المرور' : 'Confirm Password'} *
                    </Form.Label>
                    <Form.Control
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={isArabic ? 'أعد إدخال كلمة المرور' : 'Re-enter password'}
                      style={arabicFontStyle}
                      required
                      isInvalid={password && confirmPassword && password !== confirmPassword}
                    />
                    {password && confirmPassword && password !== confirmPassword && (
                      <Form.Control.Feedback type="invalid" style={arabicFontStyle}>
                        {isArabic ? 'كلمات المرور غير متطابقة' : 'Passwords do not match'}
                      </Form.Control.Feedback>
                    )}
                  </Form.Group>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-100"
                    disabled={submitting}
                    style={{ borderRadius: '50px', fontSize: '1.1rem', fontWeight: '600', ...arabicFontStyle }}
                  >
                    {submitting ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        {isArabic ? 'جاري التفعيل...' : 'Activating...'}
                      </>
                    ) : (
                      <>
                        <FaCheckCircle className="me-2" />
                        {isArabic ? 'تفعيل الحساب' : 'Activate Account'}
                      </>
                    )}
                  </Button>
                </Form>

                <div className="text-center mt-4">
                  <small className="text-muted" style={arabicFontStyle}>
                    {isArabic
                      ? 'بعد التفعيل، سيتم توجيهك إلى لوحة التحكم الخاصة بك'
                      : 'After activation, you will be redirected to your dashboard'}
                    <FaArrowRight className="ms-2" size={12} />
                  </small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      <style>{`
        .accept-invite-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
        }

        .user-info-box {
          transition: all 0.3s ease;
        }
        .user-info-box:hover {
          background: #e9ecef;
        }

        .form-control:focus {
          border-color: #1a5f7a;
          box-shadow: 0 0 0 0.2rem rgba(26, 95, 122, 0.15);
        }

        .form-control.is-invalid:focus {
          border-color: #dc3545;
          box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.15);
        }

        [dir="rtl"] .me-1 {
          margin-right: 0 !important;
          margin-left: 0.25rem !important;
        }
        [dir="rtl"] .me-2 {
          margin-right: 0 !important;
          margin-left: 0.5rem !important;
        }
        [dir="rtl"] .ms-2 {
          margin-left: 0 !important;
          margin-right: 0.5rem !important;
        }

        @media (max-width: 576px) {
          .accept-invite-page {
            padding: 16px !important;
          }
          .card-body {
            padding: 20px !important;
          }
          .user-info-box {
            padding: 12px !important;
          }
          .user-info-box .d-flex {
            flex-direction: column !important;
            text-align: center !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AcceptInvite;