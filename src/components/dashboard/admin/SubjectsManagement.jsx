// src/components/dashboard/admin/SubjectsManagement.jsx
import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Badge, Button, Table, 
  Modal, Form, Alert, InputGroup, Pagination 
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
  FaBook, FaBookOpen, FaPlus, FaEdit, FaTrash, FaSearch,
  FaSync, FaGraduationCap, FaSchool, FaBuilding,
  FaChevronDown, FaChevronUp, FaExclamationTriangle,
  FaSpinner, FaSave, FaTimes, FaFilter,
  FaEye, FaCheckCircle, FaTimesCircle,
  FaUsers as FaUsersIcon, FaChild, FaUniversity,
  FaQuran, FaLanguage, FaCalculator, FaFlask,
  FaLaptop, FaRunning, FaPalette, FaGlobe,
  FaAtom, FaDna, FaBookOpen as FaBookOpenIcon,
  FaBrain, FaMicroscope, FaMusic, FaRocket
} from 'react-icons/fa';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../hooks/useAuth';
import { useNotification } from '../../../hooks/useNotification';
import api from '../../../services/api';
import userDataService from '../../../services/userDataService';

// ===== ALWAYS use English numbers =====
const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  return num.toString();
};

const SubjectsManagement = () => {
  const { isArabic } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notify } = useNotification();

  // ===== STATE =====
  const [subjects, setSubjects] = useState([]);
  const [allSubjectsData, setAllSubjectsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [processingAction, setProcessingAction] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [itemsPerPage] = useState(10);
  const [isMobile, setIsMobile] = useState(false);

  // ===== FORM DATA =====
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    category: 'primary',
    isActive: true
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    nameAr: '',
    category: 'primary',
    isActive: true
  });

  // ===== CATEGORIES =====
  const levelCategories = [
    { value: 'kindergarten', label: isArabic ? 'أولي' : 'Kindergarten', icon: <FaChild />, color: '#f39c12' },
    { value: 'primary', label: isArabic ? 'ابتدائي' : 'Primary', icon: <FaSchool />, color: '#2d6a4f' },
    { value: 'secondary', label: isArabic ? 'إعدادي' : 'Secondary', icon: <FaBuilding />, color: '#c49a6c' },
    { value: 'high_school', label: isArabic ? 'ثانوي' : 'High School', icon: <FaUniversity />, color: '#9b59b6' }
  ];

  // ===== SUBJECTS BY CATEGORY =====
  const defaultSubjectsByCategory = {
    kindergarten: [
      { value: 'quran_k', label: "Qur'an", labelAr: 'القرآن الكريم' },
      { value: 'english_k', label: 'English', labelAr: 'اللغة الإنجليزية' },
      { value: 'french_k', label: 'French', labelAr: 'اللغة الفرنسية' },
      { value: 'arabic_k', label: 'Arabic', labelAr: 'اللغة العربية' }
    ],
    primary: [
      { value: 'quran_p', label: "Qur'an", labelAr: 'القرآن الكريم' },
      { value: 'arabic_p', label: 'Arabic', labelAr: 'اللغة العربية' },
      { value: 'english_p', label: 'English', labelAr: 'اللغة الإنجليزية' },
      { value: 'french_p', label: 'French', labelAr: 'اللغة الفرنسية' },
      { value: 'mathematics_p', label: 'Mathematics', labelAr: 'الرياضيات' },
      { value: 'science_p', label: 'Science', labelAr: 'العلوم' },
      { value: 'sports_p', label: 'Sports', labelAr: 'الرياضة' },
      { value: 'ict_p', label: 'ICT', labelAr: 'تكنولوجيا المعلومات' },
      { value: 'art_p', label: 'Art & Plastic', labelAr: 'الفنون التشكيلية' },
      { value: 'geography_p', label: 'Geography', labelAr: 'الجغرافيا' }
    ],
    secondary: [
      { value: 'quran_s', label: "Qur'an", labelAr: 'القرآن الكريم' },
      { value: 'arabic_s', label: 'Arabic', labelAr: 'اللغة العربية' },
      { value: 'english_s', label: 'English', labelAr: 'اللغة الإنجليزية' },
      { value: 'french_s', label: 'French', labelAr: 'اللغة الفرنسية' },
      { value: 'mathematics_s', label: 'Mathematics', labelAr: 'الرياضيات' },
      { value: 'svt_s', label: 'SVT (Biology)', labelAr: 'علوم الحياة والأرض' },
      { value: 'physics_s', label: 'Physics', labelAr: 'الفيزياء' },
      { value: 'sports_s', label: 'Sports', labelAr: 'الرياضة' },
      { value: 'ict_s', label: 'ICT', labelAr: 'تكنولوجيا المعلومات' },
      { value: 'geography_s', label: 'Geography', labelAr: 'الجغرافيا' }
    ],
    high_school: [
      { value: 'quran_h', label: "Qur'an", labelAr: 'القرآن الكريم' },
      { value: 'arabic_h', label: 'Arabic', labelAr: 'اللغة العربية' },
      { value: 'english_h', label: 'English', labelAr: 'اللغة الإنجليزية' },
      { value: 'french_h', label: 'French', labelAr: 'اللغة الفرنسية' },
      { value: 'mathematics_h', label: 'Mathematics', labelAr: 'الرياضيات' },
      { value: 'svt_h', label: 'SVT (Biology)', labelAr: 'علوم الحياة والأرض' },
      { value: 'physics_h', label: 'Physics', labelAr: 'الفيزياء' },
      { value: 'sports_h', label: 'Sports', labelAr: 'الرياضة' },
      { value: 'ict_h', label: 'ICT', labelAr: 'تكنولوجيا المعلومات' },
      { value: 'geography_h', label: 'Geography', labelAr: 'الجغرافيا' },
      { value: 'philosophy_h', label: 'Philosophy', labelAr: 'الفلسفة' }
    ]
  };

  // ===== SAVE SUBJECTS TO SERVICE =====
  const saveSubjectsToService = () => {
    try {
      const allSubjects = {};
      levelCategories.forEach(cat => {
        const categorySubjects = allSubjectsData.filter(s => s.category === cat.value);
        allSubjects[cat.value] = categorySubjects.map(s => ({
          value: s.id || s.value,
          label: s.name,
          labelAr: s.nameAr || s.name
        }));
      });
      userDataService.saveSubjects(allSubjects);
      console.log('📚 Subjects saved to service');
    } catch (e) {
      console.error('Error saving subjects to service:', e);
    }
  };

  // ===== CHECK DARK MODE =====
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

  // ===== CHECK MOBILE =====
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

  // ===== GET ALL SUBJECTS WITH CATEGORIES =====
  const getAllSubjectsWithCategories = () => {
    const allSubjects = [];
    const categories = selectedCategory === 'all' 
      ? levelCategories 
      : levelCategories.filter(c => c.value === selectedCategory);
    
    categories.forEach(category => {
      let subjectsList = allSubjectsData.filter(s => s.category === category.value);
      if (subjectsList.length === 0) {
        const defaultList = defaultSubjectsByCategory[category.value] || [];
        subjectsList = defaultList.map((s, index) => ({
          id: `${category.value}_${index + 1}`,
          name: s.label,
          nameAr: s.labelAr || s.label,
          category: category.value,
          isActive: true,
          displayOrder: index
        }));
      }
      
      if (subjectsList.length > 0) {
        allSubjects.push({
          category: category.value,
          categoryLabel: category.label,
          categoryColor: category.color,
          subjects: subjectsList
        });
      }
    });
    return allSubjects;
  };

  // ===== GET COUNTS FOR EACH LEVEL =====
  const getLevelCounts = () => {
    const counts = {};
    levelCategories.forEach(cat => {
      counts[cat.value] = allSubjectsData.filter(s => s.category === cat.value).length;
    });
    return counts;
  };

  // ===== FETCH SUBJECTS =====
  const fetchSubjects = async () => {
    setLoading(true);
    setError(null);

    try {
      // First try to get from API
      const response = await api.get('/admin/subjects', {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: searchTerm,
          category: selectedCategory !== 'all' ? selectedCategory : undefined
        }
      });

      if (response.data.success && response.data.data.length > 0) {
        const allSubjects = response.data.allData || response.data.data;
        setAllSubjectsData(allSubjects);
        setSubjects(response.data.data);
        setTotalItems(response.data.pagination.total);
        setTotalPages(response.data.pagination.pages);
      } else {
        // Fallback to localStorage or default data
        let allSubjects = [];
        
        const savedSubjects = userDataService.getAllSubjects();
        if (savedSubjects && Object.keys(savedSubjects).length > 0) {
          Object.keys(savedSubjects).forEach(category => {
            const subjectsList = savedSubjects[category] || [];
            subjectsList.forEach(s => {
              allSubjects.push({
                id: s.value,
                name: s.label,
                nameAr: s.labelAr || s.label,
                category: category,
                isActive: true
              });
            });
          });
        } else {
          Object.keys(defaultSubjectsByCategory).forEach(category => {
            const subjectsList = defaultSubjectsByCategory[category] || [];
            subjectsList.forEach((s, index) => {
              allSubjects.push({
                id: `${category}_${index + 1}`,
                name: s.label,
                nameAr: s.labelAr || s.label,
                category: category,
                isActive: true
              });
            });
          });
        }
        
        setAllSubjectsData(allSubjects);
        
        let filteredSubjects = [...allSubjects];
        if (selectedCategory !== 'all') {
          filteredSubjects = filteredSubjects.filter(s => s.category === selectedCategory);
        }
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          filteredSubjects = filteredSubjects.filter(s =>
            s.name.toLowerCase().includes(searchLower) ||
            s.nameAr.toLowerCase().includes(searchLower)
          );
        }
        
        setTotalItems(filteredSubjects.length);
        setTotalPages(Math.ceil(filteredSubjects.length / itemsPerPage));
        
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const paginatedSubjects = filteredSubjects.slice(start, end);
        setSubjects(paginatedSubjects);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      let allSubjects = [];
      
      const savedSubjects = userDataService.getAllSubjects();
      if (savedSubjects && Object.keys(savedSubjects).length > 0) {
        Object.keys(savedSubjects).forEach(category => {
          const subjectsList = savedSubjects[category] || [];
          subjectsList.forEach(s => {
            allSubjects.push({
              id: s.value,
              name: s.label,
              nameAr: s.labelAr || s.label,
              category: category,
              isActive: true
            });
          });
        });
      } else {
        Object.keys(defaultSubjectsByCategory).forEach(category => {
          const subjectsList = defaultSubjectsByCategory[category] || [];
          subjectsList.forEach((s, index) => {
            allSubjects.push({
              id: `${category}_${index + 1}`,
              name: s.label,
              nameAr: s.labelAr || s.label,
              category: category,
              isActive: true
            });
          });
        });
      }
      
      setAllSubjectsData(allSubjects);
      
      let filteredSubjects = [...allSubjects];
      if (selectedCategory !== 'all') {
        filteredSubjects = filteredSubjects.filter(s => s.category === selectedCategory);
      }
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filteredSubjects = filteredSubjects.filter(s =>
          s.name.toLowerCase().includes(searchLower) ||
          s.nameAr.toLowerCase().includes(searchLower)
        );
      }
      
      setTotalItems(filteredSubjects.length);
      setTotalPages(Math.ceil(filteredSubjects.length / itemsPerPage));
      
      const start = (currentPage - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      const paginatedSubjects = filteredSubjects.slice(start, end);
      setSubjects(paginatedSubjects);
    } finally {
      setLoading(false);
    }
  };

  // ===== EFFECTS =====
  useEffect(() => {
    fetchSubjects();
  }, [currentPage, selectedCategory]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (currentPage === 1) {
        fetchSubjects();
      } else {
        setCurrentPage(1);
      }
    }, 500);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  // ===== GET CATEGORY DISPLAY =====
  const getCategoryDisplay = (category) => {
    const found = levelCategories.find(c => c.value === category);
    return found ? found.label : category;
  };

  const getCategoryIcon = (category) => {
    const found = levelCategories.find(c => c.value === category);
    return found ? found.icon : <FaBook />;
  };

  const getCategoryColor = (category) => {
    const found = levelCategories.find(c => c.value === category);
    return found ? found.color : '#6c757d';
  };

  // ===== HANDLE ADD SUBJECT =====
  const handleAddSubject = async () => {
    if (!formData.name || !formData.category) {
      notify(
        isArabic ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields',
        'warning'
      );
      return;
    }

    setProcessingAction(true);
    try {
      const response = await api.post('/admin/subjects', formData);
      if (response.data.success) {
        notify(
          isArabic ? 'تم إضافة المادة بنجاح' : 'Subject added successfully',
          'success'
        );
        setShowAddModal(false);
        resetFormData();
        await fetchSubjects();
        saveSubjectsToService();
      }
    } catch (error) {
      console.error('Error adding subject:', error);
      const newSubject = {
        id: Date.now(),
        ...formData,
        isActive: true
      };
      setAllSubjectsData([...allSubjectsData, newSubject]);
      saveSubjectsToService();
      await fetchSubjects();
      notify(
        isArabic ? 'تم إضافة المادة بنجاح' : 'Subject added successfully',
        'success'
      );
      setShowAddModal(false);
      resetFormData();
    } finally {
      setProcessingAction(false);
    }
  };

  // ===== RESET FORM DATA =====
  const resetFormData = () => {
    setFormData({
      name: '',
      nameAr: '',
      category: 'primary',
      isActive: true
    });
  };

  // ===== HANDLE EDIT SUBJECT =====
  const handleEditSubject = (subject) => {
    setSelectedSubject(subject);
    setEditFormData({
      name: subject.name,
      nameAr: subject.nameAr || '',
      category: subject.category,
      isActive: subject.isActive !== false
    });
    setShowEditModal(true);
  };

  // ===== HANDLE SAVE EDIT =====
  const handleSaveEdit = async () => {
    setProcessingAction(true);
    try {
      const response = await api.put(`/admin/subjects/${selectedSubject.id}`, editFormData);
      if (response.data.success) {
        notify(
          isArabic ? 'تم تحديث المادة بنجاح' : 'Subject updated successfully',
          'success'
        );
        setShowEditModal(false);
        await fetchSubjects();
        saveSubjectsToService();
      }
    } catch (error) {
      console.error('Error updating subject:', error);
      setAllSubjectsData(allSubjectsData.map(s => 
        s.id === selectedSubject.id ? { ...s, ...editFormData } : s
      ));
      saveSubjectsToService();
      await fetchSubjects();
      notify(
        isArabic ? 'تم تحديث المادة بنجاح' : 'Subject updated successfully',
        'success'
      );
      setShowEditModal(false);
    } finally {
      setProcessingAction(false);
    }
  };

  // ===== HANDLE DELETE SUBJECT =====
  const handleDeleteSubject = async () => {
    setProcessingAction(true);
    try {
      const response = await api.delete(`/admin/subjects/${selectedSubject.id}`);
      if (response.data.success) {
        notify(
          isArabic ? 'تم حذف المادة بنجاح' : 'Subject deleted successfully',
          'success'
        );
        setShowDeleteConfirm(false);
        await fetchSubjects();
        saveSubjectsToService();
      }
    } catch (error) {
      console.error('Error deleting subject:', error);
      setAllSubjectsData(allSubjectsData.filter(s => s.id !== selectedSubject.id));
      saveSubjectsToService();
      await fetchSubjects();
      notify(
        isArabic ? 'تم حذف المادة بنجاح' : 'Subject deleted successfully',
        'success'
      );
      setShowDeleteConfirm(false);
    } finally {
      setProcessingAction(false);
    }
  };

  // ===== TOGGLE SUBJECT STATUS =====
  const handleToggleStatus = async (subjectId, currentStatus) => {
    const newStatus = !currentStatus;
    try {
      const response = await api.put(`/admin/subjects/${subjectId}/status`, { isActive: newStatus });
      if (response.data.success) {
        notify(
          isArabic ? `تم ${newStatus ? 'تفعيل' : 'تعطيل'} المادة بنجاح` : 
          `Subject ${newStatus ? 'activated' : 'deactivated'} successfully`,
          'success'
        );
        await fetchSubjects();
        saveSubjectsToService();
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      setAllSubjectsData(allSubjectsData.map(s => 
        s.id === subjectId ? { ...s, isActive: newStatus } : s
      ));
      saveSubjectsToService();
      await fetchSubjects();
      notify(
        isArabic ? `تم ${newStatus ? 'تفعيل' : 'تعطيل'} المادة بنجاح` : 
        `Subject ${newStatus ? 'activated' : 'deactivated'} successfully`,
        'success'
      );
    }
  };

  // ===== GET LEVEL COUNTS =====
  const levelCounts = getLevelCounts();

  // ===== RENDER =====
  return (
    <div className="subjects-management" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Page Header */}
      <div className="page-header d-flex flex-wrap flex-sm-nowrap justify-content-between align-items-center gap-2 gap-md-3 mb-3 mb-md-4">
        <div className="flex-grow-1 min-width-0">
          <h4 className="fw-bold mb-0 mb-sm-1" style={{ 
            ...arabicFontStyle, 
            color: '#4a9eff', 
            fontSize: isArabic ? 'clamp(1rem, 2vw, 1.5rem)' : 'clamp(0.95rem, 1.8vw, 1.4rem)' 
          }}>
            <FaBook className="me-2" /> 
            {isArabic ? 'إدارة المواد الدراسية' : 'Subjects Management'}
          </h4>
          <p className="text-muted mb-0 d-none d-sm-block" style={{ 
            ...arabicFontStyle, 
            fontSize: isArabic ? 'clamp(0.8rem, 1vw, 0.95rem)' : 'clamp(0.75rem, 0.9vw, 0.9rem)' 
          }}>
            {isArabic 
              ? `عرض جميع المواد الدراسية في النظام (${formatNumber(totalItems)})`
              : `View all subjects in the system (${formatNumber(totalItems)})`}
          </p>
        </div>
        <div className="d-flex gap-1 gap-sm-2 flex-wrap flex-shrink-0">
          <Button 
            variant="outline-primary" 
            size="sm" 
            onClick={fetchSubjects}
            disabled={loading}
            style={{ 
              ...arabicFontStyle, 
              borderRadius: '12px',
              fontSize: isArabic ? 'clamp(0.65rem, 0.8vw, 0.85rem)' : 'clamp(0.6rem, 0.75vw, 0.8rem)',
              padding: isMobile ? '4px 8px' : '4px 12px'
            }}
          >
            <FaSync className={loading ? 'spinning' : ''} /> 
            <span className="d-none d-sm-inline">{isArabic ? 'تحديث' : 'Refresh'}</span>
          </Button>
          <Button 
            variant="primary" 
            size="sm" 
            onClick={() => setShowAddModal(true)}
            style={{ 
              ...arabicFontStyle, 
              borderRadius: '12px',
              fontSize: isArabic ? 'clamp(0.65rem, 0.8vw, 0.85rem)' : 'clamp(0.6rem, 0.75vw, 0.8rem)',
              padding: isMobile ? '4px 8px' : '4px 12px'
            }}
          >
            <FaPlus className="me-1" /> 
            <span className="d-none d-sm-inline">{isArabic ? 'إضافة مادة' : 'Add Subject'}</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <Row className="g-2 g-sm-3 g-md-4 mb-3 mb-md-4">
        {levelCategories.map((cat) => (
          <Col key={cat.value} xs={6} sm={6} md={3}>
            <div className={`stat-card-enhanced ${cat.value === 'primary' ? 'total-card' : cat.value === 'secondary' ? 'active-card' : cat.value === 'high_school' ? 'children-card' : 'inactive-card'}`}>
              <div className="stat-card-gradient-bar"></div>
              <div className="stat-card-content">
                <div className={`stat-icon-wrapper ${cat.value === 'primary' ? 'total-icon' : cat.value === 'secondary' ? 'active-icon' : cat.value === 'high_school' ? 'children-icon' : 'inactive-icon'}`}>
                  {cat.icon}
                </div>
                <div className="stat-info">
                  <span className="stat-number" style={{ color: darkMode ? '#e9ecef' : '#1a1a2e' }}>
                    {formatNumber(levelCounts[cat.value] || 0)}
                  </span>
                  <span className="stat-label" style={{ color: darkMode ? '#adb5bd' : '#6c757d' }}>
                    {cat.label}
                  </span>
                </div>
              </div>
              <div className="stat-card-shimmer"></div>
            </div>
          </Col>
        ))}
      </Row>

      {/* Filters */}
      <Card className="modern-card mb-3 mb-md-4" style={{ background: darkMode ? '#1a1a2e' : '#ffffff', borderColor: darkMode ? '#2d2d44' : '#e9ecef' }}>
        <Card.Body className="p-2 p-md-3">
          <Row className="g-1 g-md-2">
            <Col xs={12} sm={7} md={8} lg={9}>
              <InputGroup size="sm">
                <InputGroup.Text style={{ background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px 0 0 12px' }}>
                  <FaSearch className="text-muted" size={isMobile ? 12 : 14} />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder={isArabic ? 'بحث بالاسم...' : 'Search by name...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? 'clamp(0.6rem, 0.8vw, 0.8rem)' : 'clamp(0.65rem, 0.8vw, 0.85rem)' }}
                />
                {searchTerm && (
                  <Button 
                    variant="outline-secondary" 
                    size="sm"
                    onClick={() => setSearchTerm('')}
                    style={{ ...arabicFontStyle, borderRadius: '0 12px 12px 0' }}
                  >
                    <FaTimesCircle size={isMobile ? 12 : 14} />
                  </Button>
                )}
              </InputGroup>
            </Col>
            <Col xs={12} sm={5} md={4} lg={3}>
              <Form.Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{ 
                  ...arabicFontStyle, 
                  background: darkMode ? '#2d2d44' : 'white', 
                  color: darkMode ? '#e9ecef' : '#212529', 
                  borderRadius: '12px',
                  fontSize: isMobile ? 'clamp(0.6rem, 0.8vw, 0.8rem)' : 'clamp(0.65rem, 0.8vw, 0.85rem)'
                }}
              >
                <option value="all">{isArabic ? 'جميع المستويات' : 'All Levels'}</option>
                {levelCategories.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Subjects Table */}
      <Card className="modern-card" style={{ background: darkMode ? '#1a1a2e' : '#ffffff', borderColor: darkMode ? '#2d2d44' : '#e9ecef' }}>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 text-muted" style={arabicFontStyle}>
                {isArabic ? 'جاري تحميل المواد...' : 'Loading subjects...'}
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-5">
              <FaExclamationTriangle size={48} className="text-warning mb-3" />
              <p className="text-danger" style={arabicFontStyle}>{error}</p>
              <Button variant="primary" onClick={fetchSubjects} style={{ ...arabicFontStyle, borderRadius: '12px' }}>
                <FaSync className="me-2" /> {isArabic ? 'إعادة المحاولة' : 'Retry'}
              </Button>
            </div>
          ) : subjects.length === 0 ? (
            <div className="text-center py-5">
              <FaBook size={48} className="text-muted opacity-25 mb-3" />
              <p style={arabicFontStyle}>
                {isArabic ? 'لا توجد مواد لعرضها' : 'No subjects to display'}
              </p>
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
                        {isArabic ? 'المادة' : 'Subject'}
                      </th>
                      <th style={{ color: darkMode ? '#e9ecef' : '#212529', whiteSpace: 'nowrap' }} className="d-none d-sm-table-cell">
                        {isArabic ? 'المستوى' : 'Level'}
                      </th>
                      <th style={{ color: darkMode ? '#e9ecef' : '#212529', whiteSpace: 'nowrap' }} className="d-none d-sm-table-cell">
                        {isArabic ? 'الحالة' : 'Status'}
                      </th>
                      <th className="text-center" style={{ color: darkMode ? '#e9ecef' : '#212529', whiteSpace: 'nowrap', width: isMobile ? '100px' : 'auto' }}>
                        {isArabic ? 'إجراءات' : 'Actions'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((subject, index) => {
                      const globalIndex = (currentPage - 1) * itemsPerPage + index + 1;
                      const categoryColor = getCategoryColor(subject.category);
                      
                      return (
                        <tr key={subject.id}>
                          <td style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.75rem' : 'inherit' }}>
                            {formatNumber(globalIndex)}
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div 
                                className="subject-avatar-sm"
                                style={{
                                  background: `linear-gradient(135deg, ${categoryColor}, ${categoryColor}dd)`,
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
                                {(subject.nameAr || subject.name).charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="fw-semibold" style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.8rem' : 'inherit' }}>
                                  {isArabic ? subject.nameAr || subject.name : subject.name}
                                </div>
                                {subject.nameAr && subject.nameAr !== subject.name && (
                                  <small className="text-muted d-none d-sm-block" style={{ ...arabicFontStyle, fontSize: '0.65rem' }}>
                                    {isArabic ? subject.name : subject.nameAr}
                                  </small>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="d-none d-sm-table-cell">
                            <Badge 
                              style={{ 
                                background: categoryColor,
                                color: 'white',
                                padding: '4px 10px',
                                borderRadius: '8px',
                                fontSize: isMobile ? '0.6rem' : '0.7rem'
                              }}
                            >
                              {getCategoryIcon(subject.category)} {getCategoryDisplay(subject.category)}
                            </Badge>
                          </td>
                          <td className="d-none d-sm-table-cell">
                            <Badge 
                              className={subject.isActive !== false ? 'bg-success' : 'bg-secondary'}
                              style={{ padding: '4px 10px', borderRadius: '8px', fontSize: isMobile ? '0.6rem' : '0.7rem' }}
                            >
                              {subject.isActive !== false ? (
                                <><FaCheckCircle className="me-1" size={isMobile ? 8 : 10} /> {isArabic ? 'نشط' : 'Active'}</>
                              ) : (
                                <><FaTimesCircle className="me-1" size={isMobile ? 8 : 10} /> {isArabic ? 'غير نشط' : 'Inactive'}</>
                              )}
                            </Badge>
                          </td>
                          <td>
                            <div className="d-flex gap-1 justify-content-center flex-wrap">
                              <Button
                                variant="outline-warning"
                                size="sm"
                                onClick={() => handleEditSubject(subject)}
                                title={isArabic ? 'تعديل' : 'Edit'}
                                style={{ 
                                  borderRadius: '8px', 
                                  padding: isMobile ? '2px 6px' : '4px 8px',
                                  fontSize: isMobile ? '0.6rem' : 'inherit'
                                }}
                              >
                                <FaEdit size={isMobile ? 10 : 14} />
                              </Button>
                              <Button
                                variant={subject.isActive !== false ? 'outline-danger' : 'outline-success'}
                                size="sm"
                                onClick={() => handleToggleStatus(subject.id, subject.isActive !== false)}
                                title={subject.isActive !== false ? (isArabic ? 'تعطيل' : 'Deactivate') : (isArabic ? 'تفعيل' : 'Activate')}
                                style={{ 
                                  borderRadius: '8px', 
                                  padding: isMobile ? '2px 6px' : '4px 8px',
                                  fontSize: isMobile ? '0.6rem' : 'inherit'
                                }}
                              >
                                {subject.isActive !== false ? <FaTimesCircle size={isMobile ? 10 : 14} /> : <FaCheckCircle size={isMobile ? 10 : 14} />}
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => { setSelectedSubject(subject); setShowDeleteConfirm(true); }}
                                title={isArabic ? 'حذف' : 'Delete'}
                                style={{ 
                                  borderRadius: '8px', 
                                  padding: isMobile ? '2px 6px' : '4px 8px',
                                  fontSize: isMobile ? '0.6rem' : 'inherit'
                                }}
                              >
                                <FaTrash size={isMobile ? 10 : 14} />
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
                      ? `عرض ${formatNumber(subjects.length)} من ${formatNumber(totalItems)} مادة`
                      : `Showing ${formatNumber(subjects.length)} of ${formatNumber(totalItems)} subjects`}
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

      {/* ===== ADD SUBJECT MODAL ===== */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered size={isMobile ? 'md' : 'lg'} className="modern-modal">
        <Modal.Header closeButton className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Modal.Title style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '1rem' : 'inherit' }}>
            <FaPlus className="me-2 text-primary" />
            {isArabic ? 'إضافة مادة جديدة' : 'Add New Subject'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? '#0d1117' : 'white' }}>
          <Form>
            <Row>
              <Col md={6} xs={12}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.8rem' : 'inherit' }}>
                    {isArabic ? 'اسم المادة (إنجليزي)' : 'Subject Name (English)'} *
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Mathematics"
                    style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: isMobile ? '0.85rem' : 'inherit' }}
                  />
                </Form.Group>
              </Col>
              <Col md={6} xs={12}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.8rem' : 'inherit' }}>
                    {isArabic ? 'اسم المادة (عربي)' : 'Subject Name (Arabic)'} *
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.nameAr}
                    onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                    placeholder="مثال: الرياضيات"
                    style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: isMobile ? '0.85rem' : 'inherit' }}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.8rem' : 'inherit' }}>
                {isArabic ? 'المستوى التعليمي' : 'Education Level'} *
              </Form.Label>
              <Form.Select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: isMobile ? '0.85rem' : 'inherit' }}
              >
                {levelCategories.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="switch"
                id="subjectStatus"
                label={isArabic ? 'المادة نشطة' : 'Subject Active'}
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
          <Button variant="primary" onClick={handleAddSubject} disabled={processingAction} style={{ ...arabicFontStyle, borderRadius: '12px', fontSize: isMobile ? '0.8rem' : 'inherit' }}>
            {processingAction ? (
              <><FaSpinner className="spinning me-2" /> {isArabic ? 'جاري...' : 'Adding...'}</>
            ) : (
              <><FaSave className="me-2" /> {isArabic ? 'إضافة' : 'Add'}</>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===== EDIT SUBJECT MODAL ===== */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered size={isMobile ? 'md' : 'lg'} className="modern-modal">
        <Modal.Header closeButton className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Modal.Title style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '1rem' : 'inherit' }}>
            <FaEdit className="me-2 text-warning" />
            {isArabic ? 'تعديل المادة' : 'Edit Subject'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? '#0d1117' : 'white' }}>
          <Form>
            <Row>
              <Col md={6} xs={12}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.8rem' : 'inherit' }}>
                    {isArabic ? 'اسم المادة (إنجليزي)' : 'Subject Name (English)'} *
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: isMobile ? '0.85rem' : 'inherit' }}
                  />
                </Form.Group>
              </Col>
              <Col md={6} xs={12}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.8rem' : 'inherit' }}>
                    {isArabic ? 'اسم المادة (عربي)' : 'Subject Name (Arabic)'} *
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={editFormData.nameAr}
                    onChange={(e) => setEditFormData({ ...editFormData, nameAr: e.target.value })}
                    style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: isMobile ? '0.85rem' : 'inherit' }}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.8rem' : 'inherit' }}>
                {isArabic ? 'المستوى التعليمي' : 'Education Level'} *
              </Form.Label>
              <Form.Select
                value={editFormData.category}
                onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px', fontSize: isMobile ? '0.85rem' : 'inherit' }}
              >
                {levelCategories.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="switch"
                id="editSubjectStatus"
                label={isArabic ? 'المادة نشطة' : 'Subject Active'}
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
              ? `هل أنت متأكد من حذف المادة "${selectedSubject?.name}"؟ هذا الإجراء لا يمكن التراجع عنه.`
              : `Are you sure you want to delete subject "${selectedSubject?.name}"? This action cannot be undone.`}
          </p>
          {selectedSubject?.isActive !== false && (
            <Alert variant="warning" style={{ ...arabicFontStyle, fontSize: isMobile ? '0.8rem' : 'inherit' }}>
              {isArabic
                ? 'تحذير: هذه المادة نشطة وقد تكون مرتبطة بفصول أو طلاب.'
                : 'Warning: This subject is active and may be linked to classes or students.'}
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)} disabled={processingAction} style={{ ...arabicFontStyle, borderRadius: '12px', fontSize: isMobile ? '0.8rem' : 'inherit' }}>
            {isArabic ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button variant="danger" onClick={handleDeleteSubject} disabled={processingAction} style={{ ...arabicFontStyle, borderRadius: '12px', fontSize: isMobile ? '0.8rem' : 'inherit' }}>
            {processingAction ? (
              <><FaSpinner className="spinning me-2" /> {isArabic ? 'جاري...' : 'Deleting...'}</>
            ) : (
              <><FaTrash className="me-2" /> {isArabic ? 'تأكيد الحذف' : 'Confirm Delete'}</>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .subjects-management { 
          padding: 0;
          max-width: 100vw;
          overflow-x: hidden;
        }

        .subjects-management * {
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

        /* ===== PAGE HEADER ===== */
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        [dir="rtl"] .page-header {
          flex-direction: row-reverse;
        }

        @media (max-width: 576px) {
          .page-header {
            flex-direction: column;
            align-items: stretch !important;
          }
          [dir="rtl"] .page-header {
            align-items: stretch !important;
          }
          .page-header .d-flex {
            justify-content: flex-start;
          }
          [dir="rtl"] .page-header .d-flex {
            justify-content: flex-end;
          }
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
          background: linear-gradient(90deg, #4a9eff, #6ab0ff);
        }

        .active-card .stat-card-gradient-bar {
          background: linear-gradient(90deg, #2ecc71, #27ae60);
        }

        .children-card .stat-card-gradient-bar {
          background: linear-gradient(90deg, #9b59b6, #8e44ad);
        }

        .inactive-card .stat-card-gradient-bar {
          background: linear-gradient(90deg, #e74c3c, #c0392b);
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
          background: rgba(74, 158, 255, 0.15);
          color: #4a9eff;
        }

        .active-icon {
          background: rgba(46, 204, 113, 0.15);
          color: #2ecc71;
        }

        .children-icon {
          background: rgba(155, 89, 182, 0.15);
          color: #9b59b6;
        }

        .inactive-icon {
          background: rgba(231, 76, 60, 0.15);
          color: #e74c3c;
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

        /* ===== SUBJECT AVATARS ===== */
        .subject-avatar-sm {
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          flex-shrink: 0;
          transition: transform 0.3s ease;
        }

        .subject-avatar-sm:hover {
          transform: scale(1.15);
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

          .subject-avatar-sm {
            width: 28px;
            height: 28px;
            font-size: 0.65rem;
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

          .subject-avatar-sm {
            width: 24px;
            height: 24px;
            font-size: 0.55rem;
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

          /* Stats cards - 2 per row on mobile */
          .subjects-management .row > .col-6 {
            flex: 0 0 50%;
            max-width: 50%;
            padding: 4px;
          }

          /* Hide level and status columns on mobile */
          .table-responsive table thead tr th:nth-child(3),
          .table-responsive table tbody tr td:nth-child(3),
          .table-responsive table thead tr th:nth-child(4),
          .table-responsive table tbody tr td:nth-child(4) {
            display: none;
          }

          .pagination {
            flex-wrap: wrap;
            justify-content: center;
          }
        }

        @media (max-width: 400px) {
          .stat-card-enhanced {
            padding: 8px 10px;
            min-height: 60px;
          }

          .stat-number {
            font-size: 0.9rem;
          }

          .stat-icon-wrapper {
            width: 28px;
            height: 28px;
            font-size: 0.75rem;
          }

          .stat-label {
            font-size: 0.5rem;
          }

          .subject-avatar-sm {
            width: 20px;
            height: 20px;
            font-size: 0.45rem;
          }

          .page-header h4 {
            font-size: 0.85rem !important;
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

        [dir="rtl"] .form-select {
          background-position: left 0.75rem center !important;
          padding-right: 0.75rem !important;
          padding-left: 2rem !important;
        }

        [dir="rtl"] .modal-header .btn-close {
          margin-left: 0 !important;
          margin-right: auto !important;
        }

        [dir="rtl"] .modal-header .me-2 {
          margin-right: 0 !important;
          margin-left: 0.5rem !important;
        }
      `}</style>
    </div>
  );
};

export default SubjectsManagement;