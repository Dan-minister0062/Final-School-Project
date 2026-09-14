<?php

namespace Database\Seeders;

use App\Models\StudentDataParent;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(ClassSeeder::class);
        $this->call(SubjectSeeder::class);

        // Demo accounts (same emails/password used by the frontend demo-login).
        $password = Hash::make('password123');

        $teacher = Teacher::firstOrCreate(
            ['email' => 'teacher@madrasatulfathi.com'],
            [
                'name' => 'Teacher User',
                'email' => 'teacher@madrasatulfathi.com',
                'phone' => '+212 6 00 00 00 01',
                'gender' => 'female',
                'subject_code' => 'M',
                'subject' => 'Mathématiques',
                'class_codes' => ['primary_6a', 'primary_6b'],
            ]
        );

        $parent = StudentDataParent::firstOrCreate(
            ['email' => 'parent@madrasatulfathi.com'],
            [
                'name' => 'Parent User',
                'email' => 'parent@madrasatulfathi.com',
                'phone' => '+212 6 00 00 00 02',
                'cin_id' => 'AB123456',
                'children' => ['STU-1001'],
            ]
        );

        $student = \App\Models\Student::firstOrCreate(
            ['email' => 'student@madrasatulfathi.com'],
            [
                'name' => 'Student User',
                'email' => 'student@madrasatulfathi.com',
                'code' => 'STU-1001',
                'class_code' => 'primary_6a',
                'gender' => 'male',
                'parent_id' => $parent->id,
            ]
        );

        $accounts = [
            ['admin@madrasatulfathi.com', 'Admin User', 'admin'],
            ['teacher@madrasatulfathi.com', 'Teacher User', 'teacher'],
            ['parent@madrasatulfathi.com', 'Parent User', 'parent'],
            ['student@madrasatulfathi.com', 'Student User', 'student'],
            ['demo@example.com', 'Demo User', 'admin'],
        ];

        foreach ($accounts as [$email, $name, $role]) {
            User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    'email' => $email,
                    'password' => $password,
                    'role' => $role,
                    'teacher_id' => $role === 'teacher' ? $teacher->id : null,
                    'student_id' => $role === 'student' ? $student->id : null,
                    'parent_id' => $role === 'parent' ? $parent->id : null,
                    'status' => 'active',
                ]
            );
        }

        // A few extra sample students linked to classes
        $sample = [
            ['STU-1002', 'Yasmine El Amrani', 'primary_6a', 'female'],
            ['STU-1003', 'Omar Bennani', 'primary_5a', 'male'],
            ['STU-1004', 'Salma Ouazzani', 'secondary_1a', 'female'],
            ['STU-1005', 'Mehdi Tazi', 'kindergarten_intro', 'male'],
        ];
        foreach ($sample as [$code, $name, $class, $gender]) {
            \App\Models\Student::firstOrCreate(
                ['code' => $code],
                ['name' => $name, 'email' => null, 'class_code' => $class, 'gender' => $gender]
            );
        }

        // Sample announcements
        if (\App\Models\Announcement::count() === 0) {
            \App\Models\Announcement::create([
                'title' => 'Welcome to the new academic year',
                'content' => 'Registration for the new school year is now open for all levels.',
                'category' => 'general',
                'audience' => 'all',
                'published_by' => 1,
                'status' => 'active',
            ]);
        }

        // Sample notifications
        if (\App\Models\Notification::count() === 0) {
            \App\Models\Notification::create([
                'title' => 'New admission submitted',
                'message' => 'A new admission application is awaiting review.',
                'type' => 'info',
                'audience' => 'admin',
                'is_read' => false,
            ]);
        }
    }
}