<?php

namespace App\Http\Requests\Campus;

class PreviewRosterImportRequest extends CampusRosterRequest
{
    protected function ability(): string
    {
        return 'manage';
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:10240'],
            'semester' => ['required', 'string', 'max:50'],
        ];
    }
}
