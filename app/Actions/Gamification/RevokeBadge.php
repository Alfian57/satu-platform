<?php

declare(strict_types=1);

namespace App\Actions\Gamification;

use App\Actions\Audit\AuditRecorder;
use App\Models\BadgeAward;
use App\Models\BadgeRevocation;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use InvalidArgumentException;

final class RevokeBadge
{
    public function __construct(
        private readonly AuditRecorder $audit,
    ) {}

    public function execute(
        User $actor,
        BadgeAward $award,
        string $reason,
    ): BadgeRevocation {
        Gate::forUser($actor)->authorize('revoke', $award);
        $reason = $this->validatedReason($reason);

        return DB::transaction(function () use ($actor, $award, $reason): BadgeRevocation {
            $lockedAward = BadgeAward::query()
                ->lockForUpdate()
                ->whereKey($award->getKey())
                ->firstOrFail();
            $lockedAward->load(['institution', 'definition', 'ruleVersion']);

            $existing = BadgeRevocation::query()
                ->where('badge_award_id', $lockedAward->getKey())
                ->lockForUpdate()
                ->first();

            if ($existing !== null) {
                if ($existing->reason !== $reason) {
                    throw new InvalidArgumentException(
                        'Badge hanya dapat memiliki satu revocation dengan reason yang konsisten.',
                    );
                }

                return $existing->load(['award', 'actor']);
            }

            $revokedAt = now();
            $revocation = BadgeRevocation::query()->forceCreate([
                'badge_award_id' => $lockedAward->getKey(),
                'actor_id' => $actor->getKey(),
                'reason' => $reason,
                'revoked_at' => $revokedAt,
                'created_at' => $revokedAt,
            ]);

            $lockedAward->forceFill(['revoked_at' => $revokedAt])->save();

            $this->audit->record(
                operation: 'badge.revoked',
                auditable: $lockedAward,
                actor: $actor,
                institution: $lockedAward->institution,
                before: ['revoked_at' => null],
                after: [
                    'badge_award_id' => $lockedAward->getKey(),
                    'revocation_id' => $revocation->getKey(),
                    'revoked_at' => $revokedAt->toIso8601String(),
                ],
                reason: $reason,
            );

            return $revocation->refresh()->load(['award', 'actor']);
        }, attempts: 3);
    }

    public function handle(User $actor, BadgeAward $award, string $reason): BadgeRevocation
    {
        return $this->execute($actor, $award, $reason);
    }

    private function validatedReason(string $reason): string
    {
        $reason = (string) Str::of($reason)->squish();

        if ($reason === '' || Str::length($reason) > 1000) {
            throw new InvalidArgumentException('Alasan pencabutan badge wajib diisi dan maksimal 1000 karakter.');
        }

        return $reason;
    }
}
