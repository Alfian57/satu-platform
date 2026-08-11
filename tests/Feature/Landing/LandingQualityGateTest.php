<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

it('renders public landing page successfully for guests with correct inertia component', function () {
    $response = $this->get(route('home'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('welcome')
        ->where('name', 'SATU')
        ->where('auth.user', null)
    );
});

it('presents valid brand and auth props on landing page', function () {
    $response = $this->get(route('home'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('welcome')
        ->has('name')
        ->has('auth')
    );
});

it('renders dashboard link prop for authenticated users', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('home'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('welcome')
        ->where('auth.user.id', $user->id)
    );
});

it('strictly enforces guest accessibility for landing route', function () {
    $response = $this->get(route('home'));

    $response->assertOk();
    $response->assertHeader('content-type', 'text/html; charset=UTF-8');
});
