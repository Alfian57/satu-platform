<?php

namespace App\Enums;

enum AffiliationReviewReason: string
{
    case RecordsConfirmed = 'records_confirmed';
    case NimCorrectionRequired = 'nim_correction_required';
    case PhoneCorrectionRequired = 'phone_correction_required';
    case SupportingEvidenceRequired = 'supporting_evidence_required';
    case NotAffiliated = 'not_affiliated';
}
