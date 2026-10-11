<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\InstitutionStatus;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\PhoneNumber;
use App\Models\SkillTaxonomy;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

final class CoreJourneyDemoSeeder extends Seeder
{
    public const DATASET = 'core-journey-t10-synthetic-v1';

    public const PHONE = '+6281200000000';

    public const NIM = 'DEMO-T10-001';

    public function run(): void
    {
        if (! app()->environment('testing')
            || DB::connection()->getDriverName() !== 'sqlite'
            || DB::connection()->getConfig('database') !== ':memory:'
            || config('demo.core_journey_manifest') !== self::DATASET) {
            throw new RuntimeException('Dataset T10 hanya untuk SQLite di memori dengan manifest pengujian eksplisit.');
        }

        if (User::query()->exists() || Institution::query()->exists()) {
            throw new RuntimeException('Dataset T10 memerlukan database uji kosong. Tidak menghapus atau menimpa data existing.');
        }

        DB::transaction(function (): void {
            $campus = Institution::factory()->create(['name' => 'Kampus Pustaka. Data synthetic', 'status' => InstitutionStatus::Pending]);
            $other = Institution::factory()->active()->create(['name' => 'Kampus Pembatas. Data synthetic']);
            User::factory()->create(['name' => 'Admin platform. Data synthetic', 'username' => 'demo_t10_platform', 'is_platform_admin' => true]);
            $reviewer = User::factory()->create(['name' => 'Peninjau. Data synthetic', 'username' => 'demo_t10_reviewer']);
            $owner = User::factory()->create(['name' => 'Siti. Data synthetic', 'username' => 'demo_t10_owner']);
            $student = User::factory()->create(['name' => 'Budi. Data synthetic', 'username' => 'demo_t10_student']);
            $peer = User::factory()->create(['name' => 'Rekan pemula. Data synthetic', 'username' => 'demo_t10_peer']);
            $outsider = User::factory()->create(['name' => 'Mahasiswa kampus lain. Data synthetic', 'username' => 'demo_t10_outsider']);

            InstitutionMembership::factory()->campusAdmin()->verifiedByRosterExactMatch()->create(['institution_id' => $campus->getKey(), 'user_id' => $reviewer->getKey()]);
            foreach ([$owner, $peer] as $user) {
                InstitutionMembership::factory()->student()->verifiedByRosterExactMatch()->create(['institution_id' => $campus->getKey(), 'user_id' => $user->getKey()]);
            }
            InstitutionMembership::factory()->student()->verifiedByRosterExactMatch()->create(['institution_id' => $other->getKey(), 'user_id' => $outsider->getKey()]);
            PhoneNumber::factory()->forNumber(self::PHONE)->create(['user_id' => $student->getKey()]);
            SkillTaxonomy::factory()->create(['name' => 'Desain antarmuka. Data synthetic']);
        });
    }
}
