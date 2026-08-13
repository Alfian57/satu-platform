<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\PortfolioVerificationLevel;
use App\Enums\PortfolioVisibility;
use App\Models\Contribution;
use App\Models\ContributionVersion;
use App\Models\PortfolioEntry;
use Illuminate\Database\Eloquent\Factories\Factory;
use LogicException;

/**
 * @extends Factory<PortfolioEntry>
 */
class PortfolioEntryFactory extends Factory
{
    protected $model = PortfolioEntry::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'contribution_id' => Contribution::factory()->approved(),
            'institution_id' => function (array $attributes): int {
                return $this->resolveContribution($attributes)->institution_id;
            },
            'user_id' => function (array $attributes): int {
                return $this->resolveContribution($attributes)->owner_id;
            },
            'contribution_version_id' => function (array $attributes): int {
                $contribution = $this->resolveContribution($attributes);
                $version = ContributionVersion::factory()
                    ->forContribution($contribution)
                    ->create();
                $contribution->forceFill(['current_version_id' => $version->getKey()])->save();

                return $version->getKey();
            },
            'title' => function (array $attributes): string {
                return $this->resolveContribution($attributes)
                    ->load('project:id,title')
                    ->project
                    ->title;
            },
            'summary' => fake()->paragraph(),
            'verification_level' => PortfolioVerificationLevel::InstitutionVerified,
            'visibility' => PortfolioVisibility::Private,
            'published_at' => null,
            'withdrawn_at' => null,
            'withdrawal_reason' => null,
        ];
    }

    public function institutionVisible(): static
    {
        return $this->state([
            'visibility' => PortfolioVisibility::Institution,
            'published_at' => now(),
        ]);
    }

    public function recruiterVisible(): static
    {
        return $this->state([
            'visibility' => PortfolioVisibility::Recruiter,
            'published_at' => now(),
        ]);
    }

    public function publicVisible(): static
    {
        return $this->state([
            'visibility' => PortfolioVisibility::Public,
            'published_at' => now(),
        ]);
    }

    public function withdrawn(): static
    {
        return $this->state([
            'withdrawn_at' => now(),
            'withdrawal_reason' => 'visibility_private',
        ]);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function resolveContribution(array $attributes): Contribution
    {
        $value = $attributes['contribution_id'] ?? null;

        if ($value instanceof Contribution) {
            return $value;
        }

        if (is_int($value) || (is_string($value) && ctype_digit($value))) {
            return Contribution::query()->findOrFail((int) $value);
        }

        throw new LogicException('Portfolio entry factory requires a contribution source.');
    }
}
