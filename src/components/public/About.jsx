// src/components/public/About.jsx
import React, { useState } from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import {
  FaHistory,
  FaEye,
  FaBullseye,
  FaHeart,
  FaBook,
  FaUsers,
  FaHands,
  FaQuran,
  FaGlobe,
  FaAward,
  FaGraduationCap,
  FaChalkboardTeacher,
  FaUserTie,
  FaQuoteLeft,
  FaStar,
  FaCertificate,
  FaRocket,
  FaChartLine,
  FaLaptop,
  FaHandsHelping,
  FaGlobeAsia,
  FaSchool,
  FaUserGraduate,
  FaChalkboard,
  FaBuilding,
  FaClock,
  FaArrowRight,
  FaPlayCircle,
  FaChevronRight,
  FaPenFancy,
  FaTools,
  FaWrench,
} from "react-icons/fa";
import { useLanguage } from "../../context/LanguageContext";
import { getTranslation } from "../../utils/translations";
import { formatMilestoneYear } from "../../utils/helpers";

const About = () => {
  const { language, isArabic } = useLanguage();
  const t = (key) => getTranslation(key, language);
  const [activeMilestone, setActiveMilestone] = useState(null);

  // ===== ARABIC FONT STYLE - Consistent across all text =====
  const arabicFontStyle = {
    fontFamily: isArabic
      ? '"Noto Sans Arabic", "Vazirmatn", "Traditional Arabic", serif'
      : "inherit",
    lineHeight: isArabic ? "1.8" : "1.6",
    letterSpacing: isArabic ? "0.3px" : "0px",
  };

  // ✅ Values
  const values = [
    {
      icon: <FaHeart />,
      title: t("valueIslamic"),
      desc: t("valueIslamicDesc"),
    },
    { icon: <FaBook />, title: t("valueQuality"), desc: t("valueQualityDesc") },
    {
      icon: <FaUsers />,
      title: t("valueCommunity"),
      desc: t("valueCommunityDesc"),
    },
    {
      icon: <FaHands />,
      title: t("valueCharacter"),
      desc: t("valueCharacterDesc"),
    },
  ];

  // ✅ Milestones - Fixed with correct information
  const milestones = [
    {
      year: "2020",
      title: t("founded"),
      description: t("foundedDesc"),
      icon: <FaHistory />,
      color: "#1a5f7a",
      details: isArabic
        ? "بدأنا رحلتنا بـ 50 تلميذاً في منشأة صغيرة، واضعين الأساس للتميز."
        : "Started our journey with 50 students in a small facility, laying the foundation for excellence.",
    },
    {
      year: "2021",
      title: t("expansion"),
      description: isArabic
        ? "تطوير المرافق وإضافة فصول جديدة"
        : "Facility development and adding new classrooms",
      icon: <FaTools />,
      color: "#2d6a4f",
      details: isArabic
        ? "قمنا بتطوير مرافق المدرسة وإضافة فصول جديدة مجهزة بأحدث الوسائل التعليمية."
        : "We developed school facilities and added new classrooms equipped with the latest educational tools.",
    },
    {
      year: "2022",
      title: t("growth"),
      description: isArabic
        ? "نمو ملحوظ في عدد التلاميذ"
        : "Significant student growth",
      icon: <FaRocket />,
      color: "#c49a6c",
      details: isArabic
        ? "وصل عدد التلاميذ إلى 250 تلميذاً في جميع المستويات مع برامج أكاديمية محسنة."
        : "Reached 250 students across all levels with enhanced academic programs.",
    },
    {
      year: "2023",
      title: t("academicExcellence"),
      description: isArabic
        ? "تحقيق التميز الأكاديمي"
        : "Achieving academic excellence",
      icon: <FaAward />,
      color: "#d4a373",
      details: isArabic
        ? "حققنا 380+ تلميذ بنتائج ممتازة واعتراف أكاديمي على المستوى المحلي."
        : "Achieved 380+ students with excellent results and local academic recognition.",
    },
    {
      year: "2024",
      title: t("digitalTransformation"),
      description: isArabic
        ? "تحديث شامل للمرافق والبنية التحتية"
        : "Comprehensive modernization of facilities",
      icon: <FaBuilding />,
      color: "#6c757d",
      details: isArabic
        ? "طبقنا تحديثاً شاملاً للمرافق والبنية التحتية، مع إضافة مختبرات حديثة وفصول رقمية."
        : "Implemented comprehensive modernization of facilities and infrastructure, adding modern labs and digital classrooms.",
    },
    {
      year: "2025",
      title: isArabic ? "ريادة التعليم" : "Educational Leadership",
      description: isArabic
        ? "توسع في البرامج الأكاديمية والأنشطة"
        : "Expansion of academic programs and activities",
      icon: <FaGlobeAsia />,
      color: "#1a5f7a",
      details: isArabic
        ? "وسعنا برامجنا الأكاديمية والأنشطة اللاصفية، مع تعزيز الشراكة مع أولياء الأمور."
        : "Expanded our academic programs and extracurricular activities, enhancing partnership with parents.",
    },
    {
      year: "2026",
      title: t("visionFuture"),
      description: isArabic
        ? "رؤية مستقبلية للتميز"
        : "Future vision for excellence",
      icon: <FaGlobeAsia />,
      color: "#c49a6c",
      details: isArabic
        ? "نضع أهدافاً جديدة للتميز التعليمي والابتكار في طرق التعلم، مع 520+ تلميذاً."
        : "Setting new goals for educational excellence and innovative learning approaches, with 520+ students.",
    },
  ];

  // ✅ Quick Stats - ALWAYS English numbers with updated color for Years of Excellence
  const quickStats = [
    {
      icon: <FaUserGraduate />,
      number: "520+",
      label: t("students"),
      color: "#1a5f7a",
      gradient: "linear-gradient(135deg, #1a5f7a 0%, #2a7f9a 100%)",
      shadow: "0 8px 30px rgba(26, 95, 122, 0.3)",
    },
    {
      icon: <FaChalkboardTeacher />,
      number: "35+",
      label: t("teachers"),
      color: "#2d6a4f",
      gradient: "linear-gradient(135deg, #2d6a4f 0%, #40916c 100%)",
      shadow: "0 8px 30px rgba(45, 106, 79, 0.3)",
    },
    {
      icon: <FaSchool />,
      number: "4",
      label: t("Education Levels"),
      color: "#c49a6c",
      gradient: "linear-gradient(135deg, #c49a6c 0%, #dbb88a 100%)",
      shadow: "0 8px 30px rgba(196, 154, 108, 0.3)",
    },
    {
      icon: <FaAward />,
      number: "6+",
      label: t("yearsOfExcellence"),
      color: "#8e44ad",
      gradient: "linear-gradient(135deg, #8e44ad 0%, #9b59b6 100%)",
      shadow: "0 8px 30px rgba(142, 68, 173, 0.3)",
    },
  ];

  return (
    <div className="fade-in" dir={isArabic ? "rtl" : "ltr"}>
      {/* Hero Section - Fixed with English number 2016 */}
      <section
        className="py-5"
        style={{
          background: "linear-gradient(135deg, #031c2f 0%, #1a5f7a 100%)",
        }}
      >
        <Container>
          <h1
            className="display-4 fw-bold text-center text-white"
            style={arabicFontStyle}
          >
            {t("aboutTitle")}
          </h1>
          <p
            className="text-center fs-5 text-white opacity-75"
            style={arabicFontStyle}
          >
            {isArabic ? "نرتقي بالعلم والإيمان منذ 2020" : t("aboutSubtitle")}
          </p>
        </Container>
      </section>

      {/* ===== SECTION 1: QUICK STATS ===== */}
      <section
        className="py-4"
        style={{
          marginTop: "10px",
          position: "relative",
          zIndex: 2,
          background: "white",
        }}
      >
        <Container>
          <Row className="g-4">
            {quickStats.map((stat, index) => (
              <Col key={index} md={3} sm={6} xs={6}>
                <div
                  className="stat-card-gradient"
                  style={{
                    background: stat.gradient,
                    borderRadius: "20px",
                    padding: "24px 20px",
                    color: "white",
                    textAlign: "center",
                    position: "relative",
                    overflow: "hidden",
                    boxShadow: stat.shadow,
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    height: "100%",
                    cursor: "default",
                    minHeight: "clamp(160px, 22vw, 200px)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform =
                      "translateY(-8px) scale(1.02)";
                    e.currentTarget.style.boxShadow =
                      "0 16px 50px rgba(0,0,0,0.25)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                    e.currentTarget.style.boxShadow = stat.shadow;
                  }}
                >
                  {/* Top Gradient Bar */}
                  <div
                    className="stat-top-bar"
                    style={{
                      position: "absolute",
                      top: "0",
                      left: "0",
                      right: "0",
                      height: "4px",
                      background: "rgba(255,255,255,0.3)",
                      borderRadius: "20px 20px 0 0",
                    }}
                  ></div>

                  {/* Decorative circles */}
                  <div
                    className="stat-deco-1"
                    style={{
                      position: "absolute",
                      top: "-30px",
                      right: "-30px",
                      width: "80px",
                      height: "80px",
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.1)",
                      animation: "floatBubble 6s ease-in-out infinite",
                    }}
                  ></div>
                  <div
                    className="stat-deco-2"
                    style={{
                      position: "absolute",
                      bottom: "-20px",
                      left: "-20px",
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.06)",
                      animation: "floatBubble 8s ease-in-out infinite reverse",
                    }}
                  ></div>

                  <div className="position-relative" style={{ zIndex: 1 }}>
                    <div
                      className="stat-icon-wrapper"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "clamp(40px, 6vw, 60px)",
                        height: "clamp(40px, 6vw, 60px)",
                        borderRadius: "16px",
                        background: "rgba(255,255,255,0.2)",
                        fontSize: "clamp(1.2rem, 2vw, 1.8rem)",
                        marginBottom: "12px",
                        backdropFilter: "blur(5px)",
                        transition: "transform 0.4s ease",
                      }}
                    >
                      {stat.icon}
                    </div>
                    <h2
                      className="fw-bold mb-1"
                      style={{
                        fontFamily: "inherit",
                        fontSize: isArabic
                          ? "clamp(2rem, 4vw, 2.8rem)"
                          : "clamp(2.2rem, 4vw, 2.8rem)",
                        color: "white",
                        textShadow: "0 2px 10px rgba(0,0,0,0.1)",
                        fontWeight: "700",
                      }}
                    >
                      {stat.number}
                    </h2>
                    <p
                      className="mb-0"
                      style={{
                        ...arabicFontStyle,
                        fontSize: isArabic
                          ? "clamp(0.8rem, 1.5vw, 1.2rem)"
                          : "clamp(0.75rem, 1.2vw, 1rem)",
                        opacity: 0.95,
                        fontWeight: "500",
                        color: "white",
                      }}
                    >
                      {stat.label}
                    </p>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* ===== SECTION 2: CORE VALUES ===== */}
      <section className="py-5 bg-light">
        <Container>
          <h2 className="text-center fw-bold mb-5" style={arabicFontStyle}>
            {t("ourValues")}
          </h2>
          <Row className="g-4">
            {values.map((value, index) => (
              <Col key={index} md={3} sm={6} xs={6}>
                <Card className="h-100 shadow-sm border-0 text-center value-card">
                  <Card.Body className="p-4">
                    <div
                      className="text-primary mb-3 value-icon"
                      style={{ fontSize: "3rem" }}
                    >
                      {value.icon}
                    </div>
                    <h5 className="fw-bold" style={arabicFontStyle}>
                      {value.title}
                    </h5>
                    <p
                      className="text-muted"
                      style={{
                        ...arabicFontStyle,
                        fontSize: isArabic ? "0.95rem" : "0.9rem",
                      }}
                    >
                      {value.desc}
                    </p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* ===== SECTION 3: OUR MISSION - Top Card ===== */}
      <section className="py-5 mission-section">
        <Container>
          <Row className="justify-content-center">
            <Col lg={10} md={11} sm={12}>
              <Card className="shadow-lg border-0 mission-card-enhanced">
                {/* Top Gradient Bar */}
                <div
                  className="mission-card-top"
                  style={{
                    height: "5px",
                    background:
                      "linear-gradient(90deg, #2d6a4f, #40916c, #52b788)",
                    borderRadius: "24px 24px 0 0",
                    transition: "height 0.4s ease",
                  }}
                ></div>

                <Card.Body className="p-4 p-md-5 p-lg-5 text-center">
                  <div className="mission-icon-wrapper mb-3 mb-md-4">
                    <div
                      className="rounded-circle d-inline-flex align-items-center justify-content-center p-3"
                      style={{
                        background:
                          "linear-gradient(135deg, #2d6a4f15, #52b78815)",
                        width: "clamp(60px, 8vw, 80px)",
                        height: "clamp(60px, 8vw, 80px)",
                        border: "2px solid #2d6a4f",
                        transition: "all 0.4s ease",
                      }}
                    >
                      <FaBullseye size={32} style={{ color: "#2d6a4f" }} />
                    </div>
                  </div>

                  <div className="mission-quote-icon mb-2 mb-md-3">
                    <FaQuoteLeft
                      size={30}
                      style={{ color: "#2d6a4f", opacity: 0.2 }}
                    />
                  </div>

                  <h2
                    className="fw-bold mb-3"
                    style={{
                      ...arabicFontStyle,
                      color: "#2d6a4f",
                      fontSize: isArabic
                        ? "clamp(1.3rem, 2.5vw, 1.8rem)"
                        : "clamp(1.2rem, 2.2vw, 1.6rem)",
                    }}
                  >
                    {t("ourMission")}
                  </h2>

                  <p
                    className="mission-text"
                    style={{
                      ...arabicFontStyle,
                      fontSize: isArabic
                        ? "clamp(0.95rem, 2vw, 1.15rem)"
                        : "clamp(0.9rem, 1.8vw, 1.1rem)",
                      lineHeight: "2",
                      color: "#2d3436",
                      maxWidth: "800px",
                      margin: "0 auto",
                      fontWeight: "400",
                      padding: "0 4px",
                    }}
                  >
                    {isArabic
                      ? "نتطلع من أجل تحقيق تعليم نافع يفتح آفاقاً واعدةً مفعمةً بالنجاح لفلذات أكبادنا"
                      : "We aspire to provide a beneficial education that opens promising horizons filled with success for our beloved children."}
                  </p>

                  <div
                    className="mission-divider"
                    style={{
                      width: "60px",
                      height: "3px",
                      background: "linear-gradient(90deg, #2d6a4f, #52b788)",
                      margin: "20px auto",
                      borderRadius: "2px",
                      transition: "all 0.4s ease",
                    }}
                  ></div>

                  <div className="mission-signature" style={arabicFontStyle}>
                    <span
                      style={{
                        fontSize: isArabic
                          ? "clamp(0.8rem, 1.8vw, 0.9rem)"
                          : "clamp(0.8rem, 1.8vw, 0.9rem)",
                        color: "#2d6a4f",
                        fontWeight: "600",
                      }}
                    >
                      {isArabic
                        ? "رسالتنا التعليمية"
                        : "Our Educational Mission"}
                    </span>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ===== SECTION 4: OUR VISION - Bottom Card ===== */}
      <section className="py-5 vision-section">
        <Container>
          <Row className="justify-content-center">
            <Col lg={10} md={11} sm={12}>
              <Card className="shadow-lg border-0 vision-card">
                {/* Top Gradient Bar */}
                <div
                  className="vision-card-top"
                  style={{
                    height: "5px",
                    background:
                      "linear-gradient(90deg, #1a5f7a, #2a7f9a, #4a9eff)",
                    borderRadius: "24px 24px 0 0",
                    transition: "height 0.4s ease",
                  }}
                ></div>

                <Card.Body className="p-4 p-md-5 p-lg-5 text-center">
                  <div className="vision-icon-wrapper mb-3 mb-md-4">
                    <div
                      className="rounded-circle d-inline-flex align-items-center justify-content-center p-3"
                      style={{
                        background:
                          "linear-gradient(135deg, #1a5f7a15, #4a9eff15)",
                        width: "clamp(60px, 8vw, 80px)",
                        height: "clamp(60px, 8vw, 80px)",
                        border: "2px solid #1a5f7a",
                        transition: "all 0.4s ease",
                      }}
                    >
                      <FaEye size={32} style={{ color: "#1a5f7a" }} />
                    </div>
                  </div>

                  <div className="vision-quote-icon mb-2 mb-md-3">
                    <FaQuoteLeft
                      size={30}
                      style={{ color: "#1a5f7a", opacity: 0.2 }}
                    />
                  </div>

                  <h2
                    className="fw-bold mb-3"
                    style={{
                      ...arabicFontStyle,
                      color: "#1a5f7a",
                      fontSize: isArabic
                        ? "clamp(1.3rem, 2.5vw, 1.8rem)"
                        : "clamp(1.2rem, 2.2vw, 1.6rem)",
                    }}
                  >
                    {t("ourVision")}
                  </h2>

                  <p
                    className="vision-text"
                    style={{
                      ...arabicFontStyle,
                      fontSize: isArabic
                        ? "clamp(0.95rem, 2vw, 1.15rem)"
                        : "clamp(0.9rem, 1.8vw, 1.1rem)",
                      lineHeight: "2",
                      color: "#2d3436",
                      maxWidth: "800px",
                      margin: "0 auto",
                      fontWeight: "400",
                      padding: "0 4px",
                    }}
                  >
                    {isArabic
                      ? "تسعى مدرسة الفتح الخاصة إلى أن تكون منارة تضيء سماء المعرفة في ربوع مدينة القنيطرة، ولذا فهي حريصة على تكريس مبدأ التعاون والشراكة مابين الأطر التربوية وأولياء الأمور لما فيه مصلحة أطفالنا علماً وأدباً."
                      : "Madrassat Al Fath Private School aspires to be a beacon illuminating the sky of knowledge in the city of Kenitra. Therefore, it is keen to establish a principle of cooperation and partnership between educational staff and parents for the benefit of our children in knowledge and manners."}
                  </p>

                  <div
                    className="vision-divider"
                    style={{
                      width: "60px",
                      height: "3px",
                      background: "linear-gradient(90deg, #1a5f7a, #4a9eff)",
                      margin: "20px auto",
                      borderRadius: "2px",
                      transition: "all 0.4s ease",
                    }}
                  ></div>

                  <div className="vision-signature" style={arabicFontStyle}>
                    <span
                      style={{
                        fontSize: isArabic
                          ? "clamp(0.8rem, 1.8vw, 0.9rem)"
                          : "clamp(0.8rem, 1.8vw, 0.9rem)",
                        color: "#1a5f7a",
                        fontWeight: "600",
                      }}
                    >
                      {isArabic
                        ? "رؤيتنا للمستقبل"
                        : "Our Vision for the Future"}
                    </span>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ===== SECTION 5: WORDS OF ADMINISTRATION ===== */}
      <section className="py-5 leadership-section">
        <Container>
          <div className="text-center mb-4">
            <h2
              className="fw-bold"
              style={{
                color: "#c49a6c",
                ...arabicFontStyle,
                fontSize: isArabic
                  ? "clamp(1.3rem, 2.5vw, 1.8rem)"
                  : "clamp(1.2rem, 2.2vw, 1.6rem)",
              }}
            >
              {isArabic ? "كلمة الإدارة" : "Words of Administration"}
            </h2>
          </div>

          <Row className="justify-content-center">
            <Col lg={10} md={11} sm={12}>
              <Card className="shadow-lg border-0 admin-word-card">
                {/* Top Gradient Bar */}
                <div
                  className="admin-word-card-top"
                  style={{
                    height: "5px",
                    background:
                      "linear-gradient(90deg, #c49a6c, #d4a373, #e8c99e)",
                    borderRadius: "24px 24px 0 0",
                    transition: "height 0.4s ease",
                  }}
                ></div>

                <Card.Body className="p-4 p-md-5 p-lg-5 text-center">
                  <div className="admin-word-icon-wrapper mb-3 mb-md-4">
                    <div
                      className="rounded-circle d-inline-flex align-items-center justify-content-center p-3"
                      style={{
                        background:
                          "linear-gradient(135deg, #c49a6c15, #d4a37315)",
                        width: "clamp(60px, 8vw, 80px)",
                        height: "clamp(60px, 8vw, 80px)",
                        border: "2px solid #c49a6c",
                        transition: "all 0.4s ease",
                      }}
                    >
                      <FaPenFancy size={32} style={{ color: "#c49a6c" }} />
                    </div>
                  </div>

                  <div className="admin-word-quote-icon mb-2 mb-md-3">
                    <FaQuoteLeft
                      size={30}
                      style={{ color: "#c49a6c", opacity: 0.2 }}
                    />
                  </div>

                  <p
                    className="admin-word-text"
                    style={{
                      ...arabicFontStyle,
                      fontSize: isArabic
                        ? "clamp(0.95rem, 2vw, 1.15rem)"
                        : "clamp(0.9rem, 1.8vw, 1.1rem)",
                      lineHeight: "2",
                      color: "#2d3436",
                      maxWidth: "800px",
                      margin: "0 auto",
                      fontWeight: "400",
                      padding: "0 4px",
                    }}
                  >
                    {isArabic
                      ? "في مدرسة الفتح الخاصة، نؤمن بأن التعليم رحلة لصناعة الإنسان قبل بناء المعرفة. لذلك نحرص على توفير بيئة تعليمية ملهمة، تُنمّي حب التعلم، وتغرس القيم الإسلامية النبيلة، وتُعزز الأخلاق الفاضلة وروح المسؤولية، لنُعدَّ جيلاً واثقاً بنفسه، معتزاً بهويته، ومؤهلاً للتميز والإسهام الإيجابي في مجتمعه."
                      : "At Madrassat Al Fath Private School, we believe that every child has the potential to learn, grow, and succeed. Through a caring and inspiring environment, we combine academic excellence with Islamic values and strong character, empowering our students to become confident, responsible, and compassionate individuals who are ready to shape a brighter future."}
                  </p>

                  <div
                    className="admin-word-divider"
                    style={{
                      width: "60px",
                      height: "3px",
                      background: "linear-gradient(90deg, #c49a6c, #d4a373)",
                      margin: "20px auto",
                      borderRadius: "2px",
                      transition: "all 0.4s ease",
                    }}
                  ></div>

                  <div className="admin-word-signature" style={arabicFontStyle}>
                    <span
                      style={{
                        fontSize: isArabic
                          ? "clamp(0.8rem, 1.8vw, 0.9rem)"
                          : "clamp(0.8rem, 1.8vw, 0.9rem)",
                        color: "#c49a6c",
                        fontWeight: "600",
                      }}
                    >
                      {isArabic
                        ? "إدارة مدرسة الفتح الخاصة"
                        : "Madrassat Al Fath Administration"}
                    </span>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ===== SECTION 6: OUR JOURNEY (MILESTONES) ===== */}
      <section className="py-5 milestones-section">
        <Container>
          <div className="text-center mb-5">
            <h2
              className="fw-bold"
              style={{
                color: "#1a5f7a",
                ...arabicFontStyle,
                fontSize: isArabic
                  ? "clamp(1.3rem, 2.5vw, 1.8rem)"
                  : "clamp(1.2rem, 2.2vw, 1.6rem)",
              }}
            >
              {isArabic ? "رحلتنا" : "Our Journey"}
            </h2>
            <p
              className="text-muted fs-5"
              style={{
                ...arabicFontStyle,
                fontSize: isArabic
                  ? "clamp(0.9rem, 1.5vw, 1.1rem)"
                  : "clamp(0.85rem, 1.3vw, 1.05rem)",
              }}
            >
              {isArabic
                ? "منذ 2020 إلى 2026 - مسيرة من التميز والتطوير"
                : "From 2020 to 2026 - A journey of excellence and development"}
            </p>
          </div>

          <div className="milestones-timeline">
            <div className="milestones-line"></div>
            <div className="d-flex flex-wrap justify-content-center gap-4 gap-sm-3 gap-md-4">
              {milestones.map((milestone, index) => (
                <div
                  key={index}
                  className="milestone-item"
                  style={{
                    "--milestone-color": milestone.color,
                    animationDelay: `${index * 0.15}s`,
                  }}
                  onMouseEnter={() => setActiveMilestone(index)}
                  onMouseLeave={() => setActiveMilestone(null)}
                >
                  <div
                    className="milestone-circle"
                    style={{ borderColor: milestone.color }}
                  >
                    <div
                      className="milestone-icon"
                      style={{ color: milestone.color }}
                    >
                      {milestone.icon}
                    </div>
                  </div>
                  <div
                    className="milestone-year"
                    style={{
                      color: milestone.color,
                      fontFamily: "inherit",
                    }}
                  >
                    {milestone.year}
                  </div>
                  <h6 className="milestone-title" style={arabicFontStyle}>
                    {milestone.title}
                  </h6>
                  <p className="milestone-description" style={arabicFontStyle}>
                    {milestone.description}
                  </p>

                  {/* Hover Detail Popup */}
                  {activeMilestone === index && (
                    <div className="milestone-detail-popup">
                      <FaPlayCircle className="me-1" />
                      <span style={arabicFontStyle}>{milestone.details}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@100..900&family=Vazirmatn:wght@100..900&display=swap');

        @keyframes floatBubble {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-10px, -15px) scale(1.1); }
        }

        @keyframes fadeInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* ===== STAT CARDS ===== */
        .stat-card-gradient {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: default;
          animation: fadeInUp 0.6s ease forwards;
        }

        .stat-card-gradient .stat-icon-wrapper {
          transition: transform 0.4s ease;
        }
        .stat-card-gradient:hover .stat-icon-wrapper {
          transform: scale(1.15) rotate(-5deg);
        }

        .stat-card-gradient .stat-top-bar {
          transition: all 0.4s ease;
        }
        .stat-card-gradient:hover .stat-top-bar {
          height: 6px;
          background: rgba(255,255,255,0.5);
        }

        /* ===== VALUE CARDS ===== */
        .value-card {
          transition: all 0.3s ease;
          border-radius: 16px;
        }
        .value-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 10px 40px rgba(0,0,0,0.1) !important;
        }
        .value-card:hover .value-icon {
          transform: scale(1.1);
        }
        .value-icon {
          transition: transform 0.3s ease;
        }

        /* ===== MISSION CARD ===== */
        .mission-section {
          background: linear-gradient(180deg, #ffffff 0%, #f0faf0 100%);
        }

        .mission-card-enhanced {
          border-radius: 24px !important;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          background: white;
          border: none !important;
        }
        .mission-card-enhanced:hover {
          transform: translateY(-8px);
          box-shadow: 0 25px 70px rgba(45, 106, 79, 0.15) !important;
        }
        .mission-card-enhanced:hover .mission-card-top {
          height: 7px;
        }
        .mission-card-enhanced:hover .mission-icon-wrapper .rounded-circle {
          transform: scale(1.08) rotate(-5deg);
          box-shadow: 0 8px 30px rgba(45, 106, 79, 0.15);
        }
        .mission-card-enhanced:hover .mission-divider {
          width: 80px;
        }
        .mission-card-enhanced:hover .mission-signature span {
          color: #52b788 !important;
        }

        .mission-icon-wrapper .rounded-circle {
          transition: all 0.4s ease;
        }
        .mission-text {
          transition: all 0.3s ease;
        }
        .mission-card-enhanced:hover .mission-text {
          color: #1a1a2e;
        }
        .mission-quote-icon {
          transition: all 0.3s ease;
        }
        .mission-divider {
          transition: all 0.4s ease;
        }
        .mission-signature {
          transition: all 0.3s ease;
        }

        /* ===== VISION CARD ===== */
        .vision-section {
          background: linear-gradient(180deg, #f0faf0 0%, #f0f4ff 100%);
        }

        .vision-card {
          border-radius: 24px !important;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          background: white;
          border: none !important;
        }
        .vision-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 25px 70px rgba(26, 95, 122, 0.15) !important;
        }
        .vision-card:hover .vision-card-top {
          height: 7px;
        }
        .vision-card:hover .vision-icon-wrapper .rounded-circle {
          transform: scale(1.08) rotate(-5deg);
          box-shadow: 0 8px 30px rgba(26, 95, 122, 0.15);
        }
        .vision-card:hover .vision-divider {
          width: 80px;
        }
        .vision-card:hover .vision-signature span {
          color: #4a9eff !important;
        }

        .vision-icon-wrapper .rounded-circle {
          transition: all 0.4s ease;
        }
        .vision-text {
          transition: all 0.3s ease;
        }
        .vision-card:hover .vision-text {
          color: #1a1a2e;
        }
        .vision-quote-icon {
          transition: all 0.3s ease;
        }
        .vision-divider {
          transition: all 0.4s ease;
        }
        .vision-signature {
          transition: all 0.3s ease;
        }

        /* ===== WORDS OF ADMINISTRATION CARD ===== */
        .leadership-section {
          background: linear-gradient(180deg, #f0f4ff 0%, #fef9f0 100%);
        }

        .admin-word-card {
          border-radius: 24px !important;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          background: white;
          border: none !important;
        }
        .admin-word-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 25px 70px rgba(196, 154, 108, 0.15) !important;
        }
        .admin-word-card:hover .admin-word-card-top {
          height: 7px;
        }
        .admin-word-card:hover .admin-word-icon-wrapper .rounded-circle {
          transform: scale(1.08) rotate(-5deg);
          box-shadow: 0 8px 30px rgba(196, 154, 108, 0.15);
        }
        .admin-word-card:hover .admin-word-divider {
          width: 80px;
        }
        .admin-word-card:hover .admin-word-signature span {
          color: #d4a373 !important;
        }

        .admin-word-icon-wrapper .rounded-circle {
          transition: all 0.4s ease;
        }
        .admin-word-text {
          transition: all 0.3s ease;
        }
        .admin-word-card:hover .admin-word-text {
          color: #1a1a2e;
        }
        .admin-word-quote-icon {
          transition: all 0.3s ease;
        }
        .admin-word-divider {
          transition: all 0.4s ease;
        }
        .admin-word-signature {
          transition: all 0.3s ease;
        }

        /* ===== MILESTONES ===== */
        .milestones-section {
          background: linear-gradient(180deg, #fef9f0 0%, #ffffff 100%);
        }

        .milestones-timeline {
          position: relative;
          padding: 20px 0;
        }

        .milestones-line {
          position: absolute;
          top: 45px;
          left: 5%;
          right: 5%;
          height: 4px;
          background: linear-gradient(90deg, #1a5f7a, #2d6a4f, #c49a6c, #d4a373, #6c757d, #1a5f7a, #c49a6c);
          border-radius: 4px;
          opacity: 0.3;
        }

        .milestone-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 100px;
          max-width: 140px;
          position: relative;
          z-index: 2;
          animation: fadeInUp 0.6s ease forwards;
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: default;
        }

        .milestone-item:hover {
          transform: translateY(-12px) scale(1.05);
        }

        .milestone-item:hover .milestone-circle {
          transform: scale(1.15);
          box-shadow: 0 0 30px var(--milestone-color, #1a5f7a)40;
        }

        .milestone-item:hover .milestone-year {
          transform: scale(1.1);
        }

        .milestone-item:hover .milestone-title {
          color: var(--milestone-color, #1a5f7a);
        }

        .milestone-circle {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          background: white;
          border: 4px solid var(--milestone-color, #1a5f7a);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          margin-bottom: 10px;
        }

        .milestone-icon {
          font-size: 1.5rem;
          transition: all 0.4s ease;
        }

        .milestone-item:hover .milestone-icon {
          transform: scale(1.2) rotate(-10deg);
        }

        .milestone-year {
          font-size: 0.85rem;
          font-weight: 700;
          transition: all 0.3s ease;
          margin-bottom: 4px;
        }

        .milestone-title {
          font-size: 0.75rem;
          font-weight: 600;
          color: #1a1a2e;
          text-align: center;
          margin-bottom: 2px;
          transition: all 0.3s ease;
        }

        .milestone-description {
          font-size: 0.6rem;
          color: #6c757d;
          text-align: center;
          margin-bottom: 0;
          line-height: 1.3;
          max-width: 120px;
        }

        .milestone-detail-popup {
          position: absolute;
          bottom: -70px;
          left: 50%;
          transform: translateX(-50%);
          background: #1a1a2e;
          color: white;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 0.65rem;
          white-space: nowrap;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          box-shadow: 0 8px 25px rgba(0,0,0,0.2);
          opacity: 0;
          transition: all 0.3s ease;
          z-index: 10;
          pointer-events: none;
        }

        .milestone-item:hover .milestone-detail-popup {
          opacity: 1;
          bottom: -80px;
        }

        .milestone-detail-popup::before {
          content: '';
          position: absolute;
          top: -6px;
          left: 50%;
          transform: translateX(-50%);
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-bottom: 6px solid #1a1a2e;
        }

        .dashboard-wrapper.rtl .stat-card-gradient {
          text-align: right;
        }
        .dashboard-wrapper.rtl .value-card {
          text-align: right;
        }
        .dashboard-wrapper.rtl .mission-card-enhanced {
          text-align: right;
        }
        .dashboard-wrapper.rtl .vision-card {
          text-align: right;
        }
        .dashboard-wrapper.rtl .admin-word-card {
          text-align: right;
        }

        /* ===== RESPONSIVE STYLES ===== */
        @media (max-width: 991px) {
          .vision-card .p-lg-5,
          .mission-card-enhanced .p-lg-5,
          .admin-word-card .p-lg-5 {
            padding: 32px !important;
          }
        }

        @media (max-width: 768px) {
          .stat-card-gradient { 
            padding: 16px !important; 
            min-height: 160px !important;
          }
          .stat-card-gradient .fw-bold {
            font-size: 2.2rem !important;
          }
          .stat-card-gradient .stat-icon-wrapper {
            width: 50px !important;
            height: 50px !important;
            font-size: 1.5rem !important;
          }
          .stat-card-gradient p {
            font-size: 0.9rem !important;
          }

          .vision-card .p-md-5,
          .mission-card-enhanced .p-md-5,
          .admin-word-card .p-md-5 {
            padding: 24px !important;
          }
          .vision-text,
          .mission-text,
          .admin-word-text {
            font-size: 0.95rem !important;
            line-height: 1.9 !important;
          }
          .vision-icon-wrapper .rounded-circle,
          .mission-icon-wrapper .rounded-circle,
          .admin-word-icon-wrapper .rounded-circle {
            width: 55px !important;
            height: 55px !important;
          }

          .milestones-line {
            display: none;
          }
          .milestone-item {
            min-width: 80px;
            max-width: 110px;
          }
          .milestone-circle {
            width: 55px;
            height: 55px;
          }
          .milestone-icon {
            font-size: 1.2rem;
          }
          .milestone-year {
            font-size: 0.75rem;
          }
          .milestone-title {
            font-size: 0.65rem;
          }
          .milestone-description {
            font-size: 0.55rem;
          }
          .milestone-detail-popup {
            display: none;
          }
        }

        @media (max-width: 576px) {
          .stat-card-gradient { 
            padding: 14px !important; 
            min-height: 130px !important;
            border-radius: 16px !important;
          }
          .stat-card-gradient .fw-bold {
            font-size: 1.6rem !important;
          }
          .stat-card-gradient .stat-icon-wrapper {
            width: 38px !important;
            height: 38px !important;
            font-size: 1.1rem !important;
            margin-bottom: 6px !important;
          }
          .stat-card-gradient p {
            font-size: 0.7rem !important;
          }
          .stat-deco-1, .stat-deco-2 {
            display: none !important;
          }

          .vision-card,
          .mission-card-enhanced,
          .admin-word-card {
            border-radius: 16px !important;
          }
          .vision-card .p-4,
          .mission-card-enhanced .p-4,
          .admin-word-card .p-4 {
            padding: 16px !important;
          }
          .vision-text,
          .mission-text,
          .admin-word-text {
            font-size: 0.85rem !important;
            line-height: 1.8 !important;
          }
          .vision-icon-wrapper .rounded-circle,
          .mission-icon-wrapper .rounded-circle,
          .admin-word-icon-wrapper .rounded-circle {
            width: 50px !important;
            height: 50px !important;
          }
          .vision-quote-icon svg,
          .mission-quote-icon svg,
          .admin-word-quote-icon svg {
            font-size: 20px !important;
          }
          .vision-divider,
          .mission-divider,
          .admin-word-divider {
            width: 40px !important;
            margin: 14px auto !important;
          }
          .vision-signature span,
          .mission-signature span,
          .admin-word-signature span {
            font-size: 0.75rem !important;
          }

          .value-card .p-4 {
            padding: 12px !important;
          }
          .value-card .value-icon {
            font-size: 2rem !important;
          }
          .value-card h5 {
            font-size: 0.85rem !important;
          }
          .value-card p {
            font-size: 0.7rem !important;
          }

          .milestones-timeline .d-flex {
            gap: 0.75rem !important;
          }
          .milestone-item {
            min-width: 60px;
            max-width: 80px;
          }
          .milestone-circle {
            width: 40px;
            height: 40px;
          }
          .milestone-icon {
            font-size: 0.9rem;
          }
          .milestone-year {
            font-size: 0.6rem;
          }
          .milestone-title {
            font-size: 0.55rem;
          }
          .milestone-description {
            font-size: 0.5rem;
          }
        }

        @media (max-width: 400px) {
          .stat-card-gradient { 
            padding: 10px !important; 
            min-height: 110px !important;
            border-radius: 12px !important;
          }
          .stat-card-gradient .fw-bold {
            font-size: 1.3rem !important;
          }
          .stat-card-gradient .stat-icon-wrapper {
            width: 32px !important;
            height: 32px !important;
            font-size: 0.9rem !important;
            margin-bottom: 4px !important;
          }
          .stat-card-gradient p {
            font-size: 0.6rem !important;
          }

          .vision-card .p-4,
          .mission-card-enhanced .p-4,
          .admin-word-card .p-4 {
            padding: 12px !important;
          }
          .vision-text,
          .mission-text,
          .admin-word-text {
            font-size: 0.75rem !important;
            line-height: 1.7 !important;
          }
          .vision-icon-wrapper .rounded-circle,
          .mission-icon-wrapper .rounded-circle,
          .admin-word-icon-wrapper .rounded-circle {
            width: 40px !important;
            height: 40px !important;
          }
          .vision-quote-icon svg,
          .mission-quote-icon svg,
          .admin-word-quote-icon svg {
            font-size: 16px !important;
          }
          .vision-divider,
          .mission-divider,
          .admin-word-divider {
            width: 30px !important;
            margin: 10px auto !important;
          }
          .vision-signature span,
          .mission-signature span,
          .admin-word-signature span {
            font-size: 0.65rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default About;
