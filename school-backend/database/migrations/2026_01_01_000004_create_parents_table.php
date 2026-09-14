<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('parents', function (Blueprint $table) {
            $table->id();
            $table->string('code', 40)->unique()->nullable();
            $table->string('name', 120);
            $table->string('email', 120)->nullable()->unique();
            $table->string('phone', 30)->nullable();
            $table->string('cin_id', 40)->nullable();
            $table->string('address', 190)->nullable();
            $table->string('relationship', 30)->nullable();
            $table->json('children')->nullable();
            $table->string('status', 20)->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parents');
    }
};