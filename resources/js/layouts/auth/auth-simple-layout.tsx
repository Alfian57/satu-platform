import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowUpRight, ShieldCheck } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import AuthWelcomePanel from '@/components/auth/auth-welcome-panel';
import Mascot from '@/components/mascot';
import { cn } from '@/lib/utils';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { component } = usePage();
    const isWelcome =
        component === 'auth/login' || component === 'auth/register';
    const isSecurityStep =
        component === 'auth/recover' || component === 'auth/confirm-password';
    const mascotPose = isWelcome
        ? 'welcome'
        : isSecurityStep
          ? 'peek'
          : 'guide';

    return (
        <div
            className={cn(
                'relative min-h-svh overflow-x-clip bg-[#edf6ff]',
                isWelcome && 'satu-auth-entry',
                component === 'auth/login' && 'auth-entry-login',
            )}
        >
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(ellipse_at_top_left,#c9eaff,transparent_65%)]"
            />
            <header
                className={
                    isWelcome
                        ? 'auth-entry-header relative mx-auto'
                        : 'relative mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-5 py-6 sm:px-10 lg:px-16'
                }
            >
                <Link
                    href={home()}
                    aria-label="SATU: Beranda"
                    className="cursor-pointer rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                >
                    <AppLogo compact />
                </Link>
                <div
                    className={isWelcome ? 'auth-entry-navigation' : 'contents'}
                >
                    <Link
                        href={home()}
                        className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-white hover:text-primary"
                    >
                        <ArrowLeft aria-hidden="true" className="size-4" />
                        Kembali ke beranda
                    </Link>
                </div>
            </header>

            <main
                className={
                    isWelcome
                        ? 'auth-entry-main relative mx-auto grid'
                        : 'relative mx-auto grid min-h-[calc(100svh-104px)] max-w-[1320px] items-center gap-6 px-5 pb-10 sm:px-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:px-12 lg:py-12'
                }
            >
                <section
                    aria-label="Selamat datang di SATU"
                    className={
                        isWelcome
                            ? 'relative min-w-0 lg:self-stretch'
                            : 'relative lg:self-stretch lg:pt-8'
                    }
                >
                    {isWelcome ? (
                        <AuthWelcomePanel
                            isRegistration={component === 'auth/register'}
                        />
                    ) : (
                        <>
                            <div className="hidden lg:block">
                                <span className="inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/75 px-4 py-2 text-xs font-semibold text-blue-800">
                                    <span
                                        aria-hidden="true"
                                        className="size-2 rounded-full bg-blue-600"
                                    />
                                    Satu tempat, banyak kemungkinan
                                </span>
                                <h2 className="mt-6 max-w-[12ch] text-5xl leading-[1.04] font-bold tracking-[-0.04em] text-slate-950 xl:text-6xl">
                                    Langkah kecil.
                                    <br />
                                    <span className="text-blue-600">
                                        Cerita besar.
                                    </span>
                                </h2>
                                <p className="mt-5 max-w-sm text-base leading-7 text-slate-600">
                                    Temukan teman berkarya, bangun kontribusi,
                                    dan ceritakan kemampuanmu lewat bukti nyata.
                                </p>
                            </div>

                            <div className="relative mx-auto mt-8 h-32 w-full max-w-sm lg:mt-20 lg:h-60 lg:max-w-none">
                                <div
                                    aria-hidden="true"
                                    className="absolute inset-x-5 bottom-0 h-24 rounded-[2rem] border border-white/80 bg-gradient-to-br from-[#b9e6ff] to-[#87c9f6] shadow-[0_20px_45px_-20px_rgba(40,109,179,0.32)] lg:inset-x-0 lg:h-48"
                                />
                                <Mascot
                                    pose={mascotPose}
                                    interactive
                                    priority
                                    className="absolute -top-12 left-1/2 z-10 w-44 -translate-x-1/2 lg:-top-24 lg:left-[56%] lg:w-[21rem] xl:w-[23rem]"
                                />
                                <div className="absolute bottom-5 left-3 z-20 hidden max-w-40 -rotate-3 rounded-2xl border border-white bg-white/90 px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm lg:block">
                                    {isWelcome
                                        ? 'Siap mulai cerita kolaborasimu?'
                                        : 'Pelan-pelan, kita lanjutkan bersama.'}
                                    <ArrowUpRight
                                        aria-hidden="true"
                                        className="mt-2 size-4 text-blue-600"
                                    />
                                </div>
                            </div>
                            <p className="mt-7 hidden items-center gap-2 text-xs leading-5 text-slate-600 lg:flex">
                                <ShieldCheck
                                    aria-hidden="true"
                                    className="size-4 shrink-0 text-blue-700"
                                />
                                Kamu yang menentukan siapa yang melihat
                                portofoliomu.
                            </p>
                        </>
                    )}
                </section>

                <div
                    className={
                        isWelcome
                            ? 'auth-entry-form relative mx-auto w-full'
                            : 'relative mx-auto w-full max-w-[30rem]'
                    }
                >
                    <section
                        className={cn(
                            'auth-entry-card rounded-[2rem] border border-white bg-white/95 shadow-[0_24px_80px_-32px_rgba(31,88,149,0.3)]',
                            !isWelcome && 'p-6 sm:p-9',
                        )}
                    >
                        <div
                            className={cn(
                                'auth-entry-form-header',
                                !isWelcome && 'mb-7',
                            )}
                        >
                            <p
                                className={cn(
                                    'auth-entry-kicker text-xs font-bold tracking-[0.14em] text-blue-700 uppercase',
                                    !isWelcome && 'mb-3',
                                )}
                            >
                                Ruang kolaborasimu
                            </p>
                            <h1
                                className={cn(
                                    'auth-entry-title font-bold tracking-[-0.035em] text-slate-950',
                                    !isWelcome && 'text-3xl leading-tight',
                                )}
                            >
                                {title}
                            </h1>
                            <p
                                className={cn(
                                    'auth-entry-description text-slate-600',
                                    !isWelcome && 'mt-3 text-sm leading-6',
                                )}
                            >
                                {description}
                            </p>
                        </div>
                        <div
                            className={cn(
                                'auth-entry-fields [&_input:not([type=checkbox])]:border-input [&_input:not([type=checkbox])]:bg-white [&_input:not([type=checkbox])]:text-base [&_label]:text-slate-700',
                                isWelcome
                                    ? '[&_button[type=submit]]:min-h-[var(--auth-control-height,2.75rem)] [&_button[type=submit]]:rounded-xl [&_button[type=submit]]:text-[length:var(--auth-control-font,0.875rem)] [&_input:not([type=checkbox])]:min-h-[var(--auth-control-height,2.75rem)] [&_input:not([type=checkbox])]:rounded-xl [&_label]:text-[length:var(--auth-control-font,0.875rem)] [&_p[id$="help"]]:text-[length:var(--auth-help-font,0.75rem)]'
                                    : '[&_button[type=submit]]:min-h-12 [&_button[type=submit]]:rounded-md [&_input:not([type=checkbox])]:min-h-12 [&_input:not([type=checkbox])]:rounded-md',
                            )}
                        >
                            {children}
                        </div>
                    </section>
                    <p
                        className={cn(
                            'auth-entry-footer text-center text-xs text-slate-600',
                            !isWelcome && 'mt-6',
                        )}
                    >
                        SATU. Tempat kolaborasi menjadi berarti.
                    </p>
                </div>
            </main>
        </div>
    );
}
