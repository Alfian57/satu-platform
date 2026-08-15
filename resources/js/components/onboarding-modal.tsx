import { router, useHttp, usePage } from '@inertiajs/react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
    ArrowLeft,
    ArrowRight,
    Briefcase,
    Building2,
    Check,
    Clock,
    CreditCard,
    Globe,
    GraduationCap,
    Info,
    Lock,
    Plus,
    Search,
    Shield,
    Trash2,
    User,
    Users,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { store as storeAffiliation } from '@/routes/institution-memberships';
import studentProfiles from '@/routes/student-profiles';
import type { Auth, ShellContext } from '@/types';

type Proficiency = 'beginner' | 'intermediate' | 'advanced' | 'expert';
type PortfolioVisibility = 'private' | 'institution' | 'recruiter' | 'public';

type Taxonomy = {
    id: number;
    name: string;
    category: string;
    description: string | null;
};

type DraftSkill = {
    taxonomy_id: number;
    name: string;
    category?: string;
    proficiency: Proficiency;
};

type DraftAvailability = {
    day_of_week: number;
    starts_at: string;
    ends_at: string;
    timezone: string;
};

type ProfileResponse = {
    data: {
        id: number;
    };
};

type StudentProfileFormPayload = {
    institution_id: number;
    study_program: string;
    study_year: number;
    bio: string;
    skills: {
        taxonomy_id: number;
        proficiency: Proficiency;
        evidence_metadata: Record<string, string | number | boolean | null>[];
    }[];
    availability_windows: DraftAvailability[];
    portfolio_visibility: PortfolioVisibility;
    recruiter_discoverable: boolean;
};

type OnboardingState = {
    required: boolean;
    institutionId: number | null;
    institutionName: string | null;
    membershipStatus: string;
    profileId: number | null;
    studyProgram: string;
    studyYear: number;
    bio: string;
    skillsCount: number;
    availabilityCount: number;
    institutions?: { id: number; name: string }[];
    nim?: string;
};

type PagePropsWithOnboarding = {
    auth: Auth;
    shell: ShellContext;
    onboarding?: OnboardingState | null;
    [key: string]: unknown;
};

const proficiencyLabels: Record<Proficiency, string> = {
    beginner: 'Pemula',
    intermediate: 'Menengah',
    advanced: 'Lanjutan',
    expert: 'Mahir',
};

const stepLabels = [
    { step: 1, title: 'Kampus & Akademik', subtitle: 'Identitas & Afiliasi' },
    { step: 2, title: 'Keahlian & Minat', subtitle: 'Skill & Profil Singkat' },
    { step: 3, title: 'Jadwal & Visibilitas', subtitle: 'Waktu & Izin Akses' },
];

function defaultTimezone(): string {
    try {
        return (
            Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jakarta'
        );
    } catch {
        return 'Asia/Jakarta';
    }
}

export function OnboardingModal() {
    const { onboarding } = usePage<PagePropsWithOnboarding>().props;
    const isRequired = Boolean(onboarding?.required);

    // Multi-step form step state (1, 2, 3)
    const [currentStep, setCurrentStep] = useState(1);

    // Step 1: Kampus & Data Akademik
    const [institutionId, setInstitutionId] = useState<string>(
        onboarding?.institutionId ? String(onboarding.institutionId) : '',
    );
    const [nim, setNim] = useState<string>(onboarding?.nim || '');
    const [studyProgram, setStudyProgram] = useState(
        onboarding?.studyProgram || '',
    );
    const [studyYear, setStudyYear] = useState<string>(
        onboarding?.studyYear ? String(onboarding.studyYear) : '',
    );

    // Step 2: Bio & Keahlian (Skills)
    const [bio, setBio] = useState(onboarding?.bio || '');
    const [skills, setSkills] = useState<DraftSkill[]>([]);

    // Step 3: Ketersediaan Waktu & Visibilitas
    const [availabilityDays, setAvailabilityDays] = useState<number[]>([]);
    const [startsAt, setStartsAt] = useState('09:00');
    const [endsAt, setEndsAt] = useState('17:00');

    // Multi-entity checkbox states
    const [allowCampus, setAllowCampus] = useState(false);
    const [allowRecruiter, setAllowRecruiter] = useState(false);
    const [allowPublic, setAllowPublic] = useState(false);

    // Skill search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Taxonomy[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [isCreatingSkill, setIsCreatingSkill] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const abortControllerRef = useRef<AbortController | null>(null);

    const form = useHttp<StudentProfileFormPayload, ProfileResponse>({
        institution_id: onboarding?.institutionId || 1,
        study_program: '',
        study_year: 1,
        bio: '',
        skills: [],
        availability_windows: [],
        portfolio_visibility: 'private',
        recruiter_discoverable: false,
    });

    const affiliationForm = useHttp<
        { institution_id: number; nim: string },
        unknown
    >({
        institution_id: 1,
        nim: '',
    });

    // Reliable debounced skill search using fetch API with AbortController
    useEffect(() => {
        const query = searchQuery.trim();

        if (query.length === 0) {
            setSearchResults([]);
            setSearchLoading(false);
            return;
        }

        setSearchLoading(true);

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        const timer = setTimeout(async () => {
            try {
                const response = await fetch(
                    `/api/skills/taxonomy?query=${encodeURIComponent(query)}`,
                    {
                        signal: controller.signal,
                        headers: {
                            Accept: 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                    },
                );

                if (response.ok) {
                    const json = (await response.json()) as {
                        data: Taxonomy[];
                    };
                    setSearchResults(json.data || []);
                }
            } catch (err: unknown) {
                if (err instanceof DOMException && err.name === 'AbortError') {
                    return;
                }
            } finally {
                setSearchLoading(false);
            }
        }, 150);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [searchQuery]);

    if (!isRequired) {
        return null;
    }

    const institutionsList =
        onboarding?.institutions && onboarding.institutions.length > 0
            ? onboarding.institutions
            : [
                  {
                      id: 1,
                      name: onboarding?.institutionName || 'Universitas SATU',
                  },
              ];

    function handleSearchChange(value: string) {
        setSearchQuery(value);
        setSearchOpen(true);

        if (!value.trim()) {
            setSearchResults([]);
        }
    }

    function addSkill(item: { id: number; name: string; category?: string }) {
        if (!skills.some((s) => s.taxonomy_id === item.id)) {
            setSkills((prev) => [
                ...prev,
                {
                    taxonomy_id: item.id,
                    name: item.name,
                    category: item.category,
                    proficiency: 'intermediate',
                },
            ]);
        }

        setSearchQuery('');
        setSearchResults([]);
        setSearchOpen(false);
        setErrorMessage(null);
    }

    // LinkedIn-style dynamic skill creation
    async function handleCreateNewSkill(name: string) {
        const trimmed = name.trim();
        if (!trimmed || isCreatingSkill) return;

        setIsCreatingSkill(true);
        setErrorMessage(null);

        try {
            const csrfToken =
                document
                    .querySelector('meta[name="csrf-token"]')
                    ?.getAttribute('content') || '';
            const res = await fetch('/api/skills/taxonomy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    name: trimmed,
                    category: 'software',
                }),
            });

            if (res.ok) {
                const json = (await res.json()) as { data: Taxonomy };
                if (json.data) {
                    addSkill(json.data);
                }
            }
        } catch {
            setErrorMessage('Gagal menambahkan skill baru. Coba lagi.');
        } finally {
            setIsCreatingSkill(false);
        }
    }

    function removeSkill(taxonomyId: number) {
        setSkills((prev) => prev.filter((s) => s.taxonomy_id !== taxonomyId));
    }

    function updateSkillProficiency(
        taxonomyId: number,
        proficiency: Proficiency,
    ) {
        setSkills((prev) =>
            prev.map((s) =>
                s.taxonomy_id === taxonomyId ? { ...s, proficiency } : s,
            ),
        );
    }

    function toggleDay(day: number) {
        setAvailabilityDays((prev) =>
            prev.includes(day)
                ? prev.filter((d) => d !== day)
                : [...prev, day].sort(),
        );
        setErrorMessage(null);
    }

    function resolvePortfolioVisibility(): {
        visibility: PortfolioVisibility;
        discoverable: boolean;
    } {
        if (allowPublic) {
            return {
                visibility: 'public',
                discoverable: allowRecruiter,
            };
        }

        if (allowRecruiter) {
            return {
                visibility: 'recruiter',
                discoverable: true,
            };
        }

        if (allowCampus) {
            return {
                visibility: 'institution',
                discoverable: false,
            };
        }

        return {
            visibility: 'private',
            discoverable: false,
        };
    }

    function handleNextStep() {
        setErrorMessage(null);

        if (currentStep === 1) {
            if (!institutionId) {
                setErrorMessage('Silakan pilih institusi/kampus.');
                return;
            }
            if (!nim.trim()) {
                setErrorMessage('Nomor Induk Mahasiswa (NIM) wajib diisi.');
                return;
            }
            if (!studyProgram.trim()) {
                setErrorMessage('Program studi wajib diisi.');
                return;
            }
            if (!studyYear) {
                setErrorMessage('Tahun studi / angkatan wajib dipilih.');
                return;
            }
            setCurrentStep(2);
        } else if (currentStep === 2) {
            if (skills.length === 0) {
                setErrorMessage('Tambahkan minimal 1 skill utama.');
                return;
            }
            setCurrentStep(3);
        }
    }

    function handlePrevStep() {
        setErrorMessage(null);
        setCurrentStep((prev) => Math.max(1, prev - 1));
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        // Only allow form submit if on Step 3
        if (currentStep < 3) {
            handleNextStep();
            return;
        }

        setErrorMessage(null);

        if (availabilityDays.length === 0) {
            setErrorMessage('Pilih minimal 1 hari ketersediaan kolaborasi.');
            return;
        }

        const selectedInstitutionId =
            Number(institutionId) || onboarding?.institutionId || 1;
        const timezone = defaultTimezone();

        const availabilityWindows: DraftAvailability[] = availabilityDays.map(
            (day) => ({
                day_of_week: day,
                starts_at: startsAt,
                ends_at: endsAt,
                timezone,
            }),
        );

        const { visibility, discoverable } = resolvePortfolioVisibility();

        // Submit affiliation request with NIM if needed
        if (nim.trim() && selectedInstitutionId) {
            affiliationForm.setData({
                institution_id: selectedInstitutionId,
                nim: nim.trim(),
            });
            affiliationForm.post(storeAffiliation.url(), {});
        }

        const payload: StudentProfileFormPayload = {
            institution_id: selectedInstitutionId,
            study_program: studyProgram.trim(),
            study_year: Number(studyYear),
            bio: bio.trim(),
            skills: skills.map((s) => ({
                taxonomy_id: s.taxonomy_id,
                proficiency: s.proficiency,
                evidence_metadata: [],
            })),
            availability_windows: availabilityWindows,
            portfolio_visibility: visibility,
            recruiter_discoverable: discoverable,
        };

        form.setData(payload);

        if (onboarding?.profileId) {
            form.patch(studentProfiles.update.url(onboarding.profileId), {
                onSuccess: () => {
                    router.reload();
                },
                onError: (errors) => {
                    const firstError = Object.values(errors)[0];

                    setErrorMessage(
                        typeof firstError === 'string'
                            ? firstError
                            : 'Gagal memperbarui profil. Periksa kembali input Anda.',
                    );
                },
            });
        } else {
            form.post(studentProfiles.store.url(), {
                onSuccess: () => {
                    router.reload();
                },
                onError: (errors) => {
                    const firstError = Object.values(errors)[0];

                    setErrorMessage(
                        typeof firstError === 'string'
                            ? firstError
                            : 'Gagal menyimpan profil. Periksa kembali input Anda.',
                    );
                },
            });
        }
    }

    const hasExactMatch = searchResults.some(
        (r) => r.name.toLowerCase() === searchQuery.trim().toLowerCase(),
    );

    return (
        <DialogPrimitive.Root open={true}>
            <DialogPrimitive.Portal>
                {/* Backdrop Blur */}
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 animate-in bg-slate-950/70 backdrop-blur-sm duration-200 fade-in-0" />

                <DialogPrimitive.Content
                    className="fixed top-1/2 left-1/2 z-50 flex max-h-[96vh] w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xl duration-200 sm:p-8"
                    onEscapeKeyDown={(e) => e.preventDefault()}
                    onPointerDownOutside={(e) => e.preventDefault()}
                >
                    {/* Header Section with Step Progress */}
                    <div className="shrink-0 space-y-4 border-b border-slate-100 pb-5">
                        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                        <Building2 className="size-4" />
                                    </span>
                                    <span className="text-xs font-bold tracking-wider text-blue-700 uppercase">
                                        {onboarding?.institutionName ||
                                            'Universitas SATU'}
                                    </span>
                                </div>
                                <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                                    Lengkapi Profil Mahasiswa
                                </h2>
                            </div>

                            <span className="self-start rounded-full border border-blue-100 bg-blue-50 px-3.5 py-1 text-xs font-bold text-blue-700 sm:self-auto">
                                Langkah {currentStep} dari 3
                            </span>
                        </div>

                        {/* Visual Step Progress Indicator */}
                        <div className="grid grid-cols-3 gap-2 pt-1 sm:gap-4">
                            {stepLabels.map((s) => {
                                const isCurrent = currentStep === s.step;
                                const isCompleted = currentStep > s.step;

                                return (
                                    <div
                                        key={s.step}
                                        className={cn(
                                            'flex items-center gap-2.5 rounded-xl border p-2 transition-all duration-200 sm:px-3 sm:py-2.5',
                                            isCurrent
                                                ? 'border-blue-600 bg-blue-50/60 shadow-2xs'
                                                : isCompleted
                                                  ? 'border-emerald-200 bg-emerald-50/40'
                                                  : 'border-slate-200/80 bg-slate-50/50 opacity-60',
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                'flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors sm:size-8',
                                                isCurrent
                                                    ? 'bg-blue-600 text-white'
                                                    : isCompleted
                                                      ? 'bg-emerald-600 text-white'
                                                      : 'bg-slate-200 text-slate-600',
                                            )}
                                        >
                                            {isCompleted ? (
                                                <Check className="size-4" />
                                            ) : (
                                                s.step
                                            )}
                                        </div>
                                        <div className="hidden min-w-0 sm:block">
                                            <p
                                                className={cn(
                                                    'truncate text-xs leading-tight font-bold',
                                                    isCurrent
                                                        ? 'text-blue-950'
                                                        : isCompleted
                                                          ? 'text-emerald-950'
                                                          : 'text-slate-600',
                                                )}
                                            >
                                                {s.title}
                                            </p>
                                            <p className="mt-0.5 truncate text-[0.6875rem] leading-none text-slate-400">
                                                {s.subtitle}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Error Alert */}
                    {errorMessage && (
                        <Alert className="my-3 shrink-0 rounded-xl border-rose-200 bg-rose-50/90 px-3.5 py-2 text-rose-900">
                            <AlertDescription className="text-xs leading-5 font-semibold text-rose-800 sm:text-sm">
                                {errorMessage}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Multi-Step Body */}
                    <form
                        onSubmit={handleSubmit}
                        onKeyDown={(e) => {
                            if (
                                e.key === 'Enter' &&
                                currentStep < 3 &&
                                e.target instanceof HTMLInputElement
                            ) {
                                e.preventDefault();
                            }
                        }}
                        className="flex flex-1 flex-col justify-between overflow-y-auto pt-4"
                    >
                        {/* STEP 1: Kampus & Data Akademik */}
                        {currentStep === 1 && (
                            <div className="space-y-5">
                                <div className="space-y-4 rounded-2xl border border-slate-200/90 bg-slate-50/50 p-5 shadow-2xs sm:p-6">
                                    <div className="flex items-center gap-2">
                                        <GraduationCap className="size-5 text-blue-600" />
                                        <div>
                                            <h3 className="text-base font-bold text-slate-900">
                                                Afiliasi Kampus & Identitas
                                                Akademik
                                            </h3>
                                            <p className="text-xs text-slate-500">
                                                Pilih institusi kampus Anda dan
                                                masukkan NIM untuk verifikasi
                                                data mahasiswa.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
                                        {/* Pilihan Kampus */}
                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor="institution_id"
                                                className="flex items-center justify-between text-sm font-semibold text-slate-800"
                                            >
                                                <span className="flex items-center gap-1.5">
                                                    <Building2 className="size-4 text-blue-600" />
                                                    Kampus / Institusi
                                                </span>
                                                <span className="text-xs font-bold text-rose-500">
                                                    *Wajib
                                                </span>
                                            </label>
                                            <Select
                                                value={institutionId}
                                                onValueChange={(val) => {
                                                    setInstitutionId(val);
                                                    setErrorMessage(null);
                                                }}
                                            >
                                                <SelectTrigger
                                                    id="institution_id"
                                                    className="h-11 w-full rounded-xl border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-900 shadow-2xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                                                >
                                                    <SelectValue placeholder="Pilih kampus" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-slate-200">
                                                    {institutionsList.map(
                                                        (inst) => (
                                                            <SelectItem
                                                                key={inst.id}
                                                                value={String(
                                                                    inst.id,
                                                                )}
                                                            >
                                                                {inst.name}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Input NIM */}
                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor="nim"
                                                className="flex items-center justify-between text-sm font-semibold text-slate-800"
                                            >
                                                <span className="flex items-center gap-1.5">
                                                    <CreditCard className="size-4 text-blue-600" />
                                                    Nomor Induk Mahasiswa (NIM)
                                                </span>
                                                <span className="text-xs font-bold text-rose-500">
                                                    *Wajib
                                                </span>
                                            </label>
                                            <Input
                                                id="nim"
                                                value={nim}
                                                onChange={(e) => {
                                                    setNim(e.target.value);
                                                    setErrorMessage(null);
                                                }}
                                                placeholder="Masukkan NIM terdaftar"
                                                className="h-11 w-full rounded-xl border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-900 shadow-2xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                                                required
                                            />
                                        </div>

                                        {/* Program Studi */}
                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor="study_program"
                                                className="flex items-center justify-between text-sm font-semibold text-slate-800"
                                            >
                                                <span className="flex items-center gap-1.5">
                                                    <GraduationCap className="size-4 text-blue-600" />
                                                    Program Studi
                                                </span>
                                                <span className="text-xs font-bold text-rose-500">
                                                    *Wajib
                                                </span>
                                            </label>
                                            <Input
                                                id="study_program"
                                                value={studyProgram}
                                                onChange={(e) => {
                                                    setStudyProgram(
                                                        e.target.value,
                                                    );
                                                    setErrorMessage(null);
                                                }}
                                                placeholder="Contoh: Teknik Informatika"
                                                className="h-11 w-full rounded-xl border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-900 shadow-2xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                                                required
                                            />
                                        </div>

                                        {/* Tahun Studi / Angkatan */}
                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor="study_year"
                                                className="flex items-center justify-between text-sm font-semibold text-slate-800"
                                            >
                                                <span className="flex items-center gap-1.5">
                                                    <User className="size-4 text-blue-600" />
                                                    Tahun Studi / Angkatan
                                                </span>
                                                <span className="text-xs font-bold text-rose-500">
                                                    *Wajib
                                                </span>
                                            </label>
                                            <Select
                                                value={studyYear}
                                                onValueChange={(val) => {
                                                    setStudyYear(val);
                                                    setErrorMessage(null);
                                                }}
                                            >
                                                <SelectTrigger
                                                    id="study_year"
                                                    className="h-11 w-full rounded-xl border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-900 shadow-2xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                                                >
                                                    <SelectValue placeholder="Pilih tahun studi" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-slate-200">
                                                    <SelectItem value="1">
                                                        Tahun ke-1 (Tingkat 1 /
                                                        Semester 1-2)
                                                    </SelectItem>
                                                    <SelectItem value="2">
                                                        Tahun ke-2 (Tingkat 2 /
                                                        Semester 3-4)
                                                    </SelectItem>
                                                    <SelectItem value="3">
                                                        Tahun ke-3 (Tingkat 3 /
                                                        Semester 5-6)
                                                    </SelectItem>
                                                    <SelectItem value="4">
                                                        Tahun ke-4 (Tingkat 4 /
                                                        Semester 7-8)
                                                    </SelectItem>
                                                    <SelectItem value="5">
                                                        Tahun ke-5+ (Tingkat
                                                        Akhir)
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: Keahlian & Minat */}
                        {currentStep === 2 && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                                    {/* Left: Bio Singkat */}
                                    <div className="space-y-3 rounded-2xl border border-slate-200/90 bg-slate-50/50 p-5 shadow-2xs">
                                        <div className="flex items-center gap-2">
                                            <User className="size-5 text-blue-600" />
                                            <div>
                                                <h3 className="text-base font-bold text-slate-900">
                                                    Bio & Fokus Minat
                                                </h3>
                                                <p className="text-xs text-slate-500">
                                                    Ceritakan ringkasan fokus
                                                    keahlian atau proyek yang
                                                    ingin Anda kembangkan.
                                                </p>
                                            </div>
                                        </div>

                                        <textarea
                                            id="bio"
                                            value={bio}
                                            onChange={(e) =>
                                                setBio(e.target.value)
                                            }
                                            rows={5}
                                            placeholder="Tuliskan ringkasan minat utama, keahlian khusus, atau proyek yang ingin kamu kembangkan bersama tim..."
                                            className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3.5 text-sm leading-relaxed text-slate-900 shadow-2xs transition-all placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                                        />
                                    </div>

                                    {/* Right: Skill & Kemahiran (LinkedIn-Style Search & Create) */}
                                    <div className="space-y-3 rounded-2xl border border-slate-200/90 bg-slate-50/50 p-5 shadow-2xs">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Briefcase className="size-5 text-blue-600" />
                                                <h3 className="text-base font-bold text-slate-900">
                                                    Skill & Kemahiran Utama
                                                </h3>
                                            </div>
                                            <span className="rounded-md bg-blue-100/80 px-2.5 py-0.5 text-xs font-bold text-blue-800">
                                                {skills.length} Terpilih
                                            </span>
                                        </div>

                                        {/* Search Input with Auto-Create */}
                                        <div className="relative">
                                            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
                                            <Input
                                                value={searchQuery}
                                                onChange={(e) =>
                                                    handleSearchChange(
                                                        e.target.value,
                                                    )
                                                }
                                                onFocus={() =>
                                                    setSearchOpen(true)
                                                }
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        if (
                                                            searchResults.length >
                                                            0
                                                        ) {
                                                            addSkill(
                                                                searchResults[0],
                                                            );
                                                        } else if (
                                                            searchQuery.trim()
                                                                .length > 0
                                                        ) {
                                                            handleCreateNewSkill(
                                                                searchQuery.trim(),
                                                            );
                                                        }
                                                    }
                                                }}
                                                placeholder="Ketik untuk mencari atau membuat skill baru..."
                                                className="h-11 w-full rounded-xl border-slate-200 bg-white pr-10 pl-10 text-sm shadow-2xs placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                                            />
                                            {(searchLoading ||
                                                isCreatingSkill) && (
                                                <span className="absolute top-1/2 right-3.5 -translate-y-1/2">
                                                    <Spinner className="size-4 text-blue-600" />
                                                </span>
                                            )}

                                            {searchOpen &&
                                                searchQuery.trim().length >
                                                    0 && (
                                                    <div className="absolute z-20 mt-1 max-h-52 w-full space-y-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                                                        {/* Existing matching results */}
                                                        {searchResults.map(
                                                            (item) => (
                                                                <button
                                                                    key={
                                                                        item.id
                                                                    }
                                                                    type="button"
                                                                    onClick={() =>
                                                                        addSkill(
                                                                            item,
                                                                        )
                                                                    }
                                                                    className="flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-slate-800 transition-colors hover:bg-blue-50 hover:text-blue-700"
                                                                >
                                                                    <span className="font-semibold">
                                                                        {
                                                                            item.name
                                                                        }
                                                                    </span>
                                                                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500 capitalize">
                                                                        {
                                                                            item.category
                                                                        }
                                                                    </span>
                                                                </button>
                                                            ),
                                                        )}

                                                        {/* LinkedIn-Style: Create New Skill Option if not exact match */}
                                                        {!hasExactMatch && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleCreateNewSkill(
                                                                        searchQuery.trim(),
                                                                    )
                                                                }
                                                                disabled={
                                                                    isCreatingSkill
                                                                }
                                                                className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-dashed border-blue-300 bg-blue-50/80 px-3 py-2.5 text-left text-sm text-blue-900 transition-colors hover:bg-blue-100"
                                                            >
                                                                <span className="flex items-center gap-2 truncate font-bold">
                                                                    <Plus className="size-4 shrink-0 text-blue-600" />
                                                                    <span>
                                                                        Buat
                                                                        skill
                                                                        baru:{' '}
                                                                        <strong className="underline">
                                                                            "
                                                                            {searchQuery.trim()}
                                                                            "
                                                                        </strong>
                                                                    </span>
                                                                </span>
                                                                <span className="shrink-0 rounded bg-blue-600 px-2 py-0.5 text-[0.6875rem] font-bold text-white uppercase">
                                                                    + Tambah
                                                                </span>
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                        </div>

                                        {/* Selected Skills List */}
                                        {skills.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/70 px-4 py-6 text-center">
                                                <Briefcase className="mb-1 size-5 text-slate-300" />
                                                <p className="text-sm font-semibold text-slate-700">
                                                    Belum ada skill yang
                                                    ditambahkan
                                                </p>
                                                <p className="mt-0.5 text-xs text-slate-500">
                                                    Ketik nama skill di atas
                                                    untuk mencari atau membuat
                                                    skill baru.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="max-h-40 space-y-2 overflow-y-auto pr-0.5">
                                                {skills.map((skill) => (
                                                    <div
                                                        key={skill.taxonomy_id}
                                                        className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-white px-3 py-2 shadow-2xs"
                                                    >
                                                        <span className="truncate text-sm font-bold text-slate-900">
                                                            {skill.name}
                                                        </span>

                                                        <div className="flex shrink-0 items-center gap-2">
                                                            <Select
                                                                value={
                                                                    skill.proficiency
                                                                }
                                                                onValueChange={(
                                                                    val: Proficiency,
                                                                ) =>
                                                                    updateSkillProficiency(
                                                                        skill.taxonomy_id,
                                                                        val,
                                                                    )
                                                                }
                                                            >
                                                                <SelectTrigger className="h-8 w-32 rounded-lg border-slate-200 text-xs font-semibold text-slate-700">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent className="rounded-lg border-slate-200">
                                                                    <SelectItem value="beginner">
                                                                        {
                                                                            proficiencyLabels.beginner
                                                                        }
                                                                    </SelectItem>
                                                                    <SelectItem value="intermediate">
                                                                        {
                                                                            proficiencyLabels.intermediate
                                                                        }
                                                                    </SelectItem>
                                                                    <SelectItem value="advanced">
                                                                        {
                                                                            proficiencyLabels.advanced
                                                                        }
                                                                    </SelectItem>
                                                                    <SelectItem value="expert">
                                                                        {
                                                                            proficiencyLabels.expert
                                                                        }
                                                                    </SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    removeSkill(
                                                                        skill.taxonomy_id,
                                                                    )
                                                                }
                                                                className="cursor-pointer rounded p-1 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                                                                aria-label={`Hapus skill ${skill.name}`}
                                                            >
                                                                <Trash2 className="size-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: Jadwal & Visibilitas Portofolio */}
                        {currentStep === 3 && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                                    {/* Left: Ketersediaan Waktu */}
                                    <div className="space-y-4 rounded-2xl border border-slate-200/90 bg-slate-50/50 p-5 shadow-2xs">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="size-5 text-blue-600" />
                                                <h3 className="text-base font-bold text-slate-900">
                                                    Ketersediaan Waktu
                                                    Kolaborasi
                                                </h3>
                                            </div>
                                            <p className="mt-1 text-xs text-slate-500">
                                                Pilih hari dan jam aktif Anda
                                                untuk rekomendasi proyek tim
                                                yang cocok.
                                            </p>
                                        </div>

                                        {/* Day buttons */}
                                        <div className="flex w-full gap-1.5 pt-1">
                                            {[
                                                { day: 1, label: 'Sen' },
                                                { day: 2, label: 'Sel' },
                                                { day: 3, label: 'Rab' },
                                                { day: 4, label: 'Kam' },
                                                { day: 5, label: 'Jum' },
                                                { day: 6, label: 'Sab' },
                                                { day: 0, label: 'Min' },
                                            ].map((d) => {
                                                const isSelected =
                                                    availabilityDays.includes(
                                                        d.day,
                                                    );

                                                return (
                                                    <button
                                                        key={d.day}
                                                        type="button"
                                                        onClick={() =>
                                                            toggleDay(d.day)
                                                        }
                                                        className={cn(
                                                            'flex h-9 flex-1 cursor-pointer items-center justify-center rounded-xl text-xs font-bold transition-all duration-150 sm:text-sm',
                                                            isSelected
                                                                ? 'border border-blue-600 bg-blue-600 text-white shadow-xs'
                                                                : 'border border-slate-200 bg-white text-slate-700 shadow-2xs hover:border-slate-300 hover:bg-slate-50',
                                                        )}
                                                    >
                                                        {d.label}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Time range */}
                                        <div className="flex items-center gap-2.5 pt-1">
                                            <span className="text-sm font-semibold text-slate-600">
                                                Pukul:
                                            </span>
                                            <Input
                                                type="time"
                                                value={startsAt}
                                                onChange={(e) =>
                                                    setStartsAt(e.target.value)
                                                }
                                                className="h-10 flex-1 rounded-xl border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 shadow-2xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                                            />
                                            <span className="text-sm font-medium text-slate-400">
                                                s/d
                                            </span>
                                            <Input
                                                type="time"
                                                value={endsAt}
                                                onChange={(e) =>
                                                    setEndsAt(e.target.value)
                                                }
                                                className="h-10 flex-1 rounded-xl border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 shadow-2xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                                            />
                                            <span className="rounded-lg bg-slate-100 px-2 py-1.5 text-xs font-bold text-slate-600">
                                                WIB
                                            </span>
                                        </div>
                                    </div>

                                    {/* Right: Visibilitas Checkboxes */}
                                    <div className="space-y-4 rounded-2xl border border-slate-200/90 bg-slate-50/50 p-5 shadow-2xs">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <Globe className="size-5 text-blue-600" />
                                                <h3 className="text-base font-bold text-slate-900">
                                                    Izin Akses & Visibilitas
                                                    Portofolio
                                                </h3>
                                            </div>
                                            <p className="mt-1 text-xs text-slate-500">
                                                Pilih target entitas yang
                                                diizinkan melihat portofolio
                                                terverifikasi Anda.
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 pt-1 sm:gap-2.5">
                                            {/* Checkbox 1: Kampus */}
                                            <label
                                                className={cn(
                                                    'flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-3 text-sm shadow-2xs transition-all duration-150 select-none',
                                                    allowCampus
                                                        ? 'border-blue-500 bg-blue-50/80 font-bold text-blue-950'
                                                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
                                                )}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={allowCampus}
                                                    onChange={(e) =>
                                                        setAllowCampus(
                                                            e.target.checked,
                                                        )
                                                    }
                                                    className="size-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <div className="min-w-0">
                                                    <span className="block truncate text-sm font-bold">
                                                        Kampus
                                                    </span>
                                                    <span className="mt-0.5 block text-[0.7rem] leading-none font-normal text-slate-500">
                                                        Internal
                                                    </span>
                                                </div>
                                            </label>

                                            {/* Checkbox 2: Perekrut */}
                                            <label
                                                className={cn(
                                                    'flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-3 text-sm shadow-2xs transition-all duration-150 select-none',
                                                    allowRecruiter
                                                        ? 'border-blue-500 bg-blue-50/80 font-bold text-blue-950'
                                                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
                                                )}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={allowRecruiter}
                                                    onChange={(e) =>
                                                        setAllowRecruiter(
                                                            e.target.checked,
                                                        )
                                                    }
                                                    className="size-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <div className="min-w-0">
                                                    <span className="block truncate text-sm font-bold">
                                                        Perekrut
                                                    </span>
                                                    <span className="mt-0.5 block text-[0.7rem] leading-none font-normal text-slate-500">
                                                        Industri
                                                    </span>
                                                </div>
                                            </label>

                                            {/* Checkbox 3: Publik */}
                                            <label
                                                className={cn(
                                                    'flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-3 text-sm shadow-2xs transition-all duration-150 select-none',
                                                    allowPublic
                                                        ? 'border-blue-500 bg-blue-50/80 font-bold text-blue-950'
                                                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
                                                )}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={allowPublic}
                                                    onChange={(e) =>
                                                        setAllowPublic(
                                                            e.target.checked,
                                                        )
                                                    }
                                                    className="size-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <div className="min-w-0">
                                                    <span className="block truncate text-sm font-bold">
                                                        Publik
                                                    </span>
                                                    <span className="mt-0.5 block text-[0.7rem] leading-none font-normal text-slate-500">
                                                        Tautan luar
                                                    </span>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Footer Navigation Bar */}
                        <div className="mt-4 flex shrink-0 items-center justify-between gap-3 border-t border-slate-100 pt-5">
                            {currentStep > 1 ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handlePrevStep}
                                    className="h-11 cursor-pointer rounded-xl border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-2xs hover:bg-slate-50"
                                >
                                    <ArrowLeft className="mr-1.5 size-4" />
                                    Kembali
                                </Button>
                            ) : (
                                <div className="flex hidden items-center gap-1.5 text-xs text-slate-500 sm:flex">
                                    <Info className="size-4 shrink-0 text-slate-400" />
                                    <span>
                                        Lengkapi data akademik untuk
                                        melanjutkan.
                                    </span>
                                </div>
                            )}

                            {currentStep < 3 ? (
                                <Button
                                    type="button"
                                    onClick={handleNextStep}
                                    className="ml-auto h-11 min-w-[160px] cursor-pointer rounded-xl bg-blue-600 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition-all hover:bg-blue-700"
                                >
                                    Lanjutkan
                                    <ArrowRight className="ml-1.5 size-4" />
                                </Button>
                            ) : (
                                <Button
                                    type="submit"
                                    size="lg"
                                    disabled={form.processing}
                                    className="ml-auto h-11 min-w-[160px] cursor-pointer rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg disabled:cursor-not-allowed"
                                >
                                    {form.processing ? (
                                        <>
                                            <Spinner className="mr-1.5 size-4 text-white" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="mr-1.5 size-4" />
                                            Simpan Profil
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </form>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
