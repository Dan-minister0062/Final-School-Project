<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('registrations', function (Blueprint $table) {
            $table->id();
            $table->string('registration_number', 40)->unique()->nullable();
            $table->string('first_name', 80);
            $table->string('last_name', 80);
            $table->date('dob')->nullable();
            $table->string('place_of_birth', 120)->nullable();
            $table->string('gender', 10)->nullable();
            $table->string('nationality', 80)->nullable();
            $table->string('address', 190)->nullable();
            $table->string('city', 80)->nullable();
            $table->string('academic_year', 20)->nullable();
            $table->string('level', 60)->nullable();
            $table->string('requested_class', 60)->nullable();
            $table->string('admission_type', 40)->nullable();
            $table->boolean('has_attended_before')->default(false);
            $table->string('previous_school', 120)->nullable();
            $table->string('previous_grade', 40)->nullable();
            $table->string('last_academic_year', 20)->nullable();
            $table->string('massar_number', 40)->nullable();
            $table->string('academic_track', 40)->nullable();
            $table->boolean('special_assistance')->default(false);
            $table->string('authorized_pickup', 120)->nullable();
            $table->string('parent_name', 120)->nullable();
            $table->string('relationship', 40)->nullable();
            $table->string('parent_phone', 30)->nullable();
            $table->string('parent_email', 120)->nullable();
            $table->string('parent_address', 190)->nullable();
            $table->string('cin_id', 40)->nullable();
            $table->string('parent_password', 120)->nullable();
            $table->string('emergency_contact', 120)->nullable();
            $table->string('emergency_relationship', 40)->nullable();
            $table->string('emergency_phone', 30)->nullable();
            $table->text('additional_notes')->nullable();
            $table->boolean('terms_agreed')->default(false);
            $table->string('status', 20)->default('pending');
            $table->text('admin_notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('registrations');
    }
};