<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('assessments', function (Blueprint $table) {
            $table->longText('attachment_data')->nullable()->after('description');
            $table->string('attachment_name', 255)->nullable()->after('attachment_data');
            $table->string('attachment_type', 120)->nullable()->after('attachment_name');
        });
    }

    public function down(): void
    {
        Schema::table('assessments', function (Blueprint $table) {
            $table->dropColumn(['attachment_data', 'attachment_name', 'attachment_type']);
        });
    }
};