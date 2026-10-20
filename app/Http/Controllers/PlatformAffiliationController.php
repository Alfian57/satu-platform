<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

final class PlatformAffiliationController extends Controller
{
    public function __invoke(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 403);
        $membership = $user->universityAdminMembership();
        abort_unless($membership !== null, 403);

        return to_route('campus.affiliations.index', ['institution' => $membership->institution_id]);
    }
}
