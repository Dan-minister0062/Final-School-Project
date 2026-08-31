// src/components/dashboard/teacher/TeacherProfile.jsx
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Button, Badge } from 'react-bootstrap';
import { FaSave, FaUserEdit, FaKey, FaChalkboardTeacher, FaBook, FaUserGraduate } from 'react-icons/fa';
import { useLanguage } from '../../../context/LanguageContext';
import { useNotification } from '../../../hooks/useNotification';
import { useAuth } from '../../../hooks/useAuth';
import { getInitials } from '../../../utils/helpers';
import { teacherService } from '../../../services/teacherService';
import api from '../../../services/api';

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
    // Get teacher ID from user or localStorage
    const getTeacherId = () => {
      // Try to get from user object
      if (user?.teacherId) return user.teacherId;
      if (user?.id) return user.id;
      
      // Try from localStorage
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        try {
          const parsed = JSON.parse(currentUser);
          if (parsed.teacherId) return parsed.teacherId;
          if (parsed.id) return parsed.id;
        } catch (e) {}
      }
      
      const userId = localStorage.getItem('userId');
      if (userId) return userId;
      
      // Try to find teacher from school_teachers
      try {
        const teachers = JSON.parse(localStorage.getItem('school_teachers') || '[]');
        if (teachers.length > 0) {
          // If we have the user email, find matching teacher
          const email = user?.email || localStorage.getItem('userEmail');
          if (email) {
            const found = teachers.find(t => t.email === email);
            if (found) return found.id;
          }
          // If no email match, return first teacher (fallback)
          return teachers[0]?.id;
        }
      } catch (e) {}
      
      return null;
    };

    const id = getTeacherId();
    setTeacherId(id);
    
    // Load teacher data with the found ID
    loadTeacherData(id);
  }, [user]);

  // Load teacher data function
  const loadTeacherData = (id) => {
    console.log('📚 Loading teacher data for ID:', id);
    
    // Get classes - try multiple sources
    let classes = [];
    
    // Try to get from school_teachers first
    try {
      const teachers = JSON.parse(localStorage.getItem('school_teachers') || '[]');
      let teacher = null;
      
      if (id) {
        teacher = teachers.find(t => t.id === id);
      }
      
      // If not found by ID, try by email
      if (!teacher && user?.email) {
        teacher = teachers.find(t => t.email === user.email);
      }
      
      if (teacher) {
        console.log('✅ Teacher found in school_teachers:', teacher);
        
        // Get assigned classes
        if (teacher.assignedClasses && Array.isArray(teacher.assignedClasses)) {
          classes = teacher.assignedClasses.map(cls => {
            if (typeof cls === 'object') return cls;
            return { id: cls, name: cls };
          });
        } else if (teacher.classes && Array.isArray(teacher.classes)) {
          classes = teacher.classes.map(cls => {
            if (typeof cls === 'object') return cls;
            return { id: cls, name: cls };
          });
        }
        
        // Get assigned subjects
        if (teacher.subjects && Array.isArray(teacher.subjects)) {
          setAssignedSubjects(teacher.subjects);
        } else if (teacher.subject) {
          setAssignedSubjects([teacher.subject]);
        }
        
        // Update profile with teacher data
        setProfile({
          name: teacher.name || teacher.firstName + ' ' + teacher.lastName || '',
          email: teacher.email || '',
          phone: teacher.phone || '',
          address: teacher.address || '',
          bio: teacher.bio || '',
        });
      }
    } catch (e) {
      console.warn('Error loading from school_teachers:', e);
    }
    
    // If no classes found, try school_users
    if (classes.length === 0) {
      try {
        const users = JSON.parse(localStorage.getItem('school_users') || '[]');
        let userData = null;
        
        if (id) {
          userData = users.find(u => u.id === id);
        }
        if (!userData && user?.email) {
          userData = users.find(u => u.email === user.email);
        }
        
        if (userData && userData.role === 'teacher') {
          console.log('✅ Teacher found in school_users:', userData);
          
          if (userData.assignedClasses && Array.isArray(userData.assignedClasses)) {
            classes = userData.assignedClasses.map(cls => {
              if (typeof cls === 'object') return cls;
              return { id: cls, name: cls };
            });
          }
          
          if (userData.subjects && Array.isArray(userData.subjects)) {
            setAssignedSubjects(userData.subjects);
          }
        }
      } catch (e) {
        console.warn('Error loading from school_users:', e);
      }
    }
    
    // If still no classes, try teacherService
    if (classes.length === 0) {
      try {
        const serviceClasses = teacherService.getAssignedClasses();
        if (serviceClasses && serviceClasses.length > 0) {
          classes = serviceClasses;
        }
      } catch (e) {
        console.warn('Error loading from teacherService:', e);
      }
    }
    
    setAssignedClasses(classes);
    setStudentCount(classes.length * 5); // Estimate: 5 students per class
    
    // Load saved profile from localStorage
    const savedProfile = localStorage.getItem('teacherProfile');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        setProfile(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Error loading profile:', e);
      }
    }
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
      const token = localStorage.getItem('token');
      const isDemo = !token || token.startsWith('demo-');
      
      if (!isDemo) {
        try {
          await api.put('/profile', {
            name: profile.name,
            email: profile.email,
            phone: profile.phone,
            address: profile.address,
            bio: profile.bio,
          });
        } catch (apiError) {
          console.warn('API update failed, saving locally:', apiError);
        }
      }
      
      // Update local storage
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const updatedUser = { ...currentUser, ...profile };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      // Update school_teachers if teacher exists
      try {
        const teachers = JSON.parse(localStorage.getItem('school_teachers') || '[]');
        const teacherIndex = teachers.findIndex(t => t.id === teacherId || t.email === user?.email);
        if (teacherIndex !== -1) {
          teachers[teacherIndex] = { ...teachers[teacherIndex], ...profile };
          localStorage.setItem('school_teachers', JSON.stringify(teachers));
        }
      } catch (e) {}
      
      // Update school_users
      try {
        const users = JSON.parse(localStorage.getItem('school_users') || '[]');
        const userIndex = users.findIndex(u => u.id === teacherId || u.email === user?.email);
        if (userIndex !== -1) {
          users[userIndex] = { ...users[userIndex], ...profile };
          localStorage.setItem('school_users', JSON.stringify(users));
        }
      } catch (e) {}
      
      if (updateUser) updateUser(profile);
      localStorage.setItem('teacherProfile', JSON.stringify(profile));
      
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
      // Try API first
      try {
        await api.post('/auth/change-password', {
          current_password: passwords.current,
          password: passwords.next,
          password_confirmation: passwords.confirm,
        });
      } catch (apiError) {
        console.warn('API password change failed, saving locally:', apiError);
      }
      
      // Update local storage
      const users = JSON.parse(localStorage.getItem('school_users') || '[]');
      const userIndex = users.findIndex(u => u.id === teacherId || u.email === user?.email);
      if (userIndex !== -1) {
        users[userIndex].password = passwords.next;
        localStorage.setItem('school_users', JSON.stringify(users));
      }
      
      // Update teachers
      const teachers = JSON.parse(localStorage.getItem('school_teachers') || '[]');
      const teacherIndex = teachers.findIndex(t => t.id === teacherId || t.email === user?.email);
      if (teacherIndex !== -1) {
        teachers[teacherIndex].password = passwords.next;
        localStorage.setItem('school_teachers', JSON.stringify(teachers));
      }
      
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
                <div className="profile-avatar" style={{ background: 'linear-gradient(135deg, #2d6a4f, #1a5f7a)' }}>
                  {getInitials(getDisplayName())}
                </div>
              </div>
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