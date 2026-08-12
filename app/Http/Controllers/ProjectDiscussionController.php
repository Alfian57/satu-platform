<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Discussion\CreateDiscussion;
use App\Actions\Discussion\DeleteDiscussion;
use App\Actions\Discussion\UpdateDiscussion;
use App\Http\Requests\Discussion\DeleteDiscussionRequest;
use App\Http\Requests\Discussion\IndexDiscussionRequest;
use App\Http\Requests\Discussion\StoreDiscussionRequest;
use App\Http\Requests\Discussion\UpdateDiscussionRequest;
use App\Models\Message;
use App\Models\Project;
use App\Models\User;
use App\Support\Discussion\DiscussionSerializer;
use Illuminate\Http\JsonResponse;

final class ProjectDiscussionController extends Controller
{
    public function index(
        IndexDiscussionRequest $request,
        Project $project,
        DiscussionSerializer $serializer,
    ): JsonResponse {
        $filters = $request->filters();

        $messages = Message::query()
            ->forProject($project)
            ->with([
                'author:id,name',
                'attachments.uploadedBy:id,name',
            ])
            ->ordered()
            ->paginate($filters->perPage, ['*'], 'page', $filters->page)
            ->appends($filters->queryParameters());

        return response()->json($serializer->page($messages));
    }

    public function store(
        StoreDiscussionRequest $request,
        Project $project,
        CreateDiscussion $createDiscussion,
        DiscussionSerializer $serializer,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();
        $message = $createDiscussion->handle($user, $project, $request->validated());

        return response()->json(['data' => $serializer->message($message)], 201);
    }

    public function update(
        UpdateDiscussionRequest $request,
        Project $project,
        Message $message,
        UpdateDiscussion $updateDiscussion,
        DiscussionSerializer $serializer,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();
        $message = $updateDiscussion->handle($user, $message, $request->validated());

        return response()->json(['data' => $serializer->message($message)]);
    }

    public function destroy(
        DeleteDiscussionRequest $request,
        Project $project,
        Message $message,
        DeleteDiscussion $deleteDiscussion,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();
        $messageId = $message->getKey();
        $deleteDiscussion->handle($user, $message);

        return response()->json([
            'data' => [
                'deleted' => true,
                'message_id' => $messageId,
            ],
        ]);
    }
}
