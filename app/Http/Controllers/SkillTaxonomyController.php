<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Profile\ListSkillTaxonomies;
use App\Models\SkillTaxonomy;
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
                'is_verified' => (bool) $item->is_verified,
            ]),
        ]);
    }

    /**
     * Dynamically create a new skill taxonomy (LinkedIn-style) or return existing one.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'min:1', 'max:100'],
            'category' => ['sometimes', 'nullable', 'string', 'max:50'],
        ]);

        $name = trim($validated['name']);
        $category = ! empty($validated['category']) ? trim($validated['category']) : 'software';

        // Check if existing skill with same name exists (case-insensitive)
        $existing = SkillTaxonomy::query()
            ->whereRaw('LOWER(name) = ?', [strtolower($name)])
            ->first();

        if ($existing !== null) {
            return response()->json([
                'data' => [
                    'id' => $existing->id,
                    'name' => $existing->name,
                    'category' => $existing->category,
                    'description' => $existing->description,
                    'is_verified' => (bool) $existing->is_verified,
                ],
            ], 200);
        }

        $skill = SkillTaxonomy::create([
            'name' => $name,
            'category' => $category,
            'description' => 'Skill ditambahkan oleh pengguna platform.',
            'is_verified' => true,
        ]);

        return response()->json([
            'data' => [
                'id' => $skill->id,
                'name' => $skill->name,
                'category' => $skill->category,
                'description' => $skill->description,
                'is_verified' => (bool) $skill->is_verified,
            ],
        ], 201);
    }
}
