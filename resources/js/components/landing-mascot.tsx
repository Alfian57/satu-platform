import { FolderOpen, Search, UsersRound } from 'lucide-react';
import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

const topics = [
    {
        key: 'project',
        icon: Search,
        title: 'Temukan proyek',
        message:
            'Belum punya banyak relasi? Mulai dari kebutuhan peran yang jelas. Cari juga proyek yang menerima pemula.',
    },
    {
        key: 'team',
        icon: UsersRound,
        title: 'Berkarya bersama',
        message:
            'Setelah diterima, kamu punya tugas dan rekan kerja. Bagian yang kamu kerjakan bisa dicatat sebagai kontribusi individual.',
    },
    {
        key: 'portfolio',
        icon: FolderOpen,
        title: 'Susun portofolio',
        message:
            'Setelah kontribusimu disetujui kampus, kamu dapat menyusunnya menjadi karya. Jangkauannya kamu pilih.',
    },
] as const;

export default function LandingMascot({ children }: { children: ReactNode }) {
    const [activeTopic, setActiveTopic] = useState<(typeof topics)[number]>(
        topics[0],
    );
    const [isExplanationOpen, setIsExplanationOpen] = useState(false);
    const lastTriggerRef = useRef<HTMLButtonElement>(null);

    return (
        <div className="landing-hero-content">
            <div className="landing-hero-copy">{children}</div>
            <div
                className="landing-hero-illustration min-w-0"
                data-testid="landing-hero-illustration"
            >
                <div
                    className="landing-bird-stage"
                    data-testid="landing-mascot"
                >
                    <div className="landing-bird-portrait" aria-hidden="true">
                        <div className="landing-bird-figure">
                            <img
                                src="/images/landing-hero-calm.webp"
                                srcSet="/images/landing-hero-calm-768.webp 768w, /images/landing-hero-calm-1280.webp 1280w, /images/landing-hero-calm.webp 1448w"
                                sizes="(min-width: 1920px) 60rem, (min-width: 1024px) 54vw, (min-width: 640px) 36rem, 100vw"
                                alt=""
                                width={1448}
                                height={1086}
                                loading="eager"
                                fetchPriority="high"
                                decoding="async"
                                className="satu-mascot__image"
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div
                className="landing-feature-list"
                role="group"
                aria-label="Kenali fitur SATU"
            >
                {topics.map((topic) => {
                    const Icon = topic.icon;

                    return (
                        <button
                            key={topic.key}
                            type="button"
                            className="landing-feature-link"
                            data-testid={`landing-mascot-topic-${topic.key}`}
                            aria-label={`Kenali fitur: ${topic.title}`}
                            aria-haspopup="dialog"
                            onClick={(event) => {
                                lastTriggerRef.current = event.currentTarget;
                                setActiveTopic(topic);
                                setIsExplanationOpen(true);
                            }}
                        >
                            <Icon
                                aria-hidden="true"
                                className="size-5 shrink-0"
                            />
                            {topic.title}
                        </button>
                    );
                })}
            </div>
            <Dialog
                open={isExplanationOpen}
                onOpenChange={setIsExplanationOpen}
            >
                <DialogContent
                    className="border-[#D9E8F5] bg-white text-[#17345A] sm:max-w-md"
                    style={{ colorScheme: 'light' }}
                    onCloseAutoFocus={(event) => {
                        event.preventDefault();
                        lastTriggerRef.current?.focus({ preventScroll: true });
                    }}
                >
                    <DialogHeader>
                        <p className="mb-2 text-xs font-semibold tracking-wide text-[#526B85]">
                            Kenali alur SATU
                        </p>
                        <DialogTitle className="text-2xl text-[#17345A]">
                            {activeTopic.title}
                        </DialogTitle>
                        <DialogDescription className="pt-2 text-base leading-7 text-[#526B85]">
                            {activeTopic.message}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <button
                                type="button"
                                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#1764E8] px-5 text-sm font-semibold text-white hover:bg-[#1454C4] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1746B0]"
                            >
                                Mengerti
                            </button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
