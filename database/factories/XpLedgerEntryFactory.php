<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Contribution;
use App\Models\Institution;
use App\Models\User;
use App\Models\XpLedgerEntry;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<XpLedgerEntry>
 */
class XpLedgerEntryFactory extends Factory
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
            'institution_id' => Institution::factory()->active(),
            'semester' => '2025/2026 Genap',
            'amount' => 1,
            'reason' => 'verified_contribution',
            'source_type' => (new Contribution)->getMorphClass(),
            'source_id' => fake()->numberBetween(1, 100000),
            'policy_version' => '1.0.0',
            'awarded_at' => now(),
            'reversal_reference_id' => null,
            'idempotency_key' => 'factory:'.Str::uuid()->toString(),
        ];
    }

    public function forContribution(Contribution $contribution, int $versionNumber = 1): static
    {
        return $this->state([
            'user_id' => $contribution->owner_id,
            'institution_id' => $contribution->institution_id,
            'source_type' => $contribution->getMorphClass(),
            'source_id' => $contribution->getKey(),
            'idempotency_key' => $contribution->getKey().':'.$versionNumber,
        ]);
    }

    public function reversalOf(XpLedgerEntry $entry): static
    {
        return $this->state([
            'user_id' => $entry->user_id,
            'institution_id' => $entry->institution_id,
            'semester' => $entry->semester,
            'amount' => $entry->amount,
            'reason' => 'abuse_review',
            'source_type' => $entry->source_type,
            'source_id' => $entry->source_id,
            'policy_version' => $entry->policy_version,
            'reversal_reference_id' => $entry->getKey(),
            'idempotency_key' => 'xp-reversal:'.$entry->getKey(),
            'awarded_at' => now(),
        ]);
    }
}
