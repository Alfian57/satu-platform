<?php

namespace App\Models;

use App\Enums\PhoneNumberStatus;
use Database\Factories\PhoneNumberFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property string $number
 * @property string $number_hash
 * @property string $masked
 * @property PhoneNumberStatus $status
 * @property Carbon|null $verified_at
 */
#[Guarded(['*'])]
#[Hidden(['number', 'number_hash'])]
class PhoneNumber extends Model
{
    /** @use HasFactory<PhoneNumberFactory> */
    use HasFactory;

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @param  Builder<PhoneNumber>  $query
     */
    public function scopeVerified(Builder $query): void
    {
        $query
            ->where('status', PhoneNumberStatus::Verified)
            ->whereNotNull('verified_at');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'number' => 'encrypted',
            'status' => PhoneNumberStatus::class,
            'verified_at' => 'datetime',
        ];
    }
}
