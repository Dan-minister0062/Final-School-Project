<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('lessons')) {
            return;
        }

        Schema::create('lessons', function (Blueprint $table) {
            $table->id();

            $table->string('title', 200);
            $table->string('slug', 220)->nullable()->unique();
            $table->text('description')->nullable();
            $table->text('objectives')->nullable();

            // scoping: a lesson always belongs to exactly one section
            $table->unsignedBigInteger('section_id');
            // optional class scoping (null = whole section)
            $table->unsignedBigInteger('class_id')->nullable();

            // nullable so the author FK can use ON DELETE SET NULL, keeping the
            // lesson row when its author account is removed.
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            // draft | published | archived
            $table->string('status', 20)->default('draft')->index();
            $table->timestamp('published_at')->nullable();
            $table->date('due_date')->nullable();
            $table->timestamp('scheduled_at')->nullable();

            $table->unsignedInteger('estimated_minutes')->nullable();
            $table->unsignedTinyInteger('order_index')->default(0);

            $table->softDeletes();
            $table->timestamps();

            $table->index(['section_id', 'status']);
            $table->index(['class_id', 'status']);
            $table->index(['section_id', 'class_id']);
            $table->index(['due_date']);
        });

        Schema::create('lesson_content_blocks', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('lesson_id');
            // text | image | video | file | quiz | assignment | divider | embed
            $table->string('type', 30)->default('text');
            $table->unsignedInteger('order')->default(0);
            $table->string('title', 200)->nullable();
            $table->longText('data')->nullable();
            $table->timestamps();

            $table->index('lesson_id');
            $table->foreign('lesson_id')->references('id')->on('lessons')->cascadeOnDelete();
            $table->index(['lesson_id', 'order']);
        });

        Schema::create('lesson_attachments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('lesson_id');
            $table->unsignedBigInteger('uploaded_by')->nullable();
            $table->string('title', 200)->nullable();
            $table->string('file_url', 500);
            $table->string('file_name', 255)->nullable();
            $table->string('file_type', 120)->nullable();
            $table->unsignedBigInteger('file_size')->nullable();
            $table->string('external_url', 500)->nullable();
            $table->timestamps();

            $table->index('lesson_id');
            $table->index('uploaded_by');
            $table->foreign('lesson_id')->references('id')->on('lessons')->cascadeOnDelete();
            $table->foreign('uploaded_by')->references('id')->on('users')->nullOnDelete();
        });

        Schema::create('lesson_assignments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('lesson_id');
            // assignment | quiz
            $table->string('type', 20)->default('assignment');
            $table->string('title', 200);
            $table->text('instructions')->nullable();
            $table->timestamp('due_date')->nullable();
            $table->decimal('max_score', 8, 2)->nullable();
            $table->unsignedInteger('time_limit_minutes')->nullable();
            $table->boolean('allow_late')->default(true);
            $table->json('questions')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();

            $table->index('lesson_id');
            $table->index('created_by');
            $table->foreign('lesson_id')->references('id')->on('lessons')->cascadeOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->index(['lesson_id', 'type']);
            $table->index('due_date');
        });

        Schema::create('lesson_submissions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('lesson_assignment_id');
            $table->unsignedBigInteger('lesson_id');
            // nullable: the owner FK below uses ON DELETE SET NULL, which
            // MySQL/MariaDB reject (errno 150) against a NOT NULL column.
            $table->unsignedBigInteger('student_id')->nullable();
            $table->unsignedBigInteger('class_id')->nullable();
            $table->unsignedBigInteger('section_id')->nullable();

            $table->longText('content')->nullable();
            $table->json('attachments')->nullable();
            $table->json('answers')->nullable();
            $table->timestamp('submitted_at')->nullable();

            $table->decimal('grade', 8, 2)->nullable();
            $table->longText('feedback')->nullable();
            $table->unsignedBigInteger('graded_by')->nullable();
            $table->timestamp('graded_at')->nullable();

            // draft | submitted | graded | returned
            $table->string('status', 20)->default('draft')->index();
            $table->timestamps();

            $table->index('lesson_assignment_id');
            $table->index('lesson_id');
            $table->index('student_id');
            $table->index('graded_by');
            $table->index('section_id');
            $table->index('class_id');
            $table->foreign('lesson_assignment_id')->references('id')->on('lesson_assignments')->cascadeOnDelete();
            $table->foreign('lesson_id')->references('id')->on('lessons')->cascadeOnDelete();
            // Owner references are set null on removal so that deleting a user
            // never cascades into destroying a student's graded work.
            $table->foreign('student_id')->references('id')->on('users')->nullOnDelete();
            $table->foreign('graded_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('section_id')->references('id')->on('sections')->nullOnDelete();
            $table->foreign('class_id')->references('id')->on('classes')->nullOnDelete();
            $table->unique(['lesson_assignment_id', 'student_id'], 'lesson_submission_unique');
            $table->index(['lesson_id', 'student_id']);
            $table->index(['section_id', 'status']);
        });

        Schema::create('lesson_progress', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('lesson_id');
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('section_id')->nullable();
            $table->unsignedBigInteger('class_id')->nullable();
            // not_started | in_progress | completed
            $table->string('status', 20)->default('not_started')->index();
            $table->unsignedTinyInteger('progress_percent')->default(0);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->unsignedInteger('time_spent_seconds')->default(0);
            $table->timestamps();

            $table->index('lesson_id');
            $table->index('student_id');
            $table->index('section_id');
            $table->index('class_id');
            $table->foreign('lesson_id')->references('id')->on('lessons')->cascadeOnDelete();
            $table->foreign('student_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('section_id')->references('id')->on('sections')->nullOnDelete();
            $table->foreign('class_id')->references('id')->on('classes')->nullOnDelete();
            $table->unique(['lesson_id', 'student_id']);
            $table->index(['student_id', 'status']);
        });

        // Lessons belong to a section and (optionally) a class, and their author
        // rows are preserved when an account is removed.
        Schema::table('lessons', function (Blueprint $table) {
            $table->index('section_id');
            $table->index('class_id');
            $table->index('created_by');
            $table->index('updated_by');
            $table->foreign('section_id')->references('id')->on('sections')->cascadeOnDelete();
            $table->foreign('class_id')->references('id')->on('classes')->nullOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('updated_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lesson_progress');
        Schema::dropIfExists('lesson_submissions');
        Schema::dropIfExists('lesson_assignments');
        Schema::dropIfExists('lesson_attachments');
        Schema::dropIfExists('lesson_content_blocks');

        try {
            Schema::table('lessons', function (Blueprint $table) {
                $table->dropForeign(['section_id']);
                $table->dropForeign(['class_id']);
                $table->dropForeign(['created_by']);
                $table->dropForeign(['updated_by']);
            });
        } catch (\Throwable $e) {
            // portable fallback
        }

        Schema::dropIfExists('lessons');
    }
};