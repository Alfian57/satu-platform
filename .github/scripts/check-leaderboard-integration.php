<?php

declare(strict_types=1);

use App\Actions\Contribution\CreateContribution;
use App\Actions\Contribution\ReviewContribution;
use App\Actions\Contribution\ReviseContribution;
use App\Actions\Contribution\SubmitContribution;
use App\Actions\Gamification\AwardVerifiedContributionXp;
use App\Actions\Gamification\ReadLeaderboardProjections;
use App\Actions\Gamification\RebuildLeaderboardProjections;
use App\Actions\Gamification\ReverseXpAward;
use App\Actions\Gamification\SetLeaderboardIndividualPreference;
use App\Actions\Institution\ResolveConfiguredUniversity;
use App\Enums\ContributionReviewDecision;
use App\Enums\ContributionStatus;
use App\Enums\InstitutionRosterStatus;
use App\Enums\LeaderboardScopeType;
use App\Events\ContributionApproved;
use App\Exceptions\InvalidUniversityConfiguration;
use App\Http\Controllers\LeaderboardController;
use App\Http\Requests\LeaderboardIndexRequest;
use App\Http\Requests\UpdateLeaderboardPreferenceRequest;
use App\Jobs\RebuildLeaderboardProjections as RebuildJob;
use App\Jobs\ReconcileApprovedContributionXp;
use App\Listeners\AwardApprovedContributionXp;
use App\Listeners\AwardContributionBadges;
use App\Models\Contribution;
use App\Models\ContributionEvidence;
use App\Models\ContributionReview;
use App\Models\ContributionVersion;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\InstitutionRoster;
use App\Models\InstitutionRosterRow;
use App\Models\LeaderboardPeriod;
use App\Models\LeaderboardPreference;
use App\Models\LeaderboardProjection;
use App\Models\PortfolioEntry;
use App\Models\TeamMembership;
use App\Models\User;
use App\Models\XpLedgerEntry;
use App\Support\Contribution\ContributionSnapshot;
use Carbon\CarbonInterface;
use Database\Seeders\UtyJourneySeeder;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Bus\UniqueLock;
use Illuminate\Console\OutputStyle;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Database\Console\Seeds\SeedCommand;
use Illuminate\Events\CallQueuedListener;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Output\BufferedOutput;

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
config()->set('database.default', 'ranking_check');
config()->set('database.connections.ranking_check', ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '', 'foreign_key_constraints' => true]);
config()->set(['cache.default' => 'database', 'cache.stores.database.connection' => 'ranking_check', 'cache.serializable_classes' => false, 'queue.default' => 'sync', 'broadcasting.default' => 'null', 'university.slug' => UtyJourneySeeder::SLUG]);
Cache::purge('database');
foreach (['local', 'private'] as $disk) {
    config()->set('filesystems.disks.'.$disk, ['driver' => 'local', 'root' => sys_get_temp_dir().'/satu-ranking-'.$disk.'-'.Str::uuid(), 'throw' => true]);
    Storage::forgetDisk($disk);
}
Http::fake();
Http::preventStrayRequests();
if (DB::connection()->getConfig('database') !== ':memory:') {
    throw new RuntimeException('Pemeriksaan hanya boleh memakai SQLite di memori.');
}
foreach (glob($app->databasePath('migrations/*.php')) as $migration) {
    (require $migration)->up();
}
Carbon::setTestNow('2026-10-16 10:00:00');
$checks = 0;
function rankingCheck(bool $condition, string $message): void
{
    global $checks;
    if (! $condition) {
        throw new RuntimeException($message);
    }
    $checks++;
    echo 'PASS '.$message.PHP_EOL;
}
function rankingRejects(callable $operation, string $type, string $message): void
{
    try {
        $operation();
    } catch (Throwable $error) {
        rankingCheck($error instanceof $type, $message);

        return;
    }
    throw new RuntimeException($message);
}
function rankingProps(User $user, array $query = []): array
{
    return rankingPage($user, $query)['props'];
}
function rankingPage(User $user, array $query = []): array
{
    $request = LeaderboardIndexRequest::create('/leaderboards', 'GET', $query);
    $request->headers->set('X-Inertia', 'true');
    $request->headers->set('X-Inertia-Partial-Component', 'leaderboards/index');
    $request->headers->set('X-Inertia-Partial-Data', 'leaderboard,leaderboardRows');
    $request->setUserResolver(fn (): User => $user);
    $request->setValidator(Validator::make($query, $request->rules()));

    return app(LeaderboardController::class)->index($request)->toResponse($request)->getData(true);
}
$command = $app->make(SeedCommand::class);
$command->setOutput(new OutputStyle(new ArrayInput([]), new BufferedOutput));
$seed = $app->make(UtyJourneySeeder::class)->setContainer($app)->setCommand($command);
$seed->run();
$campus = Institution::where('slug', UtyJourneySeeder::SLUG)->sole();
$member = User::where('username', 'uty_anggota')->sole();
$admin = User::where('username', 'uty_admin')->sole();
$maya = User::where('username', 'uty_portofolio')->sole();
$period = LeaderboardPeriod::whereBelongsTo($campus)->sole();
$semester = $period->semester;
$read = app(ReadLeaderboardProjections::class);
$award = app(AwardVerifiedContributionXp::class);
rankingCheck(XpLedgerEntry::whereBelongsTo($campus)->count() === 4, 'Empat approval contoh menghasilkan tepat empat award, bukan draft, revisi atau penolakan.');
rankingCheck(LeaderboardPreference::count() === 0 && $read->handle($campus, $semester)->every(fn ($row): bool => $row->scope_type !== LeaderboardScopeType::Individual), 'Seed tidak mengaktifkan persetujuan individual.');
rankingCheck($read->handle($campus, $semester)->every(fn ($row): bool => $row->suppressed && $row->rank === null), 'Kelompok contoh di bawah lima tetap dilindungi.');
$protected = rankingProps($member);
rankingCheck(collect($protected['leaderboardRows']['rows'])->every(fn (array $row): bool => $row['score'] === null && $row['verifiedXpTotal'] === null), 'Skor serta total kelompok kecil tidak dikirim melalui payload browser.');
$before = [XpLedgerEntry::count(), LeaderboardProjection::count(), $member->getAttributes(), PortfolioEntry::count()];
$seed->run();
rankingCheck($before === [XpLedgerEntry::count(), LeaderboardProjection::count(), $member->fresh()->getAttributes(), PortfolioEntry::count()], 'Seed ulang tidak mengubah akun, karya atau menggandakan ledger dan snapshot.');

Bus::fake([RebuildJob::class]);
$approved = Contribution::where('owner_id', $member->id)->where('status', 'approved')->sole();
$pending = Contribution::where('owner_id', $member->id)->where('status', 'pending')->sole();
rankingRejects(fn () => $award->handle($pending), InvalidArgumentException::class, 'Kontribusi belum disetujui tidak mendapat XP.');
Event::forget(ContributionApproved::class);
Event::listen(ContributionApproved::class, AwardApprovedContributionXp::class);
DB::beginTransaction();
app(ReviewContribution::class)->handle($pending, $admin, ContributionReviewDecision::Approved, 1, ContributionSnapshot::revision($pending));
rankingCheck(XpLedgerEntry::count() === 4 && Bus::dispatched(RebuildJob::class)->isEmpty(), 'Approval tidak memicu award atau rebuild sebelum commit luar.');
DB::commit();
rankingCheck(XpLedgerEntry::count() === 5 && PortfolioEntry::where('contribution_id', $pending->id)->exists(), 'Approval commit tersambung ke portofolio serta consumer XP.');
rankingCheck(Bus::dispatched(RebuildJob::class)->contains(fn ($job): bool => $job->institutionId === $campus->id && $job->semester === $semester), 'Award meminta rebuild untuk tenant dan semester sumber.');
$entry = XpLedgerEntry::where('source_id', $pending->id)->sole();
config()->set('gamification.verified_contribution_amount', 9);
Carbon::setTestNow('2027-02-01 10:00:00');
$newRoster = InstitutionRoster::factory()->create(['institution_id' => $campus->id, 'semester' => '2026/2027 Genap']);
$current = rankingProps($member);
rankingCheck($current['leaderboard']['semester'] === $newRoster->semester && $current['leaderboard']['period'] === null, 'Semester roster terbaru dipilih meski hanya semester lama yang memiliki snapshot.');
rankingCheck($award->handle($pending)->id === $entry->id && XpLedgerEntry::count() === 5, 'Retry mempertahankan amount dan semester historis setelah kebijakan/semester berganti.');
rankingRejects(fn () => $award->handle($pending, amount: 9), LogicException::class, 'Amount eksplisit berbeda tidak menulis ulang award.');
config()->set('gamification.verified_contribution_amount', 1);
$oldReview = $pending->reviews()->sole();
$delayed = Contribution::factory()->approved()->create(['institution_id' => $campus->id, 'owner_id' => $member->id, 'project_id' => $pending->project_id]);
$delayedVersion = ContributionVersion::factory()->forContribution($delayed)->create();
$delayed->forceFill(['current_version_id' => $delayedVersion->id])->save();
ContributionReview::factory()->approved()->create(['contribution_version_id' => $delayedVersion->id, 'reviewer_id' => $admin->id, 'reviewed_at' => $oldReview->reviewed_at]);
rankingCheck($award->handle($delayed)->semester === $semester, 'Worker terlambat menggunakan roster saat approval, bukan semester baru.');
InstitutionRoster::whereBelongsTo($campus)->where('semester', $semester)->update(['status' => InstitutionRosterStatus::Superseded]);
app(RebuildLeaderboardProjections::class)->handle($campus, $semester);
rankingCheck($read->handle($campus, $semester)->isNotEmpty(), 'Riwayat semester masih dapat dihitung dari roster terakhir semester itu.');

foreach (Bus::dispatched(RebuildJob::class) as $job) {
    (new UniqueLock(Cache::store()))->release($job);
}
Bus::fake([RebuildJob::class]);
DB::beginTransaction();
app(SetLeaderboardIndividualPreference::class)->handle($member, $campus, true, 0);
rankingCheck(Bus::dispatched(RebuildJob::class)->isEmpty(), 'Persetujuan tidak mengantrekan rebuild sebelum commit.');
DB::rollBack();
rankingCheck(LeaderboardPreference::count() === 0 && Bus::dispatched(RebuildJob::class)->isEmpty(), 'Rollback tidak menyimpan persetujuan atau antrean.');
app(SetLeaderboardIndividualPreference::class)->handle($member, $campus, true, 0);
app(SetLeaderboardIndividualPreference::class)->handle($maya, $campus, true, 0);
app(RebuildLeaderboardProjections::class)->handle($campus, $semester);
$individuals = $read->handle($campus, $semester)->where('scope_type', LeaderboardScopeType::Individual)->values();
rankingCheck($individuals->count() === 2 && $individuals->every(fn ($row): bool => $row->rank === 1), 'Total XP sama menghasilkan shared rank, bukan urutan popularitas.');
rankingRejects(fn () => app(SetLeaderboardIndividualPreference::class)->handle($admin, $campus, true, 0), AuthorizationException::class, 'Admin tidak dapat menyalakan persetujuan individual.');
$other = Institution::factory()->active()->create();
rankingRejects(fn () => app(SetLeaderboardIndividualPreference::class)->handle($member, $other, true, 0), AuthorizationException::class, 'Persetujuan lintas universitas ditolak.');
rankingCheck(Bus::dispatched(RebuildJob::class)->contains(fn ($job): bool => $job->semester === $semester) && Bus::dispatched(RebuildJob::class)->contains(fn ($job): bool => $job->semester === $newRoster->semester), 'Perubahan persetujuan memperbarui semester aktif dan historis.');
$getCounts = [XpLedgerEntry::count(), LeaderboardPreference::count(), LeaderboardPeriod::count(), LeaderboardProjection::count()];
$props = rankingProps($member, ['semester' => $semester, 'scope' => 'individual']);
rankingCheck($props['leaderboard']['personalXp'] === 3 && count($props['leaderboardRows']['rows']) === 2, 'Pemilik melihat XP pribadinya dan daftar individu yang telah memberi izin.');
rankingCheck($getCounts === [XpLedgerEntry::count(), LeaderboardPreference::count(), LeaderboardPeriod::count(), LeaderboardProjection::count()], 'GET tidak membuat XP, periode, proyeksi atau persetujuan.');
$adminProps = rankingProps($admin, ['semester' => $semester, 'scope' => 'individual']);
rankingCheck($adminProps['leaderboard']['scope'] === 'program' && $adminProps['leaderboard']['personalXp'] === null && count($adminProps['leaderboard']['scopes']) === 2, 'Admin hanya membaca kelompok tanpa kontrol individu atau XP pribadi mahasiswa.');
app(SetLeaderboardIndividualPreference::class)->handle($maya, $campus, false, 1);
$withdrawn = rankingProps($member, ['semester' => $semester, 'scope' => 'individual']);
rankingCheck(count($withdrawn['leaderboardRows']['rows']) === 1, 'Penarikan izin langsung menyaring baris dari snapshot cached sebelum rebuild.');
$ownHidden = rankingProps($maya, ['semester' => $semester, 'scope' => 'individual']);
rankingCheck($ownHidden['leaderboardRows']['emptyReason'] === 'opt_in_required' && $ownHidden['leaderboard']['personalXp'] === 3, 'XP pribadi tetap tersedia meski daftar individu ditutup setelah penarikan.');
$safeJson = json_encode($props, JSON_THROW_ON_ERROR);
rankingCheck(! str_contains($safeJson, 'uty_anggota') && ! str_contains($safeJson, 'declaration') && ! str_contains($safeJson, 'phone_hash'), 'Payload peringkat tidak membuka username, pernyataan atau identitas nomor.');

$newRoster->forceFill(['status' => InstitutionRosterStatus::Superseded])->save();
InstitutionRoster::whereBelongsTo($campus)->where('semester', $semester)->update(['status' => InstitutionRosterStatus::Active]);
$groupProject = $pending->project;
for ($index = 1; $index <= 4; $index++) {
    $user = User::factory()->create(['name' => 'Anggota uji '.$index.'. Data synthetic']);
    InstitutionMembership::factory()->student()->verifiedByRosterExactMatch()->create(['user_id' => $user->id, 'institution_id' => $campus->id, 'institutional_identifier' => 'RANK-'.$index]);
    $roster = $campus->rosters()->where('semester', $semester)->latest('id')->firstOrFail();
    InstitutionRosterRow::factory()->create(['roster_id' => $roster->id, 'nim' => 'RANK-'.$index, 'semester' => $semester, 'program_studi' => 'Program uji']);
    TeamMembership::factory()->active()->create(['project_id' => $groupProject->id, 'user_id' => $user->id]);
    $source = Contribution::factory()->approved()->create(['institution_id' => $campus->id, 'owner_id' => $user->id, 'project_id' => $groupProject->id]);
    $version = ContributionVersion::factory()->forContribution($source)->create();
    $source->forceFill(['current_version_id' => $version->id])->save();
    ContributionReview::factory()->approved()->create(['contribution_version_id' => $version->id, 'reviewer_id' => $admin->id]);
    $award->handle($source, semester: $semester);
}
app(RebuildLeaderboardProjections::class)->handle($campus, $semester);
$team = $read->handle($campus, $semester)->first(fn ($row): bool => $row->scope_type === LeaderboardScopeType::Team && $row->scope_id === $groupProject->id);
rankingCheck($team !== null && ! $team->suppressed && $team->cohort_size === 5 && $team->score === '1.4000', 'Lima anggota aktif memublikasikan rata-rata XP, bukan total kelompok.');

app(ReverseXpAward::class)->handle($entry, $admin);
app(RebuildLeaderboardProjections::class)->handle($campus, $semester);
$memberRank = $read->handle($campus, $semester)->first(fn ($row): bool => $row->scope_type === LeaderboardScopeType::Individual && $row->scope_id === $member->id);
rankingCheck($memberRank->verified_xp_total === 2 && XpLedgerEntry::where('reversal_reference_id', $entry->id)->count() === 1, 'Reversal mengurangi XP tanpa menghapus award.');
$reversalCount = XpLedgerEntry::count();
app(ReverseXpAward::class)->handle($entry, $admin);
rankingCheck(XpLedgerEntry::count() === $reversalCount, 'Retry reversal tidak menggandakan pengurangan XP.');
rankingCheck($read->handle($other, $semester)->isEmpty(), 'Pembacaan snapshot tidak menyeberang tenant.');
rankingCheck(Http::recorded()->isEmpty(), 'Seluruh pemeriksaan tanpa provider eksternal.');
$withdrawal = LeaderboardPreference::whereBelongsTo($maya)->sole()->getAttributes();
rankingRejects(fn () => app(SetLeaderboardIndividualPreference::class)->handle($maya, $campus, true, 1), ValidationException::class, 'Tab lama tidak boleh membatalkan penarikan izin yang lebih baru.');
rankingCheck(LeaderboardPreference::whereBelongsTo($maya)->sole()->getAttributes() === $withdrawal, 'Konflik versi tidak mengubah izin, versi atau waktu persetujuan.');
$preferenceRules = (new UpdateLeaderboardPreferenceRequest)->rules();
rankingCheck(Validator::make(['is_opted_in' => true], $preferenceRules)->fails() && Validator::make(['is_opted_in' => true, 'expected_version' => -1], $preferenceRules)->fails(), 'Request persetujuan wajib membawa versi valid.');
app(SetLeaderboardIndividualPreference::class)->handle($maya, $campus, true, 2);
app(RebuildLeaderboardProjections::class)->handle($campus, $semester);
$ranked = rankingProps($member, ['semester' => $semester, 'scope' => 'individual']);
rankingCheck(array_column($ranked['leaderboardRows']['rows'], 'rank') === [1, 2], 'Snapshot menempatkan dua skor berbeda pada urutan satu dan dua.');
$snapshotCount = LeaderboardProjection::count();
app(SetLeaderboardIndividualPreference::class)->handle($maya, $campus, false, 3);
$reranked = rankingProps($member, ['semester' => $semester, 'scope' => 'individual']);
rankingCheck(count($reranked['leaderboardRows']['rows']) === 1 && $reranked['leaderboardRows']['rows'][0]['rank'] === 1 && $reranked['leaderboardRows']['rows'][0]['sharedRankGroup'] === null, 'Penarikan peringkat teratas langsung merapikan nomor dan shared rank tanpa menunggu worker.');
rankingCheck(LeaderboardProjection::count() === $snapshotCount && $read->handle($campus, $semester)->first(fn ($row): bool => $row->scope_type === LeaderboardScopeType::Individual && $row->scope_id === $member->id)->rank === 2, 'GET menghitung ulang salinan baris tanpa mengubah snapshot atau cache bersama.');

$approved->load('currentVersion.evidence');
$originalVersion = $approved->currentVersion;
$payload = ['task_id' => $originalVersion->task_id, 'claim' => $originalVersion->claim, 'summary' => $originalVersion->summary, 'declaration' => $originalVersion->declaration, 'evidence' => $originalVersion->evidence->pluck('attachment_id')->all()];
$contributionCount = Contribution::count();
rankingRejects(fn () => app(CreateContribution::class)->handle($member, $approved->project, $payload), ValidationException::class, 'Pekerjaan identik tidak dapat dibuat menjadi kontribusi kedua.');
$normalizedPayload = [...$payload, 'claim' => '  '.mb_strtoupper($payload['claim']).'  ', 'summary' => '  '.mb_strtoupper($payload['summary']).'  '];
rankingRejects(fn () => app(CreateContribution::class)->handle($member, $approved->project, $normalizedPayload), ValidationException::class, 'Mengubah kapitalisasi dan spasi tidak melewati pemeriksaan duplikasi.');
rankingCheck(Contribution::count() === $contributionCount, 'Penolakan duplikasi tidak meninggalkan draft atau versi baru.');
$newPayload = [...$payload, 'claim' => 'Pekerjaan lanjutan berbeda. Data synthetic'];
$legitimate = app(CreateContribution::class)->handle($member, $approved->project, $newPayload);
rankingCheck($legitimate->status === ContributionStatus::Draft, 'Pekerjaan berbeda pada tugas yang sama tetap dapat dicatat.');
$legitimate = app(ReviseContribution::class)->handle($member, $legitimate, [...$newPayload, 'expected_revision' => ContributionSnapshot::revision($legitimate)]);
rankingCheck($legitimate->currentVersion->version_number === 2, 'Versi baru pada kontribusi sendiri tidak dianggap sebagai duplikasi.');
rankingRejects(fn () => app(ReviseContribution::class)->handle($member, $legitimate, [...$payload, 'expected_revision' => ContributionSnapshot::revision($legitimate)]), ValidationException::class, 'Revisi tidak dapat mengubah draft lain menjadi salinan karya yang telah disetujui.');
$legacy = Contribution::factory()->create(['institution_id' => $campus->id, 'owner_id' => $member->id, 'project_id' => $approved->project_id]);
$legacyVersion = ContributionVersion::factory()->forContribution($legacy)->create(['task_id' => $payload['task_id'], 'claim' => $payload['claim'], 'summary' => $payload['summary'], 'declaration' => $payload['declaration']]);
$legacy->forceFill(['current_version_id' => $legacyVersion->id])->save();
foreach ($payload['evidence'] as $attachmentId) {
    ContributionEvidence::query()->forceCreate(['contribution_version_id' => $legacyVersion->id, 'attachment_id' => $attachmentId, 'source_label' => 'Bukti uji. Data synthetic']);
}
rankingRejects(fn () => app(SubmitContribution::class)->handle($member, $legacy, ContributionSnapshot::revision($legacy)), ValidationException::class, 'Draft duplikat lama tidak dapat diajukan.');
$legacy->forceFill(['status' => ContributionStatus::Pending])->save();
$beforeReview = [ContributionReview::count(), PortfolioEntry::count(), XpLedgerEntry::count()];
rankingRejects(fn () => app(ReviewContribution::class)->handle($legacy, $admin, ContributionReviewDecision::Approved, 1, ContributionSnapshot::revision($legacy)), ValidationException::class, 'Duplikat pending lama tidak dapat disetujui untuk mendapatkan XP kedua.');
rankingCheck($legacy->fresh()->status === ContributionStatus::Pending && $beforeReview === [ContributionReview::count(), PortfolioEntry::count(), XpLedgerEntry::count()], 'Penolakan approval duplikat tidak mengubah keputusan, portofolio atau ledger.');

$activationTimes = $campus->rosters()->get()->keyBy('id')->map(fn ($roster) => $roster->activated_at);
$expectedSemester = $campus->rosters()->whereNotNull('activated_at')->where('activated_at', '<=', now())->latest('activated_at')->latest('id')->value('semester');
$campus->rosters()->update(['activated_at' => null]);
$legitimate = app(SubmitContribution::class)->handle($member, $legitimate, ContributionSnapshot::revision($legitimate));
$waitingReview = app(ReviewContribution::class)->handle($legitimate, $admin, ContributionReviewDecision::Approved, 2, ContributionSnapshot::revision($legitimate));
rankingCheck($legitimate->fresh()->status === ContributionStatus::Approved && PortfolioEntry::where('contribution_id', $legitimate->id)->exists() && ! $legitimate->xpEntries()->exists(), 'Approval dan portofolio tetap berhasil ketika semester XP belum dapat ditentukan.');
$waitingProps = rankingProps($member, ['semester' => $semester]);
rankingCheck($waitingProps['leaderboard']['pendingXpCount'] === 1 && rankingProps($admin)['leaderboard']['pendingXpCount'] === null, 'XP tertunda diberitahukan hanya kepada pemilik, bukan Admin Universitas.');
$reconcile = new ReconcileApprovedContributionXp($campus->id);
$reconcile->handle(app(ResolveConfiguredUniversity::class), app(AwardApprovedContributionXp::class));
rankingCheck(! $legitimate->xpEntries()->exists(), 'Rekonsiliasi tidak mengarang semester ketika roster sumber belum valid.');
foreach ($activationTimes as $rosterId => $activatedAt) {
    InstitutionRoster::whereKey($rosterId)->update(['activated_at' => $activatedAt]);
}
$reconcile->handle(app(ResolveConfiguredUniversity::class), app(AwardApprovedContributionXp::class));
rankingCheck($legitimate->xpEntries()->sole()->semester === $expectedSemester && rankingProps($member)['leaderboard']['pendingXpCount'] === 0, 'Setelah roster sumber valid, rekonsiliasi memulihkan XP pada semester saat approval.');
$afterRecovery = [XpLedgerEntry::count(), ContributionReview::count(), PortfolioEntry::count()];
$reconcile->handle(app(ResolveConfiguredUniversity::class), app(AwardApprovedContributionXp::class));
rankingCheck($afterRecovery === [XpLedgerEntry::count(), ContributionReview::count(), PortfolioEntry::count()], 'Rekonsiliasi ulang tidak menggandakan XP dan tidak mengulang review atau portofolio.');
rankingRejects(fn () => (new ReconcileApprovedContributionXp($other->id))->handle(app(ResolveConfiguredUniversity::class), app(AwardApprovedContributionXp::class)), InvalidUniversityConfiguration::class, 'Job pemulihan menolak universitas di luar konfigurasi.');
$approvedEvent = new ContributionApproved($legitimate->id, $legitimate->current_version_id, $waitingReview->id, $admin->id, $campus->id, $waitingReview->policy_version);
foreach ([AwardApprovedContributionXp::class, AwardContributionBadges::class] as $listenerClass) {
    (new CallQueuedListener($listenerClass, 'handle', [$approvedEvent]))->failed(new RuntimeException('Kegagalan synthetic'));
}
rankingCheck(true, 'Callback gagal listener XP dan badge menerima event serta exception sesuai kontrak antrean Laravel.');
rankingCheck(! Contribution::query()->whereKey($pending->id)->awaitingXp()->exists(), 'Award yang sudah dibatalkan tidak diberikan ulang sebagai XP hilang.');
Bus::fake([RebuildJob::class, ReconcileApprovedContributionXp::class]);
rankingCheck(Artisan::call('gamification:reconcile-xp') === 0 && Bus::dispatched(ReconcileApprovedContributionXp::class)->contains(fn ($job): bool => $job->institutionId === $campus->id), 'Command pemulihan mengantrekan job hanya untuk universitas terkonfigurasi.');
$scheduled = collect(app(Schedule::class)->events())->first(fn ($event): bool => str_contains($event->command ?? '', 'gamification:reconcile-xp'));
rankingCheck($scheduled !== null && $scheduled->expression === '0 * * * *' && $scheduled->withoutOverlapping && $scheduled->onOneServer, 'Pemulihan dijadwalkan setiap jam dengan proteksi overlap dan satu server.');

DB::beginTransaction();
$digest = hash('sha256', 'pagination-synthetic');
$paginationSemester = 'Semester pagination. Data synthetic';
$paginationPeriod = LeaderboardPeriod::factory()->create(['institution_id' => $campus->id, 'semester' => $paginationSemester, 'latest_snapshot_digest' => $digest, 'computed_at' => now()]);
for ($index = 0; $index < 13; $index++) {
    $rankUser = match ($index) {
        0 => $maya,
        1 => $member,
        default => User::factory()->create(['name' => 'Paginasi '.$index.'. Data synthetic']),
    };
    if ($index > 1) {
        LeaderboardPreference::factory()->optedIn()->create(['institution_id' => $campus->id, 'user_id' => $rankUser->id]);
    }
    $scopeKey = 'individual:'.$rankUser->id;
    LeaderboardProjection::factory()->create([
        'leaderboard_period_id' => $paginationPeriod->id, 'institution_id' => $campus->id,
        'scope_type' => LeaderboardScopeType::Individual, 'scope_id' => $rankUser->id, 'scope_key' => $scopeKey,
        'scope_label' => $rankUser->name, 'score' => max(3, 13 - $index), 'verified_xp_total' => max(3, 13 - $index),
        'rank' => $index < 10 ? $index + 1 : 11, 'shared_rank_group' => $index < 10 ? null : 11,
        'snapshot_digest' => $digest, 'snapshot_key' => hash('sha256', $digest.'|'.$scopeKey),
    ]);
}
$firstPage = rankingProps($member, ['semester' => $paginationSemester, 'scope' => 'individual']);
$secondPage = rankingProps($member, ['semester' => $paginationSemester, 'scope' => 'individual', 'page' => 2]);
rankingCheck($firstPage['leaderboardRows']['pagination']['total'] === 12 && count($firstPage['leaderboardRows']['rows']) === 10 && $firstPage['leaderboardRows']['rows'][0]['rank'] === 1, 'Penyaringan izin dan penomoran ulang diterapkan sebelum pagination.');
rankingCheck(array_column($secondPage['leaderboardRows']['rows'], 'rank') === [10, 10] && array_column($secondPage['leaderboardRows']['rows'], 'sharedRankGroup') === [10, 10] && $firstPage['leaderboardRows']['rows'][9]['sharedRankGroup'] === 10, 'Peringkat sama yang melintasi dua halaman tetap konsisten setelah penarikan izin.');
DB::rollBack();

$latestPeriod = LeaderboardPeriod::whereBelongsTo($campus)->where('semester', $semester)->sole();
$cacheBase = RebuildLeaderboardProjections::cacheKey($campus->id, $semester, $latestPeriod->rule_version);
$cacheKey = $cacheBase.':attributes-v1:'.$latestPeriod->latest_snapshot_digest;
Cache::forget($cacheKey);
$beforeRead = [LeaderboardPeriod::count(), LeaderboardProjection::count(), XpLedgerEntry::count(), ContributionReview::count(), LeaderboardPreference::count()];
$cold = $read->handle($campus, $semester);
$rawCached = Cache::get($cacheKey);
$hasObject = false;
array_walk_recursive($rawCached, function ($value) use (&$hasObject): void {
    $hasObject = $hasObject || is_object($value);
});
rankingCheck(config('cache.default') === 'database' && config('cache.serializable_classes') === false && is_array($rawCached) && ! $hasObject, 'Cache database menyimpan array/scalar dengan pengamanan deserialisasi objek tetap aktif.');
DB::enableQueryLog();
$warm = $read->handle($campus, $semester);
$warmQueries = DB::getQueryLog();
DB::disableQueryLog();
rankingCheck($cold->map->getRawOriginal()->all() === $warm->map->getRawOriginal()->all() && $warm->every(fn ($row): bool => $row instanceof LeaderboardProjection && $row->scope_type instanceof LeaderboardScopeType && $row->computed_at instanceof CarbonInterface && $row->relationLoaded('period')), 'Pembacaan cache hangat memulihkan model, cast dan periode tanpa incomplete class.');
rankingCheck(! collect($warmQueries)->contains(fn ($query): bool => str_contains($query['query'], 'leaderboard_projections')), 'Cache hangat tidak menjalankan ulang query proyeksi.');
Cache::put($cacheBase.':'.$latestPeriod->latest_snapshot_digest, $cold, now()->addMinutes(5));
rankingCheck($read->handle($campus, $semester)->count() === $cold->count(), 'Cache objek lama diabaikan tanpa menghapus cache global atau data historis.');
$warm->first()->rank = 999;
rankingCheck($read->handle($campus, $semester)->first()->rank !== 999, 'Mutasi salinan hasil tidak mengotori cache atribut bersama.');
rankingCheck($beforeRead === [LeaderboardPeriod::count(), LeaderboardProjection::count(), XpLedgerEntry::count(), ContributionReview::count(), LeaderboardPreference::count()], 'Cache dingin/hangat tidak mengubah periode, snapshot, ledger, review atau consent.');
Cache::forget($cacheKey);
$failProjectionRead = true;
DB::listen(function ($query) use (&$failProjectionRead): void {
    if ($failProjectionRead && str_starts_with($query->sql, 'select') && str_contains($query->sql, 'leaderboard_projections')) {
        $failProjectionRead = false;
        throw new RuntimeException('Kegagalan resolver synthetic.');
    }
});
$rescued = rankingPage($member, ['semester' => $semester]);
rankingCheck(in_array('leaderboardRows', $rescued['rescuedProps'] ?? [], true) && isset($rescued['props']['leaderboard']) && ! isset($rescued['props']['leaderboardRows']), 'Resolver gagal menghasilkan rescuedProps, bukan loading tanpa hasil atau hilangnya shell.');
$recovered = rankingPage($member, ['semester' => $semester]);
rankingCheck(isset($recovered['props']['leaderboardRows']) && ! in_array('leaderboardRows', $recovered['rescuedProps'] ?? [], true), 'GET berikutnya memulihkan hasil setelah resolver kembali tersedia.');

echo $checks.' pemeriksaan integrasi Peringkat lulus. SQLite di memori.'.PHP_EOL;
