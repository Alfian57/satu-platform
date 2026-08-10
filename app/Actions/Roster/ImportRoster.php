<?php

namespace App\Actions\Roster;

use App\Models\Institution;
use App\Models\InstitutionRoster;
use App\Models\InstitutionRosterRow;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use OpenSpout\Common\Exception\IOException;
use OpenSpout\Reader\CSV\Reader as CsvReader;
use RuntimeException;

final class ImportRoster
{
    /**
     * @return array<string, mixed>
     */
    public function preview(Institution $institution, string $filePath, string $semester): array
    {
        $result = $this->process($institution, $filePath, $semester, commit: false);

        if ($result instanceof InstitutionRoster) {
            throw new RuntimeException('Unexpected roster from preview.');
        }

        return $result;
    }

    public function commit(User $actor, Institution $institution, string $filePath, string $semester): InstitutionRoster
    {
        $result = $this->process($institution, $filePath, $semester, commit: true, actor: $actor);

        if (! $result instanceof InstitutionRoster) {
            throw new RuntimeException('Expected roster from commit.');
        }

        return $result;
    }

    private function process(Institution $institution, string $filePath, string $semester, bool $commit, ?User $actor = null): mixed
    {
        $path = Storage::disk('local')->path($filePath);

        if (! file_exists($path)) {
            throw new RuntimeException('File not found.');
        }

        $rows = $this->readRows($path);
        $checksum = hash_file('sha256', $path);

        $parsed = [];
        $errors = [];

        foreach ($rows as $index => $row) {
            $normalized = $this->normalizeRow($row);
            $validationErrors = $this->validateRow($normalized);

            if (! empty($validationErrors)) {
                $errors[] = ['row' => $index + 1, 'errors' => $validationErrors, 'data' => $normalized];

                continue;
            }

            $parsed[] = $normalized;
        }

        $totalRows = count($rows);
        $validRows = count($parsed);
        $errorRows = count($errors);

        if (! $commit) {
            return [
                'semester' => $semester,
                'checksum' => $checksum,
                'total_rows' => $totalRows,
                'valid_rows' => $validRows,
                'error_rows' => $errorRows,
                'errors' => $errors,
                'preview' => array_slice($parsed, 0, 10),
            ];
        }

        $filename = basename($filePath);

        return DB::transaction(function () use ($institution, $semester, $filename, $checksum, $totalRows, $validRows, $errorRows, $parsed, $actor) {
            $roster = InstitutionRoster::query()->create([
                'institution_id' => $institution->id,
                'semester' => $semester,
                'source_filename' => $filename,
                'checksum' => $checksum,
                'total_rows' => $totalRows,
                'valid_rows' => $validRows,
                'error_rows' => $errorRows,
                'imported_by' => $actor?->id,
            ]);

            $insert = array_map(fn (array $row) => array_merge($row, [
                'roster_id' => $roster->id,
                'created_at' => Carbon::now()->toDateTimeString(),
                'updated_at' => Carbon::now()->toDateTimeString(),
            ]), $parsed);

            foreach (array_chunk($insert, 500) as $chunk) {
                InstitutionRosterRow::query()->insert($chunk);
            }

            return $roster;
        });
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function readRows(string $path): array
    {
        $rows = [];

        try {
            $reader = new CsvReader;
            $reader->open($path);
            $isFirstRow = true;

            foreach ($reader->getSheetIterator() as $sheet) {
                foreach ($sheet->getRowIterator() as $row) {
                    if ($isFirstRow) {
                        $isFirstRow = false;
                        continue;
                    }                    $cells = $row->toArray();
                    if (empty(array_filter($cells))) {
                        continue;
                    }
                    if (count($cells) < 6) {
                        continue;
                    }
                    $rows[] = [
                        'nim' => $cells[0] ?? '',
                        'nama' => $cells[1] ?? '',
                        'program_studi' => $cells[2] ?? '',
                        'angkatan' => $cells[3] ?? '',
                        'semester' => $cells[4] ?? '',
                        'phone' => $cells[5] ?? '',
                        'status_aktif' => $cells[6] ?? 'Aktif',
                    ];
                }
            }
            $reader->close();
        } catch (IOException $e) {
            throw new RuntimeException('Unable to read file: '.$e->getMessage());
        }

        return $rows;
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array<string, mixed>
     */
    private function normalizeRow(array $row): array
    {
        return [
            'nim' => trim(strtolower($row['nim'])),
            'nama' => trim($row['nama']),
            'program_studi' => trim($row['program_studi']),
            'angkatan' => trim((string) $row['angkatan']),
            'semester' => trim($row['semester']),
            'phone' => $this->normalizePhone($row['phone']),
            'is_active' => strtolower(trim($row['status_aktif'] ?? 'Aktif')) === 'aktif',
        ];
    }

    private function normalizePhone(string $phone): string
    {
        $normalized = trim($phone);
        $normalized = preg_replace('/[^\d+]/', '', $normalized);

        if (str_starts_with($normalized, '0')) {
            $normalized = '+62'.substr($normalized, 1);
        }

        if (str_starts_with($normalized, '62') && ! str_starts_with($normalized, '+')) {
            $normalized = '+'.$normalized;
        }

        return $normalized;
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array<string, array<int, string>>
     */
    private function validateRow(array $row): array
    {
        $validator = Validator::make($row, [
            'nim' => ['required', 'string', 'max:50'],
            'nama' => ['required', 'string', 'max:255'],
            'program_studi' => ['required', 'string', 'max:255'],
            'semester' => ['required', 'string', 'max:50'],
            'phone' => ['required', 'string', 'max:20'],
        ]);

        return $validator->fails() ? $validator->errors()->toArray() : [];
    }
}
