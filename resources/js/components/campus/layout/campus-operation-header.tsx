import { Building2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import CampusHeaderBackdrop from '@/components/campus-header-backdrop';
import type { CampusHeaderTheme } from '@/components/campus-header-backdrop';
import { DashboardArchiveArt } from '@/components/dashboard-archive-art';

export function CampusOperationHeader({
    title,
    description,
    institution,
    icon: Icon,
    eyebrow = 'Admin Universitas',
    theme,
    formal = true,
    testId,
    children,
    note,
}: {
    title: string;
    description: string;
    institution: string | null;
    icon: LucideIcon;
    eyebrow?: string;
    theme: CampusHeaderTheme;
    formal?: boolean;
    testId?: string;
    children?: ReactNode;
    note?: ReactNode;
}) {
    if (formal) {
        return (
            <header
                className="campus-operation-header min-w-0"
                data-campus-theme={theme}
                data-test={testId}
            >
                <CampusHeaderBackdrop theme={theme} />
                <div className="relative flex min-w-0 flex-wrap items-start justify-between gap-5">
                    <div className="flex min-w-0 flex-1 basis-72 items-start gap-3 sm:gap-4">
                        <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-primary/10 bg-accent/80 text-primary">
                            <Icon
                                aria-hidden="true"
                                className="size-6"
                                strokeWidth={1.75}
                            />
                        </span>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-satu-orange-ink">
                                {eyebrow}
                            </p>
                            <h1 className="mt-1 text-2xl leading-tight font-bold tracking-tight wrap-anywhere sm:text-3xl">
                                {title}
                            </h1>
                            <p className="mt-2 max-w-[65ch] text-sm leading-6 text-muted-foreground">
                                {description}
                            </p>
                        </div>
                    </div>
                    {institution && (
                        <p className="inline-flex max-w-full items-start gap-2 rounded-xl border border-border bg-white/90 px-3 py-2 text-xs leading-5 font-medium text-muted-foreground">
                            <Building2
                                aria-hidden="true"
                                className="mt-0.5 size-4 shrink-0 text-primary"
                            />
                            <span className="min-w-0 wrap-anywhere">
                                {institution}
                            </span>
                        </p>
                    )}
                </div>
                {(children || note) && (
                    <div className="relative mt-5 grid min-w-0 gap-3 border-t border-border/80 pt-4">
                        {children && (
                            <div className="flex min-w-0 flex-wrap items-center gap-3">
                                {children}
                            </div>
                        )}
                        {note && (
                            <div className="text-xs leading-5 text-muted-foreground">
                                {note}
                            </div>
                        )}
                    </div>
                )}
            </header>
        );
    }

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
