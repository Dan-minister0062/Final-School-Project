<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('teachers', function (Blueprint $table) {
            $table->id();
            $table->string('code', 40)->unique()->nullable();
            $table->string('name', 120);
            $table->string('email', 120)->nullable()->unique();
            $table->string('phone', 30)->nullable();
            $table->string('gender', 10)->nullable();
            $table->date('dob')->nullable();
            $table->string('address', 190)->nullable();
            $table->string('subject_code', 40)->nullable();
            $table->string('subject', 120)->nullable();
            $table->json('class_codes')->nullable();
            $table->string('status', 20)->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teachers');
    }
};