<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role', 20)->default('student')->index();
            $table->string('phone', 30)->nullable();
            $table->string('avatar', 255)->nullable();
            $table->string('address', 190)->nullable();
            $table->date('dob')->nullable();
            $table->string('gender', 10)->nullable();
            $table->unsignedBigInteger('teacher_id')->nullable()->index();
            $table->unsignedBigInteger('student_id')->nullable()->index();
            $table->unsignedBigInteger('parent_id')->nullable()->index();
            $table->string('status', 20)->default('active');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'role', 'phone', 'avatar', 'address', 'dob', 'gender',
                'teacher_id', 'student_id', 'parent_id', 'status',
            ]);
        });
    }
};