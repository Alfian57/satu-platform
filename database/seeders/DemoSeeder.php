<?php

namespace Database\Seeders;

use App\Enums\InstitutionDomainStatus;
use App\Enums\InstitutionMembershipRole;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\InstitutionStatus;
use App\Models\AuditLog;
use App\Models\Institution;
use App\Models\InstitutionDomain;
use App\Models\InstitutionMembership;
use App\Models\User;
use Faker\Factory as Faker;
use Faker\Generator;
use Illuminate\Database\Seeder;

class DemoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $state = config('app.demo_state', 'typical'); // minimum, typical, maximum

        $this->command->info("Seeding truthful synthetic demo dataset for {$state} state...");

        // Ensure deterministic generation
        $faker = Faker::create('id_ID');
        $faker->seed(12345);

        // We set the global faker seed as well
        fake()->seed(12345);

        match ($state) {
            'minimum' => $this->seedMinimum($faker),
            'typical' => $this->seedTypical($faker),
            'maximum' => $this->seedMaximum($faker),
            default => $this->seedTypical($faker),
        };

        $this->command->info('Synthetic dataset seeded successfully.');
    }

    private function seedMinimum(Generator $faker): void
    {
        $this->createSyntheticInstitution($faker, 'Universitas Sintetik Minimum', 10);
    }

    private function seedTypical(Generator $faker): void
    {
        $this->createSyntheticInstitution($faker, 'Universitas Sintetik Alpha', 50);
        $this->createSyntheticInstitution($faker, 'Institut Teknologi Sintetik Beta', 30);
    }

    private function seedMaximum(Generator $faker): void
    {
        for ($i = 1; $i <= 10; $i++) {
            $this->createSyntheticInstitution($faker, "Politeknik Sintetik {$i}", 100);
        }
    }

    private function createSyntheticInstitution(Generator $faker, string $name, int $userCount): void
    {
        // Deterministic institution
        $institution = Institution::factory()->create([
            'name' => $name,
            'status' => InstitutionStatus::Active,
        ]);

        $domainStr = strtolower(str_replace(' ', '', $name)).'.ac.id';

        InstitutionDomain::factory()->create([
            'institution_id' => $institution->id,
            'domain' => $domainStr,
            'status' => InstitutionDomainStatus::Verified,
        ]);

        // Create Campus Admin
        $admin = User::factory()->create([
            'name' => 'Admin '.$name,
            'email' => 'admin@'.$domainStr,
        ]);

        InstitutionMembership::factory()->create([
            'institution_id' => $institution->id,
            'user_id' => $admin->id,
            'role' => InstitutionMembershipRole::CampusAdmin,
            'status' => InstitutionMembershipStatus::Verified,
        ]);

        // TODO: Seed IntegrationConnections (Blocked by missing schema in main)

        // Create Students
        for ($i = 1; $i <= $userCount; $i++) {
            $student = User::factory()->create([
                'name' => $faker->name(),
                'email' => "student{$i}@".$domainStr,
            ]);

            InstitutionMembership::factory()->create([
                'institution_id' => $institution->id,
                'user_id' => $student->id,
                'role' => InstitutionMembershipRole::Student,
                'status' => InstitutionMembershipStatus::Verified,
            ]);

            if ($i % 5 === 0) {
                AuditLog::factory()->create([
                    'institution_id' => $institution->id,
                    'actor_id' => $student->id,
                    'operation' => 'student.registered',
                    'request_context' => [
                        'ip_address' => $faker->ipv4(),
                        'user_agent' => $faker->userAgent(),
                        'is_synthetic' => true,
                        'note' => 'Synthetic demo dataset',
                    ],
                ]);
            }
        }

        // TODO: Seed cross-program projects (Blocked by missing Project schema in main)
        // TODO: Seed matching reasons (Blocked by missing Matching schema in main)
        // TODO: Seed workspace history (Blocked by missing Workspace schema in main)
        // TODO: Seed contribution review (Blocked by missing Contribution schema in main)
        // TODO: Seed portfolio (Blocked by missing Portfolio schema in main)
        // TODO: Seed campus queue (Blocked by missing Campus Queue schema in main)
        // TODO: Seed gated inclusion scenario (Blocked by missing Inclusion schema in main)
    }
}
