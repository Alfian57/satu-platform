<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\ProjectRoleFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * Required project role with an explicit member capacity.
 *
 * @property int $id
 * @property int $project_id
 * @property string $title
 * @property string|null $description
 * @property int $capacity
 * @property bool|null $accepts_beginners
 * @property string|null $selection_criteria
 * @property int $occupied_count
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
#[Guarded(['id', 'project_id', 'created_at', 'updated_at'])]
class ProjectRole extends Model
{
    /** @use HasFactory<ProjectRoleFactory> */
    use HasFactory;

    /**
     * @return BelongsTo<Project, $this>
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * @return HasMany<ProjectRoleSkill, $this>
     */
    public function skills(): HasMany
    {
        return $this->hasMany(ProjectRoleSkill::class);
    }

    /** @return HasMany<TeamMembership, $this> */
    public function teamMemberships(): HasMany
    {
        return $this->hasMany(TeamMembership::class);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'capacity' => 'integer',
            'accepts_beginners' => 'boolean',
        ];
    }
}
