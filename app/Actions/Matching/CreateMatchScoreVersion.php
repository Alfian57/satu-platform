<?php

declare(strict_types=1);

namespace App\Actions\Matching;

use App\Enums\MatchingDimension;
use App\Models\MatchScoreVersion;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\Gate;
use InvalidArgumentException;

final class CreateMatchScoreVersion
{
    /**
     * Persist an immutable, explicitly configured matching version.
     *
     * @param  array<string, mixed>  $weights
     * @param  array<string, mixed>  $parameters
     */
    public function execute(
        User $actor,
        string $version,
        array $weights,
        array $parameters,
        ?CarbonInterface $activatedAt = null,
        ?string $notes = null,
    ): MatchScoreVersion {
        Gate::forUser($actor)->authorize('create', MatchScoreVersion::class);

        $version = trim($version);

        if ($version === '' || mb_strlen($version) > 50 || preg_match('/\s/u', $version) === 1) {
            throw new InvalidArgumentException('Versi matching harus berupa identifier tanpa spasi dan maksimal 50 karakter.');
        }

        $normalizedWeights = $this->normalizeWeights($weights);
        $normalizedParameters = $this->normalizeParameters($parameters);

        if ($notes !== null && mb_strlen(trim($notes)) > 5000) {
            throw new InvalidArgumentException('Catatan versi matching tidak boleh melebihi 5000 karakter.');
        }

        return MatchScoreVersion::query()->create([
            'version' => $version,
            'dimensions' => array_map(
                static fn (MatchingDimension $dimension): string => $dimension->value,
                MatchingDimension::cases(),
            ),
            'weights' => $normalizedWeights,
            'parameters' => $normalizedParameters,
            'activated_at' => $activatedAt,
            'author_id' => $actor->getKey(),
            'notes' => $notes === null ? null : trim($notes),
        ]);
    }

    /**
     * @param  array<string, mixed>  $weights
     * @return array<string, float>
     */
    private function normalizeWeights(array $weights): array
    {
        $normalized = [];

        foreach (MatchingDimension::cases() as $dimension) {
            $value = $weights[$dimension->value] ?? null;

            if (! is_int($value) && ! is_float($value)) {
                throw new InvalidArgumentException("Weight {$dimension->value} harus berupa angka.");
            }

            if ($value < 0 || $value > 1) {
                throw new InvalidArgumentException("Weight {$dimension->value} harus berada di antara 0 dan 1.");
            }

            $normalized[$dimension->value] = (float) $value;
        }

        if (count($weights) !== count($normalized)) {
            throw new InvalidArgumentException('Konfigurasi weight harus memuat tepat empat dimensi matching.');
        }

        if (abs(array_sum($normalized) - 1.0) > 0.00001) {
            throw new InvalidArgumentException('Total weight matching harus sama dengan 1.');
        }

        return $normalized;
    }

    /**
     * @param  array<string, mixed>  $parameters
     * @return array{availability_target_minutes: int, connectivity_cap: int}
     */
    private function normalizeParameters(array $parameters): array
    {
        $required = ['availability_target_minutes', 'connectivity_cap'];

        if (array_diff(array_keys($parameters), $required) !== [] || count($parameters) !== count($required)) {
            throw new InvalidArgumentException(
                'Parameter matching harus memuat availability_target_minutes dan connectivity_cap saja.',
            );
        }

        foreach ($required as $parameter) {
            if (! is_int($parameters[$parameter]) || $parameters[$parameter] < 1) {
                throw new InvalidArgumentException("Parameter {$parameter} harus berupa bilangan positif.");
            }
        }

        return [
            'availability_target_minutes' => $parameters['availability_target_minutes'],
            'connectivity_cap' => $parameters['connectivity_cap'],
        ];
    }
}
