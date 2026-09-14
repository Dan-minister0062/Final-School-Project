<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Assessment extends Model
{
    use HasFactory;

    protected $fillable = [
        'title', 'class_code', 'subject_code', 'type', 'description',
        'due_date', 'deadline', 'max_score', 'status', 'created_by',
        'teacher_name', 'class_name', 'subject', 'teacher_id',
        'approved_by', 'approved_at', 'rejected_by', 'rejected_at',
        'sent_to_students_at', 'attachment_data', 'attachment_name',
        'attachment_type',
    ];

    protected $casts = [
        'due_date' => 'date',
        'deadline' => 'datetime',
        'max_score' => 'float',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
        'sent_to_students_at' => 'datetime',
    ];

    public function submissions()
    {
        return $this->hasMany(Submission::class);
    }

    public function teacher()
    {
        // teacher_id / created_by store the user id of the teacher account
        return $this->belongsTo(User::class, 'teacher_id');
    }
}