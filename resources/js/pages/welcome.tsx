import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    ArrowUpRight,
    BookOpen,
    Globe2,
    MessageCircle,
    BadgeCheck,
    Check,
    ChevronDown,
    Compass,
    GraduationCap,
    Play,
    Sparkles,
    LockKeyhole,
    Menu,
    ShieldCheck,
    UsersRound,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';
import AppLogo from '@/components/app-logo';
import { DashboardArchiveArt } from '@/components/dashboard-archive-art';
import LandingConceptArt from '@/components/landing-concept-art';
import type { LandingConcept } from '@/components/landing-concept-art';
import LandingJourneyDemo from '@/components/landing-journey-demo';
import LandingMascot from '@/components/landing-mascot';
import LandingNavigationIndicator from '@/components/landing-navigation-indicator';
import LandingReveal from '@/components/landing-reveal';
import { LANDING_STAGES } from '@/components/LandingFlowLedger';
import Mascot from '@/components/mascot';
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
    { href: '#top', label: 'Beranda' },
    { href: '#cara-kerja', label: 'Cara kerja' },
    { href: '#demo', label: 'Coba demo' },
    { href: '#peran', label: 'Untuk siapa' },
    { href: '#pertanyaan', label: 'Tanya jawab' },
];
const audienceTabs = [
    { key: 'student', label: 'Mahasiswa', icon: UsersRound },
    { key: 'campus', label: 'Admin Universitas', icon: ShieldCheck },
] as const;
type AudienceKey = (typeof audienceTabs)[number]['key'];
const audiences: Record<
    AudienceKey,
    {
        title: string;
        description: string;
        boundaries: string[];
        steps: { title: string; description: string }[];
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
        steps: [
            {
                title: 'Kenalkan kemampuanmu',
                description:
                    'Isi minat, kemampuan dan waktu yang tersedia. Karya terdahulu tidak wajib.',
            },
            {
                title: 'Ambil peran dalam tim',
                description:
                    'Temukan peluang, ajukan minat, lalu kerjakan tugas setelah diterima.',
            },
            {
                title: 'Tunjukkan hasil kerjamu',
                description:
                    'Ajukan kontribusi untuk ditinjau dan pilih jangkauan karya yang disetujui.',
            },
        ],
    },
    campus: {
        title: 'Satu ruang untuk mengelola.',
        description:
            'Roster, afiliasi, validasi dan pengaturan dalam satu ruang.',
        boundaries: [
            'Admin pertama melalui deployment. Admin berikutnya diundang lewat WhatsApp.',
            'Tinjauan kontribusi memiliki versi dan alasan keputusan.',
            'Bantuan memerlukan peninjau dan izin, bukan akses otomatis semua admin.',
        ],
        steps: [
            {
                title: 'Pastikan afiliasi mahasiswa',
                description:
                    'Gunakan roster mahasiswa atau tinjau permintaan yang belum cocok.',
            },
            {
                title: 'Baca bukti pekerjaan',
                description:
                    'Tinjau bagian yang dikerjakan mahasiswa pada versi yang diajukan.',
            },
            {
                title: 'Berikan keputusan beralasan',
                description:
                    'Setujui, minta perbaikan atau tolak berdasarkan kontribusi yang diperiksa.',
            },
        ],
    },
};
const outcomes: {
    icon: typeof Compass;
    title: string;
    description: string;
    label: string;
    number: string;
    art: LandingConcept;
}[] = [
    {
        icon: Compass,
        title: 'Temukan tempat untuk mulai.',
        description:
            'Cari proyek dengan peran dan kebutuhan yang jelas, termasuk yang menerima pemula.',
        label: 'Kesempatan',
        number: '01',
        art: 'opportunity',
    },
    {
        icon: UsersRound,
        title: 'Kenal rekan lewat karya.',
        description:
            'Bergabung dalam tim dan ambil bagian lewat pekerjaan yang menjadi tanggung jawabmu.',
        label: 'Kolaborasi',
        number: '02',
        art: 'team',
    },
    {
        icon: BadgeCheck,
        title: 'Pekerjaanmu punya pengakuan.',
        description:
            'Ajukan bukti kontribusi untuk ditinjau kampus, lalu pilih karya yang ingin kamu bagikan.',
        label: 'Pengakuan',
        number: '03',
        art: 'recognition',
    },
];
const questions = (universityName: string | null | undefined) => [
    {
        question: 'Belum punya portofolio. Apakah saya bisa ikut?',
        answer: 'Bisa. Kamu dapat mulai dari minat dan kemampuan yang kamu miliki, lalu mencari peran yang secara jelas menerima pemula. Setelah afiliasi kampus terverifikasi, penelusuran proyek tidak mewajibkan karya terdahulu.',
    },
    {
        question: 'Apakah mengajukan peran berarti langsung diterima?',
        answer: 'Belum. Pemilik proyek meninjau pengajuan berdasarkan kebutuhan peran dan kapasitas tim, lalu memberikan keputusan beralasan. Pengajuan tidak memesan tempat dan rekomendasi bukan jaminan penerimaan.',
    },
    {
        question: 'Apa yang sebenarnya ditinjau oleh kampus?',
        answer: 'Peninjau memeriksa kontribusi individual beserta bukti pada versi yang kamu kirim. Hasilnya dapat berupa persetujuan, permintaan perbaikan atau penolakan beralasan. Persetujuan berlaku untuk kontribusi tersebut, bukan seluruh kemampuan pemiliknya.',
    },
    {
        question: 'Apakah bukti pekerjaan saya otomatis menjadi publik?',
        answer: 'Tidak. Karya dari kontribusi yang disetujui awalnya privat. Kamu memilih jangkauan ringkasan portofolio dan dapat mencabut berbagi. Berkas bukti privat dan percakapan tim tidak otomatis ikut dipublikasikan.',
    },
    {
        question: 'Bagaimana cara mulai menggunakan SATU?',
        answer: `${universityName ? `SATU digunakan oleh mahasiswa ${universityName}.` : 'Informasi universitas belum tersedia. Hubungi pengelola SATU sebelum mengajukan verifikasi mahasiswa.'} Buat akun dengan username dan password, lalu verifikasi nomor WhatsApp. Ajukan NIM untuk pencocokan dengan daftar mahasiswa atau tinjauan Admin Universitas. Setelah afiliasi terverifikasi, kenalkan kemampuanmu dan temukan rekan kolaborasi. Akses Admin Universitas diberikan melalui undangan, bukan pendaftaran umum.`,
    },
];
const visibilityExamples = [
    {
        key: 'private',
        label: 'Hanya saya',
        title: 'Disimpan untuk diri sendiri.',
        description:
            'Orang lain tidak melihat ringkasan karya ini melalui portofoliomu.',
    },
    {
        key: 'public',
        label: 'Publik',
        title: 'Ringkasan karya dapat dilihat publik.',
        description:
            'Pengunjung dapat membaca ringkasan yang dibagikan. Bukti privat tetap tidak ikut ditampilkan.',
    },
] as const;
const visibilityIcons = {
    private: LockKeyhole,
    public: Globe2,
};

export default function Welcome() {
    const { auth, publicUniversity } = usePage<{
        publicUniversity?: { name: string | null };
    }>().props;
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeSection, setActiveSection] = useState(navigation[0].href);
    const pendingSection = useRef<string | null>(null);
    const [visibilityExample, setVisibilityExample] = useState<
        (typeof visibilityExamples)[number]
    >(visibilityExamples[0]);
    const [activeAudience, setActiveAudience] =
        useState<AudienceKey>('student');
    const audience = audiences[activeAudience];
    const VisibilityIcon = visibilityIcons[visibilityExample.key];

    useEffect(() => {
        const surface = document.querySelector('[data-landing-surface]');
        let frame = 0;
        let scrollIdleTimer = 0;
        let disposed = false;

        function updateActiveSection() {
            frame = 0;
            const header = document.querySelector('.landing-header');
            const readingLine =
                (header?.getBoundingClientRect().bottom ?? 0) + 24;
            let current = navigation[0].href;

            for (const { href } of navigation) {
                const element = document.getElementById(href.slice(1));

                if (
                    element?.isConnected &&
                    element.getClientRects().length > 0 &&
                    element.getBoundingClientRect().top <= readingLine
                ) {
                    current = href;
                }
            }

            if (pendingSection.current && pendingSection.current !== current) {
                return;
            }

            pendingSection.current = null;
            setActiveSection(current);
        }

        function scheduleUpdate() {
            if (!disposed && frame === 0) {
                frame = window.requestAnimationFrame(updateActiveSection);
            }
        }

        function releasePendingSection() {
            pendingSection.current = null;
            window.clearTimeout(scrollIdleTimer);
            scheduleUpdate();
        }

        function handleScroll() {
            window.clearTimeout(scrollIdleTimer);
            const target = pendingSection.current;

            if (target) {
                scrollIdleTimer = window.setTimeout(() => {
                    if (pendingSection.current === target) {
                        releasePendingSection();
                    }
                }, 160);
            }

            scheduleUpdate();
        }

        function handleScrollKey(event: globalThis.KeyboardEvent) {
            if (
                [
                    'ArrowUp',
                    'ArrowDown',
                    'PageUp',
                    'PageDown',
                    'Home',
                    'End',
                    ' ',
                ].includes(event.key)
            ) {
                releasePendingSection();
            }
        }

        function handleHistoryNavigation() {
            if (window.location.hash !== pendingSection.current) {
                releasePendingSection();
            } else {
                scheduleUpdate();
            }
        }

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('wheel', releasePendingSection, {
            passive: true,
        });
        window.addEventListener('touchstart', releasePendingSection, {
            passive: true,
        });
        window.addEventListener('pointerdown', releasePendingSection);
        window.addEventListener('keydown', handleScrollKey);
        window.addEventListener('popstate', handleHistoryNavigation);
        window.addEventListener('resize', releasePendingSection);
        window.addEventListener('hashchange', scheduleUpdate);
        window.addEventListener('pageshow', scheduleUpdate);
        window.addEventListener('load', scheduleUpdate);

        const resizeObserver = new ResizeObserver(scheduleUpdate);

        function observeLayout() {
            resizeObserver.disconnect();

            for (const element of [
                surface,
                document.querySelector('.landing-header'),
                ...navigation.map(({ href }) =>
                    document.getElementById(href.slice(1)),
                ),
            ]) {
                if (element) {
                    resizeObserver.observe(element);
                }
            }

            scheduleUpdate();
        }

        const contentObserver = new MutationObserver(observeLayout);

        if (surface) {
            contentObserver.observe(surface, {
                childList: true,
                subtree: true,
            });
        }

        observeLayout();
        void document.fonts.ready.then(scheduleUpdate);

        return () => {
            disposed = true;
            window.cancelAnimationFrame(frame);
            window.clearTimeout(scrollIdleTimer);
            resizeObserver.disconnect();
            contentObserver.disconnect();
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('wheel', releasePendingSection);
            window.removeEventListener('touchstart', releasePendingSection);
            window.removeEventListener('pointerdown', releasePendingSection);
            window.removeEventListener('keydown', handleScrollKey);
            window.removeEventListener('popstate', handleHistoryNavigation);
            window.removeEventListener('resize', releasePendingSection);
            window.removeEventListener('hashchange', scheduleUpdate);
            window.removeEventListener('pageshow', scheduleUpdate);
            window.removeEventListener('load', scheduleUpdate);
        };
    }, []);

    function selectSection(href: string) {
        pendingSection.current = href;
        setActiveSection(href);
    }

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
                className="landing-editorial landing-studio relative isolate min-h-screen bg-[#F3F9FF] text-[#17345A] selection:bg-[#B9D9FF]"
                style={landingTheme}
            >
                <a
                    href="#main"
                    className="sr-only z-[100] rounded-xl bg-white px-4 py-3 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
                >
                    Langsung ke konten utama
                </a>
                <header
                    className="landing-header @container sticky top-0 z-50"
                    onKeyDown={(event) => {
                        if (event.key === 'Escape' && isMenuOpen) {
                            event.preventDefault();
                            closeMenu(true);
                        }
                    }}
                >
                    <div className="landing-header-inner landing-container flex items-center justify-between gap-3">
                        <a
                            href="#top"
                            aria-label="SATU, kembali ke awal halaman"
                            className="inline-flex min-h-11 shrink-0 items-center rounded-xl"
                        >
                            <AppLogo
                                compact
                                logoClassName="size-9 rounded-full bg-white shadow-none"
                                className="landing-header-brand gap-2.5 text-[#152C4B]"
                            />
                        </a>
                        <nav
                            aria-label="Navigasi landing"
                            className="landing-header-links hidden items-center gap-1 @min-[72rem]:flex"
                        >
                            <LandingNavigationIndicator
                                activeHref={activeSection}
                            />
                            {navigation.map((item) => (
                                <a
                                    key={item.href}
                                    href={item.href}
                                    className="landing-nav-link"
                                    aria-current={
                                        item.href === activeSection
                                            ? 'location'
                                            : undefined
                                    }
                                    onClick={() => selectSection(item.href)}
                                >
                                    {item.label}
                                </a>
                            ))}
                        </nav>
                        <div className="flex shrink-0 items-center gap-2">
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="landing-primary landing-header-cta"
                                    prefetch
                                >
                                    <span className="sm:hidden">Beranda</span>
                                    <span className="hidden sm:inline">
                                        Buka beranda
                                    </span>
                                    <span
                                        className="landing-header-arrow hidden sm:grid"
                                        aria-hidden="true"
                                    >
                                        <ArrowUpRight className="size-4" />
                                    </span>
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="landing-nav-link landing-header-login"
                                    >
                                        Masuk
                                    </Link>
                                    <Link
                                        href={register()}
                                        className="landing-primary landing-header-cta hidden @min-[48rem]:inline-flex"
                                        prefetch
                                    >
                                        Daftar mahasiswa
                                        <span
                                            className="landing-header-arrow"
                                            aria-hidden="true"
                                        >
                                            <ArrowUpRight className="size-4" />
                                        </span>
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
                                className="inline-flex size-11 items-center justify-center rounded-full border border-[#D9E8F5] bg-white text-[#17345A] @min-[72rem]:hidden"
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
                        className="landing-mobile-menu bg-white @min-[72rem]:hidden"
                    >
                        <div className="landing-container grid max-h-[calc(100dvh-5rem)] gap-1 overflow-y-auto py-3">
                            {navigation.map((item) => (
                                <a
                                    key={item.href}
                                    href={item.href}
                                    className="landing-nav-link"
                                    aria-current={
                                        item.href === activeSection
                                            ? 'location'
                                            : undefined
                                    }
                                    onClick={() => {
                                        selectSection(item.href);
                                        closeMenu(true);
                                    }}
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
                                    className="landing-primary landing-header-cta mt-2"
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
                                    <h1
                                        id="landing-heading"
                                        className="landing-hero-title"
                                    >
                                        Ada ruang untuk
                                        <span className="landing-hero-emphasis">
                                            kemampuanmu.
                                        </span>
                                    </h1>
                                    <p className="landing-hero-description mt-6 max-w-[43ch] text-[#526B85]">
                                        Temukan peran yang sesuai, berkarya
                                        bersama rekan baru, dan buktikan
                                        kontribusimu.
                                    </p>
                                    <div className="landing-hero-actions mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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
                                            Coba demo
                                            <Play
                                                aria-hidden="true"
                                                className="size-4"
                                            />
                                        </a>
                                    </div>
                                    <p className="landing-hero-reassurance mt-5 flex items-start gap-2 text-sm leading-6 text-[#526B85]">
                                        <ShieldCheck
                                            aria-hidden="true"
                                            className="mt-0.5 size-4 shrink-0 text-[#1764E8]"
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
                            <ChevronDown
                                aria-hidden="true"
                                className="size-4"
                            />
                        </a>
                    </section>

                    <section
                        id="cara-kerja"
                        aria-labelledby="benefits-heading"
                        className="landing-benefits landing-container scroll-mt-28"
                    >
                        <LandingReveal className="landing-section-intro">
                            <div>
                                <p className="landing-kicker">
                                    <span className="landing-section-index">
                                        01
                                    </span>
                                    Langkah kecil, ruang baru
                                </p>
                                <h2
                                    id="benefits-heading"
                                    className="landing-section-title mt-4"
                                >
                                    Bukan harus dikenal dulu.
                                    <br />
                                    <span className="text-[#1764E8]">
                                        Mulai dari yang bisa kamu lakukan.
                                    </span>
                                </h2>
                            </div>
                            <p className="landing-section-description">
                                Dari kesempatan pertama, sampai pekerjaan yang
                                dapat kamu ceritakan dengan bukti.
                            </p>
                        </LandingReveal>
                        <div
                            id="fitur"
                            className="landing-benefit-grid scroll-mt-28"
                        >
                            {outcomes.map(
                                (
                                    {
                                        icon: Icon,
                                        title,
                                        description,
                                        label,
                                        number,
                                        art,
                                    },
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
                                            <Icon
                                                aria-hidden="true"
                                                className="size-5"
                                            />
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
                                                <span className="sr-only">
                                                    : {label}
                                                </span>
                                            </a>
                                        </div>
                                    </LandingReveal>
                                ),
                            )}
                        </div>
                    </section>

                    <section
                        id="demo"
                        aria-labelledby="demo-heading"
                        className="landing-section landing-demo-section"
                    >
                        <div className="landing-container">
                            <LandingReveal className="landing-section-intro">
                                <div>
                                    <p className="landing-kicker">
                                        <span className="landing-section-index">
                                            02
                                        </span>
                                        Coba sendiri, tanpa membuat akun
                                    </p>
                                    <h2
                                        id="demo-heading"
                                        className="landing-section-title mt-4"
                                    >
                                        Dari peran pertama,
                                        <br />
                                        <span className="text-[#1764E8]">
                                            sampai karya yang diakui.
                                        </span>
                                    </h2>
                                    <p className="mt-5 max-w-2xl text-base leading-7 text-[#526B85]">
                                        Budi baru belajar desain dan belum punya
                                        karya. Ikuti caranya menemukan tim,
                                        mengambil peran, dan mencatat kontribusi
                                        pertamanya.
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
                                        <p className="text-sm font-bold text-[#1454C4]">
                                            Kamu yang pegang alurnya.
                                        </p>
                                        <p className="mt-2 text-sm leading-6 text-[#526B85]">
                                            Pilih tahap, lanjutkan cerita, atau
                                            coba kemungkinan lain. Semua memakai
                                            data synthetic.
                                        </p>
                                    </div>
                                </div>
                            </LandingReveal>
                            <div className="mt-9">
                                <LandingJourneyDemo />
                            </div>
                        </div>
                    </section>

                    <div className="landing-lower">
                        <section
                            id="peran"
                            aria-labelledby="roles-heading"
                            className="landing-section landing-roles"
                        >
                            <div className="landing-container">
                                <div className="landing-section-intro">
                                    <LandingReveal className="landing-role-intro">
                                        <p className="landing-kicker">
                                            <span className="landing-section-index">
                                                03
                                            </span>
                                            Berbeda peran, satu tujuan
                                        </p>
                                        <h2
                                            id="roles-heading"
                                            className="landing-section-title mt-4"
                                        >
                                            Mahasiswa berkarya.
                                            <br />
                                            <span className="text-[#1764E8]">
                                                Kampus melihat buktinya.
                                            </span>
                                        </h2>
                                        <p className="mt-5 text-base leading-7 text-[#526B85]">
                                            Dua peran yang saling melengkapi.
                                            Pilih untuk melihat cara
                                            masing-masing mendukung perjalanan
                                            ini.
                                        </p>
                                    </LandingReveal>
                                    <LandingReveal className="landing-role-bridge">
                                        <div aria-hidden="true">
                                            <p className="landing-role-bridge-caption">
                                                SATU RUANG KOLABORASI
                                            </p>
                                            <div className="landing-role-bridge-pair">
                                                <span>
                                                    <GraduationCap />
                                                    <strong>Mahasiswa</strong>
                                                    <small>
                                                        Mengambil peran
                                                    </small>
                                                </span>
                                                <span className="landing-role-bridge-connector">
                                                    <ArrowRight />
                                                </span>
                                                <span>
                                                    <ShieldCheck />
                                                    <strong>
                                                        Admin Universitas
                                                    </strong>
                                                    <small>
                                                        Meninjau kontribusi
                                                    </small>
                                                </span>
                                            </div>
                                            <p className="landing-role-bridge-bottom">
                                                Kesempatan bertemu pengakuan.
                                            </p>
                                        </div>
                                    </LandingReveal>
                                </div>
                                <div
                                    role="tablist"
                                    aria-label="Pilih peran di SATU"
                                    className="landing-audience-tabs mt-8 flex flex-wrap gap-2"
                                >
                                    {audienceTabs.map((tab, index) => {
                                        const Icon = tab.icon;
                                        const active =
                                            tab.key === activeAudience;

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
                                                className="landing-control landing-role-tab"
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
                                    className="landing-role-panel mt-6"
                                >
                                    <div
                                        key={activeAudience}
                                        className="landing-panel-enter grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] lg:items-center lg:gap-16"
                                    >
                                        <div className="landing-role-copy min-w-0">
                                            <div
                                                className="landing-role-mark"
                                                aria-hidden="true"
                                            >
                                                {activeAudience ===
                                                'student' ? (
                                                    <UsersRound />
                                                ) : (
                                                    <ShieldCheck />
                                                )}
                                                <span>
                                                    {activeAudience ===
                                                    'student'
                                                        ? 'Ruang mahasiswa'
                                                        : 'Admin Universitas'}
                                                </span>
                                            </div>
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
                                        <div className="landing-role-path">
                                            <p className="landing-role-path-caption">
                                                <BookOpen
                                                    aria-hidden="true"
                                                    className="size-4"
                                                />
                                                {activeAudience === 'student'
                                                    ? 'Dari bekal ke pengakuan'
                                                    : 'Dari afiliasi ke keputusan'}
                                            </p>
                                            <ol className="landing-role-steps min-w-0 self-center">
                                                {audience.steps.map(
                                                    (step, index) => (
                                                        <li
                                                            key={step.title}
                                                            className="landing-role-step"
                                                        >
                                                            <span className="landing-role-number">
                                                                {index + 1}
                                                            </span>
                                                            <div className="min-w-0 pt-1">
                                                                <h4 className="text-lg font-bold">
                                                                    {step.title}
                                                                </h4>
                                                                <p className="mt-2 max-w-lg text-sm leading-6 text-[#526B85]">
                                                                    {
                                                                        step.description
                                                                    }
                                                                </p>
                                                            </div>
                                                        </li>
                                                    ),
                                                )}
                                            </ol>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </section>

                        <section
                            id="privasi"
                            aria-labelledby="privacy-heading"
                            className="landing-section landing-privacy"
                        >
                            <div className="landing-container landing-privacy-grid">
                                <LandingReveal className="landing-privacy-copy">
                                    <span className="landing-privacy-mark">
                                        <LockKeyhole
                                            aria-hidden="true"
                                            className="size-6"
                                        />
                                    </span>
                                    <p className="landing-kicker mt-5">
                                        <span className="landing-section-index">
                                            04
                                        </span>
                                        Kendali tetap di tanganmu
                                    </p>
                                    <h2
                                        id="privacy-heading"
                                        className="landing-section-title mt-4"
                                    >
                                        Karyamu terlihat
                                        <br />
                                        <span className="text-[#1764E8]">
                                            sesuai pilihanmu.
                                        </span>
                                    </h2>
                                    <p className="mt-5 text-base leading-7 text-[#526B85]">
                                        Kampus meninjau kontribusimu. Kamu yang
                                        menentukan apakah ringkasan karyanya
                                        akan dibagikan.
                                    </p>
                                    <ul className="landing-privacy-rules">
                                        <li>
                                            <span className="landing-privacy-rule-icon">
                                                <BookOpen
                                                    aria-hidden="true"
                                                    className="size-5"
                                                />
                                            </span>
                                            <div>
                                                <h3>Ringkasan karya</h3>
                                                <p>
                                                    Jangkauan dibagikan sesuai
                                                    pilihanmu.
                                                </p>
                                            </div>
                                        </li>
                                        <li>
                                            <span className="landing-privacy-rule-icon">
                                                <LockKeyhole
                                                    aria-hidden="true"
                                                    className="size-5"
                                                />
                                            </span>
                                            <div>
                                                <h3>Bukti dan percakapan</h3>
                                                <p>
                                                    Tidak ikut menjadi isi
                                                    portofolio publik.
                                                </p>
                                            </div>
                                        </li>
                                    </ul>
                                </LandingReveal>
                                <LandingReveal className="landing-visibility min-w-0">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold">
                                            Coba pilihan berbagi
                                        </h3>
                                        <span className="collaboration-synthetic-label">
                                            Data synthetic
                                        </span>
                                    </div>
                                    <p className="mt-2 text-sm leading-6 text-[#526B85]">
                                        Pilih jangkauan dan lihat siapa yang
                                        dapat membaca ringkasan karya.
                                    </p>
                                    <div
                                        className="landing-visibility-options"
                                        role="group"
                                        aria-label="Simulasi jangkauan karya"
                                    >
                                        {visibilityExamples.map((example) => {
                                            const ExampleIcon =
                                                visibilityIcons[example.key];

                                            return (
                                                <button
                                                    key={example.key}
                                                    type="button"
                                                    aria-pressed={
                                                        visibilityExample.key ===
                                                        example.key
                                                    }
                                                    className="landing-control landing-visibility-option"
                                                    onClick={() =>
                                                        setVisibilityExample(
                                                            example,
                                                        )
                                                    }
                                                >
                                                    <ExampleIcon
                                                        aria-hidden="true"
                                                        className="size-4 shrink-0"
                                                    />
                                                    {visibilityExample.key ===
                                                        example.key && (
                                                        <Check
                                                            aria-hidden="true"
                                                            className="landing-visibility-check size-3.5 shrink-0"
                                                        />
                                                    )}
                                                    {example.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <div className="landing-visibility-paper mt-5">
                                        <div
                                            className="landing-folio-cover"
                                            aria-hidden="true"
                                        >
                                            <BookOpen className="size-12" />
                                            <span>
                                                ARSIP KARYA
                                                <br />
                                                BUDI / 001
                                            </span>
                                            <DashboardArchiveArt className="landing-folio-archive" />
                                        </div>
                                        <div className="landing-folio-meta">
                                            <p className="mt-5 text-xs font-semibold text-[#526B85]">
                                                Karya Budi / contoh
                                            </p>
                                            <span className="landing-folio-audience">
                                                <VisibilityIcon
                                                    aria-hidden="true"
                                                    className="size-3.5"
                                                />
                                                {visibilityExample.label}
                                            </span>
                                        </div>
                                        <h4 className="mt-2 text-xl font-bold">
                                            Rancangan alur peminjaman
                                        </h4>
                                        <p className="mt-3 flex items-center gap-2 text-sm text-[#1454C4]">
                                            <BadgeCheck
                                                aria-hidden="true"
                                                className="size-4 shrink-0"
                                            />
                                            Bersumber dari kontribusi yang
                                            disetujui pada contoh.
                                        </p>
                                        <div
                                            role="status"
                                            aria-live="polite"
                                            aria-atomic="true"
                                            className="landing-visibility-result"
                                        >
                                            <span className="landing-visibility-result-icon">
                                                <VisibilityIcon
                                                    aria-hidden="true"
                                                    className="size-5"
                                                />
                                            </span>
                                            <div>
                                                <p className="font-semibold">
                                                    {visibilityExample.title}
                                                </p>
                                                <p className="mt-2 text-sm leading-6 text-[#526B85]">
                                                    {
                                                        visibilityExample.description
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="mt-4 flex items-start gap-2 text-xs leading-6 text-[#526B85]">
                                        <LockKeyhole
                                            aria-hidden="true"
                                            className="mt-1 size-4 shrink-0"
                                        />
                                        Hanya simulasi. Tidak mengubah izin
                                        akun. Berkas bukti dan percakapan tim
                                        tidak ikut dipublikasikan.
                                    </p>
                                </LandingReveal>
                            </div>
                        </section>

                        <section
                            id="pertanyaan"
                            aria-labelledby="faq-heading"
                            className="landing-section landing-questions"
                        >
                            <div className="landing-container landing-faq-grid">
                                <LandingReveal className="landing-faq-intro">
                                    <p className="landing-kicker">
                                        <span className="landing-section-index">
                                            05
                                        </span>
                                        Sebelum mulai
                                    </p>
                                    <h2
                                        id="faq-heading"
                                        className="landing-section-title mt-4"
                                    >
                                        Masih ada yang
                                        <br />
                                        <span className="text-[#1764E8]">
                                            ingin kamu tahu?
                                        </span>
                                    </h2>
                                    <p className="mt-5 max-w-sm text-base leading-7 text-[#526B85]">
                                        Beberapa jawaban untuk menemani langkah
                                        pertamamu di SATU.
                                    </p>
                                    <div className="landing-faq-note">
                                        <MessageCircle
                                            aria-hidden="true"
                                            className="size-5 shrink-0"
                                        />
                                        <div>
                                            <p>
                                                Ingin melihat contoh nyatanya?
                                            </p>
                                            <a href="#demo">
                                                Jelajahi demo perjalanan
                                                <ArrowUpRight
                                                    aria-hidden="true"
                                                    className="size-4"
                                                />
                                            </a>
                                        </div>
                                    </div>
                                </LandingReveal>
                                <div className="landing-faq-list min-w-0">
                                    {questions(publicUniversity?.name).map(
                                        ({ question, answer }, index) => (
                                            <details
                                                key={question}
                                                className="landing-faq group"
                                            >
                                                <summary>
                                                    <span
                                                        aria-hidden="true"
                                                        className="landing-faq-number"
                                                    >
                                                        {String(
                                                            index + 1,
                                                        ).padStart(2, '0')}
                                                    </span>
                                                    <span>{question}</span>
                                                    <ChevronDown
                                                        aria-hidden="true"
                                                        className="size-5 shrink-0 text-[#1764E8] transition-transform duration-220 group-open:rotate-180 motion-reduce:transition-none"
                                                    />
                                                </summary>
                                                <p className="max-w-2xl pb-5 text-sm leading-7 text-[#526B85]">
                                                    {answer}
                                                </p>
                                            </details>
                                        ),
                                    )}
                                </div>
                            </div>
                        </section>

                        <section
                            aria-labelledby="start-heading"
                            className="landing-container landing-start"
                        >
                            <LandingReveal className="landing-closing relative isolate grid gap-6 overflow-hidden text-white lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.5fr)] lg:items-center">
                                <div className="landing-closing-copy relative">
                                    <p className="flex items-center gap-2 text-sm font-semibold text-[#C7E1FF]">
                                        <Sparkles
                                            aria-hidden="true"
                                            className="size-4"
                                        />
                                        Mulai dari satu langkah
                                    </p>
                                    <h2
                                        id="start-heading"
                                        className="landing-section-title mt-4 max-w-[20ch]"
                                    >
                                        Satu peran bisa jadi awal ceritamu.
                                    </h2>
                                    <p className="mt-5 max-w-xl text-base leading-7 text-[#D9E8F5]">
                                        {auth.user
                                            ? 'Kembali ke ruang kerjamu dan lanjutkan langkah berikutnya.'
                                            : 'Buat akun mahasiswa, verifikasi afiliasi kampus, dan kenali peluang yang tersedia untukmu.'}
                                    </p>
                                    <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                                        <Link
                                            href={
                                                auth.user
                                                    ? dashboard()
                                                    : register()
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
                    </div>
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

                <footer className="landing-footer">
                    <div className="landing-container">
                        <div className="landing-footer-top">
                            <div>
                                <AppLogo
                                    compact
                                    logoClassName="size-11 rounded-none shadow-none"
                                    className="text-[#17345A]"
                                />
                                <p className="mt-4 max-w-xs text-sm leading-6 text-[#526B85]">
                                    Sistem Aktivitas Talenta Universitas.
                                    <br />
                                    Kesempatan berkolaborasi. Pengakuan berbasis
                                    kontribusi.
                                </p>
                            </div>
                            <div className="landing-footer-links">
                                <p className="landing-footer-label">
                                    Jelajahi SATU
                                </p>
                                <nav
                                    aria-label="Navigasi footer"
                                    className="landing-footer-navigation"
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
                            <div className="landing-footer-note">
                                <GraduationCap
                                    aria-hidden="true"
                                    className="size-5 text-[#1764E8]"
                                />
                                <p className="landing-footer-label">
                                    Ruang kolaborasi mahasiswa
                                </p>
                                <p className="landing-footer-university">
                                    {publicUniversity?.name ||
                                        'Informasi universitas belum tersedia.'}
                                </p>
                                <p className="text-sm leading-6 text-[#526B85]">
                                    Kenali kemampuan. Temukan peran. Bangun
                                    karya.
                                </p>
                            </div>
                        </div>
                        <div className="landing-footer-bottom">
                            <p>
                                &copy; {new Date().getFullYear()} SATU Platform.
                            </p>
                            <a href="#top" className="landing-footer-back">
                                Kembali ke atas
                                <ArrowUpRight
                                    aria-hidden="true"
                                    className="size-4"
                                />
                            </a>
                            <p className="inline-flex items-center gap-2">
                                <LockKeyhole
                                    aria-hidden="true"
                                    className="size-4 shrink-0"
                                />
                                Portofolio dibagikan dengan izin mahasiswa.
                            </p>
                        </div>
                    </div>
                    <div aria-hidden="true" className="landing-footer-wordmark">
                        SATU<span>.</span>
                    </div>
                </footer>
            </div>
        </>
    );
}
