import { actions, formatSupportDate } from './opportunity-support-constants';
import type { SupportEvent } from './opportunity-support-constants';

export function OpportunitySupportEventHistory({
    events,
}: {
    events: SupportEvent[];
}) {
    return (
        <>
            <h3 className="mt-6 border-t border-border pt-5 font-semibold">
                Riwayat, bukan klaim keberhasilan
            </h3>
            <ol className="mt-4 space-y-4">
                {events.map((event) => (
                    <li
                        key={event.id}
                        className="border-l-2 border-primary/20 pl-4"
                    >
                        <p className="text-sm font-semibold">
                            {actions[event.action] ?? event.action}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {formatSupportDate(event.created_at)}
                        </p>
                        {event.reason && (
                            <p className="mt-2 text-sm leading-6 break-words whitespace-pre-wrap">
                                {event.reason}
                            </p>
                        )}
                        {event.opportunity && (
                            <p className="mt-2 text-sm break-words">
                                {event.opportunity.project_title} /{' '}
                                {event.opportunity.role_title}
                            </p>
                        )}
                    </li>
                ))}
            </ol>
        </>
    );
}
