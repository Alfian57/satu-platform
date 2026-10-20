<?php

namespace App\Models;

use App\Concerns\InstitutionOwned;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $affiliation_request_id
 * @property int $institution_id
 * @property int $user_id
 * @property array{faculty: string|null, study_program: string|null, admission_year: int|null} $academic_profile
 */
#[Guarded(['*'])]
#[Hidden(['academic_profile'])]
class AffiliationProfileDraft extends Model implements InstitutionOwned
{
    /** @return BelongsTo<AffiliationRequest, $this> */
    public function affiliationRequest(): BelongsTo
    {
        return $this->belongsTo(AffiliationRequest::class);
    }

    /** @return BelongsTo<Institution, $this> */
    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function institutionId(): int
    {
        return $this->institution_id;
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'academic_profile' => 'encrypted:array',
        ];
    }
}
