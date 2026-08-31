// src/components/layout/Footer.jsx
import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaYoutube, FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { getTranslation } from '../../utils/translations';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { isArabic } = useLanguage();
  const headerColor = '#031c2f';

  return (
    <footer className="footer-main" style={{ background: headerColor }}>
      <Container>
        <Row className="g-4 py-5">
          {/* Column 1 - School Info */}
          <Col md={4} className="text-center">
            <h5 className="text-white mb-3" style={{ color: '#d4a373' }}>
              {isArabic ? 'مدرسة الفتح الخاصة' : 'Madrassat Al Fath Al Kaasat'}
            </h5>
            <p className="text-white-50">
              {isArabic ? 'نرتقي بالعلم والإيمان' : 'Nurturing Young Minds with Islamic Values'}
            </p>
            {/* Social Icons - Centered */}
            <div className="d-flex gap-3 justify-content-center social-icons-wrapper">
              <a 
                href="#" 
                className="social-icon"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.7)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  textDecoration: 'none',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#d4a373';
                  e.currentTarget.style.color = '#031c2f';
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(212, 163, 115, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <FaFacebook size={16} />
              </a>
              <a 
                href="#" 
                className="social-icon"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.7)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  textDecoration: 'none',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#d4a373';
                  e.currentTarget.style.color = '#031c2f';
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(212, 163, 115, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <FaTwitter size={16} />
              </a>
              <a 
                href="#" 
                className="social-icon"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.7)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  textDecoration: 'none',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#d4a373';
                  e.currentTarget.style.color = '#031c2f';
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(212, 163, 115, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <FaInstagram size={16} />
              </a>
              <a 
                href="#" 
                className="social-icon"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.7)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  textDecoration: 'none',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#d4a373';
                  e.currentTarget.style.color = '#031c2f';
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(212, 163, 115, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <FaYoutube size={16} />
              </a>
            </div>
          </Col>

          {/* Column 2 - Quick Links - Centered */}
          <Col md={4} className="text-center quick-links-column">
            <h5 className="text-white mb-3" style={{ color: '#d4a373' }}>
              {isArabic ? 'روابط سريعة' : 'Quick Links'}
            </h5>
            <ul className="list-unstyled quick-links-list">
              <li className="mb-2">
                <Link to="/about" className="text-white-50 text-decoration-none quick-link" style={{ transition: 'color 0.3s ease' }}>
                  {isArabic ? 'عن المدرسة' : 'About Us'}
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/academics" className="text-white-50 text-decoration-none quick-link" style={{ transition: 'color 0.3s ease' }}>
                  {isArabic ? 'المناهج' : 'Academics'}
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/admissions" className="text-white-50 text-decoration-none quick-link" style={{ transition: 'color 0.3s ease' }}>
                  {isArabic ? 'التسجيل' : 'Admissions'}
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/contact" className="text-white-50 text-decoration-none quick-link" style={{ transition: 'color 0.3s ease' }}>
                  {isArabic ? 'اتصل بنا' : 'Contact'}
                </Link>
              </li>
            </ul>
          </Col>

          {/* Column 3 - Contact Info - Centered */}
          <Col md={4} className="text-center contact-info-column">
            <h5 className="text-white mb-3" style={{ color: '#d4a373' }}>
              {isArabic ? 'معلومات الاتصال' : 'Contact Info'}
            </h5>
            <ul className="list-unstyled contact-info-list">
              <li className="mb-2 text-white-50 d-flex align-items-center justify-content-center contact-item">
                <FaMapMarkerAlt className="me-2" style={{ color: '#d4a373', flexShrink: 0 }} /> 
                {isArabic ? 'المغرب العربي ب٣ أولاد اوجيه، القنيطرة' : 'Maghrib El Arabi B3 Oulad Oujih, Kenitra'}
              </li>
              <li className="mb-2 text-white-50 d-flex align-items-center justify-content-center contact-item">
                <FaPhone className="me-2" style={{ color: '#d4a373', flexShrink: 0 }} /> +212537350200
              </li>
              <li className="mb-2 text-white-50 d-flex align-items-center justify-content-center contact-item">
                <FaEnvelope className="me-2" style={{ color: '#d4a373', flexShrink: 0 }} /> madrassatelfath@gmail.com
              </li>
            </ul>
          </Col>
        </Row>
        <hr className="border-light opacity-25" />
        <p className="text-center text-white-50 mb-0 pb-3 copyright-text">
          © {currentYear} {isArabic ? 'مدرسة الفتح الخاصة. جميع الحقوق محفوظة.' : 'Madrassat Al Fath Al Kaasat. All rights reserved.'}
        </p>
      </Container>

      <style>{`
        .footer-main {
          margin-top: auto;
        }

        /* Social Icons */
        .social-icons-wrapper {
          margin-top: 4px;
        }

        .social-icon {
          transition: all 0.3s ease;
        }

        .social-icon:hover {
          background: #d4a373 !important;
          color: #031c2f !important;
          transform: translateY(-3px) !important;
          box-shadow: 0 4px 15px rgba(212, 163, 115, 0.3) !important;
        }

        /* Quick Links */
        .quick-links-column {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .quick-links-list {
          padding: 0;
          margin: 0;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .quick-links-list li {
          list-style: none;
          width: 100%;
          text-align: center;
        }

        .quick-link {
          display: inline-block;
          transition: color 0.3s ease;
          padding: 2px 0;
        }

        .quick-link:hover {
          color: #d4a373 !important;
        }

        /* Contact Info */
        .contact-info-column {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .contact-info-list {
          padding: 0;
          margin: 0;
          width: 100%;
        }

        .contact-item {
          width: 100%;
          justify-content: center !important;
          text-align: center;
          word-break: break-word;
        }

        .contact-item .me-2 {
          flex-shrink: 0;
        }

        /* RTL specific */
        .dashboard-wrapper.rtl .contact-item .me-2 {
          margin-right: 0 !important;
          margin-left: 0.5rem !important;
        }

        .dashboard-wrapper.rtl .social-icons-wrapper {
          flex-direction: row-reverse;
        }

        /* Copyright */
        .copyright-text {
          font-size: 0.85rem;
        }

        @media (max-width: 768px) {
          .footer-main .py-5 {
            padding-top: 30px !important;
            padding-bottom: 30px !important;
          }
          .footer-main .g-4 {
            gap: 24px !important;
          }
          .footer-main h5 {
            font-size: 1rem !important;
          }
          .footer-main .text-white-50 {
            font-size: 0.85rem !important;
          }
          .social-icon {
            width: 34px !important;
            height: 34px !important;
          }
          .social-icon svg {
            font-size: 14px !important;
          }
          .copyright-text {
            font-size: 0.75rem !important;
          }
          .quick-links-list li {
            width: 100%;
          }
          .contact-item {
            font-size: 0.8rem !important;
          }
        }

        @media (max-width: 576px) {
          .footer-main .py-5 {
            padding-top: 20px !important;
            padding-bottom: 20px !important;
          }
          .footer-main h5 {
            font-size: 0.9rem !important;
          }
          .footer-main .text-white-50 {
            font-size: 0.75rem !important;
          }
          .social-icon {
            width: 30px !important;
            height: 30px !important;
          }
          .social-icon svg {
            font-size: 12px !important;
          }
          .social-icons-wrapper {
            gap: 8px !important;
          }
          .copyright-text {
            font-size: 0.65rem !important;
          }
          .quick-links-list li {
            width: 100%;
          }
          .contact-item {
            font-size: 0.7rem !important;
            flex-wrap: wrap !important;
            justify-content: center !important;
          }
          .contact-item .me-2 {
            margin-right: 4px !important;
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer;