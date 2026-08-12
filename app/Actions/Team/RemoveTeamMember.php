<?php

declare(strict_types=1);

namespace App\Actions\Team;

use App\Models\TeamMembership;
use App\Models\User;
use App\Notifications\TeamMembershipChangedNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

final class RemoveTeamMember
{
    public function __construct(
        private readonly TeamMembershipTransition $transition,
    ) {}

    public function handle(
        User $actor,
        TeamMembership $membership,
        string $reason,
    ): TeamMembership {
        Gate::forUser($actor)->authorize('remove', $membership);
        $reason = $this->transition->normalizeReason($reason, required: true);

        return DB::transaction(function () use ($actor, $membership, $reason): TeamMembership {
            $project = $this->transition->lockProject($membership->project);
            $lockedMembership = TeamMembership::query()
                ->lockForUpdate()
                ->whereKey($membership->getKey())
                ->firstOrFail();

            Gate::forUser($actor)->authorize('remove', $lockedMembership);
            $removed = $this->transition->removeMembership($project, $lockedMembership, $actor, $reason);
            $removed->load('user');
            $removed->user->notify(
                new TeamMembershipChangedNotification($removed, $actor, 'removed'),
            );

            return $removed;
        }, attempts: 5);
    }
}
