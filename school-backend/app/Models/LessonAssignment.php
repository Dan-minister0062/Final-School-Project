<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LessonAssignment extends Model
{
    use HasFactory;

    public const TYPE_ASSIGNMENT = 'assignment';

    public const TYPE_QUIZ = 'quiz';

    protected $fillable = [
        'lesson_id',
        'type',
        'title',
        'instructions',
        'due_date',
        'max_score',
        'time_limit_minutes',
        'allow_late',
        'questions',
        'created_by',
    ];

    protected $casts = [
        'due_date' => 'datetime',
        'max_score' => 'decimal:2',
        'time_limit_minutes' => 'integer',
        'allow_late' => 'boolean',
        'questions' => 'array',
    ];

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class, 'lesson_id');
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(LessonSubmission::class, 'lesson_assignment_id');
    }
}