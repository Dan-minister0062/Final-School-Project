<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LessonAttachment extends Model
{
    use HasFactory;

    protected $fillable = [
        'lesson_id',
        'uploaded_by',
        'title',
        'file_url',
        'file_name',
        'file_type',
        'file_size',
        'external_url',
    ];

    protected $casts = [
        'file_size' => 'integer',
    ];

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class, 'lesson_id');
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}