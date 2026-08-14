<?php

namespace App\Http\Requests\Campus;

class ShowRosterImportRequest extends CampusRosterRequest
{
    protected function ability(): string
    {
        return 'viewAny';
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [];
    }
}
