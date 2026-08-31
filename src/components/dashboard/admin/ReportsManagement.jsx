// src/components/dashboard/admin/ReportsManagement.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Form, Modal, Alert, Pagination, InputGroup, Dropdown, ProgressBar } from 'react-bootstrap';
import { 
  FaFilePdf, FaDownload, FaPlus, FaEye, FaSearch, FaFilter,
  FaUserGraduate, FaChalkboardTeacher, FaSchool, FaBook,
  FaChartBar, FaChartLine, FaChartPie, FaCalendarAlt,
  FaCheckCircle, FaTimesCircle, FaClock, FaUsers,
  FaGraduationCap, FaAward, FaFileAlt, FaFileExcel,
  FaExclamationTriangle, FaChevronDown, FaChevronUp,
  FaPrint, FaShare, FaEnvelope, FaSync, FaArrowRight,
  FaStar, FaRegStar, FaInfoCircle, FaBuilding,
  FaUserFriends, FaClipboardCheck, FaRocket, FaTrophy,
  FaMoneyBillWave, FaPercent, FaArrowUp, FaArrowDown,
  FaCog, FaSlidersH, FaCalendarWeek, FaClock as FaClockIcon,
  FaMicroscope, FaFlask, FaQuran, FaGlobe
} from 'react-icons/fa';
import { useLanguage } from '../../../context/LanguageContext';
import { getTranslation } from '../../../utils/translations';
import { useNotification } from '../../../hooks/useNotification';
import { useAuth } from '../../../hooks/useAuth';
import { Bar, Doughnut, Line, Pie } from 'react-chartjs-2';
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
  Filler
} from 'chart.js';

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
  Filler
);

// ===== ALWAYS use English numbers - NO Arabic numeral conversion =====
const formatNumber = (num) => {
  return num.toString(); // Always returns English numbers
};

const ReportsManagement = () => {
  const { language, isArabic } = useLanguage();
  const t = (key) => getTranslation(key, language);
  const { notify } = useNotification();
  const { user } = useAuth();
  
  // ===== ARABIC FONT STYLE =====
  const arabicFontStyle = {
    fontFamily: isArabic ? '"Hacen Tunisia", "Hacen Tunisia Bd", "Noto Sans Arabic", "Vazirmatn", "Traditional Arabic", "Arabic Typesetting", serif' : 'inherit',
    lineHeight: isArabic ? '1.8' : '1.6',
    letterSpacing: isArabic ? '0.5px' : '0px',
    fontSize: isArabic ? 'clamp(0.9rem, 1.1vw, 1.05rem)' : 'clamp(0.85rem, 1vw, 1rem)',
  };

  // ===== STATE =====
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState('all');
  const [dateRange, setDateRange] = useState('month');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [generatedReports, setGeneratedReports] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const itemsPerPage = 4;

  // ===== Check dark mode =====
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

  // ===== GENERATE REPORTS =====
  const generateReports = () => {
    setGenerating(true);
    setTimeout(() => {
      const reports = [
        {
          id: 1,
          title: isArabic ? 'تقرير الطلاب' : 'Student Report',
          description: isArabic ? 'تقرير شامل عن جميع الطلاب المسجلين' : 'Comprehensive report of all registered students',
          type: 'students',
          category: isArabic ? 'أكاديمي' : 'academic',
          icon: <FaUserGraduate />,
          color: '#1a5f7a',
          gradient: 'linear-gradient(135deg, #1a5f7a 0%, #2a7f9a 100%)',
          chartType: 'bar',
          data: {
            total: 520,
            new: 45,
            active: 480,
            inactive: 40,
            levels: {
              kindergarden: 80,
              primary: 180,
              secondary: 140,
              highSchool: 120
            },
            gender: {
              male: 280,
              female: 240
            }
          },
          generatedAt: new Date().toISOString(),
          size: '2.4 MB',
          pages: 12
        },
        {
          id: 2,
          title: isArabic ? 'تقرير المعلمين' : 'Teacher Report',
          description: isArabic ? 'تقرير شامل عن جميع المعلمين' : 'Comprehensive report of all teachers',
          type: 'teachers',
          category: isArabic ? 'الموظفين' : 'staff',
          icon: <FaChalkboardTeacher />,
          color: '#2d6a4f',
          gradient: 'linear-gradient(135deg, #2d6a4f 0%, #40916c 100%)',
          chartType: 'pie',
          data: {
            total: 35,
            fullTime: 30,
            partTime: 5,
            subjects: {
              'Science': 8,
              'Mathematics': 6,
              'English': 5,
              'Arabic': 4,
              'French': 3,
              'Islamic Studies': 4,
              'ICT': 3,
              'Sports': 2
            }
          },
          generatedAt: new Date().toISOString(),
          size: '1.8 MB',
          pages: 8
        },
        {
          id: 3,
          title: isArabic ? 'تقرير الحضور' : 'Attendance Report',
          description: isArabic ? 'تقرير الحضور الشهري للطلاب' : 'Monthly attendance report for students',
          type: 'attendance',
          category: isArabic ? 'أكاديمي' : 'academic',
          icon: <FaClockIcon />,
          color: '#f39c12',
          gradient: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)',
          chartType: 'line',
          data: {
            overall: 92,
            present: 478,
            absent: 42,
            excused: 20,
            monthlyTrend: [85, 88, 90, 87, 92, 95]
          },
          generatedAt: new Date().toISOString(),
          size: '1.2 MB',
          pages: 6
        },
        {
          id: 4,
          title: isArabic ? 'تقرير الدرجات' : 'Grades Report',
          description: isArabic ? 'تقرير درجات الطلاب والأداء' : 'Student grades and performance report',
          type: 'grades',
          category: isArabic ? 'أكاديمي' : 'academic',
          icon: <FaAward />,
          color: '#c49a6c',
          gradient: 'linear-gradient(135deg, #c49a6c 0%, #dbb88a 100%)',
          chartType: 'bar',
          data: {
            average: 78,
            excellent: 85,
            good: 120,
            fair: 180,
            poor: 35,
            subjects: {
              'Mathematics': 82,
              'Science': 79,
              'English': 85,
              'Arabic': 88,
              'French': 76,
              'Islamic Studies': 92
            }
          },
          generatedAt: new Date().toISOString(),
          size: '3.1 MB',
          pages: 15
        },
        {
          id: 5,
          title: isArabic ? 'تقرير مالي' : 'Financial Report',
          description: isArabic ? 'ملخص مالي للمدرسة' : 'School financial summary',
          type: 'financial',
          category: isArabic ? 'إداري' : 'admin',
          icon: <FaMoneyBillWave />,
          color: '#eb3349',
          gradient: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
          chartType: 'doughnut',
          data: {
            revenue: 1250000,
            expenses: 980000,
            profit: 270000,
            categories: {
              'Salaries': 650000,
              'Operations': 180000,
              'Facilities': 90000,
              'Materials': 60000
            }
          },
          generatedAt: new Date().toISOString(),
          size: '2.7 MB',
          pages: 10
        },
        {
          id: 6,
          title: isArabic ? 'توزيع المستويات' : 'Level Distribution',
          description: isArabic ? 'توزيع الطلاب حسب المستويات التعليمية' : 'Student distribution by education levels',
          type: 'levels',
          category: isArabic ? 'أكاديمي' : 'academic',
          icon: <FaBuilding />,
          color: '#6c757d',
          gradient: 'linear-gradient(135deg, #6c757d 0%, #adb5bd 100%)',
          chartType: 'doughnut',
          data: {
            kindergarden: 80,
            primary: 180,
            secondary: 140,
            highSchool: 120
          },
          generatedAt: new Date().toISOString(),
          size: '0.9 MB',
          pages: 4
        }
      ];
      setGeneratedReports(reports);
      setGenerating(false);
      notify(
        isArabic ? 'تم إنشاء التقارير بنجاح' : 'Reports generated successfully',
        'success'
      );
    }, 2000);
  };

  // ===== Load reports on mount =====
  useEffect(() => {
    generateReports();
  }, []);

  // ===== Refresh function =====
  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      generateReports();
      setRefreshing(false);
      notify(t('Data refreshed successfully'), 'info');
    }, 800);
  };

  // ===== Filter reports =====
  const filteredReports = generatedReports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || report.category.toLowerCase() === filterCategory.toLowerCase();
    const matchesType = reportType === 'all' || report.type === reportType;
    return matchesSearch && matchesCategory && matchesType;
  });

  // ===== Pagination =====
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const displayedReports = filteredReports.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ===== Stats =====
  const stats = {
    total: generatedReports.length,
    academic: generatedReports.filter(r => r.category === 'academic' || r.category === isArabic ? 'أكاديمي' : 'academic').length,
    staff: generatedReports.filter(r => r.category === 'staff' || r.category === isArabic ? 'الموظفين' : 'staff').length,
    admin: generatedReports.filter(r => r.category === 'admin' || r.category === isArabic ? 'إداري' : 'admin').length,
  };

  // ===== Report categories =====
  const categories = [
    { value: 'all', label: t('All') },
    { value: 'academic', label: t('Academic') },
    { value: 'staff', label: t('Staff') },
    { value: 'admin', label: t('Administrative') },
  ];

  const reportTypes = [
    { value: 'all', label: t('All Types') },
    { value: 'students', label: t('Students') },
    { value: 'teachers', label: t('Teachers') },
    { value: 'attendance', label: t('Attendance') },
    { value: 'grades', label: t('Grades') },
    { value: 'financial', label: t('Financial') },
    { value: 'levels', label: t('Levels') },
  ];

  // ===== Stats cards with gradients =====
  const statsCards = [
    {
      label: t('Total'),
      value: stats.total,
      icon: <FaFileAlt />,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      shadow: '0 8px 30px rgba(102, 126, 234, 0.4)',
      detail: t('All reports')
    },
    {
      label: t('Academic'),
      value: stats.academic,
      icon: <FaBook />,
      gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      shadow: '0 8px 30px rgba(17, 153, 142, 0.4)',
      detail: t('Academic reports')
    },
    {
      label: t('Staff'),
      value: stats.staff,
      icon: <FaUsers />,
      gradient: 'linear-gradient(135deg, #f2994a 0%, #f2c94c 100%)',
      shadow: '0 8px 30px rgba(242, 153, 74, 0.4)',
      detail: t('Staff reports')
    },
    {
      label: t('Administrative'),
      value: stats.admin,
      icon: <FaClipboardCheck />,
      gradient: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
      shadow: '0 8px 30px rgba(235, 51, 73, 0.4)',
      detail: t('Administrative reports')
    },
  ];

  // ===== Chart data for preview =====
  const getChartData = (report) => {
    if (!report || !report.data) return null;

    const textColor = darkMode ? '#e9ecef' : '#2d3436';
    const gridColor = darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

    if (report.type === 'students') {
      const levelLabels = isArabic ? ['أولي', 'ابتدائي', 'إعدادي', 'ثانوي'] : ['Kindergarden', 'Primary', 'Secondary', 'High School'];
      return {
        labels: levelLabels,
        datasets: [{
          label: isArabic ? 'عدد الطلاب' : 'Number of Students',
          data: [
            report.data.levels.kindergarden || 0,
            report.data.levels.primary || 0,
            report.data.levels.secondary || 0,
            report.data.levels.highSchool || 0
          ],
          backgroundColor: ['#f39c12', '#2d6a4f', '#c49a6c', '#6c757d'],
          borderColor: darkMode ? '#2d3436' : '#ffffff',
          borderWidth: 2,
          borderRadius: 8,
        }]
      };
    }

    if (report.type === 'teachers') {
      const subjectLabels = Object.keys(report.data.subjects || {});
      const subjectValues = Object.values(report.data.subjects || {});
      const colors = ['#3498db', '#2ecc71', '#f39c12', '#e74c3c', '#9b59b6', '#1abc9c', '#e67e22', '#2c3e50'];
      return {
        labels: subjectLabels,
        datasets: [{
          label: isArabic ? 'عدد المعلمين' : 'Number of Teachers',
          data: subjectValues,
          backgroundColor: colors.slice(0, subjectValues.length),
          borderColor: darkMode ? '#2d3436' : '#ffffff',
          borderWidth: 2,
        }]
      };
    }

    if (report.type === 'attendance') {
      return {
        labels: isArabic ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'] : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: isArabic ? 'نسبة الحضور %' : 'Attendance Rate %',
          data: report.data.monthlyTrend || [0, 0, 0, 0, 0, 0],
          borderColor: '#f39c12',
          backgroundColor: 'rgba(243, 156, 18, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#f39c12',
          pointBorderColor: darkMode ? '#2d3436' : '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6,
        }]
      };
    }

    if (report.type === 'grades') {
      return {
        labels: isArabic ? ['ممتاز', 'جيد جدا', 'جيد', 'مقبول'] : ['Excellent', 'Very Good', 'Good', 'Fair'],
        datasets: [{
          label: isArabic ? 'عدد الطلاب' : 'Number of Students',
          data: [
            report.data.excellent || 0,
            report.data.good || 0,
            report.data.fair || 0,
            report.data.poor || 0
          ],
          backgroundColor: ['#2ecc71', '#3498db', '#f39c12', '#e74c3c'],
          borderColor: darkMode ? '#2d3436' : '#ffffff',
          borderWidth: 2,
        }]
      };
    }

    if (report.type === 'financial') {
      const categoryLabels = Object.keys(report.data.categories || {});
      const categoryValues = Object.values(report.data.categories || {});
      const colors = ['#3498db', '#2ecc71', '#f39c12', '#e74c3c'];
      return {
        labels: categoryLabels,
        datasets: [{
          label: isArabic ? 'المصروفات' : 'Expenses',
          data: categoryValues,
          backgroundColor: colors.slice(0, categoryValues.length),
          borderColor: darkMode ? '#2d3436' : '#ffffff',
          borderWidth: 2,
        }]
      };
    }

    if (report.type === 'levels') {
      const levelLabels = isArabic ? ['أولي', 'ابتدائي', 'إعدادي', 'ثانوي'] : ['Kindergarden', 'Primary', 'Secondary', 'High School'];
      return {
        labels: levelLabels,
        datasets: [{
          label: isArabic ? 'عدد الطلاب' : 'Number of Students',
          data: [
            report.data.kindergarden || 0,
            report.data.primary || 0,
            report.data.secondary || 0,
            report.data.highSchool || 0
          ],
          backgroundColor: ['#f39c12', '#2d6a4f', '#c49a6c', '#6c757d'],
          borderColor: darkMode ? '#2d3436' : '#ffffff',
          borderWidth: 2,
        }]
      };
    }

    return null;
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: darkMode ? '#e9ecef' : '#2d3436',
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 12,
            weight: '600',
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        },
        ticks: {
          color: darkMode ? '#adb5bd' : '#6c757d',
        },
      },
      x: {
        grid: {
          color: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        },
        ticks: {
          color: darkMode ? '#adb5bd' : '#6c757d',
        },
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: darkMode ? '#e9ecef' : '#2d3436',
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 12,
            weight: '600',
          },
        },
      },
    },
  };

  // ===== Get chart component based on type =====
  const getChartComponent = (report) => {
    const chartData = getChartData(report);
    if (!chartData) return null;

    switch(report.chartType) {
      case 'pie':
        return <Pie data={chartData} options={pieOptions} />;
      case 'doughnut':
        return <Doughnut data={chartData} options={pieOptions} />;
      case 'line':
        return <Line data={chartData} options={chartOptions} />;
      case 'bar':
      default:
        return <Bar data={chartData} options={chartOptions} />;
    }
  };

  // ===== Download Report =====
  const handleDownload = (report) => {
    notify(
      isArabic ? `جاري تحميل ${report.title}...` : `Downloading ${report.title}...`,
      'info'
    );
    setTimeout(() => {
      notify(
        isArabic ? `تم تحميل ${report.title} بنجاح` : `${report.title} downloaded successfully`,
        'success'
      );
    }, 1500);
  };

  // ===== Preview Report =====
  const handlePreview = (report) => {
    setSelectedReport(report);
    setShowPreviewModal(true);
  };

  // ===== Generate New Report =====
  const handleGenerateNew = () => {
    setGenerating(true);
    setTimeout(() => {
      generateReports();
    }, 500);
  };

  // ===== Report Card Component =====
  const ReportCard = ({ report }) => {
    const isHovered = hoveredCard === report.id;

    return (
      <div 
        className="report-card"
        onMouseEnter={() => setHoveredCard(report.id)}
        onMouseLeave={() => setHoveredCard(null)}
        style={{
          transform: isHovered ? 'translateY(-8px) scale(1.01)' : 'translateY(0) scale(1)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isHovered ? '0 20px 60px rgba(0,0,0,0.12)' : '0 4px 20px rgba(0,0,0,0.06)',
          border: 'none',
          borderRadius: '20px',
          overflow: 'hidden',
          background: darkMode ? '#1a1a2e' : 'white',
          height: '100%'
        }}
      >
        {/* Top Gradient Bar */}
        <div className="report-card-top-bar" style={{
          height: '5px',
          background: report.gradient,
          transition: 'height 0.4s ease'
        }}></div>

        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div className="report-icon-wrapper" style={{
              width: '50px',
              height: '50px',
              borderRadius: '14px',
              background: `${report.color}15`,
              color: report.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              transition: 'all 0.4s ease',
              transform: isHovered ? 'scale(1.1) rotate(-5deg)' : 'scale(1) rotate(0)'
            }}>
              {report.icon}
            </div>
            <Badge style={{ 
              background: report.gradient,
              color: 'white',
              padding: '4px 12px',
              borderRadius: '50px',
              fontSize: 'clamp(0.55rem, 0.65vw, 0.65rem)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              ...arabicFontStyle
            }}>
              {report.category}
            </Badge>
          </div>

          <h5 className="fw-bold mb-1" style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#1a1a2e', fontSize: isArabic ? 'clamp(1rem, 1.3vw, 1.15rem)' : 'clamp(0.95rem, 1.2vw, 1.1rem)' }}>
            {report.title}
          </h5>
          <p className="mb-3" style={{ ...arabicFontStyle, fontSize: isArabic ? 'clamp(0.75rem, 0.9vw, 0.85rem)' : 'clamp(0.7rem, 0.85vw, 0.8rem)', color: darkMode ? '#adb5bd' : '#6c757d' }}>
            {report.description}
          </p>

          <div className="d-flex gap-3 mb-3 flex-wrap">
            <div className="d-flex align-items-center gap-1" style={{ color: darkMode ? '#adb5bd' : '#6c757d', ...arabicFontStyle }}>
              <FaClockIcon size={12} />
              <small style={{ fontSize: isArabic ? 'clamp(0.6rem, 0.7vw, 0.7rem)' : 'clamp(0.55rem, 0.65vw, 0.65rem)' }}>
                {new Date(report.generatedAt).toLocaleDateString()}
              </small>
            </div>
            <div className="d-flex align-items-center gap-1" style={{ color: darkMode ? '#adb5bd' : '#6c757d', ...arabicFontStyle }}>
              <FaFileAlt size={12} />
              <small style={{ fontSize: isArabic ? 'clamp(0.6rem, 0.7vw, 0.7rem)' : 'clamp(0.55rem, 0.65vw, 0.65rem)' }}>
                {report.size}
              </small>
            </div>
            <div className="d-flex align-items-center gap-1" style={{ color: darkMode ? '#adb5bd' : '#6c757d', ...arabicFontStyle }}>
              <FaBook size={12} />
              <small style={{ fontSize: isArabic ? 'clamp(0.6rem, 0.7vw, 0.7rem)' : 'clamp(0.55rem, 0.65vw, 0.65rem)' }}>
                {report.pages} {isArabic ? 'صفحات' : 'pages'}
              </small>
            </div>
          </div>

          {report.data && report.type === 'students' && (
            <div className="report-stats-mini d-flex gap-2 flex-wrap mb-2">
              <span className="badge" style={{ background: darkMode ? '#2d3436' : '#f8f9fa', color: darkMode ? '#e9ecef' : '#2d3436', ...arabicFontStyle, fontSize: 'clamp(0.5rem, 0.6vw, 0.6rem)' }}>
                {isArabic ? 'الإجمالي:' : 'Total:'} {formatNumber(report.data.total)}
              </span>
              <span className="badge" style={{ background: darkMode ? '#2d3436' : '#f8f9fa', color: darkMode ? '#e9ecef' : '#2d3436', ...arabicFontStyle, fontSize: 'clamp(0.5rem, 0.6vw, 0.6rem)' }}>
                {isArabic ? 'جديد:' : 'New:'} {formatNumber(report.data.new)}
              </span>
              <span className="badge" style={{ background: darkMode ? '#2d3436' : '#f8f9fa', color: darkMode ? '#e9ecef' : '#2d3436', ...arabicFontStyle, fontSize: 'clamp(0.5rem, 0.6vw, 0.6rem)' }}>
                {isArabic ? 'نشط:' : 'Active:'} {formatNumber(report.data.active)}
              </span>
            </div>
          )}

          {report.data && report.type === 'attendance' && (
            <div className="report-stats-mini d-flex gap-2 flex-wrap mb-2">
              <span className="badge" style={{ background: darkMode ? '#2d3436' : '#f8f9fa', color: darkMode ? '#e9ecef' : '#2d3436', ...arabicFontStyle, fontSize: 'clamp(0.5rem, 0.6vw, 0.6rem)' }}>
                {isArabic ? 'نسبة الحضور:' : 'Attendance:'} {formatNumber(report.data.overall)}%
              </span>
              <span className="badge" style={{ background: darkMode ? '#2d3436' : '#f8f9fa', color: darkMode ? '#e9ecef' : '#2d3436', ...arabicFontStyle, fontSize: 'clamp(0.5rem, 0.6vw, 0.6rem)' }}>
                {isArabic ? 'حاضر:' : 'Present:'} {formatNumber(report.data.present)}
              </span>
              <span className="badge" style={{ background: darkMode ? '#2d3436' : '#f8f9fa', color: darkMode ? '#e9ecef' : '#2d3436', ...arabicFontStyle, fontSize: 'clamp(0.5rem, 0.6vw, 0.6rem)' }}>
                {isArabic ? 'غائب:' : 'Absent:'} {formatNumber(report.data.absent)}
              </span>
            </div>
          )}

          <div className="d-flex gap-2 mt-2">
            <Button 
              variant="outline-primary" 
              size="sm" 
              className="flex-grow-1"
              onClick={() => handlePreview(report)}
              style={{ borderRadius: '50px', fontSize: isArabic ? 'clamp(0.65rem, 0.8vw, 0.75rem)' : 'clamp(0.6rem, 0.75vw, 0.7rem)', ...arabicFontStyle }}
            >
              <FaEye className="me-1" /> {t('Preview')}
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              className="flex-grow-1"
              onClick={() => handleDownload(report)}
              style={{ borderRadius: '50px', fontSize: isArabic ? 'clamp(0.65rem, 0.8vw, 0.75rem)' : 'clamp(0.6rem, 0.75vw, 0.7rem)', ...arabicFontStyle }}
            >
              <FaDownload className="me-1" /> {t('Download')}
            </Button>
          </div>
        </Card.Body>
      </div>
    );
  };

  return (
    <div className="reports-management" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* ===== HEADER ===== */}
      <div className="dashboard-welcome mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ ...arabicFontStyle, color: '#1a5f7a', fontSize: isArabic ? 'clamp(1.1rem, 1.8vw, 1.4rem)' : 'clamp(1rem, 1.6vw, 1.3rem)' }}>
            <FaChartBar className="me-2" />
            {t('Reports Management')}
          </h4>
          <p className="text-muted mb-0" style={{ ...arabicFontStyle, fontSize: isArabic ? 'clamp(0.85rem, 1.2vw, 1rem)' : 'clamp(0.8rem, 1.1vw, 0.95rem)' }}>
            {t('Create, view and manage all reports')}
          </p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <Button 
            variant="outline-primary" 
            size="sm" 
            className="d-flex align-items-center gap-2 export-btn"
            onClick={handleRefresh}
            disabled={refreshing}
            style={{ ...arabicFontStyle, fontSize: isArabic ? 'clamp(0.75rem, 1vw, 0.85rem)' : 'clamp(0.7rem, 0.9vw, 0.8rem)' }}
          >
            <FaSync className={refreshing ? 'fa-spin' : ''} /> {t('Refresh')}
          </Button>
          <Button 
            variant="primary" 
            size="sm" 
            className="d-flex align-items-center gap-2"
            onClick={handleGenerateNew}
            disabled={generating}
            style={{ ...arabicFontStyle, fontSize: isArabic ? 'clamp(0.75rem, 1vw, 0.85rem)' : 'clamp(0.7rem, 0.9vw, 0.8rem)' }}
          >
            {generating ? (
              <><span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> {t('Generating...')}</>
            ) : (
              <><FaPlus className="me-1" /> {t('Generate Report')}</>
            )}
          </Button>
        </div>
      </div>

      {/* ===== STATS CARDS WITH GRADIENTS ===== */}
      <Row className="g-4 mb-4">
        {statsCards.map((stat, index) => (
          <Col key={index} xl={3} lg={3} md={6} sm={6} xs={12}>
            <div
              className="stat-card-enhanced"
              style={{
                background: stat.gradient,
                borderRadius: '20px',
                padding: 'clamp(18px, 2.5vw, 24px)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: stat.shadow,
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                height: '100%',
                cursor: 'default',
                minHeight: 'clamp(180px, 24vw, 220px)',
                animation: 'slideInUp 0.6s ease forwards',
                animationDelay: `${index * 0.1}s`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 16px 50px rgba(0,0,0,0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = stat.shadow;
              }}
            >
              <div className="stat-top-bar-enhanced" style={{
                position: 'absolute',
                top: '0',
                left: '0',
                right: '0',
                height: '5px',
                background: 'rgba(255,255,255,0.4)',
                borderRadius: '20px 20px 0 0',
                transition: 'height 0.4s ease'
              }}></div>

              <div className="stat-deco-1-enhanced" style={{
                position: 'absolute',
                top: '-30px',
                right: '-30px',
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
                animation: 'floatBubble 6s ease-in-out infinite'
              }}></div>
              <div className="stat-deco-2-enhanced" style={{
                position: 'absolute',
                bottom: '-20px',
                left: '-20px',
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.04)',
                animation: 'floatBubble 8s ease-in-out infinite reverse'
              }}></div>

              <div className="position-relative" style={{ zIndex: 1 }}>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <span className="stat-label-enhanced" style={{
                      ...arabicFontStyle,
                      fontSize: isArabic ? 'clamp(0.7rem, 1vw, 0.85rem)' : 'clamp(0.75rem, 1vw, 0.9rem)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      opacity: 0.85,
                      fontWeight: '500',
                      display: 'block'
                    }}>
                      {stat.label}
                    </span>
                    <h2 className="stat-number-enhanced" style={{
                      fontFamily: 'inherit',
                      fontSize: isArabic ? 'clamp(2rem, 3.5vw, 2.8rem)' : 'clamp(2.2rem, 3.5vw, 2.8rem)',
                      fontWeight: '700',
                      margin: '4px 0 2px',
                      lineHeight: '1.1',
                      color: 'white',
                      textShadow: '0 2px 10px rgba(0,0,0,0.1)'
                    }}>
                      {formatNumber(stat.value)}
                    </h2>
                    <span className="stat-detail-enhanced" style={{
                      ...arabicFontStyle,
                      opacity: 0.8,
                      fontSize: isArabic ? 'clamp(0.6rem, 0.8vw, 0.75rem)' : 'clamp(0.65rem, 0.8vw, 0.8rem)'
                    }}>
                      {stat.detail}
                    </span>
                  </div>
                  <div className="stat-icon-wrapper-enhanced" style={{
                    width: 'clamp(50px, 6vw, 60px)',
                    height: 'clamp(50px, 6vw, 60px)',
                    borderRadius: '16px',
                    background: 'rgba(255,255,255,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
                    backdropFilter: 'blur(5px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    transition: 'transform 0.4s ease',
                    flexShrink: 0
                  }}>
                    {stat.icon}
                  </div>
                </div>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* ===== SEARCH & FILTER ===== */}
      <Card className="shadow-sm border-0 mb-4 modern-card" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
        <Card.Body className="p-2 p-md-3">
          <Row className="g-2 align-items-end">
            <Col xs={12} sm={12} md={4}>
              <InputGroup size="sm">
                <InputGroup.Text style={{ background: darkMode ? '#2d3436' : 'white', color: darkMode ? '#e9ecef' : '#212529' }}>
                  <FaSearch size={12} />
                </InputGroup.Text>
                <Form.Control
                  placeholder={t('Search reports...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ 
                    fontSize: 'clamp(0.7rem, 0.9vw, 0.8rem)', 
                    background: darkMode ? '#2d3436' : 'white', 
                    color: darkMode ? '#e9ecef' : '#212529',
                    ...arabicFontStyle
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
                  fontSize: 'clamp(0.7rem, 0.9vw, 0.8rem)', 
                  background: darkMode ? '#2d3436' : 'white', 
                  color: darkMode ? '#e9ecef' : '#212529',
                  ...arabicFontStyle,
                  paddingRight: isArabic ? '2rem' : '0.75rem'
                }}
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={6} sm={4} md={2}>
              <Form.Select 
                size="sm" 
                value={reportType} 
                onChange={(e) => setReportType(e.target.value)} 
                style={{ 
                  fontSize: 'clamp(0.7rem, 0.9vw, 0.8rem)', 
                  background: darkMode ? '#2d3436' : 'white', 
                  color: darkMode ? '#e9ecef' : '#212529',
                  ...arabicFontStyle,
                  paddingRight: isArabic ? '2rem' : '0.75rem'
                }}
              >
                {reportTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={6} sm={12} md={2}>
              <div className="text-muted text-center" style={{ ...arabicFontStyle, fontSize: isArabic ? 'clamp(0.7rem, 0.9vw, 0.8rem)' : 'clamp(0.65rem, 0.8vw, 0.75rem)', color: darkMode ? '#adb5bd' : '#6c757d' }}>
                {t('Results:')} <span className="fw-bold" style={{ color: '#4a9eff' }}>{formatNumber(filteredReports.length)}</span>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* ===== REPORTS GRID ===== */}
      {displayedReports.length === 0 ? (
        <div className="text-center py-5">
          <div className="display-1 text-muted opacity-25 mb-3">📊</div>
          <h4 style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#1a1a2e' }}>{t('No reports found')}</h4>
          <p className="text-muted" style={arabicFontStyle}>
            {isArabic 
              ? 'حاول تعديل بحثك أو إنشاء تقارير جديدة' 
              : 'Try adjusting your search or generate new reports'}
          </p>
          <Button variant="primary" onClick={handleGenerateNew} style={arabicFontStyle}>
            <FaPlus className="me-2" /> {t('Generate Reports')}
          </Button>
        </div>
      ) : (
        <Row className="g-4">
          {displayedReports.map((report) => (
            <Col key={report.id} lg={6} xl={6} md={6} sm={12} xs={12}>
              <ReportCard report={report} />
            </Col>
          ))}
        </Row>
      )}

      {/* ===== PAGINATION ===== */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <Pagination size="sm" className="responsive-pagination">
            <Pagination.Prev onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={arabicFontStyle} />
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
                <Pagination.Item key={pageNum} active={currentPage === pageNum} onClick={() => setCurrentPage(pageNum)} style={arabicFontStyle}>
                  {pageNum}
                </Pagination.Item>
              );
            })}
            {totalPages > 5 && currentPage < totalPages - 2 && <Pagination.Ellipsis style={arabicFontStyle} />}
            <Pagination.Next onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={arabicFontStyle} />
          </Pagination>
        </div>
      )}

      {/* ===== PREVIEW MODAL ===== */}
      <Modal 
        show={showPreviewModal} 
        onHide={() => setShowPreviewModal(false)} 
        centered 
        size="lg"
        className="modern-modal preview-modal"
      >
        <Modal.Header closeButton className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Modal.Title style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#1a1a2e' }}>
            <FaEye className="me-2 text-primary" />
            {selectedReport?.title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? '#0d1117' : 'white' }}>
          {selectedReport && (
            <>
              {/* Report Info */}
              <div className="d-flex flex-wrap gap-3 mb-4">
                <Badge style={{ 
                  background: selectedReport.gradient,
                  color: 'white',
                  padding: '6px 14px',
                  borderRadius: '50px',
                  ...arabicFontStyle,
                  fontSize: 'clamp(0.65rem, 0.8vw, 0.75rem)'
                }}>
                  {selectedReport.category}
                </Badge>
                <span className="text-muted" style={{ color: darkMode ? '#adb5bd' : '#6c757d', ...arabicFontStyle, fontSize: 'clamp(0.65rem, 0.8vw, 0.75rem)' }}>
                  <FaClockIcon className="me-1" /> {new Date(selectedReport.generatedAt).toLocaleString()}
                </span>
                <span className="text-muted" style={{ color: darkMode ? '#adb5bd' : '#6c757d', ...arabicFontStyle, fontSize: 'clamp(0.65rem, 0.8vw, 0.75rem)' }}>
                  <FaFileAlt className="me-1" /> {selectedReport.size}
                </span>
                <span className="text-muted" style={{ color: darkMode ? '#adb5bd' : '#6c757d', ...arabicFontStyle, fontSize: 'clamp(0.65rem, 0.8vw, 0.75rem)' }}>
                  <FaBook className="me-1" /> {selectedReport.pages} {isArabic ? 'صفحات' : 'pages'}
                </span>
              </div>

              <p className="text-muted" style={{ ...arabicFontStyle, color: darkMode ? '#adb5bd' : '#6c757d', fontSize: isArabic ? 'clamp(0.9rem, 1.1vw, 1rem)' : 'clamp(0.85rem, 1vw, 0.95rem)' }}>
                {selectedReport.description}
              </p>

              {/* Chart Preview */}
              {selectedReport.data && (
                <div className="chart-preview mt-4" style={{ height: '300px', background: darkMode ? '#1a1a2e' : '#f8f9fa' }}>
                  {getChartComponent(selectedReport)}
                </div>
              )}

              {/* Report Data Summary */}
              {selectedReport.data && (
                <div className="report-data-summary mt-4">
                  <h6 className="fw-bold mb-3" style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#1a1a2e' }}>
                    {t('Data Summary')}
                  </h6>
                  <Row className="g-2">
                    {Object.entries(selectedReport.data).map(([key, value]) => {
                      if (typeof value === 'number' && key !== 'categories' && key !== 'levels' && key !== 'subjects' && key !== 'monthlyTrend' && key !== 'gender') {
                        return (
                          <Col key={key} xs={6} md={4}>
                            <div className="p-2 rounded-3 text-center" style={{ background: darkMode ? '#2d3436' : '#f8f9fa' }}>
                              <div className="small" style={{ ...arabicFontStyle, color: darkMode ? '#adb5bd' : '#6c757d', fontSize: 'clamp(0.55rem, 0.7vw, 0.65rem)' }}>
                                {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                              </div>
                              <div className="fw-bold" style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#1a1a2e', fontSize: 'clamp(0.9rem, 1.1vw, 1rem)' }}>
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

              {/* Action Buttons */}
              <div className="d-flex gap-2 mt-4 pt-3 border-top" style={{ borderColor: darkMode ? 'rgba(255,255,255,0.1)' : '#dee2e6' }}>
                <Button 
                  variant="primary" 
                  className="flex-grow-1"
                  onClick={() => handleDownload(selectedReport)}
                  style={arabicFontStyle}
                >
                  <FaDownload className="me-2" /> {t('Download Report')}
                </Button>
                <Button 
                  variant="outline-secondary"
                  onClick={() => { navigator.clipboard?.writeText(window.location.href); notify(t('Link copied'), 'info'); }}
                  style={arabicFontStyle}
                >
                  <FaShare />
                </Button>
                <Button 
                  variant="outline-secondary"
                  onClick={() => window.print()}
                  style={arabicFontStyle}
                >
                  <FaPrint />
                </Button>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Button variant="secondary" onClick={() => setShowPreviewModal(false)} style={arabicFontStyle}>
            {t('Close')}
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        /* ===== IMPORT ARABIC FONTS ===== */
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@100..900&family=Vazirmatn:wght@100..900&display=swap');

        .reports-management { padding: 0; }

        /* ===== ANIMATIONS ===== */
        @keyframes floatBubble {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-10px, -15px) scale(1.1); }
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .fa-spin {
          animation: spin 1s linear infinite;
        }

        /* ===== DASHBOARD WELCOME ===== */
        .dashboard-welcome {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }
        .reports-management[dir="rtl"] .dashboard-welcome {
          flex-direction: row-reverse;
        }

        /* ===== ENHANCED STAT CARDS ===== */
        .stat-card-enhanced {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: default;
          animation: slideInUp 0.6s ease forwards;
        }
        .stat-card-enhanced:hover .stat-top-bar-enhanced {
          height: 7px !important;
        }
        .stat-card-enhanced:hover .stat-icon-wrapper-enhanced {
          transform: scale(1.15) rotate(-5deg);
        }
        .stat-card-enhanced .stat-icon-wrapper-enhanced {
          transition: transform 0.4s ease;
        }
        .stat-top-bar-enhanced {
          transition: height 0.4s ease;
        }
        .stat-number-enhanced {
          font-family: inherit;
        }

        /* ===== MODERN CARDS ===== */
        .modern-card {
          border-radius: 16px !important;
          transition: all 0.3s ease;
          overflow: hidden;
        }
        .modern-card:hover {
          box-shadow: 0 8px 30px rgba(0,0,0,0.06) !important;
        }

        /* ===== EXPORT/REFRESH BUTTON ===== */
        .export-btn {
          transition: all 0.3s ease;
          border-radius: 50px !important;
          padding: 6px 18px !important;
        }
        .export-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }

        /* ===== REPORT CARDS ===== */
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

        /* ===== MODALS ===== */
        .modern-modal .modal-content {
          border-radius: 20px !important;
          border: none !important;
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
          padding: 0 24px 24px;
          border-top: none;
        }
        .modern-modal .modal-header .btn-close {
          transition: transform 0.3s ease;
        }
        .modern-modal .modal-header .btn-close:hover {
          transform: rotate(90deg);
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

        .report-data-summary .bg-light {
          border-radius: 8px;
        }

        .responsive-pagination .page-link {
          padding: 4px 10px;
          font-size: 0.75rem;
        }

        /* ===== RTL FIXES ===== */
        .reports-management[dir="rtl"] .dashboard-welcome {
          flex-direction: row-reverse;
        }
        .reports-management[dir="rtl"] .modal-header .btn-close {
          margin-left: 0 !important;
          margin-right: auto !important;
        }
        .reports-management[dir="rtl"] .modal-header .me-2 {
          margin-right: 0 !important;
          margin-left: 0.5rem !important;
        }
        .reports-management[dir="rtl"] .modal-footer .me-2 {
          margin-right: 0 !important;
          margin-left: 0.5rem !important;
        }
        .reports-management[dir="rtl"] .detail-item .me-1 {
          margin-right: 0 !important;
          margin-left: 0.25rem !important;
        }
        .reports-management[dir="rtl"] .form-select {
          background-position: left 0.75rem center !important;
          padding-right: 0.75rem !important;
          padding-left: 2rem !important;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 768px) {
          .stat-card-enhanced { 
            padding: 16px !important; 
            min-height: 160px !important;
          }
          .stat-number-enhanced {
            font-size: 2rem !important;
          }
          .stat-icon-wrapper-enhanced {
            width: 45px !important;
            height: 45px !important;
            font-size: 1.3rem !important;
          }
          .stat-label-enhanced {
            font-size: 0.7rem !important;
          }
          .dashboard-welcome {
            flex-direction: column;
            align-items: flex-start;
          }
          .reports-management[dir="rtl"] .dashboard-welcome {
            align-items: flex-end;
          }
          
          .report-card .p-4 { padding: 16px !important; }
          .report-card h5 { font-size: 1rem !important; }
          .report-card .d-flex.gap-3 { gap: 8px !important; flex-wrap: wrap; }
          .chart-preview { height: 200px !important; }
        }

        @media (max-width: 576px) {
          .stat-card-enhanced { 
            padding: 12px !important; 
            min-height: 130px !important;
            border-radius: 16px !important;
          }
          .stat-number-enhanced {
            font-size: 1.5rem !important;
          }
          .stat-icon-wrapper-enhanced {
            width: 36px !important;
            height: 36px !important;
            font-size: 1rem !important;
          }
          .stat-label-enhanced {
            font-size: 0.6rem !important;
          }
          .stat-detail-enhanced {
            font-size: 0.5rem !important;
          }
          .stat-deco-1-enhanced, .stat-deco-2-enhanced {
            display: none !important;
          }

          .report-card .p-4 { padding: 12px !important; }
          .report-card h5 { font-size: 0.9rem !important; }
          .report-card .report-icon-wrapper { width: 40px; height: 40px; font-size: 1.2rem; }
          .report-card .d-flex.gap-2 { flex-direction: column; }
          .report-card .btn { font-size: 0.65rem !important; padding: 4px 12px !important; }
          .chart-preview { height: 150px !important; padding: 8px; }

          .modern-card .p-3 {
            padding: 8px !important;
          }
          .modern-card .g-2 {
            gap: 4px !important;
          }
          .modern-card .col-md-5,
          .modern-card .col-md-3,
          .modern-card .col-md-2 {
            padding: 0 4px !important;
          }
          .modern-card .btn {
            font-size: 0.5rem !important;
            padding: 4px 8px !important;
          }
          .modern-card .form-control,
          .modern-card .form-select {
            font-size: 0.6rem !important;
            padding: 4px 8px !important;
          }
          .modern-card .form-select {
            padding-right: 0.5rem !important;
          }

          .preview-modal .modal-body { padding: 16px !important; }
          .report-data-summary .row .col-6 { padding: 4px !important; }
          .report-data-summary .p-2 { padding: 8px !important; }
          .report-data-summary .fw-bold { font-size: 0.9rem !important; }

          .responsive-pagination .page-link {
            padding: 3px 8px;
            font-size: 0.65rem;
          }

          .modern-modal .modal-header {
            padding: 12px 16px 0 !important;
          }
          .modern-modal .modal-body {
            padding: 12px 16px 16px !important;
          }
          .modern-modal .modal-footer {
            padding: 0 16px 16px !important;
          }
        }

        @media (max-width: 400px) {
          .stat-number-enhanced {
            font-size: 1.2rem !important;
          }
          .stat-icon-wrapper-enhanced {
            width: 30px !important;
            height: 30px !important;
            font-size: 0.8rem !important;
          }
          .stat-label-enhanced {
            font-size: 0.5rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ReportsManagement;