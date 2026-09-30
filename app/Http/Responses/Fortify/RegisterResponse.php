<?php

namespace App\Http\Responses\Fortify;

use Illuminate\Http\JsonResponse;
use Laravel\Fortify\Contracts\RegisterResponse as RegisterResponseContract;
use Laravel\Fortify\Fortify;

class RegisterResponse implements RegisterResponseContract
{
    /**
     * Create a response after a successful registration.
     *
     * @param  mixed  $request
     */
    public function toResponse($request)
    {
        if ($request->wantsJson()) {
            return new JsonResponse('', 201);
        }

        if ($request->session()->has('auth.invitation')) {
            return redirect()->route('invitation.pending');
        }

        return redirect()->intended(Fortify::redirects('register'));
    }
}
