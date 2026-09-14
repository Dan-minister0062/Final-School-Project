// src/components/dashboard/teacher/TeacherProfile.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, Form, Button, Badge } from 'react-bootstrap';
import { FaSave, FaUserEdit, FaKey, FaChalkboardTeacher, FaBook, FaUserGraduate, FaCamera } from 'react-icons/fa';
import { useLanguage } from '../../../context/LanguageContext';
import { useNotification } from '../../../hooks/useNotification';
import { useAuth } from '../../../hooks/useAuth';
import { getInitials } from '../../../utils/helpers';
import api from '../../../services/api';
import { syncGet } from '../../../services/apiSync';

const TeacherProfile = () => {
  const { isArabic } = useLanguage();
  const { notify } = useNotification();
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    bio: user?.bio || '',
  });
  const [avatar, setAvatar] = useState(user?.avatar || null);
  const fileInputRef = useRef(null);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      notify(
        isArabic ? 'يرجى اختيار صورة بصيغة JPEG, PNG, GIF أو WEBP' : 'Please select a JPEG, PNG, GIF or WEBP image',
        'error'
      );
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      notify(
        isArabic ? 'حجم الصورة يجب أن لا يتجاوز 5 ميجابايت' : 'Image size must not exceed 5MB',
        'error'
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => setAvatar(event.target.result);
    reader.readAsDataURL(file);
  };
  const [passwords, setPasswords] = useState({
    current: '',
    next: '',
    confirm: '',
  });
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [assignedSubjects, setAssignedSubjects] = useState([]);
  const [studentCount, setStudentCount] = useState(0);
  const [teacherId, setTeacherId] = useState(null);

  useEffect(() => {
    // Get teacher ID from the authenticated user payload
    const getTeacherId = () => {
      if (user?.teacherId) return user.teacherId;
      if (user?.id) return user.id;
      return null;
    };

    const id = getTeacherId();
    setTeacherId(id);
    
    // Load teacher data with the found ID
    loadTeacherData(id);
  }, [user]);

  // Load teacher data function
  const loadTeacherData = async (id) => {
    console.log('📚 Loading teacher data for ID:', id);
    
    let classes = [];
    
    // The authenticated user payload (from /auth -> MySQL) is the source of
    // truth for the teacher's own profile, subjects and assigned classes.
    if (user?.role === 'teacher') {
      const authClasses = (user.assignedClasses || user.assigned_classes || []).map((cls) =>
        typeof cls === 'object' ? cls : { id: cls, name: cls }
      );
      if (authClasses.length > 0) {
        classes = authClasses;
        setAssignedClasses(authClasses);
      }
      if (Array.isArray(user.subjects) && user.subjects.length > 0) {
        setAssignedSubjects(user.subjects);
      } else if (user.subject) {
        setAssignedSubjects([user.subject]);
      }
    }
    
    // Resolve real class names + level and count roster students from MySQL
    // (via /api/classes and /api/students)
    try {
      const [classesRes, studentsRes] = await Promise.all([
        syncGet('/classes'),
        syncGet('/students'),
      ]);
      const classRows = Array.isArray(classesRes?.data) ? classesRes.data : [];
      const studentRows = Array.isArray(studentsRes?.data) ? studentsRes.data : [];

      const assignedIds = new Set(classes.map(c => String(c.id ?? c.code)));
      const namedClasses = classRows.filter(c => assignedIds.has(String(c.id ?? c.code)));
      if (namedClasses.length > 0) {
        const decorated = namedClasses.map(c => ({ id: c.id ?? c.code, name: c.name, level: c.level }));
        setAssignedClasses(decorated);
        classes = decorated;
      }

      const classCodes = new Set(namedClasses.length > 0
        ? namedClasses.map(c => String(c.id ?? c.code))
        : Array.from(assignedIds));
      setStudentCount(studentRows.filter(s => classCodes.has(String(s.class_code))).length);
    } catch (e) {
      console.warn('Error loading classes/students:', e);
    }
    
    setAssignedClasses(classes.length > 0 ? classes : assignedClasses);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Update profile in MySQL (via PUT /profile)
      await api.put('/profile', {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        address: profile.address,
        bio: profile.bio,
        avatar: avatar ?? null,
      });
      
      // Update identity in the app store
      if (updateUser) updateUser({ ...profile, avatar });
      
      notify(
        isArabic ? 'تم تحديث الملف الشخصي بنجاح' : 'Profile updated successfully',
        'success'
      );
    } catch (error) {
      notify(
        error.response?.data?.message ||
          (isArabic ? 'فشل تحديث الملف الشخصي' : 'Failed to update profile'),
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.next !== passwords.confirm) {
      notify(
        isArabic ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match',
        'error'
      );
      return;
    }
    if (passwords.next.length < 6) {
      notify(
        isArabic ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters',
        'error'
      );
      return;
    }
    setPwdLoading(true);
    try {
      // Change password in MySQL (via POST /auth/change-password)
      await api.post('/auth/change-password', {
        current_password: passwords.current,
        password: passwords.next,
        password_confirmation: passwords.confirm,
      });
      
      setPasswords({ current: '', next: '', confirm: '' });
      notify(
        isArabic ? 'تم تغيير كلمة المرور بنجاح' : 'Password changed successfully',
        'success'
      );
    } catch (error) {
      const errors = error.response?.data?.errors;
      const firstError = errors && typeof errors === 'object'
        ? Object.values(errors)[0]?.[0]
        : null;
      notify(
        firstError ||
          error.response?.data?.message ||
          (isArabic ? 'فشل تغيير كلمة المرور' : 'Failed to change password'),
        'error'
      );
    } finally {
      setPwdLoading(false);
    }
  };

  const getTeacherDisplayId = () => {
    return teacherId || user?.teacherId || user?.id || 'N/A';
  };

  const getDisplayName = () => {
    if (profile.name) return profile.name;
    if (user?.name) return user.name;
    if (user?.firstName && user?.lastName) return `${user.firstName} ${user.lastName}`;
    return 'Teacher';
  };

  return (
    <div className="teacher-profile">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold">{isArabic ? 'الملف الشخصي' : 'My Profile'}</h2>
          <p className="text-muted">{isArabic ? 'عرض وتحديث ملفك الشخصي' : 'View and update your profile'}</p>
        </div>
        <Button variant="primary" onClick={handleSave} disabled={loading}>
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              {isArabic ? 'جاري الحفظ...' : 'Saving...'}
            </>
          ) : (
            <>
              <FaSave className="me-2" /> {isArabic ? 'حفظ التغييرات' : 'Save Changes'}
            </>
          )}
        </Button>
      </div>

      <Row>
        <Col lg={4} md={12} className="mb-4">
          <Card className="shadow-sm border-0 text-center">
            <Card.Body className="py-4">
              <div className="profile-avatar-container mb-3">
                {avatar ? (
                  <div className="profile-avatar" style={{ background: 'linear-gradient(135deg, #2d6a4f, #1a5f7a)', overflow: 'hidden' }}>
                    <img
                      src={avatar}
                      alt={getDisplayName()}
                      className="profile-avatar-img"
                    />
                  </div>
                ) : (
                  <div className="profile-avatar" style={{ background: 'linear-gradient(135deg, #2d6a4f, #1a5f7a)' }}>
                    {getInitials(getDisplayName())}
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                hidden
                onChange={handleAvatarChange}
              />
              <Button size="sm" variant="outline-primary" className="mb-3" onClick={() => fileInputRef.current?.click()}>
                <FaCamera className="me-1" />
                {isArabic ? 'تغيير الصورة' : 'Change Photo'}
              </Button>
              <h5 className="fw-bold">{getDisplayName()}</h5>
              <p className="text-muted">{profile.email || user?.email}</p>
              <Badge bg="primary" className="px-3 py-2">{isArabic ? 'معلم' : 'Teacher'}</Badge>
              <hr />
              <div className="text-start">
                <div className="d-flex justify-content-between py-1">
                  <span className="text-muted">{isArabic ? 'المعرف' : 'Teacher ID'}</span>
                  <span>{getTeacherDisplayId()}</span>
                </div>
                <div className="d-flex justify-content-between py-1">
                  <span className="text-muted">{isArabic ? 'الحالة' : 'Status'}</span>
                  <Badge bg="success" className="rounded-pill">{isArabic ? 'نشط' : 'Active'}</Badge>
                </div>
                <div className="d-flex justify-content-between py-1">
                  <span className="text-muted">{isArabic ? 'الفصول' : 'Classes'}</span>
                  <span>{assignedClasses.length}</span>
                </div>
                <div className="d-flex justify-content-between py-1">
                  <span className="text-muted">{isArabic ? 'الطلاب' : 'Students'}</span>
                  <span>{studentCount}</span>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Assigned Classes Summary */}
          <Card className="shadow-sm border-0 mt-3">
            <Card.Body>
              <h6 className="fw-bold mb-3">
                <FaChalkboardTeacher className="me-2 text-primary" />
                {isArabic ? 'الفصول المخصصة' : 'Assigned Classes'}
              </h6>
              {assignedClasses.length > 0 ? (
                assignedClasses.map((cls, index) => (
                  <div key={index} className="d-flex justify-content-between align-items-center py-1 border-bottom">
                    <span>{typeof cls === 'object' ? cls.name || cls.id || 'Class' : cls}</span>
                    <Badge bg="secondary">{typeof cls === 'object' ? cls.level || cls.educationLevel || 'N/A' : 'N/A'}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-muted text-center">
                  {isArabic ? 'لا توجد فصول مخصصة' : 'No classes assigned'}
                </p>
              )}
            </Card.Body>
          </Card>

          {/* Assigned Subjects Summary */}
          <Card className="shadow-sm border-0 mt-3">
            <Card.Body>
              <h6 className="fw-bold mb-3">
                <FaBook className="me-2 text-success" />
                {isArabic ? 'المواد المخصصة' : 'Assigned Subjects'}
              </h6>
              {assignedSubjects.length > 0 ? (
                assignedSubjects.map((subject, index) => (
                  <div key={index} className="d-flex justify-content-between align-items-center py-1 border-bottom">
                    <span>{typeof subject === 'object' ? subject.name || subject.value || 'Subject' : subject}</span>
                  </div>
                ))
              ) : (
                <p className="text-muted text-center">
                  {isArabic ? 'لا توجد مواد مخصصة' : 'No subjects assigned'}
                </p>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8} md={12}>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-transparent border-bottom">
              <h6 className="fw-bold mb-0">
                <FaUserEdit className="me-2 text-primary" />
                {isArabic ? 'معلومات الملف الشخصي' : 'Profile Information'}
              </h6>
            </Card.Header>
            <Card.Body>
              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>{isArabic ? 'الاسم الكامل' : 'Full Name'}</Form.Label>
                      <Form.Control 
                        type="text" 
                        name="name" 
                        value={profile.name} 
                        onChange={handleChange} 
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>{isArabic ? 'البريد الإلكتروني' : 'Email'}</Form.Label>
                      <Form.Control 
                        type="email" 
                        name="email" 
                        value={profile.email} 
                        onChange={handleChange} 
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>{isArabic ? 'رقم الهاتف' : 'Phone'}</Form.Label>
                      <Form.Control 
                        type="text" 
                        name="phone" 
                        value={profile.phone || ''} 
                        onChange={handleChange} 
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>{isArabic ? 'العنوان' : 'Address'}</Form.Label>
                      <Form.Control 
                        type="text" 
                        name="address" 
                        value={profile.address || ''} 
                        onChange={handleChange} 
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label>{isArabic ? 'نبذة عنك' : 'Bio'}</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="bio"
                    value={profile.bio || ''}
                    onChange={handleChange}
                    placeholder={isArabic ? 'اكتب نبذة عنك...' : 'Write something about yourself...'}
                  />
                </Form.Group>
              </Form>
            </Card.Body>
          </Card>

          <Card className="shadow-sm border-0 mt-4">
            <Card.Header className="bg-transparent border-bottom">
              <h6 className="fw-bold mb-0">
                <FaKey className="me-2 text-warning" />
                {isArabic ? 'تغيير كلمة المرور' : 'Change Password'}
              </h6>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleChangePassword}>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>{isArabic ? 'كلمة المرور الحالية' : 'Current Password'}</Form.Label>
                      <Form.Control 
                        type="password" 
                        name="current" 
                        value={passwords.current} 
                        onChange={handlePasswordChange} 
                        placeholder={isArabic ? 'أدخل كلمة المرور الحالية' : 'Enter current password'} 
                        required 
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>{isArabic ? 'كلمة المرور الجديدة' : 'New Password'}</Form.Label>
                      <Form.Control 
                        type="password" 
                        name="next" 
                        value={passwords.next} 
                        onChange={handlePasswordChange} 
                        placeholder={isArabic ? 'أدخل كلمة المرور الجديدة' : 'Enter new password'} 
                        minLength={6} 
                        required 
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>{isArabic ? 'تأكيد كلمة المرور' : 'Confirm Password'}</Form.Label>
                      <Form.Control 
                        type="password" 
                        name="confirm" 
                        value={passwords.confirm} 
                        onChange={handlePasswordChange} 
                        placeholder={isArabic ? 'أعد إدخال كلمة المرور' : 'Re-enter password'} 
                        minLength={6} 
                        required 
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Button variant="warning" className="text-white" type="submit" disabled={pwdLoading}>
                  {pwdLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      {isArabic ? 'جاري التغيير...' : 'Changing...'}
                    </>
                  ) : (
                    <>
                      <FaKey className="me-2" /> {isArabic ? 'تغيير كلمة المرور' : 'Change Password'}
                    </>
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>

          {/* Teaching Summary */}
          <Card className="shadow-sm border-0 mt-4">
            <Card.Header className="bg-transparent border-bottom">
              <h6 className="fw-bold mb-0">
                <FaBook className="me-2 text-success" />
                {isArabic ? 'ملخص التدريس' : 'Teaching Summary'}
              </h6>
            </Card.Header>
            <Card.Body>
              <Row className="text-center">
                <Col md={4}>
                  <h3 className="text-primary">{assignedClasses.length}</h3>
                  <p className="text-muted small">{isArabic ? 'الفصول' : 'Classes'}</p>
                </Col>
                <Col md={4}>
                  <h3 className="text-success">{studentCount}</h3>
                  <p className="text-muted small">{isArabic ? 'الطلاب' : 'Students'}</p>
                </Col>
                <Col md={4}>
                  <h3 className="text-warning">{assignedSubjects.length}</h3>
                  <p className="text-muted small">{isArabic ? 'المواد' : 'Subjects'}</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <style>{`
        .profile-avatar-container {
          display: flex;
          justify-content: center;
        }
        .profile-avatar {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
          font-weight: 700;
          color: white;
          border: 4px solid var(--border-color);
        }
        .dashboard-wrapper.rtl .profile-avatar {
          font-family: 'Traditional Arabic', 'Arabic Typesetting', serif;
        }
        .profile-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }
        @media (max-width: 768px) {
          .profile-avatar {
            width: 80px;
            height: 80px;
            font-size: 1.8rem;
          }
        }
      `}</style>
    </div>
  );
};

export default TeacherProfile;