<?php

namespace Database\Factories;

use App\Models\OpportunitySupportEvent;
use App\Models\OpportunitySupportRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<OpportunitySupportEvent> */
class OpportunitySupportEventFactory extends Factory
{
    protected $model = OpportunitySupportEvent::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'opportunity_support_request_id' => OpportunitySupportRequest::factory(),
            'actor_id' => User::factory(),
            'action' => 'note',
            'reason' => 'Catatan fixture. Bukan hasil dukungan.',
            'revision' => 1,
            'created_at' => now(),
        ];
    }
}
