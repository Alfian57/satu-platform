<?php

namespace App\Http\Controllers;

use App\Actions\Profile\CreateStudentProfile;
use App\Actions\Profile\ReplaceStudentProfileAvailability;
use App\Actions\Profile\UpdateStudentProfile;
use App\Actions\Profile\UpdateStudentProfileVisibility;
use App\Http\Requests\Profile\ReplaceStudentProfileAvailabilityRequest;
use App\Http\Requests\Profile\StoreStudentProfileRequest;
use App\Http\Requests\Profile\UpdateStudentProfileRequest;
use App\Http\Requests\Profile\UpdateStudentProfileVisibilityRequest;
use App\Models\AvailabilityWindow;
use App\Models\Institution;
use App\Models\ProfileInterest;
use App\Models\ProfileSkill;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class StudentProfileController extends Controller
{
    public function show(StudentProfile $studentProfile): JsonResponse
    {
        Gate::authorize('view', $studentProfile);

        return response()->json(['data' => $this->payload($studentProfile)]);
    }

    public function store(
        StoreStudentProfileRequest $request,
        CreateStudentProfile $createStudentProfile,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();
        $institution = Institution::query()->findOrFail($request->integer('institution_id'));
        $profile = $createStudentProfile->handle($user, $institution, $request->validated());

        return response()->json(['data' => $this->payload($profile)], 201);
    }

    public function update(
        UpdateStudentProfileRequest $request,
        StudentProfile $studentProfile,
        UpdateStudentProfile $updateStudentProfile,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();
        $profile = $updateStudentProfile->handle($user, $studentProfile, $request->validated());

        return response()->json(['data' => $this->payload($profile)]);
    }

    public function updateVisibility(
        UpdateStudentProfileVisibilityRequest $request,
        StudentProfile $studentProfile,
        UpdateStudentProfileVisibility $updateVisibility,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();
        $profile = $updateVisibility->handle($user, $studentProfile, $request->validated());

        return response()->json(['data' => $this->payload($profile)]);
    }

    public function replaceAvailability(
        ReplaceStudentProfileAvailabilityRequest $request,
        StudentProfile $studentProfile,
        ReplaceStudentProfileAvailability $replaceAvailability,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();
        $profile = $replaceAvailability->handle($user, $studentProfile, $request->validated());

        return response()->json(['data' => $this->payload($profile)]);
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(StudentProfile $profile): array
    {
        $profile->load([
            'skills.taxonomy',
            'interests.taxonomy',
            'availabilityWindows',
        ]);

        return [
            'id' => $profile->getKey(),
            'bio' => $profile->bio,
            'study_program' => $profile->study_program,
            'study_year' => $profile->study_year,
            'portfolio_visibility' => $profile->portfolio_visibility->value,
            'recruiter_discoverable' => $profile->recruiter_discoverable,
            'skills' => $profile->skills->map(static fn (ProfileSkill $skill): array => [
                'id' => $skill->getKey(),
                'taxonomy_id' => $skill->skill_taxonomy_id,
                'name' => $skill->taxonomy->name,
                'proficiency' => $skill->proficiency->value,
                'evidence_metadata' => $skill->evidence_metadata,
            ])->values()->all(),
            'interests' => $profile->interests->map(static fn (ProfileInterest $interest): array => [
                'id' => $interest->getKey(),
                'taxonomy_id' => $interest->skill_taxonomy_id,
                'name' => $interest->taxonomy->name,
            ])->values()->all(),
            'availability_windows' => $profile->availabilityWindows->map(static fn (AvailabilityWindow $window): array => [
                'id' => $window->getKey(),
                'day_of_week' => $window->day_of_week,
                'starts_at' => $window->starts_at,
                'ends_at' => $window->ends_at,
                'timezone' => $window->timezone,
            ])->values()->all(),
        ];
    }
}
