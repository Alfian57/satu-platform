<?php

declare(strict_types=1);

namespace App\Actions\Gamification;

use App\Actions\Audit\AuditRecorder;
use App\Enums\ContributionReviewDecision;
use App\Enums\ContributionStatus;
use App\Models\Contribution;
use App\Models\ContributionReview;
use App\Models\Institution;
use App\Models\InstitutionRoster;
use App\Models\User;
use App\Models\XpLedgerEntry;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;
use LogicException;

final class AwardVerifiedContributionXp
{
    public const POLICY_VERSION = '1.0.0';

    public const REASON = 'verified_contribution';

    public const SOURCE_TYPE = Contribution::class;

    public function __construct(
        private readonly AuditRecorder $audit,
    ) {}

    /**
     * Award one immutable XP row for the approved current contribution version.
     *
     * The amount is an explicit policy input. When an event consumer does not
     * provide one, the configured baseline is used instead of reviewer input.
     */
    public function handle(
        Contribution $contribution,
        ?int $amount = null,
        ?string $semester = null,
        ?User $actor = null,
        ?string $reason = null,
    ): XpLedgerEntry {
        $amount = $this->validatedAmount(
            $amount ?? (int) config('gamification.verified_contribution_amount', 1),
        );
        $semester = $this->validatedSemester($semester);
        $reason = $this->validatedReason($reason);
        $policyVersion = (string) config('gamification.policy_version', self::POLICY_VERSION);

        return DB::transaction(function () use (
            $contribution,
            $amount,
            $semester,
            $actor,
            $reason,
            $policyVersion,
        ): XpLedgerEntry {
            $lockedContribution = Contribution::query()
                ->lockForUpdate()
                ->whereKey($contribution->getKey())
                ->firstOrFail();
            $lockedContribution->load(['currentVersion', 'project']);

            if (
                $lockedContribution->project === null
                || $lockedContribution->project->institution_id !== $lockedContribution->institution_id
            ) {
                throw new LogicException(
                    'Contribution project dan institution harus berada dalam tenant yang sama.',
                );
            }

            if ($lockedContribution->status !== ContributionStatus::Approved) {
                throw new InvalidArgumentException(
                    'XP hanya dapat diberikan untuk contribution yang sudah approved.',
                );
            }

            $version = $lockedContribution->currentVersion;

            if ($version === null) {
                throw new InvalidArgumentException(
                    'Contribution approved harus memiliki current version.',
                );
            }

            $approvedReview = ContributionReview::query()
                ->where('contribution_version_id', $version->getKey())
                ->where('decision', ContributionReviewDecision::Approved)
                ->first();

            if ($approvedReview === null) {
                throw new InvalidArgumentException(
                    'Contribution approved harus memiliki review approved.',
                );
            }

            $institution = Institution::query()
                ->whereKey($lockedContribution->institution_id)
                ->firstOrFail();
            $resolvedSemester = $semester ?? $this->activeSemester($institution);
            $idempotencyKey = $this->idempotencyKey(
                $lockedContribution,
                $version->version_number,
            );

            $existing = XpLedgerEntry::query()
                ->where('idempotency_key', $idempotencyKey)
                ->lockForUpdate()
                ->first();

            if ($existing !== null) {
                $this->assertMatchingExistingEntry(
                    $existing,
                    contribution: $lockedContribution,
                    semester: $resolvedSemester,
                    amount: $amount,
                    reason: $reason,
                    policyVersion: $policyVersion,
                );

                return $existing->load(['user', 'institution', 'source']);
            }

            $entry = XpLedgerEntry::query()->forceCreate([
                'user_id' => $lockedContribution->owner_id,
                'institution_id' => $lockedContribution->institution_id,
                'semester' => $resolvedSemester,
                'amount' => $amount,
                'reason' => $reason,
                'source_type' => self::SOURCE_TYPE,
                'source_id' => $lockedContribution->getKey(),
                'policy_version' => $policyVersion,
                'awarded_at' => now(),
                'reversal_reference_id' => null,
                'idempotency_key' => $idempotencyKey,
            ]);

            $this->audit->record(
                operation: 'xp.awarded',
                auditable: $entry,
                actor: $actor ?? $approvedReview->reviewer,
                institution: $institution,
                after: [
                    'ledger_entry_id' => $entry->getKey(),
                    'user_id' => $entry->user_id,
                    'semester' => $entry->semester,
                    'amount' => $entry->amount,
                    'reason' => $entry->reason,
                    'source_type' => $entry->source_type,
                    'source_id' => $entry->source_id,
                    'policy_version' => $entry->policy_version,
                    'idempotency_key' => $entry->idempotency_key,
                ],
                reason: $reason,
            );

            return $entry->refresh()->load(['user', 'institution', 'source']);
        }, attempts: 3);
    }

    /**
     * Alias used by command and job consumers.
     */
    public function execute(
        Contribution $contribution,
        ?int $amount = null,
        ?string $semester = null,
        ?User $actor = null,
        ?string $reason = null,
    ): XpLedgerEntry {
        return $this->handle($contribution, $amount, $semester, $actor, $reason);
    }

    /**
     * Alias that makes the domain operation explicit to callers.
     */
    public function award(
        Contribution $contribution,
        ?int $amount = null,
        ?string $semester = null,
        ?User $actor = null,
        ?string $reason = null,
    ): XpLedgerEntry {
        return $this->handle($contribution, $amount, $semester, $actor, $reason);
    }

    private function activeSemester(Institution $institution): string
    {
        $semester = InstitutionRoster::query()
            ->whereBelongsTo($institution)
            ->active()
            ->latest('activated_at')
            ->value('semester');

        if (! is_string($semester) || trim($semester) === '') {
            throw new InvalidArgumentException(
                'XP award membutuhkan active institution roster untuk menentukan semester.',
            );
        }

        return $semester;
    }

    private function idempotencyKey(Contribution $contribution, int $versionNumber): string
    {
        return $contribution->getKey().':'.$versionNumber;
    }

    private function validatedAmount(int $amount): int
    {
        if ($amount < 1) {
            throw new InvalidArgumentException('XP amount harus lebih besar dari nol.');
        }

        return $amount;
    }

    private function validatedSemester(?string $semester): ?string
    {
        if ($semester === null) {
            return null;
        }

        $semester = (string) Str::of($semester)->squish();

        if ($semester === '' || Str::length($semester) > 100) {
            throw new InvalidArgumentException('Semester XP wajib diisi dan maksimal 100 karakter.');
        }

        return $semester;
    }

    private function validatedReason(?string $reason): string
    {
        $reason = (string) Str::of($reason ?? self::REASON)->squish()->lower();

        if (
            $reason === ''
            || Str::length($reason) > 100
            || preg_match('/^[a-z0-9]+(?:[._:-][a-z0-9]+)*$/', $reason) !== 1
        ) {
            throw new InvalidArgumentException('XP reason harus berupa reason code canonical.');
        }

        return $reason;
    }

    private function assertMatchingExistingEntry(
        XpLedgerEntry $existing,
        Contribution $contribution,
        string $semester,
        int $amount,
        string $reason,
        string $policyVersion,
    ): void {
        if (
            $existing->user_id !== $contribution->owner_id
            || $existing->institution_id !== $contribution->institution_id
            || $existing->semester !== $semester
            || $existing->amount !== $amount
            || $existing->reason !== $reason
            || $existing->source_type !== self::SOURCE_TYPE
            || $existing->source_id !== $contribution->getKey()
            || $existing->policy_version !== $policyVersion
            || $existing->reversal_reference_id !== null
        ) {
            throw new LogicException(
                'XP idempotency key sudah terikat pada sumber atau policy yang berbeda.',
            );
        }
    }
}
