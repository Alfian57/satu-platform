import { Link } from '@inertiajs/react';
import { ArrowRight, ArrowUpRight, Menu, X } from 'lucide-react';
import AppLogo from '@/layouts/_components/app-logo';
import LandingNavigationIndicator from '@/pages/welcome/_components/landing-navigation-indicator';
import { dashboard, login, register } from '@/routes';

interface WelcomeNavigationProps {
    navigation: readonly { href: string; label: string }[];
    activeSection: string;
    isMenuOpen: boolean;
    auth: { user?: unknown };
    onSelectSection: (href: string) => void;
    onToggleMenu: () => void;
    onCloseMenu: (restoreFocus?: boolean) => void;
}

export default function WelcomeNavigation({
    navigation,
    activeSection,
    isMenuOpen,
    auth,
    onSelectSection,
    onToggleMenu,
    onCloseMenu,
}: WelcomeNavigationProps) {
    return (
        <>
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
                        onCloseMenu(true);
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
                            className="landing-header-brand gap-2.5 text-satu-ink"
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
                                onClick={() => onSelectSection(item.href)}
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
                                isMenuOpen ? 'Tutup navigasi' : 'Buka navigasi'
                            }
                            aria-expanded={isMenuOpen}
                            aria-controls="landing-mobile-navigation"
                            className="inline-flex size-11 cursor-pointer items-center justify-center rounded-full border border-satu-border-soft bg-white text-satu-ink @min-[72rem]:hidden"
                            onClick={onToggleMenu}
                        >
                            {isMenuOpen ? (
                                <X aria-hidden="true" className="size-5" />
                            ) : (
                                <Menu aria-hidden="true" className="size-5" />
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
                                    onSelectSection(item.href);
                                    onCloseMenu(true);
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
        </>
    );
}
