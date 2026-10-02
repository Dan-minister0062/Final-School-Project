<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Append-only audit trail.
 *
 * Logging must never break the request it is describing, so every failure is
 * swallowed and mirrored to the application log instead.
 */
class AuditLogger
{
    public function log(
        string $action,
        ?User $actor = null,
        ?string $entityType = null,
        $entityId = null,
        ?int $sectionId = null,
        array $metadata = [],
        ?string $description = null,
        string $status = 'success'
    ): ?AuditLog {
        try {
            return AuditLog::create([
                'actor_id' => $actor?->id,
                'actor_name' => $actor?->name,
                'actor_role' => $actor?->role,
                'actor_is_super_admin' => $actor ? (bool) $actor->isSuperAdmin() : false,
                'action' => $action,
                'entity_type' => $entityType,
                'entity_id' => $entityId !== null ? (int) $entityId : null,
                'section_id' => $sectionId,
                'ip_address' => request()?->ip(),
                'user_agent' => substr((string) request()?->userAgent(), 0, 500) ?: null,
                'request_method' => request()?->method(),
                'route_name' => request()?->route()?->getName(),
                'metadata' => $metadata ?: null,
                'description' => $description,
                'status' => $status,
            ]);
        } catch (Throwable $e) {
            Log::error('audit log write failed', ['action' => $action, 'error' => $e->getMessage()]);

            return null;
        }
    }

    public function denied(string $action, ?User $actor, array $metadata = []): ?AuditLog
    {
        return $this->log(
            $action,
            $actor,
            null,
            null,
            $actor?->section_id,
            $metadata,
            'Blocked: insufficient permission',
            'denied'
        );
    }
}