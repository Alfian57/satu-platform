import { Building2, ChevronDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { DashboardArchiveArt } from '@/components/dashboard-archive-art';

export const campusControlClass =
    'min-h-11 w-full min-w-0 rounded-xl border border-input bg-white px-3 py-2 text-base font-normal text-foreground shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35 disabled:cursor-not-allowed disabled:opacity-60';

export function CampusOperationHeader({
    title,
    description,
    institution,
    icon: Icon,
    eyebrow = 'Operasi kampus',
}: {
    title: string;
    description: string;
    institution: string | null;
    icon: LucideIcon;
    eyebrow?: string;
}) {
    return (
        <header className="relative isolate overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-white via-white to-accent/70 p-5 shadow-sm sm:p-6">
            <DashboardArchiveArt className="absolute -top-8 right-8 hidden size-40 opacity-35 sm:block" />
            <div className="relative flex min-w-0 flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 flex-1 basis-72 items-start gap-3 sm:gap-4">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-primary/10 bg-accent text-primary shadow-xs">
                        <Icon aria-hidden="true" className="size-6" />
                    </span>
                    <div className="min-w-0">
                        <p className="text-xs font-semibold text-primary">
                            {eyebrow}
                        </p>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight wrap-anywhere sm:text-3xl">
                            {title}
                        </h1>
                        <p className="mt-2 max-w-[65ch] text-sm leading-6 text-muted-foreground">
                            {description}
                        </p>
                    </div>
                </div>
                {institution && (
                    <span className="inline-flex max-w-full items-start gap-2 rounded-xl border border-primary/10 bg-accent/80 px-3 py-2 text-xs leading-5 font-semibold text-accent-foreground">
                        <Building2
                            aria-hidden="true"
                            className="mt-0.5 size-4 shrink-0"
                        />
                        <span className="min-w-0 wrap-anywhere">
                            {institution}
                        </span>
                    </span>
                )}
            </div>
        </header>
    );
}

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

export function CampusTechnicalDetails({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <details className="group min-w-0 rounded-2xl border border-border bg-accent/30">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                {title}
                <ChevronDown
                    aria-hidden="true"
                    className="size-4 shrink-0 text-primary transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
                />
            </summary>
            <div className="min-w-0 border-t border-border p-4 text-sm leading-6 text-muted-foreground">
                {children}
            </div>
        </details>
    );
}
