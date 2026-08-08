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
    LockKeyhole,
    LogIn,
    RefreshCw,
    RotateCcw,
    ShieldCheck,
    WifiOff,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import AlertError from '@/components/alert-error';
import { AppPage } from '@/components/app-page';
import InputError from '@/components/input-error';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { dashboard, login } from '@/routes';
import { store } from '@/routes/institution-memberships';
import { show as onboarding } from '@/routes/onboarding';
import type {
    OnboardingMembership,
    OnboardingMembershipStatus,
    OnboardingPageProps,
} from '@/types';

const statusCopy: Record<
    OnboardingMembershipStatus,
    {
        label: string;
        title: string;
        description: string;
        icon: typeof CheckCircle2;
        className: string;
    }
> = {
    unverified: {
        label: 'Perlu diajukan kembali',
        title: 'Afiliasimu belum terverifikasi',
        description:
            'Pilih kampus yang sesuai untuk mengirim permintaan afiliasi baru.',
        icon: CircleAlert,
        className:
            'border-correction/35 bg-correction-subtle text-correction-subtle-foreground',
    },
    pending: {
        label: 'Menunggu tinjauan',
        title: 'Permintaanmu sedang ditinjau',
        description:
            'Admin kampus akan memeriksa afiliasimu. Fitur akun tetap dapat dipakai, tetapi rekam kontribusi belum dapat diverifikasi institusi sampai afiliasi disetujui.',
        icon: Clock3,
        className:
            'border-pending/35 bg-pending-subtle text-pending-subtle-foreground',
    },
    verified: {
        label: 'Terverifikasi',
        title: 'Afiliasi kampusmu terverifikasi',
        description:
            'Identitas kampusmu sudah terhubung dan dapat menjadi dasar rekam kontribusi terverifikasi.',
        icon: CheckCircle2,
        className:
            'border-verified/35 bg-verified-subtle text-verified-subtle-foreground',
    },
    suspended: {
        label: 'Akses ditangguhkan',
        title: 'Afiliasimu sedang ditangguhkan',
        description:
            'Permintaan baru tidak dapat dikirim dari halaman ini. Hubungi pengelola kampus untuk tindak lanjut.',
        icon: LockKeyhole,
        className:
            'border-correction/35 bg-correction-subtle text-correction-subtle-foreground',
    },
};

const outcomeAnnouncements: Record<OnboardingMembershipStatus, string> = {
    unverified: 'Afiliasi kampus belum terverifikasi.',
    pending: 'Permintaan afiliasi berhasil dikirim dan menunggu tinjauan.',
    verified: 'Afiliasi kampus berhasil diverifikasi.',
    suspended: 'Akses afiliasi kampus sedang ditangguhkan.',
};

type SubmissionIssue =
    'network' | 'session_expired' | 'forbidden' | 'rate_limited' | 'server';

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
            className="border-pending/40 bg-pending-subtle text-pending-subtle-foreground"
            data-test="onboarding-submission-recovery"
        >
            <IssueIcon aria-hidden="true" />
            <AlertTitle className="line-clamp-none">{copy.title}</AlertTitle>
            <AlertDescription className="text-current">
                <p>{copy.description}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                    {issue === 'session_expired' ? (
                        <Button asChild size="sm" className="cursor-pointer">
                            <Link href={login()}>
                                <LogIn />
                                {copy.action}
                            </Link>
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            size="sm"
                            className="cursor-pointer disabled:cursor-not-allowed"
                            disabled={processing}
                            onClick={
                                issue === 'forbidden'
                                    ? () => router.reload()
                                    : onRetry
                            }
                        >
                            <RefreshCw />
                            {copy.action}
                        </Button>
                    )}
                    <Button
                        asChild
                        variant="link"
                        size="sm"
                        className="cursor-pointer text-current"
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
}: {
    affiliationVerified: boolean;
}) {
    const completedCount = affiliationVerified ? 3 : 2;

    return (
        <div className="grid gap-8">
            <section aria-labelledby="progress-title">
                <p className="font-label text-label text-muted-foreground">
                    Progres afiliasi
                </p>
                <div className="mt-2 flex items-end justify-between gap-4">
                    <h2 id="progress-title" className="text-title font-bold">
                        {completedCount} dari 3 selesai
                    </h2>
                    <span
                        aria-hidden="true"
                        className="font-label text-sm text-muted-foreground"
                    >
                        {Math.round((completedCount / 3) * 100)}%
                    </span>
                </div>

                <div
                    aria-label={`${completedCount} dari 3 tahap afiliasi selesai`}
                    className="mt-4 grid grid-cols-3 gap-1"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={3}
                    aria-valuenow={completedCount}
                >
                    {[1, 2, 3].map((step) => (
                        <span
                            key={step}
                            className={cn(
                                'h-1.5',
                                step <= completedCount
                                    ? 'bg-primary'
                                    : 'bg-border',
                            )}
                        />
                    ))}
                </div>

                <ol className="mt-5 divide-y divide-border border-y border-border">
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
                </ol>
            </section>

            <section aria-labelledby="privacy-title">
                <div className="flex items-center gap-2">
                    <ShieldCheck
                        aria-hidden="true"
                        className="size-4 text-primary"
                    />
                    <h2 id="privacy-title" className="font-semibold">
                        Kendali tetap padamu
                    </h2>
                </div>
                <div className="mt-4 divide-y divide-border border-y border-border text-sm">
                    <div className="flex gap-3 py-4">
                        <LockKeyhole
                            aria-hidden="true"
                            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                        />
                        <p className="leading-relaxed text-muted-foreground">
                            Permintaan ini hanya menghubungkan akun dengan
                            kampus. Data portofolio belum dibagikan.
                        </p>
                    </div>
                    <div className="flex gap-3 py-4">
                        <Eye
                            aria-hidden="true"
                            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                        />
                        <p className="leading-relaxed text-muted-foreground">
                            Pengaturan visibilitas dan persetujuan akan
                            dijelaskan saat data profil mulai dilengkapi.
                        </p>
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
        <li className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-3 py-3">
            {complete ? (
                <Check
                    aria-hidden="true"
                    className="mt-0.5 size-4 text-verified"
                />
            ) : (
                <CircleDashed
                    aria-hidden="true"
                    className="mt-0.5 size-4 text-muted-foreground"
                />
            )}
            <div>
                <p className="text-sm font-semibold">{label}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {detail}
                </p>
            </div>
        </li>
    );
}

function MembershipFacts({
    username,
    membership,
}: {
    username: string;
    membership: OnboardingMembership | null;
}) {
    return (
        <dl className="divide-y divide-border border-y border-border">
            <div className="grid gap-1 py-3 sm:grid-cols-[9.5rem_minmax(0,1fr)] sm:gap-5">
                <dt className="font-label text-label text-muted-foreground">
                    Username
                </dt>
                <dd className="min-w-0 text-sm font-medium break-all">
                    {username}
                </dd>
            </div>
            <div className="grid gap-1 py-3 sm:grid-cols-[9.5rem_minmax(0,1fr)] sm:gap-5">
                <dt className="font-label text-label text-muted-foreground">
                    Kampus
                </dt>
                <dd className="min-w-0 text-sm font-medium [overflow-wrap:anywhere]">
                    {membership?.institutionName ?? 'Belum dipilih'}
                </dd>
            </div>
            <div className="grid gap-1 py-3 sm:grid-cols-[9.5rem_minmax(0,1fr)] sm:gap-5">
                <dt className="font-label text-label text-muted-foreground">
                    Verifikasi
                </dt>
                <dd className="text-sm font-medium">
                    {membership
                        ? statusCopy[membership.status].label
                        : 'Belum diajukan'}
                </dd>
            </div>
        </dl>
    );
}

export default function Onboarding({
    account,
    institutions,
    membership,
    canRequest,
    canRetry,
    membershipOutcome,
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
    const form = useForm<{ institution_id: number | '' }>(
        'onboarding-affiliation',
        {
            institution_id:
                (canRetry || initialSubmissionIssue === 'forbidden') &&
                membership &&
                institutions.some(
                    (institution) =>
                        institution.id === membership.institutionId,
                )
                    ? membership.institutionId
                    : '',
        },
    );
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
                contextRail={<ProgressRail affiliationVerified={isVerified} />}
                contextRailLabel="Progres dan privasi onboarding"
            >
                <div
                    className="mx-auto w-full max-w-4xl"
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
                    <p className="sr-only" role="status" aria-live="polite">
                        {form.processing
                            ? 'Permintaan afiliasi sedang dikirim.'
                            : ''}
                    </p>
                    <header className="mb-6">
                        <p className="font-label text-label text-primary">
                            Catatan pendaftaran
                        </p>
                        <h1 className="mt-2 max-w-[24ch] text-headline font-bold text-balance">
                            Hubungkan akunmu dengan kampus
                        </h1>
                        <p className="mt-3 max-w-[65ch] text-body text-muted-foreground">
                            Afiliasi kampus terpisah dari akun SATU. Kampus yang
                            terverifikasi dapat menjadi sumber validasi untuk
                            kontribusimu nanti.
                        </p>
                    </header>

                    <section
                        aria-labelledby="affiliation-title"
                        className="border border-border bg-card"
                    >
                        <div className="grid md:grid-cols-[10.5rem_minmax(0,1fr)]">
                            <div
                                className={cn(
                                    'flex items-center gap-3 border-b border-border px-5 py-4 md:flex-col md:items-start md:border-r md:border-b-0 md:px-5 md:py-6',
                                    status?.className ??
                                        'bg-muted text-muted-foreground',
                                )}
                            >
                                <StatusIcon
                                    aria-hidden="true"
                                    className="size-6 shrink-0"
                                />
                                <p className="font-label text-label font-semibold">
                                    {status?.label ?? 'Belum terhubung'}
                                </p>
                            </div>

                            <div className="min-w-0">
                                <div className="border-b border-border px-5 py-3 sm:px-6">
                                    <p className="font-label text-label text-muted-foreground">
                                        Afiliasi / AF-ACCOUNT
                                    </p>
                                </div>

                                <div className="px-5 py-6 sm:px-6">
                                    <h2
                                        id="affiliation-title"
                                        className="text-title font-bold sm:text-[1.75rem] sm:leading-tight"
                                    >
                                        {canRetry
                                            ? 'Ajukan kembali afiliasimu'
                                            : (status?.title ??
                                              'Pilih kampus untuk melanjutkan')}
                                    </h2>
                                    <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-muted-foreground sm:text-base">
                                        {canRetry
                                            ? 'Permintaan sebelumnya belum dapat diverifikasi. Periksa pilihan kampus, lalu kirim ulang permintaanmu.'
                                            : (status?.description ??
                                              'Pilih institusi yang benar. Sistem akan memeriksa kecocokan email secara otomatis atau meneruskan permintaan untuk ditinjau admin kampus.')}
                                    </p>
                                </div>

                                <div className="px-5 sm:px-6">
                                    <MembershipFacts
                                        username={account.username}
                                        membership={membership}
                                    />
                                </div>

                                {submissionIssue && (
                                    <div
                                        ref={recoverySummary}
                                        tabIndex={-1}
                                        data-test="onboarding-recovery-focus"
                                        className="px-5 pt-6 sm:px-6"
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
                                        className="grid gap-4 px-5 py-6 sm:px-6"
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
                                                className="text-sm font-semibold"
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
                                                className="h-control-lg w-full cursor-pointer rounded-md border border-input bg-background px-3 text-sm text-foreground transition-colors duration-fast ease-ledger disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
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
                                                className="text-xs leading-relaxed text-muted-foreground"
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

                                        {institutions.length === 0 ? (
                                            <div className="grid gap-4 border-y border-border py-4">
                                                <div role="status">
                                                    <p className="font-semibold">
                                                        Belum ada kampus yang
                                                        dapat dipilih
                                                    </p>
                                                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                                        Kamu tetap dapat memakai
                                                        akun SATU. Daftar kampus
                                                        akan muncul setelah
                                                        institusi tersedia.
                                                    </p>
                                                </div>
                                                <Button
                                                    asChild
                                                    variant="outline"
                                                    className="w-fit cursor-pointer"
                                                >
                                                    <Link href={dashboard()}>
                                                        Lanjutkan ke dashboard
                                                        <ArrowRight />
                                                    </Link>
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                                                <Link
                                                    className="inline-flex min-h-control-md cursor-pointer items-center justify-center text-sm font-semibold text-primary underline-offset-4 hover:underline"
                                                    href={dashboard()}
                                                >
                                                    Lanjutkan nanti
                                                </Link>
                                                <Button
                                                    type="submit"
                                                    size="lg"
                                                    className="cursor-pointer disabled:cursor-not-allowed"
                                                    data-test="onboarding-submit"
                                                    disabled={
                                                        form.processing ||
                                                        form.data
                                                            .institution_id ===
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
                                                            <RotateCcw />
                                                            Ajukan kembali
                                                        </>
                                                    ) : (
                                                        <>
                                                            Kirim permintaan
                                                            <ArrowRight />
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        )}
                                    </form>
                                )}

                                {!canRequest && (
                                    <div className="flex flex-col gap-3 border-t border-border px-5 py-5 sm:flex-row sm:items-center sm:justify-end sm:px-6">
                                        <Button
                                            asChild
                                            variant={
                                                isVerified
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            size="lg"
                                            className="cursor-pointer"
                                        >
                                            <Link href={dashboard()}>
                                                Lanjutkan ke dashboard
                                                <ArrowRight />
                                            </Link>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
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
