import { Link } from '@inertiajs/react';
import { BadgeCheck } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="relative flex min-h-svh">
            {/* Left Panel - Collaboration Canvas */}
            <div className="relative hidden w-[45%] overflow-hidden border-r border-blue-100 bg-[#eff6ff] lg:flex lg:flex-col">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_18%_0%,rgba(59,130,246,0.2),transparent_62%),radial-gradient(ellipse_70%_55%_at_92%_72%,rgba(99,102,241,0.18),transparent_68%),linear-gradient(145deg,#eff6ff_0%,#dbeafe_58%,#eef2ff_100%)]"
                />
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-32 -left-28 size-[28rem] rounded-full bg-blue-300/30 blur-3xl"
                />

                <div className="relative z-10 flex flex-1 flex-col justify-between p-10 xl:p-14">
                    <div className="flex items-start justify-between gap-6">
                        <Link
                            aria-label="SATU: Beranda"
                            href={home()}
                            className="w-fit cursor-pointer"
                        >
                            <AppLogo
                                className="gap-3 text-slate-900 [&>img]:size-11"
                                ruleClassName="bg-blue-600"
                            />
                        </Link>
                        <p className="font-label text-[0.62rem] font-semibold tracking-wider text-blue-700">
                            AKSES PRIVAT
                        </p>
                    </div>

                    <div className="relative flex min-h-[19rem] flex-1 items-center justify-center py-8 xl:min-h-[23rem]">
                        <div
                            aria-hidden="true"
                            className="absolute size-[74%] rounded-full bg-blue-300/35 blur-3xl"
                        />
                        <img
                            src="/images/landing-mascot-accessories.webp"
                            alt=""
                            width={1200}
                            height={800}
                            className="relative w-full max-w-[32rem] object-contain drop-shadow-[0_24px_20px_rgba(23,70,176,0.22)]"
                        />
                    </div>

                    <div className="max-w-md pb-3">
                        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-white/70 px-3.5 py-1.5">
                            <span
                                aria-hidden="true"
                                className="size-1.5 rounded-full bg-blue-600"
                            />
                            <p className="font-label text-[0.62rem] font-semibold tracking-wider text-blue-700">
                                BUKU BESAR KOLABORASI
                            </p>
                        </div>
                        <h2 className="mt-5 max-w-[15ch] text-3xl leading-[1.05] font-bold tracking-[-0.03em] text-slate-900 xl:text-4xl">
                            Kolaborasi yang menjadi bukti.
                        </h2>
                        <p className="mt-4 max-w-md text-sm leading-7 text-slate-600">
                            SATU menghubungkan peluang, kerja tim, dan
                            kontribusi nyata menjadi portofolio yang punya
                            konteks.
                        </p>

                        <div className="mt-6 flex items-center gap-3 border-t border-blue-200/80 pt-5">
                            <BadgeCheck
                                aria-hidden="true"
                                className="size-4 shrink-0 text-blue-700"
                            />
                            <p className="text-xs leading-relaxed text-slate-600">
                                Data portofolio dibagikan secara eksplisit oleh
                                mahasiswa.
                            </p>
                        </div>
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
                    <p className="mt-8 text-center text-xs text-slate-600">
                        &copy; {new Date().getFullYear()} SATU Platform. Semua
                        hak cipta dilindungi.
                    </p>
                </div>
            </div>
        </div>
    );
}
