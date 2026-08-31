// src/components/dashboard/teacher/AssessmentForm.jsx
import React, { useState, useEffect } from "react";
import { Form, Row, Col, Button, Alert } from "react-bootstrap";
import { FaSave, FaTimes, FaSpinner, FaUsers, FaBook, FaGraduationCap } from "react-icons/fa";
import { useLanguage } from "../../../context/LanguageContext";
import { teacherService } from "../../../services/teacherService";

// ===== DEFAULT SUBJECTS BY LEVEL (Directly in this file) =====
const defaultSubjectsByCategory = {
  kindergarten: [
    { value: 'quran_k', label: "Qur'an", labelAr: 'القرآن الكريم' },
    { value: 'english_k', label: 'English', labelAr: 'اللغة الإنجليزية' },
    { value: 'french_k', label: 'French', labelAr: 'اللغة الفرنسية' },
    { value: 'arabic_k', label: 'Arabic', labelAr: 'اللغة العربية' }
  ],
  primary: [
    { value: 'quran_p', label: "Qur'an", labelAr: 'القرآن الكريم' },
    { value: 'arabic_p', label: 'Arabic', labelAr: 'اللغة العربية' },
    { value: 'english_p', label: 'English', labelAr: 'اللغة الإنجليزية' },
    { value: 'french_p', label: 'French', labelAr: 'اللغة الفرنسية' },
    { value: 'mathematics_p', label: 'Mathematics', labelAr: 'الرياضيات' },
    { value: 'science_p', label: 'Science', labelAr: 'العلوم' },
    { value: 'sports_p', label: 'Sports', labelAr: 'الرياضة' },
    { value: 'ict_p', label: 'ICT', labelAr: 'تكنولوجيا المعلومات' },
    { value: 'art_p', label: 'Art & Plastic', labelAr: 'الفنون التشكيلية' },
    { value: 'geography_p', label: 'Geography', labelAr: 'الجغرافيا' }
  ],
  secondary: [
    { value: 'quran_s', label: "Qur'an", labelAr: 'القرآن الكريم' },
    { value: 'arabic_s', label: 'Arabic', labelAr: 'اللغة العربية' },
    { value: 'english_s', label: 'English', labelAr: 'اللغة الإنجليزية' },
    { value: 'french_s', label: 'French', labelAr: 'اللغة الفرنسية' },
    { value: 'mathematics_s', label: 'Mathematics', labelAr: 'الرياضيات' },
    { value: 'svt_s', label: 'SVT (Biology)', labelAr: 'علوم الحياة والأرض' },
    { value: 'physics_s', label: 'Physics', labelAr: 'الفيزياء' },
    { value: 'sports_s', label: 'Sports', labelAr: 'الرياضة' },
    { value: 'ict_s', label: 'ICT', labelAr: 'تكنولوجيا المعلومات' },
    { value: 'geography_s', label: 'Geography', labelAr: 'الجغرافيا' }
  ],
  high_school: [
    { value: 'quran_h', label: "Qur'an", labelAr: 'القرآن الكريم' },
    { value: 'arabic_h', label: 'Arabic', labelAr: 'اللغة العربية' },
    { value: 'english_h', label: 'English', labelAr: 'اللغة الإنجليزية' },
    { value: 'french_h', label: 'French', labelAr: 'اللغة الفرنسية' },
    { value: 'mathematics_h', label: 'Mathematics', labelAr: 'الرياضيات' },
    { value: 'svt_h', label: 'SVT (Biology)', labelAr: 'علوم الحياة والأرض' },
    { value: 'physics_h', label: 'Physics', labelAr: 'الفيزياء' },
    { value: 'sports_h', label: 'Sports', labelAr: 'الرياضة' },
    { value: 'ict_h', label: 'ICT', labelAr: 'تكنولوجيا المعلومات' },
    { value: 'geography_h', label: 'Geography', labelAr: 'الجغرافيا' },
    { value: 'philosophy_h', label: 'Philosophy', labelAr: 'الفلسفة' }
  ]
};

// ===== GET LEVEL LABEL =====
const getLevelLabel = (level) => {
  const levels = {
    'kindergarten': 'Kindergarten',
    'primary': 'Primary',
    'secondary': 'Secondary',
    'high_school': 'High School'
  };
  return levels[level] || level;
};

const AssessmentForm = ({
  initialData,
  onSubmit,
  onCancel,
  classes,
  students,
}) => {
  const { isArabic } = useLanguage();
  const [formData, setFormData] = useState({
    title: "",
    type: "homework",
    classId: "",
    subject: "",
    description: "",
    totalMarks: 100,
    dueDate: "",
    status: "published",
    assignedStudents: [],
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedClassLevel, setSelectedClassLevel] = useState('');

  // ===== Check dark mode =====
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark =
        document.documentElement.getAttribute("data-bs-theme") === "dark" ||
        document.querySelector(".dashboard-wrapper.dark-theme") !== null;
      setDarkMode(isDark);
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-bs-theme"],
    });
    return () => observer.disconnect();
  }, []);

  // ===== Arabic font style =====
  const arabicFontStyle = {
    fontFamily: isArabic
      ? '"Hacen Tunisia", "Hacen Tunisia Bd", "Noto Sans Arabic", "Vazirmatn", "Traditional Arabic", "Arabic Typesetting", serif'
      : "inherit",
    lineHeight: isArabic ? "1.8" : "1.6",
    letterSpacing: isArabic ? "0.5px" : "0px",
    fontSize: isArabic
      ? "clamp(0.9rem, 1.1vw, 1.05rem)"
      : "clamp(0.85rem, 1vw, 1rem)",
  };

  // ===== GET SUBJECTS FOR A SPECIFIC LEVEL =====
  const getSubjectsForLevel = (level) => {
    if (!level) return [];
    const subjects = defaultSubjectsByCategory[level] || [];
    // Return just the label for display in dropdown
    return subjects.map(s => s.label);
  };

  // ===== GET SUBJECT LABEL WITH ARABIC =====
  const getSubjectLabel = (subjectLabel) => {
    if (!subjectLabel) return '';
    for (const level of Object.keys(defaultSubjectsByCategory)) {
      const found = defaultSubjectsByCategory[level].find(s => s.label === subjectLabel);
      if (found) {
        return isArabic ? found.labelAr : found.label;
      }
    }
    return subjectLabel;
  };

  // ===== LOAD SUBJECTS FOR A CLASS =====
  const loadSubjectsForClass = (classId) => {
    setLoadingSubjects(true);
    try {
      console.log(`📚 AssessmentForm - Loading subjects for class: ${classId}`);

      // Find the selected class
      const selectedClass = classes?.find((c) => c.id === classId);
      if (!selectedClass) {
        console.warn("⚠️ AssessmentForm - Class not found:", classId);
        setAvailableSubjects([]);
        setSelectedClassLevel('');
        setLoadingSubjects(false);
        return;
      }

      // Get the education level from the class
      const level = selectedClass.level || selectedClass.educationLevel;
      console.log(`📚 AssessmentForm - Class level: ${level}`);
      setSelectedClassLevel(level);

      let subjects = [];

      if (level) {
        subjects = getSubjectsForLevel(level);
        console.log(
          `📚 AssessmentForm - Subjects from level ${level}:`,
          subjects,
        );
      }

      // If class has specific subjects, add them
      if (selectedClass.subjects && Array.isArray(selectedClass.subjects)) {
        subjects = [...subjects, ...selectedClass.subjects];
      }

      // Remove duplicates
      subjects = [...new Set(subjects)];

      console.log(
        `📚 AssessmentForm - Final subjects for class ${selectedClass.name}:`,
        subjects,
      );
      setAvailableSubjects(subjects);

      // If there's only one subject, auto-select it
      if (subjects.length === 1 && !formData.subject) {
        setFormData((prev) => ({
          ...prev,
          subject: subjects[0],
        }));
      }
    } catch (error) {
      console.error("Error loading subjects:", error);
      setAvailableSubjects([]);
      setSelectedClassLevel('');
    } finally {
      setLoadingSubjects(false);
    }
  };

  // ===== Load initial data =====
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        type: initialData.type || "homework",
        classId: initialData.classId || "",
        subject: initialData.subject || "",
        description: initialData.description || "",
        totalMarks: initialData.totalMarks || 100,
        dueDate: initialData.dueDate
          ? new Date(initialData.dueDate).toISOString().split("T")[0]
          : "",
        status: initialData.status || "published",
        assignedStudents: initialData.assignedStudents || [],
      });
      if (initialData.classId) {
        loadSubjectsForClass(initialData.classId);
      }
    } else if (classes && classes.length > 0) {
      // Auto-select first class
      const defaultClassId = classes[0].id;
      setFormData((prev) => ({ ...prev, classId: defaultClassId }));
      loadSubjectsForClass(defaultClassId);
    }
  }, [initialData, classes]);

  // ===== HANDLE FORM CHANGE =====
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "classId") {
      // When class changes, load subjects for that class
      setFormData((prev) => ({
        ...prev,
        classId: value,
        subject: "", // Reset subject when class changes
      }));
      if (value) {
        loadSubjectsForClass(value);
      } else {
        setAvailableSubjects([]);
        setSelectedClassLevel('');
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // ===== GET CLASS STUDENTS =====
  const getClassStudents = (classId) => {
    return students?.filter((s) => s.classId === classId || s.class === classId) || [];
  };

  // ===== HANDLE STUDENT SELECTION =====
  const handleStudentToggle = (studentId) => {
    setFormData((prev) => {
      const current = prev.assignedStudents || [];
      const updated = current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId];
      return { ...prev, assignedStudents: updated };
    });
  };

  // ===== HANDLE SELECT ALL STUDENTS =====
  const handleSelectAllStudents = () => {
    const classStudents = getClassStudents(formData.classId);
    const allStudentIds = classStudents.map((s) => s.id);
    setFormData((prev) => ({
      ...prev,
      assignedStudents:
        prev.assignedStudents.length === allStudentIds.length
          ? []
          : allStudentIds,
    }));
  };

  // ===== VALIDATE FORM =====
  const validate = () => {
    const errors = {};

    if (!formData.title.trim()) {
      errors.title = isArabic
        ? "عنوان التقييم مطلوب"
        : "Assessment title is required";
    }
    if (!formData.type) {
      errors.type = isArabic
        ? "نوع التقييم مطلوب"
        : "Assessment type is required";
    }
    if (!formData.classId) {
      errors.classId = isArabic ? "يرجى اختيار فصل" : "Please select a class";
    }
    if (!formData.subject.trim()) {
      errors.subject = isArabic ? "المادة مطلوبة" : "Subject is required";
    }
    if (!formData.totalMarks || formData.totalMarks <= 0) {
      errors.totalMarks = isArabic
        ? "الدرجة الكلية مطلوبة"
        : "Total marks is required";
    }
    if (!formData.dueDate) {
      errors.dueDate = isArabic
        ? "تاريخ الاستحقاق مطلوب"
        : "Due date is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ===== HANDLE SUBMIT =====
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      onSubmit({
        ...formData,
        totalMarks: parseFloat(formData.totalMarks),
      });
    } catch (err) {
      setFormErrors({ submit: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label
              style={{
                ...arabicFontStyle,
                color: darkMode ? "#e9ecef" : "#212529",
              }}
            >
              {isArabic ? "عنوان التقييم *" : "Assessment Title *"}
            </Form.Label>
            <Form.Control
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              isInvalid={!!formErrors.title}
              style={{
                ...arabicFontStyle,
                background: darkMode ? "#2d2d44" : "white",
                color: darkMode ? "#e9ecef" : "#212529",
                borderRadius: "12px",
              }}
            />
            <Form.Control.Feedback type="invalid" style={arabicFontStyle}>
              {formErrors.title}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label
              style={{
                ...arabicFontStyle,
                color: darkMode ? "#e9ecef" : "#212529",
              }}
            >
              {isArabic ? "نوع التقييم *" : "Assessment Type *"}
            </Form.Label>
            <Form.Select
              name="type"
              value={formData.type}
              onChange={handleChange}
              isInvalid={!!formErrors.type}
              style={{
                ...arabicFontStyle,
                background: darkMode ? "#2d2d44" : "white",
                color: darkMode ? "#e9ecef" : "#212529",
                borderRadius: "12px",
              }}
            >
              <option value="homework">{isArabic ? "واجب منزلي" : "Homework"}</option>
              <option value="assignment">{isArabic ? "مشروع" : "Assignment"}</option>
              <option value="quiz">{isArabic ? "اختبار قصير" : "Quiz"}</option>
              <option value="test">{isArabic ? "اختبار" : "Test"}</option>
              <option value="exam">{isArabic ? "امتحان" : "Exam"}</option>
              <option value="project">{isArabic ? "مشروع" : "Project"}</option>
              <option value="classwork">{isArabic ? "عمل صفي" : "Classwork"}</option>
            </Form.Select>
            <Form.Control.Feedback type="invalid" style={arabicFontStyle}>
              {formErrors.type}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label
              style={{
                ...arabicFontStyle,
                color: darkMode ? "#e9ecef" : "#212529",
              }}
            >
              <FaGraduationCap className="me-2" />
              {isArabic ? "الفصل *" : "Class *"}
            </Form.Label>
            <Form.Select
              name="classId"
              value={formData.classId}
              onChange={handleChange}
              isInvalid={!!formErrors.classId}
              style={{
                ...arabicFontStyle,
                background: darkMode ? "#2d2d44" : "white",
                color: darkMode ? "#e9ecef" : "#212529",
                borderRadius: "12px",
              }}
            >
              <option value="">{isArabic ? "اختر فصل" : "Select Class"}</option>
              {classes?.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}{" "}
                  {cls.level
                    ? `(${getLevelLabel(cls.level)})`
                    : ""}
                </option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid" style={arabicFontStyle}>
              {formErrors.classId}
            </Form.Control.Feedback>
            {formData.classId && selectedClassLevel && (
              <Form.Text className="text-muted" style={arabicFontStyle}>
                <FaGraduationCap className="me-1" />
                {isArabic 
                  ? `المستوى: ${isArabic ? getLevelLabel(selectedClassLevel) : getLevelLabel(selectedClassLevel)}` 
                  : `Level: ${getLevelLabel(selectedClassLevel)}`}
              </Form.Text>
            )}
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label
              style={{
                ...arabicFontStyle,
                color: darkMode ? "#e9ecef" : "#212529",
              }}
            >
              <FaBook className="me-2" />
              {isArabic ? "المادة *" : "Subject *"}
            </Form.Label>
            <Form.Select
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              isInvalid={!!formErrors.subject}
              disabled={!formData.classId || loadingSubjects || availableSubjects.length === 0}
              style={{
                ...arabicFontStyle,
                background: darkMode ? "#2d2d44" : "white",
                color: darkMode ? "#e9ecef" : "#212529",
                borderRadius: "12px",
              }}
            >
              <option value="">
                {!formData.classId
                  ? isArabic
                    ? "اختر الفصل أولاً"
                    : "Select class first"
                  : loadingSubjects
                    ? isArabic
                      ? "جاري التحميل..."
                      : "Loading..."
                    : availableSubjects.length === 0
                      ? isArabic
                        ? "⚠️ لا توجد مواد لهذا المستوى"
                        : "⚠️ No subjects for this level"
                      : isArabic
                        ? "اختر المادة"
                        : "Select Subject"}
              </option>
              {availableSubjects.map((subject, index) => (
                <option key={index} value={subject}>
                  {getSubjectLabel(subject)}
                </option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid" style={arabicFontStyle}>
              {formErrors.subject}
            </Form.Control.Feedback>
            {formData.classId && !loadingSubjects && (
              <Form.Text className="text-muted" style={arabicFontStyle}>
                {availableSubjects.length > 0
                  ? isArabic
                    ? `📚 ${availableSubjects.length} مادة متاحة لهذا المستوى`
                    : `📚 ${availableSubjects.length} subjects available for this level`
                  : isArabic
                    ? "⚠️ لا توجد مواد متاحة لهذا المستوى التعليمي"
                    : "⚠️ No subjects available for this education level"}
              </Form.Text>
            )}
          </Form.Group>
        </Col>
      </Row>

      <Form.Group className="mb-3">
        <Form.Label
          style={{
            ...arabicFontStyle,
            color: darkMode ? "#e9ecef" : "#212529",
          }}
        >
          {isArabic ? "الوصف / التعليمات" : "Description / Instructions"}
        </Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          name="description"
          value={formData.description}
          onChange={handleChange}
          style={{
            ...arabicFontStyle,
            background: darkMode ? "#2d2d44" : "white",
            color: darkMode ? "#e9ecef" : "#212529",
            borderRadius: "12px",
          }}
        />
      </Form.Group>

      <Row>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label
              style={{
                ...arabicFontStyle,
                color: darkMode ? "#e9ecef" : "#212529",
              }}
            >
              {isArabic ? "الدرجة الكلية *" : "Total Marks *"}
            </Form.Label>
            <Form.Control
              type="number"
              name="totalMarks"
              value={formData.totalMarks}
              onChange={handleChange}
              isInvalid={!!formErrors.totalMarks}
              min="1"
              step="0.5"
              style={{
                ...arabicFontStyle,
                background: darkMode ? "#2d2d44" : "white",
                color: darkMode ? "#e9ecef" : "#212529",
                borderRadius: "12px",
              }}
            />
            <Form.Control.Feedback type="invalid" style={arabicFontStyle}>
              {formErrors.totalMarks}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label
              style={{
                ...arabicFontStyle,
                color: darkMode ? "#e9ecef" : "#212529",
              }}
            >
              {isArabic ? "تاريخ الاستحقاق *" : "Due Date *"}
            </Form.Label>
            <Form.Control
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              isInvalid={!!formErrors.dueDate}
              style={{
                ...arabicFontStyle,
                background: darkMode ? "#2d2d44" : "white",
                color: darkMode ? "#e9ecef" : "#212529",
                borderRadius: "12px",
              }}
            />
            <Form.Control.Feedback type="invalid" style={arabicFontStyle}>
              {formErrors.dueDate}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label
              style={{
                ...arabicFontStyle,
                color: darkMode ? "#e9ecef" : "#212529",
              }}
            >
              {isArabic ? "الحالة" : "Status"}
            </Form.Label>
            <Form.Select
              name="status"
              value={formData.status}
              onChange={handleChange}
              style={{
                ...arabicFontStyle,
                background: darkMode ? "#2d2d44" : "white",
                color: darkMode ? "#e9ecef" : "#212529",
                borderRadius: "12px",
              }}
            >
              <option value="draft">{isArabic ? "مسودة" : "Draft"}</option>
              <option value="published">
                {isArabic ? "منشور" : "Published"}
              </option>
              <option value="pending_marking">
                {isArabic ? "انتظار التصحيح" : "Pending Marking"}
              </option>
              <option value="closed">{isArabic ? "مغلق" : "Closed"}</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      {/* Student Selection */}
      {formData.classId && (
        <Form.Group className="mb-3">
          <Form.Label
            style={{
              ...arabicFontStyle,
              color: darkMode ? "#e9ecef" : "#212529",
            }}
          >
            <FaUsers className="me-2" />
            {isArabic ? "تحديد الطلاب المستهدفين" : "Select Target Students"}
          </Form.Label>
          <div
            className="student-selection p-3 rounded-3"
            style={{
              background: darkMode ? "#1a1a2e" : "#f8f9fa",
              border: `1px solid ${darkMode ? "#2d2d44" : "#e9ecef"}`,
              borderRadius: "12px",
              maxHeight: "200px",
              overflowY: "auto",
            }}
          >
            <Form.Check
              type="checkbox"
              id="selectAllStudents"
              label={isArabic ? "تحديد الكل" : "Select All"}
              checked={
                formData.assignedStudents?.length ===
                  getClassStudents(formData.classId).length &&
                getClassStudents(formData.classId).length > 0
              }
              onChange={handleSelectAllStudents}
              style={{
                ...arabicFontStyle,
                color: darkMode ? "#e9ecef" : "#212529",
              }}
            />
            <hr
              className="my-2"
              style={{ borderColor: darkMode ? "#2d2d44" : "#e9ecef" }}
            />
            {getClassStudents(formData.classId).map((student) => (
              <Form.Check
                key={student.id}
                type="checkbox"
                id={`student-${student.id}`}
                label={student.name || student.firstName || "Unknown"}
                checked={
                  formData.assignedStudents?.includes(student.id) || false
                }
                onChange={() => handleStudentToggle(student.id)}
                style={{
                  ...arabicFontStyle,
                  color: darkMode ? "#e9ecef" : "#212529",
                }}
              />
            ))}
            {getClassStudents(formData.classId).length === 0 && (
              <p
                className="text-muted text-center mt-2"
                style={arabicFontStyle}
              >
                {isArabic
                  ? "لا يوجد طلاب في هذا الفصل"
                  : "No students in this class"}
              </p>
            )}
          </div>
          <Form.Text className="text-muted" style={arabicFontStyle}>
            {isArabic
              ? `تم اختيار ${formData.assignedStudents?.length || 0} طالب من ${getClassStudents(formData.classId).length}`
              : `${formData.assignedStudents?.length || 0} students selected out of ${getClassStudents(formData.classId).length}`}
          </Form.Text>
        </Form.Group>
      )}

      {formErrors.submit && (
        <Alert variant="danger" style={arabicFontStyle}>
          {formErrors.submit}
        </Alert>
      )}

      <div className="d-flex gap-2 mt-3">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting}
          style={{ borderRadius: "12px", ...arabicFontStyle }}
        >
          {submitting ? (
            <>
              <FaSpinner className="spinning me-2" />
              {isArabic ? "جاري الحفظ..." : "Saving..."}
            </>
          ) : (
            <>
              <FaSave className="me-1" />
              {initialData
                ? isArabic
                  ? "تحديث"
                  : "Update"
                : isArabic
                  ? "إنشاء"
                  : "Create"}
            </>
          )}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          style={{ borderRadius: "12px", ...arabicFontStyle }}
        >
          <FaTimes className="me-1" />
          {isArabic ? "إلغاء" : "Cancel"}
        </button>
      </div>

      <style>{`
        .spinning {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .student-selection::-webkit-scrollbar {
          width: 4px;
        }
        .student-selection::-webkit-scrollbar-track {
          background: transparent;
        }
        .student-selection::-webkit-scrollbar-thumb {
          background: ${darkMode ? "#2d2d44" : "#e9ecef"};
          border-radius: 2px;
        }
        [dir="rtl"] .me-1 {
          margin-right: 0 !important;
          margin-left: 0.25rem !important;
        }
        [dir="rtl"] .me-2 {
          margin-right: 0 !important;
          margin-left: 0.5rem !important;
        }
      `}</style>
    </form>
  );
};

export default AssessmentForm;