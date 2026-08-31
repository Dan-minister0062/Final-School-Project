// src/components/public/Contact.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Badge, InputGroup } from 'react-bootstrap';
import {
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaClock,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaYoutube,
  FaWhatsapp,
  FaArrowRight,
  FaCheckCircle,
  FaPaperPlane,
  FaUser,
  FaComment,
  FaRegClock,
  FaBuilding,
  FaParking,
  FaBus,
  FaBookOpen,
  FaChalkboardTeacher,
  FaGraduationCap,
  FaClipboardCheck,
  FaHeadset,
  FaMapPin,
  FaDirections,
  FaPhoneAlt,
  FaEnvelopeOpen,
  FaSchool,
  FaStar,
  FaChevronRight
} from 'react-icons/fa';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useLanguage } from '../../context/LanguageContext';
import { getTranslation } from '../../utils/translations';
import { useNotification } from '../../hooks/useNotification';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

const contactSchema = yup.object().shape({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  subject: yup.string().required('Subject is required'),
  message: yup.string().required('Message is required').min(10, 'Message must be at least 10 characters'),
});

const Contact = () => {
  const { language, isArabic } = useLanguage();
  const t = (key) => getTranslation(key, language);
  const { notify } = useNotification();
  const { isAuthenticated, user } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);

  // Auto-hide success message after 5 seconds
  useEffect(() => {
    if (submitted) {
      const timer = setTimeout(() => {
        setSubmitted(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [submitted]);

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm({
    resolver: yupResolver(contactSchema),
    defaultValues: {
      name: isAuthenticated ? user?.name || '' : '',
      email: isAuthenticated ? user?.email || '' : '',
    }
  });

  // Updated Arabic font style with Google Fonts
  const arabicFontStyle = {
    fontFamily: isArabic ? '"Noto Sans Arabic", "Vazirmatn", "Traditional Arabic", serif' : 'inherit',
    lineHeight: isArabic ? '1.8' : '1.6',
    letterSpacing: isArabic ? '0.3px' : '0px',
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await api.post('/contact', {
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
      });
      notify(t('messageSuccess'), 'success');
      setSubmitted(true);
      reset();
    } catch (error) {
      console.error('Contact form error:', error);
      notify(t('messageError'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Updated contact info with English numbers
  const contactInfo = [
    {
      icon: <FaPhoneAlt size={18} />,
      title: t('phone'),
      info: '+212 537 350 200',
      sub: isArabic ? 'متاح 24/7' : 'Available 24/7',
      color: '#1a5f7a',
      gradient: 'linear-gradient(135deg, #1a5f7a 0%, #2a7f9a 100%)'
    },
    {
      icon: <FaEnvelopeOpen size={18} />,
      title: t('email'),
      info: 'madrassatelfath@gmail.com',
      sub: isArabic ? 'نرد خلال 24 ساعة' : 'Reply within 24 hours',
      color: '#2d6a4f',
      gradient: 'linear-gradient(135deg, #2d6a4f 0%, #40916c 100%)'
    },
    {
      icon: <FaMapPin size={18} />,
      title: t('address'),
      info: isArabic ? 'المغرب العربي ب3 أولاد اوجيه، القنيطرة' : 'Maghrib El Arabi B3 Oulad Oujih, Kenitra',
      sub: isArabic ? 'المغرب' : 'Morocco',
      color: '#c49a6c',
      gradient: 'linear-gradient(135deg, #c49a6c 0%, #dbb88a 100%)'
    },
    {
      icon: <FaRegClock size={18} />,
      title: t('officeHours'),
      info: isArabic ? 'الإثنين - الجمعة: 8:00 ص - 6:00 م' : 'Monday - Friday: 8:00 AM - 6:00 PM',
      sub: isArabic ? 'السبت: 9:00 ص - 1:00 م' : 'Saturday: 9:00 AM - 1:00 PM',
      color: '#d4a373',
      gradient: 'linear-gradient(135deg, #d4a373 0%, #f0d5a8 100%)'
    },
  ];

  // Updated facilities - removed parking
  const facilities = [
    { icon: <FaBus />, label: isArabic ? 'نقل مدرسي' : 'School Transport', color: '#2d6a4f' },
    { icon: <FaBookOpen />, label: isArabic ? 'مكتبة' : 'Library', color: '#c49a6c' },
    { icon: <FaChalkboardTeacher />, label: isArabic ? 'فصول دراسية' : 'Classrooms', color: '#d4a373' },
    { icon: <FaGraduationCap />, label: isArabic ? 'مرافق تعليمية' : 'Educational Facilities', color: '#8e44ad' },
    { icon: <FaClipboardCheck />, label: isArabic ? 'إدارة أكاديمية' : 'Academic Management', color: '#1a5f7a' },
    { icon: <FaBuilding />, label: isArabic ? 'مرافق حديثة' : 'Modern Facilities', color: '#6c757d' },
  ];

  // Get directions function
  const getDirections = () => {
    const address = encodeURIComponent('Maghrib El Arabi B3 Oulad Oujih, Kenitra, Morocco');
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${address}`, '_blank');
  };

  // Call phone function
  const callPhone = () => {
    window.location.href = 'tel:+212537350200';
  };

  return (
    <div className="fade-in" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Hero Section */}
      <section className="py-5" style={{ background: 'linear-gradient(135deg, #031c2f 0%, #1a5f7a 100%)' }}>
        <Container>
          <h1 className="display-4 fw-bold text-center text-white" style={arabicFontStyle}>
            {t('contactTitle')}
          </h1>
          <p className="text-center fs-5 text-white opacity-75" style={arabicFontStyle}>
            {t('contactSubtitle')}
          </p>
        </Container>
      </section>

      {/* Main Content */}
      <section className="py-5">
        <Container>
          <Row className="g-4">
            {/* Left Side - Contact Info */}
            <Col lg={4}>
              <div className="position-sticky" style={{ top: '100px' }}>
                {/* Get In Touch Card */}
                <Card className="shadow-lg border-0 contact-info-card" style={{
                  borderRadius: '20px',
                  overflow: 'hidden',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                  {/* Top Gradient Bar */}
                  <div className="card-top-bar" style={{
                    height: '5px',
                    background: 'linear-gradient(90deg, #1a5f7a, #2a7f9a, #d4a373)',
                    transition: 'height 0.4s ease'
                  }}></div>

                  <Card.Body className="p-4" style={{
                    background: 'linear-gradient(135deg, #031c2f 0%, #1a5f7a 100%)',
                    color: 'white'
                  }}>
                    <div className="text-center mb-4">
                      <div className="rounded-circle d-inline-flex align-items-center justify-content-center p-3"
                        style={{
                          background: 'rgba(255,255,255,0.15)',
                          width: '70px',
                          height: '70px',
                          animation: 'pulse 2s ease-in-out infinite'
                        }}>
                        <FaHeadset size={32} color="white" />
                      </div>
                      <h4 className="mt-2" style={arabicFontStyle}>{t('getInTouch')}</h4>
                      <p className="text-white-50 small" style={arabicFontStyle}>
                        {isArabic ? 'نحن هنا لمساعدتك' : "We're here to help you"}
                      </p>
                    </div>

                    {contactInfo.map((item, index) => (
                      <div
                        key={index}
                        className="d-flex align-items-start gap-3 p-3 rounded-3 mb-3 contact-info-item"
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          borderLeft: `3px solid ${item.color}`,
                          borderRight: isArabic ? `3px solid ${item.color}` : 'none',
                          transition: 'all 0.3s ease',
                          cursor: 'default'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = isArabic ? 'translateX(-5px)' : 'translateX(5px)';
                          e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateX(0)';
                          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        }}
                      >
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center p-2"
                          style={{
                            background: 'rgba(255,255,255,0.1)',
                            minWidth: '40px',
                            minHeight: '40px',
                            color: item.color
                          }}
                        >
                          {item.icon}
                        </div>
                        <div className="flex-grow-1">
                          <div className="fw-bold" style={arabicFontStyle}>{item.title}</div>
                          <div className="text-white-50" style={arabicFontStyle}>{item.info}</div>
                          <div className="text-white-50 small">{item.sub}</div>
                        </div>
                      </div>
                    ))}
                  </Card.Body>
                </Card>

                {/* Location Card - Restored */}
                <Card className="shadow-lg border-0 mt-3 location-card" style={{
                  borderRadius: '16px',
                  overflow: 'hidden',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                  {/* Top Gradient Bar */}
                  <div className="card-top-bar" style={{
                    height: '4px',
                    background: 'linear-gradient(90deg, #1a5f7a, #2a7f9a, #c49a6c)',
                    transition: 'height 0.4s ease'
                  }}></div>

                  <Card.Header className="bg-white border-0 p-3" style={{ borderBottom: '2px solid #f0f0f0' }}>
                    <div className="d-flex align-items-center gap-2">
                      <FaMapMarkerAlt className="text-primary" />
                      <h6 className="fw-bold mb-0" style={arabicFontStyle}>{t('Our Location')}</h6>
                    </div>
                  </Card.Header>
                  <Card.Body className="p-0">
                    <div
                      style={{
                        height: '220px',
                        width: '100%',
                        background: 'linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%)',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column'
                      }}
                    >
                      <div className="text-center p-4">
                        <div className="location-icon-wrapper" style={{
                          width: '70px',
                          height: '70px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #1a5f7a, #2a7f9a)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 12px',
                          boxShadow: '0 8px 30px rgba(26, 95, 122, 0.3)',
                          animation: 'floatMap 3s ease-in-out infinite'
                        }}>
                          <FaMapMarkerAlt size={30} color="white" />
                        </div>
                        <h6 className="fw-bold" style={arabicFontStyle}>
                          {isArabic ? 'مدرسة الفتح الخاصة' : 'Madrassat Al Fath'}
                        </h6>
                        <p className="text-muted small mb-3" style={arabicFontStyle}>
                          {isArabic ? 'المغرب العربي ب3 أولاد اوجيه، القنيطرة' : 'Maghrib El Arabi B3 Oulad Oujih, Kenitra'}
                        </p>
                        <Button
                          variant="primary"
                          size="sm"
                          className="px-4 py-2"
                          style={{ borderRadius: '50px' }}
                          onClick={getDirections}
                        >
                          <FaDirections className="me-2" /> {t('Get Directions')}
                        </Button>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </Col>

            {/* Right Side - Contact Form */}
            <Col lg={8}>
              <Card className="shadow-lg border-0 form-card" style={{
                borderRadius: '24px',
                overflow: 'hidden',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
              }}>
                {/* Top Gradient Bar */}
                <div className="card-top-bar" style={{
                  height: '5px',
                  background: 'linear-gradient(90deg, #1a5f7a, #2a7f9a, #d4a373)',
                  transition: 'height 0.4s ease'
                }}></div>

                <Card.Header className="bg-white border-0 p-4" style={{ borderBottom: '2px solid #f0f0f0' }}>
                  <div className="d-flex align-items-center gap-3">
                    <div className="rounded-circle p-2" style={{ background: '#1a5f7a15', color: '#1a5f7a' }}>
                      <FaComment size={24} />
                    </div>
                    <div className="flex-grow-1">
                      <h4 className="fw-bold mb-0" style={arabicFontStyle}>{t('sendMessage')}</h4>
                      <p className="text-muted mb-0" style={arabicFontStyle}>
                        {t('Send us a message and we\'ll get back to you soon')}
                      </p>
                    </div>
                  </div>
                </Card.Header>

                <Card.Body className="p-4">
                  {submitted ? (
                    <Alert variant="success" className="text-center p-4" style={{ borderRadius: '16px' }}>
                      <div className="mb-2">
                        <FaCheckCircle size={48} className="text-success" />
                      </div>
                      <h5 style={arabicFontStyle}>🎉 {t('messageSent')}</h5>
                      <p className="mb-0" style={arabicFontStyle}>{t('messageSuccess')}</p>
                    </Alert>
                  ) : (
                    <Form onSubmit={handleSubmit(onSubmit)}>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label style={arabicFontStyle}>{t('yourName')} *</Form.Label>
                            <div className="input-group">
                              <span className="input-group-text bg-light border-2 border-end-0" style={{ borderRadius: isArabic ? '0 10px 10px 0' : '10px 0 0 10px' }}>
                                <FaUser className="text-muted" />
                              </span>
                              <Form.Control
                                {...register('name')}
                                isInvalid={!!errors.name}
                                placeholder={isArabic ? 'أدخل اسمك' : 'Enter your name'}
                                className="py-2 border-2"
                                style={{
                                  borderRadius: isArabic ? '10px 0 0 10px' : '0 10px 10px 0',
                                  borderLeft: isArabic ? '2px solid #e9ecef' : 'none',
                                  borderRight: isArabic ? 'none' : '2px solid #e9ecef'
                                }}
                              />
                            </div>
                            <Form.Control.Feedback type="invalid">{errors.name?.message}</Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label style={arabicFontStyle}>{t('emailAddress')} *</Form.Label>
                            <div className="input-group">
                              <span className="input-group-text bg-light border-2 border-end-0" style={{ borderRadius: isArabic ? '0 10px 10px 0' : '10px 0 0 10px' }}>
                                <FaEnvelope className="text-muted" />
                              </span>
                              <Form.Control
                                type="email"
                                {...register('email')}
                                isInvalid={!!errors.email}
                                placeholder={isArabic ? 'أدخل البريد الإلكتروني' : 'Enter your email'}
                                className="py-2 border-2"
                                style={{
                                  borderRadius: isArabic ? '10px 0 0 10px' : '0 10px 10px 0',
                                  borderLeft: isArabic ? '2px solid #e9ecef' : 'none',
                                  borderRight: isArabic ? 'none' : '2px solid #e9ecef'
                                }}
                              />
                            </div>
                            <Form.Control.Feedback type="invalid">{errors.email?.message}</Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                      </Row>

                      <Form.Group className="mb-3">
                        <Form.Label style={arabicFontStyle}>{t('subject')} *</Form.Label>
                        <div className="input-group">
                          <span className="input-group-text bg-light border-2 border-end-0" style={{ borderRadius: isArabic ? '0 10px 10px 0' : '10px 0 0 10px' }}>
                            <FaComment className="text-muted" />
                          </span>
                          <Form.Control
                            {...register('subject')}
                            isInvalid={!!errors.subject}
                            placeholder={isArabic ? 'أدخل الموضوع' : 'Enter subject'}
                            className="py-2 border-2"
                            style={{
                              borderRadius: isArabic ? '10px 0 0 10px' : '0 10px 10px 0',
                              borderLeft: isArabic ? '2px solid #e9ecef' : 'none',
                              borderRight: isArabic ? 'none' : '2px solid #e9ecef'
                            }}
                          />
                        </div>
                        <Form.Control.Feedback type="invalid">{errors.subject?.message}</Form.Control.Feedback>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label style={arabicFontStyle}>{t('message')} *</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={5}
                          {...register('message')}
                          isInvalid={!!errors.message}
                          placeholder={isArabic ? 'أدخل رسالتك...' : 'Enter your message...'}
                          className="py-2"
                          style={{ borderRadius: '10px', border: '2px solid #e9ecef' }}
                        />
                        <Form.Control.Feedback type="invalid">{errors.message?.message}</Form.Control.Feedback>
                        <Form.Text className="text-muted" style={arabicFontStyle}>
                          {isArabic ? 'الحد الأدنى 10 أحرف' : 'Minimum 10 characters'}
                        </Form.Text>
                      </Form.Group>

                      <Button
                        variant="primary"
                        type="submit"
                        className="w-100 py-3"
                        disabled={submitting}
                        style={{ fontSize: '1.1rem', fontWeight: '600', borderRadius: '50px' }}
                      >
                        {submitting ? (
                          <><Spinner animation="border" size="sm" className="me-2" /> {isArabic ? 'جاري الإرسال...' : 'Sending...'}</>
                        ) : (
                          <><FaPaperPlane className="me-2" /> {t('sendMessageBtn')}</>
                        )}
                      </Button>
                    </Form>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Working Hours & Facilities Section */}
      <section className="py-5 bg-light">
        <Container>
          <Row className="g-4">
            <Col md={6}>
              <Card className="shadow-sm border-0 h-100 working-hours-card" style={{
                borderRadius: '20px',
                overflow: 'hidden',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
              }}>
                {/* Top Gradient Bar */}
                <div className="card-top-bar" style={{
                  height: '5px',
                  background: 'linear-gradient(90deg, #d4a373, #f0d5a8)',
                  transition: 'height 0.4s ease'
                }}></div>

                <Card.Body className="p-4 d-flex flex-column">
                  <h5 className="fw-bold mb-3" style={arabicFontStyle}>
                    <FaRegClock className="me-2" style={{ color: '#d4a373' }} />
                    {t('Working Hours')}
                  </h5>
                  <div className="working-hours flex-grow-1">
                    <div className="d-flex justify-content-between py-2 border-bottom">
                      <span style={arabicFontStyle}>{isArabic ? 'الإثنين - الجمعة' : 'Monday - Friday'}</span>
                      <span className="fw-bold" style={{ color: '#2d6a4f' }}>{isArabic ? '8:00 ص - 6:00 م' : '8:00 AM - 6:00 PM'}</span>
                    </div>
                    <div className="d-flex justify-content-between py-2 border-bottom">
                      <span style={arabicFontStyle}>{isArabic ? 'السبت' : 'Saturday'}</span>
                      <span className="fw-bold" style={{ color: '#c49a6c' }}>{isArabic ? '9:00 ص - 1:00 م' : '9:00 AM - 1:00 PM'}</span>
                    </div>
                    <div className="d-flex justify-content-between py-2 border-bottom">
                      <span style={arabicFontStyle}>{isArabic ? 'الأحد' : 'Sunday'}</span>
                      <span className="fw-bold text-danger">{isArabic ? 'مغلق' : 'Closed'}</span>
                    </div>
                    <div className="mt-3 p-2 rounded-3" style={{ background: 'linear-gradient(135deg, #d4a37315, #f0d5a815)' }}>
                      <small className="text-muted" style={arabicFontStyle}>
                        <FaClock className="me-1" style={{ color: '#d4a373' }} />
                        {isArabic ? 'العطل الرسمية: مغلق' : 'Public Holidays: Closed'}
                      </small>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="shadow-sm border-0 h-100 facilities-card" style={{
                borderRadius: '20px',
                overflow: 'hidden',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
              }}>
                {/* Top Gradient Bar */}
                <div className="card-top-bar" style={{
                  height: '5px',
                  background: 'linear-gradient(90deg, #2d6a4f, #40916c, #c49a6c)',
                  transition: 'height 0.4s ease'
                }}></div>

                <Card.Body className="p-4 d-flex flex-column">
                  <h5 className="fw-bold mb-3" style={arabicFontStyle}>
                    <FaSchool className="me-2" style={{ color: '#2d6a4f' }} />
                    {isArabic ? 'مرافق مدرستنا' : 'Our School Facilities'}
                  </h5>
                  <div className="d-flex flex-wrap gap-2 flex-grow-1 align-content-start">
                    {facilities.map((facility, index) => (
                      <div
                        key={index}
                        className="d-flex align-items-center gap-2 p-2 px-3 bg-white rounded-3 shadow-sm facility-item"
                        style={{
                          border: `2px solid ${facility.color}25`,
                          transition: 'all 0.3s ease',
                          cursor: 'default'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                          e.currentTarget.style.boxShadow = `0 4px 20px ${facility.color}30`;
                          e.currentTarget.style.borderColor = facility.color;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0) scale(1)';
                          e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
                          e.currentTarget.style.borderColor = `${facility.color}25`;
                        }}
                      >
                        <span style={{ color: facility.color }}>{facility.icon}</span>
                        <span className="small" style={arabicFontStyle}>{facility.label}</span>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-5" style={{ background: 'linear-gradient(135deg, #031c2f 0%, #1a5f7a 100%)' }}>
        <Container>
          <Row className="align-items-center text-white text-center text-lg-start">
            <Col lg={8}>
              <h2 className="fw-bold" style={arabicFontStyle}>
                {isArabic ? 'هل لديك استفسار؟' : 'Have a question?'}
              </h2>
              <p className="mb-0" style={arabicFontStyle}>
                {isArabic
                  ? 'نحن هنا لمساعدتك. تواصل معنا وسنرد عليك في أقرب وقت.'
                  : "We're here to help. Contact us and we'll get back to you as soon as possible."}
              </p>
            </Col>
            <Col lg={4} className="text-lg-end mt-3 mt-lg-0">
              <Button
                variant="light"
                size="lg"
                className="px-5"
                style={{ borderRadius: '50px' }}
                onClick={callPhone}
              >
                <FaPhone className="me-2" /> {isArabic ? 'اتصل بنا الآن' : 'Call Us Now'}
              </Button>
            </Col>
          </Row>
        </Container>
      </section>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@100..900&family=Vazirmatn:wght@100..900&display=swap');

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        @keyframes floatMap {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .card-top-bar {
          transition: height 0.4s ease;
        }
        .card:hover .card-top-bar {
          height: 6px;
        }

        .contact-info-card:hover,
        .location-card:hover,
        .form-card:hover,
        .working-hours-card:hover,
        .facilities-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 60px rgba(0,0,0,0.12) !important;
        }

        .contact-info-item {
          transition: all 0.3s ease;
          cursor: default;
        }

        .form-control:focus {
          border-color: #1a5f7a !important;
          box-shadow: 0 0 0 0.2rem rgba(26, 95, 122, 0.15) !important;
        }

        .input-group-text {
          background-color: white !important;
        }

        .working-hours .border-bottom {
          border-color: #e9ecef !important;
        }

        .facility-item {
          transition: all 0.3s ease;
        }

        .h-100 {
          min-height: 280px;
        }

        .position-sticky {
          position: sticky;
          top: 100px;
          z-index: 10;
        }

        .location-icon-wrapper {
          animation: floatMap 3s ease-in-out infinite;
        }

        /* RTL fixes */
        .dashboard-wrapper.rtl .contact-info-item {
          border-left: none !important;
        }
        .dashboard-wrapper.rtl .input-group .form-control {
          border-radius: 10px 0 0 10px !important;
        }
        .dashboard-wrapper.rtl .input-group .input-group-text {
          border-radius: 0 10px 10px 0 !important;
          border-left: 2px solid #e9ecef !important;
          border-right: none !important;
        }
        .dashboard-wrapper.rtl .input-group .form-control {
          border-left: 2px solid #e9ecef !important;
          border-right: none !important;
        }

        @media (max-width: 768px) {
          .position-sticky {
            position: relative !important;
            top: 0 !important;
          }
          .h-100 {
            min-height: auto;
          }
          .contact-info-item {
            padding: 12px !important;
          }
          .facility-item {
            padding: 8px 12px !important;
            font-size: 0.8rem !important;
          }
          .facility-item svg {
            font-size: 0.9rem !important;
          }
          .location-card .p-4 {
            padding: 16px !important;
          }
          .location-icon-wrapper {
            width: 50px !important;
            height: 50px !important;
          }
          .location-icon-wrapper svg {
            font-size: 22px !important;
          }
        }

        @media (max-width: 576px) {
          .contact-info-card .p-4 {
            padding: 16px !important;
          }
          .contact-info-item {
            padding: 10px !important;
            gap: 10px !important;
          }
          .contact-info-item .p-2 {
            min-width: 32px !important;
            min-height: 32px !important;
          }
          .contact-info-item .fw-bold {
            font-size: 0.85rem !important;
          }
          .contact-info-item .text-white-50 {
            font-size: 0.7rem !important;
          }
          .form-card .p-4 {
            padding: 16px !important;
          }
          .form-card h4 {
            font-size: 1.1rem !important;
          }
          .working-hours-card .p-4,
          .facilities-card .p-4 {
            padding: 16px !important;
          }
          .working-hours-card h5,
          .facilities-card h5 {
            font-size: 1rem !important;
          }
          .working-hours .d-flex {
            font-size: 0.8rem !important;
          }
          .facility-item {
            padding: 6px 10px !important;
            font-size: 0.7rem !important;
          }
          .facility-item svg {
            font-size: 0.8rem !important;
          }
          .location-card .p-4 {
            padding: 12px !important;
          }
          .location-icon-wrapper {
            width: 40px !important;
            height: 40px !important;
          }
          .location-icon-wrapper svg {
            font-size: 18px !important;
          }
          .location-card h6 {
            font-size: 0.85rem !important;
          }
          .location-card p {
            font-size: 0.65rem !important;
          }
          .location-card .btn {
            font-size: 0.7rem !important;
            padding: 6px 16px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Contact;