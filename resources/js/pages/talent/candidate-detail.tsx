import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Award,
    BookOpenCheck,
    Bookmark,
    BookmarkCheck,
    Building2,
    CheckCircle2,
    ChevronRight,
    FileText,
    LockKeyhole,
    RefreshCw,
    Send,
    ShieldCheck,
    Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import {
    destroy as unsaveCandidate,
    store as saveCandidate,
} from '@/actions/App/Http/Controllers/SavedCandidatesController';
import {
    index as talentSearch,
    show as showCandidate,
} from '@/actions/App/Http/Controllers/TalentSearchController';
import { AppPage } from '@/components/app-page';
import { DashboardArchiveArt as ArchiveArt } from '@/components/dashboard-archive-art';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { saved as savedCandidates } from '@/routes/recruiter/talent';
import { index as contactRequests } from '@/routes/recruiter/talent/contact-requests';

interface Candidate {
    id: number;
    headline: string | null;
    bio: string | null;
    skills: string[];
    badges: string[];
    contributions: (string | { title?: unknown; role?: unknown })[];
    availability_status: string;
    verified_at: string | null;
    institution_name: string | null;
}

interface CandidateDetailProps {
    candidate: Candidate;
    isSaved?: boolean;
    contactConsequenceNotice: string;
}

function availabilityMeta(status: string) {
    switch (status) {
        case 'available':
            return {
                label: 'Tersedia untuk peluang',
                className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
            };
        case 'open_to_offers':
            return {
                label: 'Terbuka untuk penawaran',
                className: 'border-primary/20 bg-accent text-primary',
            };
        case 'not_available':
            return {
                label: 'Belum tersedia',
                className: 'border-border bg-white/80 text-muted-foreground',
            };
        default:
            return {
                label: 'Ketersediaan belum dibagikan',
                className: 'border-border bg-white/80 text-muted-foreground',
            };
    }
}

function verificationDate(value: string | null): string | null {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? null
        : new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(
              date,
          );
}

function CandidateProfile({
    candidate,
    isSaved = false,
    contactConsequenceNotice,
}: CandidateDetailProps) {
    const [saved, setSaved] = useState(isSaved);
    const [isBusy, setIsBusy] = useState(false);
    const [isUnavailable, setIsUnavailable] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [hasError, setHasError] = useState(false);
    const availability = availabilityMeta(candidate.availability_status);
    const verifiedDate = verificationDate(candidate.verified_at);
    const headline = candidate.headline || 'Portofolio mahasiswa';

    const failRequest = (status?: number): false => {
        if (status === 403 || status === 404) {
            setIsUnavailable(true);
        }

        setHasError(true);
        setFeedback(
            'Belum dapat memastikan status terbaru. Muat ulang untuk memeriksa profil dan kandidat tersimpan.',
        );

        return false;
    };

    const reloadProfile = () => {
        if (isBusy) {
            return;
        }

        setIsBusy(true);
        setHasError(false);
        setFeedback('Memuat ulang profil dan status tersimpan.');
        router.get(
            showCandidate(candidate.id),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: (page) => {
                    if (typeof page.props.isSaved === 'boolean') {
                        setSaved(page.props.isSaved);
                    }

                    setIsUnavailable(false);
                    setHasError(false);
                    setFeedback(
                        'Profil dan status tersimpan telah diperbarui.',
                    );
                },
                onError: () => {
                    failRequest();
                },
                onHttpException: (response) => failRequest(response.status),
                onNetworkError: () => failRequest(),
                onFinish: () => setIsBusy(false),
            },
        );
    };

    const toggleSave = () => {
        if (isBusy || isUnavailable) {
            return;
        }

        const nextSaved = !saved;
        setIsBusy(true);
        setHasError(false);
        setFeedback('Memproses perubahan kandidat tersimpan.');
        const options = {
            preserveScroll: true,
            preserveState: true,
            onSuccess: (page: { props: Record<string, unknown> }) => {
                setSaved(
                    typeof page.props.isSaved === 'boolean'
                        ? page.props.isSaved
                        : nextSaved,
                );
                setFeedback(
                    nextSaved
                        ? 'Kandidat berhasil disimpan.'
                        : 'Kandidat dihapus dari simpanan.',
                );
            },
            onError: () => {
                failRequest();
            },
            onHttpException: (response: { status: number }) =>
                failRequest(response.status),
            onNetworkError: () => failRequest(),
            onFinish: () => setIsBusy(false),
        };

        if (nextSaved) {
            router.post(saveCandidate(candidate.id), {}, options);
        } else {
            router.delete(unsaveCandidate(candidate.id), options);
        }
    };

    if (isUnavailable) {
        return (
            <>
                <Head title="Profil tidak tersedia" />
                <AppPage className="max-w-none min-w-0">
                    <section
                        role="alert"
                        className="rounded-3xl border border-border bg-white p-6 shadow-md sm:p-8"
                    >
                        <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-primary">
                            <LockKeyhole
                                aria-hidden="true"
                                className="size-6"
                            />
                        </span>
                        <h1 className="mt-5 text-2xl font-bold">
                            Profil tidak tersedia
                        </h1>
                        <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
                            Hak akses atau jangkauan profil mungkin telah
                            berubah. Informasi sebelumnya tidak ditampilkan.
                            Periksa kembali atau lanjutkan pencarian.
                        </p>
                        <div className="mt-6 flex flex-wrap gap-3">
                            <Button
                                className="h-11"
                                disabled={isBusy}
                                onClick={reloadProfile}
                            >
                                {isBusy ? (
                                    <Spinner aria-hidden="true" />
                                ) : (
                                    <RefreshCw
                                        aria-hidden="true"
                                        className="size-4"
                                    />
                                )}
                                Periksa kembali
                            </Button>
                            <Button asChild variant="outline" className="h-11">
                                <Link href={talentSearch()}>
                                    Kembali ke Cari Talenta
                                </Link>
                            </Button>
                        </div>
                        <p
                            role="status"
                            className="mt-4 min-h-5 text-sm text-muted-foreground"
                        >
                            {feedback}
                        </p>
                    </section>
                </AppPage>
            </>
        );
    }

    const facts = [
        { label: 'Skill dibagikan', value: candidate.skills.length },
        { label: 'Badge dibagikan', value: candidate.badges.length },
        {
            label: 'Kontribusi dibagikan',
            value: candidate.contributions.length,
        },
    ];

    return (
        <>
            <Head title={headline + ' | SATU'} />
            <AppPage className="max-w-none min-w-0">
                <div className="space-y-6" data-test="candidate-detail-root">
                    <header className="relative isolate overflow-hidden rounded-[2rem] border border-primary/10 bg-gradient-to-br from-[#dff1ff] via-[#edf6ff] to-white p-6 shadow-md sm:px-8 sm:py-7">
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0"
                        >
                            <ArchiveArt className="absolute top-12 right-6 hidden w-32 -rotate-6 opacity-50 lg:block 2xl:w-40" />
                            <span className="absolute top-12 right-8 h-10 w-2 rotate-12 rounded-full bg-[#ffb85c]/75" />
                        </div>
                        <div className="relative">
                            <Link
                                href={talentSearch()}
                                className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl text-sm font-semibold text-primary transition-colors hover:text-primary/80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                            >
                                <ArrowLeft
                                    aria-hidden="true"
                                    className="size-4"
                                />
                                Kembali ke Cari Talenta
                            </Link>
                            <div className="mt-4 flex items-start gap-4 sm:gap-5 lg:pr-36 2xl:pr-44">
                                <span className="hidden size-16 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-white text-primary shadow-sm sm:flex">
                                    <BookOpenCheck
                                        aria-hidden="true"
                                        className="size-8"
                                    />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold tracking-wider text-primary uppercase">
                                        Profil kandidat
                                    </p>
                                    <h1 className="mt-2 text-2xl leading-tight font-bold tracking-tight break-words sm:text-3xl">
                                        {headline}
                                    </h1>
                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                        <span className="font-label text-xs text-muted-foreground">
                                            FOLIO-{candidate.id}
                                        </span>
                                        <span
                                            className={cn(
                                                'max-w-full rounded-full border px-3 py-1 text-xs font-semibold',
                                                availability.className,
                                            )}
                                        >
                                            {availability.label}
                                        </span>
                                        {candidate.verified_at && (
                                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                                                <CheckCircle2
                                                    aria-hidden="true"
                                                    className="size-4"
                                                />
                                                Portofolio terverifikasi
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-muted-foreground">
                                        <Building2
                                            aria-hidden="true"
                                            className="mt-1 size-4 shrink-0"
                                        />
                                        <span className="min-w-0 break-words">
                                            {candidate.institution_name ||
                                                'Institusi kampus belum dibagikan.'}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </header>

                    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]">
                        <aside
                            aria-label="Tindakan dan privasi kandidat"
                            className="min-w-0 space-y-6 xl:col-start-2 xl:row-start-1"
                        >
                            <section
                                aria-labelledby="candidate-actions-heading"
                                className="rounded-3xl border border-primary/15 bg-gradient-to-br from-white to-accent/60 p-5 shadow-md sm:p-6"
                            >
                                <span className="flex size-11 items-center justify-center rounded-2xl border border-primary/10 bg-white text-primary shadow-xs">
                                    <Bookmark
                                        aria-hidden="true"
                                        className="size-5"
                                    />
                                </span>
                                <p className="mt-4 text-xs font-semibold tracking-wide text-primary uppercase">
                                    Langkah berikutnya
                                </p>
                                <h2
                                    id="candidate-actions-heading"
                                    className="mt-2 text-xl font-bold"
                                >
                                    Simpan untuk ditinjau lagi.
                                </h2>
                                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                                    Simpan kandidat agar mudah ditemukan
                                    kembali. Menyimpan tidak mengirim permintaan
                                    kontak.
                                </p>
                                <Button
                                    aria-pressed={saved}
                                    disabled={isBusy}
                                    onClick={toggleSave}
                                    className="mt-5 h-11 w-full"
                                    variant={saved ? 'outline' : 'default'}
                                >
                                    {isBusy ? (
                                        <Spinner aria-hidden="true" />
                                    ) : saved ? (
                                        <BookmarkCheck
                                            aria-hidden="true"
                                            className="size-4"
                                        />
                                    ) : (
                                        <Bookmark
                                            aria-hidden="true"
                                            className="size-4"
                                        />
                                    )}
                                    {isBusy
                                        ? 'Memproses'
                                        : saved
                                          ? 'Hapus dari simpanan'
                                          : 'Simpan kandidat'}
                                </Button>
                                <p
                                    role="status"
                                    className={cn(
                                        'mt-3 min-h-5 text-sm leading-6',
                                        hasError
                                            ? 'text-correction'
                                            : 'text-muted-foreground',
                                    )}
                                >
                                    {feedback}
                                </p>
                                {hasError && (
                                    <Button
                                        variant="outline"
                                        className="mt-3 h-11 w-full"
                                        onClick={reloadProfile}
                                        disabled={isBusy}
                                    >
                                        <RefreshCw
                                            aria-hidden="true"
                                            className="size-4"
                                        />
                                        Muat ulang status
                                    </Button>
                                )}
                                <Link
                                    href={savedCandidates()}
                                    className="mt-3 flex min-h-11 cursor-pointer items-center justify-between gap-2 rounded-xl text-sm font-semibold text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                                >
                                    <span>Lihat kandidat tersimpan</span>
                                    <ChevronRight
                                        aria-hidden="true"
                                        className="size-4 shrink-0"
                                    />
                                </Link>
                            </section>
                            <section
                                aria-labelledby="candidate-contact-heading"
                                className="rounded-3xl border border-border bg-white p-5 shadow-sm sm:p-6"
                            >
                                <div className="flex items-start gap-3">
                                    <LockKeyhole
                                        aria-hidden="true"
                                        className="mt-1 size-5 shrink-0 text-primary"
                                    />
                                    <div className="min-w-0">
                                        <h2
                                            id="candidate-contact-heading"
                                            className="text-lg font-bold"
                                        >
                                            Kontak dengan persetujuan.
                                        </h2>
                                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                                            {contactConsequenceNotice}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-5 border-t border-border pt-5">
                                    <Button
                                        type="button"
                                        disabled
                                        aria-describedby="candidate-contact-unavailable"
                                        className="h-auto min-h-11 w-full whitespace-normal"
                                        variant="outline"
                                    >
                                        <Send
                                            aria-hidden="true"
                                            className="size-4"
                                        />
                                        Kirim permintaan kontak
                                    </Button>
                                    <p
                                        id="candidate-contact-unavailable"
                                        className="mt-3 text-xs leading-5 text-muted-foreground"
                                    >
                                        Pengiriman permintaan kontak belum
                                        tersedia di halaman profil ini.
                                    </p>
                                    <Link
                                        href={contactRequests()}
                                        className="mt-3 flex min-h-11 cursor-pointer items-center justify-between gap-2 rounded-xl text-sm font-semibold text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                                    >
                                        <span>Lihat permintaan kontak</span>
                                        <ChevronRight
                                            aria-hidden="true"
                                            className="size-4 shrink-0"
                                        />
                                    </Link>
                                </div>
                            </section>
                            <section
                                aria-labelledby="candidate-verification-heading"
                                className="border-t border-border px-1 pt-5"
                            >
                                <div className="flex items-start gap-3">
                                    <ShieldCheck
                                        aria-hidden="true"
                                        className="mt-1 size-5 shrink-0 text-primary"
                                    />
                                    <div className="min-w-0">
                                        <h2
                                            id="candidate-verification-heading"
                                            className="text-lg font-bold"
                                        >
                                            Konteks verifikasi
                                        </h2>
                                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                            {candidate.verified_at
                                                ? 'Profil memuat informasi verifikasi portofolio.'
                                                : 'Informasi verifikasi portofolio belum tersedia.'}
                                        </p>
                                        {verifiedDate && (
                                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                                Tanggal verifikasi:{' '}
                                                {verifiedDate}.
                                            </p>
                                        )}
                                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                                            Status ini tidak berarti setiap
                                            skill atau kontribusi telah
                                            diverifikasi secara terpisah.
                                        </p>
                                    </div>
                                </div>
                            </section>
                        </aside>

                        <div className="min-w-0 space-y-6 xl:col-start-1 xl:row-start-1">
                            <section
                                aria-labelledby="candidate-about-heading"
                                className="rounded-3xl border border-primary/15 bg-white p-6 shadow-md sm:p-8"
                            >
                                <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                                    Cerita di balik karya
                                </p>
                                <h2
                                    id="candidate-about-heading"
                                    className="mt-2 text-2xl font-bold"
                                >
                                    Tentang kandidat
                                </h2>
                                <p className="mt-4 text-base leading-7 break-words whitespace-pre-line text-muted-foreground">
                                    {candidate.bio ||
                                        'Kandidat belum membagikan ringkasan profil.'}
                                </p>
                                <dl className="mt-6 grid gap-4 border-t border-border pt-5 sm:grid-cols-3 sm:gap-6">
                                    {facts.map((fact) => (
                                        <div
                                            key={fact.label}
                                            className="flex items-baseline gap-3 sm:flex-col sm:items-start sm:gap-1"
                                        >
                                            <dt className="text-sm text-muted-foreground">
                                                {fact.label}
                                            </dt>
                                            <dd className="order-first text-2xl font-bold tracking-tight">
                                                {fact.value}
                                            </dd>
                                        </div>
                                    ))}
                                </dl>
                                <div className="mt-6 rounded-2xl border border-primary/10 bg-gradient-to-br from-accent/80 to-background p-5 sm:p-6">
                                    <div className="flex items-start gap-3">
                                        <Sparkles
                                            aria-hidden="true"
                                            className="mt-1 size-5 shrink-0 text-primary"
                                        />
                                        <div>
                                            <h3 className="text-lg font-bold">
                                                Keahlian yang dibagikan
                                            </h3>
                                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                                Bekal yang dapat kamu
                                                pertimbangkan untuk peluang
                                                kolaborasi.
                                            </p>
                                        </div>
                                    </div>
                                    {candidate.skills.length > 0 ? (
                                        <ul
                                            aria-label="Keahlian kandidat"
                                            className="mt-4 flex flex-wrap gap-2"
                                        >
                                            {candidate.skills.map(
                                                (skill, index) => (
                                                    <li
                                                        key={index}
                                                        className="max-w-full rounded-xl border border-primary/15 bg-white px-3 py-2 text-sm font-medium break-words"
                                                    >
                                                        {skill}
                                                    </li>
                                                ),
                                            )}
                                        </ul>
                                    ) : (
                                        <p className="mt-4 text-sm leading-6 text-muted-foreground">
                                            Belum ada skill yang dibagikan.
                                        </p>
                                    )}
                                </div>
                            </section>

                            <section
                                aria-labelledby="candidate-contributions-heading"
                                className="min-w-0 space-y-4"
                            >
                                <div className="flex items-start gap-3 px-1">
                                    <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-primary/10 bg-white text-primary shadow-sm">
                                        <FileText
                                            aria-hidden="true"
                                            className="size-5"
                                        />
                                    </span>
                                    <div>
                                        <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                                            Ruang karya
                                        </p>
                                        <h2
                                            id="candidate-contributions-heading"
                                            className="mt-1 text-2xl font-bold"
                                        >
                                            Kontribusi yang dibagikan
                                        </h2>
                                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                            Baca pengalaman yang tersedia tanpa
                                            membuka bukti privat mahasiswa.
                                        </p>
                                    </div>
                                </div>
                                {candidate.contributions.length > 0 ? (
                                    <ul
                                        aria-label="Kontribusi kandidat"
                                        className="grid gap-4"
                                    >
                                        {candidate.contributions.map(
                                            (contribution, index) => {
                                                const title =
                                                    typeof contribution ===
                                                    'string'
                                                        ? contribution
                                                        : typeof contribution?.title ===
                                                            'string'
                                                          ? contribution.title
                                                          : 'Karya yang dibagikan';
                                                const role =
                                                    typeof contribution ===
                                                        'object' &&
                                                    typeof contribution?.role ===
                                                        'string'
                                                        ? contribution.role
                                                        : null;

                                                return (
                                                    <li
                                                        key={index}
                                                        className="flex min-w-0 items-start gap-4 rounded-3xl border border-border bg-white p-5 shadow-sm sm:p-6"
                                                    >
                                                        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-primary">
                                                            <BookOpenCheck
                                                                aria-hidden="true"
                                                                className="size-5"
                                                            />
                                                        </span>
                                                        <div className="min-w-0">
                                                            <p className="font-label text-xs text-muted-foreground">
                                                                CATATAN{' '}
                                                                {String(
                                                                    index + 1,
                                                                ).padStart(
                                                                    2,
                                                                    '0',
                                                                )}
                                                            </p>
                                                            <h3 className="mt-2 text-xl leading-snug font-bold break-words sm:text-2xl">
                                                                {title ||
                                                                    'Karya yang dibagikan'}
                                                            </h3>
                                                            {role && (
                                                                <p className="mt-3 text-sm leading-6 break-words text-muted-foreground">
                                                                    Peran:{' '}
                                                                    {role}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </li>
                                                );
                                            },
                                        )}
                                    </ul>
                                ) : (
                                    <div className="flex flex-col items-start gap-5 rounded-3xl border border-dashed border-primary/20 bg-white p-6 sm:flex-row sm:items-center sm:p-8">
                                        <ArchiveArt className="w-24 shrink-0" />
                                        <div>
                                            <h3 className="text-xl font-bold">
                                                Belum ada kontribusi yang
                                                dibagikan
                                            </h3>
                                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                                Kandidat belum menampilkan
                                                catatan kontribusi pada profil
                                                ini. Kamu tetap dapat membaca
                                                ringkasan dan keahliannya.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </section>

                            <section
                                aria-labelledby="candidate-badges-heading"
                                className="border-t border-border px-1 pt-6"
                            >
                                <div className="flex items-start gap-3">
                                    <Award
                                        aria-hidden="true"
                                        className="mt-1 size-5 shrink-0 text-primary"
                                    />
                                    <div>
                                        <h2
                                            id="candidate-badges-heading"
                                            className="text-xl font-bold"
                                        >
                                            Badge yang dibagikan
                                        </h2>
                                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                            Pengakuan yang ditampilkan pada
                                            portofolio kandidat.
                                        </p>
                                    </div>
                                </div>
                                {candidate.badges.length > 0 ? (
                                    <ul
                                        aria-label="Badge kandidat"
                                        className="mt-4 flex flex-wrap gap-2"
                                    >
                                        {candidate.badges.map(
                                            (badge, index) => (
                                                <li
                                                    key={index}
                                                    className="inline-flex max-w-full items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900"
                                                >
                                                    <Award
                                                        aria-hidden="true"
                                                        className="mt-1 size-4 shrink-0"
                                                    />
                                                    <span className="min-w-0 break-words">
                                                        {badge}
                                                    </span>
                                                </li>
                                            ),
                                        )}
                                    </ul>
                                ) : (
                                    <p className="mt-4 text-sm leading-6 text-muted-foreground">
                                        Belum ada badge yang dibagikan.
                                    </p>
                                )}
                            </section>
                            <div className="flex items-start gap-3 border-t border-border px-1 pt-5 text-sm leading-6 text-muted-foreground">
                                <AlertCircle
                                    aria-hidden="true"
                                    className="mt-1 size-5 shrink-0 text-primary"
                                />
                                <p>
                                    Profil ini hanya menampilkan informasi yang
                                    diizinkan mahasiswa. Bukti privat dan kontak
                                    langsung tidak ditampilkan.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </AppPage>
        </>
    );
}

export default function CandidateDetail(props: CandidateDetailProps) {
    return <CandidateProfile key={props.candidate.id} {...props} />;
}

CandidateDetail.layout = {
    breadcrumbs: [
        { title: 'Talent Portal', href: talentSearch() },
        { title: 'Cari Talenta', href: talentSearch() },
        { title: 'Detail profil', href: '#' },
    ],
};
