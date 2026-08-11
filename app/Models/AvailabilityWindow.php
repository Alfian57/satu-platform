<?php

namespace App\Models;

use Database\Factories\AvailabilityWindowFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $student_profile_id
 * @property int $day_of_week
 * @property string $starts_at
 * @property string $ends_at
 * @property string $timezone
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
#[Guarded(['id', 'student_profile_id', 'created_at', 'updated_at'])]
class AvailabilityWindow extends Model
{
    /** @use HasFactory<AvailabilityWindowFactory> */
    use HasFactory;

    /**
     * @return BelongsTo<StudentProfile, $this>
     */
    public function studentProfile(): BelongsTo
    {
        return $this->belongsTo(StudentProfile::class);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'day_of_week' => 'integer',
        ];
    }
}
