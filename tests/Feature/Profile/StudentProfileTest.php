<?php

use App\Actions\Consent\ConsentRecorder;
use App\Models\AuditLog;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\ProfileInterest;
use App\Models\ProfileSkill;
use App\Models\SkillTaxonomy;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Support\Carbon;

function verifiedStudentForProfileTests(): array
{
    $institution = Institution::factory()->active()->create();
    $student = User::factory()->create();

    InstitutionMembership::factory()
        ->verifiedByApprovedDomain()
        ->for($student)
        ->for($institution)
        ->create();

    return [$student, $institution];
}

test('verified student can create a tenant-scoped profile with taxonomy and availability data', function () {
    [$student, $institution] = verifiedStudentForProfileTests();
    $skill = SkillTaxonomy::factory()->create();
    $interest = SkillTaxonomy::factory()->create(['category' => 'interest']);

    $response = $this->actingAs($student)->postJson(route('student-profiles.store'), [
        'institution_id' => $institution->getKey(),
        'bio' => 'Membangun produk kolaborasi yang aman.',
        'study_program' => 'Informatika',
        'study_year' => 3,
        'skills' => [[
            'taxonomy_id' => $skill->getKey(),
            'proficiency' => 'advanced',
            'evidence_metadata' => ['source' => 'portfolio'],
        ]],
        'interests' => [$interest->getKey()],
        'portfolio_visibility' => 'recruiter',
        'recruiter_discoverable' => true,
        'availability_windows' => [[
            'day_of_week' => 1,
            'starts_at' => '09:00',
            'ends_at' => '12:00',
        ]],
        'timezone' => 'Asia/Jakarta',
    ]);

    $response
        ->assertCreated()
        ->assertJsonPath('data.study_program', 'Informatika')
        ->assertJsonPath('data.portfolio_visibility', 'recruiter')
        ->assertJsonPath('data.recruiter_discoverable', true)
        ->assertJsonPath('data.skills.0.taxonomy_id', $skill->getKey())
        ->assertJsonPath('data.skills.0.proficiency', 'advanced')
        ->assertJsonPath('data.interests.0.taxonomy_id', $interest->getKey())
        ->assertJsonPath('data.availability_windows.0.starts_at', '09:00:00')
        ->assertJsonStructure(['data' => ['updated_at']]);

    $profile = StudentProfile::query()->whereBelongsTo($student, 'user')->sole();

    expect($profile->institution_id)->toBe($institution->getKey())
        ->and(ProfileSkill::query()->whereBelongsTo($profile, 'studentProfile')->count())->toBe(1)
        ->and(ProfileInterest::query()->whereBelongsTo($profile, 'studentProfile')->count())->toBe(1)
        ->and($profile->availabilityWindows()->count())->toBe(1)
        ->and(app(ConsentRecorder::class)->current($student, 'portfolio.visibility')?->isGrant())
        ->toBeTrue()
        ->and(app(ConsentRecorder::class)->current($student, 'recruiter.discoverability')?->isGrant())
        ->toBeTrue()
        ->and(AuditLog::query()->where('operation', 'profile.created')->exists())->toBeTrue();
});

test('profile updates reject unverified and wrong-category taxonomy identifiers', function () {
    [$student, $institution] = verifiedStudentForProfileTests();
    $interest = SkillTaxonomy::factory()->create(['category' => 'interest']);

    $response = $this->actingAs($student)->postJson(route('student-profiles.store'), [
        'institution_id' => $institution->getKey(),
        'skills' => [[
            'taxonomy_id' => $interest->getKey(),
            'proficiency' => 'beginner',
        ]],
    ]);

    $response->assertUnprocessable()->assertJsonValidationErrors('skills.0.taxonomy_id');
    expect(StudentProfile::query()->count())->toBe(0);
});

test('verified student can update profile fields and taxonomy selections', function () {
    [$student, $institution] = verifiedStudentForProfileTests();
    $oldSkill = SkillTaxonomy::factory()->create();
    $newSkill = SkillTaxonomy::factory()->create();
    $oldInterest = SkillTaxonomy::factory()->create(['category' => 'interest']);
    $newInterest = SkillTaxonomy::factory()->create(['category' => 'interest']);
    $profile = StudentProfile::factory()->for($student)->for($institution)->create();

    ProfileSkill::factory()
        ->for($profile, 'studentProfile')
        ->create(['skill_taxonomy_id' => $oldSkill->getKey()]);
    ProfileInterest::factory()
        ->for($profile, 'studentProfile')
        ->create(['skill_taxonomy_id' => $oldInterest->getKey()]);

    $this->actingAs($student)
        ->patchJson(route('student-profiles.update', $profile), [
            'bio' => 'Bio yang sudah diperbarui.',
            'study_program' => 'Sistem Informasi',
            'study_year' => 4,
            'skills' => [[
                'taxonomy_id' => $newSkill->getKey(),
                'proficiency' => 'expert',
            ]],
            'interests' => [$newInterest->getKey()],
        ])
        ->assertSuccessful()
        ->assertJsonPath('data.bio', 'Bio yang sudah diperbarui.')
        ->assertJsonPath('data.study_year', 4)
        ->assertJsonPath('data.skills.0.taxonomy_id', $newSkill->getKey())
        ->assertJsonPath('data.interests.0.taxonomy_id', $newInterest->getKey());

    expect($profile->refresh()->study_program)->toBe('Sistem Informasi')
        ->and(ProfileSkill::query()
            ->whereBelongsTo($profile, 'studentProfile')
            ->where('skill_taxonomy_id', $oldSkill->getKey())
            ->exists())->toBeFalse()
        ->and(ProfileInterest::query()
            ->whereBelongsTo($profile, 'studentProfile')
            ->where('skill_taxonomy_id', $oldInterest->getKey())
            ->exists())->toBeFalse()
        ->and(AuditLog::query()->where('operation', 'profile.updated')->exists())->toBeTrue();
});

test('profile visibility settings remain independent and append consent history', function () {
    [$student, $institution] = verifiedStudentForProfileTests();
    $profile = StudentProfile::factory()->for($student)->for($institution)->create();

    $this->actingAs($student)
        ->patchJson(route('student-profiles.visibility.update', $profile), [
            'recruiter_discoverable' => true,
        ])
        ->assertSuccessful()
        ->assertJsonPath('data.portfolio_visibility', 'private')
        ->assertJsonPath('data.recruiter_discoverable', true);

    expect($profile->refresh()->portfolio_visibility->value)->toBe('private')
        ->and(app(ConsentRecorder::class)->current($student, 'portfolio.visibility'))->toBeNull()
        ->and(app(ConsentRecorder::class)->current($student, 'recruiter.discoverability')?->isGrant())
        ->toBeTrue();

    $this->actingAs($student)
        ->patchJson(route('student-profiles.visibility.update', $profile), [
            'portfolio_visibility' => 'public',
        ])
        ->assertSuccessful();

    expect($profile->refresh()->portfolio_visibility->value)->toBe('public')
        ->and($profile->recruiter_discoverable)->toBeTrue()
        ->and(app(ConsentRecorder::class)->current($student, 'portfolio.visibility')?->isGrant())
        ->toBeTrue();

    $this->actingAs($student)
        ->patchJson(route('student-profiles.visibility.update', $profile), [
            'recruiter_discoverable' => false,
        ])
        ->assertSuccessful();

    expect($profile->refresh()->portfolio_visibility->value)->toBe('public')
        ->and($profile->recruiter_discoverable)->toBeFalse()
        ->and(app(ConsentRecorder::class)->current($student, 'recruiter.discoverability')?->isGrant())
        ->toBeFalse();
});

test('profile availability rejects overlapping windows without deleting existing data', function () {
    [$student, $institution] = verifiedStudentForProfileTests();
    $profile = StudentProfile::factory()->for($student)->for($institution)->create();
    $profile->availabilityWindows()->create([
        'day_of_week' => 1,
        'starts_at' => '09:00:00',
        'ends_at' => '10:00:00',
        'timezone' => 'Asia/Jakarta',
    ]);

    $this->actingAs($student)
        ->putJson(route('student-profiles.availability.update', $profile), [
            'timezone' => 'Asia/Jakarta',
            'windows' => [
                ['day_of_week' => 1, 'starts_at' => '09:30', 'ends_at' => '11:00'],
                ['day_of_week' => 1, 'starts_at' => '10:30', 'ends_at' => '12:00'],
            ],
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('windows');

    expect($profile->availabilityWindows()->count())->toBe(1)
        ->and($profile->availabilityWindows()->first()->starts_at)->toBe('09:00:00');
});

test('profile updates reject values outside realistic ranges without changing existing data', function () {
    [$student, $institution] = verifiedStudentForProfileTests();
    $profile = StudentProfile::factory()->for($student)->for($institution)->create([
        'bio' => 'Bio yang tetap valid.',
        'study_year' => 3,
    ]);

    $this->actingAs($student)
        ->patchJson(route('student-profiles.update', $profile), [
            'bio' => str_repeat('x', 2001),
            'study_year' => 0,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['bio', 'study_year']);

    expect($profile->refresh()->bio)->toBe('Bio yang tetap valid.')
        ->and($profile->study_year)->toBe(3);
});

test('stale profile writes are rejected without changing profile, consent, or audit history', function () {
    [$student, $institution] = verifiedStudentForProfileTests();
    $profile = StudentProfile::factory()->for($student)->for($institution)->create();
    $profile->availabilityWindows()->create([
        'day_of_week' => 1,
        'starts_at' => '09:00:00',
        'ends_at' => '10:00:00',
        'timezone' => 'Asia/Jakarta',
    ]);
    $expectedUpdatedAt = $profile->updated_at->toIso8601String();
    $nextUpdatedAt = $profile->updated_at->copy()->addSecond();

    Carbon::setTestNow($nextUpdatedAt);
    $profile->forceFill(['bio' => 'Perubahan dari sesi lain.'])->save();
    Carbon::setTestNow();

    $auditCount = AuditLog::query()->count();

    $this->actingAs($student)
        ->patchJson(route('student-profiles.update', $profile), [
            'bio' => 'Draft lama yang tidak boleh menimpa data terbaru.',
            'expected_updated_at' => $expectedUpdatedAt,
        ])
        ->assertConflict();

    $this->actingAs($student)
        ->patchJson(route('student-profiles.visibility.update', $profile), [
            'recruiter_discoverable' => true,
            'expected_updated_at' => $expectedUpdatedAt,
        ])
        ->assertConflict();

    $this->actingAs($student)
        ->putJson(route('student-profiles.availability.update', $profile), [
            'timezone' => 'Asia/Jakarta',
            'windows' => [[
                'day_of_week' => 2,
                'starts_at' => '13:00',
                'ends_at' => '15:00',
            ]],
            'expected_updated_at' => $expectedUpdatedAt,
        ])
        ->assertConflict();

    expect($profile->refresh()->bio)->toBe('Perubahan dari sesi lain.')
        ->and($profile->recruiter_discoverable)->toBeFalse()
        ->and($profile->availabilityWindows()->count())->toBe(1)
        ->and($profile->availabilityWindows()->first()->day_of_week)->toBe(1)
        ->and(app(ConsentRecorder::class)->current($student, 'recruiter.discoverability'))->toBeNull()
        ->and(AuditLog::query()->count())->toBe($auditCount);
});

test('profile policy denies another tenant and an unverified student', function () {
    [$student, $institution] = verifiedStudentForProfileTests();
    $otherInstitution = Institution::factory()->active()->create();
    $otherProfile = StudentProfile::factory()->for($student)->for($otherInstitution)->create();

    expect($student->can('view', $otherProfile))->toBeFalse()
        ->and($student->can('update', $otherProfile))->toBeFalse();

    $unverified = User::factory()->create();
    $unverifiedProfile = StudentProfile::factory()->for($unverified)->for($institution)->create();

    expect($unverified->can('view', $unverifiedProfile))->toBeFalse()
        ->and($unverified->can('update', $unverifiedProfile))->toBeFalse();
});
