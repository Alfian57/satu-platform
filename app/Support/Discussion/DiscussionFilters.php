<?php

declare(strict_types=1);

namespace App\Support\Discussion;

final readonly class DiscussionFilters
{
    public function __construct(
        public int $perPage = 20,
        public int $page = 1,
    ) {}

    /**
     * @param  array<string, mixed>  $validated
     */
    public static function fromValidated(array $validated): self
    {
        return new self(
            perPage: (int) ($validated['per_page'] ?? 20),
            page: (int) ($validated['page'] ?? 1),
        );
    }

    /**
     * @return array<string, int>
     */
    public function queryParameters(): array
    {
        return ['per_page' => $this->perPage];
    }
}
