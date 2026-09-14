// src/services/teacherService.js

/**
 * Teacher Service
 * Handles all teacher-related operations including fetching assigned classes and students
 */

import { getAuthIdentity } from './api';

// In-memory cache (no browser persistence). Server data always comes from the
// Laravel API in real time, so the cache only serves transient response reads.
const memoryCache = new Map();

// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====
// ===== EVENT LISTENER SYSTEM =====
// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====

let listeners = [];

const notifyListeners = (data) => {
  console.log(`📢 Notifying ${listeners.length} teacher listeners:`, data);
  listeners.forEach(listener => {
    try {
      listener(data);
    } catch (error) {
      console.error('❌ Error in teacher listener:', error);
    }
  });
};

// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====
// ===== HELPER FUNCTIONS =====
// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====

const getFromStorage = (key, defaultValue = []) => {
  try {
    return memoryCache.has(key) ? memoryCache.get(key) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from cache:`, error);
    return defaultValue;
  }
};

const saveToStorage = (key, data) => {
  try {
    memoryCache.set(key, data);
    return true;
  } catch (error) {
    console.error(`Error saving to ${key}:`, error);
    return false;
  }
};

// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====
// ===== CLASS NAME LOCALIZATION =====
// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====

/**
 * Get the localized class names based on language
 * @param {string} language - 'ar' or 'en'
 * @returns {Object} Class names mapping
 */
const getClassNamesMap = (language = 'en') => {
  const isArabic = language === 'ar';
  
  if (isArabic) {
    return {
      kindergarten: ['الاستئناس', 'التمهيدي الأول -أ-', 'التمهيدي الأول -ب-', 'التمهيدي الثاني -أ-', 'التمهيدي الثاني -ب-'],
      primary: ['الأول -أ-', 'الأول -ب-', 'الثاني -أ-', 'الثاني -ب-', 'الثالث -أ-', 'الثالث -ب-', 'الرابع -أ-', 'الرابع -ب-', 'الخامس -أ-', 'الخامس -ب-', 'السادس -أ-', 'السادس -ب-'],
      secondary: ['الأولى إعدادي -أ-', 'الأولى إعدادي -ب-', 'الثانية إعدادي -أ-', 'الثانية إعدادي -ب-', 'الثالثة إعدادي -أ-', 'الثالثة إعدادي -ب-'],
      high_school: ['جذع مشترك علمي', 'الأولى باكالوريا علوم تجريبية', 'الثانية باكالوريا علوم فيزيائية']
    };
  } else {
    return {
      kindergarten: ['Introductory', 'Preparatory 1 -A-', 'Preparatory 1 -B-', 'Preparatory 2 -A-', 'Preparatory 2 -B-'],
      primary: ['1 -A-', '1 -B-', '2 -A-', '2 -B-', '3 -A-', '3 -B-', '4 -A-', '4 -B-', '5 -A-', '5 -B-', '6 -A-', '6 -B-'],
      secondary: ['Secondary 1 -A-', 'Secondary 1 -B-', 'Secondary 2 -A-', 'Secondary 2 -B-', 'Secondary 3 -A-', 'Secondary 3 -B-'],
      high_school: ['Common Core Science', '1st Baccalaureate Experimental Sciences', '2nd Baccalaureate Physical Sciences']
    };
  }
};

/**
 * Get the localized name for a class
 * @param {string} className - The class name to localize
 * @param {string} level - The class level
 * @param {string} language - 'ar' or 'en'
 * @returns {string} Localized class name
 */
const getLocalizedClassName = (className, level, language = 'en') => {
  const isArabic = language === 'ar';
  
  // If not Arabic, return as is (or convert to English if needed)
  if (!isArabic) {
    // Check if the name is in Arabic and need to convert to English
    if (/[\u0600-\u06FF]/.test(className)) {
      // Try to find the English equivalent
      const classNamesMap = getClassNamesMap('en');
      const levelNames = classNamesMap[level] || [];
      
      // Check if any Arabic name matches
      const arabicNamesMap = getClassNamesMap('ar');
      const arabicLevelNames = arabicNamesMap[level] || [];
      
      for (let i = 0; i < arabicLevelNames.length; i++) {
        if (arabicLevelNames[i] === className && levelNames[i]) {
          return levelNames[i];
        }
      }
    }
    return className;
  }
  
  // If already in Arabic, return as is
  if (/[\u0600-\u06FF]/.test(className)) return className;
  
  const classNamesMap = getClassNamesMap('ar');
  const levelNames = classNamesMap[level] || [];
  
  // Try to find a match
  for (const arabicName of levelNames) {
    // Check if the class name matches any pattern
    const cleanClassName = className.replace(/\s*-\s*/g, '-').toLowerCase();
    const cleanArabicName = arabicName.replace(/\s*-\s*/g, '-').toLowerCase();
    
    // Check for exact match or partial match
    if (cleanClassName === cleanArabicName || 
        cleanClassName.includes(cleanArabicName) || 
        cleanArabicName.includes(cleanClassName)) {
      return arabicName;
    }
    
    // Check for number-based matching (e.g., "1 -A-" matches "الأول -أ-")
    const numberMatch = className.match(/(\d+)\s*-?\s*([A-Z])/i);
    if (numberMatch) {
      const num = parseInt(numberMatch[1]);
      const letter = numberMatch[2].toUpperCase();
      
      // Check if the Arabic name contains the right number and letter
      const arabicNumber = arabicName.includes('الأول') ? '1' : 
                          arabicName.includes('الثاني') ? '2' : 
                          arabicName.includes('الثالث') ? '3' : 
                          arabicName.includes('الرابع') ? '4' : 
                          arabicName.includes('الخامس') ? '5' : 
                          arabicName.includes('السادس') ? '6' : 
                          arabicName.includes('الأولى') ? '1' :
                          arabicName.includes('الثانية') ? '2' :
                          arabicName.includes('الثالثة') ? '3' : null;
      
      if (arabicNumber && parseInt(arabicNumber) === num && arabicName.includes(`-${letter}-`)) {
        return arabicName;
      }
    }
  }
  
  // If no match found, return the original
  return className;
};

/**
 * Get the current language from the document
 * @returns {string} 'ar' or 'en'
 */
const getCurrentLanguage = () => {
  try {
    const lang = document.documentElement.lang;
    return lang === 'ar' ? 'ar' : 'en';
  } catch {
    return 'en';
  }
};

// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====
// ===== GET CURRENT TEACHER =====
// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====

/**
 * Get the currently logged in teacher
 * @returns {Object|null} The teacher object or null if not found
 */
const getCurrentTeacher = () => {
  try {
    console.log('🔍 Looking for current teacher...');

    // The real authenticated user (from /auth/login -> MySQL session) is the
    // source of truth and already carries role, id, assigned classes etc.
    const authUser = getAuthIdentity();
    if (authUser && authUser.role === 'teacher') {
      console.log('✅ Current teacher found from auth user:', authUser.id, authUser.name);
      return authUser;
    }

    // Fall back to any teacher held in the in-memory cache.
    const users = getFromStorage('school_users');
    const teacher = users.find(u => u.role === 'teacher');
    if (teacher) {
      console.log('✅ Teacher found in school_users:', teacher.id);
      return teacher;
    }

    console.warn('⚠️ No current teacher found after all checks');
    return null;
  } catch (error) {
    console.error('❌ Error getting current teacher:', error);
    return null;
  }
};

/**
 * Set the current teacher in memory
 * @param {Object} teacher - The teacher object
 */
const setCurrentTeacher = (teacher) => {
  try {
    if (!teacher) {
      console.warn('⚠️ No teacher provided to set as current');
      return false;
    }

    saveToStorage('currentUser', teacher);
    console.log('✅ Current teacher set:', teacher.id);

    // Notify listeners
    notifyListeners({ type: 'login', teacher });

    return true;
  } catch (error) {
    console.error('❌ Error setting current teacher:', error);
    return false;
  }
};

/**
 * Logout the current teacher
 */
const logoutTeacher = () => {
  try {
    memoryCache.delete('currentUser');
    console.log('✅ Teacher logged out');

    // Notify listeners
    notifyListeners({ type: 'logout' });

    return true;
  } catch (error) {
    console.error('❌ Error logging out teacher:', error);
    return false;
  }
};

// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====
// ===== GET ASSIGNED CLASSES =====
// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====

/**
 * Get all assigned classes for a teacher with localized names
 * @param {string} teacherId - The teacher's ID
 * @param {Array} allClasses - Optional: all classes
 * @param {string} language - Optional: language code ('ar' or 'en')
 * @returns {Array} Array of class objects with localized names
 */
const getAssignedClasses = (teacherId, allClasses = null, language = null) => {
  try {
    console.log(`📚 Getting assigned classes for teacher: ${teacherId}`);
    
    // Get current language if not provided
    if (!language) {
      language = getCurrentLanguage();
    }
    
    // Resolve the teacher: school_users (server-mapped list) or the raw
    // authenticated teacher payload (from /auth -> MySQL).
    if (teacherId == null) {
      const current = getCurrentTeacher();
      if (current) teacherId = current.id;
    }
    const users = getFromStorage('school_users');
    let teacher = users.find(u => u.id === teacherId || String(u._serverId) === String(teacherId));
    if (!teacher && teacherId != null) {
      const authUser = getFromStorage('user');
      if (authUser && authUser.role === 'teacher' && String(authUser.id) === String(teacherId)) {
        teacher = authUser;
      }
    }
    
    if (!teacher) {
      console.warn(`⚠️ Teacher not found: ${teacherId}`);
      return [];
    }
    
    // Get assigned class IDs from teacher - check multiple possible locations
    let assignedClassIds = teacher.assignedClasses || teacher.assigned_classes || teacher.classes || teacher.classIds || [];
    
    // If assignedClassIds is empty, try to get from school_teachers
    if (!assignedClassIds || assignedClassIds.length === 0) {
      const teachers = getFromStorage('school_teachers');
      const teacherFromTeachers = teachers.find(t => t.id === teacherId);
      if (teacherFromTeachers) {
        assignedClassIds = teacherFromTeachers.assignedClasses || teacherFromTeachers.classes || [];
        console.log(`📚 Found assigned classes from school_teachers:`, assignedClassIds);
      }
    }
    
    console.log(`📚 Teacher assigned class IDs:`, assignedClassIds);
    
    if (!assignedClassIds || assignedClassIds.length === 0) {
      console.warn(`⚠️ No assigned classes for teacher: ${teacherId}`);
      return [];
    }
    
    // Get all classes
    const classes = allClasses || getFromStorage('school_classes');
    console.log(`📚 All classes count: ${classes.length}`);
    console.log(`📚 All class IDs:`, classes.map(c => c.id));
    console.log(`📚 All class names:`, classes.map(c => c.name));
    
    // Filter classes by matching IDs and localize names
    const assignedClasses = classes
      .filter(cls => assignedClassIds.includes(cls.id))
      .map(cls => {
        // Localize the class name
        const localizedName = getLocalizedClassName(cls.name, cls.level, language);
        console.log(`🔄 Localizing class: "${cls.name}" -> "${localizedName}" (${language})`);
        
        return {
          ...cls,
          name: localizedName,
          originalName: cls.name, // Keep original for reference
        };
      });
    
    console.log(`📚 Filtered assigned classes: ${assignedClasses.length}`);
    console.log(`📚 Assigned class names (localized):`, assignedClasses.map(c => c.name));
    
    return assignedClasses;
  } catch (error) {
    console.error('❌ Error getting assigned classes:', error);
    return [];
  }
};

// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====
// ===== GET ASSIGNED STUDENTS =====
// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====

/**
 * Get all students in the teacher's assigned classes
 * @param {string} teacherId - The teacher's ID
 * @param {Array} assignedClasses - Optional: pre-fetched assigned classes
 * @returns {Array} Array of student objects
 */
const getAssignedStudents = (teacherId, assignedClasses = null) => {
  try {
    console.log(`📚 Getting assigned students for teacher: ${teacherId}`);
    
    // Get the teacher's assigned classes if not provided
    const classes = assignedClasses || getAssignedClasses(teacherId);
    
    if (!classes || classes.length === 0) {
      console.warn('⚠️ No assigned classes found');
      return [];
    }
    
    // Get all students (MySQL-backed roster seeded from /students; fall back to
    // the users-derived store, deduped by id).
    const allStudents = [
      ...getFromStorage('students_roster'),
      ...getFromStorage('school_students'),
    ];
    const seen = new Set();
    const students = allStudents.filter((s) => {
      const id = String(s?._serverId ?? s?.id ?? s?.email ?? "");
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
    console.log(`📚 Total students: ${students.length}`);
    
    // Get class IDs from assigned classes
    const classIds = classes.map(c => c.id);
    console.log(`📚 Assigned class IDs:`, classIds);
    
    // Filter students by class ID
    const assignedStudents = students.filter(student => {
      const studentClassId = student.classId || student.class || student.class_id || student.class_name;
      const isInClass = classIds.includes(studentClassId);
      if (isInClass) {
        console.log(`✅ Found student in assigned class: ${student.name || student.firstName || 'Unknown'} (${studentClassId})`);
      }
      return isInClass;
    });
    
    console.log(`📚 Assigned students: ${assignedStudents.length}`);
    return assignedStudents;
  } catch (error) {
    console.error('❌ Error getting assigned students:', error);
    return [];
  }
};

// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====
// ===== GET TEACHER WITH DATA =====
// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====

/**
 * Get a teacher by ID with all their assigned data
 * @param {string} teacherId - The teacher's ID
 * @param {string} language - Optional: language code ('ar' or 'en')
 * @returns {Object} Teacher object with assigned classes and students
 */
const getTeacherWithData = (teacherId, language = null) => {
  try {
    console.log(`📚 Getting teacher with data: ${teacherId}`);
    
    // Get current language if not provided
    if (!language) {
      language = getCurrentLanguage();
    }
    
    // Get the teacher from users (fall back to the authenticated teacher
    // payload which carries assigned_classes/subjects straight from MySQL).
    const users = getFromStorage('school_users');
    let teacher = users.find(u => u.id === teacherId || String(u._serverId) === String(teacherId));
    if (!teacher && teacherId != null) {
      const authUser = getFromStorage('user');
      if (authUser && authUser.role === 'teacher' && String(authUser.id) === String(teacherId)) {
        teacher = authUser;
      }
    }
    
    if (!teacher) {
      console.warn(`⚠️ Teacher not found: ${teacherId}`);
      return null;
    }
    
    // Get assigned classes with localization
    const assignedClasses = getAssignedClasses(teacherId, null, language);
    
    // Get assigned students
    const assignedStudents = getAssignedStudents(teacherId, assignedClasses);
    
    // Build the complete teacher object
    const teacherWithData = {
      ...teacher,
      assignedClasses: assignedClasses,
      assignedStudents: assignedStudents,
      assignedClassIds: assignedClasses.map(c => c.id),
      assignedClassNames: assignedClasses.map(c => c.name),
      totalStudents: assignedStudents.length,
      totalClasses: assignedClasses.length,
    };
    
    console.log(`✅ Teacher with data:`, {
      id: teacherWithData.id,
      name: teacherWithData.name,
      totalClasses: teacherWithData.totalClasses,
      totalStudents: teacherWithData.totalStudents,
      classNames: teacherWithData.assignedClassNames,
    });
    
    return teacherWithData;
  } catch (error) {
    console.error('❌ Error getting teacher with data:', error);
    return null;
  }
};

// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====
// ===== GET TEACHER STATS =====
// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====

/**
 * Get teacher dashboard statistics
 * @param {string} teacherId - The teacher's ID
 * @param {string} language - Optional: language code ('ar' or 'en')
 * @returns {Object} Statistics object
 */
const getDashboardStats = (teacherId, language = null) => {
  try {
    console.log(`📊 Getting dashboard stats for teacher: ${teacherId || 'current'}`);
    
    // Get current language if not provided
    if (!language) {
      language = getCurrentLanguage();
    }
    
    // If no teacherId provided, get current teacher
    if (!teacherId) {
      const currentTeacher = getCurrentTeacher();
      if (!currentTeacher) {
        console.warn('⚠️ No current teacher found for stats');
        return {
          totalClasses: 0,
          totalStudents: 0,
          activeAssessments: 0,
          pendingMarking: 0,
          todayAttendance: 'N/A',
          unreadNotifications: 0,
        };
      }
      teacherId = currentTeacher.id;
    }
    
    const teacherWithData = getTeacherWithData(teacherId, language);
    
    if (!teacherWithData) {
      return {
        totalClasses: 0,
        totalStudents: 0,
        activeAssessments: 0,
        pendingMarking: 0,
        todayAttendance: 'N/A',
        unreadNotifications: 0,
      };
    }
    
    // Get assessments
    const assessments = getTeacherAssessments(teacherId);
    const activeAssessments = assessments.filter(a => a.status === 'published' || a.status === 'active').length;
    const pendingMarking = assessments.filter(a => a.status === 'submitted' || a.status === 'pending').length;
    
    // Get notifications
    const notifications = getTeacherNotifications(teacherId);
    const unreadNotifications = notifications.filter(n => !n.read).length;
    
    // Get today's attendance
    const todayAttendance = getTodayAttendance(teacherId);
    
    const stats = {
      totalClasses: teacherWithData.totalClasses,
      totalStudents: teacherWithData.totalStudents,
      activeAssessments: activeAssessments,
      pendingMarking: pendingMarking,
      todayAttendance: todayAttendance,
      unreadNotifications: unreadNotifications,
      classNames: teacherWithData.assignedClassNames,
      classIds: teacherWithData.assignedClassIds,
    };
    
    console.log(`📊 Teacher stats:`, stats);
    return stats;
  } catch (error) {
    console.error('❌ Error getting teacher stats:', error);
    return {
      totalClasses: 0,
      totalStudents: 0,
      activeAssessments: 0,
      pendingMarking: 0,
      todayAttendance: 'N/A',
      unreadNotifications: 0,
    };
  }
};

// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====
// ===== GET TEACHER ASSESSMENTS =====
// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====

/**
 * Get all assessments for a teacher
 * @param {string} teacherId - The teacher's ID
 * @returns {Array} Array of assessment objects
 */
const getTeacherAssessments = (teacherId) => {
  try {
    const assessments = getFromStorage('school_assessments');
    
    // If no teacherId, get current teacher
    if (!teacherId) {
      const currentTeacher = getCurrentTeacher();
      if (!currentTeacher) return [];
      teacherId = currentTeacher.id;
    }
    
    // Filter assessments by teacher ID (tolerant of numeric/local id forms)
    return assessments.filter(a =>
      a.teacherId === teacherId ||
      a.createdBy === teacherId ||
      String(a.teacherId) === String(teacherId) ||
      String(a.createdBy) === String(teacherId)
    );
  } catch (error) {
    console.error('❌ Error getting teacher assessments:', error);
    return [];
  }
};

// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====
// ===== GET TEACHER NOTIFICATIONS =====
// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====

/**
 * Get all notifications for a teacher
 * @param {string} teacherId - The teacher's ID
 * @returns {Array} Array of notification objects
 */
const getTeacherNotifications = (teacherId) => {
  try {
    const notifications = getFromStorage('school_notifications');
    
    // If no teacherId, get current teacher
    if (!teacherId) {
      const currentTeacher = getCurrentTeacher();
      if (!currentTeacher) return [];
      teacherId = currentTeacher.id;
    }
    
    // Server-synced notifications are already scoped server-side (no
    // recipient fields) — expose them as-is for the current teacher.
    const hasRecipients = notifications.some(n => n.recipientId !== undefined || n.recipientRole !== undefined);
    if (!hasRecipients) return notifications;

    // Legacy local-shaped notifications: filter by recipient
    return notifications.filter(n => 
      n.recipientId === teacherId || 
      n.recipientRole === 'teacher' ||
      n.recipientRole === 'all'
    );
  } catch (error) {
    console.error('❌ Error getting teacher notifications:', error);
    return [];
  }
};

// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====
// ===== GET TODAY'S ATTENDANCE =====
// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====

/**
 * Get today's attendance status for a teacher's classes
 * @param {string} teacherId - The teacher's ID
 * @returns {string} Attendance status
 */
const getTodayAttendance = (teacherId) => {
  try {
    const attendance = getFromStorage('school_attendance');
    const today = new Date().toISOString().split('T')[0];
    
    // If no teacherId, get current teacher
    if (!teacherId) {
      const currentTeacher = getCurrentTeacher();
      if (!currentTeacher) return 'N/A';
      teacherId = currentTeacher.id;
    }
    
    // Get teacher's assigned classes
    const assignedClasses = getAssignedClasses(teacherId);
    const classIds = assignedClasses.map(c => c.id);
    
    // Filter attendance for today and teacher's classes
    const todayAttendance = attendance.filter(a => 
      a.date === today && 
      classIds.includes(a.classId)
    );
    
    if (todayAttendance.length === 0) return 'Not Marked';
    
    // Calculate attendance percentage
    const totalStudents = todayAttendance.reduce((sum, a) => sum + (a.totalStudents || 0), 0);
    const presentStudents = todayAttendance.reduce((sum, a) => sum + (a.presentStudents || a.present || 0), 0);
    
    if (totalStudents === 0) return 'Not Marked';
    const percentage = Math.round((presentStudents / totalStudents) * 100);
    
    return `${percentage}%`;
  } catch (error) {
    console.error('❌ Error getting today attendance:', error);
    return 'N/A';
  }
};

// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====
// ===== NOTIFY TEACHER ABOUT NEW CLASS =====
// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====

/**
 * Send notification to teacher about a new class assignment
 * @param {string} teacherId - The teacher's ID
 * @param {string} className - The class name
 * @param {string} classId - The class ID
 */
const notifyTeacherAboutNewClass = (teacherId, className, classId) => {
  try {
    const notifications = getFromStorage('school_notifications');
    const notification = {
      id: `NOT${String(notifications.length + 1).padStart(3, '0')}`,
      title: '📚 New Class Assigned',
      message: `You have been assigned to class: ${className}`,
      type: 'class',
      read: false,
      recipientId: teacherId,
      recipientRole: 'teacher',
      createdAt: new Date().toISOString(),
      time: new Date().toLocaleString(),
      link: `/dashboard/teacher/classes/${classId}`,
    };
    notifications.push(notification);
    saveToStorage('school_notifications', notifications);
    console.log(`🔔 Notification sent to teacher about new class: ${className}`);
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('notificationAdded', { 
      detail: notification 
    }));
    
    // Notify listeners
    notifyListeners({ type: 'notification', data: notification });
  } catch (error) {
    console.error('Error sending notification to teacher:', error);
  }
};

// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====
// ===== UPDATE TEACHER ASSIGNED CLASSES =====
// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====

/**
 * Update a teacher's assigned classes
 * @param {string} teacherId - The teacher's ID
 * @param {Array} classIds - Array of class IDs to assign
 * @returns {boolean} Success status
 */
const updateTeacherClasses = (teacherId, classIds) => {
  try {
    console.log(`📚 Updating teacher ${teacherId} classes:`, classIds);
    
    // Update in school_users
    const users = getFromStorage('school_users');
    const userIndex = users.findIndex(u => u.id === teacherId);
    
    if (userIndex === -1) {
      console.warn(`⚠️ Teacher not found: ${teacherId}`);
      return false;
    }
    
    users[userIndex].assignedClasses = classIds;
    users[userIndex].classes = classIds;
    saveToStorage('school_users', users);
    
    // Update in school_teachers
    const teachers = getFromStorage('school_teachers');
    const teacherIndex = teachers.findIndex(t => t.id === teacherId);
    
    if (teacherIndex !== -1) {
      teachers[teacherIndex].assignedClasses = classIds;
      teachers[teacherIndex].classes = classIds;
      saveToStorage('school_teachers', teachers);
    }
    
    // Update classes to include teacher ID
    const classes = getFromStorage('school_classes');
    const updatedClasses = classes.map(cls => {
      if (classIds.includes(cls.id)) {
        const existingTeachers = cls.assignedTeachers || [];
        if (!existingTeachers.includes(teacherId)) {
          return {
            ...cls,
            teacherId: teacherId,
            assignedTeachers: [...existingTeachers, teacherId],
          };
        }
        return {
          ...cls,
          teacherId: teacherId,
          assignedTeachers: existingTeachers,
        };
      }
      return cls;
    });
    saveToStorage('school_classes', updatedClasses);
    
    console.log(`✅ Teacher ${teacherId} classes updated successfully`);
    
    // Notify listeners
    notifyListeners({ type: 'update', teacherId, classIds });
    
    return true;
  } catch (error) {
    console.error('❌ Error updating teacher classes:', error);
    return false;
  }
};

// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====
// ===== ADD LISTENER =====
// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====

/**
 * Add a listener for teacher data changes
 * @param {Function} listener - The listener function
 * @returns {Function} Unsubscribe function
 */
const addListener = (listener) => {
  if (typeof listener !== 'function') {
    console.warn('⚠️ Listener must be a function');
    return () => {};
  }
  
  listeners.push(listener);
  console.log(`👂 Teacher listener added, total: ${listeners.length}`);
  
  // Return unsubscribe function
  return () => {
    listeners = listeners.filter(l => l !== listener);
    console.log(`👂 Teacher listener removed, total: ${listeners.length}`);
  };
};

// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====
// ===== REMOVE LISTENER =====
// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====

/**
 * Remove a listener
 * @param {Function} listener - The listener to remove
 */
const removeListener = (listener) => {
  listeners = listeners.filter(l => l !== listener);
  console.log(`👂 Teacher listener removed, total: ${listeners.length}`);
};

// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====
// ===== GET LOCALIZED CLASSES =====
// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====

/**
 * Get all classes with localized names
 * @param {Array} classes - Array of class objects
 * @param {string} language - Optional: language code ('ar' or 'en')
 * @returns {Array} Array of class objects with localized names
 */
const getLocalizedClasses = (classes, language = null) => {
  if (!language) {
    language = getCurrentLanguage();
  }
  
  return classes.map(cls => ({
    ...cls,
    name: getLocalizedClassName(cls.name, cls.level, language),
    originalName: cls.name,
  }));
};

// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====
// ===== EXPORT FUNCTIONS =====
// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====

/**
 * Resolve the current teacher's user id.
 * @returns {string|null}
 */
const getTeacherId = () => {
  try {
    const current = getCurrentTeacher();
    return current ? current.id : null;
  } catch (error) {
    console.warn('⚠️ Could not resolve current teacher id:', error);
    return null;
  }
};

/**
 * Check whether the current teacher has access to the given class.
 * @param {string} classId - The class id to check
 * @returns {boolean}
 */
const hasClassAccess = (classId) => {
  try {
    if (classId === null || classId === undefined) return false;

    const current = getCurrentTeacher();
    if (!current) return false;

    const classes = getAssignedClasses(current.id);
    if (!Array.isArray(classes)) return false;

    return classes.some((c) => String(c.id) === String(classId));
  } catch (error) {
    console.warn('⚠️ Could not verify class access:', error);
    return false;
  }
};

// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====
// ===== GET STUDENTS BY CLASS =====
// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====

/**
 * Get students belonging to a single class.
 * Data comes from the MySQL-backed roster (/students) + users store.
 * @param {string} classId - Class code or id
 * @returns {Array} Students in that class
 */
const getStudentsByClass = (classId) => {
  try {
    if (classId == null) return [];
    const allStudents = [
      ...getFromStorage('students_roster'),
      ...getFromStorage('school_students'),
    ];
    const seen = new Set();
    const unique = allStudents.filter((s) => {
      const id = String(s?._serverId ?? s?.id ?? s?.email ?? "");
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
    return unique.filter((student) => {
      const studentClassId =
        student.classId || student.class || student.class_id || student.class_name;
      return String(studentClassId) === String(classId);
    });
  } catch (error) {
    console.error('❌ Error getting students by class:', error);
    return [];
  }
};

// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====
// ===== SAVE TEACHER (create/update) =====
// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====

/**
 * Upsert a teacher through the canonical users store. The users store
 * persists the change to the Laravel API (POST/PUT /users), so the
 * teacher record always ends up in MySQL - never in browser storage.
 * @param {Object} teacherData
 * @returns {Object|null} the stored teacher record
 */
const saveTeacher = (teacherData) => {
  try {
    if (!teacherData) return null;
    const teacherPayload = { ...teacherData, role: 'teacher' };

    const users = getFromStorage('school_users');
    const existingIdx = users.findIndex(
      (u) =>
        u.id === teacherData.id ||
        u.email === teacherData.email ||
        String(u._serverId) === String(teacherData._serverId)
    );
    if (existingIdx >= 0) {
      users[existingIdx] = { ...users[existingIdx], ...teacherPayload };
    } else {
      users.push(teacherPayload);
    }
    saveToStorage('school_users', users);

    const teachers = getFromStorage('school_teachers');
    const tIdx = teachers.findIndex(
      (t) => t.id === teacherData.id || t.email === teacherData.email
    );
    if (tIdx >= 0) {
      teachers[tIdx] = { ...teachers[tIdx], ...teacherPayload };
    } else {
      teachers.push(teacherPayload);
    }
    saveToStorage('school_teachers', teachers);

    notifyListeners(teacherPayload);
    return teacherPayload;
  } catch (error) {
    console.error('❌ Error saving teacher:', error);
    return null;
  }
};

export const teacherService = {
  // Core functions
  getCurrentTeacher,
  setCurrentTeacher,
  logoutTeacher,
  getAssignedClasses,
  getAssignedStudents,
  getStudentsByClass,
  saveTeacher,
  getTeacherWithData,
  getDashboardStats,
  getTeacherAssessments,
  getTeacherNotifications,
  getTodayAttendance,
  updateTeacherClasses,
  notifyTeacherAboutNewClass,
  getTeacherId,
  hasClassAccess,
  
  // Localization functions
  getLocalizedClassName,
  getLocalizedClasses,
  getCurrentLanguage,
  getClassNamesMap,
  
  // Listener functions
  addListener,
  removeListener,
  
  // Utility functions
  getTeacher: (teacherId) => {
    const users = getFromStorage('school_users');
    return users.find(u => u.id === teacherId) || null;
  },
  
  getAllTeachers: () => {
    const users = getFromStorage('school_users');
    return users.filter(u => u.role === 'teacher');
  },
  
  getTeacherStudents: (teacherId) => {
    return getAssignedStudents(teacherId);
  },
  
  getTeacherClasses: (teacherId, language = null) => {
    return getAssignedClasses(teacherId, null, language);
  },
  
  hasAssignedClasses: (teacherId) => {
    const classes = getAssignedClasses(teacherId);
    return classes && classes.length > 0;
  },
  
  getTeacherClassIds: (teacherId) => {
    const classes = getAssignedClasses(teacherId);
    return classes.map(c => c.id);
  },
  
  getTeacherClassNames: (teacherId, language = null) => {
    const classes = getAssignedClasses(teacherId, null, language);
    return classes.map(c => c.name);
  },
};

// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====
// ===== DEFAULT EXPORT =====
// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====

export default teacherService;