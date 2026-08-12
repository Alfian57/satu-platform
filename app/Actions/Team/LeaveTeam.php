<?php

declare(strict_types=1);

namespace App\Actions\Team;

use App\Models\TeamMembership;
use App\Models\User;
use App\Notifications\TeamMembershipChangedNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

final class LeaveTeam
{
    public function __construct(
        private readonly TeamMembershipTransition $transition,
    ) {}

    public function handle(
        User $actor,
        TeamMembership $membership,
        ?string $reason = null,
    ): TeamMembership {
        Gate::forUser($actor)->authorize('leave', $membership);
        $reason = $this->transition->normalizeReason($reason);

        return DB::transaction(function () use ($actor, $membership, $reason): TeamMembership {
            $project = $this->transition->lockProject($membership->project);
            $lockedMembership = $this->transition->lockMembership($project, $actor);

            if ($lockedMembership === null || $lockedMembership->getKey() !== $membership->getKey()) {
                abort(404);
            }

            Gate::forUser($actor)->authorize('leave', $lockedMembership);
            $left = $this->transition->leaveMembership($project, $lockedMembership, $actor, $reason);
            $project->owner->notify(
                new TeamMembershipChangedNotification($left, $actor, 'left'),
            );

            return $left;
        }, attempts: 5);
    }
}
