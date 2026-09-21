// src/components/dashboard/admin/ContactMessages.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Row, Col, Card, Badge, Button, Form, Modal,
  InputGroup, Alert, Spinner,
} from 'react-bootstrap';
import {
  FaEnvelopeOpenText, FaUser, FaAt, FaTag, FaClock,
  FaReply, FaSearch, FaTimesCircle, FaSync, FaPaperPlane,
  FaSpinner, FaCheckCircle,
} from 'react-icons/fa';
import { useLanguage } from '../../../context/LanguageContext';
import { useNotification } from '../../../hooks/useNotification';
import api from '../../../services/api';

const ContactMessages = () => {
  const { isArabic } = useLanguage();
  const { notify } = useNotification();

  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [replyTarget, setReplyTarget] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);
  const [repliedId, setRepliedId] = useState(null);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/contacts');
      setContacts(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('Failed to load contact messages:', e);
      setError(isArabic ? 'تعذر تحميل رسائل التواصل' : 'Failed to load contact messages');
    } finally {
      setLoading(false);
    }
  }, [isArabic]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const filteredContacts = contacts.filter((c) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.subject || '').toLowerCase().includes(q) ||
      (c.message || '').toLowerCase().includes(q)
    );
  });

  const openReply = (contact) => {
    setReplyTarget(contact);
    setReplyText('');
    setRepliedId(null);
  };

  const handleReply = async () => {
    if (!replyTarget || !replyText.trim()) return;
    setReplySending(true);
    try {
      await api.post(`/admin/contacts/${replyTarget.id}/reply`, {
        reply: replyText.trim(),
      });
      setRepliedId(replyTarget.id);
      notify(isArabic ? 'تم إرسال الرد بنجاح عبر البريد الإلكتروني' : 'Reply sent successfully by email', 'success');
      setTimeout(() => {
        setReplyTarget(null);
        setReplyText('');
        setRepliedId(null);
      }, 1200);
    } catch (e) {
      console.error('Reply failed:', e);
      notify(
        e.response?.data?.message || (isArabic ? 'تعذر إرسال الرد' : 'Failed to send reply'),
        'error'
      );
    } finally {
      setReplySending(false);
    }
  };

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleString(isArabic ? 'ar-MA' : 'en-GB', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return iso || '';
    }
  };

  return (
    <div className="contact-messages-page" dir={isArabic ? 'rtl' : 'ltr'}>
      <Container fluid className="px-2 px-sm-3 px-md-4">
        <div className="d-flex flex-wrap flex-sm-nowrap justify-content-between align-items-center gap-2 gap-sm-3 mb-3 mb-md-4">
          <div>
            <h4 className="fw-bold mb-0" style={{ color: '#1a5f7a', fontSize: 'clamp(1rem, 2vw, 1.5rem)' }}>
              <FaEnvelopeOpenText className="me-2" style={{ color: '#1a5f7a' }} />
              {isArabic ? 'رسائل التواصل' : 'Contact Messages'}
              <Badge bg="primary" className="ms-2">{contacts.length}</Badge>
            </h4>
            <p className="text-muted mb-0 d-none d-sm-block" style={{ fontSize: 'clamp(0.75rem, 0.9vw, 0.9rem)' }}>
              {isArabic
                ? 'رسائل أرسلها الزوار من صفحة اتصل بنا'
                : 'Messages submitted by visitors from the Contact Us page'}
            </p>
          </div>
          <Button variant="outline-primary" size="sm" onClick={loadContacts} disabled={loading}
            style={{ borderRadius: '12px' }}>
            <FaSync className={loading ? 'spinning' : ''} />
            <span className="d-none d-sm-inline ms-1">{isArabic ? 'تحديث' : 'Refresh'}</span>
          </Button>
        </div>

        <InputGroup className="mb-3 mb-md-4" style={{ maxWidth: '480px' }}>
          <InputGroup.Text style={{ borderRadius: '12px 0 0 12px' }}><FaSearch /></InputGroup.Text>
          <Form.Control
            type="text"
            placeholder={isArabic ? 'بحث عن رسالة...' : 'Search messages...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <Button variant="outline-secondary" onClick={() => setSearchTerm('')} style={{ borderRadius: '0 12px 12px 0' }}>
              <FaTimesCircle />
            </Button>
          )}
        </InputGroup>

        {error && (
          <Alert variant="danger" className="d-flex justify-content-between align-items-center">
            <span>{error}</span>
            <Button variant="outline-danger" size="sm" onClick={loadContacts}>{isArabic ? 'إعادة المحاولة' : 'Retry'}</Button>
          </Alert>
        )}

        {loading && contacts.length === 0 ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : filteredContacts.length === 0 ? (
          <Card className="text-center py-5 shadow-sm border-0" style={{ borderRadius: '16px' }}>
            <Card.Body>
              <FaEnvelopeOpenText size={48} className="text-muted mb-3" style={{ opacity: 0.3 }} />
              <h5>{isArabic ? 'لا توجد رسائل' : 'No messages'}</h5>
              <p className="text-muted mb-0">
                {isArabic
                  ? 'ستظهر رسائل الزوار هنا عندما يرسلونها من صفحة اتصل بنا'
                  : 'Visitor messages will appear here when submitted from the Contact Us page'}
              </p>
            </Card.Body>
          </Card>
        ) : (
          <Row className="g-3">
            {filteredContacts.map((c) => (
              <Col xs={12} md={6} xl={4} key={c.id}>
                <Card className="h-100 shadow-sm border-0 contact-message-card" style={{ borderRadius: '14px' }}>
                  <Card.Body className="p-3 p-sm-4">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <Badge bg="info" className="rounded-pill" style={{ fontSize: '0.6rem' }}>
                        #{c.id}
                      </Badge>
                      <small className="text-muted" style={{ fontSize: '0.65rem' }}>
                        <FaClock className="me-1" size={10} />
                        {formatDate(c.created_at)}
                      </small>
                    </div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <FaUser className="text-secondary" size={12} />
                      <span className="fw-bold" style={{ fontSize: '0.85rem' }}>{c.name || '—'}</span>
                    </div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <FaAt className="text-secondary" size={12} />
                      <span className="text-muted" style={{ fontSize: '0.75rem' }}>{c.email || '—'}</span>
                    </div>
                    {c.subject && (
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <FaTag className="text-secondary" size={12} />
                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>{c.subject}</span>
                      </div>
                    )}
                    <p className="text-muted contact-message-text mb-3" style={{ fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>
                      {c.message}
                    </p>
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-100"
                      disabled={!c.email}
                      onClick={() => openReply(c)}
                      style={{ borderRadius: '10px' }}
                    >
                      <FaReply className="me-1" />
                      {c.email ? (isArabic ? 'الرد عبر البريد' : 'Reply by Email') : (isArabic ? 'لا يوجد بريد' : 'No Email')}
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>

      <Modal show={!!replyTarget} onHide={() => !replySending && setReplyTarget(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaEnvelopeOpenText className="me-2" style={{ color: '#1a5f7a' }} />
            {isArabic ? 'الرد عبر البريد الإلكتروني' : 'Reply by Email'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {repliedId === replyTarget?.id ? (
            <div className="text-center py-4">
              <FaCheckCircle size={48} className="text-success mb-3" />
              <p className="mb-0 fw-semibold">
                {isArabic ? 'تم إرسال الرد إلى ' : 'Reply sent to '}{replyTarget?.email}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-3">
                <strong>{replyTarget?.name || '—'}</strong>
                <div className="text-muted small">{replyTarget?.email}</div>
                <div className="mt-2 p-2 rounded bg-light small" style={{ borderLeft: '3px solid #1a5f7a' }}>
                  <em>{replyTarget?.message}</em>
                </div>
              </div>
              <Form.Group>
                <Form.Label className="fw-semibold">
                  {isArabic ? 'نص الرد' : 'Reply text'}
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={5}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={isArabic ? 'اكتب ردك هنا...' : 'Type your reply here...'}
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        {repliedId !== replyTarget?.id && (
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setReplyTarget(null)} disabled={replySending}>
              {isArabic ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button variant="primary" onClick={handleReply} disabled={replySending || !replyText.trim()}>
              {replySending ? (
                <>
                  <FaSpinner className="spinning me-1" /> {isArabic ? 'جاري الإرسال...' : 'Sending...'}
                </>
              ) : (
                <>
                  <FaPaperPlane className="me-1" /> {isArabic ? 'إرسال الرد' : 'Send Reply'}
                </>
              )}
            </Button>
          </Modal.Footer>
        )}
      </Modal>

      <style>{`
        .contact-messages-page {
          padding: 0;
          max-width: 100vw;
          overflow-x: hidden;
        }
        .contact-messages-page * { box-sizing: border-box; }
        .contact-message-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          border: 1px solid var(--border-color, #e9ecef);
        }
        .contact-message-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.08);
        }
        .contact-message-text {
          display: -webkit-box;
          -webkit-line-clamp: 6;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .spinning { animation: spin 1s linear infinite; }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        [dir="rtl"] .contact-message-card .rounded {
          border-left: none !important;
          border-right: 3px solid #1a5f7a !important;
        }
      `}</style>
    </div>
  );
};

export default ContactMessages;