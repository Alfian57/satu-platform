import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowRight,
    BadgeCheck,
    EyeOff,
    FileCheck2,
    Landmark,
    Layers,
    LockKeyhole,
    Network,
    Rocket,
    Search,
    ShieldCheck,
    Target,
    UsersRound,
    Zap,
} from 'lucide-react';
import React, { Suspense, lazy, useSyncExternalStore } from 'react';
import AppLogo from '@/components/app-logo';
import LandingFlowLedger, {
    LANDING_STAGES,
} from '@/components/LandingFlowLedger';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { dashboard, login, register } from '@/routes';

/**
 * SATU Landing Page: Modern & Elegant Redesign
 * Warna patokan: Blue hero gradient (#2563EB / #1D4ED8 / #4F46E5)
 * Smooth scroll, scroll-triggered animations, elegant icon treatments
 */

const landingTheme = {
    '--landing-canvas': '#F8FAFC',
    '--landing-surface': '#FFFFFF',
    '--landing-ink': '#0F172A',
    '--landing-muted': '#475569',
    '--landing-border': '#E2E8F0',
    '--landing-blue': '#2563EB',
    '--landing-blue-strong': '#1D4ED8',
    '--landing-blue-soft': '#EFF6FF',
    '--landing-lilac': '#4F46E5',
    '--landing-lilac-soft': '#EEF2FF',
    '--landing-mint': '#059669',
    '--landing-mint-soft': '#ECFDF5',
    '--landing-coral': '#0284C7',
    '--landing-coral-soft': '#F0F9FF',
    '--landing-yellow': '#D97706',
    '--landing-yellow-soft': '#FFFBEB',
    '--landing-hero-start': '#EFF6FF',
    '--landing-hero-middle': '#DBEAFE',
    '--landing-hero-end': '#BFDBFE',
} as React.CSSProperties;

const roleRows = [
    {
        key: 'student',
        label: 'Mahasiswa',
        tagline: 'Mulai Kolaborasi & Kendalikan Visibilitas',
        icon: UsersRound,
        accentIcon: Rocket,
        badge: 'Untuk Talenta',
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        gradientFrom: 'from-blue-500',
        gradientTo: 'to-indigo-600',
        description:
            'Temukan peluang, bentuk tim, dan susun kontribusi menjadi portofolio yang dapat kamu kendalikan visibilitasnya.',
        cta: 'Mulai sebagai mahasiswa',
        href: 'register',
    },
    {
        key: 'campus',
        label: 'Operator kampus',
        tagline: 'Afiliasi & Validasi Terstruktur',
        icon: Landmark,
        accentIcon: BadgeCheck,
        badge: 'Operasi Kampus',
        badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        gradientFrom: 'from-indigo-500',
        gradientTo: 'to-purple-600',
        description:
            'Kelola afiliasi, validasi kontribusi, dan provenance keputusan dalam alur operasi yang dapat ditinjau.',
        cta: 'Lihat batas operasi',
        href: '#privacy',
    },
    {
        key: 'recruiter',
        label: 'Perekrut',
        tagline: 'Portofolio Terverifikasi & Privasi Terjamin',
        icon: FileCheck2,
        accentIcon: Search,
        badge: 'Talent Scout',
        badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
        gradientFrom: 'from-sky-500',
        gradientTo: 'to-blue-600',
        description:
            'Temukan proyeksi portofolio yang secara eksplisit diizinkan mahasiswa, tanpa membuka ruang privat mereka.',
        cta: 'Lihat batas portofolio',
        href: '#privacy',
    },
] as const;

const LandingDemoGraph = lazy(() => import('@/components/LandingDemoGraph'));

const subscribeToHydration = () => () => undefined;
const getClientHydrationSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

function useIsHydrated(): boolean {
    return useSyncExternalStore(
        subscribeToHydration,
        getClientHydrationSnapshot,
        getServerHydrationSnapshot,
    );
}

function LandingDemoGraphFallback() {
    return (
        <div
            className="grid gap-5 p-4 lg:grid-cols-[minmax(0,1fr)_21rem] lg:p-6"
            aria-busy="true"
            role="status"
        >
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                    <Skeleton className="h-8 w-40 bg-blue-100/60" />
                    <Skeleton className="h-9 w-28 bg-blue-100/60" />
                </div>
                <Skeleton className="h-[320px] w-full rounded-2xl bg-blue-100/60 lg:h-[420px]" />
            </div>
            <div className="space-y-4">
                <Skeleton className="h-8 w-32 bg-blue-100/60" />
                <Skeleton className="h-16 w-full rounded-xl bg-blue-100/60" />
                <Skeleton className="h-16 w-full rounded-xl bg-blue-100/60" />
            </div>
            <span className="sr-only">Menyiapkan demo kolaborasi...</span>
        </div>
    );
}

/** Trust indicator pills for hero section */
function TrustIndicator({
    icon: Icon,
    label,
}: {
    icon: React.ElementType;
    label: string;
}) {
    return (
        <div className="flex items-center gap-2.5 rounded-2xl border border-white/60 bg-white/50 p-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/80 hover:shadow-md">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm">
                <Icon aria-hidden="true" className="size-4" />
            </div>
            <span className="text-sm font-semibold text-slate-700">
                {label}
            </span>
        </div>
    );
}

export default function Welcome() {
    const { auth } = usePage().props;
    const isHydrated = useIsHydrated();

    return (
        <>
            <Head title="Sistem Aktivitas Talenta Universitas" />
            <div
                id="top"
                data-landing-surface
                data-motion-ready="true"
                className="landing-page-canvas min-h-screen overflow-x-clip text-[var(--landing-ink)] selection:bg-blue-200/60"
                style={{ ...landingTheme, colorScheme: 'light' }}
            >
                {/* ============================================ */}
                {/* Header Navigation - Glassmorphism             */}
                {/* ============================================ */}
                <header className="landing-glass landing-glass-border sticky top-0 z-50 w-full shadow-sm">
                    <div className="mx-auto flex min-h-16 max-w-[110rem] items-center justify-between gap-6 px-5 sm:px-6 lg:px-20">
                        <a
                            href="#top"
                            aria-label="SATU: kembali ke awal halaman"
                            className="group flex items-center gap-2 transition-opacity duration-300 hover:opacity-90 motion-reduce:transition-none"
                        >
                            <AppLogo
                                compact
                                className="text-[var(--landing-ink)]"
                                ruleClassName="bg-blue-600"
                            />
                        </a>

                        <nav
                            aria-label="Navigasi landing"
                            className="hidden items-center gap-1 lg:flex"
                        >
                            {[
                                { href: '#cara-kerja', label: 'Cara kerja' },
                                { href: '#demo', label: 'Demo synthetic' },
                                { href: '#peran', label: 'Untuk siapa' },
                                { href: '#privacy', label: 'Batas privasi' },
                            ].map((link) => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-blue-50/80 hover:text-blue-600 motion-reduce:transition-none"
                                >
                                    {link.label}
                                </a>
                            ))}
                        </nav>

                        <div className="flex items-center gap-3">
                            {auth.user ? (
                                <Button
                                    asChild
                                    size="sm"
                                    className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 font-medium text-white shadow-md shadow-blue-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/30 motion-reduce:transition-none"
                                >
                                    <Link href={dashboard()} prefetch>
                                        Buka dashboard
                                    </Link>
                                </Button>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="hidden text-sm font-medium text-slate-600 transition-colors duration-200 hover:text-blue-600 motion-reduce:transition-none sm:inline-flex"
                                    >
                                        Masuk
                                    </Link>
                                    <Button
                                        asChild
                                        size="sm"
                                        className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 font-medium text-white shadow-md shadow-blue-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/30 motion-reduce:transition-none"
                                    >
                                        <Link href={register()} prefetch>
                                            Daftar mahasiswa
                                        </Link>
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                <main>
                    {/* ============================================ */}
                    {/* Hero Section                                  */}
                    {/* ============================================ */}
                    <section
                        aria-labelledby="landing-heading"
                        className="landing-blue-hero relative isolate overflow-hidden"
                    >
                        {/* Decorative gradient orbs */}
                        <div
                            aria-hidden="true"
                            className="landing-glow-orb pointer-events-none absolute -top-32 right-[10%] size-[30rem] rounded-full bg-blue-300/20 blur-[100px]"
                        />
                        <div
                            aria-hidden="true"
                            className="landing-glow-orb pointer-events-none absolute bottom-0 left-[5%] size-[25rem] rounded-full bg-indigo-300/15 blur-[80px] [animation-delay:2s]"
                        />

                        {/* Floating dots */}
                        <div
                            aria-hidden="true"
                            className="landing-orbit-dot pointer-events-none absolute top-[25%] right-[12%] size-3 rounded-full bg-blue-400/60 shadow-lg shadow-blue-400/20"
                        />
                        <div
                            aria-hidden="true"
                            className="landing-orbit-dot pointer-events-none absolute top-[15%] right-[30%] size-2 rounded-full bg-indigo-400/50 [animation-delay:1.2s]"
                        />
                        <div
                            aria-hidden="true"
                            className="landing-orbit-dot pointer-events-none absolute bottom-[20%] left-[8%] size-2.5 rounded-full bg-blue-500/40 [animation-delay:2.4s]"
                        />

                        {/* Grid pattern overlay */}
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(37,99,235,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.03)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_30%,black_20%,transparent_100%)] bg-[size:60px_60px]"
                        />

                        <div className="relative mx-auto grid min-h-[calc(100svh-4rem)] max-w-[110rem] items-center gap-12 px-5 py-16 sm:px-6 sm:py-20 lg:min-h-[calc(100svh-14rem)] lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] lg:gap-16 lg:px-20 lg:pt-4 lg:pb-8">
                            <div className="relative z-10 max-w-2xl">
                                {/* Kicker badge */}
                                <div
                                    className="landing-motion-rise flex flex-wrap items-center gap-2.5"
                                    style={
                                        {
                                            '--landing-delay': '40ms',
                                        } as React.CSSProperties
                                    }
                                >
                                    <span className="inline-flex items-center gap-2 rounded-full border border-blue-200/60 bg-white/70 px-4 py-1.5 font-label text-[0.68rem] font-semibold tracking-wider text-blue-700 shadow-sm">
                                        <span
                                            aria-hidden="true"
                                            className="flex size-2 items-center justify-center rounded-full bg-blue-500"
                                        >
                                            <span className="size-1 animate-ping rounded-full bg-blue-400" />
                                        </span>
                                        BUKU BESAR KOLABORASI
                                    </span>
                                    <span className="text-xs font-medium text-slate-500">
                                        5 momen yang saling terhubung
                                    </span>
                                </div>

                                {/* Main heading */}
                                <h1
                                    id="landing-heading"
                                    className="landing-motion-rise mt-8 max-w-[14ch] text-[clamp(2.8rem,6.5vw,5.2rem)] leading-[0.96] font-bold tracking-tight"
                                    style={
                                        {
                                            '--landing-delay': '120ms',
                                        } as React.CSSProperties
                                    }
                                >
                                    <span className="text-slate-900">
                                        Kolaborasi yang{' '}
                                    </span>
                                    <span className="landing-section-heading">
                                        menjadi bukti.
                                    </span>
                                </h1>

                                {/* Subtitle */}
                                <p
                                    className="landing-motion-rise mt-7 max-w-xl text-base leading-7 text-slate-500 sm:text-lg sm:leading-8"
                                    style={
                                        {
                                            '--landing-delay': '200ms',
                                        } as React.CSSProperties
                                    }
                                >
                                    SATU menghubungkan peluang, kerja tim, dan
                                    kontribusi nyata menjadi portofolio yang
                                    punya konteks. Mahasiswa membangun karya,
                                    kampus memvalidasi, dan perekrut melihat
                                    hanya proyeksi yang diizinkan.
                                </p>

                                {/* CTA buttons */}
                                <div
                                    className="landing-motion-rise mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center"
                                    style={
                                        {
                                            '--landing-delay': '280ms',
                                        } as React.CSSProperties
                                    }
                                >
                                    <Button
                                        asChild
                                        size="lg"
                                        className="group h-13 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-8 font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/30 motion-reduce:transition-none"
                                    >
                                        <Link href={register()} prefetch>
                                            Mulai membangun portofolio
                                            <ArrowRight
                                                aria-hidden="true"
                                                className="ml-1 size-4 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none"
                                            />
                                        </Link>
                                    </Button>
                                    <a
                                        href="#cara-kerja"
                                        className="group inline-flex h-13 items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/60 px-6 text-sm font-semibold text-slate-700 transition-all duration-300 hover:border-blue-200 hover:bg-white hover:text-blue-600 hover:shadow-md motion-reduce:transition-none"
                                    >
                                        Lihat cara kerja
                                        <ArrowDown
                                            aria-hidden="true"
                                            className="size-4 transition-transform duration-300 group-hover:translate-y-1 motion-reduce:transition-none"
                                        />
                                    </a>
                                </div>

                                {/* Trust indicators */}
                                <div
                                    className="landing-motion-rise mt-12 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3"
                                    style={
                                        {
                                            '--landing-delay': '400ms',
                                        } as React.CSSProperties
                                    }
                                >
                                    <TrustIndicator
                                        icon={ShieldCheck}
                                        label="Validasi terlihat"
                                    />
                                    <TrustIndicator
                                        icon={LockKeyhole}
                                        label="Visibilitas terkendali"
                                    />
                                    <TrustIndicator
                                        icon={FileCheck2}
                                        label="Bukti punya konteks"
                                    />
                                </div>
                            </div>

                            <div
                                className="landing-hero-illustration relative z-10"
                                data-testid="landing-hero-illustration"
                            >
                                <figure className="landing-mascot-stage relative flex aspect-square items-center justify-center overflow-hidden rounded-[2rem] p-3 sm:p-6">
                                    <img
                                        src="/images/landing-mascot-accessories.webp"
                                        alt="Maskot buku besar SATU dengan node kolaborasi dan lencana validasi."
                                        width={1200}
                                        height={800}
                                        fetchPriority="high"
                                        decoding="async"
                                        className="relative z-10 w-full max-w-[39rem] object-contain drop-shadow-[0_24px_18px_rgba(23,70,176,0.24)]"
                                    />
                                </figure>
                            </div>
                        </div>

                        {/* Section transition wave */}
                        <div className="absolute right-0 bottom-0 left-0 h-24 bg-gradient-to-t from-white to-transparent" />
                    </section>

                    {/* ============================================ */}
                    {/* Section: Cara Kerja (Lifecycle)               */}
                    {/* ============================================ */}
                    <section
                        id="cara-kerja"
                        aria-labelledby="lifecycle-heading"
                        className="landing-section-surface landing-section-surface--paper relative scroll-mt-16 py-24 sm:py-32"
                    >
                        <div className="mx-auto max-w-[110rem] px-5 sm:px-6 lg:px-20">
                            {/* Section header */}
                            <div className="landing-scroll-reveal grid gap-6 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:items-end lg:gap-14">
                                <div>
                                    <div className="inline-flex items-center gap-2.5 rounded-full border border-blue-100 bg-blue-50/80 px-4 py-1.5 font-label text-[0.65rem] font-semibold tracking-wider text-blue-700">
                                        <Layers
                                            aria-hidden="true"
                                            className="size-3.5"
                                        />
                                        CARA KERJA
                                    </div>
                                    <h2
                                        id="lifecycle-heading"
                                        className="mt-5 text-[clamp(1.9rem,3.5vw,3rem)] leading-[1.06] font-bold tracking-tight"
                                    >
                                        <span className="landing-section-heading">
                                            Dari peluang menjadi bukti.
                                        </span>{' '}
                                        <span className="text-slate-900">
                                            Lima momen yang saling menguatkan.
                                        </span>
                                    </h2>
                                </div>
                                <p className="text-base leading-7 text-slate-500 sm:text-lg sm:leading-8">
                                    Setiap tahap meninggalkan konteks untuk
                                    orang berikutnya. Bukan sekadar aktivitas
                                    bebas, tetapi alur kerja yang bisa
                                    diverifikasi dari awal pembentukan sampai
                                    bukti siap diproyeksikan.
                                </p>
                            </div>

                            {/* Flow ledger interaktif dipindahkan dari hero. */}
                            <div className="landing-scroll-reveal mt-14 grid gap-8 xl:grid-cols-[minmax(0,1fr)_17rem] xl:items-start xl:gap-12">
                                <LandingFlowLedger className="landing-workflow-ledger min-w-0" />

                                <aside className="border-y border-blue-200/80 py-6 xl:mt-8">
                                    <p className="font-label text-[0.65rem] font-semibold tracking-wider text-blue-700">
                                        CARA MEMBACA ALUR
                                    </p>
                                    <h3 className="mt-3 text-xl font-bold tracking-tight text-slate-900">
                                        Setiap tahap meninggalkan jejak.
                                    </h3>
                                    <ol className="mt-6 space-y-4 text-sm leading-6 text-slate-600">
                                        <li className="flex gap-3">
                                            <span className="font-label text-xs font-semibold text-blue-700">
                                                01
                                            </span>
                                            <span>
                                                Pilih tahap untuk membaca
                                                konteks dan asal bukti.
                                            </span>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="font-label text-xs font-semibold text-blue-700">
                                                02
                                            </span>
                                            <span>
                                                Catatan dalam ledger menjelaskan
                                                apa yang berlanjut.
                                            </span>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="font-label text-xs font-semibold text-blue-700">
                                                03
                                            </span>
                                            <span>
                                                Visibilitas portofolio tetap
                                                berada pada kendali mahasiswa.
                                            </span>
                                        </li>
                                    </ol>
                                </aside>
                            </div>
                        </div>
                    </section>

                    {/* ============================================ */}
                    {/* Section: Demo Interaktif                      */}
                    {/* ============================================ */}
                    <section
                        id="demo"
                        aria-labelledby="demo-heading"
                        className="landing-section-surface landing-section-surface--blue relative scroll-mt-16 overflow-hidden py-24 sm:py-32"
                    >
                        {/* Background decoration */}
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(37,99,235,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.02)_1px,transparent_1px)] bg-[size:48px_48px]"
                        />

                        <div className="relative mx-auto max-w-[110rem] px-5 sm:px-6 lg:px-20">
                            <div className="landing-scroll-reveal flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
                                <div className="max-w-2xl">
                                    <div className="inline-flex items-center gap-2.5 rounded-full border border-blue-100 bg-blue-50/80 px-4 py-1.5 font-label text-[0.65rem] font-semibold tracking-wider text-blue-700">
                                        <Network
                                            aria-hidden="true"
                                            className="size-3.5"
                                        />
                                        DEMO INTERAKTIF
                                    </div>
                                    <h2
                                        id="demo-heading"
                                        className="mt-5 text-[clamp(1.9rem,3.5vw,3rem)] leading-[1.06] font-bold tracking-tight"
                                    >
                                        <span className="landing-section-heading">
                                            Lihat hubungan tumbuh
                                        </span>{' '}
                                        <span className="text-slate-900">
                                            dari satu kontribusi.
                                        </span>
                                    </h2>
                                </div>
                                <div className="flex items-center gap-2.5 rounded-xl border border-blue-100 bg-white/80 px-4 py-2.5 text-xs font-medium text-blue-800 shadow-sm">
                                    <span className="relative flex size-2 shrink-0">
                                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-blue-400 opacity-75" />
                                        <span className="relative inline-flex size-2 rounded-full bg-blue-500" />
                                    </span>
                                    <span>
                                        Semua record pada demo ini adalah Data
                                        synthetic.
                                    </span>
                                </div>
                            </div>

                            <p className="landing-scroll-reveal mt-5 max-w-2xl text-base leading-7 text-slate-500 sm:text-lg sm:leading-8">
                                Pilih node untuk membaca hubungan yang
                                terbentuk. Tabel di samping menjadi cara baca
                                yang setara untuk keyboard dan screen reader.
                            </p>

                            <div className="landing-scroll-reveal mt-10 overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-2 shadow-lg shadow-slate-200/50 sm:p-3">
                                <div data-testid="landing-demo-region">
                                    {isHydrated ? (
                                        <Suspense
                                            fallback={
                                                <LandingDemoGraphFallback />
                                            }
                                        >
                                            <LandingDemoGraph />
                                        </Suspense>
                                    ) : (
                                        <LandingDemoGraphFallback />
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ============================================ */}
                    {/* Section: Untuk Siapa (Roles)                  */}
                    {/* ============================================ */}
                    <section
                        id="peran"
                        aria-labelledby="roles-heading"
                        className="landing-section-surface landing-section-surface--paper relative scroll-mt-16 py-24 sm:py-32"
                    >
                        <div className="mx-auto max-w-[110rem] px-5 sm:px-6 lg:px-20">
                            <div className="landing-scroll-reveal max-w-2xl">
                                <div className="inline-flex items-center gap-2.5 rounded-full border border-blue-100 bg-blue-50/80 px-4 py-1.5 font-label text-[0.65rem] font-semibold tracking-wider text-blue-700">
                                    <Target
                                        aria-hidden="true"
                                        className="size-3.5"
                                    />
                                    UNTUK SIAPA
                                </div>
                                <h2
                                    id="roles-heading"
                                    className="mt-5 text-[clamp(1.9rem,3.5vw,3rem)] leading-[1.06] font-bold tracking-tight"
                                >
                                    <span className="landing-section-heading">
                                        Satu alur,
                                    </span>{' '}
                                    <span className="text-slate-900">
                                        pengalaman yang tetap personal.
                                    </span>
                                </h2>
                                <p className="mt-5 text-base leading-7 text-slate-500 sm:text-lg sm:leading-8">
                                    SATU menyatukan kerja kolaboratif tanpa
                                    menyamakan kebutuhan atau hak akses semua
                                    orang.
                                </p>
                            </div>

                            {/* Role cards with elegant design */}
                            <div className="mt-14 grid gap-6 lg:grid-cols-3">
                                {roleRows.map((role) => {
                                    const RoleIcon = role.icon;
                                    const AccentIcon = role.accentIcon;

                                    return (
                                        <article
                                            key={role.key}
                                            className="landing-bento-card landing-role-row landing-scroll-reveal group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm sm:p-8"
                                        >
                                            {/* Background gradient accent on hover */}
                                            <div
                                                aria-hidden="true"
                                                className={`pointer-events-none absolute -top-12 -right-12 size-40 rounded-full bg-gradient-to-br ${role.gradientFrom} ${role.gradientTo} opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-10`}
                                            />

                                            <div className="relative">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div
                                                        className={`flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br ${role.gradientFrom} ${role.gradientTo} text-white shadow-lg shadow-blue-500/10 transition-transform duration-300 group-hover:scale-105`}
                                                    >
                                                        <RoleIcon
                                                            aria-hidden="true"
                                                            className="size-6"
                                                        />
                                                    </div>
                                                    <span
                                                        className={`rounded-full border px-3 py-1 font-label text-[0.62rem] font-semibold tracking-wider ${role.badgeColor}`}
                                                    >
                                                        {role.badge}
                                                    </span>
                                                </div>

                                                <h3 className="mt-6 text-xl font-bold tracking-tight text-slate-900">
                                                    {role.label}
                                                </h3>
                                                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-blue-600">
                                                    <AccentIcon
                                                        aria-hidden="true"
                                                        className="size-3.5"
                                                    />
                                                    {role.tagline}
                                                </p>
                                                <p className="mt-4 text-sm leading-6 text-slate-500">
                                                    {role.description}
                                                </p>
                                            </div>

                                            <div className="relative mt-8 border-t border-slate-100 pt-5">
                                                {role.href === 'register' ? (
                                                    <Link
                                                        href={register()}
                                                        prefetch
                                                        className="group/cta inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
                                                    >
                                                        {role.cta}
                                                        <ArrowRight
                                                            aria-hidden="true"
                                                            className="landing-role-arrow size-4 transition-transform duration-300 motion-reduce:transition-none"
                                                        />
                                                    </Link>
                                                ) : (
                                                    <a
                                                        href={role.href}
                                                        className="group/cta inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
                                                    >
                                                        {role.cta}
                                                        <ArrowRight
                                                            aria-hidden="true"
                                                            className="landing-role-arrow size-4 transition-transform duration-300 motion-reduce:transition-none"
                                                        />
                                                    </a>
                                                )}
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>

                            {/* ============================================ */}
                            {/* Privacy & Projection Boundaries               */}
                            {/* ============================================ */}
                            <div
                                id="privacy"
                                className="landing-scroll-reveal mt-16 overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50/60 via-white to-indigo-50/40 p-8 shadow-sm sm:p-10"
                            >
                                <div className="grid gap-10 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:items-center lg:gap-16">
                                    <div>
                                        <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/20">
                                            <LockKeyhole
                                                aria-hidden="true"
                                                className="size-6"
                                            />
                                        </div>
                                        <p className="mt-6 font-label text-[0.68rem] font-bold tracking-wider text-blue-700">
                                            BATAS PROYEKSI
                                        </p>
                                        <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                                            Data yang terlihat{' '}
                                            <span className="landing-section-heading">
                                                punya tujuan.
                                            </span>
                                        </h3>
                                        <p className="mt-4 text-sm leading-6 text-slate-500">
                                            Portofolio hanya diproyeksikan
                                            ketika mahasiswa mengizinkannya.
                                            Username, nomor WhatsApp, diskusi
                                            privat, dan raw audit tidak pernah
                                            diekspos ke publik atau perekrut.
                                        </p>
                                    </div>

                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <div className="group rounded-2xl border border-emerald-200/60 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                                            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-sm">
                                                <ShieldCheck
                                                    aria-hidden="true"
                                                    className="size-5"
                                                />
                                            </div>
                                            <p className="mt-4 text-sm font-bold text-slate-900">
                                                Yang dapat diproyeksikan
                                            </p>
                                            <p className="mt-2 text-xs leading-5 text-slate-500">
                                                Entry portofolio dan kontribusi
                                                terverifikasi yang dipilih.
                                            </p>
                                        </div>
                                        <div className="group rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                                            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 text-white shadow-sm">
                                                <EyeOff
                                                    aria-hidden="true"
                                                    className="size-5"
                                                />
                                            </div>
                                            <p className="mt-4 text-sm font-bold text-slate-900">
                                                Yang tetap privat
                                            </p>
                                            <p className="mt-2 text-xs leading-5 text-slate-500">
                                                Percakapan internal, nomor
                                                WhatsApp, username, dan detail
                                                audit mentah.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <p className="mt-8 flex items-start gap-2.5 text-xs leading-5 text-slate-400">
                                <FileCheck2
                                    aria-hidden="true"
                                    className="mt-0.5 size-4 shrink-0 text-blue-500"
                                />
                                <span>
                                    Untuk evaluator: demo ini memakai Data
                                    synthetic dan tidak menyatakan pelanggan,
                                    harga, hasil pilot, atau dampak yang belum
                                    terbukti.
                                </span>
                            </p>
                        </div>
                    </section>

                    {/* ============================================ */}
                    {/* CTA Section                                   */}
                    {/* ============================================ */}
                    <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 py-20 sm:py-28">
                        {/* Decorative elements */}
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px]"
                        />
                        <div
                            aria-hidden="true"
                            className="landing-glow-orb pointer-events-none absolute top-0 right-[20%] size-[30rem] rounded-full bg-white/5 blur-[100px]"
                        />

                        <div className="relative mx-auto max-w-4xl px-5 text-center sm:px-6 lg:px-8">
                            <div className="landing-scroll-reveal">
                                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 font-label text-[0.65rem] font-semibold tracking-wider text-blue-100">
                                    <Zap
                                        aria-hidden="true"
                                        className="size-3.5"
                                    />
                                    MULAI SEKARANG
                                </div>
                                <h2 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                                    Siap membangun portofolio
                                    <br className="hidden sm:block" /> yang
                                    punya konteks?
                                </h2>
                                <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-blue-100/80 sm:text-lg">
                                    Daftar gratis sebagai mahasiswa dan mulai
                                    kolaborasi pertamamu. Kontribusimu akan
                                    tervalidasi dan siap diproyeksikan.
                                </p>
                                <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                                    <Button
                                        asChild
                                        size="lg"
                                        className="group h-13 rounded-2xl bg-white px-8 font-semibold text-blue-700 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-blue-50 hover:shadow-xl motion-reduce:transition-none"
                                    >
                                        <Link href={register()} prefetch>
                                            Daftar mahasiswa
                                            <ArrowRight
                                                aria-hidden="true"
                                                className="ml-1 size-4 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none"
                                            />
                                        </Link>
                                    </Button>
                                    <a
                                        href="#cara-kerja"
                                        className="inline-flex h-13 items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/20 motion-reduce:transition-none"
                                    >
                                        Pelajari lebih lanjut
                                    </a>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                {/* Accessible Noscript Fallback */}
                <noscript>
                    <section className="border-b border-slate-200 bg-slate-50 px-5 py-12 sm:px-6">
                        <div className="mx-auto max-w-[110rem]">
                            <p className="font-label text-[0.65rem] tracking-wider text-blue-700">
                                DATA SYNTHETIC
                            </p>
                            <h2 className="mt-3 text-2xl font-bold text-slate-900">
                                Alur kolaborasi SATU
                            </h2>
                            <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                                <table className="min-w-full text-left text-sm">
                                    <caption className="sr-only">
                                        Tabel alur kolaborasi synthetic SATU
                                    </caption>
                                    <thead className="bg-slate-100 text-slate-900">
                                        <tr>
                                            <th
                                                scope="col"
                                                className="px-4 py-3 font-semibold"
                                            >
                                                Tahap
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-4 py-3 font-semibold"
                                            >
                                                Arti
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-4 py-3 font-semibold"
                                            >
                                                Kelanjutan
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 text-slate-600">
                                        {LANDING_STAGES.map((stage) => (
                                            <tr key={stage.key}>
                                                <th
                                                    scope="row"
                                                    className="px-4 py-3 font-semibold text-slate-900"
                                                >
                                                    {stage.label}
                                                </th>
                                                <td className="px-4 py-3">
                                                    {stage.shortDescription}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {stage.outcome}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                </noscript>

                {/* ============================================ */}
                {/* Footer                                        */}
                {/* ============================================ */}
                <footer className="landing-section-surface landing-section-surface--footer border-t border-slate-200/80 py-10 sm:py-12">
                    <div className="mx-auto max-w-[110rem] px-5 sm:px-6 lg:px-20">
                        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-3">
                                <AppLogo
                                    compact
                                    className="text-slate-800"
                                    ruleClassName="bg-blue-600"
                                />
                            </div>
                            <div className="flex items-center gap-2.5 text-xs font-medium text-slate-400">
                                <div className="flex size-6 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
                                    <LockKeyhole
                                        aria-hidden="true"
                                        className="size-3"
                                    />
                                </div>
                                <span>
                                    Data portofolio dibagikan secara eksplisit.
                                </span>
                            </div>
                        </div>
                        <div className="mt-8 border-t border-slate-200/60 pt-6">
                            <p className="font-label text-[0.68rem] tracking-wider text-slate-400">
                                &copy; {new Date().getFullYear()} SATU Platform.
                                Semua hak cipta dilindungi.
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
