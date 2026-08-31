// src/components/dashboard/admin/Profile.jsx (shared across all roles)
import React, { useState, useEffect, useRef } from 'react';
import { Card, Form, Button, Row, Col, Badge, Alert, Image } from 'react-bootstrap';
import { 
  FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaSave, FaEdit, 
  FaCamera, FaUpload, FaTrash, FaUserCircle, FaSpinner
} from 'react-icons/fa';
import { useAuth } from '../../../hooks/useAuth';
import { useLanguage } from '../../../context/LanguageContext';
import { useNotification } from '../../../hooks/useNotification';
import { useOutletContext } from 'react-router-dom';
import api from '../../../services/api';

const Profile = () => {
  const { user } = useAuth();
  const { isArabic } = useLanguage();
  const { handleProfileUpdate } = useOutletContext() || {};
  const { notify } = useNotification();
  const fileInputRef = useRef(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [tempImage, setTempImage] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    role: ''
  });
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // ===== Get user role display name =====
  const getRoleDisplayName = () => {
    const role = user?.role || 'admin';
    const roleMap = {
      admin: isArabic ? 'مدير' : 'Admin',
      teacher: isArabic ? 'أستاذ' : 'Teacher',
      parent: isArabic ? 'ولي أمر' : 'Parent',
      student: isArabic ? 'طالب' : 'Student'
    };
    return roleMap[role] || 'Admin';
  };

  // ===== Get role letter for avatar =====
  const getRoleLetter = () => {
    const role = user?.role || 'admin';
    const roleMap = {
      admin: 'A',
      teacher: 'T',
      parent: 'P',
      student: 'S'
    };
    return roleMap[role] || 'A';
  };

  // ===== Get role color =====
  const getRoleColor = () => {
    const role = user?.role || 'admin';
    const colorMap = {
      admin: '#1a5f7a',
      teacher: '#2d6a4f',
      parent: '#c49a6c',
      student: '#6c757d'
    };
    return colorMap[role] || '#1a5f7a';
  };

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        role: user.role || 'Admin'
      });
      // Avatar lives on the users table (MySQL) and arrives via the auth user
      if (user?.avatar || user?.profileImage) {
        setProfileImage(user.avatar || user.profileImage);
      }
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      notify(
        isArabic ? 'يرجى اختيار صورة بصيغة JPEG, PNG, GIF, WEBP أو SVG' : 'Please select a JPEG, PNG, GIF, WEBP or SVG image',
        'error'
      );
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      notify(
        isArabic ? 'حجم الصورة يجب أن لا يتجاوز 5 ميجابايت' : 'Image size must not exceed 5MB',
        'error'
      );
      return;
    }

    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target.result;
      setTempImage(imageData);
      setIsUploading(false);
    };
    reader.onerror = () => {
      setIsUploading(false);
      notify(
        isArabic ? 'حدث خطأ أثناء قراءة الصورة' : 'Error reading image',
        'error'
      );
    };
    reader.readAsDataURL(file);
  };

  // Save profile image (persisted on the users table via the API)
  const saveProfileImage = () => {
    if (tempImage) {
      setProfileImage(tempImage);

      try {
        const token = localStorage.getItem('token');
        if (token && !token.startsWith('demo-')) {
          api.put('/profile', { avatar: tempImage }).catch(() => {});
        }
      } catch (e) {
        console.error('Error saving avatar:', e);
      }

      if (user && handleProfileUpdate) {
        handleProfileUpdate({ ...formData, profileImage: tempImage });
      }

      setTempImage(null);
      notify(
        isArabic ? 'تم تحديث الصورة الشخصية بنجاح' : 'Profile image updated successfully',
        'success'
      );
    }
  };

  // Cancel image upload
  const cancelImageUpload = () => {
    setTempImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove profile image (cleared on the users table via the API)
  const removeProfileImage = () => {
    setProfileImage(null);
    setTempImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    try {
      const token = localStorage.getItem('token');
      if (token && !token.startsWith('demo-')) {
        api.put('/profile', { avatar: null }).catch(() => {});
      }
    } catch (e) {
      console.error('Error removing avatar:', e);
    }
    notify(
      isArabic ? 'تم حذف الصورة الشخصية' : 'Profile image removed',
      'info'
    );
  };

  // Get initials for avatar fallback
  const getInitials = (name) => {
    if (!name) return getRoleLetter();
    return name.charAt(0).toUpperCase();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setAlertMessage(isArabic ? 'الرجاء إدخال الاسم' : 'Please enter your name');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }

    if (!formData.email.trim()) {
      setAlertMessage(isArabic ? 'الرجاء إدخال البريد الإلكتروني' : 'Please enter your email');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }

    if (tempImage) {
      saveProfileImage();
    }

    // Persist profile fields on the users table via the API
    try {
      const token = localStorage.getItem('token');
      if (token && !token.startsWith('demo-')) {
        api.put('/profile', {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
        }).catch(() => {});
      }
    } catch (e) {
      console.error('Error saving profile:', e);
    }

    if (handleProfileUpdate) {
      handleProfileUpdate(formData);
    }
    setIsEditing(false);
    
    notify(
      isArabic ? 'تم تحديث الملف الشخصي بنجاح' : 'Profile updated successfully',
      'success'
    );
  };

  return (
    <div className="profile-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold">{isArabic ? 'الملف الشخصي' : 'Profile'}</h2>
          <p className="text-muted">{isArabic ? 'عرض وتحديث معلومات ملفك الشخصي' : 'View and update your profile information'}</p>
        </div>
        <Button 
          variant={isEditing ? 'secondary' : 'primary'} 
          onClick={() => isEditing ? setIsEditing(false) : setIsEditing(true)}
        >
          {isEditing ? (
            <><FaEdit className="me-2" /> {isArabic ? 'إلغاء التعديل' : 'Cancel Editing'}</>
          ) : (
            <><FaEdit className="me-2" /> {isArabic ? 'تعديل الملف' : 'Edit Profile'}</>
          )}
        </Button>
      </div>

      {showAlert && (
        <Alert variant="warning" onClose={() => setShowAlert(false)} dismissible>
          {alertMessage}
        </Alert>
      )}

      <Card className="shadow-sm border-0">
        <Card.Body>
          {/* ===== PROFILE AVATAR WITH ROLE ===== */}
          <div className="text-center mb-4">
            <div className="profile-avatar-container">
              <div className="profile-avatar" style={{
                background: `linear-gradient(135deg, ${getRoleColor()}, ${getRoleColor()}cc)`
              }}>
                {profileImage ? (
                  <Image 
                    src={profileImage} 
                    alt={formData.name || 'Profile'} 
                    className="profile-avatar-img"
                    roundedCircle
                    fluid
                  />
                ) : tempImage ? (
                  <Image 
                    src={tempImage} 
                    alt="Preview" 
                    className="profile-avatar-img"
                    roundedCircle
                    fluid
                  />
                ) : (
                  <span className="profile-avatar-text">
                    {getInitials(formData.name)}
                  </span>
                )}
                
                {/* Upload overlay */}
                <div className="profile-avatar-overlay">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="profile-avatar-input"
                    disabled={isUploading}
                  />
                  <div className="profile-avatar-actions">
                    {!profileImage && !tempImage ? (
                      <FaCamera className="avatar-icon" />
                    ) : tempImage ? (
                      <div className="d-flex gap-2">
                        <button 
                          className="avatar-action-btn save-btn"
                          onClick={saveProfileImage}
                          disabled={isUploading}
                          title={isArabic ? 'حفظ الصورة' : 'Save image'}
                        >
                          {isUploading ? <FaSpinner className="spinning" /> : <FaSave />}
                        </button>
                        <button 
                          className="avatar-action-btn cancel-btn"
                          onClick={cancelImageUpload}
                          title={isArabic ? 'إلغاء' : 'Cancel'}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    ) : (
                      <div className="d-flex gap-2">
                        <FaCamera className="avatar-icon" />
                        <button 
                          className="avatar-action-btn remove-btn"
                          onClick={removeProfileImage}
                          title={isArabic ? 'حذف الصورة' : 'Remove image'}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <h5 className="mt-3">{formData.name || (isArabic ? 'المستخدم' : 'User')}</h5>
            <Badge bg="primary" className="mt-1" style={{ fontSize: '0.85rem', padding: '6px 16px' }}>
              {getRoleDisplayName()}
            </Badge>
            <p className="text-muted small mt-2">
              {isArabic ? 'آخر تحديث: اليوم' : 'Last updated: Today'}
            </p>
            <small className="text-muted d-block">
              {isArabic ? 'اضغط على الصورة لتغييرها' : 'Click on the image to change it'}
            </small>
          </div>

          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaUser className="me-2 text-primary" />
                    {isArabic ? 'الاسم الكامل' : 'Full Name'}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder={isArabic ? 'أدخل الاسم الكامل' : 'Enter full name'}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaEnvelope className="me-2 text-primary" />
                    {isArabic ? 'البريد الإلكتروني' : 'Email'}
                  </Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder={isArabic ? 'أدخل البريد الإلكتروني' : 'Enter email'}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaPhone className="me-2 text-primary" />
                    {isArabic ? 'رقم الهاتف' : 'Phone Number'}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder={isArabic ? 'أدخل رقم الهاتف' : 'Enter phone number'}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaMapMarkerAlt className="me-2 text-primary" />
                    {isArabic ? 'العنوان' : 'Address'}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder={isArabic ? 'أدخل العنوان' : 'Enter address'}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    {isArabic ? 'الدور' : 'Role'}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={getRoleDisplayName()}
                    disabled
                    className="bg-light"
                    style={{ fontWeight: '600' }}
                  />
                  <Form.Text className="text-muted">
                    {isArabic ? 'هذا هو دورك في النظام' : 'This is your role in the system'}
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            {isEditing && (
              <div className="d-flex gap-2 mt-3">
                <Button type="submit" variant="primary">
                  <FaSave className="me-2" /> {isArabic ? 'حفظ التغييرات' : 'Save Changes'}
                </Button>
                <Button variant="secondary" onClick={() => setIsEditing(false)}>
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </Button>
              </div>
            )}
          </Form>

          {!isEditing && (
            <div className="mt-3 text-muted small">
              <p>{isArabic ? 'انقر على زر "تعديل الملف" لتحديث معلوماتك.' : 'Click the "Edit Profile" button to update your information.'}</p>
            </div>
          )}
        </Card.Body>
      </Card>

      <style>{`
        .profile-page {
          padding: 0;
        }

        .profile-avatar-container {
          display: flex;
          justify-content: center;
        }

        .profile-avatar {
          width: 130px;
          height: 130px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          box-shadow: 0 8px 30px rgba(0,0,0,0.2);
          cursor: pointer;
          overflow: hidden;
          transition: all 0.3s ease;
          flex-shrink: 0;
        }

        .profile-avatar:hover {
          transform: scale(1.02);
          box-shadow: 0 12px 40px rgba(0,0,0,0.3);
        }

        .profile-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }

        .profile-avatar-text {
          font-size: 3rem;
          font-weight: 700;
          color: white;
          text-shadow: 0 2px 10px rgba(0,0,0,0.2);
        }

        .profile-avatar-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 50%;
          background: rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: all 0.3s ease;
        }

        .profile-avatar:hover .profile-avatar-overlay {
          opacity: 1;
        }

        .profile-avatar-input {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
          z-index: 2;
        }

        .profile-avatar-actions {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          z-index: 1;
        }

        .avatar-icon {
          font-size: 2rem;
          color: white;
          opacity: 0.9;
          filter: drop-shadow(0 2px 8px rgba(0,0,0,0.3));
        }

        .avatar-action-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
          transition: all 0.3s ease;
          cursor: pointer;
          background: rgba(255,255,255,0.9);
          color: #2d3436;
        }

        .avatar-action-btn:hover {
          transform: scale(1.1);
        }

        .avatar-action-btn.save-btn {
          background: #2ecc71;
          color: white;
        }

        .avatar-action-btn.save-btn:hover {
          background: #27ae60;
        }

        .avatar-action-btn.cancel-btn {
          background: #e74c3c;
          color: white;
        }

        .avatar-action-btn.cancel-btn:hover {
          background: #c0392b;
        }

        .avatar-action-btn.remove-btn {
          background: #e74c3c;
          color: white;
          width: 30px;
          height: 30px;
          font-size: 0.7rem;
        }

        .avatar-action-btn.remove-btn:hover {
          background: #c0392b;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .profile-avatar {
            width: 110px;
            height: 110px;
          }
          .profile-avatar-text {
            font-size: 2.5rem;
          }
          .avatar-icon {
            font-size: 1.5rem;
          }
          .avatar-action-btn {
            width: 32px;
            height: 32px;
            font-size: 0.8rem;
          }
        }

        @media (max-width: 576px) {
          .profile-avatar {
            width: 90px;
            height: 90px;
          }
          .profile-avatar-text {
            font-size: 2rem;
          }
          .avatar-icon {
            font-size: 1.2rem;
          }
          .avatar-action-btn {
            width: 28px;
            height: 28px;
            font-size: 0.7rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Profile;