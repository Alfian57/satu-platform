<?php

namespace App\Http\Controllers;

use App\Actions\Institution\ApproveInstitution;
use App\Actions\Institution\SuspendInstitution;
use App\Http\Requests\Institution\ApproveInstitutionRequest;
use App\Http\Requests\Institution\SuspendInstitutionRequest;
use App\Models\Institution;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

final class PlatformInstitutionController extends Controller
{
    public function approve(
        ApproveInstitutionRequest $request,
        Institution $institution,
        ApproveInstitution $approveInstitution,
    ): RedirectResponse {
        $actor = $request->user();

        abort_unless($actor instanceof User, 403);

        $approveInstitution->handle(
            actor: $actor,
            institution: $institution,
            reason: (string) $request->validated('reason'),
        );

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Institusi telah disetujui dan dicatat pada audit.',
        ]);

        return back();
    }

    public function suspend(
        SuspendInstitutionRequest $request,
        Institution $institution,
        SuspendInstitution $suspendInstitution,
    ): RedirectResponse {
        $actor = $request->user();

        abort_unless($actor instanceof User, 403);

        $suspendInstitution->handle(
            actor: $actor,
            institution: $institution,
            reason: (string) $request->validated('reason'),
        );

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Institusi telah ditangguhkan dan dicatat pada audit.',
        ]);

        return back();
    }
}
