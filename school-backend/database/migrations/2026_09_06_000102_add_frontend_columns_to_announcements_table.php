<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            $table->string('type', 40)->default('announcement');
            $table->string('priority', 20)->default('medium');
            $table->string('author', 120)->nullable();
            $table->json('target_audience')->nullable();
            $table->string('image', 500)->nullable();
            $table->string('video', 500)->nullable();
            $table->string('media_type', 20)->default('none');
            $table->unsignedInteger('views')->default(0);
            $table->unsignedInteger('likes')->default(0);
            $table->unsignedInteger('comments')->default(0);
            $table->string('date', 30)->nullable();
            $table->string('time', 30)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            $table->dropColumn([
                'type', 'priority', 'author', 'target_audience', 'image', 'video',
                'media_type', 'views', 'likes', 'comments', 'date', 'time',
            ]);
        });
    }
};