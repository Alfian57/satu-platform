<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\CreditMappingStatus;
use App\Models\AcademicCreditMapping;
use App\Models\Institution;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

/**
 * @extends Factory<AcademicCreditMapping>
 */
class AcademicCreditMappingFactory extends Factory
{
    protected $model = AcademicCreditMapping::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'institution_id' => Institution::factory(),
            'activity_type' => $this->faker->randomElement(['project', 'competition', 'research', 'organization']),
            'credit_amount' => $this->faker->randomElement([2.0, 3.0, 4.0, 6.0]),
            'status' => CreditMappingStatus::Draft,
            'effective_from' => Carbon::now(),
            'effective_to' => null,
            'approver_user_id' => null,
            'reason' => 'Curriculum credit allocation policy update.',
        ];
    }
}
