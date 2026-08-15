import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Award,
    Bookmark,
    BookmarkCheck,
    BookmarkX,
    Building2,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Lock,
    Search,
    ShieldCheck,
    Trash2,
    UserCheck,
    UserRound,
    Users,
} from 'lucide-react';
import React, { useState, useTransition } from 'react';
import { destroy as unsaveCandidate } from '@/actions/App/Http/Controllers/SavedCandidatesController';
import {
    index as talentSearch,
    show as showCandidate,
} from '@/actions/App/Http/Controllers/TalentSearchController';
import { AppPage } from '@/components/app-page';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { saved as savedCandidates } from '@/routes/recruiter/talent';
import { index as contactRequests } from '@/routes/recruiter/talent/contact-requests';

interface Candidate {
    id: number;
    headline: string | null;
    bio: string | null;
    skills: string[];
    badges: string[];
    contributions: string[];
    availability_status: string;
    verified_at: string | null;
    institution_name: string | null;
}

interface SavedCandidatesProps {
    candidates: {
        data: Candidate[];
        total: number;
        current_page: number;
        last_page: number;
        per_page: number;
    };
    entitlement: {
        has_entitlement: boolean;
        status: string;
    };
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

function SavedContextRail({
    savedCount,
    hasEntitlement,
}: {
    savedCount: number;
    hasEntitlement: boolean;
}) {
    return (
        <div className="grid gap-6">
            {/* Card 1: Ruang Perekrut & Boundary */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                <div className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <Lock className="size-3.5" aria-hidden="true" />
                    </span>
                    <p className="font-label text-xs font-bold tracking-[0.1em] text-slate-500 uppercase">
                        RUANG PEREKRUT
                    </p>
                </div>

                <h2 className="mt-3 text-base font-bold tracking-tight text-slate-900">
                    Koleksi Internal
                </h2>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    Daftar kandidat ini hanya dapat dilihat oleh anggota tim
                    dalam organisasi perekrut Anda.
                </p>
            </div>

            {/* Card 2: Metrik & Status */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                <p className="font-label text-xs font-bold tracking-[0.1em] text-slate-500 uppercase">
                    STATUS PENYIMPANAN
                </p>

                <div className="mt-4 grid divide-y divide-slate-100">
                    <div className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-2.5">
                            <Bookmark className="size-4 text-blue-600" />
                            <span className="text-sm font-medium text-slate-700">
                                Total tersimpan
                            </span>
                        </div>
                        <span className="inline-flex size-6 items-center justify-center rounded-full bg-blue-50 font-mono text-xs font-bold text-blue-700">
                            {savedCount}
                        </span>
                    </div>

                    <div className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-2.5">
                            <ShieldCheck className="size-4 text-emerald-600" />
                            <span className="text-sm font-medium text-slate-700">
                                Hak akses
                            </span>
                        </div>
                        <span className="text-xs font-semibold text-slate-800">
                            {hasEntitlement ? 'Aktif' : 'Perlu aktivasi'}
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
                                Cari Talenta Baru
                            </p>
                            <p className="text-[0.6875rem] text-slate-500">
                                Telusuri portofolio mahasiswa
                            </p>
                        </div>
                    </div>
                    <ChevronRight className="size-4 text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-blue-600" />
                </Link>

                <Link
                    href={contactRequests()}
                    prefetch
                    className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                            <Users className="size-4" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-900">
                                Permintaan Kontak
                            </p>
                            <p className="text-[0.6875rem] text-slate-500">
                                Kelola penawaran kolaborasi
                            </p>
                        </div>
                    </div>
                    <ChevronRight className="size-4 text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-blue-600" />
                </Link>
            </div>
        </div>
    );
}

export default function SavedCandidates({
    candidates,
    entitlement,
}: SavedCandidatesProps) {
    const [savedList, setSavedList] = useState<Candidate[]>(candidates.data);
    const [isPending, startTransition] = useTransition();

    const handleUnsave = (candidateId: number) => {
        const previousList = [...savedList];
        setSavedList((prev) => prev.filter((c) => c.id !== candidateId));

        startTransition(() => {
            router.delete(unsaveCandidate(candidateId), {
                preserveState: true,
                preserveScroll: true,
                onError: () => {
                    setSavedList(previousList);
                },
            });
        });
    };

    return (
        <>
            <Head title="Kandidat Tersimpan | SATU" />

            <AppPage
                contextRail={
                    <SavedContextRail
                        hasEntitlement={entitlement.has_entitlement}
                        savedCount={savedList.length}
                    />
                }
                contextRailLabel="Konteks Kandidat Tersimpan"
            >
                <div className="space-y-6" data-test="saved-candidates-root">
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
                                        Kandidat Tersimpan
                                    </h1>
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                        <Bookmark className="size-3 text-blue-600" />
                                        Bookmark Private
                                    </span>
                                </div>

                                <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-slate-600">
                                    Daftar kandidat talenta pilihan yang telah
                                    Anda tandai untuk kebutuhan rekrutmen dan
                                    evaluasi internal tim Anda.
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

                    {/* Content Section */}
                    <div className="space-y-4">
                        {/* Meta Bar */}
                        <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-xs">
                            <div className="flex items-center gap-2">
                                <BookmarkCheck className="size-4.5 text-blue-600" />
                                <h2 className="text-sm font-bold text-slate-900">
                                    {savedList.length} Kandidat Tersimpan
                                </h2>
                            </div>
                            <span className="text-xs text-slate-500">
                                Halaman {candidates.current_page} dari{' '}
                                {candidates.last_page}
                            </span>
                        </div>

                        {/* Loading State */}
                        {isPending && (
                            <div className="grid gap-4">
                                {[1, 2].map((n) => (
                                    <div
                                        key={n}
                                        className="animate-pulse space-y-3 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs"
                                    >
                                        <div className="flex items-center gap-4">
                                            <Skeleton className="size-12 rounded-2xl bg-slate-100" />
                                            <div className="space-y-2">
                                                <Skeleton className="h-5 w-48 bg-slate-100" />
                                                <Skeleton className="h-4 w-32 bg-slate-100" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Empty State */}
                        {!isPending && savedList.length === 0 && (
                            <div className="grid justify-items-center gap-4 rounded-2xl border border-slate-200/80 bg-white px-6 py-16 text-center shadow-xs">
                                <div className="flex size-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-8 ring-blue-50/50">
                                    <BookmarkX
                                        aria-hidden="true"
                                        className="size-7"
                                    />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">
                                        Belum ada kandidat yang disimpan
                                    </h3>
                                    <p className="mx-auto mt-2 max-w-[46ch] text-xs leading-relaxed text-slate-600">
                                        Tandai kandidat berbakat saat menelusuri
                                        halaman Cari Talenta untuk menyimpannya
                                        ke dalam daftar bookmark organisasi
                                        Anda.
                                    </p>
                                </div>
                                <Button
                                    asChild
                                    className="cursor-pointer rounded-xl bg-blue-600 px-5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700"
                                >
                                    <Link href={talentSearch()} prefetch>
                                        <Search className="mr-1.5 size-3.5" />
                                        Jelajahi Cari Talenta
                                    </Link>
                                </Button>
                            </div>
                        )}

                        {/* Saved Candidates Cards */}
                        {!isPending && savedList.length > 0 && (
                            <div className="grid gap-4">
                                {savedList.map((candidate) => {
                                    const availability = availabilityMeta(
                                        candidate.availability_status,
                                    );

                                    return (
                                        <article
                                            key={candidate.id}
                                            className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                                        >
                                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                                <div className="flex items-start gap-4">
                                                    {/* Avatar Icon */}
                                                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-base font-bold text-white shadow-xs">
                                                        <UserRound className="size-6" />
                                                    </div>

                                                    {/* Candidate Info */}
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="font-mono text-xs font-bold text-slate-400">
                                                                FOLIO-
                                                                {candidate.id}
                                                            </span>
                                                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                                                                <CheckCircle2
                                                                    aria-hidden="true"
                                                                    className="size-3 text-emerald-600"
                                                                />
                                                                Terverifikasi
                                                            </span>
                                                            <span
                                                                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${availability.badgeColor}`}
                                                            >
                                                                <span
                                                                    className={`size-1.5 rounded-full ${availability.dotColor}`}
                                                                />
                                                                {
                                                                    availability.label
                                                                }
                                                            </span>
                                                        </div>

                                                        <h3 className="mt-2 text-lg font-bold tracking-tight text-slate-900 transition-colors group-hover:text-blue-600">
                                                            {candidate.headline ??
                                                                'Talenta Terverifikasi'}
                                                        </h3>

                                                        {candidate.institution_name && (
                                                            <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-600">
                                                                <Building2
                                                                    aria-hidden="true"
                                                                    className="size-3.5 text-slate-400"
                                                                />
                                                                <span>
                                                                    {
                                                                        candidate.institution_name
                                                                    }
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex shrink-0 items-center gap-2 sm:self-start">
                                                    <Button
                                                        asChild
                                                        className="h-10 cursor-pointer rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white shadow-xs transition-all hover:bg-blue-700"
                                                    >
                                                        <Link
                                                            href={showCandidate(
                                                                candidate.id,
                                                            )}
                                                            prefetch
                                                        >
                                                            Lihat profil
                                                            <ChevronRight
                                                                aria-hidden="true"
                                                                className="ml-1 size-3.5"
                                                            />
                                                        </Link>
                                                    </Button>

                                                    <Button
                                                        aria-label={`Hapus ${candidate.headline ?? 'kandidat'} dari simpanan`}
                                                        className="h-10 cursor-pointer rounded-xl border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 hover:text-rose-800"
                                                        onClick={() =>
                                                            handleUnsave(
                                                                candidate.id,
                                                            )
                                                        }
                                                        size="sm"
                                                        type="button"
                                                        variant="outline"
                                                    >
                                                        <Trash2 className="mr-1 size-3.5 text-rose-600" />
                                                        Hapus
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Bio */}
                                            {candidate.bio && (
                                                <p className="mt-3 text-xs leading-relaxed text-slate-600">
                                                    {candidate.bio}
                                                </p>
                                            )}

                                            {/* Skills & Badges */}
                                            <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3.5">
                                                {candidate.skills.map(
                                                    (skill) => (
                                                        <span
                                                            key={skill}
                                                            className="rounded-lg border border-slate-200/80 bg-slate-50/80 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-800"
                                                        >
                                                            {skill}
                                                        </span>
                                                    ),
                                                )}

                                                {candidate.badges.map(
                                                    (badge) => (
                                                        <span
                                                            key={badge}
                                                            className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50/80 px-2.5 py-1 text-xs font-semibold text-amber-900"
                                                        >
                                                            <Award
                                                                aria-hidden="true"
                                                                className="size-3 text-amber-600"
                                                            />
                                                            {badge}
                                                        </span>
                                                    ),
                                                )}
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}

                        {/* Pagination */}
                        {candidates.last_page > 1 && (
                            <nav
                                aria-label="Paginasi kandidat tersimpan"
                                className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs"
                            >
                                <Button
                                    className="cursor-pointer rounded-xl text-xs font-semibold"
                                    disabled={candidates.current_page <= 1}
                                    onClick={() =>
                                        router.get(
                                            savedCandidates(),
                                            {
                                                page:
                                                    candidates.current_page - 1,
                                            },
                                            { preserveScroll: true },
                                        )
                                    }
                                    type="button"
                                    variant="outline"
                                >
                                    <ChevronLeft
                                        aria-hidden="true"
                                        className="mr-1 size-3.5"
                                    />
                                    Sebelumnya
                                </Button>

                                <span className="text-xs font-semibold text-slate-600">
                                    Halaman {candidates.current_page} dari{' '}
                                    {candidates.last_page}
                                </span>

                                <Button
                                    className="cursor-pointer rounded-xl text-xs font-semibold"
                                    disabled={
                                        candidates.current_page >=
                                        candidates.last_page
                                    }
                                    onClick={() =>
                                        router.get(
                                            savedCandidates(),
                                            {
                                                page:
                                                    candidates.current_page + 1,
                                            },
                                            { preserveScroll: true },
                                        )
                                    }
                                    type="button"
                                    variant="outline"
                                >
                                    Berikutnya
                                    <ChevronRight
                                        aria-hidden="true"
                                        className="ml-1 size-3.5"
                                    />
                                </Button>
                            </nav>
                        )}
                    </div>
                </div>
            </AppPage>
        </>
    );
}

SavedCandidates.layout = {
    breadcrumbs: [
        {
            title: 'Talent Portal',
            href: talentSearch(),
        },
        {
            title: 'Kandidat Tersimpan',
            href: savedCandidates(),
        },
    ],
};
