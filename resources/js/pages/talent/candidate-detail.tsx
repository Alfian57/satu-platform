import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Award,
    Bookmark,
    BookmarkCheck,
    Building2,
    CheckCircle2,
    ChevronRight,
    FileCheck2,
    Lock,
    Send,
    ShieldCheck,
    Sparkles,
    UserRound,
} from 'lucide-react';
import React, { useState, useTransition } from 'react';
import {
    destroy as unsaveCandidate,
    store as saveCandidate,
} from '@/actions/App/Http/Controllers/SavedCandidatesController';
import { index as talentSearch } from '@/actions/App/Http/Controllers/TalentSearchController';
import { AppPage } from '@/components/app-page';
import { Button } from '@/components/ui/button';
import { saved as savedCandidates } from '@/routes/recruiter/talent';

interface Candidate {
    id: number;
    headline: string | null;
    bio: string | null;
    skills: string[];
    badges: string[];
    contributions: string[] | Record<string, unknown>[];
    availability_status: string;
    verified_at: string | null;
    institution_name: string | null;
}

interface CandidateDetailProps {
    candidate: Candidate;
    isSaved?: boolean;
    contactConsequenceNotice: string;
}

function availabilityMeta(status: string): {
    label: string;
    dotColor: string;
    badgeColor: string;
} {
    switch (status) {
        case 'available':
            return {
                label: 'Tersedia untuk peluang',
                dotColor: 'bg-emerald-500',
                badgeColor:
                    'border-emerald-200/80 bg-emerald-50/90 text-emerald-800',
            };
        case 'open_to_offers':
            return {
                label: 'Terbuka untuk penawaran',
                dotColor: 'bg-blue-500',
                badgeColor: 'border-blue-200/80 bg-blue-50/90 text-blue-800',
            };
        case 'not_available':
            return {
                label: 'Belum tersedia',
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

function CandidateDetailContextRail({
    candidate,
    isSaved,
    onToggleSave,
    isPending,
}: {
    candidate: Candidate;
    isSaved: boolean;
    onToggleSave: () => void;
    isPending: boolean;
}) {
    return (
        <div className="grid gap-6">
            {/* Card 1: Status Bookmark & Aksi */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                <p className="font-label text-xs font-bold tracking-[0.1em] text-slate-500 uppercase">
                    AKSI KANDIDAT
                </p>

                <div className="mt-4 grid gap-3">
                    <Button
                        className={`h-11 w-full cursor-pointer rounded-xl font-semibold transition-all ${
                            isSaved
                                ? 'border-blue-200 bg-blue-50 text-xs text-blue-700 hover:bg-blue-100'
                                : 'border-slate-200 bg-white text-xs text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                        disabled={isPending}
                        onClick={onToggleSave}
                        type="button"
                        variant="outline"
                    >
                        {isSaved ? (
                            <>
                                <BookmarkCheck className="mr-1.5 size-4 fill-blue-600 text-blue-600" />
                                Tersimpan di Bookmark
                            </>
                        ) : (
                            <>
                                <Bookmark className="mr-1.5 size-4" />
                                Simpan ke Bookmark
                            </>
                        )}
                    </Button>

                    <Link
                        href={savedCandidates()}
                        prefetch
                        className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800"
                    >
                        Lihat semua kandidat tersimpan
                        <ChevronRight className="size-3" />
                    </Link>
                </div>
            </div>

            {/* Card 2: Ringkasan Verifikasi */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                <p className="font-label text-xs font-bold tracking-[0.1em] text-slate-500 uppercase">
                    RINGKASAN VERIFIKASI
                </p>

                <div className="mt-4 grid divide-y divide-slate-100">
                    <div className="flex items-center justify-between py-3">
                        <span className="text-xs text-slate-600">
                            Status Akun
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 className="size-3.5" />
                            Mahasiswa Terverifikasi
                        </span>
                    </div>

                    <div className="flex items-center justify-between py-3">
                        <span className="text-xs text-slate-600">
                            Institusi
                        </span>
                        <span className="text-xs font-semibold text-slate-800">
                            {candidate.institution_name ?? 'Universitas SATU'}
                        </span>
                    </div>

                    <div className="flex items-center justify-between py-3">
                        <span className="text-xs text-slate-600">
                            Total Skill
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-900">
                            {candidate.skills.length}
                        </span>
                    </div>

                    <div className="flex items-center justify-between py-3">
                        <span className="text-xs text-slate-600">
                            Badge Prestasi
                        </span>
                        <span className="font-mono text-xs font-bold text-amber-700">
                            {candidate.badges.length}
                        </span>
                    </div>
                </div>
            </div>

            {/* Card 3: Jaminan Privasi */}
            <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-indigo-50/40 p-4.5">
                <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 size-4.5 shrink-0 text-blue-600" />
                    <div>
                        <p className="text-xs font-bold text-blue-900">
                            Jaminan Keamanan Kontak
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-blue-800/80">
                            Nomor telepon dan kontak langsung mahasiswa hanya
                            akan terbuka setelah kandidat menyetujui permintaan
                            kontak resmi Anda.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CandidateDetail({
    candidate,
    isSaved = false,
    contactConsequenceNotice,
}: CandidateDetailProps) {
    const [saved, setSaved] = useState<boolean>(isSaved);
    const [isPending, startTransition] = useTransition();

    const toggleSave = () => {
        const nextState = !saved;
        setSaved(nextState);

        startTransition(() => {
            if (nextState) {
                router.post(
                    saveCandidate(candidate.id),
                    {},
                    {
                        preserveState: true,
                        preserveScroll: true,
                        onError: () => setSaved(!nextState),
                    },
                );
            } else {
                router.delete(unsaveCandidate(candidate.id), {
                    preserveState: true,
                    preserveScroll: true,
                    onError: () => setSaved(!nextState),
                });
            }
        });
    };

    const availability = availabilityMeta(candidate.availability_status);

    return (
        <>
            <Head
                title={`${candidate.headline ?? 'Profil Talenta'} | SATU Platform`}
            />

            <AppPage
                contextRail={
                    <CandidateDetailContextRail
                        candidate={candidate}
                        isPending={isPending}
                        isSaved={saved}
                        onToggleSave={toggleSave}
                    />
                }
                contextRailLabel="Konteks Profil Kandidat"
            >
                <div className="space-y-6" data-test="candidate-detail-root">
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

                        {/* Top Back Nav & Quick Actions */}
                        <div className="relative mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                            <Link
                                href={talentSearch()}
                                prefetch
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 transition-colors hover:text-blue-800"
                            >
                                <ArrowLeft className="size-3.5" />
                                Kembali ke Cari Talenta
                            </Link>

                            <div className="flex items-center gap-2">
                                <Button
                                    className={`h-9 cursor-pointer rounded-xl text-xs font-semibold transition-all ${
                                        saved
                                            ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                                    }`}
                                    disabled={isPending}
                                    onClick={toggleSave}
                                    size="sm"
                                    type="button"
                                    variant="outline"
                                >
                                    {saved ? (
                                        <>
                                            <BookmarkCheck className="mr-1.5 size-3.5 fill-blue-600 text-blue-600" />
                                            Tersimpan
                                        </>
                                    ) : (
                                        <>
                                            <Bookmark className="mr-1.5 size-3.5" />
                                            Simpan Kandidat
                                        </>
                                    )}
                                </Button>

                                <Button
                                    className="h-9 cursor-pointer rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white shadow-xs transition-all hover:bg-blue-700"
                                    size="sm"
                                >
                                    <Send className="mr-1.5 size-3.5" />
                                    Kirim Permintaan Kontak
                                </Button>
                            </div>
                        </div>

                        {/* Candidate Identity Card */}
                        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start">
                            {/* Avatar Icon */}
                            <div className="flex size-16 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl font-bold text-white shadow-md shadow-blue-500/20">
                                <UserRound className="size-8" />
                            </div>

                            {/* Info */}
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-mono text-xs font-bold text-slate-400">
                                        FOLIO-{candidate.id}
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                                        <CheckCircle2
                                            aria-hidden="true"
                                            className="size-3 text-emerald-600"
                                        />
                                        Portofolio Terverifikasi
                                    </span>
                                    <span
                                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${availability.badgeColor}`}
                                    >
                                        <span
                                            className={`size-1.5 rounded-full ${availability.dotColor}`}
                                        />
                                        {availability.label}
                                    </span>
                                </div>

                                <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                                    {candidate.headline ??
                                        'Talenta Terverifikasi'}
                                </h1>

                                {candidate.institution_name && (
                                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                                        <span className="inline-flex items-center gap-1.5 font-medium">
                                            <Building2
                                                aria-hidden="true"
                                                className="size-4 text-slate-400"
                                            />
                                            {candidate.institution_name}
                                        </span>
                                        {candidate.verified_at && (
                                            <span className="text-slate-400">
                                                Diverifikasi pada{' '}
                                                {new Intl.DateTimeFormat(
                                                    'id-ID',
                                                    {
                                                        dateStyle: 'medium',
                                                    },
                                                ).format(
                                                    new Date(
                                                        candidate.verified_at,
                                                    ),
                                                )}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </header>

                    {/* Privacy Boundary Banner */}
                    <div className="flex items-start gap-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-5 text-blue-950 shadow-xs">
                        <Lock
                            aria-hidden="true"
                            className="mt-0.5 size-5 shrink-0 text-blue-600"
                        />
                        <div>
                            <h2 className="text-xs font-bold tracking-wider text-blue-900 uppercase">
                                Batas Privasi Portofolio Perekrut
                            </h2>
                            <p className="mt-1 text-xs leading-relaxed text-blue-800/90">
                                {contactConsequenceNotice}
                            </p>
                        </div>
                    </div>

                    {/* Bio Card */}
                    {candidate.bio && (
                        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
                            <h2 className="text-sm font-bold text-slate-900">
                                Tentang Talenta
                            </h2>
                            <p className="mt-3 text-sm leading-relaxed text-slate-600">
                                {candidate.bio}
                            </p>
                        </div>
                    )}

                    {/* Skills Card */}
                    {candidate.skills.length > 0 && (
                        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                                <Sparkles className="size-4 text-blue-600" />
                                <h2 className="text-sm font-bold text-slate-900">
                                    Keahlian & Skill Terverifikasi
                                </h2>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                {candidate.skills.map((skill) => (
                                    <span
                                        key={skill}
                                        className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-3.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-800"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Badges Card */}
                    {candidate.badges.length > 0 && (
                        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                                <Award className="size-4 text-amber-600" />
                                <h2 className="text-sm font-bold text-slate-900">
                                    Badge & Penghargaan Akademik
                                </h2>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                {candidate.badges.map((badge) => (
                                    <span
                                        key={badge}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/80 px-3.5 py-1.5 text-xs font-semibold text-amber-900"
                                    >
                                        <Award
                                            aria-hidden="true"
                                            className="size-3.5 text-amber-600"
                                        />
                                        {badge}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Contributions Card */}
                    {candidate.contributions.length > 0 && (
                        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                                <FileCheck2 className="size-4 text-emerald-600" />
                                <h2 className="text-sm font-bold text-slate-900">
                                    Bukti Kontribusi Proyek Tervalidasi
                                </h2>
                            </div>

                            <ul className="mt-4 grid gap-3">
                                {candidate.contributions.map((contrib, idx) => {
                                    const isObj =
                                        typeof contrib === 'object' &&
                                        contrib !== null;
                                    const title = isObj
                                        ? (contrib as Record<string, unknown>)
                                              .title
                                        : contrib;
                                    const role = isObj
                                        ? ((contrib as Record<string, unknown>)
                                              .role as string | null)
                                        : null;

                                    return (
                                        <li
                                            key={idx}
                                            className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:justify-between"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                                                    <CheckCircle2 className="size-4" />
                                                </span>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-900">
                                                        {String(
                                                            title ??
                                                                'Kontribusi Proyek',
                                                        )}
                                                    </p>
                                                    {role && (
                                                        <p className="text-[0.6875rem] text-slate-500">
                                                            Peran:{' '}
                                                            {String(role)}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="w-fit rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[0.6875rem] font-semibold text-emerald-800">
                                                Tervalidasi di Ledger
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                </div>
            </AppPage>
        </>
    );
}

CandidateDetail.layout = {
    breadcrumbs: [
        {
            title: 'Talent Portal',
            href: talentSearch(),
        },
        {
            title: 'Cari Talenta',
            href: talentSearch(),
        },
        {
            title: 'Detail Profil',
            href: '#',
        },
    ],
};
