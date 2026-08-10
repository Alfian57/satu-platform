<?php

namespace App\Http\Controllers;

use App\Models\NotificationPreference;
use App\Support\Notification\NotificationSerializer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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

        $query = $request->user()->notifications();

        if ($filter === 'unread') {
            $query->whereNull('read_at');
        } elseif ($filter === 'read') {
            $query->whereNotNull('read_at');
        }

        $notifications = $query->orderBy('created_at', 'desc')
            ->paginate(20)
            ->through(fn ($n) => NotificationSerializer::toArray($n));

        $preferences = NotificationPreference::query()
            ->where('user_id', $request->user()->id)
            ->get()
            ->groupBy('purpose');

        return Inertia::render('notifications/index', [
            'notifications' => $notifications,
            'preferences' => $preferences,
            'filter' => $filter,
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
        $request->user()->unreadNotifications()->update(['read_at' => now()]);

        return back();
    }

    /**
     * Navigate to a notification's deep link with re-authorization.
     */
    public function navigate(Request $request, string $id): RedirectResponse|SymfonyResponse
    {
        $notification = $request->user()->notifications()->findOrFail($id);
        $notification->markAsRead();

        $actionUrl = $notification->data['action_url'] ?? null;

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
            'purpose' => ['required', 'string'],
            'channel' => ['required', 'string', 'in:in_app,whatsapp'],
            'enabled' => ['required', 'boolean'],
        ]);

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
}
