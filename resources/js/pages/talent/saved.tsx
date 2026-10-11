import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowUpRight,
    Award,
    BookOpenCheck,
    BookmarkCheck,
    Building2,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    FileText,
    LockKeyhole,
    RefreshCw,
    Search,
    ShieldCheck,
    Trash2,
    UsersRound,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { destroy as unsaveCandidate } from '@/actions/App/Http/Controllers/SavedCandidatesController';
import {
    index as talentSearch,
    show as showCandidate,
} from '@/actions/App/Http/Controllers/TalentSearchController';
import { AppPage } from '@/components/app-page';
import { DashboardArchiveArt as ArchiveArt } from '@/components/dashboard-archive-art';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { saved as savedCandidates } from '@/routes/recruiter/talent';
import { index as contactRequests } from '@/routes/recruiter/talent/contact-requests';

interface Candidate {
    id: number;
    headline: string | null;
    bio: string | null;
    skills: string[];
    badges: string[];
    contributions: unknown[];
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

function availabilityMeta(status: string) {
    switch (status) {
        case 'available':
            return {
                label: 'Tersedia untuk peluang',
                className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
            };
        case 'open_to_offers':
            return {
                label: 'Terbuka untuk penawaran',
                className: 'border-primary/20 bg-accent text-primary',
            };
        case 'not_available':
            return {
                label: 'Belum tersedia',
                className: 'border-border bg-background text-muted-foreground',
            };
        default:
            return {
                label: 'Ketersediaan belum dibagikan',
                className: 'border-border bg-background text-muted-foreground',
            };
    }
}

function accessLabel(status: string): string {
    switch (status) {
        case 'active':
            return 'Hak akses aktif';
        case 'expired':
            return 'Hak akses kedaluwarsa';
        case 'no_organization':
            return 'Organisasi belum aktif';
        case 'missing':
            return 'Hak akses belum aktif';
        default:
            return 'Hak akses perlu diperiksa';
    }
}

function SavedCandidateCard({
    candidate,
    disabled,
    onRemove,
}: {
    candidate: Candidate;
    disabled: boolean;
    onRemove: (button: HTMLButtonElement) => void;
}) {
    const availability = availabilityMeta(candidate.availability_status);

    return (
        <article
            aria-label={`Kandidat ${candidate.headline || 'portofolio mahasiswa'}`}
            className="@container min-w-0 overflow-hidden rounded-3xl border border-border bg-white shadow-sm focus-within:border-primary/30 focus-within:shadow-md"
        >
            <div className="grid gap-5 p-5 sm:p-6 @min-[40rem]:grid-cols-[minmax(0,1fr)_16rem]">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-label text-xs text-muted-foreground">
                            FOLIO-{candidate.id}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-accent px-2.5 py-1 text-xs font-semibold text-primary">
                            <BookmarkCheck
                                aria-hidden="true"
                                className="size-3.5"
                            />
                            Disimpan
                        </span>
                    </div>
                    <h3 className="mt-3 text-xl leading-tight font-bold tracking-tight break-words sm:text-2xl">
                        {candidate.headline || 'Portofolio mahasiswa'}
                    </h3>
                    <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-muted-foreground">
                        <Building2
                            aria-hidden="true"
                            className="mt-1 size-4 shrink-0"
                        />
                        <span className="min-w-0 break-words">
                            {candidate.institution_name ||
                                'Institusi kampus belum dibagikan.'}
                        </span>
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span
                            className={cn(
                                'max-w-full rounded-full border px-3 py-1 text-xs font-semibold',
                                availability.className,
                            )}
                        >
                            {availability.label}
                        </span>
                        {candidate.verified_at && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                                <CheckCircle2
                                    aria-hidden="true"
                                    className="size-4"
                                />
                                Portofolio terverifikasi
                            </span>
                        )}
                    </div>
                    <p className="mt-4 line-clamp-3 max-w-prose text-sm leading-6 break-words text-muted-foreground">
                        {candidate.bio || 'Ringkasan profil belum dibagikan.'}
                    </p>
                    {candidate.badges.length > 0 && (
                        <ul
                            aria-label="Badge kandidat"
                            className="mt-4 flex flex-wrap gap-2"
                        >
                            {candidate.badges.map((badge, index) => (
                                <li
                                    key={index}
                                    className="inline-flex max-w-full items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900"
                                >
                                    <Award
                                        aria-hidden="true"
                                        className="mt-0.5 size-3.5 shrink-0"
                                    />
                                    <span className="min-w-0 break-words">
                                        {badge}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="min-w-0 self-start rounded-2xl border border-primary/10 bg-gradient-to-br from-accent/70 to-background p-4">
                    <div className="flex items-center gap-2 text-primary">
                        <BookOpenCheck
                            aria-hidden="true"
                            className="size-4 shrink-0"
                        />
                        <p className="text-xs font-semibold tracking-wide uppercase">
                            Keahlian dibagikan
                        </p>
                    </div>
                    {candidate.skills.length > 0 ? (
                        <ul
                            aria-label="Keahlian kandidat"
                            className="mt-3 flex flex-wrap gap-2"
                        >
                            {candidate.skills.map((skill, index) => (
                                <li
                                    key={index}
                                    className="max-w-full rounded-lg border border-primary/10 bg-white px-2.5 py-1 text-xs font-medium break-words"
                                >
                                    {skill}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                            Belum ada skill yang dibagikan.
                        </p>
                    )}
                    <p className="mt-4 flex items-start gap-2 border-t border-primary/10 pt-3 text-xs leading-5 text-muted-foreground">
                        <FileText
                            aria-hidden="true"
                            className="mt-0.5 size-4 shrink-0"
                        />
                        <span>
                            {candidate.contributions.length} kontribusi
                            dibagikan. Rincian tersedia pada profil.
                        </span>
                    </p>
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 border-t border-border bg-background/50 px-5 py-4 sm:px-6">
                <Button
                    asChild
                    variant="outline"
                    className="h-11 flex-1 border-primary/20 bg-white text-primary sm:flex-none"
                >
                    <Link href={showCandidate(candidate.id)}>
                        Lihat profil
                        <ArrowUpRight aria-hidden="true" className="size-4" />
                    </Link>
                </Button>
                <Button
                    type="button"
                    aria-label={`Hapus ${candidate.headline || 'kandidat'} dari simpanan`}
                    variant="outline"
                    className="h-11 border-correction/20 bg-white px-3 text-correction hover:bg-correction/5 hover:text-correction sm:ml-auto"
                    disabled={disabled}
                    onClick={(event) => onRemove(event.currentTarget)}
                >
                    <Trash2 aria-hidden="true" className="size-4" />
                    Hapus
                </Button>
            </div>
        </article>
    );
}

function SavedContextRail({
    total,
    canView,
    status,
}: {
    total: number;
    canView: boolean;
    status: string;
}) {
    return (
        <aside
            aria-label="Panduan koleksi organisasi"
            className="min-w-0 space-y-6"
        >
            <section className="rounded-3xl border border-primary/15 bg-gradient-to-br from-white to-accent/60 p-5 shadow-sm sm:p-6">
                <span className="flex size-11 items-center justify-center rounded-2xl border border-primary/10 bg-white text-primary shadow-xs">
                    <LockKeyhole aria-hidden="true" className="size-5" />
                </span>
                <p className="mt-4 text-xs font-semibold tracking-wide text-primary uppercase">
                    Koleksi organisasi
                </p>
                <h2 className="mt-2 text-xl font-bold">
                    Tinjau kembali bersama tim.
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Simpanan ini tersedia dalam organisasi perekrut. Menghapus
                    kandidat dari daftar berlaku pada koleksi organisasi, bukan
                    menghapus profil mahasiswa.
                </p>
                <dl className="mt-5 divide-y divide-primary/10 border-t border-primary/10">
                    <div className="flex flex-wrap items-baseline justify-between gap-2 py-4">
                        <dt className="text-sm text-muted-foreground">
                            Total tersimpan
                        </dt>
                        <dd className="font-semibold">
                            {canView ? total : 'Belum tersedia'}
                        </dd>
                    </div>
                    <div className="grid gap-2 pt-4">
                        <dt className="text-sm text-muted-foreground">
                            Hak akses pencarian
                        </dt>
                        <dd className="flex items-start gap-2 text-sm font-semibold">
                            <ShieldCheck
                                aria-hidden="true"
                                className="mt-0.5 size-4 shrink-0 text-primary"
                            />
                            {accessLabel(status)}
                        </dd>
                    </div>
                </dl>
            </section>
            <section aria-labelledby="saved-next-heading" className="px-1">
                <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                    Lanjutkan peninjauan
                </p>
                <h2 id="saved-next-heading" className="mt-2 text-lg font-bold">
                    Langkah berikutnya
                </h2>
                <div className="mt-3 divide-y divide-border">
                    {[
                        {
                            href: talentSearch(),
                            label: 'Cari talenta',
                            description: 'Temukan portofolio lainnya.',
                            Icon: Search,
                        },
                        {
                            href: contactRequests(),
                            label: 'Permintaan kontak',
                            description:
                                'Tinjau permintaan yang sudah dikirim.',
                            Icon: UsersRound,
                        },
                    ].map(({ href, label, description, Icon }) => (
                        <Link
                            key={label}
                            href={href}
                            className="flex min-h-16 cursor-pointer items-center gap-3 rounded-xl py-3 transition-colors hover:bg-accent/60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                        >
                            <Icon
                                aria-hidden="true"
                                className="size-5 shrink-0 text-primary"
                            />
                            <span className="min-w-0 flex-1">
                                <span className="block text-sm font-semibold">
                                    {label}
                                </span>
                                <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                                    {description}
                                </span>
                            </span>
                            <ChevronRight
                                aria-hidden="true"
                                className="size-4 shrink-0 text-muted-foreground"
                            />
                        </Link>
                    ))}
                </div>
            </section>
            <div className="flex items-start gap-3 border-t border-border px-1 pt-5 text-sm leading-6 text-muted-foreground">
                <ShieldCheck
                    aria-hidden="true"
                    className="mt-1 size-5 shrink-0 text-primary"
                />
                <p>
                    Menyimpan kandidat tidak membuka kontak langsung. Jangkauan
                    profil tetap mengikuti pilihan mahasiswa dan hak akses
                    organisasi.
                </p>
            </div>
        </aside>
    );
}

export default function SavedCandidates({
    candidates,
    entitlement,
}: SavedCandidatesProps) {
    const [candidateToRemove, setCandidateToRemove] =
        useState<Candidate | null>(null);
    const [removingId, setRemovingId] = useState<number | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isForbidden, setIsForbidden] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [feedback, setFeedback] = useState('');
    const pageHeadingRef = useRef<HTMLHeadingElement>(null);
    const listHeadingRef = useRef<HTMLHeadingElement>(null);
    const removeTriggerRef = useRef<HTMLButtonElement | null>(null);
    const didRemoveRef = useRef(false);
    const lastPageRef = useRef(candidates.current_page);
    const isBusy = removingId !== null || isRefreshing;
    const canView = entitlement.has_entitlement && !isForbidden;
    const currentStatus = isForbidden ? 'unavailable' : entitlement.status;

    const failRequest = (forbidden = false): false => {
        if (forbidden) {
            setIsForbidden(true);
            setCandidateToRemove(null);
        }

        setHasError(true);
        setFeedback(
            'Belum dapat memastikan status daftar. Muat ulang untuk memeriksa kandidat tersimpan terbaru.',
        );

        return false;
    };

    const visitPage = (page = candidates.current_page) => {
        if (isBusy) {
            return;
        }

        lastPageRef.current = page;
        setIsRefreshing(true);
        setFeedback('Memuat daftar kandidat tersimpan.');
        router.get(
            savedCandidates({ query: { page } }),
            {},
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setIsForbidden(false);
                    setHasError(false);
                    setFeedback('Daftar kandidat tersimpan telah diperbarui.');
                },
                onError: () => {
                    failRequest();
                },
                onHttpException: (response) =>
                    failRequest(response.status === 403),
                onNetworkError: () => failRequest(),
                onFinish: () => setIsRefreshing(false),
            },
        );
    };

    const handleUnsave = () => {
        if (!candidateToRemove || isBusy || !canView) {
            return;
        }

        const candidateId = candidateToRemove.id;
        setRemovingId(candidateId);
        setHasError(false);
        setFeedback('Menghapus kandidat dari daftar simpanan organisasi.');
        router.delete(unsaveCandidate(candidateId), {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                didRemoveRef.current = true;
                setCandidateToRemove(null);
                setHasError(false);
                setFeedback(
                    'Kandidat dihapus dari daftar simpanan organisasi.',
                );
            },
            onError: () => {
                failRequest();
            },
            onHttpException: (response) => failRequest(response.status === 403),
            onNetworkError: () => failRequest(),
            onFinish: () => setRemovingId(null),
        });
    };

    return (
        <>
            <Head title="Kandidat tersimpan | SATU" />
            <AppPage className="max-w-none min-w-0">
                <div className="space-y-6" data-test="saved-candidates-root">
                    <header className="rounded-3xl border border-border bg-white p-5 shadow-sm sm:p-6">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 items-start gap-4">
                                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-accent text-primary">
                                    <BookmarkCheck
                                        aria-hidden="true"
                                        className="size-6"
                                    />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                                        Koleksi organisasi
                                    </p>
                                    <h1
                                        ref={pageHeadingRef}
                                        tabIndex={-1}
                                        className="mt-1 rounded-lg text-2xl leading-tight font-bold tracking-tight break-words focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring sm:text-3xl"
                                    >
                                        Kandidat tersimpan
                                    </h1>
                                    <p className="mt-2 max-w-prose text-sm leading-6 text-muted-foreground">
                                        Profil yang disimpan timmu untuk
                                        ditinjau kembali.
                                    </p>
                                </div>
                            </div>
                            <Button
                                asChild
                                className="h-11 shrink-0 sm:self-center"
                            >
                                <Link href={talentSearch()}>
                                    <Search
                                        aria-hidden="true"
                                        className="size-4"
                                    />
                                    Cari talenta
                                </Link>
                            </Button>
                        </div>
                    </header>

                    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]">
                        <section
                            aria-labelledby="saved-list-heading"
                            className="min-w-0 space-y-5"
                        >
                            <div className="flex flex-wrap items-end justify-between gap-3 px-1">
                                <div>
                                    <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                                        Daftar simpanan
                                    </p>
                                    <h2
                                        id="saved-list-heading"
                                        ref={listHeadingRef}
                                        tabIndex={-1}
                                        className="mt-2 rounded-lg text-xl font-bold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring sm:text-2xl"
                                    >
                                        {canView
                                            ? candidates.total +
                                              ' kandidat tersimpan'
                                            : 'Daftar belum tersedia'}
                                    </h2>
                                </div>
                                {canView && (
                                    <Button
                                        variant="outline"
                                        className="h-11"
                                        type="button"
                                        disabled={isBusy}
                                        onClick={() => visitPage()}
                                    >
                                        {isRefreshing ? (
                                            <Spinner aria-hidden="true" />
                                        ) : (
                                            <RefreshCw
                                                aria-hidden="true"
                                                className="size-4"
                                            />
                                        )}
                                        Muat ulang
                                    </Button>
                                )}
                            </div>
                            {canView && (
                                <p className="px-1 text-sm leading-6 text-muted-foreground">
                                    Menampilkan {candidates.data.length}{' '}
                                    kandidat. Halaman {candidates.current_page}.
                                </p>
                            )}
                            <div className="space-y-3 px-1">
                                <p
                                    role="status"
                                    className={cn(
                                        'min-h-5 text-sm leading-6',
                                        hasError
                                            ? 'text-correction'
                                            : 'text-muted-foreground',
                                    )}
                                >
                                    {candidateToRemove ? '' : feedback}
                                </p>
                                {hasError && !candidateToRemove && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-11"
                                        disabled={isBusy}
                                        onClick={() =>
                                            visitPage(lastPageRef.current)
                                        }
                                    >
                                        <RefreshCw
                                            aria-hidden="true"
                                            className="size-4"
                                        />
                                        Muat ulang status
                                    </Button>
                                )}
                            </div>

                            {!canView ? (
                                <div className="rounded-3xl border border-primary/15 bg-white p-6 shadow-sm sm:p-8">
                                    <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-primary">
                                        <LockKeyhole
                                            aria-hidden="true"
                                            className="size-6"
                                        />
                                    </span>
                                    <h3 className="mt-4 text-xl font-bold">
                                        {isForbidden
                                            ? 'Akses daftar simpanan tidak tersedia'
                                            : entitlement.status ===
                                                'no_organization'
                                              ? 'Organisasi perekrut belum aktif'
                                              : 'Hak akses pencarian diperlukan'}
                                    </h3>
                                    <p className="mt-3 max-w-prose text-sm leading-6 text-muted-foreground">
                                        {isForbidden
                                            ? 'Hak akses mungkin telah berubah. Data sebelumnya tidak ditampilkan. Muat ulang untuk memeriksa akses terbaru.'
                                            : 'Daftar kandidat hanya tersedia bagi organisasi dengan hak akses Talent Portal aktif. Hubungi admin platform untuk memeriksa organisasi dan aktivasi akses.'}
                                    </p>
                                </div>
                            ) : isRefreshing && candidates.data.length === 0 ? (
                                <div
                                    aria-busy="true"
                                    aria-label="Memuat koleksi kandidat"
                                >
                                    <div
                                        aria-hidden="true"
                                        className="grid gap-5"
                                    >
                                        {[1, 2, 3].map((index) => (
                                            <div
                                                key={index}
                                                className="rounded-3xl border border-border bg-white p-6"
                                            >
                                                <Skeleton className="h-4 w-1/3" />
                                                <Skeleton className="mt-4 h-7 w-3/4" />
                                                <Skeleton className="mt-4 h-4 w-full" />
                                                <Skeleton className="mt-5 h-24 w-full rounded-2xl" />
                                                <Skeleton className="mt-5 h-11 w-full rounded-xl" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : candidates.data.length === 0 ? (
                                <div className="grid justify-items-start gap-5 rounded-3xl border border-dashed border-primary/20 bg-white p-6 shadow-sm sm:p-8">
                                    <ArchiveArt className="w-28" />
                                    <div>
                                        <h3 className="text-xl font-bold sm:text-2xl">
                                            {candidates.total > 0
                                                ? 'Tidak ada kandidat pada halaman ini'
                                                : 'Belum ada kandidat yang disimpan'}
                                        </h3>
                                        <p className="mt-3 max-w-prose text-sm leading-6 text-muted-foreground">
                                            {candidates.total > 0
                                                ? 'Isi koleksi mungkin telah berubah. Kembali ke halaman sebelumnya untuk melanjutkan peninjauan.'
                                                : 'Simpan kandidat dari Cari Talenta agar timmu dapat menemukannya kembali. Menyimpan profil tidak mengirim permintaan kontak.'}
                                        </p>
                                    </div>
                                    <Button asChild className="h-11">
                                        <Link href={talentSearch()}>
                                            <Search
                                                aria-hidden="true"
                                                className="size-4"
                                            />
                                            Cari talenta
                                        </Link>
                                    </Button>
                                </div>
                            ) : (
                                <ul
                                    aria-label="Kandidat tersimpan"
                                    aria-busy={isRefreshing}
                                    className="grid gap-5"
                                >
                                    {candidates.data.map((candidate) => (
                                        <li
                                            key={candidate.id}
                                            className="min-w-0"
                                        >
                                            <SavedCandidateCard
                                                candidate={candidate}
                                                disabled={isBusy}
                                                onRemove={(button) => {
                                                    removeTriggerRef.current =
                                                        button;
                                                    didRemoveRef.current = false;
                                                    setHasError(false);
                                                    setFeedback('');
                                                    setCandidateToRemove(
                                                        candidate,
                                                    );
                                                }}
                                            />
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {canView &&
                                (candidates.last_page > 1 ||
                                    candidates.current_page > 1) && (
                                    <nav
                                        aria-label="Paginasi kandidat tersimpan"
                                        className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-1 pt-5"
                                    >
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="h-11"
                                            disabled={
                                                isBusy ||
                                                candidates.current_page <= 1
                                            }
                                            onClick={() =>
                                                visitPage(
                                                    candidates.current_page - 1,
                                                )
                                            }
                                        >
                                            <ChevronLeft
                                                aria-hidden="true"
                                                className="size-4"
                                            />
                                            Sebelumnya
                                        </Button>
                                        <span className="order-first w-full text-center text-sm text-muted-foreground sm:order-none sm:w-auto">
                                            Halaman {candidates.current_page}
                                        </span>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="h-11"
                                            disabled={
                                                isBusy ||
                                                candidates.current_page >=
                                                    candidates.last_page
                                            }
                                            onClick={() =>
                                                visitPage(
                                                    candidates.current_page + 1,
                                                )
                                            }
                                        >
                                            Berikutnya
                                            <ChevronRight
                                                aria-hidden="true"
                                                className="size-4"
                                            />
                                        </Button>
                                    </nav>
                                )}
                        </section>
                        <SavedContextRail
                            total={candidates.total}
                            canView={canView}
                            status={currentStatus}
                        />
                    </div>
                </div>
            </AppPage>

            <Dialog
                open={candidateToRemove !== null}
                onOpenChange={(open) => {
                    if (!open && !isBusy) {
                        setCandidateToRemove(null);
                    }
                }}
            >
                <DialogContent
                    closeButtonDisabled={isBusy}
                    onEscapeKeyDown={(event) => {
                        if (isBusy) {
                            event.preventDefault();
                        }
                    }}
                    onInteractOutside={(event) => {
                        if (isBusy) {
                            event.preventDefault();
                        }
                    }}
                    onCloseAutoFocus={(event) => {
                        event.preventDefault();

                        if (didRemoveRef.current) {
                            listHeadingRef.current?.focus();
                        } else if (removeTriggerRef.current?.isConnected) {
                            removeTriggerRef.current.focus();
                        } else {
                            pageHeadingRef.current?.focus();
                        }

                        didRemoveRef.current = false;
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>Hapus dari daftar simpanan?</DialogTitle>
                        <DialogDescription>
                            Kandidat akan dihapus dari koleksi organisasi.
                            Profil mahasiswa tidak dihapus dan dapat disimpan
                            kembali dari Cari Talenta.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="rounded-2xl border border-primary/10 bg-accent/60 p-4">
                        <p className="text-xs font-semibold text-muted-foreground">
                            Kandidat yang dipilih
                        </p>
                        <p className="mt-2 text-base font-semibold break-words">
                            {candidateToRemove?.headline ||
                                'Portofolio mahasiswa'}
                        </p>
                    </div>
                    <p
                        role={hasError ? 'alert' : 'status'}
                        className={cn(
                            'min-h-5 text-sm leading-6',
                            hasError
                                ? 'text-correction'
                                : 'text-muted-foreground',
                        )}
                    >
                        {candidateToRemove ? feedback : ''}
                    </p>
                    <DialogFooter>
                        {hasError && (
                            <Button
                                type="button"
                                variant="outline"
                                className="h-11"
                                disabled={isBusy}
                                onClick={() => {
                                    setCandidateToRemove(null);
                                    visitPage();
                                }}
                            >
                                <RefreshCw
                                    aria-hidden="true"
                                    className="size-4"
                                />
                                Muat ulang status
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="outline"
                            className="h-11"
                            disabled={isBusy}
                            onClick={() => setCandidateToRemove(null)}
                        >
                            Batalkan
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            className="h-11"
                            disabled={isBusy || !canView}
                            onClick={handleUnsave}
                        >
                            {removingId !== null ? (
                                <Spinner aria-hidden="true" />
                            ) : (
                                <Trash2 aria-hidden="true" className="size-4" />
                            )}
                            {removingId !== null
                                ? 'Menghapus'
                                : 'Hapus simpanan'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

SavedCandidates.layout = {
    breadcrumbs: [
        { title: 'Talent Portal', href: talentSearch() },
        { title: 'Kandidat tersimpan', href: savedCandidates() },
    ],
};
