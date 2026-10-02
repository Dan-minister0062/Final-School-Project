<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LessonSubmission extends Model
{
    use HasFactory;

    public const STATUS_DRAFT = 'draft';

    public const STATUS_SUBMITTED = 'submitted';

    public const STATUS_GRADED = 'graded';

    public const STATUS_RETURNED = 'returned';

    protected $fillable = [
        'lesson_assignment_id',
        'lesson_id',
        'student_id',
        'class_id',
        'section_id',
        'content',
        'attachments',
        'answers',
        'submitted_at',
        'grade',
        'feedback',
        'graded_by',
        'graded_at',
        'status',
    ];

    protected $casts = [
        'attachments' => 'array',
        'answers' => 'array',
        'submitted_at' => 'datetime',
        'graded_at' => 'datetime',
        'grade' => 'decimal:2',
    ];

    public function assignment(): BelongsTo
    {
        return $this->belongsTo(LessonAssignment::class, 'lesson_assignment_id');
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class, 'lesson_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function grader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'graded_by');
    }

    public function isGraded(): bool
    {
        return $this->status === self::STATUS_GRADED;
    }
}