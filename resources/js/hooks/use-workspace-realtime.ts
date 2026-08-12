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

type WorkspaceRealtimeOptions = {
    institutionId: number;
    projectId: number;
    onTaskDelta: (delta: WorkspaceRealtimeDelta) => void;
    onDiscussionDelta: (delta: WorkspaceRealtimeDelta) => void;
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
        typeof occurredAt !== 'string'
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

export function useWorkspaceRealtime({
    institutionId,
    projectId,
    onTaskDelta,
    onDiscussionDelta,
}: WorkspaceRealtimeOptions) {
    const [connectionState, setConnectionState] =
        useState<WorkspaceRealtimeStatus>('connecting');
    const [presenceMembers, setPresenceMembers] = useState<
        WorkspacePresenceMember[]
    >([]);
    const [retryNonce, setRetryNonce] = useState(0);
    const callbacks = useRef({ onTaskDelta, onDiscussionDelta });
    const seenEvents = useRef<Set<string>>(new Set());

    useEffect(() => {
        callbacks.current = { onTaskDelta, onDiscussionDelta };
    }, [onDiscussionDelta, onTaskDelta]);

    useEffect(() => {
        let isActive = true;
        const echo = getWorkspaceEcho();

        seenEvents.current.clear();

        if (echo === null) {
            queueMicrotask(() => {
                if (isActive) {
                    setConnectionState('unavailable');
                }
            });

            return;
        }

        queueMicrotask(() => {
            if (isActive) {
                setConnectionState('connecting');
            }
        });
        let hasConnected = false;

        const workspaceChannelName = `institutions.${institutionId}.projects.${projectId}.workspace`;
        const presenceChannelName = `institutions.${institutionId}.projects.${projectId}.presence`;

        const handleConnectionChange = (status: ConnectionStatus): void => {
            if (isActive) {
                const nextStatus = mapConnectionStatus(status);

                if (nextStatus === 'connected') {
                    hasConnected = true;
                }

                setConnectionState(
                    nextStatus === 'connecting' && hasConnected
                        ? 'reconnecting'
                        : nextStatus,
                );
            }
        };

        const removeConnectionListener = echo.connector.onConnectionChange(
            handleConnectionChange,
        );

        const handleTaskDelta = (payload: unknown): void => {
            const delta = parseDelta(payload, 'task', institutionId, projectId);

            if (delta === null) {
                return;
            }

            const key = eventKey(delta);

            if (seenEvents.current.has(key)) {
                return;
            }

            if (seenEvents.current.size >= 300) {
                seenEvents.current.clear();
            }

            seenEvents.current.add(key);
            callbacks.current.onTaskDelta(delta);
        };

        const handleDiscussionDelta = (payload: unknown): void => {
            const delta = parseDelta(
                payload,
                'discussion',
                institutionId,
                projectId,
            );

            if (delta === null) {
                return;
            }

            const key = eventKey(delta);

            if (seenEvents.current.has(key)) {
                return;
            }

            if (seenEvents.current.size >= 300) {
                seenEvents.current.clear();
            }

            seenEvents.current.add(key);
            callbacks.current.onDiscussionDelta(delta);
        };

        const handleChannelError = (): void => {
            if (isActive) {
                setConnectionState('unavailable');
            }
        };

        const workspaceChannel = echo
            .private(workspaceChannelName)
            .listen(TASK_EVENT, handleTaskDelta)
            .listen(DISCUSSION_EVENT, handleDiscussionDelta)
            .subscribed(() => {
                if (isActive) {
                    hasConnected = true;
                    setConnectionState('connected');
                }
            })
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
        resetWorkspaceEcho();
        setRetryNonce((current) => current + 1);
    }

    return {
        connectionState,
        presenceMembers,
        retryConnection,
    } as const;
}
