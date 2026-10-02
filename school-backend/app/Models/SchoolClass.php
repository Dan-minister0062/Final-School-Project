<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SchoolClass extends Model
{
    use HasFactory;

    protected $table = 'classes';

    protected $fillable = [
        'code', 'name', 'name_en', 'name_ar', 'level_key', 'capacity',
        'academic_year', 'room', 'teacher_name', 'status', 'section_id',
    ];

    protected $casts = [
        'capacity' => 'integer',
    ];

    public function students()
    {
        return $this->hasMany(Student::class, 'class_code', 'code');
    }

    public function section()
    {
        return $this->belongsTo(Section::class, 'section_id');
    }

    public function lessons()
    {
        return $this->hasMany(Lesson::class, 'class_id');
    }

    public function teachers()
    {
        return $this->belongsToMany(Teacher::class);
    }
}