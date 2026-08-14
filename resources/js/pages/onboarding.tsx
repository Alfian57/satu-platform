import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ArrowRight,
    Building2,
    Check,
    CheckCircle2,
    CircleAlert,
    CircleDashed,
    Clock3,
    Eye,
    GraduationCap,
    LockKeyhole,
    LogIn,
    Phone,
    RefreshCw,
    RotateCcw,
    Shield,
    ShieldCheck,
    Sparkles,
    User,
    WifiOff,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import AlertError from '@/components/alert-error';
import { AppPage } from '@/components/app-page';
import InputError from '@/components/input-error';
import { OnboardingProfile } from '@/components/onboarding-profile';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { dashboard, login } from '@/routes';
import { store } from '@/routes/institution-memberships';
import { show as onboarding } from '@/routes/onboarding';
import type {
    OnboardingAffiliation,
    OnboardingMembership,
    OnboardingMembershipStatus,
    OnboardingPageProps,
    OnboardingPhone,
} from '@/types';

const statusCopy: Record<
    OnboardingMembershipStatus,
    {
        label: string;
        title: string;
        description: string;
        icon: typeof CheckCircle2;
        className: string;
        badgeClassName: string;
    }
> = {
    unverified: {
        label: 'Perlu diajukan kembali',
        title: 'Afiliasimu belum terverifikasi',
        description:
            'Pilih kampus yang sesuai untuk mengirim permintaan afiliasi baru.',
        icon: CircleAlert,
        className: 'border-rose-200 bg-rose-50/70 text-rose-900',
        badgeClassName: 'border-rose-200 bg-rose-50 text-rose-800',
    },
    pending: {
        label: 'Menunggu tinjauan',
        title: 'Permintaanmu sedang ditinjau',
        description:
            'Admin kampus akan memeriksa afiliasimu. Fitur akun tetap dapat dipakai, tetapi rekam kontribusi belum dapat diverifikasi institusi sampai afiliasi disetujui.',
        icon: Clock3,
        className: 'border-amber-200 bg-amber-50/70 text-amber-900',
        badgeClassName: 'border-amber-200 bg-amber-50 text-amber-800',
    },
    verified: {
        label: 'Terverifikasi',
        title: 'Afiliasi kampusmu terverifikasi',
        description:
            'Identitas kampusmu sudah terhubung dan dapat menjadi dasar rekam kontribusi terverifikasi.',
        icon: CheckCircle2,
        className: 'border-emerald-200 bg-emerald-50/70 text-emerald-900',
        badgeClassName: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    },
    suspended: {
        label: 'Akses ditangguhkan',
        title: 'Afiliasimu sedang ditangguhkan',
        description:
            'Permintaan baru tidak dapat dikirim dari halaman ini. Hubungi pengelola kampus untuk tindak lanjut.',
        icon: LockKeyhole,
        className: 'border-slate-200 bg-slate-100 text-slate-900',
        badgeClassName: 'border-slate-200 bg-slate-100 text-slate-800',
    },
};

const outcomeAnnouncements: Record<OnboardingMembershipStatus, string> = {
    unverified: 'Afiliasi kampus belum terverifikasi.',
    pending: 'Permintaan afiliasi berhasil dikirim dan menunggu tinjauan.',
    verified: 'Afiliasi kampus berhasil diverifikasi.',
    suspended: 'Akses afiliasi kampus sedang ditangguhkan.',
};

type SubmissionIssue =
    | 'network'
    | 'session_expired'
    | 'forbidden'
    | 'phone_required'
    | 'rate_limited'
    | 'server';

const submissionIssueCopy: Record<
    SubmissionIssue,
    {
        title: string;
        description: string;
        action: string;
        icon: typeof CircleAlert;
    }
> = {
    network: {
        title: 'Permintaan belum terkirim',
        description:
            'Koneksi terputus sebelum permintaan selesai. Pilihan kampusmu tetap tersimpan. Sambungkan kembali internet, lalu coba kirim lagi.',
        action: 'Coba kirim lagi',
        icon: WifiOff,
    },
    session_expired: {
        title: 'Sesi halaman sudah berakhir',
        description:
            'Permintaan belum diproses dan pilihan kampusmu tetap tersimpan. Masuk kembali untuk melanjutkan dengan sesi yang aman.',
        action: 'Masuk kembali',
        icon: LogIn,
    },
    forbidden: {
        title: 'Izin afiliasi berubah',
        description:
            'Permintaan tidak diproses. Pilihan kampusmu tetap tersimpan. Periksa akses terbaru sebelum mencoba kembali.',
        action: 'Periksa akses lagi',
        icon: LockKeyhole,
    },
    phone_required: {
        title: 'Nomor WhatsApp belum terverifikasi',
        description:
            'Pencocokan afiliasi memerlukan nomor WhatsApp terverifikasi milikmu. Selesaikan verifikasi nomor, lalu periksa kembali halaman ini.',
        action: 'Periksa status nomor',
        icon: ShieldCheck,
    },
    rate_limited: {
        title: 'Terlalu banyak percobaan',
        description:
            'Permintaan tambahan belum diproses. Pilihan kampusmu tetap tersimpan. Tunggu sebentar sebelum mencoba lagi.',
        action: 'Coba lagi',
        icon: Clock3,
    },
    server: {
        title: 'Layanan belum dapat memproses permintaan',
        description:
            'Pilihan kampusmu tetap tersimpan. Coba kirim lagi atau lanjutkan ke dashboard untuk sementara.',
        action: 'Coba kirim lagi',
        icon: CircleAlert,
    },
};

function SubmissionRecovery({
    issue,
    processing,
    onRetry,
}: {
    issue: SubmissionIssue;
    processing: boolean;
    onRetry: () => void;
}) {
    const copy = submissionIssueCopy[issue];
    const IssueIcon = copy.icon;

    return (
        <Alert
            className="rounded-2xl border-amber-200 bg-amber-50/80 p-4.5 text-amber-900 shadow-xs"
            data-test="onboarding-submission-recovery"
        >
            <IssueIcon className="size-5 text-amber-600" aria-hidden="true" />
            <AlertTitle className="text-sm font-bold text-amber-950">
                {copy.title}
            </AlertTitle>
            <AlertDescription className="mt-1 text-xs leading-relaxed text-amber-900">
                <p>{copy.description}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2.5">
                    {issue === 'session_expired' ? (
                        <Button
                            asChild
                            size="sm"
                            className="cursor-pointer rounded-xl bg-amber-700 text-xs font-semibold text-white hover:bg-amber-800"
                        >
                            <Link href={login()}>
                                <LogIn className="mr-1.5 size-3.5" />
                                {copy.action}
                            </Link>
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            size="sm"
                            className="cursor-pointer rounded-xl bg-amber-700 text-xs font-semibold text-white hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={processing}
                            onClick={
                                issue === 'forbidden' ||
                                issue === 'phone_required'
                                    ? () => router.reload()
                                    : onRetry
                            }
                        >
                            <RefreshCw className="mr-1.5 size-3.5" />
                            {copy.action}
                        </Button>
                    )}
                    <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="cursor-pointer rounded-xl text-xs font-semibold text-amber-900 hover:bg-amber-100/60"
                    >
                        <Link href={dashboard()}>Lanjutkan ke dashboard</Link>
                    </Button>
                </div>
            </AlertDescription>
        </Alert>
    );
}

function ProgressRail({
    affiliationVerified,
    profileId,
}: {
    affiliationVerified: boolean;
    profileId: number | null;
}) {
    const completedCount =
        2 + (affiliationVerified ? 1 : 0) + (profileId !== null ? 1 : 0);
    const totalCount = 4;

    return (
        <div className="grid gap-6">
            {/* Card 1: Progres Onboarding */}
            <section
                aria-labelledby="progress-title"
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs"
            >
                <div className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <GraduationCap
                            className="size-3.5"
                            aria-hidden="true"
                        />
                    </span>
                    <p className="font-label text-xs font-bold tracking-[0.1em] text-slate-500 uppercase">
                        PROGRES ONBOARDING
                    </p>
                </div>

                <div className="mt-3 flex items-baseline justify-between gap-4">
                    <h2
                        id="progress-title"
                        className="text-base font-bold tracking-tight text-slate-950"
                    >
                        {completedCount} dari {totalCount} selesai
                    </h2>
                    <span
                        aria-hidden="true"
                        className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 font-mono text-xs font-bold text-blue-700"
                    >
                        {Math.round((completedCount / totalCount) * 100)}%
                    </span>
                </div>

                <div
                    aria-label={`${completedCount} dari ${totalCount} tahap onboarding selesai`}
                    className="mt-3.5 grid grid-cols-4 gap-1.5"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={totalCount}
                    aria-valuenow={completedCount}
                >
                    {Array.from(
                        { length: totalCount },
                        (_, index) => index + 1,
                    ).map((step) => (
                        <span
                            key={step}
                            className={cn(
                                'h-2 rounded-full transition-all duration-300',
                                step <= completedCount
                                    ? 'bg-blue-600 shadow-xs'
                                    : 'bg-slate-100',
                            )}
                        />
                    ))}
                </div>

                <ol className="mt-5 divide-y divide-slate-100 border-t border-slate-100 text-xs">
                    <ProgressRow
                        complete
                        label="Akun SATU"
                        detail="Akun sudah dibuat"
                    />
                    <ProgressRow
                        complete
                        label="Username"
                        detail="Username sudah ditetapkan"
                    />
                    <ProgressRow
                        complete={affiliationVerified}
                        label="Afiliasi kampus"
                        detail={
                            affiliationVerified
                                ? 'Kampus sudah terverifikasi'
                                : 'Masih perlu diselesaikan'
                        }
                    />
                    <ProgressRow
                        complete={profileId !== null}
                        label="Profil mahasiswa"
                        detail={
                            profileId !== null
                                ? 'Profil sudah tersimpan, masih bisa dilengkapi'
                                : 'Belum dibuat'
                        }
                    />
                </ol>
            </section>

            {/* Card 2: Keamanan & Privasi */}
            <section
                aria-labelledby="privacy-title"
                className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-indigo-50/40 p-4.5"
            >
                <div className="flex items-start gap-3">
                    <ShieldCheck
                        aria-hidden="true"
                        className="mt-0.5 size-4.5 shrink-0 text-blue-600"
                    />
                    <div>
                        <h2
                            id="privacy-title"
                            className="text-xs font-bold text-blue-900"
                        >
                            Kendali tetap padamu
                        </h2>
                        <div className="mt-2 space-y-2 text-xs leading-relaxed text-blue-800/80">
                            <div className="flex items-start gap-2">
                                <LockKeyhole
                                    aria-hidden="true"
                                    className="mt-0.5 size-3.5 shrink-0 text-blue-600"
                                />
                                <p className="leading-relaxed">
                                    Permintaan ini hanya menghubungkan akun
                                    dengan kampus.{' '}
                                    {'Data portofolio belum dibagikan.'}
                                </p>
                            </div>
                            <div className="flex items-start gap-2">
                                <Eye
                                    aria-hidden="true"
                                    className="mt-0.5 size-3.5 shrink-0 text-blue-600"
                                />
                                <p className="leading-relaxed">
                                    {'Pengaturan visibilitas dan persetujuan'}{' '}
                                    akan dijelaskan saat data profil mulai
                                    dilengkapi.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

function ProgressRow({
    complete,
    label,
    detail,
}: {
    complete: boolean;
    label: string;
    detail: string;
}) {
    return (
        <li className="flex items-start gap-3 py-3">
            {complete ? (
                <span className="mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <Check aria-hidden="true" className="size-3" />
                </span>
            ) : (
                <span className="mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <CircleDashed aria-hidden="true" className="size-3" />
                </span>
            )}
            <div className="min-w-0">
                <p
                    className={cn(
                        'text-xs font-bold',
                        complete ? 'text-slate-900' : 'text-slate-600',
                    )}
                >
                    {label}
                </p>
                <p className="mt-0.5 text-[0.6875rem] leading-relaxed text-slate-500">
                    {detail}
                </p>
            </div>
        </li>
    );
}

function MembershipFacts({
    username,
    membership,
    phone,
    affiliation,
}: {
    username: string;
    membership: OnboardingMembership | null;
    phone: OnboardingPhone | null;
    affiliation: OnboardingAffiliation | null;
}) {
    return (
        <div className="grid gap-3 sm:grid-cols-2">
            {/* Box 1: Username */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition-all duration-200 hover:border-blue-200">
                <div className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <User className="size-3.5" />
                    </span>
                    <span className="font-label text-[0.6875rem] font-bold tracking-wider text-slate-500 uppercase">
                        Username
                    </span>
                </div>
                <p className="mt-2.5 font-mono text-sm font-bold break-all text-slate-900">
                    @{username}
                </p>
            </div>

            {/* Box 2: Nomor WhatsApp */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition-all duration-200 hover:border-blue-200">
                <div className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                        <Phone className="size-3.5" />
                    </span>
                    <span className="font-label text-[0.6875rem] font-bold tracking-wider text-slate-500 uppercase">
                        Nomor WhatsApp
                    </span>
                </div>
                <div className="mt-2.5 flex items-center gap-2">
                    <p className="font-mono text-sm font-bold text-slate-900">
                        {phone?.verified
                            ? `${phone.masked} (terverifikasi)`
                            : 'Belum terverifikasi'}
                    </p>
                </div>
            </div>

            {/* Box 3: Kampus */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition-all duration-200 hover:border-blue-200">
                <div className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                        <Building2 className="size-3.5" />
                    </span>
                    <span className="font-label text-[0.6875rem] font-bold tracking-wider text-slate-500 uppercase">
                        Kampus
                    </span>
                </div>
                <p className="mt-2.5 text-sm font-bold [overflow-wrap:anywhere] text-slate-900">
                    {membership?.institutionName ?? 'Belum dipilih'}
                </p>
            </div>

            {/* Box 4: Status Verifikasi */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition-all duration-200 hover:border-blue-200">
                <div className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                        <Shield className="size-3.5" />
                    </span>
                    <span className="font-label text-[0.6875rem] font-bold tracking-wider text-slate-500 uppercase">
                        Verifikasi
                    </span>
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <span
                        className={cn(
                            'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                            membership
                                ? statusCopy[membership.status].badgeClassName
                                : 'border-slate-200 bg-slate-100 text-slate-700',
                        )}
                    >
                        {membership
                            ? statusCopy[membership.status].label
                            : 'Belum diajukan'}
                    </span>
                    {affiliation?.needsRefresh && (
                        <span className="text-xs font-semibold text-rose-600">
                            (perlu diperbarui)
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function Onboarding({
    account,
    institutions,
    membership,
    studentProfileId,
    affiliation,
    phone,
    canRequest,
    canRetry,
    membershipOutcome,
    affiliationOutcome,
    submissionIssue: initialSubmissionIssue,
}: OnboardingPageProps) {
    const errorSummary = useRef<HTMLDivElement>(null);
    const recoverySummary = useRef<HTMLDivElement>(null);
    const submitting = useRef(false);
    const focusRequestSequence = useRef(0);
    const [focusRequest, setFocusRequest] = useState<{
        target: 'error' | 'recovery';
        sequence: number;
    } | null>(null);
    const [submissionIssue, setSubmissionIssue] =
        useState<SubmissionIssue | null>(initialSubmissionIssue);
    const [profileIdForRail, setProfileIdForRail] = useState<number | null>(
        studentProfileId,
    );
    const form = useForm<{ institution_id: number | ''; nim: string }>({
        institution_id:
            (canRetry || initialSubmissionIssue === 'forbidden') &&
            membership &&
            institutions.some(
                (institution) => institution.id === membership.institutionId,
            )
                ? membership.institutionId
                : '',
        nim: '',
    });
    const hasErrors = Object.keys(form.errors).length > 0;
    const isVerified = membership?.status === 'verified';
    const status = membership ? statusCopy[membership.status] : null;
    const StatusIcon = status?.icon ?? Building2;
    const showRequestForm = canRequest || submissionIssue === 'forbidden';

    useEffect(() => {
        const frame = requestAnimationFrame(() => {
            setSubmissionIssue(initialSubmissionIssue);

            if (initialSubmissionIssue !== null) {
                setFocusRequest({
                    target: 'recovery',
                    sequence: ++focusRequestSequence.current,
                });
            }
        });

        return () => cancelAnimationFrame(frame);
    }, [initialSubmissionIssue]);

    useEffect(() => {
        if (focusRequest === null) {
            return;
        }

        let secondFrame: number | null = null;
        const firstFrame = requestAnimationFrame(() => {
            secondFrame = requestAnimationFrame(() => {
                const summary =
                    focusRequest.target === 'error'
                        ? errorSummary.current
                        : recoverySummary.current;

                summary?.focus();
                summary?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                });
            });
        });

        return () => {
            cancelAnimationFrame(firstFrame);

            if (secondFrame !== null) {
                cancelAnimationFrame(secondFrame);
            }
        };
    }, [focusRequest, hasErrors, submissionIssue]);

    function focusRecovery(issue: SubmissionIssue) {
        setSubmissionIssue(issue);
        setFocusRequest({
            target: 'recovery',
            sequence: ++focusRequestSequence.current,
        });
    }

    function requestMembership() {
        if (submitting.current || form.processing) {
            return;
        }

        submitting.current = true;
        setSubmissionIssue(null);
        form.submit(store(), {
            preserveScroll: true,
            onError: () => {
                setFocusRequest({
                    target: 'error',
                    sequence: ++focusRequestSequence.current,
                });
            },
            onNetworkError: () => {
                focusRecovery('network');

                return false;
            },
            onHttpException: (response) => {
                if (response.status === 401 || response.status === 419) {
                    focusRecovery('session_expired');
                } else if (response.status === 403) {
                    focusRecovery('forbidden');
                } else if (response.status === 429) {
                    focusRecovery('rate_limited');
                } else {
                    focusRecovery('server');
                }

                return false;
            },
            onFinish: () => {
                submitting.current = false;
            },
        });
    }

    function submitMembership(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        requestMembership();
    }

    return (
        <>
            <Head title="Afiliasi kampus" />
            <AppPage
                contextRail={
                    <ProgressRail
                        affiliationVerified={isVerified}
                        profileId={profileIdForRail}
                    />
                }
                contextRailLabel="Progres dan privasi onboarding"
            >
                <div
                    className="mx-auto w-full max-w-4xl space-y-6"
                    data-membership-state={membership?.status ?? 'empty'}
                    data-test="onboarding-root"
                >
                    {membershipOutcome && (
                        <p
                            className="sr-only"
                            role="status"
                            aria-live="polite"
                            data-test="membership-outcome-announcement"
                        >
                            {outcomeAnnouncements[membershipOutcome]}
                        </p>
                    )}
                    {affiliationOutcome && (
                        <p className="sr-only" role="status" aria-live="polite">
                            {affiliationOutcome === 'verified'
                                ? 'Afiliasi kampus berhasil diverifikasi.'
                                : 'Status permintaan afiliasi berhasil diperbarui.'}
                        </p>
                    )}
                    <p className="sr-only" role="status" aria-live="polite">
                        {form.processing
                            ? 'Permintaan afiliasi sedang dikirim.'
                            : ''}
                    </p>

                    {/* Header Banner */}
                    <header className="relative isolate overflow-hidden rounded-2xl border border-blue-100 bg-white px-6 py-6 shadow-[0_18px_50px_-36px_rgba(30,64,175,0.35)] sm:px-8 sm:py-7">
                        <div
                            aria-hidden="true"
                            className="absolute -top-28 -right-24 size-80 rounded-full bg-blue-100/75 blur-3xl sm:-right-12"
                        />
                        <div
                            aria-hidden="true"
                            className="absolute right-14 bottom-0 hidden h-24 w-24 rounded-tl-[2.5rem] border-t border-l border-blue-100 sm:block"
                        />

                        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
                                    <Sparkles className="size-3 text-blue-600" />
                                    Catatan pendaftaran
                                </div>

                                <h1 className="mt-3 text-2xl font-bold tracking-[-0.035em] text-slate-950 sm:text-3xl">
                                    Hubungkan akunmu dengan kampus
                                </h1>

                                <p className="mt-2 max-w-[65ch] text-sm leading-relaxed text-slate-600">
                                    Afiliasi kampus terpisah dari akun SATU.
                                    Kampus yang terverifikasi dapat menjadi
                                    sumber validasi untuk kontribusimu nanti.
                                </p>
                            </div>

                            {membership && (
                                <div
                                    className={cn(
                                        'flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold',
                                        status?.badgeClassName ??
                                            'border-slate-200 bg-slate-50 text-slate-700',
                                    )}
                                >
                                    <StatusIcon className="size-4" />
                                    <span>{status?.label}</span>
                                </div>
                            )}
                        </div>
                    </header>

                    {/* Main Bento Section: Afiliasi Kampus */}
                    <section
                        aria-labelledby="affiliation-title"
                        className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs"
                    >
                        <div className="grid md:grid-cols-[14rem_minmax(0,1fr)]">
                            {/* Left Status Pillar */}
                            <div
                                className={cn(
                                    'flex items-center gap-3.5 border-b p-6 md:flex-col md:items-start md:border-r md:border-b-0 md:p-7',
                                    status?.className ??
                                        'border-slate-100 bg-slate-50/60 text-slate-700',
                                )}
                            >
                                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/80 shadow-xs ring-1 ring-black/5">
                                    <StatusIcon
                                        aria-hidden="true"
                                        className="size-5.5 text-current"
                                    />
                                </div>
                                <div>
                                    <p className="font-label text-[0.6875rem] font-bold tracking-wider text-slate-500 uppercase">
                                        Status Afiliasi
                                    </p>
                                    <p className="mt-0.5 text-sm font-bold text-slate-950">
                                        {status?.label ?? 'Belum terhubung'}
                                    </p>
                                </div>
                            </div>

                            {/* Right Content */}
                            <div className="min-w-0">
                                <div className="border-b border-slate-100 px-6 py-4 sm:px-7">
                                    <div className="flex items-center justify-between">
                                        <p className="font-mono text-xs font-semibold tracking-wider text-slate-400 uppercase">
                                            Afiliasi / AF-ACCOUNT
                                        </p>
                                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600">
                                            <Building2 className="size-3.5" />
                                            Perguruan Tinggi
                                        </span>
                                    </div>
                                </div>

                                <div className="px-6 py-6 sm:px-7">
                                    <h2
                                        id="affiliation-title"
                                        className="text-lg font-bold text-slate-950 sm:text-xl"
                                    >
                                        {canRetry
                                            ? 'Ajukan kembali afiliasimu'
                                            : (status?.title ??
                                              'Pilih kampus untuk melanjutkan')}
                                    </h2>
                                    <p className="mt-1.5 max-w-[62ch] text-xs leading-relaxed text-slate-600 sm:text-sm">
                                        {canRetry
                                            ? 'Data afiliasimu perlu diperbarui. Periksa kampus, masukkan ulang NIM, lalu kirim permintaan terbaru.'
                                            : (status?.description ??
                                              'Pilih institusi yang benar. Permintaanmu akan diteruskan untuk ditinjau oleh admin kampus.')}
                                    </p>
                                </div>

                                <div className="px-6 pb-6 sm:px-7">
                                    <MembershipFacts
                                        username={account.username}
                                        membership={membership}
                                        phone={phone}
                                        affiliation={affiliation}
                                    />
                                </div>

                                {submissionIssue && (
                                    <div
                                        ref={recoverySummary}
                                        tabIndex={-1}
                                        data-test="onboarding-recovery-focus"
                                        className="px-6 pb-6 sm:px-7"
                                    >
                                        <SubmissionRecovery
                                            issue={submissionIssue}
                                            processing={form.processing}
                                            onRetry={requestMembership}
                                        />
                                    </div>
                                )}

                                {showRequestForm && (
                                    <form
                                        className="grid gap-5 border-t border-slate-100 bg-slate-50/30 px-6 py-6 sm:px-7"
                                        onSubmit={submitMembership}
                                    >
                                        {hasErrors && (
                                            <div
                                                ref={errorSummary}
                                                tabIndex={-1}
                                                data-test="onboarding-error-summary"
                                            >
                                                <AlertError
                                                    title="Permintaan belum dapat dikirim"
                                                    errors={Object.values(
                                                        form.errors,
                                                    )}
                                                />
                                            </div>
                                        )}

                                        <div className="grid gap-2">
                                            <label
                                                className="text-xs font-bold text-slate-700"
                                                htmlFor="institution_id"
                                            >
                                                Kampus
                                            </label>
                                            <select
                                                id="institution_id"
                                                name="institution_id"
                                                value={form.data.institution_id}
                                                onChange={(event) =>
                                                    form.setData(
                                                        'institution_id',
                                                        event.target.value ===
                                                            ''
                                                            ? ''
                                                            : Number(
                                                                  event.target
                                                                      .value,
                                                              ),
                                                    )
                                                }
                                                disabled={
                                                    form.processing ||
                                                    institutions.length === 0
                                                }
                                                aria-invalid={
                                                    form.errors.institution_id
                                                        ? true
                                                        : undefined
                                                }
                                                aria-describedby={
                                                    form.errors.institution_id
                                                        ? 'institution-error'
                                                        : 'institution-help'
                                                }
                                                className="h-10 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-900 transition-colors focus:border-blue-600 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <option value="">
                                                    Pilih kampus
                                                </option>
                                                {institutions.map(
                                                    (institution) => (
                                                        <option
                                                            key={institution.id}
                                                            value={
                                                                institution.id
                                                            }
                                                        >
                                                            {institution.name}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                            <p
                                                id="institution-help"
                                                className="text-[0.6875rem] leading-relaxed text-slate-500"
                                            >
                                                Pastikan pilihan sesuai dengan
                                                kampus tempatmu terdaftar.
                                            </p>
                                            <InputError
                                                id="institution-error"
                                                message={
                                                    form.errors.institution_id
                                                }
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <label
                                                className="text-xs font-bold text-slate-700"
                                                htmlFor="nim"
                                            >
                                                NIM
                                            </label>
                                            <input
                                                id="nim"
                                                name="nim"
                                                type="text"
                                                autoComplete="off"
                                                value={form.data.nim}
                                                onChange={(event) =>
                                                    form.setData(
                                                        'nim',
                                                        event.target.value,
                                                    )
                                                }
                                                disabled={form.processing}
                                                aria-invalid={
                                                    form.errors.nim
                                                        ? true
                                                        : undefined
                                                }
                                                aria-describedby={
                                                    form.errors.nim
                                                        ? 'nim-error'
                                                        : 'nim-help'
                                                }
                                                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-900 transition-colors placeholder:text-slate-400 focus:border-blue-600 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                            <p
                                                id="nim-help"
                                                className="text-[0.6875rem] leading-relaxed text-slate-500"
                                            >
                                                Masukkan NIM yang tercatat di
                                                kampus. SATU mencocokkannya
                                                bersama nomor WhatsApp
                                                terverifikasi milikmu.
                                            </p>
                                            <InputError
                                                id="nim-error"
                                                message={form.errors.nim}
                                            />
                                        </div>

                                        {institutions.length === 0 ? (
                                            <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4">
                                                <div role="status">
                                                    <p className="text-xs font-bold text-slate-900">
                                                        Belum ada kampus yang
                                                        dapat dipilih
                                                    </p>
                                                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                                                        Kamu tetap dapat memakai
                                                        akun SATU. Daftar kampus
                                                        akan muncul setelah
                                                        institusi tersedia.
                                                    </p>
                                                </div>
                                                <Button
                                                    asChild
                                                    variant="outline"
                                                    className="w-fit cursor-pointer rounded-xl text-xs font-semibold"
                                                >
                                                    <Link href={dashboard()}>
                                                        Lanjutkan ke dashboard
                                                        <ArrowRight className="ml-1.5 size-3.5" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col-reverse gap-3 border-t border-slate-200/80 pt-4 sm:flex-row sm:items-center sm:justify-between">
                                                <Link
                                                    className="inline-flex min-h-10 cursor-pointer items-center justify-center text-xs font-semibold text-blue-600 hover:text-blue-700"
                                                    href={dashboard()}
                                                >
                                                    Lanjutkan nanti
                                                </Link>
                                                <Button
                                                    type="submit"
                                                    size="default"
                                                    className="h-10 cursor-pointer rounded-xl bg-blue-600 px-5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                    data-test="onboarding-submit"
                                                    disabled={
                                                        form.processing ||
                                                        form.data
                                                            .institution_id ===
                                                            '' ||
                                                        form.data.nim.trim() ===
                                                            ''
                                                    }
                                                >
                                                    {form.processing ? (
                                                        <>
                                                            <Spinner />
                                                            Mengirim permintaan
                                                        </>
                                                    ) : canRetry ? (
                                                        <>
                                                            <RotateCcw className="mr-1.5 size-3.5" />
                                                            Ajukan kembali
                                                        </>
                                                    ) : (
                                                        <>
                                                            Kirim permintaan
                                                            <ArrowRight className="ml-1.5 size-3.5" />
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        )}
                                    </form>
                                )}

                                {!canRequest && (
                                    <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/40 px-6 py-5 sm:flex-row sm:items-center sm:justify-end sm:px-7">
                                        <Button
                                            asChild
                                            variant={
                                                isVerified
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            size="default"
                                            className={cn(
                                                'h-10 cursor-pointer rounded-xl text-xs font-semibold',
                                                isVerified
                                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                    : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50',
                                            )}
                                        >
                                            <Link href={dashboard()}>
                                                Lanjutkan ke dashboard
                                                <ArrowRight className="ml-1.5 size-3.5" />
                                            </Link>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Section Profil Mahasiswa */}
                    <OnboardingProfile
                        key={`${isVerified}-${studentProfileId ?? 'new'}`}
                        affiliationVerified={isVerified}
                        institutionId={
                            isVerified
                                ? (membership?.institutionId ?? null)
                                : null
                        }
                        onProfileCreated={setProfileIdForRail}
                        profileId={studentProfileId}
                    />
                </div>
            </AppPage>
        </>
    );
}

Onboarding.layout = {
    breadcrumbs: [
        {
            title: 'Afiliasi kampus',
            href: onboarding(),
        },
    ],
};
