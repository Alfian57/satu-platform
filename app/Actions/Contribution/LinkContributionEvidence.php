<?php

declare(strict_types=1);

namespace App\Actions\Contribution;

use App\Models\Contribution;
use App\Models\User;

final class LinkContributionEvidence
{
    public function __construct(
        private readonly ReviseContribution $reviseContribution,
    ) {}

    /**
     * Append evidence to the current draft as a new immutable version.
     *
     * @param  list<int|string>  $evidence
     */
    public function handle(User $actor, Contribution $contribution, array $evidence, string $expectedRevision): Contribution
    {
        return $this->reviseContribution->handle($actor, $contribution, [
            'evidence' => array_values(array_unique([...($contribution->currentVersion?->evidence->pluck('attachment_id')->all() ?? []), ...$evidence])),
            'expected_revision' => $expectedRevision,
        ]);
    }
}
