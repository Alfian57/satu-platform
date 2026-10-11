import { Head, Link, router } from '@inertiajs/react';
import {
    Ban,
    BookmarkCheck,
    CalendarDays,
    Check,
    CheckCircle2,
    ChevronRight,
    Clock3,
    FileText,
    RefreshCw,
    Search,
    Send,
    ShieldCheck,
    TimerOff,
    XCircle,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { index as talentSearch } from '@/actions/App/Http/Controllers/TalentSearchController';
import { AppPage } from '@/components/app-page';
import { DashboardArchiveArt } from '@/components/dashboard-archive-art';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { saved as savedCandidates } from '@/routes/recruiter/talent';
import {
    cancel,
    index as contactRequestsIndex,
} from '@/routes/recruiter/talent/contact-requests';

interface ContactRequestItem {
    id: number;
    purpose: string;
    message: string | null;
    status: string;
    created_at: string;
    expires_at: string;
    responded_at: string | null;
    candidate_name: string;
    candidate_headline: string | null;
    candidate_phone?: string | null;
}

interface RecruiterContactRequestsProps {
    requests: ContactRequestItem[];
    entitlement: { has_entitlement: boolean };
}

const statusOptions = [
    { value: 'all', label: 'Semua' },
    { value: 'pending', label: 'Menunggu' },
    { value: 'accepted', label: 'Disetujui' },
    { value: 'declined', label: 'Ditolak' },
    { value: 'expired', label: 'Kedaluwarsa' },
    { value: 'canceled', label: 'Dibatalkan' },
];

function statusMeta(status: string) {
    switch (status) {
        case 'pending':
            return {
                label: 'Menunggu tanggapan',
                Icon: Clock3,
                className:
                    'border-pending/20 bg-pending-subtle text-pending-subtle-foreground',
                description:
                    'Kandidat belum memberikan tanggapan. Persetujuan tidak diberikan otomatis.',
            };
        case 'accepted':
            return {
                label: 'Disetujui kandidat',
                Icon: CheckCircle2,
                className:
                    'border-verified/20 bg-verified-subtle text-verified-subtle-foreground',
                description:
                    'Kandidat menyetujui permintaan ini. Kontak hanya tampil bila aksesnya diizinkan server.',
            };
        case 'declined':
            return {
                label: 'Ditolak kandidat',
                Icon: XCircle,
                className:
                    'border-correction/20 bg-correction-subtle text-correction-subtle-foreground',
                description:
                    'Kandidat memilih untuk tidak melanjutkan permintaan ini. Hormati keputusan tersebut.',
            };
        case 'expired':
            return {
                label: 'Kedaluwarsa',
                Icon: TimerOff,
                className: 'border-border bg-background text-muted-foreground',
                description: 'Masa tanggapan permintaan ini telah berakhir.',
            };
        case 'canceled':
            return {
                label: 'Dibatalkan',
                Icon: Ban,
                className: 'border-border bg-background text-muted-foreground',
                description:
                    'Organisasi telah membatalkan permintaan ini. Catatannya tetap ada dalam riwayat.',
            };
        default:
            return {
                label: 'Status belum dikenali',
                Icon: FileText,
                className: 'border-border bg-background text-muted-foreground',
                description:
                    'Muat ulang untuk memeriksa status terbaru dari server.',
            };
    }
}

function RequestDate({
    label,
    value,
}: {
    label: string;
    value: string | null;
}) {
    const date = value ? new Date(value) : null;

    return (
        <div className="min-w-0">
            <dt className="text-xs leading-5 text-muted-foreground">{label}</dt>
            <dd className="mt-1 text-sm font-medium">
                {date && !Number.isNaN(date.getTime()) ? (
                    <time dateTime={value ?? undefined}>
                        {new Intl.DateTimeFormat('id-ID', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                        }).format(date)}
                    </time>
                ) : (
                    'Belum tersedia'
                )}
            </dd>
        </div>
    );
}

function RequestCard({
    request,
    checkedAt,
    disabled,
    onCancel,
}: {
    request: ContactRequestItem;
    checkedAt: number;
    disabled: boolean;
    onCancel: (button: HTMLButtonElement) => void;
}) {
    const meta = statusMeta(request.status);
    const pastDeadline =
        request.status === 'pending' &&
        new Date(request.expires_at).getTime() < checkedAt;

    return (
        <article
            aria-labelledby={`contact-request-${request.id}`}
            className="min-w-0 rounded-3xl border border-border bg-white shadow-sm focus-within:border-primary/30 focus-within:shadow-md"
        >
            <div className="p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-label text-xs text-muted-foreground">
                        PERMINTAAN-{request.id}
                    </p>
                    <span
                        className={cn(
                            'inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold',
                            meta.className,
                        )}
                    >
                        <meta.Icon
                            aria-hidden="true"
                            className="size-3.5 shrink-0"
                        />
                        {meta.label}
                    </span>
                </div>
                <h3
                    id={`contact-request-${request.id}`}
                    className="mt-4 text-xl leading-tight font-bold tracking-tight break-words sm:text-2xl"
                >
                    {request.candidate_name || 'Kandidat'}
                </h3>
                <p className="mt-2 text-sm leading-6 break-words text-muted-foreground">
                    {request.candidate_headline ||
                        'Ringkasan profil belum tersedia.'}
                </p>
                <div className="mt-5 rounded-2xl border border-primary/10 bg-accent/55 p-4 sm:p-5">
                    <p className="flex items-center gap-2 text-xs font-semibold text-primary">
                        <Send aria-hidden="true" className="size-4" />
                        Tujuan permintaan
                    </p>
                    <p className="mt-2 text-base leading-6 font-semibold break-words">
                        {request.purpose || 'Tujuan belum tersedia.'}
                    </p>
                    <div className="mt-4 border-t border-primary/10 pt-4">
                        <p className="text-xs font-semibold text-muted-foreground">
                            Pesan untuk kandidat
                        </p>
                        <p className="mt-2 text-sm leading-6 break-words whitespace-pre-wrap text-muted-foreground">
                            {request.message || 'Tidak ada pesan tambahan.'}
                        </p>
                    </div>
                </div>
                <dl className="mt-5 grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                    <RequestDate label="Dikirim" value={request.created_at} />
                    <RequestDate
                        label="Batas tanggapan"
                        value={request.expires_at}
                    />
                    {request.responded_at && (
                        <RequestDate
                            label="Ditanggapi"
                            value={request.responded_at}
                        />
                    )}
                </dl>
                {request.status === 'accepted' && request.candidate_phone && (
                    <div className="mt-4 grid gap-3 rounded-2xl border border-verified/25 bg-verified-subtle p-4 text-verified-subtle-foreground">
                        <p className="text-sm font-semibold">
                            Nomor WhatsApp yang diizinkan kandidat
                        </p>
                        <p className="text-base font-semibold wrap-anywhere">
                            {request.candidate_phone}
                        </p>
                        <a
                            href={`https://wa.me/${request.candidate_phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-11 w-fit cursor-pointer items-center justify-center rounded-xl border border-verified/30 px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
                            Hubungi via WhatsApp
                        </a>
                    </div>
                )}
                {pastDeadline && (
                    <p className="mt-4 flex items-start gap-2 text-sm leading-6 text-pending-subtle-foreground">
                        <CalendarDays
                            aria-hidden="true"
                            className="mt-1 size-4 shrink-0"
                        />
                        Batas waktu terlewati. Status server masih menunggu
                        tanggapan; muat ulang untuk memeriksanya.
                    </p>
                )}
            </div>
            <footer className="flex flex-col gap-4 border-t border-border p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
                <p className="max-w-prose text-sm leading-6 text-muted-foreground">
                    {meta.description}
                </p>
                {request.status === 'pending' && (
                    <Button
                        type="button"
                        variant="outline"
                        className="h-11 shrink-0 border-correction/25 text-correction hover:bg-correction-subtle hover:text-correction"
                        aria-label={`Batalkan permintaan kepada ${request.candidate_name || 'kandidat'}`}
                        disabled={disabled}
                        onClick={(event) => onCancel(event.currentTarget)}
                    >
                        <Ban aria-hidden="true" className="size-4" />
                        Batalkan permintaan
                    </Button>
                )}
            </footer>
        </article>
    );
}

function ContactRequestsContextRail({
    requests,
    hasEntitlement,
    isForbidden,
}: {
    requests: ContactRequestItem[];
    hasEntitlement: boolean;
    isForbidden: boolean;
}) {
    return (
        <aside
            aria-label="Panduan permintaan kontak"
            className="min-w-0 space-y-6"
        >
            <section className="rounded-3xl border border-primary/15 bg-linear-to-b from-white to-accent/60 p-5 shadow-sm sm:p-6">
                <span className="flex size-11 items-center justify-center rounded-2xl border border-primary/10 bg-white text-primary">
                    <ShieldCheck aria-hidden="true" className="size-5" />
                </span>
                <h2 className="mt-4 text-xl leading-tight font-bold tracking-tight">
                    Persetujuan tetap milik kandidat.
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Mengirim permintaan tidak membuka kontak langsung. Kandidat
                    dapat menyetujui atau menolak sesuai tujuan yang
                    disampaikan.
                </p>
                <p className="mt-4 border-t border-primary/10 pt-4 text-sm leading-6 text-muted-foreground">
                    Nomor WhatsApp hanya tampil setelah kandidat menyetujui
                    permintaan dan server mengizinkan akses kontak.
                </p>
            </section>
            {!isForbidden && (
                <section
                    className="px-1"
                    aria-labelledby="contact-summary-heading"
                >
                    <h2
                        id="contact-summary-heading"
                        className="text-base font-semibold"
                    >
                        Catatan organisasi
                    </h2>
                    <dl className="mt-3 divide-y divide-border">
                        {[
                            {
                                label: 'Permintaan tercatat',
                                value: requests.length,
                                Icon: Send,
                            },
                            {
                                label: 'Menunggu tanggapan',
                                value: requests.filter(
                                    (request) => request.status === 'pending',
                                ).length,
                                Icon: Clock3,
                            },
                            {
                                label: 'Disetujui kandidat',
                                value: requests.filter(
                                    (request) => request.status === 'accepted',
                                ).length,
                                Icon: CheckCircle2,
                            },
                        ].map(({ label, value, Icon }) => (
                            <div
                                key={label}
                                className="flex items-center justify-between gap-3 py-3"
                            >
                                <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Icon
                                        aria-hidden="true"
                                        className="size-4 shrink-0 text-primary"
                                    />
                                    {label}
                                </dt>
                                <dd className="font-label text-lg font-semibold">
                                    {value}
                                </dd>
                            </div>
                        ))}
                    </dl>
                    <p className="mt-3 text-xs leading-5 text-muted-foreground">
                        {hasEntitlement
                            ? 'Hak akses pencarian aktif.'
                            : 'Hak akses pencarian belum aktif. Riwayat yang diizinkan server tetap ditampilkan.'}
                    </p>
                </section>
            )}
            <section
                className="border-t border-border px-1 pt-5"
                aria-labelledby="contact-navigation-heading"
            >
                <h2
                    id="contact-navigation-heading"
                    className="text-base font-semibold"
                >
                    Lanjutkan penelusuran
                </h2>
                <div className="mt-3 divide-y divide-border">
                    {[
                        {
                            href: talentSearch(),
                            label: 'Cari talenta',
                            description: 'Telusuri portofolio yang dibagikan.',
                            Icon: Search,
                        },
                        {
                            href: savedCandidates(),
                            label: 'Kandidat tersimpan',
                            description: 'Tinjau koleksi organisasi.',
                            Icon: BookmarkCheck,
                        },
                    ].map(({ href, label, description, Icon }) => (
                        <Link
                            key={label}
                            href={href}
                            className="flex min-h-16 cursor-pointer items-center gap-3 rounded-xl py-3 transition-colors hover:bg-accent/60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                        >
                            <Icon
                                aria-hidden="true"
                                className="size-5 shrink-0 text-primary"
                            />
                            <span className="min-w-0 flex-1">
                                <span className="block text-sm font-semibold">
                                    {label}
                                </span>
                                <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                                    {description}
                                </span>
                            </span>
                            <ChevronRight
                                aria-hidden="true"
                                className="size-4 shrink-0 text-muted-foreground"
                            />
                        </Link>
                    ))}
                </div>
            </section>
        </aside>
    );
}

export default function RecruiterContactRequests({
    requests,
    entitlement,
}: RecruiterContactRequestsProps) {
    const [statusFilter, setStatusFilter] = useState('all');
    const [checkedAt, setCheckedAt] = useState(() => Date.now());
    const [requestToCancel, setRequestToCancel] =
        useState<ContactRequestItem | null>(null);
    const [cancelingId, setCancelingId] = useState<number | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isForbidden, setIsForbidden] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [feedback, setFeedback] = useState('');
    const headingRef = useRef<HTMLHeadingElement>(null);
    const cancelTriggerRef = useRef<HTMLButtonElement | null>(null);
    const didCancelRef = useRef(false);
    const isBusy = cancelingId !== null || isRefreshing;
    const filteredRequests =
        statusFilter === 'all'
            ? requests
            : requests.filter((request) => request.status === statusFilter);

    const failRequest = (forbidden = false): false => {
        if (forbidden) {
            setIsForbidden(true);
            setRequestToCancel(null);
        }

        setHasError(true);
        setFeedback(
            'Belum dapat memastikan status permintaan. Muat ulang untuk memeriksa catatan terbaru sebelum mencoba lagi.',
        );

        return false;
    };

    const refreshRequests = () => {
        if (isBusy) {
            return;
        }

        setIsRefreshing(true);
        setHasError(false);
        setFeedback('Memuat riwayat permintaan kontak.');
        router.get(
            contactRequestsIndex(),
            {},
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setCheckedAt(Date.now());
                    setIsForbidden(false);
                    setHasError(false);
                    setFeedback('Riwayat permintaan kontak telah diperbarui.');
                },
                onError: () => {
                    failRequest();
                },
                onHttpException: (response) =>
                    failRequest(response.status === 403),
                onNetworkError: () => failRequest(),
                onFinish: () => setIsRefreshing(false),
            },
        );
    };

    const confirmCancellation = () => {
        if (!requestToCancel || isBusy || isForbidden) {
            return;
        }

        setCancelingId(requestToCancel.id);
        setHasError(false);
        setFeedback('Membatalkan permintaan kontak organisasi.');
        router.delete(cancel(requestToCancel.id), {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                didCancelRef.current = true;
                setRequestToCancel(null);
                setHasError(false);
                setFeedback('Permintaan kontak telah dibatalkan.');
            },
            onError: () => {
                failRequest();
            },
            onHttpException: (response) => failRequest(response.status === 403),
            onNetworkError: () => failRequest(),
            onFinish: () => setCancelingId(null),
        });
    };

    return (
        <>
            <Head title="Permintaan kontak | SATU" />
            <AppPage className="max-w-none min-w-0">
                <div
                    className="space-y-6"
                    data-test="recruiter-contact-requests-root"
                >
                    <header className="rounded-3xl border border-border bg-white p-5 shadow-sm sm:p-6">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 items-start gap-4">
                                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-accent text-primary">
                                    <Send
                                        aria-hidden="true"
                                        className="size-6"
                                    />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                                        Korespondensi organisasi
                                    </p>
                                    <h1 className="mt-1 text-2xl leading-tight font-bold tracking-tight break-words sm:text-3xl">
                                        Permintaan kontak
                                    </h1>
                                    <p className="mt-2 max-w-prose text-sm leading-6 text-muted-foreground">
                                        Pantau tujuan dan tanggapan kandidat
                                        dalam satu catatan.
                                    </p>
                                </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-2 self-start rounded-xl border border-primary/10 bg-accent/60 px-3 py-2.5 text-xs font-semibold text-primary sm:self-center">
                                <ShieldCheck
                                    aria-hidden="true"
                                    className="size-4"
                                />
                                Persetujuan kandidat
                            </div>
                        </div>
                    </header>
                    <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]">
                        <section
                            className="min-w-0 space-y-5"
                            aria-labelledby="contact-list-heading"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3 px-1">
                                <div>
                                    <h2
                                        ref={headingRef}
                                        id="contact-list-heading"
                                        tabIndex={-1}
                                        className="rounded-lg text-xl font-bold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring sm:text-2xl"
                                    >
                                        Riwayat permintaan
                                    </h2>
                                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                        {isForbidden
                                            ? 'Akses riwayat perlu diperiksa kembali.'
                                            : `${requests.length} permintaan tercatat dari organisasi.`}
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-11"
                                    disabled={isBusy}
                                    onClick={refreshRequests}
                                >
                                    {isRefreshing ? (
                                        <Spinner aria-hidden="true" />
                                    ) : (
                                        <RefreshCw
                                            aria-hidden="true"
                                            className="size-4"
                                        />
                                    )}
                                    Muat ulang
                                </Button>
                            </div>
                            {!isForbidden && !entitlement.has_entitlement && (
                                <p className="rounded-2xl border border-pending/20 bg-pending-subtle px-4 py-3 text-sm leading-6 text-pending-subtle-foreground">
                                    Hak akses pencarian belum aktif. Anda tetap
                                    dapat membaca riwayat yang tersedia;
                                    pencarian dan pengiriman baru mengikuti izin
                                    organisasi.
                                </p>
                            )}
                            {!isForbidden && (
                                <div className="rounded-3xl border border-primary/15 bg-white p-4 shadow-sm sm:p-5">
                                    <p
                                        id="contact-filter-label"
                                        className="text-sm font-semibold"
                                    >
                                        Saring status permintaan
                                    </p>
                                    <div
                                        role="group"
                                        aria-labelledby="contact-filter-label"
                                        className="mt-3 flex flex-wrap gap-2"
                                    >
                                        {statusOptions.map((option) => (
                                            <Button
                                                key={option.value}
                                                type="button"
                                                variant="outline"
                                                aria-pressed={
                                                    statusFilter ===
                                                    option.value
                                                }
                                                aria-controls="contact-request-results"
                                                disabled={isBusy}
                                                onClick={() =>
                                                    setStatusFilter(
                                                        option.value,
                                                    )
                                                }
                                                className={cn(
                                                    'h-auto min-h-11 max-w-full gap-2 px-3 py-2 text-sm whitespace-normal',
                                                    statusFilter ===
                                                        option.value
                                                        ? 'border-primary/25 bg-accent text-primary hover:bg-accent hover:text-primary'
                                                        : 'border-border text-muted-foreground',
                                                )}
                                            >
                                                {statusFilter ===
                                                    option.value && (
                                                    <Check
                                                        aria-hidden="true"
                                                        className="size-4 shrink-0"
                                                    />
                                                )}
                                                {option.label}
                                                <span className="font-label text-xs">
                                                    {option.value === 'all'
                                                        ? requests.length
                                                        : requests.filter(
                                                              (request) =>
                                                                  request.status ===
                                                                  option.value,
                                                          ).length}
                                                </span>
                                            </Button>
                                        ))}
                                    </div>
                                    <p
                                        role="status"
                                        className="mt-4 text-xs leading-5 text-muted-foreground"
                                    >
                                        Menampilkan {filteredRequests.length}{' '}
                                        permintaan. Filter hanya menyaring
                                        riwayat yang dimuat.
                                    </p>
                                </div>
                            )}
                            <div
                                className="min-h-6"
                                role={
                                    hasError && !requestToCancel
                                        ? 'alert'
                                        : 'status'
                                }
                            >
                                {!requestToCancel && feedback && (
                                    <p
                                        className={cn(
                                            'text-sm leading-6',
                                            hasError
                                                ? 'text-correction'
                                                : 'text-muted-foreground',
                                        )}
                                    >
                                        {feedback}
                                    </p>
                                )}
                                {hasError && !requestToCancel && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="mt-3 h-11"
                                        disabled={isBusy}
                                        onClick={refreshRequests}
                                    >
                                        Muat ulang status
                                    </Button>
                                )}
                            </div>
                            <div
                                id="contact-request-results"
                                aria-busy={isRefreshing}
                                className="space-y-5"
                            >
                                {isForbidden ? (
                                    <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
                                        <ShieldCheck
                                            aria-hidden="true"
                                            className="size-8 text-primary"
                                        />
                                        <h3 className="mt-4 text-xl font-semibold">
                                            Akses riwayat tidak tersedia
                                        </h3>
                                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                                            Catatan sebelumnya disembunyikan.
                                            Muat ulang untuk memeriksa izin
                                            organisasi terbaru.
                                        </p>
                                    </div>
                                ) : isRefreshing && requests.length === 0 ? (
                                    <div
                                        aria-hidden="true"
                                        className="space-y-5"
                                    >
                                        {[1, 2, 3].map((key) => (
                                            <div
                                                key={key}
                                                className="space-y-5 rounded-3xl border border-border bg-white p-5 sm:p-6"
                                            >
                                                <Skeleton className="h-4 w-32 motion-reduce:animate-none" />
                                                <Skeleton className="h-7 w-3/4 motion-reduce:animate-none" />
                                                <Skeleton className="h-36 w-full rounded-2xl motion-reduce:animate-none" />
                                                <Skeleton className="h-11 w-full motion-reduce:animate-none" />
                                            </div>
                                        ))}
                                    </div>
                                ) : filteredRequests.length === 0 ? (
                                    <div className="rounded-3xl border border-dashed border-primary/25 bg-white px-5 py-10 text-center sm:px-8">
                                        <DashboardArchiveArt className="mx-auto size-24" />
                                        <h3 className="mt-4 text-xl font-semibold">
                                            {requests.length === 0
                                                ? 'Belum ada permintaan kontak'
                                                : 'Belum ada permintaan dengan status ini'}
                                        </h3>
                                        <p className="mx-auto mt-3 max-w-prose text-sm leading-6 text-muted-foreground">
                                            {requests.length === 0
                                                ? 'Permintaan yang tercatat untuk organisasi akan muncul di sini beserta tujuan dan tanggapan kandidat.'
                                                : 'Pilih Semua untuk meninjau riwayat lainnya. Tidak ada catatan yang dihapus saat filter berubah.'}
                                        </p>
                                        {requests.length > 0 ? (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="mt-5 h-11"
                                                disabled={isBusy}
                                                onClick={() =>
                                                    setStatusFilter('all')
                                                }
                                            >
                                                Tampilkan semua
                                            </Button>
                                        ) : (
                                            <Button
                                                asChild
                                                variant="outline"
                                                className="mt-5 h-11"
                                            >
                                                <Link href={talentSearch()}>
                                                    <Search
                                                        aria-hidden="true"
                                                        className="size-4"
                                                    />
                                                    Kembali ke Cari Talenta
                                                </Link>
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <ul
                                        aria-label="Riwayat permintaan kontak"
                                        className="space-y-5"
                                    >
                                        {filteredRequests.map((request) => (
                                            <li key={request.id}>
                                                <RequestCard
                                                    request={request}
                                                    checkedAt={checkedAt}
                                                    disabled={isBusy}
                                                    onCancel={(button) => {
                                                        cancelTriggerRef.current =
                                                            button;
                                                        didCancelRef.current = false;
                                                        setHasError(false);
                                                        setFeedback('');
                                                        setRequestToCancel(
                                                            request,
                                                        );
                                                    }}
                                                />
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </section>
                        <ContactRequestsContextRail
                            requests={requests}
                            hasEntitlement={entitlement.has_entitlement}
                            isForbidden={isForbidden}
                        />
                    </div>
                </div>
            </AppPage>
            <Dialog
                open={requestToCancel !== null}
                onOpenChange={(open) => {
                    if (!open && !isBusy) {
                        setRequestToCancel(null);
                    }
                }}
            >
                <DialogContent
                    closeButtonDisabled={isBusy}
                    onEscapeKeyDown={(event) => {
                        if (isBusy) {
                            event.preventDefault();
                        }
                    }}
                    onInteractOutside={(event) => {
                        if (isBusy) {
                            event.preventDefault();
                        }
                    }}
                    onCloseAutoFocus={(event) => {
                        event.preventDefault();

                        if (
                            didCancelRef.current ||
                            !cancelTriggerRef.current?.isConnected
                        ) {
                            headingRef.current?.focus();
                        } else {
                            cancelTriggerRef.current.focus();
                        }

                        didCancelRef.current = false;
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>Batalkan permintaan kontak?</DialogTitle>
                        <DialogDescription>
                            Permintaan organisasi ini akan dibatalkan dan tidak
                            lagi menunggu tanggapan kandidat. Riwayat tetap
                            tersimpan; profil kandidat tidak dihapus.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="rounded-2xl border border-primary/10 bg-accent/60 p-4">
                        <p className="text-xs font-semibold text-muted-foreground">
                            Permintaan kepada
                        </p>
                        <p className="mt-2 text-base font-semibold break-words">
                            {requestToCancel?.candidate_name || 'Kandidat'}
                        </p>
                        <p className="mt-2 text-sm leading-6 break-words text-muted-foreground">
                            {requestToCancel?.purpose}
                        </p>
                    </div>
                    <p
                        role={hasError ? 'alert' : 'status'}
                        className={cn(
                            'min-h-5 text-sm leading-6',
                            hasError
                                ? 'text-correction'
                                : 'text-muted-foreground',
                        )}
                    >
                        {requestToCancel ? feedback : ''}
                    </p>
                    <DialogFooter>
                        {hasError && (
                            <Button
                                type="button"
                                variant="outline"
                                className="h-11"
                                disabled={isBusy}
                                onClick={() => {
                                    setRequestToCancel(null);
                                    refreshRequests();
                                }}
                            >
                                Muat ulang status
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="outline"
                            className="h-11"
                            disabled={isBusy}
                            onClick={() => setRequestToCancel(null)}
                        >
                            Kembali
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            className="h-11"
                            disabled={isBusy || isForbidden || hasError}
                            onClick={confirmCancellation}
                        >
                            {cancelingId !== null ? (
                                <Spinner aria-hidden="true" />
                            ) : (
                                <Ban aria-hidden="true" className="size-4" />
                            )}
                            {cancelingId !== null
                                ? 'Membatalkan'
                                : 'Ya, batalkan'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

RecruiterContactRequests.layout = {
    breadcrumbs: [
        { title: 'Talent Portal', href: talentSearch() },
        { title: 'Permintaan kontak', href: contactRequestsIndex() },
    ],
};
