<?php

declare(strict_types=1);

namespace App\Actions\Inclusion;

use App\Actions\Audit\AuditRecorder;
use App\Enums\InstitutionMembershipRole;
use App\Models\InclusionSignal;
use App\Models\User;
use App\Policies\InstitutionContextResolver;
use Exception;
use Illuminate\Auth\Access\AuthorizationException;
use Laravel\Pennant\Feature;

final class InclusionSignalDetail
{
    public function __construct(
        private readonly InstitutionContextResolver $institutionContextResolver,
        private readonly AuditRecorder $auditRecorder,
    ) {}

    /**
     * Fetch detail of an inclusion signal for an authorized reviewer.
     *
     * @throws Exception
     */
    public function execute(User $reviewer, InclusionSignal $signal): InclusionSignal
    {
        if (! Feature::active('inclusion-signal-engine')) {
            throw new Exception('Inclusion signal engine is not active.');
        }

        $signal->loadMissing('institution');

        $context = $this->institutionContextResolver->resolve(
            $reviewer,
            $signal->institution,
            [InstitutionMembershipRole::CampusAdmin],
        );

        if ($context === null) {
            throw new AuthorizationException('You are not authorized to view this inclusion signal.');
        }

        $signal->loadMissing([
            'subject:id,name',
            'version:id,name',
            'reviews.reviewer:id,name',
        ]);

        $this->auditRecorder->record(
            operation: 'inclusion_signal.accessed',
            auditable: $signal,
            actor: $reviewer,
            institution: $signal->institution,
            before: [],
            after: [
                'inclusion_signal_id' => $signal->id,
                'period' => $signal->period,
                'restricted_feature_state' => $signal->restricted_feature_state,
            ],
            reason: 'Reviewer accessed restricted inclusion signal details.',
        );

        return $signal;
    }
}
