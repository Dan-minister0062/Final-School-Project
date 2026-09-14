<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Submission extends Model
{
    use HasFactory;

    protected $fillable = [
        'assessment_id', 'student_id', 'student_code', 'student_name',
        'content', 'file_url', 'file_data', 'file_name', 'file_type',
        'score', 'status', 'submitted_at', 'comment',
    ];

    protected $casts = [
        'score' => 'float',
        'submitted_at' => 'datetime',
    ];

    public function assessment()
    {
        return $this->belongsTo(Assessment::class);
    }

    public function student()
    {
        // student_id stores the user id (frontend student.id == users.id)
        return $this->belongsTo(User::class, 'student_id');
    }
}