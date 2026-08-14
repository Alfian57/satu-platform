import { Link } from '@inertiajs/react';
import { BadgeCheck, FileCheck2, LockKeyhole, ShieldCheck } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

const features = [
    {
        icon: ShieldCheck,
        title: 'Validasi kampus',
        description: 'Kontribusi diverifikasi langsung oleh reviewer kampus.',
    },
    {
        icon: FileCheck2,
        title: 'Portofolio kontekstual',
        description:
            'Bukti kerja yang punya sumber, status, dan riwayat validasi.',
    },
    {
        icon: LockKeyhole,
        title: 'Privasi terkendali',
        description:
            'Kamu yang menentukan data mana yang terlihat oleh perekrut.',
    },
];

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="relative flex min-h-svh">
            {/* Left Panel - Gradient Brand Panel */}
            <div className="relative hidden w-[45%] overflow-hidden lg:flex lg:flex-col lg:justify-between">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700" />

                {/* Grid pattern overlay */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px]"
                />

                {/* Glow orbs */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-20 -left-20 size-96 rounded-full bg-blue-400/20 blur-[100px]"
                />
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute right-0 bottom-0 size-80 rounded-full bg-indigo-500/20 blur-[80px]"
                />

                {/* Floating dots */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute top-[20%] right-[15%] size-2 rounded-full bg-white/30"
                />
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute top-[40%] right-[25%] size-1.5 rounded-full bg-white/20"
                />
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute bottom-[30%] left-[20%] size-2.5 rounded-full bg-white/25"
                />

                {/* Content */}
                <div className="relative z-10 flex flex-1 flex-col justify-between p-10 xl:p-14">
                    {/* Logo */}
                    <Link
                        aria-label="SATU: Beranda"
                        href={home()}
                        className="w-fit"
                    >
                        <AppLogo
                            className="text-white"
                            ruleClassName="bg-white/80"
                        />
                    </Link>

                    {/* Brand message */}
                    <div className="my-auto max-w-md py-12">
                        <p className="font-label text-[0.65rem] font-semibold tracking-wider text-blue-200">
                            BUKU BESAR KOLABORASI
                        </p>
                        <h2 className="mt-4 text-3xl leading-tight font-bold tracking-tight text-white xl:text-4xl">
                            Kolaborasi yang menjadi bukti.
                        </h2>
                        <p className="mt-4 text-sm leading-relaxed text-blue-100/70">
                            SATU menghubungkan peluang, kerja tim, dan
                            kontribusi nyata menjadi portofolio yang punya
                            konteks.
                        </p>

                        {/* Feature list */}
                        <div className="mt-10 space-y-5">
                            {features.map((feature) => {
                                const Icon = feature.icon;

                                return (
                                    <div
                                        key={feature.title}
                                        className="flex items-start gap-4"
                                    >
                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white backdrop-blur-sm">
                                            <Icon
                                                aria-hidden="true"
                                                className="size-5"
                                            />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-white">
                                                {feature.title}
                                            </p>
                                            <p className="mt-0.5 text-xs leading-relaxed text-blue-100/60">
                                                {feature.description}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Bottom badge */}
                    <div className="flex items-center gap-2.5">
                        <div className="flex size-6 items-center justify-center rounded-lg border border-white/10 bg-white/10">
                            <BadgeCheck
                                aria-hidden="true"
                                className="size-3.5 text-blue-200"
                            />
                        </div>
                        <p className="text-xs text-blue-200/60">
                            Data portofolio dibagikan secara eksplisit oleh
                            mahasiswa.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Panel - Form Area */}
            <div className="flex flex-1 flex-col items-center justify-center bg-[#F8FAFC] p-6 md:p-10">
                {/* Subtle background elements */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute top-0 right-0 size-[40rem] rounded-full bg-blue-50/50 blur-[120px]"
                />

                <div className="relative z-10 w-full max-w-md">
                    {/* Mobile logo */}
                    <div className="mb-8 flex flex-col items-center gap-4 lg:hidden">
                        <Link
                            aria-label="SATU: Beranda"
                            href={home()}
                            className="font-medium"
                        >
                            <AppLogo compact />
                        </Link>
                    </div>

                    {/* Form card */}
                    <div className="rounded-3xl border border-slate-200/60 bg-white p-8 shadow-xl shadow-slate-200/50 sm:p-10">
                        {/* Header */}
                        <div className="mb-8 text-center lg:text-left">
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                {title}
                            </h1>
                            <p className="mt-2 text-sm leading-relaxed text-slate-500">
                                {description}
                            </p>
                        </div>

                        {/* Form content */}
                        {children}
                    </div>

                    {/* Footer */}
                    <p className="mt-8 text-center text-xs text-slate-400">
                        &copy; {new Date().getFullYear()} SATU Platform. Semua
                        hak cipta dilindungi.
                    </p>
                </div>
            </div>
        </div>
    );
}
