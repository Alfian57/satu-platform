<?php

namespace App\Http\Controllers;

use App\Actions\User\DeleteUserAccount;
use App\Actions\User\ExportUserData;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class DataRightsController extends Controller
{
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
