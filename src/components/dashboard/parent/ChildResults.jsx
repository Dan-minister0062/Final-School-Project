// src/components/dashboard/parent/ChildResults.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Badge,
  Button,
  ProgressBar,
} from "react-bootstrap";
import {
  FaUserGraduate,
  FaStar,
  FaChartLine,
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaPrint,
  FaTrophy,
  FaBook,
  FaCalculator,
  FaLanguage,
  FaFlask,
  FaQuran,
  FaMicroscope,
  FaLaptop,
  FaPalette,
  FaDumbbell,
  FaGlobe,
  FaBrain,
  FaSpinner,
  FaSync,
  FaChild,
  FaSchool,
  FaBookOpen,
  FaChalkboardTeacher,
  FaUser,
  FaEnvelope,
  FaIdCard,
  FaGraduationCap,
  FaHourglassHalf,
  FaPaperPlane,
  FaRunning
} from "react-icons/fa";
import { useLanguage } from "../../../context/LanguageContext";
import { getTranslation } from "../../../utils/translations";
import { useAuth } from "../../../hooks/useAuth";
import { useNotification } from "../../../hooks/useNotification";
import api from "../../../services/api";

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

// ===== SUBJECT ICON MAPPING =====
const getSubjectIcon = (subjectName) => {
  const name = subjectName.toLowerCase();
  if (name.includes("quran")) return <FaQuran />;
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

const ChildResults = () => {
  const { language, isArabic } = useLanguage();
  const t = (key) => getTranslation(key, language);
  const { user } = useAuth();
  const { notify } = useNotification();

  const [selectedChild, setSelectedChild] = useState(null);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [allStudents, setAllStudents] = useState([]);

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
        icon: <FaPaperPlane />,
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

  // ===== GET PERFORMANCE COLOR =====
  const getPerformanceColor = (score, totalMarks) => {
    if (!score || !totalMarks) return "#6c757d";
    const percentage = (score / totalMarks) * 100;
    if (percentage >= 90) return "#2ecc71";
    if (percentage >= 75) return "#f39c12";
    if (percentage >= 60) return "#fd7e14";
    return "#e74c3c";
  };

  // ===== LOAD REAL DATA FROM LOCALSTORAGE =====
  const loadChildrenData = () => {
    try {
      setLoading(true);

      console.log("📚 Loading children results data...");

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

      console.log("📚 All students found:", allStudents.length);
      setAllStudents(allStudents);

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

      console.log("👨‍👩‍👦 Children found for parent:", parentChildren.length);

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

          // Get all assessments for this student
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

          // Get submissions
          const allSubmissions = JSON.parse(
            localStorage.getItem("school_submissions") || "[]",
          );
          const studentSubmissions = allSubmissions.filter(
            (s) => s.studentId === child.id,
          );

          // Build subjects with grades from assessments
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

            const isGraded = !!grade && grade.score > 0;
            const score = isGraded ? grade.score : 0;
            const totalMarks = assessment?.totalMarks || 100;
            const gradeLetter = isGraded
              ? getGradeLetter(score, totalMarks)
              : "N/A";
            const status = isGraded
              ? "graded"
              : submission
                ? "submitted"
                : "pending";

            return {
              name: sub.name,
              nameAr: sub.nameAr || sub.name,
              score: score,
              totalMarks: totalMarks,
              grade: gradeLetter,
              isGraded: isGraded,
              hasSubmitted: !!submission,
              assessmentId: assessment?.id || null,
              status: status,
              percentage: isGraded ? Math.round((score / totalMarks) * 100) : 0,
            };
          });

          // Calculate average from graded subjects only
          const gradedSubjects = subjectsWithGrades.filter((s) => s.isGraded);
          const average =
            gradedSubjects.length > 0
              ? Math.round(
                  gradedSubjects.reduce((sum, s) => sum + s.percentage, 0) /
                    gradedSubjects.length,
                )
              : 0;

          // Calculate attendance
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

          // Count achievements (graded subjects with high scores)
          const achievements = gradedSubjects
            .filter((s) => s.percentage >= 85)
            .map((s) =>
              isArabic ? `${s.nameAr} (${s.grade})` : `${s.name} (${s.grade})`,
            );

          return {
            id: child.id,
            name: child.name || child.firstName || "Student",
            nameEn: child.name || child.firstName || "Student",
            class: classInfo?.name || child.className || child.class || "N/A",
            classAr: classInfo?.name || child.className || child.class || "N/A",
            level:
              classInfo?.level ||
              child.level ||
              child.educationLevel ||
              "primary",
            academicYear: "2025-2026",
            academicYearAr: "٢٠٢٥-٢٠٢٦",
            average: average,
            rank: 1,
            attendance: attendanceRate,
            subjects: subjectsWithGrades,
            achievements:
              achievements.length > 0
                ? achievements
                : [isArabic ? "لا توجد إنجازات" : "No achievements yet"],
            teacher:
              child.teacherName ||
              classInfo?.teacher ||
              (isArabic ? "المعلم المكلف" : "Assigned Teacher"),
            gradedCount: gradedSubjects.length,
            totalSubjects: defaultSubjects.length,
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
      console.error("❌ Error loading children results:", error);
      setChildren([]);
      setSelectedChild(null);
    } finally {
      setLoading(false);
    }
  };

  // ===== INITIAL LOAD & EVENT LISTENERS =====
  useEffect(() => {
    loadChildrenData();

    // Listen for storage changes
    const handleStorageChange = (e) => {
      if (
        e.key === "school_assessments" ||
        e.key === "school_submissions" ||
        e.key === "school_students" ||
        e.key === "school_classes" ||
        e.key === "school_attendance"
      ) {
        console.log("🔄 Storage changed, refreshing child results");
        loadChildrenData();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // Listen for assessment changes
    const handleAssessmentChanged = () => {
      console.log("📝 Assessment changed, refreshing child results");
      loadChildrenData();
    };
    window.addEventListener("assessmentChanged", handleAssessmentChanged);

    // Listen for submission changes
    const handleSubmissionChanged = () => {
      console.log("📤 Submission changed, refreshing child results");
      loadChildrenData();
    };
    window.addEventListener("submissionChanged", handleSubmissionChanged);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("assessmentChanged", handleAssessmentChanged);
      window.removeEventListener("submissionChanged", handleSubmissionChanged);
    };
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

  // ===== PRINT FUNCTION =====
  const handlePrint = () => {
    if (!selectedChild) return;

    setPrinting(true);
    setTimeout(() => {
      try {
        const printWindow = window.open("", "_blank", "width=800,height=600");
        if (!printWindow) {
          if (notify) {
            notify(
              isArabic
                ? "الرجاء السماح للنوافذ المنبثقة"
                : "Please allow popups",
              "warning",
            );
          }
          setPrinting(false);
          return;
        }

        const studentName = isArabic
          ? selectedChild.name
          : selectedChild.nameEn;
        const className = isArabic
          ? selectedChild.classAr
          : selectedChild.class;
        const academicYear = isArabic
          ? selectedChild.academicYearAr
          : selectedChild.academicYear;
        const average = formatNumber(selectedChild.average);
        const attendance = formatNumber(selectedChild.attendance);

        let subjectsHtml = "";
        selectedChild.subjects.forEach((subject) => {
          const subjectName = isArabic ? subject.nameAr : subject.name;
          const gradeColor = getGradeColor(subject.score, subject.totalMarks);
          const scoreColor = getPerformanceColor(
            subject.score,
            subject.totalMarks,
          );
          const statusInfo = getStatusBadge(subject.status);

          subjectsHtml += `
            <tr>
              <td>${subjectName}</td>
              <td style="text-align:center;font-weight:bold;color:${scoreColor}">${subject.isGraded ? formatNumber(subject.percentage) + "%" : "N/A"}</td>
              <td style="text-align:center">
                ${subject.isGraded ? `<span style="display:inline-block;padding:2px 10px;border-radius:50px;background:${gradeColor};color:white;font-size:0.7rem;">${subject.grade}</span>` : '<span style="color:#6c757d;">N/A</span>'}
              </td>
              <td style="text-align:center">
                <span style="display:inline-block;padding:2px 10px;border-radius:50px;background:${subject.isGraded ? "#28a745" : "#6c757d"};color:white;font-size:0.7rem;">${subject.isGraded ? "مصحح" : "قيد الانتظار"}</span>
              </td>
            </tr>
          `;
        });

        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${studentName} - ${isArabic ? "النتائج" : "Results"}</title>
              <style>
                body { padding: 40px; font-family: Arial, sans-serif; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1a5f7a; padding-bottom: 20px; }
                .header h2 { color: #1a5f7a; margin-bottom: 5px; font-size: 24px; }
                .header p { color: #6c757d; margin: 0; }
                .student-info { display: flex; justify-content: space-around; margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; }
                .student-info-item { text-align: center; }
                .student-info-item .label { font-size: 0.7rem; color: #6c757d; text-transform: uppercase; }
                .student-info-item .value { font-size: 1.1rem; font-weight: bold; color: #2d3436; }
                .table-container { margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; }
                table th { background: #1a5f7a; color: white; padding: 10px; text-align: left; font-weight: 600; }
                table td { padding: 8px 10px; border-bottom: 1px solid #dee2e6; }
                table tr:nth-child(even) { background: #f8f9fa; }
                .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 0.8rem; border-top: 1px solid #dee2e6; padding-top: 15px; }
                @media print {
                  body { padding: 20px; }
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h2>${isArabic ? "نتائج الطالب" : "Student Results"}</h2>
                <p>${studentName} | ${className} | ${academicYear}</p>
              </div>
              
              <div class="student-info">
                <div class="student-info-item">
                  <div class="label">${isArabic ? "المعدل" : "Average"}</div>
                  <div class="value" style="color:${selectedChild.average >= 90 ? "#2ecc71" : selectedChild.average >= 75 ? "#f39c12" : "#e74c3c"}">${average}%</div>
                </div>
                <div class="student-info-item">
                  <div class="label">${isArabic ? "الحضور" : "Attendance"}</div>
                  <div class="value">${attendance}%</div>
                </div>
                <div class="student-info-item">
                  <div class="label">${isArabic ? "المواد المصححة" : "Graded Subjects"}</div>
                  <div class="value">${formatNumber(selectedChild.gradedCount)} / ${formatNumber(selectedChild.totalSubjects)}</div>
                </div>
              </div>
              
              <div class="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>${isArabic ? "المادة" : "Subject"}</th>
                      <th style="text-align:center">${isArabic ? "الدرجة" : "Score"}</th>
                      <th style="text-align:center">${isArabic ? "التقدير" : "Grade"}</th>
                      <th style="text-align:center">${isArabic ? "الحالة" : "Status"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${subjectsHtml}
                  </tbody>
                </table>
              </div>
              
              <div class="footer">
                ${isArabic ? "تم الطباعة من مدرسة الفتح" : "Printed from Madrassat Al Fath"} | ${new Date().toLocaleDateString()}
              </div>
            </body>
          </html>
        `);

        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);

        if (notify) {
          notify(
            isArabic ? "تم فتح نافذة الطباعة" : "Print dialog opened",
            "info",
          );
        }
      } catch (error) {
        console.error("Error printing:", error);
        if (notify) {
          notify(
            isArabic ? "حدث خطأ أثناء الطباعة" : "Error printing",
            "error",
          );
        }
      }
      setPrinting(false);
    }, 500);
  };

  // ===== LOADING STATE =====
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
          {isArabic ? "جاري تحميل النتائج..." : "Loading results..."}
        </p>
      </div>
    );
  }

  // ===== NO CHILDREN =====
  if (children.length === 0) {
    return (
      <div className="text-center py-5" dir={isArabic ? "rtl" : "ltr"}>
        <div className="display-1 text-muted opacity-25 mb-3">📊</div>
        <h4 style={arabicFontStyle}>
          {isArabic ? "لا توجد نتائج" : "No results found"}
        </h4>
        <p className="text-muted" style={arabicFontStyle}>
          {isArabic
            ? "لا توجد نتائج لأطفالك حتى الآن"
            : "No results found for your children yet"}
        </p>
        <Button
          variant="primary"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          style={{ borderRadius: "50px", ...arabicFontStyle }}
        >
          <FaSync className={refreshing ? "spinning" : "me-2"} />
          {isArabic ? "تحديث" : "Refresh"}
        </Button>
      </div>
    );
  }

  if (!selectedChild) {
    return (
      <div className="text-center py-5" dir={isArabic ? "rtl" : "ltr"}>
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
    <div className="child-results-page" dir={isArabic ? "rtl" : "ltr"}>
      {/* ===== HEADER ===== */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <h4
            className="fw-bold mb-1"
            style={{
              ...arabicFontStyle,
              color: "#1a5f7a",
              fontSize: "clamp(1.1rem, 2.1vw, 2rem)", // Added this line
            }}
          >
            <FaUserGraduate className="me-2" />
            {t("My Children's Results")}
          </h4>
          <p className="text-muted mb-0" style={arabicFontStyle}>
            {isArabic
              ? "تابع الأداء الأكاديمي لأطفالك"
              : "Track your children's academic performance"}
          </p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            style={{ borderRadius: "50px", ...arabicFontStyle }}
          >
            <FaSync className={refreshing ? "spinning" : "me-1"} />
            {isArabic ? "تحديث" : "Refresh"}
          </Button>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={handlePrint}
            disabled={printing}
            style={{ borderRadius: "50px", ...arabicFontStyle }}
          >
            {printing ? (
              <FaSpinner className="spinning me-1" />
            ) : (
              <FaPrint className="me-1" />
            )}
            {printing
              ? isArabic
                ? "جاري الطباعة..."
                : "Printing..."
              : isArabic
                ? "طباعة"
                : "Print"}
          </Button>
        </div>
      </div>

      {/* ===== CHILD SELECTOR ===== */}
      {children.length > 1 && (
        <div className="mb-4">
          <div className="d-flex flex-wrap gap-2">
            {children.map((child) => (
              <Button
                key={child.id}
                variant={
                  selectedChild?.id === child.id ? "primary" : "outline-primary"
                }
                size="sm"
                onClick={() => setSelectedChild(child)}
                className="child-selector-btn"
                style={{
                  ...arabicFontStyle,
                  borderRadius: "50px",
                  padding: "6px 20px",
                  transition: "all 0.3s ease",
                  boxShadow:
                    selectedChild?.id === child.id
                      ? "0 4px 15px rgba(26, 95, 122, 0.3)"
                      : "none",
                }}
              >
                <FaUserGraduate className="me-2" size={14} />
                {isArabic ? child.name : child.nameEn}
                {child.gradedCount > 0 && (
                  <Badge
                    bg="success"
                    className="ms-2 rounded-pill"
                    style={{ fontSize: "0.5rem" }}
                  >
                    {formatNumber(child.gradedCount)}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>
      )}

      {selectedChild && (
        <>
          {/* ===== CHILD PROFILE CARD ===== */}
          <Card
            className="shadow-sm border-0 mb-4 child-profile-card"
            style={{
              background: darkMode ? "#1a1a2e" : "#ffffff",
              border: `1px solid ${darkMode ? "#2d2d44" : "#e9ecef"}`,
              borderRadius: "16px",
              overflow: "hidden",
              transition: "all 0.3s ease",
            }}
          >
            <div
              className="card-top-bar"
              style={{
                height: "4px",
                background: "linear-gradient(90deg, #1a5f7a, #2a7f9a, #d4a373)",
              }}
            ></div>
            <Card.Body className="p-3 p-md-4">
              <div className="d-flex flex-wrap align-items-center gap-3 gap-md-4">
                <div
                  className="child-avatar"
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
                  {(isArabic
                    ? selectedChild.name
                    : selectedChild.nameEn
                  ).charAt(0)}
                </div>
                <div className="flex-grow-1 min-width-0">
                  <h5
                    className="fw-bold mb-1"
                    style={{
                      ...arabicFontStyle,
                      color: darkMode ? "#e9ecef" : "#212529",
                      fontSize: "clamp(1rem, 1.2vw, 1.2rem)",
                    }}
                  >
                    {isArabic ? selectedChild.name : selectedChild.nameEn}
                  </h5>
                  <div className="d-flex flex-wrap gap-2">
                    <span
                      className="child-info-tag"
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
                      <FaBook className="me-1" style={{ fontSize: "0.7rem" }} />
                      {isArabic ? selectedChild.classAr : selectedChild.class}
                    </span>
                    <span
                      className="child-info-tag"
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
                      <FaCalendarAlt
                        className="me-1"
                        style={{ fontSize: "0.7rem" }}
                      />
                      {isArabic
                        ? selectedChild.academicYearAr
                        : selectedChild.academicYear}
                    </span>
                    <span
                      className="child-info-tag"
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
                      />
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
                        color:
                          selectedChild.average >= 90
                            ? "#2ecc71"
                            : selectedChild.average >= 75
                              ? "#f39c12"
                              : "#e74c3c",
                        fontSize: "clamp(0.85rem, 1.1vw, 1.1rem)",
                        fontWeight: "700",
                      }}
                    >
                      {formatNumber(selectedChild.average)}%
                    </div>
                    <div
                      className="mini-stat-label"
                      style={{
                        fontSize: "clamp(0.5rem, 0.6vw, 0.65rem)",
                        color: darkMode ? "#adb5bd" : "#6c757d",
                      }}
                    >
                      {isArabic ? "المعدل" : "Average"}
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
                        color: "#2ecc71",
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
                      {isArabic ? "الحضور" : "Attendance"}
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
                      {formatNumber(selectedChild.gradedCount)}/
                      {formatNumber(selectedChild.totalSubjects)}
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
            </Card.Body>
          </Card>

          {/* ===== SUBJECTS TABLE ===== */}
          <Card
            className="shadow-sm border-0 modern-card"
            style={{
              background: darkMode ? "#1a1a2e" : "#ffffff",
              border: `1px solid ${darkMode ? "#2d2d44" : "#e9ecef"}`,
              borderRadius: "16px",
              overflow: "hidden",
            }}
          >
            <div
              className="card-top-bar"
              style={{
                height: "4px",
                background: "linear-gradient(90deg, #1a5f7a, #2a7f9a)",
              }}
            ></div>
            <Card.Header
              className="bg-transparent border-0 p-3 p-md-4"
              style={{
                borderBottom: `1px solid ${darkMode ? "#2d2d44" : "#e9ecef"}`,
              }}
            >
              <div className="d-flex justify-content-between align-items-center">
                <h6
                  className="fw-bold mb-0"
                  style={{
                    ...arabicFontStyle,
                    color: darkMode ? "#e9ecef" : "#212529",
                    fontSize: "clamp(0.85rem, 1vw, 1rem)",
                  }}
                >
                  <FaChartLine className="me-2 text-primary" />
                  {isArabic ? "المواد الدراسية" : "Subjects"}
                </h6>
                <Badge
                  bg="light"
                  className="text-dark"
                  style={{ ...arabicFontStyle, fontSize: "0.7rem" }}
                >
                  {formatNumber(selectedChild.gradedCount)}{" "}
                  {isArabic ? "مصحح" : "Graded"} /{" "}
                  {formatNumber(selectedChild.totalSubjects)}{" "}
                  {isArabic ? "مادة" : "Subjects"}
                </Badge>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead>
                    <tr>
                      <th
                        style={{
                          ...arabicFontStyle,
                          fontSize: "clamp(0.6rem, 0.7vw, 0.7rem)",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                          color: darkMode ? "#adb5bd" : "#6c757d",
                          borderBottom: `2px solid ${darkMode ? "#2d2d44" : "#e9ecef"}`,
                          padding: "8px 16px",
                        }}
                      >
                        {isArabic ? "المادة" : "Subject"}
                      </th>
                      <th
                        className="text-center"
                        style={{
                          ...arabicFontStyle,
                          fontSize: "clamp(0.6rem, 0.7vw, 0.7rem)",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                          color: darkMode ? "#adb5bd" : "#6c757d",
                          borderBottom: `2px solid ${darkMode ? "#2d2d44" : "#e9ecef"}`,
                          padding: "8px 16px",
                        }}
                      >
                        {isArabic ? "الدرجة" : "Score"}
                      </th>
                      <th
                        className="text-center"
                        style={{
                          ...arabicFontStyle,
                          fontSize: "clamp(0.6rem, 0.7vw, 0.7rem)",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                          color: darkMode ? "#adb5bd" : "#6c757d",
                          borderBottom: `2px solid ${darkMode ? "#2d2d44" : "#e9ecef"}`,
                          padding: "8px 16px",
                        }}
                      >
                        {isArabic ? "التقدير" : "Grade"}
                      </th>
                      <th
                        className="text-center"
                        style={{
                          ...arabicFontStyle,
                          fontSize: "clamp(0.6rem, 0.7vw, 0.7rem)",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                          color: darkMode ? "#adb5bd" : "#6c757d",
                          borderBottom: `2px solid ${darkMode ? "#2d2d44" : "#e9ecef"}`,
                          padding: "8px 16px",
                        }}
                      >
                        {isArabic ? "الحالة" : "Status"}
                      </th>
                      <th
                        className="text-end"
                        style={{
                          ...arabicFontStyle,
                          fontSize: "clamp(0.6rem, 0.7vw, 0.7rem)",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                          color: darkMode ? "#adb5bd" : "#6c757d",
                          borderBottom: `2px solid ${darkMode ? "#2d2d44" : "#e9ecef"}`,
                          padding: "8px 16px",
                        }}
                      >
                        {isArabic ? "الأداء" : "Performance"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedChild.subjects.map((subject, index) => {
                      const subjectName = isArabic
                        ? subject.nameAr
                        : subject.name;
                      const statusInfo = getStatusBadge(subject.status);
                      const gradeColor = getGradeColor(
                        subject.score,
                        subject.totalMarks,
                      );
                      const scoreColor = getPerformanceColor(
                        subject.score,
                        subject.totalMarks,
                      );

                      return (
                        <tr key={index}>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <span
                                style={{
                                  color: scoreColor,
                                  fontSize: "clamp(0.8rem, 0.9vw, 0.95rem)",
                                }}
                              >
                                {getSubjectIcon(subject.name)}
                              </span>
                              <span
                                className="fw-semibold"
                                style={{
                                  ...arabicFontStyle,
                                  color: darkMode ? "#e9ecef" : "#212529",
                                  fontSize: "clamp(0.8rem, 0.9vw, 0.95rem)",
                                }}
                              >
                                {subjectName}
                              </span>
                            </div>
                          </td>
                          <td className="text-center">
                            {subject.isGraded ? (
                              <span
                                className="fw-bold"
                                style={{
                                  color: scoreColor,
                                  fontSize: "clamp(0.9rem, 1vw, 1.05rem)",
                                }}
                              >
                                {formatNumber(subject.percentage)}%
                              </span>
                            ) : (
                              <span
                                className="text-muted"
                                style={{
                                  fontSize: "clamp(0.7rem, 0.8vw, 0.85rem)",
                                }}
                              >
                                {isArabic ? "بانتظار" : "Pending"}
                              </span>
                            )}
                          </td>
                          <td className="text-center">
                            {subject.isGraded ? (
                              <Badge
                                style={{
                                  background: gradeColor,
                                  color: "white",
                                  padding: "4px 12px",
                                  borderRadius: "50px",
                                  fontSize: "clamp(0.65rem, 0.75vw, 0.75rem)",
                                }}
                              >
                                {subject.grade}
                              </Badge>
                            ) : (
                              <span
                                className="text-muted"
                                style={{
                                  fontSize: "clamp(0.65rem, 0.7vw, 0.75rem)",
                                }}
                              >
                                -
                              </span>
                            )}
                          </td>
                          <td className="text-center">
                            <Badge
                              bg={
                                subject.isGraded
                                  ? "success"
                                  : subject.hasSubmitted
                                    ? "info"
                                    : "secondary"
                              }
                              className="px-2 py-1 rounded-pill"
                              style={{
                                fontSize: "clamp(0.5rem, 0.6vw, 0.6rem)",
                              }}
                            >
                              {subject.isGraded ? (
                                <>
                                  <FaCheckCircle className="me-1" />{" "}
                                  {isArabic ? "مصحح" : "Graded"}
                                </>
                              ) : subject.hasSubmitted ? (
                                <>
                                  <FaPaperPlane className="me-1" />{" "}
                                  {isArabic ? "مرسل" : "Submitted"}
                                </>
                              ) : (
                                <>
                                  <FaClock className="me-1" />{" "}
                                  {isArabic ? "قيد الانتظار" : "Pending"}
                                </>
                              )}
                            </Badge>
                          </td>
                          <td className="text-end">
                            {subject.isGraded ? (
                              <ProgressBar
                                now={subject.percentage}
                                variant={
                                  subject.percentage >= 90
                                    ? "success"
                                    : subject.percentage >= 75
                                      ? "warning"
                                      : "danger"
                                }
                                style={{
                                  height: "6px",
                                  borderRadius: "3px",
                                  maxWidth: "120px",
                                  marginLeft: "auto",
                                  background: darkMode ? "#2d2d44" : "#e9ecef",
                                }}
                              />
                            ) : (
                              <span
                                className="text-muted"
                                style={{
                                  fontSize: "clamp(0.6rem, 0.7vw, 0.75rem)",
                                }}
                              >
                                {isArabic ? "لم يصحح بعد" : "Not graded yet"}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>

          {/* ===== ACHIEVEMENTS ===== */}
          {selectedChild.achievements &&
            selectedChild.achievements.length > 0 &&
            selectedChild.achievements[0] !==
              (isArabic ? "لا توجد إنجازات" : "No achievements yet") && (
              <Card
                className="shadow-sm border-0 mt-4 modern-card"
                style={{
                  background: darkMode ? "#1a1a2e" : "#ffffff",
                  border: `1px solid ${darkMode ? "#2d2d44" : "#e9ecef"}`,
                  borderRadius: "16px",
                  overflow: "hidden",
                }}
              >
                <div
                  className="card-top-bar"
                  style={{
                    height: "4px",
                    background: "linear-gradient(90deg, #f2994a, #f2c94c)",
                  }}
                ></div>
                <Card.Header
                  className="bg-transparent border-0 p-3 p-md-4"
                  style={{
                    borderBottom: `1px solid ${darkMode ? "#2d2d44" : "#e9ecef"}`,
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
                    <FaTrophy className="me-2 text-warning" />
                    {isArabic ? "الإنجازات" : "Achievements"}
                  </h6>
                </Card.Header>
                <Card.Body className="p-3 p-md-4">
                  <div className="d-flex flex-wrap gap-2">
                    {selectedChild.achievements.map((achievement, index) => (
                      <Badge
                        key={index}
                        bg="warning"
                        className="px-3 py-2"
                        style={{
                          fontSize: "clamp(0.7rem, 0.8vw, 0.85rem)",
                          borderRadius: "50px",
                          background:
                            "linear-gradient(135deg, #f2994a, #f2c94c)",
                          color: "#2d3436",
                        }}
                      >
                        <FaStar className="me-1" style={{ color: "#2d3436" }} />
                        {achievement}
                      </Badge>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            )}
        </>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        .child-results-page { padding: 0; }

        .card-top-bar {
          transition: height 0.3s ease;
        }
        .modern-card:hover .card-top-bar {
          height: 5px;
        }

        .modern-card {
          border-radius: 16px !important;
          transition: all 0.3s ease;
          overflow: hidden;
        }
        .modern-card:hover {
          box-shadow: 0 8px 30px rgba(0,0,0,0.06) !important;
        }

        .child-profile-card {
          transition: all 0.3s ease;
        }
        .child-profile-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.08) !important;
        }

        .child-avatar {
          transition: all 0.3s ease;
        }
        .child-profile-card:hover .child-avatar {
          transform: scale(1.05) rotate(-5deg);
        }

        .child-info-tag {
          transition: all 0.3s ease;
        }
        .child-profile-card:hover .child-info-tag {
          transform: translateY(-1px);
        }

        .mini-stat {
          transition: all 0.3s ease;
        }
        .mini-stat:hover {
          transform: translateY(-2px);
          box-shadow: 0 2px 10px rgba(0,0,0,0.06);
        }

        .table th {
          font-weight: 600;
          font-size: clamp(0.6rem, 0.7vw, 0.7rem);
          text-transform: uppercase;
          letter-spacing: 0.3px;
          color: #6c757d;
          border-bottom: 2px solid #e9ecef;
          padding: 8px 16px;
        }
        .table td {
          vertical-align: middle;
          padding: 8px 16px;
          font-size: clamp(0.8rem, 0.9vw, 0.95rem);
        }

        .child-selector-btn {
          transition: all 0.3s ease;
        }
        .child-selector-btn:hover {
          transform: translateY(-2px);
        }

        .dashboard-wrapper.dark-theme .modern-card {
          background: #1a1a2e !important;
          border-color: #2d2d44 !important;
        }
        .dashboard-wrapper.dark-theme .table td {
          color: #e9ecef !important;
        }
        .dashboard-wrapper.dark-theme .table th {
          color: #adb5bd !important;
          border-color: #2d2d44 !important;
        }
        .dashboard-wrapper.dark-theme .child-profile-card {
          background: #1a1a2e !important;
          border-color: #2d2d44 !important;
        }

        @media print {
          .btn {
            display: none !important;
          }
          .d-flex.gap-2 .btn {
            display: none !important;
          }
        }

        @media (max-width: 768px) {
          .child-profile-card .p-4 {
            padding: 16px !important;
          }
          .child-avatar {
            width: 50px !important;
            height: 50px !important;
            font-size: 1.3rem !important;
          }
          .table th,
          .table td {
            font-size: 0.75rem;
            padding: 8px 12px;
          }
          .child-profile-card .d-flex {
            flex-direction: column;
            align-items: center !important;
            text-align: center;
          }
        }

        @media (max-width: 576px) {
          .child-profile-card .d-flex {
            flex-direction: column;
            align-items: center !important;
          }
          .child-profile-card .d-flex .gap-3 {
            gap: 8px !important;
          }
          .child-avatar {
            width: 40px !important;
            height: 40px !important;
            font-size: 1rem !important;
          }
          .child-selector-btn {
            font-size: 0.75rem !important;
            padding: 4px 12px !important;
          }
          .table th,
          .table td {
            font-size: 0.65rem;
            padding: 6px 8px;
          }
          .table th:nth-child(4),
          .table td:nth-child(4) {
            display: none;
          }
          .d-flex.gap-2 .btn {
            font-size: 0.65rem !important;
            padding: 4px 8px !important;
          }
          .child-profile-card .fw-bold {
            font-size: 0.9rem !important;
          }
          .child-profile-card .text-muted.small {
            font-size: 0.6rem !important;
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
          .child-info-tag {
            font-size: 0.55rem !important;
            padding: 1px 8px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ChildResults;
