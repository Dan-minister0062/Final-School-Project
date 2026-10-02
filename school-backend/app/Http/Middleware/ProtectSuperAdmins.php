<?php

namespace App\Http\Middleware;

use App\Services\AuditLogger;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Blocks any mutation of a Super Admin account (delete, demote, role change,
 * permission change, suspension) unless the actor is another Super Admin.
 *
 * This is the hard protection the brief asks for: a Sub-Admin can never
 * demote, suspend or delete a Super Admin, even if they somehow hold the
 * matching permission key.
 */
class ProtectSuperAdmins
{
    public function __construct(private AuditLogger $audit) {}

    public function handle(Request $request, Closure $next): Response
    {
        $actor = $request->user();
        $targetId = $request->route('user') ?? $request->route('id');

        if (! $actor || $targetId === null) {
            return $next($request);
        }

        $target = \App\Models\User::find($targetId);

        if (! $target || ! $target->isSuperAdmin()) {
            return $next($request);
        }

        if (! $actor->isSuperAdmin()) {
            $this->audit->denied('super_admin.protected', $actor, [
                'target_user_id' => $target->id,
                'route' => $request->path(),
            ]);

            return response()->json([
                'message' => 'The Super Admin cannot be modified by another account.',
            ], 403);
        }

        if ((int) $actor->id === (int) $target->id && $request->isMethod('delete')) {
            return response()->json([
                'message' => 'You cannot delete your own Super Admin account.',
            ], 403);
        }

        return $next($request);
    }
}