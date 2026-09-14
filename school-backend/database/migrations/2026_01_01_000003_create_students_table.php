<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->string('code', 40)->unique()->nullable();
            $table->string('name', 120);
            $table->string('email', 120)->nullable()->unique();
            $table->string('class_code', 60)->nullable()->index();
            $table->string('gender', 10)->nullable();
            $table->date('dob')->nullable();
            $table->string('address', 190)->nullable();
            $table->unsignedBigInteger('parent_id')->nullable()->index();
            $table->string('status', 20)->default('active');
            $table->json('guardian')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};