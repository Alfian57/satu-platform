<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\SkillTaxonomy;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PlatformSkillTaxonomyController extends Controller
{
    /**
     * Display skill taxonomies monitoring dashboard for platform admin.
     */
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        abort_unless($user instanceof User && $user->is_platform_admin, 403);

        $search = $request->string('q')->trim()->limit(100)->toString();
        $category = $request->string('category')->trim()->toString();
        $status = $request->string('status')->trim()->toString();

        $query = SkillTaxonomy::query()
            ->withCount(['profileSkills', 'projectRoleSkills'])
            ->orderBy('category')
            ->orderBy('name');

        if ($search !== '') {
            $query->where('name', 'like', '%'.$search.'%');
        }

        if ($category !== '' && $category !== 'all') {
            $query->where('category', $category);
        }

        if ($status === 'verified') {
            $query->where('is_verified', true);
        } elseif ($status === 'unverified') {
            $query->where('is_verified', false);
        }

        $allSkills = SkillTaxonomy::query()->get();
        $skills = $query->get();

        $categories = SkillTaxonomy::query()
            ->distinct()
            ->pluck('category')
            ->filter()
            ->values()
            ->all();

        return Inertia::render('platform/skills', [
            'filters' => [
                'q' => $search,
                'category' => $category !== '' ? $category : 'all',
                'status' => $status !== '' ? $status : 'all',
            ],
            'summary' => [
                'totalSkills' => $allSkills->count(),
                'verifiedSkills' => $allSkills->where('is_verified', true)->count(),
                'unverifiedSkills' => $allSkills->where('is_verified', false)->count(),
                'categoriesCount' => count($categories),
            ],
            'categories' => $categories,
            'skills' => $skills->map(fn (SkillTaxonomy $item): array => [
                'id' => $item->id,
                'name' => $item->name,
                'category' => $item->category,
                'description' => $item->description,
                'isVerified' => (bool) $item->is_verified,
                'profileSkillsCount' => (int) $item->profile_skills_count,
                'projectRoleSkillsCount' => (int) $item->project_role_skills_count,
                'createdAt' => $item->created_at->toIso8601String(),
                'updatedAt' => $item->updated_at->toIso8601String(),
            ])->values()->all(),
        ]);
    }

    /**
     * Admin manually create a canonical skill taxonomy.
     */
    public function store(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        abort_unless($user instanceof User && $user->is_platform_admin, 403);

        $validated = $request->validate([
            'name' => ['required', 'string', 'min:1', 'max:100'],
            'category' => ['required', 'string', 'max:50'],
            'description' => ['nullable', 'string', 'max:500'],
            'is_verified' => ['sometimes', 'boolean'],
        ]);

        SkillTaxonomy::firstOrCreate(
            ['name' => trim($validated['name'])],
            [
                'category' => trim($validated['category']),
                'description' => ! empty($validated['description']) ? trim($validated['description']) : null,
                'is_verified' => $validated['is_verified'] ?? true,
            ]
        );

        return back()->with('message', 'Taksonomi skill berhasil ditambahkan.');
    }

    /**
     * Update an existing skill taxonomy.
     */
    public function update(Request $request, SkillTaxonomy $skillTaxonomy): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        abort_unless($user instanceof User && $user->is_platform_admin, 403);

        $validated = $request->validate([
            'name' => ['required', 'string', 'min:1', 'max:100'],
            'category' => ['required', 'string', 'max:50'],
            'description' => ['nullable', 'string', 'max:500'],
            'is_verified' => ['sometimes', 'boolean'],
        ]);

        $skillTaxonomy->update([
            'name' => trim($validated['name']),
            'category' => trim($validated['category']),
            'description' => ! empty($validated['description']) ? trim($validated['description']) : null,
            'is_verified' => $validated['is_verified'] ?? $skillTaxonomy->is_verified,
        ]);

        return back()->with('message', 'Taksonomi skill berhasil diperbarui.');
    }

    /**
     * Toggle verification status for a skill taxonomy.
     */
    public function toggleVerification(Request $request, SkillTaxonomy $skillTaxonomy): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        abort_unless($user instanceof User && $user->is_platform_admin, 403);

        $skillTaxonomy->update([
            'is_verified' => ! $skillTaxonomy->is_verified,
        ]);

        return back()->with('message', 'Status verifikasi skill berhasil diubah.');
    }

    /**
     * Delete a skill taxonomy.
     */
    public function destroy(Request $request, SkillTaxonomy $skillTaxonomy): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        abort_unless($user instanceof User && $user->is_platform_admin, 403);

        $skillTaxonomy->delete();

        return back()->with('message', 'Taksonomi skill berhasil dihapus.');
    }
}
