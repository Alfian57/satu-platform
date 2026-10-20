<?php

namespace App\Http\Controllers;

use App\Models\Institution;
use App\Models\InstitutionRoster;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class UniversitySettingsController extends Controller
{
    public function index(Request $request, Institution $institution): Response
    {
        $actor = $request->user();
        abort_unless($actor instanceof User && $actor->isUniversityAdmin($institution), 403);

        return Inertia::render('university/settings', [
            'section' => $request->query('section') === 'semester' ? 'semester' : 'profile',
            'institution' => $institution->only(['id', 'name', 'timezone', 'locale']),
            'rosters' => InstitutionRoster::query()->whereBelongsTo($institution)->latest('id')->paginate(12)
                ->through(static fn (InstitutionRoster $roster): array => $roster->only([
                    'id', 'semester', 'status', 'activated_at', 'superseded_at',
                ])),
        ]);
    }
}
