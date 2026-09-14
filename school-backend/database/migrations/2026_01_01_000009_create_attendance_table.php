<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance', function (Blueprint $table) {
            $table->id();
            $table->string('class_code', 60)->nullable()->index();
            $table->unsignedBigInteger('student_id')->nullable()->index();
            $table->string('student_code', 40)->nullable()->index();
            $table->string('student_name', 120)->nullable();
            $table->date('date')->nullable()->index();
            $table->string('status', 20)->default('present');
            $table->unsignedBigInteger('teacher_id')->nullable();
            $table->string('remarks', 190)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance');
    }
};