<?php

namespace App\Http\Controllers;

use App\Models\Section;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\SectionScope;
use App\Support\Rbac;
use App\Support\UserPresenter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function __construct(
        private AuditLogger $audit,
        private SectionScope $scope,
    ) {}
    /**
     * Bound the rows a list endpoint returns. Without a cap the users query
     * loaded every account at once and exceeded the client's 30s timeout.
     */
    protected function rowLimit(Request $request, int $default = 500, int $max = 1000): int
    {
        $limit = (int) $request->input('limit', $default);

        return max(1, min($limit, $max));
    }

    public function index(Request $request): JsonResponse
    {
        $caller = $request->user();
        $query = User::with(['teacher', 'student', 'parent', 'section:id,key,name']);

        abort_unless($caller && $caller->isAnyAdmin(), 403);

        if ($request->filled('role') && $request->role !== 'all') {
            $query->where('role', $request->role);
        }

        // A Sub-Admin may only ever see the accounts inside its own section,
        // and must never be handed the full cross-section roster.
        if ($caller->isSubAdmin()) {
            abort_unless($caller->hasPermission('users.view'), 403, 'You cannot view users.');

            if ($caller->section_id === null) {
                return response()->json(['data' => []]);
            }

            $query->where('section_id', $caller->section_id);
        }

        if ($request->filled('section_id')) {
            if ($caller->isSubAdmin() && (int) $request->section_id !== (int) $caller->section_id) {
                abort(403, 'That section is outside your scope.');
            }
            $query->where('section_id', $request->integer('section_id'));
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $users = $query->orderBy('id')
            ->limit($this->rowLimit($request))
            ->get();

        return response()->json([
            'data' => $users->map(fn (User $u) => UserPresenter::present($u)),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $caller = $request->user();

        $request->validate([
            'name' => 'sometimes|string|max:120',
            'email' => 'required|email|unique:users,email',
            'role' => 'required|in:admin,teacher,parent,student',
            'password' => 'sometimes|string|min:6',
            'section_id' => 'nullable|integer|exists:sections,id',
        ]);

        $role = $request->role;

        // ---- privilege escalation guards ---------------------------------
        // Only a Super Admin may mint another admin account.
        if ($role === 'admin' && ! $caller->isSuperAdmin()) {
            $this->audit->denied('user.admin_creation_blocked', $caller, [
                'attempted_role' => 'admin',
            ]);

            abort(403, 'Only the Super Admin can create admin accounts.');
        }

        if ($caller->isSubAdmin()) {
            abort_unless($caller->hasPermission('users.create'), 403, 'You cannot create users.');

            // A Sub-Admin can only create accounts inside its own section.
            if ($request->filled('section_id') && (int) $request->section_id !== (int) $caller->section_id) {
                abort(403, 'You can only create users inside your own section.');
            }

            if ($caller->section_id === null) {
                abort(403, 'Your account is not assigned to a section yet.');
            }
        }

        // A Sub-Admin may only place staff into classes it governs, so a
        // created account can never reference another section's class.
        if ($caller->isSubAdmin()) {
            $this->assertProfileClassesInScope($caller, $request, $role);
        }

        $data = $this->normalizeStoreData($request);

        if (empty($data['name'])) {
            $data['name'] = str($data['email'])->before('@')->toString();
        }

        // Pin a Sub-Admin's new account into its own section, regardless of payload.
        if ($caller->isSubAdmin()) {
            $section = Section::find($caller->section_id);
            $data['section_id'] = $caller->section_id;
            $data['section_scope'] = $section?->key;
        } elseif ($request->filled('section_id')) {
            $section = Section::find($request->integer('section_id'));
            $data['section_id'] = $section?->id;
            $data['section_scope'] = $section?->key;

            // An admin account scoped to a section is a Sub-Admin: without
            // the tier flag a section-bound admin would still resolve to
            // the Super tier and ignore the section entirely.
            if ($role === 'admin') {
                $data['is_super_admin'] = false;
                $data['is_sub_admin'] = true;
                $data['permissions'] = Rbac::defaults();
            }
        } elseif ($caller->isSuperAdmin()) {
            // No section in the payload: place staff accounts in the section
            // of the class they belong to, so a Sub-Admin can see them.
            $this->applyDerivedSection($data, $request, $role);
        }

        $user = User::create($data);
        $this->applyRoleData($user, $request);

        $this->linkProfile($user, $request);

        \App\Support\ChildLinker::link($user->fresh(['student', 'parent']));
        \App\Support\ChildLinker::linkAll();

        // A parent's section is the section of the children it is linked to.
        if ($caller->isSuperAdmin() && $user->section_id === null) {
            $this->deriveParentSection($user);
        }

        $this->syncClassTeacher($user->fresh());

        $this->audit->log('user.created', $caller, User::class, $user->id, $user->section_id, [
            'role' => $user->role,
            'email' => $user->email,
        ], "Created {$user->role} account {$user->email}");

        return response()->json([
            'success' => true,
            'data' => UserPresenter::present($user->fresh(['teacher', 'student', 'parent', 'section'])),
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $caller = $request->user();
        $user = User::with(['teacher', 'student', 'parent'])->findOrFail($id);

        // ---- Super Admin protection (hard block) -------------------------
        if ($user->isSuperAdmin() && ! $caller->isSuperAdmin()) {
            $this->audit->denied('super_admin.protected', $caller, [
                'target_user_id' => $user->id,
            ]);

            abort(403, 'The Super Admin account cannot be modified by another account.');
        }

        if ($caller->isSubAdmin()) {
            $this->scope->assertUserInScope($request, $user);
            abort_unless($caller->hasPermission('users.update'), 403, 'You cannot update users.');
        }

        $request->validate([
            'name' => 'sometimes|string|max:120',
            'email' => 'sometimes|email|unique:users,email,'.$user->id,
            'section_id' => 'nullable|integer|exists:sections,id',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string',
        ]);

        // ---- privilege escalation guards ---------------------------------
        // The frontend always echoes the current role back, so only a role
        // that actually differs from the stored one is a change to guard.
        if ($request->has('role') && (string) $request->input('role') !== (string) $user->role) {
            if (! $caller->isSuperAdmin()) {
                $this->audit->denied('user.role_change_blocked', $caller, [
                    'target_user_id' => $user->id,
                    'attempted_role' => $request->input('role'),
                ]);

                abort(403, 'Only the Super Admin can change a role.');
            }
        }

        if ($request->has('permissions')) {
            abort_unless($caller->isSuperAdmin(), 403, 'Only the Super Admin can change permissions.');
        }

        if ($request->has('section_id') && $caller->isSubAdmin()) {
            abort(403, 'Only the Super Admin can move an account between sections.');
        }

        // A Sub-Admin may only re-point staff at classes it governs.
        if ($caller->isSubAdmin()) {
            $this->assertProfileClassesInScope($caller, $request, $user->role);
        }

        // A Super Admin's own tier flags may only be changed by another
        // Super Admin, and never self-demoted.
        if ($user->isSuperAdmin() && $caller->isSuperAdmin() && (int) $caller->id === (int) $user->id) {
            foreach (['is_super_admin', 'is_sub_admin'] as $tierField) {
                if ($request->has($tierField) && ! $request->boolean($tierField)) {
                    abort(403, 'You cannot demote your own Super Admin account.');
                }
            }
        }

        $originalRole = $user->role;
        $originalStatus = $user->status;
        $originalSection = $user->section_id;
        $originalPermissions = $user->permissionList();

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

        // experience / attendance / average_grade are NOT NULL with a 0 default.
        // A cleared numeric input arrives as null or "" and would abort the
        // whole save with "Column 'experience' cannot be null", so normalise
        // them here exactly as the store path already does.
        foreach (['experience', 'attendance', 'average_grade'] as $numeric) {
            if (array_key_exists($numeric, $fill)) {
                $fill[$numeric] = is_numeric($fill[$numeric]) ? $fill[$numeric] + 0 : 0;
            }
        }

        if ($request->has('bio') && $user->role === 'student') {
            $fill['level'] = $request->input('bio');
        }

        // Section + permission writes are RBAC-controlled, never mass-assignable.
        if ($request->has('section_id')) {
            $section = Section::find($request->integer('section_id'));
            $fill['section_id'] = $section?->id;
            $fill['section_scope'] = $section?->key;
        }

        if ($request->has('permissions')) {
            $fill['permissions'] = Rbac::sanitizeGrantable((array) $request->input('permissions'));
        }

        if ($caller->isSubAdmin() && ! empty($caller->section_id)) {
            // hard pin: a Sub-Admin can never move an account out of its section
            $fill['section_id'] = $caller->section_id;
            $fill['section_scope'] = Section::find($caller->section_id)?->key;
        }

        if (! empty($fill)) {
            $user->fill($fill);
        }

        // applyRoleData maps role-specific payloads (assignedClasses, childrenNames, ...)
        // which live outside $map; ensure they are persisted too.
        $this->applyRoleData($user, $request, true);

        if ($caller->isSuperAdmin()) {
            $this->syncTierFromSectionPayload($user, $request);
            $this->syncSectionFromProfile($user, $request);
        }

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

        // Linked children decide a parent's section: heal a section-less
        // parent account from them (the explicit section_id payload above
        // always wins for Super Admins).
        if ($caller->isSuperAdmin() && ! $request->has('section_id') && $user->role === 'parent') {
            $this->deriveParentSection($user);
        }

        if ($request->has('email') && $user->role === 'student' && $user->student) {
            $user->student->email = $request->input('email');
            $user->student->save();
        }

        \App\Support\ChildLinker::link($user->fresh(['student', 'parent']));
        \App\Support\ChildLinker::linkAll();

        $changed = array_keys(array_filter([
            'role' => $originalRole !== $user->role ? $user->role : null,
            'status' => $originalStatus !== $user->status ? $user->status : null,
            'section_id' => (int) $originalSection !== (int) $user->section_id ? $user->section_id : null,
            'permissions' => $originalPermissions !== $user->permissionList() ? $user->permissionList() : null,
        ], static fn ($value) => $value !== null));

        if ($changed !== []) {
            // A tier change revokes every live session so a stale token cannot
            // keep acting with the permissions it was issued under.
            //
            // Editing one's own record must never log the caller out: the
            // guards above already block self-demotion, and benign edits
            // (date of birth, a normalised NULL -> 'active' status, ...) must
            // not destroy the admin's own session mid-request.
            $isSelfUpdate = $caller !== null && (int) $caller->id === (int) $user->id;

            if (! $isSelfUpdate
                && (in_array('role', $changed, true)
                    || in_array('permissions', $changed, true)
                    || in_array('section_id', $changed, true)
                    || in_array('status', $changed, true))) {
                $user->tokens()->delete();
            }

            $this->audit->log('user.updated', $caller, User::class, $user->id, $user->section_id, [
                'changed' => $changed,
            ], "Updated {$user->role} account {$user->email}");
        }

        return response()->json([
            'success' => true,
            'data' => UserPresenter::present($user->fresh(['teacher', 'student', 'parent', 'section'])),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $caller = $request->user();
        $user = User::findOrFail($id);

        // A Super Admin may only be demoted by another Super Admin, never
        // deleted through the generic user endpoint. Checked before the
        // self-delete rule so the response is always 403 for this tier.
        if ($user->isSuperAdmin()) {
            $this->audit->denied('super_admin.delete_blocked', $caller, [
                'target_user_id' => $user->id,
            ]);

            abort(403, 'A Super Admin cannot be deleted. Demote the account instead.');
        }

        if ($caller?->id === $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot delete your own account.',
            ], 422);
        }

        if ($caller?->isSubAdmin()) {
            $this->scope->assertUserInScope($request, $user);
            abort_unless($caller->hasPermission('users.delete'), 403, 'You cannot delete users.');
        }

        $email = $user->email;
        $role = $user->role;
        $sectionId = $user->section_id;

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

        $this->audit->log('user.deleted', $caller, User::class, $user->id, $sectionId, [
            'email' => $email,
            'role' => $role,
        ], "Deleted {$role} account {$email}");

        return response()->json(['success' => true]);
    }

    public function resetPassword(Request $request, int $id): JsonResponse
    {
        $caller = $request->user();
        $user = User::findOrFail($id);

        // Resetting a Super Admin password would be an account takeover, so it
        // is limited to other Super Admins.
        if ($user->isSuperAdmin() && ! $caller?->isSuperAdmin()) {
            $this->audit->denied('super_admin.password_reset_blocked', $caller, [
                'target_user_id' => $user->id,
            ]);

            abort(403, 'The Super Admin password can only be reset by another Super Admin.');
        }

        if ($caller?->isSubAdmin()) {
            $this->scope->assertUserInScope($request, $user);
        }

        $tempPassword = \Illuminate\Support\Str::random(10);

        $user->forceFill(['password' => Hash::make($tempPassword)])->save();

        // Every existing session must die with the old password.
        $user->tokens()->delete();

        $this->audit->log('user.password_reset', $caller, User::class, $user->id, $user->section_id, [
            'role' => $user->role,
        ], "Reset the password for {$user->email}");

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

        // users.password is NOT NULL, so an account created without an explicit
        // password gets a random unusable one instead of a 500.
        $data['password'] = Hash::make(
            $request->filled('password') ? $request->password : \Illuminate\Support\Str::random(24)
        );

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

    /**
     * Derive users.section_id from the class signal a staff payload carries:
     * students follow their class, teachers their first assigned class. An
     * unresolvable class leaves the account section-less (Super Admin's
     * cross-section view only), never wrongly sectioned.
     */
    protected function applyDerivedSection(array &$data, Request $request, string $role): void
    {
        $section = null;

        if ($role === 'student') {
            $section = $this->sectionForClassRef($this->classRefForStudent($request));
        } elseif ($role === 'teacher') {
            $refs = $this->classRefForTeacher($request);
            $section = $refs !== [] ? $this->sectionForClassRef($refs[0]) : null;
        }

        if ($section !== null) {
            $data['section_id'] = $section->id;
            $data['section_scope'] = $section->key;
        }
    }

    /** The student's class as carried by the request (code or display name). */
    protected function classRefForStudent(Request $request, ?User $user = null): ?string
    {
        $ref = $request->input('classCode')
            ?: $request->input('class_code')
            ?: $request->input('className')
            ?: $request->input('class_name');

        if ($ref === null && $user !== null) {
            $ref = $user->class_name;
        }

        return $ref !== null && $ref !== '' ? (string) $ref : null;
    }

    /** The teacher's assigned class codes, request first, profile as fallback. */
    protected function classRefForTeacher(Request $request, ?User $user = null): array
    {
        $assigned = $request->input('assignedClasses') ?? $request->input('assigned_classes');

        if ($assigned === null && $user !== null) {
            $assigned = $user->assigned_classes;
        }

        if (is_string($assigned)) {
            $decoded = json_decode($assigned, true);
            $assigned = is_array($decoded) ? $decoded : explode(',', $assigned);
        }

        return is_array($assigned)
            ? array_values(array_filter($assigned, fn ($code) => $code !== null && $code !== ''))
            : [];
    }

    /** Resolve a class reference (code or name) to its section row. */
    protected function sectionForClassRef(?string $classRef): ?Section
    {
        if ($classRef === null) {
            return null;
        }

        $class = \App\Models\SchoolClass::where('code', $classRef)
            ->orWhere('name', $classRef)
            ->first();

        if (! $class) {
            return null;
        }

        if ($class->section_id !== null) {
            return Section::find($class->section_id);
        }

        $key = Section::keyForClassLevel($class->level_key);

        return $key !== null ? Section::where('key', $key)->first() : null;
    }

    /**
     * A Sub-Admin may only place staff into classes it governs. Only classes
     * the payload itself names are checked, so editing unrelated fields of
     * an account is never blocked by its stored class.
     */
    protected function assertProfileClassesInScope(User $caller, Request $request, string $role): void
    {
        $refs = [];

        if ($role === 'student') {
            $ref = $request->input('classCode')
                ?: $request->input('class_code')
                ?: $request->input('className')
                ?: $request->input('class_name');

            if ($ref !== null && $ref !== '') {
                $refs[] = (string) $ref;
            }
        } elseif ($role === 'teacher') {
            $refs = $this->classRefForTeacher($request);
        }

        if ($refs === []) {
            return;
        }

        $allowed = $caller->allowedClassValues();

        foreach ($refs as $ref) {
            abort_unless(
                in_array($ref, $allowed, true),
                403,
                'That class belongs to another section.'
            );
        }
    }

    /**
     * A parent's section is the section of the children it is linked to.
     * Section-less parent accounts only: an explicit section always wins.
     */
    protected function deriveParentSection(User $user): void
    {
        if ($user->section_id !== null || $user->parent_id === null) {
            return;
        }

        $classRefs = \App\Models\Student::where('parent_id', $user->parent_id)
            ->pluck('class_code')
            ->filter()
            ->unique()
            ->values();

        foreach ($classRefs as $ref) {
            $section = $this->sectionForClassRef((string) $ref);

            if ($section !== null) {
                $user->forceFill([
                    'section_id' => $section->id,
                    'section_scope' => $section->key,
                ])->save();

                break;
            }
        }
    }

    /**
     * Mirrors an admin account's tier onto its section payload: a section
     * turns a plain admin into a Sub-Admin. Explicit Super Admins and
     * self-edits never change tier here - that stays the exclusive job of
     * the dedicated /admins/{id} lifecycle endpoints with their guards.
     */
    protected function syncTierFromSectionPayload(User $user, Request $request): void
    {
        if ($user->role !== 'admin' || ! $request->filled('section_id')) {
            return;
        }

        if ($user->id === $request->user()?->id || (bool) $user->is_super_admin) {
            return;
        }

        $user->is_super_admin = false;
        $user->is_sub_admin = true;

        if (empty($user->permissions)) {
            $user->permissions = Rbac::defaults();
        }
    }

    /**
     * Keeps section membership aligned with the class a staff account
     * belongs to: heals section-less rows and follows a class change, but
     * never overrides an explicit section payload or touches a section that
     * nothing in this request pointed away from.
     */
    protected function syncSectionFromProfile(User $user, Request $request): void
    {
        if ($request->has('section_id')) {
            return;
        }

        $classSignalPresent = $request->hasAny([
            'classCode', 'class_code', 'className', 'class_name',
            'assignedClasses', 'assigned_classes',
        ]);

        if ($user->section_id !== null && ! $classSignalPresent) {
            return;
        }

        if ($user->role === 'student') {
            $section = $this->sectionForClassRef($this->classRefForStudent($request, $user));
        } elseif ($user->role === 'teacher') {
            $refs = $this->classRefForTeacher($request, $user);
            $section = $refs !== [] ? $this->sectionForClassRef($refs[0]) : null;
        } else {
            return;
        }

        if ($section !== null && (int) $user->section_id !== (int) $section->id) {
            $user->forceFill([
                'section_id' => $section->id,
                'section_scope' => $section->key,
            ]);
        }
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
            'status' => $user->status ?? 'active',
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

            $this->linkChildrenByIds($parent, $request);

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

        $this->linkChildrenByIds($parent, $request);
    }

    /**
     * Link students to a parent row explicitly by id when the admin provides
     * childrenIds (student-row ids and/or user ids) and keep the parent user's
     * children_names list aligned with the linked students.
     */
    protected function linkChildrenByIds(\App\Models\StudentDataParent $parent, Request $request): void
    {
        $childrenIds = $request->input('childrenIds');
        if (! is_array($childrenIds) || empty($childrenIds)) {
            return;
        }

        $childrenIds = array_values(array_filter(array_map('intval', $childrenIds)));

        if (empty($childrenIds)) {
            return;
        }

        \App\Models\Student::whereIn('id', $childrenIds)->update(['parent_id' => $parent->id]);

        User::where('role', 'student')->whereIn('id', $childrenIds)
            ->pluck('student_id')
            ->filter()
            ->each(function (int $studentId) use ($parent): void {
                \App\Models\Student::where('id', $studentId)->update(['parent_id' => $parent->id]);
            });

        $names = \App\Models\Student::where('parent_id', $parent->id)
            ->pluck('name')
            ->filter()
            ->values()
            ->all();

        if (! empty($names)) {
            $parentUser = User::where('role', 'parent')->where('parent_id', $parent->id)->first();
            if ($parentUser) {
                $parentUser->children_names = array_values($names);
                $parentUser->save();
            }
        }
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
        $parentId = $this->resolveParentId($request);

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
                'parent_id' => $parentId,
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
        if ($request->has('parentId')) {
            $fill['parent_id'] = $this->resolveParentId($request);
        }

        if (! empty($fill)) {
            $student->fill($fill)->save();
        }
    }

    /**
     * Resolve the parent row id from the request's parentId, validating that
     * the referenced parents row actually exists. Returns null otherwise so a
     * bogus id never leaves the student row pointing nowhere.
     */
    protected function resolveParentId(Request $request): ?int
    {
        $parentId = $request->input('parentId');

        if ($parentId === null || $parentId === '' || $parentId === 0) {
            return null;
        }

        $parent = \App\Models\StudentDataParent::find((int) $parentId);

        return $parent ? $parent->id : null;
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