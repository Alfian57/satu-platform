<?php

declare(strict_types=1);

namespace App\Support\Project;

use App\Models\Institution;
use App\Models\Project;
use Illuminate\Pagination\LengthAwarePaginator;

final readonly class ProjectDiscoveryResult
{
    /**
     * @param  LengthAwarePaginator<int, Project>  $paginator
     */
    public function __construct(
        public Institution $institution,
        public ProjectDiscoveryFilters $filters,
        public LengthAwarePaginator $paginator,
    ) {}
}
