<?php

declare(strict_types=1);

namespace App\Http\Requests\Matching;

use App\Models\Institution;
use App\Models\Recommendation;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

final class RefreshRecommendationsRequest extends FormRequest
{
    public function authorize(): bool
    {
        $institution = Institution::query()->find($this->integer('institution_id'));
        $user = $this->user();

        return $institution !== null && $user instanceof User && $user->can('viewAny', [Recommendation::class, $institution]);
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return ['institution_id' => ['required', 'integer', 'min:1'], 'candidate_id' => ['prohibited'], 'version_id' => ['prohibited'], 'weights' => ['prohibited'], 'parameters' => ['prohibited']];
    }
}
