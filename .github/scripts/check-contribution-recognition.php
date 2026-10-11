<?php

declare(strict_types=1);

use App\Actions\Attachment\UploadAttachment;
use App\Actions\Contribution\ContributionReviewQueue;
use App\Actions\Contribution\CreateContribution;
use App\Actions\Contribution\LinkContributionEvidence;
use App\Actions\Contribution\ReviewContribution;
use App\Actions\Contribution\ReviseContribution;
use App\Actions\Contribution\SubmitContribution;
use App\Actions\Portfolio\BuildPublicPortfolioProjection;
use App\Actions\Portfolio\SyncApprovedPortfolioEntry;
use App\Actions\Portfolio\UpdatePortfolioEntryVisibility;
use App\Actions\Task\CreateTask;
use App\Enums\AttachmentPurpose;
use App\Enums\ContributionReviewDecision;
use App\Enums\ContributionStatus;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\ProjectStatus;
use App\Enums\TeamMembershipStatus;
use App\Events\ContributionApproved;
use App\Http\Requests\Contribution\LinkContributionEvidenceRequest;
use App\Http\Requests\Contribution\ReviewContributionRequest;
use App\Http\Requests\Contribution\ReviseContributionRequest;
use App\Http\Requests\Contribution\SubmitContributionRequest;
use App\Models\Attachment;
use App\Models\AuditLog;
use App\Models\Contribution;
use App\Models\ContributionReview;
use App\Models\ContributionVersion;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\Message;
use App\Models\PortfolioEntry;
use App\Models\Project;
use App\Models\StudentProfile;
use App\Models\TeamMembership;
use App\Models\User;
use App\Notifications\ContributionReviewedNotification;
use App\Support\Contribution\ContributionReviewQueueSerializer;
use App\Support\Contribution\ContributionSerializer;
use App\Support\Contribution\ContributionSnapshot;
use App\Support\Portfolio\PortfolioEntrySerializer;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

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
config()->set('database.default', 'recognition_check');
config()->set('database.connections.recognition_check', ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '', 'foreign_key_constraints' => true]);
config()->set('cache.default', 'array');
config()->set('queue.default', 'null');
config()->set('filesystems.disks.private', ['driver' => 'local', 'root' => sys_get_temp_dir().'/satu-t08-'.Str::uuid(), 'throw' => true]);
Storage::forgetDisk('private');
if (DB::connection()->getName() !== 'recognition_check' || DB::connection()->getConfig('database') !== ':memory:') {
    throw new RuntimeException('Pengujian hanya boleh memakai SQLite di memori.');
}
foreach (glob($app->databasePath('migrations/*.php')) as $migration) {
    (require $migration)->up();
}
Carbon::setTestNow('2026-10-11 10:00:00');
$checks = 0;
function expectRecognition(bool $condition, string $message): void
{
    global $checks;
    if (! $condition) {
        throw new RuntimeException($message);
    }
    $checks++;
    echo 'PASS '.$message.PHP_EOL;
}
function rejectsRecognition(callable $operation, string $exception, string $message): void
{
    try {
        $operation();
    } catch (Throwable $error) {
        expectRecognition($error instanceof $exception, $message);

        return;
    }
    throw new RuntimeException($message.' tidak ditolak.');
}

function recognitionRevision(Contribution $contribution): string
{
    return ContributionSnapshot::revision($contribution->fresh());
}
$campus = Institution::factory()->active()->create(['name' => 'Kampus A. Data sintetis']);
$other = Institution::factory()->active()->create(['name' => 'Kampus B. Data sintetis']);
$owner = User::factory()->create();
$student = User::factory()->create();
$peer = User::factory()->create();
$admin = User::factory()->create();
$otherAdmin = User::factory()->create();
$outsider = User::factory()->create();
foreach ([$owner, $student, $peer] as $user) {
    InstitutionMembership::factory()->student()->verifiedByRosterExactMatch()->create(['user_id' => $user->getKey(), 'institution_id' => $campus->getKey()]);
}
foreach ([[$admin, $campus], [$otherAdmin, $other]] as [$user, $institution]) {
    InstitutionMembership::factory()->campusAdmin()->verifiedByRosterExactMatch()->create(['user_id' => $user->getKey(), 'institution_id' => $institution->getKey()]);
}
InstitutionMembership::factory()->student()->verifiedByRosterExactMatch()->create(['user_id' => $outsider->getKey(), 'institution_id' => $other->getKey()]);
$project = Project::factory()->open()->create(['institution_id' => $campus->getKey(), 'owner_id' => $owner->getKey()]);
$foreign = Project::factory()->open()->create(['institution_id' => $other->getKey(), 'owner_id' => $outsider->getKey()]);
foreach ([$student, $peer] as $user) {
    TeamMembership::factory()->create(['project_id' => $project->getKey(), 'user_id' => $user->getKey()]);
}
$task = app(CreateTask::class)->handle($owner, $project, ['title' => 'Hasil bersama. Data sintetis']);
$proof = app(UploadAttachment::class)->handle($student, $project, UploadedFile::fake()->createWithContent('rancangan.txt', 'Bukti rancangan sintetis.'), purpose: AttachmentPurpose::Evidence);
$proof2 = app(UploadAttachment::class)->handle($peer, $project, UploadedFile::fake()->createWithContent('uji.txt', 'Bukti pengujian sintetis.'), purpose: AttachmentPurpose::Evidence);
$foreignProof = Attachment::factory()->evidence()->create(['project_id' => $foreign->getKey(), 'uploaded_by_id' => $outsider->getKey()]);
Notification::fake();
Event::fake([ContributionApproved::class]);
$create = app(CreateContribution::class);
$submit = app(SubmitContribution::class);
$revise = app(ReviseContribution::class);
$review = app(ReviewContribution::class);
$data = ['task_id' => $task->getKey(), 'claim' => 'Menyusun rancangan individual', 'summary' => 'Bagian rancangan yang saya kerjakan. Data sintetis.', 'declaration' => 'Pernyataan privat sintetis.', 'evidence' => []];
$draft = $create->handle($student, $project, $data);
expectRecognition($draft->status === ContributionStatus::Draft && Message::count() === 0 && StudentProfile::count() === 0, 'Draft individual tidak mensyaratkan pesan, profil lengkap, karya lama atau konfirmasi tim.');
expectRecognition(Gate::forUser($student)->allows('view', $draft) && ! Gate::forUser($peer)->allows('view', $draft) && ! Gate::forUser($owner)->allows('view', $draft), 'Pernyataan dan keputusan individual tidak dibuka kepada anggota/pemilik proyek lain.');
expectRecognition(! Gate::forUser($admin)->allows('view', $draft) && ! Gate::forUser($admin)->allows('view', $proof), 'Operator tidak membaca draft atau unduhan yang belum diajukan.');
rejectsRecognition(fn () => $submit->handle($student, $draft, recognitionRevision($draft)), ValidationException::class, 'Pengiriman tanpa bukti ditolak.');
rejectsRecognition(fn () => $revise->handle($student, $draft, ['claim' => 'Tidak boleh tanpa token']), ValidationException::class, 'Action revisi tidak dapat melewati token sumber.');
$oldRevision = recognitionRevision($draft);
$oldVersion = $draft->currentVersion->getKey();
$draft = $revise->handle($student, $draft, ['evidence' => [$proof->getKey()], 'expected_revision' => $oldRevision]);
expectRecognition($draft->currentVersion->version_number === 2 && ContributionVersion::find($oldVersion)->evidence()->count() === 0, 'Revisi menambah versi, tidak mengubah versi awal.');
rejectsRecognition(fn () => $revise->handle($student, $draft, ['claim' => 'Lama', 'expected_revision' => $oldRevision]), ConflictHttpException::class, 'Draft stale pada detik sama tidak menimpa versi baru.');
rejectsRecognition(fn () => $submit->handle($student, $draft, $oldRevision), ConflictHttpException::class, 'Submit memakai versi yang dilihat, bukan versi tersimpan terbaru secara diam-diam.');
rejectsRecognition(fn () => $create->handle($student, $project, [...$data, 'evidence' => [$foreignProof->getKey()]]), ValidationException::class, 'Bukti lintas proyek/kampus tidak dapat ditautkan.');
rejectsRecognition(fn () => $create->handle($outsider, $project, $data), AuthorizationException::class, 'Mahasiswa lintas kampus tidak membuat klaim.');
$draft = $submit->handle($student, $draft, recognitionRevision($draft));
expectRecognition($draft->status === ContributionStatus::Pending && Gate::forUser($admin)->allows('view', $proof), 'Submit membuka bukti yang sengaja ditautkan kepada operator kampus.');
expectRecognition(! Gate::forUser($admin)->allows('view', $proof2), 'Unggahan proyek lain yang tidak ditautkan pengajuan tetap privat bagi reviewer.');
$queue = app(ContributionReviewQueue::class)->paginate($admin, $campus);
$item = app(ContributionReviewQueueSerializer::class)->item($queue->items()[0]);
expectRecognition($item['revision'] === recognitionRevision($draft), 'Token antrean dan detail memakai snapshot yang sama.');
expectRecognition(! str_contains(json_encode($item, JSON_THROW_ON_ERROR), $proof->path) && ! isset($item['current_version']['evidence'][0]['attachment']['sha256']), 'Antrean tidak membocorkan path, checksum atau audit mentah.');
rejectsRecognition(fn () => app(ContributionReviewQueue::class)->paginate($admin, $other), AuthorizationException::class, 'Antrean lintas tenant ditolak.');
rejectsRecognition(fn () => $review->handle($draft, $otherAdmin, ContributionReviewDecision::Approved, 2, recognitionRevision($draft)), AuthorizationException::class, 'Reviewer kampus lain ditolak.');
rejectsRecognition(fn () => $review->handle($draft, $peer, ContributionReviewDecision::Approved, 2, recognitionRevision($draft)), AuthorizationException::class, 'Anggota tim bukan otoritas validasi.');
rejectsRecognition(fn () => $review->handle($draft, $admin, ContributionReviewDecision::Revision, 2, recognitionRevision($draft), '  '), ValidationException::class, 'Permintaan perbaikan memerlukan alasan faktual.');
$firstReview = $review->handle($draft, $admin, ContributionReviewDecision::Revision, 2, recognitionRevision($draft), 'Jelaskan bagian rancangan dan gantikan bukti yang tidak relevan.');
expectRecognition($draft->fresh()->status === ContributionStatus::Revision && PortfolioEntry::count() === 0, 'Perbaikan bukan persetujuan atau portofolio.');
$draft = $revise->handle($student, $draft->fresh(), ['evidence' => [$proof2->getKey()], 'expected_revision' => recognitionRevision($draft)]);
expectRecognition($draft->currentVersion->evidence->pluck('attachment_id')->all() === [$proof2->getKey()], 'Pilihan revisi mengganti bukti, tidak membawa berkas lama otomatis.');
expectRecognition(ContributionVersion::find($oldVersion)->evidence()->count() === 0 && ContributionReview::find($firstReview->getKey()) !== null && $proof->fresh() !== null, 'Riwayat versi/keputusan dan berkas tidak dihapus saat melepas pilihan.');
expectRecognition(! Gate::forUser($admin)->allows('view', $draft) && app(ContributionReviewQueue::class)->summary($admin, $campus)['total'] === 0, 'Draft revisi belum dikirim tidak masuk antrean reviewer.');
$draft = $submit->handle($student, $draft, recognitionRevision($draft));
$beforeReview = recognitionRevision($draft);
$proof2->delete();
expectRecognition(recognitionRevision($draft) !== $beforeReview, 'Penghapusan bukti terdeteksi walau nomor versi sama.');
rejectsRecognition(fn () => $review->handle($draft->fresh(), $admin, ContributionReviewDecision::Approved, 3, $beforeReview), ConflictHttpException::class, 'Approval sumber bukti stale ditolak.');
rejectsRecognition(fn () => $review->handle($draft->fresh(), $admin, ContributionReviewDecision::Approved, 3, recognitionRevision($draft)), ValidationException::class, 'Approval bukti terhapus ditolak walau token baru.');
$secondReview = $review->handle($draft->fresh(), $admin, ContributionReviewDecision::Revision, 3, recognitionRevision($draft), 'Bukti tidak tersedia, pilih berkas pengganti.');
expectRecognition($secondReview->decision === ContributionReviewDecision::Revision, 'Reviewer tetap dapat meminta perbaikan ketika bukti hilang.');
$draft = $revise->handle($student, $draft->fresh(), ['evidence' => [$proof->getKey()], 'expected_revision' => recognitionRevision($draft)]);
$draft = $submit->handle($student, $draft, recognitionRevision($draft));
DB::beginTransaction();
$approved = $review->handle($draft, $admin, ContributionReviewDecision::Approved, 4, recognitionRevision($draft));
$entry = PortfolioEntry::query()->where('contribution_id', $draft->getKey())->firstOrFail();
expectRecognition($entry->title === $data['claim'] && $entry->summary === $data['summary'] && $entry->visibility->value === 'private', 'Karya individual privat tersedia dalam transaksi approval tanpa consumer XP/badge.');
expectRecognition($entry->contribution_version_id === $draft->current_version_id && ContributionReview::count() === 3, 'Portofolio mengacu pada versi yang disetujui dan riwayat keputusan utuh.');
expectRecognition(Event::dispatched(ContributionApproved::class)->isEmpty(), 'Consumer lanjutan tidak dipancarkan sebelum commit luar.');
DB::rollBack();
expectRecognition($draft->fresh()->status === ContributionStatus::Pending && PortfolioEntry::count() === 0 && ContributionReview::count() === 2, 'Rollback membatalkan keputusan dan karya atomik tanpa menghapus riwayat lama.');
$approved = $review->handle($draft->fresh(), $admin, ContributionReviewDecision::Approved, 4, recognitionRevision($draft));
$entry = PortfolioEntry::query()->where('contribution_id', $draft->getKey())->firstOrFail();
expectRecognition(Event::dispatched(ContributionApproved::class)->count() === 1, 'Consumer approval tetap tersedia setelah commit.');
rejectsRecognition(fn () => $review->handle($draft->fresh(), $admin, ContributionReviewDecision::Approved, 4, recognitionRevision($draft)), AuthorizationException::class, 'Keputusan ganda tidak menambah review atau karya.');
$event = new ContributionApproved($draft->getKey(), $entry->contribution_version_id, $approved->getKey(), $admin->getKey(), $campus->getKey(), ReviewContribution::POLICY_VERSION);
$auditCount = AuditLog::count();
app(SyncApprovedPortfolioEntry::class)->handle($event);
expectRecognition(PortfolioEntry::count() === 1 && AuditLog::count() === $auditCount, 'Replay consumer portofolio idempotent.');
$wrongEvent = new ContributionApproved($draft->getKey(), $entry->contribution_version_id, $approved->getKey(), $otherAdmin->getKey(), $campus->getKey(), ReviewContribution::POLICY_VERSION);
expectRecognition(app(SyncApprovedPortfolioEntry::class)->handle($wrongEvent) === null, 'Consumer menolak sumber reviewer yang tidak sesuai keputusan.');
$peerDraft = $create->handle($peer, $project, [...$data, 'claim' => 'Menguji hasil individual', 'summary' => 'Saya menguji rancangan bersama, bukan menyusun desain.', 'evidence' => [$proof->getKey()]]);
$peerDraft = $submit->handle($peer, $peerDraft, recognitionRevision($peerDraft));
$review->handle($peerDraft, $admin, ContributionReviewDecision::Approved, 1, recognitionRevision($peerDraft));
$peerEntry = PortfolioEntry::query()->where('contribution_id', $peerDraft->getKey())->firstOrFail();
expectRecognition($peerEntry->title !== $entry->title && $peerEntry->summary !== $entry->summary && $peerEntry->user_id !== $entry->user_id, 'Anggota satu proyek dan bukti bersama memperoleh klaim/karya individual berbeda.');
$projection = app(PortfolioEntrySerializer::class)->publicProjection($entry);
expectRecognition(! array_key_exists('declaration', $projection) && ! array_key_exists('evidence', $projection) && ! array_key_exists('reviews', $projection) && ! array_key_exists('source', $projection), 'Proyeksi publik hanya ringkasan yang diizinkan, tanpa bukti/pernyataan/keputusan privat.');
$recruiterProjection = app(PortfolioEntrySerializer::class)->recruiter($entry);
expectRecognition(! str_contains(json_encode($recruiterProjection, JSON_THROW_ON_ERROR), $data['declaration']) && ! array_key_exists('evidence', $recruiterProjection), 'Perekrut tidak menerima bukti privat.');
$profile = StudentProfile::factory()->create(['user_id' => $student->getKey(), 'institution_id' => $campus->getKey(), 'portfolio_visibility' => 'public', 'public_identifier' => Str::uuid()->toString()]);
expectRecognition(app(BuildPublicPortfolioProjection::class)->handle($profile->public_identifier)['state'] === 'unavailable', 'Profil publik tidak memublikasikan karya privat setelah approval.');
$entry = app(UpdatePortfolioEntryVisibility::class)->handle($student, $entry, ['visibility' => 'public', 'expected_updated_at' => $entry->updated_at->toIso8601String()]);
expectRecognition(app(BuildPublicPortfolioProjection::class)->handle($profile->public_identifier)['state'] === 'published', 'Pemilik memublikasikan ringkasan dengan pilihan jangkauan eksplisit.');
$entry = app(UpdatePortfolioEntryVisibility::class)->handle($student, $entry, ['visibility' => 'private', 'expected_updated_at' => $entry->updated_at->toIso8601String()]);
$withdrawn = app(BuildPublicPortfolioProjection::class)->handle($profile->public_identifier);
expectRecognition($withdrawn['state'] === 'unavailable' && $withdrawn['profile'] === null && $withdrawn['entries'] === [], 'Pencabutan menyembunyikan identitas/karya pada pembacaan publik berikutnya.');
expectRecognition($entry->withdrawn_at !== null && ContributionReview::count() === 4 && ContributionVersion::count() === 5, 'Withdrawal tidak menghapus keputusan, versi atau sumber karya.');
rejectsRecognition(fn () => app(UpdatePortfolioEntryVisibility::class)->handle($peer, $entry, ['visibility' => 'public']), AuthorizationException::class, 'Anggota lain tidak mengubah izin berbagi.');
foreach ([SubmitContributionRequest::class, ReviseContributionRequest::class, LinkContributionEvidenceRequest::class, ReviewContributionRequest::class] as $requestClass) {
    $request = new $requestClass;
    expectRecognition(Validator::make([], ['expected_revision' => $request->rules()['expected_revision']])->fails(), 'FormRequest mewajibkan revisi sumber.');
}
$notification = (new ContributionReviewedNotification($approved))->toArray($student);
expectRecognition(! isset($notification['reason']) && ! isset($notification['note']), 'Notifikasi mengarah ke keputusan berizin, tidak menyalin catatan privat.');
DB::enableQueryLog();
app(ContributionSerializer::class)->contribution($draft->fresh());
app(ContributionReviewQueue::class)->paginate($admin, $campus);
$reads = DB::getQueryLog();
DB::disableQueryLog();
expectRecognition(collect($reads)->every(fn (array $query): bool => preg_match('/^(select|pragma)/i', $query['query']) === 1), 'Pembacaan kontribusi dan antrean tidak membuat default atau mutasi.');
$injectFailure = false;
DB::listen(function ($query) use (&$injectFailure): void {
    if ($injectFailure && str_starts_with($query->sql, 'insert into "portfolio_entries"')) {
        $injectFailure = false;
        throw new RuntimeException('Gangguan penyimpanan karya sintetis.');
    }
});
$failureDraft = $create->handle($student, $project, [...$data, 'evidence' => [$proof->getKey()]]);
$failureDraft = $submit->handle($student, $failureDraft, recognitionRevision($failureDraft));
$countReviews = ContributionReview::count();
$countEntries = PortfolioEntry::count();
$injectFailure = true;
rejectsRecognition(fn () => $review->handle($failureDraft, $admin, ContributionReviewDecision::Approved, 1, recognitionRevision($failureDraft)), RuntimeException::class, 'Gangguan karya membatalkan approval, bukan menghasilkan keputusan tanpa pengakuan.');
expectRecognition($failureDraft->fresh()->status === ContributionStatus::Pending && ContributionReview::count() === $countReviews && PortfolioEntry::count() === $countEntries, 'Rollback kegagalan karya tidak menyisakan keputusan/data parsial.');
$review->handle($failureDraft->fresh(), $admin, ContributionReviewDecision::Revision, 1, recognitionRevision($failureDraft), 'Sesuaikan pilihan bukti.');
$cleared = $revise->handle($student, $failureDraft->fresh(), ['evidence' => [], 'expected_revision' => recognitionRevision($failureDraft)]);
expectRecognition($cleared->currentVersion->evidence->isEmpty(), 'Pilihan bukti kosong dapat disimpan tanpa menghapus bukti versi lama.');
rejectsRecognition(fn () => $submit->handle($student, $cleared, recognitionRevision($cleared)), ValidationException::class, 'Draft yang bukti pilihannya dilepas tidak dapat dikirim.');
$longProof = app(UploadAttachment::class)->handle($student, $project, UploadedFile::fake()->createWithContent(str_repeat('a', 230).'.txt', 'Bukti nama panjang sintetis.'), purpose: AttachmentPurpose::Evidence);
$longDraft = $create->handle($student, $project, [...$data, 'evidence' => [$longProof->getKey()]]);
expectRecognition(mb_strlen($longDraft->currentVersion->evidence->first()->source_label) <= 160 && mb_strlen($longProof->original_name) > 160, 'Label sumber aman untuk batas MySQL tanpa memangkas nama berkas asli.');
Storage::disk('private')->delete($longProof->path);
rejectsRecognition(fn () => $submit->handle($student, $longDraft, recognitionRevision($longDraft)), ValidationException::class, 'Metadata aktif dengan file hilang tetap ditolak saat submit.');
$badPath = Attachment::factory()->evidence()->create(['project_id' => $project->getKey(), 'uploaded_by_id' => $student->getKey()]);
$badPath->forceFill(['path' => 'lokasi-tidak-sah/bukti.txt'])->save();
rejectsRecognition(fn () => $create->handle($student, $project, [...$data, 'evidence' => [$badPath->getKey()]]), ValidationException::class, 'Bukti dengan path di luar penyimpanan institusi tidak ditautkan.');
$linked = app(LinkContributionEvidence::class)->handle($student, $cleared, [$proof->getKey()], recognitionRevision($cleared));
expectRecognition($linked->currentVersion->evidence->count() === 1, 'Endpoint link tetap menambah bukti melalui versi baru.');
rejectsRecognition(fn () => $linked->currentVersion->forceFill(['claim' => 'Ubah history'])->save(), LogicException::class, 'Versi lama tidak dapat diedit.');
rejectsRecognition(fn () => $approved->forceFill(['note' => 'Ubah keputusan lama'])->save(), LogicException::class, 'Keputusan lama tidak dapat diedit.');
$studentMembership = InstitutionMembership::query()->where('user_id', $student->getKey())->where('institution_id', $campus->getKey())->firstOrFail();
$studentMembership->forceFill(['status' => InstitutionMembershipStatus::Suspended])->save();
expectRecognition(! Gate::forUser($student)->allows('view', $linked) && ! Gate::forUser($student)->allows('submit', $linked), 'Afiliasi ditangguhkan mencabut pembacaan dan command kontribusi.');
$studentMembership->forceFill(['status' => InstitutionMembershipStatus::Verified])->save();
$team = TeamMembership::query()->where('project_id', $project->getKey())->where('user_id', $student->getKey())->firstOrFail();
$team->forceFill(['status' => TeamMembershipStatus::Left])->save();
expectRecognition(! Gate::forUser($student)->allows('view', $linked), 'Keluar dari tim mencabut detail privat sumber proyek.');
$team->forceFill(['status' => TeamMembershipStatus::Active])->save();
$project->forceFill(['status' => ProjectStatus::Closed])->save();
expectRecognition(! Gate::forUser($student)->allows('submit', $linked), 'Proyek ditutup menahan pengiriman baru tanpa menghapus pengakuan.');
$project->forceFill(['status' => ProjectStatus::Open])->save();
Storage::disk('private')->delete(Storage::disk('private')->allFiles());
echo 'PASS '.$checks.' pemeriksaan pengakuan individual. SQLite memory only.'.PHP_EOL;
