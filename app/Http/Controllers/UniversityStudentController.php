<?php

namespace App\Http\Controllers;

use App\Enums\InstitutionMembershipRole;
use App\Enums\InstitutionMembershipStatus;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

final class UniversityStudentController extends Controller
{
    public function index(Request $request, Institution $institution): Response
    {
        $actor = $request->user();
        abort_unless($actor instanceof User, 403);
        Gate::forUser($actor)->authorize('viewAny', [InstitutionMembership::class, $institution]);
        $filters = $request->validate([
            'q' => ['sometimes', 'nullable', 'string', 'max:100'],
            'status' => ['sometimes', Rule::in(['all', ...array_column(InstitutionMembershipStatus::cases(), 'value')])],
        ]);
        $search = trim((string) ($filters['q'] ?? ''));
        $status = (string) ($filters['status'] ?? 'all');
        $students = $institution->memberships()->where('role', InstitutionMembershipRole::Student)
            ->select(['id', 'user_id', 'institution_id', 'status'])
            ->with('user:id,name')
            ->when($search !== '', fn ($query) => $query->whereHas('user', fn ($users) => $users->where('name', 'like', '%'.$search.'%')))
            ->when($status !== 'all', fn ($query) => $query->where('status', $status))
            ->latest('id')->paginate(20)->withQueryString();
        $programs = StudentProfile::query()->whereBelongsTo($institution)
            ->whereIn('user_id', $students->getCollection()->pluck('user_id'))->pluck('study_program', 'user_id');

        return Inertia::render('university/students', [
            'institution' => $institution->only(['id', 'name']),
            'filters' => ['q' => $search, 'status' => $status],
            'students' => $students->through(static fn (InstitutionMembership $membership): array => [
                'id' => $membership->id, 'name' => $membership->user->name,
                'status' => $membership->status->value, 'study_program' => $programs->get($membership->user_id),
            ]),
        ]);
    }
}
