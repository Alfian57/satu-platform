import { Link } from '@inertiajs/react';
import { ArrowDown, ArrowUpRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StudentHeroBackdrop from '@/layouts/_components/student-hero-backdrop';
import StudentHeroMascot from '@/layouts/_components/student-hero-mascot';
import { cn } from '@/lib/utils';
import { index as projectsIndex } from '@/routes/projects';

export function DashboardHero({
    firstName,
    canExploreProjects,
}: {
    firstName: string;
    canExploreProjects: boolean;
}) {
    return (
        <header
            className={cn(
                'student-hero-home relative isolate mb-10 rounded-4xl border border-white px-5 pt-7 pb-52 shadow-md sm:min-h-80 sm:px-8 sm:py-9 lg:px-10 lg:py-10',
                canExploreProjects ? 'sm:mt-4 lg:mt-6' : 'sm:mt-6 lg:mt-12',
            )}
            data-test="dashboard-hero"
        >
            <StudentHeroBackdrop theme="home" />
            <div className="relative z-10 sm:max-w-[55%] lg:max-w-[60%]">
                <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white bg-white/80 px-3 py-1.5 text-xs font-semibold text-primary">
                    <Sparkles aria-hidden="true" className="size-3.5" />
                    Ruang kolaborasimu
                </p>
                <h1 className="text-3xl leading-tight font-bold tracking-tight text-foreground sm:text-4xl lg:text-4xl">
                    Halo,{' '}
                    <span className="wrap-anywhere text-primary">
                        {firstName}!
                    </span>
                </h1>
                <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
                    Temukan peluang, lanjutkan pekerjaan tim, dan bangun
                    portofolio dari kontribusi yang terverifikasi.
                </p>
                <div className="mt-6 flex flex-wrap gap-2.5">
                    <Button
                        asChild
                        className="group min-h-11 w-full rounded-xl px-5 shadow-sm hover:shadow-md motion-safe:transition-[background-color,box-shadow,transform] motion-safe:duration-standard motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 sm:w-auto"
                    >
                        <a href="#dashboard-next-action">
                            Lihat langkah utama
                            <ArrowDown
                                aria-hidden="true"
                                className="size-4 motion-safe:transition-transform motion-safe:duration-standard motion-safe:group-hover:translate-y-0.5"
                            />
                        </a>
                    </Button>
                    {canExploreProjects && (
                        <Button
                            asChild
                            variant="ghost"
                            className="min-h-11 w-full rounded-xl bg-white/65 px-4 text-primary hover:bg-white sm:w-auto"
                        >
                            <Link
                                href={projectsIndex()}
                                data-test="dashboard-explore-projects"
                            >
                                Jelajahi proyek
                                <ArrowUpRight
                                    aria-hidden="true"
                                    className="size-4"
                                />
                            </Link>
                        </Button>
                    )}
                </div>
            </div>
            <StudentHeroMascot pose="welcome" interactive />
        </header>
    );
}
