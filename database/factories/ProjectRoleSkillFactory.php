<?php

namespace Database\Factories;

use App\Enums\SkillProficiency;
use App\Models\ProjectRole;
use App\Models\ProjectRoleSkill;
use App\Models\SkillTaxonomy;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProjectRoleSkill>
 */
class ProjectRoleSkillFactory extends Factory
{
    protected $model = ProjectRoleSkill::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'project_role_id' => ProjectRole::factory(),
            'skill_taxonomy_id' => SkillTaxonomy::factory(),
            'proficiency' => SkillProficiency::Intermediate,
        ];
    }
}
