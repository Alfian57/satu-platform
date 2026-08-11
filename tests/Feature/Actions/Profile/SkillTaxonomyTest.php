<?php

declare(strict_types=1);

use App\Actions\Profile\ListSkillTaxonomies;
use App\Actions\Profile\NormalizeSkillTaxonomy;
use App\Models\SkillTaxonomy;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('normalizes raw skill strings into title-case canonical taxonomy entries', function () {
    $action = app(NormalizeSkillTaxonomy::class);

    $raw = [' react.js ', 'PHP', ' react.js ', 'TAILWIND css'];
    $normalized = $action->execute($raw, defaultCategory: 'software');

    expect($normalized)->toBe(['React.js', 'Php', 'Tailwind Css']);

    expect(SkillTaxonomy::query()->where('name', 'React.js')->exists())->toBeTrue()
        ->and(SkillTaxonomy::query()->where('name', 'Php')->exists())->toBeTrue();
});

it('lists verified skill taxonomies filtered by category and query', function () {
    SkillTaxonomy::factory()->create(['name' => 'Laravel', 'category' => 'software']);
    SkillTaxonomy::factory()->create(['name' => 'Figma', 'category' => 'design']);

    $listAction = app(ListSkillTaxonomies::class);

    $softwareSkills = $listAction->execute(category: 'software');
    expect($softwareSkills)->toHaveCount(1)
        ->and($softwareSkills->first()->name)->toBe('Laravel');

    $searchSkills = $listAction->execute(query: 'Fig');
    expect($searchSkills)->toHaveCount(1)
        ->and($searchSkills->first()->name)->toBe('Figma');
});
