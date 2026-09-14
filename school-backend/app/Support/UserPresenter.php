<?php

namespace App\Support;

use App\Models\SchoolClass;
use App\Models\User;

class UserPresenter
{
    /**
     * Build the role-flattened user object the frontend consumes.
     * Every role's extra attributes are lifted onto the user row so the
     * frontend's mapServerUser() can read them without extra joins.
     */
    public static function present(User $user): array
    {
        $data = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'avatar' => $user->avatar,
            'phone' => $user->phone,
            'address' => $user->address,
            'dob' => $user->dob?->toDateString(),
            'gender' => $user->gender,
            'status' => $user->status ?? 'active',
            'department' => $user->department,
            'bio' => $user->bio,
            'created_at' => $user->created_at?->toIso8601String(),
            'updated_at' => $user->updated_at?->toIso8601String(),
            'last_login' => $user->last_login?->toIso8601String(),
            'dateOfBirth' => $user->dob?->toDateString(),
            'nationality' => $user->nationality,
            'cin' => $user->cin,
            'city' => $user->city,
            'emergencyContactName' => $user->emergency_contact_name,
            'emergencyContactRelationship' => $user->emergency_contact_relationship,
            'emergencyContactPhone' => $user->emergency_contact_phone,
        ];

        if ($user->role === 'teacher') {
            $extra = [];
            $teacher = $user->teacher;

            if ($teacher) {
                $extra['teacher'] = $teacher;
                $extra['teacher_id'] = $teacher->id;
                $extra['subject_code'] = $teacher->subject_code;
                $extra['subject'] = $teacher->subject;
                $extra['class_codes'] = $teacher->class_codes ?? [];
            }

            $qualifications = $user->qualifications ?? [];
            if (empty($qualifications) && $teacher?->qualifications) {
                $qualifications = $teacher->qualifications;
            }
            if (empty($qualifications) && $teacher?->qualification) {
                $qualifications = is_array($teacher->qualification)
                    ? $teacher->qualification
                    : [$teacher->qualification];
            }

            $subjects = $user->subjects ?? [];
            if (empty($subjects) && $teacher?->subject) {
                $subjects = is_array($teacher->subject)
                    ? $teacher->subject
                    : [$teacher->subject];
            }

            $assigned = $user->assigned_classes ?? [];
            if (empty($assigned) && $teacher?->class_codes) {
                $assigned = $teacher->class_codes;
            }

            $extra['qualifications'] = array_values((array) $qualifications);
            $extra['subjects'] = array_values((array) $subjects);
            $extra['subject_name'] = $extra['subjects'][0] ?? null;
            $extra['assignedClasses'] = array_values((array) $assigned);
            $extra['assigned_classes'] = $extra['assignedClasses'];
            $extra['classes'] = $extra['assignedClasses'];
            $extra['specialization'] = $user->specialization;
            $extra['experienceYears'] = (int) $user->experience;
            $extra['experience'] = $extra['experienceYears']; // frontend reads su.experience
            $extra['employmentType'] = $user->employment_type;
            $extra['previousSchool'] = $user->previous_school;
            $extra['level'] = $user->level;

            $data = array_merge($data, $extra);
        }

        if ($user->role === 'student') {
            $extra = [];
            $student = $user->student;

            if ($student) {
                $extra['student'] = $student;
                $extra['student_id'] = $student->id;
                $extra['code'] = $student->code;
                $extra['class_code'] = $student->class_code;
                $extra['parent_id'] = $student->parent_id;
                $extra['parentId'] = $student->parent_id;
            }

            $className = $user->class_name ?? $student?->class_code;
            $level = $user->level;
            $classRow = $className ? SchoolClass::where('code', $className)->first() : null;
            if ($classRow) {
                if (! $level) {
                    $level = $classRow->level_key;
                }
                if ($className === $classRow->code) {
                    $className = $classRow->name;
                }
            }

            $extra['className'] = $className;
            $extra['class_name'] = $className;
            $extra['class'] = $className;
            $extra['class_code'] = $student?->class_code;
            $extra['department'] = $className;
            $extra['level'] = $level;
            $extra['studentNumber'] = $student?->code;
            $extra['student_code'] = $student?->code;
            $extra['code'] = $student?->code;
            $extra['massarNumber'] = $user->massar_number;
            $extra['massar_number'] = $user->massar_number;
            $extra['academicYear'] = $user->academic_year;
            $extra['admissionType'] = $user->admission_type;
            $extra['previousSchool'] = $user->previous_school;
            $extra['previousClass'] = $user->previous_class;
            $extra['previousAcademicYear'] = $user->previous_academic_year;
            $extra['parentName'] = $user->parent_name;
            $extra['parentEmail'] = $user->parent_email;
            $extra['parentPhone'] = $user->parent_phone;
            $extra['attendance'] = (int) $user->attendance;
            $extra['averageGrade'] = (float) $user->average_grade;

            $data = array_merge($data, $extra);
        }

        if ($user->role === 'parent') {
            $extra = [];
            $parent = $user->parent;

            if ($parent) {
                $extra['parent'] = $parent;
                $extra['parent_id'] = $parent->id;
                $extra['cin_id'] = $parent->cin_id;
                $extra['children'] = $parent->children;
                $extra['relationship'] = $parent->relationship;
            }

            $childrenNames = $user->children_names ?? [];
            if (empty($childrenNames) && ! empty($extra['children'])) {
                $childrenNames = array_values((array) $extra['children']);
            }

            $extra['childrenNames'] = array_values((array) $childrenNames);
            $extra['occupation'] = $user->occupation;
            $extra['employer'] = $user->employer;

            $data = array_merge($data, $extra);
        }

        return $data;
    }
}