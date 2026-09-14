<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Adds referential-integrity foreign keys and the class_teacher pivot table,
 * then backfills the pivot from users.assigned_classes / teachers.class_codes.
 *
 * Before this migration the relevant tables were verified empty (or pointing
 * at existing rows) so every constraint below can be created immediately.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('class_teacher', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id');
            $table->string('class_code', 60);
            $table->timestamp('created_at')->useCurrent();

            $table->primary(['user_id', 'class_code']);

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('class_code')->references('code')->on('classes')->cascadeOnDelete();
        });

        $this->backfillClassTeacher();

        Schema::table('users', function (Blueprint $table) {
            $table->foreign('teacher_id')->references('id')->on('teachers')->nullOnDelete();
            $table->foreign('student_id')->references('id')->on('students')->nullOnDelete();
            $table->foreign('parent_id')->references('id')->on('parents')->nullOnDelete();
        });

        Schema::table('students', function (Blueprint $table) {
            $table->foreign('parent_id')->references('id')->on('parents')->nullOnDelete();
        });

        Schema::table('assessments', function (Blueprint $table) {
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('teacher_id')->references('id')->on('users')->nullOnDelete();
            $table->foreign('class_code')->references('code')->on('classes')->nullOnDelete();
        });

        Schema::table('submissions', function (Blueprint $table) {
            $table->foreign('assessment_id')->references('id')->on('assessments')->cascadeOnDelete();
            $table->foreign('student_id')->references('id')->on('users')->nullOnDelete();
        });

        Schema::table('attendance', function (Blueprint $table) {
            $table->foreign('student_id')->references('id')->on('users')->nullOnDelete();
            $table->foreign('teacher_id')->references('id')->on('users')->nullOnDelete();
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->foreign('student_id')->references('id')->on('users')->nullOnDelete();
            $table->foreign('parent_id')->references('id')->on('users')->nullOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
        });

        Schema::table('announcements', function (Blueprint $table) {
            $table->foreign('published_by')->references('id')->on('users')->nullOnDelete();
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });
        Schema::table('announcements', function (Blueprint $table) {
            $table->dropForeign(['published_by']);
        });
        Schema::table('payments', function (Blueprint $table) {
            $table->dropForeign(['student_id']);
            $table->dropForeign(['parent_id']);
            $table->dropForeign(['created_by']);
        });
        Schema::table('attendance', function (Blueprint $table) {
            $table->dropForeign(['student_id']);
            $table->dropForeign(['teacher_id']);
        });
        Schema::table('submissions', function (Blueprint $table) {
            $table->dropForeign(['assessment_id']);
            $table->dropForeign(['student_id']);
        });
        Schema::table('assessments', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
            $table->dropForeign(['teacher_id']);
            $table->dropForeign(['class_code']);
        });
        Schema::table('students', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
        });
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['teacher_id']);
            $table->dropForeign(['student_id']);
            $table->dropForeign(['parent_id']);
        });
        Schema::dropIfExists('class_teacher');
    }

    protected function backfillClassTeacher(): void
    {
        $classes = DB::table('classes')->pluck('code')->all();

        $add = function (int $userId, array $codes) use ($classes): void {
            foreach (array_unique(array_filter(array_map('strval', $codes ?: []))) as $code) {
                if (in_array($code, $classes, true)) {
                    DB::table('class_teacher')->updateOrInsert(
                        ['user_id' => $userId, 'class_code' => $code],
                        ['created_at' => now()]
                    );
                }
            }
        };

        DB::table('users')->where('role', 'teacher')->orderBy('id')->get(['id', 'assigned_classes'])
            ->each(function ($user) use ($add): void {
                $codes = json_decode((string) $user->assigned_classes, true);
                if (is_array($codes)) {
                    $add((int) $user->id, $codes);
                }
            });

        $userIdByTeacher = DB::table('users')->where('role', 'teacher')->whereNotNull('teacher_id')
            ->pluck('id', 'teacher_id')
            ->all();

        DB::table('teachers')->orderBy('id')->get(['id', 'class_codes'])
            ->each(function ($teacher) use ($add, $userIdByTeacher): void {
                $userId = $userIdByTeacher[(int) $teacher->id] ?? null;
                if (! $userId) {
                    return;
                }
                $codes = json_decode((string) $teacher->class_codes, true);
                if (is_array($codes)) {
                    $add((int) $userId, $codes);
                }
            });
    }
};