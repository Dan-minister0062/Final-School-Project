<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add bilingual (_en / _ar) columns to every table that stores
     * user-facing text so the frontend can render each record in Arabic
     * and English. The legacy single-language columns are kept untouched
     * so existing behaviour never breaks; new columns are nullable and
     * fall back to the legacy value via the API mappers.
     */
    public function up(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            $table->string('title_en')->nullable()->after('title');
            $table->string('title_ar')->nullable()->after('title_en');
            $table->longText('content_en')->nullable()->after('content');
            $table->longText('content_ar')->nullable()->after('content_en');
        });

        Schema::table('classes', function (Blueprint $table) {
            $table->string('name_en')->nullable()->after('name');
            $table->string('name_ar')->nullable()->after('name_en');
        });

        Schema::table('subjects', function (Blueprint $table) {
            $table->string('name_en')->nullable()->after('name');
        });

        Schema::table('assessments', function (Blueprint $table) {
            $table->string('title_en')->nullable()->after('title');
            $table->string('title_ar')->nullable()->after('title_en');
            $table->text('description_en')->nullable()->after('description');
            $table->text('description_ar')->nullable()->after('description_en');
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->string('title_en')->nullable()->after('title');
            $table->string('title_ar')->nullable()->after('title_en');
            $table->text('message_en')->nullable()->after('message');
            $table->text('message_ar')->nullable()->after('message_en');
        });

        // Backfill: copy the legacy value into the matching new column so
        // existing records stay readable. The opposite language stays NULL
        // until edited, and the frontend falls back to the legacy value.
        DB::table('announcements')
            ->whereNull('title_en')
            ->update(['title_en' => DB::raw('title')]);
        DB::table('announcements')
            ->whereNull('content_en')
            ->update(['content_en' => DB::raw('content')]);

        DB::table('classes')
            ->whereNull('name_en')
            ->update(['name_en' => DB::raw('name')]);

        DB::table('subjects')
            ->whereNull('name_en')
            ->update(['name_en' => DB::raw('name')]);

        DB::table('assessments')
            ->whereNull('title_en')
            ->update(['title_en' => DB::raw('title')]);
        DB::table('assessments')
            ->whereNull('description_en')
            ->update(['description_en' => DB::raw('description')]);

        DB::table('notifications')
            ->whereNull('title_en')
            ->update(['title_en' => DB::raw('title')]);
        DB::table('notifications')
            ->whereNull('message_en')
            ->update(['message_en' => DB::raw('message')]);

        // Subjects already ship with name_ar seeded; announce seeding data
        // (title/content) below, so Arabic backfill here is optional.
        DB::table('announcements')
            ->whereNull('title_ar')
            ->update(['title_ar' => DB::raw('title')]);
        DB::table('announcements')
            ->whereNull('content_ar')
            ->update(['content_ar' => DB::raw('content')]);
    }

    public function down(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            $table->dropColumn(['title_en', 'title_ar', 'content_en', 'content_ar']);
        });

        Schema::table('classes', function (Blueprint $table) {
            $table->dropColumn(['name_en', 'name_ar']);
        });

        Schema::table('subjects', function (Blueprint $table) {
            $table->dropColumn(['name_en']);
        });

        Schema::table('assessments', function (Blueprint $table) {
            $table->dropColumn(['title_en', 'title_ar', 'description_en', 'description_ar']);
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->dropColumn(['title_en', 'title_ar', 'message_en', 'message_ar']);
        });
    }
};