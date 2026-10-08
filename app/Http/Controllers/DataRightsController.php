<?php

namespace App\Http\Controllers;

use App\Actions\Audit\AuditRecorder;
use App\Actions\Consent\ConsentRecorder;
use App\Actions\User\DeleteUserAccount;
use App\Actions\User\ExportUserData;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DataRightsController extends Controller
{
    public function edit(Request $request, ExportUserData $exportUserData): Response
    {
        $user = $request->user();
        abort_unless($user instanceof User, 403);

        $summary = $exportUserData->handle($user);

        return Inertia::render('settings/data-rights', [
            'summary' => $summary,
        ]);
    }

    public function correction(Request $request, AuditRecorder $auditRecorder): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 403);

        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $auditRecorder->record(
            operation: 'data_right.correction_requested',
            auditable: $user,
            actor: $user,
            institution: null,
            before: [],
            after: ['correction_requested' => true],
            reason: $validated['reason'],
            request: $request,
        );

        return back()->with('status', 'Permintaan koreksi data Anda telah direkam untuk diproses oleh petugas.');
    }

    public function restriction(Request $request, AuditRecorder $auditRecorder): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 403);

        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $auditRecorder->record(
            operation: 'data_right.restriction_requested',
            auditable: $user,
            actor: $user,
            institution: null,
            before: [],
            after: ['restriction_requested' => true],
            reason: $validated['reason'],
            request: $request,
        );

        return back()->with('status', 'Permintaan pembatasan pemrosesan data Anda telah dicatat.');
    }

    public function withdrawal(Request $request, ConsentRecorder $consentRecorder, AuditRecorder $auditRecorder): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 403);

        $currentConsent = $consentRecorder->current($user, 'registration.terms');

        if ($currentConsent !== null && $currentConsent->isGrant()) {
            $consentRecorder->withdraw(
                $user,
                'registration.terms',
                $currentConsent->policy_version,
                'data_rights.withdrawal',
            );
        }

        $auditRecorder->record(
            operation: 'data_right.consent_withdrawn',
            auditable: $user,
            actor: $user,
            institution: null,
            before: ['registration_terms' => 'granted'],
            after: ['registration_terms' => 'withdrawn'],
            reason: 'Pengguna menarik persetujuan privasi secara mandiri.',
            request: $request,
        );

        return back()->with('status', 'Persetujuan data telah berhasil ditarik.');
    }

    public function export(Request $request, ExportUserData $exportUserData): JsonResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 403);

        $data = $exportUserData->handle($user);

        return response()->json($data, 200, [
            'Content-Disposition' => 'attachment; filename="satu-data-export.json"',
        ]);
    }

    public function delete(Request $request, DeleteUserAccount $deleteUserAccount): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 403);

        $deleteUserAccount->handle($user);

        auth()->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/')->with('status', 'Akun Anda berhasil dihapus.');
    }
}
