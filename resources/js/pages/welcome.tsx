import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowRight,
    BadgeCheck,
    EyeOff,
    FileCheck2,
    Landmark,
    Layers3,
    LockKeyhole,
    Network,
    Search,
    ShieldCheck,
    Target,
    UsersRound,
} from 'lucide-react';
import type { KeyboardEvent, ReactNode } from 'react';
import React, { Suspense, lazy, useState, useSyncExternalStore } from 'react';
import AppLogo from '@/components/app-logo';
import LandingFlowLedger, {
    LANDING_STAGES,
} from '@/components/LandingFlowLedger';
import Mascot from '@/components/mascot';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { dashboard, login, register } from '@/routes';

const landingTheme = {
    '--landing-canvas': '#F3F9FF',
    '--landing-surface': '#FFFFFF',
    '--landing-ink': '#17345A',
    '--landing-muted': '#526B85',
    '--landing-border': '#D9E8F5',
    '--landing-blue': '#1764E8',
    '--landing-blue-strong': '#1454C4',
    '--landing-blue-soft': '#E7F2FF',
    '--landing-lilac': '#706FE5',
    '--landing-lilac-soft': '#EFEEFF',
    '--landing-mint': '#16845B',
    '--landing-mint-soft': '#EAF8F1',
    '--landing-coral': '#C65D45',
    '--landing-coral-soft': '#FFF0EC',
    '--landing-yellow': '#B46D00',
    '--landing-yellow-soft': '#FFF5D9',
} as React.CSSProperties;

const audienceTabs = [
    { key: 'student', label: 'Mahasiswa', icon: UsersRound },
    { key: 'campus', label: 'Operator kampus', icon: Landmark },
    { key: 'recruiter', label: 'Perekrut', icon: Search },
] as const;

type AudienceKey = (typeof audienceTabs)[number]['key'];

const audienceDetails: Record<
    AudienceKey,
    {
        eyebrow: string;
        title: string;
        description: string;
        boundaries: string[];
        action: string;
        href: string;
        icon: typeof UsersRound;
    }
> = {
    student: {
        eyebrow: 'Ruang mahasiswa',
        title: 'Bangun karya bersama, simpan konteksnya.',
        description:
            'Temukan peluang kolaborasi, bentuk tim, dan catat kontribusi. Kontribusi yang disetujui dapat masuk portofolio yang visibilitasnya kamu atur.',
        boundaries: [
            'Registrasi terbuka membuat akun mahasiswa.',
            'Kamu menentukan entry portofolio yang dapat dilihat perekrut.',
        ],
        action: 'Buat akun mahasiswa',
        href: 'register',
        icon: UsersRound,
    },
    campus: {
        eyebrow: 'Ruang operasi kampus',
        title: 'Jaga alur afiliasi dan validasi tetap terbaca.',
        description:
            'Operator kampus menggunakan ruang kerja terpisah untuk meninjau afiliasi dan validasi kontribusi sesuai kewenangannya.',
        boundaries: [
            'Akses operator diberikan melalui alur terkontrol.',
            'Keputusan validasi memiliki status dan riwayat yang dapat ditinjau.',
        ],
        action: 'Pelajari batas akses',
        href: '#privasi',
        icon: Landmark,
    },
    recruiter: {
        eyebrow: 'Talent Portal',
        title: 'Baca bukti kerja yang memang dibagikan.',
        description:
            'Perekrut melihat proyeksi portofolio yang secara eksplisit diizinkan mahasiswa. Organisasi dan hak aksesnya melewati verifikasi SATU.',
        boundaries: [
            'Profil privat dan percakapan tim tidak masuk proyeksi.',
            'Sinyal peluang kolaborasi hanya tersedia untuk reviewer kampus berwenang.',
        ],
        action: 'Lihat batas proyeksi',
        href: '#privasi',
        icon: Search,
    },
};

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
                    <Skeleton className="h-8 w-40 bg-[#E7F2FF]" />
                    <Skeleton className="h-9 w-28 bg-[#E7F2FF]" />
                </div>
                <Skeleton className="h-[320px] w-full rounded-2xl bg-[#E7F2FF] lg:h-[420px]" />
            </div>
            <div className="space-y-4">
                <Skeleton className="h-8 w-32 bg-[#E7F2FF]" />
                <Skeleton className="h-16 w-full rounded-xl bg-[#E7F2FF]" />
                <Skeleton className="h-16 w-full rounded-xl bg-[#E7F2FF]" />
            </div>
            <span className="sr-only">Menyiapkan demo kolaborasi.</span>
        </div>
    );
}

function TrustNote({
    icon: Icon,
    children,
}: {
    icon: typeof ShieldCheck;
    children: ReactNode;
}) {
    return (
        <div className="flex items-center gap-2.5 text-sm font-semibold text-[#345574]">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#D9E8F5] bg-white text-[#1764E8] shadow-[0_3px_10px_rgba(23,52,90,0.05)]">
                <Icon aria-hidden="true" className="size-4" />
            </span>
            <span>{children}</span>
        </div>
    );
}

function moveAudienceTab(
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
    setActiveAudience: (audience: AudienceKey) => void,
) {
    let nextIndex = currentIndex;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        nextIndex = (currentIndex + 1) % audienceTabs.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        nextIndex =
            (currentIndex - 1 + audienceTabs.length) % audienceTabs.length;
    } else if (event.key === 'Home') {
        nextIndex = 0;
    } else if (event.key === 'End') {
        nextIndex = audienceTabs.length - 1;
    } else {
        return;
    }

    event.preventDefault();
    setActiveAudience(audienceTabs[nextIndex].key);
    event.currentTarget
        .closest('[role="tablist"]')
        ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
        .item(nextIndex)
        ?.focus();
}

export default function Welcome() {
    const { auth } = usePage().props;
    const isHydrated = useIsHydrated();
    const [activeAudience, setActiveAudience] =
        useState<AudienceKey>('student');
    const audience = audienceDetails[activeAudience];
    const AudienceIcon = audience.icon;

    return (
        <>
            <Head title="SATU | Kolaborasi dan portofolio mahasiswa" />
            <div
                id="top"
                data-landing-surface
                className="min-h-screen overflow-x-clip bg-[#F3F9FF] text-[#17345A] selection:bg-[#B9D9FF]"
                style={{ ...landingTheme, colorScheme: 'light' }}
            >
                <a
                    href="#main"
                    className="sr-only z-[100] rounded-lg bg-white px-4 py-3 text-[#17345A] focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1746B0]"
                >
                    Langsung ke konten utama
                </a>

                <header className="sticky top-0 z-50 border-b border-[#D9E8F5]/80 bg-white/90 backdrop-blur-xl">
                    <div className="mx-auto flex min-h-[4.5rem] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                        <a
                            href="#top"
                            aria-label="SATU, kembali ke awal halaman"
                            className="shrink-0 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1746B0]"
                        >
                            <AppLogo
                                compact
                                className="text-[#17345A]"
                                ruleClassName="bg-[#1764E8]"
                            />
                        </a>

                        <nav
                            aria-label="Navigasi landing"
                            className="hidden items-center gap-1 lg:flex"
                        >
                            {[
                                { href: '#cara-kerja', label: 'Cara kerja' },
                                { href: '#demo', label: 'Demo interaktif' },
                                { href: '#peran', label: 'Untuk siapa' },
                                { href: '#privasi', label: 'Privasi' },
                            ].map((item) => (
                                <a
                                    key={item.href}
                                    href={item.href}
                                    className="rounded-lg px-3.5 py-2 text-sm font-semibold text-[#526B85] transition-colors duration-150 hover:bg-[#E7F2FF] hover:text-[#1454C4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1746B0] motion-reduce:transition-none"
                                >
                                    {item.label}
                                </a>
                            ))}
                        </nav>

                        <div className="flex shrink-0 items-center gap-3">
                            {auth.user ? (
                                <Button
                                    asChild
                                    className="rounded-xl bg-[#1764E8] px-4 font-semibold text-white shadow-[0_5px_14px_rgba(23,100,232,0.18)] hover:bg-[#1454C4]"
                                >
                                    <Link href={dashboard()} prefetch>
                                        Buka dashboard
                                        <ArrowRight
                                            aria-hidden="true"
                                            className="ml-1 size-4"
                                        />
                                    </Link>
                                </Button>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-[#526B85] hover:text-[#1454C4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1746B0] sm:inline-flex"
                                    >
                                        Masuk
                                    </Link>
                                    <Button
                                        asChild
                                        className="rounded-xl bg-[#1764E8] px-4 font-semibold text-white shadow-[0_5px_14px_rgba(23,100,232,0.18)] hover:bg-[#1454C4]"
                                    >
                                        <Link href={register()} prefetch>
                                            Daftar mahasiswa
                                            <ArrowRight
                                                aria-hidden="true"
                                                className="ml-1 size-4"
                                            />
                                        </Link>
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                <main id="main">
                    <section
                        aria-labelledby="landing-heading"
                        className="px-3 pt-5 pb-16 sm:px-6 sm:pt-8 lg:px-8 lg:pt-10 lg:pb-24"
                    >
                        <div className="relative mx-auto grid min-h-[36rem] max-w-7xl overflow-visible rounded-[2rem] border border-[#D9E8F5] bg-[radial-gradient(ellipse_at_78%_8%,rgba(168,217,255,0.56),transparent_36%),linear-gradient(130deg,#FFFFFF_0%,#F7FBFF_42%,#E3F3FF_100%)] px-5 pt-8 pb-0 shadow-[0_20px_60px_rgba(48,105,151,0.09)] sm:px-9 sm:pt-10 lg:min-h-[40rem] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:px-12 lg:py-10">
                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]"
                            >
                                <span className="absolute -top-24 right-[14%] size-72 rounded-full bg-white/70 blur-3xl" />
                                <span className="absolute right-[26%] bottom-8 size-52 rounded-full bg-[#B8E8F3]/55 blur-3xl" />
                                <span className="absolute right-8 bottom-0 h-20 w-72 rounded-t-full bg-[#D6F1E7]/80 blur-2xl" />
                            </div>

                            <div className="relative z-20 max-w-2xl pb-3 lg:pb-8">
                                <div className="inline-flex items-center gap-2 rounded-full border border-[#C5DFF4] bg-white/80 px-3.5 py-1.5 text-xs font-bold tracking-[0.06em] text-[#1764B3] shadow-[0_3px_10px_rgba(23,52,90,0.04)]">
                                    <Layers3
                                        aria-hidden="true"
                                        className="size-3.5"
                                    />
                                    PELUANG SAMPAI PORTOFOLIO
                                </div>
                                <h1
                                    id="landing-heading"
                                    className="mt-6 max-w-[13ch] text-[clamp(2.65rem,6.1vw,5rem)] leading-[0.99] font-bold tracking-[-0.045em] text-[#17345A]"
                                >
                                    Temukan teman berkarya.{' '}
                                    <span className="text-[#1764E8]">
                                        Tunjukkan kontribusimu.
                                    </span>
                                </h1>
                                <p className="mt-6 max-w-[37rem] text-base leading-7 text-[#526B85] sm:text-lg sm:leading-8">
                                    SATU membantu mahasiswa menemukan peluang,
                                    bekerja dalam tim, dan mencatat kontribusi.
                                    Kontribusi yang disetujui dapat masuk
                                    portofolio dengan visibilitas yang kamu
                                    kendalikan.
                                </p>

                                <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                                    <Button
                                        asChild
                                        size="lg"
                                        className="group h-12 rounded-xl bg-[#1764E8] px-6 font-bold text-white shadow-[0_8px_18px_rgba(23,100,232,0.2)] transition-[background-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-[#1454C4] hover:shadow-[0_12px_24px_rgba(23,100,232,0.23)] motion-reduce:transition-none"
                                    >
                                        <Link
                                            href={
                                                auth.user
                                                    ? dashboard()
                                                    : register()
                                            }
                                            prefetch
                                        >
                                            {auth.user
                                                ? 'Lanjutkan ke dashboard'
                                                : 'Mulai sebagai mahasiswa'}
                                            <ArrowRight
                                                aria-hidden="true"
                                                className="ml-1 size-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none"
                                            />
                                        </Link>
                                    </Button>
                                    <a
                                        href="#cara-kerja"
                                        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#BFD7EC] bg-white/80 px-5 text-sm font-bold text-[#345574] transition-[background-color,border-color,transform] duration-150 hover:-translate-y-0.5 hover:border-[#8BB9E1] hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1746B0] motion-reduce:transition-none"
                                    >
                                        Lihat cara kerja
                                        <ArrowDown
                                            aria-hidden="true"
                                            className="size-4"
                                        />
                                    </a>
                                </div>

                                <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
                                    <TrustNote icon={ShieldCheck}>
                                        Validasi memiliki konteks
                                    </TrustNote>
                                    <TrustNote icon={LockKeyhole}>
                                        Visibilitas dapat diatur
                                    </TrustNote>
                                    <TrustNote icon={FileCheck2}>
                                        Kontribusi tercatat
                                    </TrustNote>
                                </div>
                            </div>

                            <div
                                className="relative z-10 -mx-3 mt-1 min-h-[17rem] sm:min-h-[23rem] lg:mx-0 lg:mt-0 lg:min-h-[34rem]"
                                data-testid="landing-hero-illustration"
                            >
                                <div
                                    aria-hidden="true"
                                    className="absolute right-[7%] bottom-[8%] h-[65%] w-[78%] rounded-full bg-[#A9DFF0]/45 blur-2xl"
                                />
                                <Mascot
                                    pose="welcome"
                                    interactive
                                    priority
                                    className="absolute -right-2 bottom-[-1.5rem] z-10 w-[18rem] max-w-none sm:right-0 sm:bottom-[-2.5rem] sm:w-[25rem] lg:-right-8 lg:bottom-[-3.5rem] lg:w-[32rem]"
                                />
                                <div className="absolute top-3 left-1 z-20 inline-flex items-center gap-2 rounded-2xl border border-white/80 bg-white/90 px-3 py-2.5 text-xs font-bold text-[#345574] shadow-[0_8px_24px_rgba(23,52,90,0.12)] sm:top-8 sm:left-3 sm:px-4 sm:py-3">
                                    <span className="flex size-8 items-center justify-center rounded-xl bg-[#E7F2FF] text-[#1764E8]">
                                        <BadgeCheck
                                            aria-hidden="true"
                                            className="size-4"
                                        />
                                    </span>
                                    <span>
                                        <span className="block text-[0.65rem] font-semibold text-[#66809A]">
                                            KONTRIBUSI
                                        </span>
                                        Memiliki konteks
                                    </span>
                                </div>
                                <div className="absolute bottom-4 left-1 z-20 inline-flex items-center gap-2 rounded-2xl border border-white/80 bg-white/90 px-3 py-2.5 text-xs font-bold text-[#345574] shadow-[0_8px_24px_rgba(23,52,90,0.12)] sm:bottom-9 sm:left-0 sm:px-4 sm:py-3 lg:left-[-1.5rem]">
                                    <span className="flex size-8 items-center justify-center rounded-xl bg-[#EAF8F1] text-[#16845B]">
                                        <EyeOff
                                            aria-hidden="true"
                                            className="size-4"
                                        />
                                    </span>
                                    <span>
                                        <span className="block text-[0.65rem] font-semibold text-[#66809A]">
                                            PORTOFOLIO
                                        </span>
                                        Visibilitas di tanganmu
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section
                        id="cara-kerja"
                        aria-labelledby="lifecycle-heading"
                        className="scroll-mt-24 bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
                    >
                        <div className="mx-auto max-w-7xl">
                            <div className="grid gap-6 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-end lg:gap-12">
                                <div>
                                    <p className="inline-flex items-center gap-2 rounded-full bg-[#E7F2FF] px-3.5 py-1.5 text-xs font-bold tracking-[0.06em] text-[#1764B3]">
                                        <Layers3
                                            aria-hidden="true"
                                            className="size-3.5"
                                        />
                                        CARA KERJA
                                    </p>
                                    <h2
                                        id="lifecycle-heading"
                                        className="mt-5 max-w-[17ch] text-[clamp(2rem,4vw,3.2rem)] leading-[1.05] font-bold tracking-[-0.035em] text-[#17345A]"
                                    >
                                        Dari peluang sampai bukti kontribusi.
                                    </h2>
                                </div>
                                <p className="max-w-2xl text-base leading-7 text-[#526B85] sm:text-lg sm:leading-8">
                                    Ikuti lima tahap yang saling terhubung.
                                    Pilih satu tahap untuk melihat apa yang
                                    terjadi, dari menemukan proyek sampai
                                    mengatur visibilitas portofolio.
                                </p>
                            </div>

                            <div className="mt-10 grid gap-8 xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-start xl:gap-12">
                                <LandingFlowLedger className="min-w-0" />
                                <aside className="rounded-2xl border border-[#D9E8F5] bg-[#F4F9FF] p-5 sm:p-6 xl:mt-5">
                                    <div className="flex size-11 items-center justify-center rounded-xl bg-white text-[#1764E8] shadow-[0_3px_12px_rgba(23,52,90,0.06)]">
                                        <Target
                                            aria-hidden="true"
                                            className="size-5"
                                        />
                                    </div>
                                    <h3 className="mt-4 text-lg font-bold tracking-tight text-[#17345A]">
                                        Setiap tahap punya sumber.
                                    </h3>
                                    <p className="mt-2 text-sm leading-6 text-[#526B85]">
                                        Catatan menunjukkan asal informasi dan
                                        kelanjutan proses. Pilih tahap untuk
                                        melihat contohnya.
                                    </p>
                                    <a
                                        href="#demo"
                                        className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-bold text-[#1764B3] hover:text-[#1454C4] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1746B0]"
                                    >
                                        Lihat demo kolaborasi
                                        <ArrowRight
                                            aria-hidden="true"
                                            className="size-4"
                                        />
                                    </a>
                                </aside>
                            </div>
                        </div>
                    </section>

                    <section
                        id="demo"
                        aria-labelledby="demo-heading"
                        className="scroll-mt-24 bg-[#EAF5FF] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
                    >
                        <div className="mx-auto max-w-7xl">
                            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                                <div className="max-w-3xl">
                                    <p className="inline-flex items-center gap-2 rounded-full border border-[#C7DFF3] bg-white/80 px-3.5 py-1.5 text-xs font-bold tracking-[0.06em] text-[#1764B3]">
                                        <Network
                                            aria-hidden="true"
                                            className="size-3.5"
                                        />
                                        DEMO INTERAKTIF
                                    </p>
                                    <h2
                                        id="demo-heading"
                                        className="mt-5 max-w-[20ch] text-[clamp(2rem,4vw,3.2rem)] leading-[1.05] font-bold tracking-[-0.035em] text-[#17345A]"
                                    >
                                        Lihat bagaimana satu kontribusi
                                        terhubung.
                                    </h2>
                                </div>
                                <p className="max-w-md rounded-2xl border border-[#C7DFF3] bg-white/80 px-4 py-3 text-sm leading-6 text-[#526B85]">
                                    Semua record dalam graf dan tabel ini adalah
                                    data synthetic. Demo dapat direset.
                                </p>
                            </div>
                            <p className="mt-5 max-w-2xl text-base leading-7 text-[#526B85]">
                                Pilih node atau baris tabel untuk menyorot
                                hubungan. Filter dan tabel memberi cara baca
                                yang setara untuk keyboard dan pembaca layar.
                            </p>

                            <div className="mt-8 overflow-hidden rounded-[1.75rem] border border-[#D3E4F2] bg-white p-2 shadow-[0_14px_40px_rgba(48,105,151,0.08)] sm:p-3">
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

                    <section
                        id="peran"
                        aria-labelledby="roles-heading"
                        className="scroll-mt-24 bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
                    >
                        <div className="mx-auto max-w-7xl">
                            <div className="max-w-3xl">
                                <p className="inline-flex items-center gap-2 rounded-full bg-[#E7F2FF] px-3.5 py-1.5 text-xs font-bold tracking-[0.06em] text-[#1764B3]">
                                    <UsersRound
                                        aria-hidden="true"
                                        className="size-3.5"
                                    />
                                    UNTUK SIAPA
                                </p>
                                <h2
                                    id="roles-heading"
                                    className="mt-5 max-w-[19ch] text-[clamp(2rem,4vw,3.2rem)] leading-[1.05] font-bold tracking-[-0.035em] text-[#17345A]"
                                >
                                    Satu ruang kolaborasi, hak akses yang jelas.
                                </h2>
                                <p className="mt-5 max-w-2xl text-base leading-7 text-[#526B85] sm:text-lg">
                                    Pilih peran untuk melihat tujuan dan
                                    batasnya. Akses mengikuti kewenangan dan
                                    izin yang diberikan.
                                </p>
                            </div>

                            <div className="mt-9 grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8">
                                <div
                                    role="tablist"
                                    aria-label="Pilih peran di SATU"
                                    aria-orientation="vertical"
                                    className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0"
                                >
                                    {audienceTabs.map((tab, index) => {
                                        const TabIcon = tab.icon;
                                        const isActive =
                                            activeAudience === tab.key;

                                        return (
                                            <button
                                                key={tab.key}
                                                id={`role-tab-${tab.key}`}
                                                type="button"
                                                role="tab"
                                                aria-selected={isActive}
                                                aria-controls="role-panel"
                                                tabIndex={isActive ? 0 : -1}
                                                onClick={() =>
                                                    setActiveAudience(tab.key)
                                                }
                                                onKeyDown={(event) =>
                                                    moveAudienceTab(
                                                        event,
                                                        index,
                                                        setActiveAudience,
                                                    )
                                                }
                                                className={`inline-flex min-h-12 shrink-0 items-center gap-3 rounded-xl border px-4 text-left text-sm font-bold transition-[background-color,border-color,color,transform] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1746B0] motion-reduce:transition-none lg:w-full ${
                                                    isActive
                                                        ? 'border-[#B9D8F2] bg-[#EAF5FF] text-[#1454C4] shadow-[0_4px_14px_rgba(23,52,90,0.06)]'
                                                        : 'border-transparent bg-white text-[#526B85] hover:border-[#D9E8F5] hover:bg-[#F6FAFE]'
                                                }`}
                                            >
                                                <span
                                                    className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${isActive ? 'bg-white text-[#1764E8]' : 'bg-[#F1F6FB] text-[#66809A]'}`}
                                                >
                                                    <TabIcon
                                                        aria-hidden="true"
                                                        className="size-4"
                                                    />
                                                </span>
                                                {tab.label}
                                            </button>
                                        );
                                    })}
                                </div>

                                <section
                                    id="role-panel"
                                    role="tabpanel"
                                    aria-labelledby={`role-tab-${activeAudience}`}
                                    tabIndex={0}
                                    className="relative min-h-[20rem] overflow-hidden rounded-[1.75rem] border border-[#D9E8F5] bg-[radial-gradient(ellipse_at_100%_0%,rgba(186,224,255,0.45),transparent_45%),#F8FBFF] p-6 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1746B0] sm:p-9"
                                >
                                    <div className="relative z-10 max-w-3xl">
                                        <p className="text-xs font-bold tracking-[0.08em] text-[#1764B3]">
                                            {audience.eyebrow.toUpperCase()}
                                        </p>
                                        <div className="mt-4 flex items-start gap-4">
                                            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#1764E8] shadow-[0_4px_16px_rgba(23,52,90,0.07)]">
                                                <AudienceIcon
                                                    aria-hidden="true"
                                                    className="size-5"
                                                />
                                            </span>
                                            <div>
                                                <h3 className="text-2xl leading-tight font-bold tracking-[-0.025em] text-[#17345A] sm:text-3xl">
                                                    {audience.title}
                                                </h3>
                                                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#526B85] sm:text-base sm:leading-7">
                                                    {audience.description}
                                                </p>
                                            </div>
                                        </div>
                                        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                                            {audience.boundaries.map(
                                                (boundary) => (
                                                    <li
                                                        key={boundary}
                                                        className="flex items-start gap-2.5 rounded-xl border border-[#D9E8F5] bg-white/85 p-3.5 text-sm leading-5 text-[#345574]"
                                                    >
                                                        <BadgeCheck
                                                            aria-hidden="true"
                                                            className="mt-0.5 size-4 shrink-0 text-[#1764B3]"
                                                        />
                                                        <span>{boundary}</span>
                                                    </li>
                                                ),
                                            )}
                                        </ul>
                                        {activeAudience === 'student' ? (
                                            <Link
                                                href={register()}
                                                prefetch
                                                className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-bold text-[#1764B3] hover:text-[#1454C4] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1746B0]"
                                            >
                                                {audience.action}
                                                <ArrowRight
                                                    aria-hidden="true"
                                                    className="size-4"
                                                />
                                            </Link>
                                        ) : (
                                            <a
                                                href={audience.href}
                                                className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-bold text-[#1764B3] hover:text-[#1454C4] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1746B0]"
                                            >
                                                {audience.action}
                                                <ArrowRight
                                                    aria-hidden="true"
                                                    className="size-4"
                                                />
                                            </a>
                                        )}
                                    </div>
                                    <span
                                        aria-hidden="true"
                                        className="pointer-events-none absolute -right-10 -bottom-20 size-56 rounded-full border-[28px] border-white/55"
                                    />
                                </section>
                            </div>
                        </div>
                    </section>

                    <section
                        id="privasi"
                        aria-labelledby="privacy-heading"
                        className="scroll-mt-24 bg-[#F3F9FF] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
                    >
                        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center lg:gap-14">
                            <div>
                                <p className="inline-flex items-center gap-2 rounded-full border border-[#D9E8F5] bg-white px-3.5 py-1.5 text-xs font-bold tracking-[0.06em] text-[#1764B3]">
                                    <LockKeyhole
                                        aria-hidden="true"
                                        className="size-3.5"
                                    />
                                    PRIVASI TERLIHAT
                                </p>
                                <h2
                                    id="privacy-heading"
                                    className="mt-5 max-w-[16ch] text-[clamp(2rem,4vw,3rem)] leading-[1.06] font-bold tracking-[-0.035em] text-[#17345A]"
                                >
                                    Bukti yang dibagikan tetap dalam kendalimu.
                                </h2>
                                <p className="mt-5 max-w-xl text-base leading-7 text-[#526B85]">
                                    Perekrut hanya menerima proyeksi portofolio
                                    yang secara eksplisit diizinkan mahasiswa.
                                    Detail privat dan sinyal untuk review kampus
                                    tetap dibatasi sesuai kewenangan.
                                </p>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <article className="rounded-2xl border border-[#CDE8D9] bg-white p-5 shadow-[0_5px_18px_rgba(23,52,90,0.045)] sm:p-6">
                                    <span className="flex size-11 items-center justify-center rounded-xl bg-[#EAF8F1] text-[#18734F]">
                                        <ShieldCheck
                                            aria-hidden="true"
                                            className="size-5"
                                        />
                                    </span>
                                    <h3 className="mt-4 text-base font-bold text-[#17345A]">
                                        Dapat diproyeksikan
                                    </h3>
                                    <p className="mt-2 text-sm leading-6 text-[#526B85]">
                                        Entry portofolio dan kontribusi yang
                                        disetujui serta dipilih mahasiswa.
                                    </p>
                                </article>
                                <article className="rounded-2xl border border-[#D9E8F5] bg-white p-5 shadow-[0_5px_18px_rgba(23,52,90,0.045)] sm:p-6">
                                    <span className="flex size-11 items-center justify-center rounded-xl bg-[#EEF3F8] text-[#526B85]">
                                        <EyeOff
                                            aria-hidden="true"
                                            className="size-5"
                                        />
                                    </span>
                                    <h3 className="mt-4 text-base font-bold text-[#17345A]">
                                        Tetap privat
                                    </h3>
                                    <p className="mt-2 text-sm leading-6 text-[#526B85]">
                                        Username, nomor WhatsApp, diskusi tim,
                                        dan audit mentah.
                                    </p>
                                </article>
                            </div>
                        </div>
                        <p className="mx-auto mt-8 flex max-w-7xl items-start gap-2.5 text-sm leading-6 text-[#526B85]">
                            <FileCheck2
                                aria-hidden="true"
                                className="mt-1 size-4 shrink-0 text-[#1764B3]"
                            />
                            Contoh pada demo diberi label data synthetic dan
                            bukan klaim pelanggan, harga, hasil pilot, atau
                            dampak.
                        </p>
                    </section>

                    <section className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
                        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-[#C8DFF2] bg-[radial-gradient(ellipse_at_90%_0%,rgba(171,221,255,0.5),transparent_44%),linear-gradient(120deg,#FFFFFF,#EAF5FF)] px-5 py-10 sm:px-9 sm:py-14 lg:px-14">
                            <div className="relative z-10 max-w-2xl">
                                <p className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3.5 py-1.5 text-xs font-bold tracking-[0.06em] text-[#1764B3]">
                                    <UsersRound
                                        aria-hidden="true"
                                        className="size-3.5"
                                    />
                                    MULAI DARI SINI
                                </p>
                                <h2 className="mt-5 max-w-[18ch] text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.03] font-bold tracking-[-0.04em] text-[#17345A]">
                                    Satu peluang bisa membuka ruang berkarya.
                                </h2>
                                <p className="mt-4 max-w-xl text-base leading-7 text-[#526B85]">
                                    Buat akun mahasiswa untuk melihat peluang
                                    kolaborasi dan mulai melengkapi profilmu.
                                </p>
                                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                                    <Button
                                        asChild
                                        size="lg"
                                        className="group h-12 rounded-xl bg-[#1764E8] px-6 font-bold text-white shadow-[0_8px_18px_rgba(23,100,232,0.2)] hover:bg-[#1454C4]"
                                    >
                                        <Link
                                            href={
                                                auth.user
                                                    ? dashboard()
                                                    : register()
                                            }
                                            prefetch
                                        >
                                            {auth.user
                                                ? 'Buka dashboard'
                                                : 'Daftar mahasiswa'}
                                            <ArrowRight
                                                aria-hidden="true"
                                                className="ml-1 size-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none"
                                            />
                                        </Link>
                                    </Button>
                                    <a
                                        href="#cara-kerja"
                                        className="inline-flex h-12 items-center justify-center rounded-xl border border-[#BFD7EC] bg-white px-5 text-sm font-bold text-[#345574] hover:bg-[#F7FBFF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1746B0]"
                                    >
                                        Pelajari alurnya
                                    </a>
                                </div>
                            </div>
                            <div className="pointer-events-none absolute -right-8 -bottom-10 hidden h-72 w-80 lg:block">
                                <Mascot
                                    pose="guide"
                                    className="absolute right-0 bottom-[-2rem] w-[20rem] max-w-none"
                                />
                            </div>
                        </div>
                    </section>
                </main>

                <noscript>
                    <section className="border-t border-[#D9E8F5] bg-white px-5 py-10 sm:px-6">
                        <div className="mx-auto max-w-7xl">
                            <p className="text-xs font-bold tracking-[0.08em] text-[#1764B3]">
                                DATA SYNTHETIC
                            </p>
                            <h2 className="mt-3 text-2xl font-bold text-[#17345A]">
                                Alur kolaborasi SATU
                            </h2>
                            <div className="mt-5 overflow-x-auto rounded-2xl border border-[#D9E8F5] bg-white">
                                <table className="min-w-full text-left text-sm">
                                    <caption className="sr-only">
                                        Tabel alur kolaborasi synthetic SATU
                                    </caption>
                                    <thead className="bg-[#E7F2FF] text-[#17345A]">
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
                                    <tbody className="divide-y divide-[#D9E8F5] text-[#526B85]">
                                        {LANDING_STAGES.map((stage) => (
                                            <tr key={stage.key}>
                                                <th
                                                    scope="row"
                                                    className="px-4 py-3 font-semibold text-[#17345A]"
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

                <footer className="border-t border-[#D9E8F5] bg-white px-4 py-9 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-7xl">
                        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                            <AppLogo
                                compact
                                className="text-[#17345A]"
                                ruleClassName="bg-[#1764E8]"
                            />
                            <div className="flex items-center gap-2.5 text-sm font-medium text-[#526B85]">
                                <span className="flex size-8 items-center justify-center rounded-lg bg-[#E7F2FF] text-[#1764B3]">
                                    <LockKeyhole
                                        aria-hidden="true"
                                        className="size-4"
                                    />
                                </span>
                                Portofolio dibagikan dengan izin mahasiswa.
                            </div>
                        </div>
                        <div className="mt-7 border-t border-[#E5EEF6] pt-5">
                            <p className="text-xs font-medium text-[#66809A]">
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
