<?php

namespace App\Policies;

use App\Actions\Consent\ConsentRecorder;
use App\Enums\InstitutionMembershipRole;
use App\Models\Institution;
use App\Models\OpportunitySupportRequest;
use App\Models\User;
use App\Support\OpportunitySupportGovernance;
use Illuminate\Support\Facades\Schema;

class OpportunitySupportRequestPolicy
{
    public function __construct(
        private readonly InstitutionContextResolver $context,
        private readonly OpportunitySupportGovernance $governance,
        private readonly ConsentRecorder $consents,
    ) {}

    public function viewAny(User $user, Institution $institution): bool
    {
        if (! $user->exists || $user->isDirty($user->getKeyName()) || ! $institution->exists || $institution->isDirty($institution->getKeyName())) {
            return false;
        }

        return $this->context->resolve($user, $institution, [InstitutionMembershipRole::Student, InstitutionMembershipRole::CampusAdmin]) !== null
            || (Schema::hasTable((new OpportunitySupportRequest)->getTable())
                && OpportunitySupportRequest::query()->where('owner_id', $user->getKey())->where('institution_id', $institution->getKey())->exists());
    }

    public function reviewAny(User $user, Institution $institution): bool
    {
        $reviewers = $this->governance->settings($institution)['reviewer_ids'] ?? [];

        return $user->exists && ! $user->isDirty($user->getKeyName())
            && $this->context->resolve($user, $institution, [InstitutionMembershipRole::CampusAdmin]) !== null
            && is_array($reviewers) && in_array($user->getKey(), $reviewers, true);
    }

    public function create(User $user, Institution $institution): bool
    {
        return $user->exists && ! $user->isDirty($user->getKeyName()) && $this->governance->enabled($institution)
            && $this->context->resolve($user, $institution, [InstitutionMembershipRole::Student]) !== null;
    }

    public function owns(User $user, OpportunitySupportRequest $request): bool
    {
        $persisted = OpportunitySupportRequest::query()->whereKey($request->getKey())->first();

        return $user->exists && ! $user->isDirty($user->getKeyName())
            && ! $request->isDirty(['id', 'owner_id', 'institution_id'])
            && $persisted !== null && $persisted->owner_id === $user->getKey();
    }

    public function view(User $user, OpportunitySupportRequest $request): bool
    {
        if ($request->isDirty(['id', 'institution_id', 'owner_id'])) {
            return false;
        }
        if ($this->owns($user, $request)) {
            return true;
        }

        $request = $request->fresh() ?? $request;
        $institution = Institution::query()->find($request->institution_id);

        return $institution !== null && $this->reviewAny($user, $institution)
            && $this->exposed($request);
    }

    public function exposed(OpportunitySupportRequest $request): bool
    {
        return $request->status !== 'withdrawn'
            && $this->governance->matches($request)
            && $this->context->resolve($request->owner, $request, [InstitutionMembershipRole::Student]) !== null
            && ($this->consents->current($request->owner, $request->consentPurpose())?->isGrant() ?? false);
    }

    public function review(User $user, OpportunitySupportRequest $request): bool
    {
        return $request->owner_id !== $user->getKey()
            && $this->view($user, $request) && $this->exposed($request);
    }

    public function respond(User $user, OpportunitySupportRequest $request): bool
    {
        return $this->owns($user, $request) && $this->exposed($request);
    }

    public function withdraw(User $user, OpportunitySupportRequest $request): bool
    {
        return $this->owns($user, $request) && $request->status !== 'withdrawn';
    }
}
