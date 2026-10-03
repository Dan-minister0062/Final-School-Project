<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Backfill section membership for the accounts that already exist.
 *
 * Sections are keyed by the class `level_key` value, which is the only section
 * signal the legacy schema carries. Teachers inherit a section from the classes
 * they are assigned to; students and parents inherit from their class / children.
 *
 * Admins are left untouched: HasAdminTiers treats a flagless admin as a Super
 * Admin, and pinning them here would silently demote existing accounts.
 *
 * Every lookup is feature-detected. The legacy tables that carry the section
 * signal (and the columns linking a user row to them) differ between
 * installations, so a missing column simply means that role cannot be
 * backfilled and is left with a NULL section.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'section_id')) {
            return;
        }

        // key => id, so a section key can be resolved to its row id directly.
        $sectionIds = Schema::hasTable('sections') ? DB::table('sections')->pluck('id', 'key') : collect();

        if ($sectionIds->isEmpty()) {
            return;
        }

        $hasClassLevelKey = Schema::hasColumn('classes', 'level_key');
        $hasTeacherLink = Schema::hasColumn('users', 'teacher_id')
            && Schema::hasColumn('teachers', 'class_codes');
        $hasStudentLink = Schema::hasColumn('users', 'student_id')
            && Schema::hasColumn('students', 'class_code');
        $hasParentLink = Schema::hasColumn('users', 'parent_id')
            && Schema::hasColumn('students', 'parent_id');

        // classes -> section (a class carries the section in level_key)
        $classSections = $hasClassLevelKey
            ? DB::table('classes')
                ->whereNotNull('level_key')
                ->get(['code', 'level_key'])
                ->filter(fn ($class) => $sectionIds->has($class->level_key))
                ->pluck('level_key', 'code')
            : collect();

        $assign = function (?int $userId, ?string $key): void {
            if ($userId === null || $key === null) {
                return;
            }
            DB::table('users')->where('id', $userId)->update([
                'section_id' => DB::table('sections')->where('key', $key)->value('id'),
                'section_scope' => $key,
            ]);
        };

        $keyForClassCode = function ($code) use ($classSections) {
            return is_string($code) && $code !== '' ? ($classSections[$code] ?? null) : null;
        };

        // teachers -> section, via the classes they are assigned to
        if ($hasTeacherLink) {
            foreach (DB::table('users')->where('role', 'teacher')->whereNull('section_id')->get(['id', 'teacher_id']) as $teacher) {
                $raw = DB::table('teachers')->where('id', $teacher->teacher_id)->value('class_codes');
                $codes = is_string($raw) ? (json_decode($raw, true) ?: []) : (array) $raw;

                $key = collect($codes)->map($keyForClassCode)->filter()->first();
                $assign($teacher->id, $key);
            }
        }

        // students -> section, via their class_code
        if ($hasStudentLink) {
            foreach (DB::table('users')->where('role', 'student')->whereNull('section_id')->get(['id', 'student_id']) as $student) {
                $code = DB::table('students')->where('id', $student->student_id)->value('class_code');
                $assign($student->id, $keyForClassCode($code));
            }
        }

        // parents -> section, via their children's classes
        if ($hasParentLink) {
            foreach (DB::table('users')->where('role', 'parent')->whereNull('section_id')->get(['id', 'parent_id']) as $parent) {
                if ($parent->parent_id === null) {
                    continue;
                }

                $key = DB::table('students')
                    ->where('parent_id', $parent->parent_id)
                    ->pluck('class_code')
                    ->map($keyForClassCode)
                    ->filter()
                    ->first();

                $assign($parent->id, $key);
            }
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('users', 'section_id')) {
            return;
        }

        DB::table('users')->whereNotNull('section_id')->update([
            'section_id' => null,
            'section_scope' => null,
        ]);
    }
};