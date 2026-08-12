<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\InstitutionOwned;
use Database\Factories\MessageFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * Tenant-scoped textual discussion message for a project workspace.
 *
 * @property int $id
 * @property int $project_id
 * @property int $author_id
 * @property string $body
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
#[Guarded(['id', 'project_id', 'author_id', 'created_at', 'updated_at'])]
class Message extends Model implements InstitutionOwned
{
    /** @use HasFactory<MessageFactory> */
    use HasFactory;

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
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    /**
     * @return HasMany<Attachment, $this>
     */
    public function attachments(): HasMany
    {
        return $this->hasMany(Attachment::class);
    }

    public function institutionId(): int
    {
        return (int) $this->project->institution_id;
    }

    /**
     * @param  Builder<Message>  $query
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
     * @param  Builder<Message>  $query
     */
    #[Scope]
    protected function ordered(Builder $query): void
    {
        $query->latest('created_at')->latest('id');
    }
}
