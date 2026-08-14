import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    Award,
    Bookmark,
    BookmarkCheck,
    Building2,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Filter,
    GraduationCap,
    Lock,
    RotateCcw,
    Search,
    ShieldCheck,
    Sparkles,
    UserRound,
    UserRoundSearch,
    Users,
    X,
} from 'lucide-react';
import { useState, useTransition, type FormEvent } from 'react';
import { AppPage } from '@/components/app-page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
    destroy as unsaveCandidate,
    store as saveCandidate,
} from '@/actions/App/Http/Controllers/SavedCandidatesController';
import {
    index as talentSearch,
    show as showCandidate,
} from '@/actions/App/Http/Controllers/TalentSearchController';
import { index as contactRequests } from '@/routes/recruiter/talent/contact-requests';
import { saved as savedCandidates } from '@/routes/recruiter/talent';

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

interface Institution {
    id: number;
    name: string;
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
        query: string;
        skills: string[];
        badges: string[];
        availability: string;
        institution_id: string;
    };
    entitlement: {
        has_entitlement: boolean;
        status: string;
        expires_at: string | null;
    };
    institutions: Institution[];
    savedCandidateIds?: number[];
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

function entitlementLabel(status: string): string {
    switch (status) {
        case 'active':
            return 'Hak akses aktif';
        case 'expired':
            return 'Hak akses berakhir';
        case 'no_organization':
            return 'Organisasi belum aktif';
        default:
            return 'Hak akses diperlukan';
    }
}

function TalentContextRail({
    activeFilterCount,
    savedCount,
    entitlement,
}: {
    activeFilterCount: number;
    savedCount: number;
    entitlement: TalentSearchProps['entitlement'];
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
                    Batas akses terlihat
                </h2>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    Hanya portofolio yang dipilih mahasiswa yang tampil di sini.
                    Kontak langsung baru terbuka setelah kandidat menerima
                    permintaan kontak Anda.
                </p>
            </div>

            {/* Card 2: Ringkasan Metrik */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                <p className="font-label text-xs font-bold tracking-[0.1em] text-slate-500 uppercase">
                    RINGKASAN PORTAL
                </p>

                <div className="mt-4 grid divide-y divide-slate-100">
                    <div className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-2.5">
                            <Bookmark className="size-4 text-slate-400" />
                            <span className="text-sm font-medium text-slate-700">
                                Kandidat tersimpan
                            </span>
                        </div>
                        <Link
                            href={savedCandidates()}
                            prefetch
                            className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-100"
                        >
                            {savedCount}
                            <ChevronRight
                                aria-hidden="true"
                                className="size-3"
                            />
                        </Link>
                    </div>

                    <div className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-2.5">
                            <Filter className="size-4 text-slate-400" />
                            <span className="text-sm font-medium text-slate-700">
                                Filter aktif
                            </span>
                        </div>
                        <span className="inline-flex size-6 items-center justify-center rounded-full bg-slate-100 font-mono text-xs font-bold text-slate-800">
                            {activeFilterCount}
                        </span>
                    </div>

                    <div className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-2.5">
                            <ShieldCheck className="size-4 text-blue-600" />
                            <span className="text-sm font-medium text-slate-700">
                                Status akses
                            </span>
                        </div>
                        <span className="text-xs font-semibold text-slate-800">
                            {entitlementLabel(entitlement.status)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Card 3: Quick Navigation to Contact Requests */}
            <Link
                href={contactRequests()}
                prefetch
                className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
            >
                <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                        <Users className="size-4.5" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-900">
                            Permintaan kontak
                        </p>
                        <p className="text-xs text-slate-500">
                            Kelola relasi & penawaran
                        </p>
                    </div>
                </div>
                <ChevronRight className="size-4 text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-blue-600" />
            </Link>

            {/* Card 4: Info Jaminan Keaslian */}
            <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-indigo-50/40 p-4.5">
                <div className="flex items-start gap-3">
                    <Sparkles className="mt-0.5 size-4 shrink-0 text-blue-600" />
                    <div>
                        <p className="text-xs font-bold text-blue-900">
                            Bukti tervalidasi kampus
                        </p>
                        <p className="mt-1 text-[0.8125rem] leading-relaxed text-blue-800/80">
                            Setiap riwayat tugas dan kontribusi diverifikasi
                            langsung oleh reviewer kampus pada buku besar
                            kolaborasi.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CandidateSkeleton() {
    return (
        <div className="grid gap-4">
            {[1, 2, 3].map((index) => (
                <div
                    key={index}
                    aria-hidden="true"
                    className="animate-pulse rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs"
                >
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <Skeleton className="size-12 rounded-2xl bg-slate-100" />
                            <div className="grid gap-2">
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-4 w-20 bg-slate-100" />
                                    <Skeleton className="h-4 w-28 bg-slate-100" />
                                </div>
                                <Skeleton className="h-5 w-64 bg-slate-100" />
                                <Skeleton className="h-4 w-40 bg-slate-100" />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Skeleton className="size-9 rounded-xl bg-slate-100" />
                            <Skeleton className="h-9 w-28 rounded-xl bg-slate-100" />
                        </div>
                    </div>
                    <div className="mt-4 border-t border-slate-100 pt-4">
                        <Skeleton className="h-4 w-full bg-slate-100" />
                    </div>
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
    const [savedIds, setSavedIds] = useState<number[]>(savedCandidateIds);
    const [isPending, startTransition] = useTransition();

    const activeFilterCount =
        Number(searchQuery.length > 0) +
        selectedSkills.length +
        Number(selectedAvailability.length > 0) +
        Number(selectedInstitution.length > 0);

    const filterQuery = (page?: number) => ({
        query: searchQuery || undefined,
        skills:
            selectedSkills.length > 0 ? selectedSkills.join(',') : undefined,
        badges:
            filters.badges?.length > 0 ? filters.badges.join(',') : undefined,
        availability: selectedAvailability || undefined,
        institution_id: selectedInstitution || undefined,
        page,
    });

    const applyFilters = () => {
        startTransition(() => {
            router.get(
                talentSearch({ query: filterQuery() }),
                {},
                {
                    preserveScroll: true,
                    preserveState: true,
                    replace: true,
                },
            );
        });
    };

    const handleFilterSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        applyFilters();
    };

    const addSkill = (skill: string) => {
        const trimmed = skill.trim();

        if (trimmed && !selectedSkills.includes(trimmed)) {
            setSelectedSkills((current) => [...current, trimmed]);
        }

        setSkillInput('');
    };

    const removeSkill = (skillToRemove: string) => {
        setSelectedSkills((current) =>
            current.filter((s) => s !== skillToRemove),
        );
    };

    const resetFilters = () => {
        setSearchQuery('');
        setSelectedAvailability('');
        setSelectedInstitution('');
        setSelectedSkills([]);

        startTransition(() => {
            router.get(
                talentSearch(),
                {},
                {
                    preserveScroll: true,
                    preserveState: true,
                    replace: true,
                },
            );
        });
    };

    const toggleSaveCandidate = (candidateId: number) => {
        const isSaved = savedIds.includes(candidateId);
        const previousSavedIds = [...savedIds];

        setSavedIds((current) =>
            isSaved
                ? current.filter((id) => id !== candidateId)
                : [...current, candidateId],
        );

        startTransition(() => {
            const options = {
                preserveScroll: true,
                preserveState: true,
                onError: () => setSavedIds(previousSavedIds),
            };

            if (isSaved) {
                router.delete(unsaveCandidate(candidateId), options);

                return;
            }

            router.post(saveCandidate(candidateId), {}, options);
        });
    };

    return (
        <>
            <Head title="Cari Talenta | SATU" />

            <AppPage
                contextRail={
                    <TalentContextRail
                        activeFilterCount={activeFilterCount}
                        entitlement={entitlement}
                        savedCount={savedIds.length}
                    />
                }
                contextRailLabel="Konteks Talent Portal"
            >
                <div className="space-y-6" data-test="talent-search-root">
                    {/* Hero Header Banner */}
                    <header className="relative isolate overflow-hidden rounded-2xl border border-blue-100 bg-white px-6 py-6 shadow-[0_18px_50px_-36px_rgba(30,64,175,0.35)] sm:px-8 sm:py-7">
                        <div
                            aria-hidden="true"
                            className="absolute -top-28 -right-24 size-80 rounded-full bg-blue-100/75 blur-3xl sm:-right-12"
                        />
                        <div
                            aria-hidden="true"
                            className="absolute right-14 bottom-0 hidden h-24 w-24 rounded-tl-[2.5rem] border-t border-l border-indigo-100 sm:block"
                        />

                        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-end lg:gap-8">
                            <div>
                                <p className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold tracking-[0.12em] text-blue-700 uppercase">
                                    <Sparkles
                                        aria-hidden="true"
                                        className="size-3.5"
                                    />
                                    Talent Portal Perekrut
                                </p>
                                <h1 className="mt-4 max-w-[20ch] text-2xl font-bold tracking-[-0.035em] text-slate-950 sm:text-3xl">
                                    Cari talenta yang siap berkolaborasi.
                                </h1>
                                <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-slate-600">
                                    Telusuri portofolio mahasiswa berprestasi
                                    yang memilih untuk terlihat. Setiap data
                                    tervalidasi langsung melalui riwayat proyek
                                    dan aman bagi perekrut.
                                </p>
                            </div>

                            <div className="border-t border-slate-100 pt-5 lg:border-t-0 lg:border-l lg:border-slate-100 lg:pt-0 lg:pl-6">
                                <p className="font-label text-xs font-bold tracking-[0.1em] text-slate-500 uppercase">
                                    STATUS AKSES ORGANISASI
                                </p>
                                <div className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-900">
                                    <ShieldCheck
                                        aria-hidden="true"
                                        className="size-4.5 text-blue-600"
                                    />
                                    {entitlementLabel(entitlement.status)}
                                </div>
                                {entitlement.expires_at &&
                                    entitlement.has_entitlement && (
                                        <p className="mt-2 text-xs leading-relaxed text-slate-500">
                                            Berlaku aktif hingga{' '}
                                            <span className="font-medium text-slate-700">
                                                {new Intl.DateTimeFormat(
                                                    'id-ID',
                                                    {
                                                        dateStyle: 'medium',
                                                    },
                                                ).format(
                                                    new Date(
                                                        entitlement.expires_at,
                                                    ),
                                                )}
                                            </span>
                                        </p>
                                    )}
                            </div>
                        </div>
                    </header>

                    {/* Entitlement Warning Banner if inactive */}
                    {!entitlement.has_entitlement && (
                        <section
                            aria-labelledby="entitlement-warning-heading"
                            className="flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50/80 p-5 text-amber-950 shadow-xs"
                        >
                            <AlertTriangle
                                aria-hidden="true"
                                className="mt-0.5 size-5 shrink-0 text-amber-700"
                            />
                            <div>
                                <h2
                                    id="entitlement-warning-heading"
                                    className="text-sm font-bold text-amber-900"
                                >
                                    {entitlement.status === 'expired'
                                        ? 'Hak akses pencarian telah berakhir'
                                        : 'Hak akses pencarian diperlukan'}
                                </h2>
                                <p className="mt-1 text-sm leading-relaxed text-amber-800">
                                    Organisasi perekrut memerlukan hak akses
                                    Talent Portal yang aktif sebelum daftar
                                    kandidat dapat ditampilkan. Silakan hubungi
                                    admin platform untuk aktivasi hak akses.
                                </p>
                            </div>
                        </section>
                    )}

                    {/* Main Content Area: Sidebar Filter + Candidates Grid */}
                    <div className="grid gap-6 xl:grid-cols-[16rem_minmax(0,1fr)]">
                        {/* Filter Panel */}
                        <form
                            aria-label="Filter pencarian talenta"
                            className="self-start rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs xl:sticky xl:top-6"
                            onSubmit={handleFilterSubmit}
                        >
                            <div className="grid gap-5">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                    <div className="flex items-center gap-2">
                                        <Filter className="size-4 text-blue-600" />
                                        <p className="text-sm font-bold text-slate-900">
                                            Filter Pencarian
                                        </p>
                                    </div>
                                    {activeFilterCount > 0 && (
                                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">
                                            {activeFilterCount}
                                        </span>
                                    )}
                                </div>

                                {/* Keyword Input */}
                                <div className="grid gap-1.5">
                                    <label
                                        className="text-xs font-semibold text-slate-700"
                                        htmlFor="talent-query"
                                    >
                                        Kata kunci
                                    </label>
                                    <div className="relative">
                                        <Search
                                            aria-hidden="true"
                                            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
                                        />
                                        <Input
                                            id="talent-query"
                                            className="h-10 rounded-xl pl-9 text-xs font-medium placeholder:text-slate-400"
                                            onChange={(event) =>
                                                setSearchQuery(
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Skill, peran, atau topik..."
                                            value={searchQuery}
                                        />
                                    </div>
                                </div>

                                {/* Availability Dropdown */}
                                <div className="grid gap-1.5">
                                    <label
                                        className="text-xs font-semibold text-slate-700"
                                        htmlFor="talent-availability"
                                    >
                                        Ketersediaan
                                    </label>
                                    <select
                                        id="talent-availability"
                                        aria-label="Filter ketersediaan kandidat"
                                        className="h-10 w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 transition-[border-color,box-shadow] duration-fast outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-100"
                                        onChange={(event) =>
                                            setSelectedAvailability(
                                                event.target.value,
                                            )
                                        }
                                        value={selectedAvailability}
                                    >
                                        <option value="">Semua status</option>
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
                                </div>

                                {/* Institution Dropdown */}
                                <div className="grid gap-1.5">
                                    <label
                                        className="text-xs font-semibold text-slate-700"
                                        htmlFor="talent-institution"
                                    >
                                        Institusi kampus
                                    </label>
                                    <select
                                        id="talent-institution"
                                        aria-label="Filter institusi kandidat"
                                        className="h-10 w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 transition-[border-color,box-shadow] duration-fast outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-100"
                                        onChange={(event) =>
                                            setSelectedInstitution(
                                                event.target.value,
                                            )
                                        }
                                        value={selectedInstitution}
                                    >
                                        <option value="">
                                            Semua institusi
                                        </option>
                                        {institutions.map((institution) => (
                                            <option
                                                key={institution.id}
                                                value={institution.id}
                                            >
                                                {institution.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Skill Tags Filter */}
                                <div className="grid gap-1.5">
                                    <label
                                        className="text-xs font-semibold text-slate-700"
                                        htmlFor="talent-skill"
                                    >
                                        Keahlian & Skill
                                    </label>
                                    <div className="flex gap-1.5">
                                        <Input
                                            id="talent-skill"
                                            className="h-10 rounded-xl text-xs font-medium placeholder:text-slate-400"
                                            onChange={(event) =>
                                                setSkillInput(
                                                    event.target.value,
                                                )
                                            }
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter') {
                                                    event.preventDefault();
                                                    addSkill(skillInput);
                                                }
                                            }}
                                            placeholder="Ketik skill (tekan Enter)"
                                            value={skillInput}
                                        />
                                        {skillInput && (
                                            <Button
                                                className="h-10 cursor-pointer rounded-xl px-3 text-xs"
                                                onClick={() =>
                                                    addSkill(skillInput)
                                                }
                                                size="sm"
                                                type="button"
                                                variant="secondary"
                                            >
                                                Tambah
                                            </Button>
                                        )}
                                    </div>

                                    {/* Selected Skill Chips */}
                                    {selectedSkills.length > 0 && (
                                        <ul
                                            aria-label="Skill yang dipilih"
                                            className="mt-1.5 flex flex-wrap gap-1.5"
                                        >
                                            {selectedSkills.map((skill) => (
                                                <li key={skill}>
                                                    <span className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50/90 py-0.5 pr-1 pl-2 text-xs font-semibold text-blue-800">
                                                        {skill}
                                                        <button
                                                            aria-label={`Hapus skill ${skill}`}
                                                            className="flex size-4 cursor-pointer items-center justify-center rounded-sm text-blue-600 hover:bg-blue-200/60"
                                                            onClick={() =>
                                                                removeSkill(
                                                                    skill,
                                                                )
                                                            }
                                                            type="button"
                                                        >
                                                            <X
                                                                aria-hidden="true"
                                                                className="size-3"
                                                            />
                                                        </button>
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                {/* Filter Actions */}
                                <div className="grid gap-2 border-t border-slate-100 pt-4">
                                    <Button
                                        className="h-10 w-full cursor-pointer rounded-xl bg-blue-600 text-xs font-semibold text-white shadow-xs transition-all hover:bg-blue-700"
                                        disabled={
                                            isPending ||
                                            !entitlement.has_entitlement
                                        }
                                        type="submit"
                                    >
                                        <Filter
                                            aria-hidden="true"
                                            className="mr-1.5 size-3.5"
                                        />
                                        {isPending
                                            ? 'Menerapkan...'
                                            : 'Terapkan Filter'}
                                    </Button>
                                    <Button
                                        className="h-9 w-full cursor-pointer rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                        disabled={
                                            isPending || activeFilterCount === 0
                                        }
                                        onClick={resetFilters}
                                        type="button"
                                        variant="ghost"
                                    >
                                        <RotateCcw className="mr-1.5 size-3" />
                                        Atur ulang filter
                                    </Button>
                                </div>
                            </div>
                        </form>

                        {/* Candidates Result List */}
                        <section
                            aria-busy={isPending}
                            aria-labelledby="candidate-results-heading"
                            aria-live="polite"
                            className="min-w-0 space-y-4"
                        >
                            {/* Result Meta Bar */}
                            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2
                                            id="candidate-results-heading"
                                            className="text-base font-bold text-slate-900"
                                        >
                                            {candidates.total} Talenta Ditemukan
                                        </h2>
                                        {isPending && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                                                <span className="size-1.5 animate-ping rounded-full bg-blue-600" />
                                                Memperbarui...
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        Portofolio terverifikasi yang terbuka
                                        untuk kolaborasi
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className="rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                                        Halaman {candidates.current_page} dari{' '}
                                        {candidates.last_page}
                                    </span>
                                </div>
                            </div>

                            {/* Loading Skeleton */}
                            {isPending && candidates.data.length === 0 && (
                                <CandidateSkeleton />
                            )}

                            {/* Empty State */}
                            {!isPending && candidates.data.length === 0 && (
                                <div className="grid justify-items-center gap-4 rounded-2xl border border-slate-200/80 bg-white px-6 py-16 text-center shadow-xs">
                                    <div className="flex size-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-8 ring-blue-50/50">
                                        <UserRoundSearch
                                            aria-hidden="true"
                                            className="size-7"
                                        />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900">
                                            Belum ada kandidat yang sesuai
                                        </h3>
                                        <p className="mx-auto mt-2 max-w-[46ch] text-xs leading-relaxed text-slate-600">
                                            Coba sesuaikan kata kunci atau atur
                                            ulang filter untuk menemukan lebih
                                            banyak portofolio mahasiswa yang
                                            tersedia.
                                        </p>
                                    </div>
                                    <Button
                                        className="cursor-pointer rounded-xl text-xs font-semibold"
                                        onClick={resetFilters}
                                        type="button"
                                        variant="outline"
                                    >
                                        <RotateCcw className="mr-1.5 size-3.5" />
                                        Atur ulang filter
                                    </Button>
                                </div>
                            )}

                            {/* Candidate Cards */}
                            {candidates.data.length > 0 && (
                                <div
                                    aria-label="Daftar kandidat"
                                    className="grid gap-4"
                                    role="list"
                                >
                                    {candidates.data.map((candidate) => {
                                        const isSaved = savedIds.includes(
                                            candidate.id,
                                        );
                                        const availability = availabilityMeta(
                                            candidate.availability_status,
                                        );

                                        return (
                                            <article
                                                key={candidate.id}
                                                aria-label={`Kandidat ${candidate.headline ?? 'talenta terverifikasi'}`}
                                                className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                                                role="listitem"
                                            >
                                                {/* Header Row: Avatar + Headline + Badges + Action Buttons */}
                                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                                    <div className="flex items-start gap-4">
                                                        {/* Avatar Icon */}
                                                        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-base font-bold text-white shadow-xs">
                                                            <UserRound className="size-6" />
                                                        </div>

                                                        {/* Info Header */}
                                                        <div>
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="font-mono text-xs font-bold text-slate-400">
                                                                    FOLIO-
                                                                    {
                                                                        candidate.id
                                                                    }
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

                                                    {/* Top Right Action Buttons */}
                                                    <div className="flex shrink-0 items-center gap-2 sm:self-start">
                                                        <Button
                                                            aria-label={
                                                                isSaved
                                                                    ? `Hapus ${candidate.headline ?? 'kandidat'} dari simpanan`
                                                                    : `Simpan ${candidate.headline ?? 'kandidat'}`
                                                            }
                                                            className={`size-10 cursor-pointer rounded-xl transition-all ${
                                                                isSaved
                                                                    ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                                                                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900'
                                                            }`}
                                                            disabled={isPending}
                                                            onClick={() =>
                                                                toggleSaveCandidate(
                                                                    candidate.id,
                                                                )
                                                            }
                                                            size="icon"
                                                            type="button"
                                                            variant="outline"
                                                        >
                                                            {isSaved ? (
                                                                <BookmarkCheck
                                                                    aria-hidden="true"
                                                                    className="size-4.5 fill-blue-600 text-blue-600"
                                                                />
                                                            ) : (
                                                                <Bookmark
                                                                    aria-hidden="true"
                                                                    className="size-4.5"
                                                                />
                                                            )}
                                                        </Button>

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
                                                    </div>
                                                </div>

                                                {/* Bio Section */}
                                                {candidate.bio && (
                                                    <p className="mt-3 text-xs leading-relaxed text-slate-600">
                                                        {candidate.bio}
                                                    </p>
                                                )}

                                                {/* Skills & Badges Tags */}
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

                            {/* Pagination Controls */}
                            {candidates.last_page > 1 && (
                                <nav
                                    aria-label="Pagination kandidat"
                                    className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs"
                                >
                                    <Button
                                        className="cursor-pointer rounded-xl text-xs font-semibold"
                                        disabled={candidates.current_page <= 1}
                                        onClick={() =>
                                            router.get(
                                                talentSearch({
                                                    query: filterQuery(
                                                        candidates.current_page -
                                                            1,
                                                    ),
                                                }),
                                                {},
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
                                                talentSearch({
                                                    query: filterQuery(
                                                        candidates.current_page +
                                                            1,
                                                    ),
                                                }),
                                                {},
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
                        </section>
                    </div>
                </div>
            </AppPage>
        </>
    );
}

TalentSearch.layout = {
    breadcrumbs: [
        {
            title: 'Talent Portal',
            href: talentSearch(),
        },
        {
            title: 'Cari Talenta',
            href: talentSearch(),
        },
    ],
};
