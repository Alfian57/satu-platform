<?php

declare(strict_types=1);

namespace App\Support\Matching;

use App\Enums\MatchingDimension;
use InvalidArgumentException;

/**
 * Pure, version-configured matching scorer.
 *
 * No Eloquent model, message content, inclusion signal, or hidden sensitive
 * factor is read here. The same normalized input and configuration always
 * produce the same result.
 */
final class MatchingScorer
{
    /**
     * @param  array<string, mixed>  $weights
     * @param  array<string, mixed>  $parameters
     */
    public function score(
        MatchingInput $input,
        array $weights,
        array $parameters,
    ): MatchingResult {
        $normalizedWeights = $this->normalizeWeights($weights);
        $normalizedParameters = $this->normalizeParameters($parameters);

        $componentDetails = [
            MatchingDimension::SkillFit->value => $this->skillFit($input),
            MatchingDimension::ProjectNeed->value => $this->projectNeed($input),
            MatchingDimension::Availability->value => $this->availability(
                $input,
                $normalizedParameters['availability_target_minutes'],
            ),
            MatchingDimension::ConnectivityOpportunity->value => $this->connectivityOpportunity(
                $input,
                $normalizedParameters['connectivity_cap'],
            ),
        ];

        $components = [];
        $reasonCandidates = [];
        $totalScore = 0.0;

        foreach (MatchingDimension::cases() as $dimension) {
            $score = round($this->clamp($componentDetails[$dimension->value]['score']), 4);
            $components[$dimension->value] = $score;
            $totalScore += $score * $normalizedWeights[$dimension->value];
            $reasonCandidates[] = [
                'dimension' => $dimension->value,
                'score' => $score,
                'type' => $this->reasonType($score),
                'reason' => $componentDetails[$dimension->value]['reason'],
            ];
        }

        return new MatchingResult(
            projectId: $input->projectId,
            components: $components,
            totalScore: round($this->clamp($totalScore), 4),
            reasonCandidates: $reasonCandidates,
        );
    }

    /**
     * Rank results by score, then project ID for deterministic tie handling.
     *
     * @param  list<MatchingResult>  $results
     * @return list<MatchingResult>
     */
    public function rank(array $results): array
    {
        usort($results, static function (MatchingResult $left, MatchingResult $right): int {
            $scoreOrder = $right->totalScore <=> $left->totalScore;

            return $scoreOrder !== 0
                ? $scoreOrder
                : $left->projectId <=> $right->projectId;
        });

        return $results;
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
                throw new InvalidArgumentException(
                    "Weight {$dimension->value} harus berupa angka.",
                );
            }

            if ($value < 0 || $value > 1) {
                throw new InvalidArgumentException(
                    "Weight {$dimension->value} harus berada di antara 0 dan 1.",
                );
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
        $allowed = ['availability_target_minutes', 'connectivity_cap'];

        if (array_diff(array_keys($parameters), $allowed) !== [] || count($parameters) !== count($allowed)) {
            throw new InvalidArgumentException(
                'Parameter matching harus memuat availability_target_minutes dan connectivity_cap saja.',
            );
        }

        foreach ($allowed as $parameter) {
            if (! is_int($parameters[$parameter]) || $parameters[$parameter] < 1) {
                throw new InvalidArgumentException("Parameter {$parameter} harus berupa bilangan positif.");
            }
        }

        return [
            'availability_target_minutes' => $parameters['availability_target_minutes'],
            'connectivity_cap' => $parameters['connectivity_cap'],
        ];
    }

    /**
     * @return array{score: float, reason: string}
     */
    private function skillFit(MatchingInput $input): array
    {
        if ($input->projectRequirements === []) {
            return [
                'score' => 0.5,
                'reason' => 'Project belum memiliki skill requirement, sehingga kecocokan skill bersifat netral.',
            ];
        }

        $profileSkills = $this->profileSkillLevels($input);
        $weightedScore = 0.0;
        $totalWeight = 0;
        $matchedRequirements = 0;

        foreach ($input->projectRequirements as $requirement) {
            $weight = $requirement['role_capacity'];
            $requiredProficiency = $requirement['required_proficiency'];
            $candidateProficiency = $profileSkills[$requirement['taxonomy_id']] ?? 0;
            $score = $candidateProficiency === 0
                ? 0.0
                : min(1.0, $candidateProficiency / $requiredProficiency);

            if ($candidateProficiency > 0) {
                $matchedRequirements++;
            }

            $weightedScore += $score * $weight;
            $totalWeight += $weight;
        }

        $score = $totalWeight === 0 ? 0.5 : $weightedScore / $totalWeight;

        return [
            'score' => $score,
            'reason' => sprintf(
                'Kecocokan proficiency skill terhadap kebutuhan role sebesar %s (%d dari %d requirement memiliki skill terkait).',
                $this->percentage($score),
                $matchedRequirements,
                count($input->projectRequirements),
            ),
        ];
    }

    /**
     * @return array{score: float, reason: string}
     */
    private function projectNeed(MatchingInput $input): array
    {
        if ($input->projectRequirements === []) {
            return [
                'score' => 0.5,
                'reason' => 'Project belum memiliki requirement yang dapat dibandingkan dengan profil.',
            ];
        }

        $profileSkills = $this->profileSkillLevels($input);
        $profileInterests = array_fill_keys($input->profileInterests, true);
        $weightedScore = 0.0;
        $totalWeight = 0;
        $coveredRequirements = 0;

        foreach ($input->projectRequirements as $requirement) {
            $weight = $requirement['role_capacity'];
            $taxonomyId = $requirement['taxonomy_id'];
            $score = isset($profileSkills[$taxonomyId])
                ? 1.0
                : (isset($profileInterests[$taxonomyId]) ? 0.5 : 0.0);

            if ($score > 0) {
                $coveredRequirements++;
            }

            $weightedScore += $score * $weight;
            $totalWeight += $weight;
        }

        $score = $totalWeight === 0 ? 0.5 : $weightedScore / $totalWeight;

        return [
            'score' => $score,
            'reason' => sprintf(
                'Cakupan kebutuhan project berada di %s, termasuk skill dan interest yang relevan (%d dari %d requirement tercakup).',
                $this->percentage($score),
                $coveredRequirements,
                count($input->projectRequirements),
            ),
        ];
    }

    /**
     * @return array{score: float, reason: string}
     */
    private function availability(MatchingInput $input, int $targetMinutes): array
    {
        if ($input->availabilityWindows === []) {
            return [
                'score' => 0.0,
                'reason' => 'Profil belum memiliki availability window yang dapat dibandingkan.',
            ];
        }

        if ($input->requiredAvailabilityWindows !== []) {
            $requiredMinutes = $this->windowMinutes($input->requiredAvailabilityWindows);
            $overlapMinutes = $this->overlapMinutes(
                $input->availabilityWindows,
                $input->requiredAvailabilityWindows,
            );
            $score = $requiredMinutes === 0 ? 0.0 : $overlapMinutes / $requiredMinutes;

            return [
                'score' => $score,
                'reason' => sprintf(
                    'Availability profil memenuhi %s dari window waktu yang dibutuhkan project.',
                    $this->percentage($score),
                ),
            ];
        }

        $availableMinutes = $this->windowMinutes($input->availabilityWindows);
        $score = min(1.0, $availableMinutes / $targetMinutes);

        return [
            'score' => $score,
            'reason' => sprintf(
                'Availability profil menyediakan %d menit dari target %d menit per minggu (%s).',
                $availableMinutes,
                $targetMinutes,
                $this->percentage($score),
            ),
        ];
    }

    /**
     * @return array{score: float, reason: string}
     */
    private function connectivityOpportunity(MatchingInput $input, int $connectionCap): array
    {
        if ($input->collaborationEventCount === 0) {
            return [
                'score' => 0.5,
                'reason' => 'Data kolaborasi belum cukup untuk menghitung peluang koneksi secara kuat, sehingga nilainya netral.',
            ];
        }

        $score = 1.0 - min(1.0, max(0, $input->priorConnectionCount) / $connectionCap);

        return [
            'score' => $score,
            'reason' => sprintf(
                'Peluang koneksi baru berdasarkan metadata kolaborasi sebelumnya berada di %s.',
                $this->percentage($score),
            ),
        ];
    }

    /**
     * @return array<int, int>
     */
    private function profileSkillLevels(MatchingInput $input): array
    {
        $levels = [];

        foreach ($input->profileSkills as $skill) {
            $taxonomyId = $skill['taxonomy_id'];
            $levels[$taxonomyId] = max($levels[$taxonomyId] ?? 0, $skill['proficiency']);
        }

        return $levels;
    }

    /**
     * @param  list<array{day_of_week: int, starts_at: string, ends_at: string, timezone: string}>  $windows
     */
    private function windowMinutes(array $windows): int
    {
        return array_sum(array_map(
            fn (array $window): int => max(0, $this->toMinutes($window['ends_at']) - $this->toMinutes($window['starts_at'])),
            $windows,
        ));
    }

    /**
     * @param  list<array{day_of_week: int, starts_at: string, ends_at: string, timezone: string}>  $profileWindows
     * @param  list<array{day_of_week: int, starts_at: string, ends_at: string, timezone: string}>  $requiredWindows
     */
    private function overlapMinutes(array $profileWindows, array $requiredWindows): int
    {
        $overlap = 0;

        foreach ($requiredWindows as $required) {
            $requiredStart = $this->toMinutes($required['starts_at']);
            $requiredEnd = $this->toMinutes($required['ends_at']);

            foreach ($profileWindows as $profile) {
                if (
                    $profile['day_of_week'] !== $required['day_of_week']
                    || $profile['timezone'] !== $required['timezone']
                ) {
                    continue;
                }

                $overlap += max(0, min(
                    $this->toMinutes($profile['ends_at']),
                    $requiredEnd,
                ) - max(
                    $this->toMinutes($profile['starts_at']),
                    $requiredStart,
                ));
            }
        }

        return $overlap;
    }

    private function toMinutes(string $time): int
    {
        $parts = array_map('intval', explode(':', $time));

        return (int) $parts[0] * 60 + (int) $parts[1];
    }

    private function clamp(float $score): float
    {
        return max(0.0, min(1.0, $score));
    }

    private function percentage(float $score): string
    {
        return number_format($this->clamp($score) * 100, 1, '.', '').'%';
    }

    private function reasonType(float $score): string
    {
        return match (true) {
            $score >= 0.7 => 'positive',
            $score <= 0.3 => 'attention',
            default => 'neutral',
        };
    }
}
