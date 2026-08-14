<?php

namespace App\Http\Requests\Campus;

use App\Models\Institution;
use App\Models\InstitutionRoster;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

abstract class CampusRosterRequest extends FormRequest
{
    public function authorize(): bool
    {
        $institution = $this->route('institution');
        $user = $this->user();

        return $institution instanceof Institution
            && $user !== null
            && Gate::forUser($user)->allows(
                $this->ability(),
                [InstitutionRoster::class, $institution],
            );
    }

    abstract protected function ability(): string;
}
