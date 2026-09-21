<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'title', 'message', 'title_en', 'title_ar', 'message_en', 'message_ar',
        'type', 'audience', 'user_id', 'link',
        'is_read', 'read_at', 'priority', 'metadata',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'read_at' => 'datetime',
        'metadata' => 'array',
    ];
}