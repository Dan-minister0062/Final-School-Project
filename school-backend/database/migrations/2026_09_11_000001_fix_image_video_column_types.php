<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            $table->longText('image')->nullable()->change();
            $table->longText('video')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            $table->string('image', 500)->nullable()->change();
            $table->string('video', 500)->nullable()->change();
        });
    }
};
