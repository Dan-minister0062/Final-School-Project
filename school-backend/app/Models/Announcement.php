<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Announcement extends Model
{
    use HasFactory;

    protected $fillable = [
        'title', 'content', 'category', 'audience', 'start_date',
        'end_date', 'published_by', 'status',
        'type', 'priority', 'author', 'target_audience', 'image', 'video',
        'media_type', 'views', 'likes', 'comments', 'date', 'time',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'target_audience' => 'array',
        'views' => 'integer',
        'likes' => 'integer',
        'comments' => 'integer',
    ];
}