<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Lesson extends Model
{
    use HasFactory, SoftDeletes;

    public const STATUS_DRAFT = 'draft';

    public const STATUS_PUBLISHED = 'published';

    public const STATUS_ARCHIVED = 'archived';

    protected $fillable = [
        'title',
        'slug',
        'description',
        'objectives',
        'section_id',
        'class_id',
        'created_by',
        'updated_by',
        'status',
        'published_at',
        'due_date',
        'scheduled_at',
        'estimated_minutes',
        'order_index',
    ];

    protected $casts = [
        'published_at' => 'datetime',
        'due_date' => 'date',
        'scheduled_at' => 'datetime',
        'order_index' => 'integer',
        'estimated_minutes' => 'integer',
    ];

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class, 'section_id');
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function contentBlocks(): HasMany
    {
        return $this->hasMany(LessonContentBlock::class, 'lesson_id')->orderBy('order');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(LessonAttachment::class, 'lesson_id');
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(LessonAssignment::class, 'lesson_id');
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(LessonSubmission::class, 'lesson_id');
    }

    public function progressRecords(): HasMany
    {
        return $this->hasMany(LessonProgress::class, 'lesson_id');
    }

    public function scopePublished($query)
    {
        return $query->where('status', self::STATUS_PUBLISHED);
    }

    public function scopeForSection($query, ?int $sectionId)
    {
        return $sectionId ? $query->where('section_id', $sectionId) : $query;
    }
}