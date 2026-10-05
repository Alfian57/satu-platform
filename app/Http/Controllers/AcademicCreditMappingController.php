<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Academic\ActivateCreditMapping;
use App\Actions\Academic\CreateCreditMapping;
use App\Actions\Academic\RetireCreditMapping;
use App\Actions\Auth\ResolveUserWorkspace;
use App\Enums\WorkspaceRole;
use App\Models\AcademicCreditMapping;
use App\Models\Institution;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;

class AcademicCreditMappingController extends Controller
{
    public function __construct(
        private readonly CreateCreditMapping $createAction,
        private readonly ActivateCreditMapping $activateAction,
        private readonly RetireCreditMapping $retireAction,
        private readonly ResolveUserWorkspace $resolveUserWorkspace,
    ) {}

    /**
     * Display a listing of institutional credit mappings.
     */
    public function index(Request $request, Institution $institution): Response
    {
        $user = $request->user();
        assert($user !== null);

        $activeInstitution = $this->authorizedInstitution($user, $institution, 'viewAny');

        $mappings = AcademicCreditMapping::query()
            ->whereBelongsTo($activeInstitution)
            ->with('approver:id,name')
            ->orderByDesc('created_at')
            ->get()
            ->map(function (AcademicCreditMapping $map) {
                return [
                    'id' => $map->id,
                    'activity_type' => $map->activity_type,
                    'version' => $map->version,
                    'credit_amount' => $map->credit_amount,
                    'status' => $map->status->value,
                    'effective_from' => $map->effective_from?->toIso8601String(),
                    'effective_to' => $map->effective_to?->toIso8601String(),
                    'approver_name' => $map->approver?->name,
                    'reason' => $map->reason,
                    'created_at' => $map->created_at->toIso8601String(),
                ];
            });

        return Inertia::render('campus/credit-mappings', [
            'mappings' => $mappings,
            'institution' => [
                'id' => $activeInstitution->getKey(),
                'name' => $activeInstitution->name,
            ],
        ]);
    }

    /**
     * Store a new draft credit mapping ruleset.
     */
    public function store(Request $request, Institution $institution): RedirectResponse
    {
        $user = $request->user();
        assert($user !== null);

        $activeInstitution = $this->authorizedInstitution($user, $institution, 'create');

        $validated = $request->validate([
            'activity_type' => ['required', 'string', 'max:255'],
            'credit_amount' => ['required', 'numeric', 'min:0.5', 'max:24'],
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        try {
            $this->createAction->execute(
                operator: $user,
                institution: $activeInstitution,
                activityType: (string) $validated['activity_type'],
                creditAmount: (float) $validated['credit_amount'],
                reason: isset($validated['reason']) ? (string) $validated['reason'] : null,
            );
        } catch (InvalidArgumentException $e) {
            return back()->withErrors(['activity_type' => $e->getMessage()]);
        }

        return back()->with('success', 'Draft pemetaan kredit berhasil dibuat.');
    }

    /**
     * Activate a draft credit mapping ruleset.
     */
    public function activate(
        Request $request,
        Institution $institution,
        AcademicCreditMapping $mapping,
    ): RedirectResponse {
        $user = $request->user();
        assert($user !== null);

        $this->ensureMappingBelongsToInstitution($mapping, $institution);
        $this->authorizedInstitution($user, $institution, 'viewAny');

        try {
            $this->activateAction->execute(
                approver: $user,
                mapping: $mapping,
            );
        } catch (InvalidArgumentException $e) {
            return back()->withErrors(['mapping' => $e->getMessage()]);
        }

        return back()->with('success', 'Pemetaan kredit berhasil diaktifkan.');
    }

    /**
     * Retire an active credit mapping ruleset.
     */
    public function retire(
        Request $request,
        Institution $institution,
        AcademicCreditMapping $mapping,
    ): RedirectResponse {
        $user = $request->user();
        assert($user !== null);

        $this->ensureMappingBelongsToInstitution($mapping, $institution);
        $this->authorizedInstitution($user, $institution, 'viewAny');

        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        try {
            $this->retireAction->execute(
                operator: $user,
                mapping: $mapping,
                reason: isset($validated['reason']) ? (string) $validated['reason'] : null,
            );
        } catch (InvalidArgumentException $e) {
            return back()->withErrors(['mapping' => $e->getMessage()]);
        }

        return back()->with('success', 'Pemetaan kredit berhasil dipensiunkan.');
    }

    private function authorizedInstitution(
        User $user,
        Institution $institution,
        string $ability,
    ): Institution {
        $workspace = $this->resolveUserWorkspace->handle(
            $user,
            requestedInstitution: $institution,
            requestedWorkspace: WorkspaceRole::CampusAdmin,
        );

        abort_unless(
            $workspace->role === WorkspaceRole::CampusAdmin
                && $workspace->institutionId === $institution->getKey(),
            403,
        );

        Gate::forUser($user)->authorize($ability, [AcademicCreditMapping::class, $institution]);

        return $institution;
    }

    private function ensureMappingBelongsToInstitution(
        AcademicCreditMapping $mapping,
        Institution $institution,
    ): void {
        abort_unless($mapping->institution_id === $institution->getKey(), 404);
    }
}
