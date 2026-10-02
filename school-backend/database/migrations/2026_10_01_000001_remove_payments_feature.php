<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Removes the payments feature entirely: the `payments` table itself and
     * the tuition tracking columns that were mirrored onto registrations.
     *
     * The earlier payments migrations are intentionally left in place so
     * databases that have already run them keep a consistent migration
     * ledger - this migration performs the destructive step instead.
     * Guarded so re-running against a partially cleaned database is a no-op.
     */
    public function up(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            $columns = array_values(array_filter(
                ['payment_status', 'payment_paid_at'],
                fn (string $column) => Schema::hasColumn('registrations', $column)
            ));

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });

        Schema::dropIfExists('payments');
    }

    public function down(): void
    {
        if (! Schema::hasTable('payments')) {
            Schema::create('payments', function (Blueprint $table) {
                $table->id();
                $table->string('reference', 60)->nullable()->unique();
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

        Schema::table('registrations', function (Blueprint $table) {
            if (! Schema::hasColumn('registrations', 'payment_status')) {
                $table->string('payment_status', 20)->nullable()->after('status');
            }

            if (! Schema::hasColumn('registrations', 'payment_paid_at')) {
                $table->timestamp('payment_paid_at')->nullable()->after('payment_status');
            }
        });
    }
};
