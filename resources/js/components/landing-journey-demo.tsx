import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    Check,
    RotateCcw,
    Route,
    UserRound,
} from 'lucide-react';
import { useRef, useState } from 'react';
import StagePreview from '@/components/landing/stage-preview';
import {
    getJourneyStage,
    JOURNEY_SCENARIOS,
    JOURNEY_STAGES,
} from '@/lib/landing-journey';
import type { JourneyScenario } from '@/lib/landing-journey';

const scenarioDescriptions: Record<JourneyScenario, string> = {
    main: 'Mulai dari bekal pertama',
    full: 'Ketika peran tidak tersedia',
    revision: 'Ketika bukti perlu dilengkapi',
};

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
                        className="journey-reset cursor-pointer"
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
                            className="landing-journey-step cursor-pointer disabled:cursor-not-allowed"
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
                        className="landing-control cursor-pointer disabled:cursor-not-allowed"
                        disabled={index === 0}
                        onClick={() => selectStep(index - 1)}
                    >
                        <ArrowLeft aria-hidden="true" className="size-4" />
                        Sebelumnya
                    </button>
                    <button
                        type="button"
                        className="landing-primary cursor-pointer disabled:cursor-not-allowed"
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
                                className="journey-scenario cursor-pointer"
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
