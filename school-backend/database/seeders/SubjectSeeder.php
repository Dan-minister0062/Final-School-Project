<?php

namespace Database\Seeders;

use App\Models\Subject;
use Illuminate\Database\Seeder;

class SubjectSeeder extends Seeder
{
    public function run(): void
    {
        $subjects = [
            ['M', 'Mathématiques', 'Mathematics', 'الرياضيات', 'secondary'],
            ['P', 'Physique et Chimie', 'Physics and Chemistry', 'الفيزياء والكيمياء', 'secondary'],
            ['SVT', 'Sciences de la Vie et de la Terre', 'Life and Earth Sciences', 'علوم الحياة والأرض', 'secondary'],
            ['Ar', 'Langue Arabe', 'Arabic Language', 'اللغة العربية', 'secondary'],
            ['Fr', 'Langue Française', 'French Language', 'اللغة الفرنسية', 'secondary'],
            ['AN', 'Langue Anglaise', 'English Language', 'اللغة الإنجليزية', 'secondary'],
            ['His-Geo', 'Histoire-Géographie', 'History-Geography', 'التاريخ والجغرافيا', 'secondary'],
            ['EP', 'Éducation Physique et Sportive', 'Physical Education and Sports', 'التربية البدنية والرياضية', 'secondary'],
            ['IS', 'Informatique', 'Computer Science', 'الإعلاميات', 'secondary'],
            ['EdIs', 'Éducation Islamique', 'Islamic Education', 'التربية الإسلامية', 'secondary'],
            ['AF', 'Activités et Exercices / Aides', 'Activities and Exercises', 'أنشطة وتمارين', 'secondary'],
        ];

        foreach ($subjects as [$code, $name, $nameEn, $nameAr, $category]) {
            Subject::updateOrCreate(
                ['code' => $code],
                [
                    'code' => $code,
                    'name' => $name,
                    'name_en' => $nameEn,
                    'name_ar' => $nameAr,
                    'category' => $category,
                    'coefficient' => $this->coefficient($code),
                    'status' => 'active',
                ]
            );
        }
    }

    protected function coefficient(string $code): int
    {
        return match ($code) {
            'M', 'P', 'SVT', 'Ar', 'Fr', 'AN' => 4,
            'His-Geo' => 3,
            'EP', 'IS', 'EdIs' => 2,
            default => 1,
        };
    }
}