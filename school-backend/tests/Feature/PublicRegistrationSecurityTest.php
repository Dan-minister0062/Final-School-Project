<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicRegistrationSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_registration_rejects_the_admin_role(): void
    {
        $this->postJson('/api/auth/register', [
            'name' => 'Mallory Admin',
            'email' => 'attacker@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'admin',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('role');

        $this->assertDatabaseMissing('users', ['email' => 'attacker@example.com']);
    }

    public function test_public_registration_creates_a_pending_account_without_logging_in(): void
    {
        $this->postJson('/api/auth/register', [
            'name' => 'Amina Parent',
            'email' => 'parent@example.com',
            'phone' => '+212600000000',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'parent',
        ])
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonMissingPath('user');

        $this->assertGuest();

        $this->assertDatabaseHas('users', [
            'email' => 'parent@example.com',
            'role' => 'parent',
            'status' => 'pending',
        ]);

        $this->assertDatabaseHas('parents', [
            'email' => 'parent@example.com',
            'status' => 'pending',
        ]);
    }

    public function test_pending_accounts_cannot_log_in(): void
    {
        User::factory()->create([
            'email' => 'pending@example.com',
            'status' => 'pending',
        ]);

        $this->postJson('/api/auth/login', [
            'email' => 'pending@example.com',
            'password' => 'password',
        ])->assertForbidden();
    }

    public function test_legacy_accounts_with_a_null_status_can_still_log_in(): void
    {
        User::factory()->create([
            'email' => 'legacy@example.com',
            'status' => null,
        ]);

        $this->postJson('/api/auth/login', [
            'email' => 'legacy@example.com',
            'password' => 'password',
        ])->assertOk()->assertJsonPath('user.email', 'legacy@example.com');
    }

    public function test_accounts_with_an_empty_status_can_still_log_in(): void
    {
        User::factory()->create([
            'email' => 'blank@example.com',
            'status' => '',
        ]);

        $this->postJson('/api/auth/login', [
            'email' => 'blank@example.com',
            'password' => 'password',
        ])->assertOk();
    }

    public function test_explicitly_suspended_accounts_are_still_blocked(): void
    {
        User::factory()->create([
            'email' => 'suspended@example.com',
            'status' => 'suspended',
        ]);

        $this->postJson('/api/auth/login', [
            'email' => 'suspended@example.com',
            'password' => 'password',
        ])->assertForbidden();
    }
}
