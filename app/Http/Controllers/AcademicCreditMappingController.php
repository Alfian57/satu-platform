<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Academic\ActivateCreditMapping;
use App\Actions\Academic\CreateCreditMapping;
use App\Actions\Academic\RetireCreditMapping;
use App\Actions\Auth\ResolveUserWorkspace;
use App\Enums\InstitutionStatus;
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
    public function index(Request $request): Response
    {
        $user = $request->user();
        assert($user !== null);

        $activeInst = $this->authorizedInstitution($user, 'viewAny');

        $mappings = AcademicCreditMapping::query()
            ->where('institution_id', $activeInst->id)
            ->with('approver:id,name')
            ->orderByDesc('created_at')
            ->get()
            ->map(function (AcademicCreditMapping $map) {
                return [
                    'id' => $map->id,
                    'activity_type' => $map->activity_type,
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
                'id' => $activeInst->id,
                'name' => $activeInst->name,
            ],
        ]);
    }

    /**
     * Store a new draft credit mapping ruleset.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        assert($user !== null);

        $activeInst = $this->authorizedInstitution($user, 'create');

        $validated = $request->validate([
            'activity_type' => ['required', 'string', 'max:255'],
            'credit_amount' => ['required', 'numeric', 'min:0.5', 'max:24'],
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        try {
            $this->createAction->execute(
                operator: $user,
                institution: $activeInst,
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
    public function activate(Request $request, AcademicCreditMapping $mapping): RedirectResponse
    {
        $user = $request->user();
        assert($user !== null);

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
    public function retire(Request $request, AcademicCreditMapping $mapping): RedirectResponse
    {
        $user = $request->user();
        assert($user !== null);

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

    private function authorizedInstitution(User $user, string $ability): Institution
    {
        $workspace = $this->resolveUserWorkspace->handle($user, requestedWorkspace: WorkspaceRole::CampusAdmin);

        abort_unless(
            $workspace->role === WorkspaceRole::CampusAdmin && $workspace->institutionId !== null,
            403,
        );

        $institution = Institution::query()
            ->whereKey($workspace->institutionId)
            ->where('status', InstitutionStatus::Active)
            ->first();

        abort_unless($institution !== null, 403);

        Gate::forUser($user)->authorize($ability, [AcademicCreditMapping::class, $institution]);

        return $institution;
    }
}
