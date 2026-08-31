// src/components/layout/NavbarComponent.jsx
import React, { useState } from 'react';
import { Navbar, Nav, Container, NavDropdown, Button } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaUser, FaSchool, FaBars, FaBell, FaSignOutAlt, FaGlobe, FaLanguage } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import { getInitials } from '../../utils/helpers';
import logo from "../../assets/images/school logo.jpeg";

const NavbarComponent = () => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const { language, toggleLanguage, isArabic } = useLanguage();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const headerColor = '#031c2f';

  const isActive = (path) => {
    return location.pathname === path;
  };

  const menuItems = [
    { path: '/', label: isArabic ? 'الرئيسية' : 'Home' },
    { path: '/about', label: isArabic ? 'عن المدرسة' : 'About' },
    { path: '/academics', label: isArabic ? 'المناهج' : 'Academics' },
    { path: '/admissions', label: isArabic ? 'التسجيل' : 'Admissions' },
    { path: '/news', label: isArabic ? 'الأخبار' : 'News' },
    { path: '/contact', label: isArabic ? 'اتصل بنا' : 'Contact' },
  ];

  const logoExists = logo && typeof logo === 'string' && logo.length > 0;

  // Arabic font style for the navbar
  const arabicFontStyle = {
    fontFamily: isArabic ? '"Noto Sans Arabic", "Vazirmatn", "Traditional Arabic", "Arabic Typesetting", serif' : 'inherit',
    lineHeight: isArabic ? '1.6' : '1.5',
    letterSpacing: isArabic ? '0.3px' : '0px',
  };

  // Modern Translation Icon Component (without EN badge)
  const SimpleTranslationIcon = ({ size = 20 }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 12H21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 3C14.5 6 16 9 16 12C16 15 14.5 18 12 21C9.5 18 8 15 8 12C8 9 9.5 6 12 3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 15L19 18M19 18L22 15M19 18V13"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 9L5 6M5 6L2 9M5 6V11"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x="7"
        y="13.5"
        fontSize="5.5"
        fontWeight="bold"
        fill="currentColor"
        fontFamily="Arial, sans-serif"
      >
        A
      </text>
      <text
        x="13"
        y="13.5"
        fontSize="5.5"
        fontWeight="bold"
        fill="currentColor"
        fontFamily="Arial, sans-serif"
      >
        أ
      </text>
    </svg>
  );

  return (
    <Navbar
      expand="lg"
      expanded={expanded}
      className="shadow-sm"
      sticky="top"
      style={{
        background: headerColor,
        paddingTop: '8px',
        paddingBottom: '8px',
        minHeight: '65px',
      }}
    >
      <Container>
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center" onClick={() => setExpanded(false)}>
          {logoExists ? (
            <img
              src={logo}
              alt="Madrasatul Fathi Logo"
              style={{
                width: "65px",
                height: "65px",
                objectFit: "cover",
                borderRadius: "50%",
                backgroundColor: "#d4a373",
                padding: "2px",
                marginRight: isArabic ? "0px" : "10px",
                marginLeft: isArabic ? "10px" : "0px",
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                const parent = e.target.parentElement;
                const fallbackDiv = document.createElement('div');
                fallbackDiv.style.cssText = `
                  width: 45px;
                  height: 45px;
                  border-radius: 50%;
                  background-color: #d4a373;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: #031c2f;
                  font-weight: bold;
                  font-size: 1.2rem;
                  margin-right: ${isArabic ? '0px' : '10px'};
                  margin-left: ${isArabic ? '10px' : '0px'};
                `;
                fallbackDiv.textContent = 'م';
                parent.insertBefore(fallbackDiv, e.target);
                e.target.remove();
              }}
            />
          ) : (
            <div
              style={{
                width: "45px",
                height: "45px",
                borderRadius: "50%",
                backgroundColor: "#d4a373",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: headerColor,
                fontWeight: "bold",
                fontSize: "1.1rem",
                marginRight: isArabic ? "0px" : "10px",
                marginLeft: isArabic ? "10px" : "0px",
              }}
            >
              <FaSchool size={22} />
            </div>
          )}
          <div>
            <span className="fw-bold text-white" style={{ 
              fontSize: '1.2rem',
              ...arabicFontStyle
            }}>
              {isArabic ? 'مدرسة الفتح' : 'Madrassat Al Fath'}
            </span>
            <span
              className="d-block"
              style={{
                fontSize: '0.75rem',
                color: '#ffffff',
                opacity: 0.85,
                lineHeight: '1.2',
                fontWeight: '500',
                letterSpacing: '0.3px',
                ...arabicFontStyle
              }}
            >
              {isArabic ? 'الخاصة' : 'Private'}
            </span>
            <small
              className="d-block"
              style={{
                fontSize: '1.1rem',
                color: '#ffffff',
                opacity: 0.85,
                lineHeight: '1.2',
                fontWeight: '500',
                letterSpacing: '0.3px',
                ...arabicFontStyle
              }}
            >
              {isArabic ? 'أولي • ابتدائي • إعدادي • ثانوي' : 'Kindergarten • Primary • Secondary • High School'}
            </small>
          </div>
        </Navbar.Brand>

        {/* Right side controls - Language and Toggle */}
        <div className="d-flex align-items-center" style={{ gap: '8px' }}>
          <Button
            variant="outline-light"
            className="rounded-circle p-2 language-toggle-btn"
            style={{
              width: '44px',
              height: '44px',
              borderColor: '#d4a373',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              transition: 'all 0.3s ease',
              minWidth: '44px',
              position: 'relative',
              overflow: 'hidden',
            }}
            onClick={toggleLanguage}
            title={isArabic ? 'Switch to English' : 'تحويل إلى العربية'}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(212, 163, 115, 0.3)';
              e.currentTarget.style.borderColor = '#d4a373';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = '#d4a373';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <SimpleTranslationIcon size={20} />
          </Button>
          
          <Navbar.Toggle onClick={() => setExpanded(!expanded)} style={{ borderColor: 'rgba(255,255,255,0.3)', padding: '4px 8px' }}>
            <FaBars color="white" size={18} />
          </Navbar.Toggle>
        </div>

        <Navbar.Collapse id="main-navbar">
          <Nav className="ms-auto align-items-lg-center">
            {menuItems.map((item) => (
              <Nav.Link
                key={item.path}
                as={Link}
                to={item.path}
                onClick={() => setExpanded(false)}
                style={{
                  color: isActive(item.path) ? '#d4a373' : 'rgba(255,255,255,0.85)',
                  fontWeight: isActive(item.path) ? '600' : '400',
                  borderBottom: isActive(item.path) ? '2px solid #d4a373' : '2px solid transparent',
                  padding: '6px 20px',
                  margin: '0 7px',
                  transition: 'all 0.3s ease',
                  borderRadius: '4px 4px 0 0',
                  fontSize: '1.1em',
                  ...arabicFontStyle,
                }}
                onMouseEnter={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.color = '#d4a373';
                    e.currentTarget.style.backgroundColor = 'rgba(212, 163, 115, 0.1)';
                    e.currentTarget.style.borderBottom = '2px solid rgba(212, 163, 115, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderBottom = '2px solid transparent';
                  }
                }}
              >
                {item.label}
              </Nav.Link>
            ))}

            <div className="mobile-separator d-lg-none"></div>

            {isAuthenticated ? (
              <>
                <Nav.Link as={Link} to="/dashboard" className="position-relative" onClick={() => setExpanded(false)} style={{ color: 'rgba(255,255,255,0.85)', padding: '6px 10px' }}>
                  <FaBell size={18} />
                </Nav.Link>
                <NavDropdown
                  title={
                    <span className="d-flex align-items-center">
                      <span className="bg-white text-primary rounded-circle d-inline-flex align-items-center justify-content-center me-1"
                        style={{ width: '30px', height: '30px', fontSize: '0.75rem', fontWeight: '600', color: headerColor }}>
                        {getInitials(user?.name)}
                      </span>
                      <span className="d-none d-md-inline text-white" style={{ 
                        fontSize: '0.85rem',
                        ...arabicFontStyle
                      }}>{user?.name}</span>
                    </span>
                  }
                  align="end"
                >
                  <NavDropdown.Item as={Link} to="/dashboard" onClick={() => setExpanded(false)} style={arabicFontStyle}>
                    {isArabic ? 'لوحة التحكم' : 'Dashboard'}
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/profile" onClick={() => setExpanded(false)} style={arabicFontStyle}>
                    {isArabic ? 'الملف الشخصي' : 'Profile'}
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout} style={arabicFontStyle}>
                    <FaSignOutAlt className="me-2" /> {isArabic ? 'تسجيل خروج' : 'Logout'}
                  </NavDropdown.Item>
                </NavDropdown>
              </>
            ) : (
              <div className="d-flex gap-2 align-items-center mobile-auth-buttons">
                <Button
                  variant="outline-light"
                  as={Link}
                  to="/login"
                  className="px-3"
                  onClick={() => setExpanded(false)}
                  style={{
                    borderRadius: '50px',
                    borderColor: '#d4a373',
                    color: 'white',
                    transition: 'all 0.3s ease',
                    fontSize: '0.8rem',
                    paddingTop: '4px',
                    paddingBottom: '4px',
                    flex: 1,
                    ...arabicFontStyle,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(212, 163, 115, 0.2)';
                    e.currentTarget.style.borderColor = '#d4a373';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = '#d4a373';
                  }}
                >
                  {isArabic ? 'تسجيل دخول' : 'Login'}
                </Button>
                
                {/* Register button removed - parents register through admissions page */}
                
                <Button
                  variant="outline-light"
                  className="rounded-circle p-2 desktop-language-btn"
                  style={{
                    width: '44px',
                    height: '44px',
                    borderColor: '#d4a373',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    transition: 'all 0.3s ease',
                    minWidth: '44px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onClick={toggleLanguage}
                  title={isArabic ? 'Switch to English' : 'تحويل إلى العربية'}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(212, 163, 115, 0.3)';
                    e.currentTarget.style.borderColor = '#d4a373';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = '#d4a373';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <SimpleTranslationIcon size={20} />
                </Button>
              </div>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>

      <style>{`
        /* Import Arabic Fonts */
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@100..900&family=Vazirmatn:wght@100..900&display=swap');

        .mobile-separator {
          width: 80%;
          height: 1px;
          background: rgba(255,255,255,0.15);
          margin: 8px auto;
        }

        .mobile-auth-buttons {
          width: 100%;
          padding: 4px 0;
          gap: 10px !important;
        }

        .mobile-auth-buttons .btn {
          flex: 1;
          min-width: 100px;
        }

        .desktop-language-btn {
          display: none !important;
        }

        .language-toggle-btn {
          display: flex !important;
        }

        @media (min-width: 992px) {
          .mobile-separator {
            display: none !important;
          }
          .mobile-auth-buttons {
            width: auto !important;
            padding: 0 !important;
          }
          .mobile-auth-buttons .btn {
            flex: none !important;
            min-width: auto !important;
          }
          
          .desktop-language-btn {
            display: flex !important;
          }
          
          .language-toggle-btn {
            display: none !important;
          }
        }

        @media (max-width: 991px) {
          .navbar-collapse {
            padding: 12px 0 8px;
            border-top: 1px solid rgba(255,255,255,0.08);
            margin-top: 8px;
          }
          
          .navbar-nav {
            gap: 2px;
            width: 100%;
          }
          
          .navbar-nav .nav-link {
            padding: 8px 16px !important;
            margin: 0 !important;
            border-radius: 8px !important;
            border-bottom: none !important;
            text-align: ${isArabic ? 'right' : 'left'};
            font-size: 0.9rem !important;
          }
          
          .navbar-nav .nav-link:hover {
            background: rgba(212, 163, 115, 0.1) !important;
            border-bottom: none !important;
          }
          
          .navbar-nav .nav-link.active {
            background: rgba(212, 163, 115, 0.15) !important;
            border-bottom: none !important;
            color: #d4a373 !important;
          }
          
          .mobile-auth-buttons {
            margin-top: 4px;
            padding: 8px 0 4px;
            border-top: 1px solid rgba(255,255,255,0.08);
          }
          
          .mobile-auth-buttons .btn {
            padding: 6px 16px !important;
            font-size: 0.85rem !important;
          }
          
          .navbar-nav .nav-link .fa-bell {
            padding: 4px 8px;
          }
          
          .nav-dropdown .dropdown-menu {
            background: rgba(3, 28, 47, 0.95) !important;
            backdrop-filter: blur(10px);
          }

          .language-toggle-btn {
            display: flex !important;
            margin-right: 4px;
          }
        }

        @media (max-width: 576px) {
          .navbar-brand .fw-bold {
            font-size: 0.95rem !important;
          }
          .navbar-brand .d-block {
            font-size: 0.6rem !important;
          }
          .navbar-brand small {
            font-size: 0.6rem !important;
          }
          .navbar-brand img {
            width: 40px !important;
            height: 40px !important;
          }
          .navbar-nav .nav-link {
            font-size: 0.85rem !important;
            padding: 6px 14px !important;
          }
          .mobile-auth-buttons .btn {
            font-size: 0.75rem !important;
            padding: 4px 12px !important;
          }
          .language-toggle-btn {
            width: 38px !important;
            height: 38px !important;
            min-width: 38px !important;
          }
          .language-toggle-btn svg {
            width: 17px !important;
            height: 17px !important;
          }
          .desktop-language-btn {
            width: 38px !important;
            height: 38px !important;
            min-width: 38px !important;
          }
          .desktop-language-btn svg {
            width: 17px !important;
            height: 17px !important;
          }
          .navbar-toggler {
            padding: 2px 6px !important;
          }
          .navbar-toggler svg {
            font-size: 14px !important;
          }
          .d-flex.align-items-center {
            gap: 4px !important;
          }
        }

        @media (max-width: 400px) {
          .navbar-brand .fw-bold {
            font-size: 0.85rem !important;
          }
          .navbar-brand .d-block {
            font-size: 0.55rem !important;
          }
          .navbar-brand small {
            font-size: 0.55rem !important;
          }
          .navbar-brand img {
            width: 35px !important;
            height: 35px !important;
          }
          .mobile-auth-buttons .btn {
            font-size: 0.65rem !important;
            padding: 3px 8px !important;
            min-width: 60px !important;
          }
          .language-toggle-btn {
            width: 34px !important;
            height: 34px !important;
            min-width: 34px !important;
          }
          .language-toggle-btn svg {
            width: 15px !important;
            height: 15px !important;
          }
          .desktop-language-btn {
            width: 34px !important;
            height: 34px !important;
            min-width: 34px !important;
          }
          .desktop-language-btn svg {
            width: 15px !important;
            height: 15px !important;
          }
        }

        .language-toggle-btn:hover,
        .desktop-language-btn:hover {
          animation: pulse 1s ease-in-out;
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `}</style>
    </Navbar>
  );
};

export default NavbarComponent;