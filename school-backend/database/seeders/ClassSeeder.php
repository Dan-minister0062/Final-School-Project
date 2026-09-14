<?php

namespace Database\Seeders;

use App\Models\SchoolClass;
use Illuminate\Database\Seeder;

class ClassSeeder extends Seeder
{
    public function run(): void
    {
        $catalog = [
            // Kindergarten
            ['kindergarten_intro', 'Kitâb – Introduction', 'kindergarten', 25],
            ['kindergarten_prep1a', 'Préparation 1A', 'kindergarten', 25],
            ['kindergarten_prep1b', 'Préparation 1B', 'kindergarten', 25],
            ['kindergarten_prep2a', 'Préparation 2A', 'kindergarten', 25],
            ['kindergarten_prep2b', 'Préparation 2B', 'kindergarten', 25],
            // Primary
            ['primary_1a', 'Primaire 1A', 'primary', 30],
            ['primary_1b', 'Primaire 1B', 'primary', 30],
            ['primary_2a', 'Primaire 2A', 'primary', 30],
            ['primary_2b', 'Primaire 2B', 'primary', 30],
            ['primary_3a', 'Primaire 3A', 'primary', 30],
            ['primary_3b', 'Primaire 3B', 'primary', 30],
            ['primary_4a', 'Primaire 4A', 'primary', 30],
            ['primary_4b', 'Primaire 4B', 'primary', 30],
            ['primary_5a', 'Primaire 5A', 'primary', 30],
            ['primary_5b', 'Primaire 5B', 'primary', 30],
            ['primary_6a', 'Primaire 6A', 'primary', 30],
            ['primary_6b', 'Primaire 6B', 'primary', 30],
            // Secondary (collège)
            ['secondary_1a', 'Collège 1A', 'secondary', 30],
            ['secondary_1b', 'Collège 1B', 'secondary', 30],
            ['secondary_2a', 'Collège 2A', 'secondary', 30],
            ['secondary_2b', 'Collège 2B', 'secondary', 30],
            ['secondary_3a', 'Collège 3A', 'secondary', 30],
            ['secondary_3b', 'Collège 3B', 'secondary', 30],
            // High school
            ['highschool_common_core', 'Tronc Commun Scientifique', 'high_school', 30],
            ['highschool_1st_bac_experimental', '1ère Bac Sciences Expérimentales', 'high_school', 30],
            ['highschool_2nd_bac_physical', '2ème Bac Physique-Chimie', 'high_school', 30],
        ];

        foreach ($catalog as [$code, $name, $level, $capacity]) {
            SchoolClass::firstOrCreate(
                ['code' => $code],
                [
                    'code' => $code,
                    'name' => $name,
                    'level_key' => $level,
                    'capacity' => $capacity,
                    'status' => 'active',
                ]
            );
        }
    }
}