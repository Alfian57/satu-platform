<?php

declare(strict_types=1);

namespace App\Support\Task;

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;

final readonly class TaskWorkspaceFilters
{
    public function __construct(
        public ?string $search,
        public ?TaskStatus $status,
        public ?TaskPriority $priority,
        public int $perPage,
        public int $page,
    ) {}

    /**
     * @param  array<string, mixed>  $validated
     */
    public static function fromValidated(array $validated): self
    {
        $search = is_string($validated['q'] ?? null)
            ? trim((string) $validated['q'])
            : '';

        return new self(
            search: $search === '' ? null : $search,
            status: array_key_exists('status', $validated) && $validated['status'] !== null
                ? TaskStatus::from((string) $validated['status'])
                : null,
            priority: array_key_exists('priority', $validated) && $validated['priority'] !== null
                ? TaskPriority::from((string) $validated['priority'])
                : null,
            perPage: (int) ($validated['per_page'] ?? 20),
            page: (int) ($validated['page'] ?? 1),
        );
    }

    /**
     * @return array<string, int|string|null>
     */
    public function queryParameters(): array
    {
        return [
            'q' => $this->search,
            'status' => $this->status?->value,
            'priority' => $this->priority?->value,
            'per_page' => $this->perPage,
        ];
    }

    /**
     * @return array<string, int|string|null>
     */
    public function toArray(): array
    {
        return [
            'q' => $this->search ?? '',
            'status' => $this->status?->value,
            'priority' => $this->priority?->value,
            'per_page' => $this->perPage,
            'page' => $this->page,
        ];
    }
}
