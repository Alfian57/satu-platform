import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Ban,
    Bookmark,
    Calendar,
    CheckCircle2,
    ChevronRight,
    Clock,
    Lock,
    Mail,
    Search,
    Send,
    UserCheck,
    UserRound,
} from 'lucide-react';
import React, { useState, useTransition } from 'react';
import { index as talentSearch } from '@/actions/App/Http/Controllers/TalentSearchController';
import { AppPage } from '@/components/app-page';
import { Button } from '@/components/ui/button';
import { saved as savedCandidates } from '@/routes/recruiter/talent';
import { index as contactRequestsIndex } from '@/routes/recruiter/talent/contact-requests';

interface ContactRequestItem {
    id: number;
    purpose: string;
    message: string | null;
    status: string;
    created_at: string;
    expires_at: string;
    responded_at: string | null;
    candidate_name: string;
    candidate_headline: string | null;
}

interface RecruiterContactRequestsProps {
    requests: ContactRequestItem[];
    entitlement: {
        has_entitlement: boolean;
    };
}

function statusMeta(status: string): {
    label: string;
    dotColor: string;
    badgeColor: string;
} {
    switch (status) {
        case 'pending':
            return {
                label: 'Menunggu tanggapan',
                dotColor: 'bg-amber-500',
                badgeColor: 'border-amber-200/80 bg-amber-50/90 text-amber-800',
            };
        case 'accepted':
            return {
                label: 'Disetujui kandidat',
                dotColor: 'bg-emerald-500',
                badgeColor:
                    'border-emerald-200/80 bg-emerald-50/90 text-emerald-800',
            };
        case 'declined':
            return {
                label: 'Ditolak kandidat',
                dotColor: 'bg-rose-500',
                badgeColor: 'border-rose-200/80 bg-rose-50/90 text-rose-800',
            };
        case 'expired':
            return {
                label: 'Kedaluwarsa',
                dotColor: 'bg-slate-400',
                badgeColor: 'border-slate-200 bg-slate-50 text-slate-700',
            };
        case 'cancelled':
            return {
                label: 'Dibatalkan',
                dotColor: 'bg-slate-400',
                badgeColor: 'border-slate-200 bg-slate-50 text-slate-700',
            };
        default:
            return {
                label: status.replaceAll('_', ' '),
                dotColor: 'bg-slate-400',
                badgeColor: 'border-slate-200 bg-slate-50 text-slate-700',
            };
    }
}

function ContactRequestsContextRail({
    totalCount,
    pendingCount,
    acceptedCount,
}: {
    totalCount: number;
    pendingCount: number;
    acceptedCount: number;
}) {
    return (
        <div className="grid gap-6">
            {/* Card 1: Aturan Permintaan Kontak */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                <div className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <Lock className="size-3.5" aria-hidden="true" />
                    </span>
                    <p className="font-label text-xs font-bold tracking-[0.1em] text-slate-500 uppercase">
                        ATURAN KONTAK
                    </p>
                </div>

                <h2 className="mt-3 text-base font-bold tracking-tight text-slate-900">
                    Persetujuan Langsung
                </h2>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    Kandidat memiliki kendali penuh atas privasi mereka. Nomor
                    WhatsApp dan kontak langsung baru diberikan setelah kandidat
                    menyetujui permohonan Anda.
                </p>
            </div>

            {/* Card 2: Ringkasan Metrik Permintaan */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                <p className="font-label text-xs font-bold tracking-[0.1em] text-slate-500 uppercase">
                    RINGKASAN PERMINTAAN
                </p>

                <div className="mt-4 grid divide-y divide-slate-100">
                    <div className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-2.5">
                            <Send className="size-4 text-blue-600" />
                            <span className="text-sm font-medium text-slate-700">
                                Total terkirim
                            </span>
                        </div>
                        <span className="inline-flex size-6 items-center justify-center rounded-full bg-blue-50 font-mono text-xs font-bold text-blue-700">
                            {totalCount}
                        </span>
                    </div>

                    <div className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-2.5">
                            <Clock className="size-4 text-amber-600" />
                            <span className="text-sm font-medium text-slate-700">
                                Menunggu respon
                            </span>
                        </div>
                        <span className="inline-flex size-6 items-center justify-center rounded-full bg-amber-50 font-mono text-xs font-bold text-amber-700">
                            {pendingCount}
                        </span>
                    </div>

                    <div className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-2.5">
                            <CheckCircle2 className="size-4 text-emerald-600" />
                            <span className="text-sm font-medium text-slate-700">
                                Disetujui
                            </span>
                        </div>
                        <span className="inline-flex size-6 items-center justify-center rounded-full bg-emerald-50 font-mono text-xs font-bold text-emerald-700">
                            {acceptedCount}
                        </span>
                    </div>
                </div>
            </div>

            {/* Card 3: Navigasi Cepat */}
            <div className="grid gap-2.5">
                <Link
                    href={talentSearch()}
                    prefetch
                    className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                            <Search className="size-4" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-900">
                                Cari Talenta
                            </p>
                            <p className="text-[0.6875rem] text-slate-500">
                                Temukan portofolio baru
                            </p>
                        </div>
                    </div>
                    <ChevronRight className="size-4 text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-blue-600" />
                </Link>

                <Link
                    href={savedCandidates()}
                    prefetch
                    className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                            <Bookmark className="size-4" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-900">
                                Kandidat Tersimpan
                            </p>
                            <p className="text-[0.6875rem] text-slate-500">
                                Bookmark internal tim
                            </p>
                        </div>
                    </div>
                    <ChevronRight className="size-4 text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-blue-600" />
                </Link>
            </div>
        </div>
    );
}

export default function RecruiterContactRequests({
    requests,
    entitlement,
}: RecruiterContactRequestsProps) {
    const [isPending, startTransition] = useTransition();
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const handleCancel = (requestId: number) => {
        startTransition(() => {
            router.delete(`/recruiter/talent/contact-requests/${requestId}`, {
                preserveState: true,
                preserveScroll: true,
            });
        });
    };

    const pendingCount = requests.filter((r) => r.status === 'pending').length;
    const acceptedCount = requests.filter(
        (r) => r.status === 'accepted',
    ).length;

    const filteredRequests =
        statusFilter === 'all'
            ? requests
            : requests.filter((r) => r.status === statusFilter);

    return (
        <>
            <Head title="Permintaan Kontak | SATU" />

            <AppPage
                contextRail={
                    <ContactRequestsContextRail
                        acceptedCount={acceptedCount}
                        pendingCount={pendingCount}
                        totalCount={requests.length}
                    />
                }
                contextRailLabel="Konteks Permintaan Kontak"
            >
                <div
                    className="space-y-6"
                    data-test="recruiter-contact-requests-root"
                >
                    {/* Header Banner */}
                    <header className="relative isolate overflow-hidden rounded-2xl border border-blue-100 bg-white px-6 py-6 shadow-[0_18px_50px_-36px_rgba(30,64,175,0.35)] sm:px-8 sm:py-7">
                        <div
                            aria-hidden="true"
                            className="absolute -top-28 -right-24 size-80 rounded-full bg-blue-100/75 blur-3xl sm:-right-12"
                        />
                        <div
                            aria-hidden="true"
                            className="absolute right-14 bottom-0 hidden h-24 w-24 rounded-tl-[2.5rem] border-t border-l border-indigo-100 sm:block"
                        />

                        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <Link
                                    href={talentSearch()}
                                    prefetch
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 transition-colors hover:text-blue-800"
                                >
                                    <ArrowLeft className="size-3.5" />
                                    Kembali ke Cari Talenta
                                </Link>

                                <div className="mt-3 flex items-center gap-3">
                                    <h1 className="text-2xl font-bold tracking-[-0.035em] text-slate-950 sm:text-3xl">
                                        Permintaan Kontak
                                    </h1>
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                        <Send className="size-3 text-blue-600" />
                                        Outbound Outreach
                                    </span>
                                </div>

                                <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-slate-600">
                                    Pantau status permohonan kontak dan tawaran
                                    kolaborasi yang dikirimkan kepada talenta
                                    mahasiswa terverifikasi.
                                </p>
                            </div>

                            {entitlement.has_entitlement && (
                                <div className="flex shrink-0 items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/80 px-4 py-2.5 text-xs font-semibold text-blue-800">
                                    <UserCheck className="size-4 text-blue-600" />
                                    <span>Hak Akses Aktif</span>
                                </div>
                            )}
                        </div>
                    </header>

                    {/* Filter Status Tabs & Meta Bar */}
                    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-1.5">
                            <button
                                className={`cursor-pointer rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                                    statusFilter === 'all'
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                                onClick={() => setStatusFilter('all')}
                                type="button"
                            >
                                Semua ({requests.length})
                            </button>
                            <button
                                className={`cursor-pointer rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                                    statusFilter === 'pending'
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                                onClick={() => setStatusFilter('pending')}
                                type="button"
                            >
                                Menunggu ({pendingCount})
                            </button>
                            <button
                                className={`cursor-pointer rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                                    statusFilter === 'accepted'
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                                onClick={() => setStatusFilter('accepted')}
                                type="button"
                            >
                                Disetujui ({acceptedCount})
                            </button>
                            <button
                                className={`cursor-pointer rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                                    statusFilter === 'declined'
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                                onClick={() => setStatusFilter('declined')}
                                type="button"
                            >
                                Ditolak (
                                {
                                    requests.filter(
                                        (r) => r.status === 'declined',
                                    ).length
                                }
                                )
                            </button>
                        </div>

                        <span className="text-xs text-slate-500">
                            Menampilkan {filteredRequests.length} permohonan
                        </span>
                    </div>

                    {/* Content Section */}
                    <div className="space-y-4">
                        {/* Empty State */}
                        {filteredRequests.length === 0 && (
                            <div className="grid justify-items-center gap-4 rounded-2xl border border-slate-200/80 bg-white px-6 py-16 text-center shadow-xs">
                                <div className="flex size-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-8 ring-blue-50/50">
                                    <Mail
                                        aria-hidden="true"
                                        className="size-7"
                                    />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">
                                        {statusFilter === 'all'
                                            ? 'Belum ada permintaan kontak yang dikirim'
                                            : 'Tidak ada permintaan dengan status ini'}
                                    </h3>
                                    <p className="mx-auto mt-2 max-w-[46ch] text-xs leading-relaxed text-slate-600">
                                        Kirimkan permintaan kontak resmi kepada
                                        kandidat berbakat melalui halaman Cari
                                        Talenta untuk memulai diskusi proyek.
                                    </p>
                                </div>
                                <Button
                                    asChild
                                    className="cursor-pointer rounded-xl bg-blue-600 px-5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700"
                                >
                                    <Link href={talentSearch()} prefetch>
                                        <Search className="mr-1.5 size-3.5" />
                                        Cari Talenta Sekarang
                                    </Link>
                                </Button>
                            </div>
                        )}

                        {/* Requests Cards List */}
                        {filteredRequests.length > 0 && (
                            <div className="grid gap-4">
                                {filteredRequests.map((req) => {
                                    const meta = statusMeta(req.status);

                                    return (
                                        <article
                                            key={req.id}
                                            className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                                        >
                                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                                <div className="flex items-start gap-4">
                                                    {/* Avatar Icon */}
                                                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-base font-bold text-white shadow-xs">
                                                        <UserRound className="size-6" />
                                                    </div>

                                                    {/* Candidate & Request Info */}
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h3 className="text-base font-bold text-slate-900">
                                                                {
                                                                    req.candidate_name
                                                                }
                                                            </h3>
                                                            {req.candidate_headline && (
                                                                <span className="text-xs text-slate-500">
                                                                    •{' '}
                                                                    {
                                                                        req.candidate_headline
                                                                    }
                                                                </span>
                                                            )}
                                                            <span
                                                                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.badgeColor}`}
                                                            >
                                                                <span
                                                                    className={`size-1.5 rounded-full ${meta.dotColor}`}
                                                                />
                                                                {meta.label}
                                                            </span>
                                                        </div>

                                                        {/* Purpose & Message Container */}
                                                        <div className="mt-3 space-y-1.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                                                                <Send className="size-3 text-blue-600" />
                                                                <span>
                                                                    Tujuan:{' '}
                                                                    {
                                                                        req.purpose
                                                                    }
                                                                </span>
                                                            </div>
                                                            {req.message && (
                                                                <p className="text-xs leading-relaxed text-slate-600">
                                                                    {
                                                                        req.message
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* Dates Info */}
                                                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                                                            <span className="inline-flex items-center gap-1">
                                                                <Calendar className="size-3.5 text-slate-400" />
                                                                Dikirim:{' '}
                                                                {new Intl.DateTimeFormat(
                                                                    'id-ID',
                                                                    {
                                                                        dateStyle:
                                                                            'medium',
                                                                    },
                                                                ).format(
                                                                    new Date(
                                                                        req.created_at,
                                                                    ),
                                                                )}
                                                            </span>
                                                            <span className="inline-flex items-center gap-1">
                                                                <Clock className="size-3.5 text-slate-400" />
                                                                Batas respon:{' '}
                                                                {new Intl.DateTimeFormat(
                                                                    'id-ID',
                                                                    {
                                                                        dateStyle:
                                                                            'medium',
                                                                    },
                                                                ).format(
                                                                    new Date(
                                                                        req.expires_at,
                                                                    ),
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Action: Cancel request button if pending */}
                                                {req.status === 'pending' && (
                                                    <div className="shrink-0 sm:self-start">
                                                        <Button
                                                            aria-label="Batalkan permohonan kontak"
                                                            className="cursor-pointer rounded-xl border-rose-200 bg-rose-50 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 hover:text-rose-800"
                                                            disabled={isPending}
                                                            onClick={() =>
                                                                handleCancel(
                                                                    req.id,
                                                                )
                                                            }
                                                            size="sm"
                                                            type="button"
                                                            variant="outline"
                                                        >
                                                            <Ban className="mr-1.5 size-3.5 text-rose-600" />
                                                            Batalkan Permintaan
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </AppPage>
        </>
    );
}

RecruiterContactRequests.layout = {
    breadcrumbs: [
        {
            title: 'Talent Portal',
            href: talentSearch(),
        },
        {
            title: 'Permintaan Kontak',
            href: contactRequestsIndex(),
        },
    ],
};
