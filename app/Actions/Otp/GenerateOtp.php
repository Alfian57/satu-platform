<?php

namespace App\Actions\Otp;

use App\Enums\OtpChallengeStatus;
use App\Enums\OtpPurpose;
use App\Models\OtpChallenge;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

/**
 * Generate a purpose-bound OTP challenge.
 *
 * Invalides any existing pending challenge for the same purpose and
 * target, enforces resend limits, and stores a hashed OTP. The
 * plain OTP is returned to the caller for delivery only; it is
 * never stored, logged, or included in event payloads.
 */
final class GenerateOtp
{
    private const OTP_LENGTH = 6;

    private const OTP_EXPIRY_MINUTES = 5;

    private const MAX_REQUESTS_PER_HOUR = 2;

    public function handle(
        OtpPurpose $purpose,
        string $target,
        ?array $requestContext = null,
    ): string {
        return DB::transaction(function () use ($purpose, $target, $requestContext) {
            $this->invalidateExisting($purpose, $target);
            $this->enforceResendLimit($purpose, $target);

            $plainOtp = $this->generateOtp();

            OtpChallenge::query()->create([
                'purpose' => $purpose,
                'target' => $target,
                'token' => Hash::make($plainOtp),
                'status' => OtpChallengeStatus::Pending,
                'expires_at' => Carbon::now()->addMinutes(self::OTP_EXPIRY_MINUTES),
                'request_context' => $requestContext,
            ]);

            return $plainOtp;
        });
    }

    private function generateOtp(): string
    {
        $otp = '';

        for ($i = 0; $i < self::OTP_LENGTH; $i++) {
            $otp .= (string) random_int(0, 9);
        }

        return $otp;
    }

    private function invalidateExisting(OtpPurpose $purpose, string $target): void
    {
        OtpChallenge::query()
            ->purpose($purpose)
            ->target($target)
            ->pending()
            ->update([
                'status' => OtpChallengeStatus::Invalidated,
                'invalidated_at' => Carbon::now(),
            ]);
    }

    private function enforceResendLimit(OtpPurpose $purpose, string $target): void
    {
        $recentCount = OtpChallenge::query()
            ->purpose($purpose)
            ->target($target)
            ->where('created_at', '>=', Carbon::now()->subHour())
            ->count();

        if ($recentCount >= self::MAX_REQUESTS_PER_HOUR) {
            throw new RuntimeException('OTP resend limit reached.');
        }
    }
}
