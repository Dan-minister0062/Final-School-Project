<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Teacher extends Model
{
    use HasFactory;

    protected $fillable = [
        'code', 'name', 'email', 'phone', 'gender', 'dob', 'address',
        'subject_code', 'subject', 'class_codes', 'status',
    ];

    protected $casts = [
        'class_codes' => 'array',
        'dob' => 'date',
    ];

    public function user()
    {
        return $this->hasOne(User::class, 'teacher_id');
    }

    public function classes()
    {
        return $this->belongsToMany(SchoolClass::class);
    }

    public function assessments()
    {
        return $this->hasMany(Assessment::class, 'created_by');
    }
}