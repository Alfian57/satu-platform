<?php

declare(strict_types=1);

namespace App\Actions\Gamification;

use App\Actions\Audit\AuditRecorder;
use App\Models\User;
use App\Models\XpLedgerEntry;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use InvalidArgumentException;

final class ReverseXpAward
{
    public function __construct(
        private readonly AuditRecorder $audit,
    ) {}

    /**
     * Append one positive reversal row and preserve the original award.
     */
    public function handle(
        XpLedgerEntry $entry,
        User $actor,
        string $reason = 'abuse_review',
    ): XpLedgerEntry {
        Gate::forUser($actor)->authorize('reverse', $entry);
        $reason = $this->validatedReason($reason);

        return DB::transaction(function () use ($entry, $actor, $reason): XpLedgerEntry {
            $original = XpLedgerEntry::query()
                ->lockForUpdate()
                ->whereKey($entry->getKey())
                ->firstOrFail();

            if ($original->isReversal()) {
                throw new InvalidArgumentException('Reversal entry tidak dapat direverse kembali.');
            }

            $existing = XpLedgerEntry::query()
                ->where('reversal_reference_id', $original->getKey())
                ->lockForUpdate()
                ->first();

            if ($existing !== null) {
                if ($existing->reason !== $reason) {
                    throw new InvalidArgumentException(
                        'XP award hanya dapat memiliki satu reversal dengan reason yang konsisten.',
                    );
                }

                return $existing->load(['user', 'institution', 'source', 'reversalReference']);
            }

            $reversal = XpLedgerEntry::query()->forceCreate([
                'user_id' => $original->user_id,
                'institution_id' => $original->institution_id,
                'semester' => $original->semester,
                'amount' => $original->amount,
                'reason' => $reason,
                'source_type' => $original->source_type,
                'source_id' => $original->source_id,
                'policy_version' => $original->policy_version,
                'awarded_at' => now(),
                'reversal_reference_id' => $original->getKey(),
                'idempotency_key' => 'xp-reversal:'.$original->getKey(),
            ]);

            $this->audit->record(
                operation: 'xp.reversed',
                auditable: $reversal,
                actor: $actor,
                institution: $original->institution,
                before: [
                    'ledger_entry_id' => $original->getKey(),
                    'net_effect' => $original->amount,
                ],
                after: [
                    'reversal_entry_id' => $reversal->getKey(),
                    'reversal_reference_id' => $original->getKey(),
                    'amount' => $reversal->amount,
                    'reason' => $reversal->reason,
                    'policy_version' => $reversal->policy_version,
                ],
                reason: $reason,
            );

            return $reversal->refresh()->load([
                'user',
                'institution',
                'source',
                'reversalReference',
            ]);
        }, attempts: 3);
    }

    public function execute(
        XpLedgerEntry $entry,
        User $actor,
        string $reason = 'abuse_review',
    ): XpLedgerEntry {
        return $this->handle($entry, $actor, $reason);
    }

    public function reverse(
        XpLedgerEntry $entry,
        User $actor,
        string $reason = 'abuse_review',
    ): XpLedgerEntry {
        return $this->handle($entry, $actor, $reason);
    }

    private function validatedReason(string $reason): string
    {
        $reason = (string) Str::of($reason)->squish()->lower();

        if (
            $reason === ''
            || Str::length($reason) > 100
            || preg_match('/^[a-z0-9]+(?:[._:-][a-z0-9]+)*$/', $reason) !== 1
        ) {
            throw new InvalidArgumentException('Reversal reason harus berupa reason code canonical.');
        }

        return $reason;
    }
}
