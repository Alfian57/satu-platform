<?php

namespace Database\Factories;

use App\Enums\AffiliationMatchResult;
use App\Enums\AffiliationRequestStatus;
use App\Models\AffiliationRequest;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\User;
use App\Support\InstitutionalIdentifier;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<AffiliationRequest> */
class AffiliationRequestFactory extends Factory
{
    protected $model = AffiliationRequest::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        $nim = fake()->unique()->numerify('########');

        return [
            'institution_id' => Institution::factory(),
            'user_id' => User::factory(),
            'institution_membership_id' => function (array $attributes): int {
                return (int) InstitutionMembership::factory()->pending()->create([
                    'institution_id' => $attributes['institution_id'],
                    'user_id' => $attributes['user_id'],
                ])->getKey();
            },
            'roster_id' => null,
            'roster_row_id' => null,
            'nim_hash' => InstitutionalIdentifier::hash($nim),
            'nim' => $nim,
            'match_result' => AffiliationMatchResult::NoMatch,
            'status' => AffiliationRequestStatus::PendingReview,
            'version' => 1,
            'submitted_at' => now(),
        ];
    }
}
