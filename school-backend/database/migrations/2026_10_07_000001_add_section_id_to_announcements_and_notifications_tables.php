<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Tables that carry announcements/notifications for a single section. */
    private const TABLES = ['announcements', 'notifications'];

    public function up(): void
    {
        if (Schema::hasTable('sections')) {
            foreach (self::TABLES as $tableName) {
                if (! Schema::hasTable($tableName) || Schema::hasColumn($tableName, 'section_id')) {
                    continue;
                }

                Schema::table($tableName, function (Blueprint $table) {
                    $table->unsignedBigInteger('section_id')->nullable()->after('id')->index();
                });
            }
        }

        // Announcements are written by an admin, and admins live in a
        // section: inherit it so pre-existing rows stay inside the writer's
        // section. Notifications are addressed personally (user_id) or
        // broadcast to an audience, so they stay global (NULL) on purpose.
        if (Schema::hasColumn('announcements', 'section_id')) {
            $sectionByUser = DB::table('users')
                ->whereNotNull('section_id')
                ->pluck('section_id', 'id');

            $rows = DB::table('announcements')
                ->whereNull('section_id')
                ->get(['id', 'published_by']);

            foreach ($rows as $announcement) {
                $sectionId = $announcement->published_by !== null
                    ? ($sectionByUser[$announcement->published_by] ?? null)
                    : null;

                if ($sectionId !== null) {
                    DB::table('announcements')
                        ->where('id', $announcement->id)
                        ->update(['section_id' => $sectionId]);
                }
            }
        }

        foreach (self::TABLES as $tableName) {
            if (! Schema::hasColumn($tableName, 'section_id')) {
                continue;
            }

            try {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->foreign('section_id')
                        ->references('id')
                        ->on('sections')
                        ->nullOnDelete();
                });
            } catch (\Throwable $e) {
                // non-fatal on SQLite
            }
        }
    }

    public function down(): void
    {
        foreach (self::TABLES as $tableName) {
            if (! Schema::hasColumn($tableName, 'section_id')) {
                continue;
            }

            try {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->dropForeign(['section_id']);
                });
            } catch (\Throwable $e) {
                // ignore
            }

            // SQLite keeps the supporting index after a dropForeign, and refuses
            // to drop the column while that stale index still references it.
            try {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->dropIndex(['section_id']);
                });
            } catch (\Throwable $e) {
                // index may not exist on this driver
            }

            Schema::table($tableName, function (Blueprint $table) {
                $table->dropColumn('section_id');
            });
        }
    }
};
