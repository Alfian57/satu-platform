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
            <Head title="Sistem Aktivitas Talenta Universitas" />
            <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
                {/* Header Navbar */}
                <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
                        <div className="flex items-center gap-2 text-lg font-bold tracking-tight">
                            <span className="text-primary">SATU</span>
                            <span className="hidden font-normal text-muted-foreground sm:inline-block">
                                |
                            </span>
                            <span className="hidden text-sm font-normal text-muted-foreground sm:inline-block">
                                Buku Besar Kolaborasi
                            </span>
                        </div>
                        <nav className="flex items-center gap-4">
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        Masuk
                                    </Link>
                                    <Link
                                        href={register()}
                                        className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
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
                            <h1 className="mx-auto max-w-4xl font-sans text-display font-bold tracking-[-0.03em] text-foreground">
                                Validasi Kontribusi,{' '}
                                <br className="hidden sm:block" />
                                <span className="text-primary">
                                    Bukan Sekadar Klaim.
                                </span>
                            </h1>
                            <p className="mx-auto mt-6 max-w-2xl text-body leading-relaxed text-muted-foreground">
                                SATU (Sistem Aktivitas Talenta Universitas)
                                mengubah setiap peluang kolaborasi menjadi bukti
                                portofolio yang tervalidasi oleh institusi.
                                Temukan tim, kerjakan proyek, dan raih pengakuan
                                yang dapat dipercaya.
                            </p>
                            <div className="mt-10 flex items-center justify-center gap-x-6">
                                <Link
                                    href={register()}
                                    className="rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                                >
                                    Mulai Bangun Portofolio
                                </Link>
                                <a
                                    href="#demo"
                                    className="group flex items-center gap-1 text-sm leading-6 font-semibold text-foreground"
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

                    {/* Lifecycle Evidence: opportunity → portfolio */}
                    <section className="border-y border-border bg-muted py-16 sm:py-24">
                        <div className="mx-auto max-w-7xl px-6 lg:px-8">
                            <h2 className="text-headline font-bold tracking-[-0.025em] text-foreground">
                                Dari Peluang Menjadi Bukti
                            </h2>
                            <p className="mt-4 max-w-2xl text-body text-muted-foreground">
                                Setiap interaksi dicatat dalam Buku Besar
                                Kolaborasi. Berikut alur dari opportunity
                                menjadi portofolio terverifikasi.
                            </p>

                            {/* Lifecycle Steps */}
                            <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-5">
                                {[
                                    {
                                        step: '01',
                                        title: 'Opportunity',
                                        desc: 'Peluang kolaborasi (hackathon, proyek, riset) dipublikasikan oleh kampus atau mahasiswa.',
                                    },
                                    {
                                        step: '02',
                                        title: 'Team',
                                        desc: 'Mahasiswa membentuk tim berdasarkan kecocokan skill dan ketersediaan.',
                                    },
                                    {
                                        step: '03',
                                        title: 'Work',
                                        desc: 'Kontribusi tercatat: kode, desain, dokumen, dan deliverable lainnya.',
                                    },
                                    {
                                        step: '04',
                                        title: 'Validation',
                                        desc: 'Kontribusi di-review dan divalidasi oleh reviewer resmi kampus.',
                                    },
                                    {
                                        step: '05',
                                        title: 'Portfolio',
                                        desc: 'Bukti terverifikasi menjadi portofolio yang dapat dibagikan ke perekrut.',
                                    },
                                ].map((item) => (
                                    <div
                                        key={item.step}
                                        className="flex flex-col gap-2 bg-card p-6"
                                    >
                                        <span className="font-label text-label tracking-[0.02em] text-primary">
                                            {item.step}
                                        </span>
                                        <h3 className="text-title font-semibold text-foreground">
                                            {item.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {item.desc}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Interactive Synthetic Graph Section */}
                    <section
                        id="demo"
                        className="border-b border-border bg-background py-16 sm:py-24"
                    >
                        <div className="mx-auto max-w-7xl px-6 lg:px-8">
                            <div className="mx-auto mb-12 max-w-2xl lg:mx-0">
                                <h2 className="text-headline font-bold tracking-[-0.025em] text-foreground">
                                    Simulasi Buku Besar
                                </h2>
                                <p className="mt-4 text-body text-muted-foreground">
                                    Simulasi di bawah ini mendemonstrasikan
                                    bagaimana sebuah opportunity berkembang
                                    menjadi portofolio terverifikasi. Klik node
                                    untuk melihat relasi.
                                </p>
                            </div>

                            {/* Demo Container */}
                            <div className="mt-8 rounded-lg border border-border bg-card p-2">
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
                            <h2 className="mb-12 text-headline font-bold tracking-[-0.025em] text-foreground">
                                Siapa yang Menggunakan SATU
                            </h2>
                            <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
                                <div className="flex flex-col gap-2 bg-card p-6">
                                    <h3 className="text-title font-semibold text-foreground">
                                        Mahasiswa
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Temukan peluang kolaborasi tanpa
                                        hambatan. Kendalikan visibilitas profil
                                        dan portofolio Anda secara penuh. Kami
                                        tidak membagikan data diskusi privat
                                        Anda kepada perekrut.
                                    </p>
                                </div>
                                <div className="flex flex-col gap-2 bg-card p-6">
                                    <h3 className="text-title font-semibold text-foreground">
                                        Operator Kampus
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Kelola afiliasi kampus melalui
                                        verifikasi NIM dan tinjauan reviewer
                                        resmi untuk memastikan akses kolaborasi
                                        yang merata di seluruh kampus.
                                    </p>
                                </div>
                                <div className="flex flex-col gap-2 bg-card p-6">
                                    <h3 className="text-title font-semibold text-foreground">
                                        Perekrut
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Akses proyeksi portofolio terverifikasi
                                        yang secara eksplisit diizinkan oleh
                                        mahasiswa. Data privat dan diskusi
                                        internal dibatasi ketat demi privasi.
                                    </p>
                                </div>
                                <div className="flex flex-col gap-2 bg-card p-6">
                                    <h3 className="text-title font-semibold text-foreground">
                                        Evaluator Kompetisi
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Nilai kejujuran klaim, batas
                                        implementasi, dan pembedaan data
                                        synthetic secara transparan. Tidak ada
                                        metrik palsu atau klaim dampak yang
                                        tidak dapat dibuktikan.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                {/* No-JS Fallback */}
                <noscript>
                    <section className="border-t border-border bg-muted px-6 py-16">
                        <div className="mx-auto max-w-7xl">
                            <h2 className="mb-6 text-headline font-bold text-foreground">
                                Alur Kolaborasi SATU (Data synthetic)
                            </h2>
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="px-4 py-2 font-medium text-foreground">
                                            Node
                                        </th>
                                        <th className="px-4 py-2 font-medium text-foreground">
                                            Tipe
                                        </th>
                                        <th className="px-4 py-2 font-medium text-foreground">
                                            Relasi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="text-muted-foreground">
                                    <tr className="border-b border-border">
                                        <td className="px-4 py-2">Hackathon</td>
                                        <td className="px-4 py-2">
                                            Opportunity
                                        </td>
                                        <td className="px-4 py-2">
                                            → Team Alpha
                                        </td>
                                    </tr>
                                    <tr className="border-b border-border">
                                        <td className="px-4 py-2">Budi</td>
                                        <td className="px-4 py-2">Student</td>
                                        <td className="px-4 py-2">
                                            → Team Alpha → Frontend UI
                                        </td>
                                    </tr>
                                    <tr className="border-b border-border">
                                        <td className="px-4 py-2">Siti</td>
                                        <td className="px-4 py-2">Student</td>
                                        <td className="px-4 py-2">
                                            → Team Alpha → Backend API
                                        </td>
                                    </tr>
                                    <tr className="border-b border-border">
                                        <td className="px-4 py-2">
                                            Frontend UI
                                        </td>
                                        <td className="px-4 py-2">Work</td>
                                        <td className="px-4 py-2">
                                            → Terverifikasi → Portofolio
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-2">
                                            Backend API
                                        </td>
                                        <td className="px-4 py-2">Work</td>
                                        <td className="px-4 py-2">
                                            → Terverifikasi → Portofolio
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>
                </noscript>

                <footer className="border-t border-border py-8">
                    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row lg:px-8">
                        <p className="text-label text-muted-foreground">
                            &copy; {new Date().getFullYear()} SATU Platform. Hak
                            cipta dilindungi undang-undang.
                        </p>
                        <p className="text-label text-muted-foreground">
                            Komitmen Privasi: Data portofolio Anda adalah milik
                            Anda.
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}
