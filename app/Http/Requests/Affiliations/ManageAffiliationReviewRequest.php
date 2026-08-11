<?php

namespace App\Http\Requests\Affiliations;

use App\Models\AffiliationRequest;
use App\Models\Institution;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class ManageAffiliationReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        $institution = $this->route('institution');
        $affiliationRequest = $this->route('affiliationRequest');

        return $institution instanceof Institution
            && $affiliationRequest instanceof AffiliationRequest
            && $affiliationRequest->institution_id === $institution->getKey()
            && $this->user() !== null
            && Gate::forUser($this->user())->allows('review', $affiliationRequest);
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [];
    }
}
