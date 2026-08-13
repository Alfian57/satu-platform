<?php

declare(strict_types=1);

namespace App\Actions\Portfolio;

use App\Actions\Audit\AuditRecorder;
use App\Enums\ContributionReviewDecision;
use App\Enums\ContributionStatus;
use App\Enums\PortfolioVerificationLevel;
use App\Events\ContributionApproved;
use App\Models\Contribution;
use App\Models\ContributionReview;
use App\Models\Institution;
use App\Models\PortfolioEntry;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use LogicException;

final class SyncApprovedPortfolioEntry
{
    public function __construct(
        private readonly AuditRecorder $audit,
    ) {}

    public function handle(ContributionApproved $event): ?PortfolioEntry
    {
        return DB::transaction(function () use ($event): ?PortfolioEntry {
            $contribution = Contribution::query()
                ->lockForUpdate()
                ->whereKey($event->contributionId)
                ->first();

            if (
                $contribution === null
                || $contribution->institution_id !== $event->institutionId
                || $contribution->status !== ContributionStatus::Approved
                || $contribution->current_version_id !== $event->contributionVersionId
            ) {
                return null;
            }

            $contribution->load([
                'project:id,title',
                'currentVersion:id,contribution_id,version_number,summary',
            ]);
            $version = $contribution->currentVersion;

            if ($version === null) {
                return null;
            }

            $approvedReviewExists = ContributionReview::query()
                ->whereKey($event->reviewId)
                ->where('contribution_version_id', $version->getKey())
                ->where('decision', ContributionReviewDecision::Approved->value)
                ->exists();

            if (! $approvedReviewExists) {
                return null;
            }

            $institution = Institution::query()
                ->whereKey($contribution->institution_id)
                ->firstOrFail();
            $entry = PortfolioEntry::query()
                ->where('contribution_id', $contribution->getKey())
                ->lockForUpdate()
                ->first();

            if (
                $entry !== null
                && (
                    $entry->institution_id !== $contribution->institution_id
                    || $entry->user_id !== $contribution->owner_id
                )
            ) {
                throw new LogicException('Portfolio entry ownership does not match its contribution source.');
            }

            $attributes = [
                'institution_id' => $contribution->institution_id,
                'user_id' => $contribution->owner_id,
                'contribution_id' => $contribution->getKey(),
                'contribution_version_id' => $version->getKey(),
                'title' => $contribution->project->title,
                'summary' => $version->summary,
                'verification_level' => PortfolioVerificationLevel::InstitutionVerified,
            ];
            $before = [];

            if ($entry === null) {
                $entry = PortfolioEntry::query()->forceCreate([
                    ...$attributes,
                    'visibility' => 'private',
                    'published_at' => null,
                    'withdrawn_at' => null,
                    'withdrawal_reason' => null,
                ]);
                $changed = true;
            } else {
                $before = [
                    'source_version_id' => $entry->contribution_version_id,
                    'visibility' => $entry->visibility->value,
                    'withdrawn' => $entry->withdrawn_at !== null,
                ];
                $entry->forceFill($attributes);
                $changed = $entry->isDirty();

                if ($changed) {
                    $entry->save();
                }
            }

            if ($changed) {
                $actor = User::query()->find($event->reviewerId);
                $this->audit->record(
                    operation: 'portfolio_entry.synced',
                    auditable: $entry,
                    actor: $actor,
                    institution: $institution,
                    before: $before,
                    after: [
                        'source_version_id' => $entry->contribution_version_id,
                        'verification_level' => $entry->verification_level->value,
                        'visibility' => $entry->visibility->value,
                        'withdrawn' => $entry->withdrawn_at !== null,
                    ],
                    reason: 'Approved contribution became a verified portfolio entry.',
                );
            }

            return $entry->refresh()->load([
                'contribution:id,institution_id,owner_id,status,current_version_id',
                'sourceVersion:id,contribution_id,version_number',
            ]);
        }, attempts: 3);
    }
}
