<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('submissions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('assessment_id')->index();
            $table->unsignedBigInteger('student_id')->nullable()->index();
            $table->string('student_code', 40)->nullable()->index();
            $table->string('student_name', 120)->nullable();
            $table->text('content')->nullable();
            $table->string('file_url', 255)->nullable();
            $table->decimal('score', 5, 1)->nullable();
            $table->string('status', 20)->default('submitted');
            $table->timestamp('submitted_at')->nullable();
            $table->text('comment')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('submissions');
    }
};