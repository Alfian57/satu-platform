<?php

namespace App\Http\Controllers;

use App\Actions\Roster\ImportRoster;
use App\Models\Institution;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class RosterImportController extends Controller
{
    public function show(Institution $institution): Response
    {
        $rosters = $institution->rosters()
            ->withCount('rows')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('campus/roster-import', [
            'institution' => $institution->only('id', 'name'),
            'rosters' => $rosters,
        ]);
    }

    public function preview(Request $request, Institution $institution): Response
    {
        $validated = $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:10240'],
            'semester' => ['required', 'string', 'max:50'],
        ]);

        $path = $validated['file']->store('roster-imports');

        $action = new ImportRoster;
        $result = $action->preview($institution, $path, $validated['semester']);

        return Inertia::render('campus/roster-import', [
            'institution' => $institution->only('id', 'name'),
            'preview' => $result,
            'tempPath' => $path,
        ]);
    }

    public function store(Request $request, Institution $institution): RedirectResponse
    {
        $validated = $request->validate([
            'temp_path' => ['required', 'string'],
            'semester' => ['required', 'string', 'max:50'],
        ]);

        $action = new ImportRoster;
        $roster = $action->commit(
            $request->user(),
            $institution,
            $validated['temp_path'],
            $validated['semester'],
        );

        Storage::delete($validated['temp_path']);

        return redirect()->route('campus.roster.show', $institution)
            ->with('status', 'Roster imported successfully.');
    }
}
