// src/components/dashboard/parent/ParentAnnouncements.jsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Button,
  Form,
  InputGroup,
  Pagination,
  Modal,
} from "react-bootstrap";
import {
  FaBullhorn,
  FaCalendarAlt,
  FaClock,
  FaUser,
  FaTag,
  FaEye,
  FaHeart,
  FaRegHeart,
  FaComment,
  FaShare,
  FaSearch,
  FaArrowRight,
  FaSync,
  FaBell,
  FaStar,
  FaRegStar,
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaPaperPlane,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaBuilding,
  FaUsers,
  FaGraduationCap,
  FaChalkboardTeacher,
  FaFileAlt,
  FaImage,
  FaVideo,
  FaPlayCircle,
  FaTimes,
  FaLink,
  FaWhatsapp,
  FaTwitter,
  FaFacebook,
  FaSpinner,
  FaChild,
  FaUserGraduate,
  FaBookOpen,
  FaClipboardList,
  FaHourglassHalf,
  FaCheckDouble,
  FaMoneyBillWave,
  FaTrash,
  FaTrashAlt,
  FaExclamationCircle
} from "react-icons/fa";
import { useLanguage } from "../../../context/LanguageContext";
import { getTranslation } from "../../../utils/translations";
import { useNotification } from "../../../hooks/useNotification";
import { useAuth } from "../../../hooks/useAuth";

// ===== ARABIC FONT STYLE =====
const getArabicFontStyle = (isArabic) => ({
  fontFamily: isArabic
    ? '"Hacen Tunisia", "Hacen Tunisia Bd", "Noto Sans Arabic", "Vazirmatn", "Traditional Arabic", "Arabic Typesetting", serif'
    : "inherit",
  lineHeight: isArabic ? "1.8" : "1.6",
  letterSpacing: isArabic ? "0.5px" : "0px",
  fontSize: isArabic
    ? "clamp(0.9rem, 1.1vw, 1.05rem)"
    : "clamp(0.85rem, 1vw, 1rem)",
});

// ===== NUMBER FORMATTING - ALWAYS ENGLISH =====
const formatNumber = (num) => {
  if (num === undefined || num === null) return "0";
  return num.toString();
};

// ===== Map announcement from localStorage =====
const mapAnnouncement = (a) => ({
  id: a.id || `ANN${Date.now()}`,
  title: a.title || "Announcement",
  titleAr: a.titleAr || a.title || "إشعار",
  content: a.content || "",
  contentAr: a.contentAr || a.content || "",
  type: a.type || "announcement",
  priority: a.priority || "medium",
  date: a.date || new Date().toISOString().split("T")[0],
  time:
    a.time ||
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  author: a.author || "Admin",
  authorAr: a.authorAr || a.author || "المسؤول",
  image: a.image || null,
  video: a.video || null,
  mediaType: a.mediaType || "none",
  views: a.views || 0,
  likes: a.likes || 0,
  comments: a.comments || 0,
  targetAudience: a.targetAudience || ["all"],
  isRead: a.isRead || false,
  isImportant: a.priority === "high",
  category: a.type || "announcement",
  studentId: a.studentId || null,
  studentName: a.studentName || null,
  createdAt: a.createdAt || new Date().toISOString(),
});

const ParentAnnouncements = () => {
  const { language, isArabic } = useLanguage();
  const t = (key) => getTranslation(key, language);
  const { notify } = useNotification();
  const { user } = useAuth();

  const [announcements, setAnnouncements] = useState([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showReadMoreModal, setShowReadMoreModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [likedItems, setLikedItems] = useState({});
  const [hoveredCard, setHoveredCard] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [children, setChildren] = useState([]);
  
  // ===== DELETE MODAL STATE =====
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  
  const itemsPerPage = 6;

  // ===== ARABIC FONT STYLE =====
  const arabicFontStyle = getArabicFontStyle(isArabic);

  // ===== CHECK DARK MODE =====
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark =
        document.documentElement.getAttribute("data-bs-theme") === "dark" ||
        document.querySelector(".dashboard-wrapper.dark-theme") !== null;
      setDarkMode(isDark);
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-bs-theme"],
    });
    return () => observer.disconnect();
  }, []);

  // ===== LOAD CHILDREN =====
  const loadChildren = () => {
    try {
      const currentUser = JSON.parse(
        localStorage.getItem("currentUser") || "{}",
      );
      const userId =
        currentUser?.id || user?.id || localStorage.getItem("userId");

      let allStudents = JSON.parse(
        localStorage.getItem("school_students") || "[]",
      );

      if (allStudents.length === 0) {
        const allUsers = JSON.parse(
          localStorage.getItem("school_users") || "[]",
        );
        allStudents = allUsers.filter((u) => u.role === "student");
      }

      let parentChildren = [];

      if (userId) {
        parentChildren = allStudents.filter((s) => s.parentId === userId);
      }

      if (parentChildren.length === 0) {
        const parentName = currentUser?.name || user?.name || "";
        if (parentName) {
          parentChildren = allStudents.filter(
            (s) => s.parentName === parentName,
          );
        }
      }

      if (parentChildren.length === 0) {
        const parents = JSON.parse(
          localStorage.getItem("school_parents") || "[]",
        );
        const currentParent = parents.find(
          (p) => p.id === userId || p.email === currentUser?.email,
        );

        if (currentParent) {
          const childNames = currentParent.childrenNames
            ? currentParent.childrenNames.split(",").map((n) => n.trim())
            : [];

          if (childNames.length > 0) {
            parentChildren = allStudents.filter((s) => {
              const studentName = s.name || s.firstName || "";
              return childNames.some(
                (childName) =>
                  studentName.includes(childName) ||
                  childName.includes(studentName),
              );
            });
          }
        }
      }

      setChildren(parentChildren);
    } catch (error) {
      console.error("Error loading children:", error);
    }
  };

  // ===== LOAD ANNOUNCEMENTS =====
  const loadAnnouncements = () => {
    setLoading(true);
    try {
      console.log("📢 Loading announcements...");

      // Get notifications from localStorage
      const allNotifications = JSON.parse(
        localStorage.getItem("school_notifications") || "[]",
      );
      console.log("📢 All notifications:", allNotifications.length);

      // Get current user
      const currentUser = JSON.parse(
        localStorage.getItem("currentUser") || "{}",
      );
      const userId =
        currentUser?.id || user?.id || localStorage.getItem("userId");

      // Get children IDs for filtering
      const childIds = children.map((c) => c.id);

      // Filter notifications for this parent
      let parentNotifications = allNotifications.filter((n) => {
        // Check if notification is for parent
        const isForParent =
          n.recipientRole === "parent" || n.recipientRole === "all";
        const isForStudent = n.studentId && childIds.includes(n.studentId);
        const isForStudentName =
          n.studentName &&
          children.some(
            (c) => c.name === n.studentName || c.name?.includes(n.studentName),
          );
        const isForAll = !n.recipientRole || n.recipientRole === "all";

        return isForParent || isForStudent || isForStudentName || isForAll;
      });

      console.log(
        "📢 Filtered notifications for parent:",
        parentNotifications.length,
      );

      // Map to announcements format
      const mappedAnnouncements = parentNotifications.map((n) => ({
        id: n.id || `ANN${Date.now()}`,
        title: n.title || "Announcement",
        titleAr: n.titleAr || n.title || "إشعار",
        content: n.message || n.content || "",
        contentAr: n.messageAr || n.content || "",
        type: n.type || "announcement",
        priority: n.priority || "medium",
        date: n.createdAt
          ? new Date(n.createdAt).toLocaleDateString()
          : new Date().toLocaleDateString(),
        time: n.createdAt
          ? new Date(n.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
        author: n.teacherName || n.author || "Admin",
        authorAr: n.teacherName || n.author || "المسؤول",
        image: n.image || null,
        video: n.video || null,
        mediaType: n.mediaType || "none",
        views: n.views || 0,
        likes: n.likes || 0,
        comments: n.comments || 0,
        targetAudience: n.targetAudience || ["all"],
        isRead: n.read || false,
        isImportant: n.priority === "high",
        category: n.type || "announcement",
        studentId: n.studentId || null,
        studentName: n.studentName || null,
        createdAt: n.createdAt || new Date().toISOString(),
      }));

      // Sort by date (newest first)
      mappedAnnouncements.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );

      setAnnouncements(mappedAnnouncements);
    } catch (error) {
      console.error("Error loading announcements:", error);
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  // ===== LISTEN FOR UPDATES =====
  useEffect(() => {
    loadChildren();
  }, [user]);

  useEffect(() => {
    if (children.length > 0 || children.length === 0) {
      loadAnnouncements();
    }
  }, [children]);

  // ===== LISTEN FOR STORAGE CHANGES =====
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "school_notifications") {
        console.log("🔄 Notifications updated, refreshing");
        loadAnnouncements();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    const handleNotificationAdded = () => {
      console.log("🔔 Notification added, refreshing");
      loadAnnouncements();
    };
    window.addEventListener("notificationAdded", handleNotificationAdded);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("notificationAdded", handleNotificationAdded);
    };
  }, []);

  // ===== FILTER ANNOUNCEMENTS =====
  useEffect(() => {
    let filtered = announcements;

    if (selectedCategory !== "all") {
      filtered = filtered.filter((a) => a.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          (isArabic ? a.titleAr : a.title).toLowerCase().includes(query) ||
          (isArabic ? a.contentAr : a.content).toLowerCase().includes(query) ||
          (isArabic ? a.authorAr : a.author).toLowerCase().includes(query),
      );
    }

    setFilteredAnnouncements(filtered);
    setCurrentPage(1);
  }, [selectedCategory, searchQuery, announcements, isArabic]);

  // ===== CATEGORY HELPERS =====
  const getCategoryColor = (category) => {
    const colors = {
      announcement: "#0dcaf0",
      event: "#198754",
      meeting: "#ffc107",
      exam: "#dc3545",
      news: "#6f42c1",
      submission: "#0d6efd",
      grade: "#2ecc71",
      payment: "#f39c12",
    };
    return colors[category] || "#6c757d";
  };

  const getCategoryIcon = (category) => {
    const icons = {
      announcement: <FaBullhorn />,
      event: <FaCalendarAlt />,
      meeting: <FaUsers />,
      exam: <FaCheckCircle />,
      news: <FaTag />,
      submission: <FaPaperPlane />,
      grade: <FaStar />,
      payment: <FaMoneyBillWave />,
    };
    return icons[category] || <FaTag />;
  };

  const getCategoryLabel = (category) => {
    const labels = {
      announcement: t("Announcement"),
      event: t("Event"),
      meeting: t("Meeting"),
      exam: t("Exam"),
      news: t("News"),
      submission: t("Submission"),
      grade: t("Grade"),
      payment: t("Payment"),
    };
    return labels[category] || category;
  };

  const getPriorityBadge = (priority) => {
    const priorities = {
      high: { bg: "danger", label: t("High") },
      medium: { bg: "warning", label: t("Medium") },
      low: { bg: "success", label: t("Low") },
    };
    return priorities[priority] || priorities.medium;
  };

  const getGradient = (category) => {
    const gradients = {
      announcement: "linear-gradient(90deg, #0dcaf0, #0d6efd)",
      event: "linear-gradient(90deg, #198754, #28a745)",
      meeting: "linear-gradient(90deg, #ffc107, #fd7e14)",
      exam: "linear-gradient(90deg, #dc3545, #e74c3c)",
      news: "linear-gradient(90deg, #6f42c1, #8e44ad)",
      submission: "linear-gradient(90deg, #0d6efd, #4a9eff)",
      grade: "linear-gradient(90deg, #2ecc71, #27ae60)",
      payment: "linear-gradient(90deg, #f39c12, #e67e22)",
    };
    return gradients[category] || "linear-gradient(90deg, #6c757d, #adb5bd)";
  };

  // ===== HANDLE LIKE =====
  const handleLike = (id) => {
    setLikedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
    setAnnouncements((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const isLiked = likedItems[id];
          return {
            ...a,
            likes: isLiked ? (a.likes || 0) - 1 : (a.likes || 0) + 1,
          };
        }
        return a;
      }),
    );
  };

  // ===== HANDLE MARK AS READ =====
  const handleMarkAsRead = (id) => {
    setAnnouncements((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          return { ...a, isRead: true };
        }
        return a;
      }),
    );
    // Update in localStorage
    const allNotifications = JSON.parse(
      localStorage.getItem("school_notifications") || "[]",
    );
    const notification = allNotifications.find((n) => n.id === id);
    if (notification) {
      notification.read = true;
      localStorage.setItem(
        "school_notifications",
        JSON.stringify(allNotifications),
      );
    }
    notify(t("Announcement marked as read"), "info");
  };

  // ===== HANDLE MARK ALL AS READ =====
  const handleMarkAllAsRead = () => {
    setAnnouncements((prev) => prev.map((a) => ({ ...a, isRead: true })));
    const allNotifications = JSON.parse(
      localStorage.getItem("school_notifications") || "[]",
    );
    allNotifications.forEach((n) => {
      if (announcements.some((a) => a.id === n.id)) {
        n.read = true;
      }
    });
    localStorage.setItem(
      "school_notifications",
      JSON.stringify(allNotifications),
    );
    notify(t("All announcements marked as read"), "success");
  };

  // ===== HANDLE READ MORE =====
  const handleReadMore = (announcement) => {
    setSelectedAnnouncement(announcement);
    setShowReadMoreModal(true);
    if (!announcement.isRead) {
      handleMarkAsRead(announcement.id);
    }
  };

  // ===== HANDLE REFRESH =====
  const handleRefresh = () => {
    setRefreshing(true);
    loadAnnouncements();
    setTimeout(() => {
      setRefreshing(false);
      if (notify) {
        notify(t("Data refreshed successfully"), "info");
      }
    }, 600);
  };

  // ===== HANDLE DELETE ANNOUNCEMENT =====
  const handleDeleteClick = (announcement, e) => {
    e.stopPropagation();
    setAnnouncementToDelete(announcement);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    if (!announcementToDelete) return;
    
    setDeleting(true);
    try {
      // Get all notifications from localStorage
      const allNotifications = JSON.parse(
        localStorage.getItem("school_notifications") || "[]",
      );
      
      // Find and remove the notification
      const notificationIndex = allNotifications.findIndex(
        (n) => n.id === announcementToDelete.id,
      );
      
      if (notificationIndex !== -1) {
        // Remove the notification
        allNotifications.splice(notificationIndex, 1);
        localStorage.setItem(
          "school_notifications",
          JSON.stringify(allNotifications),
        );
        
        // Also check if this notification exists as an announcement in announcements list
        const allAnnouncements = JSON.parse(
          localStorage.getItem("announcements") || "[]",
        );
        const announcementIndex = allAnnouncements.findIndex(
          (a) => a.id === announcementToDelete.id,
        );
        if (announcementIndex !== -1) {
          allAnnouncements.splice(announcementIndex, 1);
          localStorage.setItem("announcements", JSON.stringify(allAnnouncements));
        }
        
        // Update local state
        setAnnouncements((prev) =>
          prev.filter((a) => a.id !== announcementToDelete.id),
        );
        
        notify(
          isArabic ? "تم حذف الإعلان بنجاح" : "Announcement deleted successfully",
          "success"
        );
      } else {
        // If not found in notifications, try to delete from announcements directly
        const allAnnouncements = JSON.parse(
          localStorage.getItem("announcements") || "[]",
        );
        const announcementIndex = allAnnouncements.findIndex(
          (a) => a.id === announcementToDelete.id,
        );
        if (announcementIndex !== -1) {
          allAnnouncements.splice(announcementIndex, 1);
          localStorage.setItem("announcements", JSON.stringify(allAnnouncements));
          
          // Update local state
          setAnnouncements((prev) =>
            prev.filter((a) => a.id !== announcementToDelete.id),
          );
          
          notify(
            isArabic ? "تم حذف الإعلان بنجاح" : "Announcement deleted successfully",
            "success"
          );
        } else {
          notify(
            isArabic ? "لم يتم العثور على الإعلان" : "Announcement not found",
            "warning"
          );
        }
      }
      
      // Close modal
      setShowDeleteModal(false);
      setAnnouncementToDelete(null);
      
      // Refresh the list
      loadAnnouncements();
    } catch (error) {
      console.error("Error deleting announcement:", error);
      notify(
        isArabic ? "فشل في حذف الإعلان" : "Failed to delete announcement",
        "error"
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setAnnouncementToDelete(null);
    setDeleting(false);
  };

  // ===== CATEGORIES =====
  const categories = [
    { value: "all", label: t("All") },
    { value: "announcement", label: t("Announcements") },
    { value: "event", label: t("Events") },
    { value: "meeting", label: t("Meetings") },
    { value: "exam", label: t("Exams") },
    { value: "news", label: t("News") },
    { value: "submission", label: t("Submissions") },
    { value: "grade", label: t("Grades") },
  ];

  // ===== PAGINATION =====
  const totalPages = Math.ceil(filteredAnnouncements.length / itemsPerPage);
  const displayedAnnouncements = filteredAnnouncements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const unreadCount = announcements.filter((a) => !a.isRead).length;

  // ===== STATS CARDS - Smaller White Cards =====
  const stats = [
    {
      label: t("Total"),
      value: formatNumber(announcements.length),
      icon: <FaBullhorn />,
      gradient: "linear-gradient(135deg, #667eea, #764ba2)",
    },
    {
      label: t("Unread"),
      value: formatNumber(unreadCount),
      icon: <FaBell />,
      gradient: "linear-gradient(135deg, #f2994a, #f2c94c)",
    },
    {
      label: t("Important"),
      value: formatNumber(announcements.filter((a) => a.isImportant).length),
      icon: <FaStar />,
      gradient: "linear-gradient(135deg, #eb3349, #f45c43)",
    },
    {
      label: t("Events"),
      value: formatNumber(
        announcements.filter(
          (a) => a.category === "event" || a.category === "meeting",
        ).length,
      ),
      icon: <FaCalendarAlt />,
      gradient: "linear-gradient(135deg, #11998e, #38ef7d)",
    },
  ];

  if (loading) {
    return (
      <div className="text-center py-5" dir={isArabic ? "rtl" : "ltr"}>
        <div
          className="spinner-border text-primary"
          role="status"
          style={{ width: "3rem", height: "3rem" }}
        >
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted" style={arabicFontStyle}>
          {t("Loading...")}
        </p>
      </div>
    );
  }

  return (
    <div className="parent-announcements-page" dir={isArabic ? "rtl" : "ltr"}>
      {/* ===== HEADER ===== */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <h4
            className="fw-bold mb-1"
            style={{
              ...arabicFontStyle,
              color: "#1a5f7a",
              fontSize: "clamp(1.2rem, 2.1vw, 2rem)",
            }}
          >
            <FaBullhorn className="me-2" />
            {t("Announcements")}
          </h4>
          <p
            className="text-muted mb-0"
            style={{
              ...arabicFontStyle,
              fontSize: "clamp(0.85rem, 0.95vw, 1rem)",
            }}
          >
            {t("Stay updated with the latest announcements and updates")}
          </p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          {unreadCount > 0 && (
            <Button
              variant="outline-primary"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="d-flex align-items-center gap-1"
              style={{
                borderRadius: "50px",
                ...arabicFontStyle,
                fontSize: "clamp(0.7rem, 0.8vw, 0.85rem)",
              }}
            >
              <FaCheckDouble /> {t("Mark all as read")}
            </Button>
          )}
          <Button
            variant="outline-primary"
            size="sm"
            className="d-flex align-items-center gap-1"
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              borderRadius: "50px",
              ...arabicFontStyle,
              fontSize: "clamp(0.7rem, 0.8vw, 0.85rem)",
            }}
          >
            <FaSync className={refreshing ? "spinning" : ""} /> {t("Refresh")}
          </Button>
        </div>
      </div>

      {/* ===== STATS CARDS - Smaller White Cards ===== */}
      <Row className="g-3 mb-4">
        {stats.map((stat, index) => (
          <Col key={index} xs={6} sm={6} md={3}>
            <div
              className="stat-card-small"
              style={{
                background: darkMode ? "#1a1a2e" : "#ffffff",
                border: `1px solid ${darkMode ? "#2d2d44" : "#e9ecef"}`,
                borderRadius: "12px",
                overflow: "hidden",
                transition: "all 0.3s ease",
                height: "clamp(80px, 10vw, 95px)",
              }}
            >
              <div
                className="stat-card-top-bar"
                style={{
                  height: "3px",
                  background: stat.gradient,
                }}
              ></div>
              <div
                className="stat-card-body p-3 d-flex align-items-center justify-content-between"
                style={{ height: "calc(100% - 3px)" }}
              >
                <div>
                  <div
                    className="stat-card-label"
                    style={{
                      ...arabicFontStyle,
                      fontSize: "clamp(0.5rem, 0.6vw, 0.65rem)",
                      color: darkMode ? "#adb5bd" : "#6c757d",
                      textTransform: "uppercase",
                      fontWeight: "600",
                      letterSpacing: "0.3px",
                    }}
                  >
                    {stat.label}
                  </div>
                  <div
                    className="stat-card-value"
                    style={{
                      fontSize: "clamp(1.2rem, 1.6vw, 1.6rem)",
                      fontWeight: "700",
                      color: darkMode ? "#e9ecef" : "#212529",
                      lineHeight: "1.2",
                    }}
                  >
                    {stat.value}
                  </div>
                </div>
                <div
                  className="stat-card-icon"
                  style={{
                    width: "clamp(32px, 4vw, 40px)",
                    height: "clamp(32px, 4vw, 40px)",
                    borderRadius: "10px",
                    background: darkMode
                      ? "rgba(26, 95, 122, 0.15)"
                      : "rgba(26, 95, 122, 0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#1a5f7a",
                    fontSize: "clamp(0.8rem, 1vw, 1.1rem)",
                  }}
                >
                  {stat.icon}
                </div>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* ===== SEARCH & FILTER ===== */}
      <Card
        className="shadow-sm border-0 mb-4 modern-card"
        style={{
          background: darkMode ? "#1a1a2e" : "#ffffff",
          border: `1px solid ${darkMode ? "#2d2d44" : "#e9ecef"}`,
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        <div
          className="card-top-bar"
          style={{
            height: "3px",
            background: "linear-gradient(90deg, #1a5f7a, #2a7f9a)",
          }}
        ></div>
        <Card.Body className="p-3">
          <Row className="g-2 align-items-center">
            <Col md={5}>
              <InputGroup>
                <InputGroup.Text
                  style={{
                    background: darkMode ? "#2d2d44" : "#f8f9fa",
                    color: darkMode ? "#adb5bd" : "#6c757d",
                    borderColor: darkMode ? "#3d3d5c" : "#e9ecef",
                  }}
                >
                  <FaSearch size={14} />
                </InputGroup.Text>
                <Form.Control
                  placeholder={t("Search announcements...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    ...arabicFontStyle,
                    background: darkMode ? "#2d2d44" : "#ffffff",
                    color: darkMode ? "#e9ecef" : "#212529",
                    borderColor: darkMode ? "#3d3d5c" : "#e9ecef",
                    fontSize: "clamp(0.8rem, 0.9vw, 0.9rem)",
                  }}
                />
              </InputGroup>
            </Col>
            <Col md={7}>
              <div className="d-flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <Button
                    key={cat.value}
                    variant={
                      selectedCategory === cat.value
                        ? "primary"
                        : "outline-primary"
                    }
                    size="sm"
                    onClick={() => setSelectedCategory(cat.value)}
                    className="category-btn"
                    style={{
                      ...arabicFontStyle,
                      borderRadius: "50px",
                      transition: "all 0.3s ease",
                      boxShadow:
                        selectedCategory === cat.value
                          ? "0 4px 15px rgba(26, 95, 122, 0.3)"
                          : "none",
                      fontSize: "clamp(0.7rem, 0.8vw, 0.85rem)",
                      padding: "4px 14px",
                    }}
                  >
                    {cat.label}
                  </Button>
                ))}
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* ===== RESULTS COUNT ===== */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <p
          className="text-muted small"
          style={{
            ...arabicFontStyle,
            color: darkMode ? "#adb5bd" : "#6c757d",
            fontSize: "clamp(0.7rem, 0.8vw, 0.85rem)",
          }}
        >
          {t("Showing")} {formatNumber(displayedAnnouncements.length)} {t("of")}{" "}
          {formatNumber(filteredAnnouncements.length)} {t("results")}
        </p>
        {unreadCount > 0 && (
          <Badge
            bg="warning"
            className="p-2"
            style={{
              ...arabicFontStyle,
              fontSize: "clamp(0.65rem, 0.75vw, 0.8rem)",
            }}
          >
            {formatNumber(unreadCount)} {t("unread")}
          </Badge>
        )}
      </div>

      {/* ===== ANNOUNCEMENTS GRID ===== */}
      {displayedAnnouncements.length === 0 ? (
        <div className="text-center py-5">
          <div className="display-1 text-muted opacity-25 mb-3">📢</div>
          <h4 style={arabicFontStyle}>{t("No announcements found")}</h4>
          <p className="text-muted" style={arabicFontStyle}>
            {t("No announcements match your search")}
          </p>
        </div>
      ) : (
        <Row className="g-4">
          {displayedAnnouncements.map((announcement) => {
            const isLiked = likedItems[announcement.id];
            const isHovered = hoveredCard === announcement.id;
            const gradient = getGradient(announcement.category);
            const priorityInfo = getPriorityBadge(announcement.priority);
            const categoryColor = getCategoryColor(announcement.category);

            const title = isArabic ? announcement.titleAr : announcement.title;
            const content = isArabic
              ? announcement.contentAr
              : announcement.content;
            const author = isArabic
              ? announcement.authorAr
              : announcement.author;

            return (
              <Col key={announcement.id} md={6} lg={4}>
                <Card
                  className="announcement-card h-100 shadow-sm border-0"
                  onMouseEnter={() => setHoveredCard(announcement.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{
                    background: darkMode ? "#1a1a2e" : "#ffffff",
                    border: `1px solid ${darkMode ? "#2d2d44" : "#e9ecef"}`,
                    transform: isHovered
                      ? "translateY(-6px) scale(1.01)"
                      : "translateY(0) scale(1)",
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    boxShadow: isHovered
                      ? "0 12px 40px rgba(0,0,0,0.1)"
                      : "0 4px 20px rgba(0,0,0,0.05)",
                    borderRadius: "14px",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  {/* Top Gradient Bar */}
                  <div
                    className="card-top-bar"
                    style={{
                      height: isHovered ? "4px" : "3px",
                      background: gradient,
                      transition: "height 0.4s ease",
                    }}
                  ></div>

                  {/* Unread indicator */}
                  {!announcement.isRead && (
                    <div className="unread-indicator">
                      <span className="pulse-dot"></span>
                    </div>
                  )}

                  {/* Delete Button */}
                  <Button
                    variant="danger"
                    size="sm"
                    className="delete-btn"
                    onClick={(e) => handleDeleteClick(announcement, e)}
                    style={{
                      position: "absolute",
                      top: "8px",
                      right: isArabic ? "auto" : "8px",
                      left: isArabic ? "8px" : "auto",
                      zIndex: 20,
                      borderRadius: "50%",
                      width: "32px",
                      height: "32px",
                      padding: "0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: isHovered ? 1 : 0.7,
                      transition: "all 0.3s ease",
                      background: darkMode 
                        ? "rgba(220, 53, 69, 0.2)" 
                        : "rgba(220, 53, 69, 0.1)",
                      border: "none",
                      color: "#dc3545",
                      fontSize: "0.8rem",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#dc3545";
                      e.currentTarget.style.color = "white";
                      e.currentTarget.style.transform = "scale(1.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = darkMode 
                        ? "rgba(220, 53, 69, 0.2)" 
                        : "rgba(220, 53, 69, 0.1)";
                      e.currentTarget.style.color = "#dc3545";
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                    title={isArabic ? "حذف الإعلان" : "Delete announcement"}
                  >
                    <FaTrash size={14} />
                  </Button>

                  <Card.Body className="p-3 p-md-4">
                    {/* Category & Date */}
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <Badge
                        className="category-badge"
                        style={{
                          background: categoryColor,
                          color: "white",
                          transition: "all 0.3s ease",
                          padding: "3px 10px",
                          borderRadius: "50px",
                          fontSize: "clamp(0.55rem, 0.65vw, 0.7rem)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        {getCategoryIcon(announcement.category)}{" "}
                        {getCategoryLabel(announcement.category)}
                      </Badge>
                      <div className="d-flex align-items-center gap-2">
                        {announcement.isImportant && (
                          <Badge
                            bg="danger"
                            className="priority-badge"
                            style={{
                              fontSize: "clamp(0.45rem, 0.55vw, 0.6rem)",
                              padding: "2px 8px",
                              borderRadius: "50px",
                            }}
                          >
                            <FaStar className="me-1" size={10} />{" "}
                            {t("Important")}
                          </Badge>
                        )}
                        <small
                          className="text-muted"
                          style={{
                            ...arabicFontStyle,
                            color: darkMode ? "#adb5bd" : "#6c757d",
                            fontSize: "clamp(0.6rem, 0.7vw, 0.75rem)",
                          }}
                        >
                          <FaCalendarAlt className="me-1" size={11} />
                          {announcement.date}
                        </small>
                      </div>
                    </div>

                    {/* Title */}
                    <h6
                      className="fw-bold mb-2 announcement-title"
                      style={{
                        ...arabicFontStyle,
                        color: darkMode ? "#e9ecef" : "#212529",
                        fontSize: "clamp(0.9rem, 1vw, 1.05rem)",
                      }}
                    >
                      {title}
                    </h6>

                    {/* Content Preview */}
                    <p
                      className="text-muted small announcement-preview"
                      style={{
                        ...arabicFontStyle,
                        color: darkMode ? "#adb5bd" : "#6c757d",
                        fontSize: "clamp(0.75rem, 0.85vw, 0.9rem)",
                        lineHeight: "1.6",
                      }}
                    >
                      {content && content.length > 120
                        ? content.substring(0, 120) + "..."
                        : content || t("No content")}
                    </p>

                    {/* Student info if applicable */}
                    {announcement.studentName && (
                      <div className="d-flex align-items-center gap-1 mt-1">
                        <FaChild size={12} className="text-muted" />
                        <small
                          className="text-muted"
                          style={{
                            ...arabicFontStyle,
                            color: darkMode ? "#adb5bd" : "#6c757d",
                            fontSize: "clamp(0.6rem, 0.7vw, 0.75rem)",
                          }}
                        >
                          {announcement.studentName}
                        </small>
                      </div>
                    )}

                    {/* Author & Time */}
                    <div className="d-flex justify-content-between align-items-center mt-2">
                      <small
                        className="text-muted"
                        style={{
                          ...arabicFontStyle,
                          color: darkMode ? "#adb5bd" : "#6c757d",
                          fontSize: "clamp(0.65rem, 0.75vw, 0.8rem)",
                        }}
                      >
                        <FaUser className="me-1" size={11} /> {author}
                      </small>
                      <small
                        className="text-muted"
                        style={{
                          ...arabicFontStyle,
                          color: darkMode ? "#adb5bd" : "#6c757d",
                          fontSize: "clamp(0.65rem, 0.75vw, 0.8rem)",
                        }}
                      >
                        <FaClock className="me-1" size={11} />{" "}
                        {announcement.time}
                      </small>
                    </div>

                    {/* Engagement */}
                    <div
                      className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top"
                      style={{ borderColor: darkMode ? "#2d2d44" : "#e9ecef" }}
                    >
                      <div className="d-flex gap-3">
                        <small
                          className="engagement-btn like-btn"
                          onClick={() => handleLike(announcement.id)}
                          style={{
                            color: isLiked
                              ? "#dc3545"
                              : darkMode
                                ? "#adb5bd"
                                : "#6c757d",
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                            fontSize: "clamp(0.6rem, 0.7vw, 0.75rem)",
                          }}
                        >
                          {isLiked ? (
                            <FaHeart className="text-danger" />
                          ) : (
                            <FaRegHeart />
                          )}{" "}
                          {formatNumber(announcement.likes)}
                        </small>
                        <small
                          className="text-muted"
                          style={{
                            color: darkMode ? "#adb5bd" : "#6c757d",
                            fontSize: "clamp(0.6rem, 0.7vw, 0.75rem)",
                          }}
                        >
                          <FaEye className="me-1" size={11} />
                          {formatNumber(announcement.views)}
                        </small>
                        <small
                          className="text-muted"
                          style={{
                            color: darkMode ? "#adb5bd" : "#6c757d",
                            fontSize: "clamp(0.6rem, 0.7vw, 0.75rem)",
                          }}
                        >
                          <FaComment className="me-1" size={11} />
                          {formatNumber(announcement.comments)}
                        </small>
                      </div>
                      {!announcement.isRead && (
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 text-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(announcement.id);
                          }}
                          style={{
                            ...arabicFontStyle,
                            textDecoration: "none",
                            fontSize: "clamp(0.6rem, 0.7vw, 0.75rem)",
                          }}
                        >
                          <FaCheckCircle className="me-1" size={11} />{" "}
                          {t("Mark read")}
                        </Button>
                      )}
                    </div>
                  </Card.Body>

                  {/* Footer */}
                  <Card.Footer className="bg-transparent border-0 p-3 pt-0">
                    <div className="d-flex justify-content-between align-items-center">
                      <Button
                        variant="link"
                        className="read-more-btn p-0 d-flex align-items-center gap-1"
                        onClick={() => handleReadMore(announcement)}
                        style={{
                          ...arabicFontStyle,
                          color: "#1a5f7a",
                          textDecoration: "none",
                          fontSize: "clamp(0.7rem, 0.8vw, 0.85rem)",
                        }}
                      >
                        {t("Read More")} <FaArrowRight size={12} />
                      </Button>
                      <small
                        className="text-muted"
                        style={{
                          color: darkMode ? "#6c757d" : "#adb5bd",
                          fontSize: "clamp(0.55rem, 0.65vw, 0.7rem)",
                        }}
                      >
                        {t("Posted on")} {announcement.date}
                      </small>
                    </div>
                  </Card.Footer>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* ===== PAGINATION ===== */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <Pagination className="responsive-pagination">
            <Pagination.Prev
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            />
            {[...Array(totalPages)].map((_, i) => (
              <Pagination.Item
                key={i + 1}
                active={currentPage === i + 1}
                onClick={() => setCurrentPage(i + 1)}
              >
                {formatNumber(i + 1)}
              </Pagination.Item>
            ))}
            <Pagination.Next
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            />
          </Pagination>
        </div>
      )}

      {/* ===== DELETE CONFIRMATION MODAL ===== */}
      <Modal
        show={showDeleteModal}
        onHide={handleDeleteCancel}
        centered
        className="delete-modal modern-modal"
      >
        <Modal.Header
          closeButton
          className="border-0"
          style={{
            background: darkMode ? "#1a1a2e" : "white",
            padding: "16px 24px 0",
            borderBottom: "none",
          }}
        >
          <Modal.Title
            style={{
              ...arabicFontStyle,
              color: darkMode ? "#e9ecef" : "#212529",
              fontSize: "clamp(1rem, 1.2vw, 1.3rem)",
            }}
          >
            <FaExclamationCircle className="text-danger me-2" />
            {isArabic ? "تأكيد الحذف" : "Confirm Delete"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
          style={{
            background: darkMode ? "#0d1117" : "white",
            padding: "16px 24px 20px",
          }}
        >
          <div className="text-center mb-3">
            <div
              className="rounded-circle bg-danger bg-opacity-10 d-inline-flex p-3 mb-3"
              style={{
                width: "64px",
                height: "64px",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FaTrashAlt size={28} className="text-danger" />
            </div>
          </div>
          <p
            style={{
              ...arabicFontStyle,
              fontSize: "clamp(0.9rem, 1vw, 1.05rem)",
              textAlign: "center",
              color: darkMode ? "#e9ecef" : "#212529",
            }}
          >
            {isArabic
              ? `هل أنت متأكد من حذف الإعلان "${announcementToDelete?.title || ''}"؟`
              : `Are you sure you want to delete the announcement "${announcementToDelete?.title || ''}"?`}
          </p>
          <p
            className="text-muted text-center"
            style={{
              ...arabicFontStyle,
              fontSize: "clamp(0.8rem, 0.9vw, 0.9rem)",
            }}
          >
            {isArabic
              ? "هذا الإجراء لا يمكن التراجع عنه وسيتم حذف الإعلان نهائياً"
              : "This action cannot be undone and the announcement will be permanently deleted"}
          </p>
          {announcementToDelete?.isImportant && (
            <div
              className="mt-2 p-2 bg-warning bg-opacity-10 rounded-3 text-center"
              style={{
                border: "1px solid rgba(255, 193, 7, 0.3)",
              }}
            >
              <FaExclamationTriangle className="text-warning me-1" />
              <small
                style={{
                  ...arabicFontStyle,
                  color: darkMode ? "#e9ecef" : "#212529",
                }}
              >
                {isArabic
                  ? "⚠️ هذا إعلان مهم. هل أنت متأكد من حذفه؟"
                  : "⚠️ This is an important announcement. Are you sure you want to delete it?"}
              </small>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer
          className="border-0"
          style={{
            background: darkMode ? "#1a1a2e" : "white",
            padding: "8px 24px 16px",
            borderTop: "none",
          }}
        >
          <Button
            variant="secondary"
            onClick={handleDeleteCancel}
            disabled={deleting}
            style={{
              borderRadius: "50px",
              ...arabicFontStyle,
              fontSize: "clamp(0.8rem, 0.9vw, 0.9rem)",
            }}
          >
            <FaTimes className="me-1" /> {t("Cancel")}
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteConfirm}
            disabled={deleting}
            style={{
              borderRadius: "50px",
              ...arabicFontStyle,
              fontSize: "clamp(0.8rem, 0.9vw, 0.9rem)",
            }}
          >
            {deleting ? (
              <>
                <FaSpinner className="spinning me-2" />
                {isArabic ? "جاري الحذف..." : "Deleting..."}
              </>
            ) : (
              <>
                <FaTrash className="me-1" /> {t("Delete")}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===== READ MORE MODAL ===== */}
      <Modal
        show={showReadMoreModal}
        onHide={() => setShowReadMoreModal(false)}
        centered
        size="lg"
        className="read-more-modal modern-modal"
      >
        <Modal.Header
          closeButton
          className="border-0"
          style={{
            background: darkMode ? "#1a1a2e" : "white",
            padding: "16px 24px 0",
            borderBottom: "none",
          }}
        >
          <Modal.Title
            style={{
              ...arabicFontStyle,
              color: darkMode ? "#e9ecef" : "#212529",
              fontSize: "clamp(1rem, 1.2vw, 1.3rem)",
            }}
          >
            {selectedAnnouncement &&
              (isArabic
                ? selectedAnnouncement.titleAr
                : selectedAnnouncement.title)}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
          style={{
            background: darkMode ? "#0d1117" : "white",
            padding: "16px 24px 20px",
          }}
        >
          {selectedAnnouncement && (
            <>
              {/* Meta Info */}
              <div className="d-flex flex-wrap gap-2 mb-3">
                <Badge
                  className="category-badge"
                  style={{
                    background: getCategoryColor(selectedAnnouncement.category),
                    color: "white",
                    padding: "4px 12px",
                    borderRadius: "50px",
                    fontSize: "clamp(0.6rem, 0.7vw, 0.75rem)",
                  }}
                >
                  {getCategoryIcon(selectedAnnouncement.category)}{" "}
                  {getCategoryLabel(selectedAnnouncement.category)}
                </Badge>
                <Badge
                  bg={getPriorityBadge(selectedAnnouncement.priority).bg}
                  className="rounded-pill"
                  style={{ fontSize: "clamp(0.6rem, 0.7vw, 0.75rem)" }}
                >
                  {getPriorityBadge(selectedAnnouncement.priority).label}{" "}
                  {t("Priority")}
                </Badge>
                <small
                  className="text-muted d-flex align-items-center"
                  style={{
                    color: darkMode ? "#adb5bd" : "#6c757d",
                    fontSize: "clamp(0.65rem, 0.75vw, 0.8rem)",
                  }}
                >
                  <FaCalendarAlt className="me-1" size={12} />{" "}
                  {selectedAnnouncement.date}
                </small>
                <small
                  className="text-muted d-flex align-items-center"
                  style={{
                    color: darkMode ? "#adb5bd" : "#6c757d",
                    fontSize: "clamp(0.65rem, 0.75vw, 0.8rem)",
                  }}
                >
                  <FaClock className="me-1" size={12} />{" "}
                  {selectedAnnouncement.time}
                </small>
                <small
                  className="text-muted d-flex align-items-center"
                  style={{
                    color: darkMode ? "#adb5bd" : "#6c757d",
                    fontSize: "clamp(0.65rem, 0.75vw, 0.8rem)",
                  }}
                >
                  <FaUser className="me-1" size={12} />{" "}
                  {isArabic
                    ? selectedAnnouncement.authorAr
                    : selectedAnnouncement.author}
                </small>
                {selectedAnnouncement.studentName && (
                  <small
                    className="text-muted d-flex align-items-center"
                    style={{
                      color: darkMode ? "#adb5bd" : "#6c757d",
                      fontSize: "clamp(0.65rem, 0.75vw, 0.8rem)",
                    }}
                  >
                    <FaChild className="me-1" size={12} />{" "}
                    {selectedAnnouncement.studentName}
                  </small>
                )}
              </div>

              {/* Full Content */}
              <div
                className="modal-content-text"
                style={{
                  ...arabicFontStyle,
                  fontSize: "clamp(0.9rem, 1vw, 1.05rem)",
                  lineHeight: "1.8",
                  color: darkMode ? "#e9ecef" : "#2d3436",
                }}
              >
                {isArabic
                  ? selectedAnnouncement.contentAr
                  : selectedAnnouncement.content}
              </div>

              {/* Stats */}
              <div
                className="d-flex gap-4 mt-4 pt-3 border-top"
                style={{ borderColor: darkMode ? "#2d2d44" : "#e9ecef" }}
              >
                <small
                  className="like-btn d-flex align-items-center"
                  onClick={() => handleLike(selectedAnnouncement.id)}
                  style={{
                    cursor: "pointer",
                    color: likedItems[selectedAnnouncement.id]
                      ? "#dc3545"
                      : darkMode
                        ? "#adb5bd"
                        : "#6c757d",
                    transition: "all 0.3s ease",
                    fontSize: "clamp(0.7rem, 0.8vw, 0.85rem)",
                  }}
                >
                  {likedItems[selectedAnnouncement.id] ? (
                    <FaHeart className="text-danger me-1" />
                  ) : (
                    <FaRegHeart className="me-1" />
                  )}
                  {formatNumber(selectedAnnouncement.likes)} {t("likes")}
                </small>
                <small
                  className="text-muted d-flex align-items-center"
                  style={{
                    color: darkMode ? "#adb5bd" : "#6c757d",
                    fontSize: "clamp(0.7rem, 0.8vw, 0.85rem)",
                  }}
                >
                  <FaEye className="me-1" size={13} />{" "}
                  {formatNumber(selectedAnnouncement.views)} {t("views")}
                </small>
                <small
                  className="text-muted d-flex align-items-center"
                  style={{
                    color: darkMode ? "#adb5bd" : "#6c757d",
                    fontSize: "clamp(0.7rem, 0.8vw, 0.85rem)",
                  }}
                >
                  <FaComment className="me-1" size={13} />{" "}
                  {formatNumber(selectedAnnouncement.comments)} {t("comments")}
                </small>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer
          className="border-0"
          style={{
            background: darkMode ? "#1a1a2e" : "white",
            padding: "8px 24px 16px",
            borderTop: "none",
          }}
        >
          <Button
            variant="secondary"
            onClick={() => setShowReadMoreModal(false)}
            style={{
              borderRadius: "50px",
              ...arabicFontStyle,
              fontSize: "clamp(0.8rem, 0.9vw, 0.9rem)",
            }}
          >
            <FaTimes className="me-1" /> {t("Close")}
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        .parent-announcements-page { padding: 0; }

        .modern-card {
          border-radius: 12px !important;
          transition: all 0.3s ease;
          overflow: hidden;
        }
        .modern-card:hover {
          box-shadow: 0 4px 20px rgba(0,0,0,0.06) !important;
        }

        .card-top-bar {
          transition: height 0.3s ease;
        }
        .modern-card:hover .card-top-bar {
          height: 4px;
        }

        .stat-card-small {
          transition: all 0.3s ease;
        }
        .stat-card-small:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 25px rgba(0,0,0,0.06);
        }
        .stat-card-small:hover .stat-card-top-bar {
          height: 4px;
        }
        .stat-card-small:hover .stat-card-icon {
          transform: scale(1.1) rotate(-5deg);
          background: rgba(26, 95, 122, 0.15) !important;
        }

        .announcement-card {
          border-radius: 14px !important;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }
        .announcement-card:hover .card-top-bar {
          height: 4px;
        }

        .unread-indicator {
          position: absolute;
          top: 12px;
          right: 12px;
          z-index: 10;
        }
        .dashboard-wrapper.rtl .unread-indicator {
          right: auto;
          left: 12px;
        }

        .pulse-dot {
          display: inline-block;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #0dcaf0;
          animation: pulse-dot 2s infinite;
          box-shadow: 0 0 10px rgba(13, 202, 240, 0.5);
        }

        .delete-btn {
          opacity: 0.7;
          transition: all 0.3s ease;
        }
        .delete-btn:hover {
          opacity: 1 !important;
          transform: scale(1.1) !important;
          box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3) !important;
        }
        .announcement-card:hover .delete-btn {
          opacity: 1;
        }

        .category-badge {
          padding: 3px 10px;
          border-radius: 50px;
          font-size: clamp(0.55rem, 0.65vw, 0.7rem);
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: all 0.3s ease;
        }

        .priority-badge {
          font-size: clamp(0.45rem, 0.55vw, 0.6rem);
          padding: 2px 8px;
          border-radius: 50px;
        }

        .announcement-title {
          font-size: clamp(0.9rem, 1vw, 1.05rem);
          transition: color 0.3s ease;
        }
        .announcement-card:hover .announcement-title {
          color: #1a5f7a;
        }

        .announcement-preview {
          font-size: clamp(0.75rem, 0.85vw, 0.9rem);
          line-height: 1.6;
        }

        .engagement-btn {
          transition: all 0.3s ease;
        }
        .engagement-btn:hover {
          transform: scale(1.1);
        }

        .read-more-btn {
          font-weight: 500;
          transition: all 0.3s ease;
        }
        .read-more-btn:hover {
          color: #0d3b4f !important;
          transform: translateX(4px);
        }
        .dashboard-wrapper.rtl .read-more-btn:hover {
          transform: translateX(-4px);
        }

        .category-btn {
          border-radius: 50px;
          transition: all 0.3s ease;
          font-size: clamp(0.7rem, 0.8vw, 0.85rem);
          padding: 4px 14px;
        }
        .category-btn:hover {
          transform: translateY(-2px);
        }

        .read-more-modal .modal-content,
        .delete-modal .modal-content {
          border-radius: 16px;
          border: none;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
          overflow: hidden;
        }

        .modal-content-text {
          font-size: clamp(0.9rem, 1vw, 1.05rem);
          line-height: 1.8;
        }

        .responsive-pagination .page-link {
          padding: 4px 10px;
          font-size: clamp(0.7rem, 0.8vw, 0.85rem);
        }

        .dashboard-wrapper.rtl .read-more-modal .modal-header {
          flex-direction: row-reverse;
        }
        .dashboard-wrapper.rtl .read-more-modal .modal-header .btn-close {
          margin-left: 0 !important;
          margin-right: auto !important;
        }
        .dashboard-wrapper.rtl .stat-card-body {
          flex-direction: row-reverse;
        }
        .dashboard-wrapper.rtl .stat-card-icon {
          margin-left: 0;
          margin-right: 8px;
        }
        .dashboard-wrapper.rtl .me-1 {
          margin-right: 0 !important;
          margin-left: 0.25rem !important;
        }
        .dashboard-wrapper.rtl .me-2 {
          margin-right: 0 !important;
          margin-left: 0.5rem !important;
        }
        .dashboard-wrapper.rtl .ms-1 {
          margin-left: 0 !important;
          margin-right: 0.25rem !important;
        }
        .dashboard-wrapper.rtl .ms-2 {
          margin-left: 0 !important;
          margin-right: 0.5rem !important;
        }

        .dashboard-wrapper.dark-theme .modern-card {
          background: #1a1a2e !important;
          border-color: #2d2d44 !important;
        }
        .dashboard-wrapper.dark-theme .announcement-card {
          background: #1a1a2e !important;
          border-color: #2d2d44 !important;
        }
        .dashboard-wrapper.dark-theme .modal-content {
          background: #1a1a2e !important;
        }
        .dashboard-wrapper.dark-theme .modal-body {
          background: #0d1117 !important;
        }
        .dashboard-wrapper.dark-theme .stat-card-small {
          background: #1a1a2e !important;
          border-color: #2d2d44 !important;
        }
        .dashboard-wrapper.dark-theme .stat-card-label {
          color: #adb5bd !important;
        }
        .dashboard-wrapper.dark-theme .stat-card-value {
          color: #e9ecef !important;
        }
        .dashboard-wrapper.dark-theme .stat-card-icon {
          background: rgba(26, 95, 122, 0.2) !important;
          color: #4a9eff !important;
        }
        .dashboard-wrapper.dark-theme .delete-btn {
          background: rgba(220, 53, 69, 0.2) !important;
          color: #dc3545 !important;
        }
        .dashboard-wrapper.dark-theme .delete-btn:hover {
          background: #dc3545 !important;
          color: white !important;
        }

        @media (max-width: 768px) {
          .stat-card-small {
            height: 75px !important;
          }
          .stat-card-value {
            font-size: 1.1rem !important;
          }
          .stat-card-icon {
            width: 28px !important;
            height: 28px !important;
            font-size: 0.75rem !important;
          }
          .stat-card-label {
            font-size: 0.45rem !important;
          }
          .announcement-card .p-3 {
            padding: 14px !important;
          }
          .category-btn {
            font-size: 0.7rem !important;
            padding: 3px 10px !important;
          }
          .read-more-modal .modal-header,
          .delete-modal .modal-header {
            padding: 12px 16px 0 !important;
          }
          .read-more-modal .modal-body,
          .delete-modal .modal-body {
            padding: 12px 16px 16px !important;
          }
          .read-more-modal .modal-footer,
          .delete-modal .modal-footer {
            padding: 6px 16px 12px !important;
          }
          .modal-content-text {
            font-size: 0.85rem !important;
          }
          .responsive-pagination .page-link {
            padding: 3px 8px !important;
            font-size: 0.7rem !important;
          }
          .delete-btn {
            width: 28px !important;
            height: 28px !important;
            font-size: 0.7rem !important;
          }
          .delete-btn svg {
            font-size: 12px !important;
          }
        }

        @media (max-width: 576px) {
          .stat-card-small {
            height: 65px !important;
          }
          .stat-card-value {
            font-size: 0.9rem !important;
          }
          .stat-card-icon {
            width: 24px !important;
            height: 24px !important;
            font-size: 0.65rem !important;
          }
          .stat-card-label {
            font-size: 0.4rem !important;
          }
          .announcement-card .p-3 {
            padding: 10px !important;
          }
          .announcement-title {
            font-size: 0.8rem !important;
          }
          .announcement-preview {
            font-size: 0.7rem !important;
          }
          .category-btn {
            font-size: 0.6rem !important;
            padding: 2px 8px !important;
          }
          .category-badge {
            font-size: 0.5rem !important;
            padding: 2px 8px !important;
          }
          .priority-badge {
            font-size: 0.45rem !important;
            padding: 1px 6px !important;
          }
          .read-more-modal .modal-header,
          .delete-modal .modal-header {
            padding: 10px 12px 0 !important;
          }
          .read-more-modal .modal-body,
          .delete-modal .modal-body {
            padding: 8px 12px 12px !important;
          }
          .read-more-modal .modal-footer,
          .delete-modal .modal-footer {
            padding: 4px 12px 10px !important;
          }
          .modal-content-text {
            font-size: 0.8rem !important;
          }
          .engagement-btn {
            font-size: 0.6rem !important;
          }
          .read-more-btn {
            font-size: 0.65rem !important;
          }
          .read-more-btn svg {
            font-size: 10px !important;
          }
          .responsive-pagination .page-link {
            padding: 2px 6px !important;
            font-size: 0.6rem !important;
          }
          .d-flex.gap-2 .btn {
            font-size: 0.65rem !important;
            padding: 3px 8px !important;
          }
          .modern-card .p-3 {
            padding: 10px !important;
          }
          .stat-card-body {
            padding: 6px 10px !important;
          }
          .delete-btn {
            width: 24px !important;
            height: 24px !important;
            font-size: 0.6rem !important;
            top: 6px !important;
            right: 6px !important;
          }
          .delete-btn svg {
            font-size: 10px !important;
          }
          .dashboard-wrapper.rtl .delete-btn {
            right: auto !important;
            left: 6px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ParentAnnouncements;