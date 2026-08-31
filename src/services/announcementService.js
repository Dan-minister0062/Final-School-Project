// src/services/announcementService.js - MySQL-backed announcements (API-first)
import api from './api';

function toServerAnnouncement(a) {
  return {
    title: a.title,
    content: a.content || '',
    type: a.type || 'announcement',
    priority: a.priority || 'medium',
    status: a.status || 'published',
    author: a.author || 'Admin',
    targetAudience: Array.isArray(a.targetAudience) ? a.targetAudience : ['all'],
    image: a.image || null,
    video: a.video || null,
    mediaType: a.mediaType || 'none',
    date: a.date || null,
    time: a.time || null,
  };
}

function fromServerAnnouncement(sa) {
  return {
    id: sa.id,
    _serverId: sa.id,
    title: sa.title,
    content: sa.content || '',
    type: sa.type || 'announcement',
    priority: sa.priority || 'medium',
    status: sa.status || 'draft',
    author: sa.author || 'Admin',
    targetAudience: Array.isArray(sa.targetAudience) ? sa.targetAudience : ['all'],
    image: sa.image || null,
    video: sa.video || null,
    mediaType: sa.mediaType || 'none',
    views: sa.views ?? 0,
    likes: sa.likes ?? 0,
    comments: sa.comments ?? 0,
    date: sa.date || null,
    time: sa.time || null,
    createdAt: sa.createdAt || new Date().toISOString(),
    updatedAt: sa.updatedAt || new Date().toISOString(),
  };
}

class AnnouncementService {
  constructor() {
    this.listeners = [];
    this.announcements = [];
    this._syncing = false;
    this.pull();
  }

  hasSession() {
    try {
      const token = localStorage.getItem('token');
      return !!token && !token.startsWith('demo-');
    } catch {
      return false;
    }
  }

  // Pull fresh announcements from MySQL through the Laravel API.
  async pull() {
    if (this._syncing) return this.announcements;
    this._syncing = true;
    try {
      const url = this.hasSession() ? '/announcements' : '/announcements/published';
      const res = await api.get(url, { params: { per_page: 500 } });
      const rawItems = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
          ? res.data
          : [];
      if (Array.isArray(rawItems)) {
        this.announcements = rawItems.map(fromServerAnnouncement);
        this.notifyListeners();
      }
    } catch (e) {
      console.warn('[announcements] fetch failed:', e?.message || e);
    } finally {
      this._syncing = false;
    }
    return this.announcements;
  }

  getAnnouncements() {
    return this.announcements;
  }

  getPublishedAnnouncements() {
    return this.announcements.filter((a) => a.status === 'published');
  }

  // Create -> POST /announcements (row inserted in MySQL), then refresh.
  async addAnnouncement(announcement) {
    if (!this.hasSession()) return announcement;
    try {
      const res = await api.post('/announcements', toServerAnnouncement(announcement));
      if (res.data?.success && res.data?.data?.id) {
        announcement._serverId = res.data.data.id;
        announcement.id = res.data.data.id;
      }
      await this.pull();
    } catch (e) {
      console.warn('[announcements] create failed:', e?.message || e);
    }
    return announcement;
  }

  // Update -> PUT /announcements/{id}, then refresh from MySQL.
  async updateAnnouncement(id, updatedData) {
    const index = this.announcements.findIndex((a) => String(a.id) === String(id));
    if (index === -1) return null;

    const merged = { ...this.announcements[index], ...updatedData };
    this.announcements[index] = merged;
    this.notifyListeners();

    if (this.hasSession() && merged._serverId) {
      try {
        await api.put(`/announcements/${merged._serverId}`, toServerAnnouncement(merged));
        await this.pull();
      } catch (e) {
        console.warn('[announcements] update failed:', e?.message || e);
      }
    }
    return this.announcements[index];
  }

  // Delete -> DELETE /announcements/{id} (soft delete in MySQL), then refresh.
  async deleteAnnouncement(id) {
    const target = this.announcements.find((a) => String(a.id) === String(id));
    this.announcements = this.announcements.filter((a) => String(a.id) !== String(id));
    this.notifyListeners();

    if (this.hasSession() && target?._serverId) {
      try {
        await api.delete(`/announcements/${target._serverId}`);
        await this.pull();
      } catch (e) {
        console.warn('[announcements] delete failed:', e?.message || e);
      }
    }
  }

  refresh() {
    return this.pull();
  }

  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  notifyListeners() {
    const published = this.getPublishedAnnouncements();
    this.listeners.forEach((callback) => {
      try {
        callback(published, this.announcements);
      } catch (e) {
        console.error('Error in announcement listener:', e);
      }
    });
  }
}

const announcementService = new AnnouncementService();

if (typeof window !== 'undefined') {
  window.announcementService = announcementService;
  window.getAnnouncements = () => announcementService.getAnnouncements();
  window.getPublishedAnnouncements = () => announcementService.getPublishedAnnouncements();
  window.refreshAnnouncements = () => announcementService.refresh();
}

export default announcementService;
