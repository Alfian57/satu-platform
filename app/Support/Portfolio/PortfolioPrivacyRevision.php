<?php

declare(strict_types=1);

namespace App\Support\Portfolio;

use App\Models\PortfolioEntry;
use App\Models\StudentProfile;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

final class PortfolioPrivacyRevision
{
    public static function for(PortfolioEntry|StudentProfile $resource): string
    {
        $isProfile = $resource instanceof StudentProfile;
        $latestChange = array_key_exists('privacy_changes_max_id', $resource->getAttributes())
            ? $resource->getAttribute('privacy_changes_max_id')
            : $resource->privacyChanges()->where('institution_id', $resource->institution_id)->max('id');

        return hash('sha256', json_encode([
            'resource' => $resource->getMorphClass(),
            'state' => $resource->only($isProfile
                ? ['id', 'institution_id', 'user_id', 'portfolio_visibility', 'recruiter_discoverable', 'updated_at']
                : ['id', 'institution_id', 'user_id', 'contribution_id', 'contribution_version_id', 'title', 'summary', 'visibility', 'published_at', 'withdrawn_at', 'withdrawal_reason', 'updated_at']),
            'latest_privacy_change' => (int) ($latestChange ?? 0),
        ], JSON_THROW_ON_ERROR));
    }

    public static function ensureFresh(PortfolioEntry|StudentProfile $resource, mixed $expectedRevision): void
    {
        if (! is_string($expectedRevision) || preg_match('/^[a-f0-9]{64}$/D', $expectedRevision) !== 1) {
            throw ValidationException::withMessages([
                'expected_privacy_revision' => 'Periksa pengaturan privasi terbaru sebelum menyimpan.',
            ]);
        }

        if (! hash_equals(self::for($resource), $expectedRevision)) {
            throw new ConflictHttpException('Pengaturan privasi berubah di sesi lain. Periksa pengaturan terbaru sebelum menyimpan kembali.');
        }
    }
}
