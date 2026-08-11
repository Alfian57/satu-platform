<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\SkillProficiency;
use Database\Factories\ProjectRoleSkillFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Minimum verified taxonomy proficiency required by a project role.
 *
 * @property int $id
 * @property int $project_role_id
 * @property int $skill_taxonomy_id
 * @property SkillProficiency $proficiency
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
#[Guarded(['id', 'project_role_id', 'skill_taxonomy_id', 'created_at', 'updated_at'])]
class ProjectRoleSkill extends Model
{
    /** @use HasFactory<ProjectRoleSkillFactory> */
    use HasFactory;

    /**
     * @return BelongsTo<ProjectRole, $this>
     */
    public function projectRole(): BelongsTo
    {
        return $this->belongsTo(ProjectRole::class);
    }

    /**
     * @return BelongsTo<SkillTaxonomy, $this>
     */
    public function taxonomy(): BelongsTo
    {
        return $this->belongsTo(SkillTaxonomy::class, 'skill_taxonomy_id');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'proficiency' => SkillProficiency::class,
        ];
    }
}
