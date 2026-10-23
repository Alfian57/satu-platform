import type { ConnectionStatus } from 'laravel-echo';
import type { Dispatch, SetStateAction } from 'react';
import type { getWorkspaceEcho } from '@/lib/workspace-echo';
import type {
    WorkspacePresenceMember,
    WorkspaceRealtimeDelta,
    WorkspaceRealtimeStatus,
} from '@/types';

export type {
    WorkspacePresenceMember,
    WorkspaceRealtimeDelta,
    WorkspaceRealtimeStatus,
};

export const TASK_EVENT = '.workspace.task.changed';
export const DISCUSSION_EVENT = '.workspace.discussion.changed';
export const ATTACHMENT_EVENT = '.workspace.attachment.changed';
export const MAX_REMEMBERED_EVENTS = 300;

export const WORKSPACE_REALTIME_OPERATIONS = {
    task: [
        'task.created',
        'task.updated',
        'task.assigned',
        'task.unassigned',
        'task.status_changed',
        'task.deleted',
    ],
    discussion: [
        'discussion.created',
        'discussion.updated',
        'discussion.deleted',
        'discussion.attachment.created',
        'discussion.attachment.deleted',
    ],
    attachment: ['attachment.created', 'attachment.deleted'],
} as const;

export type UnknownRecord = Record<string, unknown>;

export type WorkspaceEchoInstance = NonNullable<
    ReturnType<typeof getWorkspaceEcho>
>;

export type WorkspaceRealtimeOptions = {
    enabled?: boolean;
    institutionId: number;
    projectId: number;
    onTaskDelta: (delta: WorkspaceRealtimeDelta) => void;
    onDiscussionDelta: (delta: WorkspaceRealtimeDelta) => void;
    onAttachmentDelta: (delta: WorkspaceRealtimeDelta) => void;
    onReconnect: () => void;
};

export type DeltaCallbacks = {
    onTaskDelta: (delta: WorkspaceRealtimeDelta) => void;
    onDiscussionDelta: (delta: WorkspaceRealtimeDelta) => void;
    onAttachmentDelta: (delta: WorkspaceRealtimeDelta) => void;
};

export function isRecord(value: unknown): value is UnknownRecord {
    return typeof value === 'object' && value !== null;
}

export function getWorkspaceChannelName(
    institutionId: number,
    projectId: number,
): string {
    return `institutions.${institutionId}.projects.${projectId}.workspace`;
}

export function getPresenceChannelName(
    institutionId: number,
    projectId: number,
): string {
    return `institutions.${institutionId}.projects.${projectId}.presence`;
}

export function parseDelta(
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
        resourceId <= 0 ||
        eventResource !== resource ||
        typeof operation !== 'string' ||
        !WORKSPACE_REALTIME_OPERATIONS[resource].includes(operation as never) ||
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

export function normalizePresenceMembers(
    value: unknown,
): WorkspacePresenceMember[] {
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

export function addPresenceMember(
    currentMembers: WorkspacePresenceMember[],
    newMember: unknown,
): WorkspacePresenceMember[] {
    return normalizePresenceMembers([...currentMembers, newMember]);
}

export function removePresenceMember(
    currentMembers: WorkspacePresenceMember[],
    leavingMember: unknown,
): WorkspacePresenceMember[] {
    if (!isRecord(leavingMember)) {
        return currentMembers;
    }

    return currentMembers.filter(
        (member) => String(member.id) !== String(leavingMember.id),
    );
}

export function createPresenceHandlers(
    getIsActive: () => boolean,
    setPresenceMembers: Dispatch<SetStateAction<WorkspacePresenceMember[]>>,
): {
    handlePresenceHere: (members: unknown) => void;
    handlePresenceJoining: (member: unknown) => void;
    handlePresenceLeaving: (member: unknown) => void;
} {
    return {
        handlePresenceHere: (members) => {
            if (getIsActive()) {
                setPresenceMembers(normalizePresenceMembers(members));
            }
        },
        handlePresenceJoining: (member) => {
            if (getIsActive()) {
                setPresenceMembers((currentMembers) =>
                    addPresenceMember(currentMembers, member),
                );
            }
        },
        handlePresenceLeaving: (member) => {
            if (getIsActive()) {
                setPresenceMembers((currentMembers) =>
                    removePresenceMember(currentMembers, member),
                );
            }
        },
    };
}

export function mapConnectionStatus(
    status: ConnectionStatus,
): WorkspaceRealtimeStatus {
    return status === 'failed' ? 'unavailable' : status;
}

export function attachWindowNetworkListeners(
    onOffline: () => void,
    onOnline: () => void,
): () => void {
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);

    return () => {
        window.removeEventListener('offline', onOffline);
        window.removeEventListener('online', onOnline);
    };
}

export function eventKey(delta: WorkspaceRealtimeDelta): string {
    return [
        delta.resource,
        delta.operation,
        delta.resource_id,
        delta.version ?? '',
        delta.occurred_at,
    ].join(':');
}

export function eventResourceKey(delta: WorkspaceRealtimeDelta): string {
    return `${delta.resource}:${delta.resource_id}`;
}

export function rememberEvent(
    events: Map<string, true>,
    key: string,
    maxEvents: number = MAX_REMEMBERED_EVENTS,
): void {
    if (events.has(key)) {
        return;
    }

    if (events.size >= maxEvents) {
        const oldestKey = events.keys().next().value;

        if (typeof oldestKey === 'string') {
            events.delete(oldestKey);
        }
    }

    events.set(key, true);
}

export function rememberLatestEvent(
    events: Map<string, string>,
    key: string,
    occurredAt: string,
    maxEvents: number = MAX_REMEMBERED_EVENTS,
): void {
    if (events.size >= maxEvents && !events.has(key)) {
        const oldestKey = events.keys().next().value;

        if (typeof oldestKey === 'string') {
            events.delete(oldestKey);
        }
    }

    events.delete(key);
    events.set(key, occurredAt);
}

export function isOlderEvent(
    events: Map<string, string>,
    delta: WorkspaceRealtimeDelta,
): boolean {
    const previousOccurredAt = events.get(eventResourceKey(delta));

    if (previousOccurredAt === undefined) {
        return false;
    }

    return Date.parse(delta.occurred_at) < Date.parse(previousOccurredAt);
}

export function processDeltaPayload(
    payload: unknown,
    resource: WorkspaceRealtimeDelta['resource'],
    institutionId: number,
    projectId: number,
    seenEvents: Map<string, true>,
    latestEvents: Map<string, string>,
    onDelta: (delta: WorkspaceRealtimeDelta) => void,
): void {
    const delta = parseDelta(payload, resource, institutionId, projectId);

    if (delta === null || isOlderEvent(latestEvents, delta)) {
        return;
    }

    const key = eventKey(delta);

    if (seenEvents.has(key)) {
        return;
    }

    rememberEvent(seenEvents, key);
    rememberLatestEvent(
        latestEvents,
        eventResourceKey(delta),
        delta.occurred_at,
    );
    onDelta(delta);
}

export function createDeltaHandlers(
    institutionId: number,
    projectId: number,
    seenEvents: Map<string, true>,
    latestEvents: Map<string, string>,
    getCallbacks: () => DeltaCallbacks,
): {
    handleTaskDelta: (payload: unknown) => void;
    handleDiscussionDelta: (payload: unknown) => void;
    handleAttachmentDelta: (payload: unknown) => void;
} {
    return {
        handleTaskDelta: (payload) =>
            processDeltaPayload(
                payload,
                'task',
                institutionId,
                projectId,
                seenEvents,
                latestEvents,
                getCallbacks().onTaskDelta,
            ),
        handleDiscussionDelta: (payload) =>
            processDeltaPayload(
                payload,
                'discussion',
                institutionId,
                projectId,
                seenEvents,
                latestEvents,
                getCallbacks().onDiscussionDelta,
            ),
        handleAttachmentDelta: (payload) =>
            processDeltaPayload(
                payload,
                'attachment',
                institutionId,
                projectId,
                seenEvents,
                latestEvents,
                getCallbacks().onAttachmentDelta,
            ),
    };
}

export function setupWorkspaceChannels(
    echo: WorkspaceEchoInstance,
    institutionId: number,
    projectId: number,
    handlers: {
        handleTaskDelta: (payload: unknown) => void;
        handleDiscussionDelta: (payload: unknown) => void;
        handleAttachmentDelta: (payload: unknown) => void;
        handleSubscribed: () => void;
        handleError: () => void;
        handlePresenceHere: (members: unknown) => void;
        handlePresenceJoining: (member: unknown) => void;
        handlePresenceLeaving: (member: unknown) => void;
    },
): () => void {
    const workspaceChannelName = getWorkspaceChannelName(
        institutionId,
        projectId,
    );
    const presenceChannelName = getPresenceChannelName(
        institutionId,
        projectId,
    );

    const workspaceChannel = echo
        .private(workspaceChannelName)
        .listen(TASK_EVENT, handlers.handleTaskDelta)
        .listen(DISCUSSION_EVENT, handlers.handleDiscussionDelta)
        .listen(ATTACHMENT_EVENT, handlers.handleAttachmentDelta)
        .subscribed(handlers.handleSubscribed)
        .error(handlers.handleError);

    echo.join(presenceChannelName)
        .here(handlers.handlePresenceHere)
        .joining(handlers.handlePresenceJoining)
        .leaving(handlers.handlePresenceLeaving)
        .error(handlers.handleError);

    return () => {
        workspaceChannel.stopListening(TASK_EVENT, handlers.handleTaskDelta);
        workspaceChannel.stopListening(
            ATTACHMENT_EVENT,
            handlers.handleAttachmentDelta,
        );
        workspaceChannel.stopListening(
            DISCUSSION_EVENT,
            handlers.handleDiscussionDelta,
        );
        echo.leave(workspaceChannelName);
        echo.leave(presenceChannelName);
    };
}
