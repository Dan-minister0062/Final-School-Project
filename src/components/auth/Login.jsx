// src/components/auth/Login.jsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Spinner,
  InputGroup,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import {
  FaEnvelope,
  FaLock,
  FaSchool,
  FaEye,
  FaEyeSlash,
  FaArrowLeft,
  FaCheckCircle,
  FaArrowRight,
} from "react-icons/fa";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useLanguage } from "../../context/LanguageContext";
import { getTranslation } from "../../utils/translations";
import { useAuth } from "../../hooks/useAuth";
import { useNotification } from "../../hooks/useNotification";
import logo from "../../assets/images/school logo.jpeg";

const loginSchema = yup.object().shape({
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup
    .string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

const Login = () => {
  const { language, isArabic } = useLanguage();
  const t = (key) => getTranslation(key, language);
  const navigate = useNavigate();
  const { login, loading, error, clearAuthError, isAuthenticated } = useAuth();
  const { notify } = useNotification();

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(loginSchema),
  });

  useEffect(() => {
    if (isAuthenticated) {
      const role = localStorage.getItem("role") || "admin";
      const roleDashboards = {
        admin: "/dashboard/admin",
        teacher: "/dashboard/teacher",
        parent: "/dashboard/parent",
        student: "/dashboard/student",
      };
      navigate(roleDashboards[role] || "/dashboard/admin");
    }
    return () => {
      if (clearAuthError) clearAuthError();
    };
  }, [isAuthenticated, navigate, clearAuthError]);

  // ===== FIND USER BY EMAIL AND PASSWORD - FIXED =====
  const findUser = (email, password) => {
    try {
      // First check school_users (this is the primary source)
      const users = JSON.parse(localStorage.getItem("school_users") || "[]");
      console.log("🔍 Searching for user in school_users:", email);
      
      let foundUser = users.find(
        (u) => u.email === email && u.password === password,
      );

      if (foundUser) {
        console.log("✅ User found in school_users:", foundUser);
        // Ensure all required fields are present
        return {
          ...foundUser,
          role: foundUser.role || "admin",
          name: foundUser.name || `${foundUser.firstName || ''} ${foundUser.lastName || ''}`.trim(),
        };
      }

      // If not found, check school_teachers (for backward compatibility)
      const teachers = JSON.parse(
        localStorage.getItem("school_teachers") || "[]",
      );
      foundUser = teachers.find(
        (t) => t.email === email && t.password === password,
      );

      if (foundUser) {
        console.log("✅ Teacher found in school_teachers:", foundUser);
        foundUser.role = "teacher";
        return foundUser;
      }

      // If not found, check school_parents (for backward compatibility)
      const parents = JSON.parse(
        localStorage.getItem("school_parents") || "[]",
      );
      foundUser = parents.find(
        (p) => p.email === email && p.password === password,
      );

      if (foundUser) {
        console.log("✅ Parent found in school_parents:", foundUser);
        foundUser.role = "parent";
        return foundUser;
      }

      // If still not found, check if there's a user with this email (case insensitive)
      const userByEmail = users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase(),
      );
      if (userByEmail) {
        console.warn("⚠️ User found but password doesn't match:", email);
        return null;
      }

      console.warn("⚠️ No user found with email:", email);
      return null;
    } catch (error) {
      console.error("Error finding user:", error);
      return null;
    }
  };

  // ===== SAVE USER TO LOCALSTORAGE - FIXED =====
  const saveUserToStorage = (user) => {
    try {
      console.log("💾 Saving user to localStorage:", user);
      
      // Ensure user has all required fields
      const userToSave = {
        id: user.id || `USR${String(Date.now()).slice(-6)}`,
        name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        dateOfBirth: user.dateOfBirth || '',
        gender: user.gender || '',
        nationality: user.nationality || '',
        cin: user.cin || '',
        role: user.role || 'admin',
        status: user.status || 'active',
        password: user.password || 'password123',
        // Teacher specific fields
        level: user.level || '',
        educationLevel: user.educationLevel || user.level || '',
        subjects: user.subjects || [],
        qualifications: user.qualifications || [],
        specialization: user.specialization || '',
        experienceYears: user.experienceYears || '',
        employmentType: user.employmentType || '',
        previousSchool: user.previousSchool || '',
        assignedClasses: user.assignedClasses || [],
        classes: user.assignedClasses || [],
        // Parent specific fields
        childrenNames: user.childrenNames || '',
        occupation: user.occupation || '',
        employer: user.employer || '',
        // Emergency contact
        emergencyContactName: user.emergencyContactName || '',
        emergencyContactRelationship: user.emergencyContactRelationship || '',
        emergencyContactPhone: user.emergencyContactPhone || '',
        // Metadata
        lastLogin: new Date().toISOString(),
        createdAt: user.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save to school_users (primary storage)
      const users = JSON.parse(localStorage.getItem("school_users") || "[]");
      const existingUserIndex = users.findIndex((u) => u.id === userToSave.id);
      
      if (existingUserIndex === -1) {
        users.push(userToSave);
        localStorage.setItem("school_users", JSON.stringify(users));
        console.log("✅ User saved to school_users");
      } else {
        users[existingUserIndex] = {
          ...users[existingUserIndex],
          ...userToSave,
          lastLogin: new Date().toISOString(),
        };
        localStorage.setItem("school_users", JSON.stringify(users));
        console.log("✅ User updated in school_users");
      }

      // If teacher, also save to school_teachers
      if (userToSave.role === "teacher") {
        const teachers = JSON.parse(
          localStorage.getItem("school_teachers") || "[]",
        );
        const existingTeacherIndex = teachers.findIndex(
          (t) => t.id === userToSave.id,
        );
        
        const teacherData = {
          ...userToSave,
          role: 'teacher',
        };
        
        if (existingTeacherIndex === -1) {
          teachers.push(teacherData);
          localStorage.setItem("school_teachers", JSON.stringify(teachers));
          console.log("✅ Teacher saved to school_teachers");
        } else {
          teachers[existingTeacherIndex] = {
            ...teachers[existingTeacherIndex],
            ...teacherData,
            lastLogin: new Date().toISOString(),
          };
          localStorage.setItem("school_teachers", JSON.stringify(teachers));
          console.log("✅ Teacher updated in school_teachers");
        }
      }

      // If parent, also save to school_parents
      if (userToSave.role === "parent") {
        const parents = JSON.parse(
          localStorage.getItem("school_parents") || "[]",
        );
        const existingParentIndex = parents.findIndex(
          (p) => p.id === userToSave.id,
        );
        
        const parentData = {
          ...userToSave,
          role: 'parent',
        };
        
        if (existingParentIndex === -1) {
          parents.push(parentData);
          localStorage.setItem("school_parents", JSON.stringify(parents));
          console.log("✅ Parent saved to school_parents");
        } else {
          parents[existingParentIndex] = {
            ...parents[existingParentIndex],
            ...parentData,
            lastLogin: new Date().toISOString(),
          };
          localStorage.setItem("school_parents", JSON.stringify(parents));
          console.log("✅ Parent updated in school_parents");
        }
      }

      // Save current session
      localStorage.setItem("currentUser", JSON.stringify(userToSave));
      localStorage.setItem("user", JSON.stringify(userToSave));
      localStorage.setItem("role", userToSave.role);
      localStorage.setItem("userId", userToSave.id);
      localStorage.setItem("token", "demo-token-" + Date.now());
      
      // Also set in auth context format
      localStorage.setItem("isLoggedIn", "true");

      console.log("✅ User session saved:", userToSave);
      return userToSave;
    } catch (error) {
      console.error("❌ Error saving user to storage:", error);
      return null;
    }
  };

  const onSubmit = async (data) => {
    setLoginSuccess(false);
    try {
      console.log("🔐 Login attempt for:", data.email);
      
      // First try to find user in localStorage
      const foundUser = findUser(data.email, data.password);

      if (foundUser) {
        // Save user to storage and get session
        const savedUser = saveUserToStorage(foundUser);
        
        if (savedUser) {
          setLoginSuccess(true);
          notify(t("Login successful!"), "success");

          // Check for notifications
          const notifications = JSON.parse(
            localStorage.getItem("school_notifications") || "[]",
          );
          const unread = notifications.filter(
            (n) =>
              (n.recipientId === savedUser.id || n.recipientRole === savedUser.role) &&
              !n.read,
          );

          if (unread.length > 0) {
            setTimeout(() => {
              notify(
                isArabic
                  ? `🔔 لديك ${unread.length} إشعارات غير مقروءة`
                  : `🔔 You have ${unread.length} unread notifications`,
                "info",
              );
            }, 1000);
          }

          // Redirect after delay
          setTimeout(() => {
            const role = savedUser.role || "admin";
            const roleDashboards = {
              admin: "/dashboard/admin",
              teacher: "/dashboard/teacher",
              parent: "/dashboard/parent",
              student: "/dashboard/student",
            };
            const dashboard = roleDashboards[role] || "/dashboard/admin";
            console.log(`🔄 Redirecting to: ${dashboard}`);
            navigate(dashboard);
          }, 1500);
        } else {
          notify(
            isArabic ? "❌ فشل حفظ بيانات المستخدم" : "❌ Failed to save user data",
            "error",
          );
          setLoginSuccess(false);
        }
      } else {
        // Try the actual login API
        const result = await login(data);
        if (result && result.success) {
          setLoginSuccess(true);
          notify(t("Login successful!"), "success");
          
          setTimeout(() => {
            const role = localStorage.getItem("role") || "admin";
            const roleDashboards = {
              admin: "/dashboard/admin",
              teacher: "/dashboard/teacher",
              parent: "/dashboard/parent",
              student: "/dashboard/student",
            };
            navigate(roleDashboards[role] || "/dashboard/admin");
          }, 1500);
        } else {
          const errorMsg =
            result?.error || (isArabic ? "❌ فشل تسجيل الدخول" : "❌ Login failed");
          notify(errorMsg, "error");
          setLoginSuccess(false);
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      notify(
        isArabic
          ? "❌ حدث خطأ أثناء تسجيل الدخول"
          : "❌ An error occurred during login",
        "error",
      );
      setLoginSuccess(false);
    }
  };

  // Arabic font style with Vazirmatn & Noto Sans Arabic
  const arabicFontStyle = {
    fontFamily: isArabic
      ? '"Noto Sans Arabic", "Vazirmatn", "Traditional Arabic", "Arabic Typesetting", serif'
      : "inherit",
    lineHeight: isArabic ? "1.8" : "1.6",
    letterSpacing: isArabic ? "0.5px" : "0px",
    fontSize: isArabic
      ? "clamp(0.9rem, 1.1vw, 1.05rem)"
      : "clamp(0.85rem, 1vw, 1rem)",
  };

  // For titles/headings - bolder version
  const arabicHeadingStyle = {
    fontFamily: isArabic
      ? '"Noto Sans Arabic", "Vazirmatn", "Traditional Arabic", serif'
      : "inherit",
    fontWeight: isArabic ? "700" : "600",
    lineHeight: isArabic ? "1.4" : "1.4",
    letterSpacing: isArabic ? "0.5px" : "0px",
  };

  const logoExists = logo && typeof logo === "string" && logo.length > 0;
  const isLoading = loading;

  return (
    <div className="login-page" dir={isArabic ? "rtl" : "ltr"}>
      {/* Back to Home Button */}
      <Button
        variant="link"
        className="back-home-btn"
        onClick={() => navigate("/")}
        style={{
          [isArabic ? "right" : "left"]: "20px",
          [isArabic ? "left" : "right"]: "auto",
        }}
      >
        {isArabic ? (
          <FaArrowRight className="back-icon" size={14} />
        ) : (
          <FaArrowLeft className="back-icon" size={14} />
        )}
        <span className="back-text" style={arabicFontStyle}>
          {isArabic ? "العودة للرئيسية" : "Back to Home"}
        </span>
        <span className="back-short-text">🏠</span>
      </Button>

      <div className="login-bg-pattern"></div>

      <Container>
        <Row className="justify-content-center align-items-center min-vh-100">
          <Col lg={6} xl={5} xxl={4}>
            <Card className="shadow-lg border-0 login-card">
              {/* Header */}
              <div className="login-card-header">
                <div className="login-card-header-content">
                  <div className="login-logo-wrapper">
                    {logoExists ? (
                      <div className="logo-container">
                        <img
                          src={logo}
                          alt="Madrasatul Fathi Logo"
                          className="login-logo-img"
                          style={{
                            width: "70px",
                            height: "70px",
                            objectFit: "cover",
                            borderRadius: "50%",
                            backgroundColor: "#d87e23",
                            padding: "3px",
                            boxShadow: "0 4px 20px rgba(255,255,255,0.15)",
                            transition: "transform 0.3s ease",
                            border: "2px solid rgba(255,255,255,0.2)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform =
                              "scale(1.08) rotate(-5deg)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform =
                              "scale(1) rotate(0)";
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
                  <h5
                    className="text-white fw-bold mb-0"
                    style={{ ...arabicHeadingStyle, fontSize: "1rem" }}
                  >
                    {isArabic ? "مدرسة الفتح" : "Madrassat Al Fath"}
                  </h5>
                  <p
                    className="text-white-50 small mb-0"
                    style={{ ...arabicFontStyle, fontSize: "0.6rem" }}
                  >
                    {isArabic ? "التعليم المتميز" : "Quality Education"}
                  </p>
                </div>
              </div>

              <Card.Body className="p-4 p-xl-4">
                {/* Title */}
                <div className="text-center mb-3">
                  <h5
                    className="fw-bold"
                    style={{
                      ...arabicHeadingStyle,
                      fontSize: "1.1rem",
                      color: "#1a5f7a",
                    }}
                  >
                    {isArabic
                      ? "تسجيل الدخول إلى حسابك"
                      : "Login to Your Account"}
                  </h5>
                  <p
                    className="text-muted small"
                    style={{ ...arabicFontStyle, fontSize: "0.75rem" }}
                  >
                    {isArabic
                      ? "مرحباً بعودتك! يرجى تسجيل الدخول للمتابعة"
                      : "Welcome back! Please login to continue"}
                  </p>
                </div>

                {error && (
                  <Alert
                    variant="danger"
                    dismissible
                    onClose={clearAuthError}
                    className="rounded-3 py-1 px-3 mb-2"
                  >
                    <span style={{ ...arabicFontStyle, fontSize: "0.8rem" }}>
                      {error}
                    </span>
                  </Alert>
                )}

                {loginSuccess && (
                  <Alert variant="success" className="rounded-3 py-1 px-3 mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <FaCheckCircle className="text-success" size={14} />
                      <span style={{ ...arabicFontStyle, fontSize: "0.8rem" }}>
                        {isArabic
                          ? "تم تسجيل الدخول بنجاح!"
                          : "Login successful!"}{" "}
                        {isArabic ? "جاري التحويل..." : "Redirecting..."}
                      </span>
                      <Spinner animation="border" size="sm" variant="success" />
                    </div>
                  </Alert>
                )}

                <Form id="loginForm" onSubmit={handleSubmit(onSubmit)}>
                  <Form.Group className="mb-2">
                    <Form.Label
                      className="fw-semibold small"
                      style={{ ...arabicFontStyle, fontSize: "0.75rem" }}
                    >
                      {isArabic ? "البريد الإلكتروني" : "Email"}
                    </Form.Label>
                    <InputGroup className="login-input-group">
                      <InputGroup.Text
                        className="login-input-icon"
                        style={{
                          borderRadius: isArabic
                            ? "0 10px 10px 0"
                            : "10px 0 0 10px",
                          borderRight: isArabic ? "2px solid #e9ecef" : "none",
                          borderLeft: isArabic ? "none" : "2px solid #e9ecef",
                        }}
                      >
                        <FaEnvelope className="text-muted" size={13} />
                      </InputGroup.Text>
                      <Form.Control
                        type="email"
                        name="email"
                        placeholder={
                          isArabic
                            ? "أدخل بريدك الإلكتروني"
                            : "Enter your email"
                        }
                        {...register("email")}
                        isInvalid={!!errors.email}
                        className="login-input"
                        disabled={isLoading || loginSuccess}
                        style={{
                          fontSize: "0.85rem",
                          padding: "8px 0",
                          borderRadius: isArabic
                            ? "10px 0 0 10px"
                            : "0 10px 10px 0",
                          borderLeft: isArabic ? "2px solid #e9ecef" : "none",
                          borderRight: isArabic ? "none" : "2px solid #e9ecef",
                          ...arabicFontStyle,
                        }}
                      />
                    </InputGroup>
                    {errors.email && (
                      <Form.Text
                        className="text-danger small"
                        style={{ ...arabicFontStyle, fontSize: "0.7rem" }}
                      >
                        {errors.email.message}
                      </Form.Text>
                    )}
                  </Form.Group>

                  <Form.Group className="mb-2">
                    <Form.Label
                      className="fw-semibold small"
                      style={{ ...arabicFontStyle, fontSize: "0.75rem" }}
                    >
                      {isArabic ? "كلمة المرور" : "Password"}
                    </Form.Label>
                    <InputGroup className="login-input-group">
                      <InputGroup.Text
                        className="login-input-icon"
                        style={{
                          borderRadius: isArabic
                            ? "0 10px 10px 0"
                            : "10px 0 0 10px",
                          borderRight: isArabic ? "2px solid #e9ecef" : "none",
                          borderLeft: isArabic ? "none" : "2px solid #e9ecef",
                        }}
                      >
                        <FaLock className="text-muted" size={13} />
                      </InputGroup.Text>
                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder={
                          isArabic ? "أدخل كلمة المرور" : "Enter your password"
                        }
                        {...register("password")}
                        isInvalid={!!errors.password}
                        className="login-input"
                        disabled={isLoading || loginSuccess}
                        style={{
                          fontSize: "0.85rem",
                          padding: "8px 0",
                          borderRadius: isArabic
                            ? "10px 0 0 10px"
                            : "0 10px 10px 0",
                          borderLeft: isArabic ? "2px solid #e9ecef" : "none",
                          borderRight: isArabic ? "none" : "2px solid #e9ecef",
                          ...arabicFontStyle,
                        }}
                      />
                      <Button
                        variant="link"
                        className="login-password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading || loginSuccess}
                        style={{
                          padding: "0 12px",
                          borderRadius: isArabic
                            ? "10px 0 0 10px"
                            : "0 10px 10px 0",
                        }}
                      >
                        {showPassword ? (
                          <FaEyeSlash size={13} />
                        ) : (
                          <FaEye size={13} />
                        )}
                      </Button>
                    </InputGroup>
                    {errors.password && (
                      <Form.Text
                        className="text-danger small"
                        style={{ ...arabicFontStyle, fontSize: "0.7rem" }}
                      >
                        {errors.password.message}
                      </Form.Text>
                    )}
                  </Form.Group>

                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <Form.Check
                      type="checkbox"
                      label={
                        <span
                          className="small"
                          style={{ ...arabicFontStyle, fontSize: "0.75rem" }}
                        >
                          {isArabic ? "تذكرني" : "Remember Me"}
                        </span>
                      }
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="remember-check"
                      disabled={isLoading || loginSuccess}
                    />
                    <Link
                      to="/forgot-password"
                      className="text-decoration-none forgot-link small"
                      style={{ ...arabicFontStyle, fontSize: "0.75rem" }}
                    >
                      {isArabic ? "نسيت كلمة المرور؟" : "Forgot Password?"}
                    </Link>
                  </div>

                  <Button
                    variant="primary"
                    type="submit"
                    className="w-100 py-2 login-submit-btn"
                    disabled={isLoading || loginSuccess}
                    style={{
                      borderRadius: "50px",
                      fontWeight: "600",
                      fontSize: "0.85rem",
                      ...arabicFontStyle,
                    }}
                  >
                    {isLoading ? (
                      <>
                        <Spinner
                          animation="border"
                          size="sm"
                          className="me-2"
                        />{" "}
                        {isArabic ? "جاري تسجيل الدخول..." : "Logging in..."}
                      </>
                    ) : (
                      <>
                        {isArabic ? "تسجيل الدخول" : "Login"}{" "}
                        <FaArrowRight className="ms-2" size={12} />
                      </>
                    )}
                  </Button>
                </Form>
              </Card.Body>
            </Card>

            {/* Footer */}
            <div className="text-center mt-2">
              <small
                className="text-muted opacity-50"
                style={{ ...arabicFontStyle, fontSize: "0.6rem" }}
              >
                {isArabic
                  ? "© 2026 مدرسة الفتح. جميع الحقوق محفوظة."
                  : "© 2026 Madrassat Al Fath. All rights reserved."}
              </small>
            </div>
          </Col>
        </Row>
      </Container>

      <style>{`
        .login-page {
          min-height: 100vh;
          position: relative;
          background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
          overflow: hidden;
          display: flex;
          align-items: center;
        }

        .login-bg-pattern {
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
        .login-bg-pattern::before {
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

        .login-card {
          border-radius: 20px !important;
          overflow: hidden;
          background: white !important;
          border: none !important;
          box-shadow: 0 15px 50px rgba(0,0,0,0.08), 0 6px 25px rgba(0,0,0,0.04) !important;
        }

        .login-card-header {
          background: linear-gradient(135deg, #031c2f 0%, #1a5f7a 100%);
          padding: 14px 20px 12px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .login-card-header::after {
          content: '';
          position: absolute;
          top: -50%;
          right: -20%;
          width: 150px;
          height: 150px;
          background: rgba(255,255,255,0.03);
          border-radius: 50%;
        }
        .login-card-header::before {
          content: '';
          position: absolute;
          bottom: -40%;
          left: -10%;
          width: 120px;
          height: 120px;
          background: rgba(255,255,255,0.02);
          border-radius: 50%;
        }

        .login-card-header-content {
          position: relative;
          z-index: 1;
        }

        .login-logo-wrapper {
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

        .login-input-group {
          border-radius: 10px !important;
          overflow: hidden;
          border: 2px solid #e9ecef;
          transition: all 0.3s ease;
          background: white;
        }
        .login-input-group:focus-within {
          border-color: #1a5f7a;
          box-shadow: 0 0 0 3px rgba(26, 95, 122, 0.06);
        }
        .login-input-icon {
          background: white !important;
          border: none !important;
          padding: 0 12px !important;
        }
        .login-input {
          border: none !important;
          padding: 8px 0 !important;
          background: white !important;
          font-size: 0.85rem !important;
          height: 38px !important;
        }
        .login-input:focus {
          box-shadow: none !important;
        }
        .login-input::placeholder {
          color: #adb5bd;
          font-size: 0.8rem;
        }
        .login-password-toggle {
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
        .login-password-toggle:hover {
          color: #1a5f7a;
        }

        .remember-check .form-check-input {
          border-radius: 4px;
          border: 2px solid #ced4da;
          width: 14px;
          height: 14px;
          margin-top: 2px;
          cursor: pointer;
        }
        .remember-check .form-check-input:checked {
          background-color: #1a5f7a;
          border-color: #1a5f7a;
        }
        .remember-check .form-check-label {
          font-size: 0.75rem;
          cursor: pointer;
        }

        .forgot-link {
          color: #1a5f7a;
          font-weight: 500;
          transition: all 0.3s ease;
        }
        .forgot-link:hover {
          color: #0d3b4f;
          text-decoration: underline !important;
        }

        .login-submit-btn {
          transition: all 0.3s ease;
          height: 40px !important;
        }
        .login-submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 25px rgba(26, 95, 122, 0.2);
        }
        .login-submit-btn:disabled {
          transform: none !important;
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
        .dashboard-wrapper.rtl .back-home-btn {
          right: 20px !important;
          left: auto !important;
        }
        .dashboard-wrapper.rtl .back-home-btn:hover {
          transform: translateX(5px) scale(1.02) !important;
        }

        @media (max-width: 768px) {
          .login-card .p-xl-5 {
            padding: 20px !important;
          }
          .login-card-header {
            padding: 10px 16px 8px;
          }
          .login-card-header h5 {
            font-size: 0.85rem !important;
          }
          .login-card-header .login-logo-img {
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
        }

        @media (max-width: 576px) {
          .login-card .p-4 {
            padding: 16px !important;
          }
          .login-input {
            font-size: 0.8rem !important;
            height: 34px !important;
          }
          .login-input-group {
            border-radius: 8px !important;
          }
          .login-submit-btn {
            height: 36px !important;
            font-size: 0.8rem !important;
          }
          .login-card-header .login-logo-img {
            width: 40px !important;
            height: 40px !important;
          }
          .login-card-header h5 {
            font-size: 0.75rem !important;
          }
          .login-card-header p {
            font-size: 0.5rem !important;
          }
          .back-home-btn {
            padding: 4px 10px !important;
            font-size: 0.65rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;