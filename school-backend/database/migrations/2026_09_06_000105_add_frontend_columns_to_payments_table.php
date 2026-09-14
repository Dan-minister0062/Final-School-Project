<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->integer('month')->nullable()->index();
            $table->integer('year')->nullable()->index();
            $table->unsignedBigInteger('admission_id')->nullable()->index();
            $table->string('parent_email', 120)->nullable()->index();
            $table->string('parent_name', 120)->nullable();
            $table->string('class_name', 120)->nullable();
            $table->string('level', 60)->nullable();
            $table->date('date_of_birth')->nullable();
            $table->string('gender', 10)->nullable();
            $table->string('address', 190)->nullable();
            $table->string('city', 80)->nullable();
            $table->string('phone', 30)->nullable();
            $table->longText('receipt')->nullable();
            $table->string('receipt_name', 190)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn([
                'month', 'year', 'admission_id', 'parent_email', 'parent_name',
                'class_name', 'level', 'date_of_birth', 'gender', 'address',
                'city', 'phone', 'receipt', 'receipt_name',
            ]);
        });
    }
};