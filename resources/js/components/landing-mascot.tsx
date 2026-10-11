import {
    ArrowRight,
    BookOpen,
    Check,
    FolderOpen,
    MessageCircle,
    Sparkles,
    UsersRound,
    X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import type { PointerEvent, ReactNode } from 'react';
import { DashboardArchiveArt } from '@/components/dashboard-archive-art';
import Mascot from '@/components/mascot';

const topics = [
    {
        key: 'project',
        icon: FolderOpen,
        title: 'Temukan proyek',
        caption: 'Kenali peluang dan peran',
        message:
            'Yuk, cari proyek yang sesuai. Kenali kebutuhan peran dan keahliannya sebelum mengajukan diri.',
        href: '#fitur',
        action: 'Jelajahi fitur',
    },
    {
        key: 'team',
        icon: UsersRound,
        title: 'Berkarya bersama',
        caption: 'Mulai dari kerja tim',
        message:
            'Yuk, berkarya bersama tim. Catat pekerjaanmu sebagai kontribusi dengan pemilik yang jelas.',
        href: '#cara-kerja',
        action: 'Pahami alurnya',
    },
    {
        key: 'portfolio',
        icon: BookOpen,
        title: 'Susun portofolio',
        caption: 'Ceritakan kontribusimu',
        message:
            'Setelah kontribusimu disetujui kampus, kamu dapat menyusunnya menjadi karya. Jangkauannya kamu pilih.',
        href: '#demo',
        action: 'Jelajahi demo',
    },
] as const;

type Topic = (typeof topics)[number];
type TopicKey = Topic['key'] | 'welcome';

function TopicCard({
    topic,
    selected,
    onSelect,
}: {
    topic: Topic;
    selected: boolean;
    onSelect: (trigger: HTMLButtonElement) => void;
}) {
    const Icon = topic.icon;

    return (
        <button
            type="button"
            className={`landing-bird-note landing-bird-note--${topic.key}`}
            data-testid={`landing-mascot-topic-${topic.key}`}
            data-selected={selected || undefined}
            aria-label={`Kenali fitur: ${topic.title}`}
            aria-pressed={selected}
            aria-expanded={selected}
            aria-controls="landing-mascot-greeting"
            onClick={(event) => onSelect(event.currentTarget)}
        >
            <span className="landing-bird-note-icon" aria-hidden="true">
                <Icon className="size-5" />
            </span>
            <span className="landing-bird-note-copy">
                <span className="landing-bird-note-title">{topic.title}</span>
                <span className="landing-bird-note-caption">
                    {topic.caption}
                </span>
                <span className="landing-bird-note-action">
                    {selected ? (
                        <>
                            <Check aria-hidden="true" className="size-3" />
                            Dipilih
                        </>
                    ) : (
                        <>
                            Kenali fitur
                            <ArrowRight aria-hidden="true" className="size-3" />
                        </>
                    )}
                </span>
            </span>
        </button>
    );
}

export default function LandingMascot({ children }: { children: ReactNode }) {
    const [activeTopic, setActiveTopic] = useState<TopicKey | null>(null);
    const sceneRef = useRef<HTMLDivElement>(null);
    const lastTriggerRef = useRef<HTMLButtonElement>(null);
    const isGreeting = activeTopic !== null;
    const activeContent = topics.find((topic) => topic.key === activeTopic) ?? {
        title: 'Halo, teman SATU!',
        message:
            'Mau kenalan dengan SATU? Kita mulai dari cara kerja, lalu coba demonya.',
        href: '#cara-kerja',
        action: 'Lihat cara kerja',
    };

    function resetTilt() {
        sceneRef.current?.style.removeProperty('--mascot-x');
        sceneRef.current?.style.removeProperty('--mascot-tilt');
    }

    function followPointer(event: PointerEvent<HTMLDivElement>) {
        if (
            event.pointerType !== 'mouse' ||
            !window.matchMedia(
                '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)',
            ).matches
        ) {
            return;
        }

        const bounds = event.currentTarget.getBoundingClientRect();
        const position = Math.max(
            -1,
            Math.min(
                1,
                ((event.clientX - bounds.left) / bounds.width - 0.5) * 2,
            ),
        );
        sceneRef.current?.style.setProperty('--mascot-x', `${position * 4}px`);
        sceneRef.current?.style.setProperty(
            '--mascot-tilt',
            `${position * 2}deg`,
        );
    }

    function selectTopic(key: TopicKey, trigger: HTMLButtonElement) {
        lastTriggerRef.current = trigger;
        setActiveTopic((current) => (current === key ? null : key));
    }

    function closeGreeting() {
        setActiveTopic(null);
        resetTilt();
        lastTriggerRef.current?.focus();
    }

    function renderTopic(topic: Topic) {
        return (
            <TopicCard
                key={topic.key}
                topic={topic}
                selected={activeTopic === topic.key}
                onSelect={(trigger) => selectTopic(topic.key, trigger)}
            />
        );
    }

    return (
        <div
            className="landing-bird landing-hero-content"
            data-greeting={isGreeting || undefined}
            onKeyDown={(event) => {
                if (event.key === 'Escape' && isGreeting) {
                    event.preventDefault();
                    event.stopPropagation();
                    closeGreeting();
                }
            }}
        >
            <div className="landing-hero-copy">{children}</div>
            <div
                className="landing-hero-illustration relative min-w-0"
                data-testid="landing-hero-illustration"
            >
                <div
                    className="landing-bird-stage relative mx-auto w-full"
                    data-testid="landing-mascot"
                >
                    <div
                        ref={sceneRef}
                        className="landing-bird-scene"
                        onPointerMove={followPointer}
                        onPointerLeave={resetTilt}
                        onBlur={resetTilt}
                    >
                        <div
                            className="landing-bird-atmosphere"
                            aria-hidden="true"
                        >
                            <span className="landing-bird-halo" />
                            <span className="landing-bird-orbit landing-bird-orbit--outer" />
                            <span className="landing-bird-orbit landing-bird-orbit--inner" />
                            <DashboardArchiveArt className="landing-bird-archive" />
                            <Sparkles className="landing-bird-spark landing-bird-spark--first" />
                            <span className="landing-bird-spark landing-bird-spark--second" />
                        </div>
                        {topics.slice(0, 2).map(renderTopic)}
                        <button
                            type="button"
                            className="landing-bird-trigger"
                            aria-label="Sapa maskot SATU"
                            aria-expanded={isGreeting}
                            aria-controls="landing-mascot-greeting"
                            onClick={(event) =>
                                selectTopic('welcome', event.currentTarget)
                            }
                        >
                            <div className="landing-bird-tilt">
                                <Mascot pose="welcome" priority />
                            </div>
                            <span className="landing-bird-say">
                                <MessageCircle
                                    aria-hidden="true"
                                    className="size-4"
                                />
                                {activeTopic === 'welcome'
                                    ? 'Sapaan terbuka'
                                    : 'Sapa aku'}
                            </span>
                        </button>
                        {renderTopic(topics[2])}
                        <div
                            className="landing-bird-greeting"
                            id="landing-mascot-greeting"
                            hidden={!isGreeting}
                            role="region"
                            aria-labelledby="landing-mascot-message-heading"
                        >
                            {isGreeting ? (
                                <div
                                    key={activeTopic}
                                    className="landing-bird-greeting-card landing-panel-enter"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div>
                                            <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[#1454C4]">
                                                <MessageCircle
                                                    aria-hidden="true"
                                                    className="size-3.5"
                                                />
                                                Pesan dari maskot
                                            </p>
                                            <h2
                                                id="landing-mascot-message-heading"
                                                className="text-sm font-bold text-[#17345A]"
                                            >
                                                {activeContent.title}
                                            </h2>
                                        </div>
                                        <button
                                            type="button"
                                            aria-label="Tutup sapaan maskot"
                                            className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-[#526B85] hover:bg-[#E7F2FF]"
                                            onClick={closeGreeting}
                                        >
                                            <X
                                                aria-hidden="true"
                                                className="size-4"
                                            />
                                        </button>
                                    </div>
                                    <p className="mt-2 text-sm leading-6 text-[#526B85]">
                                        {activeContent.message}
                                    </p>
                                    <a
                                        href={activeContent.href}
                                        className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-bold text-[#1764E8]"
                                    >
                                        {activeContent.action}
                                        <ArrowRight
                                            aria-hidden="true"
                                            className="size-4"
                                        />
                                    </a>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
            <p
                className="sr-only"
                role="status"
                aria-live="polite"
                aria-atomic="true"
            >
                {isGreeting ? activeContent.message : ''}
            </p>
        </div>
    );
}
