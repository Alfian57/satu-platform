<?php

namespace App\Http\Middleware;

use App\Models\Institution;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUniversityAdministration
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->routeIs('campus.*', 'platform.*', 'university.*')) {
            $user = $request->user();
            $institution = $request->route('institution');
            abort_unless($user instanceof User && $user->isUniversityAdmin(
                $institution instanceof Institution ? $institution : null,
            ), 403);
        }

        return $next($request);
    }
}
