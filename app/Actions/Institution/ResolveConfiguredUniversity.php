<?php

namespace App\Actions\Institution;

use App\Concerns\InstitutionOwned;
use App\Enums\InstitutionStatus;
use App\Exceptions\InvalidUniversityConfiguration;
use App\Models\Institution;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

final class ResolveConfiguredUniversity
{
    public function slug(): string
    {
        $slug = config('university.slug');

        if ($slug === null || $slug === '') {
            throw new InvalidUniversityConfiguration('missing', 'Universitas belum dikonfigurasi. Tetapkan SATU_UNIVERSITY_SLUG melalui deployment.');
        }

        if (! is_string($slug) || strlen($slug) > 255 || preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/D', $slug) !== 1) {
            throw new InvalidUniversityConfiguration('invalid', 'Konfigurasi universitas tidak valid. Gunakan slug institusi yang tersimpan.');
        }

        return $slug;
    }

    public function handle(Institution|InstitutionOwned|null $source = null): Institution
    {
        $query = Institution::query()->where('slug', $this->slug());
        if (DB::transactionLevel() > 0) {
            $query->sharedLock();
        }
        $institution = $query->first();

        if ($institution === null || $institution->status !== InstitutionStatus::Active) {
            throw new InvalidUniversityConfiguration('unavailable', 'Universitas yang dikonfigurasi belum tersedia atau tidak aktif. Periksa konfigurasi dan data institusi melalui deployment.');
        }

        if ($source !== null && ! $this->belongsTo($source, $institution)) {
            throw new InvalidUniversityConfiguration('boundary_mismatch', 'Resource tidak sesuai dengan universitas yang dikonfigurasi.');
        }

        return $institution;
    }

    private function belongsTo(Institution|InstitutionOwned $source, Institution $institution): bool
    {
        if (! $source instanceof Model || ! $source->exists || $source->isDirty([$source->getKeyName(), 'institution_id'])) {
            return false;
        }

        $persisted = $source->newQuery()->whereKey($source->getKey())->first();

        if ($source instanceof Institution) {
            return $persisted instanceof Institution && $persisted->is($institution);
        }

        return $persisted instanceof InstitutionOwned
            && $persisted->institutionId() === $source->institutionId()
            && $persisted->institutionId() === $institution->getKey();
    }
}
