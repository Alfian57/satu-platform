import type { ReactNode } from 'react';

export function CampusWorkflowGuide({
    title,
    steps,
    children,
}: {
    title: string;
    steps: { title: string; description: string }[];
    children?: ReactNode;
}) {
    return (
        <section
            aria-label={title}
            className="min-w-0 rounded-3xl border border-primary/15 bg-gradient-to-br from-accent/70 to-white p-5 shadow-sm"
        >
            <h2 className="text-base font-bold">{title}</h2>
            <ol className="mt-4 space-y-4">
                {steps.map((step, index) => (
                    <li key={step.title} className="flex items-start gap-3">
                        <span
                            aria-hidden="true"
                            className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-white text-xs font-semibold text-primary"
                        >
                            {index + 1}
                        </span>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold">
                                {step.title}
                            </p>
                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                {step.description}
                            </p>
                        </div>
                    </li>
                ))}
            </ol>
            {children && (
                <div className="mt-4 border-t border-primary/10 pt-4 text-sm leading-6 text-muted-foreground">
                    {children}
                </div>
            )}
        </section>
    );
}
