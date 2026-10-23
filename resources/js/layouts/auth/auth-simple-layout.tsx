import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import AppLogo from '@/layouts/_components/app-logo';
import { cn } from '@/lib/utils';
import AuthSideIntro from '@/pages/auth/_components/auth-side-intro';
import AuthWelcomePanel from '@/pages/auth/_components/auth-welcome-panel';
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
                'relative flex h-svh max-h-svh min-h-svh flex-col overflow-x-hidden overflow-y-auto bg-satu-canvas lg:overflow-hidden',
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
                    className="pointer-events-none absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(ellipse_at_top_left,var(--color-satu-blue-soft),transparent_65%)]"
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
                        <AuthSideIntro
                            mascotPose={mascotPose}
                            usesEntryLayout={usesEntryLayout}
                        />
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
                            'auth-entry-card rounded-[2rem] border border-white bg-white/95 shadow-xl',
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
