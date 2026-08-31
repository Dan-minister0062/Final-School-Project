import { useState, useEffect } from 'react';
import { assessmentService } from '../services/assessmentService';

export const useAssessments = () => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAssessments = () => {
    try {
      setLoading(true);
      const teacherAssessments = assessmentService.getTeacherAssessments();
      setAssessments(teacherAssessments);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssessments();
  }, []);

  const createAssessment = (data) => {
    try {
      const newAssessment = assessmentService.createAssessment(data);
      setAssessments(prev => [newAssessment, ...prev]);
      return newAssessment;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateAssessment = (id, data) => {
    try {
      const updated = assessmentService.updateAssessment(id, data);
      setAssessments(prev => prev.map(a => a.id === id ? updated : a));
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteAssessment = (id) => {
    try {
      assessmentService.deleteAssessment(id);
      setAssessments(prev => prev.filter(a => a.id !== id));
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const getAssessment = (id) => {
    return assessments.find(a => a.id === id) || null;
  };

  return {
    assessments,
    loading,
    error,
    createAssessment,
    updateAssessment,
    deleteAssessment,
    getAssessment,
    refresh: loadAssessments
  };
};