// src/services/teacherService.js

/**
 * Teacher Service
 * Handles all teacher-related operations including fetching assigned classes and students
 */

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
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from storage:`, error);
    return defaultValue;
  }
};

const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Error saving to ${key}:`, error);
    return false;
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
    
    // Try multiple ways to find the teacher
    
    // 1. Check localStorage for currentUser
    const currentUserStr = localStorage.getItem('currentUser');
    if (currentUserStr) {
      try {
        const currentUser = JSON.parse(currentUserStr);
        console.log('📋 currentUser from localStorage:', currentUser);
        
        // Check if the user is a teacher
        if (currentUser && currentUser.role === 'teacher') {
          console.log('✅ Current teacher found from currentUser:', currentUser.id);
          return currentUser;
        }
        
        // If currentUser exists but is not a teacher, check if they have a teacher profile
        if (currentUser && currentUser.id) {
          const users = getFromStorage('school_users');
          const user = users.find(u => u.id === currentUser.id);
          if (user && user.role === 'teacher') {
            console.log('✅ Teacher found from school_users via currentUser ID:', user.id);
            return user;
          }
        }
      } catch (e) {
        console.warn('Could not parse currentUser:', e);
      }
    }
    
    // 2. Check for user in school_users with isLoggedIn flag
    const users = getFromStorage('school_users');
    console.log(`📋 Checking ${users.length} users in school_users for teacher...`);
    
    // First try to find by isLoggedIn flag
    let teacher = users.find(u => u.role === 'teacher' && u.isLoggedIn === true);
    if (teacher) {
      console.log('✅ Current teacher found from school_users (isLoggedIn):', teacher.id);
      // Save to currentUser for future use
      localStorage.setItem('currentUser', JSON.stringify(teacher));
      return teacher;
    }
    
    // If not found, try to find any teacher (maybe the first one)
    teacher = users.find(u => u.role === 'teacher');
    if (teacher) {
      console.log('✅ Found a teacher in school_users (first one):', teacher.id);
      // Save to currentUser for future use
      localStorage.setItem('currentUser', JSON.stringify(teacher));
      return teacher;
    }
    
    // 3. Check school_teachers storage
    const teachers = getFromStorage('school_teachers');
    console.log(`📋 Checking ${teachers.length} teachers in school_teachers...`);
    
    if (teachers.length > 0) {
      // Find the first teacher
      const firstTeacher = teachers[0];
      console.log('✅ Found teacher in school_teachers:', firstTeacher.id);
      
      // Try to find the corresponding user
      const user = users.find(u => u.id === firstTeacher.id);
      if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        return user;
      }
      
      // If no user found, return the teacher data
      localStorage.setItem('currentUser', JSON.stringify(firstTeacher));
      return firstTeacher;
    }
    
    console.warn('⚠️ No current teacher found after all checks');
    return null;
  } catch (error) {
    console.error('❌ Error getting current teacher:', error);
    return null;
  }
};

/**
 * Set the current teacher in localStorage
 * @param {Object} teacher - The teacher object
 */
const setCurrentTeacher = (teacher) => {
  try {
    if (!teacher) {
      console.warn('⚠️ No teacher provided to set as current');
      return false;
    }
    
    localStorage.setItem('currentUser', JSON.stringify(teacher));
    console.log('✅ Current teacher set:', teacher.id);
    
    // Also update in school_users
    const users = getFromStorage('school_users');
    const userIndex = users.findIndex(u => u.id === teacher.id);
    if (userIndex !== -1) {
      users[userIndex].isLoggedIn = true;
      saveToStorage('school_users', users);
    }
    
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
    const currentUser = getCurrentTeacher();
    if (currentUser) {
      // Update school_users
      const users = getFromStorage('school_users');
      const userIndex = users.findIndex(u => u.id === currentUser.id);
      if (userIndex !== -1) {
        users[userIndex].isLoggedIn = false;
        saveToStorage('school_users', users);
      }
    }
    
    localStorage.removeItem('currentUser');
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
 * Get all assigned classes for a teacher
 * @param {string} teacherId - The teacher's ID
 * @param {Array} allClasses - Optional: all classes from localStorage
 * @returns {Array} Array of class objects
 */
const getAssignedClasses = (teacherId, allClasses = null) => {
  try {
    console.log(`📚 Getting assigned classes for teacher: ${teacherId}`);
    
    // Get the teacher from users
    const users = getFromStorage('school_users');
    const teacher = users.find(u => u.id === teacherId);
    
    if (!teacher) {
      console.warn(`⚠️ Teacher not found: ${teacherId}`);
      return [];
    }
    
    // Get assigned class IDs from teacher - check multiple possible locations
    let assignedClassIds = teacher.assignedClasses || teacher.classes || teacher.classIds || [];
    
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
    
    // Filter classes by matching IDs
    const assignedClasses = classes.filter(cls => {
      const isAssigned = assignedClassIds.includes(cls.id);
      if (isAssigned) {
        console.log(`✅ Found assigned class: ${cls.id} (${cls.name})`);
      }
      return isAssigned;
    });
    
    console.log(`📚 Filtered assigned classes: ${assignedClasses.length}`);
    console.log(`📚 Assigned class names:`, assignedClasses.map(c => c.name));
    
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
    
    // Get all students
    const students = getFromStorage('school_students');
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
 * @returns {Object} Teacher object with assigned classes and students
 */
const getTeacherWithData = (teacherId) => {
  try {
    console.log(`📚 Getting teacher with data: ${teacherId}`);
    
    // Get the teacher from users
    const users = getFromStorage('school_users');
    const teacher = users.find(u => u.id === teacherId);
    
    if (!teacher) {
      console.warn(`⚠️ Teacher not found: ${teacherId}`);
      return null;
    }
    
    // Get assigned classes
    const assignedClasses = getAssignedClasses(teacherId);
    
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
 * @returns {Object} Statistics object
 */
const getDashboardStats = (teacherId) => {
  try {
    console.log(`📊 Getting dashboard stats for teacher: ${teacherId || 'current'}`);
    
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
    
    const teacherWithData = getTeacherWithData(teacherId);
    
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
    
    // Filter assessments by teacher ID
    return assessments.filter(a => a.teacherId === teacherId || a.createdBy === teacherId);
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
    
    // Filter notifications by recipient ID or role
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
// ===== EXPORT FUNCTIONS =====
// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====

export const teacherService = {
  // Core functions
  getCurrentTeacher,
  setCurrentTeacher,
  logoutTeacher,
  getAssignedClasses,
  getAssignedStudents,
  getTeacherWithData,
  getDashboardStats,
  getTeacherAssessments,
  getTeacherNotifications,
  getTodayAttendance,
  updateTeacherClasses,
  notifyTeacherAboutNewClass,
  
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
  
  getTeacherClasses: (teacherId) => {
    return getAssignedClasses(teacherId);
  },
  
  hasAssignedClasses: (teacherId) => {
    const classes = getAssignedClasses(teacherId);
    return classes && classes.length > 0;
  },
  
  getTeacherClassIds: (teacherId) => {
    const classes = getAssignedClasses(teacherId);
    return classes.map(c => c.id);
  },
  
  getTeacherClassNames: (teacherId) => {
    const classes = getAssignedClasses(teacherId);
    return classes.map(c => c.name);
  },
};

// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====
// ===== DEFAULT EXPORT =====
// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====

export default teacherService;