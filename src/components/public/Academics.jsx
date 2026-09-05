// src/components/public/Academics.jsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import {
  FaSchool,
  FaBookOpen,
  FaChalkboardTeacher,
  FaClock,
  FaAward,
  FaQuran,
  FaAtom,
  FaLanguage,
  FaCalculator,
  FaFlask,
  FaGlobe,
  FaPaintBrush,
  FaBasketballBall,
  FaBook,
  FaChild,
  FaGraduationCap,
  FaUsers,
  FaStar,
  FaCheckCircle,
  FaRocket,
  FaLightbulb,
  FaKaaba,
  FaBrain,
  FaMicroscope,
  FaLaptop,
  FaPalette,
  FaDumbbell,
  FaGlobeAsia,
  FaQuoteLeft,
  FaArrowRight,
  FaBullseye,
  FaSchool as FaSchoolIcon
} from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { getTranslation } from '../../utils/translations';

const Academics = () => {
  const { language, isArabic } = useLanguage();
  const t = (key) => getTranslation(key, language);
  const location = useLocation();

  const [activeTab, setActiveTab] = useState('kindergarden');
  const [hoveredSubject, setHoveredSubject] = useState(null);

  useEffect(() => {
    if (location.state && location.state.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  // Updated Arabic font style with Google Fonts
  const arabicFontStyle = {
    fontFamily: isArabic ? '"Noto Sans Arabic", "Vazirmatn", "Traditional Arabic", serif' : 'inherit',
    lineHeight: isArabic ? '1.8' : '1.6',
    letterSpacing: isArabic ? '0.3px' : '0px',
  };

  // ALWAYS use English numbers - NO Arabic numeral conversion
  const formatNumber = (num) => {
    return num.toString(); // Always returns English numbers
  };

  // English schedule times - always display in English format
  const getScheduleTime = (time) => {
    return time; // Always return the time in English format
  };

  // ===== CURRICULUM OVERVIEW TEXTS =====
  const getCurriculumOverview = (level) => {
    const overviews = {
      kindergarden: isArabic ? [
        'تعلم مبادئ القيم الدينية والوطنية',
        'تنمية المهارات الحسية الحركية',
        'التحضير لتعلم القراءة والكتابة والتواصل باللغات العربية، الفرنسية، الإنجليزية',
        'التعرف على أساسيات الحساب'
      ] : [
        'Learn the principles of religious and national values',
        'Develop sensory and motor skills',
        'Preparation for learning reading, writing and communication in Arabic, French, and English',
        'Introduction to basic arithmetic'
      ],
      primary: isArabic ? [
        'بناء أساس أكاديمي متين في مختلف المواد الدراسية',
        'تنمية شخصية المتعلم علمياً، أخلاقياً، واجتماعياً',
        'اكتشاف وتنمية المواهب من خلال الأنشطة الموازية',
        'إعداد متعلم واثق ومبدع قادر على مواصلة مساره الدراسي بنجاح'
      ] : [
        'Build a solid academic foundation in various subjects',
        'Develop the learner\'s personality scientifically, morally, and socially',
        'Discover and develop talents through extracurricular activities',
        'Prepare a confident and creative learner capable of continuing their academic path successfully'
      ],
      secondary: isArabic ? [
        'بناء شخصية متوازنة تجمع بين التفوق العلمي والالتزام الأخلاقي',
        'تعزيز الاستقلالية والثقة بالنفس وروح المسؤولية',
        'تنمية الكفايات اللغوية والعلمية والرقمية وفق متطلبات العصر',
        'مرافقة المتعلمين في بناء مسار دراسي ناجح يؤهلهم للمرحلة الثانوية'
      ] : [
        'Build a balanced personality combining academic excellence and ethical commitment',
        'Enhance independence, self-confidence, and sense of responsibility',
        'Develop linguistic, scientific, and digital competencies according to modern requirements',
        'Guide learners in building a successful academic path that qualifies them for high school'
      ],
      high_school: isArabic ? [
        'تمكين المتعلمين من تعميق معارفهم وإتقان الكفايات اللازمة للنجاح الأكاديمي',
        'ترسيخ القيم الإسلامية، والهوية الوطنية، وروح المواطنة والانفتاح المسؤول',
        'تنمية التفكير النقدي والإبداعي والقدرة على البحث والتحليل وحل المشكلات',
        'الإعداد للالتحاق بالتعليم العالي والاندماج بثقة وفاعلية في الحياة الجامعية والمجتمعية'
      ] : [
        'Enable learners to deepen their knowledge and master the competencies necessary for academic success',
        'Reinforce Islamic values, national identity, citizenship spirit, and responsible openness',
        'Develop critical and creative thinking, research, analysis, and problem-solving skills',
        'Prepare for higher education and integrate confidently and effectively into university and community life'
      ]
    };
    return overviews[level] || overviews.kindergarden;
  };

  // ✅ Level Data with English numbers
  const levels = {
    kindergarden: {
      title: isArabic ? 'أولي' : 'Kindergarden',
      age: isArabic ? '6-3 سنوات' : '3-6 years',
      description: isArabic
        ? 'مرحلة أساسية لتنمية مهارات الطفل وغرس القيم لديه في بيئة تعليمية محفزة، استعدادًا للنجاح في التعليم الابتدائي'
        : 'Kindergarten is a key stage that develops children’s skills and values in a stimulating environment, preparing them for primary education.',
      icon: <FaChild />,
      color: '#f39c12',
      gradient: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)',
      badge: isArabic ? 'أولي' : '',
      badgeColor: 'warning',
      subjects: [
        { icon: <FaQuran />, name: isArabic ? 'القرآن الكريم (التربية الإسلامية)' : "Qur'an (Islamic Education)"},
        { icon: <FaLanguage />, name: isArabic ? 'اللغة العربية' : 'Arabic', },
        { icon: <FaLanguage />, name: isArabic ? 'اللغة الإنجليزية' : 'English',},
        { icon: <FaLanguage />, name: isArabic ? 'اللغة الفرنسية' : 'French', },
      ],
      schedule: '9:00صباحاً  16:00مساءً',
      features: [
        isArabic ? 'التعلم القائم على اللعب' : 'Play-Based Learning',
        isArabic ? 'القيم الإسلامية' : 'Islamic Values',
        isArabic ? 'التنمية الاجتماعية' : 'Social Development',
        isArabic ? 'التعبير الإبداعي' : 'Creative Expression'
      ],
    },
    primary: {
      title: isArabic ? 'ابتدائي' : 'Primary',
      age: isArabic ? '12-6 سنة' : '6-12 years',
      description: isArabic
        ? 'مرحلة أساسية لبناء معارف المتعلم وتنمية مهاراته الفكرية والشخصية، في بيئة تعليمية محفزة تجمع بين التميز الأكاديمي وغرس القيم'
        : 'A fundamental stage that builds students’ knowledge and develops their intellectual and personal skills in a stimulating learning environment that combines academic excellence with the promotion of values.',
      icon: <FaBook />,
      color: '#2d6a4f',
      gradient: 'linear-gradient(135deg, #2d6a4f 0%, #1a5f7a 100%)',
      badge: isArabic ? 'ابتدائي' : '',
      badgeColor: 'success',
      subjects: [
        { icon: <FaQuran />, name: isArabic ? 'القرآن الكريم (التربية الإسلامية)' : "Qur'an (Islamic Education)",},
        { icon: <FaLanguage />, name: isArabic ? 'اللغة العربية' : 'Arabic',},
        { icon: <FaLanguage />, name: isArabic ? 'اللغة الإنجليزية' : 'English',},
        { icon: <FaLanguage />, name: isArabic ? 'اللغة الفرنسية' : 'French',},
        { icon: <FaCalculator />, name: isArabic ? 'الرياضيات' : 'Mathematics',},
        { icon: <FaFlask />, name: isArabic ? 'النشاط العلمي' : 'Science',},
        { icon: <FaDumbbell />, name: isArabic ? 'الرياضة' : 'Sports',},
        { icon: <FaLaptop />, name: isArabic ? 'الإعلاميات' : 'ICT',},
        { icon: <FaPalette />, name: isArabic ? 'التربية التشكيلية' : 'Art & Plastic',},
        { icon: <FaGlobeAsia />, name: isArabic ? 'الإجتماعيات' : 'Geography',},
      ],
      schedule: '9:00صباحاً  16:00مساءً',
      features: [
        isArabic ? 'التميز الأكاديمي' : 'Academic Excellence',
        isArabic ? 'بناء الشخصية' : 'Character Building',
        isArabic ? 'التفكير النقدي' : 'Critical Thinking',
        isArabic ? 'دمج التكنولوجيا' : 'Technology Integration'
      ],
    },
    secondary: {
      title: isArabic ? 'إعدادي' : 'Secondary',
      age: isArabic ? '15-12 سنة' : '12-16 years',
      description: isArabic
        ? 'مرحلة تهدف إلى تعميق معارف المتعلم وتنمية مهاراته الفكرية والشخصية، مع تعزيز الاستقلالية وروح المسؤولية، استعدادًا للنجاح في المرحلة الثانوية'
        : 'Aiming to deepen students’ knowledge, develop their intellectual and personal skills, and foster independence and responsibility, preparing them for success in High School education.',
      icon: <FaGraduationCap />,
      color: '#c49a6c',
      gradient: 'linear-gradient(135deg, #c49a6c 0%, #e8c9a0 100%)',
      badge: isArabic ? 'إعدادي' : '',
      badgeColor: 'warning',
      subjects: [
        { icon: <FaQuran />, name: isArabic ? 'القرآن الكريم (التربية الإسلامية)' : "Qur'an (Islamic Education)",},
        { icon: <FaLanguage />, name: isArabic ? 'اللغة العربية' : 'Arabic',},
        { icon: <FaLanguage />, name: isArabic ? 'اللغة الفرنسية' : 'French',},
        { icon: <FaLanguage />, name: isArabic ? 'اللغة الإنجليزية' : 'English',},
        { icon: <FaCalculator />, name: isArabic ? 'الرياضيات' : 'Mathematics',},
        { icon: <FaMicroscope />, name: isArabic ? 'علوم الحياة والأرض (SVT)' : 'SVT (Biology)',},
        { icon: <FaFlask />, name: isArabic ? 'الفيزياء' : 'Physics',},
        { icon: <FaDumbbell />, name: isArabic ? 'الرياضة' : 'Sports',},
        { icon: <FaLaptop />, name: isArabic ? 'الإعلاميات' : 'ICT',},
        { icon: <FaGlobeAsia />, name: isArabic ? 'الإجتماعيات' : 'Geography',},
      ],
      schedule: '9:00صباحاً  16:00مساءً',
      features: [
        isArabic ? 'التميز الأكاديمي' : 'Academic Excellence',
        isArabic ? 'الإعداد المهني' : 'Career Preparation',
        isArabic ? 'مهارات القيادة' : 'Leadership Skills',
        isArabic ? 'التفكير النقدي' : 'Critical Thinking'
      ],
    },
    high_school: {
      title: isArabic ? 'ثانوي' : 'High School',
      age: isArabic ? '18-16 سنة' : '16-18 years',
      description: isArabic
        ? 'مرحلة متقدمة تسعى إلى إعداد متعلمين متميزين قادرين على التفكير والتحليل والإبداع، من خلال تطوير كفاءاتهم العلمية والشخصية، وتأهيلهم للنجاح في التعليم العالي والحياة المستقبلية'
        : 'An advanced stage that prepares outstanding learners to think critically, analyze, and innovate by developing their academic and personal skills, and equipping them for success in higher education and future endeavors.',
      icon: <FaAward />,
      color: '#0b89f7',
      gradient: 'linear-gradient(135deg, #2497fb 0%, #007af3 100%)',
      badge: isArabic ? 'ثانوي' : '',
      badgeColor: 'secondary',
      subjects: [
        { icon: <FaQuran />, name: isArabic ? 'القرآن الكريم (التربية الإسلامية)' : "Qur'an (Islamic Education)",},
        { icon: <FaLanguage />, name: isArabic ? 'اللغة العربية' : 'Arabic',},
        { icon: <FaLanguage />, name: isArabic ? 'اللغة الإنجليزية' : 'English',},
        { icon: <FaCalculator />, name: isArabic ? 'الرياضيات' : 'Mathematics',},
        { icon: <FaLanguage />, name: isArabic ? 'اللغة الفرنسية' : 'French',},
        { icon: <FaMicroscope />, name: isArabic ? 'علوم الحياة والأرض (SVT)' : 'SVT (Biology)',},
        { icon: <FaFlask />, name: isArabic ? 'الفيزياء' : 'Physics',},
        { icon: <FaDumbbell />, name: isArabic ? 'الرياضة' : 'Sports',},
        { icon: <FaLaptop />, name: isArabic ? 'الإعلاميات' : 'ICT',},
        { icon: <FaGlobeAsia />, name: isArabic ? 'الإجتماعيات' : 'Geography',},
        { icon: <FaBrain />, name: isArabic ? 'الفلسفة' : 'Philosophy',},
      ],
      schedule: '9:00صباحاً  16:00مساءً',
      features: [
        isArabic ? 'التميز الأكاديمي' : 'Academic Excellence',
        isArabic ? 'الإعداد الجامعي' : 'School Preparation',
        isArabic ? 'مهارات القيادة' : 'Leadership Skills',
        isArabic ? 'التفكير النقدي' : 'Critical Thinking',
        isArabic ? 'الابتكار' : 'Innovation'
      ],
    },
  };

  const currentLevel = levels[activeTab];
  const curriculumItems = getCurriculumOverview(activeTab);

  return (
    <div className="fade-in" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Hero Section */}
      <section className="py-5" style={{ background: 'linear-gradient(135deg, #031c2f 0%, #1a5f7a 100%)' }}>
        <Container>
          <h1 className="display-4 fw-bold text-center text-white" style={arabicFontStyle}>{t('academicsTitle')}</h1>
          <p className="text-center fs-5 text-white opacity-75" style={arabicFontStyle}>{t('academicsSubtitle')}</p>
        </Container>
      </section>

      {/* Level Selection - Modern Pill Tabs with Gradient Top Bar */}
      <section className="py-4 bg-light">
        <Container>
          <div className="d-flex justify-content-center flex-wrap gap-3">
            {Object.keys(levels).map((key) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`program-tab ${activeTab === key ? 'active' : ''}`}
                style={{
                  padding: '14px 30px',
                  borderRadius: '50px',
                  border: `2px solid ${activeTab === key ? levels[key].color : 'transparent'}`,
                  background: activeTab === key ? 'white' : 'transparent',
                  color: activeTab === key ? levels[key].color : '#6c757d',
                  fontWeight: '600',
                  fontSize: isArabic ? '1rem' : '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: activeTab === key ? `0 8px 30px ${levels[key].color}30` : 'none',
                  transform: activeTab === key ? 'scale(1.05)' : 'scale(1)',
                  fontFamily: isArabic ? '"Noto Sans Arabic", "Vazirmatn", "Traditional Arabic", serif' : 'inherit',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== key) {
                    e.currentTarget.style.transform = 'scale(1.03)';
                    e.currentTarget.style.borderColor = levels[key].color;
                    e.currentTarget.style.color = levels[key].color;
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== key) {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.borderColor = 'transparent';
                    e.currentTarget.style.color = '#6c757d';
                  }
                }}
              >
                {/* Top Gradient Bar for active tab */}
                {activeTab === key && (
                  <div className="tab-gradient-bar" style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    right: '0',
                    height: '4px',
                    background: levels[key].gradient,
                    borderRadius: '50px 50px 0 0',
                    animation: 'slideIn 0.4s ease'
                  }}></div>
                )}
                <span className="tab-icon" style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '8px',
                  fontSize: '1.1rem',
                  transition: 'transform 0.3s ease'
                }}>
                  {levels[key].icon}
                </span>
                <span>{levels[key].title}</span>
              </button>
            ))}
          </div>
        </Container>
      </section>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@100..900&family=Vazirmatn:wght@100..900&display=swap');

        @keyframes slideIn {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }

        .program-tab {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }
        .program-tab:hover {
          transform: scale(1.03);
        }
        .program-tab.active {
          transform: scale(1.05);
        }
        .program-tab.active .tab-icon {
          transform: scale(1.2) rotate(-10deg);
        }
        .program-tab:hover .tab-icon {
          transform: scale(1.1);
        }
      `}</style>

      {/* Level Details */}
      <section className="py-5">
        <Container>
          <Row className="g-4">
            {/* Left Side - Program Info */}
            <Col lg={4}>
              <div className="position-sticky" style={{ top: '100px' }}>
                <Card className="shadow-lg border-0 program-info-card" style={{
                  borderRadius: '20px',
                  overflow: 'hidden',
                  background: currentLevel.gradient,
                  color: 'white',
                  transition: 'all 0.4s ease'
                }}>
                  {/* Top Gradient Bar */}
                  <div className="program-card-top-bar" style={{
                    height: '6px',
                    background: 'rgba(255,255,255,0.3)',
                    borderRadius: '20px 20px 0 0'
                  }}></div>

                  <Card.Body className="p-4 text-center">
                    <div className="program-icon-wrapper" style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      fontSize: '3rem',
                      margin: '0 auto 16px',
                      backdropFilter: 'blur(10px)',
                      border: '3px solid rgba(255,255,255,0.2)',
                      transition: 'all 0.4s ease',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.1)'
                    }}>
                      {currentLevel.icon}
                    </div>

                    <h3 className="fw-bold mb-1" style={arabicFontStyle}>{currentLevel.title}</h3>
                    <p className="mb-3 opacity-75" style={arabicFontStyle}>{currentLevel.age}</p>

                    <Badge bg={currentLevel.badgeColor} className="mb-3" style={{ padding: '6px 20px', fontSize: '0.8rem', borderRadius: '50px' }}>
                      {currentLevel.badge}
                    </Badge>

                    <hr className="border-light opacity-25" />

                    <p className="mb-0" style={{ ...arabicFontStyle, fontSize: isArabic ? '1rem' : '0.95rem' }}>{currentLevel.description}</p>

                    <div className="mt-3 pt-3 border-top border-light opacity-10">
                      <div className="d-flex align-items-center justify-content-center">
                        <FaClock className="me-2" />
                        <span style={arabicFontStyle}><strong>{t('schedule')}:</strong> {getScheduleTime(currentLevel.schedule)}</span>
                      </div>
                    </div>
                  </Card.Body>
                </Card>

                <Card className="shadow-sm border-0 mt-3 feature-card" style={{ borderRadius: '16px', transition: 'all 0.3s ease' }}>
                  <Card.Body className="p-3">
                    <small className="text-muted d-block mb-2" style={arabicFontStyle}>{t('keyFeatures')}:</small>
                    <div className="d-flex flex-wrap gap-1">
                      {currentLevel.features.map((feature, idx) => (
                        <span key={idx} className="badge bg-light text-dark border" style={{ padding: '4px 12px', borderRadius: '50px' }}>
                          <FaCheckCircle className="me-1" style={{ color: currentLevel.color }} />
                          {feature}
                        </span>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </Col>

            {/* Right Side - Subjects */}
            <Col lg={8}>
              <Card className="shadow-sm border-0 subjects-card" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                {/* Top Gradient Bar */}
                <div className="subjects-card-top-bar" style={{
                  height: '4px',
                  background: currentLevel.gradient
                }}></div>

                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4 className="fw-bold" style={arabicFontStyle}>{t('subjectsOffered')}</h4>
                    <Badge bg="light" className="text-dark" style={{ padding: '6px 14px', borderRadius: '50px' }}>
                      <FaBookOpen className="me-1" /> {formatNumber(currentLevel.subjects.length)} {isArabic ? 'مواد' : 'Subjects'}
                    </Badge>
                  </div>

                  <Row className="g-3">
                    {currentLevel.subjects.map((subject, index) => (
                      <Col key={index} md={6}>
                        <div
                          className="subject-card"
                          onMouseEnter={() => setHoveredSubject(index)}
                          onMouseLeave={() => setHoveredSubject(null)}
                          style={{
                            padding: '16px 20px',
                            background: hoveredSubject === index ? `${subject.color}12` : '#f8f9fa',
                            borderRadius: '14px',
                            borderLeft: `4px solid ${subject.color}`,
                            borderRight: isArabic ? `4px solid ${subject.color}` : 'none',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            cursor: 'default',
                            transform: hoveredSubject === index ? 'translateX(6px) scale(1.02)' : 'translateX(0) scale(1)',
                            boxShadow: hoveredSubject === index ? `0 8px 25px ${subject.color}20` : 'none',
                          }}
                        >
                          <div className="d-flex align-items-start">
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center me-3"
                              style={{
                                width: '44px',
                                height: '44px',
                                background: `${subject.color}20`,
                                color: subject.color,
                                fontSize: '1.2rem',
                                flexShrink: 0,
                                transition: 'all 0.4s ease',
                                transform: hoveredSubject === index ? 'scale(1.15) rotate(-10deg)' : 'scale(1) rotate(0)',
                              }}
                            >
                              {subject.icon}
                            </div>
                            <div>
                              <h6 className="fw-bold mb-1" style={arabicFontStyle}>{subject.name}</h6>
                              <p className="text-muted small mb-0" style={arabicFontStyle}>{subject.desc}</p>
                            </div>
                          </div>
                        </div>
                      </Col>
                    ))}
                  </Row>

                  <div className="mt-4 p-3 bg-light rounded-4" style={{ borderRadius: '16px' }}>
                    <div className="d-flex flex-wrap justify-content-around gap-2">
                      <div className="text-center" style={{ transition: 'all 0.3s ease' }}>
                        <FaRocket className="fs-2" style={{ color: currentLevel.color }} />
                        <p className="small text-muted mt-1" style={arabicFontStyle}>
                          {isArabic ? 'الابتكار' : 'Innovation'}
                        </p>
                      </div>
                      <div className="text-center" style={{ transition: 'all 0.3s ease' }}>
                        <FaLightbulb className="fs-2" style={{ color: currentLevel.color }} />
                        <p className="small text-muted mt-1" style={arabicFontStyle}>
                          {isArabic ? 'الإبداع' : 'Creativity'}
                        </p>
                      </div>
                      <div className="text-center" style={{ transition: 'all 0.3s ease' }}>
                        <FaKaaba className="fs-2" style={{ color: currentLevel.color }} />
                        <p className="small text-muted mt-1" style={arabicFontStyle}>
                          {isArabic ? 'القيم الإسلامية' : 'Islamic Values'}
                        </p>
                      </div>
                      <div className="text-center" style={{ transition: 'all 0.3s ease' }}>
                        <FaAward className="fs-2" style={{ color: currentLevel.color }} />
                        <p className="small text-muted mt-1" style={arabicFontStyle}>
                          {isArabic ? 'التميز' : 'Excellence'}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>

              {/* ===== UPDATED CURRICULUM OVERVIEW CARD ===== */}
              <Card className="shadow-sm border-0 mt-4 curriculum-card" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                <div className="curriculum-card-top-bar" style={{
                  height: '4px',
                  background: currentLevel.gradient
                }}></div>
                <Card.Body className="p-4">
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <FaBullseye className="fs-4" style={{ color: currentLevel.color }} />
                    <h5 className="fw-bold mb-0" style={arabicFontStyle}> 
                      {isArabic ? 'أهداف التعليم' : 'Educational Objectives for'}
                      {isArabic ? ` (${currentLevel.title})` : ` ${currentLevel.title}`}
                    </h5>
                  </div>
                  <Row className="g-3">
                    {curriculumItems && curriculumItems.length > 0 ? (
                      curriculumItems.map((item, index) => (
                        <Col key={index} md={6}>
                          <div className="curriculum-item d-flex align-items-start gap-3 p-3 rounded-3" style={{
                            background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
                            borderLeft: `4px solid ${currentLevel.color}`,
                            borderRight: isArabic ? `4px solid ${currentLevel.color}` : 'none',
                            transition: 'all 0.3s ease',
                            height: '100%',
                            minHeight: '80px'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = isArabic ? 'translateX(-4px)' : 'translateX(4px)';
                            e.currentTarget.style.boxShadow = `0 4px 20px ${currentLevel.color}20`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateX(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}>
                            <div className="curriculum-number" style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              background: currentLevel.gradient,
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: '700',
                              fontSize: '0.75rem',
                              flexShrink: 0
                            }}>
                              {formatNumber(index + 1)}
                            </div>
                            <p className="mb-0" style={{
                              ...arabicFontStyle,
                              fontSize: isArabic ? 'clamp(0.85rem, 1vw, 0.95rem)' : 'clamp(0.8rem, 0.9vw, 0.9rem)',
                              color: '#2d3436',
                              lineHeight: '1.6'
                            }}>
                              {item}
                            </p>
                          </div>
                        </Col>
                      ))
                    ) : (
                      <Col md={12}>
                        <div className="text-center py-3 text-muted" style={arabicFontStyle}>
                          {isArabic ? 'لا توجد أهداف متاحة' : 'No objectives available'}
                        </div>
                      </Col>
                    )}
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@100..900&family=Vazirmatn:wght@100..900&display=swap');

        @keyframes slideIn {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }

        .program-tab {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }
        .program-tab:hover {
          transform: scale(1.03);
        }
        .program-tab.active {
          transform: scale(1.05);
        }
        .program-tab.active .tab-icon {
          transform: scale(1.2) rotate(-10deg);
        }
        .program-tab:hover .tab-icon {
          transform: scale(1.1);
        }

        .program-info-card {
          transition: all 0.4s ease;
        }
        .program-info-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 60px rgba(0,0,0,0.15) !important;
        }

        .program-icon-wrapper {
          transition: all 0.4s ease;
        }
        .program-info-card:hover .program-icon-wrapper {
          transform: scale(1.08) rotate(-5deg);
        }

        .feature-card {
          transition: all 0.3s ease;
        }
        .feature-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.08) !important;
        }

        .subjects-card {
          transition: all 0.3s ease;
        }
        .subjects-card:hover {
          box-shadow: 0 8px 30px rgba(0,0,0,0.08) !important;
        }

        .subject-card {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .curriculum-card {
          transition: all 0.3s ease;
        }
        .curriculum-card:hover {
          box-shadow: 0 8px 30px rgba(0,0,0,0.08) !important;
        }

        .curriculum-item {
          transition: all 0.3s ease;
        }
        .curriculum-item:hover {
          transform: translateX(4px);
        }
        .dashboard-wrapper.rtl .curriculum-item:hover {
          transform: translateX(-4px);
        }

        .position-sticky {
          position: sticky;
          top: 100px;
          z-index: 10;
        }

        @media (max-width: 768px) {
          .program-tab {
            padding: 10px 18px !important;
            font-size: 0.8rem !important;
          }
          .program-tab .tab-icon {
            margin-right: 4px !important;
            font-size: 0.9rem !important;
          }
          .program-tab span:last-child {
            font-size: 0.75rem !important;
          }
          .position-sticky {
            position: relative !important;
            top: 0 !important;
          }
          .program-icon-wrapper {
            width: 70px !important;
            height: 70px !important;
            font-size: 2rem !important;
          }
          .program-info-card .p-4 {
            padding: 20px !important;
          }
          .subjects-card .p-4 {
            padding: 16px !important;
          }
          .subject-card {
            padding: 12px 16px !important;
          }
          .subject-card .me-3 {
            margin-right: 10px !important;
          }
          .subject-card .rounded-circle {
            width: 36px !important;
            height: 36px !important;
            font-size: 1rem !important;
          }
          .subject-card h6 {
            font-size: 0.85rem !important;
          }
          .subject-card p {
            font-size: 0.7rem !important;
          }
          .curriculum-item {
            min-height: 60px !important;
            padding: 12px !important;
          }
          .curriculum-item .curriculum-number {
            width: 24px !important;
            height: 24px !important;
            font-size: 0.65rem !important;
          }
          .curriculum-item p {
            font-size: 0.8rem !important;
          }
          .curriculum-card .p-4 {
            padding: 16px !important;
          }
          .curriculum-card h5 {
            font-size: 1rem !important;
          }
        }

        @media (max-width: 576px) {
          .program-tab {
            padding: 8px 12px !important;
            font-size: 0.65rem !important;
            border-width: 1.5px !important;
          }
          .program-tab .tab-icon {
            font-size: 0.8rem !important;
          }
          .program-tab span:last-child {
            font-size: 0.65rem !important;
          }
          .program-info-card .p-4 {
            padding: 16px !important;
          }
          .program-icon-wrapper {
            width: 60px !important;
            height: 60px !important;
            font-size: 1.6rem !important;
          }
          .program-info-card h3 {
            font-size: 1.2rem !important;
          }
          .program-info-card p {
            font-size: 0.8rem !important;
          }
          .subjects-card .p-4 {
            padding: 12px !important;
          }
          .subjects-card h4 {
            font-size: 1rem !important;
          }
          .subject-card {
            padding: 10px 12px !important;
          }
          .subject-card .rounded-circle {
            width: 30px !important;
            height: 30px !important;
            font-size: 0.8rem !important;
          }
          .subject-card h6 {
            font-size: 0.75rem !important;
          }
          .subject-card p {
            font-size: 0.65rem !important;
          }
          .curriculum-card .p-4 {
            padding: 12px !important;
          }
          .curriculum-card h5 {
            font-size: 0.9rem !important;
          }
          .curriculum-item {
            min-height: 50px !important;
            padding: 10px !important;
          }
          .curriculum-item .curriculum-number {
            width: 20px !important;
            height: 20px !important;
            font-size: 0.55rem !important;
          }
          .curriculum-item p {
            font-size: 0.7rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Academics;