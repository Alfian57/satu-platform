<?php

declare(strict_types=1);

namespace App\Actions\Portfolio;

use App\Models\PortfolioEntry;
use Carbon\Carbon;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

final class EnsurePortfolioEntryIsFresh
{
    public function handle(PortfolioEntry $portfolioEntry, mixed $expectedUpdatedAt): void
    {
        if ($expectedUpdatedAt === null || $expectedUpdatedAt === '') {
            return;
        }

        $expected = Carbon::parse((string) $expectedUpdatedAt);

        if ($portfolioEntry->updated_at->equalTo($expected)) {
            return;
        }

        throw new ConflictHttpException(
            'Portfolio entry ini sudah berubah di sesi lain. Muat data terbaru sebelum menyimpan kembali.',
        );
    }
}
