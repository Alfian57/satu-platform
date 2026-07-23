<?php

namespace Database\Factories;

use App\Enums\InstitutionMembershipReviewOutcome;
use App\Enums\InstitutionMembershipRole;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\InstitutionMembershipVerificationMethod;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<InstitutionMembership>
 */
class InstitutionMembershipFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'institution_id' => Institution::factory(),
            'role' => InstitutionMembershipRole::Student,
            'status' => InstitutionMembershipStatus::Unverified,
            'institutional_identifier' => null,
            'requested_at' => null,
            'reviewed_at' => null,
            'reviewed_by_id' => null,
            'verified_at' => null,
            'verification_method' => null,
            'last_review_outcome' => null,
        ];
    }

    public function student(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => InstitutionMembershipRole::Student,
        ]);
    }

    public function campusAdmin(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => InstitutionMembershipRole::CampusAdmin,
        ]);
    }

    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => InstitutionMembershipStatus::Unverified,
            'requested_at' => null,
            'reviewed_at' => null,
            'reviewed_by_id' => null,
            'verified_at' => null,
            'verification_method' => null,
            'last_review_outcome' => null,
        ]);
    }

    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => InstitutionMembershipStatus::Pending,
            'requested_at' => now(),
            'reviewed_at' => null,
            'reviewed_by_id' => null,
            'verified_at' => null,
            'verification_method' => null,
            'last_review_outcome' => null,
        ]);
    }

    public function verifiedByApprovedDomain(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => InstitutionMembershipStatus::Verified,
            'requested_at' => now(),
            'reviewed_at' => null,
            'reviewed_by_id' => null,
            'verified_at' => now(),
            'verification_method' => InstitutionMembershipVerificationMethod::ApprovedDomain,
            'last_review_outcome' => null,
        ]);
    }

    public function verifiedByCampusAdmin(?User $reviewer = null): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => InstitutionMembershipStatus::Verified,
            'requested_at' => now(),
            'reviewed_at' => now(),
            'reviewed_by_id' => $reviewer?->getKey() ?? User::factory(),
            'verified_at' => now(),
            'verification_method' => InstitutionMembershipVerificationMethod::CampusAdminReview,
            'last_review_outcome' => InstitutionMembershipReviewOutcome::Approved,
        ]);
    }

    public function rejected(?User $reviewer = null): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => InstitutionMembershipStatus::Unverified,
            'requested_at' => now()->subDay(),
            'reviewed_at' => now(),
            'reviewed_by_id' => $reviewer?->getKey() ?? User::factory(),
            'verified_at' => null,
            'verification_method' => null,
            'last_review_outcome' => InstitutionMembershipReviewOutcome::Rejected,
        ]);
    }

    public function suspended(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => InstitutionMembershipStatus::Suspended,
            'requested_at' => now()->subDays(2),
            'reviewed_at' => null,
            'reviewed_by_id' => null,
            'verified_at' => now()->subDay(),
            'verification_method' => InstitutionMembershipVerificationMethod::ApprovedDomain,
            'last_review_outcome' => null,
        ]);
    }
}
