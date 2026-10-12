// src/components/dashboard/student/StudentAnnouncements.jsx
import React, { useState, useEffect } from "react";
import { Row, Col, Card, Badge, Button, Form, InputGroup, Pagination, Modal } from "react-bootstrap";
import {
  FaBullhorn,
  FaCalendarAlt,
  FaClock,
  FaUser,
  FaTag,
  FaSearch,
  FaSync,
  FaBell,
  FaStar,
  FaCheckCircle,
  FaCheckDouble,
  FaTimes,
  FaUsers,
  FaPaperPlane,
  FaArrowRight,
} from "react-icons/fa";
import { syncGet } from "../../../services/apiSync";
import { useLanguage } from "../../../context/LanguageContext";
import { getTranslation } from "../../../utils/translations";
import { useNotification } from "../../../hooks/useNotification";

// ===== ARABIC FONT STYLE =====
const getArabicFontStyle = (isArabic) => ({
  fontFamily: isArabic
    ? '"Hacen Tunisia", "Hacen Tunisia Bd", "Noto Sans Arabic", "Vazirmatn", "Traditional Arabic", "Arabic Typesetting", serif'
    : "inherit",
  lineHeight: isArabic ? "1.8" : "1.6",
  letterSpacing: isArabic ? "0.5px" : "0px",
  fontSize: isArabic ? "clamp(0.9rem, 1.1vw, 1.05rem)" : "clamp(0.85rem, 1vw, 1rem)",
});

// ===== NUMBER FORMATTING - ALWAYS ENGLISH =====
const formatNumber = (num) => {
  if (num === undefined || num === null) return "0";
  return num.toString();
};

const StudentAnnouncements = () => {
  const { language, isArabic } = useLanguage();
  const t = (key) => getTranslation(key, language);
  const { notify } = useNotification();

  const [announcements, setAnnouncements] = useState([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState([]);
  const [readStatusMap, setReadStatusMap] = useState({});
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showReadMoreModal, setShowReadMoreModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  const itemsPerPage = 6;

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

  // ===== LOAD ANNOUNCEMENTS =====
  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await syncGet("/announcements/published");
      const serverAnnouncements = Array.isArray(res?.data) ? res.data : [];

      // A student sees announcements addressed to everyone or to students.
      const visible = serverAnnouncements.filter((a) => {
        const target = Array.isArray(a.targetAudience)
          ? a.targetAudience
          : Array.isArray(a.target_audience)
            ? a.target_audience
            : [a.targetAudience || a.target_audience || "all"];
        const norm = target.map((x) => String(x).toLowerCase());
        return (
          norm.includes("all") ||
          norm.includes("students") ||
          norm.includes("student")
        );
      });

      const readStatus = readStatusMap;
      const mapped = visible.map((a) => ({
        id: a.id,
        title: a.title || "Announcement",
        titleAr: a.titleAr || a.title_ar || a.title || "إعلان",
        content: a.content || "",
        contentAr: a.contentAr || a.content_ar || a.content || "",
        type: a.type || "announcement",
        priority: a.priority || "medium",
        date: a.published_at || a.created_at
          ? new Date(a.published_at || a.created_at).toLocaleDateString()
          : new Date().toLocaleDateString(),
        time: a.published_at || a.created_at
          ? new Date(a.published_at || a.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        author: a.author || "Admin",
        authorAr: a.authorAr || a.author_ar || a.author || "المسؤول",
        isRead: readStatus[a.id] || a.is_read || false,
        isImportant: a.priority === "high",
        category: a.type || "announcement",
        createdAt: a.created_at || a.published_at || new Date().toISOString(),
      }));

      mapped.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setAnnouncements(mapped);
    } catch (error) {
      console.error("Error loading announcements:", error);
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  // ===== INITIAL LOAD + LIVE UPDATES =====
  useEffect(() => {
    loadAnnouncements();
    const handleNotificationAdded = () => loadAnnouncements();
    window.addEventListener("notificationAdded", handleNotificationAdded);
    return () => {
      window.removeEventListener("notificationAdded", handleNotificationAdded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    };
    return gradients[category] || "linear-gradient(90deg, #6c757d, #adb5bd)";
  };

  // ===== MARK AS READ =====
  const handleMarkAsRead = (id) => {
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isRead: true } : a)),
    );
    setReadStatusMap((prev) => ({ ...prev, [id]: true }));
  };

  const handleMarkAllAsRead = () => {
    setAnnouncements((prev) => prev.map((a) => ({ ...a, isRead: true })));
    setReadStatusMap((prev) => {
      const next = { ...prev };
      announcements.forEach((a) => {
        next[a.id] = true;
      });
      return next;
    });
    notify(t("All announcements marked as read"), "success");
  };

  // ===== READ MORE =====
  const handleReadMore = (announcement) => {
    setSelectedAnnouncement(announcement);
    setShowReadMoreModal(true);
    if (!announcement.isRead) {
      handleMarkAsRead(announcement.id);
    }
  };

  // ===== REFRESH =====
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

  // ===== CATEGORIES =====
  const categories = [
    { value: "all", label: t("All") },
    { value: "announcement", label: t("Announcements") },
    { value: "event", label: t("Events") },
    { value: "meeting", label: t("Meetings") },
    { value: "exam", label: t("Exams") },
    { value: "news", label: t("News") },
  ];

  // ===== PAGINATION =====
  const totalPages = Math.ceil(filteredAnnouncements.length / itemsPerPage);
  const displayedAnnouncements = filteredAnnouncements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const unreadCount = announcements.filter((a) => !a.isRead).length;

  // ===== STATS =====
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
    <div className="student-announcements-page" dir={isArabic ? "rtl" : "ltr"}>
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

      {/* ===== STATS CARDS ===== */}
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
                style={{ height: "3px", background: stat.gradient }}
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
                    variant={selectedCategory === cat.value ? "primary" : "outline-primary"}
                    size="sm"
                    onClick={() => setSelectedCategory(cat.value)}
                    className="category-btn"
                    style={{
                      ...arabicFontStyle,
                      borderRadius: "50px",
                      transition: "all 0.3s ease",
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
            const gradient = getGradient(announcement.category);
            const categoryColor = getCategoryColor(announcement.category);

            const title = isArabic ? announcement.titleAr : announcement.title;
            const content = isArabic ? announcement.contentAr : announcement.content;
            const author = isArabic ? announcement.authorAr : announcement.author;

            return (
              <Col key={announcement.id} md={6} lg={4}>
                <Card
                  className="announcement-card h-100 shadow-sm border-0"
                  style={{
                    background: darkMode ? "#1a1a2e" : "#ffffff",
                    border: `1px solid ${darkMode ? "#2d2d44" : "#e9ecef"}`,
                    borderRadius: "14px",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <div
                    className="card-top-bar"
                    style={{ height: "3px", background: gradient }}
                  ></div>

                  {!announcement.isRead && (
                    <div className="unread-indicator">
                      <span className="pulse-dot"></span>
                    </div>
                  )}

                  <Card.Body className="p-3 p-md-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <Badge
                        className="category-badge"
                        style={{
                          background: categoryColor,
                          color: "white",
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
                            <FaStar className="me-1" size={10} /> {t("Important")}
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
                        <FaClock className="me-1" size={11} /> {announcement.time}
                      </small>
                    </div>

                    <div
                      className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top"
                      style={{ borderColor: darkMode ? "#2d2d44" : "#e9ecef" }}
                    >
                      {!announcement.isRead ? (
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 text-primary"
                          onClick={() => handleMarkAsRead(announcement.id)}
                          style={{
                            ...arabicFontStyle,
                            textDecoration: "none",
                            fontSize: "clamp(0.6rem, 0.7vw, 0.75rem)",
                          }}
                        >
                          <FaCheckCircle className="me-1" size={11} /> {t("Mark read")}
                        </Button>
                      ) : (
                        <span className="text-success small" style={{ fontSize: "0.7rem" }}>
                          <FaCheckCircle className="me-1" size={11} />
                          {isArabic ? "مقروء" : "Read"}
                        </span>
                      )}
                    </div>
                  </Card.Body>

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
          style={{ background: darkMode ? "#1a1a2e" : "white", padding: "16px 24px 0", borderBottom: "none" }}
        >
          <Modal.Title
            style={{
              ...arabicFontStyle,
              color: darkMode ? "#e9ecef" : "#212529",
              fontSize: "clamp(1rem, 1.2vw, 1.3rem)",
            }}
          >
            {selectedAnnouncement &&
              (isArabic ? selectedAnnouncement.titleAr : selectedAnnouncement.title)}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
          style={{ background: darkMode ? "#0d1117" : "white", padding: "16px 24px 20px" }}
        >
          {selectedAnnouncement && (
            <>
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
                  {getPriorityBadge(selectedAnnouncement.priority).label} {t("Priority")}
                </Badge>
                <small
                  className="text-muted d-flex align-items-center"
                  style={{ color: darkMode ? "#adb5bd" : "#6c757d", fontSize: "clamp(0.65rem, 0.75vw, 0.8rem)" }}
                >
                  <FaCalendarAlt className="me-1" size={12} /> {selectedAnnouncement.date}
                </small>
                <small
                  className="text-muted d-flex align-items-center"
                  style={{ color: darkMode ? "#adb5bd" : "#6c757d", fontSize: "clamp(0.65rem, 0.75vw, 0.8rem)" }}
                >
                  <FaClock className="me-1" size={12} /> {selectedAnnouncement.time}
                </small>
                <small
                  className="text-muted d-flex align-items-center"
                  style={{ color: darkMode ? "#adb5bd" : "#6c757d", fontSize: "clamp(0.65rem, 0.75vw, 0.8rem)" }}
                >
                  <FaUser className="me-1" size={12} />{" "}
                  {isArabic ? selectedAnnouncement.authorAr : selectedAnnouncement.author}
                </small>
              </div>

              <div
                className="modal-content-text"
                style={{
                  ...arabicFontStyle,
                  fontSize: "clamp(0.9rem, 1vw, 1.05rem)",
                  lineHeight: "1.8",
                  color: darkMode ? "#e9ecef" : "#2d3436",
                  whiteSpace: "pre-wrap",
                }}
              >
                {isArabic ? selectedAnnouncement.contentAr : selectedAnnouncement.content}
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer
          className="border-0"
          style={{ background: darkMode ? "#1a1a2e" : "white", padding: "8px 24px 16px", borderTop: "none" }}
        >
          <Button
            variant="secondary"
            onClick={() => setShowReadMoreModal(false)}
            style={{ borderRadius: "50px", ...arabicFontStyle, fontSize: "clamp(0.8rem, 0.9vw, 0.9rem)" }}
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
        .spinning { animation: spin 1s linear infinite; }

        .student-announcements-page { padding: 0; }

        .modern-card { border-radius: 12px !important; transition: all 0.3s ease; overflow: hidden; }
        .stat-card-small { transition: all 0.3s ease; }
        .stat-card-small:hover { transform: translateY(-3px); box-shadow: 0 6px 25px rgba(0,0,0,0.06); }
        .stat-card-small:hover .stat-card-top-bar { height: 4px; }
        .stat-card-small:hover .stat-card-icon { transform: scale(1.1) rotate(-5deg); background: rgba(26, 95, 122, 0.15) !important; }

        .announcement-card { border-radius: 14px !important; overflow: hidden; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); position: relative; }
        .announcement-card:hover { transform: translateY(-6px); box-shadow: 0 12px 40px rgba(0,0,0,0.1) !important; }
        .announcement-card:hover .card-top-bar { height: 4px !important; }

        .unread-indicator { position: absolute; top: 12px; right: 12px; z-index: 10; }
        .pulse-dot {
          display: block; width: 9px; height: 9px; border-radius: 50%;
          background: #0dcaf0; box-shadow: 0 0 0 0 rgba(13, 202, 240, 0.7);
          animation: pulse-dot 1.6s infinite;
        }
        .announcement-preview { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        .read-more-btn { text-decoration: none !important; }
      `}</style>
    </div>
  );
};

export default StudentAnnouncements;
