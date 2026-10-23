import { Link } from '@inertiajs/react';
import { BriefcaseBusiness, Compass, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DiscoveryFilters } from '@/pages/projects/index/_components/catalog-utils';
import { create as projectsCreate } from '@/routes/projects';

export function ProjectViewNav({
    isMine,
    isPending,
    institutionId,
    onChangeView,
}: {
    isMine: boolean;
    isPending: boolean;
    institutionId?: number;
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
            {institutionId && (
                <div className="ml-auto flex items-center">
                    <Button
                        asChild
                        className="student-menu-hero__primary min-h-11 rounded-xl px-4"
                        data-test="create-project-link"
                    >
                        <Link
                            href={projectsCreate({
                                query: { institution_id: institutionId },
                            })}
                        >
                            <Plus aria-hidden="true" className="size-4" />
                            Buat proyek
                        </Link>
                    </Button>
                </div>
            )}
        </nav>
    );
}
