<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Super Admin-only routes.
 *
 * Nothing here may be reachable by a Sub-Admin, a teacher, a parent or a
 * student -- not even with a valid session.
 */
class EnsureSuperAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if (! $user->isSuperAdmin()) {
            return response()->json([
                'message' => 'This action is restricted to the Super Admin.',
            ], 403);
        }

        return $next($request);
    }
}