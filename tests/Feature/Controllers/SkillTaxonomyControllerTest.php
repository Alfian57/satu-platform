<?php

declare(strict_types=1);

use App\Models\SkillTaxonomy;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('returns json list of verified skill taxonomies for authenticated users', function () {
    $user = User::factory()->create();

    SkillTaxonomy::factory()->create(['name' => 'TypeScript', 'category' => 'software']);
    SkillTaxonomy::factory()->create(['name' => 'Docker', 'category' => 'infrastructure']);

    $response = $this->actingAs($user)
        ->getJson(route('skills.taxonomy.index', ['category' => 'software']));

    $response->assertStatus(200);
    $response->assertJson([
        'data' => [
            [
                'name' => 'TypeScript',
                'category' => 'software',
            ],
        ],
    ]);
});
