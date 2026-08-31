import { useState, useEffect } from 'react';
import { teacherService } from '../services/teacherService';

export const useTeacherData = () => {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      setLoading(true);
      const assignedClasses = teacherService.getAssignedClasses();
      const assignedStudents = teacherService.getAssignedStudents();
      const assignedSubjects = teacherService.getAssignedSubjects();
      
      setClasses(assignedClasses);
      setStudents(assignedStudents);
      setSubjects(assignedSubjects);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const refresh = () => {
    loadData();
  };

  return {
    classes,
    students,
    subjects,
    loading,
    error,
    refresh,
    hasData: classes.length > 0 || students.length > 0
  };
};