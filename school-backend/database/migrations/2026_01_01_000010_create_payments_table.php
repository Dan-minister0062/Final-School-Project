<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->string('reference', 60)->unique()->nullable();
            $table->unsignedBigInteger('student_id')->nullable()->index();
            $table->string('student_code', 40)->nullable()->index();
            $table->string('student_name', 120)->nullable();
            $table->unsignedBigInteger('parent_id')->nullable()->index();
            $table->string('title', 120)->nullable();
            $table->string('category', 40)->default('tuition');
            $table->decimal('amount', 10, 2)->default(0);
            $table->string('method', 40)->nullable();
            $table->string('status', 20)->default('pending');
            $table->date('due_date')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};