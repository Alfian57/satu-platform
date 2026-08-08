<?php

namespace App\Support\Integration;

use App\Models\IntegrationConnection;

interface AcademicGateway
{
    /**
     * Send synchronization payload to the academic provider.
     *
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public function sync(IntegrationConnection $connection, array $payload): array;
}
