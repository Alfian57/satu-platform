<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\InstitutionOwned;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $institution_id
 * @property int $candidate_id
 * @property string $revision
 * @property string $status
 * @property int|null $version_id
 * @property Carbon $requested_at
 * @property Carbon|null $completed_at
 * @property string|null $outcome
 */
final class MatchingRefreshRequest extends Model implements InstitutionOwned
{
    protected $guarded = ['*'];

    public function institutionId(): int
    {
        return $this->institution_id;
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['requested_at' => 'datetime', 'completed_at' => 'datetime'];
    }
}
