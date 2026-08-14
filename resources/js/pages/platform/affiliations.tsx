import { Head } from '@inertiajs/react';
import {
    Building2,
    CheckCircle2,
    ClipboardCheck,
    Database,
    Search,
    ShieldCheck,
    UsersRound,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AppPage } from '@/components/app-page';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type InstitutionStatus = 'pending' | 'active' | 'suspended' | 'archived';

type InstitutionItem = {
    id: number;
    name: string;
    slug: string;
    status: InstitutionStatus;
    membershipsCount: number;
    affiliationsCount: number;
    pendingAffiliationsCount: number;
    verifiedAffiliationsCount: number;
    hasActiveRoster: boolean;
    updatedAt: string | null;
};

type Props = {
    filters: {
        q: string;
        status: 'all' | InstitutionStatus;
    };
    summary: {
        institutions: number;
        activeInstitutions: number;
        pendingAffiliations: number;
        institutionsWithQueue: number;
    };
    institutions: InstitutionItem[];
};

const statusMeta: Record<
    InstitutionStatus,
    { label: string; className: string }
> = {
    active: {
        label: 'Aktif',
        className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    },
    pending: {
        label: 'Menunggu aktivasi',
        className: 'border-amber-200 bg-amber-50 text-amber-800',
    },
    suspended: {
        label: 'Ditangguhkan',
        className: 'border-rose-200 bg-rose-50 text-rose-800',
    },
    archived: {
        label: 'Diarsipkan',
        className: 'border-slate-200 bg-slate-100 text-slate-700',
    },
};

function formatUpdatedAt(value: string | null): string {
    if (value === null) {
        return 'Belum ada pembaruan';
    }

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeZone: 'Asia/Jakarta',
    }).format(new Date(value));
}

function PlatformBoundary() {
    return (
        <div className="grid gap-7">
            <div>
                <p className="font-label text-label text-primary">
                    Ruang kendali platform
                </p>
                <h2 className="mt-2 text-xl font-bold tracking-[-0.02em] text-foreground">
                    Pengawasan yang tetap menjaga batas data
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Admin platform melihat kondisi agregat setiap kampus tanpa
                    membuka NIM, nomor WhatsApp, atau berkas mahasiswa.
                </p>
            </div>

            <div className="grid gap-4 border-t border-border pt-6">
                <div className="flex items-start gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                        <ShieldCheck aria-hidden="true" className="size-4" />
                    </span>
                    <div>
                        <p className="text-sm font-semibold text-foreground">
                            Identitas tetap privat
                        </p>
                        <p className="mt-1 text-sm leading-5 text-muted-foreground">
                            Halaman ini hanya menampilkan jumlah dan kesiapan
                            operasional institusi.
                        </p>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                        <CheckCircle2 aria-hidden="true" className="size-4" />
                    </span>
                    <div>
                        <p className="text-sm font-semibold text-foreground">
                            Keputusan tetap di kampus
                        </p>
                        <p className="mt-1 text-sm leading-5 text-muted-foreground">
                            Review detail dan keputusan afiliasi dilakukan oleh
                            admin kampus yang berwenang.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PlatformAffiliations({
    filters,
    summary,
    institutions,
}: Props) {
    const [query, setQuery] = useState(filters.q);
    const [status, setStatus] = useState<'all' | InstitutionStatus>(
        filters.status,
    );

    useEffect(() => {
        const url = new URL(window.location.href);
        const normalizedQuery = query.trim();

        if (normalizedQuery === '') {
            url.searchParams.delete('q');
        } else {
            url.searchParams.set('q', normalizedQuery);
        }

        if (status === 'all') {
            url.searchParams.delete('status');
        } else {
            url.searchParams.set('status', status);
        }

        window.history.replaceState(window.history.state, '', url);
    }, [query, status]);

    const filteredInstitutions = useMemo(() => {
        const normalizedQuery = query.trim().toLocaleLowerCase('id-ID');

        return institutions.filter((institution) => {
            const matchesQuery =
                normalizedQuery === '' ||
                institution.name
                    .toLocaleLowerCase('id-ID')
                    .includes(normalizedQuery) ||
                institution.slug
                    .toLocaleLowerCase('id-ID')
                    .includes(normalizedQuery);
            const matchesStatus =
                status === 'all' || institution.status === status;

            return matchesQuery && matchesStatus;
        });
    }, [institutions, query, status]);

    return (
        <>
            <Head title="Afiliasi kampus" />

            <AppPage
                contextRail={<PlatformBoundary />}
                contextRailLabel="Batas akses admin platform"
            >
                <div
                    className="mx-auto w-full max-w-6xl"
                    data-test="platform-affiliation-root"
                >
                    <header className="relative overflow-hidden rounded-3xl border border-blue-100 bg-white px-5 py-7 shadow-[0_18px_50px_-32px_rgba(30,64,175,0.45)] sm:px-7 sm:py-8 lg:px-9">
                        <div
                            aria-hidden="true"
                            className="absolute -top-20 -right-20 size-64 rounded-full bg-blue-100/70 blur-3xl"
                        />
                        <div className="relative grid gap-7 lg:grid-cols-[minmax(0,1.35fr)_minmax(17rem,0.65fr)] lg:items-end">
                            <div>
                                <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                                    <ShieldCheck
                                        aria-hidden="true"
                                        className="size-4"
                                    />
                                    Operasi platform
                                </div>
                                <h1 className="mt-3 max-w-[19ch] text-3xl font-bold tracking-[-0.035em] text-balance text-slate-950 sm:text-4xl">
                                    Afiliasi kampus dalam satu pandangan
                                </h1>
                                <p className="mt-4 max-w-[66ch] text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
                                    Pantau kesiapan institusi dan beban
                                    verifikasi secara lintas kampus. Data
                                    mahasiswa tetap terlindungi di ruang kerja
                                    masing-masing institusi.
                                </p>
                            </div>

                            <div className="overflow-hidden rounded-2xl border border-blue-100 bg-blue-50/80">
                                <div className="flex items-center justify-between gap-4 border-b border-blue-100 px-5 py-4">
                                    <span className="text-sm font-semibold text-blue-950">
                                        Perlu perhatian
                                    </span>
                                    <ClipboardCheck
                                        aria-hidden="true"
                                        className="size-5 text-blue-700"
                                    />
                                </div>
                                <div className="grid grid-cols-2 divide-x divide-blue-100">
                                    <div className="px-5 py-4">
                                        <strong className="block text-2xl font-bold tracking-[-0.03em] text-blue-950">
                                            {summary.pendingAffiliations}
                                        </strong>
                                        <span className="mt-1 block text-xs leading-5 text-blue-800">
                                            berkas menunggu
                                        </span>
                                    </div>
                                    <div className="px-5 py-4">
                                        <strong className="block text-2xl font-bold tracking-[-0.03em] text-blue-950">
                                            {summary.institutionsWithQueue}
                                        </strong>
                                        <span className="mt-1 block text-xs leading-5 text-blue-800">
                                            kampus berantrean
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </header>

                    <div
                        aria-label="Ringkasan afiliasi kampus"
                        className="mt-5 grid overflow-hidden rounded-2xl border border-slate-200 bg-white sm:grid-cols-3 sm:divide-x sm:divide-slate-200"
                    >
                        <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4 last:border-b-0 sm:border-b-0">
                            <Building2
                                aria-hidden="true"
                                className="size-5 text-blue-700"
                            />
                            <div>
                                <p className="text-xs font-medium text-slate-500">
                                    Total institusi
                                </p>
                                <p className="mt-0.5 text-lg font-bold text-slate-950">
                                    {summary.institutions}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4 last:border-b-0 sm:border-b-0">
                            <CheckCircle2
                                aria-hidden="true"
                                className="size-5 text-emerald-700"
                            />
                            <div>
                                <p className="text-xs font-medium text-slate-500">
                                    Institusi aktif
                                </p>
                                <p className="mt-0.5 text-lg font-bold text-slate-950">
                                    {summary.activeInstitutions}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-5 py-4">
                            <Database
                                aria-hidden="true"
                                className="size-5 text-indigo-700"
                            />
                            <div>
                                <p className="text-xs font-medium text-slate-500">
                                    Cakupan data
                                </p>
                                <p className="mt-0.5 text-sm font-bold text-slate-950">
                                    Agregat lintas kampus
                                </p>
                            </div>
                        </div>
                    </div>

                    <section
                        aria-labelledby="institution-ledger-title"
                        className="mt-7"
                    >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <h2
                                    id="institution-ledger-title"
                                    className="text-xl font-bold tracking-[-0.02em] text-slate-950"
                                >
                                    Kondisi afiliasi per kampus
                                </h2>
                                <p className="mt-1.5 text-sm text-slate-600">
                                    Institusi dengan antrean terbanyak tampil
                                    lebih dahulu.
                                </p>
                            </div>

                            <div className="grid gap-2 sm:grid-cols-[minmax(13rem,1fr)_11rem]">
                                <label className="relative">
                                    <span className="sr-only">
                                        Cari institusi
                                    </span>
                                    <Search
                                        aria-hidden="true"
                                        className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400"
                                    />
                                    <input
                                        type="search"
                                        value={query}
                                        onChange={(event) =>
                                            setQuery(event.target.value)
                                        }
                                        placeholder="Cari kampus"
                                        className="h-11 w-full rounded-xl border border-slate-200 bg-white pr-3 pl-10 text-sm text-slate-950 transition-colors outline-none placeholder:text-slate-400 focus-visible:border-blue-500 focus-visible:ring-3 focus-visible:ring-blue-100"
                                    />
                                </label>
                                <label>
                                    <span className="sr-only">
                                        Filter status institusi
                                    </span>
                                    <select
                                        value={status}
                                        onChange={(event) =>
                                            setStatus(
                                                event.target.value as
                                                    'all' | InstitutionStatus,
                                            )
                                        }
                                        className="h-11 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus-visible:border-blue-500 focus-visible:ring-3 focus-visible:ring-blue-100"
                                    >
                                        <option value="all">
                                            Semua status
                                        </option>
                                        <option value="active">Aktif</option>
                                        <option value="pending">
                                            Menunggu aktivasi
                                        </option>
                                        <option value="suspended">
                                            Ditangguhkan
                                        </option>
                                        <option value="archived">
                                            Diarsipkan
                                        </option>
                                    </select>
                                </label>
                            </div>
                        </div>

                        <div
                            role={
                                filteredInstitutions.length > 0
                                    ? 'table'
                                    : undefined
                            }
                            aria-label={
                                filteredInstitutions.length > 0
                                    ? 'Kondisi afiliasi per kampus'
                                    : undefined
                            }
                            className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white"
                        >
                            {filteredInstitutions.length > 0 && (
                                <div
                                    role="rowgroup"
                                    className="hidden lg:block"
                                >
                                    <div
                                        role="row"
                                        className="grid grid-cols-[minmax(16rem,1.4fr)_9rem_9rem_9rem] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold text-slate-500"
                                    >
                                        <span role="columnheader">
                                            Institusi
                                        </span>
                                        <span role="columnheader">Anggota</span>
                                        <span role="columnheader">
                                            Terverifikasi
                                        </span>
                                        <span role="columnheader">
                                            Perlu review
                                        </span>
                                    </div>
                                </div>
                            )}

                            {filteredInstitutions.length === 0 ? (
                                <div className="px-5 py-14 text-center">
                                    <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                                        <Search
                                            aria-hidden="true"
                                            className="size-5"
                                        />
                                    </span>
                                    <h3 className="mt-4 text-base font-bold text-slate-950">
                                        {institutions.length === 0
                                            ? 'Belum ada institusi terdaftar'
                                            : 'Institusi tidak ditemukan'}
                                    </h3>
                                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                                        {institutions.length === 0
                                            ? 'Daftar kampus akan muncul setelah institusi pertama tersedia di SATU.'
                                            : 'Ubah kata pencarian atau pilih status lain untuk melihat daftar kampus.'}
                                    </p>
                                </div>
                            ) : (
                                <div
                                    role="rowgroup"
                                    className="divide-y divide-slate-200"
                                >
                                    {filteredInstitutions.map((institution) => {
                                        const meta =
                                            statusMeta[institution.status];

                                        return (
                                            <article
                                                key={institution.id}
                                                role="row"
                                                className="grid gap-5 px-5 py-5 lg:grid-cols-[minmax(16rem,1.4fr)_9rem_9rem_9rem] lg:items-center lg:gap-4"
                                                data-test="platform-affiliation-row"
                                            >
                                                <div
                                                    role="cell"
                                                    aria-label={`Institusi: ${institution.name}, ${meta.label}`}
                                                    className="flex min-w-0 items-start gap-3.5"
                                                >
                                                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                                                        <Building2
                                                            aria-hidden="true"
                                                            className="size-5"
                                                        />
                                                    </span>
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h3 className="truncate text-sm font-bold text-slate-950">
                                                                {
                                                                    institution.name
                                                                }
                                                            </h3>
                                                            <Badge
                                                                variant="outline"
                                                                className={cn(
                                                                    'rounded-lg',
                                                                    meta.className,
                                                                )}
                                                            >
                                                                {meta.label}
                                                            </Badge>
                                                        </div>
                                                        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                                                            <span>
                                                                {institution.hasActiveRoster
                                                                    ? 'Roster aktif'
                                                                    : 'Roster belum aktif'}
                                                            </span>
                                                            <span aria-hidden="true">
                                                                ·
                                                            </span>
                                                            <span>
                                                                Diperbarui{' '}
                                                                {formatUpdatedAt(
                                                                    institution.updatedAt,
                                                                )}
                                                            </span>
                                                        </p>
                                                    </div>
                                                </div>

                                                <div
                                                    role="cell"
                                                    aria-label={`Anggota: ${institution.membershipsCount}`}
                                                >
                                                    <span className="text-xs font-medium text-slate-500 lg:hidden">
                                                        Anggota
                                                    </span>
                                                    <p className="mt-1 flex items-center gap-2 text-sm font-bold text-slate-950 lg:mt-0">
                                                        <UsersRound
                                                            aria-hidden="true"
                                                            className="size-4 text-slate-400"
                                                        />
                                                        {
                                                            institution.membershipsCount
                                                        }
                                                    </p>
                                                </div>

                                                <div
                                                    role="cell"
                                                    aria-label={`Afiliasi terverifikasi: ${institution.verifiedAffiliationsCount}`}
                                                >
                                                    <span className="text-xs font-medium text-slate-500 lg:hidden">
                                                        Afiliasi terverifikasi
                                                    </span>
                                                    <p className="mt-1 text-sm font-bold text-emerald-700 lg:mt-0">
                                                        {
                                                            institution.verifiedAffiliationsCount
                                                        }
                                                    </p>
                                                </div>

                                                <div
                                                    role="cell"
                                                    aria-label={`Perlu review: ${institution.pendingAffiliationsCount}`}
                                                >
                                                    <span className="text-xs font-medium text-slate-500 lg:hidden">
                                                        Perlu review
                                                    </span>
                                                    <p
                                                        className={cn(
                                                            'mt-1 text-sm font-bold lg:mt-0',
                                                            institution.pendingAffiliationsCount >
                                                                0
                                                                ? 'text-amber-800'
                                                                : 'text-slate-500',
                                                        )}
                                                    >
                                                        {
                                                            institution.pendingAffiliationsCount
                                                        }
                                                    </p>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </AppPage>
        </>
    );
}
