<?php

namespace App\Support;

use App\Models\Institution;
use App\Models\OpportunitySupportRequest;
use Illuminate\Support\Facades\DB;

class OpportunitySupportGovernance
{
    /** @return array<string, mixed> */
    public function settings(Institution|int $institution): array
    {
        $value = config('opportunity_support.institutions.'.($institution instanceof Institution ? $institution->getKey() : $institution), []);

        return is_array($value) ? $value : [];
    }

    public function enabled(Institution|int $institution): bool
    {
        $settings = $this->settings($institution);
        if (! config('opportunity_support.enabled', false)) {
            return false;
        }
        foreach (['purpose', 'notice_version', 'approval_reference', 'dataset_manifest'] as $key) {
            if (! is_string($settings[$key] ?? null) || trim($settings[$key]) === '' || mb_strlen($settings[$key]) > ($key === 'notice_version' ? 100 : 160)) {
                return false;
            }
        }
        if (preg_match('/^[a-z0-9]+(?:[._:-][a-z0-9]+)*$/', $settings['notice_version']) !== 1
            || ! is_int($settings['access_days'] ?? null) || $settings['access_days'] < 1
            || ! is_array($settings['reviewer_ids'] ?? null) || $settings['reviewer_ids'] === []) {
            return false;
        }
        foreach ($settings['reviewer_ids'] as $id) {
            if (! is_int($id) || $id < 1) {
                return false;
            }
        }

        return match ($settings['dataset_kind'] ?? null) {
            'real' => ($settings['real_data_approved'] ?? false) === true,
            'synthetic' => app()->environment('testing')
                && DB::connection()->getDriverName() === 'sqlite'
                && DB::connection()->getConfig('database') === ':memory:',
            default => false,
        };
    }

    public function matches(OpportunitySupportRequest $request): bool
    {
        $settings = $this->settings($request->institution_id);

        return $this->enabled($request->institution_id)
            && $request->expires_at->isFuture()
            && $request->purpose === $settings['purpose']
            && $request->notice_version === $settings['notice_version']
            && $request->approval_reference === $settings['approval_reference']
            && $request->dataset_kind === $settings['dataset_kind']
            && $request->dataset_manifest === $settings['dataset_manifest'];
    }
}
