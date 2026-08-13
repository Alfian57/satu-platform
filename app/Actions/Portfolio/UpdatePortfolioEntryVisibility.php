<?php

declare(strict_types=1);

namespace App\Actions\Portfolio;

use App\Actions\Audit\AuditRecorder;
use App\Enums\PortfolioVisibility;
use App\Models\Institution;
use App\Models\PortfolioEntry;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

final class UpdatePortfolioEntryVisibility
{
    public function __construct(
        private readonly AuditRecorder $audit,
        private readonly EnsurePortfolioEntryIsFresh $ensureFresh,
        private readonly RebuildTalentCandidateProjection $rebuildProjection,
    ) {}

    /**
     * Update one entry without changing global recruiter discoverability.
     *
     * @param  array<string, mixed>  $data
     */
    public function handle(User $actor, PortfolioEntry $portfolioEntry, array $data): PortfolioEntry
    {
        Gate::forUser($actor)->authorize('update', $portfolioEntry);

        return DB::transaction(function () use ($actor, $portfolioEntry, $data): PortfolioEntry {
            $entry = PortfolioEntry::query()
                ->lockForUpdate()
                ->whereKey($portfolioEntry->getKey())
                ->with(['owner', 'institution'])
                ->firstOrFail();
            Gate::forUser($actor)->authorize('update', $entry);
            $this->ensureFresh->handle($entry, $data['expected_updated_at'] ?? null);

            $visibility = PortfolioVisibility::tryFrom((string) ($data['visibility'] ?? ''));

            if ($visibility === null) {
                throw ValidationException::withMessages([
                    'visibility' => 'Visibility portfolio tidak valid.',
                ]);
            }

            $previousVisibility = $entry->visibility;
            $before = [
                'visibility' => $previousVisibility->value,
                'withdrawn' => $entry->withdrawn_at !== null,
            ];
            $entry->forceFill(['visibility' => $visibility]);

            if ($visibility === PortfolioVisibility::Private) {
                if ($previousVisibility !== PortfolioVisibility::Private && $entry->withdrawn_at === null) {
                    $entry->forceFill([
                        'withdrawn_at' => now(),
                        'withdrawal_reason' => 'visibility_private',
                    ]);
                }
            } elseif (
                $previousVisibility !== $visibility
                || $entry->withdrawn_at !== null
                || $entry->published_at === null
            ) {
                $entry->forceFill([
                    'published_at' => $entry->published_at ?? now(),
                    'withdrawn_at' => null,
                    'withdrawal_reason' => null,
                ]);
            }

            $changed = $entry->isDirty();

            if ($changed) {
                $entry->save();
                $this->audit->record(
                    operation: 'portfolio_entry.visibility_updated',
                    auditable: $entry,
                    actor: $actor,
                    institution: $entry->institution,
                    before: $before,
                    after: [
                        'visibility' => $entry->visibility->value,
                        'withdrawn' => $entry->withdrawn_at !== null,
                    ],
                    reason: $entry->withdrawn_at === null
                        ? 'Portfolio entry visibility published by its owner.'
                        : 'Portfolio entry withdrawn by its owner.',
                );
            }

            $this->rebuildProjection->handle(
                User::query()->findOrFail($entry->user_id),
                Institution::query()->findOrFail($entry->institution_id),
            );

            return $entry->refresh()->load([
                'contribution:id,institution_id,owner_id,status,current_version_id',
                'sourceVersion:id,contribution_id,version_number',
            ]);
        }, attempts: 3);
    }
}
