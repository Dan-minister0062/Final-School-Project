<?php

namespace Database\Seeders;

use App\Models\SchoolClass;
use Illuminate\Database\Seeder;

class ClassSeeder extends Seeder
{
    public function run(): void
    {
        $catalog = [
            // [code, name, nameEn, nameAr, level, capacity]
            // Kindergarten
            ['kindergarten_intro', 'Kitâb – Introduction', 'Kitab - Introduction', 'كتاب - تمهيدي', 'kindergarten', 25],
            ['kindergarten_prep1a', 'Préparation 1A', 'Preparatory 1A', 'تحضيري 1أ', 'kindergarten', 25],
            ['kindergarten_prep1b', 'Préparation 1B', 'Preparatory 1B', 'تحضيري 1ب', 'kindergarten', 25],
            ['kindergarten_prep2a', 'Préparation 2A', 'Preparatory 2A', 'تحضيري 2أ', 'kindergarten', 25],
            ['kindergarten_prep2b', 'Préparation 2B', 'Preparatory 2B', 'تحضيري 2ب', 'kindergarten', 25],
            // Primary
            ['primary_1a', 'Primaire 1A', 'Primary 1A', 'ابتدائي 1أ', 'primary', 30],
            ['primary_1b', 'Primaire 1B', 'Primary 1B', 'ابتدائي 1ب', 'primary', 30],
            ['primary_2a', 'Primaire 2A', 'Primary 2A', 'ابتدائي 2أ', 'primary', 30],
            ['primary_2b', 'Primaire 2B', 'Primary 2B', 'ابتدائي 2ب', 'primary', 30],
            ['primary_3a', 'Primaire 3A', 'Primary 3A', 'ابتدائي 3أ', 'primary', 30],
            ['primary_3b', 'Primaire 3B', 'Primary 3B', 'ابتدائي 3ب', 'primary', 30],
            ['primary_4a', 'Primaire 4A', 'Primary 4A', 'ابتدائي 4أ', 'primary', 30],
            ['primary_4b', 'Primaire 4B', 'Primary 4B', 'ابتدائي 4ب', 'primary', 30],
            ['primary_5a', 'Primaire 5A', 'Primary 5A', 'ابتدائي 5أ', 'primary', 30],
            ['primary_5b', 'Primaire 5B', 'Primary 5B', 'ابتدائي 5ب', 'primary', 30],
            ['primary_6a', 'Primaire 6A', 'Primary 6A', 'ابتدائي 6أ', 'primary', 30],
            ['primary_6b', 'Primaire 6B', 'Primary 6B', 'ابتدائي 6ب', 'primary', 30],
            // Secondary (collège)
            ['secondary_1a', 'Collège 1A', 'Middle School 1A', 'إعدادي 1أ', 'secondary', 30],
            ['secondary_1b', 'Collège 1B', 'Middle School 1B', 'إعدادي 1ب', 'secondary', 30],
            ['secondary_2a', 'Collège 2A', 'Middle School 2A', 'إعدادي 2أ', 'secondary', 30],
            ['secondary_2b', 'Collège 2B', 'Middle School 2B', 'إعدادي 2ب', 'secondary', 30],
            ['secondary_3a', 'Collège 3A', 'Middle School 3A', 'إعدادي 3أ', 'secondary', 30],
            ['secondary_3b', 'Collège 3B', 'Middle School 3B', 'إعدادي 3ب', 'secondary', 30],
            // High school
            ['highschool_common_core', 'Tronc Commun Scientifique', 'Common Core Science', 'الجذع المشترك العلمي', 'high_school', 30],
            ['highschool_1st_bac_experimental', '1ère Bac Sciences Expérimentales', '1st Bac Experimental Sciences', 'الأولى باكالوريا علوم تجريبية', 'high_school', 30],
            ['highschool_2nd_bac_physical', '2ème Bac Physique-Chimie', '2nd Bac Physics-Chemistry', 'الثانية باكالوريا فيزياء وكيمياء', 'high_school', 30],
        ];

        foreach ($catalog as [$code, $name, $nameEn, $nameAr, $level, $capacity]) {
            SchoolClass::firstOrCreate(
                ['code' => $code],
                [
                    'code' => $code,
                    'name' => $name,
                    'name_en' => $nameEn,
                    'name_ar' => $nameAr,
                    'level_key' => $level,
                    'capacity' => $capacity,
                    'status' => 'active',
                ]
            );
        }
    }
}