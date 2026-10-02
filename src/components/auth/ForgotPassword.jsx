import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useLanguage } from '../../context/LanguageContext';
import { useNotification } from '../../hooks/useNotification';
import { getTranslation } from '../../utils/translations';
import api from "../../axios"; // adjust path

const ForgotPassword = () => {
  const { notify } = useNotification();
  const { language } = useLanguage();
  const t = (key) => getTranslation(key, language);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const forgotSchema = yup.object().shape({
    email: yup
      .string()
      .email(t("invalidEmail"))
      .required(t("emailRequired")),
  });

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(forgotSchema)
  });


  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await api.post("/auth/forgot-password", { email: data.email });
      notify(t("resetLinkSent"), "success");
      setSubmitted(true);
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        t("actionFailed");
      notify(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      <Container>
        <Row className="justify-content-center">
          <Col md={6} lg={5}>
            <Card className="shadow-lg border-0">
              <Card.Body className="p-5">
                <div className="text-center mb-4">
                  <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex p-3 mb-3">
                    <i className="bi bi-mortarboard" style={{ fontSize: '40px', color: '#1a5f7a' }}></i>
                  </div>
                  <h2 className="fw-bold text-primary">{t("forgotPassword")}</h2>
                  <p className="text-muted">{t("forgotPasswordSubtitle")}</p>
                </div>

                {submitted ? (
                  <Alert variant="success" className="text-center">
                    <h5>✅ {t("checkYourEmail")}</h5>
                    <p>{t("resetLinkSentBody")}</p>
                    <Link to="/login" className="text-decoration-none">{t("returnToLogin")}</Link>
                  </Alert>
                ) : (
                  <Form onSubmit={handleSubmit(onSubmit)}>
                    <Form.Group className="mb-3">
                      <Form.Label>{t("emailAddressLabel")}</Form.Label>
                      <div className="input-group">
                        <span className="input-group-text bg-light"><i className="bi bi-envelope"></i></span>
                        <Form.Control type="email" placeholder={t("enterYourEmail")} {...register('email')} isInvalid={!!errors.email} />
                      </div>
                      {errors.email && <Form.Text className="text-danger">{errors.email.message}</Form.Text>}
                    </Form.Group>

                    <Button variant="primary" type="submit" className="w-100 py-2" disabled={submitting}>
                      {submitting ? <><Spinner animation="border" size="sm" className="me-2" /> {t("sending")}...</> : t("sendResetLink")}
                    </Button>
                  </Form>
                )}

                <div className="text-center mt-3">
                  <p className="text-muted">
                    {t("rememberPassword")} <Link to="/login" className="text-decoration-none fw-bold">{t("login")}</Link>
                  </p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default ForgotPassword;