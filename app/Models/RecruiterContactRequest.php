<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\ContactRequestStatus;
use Database\Factories\RecruiterContactRequestFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $recruiter_organization_id
 * @property int $recruiter_user_id
 * @property int $talent_candidate_projection_id
 * @property int $candidate_user_id
 * @property string $purpose
 * @property string|null $message
 * @property ContactRequestStatus $status
 * @property Carbon|null $responded_at
 * @property Carbon $expires_at
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property-read RecruiterOrganization $organization
 * @property-read User $recruiterUser
 * @property-read User $candidateUser
 * @property-read TalentCandidateProjection $candidateProjection
 */
#[Guarded(['id', 'created_at', 'updated_at'])]
class RecruiterContactRequest extends Model
{
    /** @use HasFactory<RecruiterContactRequestFactory> */
    use HasFactory;

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
    public function recruiterUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recruiter_user_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function candidateUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'candidate_user_id');
    }

    /**
     * @return BelongsTo<TalentCandidateProjection, $this>
     */
    public function candidateProjection(): BelongsTo
    {
        return $this->belongsTo(TalentCandidateProjection::class, 'talent_candidate_projection_id');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => ContactRequestStatus::class,
            'responded_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }
}
