// src/components/public/Home.jsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card, Carousel, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaGraduationCap,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaCalendarAlt,
  FaBookOpen,
  FaUsers,
  FaAward,
  FaClock,
  FaStar,
  FaQuoteLeft,
  FaArrowRight,
  FaSchool,
  FaHeart,
  FaRocket,
  FaTrophy,
  FaBook,
  FaChild,
  FaUserPlus,
  FaCalendarCheck,
  FaQuran,
  FaMosque
} from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { getTranslation } from '../../utils/translations';
import SocialButtons from '../../components/common/SocialButtons';

const Home = () => {
  const { language, isArabic } = useLanguage();
  const t = (key) => getTranslation(key, language);
  const navigate = useNavigate();

  const [counters, setCounters] = useState({
    students: 0,
    teachers: 0,
    programs: 0,
    years: 0
  });

  useEffect(() => {
    const targets = { students: 500, teachers: 35, programs: 4, years: 6 };
    const interval = setInterval(() => {
      setCounters(prev => {
        const newCounters = { ...prev };
        let allDone = true;
        for (const key in targets) {
          if (prev[key] < targets[key]) {
            newCounters[key] = Math.min(prev[key] + Math.ceil(targets[key] / 20), targets[key]);
            allDone = false;
          }
        }
        if (allDone) clearInterval(interval);
        return newCounters;
      });
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // ALWAYS use English numbers - NO Arabic numeral conversion
  const formatNumber = (num) => {
    return num.toString(); // Always returns English numbers
  };

  const stats = [
    {
      icon: <FaUserGraduate />,
      number: formatNumber(counters.students),
      label: t('students'),
      color: '#1a5f7a',
      suffix: '+',
      gradient: 'linear-gradient(135deg, #1a5f7a 0%, #2a7f9a 100%)',
      shadow: '0 8px 30px rgba(26, 95, 122, 0.3)'
    },
    {
      icon: <FaChalkboardTeacher />,
      number: formatNumber(counters.teachers),
      label: t('teachers'),
      color: '#c49a6c',
      suffix: '+',
      gradient: 'linear-gradient(135deg, #c49a6c 0%, #dbb88a 100%)',
      shadow: '0 8px 30px rgba(196, 154, 108, 0.3)'
    },
    {
      icon: <FaGraduationCap />,
      number: formatNumber(counters.programs),
      label: t('Education Levels'),
      color: '#2d6a4f',
      suffix: '',
      gradient: 'linear-gradient(135deg, #2d6a4f 0%, #40916c 100%)',
      shadow: '0 8px 30px rgba(45, 106, 79, 0.3)'
    },
    {
      icon: <FaCalendarAlt />,
      number: formatNumber(counters.years),
      label: t('yearsOfExcellence'),
      color: '#d4a373',
      suffix: '+',
      gradient: 'linear-gradient(135deg, #d4a373 0%, #f0d5a8 100%)',
      shadow: '0 8px 30px rgba(212, 163, 115, 0.3)'
    },
  ];

  const programs = [
    {
      id: 'kindergarden',
      title: t('Kindergarden School'),
      age: '3-6 years', // English format always
      description: t('nurseryDesc'),
      icon: <FaChild />,
      color: '#f39c12',
      gradient: 'linear-gradient(135deg, #f39c12 0%, #f7dc6f 100%)',
      badge: isArabic ? 'أولي' : 'KINDERGARDEN',
      badgeColor: 'warning'
    },
    {
      id: 'primary',
      title: t('primarySchool'),
      age: '6-12 years', // English format always
      description: t('primaryDesc'),
      icon: <FaBook />,
      color: '#2d6a4f',
      gradient: 'linear-gradient(135deg, #2d6a4f 0%, #52b788 100%)',
      badge: isArabic ? 'ابتدائي' : 'PRIMARY',
      badgeColor: 'success'
    },
    {
      id: 'secondary',
      title: t('secondarySchool'),
      age: '12-14 years', // English format always
      description: t('secondaryDesc'),
      icon: <FaGraduationCap />,
      color: '#c49a6c',
      gradient: 'linear-gradient(135deg, #c49a6c 0%, #e8c99e 100%)',
      badge: isArabic ? 'إعدادي' : 'SECONDARY',
      badgeColor: 'warning'
    },
    {
      id: 'high_school',
      title: t('High School'),
      age: '15-17 years', // English format always
      description: t('highSchoolDesc'),
      icon: <FaAward />,
      color: '#6c757d',
      gradient: 'linear-gradient(135deg, #6c757d 0%, #adb5bd 100%)',
      badge: isArabic ? 'ثانوي' : 'HIGH SCHOOL',
      badgeColor: 'secondary'
    },
  ];

  // Arabic font style with imported fonts
  const arabicFontStyle = {
    fontFamily: isArabic ? '"Noto Sans Arabic", "Vazirmatn", "Traditional Arabic", "Arabic Typesetting", serif' : 'inherit',
    lineHeight: isArabic ? '1.8' : '1.6',
    letterSpacing: isArabic ? '0.3px' : '0px',
  };

  // Number style - always use English/Roman numerals
  const numberStyle = {
    fontFamily: 'inherit',
    fontWeight: '700',
  };

  const handleLearnMore = (programId) => {
    navigate('/academics', { state: { activeTab: programId } });
  };

  const quickLinks = [
    { icon: <FaUserPlus />, title: t('Admissions'), desc: t('enrollToday'), link: '/admissions', color: '#1a5f7a' },
    { icon: <FaCalendarCheck />, title: t('Events'), desc: t('viewEvents'), link: '/news', color: '#2d6a4f' },
    { icon: <FaBookOpen />, title: t('Academics'), desc: t('explorePrograms'), link: '/academics', color: '#c49a6c' },
    { icon: <FaHeart />, title: t('Support'), desc: t('getInTouch'), link: '/contact', color: '#d4a373' },
  ];

  const testimonials = [
    {
      name: isArabic ? 'عبد الله إبراهيم' : 'Abdullah Ibrahim',
      role: t('parent'),
      text: isArabic
        ? 'لقد نما طفلي بشكل كبير منذ انضمامه إلى مدرسة الفتح. المعلمون رائعون والقيم الإسلامية تُغرس بشكل جميل.'
        : 'My child has grown tremendously since joining Madrassat Al Fath. The teachers are amazing and the Islamic values are instilled beautifully.',
      rating: 5,
      child: isArabic ? 'أحمد عبد الله (الصف الخامس الابتدائي)' : 'Ahmad Abdullah (Primary 5)'
    },
    {
      name: isArabic ? 'فاطمة يوسف' : 'Fatimah Yusuf',
      role: t('parent'),
      text: isArabic
        ? 'التعليم الذي يتلقاه أطفالي في مدرسة الفتح استثنائي. أحب كيفية موازنتهم بين التعليم الأكاديمي والتعليم الإسلامي.'
        : 'The education my children receive at Madrassat Al Fath is exceptional. I love how they balance academics with Islamic education.',
      rating: 5,
      child: isArabic ? 'محمد علي (الصف الثاني الإعدادي)' : 'Muhammad Ali (Secondary 2)'
    },
    {
      name: isArabic ? 'عمر حسن' : 'Omar Hassan',
      role: t('alumni'),
      text: isArabic
        ? 'الأساس الذي تلقيتُه في مدرسة الفتح أعدني بشكل جيد للجامعة والحياة. أنا ممتن للقيم التي غُرست فيَّ.'
        : 'The foundation I received at Madrassat Al Fath prepared me well for university and life. I am grateful for the values instilled in me.',
      rating: 5,
      child: isArabic ? 'تخرج 2023' : 'Graduated 2023'
    },
  ];

  return (
    <div className="home-page" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Social Buttons */}
      <SocialButtons />

      {/* ================================================================ */}
      {/* HERO SECTION - CAROUSEL WITH 3 SLIDES - FIXED IMAGES */}
      {/* ================================================================ */}
      <section className="hero-section">
        <Carousel fade indicators={true} controls={true} interval={5000}>

          {/* ============================================================== */}
          {/* SLIDE 1: WELCOME - ORANGE BACKGROUND */}
          {/* ============================================================== */}
          <Carousel.Item>
            <div className="hero-slide" style={{
              background: 'linear-gradient(135deg, #f7992e 0%, #f7992e 50%, #f7992e 100%)',
              padding: '60px 0',
              minHeight: '480px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Container>
                <Row className="align-items-center g-4">
                  <Col lg={7} className="text-white">
                    <h1 className="fw-bold mb-3" style={{
                      ...arabicFontStyle,
                      color: '#ffffff',
                      fontSize: isArabic ? 'clamp(2.5rem, 5vw, 3.8rem)' : 'clamp(2.2rem, 4.5vw, 3.8rem)',
                    }}>
                      {isArabic ? (
                        <>
                          <span style={{ color: '#ffffff' }}>مرحباً بكم في</span>
                          <br />
                          <span style={{ color: '#ffffff' }}>مدرسة الفتح الخاصة</span>
                        </>
                      ) : (
                        <>
                          <span style={{ color: '#ffffff' }}>Welcome to</span>
                          <br />
                          <span style={{ color: '#ffffff' }}>Madrassat Al Fath</span>
                          <br />
                          <span className="d-block fs-2 mt-2" style={{ color: '#ffffff' }}>Private School</span>
                        </>
                      )}
                    </h1>
                    <p className="lead mb-4" style={{
                      ...arabicFontStyle,
                      fontSize: isArabic ? 'clamp(1.2rem, 2vw, 1.5rem)' : 'clamp(1rem, 1.5vw, 1.2rem)',
                      color: '#ffffff'
                    }}>
                      {isArabic ? 'يدنا في يد أطفالنا علماً وأدباً' : 'Hand in hand with our children in knowledge and manners'}
                    </p>
                    <div className="d-flex gap-3 flex-wrap">
                      <Button variant="dark" size="lg" as={Link} to="/admissions" className="px-4">
                        {t('applyNow')} <FaArrowRight className="ms-2" />
                      </Button>
                      <Button variant="outline-dark" size="lg" as={Link} to="/about" className="px-4">
                        {t('learnMore')}
                      </Button>
                    </div>
                  </Col>
                  <Col lg={5} className="text-center">
                    <img
                      src="/src/assets/images/Img2.png"
                      alt="Madrassat Al Fath"
                      className="img-fluid rounded-4 shadow-lg hero-image"
                      style={{
                        width: '100%',
                        maxWidth: '550px',
                        height: 'auto',
                        maxHeight: '400px',
                        objectFit: 'cover',
                        borderRadius: '14px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
                      }}
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600&h=400&fit=crop';
                      }}
                    />
                  </Col>
                </Row>
              </Container>
            </div>
          </Carousel.Item>

          {/* ============================================================== */}
          {/* SLIDE 2: EXCELLENCE IN EDUCATION - DARK BLUE BACKGROUND */}
          {/* ============================================================== */}
          <Carousel.Item>
            <div className="hero-slide" style={{
              background: 'linear-gradient(135deg, #031c2f 0%, #0a2a44 50%, #031c2f 100%)',
              padding: '60px 0',
              minHeight: '480px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Container>
                <Row className="align-items-center g-4">
                  <Col lg={7} className="text-white">
                    <h1 className="display-4 fw-bold mb-3" style={{
                      ...arabicFontStyle,
                      fontSize: isArabic ? 'clamp(2.5rem, 5vw, 3.8rem)' : 'clamp(2.2rem, 4.5vw, 3.8rem)',
                    }}>
                      <span style={{ color: '#ffffff' }}>
                        {isArabic ? 'التميز في التعليم صنعتها' : 'Excellence in Education'}
                      </span>
                      <br />
                    </h1>
                    <p className="lead mb-4" style={{
                      ...arabicFontStyle,
                      fontSize: isArabic ? 'clamp(1.2rem, 2vw, 1.5rem)' : 'clamp(1rem, 1.5vw, 1.2rem)',
                      color: '#ffffff'
                    }}>
                      {t('excellenceDesc')}
                      <br />
                      <small style={{ color: 'rgba(255,255,255,0.8)' }}>{t('excellenceSub')}</small>
                    </p>
                    <div className="d-flex gap-3 flex-wrap">
                      <Button variant="light" size="lg" as={Link} to="/academics" className="px-4">
                        {t('ourPrograms')} <FaArrowRight className="ms-2" />
                      </Button>
                      <Button variant="outline-light" size="lg" as={Link} to="/contact" className="px-4">
                        {t('contactUs')}
                      </Button>
                    </div>
                  </Col>
                  <Col lg={5} className="text-center">
                    <img
                      src="/src/assets/images/Education-Summit.jpg"
                      alt="Excellence in Education"
                      className="img-fluid rounded-4 shadow-lg hero-image"
                      style={{
                        width: '100%',
                        maxWidth: '550px',
                        height: 'auto',
                        maxHeight: '400px',
                        objectFit: 'cover',
                        borderRadius: '14px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
                      }}
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&h=400&fit=crop';
                      }}
                    />
                  </Col>
                </Row>
              </Container>
            </div>
          </Carousel.Item>

          {/* ============================================================== */}
          {/* SLIDE 3: ISLAMIC VALUES - GREEN/BLUE BACKGROUND */}
          {/* ============================================================== */}
          <Carousel.Item>
            <div className="hero-slide" style={{
              background: 'linear-gradient(135deg, #1a4a6e 0%, #1a5a3a 50%, #1a3a5c 100%)',
              padding: '60px 0',
              minHeight: '480px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Container>
                <Row className="align-items-center g-4">
                  <Col lg={7} className="text-white">
                    <h1 className="display-4 fw-bold mb-3" style={{
                      ...arabicFontStyle,
                      fontSize: isArabic ? 'clamp(2.5rem, 5vw, 3.8rem)' : 'clamp(2.2rem, 4.5vw, 3.8rem)',
                    }}>
                      <span style={{ color: '#ffffff' }}>
                        {isArabic ? ' التربية على القيم الإسلامية  نبني جيلا نافعا للمجتمع' : 'Instilling Islamic Values, Building a Generation That Serves Society.'}
                      </span>
                      <br />
                    </h1>
                    <p className="lead mb-4" style={{
                      ...arabicFontStyle,
                      fontSize: isArabic ? 'clamp(1.2rem, 2vw, 1.5rem)' : 'clamp(1rem, 1.5vw, 1.2rem)',
                      color: '#ffffff'
                    }}>
                      <br />
                    </p>
                    <div className="d-flex gap-3 flex-wrap">
                      <Button variant="light" size="lg" as={Link} to="/about" className="px-4">
                        {t('ourStory')} <FaArrowRight className="ms-2" />
                      </Button>
                      <Button variant="outline-light" size="lg" as={Link} to="/admissions" className="px-4">
                        {t('applyNow')}
                      </Button>
                    </div>
                  </Col>
                  <Col lg={5} className="text-center">
                    <img
                      src="/src/assets/images/Qur'an3.jpg"
                      alt="Islamic Values"
                      className="img-fluid rounded-4 shadow-lg hero-image"
                      style={{
                        width: '100%',
                        maxWidth: '550px',
                        height: 'auto',
                        maxHeight: '400px',
                        objectFit: 'cover',
                        borderRadius: '14px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
                      }}
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1582653291997-079a1c04b5a1?w=600&h=400&fit=crop';
                      }}
                    />
                  </Col>
                </Row>
              </Container>
            </div>
          </Carousel.Item>
        </Carousel>
      </section>

      {/* Stats Section with Gradients and Animations */}
      <section className="py-5" style={{ marginTop: '-40px', position: 'relative', zIndex: 2 }}>
        <Container>
          <Row className="g-4">
            {stats.map((stat, index) => (
              <Col key={index} md={3} sm={6}>
                <div
                  className="stat-card-gradient"
                  style={{
                    background: stat.gradient,
                    borderRadius: '20px',
                    padding: '24px 20px',
                    color: 'white',
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: stat.shadow,
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    height: '100%',
                    cursor: 'default',
                    minHeight: '180px'
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
                  {/* Decorative circles */}
                  <div className="stat-deco-1" style={{
                    position: 'absolute',
                    top: '-30px',
                    right: '-30px',
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                    animation: 'floatBubble 6s ease-in-out infinite'
                  }}></div>
                  <div className="stat-deco-2" style={{
                    position: 'absolute',
                    bottom: '-20px',
                    left: '-20px',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.06)',
                    animation: 'floatBubble 8s ease-in-out infinite reverse'
                  }}></div>

                  <div className="position-relative" style={{ zIndex: 1 }}>
                    <div className="stat-icon-wrapper" style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '60px',
                      height: '60px',
                      borderRadius: '16px',
                      background: 'rgba(255,255,255,0.2)',
                      fontSize: '1.8rem',
                      marginBottom: '12px',
                      backdropFilter: 'blur(5px)',
                      transition: 'transform 0.4s ease'
                    }}>
                      {stat.icon}
                    </div>
                    <h2 className="fw-bold mb-1" style={{
                      ...numberStyle,
                      fontSize: isArabic ? 'clamp(2rem, 4vw, 2.8rem)' : 'clamp(2.2rem, 4vw, 3rem)',
                      color: 'white',
                      textShadow: '0 2px 10px rgba(0,0,0,0.1)'
                    }}>
                      {stat.number}{stat.suffix}
                    </h2>
                    <p className="mb-0" style={{
                      ...arabicFontStyle,
                      fontSize: isArabic ? 'clamp(0.8rem, 1.2vw, 0.95rem)' : 'clamp(0.85rem, 1.1vw, 1rem)',
                      opacity: 0.9,
                      fontWeight: '500'
                    }}>
                      {stat.label}
                    </p>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Quick Links */}
      <section className="py-4 bg-light">
        <Container>
          <h5 className="text-center mb-3 fw-bold" style={arabicFontStyle}>
            {isArabic ? 'روابط سريعة' : 'Quick Links'}
          </h5>
          <Row className="g-3">
            {quickLinks.map((link, index) => (
              <Col key={index} md={3} sm={6}>
                <Link to={link.link} className="text-decoration-none">
                  <Card className="h-100 shadow-sm border-0 text-center quick-link-card">
                    <Card.Body className="p-3">
                      <div className="quick-link-icon" style={{ color: link.color }}>
                        {link.icon}
                      </div>
                      <h6 className="mb-0" style={arabicFontStyle}>{link.title}</h6>
                      <small className="text-muted" style={arabicFontStyle}>{link.desc}</small>
                    </Card.Body>
                  </Card>
                </Link>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Programs Section with Enhanced Cards */}
      <section className="py-5 bg-light">
        <Container>
          <div className="text-center mb-5">
            <h2 className="fw-bold" style={{ ...arabicFontStyle, fontSize: isArabic ? 'clamp(2rem, 3vw, 2.5rem)' : 'clamp(1.8rem, 2.8vw, 2.3rem)' }}>
              {t('Our Education Levels')}
            </h2>
            <p className="text-muted fs-5" style={arabicFontStyle}>{t('qualityEducation')}</p>
          </div>
          <Row className="g-4">
            {programs.map((program, index) => (
              <Col key={index} md={3}>
                <Card className="h-100 shadow-sm border-0 program-card-enhanced">
                  {/* Gradient Header */}
                  <div
                    className="program-card-header"
                    style={{
                      background: program.gradient,
                      height: '8px',
                      borderTopLeftRadius: '16px',
                      borderTopRightRadius: '16px',
                      transition: 'height 0.4s ease'
                    }}
                  />
                  <Card.Body className="p-4 text-center">
                    {/* Icon with pulse animation */}
                    <div className="program-icon-wrapper mb-3">
                      <div
                        className="rounded-circle d-inline-flex align-items-center justify-content-center p-3 program-icon-enhanced"
                        style={{
                          background: program.color,
                          width: 'clamp(70px, 10vw, 80px)',
                          height: 'clamp(70px, 10vw, 80px)',
                          color: 'white',
                          fontSize: 'clamp(1.8rem, 3vw, 2.2rem)',
                          boxShadow: `0 8px 25px ${program.color}40`,
                          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                      >
                        {program.icon}
                      </div>
                    </div>

                    {/* Badge */}
                    <Badge
                      bg={program.badgeColor}
                      className="mb-2 program-badge"
                      style={{
                        padding: '6px 16px',
                        borderRadius: '20px',
                        fontWeight: '600',
                        fontSize: 'clamp(0.65rem, 0.9vw, 0.75rem)',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase'
                      }}
                    >
                      {program.badge}
                    </Badge>

                    {/* Title - only below the circle */}
                    <h4 className="mt-2" style={{ ...arabicFontStyle, fontSize: isArabic ? 'clamp(1rem, 1.3vw, 1.2rem)' : 'clamp(0.95rem, 1.2vw, 1.1rem)' }}>
                      {program.title}
                    </h4>

                    {/* Age in English format */}
                    <p className="text-muted small mb-2" style={{
                      fontFamily: 'inherit',
                      fontWeight: '500',
                      color: '#6c757d',
                      fontSize: 'clamp(0.75rem, 1vw, 0.85rem)'
                    }}>
                      {program.age}
                    </p>

                    <p className="text-muted small" style={{ ...arabicFontStyle, fontSize: 'clamp(0.75rem, 0.9vw, 0.85rem)' }}>
                      {program.description}
                    </p>
                  </Card.Body>
                  <Card.Footer className="bg-transparent border-0 text-center pb-4">
                    <Button
                      variant="link"
                      className="text-decoration-none learn-more-btn"
                      onClick={() => handleLearnMore(program.id)}
                      style={{
                        ...arabicFontStyle,
                        color: program.color,
                        fontWeight: '600',
                        transition: 'all 0.3s ease',
                        padding: '8px 20px',
                        borderRadius: '25px',
                        border: `2px solid ${program.color}20`,
                        fontSize: 'clamp(0.75rem, 0.9vw, 0.85rem)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = program.color;
                        e.currentTarget.style.color = 'white';
                        e.currentTarget.style.transform = 'translateX(5px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = program.color;
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      {t('learnMoreBtn')} <FaArrowRight className="ms-1" style={{ transition: 'transform 0.3s ease' }} />
                    </Button>
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Testimonials */}
      <section className="py-5">
        <Container>
          <div className="text-center mb-5">
            <h2 className="fw-bold" style={{ ...arabicFontStyle, fontSize: isArabic ? 'clamp(2rem, 3vw, 2.5rem)' : 'clamp(1.8rem, 2.8vw, 2.3rem)' }}>
              {t('What Community Says')}
            </h2>
            <p className="text-muted fs-5" style={arabicFontStyle}>{t('Testimonials')}</p>
          </div>
          <Carousel indicators={true} interval={4000} className="testimonial-carousel">
            {testimonials.map((testimonial, index) => (
              <Carousel.Item key={index}>
                <Card className="shadow-sm border-0 mx-auto" style={{ maxWidth: '700px' }}>
                  <Card.Body className="p-5 text-center">
                    <div className="text-warning mb-3">
                      {'⭐'.repeat(testimonial.rating)}
                    </div>
                    <FaQuoteLeft size={30} className="text-primary opacity-25 mb-3" />
                    <p className="fs-5" style={arabicFontStyle}>"{testimonial.text}"</p>
                    <div className="mt-3">
                      <h6 className="fw-bold mb-0" style={arabicFontStyle}>{testimonial.name}</h6>
                      <small className="text-muted" style={arabicFontStyle}>{testimonial.role}</small>
                      <br />
                      <small className="text-muted" style={arabicFontStyle}>{isArabic ? 'الطفل' : 'Child'}: {testimonial.child}</small>
                    </div>
                  </Card.Body>
                </Card>
              </Carousel.Item>
            ))}
          </Carousel>
        </Container>
      </section>

      {/* CTA */}
      <section className="py-5" style={{ background: 'linear-gradient(135deg, #031c2f 0%, #1a5f7a 100%)' }}>
        <Container>
          <Row className="align-items-center text-white">
            <Col lg={8}>
              <h2 className="fw-bold" style={{ ...arabicFontStyle, fontSize: isArabic ? 'clamp(2rem, 3vw, 2.5rem)' : 'clamp(1.8rem, 2.8vw, 2.3rem)' }}>
                {t('Ready To Join')}
              </h2>
              <p className="mb-0 fs-5" style={arabicFontStyle}>{t('Start Journey')}</p>
            </Col>
            <Col lg={4} className="text-lg-end mt-3 mt-lg-0">
              <Button variant="light" size="lg" as={Link} to="/admissions" className="px-5">
                {t('applyNow')} <FaArrowRight className="ms-2" />
              </Button>
            </Col>
          </Row>
        </Container>
      </section>

      <style>{`
        /* Import Arabic Fonts */
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@100..900&family=Vazirmatn:wght@100..900&display=swap');

        @keyframes floatBubble {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-10px, -15px) scale(1.1); }
        }

        @keyframes pulseIcon {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
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

        .text-gold { color: #d4a373; }
        
        .stat-card-gradient {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: default;
          animation: slideInUp 0.6s ease forwards;
        }

        .stat-card-gradient .stat-icon-wrapper {
          transition: transform 0.4s ease;
        }
        .stat-card-gradient:hover .stat-icon-wrapper {
          transform: scale(1.15) rotate(-5deg);
        }

        /* Enhanced Program Cards */
        .program-card-enhanced {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 16px !important;
          overflow: hidden;
          background: white;
          position: relative;
          animation: slideInUp 0.6s ease forwards;
        }

        .program-card-enhanced:hover {
          transform: translateY(-12px);
          box-shadow: 0 20px 60px rgba(0,0,0,0.15) !important;
        }

        .program-card-enhanced:hover .program-card-header {
          height: 12px !important;
        }

        .program-card-enhanced:hover .program-icon-enhanced {
          transform: scale(1.1) rotate(-8deg);
          box-shadow: 0 12px 35px rgba(0,0,0,0.2) !important;
        }

        .program-card-enhanced:hover .program-badge {
          transform: scale(1.05);
        }

        .program-icon-enhanced {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          animation: pulseIcon 3s ease-in-out infinite;
        }

        .program-badge {
          transition: transform 0.3s ease;
        }

        .learn-more-btn {
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .learn-more-btn:hover {
          transform: translateX(5px) !important;
        }

        .learn-more-btn:hover svg {
          transform: translateX(5px);
        }

        .learn-more-btn svg {
          transition: transform 0.3s ease;
        }

        .program-card-enhanced:nth-child(1) { animation-delay: 0.1s; }
        .program-card-enhanced:nth-child(2) { animation-delay: 0.2s; }
        .program-card-enhanced:nth-child(3) { animation-delay: 0.3s; }
        .program-card-enhanced:nth-child(4) { animation-delay: 0.4s; }

        .program-card-enhanced .card-footer {
          background: transparent !important;
          border-top: none !important;
        }

        .quick-link-card { 
          transition: all 0.3s ease; 
          border-radius: 12px !important;
        }
        .quick-link-card:hover { 
          transform: translateY(-3px); 
          box-shadow: 0 8px 25px rgba(0,0,0,0.1); 
        }
        .quick-link-icon { 
          font-size: 2rem; 
          margin-bottom: 5px;
          transition: transform 0.3s ease;
        }
        .quick-link-card:hover .quick-link-icon {
          transform: scale(1.1);
        }
        
        .testimonial-carousel .carousel-indicators { 
          position: relative; 
          margin-top: 20px; 
        }
        .testimonial-carousel .carousel-indicators button { 
          width: 12px; 
          height: 12px; 
          border-radius: 50%; 
          background: #1a5f7a; 
        }
        
        .hero-slide { 
          position: relative; 
          min-height: 480px; 
          display: flex; 
          align-items: center; 
        }
        
        .carousel-indicators {
          bottom: 10px !important;
          z-index: 15;
        }
        .carousel-indicators button {
          width: 12px !important;
          height: 12px !important;
          border-radius: 50% !important;
          margin: 0 6px !important;
          background: rgba(255,255,255,0.4) !important;
          border: none !important;
        }
        .carousel-indicators .active {
          background: #d4a373 !important;
        }

        /* ===== HERO IMAGE RESPONSIVE STYLES ===== */
        .hero-image {
          transition: all 0.5s ease;
          max-width: 100%;
          height: auto;
          max-height: 400px;
          object-fit: cover;
        }

        .hero-image:hover {
          transform: scale(1.02);
          box-shadow: 0 20px 60px rgba(0,0,0,0.4) !important;
        }

        /* RTL specific styles */
        .dashboard-wrapper.rtl .stat-card-gradient {
          text-align: right;
        }
        .dashboard-wrapper.rtl .quick-link-card {
          text-align: right;
        }
        .dashboard-wrapper.rtl .program-card-enhanced {
          text-align: right;
        }

        /* ===== RESPONSIVE BREAKPOINTS ===== */
        @media (max-width: 992px) {
          .hero-slide {
            min-height: 400px !important;
            padding: 40px 0 !important;
          }
          .hero-image {
            max-height: 300px !important;
            margin-top: 20px;
          }
          .hero-slide .fw-bold {
            font-size: clamp(2rem, 4vw, 2.8rem) !important;
          }
          .hero-slide .lead {
            font-size: clamp(1rem, 1.5vw, 1.2rem) !important;
          }
        }

        @media (max-width: 768px) {
          .hero-slide {
            min-height: 350px !important;
            padding: 30px 0 !important;
          }
          .hero-image {
            max-height: 250px !important;
            margin-top: 15px;
          }
          .hero-slide .fw-bold {
            font-size: clamp(1.6rem, 3.5vw, 2.2rem) !important;
          }
          .hero-slide .lead {
            font-size: clamp(0.9rem, 1.3vw, 1rem) !important;
          }
          .hero-slide .btn {
            font-size: 0.85rem !important;
            padding: 6px 18px !important;
          }
          
          .stat-card-gradient { 
            padding: 16px !important; 
            min-height: 140px !important;
          }
          .stat-card-gradient .fw-bold {
            font-size: clamp(1.5rem, 3vw, 2rem) !important;
          }
          .stat-card-gradient .stat-icon-wrapper {
            width: 50px !important;
            height: 50px !important;
            font-size: 1.5rem !important;
          }
          .stat-card-gradient p {
            font-size: 0.8rem !important;
          }
          
          .carousel-indicators {
            bottom: 5px !important;
          }
          .carousel-indicators button {
            width: 8px !important;
            height: 8px !important;
            margin: 0 4px !important;
          }
          
          .testimonial-carousel .card-body {
            padding: 24px !important;
          }
          .testimonial-carousel .fs-5 {
            font-size: 0.95rem !important;
          }

          .program-icon-enhanced {
            width: 60px !important;
            height: 60px !important;
            font-size: 1.5rem !important;
          }
        }

        @media (max-width: 576px) {
          .hero-slide {
            min-height: 300px !important;
            padding: 20px 0 !important;
          }
          .hero-image {
            max-height: 200px !important;
            margin-top: 10px;
            border-radius: 10px !important;
          }
          .hero-slide .fw-bold {
            font-size: clamp(1.3rem, 3vw, 1.8rem) !important;
          }
          .hero-slide .fw-bold .fs-2 {
            font-size: clamp(1rem, 2vw, 1.3rem) !important;
          }
          .hero-slide .lead {
            font-size: clamp(0.8rem, 1.2vw, 0.95rem) !important;
          }
          .hero-slide .btn {
            font-size: 0.75rem !important;
            padding: 4px 14px !important;
          }
          .d-flex.gap-3 {
            gap: 0.5rem !important;
          }
          .d-flex.gap-3 .btn {
            padding: 4px 12px !important;
            font-size: 0.7rem !important;
          }
          
          .stat-card-gradient { 
            padding: 12px !important; 
            min-height: 110px !important;
            border-radius: 16px !important;
          }
          .stat-card-gradient .fw-bold {
            font-size: clamp(1.2rem, 2.5vw, 1.5rem) !important;
          }
          .stat-card-gradient .stat-icon-wrapper {
            width: 36px !important;
            height: 36px !important;
            font-size: 1rem !important;
            margin-bottom: 6px !important;
            border-radius: 10px !important;
          }
          .stat-card-gradient p {
            font-size: 0.6rem !important;
          }
          .stat-deco-1, .stat-deco-2 {
            display: none !important;
          }
          
          .program-card-enhanced .p-4 {
            padding: 16px !important;
          }
          .program-card-enhanced h4 {
            font-size: 1rem !important;
          }
          .program-icon-enhanced {
            width: 50px !important;
            height: 50px !important;
            font-size: 1.2rem !important;
          }
          .program-card-enhanced .program-badge {
            font-size: 0.55rem !important;
            padding: 4px 10px !important;
          }
          
          .quick-link-card .p-3 {
            padding: 10px !important;
          }
          .quick-link-icon {
            font-size: 1.3rem !important;
          }
          .quick-link-card h6 {
            font-size: 0.75rem !important;
          }
          .quick-link-card small {
            font-size: 0.6rem !important;
          }
          
          .testimonial-carousel .card-body {
            padding: 16px !important;
          }
          .testimonial-carousel .fs-5 {
            font-size: 0.8rem !important;
          }
          
          .hero-section .carousel-control-prev,
          .hero-section .carousel-control-next {
            display: none !important;
          }
          
          .carousel-indicators {
            bottom: 0 !important;
          }
          .carousel-indicators button {
            width: 6px !important;
            height: 6px !important;
            margin: 0 3px !important;
          }
        }

        @media (max-width: 400px) {
          .hero-slide {
            min-height: 280px !important;
          }
          .hero-image {
            max-height: 160px !important;
          }
          .hero-slide .fw-bold {
            font-size: clamp(1.1rem, 2.5vw, 1.4rem) !important;
          }
          .hero-slide .lead {
            font-size: clamp(0.7rem, 1vw, 0.8rem) !important;
          }
          .hero-slide .btn {
            font-size: 0.6rem !important;
            padding: 3px 10px !important;
          }
          
          .stat-card-gradient {
            min-height: 90px !important;
            padding: 8px !important;
          }
          .stat-card-gradient .fw-bold {
            font-size: clamp(1rem, 2vw, 1.2rem) !important;
          }
          .stat-card-gradient .stat-icon-wrapper {
            width: 30px !important;
            height: 30px !important;
            font-size: 0.8rem !important;
          }
          .stat-card-gradient p {
            font-size: 0.5rem !important;
          }
          
          .program-card-enhanced .p-4 {
            padding: 12px !important;
          }
          .program-icon-enhanced {
            width: 40px !important;
            height: 40px !important;
            font-size: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Home;