<?php

declare(strict_types=1);

namespace App\Actions\Gamification;

use App\Actions\Audit\AuditRecorder;
use App\Enums\BadgeCategory;
use App\Models\BadgeDefinition;
use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use InvalidArgumentException;

final class CreateBadgeDefinition
{
    public function __construct(
        private readonly AuditRecorder $audit,
    ) {}

    public function execute(
        User $actor,
        string $key,
        BadgeCategory|string $category,
        int $level,
        string $publicName,
        string $publicDescription,
    ): BadgeDefinition {
        Gate::forUser($actor)->authorize('create', BadgeDefinition::class);

        $key = $this->validatedKey($key);
        $category = $category instanceof BadgeCategory
            ? $category
            : BadgeCategory::tryFrom($category)
                ?? throw new InvalidArgumentException('Badge category tidak dikenali.');

        if ($level < 1 || $level > 255) {
            throw new InvalidArgumentException('Badge level harus berada di antara 1 dan 255.');
        }

        $publicName = $this->validatedCopy($publicName, 'Badge public name', 120);
        $publicDescription = $this->validatedCopy(
            $publicDescription,
            'Badge public description',
            2000,
        );

        $definition = BadgeDefinition::query()->forceCreate([
            'key' => $key,
            'category' => $category,
            'level' => $level,
            'public_name' => $publicName,
            'public_description' => $publicDescription,
        ]);

        $this->audit->record(
            operation: 'badge.definition.created',
            auditable: $definition,
            actor: $actor,
            after: [
                'badge_definition_id' => $definition->getKey(),
                'key' => $definition->key,
                'category' => $definition->category->value,
                'level' => $definition->level,
            ],
            reason: 'taxonomy_change',
        );

        return $definition;
    }

    public function handle(
        User $actor,
        string $key,
        BadgeCategory|string $category,
        int $level,
        string $publicName,
        string $publicDescription,
    ): BadgeDefinition {
        return $this->execute($actor, $key, $category, $level, $publicName, $publicDescription);
    }

    private function validatedKey(string $key): string
    {
        $key = (string) Str::of($key)->trim()->lower();

        if (
            $key === ''
            || Str::length($key) > 100
            || preg_match('/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/', $key) !== 1
        ) {
            throw new InvalidArgumentException('Badge key harus berupa identifier canonical.');
        }

        return $key;
    }

    private function validatedCopy(string $copy, string $label, int $maxLength): string
    {
        $copy = (string) Str::of($copy)->squish();

        if ($copy === '' || Str::length($copy) > $maxLength) {
            throw new InvalidArgumentException("{$label} wajib diisi dan maksimal {$maxLength} karakter.");
        }

        return $copy;
    }
}
