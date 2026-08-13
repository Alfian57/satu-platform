<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Contribution\CreateContribution;
use App\Actions\Contribution\LinkContributionEvidence;
use App\Actions\Contribution\ReviewContribution;
use App\Actions\Contribution\ReviseContribution;
use App\Actions\Contribution\SubmitContribution;
use App\Enums\ContributionReviewDecision;
use App\Exceptions\InvalidContributionTransition;
use App\Exceptions\StaleContributionDecision;
use App\Http\Requests\Contribution\LinkContributionEvidenceRequest;
use App\Http\Requests\Contribution\ReviewContributionRequest;
use App\Http\Requests\Contribution\ReviseContributionRequest;
use App\Http\Requests\Contribution\ShowContributionRequest;
use App\Http\Requests\Contribution\StoreContributionRequest;
use App\Http\Requests\Contribution\SubmitContributionRequest;
use App\Models\Contribution;
use App\Models\Project;
use App\Models\User;
use App\Support\Contribution\ContributionSerializer;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

final class ContributionController extends Controller
{
    public function show(
        ShowContributionRequest $request,
        Contribution $contribution,
        ContributionSerializer $serializer,
    ): JsonResponse {
        return response()->json(['data' => $serializer->contribution($contribution)]);
    }

    public function store(
        StoreContributionRequest $request,
        Project $project,
        CreateContribution $createContribution,
        ContributionSerializer $serializer,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();
        $contribution = $createContribution->handle(
            actor: $user,
            project: $project,
            data: $request->validated(),
        );

        return response()->json(['data' => $serializer->contribution($contribution)], 201);
    }

    public function linkEvidence(
        LinkContributionEvidenceRequest $request,
        Contribution $contribution,
        LinkContributionEvidence $linkContributionEvidence,
        ContributionSerializer $serializer,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();

        try {
            $contribution = $linkContributionEvidence->handle(
                actor: $user,
                contribution: $contribution,
                evidence: $request->validated('evidence'),
            );
        } catch (InvalidContributionTransition $exception) {
            throw ValidationException::withMessages([
                'status' => $exception->getMessage(),
            ]);
        }

        return response()->json(['data' => $serializer->contribution($contribution)]);
    }

    public function submit(
        SubmitContributionRequest $request,
        Contribution $contribution,
        SubmitContribution $submitContribution,
        ContributionSerializer $serializer,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();

        try {
            $contribution = $submitContribution->handle($user, $contribution);
        } catch (InvalidContributionTransition $exception) {
            throw ValidationException::withMessages([
                'status' => $exception->getMessage(),
            ]);
        }

        return response()->json(['data' => $serializer->contribution($contribution)]);
    }

    public function review(
        ReviewContributionRequest $request,
        Contribution $contribution,
        ReviewContribution $reviewContribution,
        ContributionSerializer $serializer,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();

        try {
            $reviewContribution->handle(
                contribution: $contribution,
                reviewer: $user,
                decision: ContributionReviewDecision::from($request->string('decision')->toString()),
                expectedVersion: $request->integer('expected_version'),
                reason: $request->string('reason')->toString() ?: null,
                note: $request->string('note')->toString() ?: null,
            );
        } catch (InvalidContributionTransition|StaleContributionDecision $exception) {
            throw ValidationException::withMessages([
                'status' => $exception->getMessage(),
            ]);
        }

        return response()->json([
            'data' => $serializer->contribution($contribution->refresh()),
        ]);
    }

    public function revise(
        ReviseContributionRequest $request,
        Contribution $contribution,
        ReviseContribution $reviseContribution,
        ContributionSerializer $serializer,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();

        try {
            $contribution = $reviseContribution->handle(
                actor: $user,
                contribution: $contribution,
                data: $request->validated(),
            );
        } catch (InvalidContributionTransition $exception) {
            throw ValidationException::withMessages([
                'status' => $exception->getMessage(),
            ]);
        }

        return response()->json(['data' => $serializer->contribution($contribution)]);
    }
}
