<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('sections')) {
            return;
        }

        Schema::create('sections', function (Blueprint $table) {
            $table->id();
            // stable machine key: kindergarten | primary | secondary | high_school
            $table->string('key', 32)->unique();
            $table->string('name', 100);
            $table->string('name_en', 100)->nullable();
            $table->string('name_ar', 100)->nullable();
            $table->text('description')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // The four institutional sections are reference data, not user data, so
        // they are created here. Later migrations backfill class and user
        // section_ids from these rows, so `migrate` alone must be enough --
        // seeding cannot be assumed.
        $sections = [
            ['key' => 'kindergarten', 'name' => 'Kindergarten', 'name_ar' => 'روضة الأطفال', 'description' => 'KG1 and KG2', 'sort_order' => 1],
            ['key' => 'primary', 'name' => 'Primary', 'name_ar' => 'الابتدائي', 'description' => 'Primary cycle', 'sort_order' => 2],
            ['key' => 'secondary', 'name' => 'Secondary', 'name_ar' => 'الإعدادي', 'description' => 'Middle / lower secondary cycle', 'sort_order' => 3],
            ['key' => 'high_school', 'name' => 'High School', 'name_ar' => 'الثانوي', 'description' => 'Upper secondary cycle', 'sort_order' => 4],
        ];

        foreach ($sections as $section) {
            DB::table('sections')->insertOrIgnore($section + [
                'name_en' => $section['name'],
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('sections');
    }
};