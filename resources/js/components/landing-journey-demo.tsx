import { ArrowLeft, ArrowRight, BookOpen, RotateCcw } from 'lucide-react';
import { useRef, useState } from 'react';
import {
    getJourneyStage,
    JOURNEY_SCENARIOS,
    JOURNEY_STAGES,
} from '@/lib/landing-journey';
import type { JourneyScenario } from '@/lib/landing-journey';
import { cn } from '@/lib/utils';

export default function LandingJourneyDemo() {
    const [index, setIndex] = useState(0);
    const [scenario, setScenario] = useState<JourneyScenario>('main');
    const heading = useRef<HTMLHeadingElement>(null);
    const stage = getJourneyStage(index, scenario);
    const lastIndex = scenario === 'full' ? 3 : JOURNEY_STAGES.length - 1;

    function selectStep(next: number, nextScenario = scenario) {
        setScenario(nextScenario);
        setIndex(next);
        requestAnimationFrame(() => heading.current?.focus());
    }

    return (
        <section
            aria-labelledby="journey-demo-heading"
            data-testid="journey-demo"
            className="rounded-3xl border border-[#BFD7EC] bg-white p-5 shadow-md sm:p-8"
        >
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#E7F2FF] text-[#1764E8]">
                        <BookOpen aria-hidden="true" className="size-6" />
                    </span>
                    <div>
                        <h3
                            id="journey-demo-heading"
                            className="text-xl font-bold sm:text-2xl"
                        >
                            Perjalanan pertama Budi
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-[#526B85]">
                            Tanpa karya terdahulu. Satu kesempatan untuk mulai.
                        </p>
                    </div>
                </div>
                <span className="collaboration-synthetic-label">
                    Data synthetic
                </span>
            </div>
            <p className="mt-5 text-sm leading-6 text-[#526B85]">
                Simulasi lokal, bukan status akun atau pengiriman nyata. Pilih
                tahap atau gunakan Berikutnya.
            </p>
            <fieldset className="mt-5">
                <legend className="mb-2 text-sm font-semibold">
                    Skenario contoh
                </legend>
                <div className="flex flex-wrap gap-2">
                    {JOURNEY_SCENARIOS.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            aria-pressed={scenario === item.id}
                            className={cn(
                                'landing-control',
                                scenario === item.id &&
                                    'border-[#1764E8] bg-[#E7F2FF] text-[#1454C4]',
                            )}
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
                            {item.label}
                        </button>
                    ))}
                </div>
            </fieldset>
            <nav
                aria-label="Tahap demo perjalanan"
                className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4"
            >
                {JOURNEY_STAGES.map((item, stepIndex) => (
                    <button
                        key={item.id}
                        type="button"
                        aria-current={index === stepIndex ? 'step' : undefined}
                        disabled={stepIndex > lastIndex}
                        className={cn(
                            'min-h-11 cursor-pointer rounded-xl border px-3 py-2 text-left text-sm font-semibold transition-colors duration-220 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none',
                            index === stepIndex
                                ? 'border-[#1764E8] bg-[#1764E8] text-white'
                                : 'border-[#D9E8F5] bg-white text-[#526B85]',
                        )}
                        onClick={() => selectStep(stepIndex)}
                    >
                        {stepIndex + 1}. {item.label}
                    </button>
                ))}
            </nav>
            <div className="mt-6 grid gap-6 rounded-3xl border border-[#D9E8F5] bg-[#F3F9FF] p-5 sm:p-7 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#1454C4]">
                        {stage.actor}
                    </p>
                    <h4
                        ref={heading}
                        tabIndex={-1}
                        data-testid="journey-step-heading"
                        className="mt-3 scroll-mt-28 rounded-lg text-2xl leading-tight font-bold tracking-tight outline-offset-4 focus:outline-2 focus:outline-[#1746B0] sm:text-3xl"
                    >
                        {stage.title}
                    </h4>
                    <p
                        className="mt-4 inline-flex rounded-full border border-[#BFD7EC] bg-white px-3 py-1.5 text-sm font-semibold"
                        data-testid="journey-status"
                    >
                        {stage.status}
                    </p>
                    <p className="mt-4 text-base leading-7 text-[#526B85]">
                        {stage.description}
                    </p>
                    <dl className="mt-5 divide-y divide-[#D9E8F5]">
                        {stage.facts.map(([label, value]) => (
                            <div key={label} className="py-3">
                                <dt className="text-sm text-[#526B85]">
                                    {label}
                                </dt>
                                <dd className="mt-1 text-base leading-7 font-semibold">
                                    {value}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </div>
                <aside className="min-w-0 self-start rounded-2xl border border-[#D9E8F5] bg-white p-5">
                    <h5 className="text-base font-bold">Yang perlu dipahami</h5>
                    <p className="mt-3 text-sm leading-7 text-[#526B85]">
                        {stage.boundary}
                    </p>
                    <h5 className="mt-5 border-t border-[#D9E8F5] pt-5 text-base font-bold">
                        Langkah berikutnya
                    </h5>
                    <p className="mt-3 text-sm leading-7 text-[#526B85]">
                        {stage.next}
                    </p>
                </aside>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <button
                    type="button"
                    className="landing-control"
                    onClick={() => selectStep(0, 'main')}
                >
                    <RotateCcw aria-hidden="true" className="size-4" />
                    Reset perjalanan
                </button>
                <div className="flex flex-wrap gap-2">
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
                        className="landing-primary px-4 disabled:opacity-60"
                        disabled={index >= lastIndex}
                        onClick={() => selectStep(index + 1)}
                    >
                        Berikutnya
                        <ArrowRight aria-hidden="true" className="size-4" />
                    </button>
                </div>
            </div>
            <p className="mt-4 text-xs leading-6 text-[#526B85]">
                Urutan demo, bukan progres akun. Nama dan hasil hanya contoh.
                Tidak membuktikan manfaat pilot.
            </p>
        </section>
    );
}
