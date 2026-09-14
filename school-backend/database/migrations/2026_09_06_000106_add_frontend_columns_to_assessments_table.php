<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('assessments', function (Blueprint $table) {
            $table->string('class_name', 120)->nullable();
            $table->string('subject', 120)->nullable();
            $table->unsignedBigInteger('teacher_id')->nullable()->index();
        });
    }

    public function down(): void
    {
        Schema::table('assessments', function (Blueprint $table) {
            $table->dropColumn(['class_name', 'subject', 'teacher_id']);
        });
    }
};