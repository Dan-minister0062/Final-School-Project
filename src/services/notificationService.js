// src/services/notificationService.js - MySQL-backed notifications (API-first)
import api from './api';

function fromServerNotification(sn) {
  return {
    id: sn.id,
    _serverId: sn.id,
    title: sn.title,
    message: sn.message || '',
    type: sn.type || 'info',
    link: sn.link || null,
    priority: sn.priority || 'low',
    metadata: sn.metadata || {},
    read: !!sn.read,
    time: sn.createdAt || new Date().toISOString(),
    created_at: sn.createdAt || new Date().toISOString(),
  };
}

class NotificationService {
  constructor() {
    this.notifications = [];
    this.listeners = [];
    this._syncing = false;
    this.setupEventListeners();
    if (this.hasSession()) {
      this.pull();
    }
  }

  hasSession() {
    try {
      const token = localStorage.getItem('token');
      return !!token && !token.startsWith('demo-');
    } catch {
      return false;
    }
  }

  setupEventListeners() {
    // Listen for new registration events (Admin)
    window.addEventListener('newRegistration', (event) => {
      const { detail } = event;
      this.addNotification(
        '📝 طلب تسجيل جديد',
        `${detail.parentName} قام بتسجيل ${detail.studentName}`,
        'registration',
        '/dashboard/admin/registrations',
        { student_name: detail.studentName, parent_name: detail.parentName }
      );
    });

    // Listen for assignment created events (Teacher)
    window.addEventListener('newAssignment', (event) => {
      const { detail } = event;
      this.addNotification(
        '📋 واجب جديد',
        `تم إضافة واجب جديد: ${detail.title} للفصل ${detail.className}`,
        'assignment',
        '/dashboard/teacher/assessments',
        { assignment_title: detail.title, class_name: detail.className }
      );
    });

    // Listen for student submission events (Teacher)
    window.addEventListener('studentSubmission', (event) => {
      const { detail } = event;
      this.addNotification(
        '📤 تسليم واجب',
        `${detail.studentName} قام بتسليم واجب ${detail.assignmentTitle}`,
        'submission',
        '/dashboard/teacher/assessments',
        { student_name: detail.studentName, assignment_title: detail.assignmentTitle }
      );
    });

    // Listen for announcement events (All roles)
    window.addEventListener('newAnnouncement', (event) => {
      const { detail } = event;
      this.addNotification(
        '📢 إعلان جديد',
        detail.message || 'تم نشر إعلان جديد من الإدارة',
        'announcement',
        '/dashboard/admin/announcements',
        { announcement_title: detail.title }
      );
    });

    // Listen for grade posted events (Student/Parent)
    window.addEventListener('gradePosted', (event) => {
      const { detail } = event;
      this.addNotification(
        '📊 نتيجة جديدة',
        `تم نشر نتيجة ${detail.subject} للطالب ${detail.studentName}`,
        'grade',
        '/dashboard/student/my-results',
        { student_name: detail.studentName, subject: detail.subject }
      );
    });

    // Listen for attendance update events (Parent)
    window.addEventListener('attendanceUpdate', (event) => {
      const { detail } = event;
      this.addNotification(
        '✅ تحديث الحضور',
        `تم تسجيل حضور ${detail.studentName} - ${detail.status}`,
        'attendance',
        '/dashboard/parent/child-results',
        { student_name: detail.studentName, status: detail.status }
      );
    });

    // Listen for schedule change events (Teacher)
    window.addEventListener('scheduleChange', (event) => {
      const { detail } = event;
      this.addNotification(
        '📅 تغيير في الجدول',
        `تم تغيير جدول ${detail.className} - ${detail.change}`,
        'schedule',
        '/dashboard/teacher',
        { class_name: detail.className, change: detail.change }
      );
    });
  }

  // Pull fresh notifications from MySQL through the Laravel API.
  async pull() {
    if (this._syncing || !this.hasSession()) return this.notifications;
    this._syncing = true;
    try {
      const res = await api.get('/notifications', { params: { per_page: 500 } });
      const rawItems = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
          ? res.data
          : [];
      if (Array.isArray(rawItems)) {
        this.notifications = rawItems.map(fromServerNotification);
        this.notifyListeners();
      }
    } catch (e) {
      console.warn('[notifications] fetch failed:', e?.message || e);
    } finally {
      this._syncing = false;
    }
    return this.notifications;
  }

  async addNotification(title, message, type = 'info', link = null, metadata = {}) {
    const newNotification = {
      id: Date.now() + Math.random(),
      title: title,
      message: message,
      time: new Date().toISOString(),
      created_at: new Date().toISOString(),
      read: false,
      type: type,
      link: link || this.getDefaultLink(type),
      priority: this.getPriority(type),
      metadata: metadata
    };

    this.notifications = [newNotification, ...this.notifications];
    this.notifyListeners(newNotification);

    // Persist the notification row in MySQL when a real session exists.
    if (this.hasSession()) {
      try {
        const res = await api.post('/notifications', {
          title,
          message,
          type,
          link: newNotification.link,
          priority: newNotification.priority,
          metadata,
        });
        if (res.data?.success && res.data?.data?.id) {
          newNotification._serverId = res.data.data.id;
          newNotification.id = res.data.data.id;
          this.notifyListeners();
        }
      } catch (e) {
        console.warn('[notifications] create failed:', e?.message || e);
      }
    }

    // Dispatch custom event for real-time updates
    window.dispatchEvent(new CustomEvent('notificationAdded', {
      detail: newNotification
    }));

    return newNotification;
  }

  getDefaultLink(type) {
    const links = {
      registration: '/dashboard/admin/registrations',
      announcement: '/dashboard/admin/announcements',
      assignment: '/dashboard/teacher/assessments',
      submission: '/dashboard/teacher/assessments',
      grade: '/dashboard/student/my-results',
      attendance: '/dashboard/parent/child-results',
      schedule: '/dashboard/teacher',
      system: '/dashboard/admin/settings',
      reminder: '/dashboard/admin/announcements'
    };
    return links[type] || '/dashboard';
  }

  getPriority(type) {
    const priorities = {
      registration: 'high',
      announcement: 'medium',
      assignment: 'medium',
      submission: 'medium',
      grade: 'low',
      attendance: 'low',
      schedule: 'medium',
      system: 'low',
      reminder: 'low'
    };
    return priorities[type] || 'low';
  }

  getNotifications() {
    return this.notifications;
  }

  getNotificationsByRole(role) {
    const roleMap = {
      admin: ['registration', 'system', 'announcement', 'reminder'],
      teacher: ['assignment', 'submission', 'schedule', 'announcement'],
      parent: ['grade', 'attendance', 'announcement', 'payment'],
      student: ['grade', 'announcement', 'assignment']
    };
    const allowedTypes = roleMap[role] || ['announcement'];
    return this.notifications.filter((n) => allowedTypes.includes(n.type));
  }

  getUnreadCount(role = null) {
    if (role) {
      const filtered = this.getNotificationsByRole(role);
      return filtered.filter((n) => !n.read).length;
    }
    return this.notifications.filter((n) => !n.read).length;
  }

  markAsRead(id) {
    this.notifications = this.notifications.map((notif) =>
      String(notif.id) === String(id) ? { ...notif, read: true } : notif
    );
    this.notifyListeners();

    const target = this.notifications.find((n) => String(n.id) === String(id));
    if (this.hasSession() && target?._serverId) {
      api
        .patch(`/notifications/${target._serverId}/read`)
        .catch((e) => console.warn('[notifications] mark-read failed:', e?.message));
    }
  }

  markAllAsRead(role = null) {
    const allowedTypes = role
      ? {
          admin: ['registration', 'system', 'announcement', 'reminder'],
          teacher: ['assignment', 'submission', 'schedule', 'announcement'],
          parent: ['grade', 'attendance', 'announcement', 'payment'],
          student: ['grade', 'announcement', 'assignment']
        }[role] || ['announcement']
      : null;

    this.notifications = this.notifications.map((notif) =>
      !allowedTypes || allowedTypes.includes(notif.type)
        ? { ...notif, read: true }
        : notif
    );
    this.notifyListeners();

    if (this.hasSession()) {
      api
        .patch('/notifications/mark-all-read')
        .catch((e) => console.warn('[notifications] mark-all-read failed:', e?.message));
    }
  }

  removeNotification(id) {
    const target = this.notifications.find((n) => String(n.id) === String(id));
    this.notifications = this.notifications.filter((notif) => String(notif.id) !== String(id));
    this.notifyListeners();

    if (this.hasSession() && target?._serverId) {
      api
        .delete(`/notifications/${target._serverId}`)
        .catch((e) => console.warn('[notifications] delete failed:', e?.message));
    }
  }

  clearAll() {
    this.notifications = [];
    this.notifyListeners();
  }

  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  notifyListeners(notification = null) {
    this.listeners.forEach((callback) => {
      try {
        callback([...this.notifications], notification);
      } catch (e) {
        console.error('Error in notification listener:', e);
      }
    });
  }
}

const notificationService = new NotificationService();

if (typeof window !== 'undefined') {
  window.notificationService = notificationService;
  window.addNotification = (title, message, type, link, metadata) => {
    return notificationService.addNotification(title, message, type, link, metadata);
  };
  window.getNotifications = () => notificationService.getNotifications();
  window.clearNotifications = () => notificationService.clearAll();
  window.getNotificationsByRole = (role) => notificationService.getNotificationsByRole(role);
}

export default notificationService;
