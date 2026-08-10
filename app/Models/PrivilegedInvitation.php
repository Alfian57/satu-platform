<?php

namespace App\Models;

use App\Enums\InvitationStatus;
use Database\Factories\PrivilegedInvitationFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $institution_id
 * @property string $intended_role
 * @property string $phone
 * @property string $token_hash
 * @property InvitationStatus $status
 * @property Carbon $expires_at
 * @property string|null $delivery_status
 * @property int|null $issued_by
 * @property Carbon|null $accepted_at
 * @property int|null $accepted_by
 * @property Carbon|null $revoked_at
 * @property int|null $revoked_by
 * @property string|null $revoke_reason
 * @property string|null $audit_reference
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
class PrivilegedInvitation extends Model
{
    /** @use HasFactory<PrivilegedInvitationFactory> */
    use HasFactory;

    protected $guarded = [];

    /**
     * @return BelongsTo<Institution, $this>
     */
    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function issuer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'issued_by');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function acceptor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'accepted_by');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => InvitationStatus::class,
            'expires_at' => 'datetime',
            'accepted_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }

    /**
     * @param  Builder<PrivilegedInvitation>  $query
     */
    public function scopeIssued(Builder $query): void
    {
        $query->where('status', InvitationStatus::Issued->value);
    }

    /**
     * @param  Builder<PrivilegedInvitation>  $query
     */
    public function scopeNotExpired(Builder $query): void
    {
        $query->where('expires_at', '>', Carbon::now());
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function isIssued(): bool
    {
        return $this->status === InvitationStatus::Issued;
    }
}
