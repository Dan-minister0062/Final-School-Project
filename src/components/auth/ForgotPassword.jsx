import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNotification } from '../../hooks/useNotification';
import api from "../../axios"; // adjust path

const forgotSchema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
});

const ForgotPassword = () => {
  const { notify } = useNotification();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(forgotSchema)
  });


  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await api.post("/auth/forgot-password", { email: data.email });
      notify("Password reset link sent to your email!", "success");
      setSubmitted(true);
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        "Something went wrong. Please try again.";
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
                  <h2 className="fw-bold text-primary">Forgot Password</h2>
                  <p className="text-muted">We'll send you a reset link</p>
                </div>

                {submitted ? (
                  <Alert variant="success" className="text-center">
                    <h5>✅ Check Your Email</h5>
                    <p>We've sent a password reset link to your email address.</p>
                    <Link to="/login" className="text-decoration-none">Return to Login</Link>
                  </Alert>
                ) : (
                  <Form onSubmit={handleSubmit(onSubmit)}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email Address</Form.Label>
                      <div className="input-group">
                        <span className="input-group-text bg-light"><i className="bi bi-envelope"></i></span>
                        <Form.Control type="email" placeholder="Enter your email" {...register('email')} isInvalid={!!errors.email} />
                      </div>
                      {errors.email && <Form.Text className="text-danger">{errors.email.message}</Form.Text>}
                    </Form.Group>

                    <Button variant="primary" type="submit" className="w-100 py-2" disabled={submitting}>
                      {submitting ? <><Spinner animation="border" size="sm" className="me-2" /> Sending...</> : 'Send Reset Link'}
                    </Button>
                  </Form>
                )}

                <div className="text-center mt-3">
                  <p className="text-muted">
                    Remember your password? <Link to="/login" className="text-decoration-none fw-bold">Login</Link>
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