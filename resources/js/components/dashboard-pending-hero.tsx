import { ArrowRight, Hand, Sparkle } from 'lucide-react';
import Mascot from '@/components/mascot';

export function DashboardPendingHero({ firstName }: { firstName: string }) {
    return (
        <header className="dashboard-pending-hero" data-test="dashboard-hero">
            <picture
                className="dashboard-pending-hero__background"
                aria-hidden="true"
            >
                <source
                    media="(max-width: 639px)"
                    srcSet="/images/dashboard-affiliation-campus-768.webp"
                />
                <img
                    src="/images/dashboard-affiliation-campus.webp"
                    srcSet="/images/dashboard-affiliation-campus-1280.webp 1280w, /images/dashboard-affiliation-campus.webp 2560w"
                    sizes="(min-width: 1600px) 96rem, 100vw"
                    width={2560}
                    height={853}
                    alt=""
                    fetchPriority="high"
                    decoding="async"
                />
            </picture>
            <div className="dashboard-pending-hero__layout">
                <div className="dashboard-pending-hero__copy">
                    <p className="dashboard-pending-hero__greeting">
                        <Hand aria-hidden="true" className="size-4" />
                        <span>
                            Halo, <strong>{firstName}!</strong>
                        </span>
                    </p>
                    <h1>
                        Pengajuanmu sudah <span>tercatat.</span>
                    </h1>
                    <p className="dashboard-pending-hero__description">
                        Pengajuan afiliasimu menunggu verifikasi Admin
                        Universitas.
                        <span>Kamu tidak perlu mengajukan ulang.</span>
                    </p>
                    <a
                        className="dashboard-pending-hero__link"
                        href="#dashboard-affiliation-heading"
                    >
                        Lihat status afiliasi
                        <ArrowRight aria-hidden="true" className="size-4" />
                    </a>
                </div>
                <div
                    className="dashboard-pending-hero__scene"
                    aria-hidden="true"
                >
                    <div className="dashboard-pending-hero__halo" />
                    <div className="dashboard-pending-hero__ground" />
                    <Sparkle className="dashboard-pending-hero__spark dashboard-pending-hero__spark--left" />
                    <Sparkle className="dashboard-pending-hero__spark dashboard-pending-hero__spark--right" />
                    <Sparkle className="dashboard-pending-hero__spark dashboard-pending-hero__spark--outer" />
                    <Mascot
                        pose="waiting-review"
                        priority
                        className="dashboard-pending-hero__mascot"
                    />
                </div>
            </div>
        </header>
    );
}
