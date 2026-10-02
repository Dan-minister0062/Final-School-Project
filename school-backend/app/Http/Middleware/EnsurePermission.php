<?php

namespace App\Http\Middleware;

use App\Services\AuditLogger;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gate a route behind one or more RBAC permission keys.
 *
 * Super Admins always pass. Sub-Admins pass only with the exact grant.
 * Teachers/students/parents are rejected here: this middleware is for the
 * admin surface only.
 *
 * usage: ->middleware('permission:lessons.create,lessons.update')
 */
class EnsurePermission
{
    public function __construct(private AuditLogger $audit) {}

    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if (! $user->isAnyAdmin()) {
            $this->audit->denied('permission.denied', $user, [
                'required' => $permissions,
                'route' => $request->path(),
            ]);

            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if ($user->isSuperAdmin()) {
            return $next($request);
        }

        if (! $user->hasAnyPermission($permissions)) {
            $this->audit->denied('permission.denied', $user, [
                'required' => $permissions,
                'route' => $request->path(),
            ]);

            return response()->json([
                'message' => 'You do not have permission to perform this action.',
                'required_permission' => $permissions,
            ], 403);
        }

        return $next($request);
    }
}