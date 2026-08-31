// src/components/auth/Register.jsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, InputGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaUser, 
  FaEnvelope, 
  FaLock, 
  FaSchool, 
  FaEye, 
  FaEyeSlash,
  FaArrowLeft,
  FaCheckCircle,
  FaPhone,
  FaMapMarkerAlt,
  FaUserTie,
  FaGraduationCap,
  FaChalkboardTeacher,
  FaUserFriends,
  FaArrowRight,
  FaShieldAlt,
  FaClock,
  FaInfoCircle
} from 'react-icons/fa';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useLanguage } from '../../context/LanguageContext';
import { getTranslation } from '../../utils/translations';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../hooks/useNotification';
import logo from "../../assets/images/school logo.jpeg";

const registerSchema = yup.object().shape({
  // Personal Information
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().required('Phone number is required'),
  address: yup.string().required('Address is required'),
  
  // Role Selection
  role: yup.string().required('Please select your role'),
  
  // Student specific fields
  program: yup.string().when('role', {
    is: 'student',
    then: () => yup.string().required('Please select a program'),
    otherwise: () => yup.string().nullable(),
  }),
  grade: yup.string().when('role', {
    is: 'student',
    then: () => yup.string().required('Please select grade level'),
    otherwise: () => yup.string().nullable(),
  }),
  parentName: yup.string().when('role', {
    is: 'student',
    then: () => yup.string().required('Parent name is required'),
    otherwise: () => yup.string().nullable(),
  }),
  parentPhone: yup.string().when('role', {
    is: 'student',
    then: () => yup.string().required('Parent phone is required'),
    otherwise: () => yup.string().nullable(),
  }),
  parentEmail: yup.string().when('role', {
    is: 'student',
    then: () => yup.string().email('Invalid email').required('Parent email is required'),
    otherwise: () => yup.string().nullable(),
  }),

  // Teacher specific fields
  qualification: yup.string().when('role', {
    is: 'teacher',
    then: () => yup.string().required('Qualification is required'),
    otherwise: () => yup.string().nullable(),
  }),
  subjectSpecialization: yup.string().when('role', {
    is: 'teacher',
    then: () => yup.string().required('Subject specialization is required'),
    otherwise: () => yup.string().nullable(),
  }),
  experience: yup.string().when('role', {
    is: 'teacher',
    then: () => yup.string().required('Years of experience is required'),
    otherwise: () => yup.string().nullable(),
  }),

  // Parent specific fields
  childrenCount: yup.string(), // ✅ No longer required, hidden

  // Account credentials
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  confirmPassword: yup.string().oneOf([yup.ref('password')], 'Passwords must match').required('Confirm password is required'),
});

const Register = () => {
  const { language, isArabic } = useLanguage();
  const t = (key) => getTranslation(key, language);
  const navigate = useNavigate();
  const { register: registerUser, loading } = useAuth();
  const { notify } = useNotification();
  
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      role: 'parent'
    }
  });

  const watchRole = watch('role');

  // ✅ Update selected role when watch changes
  useEffect(() => {
    setSelectedRole(watchRole);
  }, [watchRole]);

  const onSubmit = async (data) => {
    setError("");
    setPendingApproval(false);

    const name = `${data.firstName} ${data.lastName}`.trim();

    const payload = {
      name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      password: data.password,
      password_confirmation: data.confirmPassword,
      role: data.role,
    };

    if (data.role === "student") {
      payload.program = data.program;
      payload.grade = data.grade;
      payload.parent_name = data.parentName;
      payload.parent_phone = data.parentPhone;
      payload.parent_email = data.parentEmail;
    } else if (data.role === "teacher") {
      payload.qualification = data.qualification;
      payload.subject_specialization = data.subjectSpecialization;
      payload.experience = data.experience;
    }

    try {
      const result = await registerUser(payload);
      if (result.success) {
        setRegisterSuccess(true);
        setPendingApproval(true);
        notify(
          isArabic
            ? "تم تسجيل حسابك بنجاح! سيتم مراجعة طلبك من قبل الإدارة."
            : "Your account has been registered successfully! Your request will be reviewed by the admin.",
          "success",
        );
      } else {
        const errors = result.error;
        if (typeof errors === "object") {
          const firstError =
            Object.values(errors)[0]?.[0] || "Registration failed";
          setError(firstError);
          notify(firstError, "error");
        } else {
          setError(errors);
          notify(errors, "error");
        }
      }
    } catch (err) {
      setError(err.message || "Registration failed");
      notify(err.message || "Registration failed", "error");
    }
  };

  // ✅ Arabic font styles
  const arabicFontStyle = {
    fontFamily: isArabic ? 'Vazirmatn, "Noto Sans Arabic", "Traditional Arabic", serif' : 'inherit',
    lineHeight: isArabic ? '1.6' : '1.6',
    letterSpacing: isArabic ? '0.3px' : '0px',
  };

  const arabicHeadingStyle = {
    fontFamily: isArabic ? '"Noto Sans Arabic", Vazirmatn, "Traditional Arabic", serif' : 'inherit',
    fontWeight: isArabic ? '700' : '600',
    lineHeight: isArabic ? '1.4' : '1.4',
    letterSpacing: isArabic ? '0.5px' : '0px',
  };

  const logoExists = logo && typeof logo === 'string' && logo.length > 0;

  // Role options with icons and descriptions
  const roleOptions = [
    { 
      value: 'parent', 
      label: isArabic ? 'ولي أمر' : 'Parent', 
      icon: <FaUserFriends />, 
      color: '#2d6a4f',
      desc: isArabic ? 'متابعة أطفالك' : 'Track your children',
      bg: '#e8f5e9'
    },
    { 
      value: 'teacher', 
      label: isArabic ? 'معلم' : 'Teacher', 
      icon: <FaChalkboardTeacher />, 
      color: '#c49a6c',
      desc: isArabic ? 'إدارة الطلاب' : 'Manage students',
      bg: '#fdf5e6'
    },
    { 
      value: 'student', 
      label: isArabic ? 'طالب' : 'Student', 
      icon: <FaGraduationCap />, 
      color: '#1a5f7a',
      desc: isArabic ? 'متابعة تعليمك' : 'Track your education',
      bg: '#e3f2fd'
    },
  ];

  return (
    <div className="register-page" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Back to Home Button */}
      <Button
        variant="link"
        className="back-home-btn"
        onClick={() => navigate('/')}
        style={{
          [isArabic ? 'right' : 'left']: '20px',
          [isArabic ? 'left' : 'right']: 'auto',
        }}
      >
        {isArabic ? <FaArrowRight className="back-icon" size={14} /> : <FaArrowLeft className="back-icon" size={14} />}
        <span className="back-text" style={arabicFontStyle}>{isArabic ? 'العودة للرئيسية' : 'Back to Home'}</span>
        <span className="back-short-text">🏠</span>
      </Button>

      <div className="register-bg-pattern"></div>
      
      <Container>
        <Row className="justify-content-center align-items-center min-vh-100">
          <Col lg={7} xl={6} xxl={5}>
            <Card className="shadow-lg border-0 register-card">
              {/* Header */}
              <div className="register-card-header">
                <div className="register-card-header-content">
                  <div className="register-logo-wrapper">
                    {logoExists ? (
                      <div className="logo-container">
                        <img
                          src={logo}
                          alt="Madrasatul Fathi Logo"
                          className="register-logo-img"
                          style={{
                            width: "60px",
                            height: "60px",
                            objectFit: "cover",
                            borderRadius: "50%",
                            backgroundColor: "#d87e23",
                            padding: "3px",
                            boxShadow: '0 4px 20px rgba(255,255,255,0.15)',
                            transition: 'transform 0.3s ease',
                            border: '2px solid rgba(255,255,255,0.2)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.08) rotate(-5deg)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1) rotate(0)';
                          }}
                        />
                        <div className="logo-ring"></div>
                      </div>
                    ) : (
                      <div className="bg-white bg-opacity-20 rounded-circle d-inline-flex p-2">
                        <FaSchool size={24} className="text-white" />
                      </div>
                    )}
                  </div>
                  <h5 className="text-white fw-bold mb-0" style={{ ...arabicHeadingStyle, fontSize: '1rem' }}>
                    {isArabic ? 'مدرسة الفتح' : 'Madrassat Al Fath'}
                  </h5>
                  <p className="text-white-50 small mb-0" style={{ ...arabicFontStyle, fontSize: '0.6rem' }}>
                    {isArabic ? 'إنشاء حساب جديد' : 'Create New Account'}
                  </p>
                </div>
              </div>

              <Card.Body className="p-4 p-xl-4">
                {/* Title */}
                <div className="text-center mb-3">
                  <h5 className="fw-bold" style={{ ...arabicHeadingStyle, fontSize: '1.1rem', color: '#1a5f7a' }}>
                    {isArabic ? 'إنشاء حساب جديد' : 'Create New Account'}
                  </h5>
                  <p className="text-muted small" style={{ ...arabicFontStyle, fontSize: '0.75rem' }}>
                    {isArabic ? 'سجل للحصول على حساب جديد في مدرسة الفتح' : 'Register for a new account at Madrassat Al Fath'}
                  </p>
                </div>

                {error && (
                  <Alert variant="danger" dismissible onClose={() => setError('')} className="rounded-3 py-1 px-3 mb-2">
                    <span style={{ ...arabicFontStyle, fontSize: '0.8rem' }}>{error}</span>
                  </Alert>
                )}

                {/* Success - Pending Approval */}
                {registerSuccess && pendingApproval && (
                  <Alert variant="success" className="rounded-3 p-3 mb-3 text-center">
                    <div className="d-flex flex-column align-items-center">
                      <div className="bg-success bg-opacity-10 rounded-circle p-3 mb-2">
                        <FaCheckCircle size={40} className="text-success" />
                      </div>
                      <h6 className="fw-bold" style={arabicFontStyle}>
                        {isArabic ? 'تم تسجيل حسابك بنجاح! 🎉' : 'Account Registered Successfully! 🎉'}
                      </h6>
                      <p className="text-muted small mb-0" style={arabicFontStyle}>
                        {isArabic 
                          ? 'سيتم مراجعة طلبك من قبل الإدارة. سيتم إشعارك عند الموافقة على حسابك.' 
                          : 'Your account is pending admin approval. You will be notified once your account is approved.'}
                      </p>
                      <div className="d-flex align-items-center gap-2 mt-2 text-warning small">
                        <FaClock size={14} />
                        <span style={arabicFontStyle}>
                          {isArabic ? 'وقت المعالجة المتوقع: ٢٤-٤٨ ساعة' : 'Expected processing time: 24-48 hours'}
                        </span>
                      </div>
                      <Link to="/login" className="text-decoration-none mt-2">
                        <Button variant="outline-primary" size="sm" style={{ borderRadius: '50px' }}>
                          {isArabic ? 'العودة إلى تسجيل الدخول' : 'Back to Login'}
                        </Button>
                      </Link>
                    </div>
                  </Alert>
                )}

                {!registerSuccess && (
                  <Form onSubmit={handleSubmit(onSubmit)}>
                    {/* Personal Information */}
                    <div className="mb-2">
                      <h6 className="fw-bold small text-primary" style={arabicFontStyle}>
                        <FaUser className="me-2" /> {isArabic ? 'المعلومات الشخصية' : 'Personal Information'}
                      </h6>
                    </div>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label className="fw-semibold small" style={{ ...arabicFontStyle, fontSize: '0.75rem' }}>
                            {isArabic ? 'الاسم الأول' : 'First Name'} *
                          </Form.Label>
                          <Form.Control
                            {...register('firstName')}
                            isInvalid={!!errors.firstName}
                            placeholder={isArabic ? 'أدخل الاسم الأول' : 'Enter first name'}
                            className="register-input"
                            style={{ 
                              fontSize: '0.85rem',
                              fontFamily: isArabic ? 'Vazirmatn, "Noto Sans Arabic", serif' : 'inherit',
                              borderRadius: '10px',
                              border: '2px solid #e9ecef',
                              padding: '6px 14px',
                              height: '38px',
                            }}
                          />
                          {errors.firstName && (
                            <Form.Text className="text-danger small" style={{ ...arabicFontStyle, fontSize: '0.7rem' }}>
                              {errors.firstName.message}
                            </Form.Text>
                          )}
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label className="fw-semibold small" style={{ ...arabicFontStyle, fontSize: '0.75rem' }}>
                            {isArabic ? 'الاسم الأخير' : 'Last Name'} *
                          </Form.Label>
                          <Form.Control
                            {...register('lastName')}
                            isInvalid={!!errors.lastName}
                            placeholder={isArabic ? 'أدخل الاسم الأخير' : 'Enter last name'}
                            className="register-input"
                            style={{ 
                              fontSize: '0.85rem',
                              fontFamily: isArabic ? 'Vazirmatn, "Noto Sans Arabic", serif' : 'inherit',
                              borderRadius: '10px',
                              border: '2px solid #e9ecef',
                              padding: '6px 14px',
                              height: '38px',
                            }}
                          />
                          {errors.lastName && (
                            <Form.Text className="text-danger small" style={{ ...arabicFontStyle, fontSize: '0.7rem' }}>
                              {errors.lastName.message}
                            </Form.Text>
                          )}
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label className="fw-semibold small" style={{ ...arabicFontStyle, fontSize: '0.75rem' }}>
                            {isArabic ? 'البريد الإلكتروني' : 'Email'} *
                          </Form.Label>
                          <InputGroup className="register-input-group">
                            <InputGroup.Text className="register-input-icon">
                              <FaEnvelope className="text-muted" size={13} />
                            </InputGroup.Text>
                            <Form.Control
                              type="email"
                              {...register('email')}
                              isInvalid={!!errors.email}
                              placeholder={isArabic ? 'أدخل البريد الإلكتروني' : 'Enter email'}
                              className="register-input"
                              style={{ 
                                fontSize: '0.85rem',
                                fontFamily: isArabic ? 'Vazirmatn, "Noto Sans Arabic", serif' : 'inherit',
                                border: 'none',
                                padding: '6px 0',
                                height: '38px',
                              }}
                            />
                          </InputGroup>
                          {errors.email && (
                            <Form.Text className="text-danger small" style={{ ...arabicFontStyle, fontSize: '0.7rem' }}>
                              {errors.email.message}
                            </Form.Text>
                          )}
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label className="fw-semibold small" style={{ ...arabicFontStyle, fontSize: '0.75rem' }}>
                            {isArabic ? 'رقم الهاتف' : 'Phone'} *
                          </Form.Label>
                          <InputGroup className="register-input-group">
                            <InputGroup.Text className="register-input-icon">
                              <FaPhone className="text-muted" size={13} />
                            </InputGroup.Text>
                            <Form.Control
                              {...register('phone')}
                              isInvalid={!!errors.phone}
                              placeholder={isArabic ? 'أدخل رقم الهاتف' : 'Enter phone number'}
                              className="register-input"
                              style={{ 
                                fontSize: '0.85rem',
                                fontFamily: isArabic ? 'Vazirmatn, "Noto Sans Arabic", serif' : 'inherit',
                                border: 'none',
                                padding: '6px 0',
                                height: '38px',
                              }}
                            />
                          </InputGroup>
                          {errors.phone && (
                            <Form.Text className="text-danger small" style={{ ...arabicFontStyle, fontSize: '0.7rem' }}>
                              {errors.phone.message}
                            </Form.Text>
                          )}
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-2">
                      <Form.Label className="fw-semibold small" style={{ ...arabicFontStyle, fontSize: '0.75rem' }}>
                        {isArabic ? 'العنوان' : 'Address'} *
                      </Form.Label>
                      <InputGroup className="register-input-group">
                        <InputGroup.Text className="register-input-icon">
                          <FaMapMarkerAlt className="text-muted" size={13} />
                        </InputGroup.Text>
                        <Form.Control
                          {...register('address')}
                          isInvalid={!!errors.address}
                          placeholder={isArabic ? 'أدخل العنوان' : 'Enter address'}
                          className="register-input"
                          style={{ 
                            fontSize: '0.85rem',
                            fontFamily: isArabic ? 'Vazirmatn, "Noto Sans Arabic", serif' : 'inherit',
                            border: 'none',
                            padding: '6px 0',
                            height: '38px',
                          }}
                        />
                      </InputGroup>
                      {errors.address && (
                        <Form.Text className="text-danger small" style={{ ...arabicFontStyle, fontSize: '0.7rem' }}>
                          {errors.address.message}
                        </Form.Text>
                      )}
                    </Form.Group>

                    <hr className="my-2 opacity-25" />

                    {/* Role Selection */}
                    <div className="mb-2">
                      <h6 className="fw-bold small text-primary" style={arabicFontStyle}>
                        <FaUserTie className="me-2" /> {isArabic ? 'اختر دورك' : 'Select Your Role'}
                      </h6>
                    </div>

                    <Form.Group className="mb-2">
                      <div className="d-flex flex-wrap gap-2">
                        {roleOptions.map((role) => (
                          <div
                            key={role.value}
                            className={`role-option ${selectedRole === role.value ? 'active' : ''}`}
                            style={{
                              flex: 1,
                              minWidth: '100px',
                              padding: '10px 14px',
                              borderRadius: '12px',
                              border: `2px solid ${selectedRole === role.value ? role.color : '#e9ecef'}`,
                              background: selectedRole === role.value ? role.bg : 'white',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              textAlign: 'center',
                            }}
                            onClick={() => {
                              const event = { target: { value: role.value } };
                              register('role').onChange(event);
                              setSelectedRole(role.value);
                            }}
                            onMouseEnter={(e) => {
                              if (selectedRole !== role.value) {
                                e.currentTarget.style.borderColor = role.color;
                                e.currentTarget.style.background = `${role.color}05`;
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (selectedRole !== role.value) {
                                e.currentTarget.style.borderColor = '#e9ecef';
                                e.currentTarget.style.background = 'white';
                              }
                            }}
                          >
                            <div className="role-icon mb-1" style={{ color: role.color, fontSize: '1.3rem' }}>
                              {role.icon}
                            </div>
                            <div className="role-label fw-semibold small" style={{ ...arabicFontStyle, fontSize: '0.7rem' }}>
                              {role.label}
                            </div>
                            <div className="role-desc text-muted small" style={{ ...arabicFontStyle, fontSize: '0.55rem' }}>
                              {role.desc}
                            </div>
                          </div>
                        ))}
                      </div>
                      <input type="hidden" {...register('role')} value={selectedRole} />
                      {errors.role && (
                        <Form.Text className="text-danger small" style={{ ...arabicFontStyle, fontSize: '0.7rem' }}>
                          {errors.role.message}
                        </Form.Text>
                      )}
                    </Form.Group>

                    {/* Student Specific Fields */}
                    {selectedRole === 'student' && (
                      <>
                        <hr className="my-2 opacity-25" />
                        <h6 className="fw-bold small text-primary" style={arabicFontStyle}>
                          <FaGraduationCap className="me-2" /> {isArabic ? 'معلومات الطالب' : 'Student Information'}
                        </h6>
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-2">
                              <Form.Label className="fw-semibold small" style={{ ...arabicFontStyle, fontSize: '0.75rem' }}>
                                {isArabic ? 'البرنامج' : 'Program'} *
                              </Form.Label>
                              <Form.Select
                                {...register('program')}
                                isInvalid={!!errors.program}
                                className="register-select"
                                style={{
                                  fontSize: '0.85rem',
                                  fontFamily: isArabic ? 'Vazirmatn, "Noto Sans Arabic", serif' : 'inherit',
                                  borderRadius: '10px',
                                  border: '2px solid #e9ecef',
                                  padding: '6px 12px',
                                  height: '38px',
                                }}
                              >
                                <option value="">{isArabic ? 'اختر البرنامج' : 'Select Program'}</option>
                                <option value="kindergarden">{isArabic ? 'أولي' : 'Kindergarden'}</option>
                                <option value="primary">{isArabic ? 'ابتدائي' : 'Primary'}</option>
                                <option value="secondary">{isArabic ? 'إعدادي' : 'Secondary'}</option>
                                <option value="high_school">{isArabic ? 'ثانوي' : 'High School'}</option>
                              </Form.Select>
                              {errors.program && (
                                <Form.Text className="text-danger small" style={{ ...arabicFontStyle, fontSize: '0.7rem' }}>
                                  {errors.program.message}
                                </Form.Text>
                              )}
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-2">
                              <Form.Label className="fw-semibold small" style={{ ...arabicFontStyle, fontSize: '0.75rem' }}>
                                {isArabic ? 'المرحلة' : 'Grade'} *
                              </Form.Label>
                              <Form.Select
                                {...register('grade')}
                                isInvalid={!!errors.grade}
                                className="register-select"
                                style={{
                                  fontSize: '0.85rem',
                                  fontFamily: isArabic ? 'Vazirmatn, "Noto Sans Arabic", serif' : 'inherit',
                                  borderRadius: '10px',
                                  border: '2px solid #e9ecef',
                                  padding: '6px 12px',
                                  height: '38px',
                                }}
                              >
                                <option value="">{isArabic ? 'اختر المرحلة' : 'Select Grade'}</option>
                                <option value="Kindergarden">{isArabic ? 'أولي' : 'Kindergarden'}</option>
                                <option value="Primary 1">Primary 1</option>
                                <option value="Primary 2">Primary 2</option>
                                <option value="Primary 3">Primary 3</option>
                                <option value="Primary 4">Primary 4</option>
                                <option value="Primary 5">Primary 5</option>
                                <option value="Primary 6">Primary 6</option>
                                <option value="Secondary 1">Secondary 1</option>
                                <option value="Secondary 2">Secondary 2</option>
                                <option value="Secondary 3">Secondary 3</option>
                                <option value="Secondary 4">Secondary 4</option>
                                <option value="Secondary 5">Secondary 5</option>
                                <option value="Secondary 6">Secondary 6</option>
                              </Form.Select>
                              {errors.grade && (
                                <Form.Text className="text-danger small" style={{ ...arabicFontStyle, fontSize: '0.7rem' }}>
                                  {errors.grade.message}
                                </Form.Text>
                              )}
                            </Form.Group>
                          </Col>
                        </Row>
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-2">
                              <Form.Label className="fw-semibold small" style={{ ...arabicFontStyle, fontSize: '0.75rem' }}>
                                {isArabic ? 'اسم ولي الأمر' : 'Parent Name'} *
                              </Form.Label>
                              <Form.Control
                                {...register('parentName')}
                                isInvalid={!!errors.parentName}
                                placeholder={isArabic ? 'أدخل اسم ولي الأمر' : 'Enter parent name'}
                                className="register-input"
                                style={{ 
                                  fontSize: '0.85rem',
                                  fontFamily: isArabic ? 'Vazirmatn, "Noto Sans Arabic", serif' : 'inherit',
                                  borderRadius: '10px',
                                  border: '2px solid #e9ecef',
                                  padding: '6px 14px',
                                  height: '38px',
                                }}
                              />
                              {errors.parentName && (
                                <Form.Text className="text-danger small" style={{ ...arabicFontStyle, fontSize: '0.7rem' }}>
                                  {errors.parentName.message}
                                </Form.Text>
                              )}
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-2">
                              <Form.Label className="fw-semibold small" style={{ ...arabicFontStyle, fontSize: '0.75rem' }}>
                                {isArabic ? 'هاتف ولي الأمر' : 'Parent Phone'} *
                              </Form.Label>
                              <Form.Control
                                {...register('parentPhone')}
                                isInvalid={!!errors.parentPhone}
                                placeholder={isArabic ? 'أدخل هاتف ولي الأمر' : 'Enter parent phone'}
                                className="register-input"
                                style={{ 
                                  fontSize: '0.85rem',
                                  fontFamily: isArabic ? 'Vazirmatn, "Noto Sans Arabic", serif' : 'inherit',
                                  borderRadius: '10px',
                                  border: '2px solid #e9ecef',
                                  padding: '6px 14px',
                                  height: '38px',
                                }}
                              />
                              {errors.parentPhone && (
                                <Form.Text className="text-danger small" style={{ ...arabicFontStyle, fontSize: '0.7rem' }}>
                                  {errors.parentPhone.message}
                                </Form.Text>
                              )}
                            </Form.Group>
                          </Col>
                        </Row>
                        <Form.Group className="mb-2">
                          <Form.Label className="fw-semibold small" style={{ ...arabicFontStyle, fontSize: '0.75rem' }}>
                            {isArabic ? 'بريد ولي الأمر' : 'Parent Email'} *
                          </Form.Label>
                          <Form.Control
                            type="email"
                            {...register('parentEmail')}
                            isInvalid={!!errors.parentEmail}
                            placeholder={isArabic ? 'أدخل بريد ولي الأمر' : 'Enter parent email'}
                            className="register-input"
                            style={{ 
                              fontSize: '0.85rem',
                              fontFamily: isArabic ? 'Vazirmatn, "Noto Sans Arabic", serif' : 'inherit',
                              borderRadius: '10px',
                              border: '2px solid #e9ecef',
                              padding: '6px 14px',
                              height: '38px',
                            }}
                          />
                          {errors.parentEmail && (
                            <Form.Text className="text-danger small" style={{ ...arabicFontStyle, fontSize: '0.7rem' }}>
                              {errors.parentEmail.message}
                            </Form.Text>
                          )}
                        </Form.Group>
                      </>
                    )}

                    {/* Teacher Specific Fields */}
                    {selectedRole === 'teacher' && (
                      <>
                        <hr className="my-2 opacity-25" />
                        <h6 className="fw-bold small text-primary" style={arabicFontStyle}>
                          <FaChalkboardTeacher className="me-2" /> {isArabic ? 'معلومات المعلم' : 'Teacher Information'}
                        </h6>
                        <Form.Group className="mb-2">
                          <Form.Label className="fw-semibold small" style={{ ...arabicFontStyle, fontSize: '0.75rem' }}>
                            {isArabic ? 'المؤهل' : 'Qualification'} *
                          </Form.Label>
                          <Form.Control
                            {...register('qualification')}
                            isInvalid={!!errors.qualification}
                            placeholder={isArabic ? 'أدخل المؤهل العلمي' : 'Enter qualification'}
                            className="register-input"
                            style={{ 
                              fontSize: '0.85rem',
                              fontFamily: isArabic ? 'Vazirmatn, "Noto Sans Arabic", serif' : 'inherit',
                              borderRadius: '10px',
                              border: '2px solid #e9ecef',
                              padding: '6px 14px',
                              height: '38px',
                            }}
                          />
                          {errors.qualification && (
                            <Form.Text className="text-danger small" style={{ ...arabicFontStyle, fontSize: '0.7rem' }}>
                              {errors.qualification.message}
                            </Form.Text>
                          )}
                        </Form.Group>
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-2">
                              <Form.Label className="fw-semibold small" style={{ ...arabicFontStyle, fontSize: '0.75rem' }}>
                                {isArabic ? 'التخصص' : 'Specialization'} *
                              </Form.Label>
                              <Form.Control
                                {...register('subjectSpecialization')}
                                isInvalid={!!errors.subjectSpecialization}
                                placeholder={isArabic ? 'أدخل التخصص' : 'Enter specialization'}
                                className="register-input"
                                style={{ 
                                  fontSize: '0.85rem',
                                  fontFamily: isArabic ? 'Vazirmatn, "Noto Sans Arabic", serif' : 'inherit',
                                  borderRadius: '10px',
                                  border: '2px solid #e9ecef',
                                  padding: '6px 14px',
                                  height: '38px',
                                }}
                              />
                              {errors.subjectSpecialization && (
                                <Form.Text className="text-danger small" style={{ ...arabicFontStyle, fontSize: '0.7rem' }}>
                                  {errors.subjectSpecialization.message}
                                </Form.Text>
                              )}
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-2">
                              <Form.Label className="fw-semibold small" style={{ ...arabicFontStyle, fontSize: '0.75rem' }}>
                                {isArabic ? 'سنوات الخبرة' : 'Experience (years)'} *
                              </Form.Label>
                              <Form.Control
                                type="number"
                                {...register('experience')}
                                isInvalid={!!errors.experience}
                                placeholder={isArabic ? 'عدد السنوات' : 'Years of experience'}
                                className="register-input"
                                style={{ 
                                  fontSize: '0.85rem',
                                  fontFamily: isArabic ? 'Vazirmatn, "Noto Sans Arabic", serif' : 'inherit',
                                  borderRadius: '10px',
                                  border: '2px solid #e9ecef',
                                  padding: '6px 14px',
                                  height: '38px',
                                }}
                              />
                              {errors.experience && (
                                <Form.Text className="text-danger small" style={{ ...arabicFontStyle, fontSize: '0.7rem' }}>
                                  {errors.experience.message}
                                </Form.Text>
                              )}
                            </Form.Group>
                          </Col>
                        </Row>
                      </>
                    )}

                    <hr className="my-2 opacity-25" />

                    {/* Account Credentials */}
                    <h6 className="fw-bold small text-primary" style={arabicFontStyle}>
                      <FaLock className="me-2" /> {isArabic ? 'بيانات الحساب' : 'Account Credentials'}
                    </h6>

                    <Form.Group className="mb-2">
                      <Form.Label className="fw-semibold small" style={{ ...arabicFontStyle, fontSize: '0.75rem' }}>
                        {isArabic ? 'كلمة المرور' : 'Password'} *
                      </Form.Label>
                      <InputGroup className="register-input-group">
                        <InputGroup.Text className="register-input-icon">
                          <FaLock className="text-muted" size={13} />
                        </InputGroup.Text>
                        <Form.Control
                          type={showPassword ? 'text' : 'password'}
                          {...register('password')}
                          isInvalid={!!errors.password}
                          placeholder={isArabic ? 'أدخل كلمة المرور' : 'Enter password'}
                          className="register-input"
                          style={{ 
                            fontSize: '0.85rem',
                            fontFamily: isArabic ? 'Vazirmatn, "Noto Sans Arabic", serif' : 'inherit',
                            border: 'none',
                            padding: '6px 0',
                            height: '38px',
                          }}
                        />
                        <Button
                          variant="link"
                          className="register-password-toggle"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{ padding: '0 12px' }}
                        >
                          {showPassword ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                        </Button>
                      </InputGroup>
                      {errors.password && (
                        <Form.Text className="text-danger small" style={{ ...arabicFontStyle, fontSize: '0.7rem' }}>
                          {errors.password.message}
                        </Form.Text>
                      )}
                    </Form.Group>

                    <Form.Group className="mb-2">
                      <Form.Label className="fw-semibold small" style={{ ...arabicFontStyle, fontSize: '0.75rem' }}>
                        {isArabic ? 'تأكيد كلمة المرور' : 'Confirm Password'} *
                      </Form.Label>
                      <InputGroup className="register-input-group">
                        <InputGroup.Text className="register-input-icon">
                          <FaLock className="text-muted" size={13} />
                        </InputGroup.Text>
                        <Form.Control
                          type={showConfirmPassword ? 'text' : 'password'}
                          {...register('confirmPassword')}
                          isInvalid={!!errors.confirmPassword}
                          placeholder={isArabic ? 'أعد كتابة كلمة المرور' : 'Confirm password'}
                          className="register-input"
                          style={{ 
                            fontSize: '0.85rem',
                            fontFamily: isArabic ? 'Vazirmatn, "Noto Sans Arabic", serif' : 'inherit',
                            border: 'none',
                            padding: '6px 0',
                            height: '38px',
                          }}
                        />
                        <Button
                          variant="link"
                          className="register-password-toggle"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          style={{ padding: '0 12px' }}
                        >
                          {showConfirmPassword ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                        </Button>
                      </InputGroup>
                      {errors.confirmPassword && (
                        <Form.Text className="text-danger small" style={{ ...arabicFontStyle, fontSize: '0.7rem' }}>
                          {errors.confirmPassword.message}
                        </Form.Text>
                      )}
                    </Form.Group>

                    {/* Info Alert for Parent Registration */}
                    {selectedRole === 'parent' && (
                      <Alert variant="info" className="rounded-3 py-1 px-3 mb-2">
                        <div className="d-flex align-items-start gap-2">
                          <FaShieldAlt className="text-info mt-1" size={14} />
                          <span className="small" style={{ ...arabicFontStyle, fontSize: '0.7rem' }}>
                            {isArabic 
                              ? 'سيتم مراجعة حسابك من قبل الإدارة قبل التفعيل. سيتم إشعارك عند الموافقة.' 
                              : 'Your account will be reviewed by the admin before activation. You will be notified upon approval.'}
                          </span>
                        </div>
                      </Alert>
                    )}

                    <Button
                      variant="primary"
                      type="submit"
                      className="w-100 py-2 register-submit-btn"
                      disabled={loading}
                      style={{ 
                        borderRadius: '50px', 
                        fontWeight: '600', 
                        fontSize: '0.85rem',
                        fontFamily: isArabic ? 'Vazirmatn, "Noto Sans Arabic", serif' : 'inherit',
                        marginTop: '4px',
                      }}
                    >
                      {loading ? (
                        <><Spinner animation="border" size="sm" className="me-2" /> {isArabic ? 'جاري التسجيل...' : 'Registering...'}</>
                      ) : (
                        <>{isArabic ? 'إنشاء حساب' : 'Create Account'} <FaArrowRight className="ms-2" size={12} /></>
                      )}
                    </Button>
                  </Form>
                )}

                {/* Login Link */}
                <div className="text-center mt-2">
                  <p className="text-muted small" style={{ ...arabicFontStyle, fontSize: '0.75rem' }}>
                    {isArabic ? "لديك حساب بالفعل؟" : "Already have an account?"}{' '}
                    <Link to="/login" className="text-decoration-none fw-semibold signup-link">
                      {isArabic ? 'تسجيل دخول' : 'Login'}
                    </Link>
                  </p>
                </div>
              </Card.Body>
            </Card>

            {/* Footer */}
            <div className="text-center mt-2">
              <small className="text-muted opacity-50" style={{ ...arabicFontStyle, fontSize: '0.6rem' }}>
                {isArabic ? '© ٢٠٢٦ مدرسة الفتح. جميع الحقوق محفوظة.' : '© 2026 Madrassat Al Fath. All rights reserved.'}
              </small>
            </div>
          </Col>
        </Row>
      </Container>

      <style>{`
        .register-page {
          min-height: 100vh;
          position: relative;
          background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
          overflow: hidden;
          display: flex;
          align-items: center;
          padding: 20px 0;
        }

        .register-bg-pattern {
          position: absolute;
          top: -50%;
          right: -20%;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(26, 95, 122, 0.05) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
          animation: float-bg 20s ease-in-out infinite;
        }
        .register-bg-pattern::before {
          content: '';
          position: absolute;
          bottom: -30%;
          left: -20%;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(196, 154, 108, 0.04) 0%, transparent 70%);
          border-radius: 50%;
          animation: float-bg 15s ease-in-out infinite reverse;
        }

        @keyframes float-bg {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-20px, 30px); }
        }

        .register-card {
          border-radius: 20px !important;
          overflow: hidden;
          background: white !important;
          border: none !important;
          box-shadow: 0 15px 50px rgba(0,0,0,0.08), 0 6px 25px rgba(0,0,0,0.04) !important;
        }

        .register-card-header {
          background: linear-gradient(135deg, #031c2f 0%, #1a5f7a 100%);
          padding: 12px 20px 10px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .register-card-header::after {
          content: '';
          position: absolute;
          top: -50%;
          right: -20%;
          width: 150px;
          height: 150px;
          background: rgba(255,255,255,0.03);
          border-radius: 50%;
        }
        .register-card-header::before {
          content: '';
          position: absolute;
          bottom: -40%;
          left: -10%;
          width: 120px;
          height: 120px;
          background: rgba(255,255,255,0.02);
          border-radius: 50%;
        }

        .register-card-header-content {
          position: relative;
          z-index: 1;
        }

        .register-logo-wrapper {
          display: inline-block;
          position: relative;
          margin-bottom: 2px;
        }

        .logo-container {
          position: relative;
          display: inline-block;
        }

        .logo-ring {
          position: absolute;
          top: -3px;
          left: -3px;
          right: -3px;
          bottom: -3px;
          border-radius: 50%;
          border: 2px solid transparent;
          background: linear-gradient(135deg, #d4a373, #f0d5a8, #d4a373) border-box;
          -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          animation: spin 6s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .register-input-group {
          border-radius: 10px !important;
          overflow: hidden;
          border: 2px solid #e9ecef;
          transition: all 0.3s ease;
          background: white;
        }
        .register-input-group:focus-within {
          border-color: #1a5f7a;
          box-shadow: 0 0 0 3px rgba(26, 95, 122, 0.06);
        }
        .register-input-icon {
          background: white !important;
          border: none !important;
          padding: 0 12px !important;
        }
        .register-input {
          border: none !important;
          padding: 6px 0 !important;
          background: white !important;
          font-size: 0.85rem !important;
          height: 38px !important;
        }
        .register-input:focus {
          box-shadow: none !important;
        }
        .register-input::placeholder {
          color: #adb5bd;
          font-size: 0.8rem;
        }

        .register-select {
          font-size: 0.85rem !important;
          height: 38px !important;
          border-radius: 10px !important;
          border: 2px solid #e9ecef !important;
          padding: 6px 12px !important;
          background-color: white !important;
          transition: all 0.3s ease !important;
        }
        .register-select:focus {
          border-color: #1a5f7a !important;
          box-shadow: 0 0 0 3px rgba(26, 95, 122, 0.06) !important;
        }

        .register-password-toggle {
          color: #6c757d;
          padding: 0 12px !important;
          border: none !important;
          background: white !important;
          text-decoration: none !important;
          border-radius: 0 !important;
          height: 38px !important;
          display: flex;
          align-items: center;
        }
        .register-password-toggle:hover {
          color: #1a5f7a;
        }

        .register-submit-btn {
          transition: all 0.3s ease;
          height: 40px !important;
        }
        .register-submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 25px rgba(26, 95, 122, 0.2);
        }
        .register-submit-btn:disabled {
          transform: none !important;
        }

        .role-option {
          transition: all 0.3s ease;
          user-select: none;
        }
        .role-option.active {
          transform: scale(1.03);
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }
        .role-option .role-icon {
          transition: transform 0.3s ease;
        }
        .role-option.active .role-icon {
          transform: scale(1.15);
        }
        .role-option:hover .role-icon {
          transform: scale(1.1);
        }

        .signup-link {
          color: #1a5f7a;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        .signup-link:hover {
          color: #0d3b4f;
          text-decoration: underline !important;
        }

        .back-home-btn {
          position: fixed;
          top: 20px;
          z-index: 1000;
          color: #1a5f7a !important;
          text-decoration: none !important;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          font-weight: 500;
          background: rgba(255,255,255,0.9);
          backdrop-filter: blur(10px);
          padding: 8px 16px;
          border-radius: 50px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
          transition: all 0.3s ease !important;
          border: 1px solid rgba(255,255,255,0.3) !important;
        }
        .back-home-btn:hover {
          transform: translateX(-5px) scale(1.02);
          box-shadow: 0 6px 30px rgba(26, 95, 122, 0.1);
          background: rgba(255,255,255,1);
        }
        .back-home-btn .back-short-text {
          display: none;
        }
        .back-home-btn .back-icon {
          transition: transform 0.3s ease;
        }
        .back-home-btn:hover .back-icon {
          transform: rotate(-10deg);
        }
        .register-page.rtl .back-home-btn {
          right: 20px !important;
          left: auto !important;
        }
        .register-page.rtl .back-home-btn:hover {
          transform: translateX(5px) scale(1.02) !important;
        }

        @media (max-width: 768px) {
          .register-card .p-xl-4 {
            padding: 20px !important;
          }
          .register-card-header {
            padding: 10px 16px 8px;
          }
          .register-card-header h5 {
            font-size: 0.85rem !important;
          }
          .register-card-header .register-logo-img {
            width: 45px !important;
            height: 45px !important;
          }
          .back-home-btn {
            top: 12px !important;
            padding: 6px 12px !important;
            font-size: 0.75rem !important;
          }
          .back-home-btn .back-text {
            display: none;
          }
          .back-home-btn .back-short-text {
            display: inline;
          }
          .back-home-btn .back-icon {
            display: none;
          }
          .role-option {
            min-width: 80px !important;
            padding: 8px 10px !important;
          }
          .role-option .role-icon {
            font-size: 1.1rem !important;
          }
          .role-option .role-label {
            font-size: 0.65rem !important;
          }
          .role-option .role-desc {
            display: none;
          }
        }

        @media (max-width: 576px) {
          .register-card .p-4 {
            padding: 16px !important;
          }
          .register-input {
            font-size: 0.8rem !important;
            height: 34px !important;
          }
          .register-input-group {
            border-radius: 8px !important;
          }
          .register-submit-btn {
            height: 36px !important;
            font-size: 0.8rem !important;
          }
          .register-card-header .register-logo-img {
            width: 40px !important;
            height: 40px !important;
          }
          .register-card-header h5 {
            font-size: 0.75rem !important;
          }
          .register-card-header p {
            font-size: 0.5rem !important;
          }
          .back-home-btn {
            padding: 4px 10px !important;
            font-size: 0.65rem !important;
          }
          .role-option {
            min-width: 60px !important;
            padding: 6px 8px !important;
          }
          .role-option .role-icon {
            font-size: 0.9rem !important;
          }
          .role-option .role-label {
            font-size: 0.55rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Register;