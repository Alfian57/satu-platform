import { router, useHttp, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { toast } from 'sonner';
import { activationNotice } from '@/lib/student-activation';
import { dashboard } from '@/routes';
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

export type Proficiency = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type Visibility = 'private' | 'institution' | 'recruiter' | 'public';

export type Taxonomy = {
    id: number;
    name: string;
    category: string;
    description?: string | null;
};

export type DraftSkill = {
    taxonomy_id: number;
    name: string;
    proficiency: Proficiency;
};

export type Availability = {
    day_of_week: number;
    starts_at: string;
    ends_at: string;
    timezone: string;
};

export type ProfilePayload = {
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

export type ProfileResponse = {
    data: {
        id: number;
        skills?: DraftSkill[];
        availability_windows?: Availability[];
        portfolio_visibility?: Visibility;
        recruiter_discoverable?: boolean;
    };
};

export type Phase =
    | 'editing'
    | 'affiliation'
    | 'pending'
    | 'pending-check'
    | 'profile'
    | 'availability'
    | 'visibility'
    | 'refresh'
    | 'complete';

export type SaveProgress = {
    key: string;
    institutionId: number;
    profileId: number | null;
    finished: Set<string>;
};

export interface OnboardingProps {
    auth: Auth;
    shell: ShellContext;
    onboarding?: OnboardingState | null;
    [key: string]: unknown;
}

export const phaseLabels: Partial<Record<Phase, string>> = {
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

export interface UseOnboardingFlowOptions {
    onVisibilityChange?: (isOpen: boolean) => void;
    openRequest?: number;
}

export function useOnboardingFlow({
    onVisibilityChange,
    openRequest = 0,
}: UseOnboardingFlowOptions = {}) {
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

    function removeSkill(id: number) {
        draftTouched.current = true;
        setSkills((current) =>
            current.filter((item) => item.taxonomy_id !== id),
        );
    }

    function updateSkillProficiency(id: number, proficiency: Proficiency) {
        draftTouched.current = true;
        setSkills((current) =>
            current.map((item) =>
                item.taxonomy_id === id ? { ...item, proficiency } : item,
            ),
        );
    }

    function toggleAvailabilityDay(day: number) {
        draftTouched.current = true;
        setAvailabilityDays((current) =>
            current.includes(day)
                ? current.filter((val) => val !== day)
                : [...current, day].sort(),
        );
    }

    return {
        state: {
            step,
            nim,
            studyProgram,
            faculty,
            admissionYear,
            bio,
            skills,
            availabilityDays,
            startsAt,
            endsAt,
            timezone,
            visibility,
            searchQuery,
            searchResults,
            searchLoading,
            searchError,
            error,
            phase,
            holdOpen,
            dismissed,
            affiliationUncertain,
            isOpen,
            isProfileStage,
            canDismiss,
            busy,
            locked,
            contextChanged,
            notice,
            institutionId,
            institutionName: onboarding?.institutionName ?? 'Belum tersedia',
            academicOptions: onboarding?.academicOptions ?? {},
            membershipStatus: onboarding?.membershipStatus,
            affiliationStatus: onboarding?.affiliationStatus,
            hasLegacyAffiliation: onboarding?.hasLegacyAffiliation,
            canSubmitAffiliation: onboarding?.canSubmitAffiliation,
            phaseLabel: phaseLabels[phase],
        },
        actions: {
            setStep,
            moveTo,
            setNim,
            setStudyProgram,
            setFaculty,
            setAdmissionYear,
            setBio,
            setSkills,
            addSkill,
            removeSkill,
            updateSkillProficiency,
            setSearchQuery,
            createSkill,
            setAvailabilityDays,
            toggleAvailabilityDay,
            setStartsAt,
            setEndsAt,
            setVisibility,
            checkPendingStatus,
            save,
            dismiss: () => setDismissed(true),
            setPhase,
            markDraftTouched: () => {
                draftTouched.current = true;
                setDraftInstitutionId(
                    (current) => current ?? onboarding?.institutionId ?? null,
                );
            },
        },
        refs: {
            titleRef,
            errorRef,
            returnFocus,
        },
        forms: {
            profileForm,
            availabilityForm,
            visibilityForm,
            skillForm,
        },
    };
}
export type UseOnboardingFlowReturn = ReturnType<typeof useOnboardingFlow>;
