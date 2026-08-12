<?php

declare(strict_types=1);

namespace App\Support\Matching;

use App\Models\Institution;
use App\Models\Recommendation;
use Illuminate\Pagination\LengthAwarePaginator;

final readonly class RecommendationQueryResult
{
    /**
     * @param  LengthAwarePaginator<int, Recommendation>  $paginator
     */
    public function __construct(
        public Institution $institution,
        public ?int $currentVersionId,
        public LengthAwarePaginator $paginator,
    ) {}
}
