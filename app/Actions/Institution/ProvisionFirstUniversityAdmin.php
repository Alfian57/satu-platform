<?php

namespace App\Actions\Institution;

use App\Actions\Audit\AuditRecorder;
use App\Enums\InstitutionMembershipRole;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\InstitutionStatus;
use App\Exceptions\InvalidUniversityConfiguration;
use App\Exceptions\UniversityProvisioningConflict;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\PhoneNumber;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\MultipleRecordsFoundException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class ProvisionFirstUniversityAdmin
{
    public function __construct(
        private readonly ResolveConfiguredUniversity $resolveUniversity,
        private readonly AuditRecorder $audit,
    ) {}

    /** @return array{institution_id: int, user_id: int, membership_id: int|null, status: string} */
    public function handle(int $userId, string $reason, bool $apply = false): array
    {
        if (! app()->runningInConsole()) {
            throw new AuthorizationException('Provisioning pertama hanya melalui operasi deployment.');
        }

        $reason = (string) Str::of($reason)->squish();
        if ($userId < 1 || $reason === '' || Str::length($reason) > 1000) {
            throw new UniversityProvisioningConflict('Tentukan ID akun dan alasan provisioning yang valid, maksimal 1000 karakter.');
        }

        $institution = $this->resolveUniversity->handle();

        if (! $apply) {
            return $this->provision($institution, $userId, $reason, false);
        }

        return DB::transaction(function () use ($institution, $userId, $reason): array {
            $lockedInstitution = Institution::query()->whereKey($institution->id)->lockForUpdate()->first();
            if ($lockedInstitution === null || $lockedInstitution->status !== InstitutionStatus::Active) {
                throw new InvalidUniversityConfiguration('unavailable', 'Universitas tidak aktif. Provisioning dibatalkan.');
            }

            $this->resolveUniversity->handle($lockedInstitution);

            return $this->provision($lockedInstitution, $userId, $reason, true);
        }, attempts: 5);
    }

    /** @return array{institution_id: int, user_id: int, membership_id: int|null, status: string} */
    private function provision(Institution $institution, int $userId, string $reason, bool $apply): array
    {
        $userQuery = User::query()->whereKey($userId);
        if ($apply) {
            $userQuery->lockForUpdate();
        }
        $user = $userQuery->first();
        $username = $user?->getRawOriginal('username');
        $password = $user?->getRawOriginal('password');
        if ($user === null || ! is_string($username) || trim($username) === '' || ! is_string($password) || $password === '') {
            throw new UniversityProvisioningConflict('Akun dengan identitas masuk yang lengkap diperlukan. Buat dan verifikasi akun sebelum provisioning.');
        }
        if ($user->is_platform_admin) {
            throw new UniversityProvisioningConflict('Akun admin platform lama memerlukan pemetaan U03, bukan bootstrap pertama.');
        }

        $phoneQuery = PhoneNumber::query()->verified()->whereBelongsTo($user);
        if ($apply) {
            $phoneQuery->lockForUpdate();
        }
        try {
            $phoneQuery->sole();
        } catch (ModelNotFoundException|MultipleRecordsFoundException) {
            throw new UniversityProvisioningConflict('Akun harus memiliki tepat satu nomor WhatsApp terverifikasi yang aktif.');
        }

        $membershipsQuery = $user->institutionMemberships()->orderBy('id');
        if ($apply) {
            $membershipsQuery->lockForUpdate();
        }
        $memberships = $membershipsQuery->get();
        if ($memberships->contains(static fn (InstitutionMembership $membership): bool => $membership->institution_id !== $institution->id)) {
            throw new UniversityProvisioningConflict('Akun mempunyai membership institusi lain. Tinjau pemetaan U03 terlebih dahulu.');
        }
        $membership = $memberships->first();
        if ($memberships->count() > 1 || ($membership !== null && (
            $membership->role !== InstitutionMembershipRole::CampusAdmin
            || $membership->status !== InstitutionMembershipStatus::Verified
            || $membership->verified_at === null
        ))) {
            throw new UniversityProvisioningConflict('Membership existing tidak sesuai untuk bootstrap. Gunakan transisi atau pemulihan berotorisasi.');
        }

        if ($membership !== null) {
            return $this->result($institution, $user, $membership, 'already_admin');
        }

        if ($institution->memberships()->where('role', InstitutionMembershipRole::CampusAdmin)->exists()) {
            throw new UniversityProvisioningConflict('Universitas sudah mempunyai riwayat admin. Gunakan undangan atau pemulihan berotorisasi, bukan bootstrap ulang.');
        }

        if (! $apply) {
            return $this->result($institution, $user, null, 'dry_run');
        }

        $membership = InstitutionMembership::query()->forceCreate([
            'institution_id' => $institution->id,
            'user_id' => $user->id,
            'role' => InstitutionMembershipRole::CampusAdmin,
            'status' => InstitutionMembershipStatus::Verified,
            'verified_at' => now(),
            'reviewed_at' => now(),
        ]);
        $this->audit->record(
            operation: 'university.admin.provisioned',
            auditable: $membership,
            institution: $institution,
            after: ['membership_id' => $membership->id, 'user_id' => $user->id, 'role' => $membership->role->value, 'source' => 'deployment_cli'],
            reason: $reason,
        );

        return $this->result($institution, $user, $membership, 'created');
    }

    /** @return array{institution_id: int, user_id: int, membership_id: int|null, status: string} */
    private function result(Institution $institution, User $user, ?InstitutionMembership $membership, string $status): array
    {
        return ['institution_id' => $institution->id, 'user_id' => $user->id, 'membership_id' => $membership?->id, 'status' => $status];
    }
}
