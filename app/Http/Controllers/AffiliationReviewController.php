<?php

namespace App\Http\Controllers;

use App\Actions\Affiliations\AcquireAffiliationReviewLock;
use App\Actions\Affiliations\AffiliationReviewQueue;
use App\Actions\Affiliations\ReleaseAffiliationReviewLock;
use App\Actions\Affiliations\ReviewAffiliationRequest;
use App\Enums\AffiliationReviewDecision;
use App\Enums\AffiliationReviewReason;
use App\Exceptions\AffiliationReviewLocked;
use App\Exceptions\StaleAffiliationDecision;
use App\Http\Requests\Affiliations\ListAffiliationReviewsRequest;
use App\Http\Requests\Affiliations\ManageAffiliationReviewRequest;
use App\Http\Requests\Affiliations\ReviewAffiliationRequestRequest;
use App\Models\AffiliationRequest;
use App\Models\Institution;
use App\Models\InstitutionRoster;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class AffiliationReviewController extends Controller
{
    public function index(
        ListAffiliationReviewsRequest $request,
        Institution $institution,
        AffiliationReviewQueue $reviewQueue,
    ): Response {
        /** @var User $reviewer */
        $reviewer = $request->user();
        $matchResult = $request->matchResult();
        $stale = $request->stale();
        $sort = $request->sort();
        $page = $request->integer('page', 1);

        return Inertia::render('campus/affiliations', [
            'institution' => [
                'id' => $institution->getKey(),
                'name' => $institution->name,
            ],
            'filters' => [
                'match' => $matchResult?->value,
                'stale' => $stale,
                'sort' => $sort,
            ],
            'reviewOutcome' => $request->session()->get('review_outcome'),
            'reviewIssue' => $request->session()->get('review_issue'),
            'reviewQueue' => Inertia::defer(function () use (
                $reviewQueue,
                $reviewer,
                $institution,
                $matchResult,
                $stale,
                $sort,
                $page,
            ): array {
                $activeRoster = $reviewQueue->activeRoster($institution);
                $paginator = $reviewQueue->paginate(
                    $reviewer,
                    $institution,
                    $matchResult,
                    $stale,
                    $sort,
                    page: $page,
                );

                return [
                    'items' => $this->serializeRequests($paginator, $activeRoster, $reviewer),
                    'pagination' => [
                        'currentPage' => $paginator->currentPage(),
                        'lastPage' => $paginator->lastPage(),
                        'perPage' => $paginator->perPage(),
                        'total' => $paginator->total(),
                    ],
                    'summary' => $reviewQueue->summary($reviewer, $institution),
                    'activeRoster' => $activeRoster === null ? null : [
                        'semester' => $activeRoster->semester,
                        'activatedAt' => $activeRoster->activated_at?->toIso8601String(),
                    ],
                ];
            }),
        ]);
    }

    public function acquire(
        ManageAffiliationReviewRequest $request,
        Institution $institution,
        AffiliationRequest $affiliationRequest,
        AcquireAffiliationReviewLock $acquireLock,
    ): RedirectResponse {
        try {
            $acquireLock->handle($affiliationRequest, $request->user());
        } catch (AffiliationReviewLocked) {
            return back()->with('review_issue', 'lock_conflict');
        }

        return back()->with('review_outcome', 'lock_acquired');
    }

    public function release(
        ManageAffiliationReviewRequest $request,
        Institution $institution,
        AffiliationRequest $affiliationRequest,
        ReleaseAffiliationReviewLock $releaseLock,
    ): RedirectResponse {
        try {
            $releaseLock->handle($affiliationRequest, $request->user());
        } catch (AffiliationReviewLocked) {
            return back()->with('review_issue', 'lock_conflict');
        }

        return back()->with('review_outcome', 'lock_released');
    }

    public function decide(
        ReviewAffiliationRequestRequest $request,
        Institution $institution,
        AffiliationRequest $affiliationRequest,
        ReviewAffiliationRequest $reviewAffiliation,
    ): RedirectResponse {
        try {
            $reviewAffiliation->handle(
                $affiliationRequest,
                $request->user(),
                AffiliationReviewDecision::from($request->string('decision')->toString()),
                AffiliationReviewReason::from($request->string('reason_code')->toString()),
                $request->integer('expected_version'),
                $request->string('note')->toString() ?: null,
            );
        } catch (AffiliationReviewLocked) {
            return back()->with('review_issue', 'lock_conflict');
        } catch (StaleAffiliationDecision) {
            return back()->with('review_issue', 'stale_decision');
        }

        return back()->with('review_outcome', 'decision_saved');
    }

    /**
     * @param  LengthAwarePaginator<int, AffiliationRequest>  $paginator
     * @return list<array<string, mixed>>
     */
    private function serializeRequests(
        LengthAwarePaginator $paginator,
        ?InstitutionRoster $activeRoster,
        User $reviewer,
    ): array {
        $serialized = collect($paginator->items())
            ->map(fn (AffiliationRequest $affiliationRequest): array => [
                'id' => $affiliationRequest->getKey(),
                'username' => $affiliationRequest->user->username,
                'maskedNim' => $affiliationRequest->maskedNim(),
                'maskedPhone' => $affiliationRequest->user->phoneNumber?->masked,
                'matchResult' => $affiliationRequest->match_result->value,
                'status' => $affiliationRequest->status->value,
                'version' => $affiliationRequest->version,
                'submittedAt' => $affiliationRequest->submitted_at->toIso8601String(),
                'isStale' => $affiliationRequest->isStaleAgainst($activeRoster),
                'rosterSemester' => $affiliationRequest->roster?->semester,
                'lock' => $affiliationRequest->isReviewLockActive() ? [
                    'ownedByCurrentUser' => $affiliationRequest->review_locked_by_id === $reviewer->getKey(),
                    'owner' => $affiliationRequest->lockOwner?->username,
                    'expiresAt' => $affiliationRequest->review_lock_expires_at?->toIso8601String(),
                ] : null,
            ])
            ->all();

        return array_values($serialized);
    }
}
