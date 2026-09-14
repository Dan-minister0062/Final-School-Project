<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assessments', function (Blueprint $table) {
            $table->id();
            $table->string('title', 190);
            $table->string('class_code', 60)->nullable()->index();
            $table->string('subject_code', 40)->nullable()->index();
            $table->string('type', 30)->default('assignment');
            $table->text('description')->nullable();
            $table->date('due_date')->nullable();
            $table->timestamp('deadline')->nullable();
            $table->decimal('max_score', 5, 1)->default(20);
            $table->string('status', 20)->default('active');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->string('teacher_name', 120)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assessments');
    }
};