<?php

namespace App\Http\Responses\Fortify;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Laravel\Fortify\Fortify;

final class LoginResponse implements LoginResponseContract
{
    /**
     * Create a response after a successful login.
     *
     * @param  mixed  $request
     */
    public function toResponse($request)
    {
        $request->session()->put('auth.last_authenticated_at', Carbon::now()->timestamp);

        if ($request->wantsJson()) {
            return new JsonResponse(['two_factor' => false]);
        }

        if ($request->session()->has('auth.invitation')) {
            return redirect()->route('invitation.pending');
        }

        return redirect()->intended(Fortify::redirects('login'));
    }
}
