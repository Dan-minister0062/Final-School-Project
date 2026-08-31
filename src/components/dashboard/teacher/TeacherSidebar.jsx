// src/components/dashboard/teacher/TeacherSidebar.jsx
import React from "react";
import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../context/LanguageContext";
import { 
  FaChartPie, 
  FaChalkboardTeacher, 
  FaUserGraduate, 
  FaTasks, 
  FaEdit, 
  FaCalendarCheck, 
  FaBell, 
  FaUserCircle, 
  FaSignOutAlt,
  FaGraduationCap,
  FaUser
} from "react-icons/fa";

const TeacherSidebar = () => {
  const { user, logout } = useAuth();
  const { isArabic } = useLanguage();

  const menuItems = [
    {
      path: "/dashboard/teacher",
      icon: <FaChartPie />,
      label: isArabic ? "لوحة التحكم" : "Dashboard",
    },
    {
      path: "/dashboard/teacher/classes",
      icon: <FaChalkboardTeacher />,
      label: isArabic ? "فصولي" : "My Classes",
    },
    {
      path: "/dashboard/teacher/my-students",
      icon: <FaUserGraduate />,
      label: isArabic ? "طلابي" : "My Students",
    },
    {
      path: "/dashboard/teacher/assessments",
      icon: <FaTasks />,
      label: isArabic ? "التقييمات" : "Assessments",
    },
    {
      path: "/dashboard/teacher/attendance",
      icon: <FaCalendarCheck />,
      label: isArabic ? "الحضور" : "Attendance",
    },
    {
      path: "/dashboard/teacher/notifications",
      icon: <FaBell />,
      label: isArabic ? "الإشعارات" : "Notifications",
    },
    {
      path: "/dashboard/teacher/profile",
      icon: <FaUserCircle />,
      label: isArabic ? "الملف الشخصي" : "My Profile",
    },
  ];

  const handleLogout = () => {
    if (logout) {
      logout();
    } else {
      // Fallback logout
      localStorage.removeItem('currentUser');
      window.location.href = '/login';
    }
  };

  return (
    <div
      className="teacher-sidebar bg-dark text-white"
      style={{ width: "250px", minHeight: "100vh" }}
    >
      <div className="sidebar-header p-3">
        <h5 className="mb-0">
          <FaChalkboardTeacher className="me-2" />
          {isArabic ? "بوابة المعلم" : "Teacher Portal"}
        </h5>
        <small className="text-muted">{user?.name || user?.firstName || "Teacher"}</small>
      </div>

      <nav className="nav flex-column p-3">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `nav-link text-white py-2 px-3 mb-1 ${isActive ? "active bg-primary" : "hover-bg-light"}`
            }
            style={{ borderRadius: "8px" }}
          >
            <span className="me-3">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer p-3 position-absolute bottom-0 w-100">
        <div className="d-flex align-items-center">
          <div className="user-avatar me-2">
            {user?.profilePhoto ? (
              <img
                src={user.profilePhoto}
                alt={user.name}
                className="rounded-circle"
                style={{ width: "32px", height: "32px", objectFit: "cover" }}
              />
            ) : (
              <div
                className="rounded-circle bg-secondary d-flex align-items-center justify-content-center"
                style={{ width: "32px", height: "32px" }}
              >
                <FaUser />
              </div>
            )}
          </div>
          <div className="user-info">
            <small
              className="d-block text-truncate"
              style={{ maxWidth: "150px" }}
            >
              {user?.name || user?.firstName || "Teacher"}
            </small>
            <small className="text-muted">
              {isArabic ? "معلم" : "Teacher"}
            </small>
          </div>
        </div>
        <button
          className="btn btn-outline-secondary w-100 mt-2"
          onClick={handleLogout}
          style={{ fontSize: "0.85rem" }}
        >
          <FaSignOutAlt className="me-2" />
          {isArabic ? "تسجيل خروج" : "Logout"}
        </button>
      </div>

      <style>{`
        .teacher-sidebar {
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
          z-index: 1000;
          transition: all 0.3s;
        }
        .teacher-sidebar .nav-link {
          transition: all 0.2s;
          cursor: pointer;
          display: flex;
          align-items: center;
        }
        .teacher-sidebar .nav-link:hover:not(.active) {
          background-color: rgba(255, 255, 255, 0.1);
        }
        .teacher-sidebar .nav-link.active {
          background-color: #0d6efd;
          color: white;
        }
        .sidebar-footer {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 20px;
        }
        .sidebar-footer .user-info {
          flex: 1;
          min-width: 0;
        }
        @media (max-width: 768px) {
          .teacher-sidebar {
            width: 60px !important;
          }
          .teacher-sidebar .nav-link span,
          .teacher-sidebar .sidebar-header h5,
          .teacher-sidebar .sidebar-header small,
          .teacher-sidebar .sidebar-footer .user-info,
          .teacher-sidebar .sidebar-footer .btn {
            display: none;
          }
          .teacher-sidebar .sidebar-footer {
            padding: 10px;
          }
          .teacher-sidebar .nav-link {
            justify-content: center;
            padding: 10px !important;
          }
          .teacher-sidebar .nav-link .me-3 {
            margin-right: 0 !important;
          }
        }
        /* RTL Support */
        [dir="rtl"] .teacher-sidebar .nav-link .me-3 {
          margin-right: 0 !important;
          margin-left: 1rem !important;
        }
        [dir="rtl"] .teacher-sidebar .sidebar-footer .me-2 {
          margin-right: 0 !important;
          margin-left: 0.5rem !important;
        }
      `}</style>
    </div>
  );
};

export default TeacherSidebar;