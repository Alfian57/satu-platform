<?php

namespace App\Models;

use App\Enums\RecruiterOrganizationStatus;
use Database\Factories\RecruiterOrganizationFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * A verified organization that can hold recruiter memberships.
 *
 * @property int $id
 * @property string $name
 * @property string|null $industry
 * @property string|null $website
 * @property array<string, mixed>|null $evidence_metadata
 * @property RecruiterOrganizationStatus $status
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
#[Guarded(['id', 'created_at', 'updated_at'])]
class RecruiterOrganization extends Model
{
    /** @use HasFactory<RecruiterOrganizationFactory> */
    use HasFactory;

    /**
     * @var array<string, mixed>
     */
    protected $attributes = [
        'status' => RecruiterOrganizationStatus::Pending->value,
    ];

    /**
     * @return HasMany<RecruiterMembership, $this>
     */
    public function memberships(): HasMany
    {
        return $this->hasMany(RecruiterMembership::class);
    }

    /**
     * @return HasMany<RecruiterVerificationReview, $this>
     */
    public function verificationReviews(): HasMany
    {
        return $this->hasMany(RecruiterVerificationReview::class);
    }

    /**
     * @return HasMany<RecruiterEntitlement, $this>
     */
    public function entitlements(): HasMany
    {
        return $this->hasMany(RecruiterEntitlement::class);
    }

    /**
     * @return HasMany<RecruiterVerificationReview, $this>
     */
    public function reviews(): HasMany
    {
        return $this->verificationReviews();
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => RecruiterOrganizationStatus::class,
            'evidence_metadata' => 'array',
        ];
    }
}
