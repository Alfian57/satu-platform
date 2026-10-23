import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import type { MascotPose } from '@/components/mascot';
import StudentHeroBackdrop from '@/layouts/_components/student-hero-backdrop';
import type { StudentHeroTheme } from '@/layouts/_components/student-hero-backdrop';
import StudentHeroMascot from '@/layouts/_components/student-hero-mascot';

type StudentMenuHeroProps = {
    icon: LucideIcon;
    eyebrow: string;
    title: string;
    description: string;
    pose: MascotPose;
    theme: Exclude<StudentHeroTheme, 'home'>;
    testId: string;
    children?: ReactNode;
    note?: ReactNode;
    size?: 'default' | 'lg';
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
                <p className="flex items-center gap-2.5 text-sm font-semibold tracking-wide text-primary sm:text-base">
                    <Icon
                        aria-hidden="true"
                        className="size-5 shrink-0 text-satu-orange-ink sm:size-6"
                    />
                    {eyebrow}
                </p>
                <h1 className="mt-3 text-3xl leading-tight font-extrabold tracking-tight text-foreground sm:mt-4 sm:text-4xl lg:text-[2.65rem] 2xl:text-5xl">
                    {title}
                </h1>
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground sm:mt-4 sm:text-lg">
                    {description}
                </p>
                {children && (
                    <div className="student-menu-hero__actions mt-5 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-3 sm:mt-6">
                        {children}
                    </div>
                )}
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
