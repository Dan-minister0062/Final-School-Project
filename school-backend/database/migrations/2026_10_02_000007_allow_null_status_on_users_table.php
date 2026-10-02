<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Accounts created before the `status` column existed were backfilled by the
     * column default, but rows imported from older exports (and legacy rows that
     * predate this migration) can legitimately carry NULL. The login and presenter
     * code already treats NULL as 'active'; make the schema agree so that path is
     * real instead of unreachable.
     */
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'status')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->string('status', 20)->nullable()->default('active')->change();
        });

        // Column changes are not transactional on MySQL, so normalise explicitly.
        DB::table('users')->whereNull('status')->update(['status' => 'active']);
    }

    public function down(): void
    {
        if (! Schema::hasColumn('users', 'status')) {
            return;
        }

        DB::table('users')->whereNull('status')->update(['status' => 'active']);

        Schema::table('users', function (Blueprint $table) {
            $table->string('status', 20)->nullable(false)->default('active')->change();
        });
    }
};