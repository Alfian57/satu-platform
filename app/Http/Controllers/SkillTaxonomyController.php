<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Profile\ListSkillTaxonomies;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SkillTaxonomyController extends Controller
{
    public function __construct(
        private readonly ListSkillTaxonomies $listAction,
    ) {}

    /**
     * Display JSON list of verified canonical skill taxonomies.
     */
    public function index(Request $request): JsonResponse
    {
        $category = $request->query('category');
        $query = $request->query('query');

        $taxonomies = $this->listAction->execute(
            category: is_string($category) ? $category : null,
            query: is_string($query) ? $query : null,
        );

        return response()->json([
            'data' => $taxonomies->map(fn ($item) => [
                'id' => $item->id,
                'name' => $item->name,
                'category' => $item->category,
                'description' => $item->description,
            ]),
        ]);
    }
}
