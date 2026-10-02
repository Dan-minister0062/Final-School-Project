<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CreateAdminUserCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_creates_an_active_administrator(): void
    {
        $this->artisan('school:create-admin', [
            '--name' => 'Head Administrator',
            '--email' => 'admin@example.com',
        ])
            ->expectsQuestion('Password (12 characters minimum)', 'Str0ng-Admin-Pass!')
            ->expectsQuestion('Repeat password', 'Str0ng-Admin-Pass!')
            ->assertSuccessful();

        $admin = User::where('email', 'admin@example.com')->first();

        $this->assertNotNull($admin);
        $this->assertSame('admin', $admin->role);
        $this->assertSame('active', $admin->status);
        $this->assertTrue(Hash::check('Str0ng-Admin-Pass!', $admin->password));
    }

    public function test_it_promotes_and_resets_an_existing_account(): void
    {
        $existing = User::factory()->create([
            'email' => 'teacher@example.com',
            'role' => 'teacher',
            'status' => 'pending',
        ]);

        $this->artisan('school:create-admin', [
            '--name' => 'Head Administrator',
            '--email' => 'teacher@example.com',
        ])
            ->expectsQuestion('Password (12 characters minimum)', 'Str0ng-Admin-Pass!')
            ->expectsQuestion('Repeat password', 'Str0ng-Admin-Pass!')
            ->assertSuccessful();

        $existing->refresh();

        $this->assertSame('admin', $existing->role);
        $this->assertSame('active', $existing->status);
        $this->assertSame(1, User::where('email', 'teacher@example.com')->count());
        $this->assertTrue(Hash::check('Str0ng-Admin-Pass!', $existing->password));
    }

    public function test_it_rejects_short_passwords_and_mismatches(): void
    {
        $this->artisan('school:create-admin', [
            '--name' => 'Head Administrator',
            '--email' => 'admin@example.com',
        ])
            ->expectsQuestion('Password (12 characters minimum)', 'short')
            ->expectsQuestion('Repeat password', 'short')
            ->assertFailed();

        $this->assertSame(0, User::count());
    }
}
