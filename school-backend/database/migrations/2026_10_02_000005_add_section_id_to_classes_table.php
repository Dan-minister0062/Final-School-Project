<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('sections') && ! Schema::hasColumn('classes', 'section_id')) {
            Schema::table('classes', function (Blueprint $table) {
                $table->unsignedBigInteger('section_id')->nullable()->after('id')->index();
            });
        }

        // Backfill section_id from the existing level_key so that every
        // pre-existing class becomes reachable by section scoping.
        if (Schema::hasTable('sections') && Schema::hasColumn('classes', 'section_id')) {
            $sections = DB::table('sections')->pluck('id', 'key');

            $map = [
                'kindergarten' => 'kindergarten',
                'kg' => 'kindergarten',
                'primary' => 'primary',
                'secondary' => 'secondary',
                'high_school' => 'high_school',
            ];

            foreach ($sections as $key => $id) {
                $levels = [$key];
                if (isset($map[$key])) {
                    $levels[] = $map[$key];
                }

                DB::table('classes')
                    ->whereIn('level_key', array_unique($levels))
                    ->whereNull('section_id')
                    ->update(['section_id' => $id]);
            }
        }

        if (Schema::hasTable('sections') && Schema::hasColumn('classes', 'section_id')) {
            try {
                Schema::table('classes', function (Blueprint $table) {
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
        if (! Schema::hasColumn('classes', 'section_id')) {
            return;
        }

        try {
            Schema::table('classes', function (Blueprint $table) {
                $table->dropForeign(['section_id']);
            });
        } catch (\Throwable $e) {
            // ignore
        }

        // SQLite keeps the supporting index after a dropForeign, and refuses to
        // drop the column while that stale index still references it.
        try {
            Schema::table('classes', function (Blueprint $table) {
                $table->dropIndex(['section_id']);
            });
        } catch (\Throwable $e) {
            // index may not exist on this driver
        }

        Schema::table('classes', function (Blueprint $table) {
            $table->dropColumn('section_id');
        });
    }
};