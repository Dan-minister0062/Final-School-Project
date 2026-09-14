<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('submissions', function (Blueprint $table) {
            $table->longText('file_data')->nullable();
            $table->string('file_name', 255)->nullable();
            $table->string('file_type', 120)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('submissions', function (Blueprint $table) {
            $table->dropColumn(['file_data', 'file_name', 'file_type']);
        });
    }
};