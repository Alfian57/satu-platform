<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Matching\HideRecommendation;
use App\Actions\Matching\MarkRecommendationNotRelevant;
use App\Actions\Matching\MarkRecommendationProfileFix;
use App\Exceptions\StaleRecommendation;
use App\Models\Recommendation;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

final class RecommendationFeedbackController extends Controller
{
    public function hide(
        Request $request,
        Recommendation $recommendation,
        HideRecommendation $hideRecommendation,
    ): RedirectResponse {
        return $this->record(
            $request,
            $recommendation,
            'hide',
            'hidden',
            fn (User $user): mixed => $hideRecommendation->execute($user, $recommendation),
        );
    }

    public function notRelevant(
        Request $request,
        Recommendation $recommendation,
        MarkRecommendationNotRelevant $markRecommendationNotRelevant,
    ): RedirectResponse {
        return $this->record(
            $request,
            $recommendation,
            'notRelevant',
            'not_relevant',
            fn (User $user): mixed => $markRecommendationNotRelevant->execute($user, $recommendation),
        );
    }

    public function profileFix(
        Request $request,
        Recommendation $recommendation,
        MarkRecommendationProfileFix $markRecommendationProfileFix,
    ): RedirectResponse {
        return $this->record(
            $request,
            $recommendation,
            'profileFix',
            'profile_fix',
            fn (User $user): mixed => $markRecommendationProfileFix->execute($user, $recommendation),
        );
    }

    /**
     * @param  callable(User): mixed  $callback
     */
    private function record(
        Request $request,
        Recommendation $recommendation,
        string $ability,
        string $feedback,
        callable $callback,
    ): RedirectResponse {
        $user = $request->user();

        if (! $user instanceof User) {
            abort(401);
        }

        Gate::forUser($user)->authorize($ability, $recommendation);

        try {
            $callback($user);
        } catch (StaleRecommendation) {
            return back()->with('dashboard_issue', 'recommendation_stale');
        }

        return back()->with('dashboard_feedback', $feedback);
    }
}
