<?php

declare(strict_types=1);

namespace App\Actions\Profile;

use App\Models\StudentProfile;
use App\Support\Profile\ProfileRevision;
use Carbon\Carbon;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

final class EnsureStudentProfileIsFresh
{
    public function handle(StudentProfile $studentProfile, mixed $expectedUpdatedAt, mixed $expectedRevision = null): void
    {
        if ($expectedRevision !== null && (! is_string($expectedRevision)
            || ! hash_equals(ProfileRevision::for($studentProfile), $expectedRevision))) {
            throw new ConflictHttpException('Profil ini sudah berubah di sesi lain. Muat data terbaru sebelum menyimpan kembali.');
        }
        if ($expectedUpdatedAt === null || $expectedUpdatedAt === '') {
            return;
        }

        $expected = Carbon::parse((string) $expectedUpdatedAt);

        if ($studentProfile->updated_at->equalTo($expected)) {
            return;
        }

        throw new ConflictHttpException(
            'Profil ini sudah berubah di sesi lain. Muat data terbaru sebelum menyimpan kembali.',
        );
    }
}
