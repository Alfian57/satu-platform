<?php

namespace App\Models;

use App\Enums\SkillProficiency;
use Database\Factories\ProfileSkillFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $student_profile_id
 * @property int $skill_taxonomy_id
 * @property SkillProficiency $proficiency
 * @property array<string, mixed>|null $evidence_metadata
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
#[Guarded(['id', 'student_profile_id', 'skill_taxonomy_id', 'created_at', 'updated_at'])]
class ProfileSkill extends Model
{
    /** @use HasFactory<ProfileSkillFactory> */
    use HasFactory;

    /**
     * @return BelongsTo<StudentProfile, $this>
     */
    public function studentProfile(): BelongsTo
    {
        return $this->belongsTo(StudentProfile::class);
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
            'evidence_metadata' => 'array',
        ];
    }
}
