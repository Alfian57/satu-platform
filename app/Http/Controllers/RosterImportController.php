<?php

namespace App\Http\Controllers;

use App\Actions\Roster\ImportRoster;
use App\Http\Requests\Campus\PreviewRosterImportRequest;
use App\Http\Requests\Campus\ShowRosterImportRequest;
use App\Http\Requests\Campus\StoreRosterImportRequest;
use App\Models\Institution;
use App\Models\InstitutionRoster;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class RosterImportController extends Controller
{
    public function show(ShowRosterImportRequest $request, Institution $institution): Response
    {
        return $this->renderPage($institution);
    }

    public function preview(
        PreviewRosterImportRequest $request,
        Institution $institution,
        ImportRoster $importRoster,
    ): Response {
        $validated = $request->validated();
        $path = $validated['file']->store('roster-imports', 'local');
        $result = $importRoster->preview($institution, $path, $validated['semester']);
        $previousPath = $request->session()->get($this->previewSessionKey($institution).'.path');

        if (is_string($previousPath)) {
            Storage::disk('local')->delete($previousPath);
        }

        $request->session()->put($this->previewSessionKey($institution), [
            'path' => $path,
            'semester' => $validated['semester'],
        ]);

        return $this->renderPage($institution, $result);
    }

    public function store(
        StoreRosterImportRequest $request,
        Institution $institution,
        ImportRoster $importRoster,
    ): RedirectResponse {
        $preview = $request->session()->get($this->previewSessionKey($institution));

        if (
            ! is_array($preview)
            || ! is_string($preview['path'] ?? null)
            || ! is_string($preview['semester'] ?? null)
        ) {
            return to_route('campus.roster.show', $institution)
                ->withErrors(['file' => 'Pratinjau roster terlebih dahulu sebelum mengimpor.']);
        }

        $importRoster->commit(
            $request->user(),
            $institution,
            $preview['path'],
            $preview['semester'],
        );

        Storage::disk('local')->delete($preview['path']);
        $request->session()->forget($this->previewSessionKey($institution));

        return redirect()->route('campus.roster.show', $institution)
            ->with('status', 'Roster mahasiswa berhasil diimpor.');
    }

    /**
     * @param  array<string, mixed>|null  $preview
     */
    private function renderPage(Institution $institution, ?array $preview = null): Response
    {
        $props = [
            'institution' => [
                'id' => $institution->getKey(),
                'name' => $institution->name,
            ],
            'rosters' => $this->rosterHistory($institution),
        ];

        if ($preview !== null) {
            $props['preview'] = $preview;
        }

        return Inertia::render('campus/roster-import', $props);
    }

    /** @return list<array<string, int|string|null>> */
    private function rosterHistory(Institution $institution): array
    {
        return array_values($institution->rosters()
            ->withCount('rows')
            ->latest()
            ->get()
            ->map(fn (InstitutionRoster $roster): array => [
                'id' => $roster->id,
                'semester' => $roster->semester,
                'sourceFilename' => $roster->source_filename,
                'status' => $roster->status->value,
                'totalRows' => $roster->total_rows,
                'validRows' => $roster->valid_rows,
                'errorRows' => $roster->error_rows,
                'rowsCount' => $roster->rows_count,
                'activatedAt' => $roster->activated_at?->toIso8601String(),
                'supersededAt' => $roster->superseded_at?->toIso8601String(),
            ])
            ->all());
    }

    private function previewSessionKey(Institution $institution): string
    {
        return 'roster-import.preview.'.$institution->getKey();
    }
}
