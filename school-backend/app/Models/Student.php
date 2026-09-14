<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    use HasFactory;

    protected $fillable = [
        'code', 'name', 'email', 'class_code', 'gender', 'dob',
        'address', 'parent_id', 'status', 'guardian',
    ];

    protected $casts = [
        'guardian' => 'array',
        'dob' => 'date',
    ];

    public function user()
    {
        return $this->hasOne(User::class, 'student_id');
    }

    public function schoolClass()
    {
        return $this->belongsTo(SchoolClass::class, 'class_code', 'code');
    }

    public function parent()
    {
        return $this->belongsTo(StudentDataParent::class, 'parent_id');
    }

    public function submissions()
    {
        return $this->hasMany(Submission::class);
    }

    public function attendance()
    {
        return $this->hasMany(Attendance::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }
}