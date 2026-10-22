import { Link } from '@inertiajs/react';
import { ArrowUpRight, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { index as opportunitySupport } from '@/routes/opportunity-support';

export function ProjectSupportBanner({
    institutionId,
}: {
    institutionId: number;
}) {
    return (
        <aside
            aria-label="Bantuan menemukan kesempatan"
            className="project-discovery-support flex min-w-0 flex-col gap-2 rounded-2xl border border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
            <div className="flex min-w-0 items-start gap-3">
                <Lightbulb
                    aria-hidden="true"
                    className="mt-1 size-4 shrink-0 text-satu-orange-ink"
                />
                <p className="text-sm leading-6 text-muted-foreground">
                    <span className="font-semibold text-foreground">
                        Belum menemukan peran yang sesuai?
                    </span>{' '}
                    Bantuan kampus bersifat pilihan, bukan syarat bergabung.
                </p>
            </div>
            <Button
                variant="link"
                className="min-h-11 shrink-0 justify-start px-0"
                asChild
            >
                <Link href={opportunitySupport(institutionId)}>
                    Bantuan kesempatan{' '}
                    <ArrowUpRight aria-hidden="true" className="size-4" />
                </Link>
            </Button>
        </aside>
    );
}
