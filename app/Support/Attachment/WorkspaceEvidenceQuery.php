<?php

declare(strict_types=1);

namespace App\Support\Attachment;

use App\Enums\AttachmentPurpose;
use App\Models\Attachment;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Facades\Gate;

final class WorkspaceEvidenceQuery
{
    public function __construct(private readonly AttachmentSerializer $serializer) {}

    /** @return array<string, mixed> */
    public function execute(User $actor, Project $project, int $page = 1): array
    {
        Gate::forUser($actor)->authorize('viewAny', [Task::class, $project]);
        $paginator = Attachment::query()->forProject($project)
            ->whereNull('message_id')->where('purpose', AttachmentPurpose::Evidence)
            ->with('uploadedBy:id,name')->latest('id')->paginate(10, ['*'], 'evidence_page', $page);

        return [
            'data' => array_map($this->serializer->attachment(...), $paginator->items()),
            'meta' => ['current_page' => $paginator->currentPage(), 'last_page' => $paginator->lastPage(), 'total' => $paginator->total()],
        ];
    }
}
