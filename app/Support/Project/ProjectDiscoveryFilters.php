<?php

declare(strict_types=1);

namespace App\Support\Project;

use App\Enums\ProjectStatus;
use App\Enums\ProjectVisibility;

final readonly class ProjectDiscoveryFilters
{
    /** @var list<ProjectStatus> */
    public array $statuses;

    /** @var list<ProjectVisibility> */
    public array $visibilities;

    /**
     * @param  list<ProjectStatus>  $statuses
     * @param  list<ProjectVisibility>  $visibilities
     */
    public function __construct(
        public ?string $search,
        array $statuses,
        array $visibilities,
        public string $sort,
        public string $direction,
        public ?int $institutionId,
        public int $perPage,
        public int $page,
    ) {
        $this->statuses = $statuses;
        $this->visibilities = $visibilities;
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    public static function fromValidated(array $validated): self
    {
        $sort = (string) ($validated['sort'] ?? 'deadline');

        return new self(
            search: self::normalizeSearch($validated['q'] ?? null),
            statuses: self::statuses($validated['status'] ?? null),
            visibilities: self::visibilities($validated['visibility'] ?? null),
            sort: $sort,
            direction: (string) ($validated['direction'] ?? self::defaultDirection($sort)),
            institutionId: isset($validated['institution_id'])
                ? (int) $validated['institution_id']
                : null,
            perPage: (int) ($validated['per_page'] ?? 20),
            page: (int) ($validated['page'] ?? 1),
        );
    }

    /**
     * @return list<ProjectStatus>
     */
    public static function defaultStatuses(): array
    {
        return [
            ProjectStatus::Open,
            ProjectStatus::Forming,
            ProjectStatus::Full,
        ];
    }

    /**
     * @return list<ProjectVisibility>
     */
    public static function defaultVisibilities(): array
    {
        return [
            ProjectVisibility::Institution,
            ProjectVisibility::Public,
        ];
    }

    /**
     * @return list<ProjectStatus>
     */
    public static function discoverableStatuses(): array
    {
        return [
            ...self::defaultStatuses(),
            ProjectStatus::Closed,
            ProjectStatus::Cancelled,
        ];
    }

    /**
     * @return list<ProjectVisibility>
     */
    public static function discoverableVisibilities(): array
    {
        return ProjectVisibility::cases();
    }

    /**
     * @return list<string>
     */
    public static function sortableFields(): array
    {
        return ['deadline', 'newest', 'title'];
    }

    /**
     * @return array<string, int|string|null>
     */
    public function queryParameters(): array
    {
        return [
            'q' => $this->search,
            'status' => self::enumValues($this->statuses),
            'visibility' => self::enumValues($this->visibilities),
            'sort' => $this->sort,
            'direction' => $this->direction,
            'institution_id' => $this->institutionId,
            'per_page' => $this->perPage,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'q' => $this->search ?? '',
            'status' => self::enumValueList($this->statuses),
            'visibility' => self::enumValueList($this->visibilities),
            'sort' => $this->sort,
            'direction' => $this->direction,
            'institution_id' => $this->institutionId,
            'per_page' => $this->perPage,
            'page' => $this->page,
        ];
    }

    public function forInstitution(int $institutionId): self
    {
        return new self(
            search: $this->search,
            statuses: $this->statuses,
            visibilities: $this->visibilities,
            sort: $this->sort,
            direction: $this->direction,
            institutionId: $institutionId,
            perPage: $this->perPage,
            page: $this->page,
        );
    }

    private static function normalizeSearch(mixed $search): ?string
    {
        if (! is_string($search)) {
            return null;
        }

        $search = trim($search);

        return $search === '' ? null : $search;
    }

    /**
     * @return list<ProjectStatus>
     */
    private static function statuses(mixed $value): array
    {
        if (! is_string($value) || trim($value) === '') {
            return self::defaultStatuses();
        }

        return array_map(
            static fn (string $status): ProjectStatus => ProjectStatus::from($status),
            self::tokens($value),
        );
    }

    /**
     * @return list<ProjectVisibility>
     */
    private static function visibilities(mixed $value): array
    {
        if (! is_string($value) || trim($value) === '') {
            return self::defaultVisibilities();
        }

        return array_map(
            static fn (string $visibility): ProjectVisibility => ProjectVisibility::from($visibility),
            self::tokens($value),
        );
    }

    /**
     * @return list<string>
     */
    private static function tokens(string $value): array
    {
        return array_values(array_unique(array_filter(
            array_map(static fn (string $token): string => trim($token), explode(',', $value)),
            static fn (string $token): bool => $token !== '',
        )));
    }

    /**
     * @param  list<\BackedEnum>  $enums
     */
    private static function enumValues(array $enums): string
    {
        return implode(',', array_map(
            static fn (\BackedEnum $enum): string => (string) $enum->value,
            $enums,
        ));
    }

    /**
     * @param  list<\BackedEnum>  $enums
     * @return list<string>
     */
    private static function enumValueList(array $enums): array
    {
        return array_map(
            static fn (\BackedEnum $enum): string => (string) $enum->value,
            $enums,
        );
    }

    private static function defaultDirection(string $sort): string
    {
        return $sort === 'newest' ? 'desc' : 'asc';
    }
}
