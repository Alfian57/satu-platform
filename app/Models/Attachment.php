<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\InstitutionOwned;
use App\Enums\AttachmentPurpose;
use Database\Factories\AttachmentFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * Private, tenant-scoped file metadata for a project workspace.
 *
 * @property int $id
 * @property int $project_id
 * @property int|null $message_id
 * @property int $uploaded_by_id
 * @property AttachmentPurpose $purpose
 * @property string $disk
 * @property string $path
 * @property string $original_name
 * @property string $mime_type
 * @property int $size_bytes
 * @property string $sha256
 * @property string $deduplication_key
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property Carbon|null $deleted_at
 */
#[Guarded(['*'])]
class Attachment extends Model implements InstitutionOwned
{
    /** @use HasFactory<AttachmentFactory> */
    use HasFactory, SoftDeletes;

    /**
     * @return BelongsTo<Project, $this>
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * @return BelongsTo<Message, $this>
     */
    public function message(): BelongsTo
    {
        return $this->belongsTo(Message::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by_id');
    }

    public function institutionId(): int
    {
        return (int) $this->project->institution_id;
    }

    /**
     * @param  Builder<Attachment>  $query
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
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'purpose' => AttachmentPurpose::class,
            'size_bytes' => 'integer',
            'deleted_at' => 'datetime',
        ];
    }
}
