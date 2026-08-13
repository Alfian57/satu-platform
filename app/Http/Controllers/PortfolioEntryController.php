<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Portfolio\UpdatePortfolioEntryVisibility;
use App\Http\Requests\Portfolio\ListPortfolioEntriesRequest;
use App\Http\Requests\Portfolio\UpdatePortfolioEntryVisibilityRequest;
use App\Models\PortfolioEntry;
use App\Models\StudentProfile;
use App\Models\User;
use App\Support\Portfolio\PortfolioEntrySerializer;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

final class PortfolioEntryController extends Controller
{
    public function index(
        ListPortfolioEntriesRequest $request,
        StudentProfile $studentProfile,
        PortfolioEntrySerializer $serializer,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();
        $query = PortfolioEntry::query()
            ->where('user_id', $studentProfile->user_id)
            ->where('institution_id', $studentProfile->institution_id)
            ->with([
                'contribution:id,institution_id,owner_id,status,current_version_id',
                'sourceVersion:id,contribution_id,version_number',
            ])
            ->latest('updated_at')
            ->latest('id');

        if (! Gate::forUser($user)->allows('viewAll', [PortfolioEntry::class, $studentProfile])) {
            $query->visibleToInstitution();
        }

        $entries = $query->limit(100)->get();

        return response()->json([
            'data' => $entries
                ->map(fn (PortfolioEntry $entry): array => $serializer->toArray($entry))
                ->values()
                ->all(),
        ]);
    }

    public function show(
        StudentProfile $studentProfile,
        PortfolioEntry $portfolioEntry,
        PortfolioEntrySerializer $serializer,
    ): JsonResponse {
        Gate::authorize('view', $portfolioEntry);

        return response()->json(['data' => $serializer->toArray($portfolioEntry)]);
    }

    public function updateVisibility(
        UpdatePortfolioEntryVisibilityRequest $request,
        StudentProfile $studentProfile,
        PortfolioEntry $portfolioEntry,
        UpdatePortfolioEntryVisibility $updateVisibility,
        PortfolioEntrySerializer $serializer,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();
        $entry = $updateVisibility->handle($user, $portfolioEntry, $request->validated());

        return response()->json(['data' => $serializer->toArray($entry)]);
    }
}
