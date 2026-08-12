<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Attachment;
use App\Models\ContributionEvidence;
use App\Models\ContributionVersion;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<ContributionEvidence> */
class ContributionEvidenceFactory extends Factory
{
    protected $model = ContributionEvidence::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'contribution_version_id' => ContributionVersion::factory(),
            'attachment_id' => Attachment::factory()->evidence(),
            'source_label' => 'evidence.pdf',
            'notes' => fake()->optional()->sentence(),
        ];
    }

    public function forVersion(ContributionVersion $version): static
    {
        return $this->state([
            'contribution_version_id' => $version->getKey(),
            'attachment_id' => Attachment::factory()
                ->evidence()
                ->for($version->contribution->project),
        ]);
    }
}
