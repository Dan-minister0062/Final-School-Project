<?php

namespace Tests\Feature;

use App\Models\Payment;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RegistrationPaymentStatusTest extends TestCase
{
    use RefreshDatabase;

    protected function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    protected function registration(string $status = 'approved'): Registration
    {
        return Registration::create([
            'first_name' => 'Yassine',
            'last_name' => 'El Amrani',
            'gender' => 'male',
            'level' => 'primary',
            'parent_name' => 'Rachid El Amrani',
            'parent_email' => 'rachid@example.com',
            'parent_phone' => '+212600000000',
            'status' => $status,
        ]);
    }

    public function test_admin_can_mark_registration_as_paid_and_it_persists(): void
    {
        Sanctum::actingAs($this->admin());

        $registration = $this->registration('approved');

        $response = $this->patchJson("/api/registrations/{$registration->id}/status", [
            'paymentStatus' => 'paid',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.paymentStatus', 'paid')
            ->assertJsonPath('data.id', $registration->id);
        $this->assertNotNull($response->json('data.paymentPaidAt'));
        $this->assertDatabaseHas('registrations', [
            'id' => $registration->id,
            'payment_status' => 'paid',
        ]);
    }

    public function test_index_includes_payment_status(): void
    {
        Sanctum::actingAs($this->admin());

        $registration = $this->registration('approved');
        $registration->update([
            'payment_status' => 'paid',
            'payment_paid_at' => now(),
        ]);

        $this->getJson('/api/registrations')
            ->assertOk()
            ->assertJsonFragment([
                'id' => $registration->id,
                'paymentStatus' => 'paid',
            ]);
    }

    public function test_approving_a_linked_payment_flags_the_registration_as_paid(): void
    {
        Sanctum::actingAs($this->admin());

        $registration = $this->registration('approved');
        $payment = Payment::create([
            'student_name' => 'Yassine El Amrani',
            'amount' => 500,
            'status' => 'pending',
            'admission_id' => $registration->id,
        ]);

        $this->patchJson("/api/payments/{$payment->id}/status", ['status' => 'approved'])
            ->assertOk();

        $this->assertDatabaseHas('registrations', [
            'id' => $registration->id,
            'payment_status' => 'paid',
        ]);
        $this->assertNotNull($registration->fresh()->payment_paid_at);
    }

    public function test_creating_an_approved_linked_payment_flags_the_registration_as_paid(): void
    {
        Sanctum::actingAs($this->admin());

        $registration = $this->registration('approved');

        $this->postJson('/api/payments', [
            'student_name' => 'Yassine El Amrani',
            'amount' => 500,
            'status' => 'paid',
            'admission_id' => $registration->id,
        ])->assertCreated();

        $this->assertDatabaseHas('registrations', [
            'id' => $registration->id,
            'payment_status' => 'paid',
        ]);
    }

    public function test_rejecting_a_payment_does_not_flag_the_registration_as_paid(): void
    {
        Sanctum::actingAs($this->admin());

        $registration = $this->registration('approved');
        $payment = Payment::create([
            'student_name' => 'Yassine El Amrani',
            'amount' => 500,
            'status' => 'pending',
            'admission_id' => $registration->id,
        ]);

        $this->patchJson("/api/payments/{$payment->id}/status", ['status' => 'rejected'])
            ->assertOk();

        $this->assertDatabaseHas('registrations', [
            'id' => $registration->id,
            'payment_status' => null,
        ]);
    }
}