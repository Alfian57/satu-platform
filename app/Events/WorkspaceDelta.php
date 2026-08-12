<?php

declare(strict_types=1);

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

abstract class WorkspaceDelta implements ShouldBroadcast, ShouldDispatchAfterCommit
{
    use Dispatchable, SerializesModels;

    /**
     * @var list<int>
     */
    public array $backoff = [1, 5, 10];

    public int $tries = 3;

    public function __construct(
        public readonly int $institutionId,
        public readonly int $projectId,
        public readonly int $resourceId,
        public readonly string $operation,
        public readonly ?string $version,
        public readonly string $occurredAt,
    ) {}

    /**
     * @return array<int, PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return [new PrivateChannel('institutions.'.$this->institutionId.'.projects.'.$this->projectId.'.workspace')];
    }

    public function broadcastQueue(): string
    {
        return 'default';
    }

    /**
     * @return array{resource: string, operation: string, resource_id: int, project_id: int, institution_id: int, version: string|null, occurred_at: string}
     */
    public function broadcastWith(): array
    {
        return [
            'resource' => $this->resourceName(),
            'operation' => $this->operation,
            'resource_id' => $this->resourceId,
            'project_id' => $this->projectId,
            'institution_id' => $this->institutionId,
            'version' => $this->version,
            'occurred_at' => $this->occurredAt,
        ];
    }

    abstract protected function resourceName(): string;
}
