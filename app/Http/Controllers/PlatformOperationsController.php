<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

final class PlatformOperationsController extends Controller
{
    public function index(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 403);
        $membership = $user->universityAdminMembership();
        abort_unless($membership !== null, 403);

        return to_route('campus.overview.show', ['institution' => $membership->institution_id]);
    }
}
