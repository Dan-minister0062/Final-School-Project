<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LessonContentBlock extends Model
{
    use HasFactory;

    protected $fillable = [
        'lesson_id',
        'type',
        'order',
        'title',
        'data',
    ];

    protected $casts = [
        'order' => 'integer',
        'data' => 'array',
    ];

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class, 'lesson_id');
    }
}