// src/App.jsx
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Provider } from "react-redux";
import { ToastContainer } from "react-toastify";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "react-toastify/dist/ReactToastify.css";
import "./assets/styles/global.css";
import { store } from "./store";

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
import DirectorDashboard from "./components/dashboard/director/DirectorDashboard";
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

// ===== ACCEPT INVITE PAGE =====
import AcceptInvite from "./pages/AcceptInvite";

// ===== TEACHER DEBUG PAGE (temporary placeholder) =====
const TeacherDebug = () => {
  const { isArabic } = useLanguage();
  return (
    <div className="container py-4">
      <h4>{isArabic ? "صفحة التصحيح" : "Debug Page"}</h4>
      <p className="text-muted">
        {isArabic 
          ? "هذه صفحة تصحيح للمعلم" 
          : "This is a teacher debug page"}
      </p>
    </div>
  );
};

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
    phone: "+123 456 7890",
    address: "123 Street, City",
    bio: "",
    role: user?.role || "Admin",
  });

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
      const token = localStorage.getItem("token");
      const isDemo = !token || token.startsWith("demo-");
      if (!isDemo) {
        await api.put("/profile", {
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          address: profile.address,
          bio: profile.bio,
        });
      }
      if (updateUser) updateUser(profile);
      localStorage.setItem("userProfile", JSON.stringify(profile));
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
    const savedProfile = localStorage.getItem("userProfile");
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        setProfile((prev) => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Error loading profile:", e);
      }
    }
  }, []);

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
                <div className="profile-avatar">
                  {getInitials(profile.name)}
                </div>
              </div>
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
      `}</style>
    </div>
  );
};

// ===== SETTINGS COMPONENT =====
const Settings = () => {
  const { isArabic } = useLanguage();
  const { notify } = useNotification();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    schoolName: "Madrassat Al Fath",
    schoolEmail: "info@madrassatalfath.edu",
    schoolPhone: "+123 456 7890",
    schoolAddress: "123 Education Street, City",
    schoolDescription: "Nurturing Young Minds with Islamic Values",
    schoolWebsite: "www.madrassatalfath.edu",
    academicYearStart: "2026-09-01",
    academicYearEnd: "2027-06-30",
    weekendDays: ["Friday", "Saturday"],
    language: "en",
    currency: "USD",
    enableRegistration: true,
    enableAttendance: true,
    enableGrades: true,
    enableNotifications: true,
    maintenanceMode: false,
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem("schoolSettings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings((prev) => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Error loading settings:", e);
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem("schoolSettings", JSON.stringify(settings));
      setLoading(false);
      notify(
        isArabic ? "تم حفظ الإعدادات بنجاح" : "Settings saved successfully",
        "success",
      );
    }, 1000);
  };

  const handleReset = () => {
    if (
      window.confirm(
        isArabic
          ? "هل أنت متأكد من إعادة تعيين الإعدادات؟"
          : "Are you sure you want to reset settings?",
      )
    ) {
      localStorage.removeItem("schoolSettings");
      setSettings({
        schoolName: "Madrassat Al Fath",
        schoolEmail: "info@madrassatalfath.edu",
        schoolPhone: "+123 456 7890",
        schoolAddress: "123 Education Street, City",
        schoolDescription: "Nurturing Young Minds with Islamic Values",
        schoolWebsite: "www.madrassatalfath.edu",
        academicYearStart: "2026-09-01",
        academicYearEnd: "2027-06-30",
        weekendDays: ["Friday", "Saturday"],
        language: "en",
        currency: "USD",
        enableRegistration: true,
        enableAttendance: true,
        enableGrades: true,
        enableNotifications: true,
        maintenanceMode: false,
      });
      notify(
        isArabic ? "تم إعادة تعيين الإعدادات" : "Settings reset successfully",
        "info",
      );
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold">{isArabic ? "الإعدادات" : "Settings"}</h2>
          <p className="text-muted">
            {isArabic ? "تكوين إعدادات المدرسة" : "Configure school settings"}
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button
            variant="outline-secondary"
            onClick={handleReset}
            disabled={loading}
          >
            {isArabic ? "إعادة تعيين" : "Reset"}
          </Button>
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
                {isArabic ? "حفظ الإعدادات" : "Save Settings"}
              </>
            )}
          </Button>
        </div>
      </div>

      <Row className="g-4">
        <Col md={6}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Header className="bg-transparent border-bottom">
              <h6 className="fw-bold mb-0">
                <FaSchool className="me-2 text-primary" />
                {isArabic ? "معلومات المدرسة" : "School Information"}
              </h6>
            </Card.Header>
            <Card.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>
                    {isArabic ? "اسم المدرسة" : "School Name"}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="schoolName"
                    value={settings.schoolName}
                    onChange={handleChange}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>
                    {isArabic ? "البريد الإلكتروني" : "School Email"}
                  </Form.Label>
                  <Form.Control
                    type="email"
                    name="schoolEmail"
                    value={settings.schoolEmail}
                    onChange={handleChange}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>
                    {isArabic ? "رقم الهاتف" : "School Phone"}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="schoolPhone"
                    value={settings.schoolPhone}
                    onChange={handleChange}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>
                    {isArabic ? "العنوان" : "School Address"}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="schoolAddress"
                    value={settings.schoolAddress}
                    onChange={handleChange}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>
                    {isArabic ? "الموقع الإلكتروني" : "Website"}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="schoolWebsite"
                    value={settings.schoolWebsite}
                    onChange={handleChange}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>
                    {isArabic ? "وصف المدرسة" : "School Description"}
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="schoolDescription"
                    value={settings.schoolDescription}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Header className="bg-transparent border-bottom">
              <h6 className="fw-bold mb-0">
                <FaCalendarAlt className="me-2 text-success" />
                {isArabic ? "الإعدادات الأكاديمية" : "Academic Settings"}
              </h6>
            </Card.Header>
            <Card.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>
                    {isArabic ? "بداية العام الدراسي" : "Academic Year Start"}
                  </Form.Label>
                  <Form.Control
                    type="date"
                    name="academicYearStart"
                    value={settings.academicYearStart}
                    onChange={handleChange}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>
                    {isArabic ? "نهاية العام الدراسي" : "Academic Year End"}
                  </Form.Label>
                  <Form.Control
                    type="date"
                    name="academicYearEnd"
                    value={settings.academicYearEnd}
                    onChange={handleChange}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>{isArabic ? "العملة" : "Currency"}</Form.Label>
                  <Form.Select
                    name="currency"
                    value={settings.currency}
                    onChange={handleChange}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="MAD">MAD (د.م.)</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>
                    {isArabic ? "اللغة الافتراضية" : "Default Language"}
                  </Form.Label>
                  <Form.Select
                    name="language"
                    value={settings.language}
                    onChange={handleChange}
                  >
                    <option value="en">English</option>
                    <option value="ar">العربية</option>
                  </Form.Select>
                </Form.Group>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col md={12}>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-transparent border-bottom">
              <h6 className="fw-bold mb-0">
                <FaCog className="me-2 text-warning" />
                {isArabic ? "الميزات والإعدادات" : "Features & Settings"}
              </h6>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3}>
                  <Form.Check
                    type="switch"
                    id="enableRegistration"
                    label={isArabic ? "تفعيل التسجيل" : "Enable Registration"}
                    name="enableRegistration"
                    checked={settings.enableRegistration}
                    onChange={handleChange}
                    className="mb-2"
                  />
                </Col>
                <Col md={3}>
                  <Form.Check
                    type="switch"
                    id="enableAttendance"
                    label={isArabic ? "تفعيل الحضور" : "Enable Attendance"}
                    name="enableAttendance"
                    checked={settings.enableAttendance}
                    onChange={handleChange}
                    className="mb-2"
                  />
                </Col>
                <Col md={3}>
                  <Form.Check
                    type="switch"
                    id="enableGrades"
                    label={isArabic ? "تفعيل الدرجات" : "Enable Grades"}
                    name="enableGrades"
                    checked={settings.enableGrades}
                    onChange={handleChange}
                    className="mb-2"
                  />
                </Col>
                <Col md={3}>
                  <Form.Check
                    type="switch"
                    id="enableNotifications"
                    label={
                      isArabic ? "تفعيل الإشعارات" : "Enable Notifications"
                    }
                    name="enableNotifications"
                    checked={settings.enableNotifications}
                    onChange={handleChange}
                    className="mb-2"
                  />
                </Col>
              </Row>
              <Row className="mt-3">
                <Col md={6}>
                  <Form.Check
                    type="switch"
                    id="maintenanceMode"
                    label={
                      <span
                        className={
                          settings.maintenanceMode ? "text-danger" : ""
                        }
                      >
                        {isArabic ? "وضع الصيانة" : "Maintenance Mode"}
                      </span>
                    }
                    name="maintenanceMode"
                    checked={settings.maintenanceMode}
                    onChange={handleChange}
                  />
                  {settings.maintenanceMode && (
                    <div className="text-danger small mt-2">
                      <FaExclamationTriangle className="me-1" />
                      {isArabic
                        ? "المدرسة في وضع الصيانة. سيتم تعطيل الوصول."
                        : "School is in maintenance mode. Access will be disabled."}
                    </div>
                  )}
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>
                      {isArabic ? "أيام العطلة" : "Weekend Days"}
                    </Form.Label>
                    <Form.Select
                      name="weekendDays"
                      value={settings.weekendDays.join(",")}
                      onChange={(e) => {
                        const value = e.target.value.split(",").filter(Boolean);
                        setSettings((prev) => ({
                          ...prev,
                          weekendDays: value,
                        }));
                      }}
                    >
                      <option value="Friday,Saturday">
                        {isArabic ? "الجمعة والسبت" : "Friday, Saturday"}
                      </option>
                      <option value="Saturday,Sunday">
                        {isArabic ? "السبت والأحد" : "Saturday, Sunday"}
                      </option>
                      <option value="Friday">
                        {isArabic ? "الجمعة فقط" : "Friday only"}
                      </option>
                      <option value="Sunday">
                        {isArabic ? "الأحد فقط" : "Sunday only"}
                      </option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// ===== PROTECTED ROUTE =====
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    const roleDashboards = {
      admin: "/dashboard/admin",
      director: "/dashboard/director",
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
  const role = localStorage.getItem("role") || "admin";
  const roleDashboards = {
    admin: "/dashboard/admin",
    director: "/dashboard/director",
    teacher: "/dashboard/teacher",
    parent: "/dashboard/parent",
    student: "/dashboard/student",
  };
  return <Navigate to={roleDashboards[role] || "/dashboard/admin"} />;
};

// ===== APP =====
function App() {
  return (
    <Provider store={store}>
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
            <Route path="admissions" element={<AdmissionManagement />} />
            <Route path="payments" element={<PaymentsManagement />} />
          </Route>

          {/* ===== DIRECTOR ROUTES ===== */}
          <Route
            path="/dashboard/director"
            element={
              <ProtectedRoute allowedRoles={["director", "admin"]}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DirectorDashboard />} />
            <Route path="profile" element={<Profile />} />
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
            <Route path="debug" element={<TeacherDebug />} />
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
          </Route>

          {/* ===== FALLBACK ===== */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </Provider>
  );
}

export default App;