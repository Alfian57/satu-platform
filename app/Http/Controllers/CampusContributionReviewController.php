<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Contribution\ContributionReviewQueue;
use App\Http\Requests\Contribution\ListContributionReviewsRequest;
use App\Models\Contribution;
use App\Models\Institution;
use App\Models\User;
use App\Support\Contribution\ContributionReviewQueueSerializer;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Inertia\Inertia;
use Inertia\Response;

final class CampusContributionReviewController extends Controller
{
    public function index(
        ListContributionReviewsRequest $request,
        Institution $institution,
        ContributionReviewQueue $reviewQueue,
        ContributionReviewQueueSerializer $serializer,
    ): Response {
        /** @var User $reviewer */
        $reviewer = $request->user();
        $status = $request->status();
        $sort = $request->sort();
        $page = $request->integer('page', 1);

        return Inertia::render('campus/contributions', [
            'institution' => [
                'id' => $institution->getKey(),
                'name' => $institution->name,
            ],
            'filters' => [
                'status' => $status === null ? 'all' : $status->value,
                'sort' => $sort,
            ],
            'reviewQueue' => Inertia::defer(function () use (
                $reviewQueue,
                $serializer,
                $reviewer,
                $institution,
                $status,
                $sort,
                $page,
            ): array {
                $paginator = $reviewQueue->paginate(
                    reviewer: $reviewer,
                    institution: $institution,
                    status: $status,
                    sort: $sort,
                    page: $page,
                );

                return [
                    'items' => $this->serializeItems($paginator, $serializer),
                    'pagination' => [
                        'current_page' => $paginator->currentPage(),
                        'last_page' => $paginator->lastPage(),
                        'per_page' => $paginator->perPage(),
                        'total' => $paginator->total(),
                    ],
                    'summary' => $reviewQueue->summary($reviewer, $institution),
                ];
            }),
        ]);
    }

    /**
     * @param  LengthAwarePaginator<int, Contribution>  $paginator
     * @return list<array<string, mixed>>
     */
    private function serializeItems(
        LengthAwarePaginator $paginator,
        ContributionReviewQueueSerializer $serializer,
    ): array {
        return array_values(collect($paginator->items())
            ->map(fn (Contribution $contribution): array => $serializer->item($contribution))
            ->values()
            ->all());
    }
}
