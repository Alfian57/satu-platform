<?php

namespace App\Policies;

use App\Enums\InstitutionMembershipRole;
use App\Models\CollaborationEvent;
use App\Models\User;

final class CollaborationEventPolicy
{
    public function __construct(
        private readonly InstitutionContextResolver $institutionContextResolver,
    ) {}

    /**
     * Only CampusAdmin in the same institution can view collaboration events.
     * Students and recruiters are denied.
     */
    public function viewAny(User $user, CollaborationEvent $event): bool
    {
        if (! $user->exists || $user->isDirty($user->getKeyName())) {
            return false;
        }

        if (! $event->exists || $event->isDirty([$event->getKeyName(), 'institution_id'])) {
            return false;
        }

        return $this->institutionContextResolver->resolve(
            $user,
            $event,
            [InstitutionMembershipRole::CampusAdmin],
        ) !== null;
    }

    public function view(User $user, CollaborationEvent $event): bool
    {
        return $this->viewAny($user, $event);
    }
}
