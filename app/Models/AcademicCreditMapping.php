<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\CreditMappingStatus;
use Database\Factories\AcademicCreditMappingFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $institution_id
 * @property string $activity_type
 * @property float $credit_amount
 * @property CreditMappingStatus $status
 * @property Carbon|null $effective_from
 * @property Carbon|null $effective_to
 * @property int|null $approver_user_id
 * @property string|null $reason
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property-read Institution $institution
 * @property-read User|null $approver
 */
#[Guarded(['id', 'created_at', 'updated_at'])]
class AcademicCreditMapping extends Model
{
    /** @use HasFactory<AcademicCreditMappingFactory> */
    use HasFactory;

    /**
     * @return BelongsTo<Institution, $this>
     */
    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_user_id');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'credit_amount' => 'float',
            'status' => CreditMappingStatus::class,
            'effective_from' => 'datetime',
            'effective_to' => 'datetime',
        ];
    }
}
