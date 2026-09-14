<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Profile photos are stored as data URLs on the users.avatar column,
     * which can far exceed the original varchar(255) limit.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->longText('avatar')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('avatar', 255)->nullable()->change();
        });
    }
};