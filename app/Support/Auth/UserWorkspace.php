<?php

namespace App\Support\Auth;

use App\Enums\WorkspaceRole;

final readonly class UserWorkspace
{
    public function __construct(
        public WorkspaceRole $role,
        public ?int $institutionId = null,
        public ?string $institutionName = null,
        public ?int $recruiterOrganizationId = null,
        public ?string $recruiterOrganizationName = null,
    ) {}

    public function routeName(): string
    {
        return match ($this->role) {
            WorkspaceRole::PlatformAdmin => 'platform.affiliations.index',
            WorkspaceRole::CampusAdmin => 'campus.overview.show',
            WorkspaceRole::Recruiter => 'recruiter.talent.search',
            WorkspaceRole::Student => 'dashboard',
        };
    }

    /** @return array<string, int> */
    public function routeParameters(): array
    {
        if ($this->role !== WorkspaceRole::CampusAdmin || $this->institutionId === null) {
            return [];
        }

        return ['institution' => $this->institutionId];
    }

    /**
     * @return array{
     *     role: string,
     *     institution: array{id: int, name: string}|null,
     *     recruiterOrganization: array{id: int, name: string}|null
     * }
     */
    public function toArray(): array
    {
        return [
            'role' => $this->role->value,
            'institution' => $this->institutionId === null || $this->institutionName === null
                ? null
                : [
                    'id' => $this->institutionId,
                    'name' => $this->institutionName,
                ],
            'recruiterOrganization' => $this->recruiterOrganizationId === null || $this->recruiterOrganizationName === null
                ? null
                : [
                    'id' => $this->recruiterOrganizationId,
                    'name' => $this->recruiterOrganizationName,
                ],
        ];
    }
}
