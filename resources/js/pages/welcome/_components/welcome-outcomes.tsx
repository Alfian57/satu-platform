import { ArrowUpRight } from 'lucide-react';
import LandingConceptArt from '@/pages/welcome/_components/landing-concept-art';
import LandingReveal from '@/pages/welcome/_components/landing-reveal';
import type { OutcomeItem } from '@/pages/welcome/_utils/welcome-constants';

interface WelcomeOutcomesProps {
    outcomes: readonly OutcomeItem[];
}

export default function WelcomeOutcomes({ outcomes }: WelcomeOutcomesProps) {
    return (
        <section
            id="cara-kerja"
            aria-labelledby="benefits-heading"
            className="landing-benefits landing-container scroll-mt-28"
        >
            <LandingReveal className="landing-section-intro">
                <div>
                    <p className="landing-kicker">
                        <span className="landing-section-index">01</span>
                        Langkah kecil, ruang baru
                    </p>
                    <h2
                        id="benefits-heading"
                        className="landing-section-title mt-4"
                    >
                        Bukan harus dikenal dulu.
                        <br />
                        <span className="text-satu-blue">
                            Mulai dari yang bisa kamu lakukan.
                        </span>
                    </h2>
                </div>
                <p className="landing-section-description">
                    Dari kesempatan pertama, sampai pekerjaan yang dapat kamu
                    ceritakan dengan bukti.
                </p>
            </LandingReveal>
            <div id="fitur" className="landing-benefit-grid scroll-mt-28">
                {outcomes.map(
                    (
                        { icon: Icon, title, description, label, number, art },
                        index,
                    ) => (
                        <LandingReveal
                            key={label}
                            delay={index * 80}
                            className={`landing-benefit landing-benefit--${art}`}
                        >
                            <div className="landing-benefit-meta">
                                <span>
                                    {number} / {label}
                                </span>
                                <Icon aria-hidden="true" className="size-5" />
                            </div>
                            <LandingConceptArt kind={art} />
                            <div className="landing-benefit-copy">
                                <h3>{title}</h3>
                                <p>{description}</p>
                                <a
                                    href="#demo"
                                    className="landing-benefit-link"
                                >
                                    Lihat dalam demo{' '}
                                    <ArrowUpRight
                                        aria-hidden="true"
                                        className="size-4"
                                    />
                                    <span className="sr-only">: {label}</span>
                                </a>
                            </div>
                        </LandingReveal>
                    ),
                )}
            </div>
        </section>
    );
}
