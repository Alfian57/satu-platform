<?php

namespace App\Http\Controllers;

use App\Actions\Campus\OpportunityJourneySummary;
use App\Actions\OpportunitySupport\ManageOpportunitySupport;
use App\Actions\OpportunitySupport\OpportunitySupportQuery;
use App\Http\Requests\OpportunitySupport\StoreOpportunitySupportRequest;
use App\Http\Requests\OpportunitySupport\TransitionOpportunitySupportRequest;
use App\Models\Institution;
use App\Models\OpportunitySupportRequest;
use App\Models\User;
use App\Support\OpportunitySupportGovernance;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class OpportunitySupportController extends Controller
{
    public function index(Request $request, Institution $institution, OpportunitySupportQuery $query, OpportunitySupportGovernance $governance, OpportunityJourneySummary $summary): Response|JsonResponse
    {
        $actor = $request->user();
        abort_unless($actor instanceof User, 401);
        Gate::authorize('viewAny', [OpportunitySupportRequest::class, $institution]);
        $reviewer = Gate::allows('reviewAny', [OpportunitySupportRequest::class, $institution]);
        $page = max(1, $request->integer('page', 1));
        $settings = $governance->settings($institution);
        $result = [
            'institution' => ['id' => $institution->getKey(), 'name' => $institution->name],
            'reviewer' => $reviewer, 'enabled' => $governance->enabled($institution),
            'can_create' => Gate::allows('create', [OpportunitySupportRequest::class, $institution]),
            'notice' => $governance->enabled($institution) ? [
                'purpose' => $settings['purpose'], 'version' => $settings['notice_version'],
                'access_days' => $settings['access_days'], 'dataset_kind' => $settings['dataset_kind'],
                'dataset_manifest' => $settings['dataset_manifest'],
            ] : null,
            'requests' => $query->page($actor, $institution, $reviewer, $page),
            'opportunities' => $reviewer && $governance->enabled($institution) ? $query->opportunities($actor, $institution) : [],
            'journey' => $reviewer ? $summary->handle($actor, $institution) : null,
        ];

        return $request->expectsJson() ? response()->json($result) : Inertia::render('opportunity-support/index', $result);
    }

    public function store(StoreOpportunitySupportRequest $request, Institution $institution, ManageOpportunitySupport $manage, OpportunitySupportQuery $query): JsonResponse
    {
        $actor = $request->user();
        abort_unless($actor instanceof User, 401);
        $supportRequest = $manage->create($actor, $institution, $request->validated());

        return response()->json(['data' => $query->serialize($actor, $supportRequest)], 201);
    }

    public function transition(TransitionOpportunitySupportRequest $request, Institution $institution, OpportunitySupportRequest $supportRequest, ManageOpportunitySupport $manage, OpportunitySupportQuery $query): JsonResponse
    {
        abort_unless($supportRequest->institution_id === $institution->getKey(), 404);
        $actor = $request->user();
        abort_unless($actor instanceof User, 401);
        $updated = $manage->transition($actor, $supportRequest, $request->validated());

        return response()->json(['data' => $query->serialize($actor, $updated)]);
    }
}
