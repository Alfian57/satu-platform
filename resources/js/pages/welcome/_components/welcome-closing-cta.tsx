import { Link } from '@inertiajs/react';
import { ArrowRight, Sparkles } from 'lucide-react';
import Mascot from '@/components/mascot';
import LandingReveal from '@/pages/welcome/_components/landing-reveal';
import { dashboard, login, register } from '@/routes';

interface WelcomeClosingCtaProps {
    auth: { user?: unknown };
}

export default function WelcomeClosingCta({ auth }: WelcomeClosingCtaProps) {
    return (
        <section
            aria-labelledby="start-heading"
            className="landing-container landing-start"
        >
            <LandingReveal className="landing-closing relative isolate grid gap-6 overflow-hidden text-white lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.5fr)] lg:items-center">
                <div className="landing-closing-copy relative">
                    <p className="flex items-center gap-2 text-sm font-semibold text-satu-blue-soft">
                        <Sparkles aria-hidden="true" className="size-4" />
                        Mulai dari satu langkah
                    </p>
                    <h2
                        id="start-heading"
                        className="landing-section-title mt-4 max-w-[20ch]"
                    >
                        Satu peran bisa jadi awal ceritamu.
                    </h2>
                    <p className="mt-5 max-w-xl text-base leading-7 text-satu-border-soft">
                        {auth.user
                            ? 'Kembali ke ruang kerjamu dan lanjutkan langkah berikutnya.'
                            : 'Buat akun mahasiswa, verifikasi afiliasi kampus, dan kenali peluang yang tersedia untukmu.'}
                    </p>
                    <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                        <Link
                            href={auth.user ? dashboard() : register()}
                            className="landing-primary min-h-12 px-6"
                            prefetch
                        >
                            {auth.user
                                ? 'Buka beranda'
                                : 'Mulai sebagai mahasiswa'}
                            <ArrowRight aria-hidden="true" className="size-4" />
                        </Link>
                        {!auth.user && (
                            <Link
                                href={login()}
                                className="landing-control min-h-12 bg-white px-6"
                            >
                                Sudah punya akun? Masuk
                            </Link>
                        )}
                    </div>
                </div>
                <div className="landing-closing-stage">
                    <span
                        aria-hidden="true"
                        className="landing-closing-greeting"
                    >
                        Siap memulai cerita baru?
                    </span>
                    <Mascot
                        pose="guide"
                        className="landing-closing-mascot relative mx-auto"
                    />
                </div>
            </LandingReveal>
        </section>
    );
}
