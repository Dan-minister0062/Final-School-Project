<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    use HasFactory;

    protected $table = 'attendance';

    protected $fillable = [
        'class_code', 'student_id', 'student_code', 'student_name',
        'date', 'status', 'teacher_id', 'remarks',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public function student()
    {
        // student_id stores the user id (frontend student.id == users.id)
        return $this->belongsTo(User::class, 'student_id');
    }
}