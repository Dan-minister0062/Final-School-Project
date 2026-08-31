// src/components/dashboard/teacher/Reports.jsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Badge,
  Button,
  Form,
  Modal,
  Alert,
  Pagination,
  InputGroup,
  ProgressBar,
} from "react-bootstrap";
import {
  FaFilePdf,
  FaDownload,
  FaPlus,
  FaEye,
  FaSearch,
  FaFilter,
  FaChartBar,
  FaChartLine,
  FaChartPie,
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaUsers,
  FaGraduationCap,
  FaAward,
  FaFileAlt,
  FaFileExcel,
  FaExclamationTriangle,
  FaChevronDown,
  FaChevronUp,
  FaPrint,
  FaShare,
  FaEnvelope,
  FaSync,
  FaArrowRight,
  FaStar,
  FaRegStar,
  FaInfoCircle,
  FaBuilding,
  FaUserFriends,
  FaClipboardCheck,
  FaRocket,
  FaTrophy,
  FaPercent,
  FaArrowUp,
  FaArrowDown,
  FaCog,
  FaSlidersH,
  FaCalendarWeek,
  FaClock as FaClockIcon,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaBook,
  FaSchool,
  FaTrash,
  FaEdit,
  FaSave,
  FaTimes,
  FaPaperPlane,
} from "react-icons/fa";
import { useLanguage } from "../../../context/LanguageContext";
import { getTranslation } from "../../../utils/translations";
import { useNotification } from "../../../hooks/useNotification";
import { useAuth } from "../../../hooks/useAuth";
import { Bar, Doughnut, Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
);

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

// ===== NUMBER FORMATTING - ALWAYS ENGLISH NUMBERS =====
const formatNumber = (num) => {
  if (num === undefined || num === null) return "0";
  const numStr = typeof num === "string" ? num : num.toString();
  return numStr;
};

const Reports = () => {
  const { language, isArabic } = useLanguage();
  const t = (key) => getTranslation(key, language);
  const { notify } = useNotification();
  const { user } = useAuth();

  // ===== STATE =====
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState("all");
  const [dateRange, setDateRange] = useState("month");
  const [selectedReport, setSelectedReport] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [generatedReports, setGeneratedReports] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "performance",
    category: "academic",
    date: "",
  });
  const itemsPerPage = 4;

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

  // ===== GENERATE REPORTS =====
  const generateReports = () => {
    setGenerating(true);
    setLoading(true);
    setTimeout(() => {
      const reports = [
        {
          id: 1,
          title: isArabic ? "تقرير أداء الطلاب" : "Student Performance Report",
          description: isArabic
            ? "تقرير شامل عن أداء الطلاب في جميع المواد"
            : "Comprehensive report of student performance across all subjects",
          type: "performance",
          category: "academic",
          icon: <FaChartLine />,
          color: "#1a5f7a",
          gradient: "linear-gradient(135deg, #1a5f7a 0%, #2a7f9a 100%)",
          chartType: "bar",
          data: {
            totalStudents: 85,
            average: 86,
            excellent: 32,
            good: 28,
            fair: 18,
            needsImprovement: 7,
            subjects: {
              Mathematics: 82,
              Science: 79,
              English: 85,
              Arabic: 88,
              "Islamic Studies": 92,
            },
            classPerformance: {
              "Secondary 3A": 88,
              "Primary 5B": 84,
              "Secondary 2A": 82,
              "Primary 6A": 90,
            },
          },
          generatedAt: new Date().toISOString(),
          size: "2.4 MB",
          pages: 12,
        },
        {
          id: 2,
          title: isArabic ? "تقرير الحضور" : "Attendance Report",
          description: isArabic
            ? "تقرير الحضور الشهري للطلاب"
            : "Monthly attendance report for students",
          type: "attendance",
          category: "academic",
          icon: <FaClockIcon />,
          color: "#f39c12",
          gradient: "linear-gradient(135deg, #f39c12 0%, #e67e22 100%)",
          chartType: "line",
          data: {
            overall: 92,
            present: 78,
            absent: 5,
            excused: 2,
            monthlyTrend: [85, 88, 90, 87, 92, 95],
            classAttendance: {
              "Secondary 3A": 94,
              "Primary 5B": 91,
              "Secondary 2A": 88,
              "Primary 6A": 95,
            },
          },
          generatedAt: new Date().toISOString(),
          size: "1.8 MB",
          pages: 8,
        },
        {
          id: 3,
          title: isArabic ? "تقرير التقييمات" : "Assessment Report",
          description: isArabic
            ? "تقرير شامل عن نتائج التقييمات والاختبارات"
            : "Comprehensive report of assessment and test results",
          type: "assessment",
          category: "academic",
          icon: <FaFileAlt />,
          color: "#2d6a4f",
          gradient: "linear-gradient(135deg, #2d6a4f 0%, #40916c 100%)",
          chartType: "pie",
          data: {
            totalAssessments: 24,
            averageScore: 78,
            passed: 85,
            failed: 15,
            assessmentTypes: {
              "Weekly Quizzes": 10,
              "Monthly Tests": 6,
              "Term Exams": 4,
              Projects: 4,
            },
            subjectScores: {
              Mathematics: 76,
              Science: 80,
              English: 82,
              Arabic: 88,
              "Islamic Studies": 90,
            },
          },
          generatedAt: new Date().toISOString(),
          size: "3.1 MB",
          pages: 15,
        },
        {
          id: 4,
          title: isArabic
            ? "تقرير التقدم الأكاديمي"
            : "Academic Progress Report",
          description: isArabic
            ? "تتبع تقدم الطلاب الأكاديمي خلال الفصل الدراسي"
            : "Track student academic progress throughout the semester",
          type: "progress",
          category: "academic",
          icon: <FaRocket />,
          color: "#c49a6c",
          gradient: "linear-gradient(135deg, #c49a6c 0%, #dbb88a 100%)",
          chartType: "line",
          data: {
            overallProgress: 78,
            improved: 45,
            stable: 30,
            declined: 10,
            subjectProgress: {
              Mathematics: 72,
              Science: 80,
              English: 82,
              Arabic: 86,
              "Islamic Studies": 90,
            },
            monthlyProgress: [72, 75, 78, 80, 82, 85],
          },
          generatedAt: new Date().toISOString(),
          size: "2.1 MB",
          pages: 10,
        },
        {
          id: 5,
          title: isArabic ? "تقرير الفصول" : "Class Report",
          description: isArabic
            ? "تقرير شامل عن أداء الفصول الدراسية"
            : "Comprehensive report of class performance",
          type: "class",
          category: "staff",
          icon: <FaBuilding />,
          color: "#6c757d",
          gradient: "linear-gradient(135deg, #6c757d 0%, #adb5bd 100%)",
          chartType: "doughnut",
          data: {
            totalClasses: 4,
            averagePerformance: 84,
            topClass: "Primary 6A",
            classDistribution: {
              "Secondary 3A": 28,
              "Primary 5B": 22,
              "Secondary 2A": 25,
              "Primary 6A": 20,
            },
            classPerformance: {
              "Secondary 3A": 88,
              "Primary 5B": 84,
              "Secondary 2A": 82,
              "Primary 6A": 90,
            },
          },
          generatedAt: new Date().toISOString(),
          size: "1.5 MB",
          pages: 6,
        },
        {
          id: 6,
          title: isArabic ? "تقرير المواد الدراسية" : "Subject Report",
          description: isArabic
            ? "تقرير شامل عن أداء المواد الدراسية"
            : "Comprehensive report of subject performance",
          type: "subject",
          category: "academic",
          icon: <FaBook />,
          color: "#8e44ad",
          gradient: "linear-gradient(135deg, #8e44ad 0%, #9b59b6 100%)",
          chartType: "pie",
          data: {
            totalSubjects: 5,
            topSubject: "Islamic Studies",
            subjectPerformance: {
              Mathematics: 82,
              Science: 79,
              English: 85,
              Arabic: 88,
              "Islamic Studies": 92,
            },
            studentDistribution: {
              Mathematics: 45,
              Science: 40,
              English: 42,
              Arabic: 44,
              "Islamic Studies": 46,
            },
          },
          generatedAt: new Date().toISOString(),
          size: "1.2 MB",
          pages: 4,
        },
      ];
      setGeneratedReports(reports);
      setGenerating(false);
      setLoading(false);
      notify(
        isArabic ? "تم إنشاء التقارير بنجاح" : "Reports generated successfully",
        "success",
      );
    }, 1500);
  };

  // ===== Load reports on mount =====
  useEffect(() => {
    generateReports();
  }, [isArabic]);

  // ===== Filter reports =====
  const filteredReports = generatedReports.filter((report) => {
    const matchesSearch =
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || report.category === filterCategory;
    const matchesType = reportType === "all" || report.type === reportType;
    return matchesSearch && matchesCategory && matchesType;
  });

  // ===== Pagination =====
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const displayedReports = filteredReports.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // ===== Stats =====
  const stats = {
    total: generatedReports.length,
    academic: generatedReports.filter((r) => r.category === "academic").length,
    staff: generatedReports.filter((r) => r.category === "staff").length,
    admin: generatedReports.filter((r) => r.category === "admin").length,
  };

  // ===== Report categories =====
  const categories = [
    { value: "all", label: isArabic ? "الكل" : "All" },
    { value: "academic", label: isArabic ? "أكاديمي" : "Academic" },
    { value: "staff", label: isArabic ? "الموظفين" : "Staff" },
    { value: "admin", label: isArabic ? "إداري" : "Administrative" },
  ];

  const reportTypes = [
    { value: "all", label: isArabic ? "جميع الأنواع" : "All Types" },
    { value: "performance", label: isArabic ? "الأداء" : "Performance" },
    { value: "attendance", label: isArabic ? "الحضور" : "Attendance" },
    { value: "assessment", label: isArabic ? "التقييمات" : "Assessments" },
    { value: "progress", label: isArabic ? "التقدم" : "Progress" },
    { value: "class", label: isArabic ? "الفصول" : "Classes" },
    { value: "subject", label: isArabic ? "المواد" : "Subjects" },
  ];

  // ===== Stats cards with gradients =====
  const statsCards = [
    {
      label: isArabic ? "الإجمالي" : "Total",
      value: stats.total,
      icon: <FaFileAlt />,
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      shadow: "0 8px 30px rgba(102, 126, 234, 0.4)",
    },
    {
      label: isArabic ? "أكاديمي" : "Academic",
      value: stats.academic,
      icon: <FaBook />,
      gradient: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
      shadow: "0 8px 30px rgba(17, 153, 142, 0.4)",
    },
    {
      label: isArabic ? "الموظفين" : "Staff",
      value: stats.staff,
      icon: <FaUsers />,
      gradient: "linear-gradient(135deg, #f2994a 0%, #f2c94c 100%)",
      shadow: "0 8px 30px rgba(242, 153, 74, 0.4)",
    },
    {
      label: isArabic ? "إداري" : "Administrative",
      value: stats.admin,
      icon: <FaClipboardCheck />,
      gradient: "linear-gradient(135deg, #eb3349 0%, #f45c43 100%)",
      shadow: "0 8px 30px rgba(235, 51, 73, 0.4)",
    },
  ];

  // ===== Chart data for preview =====
  const getChartData = (report) => {
    if (!report || !report.data) return null;

    const textColor = darkMode ? "#e9ecef" : "#2d3436";
    const gridColor = darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";

    if (report.type === "performance") {
      const subjectLabels = Object.keys(report.data.subjects || {});
      const subjectValues = Object.values(report.data.subjects || {});
      const colors = ["#3498db", "#2ecc71", "#f39c12", "#e74c3c", "#9b59b6"];
      return {
        labels: subjectLabels,
        datasets: [
          {
            label: isArabic ? "نسبة الأداء %" : "Performance %",
            data: subjectValues,
            backgroundColor: colors
              .slice(0, subjectValues.length)
              .map((c) => c + "80"),
            borderColor: colors.slice(0, subjectValues.length),
            borderWidth: 2,
            borderRadius: 8,
          },
        ],
      };
    }

    if (report.type === "attendance") {
      return {
        labels: isArabic
          ? ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو"]
          : ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [
          {
            label: isArabic ? "نسبة الحضور %" : "Attendance Rate %",
            data: report.data.monthlyTrend || [0, 0, 0, 0, 0, 0],
            borderColor: "#f39c12",
            backgroundColor: "rgba(243, 156, 18, 0.1)",
            fill: true,
            tension: 0.4,
            pointBackgroundColor: "#f39c12",
            pointBorderColor: darkMode ? "#2d3436" : "#ffffff",
            pointBorderWidth: 2,
            pointRadius: 6,
          },
        ],
      };
    }

    if (report.type === "assessment") {
      const assessmentLabels = Object.keys(report.data.assessmentTypes || {});
      const assessmentValues = Object.values(report.data.assessmentTypes || {});
      const colors = ["#3498db", "#2ecc71", "#f39c12", "#e74c3c"];
      return {
        labels: assessmentLabels,
        datasets: [
          {
            label: isArabic ? "عدد التقييمات" : "Number of Assessments",
            data: assessmentValues,
            backgroundColor: colors.slice(0, assessmentValues.length),
            borderColor: darkMode ? "#2d3436" : "#ffffff",
            borderWidth: 2,
          },
        ],
      };
    }

    if (report.type === "progress") {
      const subjectLabels = Object.keys(report.data.subjectProgress || {});
      const subjectValues = Object.values(report.data.subjectProgress || {});
      const colors = ["#3498db", "#2ecc71", "#f39c12", "#e74c3c", "#9b59b6"];
      return {
        labels: subjectLabels,
        datasets: [
          {
            label: isArabic ? "نسبة التقدم %" : "Progress %",
            data: subjectValues,
            backgroundColor: colors
              .slice(0, subjectValues.length)
              .map((c) => c + "80"),
            borderColor: colors.slice(0, subjectValues.length),
            borderWidth: 2,
            borderRadius: 8,
          },
        ],
      };
    }

    if (report.type === "class") {
      const classLabels = Object.keys(report.data.classPerformance || {});
      const classValues = Object.values(report.data.classPerformance || {});
      const colors = ["#3498db", "#2ecc71", "#f39c12", "#e74c3c"];
      return {
        labels: classLabels,
        datasets: [
          {
            label: isArabic ? "نسبة الأداء %" : "Performance %",
            data: classValues,
            backgroundColor: colors.slice(0, classValues.length),
            borderColor: darkMode ? "#2d3436" : "#ffffff",
            borderWidth: 2,
          },
        ],
      };
    }

    if (report.type === "subject") {
      const subjectLabels = Object.keys(report.data.subjectPerformance || {});
      const subjectValues = Object.values(report.data.subjectPerformance || {});
      const colors = ["#3498db", "#2ecc71", "#f39c12", "#e74c3c", "#9b59b6"];
      return {
        labels: subjectLabels,
        datasets: [
          {
            label: isArabic ? "نسبة الأداء %" : "Performance %",
            data: subjectValues,
            backgroundColor: colors.slice(0, subjectValues.length),
            borderColor: darkMode ? "#2d3436" : "#ffffff",
            borderWidth: 2,
          },
        ],
      };
    }

    return null;
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: darkMode ? "#e9ecef" : "#2d3436",
          padding: 20,
          usePointStyle: true,
          pointStyle: "circle",
          font: {
            size: 12,
            weight: "600",
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
        },
        ticks: {
          color: darkMode ? "#adb5bd" : "#6c757d",
        },
      },
      x: {
        grid: {
          color: darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
        },
        ticks: {
          color: darkMode ? "#adb5bd" : "#6c757d",
        },
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: darkMode ? "#e9ecef" : "#2d3436",
          padding: 20,
          usePointStyle: true,
          pointStyle: "circle",
          font: {
            size: 12,
            weight: "600",
          },
        },
      },
    },
  };

  // ===== Get chart component based on type =====
  const getChartComponent = (report) => {
    const chartData = getChartData(report);
    if (!chartData) return null;

    switch (report.chartType) {
      case "pie":
        return <Pie data={chartData} options={pieOptions} />;
      case "doughnut":
        return <Doughnut data={chartData} options={pieOptions} />;
      case "line":
        return <Line data={chartData} options={chartOptions} />;
      case "bar":
      default:
        return <Bar data={chartData} options={chartOptions} />;
    }
  };

  // ===== CRUD Functions =====

  const handleEditClick = (report) => {
    setSelectedReport(report);
    setEditingReport(report);
    setFormData({
      title: report.title,
      description: report.description,
      type: report.type,
      category: report.category,
      date:
        report.generatedAt?.split("T")[0] ||
        new Date().toISOString().split("T")[0],
    });
    setShowEditModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = () => {
    if (!editingReport) return;

    const updatedReports = generatedReports.map((r) => {
      if (r.id === editingReport.id) {
        return {
          ...r,
          title: formData.title,
          description: formData.description,
          type: formData.type,
          category: formData.category,
          updatedAt: new Date().toISOString(),
        };
      }
      return r;
    });

    setGeneratedReports(updatedReports);
    setShowEditModal(false);
    setEditingReport(null);
    setSelectedReport(null);

    notify(
      isArabic ? "تم تحديث التقرير بنجاح" : "Report updated successfully",
      "success",
    );
  };

  const handleDelete = (id) => {
    const updatedReports = generatedReports.filter((r) => r.id !== id);
    setGeneratedReports(updatedReports);
    setShowDeleteConfirm(null);

    notify(
      isArabic ? "تم حذف التقرير بنجاح" : "Report deleted successfully",
      "success",
    );
  };

  const handleDownload = (report) => {
    notify(
      isArabic
        ? `جاري تحميل ${report.title}...`
        : `Downloading ${report.title}...`,
      "info",
    );
    setTimeout(() => {
      notify(
        isArabic
          ? `تم تحميل ${report.title} بنجاح`
          : `${report.title} downloaded successfully`,
        "success",
      );
    }, 1500);
  };

  const handlePreview = (report) => {
    setSelectedReport(report);
    setShowPreviewModal(true);
  };

  const handleGenerateNew = () => {
    generateReports();
  };

  const handleShare = (report) => {
    navigator.clipboard?.writeText(window.location.href);
    notify(isArabic ? "تم نسخ رابط التقرير" : "Report link copied", "info");
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2 text-muted" style={arabicFontStyle}>
          {isArabic ? "جاري التحميل..." : "Loading..."}
        </p>
      </div>
    );
  }

  return (
    <div className="teacher-reports" dir={isArabic ? "rtl" : "ltr"}>
      {/* ===== HEADER ===== */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <h4
            className="fw-bold mb-1"
            style={{ ...arabicFontStyle, color: "#1a5f7a" }}
          >
            <FaChartBar className="me-2" />
            {isArabic ? "التقارير" : "Reports"}
          </h4>
          <p className="text-muted mb-0" style={arabicFontStyle}>
            {isArabic
              ? "إنشاء وعرض وإدارة جميع التقارير"
              : "Create, view and manage all reports"}
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => window.location.reload()}
          >
            <FaSync className="me-1" /> {isArabic ? "تحديث" : "Refresh"}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleGenerateNew}
            disabled={generating}
          >
            {generating ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-1"
                  role="status"
                  aria-hidden="true"
                ></span>{" "}
                {isArabic ? "جاري الإنشاء..." : "Generating..."}
              </>
            ) : (
              <>
                <FaPlus className="me-1" />{" "}
                {isArabic ? "إنشاء تقرير" : "Generate Report"}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ===== STATS CARDS WITH GRADIENTS ===== */}
      <Row className="g-3 g-md-4 mb-4">
        {statsCards.map((stat, index) => (
          <Col key={index} xs={6} md={3}>
            <div
              className="stat-card-gradient"
              style={{
                background: stat.gradient,
                boxShadow: stat.shadow,
                minHeight: "130px",
              }}
            >
              <div className="stat-card-gradient-bg1"></div>
              <div className="stat-card-gradient-bg2"></div>
              <div className="stat-card-gradient-bg3"></div>
              <div className="stat-card-gradient-content">
                <div>
                  <div className="stat-label-gradient" style={arabicFontStyle}>
                    {stat.label}
                  </div>
                  <div className="stat-number-gradient">
                    {formatNumber(stat.value)}
                  </div>
                </div>
                <div className="stat-icon-gradient">{stat.icon}</div>
              </div>
              <div className="stat-progress-gradient">
                <div
                  style={{
                    width: `${(stat.value / (stats.total || 1)) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* ===== SEARCH & FILTER ===== */}
      <Card
        className="shadow-sm border-0 mb-4 modern-card"
        style={{ background: darkMode ? "#1a1a2e" : "white" }}
      >
        <Card.Body className="p-2 p-md-3">
          <Row className="g-2 align-items-end">
            <Col xs={12} sm={12} md={4}>
              <InputGroup size="sm">
                <InputGroup.Text
                  style={{
                    background: darkMode ? "#2d3436" : "white",
                    color: darkMode ? "#e9ecef" : "#212529",
                  }}
                >
                  <FaSearch size={12} />
                </InputGroup.Text>
                <Form.Control
                  placeholder={
                    isArabic ? "بحث عن تقرير..." : "Search reports..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    fontSize: "0.8rem",
                    background: darkMode ? "#2d3436" : "white",
                    color: darkMode ? "#e9ecef" : "#212529",
                    ...arabicFontStyle,
                  }}
                />
              </InputGroup>
            </Col>
            <Col xs={6} sm={4} md={2}>
              <Form.Select
                size="sm"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{
                  fontSize: "0.75rem",
                  background: darkMode ? "#2d3436" : "white",
                  color: darkMode ? "#e9ecef" : "#212529",
                  ...arabicFontStyle,
                }}
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={6} sm={4} md={2}>
              <Form.Select
                size="sm"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                style={{
                  fontSize: "0.75rem",
                  background: darkMode ? "#2d3436" : "white",
                  color: darkMode ? "#e9ecef" : "#212529",
                  ...arabicFontStyle,
                }}
              >
                {reportTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={6} sm={12} md={2}>
              <div
                className="text-muted small text-center"
                style={{
                  color: darkMode ? "#adb5bd" : "#6c757d",
                  ...arabicFontStyle,
                }}
              >
                {isArabic ? "نتائج:" : "Results:"}{" "}
                {formatNumber(filteredReports.length)}
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* ===== REPORTS GRID ===== */}
      {displayedReports.length === 0 ? (
        <div className="text-center py-5">
          <div className="display-1 text-muted opacity-25 mb-3">📊</div>
          <h4
            style={{
              ...arabicFontStyle,
              color: darkMode ? "#e9ecef" : "#1a1a2e",
            }}
          >
            {isArabic ? "لا توجد تقارير" : "No reports found"}
          </h4>
          <p className="text-muted" style={arabicFontStyle}>
            {isArabic
              ? "حاول تعديل بحثك أو إنشاء تقارير جديدة"
              : "Try adjusting your search or generate new reports"}
          </p>
          <Button variant="primary" onClick={handleGenerateNew}>
            <FaPlus className="me-2" />{" "}
            {isArabic ? "إنشاء تقارير" : "Generate Reports"}
          </Button>
        </div>
      ) : (
        <Row className="g-4">
          {displayedReports.map((report) => (
            <Col key={report.id} lg={6} xl={6}>
              <div
                className="report-card"
                onMouseEnter={() => setHoveredCard(report.id)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  transform:
                    hoveredCard === report.id
                      ? "translateY(-8px) scale(1.01)"
                      : "translateY(0) scale(1)",
                  transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow:
                    hoveredCard === report.id
                      ? "0 20px 60px rgba(0,0,0,0.12)"
                      : "0 4px 20px rgba(0,0,0,0.06)",
                  border: "none",
                  borderRadius: "20px",
                  overflow: "hidden",
                  background: darkMode ? "#1a1a2e" : "white",
                  height: "100%",
                }}
              >
                {/* Top Gradient Bar */}
                <div
                  className="report-card-top-bar"
                  style={{
                    height: "5px",
                    background: report.gradient,
                    transition: "height 0.4s ease",
                  }}
                ></div>

                <div className="p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div
                      className="report-icon-wrapper"
                      style={{
                        width: "50px",
                        height: "50px",
                        borderRadius: "14px",
                        background: `${report.color}15`,
                        color: report.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.5rem",
                        transition: "all 0.4s ease",
                        transform:
                          hoveredCard === report.id
                            ? "scale(1.1) rotate(-5deg)"
                            : "scale(1) rotate(0)",
                      }}
                    >
                      {report.icon}
                    </div>
                    <Badge
                      style={{
                        background: report.gradient,
                        color: "white",
                        padding: "4px 12px",
                        borderRadius: "50px",
                        fontSize: "0.6rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {report.category}
                    </Badge>
                  </div>

                  <h5
                    className="fw-bold mb-1"
                    style={{
                      ...arabicFontStyle,
                      color: darkMode ? "#e9ecef" : "#1a1a2e",
                    }}
                  >
                    {report.title}
                  </h5>
                  <p
                    className="mb-3"
                    style={{
                      ...arabicFontStyle,
                      fontSize: "0.85rem",
                      color: darkMode ? "#adb5bd" : "#6c757d",
                    }}
                  >
                    {report.description}
                  </p>

                  <div className="d-flex gap-3 mb-3 flex-wrap">
                    <div
                      className="d-flex align-items-center gap-1"
                      style={{ color: darkMode ? "#adb5bd" : "#6c757d" }}
                    >
                      <FaClockIcon size={12} />
                      <small style={arabicFontStyle}>
                        {new Date(report.generatedAt).toLocaleDateString()}
                      </small>
                    </div>
                    <div
                      className="d-flex align-items-center gap-1"
                      style={{ color: darkMode ? "#adb5bd" : "#6c757d" }}
                    >
                      <FaFileAlt size={12} />
                      <small style={arabicFontStyle}>{report.size}</small>
                    </div>
                    <div
                      className="d-flex align-items-center gap-1"
                      style={{ color: darkMode ? "#adb5bd" : "#6c757d" }}
                    >
                      <FaBook size={12} />
                      <small style={arabicFontStyle}>
                        {report.pages} {isArabic ? "صفحات" : "pages"}
                      </small>
                    </div>
                  </div>

                  {/* Quick Stats Preview */}
                  {report.data && (
                    <div className="report-stats-mini d-flex gap-2 flex-wrap mb-2">
                      {report.type === "performance" && (
                        <>
                          <span
                            className="badge"
                            style={{
                              background: darkMode ? "#2d3436" : "#f8f9fa",
                              color: darkMode ? "#e9ecef" : "#2d3436",
                              ...arabicFontStyle,
                            }}
                          >
                            {isArabic ? "المعدل:" : "Avg:"}{" "}
                            {formatNumber(report.data.average)}%
                          </span>
                          <span
                            className="badge"
                            style={{
                              background: darkMode ? "#2d3436" : "#f8f9fa",
                              color: darkMode ? "#e9ecef" : "#2d3436",
                              ...arabicFontStyle,
                            }}
                          >
                            {isArabic ? "ممتاز:" : "Excellent:"}{" "}
                            {formatNumber(report.data.excellent)}
                          </span>
                          <span
                            className="badge"
                            style={{
                              background: darkMode ? "#2d3436" : "#f8f9fa",
                              color: darkMode ? "#e9ecef" : "#2d3436",
                              ...arabicFontStyle,
                            }}
                          >
                            {isArabic ? "بحاجة للتحسين:" : "Needs Improvement:"}{" "}
                            {formatNumber(report.data.needsImprovement)}
                          </span>
                        </>
                      )}
                      {report.type === "attendance" && (
                        <>
                          <span
                            className="badge"
                            style={{
                              background: darkMode ? "#2d3436" : "#f8f9fa",
                              color: darkMode ? "#e9ecef" : "#2d3436",
                              ...arabicFontStyle,
                            }}
                          >
                            {isArabic ? "نسبة الحضور:" : "Attendance:"}{" "}
                            {formatNumber(report.data.overall)}%
                          </span>
                          <span
                            className="badge"
                            style={{
                              background: darkMode ? "#2d3436" : "#f8f9fa",
                              color: darkMode ? "#e9ecef" : "#2d3436",
                              ...arabicFontStyle,
                            }}
                          >
                            {isArabic ? "حاضر:" : "Present:"}{" "}
                            {formatNumber(report.data.present)}
                          </span>
                          <span
                            className="badge"
                            style={{
                              background: darkMode ? "#2d3436" : "#f8f9fa",
                              color: darkMode ? "#e9ecef" : "#2d3436",
                              ...arabicFontStyle,
                            }}
                          >
                            {isArabic ? "غائب:" : "Absent:"}{" "}
                            {formatNumber(report.data.absent)}
                          </span>
                        </>
                      )}
                    </div>
                  )}

                  <div className="d-flex gap-2 mt-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="flex-grow-1"
                      onClick={() => handlePreview(report)}
                      style={{
                        borderRadius: "50px",
                        fontSize: "0.7rem",
                        ...arabicFontStyle,
                      }}
                    >
                      <FaEye className="me-1" />{" "}
                      {isArabic ? "معاينة" : "Preview"}
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-grow-1"
                      onClick={() => handleDownload(report)}
                      style={{
                        borderRadius: "50px",
                        fontSize: "0.7rem",
                        ...arabicFontStyle,
                      }}
                    >
                      <FaDownload className="me-1" />{" "}
                      {isArabic ? "تحميل" : "Download"}
                    </Button>
                    <Button
                      variant="outline-warning"
                      size="sm"
                      onClick={() => handleEditClick(report)}
                      style={{
                        borderRadius: "50px",
                        fontSize: "0.7rem",
                        padding: "4px 12px",
                      }}
                    >
                      <FaEdit size={12} />
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(report.id)}
                      style={{
                        borderRadius: "50px",
                        fontSize: "0.7rem",
                        padding: "4px 12px",
                      }}
                    >
                      <FaTrash size={12} />
                    </Button>
                  </div>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      )}

      {/* ===== PAGINATION ===== */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <Pagination size="sm" className="responsive-pagination">
            <Pagination.Prev
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            />
            {[...Array(Math.min(totalPages, 5))].map((_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <Pagination.Item
                  key={pageNum}
                  active={currentPage === pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {formatNumber(pageNum)}
                </Pagination.Item>
              );
            })}
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <Pagination.Ellipsis />
            )}
            <Pagination.Next
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            />
          </Pagination>
        </div>
      )}

      {/* ===== PREVIEW MODAL ===== */}
      <Modal
        show={showPreviewModal}
        onHide={() => setShowPreviewModal(false)}
        centered
        size="lg"
        className="preview-modal"
      >
        <Modal.Header
          closeButton
          className="border-0"
          style={{ background: darkMode ? "#1a1a2e" : "white" }}
        >
          <Modal.Title
            style={{
              ...arabicFontStyle,
              color: darkMode ? "#e9ecef" : "#1a1a2e",
            }}
          >
            <FaEye className="me-2 text-primary" />
            {selectedReport?.title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? "#0d1117" : "white" }}>
          {selectedReport && (
            <>
              <div className="d-flex flex-wrap gap-3 mb-4">
                <Badge
                  style={{
                    background: selectedReport.gradient,
                    color: "white",
                    padding: "6px 14px",
                    borderRadius: "50px",
                  }}
                >
                  {selectedReport.category}
                </Badge>
                <span
                  className="text-muted"
                  style={{
                    color: darkMode ? "#adb5bd" : "#6c757d",
                    ...arabicFontStyle,
                  }}
                >
                  <FaClockIcon className="me-1" />{" "}
                  {new Date(selectedReport.generatedAt).toLocaleString()}
                </span>
                <span
                  className="text-muted"
                  style={{
                    color: darkMode ? "#adb5bd" : "#6c757d",
                    ...arabicFontStyle,
                  }}
                >
                  <FaFileAlt className="me-1" /> {selectedReport.size}
                </span>
                <span
                  className="text-muted"
                  style={{
                    color: darkMode ? "#adb5bd" : "#6c757d",
                    ...arabicFontStyle,
                  }}
                >
                  <FaBook className="me-1" /> {selectedReport.pages}{" "}
                  {isArabic ? "صفحات" : "pages"}
                </span>
              </div>

              <p
                className="text-muted"
                style={{
                  ...arabicFontStyle,
                  color: darkMode ? "#adb5bd" : "#6c757d",
                }}
              >
                {selectedReport.description}
              </p>

              {selectedReport.data && (
                <div
                  className="chart-preview mt-4"
                  style={{
                    height: "300px",
                    background: darkMode ? "#1a1a2e" : "#f8f9fa",
                  }}
                >
                  {getChartComponent(selectedReport)}
                </div>
              )}

              {selectedReport.data && (
                <div className="report-data-summary mt-4">
                  <h6
                    className="fw-bold mb-3"
                    style={{
                      ...arabicFontStyle,
                      color: darkMode ? "#e9ecef" : "#1a1a2e",
                    }}
                  >
                    {isArabic ? "ملخص البيانات" : "Data Summary"}
                  </h6>
                  <Row className="g-2">
                    {Object.entries(selectedReport.data).map(([key, value]) => {
                      if (typeof value === "number") {
                        return (
                          <Col key={key} xs={6} md={4}>
                            <div
                              className="p-2 rounded-3 text-center"
                              style={{
                                background: darkMode ? "#2d3436" : "#f8f9fa",
                              }}
                            >
                              <div
                                className="small"
                                style={{
                                  ...arabicFontStyle,
                                  color: darkMode ? "#adb5bd" : "#6c757d",
                                }}
                              >
                                {key.charAt(0).toUpperCase() +
                                  key.slice(1).replace(/([A-Z])/g, " $1")}
                              </div>
                              <div
                                className="fw-bold"
                                style={{
                                  ...arabicFontStyle,
                                  color: darkMode ? "#e9ecef" : "#1a1a2e",
                                }}
                              >
                                {formatNumber(value)}
                              </div>
                            </div>
                          </Col>
                        );
                      }
                      return null;
                    })}
                  </Row>
                </div>
              )}

              <div
                className="d-flex gap-2 mt-4 pt-3 border-top"
                style={{
                  borderColor: darkMode ? "rgba(255,255,255,0.1)" : "#dee2e6",
                }}
              >
                <Button
                  variant="primary"
                  className="flex-grow-1"
                  onClick={() => handleDownload(selectedReport)}
                  style={arabicFontStyle}
                >
                  <FaDownload className="me-2" />{" "}
                  {isArabic ? "تحميل التقرير" : "Download Report"}
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={() => handleShare(selectedReport)}
                >
                  <FaShare />
                </Button>
                <Button variant="outline-secondary" onClick={handlePrint}>
                  <FaPrint />
                </Button>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer
          className="border-0"
          style={{ background: darkMode ? "#1a1a2e" : "white" }}
        >
          <Button
            variant="secondary"
            onClick={() => setShowPreviewModal(false)}
            style={arabicFontStyle}
          >
            {isArabic ? "إغلاق" : "Close"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===== EDIT REPORT MODAL ===== */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        centered
        size="lg"
      >
        <Modal.Header
          closeButton
          className="border-0"
          style={{ background: darkMode ? "#1a1a2e" : "white" }}
        >
          <Modal.Title
            style={{
              ...arabicFontStyle,
              color: darkMode ? "#e9ecef" : "#1a1a2e",
            }}
          >
            <FaEdit className="me-2 text-warning" />
            {isArabic ? "تعديل التقرير" : "Edit Report"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? "#0d1117" : "white" }}>
          {editingReport && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label style={arabicFontStyle}>
                  {isArabic ? "العنوان" : "Title"} *
                </Form.Label>
                <Form.Control
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  placeholder={
                    isArabic ? "أدخل عنوان التقرير" : "Enter report title"
                  }
                  style={{
                    background: darkMode ? "#2d3436" : "white",
                    color: darkMode ? "#e9ecef" : "#212529",
                    ...arabicFontStyle,
                  }}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label style={arabicFontStyle}>
                  {isArabic ? "الوصف" : "Description"} *
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder={
                    isArabic ? "أدخل وصف التقرير" : "Enter report description"
                  }
                  style={{
                    background: darkMode ? "#2d3436" : "white",
                    color: darkMode ? "#e9ecef" : "#212529",
                    ...arabicFontStyle,
                  }}
                />
              </Form.Group>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label style={arabicFontStyle}>
                      {isArabic ? "النوع" : "Type"} *
                    </Form.Label>
                    <Form.Select
                      name="type"
                      value={formData.type}
                      onChange={handleFormChange}
                      style={{
                        background: darkMode ? "#2d3436" : "white",
                        color: darkMode ? "#e9ecef" : "#212529",
                        ...arabicFontStyle,
                      }}
                    >
                      <option value="performance">
                        {isArabic ? "الأداء" : "Performance"}
                      </option>
                      <option value="attendance">
                        {isArabic ? "الحضور" : "Attendance"}
                      </option>
                      <option value="assessment">
                        {isArabic ? "التقييمات" : "Assessments"}
                      </option>
                      <option value="progress">
                        {isArabic ? "التقدم" : "Progress"}
                      </option>
                      <option value="class">
                        {isArabic ? "الفصول" : "Classes"}
                      </option>
                      <option value="subject">
                        {isArabic ? "المواد" : "Subjects"}
                      </option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label style={arabicFontStyle}>
                      {isArabic ? "الفئة" : "Category"} *
                    </Form.Label>
                    <Form.Select
                      name="category"
                      value={formData.category}
                      onChange={handleFormChange}
                      style={{
                        background: darkMode ? "#2d3436" : "white",
                        color: darkMode ? "#e9ecef" : "#212529",
                        ...arabicFontStyle,
                      }}
                    >
                      <option value="academic">
                        {isArabic ? "أكاديمي" : "Academic"}
                      </option>
                      <option value="staff">
                        {isArabic ? "الموظفين" : "Staff"}
                      </option>
                      <option value="admin">
                        {isArabic ? "إداري" : "Administrative"}
                      </option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3">
                <Form.Label style={arabicFontStyle}>
                  {isArabic ? "التاريخ" : "Date"}
                </Form.Label>
                <Form.Control
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleFormChange}
                  style={{
                    background: darkMode ? "#2d3436" : "white",
                    color: darkMode ? "#e9ecef" : "#212529",
                  }}
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button
            variant="secondary"
            onClick={() => setShowEditModal(false)}
            style={arabicFontStyle}
          >
            {isArabic ? "إلغاء" : "Cancel"}
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveEdit}
            style={arabicFontStyle}
          >
            <FaSave className="me-2" />{" "}
            {isArabic ? "حفظ التغييرات" : "Save Changes"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===== DELETE CONFIRMATION ===== */}
      <Modal
        show={showDeleteConfirm !== null}
        onHide={() => setShowDeleteConfirm(null)}
        centered
        className="confirmation-modal"
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title
            className="d-flex align-items-center gap-2"
            style={{ color: "#dc3545" }}
          >
            <FaExclamationTriangle />{" "}
            {isArabic ? "تأكيد الحذف" : "Confirm Delete"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-3">
          <p
            style={{
              fontSize: "0.95rem",
              color: "#4a4a6a",
              ...arabicFontStyle,
            }}
          >
            {isArabic
              ? "هل أنت متأكد من حذف هذا التقرير؟"
              : "Are you sure you want to delete this report?"}
          </p>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button
            variant="secondary"
            onClick={() => setShowDeleteConfirm(null)}
            style={{ borderRadius: "50px", padding: "8px 24px" }}
          >
            {isArabic ? "إلغاء" : "Cancel"}
          </Button>
          <Button
            variant="danger"
            onClick={() => handleDelete(showDeleteConfirm)}
            style={{ borderRadius: "50px", padding: "8px 24px" }}
          >
            {isArabic ? "حذف" : "Delete"}
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        @keyframes floatBubble {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-10px, -15px) scale(1.1); }
        }

        .teacher-reports { padding: 0; }

        .stat-card-gradient {
          border-radius: 16px;
          padding: 20px 24px;
          color: white;
          position: relative;
          overflow: hidden;
          height: 100%;
          min-height: 130px;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: default;
        }
        .stat-card-gradient:hover {
          transform: translateY(-6px) scale(1.02);
          box-shadow: 0 16px 50px rgba(0,0,0,0.25) !important;
        }

        .stat-card-gradient-bg1 {
          position: absolute;
          top: -40px;
          right: -40px;
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
          animation: floatBubble 8s ease-in-out infinite;
        }
        .stat-card-gradient-bg2 {
          position: absolute;
          bottom: -30px;
          left: -30px;
          width: 70px;
          height: 70px;
          border-radius: 50%;
          background: rgba(255,255,255,0.06);
          animation: floatBubble 6s ease-in-out infinite reverse;
        }
        .stat-card-gradient-bg3 {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 150px;
          height: 150px;
          border-radius: 50%;
          background: rgba(255,255,255,0.03);
          animation: floatBubble 10s ease-in-out infinite;
        }

        .stat-card-gradient-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
          z-index: 1;
        }

        .stat-label-gradient {
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          opacity: 0.9;
          font-weight: 600;
        }
        .stat-number-gradient {
          font-size: 2rem;
          font-weight: 700;
          line-height: 1.2;
          margin-top: 2px;
        }
        .stat-icon-gradient {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.3rem;
          backdrop-filter: blur(5px);
          transition: all 0.4s ease;
        }
        .stat-card-gradient:hover .stat-icon-gradient {
          transform: rotate(10deg) scale(1.1);
          background: rgba(255,255,255,0.3);
        }

        .stat-progress-gradient {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: rgba(255,255,255,0.2);
          border-radius: 0 0 16px 16px;
          overflow: hidden;
          z-index: 1;
        }
        .stat-progress-gradient div {
          height: 100%;
          background: rgba(255,255,255,0.6);
          border-radius: 0 0 16px 16px;
          transition: width 1.5s ease;
        }

        .modern-card {
          border-radius: 16px !important;
          transition: all 0.3s ease;
          overflow: hidden;
        }

        .report-card {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          border: none !important;
          border-radius: 20px !important;
          height: 100%;
        }

        .report-card-top-bar {
          transition: height 0.4s ease;
        }
        .report-card:hover .report-card-top-bar {
          height: 6px;
        }

        .report-icon-wrapper {
          transition: all 0.4s ease;
        }

        .report-stats-mini .badge {
          font-size: 0.6rem;
          padding: 4px 10px;
          border-radius: 50px;
        }

        .preview-modal .modal-content {
          border-radius: 20px;
          border: none;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
          overflow: hidden;
        }

        .chart-preview {
          border-radius: 12px;
          padding: 16px;
        }

        .responsive-pagination .page-link {
          padding: 4px 10px;
          font-size: 0.75rem;
        }

        .confirmation-modal .modal-content {
          border-radius: 20px;
          border: none;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
        }

        .dashboard-wrapper.dark-theme .modern-card {
          background: #1a1a2e !important;
          border-color: #2d3436 !important;
        }
        .dashboard-wrapper.dark-theme .report-card {
          background: #1a1a2e !important;
        }
        .dashboard-wrapper.dark-theme .form-control,
        .dashboard-wrapper.dark-theme .form-select {
          background: #2d3436 !important;
          color: #e9ecef !important;
          border-color: #3d3d3d !important;
        }
        .dashboard-wrapper.dark-theme .form-control:focus,
        .dashboard-wrapper.dark-theme .form-select:focus {
          border-color: #4a9eff !important;
          box-shadow: 0 0 0 0.2rem rgba(74, 158, 255, 0.15) !important;
        }

        @media (max-width: 768px) {
          .stat-card-gradient { padding: 16px 18px; min-height: 100px; }
          .stat-number-gradient { font-size: 1.5rem; }
          .stat-icon-gradient { width: 40px; height: 40px; font-size: 1rem; }
          .stat-card-gradient-bg1 { width: 70px; height: 70px; }
          .stat-card-gradient-bg2 { width: 50px; height: 50px; }
          .report-card .p-4 { padding: 16px !important; }
          .report-card h5 { font-size: 1rem !important; }
          .report-card .d-flex.gap-3 { gap: 8px !important; flex-wrap: wrap; }
          .chart-preview { height: 200px !important; }
        }

        @media (max-width: 576px) {
          .stat-card-gradient { padding: 12px 14px; min-height: 85px; }
          .stat-number-gradient { font-size: 1.2rem; }
          .stat-label-gradient { font-size: 0.5rem; }
          .stat-icon-gradient { width: 32px; height: 32px; font-size: 0.8rem; }
          .stat-card-gradient-bg1 { width: 50px; height: 50px; top: -20px; right: -20px; }
          .stat-card-gradient-bg2 { width: 35px; height: 35px; bottom: -15px; left: -15px; }
          
          .report-card .p-4 { padding: 12px !important; }
          .report-card h5 { font-size: 0.9rem !important; }
          .report-card .report-icon-wrapper { width: 40px; height: 40px; font-size: 1.2rem; }
          .report-card .d-flex.gap-2 { flex-direction: column; }
          .report-card .btn { font-size: 0.65rem !important; padding: 4px 12px !important; }
          .chart-preview { height: 150px !important; padding: 8px; }
          .preview-modal .modal-body { padding: 16px !important; }
          .report-data-summary .row .col-6 { padding: 4px !important; }
          .report-data-summary .p-2 { padding: 8px !important; }
          .report-data-summary .fw-bold { font-size: 0.9rem !important; }
        }
      `}</style>
    </div>
  );
};

export default Reports;
