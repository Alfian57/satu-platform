import type { ConnectionStatus } from 'laravel-echo';
import { useEffect, useRef, useState } from 'react';
import { getWorkspaceEcho, resetWorkspaceEcho } from '@/lib/workspace-echo';
import type {
    WorkspacePresenceMember,
    WorkspaceRealtimeDelta,
    WorkspaceRealtimeStatus,
} from '@/types';

const TASK_EVENT = '.workspace.task.changed';
const DISCUSSION_EVENT = '.workspace.discussion.changed';
const MAX_REMEMBERED_EVENTS = 300;

type WorkspaceRealtimeOptions = {
    institutionId: number;
    projectId: number;
    onTaskDelta: (delta: WorkspaceRealtimeDelta) => void;
    onDiscussionDelta: (delta: WorkspaceRealtimeDelta) => void;
    onReconnect: () => void;
};

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
    return typeof value === 'object' && value !== null;
}

function parseDelta(
    value: unknown,
    resource: WorkspaceRealtimeDelta['resource'],
    institutionId: number,
    projectId: number,
): WorkspaceRealtimeDelta | null {
    if (!isRecord(value)) {
        return null;
    }

    const resourceId = value.resource_id;
    const eventResource = value.resource;
    const operation = value.operation;
    const eventInstitutionId = value.institution_id;
    const eventProjectId = value.project_id;
    const version = value.version;
    const occurredAt = value.occurred_at;

    if (
        typeof resourceId !== 'number' ||
        !Number.isInteger(resourceId) ||
        eventResource !== resource ||
        typeof operation !== 'string' ||
        typeof eventInstitutionId !== 'number' ||
        typeof eventProjectId !== 'number' ||
        eventInstitutionId !== institutionId ||
        eventProjectId !== projectId ||
        (typeof version !== 'string' && version !== null) ||
        typeof occurredAt !== 'string' ||
        Number.isNaN(Date.parse(occurredAt))
    ) {
        return null;
    }

    return {
        resource,
        operation,
        resource_id: resourceId,
        project_id: eventProjectId,
        institution_id: eventInstitutionId,
        version,
        occurred_at: occurredAt,
    };
}

function normalizePresenceMembers(value: unknown): WorkspacePresenceMember[] {
    if (!Array.isArray(value)) {
        return [];
    }

    const members = new Map<string, WorkspacePresenceMember>();

    value.forEach((member) => {
        if (
            !isRecord(member) ||
            (typeof member.id !== 'string' && typeof member.id !== 'number') ||
            typeof member.name !== 'string'
        ) {
            return;
        }

        members.set(String(member.id), {
            id: member.id,
            name: member.name,
        });
    });

    return Array.from(members.values());
}

function mapConnectionStatus(
    status: ConnectionStatus,
): WorkspaceRealtimeStatus {
    return status === 'failed' ? 'unavailable' : status;
}

function eventKey(delta: WorkspaceRealtimeDelta): string {
    return [
        delta.resource,
        delta.operation,
        delta.resource_id,
        delta.version ?? '',
        delta.occurred_at,
    ].join(':');
}

function eventResourceKey(delta: WorkspaceRealtimeDelta): string {
    return `${delta.resource}:${delta.resource_id}`;
}

function rememberEvent(events: Map<string, true>, key: string): void {
    if (events.has(key)) {
        return;
    }

    if (events.size >= MAX_REMEMBERED_EVENTS) {
        const oldestKey = events.keys().next().value;

        if (typeof oldestKey === 'string') {
            events.delete(oldestKey);
        }
    }

    events.set(key, true);
}

function rememberLatestEvent(
    events: Map<string, string>,
    key: string,
    occurredAt: string,
): void {
    if (events.size >= MAX_REMEMBERED_EVENTS && !events.has(key)) {
        const oldestKey = events.keys().next().value;

        if (typeof oldestKey === 'string') {
            events.delete(oldestKey);
        }
    }

    events.delete(key);
    events.set(key, occurredAt);
}

function isOlderEvent(
    events: Map<string, string>,
    delta: WorkspaceRealtimeDelta,
): boolean {
    const previousOccurredAt = events.get(eventResourceKey(delta));

    if (previousOccurredAt === undefined) {
        return false;
    }

    return Date.parse(delta.occurred_at) < Date.parse(previousOccurredAt);
}

export function useWorkspaceRealtime({
    institutionId,
    projectId,
    onTaskDelta,
    onDiscussionDelta,
    onReconnect,
}: WorkspaceRealtimeOptions) {
    const [connectionState, setConnectionState] =
        useState<WorkspaceRealtimeStatus>('connecting');
    const [presenceMembers, setPresenceMembers] = useState<
        WorkspacePresenceMember[]
    >([]);
    const [retryNonce, setRetryNonce] = useState(0);
    const callbacks = useRef({
        onTaskDelta,
        onDiscussionDelta,
        onReconnect,
    });
    const seenEvents = useRef<Map<string, true>>(new Map());
    const latestEvents = useRef<Map<string, string>>(new Map());

    useEffect(() => {
        callbacks.current = { onTaskDelta, onDiscussionDelta, onReconnect };
    }, [onDiscussionDelta, onReconnect, onTaskDelta]);

    useEffect(() => {
        let isActive = true;
        let hasConnected = false;
        let isBrowserOffline = false;
        let needsReconciliation = false;

        seenEvents.current.clear();
        latestEvents.current.clear();

        const markConnected = (): void => {
            if (!isActive || isBrowserOffline) {
                return;
            }

            const shouldReconcile = needsReconciliation;
            hasConnected = true;
            needsReconciliation = false;
            setConnectionState('connected');

            if (shouldReconcile) {
                callbacks.current.onReconnect();
            }
        };

        const handleBrowserOffline = (): void => {
            if (!isActive) {
                return;
            }

            needsReconciliation = true;
            isBrowserOffline = true;
            setPresenceMembers([]);
            setConnectionState('offline');
            resetWorkspaceEcho();
        };

        const handleBrowserOnline = (): void => {
            if (!isActive) {
                return;
            }

            isBrowserOffline = false;
            setConnectionState('reconnecting');
            resetWorkspaceEcho();
            needsReconciliation = false;
            callbacks.current.onReconnect();
            setRetryNonce((current) => current + 1);
        };

        window.addEventListener('offline', handleBrowserOffline);
        window.addEventListener('online', handleBrowserOnline);

        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            isBrowserOffline = true;
            needsReconciliation = true;
            queueMicrotask(() => {
                if (isActive) {
                    setConnectionState('offline');
                }
            });

            return () => {
                isActive = false;
                window.removeEventListener('offline', handleBrowserOffline);
                window.removeEventListener('online', handleBrowserOnline);
            };
        }

        const echo = getWorkspaceEcho();

        if (echo === null) {
            queueMicrotask(() => {
                if (isActive) {
                    setConnectionState('unavailable');
                }
            });

            return () => {
                isActive = false;
                window.removeEventListener('offline', handleBrowserOffline);
                window.removeEventListener('online', handleBrowserOnline);
            };
        }

        queueMicrotask(() => {
            if (isActive) {
                setConnectionState('connecting');
            }
        });

        const workspaceChannelName = `institutions.${institutionId}.projects.${projectId}.workspace`;
        const presenceChannelName = `institutions.${institutionId}.projects.${projectId}.presence`;

        const handleConnectionChange = (status: ConnectionStatus): void => {
            if (!isActive) {
                return;
            }

            if (isBrowserOffline) {
                setConnectionState('offline');

                return;
            }

            const nextStatus = mapConnectionStatus(status);

            if (nextStatus === 'connected') {
                markConnected();

                return;
            }

            if (nextStatus === 'disconnected' || nextStatus === 'unavailable') {
                needsReconciliation = hasConnected;
            }

            setConnectionState(
                nextStatus === 'connecting' && hasConnected
                    ? 'reconnecting'
                    : nextStatus,
            );
        };

        const removeConnectionListener = echo.connector.onConnectionChange(
            handleConnectionChange,
        );

        const handleTaskDelta = (payload: unknown): void => {
            const delta = parseDelta(payload, 'task', institutionId, projectId);

            if (delta === null || isOlderEvent(latestEvents.current, delta)) {
                return;
            }

            const key = eventKey(delta);

            if (seenEvents.current.has(key)) {
                return;
            }

            rememberEvent(seenEvents.current, key);
            rememberLatestEvent(
                latestEvents.current,
                eventResourceKey(delta),
                delta.occurred_at,
            );
            callbacks.current.onTaskDelta(delta);
        };

        const handleDiscussionDelta = (payload: unknown): void => {
            const delta = parseDelta(
                payload,
                'discussion',
                institutionId,
                projectId,
            );

            if (delta === null || isOlderEvent(latestEvents.current, delta)) {
                return;
            }

            const key = eventKey(delta);

            if (seenEvents.current.has(key)) {
                return;
            }

            rememberEvent(seenEvents.current, key);
            rememberLatestEvent(
                latestEvents.current,
                eventResourceKey(delta),
                delta.occurred_at,
            );
            callbacks.current.onDiscussionDelta(delta);
        };

        const handleChannelError = (): void => {
            if (isActive) {
                if (isBrowserOffline) {
                    setConnectionState('offline');

                    return;
                }

                needsReconciliation = hasConnected;
                setConnectionState('unavailable');
            }
        };

        const workspaceChannel = echo
            .private(workspaceChannelName)
            .listen(TASK_EVENT, handleTaskDelta)
            .listen(DISCUSSION_EVENT, handleDiscussionDelta)
            .subscribed(markConnected)
            .error(handleChannelError);

        echo.join(presenceChannelName)
            .here((members: unknown) => {
                if (isActive) {
                    setPresenceMembers(normalizePresenceMembers(members));
                }
            })
            .joining((member: unknown) => {
                if (!isActive) {
                    return;
                }

                setPresenceMembers((currentMembers) =>
                    normalizePresenceMembers([...currentMembers, member]),
                );
            })
            .leaving((member: unknown) => {
                if (!isActive || !isRecord(member)) {
                    return;
                }

                setPresenceMembers((currentMembers) =>
                    currentMembers.filter(
                        (currentMember) =>
                            String(currentMember.id) !== String(member.id),
                    ),
                );
            })
            .error(handleChannelError);

        return () => {
            isActive = false;
            removeConnectionListener();
            window.removeEventListener('offline', handleBrowserOffline);
            window.removeEventListener('online', handleBrowserOnline);
            workspaceChannel.stopListening(TASK_EVENT, handleTaskDelta);
            workspaceChannel.stopListening(
                DISCUSSION_EVENT,
                handleDiscussionDelta,
            );
            echo.leave(workspaceChannelName);
            echo.leave(presenceChannelName);
        };
    }, [institutionId, projectId, retryNonce]);

    function retryConnection(): void {
        setConnectionState('reconnecting');
        resetWorkspaceEcho();
        callbacks.current.onReconnect();
        setRetryNonce((current) => current + 1);
    }

    return {
        connectionState,
        presenceMembers,
        retryConnection,
    } as const;
}
