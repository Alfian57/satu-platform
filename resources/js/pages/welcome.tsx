import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowRight,
    Award,
    BadgeCheck,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    EyeOff,
    FileCheck2,
    FileText,
    HelpCircle,
    Info,
    Landmark,
    Layers,
    LockKeyhole,
    Network,
    Scale,
    ShieldCheck,
    Sparkles,
    Users,
    UsersRound,
    Zap,
} from 'lucide-react';
import React, { Suspense, lazy, useState, useSyncExternalStore } from 'react';
import AppLogo from '@/components/app-logo';
import LandingFlowLedger, {
    LANDING_STAGES,
} from '@/components/LandingFlowLedger';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { dashboard, login, register } from '@/routes';

/**
 * SATU Landing Page: Buku Besar Kolaborasi Redesign
 * Mode: Persuade
 * Editorial, tactile, and institutional web craft.
 */

const roleRows = [
    {
        key: 'student',
        label: 'Mahasiswa',
        tagline: 'Mulai Kolaborasi & Kendalikan Portofolio',
        icon: UsersRound,
        badge: 'Untuk Talenta Kampus',
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        description:
            'Temukan peluang proyek lintas prodi, bentuk tim tanpa circle internal, dan susun kontribusi nyata menjadi portofolio terverifikasi.',
        features: [
            'Rekomendasi tim transparan 4 dimensi',
            'Pencatatan bukti deliverable tugas & commit',
            'Kendali penuh atas visibilitas portofolio',
        ],
        cta: 'Daftar sebagai mahasiswa',
        href: 'register',
    },
    {
        key: 'campus',
        label: 'Operator Kampus',
        tagline: 'Afiliasi & Validasi Terstruktur',
        icon: Landmark,
        badge: 'Operasi Akademik',
        badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        description:
            'Kelola afiliasi mahasiswa berbasis NIM, validasi kontribusi proyek, dan simpan riwayat keputusan akademik dalam ledger yang dapat ditinjau.',
        features: [
            'Verifikasi otomatis via NIM & WhatsApp',
            'Tinjauan kontribusi oleh dosen / reviewer',
            'Rekam jejak keputusan append-only',
        ],
        cta: 'Lihat batas operasi',
        href: '#privasi',
    },
    {
        key: 'recruiter',
        label: 'Perekrut & Mitra',
        tagline: 'Portofolio Terverifikasi & Privasi Terjaga',
        icon: FileCheck2,
        badge: 'Talent Portal',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        description:
            'Temukan talenta muda berdasarkan proyeksi portofolio yang disetujui mahasiswa, lengkap dengan stempel verifikasi resmi kampus.',
        features: [
            'Portofolio tervalidasi dosen pembimbing',
            'Bukti kerja nyata (bukan resume tanpa konteks)',
            'Bebas intrusi terhadap data privat mahasiswa',
        ],
        cta: 'Lihat batas portofolio',
        href: '#privasi',
    },
] as const;

const faqItems = [
    {
        question: 'Bagaimana kontribusi mahasiswa divalidasi oleh kampus?',
        answer: 'Setelah tugas atau proyek selesai, mahasiswa mengunggah tautan bukti kerja (seperti Pull Request Git, prototipe Figma, atau laporan teknis). Reviewer kampus atau dosen pembimbing akan meninjau bukti tersebut dan menyematkan stempel validasi resmi yang tercatat secara permanen di ledger SATU.',
    },
    {
        question:
            'Apakah perekrut dapat melihat nomor WhatsApp atau percakapan tim saya?',
        answer: 'Tidak sama sekali. SATU menerapkan prinsip zero-leakage: nomor telepon WhatsApp, username autentikasi, percakapan internal tim, dan log audit mentah disimpan secara privat dan tidak pernah diekspos ke publik atau akun perekrut.',
    },
    {
        question:
            'Bagaimana mahasiswa baru dapat menemukan tim tanpa perlu memiliki circle?',
        answer: 'SATU menyediakan sistem pencocokan kolaborasi transparan berbasis 4 dimensi: kecocokan skill (skill fit), kebutuhan peran proyek, ketersediaan jam kerja, dan peluang konektivitas baru. Mahasiswa dapat langsung mendaftar ke peluang yang terbuka tanpa harus saling mengenal sebelumnya.',
    },
    {
        question:
            'Apakah portofolio di SATU bisa digunakan untuk keperluan SKS atau MBKM?',
        answer: 'Bisa. Setiap entri portofolio yang telah diverifikasi oleh dosen pembimbing memuat referensi hash dan tanda tangan peninjau resmi, sehingga dapat dijadikan lampiran bukti nyata untuk konversi SKS, sidang tugas akhir, maupun program MBKM.',
    },
    {
        question:
            'Apakah data yang ditampilkan pada demo di halaman ini nyata?',
        answer: 'Semua record pada demo interaktif halaman ini adalah Data synthetic untuk mendemonstrasikan cara kerja platform, dan tidak mengklaim data pilot, harga, atau hasil yang belum terbukti.',
    },
];

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
            className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)]"
            aria-busy="true"
            role="status"
        >
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                    <Skeleton className="h-8 w-48 bg-slate-200/80" />
                    <Skeleton className="h-8 w-24 bg-slate-200/80" />
                </div>
                <Skeleton className="h-[340px] w-full rounded-2xl bg-slate-200/80 sm:h-[400px]" />
            </div>
            <div className="space-y-4">
                <Skeleton className="h-28 w-full rounded-2xl bg-slate-200/80" />
                <Skeleton className="h-44 w-full rounded-2xl bg-slate-200/80" />
            </div>
            <span className="sr-only">Menyiapkan demo kolaborasi...</span>
        </div>
    );
}

export default function Welcome() {
    const { auth } = usePage().props;
    const isHydrated = useIsHydrated();
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

    const toggleFaq = (index: number) => {
        setOpenFaqIndex((prev) => (prev === index ? null : index));
    };

    return (
        <>
            <Head title="Sistem Aktivitas Talenta Universitas (SATU)" />
            <div
                id="top"
                data-landing-surface
                data-motion-ready="true"
                className="landing-page-canvas min-h-screen bg-[#F7F9FC] text-foreground selection:bg-blue-100 selection:text-primary"
            >
                {/* ============================================ */}
                {/* Sticky Header Navigation                      */}
                {/* ============================================ */}
                <header className="landing-glass landing-glass-border sticky top-0 z-50 w-full shadow-2xs">
                    <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
                        <a
                            href="#top"
                            aria-label="SATU: kembali ke awal halaman"
                            className="group flex items-center gap-2 transition-opacity duration-200 hover:opacity-90 motion-reduce:transition-none"
                        >
                            <AppLogo
                                compact
                                className="text-slate-900"
                                ruleClassName="bg-primary"
                            />
                        </a>

                        <nav
                            aria-label="Navigasi landing"
                            className="hidden items-center gap-1 md:flex"
                        >
                            {[
                                { href: '#cara-kerja', label: 'Cara Kerja' },
                                { href: '#demo', label: 'Demo Synthetic' },
                                { href: '#peran', label: 'Untuk Siapa' },
                                { href: '#privasi', label: 'Batas Privasi' },
                                { href: '#pilar', label: 'Pilar Platform' },
                                { href: '#faq', label: 'Tanya Jawab' },
                            ].map((link) => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    className="rounded-lg px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors duration-200 hover:bg-slate-100 hover:text-primary motion-reduce:transition-none"
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
                                    className="rounded-lg bg-primary font-semibold text-white shadow-2xs hover:bg-primary/90"
                                >
                                    <Link href={dashboard()} prefetch>
                                        Buka dashboard
                                    </Link>
                                </Button>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="text-xs font-semibold text-slate-600 transition-colors duration-200 hover:text-primary sm:inline-flex"
                                    >
                                        Masuk
                                    </Link>
                                    <Button
                                        asChild
                                        size="sm"
                                        className="rounded-lg bg-primary font-semibold text-white shadow-2xs hover:bg-primary/90"
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
                        className="relative isolate border-b border-slate-200/90 bg-gradient-to-b from-white via-[#F7F9FC] to-[#EFF6FF]/40 pt-10 pb-16 sm:pt-16 sm:pb-24"
                    >
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-14">
                                {/* Left: Editorial Hero Content */}
                                <div>
                                    {/* Institutional Kicker Reference */}
                                    <div className="landing-motion-rise flex items-center gap-2">
                                        <span className="rounded-md border border-primary/20 bg-blue-50 px-2.5 py-1 font-label text-[0.68rem] font-bold tracking-wider text-primary">
                                            DOKUMEN PUBLIK // SATU-2026
                                        </span>
                                        <span className="font-label text-xs font-medium text-slate-500">
                                            Buku Besar Kolaborasi Universitas
                                        </span>
                                    </div>

                                    {/* Main Heading */}
                                    <h1
                                        id="landing-heading"
                                        className="landing-motion-rise mt-6 text-[clamp(2.4rem,4.8vw,4rem)] leading-[1.08] font-bold tracking-tight text-slate-950"
                                    >
                                        Kolaborasi Kampus yang Menjadi{' '}
                                        <span className="text-primary underline decoration-blue-300 decoration-wavy underline-offset-8">
                                            Rekam Jejak
                                        </span>{' '}
                                        Terverifikasi.
                                    </h1>

                                    {/* Subtitle */}
                                    <p className="landing-motion-rise mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                                        SATU menghubungkan pembentukan tim
                                        lintas prodi, pencatatan aktivitas kerja
                                        nyata, dan validasi resmi kampus menjadi
                                        portofolio yang dapat dipercaya.
                                        Mahasiswa membangun karya, kampus
                                        memvalidasi, dan perekrut melihat hanya
                                        proyeksi yang diizinkan.
                                    </p>

                                    {/* Primary and Secondary CTA Buttons */}
                                    <div className="landing-motion-rise mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                                        <Button
                                            asChild
                                            size="lg"
                                            className="group h-12 rounded-xl bg-primary px-7 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/95 hover:shadow-md"
                                        >
                                            <Link href={register()} prefetch>
                                                Mulai Daftar Mahasiswa
                                                <ArrowRight
                                                    aria-hidden="true"
                                                    className="ml-2 size-4 transition-transform group-hover:translate-x-1"
                                                />
                                            </Link>
                                        </Button>

                                        <a
                                            href="#cara-kerja"
                                            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 hover:text-primary"
                                        >
                                            Jelajahi Cara Kerja
                                            <ArrowDown
                                                aria-hidden="true"
                                                className="size-4 text-slate-500"
                                            />
                                        </a>
                                    </div>

                                    {/* Mini Footnote */}
                                    <p className="landing-motion-rise mt-4 flex items-center gap-2 text-xs text-slate-500">
                                        <CheckCircle2
                                            aria-hidden="true"
                                            className="size-4 text-emerald-600"
                                        />
                                        <span>
                                            Registrasi terbuka untuk mahasiswa
                                            aktif tanpa biaya.
                                        </span>
                                    </p>
                                </div>

                                {/* Right: Tangible Live Mechanism Preview + Mascot */}
                                <div
                                    className="landing-motion-rise relative"
                                    data-testid="landing-hero-illustration"
                                >
                                    {/* Sample Verified Contribution Mini-Docket */}
                                    <div className="relative overflow-hidden rounded-2xl border border-slate-300/90 bg-white p-5 shadow-lg">
                                        {/* Docket Header */}
                                        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                                            <div className="flex items-center gap-2">
                                                <FileText
                                                    aria-hidden="true"
                                                    className="size-4 text-primary"
                                                />
                                                <span className="font-label text-xs font-bold tracking-wider text-slate-800">
                                                    LEMBAR BUKTI RESMI // CONTOH
                                                </span>
                                            </div>
                                            <span className="landing-stamp">
                                                TERVERIFIKASI
                                            </span>
                                        </div>

                                        {/* Docket Body */}
                                        <div className="mt-4 space-y-3">
                                            <div>
                                                <span className="font-label text-[0.62rem] text-slate-400">
                                                    PROYEK KOLABORASI
                                                </span>
                                                <h4 className="text-sm font-bold text-slate-950">
                                                    Pengembangan Sistem Portal
                                                    Edukasi Terpadu
                                                </h4>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div className="rounded-lg border border-slate-200/70 bg-slate-50 p-2">
                                                    <span className="font-label text-[0.6rem] text-slate-400">
                                                        KONTRIBUTOR
                                                    </span>
                                                    <p className="truncate font-bold text-slate-800">
                                                        Budi Pratama
                                                        (Informatika)
                                                    </p>
                                                    <p className="text-[0.65rem] text-slate-500">
                                                        Lead Frontend Engineer
                                                    </p>
                                                </div>
                                                <div className="rounded-lg border border-slate-200/70 bg-slate-50 p-2">
                                                    <span className="font-label text-[0.6rem] text-slate-400">
                                                        REVIEWER KAMPUS
                                                    </span>
                                                    <p className="truncate font-bold text-slate-800">
                                                        Dr. Hendra, M.Kom.
                                                    </p>
                                                    <p className="text-[0.65rem] font-semibold text-emerald-700">
                                                        Stempel Disetujui
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-600">
                                                <div className="flex items-center justify-between font-label text-[0.62rem] text-slate-500">
                                                    <span>
                                                        EVIDENCE: PR #42 & FIGMA
                                                    </span>
                                                    <span>
                                                        STATUS: APPEND-ONLY
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-[0.72rem] leading-4 text-slate-700">
                                                    &quot;Tugas diselesaikan
                                                    sesuai spesifikasi rekayasa
                                                    dan diakui dalam portofolio
                                                    resmi.&quot;
                                                </p>
                                            </div>
                                        </div>

                                        {/* Mascot Context Layer */}
                                        <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
                                            <div className="flex items-center gap-2">
                                                <img
                                                    src="/images/landing-mascot-accessories.webp"
                                                    alt="Maskot kolaborasi SATU"
                                                    width={36}
                                                    height={36}
                                                    className="size-9 object-contain"
                                                />
                                                <div className="text-[0.7rem]">
                                                    <p className="font-bold text-slate-900">
                                                        SATU Verification Guard
                                                    </p>
                                                    <p className="text-slate-500">
                                                        Provenance terjamin
                                                    </p>
                                                </div>
                                            </div>

                                            <span className="font-label text-[0.65rem] font-bold text-primary">
                                                HASH: #E84F-99B2
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Trust Ribbon */}
                            <div className="mt-16 grid gap-4 border-t border-slate-200/80 pt-8 sm:grid-cols-3">
                                <div className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white/70 p-4 shadow-2xs">
                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-primary">
                                        <ShieldCheck
                                            aria-hidden="true"
                                            className="size-5"
                                        />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-900">
                                            Validasi Berbasis NIM Kampus
                                        </h4>
                                        <p className="mt-0.5 text-xs text-slate-500">
                                            Afiliasi dan kontribusi dicocokkan
                                            langsung dengan data akademik resmi.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white/70 p-4 shadow-2xs">
                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-primary">
                                        <LockKeyhole
                                            aria-hidden="true"
                                            className="size-5"
                                        />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-900">
                                            Kendali Penuh Visibilitas
                                        </h4>
                                        <p className="mt-0.5 text-xs text-slate-500">
                                            Mahasiswa memegang hak menentukan
                                            kapan portofolio dibuka ke perekrut.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white/70 p-4 shadow-2xs">
                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-primary">
                                        <FileCheck2
                                            aria-hidden="true"
                                            className="size-5"
                                        />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-900">
                                            Rekam Jejak Append-Only
                                        </h4>
                                        <p className="mt-0.5 text-xs text-slate-500">
                                            Setiap bukti kerja dan stempel
                                            tersimpan permanen tanpa manipulasi.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ============================================ */}
                    {/* Section 2: Cara Kerja (5 Lifecycle Stages)    */}
                    {/* ============================================ */}
                    <section
                        id="cara-kerja"
                        aria-labelledby="lifecycle-heading"
                        className="scroll-mt-16 border-b border-slate-200/90 bg-white py-16 sm:py-24"
                    >
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="max-w-2xl">
                                <div className="inline-flex items-center gap-2 rounded-md border border-primary/20 bg-blue-50 px-2.5 py-1 font-label text-[0.68rem] font-bold tracking-wider text-primary">
                                    <Layers
                                        aria-hidden="true"
                                        className="size-3.5"
                                    />
                                    CARA KERJA SISTEM
                                </div>
                                <h2
                                    id="lifecycle-heading"
                                    className="mt-4 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl"
                                >
                                    Dari Peluang Menjadi Bukti Nyata.{' '}
                                    <br className="hidden sm:block" />
                                    Lima Tahap Kolaborasi yang Saling
                                    Menguatkan.
                                </h2>
                                <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                                    Setiap tahap meninggalkan konteks untuk
                                    orang berikutnya. Bukan sekadar aktivitas
                                    bebas, tetapi alur kerja terstruktur yang
                                    bisa diverifikasi dari awal pembentukan tim
                                    hingga portofolio siap diproyeksikan.
                                </p>
                            </div>

                            <div className="mt-10">
                                <LandingFlowLedger />
                            </div>
                        </div>
                    </section>

                    {/* ============================================ */}
                    {/* Section 3: Demo Interaktif (Synthetic Graph)  */}
                    {/* ============================================ */}
                    <section
                        id="demo"
                        aria-labelledby="demo-heading"
                        className="scroll-mt-16 border-b border-slate-200/90 bg-[#F7F9FC] py-16 sm:py-24"
                    >
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                                <div className="max-w-2xl">
                                    <div className="inline-flex items-center gap-2 rounded-md border border-primary/20 bg-blue-50 px-2.5 py-1 font-label text-[0.68rem] font-bold tracking-wider text-primary">
                                        <Network
                                            aria-hidden="true"
                                            className="size-3.5"
                                        />
                                        DEMO SYNTHETIC INTERAKTIF
                                    </div>
                                    <h2
                                        id="demo-heading"
                                        className="mt-4 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl"
                                    >
                                        Jelajahi Bagaimana Relasi Kolaborasi
                                        Tumbuh.
                                    </h2>
                                    <p className="mt-2 text-sm leading-6 text-slate-600">
                                        Pilih node pada graf untuk membaca
                                        relasi yang terbentuk. Tabel di samping
                                        menjadi cara baca yang setara untuk
                                        pengguna keyboard dan pembaca layar.
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs">
                                    <Info
                                        aria-hidden="true"
                                        className="size-4 text-primary"
                                    />
                                    <span>
                                        Data synthetic // Non-diagnostik
                                    </span>
                                </div>
                            </div>

                            <div className="mt-8">
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
                    {/* Section 4: Untuk Siapa (Role Ecosystem)       */}
                    {/* ============================================ */}
                    <section
                        id="peran"
                        aria-labelledby="roles-heading"
                        className="scroll-mt-16 border-b border-slate-200/90 bg-white py-16 sm:py-24"
                    >
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="max-w-2xl">
                                <div className="inline-flex items-center gap-2 rounded-md border border-primary/20 bg-blue-50 px-2.5 py-1 font-label text-[0.68rem] font-bold tracking-wider text-primary">
                                    <Users
                                        aria-hidden="true"
                                        className="size-3.5"
                                    />
                                    EKOSISTEM SATU
                                </div>
                                <h2
                                    id="roles-heading"
                                    className="mt-4 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl"
                                >
                                    Satu Platform Kolaborasi, Tiga Peran yang
                                    Saling Melengkapi.
                                </h2>
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                    SATU menyatukan kerja kolaboratif kampus
                                    tanpa menyamakan kebutuhan atau hak akses
                                    semua orang.
                                </p>
                            </div>

                            {/* 3 Institutional File Cards */}
                            <div className="mt-10 grid gap-6 md:grid-cols-3">
                                {roleRows.map((role) => {
                                    const RoleIcon = role.icon;

                                    return (
                                        <article
                                            key={role.key}
                                            className="group flex flex-col justify-between rounded-2xl border border-slate-300/80 bg-white p-6 shadow-xs transition-all hover:border-primary/40 hover:shadow-md"
                                        >
                                            <div>
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex size-11 items-center justify-center rounded-xl border border-primary/20 bg-blue-50 text-primary">
                                                        <RoleIcon
                                                            aria-hidden="true"
                                                            className="size-5"
                                                        />
                                                    </div>
                                                    <span
                                                        className={`rounded-md border px-2.5 py-0.5 font-label text-[0.62rem] font-bold ${role.badgeColor}`}
                                                    >
                                                        {role.badge}
                                                    </span>
                                                </div>

                                                <h3 className="mt-5 text-lg font-bold text-slate-900">
                                                    {role.label}
                                                </h3>
                                                <p className="mt-1 font-label text-xs font-semibold text-primary">
                                                    {role.tagline}
                                                </p>
                                                <p className="mt-3 text-xs leading-5 text-slate-600">
                                                    {role.description}
                                                </p>

                                                {/* Features Checklist */}
                                                <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
                                                    {role.features.map(
                                                        (feature, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="flex items-start gap-2 text-xs text-slate-700"
                                                            >
                                                                <Check
                                                                    aria-hidden="true"
                                                                    className="mt-0.5 size-3.5 shrink-0 text-emerald-600"
                                                                />
                                                                <span>
                                                                    {feature}
                                                                </span>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mt-6 border-t border-slate-200 pt-4">
                                                {role.href === 'register' ? (
                                                    <Link
                                                        href={register()}
                                                        prefetch
                                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                                                    >
                                                        {role.cta}
                                                        <ArrowRight
                                                            aria-hidden="true"
                                                            className="size-3.5"
                                                        />
                                                    </Link>
                                                ) : (
                                                    <a
                                                        href={role.href}
                                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                                                    >
                                                        {role.cta}
                                                        <ArrowRight
                                                            aria-hidden="true"
                                                            className="size-3.5"
                                                        />
                                                    </a>
                                                )}
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        </div>
                    </section>

                    {/* ============================================ */}
                    {/* Section 5: Batas Privasi & Proyeksi Data      */}
                    {/* ============================================ */}
                    <section
                        id="privasi"
                        aria-labelledby="privacy-heading"
                        className="scroll-mt-16 border-b border-slate-200/90 bg-[#F7F9FC] py-16 sm:py-24"
                    >
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="overflow-hidden rounded-2xl border border-slate-300/90 bg-white shadow-sm">
                                <div className="border-b border-slate-200 bg-slate-50/80 p-6 sm:p-8">
                                    <div className="inline-flex items-center gap-2 rounded-md border border-primary/20 bg-blue-50 px-2.5 py-1 font-label text-[0.68rem] font-bold tracking-wider text-primary">
                                        <LockKeyhole
                                            aria-hidden="true"
                                            className="size-3.5"
                                        />
                                        BATAS PROYEKSI // ZERO-LEAKAGE
                                    </div>
                                    <h2
                                        id="privacy-heading"
                                        className="mt-4 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl"
                                    >
                                        Data yang Terlihat Memiliki Izin. Ruang
                                        Privat Tetap Terkunci.
                                    </h2>
                                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                                        Portofolio hanya diproyeksikan ketika
                                        mahasiswa mengizinkannya secara
                                        eksplisit. Nomor WhatsApp, percakapan
                                        tim, dan detail internal tidak pernah
                                        diekspos ke publik atau akun perekrut.
                                    </p>
                                </div>

                                <div className="grid gap-6 p-6 sm:p-8 md:grid-cols-2">
                                    {/* Public / Recruiter Projection Column */}
                                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-5">
                                        <div className="flex items-center gap-2">
                                            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                                                <BadgeCheck
                                                    aria-hidden="true"
                                                    className="size-4"
                                                />
                                            </div>
                                            <h3 className="text-sm font-bold text-emerald-950">
                                                Dapat Diproyeksikan ke Publik /
                                                Perekrut
                                            </h3>
                                        </div>
                                        <ul className="mt-4 space-y-2.5 text-xs text-slate-700">
                                            <li className="flex items-start gap-2">
                                                <Check
                                                    aria-hidden="true"
                                                    className="mt-0.5 size-3.5 shrink-0 text-emerald-600"
                                                />
                                                <span>
                                                    Judul proyek dan peran
                                                    mahasiswa yang diizinkan
                                                </span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <Check
                                                    aria-hidden="true"
                                                    className="mt-0.5 size-3.5 shrink-0 text-emerald-600"
                                                />
                                                <span>
                                                    Lencana verifikasi resmi dan
                                                    nama dosen peninjau
                                                </span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <Check
                                                    aria-hidden="true"
                                                    className="mt-0.5 size-3.5 shrink-0 text-emerald-600"
                                                />
                                                <span>
                                                    Ringkasan deskripsi tugas
                                                    dan bukti deliverable publik
                                                </span>
                                            </li>
                                        </ul>
                                    </div>

                                    {/* Locked Private Workspace Column */}
                                    <div className="rounded-xl border border-slate-300 bg-slate-50/50 p-5">
                                        <div className="flex items-center gap-2">
                                            <div className="flex size-7 items-center justify-center rounded-lg bg-slate-200 text-slate-800">
                                                <EyeOff
                                                    aria-hidden="true"
                                                    className="size-4"
                                                />
                                            </div>
                                            <h3 className="text-sm font-bold text-slate-900">
                                                Terkunci Aman di Ruang Privat
                                                Kampus
                                            </h3>
                                        </div>
                                        <ul className="mt-4 space-y-2.5 text-xs text-slate-700">
                                            <li className="flex items-start gap-2">
                                                <LockKeyhole
                                                    aria-hidden="true"
                                                    className="mt-0.5 size-3.5 shrink-0 text-slate-500"
                                                />
                                                <span>
                                                    Nomor telepon WhatsApp dan
                                                    kontak pribadi mahasiswa
                                                </span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <LockKeyhole
                                                    aria-hidden="true"
                                                    className="mt-0.5 size-3.5 shrink-0 text-slate-500"
                                                />
                                                <span>
                                                    Percakapan internal, pesan
                                                    chat, dan diskusi tim
                                                </span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <LockKeyhole
                                                    aria-hidden="true"
                                                    className="mt-0.5 size-3.5 shrink-0 text-slate-500"
                                                />
                                                <span>
                                                    Log audit mentah dan sinyal
                                                    jejaring internal kampus
                                                </span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 text-xs text-slate-500 sm:px-8">
                                    <span>
                                        Catatan Evaluator: SATU tidak menjual
                                        data mahasiswa, tidak menganalisis
                                        psikologis/sentimen pesan, dan melabeli
                                        semua data demo sebagai synthetic.
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ============================================ */}
                    {/* Section 6: Pilar Platform (Integritas)        */}
                    {/* ============================================ */}
                    <section
                        id="pilar"
                        aria-labelledby="pillars-heading"
                        className="scroll-mt-16 border-b border-slate-200/90 bg-white py-16 sm:py-24"
                    >
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="max-w-2xl">
                                <div className="inline-flex items-center gap-2 rounded-md border border-primary/20 bg-blue-50 px-2.5 py-1 font-label text-[0.68rem] font-bold tracking-wider text-primary">
                                    <Scale
                                        aria-hidden="true"
                                        className="size-3.5"
                                    />
                                    INTEGRITAS PLATFORM
                                </div>
                                <h2
                                    id="pillars-heading"
                                    className="mt-4 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl"
                                >
                                    Prinsip Arsitektur yang Menjaga Kepercayaan.
                                </h2>
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                    SATU dibangun dengan batas-batas teknis yang
                                    jelas agar kolaborasi tetap objektif dan
                                    bebas manipulasi.
                                </p>
                            </div>

                            <div className="mt-10 grid gap-6 md:grid-cols-3">
                                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6">
                                    <div className="flex size-10 items-center justify-center rounded-xl bg-blue-100 text-primary">
                                        <Sparkles
                                            aria-hidden="true"
                                            className="size-5"
                                        />
                                    </div>
                                    <h3 className="mt-4 text-base font-bold text-slate-900">
                                        Matching Transparan 4 Dimensi
                                    </h3>
                                    <p className="mt-2 text-xs leading-5 text-slate-600">
                                        Rekomendasi kolaborasi dihitung
                                        berdasarkan kesesuaian skill, kebutuhan
                                        proyek, ketersediaan waktu, dan peluang
                                        konektivitas baru, tanpa algoritma kotak
                                        hitam.
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6">
                                    <div className="flex size-10 items-center justify-center rounded-xl bg-blue-100 text-primary">
                                        <FileCheck2
                                            aria-hidden="true"
                                            className="size-5"
                                        />
                                    </div>
                                    <h3 className="mt-4 text-base font-bold text-slate-900">
                                        Audit Trail Append-Only
                                    </h3>
                                    <p className="mt-2 text-xs leading-5 text-slate-600">
                                        Setiap pencatatan tugas, tinjauan
                                        reviewer, dan riwayat persetujuan
                                        tersimpan permanen dengan catatan waktu
                                        yang tidak dapat dimanipulasi.
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6">
                                    <div className="flex size-10 items-center justify-center rounded-xl bg-blue-100 text-primary">
                                        <Award
                                            aria-hidden="true"
                                            className="size-5"
                                        />
                                    </div>
                                    <h3 className="mt-4 text-base font-bold text-slate-900">
                                        Bebas Gamifikasi Manipulatif
                                    </h3>
                                    <p className="mt-2 text-xs leading-5 text-slate-600">
                                        Tidak ada peringkat yang menekan mental
                                        mahasiswa atau poin buatan. Nilai
                                        portofolio berakar murni dari kualitas
                                        bukti kontribusi yang tervalidasi.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ============================================ */}
                    {/* Section 7: FAQ Accordion                      */}
                    {/* ============================================ */}
                    <section
                        id="faq"
                        aria-labelledby="faq-heading"
                        className="scroll-mt-16 border-b border-slate-200/90 bg-[#F7F9FC] py-16 sm:py-24"
                    >
                        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                            <div className="text-center">
                                <div className="inline-flex items-center gap-2 rounded-md border border-primary/20 bg-blue-50 px-2.5 py-1 font-label text-[0.68rem] font-bold tracking-wider text-primary">
                                    <HelpCircle
                                        aria-hidden="true"
                                        className="size-3.5"
                                    />
                                    TANYA JAWAB
                                </div>
                                <h2
                                    id="faq-heading"
                                    className="mt-4 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl"
                                >
                                    Pertanyaan yang Sering Diajukan Seputar
                                    SATU.
                                </h2>
                            </div>

                            <div className="mt-10 space-y-3">
                                {faqItems.map((item, index) => {
                                    const isOpen = openFaqIndex === index;

                                    return (
                                        <div
                                            key={index}
                                            className="overflow-hidden rounded-xl border border-slate-300/80 bg-white shadow-2xs"
                                        >
                                            <button
                                                type="button"
                                                onClick={() => toggleFaq(index)}
                                                aria-expanded={isOpen}
                                                className="flex w-full items-center justify-between gap-4 p-5 text-left font-bold text-slate-900 transition-colors hover:bg-slate-50"
                                            >
                                                <span className="text-sm sm:text-base">
                                                    {item.question}
                                                </span>
                                                {isOpen ? (
                                                    <ChevronUp
                                                        aria-hidden="true"
                                                        className="size-4 shrink-0 text-primary"
                                                    />
                                                ) : (
                                                    <ChevronDown
                                                        aria-hidden="true"
                                                        className="size-4 shrink-0 text-slate-400"
                                                    />
                                                )}
                                            </button>
                                            {isOpen && (
                                                <div className="border-t border-slate-100 p-5 pt-3 text-xs leading-6 text-slate-600 sm:text-sm">
                                                    <p>{item.answer}</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>

                    {/* ============================================ */}
                    {/* Section 8: Final CTA Action Banner            */}
                    {/* ============================================ */}
                    <section className="relative overflow-hidden bg-gradient-to-br from-[#0D2866] via-primary to-[#1B357A] py-16 text-white sm:py-24">
                        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
                            <div className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-1 font-label text-[0.68rem] font-bold tracking-wider text-blue-100 backdrop-blur-xs">
                                <Zap aria-hidden="true" className="size-3.5" />
                                MULAI HARI INI
                            </div>
                            <h2 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                                Siap Mengubah Setiap Kerja Kolaborasi Menjadi
                                Portofolio Terpercaya?
                            </h2>
                            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-blue-100/90 sm:text-base">
                                Bergabunglah dengan mahasiswa lainnya dan mulai
                                kolaborasi pertamamu. Kontribusimu akan
                                tervalidasi oleh kampus dan siap diproyeksikan
                                ke perekrut.
                            </p>
                            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                                <Button
                                    asChild
                                    size="lg"
                                    className="h-12 rounded-xl bg-white px-7 font-bold text-primary shadow-md hover:bg-blue-50"
                                >
                                    <Link href={register()} prefetch>
                                        Daftar Mahasiswa Sekarang
                                        <ArrowRight
                                            aria-hidden="true"
                                            className="ml-2 size-4"
                                        />
                                    </Link>
                                </Button>
                                <a
                                    href="#cara-kerja"
                                    className="inline-flex h-12 items-center justify-center rounded-xl border border-white/30 bg-white/10 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/20"
                                >
                                    Pelajari Alur Validasi
                                </a>
                            </div>
                        </div>
                    </section>
                </main>

                {/* Accessible Noscript Fallback */}
                <noscript>
                    <section className="border-b border-slate-200 bg-slate-50 px-4 py-10">
                        <div className="mx-auto max-w-7xl">
                            <h2 className="text-xl font-bold text-slate-900">
                                Alur Kolaborasi SATU
                            </h2>
                            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
                                <table className="min-w-full text-left text-xs">
                                    <caption className="sr-only">
                                        Tabel alur kolaborasi synthetic SATU
                                    </caption>
                                    <thead className="bg-slate-100 text-slate-900">
                                        <tr>
                                            <th className="px-4 py-2 font-semibold">
                                                Tahap
                                            </th>
                                            <th className="px-4 py-2 font-semibold">
                                                Deskripsi
                                            </th>
                                            <th className="px-4 py-2 font-semibold">
                                                Kelanjutan
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 text-slate-600">
                                        {LANDING_STAGES.map((stage) => (
                                            <tr key={stage.key}>
                                                <th className="px-4 py-2 font-semibold text-slate-900">
                                                    {stage.label}
                                                </th>
                                                <td className="px-4 py-2">
                                                    {stage.shortDescription}
                                                </td>
                                                <td className="px-4 py-2">
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
                <footer className="border-t border-slate-200/90 bg-white py-12 text-slate-600">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
                            <div className="space-y-2">
                                <AppLogo
                                    compact
                                    className="text-slate-900"
                                    ruleClassName="bg-primary"
                                />
                                <p className="max-w-md text-xs text-slate-500">
                                    Platform kolaborasi kampus dan validasi
                                    kontribusi talenta mahasiswa berbasis rekam
                                    jejak terpercaya.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-600">
                                <a
                                    href="#cara-kerja"
                                    className="hover:text-primary"
                                >
                                    Cara Kerja
                                </a>
                                <a href="#demo" className="hover:text-primary">
                                    Demo Synthetic
                                </a>
                                <a href="#peran" className="hover:text-primary">
                                    Untuk Siapa
                                </a>
                                <a
                                    href="#privasi"
                                    className="hover:text-primary"
                                >
                                    Batas Privasi
                                </a>
                                <a href="#faq" className="hover:text-primary">
                                    Tanya Jawab
                                </a>
                            </div>
                        </div>

                        <div className="mt-8 flex flex-col gap-4 border-t border-slate-200/80 pt-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                            <p className="font-label text-[0.68rem]">
                                &copy; {new Date().getFullYear()} SATU (Sistem
                                Aktivitas Talenta Universitas). Semua hak cipta
                                dilindungi.
                            </p>
                            <p className="text-[0.68rem] text-slate-400">
                                Seluruh demo menggunakan Data synthetic sesuai
                                standar privasi SATU.
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
