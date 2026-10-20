import { Head, Link, router } from '@inertiajs/react';
import { UsersRound } from 'lucide-react';
import { useState } from 'react';
import { AppPage } from '@/components/app-page';
import {
    CampusOperationHeader,
    campusControlClass,
} from '@/components/campus-operation-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UniversityPagination } from '@/components/university-settings-nav';
import type {
    PageData,
    University,
} from '@/components/university-settings-nav';
import { index as affiliations } from '@/routes/campus/affiliations';
import { index } from '@/routes/university/students';

type Props = {
    institution: University;
    filters: { q: string; status: string };
    students: PageData<{
        id: number;
        name: string;
        status: string;
        study_program: string | null;
    }>;
};
const statuses: Record<string, string> = {
    all: 'Semua status',
    unverified: 'Belum terverifikasi',
    pending: 'Menunggu tinjauan',
    verified: 'Terverifikasi',
    suspended: 'Ditangguhkan',
};

export default function UniversityStudents({
    institution,
    filters,
    students,
}: Props) {
    const [q, setQ] = useState(filters.q),
        [status, setStatus] = useState(filters.status);
    const [busy, setBusy] = useState(false),
        [error, setError] = useState(''),
        [denied, setDenied] = useState(false);
    function visit(page: number, apply = false) {
        if (busy) {
            return;
        }

        router.get(
            index.url(institution.id, {
                query: {
                    page,
                    q: apply ? q : filters.q,
                    status: apply ? status : filters.status,
                },
            }),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setBusy(true),
                onFinish: () => setBusy(false),
                onSuccess: () => {
                    setError('');
                    setDenied(false);
                },
                onError: () =>
                    setError(
                        'Periksa kata kunci dan status. Pilihan belum diterapkan.',
                    ),
                onNetworkError: () => {
                    setError(
                        'Koneksi terputus. Pilihanmu tetap ada; periksa daftar terbaru.',
                    );

                    return false;
                },
                onHttpException: (response) => {
                    if ([401, 403, 404, 419].includes(response.status)) {
                        setDenied(true);
                    }

                    setError(
                        'Daftar belum dapat dibaca. Periksa akses atau masuk ulang.',
                    );

                    return false;
                },
            },
        );
    }

    return (
        <AppPage>
            <Head title="Mahasiswa" />
            <div className="grid min-w-0 gap-6" data-test="university-students">
                <CampusOperationHeader
                    theme="students"
                    title="Mahasiswa"
                    description="Kenali status afiliasi, lalu tindak lanjuti permintaan yang perlu ditinjau. Daftar ini bukan penilaian kompetensi atau popularitas."
                    institution={institution.name}
                    icon={UsersRound}
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="max-w-[65ch] text-sm leading-6 text-muted-foreground">
                        Roster adalah sumber pencocokan. Mahasiswa di bawah ini
                        adalah akun yang telah mengajukan afiliasi, bukan
                        seluruh isi roster.
                    </p>
                    <Button asChild>
                        <Link href={affiliations(institution.id)}>
                            Tinjau afiliasi
                        </Link>
                    </Button>
                </div>
                <form
                    aria-label="Filter mahasiswa"
                    className="grid min-w-0 gap-4 rounded-3xl border border-primary/15 bg-white p-5 shadow-sm sm:grid-cols-[minmax(0,1fr)_14rem_auto]"
                    onSubmit={(event) => {
                        event.preventDefault();
                        visit(1, true);
                    }}
                >
                    <label className="grid gap-2 text-sm font-semibold">
                        Cari nama
                        <input
                            className={campusControlClass}
                            value={q}
                            maxLength={100}
                            disabled={busy}
                            onChange={(event) => setQ(event.target.value)}
                            placeholder="Nama tampilan mahasiswa"
                        />
                    </label>
                    <label className="grid gap-2 text-sm font-semibold">
                        Status afiliasi
                        <select
                            className={`${campusControlClass} cursor-pointer`}
                            value={status}
                            disabled={busy}
                            onChange={(event) => setStatus(event.target.value)}
                        >
                            {Object.entries(statuses).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <Button type="submit" className="self-end" disabled={busy}>
                        Terapkan filter
                    </Button>
                </form>
                {error && (
                    <div
                        role="alert"
                        className="rounded-2xl border border-correction/30 bg-white p-5"
                    >
                        <p>{error}</p>
                        <Button
                            variant="outline"
                            className="mt-3"
                            disabled={busy}
                            onClick={() => visit(students.current_page)}
                        >
                            Periksa daftar terbaru
                        </Button>
                    </div>
                )}
                <section
                    aria-label="Daftar mahasiswa"
                    aria-busy={busy}
                    className="min-w-0 rounded-3xl border border-primary/15 bg-white p-5 shadow-sm sm:p-6"
                >
                    {busy && (
                        <p
                            role="status"
                            className="mb-3 text-sm text-muted-foreground"
                        >
                            Memuat daftar mahasiswa.
                        </p>
                    )}
                    {!denied && (
                        <>
                            <div className="divide-y divide-border">
                                {students.data.length ? (
                                    students.data.map((item) => (
                                        <article
                                            key={item.id}
                                            className="flex flex-wrap items-start justify-between gap-3 py-4"
                                        >
                                            <div className="min-w-0 flex-1 basis-48">
                                                <h2 className="text-lg font-bold wrap-anywhere">
                                                    {item.name}
                                                </h2>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    {item.study_program ||
                                                        'Program studi belum tersedia'}
                                                </p>
                                                <p className="mt-1 font-mono text-xs text-muted-foreground">
                                                    Afiliasi {item.id}
                                                </p>
                                            </div>
                                            <Badge
                                                variant={
                                                    item.status === 'verified'
                                                        ? 'verified'
                                                        : item.status ===
                                                            'suspended'
                                                          ? 'correction'
                                                          : 'pending'
                                                }
                                            >
                                                {statuses[item.status]}
                                            </Badge>
                                        </article>
                                    ))
                                ) : (
                                    <p className="py-6 text-sm leading-6 text-muted-foreground">
                                        Tidak ada afiliasi mahasiswa pada
                                        cakupan ini. Coba ubah filter; belum ada
                                        karya bukan alasan untuk dikeluarkan
                                        dari daftar.
                                    </p>
                                )}
                            </div>
                            <UniversityPagination
                                page={students}
                                busy={busy}
                                onPage={visit}
                            />
                        </>
                    )}
                </section>
            </div>
        </AppPage>
    );
}
