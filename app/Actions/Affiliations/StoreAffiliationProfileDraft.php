<?php

namespace App\Actions\Affiliations;

use App\Models\AffiliationProfileDraft as AffiliationProfileDraftModel;
use App\Models\AffiliationRequest;
use App\Models\Institution;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Validation\ValidationException;

final class StoreAffiliationProfileDraft
{
    /**
     * @param  array{faculty?: string|null, study_program?: string|null, admission_year?: int|string|null}|null  $academicProfile
     */
    public function handle(
        User $student,
        Institution $institution,
        AffiliationRequest $affiliationRequest,
        ?array $academicProfile,
    ): void {
        if ($academicProfile === null) {
            return;
        }

        if (
            $affiliationRequest->user_id !== $student->getKey()
            || $affiliationRequest->institution_id !== $institution->getKey()
        ) {
            throw new AuthorizationException;
        }

        $draftQuery = AffiliationProfileDraftModel::query()
            ->whereBelongsTo($student, 'user')
            ->whereBelongsTo($institution, 'institution')
            ->whereBelongsTo($affiliationRequest, 'affiliationRequest');

        $hasStudentProfile = StudentProfile::query()
            ->whereBelongsTo($student, 'user')
            ->whereBelongsTo($institution, 'institution')
            ->exists();

        if ($hasStudentProfile) {
            $draftQuery->delete();

            return;
        }

        $draft = $draftQuery->lockForUpdate()->first();
        $storedValues = $draft === null ? [] : $draft->academic_profile;
        $values = [];

        foreach (['faculty', 'study_program', 'admission_year'] as $field) {
            $storedValue = $this->normalizeAcademicValue($field, $storedValues[$field] ?? null);
            $hasIncomingValue = array_key_exists($field, $academicProfile);
            $incomingValue = $hasIncomingValue
                ? $this->normalizeAcademicValue($field, $academicProfile[$field])
                : null;

            if ($this->isAcademicValueSet($storedValue)) {
                if ($hasIncomingValue && $incomingValue !== $storedValue) {
                    throw ValidationException::withMessages([
                        $field => 'Data yang sudah tercatat saat pengajuan afiliasi tidak dapat diubah.',
                    ]);
                }

                $values[$field] = $storedValue;

                continue;
            }

            $values[$field] = $hasIncomingValue ? $incomingValue : $storedValue;
        }

        $hasAcademicValue = collect($values)->contains(
            static fn (mixed $value): bool => $value !== null && $value !== '',
        );

        if (! $hasAcademicValue) {
            $draftQuery->delete();

            return;
        }

        if ($draft === null) {
            AffiliationProfileDraftModel::query()->forceCreate([
                'affiliation_request_id' => $affiliationRequest->getKey(),
                'institution_id' => $institution->getKey(),
                'user_id' => $student->getKey(),
                'academic_profile' => $values,
            ]);

            return;
        }

        $draft->forceFill(['academic_profile' => $values])->save();
    }

    private function normalizeAcademicValue(string $field, mixed $value): mixed
    {
        if ($value === null) {
            return null;
        }

        if ($field === 'admission_year') {
            return is_numeric($value) ? (int) $value : $value;
        }

        if (! is_string($value)) {
            return $value;
        }

        $value = trim($value);

        return $value === '' ? null : $value;
    }

    private function isAcademicValueSet(mixed $value): bool
    {
        return $value !== null && $value !== '';
    }
}
