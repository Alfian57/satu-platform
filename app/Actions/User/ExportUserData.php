<?php

namespace App\Actions\User;

use App\Models\User;

class ExportUserData
{
    /**
     * Export user's exportable personal data.
     *
     * @return array<string, mixed>
     */
    public function handle(User $user): array
    {
        $user->loadMissing([
            'phoneNumbers',
            'consentRecords',
            'studentProfile',
            'institutionMemberships.institution',
        ]);

        return [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'created_at' => $user->created_at?->toIso8601String(),
            ],
            'phone_numbers' => $user->phoneNumbers->map(fn ($p) => [
                'masked' => $p->masked,
                'status' => $p->status,
                'verified_at' => $p->verified_at?->toIso8601String(),
            ])->all(),
            'profile' => $user->studentProfile ? [
                'bio' => $user->studentProfile->bio,
                'visibility' => $user->studentProfile->visibility,
            ] : null,
            'memberships' => $user->institutionMemberships->map(fn ($m) => [
                'institution' => $m->institution?->name,
                'role' => $m->role,
                'status' => $m->status,
            ])->all(),
            'consents' => $user->consentRecords->map(fn ($c) => [
                'purpose' => $c->purpose,
                'policy_version' => $c->policy_version,
                'granted_at' => $c->granted_at?->toIso8601String(),
                'withdrawn_at' => $c->withdrawn_at?->toIso8601String(),
                'occurred_at' => $c->occurred_at->toIso8601String(),
            ])->all(),
        ];
    }
}
