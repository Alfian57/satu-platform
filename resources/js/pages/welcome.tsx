import { Head, Link, usePage } from '@inertiajs/react';
import React, { Suspense, lazy } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { dashboard, login, register } from '@/routes';

// Lazy load graph demo for performance
const LandingDemoGraph = lazy(() => import('@/components/LandingDemoGraph'));

export default function Welcome() {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="SATU - Sistem Aktivitas Talenta Universitas" />
            <div className="min-h-screen bg-white text-neutral-900 selection:bg-primary/30 dark:bg-[#0a0a0a] dark:text-neutral-100">
                {/* Header Navbar */}
                <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white/80 backdrop-blur-md dark:border-neutral-800 dark:bg-[#0a0a0a]/80">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
                        <div className="flex items-center gap-2 text-lg font-bold tracking-tight">
                            <span className="text-primary">SATU</span>
                            <span className="hidden font-normal text-neutral-400 sm:inline-block">
                                |
                            </span>
                            <span className="hidden text-sm font-normal text-neutral-600 sm:inline-block dark:text-neutral-400">
                                Buku Besar Kolaborasi
                            </span>
                        </div>
                        <nav className="flex items-center gap-4">
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                                    >
                                        Masuk
                                    </Link>
                                    <Link
                                        href={register()}
                                        className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                                    >
                                        Daftar Mahasiswa
                                    </Link>
                                </>
                            )}
                        </nav>
                    </div>
                </header>

                <main>
                    {/* First Viewport: Offer & Mechanism Cue */}
                    <section className="relative overflow-hidden pt-24 pb-16 lg:pt-32 lg:pb-24">
                        <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
                            <h1 className="font-display mx-auto max-w-4xl text-4xl font-bold tracking-tight text-neutral-900 sm:text-6xl dark:text-white">
                                Validasi Kontribusi,{' '}
                                <br className="hidden sm:block" />
                                <span className="text-primary">
                                    Bukan Sekadar Klaim.
                                </span>
                            </h1>
                            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-neutral-600 dark:text-neutral-400">
                                SATU (Sistem Aktivitas Talenta Universitas)
                                mengubah setiap peluang kolaborasi menjadi bukti
                                portofolio yang tervalidasi oleh institusi.
                                Temukan tim, kerjakan proyek, dan raih pengakuan
                                yang dapat dipercaya.
                            </p>
                            <div className="mt-10 flex items-center justify-center gap-x-6">
                                <Link
                                    href={register()}
                                    className="rounded-md bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                                >
                                    Mulai Bangun Portofolio
                                </Link>
                                <a
                                    href="#demo"
                                    className="group flex items-center gap-1 text-sm leading-6 font-semibold text-neutral-900 dark:text-neutral-100"
                                >
                                    Lihat Cara Kerja
                                    <span
                                        aria-hidden="true"
                                        className="transition-transform group-hover:translate-y-1"
                                    >
                                        ↓
                                    </span>
                                </a>
                            </div>
                        </div>
                    </section>

                    {/* Interactive Synthetic Graph Section */}
                    <section
                        id="demo"
                        className="border-y border-neutral-200 bg-neutral-50 py-16 sm:py-24 dark:border-neutral-800 dark:bg-neutral-900/20"
                    >
                        <div className="mx-auto max-w-7xl px-6 lg:px-8">
                            <div className="mx-auto mb-12 max-w-2xl lg:mx-0">
                                <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl dark:text-white">
                                    Dari Peluang Menjadi Bukti
                                </h2>
                                <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400">
                                    Setiap interaksi dicatat dalam Buku Besar
                                    Kolaborasi. Simulasi di bawah ini
                                    mendemonstrasikan bagaimana sebuah
                                    opportunity berkembang menjadi portofolio
                                    terverifikasi.
                                </p>
                            </div>

                            {/* Demo Container */}
                            <div className="mt-8 rounded-2xl bg-white p-2 ring-1 ring-neutral-200 dark:bg-[#0a0a0a] dark:ring-neutral-800">
                                <Suspense
                                    fallback={
                                        <div
                                            className="flex flex-col gap-6 p-4 lg:flex-row"
                                            aria-busy="true"
                                            role="status"
                                        >
                                            <div className="flex-1 space-y-4">
                                                <Skeleton className="h-10 w-full lg:w-1/3" />
                                                <Skeleton className="h-[300px] w-full lg:h-[400px]" />
                                            </div>
                                            <div className="w-full shrink-0 space-y-4 lg:w-[320px]">
                                                <Skeleton className="h-10 w-full" />
                                                <Skeleton className="h-20 w-full" />
                                                <Skeleton className="h-20 w-full" />
                                                <Skeleton className="h-20 w-full" />
                                            </div>
                                            <span className="sr-only">
                                                Menyiapkan demo kolaborasi...
                                            </span>
                                        </div>
                                    }
                                >
                                    <LandingDemoGraph />
                                </Suspense>
                            </div>
                        </div>
                    </section>

                    {/* Privacy Boundary & Roles */}
                    <section className="py-16 sm:py-24">
                        <div className="mx-auto max-w-7xl px-6 lg:px-8">
                            <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
                                <div>
                                    <h3 className="mb-3 text-lg font-semibold text-neutral-900 dark:text-white">
                                        Mahasiswa
                                    </h3>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                        Temukan peluang kolaborasi tanpa
                                        hambatan. Kendalikan visibilitas profil
                                        dan portofolio Anda secara penuh. Kami
                                        tidak membagikan data diskusi privat
                                        Anda kepada perekrut.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="mb-3 text-lg font-semibold text-neutral-900 dark:text-white">
                                        Operator Kampus
                                    </h3>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                        Kelola afiliasi mahasiswa melalui
                                        verifikasi NIM. Tinjau sinyal inklusi
                                        secara konfidensial untuk memastikan
                                        akses kolaborasi merata di seluruh
                                        kampus.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="mb-3 text-lg font-semibold text-neutral-900 dark:text-white">
                                        Perekrut
                                    </h3>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                        Akses proyeksi portofolio terverifikasi
                                        yang dengan eksplisit diizinkan oleh
                                        mahasiswa. Data diagnostik dan sinyal
                                        internal kampus dibatasi ketat demi
                                        privasi.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                <footer className="border-t border-neutral-200 py-8 dark:border-neutral-800">
                    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row lg:px-8">
                        <p className="text-xs text-neutral-500">
                            &copy; {new Date().getFullYear()} SATU Platform. All
                            rights reserved.
                        </p>
                        <p className="text-xs text-neutral-500">
                            Komitmen Privasi: Data portofolio Anda adalah milik
                            Anda.
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}
