<?php

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
    foreach (\App\Models\Institution::all() as $institution) {
        \App\Jobs\CalculateInstitutionInclusionSignals::dispatch($institution, $period);
    }
})->daily()->withoutOverlapping();
