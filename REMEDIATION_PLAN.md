# Madrasat Al Fath — Backend Remediation Plan (implementation-ready spec)

> Status: plan only — NO code has been changed by this document.
> Scope: the gaps identified in the full-stack audit. Everything below is file-by-file, with exact snippets and SQL, in a safe execution order. Each phase ends with concrete verification commands.

## Conventions & ground truth (do not deviate from these)

1. **`student.id` on the frontend === `users.id`.** The frontend treats the *user* row as the student, parent and teacher identity. `submissions.student_id`, `payments.student_id/parent_id`, `attendance.student_id/teacher_id`, `assessments.created_by/teacher_id` all store **`users.id`** values.
2. **Entities stay flat.** `students`, `teachers`, `parents` are *profile* rows linked to `users` via `users.teacher_id/student_id/parent_id`. `users.role` is the authority.
3. **Class id = class `code`** (e.g. `primary_6a`). `students.class_code`, `assessments.class_code`, `attendance.class_code` reference `classes.code`.
4. **Results are derived from `submissions`** — there is intentionally **no `grades` table**; do not create one.
5. `users.last_login` is now written by `AuthController@login` (already fixed). Student/parent/teacher `parentId` linkage and class CRUD persistence are already in place.

---

## Phase 0 — Identity convention: align the Eloquent models (backend models only)

The data already uses `users.id` everywhere. Fix the **model relationships** to match reality instead of the (unused, always-null) `students.id` / `parents.id` pointers. Zero data migration, zero frontend churn.

### 0.1 `app/Models/Payment.php`
Rewrite `student()` and `parent()` to belong to `User`:

```php
public function student()
{
    return $this->belongsTo(User::class, 'student_id');
}

public function parent()
{
    return $this->belongsTo(User::class, 'parent_id');
}
```

### 0.2 `app/Models/Submission.php`
```php
public function student()
{
    return $this->belongsTo(User::class, 'student_id');
}
```

### 0.3 `app/Models/Attendance.php`
```php
public function student()
{
    return $this->belongsTo(User::class, 'student_id');
}
```

### 0.4 `app/Models/Assessment.php`
`created_by` and `teacher_id` are both `users.id`:

```php
public function teacher()
{
    return $this->belongsTo(User::class, 'created_by');
}
```

### 0.5 `app/Models/Teacher.php`
`assessments()` keyed off `created_by` should follow the user, not the teacher profile:

```php
public function assessments()
{
    return $this->hasMany(Assessment::class, 'created_by');
}
```
(Leave as-is — `created_by` becomes resolvable now that `Assessment::teacher()` points to `User`.)

Cross-check: `User::teacher/student/parent()` (User.php:103-116) already point at the correct profile tables via `users.teacher_id/student_id/parent_id` — no change.

> **Alternative (only if you decide the frontend should switch to true `students.id`):** that requires (a) a data migration rewriting `submissions/payments/attendance.student_id` to `students.id` via `users.student_id`, (b) changing the frontend so grading/submission/payment payloads send `student.student_id` instead of `student.id`, and (c) touching `assessmentService`/`userDataService` merge keys. **Not recommended — higher risk, no feature gain.**

**Verify:** `php -l` on the four models; in `tinker` confirm `Submission::student()` / `Payment::student()` resolve (non-null) for real rows after you grade a submission.

---

## Phase 1 — RBAC middleware (backend, additive)

No authorization exists today: any authenticated user can POST `/users`, DELETE `/classes`, etc.

### 1.1 New file `app/Http/Middleware/EnsureRole.php`
```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if (! $request->user() || ! in_array($request->user()->role, $roles, true)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        return $next($request);
    }
}
```

### 1.2 Register alias in `bootstrap/app.php`
Inside the `->withMiddleware(...)` closure add:
```php
->alias(['role' => \App\Http\Middleware\EnsureRole::class])
```

### 1.3 Restructure `routes/api.php` (replace the single flat group at lines 36-105)
Split into common / admin / teacher / parent / student groups. Minimal diff — keep all URIs identical except where noted:

```php
/* ---------- Common (any authenticated role; read + own-profile) ---------- */
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('/dashboard/{role}/stats', [DashboardController::class, 'roleStats']);

    // Notifications: read/mark for every role (create stays admin)
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markRead']);
    Route::patch('/notifications/mark-all-read', [NotificationController::class, 'markAllRead']);

    // Announcements: read for every role
    Route::get('/announcements', [AnnouncementController::class, 'index']);

    // Public catalog reads (already public) + protected reads used by dashboards
    Route::get('/classes', [ClassController::class, 'index']);
    Route::get('/classes/{code}', [ClassController::class, 'show']);

    // Assessments/submissions: students submit, teachers grade, parents read
    Route::get('/assessments', [AssessmentController::class, 'index']);
    Route::get('/assessments/{id}/submissions', [AssessmentController::class, 'assessmentSubmissions']);
    Route::post('/assessments/{id}/submissions', [AssessmentController::class, 'storeSubmissions']);
    Route::get('/submissions', [AssessmentController::class, 'allSubmissions']);
    Route::put('/submissions/{id}', [AssessmentController::class, 'updateSubmission']);

    // Attendance: read for teacher/admin, save for teacher (see controller guard)
    Route::get('/attendance', [AttendanceController::class, 'index']);

    // Payments: parents create/update their own; reads for all
    Route::get('/payments', [PaymentController::class, 'index']);
    Route::post('/payments', [PaymentController::class, 'store']);
    Route::put('/payments/{id}', [PaymentController::class, 'update']);
    Route::patch('/payments/{id}/status', [PaymentController::class, 'status']);
});

/* ---------- Admin ---------- */
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::get('/admin/classes', [ClassController::class, 'adminIndex']);
    Route::get('/registrations', [RegistrationController::class, 'index']);
    Route::get('/registrations/{id}', [RegistrationController::class, 'show']);
    Route::get('/admin/subjects', [SubjectController::class, 'index']);
    Route::get('/settings', [SettingsController::class, 'index']);
});

Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::post('/classes', [ClassController::class, 'store']);
    Route::put('/classes/{code}', [ClassController::class, 'update']);
    Route::delete('/classes/{code}', [ClassController::class, 'destroy']);

    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);
    Route::post('/admin/users/{id}/reset-password', [UserController::class, 'resetPassword']);

    Route::post('/announcements', [AnnouncementController::class, 'store']);
    Route::put('/announcements/{id}', [AnnouncementController::class, 'update']);
    Route::delete('/announcements/{id}', [AnnouncementController::class, 'destroy']);

    Route::post('/notifications', [NotificationController::class, 'store']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);

    Route::post('/settings', [SettingsController::class, 'store']);

    Route::put('/registrations/{id}', [RegistrationController::class, 'update']);
    Route::patch('/registrations/{id}/status', [RegistrationController::class, 'status']);
    Route::delete('/registrations/{id}', [RegistrationController::class, 'destroy']);

    Route::delete('/payments/{id}', [PaymentController::class, 'destroy']);
    Route::post('/admin/subjects', [SubjectController::class, 'store']);
    Route::put('/admin/subjects/{id}', [SubjectController::class, 'update']);
    Route::put('/admin/subjects/{id}/status', [SubjectController::class, 'toggleStatus']);
    Route::delete('/admin/subjects/{id}', [SubjectController::class, 'destroy']);
});

/* ---------- Teacher ---------- */
Route::middleware(['auth:sanctum', 'role:teacher'])->group(function () {
    Route::post('/attendance', [AttendanceController::class, 'store']);
    Route::put('/attendance/{id}', [AttendanceController::class, 'update']);
    Route::delete('/attendance/{id}', [AttendanceController::class, 'destroy']);

    Route::post('/assessments', [AssessmentController::class, 'store']);
    Route::put('/assessments/{id}', [AssessmentController::class, 'update']);
    Route::patch('/assessments/{id}/status', [AssessmentController::class, 'status']);
    Route::delete('/assessments/{id}', [AssessmentController::class, 'destroy']);
    Route::delete('/submissions/{id}', [AssessmentController::class, 'destroySubmission']);
});
```

### 1.4 Business-rule guards inside controllers (small, additive)
Role middleware covers *who*; add *how* guards so cross-role misuse cannot happen through shared endpoints:

- `AssessmentController::status` (`PATCH /assessments/{id}/status`): only `admin` may set `approved`/`rejected`; a `teacher` may only set `active`/`draft`. Reject otherwise (403).
- `PaymentController::status` (`PATCH /payments/{id}/status`): a `parent` may only transition *own* payments to `submitted` (receipt upload); `admin` may set `approved`/`rejected`. Scope queries to `parent_email === auth email || parent_id === auth id || created_by === auth id` for non-admin.
- `AssessmentController::allSubmissions` (`GET /submissions`): parents see only rows whose `student_id` belongs to their linked children (via `users.parent_id`); teachers see only submissions for their assessments/classes; admin sees all. This is the single filter both `ChildResults` and `ParentDashboard` depend on.

**Verify:** `php artisan route:list`; login each role and confirm 403s on protected writes; student login → `POST /classes` must be 403; parent login → `GET /submissions` must be scoped.

---

## Phase 2 — FK constraints + missing pivot (SQL + Laravel migration, additive)

> Apply only after Phase 0 (identity convention) so constraints match the values that exist. Tables currently holding no conflicting rows: `submissions`, `payments`, `attendance` (0 rows), `assessments` (0), `users.parent_id/student_id/teacher_id` consistent with profiles.

### 2.1 New migration `database/migrations/2026_09_08_000001_add_foreign_key_constraints.php`
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $t) {
            $t->foreign('teacher_id')->references('id')->on('teachers')->nullOnDelete();
            $t->foreign('student_id')->references('id')->on('students')->nullOnDelete();
            $t->foreign('parent_id')->references('id')->on('parents')->nullOnDelete();
        });

        Schema::table('students', function (Blueprint $t) {
            $t->foreign('parent_id')->references('id')->on('parents')->nullOnDelete();
        });

        Schema::table('submissions', function (Blueprint $t) {
            $t->foreign('assessment_id')->references('id')->on('assessments')->cascadeOnDelete();
            $t->foreign('student_id')->references('id')->on('users')->nullOnDelete(); // student user id
        });

        Schema::table('payments', function (Blueprint $t) {
            $t->foreign('student_id')->references('id')->on('users')->nullOnDelete();
            $t->foreign('parent_id')->references('id')->on('users')->nullOnDelete();
            $t->foreign('admission_id')->references('id')->on('registrations')->nullOnDelete();
            $t->foreign('created_by')->references('id')->on('users')->nullOnDelete();
        });

        Schema::table('attendance', function (Blueprint $t) {
            $t->foreign('student_id')->references('id')->on('users')->nullOnDelete();
            $t->foreign('teacher_id')->references('id')->on('users')->nullOnDelete();
        });

        Schema::table('assessments', function (Blueprint $t) {
            $t->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $t->foreign('teacher_id')->references('id')->on('users')->nullOnDelete();
        });

        Schema::table('notifications', function (Blueprint $t) {
            $t->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        Schema::table('announcements', function (Blueprint $t) {
            $t->foreign('published_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        // drop each foreign key added above
    }
};
```
*(`submissions/payments/attendance/assessments` `->student_id/teacher_id/parent_id/created_by` reference **`users.id`** — Phase 0 made the models consistent with this.)*

### 2.2 New migration `...000002_create_class_teacher_pivot_table.php` (missing `belongsToMany`)
```php
Schema::create('class_teacher', function (Blueprint $t) {
    $t->id();
    $t->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
    $t->foreignId('teacher_id')->constrained('teachers')->cascadeOnDelete();
    $t->unique(['class_id', 'teacher_id']);
    $t->timestamps();
});
```
Then `Teacher::classes()` / `SchoolClass::teachers()` work. Also seed it from `teachers.class_codes` (one-time data backfill):
```sql
INSERT INTO class_teacher (class_id, teacher_id, created_at, updated_at)
SELECT c.id, t.id, NOW(), NOW()
FROM teachers t
JOIN classes c ON c.code IN (SELECT JSON_UNQUOTE(t.class_codes))
WHERE NOT EXISTS (
  SELECT 1 FROM class_teacher ct WHERE ct.class_id = c.id AND ct.teacher_id = t.id
);
```
(Backfill with a PHP `DB::table` loop if MariaDB JSON_LENGTH parsing is awkward — or simply regenerate attendance/assignment writes going forward.)

**Verify:** `php artisan migrate`; `php artisan migrate:rollback --step=1` on a copy; live test deleting a user cascades their notifications and nulls their attendance rows.

---

## Phase 3 — Frontend: route direct localStorage writes through the API

The single most impactful frontend change: make every *mutation* reach MySQL instead of only the page's localStorage cache. Keep the `apiSync` offline/demo fallback pattern (writes still bubble to localStorage; when a token exists the API call fires too — exactly like `ClassesManagement` already does).

### 3.1 `src/components/dashboard/student/StudentAnnouncements.jsx` — student submission (currently **zero** API calls)
On submit (around lines 541-599 where `school_submissions`/`student_assessments`/`admin_notifications` are written):
- Remove the direct `localStorage.setItem('school_submissions', ...)` shadow-write of an already-synced key; instead call:
```js
const tk = getToken();
if (tk && !tk.startsWith('demo-')) {
  const rows = [{
    student_id: student.id, student_code: student.student_code || student.id,
    student_name: student.name, content: submissionText, status: 'submitted',
  }];
  syncSend('post', `/assessments/${assessment._serverId || assessment.id}/submissions`, { students: rows })
    .catch((e) => console.warn('⚠️ Submission not persisted to server:', e));
}
```
- Leave the localStorage cache write as the offline fallback.

### 3.2 `src/components/dashboard/admin/AdminAssessments.jsx` + `src/components/dashboard/teacher/TeacherAssessments.jsx`
Replace raw `localStorage.setItem('school_assessments'|'school_submissions'|'pending_assessments'|'admin_notifications'|'student_notifications', ...)` mutations with the existing service calls that already hit the API:
- create/update/delete assessment → `assessmentService.createAssessment/updateAssessment/deleteAssessment` (already POST/PUT/DELETE `/assessments`).
- approve/reject → `syncSend('patch', '/assessments/{id}/status', { status })`.
- grade/save → `assessmentService.saveGrades` (already POST `/assessments/{id}/submissions`).
- The localStorage writes then only happen *inside* `assessmentService.saveData` as the cache layer.

### 3.3 `src/components/dashboard/admin/AnnouncementsManagement.jsx`
Route create/edit/delete through `announcementService.addAnnouncement/updateAnnouncement/deleteAnnouncement` (already POST/PUT/DELETE `/announcements`) instead of writing only the `announcements` localStorage key. The service already maintains its in-memory/server list and fires `refresh`.

### 3.4 Registrations / admissions pipelines
`RegistrationsManagement.jsx` + `AdmissionManagement.jsx`: the requests list should read exclusively from `GET /registrations` (they already `syncGet` it at RegistrationsManagement:123 / AdmissionManagement:608) and every approve/reject/edit/delete must go through `PATCH/PUT/DELETE /registrations/{id}` (already wired at 553/697/843/949/811). Remove the surviving `registration_requests`/`payment_queue`/`registrations` localStorage writes (`RegistrationsManagement.jsx:350/582/609/670/722`) — the `/registrations` response is authoritative.

### 3.5 `read_announcements` → server (new small endpoint + table)
Add migration `announcement_reads`:
```sql
CREATE TABLE announcement_reads (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  announcement_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  UNIQUE KEY announcement_reads_unique (announcement_id, user_id),
  FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```
Add `POST /announcements/{id}/read` (announcement `AnnouncementController@markRead`, upsert `read_at`). Replace `StudentDashboard`'s `read_announcements` localStorage tracking with this call + local cache fallback.

### 3.6 Payments + results (already hybrid — tighten only)
- `ParentPayments.jsx` (230/385/526): make `GET /payments` the source of truth on load; keep localStorage only as an offline seed. Keep the existing `syncSend` PUT/PATCH.
- No change needed for `StudentResults`/`ChildResults` — already server-authoritative via `assessmentService.syncFromServer()`.

**Verify:** `npm run build`; with the Laravel server up, do a student submission and confirm a `submissions` row appears in MySQL; approve an assessment and confirm `status` updates in `assessments`.

---

## Phase 4 — Dead code + dead columns cleanup (safe, additive-removal)

### 4.1 Delete dead files
- `src/services/gradeService.js` — empty placeholder (no importers). Delete.
- `src/services/authService.js` — never imported (Redux `authSlice` duplicates it). Delete.
> Confirm with a repo-wide grep for `gradeService` and `authService` imports immediately before deleting.

### 4.2 Dead localStorage keys → stop reading (legacy)
- `school_registrations` — never written, only read (`ParentPayments.jsx:140`, `StudentDashboard.jsx:487`). Point those reads at `registrations`/`student_payments`/server payloads.

### 4.3 Optional pruning migration (only if you plan a full reseed)
Removing columns is destructive; do it as its own migration **only** when data is disposable:
- `teachers`: `code` (never written)
- `parents`: `code` (never written)
- `subjects`: `class_code`, `level_key`, `academic_year`, `coefficient` (never written; `category`/`name_ar` are used)
- `assessments`: `deadline` (superseded by `due_date`)
- `announcements`: `start_date`, `end_date`, `views`, `likes`, `comments`, `category`, `audience` (never written — `date`/`time`/`target_audience` are the live ones)
- If *not* pruning, at minimum document these as "reserved".

### 4.4 `TeacherDebug.jsx` route guard (`src/App.jsx`)
Gate the `/dashboard/teacher/debug` route so it never ships to production:
```jsx
{import.meta.env.DEV && (
  <Route path="debug" element={<TeacherDebug />} />
)}
```
(Or move it behind an `admin`-only role; simplest is `import.meta.env.DEV`.)

---

## Phase 5 — Final acceptance tests (run with `php artisan serve` + `npm run dev`)

1. **RBAC:** student token must get 403 on `POST /api/users`, `POST /api/classes`, `POST /api/admin/subjects`; teacher token must get 403 on `DELETE /api/users`; everyone gets 200 on `GET /api/auth/me`.
2. **Identity:** after grading, `AssessmentController@updateSubmission` round-trip keeps `student_id = users.id`; `Submission::student()` (tinker) returns the user, not null.
3. **FKs:** delete a parent user → `students.parent_id` nulls; delete an assessment → submissions cascade.
4. **Submissions write path:** student submission from `StudentAnnouncements` creates a MySQL `submissions` row; `GET /api/submissions` shows it; parent `ChildResults` shows it (parents filter works).
5. **Pivot:** `Teacher::classes()` returns rows after backfill.
6. **Regression:** `npm run build` (must stay warning-only), `php -l` across `app/`, `php artisan route:list`, plus the full manual walk of admin classes CRUD, payments approve flow, attendance save, notices create/delete.

---

## Suggested commit sequence
1. `fix(models): align Eloquent relationships to users.id identity convention`
2. `feat(auth): RBAC EnsureRole middleware + route restructuring + controller guards`
3. `feat(db): FK constraints + class_teacher pivot`
4. `feat(api): wire student/admin/teacher mutations through REST (announcements read tracking)`
5. `chore(cleanup): remove dead services, legacy keys, debug route`
6. (optional) `chore(db): prune unused columns migration`