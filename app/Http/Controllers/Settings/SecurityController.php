<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\PasswordUpdateRequest;
use App\Http\Requests\Settings\TwoFactorAuthenticationRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class SecurityController extends Controller
{
    /**
     * Show the user's security settings page.
     */
    public function edit(TwoFactorAuthenticationRequest $request): Response
    {
        $confirmedAt = now()->unix() - (int) $request->session()->get('auth.password_confirmed_at', 0);
        $passwordTimeout = (int) config('auth.password_timeout', 10800);
        $isConfirmed = $confirmedAt <= $passwordTimeout;

        if (! $isConfirmed) {
            $request->session()->put('url.intended', route('security.edit'));
        }

        $props = [
            'isConfirmed' => $isConfirmed,
            'passwordRules' => Password::defaults()->toPasswordRulesString(),
        ];

        return Inertia::render('settings/security', $props);
    }

    /**
     * Update the user's password.
     */
    public function update(PasswordUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 401);

        $user->update([
            'password' => $request->password,
        ]);

        $request->session()->put('auth.password_confirmed_at', now()->unix());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Password berhasil diperbarui.')]);

        return back();
    }
}
