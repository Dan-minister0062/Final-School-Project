<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('audit_logs')) {
            return;
        }

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();

            // actor
            $table->unsignedBigInteger('actor_id')->nullable()->index();
            $table->string('actor_name', 150)->nullable();
            $table->string('actor_role', 40)->nullable()->index();
            $table->boolean('actor_is_super_admin')->default(false);

            // what happened
            $table->string('action', 100)->index();
            $table->string('entity_type', 100)->nullable()->index();
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->unsignedBigInteger('section_id')->nullable()->index();

            // request context
            $table->string('ip_address', 64)->nullable();
            $table->string('user_agent', 512)->nullable();
            $table->string('request_method', 10)->nullable();
            $table->string('route_name', 150)->nullable();

            // extra detail
            $table->json('metadata')->nullable();
            $table->text('description')->nullable();

            // outcome
            $table->string('status', 20)->default('success')->index();

            // audit trails must survive the deletion of their subject
            $table->timestamps();

            $table->index(['entity_type', 'entity_id']);
            $table->index(['action', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};