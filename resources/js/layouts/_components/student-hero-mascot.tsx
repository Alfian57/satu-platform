import Mascot from '@/components/mascot';
import type { MascotPose } from '@/components/mascot';
import { cn } from '@/lib/utils';

type StudentHeroMascotProps = {
    pose: MascotPose;
    interactive?: boolean;
    className?: string;
};

export default function StudentHeroMascot({
    pose,
    interactive = false,
    className,
}: StudentHeroMascotProps) {
    return (
        <div
            className={cn('student-hero-mascot', className)}
            aria-hidden={interactive ? undefined : true}
        >
            <Mascot
                pose={pose}
                interactive={interactive}
                priority
                className="w-full"
            />
        </div>
    );
}
