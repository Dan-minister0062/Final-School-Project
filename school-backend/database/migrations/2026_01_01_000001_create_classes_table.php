<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('classes', function (Blueprint $table) {
            $table->id();
            $table->string('code', 60)->unique();
            $table->string('name', 120);
            $table->string('level_key', 30)->default('primary');
            $table->integer('capacity')->default(30);
            $table->string('academic_year', 20)->nullable();
            $table->string('room', 60)->nullable();
            $table->string('teacher_name', 120)->nullable();
            $table->string('status', 20)->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('classes');
    }
};