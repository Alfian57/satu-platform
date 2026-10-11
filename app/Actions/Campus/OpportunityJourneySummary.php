<?php

namespace App\Actions\Campus;

use App\Enums\InstitutionMembershipRole;
use App\Enums\InstitutionMembershipStatus;
use App\Models\AuditLog;
use App\Models\Contribution;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\OpportunitySupportRequest;
use App\Models\PortfolioEntry;
use App\Models\StudentProfile;
use App\Models\TeamJoinRequest;
use App\Models\TeamMembership;
use App\Models\TeamMembershipEvent;
use App\Models\User;
use App\Support\OpportunitySupportGovernance;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Gate;

class OpportunityJourneySummary
{
    public function __construct(private readonly OpportunitySupportGovernance $governance) {}

    /** @return array<string, mixed> */
    public function handle(User $actor, Institution $institution): array
    {
        Gate::forUser($actor)->authorize('reviewAny', [OpportunitySupportRequest::class, $institution]);
        $settings = $this->governance->settings($institution);
        $base = ['state' => 'not_configured', 'snapshot_at' => now()->toISOString(), 'denominator' => null, 'metrics' => []];
        if (! $this->governance->enabled($institution)
            || ! is_string($settings['evaluation_approval'] ?? null) || trim($settings['evaluation_approval']) === ''
            || ! is_int($settings['minimum_cohort'] ?? null) || $settings['minimum_cohort'] < 2) {
            return $base;
        }
        $eligible = InstitutionMembership::query()->where('institution_id', $institution->getKey())
            ->where('role', InstitutionMembershipRole::Student)->where('status', InstitutionMembershipStatus::Verified)->select('user_id');
        $denominator = (clone $eligible)->distinct()->count('user_id');
        if ($denominator < $settings['minimum_cohort']) {
            return array_replace($base, ['state' => 'suppressed']);
        }
        $projects = fn (Builder $q) => $q->where('institution_id', $institution->getKey());
        $requests = TeamJoinRequest::query()->whereIn('requester_id', clone $eligible)->whereHas('project', $projects);
        $memberships = TeamMembership::query()->whereIn('user_id', clone $eligible)->whereHas('project', $projects)->select('id');
        $joined = TeamMembership::query()->whereIn('id', TeamMembershipEvent::query()->select('team_membership_id')
            ->whereIn('team_membership_id', $memberships)->whereIn('event', ['joined', 'rejoined']))
            ->whereIn('user_id', clone $eligible)->distinct()->count('user_id');
        $contributions = Contribution::query()->where('institution_id', $institution->getKey())
            ->whereIn('owner_id', clone $eligible)->whereHas('project', $projects);
        $submitted = AuditLog::query()->where('institution_id', $institution->getKey())
            ->where('operation', 'contribution.submitted')->where('auditable_type', (new Contribution)->getMorphClass())
            ->whereIn('actor_id', clone $eligible)
            ->whereIn('auditable_id', (clone $contributions)->select('id'))
            ->whereExists(function (\Illuminate\Database\Query\Builder $q): void {
                $audits = (new AuditLog)->getTable();
                $contributions = (new Contribution)->getTable();
                $q->selectRaw('1')->from($contributions)->whereColumn($contributions.'.id', $audits.'.auditable_id')
                    ->whereColumn($contributions.'.owner_id', $audits.'.actor_id')
                    ->whereColumn($contributions.'.institution_id', $audits.'.institution_id');
            })->distinct()->count('actor_id');
        $entries = (new PortfolioEntry)->getTable();
        $contributionTable = (new Contribution)->getTable();
        $recognized = PortfolioEntry::query()->where('institution_id', $institution->getKey())
            ->whereIn('user_id', clone $eligible)->approvedCurrent()
            ->whereHas('contribution', fn (Builder $q) => $q->whereColumn($contributionTable.'.owner_id', $entries.'.user_id')
                ->whereColumn($contributionTable.'.institution_id', $entries.'.institution_id')->whereHas('project', $projects))
            ->whereHas('sourceVersion', fn (Builder $q) => $q->whereColumn('contribution_id', $entries.'.contribution_id')
                ->whereHas('reviews', fn (Builder $review) => $review->where('decision', 'approved')))
            ->distinct()->count('user_id');

        $result = [
            'state' => 'available', 'snapshot_at' => $base['snapshot_at'], 'denominator' => $denominator,
            'metrics' => [
                ['label' => 'Profil siap untuk pencocokan', 'value' => StudentProfile::query()->where('institution_id', $institution->getKey())->whereIn('user_id', clone $eligible)->has('skills')->has('availabilityWindows')->distinct()->count('user_id'), 'source' => 'Profil dengan keahlian dan jadwal. Pernyataan sendiri, bukan uji kompetensi.'],
                ['label' => 'Pernah mengajukan', 'value' => (clone $requests)->distinct()->count('requester_id'), 'source' => 'Pengajuan tersimpan, termasuk yang ditarik. Pengguna unik, bukan jumlah pengajuan.'],
                ['label' => 'Menerima keputusan tim', 'value' => (clone $requests)->whereNotNull('responded_at')->whereIn('status', ['accepted', 'rejected'])->distinct()->count('requester_id'), 'source' => 'Keputusan accepted/rejected dengan responded_at. Pending bukan penolakan.'],
                ['label' => 'Pernah bergabung tercatat', 'value' => $joined, 'source' => 'Event joined/rejoined pada keanggotaan proyek kampus. Bukan joined_at yang dapat berubah; bukan bukti kerja bersama.'],
                ['label' => 'Pernah mengirim kontribusi', 'value' => $submitted, 'source' => 'Audit contribution.submitted yang konsisten dengan pemilik dan institusi. Riwayat sebelum audit tersedia mungkin tidak lengkap.'],
                ['label' => 'Memiliki pengakuan aktual', 'value' => $recognized, 'source' => 'Kontribusi approved, versi aktual, review approved dan karya konsisten. Karya boleh tetap privat.'],
                ['label' => 'Peluang dilihat', 'value' => null, 'source' => 'Telemetry belum tersedia. Tidak dianggap nol atau dipakai untuk menghitung drop-off.'],
                ['label' => 'Hubungan kerja baru', 'value' => null, 'source' => 'Definisi kerja bersama dan kelengkapan riwayat belum disetujui. Bergabung atau catatan dukungan tidak menggantikannya.'],
            ],
        ];
        foreach ($result['metrics'] as &$metric) {
            $value = $metric['value'];
            $metric['state'] = $value === null ? 'unavailable' : 'available';
            if ($value !== null && (($value > 0 && $value < $settings['minimum_cohort'])
                || ($denominator - $value > 0 && $denominator - $value < $settings['minimum_cohort']))) {
                $metric['value'] = null;
                $metric['state'] = 'suppressed';
            }
        }
        unset($metric);

        return $result;
    }
}
