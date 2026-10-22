import LandingPreview from '@/components/landing-preview';
import type { LandingStage } from '@/components/LandingFlowLedger';

export default function LandingFlowStagePanel({
    stage,
}: {
    stage: LandingStage;
}) {
    const Icon = stage.icon;

    return (
        <section
            id="landing-stage-panel"
            role="tabpanel"
            aria-labelledby={`landing-stage-tab-${stage.key}`}
            tabIndex={0}
            className="mt-5 rounded-[2rem] border border-satu-border-soft bg-satu-canvas p-5 sm:p-8 lg:p-10"
            data-testid="landing-stage-detail"
        >
            <div
                key={stage.key}
                className="landing-panel-enter grid gap-8 lg:min-h-[29rem] lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-center lg:gap-14"
            >
                <div className="min-w-0">
                    <span className="inline-flex size-14 items-center justify-center rounded-2xl border border-satu-border-soft bg-white text-satu-blue shadow-sm">
                        <Icon aria-hidden="true" className="size-6" />
                    </span>
                    <p className="mt-6 text-sm font-semibold text-satu-blue-hover">
                        Tahap {stage.index} / {stage.label}
                    </p>
                    <h3 className="mt-3 max-w-[18ch] text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.12] font-bold tracking-[-0.03em]">
                        {stage.title}
                    </h3>
                    <p className="mt-5 max-w-lg text-base leading-7 text-satu-muted">
                        {stage.description}
                    </p>
                    <dl className="mt-7 space-y-4 border-t border-satu-border-soft pt-5">
                        <div>
                            <dt className="text-xs text-satu-muted">
                                Sumber informasi
                            </dt>
                            <dd className="mt-1 text-sm font-semibold">
                                {stage.source}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs text-satu-muted">
                                Langkah berikutnya
                            </dt>
                            <dd className="mt-1 text-sm font-semibold">
                                {stage.outcome}
                            </dd>
                        </div>
                    </dl>
                </div>
                <LandingPreview kind={stage.preview} />
            </div>
        </section>
    );
}
