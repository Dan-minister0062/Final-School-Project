# Madrasat Al Fath — Frontend Deep Analysis & Backend (Laravel + MySQL) Mapping

## 1. Project Overview

**Stack:** React 18 · Vite 7 · React Router DOM 6 · Redux Toolkit · React Bootstrap 2.9 · Axios · react-hook-form 7 + yup · chart.js/react-chartjs-2 · jspdf + html2canvas (receipts/PDFs) · date-fns · react-toastify · react-helmet-async.

**Roles:** `admin`, `teacher`, `parent`, `student` — authorization enforced client-side via `<ProtectedRoute allowedRoles>` (src/App.jsx:900) using `localStorage.role`.

**Data layer:** Everything keyed off `localStorage` (seeded demo data + `window` CustomEvents as a sync bus). Real API calls exist but are thin:
- Axios instance base `import.meta.env.VITE_API_URL || "http://localhost:8000/api"` (src/services/api.js); Bearer token; 401 → clears session → `/login`.
- Confirmed live endpoints: `POST /auth/login` · `POST /auth/register` · `POST /auth/logout` · `GET /auth/me` · `PUT /profile` · `POST /auth/change-password` · `GET /dashboard/stats` · `POST /admissions` · `GET /classes`.

**Localization:** full Arabic/English (`isArabic`, toggles), RTL-aware, Arabic fonts + `formatNumber` (MAD currency). **Dark mode** in every dashboard file (`darkMode`).

**Sync events used by the mock layer:** `newRegistration`, `newAssignment`, `notificationAdded`, `newNotification`, `paymentUpdated`, `paymentApproved`, `assessmentChanged`, `submissionChanged`.

---

## 2. Pages / Routes

### Public (`MainLayout`)
| Route | Component |
|---|---|
| `/` | Home |
| `/about` | About |
| `/academics` | Academics |
| `/admissions` | Admissions (public application form) |
| `/contact` | Contact (contact form) |
| `/news` | NewsEvents |

### Auth
| Route | Component |
|---|---|
| `/login` | Login (redirects by role: admin→`/dashboard/admin`, teacher, parent, student) |
| `/register` | Register (role-based dynamic form) |
| `/forgot-password` | ForgotPassword |
| `/accept-invite/:token` | AcceptInvite |

### Admin (`/dashboard/admin` — role `admin`)
index (AdminDashboard) · `students` · `teachers` · `classes` (+ `classes/add`) · `announcements` · `registrations` · `parents` · `users` · `settings` · `profile` · `subjects` · `notifications` · `admissions` · `assessments` · `payments`

### Parent (`/dashboard/parent` — role `parent`)
index (ParentDashboard) · `child-results` · `announcements` · `payments` · `profile`

### Teacher (`/dashboard/teacher` — role `teacher`)
index (TeacherDashboard) · `my-students` · `assessments` · `attendance` · `classes` · `notifications` · `profile` · `debug`

### Student (`/dashboard/student` — role `student`)
index (StudentDashboard) · `my-results` · `profile` · `announcements` · `payments`

Fallback: `*` → `/`.

---

## 3. Tables / Data Grids (verified column sets)

Every table is a custom `<div>`/`<Table>` grid, not a library DataGrid. Common features (present in most admin tables): pagination, sortable headers (`handleSort` + icon), search/filter by status/level/month, responsive column hiding (`d-none d-*`), row status badges, dark mode.

### Admin
| File | Columns (EN) |
|---|---|
| **UsersManagement** | [checkbox all] · User · Contact · Role · Status · Last Login · Actions |
| **StudentsManagement** | # · Student · Class · Level · Status · Actions |
| **TeachersManagement** | ID · Teacher · Contact · Qualifications · Subject · Level · Classes · Experience · Status · View |
| **ClassesManagement** | # · Class · Level · Teacher · Students · Status · Actions |
| **SubjectsManagement** | # · Subject · Level · Status · Actions |
| **ParentsManagement** | # · Parent · Contact · Children · Occupation · Status · Last Login · View |
| **AnnouncementsManagement** | # · Title · Type · Priority · Status · Date · Actions |
| **RegistrationsManagement** | Student · Parent · Level · Class · Status · Date · Actions |
| **AdmissionManagement** | Student · Parent · Level/Class · Status · Date · Actions |
| **PaymentsManagement** | Student · Month · Type · Amount · Method · Status · Receipt · Actions |
| **AdminAssessments** | ① pending: Teacher·Title·Type·Subject·Status·Actions ② approved: +Class ③ submissions: Student·Teacher·Assessment·Type·Subject·Attachment·Actions |

### Teacher
| File | Columns |
|---|---|
| **TeacherAssessments** | ① #·Title·Type·Class·Subject·Marks·Status·Submissions·Actions ② #·Student·Assessment·Subject·Submitted·Status·Actions ③ (grade view) #·Student·Status·Score·Grade·Submission |
| **TeacherAttendance** | ① #·Student Name·Student ID·Status·Actions (inline Present/Late/Absent selects) ② history: Date·Class·Student·Status |
| **TeacherMarkAssessments** | #·Student·ID·Status·Submission·Score·Grade·Actions |
| **TeacherStudents** | #·Student·ID·Class·Status·Actions (row detail via modal) |
| **StudentResults** (teacher view) | Subject·Semester·Score·Grade·Status·Teacher·Date |

### Student
| File | Columns |
|---|---|
| **StudentResults** | #·Subject·Semester·Score·Grade·Status·Teacher·Date |
| **StudentAnnouncements** | Teacher·Title·Type·Subject·Status·Your Grade·Actions |
| **StudentPayments** | Month·Amount·Type·Status·Class·Actions |
| **StudentDashboard** | stats cards + recent-results panel |

### Parent
| File | Columns |
|---|---|
| **ParentPayments** | Student·Month·Type·Amount·Status·Receipt·Action |
| **ChildResults** | Subject·Score·Grade·Status (multiple per-child tables) |
| **ParentDashboard** | recent activity feed: Date·Activity (+ student), child cards, stats |
| **ParentAnnouncements** | announcement/assignment cards with view modal |

### Director
| File | Columns/Charts |
|---|---|
| **DirectorDashboard** | KPI cards + charts + **Top Students**: #·Name·Class·Average·Status |

---

## 4. Forms (react-hook-form + yup validation)

| Form | Fields |
|---|---|
| **Login** | `email`, `password` (min 6), remember-me. Validates localStorage first (`school_users`/`school_teachers`/`school_parents`), falls back to API. |
| **Register** | firstName, lastName, email, phone, address; role switch → student (`program`,`grade`), parent (`parentName`,`parentPhone`,`parentEmail`), teacher (`qualification`,`subjectSpecialization`,`experience`); password, confirmPassword. |
| **ForgotPassword** | email |
| **Contact** | name, email, subject, message |
| **Admissions (public)** | Student: firstName, lastName, dob, placeOfBirth, gender, nationality, address, city; academicYear, level, requestedClass, admissionType, hasAttendedBefore, previousSchool, previousGrade, lastAcademicYear, massarNumber, academicTrack, specialAssistance, authorizedPickup; Parent: parentName, relationship, parentPhone, parentEmail, parentAddress, cinId, parentPassword, confirmPassword; Emergency: emergencyContact, emergencyRelationship, emergencyPhone; additionalNotes, termsAgreed. |
| **AdmissionManagement (admin)** | studentName, dob, level, previousSchool, parentName, parentEmail, parentPhone, parentAddress, emergencyContact, emergencyRelationship, emergencyPhone (edit modal). |

---

## 5. Modals & Drawers (counts verified per file)

- **AdminDashboard** — 6
- **UsersManagement** — 6 titled modals (bulk status change, details, etc.)
- **AnnouncementsManagement** — 5 (create/edit, view, delete-confirm)
- **PaymentsManagement** — 5: `showPayModal` (mark paid + upload receipt), `showReceiptModal` (view), `showViewReceiptModal` (preview PDF/image), `showRejectModal`, `showDeleteModal`
- **ClassesManagement** — 4 (add/edit class, assign teacher, delete)
- **StudentsManagement** — 4; **ParentsManagement** — 1; **TeachersManagement** — 1
- **AdmissionManagement** — 3: `showDetailModal`, `showEditModal`, `showDeleteModal`
- **RegistrationsManagement** — 3: `showViewModal`, `showApproveModal`, `showRejectModal`
- **AdminAssessments** — 2 (view + approve/reject)
- **SubjectsManagement** — 3
- **TeacherAssessments** — 6: `showModal` (create), `showSubmissionModal`, `showSubmissionViewModal`, `showSubmissionGradeModal`, `showFileViewModal`, `showDeleteSubmissionModal`
- **StudentAnnouncements** — 3 (view details, submission modal, file preview)
- **ParentAnnouncements** — 2; **ParentPayments** — 2 (pay/receipt); **ParentDashboard** — 1
- **TeacherStudents** — 1 (`showDetailsModal`); **StudentResults** — 1; **TeacherClasses** — 1; **TeacherMarkAssessments** — 1
- **Public** — NewsEvents 1 (event detail), Admissions 1 (terms)
- **TeacherAttendance** — no modals (inline row editing with status select + save)

**Drawer:** only `DashboardLayout.jsx` `<Offcanvas>` — mobile navigation drawer. No other drawers.

---

## 6. Backend mapping (localStorage/mock → Laravel + MySQL)

| localStorage key | Suggested Laravel table | Suggested API |
|---|---|---|
| `school_users`, `currentUser`, `role` | `users` (+ `roles`, pivot or `role` col) | `POST /auth/login`, `GET /auth/me`, `PUT /profile`, `POST /auth/change-password` |
| `school_teachers` | `teachers` (FK user_id, subject_id, qualifications) | `GET/POST/PUT/DELETE /teachers` |
| `school_students` | `students` (FK user_id, class_id, level) | `GET/POST/PUT/DELETE /students` |
| `school_parents` | `parents` (FK user_id; children via `parent_student`) | `GET/POST/PUT/DELETE /parents` |
| `school_classes`, `CLASS_CODES_BY_LEVEL` | `classes` (+ `class_teacher`, `class_student`) | `GET/POST/PUT/DELETE /classes` |
| n/a (subjects in classes/users) | `subjects` | `GET/POST/PUT/DELETE /subjects` |
| `school_registrations` | `registrations` (admission applications) | `POST /admissions`, `GET/POST/PUT /registrations` |
| `school_assessments`, `assessmentChanged` | `assessments` (teacher, level, class/subject, marks, approval status) | `GET/POST/PUT /assessments`, `POST /assessments/{id}/approve` |
| `student_assessments`, `school_submissions`, `submissionChanged` | `submissions` (student_id, assessment_id, file, grade) | `POST /assessments/{id}/submit`, `PUT /submissions/{id}/grade` |
| `student_results` (student + teacher) | `grades` (student_id, subject_id, semester, score, grade) | `GET /grades` — **`gradeService.js` is empty** (unfinished) |
| `school_attendance` | `attendance` (class_id, student_id, date, status) | `GET/POST /attendance` |
| `school_payments`, `student_payments`, `paymentUpdated`, `paymentApproved` | `payments` (student_id, month, year, type, amount, method, receipt_path, status) | `GET/POST /payments`, `POST /payments/{id}/approve|reject` |
| `announcements`, `read_announcements` | `announcements` (+ `announcement_reads`) | `GET/POST/PUT/DELETE /announcements`, `POST /announcements/{id}/read` |
| `school_notifications`, `teacher_notifications`, `notificationAdded` | `notifications` | `GET /notifications`, `POST /notifications/{id}/read` |
| n/a | `dashboard_stats` (aggregated view) | `GET /dashboard/stats`, `GET /dashboard/{role}/stats` |

---

## 7. Gaps & risks identified

1. `src/services/gradeService.js` is an empty placeholder — student/parent results currently served only from localStorage.
2. Most modules are localStorage-first demos; API fallbacks exist only for auth, dashboard stats, admissions, classes → full Laravel implementation must reproduce the custom-event sync (`newRegistration`, `paymentApproved`, etc.) as server push/poll.
3. `TeacherDebug.jsx` (`/dashboard/teacher/debug`) is a debug-route leak — should be locked behind an admin/env guard.
4. Every management page re-implements its own `handleSort`, pagination, dark-mode logic (large duplicated surface — maintainability risk, good candidate for shared hooks: `useDataGrid`, `useDarkMode`, `usePagination`).

**Bottom line:** the frontend is feature-complete for 5 roles; the remaining engineering work is a Laravel backend that persists today's localStorage entities (table above) behind REST endpoints and replaces the custom-event bus with a proper notification/store layer.