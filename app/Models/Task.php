<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\InstitutionOwned;
use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use Database\Factories\TaskFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * Institution-scoped project task and its current workflow state.
 *
 * @property int $id
 * @property int $project_id
 * @property int $created_by_id
 * @property string $title
 * @property string|null $description
 * @property TaskStatus $status
 * @property TaskPriority $priority
 * @property Carbon|null $due_at
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
#[Guarded(['id', 'project_id', 'created_by_id', 'created_at', 'updated_at'])]
class Task extends Model implements InstitutionOwned
{
    /** @use HasFactory<TaskFactory> */
    use HasFactory;

    /**
     * @var array<string, mixed>
     */
    protected $attributes = [
        'status' => TaskStatus::Todo->value,
        'priority' => TaskPriority::Medium->value,
    ];

    /**
     * @return BelongsTo<Project, $this>
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    /**
     * @return HasMany<TaskAssignment, $this>
     */
    public function assignments(): HasMany
    {
        return $this->hasMany(TaskAssignment::class);
    }

    /**
     * @return BelongsToMany<User, $this>
     */
    public function assignees(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'task_assignments')
            ->withPivot('assigned_by_id')
            ->withTimestamps();
    }

    public function institutionId(): int
    {
        return (int) $this->project->institution_id;
    }

    public function isOverdue(): bool
    {
        return $this->due_at !== null
            && $this->due_at->isPast()
            && ! $this->status->isComplete();
    }

    /**
     * @param  Builder<Task>  $query
     */
    #[Scope]
    protected function forProject(Builder $query, Project|int $project): void
    {
        $query->where(
            'project_id',
            $project instanceof Project ? $project->getKey() : $project,
        );
    }

    /**
     * Order actionable work first, with deterministic tie-breakers for reconciliation.
     *
     * @param  Builder<Task>  $query
     */
    #[Scope]
    protected function ordered(Builder $query): void
    {
        $query
            ->orderByRaw(
                'CASE status WHEN ? THEN ? WHEN ? THEN ? WHEN ? THEN ? WHEN ? THEN ? ELSE ? END',
                [
                    TaskStatus::Blocked->value,
                    0,
                    TaskStatus::InProgress->value,
                    1,
                    TaskStatus::Todo->value,
                    2,
                    TaskStatus::Done->value,
                    3,
                    4,
                ],
            )
            ->orderByRaw(
                'CASE priority WHEN ? THEN ? WHEN ? THEN ? WHEN ? THEN ? WHEN ? THEN ? ELSE ? END',
                [
                    TaskPriority::Urgent->value,
                    0,
                    TaskPriority::High->value,
                    1,
                    TaskPriority::Medium->value,
                    2,
                    TaskPriority::Low->value,
                    3,
                    4,
                ],
            )
            ->orderByRaw('CASE WHEN due_at IS NULL THEN 1 ELSE 0 END')
            ->orderBy('due_at')
            ->latest('created_at')
            ->latest('id');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => TaskStatus::class,
            'priority' => TaskPriority::class,
            'due_at' => 'datetime',
        ];
    }
}
