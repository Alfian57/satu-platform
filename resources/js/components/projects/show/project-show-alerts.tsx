export function ProjectShowAlerts({
    actionMessage,
    transitionErrorMessage,
    actionError,
}: {
    actionMessage: string | null;
    transitionErrorMessage?: string;
    actionError: string | null;
}) {
    return (
        <>
            {actionMessage && (
                <p
                    role="status"
                    aria-live="polite"
                    data-test="project-action-success"
                    className="rounded-2xl border border-verified/40 bg-verified-subtle px-4 py-3 text-sm text-verified-subtle-foreground"
                >
                    {actionMessage}
                </p>
            )}

            {transitionErrorMessage && (
                <p
                    role="alert"
                    data-test="project-transition-error"
                    className="rounded-2xl border border-correction/40 bg-correction-subtle px-4 py-3 text-sm text-correction-subtle-foreground"
                >
                    {transitionErrorMessage}
                </p>
            )}

            {actionError && (
                <p
                    role="alert"
                    data-test="project-action-error"
                    className="rounded-2xl border border-correction/40 bg-correction-subtle px-4 py-3 text-sm text-correction-subtle-foreground"
                >
                    {actionError}
                </p>
            )}
        </>
    );
}
