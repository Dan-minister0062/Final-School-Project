// src/utils/constants.js

// Storage Keys for localStorage
export const STORAGE_KEYS = {
  USERS: 'school_users',
  STUDENTS: 'school_students',
  CLASSES: 'school_classes',
  SUBJECTS: 'school_subjects',
  TEACHERS: 'school_teachers',
  ASSESSMENTS: 'school_assessments',
  GRADES: 'school_grades',
  ATTENDANCE: 'school_attendance',
  NOTIFICATIONS: 'school_notifications',
  TEACHER_ASSIGNMENTS: 'teacher_assignments',
  USER_PROFILE: 'userProfile',
  TEACHER_PROFILE: 'teacherProfile',
  SCHOOL_SETTINGS: 'schoolSettings',
  DASHBOARD_NOTIFICATIONS: 'dashboard_notifications',
  REGISTRATIONS: 'school_registrations',
  ANNOUNCEMENTS: 'school_announcements',
  PAYMENTS: 'school_payments',
  PARENTS: 'school_parents',
  ADMISSIONS: 'school_admissions'
};

// Assessment Types
export const ASSESSMENT_TYPES = [
  { id: 'homework', label: 'Homework', labelAr: 'واجب منزلي' },
  { id: 'assignment', label: 'Assignment', labelAr: 'مشروع' },
  { id: 'quiz', label: 'Quiz', labelAr: 'اختبار قصير' },
  { id: 'test', label: 'Test', labelAr: 'اختبار' },
  { id: 'exam', label: 'Exam', labelAr: 'امتحان' },
  { id: 'project', label: 'Project', labelAr: 'مشروع' },
  { id: 'classwork', label: 'Classwork', labelAr: 'عمل صفي' }
];

// Attendance Statuses
export const ATTENDANCE_STATUSES = [
  { id: 'present', label: 'Present', labelAr: 'حاضر', color: 'success' },
  { id: 'absent', label: 'Absent', labelAr: 'غائب', color: 'danger' },
  { id: 'late', label: 'Late', labelAr: 'متأخر', color: 'warning' },
  { id: 'excused', label: 'Excused', labelAr: 'معذور', color: 'info' }
];

// Notification Types
export const NOTIFICATION_TYPES = [
  { id: 'announcement', label: 'Announcement', labelAr: 'إعلان', icon: '📢' },
  { id: 'assignment', label: 'Assignment', labelAr: 'واجب', icon: '📝' },
  { id: 'class', label: 'Class Update', labelAr: 'تحديث فصل', icon: '🏫' },
  { id: 'student', label: 'Student Update', labelAr: 'تحديث طالب', icon: '👨‍🎓' },
  { id: 'assessment', label: 'Assessment', labelAr: 'تقييم', icon: '📊' },
  { id: 'reminder', label: 'Reminder', labelAr: 'تذكير', icon: '⏰' },
  { id: 'registration', label: 'Registration', labelAr: 'تسجيل', icon: '📋' },
  { id: 'submission', label: 'Submission', labelAr: 'تسليم', icon: '📤' },
  { id: 'grade', label: 'Grade', labelAr: 'درجة', icon: '📈' },
  { id: 'attendance', label: 'Attendance', labelAr: 'حضور', icon: '✅' },
  { id: 'schedule', label: 'Schedule', labelAr: 'جدول', icon: '📅' },
  { id: 'system', label: 'System', labelAr: 'نظام', icon: '⚙️' },
  { id: 'general', label: 'General', labelAr: 'عام', icon: '📬' }
];

// Grading Scale
export const GRADING_SCALE = {
  'A+': { min: 90, max: 100, description: 'Excellent', descriptionAr: 'ممتاز' },
  'A': { min: 80, max: 89.99, description: 'Very Good', descriptionAr: 'جيد جداً' },
  'B+': { min: 75, max: 79.99, description: 'Good', descriptionAr: 'جيد' },
  'B': { min: 70, max: 74.99, description: 'Above Average', descriptionAr: 'فوق المتوسط' },
  'C+': { min: 60, max: 69.99, description: 'Average', descriptionAr: 'متوسط' },
  'C': { min: 50, max: 59.99, description: 'Below Average', descriptionAr: 'دون المتوسط' },
  'D': { min: 40, max: 49.99, description: 'Poor', descriptionAr: 'ضعيف' },
  'F': { min: 0, max: 39.99, description: 'Fail', descriptionAr: 'راسب' }
};

// User Roles
export const USER_ROLES = {
  DIRECTOR: 'director',
  ADMIN: 'admin',
  TEACHER: 'teacher',
  PARENT: 'parent',
  STUDENT: 'student'
};

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    FORGOT_PASSWORD: '/auth/forgot-password',
    CHANGE_PASSWORD: '/auth/change-password',
  },
  STUDENTS: '/students',
  TEACHERS: '/teachers',
  CLASSES: '/classes',
  ATTENDANCE: '/attendance',
  ASSESSMENTS: '/assessments',
  ANNOUNCEMENTS: '/announcements',
  REGISTRATIONS: '/registrations',
  PARENTS: '/parents',
  PROFILE: '/profile',
  DASHBOARD: '/dashboard',
  NOTIFICATIONS: '/notifications',
  SUBJECTS: '/subjects',
  PAYMENTS: '/payments',
  ADMISSIONS: '/admissions'
};

// School Levels
export const SCHOOL_LEVELS = {
  FREE_SCHOOL: {
    id: 'free_school',
    label: 'Free School',
    labelAr: 'مدرسة حرة',
    age: '3-5 years',
    description: 'Early childhood education program',
    descriptionAr: 'برنامج تعليم الطفولة المبكرة',
    icon: 'bi-star',
    grade: 'Free School'
  },
  NURSERY: {
    id: 'nursery',
    label: 'Nursery School',
    labelAr: 'روضة أطفال',
    age: '2-5 years',
    description: 'Foundation learning and social development',
    descriptionAr: 'التعلم الأساسي والتنمية الاجتماعية',
    icon: 'bi-book',
    grades: ['Nursery 1', 'Nursery 2']
  },
  PRIMARY: {
    id: 'primary',
    label: 'Primary School',
    labelAr: 'مدرسة ابتدائية',
    age: '6-11 years',
    description: 'Building strong academic foundations',
    descriptionAr: 'بناء أسس أكاديمية قوية',
    icon: 'bi-mortarboard',
    grades: ['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6']
  },
  SECONDARY: {
    id: 'secondary',
    label: 'Secondary School',
    labelAr: 'مدرسة إعدادية',
    age: '12-18 years',
    description: 'Preparing for higher education and careers',
    descriptionAr: 'التحضير للتعليم العالي والمهن',
    icon: 'bi-award',
    grades: ['Secondary 1', 'Secondary 2', 'Secondary 3', 'Secondary 4', 'Secondary 5', 'Secondary 6']
  }
};

// Attendance Status Constants
export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  EXCUSED: 'excused'
};

// Assessment Type Constants
export const ASSESSMENT_TYPES_MAP = {
  EXAM: 'exam',
  TEST: 'test',
  QUIZ: 'quiz',
  ASSIGNMENT: 'assignment',
  PROJECT: 'project',
  HOMEWORK: 'homework',
  CLASSWORK: 'classwork'
};

// Gender
export const GENDER = {
  MALE: 'male',
  FEMALE: 'female'
};

// Status
export const STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  GRADUATED: 'graduated',
  SUSPENDED: 'suspended'
};

// Assessment Status
export const ASSESSMENT_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  PENDING_MARKING: 'pending_marking',
  CLOSED: 'closed'
};

// Default Subjects by Level
export const SUBJECTS = {
  FREE_SCHOOL: ['Islamic Studies', 'Language Arts', 'Math', 'Science', 'Art & Craft', 'Physical Education'],
  NURSERY: ['Islamic Studies', 'Language Arts', 'Math', 'Science', 'Art & Craft', 'Physical Education'],
  PRIMARY: ['Islamic Studies', 'English', 'Mathematics', 'Science', 'Social Studies', 'ICT', 'Arabic'],
  SECONDARY: ['Islamic Studies', 'English', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'ICT', 'Arabic']
};

// School Programs
export const SCHOOL_PROGRAMS = {
  FREE_SCHOOL: 'free_school',
  NURSERY: 'nursery',
  PRIMARY: 'primary',
  SECONDARY: 'secondary'
};

// Helper function to get grade from percentage
export const getGradeFromPercentage = (percentage) => {
  for (const [grade, range] of Object.entries(GRADING_SCALE)) {
    if (percentage >= range.min && percentage <= range.max) {
      return grade;
    }
  }
  return 'F';
};

// Helper function to get grade description
export const getGradeDescription = (grade, isArabic = false) => {
  const scale = GRADING_SCALE[grade];
  if (!scale) return 'N/A';
  return isArabic ? scale.descriptionAr : scale.description;
};

// Helper function to get assessment type label
export const getAssessmentTypeLabel = (type, isArabic = false) => {
  const found = ASSESSMENT_TYPES.find(t => t.id === type);
  if (!found) return type;
  return isArabic ? found.labelAr : found.label;
};

// Helper function to get attendance status label
export const getAttendanceStatusLabel = (status, isArabic = false) => {
  const found = ATTENDANCE_STATUSES.find(s => s.id === status);
  if (!found) return status;
  return isArabic ? found.labelAr : found.label;
};

// Helper function to get attendance status color
export const getAttendanceStatusColor = (status) => {
  const found = ATTENDANCE_STATUSES.find(s => s.id === status);
  return found ? found.color : 'secondary';
};

// Helper function to get notification type label
export const getNotificationTypeLabel = (type, isArabic = false) => {
  const found = NOTIFICATION_TYPES.find(t => t.id === type);
  if (!found) return type;
  return isArabic ? found.labelAr : found.label;
};

// Helper function to get notification icon
export const getNotificationIcon = (type) => {
  const found = NOTIFICATION_TYPES.find(t => t.id === type);
  return found ? found.icon : '📬';
};

// Helper function to get school level label
export const getSchoolLevelLabel = (levelId, isArabic = false) => {
  const level = Object.values(SCHOOL_LEVELS).find(l => l.id === levelId);
  if (!level) return levelId;
  return isArabic ? level.labelAr : level.label;
};

// Export all as default for convenience
export default {
  STORAGE_KEYS,
  ASSESSMENT_TYPES,
  ATTENDANCE_STATUSES,
  NOTIFICATION_TYPES,
  GRADING_SCALE,
  USER_ROLES,
  API_ENDPOINTS,
  SCHOOL_LEVELS,
  ATTENDANCE_STATUS,
  ASSESSMENT_TYPES_MAP,
  GENDER,
  STATUS,
  ASSESSMENT_STATUS,
  SUBJECTS,
  SCHOOL_PROGRAMS,
  getGradeFromPercentage,
  getGradeDescription,
  getAssessmentTypeLabel,
  getAttendanceStatusLabel,
  getAttendanceStatusColor,
  getNotificationTypeLabel,
  getNotificationIcon,
  getSchoolLevelLabel
};