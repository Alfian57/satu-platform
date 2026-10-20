import { useEffect, useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export default function LandingReveal({
    children,
    className,
    delay = 0,
}: {
    children: ReactNode;
    className?: string;
    delay?: number;
}) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = ref.current;

        if (
            !element ||
            !('IntersectionObserver' in window) ||
            window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    element.dataset.revealed = 'true';
                    observer.disconnect();
                }
            },
            { threshold: 0.12 },
        );
        observer.observe(element);

        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            className={cn('landing-reveal', className)}
            style={
                {
                    '--landing-reveal-delay': `${Math.min(160, Math.max(0, delay))}ms`,
                } as CSSProperties
            }
        >
            {children}
        </div>
    );
}
