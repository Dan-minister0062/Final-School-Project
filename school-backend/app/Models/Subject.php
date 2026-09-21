<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Subject extends Model
{
    use HasFactory;

    protected $fillable = [
        'code', 'name', 'name_en', 'name_ar', 'category', 'class_code', 'level_key', 'academic_year',
        'coefficient', 'status',
    ];

    protected $casts = [
        'coefficient' => 'integer',
    ];
}