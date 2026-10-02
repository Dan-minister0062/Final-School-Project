<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    use HasFactory;

    public $timestamps = true;

    protected $fillable = [
        'actor_id',
        'actor_name',
        'actor_role',
        'actor_is_super_admin',
        'action',
        'entity_type',
        'entity_id',
        'section_id',
        'ip_address',
        'user_agent',
        'request_method',
        'route_name',
        'metadata',
        'description',
        'status',
    ];

    protected $casts = [
        'metadata' => 'array',
        'actor_is_super_admin' => 'boolean',
    ];

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class, 'section_id');
    }
}