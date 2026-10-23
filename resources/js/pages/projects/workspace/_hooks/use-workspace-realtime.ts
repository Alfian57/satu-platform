import type { ConnectionStatus } from 'laravel-echo';
import { useEffect, useRef, useState } from 'react';
import { getWorkspaceEcho, resetWorkspaceEcho } from '@/lib/workspace-echo';
import {
    attachWindowNetworkListeners,
    createDeltaHandlers,
    createPresenceHandlers,
    mapConnectionStatus,
    setupWorkspaceChannels,
} from '@/pages/projects/workspace/_utils/workspace-realtime-utils';
import type {
    WorkspacePresenceMember,
    WorkspaceRealtimeOptions,
    WorkspaceRealtimeStatus,
} from '@/pages/projects/workspace/_utils/workspace-realtime-utils';

export type { WorkspaceRealtimeOptions };

export function useWorkspaceRealtime({
    enabled = true,
    institutionId,
    projectId,
    onTaskDelta,
    onDiscussionDelta,
    onAttachmentDelta,
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
        onAttachmentDelta,
        onReconnect,
    });
    const seenEvents = useRef<Map<string, true>>(new Map());
    const latestEvents = useRef<Map<string, string>>(new Map());

    useEffect(() => {
        callbacks.current = {
            onTaskDelta,
            onDiscussionDelta,
            onAttachmentDelta,
            onReconnect,
        };
    }, [onDiscussionDelta, onAttachmentDelta, onReconnect, onTaskDelta]);

    useEffect(() => {
        if (!enabled) {
            return;
        }

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

            const shouldReconcile = !hasConnected || needsReconciliation;
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

        const detachNetworkListeners = attachWindowNetworkListeners(
            handleBrowserOffline,
            handleBrowserOnline,
        );

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
                detachNetworkListeners();
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
                detachNetworkListeners();
            };
        }

        queueMicrotask(() => {
            if (isActive) {
                setConnectionState('connecting');
            }
        });

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

        const removeConnectionListener = echo.connector.onConnectionChange(
            handleConnectionChange,
        );

        const {
            handleTaskDelta,
            handleDiscussionDelta,
            handleAttachmentDelta,
        } = createDeltaHandlers(
            institutionId,
            projectId,
            seenEvents.current,
            latestEvents.current,
            () => callbacks.current,
        );

        const presenceHandlers = createPresenceHandlers(
            () => isActive,
            setPresenceMembers,
        );

        const cleanupChannels = setupWorkspaceChannels(
            echo,
            institutionId,
            projectId,
            {
                handleTaskDelta,
                handleDiscussionDelta,
                handleAttachmentDelta,
                handleSubscribed: markConnected,
                handleError: handleChannelError,
                ...presenceHandlers,
            },
        );

        return () => {
            isActive = false;
            removeConnectionListener();
            detachNetworkListeners();
            cleanupChannels();
        };
    }, [enabled, institutionId, projectId, retryNonce]);

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
