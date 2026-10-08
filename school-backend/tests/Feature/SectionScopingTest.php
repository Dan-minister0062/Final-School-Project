<?php

namespace Tests\Feature;

use App\Models\Announcement;
use App\Models\Assessment;
use App\Models\Attendance;
use App\Models\Notification;
use App\Models\Registration;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SectionScopingTest extends TestCase
{
    use RefreshDatabase;

    private Section $primary;

    private Section $secondary;

    private User $super;

    private User $subAdmin;

    private SchoolClass $primaryClass;

    private SchoolClass $secondaryClass;

    protected function setUp(): void
    {
        parent::setUp();

        $this->primary = Section::where('key', 'primary')->firstOrFail();
        $this->secondary = Section::where('key', 'secondary')->firstOrFail();

        $this->super = $this->makeUser('super.scoped@example.test', 'admin', [
            'is_super_admin' => true,
            'is_sub_admin' => false,
        ]);

        $this->subAdmin = $this->makeUser('sub.scoped@example.test', 'admin', [
            'is_super_admin' => false,
            'is_sub_admin' => true,
            'section_id' => $this->primary->id,
            'section_scope' => 'primary',
            'permissions' => ['users.view', 'users.create', 'users.update'],
        ]);

        $this->primaryClass = SchoolClass::create([
            'code' => 'PT1A', 'name' => 'Primary Test 1A', 'level_key' => 'primary', 'section_id' => $this->primary->id,
        ]);

        $this->secondaryClass = SchoolClass::create([
            'code' => 'ST1A', 'name' => 'Secondary Test 1A', 'level_key' => 'secondary', 'section_id' => $this->secondary->id,
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

    // ------------------------------------------------- admin creation tiers

    public function test_super_admin_create_admin_with_section_becomes_sub_admin(): void
    {
        $response = $this->actingAs($this->super)->postJson('/api/users', [
            'name' => 'New Sub Admin',
            'email' => 'new.sub@example.test',
            'role' => 'admin',
            'password' => 'password123',
            'section_id' => $this->primary->id,
        ]);

        $response->assertStatus(201);

        $created = User::where('email', 'new.sub@example.test')->firstOrFail();

        $this->assertTrue($created->isSubAdmin());
        $this->assertFalse($created->isSuperAdmin());
        $this->assertSame($this->primary->id, $created->section_id);
        $this->assertSame('primary', $created->section_scope);
        $this->assertNotEmpty($created->permissionList());
    }

    public function test_super_admin_create_admin_without_section_stays_flagless_super(): void
    {
        $response = $this->actingAs($this->super)->postJson('/api/users', [
            'name' => 'New Super Admin',
            'email' => 'new.super@example.test',
            'role' => 'admin',
            'password' => 'password123',
        ]);

        $response->assertStatus(201);

        $created = User::where('email', 'new.super@example.test')->firstOrFail();

        $this->assertFalse($created->isSubAdmin());
        $this->assertTrue($created->isSuperAdmin());
        $this->assertNull($created->section_id);
    }

    public function test_editing_admin_with_section_syncs_sub_admin_tier(): void
    {
        $flagless = $this->makeUser('flagless.edit@example.test', 'admin');

        $this->assertFalse($flagless->isSubAdmin());

        $this->actingAs($this->super)->putJson("/api/users/{$flagless->id}", [
            'name' => 'Flagless Edit',
            'section_id' => $this->secondary->id,
        ])->assertOk();

        $flagless->refresh();

        $this->assertTrue($flagless->isSubAdmin());
        $this->assertFalse($flagless->isSuperAdmin());
        $this->assertSame($this->secondary->id, $flagless->section_id);
        $this->assertNotEmpty($flagless->permissionList());
    }

    // ------------------------------------------------------------ classes

    public function test_sub_admin_class_list_is_scoped_to_its_section(): void
    {
        $response = $this->actingAs($this->subAdmin)->getJson('/api/admin/classes')->assertOk();

        $codes = collect($response->json('data'))->pluck('code')->all();

        $this->assertSame(['PT1A'], $codes);
    }

    public function test_sub_admin_cannot_update_a_foreign_class(): void
    {
        $this->actingAs($this->subAdmin)
            ->putJson('/api/classes/ST1A', ['name' => 'Hijacked'])
            ->assertForbidden();

        $this->assertSame('Secondary Test 1A', $this->secondaryClass->fresh()->name);
    }

    public function test_sub_admin_created_class_is_pinned_to_its_section(): void
    {
        $this->actingAs($this->subAdmin)->postJson('/api/classes', [
            'code' => 'PT9B',
            'name' => 'Primary Nine B',
        ])->assertStatus(201);

        $created = SchoolClass::where('code', 'PT9B')->firstOrFail();

        $this->assertSame($this->primary->id, $created->section_id);
        $this->assertSame('primary', $created->level_key);
    }

    // -------------------------------------------------------- announcements

    public function test_sub_admin_announcement_is_pinned_and_listed_in_its_section(): void
    {
        $this->actingAs($this->subAdmin)
            ->postJson('/api/announcements', ['title' => 'Primary news'])
            ->assertStatus(201);

        $this->actingAs($this->super)
            ->postJson('/api/announcements', [
                'title' => 'Secondary news',
                'section_id' => $this->secondary->id,
            ])
            ->assertStatus(201);

        $this->actingAs($this->super)
            ->postJson('/api/announcements', ['title' => 'Global news'])
            ->assertStatus(201);

        $pinned = Announcement::where('title', 'Primary news')->firstOrFail();
        $this->assertSame($this->primary->id, $pinned->section_id);

        $response = $this->actingAs($this->subAdmin)->getJson('/api/announcements')->assertOk();
        $titles = collect($response->json('data'))->pluck('title')->all();

        $this->assertContains('Primary news', $titles);
        $this->assertNotContains('Secondary news', $titles);
        $this->assertNotContains('Global news', $titles);
    }

    public function test_sub_admin_cannot_touch_foreign_or_global_announcements(): void
    {
        $foreign = Announcement::create([
            'title' => 'Secondary news', 'content' => 'body', 'section_id' => $this->secondary->id, 'status' => 'published',
        ]);
        $global = Announcement::create([
            'title' => 'Global news', 'content' => 'body', 'section_id' => null, 'status' => 'published',
        ]);
        $own = Announcement::create([
            'title' => 'Primary news', 'content' => 'body', 'section_id' => $this->primary->id, 'status' => 'published',
        ]);

        $this->actingAs($this->subAdmin)
            ->putJson("/api/announcements/{$foreign->id}", ['title' => 'Hijacked'])
            ->assertForbidden();
        $this->actingAs($this->subAdmin)
            ->deleteJson("/api/announcements/{$foreign->id}")
            ->assertForbidden();
        $this->actingAs($this->subAdmin)
            ->deleteJson("/api/announcements/{$global->id}")
            ->assertForbidden();

        $this->actingAs($this->subAdmin)
            ->putJson("/api/announcements/{$own->id}", ['title' => 'Primary news edited'])
            ->assertOk();

        $this->assertSame('Secondary news', $foreign->fresh()->title);
        $this->assertSame('Global news', $global->fresh()->title);
        $this->assertSame('Primary news edited', $own->fresh()->title);
    }

    // -------------------------------------------------------- notifications

    public function test_sub_admin_notifications_are_scoped_to_section_plus_global(): void
    {
        $this->actingAs($this->subAdmin)
            ->postJson('/api/notifications', ['title' => 'Mine', 'message' => 'body'])
            ->assertStatus(201);

        $this->actingAs($this->super)
            ->postJson('/api/notifications', [
                'title' => 'Global',
                'message' => 'body',
                'user_id' => null,
            ])
            ->assertStatus(201);

        $this->actingAs($this->super)
            ->postJson('/api/notifications', [
                'title' => 'Foreign',
                'message' => 'body',
                'user_id' => null,
                'section_id' => $this->secondary->id,
            ])
            ->assertStatus(201);

        $pinned = Notification::where('title', 'Mine')->firstOrFail();
        $this->assertSame($this->primary->id, $pinned->section_id);

        $response = $this->actingAs($this->subAdmin)->getJson('/api/notifications')->assertOk();
        $titles = collect($response->json())->pluck('title')->all();

        $this->assertContains('Mine', $titles);
        $this->assertContains('Global', $titles);
        $this->assertNotContains('Foreign', $titles);
    }

    public function test_sub_admin_cannot_delete_foreign_or_global_notifications(): void
    {
        $foreign = Notification::create([
            'title' => 'Foreign', 'message' => 'body', 'section_id' => $this->secondary->id,
        ]);
        $global = Notification::create([
            'title' => 'Global', 'message' => 'body', 'section_id' => null,
        ]);
        $own = Notification::create([
            'title' => 'Mine', 'message' => 'body', 'section_id' => $this->primary->id,
        ]);

        $this->actingAs($this->subAdmin)->deleteJson("/api/notifications/{$foreign->id}")->assertForbidden();
        $this->actingAs($this->subAdmin)->deleteJson("/api/notifications/{$global->id}")->assertForbidden();

        $this->assertDatabaseHas('notifications', ['id' => $foreign->id]);
        $this->assertDatabaseHas('notifications', ['id' => $global->id]);

        $this->actingAs($this->subAdmin)->deleteJson("/api/notifications/{$own->id}")->assertOk();
        $this->assertDatabaseMissing('notifications', ['id' => $own->id]);
    }

    // ---------------------------------------------------------- assessments

    public function test_sub_admin_assessment_must_belong_to_its_section(): void
    {
        $this->actingAs($this->subAdmin)
            ->postJson('/api/assessments', ['title' => 'Foreign quiz', 'class_code' => 'ST1A'])
            ->assertForbidden();

        $this->actingAs($this->subAdmin)
            ->postJson('/api/assessments', ['title' => 'Own quiz', 'class_code' => 'PT1A'])
            ->assertStatus(201);

        $this->assertDatabaseHas('assessments', ['title' => 'Own quiz', 'class_code' => 'PT1A']);
    }

    public function test_sub_admin_assessment_list_is_scoped_to_its_section(): void
    {
        Assessment::create(['title' => 'Own', 'class_code' => 'PT1A', 'status' => 'active', 'created_by' => $this->super->id]);
        Assessment::create(['title' => 'Foreign', 'class_code' => 'ST1A', 'status' => 'active', 'created_by' => $this->super->id]);

        $response = $this->actingAs($this->subAdmin)->getJson('/api/assessments')->assertOk();
        $titles = collect($response->json('data'))->pluck('title')->all();

        $this->assertContains('Own', $titles);
        $this->assertNotContains('Foreign', $titles);
    }

    // ---------------------------------------------------------- attendance

    public function test_sub_admin_attendance_is_scoped_to_its_section(): void
    {
        $this->actingAs($this->subAdmin)
            ->postJson('/api/attendance', [
                'class_code' => 'ST1A',
                'date' => now()->toDateString(),
                'students' => [['student_name' => 'Foreign Kid', 'status' => 'present']],
            ])
            ->assertForbidden();

        $this->actingAs($this->subAdmin)
            ->postJson('/api/attendance', [
                'class_code' => 'PT1A',
                'date' => now()->toDateString(),
                'students' => [['student_name' => 'Own Kid', 'status' => 'present']],
            ])
            ->assertStatus(201);

        $this->assertDatabaseHas('attendance', ['class_code' => 'PT1A']);
        $this->assertSame(0, Attendance::where('class_code', 'ST1A')->count());
    }

    // -------------------------------------------------------- registrations

    public function test_sub_admin_registrations_are_scoped_to_its_section(): void
    {
        $own = Registration::create([
            'first_name' => 'Primary', 'last_name' => 'Kid', 'level' => 'Primary 3',
        ]);
        $foreign = Registration::create([
            'first_name' => 'Secondary', 'last_name' => 'Kid', 'level' => 'Secondary 1',
        ]);

        $superResponse = $this->actingAs($this->super)->getJson('/api/registrations')->assertOk();
        $this->assertCount(2, $superResponse->json('data'));

        $subResponse = $this->actingAs($this->subAdmin)->getJson('/api/registrations')->assertOk();
        $ids = collect($subResponse->json('data'))->pluck('id')->all();

        $this->assertSame([$own->id], $ids);

        $this->actingAs($this->subAdmin)->getJson("/api/registrations/{$foreign->id}")->assertForbidden();
        $this->actingAs($this->subAdmin)
            ->patchJson("/api/registrations/{$foreign->id}/status", ['status' => 'approved'])
            ->assertForbidden();
        $this->actingAs($this->subAdmin)
            ->deleteJson("/api/registrations/{$foreign->id}")
            ->assertForbidden();

        $this->assertSame('pending', $foreign->fresh()->status);
    }

    // -------------------------------------------------------------- subjects

    public function test_sub_admin_subject_list_is_scoped_to_its_section(): void
    {
        Subject::create([
            'code' => 'SUB_P1', 'name' => 'Primary Maths', 'category' => 'primary', 'level_key' => 'primary',
        ]);
        Subject::create([
            'code' => 'SUB_S1', 'name' => 'Secondary Maths', 'category' => 'secondary', 'level_key' => 'secondary',
        ]);

        $superResponse = $this->actingAs($this->super)->getJson('/api/admin/subjects')->assertOk();
        $superCodes = collect($superResponse->json('data'))->pluck('code')->all();
        $this->assertContains('SUB_P1', $superCodes);
        $this->assertContains('SUB_S1', $superCodes);

        $response = $this->actingAs($this->subAdmin)->getJson('/api/admin/subjects')->assertOk();
        $codes = collect($response->json('data'))->pluck('code')->all();

        $this->assertContains('SUB_P1', $codes);
        $this->assertNotContains('SUB_S1', $codes);
    }

    public function test_sub_admin_created_subject_is_pinned_to_its_section(): void
    {
        $this->actingAs($this->subAdmin)->postJson('/api/admin/subjects', [
            'name' => 'Arabic Literature',
            'category' => 'secondary',
        ])->assertOk();

        $created = Subject::orderByDesc('id')->firstOrFail();

        $this->assertSame('primary', $created->category);
        $this->assertSame('primary', $created->level_key);
    }

    public function test_sub_admin_cannot_update_or_delete_foreign_subject(): void
    {
        $foreign = Subject::create([
            'code' => 'SUB_F1', 'name' => 'Secondary Physics', 'category' => 'secondary', 'level_key' => 'secondary',
        ]);
        $own = Subject::create([
            'code' => 'SUB_O1', 'name' => 'Primary Physics', 'category' => 'primary', 'level_key' => 'primary',
        ]);

        $this->actingAs($this->subAdmin)
            ->putJson("/api/admin/subjects/{$foreign->id}", ['name' => 'Hijacked'])
            ->assertForbidden();
        $this->actingAs($this->subAdmin)
            ->deleteJson("/api/admin/subjects/{$foreign->id}")
            ->assertForbidden();
        $this->actingAs($this->subAdmin)
            ->putJson("/api/admin/subjects/{$foreign->id}/status", ['isActive' => false])
            ->assertForbidden();

        $this->assertSame('Secondary Physics', $foreign->fresh()->name);
        $this->assertSame('active', $foreign->fresh()->status);

        $this->actingAs($this->subAdmin)
            ->putJson("/api/admin/subjects/{$own->id}", ['name' => 'Primary Physics edited'])
            ->assertOk();

        $this->assertSame('Primary Physics edited', $own->fresh()->name);
    }

    // ------------------------------------------------------ dashboard stats

    public function test_sub_admin_dashboard_counts_only_its_section(): void
    {
        Attendance::create(['class_code' => 'PT1A', 'date' => now()->toDateString(), 'status' => 'present']);
        Attendance::create(['class_code' => 'ST1A', 'date' => now()->toDateString(), 'status' => 'present']);
        Registration::create(['first_name' => 'Primary', 'last_name' => 'Kid', 'level' => 'Primary 3']);
        Registration::create(['first_name' => 'Secondary', 'last_name' => 'Kid', 'level' => 'Secondary 1']);

        $subResponse = $this->actingAs($this->subAdmin)->getJson('/api/dashboard/stats')->assertOk();

        $this->assertSame(1, $subResponse->json('classes'));
        $this->assertSame(1, $subResponse->json('registrations'));
        $this->assertSame(1, $subResponse->json('attendanceToday'));
        $this->assertSame(1, $subResponse->json('users'));

        $superResponse = $this->actingAs($this->super)->getJson('/api/dashboard/stats')->assertOk();

        $this->assertSame(2, $superResponse->json('classes'));
        $this->assertSame(2, $superResponse->json('registrations'));
        $this->assertSame(2, $superResponse->json('attendanceToday'));
        $this->assertSame(2, $superResponse->json('users'));
    }
}
