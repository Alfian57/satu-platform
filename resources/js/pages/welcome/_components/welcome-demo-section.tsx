import { Play } from 'lucide-react';
import LandingJourneyDemo from '@/pages/welcome/_components/landing-journey-demo';
import LandingReveal from '@/pages/welcome/_components/landing-reveal';

export default function WelcomeDemoSection() {
    return (
        <section
            id="demo"
            aria-labelledby="demo-heading"
            className="landing-section landing-demo-section"
        >
            <div className="landing-container">
                <LandingReveal className="landing-section-intro">
                    <div>
                        <p className="landing-kicker">
                            <span className="landing-section-index">02</span>
                            Coba sendiri, tanpa membuat akun
                        </p>
                        <h2
                            id="demo-heading"
                            className="landing-section-title mt-4"
                        >
                            Dari peran pertama,
                            <br />
                            <span className="text-satu-blue">
                                sampai karya yang diakui.
                            </span>
                        </h2>
                        <p className="mt-5 max-w-2xl text-base leading-7 text-satu-muted">
                            Budi baru belajar desain dan belum punya karya.
                            Ikuti caranya menemukan tim, mengambil peran, dan
                            mencatat kontribusi pertamanya.
                        </p>
                    </div>
                    <div className="landing-demo-note">
                        <span
                            className="landing-demo-note-icon"
                            aria-hidden="true"
                        >
                            <Play className="size-4" />
                        </span>
                        <div>
                            <p className="text-sm font-bold text-satu-blue-hover">
                                Kamu yang pegang alurnya.
                            </p>
                            <p className="mt-2 text-sm leading-6 text-satu-muted">
                                Pilih tahap, lanjutkan cerita, atau coba
                                kemungkinan lain. Semua memakai data synthetic.
                            </p>
                        </div>
                    </div>
                </LandingReveal>
                <div className="mt-9">
                    <LandingJourneyDemo />
                </div>
            </div>
        </section>
    );
}
