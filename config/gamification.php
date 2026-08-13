<?php

return [
    'policy_version' => '1.0.0',
    'verified_contribution_amount' => (int) env('SATU_VERIFIED_CONTRIBUTION_XP', 1),
    'leaderboard_rule_version' => '1.0.0',
    'leaderboard_minimum_cohort' => 5,
    'leaderboard_stale_hours' => 24,
];
