<?php

use App\Models\Institution;
use App\Models\User;
use Database\Seeders\DemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;

uses(RefreshDatabase::class);

test('it seeds the synthetic demo dataset successfully without errors', function () {
    expect(fn () => Artisan::call('db:seed', ['--class' => DemoSeeder::class]))
        ->not->toThrow(Exception::class);
});

test('it seeds realistic data volume for typical state', function () {
    config(['app.demo_state' => 'typical']);
    Artisan::call('db:seed', ['--class' => DemoSeeder::class]);

    expect(Institution::count())->toBeGreaterThanOrEqual(2)
        ->and(User::count())->toBeGreaterThanOrEqual(80);
});
