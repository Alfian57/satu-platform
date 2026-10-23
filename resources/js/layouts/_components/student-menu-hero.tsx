import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import type { MascotPose } from '@/components/mascot';
import StudentHeroBackdrop from '@/layouts/_components/student-hero-backdrop';
import type { StudentHeroTheme } from '@/layouts/_components/student-hero-backdrop';
import StudentHeroMascot from '@/layouts/_components/student-hero-mascot';
import { cn } from '@/lib/utils';

type StudentMenuHeroProps = {
    icon: LucideIcon;
    eyebrow: string;
    title: string;
    description: string;
    pose: MascotPose;
    theme: Exclude<StudentHeroTheme, 'home'>;
    testId: string;
    children: ReactNode;
    note?: ReactNode;
};

export default function StudentMenuHero({
    icon: Icon,
    eyebrow,
    title,
    description,
    pose,
    theme,
    testId,
    children,
    note,
}: StudentMenuHeroProps) {
    return (
        <header className="student-menu-hero" data-test={testId}>
            <StudentHeroBackdrop theme={theme} />
            <div className="student-menu-hero__copy">
                <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-primary">
                    <Icon
                        aria-hidden="true"
                        className="size-4 shrink-0 text-satu-orange-ink"
                    />
                    {eyebrow}
                </p>
                <h1 className="mt-3 text-2xl leading-tight font-bold tracking-tight text-foreground sm:text-3xl 2xl:text-[2.125rem]">
                    {title}
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                    {description}
                </p>
                <div
                    className={cn(
                        'student-menu-hero__actions flex min-w-0 flex-wrap items-center gap-x-5 gap-y-3',
                        theme === 'settings' ? 'mt-5' : 'mt-9 sm:mt-12',
                    )}
                >
                    {children}
                </div>
                {note && (
                    <div className="mt-4 text-xs leading-5 text-muted-foreground">
                        {note}
                    </div>
                )}
            </div>
            <StudentHeroMascot
                pose={pose}
                className="student-menu-hero__scene"
            />
        </header>
    );
}
