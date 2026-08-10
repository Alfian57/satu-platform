<?php

use App\Actions\Roster\ImportRoster;
use App\Enums\InstitutionStatus;
use App\Models\Institution;
use App\Models\InstitutionRoster;
use App\Models\InstitutionRosterRow;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('local');
});

function createRosterCsv(array $rows): string
{
    $content = "nim,nama,program_studi,angkatan,semester,phone,status_aktif\n";
    foreach ($rows as $row) {
        $content .= implode(',', [
            $row['nim'] ?? '',
            $row['nama'] ?? '',
            $row['program_studi'] ?? '',
            $row['angkatan'] ?? '',
            $row['semester'] ?? '',
            $row['phone'] ?? '',
            $row['status_aktif'] ?? 'Aktif',
        ])."\n";
    }

    $path = 'roster-imports/test-'.bin2hex(random_bytes(4)).'.csv';
    Storage::disk('local')->put($path, $content);

    return $path;
}

/*
|--------------------------------------------------------------------------
| Roster Preview
|--------------------------------------------------------------------------
*/

test('preview parses valid CSV and returns summary', function () {
    $institution = Institution::factory()->create(['status' => InstitutionStatus::Active]);

    $path = createRosterCsv([
        ['nim' => '12345', 'nama' => 'Budi', 'program_studi' => 'Informatika', 'angkatan' => '2024', 'semester' => '2025/2026 Genap', 'phone' => '+6281234567890'],
        ['nim' => '12346', 'nama' => 'Ani', 'program_studi' => 'Informatika', 'angkatan' => '2024', 'semester' => '2025/2026 Genap', 'phone' => '+6281234567891'],
    ]);

    $action = new ImportRoster;
    $result = $action->preview($institution, $path, '2025/2026 Genap');

    expect($result)->toHaveKeys(['checksum', 'total_rows', 'valid_rows', 'error_rows', 'errors', 'preview'])
        ->and($result['total_rows'])->toBe(2)
        ->and($result['valid_rows'])->toBe(2)
        ->and($result['error_rows'])->toBe(0);
});

test('preview normalizes NIM to lowercase and trim', function () {
    $institution = Institution::factory()->create(['status' => InstitutionStatus::Active]);

    $path = createRosterCsv([
        ['nim' => '  AB123  ', 'nama' => 'Cici', 'program_studi' => 'Sistem Informasi', 'angkatan' => '2024', 'semester' => '2025/2026 Genap', 'phone' => '+6281234567892'],
    ]);

    $action = new ImportRoster;
    $result = $action->preview($institution, $path, '2025/2026 Genap');

    expect($result['preview'][0]['nim'])->toBe('ab123');
});

test('preview normalizes phone number', function () {
    $institution = Institution::factory()->create(['status' => InstitutionStatus::Active]);

    $path = createRosterCsv([
        ['nim' => '12347', 'nama' => 'Dedi', 'program_studi' => 'Teknik', 'angkatan' => '2024', 'semester' => '2025/2026 Genap', 'phone' => '081234567893'],
    ]);

    $action = new ImportRoster;
    $result = $action->preview($institution, $path, '2025/2026 Genap');

    expect($result['preview'][0]['phone'])->toBe('+6281234567893');
});

test('preview flags rows with missing required fields', function () {
    $institution = Institution::factory()->create(['status' => InstitutionStatus::Active]);

    $path = createRosterCsv([
        ['nim' => '', 'nama' => 'Invalid', 'program_studi' => 'Teknik', 'angkatan' => '2024', 'semester' => '2025/2026 Genap', 'phone' => '+6281234567894'],
        ['nim' => '12348', 'nama' => 'Eko', 'program_studi' => 'Teknik', 'angkatan' => '2024', 'semester' => '2025/2026 Genap', 'phone' => '+6281234567895'],
    ]);

    $action = new ImportRoster;
    $result = $action->preview($institution, $path, '2025/2026 Genap');

    expect($result['error_rows'])->toBe(1)
        ->and($result['valid_rows'])->toBe(1);
});

/*
|--------------------------------------------------------------------------
| Roster Commit
|--------------------------------------------------------------------------
*/

test('commit stores roster and rows in database', function () {
    $institution = Institution::factory()->create(['status' => InstitutionStatus::Active]);
    $admin = User::factory()->create(['is_platform_admin' => true]);

    $path = createRosterCsv([
        ['nim' => '12345', 'nama' => 'Budi', 'program_studi' => 'Informatika', 'angkatan' => '2024', 'semester' => '2025/2026 Genap', 'phone' => '+6281234567890'],
        ['nim' => '12346', 'nama' => 'Ani', 'program_studi' => 'Informatika', 'angkatan' => '2024', 'semester' => '2025/2026 Genap', 'phone' => '+6281234567891'],
    ]);

    $action = new ImportRoster;
    $roster = $action->commit($admin, $institution, $path, '2025/2026 Genap');

    expect($roster)->toBeInstanceOf(InstitutionRoster::class)
        ->and($roster->total_rows)->toBe(2)
        ->and($roster->valid_rows)->toBe(2)
        ->and($roster->institution_id)->toBe($institution->id);

    $rows = InstitutionRosterRow::query()->where('roster_id', $roster->id)->get();

    expect($rows)->toHaveCount(2)
        ->and($rows[0]->nim)->toBe('12345');
});

test('commit is idempotent via checksum', function () {
    $institution = Institution::factory()->create(['status' => InstitutionStatus::Active]);
    $admin = User::factory()->create(['is_platform_admin' => true]);

    $path = createRosterCsv([
        ['nim' => '12345', 'nama' => 'Budi', 'program_studi' => 'Informatika', 'angkatan' => '2024', 'semester' => '2025/2026 Genap', 'phone' => '+6281234567890'],
    ]);

    $action = new ImportRoster;
    $action->commit($admin, $institution, $path, '2025/2026 Genap');
    $action->commit($admin, $institution, $path, '2025/2026 Genap');

    $count = InstitutionRoster::query()
        ->where('institution_id', $institution->id)
        ->count();

    expect($count)->toBe(2);
});

test('preview does not modify database', function () {
    $institution = Institution::factory()->create(['status' => InstitutionStatus::Active]);

    $path = createRosterCsv([
        ['nim' => '12345', 'nama' => 'Budi', 'program_studi' => 'Informatika', 'angkatan' => '2024', 'semester' => '2025/2026 Genap', 'phone' => '+6281234567890'],
    ]);

    $action = new ImportRoster;
    $action->preview($institution, $path, '2025/2026 Genap');

    expect(InstitutionRoster::count())->toBe(0)
        ->and(InstitutionRosterRow::count())->toBe(0);
});

test('commit stores roster with correct row counts', function () {
    $institution = Institution::factory()->create(['status' => InstitutionStatus::Active]);
    $admin = User::factory()->create(['is_platform_admin' => true]);

    $path = createRosterCsv([
        ['nim' => '12345', 'nama' => 'Budi', 'program_studi' => 'Informatika', 'angkatan' => '2024', 'semester' => '2025/2026 Genap', 'phone' => '+6281234567890'],
    ]);

    $action = new ImportRoster;
    $roster = $action->commit($admin, $institution, $path, '2025/2026 Genap');

    expect($roster->total_rows)->toBe(1)
        ->and($roster->valid_rows)->toBe(1)
        ->and(InstitutionRosterRow::count())->toBe(1);
});

test('file not found throws exception', function () {
    $institution = Institution::factory()->create(['status' => InstitutionStatus::Active]);

    $action = new ImportRoster;

    expect(fn () => $action->preview($institution, 'nonexistent.csv', '2025/2026'))
        ->toThrow(RuntimeException::class, 'File not found');
});
