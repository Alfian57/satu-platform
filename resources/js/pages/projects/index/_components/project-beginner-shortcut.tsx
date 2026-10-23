import { CheckCircle2, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DiscoveryFilters } from '@/pages/projects/index/_components/catalog-utils';
import type { QueryParams } from '@/wayfinder';

export function ProjectBeginnerShortcut({
    filters,
    isPending,
    onVisitQuery,
}: {
    filters: DiscoveryFilters;
    isPending: boolean;
    onVisitQuery: (query: QueryParams) => void;
}) {
    return (
        <div
            className="project-discovery-beginner flex min-w-0 flex-col gap-3 rounded-xl p-3.5 sm:flex-row sm:items-center sm:justify-between"
            data-test="project-first-opportunity"
        >
            <div className="flex min-w-0 items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-satu-orange-border bg-white text-satu-orange-ink">
                    <Lightbulb aria-hidden="true" className="size-4" />
                </span>
                <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-foreground">
                        Mulai dari peran pertama
                    </h3>
                    <p className="mt-1 max-w-prose text-sm leading-6 text-muted-foreground">
                        Temukan peran terbuka yang menerima pemula, lalu baca
                        kriterianya.
                    </p>
                </div>
            </div>
            <Button
                type="button"
                variant="outline"
                className="min-h-11 shrink-0 bg-white"
                disabled={isPending}
                aria-pressed={
                    filters.beginner === 'accepting' &&
                    filters.availability === 'available'
                }
                onClick={() =>
                    onVisitQuery({
                        view: 'opportunities',
                        institution_id: filters.institution_id,
                        beginner: 'accepting',
                        availability: 'available',
                    })
                }
                data-test="project-beginner-shortcut"
            >
                {filters.beginner === 'accepting' &&
                    filters.availability === 'available' && (
                        <CheckCircle2 aria-hidden="true" />
                    )}
                Peran pemula
            </Button>
        </div>
    );
}
