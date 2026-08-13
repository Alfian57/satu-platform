<?php

namespace App\Http\Controllers;

use App\Enums\MessagePurpose;
use App\Models\NotificationPreference;
use App\Models\User;
use App\Support\Notification\NotificationCatalog;
use App\Support\Notification\NotificationSerializer;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class NotificationController extends Controller
{
    /**
     * List notifications with pagination and filter.
     */
    public function index(Request $request): Response
    {
        $filter = $request->query('filter', 'all');
        $filter = in_array($filter, ['all', 'unread', 'read'], true)
            ? $filter
            : 'all';
        $category = NotificationCatalog::normalizeCategory(
            $request->query('category'),
        );

        $query = $request->user()->notifications();

        if ($filter === 'unread') {
            $query->whereNull('read_at');
        } elseif ($filter === 'read') {
            $query->whereNotNull('read_at');
        }

        $this->applyCategoryFilter($query, $category);

        $notifications = $query->orderBy('created_at', 'desc')
            ->paginate(20)
            ->through(fn ($n) => NotificationSerializer::toArray($n));

        $savedPreferences = NotificationPreference::query()
            ->whereBelongsTo($request->user())
            ->where('channel', 'whatsapp')
            ->pluck('enabled', 'purpose')
            ->map(static fn (mixed $enabled): bool => (bool) $enabled)
            ->all();

        return Inertia::render('notifications/index', [
            'notifications' => $notifications,
            'categories' => NotificationCatalog::categories(),
            'preferences' => NotificationCatalog::whatsappPreferences($savedPreferences),
            'filter' => $filter,
            'category' => $category,
            'unreadCount' => $request->user()->unreadNotifications()->count(),
        ]);
    }

    /**
     * Mark a single notification as read.
     */
    public function markRead(Request $request, string $id): RedirectResponse
    {
        $notification = $request->user()->notifications()->findOrFail($id);
        $notification->markAsRead();

        return back();
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllRead(Request $request): RedirectResponse
    {
        $category = NotificationCatalog::normalizeCategory(
            $request->input('category'),
        );
        $query = $request->user()->unreadNotifications();

        $this->applyCategoryFilter($query, $category);
        $query->update(['read_at' => now()]);

        return back();
    }

    /**
     * Navigate to a notification's deep link with re-authorization.
     */
    public function navigate(Request $request, string $id): RedirectResponse|SymfonyResponse
    {
        $notification = $request->user()->notifications()->findOrFail($id);
        $notification->markAsRead();

        $actionUrl = $this->safeInternalActionUrl(
            $request,
            $notification->data['action_url'] ?? null,
        );

        if ($actionUrl === null) {
            return back();
        }

        return Inertia::location($actionUrl);
    }

    /**
     * Update notification channel preferences.
     */
    public function updatePreference(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'purpose' => [
                'required',
                'string',
                Rule::in(array_map(
                    static fn (MessagePurpose $purpose): string => $purpose->value,
                    MessagePurpose::cases(),
                )),
            ],
            'channel' => ['required', 'string', 'in:in_app,whatsapp'],
            'enabled' => ['required', 'boolean'],
        ]);

        if (
            $validated['channel'] === 'in_app'
            && $validated['enabled'] === false
        ) {
            throw ValidationException::withMessages([
                'enabled' => 'Notification in-app adalah history canonical dan tidak dapat dimatikan.',
            ]);
        }

        DB::transaction(function () use ($request, $validated) {
            NotificationPreference::query()->updateOrCreate(
                [
                    'user_id' => $request->user()->id,
                    'purpose' => $validated['purpose'],
                    'channel' => $validated['channel'],
                ],
                ['enabled' => $validated['enabled']],
            );
        });

        return back();
    }

    /**
     * @param  Builder<DatabaseNotification>|MorphMany<DatabaseNotification, User>  $query
     */
    private function applyCategoryFilter(Builder|MorphMany $query, string $category): void
    {
        $purposes = NotificationCatalog::purposesForCategory($category);

        if ($purposes !== []) {
            $query->where(function (Builder $query) use ($purposes): void {
                foreach ($purposes as $purpose) {
                    $query->orWhereJsonContains('data->purpose', $purpose);
                }
            });
        }
    }

    private function safeInternalActionUrl(Request $request, mixed $actionUrl): ?string
    {
        if (! is_string($actionUrl) || trim($actionUrl) === '') {
            return null;
        }

        $parts = parse_url($actionUrl);

        if ($parts === false) {
            return null;
        }

        if (
            isset($parts['scheme'])
            && ! in_array($parts['scheme'], ['http', 'https'], true)
        ) {
            return null;
        }

        if (isset($parts['host']) && ! hash_equals($request->getHost(), $parts['host'])) {
            return null;
        }

        return $actionUrl;
    }
}
