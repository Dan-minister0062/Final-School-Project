// src/services/assessmentService.js
import { teacherService } from './teacherService';
import userDataService from './userDataService';
import { STORAGE_KEYS } from '../utils/constants';

class AssessmentService {
  constructor() {
    this.assessments = [];
    this.grades = [];
    this._listeners = [];
    this.loadData();
  }

  _getData(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error loading ${key}:`, error);
      return [];
    }
  }

  _saveData(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
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
        console.error('Error in assessment listener:', e);
      }
    });
  }

  loadData() {
    this.assessments = this._getData(STORAGE_KEYS.ASSESSMENTS);
    this.grades = this._getData(STORAGE_KEYS.GRADES);
  }

  saveData() {
    this._saveData(STORAGE_KEYS.ASSESSMENTS, this.assessments);
    this._saveData(STORAGE_KEYS.GRADES, this.grades);
    this._notifyListeners();
  }

  // Create new assessment
  createAssessment(assessmentData) {
    const teacherId = teacherService.getTeacherId();
    if (!teacherId) throw new Error('Teacher not authenticated');

    // Validate class assignment
    if (!teacherService.hasClassAccess(assessmentData.classId)) {
      throw new Error('You are not assigned to this class');
    }

    // Get class name for display
    const classes = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLASSES) || '[]');
    const classObj = classes.find(c => c.id === assessmentData.classId);
    const className = classObj ? classObj.name : '';

    const newAssessment = {
      id: `ass_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...assessmentData,
      className: className,
      createdBy: teacherId,
      teacherId: teacherId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: assessmentData.status || 'draft'
    };

    this.assessments.push(newAssessment);
    this.saveData();

    // Trigger notification
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('newAssignment', {
        detail: {
          title: assessmentData.title,
          className: className,
          teacherId: teacherId
        }
      });
      window.dispatchEvent(event);
    }

    return newAssessment;
  }

  // Get assessments for teacher
  getTeacherAssessments() {
    const teacherId = teacherService.getTeacherId();
    if (!teacherId) return [];
    return this.assessments.filter(a => a.createdBy === teacherId || a.teacherId === teacherId);
  }

  // Get assessment by ID (with permission check)
  getAssessmentById(id) {
    const teacherId = teacherService.getTeacherId();
    const assessment = this.assessments.find(a => a.id === id);
    
    if (!assessment) return null;
    if (assessment.createdBy !== teacherId && assessment.teacherId !== teacherId) return null;
    
    return assessment;
  }

  // Update assessment
  updateAssessment(id, updates) {
    const teacherId = teacherService.getTeacherId();
    const index = this.assessments.findIndex(a => a.id === id);
    
    if (index === -1) throw new Error('Assessment not found');
    if (this.assessments[index].createdBy !== teacherId && this.assessments[index].teacherId !== teacherId) {
      throw new Error('You do not have permission to update this assessment');
    }

    if (updates.classId && !teacherService.hasClassAccess(updates.classId)) {
      throw new Error('You are not assigned to this class');
    }

    this.assessments[index] = {
      ...this.assessments[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    this.saveData();
    return this.assessments[index];
  }

  // Delete assessment
  deleteAssessment(id) {
    const teacherId = teacherService.getTeacherId();
    const index = this.assessments.findIndex(a => a.id === id);
    
    if (index === -1) throw new Error('Assessment not found');
    if (this.assessments[index].createdBy !== teacherId && this.assessments[index].teacherId !== teacherId) {
      throw new Error('You do not have permission to delete this assessment');
    }

    this.grades = this.grades.filter(g => g.assessmentId !== id);
    this.assessments.splice(index, 1);
    this.saveData();
    return true;
  }

  // Save grades for assessment
  saveGrades(assessmentId, studentGrades) {
    const assessment = this.getAssessmentById(assessmentId);
    if (!assessment) throw new Error('Assessment not found or no permission');

    // Validate scores
    studentGrades.forEach(grade => {
      if (grade.score < 0 || grade.score > assessment.totalMarks) {
        throw new Error(`Score for ${grade.studentName} exceeds total marks`);
      }
    });

    // Remove existing grades for this assessment
    this.grades = this.grades.filter(g => g.assessmentId !== assessmentId);

    // Add new grades
    const newGrades = studentGrades.map(g => ({
      id: `grade_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      assessmentId,
      studentId: g.studentId,
      studentName: g.studentName,
      score: g.score,
      feedback: g.feedback || '',
      submittedAt: new Date().toISOString(),
      ...this.calculateGrade(g.score, assessment.totalMarks)
    }));

    this.grades.push(...newGrades);
    this.saveData();

    // Trigger grade posted notification for each student
    if (typeof window !== 'undefined') {
      newGrades.forEach(grade => {
        const event = new CustomEvent('gradePosted', {
          detail: {
            studentName: grade.studentName,
            subject: assessment.subject || assessment.title,
            score: grade.score,
            total: assessment.totalMarks,
            percentage: grade.percentage,
            grade: grade.grade
          }
        });
        window.dispatchEvent(event);
      });
    }

    return newGrades;
  }

  // Get grades for assessment
  getGradesForAssessment(assessmentId) {
    return this.grades.filter(g => g.assessmentId === assessmentId);
  }

  // Get grades for student
  getGradesForStudent(studentId) {
    return this.grades.filter(g => g.studentId === studentId);
  }

  // Calculate grade based on score
  calculateGrade(score, totalMarks) {
    const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;
    const grade = this.getGradeFromPercentage(percentage);
    
    return {
      percentage: Math.round(percentage * 100) / 100,
      grade
    };
  }

  getGradeFromPercentage(percentage) {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 75) return 'B+';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C+';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
  }

  // Get student performance summary
  getStudentPerformance(studentId) {
    const studentGrades = this.grades.filter(g => g.studentId === studentId);
    if (!studentGrades.length) return null;

    const totalScore = studentGrades.reduce((sum, g) => sum + g.score, 0);
    const totalMarks = studentGrades.reduce((sum, g) => {
      const assessment = this.getAssessmentById(g.assessmentId);
      return sum + (assessment ? assessment.totalMarks : 0);
    }, 0);

    return {
      totalAssessments: studentGrades.length,
      averageScore: totalMarks > 0 ? (totalScore / totalMarks) * 100 : 0,
      totalScore,
      totalMarks,
      grades: studentGrades.map(g => g.grade)
    };
  }

  // Get class performance summary
  getClassPerformance(classId) {
    const classAssessments = this.assessments.filter(a => a.classId === classId);
    const classGrades = this.grades.filter(g => 
      classAssessments.some(a => a.id === g.assessmentId)
    );

    if (!classGrades.length) return null;

    const totalScore = classGrades.reduce((sum, g) => sum + g.score, 0);
    const totalMarks = classGrades.reduce((sum, g) => {
      const assessment = classAssessments.find(a => a.id === g.assessmentId);
      return sum + (assessment ? assessment.totalMarks : 0);
    }, 0);

    return {
      totalStudents: new Set(classGrades.map(g => g.studentId)).size,
      totalAssessments: classAssessments.length,
      averageScore: totalMarks > 0 ? (totalScore / totalMarks) * 100 : 0,
      totalScore,
      totalMarks
    };
  }

  // Force refresh
  refresh() {
    this.loadData();
    this._notifyListeners();
  }
}

export const assessmentService = new AssessmentService();