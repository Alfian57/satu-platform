<?php

return [
    'enabled' => env('OPPORTUNITY_SUPPORT_ENABLED', false),
    // Diisi hanya setelah persetujuan pemilik kebijakan, per ID institusi.
    // purpose, notice_version, approval_reference, access_days, reviewer_ids,
    // dataset_kind (real atau synthetic), dataset_manifest, real_data_approved.
    // Agregat memerlukan evaluation_approval dan minimum_cohort khusus.
    // Synthetic hanya untuk database pengujian terisolasi, bukan database lokal nyata.
    'institutions' => [],
];
