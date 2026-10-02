<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Models\Attendance;
use App\Models\Registration;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function stats(): JsonResponse
    {
        $registrations = Registration::count();
        $pendingRegistrations = Registration::where('status', 'pending')->count();
        $approvedRegistrations = Registration::where('status', 'approved')->count();

        $today = now()->toDateString();
        $presentToday = Attendance::where('date', $today)->where('status', 'present')->count();
        $attendanceToday = Attendance::where('date', $today)->count();

        $unreadNotifications = \App\Models\Notification::where('is_read', false)->count();

        return response()->json([
            'users' => User::count(),
            'teachers' => Teacher::count(),
            'students' => Student::count(),
            'parents' => \App\Models\StudentDataParent::count(),
            'classes' => SchoolClass::count(),
            'registrations' => $registrations,
            'pendingRegistrations' => $pendingRegistrations,
            'approvedRegistrations' => $approvedRegistrations,
            'announcements' => Announcement::count(),
            'activeAnnouncements' => Announcement::where('status', 'active')->count(),
            'attendanceToday' => $attendanceToday,
            'presentToday' => $presentToday,
            'unreadNotifications' => $unreadNotifications,
        ]);
    }

    public function roleStats(string $role): JsonResponse
    {
        $base = json_decode($this->stats()->getContent(), true);
        $data = array_merge($base, [
            'teachersActive' => Teacher::where('status', 'active')->count(),
            'studentsActive' => Student::where('status', 'active')->count(),
            'pendingAdmissions' => Registration::where('status', 'pending')->count(),
            'activeClasses' => SchoolClass::where('status', 'active')->count(),
        ]);

        return response()->json($data);
    }
}