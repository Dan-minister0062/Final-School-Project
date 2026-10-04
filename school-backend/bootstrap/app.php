<?php

use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => \App\Http\Middleware\EnsureRole::class,
            'permission' => \App\Http\Middleware\EnsurePermission::class,
            'super_admin' => \App\Http\Middleware\EnsureSuperAdmin::class,
            'protect_super_admins' => \App\Http\Middleware\ProtectSuperAdmins::class,
        ]);

        $middleware->prependToGroup('api', \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class);

        // Laravel registers `redirectGuestsTo(fn () => route('login'))` by
        // default. This backend has no login page, so for any request that is
        // not already expecting JSON (for example a browser fetch sending
        // "Accept: */*") the auth middleware resolves that target and throws
        // "Route [login] not defined", turning every unauthenticated API call
        // into a 500. Returning null leaves guests unredirected so the
        // exception handler can answer with a proper 401 instead.
        $middleware->redirectGuestsTo(fn () => null);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // API clients get JSON for every error, never an HTML error page.
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson()
        );

        $exceptions->render(function (AuthenticationException $e, $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json(['message' => $e->getMessage() ?: 'Unauthenticated.'], 401);
            }

            return null;
        });
    })->create();