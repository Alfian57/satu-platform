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
    LogOut,
    Plus,
    RefreshCw,
    Search,
    ShieldCheck,
    Trash2,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { toast } from 'sonner';
import { AcademicProgramFields } from '@/components/academic-program-fields';
import InputError from '@/components/input-error';
import Mascot from '@/components/mascot';
import OnboardingAffiliationIntro from '@/components/onboarding-affiliation-intro';
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
import { activationNotice } from '@/lib/student-activation';
import { cn } from '@/lib/utils';
import { dashboard, logout } from '@/routes';
import { store as storeAffiliation } from '@/routes/institution-memberships';
import {
    index as searchTaxonomy,
    store as createTaxonomy,
} from '@/routes/skills/taxonomy';
import {
    edit as editProfile,
    show as showProfile,
    store as storeProfile,
    update as updateProfile,
} from '@/routes/student-profiles';
import { update as updateAvailability } from '@/routes/student-profiles/availability';
import { update as updateVisibility } from '@/routes/student-profiles/visibility';
import type { Auth, ShellContext } from '@/types';
import type { StudentActivation as OnboardingState } from '@/types/onboarding';

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
    faculty: string;
    admission_year: number | null;
    bio: string;
    skills: {
        taxonomy_id: number;
        proficiency: Proficiency;
        evidence_metadata?: Record<string, string | number | boolean | null>[];
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

const steps = ['Afiliasi kampus', 'Bekal kemampuan', 'Cara berkolaborasi'];
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

export function OnboardingModal({
    onVisibilityChange,
    openRequest = 0,
}: {
    onVisibilityChange?: (isOpen: boolean) => void;
    openRequest?: number;
}) {
    const { onboarding } = usePage<OnboardingProps>().props;
    const [step, setStep] = useState(
        onboarding?.membershipStatus === 'verified' ? 1 : 0,
    );
    const institutionId = onboarding?.institutionId
        ? String(onboarding.institutionId)
        : '';
    const [draftInstitutionId, setDraftInstitutionId] = useState(
        onboarding?.institutionId ?? null,
    );
    const [nim, setNim] = useState(onboarding?.nim ?? '');
    const [studyProgram, setStudyProgram] = useState(
        onboarding?.studyProgram ?? '',
    );
    const [faculty, setFaculty] = useState(onboarding?.faculty ?? '');
    const [admissionYear, setAdmissionYear] = useState(
        onboarding?.admissionYear == null
            ? ''
            : String(onboarding.admissionYear),
    );
    const [bio, setBio] = useState(onboarding?.bio ?? '');
    const [skills, setSkills] = useState<DraftSkill[]>([]);
    const [availabilityDays, setAvailabilityDays] = useState<number[]>([]);
    const [startsAt, setStartsAt] = useState('09:00');
    const [endsAt, setEndsAt] = useState('17:00');
    const [timezone] = useState(timezoneName);
    const [visibility, setVisibility] = useState<Visibility>('private');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Taxonomy[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [phase, setPhase] = useState<Phase>(
        onboarding?.membershipStatus === 'pending' &&
            onboarding.affiliationStatus !== 'revision_required'
            ? 'pending'
            : 'editing',
    );
    const [holdOpen, setHoldOpen] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const returnFocus = useRef<HTMLElement | null>(null);
    const handledOpenRequest = useRef(0);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const errorRef = useRef<HTMLDivElement>(null);
    const draftTouched = useRef(false);
    const savingRef = useRef(false);
    const pendingAffiliation = useRef<string | null>(
        onboarding?.membershipStatus === 'pending' &&
            onboarding.affiliationStatus === 'pending_review' &&
            onboarding.institutionId &&
            onboarding.nim
            ? `${onboarding.institutionId}:${onboarding.nim.trim().toLowerCase()}`
            : null,
    );
    const saveProgress = useRef<SaveProgress | null>(null);
    const needsReconciliation = useRef(false);
    const [affiliationUncertain, setAffiliationUncertain] = useState(false);
    const busy = Boolean(phaseLabels[phase]);
    const notice = activationNotice(onboarding);
    const contextChanged =
        draftInstitutionId !== null &&
        typeof onboarding?.institutionId === 'number' &&
        draftInstitutionId !== onboarding?.institutionId;
    const locked = notice.locked || contextChanged;
    const isProfileStage = onboarding?.membershipStatus === 'verified';
    const canDismiss =
        !busy &&
        !onboarding?.required &&
        (phase === 'pending' ||
            (isProfileStage && Boolean(onboarding?.profileId)));
    const isOpen =
        phase !== 'complete' &&
        Boolean(onboarding?.required || (!dismissed && holdOpen));

    useEffect(() => {
        if (openRequest === 0 || handledOpenRequest.current === openRequest) {
            return;
        }

        handledOpenRequest.current = openRequest;

        const frame = requestAnimationFrame(() => {
            returnFocus.current =
                document.activeElement instanceof HTMLElement
                    ? document.activeElement
                    : null;
            setDismissed(false);
            setHoldOpen(true);
            setStep(onboarding?.membershipStatus === 'verified' ? 1 : 0);
            setPhase(
                onboarding?.membershipStatus === 'pending' &&
                    onboarding.affiliationStatus !== 'revision_required'
                    ? 'pending'
                    : 'editing',
            );
        });

        return () => cancelAnimationFrame(frame);
    }, [
        openRequest,
        onboarding?.membershipStatus,
        onboarding?.affiliationStatus,
    ]);

    useEffect(() => {
        onVisibilityChange?.(isOpen);
    }, [isOpen, onVisibilityChange]);

    useEffect(() => {
        if (!onboarding?.required || savingRef.current) {
            return;
        }

        const frame = requestAnimationFrame(() => {
            setDismissed(false);
            setPhase('editing');
            setStep(onboarding.membershipStatus === 'verified' ? 1 : 0);
            setFaculty((current) => onboarding.faculty || current);
            setStudyProgram((current) => onboarding.studyProgram || current);
            setAdmissionYear((current) =>
                onboarding.admissionYear == null
                    ? current
                    : String(onboarding.admissionYear),
            );
        });

        return () => cancelAnimationFrame(frame);
    }, [
        onboarding?.required,
        onboarding?.membershipStatus,
        onboarding?.profileId,
        onboarding?.faculty,
        onboarding?.studyProgram,
        onboarding?.admissionYear,
    ]);

    const profileForm = useHttp<ProfilePayload, ProfileResponse>({
        institution_id: 0,
        study_program: '',
        faculty: '',
        admission_year: null,
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
            })
            .catch(() => {
                /* The user's draft remains editable if the existing profile cannot be read. */
            });

        return () => controller.abort();
    }, [onboarding?.profileId, onboarding?.required]);

    if (!isOpen) {
        return null;
    }

    function moveTo(next: number) {
        setDraftInstitutionId(
            (current) => current ?? onboarding?.institutionId ?? null,
        );
        setStep(next);
        setError(null);
        window.requestAnimationFrame(() => titleRef.current?.focus());
    }

    function showError(message: string) {
        setError(message);
        window.requestAnimationFrame(() => errorRef.current?.focus());
    }

    function validateStep(): boolean {
        if (locked || !onboarding?.canSubmitAffiliation || !institutionId) {
            showError(
                contextChanged
                    ? 'Pengaturan layanan berubah saat mengisi. Isianmu belum dikirim. Hubungi pengelola SATU sebelum melanjutkan.'
                    : notice.description,
            );

            return false;
        }

        if (step === 0) {
            const year = Number(admissionYear);

            if (
                !/^\d{4}$/.test(admissionYear) ||
                year < 1900 ||
                year > new Date().getFullYear()
            ) {
                showError(
                    'Isi angkatan masuk dengan tahun empat digit antara 1900 dan tahun berjalan, misalnya 2023.',
                );

                return false;
            }

            if (
                !faculty ||
                !(onboarding?.academicOptions?.[faculty] ?? []).includes(
                    studyProgram,
                )
            ) {
                showError('Pilih program studi yang sesuai dengan fakultas.');

                return false;
            }

            if (!nim.trim() && onboarding?.membershipStatus !== 'verified') {
                showError('Masukkan NIM yang terdaftar di universitas.');

                return false;
            }
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
            setAffiliationUncertain(false);
            const affiliationKey = `${institutionId}:${nim.trim().toLowerCase()}`;
            const matches =
                latest?.institutionId === Number(institutionId) &&
                latest.nim?.trim().toLowerCase() === nim.trim().toLowerCase();

            if (latest && activationNotice(latest).locked) {
                setPhase('editing');
                showError(activationNotice(latest).description);
            } else if (matches && latest.membershipStatus === 'verified') {
                pendingAffiliation.current = null;

                if (latest.profileId) {
                    setHoldOpen(false);
                    setPhase('complete');
                    router.visit(editProfile());

                    return;
                }

                setFaculty((current) => latest.faculty || current);
                setStudyProgram((current) => latest.studyProgram || current);
                setAdmissionYear((current) =>
                    latest.admissionYear == null
                        ? current
                        : String(latest.admissionYear),
                );
                setPhase('editing');
                moveTo(1);
            } else if (matches && latest.membershipStatus === 'pending') {
                pendingAffiliation.current = affiliationKey;
                setPhase('pending');
            } else {
                pendingAffiliation.current = null;
                setPhase('editing');
                showError(
                    'Status terbaru sudah diperiksa. Periksa NIM sebelum melanjutkan. Isian profil belum dikirim.',
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

        if (affiliationUncertain) {
            await checkPendingStatus();

            return;
        }

        if (step === 1) {
            moveTo(step + 1);

            return;
        }

        if (step === 2 && availabilityDays.length > 0 && endsAt <= startsAt) {
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
            faculty,
            admission_year: admissionYear === '' ? null : Number(admissionYear),
            bio: bio.trim(),
            skills: skills.map((skill) => ({
                taxonomy_id: skill.taxonomy_id,
                proficiency: skill.proficiency,
            })),
            availability_windows: availabilityDays.map((day) => ({
                day_of_week: day,
                starts_at: startsAt,
                ends_at: endsAt,
                timezone,
            })),
            portfolio_visibility: visibility,
            recruiter_discoverable: false,
        };
        let latest = onboarding ?? null;
        let failureMessage =
            'Profil belum selesai disimpan. Data isianmu tetap tersedia. Coba lagi.';

        try {
            setPhase('refresh');
            latest = await refreshOnboarding();

            if (
                !latest ||
                latest.institutionId !== selectedInstitution ||
                activationNotice(latest).locked
            ) {
                throw new Error(activationNotice(latest).description);
            }

            const alreadyVerified = latest.membershipStatus === 'verified';

            if (step > 0 && !alreadyVerified) {
                setStep(0);

                throw new Error(
                    'Afiliasi belum terverifikasi. Pengisian profil tersedia setelah afiliasi disetujui.',
                );
            }

            if (!alreadyVerified) {
                if (
                    pendingAffiliation.current === affiliationKey &&
                    latest.affiliationStatus === 'pending_review' &&
                    !latest.needsRosterRefresh
                ) {
                    setPhase('refresh');
                    latest = await refreshOnboarding();
                } else {
                    setPhase('affiliation');
                    setAffiliationUncertain(true);
                    latest = await new Promise<OnboardingState | null>(
                        (resolve, reject) => {
                            router.post(
                                storeAffiliation.url(),
                                {
                                    institution_id: selectedInstitution,
                                    nim: nim.trim(),
                                    faculty: faculty || null,
                                    study_program: studyProgram.trim() || null,
                                    admission_year:
                                        admissionYear === ''
                                            ? null
                                            : Number(admissionYear),
                                },
                                {
                                    preserveState: true,
                                    preserveScroll: true,
                                    onSuccess: (page) => {
                                        setAffiliationUncertain(false);
                                        resolve(
                                            (page.props.onboarding as
                                                OnboardingState | undefined) ??
                                                null,
                                        );
                                    },
                                    onError: (errors) => {
                                        setAffiliationUncertain(false);
                                        reject(
                                            new Error(
                                                firstError(
                                                    errors,
                                                    'Afiliasi belum dapat diproses. Periksa data kampusmu.',
                                                ),
                                            ),
                                        );
                                    },
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
                    setHoldOpen(false);
                    setPhase('complete');
                    toast.success(
                        'Pengajuan afiliasi berhasil dikirim. Menunggu verifikasi Admin Universitas.',
                    );
                    router.visit(dashboard.url());

                    return;
                }

                if (latest?.membershipStatus !== 'verified') {
                    throw new Error(
                        'Afiliasi belum terverifikasi. Periksa kembali akses kampusmu.',
                    );
                }

                pendingAffiliation.current = null;
            }

            if (latest?.profileId) {
                setHoldOpen(false);
                setPhase('complete');
                router.visit(
                    editProfile({
                        query: { institution_id: selectedInstitution },
                    }),
                );

                return;
            }

            if (step === 0) {
                setPhase('editing');
                moveTo(1);

                return;
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

                if (!response?.data?.id) {
                    throw new Error(failureMessage);
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
                const response = await availabilityForm.put(
                    updateAvailability.url(progress.profileId),
                    options,
                );

                if (!response?.data?.id) {
                    throw new Error(failureMessage);
                }

                progress.finished.add('availability');
            }

            if (!progress.finished.has('visibility')) {
                setPhase('visibility');
                visibilityForm.transform(() => ({
                    portfolio_visibility: payload.portfolio_visibility,
                    recruiter_discoverable: payload.recruiter_discoverable,
                }));
                const response = await visibilityForm.patch(
                    updateVisibility.url(progress.profileId),
                    options,
                );

                if (!response?.data?.id) {
                    throw new Error(failureMessage);
                }

                progress.finished.add('visibility');
            }

            setPhase('refresh');
            const confirmed = await refreshOnboarding();

            if (
                confirmed?.institutionId !== selectedInstitution ||
                confirmed.membershipStatus !== 'verified' ||
                !confirmed.profileId
            ) {
                throw new Error(
                    'Hasil penyimpanan belum dapat dikonfirmasi. Periksa akses dan profil tersimpan sebelum mencoba lagi.',
                );
            }

            setHoldOpen(false);
            setPhase('complete');
            toast.success('Data profil berhasil tersimpan.');
            router.visit(dashboard.url());
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
                    onOpenAutoFocus={(event) => {
                        event.preventDefault();
                        requestAnimationFrame(() => titleRef.current?.focus());
                    }}
                    onCloseAutoFocus={(event) => {
                        if (returnFocus.current?.isConnected) {
                            event.preventDefault();
                            requestAnimationFrame(() =>
                                returnFocus.current?.focus(),
                            );
                        }
                    }}
                    onEscapeKeyDown={(event) => {
                        if (!canDismiss) {
                            event.preventDefault();
                        } else {
                            setDismissed(true);
                        }
                    }}
                    onPointerDownOutside={(event) => event.preventDefault()}
                    className={cn(
                        'fixed top-1/2 left-1/2 z-50 flex h-[94svh] max-h-[94svh] w-[calc(100%-1.5rem)] max-w-5xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[2rem] border border-white bg-white shadow-2xl focus:outline-none lg:flex-row',
                        !isProfileStage && 'satu-affiliation-dialog',
                    )}
                >
                    {isProfileStage ? (
                        <>
                            <div
                                aria-hidden="true"
                                className="relative h-20 shrink-0 bg-gradient-to-r from-[#e7f4ff] via-[#d7efff] to-[#b9e6ff] lg:hidden"
                            >
                                <Mascot
                                    pose={
                                        phase === 'pending' ||
                                        phase === 'pending-check'
                                            ? 'peek'
                                            : 'guide'
                                    }
                                    className="absolute top-0 right-5 w-24"
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
                                        <span className="text-blue-600">
                                            dirimu.
                                        </span>
                                    </h2>
                                    <p className="mt-4 text-sm leading-6 text-slate-600">
                                        {isProfileStage
                                            ? 'Bantu SATU mengenali keahlian dan waktu luangmu untuk kolaborasi yang lebih cocok.'
                                            : 'Verifikasi status mahasiswamu sebelum mulai berkolaborasi di SATU.'}
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
                                    {isProfileStage
                                        ? 'Portofoliomu privat sampai kamu memilih untuk membagikannya.'
                                        : phase === 'pending' ||
                                            phase === 'pending-check'
                                          ? 'Pengajuan afiliasi sudah tercatat. Periksa status untuk melihat keputusan Admin Universitas.'
                                          : 'Data pengajuan diverifikasi sebelum akses kolaborasi dibuka. Mengisi form belum berarti afiliasi disetujui.'}
                                </p>
                            </aside>
                        </>
                    ) : (
                        <OnboardingAffiliationIntro
                            state={
                                locked || affiliationUncertain
                                    ? 'locked'
                                    : phase === 'pending' ||
                                        phase === 'pending-check'
                                      ? 'pending'
                                      : 'editing'
                            }
                        />
                    )}
                    <div className="onboarding-main flex min-h-0 min-w-0 flex-1 flex-col">
                        <header className="onboarding-header shrink-0 px-5 pt-6 pb-5 sm:px-8">
                            {canDismiss ? (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="float-right size-11"
                                    aria-label="Tutup pelengkapan afiliasi"
                                    disabled={busy}
                                    onClick={() => setDismissed(true)}
                                >
                                    <X aria-hidden="true" />
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="float-right min-h-11"
                                    disabled={busy}
                                    onClick={() => {
                                        router.flushAll();
                                        router.post(logout.url());
                                    }}
                                >
                                    <LogOut aria-hidden="true" />
                                    Keluar akun
                                </Button>
                            )}
                            <p className="onboarding-kicker mb-2 text-xs font-bold tracking-[0.12em] text-blue-700 uppercase">
                                {isProfileStage
                                    ? 'Ruang untuk bertumbuh'
                                    : 'Verifikasi mahasiswa'}
                            </p>
                            <DialogPrimitive.Title
                                ref={titleRef}
                                tabIndex={-1}
                                className="text-2xl font-bold tracking-tight text-slate-950 outline-none sm:text-3xl"
                            >
                                {locked
                                    ? notice.title
                                    : phase === 'pending' ||
                                        phase === 'pending-check'
                                      ? notice.title
                                      : isProfileStage
                                        ? steps[step]
                                        : 'Pengajuan afiliasi kampus'}
                            </DialogPrimitive.Title>
                            <DialogPrimitive.Description className="mt-2 text-sm leading-6 text-slate-600">
                                {locked
                                    ? 'Akun dan riwayat tetap aman. Periksa status atau hubungi pengelola untuk melanjutkan.'
                                    : phase === 'pending' ||
                                        phase === 'pending-check'
                                      ? 'Verifikasi status mahasiswa membantu menjaga ruang kolaborasi tetap tepercaya.'
                                      : isProfileStage
                                        ? 'Afiliasi sudah terverifikasi. Siapkan kemampuan dan waktu. Karya terdahulu tidak wajib.'
                                        : 'Lengkapi data sesuai catatan universitas untuk membuka akses kolaborasi.'}
                            </DialogPrimitive.Description>
                            {!locked &&
                                !isProfileStage &&
                                phase === 'editing' && (
                                    <p className="onboarding-mandatory mt-3 text-xs leading-5 text-slate-600">
                                        Isian bertanda bintang wajib diisi.
                                        Periksa datamu sebelum dikirim.
                                    </p>
                                )}
                            {!locked && isProfileStage && (
                                <ol
                                    aria-label="Tahapan profil"
                                    className="mt-5 flex gap-2"
                                >
                                    {steps.slice(1).map((label, index) => (
                                        <li
                                            key={label}
                                            aria-current={
                                                step - 1 === index
                                                    ? 'step'
                                                    : undefined
                                            }
                                            className="flex min-w-0 flex-1 items-center gap-2"
                                        >
                                            <span
                                                className={cn(
                                                    'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                                                    index <= step - 1
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-slate-100 text-slate-600',
                                                )}
                                            >
                                                {index < step - 1 ? (
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
                                                    index === step - 1
                                                        ? 'text-blue-800'
                                                        : 'text-slate-600',
                                                )}
                                            >
                                                {label}
                                            </span>
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </header>
                        <div className="onboarding-body min-h-0 overflow-y-auto px-5 pb-6 sm:px-8">
                            {error && (
                                <div
                                    ref={errorRef}
                                    id="onboarding-error"
                                    tabIndex={-1}
                                    role="alert"
                                    className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800"
                                >
                                    {error}
                                </div>
                            )}
                            {locked || affiliationUncertain ? (
                                <section
                                    className="space-y-4 py-3"
                                    aria-label="Pemulihan aktivasi"
                                    data-test="onboarding-locked"
                                >
                                    <div className="space-y-2 rounded-2xl border border-correction/30 bg-correction-subtle p-5 text-correction-subtle-foreground">
                                        <LockKeyhole
                                            aria-hidden="true"
                                            className="size-5"
                                        />
                                        <h3 className="font-semibold">
                                            {contextChanged
                                                ? 'Pengaturan layanan berubah'
                                                : affiliationUncertain
                                                  ? 'Hasil pengiriman perlu diperiksa'
                                                  : notice.title}
                                        </h3>
                                        <p className="text-sm leading-6">
                                            {contextChanged
                                                ? 'Isianmu belum dikirim agar data tetap aman. Hubungi pengelola SATU sebelum melanjutkan. Data yang sudah tersimpan tidak diubah.'
                                                : affiliationUncertain
                                                  ? 'Respons belum dapat dipastikan. Isianmu tetap tersedia dalam sesi ini. Periksa status server sebelum mengirim lagi.'
                                                  : notice.description}
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        className="w-full"
                                        onClick={checkPendingStatus}
                                        disabled={busy}
                                    >
                                        <RefreshCw aria-hidden="true" />
                                        {busy
                                            ? 'Memeriksa status...'
                                            : 'Periksa status afiliasi'}
                                    </Button>
                                </section>
                            ) : phase === 'pending' ||
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
                                            {notice.description}
                                        </p>
                                    </div>
                                    <p className="text-sm leading-6 text-muted-foreground">
                                        Fakultas, program studi, dan angkatan
                                        masuk tersimpan sebagai draft pribadi
                                        dan akan terisi otomatis setelah
                                        afiliasi disetujui. Isian profil lainnya
                                        masih sementara dan dapat hilang jika
                                        halaman dimuat ulang atau ditutup.
                                    </p>
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
                                        setDraftInstitutionId(
                                            (current) =>
                                                current ??
                                                onboarding?.institutionId ??
                                                null,
                                        );
                                    }}
                                >
                                    {onboarding?.hasLegacyAffiliation &&
                                        onboarding.membershipStatus !==
                                            'verified' && (
                                            <p
                                                className="mb-5 rounded-2xl bg-accent/60 p-4 text-sm leading-6 text-muted-foreground"
                                                data-test="onboarding-legacy"
                                            >
                                                Afiliasi akunmu perlu ditinjau.
                                                Verifikasi status mahasiswa
                                                dengan NIM yang sesuai. Profil,
                                                karya dan riwayat tersimpan
                                                tidak diubah. Hubungi Admin
                                                Universitas jika membutuhkan
                                                bantuan.
                                            </p>
                                        )}
                                    {(onboarding?.affiliationStatus ===
                                        'revision_required' ||
                                        onboarding?.affiliationStatus ===
                                            'rejected') && (
                                        <p
                                            role="status"
                                            className="mb-5 rounded-2xl bg-pending-subtle p-4 text-sm leading-6 text-pending-subtle-foreground"
                                        >
                                            {notice.description}
                                        </p>
                                    )}
                                    <fieldset
                                        disabled={busy}
                                        className="space-y-5 disabled:opacity-70"
                                    >
                                        <legend className="sr-only">
                                            {steps[step]}
                                        </legend>
                                        {step === 0 && (
                                            <div className="grid gap-5 sm:grid-cols-2">
                                                <section
                                                    className="affiliation-university space-y-2 rounded-2xl border border-primary/15 bg-accent/60 p-4 sm:col-span-2"
                                                    aria-label="Universitas"
                                                >
                                                    <GraduationCap
                                                        aria-hidden="true"
                                                        className="affiliation-university-icon"
                                                    />
                                                    <div>
                                                        <p className="text-xs font-semibold text-primary">
                                                            Universitas
                                                        </p>
                                                        <p
                                                            className="text-base font-bold wrap-anywhere text-foreground"
                                                            data-test="onboarding-university"
                                                        >
                                                            {onboarding?.institutionName ??
                                                                'Belum tersedia'}
                                                        </p>
                                                    </div>
                                                </section>
                                                <div className="grid content-start gap-2">
                                                    <Label htmlFor="nim">
                                                        Nomor Induk Mahasiswa
                                                        {onboarding?.membershipStatus !==
                                                            'verified' && (
                                                            <span
                                                                aria-hidden="true"
                                                                className="affiliation-required-marker"
                                                            >
                                                                *
                                                            </span>
                                                        )}
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
                                                        required={
                                                            onboarding?.membershipStatus !==
                                                            'verified'
                                                        }
                                                        readOnly={
                                                            onboarding?.membershipStatus ===
                                                            'verified'
                                                        }
                                                        aria-invalid={
                                                            step === 0 &&
                                                            Boolean(error)
                                                        }
                                                        aria-describedby={
                                                            error
                                                                ? 'onboarding-nim-help onboarding-error'
                                                                : 'onboarding-nim-help'
                                                        }
                                                        className="h-12 rounded-xl"
                                                    />
                                                    <p
                                                        id="onboarding-nim-help"
                                                        className="text-sm leading-6 text-muted-foreground"
                                                    >
                                                        {onboarding?.membershipStatus ===
                                                        'verified'
                                                            ? 'Afiliasi sudah terverifikasi. NIM tidak diubah melalui profil.'
                                                            : 'Gunakan NIM yang tercatat pada roster mahasiswa.'}
                                                    </p>
                                                </div>
                                                <div className="grid content-start gap-2">
                                                    <Label htmlFor="admission_year">
                                                        Angkatan masuk
                                                        {onboarding?.admissionYear ==
                                                            null && (
                                                            <span
                                                                aria-hidden="true"
                                                                className="affiliation-required-marker"
                                                            >
                                                                *
                                                            </span>
                                                        )}
                                                    </Label>
                                                    <Input
                                                        id="admission_year"
                                                        type="number"
                                                        required
                                                        inputMode="numeric"
                                                        min={1900}
                                                        max={new Date().getFullYear()}
                                                        step={1}
                                                        placeholder="Contoh: 2023"
                                                        readOnly={
                                                            onboarding?.admissionYear !=
                                                            null
                                                        }
                                                        value={admissionYear}
                                                        onChange={(event) => {
                                                            draftTouched.current = true;
                                                            setAdmissionYear(
                                                                event.target
                                                                    .value,
                                                            );
                                                        }}
                                                        disabled={busy}
                                                        aria-readonly={
                                                            onboarding?.admissionYear !=
                                                            null
                                                        }
                                                        aria-invalid={Boolean(
                                                            profileForm.errors
                                                                .admission_year,
                                                        )}
                                                        aria-describedby="admission-year-help admission-year-error"
                                                        className={`h-12 rounded-xl ${onboarding?.admissionYear != null ? 'cursor-default bg-muted/50' : ''}`}
                                                    />
                                                    <p
                                                        id="admission-year-help"
                                                        className="text-xs leading-5 text-muted-foreground"
                                                    >
                                                        {onboarding?.admissionYear !=
                                                        null
                                                            ? 'Data yang sudah tercatat tidak dapat diubah dari menu mahasiswa.'
                                                            : 'Tahun pertama masuk kuliah, bukan tingkat studi saat ini.'}
                                                    </p>
                                                    <InputError
                                                        id="admission-year-error"
                                                        message={
                                                            profileForm.errors
                                                                .admission_year
                                                        }
                                                    />
                                                </div>
                                                <AcademicProgramFields
                                                    prefix="onboarding"
                                                    showOptionalLabel={false}
                                                    showRequiredMark
                                                    conciseHelp
                                                    required
                                                    options={
                                                        onboarding?.academicOptions ??
                                                        {}
                                                    }
                                                    faculty={faculty}
                                                    program={studyProgram}
                                                    disabled={busy}
                                                    facultyReadOnly={Boolean(
                                                        onboarding?.faculty,
                                                    )}
                                                    programReadOnly={Boolean(
                                                        onboarding?.studyProgram,
                                                    )}
                                                    errors={profileForm.errors}
                                                    onChange={(
                                                        nextFaculty,
                                                        nextProgram,
                                                    ) => {
                                                        draftTouched.current = true;
                                                        setFaculty(nextFaculty);
                                                        setStudyProgram(
                                                            nextProgram,
                                                        );
                                                    }}
                                                />
                                                <p className="affiliation-academic-note flex items-start gap-2 text-xs leading-5 text-slate-600 sm:col-span-2">
                                                    <LockKeyhole
                                                        aria-hidden="true"
                                                        className="mt-0.5 size-4 shrink-0"
                                                    />
                                                    Fakultas, program studi, dan
                                                    angkatan masuk tidak dapat
                                                    diubah dari menu mahasiswa
                                                    setelah dikirim. Periksa
                                                    kembali sebelum mengajukan.
                                                </p>
                                                <p className="affiliation-match-note flex items-start gap-2 rounded-2xl bg-blue-50 p-4 text-sm leading-6 text-blue-900 sm:col-span-2">
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
                                                        Tentang dirimu
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
                                                        Keahlian boleh kosong
                                                        dan dapat dilengkapi
                                                        lewat Profil kemampuan.
                                                        Kamu bisa menambahkan
                                                        yang belum tersedia.
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
                                                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
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
                                                        Jadwal boleh kosong dan
                                                        dapat dilengkapi nanti.
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
                                            </div>
                                        )}
                                    </fieldset>
                                    <footer className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-white py-5">
                                        {step > 1 ? (
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
                                                {isProfileStage
                                                    ? 'Langkah 1 dari 2'
                                                    : 'Pengajuan afiliasi wajib'}
                                            </span>
                                        )}
                                        <Button
                                            type="submit"
                                            disabled={
                                                busy ||
                                                skillForm.processing ||
                                                locked ||
                                                !onboarding?.canSubmitAffiliation
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
                                                    {step === 0
                                                        ? 'Ajukan afiliasi'
                                                        : 'Lanjutkan'}
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
