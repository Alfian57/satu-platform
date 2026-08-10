<?php

declare(strict_types=1);

namespace App\Actions\Profile;

use App\Models\SkillTaxonomy;
use Illuminate\Support\Str;

final class NormalizeSkillTaxonomy
{
    /**
     * Normalize a collection or array of raw skill strings against canonical skill taxonomy.
     *
     * @param  array<int, string>  $rawSkills
     * @return array<int, string>
     */
    public function execute(array $rawSkills, string $defaultCategory = 'general'): array
    {
        $normalized = [];

        foreach ($rawSkills as $raw) {
            $trimmed = trim($raw);
            if ($trimmed === '') {
                continue;
            }

            $canonicalName = Str::title(strtolower($trimmed));

            /** @var SkillTaxonomy $taxonomy */
            $taxonomy = SkillTaxonomy::query()->firstOrCreate(
                ['name' => $canonicalName],
                [
                    'category' => $defaultCategory,
                    'is_verified' => true,
                    'description' => 'Canonical normalized skill entry.',
                ]
            );

            $normalized[] = $taxonomy->name;
        }

        return array_values(array_unique($normalized));
    }
}
