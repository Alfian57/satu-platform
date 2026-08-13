<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\InstitutionMembershipRole;
use App\Models\User;
use App\Models\XpLedgerEntry;

final class XpLedgerEntryPolicy
{
    public function __construct(
        private readonly InstitutionContextResolver $institutionContextResolver,
    ) {}

    public function view(User $user, XpLedgerEntry $entry): bool
    {
        return $this->isCampusOperator($user, $entry);
    }

    public function reverse(User $user, XpLedgerEntry $entry): bool
    {
        return $entry->exists
            && ! $entry->isReversal()
            && $this->isCampusOperator($user, $entry);
    }

    public function update(User $user, XpLedgerEntry $entry): bool
    {
        return false;
    }

    public function delete(User $user, XpLedgerEntry $entry): bool
    {
        return false;
    }

    public function forceDelete(User $user, XpLedgerEntry $entry): bool
    {
        return false;
    }

    private function isCampusOperator(User $user, XpLedgerEntry $entry): bool
    {
        return $this->institutionContextResolver->resolve(
            $user,
            $entry,
            [InstitutionMembershipRole::CampusAdmin],
        ) !== null;
    }
}
