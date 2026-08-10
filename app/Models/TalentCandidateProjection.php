<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\TalentCandidateProjectionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Recruiter-safe talent candidate portfolio projection.
 *
 * @property int $id
 * @property int $user_id
 * @property int $institution_id
 * @property string|null $headline
 * @property string|null $bio
 * @property array<string>|null $skills
 * @property array<string>|null $badges
 * @property array<string|array<string, mixed>>|null $contributions
 * @property bool $is_visible
 * @property string $availability_status
 * @property Carbon|null $verified_at
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
#[Fillable([
    'user_id',
    'institution_id',
    'headline',
    'bio',
    'skills',
    'badges',
    'contributions',
    'is_visible',
    'availability_status',
    'verified_at',
])]
class TalentCandidateProjection extends Model
{
    /** @use HasFactory<TalentCandidateProjectionFactory> */
    use HasFactory;

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * @return BelongsTo<Institution, $this>
     */
    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class, 'institution_id');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'skills' => 'array',
            'badges' => 'array',
            'contributions' => 'array',
            'is_visible' => 'boolean',
            'verified_at' => 'datetime',
        ];
    }
}
