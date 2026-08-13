<?php

declare(strict_types=1);

namespace App\Actions\Portfolio;

use App\Actions\Audit\AuditRecorder;
use App\Enums\PortfolioVisibility;
use App\Models\Institution;
use App\Models\PortfolioEntry;
use App\Models\StudentProfile;
use App\Models\TalentCandidateProjection;
use App\Models\User;
use App\Support\Portfolio\PortfolioEntrySerializer;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

final class RebuildTalentCandidateProjection
{
    public function __construct(
        private readonly AuditRecorder $audit,
        private readonly PortfolioEntrySerializer $serializer,
    ) {}

    /**
     * Rebuild one tenant-scoped recruiter projection from approved visible entries.
     */
    public function handle(User $targetUser, Institution $institution): ?TalentCandidateProjection
    {
        return DB::transaction(function () use ($targetUser, $institution): ?TalentCandidateProjection {
            $profile = StudentProfile::query()
                ->where('user_id', $targetUser->getKey())
                ->where('institution_id', $institution->getKey())
                ->withCount('availabilityWindows')
                ->first();

            if ($profile === null) {
                return null;
            }

            $profile->load([
                'skills' => function (Relation $query): void {
                    $query
                        ->select(['id', 'student_profile_id', 'skill_taxonomy_id'])
                        ->with('taxonomy:id,name');
                },
            ]);

            $entries = PortfolioEntry::query()
                ->where('user_id', $targetUser->getKey())
                ->forInstitution($institution)
                ->visibleToRecruiter()
                ->with([
                    'sourceVersion:id,contribution_id,version_number',
                    'contribution:id,institution_id,owner_id,project_id,status,current_version_id',
                    'contribution.project:id,title',
                ])
                ->latest('published_at')
                ->latest('id')
                ->get();

            $portfolioVisibilityAllowsRecruiter = in_array(
                $profile->portfolio_visibility,
                [PortfolioVisibility::Recruiter, PortfolioVisibility::Public],
                true,
            );
            $canDiscover = $profile->recruiter_discoverable
                && $portfolioVisibilityAllowsRecruiter;
            $visibleEntries = $canDiscover ? $entries : collect();

            $payload = [
                'headline' => $profile->study_program ?? $visibleEntries->first()?->title,
                'bio' => $profile->bio,
                'skills' => $profile->skills
                    ->map(static fn ($skill): ?string => $skill->taxonomy?->name)
                    ->filter()
                    ->values()
                    ->all(),
                'badges' => [],
                'contributions' => $visibleEntries
                    ->map(fn (PortfolioEntry $entry): array => $this->serializer->recruiter($entry))
                    ->values()
                    ->all(),
                'is_visible' => $canDiscover && $visibleEntries->isNotEmpty(),
                'availability_status' => $profile->availability_windows_count > 0
                    ? 'available'
                    : 'not_available',
                'verified_at' => $this->latestPublishedAt($visibleEntries),
            ];

            $projection = TalentCandidateProjection::query()
                ->where('user_id', $targetUser->getKey())
                ->where('institution_id', $institution->getKey())
                ->lockForUpdate()
                ->first();

            $before = $projection === null ? [] : [
                'is_visible' => $projection->is_visible,
                'contributions_count' => is_array($projection->contributions)
                    ? count($projection->contributions)
                    : 0,
                'availability_status' => $projection->availability_status,
            ];

            if ($projection === null) {
                $projection = TalentCandidateProjection::query()->forceCreate([
                    'user_id' => $targetUser->getKey(),
                    'institution_id' => $institution->getKey(),
                    ...$payload,
                ]);
                $changed = true;
            } else {
                $projection->forceFill($payload);
                $changed = $projection->isDirty();

                if ($changed) {
                    $projection->save();
                }
            }

            if ($changed) {
                $this->audit->record(
                    operation: 'talent_candidate_projection.synced',
                    auditable: $projection,
                    institution: $institution,
                    before: $before,
                    after: [
                        'is_visible' => $projection->is_visible,
                        'contributions_count' => count($payload['contributions']),
                        'availability_status' => $projection->availability_status,
                    ],
                    reason: 'Projection rebuilt from approved, recruiter-visible portfolio entries.',
                );
            }

            return $projection->refresh()->load('institution');
        }, attempts: 3);
    }

    public function execute(User $targetUser, Institution $institution): ?TalentCandidateProjection
    {
        return $this->handle($targetUser, $institution);
    }

    /**
     * @param  Collection<int, PortfolioEntry>  $entries
     */
    private function latestPublishedAt(Collection $entries): ?CarbonInterface
    {
        return $entries
            ->filter(static fn (PortfolioEntry $entry): bool => $entry->published_at !== null)
            ->sortByDesc(static fn (PortfolioEntry $entry): int => $entry->published_at?->getTimestamp() ?? 0)
            ->first()?->published_at;
    }
}
