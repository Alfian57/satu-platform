<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Matching\RequestMatchingRefresh;
use App\Http\Requests\Matching\RefreshRecommendationsRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;

final class RecommendationRefreshController extends Controller
{
    public function __invoke(RefreshRecommendationsRequest $request, RequestMatchingRefresh $refresh): JsonResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 401);
        $result = $refresh->handle($request->integer('institution_id'), $user->getKey());

        return response()->json(['data' => ['state' => $result->status]], 202);
    }
}
