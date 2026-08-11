<?php

declare(strict_types=1);

namespace App\Http\Requests\Project;

use App\Models\User;
use App\Support\Project\ProjectDiscoveryFilters;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class ListProjectsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() instanceof User;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'q' => ['sometimes', 'nullable', 'string', 'max:160'],
            'status' => ['sometimes', 'nullable', 'string', 'max:160'],
            'visibility' => ['sometimes', 'nullable', 'string', 'max:80'],
            'sort' => ['sometimes', Rule::in(ProjectDiscoveryFilters::sortableFields())],
            'direction' => ['sometimes', Rule::in(['asc', 'desc'])],
            'institution_id' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'between:1,50'],
            'page' => ['sometimes', 'integer', 'min:1'],
        ];
    }

    /**
     * @return list<Closure(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $this->validateEnumList(
                    $validator,
                    'status',
                    ProjectDiscoveryFilters::discoverableStatuses(),
                );
                $this->validateEnumList(
                    $validator,
                    'visibility',
                    ProjectDiscoveryFilters::discoverableVisibilities(),
                );
            },
        ];
    }

    public function filters(): ProjectDiscoveryFilters
    {
        /** @var array<string, mixed> $validated */
        $validated = $this->validated();

        return ProjectDiscoveryFilters::fromValidated($validated);
    }

    /**
     * @param  list<\BackedEnum>  $allowed
     */
    private function validateEnumList(
        Validator $validator,
        string $field,
        array $allowed,
    ): void {
        $value = $this->input($field);

        if ($value === null || $value === '') {
            return;
        }

        if (! is_string($value)) {
            $validator->errors()->add($field, 'Filter harus berupa daftar nilai yang dipisahkan koma.');

            return;
        }

        $allowedValues = array_map(
            static fn (\BackedEnum $enum): string => (string) $enum->value,
            $allowed,
        );

        foreach (array_filter(array_map('trim', explode(',', $value))) as $token) {
            if (! in_array($token, $allowedValues, true)) {
                $validator->errors()->add($field, "Nilai filter [{$token}] tidak didukung.");
            }
        }
    }
}
