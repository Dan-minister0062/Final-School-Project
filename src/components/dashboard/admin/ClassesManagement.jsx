// src/components/dashboard/admin/ClassesManagement.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Row, Col, Card, Badge, Button, Table, 
  Modal, Form, Alert, InputGroup, Pagination, ProgressBar 
} from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaBuilding, FaChalkboardTeacher, FaUserGraduate, FaClock,
  FaChevronDown, FaChevronUp, FaSchool,
  FaStar, FaUsers, FaCalendarAlt, FaMapMarkerAlt,
  FaCheckCircle, FaTimesCircle, FaInfoCircle, FaExclamationTriangle,
  FaDownload, FaPrint, FaSync,
  FaBookOpen, FaChalkboard,
  FaChild, FaBook, FaGraduationCap, FaAward,
  FaUserTie, FaChartLine, FaClipboardList,
  FaPlus, FaEdit, FaTrash, FaEye, FaSearch,
  FaSpinner, FaSave, FaTimes, FaFilter, FaRocket,
  FaUserCircle
} from 'react-icons/fa';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../hooks/useAuth';
import { useNotification } from '../../../hooks/useNotification';
import api from '../../../services/api';
import { syncGet, syncSend } from '../../../services/apiSync';
import { getAuthIdentity } from '../../../services/api';
import { format, formatDistanceToNow, isValid } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

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
  if (num === undefined || num === null) return '0';
  return num.toString();
};

const ClassesManagement = () => {
  const { isArabic } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notify } = useNotification();
  const tableRef = useRef(null);

  // ===== STATE =====
  const [classes, setClasses] = useState([]);
  const [allClassesData, setAllClassesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [processingAction, setProcessingAction] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [itemsPerPage] = useState(10);
  const [isMobile, setIsMobile] = useState(false);

  // ===== REAL DATA FROM SERVICES =====
  const [teachersData, setTeachersData] = useState([]);
  const [studentsData, setStudentsData] = useState([]);
  const [allUsersData, setAllUsersData] = useState([]);

  // ===== FORM DATA =====
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    level: 'primary',
    teacherId: '',
    capacity: 30,
    schedule: '8:00 - 2:00',
    isActive: true,
    subject: '',
    educationLevel: 'primary',
    academicYear: new Date().getFullYear() + '/' + (new Date().getFullYear() + 1)
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    nameAr: '',
    level: 'primary',
    teacherId: '',
    capacity: 30,
    schedule: '8:00 - 2:00',
    isActive: true,
    subject: '',
    educationLevel: 'primary',
    academicYear: new Date().getFullYear() + '/' + (new Date().getFullYear() + 1)
  });

  // ===== LEVELS =====
  const levelCategories = [
    { value: 'kindergarten', label: isArabic ? 'أولي' : 'Kindergarten', icon: <FaChild />, color: '#f39c12' },
    { value: 'primary', label: isArabic ? 'ابتدائي' : 'Primary', icon: <FaBook />, color: '#2d6a4f' },
    { value: 'secondary', label: isArabic ? 'إعدادي' : 'Secondary', icon: <FaGraduationCap />, color: '#c49a6c' },
    { value: 'high_school', label: isArabic ? 'ثانوي' : 'High School', icon: <FaAward />, color: '#9b59b6' }
  ];

  // ===== FETCH TEACHERS DATA =====
  const fetchTeachersData = async () => {
    try {
      const res = await syncGet('/users', { role: 'teacher' });
      const rows = Array.isArray(res?.data) ? res.data : [];
      const teachers = rows.map((r) => ({
        ...r,
        id: r._serverId ?? r.id,
        _serverId: r._serverId ?? r.id,
        name: r.name || r.full_name || `${r.first_name || ''} ${r.last_name || ''}`.trim(),
        firstName: r.first_name || '',
        lastName: r.last_name || '',
      }));
      setTeachersData(teachers);
      return teachers;
    } catch (error) {
      console.error('Error fetching teachers:', error);
      return [];
    }
  };

  // ===== FETCH STUDENTS DATA =====
  const fetchStudentsData = async () => {
    try {
      const res = await syncGet('/students');
      const rows = Array.isArray(res?.data) ? res.data : [];
      const students = rows.map((r) => ({
        ...r,
        id: r._serverId ?? r.id,
        _serverId: r._serverId ?? r.id,
        name: r.name || r.full_name || `${r.first_name || ''} ${r.last_name || ''}`.trim(),
        classId: r.classId || r.class_id || r.class || '',
        class: r.className || '',
      }));
      setStudentsData(students);
      return students;
    } catch (error) {
      console.error('Error fetching students:', error);
      return [];
    }
  };

  // ===== FETCH ALL USERS =====
  const fetchAllUsers = async () => {
    try {
      const res = await syncGet('/users');
      const rows = Array.isArray(res?.data) ? res.data : [];
      const users = rows.map((r) => ({
        ...r,
        id: r._serverId ?? r.id,
        _serverId: r._serverId ?? r.id,
        name: r.name || `${r.first_name || ''} ${r.last_name || ''}`.trim(),
      }));
      setAllUsersData(users);
      return users;
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  };

  // ===== CHECK DARK MODE & MOBILE =====
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.getAttribute('data-bs-theme') === 'dark' ||
        document.querySelector('.dashboard-wrapper.dark-theme') !== null;
      setDarkMode(isDark);
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-bs-theme'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ===== ARABIC FONT STYLE =====
  const arabicFontStyle = {
    fontFamily: isArabic ? '"Hacen Tunisia", "Hacen Tunisia Bd", "Noto Sans Arabic", "Vazirmatn", "Traditional Arabic", "Arabic Typesetting", serif' : 'inherit',
    lineHeight: isArabic ? '1.8' : '1.6',
    letterSpacing: isArabic ? '0.5px' : '0px',
    fontSize: isArabic ? 'clamp(0.95rem, 1.2vw, 1.1rem)' : 'clamp(0.9rem, 1.1vw, 1.05rem)',
  };

  // ===== GET LEVEL DISPLAY =====
  const getLevelDisplay = (level) => {
    const found = levelCategories.find(c => c.value === level);
    return found ? found.label : level;
  };

  const getLevelIcon = (level) => {
    const found = levelCategories.find(c => c.value === level);
    return found ? found.icon : <FaSchool />;
  };

  const getLevelColor = (level) => {
    const found = levelCategories.find(c => c.value === level);
    return found ? found.color : '#6c757d';
  };

  // ===== GET COUNTS FOR EACH LEVEL =====
  const getLevelCounts = () => {
    const counts = {};
    levelCategories.forEach(cat => {
      counts[cat.value] = allClassesData.filter(c => c.level === cat.value).length;
    });
    return counts;
  };

  // ===== GET TEACHER NAME BY ID =====
  const getTeacherNameById = (teacherId) => {
    if (!teacherId) return null;
    
    // Check in teachersData
    let teacher = teachersData.find(t => t.id === teacherId);
    if (teacher) {
      return teacher.name || teacher.displayName || `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim();
    }
    
    // Check in allUsersData
    teacher = allUsersData.find(u => u.id === teacherId);
    if (teacher) {
      return teacher.name || `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim();
    }
    
    return null;
  };

  // ===== GET STUDENTS BY CLASS ID =====
  const getStudentsByClassId = (classId) => {
    if (!classId) return [];
    
    // Check if students have classId field
    let students = studentsData.filter(s => s.classId === classId);
    
    // If no students found, try matching by class name
    if (students.length === 0) {
      const classData = allClassesData.find(c => c.id === classId);
      if (classData) {
        students = studentsData.filter(s => s.class === classData.name || s.classId === classData.name);
      }
    }
    
    return students;
  };

  // ===== FETCH CLASSES =====
  const fetchClasses = async () => {
    setLoading(true);
    setError(null);

    try {
      const [teachers, students] = await Promise.all([
        fetchTeachersData(),
        fetchStudentsData(),
        fetchAllUsers(),
      ]);

      const serverOk = !!getAuthIdentity();
      let serverClasses = [];

      if (serverOk) {
        try {
          const serverRes = await syncGet('/classes');
          const serverList = Array.isArray(serverRes?.data)
            ? serverRes.data
            : Array.isArray(serverRes?.data?.data)
              ? serverRes.data.data
              : [];
          serverClasses = (Array.isArray(serverList) ? serverList : []).map(c => {
            const clsId = c.code || String(c.id);
            const classStudents = getStudentsByClassId(clsId);
            let teacherName = null;
            let teacherId = c.teacherId || null;
            if (teacherId) {
              teacherName = getTeacherNameById(teacherId);
            }
            if (!teacherName && c.teacher_name) {
              teacherName = c.teacher_name;
            }
            return {
              ...c,
              id: clsId,
              code: clsId,
              name: c.name,
              nameAr: c.nameAr || c.name,
              level: c.level_key || c.level || 'primary',
              educationLevel: c.level_key || c.level || 'primary',
              teacher: teacherName || (isArabic ? 'غير معين' : 'Not Assigned'),
              teacherId: teacherId,
              capacity: c.capacity || 30,
              schedule: c.room || '8:00 - 2:00',
              room: c.room || '',
              isActive: c.status !== 'inactive',
              academicYear: c.academic_year || '',
              students: classStudents.length || c.students_count || 0,
              studentCount: classStudents.length || c.students_count || 0,
              studentsList: classStudents,
              source: 'server',
            };
          });
        } catch (err) {
          console.warn('⚠️ Server classes unavailable:', err);
        }
      }

      if (serverClasses.length > 0) {
        setAllClassesData(serverClasses);
        filterAndPaginateClasses(serverClasses);
        return;
      }

      // No classes exist in MySQL yet — show empty state rather than fabricating data
      setAllClassesData([]);
      filterAndPaginateClasses([]);
    } catch (error) {
      console.error('Error fetching classes:', error);
      setError(isArabic ? 'فشل في تحميل الفصول' : 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  // ===== FILTER AND PAGINATE CLASSES =====
  const filterAndPaginateClasses = (classesData) => {
    let filtered = [...classesData];
    
    if (filterLevel !== 'all') {
      filtered = filtered.filter(c => c.level === filterLevel);
    }
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(searchLower) ||
        c.teacher.toLowerCase().includes(searchLower)
      );
    }
    
    setTotalItems(filtered.length);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginated = filtered.slice(start, end);
    setClasses(paginated);
  };

  // ===== LISTEN FOR USER DATA CHANGES =====
  useEffect(() => {
    fetchTeachersData();
    fetchStudentsData();
    fetchAllUsers();
    fetchClasses();

    const handleUsersUpdated = () => {
      console.log('🔄 Users updated, refreshing classes...');
      fetchTeachersData();
      fetchStudentsData();
      fetchAllUsers();
      fetchClasses();
    };

    const handleDataUpdated = () => {
      console.log('🔄 Data updated, refreshing classes...');
      fetchClasses();
    };

    window.addEventListener('usersUpdated', handleUsersUpdated);
    window.addEventListener('classesUpdated', handleDataUpdated);

    return () => {
      window.removeEventListener('usersUpdated', handleUsersUpdated);
      window.removeEventListener('classesUpdated', handleDataUpdated);
    };
  }, []);

  // ===== EFFECTS =====
  useEffect(() => {
    if (allClassesData.length > 0) {
      filterAndPaginateClasses(allClassesData);
    }
  }, [currentPage, filterLevel, searchTerm]);

  // ===== HANDLE ADD CLASS =====
  const handleAddClass = async () => {
    if (!formData.name || !formData.level) {
      notify(
        isArabic ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields',
        'warning'
      );
      return;
    }

    setProcessingAction(true);
    try {
      // Get teacher name from ID
      let teacherName = isArabic ? 'غير معين' : 'Not Assigned';
      let teacherId = formData.teacherId || null;
      
      if (teacherId) {
        const foundTeacher = getTeacherNameById(teacherId);
        if (foundTeacher) {
          teacherName = foundTeacher;
        }
      }

      let newClass = {
        id: `CLS${String(allClassesData.length + 1).padStart(3, '0')}`,
        name: formData.name,
        nameAr: formData.nameAr || formData.name,
        level: formData.level,
        teacher: teacherName,
        teacherId: teacherId,
        capacity: formData.capacity || 30,
        schedule: formData.schedule || '8:00 - 2:00',
        isActive: formData.isActive !== false,
        subject: formData.subject || '',
        educationLevel: formData.level,
        academicYear: formData.academicYear || new Date().getFullYear() + '/' + (new Date().getFullYear() + 1),
        students: 0,
        studentCount: 0,
        studentsList: [],
        created_at: new Date().toISOString()
      };

      // Persist to MySQL when online
      if (getAuthIdentity()) {
        const res = await syncSend('post', '/classes', {
          code: newClass.id,
          name: newClass.name,
          level_key: newClass.level,
          capacity: newClass.capacity,
          academic_year: newClass.academicYear,
          room: newClass.schedule,
          teacher_name: teacherName,
          isActive: newClass.isActive,
        });
        const created = res?.data?.data || res?.data || {};
        const serverCode = created.code || created.id;
        if (serverCode && serverCode !== newClass.id) {
          newClass = { ...newClass, id: serverCode, code: serverCode, source: 'server' };
        }
      }

      // Persist teacher assignment to MySQL
      if (teacherId) {
        persistTeacherAssignedClasses(teacherId, newClass.id, true);
      }

      const updatedClasses = [...allClassesData, newClass];
      setAllClassesData(updatedClasses);
      filterAndPaginateClasses(updatedClasses);

      notify(
        isArabic ? 'تم إضافة الفصل بنجاح' : 'Class added successfully',
        'success'
      );
      
      setShowAddModal(false);
      resetFormData();
    } catch (error) {
      console.error('Error adding class:', error);
      notify(
        isArabic ? 'فشل في إضافة الفصل' : 'Failed to add class',
        'error'
      );
    } finally {
      setProcessingAction(false);
    }
  };

  // ===== RESET FORM DATA =====
  const resetFormData = () => {
    setFormData({
      name: '',
      nameAr: '',
      level: 'primary',
      teacherId: '',
      capacity: 30,
      schedule: '8:00 - 2:00',
      isActive: true,
      subject: '',
      educationLevel: 'primary',
      academicYear: new Date().getFullYear() + '/' + (new Date().getFullYear() + 1)
    });
  };

  // ===== PERSIST TEACHER ASSIGNMENT TO MYSQL =====
  const persistTeacherAssignedClasses = (teacherId, classId, add = true) => {
    if (!teacherId) return;
    if (!getAuthIdentity()) return;
    try {
      const teacher = teachersData.find((t) => t.id === teacherId) ||
        allUsersData.find((u) => u.id === teacherId);
      if (!teacher || !teacher._serverId) return;
      const current = Array.isArray(teacher.assignedClasses)
        ? teacher.assignedClasses
        : Array.isArray(teacher.assigned_classes)
          ? teacher.assigned_classes
          : Array.isArray(teacher.classes)
            ? teacher.classes
            : [];
      const next = add
        ? current.includes(classId) ? current : [...current, classId]
        : current.filter((c) => c !== classId);
      syncSend('put', `/users/${teacher._serverId}`, { assignedClasses: next })
        .catch((e) => console.warn('⚠️ Teacher assigned classes not persisted:', e));
    } catch (e) {
      console.warn('⚠️ Could not persist teacher assigned classes:', e);
    }
  };

  // ===== HANDLE EDIT CLASS =====
  const handleEditClass = (cls) => {
    setSelectedClass(cls);
    setEditFormData({
      name: cls.name,
      nameAr: cls.nameAr || '',
      level: cls.level,
      teacherId: cls.teacherId || '',
      capacity: cls.capacity || 30,
      schedule: cls.schedule || '8:00 - 2:00',
      isActive: cls.isActive !== false,
      subject: cls.subject || '',
      educationLevel: cls.educationLevel || cls.level,
      academicYear: cls.academicYear || new Date().getFullYear() + '/' + (new Date().getFullYear() + 1)
    });
    setShowEditModal(true);
  };

  // ===== HANDLE SAVE EDIT =====
  const handleSaveEdit = async () => {
    setProcessingAction(true);
    try {
      // Get teacher name from ID
      let teacherName = isArabic ? 'غير معين' : 'Not Assigned';
      let teacherId = editFormData.teacherId || null;
      
      if (teacherId) {
        const foundTeacher = getTeacherNameById(teacherId);
        if (foundTeacher) {
          teacherName = foundTeacher;
        }
      }

      const updatedClasses = allClassesData.map(c => 
        c.id === selectedClass.id ? { 
          ...c, 
          name: editFormData.name,
          nameAr: editFormData.nameAr || editFormData.name,
          level: editFormData.level,
          teacher: teacherName,
          teacherId: teacherId,
          capacity: editFormData.capacity || 30,
          schedule: editFormData.schedule || '8:00 - 2:00',
          isActive: editFormData.isActive !== false,
          subject: editFormData.subject || '',
          educationLevel: editFormData.educationLevel || editFormData.level,
          academicYear: editFormData.academicYear || new Date().getFullYear() + '/' + (new Date().getFullYear() + 1),
          updated_at: new Date().toISOString()
        } : c
      );
      
      setAllClassesData(updatedClasses);
      filterAndPaginateClasses(updatedClasses);

      // Keep teacher assignments in sync (moved from old teacher to new one)
      const oldTeacherId = selectedClass.teacherId || null;
      if (teacherId && teacherId !== oldTeacherId) {
        persistTeacherAssignedClasses(teacherId, selectedClass.id, true);
      }
      if (oldTeacherId && teacherId !== oldTeacherId) {
        persistTeacherAssignedClasses(oldTeacherId, selectedClass.id, false);
      }

      // Persist to MySQL when online
      const serverOkGuard = getAuthIdentity();
      if (serverOkGuard) {
        const classCode = selectedClass.code || selectedClass.id;
        if (classCode) {
          syncSend('put', `/classes/${encodeURIComponent(classCode)}`, {
            name: editFormData.name,
            level_key: editFormData.level,
            capacity: editFormData.capacity || 30,
            academic_year: editFormData.academicYear,
            room: editFormData.schedule,
            teacher_name: teacherName,
            isActive: editFormData.isActive !== false,
          }).catch((e) => console.warn('⚠️ Class update not persisted to server:', e));
        }
      }

      notify(
        isArabic ? 'تم تحديث الفصل بنجاح' : 'Class updated successfully',
        'success'
      );
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating class:', error);
      notify(
        isArabic ? 'فشل في تحديث الفصل' : 'Failed to update class',
        'error'
      );
    } finally {
      setProcessingAction(false);
    }
  };

  // ===== HANDLE DELETE CLASS =====
  const handleDeleteClass = async () => {
    setProcessingAction(true);
    try {
      const updatedClasses = allClassesData.filter(c => c.id !== selectedClass.id);
      setAllClassesData(updatedClasses);
      filterAndPaginateClasses(updatedClasses);

      // Remove the class from the assigned teacher's list
      const deletedTeacherId = selectedClass.teacherId || null;
      if (deletedTeacherId) {
        persistTeacherAssignedClasses(deletedTeacherId, selectedClass.id, false);
      }

      // Delete from MySQL when online
      if (getAuthIdentity()) {
        const classCode = selectedClass.code || selectedClass.id;
        if (classCode) {
          syncSend('delete', `/classes/${encodeURIComponent(classCode)}`)
            .catch((e) => console.warn('⚠️ Class not deleted from server:', e));
        }
      }

      notify(
        isArabic ? 'تم حذف الفصل بنجاح' : 'Class deleted successfully',
        'success'
      );
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting class:', error);
      notify(
        isArabic ? 'فشل في حذف الفصل' : 'Failed to delete class',
        'error'
      );
    } finally {
      setProcessingAction(false);
    }
  };

  // ===== HANDLE VIEW CLASS =====
  const handleViewClass = (cls) => {
    setSelectedClass(cls);
    setShowViewModal(true);
  };

  // ===== HANDLE TOGGLE STATUS =====
  const handleToggleStatus = async (classId, currentStatus) => {
    const newStatus = !currentStatus;
    try {
      const updatedClasses = allClassesData.map(c => 
        c.id === classId ? { ...c, isActive: newStatus } : c
      );
      setAllClassesData(updatedClasses);
      filterAndPaginateClasses(updatedClasses);

      // Persist status to MySQL when online
      if (getAuthIdentity()) {
        const classRow = allClassesData.find(c => c.id === classId);
        const classCode = classRow?.code || String(classId);
        if (classCode) {
          syncSend('put', `/classes/${encodeURIComponent(classCode)}`, {
            status: newStatus ? 'active' : 'inactive',
          }).catch((e) => console.warn('⚠️ Class status not persisted to server:', e));
        }
      }

      notify(
        isArabic ? `تم ${newStatus ? 'تفعيل' : 'تعطيل'} الفصل بنجاح` : 
        `Class ${newStatus ? 'activated' : 'deactivated'} successfully`,
        'success'
      );
    } catch (error) {
      console.error('Error toggling status:', error);
      notify(
        isArabic ? 'فشل في تغيير حالة الفصل' : 'Failed to change class status',
        'error'
      );
    }
  };

  // ===== EXPORT FUNCTIONALITY =====
  const handleExport = () => {
    try {
      let exportData = [...allClassesData];
      
      if (filterLevel !== 'all') {
        exportData = exportData.filter(c => c.level === filterLevel);
      }
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        exportData = exportData.filter(c =>
          c.name.toLowerCase().includes(searchLower) ||
          c.teacher.toLowerCase().includes(searchLower)
        );
      }

      if (exportData.length === 0) {
        notify(
          isArabic ? 'لا توجد بيانات للتصدير' : 'No data to export',
          'warning'
        );
        return;
      }

      const headers = isArabic 
        ? ['#', 'اسم الفصل', 'المستوى', 'المعلم', 'التلاميذ', 'السعة', 'الحالة']
        : ['#', 'Class Name', 'Level', 'Teacher', 'Students', 'Capacity', 'Status'];

      const rows = exportData.map((cls, index) => [
        index + 1,
        cls.name,
        getLevelDisplay(cls.level),
        cls.teacher,
        cls.students || 0,
        cls.capacity || 30,
        cls.isActive !== false ? (isArabic ? 'نشط' : 'Active') : (isArabic ? 'غير نشط' : 'Inactive')
      ]);

      let csvContent = headers.join(',') + '\n';
      rows.forEach(row => {
        csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `classes_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      notify(
        isArabic ? 'تم تصدير البيانات بنجاح' : 'Data exported successfully',
        'success'
      );
    } catch (error) {
      console.error('Export error:', error);
      notify(
        isArabic ? 'فشل في تصدير البيانات' : 'Failed to export data',
        'error'
      );
    }
  };

  // ===== PRINT FUNCTIONALITY =====
  const handlePrint = () => {
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        notify(
          isArabic ? 'يرجى السماح بالنوافذ المنبثقة للطباعة' : 'Please allow popups for printing',
          'warning'
        );
        return;
      }

      const currentData = classes.length > 0 ? classes : allClassesData;
      
      if (currentData.length === 0) {
        notify(
          isArabic ? 'لا توجد بيانات للطباعة' : 'No data to print',
          'warning'
        );
        return;
      }

      const title = isArabic ? 'قائمة الفصول الدراسية' : 'Classes List';
      const dateStr = new Date().toLocaleDateString(isArabic ? 'ar-TN' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      let tableRows = '';
      currentData.forEach((cls, index) => {
        tableRows += `
          <tr>
            <td>${index + 1}</td>
            <td>${cls.name}</td>
            <td>${getLevelDisplay(cls.level)}</td>
            <td>${cls.teacher}</td>
            <td>${cls.students || 0}</td>
            <td>${cls.capacity || 30}</td>
            <td>${cls.isActive !== false ? (isArabic ? 'نشط' : 'Active') : (isArabic ? 'غير نشط' : 'Inactive')}</td>
          </tr>
        `;
      });

      const printHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title}</title>
            <style>
              body {
                font-family: ${isArabic ? '"Hacen Tunisia", "Noto Sans Arabic", serif' : 'Arial, sans-serif'};
                padding: 40px;
                color: #212529;
                direction: ${isArabic ? 'rtl' : 'ltr'};
              }
              .print-header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #c49a6c;
                padding-bottom: 20px;
              }
              .print-header h1 {
                color: #c49a6c;
                margin: 0;
                font-size: 24px;
              }
              .print-header p {
                color: #6c757d;
                margin: 5px 0 0;
                font-size: 14px;
              }
              .print-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
              }
              .print-table th {
                background: #f8f9fa;
                color: #212529;
                font-weight: 600;
                padding: 12px 15px;
                border: 1px solid #dee2e6;
                text-align: ${isArabic ? 'right' : 'left'};
              }
              .print-table td {
                padding: 10px 15px;
                border: 1px solid #dee2e6;
                text-align: ${isArabic ? 'right' : 'left'};
              }
              .print-table tr:nth-child(even) {
                background: #f8f9fa;
              }
              .print-footer {
                margin-top: 30px;
                text-align: center;
                color: #6c757d;
                font-size: 12px;
                border-top: 1px solid #dee2e6;
                padding-top: 20px;
              }
              @media print {
                body { padding: 20px; }
              }
            </style>
          </head>
          <body>
            <div class="print-header">
              <h1>${title}</h1>
              <p>${isArabic ? 'تم إنشاء التقرير في' : 'Generated on'} ${dateStr}</p>
              <p style="font-size:12px;color:#adb5bd;margin-top:4px;">
                ${isArabic ? `إجمالي الفصول: ${formatNumber(currentData.length)}` : `Total Classes: ${formatNumber(currentData.length)}`}
              </p>
            </div>
            <table class="print-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>${isArabic ? 'اسم الفصل' : 'Class Name'}</th>
                  <th>${isArabic ? 'المستوى' : 'Level'}</th>
                  <th>${isArabic ? 'المعلم' : 'Teacher'}</th>
                  <th>${isArabic ? 'التلاميذ' : 'Students'}</th>
                  <th>${isArabic ? 'السعة' : 'Capacity'}</th>
                  <th>${isArabic ? 'الحالة' : 'Status'}</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
            <div class="print-footer">
              ${isArabic ? '© جميع الحقوق محفوظة - نظام إدارة المدرسة' : '© All Rights Reserved - School Management System'}
            </div>
            <script>
              window.onload = function() { window.print(); }
            <\/script>
          </body>
        </html>
      `;

      printWindow.document.write(printHtml);
      printWindow.document.close();
    } catch (error) {
      console.error('Print error:', error);
      notify(
        isArabic ? 'فشل في الطباعة' : 'Failed to print',
        'error'
      );
    }
  };

  // ===== GET LEVEL COUNTS =====
  const levelCounts = getLevelCounts();

  // ===== CALCULATE STATS FROM REAL DATA =====
  const totalClasses = allClassesData.length;
  const totalStudents = allClassesData.reduce((sum, c) => sum + (c.students || 0), 0);
  const totalTeachers = [...new Set(allClassesData.map(c => c.teacher).filter(t => t && !t.includes(isArabic ? 'غير معين' : 'Not Assigned')))].length;
  const activeClasses = allClassesData.filter(c => c.isActive !== false).length;
  const inactiveClasses = allClassesData.filter(c => c.isActive === false).length;

  // ===== RENDER =====
  return (
    <div className="classes-management" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Page Header */}
      <div className="page-header d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ ...arabicFontStyle, color: '#2d6a4f', fontSize: isArabic ? 'clamp(1.1rem, 1.8vw, 1.5rem)' : 'clamp(1rem, 1.6vw, 1.4rem)' }}>
            <FaBuilding className="me-2" /> 
            {isArabic ? 'إدارة الفصول' : 'Classes Management'}
          </h4>
          <p className="text-muted mb-0" style={{ ...arabicFontStyle, fontSize: isArabic ? 'clamp(0.9rem, 1.1vw, 1.05rem)' : 'clamp(0.85rem, 1vw, 1rem)' }}>
            {isArabic 
              ? `عرض جميع الفصول الدراسية في النظام (${formatNumber(totalItems)})`
              : `View all classes in the system (${formatNumber(totalItems)})`}
          </p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <Button 
            variant="outline-primary" 
            size="sm" 
            onClick={fetchClasses}
            disabled={loading}
            style={{ ...arabicFontStyle, borderRadius: '12px' }}
          >
            <FaSync className={loading ? 'spinning' : ''} /> {isArabic ? 'تحديث' : 'Refresh'}
          </Button>
          {!isMobile && (
            <>
              <Button 
                variant="outline-secondary" 
                size="sm" 
                onClick={handleExport}
                style={{ ...arabicFontStyle, borderRadius: '12px' }}
              >
                <FaDownload className="me-1" /> {isArabic ? 'تصدير' : 'Export'}
              </Button>
              <Button 
                variant="outline-secondary" 
                size="sm" 
                onClick={handlePrint}
                style={{ ...arabicFontStyle, borderRadius: '12px' }}
              >
                <FaPrint className="me-1" /> {isArabic ? 'طباعة' : 'Print'}
              </Button>
            </>
          )}
          <Button 
            variant="primary" 
            size="sm" 
            onClick={() => setShowAddModal(true)}
            style={{ ...arabicFontStyle, borderRadius: '12px' }}
          >
            <FaPlus className="me-1" /> {isArabic ? 'إضافة فصل' : 'Add Class'}
          </Button>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <Row className="g-3 g-md-4 mb-4">
        <Col xs={6} md={3}>
          <div className="stat-card-enhanced total-card">
            <div className="stat-card-gradient-bar"></div>
            <div className="stat-card-content">
              <div className="stat-icon-wrapper total-icon">
                <FaBuilding />
              </div>
              <div className="stat-info">
                <span className="stat-number">{formatNumber(totalClasses)}</span>
                <span className="stat-label">{isArabic ? 'الإجمالي' : 'Total'}</span>
              </div>
            </div>
            <div className="stat-card-shimmer"></div>
          </div>
        </Col>
        <Col xs={6} md={3}>
          <div className="stat-card-enhanced active-card">
            <div className="stat-card-gradient-bar"></div>
            <div className="stat-card-content">
              <div className="stat-icon-wrapper active-icon">
                <FaCheckCircle />
              </div>
              <div className="stat-info">
                <span className="stat-number">{formatNumber(activeClasses)}</span>
                <span className="stat-label">{isArabic ? 'نشط' : 'Active'}</span>
              </div>
            </div>
            <div className="stat-card-shimmer"></div>
          </div>
        </Col>
        <Col xs={6} md={3}>
          <div className="stat-card-enhanced children-card">
            <div className="stat-card-gradient-bar"></div>
            <div className="stat-card-content">
              <div className="stat-icon-wrapper children-icon">
                <FaUserGraduate />
              </div>
              <div className="stat-info">
                <span className="stat-number">{formatNumber(totalStudents)}</span>
                <span className="stat-label">{isArabic ? 'التلاميذ' : 'Students'}</span>
              </div>
            </div>
            <div className="stat-card-shimmer"></div>
          </div>
        </Col>
        <Col xs={6} md={3}>
          <div className="stat-card-enhanced inactive-card">
            <div className="stat-card-gradient-bar"></div>
            <div className="stat-card-content">
              <div className="stat-icon-wrapper inactive-icon">
                <FaChalkboardTeacher />
              </div>
              <div className="stat-info">
                <span className="stat-number">{formatNumber(totalTeachers)}</span>
                <span className="stat-label">{isArabic ? 'المعلمين' : 'Teachers'}</span>
              </div>
            </div>
            <div className="stat-card-shimmer"></div>
          </div>
        </Col>
      </Row>

      {/* Level Distribution */}
      <Row className="g-2 g-md-3 mb-4">
        {levelCategories.map(level => {
          const count = levelCounts[level.value] || 0;
          const total = allClassesData.length || 1;
          const percentage = Math.round((count / total) * 100);
          return (
            <Col key={level.value} xs={6} md={3}>
              <div 
                className="level-stat"
                style={{
                  background: darkMode ? '#1a1a2e' : '#ffffff',
                  border: `1px solid ${darkMode ? '#2d2d44' : '#e9ecef'}`,
                  borderRadius: '12px',
                  padding: '12px 16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  borderLeft: `4px solid ${level.color}`
                }}
                onClick={() => setFilterLevel(level.value)}
              >
                <div className="d-flex align-items-center gap-2">
                  <span style={{ color: level.color, fontSize: '1.2rem' }}>{level.icon}</span>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-semibold" style={{ ...arabicFontStyle, fontSize: '0.8rem', color: darkMode ? '#e9ecef' : '#212529' }}>
                        {level.label}
                      </span>
                      <span className="fw-bold" style={{ color: level.color, fontSize: '0.9rem' }}>
                        {formatNumber(count)}
                      </span>
                    </div>
                    <ProgressBar 
                      now={percentage} 
                      variant={level.value === 'kindergarten' ? 'warning' : level.value === 'primary' ? 'success' : level.value === 'secondary' ? 'info' : 'secondary'}
                      style={{ height: '4px', borderRadius: '2px' }}
                    />
                  </div>
                </div>
              </div>
            </Col>
          );
        })}
      </Row>

      {/* Filters */}
      <Card className="modern-card mb-4" style={{ background: darkMode ? '#1a1a2e' : '#ffffff', borderColor: darkMode ? '#2d2d44' : '#e9ecef' }}>
        <Card.Body>
          <Row className="g-3">
            <Col xs={12} md={6} lg={7}>
              <InputGroup>
                <InputGroup.Text style={{ background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px 0 0 12px' }}>
                  <FaSearch className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder={isArabic ? 'بحث بالاسم أو المعلم...' : 'Search by name or teacher...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529' }}
                />
                {searchTerm && (
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => setSearchTerm('')}
                    style={{ ...arabicFontStyle, borderRadius: '0 12px 12px 0' }}
                  >
                    <FaTimes />
                  </Button>
                )}
              </InputGroup>
            </Col>
            <Col xs={6} md={3} lg={3}>
              <Form.Select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px' }}
              >
                <option value="all">{isArabic ? 'جميع المستويات' : 'All Levels'}</option>
                {levelCategories.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={6} md={3} lg={2} className="d-flex gap-2">
              <Button 
                variant="outline-secondary" 
                size="sm" 
                className="flex-grow-1"
                onClick={handleExport}
                style={{ ...arabicFontStyle, borderRadius: '12px' }}
                title={isArabic ? 'تصدير' : 'Export'}
              >
                <FaDownload /> 
              </Button>
              <Button 
                variant="outline-secondary" 
                size="sm" 
                className="flex-grow-1"
                onClick={handlePrint}
                style={{ ...arabicFontStyle, borderRadius: '12px' }}
                title={isArabic ? 'طباعة' : 'Print'}
              >
                <FaPrint /> 
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Classes Table */}
      <Card className="modern-card" style={{ background: darkMode ? '#1a1a2e' : '#ffffff', borderColor: darkMode ? '#2d2d44' : '#e9ecef' }}>
        <Card.Body className="p-0" ref={tableRef}>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 text-muted" style={arabicFontStyle}>
                {isArabic ? 'جاري تحميل الفصول...' : 'Loading classes...'}
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-5">
              <FaExclamationTriangle size={48} className="text-warning mb-3" />
              <p className="text-danger" style={arabicFontStyle}>{error}</p>
              <Button variant="primary" onClick={fetchClasses} style={{ ...arabicFontStyle, borderRadius: '12px' }}>
                <FaSync className="me-2" /> {isArabic ? 'إعادة المحاولة' : 'Retry'}
              </Button>
            </div>
          ) : classes.length === 0 ? (
            <div className="text-center py-5">
              <FaBuilding size={48} className="text-muted opacity-25 mb-3" />
              <p style={arabicFontStyle}>
                {isArabic ? 'لا توجد فصول لعرضها' : 'No classes to display'}
              </p>
              <Button 
                variant="primary" 
                onClick={() => setShowAddModal(true)}
                style={{ ...arabicFontStyle, borderRadius: '12px' }}
              >
                <FaPlus className="me-2" /> {isArabic ? 'إضافة فصل' : 'Add Class'}
              </Button>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <Table hover className="mb-0" style={arabicFontStyle}>
                  <thead style={{ background: darkMode ? '#0d1117' : '#f8f9fa' }}>
                    <tr>
                      <th style={{ color: darkMode ? '#e9ecef' : '#212529', whiteSpace: 'nowrap', width: isMobile ? '40px' : 'auto' }}>
                        {isArabic ? '#' : '#'}
                      </th>
                      <th style={{ color: darkMode ? '#e9ecef' : '#212529', whiteSpace: 'nowrap' }}>
                        {isArabic ? 'الفصل' : 'Class'}
                      </th>
                      {!isMobile && (
                        <th style={{ color: darkMode ? '#e9ecef' : '#212529', whiteSpace: 'nowrap' }}>
                          {isArabic ? 'المستوى' : 'Level'}
                        </th>
                      )}
                      <th style={{ color: darkMode ? '#e9ecef' : '#212529', whiteSpace: 'nowrap' }}>
                        {isArabic ? 'المعلم' : 'Teacher'}
                      </th>
                      {!isMobile && (
                        <th style={{ color: darkMode ? '#e9ecef' : '#212529', whiteSpace: 'nowrap' }}>
                          {isArabic ? 'التلاميذ' : 'Students'}
                        </th>
                      )}
                      <th style={{ color: darkMode ? '#e9ecef' : '#212529', whiteSpace: 'nowrap' }}>
                        {isArabic ? 'الحالة' : 'Status'}
                      </th>
                      <th className="text-center" style={{ color: darkMode ? '#e9ecef' : '#212529', whiteSpace: 'nowrap', width: isMobile ? '100px' : 'auto' }}>
                        {isArabic ? 'إجراءات' : 'Actions'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {classes.map((cls, index) => {
                      const globalIndex = (currentPage - 1) * itemsPerPage + index + 1;
                      const levelColor = getLevelColor(cls.level);
                      const students = cls.students || 0;
                      const capacity = cls.capacity || 30;
                      const occupancy = capacity > 0 ? Math.round((students / capacity) * 100) : 0;
                      const isNotAssigned = cls.teacher === (isArabic ? 'غير معين' : 'Not Assigned');
                      
                      return (
                        <tr key={cls.id}>
                          <td style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.75rem' : 'inherit' }}>
                            {formatNumber(globalIndex)}
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div 
                                className="class-avatar-sm"
                                style={{
                                  background: `linear-gradient(135deg, ${levelColor}, ${levelColor}dd)`,
                                  width: isMobile ? '28px' : '36px',
                                  height: isMobile ? '28px' : '36px',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontWeight: '700',
                                  fontSize: isMobile ? '0.6rem' : '0.85rem',
                                  flexShrink: 0
                                }}
                              >
                                {(isArabic ? (cls.nameAr || cls.name) : cls.name).charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="fw-semibold" style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.8rem' : 'inherit' }}>
                                  {isArabic ? (cls.nameAr || cls.name) : cls.name}
                                </div>
                              </div>
                            </div>
                          </td>
                          {!isMobile && (
                            <td>
                              <Badge 
                                style={{ 
                                  background: levelColor,
                                  color: 'white',
                                  padding: '4px 12px',
                                  borderRadius: '8px',
                                  fontSize: '0.7rem'
                                }}
                              >
                                {getLevelIcon(cls.level)} {getLevelDisplay(cls.level)}
                              </Badge>
                            </td>
                          )}
                          <td>
                            <div className="d-flex align-items-center gap-1" style={{ fontSize: isMobile ? '0.7rem' : 'inherit' }}>
                              {isNotAssigned ? (
                                <FaUserCircle className="text-muted" size={isMobile ? 10 : 12} />
                              ) : (
                                <FaChalkboardTeacher className="text-muted" size={isMobile ? 10 : 12} />
                              )}
                              <span style={{ 
                                color: isNotAssigned ? '#adb5bd' : (darkMode ? '#e9ecef' : '#212529'),
                                fontStyle: isNotAssigned ? 'italic' : 'normal'
                              }}>
                                {cls.teacher}
                              </span>
                            </div>
                          </td>
                          {!isMobile && (
                            <td>
                              <div>
                                <span style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: '0.8rem' }}>
                                  {formatNumber(students)}/{formatNumber(capacity)}
                                </span>
                                <ProgressBar 
                                  now={occupancy} 
                                  variant={occupancy > 90 ? 'danger' : occupancy > 70 ? 'warning' : 'success'}
                                  style={{ height: '3px', borderRadius: '2px', marginTop: '2px', width: '80px' }}
                                />
                              </div>
                            </td>
                          )}
                          <td>
                            <Badge 
                              className={cls.isActive !== false ? 'bg-success' : 'bg-secondary'}
                              style={{ 
                                padding: isMobile ? '3px 8px' : '4px 12px', 
                                borderRadius: '8px', 
                                fontSize: isMobile ? '0.6rem' : '0.7rem' 
                              }}
                            >
                              {cls.isActive !== false ? (
                                <><FaCheckCircle className="me-1" style={{ fontSize: isMobile ? '0.5rem' : 'inherit' }} /> {!isMobile && (isArabic ? 'نشط' : 'Active')}
                                {isMobile && <span style={{ fontSize: '0.5rem' }}>{isArabic ? 'نشط' : 'Active'}</span>}</>
                              ) : (
                                <><FaTimesCircle className="me-1" style={{ fontSize: isMobile ? '0.5rem' : 'inherit' }} /> {!isMobile && (isArabic ? 'غير نشط' : 'Inactive')}
                                {isMobile && <span style={{ fontSize: '0.5rem' }}>{isArabic ? 'غير نشط' : 'Inactive'}</span>}</>
                              )}
                            </Badge>
                          </td>
                          <td>
                            <div className="d-flex gap-1 justify-content-center flex-wrap">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleViewClass(cls)}
                                title={isArabic ? 'عرض' : 'View'}
                                style={{ borderRadius: '8px', padding: isMobile ? '2px 6px' : '4px 8px', fontSize: isMobile ? '0.6rem' : 'inherit' }}
                              >
                                <FaEye style={{ fontSize: isMobile ? '0.6rem' : 'inherit' }} />
                              </Button>
                              <Button
                                variant="outline-warning"
                                size="sm"
                                onClick={() => handleEditClass(cls)}
                                title={isArabic ? 'تعديل' : 'Edit'}
                                style={{ borderRadius: '8px', padding: isMobile ? '2px 6px' : '4px 8px', fontSize: isMobile ? '0.6rem' : 'inherit' }}
                              >
                                <FaEdit style={{ fontSize: isMobile ? '0.6rem' : 'inherit' }} />
                              </Button>
                              <Button
                                variant={cls.isActive !== false ? 'outline-danger' : 'outline-success'}
                                size="sm"
                                onClick={() => handleToggleStatus(cls.id, cls.isActive !== false)}
                                title={cls.isActive !== false ? (isArabic ? 'تعطيل' : 'Deactivate') : (isArabic ? 'تفعيل' : 'Activate')}
                                style={{ borderRadius: '8px', padding: isMobile ? '2px 6px' : '4px 8px', fontSize: isMobile ? '0.6rem' : 'inherit' }}
                              >
                                {cls.isActive !== false ? <FaTimesCircle style={{ fontSize: isMobile ? '0.6rem' : 'inherit' }} /> : <FaCheckCircle style={{ fontSize: isMobile ? '0.6rem' : 'inherit' }} />}
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => { setSelectedClass(cls); setShowDeleteConfirm(true); }}
                                title={isArabic ? 'حذف' : 'Delete'}
                                style={{ borderRadius: '8px', padding: isMobile ? '2px 6px' : '4px 8px', fontSize: isMobile ? '0.6rem' : 'inherit' }}
                              >
                                <FaTrash style={{ fontSize: isMobile ? '0.6rem' : 'inherit' }} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center p-3 border-top gap-2" style={{ borderColor: darkMode ? '#2d2d44' : '#e9ecef' }}>
                  <div className="text-muted small" style={{ ...arabicFontStyle, color: darkMode ? '#adb5bd' : '#6c757d', fontSize: isMobile ? '0.65rem' : 'inherit' }}>
                    {isArabic 
                      ? `عرض ${formatNumber(classes.length)} من ${formatNumber(totalItems)} فصل`
                      : `Showing ${formatNumber(classes.length)} of ${formatNumber(totalItems)} classes`}
                  </div>
                  <Pagination className="mb-0" size={isMobile ? 'sm' : 'md'}>
                    <Pagination.Prev 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
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
                          style={{ color: darkMode ? '#e9ecef' : '#212529', borderRadius: '8px' }}
                        >
                          {formatNumber(pageNum)}
                        </Pagination.Item>
                      );
                    })}
                    <Pagination.Next 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    />
                  </Pagination>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      {/* ===== VIEW CLASS MODAL ===== */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} centered size="lg" className="modern-modal">
        <Modal.Header closeButton className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Modal.Title style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '1rem' : 'inherit' }}>
            <FaEye className="me-2 text-primary" />
            {isArabic ? 'تفاصيل الفصل' : 'Class Details'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? '#0d1117' : 'white' }}>
          {selectedClass && (
            <div>
              <div className="text-center mb-4">
                <div 
                  className="class-avatar-lg mx-auto"
                  style={{
                    background: `linear-gradient(135deg, ${getLevelColor(selectedClass.level)}, ${getLevelColor(selectedClass.level)}dd)`,
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '2.5rem',
                    margin: '0 auto',
                    boxShadow: `0 8px 30px ${getLevelColor(selectedClass.level)}40`
                  }}
                >
                  {selectedClass.name.charAt(0).toUpperCase()}
                </div>
                <h5 className="fw-bold mt-3" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{selectedClass.name}</h5>
                <Badge style={{ background: getLevelColor(selectedClass.level), color: 'white', borderRadius: '8px' }}>
                  {getLevelIcon(selectedClass.level)} {getLevelDisplay(selectedClass.level)}
                </Badge>
                <div className="mt-2">
                  <Badge className={selectedClass.isActive !== false ? 'bg-success' : 'bg-secondary'} style={{ borderRadius: '8px' }}>
                    {selectedClass.isActive !== false ? (isArabic ? 'نشط' : 'Active') : (isArabic ? 'غير نشط' : 'Inactive')}
                  </Badge>
                </div>
              </div>

              <Row className="g-3">
                <Col md={6}>
                  <div className="detail-item">
                    <label className="text-muted small" style={arabicFontStyle}>
                      <FaChalkboardTeacher className="me-1" /> {isArabic ? 'المعلم' : 'Teacher'}
                    </label>
                    <p className="fw-semibold mb-0" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                      {selectedClass.teacher || (isArabic ? 'غير معين' : 'Not Assigned')}
                    </p>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="detail-item">
                    <label className="text-muted small" style={arabicFontStyle}>
                      <FaClock className="me-1" /> {isArabic ? 'الجدول' : 'Schedule'}
                    </label>
                    <p className="fw-semibold mb-0" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>{selectedClass.schedule || '8:00 - 2:00'}</p>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="detail-item">
                    <label className="text-muted small" style={arabicFontStyle}>
                      <FaUserGraduate className="me-1" /> {isArabic ? 'التلاميذ' : 'Students'}
                    </label>
                    <p className="fw-semibold mb-0" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                      {formatNumber(selectedClass.students || 0)} / {formatNumber(selectedClass.capacity || 30)}
                    </p>
                    <ProgressBar 
                      now={selectedClass.capacity ? Math.round(((selectedClass.students || 0) / selectedClass.capacity) * 100) : 0} 
                      variant={selectedClass.students / selectedClass.capacity > 0.9 ? 'danger' : 'primary'}
                      style={{ height: '6px', borderRadius: '3px', marginTop: '4px' }}
                    />
                  </div>
                </Col>
                <Col md={6}>
                  <div className="detail-item">
                    <label className="text-muted small" style={arabicFontStyle}>
                      <FaCalendarAlt className="me-1" /> {isArabic ? 'تاريخ الإنشاء' : 'Created'}
                    </label>
                    <p className="fw-semibold mb-0" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                      {selectedClass.created_at ? safeFormatDate(selectedClass.created_at, 'PPP', { locale: isArabic ? ar : enUS }) : 'N/A'}
                    </p>
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Button variant="secondary" onClick={() => setShowViewModal(false)} style={{ ...arabicFontStyle, borderRadius: '12px', fontSize: isMobile ? '0.8rem' : 'inherit' }}>
            {isArabic ? 'إغلاق' : 'Close'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===== ADD CLASS MODAL ===== */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered size={isMobile ? 'md' : 'lg'} className="modern-modal">
        <Modal.Header closeButton className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Modal.Title style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '1rem' : 'inherit' }}>
            <FaPlus className="me-2 text-primary" />
            {isArabic ? 'إضافة فصل جديد' : 'Add New Class'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? '#0d1117' : 'white' }}>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.85rem' : 'inherit' }}>
                    {isArabic ? 'اسم الفصل' : 'Class Name'} *
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={isArabic ? 'مثال: الأول -أ-' : 'E.g., 1 -A-'}
                    style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: isMobile ? '0.85rem' : 'inherit' }}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.85rem' : 'inherit' }}>
                    {isArabic ? 'المستوى' : 'Level'} *
                  </Form.Label>
                  <Form.Select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: isMobile ? '0.85rem' : 'inherit' }}
                  >
                    {levelCategories.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.85rem' : 'inherit' }}>
                    {isArabic ? 'المعلم' : 'Teacher'}
                  </Form.Label>
                  <Form.Select
                    value={formData.teacherId}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                    style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: isMobile ? '0.85rem' : 'inherit' }}
                  >
                    <option value="">{isArabic ? '-- غير معين --' : '-- Not Assigned --'}</option>
                    {teachersData.map(teacher => {
                      const name = teacher.name || teacher.displayName || `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || 'Unknown';
                      return (
                        <option key={teacher.id} value={teacher.id}>
                          {name}
                        </option>
                      );
                    })}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.85rem' : 'inherit' }}>
                    {isArabic ? 'الجدول' : 'Schedule'}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.schedule}
                    onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                    placeholder={isArabic ? '8:00 - 2:00' : '8:00 - 2:00'}
                    style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: isMobile ? '0.85rem' : 'inherit' }}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.85rem' : 'inherit' }}>
                    {isArabic ? 'السعة' : 'Capacity'}
                  </Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 30 })}
                    placeholder="30"
                    style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: isMobile ? '0.85rem' : 'inherit' }}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.85rem' : 'inherit' }}>
                    {isArabic ? 'المادة' : 'Subject'}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder={isArabic ? 'مثال: الرياضيات' : 'E.g., Mathematics'}
                    style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: isMobile ? '0.85rem' : 'inherit' }}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Check
                type="switch"
                id="classStatus"
                label={isArabic ? 'الفصل نشط' : 'Class Active'}
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                style={{ ...arabicFontStyle, fontSize: isMobile ? '0.85rem' : 'inherit' }}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Button variant="secondary" onClick={() => setShowAddModal(false)} disabled={processingAction} style={{ ...arabicFontStyle, borderRadius: '12px', fontSize: isMobile ? '0.8rem' : 'inherit' }}>
            {isArabic ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button variant="primary" onClick={handleAddClass} disabled={processingAction} style={{ ...arabicFontStyle, borderRadius: '12px', fontSize: isMobile ? '0.8rem' : 'inherit' }}>
            {processingAction ? (
              <><FaSpinner className="spinning me-2" /> {isArabic ? 'جاري...' : 'Adding...'}</>
            ) : (
              <><FaSave className="me-2" /> {isArabic ? 'إضافة' : 'Add'}</>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===== EDIT CLASS MODAL ===== */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered size={isMobile ? 'md' : 'lg'} className="modern-modal">
        <Modal.Header closeButton className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Modal.Title style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '1rem' : 'inherit' }}>
            <FaEdit className="me-2 text-warning" />
            {isArabic ? 'تعديل الفصل' : 'Edit Class'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? '#0d1117' : 'white' }}>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.85rem' : 'inherit' }}>
                    {isArabic ? 'اسم الفصل' : 'Class Name'} *
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: isMobile ? '0.85rem' : 'inherit' }}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.85rem' : 'inherit' }}>
                    {isArabic ? 'المستوى' : 'Level'} *
                  </Form.Label>
                  <Form.Select
                    value={editFormData.level}
                    onChange={(e) => setEditFormData({ ...editFormData, level: e.target.value })}
                    style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: isMobile ? '0.85rem' : 'inherit' }}
                  >
                    {levelCategories.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.85rem' : 'inherit' }}>
                    {isArabic ? 'المعلم' : 'Teacher'}
                  </Form.Label>
                  <Form.Select
                    value={editFormData.teacherId}
                    onChange={(e) => setEditFormData({ ...editFormData, teacherId: e.target.value })}
                    style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: isMobile ? '0.85rem' : 'inherit' }}
                  >
                    <option value="">{isArabic ? '-- غير معين --' : '-- Not Assigned --'}</option>
                    {teachersData.map(teacher => {
                      const name = teacher.name || teacher.displayName || `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || 'Unknown';
                      return (
                        <option key={teacher.id} value={teacher.id}>
                          {name}
                        </option>
                      );
                    })}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.85rem' : 'inherit' }}>
                    {isArabic ? 'الجدول' : 'Schedule'}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={editFormData.schedule}
                    onChange={(e) => setEditFormData({ ...editFormData, schedule: e.target.value })}
                    style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: isMobile ? '0.85rem' : 'inherit' }}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.85rem' : 'inherit' }}>
                    {isArabic ? 'السعة' : 'Capacity'}
                  </Form.Label>
                  <Form.Control
                    type="number"
                    value={editFormData.capacity}
                    onChange={(e) => setEditFormData({ ...editFormData, capacity: parseInt(e.target.value) || 30 })}
                    style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: isMobile ? '0.85rem' : 'inherit' }}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.85rem' : 'inherit' }}>
                    {isArabic ? 'المادة' : 'Subject'}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={editFormData.subject}
                    onChange={(e) => setEditFormData({ ...editFormData, subject: e.target.value })}
                    style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: isMobile ? '0.85rem' : 'inherit' }}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Check
                type="switch"
                id="editClassStatus"
                label={isArabic ? 'الفصل نشط' : 'Class Active'}
                checked={editFormData.isActive}
                onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                style={{ ...arabicFontStyle, fontSize: isMobile ? '0.85rem' : 'inherit' }}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Button variant="secondary" onClick={() => setShowEditModal(false)} disabled={processingAction} style={{ ...arabicFontStyle, borderRadius: '12px', fontSize: isMobile ? '0.8rem' : 'inherit' }}>
            {isArabic ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button variant="warning" onClick={handleSaveEdit} disabled={processingAction} style={{ ...arabicFontStyle, borderRadius: '12px', fontSize: isMobile ? '0.8rem' : 'inherit' }}>
            {processingAction ? (
              <><FaSpinner className="spinning me-2" /> {isArabic ? 'جاري...' : 'Saving...'}</>
            ) : (
              <><FaSave className="me-2" /> {isArabic ? 'حفظ التغييرات' : 'Save Changes'}</>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===== DELETE CONFIRMATION MODAL ===== */}
      <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered className="modern-modal">
        <Modal.Header closeButton className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Modal.Title style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '1rem' : 'inherit' }}>
            <FaExclamationTriangle className="me-2 text-danger" />
            {isArabic ? 'تأكيد الحذف' : 'Confirm Delete'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? '#0d1117' : 'white' }}>
          <p style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.85rem' : 'inherit' }}>
            {isArabic
              ? `هل أنت متأكد من حذف الفصل "${selectedClass?.name}"؟ هذا الإجراء لا يمكن التراجع عنه.`
              : `Are you sure you want to delete class "${selectedClass?.name}"? This action cannot be undone.`}
          </p>
          {selectedClass?.isActive !== false && (
            <Alert variant="warning" style={{ ...arabicFontStyle, fontSize: isMobile ? '0.8rem' : 'inherit' }}>
              {isArabic
                ? 'تحذير: هذا الفصل نشط وقد يحتوي على تلاميذ مسجلين.'
                : 'Warning: This class is active and may have students enrolled.'}
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)} disabled={processingAction} style={{ ...arabicFontStyle, borderRadius: '12px', fontSize: isMobile ? '0.8rem' : 'inherit' }}>
            {isArabic ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button variant="danger" onClick={handleDeleteClass} disabled={processingAction} style={{ ...arabicFontStyle, borderRadius: '12px', fontSize: isMobile ? '0.8rem' : 'inherit' }}>
            {processingAction ? (
              <><FaSpinner className="spinning me-2" /> {isArabic ? 'جاري...' : 'Deleting...'}</>
            ) : (
              <><FaTrash className="me-2" /> {isArabic ? 'تأكيد الحذف' : 'Confirm Delete'}</>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .classes-management {
          padding: 0;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* ===== ENHANCED STAT CARDS ===== */
        .stat-card-enhanced {
          background: ${darkMode ? '#1a1a2e' : '#ffffff'};
          border: 1px solid ${darkMode ? '#2d2d44' : '#e9ecef'};
          border-radius: 16px;
          padding: 20px 24px;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          height: 100%;
          min-height: 100px;
          position: relative;
          overflow: hidden;
          cursor: pointer;
        }

        .stat-card-enhanced:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 16px 48px rgba(0,0,0,0.12);
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
          height: 6px;
        }

        .total-card .stat-card-gradient-bar {
          background: linear-gradient(90deg, #2d6a4f, #40916c);
        }

        .active-card .stat-card-gradient-bar {
          background: linear-gradient(90deg, #2ecc71, #27ae60);
        }

        .children-card .stat-card-gradient-bar {
          background: linear-gradient(90deg, #4a9eff, #6ab0ff);
        }

        .inactive-card .stat-card-gradient-bar {
          background: linear-gradient(90deg, #f39c12, #e67e22);
        }

        .stat-card-content {
          display: flex;
          align-items: center;
          gap: 16px;
          position: relative;
          z-index: 1;
        }

        .stat-icon-wrapper {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          flex-shrink: 0;
          transition: transform 0.3s ease;
        }

        .stat-card-enhanced:hover .stat-icon-wrapper {
          transform: scale(1.1) rotate(-5deg);
        }

        .total-icon {
          background: rgba(45, 106, 79, 0.15);
          color: #2d6a4f;
        }

        .active-icon {
          background: rgba(46, 204, 113, 0.15);
          color: #2ecc71;
        }

        .children-icon {
          background: rgba(74, 158, 255, 0.15);
          color: #4a9eff;
        }

        .inactive-icon {
          background: rgba(243, 156, 18, 0.15);
          color: #f39c12;
        }

        .stat-info {
          flex: 1;
          min-width: 0;
        }

        .stat-number {
          display: block;
          font-size: 1.8rem;
          font-weight: 700;
          color: ${darkMode ? '#e9ecef' : '#1a1a2e'};
          line-height: 1.2;
          letter-spacing: -0.5px;
        }

        .stat-label {
          font-size: 0.75rem;
          color: ${darkMode ? '#adb5bd' : '#6c757d'};
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
          margin-top: 2px;
        }

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
          background: ${darkMode ? '#1a1a2e' : '#ffffff'};
          border: 1px solid ${darkMode ? '#2d2d44' : '#e9ecef'};
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .modern-card:hover {
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }

        /* ===== CLASS AVATARS ===== */
        .class-avatar-sm {
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          flex-shrink: 0;
          transition: transform 0.3s ease;
        }

        .class-avatar-sm:hover {
          transform: scale(1.15);
        }

        .class-avatar-lg {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 2.5rem;
          margin: 0 auto;
          transition: transform 0.3s ease;
        }

        .class-avatar-lg:hover {
          transform: scale(1.05);
        }

        /* ===== DETAIL ITEM ===== */
        .detail-item {
          padding: 8px 0;
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

        /* ===== MODERN MODAL ===== */
        .modern-modal .modal-content {
          border-radius: 20px !important;
          border: none !important;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
          overflow: hidden;
        }

        .modern-modal .modal-header {
          padding: 20px 24px 0;
          border-bottom: none;
        }

        .modern-modal .modal-body {
          padding: 16px 24px 24px;
        }

        .modern-modal .modal-footer {
          padding: 8px 24px 20px;
          border-top: none;
        }

        .modern-modal .modal-header .btn-close {
          transition: transform 0.3s ease;
        }

        .modern-modal .modal-header .btn-close:hover {
          transform: rotate(90deg);
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 992px) {
          .stat-card-enhanced {
            min-height: 90px;
            padding: 18px 20px;
          }
          
          .stat-number {
            font-size: 1.6rem;
          }
        }

        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
            align-items: stretch !important;
          }
          
          .stat-card-enhanced {
            padding: 16px 18px;
            min-height: 80px;
          }

          .stat-number {
            font-size: 1.4rem;
          }

          .stat-icon-wrapper {
            width: 42px;
            height: 42px;
            font-size: 1.1rem;
          }

          .table-responsive {
            font-size: 0.85rem;
          }
          
          .table td, .table th {
            padding: 0.5rem;
          }
        }

        @media (max-width: 576px) {
          .stat-card-enhanced {
            padding: 12px 14px;
            min-height: 70px;
          }

          .stat-number {
            font-size: 1.1rem;
          }

          .stat-icon-wrapper {
            width: 34px;
            height: 34px;
            font-size: 0.9rem;
          }

          .stat-label {
            font-size: 0.6rem;
          }

          .table td, .table th {
            padding: 0.3rem;
            font-size: 0.75rem;
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

          .level-stat {
            padding: 8px 12px !important;
          }
          .level-stat .fw-semibold {
            font-size: 0.7rem !important;
          }
          .level-stat .fw-bold {
            font-size: 0.8rem !important;
          }
        }

        /* ===== RTL SUPPORT ===== */
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
      `}</style>
    </div>
  );
};

export default ClassesManagement;