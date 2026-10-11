<?php

return [
    'enabled' => env('MATCHING_DYNAMIC_ENABLED', true),
    'production_approved' => env('MATCHING_PRODUCTION_APPROVED', false),
    'ttl_minutes' => 360,
];
