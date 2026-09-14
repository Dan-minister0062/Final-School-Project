// src/services/attendanceService.js
import { teacherService } from './teacherService';
import { STORAGE_KEYS } from '../utils/constants';
import { syncGet, syncSend } from './apiSync';

// In-memory cache (no browser persistence).
const memoryCache = new Map();

class AttendanceService {
  constructor() {
    this.attendanceRecords = [];
    this._listeners = [];
    this.loadData();
    this.syncAttendance();
  }

  _getData(key) {
    try {
      return memoryCache.has(key) ? memoryCache.get(key) : [];
    } catch (error) {
      console.error(`Error loading ${key}:`, error);
      return [];
    }
  }

  _saveData(key, data) {
    try {
      memoryCache.set(key, data);
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
    }
  }

  addListener(callback) {
    if (typeof callback === 'function') {
      this._listeners.push(callback);
      return () => {
        this._listeners = this._listeners.filter(cb => cb !== callback);
      };
    }
    return () => {};
  }

  _notifyListeners() {
    this._listeners.forEach(callback => {
      try {
        callback();
      } catch (e) {
        console.error('Error in attendance listener:', e);
      }
    });
  }

  loadData() {
    this.attendanceRecords = this._getData(STORAGE_KEYS.ATTENDANCE);
  }

  // Sync flat server rows from /api/attendance into the record-per-class/date shape
  async syncAttendance() {
    try {
      const res = await syncGet('/attendance');
      if (!Array.isArray(res?.data) || res.data.length === 0) return;

      const grouped = {};
      res.data.forEach((a) => {
        const key = `${a.classId}|${a.date}`;
        if (!grouped[key]) {
          grouped[key] = {
            classId: a.classId,
            class_code: a.classCode,
            date: a.date,
            students: [],
            teacherId: a.teacherId,
            updatedAt: a.updatedAt,
            createdAt: a.createdAt,
            source: 'server',
          };
        }
        grouped[key].students.push({
          studentId: a.studentId != null ? a.studentId : (a.student_code ?? null),
          studentCode: a.studentCode,
          studentName: a.studentName,
          status: a.status,
          remarks: a.remarks,
          _serverId: a._serverId,
        });
      });

      const serverRecords = Object.values(grouped);
      const serverKeys = new Set(serverRecords.map((r) => `${r.classId}|${r.date}`));
      this.attendanceRecords = [
        ...serverRecords,
        ...this.attendanceRecords.filter((r) => !serverKeys.has(`${r.classId}|${r.date}`)),
      ];
      this._notifyListeners();
    } catch (e) {
      console.warn('[attendanceService] Server sync failed:', e);
    }
  }

  saveData() {
    this._saveData(STORAGE_KEYS.ATTENDANCE, this.attendanceRecords);
    this._notifyListeners();
  }

  getAttendance(classId, date) {
    if (!teacherService.hasClassAccess(classId)) {
      throw new Error('You do not have access to this class');
    }

    return this.attendanceRecords.find(
      record => record.classId === classId && record.date === date
    );
  }

  saveAttendance(classId, date, attendanceData) {
    if (!teacherService.hasClassAccess(classId)) {
      throw new Error('You do not have access to this class');
    }

    const existingIndex = this.attendanceRecords.findIndex(
      record => record.classId === classId && record.date === date
    );

    const record = {
      classId,
      date,
      students: attendanceData,
      teacherId: teacherService.getTeacherId(),
      updatedAt: new Date().toISOString()
    };

    if (existingIndex !== -1) {
      this.attendanceRecords[existingIndex] = {
        ...this.attendanceRecords[existingIndex],
        ...record,
        updatedAt: new Date().toISOString()
      };
    } else {
      record.createdAt = new Date().toISOString();
      this.attendanceRecords.push(record);
    }

    this.saveData();

    // Persist the day's batch to MySQL (replace-if-exists semantics on server)
    this.syncSaveAttendance(classId, date, attendanceData);

    // Trigger attendance update event
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('attendanceUpdate', {
        detail: {
          classId,
          date,
          totalStudents: attendanceData.length,
          present: attendanceData.filter(s => s.status === 'present').length,
          absent: attendanceData.filter(s => s.status === 'absent').length,
          late: attendanceData.filter(s => s.status === 'late').length,
          excused: attendanceData.filter(s => s.status === 'excused').length
        }
      });
      window.dispatchEvent(event);
    }

    return record;
  }

  // POST the day's attendance to MySQL and attach returned server ids locally
  async syncSaveAttendance(classId, date, attendanceData) {
    try {
      const res = await syncSend('post', '/attendance', {
        class_code: classId,
        date,
        students: attendanceData.map((s) => ({
          student_id: s.studentId,
          student_code: s.studentCode,
          student_name: s.studentName || s.name || '',
          status: s.status,
          remarks: s.remarks,
        })),
      });
      if (res?.data) {
        const byStudent = {};
        res.data.forEach((a) => { byStudent[String(a.studentId ?? a.studentCode)] = a._serverId; });
        const record = this.attendanceRecords.find((r) => r.classId === classId && r.date === date);
        if (record) {
          record.students = record.students.map((s) => ({
            ...s,
            _serverId: byStudent[String(s.studentId ?? s.studentCode)] || s._serverId,
          }));
          this.saveData();
        }
      }
    } catch (e) {
      console.warn('[attendanceService] Server save failed:', e);
    }
  }

  getAttendanceHistory(filters = {}) {
    const teacherId = teacherService.getTeacherId();
    if (!teacherId) return [];

    const assignedClasses = teacherService.getAssignedClasses();
    const classIds = assignedClasses.map(c => c.id);

    let records = this.attendanceRecords.filter(record => 
      classIds.includes(record.classId)
    );

    if (filters.classId) {
      records = records.filter(r => r.classId === filters.classId);
    }
    if (filters.studentId) {
      records = records.filter(r => 
        r.students.some(s => s.studentId === filters.studentId)
      );
    }
    if (filters.date) {
      records = records.filter(r => r.date === filters.date);
    }
    if (filters.status) {
      records = records.filter(r => 
        r.students.some(s => s.status === filters.status)
      );
    }

    // Sort by date (newest first)
    return records.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  getStudentAttendanceSummary(studentId, classId) {
    const records = this.attendanceRecords.filter(r => 
      r.classId === classId &&
      r.students.some(s => s.studentId === studentId)
    );

    const summary = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      total: records.length
    };

    records.forEach(record => {
      const student = record.students.find(s => s.studentId === studentId);
      if (student) {
        const status = student.status.toLowerCase();
        if (summary.hasOwnProperty(status)) {
          summary[status] = (summary[status] || 0) + 1;
        }
      }
    });

    return summary;
  }

  getStudentAttendanceHistory(studentId, classId) {
    const records = this.attendanceRecords.filter(r => 
      r.classId === classId &&
      r.students.some(s => s.studentId === studentId)
    );

    return records.map(record => {
      const student = record.students.find(s => s.studentId === studentId);
      return {
        date: record.date,
        status: student ? student.status : 'unknown',
        studentName: student ? student.studentName : ''
      };
    });
  }

  getTodayAttendanceStatus() {
    const today = new Date().toDateString();
    const classes = teacherService.getAssignedClasses();
    
    return classes.map(cls => {
      const record = this.attendanceRecords.find(
        r => r.classId === cls.id && r.date === today
      );
      return {
        classId: cls.id,
        className: cls.name,
        status: record ? 'completed' : 'pending',
        totalStudents: record ? record.students.length : 0,
        present: record ? record.students.filter(s => s.status === 'present').length : 0,
        absent: record ? record.students.filter(s => s.status === 'absent').length : 0,
        late: record ? record.students.filter(s => s.status === 'late').length : 0,
        excused: record ? record.students.filter(s => s.status === 'excused').length : 0
      };
    });
  }

  getClassAttendanceStats(classId) {
    if (!teacherService.hasClassAccess(classId)) {
      throw new Error('You do not have access to this class');
    }

    const records = this.attendanceRecords.filter(r => r.classId === classId);
    if (!records.length) return null;

    const totalDays = records.length;
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLate = 0;
    let totalExcused = 0;

    records.forEach(record => {
      record.students.forEach(student => {
        switch (student.status) {
          case 'present':
            totalPresent++;
            break;
          case 'absent':
            totalAbsent++;
            break;
          case 'late':
            totalLate++;
            break;
          case 'excused':
            totalExcused++;
            break;
          default:
            break;
        }
      });
    });

    const totalRecords = totalPresent + totalAbsent + totalLate + totalExcused;

    return {
      totalDays,
      totalPresent,
      totalAbsent,
      totalLate,
      totalExcused,
      totalRecords,
      attendanceRate: totalRecords > 0 ? (totalPresent / totalRecords) * 100 : 0,
      dailyStats: records.map(record => ({
        date: record.date,
        present: record.students.filter(s => s.status === 'present').length,
        absent: record.students.filter(s => s.status === 'absent').length,
        late: record.students.filter(s => s.status === 'late').length,
        excused: record.students.filter(s => s.status === 'excused').length
      }))
    };
  }

  // Force refresh
  refresh() {
    this.syncAttendance();
    this.loadData();
    this._notifyListeners();
  }
}

export const attendanceService = new AttendanceService();