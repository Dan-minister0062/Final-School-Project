// src/components/dashboard/admin/StudentsManagement.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Button,
  Table,
  Modal,
  Form,
  Alert,
  InputGroup,
  Pagination,
  ProgressBar,
  Image,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import {
  FaUsers,
  FaUserPlus,
  FaSearch,
  FaFilter,
  FaEye,
  FaEdit,
  FaTrash,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaSync,
  FaDownload,
  FaPrint,
  FaChevronDown,
  FaChevronUp,
  FaExclamationTriangle,
  FaSpinner,
  FaUserGraduate,
  FaCalendarAlt,
  FaIdCard,
  FaUser,
  FaSchool,
  FaGraduationCap,
  FaUserCircle,
  FaBirthdayCake,
  FaVenusMars,
  FaGlobe,
  FaCity,
  FaBuilding,
  FaChalkboardTeacher,
  FaSave,
  FaRocket,
  FaChild,
  FaAddressBook,
  FaPhoneAlt,
  FaEnvelopeOpen,
  FaUserCheck,
  FaUserTimes,
  FaClock,
  FaPlus,
  FaUniversity,
  FaLock,
  FaUnlock,
} from "react-icons/fa";
import { useLanguage } from "../../../context/LanguageContext";
import { useAuth } from "../../../hooks/useAuth";
import { useNotification } from "../../../hooks/useNotification";
import userDataService from "../../../services/userDataService";
import { format, formatDistanceToNow, isValid } from "date-fns";
import { ar, enUS } from "date-fns/locale";

// ===== SAFE DATE FORMAT =====
const safeFormatDate = (date, formatStr = "PPP", options = {}) => {
  if (!date) return "N/A";
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!isValid(dateObj)) return "N/A";
    return format(dateObj, formatStr, options);
  } catch {
    return "N/A";
  }
};

// ===== ALWAYS use English numbers =====
const formatNumber = (num) => {
  if (num === undefined || num === null) return "0";
  return num.toString();
};

const StudentsManagement = () => {
  const { isArabic } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notify } = useNotification();

  // ===== STATE =====
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ===== CLASSES DATA =====
  const [classes, setClasses] = useState([]);

  // ===== FORM DATA =====
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    nationality: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    address: "",
    city: "",
    classId: "",
    educationLevel: "",
    parentName: "",
    parentPhone: "",
    parentEmail: "",
    status: "active",
  });

  const [editFormData, setEditFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    nationality: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    address: "",
    city: "",
    classId: "",
    educationLevel: "",
    parentName: "",
    parentPhone: "",
    parentEmail: "",
    status: "active",
  });

  const locale = isArabic ? ar : enUS;

  // ===== ARABIC FONT STYLE =====
  const arabicFontStyle = {
    fontFamily: isArabic
      ? '"Hacen Tunisia", "Hacen Tunisia Bd", "Noto Sans Arabic", "Vazirmatn", "Traditional Arabic", "Arabic Typesetting", serif'
      : "inherit",
    lineHeight: isArabic ? "1.8" : "1.6",
    letterSpacing: isArabic ? "0.5px" : "0px",
    fontSize: isArabic
      ? "clamp(0.85rem, 1.1vw, 1.05rem)"
      : "clamp(0.8rem, 1vw, 1rem)",
  };

  // ===== LEVEL CATEGORIES =====
  const levelCategories = [
    {
      value: "kindergarten",
      label: isArabic ? "أولي" : "Kindergarten",
      icon: <FaChild />,
      color: "#f39c12",
    },
    {
      value: "primary",
      label: isArabic ? "ابتدائي" : "Primary",
      icon: <FaSchool />,
      color: "#3498db",
    },
    {
      value: "secondary",
      label: isArabic ? "إعدادي" : "Secondary",
      icon: <FaGraduationCap />,
      color: "#2ecc71",
    },
    {
      value: "high_school",
      label: isArabic ? "ثانوي" : "High School",
      icon: <FaUniversity />,
      color: "#9b59b6",
    },
  ];

  const genderOptions = [
    { value: "male", label: isArabic ? "ذكر" : "Male" },
    { value: "female", label: isArabic ? "أنثى" : "Female" },
  ];

  // ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====
  // ===== SAVE USER TO STORAGE (for login) =====
  // ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====
  const saveUserToStorage = (userData) => {
    try {
      console.log("💾 Saving student user to storage:", userData);
      
      // Ensure user has all required fields
      const userToSave = {
        id: userData.id || `USR${String(Date.now()).slice(-6)}`,
        name: userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        phone: userData.phone || '',
        address: userData.address || '',
        city: userData.city || '',
        dateOfBirth: userData.dateOfBirth || '',
        gender: userData.gender || '',
        nationality: userData.nationality || '',
        role: 'student',
        status: userData.status || 'active',
        password: userData.password || 'student123',
        // Student specific fields
        classId: userData.classId || '',
        class: userData.classId || '',
        className: userData.className || '',
        educationLevel: userData.educationLevel || '',
        level: userData.educationLevel || '',
        parentName: userData.parentName || '',
        parentPhone: userData.parentPhone || '',
        parentEmail: userData.parentEmail || '',
        // Metadata
        lastLogin: null,
        createdAt: userData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save to school_users (primary storage for login)
      const users = JSON.parse(localStorage.getItem("school_users") || "[]");
      const existingUserIndex = users.findIndex((u) => u.id === userToSave.id);
      
      if (existingUserIndex === -1) {
        users.push(userToSave);
        localStorage.setItem("school_users", JSON.stringify(users));
        console.log("✅ Student saved to school_users for login");
      } else {
        users[existingUserIndex] = {
          ...users[existingUserIndex],
          ...userToSave,
        };
        localStorage.setItem("school_users", JSON.stringify(users));
        console.log("✅ Student updated in school_users");
      }

      // Also save to school_students for management
      const students = JSON.parse(localStorage.getItem("school_students") || "[]");
      const existingStudentIndex = students.findIndex((s) => s.id === userToSave.id);
      
      const studentData = {
        id: userToSave.id,
        name: userToSave.name,
        firstName: userToSave.firstName,
        lastName: userToSave.lastName,
        email: userToSave.email,
        phone: userToSave.phone,
        address: userToSave.address,
        city: userToSave.city,
        dateOfBirth: userToSave.dateOfBirth,
        gender: userToSave.gender,
        nationality: userToSave.nationality,
        classId: userToSave.classId,
        class: userToSave.classId,
        className: userToSave.className,
        educationLevel: userToSave.educationLevel,
        level: userToSave.educationLevel,
        parentName: userToSave.parentName,
        parentPhone: userToSave.parentPhone,
        parentEmail: userToSave.parentEmail,
        status: userToSave.status,
        password: userToSave.password,
        createdAt: userToSave.createdAt,
        updatedAt: userToSave.updatedAt,
      };
      
      if (existingStudentIndex === -1) {
        students.push(studentData);
        localStorage.setItem("school_students", JSON.stringify(students));
        console.log("✅ Student saved to school_students");
      } else {
        students[existingStudentIndex] = {
          ...students[existingStudentIndex],
          ...studentData,
        };
        localStorage.setItem("school_students", JSON.stringify(students));
        console.log("✅ Student updated in school_students");
      }

      // Dispatch events
      window.dispatchEvent(new CustomEvent('usersUpdated', { 
        detail: { user: userToSave, action: 'save' }
      }));
      window.dispatchEvent(new CustomEvent('studentsUpdated', { 
        detail: { student: studentData, action: 'save' }
      }));

      return true;
    } catch (error) {
      console.error("❌ Error saving student user to storage:", error);
      return false;
    }
  };

  // ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====
  // ===== SEND NOTIFICATION TO TEACHER WHEN STUDENT IS ASSIGNED =====
  // ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====
  const notifyTeacherAboutStudent = (studentName, className, teacherId, studentId) => {
    try {
      if (!teacherId) {
        console.warn('⚠️ No teacher ID provided for notification');
        return false;
      }

      const notifications = JSON.parse(localStorage.getItem('school_notifications') || '[]');
      
      const notification = {
        id: `NOT${String(notifications.length + 1).padStart(3, '0')}`,
        title: isArabic ? '👨‍🎓 طالب جديد تم تعيينه' : '👨‍🎓 New Student Assigned',
        message: isArabic 
          ? `تم تعيين الطالب ${studentName} إلى فصلك: ${className}`
          : `Student ${studentName} has been assigned to your class: ${className}`,
        type: 'student',
        read: false,
        recipientId: teacherId,
        recipientRole: 'teacher',
        studentId: studentId,
        className: className,
        studentName: studentName,
        createdAt: new Date().toISOString(),
        time: new Date().toLocaleString(),
        link: '/dashboard/teacher/my-students',
      };
      
      notifications.push(notification);
      localStorage.setItem('school_notifications', JSON.stringify(notifications));
      console.log(`🔔 Notification sent to teacher ${teacherId} about student ${studentName}`);
      
      // Dispatch events
      window.dispatchEvent(new CustomEvent('notificationAdded', { detail: notification }));
      window.dispatchEvent(new CustomEvent('studentAdded', { 
        detail: { student: { name: studentName, id: studentId, class: className }, teacherId: teacherId }
      }));
      
      return true;
    } catch (error) {
      console.error('❌ Error sending teacher notification:', error);
      return false;
    }
  };

  // ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====
  // ===== FIND TEACHER BY CLASS ID =====
  // ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====
  const findTeacherByClassId = (classId) => {
    try {
      const users = JSON.parse(localStorage.getItem('school_users') || '[]');
      const teacher = users.find(u => 
        u.role === 'teacher' && 
        (u.assignedClasses || []).includes(classId)
      );
      return teacher || null;
    } catch (error) {
      console.error('Error finding teacher by class:', error);
      return null;
    }
  };

  // ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====
  // ===== GET CLASS NAME BY ID =====
  // ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====
  const getClassNameById = (classId) => {
    try {
      const classes = JSON.parse(localStorage.getItem('school_classes') || '[]');
      const classInfo = classes.find(c => c.id === classId);
      return classInfo?.name || classId || 'Unknown Class';
    } catch (error) {
      console.error('Error getting class name:', error);
      return 'Unknown Class';
    }
  };

  // ===== Check dark mode & mobile =====
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

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // ===== LOAD STUDENTS =====
  const loadStudents = () => {
    setLoading(true);
    try {
      // Load from school_students
      let studentsData = JSON.parse(localStorage.getItem("school_students") || "[]");
      
      // If no students in school_students, try school_users
      if (studentsData.length === 0) {
        const users = JSON.parse(localStorage.getItem("school_users") || "[]");
        studentsData = users.filter(u => u.role === 'student');
      }
      
      const classesData = JSON.parse(localStorage.getItem("school_classes") || "[]");
      
      const enrichedStudents = studentsData.map(student => {
        const classInfo = classesData.find(c => c.id === student.classId || c.id === student.class);
        return {
          ...student,
          className: classInfo?.name || student.className || student.class || 'N/A',
          classLevel: classInfo?.level || student.educationLevel || student.level || 'N/A',
        };
      });
      
      setStudents(enrichedStudents);
      setClasses(classesData);
      updateStats(enrichedStudents);
      setError(null);
    } catch (err) {
      console.error("Error loading students:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (studentsData) => {
    const data = studentsData || students;
    setTotalStudents(data.length);
    setTotalPages(Math.ceil(data.length / 10));
  };

  // ===== APPLY FILTERS =====
  useEffect(() => {
    let filtered = [...students];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          (s.name || "").toLowerCase().includes(term) ||
          (s.firstName || "").toLowerCase().includes(term) ||
          (s.lastName || "").toLowerCase().includes(term) ||
          (s.id || "").toLowerCase().includes(term) ||
          (s.email || "").toLowerCase().includes(term)
      );
    }

    if (filterClass !== "all") {
      filtered = filtered.filter((s) => s.classId === filterClass || s.class === filterClass);
    }

    if (filterLevel !== "all") {
      filtered = filtered.filter(
        (s) => s.educationLevel === filterLevel || s.level === filterLevel
      );
    }

    setFilteredStudents(filtered);
    setTotalPages(Math.ceil(filtered.length / 10));
  }, [students, searchTerm, filterClass, filterLevel]);

  // ===== SETUP EFFECT =====
  useEffect(() => {
    loadStudents();

    const handleStorageChange = (e) => {
      if (e.key === "school_students" || e.key === "school_users" || e.key === "school_classes") {
        console.log("🔄 Storage changed, refreshing students");
        loadStudents();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    const handleStudentsUpdated = () => {
      console.log("📚 Students updated, refreshing");
      loadStudents();
    };
    window.addEventListener("studentsUpdated", handleStudentsUpdated);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("studentsUpdated", handleStudentsUpdated);
    };
  }, []);

  // ===== VALIDATE FORM =====
  const validateForm = (data, isEdit = false) => {
    const errors = [];
    if (!data.firstName) errors.push(isArabic ? "الاسم الأول مطلوب" : "First name is required");
    if (!data.lastName) errors.push(isArabic ? "الاسم الأخير مطلوب" : "Last name is required");
    if (!data.dateOfBirth) errors.push(isArabic ? "تاريخ الميلاد مطلوب" : "Date of birth is required");
    if (!data.gender) errors.push(isArabic ? "الجنس مطلوب" : "Gender is required");
    if (!data.classId) errors.push(isArabic ? "الفصل مطلوب" : "Class is required");
    if (!data.email) errors.push(isArabic ? "البريد الإلكتروني مطلوب" : "Email is required");
    
    if (!isEdit) {
      if (!data.password) errors.push(isArabic ? "كلمة المرور مطلوبة" : "Password is required");
      if (data.password !== data.confirmPassword) errors.push(isArabic ? "كلمة المرور غير متطابقة" : "Passwords do not match");
      if (data.password && data.password.length < 6) errors.push(isArabic ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل" : "Password must be at least 6 characters");
    } else if (data.password && data.password.length > 0) {
      if (data.password !== data.confirmPassword) errors.push(isArabic ? "كلمة المرور غير متطابقة" : "Passwords do not match");
      if (data.password.length < 6) errors.push(isArabic ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل" : "Password must be at least 6 characters");
    }
    
    return errors;
  };

  // ===== HANDLE SAVE STUDENT =====
  const handleSaveStudent = async () => {
    const errors = validateForm(formData, false);
    if (errors.length > 0) {
      notify(errors.join("\n"), "warning");
      return;
    }

    setProcessingAction(true);
    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      const className = getClassNameById(formData.classId);
      const userId = `STU${String(Date.now()).slice(-6)}`;
      
      const studentData = {
        id: userId,
        name: fullName,
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        nationality: formData.nationality || "",
        phone: formData.phone || "",
        email: formData.email || "",
        password: formData.password,
        address: formData.address || "",
        city: formData.city || "",
        classId: formData.classId,
        class: formData.classId,
        className: className,
        educationLevel: formData.educationLevel || "",
        level: formData.educationLevel || "",
        parentName: formData.parentName || "",
        parentPhone: formData.parentPhone || "",
        parentEmail: formData.parentEmail || "",
        status: "active",
        role: "student",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save to both school_students and school_users
      const saved = saveUserToStorage(studentData);
      
      if (saved) {
        // Find teacher and notify
        const teacher = findTeacherByClassId(formData.classId);
        if (teacher) {
          notifyTeacherAboutStudent(fullName, className, teacher.id, userId);
        }

        // Update class student count
        try {
          const classes = JSON.parse(localStorage.getItem("school_classes") || "[]");
          const classIndex = classes.findIndex(c => c.id === formData.classId);
          if (classIndex !== -1) {
            classes[classIndex].students = (classes[classIndex].students || 0) + 1;
            localStorage.setItem("school_classes", JSON.stringify(classes));
          }
        } catch (e) {
          console.warn("Could not update class student count:", e);
        }

        notify(
          isArabic ? "تم إضافة الطالب بنجاح" : "Student added successfully",
          "success"
        );

        window.dispatchEvent(new CustomEvent("studentsUpdated", {
          detail: { student: studentData, action: "add" }
        }));

        setShowAddModal(false);
        resetFormData();
        loadStudents();
      } else {
        notify(
          isArabic ? "فشل في حفظ الطالب" : "Failed to save student",
          "error"
        );
      }
    } catch (error) {
      console.error("❌ Error saving student:", error);
      notify(
        isArabic ? "حدث خطأ أثناء حفظ الطالب" : "Error saving student",
        "error"
      );
    } finally {
      setProcessingAction(false);
    }
  };

  // ===== RESET FORM DATA =====
  const resetFormData = () => {
    setFormData({
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      gender: "",
      nationality: "",
      phone: "",
      email: "",
      password: "",
      confirmPassword: "",
      address: "",
      city: "",
      classId: "",
      educationLevel: "",
      parentName: "",
      parentPhone: "",
      parentEmail: "",
      status: "active",
    });
  };

  // ===== HANDLE EDIT STUDENT =====
  const handleEditStudent = (student) => {
    setSelectedStudent(student);
    setEditFormData({
      firstName: student.firstName || "",
      lastName: student.lastName || "",
      dateOfBirth: student.dateOfBirth || "",
      gender: student.gender || "",
      nationality: student.nationality || "",
      phone: student.phone || "",
      email: student.email || "",
      password: "",
      confirmPassword: "",
      address: student.address || "",
      city: student.city || "",
      classId: student.classId || student.class || "",
      educationLevel: student.educationLevel || student.level || "",
      parentName: student.parentName || "",
      parentPhone: student.parentPhone || "",
      parentEmail: student.parentEmail || "",
      status: student.status || "active",
    });
    setShowEditModal(true);
  };

  // ===== HANDLE UPDATE STUDENT =====
  const handleUpdateStudent = async () => {
    const errors = validateForm(editFormData, true);
    if (errors.length > 0) {
      notify(errors.join("\n"), "warning");
      return;
    }

    setProcessingAction(true);
    try {
      const fullName = `${editFormData.firstName} ${editFormData.lastName}`.trim();
      const className = getClassNameById(editFormData.classId);
      
      const updatedStudent = {
        ...selectedStudent,
        name: fullName,
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        dateOfBirth: editFormData.dateOfBirth,
        gender: editFormData.gender,
        nationality: editFormData.nationality,
        phone: editFormData.phone,
        email: editFormData.email,
        address: editFormData.address,
        city: editFormData.city,
        classId: editFormData.classId,
        class: editFormData.classId,
        className: className,
        educationLevel: editFormData.educationLevel,
        level: editFormData.educationLevel,
        parentName: editFormData.parentName,
        parentPhone: editFormData.parentPhone,
        parentEmail: editFormData.parentEmail,
        status: editFormData.status,
        updatedAt: new Date().toISOString(),
      };

      // If password is provided, update it
      if (editFormData.password && editFormData.password.length > 0) {
        updatedStudent.password = editFormData.password;
      }

      // Save to both school_students and school_users
      const saved = saveUserToStorage(updatedStudent);
      
      if (saved) {
        notify(
          isArabic ? "تم تحديث الطالب بنجاح" : "Student updated successfully",
          "success"
        );

        window.dispatchEvent(new CustomEvent("studentsUpdated", {
          detail: { student: updatedStudent, action: "update" }
        }));

        setShowEditModal(false);
        loadStudents();
      } else {
        notify(
          isArabic ? "فشل في تحديث الطالب" : "Failed to update student",
          "error"
        );
      }
    } catch (error) {
      console.error("Error updating student:", error);
      notify(
        isArabic ? "حدث خطأ أثناء تحديث الطالب" : "Error updating student",
        "error"
      );
    } finally {
      setProcessingAction(false);
    }
  };

  // ===== HANDLE DELETE STUDENT =====
  const handleDeleteStudent = async () => {
    setProcessingAction(true);
    try {
      // Remove from school_students
      let studentsList = JSON.parse(localStorage.getItem("school_students") || "[]");
      studentsList = studentsList.filter(s => s.id !== selectedStudent.id);
      localStorage.setItem("school_students", JSON.stringify(studentsList));

      // Remove from school_users
      let users = JSON.parse(localStorage.getItem("school_users") || "[]");
      users = users.filter(u => u.id !== selectedStudent.id);
      localStorage.setItem("school_users", JSON.stringify(users));

      // Update class student count
      if (selectedStudent.classId) {
        try {
          const classes = JSON.parse(localStorage.getItem("school_classes") || "[]");
          const classIndex = classes.findIndex(c => c.id === selectedStudent.classId);
          if (classIndex !== -1) {
            classes[classIndex].students = Math.max(0, (classes[classIndex].students || 0) - 1);
            localStorage.setItem("school_classes", JSON.stringify(classes));
          }
        } catch (e) {
          console.warn("Could not update class student count:", e);
        }
      }

      notify(
        isArabic ? "تم حذف الطالب بنجاح" : "Student deleted successfully",
        "success"
      );

      window.dispatchEvent(new CustomEvent("studentsUpdated", {
        detail: { student: selectedStudent, action: "delete" }
      }));

      setShowDeleteConfirm(false);
      loadStudents();
    } catch (error) {
      console.error("Error deleting student:", error);
      notify(
        isArabic ? "حدث خطأ أثناء حذف الطالب" : "Error deleting student",
        "error"
      );
    } finally {
      setProcessingAction(false);
    }
  };

  // ===== HANDLE TOGGLE STATUS =====
  const handleToggleStatus = (studentId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      // Update school_students
      let studentsList = JSON.parse(localStorage.getItem("school_students") || "[]");
      const index = studentsList.findIndex(s => s.id === studentId);
      if (index !== -1) {
        studentsList[index].status = newStatus;
        localStorage.setItem("school_students", JSON.stringify(studentsList));
      }

      // Update school_users
      let users = JSON.parse(localStorage.getItem("school_users") || "[]");
      const userIndex = users.findIndex(u => u.id === studentId);
      if (userIndex !== -1) {
        users[userIndex].status = newStatus;
        localStorage.setItem("school_users", JSON.stringify(users));
      }

      notify(
        isArabic
          ? `تم ${newStatus === "active" ? "تفعيل" : "تعطيل"} الطالب بنجاح`
          : `Student ${newStatus === "active" ? "activated" : "deactivated"} successfully`,
        "success"
      );
      loadStudents();
    } catch (error) {
      console.error("Error toggling status:", error);
      notify(
        isArabic ? "حدث خطأ" : "Error occurred",
        "error"
      );
    }
  };

  // ===== GET LEVEL DISPLAY =====
  const getLevelDisplay = (level) => {
    const found = levelCategories.find(c => c.value === level);
    return found ? found.label : level || "N/A";
  };

  const getLevelColor = (level) => {
    const found = levelCategories.find(c => c.value === level);
    return found ? found.color : "#6c757d";
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      active: "success",
      inactive: "secondary",
      suspended: "danger",
    };
    return statusMap[status] || "secondary";
  };

  const getStatusLabel = (status) => {
    const labels = {
      active: isArabic ? "نشط" : "Active",
      inactive: isArabic ? "غير نشط" : "Inactive",
      suspended: isArabic ? "موقوف" : "Suspended",
    };
    return labels[status] || status;
  };

  // ===== RENDER =====
  return (
    <div className="students-management" dir={isArabic ? "rtl" : "ltr"}>
      {/* ===== PAGE HEADER ===== */}
      <div className="page-header d-flex flex-wrap flex-sm-nowrap justify-content-between align-items-center gap-2 gap-md-3 mb-3 mb-md-4">
        <div className="flex-grow-1 min-width-0">
          <h4 className="fw-bold mb-0 mb-sm-1" style={{
            ...arabicFontStyle,
            color: "#4a9eff",
            fontSize: isArabic ? "clamp(1rem, 2vw, 1.5rem)" : "clamp(0.95rem, 1.8vw, 1.4rem)"
          }}>
            <FaUserGraduate className="me-2" />
            {isArabic ? "إدارة الطلاب" : "Students Management"}
          </h4>
          <p className="text-muted mb-0 d-none d-sm-block" style={{
            ...arabicFontStyle,
            fontSize: isArabic ? "clamp(0.8rem, 1vw, 0.95rem)" : "clamp(0.75rem, 0.9vw, 0.9rem)"
          }}>
            {isArabic
              ? `إدارة جميع الطلاب في النظام (${formatNumber(totalStudents)})`
              : `Manage all students in the system (${formatNumber(totalStudents)})`}
          </p>
        </div>
        <div className="d-flex gap-1 gap-sm-2 flex-wrap flex-shrink-0">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={loadStudents}
            disabled={loading}
            style={{
              ...arabicFontStyle,
              borderRadius: "12px",
              fontSize: isArabic ? "clamp(0.65rem, 0.8vw, 0.85rem)" : "clamp(0.6rem, 0.75vw, 0.8rem)",
              padding: isMobile ? "4px 8px" : "4px 12px"
            }}
          >
            <FaSync className={loading ? "spinning" : ""} />
            <span className="d-none d-sm-inline">{isArabic ? "تحديث" : "Refresh"}</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowAddModal(true)}
            style={{
              ...arabicFontStyle,
              borderRadius: "12px",
              fontSize: isArabic ? "clamp(0.65rem, 0.8vw, 0.85rem)" : "clamp(0.6rem, 0.75vw, 0.8rem)",
              padding: isMobile ? "4px 8px" : "4px 12px"
            }}
          >
            <FaUserPlus className="me-1" />
            {isArabic ? "إضافة طالب" : "Add Student"}
          </Button>
        </div>
      </div>

      {/* ===== STATS CARDS ===== */}
      <Row className="g-2 g-sm-3 g-md-4 mb-3 mb-md-4">
        <Col xs={6} sm={6} md={3} className="px-1 px-sm-2">
          <Card className="stats-card-enhanced h-100 text-center" style={{
            background: darkMode ? "#1a1a2e" : "#ffffff",
            border: "none",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: darkMode ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 20px rgba(0,0,0,0.06)",
          }}>
            <div className="stats-card-topbar" style={{
              height: "4px",
              background: "linear-gradient(135deg, #4a9eff, #2a7f9a)",
              borderRadius: "16px 16px 0 0",
            }} />
            <Card.Body className="p-2 p-sm-3 p-md-4">
              <div className="stats-icon-wrapper mb-1 mb-sm-2" style={{
                display: "inline-flex",
                padding: "clamp(6px, 1vw, 12px)",
                borderRadius: "12px",
                background: "rgba(74, 158, 255, 0.15)",
                color: "#4a9eff",
              }}>
                <FaUserGraduate style={{ fontSize: "clamp(1.2rem, 2vw, 1.8rem)" }} />
              </div>
              <h2 className="fw-bold mb-0" style={{
                ...arabicFontStyle,
                fontSize: "clamp(1rem, 1.8vw, 1.6rem)",
                color: darkMode ? "#e9ecef" : "#212529",
              }}>
                {formatNumber(totalStudents)}
              </h2>
              <p className="text-muted mb-0" style={{
                ...arabicFontStyle,
                fontSize: "clamp(0.5rem, 0.7vw, 0.7rem)",
                opacity: 0.8,
              }}>
                {isArabic ? "إجمالي الطلاب" : "Total Students"}
              </p>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} sm={6} md={3} className="px-1 px-sm-2">
          <Card className="stats-card-enhanced h-100 text-center" style={{
            background: darkMode ? "#1a1a2e" : "#ffffff",
            border: "none",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: darkMode ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 20px rgba(0,0,0,0.06)",
          }}>
            <div className="stats-card-topbar" style={{
              height: "4px",
              background: "linear-gradient(135deg, #2ecc71, #27ae60)",
              borderRadius: "16px 16px 0 0",
            }} />
            <Card.Body className="p-2 p-sm-3 p-md-4">
              <div className="stats-icon-wrapper mb-1 mb-sm-2" style={{
                display: "inline-flex",
                padding: "clamp(6px, 1vw, 12px)",
                borderRadius: "12px",
                background: "rgba(46, 204, 113, 0.15)",
                color: "#2ecc71",
              }}>
                <FaUserCheck style={{ fontSize: "clamp(1.2rem, 2vw, 1.8rem)" }} />
              </div>
              <h2 className="fw-bold mb-0" style={{
                ...arabicFontStyle,
                fontSize: "clamp(1rem, 1.8vw, 1.6rem)",
                color: darkMode ? "#e9ecef" : "#212529",
              }}>
                {formatNumber(students.filter(s => s.status === "active").length)}
              </h2>
              <p className="text-muted mb-0" style={{
                ...arabicFontStyle,
                fontSize: "clamp(0.5rem, 0.7vw, 0.7rem)",
                opacity: 0.8,
              }}>
                {isArabic ? "طلاب نشطاء" : "Active Students"}
              </p>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} sm={6} md={3} className="px-1 px-sm-2">
          <Card className="stats-card-enhanced h-100 text-center" style={{
            background: darkMode ? "#1a1a2e" : "#ffffff",
            border: "none",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: darkMode ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 20px rgba(0,0,0,0.06)",
          }}>
            <div className="stats-card-topbar" style={{
              height: "4px",
              background: "linear-gradient(135deg, #f39c12, #e67e22)",
              borderRadius: "16px 16px 0 0",
            }} />
            <Card.Body className="p-2 p-sm-3 p-md-4">
              <div className="stats-icon-wrapper mb-1 mb-sm-2" style={{
                display: "inline-flex",
                padding: "clamp(6px, 1vw, 12px)",
                borderRadius: "12px",
                background: "rgba(243, 156, 18, 0.15)",
                color: "#f39c12",
              }}>
                <FaClock style={{ fontSize: "clamp(1.2rem, 2vw, 1.8rem)" }} />
              </div>
              <h2 className="fw-bold mb-0" style={{
                ...arabicFontStyle,
                fontSize: "clamp(1rem, 1.8vw, 1.6rem)",
                color: darkMode ? "#e9ecef" : "#212529",
              }}>
                {formatNumber(students.filter(s => s.status === "inactive").length)}
              </h2>
              <p className="text-muted mb-0" style={{
                ...arabicFontStyle,
                fontSize: "clamp(0.5rem, 0.7vw, 0.7rem)",
                opacity: 0.8,
              }}>
                {isArabic ? "طلاب غير نشطاء" : "Inactive Students"}
              </p>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} sm={6} md={3} className="px-1 px-sm-2">
          <Card className="stats-card-enhanced h-100 text-center" style={{
            background: darkMode ? "#1a1a2e" : "#ffffff",
            border: "none",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: darkMode ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 20px rgba(0,0,0,0.06)",
          }}>
            <div className="stats-card-topbar" style={{
              height: "4px",
              background: "linear-gradient(135deg, #9b59b6, #8e44ad)",
              borderRadius: "16px 16px 0 0",
            }} />
            <Card.Body className="p-2 p-sm-3 p-md-4">
              <div className="stats-icon-wrapper mb-1 mb-sm-2" style={{
                display: "inline-flex",
                padding: "clamp(6px, 1vw, 12px)",
                borderRadius: "12px",
                background: "rgba(155, 89, 182, 0.15)",
                color: "#9b59b6",
              }}>
                <FaSchool style={{ fontSize: "clamp(1.2rem, 2vw, 1.8rem)" }} />
              </div>
              <h2 className="fw-bold mb-0" style={{
                ...arabicFontStyle,
                fontSize: "clamp(1rem, 1.8vw, 1.6rem)",
                color: darkMode ? "#e9ecef" : "#212529",
              }}>
                {formatNumber(classes.length)}
              </h2>
              <p className="text-muted mb-0" style={{
                ...arabicFontStyle,
                fontSize: "clamp(0.5rem, 0.7vw, 0.7rem)",
                opacity: 0.8,
              }}>
                {isArabic ? "إجمالي الفصول" : "Total Classes"}
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ===== FILTERS ===== */}
      <Card className="modern-card mb-3 mb-md-4" style={{
        background: darkMode ? "#1a1a2e" : "#ffffff",
        borderColor: darkMode ? "#2d2d44" : "#e9ecef",
      }}>
        <Card.Body className="p-2 p-md-3">
          <Row className="g-1 g-md-2 align-items-center">
            <Col xs={12} sm={6} md={4} lg={4} className="px-1 px-sm-2">
              <InputGroup size="sm">
                <InputGroup.Text style={{
                  background: "transparent",
                  borderColor: darkMode ? "#2d2d44" : "#ced4da",
                }}>
                  <FaSearch size={12} />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder={isArabic ? "بحث بالاسم أو المعرف..." : "Search by name, ID..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-control-sm"
                  style={{
                    ...arabicFontStyle,
                    background: darkMode ? "#2d2d44" : "white",
                    color: darkMode ? "#e9ecef" : "#212529",
                    fontSize: "clamp(0.6rem, 0.8vw, 0.8rem)",
                  }}
                />
                {searchTerm && (
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setSearchTerm("")}
                    style={{ borderRadius: "0 12px 12px 0" }}
                  >
                    <FaTimesCircle size={12} />
                  </Button>
                )}
              </InputGroup>
            </Col>
            <Col xs={6} sm={3} md={3} lg={3} className="px-1 px-sm-2">
              <Form.Select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="form-select-sm"
                style={{
                  ...arabicFontStyle,
                  background: darkMode ? "#2d2d44" : "white",
                  color: darkMode ? "#e9ecef" : "#212529",
                  borderRadius: "12px",
                  fontSize: "clamp(0.55rem, 0.7vw, 0.75rem)",
                }}
              >
                <option value="all">{isArabic ? "جميع الفصول" : "All Classes"}</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={6} sm={3} md={3} lg={3} className="px-1 px-sm-2">
              <Form.Select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="form-select-sm"
                style={{
                  ...arabicFontStyle,
                  background: darkMode ? "#2d2d44" : "white",
                  color: darkMode ? "#e9ecef" : "#212529",
                  borderRadius: "12px",
                  fontSize: "clamp(0.55rem, 0.7vw, 0.75rem)",
                }}
              >
                <option value="all">{isArabic ? "جميع المستويات" : "All Levels"}</option>
                {levelCategories.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={6} sm={6} md={2} lg={2} className="px-1 px-sm-2">
              <span className="text-muted d-flex align-items-center" style={{
                ...arabicFontStyle,
                fontSize: "clamp(0.6rem, 0.8vw, 0.8rem)",
              }}>
                {formatNumber(filteredStudents.length)} {isArabic ? "طالب" : "students"}
              </span>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* ===== STUDENTS TABLE ===== */}
      <Card className="modern-card" style={{
        background: darkMode ? "#1a1a2e" : "#ffffff",
        borderColor: darkMode ? "#2d2d44" : "#e9ecef",
      }}>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 text-muted" style={arabicFontStyle}>
                {isArabic ? "جاري تحميل الطلاب..." : "Loading students..."}
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-5">
              <FaExclamationTriangle size={48} className="text-warning mb-3" />
              <p className="text-danger" style={arabicFontStyle}>{error}</p>
              <Button variant="primary" onClick={loadStudents} style={{ ...arabicFontStyle, borderRadius: "12px" }}>
                <FaSync className="me-2" /> {isArabic ? "إعادة المحاولة" : "Retry"}
              </Button>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-5">
              <FaUserGraduate size={48} className="text-muted opacity-25 mb-3" />
              <p style={arabicFontStyle}>
                {isArabic ? "لا توجد طلاب" : "No students found"}
              </p>
              <Button variant="primary" onClick={() => setShowAddModal(true)} style={{ ...arabicFontStyle, borderRadius: "12px" }}>
                <FaUserPlus className="me-2" /> {isArabic ? "إضافة طالب" : "Add Student"}
              </Button>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0" style={arabicFontStyle}>
                <thead style={{ background: darkMode ? "#0d1117" : "#f8f9fa" }}>
                  <tr>
                    <th style={{ color: darkMode ? "#e9ecef" : "#212529", width: "50px" }}>#</th>
                    <th style={{ color: darkMode ? "#e9ecef" : "#212529" }}>{isArabic ? "الطالب" : "Student"}</th>
                    <th style={{ color: darkMode ? "#e9ecef" : "#212529" }} className="d-none d-md-table-cell">{isArabic ? "الفصل" : "Class"}</th>
                    <th style={{ color: darkMode ? "#e9ecef" : "#212529" }} className="d-none d-sm-table-cell">{isArabic ? "المستوى" : "Level"}</th>
                    <th style={{ color: darkMode ? "#e9ecef" : "#212529" }}>{isArabic ? "الحالة" : "Status"}</th>
                    <th style={{ color: darkMode ? "#e9ecef" : "#212529" }} className="text-center">{isArabic ? "إجراءات" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.slice((currentPage - 1) * 10, currentPage * 10).map((student, index) => {
                    const globalIndex = (currentPage - 1) * 10 + index + 1;
                    const levelColor = getLevelColor(student.level || student.educationLevel);
                    
                    return (
                      <tr key={student.id}>
                        <td style={{ color: darkMode ? "#e9ecef" : "#212529" }}>
                          {formatNumber(globalIndex)}
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="student-avatar-sm" style={{
                              background: `linear-gradient(135deg, ${levelColor}, ${levelColor}dd)`,
                              width: isMobile ? "28px" : "36px",
                              height: isMobile ? "28px" : "36px",
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              fontWeight: "700",
                              fontSize: isMobile ? "0.6rem" : "0.85rem",
                              flexShrink: 0,
                            }}>
                              {(student.firstName || student.name || "U").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="fw-semibold" style={{ color: darkMode ? "#e9ecef" : "#212529" }}>
                                {student.name || student.firstName || "Unknown"}
                              </div>
                              <small className="text-muted d-none d-sm-block" style={arabicFontStyle}>
                                {isArabic ? "المعرف: " : "ID: "}{student.id}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td className="d-none d-md-table-cell" style={{ color: darkMode ? "#e9ecef" : "#212529" }}>
                          {student.className || "N/A"}
                        </td>
                        <td className="d-none d-sm-table-cell">
                          <Badge style={{
                            background: levelColor,
                            color: "white",
                            padding: "4px 10px",
                            borderRadius: "8px",
                            fontSize: "0.7rem",
                          }}>
                            {getLevelDisplay(student.level || student.educationLevel)}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg={getStatusBadge(student.status)} style={{ borderRadius: "8px" }}>
                            {getStatusLabel(student.status)}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex gap-1 justify-content-center flex-wrap">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => { setSelectedStudent(student); setShowViewModal(true); }}
                              title={isArabic ? "عرض" : "View"}
                              style={{ borderRadius: "8px", padding: isMobile ? "2px 6px" : "4px 8px" }}
                            >
                              <FaEye size={isMobile ? 12 : 14} />
                            </Button>
                            <Button
                              variant="outline-warning"
                              size="sm"
                              onClick={() => handleEditStudent(student)}
                              title={isArabic ? "تعديل" : "Edit"}
                              style={{ borderRadius: "8px", padding: isMobile ? "2px 6px" : "4px 8px" }}
                            >
                              <FaEdit size={isMobile ? 12 : 14} />
                            </Button>
                            <Button
                              variant={student.status === "active" ? "outline-danger" : "outline-success"}
                              size="sm"
                              onClick={() => handleToggleStatus(student.id, student.status)}
                              title={student.status === "active" ? (isArabic ? "تعطيل" : "Deactivate") : (isArabic ? "تفعيل" : "Activate")}
                              style={{ borderRadius: "8px", padding: isMobile ? "2px 6px" : "4px 8px" }}
                            >
                              {student.status === "active" ? <FaTimesCircle size={isMobile ? 12 : 14} /> : <FaCheckCircle size={isMobile ? 12 : 14} />}
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => { setSelectedStudent(student); setShowDeleteConfirm(true); }}
                              title={isArabic ? "حذف" : "Delete"}
                              style={{ borderRadius: "8px", padding: isMobile ? "2px 6px" : "4px 8px" }}
                            >
                              <FaTrash size={isMobile ? 12 : 14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}

          {/* ===== PAGINATION ===== */}
          {totalPages > 1 && (
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center p-3 border-top gap-2" style={{ borderColor: darkMode ? "#2d2d44" : "#e9ecef" }}>
              <div className="text-muted small" style={{ ...arabicFontStyle, color: darkMode ? "#adb5bd" : "#6c757d" }}>
                {isArabic
                  ? `عرض ${formatNumber(filteredStudents.slice((currentPage - 1) * 10, currentPage * 10).length)} من ${formatNumber(filteredStudents.length)} طالب`
                  : `Showing ${formatNumber(filteredStudents.slice((currentPage - 1) * 10, currentPage * 10).length)} of ${formatNumber(filteredStudents.length)} students`}
              </div>
              <Pagination className="mb-0 responsive-pagination" size={isMobile ? "sm" : "md"}>
                <Pagination.Prev
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                />
                {[...Array(Math.min(totalPages, isMobile ? 3 : 5))].map((_, i) => {
                  let pageNum;
                  if (totalPages <= (isMobile ? 3 : 5)) {
                    pageNum = i + 1;
                  } else if (currentPage <= (isMobile ? 2 : 3)) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - (isMobile ? 1 : 2)) {
                    pageNum = totalPages - (isMobile ? 2 : 4) + i;
                  } else {
                    pageNum = currentPage - (isMobile ? 1 : 2) + i;
                  }
                  return (
                    <Pagination.Item
                      key={pageNum}
                      active={pageNum === currentPage}
                      onClick={() => setCurrentPage(pageNum)}
                      style={{ color: darkMode ? "#e9ecef" : "#212529", borderRadius: "8px" }}
                    >
                      {formatNumber(pageNum)}
                    </Pagination.Item>
                  );
                })}
                <Pagination.Next
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                />
              </Pagination>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* ===== ADD STUDENT MODAL ===== */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered size="lg" className="modern-modal">
        <Modal.Header closeButton className="border-0" style={{ background: darkMode ? "#1a1a2e" : "white" }}>
          <Modal.Title style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529" }}>
            <FaUserPlus className="me-2 text-primary" />
            {isArabic ? "إضافة طالب جديد" : "Add New Student"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? "#0d1117" : "white" }}>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529" }}>
                    {isArabic ? "الاسم الأول *" : "First Name *"}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder={isArabic ? "أدخل الاسم الأول" : "Enter first name"}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? "#2d2d44" : "white",
                      color: darkMode ? "#e9ecef" : "#212529",
                      borderRadius: "12px",
                    }}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529" }}>
                    {isArabic ? "الاسم الأخير *" : "Last Name *"}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder={isArabic ? "أدخل الاسم الأخير" : "Enter last name"}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? "#2d2d44" : "white",
                      color: darkMode ? "#e9ecef" : "#212529",
                      borderRadius: "12px",
                    }}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529" }}>
                    <FaBirthdayCake className="me-1" /> {isArabic ? "تاريخ الميلاد *" : "Date of Birth *"}
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? "#2d2d44" : "white",
                      color: darkMode ? "#e9ecef" : "#212529",
                      borderRadius: "12px",
                    }}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529" }}>
                    <FaVenusMars className="me-1" /> {isArabic ? "الجنس *" : "Gender *"}
                  </Form.Label>
                  <Form.Select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? "#2d2d44" : "white",
                      color: darkMode ? "#e9ecef" : "#212529",
                      borderRadius: "12px",
                    }}
                  >
                    <option value="">{isArabic ? "اختر الجنس" : "Select Gender"}</option>
                    {genderOptions.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529" }}>
                    <FaSchool className="me-1" /> {isArabic ? "الفصل *" : "Class *"}
                  </Form.Label>
                  <Form.Select
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? "#2d2d44" : "white",
                      color: darkMode ? "#e9ecef" : "#212529",
                      borderRadius: "12px",
                    }}
                  >
                    <option value="">{isArabic ? "اختر الفصل" : "Select Class"}</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} {cls.level ? `(${getLevelDisplay(cls.level)})` : ""}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529" }}>
                    <FaGraduationCap className="me-1" /> {isArabic ? "المستوى" : "Level"}
                  </Form.Label>
                  <Form.Select
                    value={formData.educationLevel}
                    onChange={(e) => setFormData({ ...formData, educationLevel: e.target.value })}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? "#2d2d44" : "white",
                      color: darkMode ? "#e9ecef" : "#212529",
                      borderRadius: "12px",
                    }}
                  >
                    <option value="">{isArabic ? "اختر المستوى" : "Select Level"}</option>
                    {levelCategories.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529" }}>
                    <FaEnvelope className="me-1" /> {isArabic ? "البريد الإلكتروني *" : "Email *"}
                  </Form.Label>
                  <Form.Control
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder={isArabic ? "أدخل البريد الإلكتروني" : "Enter email"}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? "#2d2d44" : "white",
                      color: darkMode ? "#e9ecef" : "#212529",
                      borderRadius: "12px",
                    }}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529" }}>
                    <FaPhone className="me-1" /> {isArabic ? "رقم الهاتف" : "Phone"}
                  </Form.Label>
                  <Form.Control
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder={isArabic ? "أدخل رقم الهاتف" : "Enter phone"}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? "#2d2d44" : "white",
                      color: darkMode ? "#e9ecef" : "#212529",
                      borderRadius: "12px",
                    }}
                  />
                </Form.Group>
              </Col>
            </Row>
            {/* ===== PASSWORD FIELDS ===== */}
            <div className="section-divider mt-2">
              <span className="section-divider-label">
                <FaLock className="me-2" /> {isArabic ? "معلومات الحساب" : "Account Information"}
              </span>
            </div>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529" }}>
                    <FaLock className="me-1" /> {isArabic ? "كلمة المرور *" : "Password *"}
                  </Form.Label>
                  <InputGroup>
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder={isArabic ? "أدخل كلمة المرور" : "Enter password"}
                      style={{
                        ...arabicFontStyle,
                        background: darkMode ? "#2d2d44" : "white",
                        color: darkMode ? "#e9ecef" : "#212529",
                        borderRadius: "12px 0 0 12px",
                      }}
                    />
                    <Button
                      variant="outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ borderRadius: "0 12px 12px 0" }}
                    >
                      {showPassword ? <FaUnlock /> : <FaLock />}
                    </Button>
                  </InputGroup>
                  <Form.Text className="text-muted" style={arabicFontStyle}>
                    {isArabic ? "6 أحرف على الأقل" : "At least 6 characters"}
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529" }}>
                    <FaUnlock className="me-1" /> {isArabic ? "تأكيد كلمة المرور *" : "Confirm Password *"}
                  </Form.Label>
                  <Form.Control
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder={isArabic ? "أعد إدخال كلمة المرور" : "Re-enter password"}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? "#2d2d44" : "white",
                      color: darkMode ? "#e9ecef" : "#212529",
                      borderRadius: "12px",
                    }}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529" }}>
                    <FaUser className="me-1" /> {isArabic ? "ولي الأمر" : "Parent/Guardian"}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    placeholder={isArabic ? "اسم ولي الأمر" : "Parent/Guardian name"}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? "#2d2d44" : "white",
                      color: darkMode ? "#e9ecef" : "#212529",
                      borderRadius: "12px",
                    }}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529" }}>
                    <FaPhoneAlt className="me-1" /> {isArabic ? "هاتف ولي الأمر" : "Parent Phone"}
                  </Form.Label>
                  <Form.Control
                    type="tel"
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    placeholder={isArabic ? "رقم هاتف ولي الأمر" : "Parent phone number"}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? "#2d2d44" : "white",
                      color: darkMode ? "#e9ecef" : "#212529",
                      borderRadius: "12px",
                    }}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529" }}>
                    <FaAddressBook className="me-1" /> {isArabic ? "العنوان" : "Address"}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder={isArabic ? "أدخل العنوان" : "Enter address"}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? "#2d2d44" : "white",
                      color: darkMode ? "#e9ecef" : "#212529",
                      borderRadius: "12px",
                    }}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529" }}>
                    <FaCity className="me-1" /> {isArabic ? "المدينة" : "City"}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder={isArabic ? "أدخل المدينة" : "Enter city"}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? "#2d2d44" : "white",
                      color: darkMode ? "#e9ecef" : "#212529",
                      borderRadius: "12px",
                    }}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0" style={{ background: darkMode ? "#1a1a2e" : "white" }}>
          <Button variant="secondary" onClick={() => setShowAddModal(false)} disabled={processingAction} style={{ ...arabicFontStyle, borderRadius: "12px" }}>
            {isArabic ? "إلغاء" : "Cancel"}
          </Button>
          <Button variant="primary" onClick={handleSaveStudent} disabled={processingAction} style={{ ...arabicFontStyle, borderRadius: "12px" }}>
            {processingAction ? (
              <>
                <FaSpinner className="spinning me-2" />
                {isArabic ? "جاري..." : "Adding..."}
              </>
            ) : (
              <>
                <FaSave className="me-2" />
                {isArabic ? "إضافة طالب" : "Add Student"}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===== VIEW STUDENT MODAL (FIXED: now shows all fields) ===== */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} centered size="lg" className="modern-modal">
        <Modal.Header closeButton className="border-0" style={{ background: darkMode ? "#1a1a2e" : "white" }}>
          <Modal.Title style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529" }}>
            <FaUserGraduate className="me-2 text-primary" />
            {isArabic ? "تفاصيل الطالب" : "Student Details"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? "#0d1117" : "white" }}>
          {selectedStudent && (
            <div>
              <div className="d-flex align-items-center gap-4 mb-4">
                <div className="student-avatar-lg" style={{
                  width: isMobile ? "60px" : "80px",
                  height: isMobile ? "60px" : "80px",
                  borderRadius: "50%",
                  background: "rgba(74, 158, 255, 0.15)",
                  color: "#4a9eff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: isMobile ? "2rem" : "2.5rem",
                  flexShrink: 0,
                }}>
                  {(selectedStudent.firstName || selectedStudent.name || "U").charAt(0).toUpperCase()}
                </div>
                <div>
                  <h5 className="fw-bold mb-0" style={{ color: darkMode ? "#e9ecef" : "#212529" }}>
                    {selectedStudent.name || selectedStudent.firstName || "Unknown"}
                  </h5>
                  <p className="text-muted mb-0" style={arabicFontStyle}>
                    {isArabic ? "المعرف: " : "ID: "}{selectedStudent.id}
                  </p>
                  {selectedStudent.email && (
                    <p className="text-muted mb-0" style={arabicFontStyle}>
                      <FaEnvelope className="me-1" size={12} /> {selectedStudent.email}
                    </p>
                  )}
                  {selectedStudent.phone && (
                    <p className="text-muted mb-0" style={arabicFontStyle}>
                      <FaPhone className="me-1" size={12} /> {selectedStudent.phone}
                    </p>
                  )}
                  <div className="mt-1">
                    <Badge bg={getStatusBadge(selectedStudent.status)} style={{ borderRadius: "8px", fontSize: "0.7rem" }}>
                      {getStatusLabel(selectedStudent.status)}
                    </Badge>
                  </div>
                </div>
              </div>

              <Row className="g-3">
                {/* Full Name */}
                <Col md={6}>
                  <div className="detail-item">
                    <label className="text-muted small" style={arabicFontStyle}>
                      <FaUser className="me-1" /> {isArabic ? "الاسم الكامل" : "Full Name"}
                    </label>
                    <p className="fw-semibold mb-0" style={{ color: darkMode ? "#e9ecef" : "#212529" }}>
                      {selectedStudent.name || selectedStudent.firstName || "N/A"}
                    </p>
                  </div>
                </Col>

                {/* Class */}
                <Col md={6}>
                  <div className="detail-item">
                    <label className="text-muted small" style={arabicFontStyle}>
                      <FaSchool className="me-1" /> {isArabic ? "الفصل" : "Class"}
                    </label>
                    <p className="fw-semibold mb-0" style={{ color: darkMode ? "#e9ecef" : "#212529" }}>
                      {selectedStudent.className || selectedStudent.class || "N/A"}
                    </p>
                  </div>
                </Col>

                {/* Level */}
                <Col md={6}>
                  <div className="detail-item">
                    <label className="text-muted small" style={arabicFontStyle}>
                      <FaGraduationCap className="me-1" /> {isArabic ? "المستوى" : "Level"}
                    </label>
                    <p className="fw-semibold mb-0" style={{ color: darkMode ? "#e9ecef" : "#212529" }}>
                      {getLevelDisplay(selectedStudent.level || selectedStudent.educationLevel)}
                    </p>
                  </div>
                </Col>

                {/* Date of Birth */}
                <Col md={6}>
                  <div className="detail-item">
                    <label className="text-muted small" style={arabicFontStyle}>
                      <FaBirthdayCake className="me-1" /> {isArabic ? "تاريخ الميلاد" : "Date of Birth"}
                    </label>
                    <p className="fw-semibold mb-0" style={{ color: darkMode ? "#e9ecef" : "#212529" }}>
                      {selectedStudent.dateOfBirth || selectedStudent.dob || "N/A"}
                    </p>
                  </div>
                </Col>

                {/* Gender */}
                <Col md={6}>
                  <div className="detail-item">
                    <label className="text-muted small" style={arabicFontStyle}>
                      <FaVenusMars className="me-1" /> {isArabic ? "الجنس" : "Gender"}
                    </label>
                    <p className="fw-semibold mb-0" style={{ color: darkMode ? "#e9ecef" : "#212529" }}>
                      {selectedStudent.gender 
                        ? (isArabic 
                            ? (selectedStudent.gender === "male" ? "ذكر" : selectedStudent.gender === "female" ? "أنثى" : "أخرى")
                            : selectedStudent.gender.charAt(0).toUpperCase() + selectedStudent.gender.slice(1))
                        : "N/A"}
                    </p>
                  </div>
                </Col>

                {/* Nationality */}
                <Col md={6}>
                  <div className="detail-item">
                    <label className="text-muted small" style={arabicFontStyle}>
                      <FaGlobe className="me-1" /> {isArabic ? "الجنسية" : "Nationality"}
                    </label>
                    <p className="fw-semibold mb-0" style={{ color: darkMode ? "#e9ecef" : "#212529" }}>
                      {selectedStudent.nationality || "N/A"}
                    </p>
                  </div>
                </Col>

                {/* City */}
                <Col md={6}>
                  <div className="detail-item">
                    <label className="text-muted small" style={arabicFontStyle}>
                      <FaCity className="me-1" /> {isArabic ? "المدينة" : "City"}
                    </label>
                    <p className="fw-semibold mb-0" style={{ color: darkMode ? "#e9ecef" : "#212529" }}>
                      {selectedStudent.city || "N/A"}
                    </p>
                  </div>
                </Col>

                {/* Email (repeated for clarity) */}
                <Col md={6}>
                  <div className="detail-item">
                    <label className="text-muted small" style={arabicFontStyle}>
                      <FaEnvelope className="me-1" /> {isArabic ? "البريد الإلكتروني" : "Email"}
                    </label>
                    <p className="fw-semibold mb-0" style={{ color: darkMode ? "#e9ecef" : "#212529" }}>
                      {selectedStudent.email || "N/A"}
                    </p>
                  </div>
                </Col>

                {/* Phone (repeated) */}
                <Col md={6}>
                  <div className="detail-item">
                    <label className="text-muted small" style={arabicFontStyle}>
                      <FaPhone className="me-1" /> {isArabic ? "رقم الهاتف" : "Phone"}
                    </label>
                    <p className="fw-semibold mb-0" style={{ color: darkMode ? "#e9ecef" : "#212529" }}>
                      {selectedStudent.phone || "N/A"}
                    </p>
                  </div>
                </Col>

                {/* Address */}
                {selectedStudent.address && (
                  <Col md={12}>
                    <div className="detail-item">
                      <label className="text-muted small" style={arabicFontStyle}>
                        <FaMapMarkerAlt className="me-1" /> {isArabic ? "العنوان" : "Address"}
                      </label>
                      <p className="fw-semibold mb-0" style={{ color: darkMode ? "#e9ecef" : "#212529" }}>
                        {selectedStudent.address}
                      </p>
                    </div>
                  </Col>
                )}

                {/* Parent/Guardian */}
                {selectedStudent.parentName && (
                  <Col md={12}>
                    <div className="detail-item">
                      <label className="text-muted small" style={arabicFontStyle}>
                        <FaUsers className="me-1" /> {isArabic ? "ولي الأمر" : "Parent/Guardian"}
                      </label>
                      <p className="fw-semibold mb-0" style={{ color: darkMode ? "#e9ecef" : "#212529" }}>
                        {selectedStudent.parentName}
                        {selectedStudent.parentPhone && (
                          <span className="text-muted ms-2" style={arabicFontStyle}>
                            <FaPhone className="me-1" size={12} /> {selectedStudent.parentPhone}
                          </span>
                        )}
                        {selectedStudent.parentEmail && (
                          <span className="text-muted ms-2" style={arabicFontStyle}>
                            <FaEnvelope className="me-1" size={12} /> {selectedStudent.parentEmail}
                          </span>
                        )}
                      </p>
                    </div>
                  </Col>
                )}
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0" style={{ background: darkMode ? "#1a1a2e" : "white" }}>
          <Button variant="secondary" onClick={() => setShowViewModal(false)} style={{ ...arabicFontStyle, borderRadius: "12px" }}>
            {isArabic ? "إغلاق" : "Close"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===== EDIT STUDENT MODAL ===== */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered size="lg" className="modern-modal">
        <Modal.Header closeButton className="border-0" style={{ background: darkMode ? "#1a1a2e" : "white" }}>
          <Modal.Title style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529" }}>
            <FaEdit className="me-2 text-warning" />
            {isArabic ? "تعديل بيانات الطالب" : "Edit Student"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? "#0d1117" : "white" }}>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529" }}>
                    {isArabic ? "الاسم الأول *" : "First Name *"}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={editFormData.firstName}
                    onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? "#2d2d44" : "white",
                      color: darkMode ? "#e9ecef" : "#212529",
                      borderRadius: "12px",
                    }}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529" }}>
                    {isArabic ? "الاسم الأخير *" : "Last Name *"}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={editFormData.lastName}
                    onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? "#2d2d44" : "white",
                      color: darkMode ? "#e9ecef" : "#212529",
                      borderRadius: "12px",
                    }}
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* ===== FIX: ADDED DOB & GENDER ROW IN EDIT MODAL ===== */}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529" }}>
                    <FaBirthdayCake className="me-1" /> {isArabic ? "تاريخ الميلاد *" : "Date of Birth *"}
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={editFormData.dateOfBirth}
                    onChange={(e) => setEditFormData({ ...editFormData, dateOfBirth: e.target.value })}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? "#2d2d44" : "white",
                      color: darkMode ? "#e9ecef" : "#212529",
                      borderRadius: "12px",
                    }}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529" }}>
                    <FaVenusMars className="me-1" /> {isArabic ? "الجنس *" : "Gender *"}
                  </Form.Label>
                  <Form.Select
                    value={editFormData.gender}
                    onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? "#2d2d44" : "white",
                      color: darkMode ? "#e9ecef" : "#212529",
                      borderRadius: "12px",
                    }}
                  >
                    <option value="">{isArabic ? "اختر الجنس" : "Select Gender"}</option>
                    {genderOptions.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529" }}>
                    <FaSchool className="me-1" /> {isArabic ? "الفصل *" : "Class *"}
                  </Form.Label>
                  <Form.Select
                    value={editFormData.classId}
                    onChange={(e) => setEditFormData({ ...editFormData, classId: e.target.value })}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? "#2d2d44" : "white",
                      color: darkMode ? "#e9ecef" : "#212529",
                      borderRadius: "12px",
                    }}
                  >
                    <option value="">{isArabic ? "اختر الفصل" : "Select Class"}</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529" }}>
                    <FaGraduationCap className="me-1" /> {isArabic ? "المستوى" : "Level"}
                  </Form.Label>
                  <Form.Select
                    value={editFormData.educationLevel}
                    onChange={(e) => setEditFormData({ ...editFormData, educationLevel: e.target.value })}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? "#2d2d44" : "white",
                      color: darkMode ? "#e9ecef" : "#212529",
                      borderRadius: "12px",
                    }}
                  >
                    <option value="">{isArabic ? "اختر المستوى" : "Select Level"}</option>
                    {levelCategories.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529" }}>
                    <FaEnvelope className="me-1" /> {isArabic ? "البريد الإلكتروني" : "Email"}
                  </Form.Label>
                  <Form.Control
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? "#2d2d44" : "white",
                      color: darkMode ? "#e9ecef" : "#212529",
                      borderRadius: "12px",
                    }}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529" }}>
                    <FaPhone className="me-1" /> {isArabic ? "رقم الهاتف" : "Phone"}
                  </Form.Label>
                  <Form.Control
                    type="tel"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? "#2d2d44" : "white",
                      color: darkMode ? "#e9ecef" : "#212529",
                      borderRadius: "12px",
                    }}
                  />
                </Form.Group>
              </Col>
            </Row>
            {/* ===== PASSWORD FIELDS IN EDIT ===== */}
            <div className="section-divider mt-2">
              <span className="section-divider-label">
                <FaLock className="me-2" /> {isArabic ? "تغيير كلمة المرور" : "Change Password"}
              </span>
            </div>
            <p className="text-muted small" style={arabicFontStyle}>
              {isArabic ? "اترك الحقول فارغة إذا لم تريد تغيير كلمة المرور" : "Leave blank if you don't want to change the password"}
            </p>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529" }}>
                    <FaLock className="me-1" /> {isArabic ? "كلمة المرور الجديدة" : "New Password"}
                  </Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="password"
                      value={editFormData.password}
                      onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                      placeholder={isArabic ? "كلمة مرور جديدة" : "New password"}
                      style={{
                        ...arabicFontStyle,
                        background: darkMode ? "#2d2d44" : "white",
                        color: darkMode ? "#e9ecef" : "#212529",
                        borderRadius: "12px 0 0 12px",
                      }}
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529" }}>
                    <FaUnlock className="me-1" /> {isArabic ? "تأكيد كلمة المرور" : "Confirm Password"}
                  </Form.Label>
                  <Form.Control
                    type="password"
                    value={editFormData.confirmPassword}
                    onChange={(e) => setEditFormData({ ...editFormData, confirmPassword: e.target.value })}
                    placeholder={isArabic ? "أعد إدخال كلمة المرور" : "Re-enter password"}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? "#2d2d44" : "white",
                      color: darkMode ? "#e9ecef" : "#212529",
                      borderRadius: "12px",
                    }}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529" }}>
                    <FaUser className="me-1" /> {isArabic ? "ولي الأمر" : "Parent/Guardian"}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={editFormData.parentName}
                    onChange={(e) => setEditFormData({ ...editFormData, parentName: e.target.value })}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? "#2d2d44" : "white",
                      color: darkMode ? "#e9ecef" : "#212529",
                      borderRadius: "12px",
                    }}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529" }}>
                    <FaPhoneAlt className="me-1" /> {isArabic ? "هاتف ولي الأمر" : "Parent Phone"}
                  </Form.Label>
                  <Form.Control
                    type="tel"
                    value={editFormData.parentPhone}
                    onChange={(e) => setEditFormData({ ...editFormData, parentPhone: e.target.value })}
                    style={{
                      ...arabicFontStyle,
                      background: darkMode ? "#2d2d44" : "white",
                      color: darkMode ? "#e9ecef" : "#212529",
                      borderRadius: "12px",
                    }}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529" }}>
                {isArabic ? "الحالة" : "Status"}
              </Form.Label>
              <Form.Select
                value={editFormData.status}
                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                style={{
                  ...arabicFontStyle,
                  background: darkMode ? "#2d2d44" : "white",
                  color: darkMode ? "#e9ecef" : "#212529",
                  borderRadius: "12px",
                }}
              >
                <option value="active">{isArabic ? "نشط" : "Active"}</option>
                <option value="inactive">{isArabic ? "غير نشط" : "Inactive"}</option>
                <option value="suspended">{isArabic ? "موقوف" : "Suspended"}</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0" style={{ background: darkMode ? "#1a1a2e" : "white" }}>
          <Button variant="secondary" onClick={() => setShowEditModal(false)} disabled={processingAction} style={{ ...arabicFontStyle, borderRadius: "12px" }}>
            {isArabic ? "إلغاء" : "Cancel"}
          </Button>
          <Button variant="warning" onClick={handleUpdateStudent} disabled={processingAction} style={{ ...arabicFontStyle, borderRadius: "12px" }}>
            {processingAction ? (
              <>
                <FaSpinner className="spinning me-2" />
                {isArabic ? "جاري..." : "Saving..."}
              </>
            ) : (
              <>
                <FaSave className="me-2" />
                {isArabic ? "تحديث" : "Update"}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===== DELETE CONFIRMATION MODAL ===== */}
      <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered className="modern-modal">
        <Modal.Header closeButton className="border-0" style={{ background: darkMode ? "#1a1a2e" : "white" }}>
          <Modal.Title style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529" }}>
            <FaExclamationTriangle className="me-2 text-danger" />
            {isArabic ? "تأكيد الحذف" : "Confirm Delete"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? "#0d1117" : "white" }}>
          <p style={{ ...arabicFontStyle, color: darkMode ? "#e9ecef" : "#212529" }}>
            {isArabic
              ? `هل أنت متأكد من حذف الطالب "${selectedStudent?.name || selectedStudent?.firstName || 'Unknown'}"؟ هذا الإجراء لا يمكن التراجع عنه.`
              : `Are you sure you want to delete student "${selectedStudent?.name || selectedStudent?.firstName || 'Unknown'}"? This action cannot be undone.`}
          </p>
        </Modal.Body>
        <Modal.Footer className="border-0" style={{ background: darkMode ? "#1a1a2e" : "white" }}>
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)} disabled={processingAction} style={{ ...arabicFontStyle, borderRadius: "12px" }}>
            {isArabic ? "إلغاء" : "Cancel"}
          </Button>
          <Button variant="danger" onClick={handleDeleteStudent} disabled={processingAction} style={{ ...arabicFontStyle, borderRadius: "12px" }}>
            {processingAction ? (
              <>
                <FaSpinner className="spinning me-2" />
                {isArabic ? "جاري..." : "Deleting..."}
              </>
            ) : (
              <>
                <FaTrash className="me-2" />
                {isArabic ? "تأكيد الحذف" : "Confirm Delete"}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .students-management {
          padding: 0;
          max-width: 100vw;
          overflow-x: hidden;
        }

        .students-management * {
          box-sizing: border-box;
        }

        .min-width-0 {
          min-width: 0;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .modern-card {
          border-radius: 16px !important;
          border: 1px solid ${darkMode ? '#2d2d44' : '#e9ecef'} !important;
          transition: all 0.3s ease;
          overflow: hidden;
          background: ${darkMode ? '#1a1a2e' : '#ffffff'} !important;
        }

        .modern-modal .modal-content {
          border-radius: 20px !important;
          border: none !important;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
          overflow: hidden;
        }

        .stats-card-enhanced {
          transition: all 0.3s ease;
        }

        .stats-card-enhanced:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 30px rgba(0,0,0,0.08) !important;
        }

        .stats-card-topbar {
          transition: height 0.3s ease;
        }

        .stats-card-enhanced:hover .stats-card-topbar {
          height: 6px;
        }

        .stats-icon-wrapper {
          transition: transform 0.3s ease;
        }

        .stats-card-enhanced:hover .stats-icon-wrapper {
          transform: scale(1.1);
        }

        .student-avatar-sm {
          transition: transform 0.3s ease;
        }

        .student-avatar-sm:hover {
          transform: scale(1.15);
        }

        .student-avatar-lg {
          transition: transform 0.3s ease;
        }

        .student-avatar-lg:hover {
          transform: scale(1.05);
        }

        .detail-item {
          padding: 4px 0;
        }

        .detail-item label {
          display: block;
          font-size: 0.7rem;
          color: #6c757d;
          margin-bottom: 2px;
          font-weight: 500;
        }

        .detail-item p {
          font-size: 0.95rem;
          margin-bottom: 0;
        }

        .section-divider {
          display: flex;
          align-items: center;
          margin: 16px 0 12px;
        }

        .section-divider::before {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(to right, transparent, ${darkMode ? '#2d2d44' : '#e9ecef'});
        }

        .section-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(to left, transparent, ${darkMode ? '#2d2d44' : '#e9ecef'});
        }

        .section-divider-label {
          padding: 0 16px;
          font-weight: 600;
          font-size: clamp(0.7rem, 0.9vw, 0.85rem);
          color: ${darkMode ? '#adb5bd' : '#6c757d'};
          white-space: nowrap;
        }

        /* ===== RTL FIXES ===== */
        [dir="rtl"] .me-1 {
          margin-right: 0 !important;
          margin-left: 0.25rem !important;
        }
        [dir="rtl"] .me-2 {
          margin-right: 0 !important;
          margin-left: 0.5rem !important;
        }
        [dir="rtl"] .ms-1 {
          margin-left: 0 !important;
          margin-right: 0.25rem !important;
        }
        [dir="rtl"] .ms-2 {
          margin-left: 0 !important;
          margin-right: 0.5rem !important;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 768px) {
          .table-responsive {
            font-size: 0.75rem;
          }
          .table td, .table th {
            padding: 4px 6px !important;
          }
          .student-avatar-sm {
            width: 28px !important;
            height: 28px !important;
            font-size: 0.6rem !important;
          }
        }

        @media (max-width: 576px) {
          .page-header {
            flex-direction: column;
            align-items: stretch !important;
          }
          .page-header .d-flex {
            flex-wrap: wrap;
            gap: 4px !important;
          }
          .page-header .btn {
            font-size: 0.6rem !important;
            padding: 3px 8px !important;
          }
          .stats-card-enhanced .p-2 {
            padding: 8px !important;
          }
          .stats-card-enhanced h2 {
            font-size: 1rem !important;
          }
          .stats-card-enhanced .stats-icon-wrapper {
            padding: 4px !important;
          }
          .stats-card-enhanced .stats-icon-wrapper svg {
            width: 16px !important;
            height: 16px !important;
          }
          .table td, .table th {
            font-size: 0.65rem !important;
            padding: 3px 4px !important;
          }
          .table .btn {
            padding: 1px 4px !important;
            font-size: 0.5rem !important;
          }
          .table .btn svg {
            width: 10px !important;
            height: 10px !important;
          }
          .modern-modal .modal-header {
            padding: 12px 16px 0 !important;
          }
          .modern-modal .modal-body {
            padding: 12px 16px 16px !important;
          }
          .modern-modal .modal-footer {
            padding: 8px 16px 16px !important;
          }
          .modal .form-control,
          .modal .form-select {
            font-size: 0.8rem !important;
          }
        }

        @media (max-width: 400px) {
          .table td, .table th {
            font-size: 0.55rem !important;
            padding: 2px 3px !important;
          }
          .table .btn {
            padding: 1px 3px !important;
            font-size: 0.45rem !important;
          }
          .table .btn svg {
            width: 8px !important;
            height: 8px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default StudentsManagement;