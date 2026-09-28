import { router, useHttp, usePage } from '@inertiajs/react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
    ArrowLeft,
    ArrowRight,
    Check,
    CheckCheck,
    Clock3,
    GraduationCap,
    LockKeyhole,
    Plus,
    RefreshCw,
    Search,
    ShieldCheck,
    Trash2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import Mascot from '@/components/mascot';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
    index as searchTaxonomy,
    store as createTaxonomy,
} from '@/routes/skills/taxonomy';
import {
    show as showProfile,
    store as storeProfile,
    update as updateProfile,
} from '@/routes/student-profiles';
import { update as updateAvailability } from '@/routes/student-profiles/availability';
import { update as updateVisibility } from '@/routes/student-profiles/visibility';
import type { Auth, ShellContext } from '@/types';

type Proficiency = 'beginner' | 'intermediate' | 'advanced' | 'expert';
type Visibility = 'private' | 'institution' | 'recruiter' | 'public';
type Taxonomy = {
    id: number;
    name: string;
    category: string;
    description?: string | null;
};
type DraftSkill = {
    taxonomy_id: number;
    name: string;
    proficiency: Proficiency;
};
type Availability = {
    day_of_week: number;
    starts_at: string;
    ends_at: string;
    timezone: string;
};
type ProfilePayload = {
    institution_id: number;
    study_program: string;
    study_year: number;
    bio: string;
    skills: {
        taxonomy_id: number;
        proficiency: Proficiency;
        evidence_metadata: Record<string, string | number | boolean | null>[];
    }[];
    availability_windows: Availability[];
    portfolio_visibility: Visibility;
    recruiter_discoverable: boolean;
};
type ProfileResponse = {
    data: {
        id: number;
        skills?: DraftSkill[];
        availability_windows?: Availability[];
        portfolio_visibility?: Visibility;
        recruiter_discoverable?: boolean;
    };
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
type OnboardingProps = {
    auth: Auth;
    shell: ShellContext;
    onboarding?: OnboardingState | null;
    [key: string]: unknown;
};
type Phase =
    | 'editing'
    | 'affiliation'
    | 'pending'
    | 'pending-check'
    | 'profile'
    | 'availability'
    | 'visibility'
    | 'refresh'
    | 'complete';
type SaveProgress = {
    key: string;
    institutionId: number;
    profileId: number | null;
    finished: Set<string>;
};

const steps = ['Kampusmu', 'Keahlianmu', 'Cara berkolaborasi'];
const proficiencyLabels: Record<Proficiency, string> = {
    beginner: 'Pemula',
    intermediate: 'Menengah',
    advanced: 'Lanjutan',
    expert: 'Mahir',
};
const days = [
    { value: 1, label: 'Sen', full: 'Senin' },
    { value: 2, label: 'Sel', full: 'Selasa' },
    { value: 3, label: 'Rab', full: 'Rabu' },
    { value: 4, label: 'Kam', full: 'Kamis' },
    { value: 5, label: 'Jum', full: 'Jumat' },
    { value: 6, label: 'Sab', full: 'Sabtu' },
    { value: 0, label: 'Min', full: 'Minggu' },
];
const visibilityChoices: {
    value: Visibility;
    label: string;
    detail: string;
}[] = [
    {
        value: 'private',
        label: 'Hanya saya',
        detail: 'Simpan portofolio untuk dirimu dahulu.',
    },
    {
        value: 'institution',
        label: 'Kampus',
        detail: 'Bagikan dalam lingkup kampusmu.',
    },
    {
        value: 'recruiter',
        label: 'Recruiter',
        detail: 'Izinkan akses melalui Talent Portal.',
    },
    {
        value: 'public',
        label: 'Publik',
        detail: 'Portofolio dapat dibuka melalui tautan publik.',
    },
];
const phaseLabels: Partial<Record<Phase, string>> = {
    affiliation: 'Memeriksa afiliasi...',
    'pending-check': 'Memeriksa status afiliasi...',
    profile: 'Menyimpan profil...',
    availability: 'Menyimpan jadwal...',
    visibility: 'Menyimpan izin akses...',
    refresh: 'Memeriksa hasil...',
};

function timezoneName(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jakarta';
}

function firstError(errors: Record<string, unknown>, fallback: string): string {
    const error = Object.values(errors)[0];

    return typeof error === 'string'
        ? error
        : Array.isArray(error) && typeof error[0] === 'string'
          ? error[0]
          : fallback;
}

function refreshOnboarding(): Promise<OnboardingState | null> {
    return new Promise((resolve, reject) => {
        router.reload({
            only: ['onboarding', 'shell'],
            onSuccess: (page) =>
                resolve(
                    (page.props.onboarding as OnboardingState | undefined) ??
                        null,
                ),
            onError: () =>
                reject(new Error('Status belum dapat diperbarui. Coba lagi.')),
            onHttpException: () => {
                reject(new Error('Status belum dapat diperbarui. Coba lagi.'));

                return false;
            },
            onNetworkError: () => {
                reject(
                    new Error(
                        'Koneksi terputus. Data isianmu tetap tersedia di halaman ini.',
                    ),
                );

                return false;
            },
            onCancel: () =>
                reject(new Error('Pemeriksaan dibatalkan. Coba lagi.')),
        });
    });
}

export function OnboardingModal() {
    const { onboarding } = usePage<OnboardingProps>().props;
    const [step, setStep] = useState(0);
    const [institutionId, setInstitutionId] = useState(
        onboarding?.institutionId ? String(onboarding.institutionId) : '',
    );
    const [nim, setNim] = useState(onboarding?.nim ?? '');
    const [studyProgram, setStudyProgram] = useState(
        onboarding?.studyProgram ?? '',
    );
    const [studyYear, setStudyYear] = useState(
        String(onboarding?.studyYear || 1),
    );
    const [bio, setBio] = useState(onboarding?.bio ?? '');
    const [skills, setSkills] = useState<DraftSkill[]>([]);
    const [availabilityDays, setAvailabilityDays] = useState<number[]>([]);
    const [startsAt, setStartsAt] = useState('09:00');
    const [endsAt, setEndsAt] = useState('17:00');
    const [timezone] = useState(timezoneName);
    const [visibility, setVisibility] = useState<Visibility>('private');
    const [discoverable, setDiscoverable] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Taxonomy[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [phase, setPhase] = useState<Phase>('editing');
    const [holdOpen, setHoldOpen] = useState(false);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const errorRef = useRef<HTMLDivElement>(null);
    const draftTouched = useRef(false);
    const savingRef = useRef(false);
    const verifiedAffiliation = useRef<string | null>(
        onboarding?.membershipStatus === 'verified' &&
            onboarding.institutionId &&
            onboarding.nim
            ? `${onboarding.institutionId}:${onboarding.nim.trim().toLowerCase()}`
            : null,
    );
    const pendingAffiliation = useRef<string | null>(
        onboarding?.membershipStatus === 'pending' &&
            onboarding.institutionId &&
            onboarding.nim
            ? `${onboarding.institutionId}:${onboarding.nim.trim().toLowerCase()}`
            : null,
    );
    const saveProgress = useRef<SaveProgress | null>(null);
    const needsReconciliation = useRef(false);
    const busy = Boolean(phaseLabels[phase]);
    const institutions = onboarding?.institutions ?? [];

    const profileForm = useHttp<ProfilePayload, ProfileResponse>({
        institution_id: 0,
        study_program: '',
        study_year: 1,
        bio: '',
        skills: [],
        availability_windows: [],
        portfolio_visibility: 'private',
        recruiter_discoverable: false,
    });
    const availabilityForm = useHttp<
        { windows: Availability[]; timezone: string },
        ProfileResponse
    >({ windows: [], timezone });
    const visibilityForm = useHttp<
        { portfolio_visibility: Visibility; recruiter_discoverable: boolean },
        ProfileResponse
    >({ portfolio_visibility: 'private', recruiter_discoverable: false });
    const skillForm = useHttp<
        { name: string; category: string },
        { data: Taxonomy }
    >({ name: '', category: 'software' });

    useEffect(() => {
        const query = searchQuery.trim();

        if (!query) {
            return;
        }

        const controller = new AbortController();
        const timer = window.setTimeout(async () => {
            setSearchLoading(true);
            setSearchError(null);

            try {
                const response = await fetch(
                    searchTaxonomy.url({ query: { query } }),
                    {
                        signal: controller.signal,
                        headers: { Accept: 'application/json' },
                    },
                );

                if (!response.ok) {
                    throw new Error(
                        'Keahlian belum dapat dimuat. Coba ketik kembali.',
                    );
                }

                const result = (await response.json()) as { data: Taxonomy[] };

                if (!controller.signal.aborted) {
                    setSearchResults(result.data);
                }
            } catch (failure) {
                if (!controller.signal.aborted) {
                    setSearchError(
                        failure instanceof Error
                            ? failure.message
                            : 'Keahlian belum dapat dimuat.',
                    );
                }
            } finally {
                if (!controller.signal.aborted) {
                    setSearchLoading(false);
                }
            }
        }, 180);

        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [searchQuery]);

    useEffect(() => {
        if (!onboarding?.required || !onboarding.profileId) {
            return;
        }

        const controller = new AbortController();
        fetch(showProfile.url(onboarding.profileId), {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
        })
            .then(async (response) => {
                if (!response.ok) {
                    return;
                }

                const result = (await response.json()) as ProfileResponse;

                if (controller.signal.aborted || draftTouched.current) {
                    return;
                }

                setSkills(result.data.skills ?? []);
                const windows = result.data.availability_windows ?? [];
                setAvailabilityDays(
                    windows.map((window) => window.day_of_week),
                );

                if (windows[0]) {
                    setStartsAt(windows[0].starts_at.slice(0, 5));
                    setEndsAt(windows[0].ends_at.slice(0, 5));
                }

                setVisibility(result.data.portfolio_visibility ?? 'private');
                setDiscoverable(result.data.recruiter_discoverable ?? false);
            })
            .catch(() => {
                /* The user's draft remains editable if the existing profile cannot be read. */
            });

        return () => controller.abort();
    }, [onboarding?.profileId, onboarding?.required]);

    if (phase === 'complete' || (!onboarding?.required && !holdOpen)) {
        return null;
    }

    function moveTo(next: number) {
        setStep(next);
        setError(null);
        window.requestAnimationFrame(() => titleRef.current?.focus());
    }

    function showError(message: string) {
        setError(message);
        window.requestAnimationFrame(() => errorRef.current?.focus());
    }

    function validateStep(): boolean {
        if (step === 0) {
            if (
                !institutionId ||
                !institutions.some(
                    (institution) => String(institution.id) === institutionId,
                )
            ) {
                showError('Pilih kampus yang tersedia untuk melanjutkan.');

                return false;
            }

            if (!nim.trim() || !studyProgram.trim()) {
                showError('Lengkapi NIM dan program studimu.');

                return false;
            }
        }

        if (step === 1 && skills.length === 0) {
            showError('Tambahkan minimal satu keahlianmu.');

            return false;
        }

        return true;
    }

    function addSkill(item: Taxonomy) {
        draftTouched.current = true;
        setSkills((current) =>
            current.some((skill) => skill.taxonomy_id === item.id)
                ? current
                : [
                      ...current,
                      {
                          taxonomy_id: item.id,
                          name: item.name,
                          proficiency: 'intermediate',
                      },
                  ],
        );
        setSearchQuery('');
        setSearchResults([]);
        setSearchLoading(false);
        setSearchError(null);
    }

    async function createSkill() {
        if (!searchQuery.trim() || skillForm.processing) {
            return;
        }

        skillForm.transform(() => ({
            name: searchQuery.trim(),
            category: 'software',
        }));
        let message = 'Keahlian belum dapat ditambahkan. Coba lagi.';

        try {
            const result = await skillForm.post(createTaxonomy.url(), {
                onError: (errors) => {
                    message = firstError(errors, message);
                },
                onHttpException: () => false,
                onNetworkError: () => false,
            });
            addSkill(result.data);
        } catch {
            setSearchError(message);
        }
    }

    async function checkPendingStatus() {
        if (savingRef.current) {
            return;
        }

        savingRef.current = true;
        setPhase('pending-check');
        setError(null);

        try {
            const latest = await refreshOnboarding();
            const affiliationKey = `${institutionId}:${nim.trim().toLowerCase()}`;
            const matches =
                latest?.institutionId === Number(institutionId) &&
                latest.nim?.trim().toLowerCase() === nim.trim().toLowerCase();

            if (matches && latest.membershipStatus === 'verified') {
                pendingAffiliation.current = null;
                verifiedAffiliation.current = affiliationKey;
                setPhase('editing');
            } else if (matches && latest.membershipStatus === 'pending') {
                pendingAffiliation.current = affiliationKey;
                setPhase('pending');
            } else {
                pendingAffiliation.current = null;
                setPhase('editing');
                showError(
                    'Status afiliasi untuk isian ini belum dapat dipastikan. Periksa kembali kampus dan NIM sebelum mengirim permintaan.',
                );
            }
        } catch (failure) {
            setPhase('pending');
            showError(
                failure instanceof Error
                    ? failure.message
                    : 'Status belum dapat dimuat.',
            );
        } finally {
            savingRef.current = false;
        }
    }

    async function save(event: FormEvent) {
        event.preventDefault();

        if (savingRef.current || skillForm.processing) {
            return;
        }

        if (!validateStep()) {
            return;
        }

        if (step < 2) {
            moveTo(step + 1);

            return;
        }

        if (!availabilityDays.length) {
            showError('Pilih minimal satu hari untuk berkolaborasi.');

            return;
        }

        if (endsAt <= startsAt) {
            showError('Jam selesai harus setelah jam mulai.');

            return;
        }

        savingRef.current = true;
        setHoldOpen(true);
        setError(null);
        const selectedInstitution = Number(institutionId);
        const affiliationKey = `${institutionId}:${nim.trim().toLowerCase()}`;
        const payload: ProfilePayload = {
            institution_id: selectedInstitution,
            study_program: studyProgram.trim(),
            study_year: Number(studyYear),
            bio: bio.trim(),
            skills: skills.map((skill) => ({
                taxonomy_id: skill.taxonomy_id,
                proficiency: skill.proficiency,
                evidence_metadata: [],
            })),
            availability_windows: availabilityDays.map((day) => ({
                day_of_week: day,
                starts_at: startsAt,
                ends_at: endsAt,
                timezone,
            })),
            portfolio_visibility: visibility,
            recruiter_discoverable:
                (visibility === 'recruiter' || visibility === 'public') &&
                discoverable,
        };
        let latest = onboarding ?? null;
        let failureMessage =
            'Profil belum selesai disimpan. Data isianmu tetap tersedia. Coba lagi.';

        try {
            if (verifiedAffiliation.current !== affiliationKey) {
                if (pendingAffiliation.current === affiliationKey) {
                    setPhase('refresh');
                    latest = await refreshOnboarding();
                } else {
                    setPhase('affiliation');
                    latest = await new Promise<OnboardingState | null>(
                        (resolve, reject) => {
                            router.post(
                                storeAffiliation.url(),
                                {
                                    institution_id: selectedInstitution,
                                    nim: nim.trim(),
                                },
                                {
                                    preserveState: true,
                                    preserveScroll: true,
                                    onSuccess: (page) =>
                                        resolve(
                                            (page.props.onboarding as
                                                OnboardingState | undefined) ??
                                                null,
                                        ),
                                    onError: (errors) =>
                                        reject(
                                            new Error(
                                                firstError(
                                                    errors,
                                                    'Afiliasi belum dapat diproses. Periksa data kampusmu.',
                                                ),
                                            ),
                                        ),
                                    onHttpException: () => {
                                        reject(
                                            new Error(
                                                'Afiliasi belum dapat diproses. Periksa akses akunmu dan coba lagi.',
                                            ),
                                        );

                                        return false;
                                    },
                                    onNetworkError: () => {
                                        reject(
                                            new Error(
                                                'Koneksi terputus. Periksa koneksi lalu coba lagi.',
                                            ),
                                        );

                                        return false;
                                    },
                                    onCancel: () =>
                                        reject(
                                            new Error(
                                                'Penyimpanan dibatalkan. Isianmu tetap tersedia.',
                                            ),
                                        ),
                                },
                            );
                        },
                    );
                }

                const matches =
                    latest?.institutionId === selectedInstitution &&
                    latest.nim?.trim().toLowerCase() ===
                        nim.trim().toLowerCase();

                if (!matches) {
                    throw new Error(
                        'Afiliasi belum dapat dikonfirmasi. Periksa nomor WhatsApp terverifikasi dan data kampusmu.',
                    );
                }

                if (latest?.membershipStatus === 'pending') {
                    pendingAffiliation.current = affiliationKey;
                    setPhase('pending');

                    return;
                }

                if (latest?.membershipStatus !== 'verified') {
                    throw new Error(
                        'Afiliasi belum terverifikasi. Periksa kembali akses kampusmu.',
                    );
                }

                pendingAffiliation.current = null;
                verifiedAffiliation.current = affiliationKey;
            }

            if (needsReconciliation.current) {
                setPhase('refresh');
                latest = await refreshOnboarding();
                needsReconciliation.current = false;
            }

            const key = JSON.stringify(payload);

            if (saveProgress.current?.key !== key) {
                saveProgress.current = {
                    key,
                    institutionId: selectedInstitution,
                    profileId:
                        saveProgress.current?.institutionId ===
                        selectedInstitution
                            ? saveProgress.current.profileId
                            : latest?.institutionId === selectedInstitution
                              ? latest.profileId
                              : null,
                    finished: new Set(),
                };
            }

            const progress = saveProgress.current;

            if (
                !progress.profileId &&
                latest?.institutionId === selectedInstitution
            ) {
                progress.profileId = latest.profileId;
            }

            const options = {
                onError: (errors: Record<string, unknown>) => {
                    failureMessage = firstError(errors, failureMessage);
                },
                onHttpException: () => false,
                onNetworkError: () => false,
            };

            if (!progress.finished.has('profile')) {
                setPhase('profile');
                profileForm.transform(() => payload);
                let response: ProfileResponse;

                if (progress.profileId) {
                    response = await profileForm.patch(
                        updateProfile.url(progress.profileId),
                        options,
                    );
                } else {
                    needsReconciliation.current = true;
                    response = await profileForm.post(
                        storeProfile.url(),
                        options,
                    );
                    needsReconciliation.current = false;
                    progress.finished.add('availability');
                    progress.finished.add('visibility');
                }

                progress.profileId = response.data.id;
                progress.finished.add('profile');
            }

            if (!progress.profileId) {
                throw new Error('Profil belum dapat dikonfirmasi. Coba lagi.');
            }

            if (!progress.finished.has('availability')) {
                setPhase('availability');
                availabilityForm.transform(() => ({
                    windows: payload.availability_windows,
                    timezone,
                }));
                await availabilityForm.put(
                    updateAvailability.url(progress.profileId),
                    options,
                );
                progress.finished.add('availability');
            }

            if (!progress.finished.has('visibility')) {
                setPhase('visibility');
                visibilityForm.transform(() => ({
                    portfolio_visibility: payload.portfolio_visibility,
                    recruiter_discoverable: payload.recruiter_discoverable,
                }));
                await visibilityForm.patch(
                    updateVisibility.url(progress.profileId),
                    options,
                );
                progress.finished.add('visibility');
            }

            setPhase('refresh');
            const confirmed = await refreshOnboarding();

            if (
                confirmed?.institutionId !== selectedInstitution ||
                confirmed.required
            ) {
                throw new Error(
                    'Data tersimpan, tetapi profil belum dinyatakan lengkap. Periksa kembali isianmu.',
                );
            }

            setHoldOpen(false);
            setPhase('complete');
        } catch (failure) {
            setPhase('editing');
            const knownMessage =
                failure instanceof Error && failure.constructor === Error
                    ? failure.message
                    : failureMessage;
            showError(knownMessage);
        } finally {
            savingRef.current = false;
        }
    }

    return (
        <DialogPrimitive.Root open>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm" />
                <DialogPrimitive.Content
                    onEscapeKeyDown={(event) => event.preventDefault()}
                    onPointerDownOutside={(event) => event.preventDefault()}
                    className="fixed top-1/2 left-1/2 z-50 flex h-[94svh] max-h-[94svh] w-[calc(100%-1.5rem)] max-w-5xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[2rem] border border-white bg-white shadow-2xl focus:outline-none lg:flex-row"
                >
                    <div
                        aria-hidden="true"
                        className="relative h-16 shrink-0 bg-gradient-to-r from-[#e7f4ff] via-[#d7efff] to-[#b9e6ff] lg:hidden"
                    >
                        <Mascot
                            pose={
                                phase === 'pending' || phase === 'pending-check'
                                    ? 'peek'
                                    : 'guide'
                            }
                            className="absolute -top-5 right-5 w-28"
                        />
                    </div>
                    <aside className="relative hidden w-72 shrink-0 flex-col justify-between bg-[#e7f4ff] p-7 lg:flex">
                        <div>
                            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-blue-800">
                                <GraduationCap
                                    aria-hidden="true"
                                    className="size-4"
                                />
                                Kenalan dulu, yuk.
                            </span>
                            <h2 className="mt-6 text-3xl leading-tight font-bold tracking-tight text-slate-950">
                                Cerita hebat dimulai dari{' '}
                                <span className="text-blue-600">dirimu.</span>
                            </h2>
                            <p className="mt-4 text-sm leading-6 text-slate-600">
                                Bantu SATU mengenali keahlian dan waktu luangmu
                                untuk kolaborasi yang lebih cocok.
                            </p>
                        </div>
                        <div className="relative mt-24 h-48 rounded-[1.75rem] bg-gradient-to-br from-sky-200 to-blue-200">
                            <Mascot
                                pose={
                                    phase === 'pending' ||
                                    phase === 'pending-check'
                                        ? 'peek'
                                        : 'guide'
                                }
                                interactive
                                className="absolute -top-16 left-1/2 w-64 -translate-x-1/2"
                            />
                        </div>
                        <p className="mt-7 flex items-start gap-2 text-xs leading-5 text-slate-600">
                            <LockKeyhole
                                aria-hidden="true"
                                className="mt-0.5 size-4 shrink-0 text-blue-600"
                            />
                            Portofoliomu privat sampai kamu memilih untuk
                            membagikannya.
                        </p>
                    </aside>
                    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                        <header className="shrink-0 px-5 pt-6 pb-5 sm:px-8">
                            <p className="mb-2 text-xs font-bold tracking-[0.12em] text-blue-700 uppercase">
                                Ruang untuk bertumbuh
                            </p>
                            <DialogPrimitive.Title
                                ref={titleRef}
                                tabIndex={-1}
                                className="text-2xl font-bold tracking-tight text-slate-950 outline-none sm:text-3xl"
                            >
                                {phase === 'pending' ||
                                phase === 'pending-check'
                                    ? 'Kampus sedang meninjau.'
                                    : steps[step]}
                            </DialogPrimitive.Title>
                            <DialogPrimitive.Description className="mt-2 text-sm leading-6 text-slate-600">
                                {phase === 'pending' ||
                                phase === 'pending-check'
                                    ? 'Permintaan afiliasimu sudah diterima. Profil belum disimpan hingga afiliasi terverifikasi.'
                                    : 'Lengkapi tiga langkah untuk menyiapkan ruang kolaborasimu.'}
                            </DialogPrimitive.Description>
                            <ol
                                aria-label="Tahapan profil"
                                className="mt-5 flex gap-2"
                            >
                                {steps.map((label, index) => (
                                    <li
                                        key={label}
                                        aria-current={
                                            step === index ? 'step' : undefined
                                        }
                                        className="flex min-w-0 flex-1 items-center gap-2"
                                    >
                                        <span
                                            className={cn(
                                                'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                                                index <= step
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-slate-100 text-slate-600',
                                            )}
                                        >
                                            {index < step ? (
                                                <Check
                                                    aria-hidden="true"
                                                    className="size-4"
                                                />
                                            ) : (
                                                index + 1
                                            )}
                                        </span>
                                        <span
                                            className={cn(
                                                'hidden text-xs font-semibold sm:block',
                                                index === step
                                                    ? 'text-blue-800'
                                                    : 'text-slate-600',
                                            )}
                                        >
                                            {label}
                                        </span>
                                    </li>
                                ))}
                            </ol>
                        </header>
                        <div className="min-h-0 overflow-y-auto px-5 pb-6 sm:px-8">
                            {error && (
                                <div
                                    ref={errorRef}
                                    tabIndex={-1}
                                    role="alert"
                                    className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800"
                                >
                                    {error}
                                </div>
                            )}
                            {phase === 'pending' ||
                            phase === 'pending-check' ? (
                                <div className="space-y-5 py-3">
                                    <div
                                        role="status"
                                        aria-live="polite"
                                        className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950"
                                    >
                                        <Clock3
                                            aria-hidden="true"
                                            className="mt-1 size-5 shrink-0"
                                        />
                                        <p className="text-sm leading-6">
                                            Data kampusmu memerlukan peninjauan.
                                            Isian profil masih tersimpan di
                                            halaman ini. Kamu dapat memeriksa
                                            status tanpa mengirim permintaan
                                            baru.
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        className="w-full cursor-pointer"
                                        onClick={checkPendingStatus}
                                        disabled={phase === 'pending-check'}
                                    >
                                        {phase === 'pending-check' ? (
                                            <Spinner />
                                        ) : (
                                            <RefreshCw
                                                aria-hidden="true"
                                                className="size-4"
                                            />
                                        )}
                                        {phase === 'pending-check'
                                            ? 'Memeriksa status afiliasi...'
                                            : 'Periksa status afiliasi'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full cursor-pointer"
                                        onClick={() => setPhase('editing')}
                                        disabled={phase === 'pending-check'}
                                    >
                                        Periksa kembali isian
                                    </Button>
                                </div>
                            ) : (
                                <form
                                    onSubmit={save}
                                    onChange={() => {
                                        draftTouched.current = true;
                                    }}
                                >
                                    <fieldset
                                        disabled={busy}
                                        className="space-y-5 disabled:opacity-70"
                                    >
                                        <legend className="sr-only">
                                            {steps[step]}
                                        </legend>
                                        {step === 0 && (
                                            <div className="grid gap-5 sm:grid-cols-2">
                                                <div className="grid gap-2 sm:col-span-2">
                                                    <Label htmlFor="institution_id">
                                                        Kampus
                                                    </Label>
                                                    <Select
                                                        value={institutionId}
                                                        onValueChange={(
                                                            value,
                                                        ) => {
                                                            draftTouched.current = true;
                                                            setInstitutionId(
                                                                value,
                                                            );
                                                        }}
                                                        disabled={
                                                            busy ||
                                                            institutions.length ===
                                                                0
                                                        }
                                                    >
                                                        <SelectTrigger
                                                            id="institution_id"
                                                            className="h-12 w-full rounded-xl"
                                                        >
                                                            <SelectValue placeholder="Pilih kampusmu" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {institutions.map(
                                                                (
                                                                    institution,
                                                                ) => (
                                                                    <SelectItem
                                                                        key={
                                                                            institution.id
                                                                        }
                                                                        value={String(
                                                                            institution.id,
                                                                        )}
                                                                    >
                                                                        {
                                                                            institution.name
                                                                        }
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                    {institutions.length ===
                                                        0 && (
                                                        <p
                                                            role="status"
                                                            className="text-sm text-slate-600"
                                                        >
                                                            Belum ada kampus
                                                            yang tersedia.
                                                            Hubungi pengelola
                                                            SATU untuk
                                                            melanjutkan.
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="nim">
                                                        Nomor Induk Mahasiswa
                                                    </Label>
                                                    <Input
                                                        id="nim"
                                                        value={nim}
                                                        onChange={(event) =>
                                                            setNim(
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        placeholder="NIM terdaftar"
                                                        maxLength={50}
                                                        required
                                                        className="h-12 rounded-xl"
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="study_year">
                                                        Tahun studi
                                                    </Label>
                                                    <Select
                                                        value={studyYear}
                                                        onValueChange={(
                                                            value,
                                                        ) => {
                                                            draftTouched.current = true;
                                                            setStudyYear(value);
                                                        }}
                                                        disabled={busy}
                                                    >
                                                        <SelectTrigger
                                                            id="study_year"
                                                            className="h-12 w-full rounded-xl"
                                                        >
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {[
                                                                1, 2, 3, 4, 5,
                                                            ].map((year) => (
                                                                <SelectItem
                                                                    key={year}
                                                                    value={String(
                                                                        year,
                                                                    )}
                                                                >
                                                                    Tahun ke-
                                                                    {year}
                                                                    {year === 5
                                                                        ? ' atau lebih'
                                                                        : ''}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="grid gap-2 sm:col-span-2">
                                                    <Label htmlFor="study_program">
                                                        Program studi
                                                    </Label>
                                                    <Input
                                                        id="study_program"
                                                        value={studyProgram}
                                                        onChange={(event) =>
                                                            setStudyProgram(
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        placeholder="Contoh: Teknik Informatika"
                                                        required
                                                        className="h-12 rounded-xl"
                                                    />
                                                </div>
                                                <p className="flex items-start gap-2 rounded-2xl bg-blue-50 p-4 text-sm leading-6 text-blue-900 sm:col-span-2">
                                                    <ShieldCheck
                                                        aria-hidden="true"
                                                        className="mt-1 size-4 shrink-0"
                                                    />
                                                    NIM dan nomor WhatsApp
                                                    terverifikasi digunakan
                                                    untuk mencocokkan afiliasimu
                                                    dengan data kampus.
                                                </p>
                                            </div>
                                        )}
                                        {step === 1 && (
                                            <div className="space-y-5">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="bio">
                                                        Tentang dirimu{' '}
                                                        <span className="font-normal text-slate-500">
                                                            (opsional)
                                                        </span>
                                                    </Label>
                                                    <textarea
                                                        id="bio"
                                                        value={bio}
                                                        onChange={(event) =>
                                                            setBio(
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        rows={3}
                                                        className="w-full resize-y rounded-xl border border-input bg-white p-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                                                        placeholder="Apa yang ingin kamu pelajari atau bangun bersama?"
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="skill-search">
                                                        Keahlianmu
                                                    </Label>
                                                    <div className="relative">
                                                        <Search
                                                            aria-hidden="true"
                                                            className="absolute top-4 left-3 size-4 text-slate-500"
                                                        />
                                                        <Input
                                                            id="skill-search"
                                                            value={searchQuery}
                                                            onChange={(
                                                                event,
                                                            ) => {
                                                                setSearchQuery(
                                                                    event.target
                                                                        .value,
                                                                );
                                                                setSearchResults(
                                                                    [],
                                                                );
                                                                setSearchLoading(
                                                                    Boolean(
                                                                        event.target.value.trim(),
                                                                    ),
                                                                );
                                                                setSearchError(
                                                                    null,
                                                                );
                                                            }}
                                                            placeholder="Cari desain, pemrograman, dan lainnya"
                                                            aria-describedby="skill-search-help"
                                                            className="h-12 rounded-xl pl-10"
                                                        />
                                                    </div>
                                                    <p
                                                        id="skill-search-help"
                                                        className="text-xs leading-5 text-slate-600"
                                                    >
                                                        Pilih minimal satu
                                                        keahlian. Kamu bisa
                                                        menambahkan yang belum
                                                        tersedia.
                                                    </p>
                                                </div>
                                                {searchQuery.trim() && (
                                                    <div
                                                        className="space-y-2 rounded-2xl border border-blue-100 bg-blue-50/50 p-3"
                                                        aria-label="Hasil pencarian keahlian"
                                                    >
                                                        {searchLoading && (
                                                            <p
                                                                role="status"
                                                                className="flex items-center gap-2 p-2 text-sm text-slate-600"
                                                            >
                                                                <Spinner />
                                                                Mencari
                                                                keahlian...
                                                            </p>
                                                        )}
                                                        {searchError && (
                                                            <p
                                                                role="alert"
                                                                className="p-2 text-sm text-red-700"
                                                            >
                                                                {searchError}
                                                            </p>
                                                        )}
                                                        {!searchLoading &&
                                                            searchResults.map(
                                                                (item) => (
                                                                    <button
                                                                        key={
                                                                            item.id
                                                                        }
                                                                        type="button"
                                                                        disabled={skills.some(
                                                                            (
                                                                                skill,
                                                                            ) =>
                                                                                skill.taxonomy_id ===
                                                                                item.id,
                                                                        )}
                                                                        onClick={() =>
                                                                            addSkill(
                                                                                item,
                                                                            )
                                                                        }
                                                                        className="flex min-h-11 w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                                                                    >
                                                                        {
                                                                            item.name
                                                                        }
                                                                        <Plus
                                                                            aria-hidden="true"
                                                                            className="size-4"
                                                                        />
                                                                    </button>
                                                                ),
                                                            )}
                                                        {!searchLoading &&
                                                            !searchError &&
                                                            !searchResults.some(
                                                                (item) =>
                                                                    item.name.toLowerCase() ===
                                                                    searchQuery
                                                                        .trim()
                                                                        .toLowerCase(),
                                                            ) && (
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    className="h-auto min-h-11 w-full justify-start text-left whitespace-normal"
                                                                    onClick={
                                                                        createSkill
                                                                    }
                                                                    disabled={
                                                                        skillForm.processing
                                                                    }
                                                                >
                                                                    {skillForm.processing ? (
                                                                        <Spinner />
                                                                    ) : (
                                                                        <Plus
                                                                            aria-hidden="true"
                                                                            className="size-4"
                                                                        />
                                                                    )}
                                                                    Tambahkan “
                                                                    {searchQuery.trim()}
                                                                    ”
                                                                </Button>
                                                            )}
                                                    </div>
                                                )}
                                                {skills.length > 0 && (
                                                    <ul className="space-y-3">
                                                        {skills.map((skill) => (
                                                            <li
                                                                key={
                                                                    skill.taxonomy_id
                                                                }
                                                                className="flex flex-wrap items-center gap-3 rounded-2xl border border-blue-100 bg-white p-3"
                                                            >
                                                                <span className="min-w-0 flex-1 text-sm font-semibold break-words text-slate-800">
                                                                    {skill.name}
                                                                </span>
                                                                <Select
                                                                    value={
                                                                        skill.proficiency
                                                                    }
                                                                    onValueChange={(
                                                                        value: Proficiency,
                                                                    ) => {
                                                                        draftTouched.current = true;
                                                                        setSkills(
                                                                            (
                                                                                current,
                                                                            ) =>
                                                                                current.map(
                                                                                    (
                                                                                        item,
                                                                                    ) =>
                                                                                        item.taxonomy_id ===
                                                                                        skill.taxonomy_id
                                                                                            ? {
                                                                                                  ...item,
                                                                                                  proficiency:
                                                                                                      value,
                                                                                              }
                                                                                            : item,
                                                                                ),
                                                                        );
                                                                    }}
                                                                    disabled={
                                                                        busy
                                                                    }
                                                                >
                                                                    <SelectTrigger
                                                                        aria-label={`Tingkat keahlian ${skill.name}`}
                                                                        className="w-32 rounded-xl"
                                                                    >
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {Object.entries(
                                                                            proficiencyLabels,
                                                                        ).map(
                                                                            ([
                                                                                value,
                                                                                label,
                                                                            ]) => (
                                                                                <SelectItem
                                                                                    key={
                                                                                        value
                                                                                    }
                                                                                    value={
                                                                                        value
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        label
                                                                                    }
                                                                                </SelectItem>
                                                                            ),
                                                                        )}
                                                                    </SelectContent>
                                                                </Select>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        draftTouched.current = true;
                                                                        setSkills(
                                                                            (
                                                                                current,
                                                                            ) =>
                                                                                current.filter(
                                                                                    (
                                                                                        item,
                                                                                    ) =>
                                                                                        item.taxonomy_id !==
                                                                                        skill.taxonomy_id,
                                                                                ),
                                                                        );
                                                                    }}
                                                                    aria-label={`Hapus keahlian ${skill.name}`}
                                                                    className="flex size-10 cursor-pointer items-center justify-center rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-700"
                                                                >
                                                                    <Trash2
                                                                        aria-hidden="true"
                                                                        className="size-4"
                                                                    />
                                                                </button>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        )}
                                        {step === 2 && (
                                            <div className="space-y-6">
                                                <fieldset className="space-y-3">
                                                    <legend className="mb-3 text-sm font-semibold text-slate-800">
                                                        Kapan kamu bisa
                                                        berkolaborasi?
                                                    </legend>
                                                    <div className="grid grid-cols-7 gap-1.5">
                                                        {days.map((day) => (
                                                            <button
                                                                key={day.value}
                                                                type="button"
                                                                aria-pressed={availabilityDays.includes(
                                                                    day.value,
                                                                )}
                                                                aria-label={
                                                                    day.full
                                                                }
                                                                onClick={() => {
                                                                    draftTouched.current = true;
                                                                    setAvailabilityDays(
                                                                        (
                                                                            current,
                                                                        ) =>
                                                                            current.includes(
                                                                                day.value,
                                                                            )
                                                                                ? current.filter(
                                                                                      (
                                                                                          value,
                                                                                      ) =>
                                                                                          value !==
                                                                                          day.value,
                                                                                  )
                                                                                : [
                                                                                      ...current,
                                                                                      day.value,
                                                                                  ].sort(),
                                                                    );
                                                                }}
                                                                className={cn(
                                                                    'flex min-h-11 cursor-pointer items-center justify-center rounded-xl border text-xs font-semibold transition-colors',
                                                                    availabilityDays.includes(
                                                                        day.value,
                                                                    )
                                                                        ? 'border-blue-600 bg-blue-600 text-white'
                                                                        : 'border-slate-200 bg-white text-slate-600 hover:border-blue-400',
                                                                )}
                                                            >
                                                                {day.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="availability-start">
                                                                Jam mulai
                                                            </Label>
                                                            <Input
                                                                id="availability-start"
                                                                type="time"
                                                                value={startsAt}
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    setStartsAt(
                                                                        event
                                                                            .target
                                                                            .value,
                                                                    )
                                                                }
                                                                required
                                                                className="h-12 rounded-xl"
                                                            />
                                                        </div>
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="availability-end">
                                                                Jam selesai
                                                            </Label>
                                                            <Input
                                                                id="availability-end"
                                                                type="time"
                                                                value={endsAt}
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    setEndsAt(
                                                                        event
                                                                            .target
                                                                            .value,
                                                                    )
                                                                }
                                                                required
                                                                className="h-12 rounded-xl"
                                                            />
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-slate-600">
                                                        Zona waktu: {timezone}.
                                                        Jam yang sama berlaku
                                                        pada hari pilihanmu.
                                                    </p>
                                                </fieldset>
                                                <fieldset>
                                                    <legend className="mb-3 text-sm font-semibold text-slate-800">
                                                        Siapa yang boleh melihat
                                                        portofoliomu?
                                                    </legend>
                                                    <div className="grid gap-2 sm:grid-cols-2">
                                                        {visibilityChoices.map(
                                                            (choice) => (
                                                                <label
                                                                    key={
                                                                        choice.value
                                                                    }
                                                                    className={cn(
                                                                        'flex cursor-pointer items-start gap-3 rounded-2xl border p-3',
                                                                        visibility ===
                                                                            choice.value
                                                                            ? 'border-blue-500 bg-blue-50'
                                                                            : 'border-slate-200 bg-white',
                                                                    )}
                                                                >
                                                                    <input
                                                                        type="radio"
                                                                        name="portfolio-visibility"
                                                                        value={
                                                                            choice.value
                                                                        }
                                                                        checked={
                                                                            visibility ===
                                                                            choice.value
                                                                        }
                                                                        onChange={() =>
                                                                            setVisibility(
                                                                                choice.value,
                                                                            )
                                                                        }
                                                                        className="mt-1 size-4 accent-blue-600"
                                                                    />
                                                                    <span>
                                                                        <span className="block text-sm font-semibold text-slate-800">
                                                                            {
                                                                                choice.label
                                                                            }
                                                                        </span>
                                                                        <span className="mt-1 block text-xs leading-5 text-slate-600">
                                                                            {
                                                                                choice.detail
                                                                            }
                                                                        </span>
                                                                    </span>
                                                                </label>
                                                            ),
                                                        )}
                                                    </div>
                                                </fieldset>
                                                {(visibility === 'recruiter' ||
                                                    visibility ===
                                                        'public') && (
                                                    <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-blue-50 p-4">
                                                        <input
                                                            type="checkbox"
                                                            checked={
                                                                discoverable
                                                            }
                                                            onChange={(event) =>
                                                                setDiscoverable(
                                                                    event.target
                                                                        .checked,
                                                                )
                                                            }
                                                            className="mt-1 size-4 accent-blue-600"
                                                        />
                                                        <span className="text-sm leading-6 text-slate-700">
                                                            Tampilkan profil
                                                            saya dalam pencarian
                                                            recruiter. Pilihan
                                                            ini dapat diubah
                                                            nanti.
                                                        </span>
                                                    </label>
                                                )}
                                            </div>
                                        )}
                                    </fieldset>
                                    <footer className="sticky -bottom-6 mt-7 flex items-center justify-between gap-3 border-t border-slate-100 bg-white py-5">
                                        {step > 0 ? (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="cursor-pointer"
                                                onClick={() => moveTo(step - 1)}
                                                disabled={busy}
                                            >
                                                <ArrowLeft
                                                    aria-hidden="true"
                                                    className="size-4"
                                                />
                                                Kembali
                                            </Button>
                                        ) : (
                                            <span className="text-xs text-slate-600">
                                                Langkah {step + 1} dari 3
                                            </span>
                                        )}
                                        <Button
                                            type="submit"
                                            disabled={
                                                busy ||
                                                skillForm.processing ||
                                                institutions.length === 0
                                            }
                                            className="min-h-12 cursor-pointer rounded-xl px-5"
                                        >
                                            {busy ? (
                                                <>
                                                    <Spinner />
                                                    {phaseLabels[phase]}
                                                </>
                                            ) : step < 2 ? (
                                                <>
                                                    Lanjutkan
                                                    <ArrowRight
                                                        aria-hidden="true"
                                                        className="size-4"
                                                    />
                                                </>
                                            ) : (
                                                <>
                                                    Simpan profil
                                                    <CheckCheck
                                                        aria-hidden="true"
                                                        className="size-4"
                                                    />
                                                </>
                                            )}
                                        </Button>
                                    </footer>
                                    {busy && (
                                        <p role="status" className="sr-only">
                                            {phaseLabels[phase]}
                                        </p>
                                    )}
                                </form>
                            )}
                        </div>
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
