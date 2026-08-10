<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\RecruiterEntitlementScope;
use App\Enums\RecruiterEntitlementStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * Entitlement associated with a recruiter organization.
 *
 * @property int $id
 * @property int $recruiter_organization_id
 * @property RecruiterEntitlementScope $scope
 * @property RecruiterEntitlementStatus $status
 * @property Carbon $starts_at
 * @property Carbon|null $ends_at
 * @property int $issuer_id
 * @property string|null $reason
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
#[Fillable([
    'recruiter_organization_id',
    'scope',
    'status',
    'starts_at',
    'ends_at',
    'issuer_id',
    'reason',
])]
class RecruiterEntitlement extends Model
{
    /**
     * @return BelongsTo<RecruiterOrganization, $this>
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(RecruiterOrganization::class, 'recruiter_organization_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function issuer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'issuer_id');
    }

    /**
     * @return HasMany<RecruiterEntitlementLog, $this>
     */
    public function logs(): HasMany
    {
        return $this->hasMany(RecruiterEntitlementLog::class, 'recruiter_entitlement_id');
    }

    /**
     * Check if the entitlement is currently active at the given timestamp.
     */
    public function isActiveAt(?Carbon $at = null): bool
    {
        $now = $at ?? Carbon::now();

        if ($this->status !== RecruiterEntitlementStatus::Active) {
            return false;
        }

        if ($this->starts_at->isAfter($now)) {
            return false;
        }

        if ($this->ends_at !== null && $this->ends_at->isBefore($now)) {
            return false;
        }

        return true;
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'scope' => RecruiterEntitlementScope::class,
            'status' => RecruiterEntitlementStatus::class,
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
        ];
    }
}
