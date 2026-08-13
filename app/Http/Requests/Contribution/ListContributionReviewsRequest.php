<?php

declare(strict_types=1);

namespace App\Http\Requests\Contribution;

use App\Enums\ContributionStatus;
use App\Models\Contribution;
use App\Models\Institution;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

final class ListContributionReviewsRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        $institution = $this->route('institution');

        return $user instanceof User
            && $institution instanceof Institution
            && Gate::forUser($user)->allows('viewAny', [Contribution::class, $institution]);
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'status' => [
                'nullable',
                Rule::in(array_merge(
                    ['all'],
                    array_map(
                        static fn (ContributionStatus $status): string => $status->value,
                        ContributionStatus::cases(),
                    ),
                )),
            ],
            'sort' => ['nullable', Rule::in(['oldest', 'newest'])],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }

    public function status(): ?ContributionStatus
    {
        $status = $this->validated('status');

        if ($status === null || $status === ContributionStatus::Pending->value) {
            return ContributionStatus::Pending;
        }

        return $status === 'all' ? null : ContributionStatus::from((string) $status);
    }

    public function sort(): string
    {
        return (string) $this->validated('sort', 'oldest');
    }
}
