<?php

namespace App\Http\Requests\Affiliations;

use App\Enums\AffiliationReviewDecision;
use App\Enums\AffiliationReviewReason;
use Illuminate\Validation\Rule;

class ReviewAffiliationRequestRequest extends ManageAffiliationReviewRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'decision' => ['bail', 'required', Rule::enum(AffiliationReviewDecision::class)],
            'reason_code' => [
                'bail',
                'required',
                Rule::enum(AffiliationReviewReason::class),
                function (string $attribute, mixed $value, \Closure $fail): void {
                    $decision = AffiliationReviewDecision::tryFrom((string) $this->input('decision'));
                    $reason = AffiliationReviewReason::tryFrom((string) $value);

                    if ($decision === null || $reason === null) {
                        return;
                    }

                    $allowed = match ($decision) {
                        AffiliationReviewDecision::Approve => [AffiliationReviewReason::RecordsConfirmed],
                        AffiliationReviewDecision::RequestRevision => [
                            AffiliationReviewReason::NimCorrectionRequired,
                            AffiliationReviewReason::PhoneCorrectionRequired,
                            AffiliationReviewReason::SupportingEvidenceRequired,
                        ],
                        AffiliationReviewDecision::Reject => [AffiliationReviewReason::NotAffiliated],
                    };

                    if (! in_array($reason, $allowed, true)) {
                        $fail('Alasan tidak sesuai dengan keputusan yang dipilih.');
                    }
                },
            ],
            'expected_version' => ['bail', 'required', 'integer', 'min:1'],
            'note' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'decision.required' => 'Pilih keputusan review.',
            'decision.enum' => 'Keputusan review tidak valid.',
            'reason_code.required' => 'Pilih alasan keputusan.',
            'reason_code.enum' => 'Alasan keputusan tidak valid.',
            'expected_version.required' => 'Versi permintaan wajib disertakan.',
            'expected_version.integer' => 'Versi permintaan tidak valid.',
            'expected_version.min' => 'Versi permintaan tidak valid.',
            'note.max' => 'Catatan maksimal 1.000 karakter.',
        ];
    }
}
