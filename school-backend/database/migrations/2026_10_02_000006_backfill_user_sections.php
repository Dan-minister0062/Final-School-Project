<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Backfill section membership for the accounts that already exist.
 *
 * Sections are keyed by the class `level` value, which is the only section
 * signal the legacy schema carries. Teachers inherit a section from the classes
 * they are assigned to; students and parents inherit from their class / children.
 *
 * Admins are left untouched: HasAdminTiers treats a flagless admin as a Super
 * Admin, and pinning them here would silently demote existing accounts.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! DB::getSchemaBuilder()->hasColumn('users', 'section_id')) {
            return;
        }

        $sectionKeys = DB::table('sections')->pluck('key', 'id');

        if ($sectionKeys->isEmpty()) {
            return;
        }

        // classes -> section (classes carry the section in level_key)
        $classSections = DB::table('classes')
            ->whereNotNull('level_key')
            ->get(['code', 'level_key'])
            ->filter(fn ($class) => $sectionKeys->contains($class->level_key))
            ->pluck('level_key', 'code');

        // teachers -> section, via their assigned classes
        foreach (DB::table('users')->where('role', 'teacher')->whereNull('section_id')->get(['id']) as $teacher) {
            $codes = DB::table('teachers')->where('user_id', $teacher->id)->value('assigned_classes');
            $codes = is_string($codes) ? (json_decode($codes, true) ?: []) : (array) $codes;

            $key = collect($codes)
                ->map(fn ($code) => $classSections[$code] ?? null)
                ->filter()
                ->first();

            if ($key !== null) {
                DB::table('users')->where('id', $teacher->id)->update([
                    'section_id' => $sectionKeys->firstWhere('key', $key),
                    'section_scope' => $key,
                ]);
            }
        }

        // students -> section, via their class_code
        foreach (DB::table('users')->where('role', 'student')->whereNull('section_id')->get(['id']) as $student) {
            $code = DB::table('students')->where('user_id', $student->id)->value('class_code');
            $key = $code ? ($classSections[$code] ?? null) : null;

            if ($key !== null) {
                DB::table('users')->where('id', $student->id)->update([
                    'section_id' => $sectionKeys->firstWhere('key', $key),
                    'section_scope' => $key,
                ]);
            }
        }

        // parents -> section, via their children's classes
        foreach (DB::table('users')->where('role', 'parent')->whereNull('section_id')->get(['id']) as $parent) {
            $parentRowId = DB::table('users')->where('id', $parent->id)->value('parent_id');

            if (! $parentRowId) {
                continue;
            }

            $key = DB::table('students')
                ->where('parent_id', $parentRowId)
                ->pluck('class_code')
                ->map(fn ($code) => $classSections[$code] ?? null)
                ->filter()
                ->first();

            if ($key !== null) {
                DB::table('users')->where('id', $parent->id)->update([
                    'section_id' => $sectionKeys->firstWhere('key', $key),
                    'section_scope' => $key,
                ]);
            }
        }
    }

    public function down(): void
    {
        if (! DB::getSchemaBuilder()->hasColumn('users', 'section_id')) {
            return;
        }

        DB::table('users')->whereNotNull('section_id')->update([
            'section_id' => null,
            'section_scope' => null,
        ]);
    }
};