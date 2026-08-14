<?php

namespace App\Http\Requests\Campus;

use App\Enums\InstitutionMembershipRole;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\InstitutionStatus;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

class ShowCampusOverviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var User|null $user */
        $user = $this->user();

        if ($user === null) {
            return false;
        }

        /** @var Institution|null $institution */
        $institution = $this->route('institution');

        if ($institution === null) {
            return false;
        }

        if ($institution->status !== InstitutionStatus::Active) {
            return false;
        }

        return InstitutionMembership::query()
            ->where('institution_id', $institution->getKey())
            ->where('user_id', $user->getKey())
            ->where('status', InstitutionMembershipStatus::Verified)
            ->where('role', InstitutionMembershipRole::CampusAdmin)
            ->exists();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'program' => ['nullable', 'string', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
