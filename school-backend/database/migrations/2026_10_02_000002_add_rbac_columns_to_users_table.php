<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'is_super_admin')) {
                $table->boolean('is_super_admin')->default(false)->after('role')->index();
            }
            if (! Schema::hasColumn('users', 'section_id')) {
                $table->unsignedBigInteger('section_id')->nullable()->after('is_super_admin')->index();
            }
            if (! Schema::hasColumn('users', 'section_scope')) {
                $table->string('section_scope', 32)->nullable()->after('section_id')->index();
            }
            if (! Schema::hasColumn('users', 'permissions')) {
                $table->json('permissions')->nullable()->after('section_scope');
            }
            if (! Schema::hasColumn('users', 'is_sub_admin')) {
                $table->boolean('is_sub_admin')->default(false)->after('permissions')->index();
            }
        });

        // FK added separately: sqlite/SQLite ALTER TABLE ADD CONSTRAINT is not portable,
        // and we must never break an existing installation.
        Schema::table('users', function (Blueprint $table) {
            $table->foreign('section_id')
                ->references('id')
                ->on('sections')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        try {
            Schema::table('users', function (Blueprint $table) {
                $table->dropForeign(['section_id']);
            });
        } catch (\Throwable $e) {
            // SQLite cannot drop FKs added by ALTER; ignore.
        }

        // Drop the supporting indexes first: SQLite refuses to drop a column
        // while an index still references it.
        foreach (['is_super_admin', 'section_id', 'section_scope', 'is_sub_admin'] as $col) {
            try {
                Schema::table('users', function (Blueprint $table) use ($col) {
                    $table->dropIndex([$col]);
                });
            } catch (\Throwable $e) {
                // index may not exist on this driver
            }
        }

        Schema::table('users', function (Blueprint $table) {
            foreach (['is_super_admin', 'section_id', 'section_scope', 'permissions', 'is_sub_admin'] as $col) {
                if (Schema::hasColumn('users', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};