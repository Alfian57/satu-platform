<?php

namespace App\Http\Controllers\Auth;

use App\Actions\Auth\DispatchAuthOtp;
use App\Actions\Fortify\CreateNewUser;
use App\Actions\Fortify\ResetUserPassword;
use App\Actions\Otp\VerifyOtp;
use App\Enums\InvitationStatus;
use App\Enums\MessageStatus;
use App\Enums\OtpChallengeStatus;
use App\Enums\OtpPurpose;
use App\Enums\PhoneNumberStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ResetRecoveredPasswordRequest;
use App\Http\Requests\Auth\StartRecoveryRequest;
use App\Http\Requests\Auth\StartRegistrationRequest;
use App\Http\Requests\Auth\VerifyOtpRequest;
use App\Models\MessageOutbox;
use App\Models\OtpChallenge;
use App\Models\PhoneNumber;
use App\Models\PrivilegedInvitation;
use App\Models\User;
use App\Support\PhoneIdentity;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;
use Throwable;

class AuthFlowController extends Controller
{
    public function __construct(
        private readonly DispatchAuthOtp $dispatchAuthOtp,
        private readonly VerifyOtp $verifyOtp,
        private readonly CreateNewUser $createNewUser,
        private readonly ResetUserPassword $resetUserPassword,
    ) {}

    /**
     * @return array{passwordRules: string, registration: array<string, mixed>}
     */
    public static function registrationPageProps(Request $request): array
    {
        $flow = $request->session()->get('auth.registration');
        $flow = is_array($flow) ? $flow : null;

        return [
            'passwordRules' => Password::defaults()->toPasswordRulesString(),
            'registration' => [
                'step' => $flow === null ? 'details' : 'otp',
                'maskedPhone' => $flow['masked_phone'] ?? null,
                'deliveryStatus' => self::deliveryStatusForFlow($flow),
                'resendAvailableAt' => $flow['resend_available_at'] ?? null,
                'status' => $request->session()->get('auth.registration_status'),
            ],
        ];
    }

    public function showRegistrationVerification(Request $request): Response|RedirectResponse
    {
        if ($this->flow($request, 'auth.registration') === null) {
            return to_route('register');
        }

        return Inertia::render('auth/register', self::registrationPageProps($request));
    }

    public function startRegistration(StartRegistrationRequest $request): RedirectResponse
    {
        $phone = $request->string('phone')->toString();

        try {
            $outbox = $this->dispatchAuthOtp->handle(
                OtpPurpose::Registration,
                $phone,
                $this->requestContext($request),
            );
        } catch (RuntimeException) {
            return back()->withErrors([
                'phone' => 'Kode belum dapat dikirim. Tunggu sebentar, lalu coba lagi.',
            ]);
        }

        $request->session()->put('auth.registration', [
            'name' => $request->string('name')->toString(),
            'username' => $request->string('username')->toString(),
            'password' => Crypt::encryptString($request->string('password')->toString()),
            'phone' => Crypt::encryptString($phone),
            'masked_phone' => PhoneIdentity::mask($phone),
            'outbox_id' => $outbox->id,
            'delivery_status' => self::deliveryStatus($outbox),
            'resend_available_at' => Carbon::now()->addSeconds(60)->timestamp,
        ]);

        return to_route('register.otp');
    }

    public function resendRegistration(Request $request): RedirectResponse
    {
        $flow = $this->flow($request, 'auth.registration');

        if ($flow === null) {
            return to_route('register');
        }

        if ($this->isInCooldown($flow)) {
            return back()->withErrors([
                'otp' => 'Tunggu sampai jeda kirim ulang selesai.',
            ]);
        }

        $phone = $this->decrypt($flow['phone'] ?? null);

        if ($phone === null) {
            return to_route('register')->with('auth.registration_status', 'expired');
        }

        try {
            $outbox = $this->dispatchAuthOtp->handle(
                OtpPurpose::Registration,
                $phone,
                $this->requestContext($request),
            );
        } catch (RuntimeException) {
            return back()->withErrors([
                'otp' => 'Terlalu banyak permintaan. Tunggu sebentar sebelum mencoba lagi.',
            ]);
        }

        $flow['outbox_id'] = $outbox->id;
        $flow['delivery_status'] = self::deliveryStatus($outbox);
        $flow['resend_available_at'] = Carbon::now()->addSeconds(60)->timestamp;
        $request->session()->put('auth.registration', $flow);

        return to_route('register.otp');
    }

    public function verifyRegistration(VerifyOtpRequest $request): RedirectResponse
    {
        $flow = $this->flow($request, 'auth.registration');

        if ($flow === null) {
            return to_route('register')->with('auth.registration_status', 'expired');
        }

        $phone = $this->decrypt($flow['phone'] ?? null);
        $password = $this->decrypt($flow['password'] ?? null);

        if ($phone === null || $password === null) {
            return to_route('register')->with('auth.registration_status', 'expired');
        }

        if (! $this->verifyOtp->handle(
            OtpPurpose::Registration,
            $phone,
            $request->string('otp')->toString(),
        )) {
            return $this->otpVerificationError($request, 'auth.registration', OtpPurpose::Registration, $phone);
        }

        $request->session()->put('auth.registration_verified', true);

        try {
            $user = DB::transaction(function () use ($flow, $phone, $password): User {
                $user = $this->createNewUser->create([
                    'name' => (string) $flow['name'],
                    'username' => (string) $flow['username'],
                    'password' => $password,
                    'password_confirmation' => $password,
                ]);

                $phoneNumber = new PhoneNumber;
                $phoneNumber->forceFill([
                    'user_id' => $user->id,
                    'number' => $phone,
                    'number_hash' => PhoneIdentity::hash($phone),
                    'masked' => PhoneIdentity::mask($phone),
                    'status' => PhoneNumberStatus::Verified,
                    'verified_at' => Carbon::now(),
                ])->save();

                return $user;
            });
        } finally {
            $request->session()->forget('auth.registration_verified');
        }

        event(new Registered($user));
        Auth::login($user);
        $request->session()->forget('auth.registration');
        $request->session()->regenerate();

        return to_route('dashboard');
    }

    public function showRecovery(Request $request): Response
    {
        if ($request->boolean('restart')) {
            $request->session()->forget([
                'auth.recovery',
                'auth.recovery_verified',
            ]);
        }

        return Inertia::render('auth/recover', $this->recoveryPageProps($request));
    }

    public function showRecoveryVerification(Request $request): Response|RedirectResponse
    {
        if ($this->flow($request, 'auth.recovery') === null) {
            return to_route('recover');
        }

        return Inertia::render('auth/recover', $this->recoveryPageProps($request));
    }

    public function showRecoveryReset(Request $request): Response|RedirectResponse
    {
        if ($this->flow($request, 'auth.recovery_verified') === null) {
            return to_route('recover')->with('auth.recovery_status', 'expired');
        }

        return Inertia::render('auth/recover', $this->recoveryPageProps($request));
    }

    public function startRecovery(StartRecoveryRequest $request): RedirectResponse
    {
        $phone = $request->string('phone')->toString();
        $phoneNumber = PhoneNumber::query()
            ->verified()
            ->where('number_hash', PhoneIdentity::hash($phone))
            ->first();
        $outbox = null;

        if ($phoneNumber !== null) {
            try {
                $outbox = $this->dispatchAuthOtp->handle(
                    OtpPurpose::Recovery,
                    $phone,
                    $this->requestContext($request),
                );
            } catch (RuntimeException) {
                // Keep recovery response generic to avoid account enumeration.
            }
        }

        $request->session()->put('auth.recovery', [
            'phone' => Crypt::encryptString($phone),
            'masked_phone' => PhoneIdentity::mask($phone),
            'known_user_id' => $phoneNumber === null
                ? null
                : Crypt::encryptString((string) $phoneNumber->user_id),
            'outbox_id' => $outbox?->id,
            'delivery_status' => 'unknown',
            'resend_available_at' => Carbon::now()->addSeconds(60)->timestamp,
        ]);

        return to_route('recover.otp');
    }

    public function resendRecovery(Request $request): RedirectResponse
    {
        $flow = $this->flow($request, 'auth.recovery');

        if ($flow === null) {
            return to_route('recover');
        }

        if ($this->isInCooldown($flow)) {
            return back()->withErrors([
                'otp' => 'Tunggu sampai jeda kirim ulang selesai.',
            ]);
        }

        $phone = $this->decrypt($flow['phone'] ?? null);
        $userId = $this->decrypt($flow['known_user_id'] ?? null);
        $outbox = null;

        if ($phone !== null && $userId !== null) {
            try {
                $outbox = $this->dispatchAuthOtp->handle(
                    OtpPurpose::Recovery,
                    $phone,
                    $this->requestContext($request),
                );
            } catch (RuntimeException) {
                // Keep recovery response generic to avoid account enumeration.
            }
        }

        $flow['outbox_id'] = $outbox?->id;
        $flow['delivery_status'] = 'unknown';
        $flow['resend_available_at'] = Carbon::now()->addSeconds(60)->timestamp;
        $request->session()->put('auth.recovery', $flow);

        return to_route('recover.otp');
    }

    public function verifyRecovery(VerifyOtpRequest $request): RedirectResponse
    {
        $flow = $this->flow($request, 'auth.recovery');

        if ($flow === null) {
            return back()->withErrors([
                'otp' => 'Kode belum cocok atau sudah tidak berlaku. Minta kode baru, lalu coba lagi.',
            ]);
        }

        $phone = $this->decrypt($flow['phone'] ?? null);
        $userId = $this->decrypt($flow['known_user_id'] ?? null);
        $user = $userId === null ? null : User::query()->find((int) $userId);

        if ($phone === null || $user === null) {
            return back()->withErrors([
                'otp' => 'Kode belum cocok atau sudah tidak berlaku. Minta kode baru, lalu coba lagi.',
            ]);
        }

        if (! $this->verifyOtp->handle(
            OtpPurpose::Recovery,
            $phone,
            $request->string('otp')->toString(),
        )) {
            return $this->otpVerificationError($request, 'auth.recovery', OtpPurpose::Recovery, $phone);
        }

        $request->session()->put('auth.recovery_verified', [
            'user_id' => Crypt::encryptString((string) $user->id),
            'masked_phone' => $flow['masked_phone'] ?? null,
        ]);
        $request->session()->forget('auth.recovery');

        return to_route('recover.reset');
    }

    public function resetRecoveredPassword(ResetRecoveredPasswordRequest $request): RedirectResponse
    {
        $flow = $this->flow($request, 'auth.recovery_verified');
        $userId = $this->decrypt($flow['user_id'] ?? null);
        $user = $userId === null ? null : User::query()->find((int) $userId);

        if ($flow === null || $user === null) {
            return to_route('recover')->with('auth.recovery_status', 'expired');
        }

        $this->resetUserPassword->reset($user, [
            'password' => $request->string('password')->toString(),
            'password_confirmation' => $request->string('password_confirmation')->toString(),
        ]);

        $request->session()->forget('auth.recovery_verified');

        return to_route('login')->with(
            'status',
            'Password berhasil diperbarui. Masuk dengan username dan password baru.',
        );
    }

    public function showInvitation(string $token): Response
    {
        $invitation = $this->findInvitation($token);

        if (
            $invitation === null
            || $invitation->status !== InvitationStatus::Issued
            || $invitation->isExpired()
        ) {
            return Inertia::render('auth/invitation', [
                'invitation' => [
                    'status' => 'expired',
                ],
            ]);
        }

        return Inertia::render('auth/invitation', [
            'invitation' => [
                'status' => 'valid',
                'institutionName' => $invitation->institution?->name,
                'maskedPhone' => $this->maskInvitationPhone($invitation->phone),
                'intendedRole' => $invitation->intended_role,
                'expiresAt' => $invitation->expires_at->toIso8601String(),
            ],
        ]);
    }

    /**
     * @return array{recovery: array{step: string, maskedPhone: string|null, deliveryStatus: string|null, resendAvailableAt: int|null, status: string|null}}
     */
    private function recoveryPageProps(Request $request): array
    {
        $flow = $this->flow($request, 'auth.recovery');
        $verified = $this->flow($request, 'auth.recovery_verified');

        return [
            'recovery' => [
                'step' => $verified !== null ? 'reset' : ($flow === null ? 'phone' : 'otp'),
                'maskedPhone' => $verified['masked_phone'] ?? $flow['masked_phone'] ?? null,
                'deliveryStatus' => $flow === null ? null : 'unknown',
                'resendAvailableAt' => $flow['resend_available_at'] ?? null,
                'status' => $request->session()->get('auth.recovery_status'),
            ],
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function flow(Request $request, string $key): ?array
    {
        $flow = $request->session()->get($key);

        return is_array($flow) ? $flow : null;
    }

    private function decrypt(mixed $value): ?string
    {
        if (! is_string($value) || $value === '') {
            return null;
        }

        try {
            return Crypt::decryptString($value);
        } catch (Throwable) {
            return null;
        }
    }

    /**
     * @param  array<string, mixed>  $flow
     */
    private function isInCooldown(array $flow): bool
    {
        $availableAt = $flow['resend_available_at'] ?? null;

        return is_numeric($availableAt) && Carbon::now()->timestamp < (int) $availableAt;
    }

    /**
     * @param  array<string, mixed>|null  $flow
     */
    private static function deliveryStatusForFlow(?array $flow): ?string
    {
        if ($flow === null) {
            return null;
        }

        $fallback = $flow['delivery_status'] ?? null;
        $outboxId = $flow['outbox_id'] ?? null;

        if ($fallback === 'locked') {
            return $fallback;
        }

        if (! is_numeric($outboxId)) {
            return is_string($fallback) ? $fallback : null;
        }

        $outbox = MessageOutbox::query()->find((int) $outboxId);

        return $outbox === null
            ? (is_string($fallback) ? $fallback : null)
            : self::deliveryStatus($outbox);
    }

    private static function deliveryStatus(MessageOutbox $outbox): string
    {
        $latestDelivery = $outbox->deliveries()->latest('id')->first();

        if (
            $outbox->status === MessageStatus::Failed
            || $latestDelivery?->status === MessageStatus::Failed
        ) {
            return 'failed';
        }

        if (in_array($outbox->status, [MessageStatus::Sent, MessageStatus::Delivered], true)) {
            return 'sent';
        }

        return 'queued';
    }

    private function otpVerificationError(
        Request $request,
        string $flowKey,
        OtpPurpose $purpose,
        string $phone,
    ): RedirectResponse {
        $message = 'Kode belum cocok atau sudah tidak berlaku. Minta kode baru, lalu coba lagi.';

        if ($this->isOtpLockedOut($purpose, $phone)) {
            $flow = $this->flow($request, $flowKey);

            if ($flow !== null) {
                $flow['delivery_status'] = 'locked';
                $request->session()->put($flowKey, $flow);
            }

            $message = 'Batas percobaan kode tercapai. Tunggu jeda kirim ulang, lalu minta kode baru.';
        }

        return back()->withErrors(['otp' => $message]);
    }

    private function isOtpLockedOut(OtpPurpose $purpose, string $phone): bool
    {
        $challenge = OtpChallenge::query()
            ->purpose($purpose)
            ->target($phone)
            ->latest('id')
            ->first();

        return $challenge?->status === OtpChallengeStatus::Failed;
    }

    /**
     * @return array{ip_hash: string, user_agent_hash: string}
     */
    private function requestContext(Request $request): array
    {
        return [
            'ip_hash' => hash('sha256', (string) $request->ip()),
            'user_agent_hash' => hash('sha256', (string) $request->userAgent()),
        ];
    }

    private function findInvitation(string $token): ?PrivilegedInvitation
    {
        $invitations = PrivilegedInvitation::query()
            ->whereIn('status', [InvitationStatus::Issued, InvitationStatus::Expired])
            ->with('institution:id,name')
            ->get();

        foreach ($invitations as $invitation) {
            if (Hash::check($token, $invitation->token_hash)) {
                return $invitation;
            }
        }

        return null;
    }

    private function maskInvitationPhone(string $phone): ?string
    {
        try {
            return PhoneIdentity::mask($phone);
        } catch (Throwable) {
            return null;
        }
    }
}
