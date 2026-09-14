<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\UserPresenter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::with(['teacher', 'student', 'parent']);

        if ($request->filled('role') && $request->role !== 'all') {
            $query->where('role', $request->role);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $users = $query->orderBy('id')->get();

        return response()->json([
            'data' => $users->map(fn (User $u) => UserPresenter::present($u)),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'sometimes|string|max:120',
            'email' => 'required|email|unique:users,email',
            'role' => 'required|in:admin,teacher,parent,student',
            'password' => 'sometimes|string|min:6',
        ]);

        $data = $this->normalizeStoreData($request);

        if (empty($data['name'])) {
            $data['name'] = str($data['email'])->before('@')->toString();
        }

        $user = User::create($data);
        $this->applyRoleData($user, $request);

        $this->linkProfile($user, $request);

        \App\Support\ChildLinker::link($user->fresh(['student', 'parent']));

        $this->syncClassTeacher($user->fresh());

        return response()->json([
            'success' => true,
            'data' => UserPresenter::present($user->fresh(['teacher', 'student', 'parent'])),
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $user = User::with(['teacher', 'student', 'parent'])->findOrFail($id);

        $request->validate([
            'name' => 'sometimes|string|max:120',
            'email' => 'sometimes|email|unique:users,email,'.$user->id,
        ]);

        $map = [
            'name' => 'name',
            'email' => 'email',
            'phone' => 'phone',
            'address' => 'address',
            'status' => 'status',
            'role' => 'role',
            'avatar' => 'avatar',
            'department' => 'department',
            'bio' => 'bio',
            'password' => 'password',
            'dateOfBirth' => 'dob',
            'gender' => 'gender',
            'nationality' => 'nationality',
            'cin' => 'cin',
            'city' => 'city',
            'emergencyContactName' => 'emergency_contact_name',
            'emergencyContactRelationship' => 'emergency_contact_relationship',
            'emergencyContactPhone' => 'emergency_contact_phone',
            'level' => 'level',
            'specialization' => 'specialization',
            'employmentType' => 'employment_type',
            'previousSchool' => 'previous_school',
            'experienceYears' => 'experience',
            'experience' => 'experience',
            'className' => 'class_name',
            'class_name' => 'class_name',
            'massarNumber' => 'massar_number',
            'academicYear' => 'academic_year',
            'admissionType' => 'admission_type',
            'previousClass' => 'previous_class',
            'previousAcademicYear' => 'previous_academic_year',
            'parentName' => 'parent_name',
            'parentEmail' => 'parent_email',
            'parentPhone' => 'parent_phone',
            'attendance' => 'attendance',
            'averageGrade' => 'average_grade',
            'occupation' => 'occupation',
            'employer' => 'employer',
        ];

        $fill = [];
        foreach ($map as $inputKey => $column) {
            if ($request->has($inputKey)) {
                $fill[$column] = $request->input($inputKey);
            }
        }

        if ($request->has('bio') && $user->role === 'student') {
            $fill['level'] = $request->input('bio');
        }

        if (isset($fill['password'])) {
            $fill['password'] = Hash::make($fill['password']);
        }

        if (! empty($fill)) {
            $user->fill($fill);
        }

        // applyRoleData maps role-specific payloads (assignedClasses, childrenNames, ...)
        // which live outside $map; ensure they are persisted too.
        $this->applyRoleData($user, $request, true);

        if ($user->isDirty()) {
            $user->save();
        }

        $this->syncClassTeacher($user->fresh());

        if ($user->role === 'student') {
            $this->syncStudentProfile($user, $request);
        }

        if ($user->role === 'parent') {
            $this->syncParentProfile($user, $request);
        }

        if ($user->role === 'teacher') {
            $this->syncTeacherProfile($user);
        }

        if ($request->has('email') && $user->role === 'student' && $user->student) {
            $user->student->email = $request->input('email');
            $user->student->save();
        }

        \App\Support\ChildLinker::link($user->fresh(['student', 'parent']));

        return response()->json([
            'success' => true,
            'data' => UserPresenter::present($user->fresh(['teacher', 'student', 'parent'])),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        if ($request->user()?->id === $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot delete your own account.',
            ], 422);
        }

        $user->tokens()->delete();

        if ($user->student_id) {
            \App\Models\Student::where('id', $user->student_id)->delete();
        }
        if ($user->teacher_id) {
            \App\Models\Teacher::where('id', $user->teacher_id)->delete();
        }
        if ($user->parent_id) {
            \App\Models\Student::where('parent_id', $user->parent_id)->update(['parent_id' => null]);
            \App\Models\StudentDataParent::where('id', $user->parent_id)->delete();
        }

        $user->delete();

        // Keep auto-increment sequential after deletes: the next row reuses a
        // freed top id (MySQL clamps to MAX(id)+1).
        \Illuminate\Support\Facades\DB::statement('ALTER TABLE users AUTO_INCREMENT = 1');
        \Illuminate\Support\Facades\DB::statement('ALTER TABLE students AUTO_INCREMENT = 1');

        return response()->json(['success' => true]);
    }

    public function resetPassword(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $tempPassword = \Illuminate\Support\Str::random(10);

        $user->forceFill(['password' => Hash::make($tempPassword)])->save();

        return response()->json([
            'success' => true,
            'data' => ['tempPassword' => $tempPassword],
        ]);
    }

    protected function normalizeStoreData(Request $request): array
    {
        $data = $request->only([
            'name', 'email', 'role', 'phone', 'address', 'status',
            'department', 'bio', 'gender', 'nationality', 'cin', 'city',
            'avatar',
        ]);

        if (! isset($data['status']) || $data['status'] === '') {
            $data['status'] = 'active';
        }

        if ($request->has('password')) {
            $data['password'] = Hash::make($request->password);
        }

        if ($request->has('dateOfBirth')) {
            $data['dob'] = $request->input('dateOfBirth');
        }

        foreach ([
            'emergencyContactName' => 'emergency_contact_name',
            'emergencyContactRelationship' => 'emergency_contact_relationship',
            'emergencyContactPhone' => 'emergency_contact_phone',
            'className' => 'class_name',
            'massarNumber' => 'massar_number',
            'academicYear' => 'academic_year',
            'admissionType' => 'admission_type',
            'previousClass' => 'previous_class',
            'previousAcademicYear' => 'previous_academic_year',
            'parentName' => 'parent_name',
            'parentEmail' => 'parent_email',
            'parentPhone' => 'parent_phone',
            'averageGrade' => 'average_grade',
            'occupation' => 'occupation',
            'employer' => 'employer',
            'specialization' => 'specialization',
            'employmentType' => 'employment_type',
            'previousSchool' => 'previous_school',
            'level' => 'level',
        ] as $inputKey => $column) {
            if ($request->has($inputKey)) {
                $data[$column] = $request->input($inputKey);
            }
        }

        if ($request->has('experienceYears')) {
            $data['experience'] = (int) $request->input('experienceYears');
        } elseif ($request->has('experience')) {
            $data['experience'] = (int) $request->input('experience');
        }

        return $data;
    }

    protected function applyRoleData(User $user, Request $request, bool $updateOnly = false): void
    {
        $fill = [];

        if ($user->role === 'teacher') {
            if ($request->has('qualifications')) {
                $fill['qualifications'] = $this->toArray($request->input('qualifications'));
            }
            if ($request->has('subjects')) {
                $fill['subjects'] = $this->toArray($request->input('subjects'));
            }
            if ($request->has('assignedClasses') || $request->has('assigned_classes')) {
                $value = $request->has('assignedClasses')
                    ? $request->input('assignedClasses')
                    : $request->input('assigned_classes');
                $fill['assigned_classes'] = $this->toArray($value);
            }
        }

        if ($user->role === 'parent') {
            if ($request->has('childrenNames') || $request->has('children_names')) {
                $value = $request->has('childrenNames')
                    ? $request->input('childrenNames')
                    : $request->input('children_names');
                $fill['children_names'] = $this->toArray($value);
            }
        }

        if ($user->role === 'student') {
            if ($request->has('attendance')) {
                $fill['attendance'] = max(0, min(100, (int) $request->input('attendance')));
            }
            if ($request->has('averageGrade')) {
                $fill['average_grade'] = max(0, min(100, (float) $request->input('averageGrade')));
            }
        }

        if (! empty($fill) && $updateOnly) {
            $user->fill($fill);
        } elseif (! empty($fill)) {
            $user->forceFill($fill);
        }
    }

    protected function linkProfile(User $user, Request $request): void
    {
        if ($user->role === 'teacher') {
            $this->syncTeacherProfile($user);
        }

        if ($user->role === 'parent') {
            $this->syncParentProfile($user, $request);
        }

        if ($user->role === 'student') {
            $this->syncStudentProfile($user, $request);
        }
    }

    /**
     * Create (or update) the teachers-table profile for a teacher user so the
     * denormalised teacher row mirrors the users-row fields exactly: name,
     * email, phone, gender, dob, address, plus the first subject (code + name)
     * and the assigned class codes.
     */
    protected function syncTeacherProfile(User $user): void
    {
        if ($user->role !== 'teacher') {
            return;
        }

        if (! $user->teacher_id) {
            $teacher = \App\Models\Teacher::create([
                'name' => $user->name,
                'email' => $user->email,
                'status' => $user->status ?? 'active',
                'class_codes' => $this->toArray($user->assigned_classes),
            ]);
            $user->teacher_id = $teacher->id;
            $user->save();
        } else {
            $teacher = $user->teacher;
        }

        $subjects = $this->toArray($user->subjects);

        $fill = [
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'gender' => $user->gender,
            'dob' => $user->dob,
            'address' => $user->address,
            'class_codes' => $this->toArray($user->assigned_classes),
        ];

        if (! empty($subjects)) {
            $fill['subject_code'] = (string) $subjects[0];
            $fill['subject'] = $this->subjectDisplayName((string) $subjects[0]);
        } else {
            $fill['subject_code'] = null;
            $fill['subject'] = null;
        }

        $teacher->fill($fill);
        $teacher->save();
    }

    protected function subjectDisplayName(string $code): string
    {
        $subject = \App\Models\Subject::where('code', $code)->first();

        return $subject?->name ?? $code;
    }

    /**
     * Create (or update) the parents-table profile for a parent user, copying
     * the fields held on the users row into the profile and keeping the
     * children list aligned with childrenNames.
     */
    protected function syncParentProfile(User $user, Request $request): void
    {
        if ($user->role !== 'parent') {
            return;
        }

        $fill = [
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'cin_id' => $user->cin,
            'address' => $user->address,
            'status' => $user->status ?? 'active',
        ];
        if ($request->has('relationship') && $request->input('relationship') !== null) {
            $fill['relationship'] = $request->input('relationship');
        }

        $childrenValue = $request->has('childrenNames')
            ? $request->input('childrenNames')
            : ($request->has('children_names')
                ? $request->input('children_names')
                : $user->children_names);
        $children = $this->toArray($childrenValue);
        if (! empty($children)) {
            $fill['children'] = $children;
        }

        if (! $user->parent_id) {
            $parent = \App\Models\StudentDataParent::create($fill);
            if (empty($parent->code)) {
                $parent->code = 'PRT-'.str_pad((string) $parent->id, 4, '0', STR_PAD_LEFT);
                $parent->save();
            }
            $user->parent_id = $parent->id;
            $user->save();

            return;
        }

        $parent = \App\Models\StudentDataParent::find($user->parent_id);
        if (! $parent) {
            return;
        }
        $parent->fill($fill);
        if (empty($parent->code)) {
            $parent->code = 'PRT-'.str_pad((string) $parent->id, 4, '0', STR_PAD_LEFT);
        }
        $parent->save();
    }

    /**
     * Create (or update) the students-table profile for a student user, copying
     * the personal fields held on the users row into the profile and keeping the
     * canonical class_code aligned with the classes table.
     */
    protected function syncStudentProfile(User $user, Request $request): void
    {
        if ($user->role !== 'student') {
            return;
        }

        $classCode = $request->input('classCode') ?: $request->input('class_code') ?: $user->class_name;
        $guardian = $this->guardianPayload($user);

        if (! $user->student_id) {
            $student = \App\Models\Student::create([
                'name' => $user->name,
                'email' => $user->email,
                'class_code' => $classCode,
                'gender' => $user->gender,
                'dob' => $user->dob,
                'address' => $user->address,
                'status' => $user->status ?? 'active',
                'guardian' => $guardian ?: null,
                'code' => $request->input('code'),
            ]);

            if (empty($student->code)) {
                $student->code = $this->buildStudentCode($student);
                $student->save();
            }

            $user->student_id = $student->id;
            $user->save();

            return;
        }

        $student = \App\Models\Student::find($user->student_id);
        if (! $student) {
            return;
        }

        $fill = [];
        if ($user->name !== null && $student->name !== $user->name) {
            $fill['name'] = $user->name;
        }
        if ($user->email !== null && $student->email !== $user->email) {
            $fill['email'] = $user->email;
        }
        if ($classCode !== null && $student->class_code !== $classCode) {
            $fill['class_code'] = $classCode;

            // Reflect the new class's level in the standard ID (letter change).
            $fill['code'] = $this->buildStudentCode($student, $classCode);
        }
        if ($user->gender !== null && $student->gender !== $user->gender) {
            $fill['gender'] = $user->gender;
        }
        if ($user->dob !== null && (string) $student->dob !== (string) $user->dob) {
            $fill['dob'] = $user->dob;
        }
        if ($user->address !== null && $student->address !== $user->address) {
            $fill['address'] = $user->address;
        }
        if ($user->status !== null && $student->status !== $user->status) {
            $fill['status'] = $user->status;
        }
        if (! empty($guardian) && $student->guardian !== $guardian) {
            $fill['guardian'] = $guardian;
        }
        if (empty($student->code) && $request->filled('code')) {
            $fill['code'] = $request->input('code');
        }

        if (! empty($fill)) {
            $student->fill($fill)->save();
        }
    }

    protected function guardianPayload(User $user): array
    {
        $guardian = [];
        if (! empty($user->parent_name)) {
            $guardian['name'] = $user->parent_name;
        }
        if (! empty($user->parent_email)) {
            $guardian['email'] = $user->parent_email;
        }
        if (! empty($user->parent_phone)) {
            $guardian['phone'] = $user->parent_phone;
        }

        return $guardian;
    }

    /**
     * Build the canonical student ID string `alfath/stu/<year>/<letter><serial>`
     * where <letter> reflects the class level (K/P/S/H) resolved through the
     * classes table and <serial> is the student's numeric ID.
     */
    protected function buildStudentCode(\App\Models\Student $student, ?string $classCode = null): string
    {
        $classRef = $classCode ?? $student->class_code;

        $classLetter = \App\Models\SchoolClass::where('code', $classRef)
            ->orWhere('name', $classRef)
            ->value('level_key');

        $letter = match ($classLetter) {
            'kindergarten' => 'K',
            'primary' => 'P',
            'secondary' => 'S',
            'high_school' => 'H',
            default => 'S',
        };

        return 'alfath/stu/'.now()->year.'/'.$letter.$student->id;
    }

    protected function toArray(mixed $value): array
    {
        if (is_array($value)) {
            return array_values($value);
        }
        if (is_string($value)) {
            return $value === ''
                ? []
                : array_map('trim', array_filter(explode(',', $value), fn ($v) => trim($v) !== ''));
        }

        return [];
    }

    protected function syncClassTeacher(\App\Models\User $user): void
    {
        \Illuminate\Support\Facades\DB::table('class_teacher')->where('user_id', $user->id)->delete();

        $codes = is_array($user->assigned_classes) ? $user->assigned_classes : [];
        foreach (array_values($codes) as $code) {
            if ($code === null || $code === '') {
                continue;
            }
            if (\App\Models\SchoolClass::where('code', $code)->exists()) {
                \Illuminate\Support\Facades\DB::table('class_teacher')->updateOrInsert(
                    ['user_id' => $user->id, 'class_code' => $code],
                    ['created_at' => now()]
                );
            }
        }
    }
}