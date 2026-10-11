<?php

namespace Database\Seeders;

use App\Actions\OpportunitySupport\ManageOpportunitySupport;
use App\Models\Institution;
use App\Models\User;
use App\Support\OpportunitySupportGovernance;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use LogicException;

class OpportunitySupportSeeder extends Seeder
{
    public function run(ManageOpportunitySupport $manage, OpportunitySupportGovernance $governance): void
    {
        if (! app()->environment('testing') || DB::connection()->getDriverName() !== 'sqlite'
            || DB::connection()->getConfig('database') !== ':memory:') {
            throw new LogicException('Fixture bantuan hanya boleh ditulis pada database pengujian di memori.');
        }
        $context = config('opportunity_support.fixture', []);
        if (! is_array($context) || ! is_int($context['institution_id'] ?? null) || ! is_int($context['owner_id'] ?? null)) {
            throw new LogicException('Institusi dan pemilik fixture harus dipilih eksplisit.');
        }
        $institution = Institution::query()->whereKey($context['institution_id'])->firstOrFail();
        $actor = User::query()->whereKey($context['owner_id'])->firstOrFail();
        if (! $governance->enabled($institution) || ($governance->settings($institution)['dataset_kind'] ?? null) !== 'synthetic') {
            throw new LogicException('Fixture tidak boleh membuka gate atau memakai dataset nyata.');
        }
        $manage->create($actor, $institution, [
            'command_key' => '00000000-0000-4000-8000-000000000009',
            'need' => 'find_role',
            'explanation' => 'Mencari peran untuk belajar bersama. Data synthetic.',
            'consent' => true,
            'notice_version' => $governance->settings($institution)['notice_version'],
        ]);
    }
}
