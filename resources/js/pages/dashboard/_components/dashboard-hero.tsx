import { LayoutDashboard } from 'lucide-react';
import StudentHeroBackdrop from '@/layouts/_components/student-hero-backdrop';
import StudentHeroMascot from '@/layouts/_components/student-hero-mascot';
import { cn } from '@/lib/utils';

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
                'student-hero-home student-menu-hero relative isolate mb-10 rounded-[24px] border border-border sm:min-h-[230px] lg:min-h-[240px]',
                canExploreProjects ? 'sm:mt-7 lg:mt-9' : 'sm:mt-8 lg:mt-12',
            )}
            data-test="dashboard-hero"
        >
            <StudentHeroBackdrop theme="home" />
            <div className="student-menu-hero__copy relative z-10 sm:max-w-[62%] lg:max-w-[64%]">
                <p className="flex items-center gap-2.5 text-sm font-semibold tracking-wide text-primary sm:text-base">
                    <LayoutDashboard
                        aria-hidden="true"
                        className="size-5 shrink-0 text-satu-orange-ink sm:size-6"
                    />
                    Ruang kolaborasimu
                </p>
                <h1 className="mt-3 text-3xl leading-tight font-extrabold tracking-tight text-foreground sm:mt-4 sm:text-4xl lg:text-[2.65rem] 2xl:text-5xl">
                    Halo,{' '}
                    <span className="wrap-anywhere text-primary">
                        {firstName}!
                    </span>
                </h1>
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground sm:mt-4 sm:text-lg">
                    Temukan peluang, lanjutkan pekerjaan tim, dan bangun
                    portofolio dari kontribusi yang terverifikasi.
                </p>
            </div>
            <StudentHeroMascot pose="welcome" interactive />
        </header>
    );
}
