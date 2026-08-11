<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Integration\ReconcileIntegrationSync;
use App\Actions\Integration\RetryIntegrationSync;
use App\Enums\InstitutionMembershipRole;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\IntegrationSyncStatus;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\IntegrationConnection;
use App\Models\IntegrationSync;
use App\Models\User;
use App\Support\Integration\IntegrationConnectionSerializer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;

class AcademicIntegrationController extends Controller
{
    public function __construct(
        private readonly IntegrationConnectionSerializer $serializer,
        private readonly RetryIntegrationSync $retryAction,
        private readonly ReconcileIntegrationSync $reconcileAction,
    ) {}

    /**
     * Display the academic sync status and review queue for a campus operator.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        assert($user !== null);

        $institution = $this->resolveInstitution($user);

        if ($institution === null || ! $user->is_platform_admin && ! $this->isCampusOperator($user, $institution)) {
            return Inertia::render('campus/integrations', [
                'connections' => [],
                'syncs' => [],
                'filters' => $this->emptyFilters(),
                'forbidden' => true,
            ]);
        }

        $connections = IntegrationConnection::query()
            ->forInstitution($institution)
            ->orderByDesc('created_at')
            ->get();

        $statusFilter = (string) $request->query('status', 'all');
        $connectionFilter = (int) $request->query('connection', 0);

        $syncQuery = IntegrationSync::query()
            ->whereHas('connection', fn ($q) => $q->where('institution_id', $institution->id))
            ->with(['connection', 'events'])
            ->when(
                $this->isValidStatus($statusFilter),
                fn ($q) => $q->where('status', $statusFilter),
            )
            ->when($connectionFilter > 0, fn ($q) => $q->where('integration_connection_id', $connectionFilter))
            ->orderByDesc('created_at')
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('campus/integrations', [
            'connections' => $connections->map(fn ($c) => $this->serializer->connection($c))->values(),
            'syncs' => [
                'data' => $syncQuery->items()
                    ? array_map(fn ($s) => $this->serializer->sync($s), $syncQuery->items())
                    : [],
                'links' => $syncQuery->links(),
                'meta' => [
                    'current_page' => $syncQuery->currentPage(),
                    'last_page' => $syncQuery->lastPage(),
                    'per_page' => $syncQuery->perPage(),
                    'total' => $syncQuery->total(),
                ],
            ],
            'filters' => [
                'status' => $statusFilter,
                'connection' => $connectionFilter,
                'status_options' => $this->statusOptions(),
                'connection_options' => $connections->map(fn ($c) => [
                    'id' => $c->id,
                    'label' => $c->provider_key.' ('.$c->mode->value.')',
                ])->values(),
            ],
            'forbidden' => false,
        ]);
    }

    public function retry(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();
        assert($user !== null);

        $sync = IntegrationSync::query()->with('connection')->findOrFail($id);

        Gate::authorize('update', $sync);

        try {
            $this->retryAction->execute($user, $sync);
        } catch (InvalidArgumentException $e) {
            return back()->withErrors(['retry' => $e->getMessage()]);
        }

        return back()->with('success', 'Sync dijalankan ulang dan masuk antrean pemrosesan.');
    }

    public function reconcile(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();
        assert($user !== null);

        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:1000'],
        ]);

        $sync = IntegrationSync::query()->with('connection')->findOrFail($id);

        Gate::authorize('update', $sync);

        try {
            $this->reconcileAction->execute($user, $sync, (string) $validated['reason']);
        } catch (InvalidArgumentException $e) {
            return back()->withErrors(['reconcile' => $e->getMessage()]);
        }

        return back()->with('success', 'Sync ditandai sebagai telah direkonsiliasi.');
    }

    /**
     * Resolve the active institution for a campus operator.
     */
    private function resolveInstitution(User $user): ?Institution
    {
        $membership = InstitutionMembership::query()
            ->where('user_id', $user->id)
            ->where('status', InstitutionMembershipStatus::Verified)
            ->first();

        $institution = $membership?->institution;

        if ($institution !== null) {
            return $institution;
        }

        if ($user->is_platform_admin) {
            return Institution::query()->first();
        }

        return null;
    }

    private function isCampusOperator(User $user, Institution $institution): bool
    {
        return InstitutionMembership::query()
            ->forInstitution($institution)
            ->where('user_id', $user->id)
            ->where('status', InstitutionMembershipStatus::Verified)
            ->where('role', InstitutionMembershipRole::CampusAdmin)
            ->exists();
    }

    private function isValidStatus(string $status): bool
    {
        return $status !== 'all' && collect(array_column(IntegrationSyncStatus::cases(), 'value'))->contains($status);
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    private function statusOptions(): array
    {
        $options = collect(IntegrationSyncStatus::cases())
            ->map(fn (IntegrationSyncStatus $status): array => [
                'value' => $status->value,
                'label' => $this->statusLabel($status),
            ])
            ->values()
            ->all();

        return array_values($options);
    }

    private function statusLabel(IntegrationSyncStatus $status): string
    {
        return match ($status) {
            IntegrationSyncStatus::Queued => 'Antrean',
            IntegrationSyncStatus::Sending => 'Mengirim',
            IntegrationSyncStatus::Succeeded => 'Berhasil',
            IntegrationSyncStatus::Failed => 'Gagal',
            IntegrationSyncStatus::Retrying => 'Mencoba ulang',
            IntegrationSyncStatus::Dead => 'Berhenti',
            IntegrationSyncStatus::Timeout => 'Waktu habis',
            IntegrationSyncStatus::ValidationError => 'Validasi gagal',
            IntegrationSyncStatus::Conflict => 'Konflik',
            IntegrationSyncStatus::Reconciled => 'Direkonsiliasi',
        };
    }

    /**
     * @return array<string, mixed>
     */
    private function emptyFilters(): array
    {
        return [
            'status' => 'all',
            'connection' => 0,
            'status_options' => array_values(collect(IntegrationSyncStatus::cases())
                ->map(fn (IntegrationSyncStatus $status): array => [
                    'value' => $status->value,
                    'label' => $this->statusLabel($status),
                ])
                ->values()
                ->all()),
            'connection_options' => [],
        ];
    }
}
