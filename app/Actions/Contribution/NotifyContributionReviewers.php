<?php

declare(strict_types=1);

namespace App\Actions\Contribution;

use App\Enums\InstitutionMembershipRole;
use App\Enums\InstitutionMembershipStatus;
use App\Models\Contribution;
use App\Models\InstitutionMembership;
use App\Notifications\ContributionSubmittedNotification;

final class NotifyContributionReviewers
{
    public function handle(Contribution $contribution): void
    {
        InstitutionMembership::query()
            ->where('institution_id', $contribution->institution_id)
            ->where('role', InstitutionMembershipRole::CampusAdmin)
            ->where('status', InstitutionMembershipStatus::Verified)
            ->whereNotNull('verified_at')
            ->with(['user', 'institution'])
            ->get()
            ->each(function (InstitutionMembership $membership) use ($contribution): void {
                if ($membership->user->isUniversityAdmin($membership->institution)) {
                    $membership->user->notify(new ContributionSubmittedNotification($contribution));
                }
            });
    }
}
