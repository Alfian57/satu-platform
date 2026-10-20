<?php

declare(strict_types=1);

namespace App\Support\Team;

use App\Enums\TeamJoinRequestStatus;
use App\Models\Project;
use App\Models\ProjectRole;
use App\Models\ProjectRoleSkill;
use App\Models\TeamJoinRequest;
use App\Models\TeamMembership;

final class TeamDecisionSnapshot
{
    /** @return array<string, mixed> */
    public static function context(Project $project): array
    {
        $project->loadMissing('roles.skills');

        return [
            'project' => $project->only(['id', 'institution_id', 'owner_id', 'title', 'description', 'status', 'visibility', 'capacity', 'deadline']),
            'roles' => $project->roles->sortBy('id')->values()->map(fn (ProjectRole $role): array => [
                ...$role->only(['id', 'title', 'description', 'capacity', 'accepts_beginners', 'selection_criteria']),
                'skills' => $role->skills->sortBy('id')->values()->map(fn (ProjectRoleSkill $skill): array => $skill->only(['skill_taxonomy_id', 'proficiency']))->all(),
            ])->all(),
            'members' => TeamMembership::query()->whereBelongsTo($project)->active()->orderBy('id')
                ->get(['id', 'user_id', 'project_role_id', 'joined_at'])->toArray(),
        ];
    }

    /** @param array<string, mixed>|null $context */
    public static function revision(TeamJoinRequest $request, ?array $context = null): string
    {
        return hash('sha256', json_encode([
            'request' => $request->only(['id', 'project_id', 'project_role_id', 'requester_id', 'status', 'message', 'requested_at', 'responded_at', 'response_reason']),
            'context' => $context,
        ], JSON_THROW_ON_ERROR));
    }

    /** @param array<string, mixed>|null $context */
    public static function ensurePending(TeamJoinRequest $request, string $expectedRevision, ?array $context = null): void
    {
        if ($request->status !== TeamJoinRequestStatus::Pending || ! hash_equals(self::revision($request, $context), $expectedRevision)) {
            abort(409, 'Pengajuan atau kebutuhan tim berubah. Periksa status terbaru sebelum mengambil keputusan.');
        }
    }
}
