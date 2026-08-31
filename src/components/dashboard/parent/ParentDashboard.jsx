// src/components/dashboard/parent/ParentDashboard.jsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Button,
  ProgressBar,
  Table,
  Nav,
  Form,
  Modal,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaClock,
  FaStar,
  FaStarHalf,
  FaRegStar,
  FaAward,
  FaTrophy,
  FaBook,
  FaGraduationCap,
  FaChartLine,
  FaCheckCircle,
  FaArrowRight,
  FaBell,
  FaCog,
  FaUserCircle,
  FaClipboardCheck,
  FaBullhorn,
  FaCalendarCheck,
  FaPaperPlane,
  FaUsers,
  FaChild,
  FaUserGraduate,
  FaInfoCircle,
  FaFileAlt,
  FaDownload,
  FaPrint,
  FaExclamationTriangle,
  FaTimes,
  FaCheck,
  FaEye,
  FaEdit,
  FaTrash,
  FaPlus,
  FaSearch,
  FaFilter,
  FaChevronDown,
  FaChevronUp,
  FaBars,
  FaHeart,
  FaSchool,
  FaBookOpen,
  FaChalkboardTeacher,
  FaUserPlus,
  FaRocket,
  FaGift,
  FaFire,
  FaGem,
  FaCrown,
  FaStar as FaStarSolid,
  FaComments,
  FaQuoteLeft,
  FaQuoteRight,
  FaUserTie,
  FaCalendarWeek,
  FaClock as FaClockIcon,
  FaMapMarkerAlt,
  FaTag,
  FaSync,
  FaChild as FaChildIcon,
  FaQuoteLeft as FaQuoteLeftIcon,
  FaTasks,
  FaClipboardList,
  FaHourglassHalf,
  FaPaperPlane as FaPaperPlaneIcon,
  FaLanguage,
  FaCalculator,
  FaFlask,
  FaDna,
  FaAtom,
  FaMicroscope,
  FaLaptop,
  FaRunning,
  FaPalette,
  FaGlobe,
  FaBrain,
  FaMusic,
} from "react-icons/fa";
import { useLanguage } from "../../../context/LanguageContext";
import { getTranslation } from "../../../utils/translations";
import { useAuth } from "../../../hooks/useAuth";
import { useNotification } from "../../../hooks/useNotification";

// ===== ARABIC FONT STYLE =====
const getArabicFontStyle = (isArabic) => ({
  fontFamily: isArabic
    ? '"Hacen Tunisia", "Hacen Tunisia Bd", "Noto Sans Arabic", "Vazirmatn", "Traditional Arabic", "Arabic Typesetting", serif'
    : "inherit",
  lineHeight: isArabic ? "1.8" : "1.6",
  letterSpacing: isArabic ? "0.5px" : "0px",
  fontSize: isArabic
    ? "clamp(0.95rem, 1.1vw, 1.1rem)"
    : "clamp(0.9rem, 1vw, 1.05rem)",
});

// ===== NUMBER FORMATTING - ALWAYS ENGLISH =====
const formatNumber = (num) => {
  if (num === undefined || num === null) return "0";
  return num.toString();
};

// ===== SUBJECT ICON MAPPING =====
const getSubjectIcon = (subjectName) => {
  const name = subjectName.toLowerCase();
  if (name.includes("quran")) return <FaBookOpen />;
  if (name.includes("arabic")) return <FaLanguage />;
  if (name.includes("mathematics") || name.includes("math"))
    return <FaCalculator />;
  if (name.includes("science")) return <FaFlask />;
  if (name.includes("svt") || name.includes("biology")) return <FaDna />;
  if (name.includes("physics")) return <FaAtom />;
  if (name.includes("chemistry")) return <FaMicroscope />;
  if (name.includes("english")) return <FaLanguage />;
  if (name.includes("french")) return <FaLanguage />;
  if (name.includes("sports")) return <FaRunning />;
  if (name.includes("ict") || name.includes("computer")) return <FaLaptop />;
  if (name.includes("art") || name.includes("plastic")) return <FaPalette />;
  if (name.includes("geography")) return <FaGlobe />;
  if (name.includes("philosophy")) return <FaBrain />;
  if (name.includes("music")) return <FaMusic />;
  return <FaBookOpen />;
};

// ===== DEFAULT SUBJECTS BY LEVEL =====
const defaultSubjectsByCategory = {
  kindergarten: [
    {
      id: "quran_k",
      name: "Qur'an",
      nameAr: "القرآن الكريم",
      category: "kindergarten",
    },
    {
      id: "english_k",
      name: "English",
      nameAr: "اللغة الإنجليزية",
      category: "kindergarten",
    },
    {
      id: "french_k",
      name: "French",
      nameAr: "اللغة الفرنسية",
      category: "kindergarten",
    },
    {
      id: "arabic_k",
      name: "Arabic",
      nameAr: "اللغة العربية",
      category: "kindergarten",
    },
  ],
  primary: [
    {
      id: "quran_p",
      name: "Qur'an",
      nameAr: "القرآن الكريم",
      category: "primary",
    },
    {
      id: "arabic_p",
      name: "Arabic",
      nameAr: "اللغة العربية",
      category: "primary",
    },
    {
      id: "english_p",
      name: "English",
      nameAr: "اللغة الإنجليزية",
      category: "primary",
    },
    {
      id: "french_p",
      name: "French",
      nameAr: "اللغة الفرنسية",
      category: "primary",
    },
    {
      id: "mathematics_p",
      name: "Mathematics",
      nameAr: "الرياضيات",
      category: "primary",
    },
    { id: "science_p", name: "Science", nameAr: "العلوم", category: "primary" },
    { id: "sports_p", name: "Sports", nameAr: "الرياضة", category: "primary" },
    {
      id: "ict_p",
      name: "ICT",
      nameAr: "تكنولوجيا المعلومات",
      category: "primary",
    },
    {
      id: "art_p",
      name: "Art & Plastic",
      nameAr: "الفنون التشكيلية",
      category: "primary",
    },
    {
      id: "geography_p",
      name: "Geography",
      nameAr: "الجغرافيا",
      category: "primary",
    },
  ],
  secondary: [
    {
      id: "quran_s",
      name: "Qur'an",
      nameAr: "القرآن الكريم",
      category: "secondary",
    },
    {
      id: "arabic_s",
      name: "Arabic",
      nameAr: "اللغة العربية",
      category: "secondary",
    },
    {
      id: "english_s",
      name: "English",
      nameAr: "اللغة الإنجليزية",
      category: "secondary",
    },
    {
      id: "french_s",
      name: "French",
      nameAr: "اللغة الفرنسية",
      category: "secondary",
    },
    {
      id: "mathematics_s",
      name: "Mathematics",
      nameAr: "الرياضيات",
      category: "secondary",
    },
    {
      id: "svt_s",
      name: "SVT (Biology)",
      nameAr: "علوم الحياة والأرض",
      category: "secondary",
    },
    {
      id: "physics_s",
      name: "Physics",
      nameAr: "الفيزياء",
      category: "secondary",
    },
    {
      id: "sports_s",
      name: "Sports",
      nameAr: "الرياضة",
      category: "secondary",
    },
    {
      id: "ict_s",
      name: "ICT",
      nameAr: "تكنولوجيا المعلومات",
      category: "secondary",
    },
    {
      id: "geography_s",
      name: "Geography",
      nameAr: "الجغرافيا",
      category: "secondary",
    },
  ],
  high_school: [
    {
      id: "quran_h",
      name: "Qur'an",
      nameAr: "القرآن الكريم",
      category: "high_school",
    },
    {
      id: "arabic_h",
      name: "Arabic",
      nameAr: "اللغة العربية",
      category: "high_school",
    },
    {
      id: "english_h",
      name: "English",
      nameAr: "اللغة الإنجليزية",
      category: "high_school",
    },
    {
      id: "french_h",
      name: "French",
      nameAr: "اللغة الفرنسية",
      category: "high_school",
    },
    {
      id: "mathematics_h",
      name: "Mathematics",
      nameAr: "الرياضيات",
      category: "high_school",
    },
    {
      id: "svt_h",
      name: "SVT (Biology)",
      nameAr: "علوم الحياة والأرض",
      category: "high_school",
    },
    {
      id: "physics_h",
      name: "Physics",
      nameAr: "الفيزياء",
      category: "high_school",
    },
    {
      id: "sports_h",
      name: "Sports",
      nameAr: "الرياضة",
      category: "high_school",
    },
    {
      id: "ict_h",
      name: "ICT",
      nameAr: "تكنولوجيا المعلومات",
      category: "high_school",
    },
    {
      id: "geography_h",
      name: "Geography",
      nameAr: "الجغرافيا",
      category: "high_school",
    },
    {
      id: "philosophy_h",
      name: "Philosophy",
      nameAr: "الفلسفة",
      category: "high_school",
    },
  ],
};

const ParentDashboard = () => {
  const { language, isArabic } = useLanguage();
  const t = (key) => getTranslation(key, language);
  const { user } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();

  const [selectedChild, setSelectedChild] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [children, setChildren] = useState([]);

  // ===== Arabic Font Style =====
  const arabicFontStyle = getArabicFontStyle(isArabic);

  // ===== Check dark mode =====
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

  // ===== GET GRADE LETTER =====
  const getGradeLetter = (score, totalMarks) => {
    if (!score || score === "" || !totalMarks) return "N/A";
    const percentage = (parseFloat(score) / totalMarks) * 100;
    if (percentage >= 90) return "A+";
    if (percentage >= 85) return "A";
    if (percentage >= 80) return "B+";
    if (percentage >= 75) return "B";
    if (percentage >= 70) return "C+";
    if (percentage >= 60) return "C";
    if (percentage >= 50) return "D";
    return "F";
  };

  // ===== GET GRADE COLOR =====
  const getGradeColor = (score, totalMarks) => {
    if (!score || score === "" || !totalMarks) return "#6c757d";
    const percentage = (parseFloat(score) / totalMarks) * 100;
    if (percentage >= 80) return "#2ecc71";
    if (percentage >= 60) return "#f39c12";
    return "#e74c3c";
  };

  // ===== GET STATUS BADGE =====
  const getStatusBadge = (status) => {
    const statuses = {
      graded: {
        bg: "success",
        icon: <FaCheckCircle />,
        label: isArabic ? "مصحح" : "Graded",
      },
      pending: {
        bg: "warning",
        icon: <FaHourglassHalf />,
        label: isArabic ? "قيد الانتظار" : "Pending",
      },
      submitted: {
        bg: "info",
        icon: <FaPaperPlaneIcon />,
        label: isArabic ? "مرسل" : "Submitted",
      },
      closed: {
        bg: "secondary",
        icon: <FaCheckCircle />,
        label: isArabic ? "مغلق" : "Closed",
      },
      published: {
        bg: "primary",
        icon: <FaClock />,
        label: isArabic ? "منشور" : "Published",
      },
    };
    return statuses[status] || statuses.pending;
  };

  // ===== GET PRIORITY BADGE =====
  const getPriorityBadge = (priority) => {
    if (priority === "high") {
      return (
        <Badge bg="danger" className="rounded-pill">
          {isArabic ? "عالي" : "High"}
        </Badge>
      );
    }
    if (priority === "medium") {
      return (
        <Badge bg="warning" className="rounded-pill">
          {isArabic ? "متوسط" : "Medium"}
        </Badge>
      );
    }
    return (
      <Badge bg="info" className="rounded-pill">
        {isArabic ? "منخفض" : "Low"}
      </Badge>
    );
  };

  // ===== LOAD CHILDREN DATA =====
  const loadChildrenData = () => {
    try {
      console.log("📚 Loading children data for parent...");

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

      if (parentChildren.length > 0) {
        const enrichedChildren = parentChildren.map((child) => {
          const classes = JSON.parse(
            localStorage.getItem("school_classes") || "[]",
          );
          const classInfo = classes.find(
            (c) => c.id === child.classId || c.id === child.class,
          );

          const studentLevel = child.level || child.educationLevel || "primary";
          const defaultSubjects =
            defaultSubjectsByCategory[studentLevel] ||
            defaultSubjectsByCategory.primary;

          const allAssessments = JSON.parse(
            localStorage.getItem("school_assessments") || "[]",
          );
          const studentAssessments = allAssessments.filter(
            (a) =>
              (a.classId === child.classId || a.classId === child.class) &&
              (a.assignedStudents
                ? a.assignedStudents.includes(child.id)
                : true),
          );

          const allSubmissions = JSON.parse(
            localStorage.getItem("school_submissions") || "[]",
          );
          const studentSubmissions = allSubmissions.filter(
            (s) => s.studentId === child.id,
          );

          const subjectsWithGrades = defaultSubjects.map((sub) => {
            const assessment = studentAssessments.find(
              (a) => a.subject === sub.name,
            );
            const submission = studentSubmissions.find(
              (s) => s.assessmentId === assessment?.id,
            );
            const grade = assessment?.grades?.find(
              (g) => g.studentId === child.id,
            );

            return {
              name: sub.name,
              nameAr: sub.nameAr || sub.name,
              score: grade?.score || 0,
              grade: grade?.score
                ? getGradeLetter(grade.score, assessment?.totalMarks || 100)
                : "N/A",
              isGraded: !!grade,
              hasSubmitted: !!submission,
              assessmentId: assessment?.id || null,
              totalMarks: assessment?.totalMarks || 100,
            };
          });

          const allAttendance = JSON.parse(
            localStorage.getItem("school_attendance") || "[]",
          );
          let present = 0,
            absent = 0,
            late = 0,
            excused = 0,
            total = 0;

          allAttendance.forEach((record) => {
            const studentData = record.students?.find(
              (s) => s.studentId === child.id,
            );
            if (studentData) {
              total++;
              switch (studentData.status) {
                case "present":
                  present++;
                  break;
                case "absent":
                  absent++;
                  break;
                case "late":
                  late++;
                  break;
                case "excused":
                  excused++;
                  break;
                default:
                  break;
              }
            }
          });

          const attendanceRate =
            total > 0 ? Math.round((present / total) * 100) : 0;

          const allNotifications = JSON.parse(
            localStorage.getItem("school_notifications") || "[]",
          );
          const studentNotifications = allNotifications
            .filter(
              (n) =>
                n.studentId === child.id ||
                n.recipientRole === "parent" ||
                n.studentName === child.name,
            )
            .map((n) => ({
              id: n.id || `NOT${Date.now()}`,
              title:
                n.title ||
                (n.type === "submission"
                  ? "📤 " + (isArabic ? "تقديم واجب" : "Assignment Submitted")
                  : "📢 " + (isArabic ? "إشعار جديد" : "New Announcement")),
              content: n.message || n.content || "",
              date: n.createdAt
                ? new Date(n.createdAt).toLocaleDateString()
                : new Date().toLocaleDateString(),
              time: n.createdAt
                ? new Date(n.createdAt).toLocaleTimeString()
                : "",
              priority: n.priority || "medium",
              teacher: n.teacherName || classInfo?.teacher || "Teacher",
              type: n.type || "announcement",
              read: n.read || false,
            }));

          const recentActivities = [];

          studentAssessments.forEach((a) => {
            recentActivities.push({
              date:
                a.dueDate || a.createdAt
                  ? new Date(a.dueDate || a.createdAt).toLocaleDateString()
                  : new Date().toLocaleDateString(),
              activity: `${a.title} - ${a.subject}`,
              type: "assessment",
            });
          });

          studentSubmissions.forEach((s) => {
            const assessment = studentAssessments.find(
              (a) => a.id === s.assessmentId,
            );
            recentActivities.push({
              date: s.submittedAt
                ? new Date(s.submittedAt).toLocaleDateString()
                : new Date().toLocaleDateString(),
              activity: `Submitted: ${assessment?.title || "Assignment"}`,
              type: "submission",
            });
          });

          recentActivities.sort((a, b) => new Date(b.date) - new Date(a.date));
          const topActivities = recentActivities.slice(0, 10);

          return {
            id: child.id,
            name: child.name || child.firstName || "Student",
            class: classInfo?.name || child.className || child.class || "N/A",
            level:
              classInfo?.level || child.level || child.educationLevel || "N/A",
            status: child.status || "active",
            attendance: attendanceRate,
            attendanceCount: { present, absent, late, excused, total },
            subjects: subjectsWithGrades,
            recentActivities:
              topActivities.length > 0
                ? topActivities
                : [
                    {
                      date: new Date().toISOString().split("T")[0],
                      activity: isArabic
                        ? "لا توجد أنشطة حديثة"
                        : "No recent activities",
                    },
                  ],
            announcements: studentNotifications,
            teacher:
              child.teacherName ||
              classInfo?.teacher ||
              (isArabic ? "المعلم المكلف" : "Assigned Teacher"),
            parentId: child.parentId,
            parentName: child.parentName,
            assessments: studentAssessments,
            submissions: studentSubmissions,
            gradedCount: studentAssessments.filter((a) =>
              a.grades?.some((g) => g.studentId === child.id),
            ).length,
            totalAssessments: studentAssessments.length,
            hasNewAnnouncements: studentNotifications.some((n) => !n.read),
          };
        });

        setChildren(enrichedChildren);

        if (enrichedChildren.length > 0 && !selectedChild) {
          setSelectedChild(enrichedChildren[0]);
        } else if (enrichedChildren.length > 0 && selectedChild) {
          const stillExists = enrichedChildren.find(
            (c) => c.id === selectedChild.id,
          );
          if (!stillExists) {
            setSelectedChild(enrichedChildren[0]);
          }
        }
      } else {
        setChildren([]);
        setSelectedChild(null);
      }
    } catch (error) {
      console.error("❌ Error loading children data:", error);
      setChildren([]);
      setSelectedChild(null);
    }
  };

  // ===== INITIAL LOAD =====
  useEffect(() => {
    loadChildrenData();
  }, [user]);

  // ===== REFRESH FUNCTION =====
  const handleRefresh = () => {
    setRefreshing(true);
    loadChildrenData();
    setTimeout(() => {
      setRefreshing(false);
      if (notify) {
        notify(
          isArabic ? "تم تحديث البيانات بنجاح" : "Data refreshed successfully",
          "info",
        );
      }
    }, 600);
  };

  // ===== HANDLE CHILD SELECTION =====
  const handleChildSelect = (childId) => {
    const child = children.find((c) => c.id === childId);
    if (child) {
      setSelectedChild(child);
      setActiveTab("overview");
    }
  };

  // ===== HANDLE VIEW ANNOUNCEMENT =====
  const handleViewAnnouncement = (announcement) => {
    setSelectedAnnouncement(announcement);
    setShowAnnouncementModal(true);
  };

  // ===== No children found =====
  if (children.length === 0) {
    return (
      <div className="parent-dashboard" dir={isArabic ? "rtl" : "ltr"}>
        <Container fluid>
          <div className="dashboard-header d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
            <div>
              <h4
                className="fw-bold mb-1"
                style={{ ...arabicFontStyle, color: "#1a5f7a" }}
              >
                <FaUserGraduate className="me-2" />
                {isArabic ? "لوحة تحكم ولي الأمر" : "Parent Dashboard"}
              </h4>
              <p className="text-muted mb-0" style={arabicFontStyle}>
                {isArabic ? "مرحباً بعودتك،" : "Welcome back,"}{" "}
                {user?.name || "Parent"} 👋
              </p>
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <Button
                variant="outline-primary"
                size="sm"
                className="header-btn"
                onClick={handleRefresh}
                disabled={refreshing}
                style={arabicFontStyle}
              >
                <FaSync className={refreshing ? "spinning" : "me-1"} />{" "}
                {isArabic ? "تحديث" : "Refresh"}
              </Button>
            </div>
          </div>

          <Card
            className="shadow-sm border-0 text-center py-5"
            style={{
              borderRadius: "20px",
              background: darkMode ? "#1a1a2e" : "#ffffff",
              border: `1px solid ${darkMode ? "#2d2d44" : "#e9ecef"}`,
            }}
          >
            <Card.Body>
              <div className="mb-4" style={{ fontSize: "4rem" }}>
                <FaChildIcon className="text-muted opacity-25" />
              </div>
              <h4 style={arabicFontStyle}>
                {isArabic ? "لا يوجد أطفال" : "No Children Found"}
              </h4>
              <p className="text-muted" style={arabicFontStyle}>
                {isArabic
                  ? "لا يوجد أطفال مسجلين في النظام حتى الآن."
                  : "You don't have any children registered in the system yet."}
              </p>
              <Button
                variant="primary"
                onClick={handleRefresh}
                disabled={refreshing}
                style={{ borderRadius: "50px", ...arabicFontStyle }}
              >
                <FaSync className={refreshing ? "spinning" : "me-2"} />{" "}
                {isArabic ? "تحديث" : "Refresh"}
              </Button>
            </Card.Body>
          </Card>
        </Container>
      </div>
    );
  }

  if (!selectedChild) {
    return (
      <div className="parent-dashboard" dir={isArabic ? "rtl" : "ltr"}>
        <Container fluid>
          <div className="dashboard-header d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
            <div>
              <h4
                className="fw-bold mb-1"
                style={{ ...arabicFontStyle, color: "#1a5f7a" }}
              >
                <FaUserGraduate className="me-2" />
                {isArabic ? "لوحة تحكم ولي الأمر" : "Parent Dashboard"}
              </h4>
              <p className="text-muted mb-0" style={arabicFontStyle}>
                {isArabic ? "مرحباً بعودتك،" : "Welcome back,"}{" "}
                {user?.name || "Parent"} 👋
              </p>
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <Button
                variant="outline-primary"
                size="sm"
                className="header-btn"
                onClick={handleRefresh}
                disabled={refreshing}
                style={arabicFontStyle}
              >
                <FaSync className={refreshing ? "spinning" : "me-1"} />{" "}
                {isArabic ? "تحديث" : "Refresh"}
              </Button>
            </div>
          </div>
          <Card
            className="shadow-sm border-0 text-center py-4"
            style={{
              borderRadius: "20px",
              background: darkMode ? "#1a1a2e" : "#ffffff",
              border: `1px solid ${darkMode ? "#2d2d44" : "#e9ecef"}`,
            }}
          >
            <Card.Body>
              <p className="text-muted" style={arabicFontStyle}>
                {isArabic ? "جاري تحميل البيانات..." : "Loading data..."}
              </p>
            </Card.Body>
          </Card>
        </Container>
      </div>
    );
  }

  // ===== Stats Cards =====
  const statsCards = [
    {
      icon: <FaBook />,
      value: formatNumber(selectedChild.subjects?.length || 0),
      label: isArabic ? "المواد" : "Subjects",
      gradient: "linear-gradient(135deg, #667eea, #764ba2)",
    },
    {
      icon: <FaCalendarCheck />,
      value: `${formatNumber(selectedChild.attendance)}%`,
      label: isArabic ? "الحضور" : "Attendance",
      gradient: "linear-gradient(135deg, #11998e, #38ef7d)",
    },
    {
      icon: <FaClipboardList />,
      value: formatNumber(selectedChild.gradedCount || 0),
      label: isArabic ? "مصحح" : "Graded",
      gradient: "linear-gradient(135deg, #1a5f7a, #4a9eff)",
    },
    {
      icon: <FaBullhorn />,
      value: formatNumber(selectedChild.announcements?.length || 0),
      label: isArabic ? "إشعارات" : "Announcements",
      gradient: "linear-gradient(135deg, #f2994a, #f2c94c)",
    },
  ];

  // ===== Tab Labels =====
  const tabs = [
    {
      id: "overview",
      icon: <FaChartLine />,
      label: isArabic ? "نظرة عامة" : "Overview",
    },
    {
      id: "academics",
      icon: <FaBook />,
      label: isArabic ? "المواد الدراسية" : "Academics",
    },
    {
      id: "announcements",
      icon: <FaBullhorn />,
      label: isArabic ? "الإشعارات" : "Announcements",
    },
  ];

  return (
    <div className="parent-dashboard" dir={isArabic ? "rtl" : "ltr"}>
      <Container fluid>
        {/* ===== HEADER ===== */}
        <div className="dashboard-header d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
          <div>
            <h4
              className="fw-bold mb-1"
              style={{
                ...arabicFontStyle,
                color: "#1a5f7a",
                fontSize: "clamp(1.2rem, 2.1vw, 2rem)", // Added this line
              }}
            >
              <FaUserGraduate className="me-2" />
              {isArabic ? "لوحة تحكم ولي الأمر" : "Parent Dashboard"}
            </h4>

            <p className="text-muted mb-0" style={arabicFontStyle}>
              {isArabic ? "مرحباً بعودتك،" : "Welcome back,"}{" "}
              {user?.name || "Parent"} 👋
            </p>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <Button
              variant="outline-primary"
              size="sm"
              className="header-btn"
              onClick={handleRefresh}
              disabled={refreshing}
              style={arabicFontStyle}
            >
              <FaSync className={refreshing ? "spinning" : "me-1"} />{" "}
              {isArabic ? "تحديث" : "Refresh"}
            </Button>
          </div>
        </div>

        {/* ===== CHILD SELECTOR ===== */}
        <Card
          className="shadow-sm border-0 mb-4 child-selector-card"
          style={{
            background: darkMode ? "#1a1a2e" : "#ffffff",
            border: `1px solid ${darkMode ? "#2d2d44" : "#e9ecef"}`,
            borderRadius: "12px",
          }}
        >
          <Card.Body className="p-3">
            <div className="d-flex flex-wrap align-items-center gap-3">
              <span
                className="fw-bold"
                style={{
                  ...arabicFontStyle,
                  color: darkMode ? "#e9ecef" : "#212529",
                  fontSize: "clamp(0.85rem, 1vw, 1rem)",
                }}
              >
                <FaChildIcon className="me-2" style={{ color: "#1a5f7a" }} />
                {isArabic ? "اختر الطفل:" : "Select Child:"}
              </span>
              <div className="d-flex flex-wrap gap-2">
                {children.map((child) => (
                  <Button
                    key={child.id}
                    variant={
                      selectedChild?.id === child.id
                        ? "primary"
                        : "outline-primary"
                    }
                    size="sm"
                    className="rounded-pill px-3 child-select-btn"
                    onClick={() => handleChildSelect(child.id)}
                    style={{
                      ...arabicFontStyle,
                      transition: "all 0.3s ease",
                      boxShadow:
                        selectedChild?.id === child.id
                          ? "0 4px 15px rgba(26, 95, 122, 0.3)"
                          : "none",
                      fontSize: "clamp(0.75rem, 0.9vw, 0.9rem)",
                      padding: "4px 14px",
                    }}
                  >
                    {child.name}
                    {selectedChild?.id === child.id && (
                      <span className="ms-1">✓</span>
                    )}
                    {child.hasNewAnnouncements && (
                      <Badge
                        bg="danger"
                        className="ms-1 rounded-pill"
                        style={{ fontSize: "0.5rem" }}
                      >
                        {formatNumber(
                          child.announcements?.filter((n) => !n.read).length,
                        )}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* ===== STUDENT PROFILE CARD ===== */}
        <div
          className="student-profile-card-modern mb-4"
          style={{
            background: darkMode ? "#1a1a2e" : "#ffffff",
            border: `1px solid ${darkMode ? "#2d2d44" : "#e9ecef"}`,
            borderRadius: "12px",
            overflow: "hidden",
            transition: "all 0.3s ease",
          }}
        >
          <div
            className="profile-top-bar"
            style={{
              height: "4px",
              background: "linear-gradient(90deg, #1a5f7a, #4a9eff, #d4a373)",
            }}
          ></div>
          <div className="profile-content p-3 p-md-4">
            <div className="d-flex flex-wrap align-items-center gap-3 gap-md-4">
              <div
                className="profile-avatar"
                style={{
                  width: "clamp(50px, 6vw, 65px)",
                  height: "clamp(50px, 6vw, 65px)",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #1a5f7a, #2a7f9a)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "clamp(1.2rem, 1.8vw, 1.6rem)",
                  fontWeight: "700",
                  flexShrink: 0,
                }}
              >
                {selectedChild.name.charAt(0)}
              </div>
              <div className="flex-grow-1 min-width-0">
                <h5
                  className="fw-bold mb-1"
                  style={{
                    ...arabicFontStyle,
                    color: darkMode ? "#e9ecef" : "#212529",
                    fontSize: "clamp(1rem, 1.3vw, 1.2rem)",
                  }}
                >
                  {selectedChild.name}
                </h5>
                <div className="d-flex flex-wrap gap-2">
                  <span
                    className="profile-tag"
                    style={{
                      ...arabicFontStyle,
                      fontSize: "clamp(0.65rem, 0.8vw, 0.8rem)",
                      color: darkMode ? "#adb5bd" : "#6c757d",
                      padding: "2px 12px",
                      borderRadius: "50px",
                      background: darkMode ? "#2d2d44" : "#f8f9fa",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <FaBook className="me-1" style={{ fontSize: "0.7rem" }} />{" "}
                    {selectedChild.class}
                  </span>
                  <span
                    className="profile-tag status-active"
                    style={{
                      ...arabicFontStyle,
                      fontSize: "clamp(0.65rem, 0.8vw, 0.8rem)",
                      color: "#2ecc71",
                      padding: "2px 12px",
                      borderRadius: "50px",
                      background: "rgba(46, 204, 113, 0.1)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <FaCheckCircle
                      className="me-1"
                      style={{ fontSize: "0.7rem" }}
                    />{" "}
                    {isArabic ? "نشط" : "Active"}
                  </span>
                  <span
                    className="profile-tag"
                    style={{
                      ...arabicFontStyle,
                      fontSize: "clamp(0.65rem, 0.8vw, 0.8rem)",
                      color: darkMode ? "#adb5bd" : "#6c757d",
                      padding: "2px 12px",
                      borderRadius: "50px",
                      background: darkMode ? "#2d2d44" : "#f8f9fa",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <FaChalkboardTeacher
                      className="me-1"
                      style={{ fontSize: "0.7rem" }}
                    />{" "}
                    {selectedChild.teacher}
                  </span>
                </div>
              </div>
              <div className="d-flex gap-2 gap-md-3 flex-wrap">
                <div
                  className="mini-stat"
                  style={{
                    textAlign: "center",
                    padding: "4px 12px",
                    borderRadius: "8px",
                    background: darkMode ? "#2d2d44" : "#f8f9fa",
                    minWidth: "50px",
                  }}
                >
                  <div
                    className="mini-stat-value"
                    style={{
                      color: "#2ecc71",
                      fontSize: "clamp(0.85rem, 1.1vw, 1.1rem)",
                      fontWeight: "700",
                    }}
                  >
                    {formatNumber(selectedChild.subjects?.length || 0)}
                  </div>
                  <div
                    className="mini-stat-label"
                    style={{
                      fontSize: "clamp(0.5rem, 0.6vw, 0.65rem)",
                      color: darkMode ? "#adb5bd" : "#6c757d",
                    }}
                  >
                    {isArabic ? "مواد" : "Subjects"}
                  </div>
                </div>
                <div
                  className="mini-stat"
                  style={{
                    textAlign: "center",
                    padding: "4px 12px",
                    borderRadius: "8px",
                    background: darkMode ? "#2d2d44" : "#f8f9fa",
                    minWidth: "50px",
                  }}
                >
                  <div
                    className="mini-stat-value"
                    style={{
                      color: "#3498db",
                      fontSize: "clamp(0.85rem, 1.1vw, 1.1rem)",
                      fontWeight: "700",
                    }}
                  >
                    {formatNumber(selectedChild.attendance)}%
                  </div>
                  <div
                    className="mini-stat-label"
                    style={{
                      fontSize: "clamp(0.5rem, 0.6vw, 0.65rem)",
                      color: darkMode ? "#adb5bd" : "#6c757d",
                    }}
                  >
                    {isArabic ? "حضور" : "Attendance"}
                  </div>
                </div>
                <div
                  className="mini-stat"
                  style={{
                    textAlign: "center",
                    padding: "4px 12px",
                    borderRadius: "8px",
                    background: darkMode ? "#2d2d44" : "#f8f9fa",
                    minWidth: "50px",
                  }}
                >
                  <div
                    className="mini-stat-value"
                    style={{
                      color: "#f39c12",
                      fontSize: "clamp(0.85rem, 1.1vw, 1.1rem)",
                      fontWeight: "700",
                    }}
                  >
                    {formatNumber(selectedChild.gradedCount || 0)}
                  </div>
                  <div
                    className="mini-stat-label"
                    style={{
                      fontSize: "clamp(0.5rem, 0.6vw, 0.65rem)",
                      color: darkMode ? "#adb5bd" : "#6c757d",
                    }}
                  >
                    {isArabic ? "مصحح" : "Graded"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== STATS CARDS ===== */}
        <Row className="g-3 mb-4">
          {statsCards.map((stat, index) => (
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
                  <div className="min-width-0">
                    <div
                      className="stat-card-label"
                      style={{
                        ...arabicFontStyle,
                        fontSize: "clamp(0.55rem, 0.7vw, 0.7rem)",
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
                      color: darkMode ? "#4a9eff" : "#1a5f7a",
                      fontSize: "clamp(0.8rem, 1vw, 1.1rem)",
                      flexShrink: 0,
                    }}
                  >
                    {stat.icon}
                  </div>
                </div>
              </div>
            </Col>
          ))}
        </Row>

        {/* ===== TABS ===== */}
        <div className="mb-4 tabs-container">
          <Nav
            variant="tabs"
            className="custom-tabs-modern"
            style={{
              borderBottom: `2px solid ${darkMode ? "#2d2d44" : "#e9ecef"}`,
              gap: "4px",
              paddingBottom: "2px",
              overflowX: "auto",
              flexWrap: "nowrap",
            }}
          >
            {tabs.map((tab) => (
              <Nav.Item key={tab.id} style={{ flexShrink: 0 }}>
                <Nav.Link
                  active={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="d-flex align-items-center gap-2"
                  style={{
                    ...arabicFontStyle,
                    color:
                      activeTab === tab.id
                        ? "white"
                        : darkMode
                          ? "#adb5bd"
                          : "#6c757d",
                    border: "none",
                    padding: "clamp(6px, 0.8vw, 10px) clamp(14px, 1.5vw, 24px)",
                    borderRadius: "50px 50px 0 0",
                    transition: "all 0.3s ease",
                    fontWeight: "500",
                    position: "relative",
                    marginBottom: "-2px",
                    background:
                      activeTab === tab.id
                        ? "linear-gradient(135deg, #1a5f7a, #2a7f9a)"
                        : "transparent",
                    boxShadow:
                      activeTab === tab.id
                        ? "0 4px 15px rgba(26, 95, 122, 0.3)"
                        : "none",
                    fontSize: "clamp(0.75rem, 0.9vw, 0.9rem)",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span style={{ fontSize: "clamp(0.7rem, 0.8vw, 0.85rem)" }}>
                    {tab.icon}
                  </span>
                  <span style={{ display: "inline" }}>{tab.label}</span>
                </Nav.Link>
              </Nav.Item>
            ))}
          </Nav>
        </div>

        {/* ===== TAB CONTENT - OVERVIEW ===== */}
        {activeTab === "overview" && (
          <Row className="g-4">
            <Col lg={12}>
              <Card
                className="modern-card-glass"
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
                    background: "linear-gradient(90deg, #1a5f7a, #4a9eff)",
                  }}
                ></div>
                <Card.Header
                  className="bg-transparent border-bottom"
                  style={{
                    padding: "12px 16px md:20px",
                    borderColor: darkMode ? "#2d2d44" : "#e9ecef",
                  }}
                >
                  <h6
                    className="fw-bold mb-0"
                    style={{
                      ...arabicFontStyle,
                      color: darkMode ? "#e9ecef" : "#212529",
                      fontSize: "clamp(0.85rem, 1vw, 1rem)",
                    }}
                  >
                    <FaClock className="me-2" style={{ color: "#1a5f7a" }} />
                    {isArabic ? "الأنشطة الأخيرة" : "Recent Activities"}
                  </h6>
                </Card.Header>
                <Card.Body className="p-0">
                  <div className="table-responsive">
                    <Table className="mb-0 activity-table">
                      <thead>
                        <tr>
                          <th
                            style={{
                              ...arabicFontStyle,
                              fontWeight: 600,
                              fontSize: "clamp(0.6rem, 0.7vw, 0.7rem)",
                              textTransform: "uppercase",
                              letterSpacing: "0.3px",
                              color: darkMode ? "#adb5bd" : "#6c757d",
                              borderBottom: `2px solid ${darkMode ? "#2d2d44" : "#e9ecef"}`,
                              padding: "8px 12px md:16px",
                            }}
                          >
                            {isArabic ? "التاريخ" : "Date"}
                          </th>
                          <th
                            style={{
                              ...arabicFontStyle,
                              fontWeight: 600,
                              fontSize: "clamp(0.6rem, 0.7vw, 0.7rem)",
                              textTransform: "uppercase",
                              letterSpacing: "0.3px",
                              color: darkMode ? "#adb5bd" : "#6c757d",
                              borderBottom: `2px solid ${darkMode ? "#2d2d44" : "#e9ecef"}`,
                              padding: "8px 12px md:16px",
                            }}
                          >
                            {isArabic ? "النشاط" : "Activity"}
                          </th>
                          <th
                            style={{
                              ...arabicFontStyle,
                              fontWeight: 600,
                              fontSize: "clamp(0.6rem, 0.7vw, 0.7rem)",
                              textTransform: "uppercase",
                              letterSpacing: "0.3px",
                              color: darkMode ? "#adb5bd" : "#6c757d",
                              borderBottom: `2px solid ${darkMode ? "#2d2d44" : "#e9ecef"}`,
                              padding: "8px 12px md:16px",
                            }}
                          >
                            {isArabic ? "النوع" : "Type"}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedChild.recentActivities &&
                        selectedChild.recentActivities.length > 0 ? (
                          selectedChild.recentActivities.map(
                            (activity, index) => (
                              <tr key={index}>
                                <td
                                  style={{
                                    ...arabicFontStyle,
                                    fontSize: "clamp(0.75rem, 0.85vw, 0.85rem)",
                                    padding: "8px 12px md:16px",
                                    color: darkMode ? "#e9ecef" : "#212529",
                                  }}
                                >
                                  {activity.date}
                                </td>
                                <td
                                  style={{
                                    ...arabicFontStyle,
                                    fontSize: "clamp(0.75rem, 0.85vw, 0.85rem)",
                                    padding: "8px 12px md:16px",
                                    color: darkMode ? "#e9ecef" : "#212529",
                                  }}
                                >
                                  {activity.activity}
                                </td>
                                <td style={{ padding: "8px 12px md:16px" }}>
                                  <Badge
                                    bg={
                                      activity.type === "submission"
                                        ? "info"
                                        : "primary"
                                    }
                                    className="rounded-pill"
                                    style={{
                                      fontSize: "clamp(0.5rem, 0.6vw, 0.6rem)",
                                      padding: "3px 8px",
                                    }}
                                  >
                                    {activity.type === "submission"
                                      ? isArabic
                                        ? "تقديم"
                                        : "Submission"
                                      : isArabic
                                        ? "تقييم"
                                        : "Assessment"}
                                  </Badge>
                                </td>
                              </tr>
                            ),
                          )
                        ) : (
                          <tr>
                            <td colSpan="3" className="text-center py-3">
                              <span
                                className="text-muted"
                                style={{
                                  ...arabicFontStyle,
                                  color: darkMode ? "#adb5bd" : "#6c757d",
                                }}
                              >
                                {isArabic
                                  ? "لا توجد أنشطة حديثة"
                                  : "No recent activities"}
                              </span>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* ===== TAB CONTENT - ACADEMICS ===== */}
        {activeTab === "academics" && (
          <Row className="g-3">
            {selectedChild.subjects && selectedChild.subjects.length > 0 ? (
              selectedChild.subjects.map((subject, index) => {
                const isGraded = subject.isGraded && subject.score > 0;
                const statusInfo = isGraded
                  ? getStatusBadge("graded")
                  : subject.hasSubmitted
                    ? getStatusBadge("submitted")
                    : getStatusBadge("pending");
                const gradeColor = getGradeColor(
                  subject.score,
                  subject.totalMarks,
                );

                return (
                  <Col key={index} xs={12} sm={6} lg={4}>
                    <div
                      className="subject-card-modern"
                      style={{
                        borderRadius: "12px",
                        border: `1px solid ${darkMode ? "#2d2d44" : "#e9ecef"}`,
                        background: darkMode ? "#1a1a2e" : "#ffffff",
                        overflow: "hidden",
                        transition: "all 0.3s ease",
                        height: "100%",
                      }}
                    >
                      <div
                        className="subject-card-top-bar"
                        style={{
                          height: "3px",
                          background: isGraded ? gradeColor : "#6c757d",
                        }}
                      ></div>
                      <Card.Body className="p-3 p-md-4">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div className="min-width-0">
                            <h6
                              className="fw-bold mb-0"
                              style={{
                                ...arabicFontStyle,
                                color: darkMode ? "#e9ecef" : "#212529",
                                fontSize: "clamp(0.8rem, 0.95vw, 0.95rem)",
                              }}
                            >
                              <span
                                className="me-2"
                                style={{
                                  fontSize: "clamp(0.7rem, 0.8vw, 0.85rem)",
                                }}
                              >
                                {getSubjectIcon(subject.name)}
                              </span>
                              <span
                                className="text-truncate d-inline-block"
                                style={{ maxWidth: "120px" }}
                              >
                                {isArabic
                                  ? subject.nameAr || subject.name
                                  : subject.name}
                              </span>
                            </h6>
                            <small
                              className="text-muted d-block"
                              style={{
                                ...arabicFontStyle,
                                color: darkMode ? "#adb5bd" : "#6c757d",
                                fontSize: "clamp(0.65rem, 0.75vw, 0.75rem)",
                              }}
                            >
                              {isGraded
                                ? `${isArabic ? "الدرجة" : "Score"}: ${formatNumber(subject.score)}/${formatNumber(subject.totalMarks)}`
                                : isArabic
                                  ? "بانتظار التصحيح"
                                  : "Pending Grading"}
                            </small>
                          </div>
                          {isGraded ? (
                            <Badge
                              className="grade-badge"
                              style={{
                                background: gradeColor,
                                color: "white",
                                padding: "4px 12px",
                                borderRadius: "50px",
                                fontSize: "clamp(0.65rem, 0.75vw, 0.75rem)",
                                boxShadow: `0 2px 10px ${gradeColor}40`,
                                flexShrink: 0,
                              }}
                            >
                              {subject.grade}
                            </Badge>
                          ) : (
                            <Badge
                              className="grade-badge"
                              style={{
                                background: subject.hasSubmitted
                                  ? "#f39c12"
                                  : "#6c757d",
                                color: "white",
                                padding: "4px 12px",
                                borderRadius: "50px",
                                fontSize: "clamp(0.55rem, 0.65vw, 0.65rem)",
                                flexShrink: 0,
                              }}
                            >
                              {subject.hasSubmitted
                                ? isArabic
                                  ? "مرسل"
                                  : "Submitted"
                                : isArabic
                                  ? "قيد الانتظار"
                                  : "Pending"}
                            </Badge>
                          )}
                        </div>
                        {isGraded && (
                          <>
                            <ProgressBar
                              now={(subject.score / subject.totalMarks) * 100}
                              variant="primary"
                              style={{
                                height: "5px",
                                borderRadius: "3px",
                                background: darkMode
                                  ? "#2d2d44"
                                  : "rgba(0,0,0,0.05)",
                                marginTop: "6px",
                              }}
                            />
                            <div className="mt-1 d-flex justify-content-between">
                              <small
                                className="text-muted"
                                style={{
                                  ...arabicFontStyle,
                                  color: darkMode ? "#adb5bd" : "#6c757d",
                                  fontSize: "clamp(0.55rem, 0.6vw, 0.6rem)",
                                }}
                              >
                                {isArabic ? "التقدم" : "Progress"}
                              </small>
                              <small
                                className="text-muted"
                                style={{
                                  ...arabicFontStyle,
                                  color: darkMode ? "#adb5bd" : "#6c757d",
                                  fontSize: "clamp(0.55rem, 0.6vw, 0.6rem)",
                                }}
                              >
                                {Math.round(
                                  (subject.score / subject.totalMarks) * 100,
                                )}
                                %
                              </small>
                            </div>
                          </>
                        )}
                        <div
                          className="subject-card-footer mt-2"
                          style={{
                            borderTop: `1px solid ${darkMode ? "#2d2d44" : "#e9ecef"}`,
                            paddingTop: "6px",
                            marginTop: "6px",
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-center flex-wrap gap-1">
                            <span
                              className="subject-progress-text"
                              style={{
                                ...arabicFontStyle,
                                fontSize: "clamp(0.55rem, 0.65vw, 0.65rem)",
                                color: darkMode ? "#adb5bd" : "#6c757d",
                                fontWeight: 500,
                              }}
                            >
                              {isGraded
                                ? subject.score >= subject.totalMarks * 0.9
                                  ? "🌟 " + (isArabic ? "ممتاز" : "Excellent")
                                  : subject.score >= subject.totalMarks * 0.8
                                    ? "⭐ " +
                                      (isArabic ? "جيد جداً" : "Very Good")
                                    : subject.score >= subject.totalMarks * 0.7
                                      ? "📚 " + (isArabic ? "جيد" : "Good")
                                      : "📖 " +
                                        (isArabic
                                          ? "يحتاج تحسين"
                                          : "Needs Improvement")
                                : subject.hasSubmitted
                                  ? "⏳ " +
                                    (isArabic
                                      ? "بانتظار التصحيح"
                                      : "Awaiting Grading")
                                  : "📝 " +
                                    (isArabic ? "لم يقدم" : "Not Submitted")}
                            </span>
                            <Badge
                              bg={statusInfo.bg}
                              className="rounded-pill"
                              style={{
                                fontSize: "clamp(0.45rem, 0.5vw, 0.55rem)",
                                padding: "2px 8px",
                              }}
                            >
                              {statusInfo.icon} {statusInfo.label}
                            </Badge>
                          </div>
                        </div>
                      </Card.Body>
                    </div>
                  </Col>
                );
              })
            ) : (
              <Col md={12}>
                <div className="text-center py-4">
                  <div className="display-4 text-muted opacity-25 mb-2">📚</div>
                  <h5 style={arabicFontStyle}>
                    {isArabic ? "لا توجد مواد مسجلة" : "No subjects registered"}
                  </h5>
                  <p className="text-muted" style={arabicFontStyle}>
                    {isArabic
                      ? "سيتم عرض المواد الدراسية هنا"
                      : "Subjects will appear here"}
                  </p>
                </div>
              </Col>
            )}
          </Row>
        )}

        {/* ===== TAB CONTENT - ANNOUNCEMENTS ===== */}
        {activeTab === "announcements" && (
          <Row className="g-4">
            <Col md={12}>
              <Card
                className="modern-card-glass"
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
                    background: "linear-gradient(90deg, #f2994a, #f2c94c)",
                  }}
                ></div>
                <Card.Header
                  className="bg-transparent border-bottom"
                  style={{
                    padding: "12px 16px md:20px",
                    borderColor: darkMode ? "#2d2d44" : "#e9ecef",
                  }}
                >
                  <h6
                    className="fw-bold mb-0"
                    style={{
                      ...arabicFontStyle,
                      color: darkMode ? "#e9ecef" : "#212529",
                      fontSize: "clamp(0.85rem, 1vw, 1rem)",
                    }}
                  >
                    <FaBullhorn className="me-2" style={{ color: "#f39c12" }} />
                    {isArabic ? "جميع الإشعارات" : "All Announcements"}
                    {selectedChild.announcements &&
                      selectedChild.announcements.length > 0 && (
                        <Badge bg="primary" className="ms-2 rounded-pill">
                          {formatNumber(selectedChild.announcements.length)}
                        </Badge>
                      )}
                  </h6>
                </Card.Header>
                <Card.Body className="p-0">
                  {selectedChild.announcements &&
                  selectedChild.announcements.length > 0 ? (
                    selectedChild.announcements.map((announcement, index) => (
                      <div
                        key={index}
                        className="announcement-item-full"
                        style={{
                          padding: "12px 16px md:20px",
                          borderBottom: `1px solid ${darkMode ? "#2d2d44" : "#e9ecef"}`,
                          transition: "all 0.3s ease",
                          cursor: "pointer",
                          background: !announcement.read
                            ? darkMode
                              ? "rgba(26, 95, 122, 0.12)"
                              : "rgba(26, 95, 122, 0.04)"
                            : "transparent",
                        }}
                        onClick={() => handleViewAnnouncement(announcement)}
                      >
                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                          <div className="min-width-0">
                            <div
                              className="fw-semibold"
                              style={{
                                ...arabicFontStyle,
                                color: darkMode ? "#e9ecef" : "#212529",
                                fontSize: "clamp(0.8rem, 0.95vw, 0.95rem)",
                              }}
                            >
                              {!announcement.read && (
                                <span
                                  className="badge bg-danger rounded-pill me-2"
                                  style={{
                                    fontSize: "clamp(0.4rem, 0.5vw, 0.5rem)",
                                  }}
                                >
                                  NEW
                                </span>
                              )}
                              <span
                                className="text-truncate d-inline-block"
                                style={{ maxWidth: "200px" }}
                              >
                                {announcement.title}
                              </span>
                            </div>
                            <div className="d-flex flex-wrap gap-2 mt-1">
                              <small
                                className="text-muted"
                                style={{
                                  ...arabicFontStyle,
                                  color: darkMode ? "#adb5bd" : "#6c757d",
                                  fontSize: "clamp(0.55rem, 0.65vw, 0.65rem)",
                                }}
                              >
                                <FaCalendarAlt
                                  className="me-1"
                                  style={{ fontSize: "0.6rem" }}
                                />{" "}
                                {announcement.date}
                              </small>
                              <small
                                className="text-muted"
                                style={{
                                  ...arabicFontStyle,
                                  color: darkMode ? "#adb5bd" : "#6c757d",
                                  fontSize: "clamp(0.55rem, 0.65vw, 0.65rem)",
                                }}
                              >
                                <FaUserTie
                                  className="me-1"
                                  style={{ fontSize: "0.6rem" }}
                                />{" "}
                                {announcement.teacher || selectedChild.teacher}
                              </small>
                            </div>
                          </div>
                          <div className="d-flex gap-2 align-items-center flex-shrink-0">
                            {getPriorityBadge(announcement.priority)}
                            <Button
                              variant="primary"
                              size="sm"
                              className="view-full-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewAnnouncement(announcement);
                              }}
                              style={{
                                borderRadius: "50px",
                                padding: "2px 12px",
                                fontSize: "clamp(0.6rem, 0.7vw, 0.7rem)",
                                transition: "all 0.3s ease",
                                ...arabicFontStyle,
                              }}
                            >
                              <FaEye
                                className="me-1"
                                style={{ fontSize: "0.6rem" }}
                              />{" "}
                              {isArabic ? "عرض" : "View"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <div className="display-4 text-muted opacity-25 mb-2">
                        📢
                      </div>
                      <h5 style={arabicFontStyle}>
                        {isArabic ? "لا توجد إشعارات" : "No announcements"}
                      </h5>
                      <p className="text-muted" style={arabicFontStyle}>
                        {isArabic
                          ? "سيتم عرض الإشعارات هنا عند إضافتها"
                          : "Announcements will appear here when added"}
                      </p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* ===== ANNOUNCEMENT DETAIL MODAL ===== */}
        <Modal
          show={showAnnouncementModal}
          onHide={() => setShowAnnouncementModal(false)}
          centered
          size="lg"
          className="announcement-modal modern-modal"
        >
          <Modal.Header
            closeButton
            className="border-0"
            style={{
              padding: "clamp(12px, 2vw, 20px) clamp(16px, 2.5vw, 24px) 0",
              borderBottom: "none",
            }}
          >
            <Modal.Title
              className="d-flex align-items-center gap-2"
              style={{
                ...arabicFontStyle,
                color: darkMode ? "#e9ecef" : "#212529",
                fontSize: "clamp(0.95rem, 1.2vw, 1.2rem)",
              }}
            >
              <FaBullhorn
                className="text-warning"
                style={{ fontSize: "clamp(0.9rem, 1.1vw, 1.1rem)" }}
              />
              <span>{selectedAnnouncement?.title}</span>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body
            style={{
              padding:
                "clamp(8px, 1.5vw, 16px) clamp(16px, 2.5vw, 24px) clamp(12px, 2vw, 20px)",
            }}
          >
            {selectedAnnouncement && (
              <>
                <div
                  className="announcement-meta-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                    gap: "6px",
                    padding: "clamp(8px, 1vw, 16px) clamp(12px, 1.5vw, 20px)",
                    background: darkMode ? "#2d2d44" : "#f8f9fa",
                    borderRadius: "10px",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    className="announcement-meta-item"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "clamp(0.65rem, 0.75vw, 0.75rem)",
                      color: darkMode ? "#adb5bd" : "#6c757d",
                    }}
                  >
                    <FaCalendarAlt style={{ fontSize: "0.65rem" }} />
                    <span style={{ fontWeight: 600 }}>
                      {isArabic ? "التاريخ:" : "Date:"}
                    </span>
                    <span
                      style={{
                        fontWeight: 500,
                        color: darkMode ? "#e9ecef" : "#212529",
                      }}
                    >
                      {selectedAnnouncement.date}
                    </span>
                  </div>
                  <div
                    className="announcement-meta-item"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "clamp(0.65rem, 0.75vw, 0.75rem)",
                      color: darkMode ? "#adb5bd" : "#6c757d",
                    }}
                  >
                    <FaUserTie style={{ fontSize: "0.65rem" }} />
                    <span style={{ fontWeight: 600 }}>
                      {isArabic ? "المعلم:" : "Teacher:"}
                    </span>
                    <span
                      style={{
                        fontWeight: 500,
                        color: darkMode ? "#e9ecef" : "#212529",
                      }}
                    >
                      {selectedAnnouncement.teacher || selectedChild?.teacher}
                    </span>
                  </div>
                  <div
                    className="announcement-meta-item"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "clamp(0.65rem, 0.75vw, 0.75rem)",
                      color: darkMode ? "#adb5bd" : "#6c757d",
                    }}
                  >
                    <FaTag style={{ fontSize: "0.65rem" }} />
                    <span style={{ fontWeight: 600 }}>
                      {isArabic ? "الأولوية:" : "Priority:"}
                    </span>
                    <span>
                      {getPriorityBadge(selectedAnnouncement.priority)}
                    </span>
                  </div>
                  <div
                    className="announcement-meta-item"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "clamp(0.65rem, 0.75vw, 0.75rem)",
                      color: darkMode ? "#adb5bd" : "#6c757d",
                    }}
                  >
                    <FaChildIcon style={{ fontSize: "0.65rem" }} />
                    <span style={{ fontWeight: 600 }}>
                      {isArabic ? "الطالب:" : "Student:"}
                    </span>
                    <span
                      style={{
                        fontWeight: 500,
                        color: darkMode ? "#e9ecef" : "#212529",
                      }}
                    >
                      {selectedChild?.name}
                    </span>
                  </div>
                </div>

                <div
                  className="announcement-content-wrapper"
                  style={{
                    position: "relative",
                    padding: "clamp(12px, 1.5vw, 20px) clamp(14px, 2vw, 24px)",
                    margin: "6px 0",
                    background: darkMode ? "#2d2d44" : "#f8f9fa",
                    borderRadius: "10px",
                    borderLeft: `3px solid #d4a373`,
                  }}
                >
                  <div
                    className="announcement-quote-icon"
                    style={{
                      color: "rgba(212, 163, 115, 0.15)",
                      fontSize: "clamp(1rem, 1.2vw, 1.2rem)",
                      marginBottom: "4px",
                    }}
                  >
                    <FaQuoteLeft />
                  </div>
                  <div
                    className="announcement-content-text"
                    style={{
                      ...arabicFontStyle,
                      fontSize: "clamp(0.85rem, 1vw, 1rem)",
                      lineHeight: "1.7",
                      color: darkMode ? "#e9ecef" : "#212529",
                      padding: "0 4px",
                    }}
                  >
                    {selectedAnnouncement.content}
                  </div>
                  <div
                    className="announcement-quote-icon-end"
                    style={{
                      color: "rgba(212, 163, 115, 0.15)",
                      fontSize: "clamp(1rem, 1.2vw, 1.2rem)",
                      textAlign: "right",
                      marginTop: "4px",
                    }}
                  >
                    <FaQuoteRight />
                  </div>
                </div>

                <div
                  className="announcement-footer-modern mt-3 pt-2"
                  style={{
                    borderTop: `1px solid ${darkMode ? "#2d2d44" : "#e9ecef"}`,
                    paddingTop: "8px",
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <span
                      className="text-muted small"
                      style={{
                        ...arabicFontStyle,
                        color: darkMode ? "#adb5bd" : "#6c757d",
                        fontSize: "clamp(0.6rem, 0.7vw, 0.7rem)",
                      }}
                    >
                      <FaClock
                        className="me-1"
                        style={{ fontSize: "0.6rem" }}
                      />
                      {isArabic ? "تم النشر في" : "Posted on"}{" "}
                      {selectedAnnouncement.date}
                    </span>
                    <span
                      className="text-muted small"
                      style={{
                        ...arabicFontStyle,
                        color: darkMode ? "#adb5bd" : "#6c757d",
                        fontSize: "clamp(0.6rem, 0.7vw, 0.7rem)",
                      }}
                    >
                      <FaUser className="me-1" style={{ fontSize: "0.6rem" }} />
                      {isArabic ? "بواسطة" : "By"}{" "}
                      {selectedAnnouncement.teacher || selectedChild?.teacher}
                    </span>
                  </div>
                </div>
              </>
            )}
          </Modal.Body>
          <Modal.Footer
            className="border-0"
            style={{
              padding:
                "clamp(8px, 1vw, 16px) clamp(16px, 2.5vw, 24px) clamp(12px, 2vw, 20px)",
              borderTop: "none",
            }}
          >
            <Button
              variant="secondary"
              onClick={() => setShowAnnouncementModal(false)}
              className="px-4"
              style={{
                borderRadius: "50px",
                ...arabicFontStyle,
                fontSize: "clamp(0.8rem, 0.9vw, 0.9rem)",
              }}
            >
              <FaTimes className="me-2" style={{ fontSize: "0.8rem" }} />{" "}
              {isArabic ? "إغلاق" : "Close"}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setShowAnnouncementModal(false);
                if (selectedAnnouncement && !selectedAnnouncement.read) {
                  const allNotifications = JSON.parse(
                    localStorage.getItem("school_notifications") || "[]",
                  );
                  const notification = allNotifications.find(
                    (n) => n.id === selectedAnnouncement.id,
                  );
                  if (notification) {
                    notification.read = true;
                    localStorage.setItem(
                      "school_notifications",
                      JSON.stringify(allNotifications),
                    );
                    loadChildrenData();
                  }
                }
                if (notify) {
                  notify(
                    isArabic ? "تم وضع علامة مقروء" : "Marked as read",
                    "success",
                  );
                }
              }}
              className="px-4"
              style={{
                borderRadius: "50px",
                ...arabicFontStyle,
                fontSize: "clamp(0.8rem, 0.9vw, 0.9rem)",
              }}
            >
              <FaCheck className="me-2" style={{ fontSize: "0.8rem" }} />{" "}
              {isArabic ? "تحديد كمقروء" : "Mark as Read"}
            </Button>
          </Modal.Footer>
        </Modal>

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .spinning {
            animation: spin 1s linear infinite;
          }

          .parent-dashboard { padding: 0; }

          .dashboard-header .header-btn {
            border-radius: 50px;
            padding: 4px 16px;
            transition: all 0.3s ease;
            font-weight: 500;
            font-size: clamp(0.7rem, 0.8vw, 0.85rem);
          }
          .dashboard-header .header-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          }

          .child-selector-card {
            border-radius: 12px !important;
          }

          .child-select-btn {
            transition: all 0.3s ease;
            border-radius: 50px !important;
            font-size: clamp(0.7rem, 0.85vw, 0.85rem) !important;
            padding: 4px 14px !important;
          }
          .child-select-btn:hover {
            transform: translateY(-2px);
          }

          .student-profile-card-modern {
            transition: all 0.3s ease;
          }
          .student-profile-card-modern:hover {
            box-shadow: 0 4px 20px rgba(0,0,0,0.06);
          }

          .profile-tag {
            transition: all 0.3s ease;
          }
          .student-profile-card-modern:hover .profile-tag {
            transform: translateY(-1px);
          }

          .mini-stat {
            transition: all 0.3s ease;
          }
          .mini-stat:hover {
            transform: translateY(-2px);
            box-shadow: 0 2px 10px rgba(0,0,0,0.06);
          }

          .stat-card-small {
            transition: all 0.3s ease;
          }
          .stat-card-small:hover {
            transform: translateY(-3px);
            box-shadow: 0 6px 25px rgba(0,0,0,0.08);
          }

          .stat-card-small:hover .stat-card-top-bar {
            height: 4px;
          }

          .stat-card-icon {
            transition: all 0.3s ease;
          }
          .stat-card-small:hover .stat-card-icon {
            transform: scale(1.1) rotate(-5deg);
            background: rgba(26, 95, 122, 0.15);
          }

          .modern-card-glass {
            border-radius: 12px !important;
            transition: all 0.3s ease;
            overflow: hidden;
          }
          .modern-card-glass:hover {
            box-shadow: 0 4px 20px rgba(0,0,0,0.06) !important;
          }

          .card-top-bar {
            transition: height 0.3s ease;
          }
          .modern-card-glass:hover .card-top-bar {
            height: 4px;
          }

          .activity-table th {
            font-weight: 600;
            font-size: clamp(0.6rem, 0.7vw, 0.7rem);
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }
          .activity-table td {
            vertical-align: middle;
            padding: 8px 12px;
          }

          .announcement-item-full:hover {
            background: ${darkMode ? "#2d2d44" : "#f8f9fa"} !important;
          }

          .view-full-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 4px 15px rgba(26, 95, 122, 0.3);
          }

          .subject-card-modern:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 30px rgba(0,0,0,0.08);
          }

          .subject-card-modern:hover .subject-card-top-bar {
            height: 4px;
          }

          .subject-card-modern:hover .grade-badge {
            transform: scale(1.05);
          }

          .custom-tabs-modern {
            display: flex !important;
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
            gap: 4px !important;
            padding-bottom: 4px !important;
            -webkit-overflow-scrolling: touch;
          }
          .custom-tabs-modern::-webkit-scrollbar {
            height: 2px !important;
          }
          .custom-tabs-modern::-webkit-scrollbar-thumb {
            background: #1a5f7a !important;
            border-radius: 4px !important;
          }
          .custom-tabs-modern .nav-link {
            font-size: clamp(0.7rem, 0.85vw, 0.85rem) !important;
            padding: 6px 16px !important;
            white-space: nowrap !important;
            flex-shrink: 0 !important;
          }
          .custom-tabs-modern .nav-link:hover {
            color: #1a5f7a;
            background: rgba(26, 95, 122, 0.06);
          }

          .announcement-modal .modal-content {
            border-radius: 16px;
            border: none;
            box-shadow: 0 20px 60px rgba(0,0,0,0.15);
            overflow: hidden;
          }

          .modern-modal .modal-content {
            border-radius: 16px;
            border: none;
            box-shadow: 0 20px 60px rgba(0,0,0,0.15);
          }

          .dashboard-wrapper.rtl .announcement-content-wrapper {
            border-left: none;
            border-right: 3px solid #d4a373;
          }

          .dashboard-wrapper.rtl .announcement-quote-icon-end {
            text-align: left;
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

          /* ===== DARK MODE TEXT FIXES ===== */
          .dashboard-wrapper.dark-theme .text-muted {
            color: #adb5bd !important;
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
          .dashboard-wrapper.dark-theme .modern-card-glass {
            background: #1a1a2e !important;
            border-color: #2d2d44 !important;
          }
          .dashboard-wrapper.dark-theme .mini-stat {
            background: #2d2d44 !important;
          }
          .dashboard-wrapper.dark-theme .mini-stat-label {
            color: #adb5bd !important;
          }
          .dashboard-wrapper.dark-theme .profile-tag {
            background: #2d2d44 !important;
            color: #adb5bd !important;
          }
          .dashboard-wrapper.dark-theme .child-selector-card {
            background: #1a1a2e !important;
            border-color: #2d2d44 !important;
          }
          .dashboard-wrapper.dark-theme .announcement-item-full {
            border-color: #2d2d44 !important;
          }
          .dashboard-wrapper.dark-theme .announcement-meta-grid {
            background: #2d2d44 !important;
          }
          .dashboard-wrapper.dark-theme .announcement-content-wrapper {
            background: #2d2d44 !important;
          }
          .dashboard-wrapper.dark-theme .announcement-content-text {
            color: #e9ecef !important;
          }
          .dashboard-wrapper.dark-theme .custom-tabs-modern .nav-link {
            color: #adb5bd !important;
          }
          .dashboard-wrapper.dark-theme .custom-tabs-modern .nav-link.active {
            color: white !important;
          }

          @media (max-width: 768px) {
            .profile-content {
              padding: 14px 16px !important;
            }
            .profile-avatar {
              width: 44px !important;
              height: 44px !important;
              font-size: 1.1rem !important;
            }
            .mini-stat {
              padding: 2px 8px !important;
              min-width: 40px !important;
            }
            .mini-stat-value {
              font-size: 0.8rem !important;
            }
            .mini-stat-label {
              font-size: 0.45rem !important;
            }
            .stat-card-small {
              height: 75px !important;
            }
            .stat-card-body {
              padding: 8px 12px !important;
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
              font-size: 0.5rem !important;
            }
            .custom-tabs-modern .nav-link {
              padding: 4px 12px !important;
              font-size: 0.7rem !important;
            }
            .custom-tabs-modern .nav-link span {
              font-size: 0.65rem !important;
            }
            .announcement-item-full {
              padding: 10px 14px !important;
            }
            .announcement-item-full .fw-semibold {
              font-size: 0.8rem !important;
            }
            .announcement-meta-grid {
              grid-template-columns: 1fr 1fr !important;
              gap: 4px !important;
              padding: 8px 12px !important;
            }
            .announcement-content-wrapper {
              padding: 10px 14px !important;
            }
            .announcement-content-text {
              font-size: 0.8rem !important;
            }
            .subject-card-modern .p-3 {
              padding: 10px 12px !important;
            }
            .subject-card-modern h6 {
              font-size: 0.8rem !important;
            }
            .view-full-btn {
              font-size: 0.6rem !important;
              padding: 2px 8px !important;
            }
            .activity-table td {
              font-size: 0.7rem !important;
              padding: 6px 10px !important;
            }
            .activity-table th {
              font-size: 0.55rem !important;
              padding: 6px 10px !important;
            }
          }

          @media (max-width: 576px) {
            .stat-card-small {
              height: 70px !important;
            }
            .stat-card-value {
              font-size: 0.95rem !important;
            }
            .stat-card-label {
              font-size: 0.45rem !important;
            }
            .stat-card-icon {
              width: 24px !important;
              height: 24px !important;
              font-size: 0.65rem !important;
            }
            .profile-avatar {
              width: 38px !important;
              height: 38px !important;
              font-size: 0.9rem !important;
            }
            .profile-tag {
              font-size: 0.55rem !important;
              padding: 1px 6px !important;
            }
            .mini-stat {
              padding: 2px 6px !important;
              min-width: 35px !important;
            }
            .mini-stat-value {
              font-size: 0.7rem !important;
            }
            .mini-stat-label {
              font-size: 0.4rem !important;
            }
            .custom-tabs-modern .nav-link {
              padding: 3px 8px !important;
              font-size: 0.6rem !important;
            }
            .custom-tabs-modern .nav-link span {
              display: none !important;
            }
            .custom-tabs-modern .nav-link svg {
              font-size: 0.75rem !important;
            }
            .view-full-btn {
              font-size: 0.55rem !important;
              padding: 2px 6px !important;
            }
            .view-full-btn .me-1 {
              margin-right: 0.1rem !important;
            }
            .modern-modal .modal-body {
              padding: 10px 14px !important;
            }
            .modern-modal .modal-header {
              padding: 10px 14px 0 !important;
            }
            .modern-modal .modal-footer {
              padding: 6px 14px 10px !important;
            }
            .announcement-content-text {
              font-size: 0.75rem !important;
            }
            .announcement-meta-grid {
              grid-template-columns: 1fr !important;
              gap: 3px !important;
              padding: 6px 10px !important;
            }
            .announcement-meta-item {
              font-size: 0.6rem !important;
            }
            .announcement-content-wrapper {
              padding: 8px 12px !important;
            }
            .announcement-quote-icon,
            .announcement-quote-icon-end {
              font-size: 0.8rem !important;
            }
            .subject-card-modern .p-3 {
              padding: 8px 10px !important;
            }
            .subject-card-modern h6 {
              font-size: 0.75rem !important;
            }
            .subject-card-modern .grade-badge {
              font-size: 0.5rem !important;
              padding: 2px 8px !important;
            }
            .activity-table td {
              font-size: 0.65rem !important;
              padding: 4px 8px !important;
            }
            .activity-table th {
              font-size: 0.5rem !important;
              padding: 4px 8px !important;
            }
            .dashboard-header h4 {
              font-size: 1.1rem !important;
            }
            .dashboard-header .header-btn {
              font-size: 0.65rem !important;
              padding: 2px 10px !important;
            }
            .child-select-btn {
              font-size: 0.65rem !important;
              padding: 2px 10px !important;
            }
            .profile-content {
              padding: 10px 12px !important;
            }
            .profile-content .d-flex {
              gap: 8px !important;
            }
            .stat-card-small {
              height: 65px !important;
            }
            .stat-card-body {
              padding: 6px 10px !important;
            }
          }
        `}</style>
      </Container>
    </div>
  );
};

export default ParentDashboard;
