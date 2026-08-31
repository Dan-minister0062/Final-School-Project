// src/components/public/NewsEvents.jsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Form, InputGroup, Pagination, Modal } from 'react-bootstrap';
import {
  FaCalendarAlt, FaClock, FaUser, FaTag, FaShare, FaHeart,
  FaRegHeart, FaComment, FaEye, FaSearch, FaFilter,
  FaBullhorn, FaCalendarCheck, FaUsers, FaCheckCircle,
  FaImage, FaVideo, FaPlayCircle, FaArrowRight, FaSync,
  FaTimes, FaLink, FaEnvelope, FaWhatsapp, FaTwitter, FaFacebook,
  FaInfoCircle, FaStar, FaTrophy, FaAward, FaGraduationCap,
  FaChalkboardTeacher, FaBookOpen, FaQuran, FaMosque
} from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { getTranslation, getAnnouncementTranslation } from '../../utils/translations';
import { useNotification } from '../../hooks/useNotification';

// ALWAYS use English numbers - NO Arabic numeral conversion
const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  return num.toString();
};

// ===== Helper to get announcements from localStorage =====
const getAnnouncementsFromStorage = () => {
  try {
    const stored = localStorage.getItem('announcements');
    if (stored) {
      const data = JSON.parse(stored);
      return Array.isArray(data) ? data : [];
    }
    return [];
  } catch (error) {
    console.error('Error getting announcements from localStorage:', error);
    return [];
  }
};

// ===== Helper to save announcements to localStorage =====
const saveAnnouncementsToStorage = (announcements) => {
  try {
    localStorage.setItem('announcements', JSON.stringify(announcements));
    return true;
  } catch (error) {
    console.error('Error saving announcements to localStorage:', error);
    return false;
  }
};

const NewsEvents = () => {
  const { language, isArabic } = useLanguage();
  const { notify } = useNotification();

  const [announcements, setAnnouncements] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [likedItems, setLikedItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [showReadMoreModal, setShowReadMoreModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const itemsPerPage = 6;

  // Arabic font style
  const arabicFontStyle = {
    fontFamily: isArabic ? '"Noto Sans Arabic", "Vazirmatn", "Traditional Arabic", serif' : 'inherit',
    lineHeight: isArabic ? '1.8' : '1.6',
    letterSpacing: isArabic ? '0.3px' : '0px',
  };

  // ===== Helper to get translated content =====
  const getTranslatedTitle = (item) => {
    if (!item) return '';
    
    // If there's a translation key, use it
    if (item.translationKey) {
      const translation = getAnnouncementTranslation(item.translationKey, language);
      if (translation.title !== item.translationKey) {
        return translation.title;
      }
    }
    
    // Otherwise use stored bilingual fields
    if (isArabic) {
      return item.titleAr || item.title || '';
    }
    return item.title || '';
  };

  const getTranslatedContent = (item) => {
    if (!item) return '';
    
    // If there's a translation key, use it
    if (item.translationKey) {
      const translation = getAnnouncementTranslation(item.translationKey, language);
      if (translation.content !== item.translationKey) {
        return translation.content;
      }
    }
    
    // Otherwise use stored bilingual fields
    if (isArabic) {
      return item.contentAr || item.content || '';
    }
    return item.content || '';
  };

  const getTranslatedAuthor = (item) => {
    if (!item) return '';
    if (isArabic) {
      return item.authorAr || item.author || (isArabic ? 'المسؤول' : 'Admin');
    }
    return item.author || 'Admin';
  };

  // ===== Load announcements from localStorage =====
  const loadAnnouncements = () => {
    setLoading(true);
    try {
      // Get announcements from localStorage
      const items = getAnnouncementsFromStorage();
      
      // Filter only published announcements
      const publishedItems = items.filter(a => a.status === 'published' && a.isActive !== false);
      
      // Map to display based on current language
      const mappedItems = publishedItems.map(item => ({
        ...item,
        title: getTranslatedTitle(item),
        content: getTranslatedContent(item),
        author: getTranslatedAuthor(item),
        // Keep original fields for reference
        _titleEn: item.title,
        _titleAr: item.titleAr || item.title,
        _contentEn: item.content,
        _contentAr: item.contentAr || item.content,
        _authorEn: item.author || 'Admin',
        _authorAr: item.authorAr || item.author || 'المسؤول',
      }));
      
      // Sort by date (newest first)
      const sortedItems = mappedItems.sort((a, b) => {
        return new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date);
      });
      
      setAnnouncements(sortedItems);
      console.log(`📢 Loaded ${sortedItems.length} announcements (${isArabic ? 'Arabic' : 'English'})`);
    } catch (error) {
      console.error('❌ Error loading announcements:', error);
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  // ===== Force reload =====
  const forceReload = () => {
    console.log('🔄 Force reloading announcements...');
    loadAnnouncements();
    if (notify) {
      notify(
        isArabic ? 'تم تحديث الأخبار بنجاح' : 'News updated successfully',
        'info'
      );
    }
  };

  // ===== Load on mount and listen for changes =====
  useEffect(() => {
    loadAnnouncements();

    // Listen for storage changes (when admin adds/updates announcements)
    const handleStorageChange = (e) => {
      if (e.key === 'announcements') {
        console.log('📦 Storage changed, reloading...');
        loadAnnouncements();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Listen for custom events
    const handleAnnouncementsUpdated = () => {
      console.log('📢 Announcements updated event, reloading...');
      loadAnnouncements();
    };
    window.addEventListener('announcementsUpdated', handleAnnouncementsUpdated);
    window.addEventListener('newNotification', handleAnnouncementsUpdated);

    // Listen for language changes
    const handleLanguageChange = () => {
      console.log('🌐 Language changed, reloading...');
      loadAnnouncements();
    };
    window.addEventListener('languageChange', handleLanguageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('announcementsUpdated', handleAnnouncementsUpdated);
      window.removeEventListener('newNotification', handleAnnouncementsUpdated);
      window.removeEventListener('languageChange', handleLanguageChange);
    };
  }, [isArabic]); // Re-run when language changes

  // ===== Filter items =====
  useEffect(() => {
    let filtered = announcements;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(a => a.type === selectedCategory || a.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        (a.title || '').toLowerCase().includes(query) ||
        (a.content || '').toLowerCase().includes(query) ||
        (a.author || '').toLowerCase().includes(query) ||
        (a._titleAr || '').toLowerCase().includes(query) ||
        (a._contentAr || '').toLowerCase().includes(query)
      );
    }

    setFilteredItems(filtered);
    setCurrentPage(1);
  }, [selectedCategory, searchQuery, announcements]);

  // ===== Handle like =====
  const handleLike = (id) => {
    const isLiked = likedItems[id];
    setLikedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));

    // Update the likes in localStorage
    const allItems = getAnnouncementsFromStorage();
    const updatedItems = allItems.map(a => {
      if (a.id === id) {
        const currentLikes = a.likes || 0;
        const newLikes = isLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;
        return {
          ...a,
          likes: newLikes,
        };
      }
      return a;
    });
    saveAnnouncementsToStorage(updatedItems);

    // Update state
    setAnnouncements(prev => prev.map(a => {
      if (a.id === id) {
        const currentLikes = a.likes || 0;
        const newLikes = isLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;
        return {
          ...a,
          likes: newLikes,
        };
      }
      return a;
    }));
  };

  // ===== Handle Read More =====
  const handleReadMore = (item) => {
    setSelectedItem(item);
    setShowReadMoreModal(true);

    // Increment views in localStorage
    const allItems = getAnnouncementsFromStorage();
    const updatedItems = allItems.map(a => {
      if (a.id === item.id) {
        const currentViews = a.views || 0;
        return {
          ...a,
          views: currentViews + 1,
        };
      }
      return a;
    });
    saveAnnouncementsToStorage(updatedItems);

    // Update state
    setAnnouncements(prev => prev.map(a => {
      if (a.id === item.id) {
        const currentViews = a.views || 0;
        return {
          ...a,
          views: currentViews + 1,
        };
      }
      return a;
    }));
  };

  // ===== Get category icon =====
  const getCategoryIcon = (type) => {
    const icons = {
      announcement: <FaBullhorn />,
      event: <FaCalendarCheck />,
      meeting: <FaUsers />,
      exam: <FaCheckCircle />,
      news: <FaTag />,
    };
    return icons[type] || <FaTag />;
  };

  // ===== Get category color =====
  const getCategoryColor = (type) => {
    const colors = {
      announcement: '#0dcaf0',
      event: '#198754',
      meeting: '#ffc107',
      exam: '#dc3545',
      news: '#6f42c1',
    };
    return colors[type] || '#6c757d';
  };

  // ===== Get category label with translation =====
  const getCategoryLabel = (type) => {
    const labels = {
      announcement: isArabic ? 'إعلان' : 'Announcement',
      event: isArabic ? 'فعالية' : 'Event',
      meeting: isArabic ? 'لقاء' : 'Meeting',
      exam: isArabic ? 'امتحان' : 'Exam',
      news: isArabic ? 'أخبار' : 'News',
    };
    return labels[type] || type;
  };

  // ===== Get gradient for card top =====
  const getCardGradient = (type) => {
    const gradients = {
      announcement: 'linear-gradient(90deg, #0dcaf0, #0d6efd)',
      event: 'linear-gradient(90deg, #198754, #28a745)',
      meeting: 'linear-gradient(90deg, #ffc107, #fd7e14)',
      exam: 'linear-gradient(90deg, #dc3545, #e74c3c)',
      news: 'linear-gradient(90deg, #6f42c1, #8e44ad)',
    };
    return gradients[type] || 'linear-gradient(90deg, #6c757d, #adb5bd)';
  };

  // ===== Categories for filter with translations =====
  const categories = [
    { value: 'all', label: isArabic ? 'الكل' : 'All' },
    { value: 'announcement', label: isArabic ? 'إعلانات' : 'Announcements' },
    { value: 'event', label: isArabic ? 'فعاليات' : 'Events' },
    { value: 'meeting', label: isArabic ? 'لقاءات' : 'Meetings' },
    { value: 'exam', label: isArabic ? 'امتحانات' : 'Exams' },
    { value: 'news', label: isArabic ? 'أخبار' : 'News' },
  ];

  // ===== Pagination =====
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const displayedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get translation for audience
  const getAudienceLabel = (audience) => {
    const labels = {
      students: isArabic ? 'طلاب' : 'Students',
      parents: isArabic ? 'أولياء الأمور' : 'Parents',
      teachers: isArabic ? 'معلمون' : 'Teachers',
      all: isArabic ? 'الجميع' : 'All',
    };
    return labels[audience] || audience;
  };

  if (loading) {
    return (
      <div className="news-events-page py-5 text-center" dir={isArabic ? 'rtl' : 'ltr'}>
        <Container>
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted" style={arabicFontStyle}>{isArabic ? 'جاري تحميل الأخبار...' : 'Loading news...'}</p>
        </Container>
      </div>
    );
  }

  return (
    <div className="news-events-page" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* ===== HERO SECTION ===== */}
      <section className="hero-section py-5">
        <Container>
          <h1 className="display-4 fw-bold text-center text-white" style={arabicFontStyle}>
            {isArabic ? 'الأخبار والفعاليات' : 'News & Events'}
          </h1>
          <p className="text-center fs-5 text-white opacity-75" style={arabicFontStyle}>
            {isArabic ? 'تابع آخر الأخبار والفعاليات في مدرسة الفتح' : 'Stay updated with the latest news and events at Al Fath School'}
          </p>
          <div className="text-center mt-3">
            <Button
              variant="outline-light"
              size="sm"
              onClick={forceReload}
              className="px-4 refresh-btn"
            >
              <FaSync className="me-2" /> {isArabic ? 'تحديث' : 'Refresh'}
            </Button>
          </div>
        </Container>
      </section>

      {/* ===== SEARCH & FILTER ===== */}
      <section className="py-4 bg-light">
        <Container>
          <Row className="g-3 align-items-center">
            <Col md={5}>
              <InputGroup>
                <InputGroup.Text><FaSearch /></InputGroup.Text>
                <Form.Control
                  placeholder={isArabic ? 'ابحث في الأخبار والفعاليات' : 'Search news and events...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={arabicFontStyle}
                />
              </InputGroup>
            </Col>
            <Col md={7}>
              <div className="d-flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <Button
                    key={cat.value}
                    variant={selectedCategory === cat.value ? 'primary' : 'outline-primary'}
                    size="sm"
                    onClick={() => setSelectedCategory(cat.value)}
                    className="category-btn"
                    style={arabicFontStyle}
                  >
                    {cat.label}
                  </Button>
                ))}
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ===== RESULTS COUNT ===== */}
      <section className="py-2">
        <Container>
          <p className="text-muted small" style={arabicFontStyle}>
            {isArabic ? 'عرض' : 'Showing'} {displayedItems.length} {isArabic ? 'من' : 'of'} {filteredItems.length} {isArabic ? 'نتائج' : 'results'}
          </p>
        </Container>
      </section>

      {/* ===== NEWS & EVENTS GRID ===== */}
      <section className="py-4">
        <Container>
          {displayedItems.length === 0 ? (
            <div className="text-center py-5">
              <div className="display-1 text-muted opacity-25 mb-3">📰</div>
              <h4 style={arabicFontStyle}>{isArabic ? 'لا توجد نتائج' : 'No results found'}</h4>
              <p className="text-muted" style={arabicFontStyle}>
                {isArabic ? 'حاول تعديل بحثك أو اختيار فئة أخرى' : 'Try adjusting your search or selecting a different category'}
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                style={arabicFontStyle}
              >
                {isArabic ? 'عرض الكل' : 'View All'}
              </Button>
            </div>
          ) : (
            <Row className="g-4">
              {displayedItems.map((item) => {
                // Get the appropriate title and content based on language
                const title = getTranslatedTitle(item);
                const content = getTranslatedContent(item);
                const author = getTranslatedAuthor(item);
                
                return (
                  <Col key={item.id} md={6} lg={4}>
                    <Card
                      className="news-card h-100 shadow-sm border-0"
                      onMouseEnter={() => setHoveredCard(item.id)}
                      onMouseLeave={() => setHoveredCard(null)}
                      style={{
                        transform: hoveredCard === item.id ? 'translateY(-12px) scale(1.02)' : 'translateY(0) scale(1)',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: hoveredCard === item.id ? '0 20px 60px rgba(0,0,0,0.15)' : '0 4px 20px rgba(0,0,0,0.06)',
                      }}
                    >
                      {/* Top Gradient Bar */}
                      <div className="news-card-top-bar" style={{
                        height: '5px',
                        background: getCardGradient(item.type || item.category || 'announcement'),
                        borderRadius: '16px 16px 0 0',
                        transition: 'height 0.4s ease'
                      }}></div>

                      {/* ===== IMAGE/VIDEO ===== */}
                      {(item.image || item.video) && (
                        <div className="news-media-wrapper">
                          {item.mediaType === 'image' && (
                            <Card.Img
                              variant="top"
                              src={item.image}
                              alt={title}
                              className="news-media-img"
                              style={{
                                transform: hoveredCard === item.id ? 'scale(1.08)' : 'scale(1)',
                                transition: 'transform 0.6s ease'
                              }}
                            />
                          )}
                          {item.mediaType === 'video' && (
                            <div className="position-relative">
                              <video
                                src={item.video}
                                className="news-media-img"
                                poster={item.image || undefined}
                                controls={false}
                                style={{
                                  transform: hoveredCard === item.id ? 'scale(1.08)' : 'scale(1)',
                                  transition: 'transform 0.6s ease'
                                }}
                              />
                              <div className="video-play-icon">
                                <FaPlayCircle size={48} className="text-white opacity-75" />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <Card.Body className="p-4">
                        {/* ===== CATEGORY & DATE ===== */}
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <Badge
                            className="category-badge"
                            style={{
                              background: getCategoryColor(item.type || item.category || 'announcement'),
                              color: 'white',
                              transition: 'all 0.3s ease'
                            }}
                          >
                            {getCategoryIcon(item.type || item.category || 'announcement')} {getCategoryLabel(item.type || item.category || 'announcement')}
                          </Badge>
                          <small className="text-muted" style={arabicFontStyle}>
                            <FaCalendarAlt className="me-1" /> {item.date || new Date(item.createdAt).toLocaleDateString()}
                          </small>
                        </div>

                        {/* ===== TITLE ===== */}
                        <h5 className="fw-bold mb-2 news-title" style={arabicFontStyle}>
                          {title}
                        </h5>

                        {/* ===== CONTENT PREVIEW ===== */}
                        <p className="text-muted small news-preview" style={arabicFontStyle}>
                          {content && content.length > 120
                            ? content.substring(0, 120) + '...'
                            : content || (isArabic ? 'لا يوجد محتوى' : 'No content')}
                        </p>

                        {/* ===== AUTHOR & META ===== */}
                        <div className="d-flex justify-content-between align-items-center mt-2">
                          <small className="text-muted" style={arabicFontStyle}>
                            <FaUser className="me-1" /> {author}
                          </small>
                          <div className="d-flex gap-3">
                            <small className="text-muted" style={arabicFontStyle}>
                              <FaEye className="me-1" /> {formatNumber(item.views || 0)}
                            </small>
                            <small
                              className="like-btn"
                              onClick={() => handleLike(item.id)}
                              style={{
                                color: likedItems[item.id] ? '#dc3545' : '#6c757d',
                                transition: 'all 0.3s ease'
                              }}
                            >
                              {likedItems[item.id] ? (
                                <FaHeart className="text-danger" />
                              ) : (
                                <FaRegHeart />
                              )}
                              {' '}{formatNumber(item.likes || 0)}
                            </small>
                          </div>
                        </div>

                        {/* ===== TARGET AUDIENCE ===== */}
                        {item.targetAudience && item.targetAudience.length > 0 && (
                          <div className="mt-2 d-flex flex-wrap gap-1">
                            {item.targetAudience.map((audience, idx) => (
                              <Badge key={idx} bg="light" text="dark" className="audience-badge" style={arabicFontStyle}>
                                {getAudienceLabel(audience)}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </Card.Body>

                      {/* ===== FOOTER ===== */}
                      <Card.Footer className="bg-transparent border-0 p-3 pt-0">
                        <Button
                          variant="link"
                          className="read-more-btn p-0 d-flex align-items-center gap-1"
                          onClick={() => handleReadMore(item)}
                          style={arabicFontStyle}
                        >
                          {isArabic ? 'اقرأ المزيد' : 'Read More'} <FaArrowRight size={12} />
                        </Button>
                      </Card.Footer>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          )}

          {/* ===== PAGINATION ===== */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination>
                <Pagination.Prev
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                />
                {[...Array(totalPages)].map((_, i) => (
                  <Pagination.Item
                    key={i + 1}
                    active={currentPage === i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </Pagination.Item>
                ))}
                <Pagination.Next
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                />
              </Pagination>
            </div>
          )}
        </Container>
      </section>

      {/* ===== READ MORE MODAL ===== */}
      <Modal
        show={showReadMoreModal}
        onHide={() => setShowReadMoreModal(false)}
        centered
        size="lg"
        className="read-more-modal"
      >
        <Modal.Header closeButton className="border-0">
          <Modal.Title style={arabicFontStyle}>
            {selectedItem ? getTranslatedTitle(selectedItem) : ''}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedItem && (
            <>
              {/* Media */}
              {(selectedItem.image || selectedItem.video) && (
                <div className="modal-media mb-4">
                  {selectedItem.mediaType === 'image' && (
                    <img src={selectedItem.image} alt={getTranslatedTitle(selectedItem)} className="img-fluid rounded" />
                  )}
                  {selectedItem.mediaType === 'video' && (
                    <video src={selectedItem.video} controls className="img-fluid rounded" />
                  )}
                </div>
              )}

              {/* Meta Info */}
              <div className="d-flex flex-wrap gap-3 mb-3">
                <Badge
                  className="category-badge"
                  style={{
                    background: getCategoryColor(selectedItem.type || selectedItem.category || 'announcement'),
                    color: 'white',
                    padding: '6px 14px',
                    borderRadius: '50px'
                  }}
                >
                  {getCategoryIcon(selectedItem.type || selectedItem.category || 'announcement')} {getCategoryLabel(selectedItem.type || selectedItem.category || 'announcement')}
                </Badge>
                <small className="text-muted d-flex align-items-center" style={arabicFontStyle}>
                  <FaCalendarAlt className="me-1" /> {selectedItem.date || new Date(selectedItem.createdAt).toLocaleDateString()}
                </small>
                <small className="text-muted d-flex align-items-center" style={arabicFontStyle}>
                  <FaClock className="me-1" /> {selectedItem.time || new Date(selectedItem.createdAt).toLocaleTimeString()}
                </small>
                <small className="text-muted d-flex align-items-center" style={arabicFontStyle}>
                  <FaUser className="me-1" /> {getTranslatedAuthor(selectedItem)}
                </small>
              </div>

              {/* Full Content */}
              <div className="modal-content-text" style={arabicFontStyle}>
                {getTranslatedContent(selectedItem)}
              </div>

              {/* Stats */}
              <div className="d-flex gap-4 mt-4 pt-3 border-top">
                <small className="text-muted d-flex align-items-center" style={arabicFontStyle}>
                  <FaEye className="me-1" /> {formatNumber(selectedItem.views || 0)} {isArabic ? 'مشاهدة' : 'views'}
                </small>
                <small
                  className="like-btn d-flex align-items-center"
                  onClick={() => handleLike(selectedItem.id)}
                  style={{
                    cursor: 'pointer',
                    color: likedItems[selectedItem.id] ? '#dc3545' : '#6c757d'
                  }}
                >
                  {likedItems[selectedItem.id] ? (
                    <FaHeart className="text-danger me-1" />
                  ) : (
                    <FaRegHeart className="me-1" />
                  )}
                  {formatNumber(selectedItem.likes || 0)} {isArabic ? 'إعجاب' : 'likes'}
                </small>
                <small className="text-muted d-flex align-items-center" style={arabicFontStyle}>
                  <FaComment className="me-1" /> {formatNumber(selectedItem.comments || 0)} {isArabic ? 'تعليق' : 'comments'}
                </small>
              </div>

              {/* Share Buttons */}
              <div className="mt-3 pt-3 border-top">
                <small className="text-muted d-block mb-2" style={arabicFontStyle}>
                  {isArabic ? 'شارك هذا الخبر' : 'Share this news'}
                </small>
                <div className="d-flex flex-wrap gap-2">
                  <Button variant="outline-primary" size="sm" className="share-btn" style={arabicFontStyle}>
                    <FaFacebook /> Facebook
                  </Button>
                  <Button variant="outline-info" size="sm" className="share-btn" style={arabicFontStyle}>
                    <FaTwitter /> Twitter
                  </Button>
                  <Button variant="outline-success" size="sm" className="share-btn" style={arabicFontStyle}>
                    <FaWhatsapp /> WhatsApp
                  </Button>
                  <Button variant="outline-secondary" size="sm" className="share-btn" style={arabicFontStyle}>
                    <FaEnvelope /> Email
                  </Button>
                  <Button variant="outline-dark" size="sm" className="share-btn" style={arabicFontStyle}>
                    <FaLink /> Link
                  </Button>
                </div>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="secondary" onClick={() => setShowReadMoreModal(false)} style={arabicFontStyle}>
            <FaTimes className="me-1" /> {isArabic ? 'إغلاق' : 'Close'}
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@100..900&family=Vazirmatn:wght@100..900&display=swap');

        .news-events-page {
          background: #f8f9fa;
          min-height: 100vh;
        }

        .hero-section {
          background: linear-gradient(135deg, #031c2f 0%, #1a5f7a 100%);
          border-radius: 0 0 40px 40px;
          position: relative;
          overflow: hidden;
        }
        .hero-section::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -20%;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          background: rgba(255,255,255,0.03);
          animation: floatBg 15s ease-in-out infinite;
        }
        .hero-section::after {
          content: '';
          position: absolute;
          bottom: -30%;
          left: -10%;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: rgba(255,255,255,0.02);
          animation: floatBg 20s ease-in-out infinite reverse;
        }

        @keyframes floatBg {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-20px, 30px); }
        }

        .refresh-btn {
          transition: all 0.3s ease;
          border-radius: 50px;
        }
        .refresh-btn:hover {
          transform: rotate(180deg);
          background: rgba(255,255,255,0.15);
        }

        .category-btn {
          border-radius: 50px;
          transition: all 0.3s ease;
          font-size: 0.8rem;
          padding: 4px 16px;
        }
        .category-btn:hover {
          transform: translateY(-2px);
        }

        .news-card {
          border-radius: 16px !important;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          background: white;
          border: none !important;
        }

        .news-card-top-bar {
          transition: height 0.4s ease;
        }
        .news-card:hover .news-card-top-bar {
          height: 6px;
        }

        .news-media-wrapper {
          position: relative;
          overflow: hidden;
          background: #f0f2f5;
        }

        .news-media-img {
          height: 200px;
          width: 100%;
          object-fit: cover;
          transition: transform 0.6s ease;
        }

        .video-play-icon {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
          opacity: 0.8;
          transition: opacity 0.3s ease;
        }
        .news-card:hover .video-play-icon {
          opacity: 1;
        }

        .category-badge {
          padding: 6px 14px;
          border-radius: 50px;
          font-size: 0.7rem;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: all 0.3s ease;
        }
        .news-card:hover .category-badge {
          transform: scale(1.05);
        }

        .news-title {
          font-size: 1.05rem;
          transition: color 0.3s ease;
        }
        .news-card:hover .news-title {
          color: #1a5f7a;
        }

        .news-preview {
          font-size: 0.85rem;
          line-height: 1.6;
        }

        .like-btn {
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .like-btn:hover {
          transform: scale(1.2);
        }

        .audience-badge {
          font-size: 0.5rem;
          padding: 2px 8px;
          border-radius: 50px;
        }

        .read-more-btn {
          color: #1a5f7a;
          font-weight: 500;
          transition: all 0.3s ease;
        }
        .read-more-btn:hover {
          color: #0d3b4f;
          transform: translateX(5px);
        }
        .dashboard-wrapper.rtl .read-more-btn:hover {
          transform: translateX(-5px);
        }

        .read-more-modal .modal-content {
          border-radius: 20px;
          border: none;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
          overflow: hidden;
        }
        .read-more-modal .modal-header {
          padding: 24px 28px 0;
          border-bottom: none;
        }
        .read-more-modal .modal-header .btn-close {
          background: rgba(0,0,0,0.05);
          border-radius: 50%;
          padding: 8px;
          transition: all 0.3s ease;
        }
        .read-more-modal .modal-header .btn-close:hover {
          background: rgba(0,0,0,0.1);
          transform: rotate(90deg);
        }
        .read-more-modal .modal-body {
          padding: 16px 28px 24px;
        }
        .read-more-modal .modal-footer {
          padding: 8px 28px 24px;
          border-top: none;
        }

        .modal-media img,
        .modal-media video {
          max-height: 400px;
          width: 100%;
          object-fit: cover;
          border-radius: 12px;
        }

        .modal-content-text {
          font-size: 1rem;
          line-height: 1.8;
          color: #2d3436;
        }

        .share-btn {
          border-radius: 50px;
          font-size: 0.7rem;
          padding: 4px 12px;
          transition: all 0.3s ease;
        }
        .share-btn:hover {
          transform: translateY(-2px);
        }

        .dashboard-wrapper.rtl .read-more-modal .modal-header {
          flex-direction: row-reverse;
        }
        .dashboard-wrapper.rtl .read-more-modal .modal-header .btn-close {
          margin-left: 0 !important;
          margin-right: auto !important;
        }

        @media (max-width: 768px) {
          .hero-section {
            border-radius: 0 0 24px 24px;
          }
          .hero-section .display-4 {
            font-size: 2rem;
          }
          .news-card {
            border-radius: 12px !important;
          }
          .news-card .p-4 {
            padding: 16px !important;
          }
          .news-media-img {
            height: 160px;
          }
          .read-more-modal .modal-header {
            padding: 16px 20px 0;
          }
          .read-more-modal .modal-body {
            padding: 12px 20px 16px;
          }
          .read-more-modal .modal-footer {
            padding: 4px 20px 16px;
          }
          .modal-content-text {
            font-size: 0.9rem;
          }
        }

        @media (max-width: 576px) {
          .hero-section .display-4 {
            font-size: 1.5rem;
          }
          .category-btn {
            font-size: 0.65rem;
            padding: 3px 10px;
          }
          .news-card .p-4 {
            padding: 12px !important;
          }
          .news-title {
            font-size: 0.9rem;
          }
          .news-preview {
            font-size: 0.75rem;
          }
          .news-media-img {
            height: 140px;
          }
          .read-more-modal .modal-header {
            padding: 12px 16px 0;
          }
          .read-more-modal .modal-body {
            padding: 8px 16px 12px;
          }
          .read-more-modal .modal-footer {
            padding: 2px 16px 12px;
          }
          .modal-content-text {
            font-size: 0.8rem;
          }
          .share-btn {
            font-size: 0.6rem;
            padding: 2px 8px;
          }
          .category-badge {
            font-size: 0.6rem;
            padding: 4px 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default NewsEvents;