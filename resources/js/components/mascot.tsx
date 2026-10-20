import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export type MascotPose =
    | 'welcome'
    | 'guide'
    | 'peek'
    | 'celebrate'
    | 'login-return'
    | 'register-start'
    | 'affiliation-check'
    | 'waiting-review'
    | 'project-plan'
    | 'contribution-notes'
    | 'portfolio-showcase'
    | 'ranking-context'
    | 'account-care'
    | 'confirm-access';

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
    'login-return': '/images/mascot-login-return.webp',
    'register-start': '/images/mascot-register-start.webp',
    'affiliation-check': '/images/mascot-affiliation-check.webp',
    'waiting-review': '/images/mascot-waiting-lap.webp',
    'project-plan': '/images/mascot-project-plan.webp',
    'contribution-notes': '/images/mascot-contribution-notes.webp',
    'portfolio-showcase': '/images/mascot-portfolio-showcase.webp',
    'ranking-context': '/images/mascot-ranking-context.webp',
    'account-care': '/images/mascot-account-care.webp',
    'confirm-access': '/images/mascot-confirm-access.webp',
};

const responsiveMascotSources: Partial<Record<MascotPose, string>> = {
    'login-return':
        '/images/mascot-login-return-256.webp 256w, /images/mascot-login-return-512.webp 512w, /images/mascot-login-return.webp 1024w',
    'register-start':
        '/images/mascot-register-start-256.webp 256w, /images/mascot-register-start-512.webp 512w, /images/mascot-register-start.webp 1024w',
    'affiliation-check':
        '/images/mascot-affiliation-check-256.webp 256w, /images/mascot-affiliation-check-512.webp 512w, /images/mascot-affiliation-check.webp 1024w',
    'waiting-review':
        '/images/mascot-waiting-lap-256.webp 256w, /images/mascot-waiting-lap-512.webp 512w, /images/mascot-waiting-lap.webp 1024w',
    'project-plan':
        '/images/mascot-project-plan-256.webp 256w, /images/mascot-project-plan-512.webp 512w, /images/mascot-project-plan.webp 1024w',
    'contribution-notes':
        '/images/mascot-contribution-notes-256.webp 256w, /images/mascot-contribution-notes-512.webp 512w, /images/mascot-contribution-notes.webp 1024w',
    'portfolio-showcase':
        '/images/mascot-portfolio-showcase-256.webp 256w, /images/mascot-portfolio-showcase-512.webp 512w, /images/mascot-portfolio-showcase.webp 1024w',
    'ranking-context':
        '/images/mascot-ranking-context-256.webp 256w, /images/mascot-ranking-context-512.webp 512w, /images/mascot-ranking-context.webp 1024w',
    'account-care':
        '/images/mascot-account-care-256.webp 256w, /images/mascot-account-care-512.webp 512w, /images/mascot-account-care.webp 1024w',
    'confirm-access':
        '/images/mascot-confirm-access-256.webp 256w, /images/mascot-confirm-access-512.webp 512w, /images/mascot-confirm-access.webp 1024w',
};

const mascotGreetings: Record<MascotPose, string> = {
    welcome: 'Siap mulai satu langkah kecil?',
    guide: 'Ayo, kita lanjut bersama.',
    peek: 'Halo, saya siap menemani.',
    celebrate: 'Satu langkah selesai.',
    'login-return': 'Halo lagi!',
    'register-start': 'Ayo mulai!',
    'affiliation-check': 'Yuk, periksa datamu.',
    'waiting-review': 'Langkah pertamamu sudah tercatat.',
    'project-plan': 'Temukan peranmu, mulai berkarya bersama.',
    'contribution-notes': 'Catat bagianmu, ceritakan hasilnya.',
    'portfolio-showcase': 'Karyamu punya cerita.',
    'ranking-context': 'Pahami kontribusi beserta konteksnya.',
    'account-care': 'Akunmu, tetap dalam kendalimu.',
    'confirm-access': 'Sebentar, konfirmasikan aksesmu dulu.',
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
            srcSet={responsiveMascotSources[pose]}
            sizes={
                pose === 'affiliation-check'
                    ? '(min-width: 1024px) 280px, 80px'
                    : pose === 'waiting-review'
                      ? '(min-width: 768px) 176px, 88px'
                      : pose === 'project-plan' ||
                          pose === 'contribution-notes' ||
                          pose === 'portfolio-showcase' ||
                          pose === 'ranking-context' ||
                          pose === 'account-care'
                        ? '(min-width: 1024px) min(36vw, 384px), (min-width: 640px) min(39vw, 320px), 208px'
                        : responsiveMascotSources[pose]
                          ? '(min-width: 1536px) 34rem, (min-width: 1024px) 26rem, 80px'
                          : undefined
            }
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
