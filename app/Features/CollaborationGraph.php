<?php

namespace App\Features;

/**
 * Feature flag for the collaboration graph projection engine.
 *
 * Three states (all strings for Pennant storage consistency):
 * - 'disabled': engine not available
 * - 'synthetic': synthetic demo data only
 * - 'active': approved real data activation
 */
final class CollaborationGraph
{
    /**
     * Resolve the initial value of the feature.
     *
     * Defaults to disabled. Real activation requires DPIA, lawful basis,
     * retention policy, notice, and human governance approval.
     */
    public function resolve(mixed $scope): string
    {
        return 'disabled';
    }
}
