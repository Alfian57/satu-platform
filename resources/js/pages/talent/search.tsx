import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowUpRight,
    Award,
    Bookmark,
    BookmarkCheck,
    Building2,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    LockKeyhole,
    RotateCcw,
    Search,
    ShieldCheck,
    UsersRound,
    X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import {
    destroy as unsaveCandidate,
    store as saveCandidate,
} from '@/actions/App/Http/Controllers/SavedCandidatesController';
import {
    index as talentSearch,
    show as showCandidate,
} from '@/actions/App/Http/Controllers/TalentSearchController';
import { AppPage } from '@/components/app-page';
import { DashboardArchiveArt as ArchiveArt } from '@/components/dashboard-archive-art';
import Mascot from '@/components/mascot';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    contributions: (string | { title?: string | null })[];
    availability_status: string;
    verified_at: string | null;
    institution_name: string | null;
}

interface TalentSearchProps {
    candidates: {
        data: Candidate[];
        total: number;
        current_page: number;
        last_page: number;
        per_page: number;
    };
    filters: {
        query?: string;
        skills?: string[];
        badges?: string[];
        availability?: string;
        institution_id?: string;
    };
    entitlement: {
        has_entitlement: boolean;
        status: string;
        expires_at?: string | null;
    };
    institutions: { id: number; name: string }[];
    savedCandidateIds?: number[];
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
                label: 'Ketersediaan belum dicantumkan',
                className: 'border-border bg-background text-muted-foreground',
            };
    }
}

function entitlementLabel(status: string): string {
    switch (status) {
        case 'active':
            return 'Hak akses aktif';
        case 'expired':
            return 'Hak akses berakhir';
        case 'no_organization':
            return 'Organisasi belum aktif';
        case 'unavailable':
            return 'Hak akses perlu diperiksa';
        default:
            return 'Hak akses diperlukan';
    }
}

function TalentContextRail({
    entitlement,
    savedCount,
}: {
    entitlement: TalentSearchProps['entitlement'];
    savedCount: number;
}) {
    return (
        <aside
            aria-label="Panduan ruang perekrut"
            className="min-w-0 space-y-6 xl:col-start-2 xl:row-start-1"
        >
            <section className="rounded-3xl border border-primary/15 bg-gradient-to-br from-white to-accent/70 p-5 shadow-sm sm:p-6">
                <span className="flex size-11 items-center justify-center rounded-2xl border border-primary/10 bg-white text-primary shadow-xs">
                    <ShieldCheck aria-hidden="true" className="size-5" />
                </span>
                <h2 className="mt-4 text-xl font-bold tracking-tight">
                    Kenali karya, hormati pilihan.
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Hanya portofolio yang diizinkan mahasiswa yang tampil.
                    Kontak langsung mengikuti persetujuan kandidat atas
                    permintaan kontak.
                </p>
                <div className="mt-5 border-t border-primary/10 pt-4">
                    <p className="text-xs font-semibold text-muted-foreground">
                        Status akses organisasi
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                        {entitlementLabel(entitlement.status)}
                    </p>
                    {entitlement.has_entitlement && entitlement.expires_at && (
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">
                            Berlaku hingga{' '}
                            {new Intl.DateTimeFormat('id-ID', {
                                dateStyle: 'medium',
                            }).format(new Date(entitlement.expires_at))}
                            .
                        </p>
                    )}
                </div>
            </section>
            <section aria-labelledby="talent-next-heading" className="px-1">
                <p className="text-xs font-semibold tracking-wider text-primary uppercase">
                    Langkah berikutnya
                </p>
                <h2 id="talent-next-heading" className="mt-2 text-lg font-bold">
                    Lanjutkan penelusuranmu
                </h2>
                <div className="mt-3 divide-y divide-border">
                    <Link
                        href={savedCandidates()}
                        className="flex min-h-16 cursor-pointer items-center gap-3 rounded-xl py-3 transition-colors hover:bg-accent/60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                    >
                        <Bookmark
                            aria-hidden="true"
                            className="size-5 shrink-0 text-primary"
                        />
                        <span className="min-w-0 flex-1 text-sm font-semibold">
                            Kandidat tersimpan{' '}
                            <span className="ml-1 font-normal text-muted-foreground">
                                ({savedCount})
                            </span>
                        </span>
                        <ChevronRight
                            aria-hidden="true"
                            className="size-4 shrink-0 text-muted-foreground"
                        />
                    </Link>
                    <Link
                        href={contactRequests()}
                        className="flex min-h-16 cursor-pointer items-center gap-3 rounded-xl py-3 transition-colors hover:bg-accent/60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                    >
                        <UsersRound
                            aria-hidden="true"
                            className="size-5 shrink-0 text-primary"
                        />
                        <span className="min-w-0 flex-1 text-sm font-semibold">
                            Permintaan kontak
                        </span>
                        <ChevronRight
                            aria-hidden="true"
                            className="size-4 shrink-0 text-muted-foreground"
                        />
                    </Link>
                </div>
            </section>
            <div className="flex gap-3 border-t border-border px-1 pt-5 text-sm leading-6 text-muted-foreground">
                <CheckCircle2
                    aria-hidden="true"
                    className="mt-0.5 size-5 shrink-0 text-primary"
                />
                <p>
                    Baca kontribusi dan badge yang dibagikan untuk memahami
                    pengalaman kandidat. Detail profil menjelaskan bukti yang
                    dapat dilihat.
                </p>
            </div>
        </aside>
    );
}

function CandidateCard({
    candidate,
    saved,
    saving,
    disabled,
    onSave,
}: {
    candidate: Candidate;
    saved: boolean;
    saving: boolean;
    disabled: boolean;
    onSave: () => void;
}) {
    const availability = availabilityMeta(candidate.availability_status);

    return (
        <article
            aria-label={`Kandidat ${candidate.headline || 'portofolio mahasiswa'}`}
            className="flex min-w-0 flex-col overflow-hidden rounded-3xl border border-border bg-white shadow-sm focus-within:border-primary/30 focus-within:shadow-md"
        >
            <div className="flex-1 p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-label text-xs text-muted-foreground">
                        FOLIO-{candidate.id}
                    </span>
                    <span
                        className={cn(
                            'max-w-full rounded-full border px-3 py-1 text-xs font-semibold',
                            availability.className,
                        )}
                    >
                        {availability.label}
                    </span>
                </div>
                <h3 className="mt-4 text-xl leading-tight font-bold tracking-tight break-words sm:text-2xl">
                    {candidate.headline || 'Portofolio mahasiswa'}
                </h3>
                {candidate.institution_name && (
                    <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-muted-foreground">
                        <Building2
                            aria-hidden="true"
                            className="mt-1 size-4 shrink-0"
                        />
                        <span className="min-w-0 break-words">
                            {candidate.institution_name}
                        </span>
                    </p>
                )}
                {candidate.verified_at && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                        <CheckCircle2 aria-hidden="true" className="size-4" />
                        Portofolio terverifikasi
                    </p>
                )}
                {candidate.bio && (
                    <p className="mt-4 line-clamp-3 text-sm leading-6 break-words text-muted-foreground">
                        {candidate.bio}
                    </p>
                )}
                <div className="mt-5 rounded-2xl border border-primary/10 bg-gradient-to-br from-accent/80 to-background p-4">
                    <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                        Keahlian yang dibagikan
                    </p>
                    {candidate.skills.length > 0 ? (
                        <ul
                            aria-label="Keahlian kandidat"
                            className="mt-3 flex flex-wrap gap-2"
                        >
                            {candidate.skills.map((skill) => (
                                <li
                                    key={skill}
                                    className="max-w-full rounded-lg border border-primary/10 bg-white px-2.5 py-1 text-xs font-medium break-words"
                                >
                                    {skill}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="mt-2 text-sm text-muted-foreground">
                            Belum ada skill yang dibagikan.
                        </p>
                    )}
                </div>
                {candidate.contributions.length > 0 && (
                    <div className="mt-5 border-t border-border pt-4">
                        <p className="text-xs font-semibold text-muted-foreground">
                            Kontribusi yang dibagikan
                        </p>
                        <ul className="mt-2 space-y-2">
                            {candidate.contributions
                                .slice(0, 2)
                                .map((contribution, index) => (
                                    <li
                                        key={index}
                                        className="flex gap-2 text-sm leading-6 break-words"
                                    >
                                        <CheckCircle2
                                            aria-hidden="true"
                                            className="mt-1 size-4 shrink-0 text-primary"
                                        />
                                        <span className="min-w-0">
                                            {typeof contribution === 'string'
                                                ? contribution
                                                : contribution.title ||
                                                  'Karya yang dibagikan'}
                                        </span>
                                    </li>
                                ))}
                        </ul>
                        {candidate.contributions.length > 2 && (
                            <p className="mt-2 text-xs text-muted-foreground">
                                Kontribusi lainnya tersedia di profil.
                            </p>
                        )}
                    </div>
                )}
                {candidate.badges.length > 0 && (
                    <ul
                        aria-label="Badge kandidat"
                        className="mt-4 flex flex-wrap gap-2"
                    >
                        {candidate.badges.map((badge) => (
                            <li
                                key={badge}
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
            <div className="flex flex-wrap items-center gap-3 border-t border-border bg-background/50 px-5 py-4 sm:px-6">
                <Button
                    asChild
                    variant="outline"
                    className="h-11 flex-1 border-primary/20 bg-white text-primary"
                >
                    <Link href={showCandidate(candidate.id)}>
                        Lihat profil
                        <ArrowUpRight aria-hidden="true" className="size-4" />
                    </Link>
                </Button>
                <Button
                    aria-label={
                        saved
                            ? `Hapus ${candidate.headline || 'kandidat'} dari simpanan`
                            : `Simpan ${candidate.headline || 'kandidat'}`
                    }
                    aria-pressed={saved}
                    disabled={disabled}
                    onClick={onSave}
                    type="button"
                    variant="outline"
                    className={cn(
                        'h-11 px-3',
                        saved && 'border-primary/20 bg-accent text-primary',
                    )}
                >
                    {saving ? (
                        <Spinner aria-hidden="true" />
                    ) : saved ? (
                        <BookmarkCheck aria-hidden="true" className="size-4" />
                    ) : (
                        <Bookmark aria-hidden="true" className="size-4" />
                    )}
                    <span className="text-sm">
                        {saving ? 'Memproses' : saved ? 'Tersimpan' : 'Simpan'}
                    </span>
                </Button>
            </div>
        </article>
    );
}

function CandidateSkeleton() {
    return (
        <div
            aria-hidden="true"
            className="grid gap-5 @min-[44rem]:grid-cols-2 @min-[56rem]:grid-cols-3"
        >
            {[1, 2, 3].map((index) => (
                <div
                    key={index}
                    className="min-w-0 rounded-3xl border border-border bg-white p-6"
                >
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="mt-5 h-7 w-4/5" />
                    <Skeleton className="mt-4 h-4 w-full" />
                    <Skeleton className="mt-6 h-24 w-full rounded-2xl" />
                    <Skeleton className="mt-6 h-11 w-full rounded-xl" />
                </div>
            ))}
        </div>
    );
}

export default function TalentSearch({
    candidates,
    filters,
    entitlement,
    institutions,
    savedCandidateIds = [],
}: TalentSearchProps) {
    const [searchQuery, setSearchQuery] = useState(filters.query || '');
    const [selectedAvailability, setSelectedAvailability] = useState(
        filters.availability || '',
    );
    const [selectedInstitution, setSelectedInstitution] = useState(
        filters.institution_id || '',
    );
    const [skillInput, setSkillInput] = useState('');
    const [selectedSkills, setSelectedSkills] = useState<string[]>(
        filters.skills || [],
    );
    const [savedIds, setSavedIds] = useState(savedCandidateIds);
    const [isPending, setIsPending] = useState(false);
    const [savingId, setSavingId] = useState<number | null>(null);
    const [hasError, setHasError] = useState(false);
    const [isForbidden, setIsForbidden] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const [saveError, setSaveError] = useState(false);
    const lastSearch = useRef(talentSearch());
    const canSearch = entitlement.has_entitlement && !isForbidden;
    const isBusy = isPending || savingId !== null;
    const activeFilterCount =
        Number(searchQuery.length > 0) +
        selectedSkills.length +
        (filters.badges?.length ?? 0) +
        Number(selectedAvailability.length > 0) +
        Number(selectedInstitution.length > 0);
    const filterQuery = (page?: number) => ({
        query: searchQuery || undefined,
        skills: selectedSkills.length ? selectedSkills.join(',') : undefined,
        badges: filters.badges?.length ? filters.badges.join(',') : undefined,
        availability: selectedAvailability || undefined,
        institution_id: selectedInstitution || undefined,
        page,
    });

    const searchFailure = (forbidden = false): false => {
        setHasError(true);

        if (forbidden) {
            setIsForbidden(true);
        }

        return false;
    };
    const visitSearch = (target = talentSearch({ query: filterQuery() })) => {
        lastSearch.current = target;
        setHasError(false);
        setIsPending(true);
        router.get(
            target,
            {},
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
                onSuccess: (page) => {
                    setHasError(false);
                    setIsForbidden(false);
                    const latestSavedIds = page.props.savedCandidateIds;

                    if (Array.isArray(latestSavedIds)) {
                        setSavedIds(
                            latestSavedIds.filter(
                                (id): id is number => typeof id === 'number',
                            ),
                        );
                    }

                    setSaveMessage('');
                    setSaveError(false);
                },
                onError: () => {
                    setHasError(true);
                },
                onHttpException: (response) =>
                    searchFailure(response.status === 403),
                onNetworkError: () => searchFailure(),
                onFinish: () => setIsPending(false),
            },
        );
    };
    const handleFilterSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!isBusy && canSearch) {
            visitSearch();
        }
    };
    const addSkill = () => {
        const trimmed = skillInput.trim();

        if (trimmed && !selectedSkills.includes(trimmed)) {
            setSelectedSkills((current) => [...current, trimmed]);
        }

        setSkillInput('');
    };
    const resetFilters = () => {
        setSearchQuery('');
        setSelectedAvailability('');
        setSelectedInstitution('');
        setSelectedSkills([]);
        setSkillInput('');
        visitSearch(talentSearch());
    };
    const toggleSaveCandidate = (candidateId: number) => {
        if (isBusy || !canSearch) {
            return;
        }

        const wasSaved = savedIds.includes(candidateId);
        setSavingId(candidateId);
        setSaveError(false);
        setSaveMessage('Memproses perubahan kandidat tersimpan.');
        const failSave = (forbidden = false): false => {
            if (forbidden) {
                setIsForbidden(true);
            }

            setSaveError(true);
            setSaveMessage(
                'Belum dapat memastikan perubahan tersimpan. Muat ulang untuk memeriksa status terbaru.',
            );

            return false;
        };
        const options = {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setSavedIds((current) =>
                    wasSaved
                        ? current.filter((id) => id !== candidateId)
                        : [...new Set([...current, candidateId])],
                );
                setSaveMessage(
                    wasSaved
                        ? 'Kandidat dihapus dari simpanan.'
                        : 'Kandidat berhasil disimpan.',
                );
            },
            onError: () => {
                failSave();
            },
            onHttpException: (response: { status: number }) =>
                failSave(response.status === 403),
            onNetworkError: () => failSave(),
            onFinish: () => setSavingId(null),
        };

        if (wasSaved) {
            router.delete(unsaveCandidate(candidateId), options);
        } else {
            router.post(saveCandidate(candidateId), {}, options);
        }
    };

    return (
        <>
            <Head title="Cari Talenta" />
            <AppPage className="max-w-none min-w-0">
                <div className="space-y-6" data-test="talent-search-root">
                    <header className="relative isolate overflow-hidden rounded-[2rem] border border-primary/10 bg-gradient-to-br from-[#dff1ff] via-[#edf6ff] to-white p-6 shadow-md sm:p-8 lg:p-10">
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0"
                        >
                            <ArchiveArt className="absolute top-4 right-24 hidden w-36 -rotate-6 opacity-50 sm:block lg:right-48 lg:w-44" />
                            <span className="absolute top-10 right-8 h-10 w-2 rotate-12 rounded-full bg-[#ffb85c]/75" />
                        </div>
                        <div className="relative grid items-center gap-5 sm:grid-cols-[minmax(0,1fr)_9rem] lg:grid-cols-[minmax(0,1fr)_13rem] 2xl:grid-cols-[minmax(0,1fr)_16rem]">
                            <div className="min-w-0">
                                <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
                                    Ruang perekrut
                                </p>
                                <h1 className="mt-3 text-3xl leading-tight font-bold tracking-[-0.035em] sm:text-4xl 2xl:text-5xl">
                                    Temukan talenta.
                                    <br />
                                    <span className="text-primary">
                                        Kenali cerita di balik karya.
                                    </span>
                                </h1>
                                <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                                    Telusuri portofolio yang diizinkan
                                    mahasiswa. Mulai dari keahlian dan
                                    pengalaman yang relevan, lalu lanjutkan
                                    percakapan dengan persetujuan kandidat.
                                </p>
                                <p className="mt-5 inline-flex max-w-full items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-3 py-2 text-sm font-semibold">
                                    <ShieldCheck
                                        aria-hidden="true"
                                        className="size-4 shrink-0 text-primary"
                                    />
                                    {isForbidden
                                        ? 'Hak akses perlu diperiksa'
                                        : entitlementLabel(entitlement.status)}
                                </p>
                            </div>
                            <Mascot
                                pose="guide"
                                priority
                                className="mx-auto w-28 sm:w-full"
                            />
                        </div>
                    </header>

                    {!entitlement.has_entitlement && (
                        <section
                            aria-labelledby="entitlement-warning-heading"
                            className="flex gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-950"
                        >
                            <LockKeyhole
                                aria-hidden="true"
                                className="mt-1 size-5 shrink-0"
                            />
                            <div>
                                <h2
                                    id="entitlement-warning-heading"
                                    className="font-semibold"
                                >
                                    {entitlement.status === 'expired'
                                        ? 'Hak akses pencarian telah berakhir'
                                        : entitlement.status ===
                                            'no_organization'
                                          ? 'Organisasi perekrut belum aktif'
                                          : 'Hak akses pencarian diperlukan'}
                                </h2>
                                <p className="mt-2 text-sm leading-6">
                                    Organisasi perekrut memerlukan hak akses
                                    Talent Portal yang aktif. Hubungi admin
                                    platform untuk memeriksa organisasi dan
                                    aktivasi akses. Daftar kandidat belum dapat
                                    ditampilkan.
                                </p>
                            </div>
                        </section>
                    )}

                    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]">
                        <div className="min-w-0 space-y-6 xl:contents xl:space-y-0">
                            <section
                                aria-labelledby="talent-filters-heading"
                                className="rounded-3xl border border-primary/15 bg-white p-5 shadow-md sm:p-6 xl:col-start-1 xl:row-start-1 xl:flex xl:flex-col xl:self-stretch"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                                            Mulai penelusuran
                                        </p>
                                        <h2
                                            id="talent-filters-heading"
                                            className="mt-2 text-xl font-bold"
                                        >
                                            Apa yang sedang kamu cari?
                                        </h2>
                                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                            Gunakan kata kunci atau persempit
                                            dengan filter yang relevan.
                                        </p>
                                    </div>
                                    {activeFilterCount > 0 && (
                                        <span className="rounded-full border border-primary/15 bg-accent px-3 py-1 text-xs font-semibold text-primary">
                                            {activeFilterCount} filter dipilih
                                        </span>
                                    )}
                                </div>
                                <form
                                    onSubmit={handleFilterSubmit}
                                    aria-label="Filter pencarian talenta"
                                    className="mt-5 space-y-5 xl:flex xl:flex-1 xl:flex-col xl:gap-6 xl:space-y-0"
                                >
                                    <fieldset
                                        disabled={isBusy || !canSearch}
                                        className="min-w-0 space-y-4 disabled:opacity-70 xl:flex xl:flex-1 xl:flex-col xl:justify-between xl:gap-6 xl:space-y-0"
                                    >
                                        <legend className="sr-only">
                                            Kata kunci dan pilihan filter
                                        </legend>
                                        <div className="grid gap-2">
                                            <Label htmlFor="talent-query">
                                                Kata kunci
                                            </Label>
                                            <div className="relative">
                                                <Search
                                                    aria-hidden="true"
                                                    className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
                                                />
                                                <Input
                                                    id="talent-query"
                                                    aria-describedby="talent-query-help"
                                                    className="h-12 pl-12 text-base md:text-base"
                                                    placeholder="Contoh: desainer produk atau pengembang web"
                                                    value={searchQuery}
                                                    onChange={(event) =>
                                                        setSearchQuery(
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                            </div>
                                            <p
                                                id="talent-query-help"
                                                className="text-sm leading-6 text-muted-foreground"
                                            >
                                                Cari peran atau bidang pada
                                                judul dan ringkasan profil.
                                                Untuk keahlian khusus, gunakan
                                                filter skill di bawah.
                                            </p>
                                        </div>
                                        <div className="grid items-start gap-4 md:grid-cols-2">
                                            <div className="grid min-w-0 gap-2">
                                                <Label htmlFor="talent-availability">
                                                    Ketersediaan
                                                </Label>
                                                <select
                                                    id="talent-availability"
                                                    aria-describedby="talent-availability-help"
                                                    className="h-11 w-full min-w-0 cursor-pointer rounded-xl border border-input bg-white px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed"
                                                    value={selectedAvailability}
                                                    onChange={(event) =>
                                                        setSelectedAvailability(
                                                            event.target.value,
                                                        )
                                                    }
                                                >
                                                    <option value="">
                                                        Semua status
                                                    </option>
                                                    <option value="available">
                                                        Tersedia untuk peluang
                                                    </option>
                                                    <option value="open_to_offers">
                                                        Terbuka untuk penawaran
                                                    </option>
                                                    <option value="not_available">
                                                        Belum tersedia
                                                    </option>
                                                </select>
                                                <p
                                                    id="talent-availability-help"
                                                    className="text-sm leading-6 text-muted-foreground"
                                                >
                                                    Pilih status ketersediaan
                                                    mahasiswa. Biarkan Semua
                                                    status jika tidak ingin
                                                    membatasi ketersediaan.
                                                </p>
                                            </div>
                                            <div className="grid min-w-0 gap-2">
                                                <Label htmlFor="talent-institution">
                                                    Institusi kampus
                                                </Label>
                                                <select
                                                    id="talent-institution"
                                                    aria-describedby="talent-institution-help"
                                                    className="h-11 w-full min-w-0 cursor-pointer rounded-xl border border-input bg-white px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed"
                                                    value={selectedInstitution}
                                                    onChange={(event) =>
                                                        setSelectedInstitution(
                                                            event.target.value,
                                                        )
                                                    }
                                                >
                                                    <option value="">
                                                        Semua institusi
                                                    </option>
                                                    {institutions.map(
                                                        (institution) => (
                                                            <option
                                                                key={
                                                                    institution.id
                                                                }
                                                                value={
                                                                    institution.id
                                                                }
                                                            >
                                                                {
                                                                    institution.name
                                                                }
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                                <p
                                                    id="talent-institution-help"
                                                    className="text-sm leading-6 text-muted-foreground"
                                                >
                                                    Batasi hasil ke kampus
                                                    tertentu, atau pilih Semua
                                                    institusi untuk mencari
                                                    lintas kampus.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="talent-skill">
                                                Keahlian atau skill
                                            </Label>
                                            <div className="flex min-w-0 gap-2">
                                                <Input
                                                    id="talent-skill"
                                                    aria-describedby="talent-skill-help"
                                                    className="h-11 min-w-0 text-base md:text-base"
                                                    value={skillInput}
                                                    placeholder="Contoh: desain produk"
                                                    onChange={(event) =>
                                                        setSkillInput(
                                                            event.target.value,
                                                        )
                                                    }
                                                    onKeyDown={(event) => {
                                                        if (
                                                            event.key ===
                                                            'Enter'
                                                        ) {
                                                            event.preventDefault();
                                                            addSkill();
                                                        }
                                                    }}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="h-11 shrink-0"
                                                    disabled={
                                                        !skillInput.trim()
                                                    }
                                                    onClick={addSkill}
                                                >
                                                    Tambah
                                                </Button>
                                            </div>
                                            <p
                                                id="talent-skill-help"
                                                className="text-xs leading-5 text-muted-foreground"
                                            >
                                                Tekan Enter atau Tambah, lalu
                                                terapkan pencarian.
                                            </p>
                                        </div>
                                        {selectedSkills.length > 0 && (
                                            <ul
                                                aria-label="Skill yang dipilih"
                                                className="flex flex-wrap gap-2"
                                            >
                                                {selectedSkills.map((skill) => (
                                                    <li
                                                        key={skill}
                                                        className="inline-flex max-w-full items-center gap-1 rounded-xl border border-primary/15 bg-accent pl-3 text-sm font-medium text-primary"
                                                    >
                                                        <span className="min-w-0 break-words">
                                                            {skill}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            aria-label={`Hapus skill ${skill}`}
                                                            className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed"
                                                            onClick={() =>
                                                                setSelectedSkills(
                                                                    (current) =>
                                                                        current.filter(
                                                                            (
                                                                                value,
                                                                            ) =>
                                                                                value !==
                                                                                skill,
                                                                        ),
                                                                )
                                                            }
                                                        >
                                                            <X
                                                                aria-hidden="true"
                                                                className="size-4"
                                                            />
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </fieldset>
                                    <div className="flex flex-wrap gap-3 border-t border-border pt-4">
                                        <Button
                                            type="submit"
                                            className="h-11"
                                            disabled={isBusy || !canSearch}
                                        >
                                            {isPending ? (
                                                <Spinner aria-hidden="true" />
                                            ) : (
                                                <Search
                                                    aria-hidden="true"
                                                    className="size-4"
                                                />
                                            )}
                                            {isPending
                                                ? 'Memuat talenta'
                                                : 'Cari talenta'}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            className="h-11"
                                            disabled={
                                                isBusy ||
                                                !canSearch ||
                                                activeFilterCount === 0
                                            }
                                            onClick={resetFilters}
                                        >
                                            <RotateCcw
                                                aria-hidden="true"
                                                className="size-4"
                                            />
                                            Atur ulang filter
                                        </Button>
                                    </div>
                                </form>
                            </section>

                            <section
                                aria-labelledby="candidate-results-heading"
                                aria-busy={isPending}
                                className="@container min-w-0 space-y-5 xl:col-span-2 xl:row-start-2"
                            >
                                <div className="flex flex-wrap items-end justify-between gap-3 px-1">
                                    <div>
                                        <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                                            Portofolio pilihan mahasiswa
                                        </p>
                                        <h2
                                            id="candidate-results-heading"
                                            className="mt-2 text-2xl font-bold"
                                        >
                                            {canSearch
                                                ? `${candidates.total} talenta ditemukan`
                                                : 'Daftar talenta'}
                                        </h2>
                                    </div>
                                    {canSearch &&
                                        candidates.data.length > 0 && (
                                            <p className="text-sm text-muted-foreground">
                                                Halaman{' '}
                                                {candidates.current_page} dari{' '}
                                                {candidates.last_page}
                                            </p>
                                        )}
                                </div>
                                {(hasError || isForbidden) && (
                                    <div
                                        role="alert"
                                        className="rounded-2xl border border-amber-200 bg-amber-50 p-5"
                                    >
                                        <div className="flex gap-2">
                                            <AlertCircle
                                                aria-hidden="true"
                                                className="mt-0.5 size-5 shrink-0"
                                            />
                                            <div>
                                                <h3 className="font-semibold">
                                                    {isForbidden
                                                        ? 'Akses pencarian tidak tersedia'
                                                        : 'Hasil belum dapat diperbarui'}
                                                </h3>
                                                <p className="mt-2 text-sm leading-6">
                                                    {isForbidden
                                                        ? 'Data sebelumnya disembunyikan. Periksa hak akses organisasi sebelum mencoba lagi.'
                                                        : 'Pilihan filter tetap tersedia. Coba ulang untuk memuat hasil terbaru.'}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="mt-4 h-11 bg-white"
                                            disabled={isBusy}
                                            onClick={() =>
                                                visitSearch(lastSearch.current)
                                            }
                                        >
                                            {isPending
                                                ? 'Memeriksa'
                                                : 'Coba lagi'}
                                        </Button>
                                    </div>
                                )}
                                <div
                                    role="status"
                                    aria-live="polite"
                                    className={cn(
                                        'min-h-5 text-sm',
                                        saveError
                                            ? 'text-amber-900'
                                            : 'text-muted-foreground',
                                    )}
                                >
                                    {isPending
                                        ? 'Memperbarui hasil pencarian. Hasil sebelumnya tetap ditampilkan.'
                                        : saveMessage}
                                    {saveError && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="mt-2 h-11 sm:ml-3"
                                            disabled={isBusy}
                                            onClick={() =>
                                                visitSearch(
                                                    talentSearch({
                                                        query: filterQuery(
                                                            candidates.current_page,
                                                        ),
                                                    }),
                                                )
                                            }
                                        >
                                            Muat ulang status
                                        </Button>
                                    )}
                                </div>
                                {canSearch &&
                                    isPending &&
                                    candidates.data.length === 0 && (
                                        <CandidateSkeleton />
                                    )}
                                {canSearch &&
                                    !isPending &&
                                    !hasError &&
                                    candidates.data.length === 0 && (
                                        <div className="grid justify-items-center gap-4 rounded-3xl border border-border bg-white px-5 py-10 text-center shadow-sm">
                                            <ArchiveArt className="w-28" />
                                            <div>
                                                <h3 className="text-xl font-bold">
                                                    Belum ada kandidat yang
                                                    sesuai
                                                </h3>
                                                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                                                    Coba kata kunci lain atau
                                                    kurangi filter untuk melihat
                                                    portofolio yang tersedia.
                                                </p>
                                            </div>
                                            {activeFilterCount > 0 && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="h-11"
                                                    disabled={isBusy}
                                                    onClick={resetFilters}
                                                >
                                                    <RotateCcw
                                                        aria-hidden="true"
                                                        className="size-4"
                                                    />
                                                    Atur ulang filter
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                {canSearch && candidates.data.length > 0 && (
                                    <ul
                                        aria-label="Daftar kandidat"
                                        className="grid gap-5 @min-[44rem]:grid-cols-2 @min-[56rem]:grid-cols-3"
                                    >
                                        {candidates.data.map((candidate) => (
                                            <li
                                                key={candidate.id}
                                                className="grid min-w-0"
                                            >
                                                <CandidateCard
                                                    candidate={candidate}
                                                    saved={savedIds.includes(
                                                        candidate.id,
                                                    )}
                                                    saving={
                                                        savingId ===
                                                        candidate.id
                                                    }
                                                    disabled={isBusy}
                                                    onSave={() =>
                                                        toggleSaveCandidate(
                                                            candidate.id,
                                                        )
                                                    }
                                                />
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {canSearch && candidates.last_page > 1 && (
                                    <nav
                                        aria-label="Paginasi kandidat"
                                        className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5"
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
                                                visitSearch(
                                                    talentSearch({
                                                        query: filterQuery(
                                                            candidates.current_page -
                                                                1,
                                                        ),
                                                    }),
                                                )
                                            }
                                        >
                                            <ChevronLeft
                                                aria-hidden="true"
                                                className="size-4"
                                            />
                                            Sebelumnya
                                        </Button>
                                        <span className="text-sm text-muted-foreground">
                                            {candidates.current_page} /{' '}
                                            {candidates.last_page}
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
                                                visitSearch(
                                                    talentSearch({
                                                        query: filterQuery(
                                                            candidates.current_page +
                                                                1,
                                                        ),
                                                    }),
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
                        </div>
                        <TalentContextRail
                            entitlement={
                                isForbidden
                                    ? {
                                          ...entitlement,
                                          has_entitlement: false,
                                          status: 'unavailable',
                                      }
                                    : entitlement
                            }
                            savedCount={savedIds.length}
                        />
                    </div>
                </div>
            </AppPage>
        </>
    );
}

TalentSearch.layout = {
    breadcrumbs: [
        { title: 'Talent Portal', href: talentSearch() },
        { title: 'Cari Talenta', href: talentSearch() },
    ],
};
