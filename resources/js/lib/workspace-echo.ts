import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

type WorkspaceEcho = Echo<'reverb'>;

let workspaceEcho: WorkspaceEcho | null = null;

function environmentValue(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
}

export function getWorkspaceEcho(): WorkspaceEcho | null {
    if (typeof window === 'undefined') {
        return null;
    }

    const key = environmentValue(import.meta.env.VITE_REVERB_APP_KEY);
    const host = environmentValue(import.meta.env.VITE_REVERB_HOST);
    const port = Number.parseInt(
        environmentValue(import.meta.env.VITE_REVERB_PORT),
        10,
    );

    if (!key || !host || !Number.isInteger(port) || port <= 0) {
        return null;
    }

    if (workspaceEcho !== null) {
        return workspaceEcho;
    }

    workspaceEcho = new Echo({
        broadcaster: 'reverb',
        key,
        wsHost: host,
        wsPort: port,
        wssPort: port,
        forceTLS:
            environmentValue(import.meta.env.VITE_REVERB_SCHEME) === 'https',
        enabledTransports: ['ws', 'wss'],
        disableStats: true,
        Pusher,
    });

    return workspaceEcho;
}

export function resetWorkspaceEcho(): void {
    workspaceEcho?.disconnect();
    workspaceEcho = null;
}
