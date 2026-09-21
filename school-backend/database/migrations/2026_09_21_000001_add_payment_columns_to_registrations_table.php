<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Track tuition payment state directly on the registration so the
     * admin Registrations page can display - and persist - whether an
     * approved student has been marked as paid. Nullable and additive so
     * existing registrations and behaviour are left untouched.
     */
    public function up(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            $table->string('payment_status', 20)->nullable()->after('status');
            $table->timestamp('payment_paid_at')->nullable()->after('payment_status');
        });
    }

    public function down(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            $table->dropColumn(['payment_status', 'payment_paid_at']);
        });
    }
};