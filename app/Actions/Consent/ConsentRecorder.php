<?php

namespace App\Actions\Consent;

use App\Models\ConsentRecord;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;
use LogicException;

class ConsentRecorder
{
    /**
     * Append a grant event or return an identical current grant.
     */
    public function grant(
        User $user,
        string $purpose,
        string $policyVersion,
        string $source,
    ): ConsentRecord {
        return $this->record(
            $user,
            $purpose,
            $policyVersion,
            $source,
            true,
        );
    }

    /**
     * Append a withdrawal event or return an identical current withdrawal.
     */
    public function withdraw(
        User $user,
        string $purpose,
        string $policyVersion,
        string $source,
    ): ConsentRecord {
        return $this->record(
            $user,
            $purpose,
            $policyVersion,
            $source,
            false,
        );
    }

    public function current(User $user, string $purpose): ?ConsentRecord
    {
        $purpose = $this->validatedIdentifier($purpose, 'purpose');

        return ConsentRecord::query()
            ->forUser($user)
            ->forPurpose($purpose)
            ->latestEvent()
            ->first();
    }

    private function record(
        User $user,
        string $purpose,
        string $policyVersion,
        string $source,
        bool $grant,
    ): ConsentRecord {
        $purpose = $this->validatedIdentifier($purpose, 'purpose');
        $policyVersion = $this->validatedIdentifier($policyVersion, 'policy version');
        $source = $this->validatedIdentifier($source, 'source');

        return DB::transaction(function () use (
            $user,
            $purpose,
            $policyVersion,
            $source,
            $grant,
        ): ConsentRecord {
            $lockedUser = User::query()
                ->lockForUpdate()
                ->whereKey($user->getKey())
                ->first();

            if (
                $lockedUser === null
                || ! $user->exists
                || $user->isDirty($user->getKeyName())
            ) {
                throw new InvalidArgumentException('Consent subject must be a persisted user.');
            }

            $current = ConsentRecord::query()
                ->forUser($lockedUser)
                ->forPurpose($purpose)
                ->latestEvent()
                ->first();

            if ($this->isIdenticalCurrentEvent($current, $grant, $policyVersion, $source)) {
                return $current;
            }

            if (! $grant && ($current === null || ! $current->isGrant())) {
                throw new LogicException('Consent cannot be withdrawn without a current grant.');
            }

            $eventAt = now();

            return ConsentRecord::query()->forceCreate([
                'user_id' => $lockedUser->getKey(),
                'purpose' => $purpose,
                'policy_version' => $policyVersion,
                'source' => $source,
                'granted_at' => $grant ? $eventAt : null,
                'withdrawn_at' => $grant ? null : $eventAt,
                'occurred_at' => $eventAt,
            ]);
        }, attempts: 3);
    }

    private function isIdenticalCurrentEvent(
        ?ConsentRecord $current,
        bool $grant,
        string $policyVersion,
        string $source,
    ): bool {
        return $current !== null
            && $current->isGrant() === $grant
            && $current->policy_version === $policyVersion
            && $current->source === $source;
    }

    private function validatedIdentifier(string $value, string $field): string
    {
        $value = trim($value);

        if (
            $value === ''
            || Str::length($value) > 100
            || preg_match('/^[a-z0-9]+(?:[._:-][a-z0-9]+)*$/', $value) !== 1
        ) {
            throw new InvalidArgumentException("Consent {$field} must be a bounded canonical identifier.");
        }

        return $value;
    }
}
