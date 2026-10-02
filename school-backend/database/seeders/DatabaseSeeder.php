<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Sections must exist before classes reference them.
        $this->call(SectionSeeder::class);
        $this->call(ClassSeeder::class);
        $this->call(SubjectSeeder::class);
    }
}
