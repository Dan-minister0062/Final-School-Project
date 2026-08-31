import { useState, useEffect } from 'react';
import { attendanceService } from '../services/attendanceService';
import { teacherService } from '../services/teacherService';

export const useAttendance = (classId, date) => {
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (classId && date) {
      loadAttendance();
    }
  }, [classId, date]);

  const loadAttendance = () => {
    try {
      setLoading(true);
      const students = teacherService.getStudentsByClass(classId);
      const existingRecord = attendanceService.getAttendance(classId, date);
      
      if (existingRecord) {
        setAttendance(existingRecord);
      } else {
        // Initialize with default values
        const initialAttendance = students.map(student => ({
          studentId: student.id,
          studentName: student.name,
          status: 'present'
        }));
        setAttendance({
          classId,
          date,
          students: initialAttendance
        });
      }
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const saveAttendance = (attendanceData) => {
    try {
      const saved = attendanceService.saveAttendance(
        classId,
        date,
        attendanceData
      );
      setAttendance(saved);
      return saved;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateStudentStatus = (studentId, status) => {
    if (!attendance) return;
    
    const updatedStudents = attendance.students.map(s => 
      s.studentId === studentId ? { ...s, status } : s
    );
    setAttendance({
      ...attendance,
      students: updatedStudents
    });
  };

  const markAllPresent = () => {
    if (!attendance) return;
    
    const updatedStudents = attendance.students.map(s => ({
      ...s,
      status: 'present'
    }));
    setAttendance({
      ...attendance,
      students: updatedStudents
    });
  };

  const reset = () => {
    loadAttendance();
  };

  return {
    attendance,
    loading,
    error,
    saveAttendance,
    updateStudentStatus,
    markAllPresent,
    reset,
    refresh: loadAttendance
  };
};