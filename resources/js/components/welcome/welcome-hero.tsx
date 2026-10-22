import { Link } from '@inertiajs/react';
import {
    ArrowRight,
    ChevronDown,
    GraduationCap,
    Play,
    ShieldCheck,
} from 'lucide-react';
import LandingMascot from '@/components/landing-mascot';
import LandingReveal from '@/components/landing-reveal';
import { dashboard, register } from '@/routes';

interface WelcomeHeroProps {
    auth: { user?: unknown };
    publicUniversity?: { name: string | null };
}

export default function WelcomeHero({
    auth,
    publicUniversity,
}: WelcomeHeroProps) {
    return (
        <section
            aria-labelledby="landing-heading"
            className="landing-container landing-intro"
        >
            <img
                className="landing-hero-backdrop"
                src="/images/landing-hero-background.webp"
                alt=""
                width={1672}
                height={941}
                decoding="async"
                aria-hidden="true"
            />
            <div className="landing-main-hero relative isolate">
                <LandingMascot>
                    <LandingReveal className="landing-hero-editorial">
                        <p className="landing-eyebrow">
                            <GraduationCap
                                aria-hidden="true"
                                className="size-4 shrink-0"
                            />
                            {publicUniversity?.name ??
                                'Universitas belum dikonfigurasi'}
                        </p>
                        <h1 id="landing-heading" className="landing-hero-title">
                            Ada ruang untuk
                            <span className="landing-hero-emphasis">
                                kemampuanmu.
                            </span>
                        </h1>
                        <p className="landing-hero-description mt-6 max-w-[43ch] text-satu-muted">
                            Temukan peran yang sesuai, berkarya bersama rekan
                            baru, dan buktikan kontribusimu.
                        </p>
                        <div className="landing-hero-actions mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                            <Link
                                href={auth.user ? dashboard() : register()}
                                prefetch
                                className="landing-primary min-h-12 px-6"
                            >
                                {auth.user
                                    ? 'Buka beranda'
                                    : 'Mulai sebagai mahasiswa'}
                                <ArrowRight
                                    aria-hidden="true"
                                    className="size-4"
                                />
                            </Link>
                            <a
                                href="#demo"
                                className="landing-control min-h-12 bg-white/90 px-6"
                            >
                                Coba demo
                                <Play aria-hidden="true" className="size-4" />
                            </a>
                        </div>
                        <p className="landing-hero-reassurance mt-5 flex items-start gap-2 text-sm leading-6 text-satu-muted">
                            <ShieldCheck
                                aria-hidden="true"
                                className="mt-0.5 size-4 shrink-0 text-satu-blue"
                            />
                            {auth.user
                                ? 'Lanjutkan dari ruang kerjamu.'
                                : 'Belum punya karya? Kamu tetap bisa mulai.'}
                        </p>
                    </LandingReveal>
                </LandingMascot>
            </div>
            <a href="#cara-kerja" className="landing-hero-scroll">
                Gulir untuk mengenal SATU
                <ChevronDown aria-hidden="true" className="size-4" />
            </a>
        </section>
    );
}
