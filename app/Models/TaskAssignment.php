<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\InstitutionOwned;
use Database\Factories\TaskAssignmentFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Current assignment of a project task to an active team participant.
 *
 * @property int $id
 * @property int $task_id
 * @property int $user_id
 * @property int|null $assigned_by_id
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
#[Guarded(['id', 'task_id', 'created_at', 'updated_at'])]
class TaskAssignment extends Model implements InstitutionOwned
{
    /** @use HasFactory<TaskAssignmentFactory> */
    use HasFactory;

    /**
     * @return BelongsTo<Task, $this>
     */
    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by_id');
    }

    public function institutionId(): int
    {
        return $this->task->institutionId();
    }
}
