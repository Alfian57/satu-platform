<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Inclusion\InclusionReviewQueue;
use App\Actions\Inclusion\InclusionSignalDetail;
use App\Actions\Inclusion\RecordInclusionReview;
use App\Http\Requests\Campus\StoreInclusionReviewRequest;
use App\Models\InclusionSignal;
use App\Models\Institution;
use App\Support\InclusionSignalSerializer;
use Exception;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Pennant\Feature;

class CampusInclusionController extends Controller
{
    public function __construct(
        private readonly InclusionReviewQueue $reviewQueue,
        private readonly InclusionSignalDetail $signalDetail,
        private readonly RecordInclusionReview $recordReview,
        private readonly InclusionSignalSerializer $serializer,
    ) {}

    public function index(Request $request, Institution $institution): Response
    {
        if (! Feature::active('inclusion-signal-engine')) {
            return Inertia::render('campus/inclusion', [
                'institution' => [
                    'id' => $institution->id,
                    'name' => $institution->name,
                ],
                'engineActive' => false,
                'signals' => [
                    'items' => [],
                    'pagination' => [
                        'current_page' => 1,
                        'last_page' => 1,
                        'per_page' => 25,
                        'total' => 0,
                    ],
                ],
                'filters' => [
                    'period' => null,
                    'restricted_only' => true,
                ],
                'selectedSignal' => null,
            ]);
        }

        $reviewer = $request->user();
        if ($reviewer === null) {
            throw new AuthorizationException('Unauthenticated.');
        }

        $period = $request->query('period');
        $periodString = is_string($period) ? $period : null;
        $restrictedOnly = $request->boolean('restricted_only', true);
        $page = max(1, (int) $request->query('page', 1));

        $paginator = $this->reviewQueue->paginate(
            reviewer: $reviewer,
            institution: $institution,
            period: $periodString,
            restrictedOnly: $restrictedOnly,
            perPage: 25,
            page: $page,
        );

        $items = collect($paginator->items())
            ->map(fn (InclusionSignal $signal) => $this->serializer->toRestrictedArray($signal))
            ->values()
            ->all();

        $selectedId = $request->query('signal_id');
        $selectedSignal = null;

        if (is_numeric($selectedId)) {
            $signalModel = InclusionSignal::where('institution_id', $institution->id)
                ->find((int) $selectedId);

            if ($signalModel !== null) {
                try {
                    $detailed = $this->signalDetail->execute($reviewer, $signalModel);
                    $selectedSignal = $this->serializer->toRestrictedArray($detailed);
                } catch (Exception) {
                    $selectedSignal = null;
                }
            }
        }

        return Inertia::render('campus/inclusion', [
            'institution' => [
                'id' => $institution->id,
                'name' => $institution->name,
            ],
            'engineActive' => true,
            'signals' => [
                'items' => $items,
                'pagination' => [
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                ],
            ],
            'filters' => [
                'period' => $periodString,
                'restricted_only' => $restrictedOnly,
            ],
            'selectedSignal' => $selectedSignal,
        ]);
    }

    public function storeReview(
        StoreInclusionReviewRequest $request,
        Institution $institution,
        InclusionSignal $signal,
    ): RedirectResponse {
        $reviewer = $request->user();
        if ($reviewer === null) {
            throw new AuthorizationException('Unauthenticated.');
        }

        if ($signal->institution_id !== $institution->id) {
            throw new AuthorizationException('Sinyal tidak termasuk institusi ini.');
        }

        $validated = $request->validated();

        $this->recordReview->execute(
            reviewer: $reviewer,
            signal: $signal,
            conclusion: (string) $validated['human_conclusion'],
            supportAction: isset($validated['support_action']) ? (string) $validated['support_action'] : null,
            reason: (string) $validated['reason'],
        );

        return back()->with('success', 'Tinjauan inklusi berhasil disimpan.');
    }
}
