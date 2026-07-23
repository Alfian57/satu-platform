<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('authenticated pages receive the SATU shell context', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $pages = [
        'dashboard' => 'dashboard',
        'profile.edit' => 'settings/profile',
        'appearance.edit' => 'settings/appearance',
    ];

    foreach ($pages as $routeName => $component) {
        $this->get(route($routeName))
            ->assertSuccessful()
            ->assertInertia(
                fn (Assert $page) => $page
                    ->component($component)
                    ->where('name', 'SATU')
                    ->where('auth.user.id', $user->id)
                    ->where('shell.institutionMembership', null),
            );
    }
});

test('public pages receive a nullable authenticated user and shell context', function () {
    $this->get(route('home'))
        ->assertSuccessful()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('welcome')
                ->where('name', 'SATU')
                ->where('auth.user', null)
                ->where('shell.institutionMembership', null),
        );
});
