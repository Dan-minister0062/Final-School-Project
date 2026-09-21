// src/services/assessmentService.js
import { teacherService } from './teacherService';
import { STORAGE_KEYS } from '../utils/constants';
import { syncGet, syncSend } from './apiSync';

// In-memory cache (no browser persistence).
const memoryCache = new Map();

class AssessmentService {
  constructor() {
    this.assessments = [];
    this.grades = [];
    this.submissions = [];
    this._listeners = [];
    this.loadData();
    this.syncFromServer();
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
        console.error('Error in assessment listener:', e);
      }
    });
  }

  loadData() {
    this.assessments = this._getData(STORAGE_KEYS.ASSESSMENTS);
    this.grades = this._getData(STORAGE_KEYS.GRADES);
    this.submissions = this._getData(STORAGE_KEYS.SUBMISSIONS);
  }

  saveData() {
    this._saveData(STORAGE_KEYS.ASSESSMENTS, this.assessments);
    this._saveData(STORAGE_KEYS.GRADES, this.grades);
    this._saveData(STORAGE_KEYS.SUBMISSIONS, this.submissions);
    this._notifyListeners();
  }

  // Merge MySQL assessments/submissions into the local cache (server wins)
  async syncFromServer() {
    try {
      // Assessments and submissions are independent list pulls — run them
      // concurrently so page loads wait only ~max(), not the sum of both.
      const [res, subRes] = await Promise.all([
        syncGet('/assessments'),
        syncGet('/submissions'),
      ]);
      let serverAssessments = [];
      if (Array.isArray(res?.data)) {
        serverAssessments = res.data.map(a => ({
          id: `srv-${a._serverId}`,
          _serverId: a._serverId,
          classId: a.classId,
          className: a.className,
          subject: a.subject || '',
          subjectId: a.subjectCode || '',
          title: a.title || '',
          titleEn: a.titleEn || a.title || '',
          titleAr: a.titleAr || a.title || '',
          description: a.description || '',
          descriptionEn: a.descriptionEn || a.description || '',
          descriptionAr: a.descriptionAr || a.description || '',
          attachment: a.attachment || a.attachmentData || '',
          attachmentName: a.attachmentName || '',
          attachmentType: a.attachmentType || '',
          totalMarks: a.totalMarks ?? 20,
          type: a.type || 'assignment',
          dueDate: a.dueDate || '',
          status: a.status || 'active',
          approvedByAdmin: a.approvedByAdmin === true || a.status === 'approved' || a.status === 'sent_to_students',
          approvedAt: a.approvedAt || a.approved_at || null,
          rejectedAt: a.rejectedAt || a.rejected_at || null,
          rejectedByAdmin: !!(a.rejectedAt || a.rejected_at),
          sentToStudentsAt: a.sentToStudentsAt || a.sent_to_students_at || null,
          teacherId: a.teacherId,
          createdBy: a.createdBy,
          teacherName: a.teacherName || '',
          createdAt: a.createdAt,
          updatedAt: a.updatedAt,
          source: 'server',
        }));
        const serverIds = new Set(serverAssessments.map(a => String(a._serverId)));
        this.assessments = [
          ...serverAssessments,
          ...this.assessments.filter(a => !a._serverId || !serverIds.has(String(a._serverId))),
        ];
      }

      if (Array.isArray(subRes?.data) && subRes.data.length) {
        const assessmentByServerId = new Map(
          serverAssessments.filter(a => a._serverId).map(a => [String(a._serverId), a]),
        );
        const serverSubmissions = subRes.data.map(s => {
          const serverAssessment = assessmentByServerId.get(String(s.assessmentId));
          return {
            id: s._serverId,
            _serverId: s._serverId,
            // Normalize to the local assessment id so pages can join by `assessmentId === assessment.id`
            assessmentId: serverAssessment ? serverAssessment.id : s.assessmentId,
            // Carry the assessment owner so teacher views can match submissions to their own
            // assessments even when the student is not in the teacher's class roster.
            teacherId: serverAssessment ? serverAssessment.teacherId : undefined,
            studentId: s.studentId,
            studentName: s.studentName || '',
            content: s.content || '',
            attachment: s.fileData || s.fileUrl || '',
            fileName: s.fileName || '',
            fileType: s.fileType || '',
            score: s.score,
            status: s.status || 'submitted',
            submittedAt: s.submittedAt || '',
            comment: s.comment || '',
            feedback: s.feedback || '',
            source: 'server',
          };
        });
        const serverSubIds = new Set(serverSubmissions.map(s => String(s._serverId)));
        this.submissions = [
          ...serverSubmissions,
          ...this.submissions.filter(s => !serverSubIds.has(String(s._serverId)))
        ];

        const localGrades = this.grades.filter(g => g.source !== 'server');
        const serverGrades = this.submissions
          .filter(s => s.source === 'server' && s.score !== null && s.score !== undefined && s.score !== '')
          .map(s => {
            const serverAssessment = this.assessments.find(a => a.id === s.assessmentId);
            const totalMarks = serverAssessment ? serverAssessment.totalMarks : 20;
            const score = Number(s.score);
            return {
              id: s.id,
              _serverId: s._serverId,
              assessmentId: s.assessmentId,
              studentId: s.studentId,
              studentName: s.studentName || '',
              score,
              feedback: s.feedback || '',
              submittedAt: s.submittedAt || '',
              ...this.calculateGrade(score, totalMarks),
              source: 'server',
            };
          });
        const gradeIds = new Set(serverGrades.map(g => String(g._serverId)));
        this.grades = [
          ...serverGrades,
          ...localGrades.filter(g => !gradeIds.has(String(g._serverId))),
        ];
      }

      // Attach a `.grades` array to every assessment so results pages can read
      // `assessment.grades.find(g => g.studentId === student.id)` (server + local).
      const gradesByAssessment = new Map();
      this.grades.forEach(g => {
        const key = String(g.assessmentId);
        if (!gradesByAssessment.has(key)) gradesByAssessment.set(key, []);
        gradesByAssessment.get(key).push(g);
      });
      this.assessments = this.assessments.map(a => ({
        ...a,
        grades: gradesByAssessment.get(String(a.id)) || [],
      }));

      this.saveData();
    } catch (e) {
      console.warn('[assessmentService] Server sync failed:', e);
    }
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
    const classes = memoryCache.has(STORAGE_KEYS.CLASSES)
      ? memoryCache.get(STORAGE_KEYS.CLASSES)
      : [];
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

    // Persist to MySQL via /api/assessments
    syncSend('post', '/assessments', {
      title: newAssessment.title,
      titleEn: newAssessment.titleEn || newAssessment.title,
      titleAr: newAssessment.titleAr,
      classId: newAssessment.classId,
      className: newAssessment.className,
      subject: newAssessment.subject,
      subject_code: newAssessment.subjectCode || newAssessment.subjectId,
      type: newAssessment.type,
      description: newAssessment.description,
      descriptionEn: newAssessment.descriptionEn || newAssessment.description,
      descriptionAr: newAssessment.descriptionAr,
      due_date: newAssessment.dueDate,
      totalMarks: newAssessment.totalMarks,
      status: newAssessment.status,
      teacher_name: newAssessment.teacherName,
      attachment_data: newAssessment.attachment || null,
      attachment_name: newAssessment.attachmentName || '',
      attachment_type: newAssessment.attachmentType || '',
    }).then((res) => {
      if (res && res.data && res.data._serverId) {
        newAssessment._serverId = res.data._serverId;
        const idx = this.assessments.findIndex(a => a.id === newAssessment.id);
        if (idx !== -1) this.assessments[idx] = newAssessment;
        this.saveData();
      }
    }).catch(() => {});

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

    // Persist update to MySQL for server rows
    const current = this.assessments[index];
    if (current._serverId) {
      syncSend('put', `/assessments/${current._serverId}`, {
        title: current.title,
        titleEn: current.titleEn || current.title,
        titleAr: current.titleAr,
        classId: current.classId,
        className: current.className,
        subject: current.subject,
        subject_code: current.subjectCode || current.subjectId,
        type: current.type,
        description: current.description,
        descriptionEn: current.descriptionEn || current.description,
        descriptionAr: current.descriptionAr,
        due_date: current.dueDate,
        totalMarks: current.totalMarks,
        status: current.status,
        teacher_name: current.teacherName,
        attachment_data: current.attachment || null,
        attachment_name: current.attachmentName || '',
        attachment_type: current.attachmentType || '',
      }).catch(() => {});
    }

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

    const assessment = this.assessments[index];
    this.grades = this.grades.filter(g => g.assessmentId !== id);
    this.submissions = this.submissions.filter(s =>
      String(s.assessmentId) !== String(assessment._serverId) && String(s.assessmentId) !== String(id)
    );
    this.assessments.splice(index, 1);
    this.saveData();

    if (assessment._serverId) {
      syncSend('delete', `/assessments/${assessment._serverId}`).catch(() => {});
    }

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

    // Persist grades as submissions (scores) in MySQL for server rows
    if (assessment._serverId) {
      syncSend('post', `/assessments/${assessment._serverId}/submissions`, {
        students: studentGrades.map(g => ({
          student_id: g.studentId,
          student_name: g.studentName,
          score: g.score !== '' && g.score != null ? Number(g.score) : null,
          comment: g.feedback || '',
        })),
      }).then((res) => {
        if (res && Array.isArray(res.data)) {
          const byStudent = {};
          res.data.forEach((s) => { byStudent[String(s.studentId)] = s._serverId; });
          newGrades.forEach((g) => {
            if (byStudent[String(g.studentId)]) {
              const gIdx = this.grades.findIndex(x => x.assessmentId === assessmentId && String(x.studentId) === String(g.studentId));
              if (gIdx !== -1) this.grades[gIdx]._serverId = byStudent[String(g.studentId)];
            }
          });
          this.saveData();
        }
      }).catch(() => {});
    }

    // Trigger grade posted notification for each student
    if (typeof window !== 'undefined') {
      newGrades.forEach(grade => {
        const event = new CustomEvent('gradePosted', {
          detail: {
            studentName: grade.studentName,
            studentId: grade.studentId ?? grade.student_id ?? null,
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

  // Get submissions for assessment (matches server rows by server/numeric id)
  getSubmissionsForAssessment(assessmentId) {
    const assessment = this.getAssessmentById(assessmentId);
    const serverId = assessment ? String(assessment._serverId) : null;
    return this.submissions.filter(s =>
      String(s.assessmentId) === String(assessmentId) ||
      (serverId && String(s.assessmentId) === serverId)
    );
  }

  // Get single submission for a student within an assessment
  getSubmission(assessmentId, studentId) {
    const subs = this.getSubmissionsForAssessment(assessmentId);
    return subs.find(s => String(s.studentId) === String(studentId)) || null;
  }

  // Get all submissions for a student (with assessment title attached)
  getStudentSubmissions(studentId) {
    const subs = this.submissions.filter(s => String(s.studentId) === String(studentId));
    return subs.map(s => {
      const a = this.assessments.find(x =>
        x.id === s.assessmentId || (x._serverId && String(x._serverId) === String(s.assessmentId))
      );
      return { ...s, title: a ? a.title : '', assessment: a || null };
    });
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
    this.syncFromServer();
    this.loadData();
    this._notifyListeners();
  }
}

export const assessmentService = new AssessmentService();