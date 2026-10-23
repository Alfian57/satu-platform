import { BriefcaseBusiness, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DiscoveryFilters } from '@/pages/projects/index/_components/catalog-utils';

export function ProjectViewNav({
    isMine,
    isPending,
    onChangeView,
}: {
    isMine: boolean;
    isPending: boolean;
    onChangeView: (view: DiscoveryFilters['view']) => void;
}) {
    return (
        <nav
            aria-label="Tampilan proyek"
            className="project-discovery-views flex min-w-0 flex-wrap items-center gap-1.5 border-b border-border pb-3"
            data-test="project-views"
        >
            <Button
                type="button"
                variant="ghost"
                disabled={isPending}
                aria-pressed={!isMine}
                onClick={() => onChangeView('opportunities')}
                className="project-discovery-view min-h-11 flex-1 sm:flex-none"
            >
                <Compass aria-hidden="true" className="size-4" />
                Peluang
            </Button>
            <Button
                type="button"
                variant="ghost"
                disabled={isPending}
                aria-pressed={isMine}
                onClick={() => onChangeView('mine')}
                className="project-discovery-view min-h-11 flex-1 sm:flex-none"
            >
                <BriefcaseBusiness aria-hidden="true" className="size-4" />
                Proyek saya
            </Button>
            <p className="basis-full px-3 py-1 text-xs leading-5 text-muted-foreground sm:basis-auto">
                {isMine
                    ? 'Proyek milikmu atau dengan keanggotaan tim aktif.'
                    : 'Pahami kebutuhan peran sebelum mengajukan bergabung.'}
            </p>
        </nav>
    );
}
