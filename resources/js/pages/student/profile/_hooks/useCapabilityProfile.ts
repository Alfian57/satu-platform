import { router, useHttp, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { toast } from 'sonner';
import { useStudentOnboardingLauncher } from '@/components/onboarding/student-onboarding-context';
import { activationNotice } from '@/lib/student-activation';
import { capabilityDraft, matchingReadiness } from '@/lib/student-capabilities';
import type {
    CapabilityPayload,
    CapabilityProfile,
    CapabilityWindow,
    EvidenceLink,
    Proficiency,
} from '@/lib/student-capabilities';
import { dashboard } from '@/routes';
import { show, store, update } from '@/routes/student-profiles';
import type { StudentActivation } from '@/types/onboarding';

function isAcademicValueSet(
    value: string | number | null | undefined,
): boolean {
    return value !== null && value !== undefined && String(value).trim() !== '';
}

export interface ApprovedSource {
    id: number;
    title: string;
    version: number;
    can_view: boolean;
    verification_label: string;
}

export interface CapabilityProfilePageProps {
    academicOptions?: Record<string, string[]>;
    institution: { id: number; name: string; timezone: string } | null;
    access: 'verified' | 'pending' | 'unverified' | 'suspended';
    profile: CapabilityProfile | null;
    taxonomies: { id: number; name: string; category: string }[];
    approvedSources: ApprovedSource[];
}

export interface UseCapabilityProfileOptions {
    profile: CapabilityProfile | null;
    institution: { id: number; name: string; timezone: string } | null;
    access: 'verified' | 'pending' | 'unverified' | 'suspended';
    taxonomies: { id: number; name: string; category: string }[];
}

export type UseCapabilityProfileReturn = ReturnType<
    typeof useCapabilityProfile
>;

export function useCapabilityProfile({
    profile,
    institution,
    access,
    taxonomies,
}: UseCapabilityProfileOptions) {
    const [savedProfile, setSavedProfile] = useState<CapabilityProfile | null>(
        profile,
    );
    const [skillChoice, setSkillChoice] = useState('');
    const [interestChoice, setInterestChoice] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [issue, setIssue] = useState<string | null>(null);
    const [blocked, setBlocked] = useState(false);
    const [mustReconcile, setMustReconcile] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [refreshFailed, setRefreshFailed] = useState(false);
    const [confirmation, setConfirmation] = useState<string | null>(null);
    const [activeEvidenceSkillIndex, setActiveEvidenceSkillIndex] = useState<
        number | null
    >(null);

    const errorRef = useRef<HTMLDivElement>(null);
    const busyRef = useRef(false);
    const confirmationResolver = useRef<((accepted: boolean) => void) | null>(
        null,
    );
    const confirmationFocus = useRef<HTMLElement | null>(null);

    const { onboarding } = usePage<{
        onboarding?: StudentActivation | null;
        [key: string]: unknown;
    }>().props;

    const form = useHttp<CapabilityPayload, { data: CapabilityProfile }>(
        capabilityDraft(
            profile,
            institution?.id ?? 0,
            access === 'verified' && profile === null
                ? {
                      study_program: onboarding?.studyProgram,
                      faculty: onboarding?.faculty,
                      admission_year: onboarding?.admissionYear,
                  }
                : null,
        ),
    );

    const openAffiliation = useStudentOnboardingLauncher();
    const notice = activationNotice(onboarding);
    const busy = form.processing || refreshing;
    const canEdit = access === 'verified' && institution !== null && !blocked;
    const missing = matchingReadiness(savedProfile);

    const lookup = new Map<number, string>(
        taxonomies.map((taxonomy) => [taxonomy.id, taxonomy.name]),
    );
    profile?.skills.forEach((skill) => {
        if (!lookup.has(skill.taxonomy_id)) {
            lookup.set(skill.taxonomy_id, skill.name);
        }
    });
    profile?.interests.forEach((interest) => {
        if (!lookup.has(interest.taxonomy_id)) {
            lookup.set(interest.taxonomy_id, interest.name);
        }
    });

    const errors = form.errors as Record<string, string>;
    const recordedFaculty =
        savedProfile?.faculty ??
        (profile === null ? (onboarding?.faculty ?? null) : null);
    const recordedProgram =
        savedProfile?.study_program ??
        (profile === null ? (onboarding?.studyProgram ?? null) : null);
    const recordedAdmissionYear =
        savedProfile?.admission_year ??
        (profile === null ? (onboarding?.admissionYear ?? null) : null);

    const facultyReadOnly = isAcademicValueSet(recordedFaculty);
    const programReadOnly = isAcademicValueSet(recordedProgram);
    const admissionYearReadOnly = isAcademicValueSet(recordedAdmissionYear);

    useEffect(() => {
        if (issue) {
            errorRef.current?.focus();
        }
    }, [issue]);

    function acceptProfile(next: CapabilityProfile) {
        setSavedProfile(next);
        const draft = capabilityDraft(next, institution?.id ?? 0);
        form.setData(draft);
        form.setDefaults(draft);
        form.clearErrors();
        setMustReconcile(false);
        setIssue(null);
    }

    function focusError() {
        requestAnimationFrame(() => errorRef.current?.focus());
    }

    function focusSelector(id: string) {
        requestAnimationFrame(() => document.getElementById(id)?.focus());
    }

    function confirmChanges(description: string): Promise<boolean> {
        confirmationFocus.current =
            document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;

        return new Promise((resolve) => {
            confirmationResolver.current = resolve;
            setConfirmation(description);
        });
    }

    function settleConfirmation(accepted: boolean) {
        const resolve = confirmationResolver.current;
        confirmationResolver.current = null;
        setConfirmation(null);
        resolve?.(accepted);
    }

    function changeSkill(
        index: number,
        patch: Partial<CapabilityPayload['skills'][number]>,
    ) {
        form.setData(
            'skills',
            form.data.skills.map((skill, position) =>
                position === index ? { ...skill, ...patch } : skill,
            ),
        );
        setMessage(null);
    }

    async function save(event: FormEvent) {
        event.preventDefault();

        if (busyRef.current || !canEdit || mustReconcile) {
            return;
        }

        busyRef.current = true;
        setIssue(null);
        setMessage(null);

        try {
            const options = {
                onError: (responseErrors: Record<string, string>) => {
                    const statusUnclear = Boolean(
                        responseErrors.institution_id,
                    );
                    setMustReconcile(statusUnclear);
                    setIssue(
                        statusUnclear
                            ? 'Status profil belum dapat dipastikan. Muat data tersimpan untuk memastikan apakah profil sudah tercatat.'
                            : 'Profil belum tersimpan. Periksa isian yang ditandai; draft tetap tersedia.',
                    );
                    focusError();
                },
            };
            const result = savedProfile
                ? await form.patch(update.url(savedProfile.id), options)
                : await form.post(store.url(), options);

            if (!result) {
                return;
            }

            acceptProfile(result.data);
            toast.success('Data profil berhasil tersimpan.');
            router.visit(dashboard.url());
        } catch (error) {
            const status = (error as { response?: { status?: number } })
                .response?.status;

            if (status === 403 || status === 404) {
                setBlocked(true);
                setIssue(
                    'Akses profil tidak tersedia. Periksa afiliasi kampus sebelum membuka data kembali.',
                );
            } else if (status === 422) {
                setIssue(
                    'Profil belum tersimpan. Periksa isian yang ditandai; draft tetap tersedia.',
                );
            } else {
                setMustReconcile(true);
                setIssue(
                    status === 409
                        ? 'Profil berubah di sesi lain. Muat data terbaru sebelum menyimpan lagi.'
                        : 'Belum dapat memastikan hasil penyimpanan. Draft tetap tersedia. Periksa data tersimpan sebelum mencoba lagi.',
                );
            }

            focusError();
        } finally {
            busyRef.current = false;
        }
    }

    async function reloadProfile() {
        if (busyRef.current || busy) {
            return;
        }

        if (
            form.isDirty &&
            !(await confirmChanges(
                'Muat profil tersimpan dan ganti draft di halaman ini? Perubahan yang belum tersimpan akan diganti.',
            ))
        ) {
            return;
        }

        busyRef.current = true;
        setRefreshing(true);
        setMessage(null);
        setRefreshFailed(false);

        if (blocked || !canEdit || !savedProfile) {
            router.reload({
                only: [
                    'profile',
                    'access',
                    'institution',
                    'taxonomies',
                    'approvedSources',
                    'onboarding',
                    'shell',
                ],
                onSuccess: (page) => {
                    const latest =
                        page.props as unknown as UseCapabilityProfileOptions;
                    setBlocked(latest.access !== 'verified');
                    setSavedProfile(latest.profile);
                    const draft = capabilityDraft(
                        latest.profile,
                        latest.institution?.id ?? 0,
                    );
                    form.setData(draft);
                    form.setDefaults(draft);
                    form.clearErrors();
                    setMustReconcile(false);
                    setIssue(null);
                },
                onHttpException: () => {
                    setRefreshFailed(true);
                    setIssue('Profil belum dapat dimuat. Coba lagi.');
                    focusError();

                    return false;
                },
                onNetworkError: () => {
                    setRefreshFailed(true);
                    setIssue('Koneksi terputus. Draft tetap tersedia.');
                    focusError();

                    return false;
                },
                onError: () => {
                    setRefreshFailed(true);
                    setIssue('Profil belum dapat dimuat. Coba lagi.');
                    focusError();
                },
                onFinish: () => {
                    busyRef.current = false;
                    setRefreshing(false);
                },
            });

            return;
        }

        try {
            const response = await fetch(show.url(savedProfile.id), {
                headers: { Accept: 'application/json' },
            });

            if (!response.ok) {
                if (response.status === 403 || response.status === 404) {
                    setBlocked(true);
                }

                throw new Error(
                    'Profil belum dapat dimuat. Draft tidak diubah. Periksa akses atau coba lagi.',
                );
            }

            const latest = (await response.json()) as {
                data: CapabilityProfile;
            };
            acceptProfile(latest.data);
            setMessage('Profil tersimpan terbaru sudah dimuat.');
        } catch {
            setRefreshFailed(true);
            setIssue(
                'Profil belum dapat dimuat. Draft tidak diubah. Periksa akses atau coba lagi.',
            );
            focusError();
        } finally {
            busyRef.current = false;
            setRefreshing(false);
        }
    }

    function addSkill() {
        if (!skillChoice || form.data.skills.length >= 30) {
            return;
        }

        form.setData('skills', [
            ...form.data.skills,
            {
                taxonomy_id: Number(skillChoice),
                proficiency: 'beginner',
                evidence_metadata: [],
            },
        ]);
        setSkillChoice('');
        focusSelector('capability-skill-choice');
    }

    async function removeSkill(index: number) {
        const skill = form.data.skills[index];

        if (
            (skill?.evidence_metadata?.length ||
                skill?.evidence_metadata === undefined) &&
            !(await confirmChanges(
                'Hapus keahlian ini beserta tautan bukti awalnya saat profil disimpan?',
            ))
        ) {
            return;
        }

        form.setData(
            'skills',
            form.data.skills.filter((_, position) => position !== index),
        );
        focusSelector('capability-skill-choice');
    }

    function addInterest() {
        if (!interestChoice || form.data.interests.length >= 20) {
            return;
        }

        form.setData('interests', [
            ...form.data.interests,
            Number(interestChoice),
        ]);
        setInterestChoice('');
        focusSelector('capability-interest-choice');
    }

    function removeInterest(id: number) {
        form.setData(
            'interests',
            form.data.interests.filter((val) => val !== id),
        );
        focusSelector('capability-interest-choice');
    }

    function addAvailabilityWindow() {
        const index = form.data.availability_windows.length;

        if (index >= 14) {
            return;
        }

        form.setData('availability_windows', [
            ...form.data.availability_windows,
            {
                day_of_week: 1,
                starts_at: '09:00',
                ends_at: '11:00',
                timezone: institution?.timezone ?? 'Asia/Jakarta',
            },
        ]);
        focusSelector(`window-${index}-day_of_week`);
    }

    function removeAvailabilityWindow(index: number) {
        form.setData(
            'availability_windows',
            form.data.availability_windows.filter(
                (_, position) => position !== index,
            ),
        );
        focusSelector('capability-add-window');
    }

    function changeAvailabilityWindow(
        index: number,
        patch: Partial<CapabilityWindow>,
    ) {
        form.setData(
            'availability_windows',
            form.data.availability_windows.map((item, position) =>
                position === index ? { ...item, ...patch } : item,
            ),
        );
    }

    function changeEvidence(
        skillIndex: number,
        evidenceIndex: number,
        patch: Partial<EvidenceLink>,
    ) {
        const skill = form.data.skills[skillIndex];

        if (!skill) {
            return;
        }

        changeSkill(skillIndex, {
            evidence_metadata: skill.evidence_metadata?.map((item, position) =>
                position === evidenceIndex ? { ...item, ...patch } : item,
            ),
        });
    }

    function addEvidence(skillIndex: number) {
        const skill = form.data.skills[skillIndex];

        if (!skill || (skill.evidence_metadata?.length ?? 0) >= 10) {
            return;
        }

        changeSkill(skillIndex, {
            evidence_metadata: [
                ...(skill.evidence_metadata ?? []),
                { title: '', url: '' },
            ],
        });
    }

    function removeEvidence(skillIndex: number, evidenceIndex: number) {
        const skill = form.data.skills[skillIndex];

        if (!skill) {
            return;
        }

        changeSkill(skillIndex, {
            evidence_metadata: skill.evidence_metadata?.filter(
                (_, position) => position !== evidenceIndex,
            ),
        });
        focusSelector(`capability-level-${skillIndex}`);
    }

    async function replaceLegacyEvidence(skillIndex: number) {
        if (
            await confirmChanges(
                'Ganti metadata bukti lama dengan daftar tautan baru saat profil disimpan?',
            )
        ) {
            changeSkill(skillIndex, { evidence_metadata: [] });
        }
    }

    const activeSkill =
        activeEvidenceSkillIndex !== null
            ? (form.data.skills[activeEvidenceSkillIndex] ?? null)
            : null;
    const activeSkillName =
        activeSkill !== null
            ? (lookup.get(activeSkill.taxonomy_id) ?? 'Keahlian')
            : '';

    return {
        state: {
            savedProfile,
            skillChoice,
            interestChoice,
            message,
            issue,
            blocked,
            mustReconcile,
            refreshing,
            refreshFailed,
            confirmation,
            activeEvidenceSkillIndex,
            busy,
            canEdit,
            missing,
            errors,
            facultyReadOnly,
            programReadOnly,
            admissionYearReadOnly,
            formData: form.data,
            isDirty: form.isDirty,
            isProcessing: form.processing,
        },
        actions: {
            save,
            reloadProfile,
            setSkillChoice,
            setInterestChoice,
            addSkill,
            removeSkill,
            changeSkill,
            changeSkillProficiency: (
                index: number,
                proficiency: Proficiency,
            ) => {
                changeSkill(index, { proficiency });
            },
            addInterest,
            removeInterest,
            addAvailabilityWindow,
            removeAvailabilityWindow,
            changeAvailabilityWindow,
            setActiveEvidenceSkillIndex,
            addEvidence,
            changeEvidence,
            removeEvidence,
            replaceLegacyEvidence,
            settleConfirmation,
            openAffiliation,
            setFacultyAndProgram: (faculty: string, program: string) => {
                form.setData({ ...form.data, faculty, study_program: program });
            },
            setAdmissionYear: (year: number | null) => {
                form.setData('admission_year', year);
            },
            setBio: (bio: string) => {
                form.setData('bio', bio);
            },
        },
        helpers: {
            lookup,
            errorRef,
            confirmationFocus,
            notice,
            activeSkill,
            activeSkillName,
        },
    };
}
