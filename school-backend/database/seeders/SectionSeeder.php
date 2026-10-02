<?php

namespace Database\Seeders;

use App\Models\Section;
use Illuminate\Database\Seeder;

class SectionSeeder extends Seeder
{
    public function run(): void
    {
        $sections = [
            [
                'key' => Section::KEY_KINDERGARTEN,
                'name' => 'Kindergarten',
                'name_ar' => 'روضة الأطفال',
                'description' => 'KG1 and KG2',
                'sort_order' => 1,
            ],
            [
                'key' => Section::KEY_PRIMARY,
                'name' => 'Primary',
                'name_ar' => 'الابتدائي',
                'description' => 'Primary cycle',
                'sort_order' => 2,
            ],
            [
                'key' => Section::KEY_SECONDARY,
                'name' => 'Secondary',
                'name_ar' => 'الإعدادي',
                'description' => 'Middle / lower secondary cycle',
                'sort_order' => 3,
            ],
            [
                'key' => Section::KEY_HIGH_SCHOOL,
                'name' => 'High School',
                'name_ar' => 'الثانوي',
                'description' => 'Upper secondary cycle',
                'sort_order' => 4,
            ],
        ];

        foreach ($sections as $section) {
            Section::updateOrCreate(
                ['key' => $section['key']],
                $section + ['is_active' => true]
            );
        }
    }
}