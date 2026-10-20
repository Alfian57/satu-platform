<?php

declare(strict_types=1);

use App\Actions\Affiliations\AcquireAffiliationReviewLock;
use App\Actions\Affiliations\ReviewAffiliationRequest;
use App\Actions\Affiliations\StoreAffiliationProfileDraft;
use App\Actions\Affiliations\SubmitAffiliationRequest;
use App\Actions\Audit\AuditRecorder;
use App\Actions\Fortify\CreateNewUser;
use App\Actions\Institution\ResolveConfiguredUniversity;
use App\Actions\InstitutionMemberships\RequestInstitutionMembership;
use App\Actions\InstitutionMemberships\TransitionInstitutionMembership;
use App\Actions\Profile\CreateStudentProfile;
use App\Actions\Profile\ResolveStudentMembership;
use App\Actions\Profile\StudentActivationSummary;
use App\Actions\Profile\StudentProfileWorkspaceQuery;
use App\Actions\Project\ProjectDiscoveryQuery;
use App\Enums\AffiliationMatchResult;
use App\Enums\AffiliationRequestStatus;
use App\Enums\AffiliationReviewDecision;
use App\Enums\AffiliationReviewReason;
use App\Enums\InstitutionMembershipRole;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\InstitutionStatus;
use App\Events\InstitutionMembershipRequested;
use App\Events\InstitutionMembershipReviewed;
use App\Events\MatchingInputsChanged;
use App\Exceptions\VerifiedPhoneRequired;
use App\Http\Controllers\ContributionPageController;
use App\Http\Controllers\InstitutionMembershipController;
use App\Http\Controllers\PortfolioPageController;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Requests\InstitutionMemberships\RequestInstitutionMembershipRequest;
use App\Models\AffiliationRequest;
use App\Models\AffiliationReview;
use App\Models\AuditLog;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\InstitutionRoster;
use App\Models\InstitutionRosterRow;
use App\Models\PhoneNumber;
use App\Models\Project;
use App\Models\StudentProfile;
use App\Models\User;
use App\Policies\InstitutionContextResolver;
use App\Support\AuditDataRedactor;
use App\Support\AuditRequestContext;
use App\Support\Project\ProjectDiscoveryFilters;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Routing\Route;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

require dirname(__DIR__, 2).'/vendor/autoload.php';
foreach (['APP_ENV' => 'testing', 'DB_CONNECTION' => 'sqlite', 'DB_DATABASE' => ':memory:'] as $key => $value) {
    putenv($key.'='.$value);
    $_ENV[$key] = $value;
    $_SERVER[$key] = $value;
}
$app = require dirname(__DIR__, 2).'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
set_exception_handler(function (Throwable $error): never {
    fwrite(STDERR, 'FAIL '.$error->getMessage().' at '.$error->getFile().':'.$error->getLine().PHP_EOL);
    exit(1);
});
config()->set([
    'database.default' => 'university_activation_check',
    'database.connections.university_activation_check' => ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '', 'foreign_key_constraints' => true],
    'cache.default' => 'array', 'queue.default' => 'null', 'session.driver' => 'array', 'broadcasting.default' => 'null',
    'university.slug' => 'universitas-teknologi-yogyakarta',
]);
Http::fake();
Http::preventStrayRequests();
Queue::fake();
if (! app()->environment('testing') || DB::connection()->getName() !== 'university_activation_check' || DB::connection()->getConfig('database') !== ':memory:') {
    throw new RuntimeException('Pemeriksaan aktivasi hanya pada SQLite di memori.');
}
foreach (glob($app->databasePath('migrations/*.php')) as $migration) {
    (require $migration)->up();
}
$passed = 0;
function activationCheck(bool $condition, string $message): void
{
    global $passed;
    if (! $condition) {
        throw new RuntimeException($message);
    }
    $passed++;
    echo 'PASS '.$message.PHP_EOL;
}
function activationReject(callable $operation, string $expected, string $message): void
{
    try {
        $operation();
    } catch (Throwable $error) {
        if (! $error instanceof $expected) {
            throw $error;
        }
        activationCheck(true, $message);

        return;
    }
    throw new RuntimeException($message);
}
function activationAccount(): User
{
    $user = User::factory()->create();
    PhoneNumber::factory()->create(['user_id' => $user->id]);

    return $user;
}
function activationCounts(): array
{
    return [InstitutionMembership::count(), AffiliationRequest::count(), AffiliationReview::count(), StudentProfile::count(), AuditLog::count()];
}

$other = Institution::factory()->active()->create(['name' => 'Kampus lama. Data synthetic']);
$campus = Institution::factory()->active()->create(['slug' => 'universitas-teknologi-yogyakarta', 'name' => 'Universitas Teknologi Yogyakarta. Data synthetic']);
$resolver = $app->make(ResolveConfiguredUniversity::class);
$summary = $app->make(StudentActivationSummary::class);
$memberships = $app->make(ResolveStudentMembership::class);
$submit = $app->make(SubmitAffiliationRequest::class);
$create = $app->make(CreateStudentProfile::class);
$workspace = $app->make(StudentProfileWorkspaceQuery::class);
$student = activationAccount();
Event::fake([InstitutionMembershipRequested::class, InstitutionMembershipReviewed::class, MatchingInputsChanged::class]);

$before = activationCounts();
DB::enableQueryLog();
$activation = $summary->handle($student);
activationCheck($activation['institutionId'] === $campus->id && $activation['institutionName'] === $campus->name && $activation['required'], 'Nama UTY berasal dari konfigurasi, bukan institusi pertama.');
activationCheck(! array_key_exists('institutions', $activation) && ! array_key_exists('username', $activation) && ! array_key_exists('phone', $activation), 'Shared props tidak memuat daftar kampus, username atau nomor telepon.');
activationCheck($activation['membershipStatus'] === 'unverified' && $activation['profileId'] === null && activationCounts() === $before, 'Akun dan WhatsApp verified tidak otomatis membuat afiliasi atau profil pada GET.');
activationCheck(array_all(DB::getQueryLog(), fn (array $query): bool => str_starts_with(strtolower($query['query']), 'select')), 'Ringkasan aktivasi hanya membaca SELECT.');
DB::disableQueryLog();
activationCheck($workspace->execute($student, $campus->id)['profile'] === null, 'Editor tanpa afiliasi menampilkan pemulihan UTY, bukan profil default.');

$academic = ['faculty' => 'Fakultas Sains & Teknologi', 'study_program' => 'Informatika (S1)', 'admission_year' => 2023];
$request = RequestInstitutionMembershipRequest::create('/institution-memberships', 'POST', $academic);
$rules = $request->rules($resolver);
activationCheck(Validator::make([...$academic, 'nim' => 'UTY-SYNTHETIC'], $rules)->passes(), 'Pengajuan lengkap tidak membutuhkan ID kampus dari browser.');
activationCheck(Validator::make([...$academic, 'institution_id' => (string) $campus->id, 'nim' => 'UTY-SYNTHETIC'], $rules)->passes(), 'Klien existing dengan ID UTY tetap kompatibel.');
foreach (['nim', 'faculty', 'study_program', 'admission_year'] as $field) {
    $incomplete = [...$academic, 'nim' => 'UTY-SYNTHETIC'];
    unset($incomplete[$field]);
    activationCheck(! Validator::make($incomplete, $rules)->passes(), 'Pengajuan menolak field wajib yang dihilangkan: '.$field.'.');
}
$editorRequest = Request::create('/student-profiles/edit');
$editorRequest->setUserResolver(fn (): User => $student);
$editorRequest->setRouteResolver(fn (): Route => (new Route(['GET'], 'student-profiles/edit', fn () => null))->name('student-profiles.edit'));
activationCheck($app->make(HandleInertiaRequests::class)->share($editorRequest)['onboarding']()['required'], 'URL editor profil tidak melewati pop-up afiliasi wajib.');
foreach ([$other->id, null, [$campus->id], 'campus', -1] as $id) {
    activationCheck(! Validator::make([...$academic, 'institution_id' => $id, 'nim' => 'UTY-SYNTHETIC'], $rules)->passes(), 'ID universitas lain atau bentuk input tidak sah ditolak.');
}
activationReject(fn () => $submit->handle($student, $other, 'UTY-SYNTHETIC'), AuthorizationException::class, 'Action afiliasi menolak kampus lain tanpa bergantung pada UI.');
activationReject(fn () => $app->make(RequestInstitutionMembership::class)->handle($student, $other), AuthorizationException::class, 'Action membership langsung tidak melewati batas universitas.');
activationCheck(activationCounts() === $before, 'Penolakan lintas universitas tidak meninggalkan membership, request atau audit.');

$pending = $submit->handle($student, $campus, 'UTY-SYNTHETIC');
activationCheck($pending->match_result === AffiliationMatchResult::RosterUnavailable && $pending->status === AffiliationRequestStatus::PendingReview, 'Roster belum tersedia menghasilkan peninjauan manual, bukan penolakan mahasiswa.');
activationCheck($pending->membership->role === InstitutionMembershipRole::Student && $pending->membership->status === InstitutionMembershipStatus::Pending, 'Afiliasi publik tetap mahasiswa pending, bukan grant admin.');
activationCheck($summary->handle($student)['profileId'] === null && ! $summary->handle($student)['required'], 'Pending tidak mengklaim profil tersimpan atau memaksa modal berulang.');
activationReject(fn () => $create->handle($student, $campus, []), AuthorizationException::class, 'Profil tidak disimpan sebelum afiliasi verified.');
$before = activationCounts();
$repeated = $submit->handle($student, $campus, ' UTY-SYNTHETIC ');
activationCheck($repeated->id === $pending->id && activationCounts() === $before, 'Pengajuan identik pending idempotent, tanpa duplikasi riwayat.');

$admin = activationAccount();
InstitutionMembership::factory()->campusAdmin()->verifiedByCampusAdmin()->create(['user_id' => $admin->id, 'institution_id' => $campus->id]);
$lock = $app->make(AcquireAffiliationReviewLock::class);
$review = $app->make(ReviewAffiliationRequest::class);
$locked = $lock->handle($pending, $admin);
$review->handle($locked, $admin, AffiliationReviewDecision::RequestRevision, AffiliationReviewReason::NimCorrectionRequired, $locked->version, 'Periksa isian synthetic.');
activationCheck($summary->handle($student)['affiliationStatus'] === 'revision_required' && $summary->handle($student)['canSubmitAffiliation'], 'Permintaan revisi tetap dapat diperbaiki tanpa dianggap verified.');
$revised = $submit->handle($student, $campus, 'UTY-SYNTHETIC-CORRECTED');
activationCheck($revised->version > $pending->version && AffiliationReview::where('affiliation_request_id', $pending->id)->count() === 1, 'Perbaikan NIM mempertahankan keputusan dan menaikkan versi sumber.');
$locked = $lock->handle($revised, $admin);
$review->handle($locked, $admin, AffiliationReviewDecision::Reject, AffiliationReviewReason::NotAffiliated, $locked->version, 'Fixture penolakan synthetic.');
activationCheck($summary->handle($student)['affiliationStatus'] === 'rejected' && $summary->handle($student)['membershipStatus'] === 'unverified', 'Penolakan tetap mempunyai status pemulihan, tidak memberi akses profil.');
$retry = $submit->handle($student, $campus, 'UTY-SYNTHETIC-CORRECTED');
$locked = $lock->handle($retry, $admin);
$review->handle($locked, $admin, AffiliationReviewDecision::Approve, AffiliationReviewReason::RecordsConfirmed, $locked->version, 'Pemeriksaan manual fixture synthetic.');
activationCheck($summary->handle($student)['membershipStatus'] === 'verified' && AffiliationReview::where('affiliation_request_id', $pending->id)->count() === 3, 'Persetujuan manual memakai admin UTY serta riwayat append-only.');
activationCheck($summary->handle($student)['required'] && $summary->handle($student)['profileId'] === null, 'Profil belum ada sesudah persetujuan membuka tahap kemampuan.');
activationCheck(! $app->make(HandleInertiaRequests::class)->share($editorRequest)['onboarding']()['required'], 'Editor yang sudah berotorisasi dapat melengkapi profil tanpa ditutupi pop-up.');
$profile = $create->handle($student, $campus, ['skills' => [], 'availability_windows' => []]);
activationCheck(! $summary->handle($student)['required'], 'Profil tersimpan tidak dipaksa mengulang onboarding karena keahlian atau jadwal kosong.');
activationCheck($profile->skills()->count() === 0 && $profile->availabilityWindows()->count() === 0 && $profile->portfolio_visibility->value === 'private', 'Pemula tanpa karya, keahlian atau jadwal dapat menyimpan profil privat.');
Project::factory()->create(['institution_id' => $campus->id, 'owner_id' => $admin->id]);
activationCheck($app->make(ProjectDiscoveryQuery::class)->execute($student, ProjectDiscoveryFilters::fromValidated([]))->institution->id === $campus->id, 'Mahasiswa verified tanpa karya dapat menelusuri peluang UTY.');
$before = activationCounts();
$submittedNim = $retry->fresh()->nim;
$submit->handle($student, $campus, 'NIM-LAIN');
activationCheck($retry->fresh()->nim === $submittedNim && activationCounts() === $before, 'Pengajuan ulang tidak mengubah NIM afiliasi verified atau menimpa profil existing.');

$roster = InstitutionRoster::factory()->create(['institution_id' => $campus->id]);
$exactStudent = activationAccount();
$phone = $exactStudent->phoneNumbers()->sole();
InstitutionRosterRow::factory()->create(['roster_id' => $roster->id, 'nim' => 'uty-exact', 'phone_hash' => $phone->number_hash]);
$exact = $submit->handle($exactStudent, $campus, ' UTY-EXACT ');
activationCheck($exact->match_result === AffiliationMatchResult::Exact && $exact->membership->status === InstitutionMembershipStatus::Verified, 'Exact NIM dan verified phone yang sama mengaktifkan afiliasi UTY.');
$mismatchStudent = activationAccount();
$mismatch = $submit->handle($mismatchStudent, $campus, 'uty-exact');
activationCheck($mismatch->match_result === AffiliationMatchResult::Ambiguous && $mismatch->membership->status === InstitutionMembershipStatus::Pending, 'NIM sama dengan nomor berbeda tidak menjadi afiliasi verified.');
$noMatch = $submit->handle(activationAccount(), $campus, 'not-in-roster');
activationCheck($noMatch->match_result === AffiliationMatchResult::NoMatch && $noMatch->status === AffiliationRequestStatus::PendingReview, 'NIM yang tidak ada pada roster tetap dapat ditinjau manual.');
$unverifiedPhoneUser = User::factory()->create();
PhoneNumber::factory()->revoked()->create(['user_id' => $unverifiedPhoneUser->id]);
$before = activationCounts();
activationReject(fn () => $submit->handle($unverifiedPhoneUser, $campus, 'uty-exact'), VerifiedPhoneRequired::class, 'Nomor belum verified tidak memperoleh afiliasi walaupun NIM cocok.');
activationCheck(! $summary->handle($unverifiedPhoneUser)['canSubmitAffiliation'] && activationCounts() === $before, 'Pemulihan nomor tidak menciptakan data afiliasi tersembunyi.');
activationReject(fn () => $app->make(RequestInstitutionMembership::class)->handle($unverifiedPhoneUser, $campus), VerifiedPhoneRequired::class, 'Action membership langsung juga memerlukan verified phone.');

$legacy = activationAccount();
$oldMembership = InstitutionMembership::factory()->student()->verifiedByRosterExactMatch()->create(['user_id' => $legacy->id, 'institution_id' => $other->id]);
$oldProfile = StudentProfile::factory()->create(['user_id' => $legacy->id, 'institution_id' => $other->id, 'bio' => 'Data privat kampus lama.']);
$oldAttributes = $oldMembership->fresh()->getRawOriginal();
$oldProfileAttributes = $oldProfile->fresh()->getRawOriginal();
$activation = $summary->handle($legacy);
activationCheck($activation['institutionId'] === $campus->id && $activation['hasLegacyAffiliation'] && $activation['profileId'] === null && $activation['bio'] === '', 'Akun lama membaca UTY tanpa memproyeksikan profil kampus lain.');
activationCheck($memberships->handle($legacy) === null && ! Gate::forUser($legacy)->allows('view', $oldProfile), 'Membership kampus lama tidak menjadi konteks atau akses mahasiswa aktif.');
activationReject(fn () => $workspace->execute($legacy, $other->id), AuthorizationException::class, 'Query ID kampus lama ditolak walaupun membership verified milik sendiri.');
activationReject(fn () => $app->make(ProjectDiscoveryQuery::class)->execute($legacy, ProjectDiscoveryFilters::fromValidated(['institution_id' => $other->id])), AuthorizationException::class, 'Peluang kampus lama tidak dapat dipilih melalui parameter URL.');
activationCheck($app->make(InstitutionContextResolver::class)->resolve($legacy, $other, [InstitutionMembershipRole::Student]) === null, 'Policy resource dan broadcast menolak konteks mahasiswa kampus lain.');
$legacyPending = $submit->handle($legacy, $campus, 'legacy-uty');
activationCheck($legacyPending->membership->status === InstitutionMembershipStatus::Pending && $oldMembership->fresh()->getRawOriginal() === $oldAttributes && $oldProfile->fresh()->getRawOriginal() === $oldProfileAttributes, 'Aktivasi UTY akun lama memakai bukti baru tanpa memindahkan riwayat atau profil.');
$newRoster = InstitutionRoster::factory()->create(['institution_id' => $campus->id, 'activated_at' => now()->addMinute()]);
activationCheck($summary->handle($legacy)['needsRosterRefresh'], 'Roster baru memberi pemulihan pencocokan ulang tanpa menulis pada GET.');
$refreshed = $submit->handle($legacy, $campus, 'legacy-uty');
activationCheck($refreshed->roster_id === $newRoster->id && $refreshed->version > $legacyPending->version && ! $summary->handle($legacy)['needsRosterRefresh'], 'Pengajuan eksplisit pada roster baru menaikkan versi, bukan memakai snapshot lama.');
InstitutionMembership::factory()->student()->verifiedByRosterExactMatch()->create(['user_id' => $student->id, 'institution_id' => $other->id, 'requested_at' => now()->addDay(), 'verified_at' => now()->addDay()]);
activationCheck($memberships->handle($student)->institution_id === $campus->id, 'Afiliasi kampus lain yang lebih baru tidak mengganti konteks verified UTY.');
$portfolioMethod = new ReflectionMethod(PortfolioPageController::class, 'activeProfile');
activationCheck($portfolioMethod->invoke($app->make(PortfolioPageController::class), $student)->id === $profile->id, 'Portofolio memakai profil UTY, bukan membership terbaru.');
$contributionMethod = new ReflectionMethod(ContributionPageController::class, 'verifiedStudentInstitutionIds');
activationCheck($contributionMethod->invoke($app->make(ContributionPageController::class), $student) === [$campus->id], 'Daftar kontribusi hanya memakai konteks UTY.');

$exactMembership = $exact->membership;
$app->make(TransitionInstitutionMembership::class)->handle($exactMembership, InstitutionMembershipStatus::Suspended);
$before = activationCounts();
activationReject(fn () => $submit->handle($exactStudent, $campus, 'uty-exact'), AuthorizationException::class, 'NIM exact tidak memulihkan akses suspended melalui pengajuan ulang.');
activationCheck($summary->handle($exactStudent)['membershipStatus'] === 'suspended' && ! $summary->handle($exactStudent)['canSubmitAffiliation'] && activationCounts() === $before, 'Suspended mempertahankan status, riwayat dan keadaan terkunci.');

foreach (['' => 'missing', 'NOT A SLUG' => 'invalid', 'unknown-university' => 'unavailable'] as $slug => $state) {
    config()->set('university.slug', $slug);
    $before = activationCounts();
    $activation = $summary->handle($student);
    activationCheck($activation['universityState'] === $state && $activation['institutionId'] === null && $activation['profileId'] === null && ! $activation['canSubmitAffiliation'], 'Konfigurasi '.$state.' terkunci tanpa fallback institusi pertama atau data privat.');
    activationReject(fn () => $request->rules($resolver), ValidationException::class, 'Form request menolak konfigurasi '.$state.'.');
    activationReject(fn () => $submit->handle($student, $campus, 'uty-exact'), AuthorizationException::class, 'Action menolak konfigurasi '.$state.'.');
    activationCheck($memberships->handle($student) === null && ! Gate::forUser($student)->allows('view', $profile) && activationCounts() === $before, 'Konfigurasi '.$state.' tidak memberi akses dari snapshot membership atau mutasi data.');
}
config()->set('university.slug', $campus->slug);
$campus->forceFill(['status' => InstitutionStatus::Suspended])->save();
activationCheck($summary->handle($student)['universityState'] === 'unavailable' && $workspace->execute($student)['profile'] === null, 'Universitas tidak aktif menutup profil serta menampilkan pemulihan.');
$campus->forceFill(['status' => InstitutionStatus::Active])->save();
activationCheck($summary->handle($student)['profileId'] === $profile->id, 'Pemulihan konfigurasi membuka sumber UTY existing tanpa membuat profil ulang.');

$inertiaRequest = Request::create('/dashboard');
$inertiaRequest->setUserResolver(fn (): User => $student);
$inertiaRequest->setRouteResolver(fn (): Route => (new Route(['GET'], 'dashboard', fn () => null))->name('dashboard'));
$shared = $app->make(HandleInertiaRequests::class)->share($inertiaRequest);
activationCheck($campus->id === $shared['onboarding']()['institutionId'] && $shared['shell']['institutionMembership']()['institutionName'] === $campus->name, 'Shell dan onboarding memakai sumber universitas mahasiswa yang sama.');
$inertiaRequest->setRouteResolver(fn (): Route => (new Route(['GET'], 'portfolio/share', fn () => null))->name('portfolio.share'));
$public = $app->make(HandleInertiaRequests::class)->share($inertiaRequest);
activationCheck($public['onboarding'] === null && $public['auth']['user'] === null && $public['shell']['institutionMembership'] === null, 'Portofolio publik tidak menerima ringkasan aktivasi atau NIM pemilik akun.');

$httpStudent = activationAccount();
$httpRequest = RequestInstitutionMembershipRequest::create('/institution-memberships', 'POST', [...$academic, 'nim' => 'http-synthetic', 'role' => 'campus_admin', 'is_platform_admin' => true]);
$httpRequest->setContainer($app)->setRedirector($app->make('redirect'));
$httpRequest->setUserResolver(fn (): User => $httpStudent);
$httpRequest->setLaravelSession($app->make('session')->driver());
$httpRequest->validateResolved();
$response = $app->make(InstitutionMembershipController::class)->store($httpRequest, $submit, $resolver);
activationCheck($response->isRedirect(route('dashboard')) && $memberships->handle($httpStudent)->role === InstitutionMembershipRole::Student, 'Controller memakai UTY dari server dan mengabaikan input role istimewa.');
$foreignRequest = RequestInstitutionMembershipRequest::create('/institution-memberships', 'POST', [...$academic, 'nim' => 'http-synthetic', 'institution_id' => $other->id]);
$foreignRequest->setContainer($app)->setRedirector($app->make('redirect'));
$foreignRequest->setUserResolver(fn (): User => $httpStudent);
$foreignRequest->setLaravelSession($app->make('session')->driver());
$before = activationCounts();
activationReject(fn () => $foreignRequest->validateResolved(), ValidationException::class, 'Form request HTTP menolak ID universitas lain sebelum Controller.');
activationCheck(activationCounts() === $before, 'Validasi HTTP lintas kampus tidak menambah riwayat.');
$driftRequest = RequestInstitutionMembershipRequest::create('/institution-memberships', 'POST', [...$academic, 'nim' => 'http-synthetic', 'institution_id' => $campus->id]);
$driftRequest->setContainer($app)->setRedirector($app->make('redirect'));
$driftRequest->setUserResolver(fn (): User => $httpStudent);
$driftRequest->setLaravelSession($app->make('session')->driver());
$driftRequest->validateResolved();
config()->set('university.slug', $other->slug);
activationReject(fn () => $app->make(InstitutionMembershipController::class)->store($driftRequest, $submit, $resolver), ValidationException::class, 'Controller menolak konteks yang berubah setelah validasi request.');
activationCheck(activationCounts() === $before, 'Perubahan konteks antara validasi dan command tidak memindahkan afiliasi.');
config()->set('university.slug', $campus->slug);
$registrationRequest = Request::create('/register', 'POST');
$registrationRequest->setLaravelSession($app->make('session')->driver());
$app->instance('request', $registrationRequest);
$input = ['name' => 'Pendaftar. Data synthetic', 'username' => 'u04_student', 'password' => 'SyntheticStrong!2026', 'password_confirmation' => 'SyntheticStrong!2026', 'role' => 'campus_admin', 'is_platform_admin' => '1'];
activationReject(fn () => $app->make(CreateNewUser::class)->create($input), ValidationException::class, 'Registrasi tetap menolak sesi tanpa verifikasi WhatsApp OTP.');
$registrationRequest->session()->put('auth.registration_verified', true);
$registered = $app->make(CreateNewUser::class)->create($input);
activationCheck(! $registered->is_platform_admin && $registered->institutionMemberships()->count() === 0 && StudentProfile::whereBelongsTo($registered)->count() === 0, 'Registrasi publik tidak membuat admin, afiliasi maupun profil otomatis.');

$rollbackUser = activationAccount();
$before = activationCounts();
$faultRecorder = new class($app->make(AuditDataRedactor::class), $app->make(AuditRequestContext::class)) extends AuditRecorder
{
    public function record(string $operation, ?Model $auditable = null, ?User $actor = null, ?Institution $institution = null, array $before = [], array $after = [], ?string $reason = null, ?Request $request = null): AuditLog
    {
        throw new RuntimeException('Audit synthetic gagal.');
    }
};
$faultSubmit = new SubmitAffiliationRequest($app->make(RequestInstitutionMembership::class), $app->make(TransitionInstitutionMembership::class), $faultRecorder, $resolver, $app->make(StoreAffiliationProfileDraft::class));
activationReject(fn () => $faultSubmit->handle($rollbackUser, $campus, 'rollback-synthetic'), RuntimeException::class, 'Audit gagal membatalkan seluruh operasi afiliasi.');
activationCheck(activationCounts() === $before, 'Rollback afiliasi tidak menyisakan membership, request atau audit grant.');

echo $passed.' pemeriksaan aktivasi U04 lulus. Data synthetic pada SQLite :memory:, tanpa mutasi database pengguna.'.PHP_EOL;
