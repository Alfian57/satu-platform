import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    Check,
    ClipboardCheck,
    Clock3,
    FileText,
    Info,
    LockKeyhole,
    RotateCcw,
    Route,
    Send,
    UserRound,
    UsersRound,
} from 'lucide-react';
import { useRef, useState } from 'react';
import {
    getJourneyStage,
    JOURNEY_SCENARIOS,
    JOURNEY_STAGES,
} from '@/lib/landing-journey';
import type { JourneyScenario, JourneyStage } from '@/lib/landing-journey';
import { cn } from '@/lib/utils';

const stageVisuals = [
    {
        title: 'Bekal pertama Budi',
        eyebrow: 'Profil kemampuan',
        icon: UserRound,
    },
    { title: 'Ruang Baca Kampus', eyebrow: 'Peluang proyek', icon: BookOpen },
    { title: 'Minat bergabung Budi', eyebrow: 'Pengajuan peran', icon: Clock3 },
    {
        title: 'Satu tim, peran berbeda',
        eyebrow: 'Keputusan tim',
        icon: UsersRound,
    },
    { title: 'Rancangan alur peminjaman', eyebrow: 'Ruang kerja', icon: Check },
    {
        title: 'Bagian yang Budi kerjakan',
        eyebrow: 'Kontribusi individual',
        icon: Send,
    },
    {
        title: 'Keputusan atas kontribusi',
        eyebrow: 'Tinjauan kampus',
        icon: ClipboardCheck,
    },
    { title: 'Karya pertama Budi', eyebrow: 'Portofolio', icon: LockKeyhole },
];

const scenarioDescriptions: Record<JourneyScenario, string> = {
    main: 'Mulai dari bekal pertama',
    full: 'Ketika peran tidak tersedia',
    revision: 'Ketika bukti perlu dilengkapi',
};

function BorrowingSketch() {
    return (
        <div className="journey-sketch" aria-hidden="true">
            <div className="journey-sketch-page">
                <span className="journey-sketch-caption">RUANG BACA</span>
                <div className="journey-book-spines">
                    <span />
                    <span />
                    <span />
                </div>
                <span className="journey-sketch-line" />
                <span className="journey-sketch-line journey-sketch-line--short" />
            </div>
            <div className="journey-sketch-flow">
                <span>
                    01 <strong>Pilih buku</strong>
                </span>
                <ArrowRight className="size-4" />
                <span>
                    02 <strong>Ajukan pinjam</strong>
                </span>
                <ArrowRight className="size-4" />
                <span>
                    03 <strong>Ambil buku</strong>
                </span>
            </div>
        </div>
    );
}

function StagePreview({
    index,
    stage,
    needsAttention,
}: {
    index: number;
    stage: JourneyStage;
    needsAttention: boolean;
}) {
    const visual = stageVisuals[index];
    const StatusIcon = needsAttention ? Info : visual.icon;

    return (
        <article className="journey-preview" data-stage={stage.id}>
            <div className="journey-preview-label">
                <span className="journey-preview-kind">
                    <visual.icon aria-hidden="true" className="size-4" />
                    {visual.eyebrow}
                </span>
                <span>Pratinjau</span>
            </div>
            {index === 0 && (
                <div className="journey-profile">
                    <span className="journey-avatar" aria-hidden="true">
                        B
                    </span>
                    <div>
                        <p className="journey-profile-name">Budi</p>
                        <p>Ingin belajar desain antarmuka</p>
                        <span className="journey-profile-tag">
                            Terbuka untuk belajar
                        </span>
                    </div>
                </div>
            )}
            {index === 1 && (
                <div className="journey-project-cover" aria-hidden="true">
                    <div className="journey-book-spines">
                        <span />
                        <span />
                        <span />
                    </div>
                    <span>
                        Ruang untuk membaca.
                        <br />
                        Ruang untuk berkarya.
                    </span>
                </div>
            )}
            {index === 2 && (
                <div className="journey-application">
                    <span
                        className="journey-avatar journey-avatar--small"
                        aria-hidden="true"
                    >
                        B
                    </span>
                    <p>
                        <strong>Budi</strong>
                        <span>mengajukan peran desainer antarmuka</span>
                    </p>
                    <ArrowRight
                        aria-hidden="true"
                        className="journey-application-arrow size-5"
                    />
                    <span
                        className="journey-avatar journey-avatar--small journey-avatar--ink"
                        aria-hidden="true"
                    >
                        S
                    </span>
                </div>
            )}
            {index === 3 && (
                <div className="journey-team">
                    <div>
                        <span
                            className="journey-avatar journey-avatar--small"
                            aria-hidden="true"
                        >
                            B
                        </span>
                        <strong>Budi</strong>
                        <span>
                            {needsAttention
                                ? 'Belum bergabung'
                                : 'Desainer antarmuka'}
                        </span>
                    </div>
                    <span className="journey-team-connector" aria-hidden="true">
                        {needsAttention ? (
                            <LockKeyhole className="size-4" />
                        ) : (
                            <UsersRound className="size-4" />
                        )}
                    </span>
                    <div>
                        <span
                            className="journey-avatar journey-avatar--small journey-avatar--ink"
                            aria-hidden="true"
                        >
                            S
                        </span>
                        <strong>Siti</strong>
                        <span>Pengembang aplikasi</span>
                    </div>
                </div>
            )}
            {(index === 4 || index === 7) && (
                <div
                    className={cn(
                        'journey-work-sample',
                        index === 7 && 'journey-work-sample--portfolio',
                    )}
                >
                    <BorrowingSketch />
                    {index === 7 && (
                        <span className="journey-private-label">
                            <LockKeyhole
                                aria-hidden="true"
                                className="size-3.5"
                            />
                            Karya privat
                        </span>
                    )}
                </div>
            )}
            {index === 5 && (
                <div className="journey-evidence">
                    <FileText className="size-8 shrink-0" aria-hidden="true" />
                    <div>
                        <strong>Rancangan alur peminjaman</strong>
                        <span>Bukti contoh milik Budi</span>
                    </div>
                    <LockKeyhole
                        className="size-4 shrink-0"
                        aria-hidden="true"
                    />
                </div>
            )}
            {index === 6 && (
                <div
                    className={cn(
                        'journey-review',
                        needsAttention && 'journey-review--revision',
                    )}
                >
                    <StatusIcon
                        className="size-7 shrink-0"
                        aria-hidden="true"
                    />
                    <div>
                        <strong>
                            {needsAttention
                                ? 'Lengkapi, lalu ajukan kembali.'
                                : 'Pekerjaan Budi mendapat pengakuan.'}
                        </strong>
                        <span>Keputusan peninjau pada contoh ini</span>
                    </div>
                </div>
            )}
            <div className="journey-preview-content">
                <h5>
                    {needsAttention && index === 3
                        ? 'Kapasitas peran sudah penuh'
                        : visual.title}
                </h5>
                <p
                    data-testid="journey-status"
                    className={cn(
                        'journey-status',
                        needsAttention && 'journey-status--attention',
                    )}
                >
                    <StatusIcon
                        aria-hidden="true"
                        className="size-4 shrink-0"
                    />
                    {stage.status}
                </p>
                <dl className="journey-facts">
                    {stage.facts.map(([label, value]) => (
                        <div key={label}>
                            <dt>{label}</dt>
                            <dd>{value}</dd>
                        </div>
                    ))}
                </dl>
            </div>
            <p className="journey-preview-footer">
                <FileText aria-hidden="true" className="size-3.5 shrink-0" />
                Contoh tampilan, bukan data akunmu.
            </p>
        </article>
    );
}

export default function LandingJourneyDemo() {
    const [index, setIndex] = useState(0);
    const [scenario, setScenario] = useState<JourneyScenario>('main');
    const heading = useRef<HTMLHeadingElement>(null);
    const stage = getJourneyStage(index, scenario);
    const lastIndex = scenario === 'full' ? 3 : JOURNEY_STAGES.length - 1;
    const needsAttention =
        (scenario === 'full' && index === 3) ||
        (scenario === 'revision' && index === 6);

    function selectStep(next: number, nextScenario = scenario) {
        setScenario(nextScenario);
        setIndex(next);
        requestAnimationFrame(() => heading.current?.focus());
    }

    return (
        <section
            aria-labelledby="journey-demo-heading"
            data-testid="journey-demo"
            className="landing-journey"
        >
            <header className="landing-journey-bar">
                <div className="journey-identity">
                    <span className="journey-identity-mark" aria-hidden="true">
                        <BookOpen className="size-6" />
                    </span>
                    <div className="min-w-0">
                        <h3 id="journey-demo-heading">
                            Perjalanan pertama Budi
                        </h3>
                        <p>Bekal sederhana. Kesempatan untuk mulai.</p>
                    </div>
                </div>
                <div className="journey-bar-actions">
                    <span className="journey-synthetic">
                        <span aria-hidden="true" />
                        Data synthetic
                    </span>
                    <button
                        type="button"
                        className="journey-reset"
                        onClick={() => selectStep(0, 'main')}
                    >
                        <RotateCcw aria-hidden="true" className="size-4" />
                        Reset perjalanan
                    </button>
                </div>
            </header>
            <div className="journey-workbench">
                <nav
                    aria-label="Tahap demo perjalanan"
                    className="landing-journey-steps"
                >
                    {JOURNEY_STAGES.map((item, stepIndex) => (
                        <button
                            key={item.id}
                            type="button"
                            aria-label={`${stepIndex + 1}. ${item.label}`}
                            aria-current={
                                index === stepIndex ? 'step' : undefined
                            }
                            disabled={stepIndex > lastIndex}
                            className="landing-journey-step"
                            onClick={() => selectStep(stepIndex)}
                        >
                            <span
                                aria-hidden="true"
                                className="journey-step-number font-label"
                            >
                                {String(stepIndex + 1).padStart(2, '0')}
                            </span>
                            <span className="journey-step-label">
                                {item.label}
                            </span>
                        </button>
                    ))}
                </nav>
                <div className="landing-journey-scene">
                    <div className="journey-story">
                        <p className="journey-chapter">
                            <Route aria-hidden="true" className="size-4" />
                            LANGKAH {String(index + 1).padStart(2, '0')}{' '}
                            <span>/ {JOURNEY_STAGES.length}</span>
                        </p>
                        <h4
                            ref={heading}
                            tabIndex={-1}
                            data-testid="journey-step-heading"
                        >
                            {stage.title}
                        </h4>
                        <p className="journey-description">
                            {stage.description}
                        </p>
                        <div className="journey-actor">
                            <span className="journey-actor-icon">
                                <UserRound
                                    aria-hidden="true"
                                    className="size-4 shrink-0"
                                />
                            </span>
                            <div>
                                <span>Yang berperan</span>
                                <p>{stage.actor}</p>
                            </div>
                        </div>
                        <details
                            key={`boundary-${index}-${scenario}`}
                            className="landing-disclosure journey-boundary"
                        >
                            <summary>Yang perlu dipahami</summary>
                            <p>{stage.boundary}</p>
                        </details>
                    </div>
                    <div
                        key={`${index}-${scenario}`}
                        className="journey-preview-stage"
                    >
                        <div className="journey-preview-caption">
                            <span>LEMBAR PERJALANAN</span>
                            <span className="font-label">
                                {String(index + 1).padStart(2, '0')} / 08
                            </span>
                        </div>
                        <div className="journey-preview-sheet">
                            <StagePreview
                                index={index}
                                stage={stage}
                                needsAttention={needsAttention}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div className="landing-journey-actions">
                <div className="journey-next-hint">
                    <p>
                        {index < lastIndex
                            ? 'Setelah ini'
                            : needsAttention
                              ? 'Coba skenario lain'
                              : 'Perjalanan contoh selesai'}
                    </p>
                    <span>{stage.next}</span>
                </div>
                <div className="journey-pagination">
                    <button
                        type="button"
                        className="landing-control"
                        disabled={index === 0}
                        onClick={() => selectStep(index - 1)}
                    >
                        <ArrowLeft aria-hidden="true" className="size-4" />
                        Sebelumnya
                    </button>
                    <button
                        type="button"
                        className="landing-primary"
                        disabled={index >= lastIndex}
                        onClick={() => selectStep(index + 1)}
                    >
                        Berikutnya
                        <ArrowRight aria-hidden="true" className="size-4" />
                    </button>
                </div>
            </div>
            <div className="journey-bottom">
                <fieldset className="landing-journey-scenarios">
                    <legend>Coba kemungkinan lain</legend>
                    <div>
                        {JOURNEY_SCENARIOS.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                aria-label={item.label}
                                aria-describedby={`journey-scenario-${item.id}`}
                                aria-pressed={scenario === item.id}
                                className="journey-scenario"
                                onClick={() =>
                                    selectStep(
                                        item.id === 'full'
                                            ? 3
                                            : item.id === 'revision'
                                              ? 6
                                              : 0,
                                        item.id,
                                    )
                                }
                            >
                                <span
                                    aria-hidden="true"
                                    className="journey-scenario-mark"
                                >
                                    {scenario === item.id && (
                                        <Check className="size-3" />
                                    )}
                                </span>
                                <span className="journey-scenario-copy">
                                    <strong>{item.label}</strong>
                                    <span id={`journey-scenario-${item.id}`}>
                                        {scenarioDescriptions[item.id]}
                                    </span>
                                </span>
                            </button>
                        ))}
                    </div>
                </fieldset>
                <p className="landing-journey-footnote">
                    Simulasi lokal, bukan progres akun. Tidak mengirim pengajuan
                    atau menyimpan perubahan. Tidak membuktikan manfaat pilot.
                </p>
            </div>
        </section>
    );
}
