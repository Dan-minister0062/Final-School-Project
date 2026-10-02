<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Lesson;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class RbacAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    private Section $primary;

    private Section $secondary;

    private User $super;

    private User $subAdmin;

    private User $otherSubAdmin;

    private User $teacher;

    private SchoolClass $primaryClass;

    private SchoolClass $secondaryClass;

    protected function setUp(): void
    {
        parent::setUp();

        $this->primary = Section::where('key', 'primary')->firstOrFail();
        $this->secondary = Section::where('key', 'secondary')->firstOrFail();

        $this->super = $this->makeUser('super@example.test', 'admin', [
            'is_super_admin' => true,
            'is_sub_admin' => false,
        ]);

        $this->subAdmin = $this->makeUser('sub.primary@example.test', 'admin', [
            'is_super_admin' => false,
            'is_sub_admin' => true,
            'section_id' => $this->primary->id,
            'section_scope' => 'primary',
            'permissions' => ['users.view', 'users.create', 'lessons.view', 'lessons.create', 'lessons.update', 'lessons.publish'],
        ]);

        $this->otherSubAdmin = $this->makeUser('sub.secondary@example.test', 'admin', [
            'is_super_admin' => false,
            'is_sub_admin' => true,
            'section_id' => $this->secondary->id,
            'section_scope' => 'secondary',
            'permissions' => ['users.view', 'lessons.view', 'lessons.create'],
        ]);

        $this->teacher = $this->makeUser('teacher@example.test', 'teacher', [
            'section_id' => $this->primary->id,
            'section_scope' => 'primary',
            'assigned_classes' => ['P1A'],
        ]);

        $this->primaryClass = SchoolClass::create([
            'code' => 'P1A', 'name' => 'Primary 1A', 'level_key' => 'primary', 'section_id' => $this->primary->id,
        ]);

        $this->secondaryClass = SchoolClass::create([
            'code' => 'S1A', 'name' => 'Secondary 1A', 'level_key' => 'secondary', 'section_id' => $this->secondary->id,
        ]);
    }

    private function makeUser(string $email, string $role, array $overrides = []): User
    {
        return User::create(array_merge([
            'name' => $email,
            'email' => $email,
            'role' => $role,
            'password' => Hash::make('password123'),
            'status' => 'active',
        ], $overrides));
    }

    // ------------------------------------------------------------ tier logic

    public function test_legacy_flagless_admin_is_treated_as_super_admin(): void
    {
        $legacy = $this->makeUser('legacy@example.test', 'admin');

        $this->assertTrue($legacy->isSuperAdmin());
        $this->assertFalse($legacy->isSubAdmin());
    }

    public function test_super_admin_holds_every_permission_including_super_only(): void
    {
        $this->assertTrue($this->super->hasPermission('lessons.create'));
        $this->assertTrue($this->super->hasPermission('admins.manage'));
        $this->assertTrue($this->super->hasPermission('audit.view'));
    }

    public function test_sub_admin_never_holds_super_only_permissions(): void
    {
        $this->subAdmin->permissions = ['admins.manage', 'audit.view', 'lessons.view'];
        $this->subAdmin->save();

        $reloaded = $this->subAdmin->fresh();

        $this->assertFalse($reloaded->hasPermission('admins.manage'));
        $this->assertFalse($reloaded->hasPermission('audit.view'));
        $this->assertTrue($reloaded->hasPermission('lessons.view'));
    }

    public function test_non_admin_roles_hold_no_permissions(): void
    {
        $teacher = $this->makeUser('plain.teacher@example.test', 'teacher', [
            'permissions' => ['lessons.delete'],
        ]);

        $this->assertFalse($teacher->hasPermission('lessons.delete'));
    }

    // ------------------------------------------------- super admin protection

    public function test_sub_admin_cannot_modify_a_super_admin(): void
    {
        $this->actingAs($this->subAdmin)
            ->putJson("/api/users/{$this->super->id}", ['name' => 'Hacked'])
            ->assertForbidden();
    }

    public function test_super_admin_cannot_be_deleted(): void
    {
        $this->actingAs($this->super)
            ->deleteJson("/api/users/{$this->super->id}")
            ->assertForbidden();
    }

    public function test_super_admin_password_can_only_be_reset_by_another_super_admin(): void
    {
        $this->actingAs($this->subAdmin)
            ->postJson("/api/admin/users/{$this->super->id}/reset-password")
            ->assertForbidden();

        $this->actingAs($this->super)
            ->postJson("/api/admin/users/{$this->super->id}/reset-password")
            ->assertOk();
    }

    public function test_last_super_admin_cannot_be_demoted(): void
    {
        $this->actingAs($this->super)
            ->patchJson("/api/admins/{$this->super->id}/demote", ['section_id' => $this->primary->id])
            ->assertStatus(409);
    }

    public function test_super_admin_cannot_self_demote_even_when_another_exists(): void
    {
        $second = $this->makeUser('super2@example.test', 'admin', ['is_super_admin' => true]);

        $this->actingAs($this->super)
            ->patchJson("/api/admins/{$this->super->id}/demote", ['section_id' => $this->primary->id])
            ->assertForbidden();

        $this->assertTrue($this->super->fresh()->isSuperAdmin());
        $this->assertNotNull($second->fresh()->is_super_admin);
    }

    public function test_super_admin_can_demote_another_super_admin(): void
    {
        $second = $this->makeUser('super2@example.test', 'admin', ['is_super_admin' => true]);

        $this->actingAs($this->super)
            ->patchJson("/api/admins/{$second->id}/demote", ['section_id' => $this->primary->id])
            ->assertOk();

        $demoted = $second->fresh();
        $this->assertFalse($demoted->isSuperAdmin());
        $this->assertTrue($demoted->isSubAdmin());
        $this->assertSame($this->primary->id, $demoted->section_id);
    }

    public function test_only_admin_accounts_can_be_promoted_to_super_admin(): void
    {
        $teacher = $this->makeUser('teacher2@example.test', 'teacher');

        $this->actingAs($this->super)
            ->patchJson("/api/admins/{$teacher->id}/promote")
            ->assertStatus(422);

        $this->assertSame('teacher', $teacher->fresh()->role);
    }

    // ------------------------------------------------------- privilege guards

    public function test_sub_admin_cannot_create_an_admin_account(): void
    {
        $this->actingAs($this->subAdmin)
            ->postJson('/api/users', [
                'email' => 'sneaky@example.test',
                'role' => 'admin',
            ])
            ->assertForbidden();
    }

    public function test_sub_admin_cannot_change_a_role(): void
    {
        $target = $this->makeUser('victim@example.test', 'student', [
            'section_id' => $this->primary->id,
            'section_scope' => 'primary',
        ]);

        $this->actingAs($this->subAdmin)
            ->putJson("/api/users/{$target->id}", ['role' => 'admin'])
            ->assertForbidden();
    }

    public function test_sub_admin_cannot_grant_permissions(): void
    {
        $target = $this->makeUser('target@example.test', 'student', [
            'section_id' => $this->primary->id,
        ]);

        $this->actingAs($this->subAdmin)
            ->putJson("/api/users/{$target->id}", ['permissions' => ['lessons.delete']])
            ->assertForbidden();
    }

    public function test_sub_admin_cannot_move_an_account_out_of_its_section(): void
    {
        $target = $this->makeUser('mover@example.test', 'student', [
            'section_id' => $this->primary->id,
        ]);

        $this->actingAs($this->subAdmin)
            ->putJson("/api/users/{$target->id}", ['section_id' => $this->secondary->id])
            ->assertForbidden();
    }

    public function test_sub_admin_cannot_update_an_account_in_another_section(): void
    {
        $target = $this->makeUser('elsewhere@example.test', 'student', [
            'section_id' => $this->secondary->id,
            'section_scope' => 'secondary',
        ]);

        $this->actingAs($this->subAdmin)
            ->putJson("/api/users/{$target->id}", ['name' => 'Renamed'])
            ->assertForbidden();
    }

    public function test_sub_admin_cannot_delete_an_account_in_another_section(): void
    {
        $target = $this->makeUser('elsewhere2@example.test', 'student', [
            'section_id' => $this->secondary->id,
        ]);

        $this->actingAs($this->subAdmin)
            ->deleteJson("/api/users/{$target->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('users', ['id' => $target->id]);
    }

    public function test_sub_admin_user_list_is_restricted_to_its_own_section(): void
    {
        $inSection = $this->makeUser('inside@example.test', 'student', ['section_id' => $this->primary->id]);
        $outOfSection = $this->makeUser('outside@example.test', 'student', ['section_id' => $this->secondary->id]);

        $response = $this->actingAs($this->subAdmin)->getJson('/api/users')->assertOk();
        $ids = collect($response->json('data'))->pluck('id')->all();

        $this->assertContains($inSection->id, $ids);
        $this->assertNotContains($outOfSection->id, $ids);
    }

    public function test_sub_admin_cannot_create_an_account_in_another_section(): void
    {
        $this->actingAs($this->subAdmin)
            ->postJson('/api/users', [
                'email' => 'cross@example.test',
                'role' => 'student',
                'section_id' => $this->secondary->id,
            ])
            ->assertForbidden();
    }

    public function test_sub_admin_created_account_is_pinned_to_its_own_section(): void
    {
        $this->actingAs($this->subAdmin)
            ->postJson('/api/users', ['email' => 'pinned@example.test', 'role' => 'student'])
            ->assertCreated();

        $created = User::where('email', 'pinned@example.test')->firstOrFail();
        $this->assertSame($this->primary->id, $created->section_id);
        $this->assertSame('primary', $created->section_scope);
    }

    public function test_non_admin_cannot_list_users(): void
    {
        $student = $this->makeUser('nosy@example.test', 'student');

        $this->actingAs($student)->getJson('/api/users')->assertForbidden();
    }

    // -------------------------------------------------------------- rbac me

    public function test_rbac_me_reports_tier_section_and_capabilities(): void
    {
        $response = $this->actingAs($this->subAdmin)->getJson('/api/rbac/me')->assertOk();

        $this->assertSame('sub_admin', $response->json('tier'));
        $this->assertSame('primary', $response->json('section_scope'));
        // Permission keys contain dots, so they must be read as literal keys.
        $this->assertTrue($response->json('can')['lessons.view']);
        $this->assertFalse($response->json('can')['admins.manage']);
    }

    public function test_permission_catalogue_is_super_admin_only(): void
    {
        $this->actingAs($this->subAdmin)->getJson('/api/rbac/permissions')->assertForbidden();
        $this->actingAs($this->super)->getJson('/api/rbac/permissions')->assertOk();
    }

    public function test_sub_admin_sees_only_itself_in_the_admin_list(): void
    {
        $response = $this->actingAs($this->subAdmin)->getJson('/api/admins')->assertOk();

        $this->assertCount(1, $response->json());
        $this->assertSame($this->subAdmin->id, $response->json('0.id'));
    }

    public function test_sub_admin_only_sees_its_own_section_in_the_sections_list(): void
    {
        $response = $this->actingAs($this->subAdmin)->getJson('/api/rbac/sections')->assertOk();

        $this->assertCount(1, $response->json());
        $this->assertSame('primary', $response->json('0.key'));
    }

    // ---------------------------------------------------------------- audit

    public function test_creating_a_sub_admin_writes_an_audit_log(): void
    {
        $this->actingAs($this->super)
            ->postJson('/api/admins', [
                'name' => 'New Sub',
                'email' => 'new.sub@example.test',
                'section_id' => $this->primary->id,
            ])
            ->assertCreated();

        $this->assertDatabaseHas('audit_logs', [
            'actor_id' => $this->super->id,
            'action' => 'admin.sub_admin_created',
            'section_id' => $this->primary->id,
        ]);
    }

    public function test_blocked_super_admin_mutation_is_audited_as_denied(): void
    {
        $this->actingAs($this->subAdmin)
            ->putJson("/api/users/{$this->super->id}", ['name' => 'Hacked'])
            ->assertForbidden();

        $this->assertDatabaseHas('audit_logs', [
            'actor_id' => $this->subAdmin->id,
            'action' => 'super_admin.protected',
        ]);
    }

    public function test_audit_trail_is_super_admin_only(): void
    {
        AuditLog::create([
            'actor_id' => $this->subAdmin->id,
            'actor_name' => 'Sub',
            'action' => 'lesson.created',
            'section_id' => $this->primary->id,
            'ip_address' => '127.0.0.1',
        ]);

        AuditLog::create([
            'actor_id' => $this->otherSubAdmin->id,
            'actor_name' => 'Other',
            'action' => 'lesson.created',
            'section_id' => $this->secondary->id,
            'ip_address' => '127.0.0.1',
        ]);

        $this->actingAs($this->subAdmin)->getJson('/api/audit-logs')->assertForbidden();

        $response = $this->actingAs($this->super)->getJson('/api/audit-logs')->assertOk();
        $sectionIds = collect($response->json('data'))->pluck('section_id')->unique()->sort()->values()->all();

        $this->assertSame([$this->primary->id, $this->secondary->id], $sectionIds);
    }

    public function test_permission_change_revokes_existing_sessions(): void
    {
        $token = $this->subAdmin->createToken('test')->plainTextToken;

        $this->actingAs($this->super)
            ->patchJson("/api/admins/{$this->subAdmin->id}/permissions", [
                'permissions' => ['lessons.view'],
            ])
            ->assertOk();

        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $token]);
    }
}