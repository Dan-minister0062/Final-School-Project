// src/App.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Provider, useDispatch } from "react-redux";
import { ToastContainer } from "react-toastify";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "react-toastify/dist/ReactToastify.css";
import "./assets/styles/global.css";
import { store } from "./store";
import {
  fetchMe,
  clearSession,
} from "./store/slices/authSlice";

// ===== IMPORTS FOR ADMIN PAGES =====
import { Card, Table, Badge, Button, Row, Col, Form } from "react-bootstrap";
import {
  FaEye,
  FaEdit,
  FaTrash,
  FaPlus,
  FaCheckCircle,
  FaTimesCircle,
  FaFilePdf,
  FaDownload,
  FaPlusCircle,
  FaSave,
  FaSchool,
  FaCalendarAlt,
  FaCog,
  FaUserEdit,
  FaKey,
  FaExclamationTriangle,
  FaArchive,
  FaBell,
  FaCamera,
} from "react-icons/fa";
import { useLanguage } from "./context/LanguageContext";
import { useNotification } from "./hooks/useNotification";
import { useAuth } from "./hooks/useAuth";
import { getInitials } from "./utils/helpers";
import api from "./services/api";

// ===== LAYOUTS =====
import MainLayout from "./components/layout/MainLayout";
import DashboardLayout from "./components/layout/DashboardLayout";

// ===== PUBLIC PAGES =====
import Home from "./components/public/Home";
import About from "./components/public/About";
import Academics from "./components/public/Academics";
import Admissions from "./components/public/Admissions";
import Contact from "./components/public/Contact";
import NewsEvents from "./components/public/NewsEvents";

// ===== AUTH PAGES =====
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import ForgotPassword from "./components/auth/ForgotPassword";

// ===== ADMIN PAGES =====
import AdminDashboard from "./components/dashboard/admin/AdminDashboard";

import StudentsManagement from "./components/dashboard/admin/StudentsManagement";
import ClassesManagement from "./components/dashboard/admin/ClassesManagement";
import TeachersManagement from "./components/dashboard/admin/TeachersManagement";
import AnnouncementsManagement from "./components/dashboard/admin/AnnouncementsManagement";
import RegistrationsManagement from "./components/dashboard/admin/RegistrationsManagement";

import ParentsManagement from "./components/dashboard/admin/ParentsManagement";
import UsersManagement from "./components/dashboard/admin/UsersManagement";
import Notifications from "./components/dashboard/admin/Notifications";
import SubjectsManagement from "./components/dashboard/admin/SubjectsManagement";
import AdmissionManagement from "./components/dashboard/admin/AdmissionManagement";
import PaymentsManagement from "./components/dashboard/admin/PaymentsManagement";
import AdminAssessments from './components/dashboard/admin/AdminAssessments';
import Settings from './components/dashboard/admin/Settings';
import ContactMessages from './components/dashboard/admin/ContactMessages';
// ===== TEACHER PAGES =====
import TeacherDashboard from "./components/dashboard/teacher/TeacherDashboard";
import TeacherStudents from "./components/dashboard/teacher/TeacherStudents";
import TeacherAssessments from "./components/dashboard/teacher/TeacherAssessments";
import TeacherAttendance from "./components/dashboard/teacher/TeacherAttendance";

import TeacherProfile from "./components/dashboard/teacher/TeacherProfile";
import TeacherNotifications from "./components/dashboard/teacher/TeacherNotifications";
import TeacherClasses from "./components/dashboard/teacher/TeacherClasses";

// ===== PARENT PAGES =====
import ParentDashboard from "./components/dashboard/parent/ParentDashboard";
import ChildResults from "./components/dashboard/parent/ChildResults";
import ParentAnnouncements from "./components/dashboard/parent/ParentAnnouncements";
import ParentPayments from "./components/dashboard/parent/ParentPayments";

// ===== STUDENT PAGES =====
import StudentDashboard from "./components/dashboard/student/StudentDashboard";
import StudentResults from "./components/dashboard/student/StudentResults";
// ✅ FIXED: Changed from '../components/dashboard/student/StudentAnnouncements' to './components/dashboard/student/StudentAnnouncements'
import StudentAnnouncements from "./components/dashboard/student/StudentAnnouncements";
import StudentPayments from "./components/dashboard/student/StudentPayments";

// ===== ACCEPT INVITE PAGE =====
import AcceptInvite from "./pages/AcceptInvite";

// ===== PROFILE COMPONENT =====
const Profile = () => {
  const { isArabic } = useLanguage();
  const { notify } = useNotification();
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [profile, setProfile] = useState({
    name: user?.name || "Admin",
    email: user?.email || "admin@school.com",
    phone: user?.phone || "",
    address: user?.address || "",
    bio: user?.bio || "",
    role: user?.role || "Admin",
  });
  const [avatar, setAvatar] = useState(user?.avatar || null);
  const fileInputRef = useRef(null);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!validTypes.includes(file.type)) {
      notify(
        isArabic
          ? "يرجى اختيار صورة بصيغة JPEG, PNG, GIF أو WEBP"
          : "Please select a JPEG, PNG, GIF or WEBP image",
        "error",
      );
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      notify(
        isArabic
          ? "حجم الصورة يجب أن لا يتجاوز 5 ميجابايت"
          : "Image size must not exceed 5MB",
        "error",
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => setAvatar(event.target.result);
    reader.readAsDataURL(file);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put("/profile", {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        address: profile.address,
        bio: profile.bio,
        avatar: avatar ?? null,
      });
      if (updateUser) updateUser({ ...profile, avatar });
      notify(
        isArabic
          ? "تم تحديث الملف الشخصي بنجاح"
          : "Profile updated successfully",
        "success",
      );
    } catch (error) {
      notify(
        error.response?.data?.message ||
          (isArabic ? "فشل تحديث الملف الشخصي" : "Failed to update profile"),
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.next !== passwords.confirm) {
      notify(
        isArabic ? "كلمتا المرور غير متطابقتين" : "Passwords do not match",
        "error",
      );
      return;
    }
    setPwdLoading(true);
    try {
      await api.post("/auth/change-password", {
        current_password: passwords.current,
        password: passwords.next,
        password_confirmation: passwords.confirm,
      });
      setPasswords({ current: "", next: "", confirm: "" });
      notify(
        isArabic
          ? "تم تغيير كلمة المرور بنجاح"
          : "Password changed successfully",
        "success",
      );
    } catch (error) {
      const errors = error.response?.data?.errors;
      const firstError =
        errors && typeof errors === "object"
          ? Object.values(errors)[0]?.[0]
          : null;
      notify(
        firstError ||
          error.response?.data?.message ||
          (isArabic ? "فشل تغيير كلمة المرور" : "Failed to change password"),
        "error",
      );
    } finally {
      setPwdLoading(false);
    }
  };

  useEffect(() => {
    // Prefill the form from the authenticated server profile (auth context)
    // when it arrives after session restore.
    if (user) {
      setProfile((prev) => ({
        ...prev,
        name: user.name ?? prev.name,
        email: user.email ?? prev.email,
        phone: user.phone ?? prev.phone,
        address: user.address ?? prev.address,
        bio: user.bio ?? prev.bio,
        role: user.role ?? prev.role,
      }));
      if (user.avatar !== undefined) setAvatar(user.avatar);
    }
  }, [user]);

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold">{isArabic ? "الملف الشخصي" : "Profile"}</h2>
          <p className="text-muted">
            {isArabic
              ? "عرض وتحديث ملفك الشخصي"
              : "View and update your profile"}
          </p>
        </div>
        <Button variant="primary" onClick={handleSave} disabled={loading}>
          {loading ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              {isArabic ? "جاري الحفظ..." : "Saving..."}
            </>
          ) : (
            <>
              <FaSave className="me-2" />{" "}
              {isArabic ? "حفظ التغييرات" : "Save Changes"}
            </>
          )}
        </Button>
      </div>

      <Row>
        <Col lg={4} md={12} className="mb-4">
          <Card className="shadow-sm border-0 text-center">
            <Card.Body className="py-4">
              <div className="profile-avatar-container mb-3">
                {avatar ? (
                  <div className="profile-avatar" style={{ overflow: "hidden" }}>
                    <img
                      src={avatar}
                      alt={profile.name}
                      className="profile-avatar-img"
                    />
                  </div>
                ) : (
                  <div className="profile-avatar">
                    {getInitials(profile.name)}
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                hidden
                onChange={handleAvatarChange}
              />
              <Button
                size="sm"
                variant="outline-primary"
                className="mb-3"
                onClick={() => fileInputRef.current?.click()}
              >
                <FaCamera className="me-1" />
                {isArabic ? "تغيير الصورة" : "Change Photo"}
              </Button>
              <h5 className="fw-bold">{profile.name}</h5>
              <p className="text-muted">{profile.email}</p>
              <Badge bg="primary" className="px-3 py-2">
                {profile.role}
              </Badge>
              <hr />
              <div className="text-start">
                <div className="d-flex justify-content-between py-1">
                  <span className="text-muted">
                    {isArabic ? "الحالة" : "Status"}
                  </span>
                  <Badge bg="success" className="rounded-pill">
                    {isArabic ? "نشط" : "Active"}
                  </Badge>
                </div>
                <div className="d-flex justify-content-between py-1">
                  <span className="text-muted">
                    {isArabic ? "آخر تسجيل دخول" : "Last Login"}
                  </span>
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
                <div className="d-flex justify-content-between py-1">
                  <span className="text-muted">
                    {isArabic ? "الدور" : "Role"}
                  </span>
                  <span className="text-capitalize">{profile.role}</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8} md={12}>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-transparent border-bottom">
              <h6 className="fw-bold mb-0">
                <FaUserEdit className="me-2 text-primary" />
                {isArabic ? "معلومات الملف الشخصي" : "Profile Information"}
              </h6>
            </Card.Header>
            <Card.Body>
              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        {isArabic ? "الاسم الكامل" : "Full Name"}
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={profile.name}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        {isArabic ? "البريد الإلكتروني" : "Email"}
                      </Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={profile.email}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        {isArabic ? "رقم الهاتف" : "Phone"}
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="phone"
                        value={profile.phone}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        {isArabic ? "العنوان" : "Address"}
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="address"
                        value={profile.address}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label>{isArabic ? "نبذة عنك" : "Bio"}</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="bio"
                    value={profile.bio}
                    onChange={handleChange}
                    placeholder={
                      isArabic
                        ? "اكتب نبذة عنك..."
                        : "Write something about yourself..."
                    }
                  />
                </Form.Group>
              </Form>
            </Card.Body>
          </Card>

          <Card className="shadow-sm border-0 mt-4">
            <Card.Header className="bg-transparent border-bottom">
              <h6 className="fw-bold mb-0">
                <FaKey className="me-2 text-warning" />
                {isArabic ? "تغيير كلمة المرور" : "Change Password"}
              </h6>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleChangePassword}>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        {isArabic ? "كلمة المرور الحالية" : "Current Password"}
                      </Form.Label>
                      <Form.Control
                        type="password"
                        name="current"
                        value={passwords.current}
                        onChange={handlePasswordChange}
                        placeholder={
                          isArabic
                            ? "أدخل كلمة المرور الحالية"
                            : "Enter current password"
                        }
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        {isArabic ? "كلمة المرور الجديدة" : "New Password"}
                      </Form.Label>
                      <Form.Control
                        type="password"
                        name="next"
                        value={passwords.next}
                        onChange={handlePasswordChange}
                        placeholder={
                          isArabic
                            ? "أدخل كلمة المرور الجديدة"
                            : "Enter new password"
                        }
                        minLength={6}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        {isArabic ? "تأكيد كلمة المرور" : "Confirm Password"}
                      </Form.Label>
                      <Form.Control
                        type="password"
                        name="confirm"
                        value={passwords.confirm}
                        onChange={handlePasswordChange}
                        placeholder={
                          isArabic
                            ? "أعد إدخال كلمة المرور"
                            : "Re-enter password"
                        }
                        minLength={6}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Button
                  variant="warning"
                  className="text-white"
                  type="submit"
                  disabled={pwdLoading}
                >
                  {pwdLoading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      {isArabic ? "جاري التغيير..." : "Changing..."}
                    </>
                  ) : (
                    <>
                      <FaKey className="me-2" />{" "}
                      {isArabic ? "تغيير كلمة المرور" : "Change Password"}
                    </>
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <style>{`
        .profile-avatar-container { display: flex; justify-content: center; }
        .profile-avatar {
          width: 120px; height: 120px; border-radius: 50%;
          background: linear-gradient(135deg, #1a5f7a, #2a7f9a);
          display: flex; align-items: center; justify-content: center;
          font-size: 2.5rem; font-weight: 700; color: white;
          border: 4px solid var(--border-color);
        }
        .dashboard-wrapper.rtl .profile-avatar {
          font-family: 'Traditional Arabic', 'Arabic Typesetting', serif;
        }
        .profile-avatar-img {
          width: 100%; height: 100%;
          object-fit: cover; border-radius: 50%;
        }
      `}</style>
    </div>
  );
};

// ===== PROTECTED ROUTE =====
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { status, isAuthenticated, role } = useAuth();

  if (status === "checking") {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "60vh" }}
      >
        <div className="text-center">
          <div
            className="spinner-border text-primary mb-2"
            style={{ width: "3rem", height: "3rem" }}
            role="status"
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <div className="text-muted small">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    const roleDashboards = {
      admin: "/dashboard/admin",
      teacher: "/dashboard/teacher",
      parent: "/dashboard/parent",
      student: "/dashboard/student",
    };
    return <Navigate to={roleDashboards[role] || "/dashboard/admin"} />;
  }

  return children;
};

// ===== DASHBOARD REDIRECT =====
const DashboardRedirect = () => {
  const role = useAuth().role || "admin";
  const roleDashboards = {
    admin: "/dashboard/admin",
    teacher: "/dashboard/teacher",
    parent: "/dashboard/parent",
    student: "/dashboard/student",
  };
  return <Navigate to={roleDashboards[role] || "/dashboard/admin"} />;
};

// ===== APP ROUTES =====
function AppRoutes() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Restore the server-side session (SANCTUM cookie) on boot.
    dispatch(fetchMe());

    // Reacts to auth:sanctum 401 responses by clearing in-memory state.
    const handleSessionExpired = () => dispatch(clearSession());
    window.addEventListener("session:expired", handleSessionExpired);
    window.addEventListener("session:ended", handleSessionExpired);

    return () => {
      window.removeEventListener("session:expired", handleSessionExpired);
      window.removeEventListener("session:ended", handleSessionExpired);
    };
  }, [dispatch]);

  return (
    <Router>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

        <Routes>
          {/* ===== ACCEPT INVITE ROUTE ===== */}
          <Route path="/accept-invite/:token" element={<AcceptInvite />} />

          {/* ===== PUBLIC ROUTES ===== */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/academics" element={<Academics />} />
            <Route path="/admissions" element={<Admissions />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/news" element={<NewsEvents />} />
          </Route>

          {/* ===== AUTH ROUTES ===== */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* ===== DASHBOARD REDIRECT ===== */}
          <Route path="/dashboard" element={<DashboardRedirect />} />

          {/* ===== ADMIN ROUTES ===== */}
          <Route
            path="/dashboard/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="students" element={<StudentsManagement />} />
            <Route path="teachers" element={<TeachersManagement />} />
            <Route path="classes" element={<ClassesManagement />} />
            <Route path="classes/add" element={<ClassesManagement />} />
            <Route path="announcements" element={<AnnouncementsManagement />} />
            <Route path="registrations" element={<RegistrationsManagement />} />
            <Route path="parents" element={<ParentsManagement />} />
            <Route path="users" element={<UsersManagement />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Profile />} />
            <Route path="subjects" element={<SubjectsManagement />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="contacts" element={<ContactMessages />} />
            <Route path="admissions" element={<AdmissionManagement />} />
            <Route path="/dashboard/admin/assessments" element={<AdminAssessments />} />
            <Route path="payments" element={<PaymentsManagement />} />
          </Route>

          {/* ===== TEACHER ROUTES ===== */}
          <Route
            path="/dashboard/teacher"
            element={
              <ProtectedRoute allowedRoles={["teacher"]}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<TeacherDashboard />} />
            <Route path="my-students" element={<TeacherStudents />} />
            <Route path="assessments" element={<TeacherAssessments />} />
            <Route path="attendance" element={<TeacherAttendance />} />
            <Route path="classes" element={<TeacherClasses />} />
            <Route path="notifications" element={<TeacherNotifications />} />
            <Route path="profile" element={<TeacherProfile />} />
          </Route>

          {/* ===== PARENT ROUTES ===== */}
          <Route
            path="/dashboard/parent"
            element={
              <ProtectedRoute allowedRoles={["parent"]}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ParentDashboard />} />
            <Route path="child-results" element={<ChildResults />} />
            <Route path="announcements" element={<ParentAnnouncements />} />
            <Route path="payments" element={<ParentPayments />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* ===== STUDENT ROUTES ===== */}
          <Route
            path="/dashboard/student"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<StudentDashboard />} />
            <Route path="my-results" element={<StudentResults />} />
            <Route path="profile" element={<Profile />} />
            {/* ✅ FIXED: StudentAnnouncements route with correct path */}
            <Route path="announcements" element={<StudentAnnouncements />} />
            <Route path="payments" element={<StudentPayments />} />
          </Route>

          {/* ===== FALLBACK ===== */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
  );
}

// ===== APP =====
function App() {
  return (
    <Provider store={store}>
      <AppRoutes />
    </Provider>
  );
}

export default App;
