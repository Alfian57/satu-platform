<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\AttachmentPurpose;
use App\Models\Attachment;
use App\Models\Message;
use App\Models\Project;
use App\Models\User;
use App\Support\Attachment\AttachmentStorage;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Attachment>
 */
class AttachmentFactory extends Factory
{
    protected $model = Attachment::class;

    public function configure(): static
    {
        return $this->afterMaking(function (Attachment $attachment): void {
            $project = Project::query()->find($attachment->project_id);

            if ($project !== null) {
                $attachment->path = AttachmentStorage::directory($project).'/'.Str::uuid();
            }
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $checksum = hash('sha256', fake()->uuid());

        return [
            'project_id' => Project::factory(),
            'message_id' => null,
            'uploaded_by_id' => User::factory(),
            'purpose' => AttachmentPurpose::Attachment,
            'disk' => AttachmentStorage::DISK,
            'path' => 'pending/'.Str::uuid(),
            'original_name' => 'evidence.pdf',
            'mime_type' => 'application/pdf',
            'size_bytes' => 1024,
            'sha256' => $checksum,
            'deduplication_key' => hash('sha256', 'factory:'.$checksum),
        ];
    }

    public function forMessage(Message $message): static
    {
        return $this->state([
            'project_id' => $message->project_id,
            'message_id' => $message->getKey(),
        ]);
    }

    public function evidence(): static
    {
        return $this->state([
            'purpose' => AttachmentPurpose::Evidence,
        ]);
    }

    public function deleted(): static
    {
        return $this->state([
            'deleted_at' => now(),
        ]);
    }
}
