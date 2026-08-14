<?php

namespace App\Http\Requests\Campus;

class StoreRosterImportRequest extends CampusRosterRequest
{
    protected function ability(): string
    {
        return 'manage';
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [];
    }
}
