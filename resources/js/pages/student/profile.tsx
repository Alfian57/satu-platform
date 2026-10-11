import { Head, Link, router, useHttp } from '@inertiajs/react';
import type { LayoutCallback } from '@inertiajs/react';
import {
    BookOpenCheck,
    CheckCircle2,
    Clock3,
    ExternalLink,
    LockKeyhole,
    Plus,
    RefreshCw,
    Trash2,
    UserRoundCog,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { AppPage } from '@/components/app-page';
import { DashboardArchiveArt } from '@/components/dashboard-archive-art';
import InputError from '@/components/input-error';
import { useStudentOnboardingLauncher } from '@/components/student-onboarding-context';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import StudentLayout from '@/layouts/student-layout';
import {
    capabilityDraft,
    editableEvidence,
    matchingReadiness,
    safeEvidenceUrl,
} from '@/lib/student-capabilities';
import type {
    CapabilityPayload,
    CapabilityProfile,
    Proficiency,
} from '@/lib/student-capabilities';
import { show as showContribution } from '@/routes/contributions';
import { index as projectsIndex } from '@/routes/projects';
import { edit, show, store, update } from '@/routes/student-profiles';

type Props = {
    institution: { id: number; name: string; timezone: string } | null;
    access: 'verified' | 'pending' | 'unverified' | 'suspended';
    profile: CapabilityProfile | null;
    taxonomies: { id: number; name: string; category: string }[];
    approvedSources: {
        id: number;
        title: string;
        version: number;
        can_view: boolean;
        verification_label: string;
    }[];
};
const levels: Record<Proficiency, string> = {
    beginner: 'Pemula',
    intermediate: 'Menengah',
    advanced: 'Lanjutan',
    expert: 'Mahir',
};
const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const selectClass =
    'h-11 w-full min-w-0 cursor-pointer rounded-xl border border-input bg-card px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50';
const sectionClass =
    'min-w-0 space-y-5 rounded-3xl border border-border bg-card p-5 shadow-md sm:p-6';

export default function CapabilityProfilePage({
    institution,
    access,
    profile,
    taxonomies,
    approvedSources,
}: Props) {
    const [savedProfile, setSavedProfile] = useState(profile);
    const [skillChoice, setSkillChoice] = useState('');
    const [interestChoice, setInterestChoice] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [issue, setIssue] = useState<string | null>(null);
    const [blocked, setBlocked] = useState(false);
    const [mustReconcile, setMustReconcile] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [refreshFailed, setRefreshFailed] = useState(false);
    const errorRef = useRef<HTMLDivElement>(null);
    const busyRef = useRef(false);
    const [confirmation, setConfirmation] = useState<string | null>(null);
    const confirmationResolver = useRef<((accepted: boolean) => void) | null>(
        null,
    );
    const confirmationFocus = useRef<HTMLElement | null>(null);
    const form = useHttp<CapabilityPayload, { data: CapabilityProfile }>(
        capabilityDraft(profile, institution?.id ?? 0),
    );
    const openAffiliation = useStudentOnboardingLauncher();
    const busy = form.processing || refreshing;
    const canEdit = access === 'verified' && institution !== null && !blocked;
    const missing = matchingReadiness(savedProfile);
    const lookup = new Map(
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
                onError: () => {
                    setIssue(
                        'Profil belum tersimpan. Periksa isian yang ditandai; draft tetap tersedia.',
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
            setMessage(
                'Profil tersimpan. Keahlian tetap merupakan pernyataan sendiri, bukan hasil validasi kampus.',
            );
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
                    const latest = page.props as unknown as Props;
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

    return (
        <>
            <Head title="Profil kemampuan" />
            <AppPage className="min-w-0">
                <div
                    className="min-w-0 space-y-6"
                    data-test="capability-profile-root"
                >
                    <header className="relative overflow-hidden rounded-3xl border border-border bg-linear-to-br from-card to-accent/60 p-5 shadow-sm sm:p-6">
                        <DashboardArchiveArt className="pointer-events-none absolute top-0 right-3 hidden w-28 opacity-40 sm:block" />
                        <div className="relative min-w-0 space-y-3 sm:pr-28">
                            <div className="flex items-center gap-3">
                                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-primary">
                                    <UserRoundCog aria-hidden="true" />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-primary">
                                        Bekal untuk berkolaborasi
                                    </p>
                                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                                        Profil kemampuan
                                    </h1>
                                </div>
                            </div>
                            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                                Mulai dari yang ingin kamu pelajari dan
                                kemampuan yang kamu miliki. Tidak wajib
                                mempunyai karya atau pengalaman proyek.
                            </p>
                            {institution && (
                                <p className="text-sm font-medium wrap-anywhere">
                                    {institution.name}
                                </p>
                            )}
                        </div>
                    </header>
                    {issue && (
                        <div
                            ref={errorRef}
                            tabIndex={-1}
                            role="alert"
                            className="space-y-2 rounded-2xl border border-correction/40 bg-correction-subtle p-5 text-correction-subtle-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                            data-test="capability-error"
                        >
                            <p className="font-semibold">{issue}</p>
                            {Object.entries(errors).length > 0 && (
                                <ul className="list-disc space-y-1 pl-5 text-sm">
                                    {Object.entries(errors).map(
                                        ([key, value]) => (
                                            <li key={key}>{value}</li>
                                        ),
                                    )}
                                </ul>
                            )}
                            {(mustReconcile || blocked || refreshFailed) && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={busy}
                                    onClick={reloadProfile}
                                >
                                    Muat data tersimpan
                                </Button>
                            )}
                        </div>
                    )}
                    {!canEdit ? (
                        <section
                            className={sectionClass}
                            data-test="capability-forbidden"
                        >
                            <LockKeyhole
                                aria-hidden="true"
                                className="size-8 text-primary"
                            />
                            <h2 className="text-xl font-bold">
                                Profil menunggu akses kampus
                            </h2>
                            <p className="text-sm leading-6 text-muted-foreground">
                                {access === 'pending'
                                    ? 'Afiliasi sedang menunggu tinjauan. Profil kampus belum dapat disimpan.'
                                    : access === 'suspended'
                                      ? 'Akses kampus ditangguhkan. Profil dan bukti tidak ditampilkan.'
                                      : 'Verifikasi afiliasi diperlukan sebelum membuat atau membuka profil kampus.'}
                            </p>
                            <Button type="button" onClick={openAffiliation}>
                                Periksa afiliasi
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={busy}
                                onClick={reloadProfile}
                            >
                                Periksa akses kembali
                            </Button>
                        </section>
                    ) : (
                        <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]">
                            <form
                                className="min-w-0 space-y-6"
                                onSubmit={save}
                                data-test="capability-form"
                            >
                                <fieldset
                                    className="min-w-0 space-y-6"
                                    disabled={busy}
                                    aria-busy={busy}
                                >
                                    <section className={sectionClass}>
                                        <h2 className="text-xl font-bold">
                                            Tentang dirimu
                                        </h2>
                                        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                                            <div className="min-w-0 space-y-2">
                                                <Label htmlFor="capability-program">
                                                    Program studi (opsional)
                                                </Label>
                                                <Input
                                                    id="capability-program"
                                                    value={
                                                        form.data.study_program
                                                    }
                                                    maxLength={255}
                                                    onChange={(e) =>
                                                        form.setData(
                                                            'study_program',
                                                            e.target.value,
                                                        )
                                                    }
                                                    aria-invalid={Boolean(
                                                        errors.study_program,
                                                    )}
                                                    aria-describedby="capability-program-error"
                                                />
                                                <InputError
                                                    id="capability-program-error"
                                                    message={
                                                        errors.study_program
                                                    }
                                                />
                                            </div>
                                            <div className="min-w-0 space-y-2">
                                                <Label htmlFor="capability-year">
                                                    Tahun studi (opsional)
                                                </Label>
                                                <Input
                                                    id="capability-year"
                                                    type="number"
                                                    min={1}
                                                    max={10}
                                                    value={
                                                        form.data.study_year ??
                                                        ''
                                                    }
                                                    onChange={(e) =>
                                                        form.setData(
                                                            'study_year',
                                                            e.target.value ===
                                                                ''
                                                                ? null
                                                                : Number(
                                                                      e.target
                                                                          .value,
                                                                  ),
                                                        )
                                                    }
                                                    aria-invalid={Boolean(
                                                        errors.study_year,
                                                    )}
                                                    aria-describedby="capability-year-error"
                                                />
                                                <InputError
                                                    id="capability-year-error"
                                                    message={errors.study_year}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="capability-bio">
                                                Cerita singkat (opsional)
                                            </Label>
                                            <textarea
                                                id="capability-bio"
                                                value={form.data.bio}
                                                maxLength={2000}
                                                rows={3}
                                                className="min-h-28 w-full min-w-0 rounded-xl border border-input bg-card p-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed"
                                                onChange={(e) =>
                                                    form.setData(
                                                        'bio',
                                                        e.target.value,
                                                    )
                                                }
                                                aria-invalid={Boolean(
                                                    errors.bio,
                                                )}
                                                aria-describedby="capability-bio-help capability-bio-error"
                                            />
                                            <p
                                                id="capability-bio-help"
                                                className="text-xs leading-5 text-muted-foreground"
                                            >
                                                Ceritakan hal yang ingin kamu
                                                kerjakan, tanpa perlu menulis
                                                kontak pribadi.
                                            </p>
                                            <InputError
                                                id="capability-bio-error"
                                                message={errors.bio}
                                            />
                                        </div>
                                    </section>
                                    <section className={sectionClass}>
                                        <div className="space-y-2">
                                            <h2 className="text-xl font-bold">
                                                Keahlian yang kamu nyatakan
                                            </h2>
                                            <p className="text-sm leading-6 text-muted-foreground">
                                                Pilih sesuai kesiapanmu saat
                                                ini. Tingkat ini adalah
                                                pernyataan sendiri, bukan hasil
                                                validasi kampus.
                                            </p>
                                        </div>
                                        <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                                            <div className="space-y-2">
                                                <Label htmlFor="capability-skill-choice">
                                                    Pilih keahlian
                                                </Label>
                                                <select
                                                    id="capability-skill-choice"
                                                    className={selectClass}
                                                    value={skillChoice}
                                                    onChange={(e) =>
                                                        setSkillChoice(
                                                            e.target.value,
                                                        )
                                                    }
                                                >
                                                    <option value="">
                                                        Pilih dari katalog
                                                    </option>
                                                    {taxonomies
                                                        .filter(
                                                            (t) =>
                                                                t.category !==
                                                                    'interest' &&
                                                                !form.data.skills.some(
                                                                    (s) =>
                                                                        s.taxonomy_id ===
                                                                        t.id,
                                                                ),
                                                        )
                                                        .map((t) => (
                                                            <option
                                                                key={t.id}
                                                                value={t.id}
                                                            >
                                                                {t.name}
                                                            </option>
                                                        ))}
                                                </select>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="sm:self-end"
                                                disabled={
                                                    !skillChoice ||
                                                    form.data.skills.length >=
                                                        30
                                                }
                                                onClick={() => {
                                                    form.setData('skills', [
                                                        ...form.data.skills,
                                                        {
                                                            taxonomy_id:
                                                                Number(
                                                                    skillChoice,
                                                                ),
                                                            proficiency:
                                                                'beginner',
                                                            evidence_metadata:
                                                                [],
                                                        },
                                                    ]);
                                                    setSkillChoice('');
                                                    focusSelector(
                                                        'capability-skill-choice',
                                                    );
                                                }}
                                            >
                                                <Plus aria-hidden="true" />
                                                Tambah keahlian
                                            </Button>
                                        </div>
                                        {taxonomies.filter(
                                            (t) => t.category !== 'interest',
                                        ).length === 0 && (
                                            <p className="text-sm text-muted-foreground">
                                                Katalog keahlian belum tersedia.
                                                Kamu tetap dapat menyimpan
                                                informasi profil.
                                            </p>
                                        )}
                                        {form.data.skills.length === 0 && (
                                            <p className="rounded-2xl border border-dashed border-border p-4 text-sm leading-6 text-muted-foreground">
                                                Belum memilih keahlian? Kamu
                                                dapat mulai dari minat dan
                                                mencari peluang secara langsung.
                                            </p>
                                        )}
                                        <InputError message={errors.skills} />
                                        <div className="space-y-4">
                                            {form.data.skills.map(
                                                (skill, index) => (
                                                    <article
                                                        key={skill.taxonomy_id}
                                                        className="min-w-0 space-y-4 rounded-2xl border border-border bg-background/70 p-4"
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="min-w-0">
                                                                <h3 className="font-semibold wrap-anywhere">
                                                                    {lookup.get(
                                                                        skill.taxonomy_id,
                                                                    ) ??
                                                                        'Keahlian tersimpan'}
                                                                </h3>
                                                                <p className="mt-1 text-xs text-muted-foreground">
                                                                    Pernyataan
                                                                    sendiri
                                                                </p>
                                                            </div>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                aria-label={`Hapus keahlian ${lookup.get(skill.taxonomy_id) ?? index + 1}`}
                                                                onClick={async () => {
                                                                    if (
                                                                        (skill
                                                                            .evidence_metadata
                                                                            ?.length ||
                                                                            skill.evidence_metadata ===
                                                                                undefined) &&
                                                                        !(await confirmChanges(
                                                                            'Hapus keahlian ini beserta tautan bukti awalnya saat profil disimpan?',
                                                                        ))
                                                                    ) {
                                                                        return;
                                                                    }

                                                                    form.setData(
                                                                        'skills',
                                                                        form.data.skills.filter(
                                                                            (
                                                                                _,
                                                                                position,
                                                                            ) =>
                                                                                position !==
                                                                                index,
                                                                        ),
                                                                    );
                                                                    focusSelector(
                                                                        'capability-skill-choice',
                                                                    );
                                                                }}
                                                            >
                                                                <Trash2 aria-hidden="true" />
                                                            </Button>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label
                                                                htmlFor={`capability-level-${index}`}
                                                            >
                                                                Tingkat kesiapan
                                                            </Label>
                                                            <select
                                                                id={`capability-level-${index}`}
                                                                value={
                                                                    skill.proficiency
                                                                }
                                                                className={
                                                                    selectClass
                                                                }
                                                                onChange={(e) =>
                                                                    changeSkill(
                                                                        index,
                                                                        {
                                                                            proficiency:
                                                                                e
                                                                                    .target
                                                                                    .value as Proficiency,
                                                                        },
                                                                    )
                                                                }
                                                                aria-invalid={Boolean(
                                                                    errors[
                                                                        `skills.${index}.proficiency`
                                                                    ],
                                                                )}
                                                                aria-describedby={`capability-level-error-${index}`}
                                                            >
                                                                {Object.entries(
                                                                    levels,
                                                                ).map(
                                                                    ([
                                                                        value,
                                                                        label,
                                                                    ]) => (
                                                                        <option
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
                                                                        </option>
                                                                    ),
                                                                )}
                                                            </select>
                                                            <InputError
                                                                id={`capability-level-error-${index}`}
                                                                message={
                                                                    errors[
                                                                        `skills.${index}.proficiency`
                                                                    ]
                                                                }
                                                            />
                                                        </div>
                                                        <details className="group border-t border-border pt-2">
                                                            <summary className="min-h-11 cursor-pointer rounded-lg py-3 text-sm font-semibold text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                                                                Bukti awal
                                                                (opsional)
                                                            </summary>
                                                            <p className="mb-4 text-xs leading-5 text-muted-foreground">
                                                                Tautan HTTPS
                                                                privat untuk
                                                                dirimu. Belum
                                                                ditinjau kampus.
                                                                Berkas dan
                                                                validasi tetap
                                                                melalui menu
                                                                Kontribusi.
                                                                Maksimal 10
                                                                tautan per
                                                                keahlian.
                                                            </p>
                                                            {skill.evidence_metadata ===
                                                            undefined ? (
                                                                <div className="space-y-3">
                                                                    <p className="text-sm leading-6">
                                                                        Metadata
                                                                        lama
                                                                        tetap
                                                                        tersimpan
                                                                        dan
                                                                        tidak
                                                                        dijadikan
                                                                        tautan
                                                                        aktif.
                                                                        Perubahan
                                                                        lain
                                                                        tidak
                                                                        menghapusnya.
                                                                    </p>
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        onClick={async () => {
                                                                            if (
                                                                                await confirmChanges(
                                                                                    'Ganti metadata bukti lama dengan daftar tautan baru saat profil disimpan?',
                                                                                )
                                                                            ) {
                                                                                changeSkill(
                                                                                    index,
                                                                                    {
                                                                                        evidence_metadata:
                                                                                            [],
                                                                                    },
                                                                                );
                                                                            }
                                                                        }}
                                                                    >
                                                                        Ganti
                                                                        bukti
                                                                        lama
                                                                    </Button>
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-4">
                                                                    {skill.evidence_metadata.map(
                                                                        (
                                                                            evidence,
                                                                            evidenceIndex,
                                                                        ) => {
                                                                            const titleKey = `skills.${index}.evidence_metadata.${evidenceIndex}.title`,
                                                                                urlKey = `skills.${index}.evidence_metadata.${evidenceIndex}.url`;
                                                                            const changeEvidence =
                                                                                (
                                                                                    patch: Partial<
                                                                                        typeof evidence
                                                                                    >,
                                                                                ) =>
                                                                                    changeSkill(
                                                                                        index,
                                                                                        {
                                                                                            evidence_metadata:
                                                                                                skill.evidence_metadata?.map(
                                                                                                    (
                                                                                                        item,
                                                                                                        position,
                                                                                                    ) =>
                                                                                                        position ===
                                                                                                        evidenceIndex
                                                                                                            ? {
                                                                                                                  ...item,
                                                                                                                  ...patch,
                                                                                                              }
                                                                                                            : item,
                                                                                                ),
                                                                                        },
                                                                                    );

                                                                            return (
                                                                                <div
                                                                                    key={
                                                                                        evidenceIndex
                                                                                    }
                                                                                    className="space-y-3 rounded-xl border border-border bg-card p-3"
                                                                                >
                                                                                    <div className="space-y-2">
                                                                                        <Label
                                                                                            htmlFor={`proof-title-${index}-${evidenceIndex}`}
                                                                                        >
                                                                                            Judul
                                                                                            bukti{' '}
                                                                                            {evidenceIndex +
                                                                                                1}
                                                                                        </Label>
                                                                                        <Input
                                                                                            id={`proof-title-${index}-${evidenceIndex}`}
                                                                                            value={
                                                                                                evidence.title
                                                                                            }
                                                                                            maxLength={
                                                                                                120
                                                                                            }
                                                                                            required
                                                                                            onChange={(
                                                                                                e,
                                                                                            ) =>
                                                                                                changeEvidence(
                                                                                                    {
                                                                                                        title: e
                                                                                                            .target
                                                                                                            .value,
                                                                                                    },
                                                                                                )
                                                                                            }
                                                                                            aria-invalid={Boolean(
                                                                                                errors[
                                                                                                    titleKey
                                                                                                ],
                                                                                            )}
                                                                                            aria-describedby={`proof-title-error-${index}-${evidenceIndex}`}
                                                                                        />
                                                                                        <InputError
                                                                                            id={`proof-title-error-${index}-${evidenceIndex}`}
                                                                                            message={
                                                                                                errors[
                                                                                                    titleKey
                                                                                                ]
                                                                                            }
                                                                                        />
                                                                                    </div>
                                                                                    <div className="space-y-2">
                                                                                        <Label
                                                                                            htmlFor={`proof-url-${index}-${evidenceIndex}`}
                                                                                        >
                                                                                            Tautan
                                                                                            HTTPS
                                                                                        </Label>
                                                                                        <Input
                                                                                            id={`proof-url-${index}-${evidenceIndex}`}
                                                                                            type="url"
                                                                                            value={
                                                                                                evidence.url
                                                                                            }
                                                                                            maxLength={
                                                                                                2048
                                                                                            }
                                                                                            required
                                                                                            onChange={(
                                                                                                e,
                                                                                            ) =>
                                                                                                changeEvidence(
                                                                                                    {
                                                                                                        url: e
                                                                                                            .target
                                                                                                            .value,
                                                                                                    },
                                                                                                )
                                                                                            }
                                                                                            aria-invalid={Boolean(
                                                                                                errors[
                                                                                                    urlKey
                                                                                                ],
                                                                                            )}
                                                                                            aria-describedby={`proof-url-error-${index}-${evidenceIndex}`}
                                                                                        />
                                                                                        <InputError
                                                                                            id={`proof-url-error-${index}-${evidenceIndex}`}
                                                                                            message={
                                                                                                errors[
                                                                                                    urlKey
                                                                                                ]
                                                                                            }
                                                                                        />
                                                                                    </div>
                                                                                    <Button
                                                                                        type="button"
                                                                                        variant="ghost"
                                                                                        onClick={() => {
                                                                                            changeSkill(
                                                                                                index,
                                                                                                {
                                                                                                    evidence_metadata:
                                                                                                        skill.evidence_metadata?.filter(
                                                                                                            (
                                                                                                                _,
                                                                                                                position,
                                                                                                            ) =>
                                                                                                                position !==
                                                                                                                evidenceIndex,
                                                                                                        ),
                                                                                                },
                                                                                            );
                                                                                            focusSelector(
                                                                                                `capability-level-${index}`,
                                                                                            );
                                                                                        }}
                                                                                    >
                                                                                        <Trash2 aria-hidden="true" />
                                                                                        Hapus
                                                                                        tautan{' '}
                                                                                        {evidenceIndex +
                                                                                            1}
                                                                                    </Button>
                                                                                </div>
                                                                            );
                                                                        },
                                                                    )}
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        aria-label={`Tambah tautan untuk ${lookup.get(skill.taxonomy_id) ?? 'keahlian'}`}
                                                                        disabled={
                                                                            skill
                                                                                .evidence_metadata
                                                                                .length >=
                                                                            10
                                                                        }
                                                                        onClick={() =>
                                                                            changeSkill(
                                                                                index,
                                                                                {
                                                                                    evidence_metadata:
                                                                                        [
                                                                                            ...(skill.evidence_metadata ??
                                                                                                []),
                                                                                            {
                                                                                                title: '',
                                                                                                url: '',
                                                                                            },
                                                                                        ],
                                                                                },
                                                                            )
                                                                        }
                                                                    >
                                                                        <Plus aria-hidden="true" />
                                                                        Tambah
                                                                        tautan
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </details>
                                                    </article>
                                                ),
                                            )}
                                        </div>
                                        <div className="space-y-4 border-t border-border pt-5">
                                            <h3 className="text-lg font-semibold">
                                                Minat belajar dan kolaborasi
                                            </h3>
                                            <p className="text-sm leading-6 text-muted-foreground">
                                                Minat tidak berarti kamu sudah
                                                menguasainya. Maksimal 20
                                                pilihan.
                                            </p>
                                            <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                                                <div className="space-y-2">
                                                    <Label htmlFor="capability-interest-choice">
                                                        Pilih minat
                                                    </Label>
                                                    <select
                                                        id="capability-interest-choice"
                                                        value={interestChoice}
                                                        onChange={(e) =>
                                                            setInterestChoice(
                                                                e.target.value,
                                                            )
                                                        }
                                                        className={selectClass}
                                                    >
                                                        <option value="">
                                                            Pilih dari katalog
                                                        </option>
                                                        {taxonomies
                                                            .filter(
                                                                (t) =>
                                                                    t.category ===
                                                                        'interest' &&
                                                                    !form.data.interests.includes(
                                                                        t.id,
                                                                    ),
                                                            )
                                                            .map((t) => (
                                                                <option
                                                                    key={t.id}
                                                                    value={t.id}
                                                                >
                                                                    {t.name}
                                                                </option>
                                                            ))}
                                                    </select>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="sm:self-end"
                                                    disabled={
                                                        !interestChoice ||
                                                        form.data.interests
                                                            .length >= 20
                                                    }
                                                    onClick={() => {
                                                        form.setData(
                                                            'interests',
                                                            [
                                                                ...form.data
                                                                    .interests,
                                                                Number(
                                                                    interestChoice,
                                                                ),
                                                            ],
                                                        );
                                                        setInterestChoice('');
                                                        focusSelector(
                                                            'capability-interest-choice',
                                                        );
                                                    }}
                                                >
                                                    <Plus aria-hidden="true" />
                                                    Tambah minat
                                                </Button>
                                            </div>
                                            {taxonomies.filter(
                                                (t) =>
                                                    t.category === 'interest',
                                            ).length === 0 && (
                                                <p className="text-sm text-muted-foreground">
                                                    Katalog minat belum
                                                    tersedia.
                                                </p>
                                            )}
                                            <ul className="flex flex-wrap gap-2">
                                                {form.data.interests.map(
                                                    (id) => (
                                                        <li
                                                            key={id}
                                                            className="flex max-w-full min-w-0 items-center gap-2 rounded-xl border border-border bg-accent px-3"
                                                        >
                                                            <span className="text-sm wrap-anywhere">
                                                                {lookup.get(
                                                                    id,
                                                                ) ??
                                                                    'Minat tersimpan'}
                                                            </span>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                aria-label={`Hapus minat ${lookup.get(id) ?? id}`}
                                                                onClick={() => {
                                                                    form.setData(
                                                                        'interests',
                                                                        form.data.interests.filter(
                                                                            (
                                                                                value,
                                                                            ) =>
                                                                                value !==
                                                                                id,
                                                                        ),
                                                                    );
                                                                    focusSelector(
                                                                        'capability-interest-choice',
                                                                    );
                                                                }}
                                                            >
                                                                <Trash2
                                                                    aria-hidden="true"
                                                                    className="size-4"
                                                                />
                                                            </Button>
                                                        </li>
                                                    ),
                                                )}
                                            </ul>
                                            <InputError
                                                message={errors.interests}
                                            />
                                        </div>
                                    </section>
                                    <section className={sectionClass}>
                                        <div className="space-y-2">
                                            <h2 className="text-xl font-bold">
                                                Waktu untuk berkolaborasi
                                            </h2>
                                            <p className="text-sm leading-6 text-muted-foreground">
                                                Tambahkan waktu yang benar-benar
                                                memungkinkan. Jadwal boleh
                                                kosong; pencocokan waktu belum
                                                siap sampai kamu mengisinya.
                                                Maksimal 14 baris.
                                            </p>
                                        </div>
                                        <InputError
                                            message={
                                                errors.availability_windows
                                            }
                                        />
                                        {form.data.availability_windows
                                            .length === 0 && (
                                            <p className="text-sm text-muted-foreground">
                                                Belum ada jadwal. Kamu tetap
                                                dapat menyimpan profil dan
                                                menelusuri peluang.
                                            </p>
                                        )}
                                        <div className="space-y-4">
                                            {form.data.availability_windows.map(
                                                (window, index) => {
                                                    const changeWindow = (
                                                        patch: Partial<
                                                            typeof window
                                                        >,
                                                    ) =>
                                                        form.setData(
                                                            'availability_windows',
                                                            form.data.availability_windows.map(
                                                                (
                                                                    item,
                                                                    position,
                                                                ) =>
                                                                    position ===
                                                                    index
                                                                        ? {
                                                                              ...item,
                                                                              ...patch,
                                                                          }
                                                                        : item,
                                                            ),
                                                        );

                                                    return (
                                                        <div
                                                            key={index}
                                                            className="min-w-0 space-y-4 rounded-2xl border border-border bg-background/70 p-4"
                                                        >
                                                            <div className="flex items-center justify-between gap-2">
                                                                <h3 className="font-semibold">
                                                                    Jadwal{' '}
                                                                    {index + 1}
                                                                </h3>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    aria-label={`Hapus jadwal ${index + 1}`}
                                                                    onClick={() => {
                                                                        form.setData(
                                                                            'availability_windows',
                                                                            form.data.availability_windows.filter(
                                                                                (
                                                                                    _,
                                                                                    position,
                                                                                ) =>
                                                                                    position !==
                                                                                    index,
                                                                            ),
                                                                        );
                                                                        focusSelector(
                                                                            'capability-add-window',
                                                                        );
                                                                    }}
                                                                >
                                                                    <Trash2 aria-hidden="true" />
                                                                </Button>
                                                            </div>
                                                            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                                                                {(
                                                                    [
                                                                        'day_of_week',
                                                                        'starts_at',
                                                                        'ends_at',
                                                                        'timezone',
                                                                    ] as const
                                                                ).map(
                                                                    (field) => {
                                                                        const id = `window-${index}-${field}`,
                                                                            key = `availability_windows.${index}.${field}`;

                                                                        return (
                                                                            <div
                                                                                key={
                                                                                    field
                                                                                }
                                                                                className="min-w-0 space-y-2"
                                                                            >
                                                                                <Label
                                                                                    htmlFor={
                                                                                        id
                                                                                    }
                                                                                >
                                                                                    {field ===
                                                                                    'day_of_week'
                                                                                        ? 'Hari'
                                                                                        : field ===
                                                                                            'starts_at'
                                                                                          ? 'Mulai'
                                                                                          : field ===
                                                                                              'ends_at'
                                                                                            ? 'Selesai'
                                                                                            : 'Zona waktu'}
                                                                                </Label>
                                                                                {field ===
                                                                                'day_of_week' ? (
                                                                                    <select
                                                                                        id={
                                                                                            id
                                                                                        }
                                                                                        value={
                                                                                            window[
                                                                                                field
                                                                                            ]
                                                                                        }
                                                                                        className={
                                                                                            selectClass
                                                                                        }
                                                                                        onChange={(
                                                                                            e,
                                                                                        ) =>
                                                                                            changeWindow(
                                                                                                {
                                                                                                    day_of_week:
                                                                                                        Number(
                                                                                                            e
                                                                                                                .target
                                                                                                                .value,
                                                                                                        ),
                                                                                                },
                                                                                            )
                                                                                        }
                                                                                        aria-invalid={Boolean(
                                                                                            errors[
                                                                                                key
                                                                                            ],
                                                                                        )}
                                                                                        aria-describedby={`${id}-error`}
                                                                                    >
                                                                                        {days.map(
                                                                                            (
                                                                                                day,
                                                                                                value,
                                                                                            ) => (
                                                                                                <option
                                                                                                    key={
                                                                                                        value
                                                                                                    }
                                                                                                    value={
                                                                                                        value
                                                                                                    }
                                                                                                >
                                                                                                    {
                                                                                                        day
                                                                                                    }
                                                                                                </option>
                                                                                            ),
                                                                                        )}
                                                                                    </select>
                                                                                ) : (
                                                                                    <Input
                                                                                        id={
                                                                                            id
                                                                                        }
                                                                                        type={
                                                                                            field ===
                                                                                            'timezone'
                                                                                                ? 'text'
                                                                                                : 'time'
                                                                                        }
                                                                                        step={
                                                                                            field ===
                                                                                            'timezone'
                                                                                                ? undefined
                                                                                                : 1
                                                                                        }
                                                                                        className="max-w-full min-w-0"
                                                                                        value={
                                                                                            window[
                                                                                                field
                                                                                            ]
                                                                                        }
                                                                                        required
                                                                                        onChange={(
                                                                                            e,
                                                                                        ) =>
                                                                                            changeWindow(
                                                                                                {
                                                                                                    [field]:
                                                                                                        e
                                                                                                            .target
                                                                                                            .value,
                                                                                                },
                                                                                            )
                                                                                        }
                                                                                        aria-invalid={Boolean(
                                                                                            errors[
                                                                                                key
                                                                                            ],
                                                                                        )}
                                                                                        aria-describedby={`${id}-error`}
                                                                                    />
                                                                                )}
                                                                                <InputError
                                                                                    id={`${id}-error`}
                                                                                    message={
                                                                                        errors[
                                                                                            key
                                                                                        ]
                                                                                    }
                                                                                />
                                                                            </div>
                                                                        );
                                                                    },
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                },
                                            )}
                                        </div>
                                        <Button
                                            id="capability-add-window"
                                            type="button"
                                            variant="outline"
                                            disabled={
                                                form.data.availability_windows
                                                    .length >= 14
                                            }
                                            onClick={() => {
                                                const index =
                                                    form.data
                                                        .availability_windows
                                                        .length;
                                                form.setData(
                                                    'availability_windows',
                                                    [
                                                        ...form.data
                                                            .availability_windows,
                                                        {
                                                            day_of_week: 1,
                                                            starts_at: '09:00',
                                                            ends_at: '11:00',
                                                            timezone:
                                                                institution?.timezone ??
                                                                'Asia/Jakarta',
                                                        },
                                                    ],
                                                );
                                                focusSelector(
                                                    `window-${index}-day_of_week`,
                                                );
                                            }}
                                        >
                                            <Plus aria-hidden="true" />
                                            Tambah jadwal
                                        </Button>
                                    </section>
                                </fieldset>
                                <footer className="space-y-3 rounded-3xl border border-primary/15 bg-linear-to-br from-card to-accent/50 p-5 shadow-sm">
                                    <div className="flex flex-wrap gap-3">
                                        <Button
                                            type="submit"
                                            disabled={busy || mustReconcile}
                                            data-test="capability-save"
                                        >
                                            {form.processing
                                                ? 'Menyimpan profil...'
                                                : 'Simpan profil kemampuan'}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={busy}
                                            onClick={reloadProfile}
                                        >
                                            <RefreshCw aria-hidden="true" />
                                            Muat data tersimpan
                                        </Button>
                                        <Button asChild variant="ghost">
                                            <Link
                                                href={projectsIndex({
                                                    query: {
                                                        institution_id:
                                                            institution?.id,
                                                    },
                                                })}
                                            >
                                                Jelajahi peluang
                                            </Link>
                                        </Button>
                                    </div>
                                    <p
                                        role="status"
                                        className="min-h-5 text-sm leading-6 text-muted-foreground"
                                    >
                                        {form.processing
                                            ? 'Profil dan jadwal sedang disimpan. Tunggu konfirmasi server.'
                                            : (message ??
                                              (form.isDirty
                                                  ? 'Ada perubahan yang belum disimpan.'
                                                  : savedProfile
                                                    ? 'Menampilkan profil tersimpan.'
                                                    : 'Profil belum tersimpan.'))}
                                    </p>
                                    <p className="text-xs leading-5 text-muted-foreground">
                                        Simpan kemampuan tidak mengubah
                                        jangkauan portofolio atau izin perekrut.
                                    </p>
                                </footer>
                            </form>
                            <aside
                                className="min-w-0 space-y-5"
                                aria-label="Kesiapan dan sumber kemampuan"
                            >
                                <section className="space-y-4 rounded-3xl border border-primary/15 bg-accent/60 p-5">
                                    <Clock3
                                        aria-hidden="true"
                                        className="text-primary"
                                    />
                                    <h2 className="text-lg font-bold">
                                        Mulai tanpa karya
                                    </h2>
                                    <p className="text-sm leading-6 text-muted-foreground">
                                        Tidak ada syarat karya terdahulu, jumlah
                                        relasi, XP atau kontribusi disetujui
                                        untuk menelusuri peluang.
                                    </p>
                                    <p className="text-sm font-semibold">
                                        {savedProfile === null
                                            ? 'Profil belum tersimpan'
                                            : missing.length === 0
                                              ? 'Bekal pencocokan tersedia'
                                              : `Profil tersimpan. Lengkapi ${missing.join(' dan ')} untuk pencocokan.`}
                                    </p>
                                    <p className="text-xs leading-5 text-muted-foreground">
                                        Kesiapan bukan validasi kompetensi atau
                                        jaminan diterima tim. Profil tidak
                                        menghitung rekomendasi baru secara
                                        otomatis.
                                    </p>
                                </section>
                                {refreshing && (
                                    <section
                                        aria-busy="true"
                                        aria-label="Memuat profil tersimpan"
                                        className="space-y-3"
                                    >
                                        <p role="status" className="text-sm">
                                            Memuat data profil...
                                        </p>
                                        <Skeleton className="h-6 w-3/4" />
                                        <Skeleton className="h-20 w-full rounded-2xl" />
                                    </section>
                                )}
                                <section className="space-y-4 border-t border-border pt-5">
                                    <h2 className="flex items-center gap-2 text-lg font-bold">
                                        <LockKeyhole
                                            aria-hidden="true"
                                            className="size-5 text-primary"
                                        />
                                        Bukti pribadi tersimpan
                                    </h2>
                                    <p className="text-xs leading-5 text-muted-foreground">
                                        Tautan awal belum ditinjau dan tidak
                                        dibagikan ke kampus, tim, perekrut atau
                                        publik. Akses di situs tujuan tetap
                                        diatur penyedianya.
                                    </p>
                                    <ul className="space-y-3">
                                        {savedProfile?.skills.flatMap((skill) =>
                                            (
                                                editableEvidence(
                                                    skill.evidence_metadata,
                                                ) ?? []
                                            )
                                                .filter((evidence) =>
                                                    safeEvidenceUrl(
                                                        evidence.url,
                                                    ),
                                                )
                                                .map((evidence, index) => (
                                                    <li
                                                        key={`${skill.taxonomy_id}-${index}`}
                                                        className="min-w-0 rounded-2xl border border-border bg-card p-4"
                                                    >
                                                        <p className="text-xs text-muted-foreground">
                                                            Belum ditinjau.{' '}
                                                            {skill.name}
                                                        </p>
                                                        <a
                                                            href={evidence.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="mt-2 inline-flex min-h-11 max-w-full cursor-pointer items-center gap-2 rounded-lg text-sm font-semibold wrap-anywhere text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                                                        >
                                                            {evidence.title}
                                                            <ExternalLink
                                                                aria-hidden="true"
                                                                className="size-4 shrink-0"
                                                            />
                                                            <span className="sr-only">
                                                                {' '}
                                                                (situs
                                                                eksternal, tab
                                                                baru)
                                                            </span>
                                                        </a>
                                                    </li>
                                                )),
                                        )}
                                    </ul>
                                    {!savedProfile?.skills.some(
                                        (skill) =>
                                            editableEvidence(
                                                skill.evidence_metadata,
                                            )?.length,
                                    ) && (
                                        <p className="text-sm text-muted-foreground">
                                            Belum ada tautan awal yang dapat
                                            ditampilkan. Bukti tidak wajib.
                                        </p>
                                    )}
                                </section>
                                <section className="space-y-4 border-t border-border pt-5">
                                    <h2 className="flex items-center gap-2 text-lg font-bold">
                                        <BookOpenCheck
                                            aria-hidden="true"
                                            className="size-5 text-primary"
                                        />
                                        Sumber kontribusi
                                    </h2>
                                    <p className="text-xs leading-5 text-muted-foreground">
                                        Maksimal lima kontribusi disetujui
                                        terbaru. Persetujuan berlaku pada
                                        kontribusi tersebut, bukan seluruh
                                        keahlian pemilik.
                                    </p>
                                    {approvedSources.length === 0 ? (
                                        <div className="rounded-2xl border border-dashed border-border p-4">
                                            <DashboardArchiveArt className="mb-3 w-20" />
                                            <p className="text-sm leading-6 text-muted-foreground">
                                                Belum ada kontribusi disetujui.
                                                Ini bukan penghalang untuk mulai
                                                mencari peran.
                                            </p>
                                        </div>
                                    ) : (
                                        <ul className="space-y-3">
                                            {approvedSources.map((source) => (
                                                <li
                                                    key={source.id}
                                                    className="space-y-2 rounded-2xl border border-border bg-card p-4"
                                                >
                                                    <h3 className="font-semibold wrap-anywhere">
                                                        {source.title}
                                                    </h3>
                                                    <p className="flex items-start gap-2 text-xs leading-5">
                                                        <CheckCircle2
                                                            aria-hidden="true"
                                                            className="size-4 shrink-0 text-primary"
                                                        />
                                                        {
                                                            source.verification_label
                                                        }
                                                        . Versi {source.version}
                                                    </p>
                                                    {source.can_view && (
                                                        <Link
                                                            href={showContribution(
                                                                source.id,
                                                            )}
                                                            className="inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-primary hover:underline focus-visible:rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                                                        >
                                                            Baca kontribusi
                                                        </Link>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </section>
                            </aside>
                        </div>
                    )}
                </div>
            </AppPage>
            <Dialog
                open={confirmation !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        settleConfirmation(false);
                    }
                }}
            >
                <DialogContent
                    onCloseAutoFocus={(event) => {
                        event.preventDefault();
                        requestAnimationFrame(() => {
                            if (confirmationFocus.current?.isConnected) {
                                confirmationFocus.current.focus();
                            } else {
                                document
                                    .getElementById('capability-skill-choice')
                                    ?.focus();
                            }
                        });
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>Konfirmasi perubahan draft</DialogTitle>
                        <DialogDescription>{confirmation}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => settleConfirmation(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            onClick={() => settleConfirmation(true)}
                        >
                            Lanjutkan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

const capabilityLayout: LayoutCallback = () => [
    StudentLayout,
    { breadcrumbs: [{ title: 'Profil kemampuan', href: edit() }] },
];
CapabilityProfilePage.layout = capabilityLayout;
