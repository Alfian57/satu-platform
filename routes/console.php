<?php

use App\Jobs\CalculateInstitutionInclusionSignals;
use App\Models\Institution;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('message:dispatch-due')
    ->everyMinute()
    ->withoutOverlapping()
    ->onOneServer();

Schedule::call(function () {
    $period = date('Y').'-S1';
    Institution::query()->chunkById(100, function ($institutions) use ($period) {
        foreach ($institutions as $institution) {
            CalculateInstitutionInclusionSignals::dispatch($institution, $period);
        }
    });
})->name('institution:calculate-inclusion-signals')
    ->daily()
    ->withoutOverlapping()
    ->onOneServer();

Schedule::command('matching:generate-recommendations')
    ->dailyAt('02:00')
    ->withoutOverlapping()
    ->onOneServer()
    ->runInBackground();
