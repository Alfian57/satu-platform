<?php

namespace Database\Factories;

use App\Models\Institution;
use App\Models\OpportunitySupportRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<OpportunitySupportRequest> */
class OpportunitySupportRequestFactory extends Factory
{
    protected $model = OpportunitySupportRequest::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'institution_id' => Institution::factory(),
            'owner_id' => User::factory(),
            'command_key' => (string) Str::uuid(),
            'need' => 'find_role',
            'explanation' => 'Kebutuhan peran. Data synthetic.',
            'purpose' => 'Fixture tanpa izin otomatis.',
            'consent_purpose' => 'opportunity.fixture.'.Str::uuid(),
            'notice_version' => 'fixture-v1',
            'approval_reference' => 'SYNTHETIC-FIXTURE-ONLY',
            'dataset_kind' => 'synthetic',
            'dataset_manifest' => 'factory-only-no-consent',
            'expires_at' => now()->addDay(),
        ];
    }
}
