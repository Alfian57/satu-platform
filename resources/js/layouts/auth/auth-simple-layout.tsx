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
    const isConfirmation = component === 'auth/confirm-password';
    const usesEntryLayout =
        component === 'auth/login' ||
        component === 'auth/register' ||
        isConfirmation;
    const isSecurityStep =
        component === 'auth/recover' || component === 'auth/confirm-password';
    const mascotPose = usesEntryLayout
        ? 'welcome'
        : isSecurityStep
          ? 'peek'
          : 'guide';

    return (
        <div
            className={cn(
                'relative flex h-svh max-h-svh min-h-svh flex-col overflow-x-hidden overflow-y-auto bg-[#edf6ff] lg:overflow-hidden',
                usesEntryLayout && 'satu-auth-entry',
                component === 'auth/login' && 'auth-entry-login',
                component === 'auth/register' && 'auth-entry-register',
                isConfirmation && 'auth-entry-confirm',
            )}
        >
            {usesEntryLayout ? (
                <img
                    src="/images/auth-entry-background.webp"
                    alt=""
                    aria-hidden="true"
                    width={1672}
                    height={941}
                    className="auth-entry-backdrop"
                />
            ) : (
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(ellipse_at_top_left,#c9eaff,transparent_65%)]"
                />
            )}
            <header
                className={
                    usesEntryLayout
                        ? 'auth-entry-header relative mx-auto shrink-0'
                        : 'relative mx-auto flex w-full max-w-[1440px] shrink-0 items-center justify-between gap-4 px-5 py-4 sm:px-10 lg:px-16 lg:py-3'
                }
            >
                <Link
                    href={home()}
                    aria-label="SATU: Beranda"
                    className="cursor-pointer rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                >
                    <AppLogo
                        compact
                        className={
                            usesEntryLayout ? 'auth-entry-brand' : undefined
                        }
                        logoClassName={
                            usesEntryLayout ? 'auth-entry-logo' : undefined
                        }
                    />
                </Link>
                <div
                    className={
                        usesEntryLayout ? 'auth-entry-navigation' : 'contents'
                    }
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
                    usesEntryLayout
                        ? 'auth-entry-main relative mx-auto grid'
                        : 'relative mx-auto grid min-h-0 w-full max-w-[1320px] flex-1 items-center gap-6 px-5 pb-6 sm:px-10 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:px-12 lg:py-3'
                }
            >
                <section
                    aria-label={
                        isConfirmation
                            ? 'Konfirmasi akses akun'
                            : 'Selamat datang di SATU'
                    }
                    className={
                        usesEntryLayout
                            ? 'auth-entry-intro relative min-w-0'
                            : 'relative lg:self-stretch lg:pt-4'
                    }
                >
                    {usesEntryLayout ? (
                        <AuthWelcomePanel
                            isRegistration={component === 'auth/register'}
                            isConfirmation={isConfirmation}
                        />
                    ) : (
                        <>
                            <div className="hidden lg:block">
                                <h2 className="max-w-[12ch] text-3xl leading-[1.06] font-bold tracking-[-0.04em] text-slate-950 xl:text-4xl">
                                    Langkah kecil.
                                    <br />
                                    <span className="text-blue-600">
                                        Cerita besar.
                                    </span>
                                </h2>
                                <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-600">
                                    Temukan teman berkarya, bangun kontribusi,
                                    dan ceritakan kemampuanmu lewat bukti nyata.
                                </p>
                            </div>

                            <div className="relative mx-auto mt-4 h-28 w-full max-w-sm lg:mt-6 lg:h-40 lg:max-w-none">
                                <div
                                    aria-hidden="true"
                                    className="absolute inset-x-5 bottom-0 h-20 rounded-[2rem] border border-white/80 bg-gradient-to-br from-[#b9e6ff] to-[#87c9f6] shadow-[0_20px_45px_-20px_rgba(40,109,179,0.32)] lg:inset-x-0 lg:h-32"
                                />
                                <Mascot
                                    pose={mascotPose}
                                    interactive
                                    priority
                                    className="absolute -top-8 left-1/2 z-10 w-36 -translate-x-1/2 lg:-top-14 lg:left-[56%] lg:w-[14rem] xl:w-[16rem]"
                                />
                                <div className="absolute bottom-3 left-3 z-20 hidden max-w-40 -rotate-3 rounded-2xl border border-white bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm lg:block">
                                    {usesEntryLayout
                                        ? 'Siap mulai cerita kolaborasimu?'
                                        : 'Pelan-pelan, kita lanjutkan bersama.'}
                                    <ArrowUpRight
                                        aria-hidden="true"
                                        className="mt-1.5 size-3.5 text-blue-600"
                                    />
                                </div>
                            </div>
                            <p className="mt-4 hidden items-center gap-2 text-xs leading-5 text-slate-600 lg:flex">
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
                        usesEntryLayout
                            ? 'auth-entry-form relative mx-auto w-full'
                            : 'relative mx-auto w-full max-w-[30rem]'
                    }
                >
                    <section
                        className={cn(
                            'auth-entry-card rounded-[2rem] border border-white bg-white/95 shadow-[0_24px_80px_-32px_rgba(31,88,149,0.3)]',
                            !usesEntryLayout &&
                                'max-h-[calc(100svh-100px)] overflow-y-auto p-5 sm:p-7',
                        )}
                    >
                        <div
                            className={cn(
                                'auth-entry-form-header',
                                !usesEntryLayout && 'mb-4',
                            )}
                        >
                            <p
                                className={cn(
                                    'auth-entry-kicker text-xs font-bold tracking-[0.14em] text-blue-700 uppercase',
                                    !usesEntryLayout && 'mb-2',
                                )}
                            >
                                {isConfirmation
                                    ? 'Konfirmasi akses'
                                    : 'Ruang kolaborasimu'}
                            </p>
                            <h1
                                className={cn(
                                    'auth-entry-title font-bold tracking-[-0.035em] text-slate-950',
                                    !usesEntryLayout &&
                                        'text-2xl leading-tight sm:text-3xl',
                                )}
                            >
                                {title}
                            </h1>
                            <p
                                className={cn(
                                    'auth-entry-description text-slate-600',
                                    !usesEntryLayout &&
                                        'mt-2 text-sm leading-relaxed',
                                )}
                            >
                                {description}
                            </p>
                        </div>
                        <div
                            className={cn(
                                'auth-entry-fields [&_input:not([type=checkbox])]:border-input [&_input:not([type=checkbox])]:bg-white [&_input:not([type=checkbox])]:text-base [&_label]:text-slate-700',
                                usesEntryLayout
                                    ? '[&_button[type=submit]]:min-h-[var(--auth-control-height,2.75rem)] [&_button[type=submit]]:rounded-xl [&_button[type=submit]]:text-[length:var(--auth-control-font,0.875rem)] [&_input:not([type=checkbox])]:min-h-[var(--auth-control-height,2.75rem)] [&_input:not([type=checkbox])]:rounded-xl [&_label]:text-[length:var(--auth-control-font,0.875rem)] [&_p[id$="help"]]:text-[length:var(--auth-help-font,0.75rem)]'
                                    : '[&_button[type=submit]]:min-h-11 [&_button[type=submit]]:rounded-md [&_input:not([type=checkbox])]:min-h-11 [&_input:not([type=checkbox])]:rounded-md',
                            )}
                        >
                            {children}
                        </div>
                    </section>
                    <p
                        className={cn(
                            'auth-entry-footer text-center text-xs text-slate-600',
                            !usesEntryLayout && 'mt-3',
                        )}
                    >
                        SATU. Tempat kolaborasi menjadi berarti.
                    </p>
                </div>
            </main>
        </div>
    );
}
