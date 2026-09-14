<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('department', 90)->nullable();
            $table->text('bio')->nullable();
            $table->timestamp('last_login')->nullable();
            $table->string('nationality', 60)->nullable();
            $table->string('cin', 40)->nullable();
            $table->string('city', 90)->nullable();
            $table->string('emergency_contact_name', 120)->nullable();
            $table->string('emergency_contact_relationship', 60)->nullable();
            $table->string('emergency_contact_phone', 40)->nullable();

            // Teacher extras (kept on the user row so the frontend
            // maps every entity onto a single "user" object).
            $table->string('level', 60)->nullable();
            $table->string('specialization', 120)->nullable();
            $table->string('employment_type', 40)->nullable();
            $table->string('previous_school', 190)->nullable();
            $table->integer('experience')->default(0);
            $table->json('qualifications')->nullable();
            $table->json('subjects')->nullable();
            $table->json('assigned_classes')->nullable();

            // Student extras
            $table->string('class_name', 90)->nullable();
            $table->string('massar_number', 40)->nullable();
            $table->string('academic_year', 20)->nullable();
            $table->string('admission_type', 40)->nullable();
            $table->string('previous_class', 90)->nullable();
            $table->string('previous_academic_year', 20)->nullable();
            $table->string('parent_name', 120)->nullable();
            $table->string('parent_email', 120)->nullable();
            $table->string('parent_phone', 40)->nullable();
            $table->integer('attendance')->default(0);
            $table->decimal('average_grade', 5, 2)->default(0);

            // Parent extras
            $table->string('occupation', 120)->nullable();
            $table->string('employer', 190)->nullable();
            $table->json('children_names')->nullable();

            // Invitations
            $table->string('invite_token', 80)->nullable()->unique();
            $table->timestamp('invite_token_expires_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'department', 'bio', 'last_login', 'nationality', 'cin', 'city',
                'emergency_contact_name', 'emergency_contact_relationship', 'emergency_contact_phone',
                'level', 'specialization', 'employment_type', 'previous_school', 'experience',
                'qualifications', 'subjects', 'assigned_classes',
                'class_name', 'massar_number', 'academic_year', 'admission_type',
                'previous_class', 'previous_academic_year', 'parent_name', 'parent_email', 'parent_phone',
                'attendance', 'average_grade', 'occupation', 'employer', 'children_names',
                'invite_token', 'invite_token_expires_at',
            ]);
        });
    }
};