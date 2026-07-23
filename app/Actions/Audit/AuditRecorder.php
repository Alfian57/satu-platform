<?php

namespace App\Actions\Audit;

use App\Concerns\InstitutionOwned;
use App\Models\AuditLog;
use App\Models\Institution;
use App\Models\User;
use App\Support\AuditDataRedactor;
use App\Support\AuditRequestContext;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use InvalidArgumentException;

class AuditRecorder
{
    public function __construct(
        private readonly AuditDataRedactor $redactor,
        private readonly AuditRequestContext $requestContext,
    ) {}

    /**
     * @param  array<string, mixed>  $before
     * @param  array<string, mixed>  $after
     */
    public function record(
        string $operation,
        ?Model $auditable = null,
        ?User $actor = null,
        ?Institution $institution = null,
        array $before = [],
        array $after = [],
        ?string $reason = null,
        ?Request $request = null,
    ): AuditLog {
        $operation = $this->validatedIdentifier($operation, 'operation');
        $institution = $this->persistedInstitution($institution);
        $actor = $this->persistedActor($actor);
        $auditable = $this->persistedAuditable($auditable, $institution);
        $reason = $this->validatedReason($reason);

        $beforeSummary = $this->redactor->redact($before);
        $afterSummary = $this->redactor->redact($after);
        $requestContext = $this->requestContext->from($request);

        return AuditLog::query()->forceCreate([
            'institution_id' => $institution?->getKey(),
            'actor_id' => $actor?->getKey(),
            'operation' => $operation,
            'auditable_type' => $auditable?->getMorphClass(),
            'auditable_id' => $auditable?->getKey(),
            'before_summary' => $beforeSummary === [] ? null : $beforeSummary,
            'after_summary' => $afterSummary === [] ? null : $afterSummary,
            'reason' => $reason,
            'request_context' => $requestContext === [] ? null : $requestContext,
        ]);
    }

    private function persistedInstitution(?Institution $institution): ?Institution
    {
        if ($institution === null) {
            return null;
        }

        if (! $institution->exists || $institution->isDirty($institution->getKeyName())) {
            throw new InvalidArgumentException('Audit institution must be a persisted model.');
        }

        return Institution::query()->whereKey($institution->getKey())->first()
            ?? throw new InvalidArgumentException('Audit institution no longer exists.');
    }

    private function persistedActor(?User $actor): ?User
    {
        if ($actor === null) {
            return null;
        }

        if (! $actor->exists || $actor->isDirty($actor->getKeyName())) {
            throw new InvalidArgumentException('Audit actor must be a persisted model.');
        }

        return User::query()->whereKey($actor->getKey())->first()
            ?? throw new InvalidArgumentException('Audit actor no longer exists.');
    }

    private function persistedAuditable(
        ?Model $auditable,
        ?Institution $institution,
    ): ?Model {
        if ($auditable === null) {
            return null;
        }

        $dirtyOwnership = $auditable instanceof InstitutionOwned
            && $auditable->isDirty('institution_id');

        if (
            ! $auditable->exists
            || $auditable->isDirty($auditable->getKeyName())
            || $dirtyOwnership
        ) {
            throw new InvalidArgumentException('Auditable resource must have persisted identity and ownership.');
        }

        $persistedAuditable = $auditable->newQuery()->whereKey($auditable->getKey())->first();

        if ($persistedAuditable === null) {
            throw new InvalidArgumentException('Auditable resource no longer exists.');
        }

        if ($persistedAuditable instanceof InstitutionOwned) {
            if (
                $institution === null
                || $persistedAuditable->institutionId() !== $institution->getKey()
            ) {
                throw new InvalidArgumentException('Auditable resource does not belong to the audit institution.');
            }
        }

        if (
            $persistedAuditable instanceof Institution
            && ($institution === null || ! $persistedAuditable->is($institution))
        ) {
            throw new InvalidArgumentException('Audited institution does not match the audit boundary.');
        }

        return $persistedAuditable;
    }

    private function validatedIdentifier(string $value, string $field): string
    {
        $value = trim($value);

        if (
            $value === ''
            || Str::length($value) > 100
            || preg_match('/^[a-z0-9]+(?:[._:-][a-z0-9]+)*$/', $value) !== 1
        ) {
            throw new InvalidArgumentException("Audit {$field} must be a bounded canonical identifier.");
        }

        return $value;
    }

    private function validatedReason(?string $reason): ?string
    {
        if ($reason === null) {
            return null;
        }

        $reason = (string) Str::of($reason)->squish();

        if ($reason === '') {
            return null;
        }

        if (Str::length($reason) > 1000) {
            throw new InvalidArgumentException('Audit reason may not exceed 1000 characters.');
        }

        return $reason;
    }
}
