<?php

namespace App\Models;

use App\Enums\RecruiterMembershipStatus;
use Database\Factories\RecruiterMembershipFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Arsip hubungan organisasi lama, bukan sumber role atau izin runtime.
 *
 * @property int $id
 * @property int $recruiter_organization_id
 * @property int $user_id
 * @property string $role
 * @property RecruiterMembershipStatus $status
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
#[Guarded(['id', 'created_at', 'updated_at'])]
class RecruiterMembership extends Model
{
    /** @use HasFactory<RecruiterMembershipFactory> */
    use HasFactory;

    /**
     * @var array<string, mixed>
     */
    protected $attributes = [
        'status' => RecruiterMembershipStatus::Pending->value,
    ];

    /**
     * @return BelongsTo<RecruiterOrganization, $this>
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(RecruiterOrganization::class, 'recruiter_organization_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => RecruiterMembershipStatus::class,
        ];
    }
}
