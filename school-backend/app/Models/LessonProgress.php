<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LessonProgress extends Model
{
    use HasFactory;

    public const STATUS_NOT_STARTED = 'not_started';

    public const STATUS_IN_PROGRESS = 'in_progress';

    public const STATUS_COMPLETED = 'completed';

    protected $fillable = [
        'lesson_id',
        'student_id',
        'section_id',
        'class_id',
        'status',
        'progress_percent',
        'started_at',
        'completed_at',
        'time_spent_seconds',
    ];

    protected $casts = [
        'progress_percent' => 'integer',
        'time_spent_seconds' => 'integer',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class, 'lesson_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }
}