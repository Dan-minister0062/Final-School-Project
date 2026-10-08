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
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function stats(Request $request): JsonResponse
    {
        $sub = $this->subAdmin($request);

        if ($sub !== null) {
            return response()->json($this->subAdminStats($sub));
        }

        $registrations = Registration::count();
        $pendingRegistrations = Registration::where('status', 'pending')->count();
        $approvedRegistrations = Registration::where('status', 'approved')->count();

        $today = now()->toDateString();
        $presentToday = Attendance::whereDate('date', $today)->where('status', 'present')->count();
        $attendanceToday = Attendance::whereDate('date', $today)->count();

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

    public function roleStats(Request $request, string $role): JsonResponse
    {
        $base = json_decode($this->stats($request)->getContent(), true);
        $sub = $this->subAdmin($request);

        $data = array_merge($base, $sub === null ? [
            'teachersActive' => Teacher::where('status', 'active')->count(),
            'studentsActive' => Student::where('status', 'active')->count(),
            'pendingAdmissions' => Registration::where('status', 'pending')->count(),
            'activeClasses' => SchoolClass::where('status', 'active')->count(),
        ] : [
            'teachersActive' => Teacher::whereIn('id', $this->linkedIds($sub, 'teacher', 'teacher_id'))->where('status', 'active')->count(),
            'studentsActive' => Student::whereIn('id', $this->linkedIds($sub, 'student', 'student_id'))->where('status', 'active')->count(),
            'pendingAdmissions' => Registration::forSectionAdmin($sub)->where('status', 'pending')->count(),
            'activeClasses' => $sub->allowedClassQuery(SchoolClass::query())->where('status', 'active')->count(),
        ]);

        return response()->json($data);
    }

    protected function subAdmin(Request $request): ?User
    {
        $user = $request->user();

        return $user !== null && $user->isSubAdmin() ? $user : null;
    }

    /**
     * The dashboard tiles a Sub-Admin may see are the rows of its own
     * section: users, profile rows linked from them, classes, registrations,
     * announcements and attendance of the section's classes. Global
     * (section-less) notifications still count because the bell shows them.
     */
    protected function subAdminStats(User $sub): array
    {
        $sectionId = $sub->section_id;
        $today = now()->toDateString();

        $attendance = Attendance::whereIn('class_code', $sub->allowedClassValues());

        return [
            'users' => $sectionId === null ? 0 : User::where('section_id', $sectionId)->count(),
            'teachers' => Teacher::whereIn('id', $this->linkedIds($sub, 'teacher', 'teacher_id'))->count(),
            'students' => Student::whereIn('id', $this->linkedIds($sub, 'student', 'student_id'))->count(),
            'parents' => \App\Models\StudentDataParent::whereIn('id', $this->linkedIds($sub, 'parent', 'parent_id'))->count(),
            'classes' => $sub->allowedClassQuery(SchoolClass::query())->count(),
            'registrations' => Registration::forSectionAdmin($sub)->count(),
            'pendingRegistrations' => Registration::forSectionAdmin($sub)->where('status', 'pending')->count(),
            'approvedRegistrations' => Registration::forSectionAdmin($sub)->where('status', 'approved')->count(),
            'announcements' => $sectionId === null ? 0 : Announcement::where('section_id', $sectionId)->count(),
            'activeAnnouncements' => $sectionId === null
                ? 0
                : Announcement::where('section_id', $sectionId)->where('status', 'active')->count(),
            'attendanceToday' => (clone $attendance)->whereDate('date', $today)->count(),
            'presentToday' => (clone $attendance)->whereDate('date', $today)->where('status', 'present')->count(),
            'unreadNotifications' => \App\Models\Notification::where('is_read', false)
                ->where(function ($q) {
                    $q->whereNull('section_id');
                })
                ->when($sectionId !== null, function ($q) use ($sectionId) {
                    $q->orWhere('section_id', $sectionId);
                })
                ->count(),
        ];
    }

    /**
     * Profile-row ids (teacher_id / student_id / parent_id) of the accounts
     * inside the Sub-Admin's section, so the profile tables can be counted
     * with the same scoping as the users table.
     *
     * @return array<int, int>
     */
    protected function linkedIds(User $sub, string $role, string $column): array
    {
        if ($sub->section_id === null) {
            return [];
        }

        return User::where('role', $role)
            ->where('section_id', $sub->section_id)
            ->pluck($column)
            ->filter()
            ->unique()
            ->values()
            ->all();
    }
}
