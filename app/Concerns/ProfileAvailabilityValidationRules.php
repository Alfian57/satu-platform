<?php

namespace App\Concerns;

trait ProfileAvailabilityValidationRules
{
    /** @return array<string, array<int, mixed>> */
    protected function profileAvailabilityRules(string $key = 'availability_windows', bool $required = false): array
    {
        return [
            $key => [$required ? 'present' : 'sometimes', 'array', 'max:14'],
            $key.'.*' => ['array:day_of_week,starts_at,ends_at,timezone'],
            $key.'.*.day_of_week' => ['required', 'integer', 'between:0,6'],
            $key.'.*.starts_at' => ['required', 'date_format:H:i,H:i:s'],
            $key.'.*.ends_at' => ['required', 'date_format:H:i,H:i:s'],
            $key.'.*.timezone' => ['sometimes', 'timezone'],
            'timezone' => ['sometimes', 'nullable', 'timezone'],
        ];
    }
}
