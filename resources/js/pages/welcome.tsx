import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowRight,
    BadgeCheck,
    BookOpen,
    Check,
    Eye,
    EyeOff,
    FileText,
    FolderOpen,
    LockKeyhole,
    Menu,
    ShieldCheck,
    UsersRound,
    X,
} from 'lucide-react';
import { useState, useSyncExternalStore } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';
import AppLogo from '@/components/app-logo';
import { DashboardArchiveArt } from '@/components/dashboard-archive-art';
import LandingDemo, { LandingDemoFallback } from '@/components/landing-demo';
import LandingJourneyDemo from '@/components/landing-journey-demo';
import LandingMascot from '@/components/landing-mascot';
import LandingPreview from '@/components/landing-preview';
import type { LandingPreviewKind } from '@/components/landing-preview';
import LandingReveal from '@/components/landing-reveal';
import LandingFlowLedger, {
    LANDING_STAGES,
} from '@/components/LandingFlowLedger';
import Mascot from '@/components/mascot';
import { cn } from '@/lib/utils';
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
    colorScheme: 'light',
} as CSSProperties;

const navigation = [
    { href: '#cara-kerja', label: 'Cara kerja' },
    { href: '#fitur', label: 'Jelajahi fitur' },
    { href: '#demo', label: 'Demo' },
    { href: '#peran', label: 'Untuk siapa' },
    { href: '#privasi', label: 'Privasi' },
];
const audienceTabs = [
    { key: 'student', label: 'Mahasiswa', icon: UsersRound },
    { key: 'campus', label: 'Operator kampus', icon: ShieldCheck },
    { key: 'recruiter', label: 'Perekrut (lanjutan)', icon: Eye },
] as const;
type AudienceKey = (typeof audienceTabs)[number]['key'];
const audiences: Record<
    AudienceKey,
    {
        title: string;
        description: string;
        boundaries: string[];
        preview: LandingPreviewKind;
    }
> = {
    student: {
        title: 'Ruang untuk tumbuh lewat karya.',
        description:
            'Temukan proyek, bekerja bersama tim, dan susun portofolio dari kontribusi yang disetujui kampus.',
        boundaries: [
            'Registrasi terbuka hanya membuat akun mahasiswa.',
            'Afiliasi kampus diverifikasi terpisah dari pembuatan akun.',
            'Belum punya karya? Cari peran yang menerima pemula. Jangkauan karya tetap pilihanmu.',
        ],
        preview: 'portfolio',
    },
    campus: {
        title: 'Konteks yang jelas untuk setiap tinjauan.',
        description:
            'Operator kampus meninjau afiliasi dan kontribusi melalui ruang operasi sesuai kewenangannya.',
        boundaries: [
            'Akses operator diberikan melalui alur terkontrol.',
            'Tinjauan kontribusi memiliki versi dan alasan keputusan.',
            'Informasi terbatas hanya tersedia bagi petugas berwenang.',
        ],
        preview: 'campus',
    },
    recruiter: {
        title: 'Perekrut adalah pengembangan lanjutan.',
        description:
            'Fokus rilis inti adalah kesempatan berkolaborasi dan pengakuan mahasiswa. Modul perekrut existing tetap dibatasi hak akses dan izin berbagi, bukan syarat alur utama.',
        boundaries: [
            'Organisasi dan hak akses harus melewati verifikasi SATU.',
            'Portofolio mengikuti izin yang dipilih mahasiswa.',
            'Percakapan tim, bukti privat, dan data peninjauan terbatas tidak ditampilkan.',
        ],
        preview: 'recruiter',
    },
};
const featureStories: {
    label: string;
    title: string;
    description: string;
    note: string;
    kind: LandingPreviewKind;
    icon: typeof FileText;
}[] = [
    {
        label: 'Proyek dan tim',
        title: 'Bukan sekadar daftar proyek. Temukan tempat untuk berperan.',
        description:
            'Pahami tujuan proyek, keahlian yang dibutuhkan, dan peran yang ingin kamu ambil. Peluang yang jelas membantu kamu memutuskan langkah berikutnya.',
        note: 'Mulai dari kebutuhan proyek, bukan popularitas.',
        kind: 'project',
        icon: FolderOpen,
    },
    {
        label: 'Kontribusi dan validasi',
        title: 'Pekerjaanmu punya cerita yang bisa ditinjau.',
        description:
            'Catat peran, pekerjaan, dan bukti yang relevan. Tinjauan kampus memberi keputusan serta alasan, sehingga kamu tahu apa yang perlu ditindaklanjuti.',
        note: 'Permintaan revisi tetap menjadi bagian dari perjalanan.',
        kind: 'contribution',
        icon: FileText,
    },
    {
        label: 'Portofolio dan kendali',
        title: 'Beri ruang pada karya. Pilih siapa yang melihatnya.',
        description:
            'Susun karya dari kontribusi yang disetujui. Konteks proyek dan peran tetap terbaca, sementara jangkauan tiap karya tetap berada dalam kendalimu.',
        note: 'Kontribusi disetujui bukan berarti otomatis dipublikasikan.',
        kind: 'portfolio',
        icon: LockKeyhole,
    },
];
const subscribeToHydration = () => () => undefined;
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export default function Welcome() {
    const { auth } = usePage().props;
    const isHydrated = useSyncExternalStore(
        subscribeToHydration,
        getClientSnapshot,
        getServerSnapshot,
    );
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMapOpen, setIsMapOpen] = useState(false);
    const [activeAudience, setActiveAudience] =
        useState<AudienceKey>('student');
    const audience = audiences[activeAudience];

    function closeMenu(restoreFocus = false) {
        setIsMenuOpen(false);

        if (restoreFocus) {
            document
                .querySelector<HTMLButtonElement>(
                    '[data-testid="landing-menu-toggle"]',
                )
                ?.focus();
        }
    }

    function moveAudience(
        event: KeyboardEvent<HTMLButtonElement>,
        index: number,
    ) {
        let next: number;

        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            next = (index + 1) % audienceTabs.length;
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            next = (index - 1 + audienceTabs.length) % audienceTabs.length;
        } else if (event.key === 'Home') {
            next = 0;
        } else if (event.key === 'End') {
            next = audienceTabs.length - 1;
        } else {
            return;
        }

        event.preventDefault();
        setActiveAudience(audienceTabs[next].key);
        event.currentTarget
            .closest('[role="tablist"]')
            ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
            .item(next)
            ?.focus();
    }

    return (
        <>
            <Head title="SATU | Kolaborasi dan portofolio mahasiswa">
                <meta
                    name="description"
                    content="Temukan peluang kolaborasi, catat kontribusi, dan susun portofolio dengan jangkauan yang kamu kendalikan di SATU."
                />
            </Head>
            <div
                id="top"
                data-landing-surface
                className="landing-editorial min-h-screen bg-[#F3F9FF] text-[#17345A] selection:bg-[#B9D9FF]"
                style={landingTheme}
            >
                <a
                    href="#main"
                    className="sr-only z-[100] rounded-xl bg-white px-4 py-3 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
                >
                    Langsung ke konten utama
                </a>
                <header
                    className="@container sticky top-0 z-50 border-b border-[#D9E8F5]/80 bg-white/95 backdrop-blur-xl"
                    onKeyDown={(event) => {
                        if (event.key === 'Escape' && isMenuOpen) {
                            event.preventDefault();
                            closeMenu(true);
                        }
                    }}
                >
                    <div className="landing-container flex min-h-20 items-center justify-between gap-3 py-3">
                        <a
                            href="#top"
                            aria-label="SATU, kembali ke awal halaman"
                            className="shrink-0 rounded-xl"
                        >
                            <AppLogo
                                compact
                                logoClassName="size-11 rounded-xl border border-[#D9E8F5] bg-white shadow-sm sm:size-12"
                                className="text-[#17345A]"
                            />
                        </a>
                        <nav
                            aria-label="Navigasi landing"
                            className="hidden items-center gap-1 @min-[64rem]:flex"
                        >
                            {navigation.map((item) => (
                                <a
                                    key={item.href}
                                    href={item.href}
                                    className="landing-nav-link"
                                >
                                    {item.label}
                                </a>
                            ))}
                        </nav>
                        <div className="flex shrink-0 items-center gap-2">
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="landing-primary px-4 text-sm"
                                    prefetch
                                >
                                    Buka beranda
                                    <ArrowRight
                                        aria-hidden="true"
                                        className="hidden size-4 sm:block"
                                    />
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="landing-nav-link"
                                    >
                                        Masuk
                                    </Link>
                                    <Link
                                        href={register()}
                                        className="landing-primary hidden px-4 text-sm sm:inline-flex"
                                        prefetch
                                    >
                                        Daftar mahasiswa
                                        <ArrowRight
                                            aria-hidden="true"
                                            className="size-4"
                                        />
                                    </Link>
                                </>
                            )}
                            <button
                                data-testid="landing-menu-toggle"
                                type="button"
                                aria-label={
                                    isMenuOpen
                                        ? 'Tutup navigasi'
                                        : 'Buka navigasi'
                                }
                                aria-expanded={isMenuOpen}
                                aria-controls="landing-mobile-navigation"
                                className="inline-flex size-11 items-center justify-center rounded-xl border border-[#D9E8F5] bg-white text-[#17345A] @min-[64rem]:hidden"
                                onClick={() => setIsMenuOpen((open) => !open)}
                            >
                                {isMenuOpen ? (
                                    <X aria-hidden="true" className="size-5" />
                                ) : (
                                    <Menu
                                        aria-hidden="true"
                                        className="size-5"
                                    />
                                )}
                            </button>
                        </div>
                    </div>
                    <nav
                        id="landing-mobile-navigation"
                        aria-label="Navigasi landing mobile"
                        hidden={!isMenuOpen}
                        className="border-t border-[#D9E8F5] bg-white @min-[64rem]:hidden"
                    >
                        <div className="landing-container grid max-h-[calc(100dvh-5rem)] gap-1 overflow-y-auto py-3">
                            {navigation.map((item) => (
                                <a
                                    key={item.href}
                                    href={item.href}
                                    className="landing-nav-link"
                                    onClick={() => closeMenu(true)}
                                >
                                    {item.label}
                                    <ArrowRight
                                        aria-hidden="true"
                                        className="ml-auto size-4"
                                    />
                                </a>
                            ))}
                            {!auth.user && (
                                <Link
                                    href={register()}
                                    className="landing-primary mt-2"
                                    prefetch
                                >
                                    Daftar sebagai mahasiswa
                                </Link>
                            )}
                        </div>
                    </nav>
                </header>

                <main id="main" tabIndex={-1}>
                    <section
                        aria-labelledby="landing-heading"
                        className="landing-container pt-6 pb-14 sm:pt-10 sm:pb-20 lg:pt-12"
                    >
                        <div className="landing-editorial-hero landing-main-hero relative isolate rounded-[2rem] border border-[#D9E8F5] py-8 shadow-md sm:py-12">
                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]"
                            >
                                <span className="absolute top-8 -right-16 size-80 rounded-full border border-white/80 sm:size-[34rem]" />
                                <span className="absolute -right-14 -bottom-52 size-[34rem] rounded-full border-[64px] border-white/35" />
                            </div>
                            <LandingMascot>
                                <LandingReveal className="lg:pt-2">
                                    <p className="inline-flex items-center gap-2 rounded-full border border-[#BFD7EC] bg-white/90 px-3 py-2 text-xs font-semibold text-[#1454C4]">
                                        <span
                                            aria-hidden="true"
                                            className="size-2 rounded-full bg-[#FFB85C]"
                                        />
                                        Ruang kolaborasi mahasiswa
                                    </p>
                                    <h1
                                        id="landing-heading"
                                        className="mt-6 max-w-[15ch] text-[clamp(2rem,5.4vw,4.5rem)] leading-[1.02] font-bold tracking-[-0.045em]"
                                    >
                                        Temukan teman berkarya.
                                        <span className="mt-2 block text-[#1764E8]">
                                            Tunjukkan kontribusimu.
                                        </span>
                                    </h1>
                                    <p className="mt-6 max-w-[43ch] text-base leading-7 text-[#526B85] sm:text-lg sm:leading-8">
                                        Punya kemampuan, tetapi belum punya
                                        kesempatan? Mulai dari peran yang jelas,
                                        bekerja dengan rekan baru, lalu buktikan
                                        kontribusimu. Tanpa harus sudah memiliki
                                        karya atau banyak relasi.
                                    </p>
                                    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                                        <Link
                                            href={
                                                auth.user
                                                    ? dashboard()
                                                    : register()
                                            }
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
                                            Jelajahi demo
                                            <ArrowDown
                                                aria-hidden="true"
                                                className="size-4"
                                            />
                                        </a>
                                    </div>
                                    <p className="mt-4 text-xs leading-5 text-[#526B85]">
                                        {auth.user
                                            ? 'Lanjutkan dari ruang kerjamu.'
                                            : 'Akun mahasiswa. Afiliasi kampus diverifikasi terpisah.'}
                                    </p>
                                </LandingReveal>
                            </LandingMascot>
                            <div className="relative mt-8 grid gap-4 border-t border-[#BFD7EC] pt-6 sm:grid-cols-3 lg:mt-10">
                                {[
                                    {
                                        icon: UsersRound,
                                        text: 'Peluang dengan peran yang jelas',
                                    },
                                    {
                                        icon: BadgeCheck,
                                        text: 'Kontribusi ditinjau kampus',
                                    },
                                    {
                                        icon: LockKeyhole,
                                        text: 'Jangkauan karya kamu kendalikan',
                                    },
                                ].map(({ icon: Icon, text }) => (
                                    <div
                                        key={text}
                                        className="flex items-center gap-3 text-sm font-semibold text-[#345574]"
                                    >
                                        <Icon
                                            aria-hidden="true"
                                            className="size-5 shrink-0 text-[#1764E8]"
                                        />
                                        {text}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <a
                            href="#cara-kerja"
                            className="mx-auto mt-7 flex min-h-11 w-fit items-center gap-2 rounded-lg text-sm font-semibold text-[#526B85]"
                        >
                            Kenali perjalananmu
                            <ArrowDown aria-hidden="true" className="size-4" />
                        </a>
                    </section>

                    <section
                        id="cara-kerja"
                        aria-labelledby="lifecycle-heading"
                        className="landing-section bg-white"
                    >
                        <div className="landing-container">
                            <LandingReveal className="mb-10 grid gap-5 lg:grid-cols-2 lg:items-end lg:gap-16">
                                <div>
                                    <p className="landing-kicker">
                                        <BookOpen
                                            aria-hidden="true"
                                            className="size-4"
                                        />
                                        Perjalanan di SATU
                                    </p>
                                    <h2
                                        id="lifecycle-heading"
                                        className="landing-section-title mt-4"
                                    >
                                        Satu alur.
                                        <br />
                                        Banyak ruang untuk berkarya.
                                    </h2>
                                </div>
                                <p className="max-w-xl text-base leading-7 text-[#526B85] sm:text-lg sm:leading-8">
                                    Kesempatan bukan sekadar profil yang
                                    terlihat. Kenali alur dari peran pertama
                                    sampai pengakuan atas pekerjaanmu. Tidak
                                    perlu karya terdahulu untuk mulai.
                                </p>
                            </LandingReveal>
                            <LandingFlowLedger />
                        </div>
                    </section>

                    <section
                        id="fitur"
                        aria-labelledby="features-heading"
                        className="landing-section"
                    >
                        <div className="landing-container">
                            <LandingReveal className="mb-14 max-w-2xl">
                                <p className="landing-kicker">
                                    Kenali ruang kerjamu
                                </p>
                                <h2
                                    id="features-heading"
                                    className="landing-section-title mt-4"
                                >
                                    Dirancang untuk pekerjaan.
                                    <br />
                                    Tetap memberi ruang pada cerita.
                                </h2>
                            </LandingReveal>
                            <div className="space-y-16 lg:space-y-24">
                                {featureStories.map((story, index) => {
                                    const Icon = story.icon;

                                    return (
                                        <LandingReveal
                                            key={story.kind}
                                            className="grid items-center gap-8 lg:grid-cols-2 lg:gap-20"
                                        >
                                            <div
                                                className={cn(
                                                    'min-w-0',
                                                    index % 2 !== 0 &&
                                                        'lg:order-2',
                                                )}
                                            >
                                                <span className="inline-flex size-12 items-center justify-center rounded-2xl border border-[#D9E8F5] bg-white text-[#1764E8] shadow-sm">
                                                    <Icon
                                                        aria-hidden="true"
                                                        className="size-5"
                                                    />
                                                </span>
                                                <p className="mt-5 text-sm font-semibold text-[#1454C4]">
                                                    {story.label}
                                                </p>
                                                <h3 className="mt-3 max-w-[21ch] text-[clamp(1.75rem,3vw,2.625rem)] leading-[1.12] font-bold tracking-[-0.03em]">
                                                    {story.title}
                                                </h3>
                                                <p className="mt-5 max-w-lg text-base leading-7 text-[#526B85] sm:text-lg sm:leading-8">
                                                    {story.description}
                                                </p>
                                                <p className="mt-6 flex max-w-lg items-start gap-3 border-t border-[#D9E8F5] pt-5 text-sm leading-6 text-[#345574]">
                                                    <Check
                                                        aria-hidden="true"
                                                        className="mt-1 size-4 shrink-0 text-[#1764E8]"
                                                    />
                                                    {story.note}
                                                </p>
                                            </div>
                                            <div
                                                className={cn(
                                                    'min-w-0',
                                                    index % 2 !== 0 &&
                                                        'lg:order-1',
                                                )}
                                            >
                                                <LandingPreview
                                                    kind={story.kind}
                                                />
                                            </div>
                                        </LandingReveal>
                                    );
                                })}
                            </div>
                        </div>
                    </section>

                    <section
                        id="demo"
                        aria-labelledby="demo-heading"
                        className="landing-section border-y border-[#D9E8F5] bg-[#E7F2FF]"
                    >
                        <div className="landing-container">
                            <LandingReveal className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-end lg:gap-12">
                                <div>
                                    <p className="landing-kicker">
                                        Coba, bukan hanya baca
                                    </p>
                                    <h2
                                        id="demo-heading"
                                        className="landing-section-title mt-4"
                                    >
                                        Dari kesempatan pertama
                                        <br />
                                        sampai karya yang diakui.
                                    </h2>
                                    <p className="mt-5 max-w-2xl text-base leading-7 text-[#526B85]">
                                        Ikuti Budi yang belum punya karya,
                                        mengajukan peran pemula, bekerja dengan
                                        Siti, lalu mencatat kontribusinya. Coba
                                        juga keadaan penuh atau perlu revisi.
                                    </p>
                                </div>
                                <div className="border-l-2 border-[#1764E8] pl-4">
                                    <p className="text-sm font-bold text-[#1454C4]">
                                        Data synthetic
                                    </p>
                                    <p className="mt-2 text-sm leading-6 text-[#526B85]">
                                        Semua nama dan hubungan pada demo adalah
                                        contoh, bukan aktivitas atau hasil
                                        pengguna nyata.
                                    </p>
                                </div>
                            </LandingReveal>
                            <div className="mt-9">
                                <LandingJourneyDemo />
                            </div>
                            <details
                                onToggle={(event) =>
                                    setIsMapOpen(event.currentTarget.open)
                                }
                                className="mt-6 rounded-3xl border border-[#BFD7EC] bg-white p-5 shadow-sm"
                            >
                                <summary className="min-h-11 cursor-pointer content-center rounded-xl text-base font-semibold">
                                    Pelengkap: peta dan daftar hubungan
                                </summary>
                                <p className="mt-3 text-sm leading-6 text-[#526B85]">
                                    Ilustrasi hubungan objek, bukan analitik
                                    jaringan atau laporan dampak. Seluruh data
                                    synthetic.
                                </p>
                                <div
                                    className="mt-5"
                                    data-testid="landing-demo-region"
                                >
                                    {isMapOpen && isHydrated ? (
                                        <LandingDemo />
                                    ) : isMapOpen ? (
                                        <LandingDemoFallback />
                                    ) : null}
                                </div>
                            </details>
                        </div>
                    </section>

                    <section
                        id="peran"
                        aria-labelledby="roles-heading"
                        className="landing-section bg-white"
                    >
                        <div className="landing-container">
                            <LandingReveal className="max-w-2xl">
                                <p className="landing-kicker">Untuk siapa?</p>
                                <h2
                                    id="roles-heading"
                                    className="landing-section-title mt-4"
                                >
                                    Berkolaborasi bersama.
                                    <br />
                                    Dengan ruang dan batas yang jelas.
                                </h2>
                                <p className="mt-5 text-base leading-7 text-[#526B85]">
                                    Pilih peran untuk mengenali tujuannya.
                                    Pilihan ini menjelaskan akses, bukan
                                    menentukan jenis akun saat mendaftar.
                                </p>
                            </LandingReveal>
                            <div
                                role="tablist"
                                aria-label="Pilih peran di SATU"
                                className="mt-8 flex flex-wrap gap-2"
                            >
                                {audienceTabs.map((tab, index) => {
                                    const Icon = tab.icon;
                                    const active = tab.key === activeAudience;

                                    return (
                                        <button
                                            key={tab.key}
                                            id={`role-tab-${tab.key}`}
                                            type="button"
                                            role="tab"
                                            aria-selected={active}
                                            aria-controls="role-panel"
                                            tabIndex={active ? 0 : -1}
                                            onClick={() =>
                                                setActiveAudience(tab.key)
                                            }
                                            onKeyDown={(event) =>
                                                moveAudience(event, index)
                                            }
                                            className={cn(
                                                'landing-control px-4 sm:px-5',
                                                active &&
                                                    'border-[#1764E8] bg-[#1764E8] text-white hover:bg-[#1454C4]',
                                            )}
                                        >
                                            <Icon
                                                aria-hidden="true"
                                                className="size-4"
                                            />
                                            {tab.label}
                                            {active && (
                                                <Check
                                                    aria-hidden="true"
                                                    className="size-4"
                                                />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                            <section
                                id="role-panel"
                                role="tabpanel"
                                aria-labelledby={`role-tab-${activeAudience}`}
                                tabIndex={0}
                                className="mt-6 rounded-[2rem] border border-[#D9E8F5] bg-[#F3F9FF] p-5 sm:p-8 lg:p-10"
                            >
                                <div
                                    key={activeAudience}
                                    className="landing-panel-enter grid gap-8 lg:min-h-[29rem] lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-center lg:gap-16"
                                >
                                    <div className="min-w-0">
                                        <h3 className="max-w-[20ch] text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.12] font-bold tracking-[-0.03em]">
                                            {audience.title}
                                        </h3>
                                        <p className="mt-5 max-w-lg text-base leading-7 text-[#526B85]">
                                            {audience.description}
                                        </p>
                                        <ul className="mt-6 space-y-4">
                                            {audience.boundaries.map(
                                                (boundary) => (
                                                    <li
                                                        key={boundary}
                                                        className="flex items-start gap-3 text-sm leading-6 text-[#345574]"
                                                    >
                                                        <ShieldCheck
                                                            aria-hidden="true"
                                                            className="mt-1 size-4 shrink-0 text-[#1764E8]"
                                                        />
                                                        {boundary}
                                                    </li>
                                                ),
                                            )}
                                        </ul>
                                        {activeAudience === 'student' ? (
                                            <Link
                                                href={
                                                    auth.user
                                                        ? dashboard()
                                                        : register()
                                                }
                                                className="landing-primary mt-7 px-5"
                                                prefetch
                                            >
                                                {auth.user
                                                    ? 'Buka beranda'
                                                    : 'Buat akun mahasiswa'}
                                                <ArrowRight
                                                    aria-hidden="true"
                                                    className="size-4"
                                                />
                                            </Link>
                                        ) : (
                                            <a
                                                href="#privasi"
                                                className="landing-control mt-7"
                                            >
                                                Pelajari batas akses
                                                <ArrowRight
                                                    aria-hidden="true"
                                                    className="size-4"
                                                />
                                            </a>
                                        )}
                                    </div>
                                    <LandingPreview kind={audience.preview} />
                                </div>
                            </section>
                        </div>
                    </section>

                    <section
                        id="privasi"
                        aria-labelledby="privacy-heading"
                        className="landing-section"
                    >
                        <div className="landing-container grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-20">
                            <LandingReveal>
                                <span className="inline-flex size-14 items-center justify-center rounded-2xl border border-[#D9E8F5] bg-white text-[#1764E8] shadow-sm">
                                    <LockKeyhole
                                        aria-hidden="true"
                                        className="size-6"
                                    />
                                </span>
                                <p className="landing-kicker mt-5">
                                    Kendali tetap di tanganmu
                                </p>
                                <h2
                                    id="privacy-heading"
                                    className="landing-section-title mt-4"
                                >
                                    Berkarya terbuka.
                                    <br />
                                    Bukan membuka semuanya.
                                </h2>
                                <p className="mt-5 text-base leading-7 text-[#526B85]">
                                    Persetujuan kontribusi, jangkauan karya, dan
                                    izin ditemukan perekrut adalah hal yang
                                    berbeda.
                                </p>
                            </LandingReveal>
                            <LandingReveal className="divide-y divide-[#D9E8F5] border-y border-[#D9E8F5]">
                                <div className="py-7">
                                    <h3 className="flex items-center gap-3 text-xl font-bold">
                                        <Eye
                                            aria-hidden="true"
                                            className="size-5 text-[#1764E8]"
                                        />
                                        Yang bisa kamu bagikan
                                    </h3>
                                    <p className="mt-3 text-base leading-7 text-[#526B85]">
                                        Karya portofolio dengan jangkauan yang
                                        kamu pilih. Perekrut hanya menerima
                                        proyeksi yang secara eksplisit
                                        diizinkan.
                                    </p>
                                </div>
                                <div className="py-7">
                                    <h3 className="flex items-center gap-3 text-xl font-bold">
                                        <EyeOff
                                            aria-hidden="true"
                                            className="size-5 text-[#1764E8]"
                                        />
                                        Yang tidak masuk proyeksi
                                    </h3>
                                    <p className="mt-3 text-base leading-7 text-[#526B85]">
                                        Percakapan tim, bukti privat, data audit
                                        mentah, dan informasi peninjauan
                                        terbatas. Bukan bahan profil publik atau
                                        perekrut.
                                    </p>
                                </div>
                            </LandingReveal>
                        </div>
                    </section>

                    <section
                        aria-labelledby="start-heading"
                        className="landing-container pb-16 sm:pb-24"
                    >
                        <LandingReveal className="landing-editorial-hero relative isolate grid gap-6 overflow-hidden rounded-[2rem] border border-[#D9E8F5] p-6 shadow-md sm:p-10 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-center lg:p-12">
                            <DashboardArchiveArt className="absolute -top-8 -right-4 w-48 opacity-50" />
                            <div className="relative">
                                <p className="landing-kicker">
                                    Mulai dari satu langkah
                                </p>
                                <h2
                                    id="start-heading"
                                    className="landing-section-title mt-4 max-w-[20ch]"
                                >
                                    Ada ruang untuk karya berikutnya.
                                </h2>
                                <p className="mt-5 max-w-xl text-base leading-7 text-[#526B85]">
                                    {auth.user
                                        ? 'Kembali ke ruang kerjamu dan lanjutkan langkah berikutnya.'
                                        : 'Buat akun mahasiswa, verifikasi afiliasi kampus, dan kenali peluang yang tersedia untukmu.'}
                                </p>
                                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                                    <Link
                                        href={
                                            auth.user ? dashboard() : register()
                                        }
                                        className="landing-primary min-h-12 px-6"
                                        prefetch
                                    >
                                        {auth.user
                                            ? 'Buka beranda'
                                            : 'Mulai sebagai mahasiswa'}
                                        <ArrowRight
                                            aria-hidden="true"
                                            className="size-4"
                                        />
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
                            <Mascot
                                pose="guide"
                                className="relative mx-auto hidden w-64 lg:block"
                            />
                        </LandingReveal>
                    </section>
                </main>

                <noscript>
                    <section className="landing-container py-10">
                        <h2 className="text-2xl font-bold">
                            Alur kolaborasi SATU
                        </h2>
                        <p className="mt-2 text-sm text-[#526B85]">
                            Penjelasan alur tetap dapat dibaca. Aktifkan
                            JavaScript untuk mencoba interaksi.
                        </p>
                        <ol className="mt-5 space-y-4">
                            {LANDING_STAGES.map((stage) => (
                                <li key={stage.key}>
                                    <h3 className="font-semibold">
                                        {stage.index}. {stage.label}
                                    </h3>
                                    <p className="mt-1 text-sm leading-6">
                                        {stage.description}
                                    </p>
                                </li>
                            ))}
                        </ol>
                    </section>
                </noscript>

                <footer className="border-t border-[#D9E8F5] bg-white py-9">
                    <div className="landing-container">
                        <div className="grid gap-6 sm:grid-cols-2 sm:items-start">
                            <div>
                                <AppLogo
                                    compact
                                    logoClassName="size-11 rounded-none shadow-none"
                                    className="text-[#17345A]"
                                />
                                <p className="mt-4 max-w-xs text-sm leading-6 text-[#526B85]">
                                    Sistem Aktivitas Talenta Universitas.
                                    <br />
                                    Ruang untuk kolaborasi dan karya yang punya
                                    konteks.
                                </p>
                            </div>
                            <nav
                                aria-label="Navigasi footer"
                                className="flex flex-wrap gap-x-4 gap-y-1 sm:justify-end"
                            >
                                {navigation.map((item) => (
                                    <a
                                        key={item.href}
                                        href={item.href}
                                        className="landing-nav-link"
                                    >
                                        {item.label}
                                    </a>
                                ))}
                            </nav>
                        </div>
                        <div className="mt-7 flex flex-col justify-between gap-3 border-t border-[#D9E8F5] pt-5 text-xs leading-5 text-[#526B85] sm:flex-row">
                            <p>
                                &copy; {new Date().getFullYear()} SATU Platform.
                            </p>
                            <p className="inline-flex items-center gap-2">
                                <LockKeyhole
                                    aria-hidden="true"
                                    className="size-4 shrink-0"
                                />
                                Portofolio dibagikan dengan izin mahasiswa.
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
