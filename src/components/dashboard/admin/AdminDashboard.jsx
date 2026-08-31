// src/components/dashboard/admin/AdminDashboard.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Button,
  Table,
  Nav,
  Modal,
  Form,
  Alert,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import {
  FaUsers,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaBuilding,
  FaBell,
  FaChartLine,
  FaTrophy,
  FaUserPlus,
  FaClock,
  FaRocket,
  FaCalendarCheck,
  FaBullhorn,
  FaCog,
  FaFilePdf,
  FaFileAlt,
  FaSync,
  FaHeart,
  FaAward,
  FaArrowRight,
  FaGraduationCap,
  FaBook,
  FaChild,
  FaSchool,
  FaChartBar,
  FaUserTie,
  FaBriefcase,
  FaCalendarWeek,
  FaShieldAlt,
  FaStar,
  FaFire,
  FaGift,
  FaComments,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaEye,
  FaEdit,
  FaTrash,
  FaPlus,
  FaSearch,
  FaFilter,
  FaDownload,
  FaPrint,
  FaInfoCircle,
  FaChevronRight,
  FaChevronDown,
  FaChevronUp,
  FaThumbsUp,
  FaShare,
  FaBookmark,
  FaRegBookmark,
  FaRegCalendarAlt,
  FaClock as FaClockIcon,
  FaHourglassHalf,
  FaTachometerAlt,
  FaSlidersH,
  FaPalette,
  FaMagic,
  FaMoon,
  FaSun,
  FaCloud,
  FaRainbow,
  FaChartPie,
  FaExclamationTriangle,
  FaSpinner,
  FaMoneyBillWave,
  FaReceipt,
  FaWallet,
  FaCreditCard,
} from "react-icons/fa";
import { useLanguage } from "../../../context/LanguageContext";
import { getTranslation } from "../../../utils/translations";
import { useAuth } from "../../../hooks/useAuth";
import { useNotification } from "../../../hooks/useNotification";
import api from "../../../services/api";
import { format, formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
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
  RadialLinearScale,
} from "chart.js";
import { Bar, Pie, Doughnut, Line, Radar } from "react-chartjs-2";
import userDataService from "../../../services/userDataService";
import notificationService from "../../../services/notificationService";
import announcementService from "../../../services/announcementService";

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
  RadialLinearScale,
);

const AdminDashboard = () => {
  const { language, isArabic } = useLanguage();
  const t = (key) => getTranslation(key, language);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notify } = useNotification();
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [classDistribution, setClassDistribution] = useState([]);
  const [showAllRegistrations, setShowAllRegistrations] = useState(false);
  const [showAllPayments, setShowAllPayments] = useState(false);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [showViewModal, setShowViewModal] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(null);
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(null);
  const [showApproveConfirm, setShowApproveConfirm] = useState(null);
  const [showPaymentApproveConfirm, setShowPaymentApproveConfirm] = useState(null);
  const [showPaymentDeclineConfirm, setShowPaymentDeclineConfirm] = useState(null);
  const [processingAction, setProcessingAction] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [allStudents, setAllStudents] = useState([]);
  const [paymentReceiptUrl, setPaymentReceiptUrl] = useState(null);

  const locale = isArabic ? ar : enUS;

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

  // ===== Check mobile =====
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // ===== Get user display name =====
  const getUserDisplayName = () => {
    if (!user) return isArabic ? "المسؤول" : "Admin";
    if (isArabic) {
      return user.arabicName || user.name || "المسؤول";
    }
    return user.name || "Admin";
  };

  // ===== Arabic font style =====
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

  // ===== Format time =====
  const formatTime = (date) => {
    if (!date) return isArabic ? "منذ قليل" : "Just now";
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true, locale });
    } catch {
      return isArabic ? "منذ قليل" : "Just now";
    }
  };

  // ===== Get registrations from localStorage =====
  const getRegistrationsFromStorage = () => {
    try {
      const stored = localStorage.getItem("registrations");
      if (stored) {
        const registrations = JSON.parse(stored);
        return Array.isArray(registrations) ? registrations : [];
      }
      return [];
    } catch (error) {
      console.error("Error getting registrations from localStorage:", error);
      return [];
    }
  };

  // ===== Get pending registrations from localStorage =====
  const getPendingRegistrations = () => {
    const registrations = getRegistrationsFromStorage();
    const pending = registrations.filter((r) => r.status === "pending" || !r.status);
    
    return pending.map((r) => ({
      id: r.id || `reg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      student_name: r.studentName || `${r.firstName || ""} ${r.lastName || ""}`.trim() || "Unknown Student",
      level: r.level || r.levelDisplay || r.requestedClass || "Primary",
      parent_name: r.parentName || "Unknown Parent",
      parent_email: r.parentEmail || r.email || "",
      parent_phone: r.parentPhone || r.phone || "",
      parent_address: r.parentAddress || r.address || "",
      created_at: r.submittedAt || r.created_at || new Date().toISOString(),
      status: r.status || "pending",
      read: r.read || false,
      registrationId: r.id,
      firstName: r.firstName || "",
      lastName: r.lastName || "",
      requestedClass: r.requestedClass || r.level || "",
      dateOfBirth: r.dateOfBirth || "",
      gender: r.gender || "",
      previousSchool: r.previousSchool || "",
      ...r,
    }));
  };

  // ===== Get pending payments from localStorage =====
  const getPendingPayments = () => {
    try {
      const allPayments = JSON.parse(localStorage.getItem('school_payments') || '[]');
      const pending = allPayments.filter(p => p.status === 'submitted' || p.status === 'pending');
      
      // Get student names
      const allStudents = JSON.parse(localStorage.getItem('school_students') || '[]');
      
      return pending.map(p => {
        const student = allStudents.find(s => s.id === p.studentId);
        return {
          id: p.id || `pay-${Date.now()}`,
          studentId: p.studentId,
          studentName: student?.name || student?.firstName || p.studentName || 'Unknown Student',
          className: student?.className || student?.class || p.className || 'N/A',
          amount: p.amount || 0,
          month: p.month || new Date().getMonth() + 1,
          year: p.year || new Date().getFullYear(),
          status: p.status || 'pending',
          receiptData: p.receiptData || null,
          receiptName: p.receiptName || null,
          receiptType: p.receiptType || null,
          hasReceipt: !!p.receiptData || !!p.receipt,
          note: p.note || '',
          createdAt: p.createdAt || p.updatedAt || new Date().toISOString(),
          parentName: student?.parentName || 'Unknown Parent',
          parentEmail: student?.parentEmail || '',
          parentPhone: student?.parentPhone || '',
        };
      });
    } catch (error) {
      console.error('Error getting pending payments:', error);
      return [];
    }
  };

  // ===== Update payment status =====
  const updatePaymentStatus = (paymentId, status) => {
    try {
      const allPayments = JSON.parse(localStorage.getItem('school_payments') || '[]');
      const index = allPayments.findIndex(p => p.id === paymentId);
      
      if (index !== -1) {
        allPayments[index].status = status;
        allPayments[index].updatedAt = new Date().toISOString();
        localStorage.setItem('school_payments', JSON.stringify(allPayments));
        
        // Also update student's payment status
        const allStudents = JSON.parse(localStorage.getItem('school_students') || '[]');
        const studentIndex = allStudents.findIndex(s => s.id === allPayments[index].studentId);
        if (studentIndex !== -1) {
          allStudents[studentIndex].paymentStatus = status === 'approved' ? 'paid' : 'pending';
          allStudents[studentIndex].paymentUpdatedAt = new Date().toISOString();
          localStorage.setItem('school_students', JSON.stringify(allStudents));
        }
        
        window.dispatchEvent(new CustomEvent('paymentUpdated', { 
          detail: { paymentId, status }
        }));
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating payment status:', error);
      return false;
    }
  };

  // ===== Get pending registrations from notifications (fallback) =====
  const getPendingRegistrationsFromNotifications = () => {
    try {
      const registrations = getRegistrationsFromStorage();
      const pending = registrations.filter(
        (r) => r.status === "pending" || !r.status,
      );

      if (pending.length > 0) {
        return pending.map((r) => ({
          id: r.id || `reg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          student_name: r.studentName || `${r.firstName || ""} ${r.lastName || ""}`.trim() || "Unknown Student",
          level: r.level || r.levelDisplay || r.requestedClass || "Primary",
          parent_name: r.parentName || "Unknown Parent",
          parent_email: r.parentEmail || r.email || "",
          parent_phone: r.parentPhone || r.phone || "",
          parent_address: r.parentAddress || r.address || "",
          created_at: r.submittedAt || r.created_at || new Date().toISOString(),
          status: r.status || "pending",
          read: r.read || false,
          registrationId: r.id,
          firstName: r.firstName || "",
          lastName: r.lastName || "",
          requestedClass: r.requestedClass || r.level || "",
          dateOfBirth: r.dateOfBirth || "",
          gender: r.gender || "",
          previousSchool: r.previousSchool || "",
          ...r,
        }));
      }

      return [];
    } catch (error) {
      console.error("Error getting registrations:", error);
      return [];
    }
  };

  const getRecentActivitiesFromNotifications = () => {
    try {
      let allNotifications = [];

      if (
        window.notificationService &&
        typeof window.notificationService.getNotifications === "function"
      ) {
        allNotifications = window.notificationService.getNotifications();
      } else if (
        notificationService &&
        typeof notificationService.getNotifications === "function"
      ) {
        allNotifications = notificationService.getNotifications();
      } else {
        const stored = localStorage.getItem("notifications");
        if (stored) {
          try {
            allNotifications = JSON.parse(stored);
          } catch (e) {
            console.error("Error parsing notifications:", e);
          }
        }
      }

      // Also get registrations from localStorage for additional activities
      const registrations = getRegistrationsFromStorage();
      const registrationActivities = registrations.map((r) => ({
        id: `reg-${r.id || Date.now()}`,
        user: r.parentName || (isArabic ? "ولي أمر" : "Parent"),
        action: isArabic
          ? `قدم طلب تسجيل للطالب ${r.studentName || ""}`
          : `submitted registration for student ${r.studentName || ""}`,
        time: formatTime(r.submittedAt || r.created_at),
        created_at: r.submittedAt || r.created_at || new Date().toISOString(),
        type: isArabic ? "تسجيل" : "Registration",
        icon: <FaUserPlus />,
        color: "#f39c12",
        link: "/dashboard/admin/registrations",
        read: false,
      }));

      // Get payment activities
      const allPayments = JSON.parse(localStorage.getItem('school_payments') || '[]');
      const paymentActivities = allPayments
        .filter(p => p.status === 'submitted')
        .map(p => ({
          id: `pay-${p.id || Date.now()}`,
          user: p.studentName || (isArabic ? "طالب" : "Student"),
          action: isArabic
            ? `رفع إيصال دفع بمبلغ ${p.amount} MAD`
            : `uploaded payment receipt of ${p.amount} MAD`,
          time: formatTime(p.updatedAt || p.createdAt),
          created_at: p.updatedAt || p.createdAt || new Date().toISOString(),
          type: isArabic ? "دفع" : "Payment",
          icon: <FaMoneyBillWave />,
          color: "#2ecc71",
          link: "/dashboard/admin/payments",
          read: false,
        }));

      const activities = allNotifications
        .filter(
          (n) =>
            n.type === "announcement" ||
            n.type === "registration" ||
            n.type === "new_registration" ||
            n.type === "registration_approved" ||
            n.type === "registration_declined" ||
            n.type === "payment",
        )
        .slice(0, 10)
        .map((n) => {
          let type = "activity";
          let icon = <FaInfoCircle />;
          let color = "#4a9eff";
          let label = isArabic ? "نشاط" : "Activity";
          let link = null;

          if (n.type === "announcement") {
            type = "announcement";
            icon = <FaBullhorn />;
            color = "#e74c3c";
            label = isArabic ? "إعلان" : "Announcement";
            link = "/dashboard/admin/announcements";
          } else if (
            n.type === "registration" ||
            n.type === "new_registration"
          ) {
            type = "registration";
            icon = <FaUserPlus />;
            color = "#f39c12";
            label = isArabic ? "تسجيل" : "Registration";
            link = "/dashboard/admin/registrations";
          } else if (n.type === "registration_approved") {
            type = "approved";
            icon = <FaCheckCircle />;
            color = "#2ecc71";
            label = isArabic ? "موافقة" : "Approved";
            link = "/dashboard/admin/registrations";
          } else if (n.type === "registration_declined") {
            type = "declined";
            icon = <FaTimesCircle />;
            color = "#e74c3c";
            label = isArabic ? "رفض" : "Declined";
            link = "/dashboard/admin/registrations";
          } else if (n.type === "payment") {
            type = "payment";
            icon = <FaMoneyBillWave />;
            color = "#2ecc71";
            label = isArabic ? "دفع" : "Payment";
            link = "/dashboard/admin/payments";
          }

          return {
            id: n.id || Date.now() + Math.random(),
            user: n.userName || n.studentName || (isArabic ? "النظام" : "System"),
            action: n.message || n.title || (isArabic ? "نشاط" : "Activity"),
            time: n.time || formatTime(n.createdAt || n.created_at),
            created_at: n.createdAt || n.created_at || new Date().toISOString(),
            type: label,
            icon: icon,
            color: color,
            link: link,
            read: n.read || false,
          };
        });

      // Combine and sort all activities
      const allActivities = [...registrationActivities, ...paymentActivities, ...activities];
      allActivities.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
      );

      return allActivities.slice(0, 10);
    } catch (error) {
      console.error("Error getting activities from notifications:", error);
      return [];
    }
  };

  const getRealUsersData = () => {
    try {
      const allUsers = userDataService.getUsers();
      const students = allUsers.filter((u) => u.role === "student");
      setAllStudents(students);
      return {
        students: students,
        parents: allUsers.filter((u) => u.role === "parent"),
        teachers: allUsers.filter((u) => u.role === "teacher"),
        all: allUsers,
      };
    } catch (error) {
      console.error("Error getting users data:", error);
      return { students: [], parents: [], teachers: [], all: [] };
    }
  };

  // ===== Update registration status in localStorage =====
  const updateRegistrationStatus = (registrationId, status) => {
    try {
      const registrations = getRegistrationsFromStorage();
      const updated = registrations.map((r) => {
        if (r.id === registrationId) {
          return { ...r, status, updatedAt: new Date().toISOString() };
        }
        return r;
      });
      localStorage.setItem("registrations", JSON.stringify(updated));

      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "registrations",
          newValue: JSON.stringify(updated),
        }),
      );

      return true;
    } catch (error) {
      console.error("Error updating registration status:", error);
      return false;
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const { students, parents, teachers, all: allUsers } = getRealUsersData();
      setAllStudents(students);

      // Get pending registrations
      const pendingRegs = getPendingRegistrations();
      console.log("📊 Pending registrations:", pendingRegs.length);
      setPendingRegistrations(pendingRegs);

      // Get pending payments
      const pendingPaymentsData = getPendingPayments();
      console.log("💰 Pending payments:", pendingPaymentsData.length);
      setPendingPayments(pendingPaymentsData);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      setStats({
        total_students: students.length,
        total_parents: parents.length,
        total_teachers: teachers.length,
        total_classes: 18,
        pending_registrations: pendingRegs.length,
        pending_payments: pendingPaymentsData.length,
        new_students_last_30_days: students.filter((s) => {
          const created = new Date(s.created_at || s.createdAt);
          return created >= thirtyDaysAgo;
        }).length,
        new_parents_last_30_days: parents.filter((p) => {
          const created = new Date(p.created_at || p.createdAt);
          return created >= thirtyDaysAgo;
        }).length,
        registrations_last_24h: pendingRegs.filter((r) => {
          const created = new Date(r.created_at);
          return created >= twentyFourHoursAgo;
        }).length,
      });

      const activities = getRecentActivitiesFromNotifications();
      setRecentActivities(activities);

      // Class distribution
      const defaultLevels = isArabic
        ? [
            { name: "أولي", student_count: 0 },
            { name: "ابتدائي", student_count: 0 },
            { name: "إعدادي", student_count: 0 },
            { name: "ثانوي", student_count: 0 },
          ]
        : [
            { name: "Kindergarten", student_count: 0 },
            { name: "Primary", student_count: 0 },
            { name: "Secondary", student_count: 0 },
            { name: "High School", student_count: 0 },
          ];

      const classCounts = {};
      students.forEach((s) => {
        const className = s.class || s.className || s.level || s.requestedClass || "Primary";
        classCounts[className] = (classCounts[className] || 0) + 1;
      });

      pendingRegs.forEach((r) => {
        const level = r.level || r.requestedClass || "Primary";
        classCounts[level] = (classCounts[level] || 0) + 1;
      });

      if (Object.keys(classCounts).length > 0) {
        const mappedDistribution = defaultLevels.map((dl) => {
          const match = Object.entries(classCounts).find(
            ([key]) => key.toLowerCase().includes(dl.name.toLowerCase()) || 
                       dl.name.toLowerCase().includes(key.toLowerCase())
          );
          return {
            name: dl.name,
            student_count: match ? match[1] : 0
          };
        });
        
        if (mappedDistribution.some(d => d.student_count > 0)) {
          setClassDistribution(mappedDistribution);
        } else {
          const actualDistribution = Object.entries(classCounts).map(([name, count]) => ({
            name,
            student_count: count,
          }));
          setClassDistribution(actualDistribution);
        }
      } else {
        setClassDistribution(defaultLevels);
      }

      const months = isArabic
        ? ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]
        : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      const currentMonth = new Date().getMonth();
      const last6Months = [];
      for (let i = 5; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12;
        last6Months.push(months[monthIndex]);
      }

      const allRegistrations = getRegistrationsFromStorage();
      const allPayments = JSON.parse(localStorage.getItem('school_payments') || '[]');

      const monthData = last6Months.map((month, idx) => {
        const monthNum = (currentMonth - (5 - idx) + 12) % 12;
        const monthRegistrations = allRegistrations.filter((r) => {
          const created = new Date(r.submittedAt || r.created_at);
          return created && created.getMonth() === monthNum && created.getFullYear() === new Date().getFullYear();
        });

        const monthPayments = allPayments.filter((p) => {
          const created = new Date(p.createdAt || p.updatedAt);
          return created && created.getMonth() === monthNum && created.getFullYear() === new Date().getFullYear();
        });

        const monthStudents = students.filter((s) => {
          const created = new Date(s.created_at || s.createdAt);
          return created && created.getMonth() === monthNum && created.getFullYear() === new Date().getFullYear();
        });

        return {
          month,
          registrations: monthRegistrations.length,
          payments: monthPayments.length,
          approved: monthStudents.length,
          rejected: Math.floor(monthRegistrations.length * 0.1),
        };
      });
      setMonthlyTrend(monthData);

      // Upcoming events from announcements
      let allAnnouncements = [];
      try {
        if (
          announcementService &&
          typeof announcementService.getAnnouncements === "function"
        ) {
          allAnnouncements = announcementService.getAnnouncements() || [];
        }

        if (allAnnouncements.length === 0) {
          const stored = localStorage.getItem("announcements");
          if (stored) {
            try {
              allAnnouncements = JSON.parse(stored);
            } catch (e) {
              console.error("Error parsing announcements:", e);
            }
          }
        }
      } catch (err) {
        console.warn("Error fetching announcements:", err);
        try {
          const stored = localStorage.getItem("announcements");
          if (stored) {
            allAnnouncements = JSON.parse(stored);
          }
        } catch (e) {
          console.error("Error parsing announcements:", e);
        }
      }

      const events = (Array.isArray(allAnnouncements) ? allAnnouncements : [])
        .filter((a) => a.status === "published")
        .slice(0, 4)
        .map((a, i) => ({
          id: a.id || i + 1,
          title: a.title || (isArabic ? "إعلان" : "Announcement"),
          date: a.date || new Date(Date.now() + (i + 1) * 7 * 24 * 60 * 60 * 1000).toISOString(),
          time: a.time || "10:00 AM",
          location: a.location || (isArabic ? "المدرسة" : "School"),
          type: a.type === "event" ? (isArabic ? "فعالية" : "Event") : (isArabic ? "إعلان" : "Announcement"),
          color: ["#e67e22", "#3498db", "#e74c3c", "#f39c12", "#2ecc71", "#9b59b6"][i % 6],
          description: a.content || a.message || "",
        }));

      setUpcomingEvents(events);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError(isArabic ? "فشل في تحميل البيانات" : "Failed to load data");
      setPendingRegistrations([]);
      setPendingPayments([]);
      setStats({
        total_students: 0,
        total_parents: 0,
        total_teachers: 0,
        total_classes: 0,
        pending_registrations: 0,
        pending_payments: 0,
        new_students_last_30_days: 0,
        new_parents_last_30_days: 0,
        registrations_last_24h: 0,
      });
      setMonthlyTrend([]);
      setClassDistribution([]);
      setUpcomingEvents([]);
      setRecentActivities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const unsubscribeUsers = userDataService.addListener(() => {
      fetchDashboardData();
    });

    const handleNewNotification = (event) => {
      console.log("New notification received:", event?.detail);
      fetchDashboardData();
    };
    window.addEventListener("newNotification", handleNewNotification);

    const handleAnnouncementUpdate = () => {
      fetchDashboardData();
    };
    window.addEventListener("announcementsUpdated", handleAnnouncementUpdate);

    const handlePaymentUpdated = () => {
      console.log("💰 Payment updated, refreshing dashboard");
      fetchDashboardData();
    };
    window.addEventListener("paymentUpdated", handlePaymentUpdated);

    const handleStorageChange = (event) => {
      if (
        event.key === "notifications" ||
        event.key === "registration_requests" ||
        event.key === "announcements" ||
        event.key === "registrations" ||
        event.key === "school_payments"
      ) {
        fetchDashboardData();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    const handleRegistrationSubmitted = (event) => {
      console.log("📝 Registration submitted event received:", event.detail);
      setTimeout(() => fetchDashboardData(), 500);
    };
    window.addEventListener("registrationSubmitted", handleRegistrationSubmitted);

    const pollInterval = setInterval(() => {
      fetchDashboardData();
    }, 2100000);

    return () => {
      if (unsubscribeUsers) unsubscribeUsers();
      window.removeEventListener("newNotification", handleNewNotification);
      window.removeEventListener("announcementsUpdated", handleAnnouncementUpdate);
      window.removeEventListener("paymentUpdated", handlePaymentUpdated);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("registrationSubmitted", handleRegistrationSubmitted);
      clearInterval(pollInterval);
    };
  }, []);

  useEffect(() => {
    if (stats) {
      setStats((prev) => ({
        ...prev,
        pending_registrations: pendingRegistrations.length,
        pending_payments: pendingPayments.length,
      }));
    }
  }, [pendingRegistrations, pendingPayments]);

  // ===== HANDLE APPROVE REGISTRATION =====
  const handleApproveRegistration = async (id) => {
    setProcessingAction(true);
    try {
      const reg = pendingRegistrations.find((r) => r.id === id);
      if (reg) {
        updateRegistrationStatus(reg.registrationId || reg.id, "approved");
        setPendingRegistrations((prev) => prev.filter((r) => r.id !== id));

        const newStudent = {
          id: `STU/${new Date().getFullYear()}/${String(Date.now()).slice(-6)}`,
          name: reg.student_name,
          firstName: reg.firstName || reg.student_name?.split(" ")[0] || "",
          lastName: reg.lastName || reg.student_name?.split(" ").slice(1).join(" ") || "",
          email: reg.parent_email || "",
          role: "student",
          phone: reg.parent_phone || "",
          address: reg.parent_address || "",
          status: "active",
          level: reg.level || "primary",
          className: reg.requestedClass || reg.level || "",
          parentName: reg.parent_name,
          parentEmail: reg.parent_email,
          parentPhone: reg.parent_phone,
          created_at: new Date().toISOString(),
          needsProfileCompletion: true,
        };

        userDataService.addUser(newStudent);
        setAllStudents((prev) => [...prev, newStudent]);

        notificationService.addNotification(
          isArabic
            ? `✅ تم قبول تسجيل: ${reg.student_name}`
            : `✅ Registration Approved: ${reg.student_name}`,
          isArabic
            ? `تم قبول تسجيل التلميذ ${reg.student_name} بنجاح`
            : `Student ${reg.student_name} registration approved successfully`,
          "registration_approved",
          "/dashboard/admin/registrations",
        );

        notify(
          isArabic
            ? `تم قبول تسجيل ${reg.student_name} وتم إضافته كطالب`
            : `Registration approved for ${reg.student_name} and added as student`,
          "success",
        );
        setShowApproveConfirm(null);
        fetchDashboardData();
      }
    } catch (error) {
      console.error("Approval error:", error);
      notify(
        isArabic ? "فشل قبول التسجيل" : "Failed to approve registration",
        "error",
      );
      setShowApproveConfirm(null);
    } finally {
      setProcessingAction(false);
    }
  };

  // ===== HANDLE DECLINE REGISTRATION =====
  const handleDeclineRegistration = async (id) => {
    setProcessingAction(true);
    try {
      const reg = pendingRegistrations.find((r) => r.id === id);
      if (reg) {
        updateRegistrationStatus(reg.registrationId || reg.id, "declined");
        setPendingRegistrations((prev) => prev.filter((r) => r.id !== id));

        notificationService.addNotification(
          isArabic
            ? `❌ تم رفض تسجيل: ${reg.student_name}`
            : `❌ Registration Declined: ${reg.student_name}`,
          isArabic
            ? `تم رفض تسجيل التلميذ ${reg.student_name}`
            : `Student ${reg.student_name} registration declined`,
          "registration_declined",
          "/dashboard/admin/registrations",
        );

        notify(
          isArabic
            ? `تم رفض تسجيل ${reg.student_name}`
            : `Registration declined for ${reg.student_name}`,
          "warning",
        );
        setShowDeclineConfirm(null);
        fetchDashboardData();
      }
    } catch (error) {
      console.error("Rejection error:", error);
      notify(
        isArabic ? "فشل رفض التسجيل" : "Failed to decline registration",
        "error",
      );
      setShowDeclineConfirm(null);
    } finally {
      setProcessingAction(false);
    }
  };

  // ===== HANDLE VIEW REGISTRATION =====
  const handleViewRegistration = (reg) => {
    setShowViewModal(reg);
  };

  // ===== HANDLE VIEW PAYMENT =====
  const handleViewPayment = (payment) => {
    setShowPaymentModal(payment);
    // Create a preview URL for the receipt if it exists
    if (payment.receiptData) {
      try {
        const byteCharacters = atob(payment.receiptData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: payment.receiptType || 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setPaymentReceiptUrl(url);
      } catch (e) {
        console.error('Error creating receipt preview:', e);
        setPaymentReceiptUrl(null);
      }
    } else {
      setPaymentReceiptUrl(null);
    }
  };

  // ===== HANDLE APPROVE PAYMENT =====
  const handleApprovePayment = async (id) => {
    setProcessingAction(true);
    try {
      const payment = pendingPayments.find((p) => p.id === id);
      if (payment) {
        updatePaymentStatus(payment.id, "approved");
        setPendingPayments((prev) => prev.filter((p) => p.id !== id));

        // Create notification for parent
        const notifications = JSON.parse(localStorage.getItem('school_notifications') || '[]');
        const notification = {
          id: `NOT${String(Date.now()).slice(-6)}`,
          title: isArabic ? '✅ تم اعتماد دفعتك' : '✅ Your Payment Approved',
          message: isArabic 
            ? `تم اعتماد دفعتك بمبلغ ${payment.amount} MAD للطالب ${payment.studentName}`
            : `Your payment of ${payment.amount} MAD for student ${payment.studentName} has been approved`,
          type: 'payment_approved',
          priority: 'high',
          read: false,
          recipientRole: 'parent',
          studentId: payment.studentId,
          studentName: payment.studentName,
          paymentId: payment.id,
          amount: payment.amount,
          createdAt: new Date().toISOString(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        notifications.push(notification);
        localStorage.setItem('school_notifications', JSON.stringify(notifications));

        // Dispatch event for parent
        window.dispatchEvent(new CustomEvent('notificationAdded', { detail: notification }));
        window.dispatchEvent(new CustomEvent('paymentUpdated', { 
          detail: { paymentId: id, status: 'approved' }
        }));

        notify(
          isArabic
            ? `✅ تم اعتماد دفعة ${payment.studentName} بمبلغ ${payment.amount} MAD`
            : `✅ Payment approved for ${payment.studentName} of ${payment.amount} MAD`,
          "success",
        );
        setShowPaymentApproveConfirm(null);
        setShowPaymentModal(null);
        fetchDashboardData();
      }
    } catch (error) {
      console.error("Payment approval error:", error);
      notify(
        isArabic ? "فشل اعتماد الدفعة" : "Failed to approve payment",
        "error",
      );
      setShowPaymentApproveConfirm(null);
    } finally {
      setProcessingAction(false);
    }
  };

  // ===== HANDLE DECLINE PAYMENT =====
  const handleDeclinePayment = async (id) => {
    setProcessingAction(true);
    try {
      const payment = pendingPayments.find((p) => p.id === id);
      if (payment) {
        updatePaymentStatus(payment.id, "rejected");
        setPendingPayments((prev) => prev.filter((p) => p.id !== id));

        // Create notification for parent
        const notifications = JSON.parse(localStorage.getItem('school_notifications') || '[]');
        const notification = {
          id: `NOT${String(Date.now()).slice(-6)}`,
          title: isArabic ? '❌ تم رفض دفعتك' : '❌ Your Payment Declined',
          message: isArabic 
            ? `تم رفض دفعتك بمبلغ ${payment.amount} MAD للطالب ${payment.studentName}. يرجى التواصل مع الإدارة.`
            : `Your payment of ${payment.amount} MAD for student ${payment.studentName} has been declined. Please contact administration.`,
          type: 'payment_declined',
          priority: 'high',
          read: false,
          recipientRole: 'parent',
          studentId: payment.studentId,
          studentName: payment.studentName,
          paymentId: payment.id,
          amount: payment.amount,
          createdAt: new Date().toISOString(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        notifications.push(notification);
        localStorage.setItem('school_notifications', JSON.stringify(notifications));

        window.dispatchEvent(new CustomEvent('notificationAdded', { detail: notification }));
        window.dispatchEvent(new CustomEvent('paymentUpdated', { 
          detail: { paymentId: id, status: 'rejected' }
        }));

        notify(
          isArabic
            ? `❌ تم رفض دفعة ${payment.studentName} بمبلغ ${payment.amount} MAD`
            : `❌ Payment declined for ${payment.studentName} of ${payment.amount} MAD`,
          "warning",
        );
        setShowPaymentDeclineConfirm(null);
        setShowPaymentModal(null);
        fetchDashboardData();
      }
    } catch (error) {
      console.error("Payment decline error:", error);
      notify(
        isArabic ? "فشل رفض الدفعة" : "Failed to decline payment",
        "error",
      );
      setShowPaymentDeclineConfirm(null);
    } finally {
      setProcessingAction(false);
    }
  };

  // ===== Performance Radar Data =====
  const performanceRadarData = {
    labels: isArabic
      ? ["الحضور", "الدرجات", "المشاركة", "السلوك", "التقدم", "الأنشطة"]
      : ["Attendance", "Grades", "Participation", "Behavior", "Progress", "Activities"],
    datasets: [
      {
        label: isArabic ? "أداء المدرسة" : "School Performance",
        data: [92, 85, 78, 88, 80, 75],
        backgroundColor: "rgba(74, 158, 255, 0.2)",
        borderColor: "#4a9eff",
        borderWidth: 2,
        pointBackgroundColor: "#4a9eff",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "#4a9eff",
      },
      {
        label: isArabic ? "المستوى المستهدف" : "Target Level",
        data: [95, 90, 85, 90, 85, 80],
        backgroundColor: "rgba(46, 204, 113, 0.1)",
        borderColor: "#2ecc71",
        borderWidth: 2,
        borderDash: [5, 5],
        pointBackgroundColor: "#2ecc71",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "#2ecc71",
      },
    ],
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: darkMode ? "#e9ecef" : "#4a9eff",
          padding: 15,
          usePointStyle: true,
          pointStyle: "circle",
          font: { size: 12, weight: "600" },
        },
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
        },
        pointLabels: {
          color: darkMode ? "#e9ecef" : "#2d3436",
          font: { size: 12, weight: "500" },
        },
        ticks: {
          stepSize: 20,
          color: darkMode ? "#adb5bd" : "#6c757d",
          backdropColor: "transparent",
        },
      },
    },
  };

  // ===== Attendance Trend Data =====
  const attendanceTrendData = {
    labels: monthlyTrend.length > 0 ? monthlyTrend.map((d) => d.month) : 
      isArabic ? ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو"] : ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: isArabic ? "اتجاه التسجيلات" : "Registration Trend",
        data: monthlyTrend.length > 0 ? monthlyTrend.map((d) => d.registrations) : [10, 15, 20, 25, 30, 35],
        borderColor: "#4a9eff",
        backgroundColor: "rgba(74, 158, 255, 0.15)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#4a9eff",
        pointBorderColor: darkMode ? "#1a1a2e" : "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
      {
        label: isArabic ? "الطلاب المقبولين" : "Approved Students",
        data: monthlyTrend.length > 0 ? monthlyTrend.map((d) => d.approved) : [8, 12, 16, 20, 24, 28],
        borderColor: "#2ecc71",
        backgroundColor: "rgba(46, 204, 113, 0.15)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#2ecc71",
        pointBorderColor: darkMode ? "#1a1a2e" : "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        borderDash: [5, 5],
      },
      {
        label: isArabic ? "المدفوعات" : "Payments",
        data: monthlyTrend.length > 0 ? monthlyTrend.map((d) => d.payments || 0) : [2, 4, 6, 8, 10, 12],
        borderColor: "#f39c12",
        backgroundColor: "rgba(243, 156, 18, 0.15)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#f39c12",
        pointBorderColor: darkMode ? "#1a1a2e" : "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: darkMode ? "#e9ecef" : "#4a9eff",
          padding: 20,
          usePointStyle: true,
          pointStyle: "circle",
          font: { size: 13, weight: "bold" },
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
          color: darkMode ? "#e9ecef" : "#4a9eff",
          padding: 15,
          usePointStyle: true,
          pointStyle: "circle",
          font: { size: 12, weight: "600" },
          boxWidth: 12,
        },
      },
    },
  };

  const doughnutChartData = {
    labels: classDistribution.length > 0 ? classDistribution.map((d) => d.name) :
      isArabic ? ["أولي", "ابتدائي", "إعدادي", "ثانوي"] : ["Kindergarten", "Primary", "Secondary", "High School"],
    datasets: [{
      label: isArabic ? "توزيع التلاميذ" : "Student Distribution",
      data: classDistribution.length > 0 ? classDistribution.map((d) => d.student_count) : [0, 0, 0, 0],
      backgroundColor: ["#f39c12", "#2d6a4f", "#c49a6c", "#6c757d", "#4a9eff", "#e74c3c"],
      borderColor: darkMode ? "#1a1a2e" : "#ffffff",
      borderWidth: 2,
    }],
  };

  const displayedRegistrations = showAllRegistrations ? pendingRegistrations : pendingRegistrations.slice(0, 3);
  const displayedPayments = showAllPayments ? pendingPayments : pendingPayments.slice(0, 3);
  const displayedActivities = showAllActivities ? recentActivities : recentActivities.slice(0, 5);

  // ===== STATS CARDS =====
  const statsCards = [
    {
      icon: <FaUserGraduate />,
      number: stats?.total_students || 0,
      label: isArabic ? "التلاميذ" : "Students",
      gradientClass: "total-card",
      iconClass: "total-icon",
      change: `+${stats?.new_students_last_30_days || 0}`,
      changeLabel: isArabic ? "جديد هذا الشهر" : "new this month",
    },
    {
      icon: <FaUsers />,
      number: stats?.total_parents || 0,
      label: isArabic ? "أولياء الأمور" : "Parents",
      gradientClass: "active-card",
      iconClass: "active-icon",
      change: `+${stats?.new_parents_last_30_days || 0}`,
      changeLabel: isArabic ? "جديد هذا الشهر" : "new this month",
    },
    {
      icon: <FaUserPlus />,
      number: stats?.pending_registrations || 0,
      label: isArabic ? "طلبات الانتظار" : "Pending Requests",
      gradientClass: "children-card",
      iconClass: "children-icon",
      change: `+${stats?.registrations_last_24h || 0}`,
      changeLabel: isArabic ? "اليوم" : "today",
    },
    {
      icon: <FaMoneyBillWave />,
      number: stats?.pending_payments || 0,
      label: isArabic ? "مدفوعات معلقة" : "Pending Payments",
      gradientClass: "payment-card",
      iconClass: "payment-icon",
      change: `+${pendingPayments.filter(p => new Date(p.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length || 0}`,
      changeLabel: isArabic ? "اليوم" : "today",
    },
  ];

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted" style={arabicFontStyle}>
          {isArabic ? "جاري تحميل لوحة التحكم..." : "Loading dashboard..."}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-5">
        <FaExclamationTriangle size={48} className="text-warning mb-3" />
        <p className="text-danger" style={arabicFontStyle}>{error}</p>
        <Button variant="primary" onClick={fetchDashboardData} style={{ ...arabicFontStyle, borderRadius: "12px" }}>
          <FaSync className="me-2" /> {isArabic ? "إعادة المحاولة" : "Retry"}
        </Button>
      </div>
    );
  }

  return (
    <div className="admin-dashboard" dir={isArabic ? "rtl" : "ltr"}>
      {/* ===== PAGE HEADER ===== */}
      <div className="page-header d-flex flex-wrap flex-sm-nowrap justify-content-between align-items-center gap-2 gap-md-3 mb-3 mb-md-4">
        <div className="flex-grow-1 min-width-0">
          <h4 className="fw-bold mb-0 mb-sm-1" style={{
            ...arabicFontStyle,
            color: "#4a9eff",
            fontSize: isArabic ? "clamp(1rem, 2.2vw, 1.8rem)" : "clamp(0.95rem, 2vw, 1.7rem)",
          }}>
            👋 {isArabic ? "لوحة تحكم الإدارة" : "Admin Dashboard"}
          </h4>
          <p className="text-muted mb-0 d-none d-sm-block" style={{
            ...arabicFontStyle,
            fontSize: isArabic ? "clamp(0.8rem, 1.1vw, 1.05rem)" : "clamp(0.75rem, 1vw, 1rem)",
          }}>
            {isArabic
              ? `مرحباً ${getUserDisplayName()}، استعرض إحصائيات وإدارة المدرسة`
              : `Welcome ${getUserDisplayName()}, view school statistics and management`}
          </p>
        </div>
        <div className="d-flex gap-1 gap-sm-2 flex-wrap flex-shrink-0">
          <Button
            variant="outline-primary"
            size="sm"
            className="d-flex align-items-center gap-1"
            onClick={fetchDashboardData}
            disabled={loading}
            style={{
              ...arabicFontStyle,
              borderRadius: "12px",
              fontSize: isArabic ? "clamp(0.65rem, 0.8vw, 0.85rem)" : "clamp(0.6rem, 0.75vw, 0.8rem)",
              padding: "4px 10px",
            }}
          >
            <FaSync className={loading ? "spinning" : ""} size={isMobile ? 10 : 12} />
            <span className="d-none d-sm-inline">{isArabic ? "تحديث" : "Refresh"}</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="d-flex align-items-center gap-1"
            onClick={() => navigate("/dashboard/admin/settings")}
            style={{
              ...arabicFontStyle,
              borderRadius: "12px",
              fontSize: isArabic ? "clamp(0.65rem, 0.8vw, 0.85rem)" : "clamp(0.6rem, 0.75vw, 0.8rem)",
              padding: "4px 10px",
            }}
          >
            <FaCog size={isMobile ? 10 : 12} />
            <span className="d-none d-sm-inline">{isArabic ? "إعدادات" : "Settings"}</span>
          </Button>
        </div>
      </div>

      {/* ===== STATS CARDS ===== */}
      <Row className="g-2 g-sm-3 g-md-4 mb-3 mb-md-4">
        {statsCards.map((stat, index) => (
          <Col key={index} xs={6} sm={6} md={3}>
            <div className={`stat-card-enhanced ${stat.gradientClass}`}>
              <div className="stat-card-gradient-bar"></div>
              <div className="stat-card-content">
                <div className={`stat-icon-wrapper ${stat.iconClass}`}>
                  {stat.icon}
                </div>
                <div className="stat-info">
                  <span className="stat-number">{stat.number}</span>
                  <span className="stat-label">{stat.label}</span>
                  <div className="stat-change">
                    ↑ {stat.change} <span className="text-muted">{stat.changeLabel}</span>
                  </div>
                </div>
              </div>
              <div className="stat-card-shimmer"></div>
            </div>
          </Col>
        ))}
      </Row>

      {/* ===== CHARTS SECTION ===== */}
      <Row className="g-3 g-md-4 mb-3 mb-md-4">
        <Col xl={4} lg={6} md={12}>
          <Card className="modern-card h-100" style={{
            background: darkMode ? "#1a1a2e" : "#ffffff",
            borderColor: darkMode ? "#2d2d44" : "#e9ecef",
          }}>
            <Card.Header className="modern-card-header" style={{ borderColor: darkMode ? "#2d2d44" : "#e9ecef" }}>
              <h6 className="fw-bold mb-0" style={{
                ...arabicFontStyle,
                color: "#4a9eff",
                fontSize: isArabic ? "clamp(0.9rem, 1.2vw, 1.1rem)" : "clamp(0.85rem, 1.1vw, 1.05rem)",
              }}>
                <FaChartLine className="me-2" size={isMobile ? 14 : 16} />
                {isArabic ? "أداء المدرسة" : "School Performance"}
              </h6>
            </Card.Header>
            <Card.Body className="p-2 p-sm-3">
              <div style={{ height: isMobile ? "200px" : "280px" }}>
                <Radar data={performanceRadarData} options={radarOptions} />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={4} lg={6} md={6}>
          <Card className="modern-card h-100" style={{
            background: darkMode ? "#1a1a2e" : "#ffffff",
            borderColor: darkMode ? "#2d2d44" : "#e9ecef",
          }}>
            <Card.Header className="modern-card-header" style={{ borderColor: darkMode ? "#2d2d44" : "#e9ecef" }}>
              <h6 className="fw-bold mb-0" style={{
                ...arabicFontStyle,
                color: "#4a9eff",
                fontSize: isArabic ? "clamp(0.9rem, 1.2vw, 1.1rem)" : "clamp(0.85rem, 1.1vw, 1.05rem)",
              }}>
                <FaChartLine className="me-2" size={isMobile ? 14 : 16} />
                {isArabic ? "اتجاه التسجيلات" : "Registration Trend"}
              </h6>
            </Card.Header>
            <Card.Body className="p-2 p-sm-3">
              <div style={{ height: isMobile ? "180px" : "230px" }}>
                <Line data={attendanceTrendData} options={chartOptions} />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={4} lg={6} md={6}>
          <Card className="modern-card h-100" style={{
            background: darkMode ? "#1a1a2e" : "#ffffff",
            borderColor: darkMode ? "#2d2d44" : "#e9ecef",
          }}>
            <Card.Header className="modern-card-header" style={{ borderColor: darkMode ? "#2d2d44" : "#e9ecef" }}>
              <h6 className="fw-bold mb-0" style={{
                ...arabicFontStyle,
                color: "#4a9eff",
                fontSize: isArabic ? "clamp(0.9rem, 1.2vw, 1.1rem)" : "clamp(0.85rem, 1.1vw, 1.05rem)",
              }}>
                <FaChartPie className="me-2" size={isMobile ? 14 : 16} />
                {isArabic ? "توزيع التلاميذ" : "Student Distribution"}
              </h6>
            </Card.Header>
            <Card.Body className="p-2 p-sm-3">
              <div style={{ height: isMobile ? "180px" : "230px" }}>
                {classDistribution.length > 0 && classDistribution.some((d) => d.student_count > 0) ? (
                  <Doughnut data={doughnutChartData} options={pieOptions} />
                ) : (
                  <div className="text-center py-4 text-muted">
                    <FaChartPie size={isMobile ? 30 : 40} className="mb-2 opacity-25" />
                    <p style={arabicFontStyle}>{isArabic ? "لا توجد بيانات كافية" : "No data available"}</p>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ===== PENDING PAYMENTS ===== */}
      <Row className="g-3 g-md-4 mb-3 mb-md-4">
        <Col xs={12}>
          <Card className="modern-card" style={{
            background: darkMode ? "#1a1a2e" : "#ffffff",
            borderColor: darkMode ? "#2d2d44" : "#e9ecef",
          }}>
            <Card.Header className="modern-card-header d-flex flex-wrap justify-content-between align-items-center gap-2" style={{ borderColor: darkMode ? "#2d2d44" : "#e9ecef" }}>
              <h6 className="fw-bold mb-0" style={{
                ...arabicFontStyle,
                color: "#2ecc71",
                fontSize: isArabic ? "clamp(0.9rem, 1.2vw, 1.1rem)" : "clamp(0.85rem, 1.1vw, 1.05rem)",
              }}>
                <FaMoneyBillWave className="me-2" size={isMobile ? 14 : 16} />
                {isArabic ? "مدفوعات معلقة" : "Pending Payments"}
              </h6>
              <div className="d-flex align-items-center gap-1 gap-sm-2 flex-wrap">
                {pendingPayments.length > 0 && (
                  <Badge bg="success" className="rounded-pill" style={{ fontSize: isMobile ? "0.6rem" : "0.75rem" }}>
                    {pendingPayments.length}
                  </Badge>
                )}
                <Button
                  variant="link"
                  className="p-0 text-decoration-none small"
                  onClick={() => navigate("/dashboard/admin/payments")}
                  style={{
                    ...arabicFontStyle,
                    fontSize: isArabic ? "clamp(0.65rem, 0.8vw, 0.85rem)" : "clamp(0.6rem, 0.75vw, 0.8rem)",
                  }}
                >
                  {isArabic ? "عرض الكل" : "View All"}
                  <FaArrowRight className="ms-1" size={isMobile ? 8 : 10} />
                </Button>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              {pendingPayments.length === 0 ? (
                <div className="text-center py-3 py-md-4 text-muted">
                  <FaCheckCircle size={isMobile ? 24 : 32} className="mb-2 text-success" />
                  <div style={arabicFontStyle}>
                    {isArabic ? "لا توجد مدفوعات معلقة" : "No pending payments"}
                  </div>
                </div>
              ) : (
                <>
                  {displayedPayments.map((payment) => (
                    <div key={payment.id} className="pending-item px-2 px-sm-3 py-2 border-bottom" style={{ borderColor: darkMode ? "#2d2d44" : "#e9ecef" }}>
                      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                        <div className="min-width-0 flex-grow-1">
                          <div className="fw-semibold" style={{
                            ...arabicFontStyle,
                            color: darkMode ? "#e9ecef" : "#212529",
                            fontSize: isArabic ? "clamp(0.85rem, 1vw, 1rem)" : "clamp(0.8rem, 0.9vw, 0.95rem)",
                          }}>
                            {payment.studentName}
                            <span className="text-muted ms-2" style={{
                              fontSize: isArabic ? "clamp(0.6rem, 0.7vw, 0.75rem)" : "clamp(0.55rem, 0.65vw, 0.7rem)",
                            }}>
                              {payment.amount} MAD
                            </span>
                          </div>
                          <small className="text-muted" style={{
                            ...arabicFontStyle,
                            fontSize: isArabic ? "clamp(0.65rem, 0.8vw, 0.8rem)" : "clamp(0.6rem, 0.7vw, 0.75rem)",
                          }}>
                            {payment.className} • {isArabic ? getMonthName(payment.month) : getMonthName(payment.month)} {payment.year}
                            {payment.parentName && ` • ${payment.parentName}`}
                          </small>
                        </div>
                        <div className="d-flex gap-1 flex-shrink-0">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="p-1 px-2"
                            style={{
                              borderRadius: "8px",
                              fontSize: isArabic ? "clamp(0.55rem, 0.7vw, 0.7rem)" : "clamp(0.5rem, 0.6vw, 0.65rem)",
                              padding: isMobile ? "2px 6px" : "4px 8px",
                              minWidth: isMobile ? "28px" : "32px",
                              minHeight: isMobile ? "28px" : "32px",
                            }}
                            onClick={() => handleViewPayment(payment)}
                            title={isArabic ? "عرض" : "View"}
                          >
                            <FaEye size={isMobile ? 10 : 12} />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-1 d-flex flex-wrap gap-2">
                        <small className="text-muted" style={{
                          ...arabicFontStyle,
                          fontSize: isArabic ? "clamp(0.5rem, 0.6vw, 0.65rem)" : "clamp(0.45rem, 0.55vw, 0.6rem)",
                        }}>
                          <FaClockIcon className="me-1" size={isMobile ? 8 : 10} />
                          {formatTime(payment.createdAt)}
                        </small>
                        {payment.hasReceipt && (
                          <Badge bg="info" className="rounded-pill" style={{ fontSize: isArabic ? "clamp(0.45rem, 0.55vw, 0.6rem)" : "clamp(0.4rem, 0.5vw, 0.55rem)" }}>
                            <FaReceipt className="me-1" /> {isArabic ? "الإيصال مرفوع" : "Receipt Uploaded"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {pendingPayments.length > 3 && (
                    <div className="text-center p-2 border-top" style={{ borderColor: darkMode ? "#2d2d44" : "#e9ecef" }}>
                      <Button
                        variant="link"
                        className="text-decoration-none small"
                        onClick={() => setShowAllPayments(!showAllPayments)}
                        style={{
                          ...arabicFontStyle,
                          fontSize: isArabic ? "clamp(0.7rem, 0.9vw, 0.85rem)" : "clamp(0.65rem, 0.8vw, 0.8rem)",
                        }}
                      >
                        {showAllPayments
                          ? isArabic ? "عرض أقل" : "Show Less"
                          : `${isArabic ? "عرض المزيد" : "View More"} (${pendingPayments.length - 3} ${isArabic ? "المزيد" : "more"})`}
                        {showAllPayments ? <FaChevronUp className="ms-1" size={isMobile ? 8 : 10} /> : <FaChevronDown className="ms-1" size={isMobile ? 8 : 10} />}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ===== PENDING REGISTRATIONS ===== */}
      <Row className="g-3 g-md-4 mb-3 mb-md-4">
        <Col xs={12}>
          <Card className="modern-card" style={{
            background: darkMode ? "#1a1a2e" : "#ffffff",
            borderColor: darkMode ? "#2d2d44" : "#e9ecef",
          }}>
            <Card.Header className="modern-card-header d-flex flex-wrap justify-content-between align-items-center gap-2" style={{ borderColor: darkMode ? "#2d2d44" : "#e9ecef" }}>
              <h6 className="fw-bold mb-0" style={{
                ...arabicFontStyle,
                color: "#f39c12",
                fontSize: isArabic ? "clamp(0.9rem, 1.2vw, 1.1rem)" : "clamp(0.85rem, 1.1vw, 1.05rem)",
              }}>
                <FaUserPlus className="me-2" size={isMobile ? 14 : 16} />
                {isArabic ? "التسجيلات المعلقة" : "Pending Registrations"}
              </h6>
              <div className="d-flex align-items-center gap-1 gap-sm-2 flex-wrap">
                {pendingRegistrations.length > 0 && (
                  <Badge bg="warning" className="rounded-pill" style={{ fontSize: isMobile ? "0.6rem" : "0.75rem" }}>
                    {pendingRegistrations.length}
                  </Badge>
                )}
                <Button
                  variant="link"
                  className="p-0 text-decoration-none small"
                  onClick={() => navigate("/dashboard/admin/registrations")}
                  style={{
                    ...arabicFontStyle,
                    fontSize: isArabic ? "clamp(0.65rem, 0.8vw, 0.85rem)" : "clamp(0.6rem, 0.75vw, 0.8rem)",
                  }}
                >
                  {isArabic ? "عرض الكل" : "View All"}
                  <FaArrowRight className="ms-1" size={isMobile ? 8 : 10} />
                </Button>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              {pendingRegistrations.length === 0 ? (
                <div className="text-center py-3 py-md-4 text-muted">
                  <FaCheckCircle size={isMobile ? 24 : 32} className="mb-2 text-success" />
                  <div style={arabicFontStyle}>
                    {isArabic ? "لا توجد تسجيلات معلقة" : "No pending registrations"}
                  </div>
                </div>
              ) : (
                <>
                  {displayedRegistrations.map((reg) => (
                    <div key={reg.id} className="pending-item px-2 px-sm-3 py-2 border-bottom" style={{ borderColor: darkMode ? "#2d2d44" : "#e9ecef" }}>
                      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                        <div className="min-width-0 flex-grow-1">
                          <div className="fw-semibold" style={{
                            ...arabicFontStyle,
                            color: darkMode ? "#e9ecef" : "#212529",
                            fontSize: isArabic ? "clamp(0.85rem, 1vw, 1rem)" : "clamp(0.8rem, 0.9vw, 0.95rem)",
                          }}>
                            {reg.student_name}
                            <span className="text-muted ms-2" style={{
                              fontSize: isArabic ? "clamp(0.6rem, 0.7vw, 0.75rem)" : "clamp(0.55rem, 0.65vw, 0.7rem)",
                            }}>
                              #{reg.id?.slice(0, 8)}
                            </span>
                          </div>
                          <small className="text-muted" style={{
                            ...arabicFontStyle,
                            fontSize: isArabic ? "clamp(0.65rem, 0.8vw, 0.8rem)" : "clamp(0.6rem, 0.7vw, 0.75rem)",
                          }}>
                            {reg.parent_name} • {reg.level}
                          </small>
                        </div>
                        <div className="d-flex gap-1 flex-shrink-0">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="p-1 px-2"
                            style={{
                              borderRadius: "8px",
                              fontSize: isArabic ? "clamp(0.55rem, 0.7vw, 0.7rem)" : "clamp(0.5rem, 0.6vw, 0.65rem)",
                              padding: isMobile ? "2px 6px" : "4px 8px",
                              minWidth: isMobile ? "28px" : "32px",
                              minHeight: isMobile ? "28px" : "32px",
                            }}
                            onClick={() => handleViewRegistration(reg)}
                            title={isArabic ? "عرض" : "View"}
                          >
                            <FaEye size={isMobile ? 10 : 12} />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-1">
                        <small className="text-muted" style={{
                          ...arabicFontStyle,
                          fontSize: isArabic ? "clamp(0.5rem, 0.6vw, 0.65rem)" : "clamp(0.45rem, 0.55vw, 0.6rem)",
                        }}>
                          <FaClockIcon className="me-1" size={isMobile ? 8 : 10} />
                          {formatTime(reg.created_at)}
                        </small>
                      </div>
                    </div>
                  ))}
                  {pendingRegistrations.length > 3 && (
                    <div className="text-center p-2 border-top" style={{ borderColor: darkMode ? "#2d2d44" : "#e9ecef" }}>
                      <Button
                        variant="link"
                        className="text-decoration-none small"
                        onClick={() => setShowAllRegistrations(!showAllRegistrations)}
                        style={{
                          ...arabicFontStyle,
                          fontSize: isArabic ? "clamp(0.7rem, 0.9vw, 0.85rem)" : "clamp(0.65rem, 0.8vw, 0.8rem)",
                        }}
                      >
                        {showAllRegistrations
                          ? isArabic ? "عرض أقل" : "Show Less"
                          : `${isArabic ? "عرض المزيد" : "View More"} (${pendingRegistrations.length - 3} ${isArabic ? "المزيد" : "more"})`}
                        {showAllRegistrations ? <FaChevronUp className="ms-1" size={isMobile ? 8 : 10} /> : <FaChevronDown className="ms-1" size={isMobile ? 8 : 10} />}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ===== UPCOMING EVENTS ===== */}
      <Row className="g-3 g-md-4 mb-3 mb-md-4">
        <Col xs={12}>
          <Card className="modern-card" style={{
            background: darkMode ? "#1a1a2e" : "#ffffff",
            borderColor: darkMode ? "#2d2d44" : "#e9ecef",
          }}>
            <Card.Header className="modern-card-header d-flex flex-wrap justify-content-between align-items-center gap-2" style={{ borderColor: darkMode ? "#2d2d44" : "#e9ecef" }}>
              <h6 className="fw-bold mb-0" style={{
                ...arabicFontStyle,
                color: "#4a9eff",
                fontSize: isArabic ? "clamp(0.9rem, 1.2vw, 1.1rem)" : "clamp(0.85rem, 1.1vw, 1.05rem)",
              }}>
                <FaCalendarCheck className="me-2" size={isMobile ? 14 : 16} />
                {isArabic ? "الفعاليات القادمة" : "Upcoming Events"}
              </h6>
              <Button
                variant="link"
                className="p-0 text-decoration-none small"
                onClick={() => navigate("/dashboard/admin/announcements")}
                style={{
                  ...arabicFontStyle,
                  fontSize: isArabic ? "clamp(0.65rem, 0.8vw, 0.85rem)" : "clamp(0.6rem, 0.75vw, 0.8rem)",
                }}
              >
                {isArabic ? "إضافة" : "Add"}
                <FaPlus className="ms-1" size={isMobile ? 8 : 10} />
              </Button>
            </Card.Header>
            <Card.Body className="p-0">
              {upcomingEvents.length === 0 ? (
                <div className="text-center py-3 py-md-4 text-muted">
                  <FaRegCalendarAlt size={isMobile ? 24 : 32} className="mb-2 opacity-25" />
                  <div style={arabicFontStyle}>
                    {isArabic ? "لا توجد فعاليات قادمة" : "No upcoming events"}
                  </div>
                </div>
              ) : (
                upcomingEvents.map((event) => (
                  <div key={event.id} className="event-item px-2 px-sm-3 py-2 border-bottom d-flex align-items-center gap-2 gap-sm-3" style={{ borderColor: darkMode ? "#2d2d44" : "#e9ecef" }}>
                    <div className="event-date-box text-center flex-shrink-0">
                      <div className="event-day" style={{
                        color: event.color || "#4a9eff",
                        fontSize: isArabic ? "clamp(0.9rem, 1.1vw, 1.1rem)" : "clamp(0.85rem, 1vw, 1.05rem)",
                      }}>
                        {format(new Date(event.date), "dd")}
                      </div>
                      <small className="event-month text-muted" style={{
                        fontSize: isArabic ? "clamp(0.5rem, 0.6vw, 0.65rem)" : "clamp(0.45rem, 0.55vw, 0.6rem)",
                      }}>
                        {format(new Date(event.date), "MMM", { locale })}
                      </small>
                    </div>
                    <div className="flex-grow-1 min-width-0">
                      <div className="fw-semibold" style={{
                        ...arabicFontStyle,
                        color: darkMode ? "#e9ecef" : "#212529",
                        fontSize: isArabic ? "clamp(0.8rem, 0.95vw, 0.9rem)" : "clamp(0.75rem, 0.85vw, 0.85rem)",
                      }}>
                        {event.title}
                      </div>
                      <small className="text-muted" style={{
                        ...arabicFontStyle,
                        fontSize: isArabic ? "clamp(0.6rem, 0.7vw, 0.75rem)" : "clamp(0.55rem, 0.65vw, 0.7rem)",
                      }}>
                        <FaClockIcon className="me-1" size={isMobile ? 8 : 10} />
                        {event.time || "10:00 AM"}
                      </small>
                      <div>
                        <Badge bg="light" text="dark" className="mt-1" style={{
                          ...arabicFontStyle,
                          fontSize: isArabic ? "clamp(0.5rem, 0.6vw, 0.65rem)" : "clamp(0.45rem, 0.55vw, 0.6rem)",
                        }}>
                          {event.type || (isArabic ? "فعالية" : "Event")}
                        </Badge>
                      </div>
                    </div>
                    <Button variant="link" className="p-0 text-muted flex-shrink-0">
                      <FaChevronRight size={isMobile ? 10 : 12} />
                    </Button>
                  </div>
                ))
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ===== RECENT ACTIVITIES ===== */}
      <Row className="g-3 g-md-4">
        <Col xs={12}>
          <Card className="modern-card" style={{
            background: darkMode ? "#1a1a2e" : "#ffffff",
            borderColor: darkMode ? "#2d2d44" : "#e9ecef",
          }}>
            <Card.Header className="modern-card-header d-flex flex-wrap justify-content-between align-items-center gap-2" style={{ borderColor: darkMode ? "#2d2d44" : "#e9ecef" }}>
              <h6 className="fw-bold mb-0" style={{
                ...arabicFontStyle,
                color: "#4a9eff",
                fontSize: isArabic ? "clamp(0.9rem, 1.2vw, 1.1rem)" : "clamp(0.85rem, 1.1vw, 1.05rem)",
              }}>
                <FaClock className="me-2" size={isMobile ? 14 : 16} />
                {isArabic ? "النشاطات الأخيرة" : "Recent Activities"}
              </h6>
              {recentActivities.length > 0 && (
                <Button
                  variant="link"
                  className="p-0 text-decoration-none small"
                  onClick={() => setShowAllActivities(!showAllActivities)}
                  style={{
                    ...arabicFontStyle,
                    fontSize: isArabic ? "clamp(0.65rem, 0.8vw, 0.85rem)" : "clamp(0.6rem, 0.75vw, 0.8rem)",
                  }}
                >
                  {showAllActivities ? isArabic ? "عرض أقل" : "Show Less" : isArabic ? "عرض المزيد" : "View More"}
                  {showAllActivities ? <FaChevronUp className="ms-1" size={isMobile ? 8 : 10} /> : <FaChevronDown className="ms-1" size={isMobile ? 8 : 10} />}
                </Button>
              )}
            </Card.Header>
            <Card.Body className="p-0">
              {recentActivities.length === 0 ? (
                <div className="text-center py-3 py-md-4 text-muted">
                  <FaClock size={isMobile ? 24 : 32} className="mb-2 opacity-25" />
                  <div style={arabicFontStyle}>
                    {isArabic ? "لا توجد نشاطات حديثة" : "No recent activities"}
                  </div>
                  <small className="text-muted" style={arabicFontStyle}>
                    {isArabic ? "ستظهر النشاطات هنا عند حدوثها" : "Activities will appear here when they occur"}
                  </small>
                </div>
              ) : (
                displayedActivities.map((activity) => (
                  <div key={activity.id} className="activity-item px-2 px-sm-3 py-2 border-bottom d-flex align-items-center gap-2" style={{
                    borderColor: darkMode ? "#2d2d44" : "#e9ecef",
                    cursor: activity.link ? "pointer" : "default",
                  }} onClick={() => { if (activity.link) navigate(activity.link); }}>
                    <div className="activity-icon-wrapper flex-shrink-0" style={{
                      width: isMobile ? "28px" : "34px",
                      height: isMobile ? "28px" : "34px",
                      background: `${activity.color || "#4a9eff"}15`,
                      color: activity.color || "#4a9eff",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: isMobile ? "0.7rem" : "0.85rem",
                    }}>
                      {activity.icon || <FaInfoCircle />}
                    </div>
                    <div className="flex-grow-1 min-width-0">
                      <div style={{
                        ...arabicFontStyle,
                        color: darkMode ? "#e9ecef" : "#212529",
                        fontSize: isArabic ? "clamp(0.75rem, 0.9vw, 0.9rem)" : "clamp(0.7rem, 0.8vw, 0.85rem)",
                      }}>
                        <span className="fw-semibold">{activity.user}</span>
                        <span className="text-muted"> {activity.action}</span>
                      </div>
                      <small className="text-muted" style={{
                        ...arabicFontStyle,
                        fontSize: isArabic ? "clamp(0.55rem, 0.7vw, 0.7rem)" : "clamp(0.5rem, 0.6vw, 0.65rem)",
                      }}>
                        {activity.time || formatTime(activity.created_at)}
                      </small>
                    </div>
                    <Badge bg="light" text="dark" className="rounded-pill flex-shrink-0" style={{
                      ...arabicFontStyle,
                      fontSize: isArabic ? "clamp(0.45rem, 0.6vw, 0.6rem)" : "clamp(0.4rem, 0.5vw, 0.55rem)",
                      textTransform: "uppercase",
                      padding: isMobile ? "2px 6px" : "4px 8px",
                    }}>
                      {activity.type || (isArabic ? "نشاط" : "Activity")}
                    </Badge>
                  </div>
                ))
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ===== VIEW REGISTRATION MODAL ===== */}
      <Modal show={showViewModal !== null} onHide={() => setShowViewModal(null)} centered size={isMobile ? "md" : "lg"} className="modern-modal">
        <Modal.Header closeButton className="border-0" style={{ background: darkMode ? "#1a1a2e" : "white" }}>
          <Modal.Title style={{
            ...arabicFontStyle,
            color: darkMode ? "#e9ecef" : "#212529",
            fontSize: isArabic ? "clamp(1rem, 1.3vw, 1.2rem)" : "clamp(0.95rem, 1.2vw, 1.15rem)",
          }}>
            <FaUserPlus className="me-2 text-primary" size={isMobile ? 18 : 20} />
            {isArabic ? "تفاصيل التسجيل" : "Registration Details"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? "#0d1117" : "white" }}>
          {showViewModal && (
            <Row className="g-2 g-sm-3">
              <Col sm={6} xs={12}>
                <div className="mb-2">
                  <label className="text-muted small" style={{ ...arabicFontStyle, fontSize: isArabic ? "clamp(0.7rem, 0.9vw, 0.85rem)" : "clamp(0.65rem, 0.8vw, 0.8rem)" }}>
                    {isArabic ? "اسم التلميذ" : "Student Name"}
                  </label>
                  <p className="fw-semibold mb-0" style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529", fontSize: isArabic ? "clamp(0.85rem, 1vw, 1rem)" : "clamp(0.8rem, 0.9vw, 0.95rem)" }}>
                    {showViewModal.student_name}
                  </p>
                </div>
                <div className="mb-2">
                  <label className="text-muted small" style={{ ...arabicFontStyle, fontSize: isArabic ? "clamp(0.7rem, 0.9vw, 0.85rem)" : "clamp(0.65rem, 0.8vw, 0.8rem)" }}>
                    {isArabic ? "المستوى" : "Level"}
                  </label>
                  <p className="fw-semibold mb-0" style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529", fontSize: isArabic ? "clamp(0.85rem, 1vw, 1rem)" : "clamp(0.8rem, 0.9vw, 0.95rem)" }}>
                    {showViewModal.level || showViewModal.requestedClass || "N/A"}
                  </p>
                </div>
                <div className="mb-2">
                  <label className="text-muted small" style={{ ...arabicFontStyle, fontSize: isArabic ? "clamp(0.7rem, 0.9vw, 0.85rem)" : "clamp(0.65rem, 0.8vw, 0.8rem)" }}>
                    {isArabic ? "ولي الأمر" : "Parent"}
                  </label>
                  <p className="fw-semibold mb-0" style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529", fontSize: isArabic ? "clamp(0.85rem, 1vw, 1rem)" : "clamp(0.8rem, 0.9vw, 0.95rem)" }}>
                    {showViewModal.parent_name}
                  </p>
                </div>
                {showViewModal.dateOfBirth && (
                  <div className="mb-2">
                    <label className="text-muted small" style={{ ...arabicFontStyle, fontSize: isArabic ? "clamp(0.7rem, 0.9vw, 0.85rem)" : "clamp(0.65rem, 0.8vw, 0.8rem)" }}>
                      {isArabic ? "تاريخ الميلاد" : "Date of Birth"}
                    </label>
                    <p className="fw-semibold mb-0" style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529", fontSize: isArabic ? "clamp(0.85rem, 1vw, 1rem)" : "clamp(0.8rem, 0.9vw, 0.95rem)" }}>
                      {format(new Date(showViewModal.dateOfBirth), "PPP", { locale })}
                    </p>
                  </div>
                )}
              </Col>
              <Col sm={6} xs={12}>
                <div className="mb-2">
                  <label className="text-muted small" style={{ ...arabicFontStyle, fontSize: isArabic ? "clamp(0.7rem, 0.9vw, 0.85rem)" : "clamp(0.65rem, 0.8vw, 0.8rem)" }}>
                    <FaEnvelope className="me-1" size={isMobile ? 10 : 12} />
                    {isArabic ? "البريد الإلكتروني" : "Email"}
                  </label>
                  <p className="fw-semibold mb-0" style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529", fontSize: isArabic ? "clamp(0.85rem, 1vw, 1rem)" : "clamp(0.8rem, 0.9vw, 0.95rem)" }}>
                    {showViewModal.parent_email || (isArabic ? "غير متوفر" : "N/A")}
                  </p>
                </div>
                <div className="mb-2">
                  <label className="text-muted small" style={{ ...arabicFontStyle, fontSize: isArabic ? "clamp(0.7rem, 0.9vw, 0.85rem)" : "clamp(0.65rem, 0.8vw, 0.8rem)" }}>
                    <FaPhone className="me-1" size={isMobile ? 10 : 12} />
                    {isArabic ? "الهاتف" : "Phone"}
                  </label>
                  <p className="fw-semibold mb-0" style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529", fontSize: isArabic ? "clamp(0.85rem, 1vw, 1rem)" : "clamp(0.8rem, 0.9vw, 0.95rem)" }}>
                    {showViewModal.parent_phone || (isArabic ? "غير متوفر" : "N/A")}
                  </p>
                </div>
                <div className="mb-2">
                  <label className="text-muted small" style={{ ...arabicFontStyle, fontSize: isArabic ? "clamp(0.7rem, 0.9vw, 0.85rem)" : "clamp(0.65rem, 0.8vw, 0.8rem)" }}>
                    <FaClockIcon className="me-1" size={isMobile ? 10 : 12} />
                    {isArabic ? "تاريخ التسجيل" : "Registration Date"}
                  </label>
                  <p className="fw-semibold mb-0" style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529", fontSize: isArabic ? "clamp(0.85rem, 1vw, 1rem)" : "clamp(0.8rem, 0.9vw, 0.95rem)" }}>
                    {formatTime(showViewModal.created_at)}
                  </p>
                </div>
              </Col>
              {showViewModal.parent_address && (
                <Col xs={12}>
                  <div className="mb-2">
                    <label className="text-muted small" style={{ ...arabicFontStyle, fontSize: isArabic ? "clamp(0.7rem, 0.9vw, 0.85rem)" : "clamp(0.65rem, 0.8vw, 0.8rem)" }}>
                      <FaMapMarkerAlt className="me-1" size={isMobile ? 10 : 12} />
                      {isArabic ? "العنوان" : "Address"}
                    </label>
                    <p className="fw-semibold mb-0" style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529", fontSize: isArabic ? "clamp(0.85rem, 1vw, 1rem)" : "clamp(0.8rem, 0.9vw, 0.95rem)" }}>
                      {showViewModal.parent_address}
                    </p>
                  </div>
                </Col>
              )}
              <Col xs={12}>
                <div className="mt-2 mt-sm-3 d-flex gap-2 flex-wrap">
                  <Button variant="success" onClick={() => { setShowApproveConfirm(showViewModal.id); setShowViewModal(null); }} disabled={processingAction} style={{ ...arabicFontStyle, borderRadius: "12px", fontSize: isArabic ? "clamp(0.8rem, 1vw, 0.95rem)" : "clamp(0.75rem, 0.9vw, 0.9rem)" }}>
                    <FaCheckCircle className="me-2" size={isMobile ? 12 : 14} />
                    {isArabic ? "قبول" : "Approve"}
                  </Button>
                  <Button variant="danger" onClick={() => { setShowDeclineConfirm(showViewModal.id); setShowViewModal(null); }} disabled={processingAction} style={{ ...arabicFontStyle, borderRadius: "12px", fontSize: isArabic ? "clamp(0.8rem, 1vw, 0.95rem)" : "clamp(0.75rem, 0.9vw, 0.9rem)" }}>
                    <FaTimesCircle className="me-2" size={isMobile ? 12 : 14} />
                    {isArabic ? "رفض" : "Decline"}
                  </Button>
                </div>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0" style={{ background: darkMode ? "#1a1a2e" : "white" }}>
          <Button variant="secondary" onClick={() => setShowViewModal(null)} style={{ ...arabicFontStyle, borderRadius: "12px", fontSize: isArabic ? "clamp(0.8rem, 1vw, 0.95rem)" : "clamp(0.75rem, 0.9vw, 0.9rem)" }}>
            {isArabic ? "إغلاق" : "Close"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===== VIEW PAYMENT MODAL ===== */}
      <Modal show={showPaymentModal !== null} onHide={() => { setShowPaymentModal(null); if (paymentReceiptUrl) { URL.revokeObjectURL(paymentReceiptUrl); setPaymentReceiptUrl(null); } }} centered size="lg" className="modern-modal">
        <Modal.Header closeButton className="border-0" style={{ background: darkMode ? "#1a1a2e" : "white" }}>
          <Modal.Title style={{
            ...arabicFontStyle,
            color: darkMode ? "#e9ecef" : "#212529",
            fontSize: isArabic ? "clamp(1rem, 1.3vw, 1.2rem)" : "clamp(0.95rem, 1.2vw, 1.15rem)",
          }}>
            <FaMoneyBillWave className="me-2 text-success" size={isMobile ? 18 : 20} />
            {isArabic ? "تفاصيل الدفعة" : "Payment Details"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? "#0d1117" : "white" }}>
          {showPaymentModal && (
            <Row className="g-2 g-sm-3">
              <Col sm={6} xs={12}>
                <div className="mb-2">
                  <label className="text-muted small" style={{ ...arabicFontStyle, fontSize: isArabic ? "clamp(0.7rem, 0.9vw, 0.85rem)" : "clamp(0.65rem, 0.8vw, 0.8rem)" }}>
                    {isArabic ? "الطالب" : "Student"}
                  </label>
                  <p className="fw-semibold mb-0" style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529", fontSize: isArabic ? "clamp(0.85rem, 1vw, 1rem)" : "clamp(0.8rem, 0.9vw, 0.95rem)" }}>
                    {showPaymentModal.studentName}
                  </p>
                </div>
                <div className="mb-2">
                  <label className="text-muted small" style={{ ...arabicFontStyle, fontSize: isArabic ? "clamp(0.7rem, 0.9vw, 0.85rem)" : "clamp(0.65rem, 0.8vw, 0.8rem)" }}>
                    {isArabic ? "الفصل" : "Class"}
                  </label>
                  <p className="fw-semibold mb-0" style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529", fontSize: isArabic ? "clamp(0.85rem, 1vw, 1rem)" : "clamp(0.8rem, 0.9vw, 0.95rem)" }}>
                    {showPaymentModal.className}
                  </p>
                </div>
                <div className="mb-2">
                  <label className="text-muted small" style={{ ...arabicFontStyle, fontSize: isArabic ? "clamp(0.7rem, 0.9vw, 0.85rem)" : "clamp(0.65rem, 0.8vw, 0.8rem)" }}>
                    {isArabic ? "الشهر" : "Month"}
                  </label>
                  <p className="fw-semibold mb-0" style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529", fontSize: isArabic ? "clamp(0.85rem, 1vw, 1rem)" : "clamp(0.8rem, 0.9vw, 0.95rem)" }}>
                    {getMonthName(showPaymentModal.month)} {showPaymentModal.year}
                  </p>
                </div>
              </Col>
              <Col sm={6} xs={12}>
                <div className="mb-2">
                  <label className="text-muted small" style={{ ...arabicFontStyle, fontSize: isArabic ? "clamp(0.7rem, 0.9vw, 0.85rem)" : "clamp(0.65rem, 0.8vw, 0.8rem)" }}>
                    {isArabic ? "المبلغ" : "Amount"}
                  </label>
                  <p className="fw-bold mb-0" style={{ color: "#2ecc71", fontSize: isArabic ? "clamp(1rem, 1.2vw, 1.2rem)" : "clamp(0.95rem, 1.1vw, 1.15rem)" }}>
                    {showPaymentModal.amount} MAD
                  </p>
                </div>
                <div className="mb-2">
                  <label className="text-muted small" style={{ ...arabicFontStyle, fontSize: isArabic ? "clamp(0.7rem, 0.9vw, 0.85rem)" : "clamp(0.65rem, 0.8vw, 0.8rem)" }}>
                    {isArabic ? "ولي الأمر" : "Parent"}
                  </label>
                  <p className="fw-semibold mb-0" style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529", fontSize: isArabic ? "clamp(0.85rem, 1vw, 1rem)" : "clamp(0.8rem, 0.9vw, 0.95rem)" }}>
                    {showPaymentModal.parentName || "N/A"}
                  </p>
                </div>
                {showPaymentModal.note && (
                  <div className="mb-2">
                    <label className="text-muted small" style={{ ...arabicFontStyle, fontSize: isArabic ? "clamp(0.7rem, 0.9vw, 0.85rem)" : "clamp(0.65rem, 0.8vw, 0.8rem)" }}>
                      {isArabic ? "ملاحظات" : "Notes"}
                    </label>
                    <p className="mb-0" style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529", fontSize: isArabic ? "clamp(0.85rem, 1vw, 1rem)" : "clamp(0.8rem, 0.9vw, 0.95rem)" }}>
                      {showPaymentModal.note}
                    </p>
                  </div>
                )}
              </Col>
              {showPaymentModal.hasReceipt && paymentReceiptUrl && (
                <Col xs={12}>
                  <div className="mt-2">
                    <label className="text-muted small d-block mb-2" style={{ ...arabicFontStyle, fontSize: isArabic ? "clamp(0.7rem, 0.9vw, 0.85rem)" : "clamp(0.65rem, 0.8vw, 0.8rem)" }}>
                      <FaReceipt className="me-1" /> {isArabic ? "إيصال الدفع" : "Payment Receipt"}
                    </label>
                    <div style={{ 
                      background: darkMode ? "#1a1a2e" : "#f8f9fa", 
                      borderRadius: "8px", 
                      padding: "10px",
                      border: `1px solid ${darkMode ? "#2d2d44" : "#e9ecef"}`,
                      minHeight: "200px",
                      maxHeight: "400px",
                      overflow: "auto"
                    }}>
                      {showPaymentModal.receiptType && showPaymentModal.receiptType.toLowerCase().includes('image') ? (
                        <img src={`data:${showPaymentModal.receiptType};base64,${showPaymentModal.receiptData}`} alt="Receipt" style={{ maxWidth: '100%', maxHeight: '380px', display: 'block', margin: '0 auto' }} />
                      ) : (
                        <iframe
                          src={paymentReceiptUrl}
                          title="Receipt Preview"
                          style={{
                            width: '100%',
                            height: '380px',
                            border: 'none',
                            borderRadius: '4px',
                            background: 'white'
                          }}
                        />
                      )}
                    </div>
                  </div>
                </Col>
              )}
              <Col xs={12}>
                <div className="mt-2 mt-sm-3 d-flex gap-2 flex-wrap">
                  <Button 
                    variant="success" 
                    onClick={() => { 
                      setShowPaymentApproveConfirm(showPaymentModal.id); 
                      setShowPaymentModal(null); 
                    }} 
                    disabled={processingAction} 
                    style={{ ...arabicFontStyle, borderRadius: "12px", fontSize: isArabic ? "clamp(0.8rem, 1vw, 0.95rem)" : "clamp(0.75rem, 0.9vw, 0.9rem)" }}
                  >
                    <FaCheckCircle className="me-2" size={isMobile ? 12 : 14} />
                    {isArabic ? "اعتماد الدفعة" : "Approve Payment"}
                  </Button>
                  <Button 
                    variant="danger" 
                    onClick={() => { 
                      setShowPaymentDeclineConfirm(showPaymentModal.id); 
                      setShowPaymentModal(null); 
                    }} 
                    disabled={processingAction} 
                    style={{ ...arabicFontStyle, borderRadius: "12px", fontSize: isArabic ? "clamp(0.8rem, 1vw, 0.95rem)" : "clamp(0.75rem, 0.9vw, 0.9rem)" }}
                  >
                    <FaTimesCircle className="me-2" size={isMobile ? 12 : 14} />
                    {isArabic ? "رفض الدفعة" : "Decline Payment"}
                  </Button>
                </div>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0" style={{ background: darkMode ? "#1a1a2e" : "white" }}>
          <Button variant="secondary" onClick={() => { setShowPaymentModal(null); if (paymentReceiptUrl) { URL.revokeObjectURL(paymentReceiptUrl); setPaymentReceiptUrl(null); } }} style={{ ...arabicFontStyle, borderRadius: "12px", fontSize: isArabic ? "clamp(0.8rem, 1vw, 0.95rem)" : "clamp(0.75rem, 0.9vw, 0.9rem)" }}>
            {isArabic ? "إغلاق" : "Close"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===== APPROVE REGISTRATION CONFIRM ===== */}
      <Modal show={showApproveConfirm !== null} onHide={() => setShowApproveConfirm(null)} centered className="modern-modal">
        <Modal.Header closeButton className="border-0" style={{ background: darkMode ? "#1a1a2e" : "white" }}>
          <Modal.Title style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529", fontSize: isArabic ? "clamp(1rem, 1.3vw, 1.2rem)" : "clamp(0.95rem, 1.2vw, 1.15rem)" }}>
            <FaCheckCircle className="me-2 text-success" size={isMobile ? 18 : 20} />
            {isArabic ? "تأكيد القبول" : "Confirm Approval"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? "#0d1117" : "white" }}>
          <p style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529", fontSize: isArabic ? "clamp(0.9rem, 1.1vw, 1.05rem)" : "clamp(0.85rem, 1vw, 1rem)" }}>
            {isArabic
              ? "هل أنت متأكد من قبول هذا التسجيل؟ سيتم إنشاء حساب الطالب وإرسال بيانات الدخول إلى البريد الإلكتروني."
              : "Are you sure you want to approve this registration? A student account will be created and login credentials will be sent to the email."}
          </p>
          {showApproveConfirm && pendingRegistrations.find((r) => r.id === showApproveConfirm) && (
            <div className="p-2 p-sm-3 rounded" style={{ background: darkMode ? "#1a1a2e" : "#f8f9fa" }}>
              <p className="mb-1" style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529" }}>
                <strong>{isArabic ? "التلميذ:" : "Student:"}</strong> {pendingRegistrations.find((r) => r.id === showApproveConfirm)?.student_name}
              </p>
              <p className="mb-0" style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529" }}>
                <strong>{isArabic ? "ولي الأمر:" : "Parent:"}</strong> {pendingRegistrations.find((r) => r.id === showApproveConfirm)?.parent_name}
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0" style={{ background: darkMode ? "#1a1a2e" : "white" }}>
          <Button variant="secondary" onClick={() => setShowApproveConfirm(null)} disabled={processingAction} style={{ ...arabicFontStyle, borderRadius: "12px", fontSize: isArabic ? "clamp(0.8rem, 1vw, 0.95rem)" : "clamp(0.75rem, 0.9vw, 0.9rem)" }}>
            {isArabic ? "إلغاء" : "Cancel"}
          </Button>
          <Button variant="success" onClick={() => handleApproveRegistration(showApproveConfirm)} disabled={processingAction} style={{ ...arabicFontStyle, borderRadius: "12px", fontSize: isArabic ? "clamp(0.8rem, 1vw, 0.95rem)" : "clamp(0.75rem, 0.9vw, 0.9rem)" }}>
            {processingAction ? (
              <><FaSpinner className="spinning me-2" /> {isArabic ? "جاري..." : "Processing..."}</>
            ) : (
              <><FaCheckCircle className="me-2" /> {isArabic ? "تأكيد القبول" : "Confirm Approval"}</>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===== DECLINE REGISTRATION CONFIRM ===== */}
      <Modal show={showDeclineConfirm !== null} onHide={() => setShowDeclineConfirm(null)} centered className="modern-modal">
        <Modal.Header closeButton className="border-0" style={{ background: darkMode ? "#1a1a2e" : "white" }}>
          <Modal.Title style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529", fontSize: isArabic ? "clamp(1rem, 1.3vw, 1.2rem)" : "clamp(0.95rem, 1.2vw, 1.15rem)" }}>
            <FaExclamationTriangle className="me-2 text-danger" size={isMobile ? 18 : 20} />
            {isArabic ? "تأكيد الرفض" : "Confirm Decline"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? "#0d1117" : "white" }}>
          <p style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529", fontSize: isArabic ? "clamp(0.9rem, 1.1vw, 1.05rem)" : "clamp(0.85rem, 1vw, 1rem)" }}>
            {isArabic
              ? "هل أنت متأكد من رفض هذا التسجيل؟ هذا الإجراء لا يمكن التراجع عنه."
              : "Are you sure you want to decline this registration? This action cannot be undone."}
          </p>
          {showDeclineConfirm && pendingRegistrations.find((r) => r.id === showDeclineConfirm) && (
            <div className="p-2 p-sm-3 rounded" style={{ background: darkMode ? "#1a1a2e" : "#f8f9fa" }}>
              <p className="mb-1" style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529" }}>
                <strong>{isArabic ? "التلميذ:" : "Student:"}</strong> {pendingRegistrations.find((r) => r.id === showDeclineConfirm)?.student_name}
              </p>
              <p className="mb-0" style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529" }}>
                <strong>{isArabic ? "ولي الأمر:" : "Parent:"}</strong> {pendingRegistrations.find((r) => r.id === showDeclineConfirm)?.parent_name}
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0" style={{ background: darkMode ? "#1a1a2e" : "white" }}>
          <Button variant="secondary" onClick={() => setShowDeclineConfirm(null)} disabled={processingAction} style={{ ...arabicFontStyle, borderRadius: "12px", fontSize: isArabic ? "clamp(0.8rem, 1vw, 0.95rem)" : "clamp(0.75rem, 0.9vw, 0.9rem)" }}>
            {isArabic ? "إلغاء" : "Cancel"}
          </Button>
          <Button variant="danger" onClick={() => handleDeclineRegistration(showDeclineConfirm)} disabled={processingAction} style={{ ...arabicFontStyle, borderRadius: "12px", fontSize: isArabic ? "clamp(0.8rem, 1vw, 0.95rem)" : "clamp(0.75rem, 0.9vw, 0.9rem)" }}>
            {processingAction ? (
              <><FaSpinner className="spinning me-2" /> {isArabic ? "جاري..." : "Processing..."}</>
            ) : (
              <><FaTimesCircle className="me-2" /> {isArabic ? "تأكيد الرفض" : "Confirm Decline"}</>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===== APPROVE PAYMENT CONFIRM ===== */}
      <Modal show={showPaymentApproveConfirm !== null} onHide={() => setShowPaymentApproveConfirm(null)} centered className="modern-modal">
        <Modal.Header closeButton className="border-0" style={{ background: darkMode ? "#1a1a2e" : "white" }}>
          <Modal.Title style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529", fontSize: isArabic ? "clamp(1rem, 1.3vw, 1.2rem)" : "clamp(0.95rem, 1.2vw, 1.15rem)" }}>
            <FaCheckCircle className="me-2 text-success" size={isMobile ? 18 : 20} />
            {isArabic ? "تأكيد اعتماد الدفعة" : "Confirm Payment Approval"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? "#0d1117" : "white" }}>
          <p style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529", fontSize: isArabic ? "clamp(0.9rem, 1.1vw, 1.05rem)" : "clamp(0.85rem, 1vw, 1rem)" }}>
            {isArabic
              ? `هل أنت متأكد من اعتماد هذه الدفعة بمبلغ ${pendingPayments.find(p => p.id === showPaymentApproveConfirm)?.amount || 0} MAD للطالب ${pendingPayments.find(p => p.id === showPaymentApproveConfirm)?.studentName || ''}؟`
              : `Are you sure you want to approve this payment of ${pendingPayments.find(p => p.id === showPaymentApproveConfirm)?.amount || 0} MAD for student ${pendingPayments.find(p => p.id === showPaymentApproveConfirm)?.studentName || ''}?`}
          </p>
        </Modal.Body>
        <Modal.Footer className="border-0" style={{ background: darkMode ? "#1a1a2e" : "white" }}>
          <Button variant="secondary" onClick={() => setShowPaymentApproveConfirm(null)} disabled={processingAction} style={{ ...arabicFontStyle, borderRadius: "12px", fontSize: isArabic ? "clamp(0.8rem, 1vw, 0.95rem)" : "clamp(0.75rem, 0.9vw, 0.9rem)" }}>
            {isArabic ? "إلغاء" : "Cancel"}
          </Button>
          <Button variant="success" onClick={() => handleApprovePayment(showPaymentApproveConfirm)} disabled={processingAction} style={{ ...arabicFontStyle, borderRadius: "12px", fontSize: isArabic ? "clamp(0.8rem, 1vw, 0.95rem)" : "clamp(0.75rem, 0.9vw, 0.9rem)" }}>
            {processingAction ? (
              <><FaSpinner className="spinning me-2" /> {isArabic ? "جاري..." : "Processing..."}</>
            ) : (
              <><FaCheckCircle className="me-2" /> {isArabic ? "تأكيد الاعتماد" : "Confirm Approval"}</>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===== DECLINE PAYMENT CONFIRM ===== */}
      <Modal show={showPaymentDeclineConfirm !== null} onHide={() => setShowPaymentDeclineConfirm(null)} centered className="modern-modal">
        <Modal.Header closeButton className="border-0" style={{ background: darkMode ? "#1a1a2e" : "white" }}>
          <Modal.Title style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529", fontSize: isArabic ? "clamp(1rem, 1.3vw, 1.2rem)" : "clamp(0.95rem, 1.2vw, 1.15rem)" }}>
            <FaExclamationTriangle className="me-2 text-danger" size={isMobile ? 18 : 20} />
            {isArabic ? "تأكيد رفض الدفعة" : "Confirm Payment Decline"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? "#0d1117" : "white" }}>
          <p style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529", fontSize: isArabic ? "clamp(0.9rem, 1.1vw, 1.05rem)" : "clamp(0.85rem, 1vw, 1rem)" }}>
            {isArabic
              ? `هل أنت متأكد من رفض هذه الدفعة بمبلغ ${pendingPayments.find(p => p.id === showPaymentDeclineConfirm)?.amount || 0} MAD للطالب ${pendingPayments.find(p => p.id === showPaymentDeclineConfirm)?.studentName || ''}؟ سيتم إشعار ولي الأمر.`
              : `Are you sure you want to decline this payment of ${pendingPayments.find(p => p.id === showPaymentDeclineConfirm)?.amount || 0} MAD for student ${pendingPayments.find(p => p.id === showPaymentDeclineConfirm)?.studentName || ''}? The parent will be notified.`}
          </p>
        </Modal.Body>
        <Modal.Footer className="border-0" style={{ background: darkMode ? "#1a1a2e" : "white" }}>
          <Button variant="secondary" onClick={() => setShowPaymentDeclineConfirm(null)} disabled={processingAction} style={{ ...arabicFontStyle, borderRadius: "12px", fontSize: isArabic ? "clamp(0.8rem, 1vw, 0.95rem)" : "clamp(0.75rem, 0.9vw, 0.9rem)" }}>
            {isArabic ? "إلغاء" : "Cancel"}
          </Button>
          <Button variant="danger" onClick={() => handleDeclinePayment(showPaymentDeclineConfirm)} disabled={processingAction} style={{ ...arabicFontStyle, borderRadius: "12px", fontSize: isArabic ? "clamp(0.8rem, 1vw, 0.95rem)" : "clamp(0.75rem, 0.9vw, 0.9rem)" }}>
            {processingAction ? (
              <><FaSpinner className="spinning me-2" /> {isArabic ? "جاري..." : "Processing..."}</>
            ) : (
              <><FaTimesCircle className="me-2" /> {isArabic ? "تأكيد الرفض" : "Confirm Decline"}</>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .admin-dashboard { 
          padding: 0;
          max-width: 100vw;
          overflow-x: hidden;
        }

        .admin-dashboard * {
          box-sizing: border-box;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .min-width-0 { min-width: 0; }
        .flex-shrink-0 { flex-shrink: 0; }
        .flex-grow-1 { flex-grow: 1; }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        [dir="rtl"] .page-header { flex-direction: row-reverse; }

        /* ===== STAT CARDS ===== */
        .stat-card-enhanced {
          background: ${darkMode ? "#1a1a2e" : "#ffffff"};
          border: 1px solid ${darkMode ? "#2d2d44" : "#e9ecef"};
          border-radius: 16px;
          padding: 16px 18px;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          height: 100%;
          min-height: 80px;
          position: relative;
          overflow: hidden;
          cursor: pointer;
        }

        .stat-card-enhanced:hover {
          transform: translateY(-6px) scale(1.02);
          box-shadow: 0 12px 40px rgba(0,0,0,0.10);
        }

        .stat-card-gradient-bar {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          transition: height 0.4s ease;
        }

        .stat-card-enhanced:hover .stat-card-gradient-bar {
          height: 5px;
        }

        .total-card .stat-card-gradient-bar { background: linear-gradient(90deg, #4a9eff, #6ab0ff); }
        .active-card .stat-card-gradient-bar { background: linear-gradient(90deg, #2ecc71, #27ae60); }
        .children-card .stat-card-gradient-bar { background: linear-gradient(90deg, #f39c12, #e67e22); }
        .payment-card .stat-card-gradient-bar { background: linear-gradient(90deg, #2ecc71, #27ae60); }

        .stat-card-content {
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
          z-index: 1;
        }

        .stat-icon-wrapper {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          flex-shrink: 0;
          transition: transform 0.3s ease;
        }

        .stat-card-enhanced:hover .stat-icon-wrapper {
          transform: scale(1.1) rotate(-5deg);
        }

        .total-icon { background: rgba(74, 158, 255, 0.15); color: #4a9eff; }
        .active-icon { background: rgba(46, 204, 113, 0.15); color: #2ecc71; }
        .children-icon { background: rgba(243, 156, 18, 0.15); color: #f39c12; }
        .payment-icon { background: rgba(46, 204, 113, 0.15); color: #2ecc71; }

        .stat-info { flex: 1; min-width: 0; }
        .stat-number { display: block; font-size: 1.4rem; font-weight: 700; color: ${darkMode ? "#e9ecef" : "#1a1a2e"}; line-height: 1.2; letter-spacing: -0.5px; }
        .stat-label { font-size: 0.6rem; color: ${darkMode ? "#adb5bd" : "#6c757d"}; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; margin-top: 2px; }
        .stat-change { font-size: 0.5rem; color: ${darkMode ? "#adb5bd" : "#6c757d"}; margin-top: 2px; }

        .stat-card-shimmer {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
          transition: left 0.6s ease;
          pointer-events: none;
        }

        .stat-card-enhanced:hover .stat-card-shimmer {
          left: 100%;
        }

        /* ===== MODERN CARD ===== */
        .modern-card {
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .modern-card:hover {
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }

        .modern-card-header {
          background: transparent;
          border-bottom: 1px solid ${darkMode ? "#2d2d44" : "#e9ecef"};
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        /* ===== PENDING ITEMS ===== */
        .pending-item { transition: background 0.2s ease; }
        .pending-item:hover { background: rgba(0,0,0,0.02); }

        .event-item { transition: background 0.2s ease; }
        .event-item:hover { background: rgba(0,0,0,0.02); }

        .event-date-box {
          text-align: center;
          min-width: 32px;
          padding: 2px 6px;
          background: rgba(0,0,0,0.03);
          border-radius: 8px;
          flex-shrink: 0;
        }
        .event-day { font-weight: 700; line-height: 1.1; }
        .event-month { text-transform: uppercase; }

        .activity-item { transition: background 0.2s ease; }
        .activity-item:hover { background: rgba(0,0,0,0.02); }

        .activity-icon-wrapper {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
          flex-shrink: 0;
        }

        /* ===== MODERN MODAL ===== */
        .modern-modal .modal-content {
          border-radius: 20px !important;
          border: none !important;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
          overflow: hidden;
        }

        .modern-modal .modal-header { padding: 16px 20px 0; border-bottom: none; }
        .modern-modal .modal-body { padding: 12px 20px 20px; }
        .modern-modal .modal-footer { padding: 8px 20px 20px; border-top: none; }

        /* ===== RTL FIXES ===== */
        [dir="rtl"] .page-header { flex-direction: row-reverse; }
        [dir="rtl"] .modern-card-header { flex-direction: row-reverse; }
        [dir="rtl"] .modern-card-header .me-2 { margin-right: 0 !important; margin-left: 0.5rem !important; }
        [dir="rtl"] .modern-card-header .ms-1 { margin-left: 0 !important; margin-right: 0.25rem !important; }
        [dir="rtl"] .stat-card-content { flex-direction: row-reverse; }
        [dir="rtl"] .stat-icon-wrapper { margin-left: 0; margin-right: 12px; }
        [dir="rtl"] .pending-item .ms-2 { margin-left: 0 !important; margin-right: 0.5rem !important; }
        [dir="rtl"] .pending-item .me-1 { margin-right: 0 !important; margin-left: 0.25rem !important; }
        [dir="rtl"] .activity-item .me-1 { margin-right: 0 !important; margin-left: 0.25rem !important; }
        [dir="rtl"] .event-item .me-1 { margin-right: 0 !important; margin-left: 0.25rem !important; }
        [dir="rtl"] .modern-modal .modal-header .me-2 { margin-right: 0 !important; margin-left: 0.5rem !important; }
        [dir="rtl"] .modern-modal .modal-footer .me-2 { margin-right: 0 !important; margin-left: 0.5rem !important; }
        [dir="rtl"] .modern-modal .modal-body .me-1 { margin-right: 0 !important; margin-left: 0.25rem !important; }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 992px) {
          .stat-card-enhanced { min-height: 75px; padding: 14px 16px; }
          .stat-number { font-size: 1.3rem; }
          .stat-icon-wrapper { width: 36px; height: 36px; font-size: 0.95rem; }
        }

        @media (max-width: 768px) {
          .stat-card-enhanced { padding: 12px 14px; min-height: 70px; }
          .stat-number { font-size: 1.2rem; }
          .stat-icon-wrapper { width: 32px; height: 32px; font-size: 0.85rem; }
          .stat-label { font-size: 0.55rem; }
          .stat-change { font-size: 0.45rem; }
          .modern-card-header { padding: 10px 14px; flex-wrap: wrap; gap: 6px; }
          .event-date-box { min-width: 28px; }
          .event-day { font-size: 0.9rem !important; }
          .event-month { font-size: 0.5rem !important; }
        }

        @media (max-width: 576px) {
          .admin-dashboard .row > .col-6 { flex: 0 0 50%; max-width: 50%; padding: 6px; }
          .stat-card-enhanced { padding: 10px 12px; min-height: 60px; border-radius: 12px; }
          .stat-number { font-size: 1rem; }
          .stat-icon-wrapper { width: 28px; height: 28px; font-size: 0.75rem; border-radius: 10px; }
          .stat-label { font-size: 0.5rem; }
          .stat-change { font-size: 0.4rem; }
          .stat-card-content { gap: 8px; }
          
          .admin-dashboard .row > .col-xl-4,
          .admin-dashboard .row > .col-lg-6,
          .admin-dashboard .row > .col-md-6,
          .admin-dashboard .row > .col-md-12 { flex: 0 0 100%; max-width: 100%; }
          
          .modern-card .p-2.p-sm-3 { padding: 8px !important; }
          .pending-item .d-flex { flex-wrap: wrap; gap: 4px; }
          .event-item { flex-wrap: wrap; gap: 4px; }
          .activity-item { flex-wrap: wrap; gap: 4px; }
          .event-date-box { min-width: 24px; padding: 2px 4px; }
          .event-day { font-size: 0.8rem !important; }
          .event-month { font-size: 0.4rem !important; }
          
          .modern-modal .modal-header { padding: 12px 14px 0 !important; }
          .modern-modal .modal-body { padding: 10px 14px 14px !important; }
          .modern-modal .modal-footer { padding: 6px 14px 14px !important; }
          .modern-card-header h6 { font-size: 0.8rem !important; }
          .activity-icon-wrapper { width: 28px !important; height: 28px !important; font-size: 0.7rem !important; }
          .pending-item .fw-semibold { font-size: 0.8rem !important; }
          .pending-item .text-muted { font-size: 0.6rem !important; }
          
          .modern-modal .modal-body .row > .col-sm-6 { flex: 0 0 100%; max-width: 100%; }
        }

        @media (max-width: 400px) {
          .admin-dashboard .row > .col-6 { flex: 0 0 50%; max-width: 50%; padding: 4px; }
          .stat-card-enhanced { padding: 8px 10px; min-height: 50px; border-radius: 10px; }
          .stat-number { font-size: 0.85rem; }
          .stat-icon-wrapper { width: 24px; height: 24px; font-size: 0.65rem; }
          .stat-label { font-size: 0.45rem; }
          .stat-change { font-size: 0.35rem; }
          .stat-card-content { gap: 6px; }
          .modern-card-header { padding: 8px 10px; }
          .modern-card-header h6 { font-size: 0.7rem !important; }
          .pending-item .fw-semibold { font-size: 0.7rem !important; }
          .pending-item .text-muted { font-size: 0.5rem !important; }
          .event-date-box { min-width: 20px; padding: 1px 3px; }
          .event-day { font-size: 0.7rem !important; }
          .event-month { font-size: 0.35rem !important; }
          .page-header h4 { font-size: 1rem !important; }
          .page-header .d-flex .btn { font-size: 0.55rem !important; padding: 2px 6px !important; }
        }
      `}</style>
    </div>
  );
};

// ===== HELPER: getMonthName =====
const getMonthName = (month) => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthNamesAr = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'ماي', 'يونيو',
    'يوليوز', 'غشت', 'شتنبر', 'أكتوبر', 'نونبر', 'دجنبر'
  ];
  // This will be replaced by the actual language context
  return monthNames[month - 1] || month;
};

export default AdminDashboard;