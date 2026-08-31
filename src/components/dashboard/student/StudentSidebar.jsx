// src/components/dashboard/student/StudentSidebar.jsx
import React, { useState, useEffect } from "react";
import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../context/LanguageContext";
import {
  FaChartPie,
  FaGraduationCap,
  FaTasks,
  FaCalendarCheck,
  FaBell,
  FaUserCircle,
  FaSignOutAlt,
  FaBook,
  FaUser,
  FaBullhorn,
} from "react-icons/fa";
import { Badge } from "react-bootstrap";

const StudentSidebar = () => {
  const { user, logout } = useAuth();
  const { isArabic } = useLanguage();
  const [unreadCount, setUnreadCount] = useState(0);

  // ===== Get unread notifications count =====
  const getUnreadCount = () => {
    try {
      const allNotifications = JSON.parse(
        localStorage.getItem("school_notifications") || "[]"
      );
      
      // Filter notifications for this student
      const userEmail = user?.email || "";
      const userRole = user?.role || "student";
      
      const unread = allNotifications.filter(n => {
        // Check if notification is for this user
        const isForUser = n.recipientEmail === userEmail || 
                          n.recipientRole === userRole || 
                          n.recipientRole === "all";
        
        // Check target audience
        let isTargeted = false;
        if (n.targetAudience) {
          isTargeted = n.targetAudience.includes("all") || 
                       n.targetAudience.includes("students");
        } else {
          isTargeted = true;
        }
        
        return isForUser && isTargeted && !n.read;
      }).length;
      
      return unread;
    } catch (error) {
      console.error("Error getting unread count:", error);
      return 0;
    }
  };

  // ===== Load unread count on mount and listen for changes =====
  useEffect(() => {
    const updateUnreadCount = () => {
      setUnreadCount(getUnreadCount());
    };

    updateUnreadCount();

    // Listen for storage changes
    const handleStorageChange = (e) => {
      if (e.key === "school_notifications") {
        updateUnreadCount();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // Listen for custom events
    const handleNotificationAdded = () => {
      updateUnreadCount();
    };
    window.addEventListener("notificationAdded", handleNotificationAdded);
    window.addEventListener("newNotification", handleNotificationAdded);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("notificationAdded", handleNotificationAdded);
      window.removeEventListener("newNotification", handleNotificationAdded);
    };
  }, [user]);

  // ===== MENU ITEMS =====
  const menuItems = [
    {
      path: "/dashboard/student",
      icon: <FaChartPie />,
      label: isArabic ? "لوحة التحكم" : "Dashboard",
      end: true,
    },
    {
      path: "/dashboard/student/classes",
      icon: <FaBook />,
      label: isArabic ? "فصولي" : "My Classes",
    },
    {
      path: "/dashboard/student/results",
      icon: <FaGraduationCap />,
      label: isArabic ? "نتائجي الدراسية" : "My Results",
    },
    {
      path: "/dashboard/student/assessments",
      icon: <FaTasks />,
      label: isArabic ? "التقييمات" : "Assessments",
    },
    {
      path: "/dashboard/student/attendance",
      icon: <FaCalendarCheck />,
      label: isArabic ? "الحضور" : "Attendance",
    },
    {
      path: "/dashboard/student/announcements",
      icon: <FaBullhorn />,
      label: isArabic ? "الإعلانات" : "Announcements",
      badge: unreadCount,
    },
    {
      path: "/dashboard/student/notifications",
      icon: <FaBell />,
      label: isArabic ? "الإشعارات" : "Notifications",
      badge: unreadCount,
    },
    {
      path: "/dashboard/student/profile",
      icon: <FaUserCircle />,
      label: isArabic ? "الملف الشخصي" : "My Profile",
    },
  ];

  const handleLogout = () => {
    if (logout) {
      logout();
    } else {
      localStorage.removeItem("currentUser");
      window.location.href = "/login";
    }
  };

  return (
    <div
      className="student-sidebar bg-dark text-white"
      style={{ width: "250px", minHeight: "100vh" }}
    >
      <div className="sidebar-header p-3">
        <h5 className="mb-0">
          <FaGraduationCap className="me-2" />
          {isArabic ? "بوابة الطالب" : "Student Portal"}
        </h5>
        <small className="text-muted">
          {user?.name || user?.firstName || "Student"}
        </small>
      </div>

      <nav className="nav flex-column p-3">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end || false}
            className={({ isActive }) =>
              `nav-link text-white py-2 px-3 mb-1 ${isActive ? "active bg-primary" : "hover-bg-light"}`
            }
            style={{ borderRadius: "8px", position: "relative" }}
          >
            <span className="me-3">{item.icon}</span>
            {item.label}
            {item.badge > 0 && (
              <Badge
                pill
                bg="danger"
                className="ms-auto"
                style={{
                  fontSize: "0.6rem",
                  padding: "2px 8px",
                  animation: "pulse-badge 2s infinite",
                }}
              >
                {item.badge}
              </Badge>
            )}
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
              {user?.name || user?.firstName || "Student"}
            </small>
            <small className="text-muted">
              {isArabic ? "طالب" : "Student"}
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
        @keyframes pulse-badge {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        .student-sidebar {
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
          z-index: 1000;
          transition: all 0.3s;
        }
        .student-sidebar .nav-link {
          transition: all 0.2s;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .student-sidebar .nav-link:hover:not(.active) {
          background-color: rgba(255, 255, 255, 0.1);
        }
        .student-sidebar .nav-link.active {
          background-color: #0d6efd;
          color: white;
        }
        .student-sidebar .nav-link .me-3 {
          margin-right: 1rem;
          font-size: 1.1rem;
          flex-shrink: 0;
        }
        .sidebar-footer {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 20px;
          background: #212529;
        }
        .sidebar-footer .user-info {
          flex: 1;
          min-width: 0;
        }
        .sidebar-footer .btn-outline-secondary {
          color: #adb5bd;
          border-color: #495057;
        }
        .sidebar-footer .btn-outline-secondary:hover {
          color: white;
          background-color: #495057;
        }

        /* Scrollbar styling */
        .student-sidebar::-webkit-scrollbar {
          width: 4px;
        }
        .student-sidebar::-webkit-scrollbar-track {
          background: #2d2d44;
        }
        .student-sidebar::-webkit-scrollbar-thumb {
          background: #495057;
          border-radius: 4px;
        }
        .student-sidebar::-webkit-scrollbar-thumb:hover {
          background: #6c757d;
        }

        @media (max-width: 768px) {
          .student-sidebar {
            width: 60px !important;
          }
          .student-sidebar .nav-link span,
          .student-sidebar .sidebar-header h5,
          .student-sidebar .sidebar-header small,
          .student-sidebar .sidebar-footer .user-info,
          .student-sidebar .sidebar-footer .btn {
            display: none;
          }
          .student-sidebar .sidebar-footer {
            padding: 10px;
          }
          .student-sidebar .nav-link {
            justify-content: center;
            padding: 10px !important;
          }
          .student-sidebar .nav-link .me-3 {
            margin-right: 0 !important;
          }
          .student-sidebar .nav-link .badge {
            position: absolute;
            top: -2px;
            right: -2px;
            font-size: 0.5rem;
            padding: 2px 6px;
          }
          .student-sidebar .sidebar-header {
            padding: 10px !important;
            text-align: center;
          }
          .student-sidebar .sidebar-header h5 {
            display: none;
          }
          .student-sidebar .sidebar-header .me-2 {
            margin-right: 0 !important;
            font-size: 1.3rem;
          }
        }

        /* RTL Support */
        [dir="rtl"] .student-sidebar .nav-link .me-3 {
          margin-right: 0 !important;
          margin-left: 1rem !important;
        }
        [dir="rtl"] .student-sidebar .sidebar-footer .me-2 {
          margin-right: 0 !important;
          margin-left: 0.5rem !important;
        }
        [dir="rtl"] .student-sidebar .nav-link .badge {
          margin-left: 0 !important;
          margin-right: auto !important;
        }

        /* Dark mode support */
        .dashboard-wrapper.dark-theme .student-sidebar {
          background: #0d1117 !important;
        }
        .dashboard-wrapper.dark-theme .sidebar-footer {
          background: #0d1117 !important;
          border-color: #2d2d44 !important;
        }
        .dashboard-wrapper.dark-theme .student-sidebar .nav-link.active {
          background-color: #1a5f7a !important;
        }
        .dashboard-wrapper.dark-theme .student-sidebar .nav-link:hover:not(.active) {
          background-color: rgba(255, 255, 255, 0.05) !important;
        }
      `}</style>
    </div>
  );
};

export default StudentSidebar;