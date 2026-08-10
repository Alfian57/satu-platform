<?php

namespace App\Actions\Otp;

use App\Enums\OtpChallengeStatus;
use App\Enums\OtpPurpose;
use App\Models\OtpChallenge;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

final class VerifyOtp
{
    public function handle(
        OtpPurpose $purpose,
        string $target,
        string $plainOtp,
    ): bool {
        return DB::transaction(function () use ($purpose, $target, $plainOtp) {
            $challenge = OtpChallenge::query()
                ->purpose($purpose)
                ->target($target)
                ->pending()
                ->notExpired()
                ->lockForUpdate()
                ->first();

            if ($challenge === null) {
                return false;
            }

            if ($challenge->attemptsExceeded()) {
                $challenge->update([
                    'status' => OtpChallengeStatus::Failed,
                ]);

                return false;
            }

            $challenge->increment('attempts');

            if (! Hash::check($plainOtp, $challenge->token)) {
                if ($challenge->fresh()->attemptsExceeded()) {
                    $challenge->fresh()->update([
                        'status' => OtpChallengeStatus::Failed,
                    ]);
                }

                return false;
            }

            $challenge->update([
                'status' => OtpChallengeStatus::Consumed,
                'consumed_at' => Carbon::now(),
            ]);

            return true;
        });
    }
}
