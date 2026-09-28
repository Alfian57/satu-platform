import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export type MascotPose = 'welcome' | 'guide' | 'peek' | 'celebrate';

type MascotProps = {
    pose: MascotPose;
    interactive?: boolean;
    priority?: boolean;
    className?: string;
};

const mascotImages: Record<MascotPose, string> = {
    welcome: '/images/mascot-welcome.webp',
    guide: '/images/mascot-guide.webp',
    peek: '/images/mascot-peek.webp',
    celebrate: '/images/mascot-welcome.webp',
};

const mascotGreetings: Record<MascotPose, string> = {
    welcome: 'Siap mulai satu langkah kecil?',
    guide: 'Ayo, kita lanjut bersama.',
    peek: 'Halo, saya siap menemani.',
    celebrate: 'Satu langkah selesai.',
};

export default function Mascot({
    pose,
    interactive = false,
    priority = false,
    className,
}: MascotProps) {
    const [isGreeting, setIsGreeting] = useState(false);

    useEffect(() => {
        if (!isGreeting) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setIsGreeting(false);
        }, 1500);

        return () => window.clearTimeout(timeoutId);
    }, [isGreeting]);

    const image = (
        <img
            src={mascotImages[pose]}
            alt=""
            aria-hidden="true"
            width={1024}
            height={1024}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding="async"
            className="satu-mascot__image"
        />
    );

    return (
        <div
            className={cn('satu-mascot', className)}
            data-pose={pose}
            data-interactive={interactive || undefined}
            data-greeting={isGreeting || undefined}
        >
            {interactive ? (
                <button
                    type="button"
                    className="satu-mascot__trigger"
                    aria-label="Sapa maskot SATU"
                    aria-pressed={isGreeting}
                    onClick={() => setIsGreeting((current) => !current)}
                >
                    {image}
                    <span
                        className="satu-mascot__greeting"
                        role="status"
                        aria-live="polite"
                        aria-atomic="true"
                    >
                        {isGreeting ? mascotGreetings[pose] : ''}
                    </span>
                </button>
            ) : (
                image
            )}
        </div>
    );
}
