<?php

namespace App\Models;

use App\Enums\OtpChallengeStatus;
use App\Enums\OtpPurpose;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property OtpPurpose $purpose
 * @property string $target
 * @property string $token
 * @property OtpChallengeStatus $status
 * @property Carbon $expires_at
 * @property int $attempts
 * @property int $max_attempts
 * @property int $resend_count
 * @property int $max_resends
 * @property Carbon|null $consumed_at
 * @property Carbon|null $invalidated_at
 * @property array<string, mixed>|null $request_context
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
class OtpChallenge extends Model
{
    /** @use HasFactory<\Database\Factories\OtpChallengeFactory> */
    use HasFactory;

    protected $guarded = [];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'purpose' => OtpPurpose::class,
            'status' => OtpChallengeStatus::class,
            'expires_at' => 'datetime',
            'consumed_at' => 'datetime',
            'invalidated_at' => 'datetime',
            'request_context' => 'array',
        ];
    }

    /**
     * @param  Builder<OtpChallenge>  $query
     */
    public function scopePending(Builder $query): void
    {
        $query->where('status', OtpChallengeStatus::Pending->value);
    }

    /**
     * @param  Builder<OtpChallenge>  $query
     */
    public function scopePurpose(Builder $query, OtpPurpose $purpose): void
    {
        $query->where('purpose', $purpose->value);
    }

    /**
     * @param  Builder<OtpChallenge>  $query
     */
    public function scopeTarget(Builder $query, string $target): void
    {
        $query->where('target', $target);
    }

    /**
     * @param  Builder<OtpChallenge>  $query
     */
    public function scopeNotExpired(Builder $query): void
    {
        $query->where('expires_at', '>', Carbon::now());
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function isConsumed(): bool
    {
        return $this->status === OtpChallengeStatus::Consumed;
    }

    public function isInvalidated(): bool
    {
        return $this->status === OtpChallengeStatus::Invalidated;
    }

    public function isPending(): bool
    {
        return $this->status === OtpChallengeStatus::Pending;
    }

    public function attemptsExceeded(): bool
    {
        return $this->attempts >= $this->max_attempts;
    }

    public function resendsExceeded(): bool
    {
        return $this->resend_count >= $this->max_resends;
    }
}
