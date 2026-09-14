<?php

namespace Database\Seeders;

use App\Models\Subject;
use Illuminate\Database\Seeder;

class SubjectSeeder extends Seeder
{
    public function run(): void
    {
        $subjects = [
            ['M', 'Mathématiques', 'الرياضيات', 'secondary'],
            ['P', 'Physique et Chimie', 'الفيزياء والكيمياء', 'secondary'],
            ['SVT', 'Sciences de la Vie et de la Terre', 'علوم الحياة والأرض', 'secondary'],
            ['Ar', 'Langue Arabe', 'اللغة العربية', 'secondary'],
            ['Fr', 'Langue Française', 'اللغة الفرنسية', 'secondary'],
            ['AN', 'Langue Anglaise', 'اللغة الإنجليزية', 'secondary'],
            ['His-Geo', 'Histoire-Géographie', 'التاريخ والجغرافيا', 'secondary'],
            ['EP', 'Éducation Physique et Sportive', 'التربية البدنية والرياضية', 'secondary'],
            ['IS', 'Informatique', 'الإعلاميات', 'secondary'],
            ['EdIs', 'Éducation Islamique', 'التربية الإسلامية', 'secondary'],
            ['AF', 'Activités et Exercices / Aides', 'أنشطة وتمارين', 'secondary'],
        ];

        foreach ($subjects as [$code, $name, $nameAr, $category]) {
            Subject::updateOrCreate(
                ['code' => $code],
                [
                    'code' => $code,
                    'name' => $name,
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