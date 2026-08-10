<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\RecruiterSavedCandidateFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $recruiter_organization_id
 * @property int $user_id
 * @property int $talent_candidate_projection_id
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property-read RecruiterOrganization $organization
 * @property-read User $user
 * @property-read TalentCandidateProjection $candidateProjection
 */
#[Guarded(['id', 'created_at', 'updated_at'])]
class RecruiterSavedCandidate extends Model
{
    /** @use HasFactory<RecruiterSavedCandidateFactory> */
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
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * @return BelongsTo<TalentCandidateProjection, $this>
     */
    public function candidateProjection(): BelongsTo
    {
        return $this->belongsTo(TalentCandidateProjection::class, 'talent_candidate_projection_id');
    }
}
