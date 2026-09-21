<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\AdmissionController;
use App\Http\Controllers\ClassController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\SubjectController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\RegistrationController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AssessmentController;
use App\Http\Controllers\StudentController;

/* ---------- Public ---------- */
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:3,1');
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:3,1');
Route::get('/auth/accept-invite/{token}', [AuthController::class, 'acceptInvite']);
Route::post('/auth/set-password', [AuthController::class, 'setPassword'])->middleware('throttle:5,1');

Route::get('/classes', [ClassController::class, 'index']);
Route::get('/classes/{code}', [ClassController::class, 'show']);

Route::post('/admissions', [AdmissionController::class, 'store']);

Route::post('/contact', [ContactController::class, 'store']);

Route::get('/announcements/published', [AnnouncementController::class, 'published']);

/* ---------- Authenticated (any role) ---------- */
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::get('/auth/my-children', [AuthController::class, 'myChildren']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);

    Route::put('/profile', [ProfileController::class, 'update']);

    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('/dashboard/{role}/stats', [DashboardController::class, 'roleStats']);

    Route::get('/announcements', [AnnouncementController::class, 'index']);

    // Subjects are read-only for every authenticated role (students need them
    // for their dashboard); writes stay admin-only below.
    Route::get('/subjects', [SubjectController::class, 'index']);

    // Students are read-only for every authenticated role (teachers need them
    // for their assigned-class students); writes stay admin-only below.
    Route::get('/students', [StudentController::class, 'index']);

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications', [NotificationController::class, 'store']);
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markRead']);
    Route::patch('/notifications/mark-all-read', [NotificationController::class, 'markAllRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);

    // Read endpoints are scoped inside the controllers by role.
    Route::get('/payments', [PaymentController::class, 'index']);
    Route::get('/attendance', [AttendanceController::class, 'index']);
    Route::get('/assessments', [AssessmentController::class, 'index']);
    Route::get('/submissions', [AssessmentController::class, 'allSubmissions']);

    // Shared write endpoints that enforce role rules inside the controller.
    Route::post('/submissions', [AssessmentController::class, 'storeOne']);
    Route::put('/submissions/{id}', [AssessmentController::class, 'updateSubmission']);
    Route::delete('/submissions/{id}', [AssessmentController::class, 'destroySubmission']);

    Route::post('/payments', [PaymentController::class, 'store']);
    Route::put('/payments/{id}', [PaymentController::class, 'update']);
    Route::patch('/payments/{id}/status', [PaymentController::class, 'status']);
});

/* ---------- Admin only ---------- */
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::get('/admin/classes', [ClassController::class, 'adminIndex']);
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

    Route::get('/settings', [SettingsController::class, 'index']);
    Route::post('/settings', [SettingsController::class, 'store']);

    Route::get('/registrations', [RegistrationController::class, 'index']);
    Route::get('/registrations/{id}', [RegistrationController::class, 'show']);
    Route::put('/registrations/{id}', [RegistrationController::class, 'update']);
    Route::patch('/registrations/{id}/status', [RegistrationController::class, 'status']);
    Route::delete('/registrations/{id}', [RegistrationController::class, 'destroy']);

    Route::delete('/payments/{id}', [PaymentController::class, 'destroy']);

    Route::get('/admin/contacts', [ContactController::class, 'index']);
    Route::post('/admin/contacts/{id}/reply', [ContactController::class, 'reply']);

    Route::post('/assessments/{id}/approve', [AssessmentController::class, 'approve']);
    Route::post('/assessments/{id}/reject', [AssessmentController::class, 'reject']);

    Route::get('/admin/subjects', [SubjectController::class, 'index']);
    Route::post('/admin/subjects', [SubjectController::class, 'store']);
    Route::put('/admin/subjects/{id}', [SubjectController::class, 'update']);
    Route::put('/admin/subjects/{id}/status', [SubjectController::class, 'toggleStatus']);
    Route::delete('/admin/subjects/{id}', [SubjectController::class, 'destroy']);
});

/* ---------- Teacher + Admin ---------- */
Route::middleware(['auth:sanctum', 'role:teacher,admin'])->group(function () {
    Route::post('/assessments', [AssessmentController::class, 'store']);
    Route::put('/assessments/{id}', [AssessmentController::class, 'update']);
    Route::patch('/assessments/{id}/status', [AssessmentController::class, 'status']);
    Route::delete('/assessments/{id}', [AssessmentController::class, 'destroy']);

    Route::get('/assessments/{id}/submissions', [AssessmentController::class, 'assessmentSubmissions']);
    Route::post('/assessments/{id}/submissions', [AssessmentController::class, 'storeSubmissions']);

    Route::post('/attendance', [AttendanceController::class, 'store']);
    Route::put('/attendance/{id}', [AttendanceController::class, 'update']);
    Route::delete('/attendance/{id}', [AttendanceController::class, 'destroy']);
});
