<?php

namespace App\Http\Controllers;

use App\Actions\Campus\FetchCampusOverviewMetrics;
use App\Http\Requests\Campus\ShowCampusOverviewRequest;
use App\Models\Institution;
use Inertia\Inertia;
use Inertia\Response;

class CampusOverviewController extends Controller
{
    public function show(
        ShowCampusOverviewRequest $request,
        Institution $institution,
        FetchCampusOverviewMetrics $fetchOverviewMetrics,
    ): Response {
        $filters = $request->validated();
        $metrics = $fetchOverviewMetrics->handle($institution, $filters);

        return Inertia::render('campus/overview', [
            'institution' => [
                'id' => $institution->getKey(),
                'name' => $institution->name,
            ],
            'metrics' => $metrics['overview'],
            'programDistribution' => $metrics['program_distribution'],
            'members' => $metrics['members'],
            'filters' => $metrics['filters'],
        ]);
    }
}
