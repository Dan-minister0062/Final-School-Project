// src/components/public/Admissions.jsx
import React, { useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Spinner,
  Badge,
  ProgressBar,
  InputGroup,
  Modal,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaChild,
  FaFileUpload,
  FaCheckCircle,
  FaLock,
  FaUserPlus,
  FaSchool,
  FaHeart,
  FaArrowRight,
  FaStar,
  FaRocket,
  FaShieldAlt,
  FaClock,
  FaUsers,
  FaGraduationCap,
  FaAward,
  FaBookOpen,
  FaClipboardCheck,
  FaChevronRight,
  FaHandsHelping,
  FaChartLine,
  FaComments,
  FaBell,
  FaBus,
  FaBuilding,
  FaLeaf,
  FaUserTie,
  FaMicroscope,
  FaLaptop,
  FaBasketballBall,
  FaBookReader,
  FaQuran,
  FaGift,
  FaThumbsUp,
  FaHeadset,
  FaChalkboardTeacher,
  FaBook,
  FaGlobe,
  FaHandshake,
  FaUserGraduate,
  FaLock as FaLockIcon,
  FaEye,
  FaEyeSlash,
  FaInfoCircle,
  FaExclamationTriangle,
  FaIdCard,
  FaMapMarkerAlt,
  FaFlag,
  FaBirthdayCake,
  FaVenusMars,
  FaGlobeAmericas,
} from "react-icons/fa";
import { useLanguage } from "../../context/LanguageContext";
import { getTranslation } from "../../utils/translations";
import { useNotification } from "../../hooks/useNotification";
import logo from "../../assets/images/school logo.jpeg";

// ===== ALWAYS use English numbers - NO Arabic numeral conversion =====
const formatNumber = (num) => num.toString();

// ===== Class options per education level =====
const classOptions = {
  kindergarden: [
    'Introductory',
    'Preparatory 1 -A-',
    'Preparatory 1 -B-',
    'Preparatory 2 -A-',
    'Preparatory 2 -B-'
  ],
  primary: [
    '1 -A-', '1 -B-',
    '2 -A-', '2 -B-',
    '3 -A-', '3 -B-',
    '4 -A-', '4 -B-',
    '5 -A-', '5 -B-',
    '6 -A-', '6 -B-'
  ],
  secondary: [
    'Secondary 1 -A-',
    'Secondary 1 -B-',
    'Secondary 2 -A-',
    'Secondary 2 -B-',
    'Secondary 3 -A-',
    'Secondary 3 -B-'
  ],
  high_school: [
    'Common Core Science',
    '1st Baccalaureate Experimental Sciences',
    '2nd Baccalaureate Physical Sciences'
  ]
};

// ===== Extended Schema with all fields =====
const admissionSchema = yup.object().shape({
  // Student Information
  firstName: yup.string().required("First name is required"),
  lastName: yup.string().required("Last name is required"),
  dob: yup.string().required("Date of birth is required"),
  placeOfBirth: yup.string(),
  gender: yup.string().required("Gender is required"),
  nationality: yup.string().required("Nationality is required"),
  address: yup.string().required("Address is required"),
  city: yup.string().required("City is required"),
  studentPhoto: yup.mixed(),

  // Admission Information
  academicYear: yup.string().required("Academic year is required"),
  level: yup.string().required("Please select the level"),
  requestedClass: yup.string().required("Requested class is required"),
  admissionType: yup.string().required("Admission type is required"),

  // Parent/Guardian Information
  parentName: yup.string().required("Parent name is required"),
  relationship: yup.string().required("Relationship is required"),
  parentEmail: yup.string().email("Invalid email").required("Email is required"),
  parentPhone: yup.string().required("Phone number is required"),
  parentAddress: yup.string().required("Address is required"),
  cinId: yup.string(),

  // Account creation
  parentPassword: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .matches(
      /^(?=.*[A-Za-z])(?=.*\d)/,
      "Password must contain at least one letter and one number"
    )
    .required("Password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("parentPassword"), null], "Passwords must match")
    .required("Please confirm your password"),

  // Emergency Contact
  emergencyContact: yup.string(),
  emergencyRelationship: yup.string(),
  emergencyPhone: yup.string(),

  // Additional Notes
  additionalNotes: yup.string(),

  // Level-specific fields (conditional)
  previousSchool: yup.string(),
  hasAttendedBefore: yup.boolean(),
  specialAssistance: yup.boolean(),
  authorizedPickup: yup.string(),
  previousGrade: yup.string(),
  lastAcademicYear: yup.string(),
  reportCard: yup.mixed(),
  schoolCertificate: yup.mixed(),
  massarNumber: yup.string(),
  academicTrack: yup.string(),

  // Agreement
  termsAgreed: yup.boolean().oneOf([true], "You must agree to the terms"),
});

const Admissions = () => {
  const { language, isArabic } = useLanguage();
  const t = (key) => getTranslation(key, language);
  const { notify } = useNotification();
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationId, setRegistrationId] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // File state
  const [studentPhotoFile, setStudentPhotoFile] = useState(null);
  const [reportCardFile, setReportCardFile] = useState(null);
  const [schoolCertificateFile, setSchoolCertificateFile] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm({
    resolver: yupResolver(admissionSchema),
    defaultValues: {
      termsAgreed: false,
      hasAttendedBefore: false,
      specialAssistance: false,
    },
  });

  const selectedLevel = watch("level");

  // ===== ARABIC FONT STYLE =====
  const arabicFontStyle = {
    fontFamily: isArabic
      ? '"Hacen Tunisia", "Hacen Tunisia Bd", "Noto Sans Arabic", "Vazirmatn", "Traditional Arabic", "Arabic Typesetting", serif'
      : "inherit",
    lineHeight: isArabic ? "1.8" : "1.6",
    letterSpacing: isArabic ? "0.5px" : "0px",
    fontSize: isArabic
      ? "clamp(0.9rem, 1.1vw, 1.05rem)"
      : "clamp(0.85rem, 1vw, 1rem)",
  };

  // ===== Password strength checker =====
  const getPasswordStrength = (password) => {
    if (!password)
      return { score: 0, label: isArabic ? "ضعيف" : "Weak", color: "#e74c3c" };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const strengths = [
      { score: 0, label: isArabic ? "ضعيف جداً" : "Very Weak", color: "#e74c3c" },
      { score: 1, label: isArabic ? "ضعيف" : "Weak", color: "#e67e22" },
      { score: 2, label: isArabic ? "متوسط" : "Medium", color: "#f39c12" },
      { score: 3, label: isArabic ? "قوي" : "Strong", color: "#2ecc71" },
      { score: 4, label: isArabic ? "قوي جداً" : "Very Strong", color: "#27ae60" },
    ];
    return strengths[score] || strengths[0];
  };

  const password = watch("parentPassword");
  const passwordStrength = getPasswordStrength(password);

  // ===== Generate a unique registration ID =====
  const generateRegistrationId = () => {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `REG/${year}/${random}`;
  };

  // ===== Save registration to localStorage =====
  const saveRegistrationToLocalStorage = (data) => {
    try {
      // Get existing registrations
      const existingRegistrations = JSON.parse(localStorage.getItem('registrations') || '[]');
      
      // Create registration object
      const registration = {
        id: generateRegistrationId(),
        ...data,
        studentName: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
        submittedAt: new Date().toISOString(),
        status: 'pending',
        read: false,
        studentPhoto: data.studentPhoto || null,
        reportCard: data.reportCard || null,
        schoolCertificate: data.schoolCertificate || null,
      };
      
      // Add to array
      existingRegistrations.unshift(registration);
      
      // Save back to localStorage
      localStorage.setItem('registrations', JSON.stringify(existingRegistrations));
      
      console.log('✅ Registration saved to localStorage:', registration);
      return registration;
    } catch (error) {
      console.error('Error saving registration to localStorage:', error);
      return null;
    }
  };

  // ===== Notify admins about a new registration =====
  const dispatchAdminNotification = (data, registration) => {
    try {
      const levelMap = {
        kindergarden: isArabic ? "أولي" : "Kindergarden",
        primary: isArabic ? "ابتدائي" : "Primary",
        secondary: isArabic ? "إعدادي" : "Secondary",
        high_school: isArabic ? "ثانوي" : "High School",
      };
      const levelDisplay = levelMap[data.level] || data.level;
      const studentFullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
      const notificationTitle = isArabic
        ? `📝 تسجيل طالب جديد: ${studentFullName}`
        : `📝 New Student Registration: ${studentFullName}`;
      const notificationMessage = isArabic
        ? `تم تسجيل ${studentFullName} في مستوى ${levelDisplay} بواسطة ${data.parentName || 'ولي الأمر'}`
        : `${studentFullName} registered for ${levelDisplay} by ${data.parentName || 'Parent'}`;

      // Create notification object
      const notification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: notificationTitle,
        message: notificationMessage,
        type: 'registration',
        link: '/dashboard/admin/registrations',
        createdAt: new Date().toISOString(),
        read: false,
        studentName: studentFullName,
        level: data.level,
        levelDisplay: levelDisplay,
        parentName: data.parentName || '',
        email: data.parentEmail || '',
        phone: data.parentPhone || '',
        address: data.parentAddress || '',
        userName: data.parentName || 'Parent',
        registrationId: registration?.id || null,
      };

      // Save to localStorage notifications
      try {
        const savedNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
        savedNotifications.unshift(notification);
        if (savedNotifications.length > 100) {
          savedNotifications.length = 100;
        }
        localStorage.setItem('notifications', JSON.stringify(savedNotifications));
        console.log('✅ Notification saved to localStorage');
      } catch (e) {
        console.error('Error saving notification to localStorage:', e);
      }

      // Dispatch event for real-time updates
      try {
        const event = new CustomEvent('newNotification', {
          detail: notification
        });
        window.dispatchEvent(event);
        console.log('✅ Notification event dispatched');
      } catch (e) {
        console.error('Error dispatching notification event:', e);
      }

      // Also dispatch a storage event for other tabs
      try {
        const storageEvent = new StorageEvent('storage', {
          key: 'notifications',
          newValue: JSON.stringify(JSON.parse(localStorage.getItem('notifications') || '[]')),
        });
        window.dispatchEvent(storageEvent);
      } catch (e) {
        console.error('Error dispatching storage event:', e);
      }

      console.log('✅ Notification dispatched for registration:', notificationTitle);
    } catch (e) {
      console.error('Error sending notification:', e);
    }
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    
    try {
      console.log('📤 Submitting admission data (local-only):', data);

      // Save registration to localStorage
      const registration = saveRegistrationToLocalStorage(data);
      
      if (!registration) {
        throw new Error('Failed to save registration to localStorage');
      }

      console.log("✅ Registration saved successfully:", registration);

      // Set registration ID
      setRegistrationId(registration.id);

      // Dispatch notification to admin
      dispatchAdminNotification(data, registration);

      // Show success message
      notify(
        isArabic
          ? "✅ تم تقديم طلب التسجيل بنجاح!"
          : "✅ Registration request submitted successfully!",
        "success"
      );

      setShowSuccessModal(true);
      setSubmitted(true);
      
      // Reset form
      reset();
      setStudentPhotoFile(null);
      setReportCardFile(null);
      setSchoolCertificateFile(null);
      
    } catch (error) {
      console.error("❌ Submission error:", error);
      
      let msg = isArabic
        ? "حدث خطأ. الرجاء المحاولة مرة أخرى."
        : "Something went wrong. Please try again.";
      
      notify(msg, "error");
      
    } finally {
      setSubmitting(false);
    }
  };

  const getProgress = () => {
    const fields = [
      "firstName",
      "lastName",
      "dob",
      "gender",
      "nationality",
      "address",
      "city",
      "academicYear",
      "level",
      "requestedClass",
      "admissionType",
      "parentName",
      "relationship",
      "parentEmail",
      "parentPhone",
      "parentAddress",
      "parentPassword",
      "confirmPassword",
      "termsAgreed",
    ];
    const filled = fields.filter((f) => {
      const value = watch(f);
      if (f === "termsAgreed") return value === true;
      return value && value.length > 0;
    });
    return Math.round((filled.length / fields.length) * 100);
  };

  // ===== Features =====
  const features = [
    {
      icon: <FaShieldAlt />,
      title: isArabic ? "تسجيل آمن" : "Secure Registration",
      color: "#1a5f7a",
      desc: isArabic ? "بياناتك محمية بالكامل" : "Your data is fully protected",
    },
    {
      icon: <FaClock />,
      title: isArabic ? "تتبع سريع" : "Fast Tracking",
      color: "#2d6a4f",
      desc: isArabic
        ? "تابع حالة طلبك لحظة بلحظة"
        : "Track your application in real-time",
    },
    {
      icon: <FaUsers />,
      title: isArabic ? "دعم متواصل" : "Continuous Support",
      color: "#c49a6c",
      desc: isArabic ? "فريق دعم على مدار الساعة" : "24/7 support team",
    },
    {
      icon: <FaGraduationCap />,
      title: isArabic ? "تعليم متميز" : "Quality Education",
      color: "#d4a373",
      desc: isArabic
        ? "مناهج تعليمية متطورة"
        : "Advanced educational curricula",
    },
  ];

  // ===== Steps =====
  const steps = [
    {
      icon: <FaChild />,
      title: isArabic ? "معلومات الطفل" : "Child Info",
      desc: isArabic ? "أدخل بيانات طفلك" : "Enter child details",
    },
    {
      icon: <FaUserPlus />,
      title: isArabic ? "معلومات ولي الأمر" : "Parent Info",
      desc: isArabic ? "بيانات ولي الأمر" : "Parent details",
    },
    {
      icon: <FaLock />,
      title: isArabic ? "إنشاء حساب" : "Create Account",
      desc: isArabic ? "كلمة مرور آمنة" : "Secure password",
    },
    {
      icon: <FaCheckCircle />,
      title: isArabic ? "تأكيد" : "Confirm",
      desc: isArabic ? "مراجعة وإرسال" : "Review & submit",
    },
  ];

  // ===== Helper to render level-specific fields =====
  const renderLevelSpecificFields = () => {
    if (!selectedLevel) return null;

    switch (selectedLevel) {
      case "kindergarden":
        return (
          <>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={arabicFontStyle}>
                    {isArabic ? "الحضانة/المدرسة السابقة" : "Previous School/Daycare"}
                  </Form.Label>
                  <Form.Control
                    {...register("previousSchool")}
                    placeholder={isArabic ? "أدخل اسم الحضانة" : "Enter daycare name"}
                    className="py-2"
                    style={arabicFontStyle}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={arabicFontStyle}>
                    {isArabic ? "هل التحق الطفل بمدرسة من قبل؟" : "Has the child attended school before?"}
                  </Form.Label>
                  <Form.Select
                    {...register("hasAttendedBefore")}
                    className="py-2"
                    style={arabicFontStyle}
                  >
                    <option value="">{isArabic ? "اختر" : "Select"}</option>
                    <option value="true">{isArabic ? "نعم" : "Yes"}</option>
                    <option value="false">{isArabic ? "لا" : "No"}</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={arabicFontStyle}>
                    {isArabic ? "هل يحتاج الطفل إلى مساعدة خاصة؟" : "Does the child require special assistance?"}
                  </Form.Label>
                  <Form.Select
                    {...register("specialAssistance")}
                    className="py-2"
                    style={arabicFontStyle}
                  >
                    <option value="">{isArabic ? "اختر" : "Select"}</option>
                    <option value="true">{isArabic ? "نعم" : "Yes"}</option>
                    <option value="false">{isArabic ? "لا" : "No"}</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={arabicFontStyle}>
                    {isArabic ? "الشخص المصرح له بالاستلام" : "Authorized person for pickup"}
                  </Form.Label>
                  <Form.Control
                    {...register("authorizedPickup")}
                    placeholder={isArabic ? "أدخل الاسم" : "Enter name"}
                    className="py-2"
                    style={arabicFontStyle}
                  />
                </Form.Group>
              </Col>
            </Row>
          </>
        );

      case "primary":
      case "secondary":
      case "high_school":
        return (
          <>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={arabicFontStyle}>
                    {isArabic ? "المدرسة السابقة" : "Previous School"}
                  </Form.Label>
                  <Form.Control
                    {...register("previousSchool")}
                    placeholder={isArabic ? "أدخل اسم المدرسة" : "Enter school name"}
                    className="py-2"
                    style={arabicFontStyle}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={arabicFontStyle}>
                    {isArabic ? "الصف/المستوى السابق" : "Previous Grade/Class"}
                  </Form.Label>
                  <Form.Control
                    {...register("previousGrade")}
                    placeholder={isArabic ? "أدخل الصف" : "Enter grade"}
                    className="py-2"
                    style={arabicFontStyle}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={arabicFontStyle}>
                    {isArabic ? "السنة الدراسية الأخيرة" : "Last Academic Year"}
                  </Form.Label>
                  <Form.Control
                    {...register("lastAcademicYear")}
                    placeholder={isArabic ? "مثل: 2024-2025" : "e.g., 2024-2025"}
                    className="py-2"
                    style={arabicFontStyle}
                  />
                </Form.Group>
              </Col>
              {(selectedLevel === "secondary" || selectedLevel === "high_school") && (
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label style={arabicFontStyle}>
                      {isArabic ? "رقم مسار (إن وجد)" : "Massar Number (if available)"}
                    </Form.Label>
                    <Form.Control
                      {...register("massarNumber")}
                      placeholder={isArabic ? "أدخل رقم مسار" : "Enter Massar number"}
                      className="py-2"
                      style={arabicFontStyle}
                    />
                  </Form.Group>
                </Col>
              )}
            </Row>
            {selectedLevel === "high_school" && (
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label style={arabicFontStyle}>
                      {isArabic ? "المسار الأكاديمي" : "Academic Track/Stream"}
                    </Form.Label>
                    <Form.Control
                      {...register("academicTrack")}
                      placeholder={isArabic ? "مثل: علوم رياضية" : "e.g., Sciences"}
                      className="py-2"
                      style={arabicFontStyle}
                    />
                  </Form.Group>
                </Col>
              </Row>
            )}
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="admissions-page" dir={isArabic ? "rtl" : "ltr"}>
      {/* Hero Section */}
      <section
        className="py-5"
        style={{
          background: "linear-gradient(135deg, #031c2f 0%, #1a5f7a 100%)",
        }}
      >
        <Container>
          <h1
            className="display-4 fw-bold text-center text-white"
            style={arabicFontStyle}
          >
            {isArabic ? "التسجيل في المدرسة" : "School Enrollment"}
          </h1>
          <p
            className="text-center fs-5 text-white opacity-75"
            style={arabicFontStyle}
          >
            {isArabic
              ? "سجل طفلك اليوم وابدأ رحلته التعليمية معنا"
              : "Enroll your child today and start their educational journey with us"}
          </p>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-4 bg-light">
        <Container>
          <Row className="g-3">
            {features.map((feature, index) => (
              <Col key={index} md={3} sm={6}>
                <Card className="text-center shadow-sm border-0 feature-card h-100">
                  <Card.Body className="p-3">
                    <div
                      className="display-5 mb-2"
                      style={{ color: feature.color }}
                    >
                      {feature.icon}
                    </div>
                    <h6 className="fw-bold" style={arabicFontStyle}>
                      {feature.title}
                    </h6>
                    <small className="text-muted" style={arabicFontStyle}>
                      {feature.desc}
                    </small>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Main Content */}
      <section className="py-5 bg-light">
        <Container>
          <Row className="g-4">
            {/* Left Side - Info & Benefits */}
            <Col lg={4}>
              <div className="position-sticky" style={{ top: "100px" }}>
                {/* Steps Card */}
                <Card
                  className="shadow-lg border-0 mb-4"
                  style={{ borderRadius: "20px", overflow: "hidden" }}
                >
                  <div
                    className="p-4"
                    style={{
                      background:
                        "linear-gradient(135deg, #031c2f 0%, #1a5f7a 100%)",
                    }}
                  >
                    <h5
                      className="text-white fw-bold mb-0"
                      style={arabicFontStyle}
                    >
                      {isArabic ? "خطوات التسجيل" : "Registration Steps"}
                    </h5>
                  </div>
                  <Card.Body className="p-4">
                    {steps.map((step, index) => {
                      const isActive = index === 0;
                      const isCompleted = false;
                      return (
                        <div
                          key={index}
                          className="d-flex align-items-center gap-3 mb-3"
                        >
                          <div
                            className={`step-circle ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: isActive
                                ? "#1a5f7a"
                                : isCompleted
                                  ? "#2ecc71"
                                  : "#e9ecef",
                              color:
                                isActive || isCompleted ? "white" : "#6c757d",
                              fontSize: "1rem",
                              fontWeight: "600",
                              transition: "all 0.3s ease",
                              flexShrink: 0,
                            }}
                          >
                            {isCompleted ? <FaCheckCircle /> : index + 1}
                          </div>
                          <div>
                            <div
                              className="fw-semibold"
                              style={arabicFontStyle}
                            >
                              {step.title}
                            </div>
                            <div
                              className="text-muted small"
                              style={arabicFontStyle}
                            >
                              {step.desc}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </Card.Body>
                </Card>

                {/* Stats Cards */}
                <Card
                  className="shadow-lg border-0"
                  style={{ borderRadius: "20px", overflow: "hidden" }}
                >
                  <div
                    className="p-4"
                    style={{
                      background:
                        "linear-gradient(135deg, #2d6a4f 0%, #40916c 100%)",
                    }}
                  >
                    <h5
                      className="text-white fw-bold mb-0"
                      style={arabicFontStyle}
                    >
                      {isArabic ? "إحصائيات التسجيل" : "Registration Stats"}
                    </h5>
                  </div>
                  <Card.Body className="p-4">
                    <div className="d-flex justify-content-between mb-3">
                      <span style={arabicFontStyle}>
                        {isArabic ? "طلاب مسجلين" : "Students Enrolled"}
                      </span>
                      <span className="fw-bold" style={{ color: "#1a5f7a" }}>
                        520+
                      </span>
                    </div>
                    <div className="d-flex justify-content-between mb-3">
                      <span style={arabicFontStyle}>
                        {isArabic ? "مستويات تعليمية" : "Education Levels"}
                      </span>
                      <span className="fw-bold" style={{ color: "#1a5f7a" }}>
                        4
                      </span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span style={arabicFontStyle}>
                        {isArabic ? "معلمين مؤهلين" : "Qualified Teachers"}
                      </span>
                      <span className="fw-bold" style={{ color: "#1a5f7a" }}>
                        35+
                      </span>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </Col>

            {/* Right Side - Registration Form */}
            <Col lg={8}>
              <Card
                className="shadow-lg border-0"
                style={{ borderRadius: "24px", overflow: "hidden" }}
              >
                {/* Top Gradient Bar */}
                <div
                  style={{
                    height: "5px",
                    background:
                      "linear-gradient(90deg, #1a5f7a, #2d6a4f, #c49a6c, #d4a373)",
                  }}
                ></div>

                <Card.Header
                  className="bg-white border-0 p-4"
                  style={{ borderBottom: "2px solid #f0f0f0" }}
                >
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="rounded-circle p-2"
                      style={{ background: "#1a5f7a15", color: "#1a5f7a" }}
                    >
                      <FaClipboardCheck size={24} />
                    </div>
                    <div className="flex-grow-1">
                      <h4 className="fw-bold mb-0" style={arabicFontStyle}>
                        {isArabic
                          ? "تسجيل طالب جديد"
                          : "New Student Registration"}
                      </h4>
                      <p className="text-muted mb-0" style={arabicFontStyle}>
                        {isArabic
                          ? "املأ النموذج لتقديم طلب التسجيل"
                          : "Fill out the form to submit your registration"}
                      </p>
                    </div>
                    <Badge bg="primary" className="p-2" style={arabicFontStyle}>
                      {isArabic ? "تقدم" : "Progress"} {getProgress()}%
                    </Badge>
                  </div>
                  <ProgressBar
                    now={getProgress()}
                    variant="primary"
                    className="mt-2"
                    style={{ height: "4px", borderRadius: "2px" }}
                  />
                </Card.Header>

                <Card.Body className="p-4">
                  {submitted ? (
                    <Alert
                      variant="success"
                      className="text-center p-5"
                      style={{ borderRadius: "16px" }}
                    >
                      <div className="mb-3">
                        <div className="rounded-circle bg-success bg-opacity-10 d-inline-flex p-4">
                          <FaCheckCircle size={64} className="text-success" />
                        </div>
                      </div>
                      <h4 style={arabicFontStyle}>
                        🎉{" "}
                        {isArabic
                          ? "تم تقديم الطلب بنجاح!"
                          : "Application Submitted Successfully!"}
                      </h4>
                      <p style={arabicFontStyle}>
                        {isArabic
                          ? "سيتم مراجعة طلبك من قبل فريق القبول. سنتواصل معك قريباً."
                          : "Your application will be reviewed by our admissions team. We will contact you soon."}
                      </p>
                      <Button
                        variant="outline-primary"
                        onClick={() => {
                          setSubmitted(false);
                          reset();
                          setStudentPhotoFile(null);
                          setReportCardFile(null);
                          setSchoolCertificateFile(null);
                        }}
                        style={arabicFontStyle}
                      >
                        {isArabic
                          ? "تسجيل طالب آخر"
                          : "Register Another Student"}
                      </Button>
                    </Alert>
                  ) : (
                    <Form onSubmit={handleSubmit(onSubmit)}>
                      {/* ===== SECTION 1: STUDENT INFORMATION ===== */}
                      <div className="section-header mb-4">
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="section-number"
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              background: "#1a5f7a",
                              color: "white",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: "700",
                              fontSize: "0.85rem",
                            }}
                          >
                            1
                          </div>
                          <h5 className="fw-bold mb-0" style={arabicFontStyle}>
                            <FaChild
                              className="me-2"
                              style={{ color: "#1a5f7a" }}
                            />
                            {isArabic ? "معلومات الطفل" : "Student Information"}
                          </h5>
                        </div>
                        <div
                          className="section-divider"
                          style={{
                            height: "2px",
                            background:
                              "linear-gradient(90deg, #1a5f7a, transparent)",
                            flex: 1,
                            marginLeft: "12px",
                          }}
                        ></div>
                      </div>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label style={arabicFontStyle}>
                              {isArabic ? "الاسم الأول" : "First Name"} *
                            </Form.Label>
                            <Form.Control
                              {...register("firstName")}
                              isInvalid={!!errors.firstName}
                              placeholder={isArabic ? "أدخل الاسم الأول" : "Enter first name"}
                              className="py-2"
                              style={arabicFontStyle}
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.firstName?.message}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label style={arabicFontStyle}>
                              {isArabic ? "الاسم الأخير" : "Last Name"} *
                            </Form.Label>
                            <Form.Control
                              {...register("lastName")}
                              isInvalid={!!errors.lastName}
                              placeholder={isArabic ? "أدخل الاسم الأخير" : "Enter last name"}
                              className="py-2"
                              style={arabicFontStyle}
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.lastName?.message}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label style={arabicFontStyle}>
                              {isArabic ? "تاريخ الميلاد" : "Date of Birth"} *
                            </Form.Label>
                            <Form.Control
                              type="date"
                              {...register("dob")}
                              isInvalid={!!errors.dob}
                              className="py-2"
                              style={arabicFontStyle}
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.dob?.message}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label style={arabicFontStyle}>
                              {isArabic ? "مكان الميلاد" : "Place of Birth"}
                            </Form.Label>
                            <Form.Control
                              {...register("placeOfBirth")}
                              placeholder={isArabic ? "أدخل مكان الميلاد" : "Enter place of birth"}
                              className="py-2"
                              style={arabicFontStyle}
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label style={arabicFontStyle}>
                              {isArabic ? "الجنس" : "Gender"} *
                            </Form.Label>
                            <Form.Select
                              {...register("gender")}
                              isInvalid={!!errors.gender}
                              className="py-2"
                              style={arabicFontStyle}
                            >
                              <option value="">{isArabic ? "اختر" : "Select"}</option>
                              <option value="male">{isArabic ? "ذكر" : "Male"}</option>
                              <option value="female">{isArabic ? "أنثى" : "Female"}</option>
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">
                              {errors.gender?.message}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label style={arabicFontStyle}>
                              {isArabic ? "الجنسية" : "Nationality"} *
                            </Form.Label>
                            <Form.Control
                              {...register("nationality")}
                              isInvalid={!!errors.nationality}
                              placeholder={isArabic ? "أدخل الجنسية" : "Enter nationality"}
                              className="py-2"
                              style={arabicFontStyle}
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.nationality?.message}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label style={arabicFontStyle}>
                              {isArabic ? "العنوان" : "Address"} *
                            </Form.Label>
                            <Form.Control
                              {...register("address")}
                              isInvalid={!!errors.address}
                              placeholder={isArabic ? "أدخل العنوان" : "Enter address"}
                              className="py-2"
                              style={arabicFontStyle}
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.address?.message}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label style={arabicFontStyle}>
                              {isArabic ? "المدينة" : "City"} *
                            </Form.Label>
                            <Form.Control
                              {...register("city")}
                              isInvalid={!!errors.city}
                              placeholder={isArabic ? "أدخل المدينة" : "Enter city"}
                              className="py-2"
                              style={arabicFontStyle}
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.city?.message}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={12}>
                          <Form.Group className="mb-3">
                            <Form.Label style={arabicFontStyle}>
                              {isArabic ? "صورة الطالب" : "Student Photo"}
                            </Form.Label>
                            <Form.Control
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                setStudentPhotoFile(file);
                                setValue("studentPhoto", file);
                              }}
                              className="py-2"
                              style={arabicFontStyle}
                            />
                            {studentPhotoFile && (
                              <small className="text-muted" style={arabicFontStyle}>
                                {isArabic ? "تم الرفع: " : "Uploaded: "} {studentPhotoFile.name}
                              </small>
                            )}
                          </Form.Group>
                        </Col>
                      </Row>

                      {/* ===== SECTION 2: ADMISSION INFORMATION ===== */}
                      <div className="section-header mb-4">
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="section-number"
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              background: "#2d6a4f",
                              color: "white",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: "700",
                              fontSize: "0.85rem",
                            }}
                          >
                            2
                          </div>
                          <h5 className="fw-bold mb-0" style={arabicFontStyle}>
                            <FaSchool
                              className="me-2"
                              style={{ color: "#2d6a4f" }}
                            />
                            {isArabic ? "معلومات التسجيل" : "Admission Information"}
                          </h5>
                        </div>
                        <div
                          className="section-divider"
                          style={{
                            height: "2px",
                            background:
                              "linear-gradient(90deg, #2d6a4f, transparent)",
                            flex: 1,
                            marginLeft: "12px",
                          }}
                        ></div>
                      </div>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label style={arabicFontStyle}>
                              {isArabic ? "السنة الدراسية" : "Academic Year"} *
                            </Form.Label>
                            <Form.Control
                              {...register("academicYear")}
                              isInvalid={!!errors.academicYear}
                              placeholder={isArabic ? "مثل: 2025-2026" : "e.g., 2025-2026"}
                              className="py-2"
                              style={arabicFontStyle}
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.academicYear?.message}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label style={arabicFontStyle}>
                              {isArabic ? "المستوى التعليمي" : "Education Level"} *
                            </Form.Label>
                            <Form.Select
                              {...register("level")}
                              isInvalid={!!errors.level}
                              className="py-2"
                              style={{
                                ...arabicFontStyle,
                                paddingRight: isArabic ? "2rem" : "0.75rem",
                              }}
                            >
                              <option value="">
                                {isArabic ? "اختر المستوى" : "Select Level"}
                              </option>
                              <option value="kindergarden">
                                {isArabic ? "أولي" : "Kindergarden"}
                              </option>
                              <option value="primary">
                                {isArabic ? "ابتدائي" : "Primary"}
                              </option>
                              <option value="secondary">
                                {isArabic ? "إعدادي" : "Secondary"}
                              </option>
                              <option value="high_school">
                                {isArabic ? "ثانوي" : "High School"}
                              </option>
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">
                              {errors.level?.message}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label style={arabicFontStyle}>
                              {isArabic ? "الصف/المستوى المطلوب" : "Requested Class/Grade"} *
                            </Form.Label>
                            <Form.Select
                              {...register("requestedClass")}
                              isInvalid={!!errors.requestedClass}
                              className="py-2"
                              style={arabicFontStyle}
                            >
                              <option value="">
                                {selectedLevel
                                  ? (isArabic ? "اختر الصف" : "Select class")
                                  : (isArabic ? "اختر المستوى أولاً" : "Select level first")}
                              </option>
                              {selectedLevel && classOptions[selectedLevel]?.map((cls) => (
                                <option key={cls} value={cls}>{cls}</option>
                              ))}
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">
                              {errors.requestedClass?.message}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label style={arabicFontStyle}>
                              {isArabic ? "نوع التسجيل" : "Admission Type"} *
                            </Form.Label>
                            <Form.Select
                              {...register("admissionType")}
                              isInvalid={!!errors.admissionType}
                              className="py-2"
                              style={arabicFontStyle}
                            >
                              <option value="">{isArabic ? "اختر" : "Select"}</option>
                              <option value="new">{isArabic ? "طالب جديد" : "New Student"}</option>
                              <option value="transfer">{isArabic ? "تحويل" : "Transfer"}</option>
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">
                              {errors.admissionType?.message}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                      </Row>

                      {/* Level-specific fields */}
                      {selectedLevel && (
                        <div
                          className="level-specific-fields p-3 mb-3"
                          style={{
                            backgroundColor: "#f8f9fa",
                            borderRadius: "12px",
                            border: "1px solid #e9ecef",
                          }}
                        >
                          <h6 className="fw-bold mb-3" style={arabicFontStyle}>
                            {isArabic ? "معلومات إضافية حسب المستوى" : "Level-Specific Information"}
                          </h6>
                          {renderLevelSpecificFields()}
                        </div>
                      )}

                      {/* ===== SECTION 3: PARENT/GUARDIAN INFORMATION ===== */}
                      <div className="section-header mb-4">
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="section-number"
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              background: "#c49a6c",
                              color: "white",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: "700",
                              fontSize: "0.85rem",
                            }}
                          >
                            3
                          </div>
                          <h5 className="fw-bold mb-0" style={arabicFontStyle}>
                            <FaUserTie
                              className="me-2"
                              style={{ color: "#c49a6c" }}
                            />
                            {isArabic
                              ? "معلومات ولي الأمر"
                              : "Parent/Guardian Information"}
                          </h5>
                        </div>
                        <div
                          className="section-divider"
                          style={{
                            height: "2px",
                            background:
                              "linear-gradient(90deg, #c49a6c, transparent)",
                            flex: 1,
                            marginLeft: "12px",
                          }}
                        ></div>
                      </div>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label style={arabicFontStyle}>
                              {isArabic ? "الاسم الكامل" : "Full Name"} *
                            </Form.Label>
                            <Form.Control
                              {...register("parentName")}
                              isInvalid={!!errors.parentName}
                              placeholder={isArabic ? "أدخل الاسم الكامل" : "Enter full name"}
                              className="py-2"
                              style={arabicFontStyle}
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.parentName?.message}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label style={arabicFontStyle}>
                              {isArabic ? "العلاقة بالطالب" : "Relationship"} *
                            </Form.Label>
                            <Form.Select
                              {...register("relationship")}
                              isInvalid={!!errors.relationship}
                              className="py-2"
                              style={arabicFontStyle}
                            >
                              <option value="">{isArabic ? "اختر" : "Select"}</option>
                              <option value="father">{isArabic ? "أب" : "Father"}</option>
                              <option value="mother">{isArabic ? "أم" : "Mother"}</option>
                              <option value="sister">{isArabic ? "أخت" : "Sister"}</option>
                              <option value="brother">{isArabic ? "أخ" : "Brother"}</option>
                              <option value="guardian">{isArabic ? "وصي" : "Guardian"}</option>
                              <option value="other">{isArabic ? "أخرى" : "Other"}</option>
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">
                              {errors.relationship?.message}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label style={arabicFontStyle}>
                              {isArabic ? "رقم الهاتف" : "Phone Number"} *
                            </Form.Label>
                            <Form.Control
                              {...register("parentPhone")}
                              isInvalid={!!errors.parentPhone}
                              placeholder={isArabic ? "أدخل رقم الهاتف" : "Enter phone number"}
                              className="py-2"
                              style={arabicFontStyle}
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.parentPhone?.message}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label style={arabicFontStyle}>
                              {isArabic ? "البريد الإلكتروني" : "Email"} *
                            </Form.Label>
                            <Form.Control
                              type="email"
                              {...register("parentEmail")}
                              isInvalid={!!errors.parentEmail}
                              placeholder={isArabic ? "أدخل البريد الإلكتروني" : "Enter email"}
                              className="py-2"
                              style={arabicFontStyle}
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.parentEmail?.message}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label style={arabicFontStyle}>
                              {isArabic ? "العنوان" : "Address"} *
                            </Form.Label>
                            <Form.Control
                              {...register("parentAddress")}
                              isInvalid={!!errors.parentAddress}
                              placeholder={isArabic ? "أدخل العنوان" : "Enter address"}
                              className="py-2"
                              style={arabicFontStyle}
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.parentAddress?.message}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label style={arabicFontStyle}>
                              {isArabic ? "رقم البطاقة الوطنية" : "CIN/ID Number"}
                            </Form.Label>
                            <Form.Control
                              {...register("cinId")}
                              placeholder={isArabic ? "أدخل رقم البطاقة" : "Enter ID number"}
                              className="py-2"
                              style={arabicFontStyle}
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      {/* Account creation fields */}
                      <div
                        className="alert alert-info mb-3"
                        style={{ borderRadius: "12px" }}
                      >
                        <FaInfoCircle className="me-2" />
                        <span style={arabicFontStyle}>
                          {isArabic
                            ? "سيتم استخدام هذه المعلومات لإنشاء حساب ولي الأمر. ستصلك بيانات الدخول بعد قبول الطلب."
                            : "This information will be used to create the parent account. You will receive login credentials after approval."}
                        </span>
                      </div>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label style={arabicFontStyle}>
                              {isArabic ? "كلمة المرور" : "Password"} *
                            </Form.Label>
                            <InputGroup>
                              <Form.Control
                                type={showPassword ? "text" : "password"}
                                {...register("parentPassword")}
                                isInvalid={!!errors.parentPassword}
                                placeholder={isArabic ? "أدخل كلمة المرور" : "Enter password"}
                                className="py-2"
                                style={arabicFontStyle}
                              />
                              <Button
                                variant="outline-secondary"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ border: "2px solid #e9ecef" }}
                              >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                              </Button>
                              <Form.Control.Feedback type="invalid">
                                {errors.parentPassword?.message}
                              </Form.Control.Feedback>
                            </InputGroup>
                            {password && (
                              <div className="mt-2">
                                <div className="d-flex justify-content-between align-items-center">
                                  <small className="text-muted" style={arabicFontStyle}>
                                    {isArabic ? "قوة كلمة المرور:" : "Password strength:"}
                                  </small>
                                  <small
                                    style={{
                                      color: passwordStrength.color,
                                      fontWeight: "600",
                                    }}
                                  >
                                    {passwordStrength.label}
                                  </small>
                                </div>
                                <ProgressBar
                                  now={(passwordStrength.score / 4) * 100}
                                  variant={
                                    passwordStrength.score <= 1
                                      ? "danger"
                                      : passwordStrength.score === 2
                                        ? "warning"
                                        : "success"
                                  }
                                  style={{ height: "4px", borderRadius: "2px" }}
                                />
                              </div>
                            )}
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label style={arabicFontStyle}>
                              {isArabic ? "تأكيد كلمة المرور" : "Confirm Password"} *
                            </Form.Label>
                            <InputGroup>
                              <Form.Control
                                type={showConfirmPassword ? "text" : "password"}
                                {...register("confirmPassword")}
                                isInvalid={!!errors.confirmPassword}
                                placeholder={isArabic ? "أعد إدخال كلمة المرور" : "Re-enter password"}
                                className="py-2"
                                style={arabicFontStyle}
                              />
                              <Button
                                variant="outline-secondary"
                                onClick={() =>
                                  setShowConfirmPassword(!showConfirmPassword)
                                }
                                style={{ border: "2px solid #e9ecef" }}
                              >
                                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                              </Button>
                              <Form.Control.Feedback type="invalid">
                                {errors.confirmPassword?.message}
                              </Form.Control.Feedback>
                            </InputGroup>
                          </Form.Group>
                        </Col>
                      </Row>

                      {/* ===== SECTION 4: EMERGENCY CONTACT ===== */}
                      <div className="section-header mb-4">
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="section-number"
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              background: "#d4a373",
                              color: "white",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: "700",
                              fontSize: "0.85rem",
                            }}
                          >
                            4
                          </div>
                          <h5 className="fw-bold mb-0" style={arabicFontStyle}>
                            <FaHeadset
                              className="me-2"
                              style={{ color: "#d4a373" }}
                            />
                            {isArabic
                              ? "جهة اتصال للطوارئ"
                              : "Emergency Contact"}
                          </h5>
                        </div>
                        <div
                          className="section-divider"
                          style={{
                            height: "2px",
                            background:
                              "linear-gradient(90deg, #d4a373, transparent)",
                            flex: 1,
                            marginLeft: "12px",
                          }}
                        ></div>
                      </div>

                      <Row>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label style={arabicFontStyle}>
                              {isArabic ? "الاسم" : "Name"}
                            </Form.Label>
                            <Form.Control
                              {...register("emergencyContact")}
                              placeholder={isArabic ? "أدخل الاسم" : "Enter name"}
                              className="py-2"
                              style={arabicFontStyle}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label style={arabicFontStyle}>
                              {isArabic ? "العلاقة" : "Relationship"}
                            </Form.Label>
                            <Form.Select
                              {...register("emergencyRelationship")}
                              className="py-2"
                              style={arabicFontStyle}
                            >
                              <option value="">{isArabic ? "اختر" : "Select"}</option>
                              <option value="father">{isArabic ? "أب" : "Father"}</option>
                              <option value="mother">{isArabic ? "أم" : "Mother"}</option>
                              <option value="sister">{isArabic ? "أخت" : "Sister"}</option>
                              <option value="brother">{isArabic ? "أخ" : "Brother"}</option>
                              <option value="guardian">{isArabic ? "وصي" : "Guardian"}</option>
                              <option value="other">{isArabic ? "أخرى" : "Other"}</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label style={arabicFontStyle}>
                              {isArabic ? "رقم الهاتف" : "Phone Number"}
                            </Form.Label>
                            <Form.Control
                              {...register("emergencyPhone")}
                              placeholder={isArabic ? "أدخل رقم الهاتف" : "Enter phone number"}
                              className="py-2"
                              style={arabicFontStyle}
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      {/* ===== SECTION 5: ADDITIONAL NOTES ===== */}
                      <div className="section-header mb-4">
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="section-number"
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              background: "#6c757d",
                              color: "white",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: "700",
                              fontSize: "0.85rem",
                            }}
                          >
                            5
                          </div>
                          <h5 className="fw-bold mb-0" style={arabicFontStyle}>
                            <FaComments
                              className="me-2"
                              style={{ color: "#6c757d" }}
                            />
                            {isArabic ? "ملاحظات إضافية" : "Additional Notes"}
                          </h5>
                        </div>
                        <div
                          className="section-divider"
                          style={{
                            height: "2px",
                            background:
                              "linear-gradient(90deg, #6c757d, transparent)",
                            flex: 1,
                            marginLeft: "12px",
                          }}
                        ></div>
                      </div>

                      <Form.Group className="mb-3">
                        <Form.Control
                          as="textarea"
                          rows={3}
                          {...register("additionalNotes")}
                          placeholder={isArabic ? "أي ملاحظات إضافية" : "Any additional notes"}
                          className="py-2"
                          style={arabicFontStyle}
                        />
                      </Form.Group>

                      {/* ===== TERMS & SUBMIT ===== */}
                      <div className="border-top pt-4 mt-3">
                        <Form.Group className="mb-3">
                          <Form.Check
                            type="checkbox"
                            {...register("termsAgreed")}
                            isInvalid={!!errors.termsAgreed}
                            label={
                              <span style={arabicFontStyle}>
                                {isArabic
                                  ? "أوافق على الشروط والأحكام وسياسة الخصوصية"
                                  : "I agree to the terms and conditions and privacy policy"}
                              </span>
                            }
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.termsAgreed?.message}
                          </Form.Control.Feedback>
                        </Form.Group>

                        <Button
                          variant="primary"
                          type="submit"
                          className="w-100 py-3"
                          disabled={submitting}
                          style={{
                            fontSize: "1.1rem",
                            fontWeight: "600",
                            borderRadius: "50px",
                          }}
                        >
                          {submitting ? (
                            <>
                              <Spinner
                                animation="border"
                                size="sm"
                                className="me-2"
                              />
                              {isArabic ? "جاري التقديم..." : "Submitting..."}
                            </>
                          ) : (
                            <>
                              <FaCheckCircle className="me-2" />{" "}
                              {isArabic ? "تقديم الطلب" : "Submit Application"}
                            </>
                          )}
                        </Button>
                      </div>
                    </Form>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ===== SUCCESS MODAL ===== */}
      <Modal
        show={showSuccessModal}
        onHide={() => setShowSuccessModal(false)}
        centered
        size="lg"
        className="modern-modal"
      >
        <Modal.Header closeButton className="border-0">
          <Modal.Title style={arabicFontStyle}>
            <FaCheckCircle className="me-2 text-success" />
            {isArabic
              ? "تم تقديم الطلب بنجاح"
              : "Application Submitted Successfully"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center py-3">
            <div className="mb-4">
              <div className="rounded-circle bg-success bg-opacity-10 d-inline-flex p-4">
                <FaCheckCircle size={64} className="text-success" />
              </div>
            </div>
            <h5 style={arabicFontStyle}>
              {isArabic
                ? "شكراً لتسجيلك في مدرسة الفتح الخاصة"
                : "Thank you for registering at Madrassat Al Fath"}
            </h5>
            <p className="text-muted" style={arabicFontStyle}>
              {isArabic
                ? "تم استلام طلب التسجيل الخاص بك. سيتم مراجعته من قبل فريق القبول وسنقوم بإعلامك بالقرار عبر البريد الإلكتروني."
                : "Your registration request has been received. It will be reviewed by our admissions team and we will notify you of the decision via email."}
            </p>
            <div className="d-flex justify-content-center gap-2 flex-wrap mt-3">
              <Badge
                bg="warning"
                className="p-2"
                style={{ fontSize: "0.8rem" }}
              >
                <FaClock className="me-1" />
                {isArabic ? "في انتظار المراجعة" : "Pending Review"}
              </Badge>
              <Badge bg="info" className="p-2" style={{ fontSize: "0.8rem" }}>
                <FaEnvelope className="me-1" />
                {isArabic
                  ? "سيتم الإشعار عبر البريد"
                  : "Notification via email"}
              </Badge>
            </div>
            <div
              className="mt-4 p-3 bg-light rounded-3"
              style={{ borderRadius: "12px" }}
            >
              <small className="text-muted" style={arabicFontStyle}>
                <FaInfoCircle className="me-1" />
                {isArabic ? "رقم الطلب المرجعي:" : "Reference Number:"}{" "}
                <span className="fw-bold">{registrationId || "N/A"}</span>
              </small>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button
            variant="secondary"
            onClick={() => {
              setShowSuccessModal(false);
              navigate("/");
            }}
            style={arabicFontStyle}
          >
            {isArabic ? "العودة للرئيسية" : "Back to Home"}
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setShowSuccessModal(false);
            }}
            style={arabicFontStyle}
          >
            {isArabic ? "متابعة" : "Continue"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===== CTA Section ===== */}
      <section
        className="py-5"
        style={{
          background: "linear-gradient(135deg, #031c2f 0%, #1a5f7a 100%)",
        }}
      >
        <Container>
          <Row className="align-items-center text-white text-center text-lg-start">
            <Col lg={8}>
              <h2 className="fw-bold" style={arabicFontStyle}>
                {isArabic ? "هل لديك استفسار؟" : "Have a question?"}
              </h2>
              <p className="mb-0" style={arabicFontStyle}>
                {isArabic
                  ? "فريق القبول لدينا جاهز لمساعدتك في أي وقت"
                  : "Our admissions team is ready to assist you anytime"}
              </p>
            </Col>
            <Col lg={4} className="text-lg-end mt-3 mt-lg-0">
              <Button
                variant="light"
                size="lg"
                className="px-5"
                style={{ borderRadius: "50px" }}
                onClick={() => (window.location.href = "tel:+212537350200")}
              >
                <FaPhone className="me-2" /> {isArabic ? "اتصل بنا" : "Call Us"}
              </Button>
            </Col>
          </Row>
        </Container>
      </section>

      <style>{`
        .admissions-page { padding: 0; }

        .feature-card {
          transition: all 0.3s ease;
          border-radius: 16px;
        }
        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important;
        }

        .step-circle {
          transition: all 0.3s ease;
        }
        .step-circle.active {
          box-shadow: 0 4px 15px rgba(26, 95, 122, 0.3);
        }
        .step-circle.completed {
          box-shadow: 0 4px 15px rgba(46, 204, 113, 0.3);
        }

        .section-header {
          display: flex;
          align-items: center;
        }
        .section-divider {
          flex: 1;
          margin-left: 12px;
        }

        .form-control, .form-select {
          border-radius: 10px;
          border: 2px solid #e9ecef;
          transition: all 0.3s ease;
        }
        .form-control:focus, .form-select:focus {
          border-color: #1a5f7a;
          box-shadow: 0 0 0 0.2rem rgba(26, 95, 122, 0.15);
        }

        .position-sticky {
          position: sticky;
          top: 100px;
          z-index: 10;
        }

        .modern-modal .modal-content {
          border-radius: 20px !important;
          border: none !important;
          overflow: hidden;
        }
        .modern-modal .modal-header {
          padding: 20px 24px 0;
          border-bottom: none;
        }
        .modern-modal .modal-body {
          padding: 16px 24px 24px;
        }
        .modern-modal .modal-footer {
          padding: 0 24px 24px;
          border-top: none;
        }
        .modern-modal .modal-header .btn-close {
          transition: transform 0.3s ease;
        }
        .modern-modal .modal-header .btn-close:hover {
          transform: rotate(90deg);
        }

        /* RTL Fixes */
        [dir="rtl"] .section-divider {
          margin-left: 0;
          margin-right: 12px;
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
        [dir="rtl"] .input-group .form-control {
          border-radius: 10px 0 0 10px !important;
        }
        [dir="rtl"] .input-group .btn {
          border-radius: 0 10px 10px 0 !important;
        }

        @media (max-width: 768px) {
          .position-sticky {
            position: relative !important;
            top: 0 !important;
          }
          .feature-card {
            margin-bottom: 10px;
          }
          .section-header {
            flex-wrap: wrap;
          }
          .section-divider {
            display: none;
          }
          .step-circle {
            width: 32px !important;
            height: 32px !important;
            font-size: 0.8rem !important;
          }
          .modern-modal .modal-body {
            padding: 12px 16px 16px !important;
          }
        }

        @media (max-width: 576px) {
          .section-number {
            width: 28px !important;
            height: 28px !important;
            font-size: 0.7rem !important;
          }
          .section-header h5 {
            font-size: 0.95rem !important;
          }
          .form-control, .form-select {
            font-size: 0.8rem !important;
            padding: 6px 10px !important;
          }
          .card-body .p-4 {
            padding: 16px !important;
          }
          .alert {
            padding: 12px !important;
            font-size: 0.8rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Admissions;