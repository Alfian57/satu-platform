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
    ->withoutOverlapping();

Schedule::call(function () {
    $period = date('Y').'-S1';
    foreach (Institution::all() as $institution) {
        CalculateInstitutionInclusionSignals::dispatch($institution, $period);
    }
})->name('institution:calculate-inclusion-signals')
    ->daily()
    ->withoutOverlapping();

Schedule::command('matching:generate-recommendations')
    ->nightly()
    ->withoutOverlapping()
    ->runInBackground();
