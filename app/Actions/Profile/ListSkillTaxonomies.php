<?php

declare(strict_types=1);

namespace App\Actions\Profile;

use App\Models\SkillTaxonomy;
use Illuminate\Database\Eloquent\Collection;

final class ListSkillTaxonomies
{
    /**
     * List verified canonical skill taxonomies, optionally filtered by category or search query.
     *
     * @return Collection<int, SkillTaxonomy>
     */
    public function execute(?string $category = null, ?string $query = null): Collection
    {
        $builder = SkillTaxonomy::query()
            ->where('is_verified', true)
            ->orderBy('category')
            ->orderBy('name');

        if ($category !== null && trim($category) !== '') {
            $builder->where('category', trim($category));
        }

        if ($query !== null && trim($query) !== '') {
            $builder->where('name', 'like', '%'.trim($query).'%');
        }

        return $builder->get();
    }
}
