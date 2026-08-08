<?php

namespace App\Http\Controllers\Platform;

use App\Models\RecruiterOrganization;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class RecruiterEvidenceProjectionController
{
    /**
     * Project sensitive verification evidence to authorized platform admins.
     */
    public function show(Request $request, RecruiterOrganization $organization, string $filename): StreamedResponse
    {
        Gate::authorize('viewEvidence', $organization);

        // Prevent directory traversal
        $filename = basename($filename);
        $path = "recruiter-evidence/{$organization->getKey()}/{$filename}";

        if (! Storage::disk('local')->exists($path)) {
            abort(404);
        }

        return Storage::disk('local')->response($path);
    }
}
