import { useHttp } from '@inertiajs/react';
import {
    Check,
    CircleAlert,
    CircleDashed,
    Eye,
    Info,
    LockKeyhole,
    Plus,
    RefreshCw,
    Save,
    Search,
    ShieldCheck,
    Trash2,
    WifiOff,
    X,
} from 'lucide-react';
import {
    useEffect,
    useId,
    useRef,
    useState,
    useSyncExternalStore,
} from 'react';
import type { KeyboardEvent } from 'react';
import InputError from '@/components/input-error';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { index as taxonomyIndex } from '@/routes/skills/taxonomy';
import studentProfiles from '@/routes/student-profiles';

type Proficiency = 'beginner' | 'intermediate' | 'advanced' | 'expert';
type PortfolioVisibility = 'private' | 'institution' | 'recruiter' | 'public';
type ProfileSection = 'basics' | 'skills' | 'availability' | 'visibility';
type ProfileIssue =
    | 'network'
    | 'session_expired'
    | 'forbidden'
    | 'rate_limited'
    | 'stale'
    | 'server';

type Taxonomy = {
    id: number;
    name: string;
    category: string;
    description: string | null;
};

type ProfileSkill = {
    id: number;
    taxonomy_id: number;
    name: string;
    proficiency: Proficiency;
    evidence_metadata: unknown[] | null;
};

type ProfileInterest = {
    id: number;
    taxonomy_id: number;
    name: string;
};

type AvailabilityWindow = {
    id: number;
    day_of_week: number;
    starts_at: string;
    ends_at: string;
    timezone: string;
};

type StudentProfile = {
    id: number;
    updated_at: string;
    bio: string | null;
    study_program: string | null;
    study_year: number | null;
    portfolio_visibility: PortfolioVisibility;
    recruiter_discoverable: boolean;
    skills: ProfileSkill[];
    interests: ProfileInterest[];
    availability_windows: AvailabilityWindow[];
};

type ProfileResponse = {
    data: StudentProfile;
};

type TaxonomyResponse = {
    data: Taxonomy[];
};

type DraftSkill = {
    key: string;
    taxonomy_id: number;
    name: string;
    proficiency: Proficiency;
    evidence: string;
};

type DraftInterest = {
    key: string;
    taxonomy_id: number;
    name: string;
};

type DraftAvailability = {
    key: string;
    day_of_week: number;
    starts_at: string;
    ends_at: string;
    timezone: string;
};

type AvailabilityPayload = Omit<DraftAvailability, 'key'>;

type ProfileSkillPayload = {
    taxonomy_id: number;
    proficiency: Proficiency;
    evidence_metadata: string[];
};

type ProfileWritePayload = {
    institution_id: number | null;
    bio: string;
    study_program: string;
    study_year: number | null;
    skills: ProfileSkillPayload[];
    interests: number[];
    portfolio_visibility?: PortfolioVisibility;
    recruiter_discoverable?: boolean;
    availability_windows?: AvailabilityPayload[];
    timezone?: string;
    expected_updated_at?: string;
};

type AvailabilityWritePayload = {
    windows: AvailabilityPayload[];
    timezone: string;
    expected_updated_at?: string;
};

type VisibilityWritePayload = {
    portfolio_visibility: PortfolioVisibility;
    recruiter_discoverable: boolean;
    expected_updated_at?: string;
};

type OnboardingProfileProps = {
    profileId: number | null;
    institutionId: number | null;
    affiliationVerified: boolean;
    onProfileCreated?: (profileId: number) => void;
};

const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const proficiencyOptions: Array<{ value: Proficiency; label: string }> = [
    { value: 'beginner', label: 'Pemula' },
    { value: 'intermediate', label: 'Menengah' },
    { value: 'advanced', label: 'Lanjutan' },
    { value: 'expert', label: 'Mahir' },
];

const visibilityOptions: Array<{
    value: PortfolioVisibility;
    label: string;
    description: string;
}> = [
    {
        value: 'private',
        label: 'Pribadi',
        description: 'Hanya kamu yang dapat melihat proyeksi portfolio ini.',
    },
    {
        value: 'institution',
        label: 'Institusi',
        description:
            'Terlihat dalam konteks institusi yang sudah terverifikasi.',
    },
    {
        value: 'recruiter',
        label: 'Recruiter',
        description:
            'Dapat ditampilkan kepada recruiter sesuai akses yang kamu izinkan.',
    },
    {
        value: 'public',
        label: 'Publik',
        description: 'Dapat dilihat pada portfolio publikmu.',
    },
];

function defaultTimezone(): string {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
        return 'UTC';
    }
}

function subscribeToTimezone(): () => void {
    return () => undefined;
}

function serverTimezone(): string {
    return 'UTC';
}

function availabilityPayload(
    windows: DraftAvailability[],
): AvailabilityPayload[] {
    return windows.map((window) => ({
        day_of_week: window.day_of_week,
        starts_at: window.starts_at,
        ends_at: window.ends_at,
        timezone: window.timezone,
    }));
}

function profileErrors(errors: Record<string, unknown>): string[] {
    return Array.from(
        new Set(
            Object.values(errors).flatMap((value) =>
                Array.isArray(value) ? value.map(String) : [String(value)],
            ),
        ),
    );
}

function issueFromStatus(status: number): ProfileIssue {
    if (status === 401 || status === 419) {
        return 'session_expired';
    }

    if (status === 403) {
        return 'forbidden';
    }

    if (status === 429) {
        return 'rate_limited';
    }

    if (status === 409) {
        return 'stale';
    }

    return 'server';
}

const issueCopy: Record<
    ProfileIssue,
    {
        title: string;
        description: string;
        action: string;
        icon: typeof CircleAlert;
    }
> = {
    network: {
        title: 'Perubahan belum tersimpan',
        description:
            'Koneksi terputus sebelum perubahan selesai. Data yang sedang kamu isi tetap berada di halaman ini.',
        action: 'Coba simpan lagi',
        icon: WifiOff,
    },
    session_expired: {
        title: 'Sesi halaman sudah berakhir',
        description:
            'Perubahan profil belum diproses. Masuk kembali untuk melanjutkan dengan sesi yang aman.',
        action: 'Muat ulang halaman',
        icon: RefreshCw,
    },
    forbidden: {
        title: 'Izin profil berubah',
        description:
            'Perubahan belum diproses karena akses profil atau afiliasimu berubah. Periksa status terbaru sebelum mencoba lagi.',
        action: 'Periksa akses lagi',
        icon: LockKeyhole,
    },
    rate_limited: {
        title: 'Terlalu banyak percobaan',
        description:
            'Simpan profil sebentar lagi setelah batas percobaan berakhir. Isi formulirmu tetap dipertahankan.',
        action: 'Coba lagi',
        icon: CircleAlert,
    },
    stale: {
        title: 'Data profil berubah',
        description:
            'Sesi lain sudah memperbarui profil ini. Muat data terbaru untuk membandingkan perubahan sebelum menyimpan draft ini lagi.',
        action: 'Muat data terbaru',
        icon: RefreshCw,
    },
    server: {
        title: 'Profil belum dapat disimpan',
        description:
            'Layanan belum dapat memproses perubahan ini. Coba lagi atau simpan bagian lain terlebih dahulu.',
        action: 'Coba lagi',
        icon: CircleAlert,
    },
};

function ProfileActionRecovery({
    issue,
    onRetry,
}: {
    issue: ProfileIssue;
    onRetry: () => void;
}) {
    const copy = issueCopy[issue];
    const IssueIcon = copy.icon;
    const recoveryRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        window.requestAnimationFrame(() => recoveryRef.current?.focus());
    }, [issue]);

    return (
        <div
            ref={recoveryRef}
            tabIndex={-1}
            className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            data-test="profile-action-recovery-focus"
        >
            <Alert
                className="border-pending/40 bg-pending-subtle text-pending-subtle-foreground"
                data-test="profile-action-recovery"
            >
                <IssueIcon aria-hidden="true" />
                <AlertTitle className="line-clamp-none">
                    {copy.title}
                </AlertTitle>
                <AlertDescription className="text-current">
                    <p>{copy.description}</p>
                    <Button
                        type="button"
                        size="sm"
                        className="mt-3 cursor-pointer disabled:cursor-not-allowed"
                        onClick={onRetry}
                    >
                        <RefreshCw />
                        {copy.action}
                    </Button>
                </AlertDescription>
            </Alert>
        </div>
    );
}

function ProfileLoadingState() {
    return (
        <div
            className="grid gap-5 border border-border bg-card p-5 sm:p-6"
            data-test="profile-loading"
            role="status"
            aria-busy="true"
        >
            <span className="sr-only">Memuat data profil.</span>
            <div className="grid gap-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-8 w-3/4 max-w-md" />
                <Skeleton className="h-4 w-full max-w-2xl" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
                <Skeleton className="h-control-lg w-full" />
                <Skeleton className="h-control-lg w-full" />
            </div>
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-control-lg w-40" />
        </div>
    );
}

function ProfileLockedState() {
    return (
        <section
            aria-labelledby="profile-locked-title"
            className="border border-border bg-card p-5 sm:p-6"
            data-test="profile-locked"
            id="profile"
        >
            <div className="flex items-start gap-3">
                <LockKeyhole
                    aria-hidden="true"
                    className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                />
                <div>
                    <p className="font-label text-label text-muted-foreground">
                        Profil mahasiswa
                    </p>
                    <h2
                        id="profile-locked-title"
                        className="mt-2 text-title font-bold"
                    >
                        Profil terbuka setelah afiliasi terverifikasi
                    </h2>
                    <p className="mt-2 max-w-[65ch] text-sm leading-relaxed text-muted-foreground">
                        Selesaikan verifikasi kampus terlebih dahulu. Setelah
                        itu, kamu bisa mengisi profil secara bertahap dan
                        memilih siapa yang boleh melihat proyeksinya.
                    </p>
                </div>
            </div>
        </section>
    );
}

function ProfileSectionIndex({
    activeSection,
    statuses,
    onNavigate,
}: {
    activeSection: ProfileSection;
    statuses: Record<ProfileSection, boolean>;
    onNavigate: (section: ProfileSection) => void;
}) {
    const sections: Array<{
        id: ProfileSection;
        label: string;
        anchor: string;
    }> = [
        { id: 'basics', label: 'Profil inti', anchor: 'profile-basics' },
        { id: 'skills', label: 'Skill dan minat', anchor: 'profile-skills' },
        {
            id: 'availability',
            label: 'Ketersediaan',
            anchor: 'profile-availability',
        },
        {
            id: 'visibility',
            label: 'Visibilitas dan persetujuan',
            anchor: 'profile-visibility',
        },
    ];

    return (
        <nav
            aria-label="Bagian profil mahasiswa"
            className="border-y border-border"
            data-test="profile-section-index"
        >
            <ol className="grid divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                {sections.map((section) => (
                    <li key={section.id} className="min-w-0">
                        <a
                            href={`#${section.anchor}`}
                            className={cn(
                                'flex min-h-control-lg cursor-pointer items-center gap-3 px-3 py-3 text-left text-sm transition-colors duration-fast ease-ledger hover:bg-muted motion-reduce:transition-none',
                                activeSection === section.id && 'bg-muted',
                            )}
                            aria-current={
                                activeSection === section.id
                                    ? 'location'
                                    : undefined
                            }
                            onClick={() => onNavigate(section.id)}
                        >
                            {statuses[section.id] ? (
                                <Check
                                    aria-hidden="true"
                                    className="size-4 shrink-0 text-verified"
                                />
                            ) : (
                                <CircleDashed
                                    aria-hidden="true"
                                    className="size-4 shrink-0 text-muted-foreground"
                                />
                            )}
                            <span className="min-w-0">
                                <span className="block font-semibold">
                                    {section.label}
                                </span>
                                <span className="block text-xs text-muted-foreground">
                                    {statuses[section.id]
                                        ? 'Sudah tersimpan'
                                        : 'Masih bisa dilengkapi'}
                                </span>
                            </span>
                        </a>
                    </li>
                ))}
            </ol>
        </nav>
    );
}

function TaxonomyPicker({
    id,
    category,
    label,
    hint,
    selectedIds,
    onSelect,
}: {
    id: string;
    category?: string;
    label: string;
    hint: string;
    selectedIds: number[];
    onSelect: (taxonomy: Taxonomy) => void;
}) {
    const searchRequest = useHttp<Record<string, never>, TaxonomyResponse>({});
    const [query, setQuery] = useState('');
    const [options, setOptions] = useState<Taxonomy[]>([]);
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [issue, setIssue] = useState<ProfileIssue | null>(null);
    const listboxId = `${id}-listbox`;
    const searchTaxonomies = searchRequest.get;
    const cancelSearch = searchRequest.cancel;

    useEffect(() => {
        if (!open || query.trim() === '') {
            return;
        }

        const timeout = window.setTimeout(() => {
            setIssue(null);
            const queryOptions =
                category === undefined
                    ? { query: query.trim() || undefined }
                    : { category, query: query.trim() || undefined };

            searchTaxonomies(taxonomyIndex.url({ query: queryOptions }), {
                onSuccess: (response) => {
                    setOptions(response.data);
                    setActiveIndex(response.data.length > 0 ? 0 : -1);
                },
                onHttpException: (response) => {
                    setIssue(issueFromStatus(response.status));

                    return false;
                },
                onNetworkError: () => {
                    setIssue('network');

                    return false;
                },
            }).catch(() => undefined);
        }, 180);

        return () => {
            window.clearTimeout(timeout);
            cancelSearch();
        };
    }, [cancelSearch, category, open, query, searchTaxonomies]);

    function selectOption(option: Taxonomy) {
        if (!selectedIds.includes(option.id)) {
            onSelect(option);
        }

        setQuery('');
        setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (!open && (event.key === 'ArrowDown' || event.key === 'Enter')) {
            event.preventDefault();
            setOpen(true);

            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((current) =>
                options.length === 0 ? -1 : (current + 1) % options.length,
            );
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((current) =>
                options.length === 0
                    ? -1
                    : current <= 0
                      ? options.length - 1
                      : current - 1,
            );
        } else if (event.key === 'Enter' && activeIndex >= 0) {
            event.preventDefault();
            selectOption(options[activeIndex]);
        } else if (event.key === 'Escape') {
            event.preventDefault();
            setOpen(false);
        }
    }

    return (
        <div className="grid gap-2">
            <label htmlFor={id} className="text-sm font-semibold">
                {label}
            </label>
            <div className="relative">
                <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                    id={id}
                    data-test={id}
                    role="combobox"
                    aria-autocomplete="list"
                    aria-controls={listboxId}
                    aria-expanded={open}
                    aria-activedescendant={
                        activeIndex >= 0
                            ? `${listboxId}-${options[activeIndex]?.id}`
                            : undefined
                    }
                    className="pl-9"
                    placeholder="Cari berdasarkan nama"
                    value={query}
                    onChange={(event) => {
                        setQuery(event.target.value);

                        if (event.target.value.trim() === '') {
                            setActiveIndex(-1);
                        }

                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    onBlur={() => window.setTimeout(() => setOpen(false), 120)}
                    onKeyDown={handleKeyDown}
                />
                {query !== '' && (
                    <button
                        type="button"
                        aria-label="Hapus pencarian"
                        className="absolute top-1/2 right-2 inline-flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                            setQuery('');
                            setActiveIndex(-1);
                        }}
                    >
                        <X aria-hidden="true" className="size-4" />
                    </button>
                )}
                {open && (
                    <div
                        id={listboxId}
                        role="listbox"
                        aria-label={`Pilihan ${label.toLowerCase()}`}
                        className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md"
                    >
                        {searchRequest.processing ? (
                            <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
                                <Spinner />
                                Mencari pilihan...
                            </div>
                        ) : issue !== null ? (
                            <div
                                className="px-3 py-3 text-sm text-correction-subtle-foreground"
                                role="alert"
                            >
                                Pilihan belum dapat dimuat. Coba lagi.
                            </div>
                        ) : query.trim() === '' || options.length === 0 ? (
                            <div
                                className="px-3 py-3 text-sm text-muted-foreground"
                                role="status"
                            >
                                {query.trim() === ''
                                    ? 'Ketik nama untuk mencari.'
                                    : 'Tidak ada pilihan yang cocok.'}
                            </div>
                        ) : (
                            options.map((option, index) => {
                                const selected = selectedIds.includes(
                                    option.id,
                                );

                                return (
                                    <button
                                        key={option.id}
                                        id={`${listboxId}-${option.id}`}
                                        type="button"
                                        role="option"
                                        aria-selected={selected}
                                        className={cn(
                                            'flex w-full cursor-pointer items-start justify-between gap-3 rounded-sm px-3 py-2 text-left text-sm outline-none hover:bg-muted focus-visible:bg-muted',
                                            activeIndex === index && 'bg-muted',
                                            selected && 'text-muted-foreground',
                                        )}
                                        onMouseDown={(event) =>
                                            event.preventDefault()
                                        }
                                        onClick={() => selectOption(option)}
                                    >
                                        <span className="min-w-0">
                                            <span className="block font-medium break-words">
                                                {option.name}
                                            </span>
                                            {option.description && (
                                                <span className="mt-0.5 block text-xs text-muted-foreground">
                                                    {option.description}
                                                </span>
                                            )}
                                        </span>
                                        {selected && (
                                            <Check
                                                aria-hidden="true"
                                                className="mt-0.5 size-4 shrink-0 text-verified"
                                            />
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
                {hint}
            </p>
        </div>
    );
}

function SavedMessage({
    section,
    savedSection,
}: {
    section: ProfileSection;
    savedSection: ProfileSection | null;
}) {
    if (savedSection !== section) {
        return null;
    }

    return (
        <p
            className="flex items-center gap-2 text-sm text-verified"
            role="status"
            aria-live="polite"
        >
            <Check aria-hidden="true" className="size-4" />
            Perubahan bagian ini sudah tersimpan.
        </p>
    );
}

export function OnboardingProfile({
    profileId,
    institutionId,
    affiliationVerified,
    onProfileCreated,
}: OnboardingProfileProps) {
    const profileRequest = useHttp<Record<string, never>, ProfileResponse>({});
    const profileForm = useHttp<ProfileWritePayload, ProfileResponse>({
        institution_id: null,
        bio: '',
        study_program: '',
        study_year: null,
        skills: [],
        interests: [],
    });
    const availabilityForm = useHttp<AvailabilityWritePayload, ProfileResponse>(
        {
            windows: [],
            timezone: defaultTimezone(),
        },
    );
    const visibilityForm = useHttp<VisibilityWritePayload, ProfileResponse>({
        portfolio_visibility: 'private',
        recruiter_discoverable: false,
    });
    const [profile, setProfile] = useState<StudentProfile | null>(null);
    const [profileLoading, setProfileLoading] = useState(
        affiliationVerified && profileId !== null,
    );
    const [profileIssue, setProfileIssue] = useState<ProfileIssue | null>(null);
    const [profileLoadAttempt, setProfileLoadAttempt] = useState(0);
    const [bio, setBio] = useState('');
    const [studyProgram, setStudyProgram] = useState('');
    const [studyYear, setStudyYear] = useState<number | null>(null);
    const [skills, setSkills] = useState<DraftSkill[]>([]);
    const [interests, setInterests] = useState<DraftInterest[]>([]);
    const [availability, setAvailability] = useState<DraftAvailability[]>([]);
    const [portfolioVisibility, setPortfolioVisibility] =
        useState<PortfolioVisibility>('private');
    const [recruiterDiscoverable, setRecruiterDiscoverable] = useState(false);
    const [visibilityReviewed, setVisibilityReviewed] = useState(false);
    const [activeSection, setActiveSection] =
        useState<ProfileSection>('basics');
    const [savedSection, setSavedSection] = useState<ProfileSection | null>(
        null,
    );
    const [actionIssue, setActionIssue] = useState<ProfileIssue | null>(null);
    const retryAction = useRef<(() => void) | null>(null);
    const errorSummary = useRef<HTMLDivElement>(null);
    const timezone = useSyncExternalStore(
        subscribeToTimezone,
        defaultTimezone,
        serverTimezone,
    );
    const pageId = useId();
    const loadProfile = profileRequest.get;
    const cancelProfileLoad = profileRequest.cancel;

    function hydrateProfile(nextProfile: StudentProfile) {
        setProfile(nextProfile);
        setProfileLoading(false);
        setProfileIssue(null);
        setBio(nextProfile.bio ?? '');
        setStudyProgram(nextProfile.study_program ?? '');
        setStudyYear(nextProfile.study_year);
        setSkills(
            nextProfile.skills.map((skill) => ({
                key: `skill-${skill.id}`,
                taxonomy_id: skill.taxonomy_id,
                name: skill.name,
                proficiency: skill.proficiency,
                evidence: (skill.evidence_metadata ?? [])
                    .filter(
                        (value): value is string => typeof value === 'string',
                    )
                    .join('\n'),
            })),
        );
        setInterests(
            nextProfile.interests.map((interest) => ({
                key: `interest-${interest.id}`,
                taxonomy_id: interest.taxonomy_id,
                name: interest.name,
            })),
        );
        setAvailability(
            nextProfile.availability_windows.map((window) => ({
                key: `window-${window.id}`,
                day_of_week: window.day_of_week,
                starts_at: window.starts_at.slice(0, 5),
                ends_at: window.ends_at.slice(0, 5),
                timezone: window.timezone,
            })),
        );
        setPortfolioVisibility(nextProfile.portfolio_visibility);
        setRecruiterDiscoverable(nextProfile.recruiter_discoverable);
        setVisibilityReviewed(true);
    }

    useEffect(() => {
        if (!affiliationVerified || profileId === null) {
            return;
        }

        let active = true;

        loadProfile(studentProfiles.show(profileId).url, {
            onSuccess: (response) => {
                if (active) {
                    hydrateProfile(response.data);
                }
            },
            onHttpException: (response) => {
                if (active) {
                    setProfileIssue(issueFromStatus(response.status));
                    setProfileLoading(false);
                }

                return false;
            },
            onNetworkError: () => {
                if (active) {
                    setProfileIssue('network');
                    setProfileLoading(false);
                }

                return false;
            },
        }).catch(() => undefined);

        return () => {
            active = false;
            cancelProfileLoad();
        };
    }, [
        affiliationVerified,
        cancelProfileLoad,
        loadProfile,
        profileId,
        profileLoadAttempt,
    ]);

    function focusErrors() {
        window.requestAnimationFrame(() => errorSummary.current?.focus());
    }

    function reloadProfile() {
        setActionIssue(null);
        setProfileIssue(null);
        setProfileLoading(true);
        setProfileLoadAttempt((current) => current + 1);
    }

    function beginAction(retry: () => void) {
        retryAction.current = retry;
        setActionIssue(null);
        setSavedSection(null);
    }

    function actionOptions(section: ProfileSection) {
        return {
            onSuccess: (response: ProfileResponse) => {
                hydrateProfile(response.data);
                onProfileCreated?.(response.data.id);
                setActionIssue(null);
                setSavedSection(section);
            },
            onError: focusErrors,
            onNetworkError: () => {
                setActionIssue('network');

                return false;
            },
            onHttpException: (response: { status: number }) => {
                const issue = issueFromStatus(response.status);
                setActionIssue(issue);

                if (issue === 'stale') {
                    retryAction.current = reloadProfile;
                }

                return false;
            },
        };
    }

    function profileBasePayload(
        expectedUpdatedAt?: string,
    ): Omit<ProfileWritePayload, 'institution_id'> {
        const payload: Omit<ProfileWritePayload, 'institution_id'> = {
            bio,
            study_program: studyProgram,
            study_year: studyYear,
            skills: skills.map((skill) => ({
                taxonomy_id: skill.taxonomy_id,
                proficiency: skill.proficiency,
                evidence_metadata:
                    skill.evidence.trim() === '' ? [] : [skill.evidence.trim()],
            })),
            interests: interests.map((interest) => interest.taxonomy_id),
        };

        if (expectedUpdatedAt !== undefined) {
            payload.expected_updated_at = expectedUpdatedAt;
        }

        return payload;
    }

    function createProfile(
        section: ProfileSection,
        extra: Partial<ProfileWritePayload>,
        retry: () => void,
    ) {
        if (institutionId === null || profileForm.processing) {
            return;
        }

        beginAction(retry);
        profileForm.transform(() => ({
            institution_id: institutionId,
            ...profileBasePayload(),
            ...extra,
        }));
        profileForm
            .post(studentProfiles.store().url, actionOptions(section))
            .catch(() => undefined);
    }

    function saveBasics() {
        if (profile === null) {
            createProfile('basics', {}, saveBasics);

            return;
        }

        if (profileForm.processing) {
            return;
        }

        beginAction(saveBasics);
        profileForm.transform(() => profileBasePayload(profile.updated_at));
        profileForm
            .patch(
                studentProfiles.update(profile.id).url,
                actionOptions('basics'),
            )
            .catch(() => undefined);
    }

    function saveSkills() {
        if (profile === null) {
            createProfile('skills', {}, saveSkills);

            return;
        }

        if (profileForm.processing) {
            return;
        }

        beginAction(saveSkills);
        profileForm.transform(() => profileBasePayload(profile.updated_at));
        profileForm
            .patch(
                studentProfiles.update(profile.id).url,
                actionOptions('skills'),
            )
            .catch(() => undefined);
    }

    function saveAvailability() {
        if (profile === null) {
            createProfile(
                'availability',
                {
                    availability_windows: availabilityPayload(availability),
                    timezone,
                },
                saveAvailability,
            );

            return;
        }

        if (availabilityForm.processing) {
            return;
        }

        beginAction(saveAvailability);
        availabilityForm.transform(() => ({
            windows: availabilityPayload(availability),
            timezone,
            expected_updated_at: profile.updated_at,
        }));
        availabilityForm
            .put(
                studentProfiles.availability.update(profile.id).url,
                actionOptions('availability'),
            )
            .catch(() => undefined);
    }

    function saveVisibility() {
        if (profile === null) {
            createProfile(
                'visibility',
                {
                    portfolio_visibility: portfolioVisibility,
                    recruiter_discoverable: recruiterDiscoverable,
                },
                saveVisibility,
            );

            return;
        }

        if (visibilityForm.processing) {
            return;
        }

        beginAction(saveVisibility);
        visibilityForm.transform(() => ({
            portfolio_visibility: portfolioVisibility,
            recruiter_discoverable: recruiterDiscoverable,
            expected_updated_at: profile.updated_at,
        }));
        visibilityForm
            .patch(
                studentProfiles.visibility.update(profile.id).url,
                actionOptions('visibility'),
            )
            .catch(() => undefined);
    }

    function addSkill(taxonomy: Taxonomy) {
        if (skills.some((skill) => skill.taxonomy_id === taxonomy.id)) {
            return;
        }

        setSkills((current) => [
            ...current,
            {
                key: `${pageId}-skill-${taxonomy.id}`,
                taxonomy_id: taxonomy.id,
                name: taxonomy.name,
                proficiency: 'beginner',
                evidence: '',
            },
        ]);
    }

    function addInterest(taxonomy: Taxonomy) {
        if (
            interests.some((interest) => interest.taxonomy_id === taxonomy.id)
        ) {
            return;
        }

        setInterests((current) => [
            ...current,
            {
                key: `${pageId}-interest-${taxonomy.id}`,
                taxonomy_id: taxonomy.id,
                name: taxonomy.name,
            },
        ]);
    }

    function addAvailability() {
        setAvailability((current) => [
            ...current,
            {
                key: `${pageId}-window-${current.length}`,
                day_of_week: 1,
                starts_at: '09:00',
                ends_at: '10:00',
                timezone,
            },
        ]);
    }

    if (!affiliationVerified) {
        return <ProfileLockedState />;
    }

    if (profileLoading) {
        return <ProfileLoadingState />;
    }

    if (profileIssue !== null) {
        const copy = issueCopy[profileIssue];
        const IssueIcon = copy.icon;

        return (
            <section
                aria-labelledby="profile-load-error-title"
                className="grid gap-4 border border-border bg-card p-5 sm:p-6"
                data-test="profile-load-recovery"
            >
                <div className="flex items-start gap-3">
                    <IssueIcon
                        aria-hidden="true"
                        className="mt-0.5 size-5 shrink-0"
                    />
                    <div>
                        <h2
                            id="profile-load-error-title"
                            className="font-semibold"
                        >
                            {copy.title}
                        </h2>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            {copy.description}
                        </p>
                    </div>
                </div>
                <Button
                    type="button"
                    className="w-fit cursor-pointer disabled:cursor-not-allowed"
                    onClick={() => {
                        setProfileIssue(null);
                        setProfileLoading(true);
                        setProfileLoadAttempt((current) => current + 1);
                    }}
                >
                    <RefreshCw />
                    Muat profil lagi
                </Button>
            </section>
        );
    }

    const basicsComplete =
        bio.trim() !== '' && studyProgram.trim() !== '' && studyYear !== null;
    const skillsComplete = skills.length > 0;
    const availabilityComplete = availability.length > 0;
    const statuses: Record<ProfileSection, boolean> = {
        basics: basicsComplete,
        skills: skillsComplete,
        availability: availabilityComplete,
        visibility: visibilityReviewed,
    };
    const missingPieces = [
        !basicsComplete ? 'profil inti' : null,
        !skillsComplete ? 'skill' : null,
        !availabilityComplete ? 'ketersediaan' : null,
    ].filter((piece): piece is string => piece !== null);
    const profileFormErrors = profileErrors(
        profileForm.errors as Record<string, unknown>,
    );
    const availabilityErrors = profileErrors(
        (profile === null
            ? profileForm.errors
            : availabilityForm.errors) as Record<string, unknown>,
    );
    const visibilityErrors = profileErrors(
        (profile === null
            ? profileForm.errors
            : visibilityForm.errors) as Record<string, unknown>,
    );
    const portfolioVisibilityError =
        profile === null
            ? profileForm.errors.portfolio_visibility
            : visibilityForm.errors.portfolio_visibility;
    const recruiterDiscoverableError =
        profile === null
            ? profileForm.errors.recruiter_discoverable
            : visibilityForm.errors.recruiter_discoverable;
    const anyProfileProcessing =
        profileForm.processing ||
        availabilityForm.processing ||
        visibilityForm.processing;
    const profileProcessing = anyProfileProcessing;
    const availabilityProcessing = anyProfileProcessing;
    const visibilityProcessing = anyProfileProcessing;

    return (
        <section
            aria-labelledby="profile-title"
            className="mt-8 grid gap-5"
            data-profile-state={profile === null ? 'empty' : 'partial'}
            data-test="student-profile"
            id="profile"
        >
            <header className="grid gap-2">
                <p className="font-label text-label text-primary">
                    Profil mahasiswa
                </p>
                <h2
                    id="profile-title"
                    className="text-title font-bold sm:text-[1.75rem] sm:leading-tight"
                >
                    Lengkapi profilmu dengan ritmemu sendiri
                </h2>
                <p className="max-w-[68ch] text-sm leading-relaxed text-muted-foreground sm:text-base">
                    Simpan bagian yang sudah siap. Profil inti membantu
                    menjelaskan konteks belajarmu, sedangkan skill,
                    ketersediaan, dan visibilitas dapat kamu perbarui kapan
                    saja.
                </p>
            </header>

            <div className="grid gap-4 border border-border bg-muted/40 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:p-5">
                <div>
                    <p className="flex items-center gap-2 font-semibold">
                        <ShieldCheck
                            aria-hidden="true"
                            className="size-4 text-primary"
                        />
                        Bagian yang masih perlu kamu lengkapi
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {missingPieces.length > 0
                            ? `Saat ini yang belum diisi: ${missingPieces.join(', ')}. Tidak ada fitur yang terkunci hanya karena profil belum lengkap.`
                            : 'Profil inti dan bagian pendukungmu sudah terisi. Kamu tetap bisa mengubahnya kapan saja.'}
                    </p>
                </div>
                <Badge variant="outline" className="w-fit">
                    {profile === null
                        ? 'Belum ada profil tersimpan'
                        : 'Profil tersimpan'}
                </Badge>
            </div>

            <ProfileSectionIndex
                activeSection={activeSection}
                statuses={statuses}
                onNavigate={setActiveSection}
            />

            {actionIssue !== null && retryAction.current !== null && (
                <ProfileActionRecovery
                    issue={actionIssue}
                    onRetry={() => retryAction.current?.()}
                />
            )}

            <section
                aria-labelledby="profile-basics-title"
                className="border border-border bg-card"
                id="profile-basics"
            >
                <div className="border-b border-border px-5 py-4 sm:px-6">
                    <p className="font-label text-label text-muted-foreground">
                        01 / PROFIL INTI
                    </p>
                    <h3
                        id="profile-basics-title"
                        className="mt-1 text-xl font-bold"
                    >
                        Ceritakan konteks belajarmu
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        Isi seperlunya. Data ini membantu orang memahami
                        kontribusi dan arah belajarmu.
                    </p>
                </div>
                <form
                    className="grid gap-5 px-5 py-6 sm:px-6"
                    onSubmit={(event) => {
                        event.preventDefault();
                        saveBasics();
                    }}
                >
                    {profileFormErrors.length > 0 && (
                        <div
                            ref={errorSummary}
                            tabIndex={-1}
                            data-test="profile-error-summary"
                        >
                            <Alert variant="destructive">
                                <CircleAlert aria-hidden="true" />
                                <AlertTitle>
                                    Profil belum dapat disimpan
                                </AlertTitle>
                                <AlertDescription>
                                    <ul className="list-inside list-disc">
                                        {profileFormErrors.map((error) => (
                                            <li key={error}>{error}</li>
                                        ))}
                                    </ul>
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}
                    <div className="grid gap-2">
                        <label
                            htmlFor="profile-bio"
                            className="text-sm font-semibold"
                        >
                            Bio singkat
                        </label>
                        <textarea
                            id="profile-bio"
                            name="bio"
                            rows={5}
                            maxLength={2000}
                            value={bio}
                            onChange={(event) => setBio(event.target.value)}
                            aria-invalid={
                                profileForm.errors.bio ? true : undefined
                            }
                            aria-describedby={
                                profileForm.errors.bio
                                    ? 'profile-bio-help profile-bio-error'
                                    : 'profile-bio-help'
                            }
                            className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground transition-colors duration-fast ease-ledger outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none"
                            placeholder="Misalnya, hal yang sedang kamu pelajari atau kontribusi yang ingin kamu kembangkan."
                        />
                        <p
                            id="profile-bio-help"
                            className="text-xs leading-relaxed text-muted-foreground"
                        >
                            Maksimal 2.000 karakter. Hindari menulis nomor
                            WhatsApp atau NIM di sini.
                        </p>
                        <InputError
                            id="profile-bio-error"
                            message={profileForm.errors.bio}
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <label
                                htmlFor="study-program"
                                className="text-sm font-semibold"
                            >
                                Program studi
                            </label>
                            <Input
                                id="study-program"
                                name="study_program"
                                value={studyProgram}
                                onChange={(event) =>
                                    setStudyProgram(event.target.value)
                                }
                                aria-invalid={
                                    profileForm.errors.study_program
                                        ? true
                                        : undefined
                                }
                                aria-describedby={
                                    profileForm.errors.study_program
                                        ? 'study-program-help study-program-error'
                                        : 'study-program-help'
                                }
                            />
                            <p
                                id="study-program-help"
                                className="text-xs leading-relaxed text-muted-foreground"
                            >
                                Tulis nama program studi seperti yang biasa
                                dipakai kampusmu.
                            </p>
                            <InputError
                                id="study-program-error"
                                message={profileForm.errors.study_program}
                            />
                        </div>
                        <div className="grid gap-2">
                            <label
                                htmlFor="study-year"
                                className="text-sm font-semibold"
                            >
                                Tahun studi
                            </label>
                            <select
                                id="study-year"
                                name="study_year"
                                value={studyYear ?? ''}
                                onChange={(event) =>
                                    setStudyYear(
                                        event.target.value === ''
                                            ? null
                                            : Number(event.target.value),
                                    )
                                }
                                aria-invalid={
                                    profileForm.errors.study_year
                                        ? true
                                        : undefined
                                }
                                aria-describedby={
                                    profileForm.errors.study_year
                                        ? 'study-year-help study-year-error'
                                        : 'study-year-help'
                                }
                                className="h-control-md w-full cursor-pointer rounded-md border border-input bg-background px-3 text-sm text-foreground transition-colors duration-fast ease-ledger outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none"
                            >
                                <option value="">Pilih tahun studi</option>
                                {Array.from(
                                    { length: 10 },
                                    (_, index) => index + 1,
                                ).map((year) => (
                                    <option key={year} value={year}>
                                        Tahun {year}
                                    </option>
                                ))}
                            </select>
                            <p
                                id="study-year-help"
                                className="text-xs leading-relaxed text-muted-foreground"
                            >
                                Pilihan ini dapat diperbarui saat tahun studimu
                                berubah.
                            </p>
                            <InputError
                                id="study-year-error"
                                message={profileForm.errors.study_year}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <SavedMessage
                            section="basics"
                            savedSection={savedSection}
                        />
                        <Button
                            type="submit"
                            className="cursor-pointer disabled:cursor-not-allowed sm:ml-auto"
                            disabled={profileProcessing}
                            data-test="profile-basics-save"
                        >
                            {profileProcessing ? <Spinner /> : <Save />}
                            {profileProcessing
                                ? 'Menyimpan profil inti'
                                : 'Simpan profil inti'}
                        </Button>
                    </div>
                </form>
            </section>

            <section
                aria-labelledby="profile-skills-title"
                className="border border-border bg-card"
                id="profile-skills"
            >
                <div className="border-b border-border px-5 py-4 sm:px-6">
                    <p className="font-label text-label text-muted-foreground">
                        02 / SKILL DAN MINAT
                    </p>
                    <h3
                        id="profile-skills-title"
                        className="mt-1 text-xl font-bold"
                    >
                        Pilih kemampuan yang ingin kamu tampilkan
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        Pilih dari taxonomi terverifikasi. Tingkat kemahiran dan
                        bukti pengalaman membantu konteks tetap jelas.
                    </p>
                </div>
                <form
                    className="grid gap-6 px-5 py-6 sm:px-6"
                    onSubmit={(event) => {
                        event.preventDefault();
                        saveSkills();
                    }}
                >
                    <TaxonomyPicker
                        id="skill-taxonomy-search"
                        label="Tambah skill"
                        hint="Ketik untuk mencari. Jika belum menemukan pilihan yang tepat, pilih yang paling mendekati dan jangan menambahkan data pribadi sebagai nama skill."
                        selectedIds={skills.map((skill) => skill.taxonomy_id)}
                        onSelect={addSkill}
                    />

                    {skills.length === 0 ? (
                        <div
                            className="border-y border-border py-4"
                            role="status"
                        >
                            <p className="font-semibold">
                                Belum ada skill yang dipilih
                            </p>
                            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                Mulai dari satu kemampuan yang paling relevan
                                dengan pengalamanmu saat ini.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4" data-test="selected-skills">
                            <div className="flex items-center justify-between gap-3">
                                <h4 className="font-semibold">
                                    Skill yang dipilih
                                </h4>
                                <span className="font-label text-label text-muted-foreground">
                                    {skills.length} / 30
                                </span>
                            </div>
                            <ul className="grid gap-3">
                                {skills.map((skill, index) => (
                                    <li
                                        key={skill.key}
                                        className="grid gap-3 border border-border p-4"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="font-semibold break-words">
                                                    {skill.name}
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    Skill {index + 1}
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                aria-label={`Hapus skill ${skill.name}`}
                                                className="size-control-sm shrink-0 cursor-pointer"
                                                onClick={() =>
                                                    setSkills((current) =>
                                                        current.filter(
                                                            (item) =>
                                                                item.key !==
                                                                skill.key,
                                                        ),
                                                    )
                                                }
                                            >
                                                <Trash2 aria-hidden="true" />
                                            </Button>
                                        </div>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="grid gap-2">
                                                <label
                                                    htmlFor={`skill-proficiency-${skill.key}`}
                                                    className="text-sm font-semibold"
                                                >
                                                    Tingkat kemahiran
                                                </label>
                                                <Select
                                                    value={skill.proficiency}
                                                    onValueChange={(
                                                        value: Proficiency,
                                                    ) =>
                                                        setSkills((current) =>
                                                            current.map(
                                                                (item) =>
                                                                    item.key ===
                                                                    skill.key
                                                                        ? {
                                                                              ...item,
                                                                              proficiency:
                                                                                  value,
                                                                          }
                                                                        : item,
                                                            ),
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger
                                                        id={`skill-proficiency-${skill.key}`}
                                                        className="h-control-md w-full cursor-pointer"
                                                    >
                                                        <SelectValue placeholder="Pilih tingkat" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {proficiencyOptions.map(
                                                            (option) => (
                                                                <SelectItem
                                                                    key={
                                                                        option.value
                                                                    }
                                                                    value={
                                                                        option.value
                                                                    }
                                                                    className="cursor-pointer"
                                                                >
                                                                    {
                                                                        option.label
                                                                    }
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <label
                                                    htmlFor={`skill-evidence-${skill.key}`}
                                                    className="text-sm font-semibold"
                                                >
                                                    Bukti pengalaman{' '}
                                                    <span className="font-normal text-muted-foreground">
                                                        (opsional)
                                                    </span>
                                                </label>
                                                <Input
                                                    id={`skill-evidence-${skill.key}`}
                                                    value={skill.evidence}
                                                    onChange={(event) =>
                                                        setSkills((current) =>
                                                            current.map(
                                                                (item) =>
                                                                    item.key ===
                                                                    skill.key
                                                                        ? {
                                                                              ...item,
                                                                              evidence:
                                                                                  event
                                                                                      .target
                                                                                      .value,
                                                                          }
                                                                        : item,
                                                            ),
                                                        )
                                                    }
                                                    placeholder="Contoh: proyek kelas, organisasi, atau portofolio"
                                                />
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="grid gap-4 border-t border-border pt-5">
                        <TaxonomyPicker
                            id="interest-taxonomy-search"
                            category="interest"
                            label="Tambah minat"
                            hint="Minat membantu memberi konteks kolaborasi, tetapi tidak wajib untuk menyimpan profil minimum."
                            selectedIds={interests.map(
                                (interest) => interest.taxonomy_id,
                            )}
                            onSelect={addInterest}
                        />
                        {interests.length > 0 && (
                            <div
                                className="flex flex-wrap gap-2"
                                data-test="selected-interests"
                            >
                                {interests.map((interest) => (
                                    <Badge
                                        key={interest.key}
                                        variant="outline"
                                        className="gap-1 py-1 pr-1"
                                    >
                                        <span className="break-words">
                                            {interest.name}
                                        </span>
                                        <button
                                            type="button"
                                            aria-label={`Hapus minat ${interest.name}`}
                                            className="inline-flex size-5 cursor-pointer items-center justify-center rounded-sm hover:bg-muted"
                                            onClick={() =>
                                                setInterests((current) =>
                                                    current.filter(
                                                        (item) =>
                                                            item.key !==
                                                            interest.key,
                                                    ),
                                                )
                                            }
                                        >
                                            <X
                                                aria-hidden="true"
                                                className="size-3"
                                            />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <SavedMessage
                            section="skills"
                            savedSection={savedSection}
                        />
                        <Button
                            type="submit"
                            className="cursor-pointer disabled:cursor-not-allowed sm:ml-auto"
                            disabled={profileProcessing}
                            data-test="profile-skills-save"
                        >
                            {profileProcessing ? <Spinner /> : <Save />}
                            {profileProcessing
                                ? 'Menyimpan skill'
                                : 'Simpan skill dan minat'}
                        </Button>
                    </div>
                </form>
            </section>

            <section
                aria-labelledby="profile-availability-title"
                className="border border-border bg-card"
                id="profile-availability"
            >
                <div className="border-b border-border px-5 py-4 sm:px-6">
                    <p className="font-label text-label text-muted-foreground">
                        03 / KETERSEDIAAN
                    </p>
                    <h3
                        id="profile-availability-title"
                        className="mt-1 text-xl font-bold"
                    >
                        Tentukan waktu yang mungkin untuk berkolaborasi
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        Jadwal ini membantu mencocokkan kesempatan kolaborasi.
                        Kamu bisa mengosongkannya atau mengubahnya kapan saja.
                    </p>
                </div>
                <form
                    className="grid gap-5 px-5 py-6 sm:px-6"
                    onSubmit={(event) => {
                        event.preventDefault();
                        saveAvailability();
                    }}
                >
                    {availabilityErrors.length > 0 && (
                        <div
                            id="availability-error-summary"
                            ref={profile === null ? errorSummary : undefined}
                            tabIndex={-1}
                        >
                            <Alert variant="destructive">
                                <CircleAlert aria-hidden="true" />
                                <AlertTitle>
                                    Ketersediaan belum dapat disimpan
                                </AlertTitle>
                                <AlertDescription>
                                    <ul className="list-inside list-disc">
                                        {availabilityErrors.map((error) => (
                                            <li key={error}>{error}</li>
                                        ))}
                                    </ul>
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="font-semibold">
                                Waktu yang kamu pilih
                            </p>
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                Maksimal 14 waktu. Timezone yang digunakan:{' '}
                                {timezone}.
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-fit cursor-pointer"
                            onClick={addAvailability}
                            disabled={availability.length >= 14}
                        >
                            <Plus />
                            Tambah waktu
                        </Button>
                    </div>

                    {availability.length === 0 ? (
                        <div
                            className="border-y border-border py-4"
                            role="status"
                        >
                            <p className="font-semibold">
                                Belum ada ketersediaan
                            </p>
                            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                Tambahkan waktu jika kamu ingin menerima konteks
                                kesempatan kolaborasi yang lebih sesuai.
                            </p>
                        </div>
                    ) : (
                        <ol
                            className="grid gap-3"
                            data-test="availability-windows"
                        >
                            {availability.map((window, index) => (
                                <li
                                    key={window.key}
                                    className="grid gap-3 border border-border p-4 lg:grid-cols-[minmax(0,1fr)_9rem_9rem_auto] lg:items-end"
                                >
                                    <div className="grid gap-2">
                                        <label
                                            htmlFor={`availability-day-${window.key}`}
                                            className="text-sm font-semibold"
                                        >
                                            Hari {index + 1}
                                        </label>
                                        <select
                                            id={`availability-day-${window.key}`}
                                            value={window.day_of_week}
                                            onChange={(event) =>
                                                setAvailability((current) =>
                                                    current.map((item) =>
                                                        item.key === window.key
                                                            ? {
                                                                  ...item,
                                                                  day_of_week:
                                                                      Number(
                                                                          event
                                                                              .target
                                                                              .value,
                                                                      ),
                                                              }
                                                            : item,
                                                    ),
                                                )
                                            }
                                            className="h-control-md w-full cursor-pointer rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                                        >
                                            {days.map((day, dayIndex) => (
                                                <option
                                                    key={day}
                                                    value={dayIndex}
                                                >
                                                    {day}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid gap-2">
                                        <label
                                            htmlFor={`availability-start-${window.key}`}
                                            className="text-sm font-semibold"
                                        >
                                            Mulai
                                        </label>
                                        <Input
                                            id={`availability-start-${window.key}`}
                                            type="time"
                                            value={window.starts_at}
                                            onChange={(event) =>
                                                setAvailability((current) =>
                                                    current.map((item) =>
                                                        item.key === window.key
                                                            ? {
                                                                  ...item,
                                                                  starts_at:
                                                                      event
                                                                          .target
                                                                          .value,
                                                              }
                                                            : item,
                                                    ),
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <label
                                            htmlFor={`availability-end-${window.key}`}
                                            className="text-sm font-semibold"
                                        >
                                            Selesai
                                        </label>
                                        <Input
                                            id={`availability-end-${window.key}`}
                                            type="time"
                                            value={window.ends_at}
                                            onChange={(event) =>
                                                setAvailability((current) =>
                                                    current.map((item) =>
                                                        item.key === window.key
                                                            ? {
                                                                  ...item,
                                                                  ends_at:
                                                                      event
                                                                          .target
                                                                          .value,
                                                              }
                                                            : item,
                                                    ),
                                                )
                                            }
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        aria-label={`Hapus waktu ${days[window.day_of_week]}`}
                                        className="size-control-sm cursor-pointer lg:mb-0.5"
                                        onClick={() =>
                                            setAvailability((current) =>
                                                current.filter(
                                                    (item) =>
                                                        item.key !== window.key,
                                                ),
                                            )
                                        }
                                    >
                                        <Trash2 aria-hidden="true" />
                                    </Button>
                                </li>
                            ))}
                        </ol>
                    )}

                    <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <SavedMessage
                            section="availability"
                            savedSection={savedSection}
                        />
                        <Button
                            type="submit"
                            className="cursor-pointer disabled:cursor-not-allowed sm:ml-auto"
                            disabled={availabilityProcessing}
                            data-test="profile-availability-save"
                        >
                            {availabilityProcessing ? <Spinner /> : <Save />}
                            {availabilityProcessing
                                ? 'Menyimpan ketersediaan'
                                : 'Simpan ketersediaan'}
                        </Button>
                    </div>
                </form>
            </section>

            <section
                aria-labelledby="profile-visibility-title"
                className="border border-border bg-card"
                id="profile-visibility"
            >
                <div className="border-b border-border px-5 py-4 sm:px-6">
                    <p className="font-label text-label text-muted-foreground">
                        04 / VISIBILITAS DAN PERSETUJUAN
                    </p>
                    <h3
                        id="profile-visibility-title"
                        className="mt-1 text-xl font-bold"
                    >
                        Kamu yang menentukan siapa yang dapat melihat
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        Pilihan ini terpisah dari afiliasi kampus. Tidak ada
                        pilihan yang diaktifkan otomatis untuk membagikan profil
                        ke recruiter.
                    </p>
                </div>
                <form
                    className="grid gap-6 px-5 py-6 sm:px-6"
                    onSubmit={(event) => {
                        event.preventDefault();
                        saveVisibility();
                    }}
                >
                    {visibilityErrors.length > 0 && (
                        <div
                            ref={profile === null ? errorSummary : undefined}
                            tabIndex={-1}
                        >
                            <Alert variant="destructive">
                                <CircleAlert aria-hidden="true" />
                                <AlertTitle>
                                    Pengaturan visibilitas belum tersimpan
                                </AlertTitle>
                                <AlertDescription>
                                    <ul className="list-inside list-disc">
                                        {visibilityErrors.map((error) => (
                                            <li key={error}>{error}</li>
                                        ))}
                                    </ul>
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}
                    <fieldset
                        className="grid gap-3"
                        aria-describedby={
                            portfolioVisibilityError
                                ? 'portfolio-visibility-error'
                                : undefined
                        }
                    >
                        <legend className="text-sm font-semibold">
                            Visibilitas proyeksi portfolio
                        </legend>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {visibilityOptions.map((option) => (
                                <label
                                    key={option.value}
                                    className={cn(
                                        'flex cursor-pointer gap-3 border border-border p-4 transition-colors duration-fast ease-ledger hover:bg-muted motion-reduce:transition-none',
                                        portfolioVisibility === option.value &&
                                            'border-primary bg-primary/5',
                                    )}
                                >
                                    <input
                                        type="radio"
                                        name="portfolio_visibility"
                                        value={option.value}
                                        checked={
                                            portfolioVisibility === option.value
                                        }
                                        onChange={() => {
                                            setPortfolioVisibility(
                                                option.value,
                                            );
                                            setVisibilityReviewed(true);
                                        }}
                                        className="mt-1 size-4 cursor-pointer accent-primary"
                                    />
                                    <span>
                                        <span className="block font-semibold">
                                            {option.label}
                                        </span>
                                        <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                                            {option.description}
                                        </span>
                                    </span>
                                </label>
                            ))}
                        </div>
                        <InputError
                            id="portfolio-visibility-error"
                            message={portfolioVisibilityError}
                        />
                    </fieldset>

                    <div className="grid gap-3 border-y border-border py-4">
                        <div className="flex items-start gap-3">
                            <Checkbox
                                id="recruiter-discoverable"
                                checked={recruiterDiscoverable}
                                onCheckedChange={(checked) => {
                                    setRecruiterDiscoverable(checked === true);
                                    setVisibilityReviewed(true);
                                }}
                                className="mt-0.5 cursor-pointer"
                                aria-invalid={
                                    recruiterDiscoverableError
                                        ? true
                                        : undefined
                                }
                                aria-describedby={
                                    recruiterDiscoverableError
                                        ? 'recruiter-discoverable-help recruiter-discoverable-error'
                                        : 'recruiter-discoverable-help'
                                }
                            />
                            <div>
                                <label
                                    htmlFor="recruiter-discoverable"
                                    className="cursor-pointer text-sm font-semibold"
                                >
                                    Izinkan recruiter menemukan profil ini
                                </label>
                                <p
                                    id="recruiter-discoverable-help"
                                    className="mt-1 text-sm leading-relaxed text-muted-foreground"
                                >
                                    Dengan mencentang ini, kamu menyatakan sudah
                                    memahami bahwa recruiter dapat menemukan
                                    proyeksi portfolio yang kamu izinkan. Nomor
                                    WhatsApp, NIM, diskusi privat, dan data
                                    review internal tidak ikut dibagikan.
                                </p>
                            </div>
                        </div>
                        <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                            <Eye
                                aria-hidden="true"
                                className="mt-0.5 size-4 shrink-0"
                            />
                            {recruiterDiscoverable
                                ? 'Persetujuan recruiter aktif. Kamu dapat menariknya kembali kapan saja.'
                                : 'Profil belum dapat ditemukan recruiter melalui pengaturan ini.'}
                        </p>
                        <InputError
                            id="recruiter-discoverable-error"
                            message={recruiterDiscoverableError}
                        />
                    </div>

                    <div className="flex items-start gap-3 bg-muted/50 p-4 text-sm">
                        <Info
                            aria-hidden="true"
                            className="mt-0.5 size-4 shrink-0 text-primary"
                        />
                        <p className="leading-relaxed text-muted-foreground">
                            Persetujuan dicatat sebagai riwayat perubahan.
                            Mengubah visibilitas tidak mengubah status afiliasi
                            kampusmu.
                        </p>
                    </div>

                    <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <SavedMessage
                            section="visibility"
                            savedSection={savedSection}
                        />
                        <Button
                            type="submit"
                            className="cursor-pointer disabled:cursor-not-allowed sm:ml-auto"
                            disabled={visibilityProcessing}
                            data-test="profile-visibility-save"
                        >
                            {visibilityProcessing ? <Spinner /> : <Save />}
                            {visibilityProcessing
                                ? 'Menyimpan visibilitas'
                                : 'Simpan visibilitas'}
                        </Button>
                    </div>
                </form>
            </section>
        </section>
    );
}
