<?php

namespace App\Actions\Otp;

use App\Enums\OtpChallengeStatus;
use App\Enums\OtpPurpose;
use App\Models\OtpChallenge;
use Illuminate\Support\Carbon;

final class InvalidateOtp
{
    public function handle(OtpPurpose $purpose, string $target): void
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

    public function handleAll(string $target): void
    {
        OtpChallenge::query()
            ->target($target)
            ->pending()
            ->update([
                'status' => OtpChallengeStatus::Invalidated,
                'invalidated_at' => Carbon::now(),
            ]);
    }
}
