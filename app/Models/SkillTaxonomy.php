<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\SkillTaxonomyFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string $category
 * @property string|null $description
 * @property bool $is_verified
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
#[Guarded(['id', 'created_at', 'updated_at'])]
class SkillTaxonomy extends Model
{
    /** @use HasFactory<SkillTaxonomyFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_verified' => 'boolean',
        ];
    }

    /**
     * @return HasMany<ProfileSkill, $this>
     */
    public function profileSkills(): HasMany
    {
        return $this->hasMany(ProfileSkill::class);
    }

    /**
     * @return HasMany<ProfileInterest, $this>
     */
    public function profileInterests(): HasMany
    {
        return $this->hasMany(ProfileInterest::class);
    }

    /**
     * @return HasMany<ProjectRoleSkill, $this>
     */
    public function projectRoleSkills(): HasMany
    {
        return $this->hasMany(ProjectRoleSkill::class);
    }
}
