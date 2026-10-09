<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Recruiter\GrantRecruiterEntitlement;
use App\Actions\Recruiter\RevokeRecruiterEntitlement;
use App\Actions\Recruiter\SubmitRecruiterVerificationReview;
use App\Enums\RecruiterEntitlementScope;
use App\Enums\RecruiterVerificationConclusion;
use App\Models\RecruiterEntitlement;
use App\Models\RecruiterOrganization;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use InvalidArgumentException;

final class PlatformRecruiterController extends Controller
{
    /**
     * Submit a verification review for a recruiter organization.
     */
    public function review(
        Request $request,
        RecruiterOrganization $organization,
        SubmitRecruiterVerificationReview $submitReview,
    ): RedirectResponse {
        $actor = $request->user();
        abort_unless($actor instanceof User && $actor->is_platform_admin, 403);

        $validated = $request->validate([
            'conclusion' => ['required', 'string', 'in:verified,rejected,suspended,unsuspend'],
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        $conclusion = RecruiterVerificationConclusion::from($validated['conclusion']);
        $reason = isset($validated['reason']) && trim((string) $validated['reason']) !== ''
            ? (string) $validated['reason']
            : null;

        try {
            $submitReview->execute(
                admin: $actor,
                organization: $organization,
                conclusion: $conclusion,
                reason: $reason,
            );
        } catch (AuthorizationException $e) {
            abort(403, $e->getMessage());
        } catch (InvalidArgumentException $e) {
            return back()->withErrors(['reason' => $e->getMessage()]);
        }

        $conclusionLabels = [
            RecruiterVerificationConclusion::Verified->value => 'Organisasi perekrut telah diverifikasi.',
            RecruiterVerificationConclusion::Rejected->value => 'Organisasi perekrut telah ditolak.',
            RecruiterVerificationConclusion::Suspended->value => 'Organisasi perekrut telah ditangguhkan.',
            RecruiterVerificationConclusion::Unsuspend->value => 'Penangguhan organisasi perekrut telah dicabut.',
        ];

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $conclusionLabels[$conclusion->value],
        ]);

        return back();
    }

    /**
     * Grant an entitlement to a verified recruiter organization.
     */
    public function grantEntitlement(
        Request $request,
        RecruiterOrganization $organization,
        GrantRecruiterEntitlement $grantAction,
    ): RedirectResponse {
        $actor = $request->user();
        abort_unless($actor instanceof User && $actor->is_platform_admin, 403);

        $validated = $request->validate([
            'scope' => ['required', 'string', 'in:candidate_search'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        $scope = RecruiterEntitlementScope::from((string) $validated['scope']);
        $startsAt = ! empty($validated['starts_at'])
            ? Carbon::parse((string) $validated['starts_at'])
            : Carbon::now();
        $endsAt = ! empty($validated['ends_at'])
            ? Carbon::parse((string) $validated['ends_at'])
            : null;
        $reason = isset($validated['reason']) && trim((string) $validated['reason']) !== ''
            ? (string) $validated['reason']
            : null;

        try {
            $grantAction->execute(
                issuer: $actor,
                organization: $organization,
                scope: $scope,
                startsAt: $startsAt,
                endsAt: $endsAt,
                reason: $reason,
            );
        } catch (AuthorizationException $e) {
            abort(403, $e->getMessage());
        } catch (InvalidArgumentException $e) {
            return back()->withErrors(['entitlement' => $e->getMessage()]);
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Hak akses Talent Portal berhasil diberikan.',
        ]);

        return back();
    }

    /**
     * Revoke an active recruiter entitlement.
     */
    public function revokeEntitlement(
        Request $request,
        RecruiterEntitlement $entitlement,
        RevokeRecruiterEntitlement $revokeAction,
    ): RedirectResponse {
        $actor = $request->user();
        abort_unless($actor instanceof User && $actor->is_platform_admin, 403);

        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:3', 'max:1000'],
        ]);

        try {
            $revokeAction->execute(
                actor: $actor,
                entitlement: $entitlement,
                reason: (string) $validated['reason'],
            );
        } catch (AuthorizationException $e) {
            abort(403, $e->getMessage());
        } catch (InvalidArgumentException $e) {
            return back()->withErrors(['reason' => $e->getMessage()]);
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Hak akses Talent Portal telah dicabut.',
        ]);

        return back();
    }
}
