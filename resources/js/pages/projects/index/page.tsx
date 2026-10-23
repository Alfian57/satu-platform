import { Head, Link } from '@inertiajs/react';
import { BriefcaseBusiness, GraduationCap, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppPage } from '@/layouts/_components/app-page';
import StudentMenuHero from '@/layouts/_components/student-menu-hero';
import type { ProjectIndexProps } from '@/pages/projects/index/_components/catalog-utils';
import { ProjectCatalogFilters } from '@/pages/projects/index/_components/project-catalog-filters';
import { ProjectResultsLedger } from '@/pages/projects/index/_components/project-results-ledger';
import { ProjectSupportBanner } from '@/pages/projects/index/_components/project-support-banner';
import { ProjectViewNav } from '@/pages/projects/index/_components/project-view-nav';
import { useProjectCatalog } from '@/pages/projects/index/_hooks/use-project-catalog';
import {
    create as projectsCreate,
    index as projectsIndex,
} from '@/routes/projects';

export default function ProjectIndex({
    institution,
    projects,
    filters,
    filter_options: filterOptions,
}: ProjectIndexProps) {
    const {
        isMine,
        searchQuery,
        selectedStatuses,
        selectedVisibilities,
        selectedSort,
        selectedDirection,
        selectedPerPage,
        selectedBeginner,
        selectedAvailability,
        isPending,
        hasError,
        isForbidden,
        resultSummary,
        actions,
    } = useProjectCatalog({ filters, projects });

    return (
        <>
            <Head title={isMine ? 'Proyek saya' : 'Temukan proyek'} />
            <AppPage className="min-w-0">
                <div
                    data-test="projects-root"
                    className="project-discovery w-full min-w-0 space-y-5"
                >
                    <StudentMenuHero
                        theme="projects"
                        icon={BriefcaseBusiness}
                        eyebrow={
                            isMine
                                ? 'Pekerjaan bersama tim'
                                : 'Peluang kolaborasi'
                        }
                        title={
                            isMine
                                ? 'Ide bersama, karya nyata.'
                                : 'Ada tempat untuk kemampuanmu.'
                        }
                        description={
                            isMine
                                ? 'Lanjutkan proyek yang kamu kelola atau kerjakan bersama tim. Draft milikmu juga ada di sini.'
                                : 'Temukan peran yang sesuai, kenali kebutuhan tim, lalu mulai berkarya bersama. Belum punya karya? Kamu tetap bisa memulai.'
                        }
                        pose="project-plan"
                        testId="project-discovery-header"
                    >
                        <Button
                            asChild
                            className="student-menu-hero__primary min-h-11 rounded-xl px-4"
                            data-test="create-project-link"
                        >
                            <Link
                                href={projectsCreate({
                                    query: { institution_id: institution.id },
                                })}
                            >
                                <Plus aria-hidden="true" className="size-4" />
                                Buat proyek
                            </Link>
                        </Button>
                        <p className="flex min-w-0 items-start gap-2 text-xs leading-5 text-muted-foreground">
                            <GraduationCap
                                aria-hidden="true"
                                className="mt-0.5 size-4 shrink-0 text-primary"
                            />
                            <span className="min-w-0 wrap-anywhere">
                                {institution.name}
                            </span>
                        </p>
                    </StudentMenuHero>

                    <ProjectViewNav
                        isMine={isMine}
                        isPending={isPending}
                        onChangeView={actions.changeView}
                    />

                    <ProjectCatalogFilters
                        isMine={isMine}
                        filters={filters}
                        filterOptions={filterOptions}
                        searchQuery={searchQuery}
                        selectedStatuses={selectedStatuses}
                        selectedVisibilities={selectedVisibilities}
                        selectedSort={selectedSort}
                        selectedDirection={selectedDirection}
                        selectedPerPage={selectedPerPage}
                        selectedBeginner={selectedBeginner}
                        selectedAvailability={selectedAvailability}
                        isPending={isPending}
                        actions={actions}
                    />

                    <ProjectResultsLedger
                        institutionName={institution.name}
                        isMine={isMine}
                        resultSummary={resultSummary}
                        hasError={hasError}
                        isForbidden={isForbidden}
                        isPending={isPending}
                        projects={projects}
                        actions={actions}
                    />

                    <ProjectSupportBanner institutionId={institution.id} />
                </div>
            </AppPage>
        </>
    );
}

ProjectIndex.layout = {
    breadcrumbs: [
        {
            title: 'Penemuan proyek',
            href: projectsIndex(),
        },
    ],
};
