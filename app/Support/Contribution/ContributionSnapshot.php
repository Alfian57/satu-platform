<?php

declare(strict_types=1);

namespace App\Support\Contribution;

use App\Models\Contribution;
use App\Models\ContributionEvidence;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

final class ContributionSnapshot
{
    public static function revision(Contribution $contribution): string
    {
        $contribution->loadMissing(['currentVersion.task', 'currentVersion.evidence.attachment']);
        $version = $contribution->currentVersion;

        return hash('sha256', json_encode([
            $contribution->getKey(), $contribution->institution_id, $contribution->owner_id,
            $contribution->project_id, $contribution->status->value, $contribution->current_version_id,
            $version?->task_id, $version?->task?->title,
            $version?->evidence->sortBy('id')->map(static function (ContributionEvidence $evidence): array {
                $attachment = $evidence->attachment;

                return [$evidence->getKey(), $evidence->attachment_id, $attachment?->project_id,
                    $attachment?->purpose->value, $attachment?->disk, $attachment?->path,
                    $attachment?->sha256, $attachment?->deleted_at?->toISOString()];
            })->values()->all(),
        ], JSON_THROW_ON_ERROR));
    }

    public static function ensureFresh(Contribution $contribution, mixed $expectedRevision): void
    {
        if (! is_string($expectedRevision) || preg_match('/^[a-f0-9]{64}$/D', $expectedRevision) !== 1) {
            throw ValidationException::withMessages(['expected_revision' => 'Revisi sumber wajib disertakan. Buka kembali kontribusi.']);
        }
        if (! hash_equals(self::revision($contribution), $expectedRevision)) {
            throw new ConflictHttpException('Kontribusi atau bukti berubah. Periksa sumber terbaru sebelum melanjutkan.');
        }
    }
}
