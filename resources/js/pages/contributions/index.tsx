import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowUpRight,
    CalendarDays,
    CircleAlert,
    ClipboardList,
    FileText,
    FolderOpen,
    Plus,
    RefreshCw,
    Search,
    ShieldCheck,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { AppPage } from '@/components/app-page';
import {
    ContributionStatusBadge,
    contributionStatusMeta,
} from '@/components/contributions/contribution-status';
import { DashboardArchiveArt as ArchiveArt } from '@/components/dashboard-archive-art';
import StudentMenuHero from '@/components/student-menu-hero';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
    create as contributionsCreate,
    index as contributionsIndex,
    show as contributionShow,
} from '@/routes/contributions';
import { index as projectsIndex } from '@/routes/projects';
import type {
    ContributionStatus,
    ContributionSummary,
} from '@/types/contribution';

type ContributionsIndexProps = {
    contributions: ContributionSummary[];
    can_create: boolean;
};

function formatDate(value: string): string {
    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? 'Tanggal tidak tersedia'
        : new Intl.DateTimeFormat('id-ID', {
              dateStyle: 'medium',
              timeZone: 'UTC',
          }).format(date);
}

function ContributionsRefreshState() {
    return (
        <div
            role="status"
            aria-live="polite"
            aria-busy="true"
            data-test="contributions-loading"
            className="grid min-w-0 gap-4"
        >
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw
                    aria-hidden="true"
                    className="size-4 animate-spin motion-reduce:animate-none"
                />
                Memuat pembaruan kontribusi. Catatan sebelumnya tetap terlihat.
            </p>
            <div
                aria-hidden="true"
                className="grid min-w-0 gap-5 xl:grid-cols-2"
            >
                {[1, 2].map((item) => (
                    <div
                        key={item}
                        className="grid min-w-0 gap-4 rounded-3xl border border-border bg-card p-5 sm:p-6"
                    >
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-6 w-4/5" />
                        <Skeleton className="h-4 w-3/5" />
                        <Skeleton className="h-28 w-full rounded-2xl" />
                        <div className="grid grid-cols-2 gap-3 border-t border-border pt-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <Skeleton className="h-11 w-full rounded-xl" />
                    </div>
                ))}
            </div>
        </div>
    );
}

function EmptyContributions({ canCreate }: { canCreate: boolean }) {
    return (
        <section
            data-test="contributions-empty"
            className="grid min-w-0 justify-items-center gap-5 rounded-3xl border border-dashed border-border bg-linear-to-b from-card to-background px-5 py-12 text-center sm:px-8"
        >
            <ArchiveArt className="w-28" />
            <div className="grid gap-2">
                <h2 className="text-title font-semibold">
                    Mulai catatan kontribusi pertamamu.
                </h2>
                <p className="max-w-[58ch] text-sm leading-6 text-muted-foreground">
                    Pekerjaan yang kamu lakukan layak dicatat. Tautkan tugas,
                    ceritakan hasilnya, dan sertakan bukti untuk membantu kampus
                    meninjau kontribusimu.
                </p>
            </div>
            {canCreate ? (
                <Button
                    asChild
                    className="h-auto min-h-11 max-w-full py-3 whitespace-normal"
                >
                    <Link
                        href={contributionsCreate()}
                        data-test="create-contribution-link"
                    >
                        <Plus aria-hidden="true" />
                        Susun kontribusi pertama
                    </Link>
                </Button>
            ) : (
                <div className="grid min-w-0 justify-items-center gap-3">
                    <p className="max-w-[56ch] rounded-2xl border border-pending/30 bg-pending-subtle p-4 text-sm leading-6 text-pending-subtle-foreground">
                        Belum ada proyek yang dapat dipakai untuk menyusun
                        kontribusi. Bergabunglah dengan proyek terlebih dahulu.
                    </p>
                    <Button variant="outline" asChild>
                        <Link href={projectsIndex()}>
                            <FolderOpen aria-hidden="true" />
                            Jelajahi proyek
                        </Link>
                    </Button>
                </div>
            )}
        </section>
    );
}

function ContributionCard({
    contribution,
}: {
    contribution: ContributionSummary;
}) {
    const meta = contributionStatusMeta[contribution.status];
    const version = contribution.current_version;
    const action =
        contribution.status === 'draft'
            ? 'Lihat draft'
            : contribution.status === 'revision'
              ? 'Tanggapi revisi'
              : 'Lihat detail';

    return (
        <li className="grid min-w-0 gap-5 rounded-3xl border border-border bg-card p-5 shadow-sm focus-within:border-primary/30 focus-within:shadow-md motion-safe:transition-[border-color,box-shadow] motion-safe:duration-standard sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="grid size-11 place-items-center rounded-2xl bg-accent text-primary">
                    <FileText aria-hidden="true" className="size-5" />
                </span>
                <ContributionStatusBadge status={contribution.status} />
            </div>
            <div className="grid min-w-0 gap-2">
                <h3 className="text-xl leading-tight font-bold tracking-tight wrap-anywhere sm:text-2xl">
                    <Link
                        href={contributionShow(contribution.id)}
                        className="cursor-pointer rounded-sm hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                        {version?.task?.title ?? 'Tugas belum ditautkan'}
                    </Link>
                </h3>
                <p className="flex min-w-0 items-start gap-2 text-sm text-muted-foreground">
                    <FolderOpen
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0"
                    />
                    <span className="min-w-0 wrap-anywhere">
                        {contribution.project.title}
                    </span>
                </p>
            </div>
            <div
                className={cn(
                    'grid min-w-0 gap-2 rounded-2xl border p-4',
                    meta.className,
                )}
            >
                <p className="text-xs font-semibold">Langkah berikutnya</p>
                <p className="text-sm leading-6 font-semibold">
                    {meta.nextStep}
                </p>
                <p className="text-xs leading-5">{meta.description}</p>
            </div>
            <dl className="mt-auto grid min-w-0 grid-cols-2 gap-3 border-t border-border/70 pt-4">
                <div className="grid gap-1">
                    <dt className="text-xs text-muted-foreground">
                        Versi aktif
                    </dt>
                    <dd className="text-sm font-semibold">
                        {version
                            ? 'Versi ' + version.version_number
                            : 'Belum ada versi'}
                    </dd>
                </div>
                <div className="grid gap-1">
                    <dt className="text-xs text-muted-foreground">
                        Pembaruan terakhir
                    </dt>
                    <dd className="flex items-center gap-2 text-sm font-medium">
                        <CalendarDays
                            aria-hidden="true"
                            className="size-4 shrink-0 text-primary"
                        />
                        <time dateTime={contribution.updated_at}>
                            {formatDate(contribution.updated_at)}
                        </time>
                    </dd>
                </div>
            </dl>
            <Button
                asChild
                variant="outline"
                className="min-h-11 w-full border-primary/25 bg-accent/30 text-primary hover:border-primary hover:bg-accent hover:text-primary motion-safe:duration-standard"
            >
                <Link
                    href={contributionShow(contribution.id)}
                    data-test={'contribution-row-' + contribution.id}
                    aria-label={
                        action +
                        ': ' +
                        (version?.task?.title ?? contribution.project.title)
                    }
                >
                    {action}
                    <ArrowUpRight aria-hidden="true" />
                </Link>
            </Button>
        </li>
    );
}

export default function ContributionsIndex({
    contributions,
    can_create: canCreate,
}: ContributionsIndexProps) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshError, setRefreshError] = useState<string | null>(null);
    const [isForbidden, setIsForbidden] = useState(false);
    const [query, setQuery] = useState('');
    const [status, setStatus] = useState<ContributionStatus | 'all'>('all');
    const visibleContributions = useMemo(() => {
        const search = query.trim().toLocaleLowerCase('id-ID');

        return contributions.filter(
            (item) =>
                (status === 'all' || item.status === status) &&
                (
                    item.project.title +
                    ' ' +
                    (item.current_version?.task?.title ?? '')
                )
                    .toLocaleLowerCase('id-ID')
                    .includes(search),
        );
    }, [contributions, query, status]);

    function refresh(): void {
        setRefreshError(null);
        setIsRefreshing(true);
        router.reload({
            only: ['contributions', 'can_create'],
            onSuccess: () => {
                setRefreshError(null);
                setIsForbidden(false);
            },
            onError: () =>
                setRefreshError(
                    'Daftar belum diperbarui. Catatan yang terlihat tetap tersimpan. Coba lagi.',
                ),
            onHttpException: (response) => {
                setIsForbidden(response.status === 403);
                setRefreshError(
                    response.status === 403
                        ? 'Akses daftar kontribusi tidak tersedia untuk akunmu saat ini. Periksa afiliasi kampus atau coba muat ulang.'
                        : 'Daftar belum diperbarui. Catatan yang terlihat tetap tersimpan. Coba muat ulang lagi.',
                );

                return false;
            },
            onNetworkError: () => {
                setRefreshError(
                    'Daftar belum diperbarui. Catatan yang terlihat tetap tersimpan. Periksa koneksi lalu coba lagi.',
                );

                return false;
            },
            onFinish: () => setIsRefreshing(false),
        });
    }

    return (
        <>
            <Head title="Kontribusi" />
            <AppPage className="min-w-0">
                <div
                    className="contribution-discovery grid w-full min-w-0 gap-6"
                    data-test="contributions-root"
                >
                    <StudentMenuHero
                        theme="contributions"
                        icon={FileText}
                        eyebrow="Catatan kontribusimu"
                        title="Pekerjaanmu punya cerita."
                        description="Catat bagian yang kamu kerjakan, sertakan bukti, lalu ikuti proses validasi kampus."
                        pose="contribution-notes"
                        testId="contributions-header"
                        note={
                            <p className="flex min-w-0 items-start gap-2">
                                <ShieldCheck
                                    aria-hidden="true"
                                    className="mt-0.5 size-4 shrink-0 text-primary"
                                />
                                <span>
                                    Bukti privat tetap mengikuti izin akses
                                    proyek dan validasi kampus.
                                </span>
                            </p>
                        }
                    >
                        {canCreate && !isForbidden && (
                            <Button
                                asChild
                                className="student-menu-hero__primary min-h-11 rounded-xl px-4"
                            >
                                <Link
                                    href={contributionsCreate()}
                                    data-test="create-contribution-link"
                                >
                                    <Plus aria-hidden="true" />
                                    Susun kontribusi
                                </Link>
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="outline"
                            className="min-h-11 bg-card"
                            onClick={refresh}
                            disabled={isRefreshing}
                            data-test="contributions-refresh"
                        >
                            <RefreshCw
                                aria-hidden="true"
                                className={cn(
                                    isRefreshing &&
                                        'animate-spin motion-reduce:animate-none',
                                )}
                            />
                            Muat ulang
                        </Button>
                    </StudentMenuHero>
                    <section
                        aria-label="Cara kerja kontribusi"
                        className="grid min-w-0 gap-5 border-y border-border/70 py-5 sm:grid-cols-3 sm:gap-6"
                    >
                        {[
                            {
                                icon: FileText,
                                title: 'Susun catatan',
                                text: 'Hubungkan tugas, cerita pekerjaan, dan bukti privat.',
                            },
                            {
                                icon: ShieldCheck,
                                title: 'Kirim untuk validasi',
                                text: 'Kampus meninjau dan dapat meminta perbaikan.',
                            },
                            {
                                icon: ClipboardList,
                                title: 'Kelola portofolio',
                                text: 'Kontribusi tervalidasi menjadi sumber karya. Visibilitas tetap pilihanmu.',
                            },
                        ].map((step, index) => (
                            <div
                                key={step.title}
                                className="flex min-w-0 items-start gap-3 px-1 sm:px-0"
                            >
                                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-primary">
                                    <step.icon
                                        aria-hidden="true"
                                        className="size-5"
                                    />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold">
                                        {index + 1}. {step.title}
                                    </p>
                                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                        {step.text}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </section>
                    {refreshError && (
                        <div
                            role="alert"
                            data-test="contributions-refresh-error"
                            className="flex min-w-0 items-start gap-3 rounded-2xl border border-correction/30 bg-correction-subtle p-4 text-sm leading-6 text-correction-subtle-foreground"
                        >
                            <CircleAlert
                                aria-hidden="true"
                                className="mt-1 size-4 shrink-0"
                            />
                            <p className="wrap-anywhere">{refreshError}</p>
                        </div>
                    )}
                    {!isForbidden &&
                        (contributions.length === 0 ? (
                            <div
                                aria-busy={isRefreshing}
                                data-test="contributions-state"
                            >
                                {isRefreshing && <ContributionsRefreshState />}
                                <EmptyContributions canCreate={canCreate} />
                            </div>
                        ) : (
                            <section
                                aria-labelledby="contributions-ledger-title"
                                aria-busy={isRefreshing}
                                data-test="contributions-ledger"
                                className="grid min-w-0 gap-5"
                            >
                                <div className="grid min-w-0 gap-5 rounded-3xl border border-primary/20 bg-card p-5 shadow-md sm:p-6">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-semibold text-primary">
                                                Buku besar kontribusi
                                            </p>
                                            <h2
                                                id="contributions-ledger-title"
                                                className="mt-2 text-xl leading-snug font-bold tracking-tight"
                                            >
                                                Catatan pekerjaanmu
                                            </h2>
                                        </div>
                                        <p
                                            role="status"
                                            aria-live="polite"
                                            className="rounded-full border border-border bg-accent px-3 py-1.5 text-xs font-medium text-primary"
                                        >
                                            {visibleContributions.length} dari{' '}
                                            {contributions.length} catatan
                                        </p>
                                    </div>
                                    <div className="grid min-w-0 gap-4 sm:grid-cols-[minmax(0,1fr)_14rem]">
                                        <div className="grid min-w-0 gap-2">
                                            <Label htmlFor="contribution-search">
                                                Cari catatan
                                            </Label>
                                            <div className="relative">
                                                <Search
                                                    aria-hidden="true"
                                                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                                                />
                                                <Input
                                                    id="contribution-search"
                                                    className="h-11 pl-9"
                                                    value={query}
                                                    onChange={(event) =>
                                                        setQuery(
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder="Cari proyek atau tugas"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid min-w-0 gap-2">
                                            <Label htmlFor="contribution-status-filter">
                                                Status validasi
                                            </Label>
                                            <select
                                                id="contribution-status-filter"
                                                className="h-11 w-full min-w-0 cursor-pointer rounded-xl border border-input bg-background px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:text-sm"
                                                value={status}
                                                onChange={(event) =>
                                                    setStatus(
                                                        event.target.value as
                                                            | ContributionStatus
                                                            | 'all',
                                                    )
                                                }
                                            >
                                                <option value="all">
                                                    Semua status
                                                </option>
                                                {Object.entries(
                                                    contributionStatusMeta,
                                                ).map(([value, meta]) => (
                                                    <option
                                                        key={value}
                                                        value={value}
                                                    >
                                                        {meta.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Urutan mengikuti pembaruan terakhir.
                                        Pencarian hanya pada catatan yang
                                        tersedia di daftar ini.
                                    </p>
                                </div>
                                {isRefreshing && <ContributionsRefreshState />}
                                {visibleContributions.length > 0 ? (
                                    <ol className="grid min-w-0 gap-5 xl:grid-cols-2">
                                        {visibleContributions.map(
                                            (contribution) => (
                                                <ContributionCard
                                                    key={contribution.id}
                                                    contribution={contribution}
                                                />
                                            ),
                                        )}
                                    </ol>
                                ) : (
                                    <div
                                        data-test="contributions-no-matches"
                                        className="grid justify-items-center gap-3 rounded-3xl border border-dashed border-border bg-card p-8 text-center"
                                    >
                                        <Search
                                            aria-hidden="true"
                                            className="size-8 text-primary"
                                        />
                                        <h3 className="text-title font-semibold">
                                            Belum ada catatan yang cocok.
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            Coba kata kunci lain atau tampilkan
                                            semua status.
                                        </p>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setQuery('');
                                                setStatus('all');
                                            }}
                                        >
                                            Atur ulang pencarian
                                        </Button>
                                    </div>
                                )}
                            </section>
                        ))}
                </div>
            </AppPage>
        </>
    );
}

ContributionsIndex.layout = {
    breadcrumbs: [{ title: 'Kontribusi', href: contributionsIndex() }],
};
