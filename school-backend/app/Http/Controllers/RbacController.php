<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Section;
use App\Models\User;
use App\Services\AuditLogger;
use App\Support\Rbac;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class RbacController extends Controller
{
    public function __construct(private AuditLogger $audit) {}

    /** Sections catalogue: read by admins, used to scope everything else. */
    public function sections(Request $request)
    {
        $user = $request->user();
        abort_unless($user && $user->isAnyAdmin(), 403);

        $query = Section::orderBy('sort_order')->orderBy('id');

        if ($user->isSubAdmin()) {
            $query->where('key', $user->scopeKey());
        }

        return response()->json($query->get());
    }

    /** The permission catalogue with grouping, for the Super Admin matrix UI. */
    public function permissionCatalogue(Request $request)
    {
        abort_unless($request->user() && $request->user()->isSuperAdmin(), 403);

        $groups = [];
        foreach (Rbac::catalogue() as $key => $group) {
            $groups[$group][] = $key;
        }

        return response()->json([
            'permissions' => Rbac::catalogue(),
            'groups' => $groups,
            'super_only' => Rbac::SUPER_ONLY,
            'defaults' => Rbac::defaults(),
        ]);
    }

    /** My own resolved capabilities -- drives all frontend conditional UI. */
    public function me(Request $request)
    {
        $user = $request->user();
        abort_unless($user, 401);

        $section = null;
        if ($user->section_id) {
            $section = Section::find($user->section_id);
        }

        return response()->json([
            'id' => $user->id,
            'role' => $user->role,
            'tier' => $user->isSuperAdmin() ? Rbac::TIER_SUPER : ($user->isSubAdmin() ? Rbac::TIER_SUB : $user->role),
            'is_super_admin' => $user->isSuperAdmin(),
            'is_sub_admin' => $user->isSubAdmin(),
            'section_id' => $user->section_id,
            'section_scope' => $user->scopeKey(),
            'section' => $section ? ['id' => $section->id, 'key' => $section->key, 'name' => $section->name] : null,
            'permissions' => $user->permissionList(),
            'can' => $this->resolveCapabilities($user),
        ]);
    }

    /**
     * Flat map of every permission the caller currently holds. The frontend
     * uses this instead of hard-coding role checks.
     */
    private function resolveCapabilities(User $user): array
    {
        $all = array_keys(Rbac::catalogue());
        $capabilities = [];

        foreach ($all as $key) {
            $capabilities[$key] = $user->hasPermission($key);
        }

        foreach (Rbac::SUPER_ONLY as $key) {
            $capabilities[$key] = $user->isSuperAdmin();
        }

        return $capabilities;
    }

    /** List admins. Super Admin sees all; Sub-Admin sees only their section. */
    public function index(Request $request)
    {
        $user = $request->user();
        abort_unless($user && $user->isAnyAdmin(), 403);

        $query = User::query()
            ->where('role', 'admin')
            ->with('section:id,key,name')
            ->orderBy('name');

        if ($user->isSubAdmin()) {
            // A Sub-Admin may only ever see itself.
            $query->where('id', $user->id);
        } elseif ($request->filled('section_id')) {
            $query->where('section_id', $request->integer('section_id'));
        } elseif ($request->filled('section')) {
            $section = Section::where('key', $request->string('section'))->first();
            $query->where('section_id', $section?->id);
        }

        return response()->json($query->get()->map(fn (User $admin) => $this->presentAdmin($admin)));
    }

    private function presentAdmin(User $admin): array
    {
        return [
            'id' => $admin->id,
            'name' => $admin->name,
            'email' => $admin->email,
            'phone' => $admin->phone,
            'status' => $admin->status,
            'last_login' => optional($admin->last_login)->toDateTimeString(),
            'tier' => $admin->isSuperAdmin() ? Rbac::TIER_SUPER : Rbac::TIER_SUB,
            'is_super_admin' => $admin->isSuperAdmin(),
            'is_sub_admin' => $admin->isSubAdmin(),
            'section_id' => $admin->section_id,
            'section_scope' => $admin->scopeKey(),
            'section' => $admin->section ? ['id' => $admin->section->id, 'key' => $admin->section->key, 'name' => $admin->section->name] : null,
            'permissions' => $admin->isSuperAdmin() ? array_keys(Rbac::catalogue()) : $admin->permissionList(),
        ];
    }

    /**
     * Create a Sub-Admin. Super Admin only, always pinned to one section.
     */
    public function store(Request $request)
    {
        $actor = $request->user();
        abort_unless($actor && $actor->isSuperAdmin(), 403);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email', 'max:190', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:40'],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
            'section_id' => ['required', Rule::exists('sections', 'id')],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string'],
        ]);

        $section = Section::findOrFail($data['section_id']);
        $permissions = Rbac::sanitizeGrantable($data['permissions'] ?? null);
        if (empty($permissions)) {
            $permissions = Rbac::defaults();
        }

        $plainPassword = $data['password'] ?? Str::password(12);

        $admin = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'password' => $plainPassword,
            'role' => 'admin',
            'status' => 'active',
            'is_super_admin' => false,
            'is_sub_admin' => true,
            'section_id' => $section->id,
            'section_scope' => $section->key,
            'permissions' => $permissions,
        ]);

        $this->audit->log('admin.sub_admin_created', $actor, User::class, $admin->id, $section->id, [
            'permissions' => $permissions,
            'section' => $section->key,
        ], "Created Sub-Admin {$admin->name} for section {$section->key}");

        return response()->json($this->presentAdmin($admin), 201);
    }

    /** Update a Sub-Admin (name, contact, status, permissions). */
    public function update(Request $request, User $user)
    {
        $actor = $request->user();
        abort_unless($actor && $actor->isSuperAdmin(), 403);

        if ($user->isSuperAdmin()) {
            $this->audit->denied('admin.super_admin_update_blocked', $actor, [
                'target_user_id' => $user->id,
            ]);

            return response()->json([
                'message' => 'The Super Admin account cannot be modified here.',
            ], 403);
        }

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:150'],
            'email' => ['sometimes', 'email', 'max:190', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => ['nullable', 'string', 'max:40'],
            'status' => ['sometimes', Rule::in(['active', 'suspended'])],
            'section_id' => ['sometimes', Rule::exists('sections', 'id')],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string'],
        ]);

        $changedPermissions = array_key_exists('permissions', $data);

        if (array_key_exists('section_id', $data)) {
            $section = Section::findOrFail($data['section_id']);
            $user->section_id = $section->id;
            $user->section_scope = $section->key;
        }

        foreach (['name', 'email', 'phone', 'status'] as $field) {
            if (array_key_exists($field, $data)) {
                $user->{$field} = $data[$field];
            }
        }

        if ($changedPermissions) {
            $user->permissions = Rbac::sanitizeGrantable($data['permissions']);
        }

        $user->save();
        $user->tokens()->delete();

        $this->audit->log(
            $changedPermissions ? 'admin.permissions_updated' : 'admin.sub_admin_updated',
            $actor,
            User::class,
            $user->id,
            $user->section_id,
            [
                'permissions' => $user->permissionList(),
                'changed' => array_keys($data),
            ],
            $changedPermissions
                ? "Updated permissions for Sub-Admin {$user->name}"
                : "Updated Sub-Admin {$user->name}"
        );

        return response()->json($this->presentAdmin($user->fresh('section')));
    }

    /** Granular permission grant/revoke for one Sub-Admin. */
    public function updatePermissions(Request $request, User $user)
    {
        $actor = $request->user();
        abort_unless($actor && $actor->isSuperAdmin(), 403);

        if ($user->isSuperAdmin()) {
            return response()->json([
                'message' => 'The Super Admin always holds every permission.',
            ], 403);
        }

        $data = $request->validate([
            'permissions' => ['required', 'array'],
            'permissions.*' => ['string'],
        ]);

        $before = $user->permissionList();
        $after = Rbac::sanitizeGrantable($data['permissions']);

        $user->permissions = $after;
        $user->save();
        $user->tokens()->delete();

        $this->audit->log('admin.permissions_updated', $actor, User::class, $user->id, $user->section_id, [
            'granted' => array_values(array_diff($after, $before)),
            'revoked' => array_values(array_diff($before, $after)),
            'after' => $after,
        ], "Changed permissions for Sub-Admin {$user->name}");

        return response()->json($this->presentAdmin($user->fresh('section')));
    }

    /** Suspend / reactivate a Sub-Admin. */
    public function setStatus(Request $request, User $user)
    {
        $actor = $request->user();
        abort_unless($actor && $actor->isSuperAdmin(), 403);

        if ($user->isSuperAdmin()) {
            return response()->json([
                'message' => 'The Super Admin cannot be suspended from here.',
            ], 403);
        }

        $data = $request->validate([
            'status' => ['required', Rule::in(['active', 'suspended'])],
        ]);

        $user->status = $data['status'];
        $user->save();

        if ($data['status'] !== 'active') {
            $user->tokens()->delete();
        }

        $this->audit->log(
            $data['status'] === 'suspended' ? 'admin.sub_admin_suspended' : 'admin.sub_admin_reactivated',
            $actor,
            User::class,
            $user->id,
            $user->section_id,
            ['status' => $data['status']],
            "Set {$user->name} to {$data['status']}"
        );

        return response()->json($this->presentAdmin($user->fresh('section')));
    }

    /** Delete a Sub-Admin. Super Admin accounts can only be demoted by a Super Admin. */
    public function destroy(Request $request, User $user)
    {
        $actor = $request->user();
        abort_unless($actor && $actor->isSuperAdmin(), 403);

        if ((int) $actor->id === (int) $user->id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 403);
        }

        if ($user->isSuperAdmin()) {
            return response()->json([
                'message' => 'A Super Admin cannot be deleted. Demote the account instead.',
            ], 403);
        }

        $user->tokens()->delete();
        $email = $user->email;
        $user->delete();

        $this->audit->log('admin.sub_admin_deleted', $actor, User::class, $user->id, $user->section_id, [
            'email' => $email,
        ], "Deleted Sub-Admin {$email}");

        return response()->json(['message' => 'Sub-Admin deleted.']);
    }

    /**
     * Demote a Super Admin to Sub-Admin. Only another Super Admin may do this,
     * and the last remaining Super Admin is protected.
     */
    public function demoteSuperAdmin(Request $request, User $user)
    {
        $actor = $request->user();
        abort_unless($actor && $actor->isSuperAdmin(), 403);

        if (! $user->isSuperAdmin()) {
            return response()->json(['message' => 'That account is not a Super Admin.'], 422);
        }

        // Count every account that resolves to the Super Admin tier, legacy
        // flagless admins included, so the last-Super-Admin guard cannot be
        // sidestepped by relying on the is_super_admin column alone.
        if (Rbac::superAdminCount($user->id) === 0) {
            return response()->json([
                'message' => 'The institution must keep at least one Super Admin.',
            ], 409);
        }

        if ((int) $actor->id === (int) $user->id) {
            return response()->json([
                'message' => 'Another Super Admin must demote your account.',
            ], 403);
        }

        $data = $request->validate([
            'section_id' => ['required', Rule::exists('sections', 'id')],
        ]);

        $section = Section::findOrFail($data['section_id']);

        $user->is_super_admin = false;
        $user->is_sub_admin = true;
        $user->section_id = $section->id;
        $user->section_scope = $section->key;
        $user->permissions = Rbac::defaults();
        $user->save();
        $user->tokens()->delete();

        $this->audit->log('admin.super_admin_demoted', $actor, User::class, $user->id, $section->id, [
            'section' => $section->key,
        ], "Demoted Super Admin {$user->name} to {$section->key} Sub-Admin");

        return response()->json($this->presentAdmin($user->fresh('section')));
    }

    /** Promote an existing admin to Super Admin (Super Admin only). */
    public function promoteSuperAdmin(Request $request, User $user)
    {
        $actor = $request->user();
        abort_unless($actor && $actor->isSuperAdmin(), 403);

        if ($user->isSuperAdmin()) {
            return response()->json(['message' => 'That account is already a Super Admin.'], 422);
        }

        // Only admin accounts may be promoted: promoting a teacher or student
        // would silently hand an unvetted account platform-wide control.
        if ($user->role !== 'admin') {
            return response()->json([
                'message' => 'Only an existing admin account can be promoted.',
            ], 422);
        }

        if (Rbac::superAdminCount() >= Rbac::MAX_SUPER_ADMINS) {
            return response()->json([
                'message' => 'This institution already has the maximum number of Super Admins ('.Rbac::MAX_SUPER_ADMINS.').',
            ], 409);
        }

        $user->role = 'admin';
        $user->is_super_admin = true;
        $user->is_sub_admin = false;
        $user->section_id = null;
        $user->section_scope = null;
        $user->permissions = null;
        $user->save();
        $user->tokens()->delete();

        $this->audit->log('admin.super_admin_promoted', $actor, User::class, $user->id, null, [
            'email' => $user->email,
        ], "Promoted {$user->name} to Super Admin");

        return response()->json($this->presentAdmin($user->fresh('section')));
    }

    /** Audit trail. The route is Super Admin only, so this reads globally. */
    public function auditLogs(Request $request)
    {
        $user = $request->user();
        abort_unless($user && $user->isSuperAdmin(), 403);

        $query = AuditLog::query()->orderByDesc('id');

        if ($request->filled('actor_id')) {
            $query->where('actor_id', $request->integer('actor_id'));
        }
        if ($request->filled('action')) {
            $query->where('action', $request->string('action'));
        }
        if ($request->filled('entity_type')) {
            $query->where('entity_type', $request->string('entity_type'));
        }
        if ($request->filled('section_id')) {
            $query->where('section_id', $request->integer('section_id'));
        }

        $logs = $query->paginate($request->integer('per_page') ?: 50);

        return response()->json($logs);
    }
}