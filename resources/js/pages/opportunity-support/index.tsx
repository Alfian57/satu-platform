import { Head, Link, router, useHttp } from '@inertiajs/react';
import { HandHelping, RefreshCw, ShieldCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { AppPage } from '@/components/app-page';
import {
    CampusOperationHeader,
    campusControlClass,
} from '@/components/campus-operation-layout';
import { Button } from '@/components/ui/button';
import { index, store, transition } from '@/routes/opportunity-support';
import { index as projectsIndex, show as projectShow } from '@/routes/projects';

type SupportEvent = {
    id: number;
    action: string;
    reason: string | null;
    created_at: string;
    opportunity: {
        project_id: number;
        project_title: string;
        role_title: string;
    } | null;
};
type SupportCase = {
    id: number;
    need: string;
    explanation: string | null;
    owner_name: string;
    status: string;
    revision: number;
    created_at: string;
    expires_at: string;
    permissions: { review: boolean; respond: boolean; withdraw: boolean };
    events: SupportEvent[];
};
type Props = {
    institution: { id: number; name: string };
    reviewer: boolean;
    enabled: boolean;
    can_create: boolean;
    notice: {
        purpose: string;
        version: string;
        access_days: number;
        dataset_kind: string;
        dataset_manifest: string;
    } | null;
    requests: {
        data: SupportCase[];
        page: number;
        last_page: number;
        total: number;
        installed: boolean;
    };
    opportunities: {
        id: number;
        label: string;
        accepts_beginners: boolean | null;
    }[];
    journey: null | {
        state: string;
        snapshot_at: string;
        denominator: number | null;
        metrics: {
            label: string;
            value: number | null;
            source: string;
            state?: string;
        }[];
    };
};
const needs: Record<string, string> = {
    find_role: 'Menemukan peran yang relevan',
    beginner_path: 'Mencari peluang untuk pemula',
    application_help: 'Memahami cara mengajukan minat',
};
const statuses: Record<string, string> = {
    requested: 'Menunggu tindak lanjut',
    offered: 'Ada tawaran peluang',
    accepted: 'Tawaran diterima',
    declined: 'Tawaran ditolak',
    withdrawn: 'Izin dicabut',
};
const actions: Record<string, string> = {
    requested: 'Bantuan diajukan',
    offer: 'Peluang ditawarkan',
    accept: 'Tawaran diterima, belum bergabung',
    decline: 'Tawaran ditolak',
    note: 'Catatan tindak lanjut, bukan hasil terverifikasi',
    withdraw: 'Izin dicabut',
};
const sheet =
    'min-w-0 rounded-3xl border border-primary/15 bg-white p-5 shadow-sm sm:p-6';
function date(value: string): string {
    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

export default function OpportunitySupport(initial: Props) {
    const [data, setData] = useState(initial);
    const [selected, setSelected] = useState<SupportCase | null>(null);
    const [need, setNeed] = useState('find_role');
    const [explanation, setExplanation] = useState('');
    const [consent, setConsent] = useState(false);
    const [commandKey, setCommandKey] = useState(() => crypto.randomUUID());
    const [reason, setReason] = useState('');
    const [role, setRole] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [needsCheck, setNeedsCheck] = useState(false);
    const [denied, setDenied] = useState(false);
    const lock = useRef(false);
    const errorRef = useRef<HTMLDivElement>(null);
    const detailRef = useRef<HTMLHeadingElement>(null);
    const focusDetail = useRef(false);
    const form = useHttp<
        Record<string, string | number | boolean | null | undefined>,
        { data: SupportCase }
    >({});
    const read = useHttp<Record<string, never>, Props>({});
    const fresh = data.requests.data.find((item) => item.id === selected?.id);
    const stale = !!selected && fresh?.revision !== selected.revision;
    const blocked =
        form.processing || read.processing || needsCheck || stale || denied;
    const errors = Object.values(form.errors);
    const latestOffer = selected?.events
        .filter((event) => event.action === 'offer')
        .at(-1);

    useEffect(() => {
        if (focusDetail.current) {
            focusDetail.current = false;
            detailRef.current?.focus();
        }
    }, [selected?.id]);

    useEffect(() => {
        if (!form.processing && !read.processing && (error || errors.length)) {
            errorRef.current?.focus();
        }
    }, [error, errors.length, form.processing, read.processing]);

    useEffect(() => {
        const warn = (event: BeforeUnloadEvent) => {
            if (reason || explanation || lock.current) {
                event.preventDefault();
            }
        };
        window.addEventListener('beforeunload', warn);

        return () => window.removeEventListener('beforeunload', warn);
    }, [reason, explanation]);

    useEffect(
        () =>
            router.on('before', (event) => {
                const visit = event.detail.visit;

                if (
                    visit.async ||
                    visit.method !== 'get' ||
                    visit.url.pathname === window.location.pathname
                ) {
                    return;
                }

                if (
                    lock.current ||
                    ((reason || explanation) &&
                        !window.confirm(
                            'Tinggalkan halaman dan buang isian yang belum disimpan?',
                        ))
                ) {
                    event.preventDefault();
                }
            }),
        [reason, explanation],
    );

    function checkLatest(page = data.requests.page) {
        if (
            page !== data.requests.page &&
            reason &&
            !window.confirm(
                'Pindah halaman dan buang catatan yang belum disimpan?',
            )
        ) {
            return;
        }

        if (lock.current || read.processing) {
            return;
        }

        read.get(index.url(data.institution.id, { query: { page } }), {
            onHttpException: (response) => {
                if ([403, 404].includes(response.status)) {
                    setDenied(true);
                    setSelected(null);
                }

                setError(
                    'Data terbaru belum dapat dibaca. Isian tetap ada; pengiriman ditahan.',
                );
                setNeedsCheck(true);

                return false;
            },
            onNetworkError: () => {
                setError(
                    'Koneksi belum tersedia. Isian tetap ada; pengiriman ditahan.',
                );
                setNeedsCheck(true);

                return false;
            },
        })
            .then((response) => {
                if (!response?.requests) {
                    return;
                }

                setData(response);
                setDenied(false);
                setNeedsCheck(false);
                setError('');
                form.clearErrors();

                if (
                    selected &&
                    !response.requests.data.some(
                        (item) => item.id === selected.id,
                    )
                ) {
                    setSelected(null);
                    setReason('');
                    setRole('');
                    setMessage(
                        'Berkas tidak tersedia pada hasil terbaru. Izin mungkin berubah atau halaman berpindah.',
                    );
                }
            })
            .catch(() => undefined);
    }

    function send(action: string) {
        if (action === 'create' && !consent) {
            return;
        }

        if (lock.current || blocked) {
            return;
        }

        if (
            action === 'withdraw' &&
            !window.confirm(
                'Cabut izin bantuan? Peninjau tidak dapat membaca berkas ini lagi. Riwayat Anda tetap tersedia.',
            )
        ) {
            return;
        }

        lock.current = true;
        setError('');
        setMessage('');
        form.clearErrors();
        const creating = action === 'create';
        form.transform(() =>
            creating
                ? {
                      command_key: commandKey,
                      need,
                      explanation,
                      consent,
                      notice_version: data.notice?.version,
                  }
                : {
                      action,
                      expected_revision: selected?.revision,
                      project_role_id: action === 'offer' ? role : null,
                      reason,
                  },
        );
        const url = creating
            ? store.url(data.institution.id)
            : transition.url({
                  institution: data.institution.id,
                  supportRequest: selected!.id,
              });
        form.post(url, {
            onHttpException: (response) => {
                if ([403, 404].includes(response.status)) {
                    setDenied(true);
                    setSelected(null);
                }

                setNeedsCheck(true);
                setError(
                    response.status === 409
                        ? 'Data berubah. Periksa data terbaru, lalu pilih Gunakan data terbaru sebelum mengirim lagi.'
                        : 'Hasil pengiriman belum dapat dipastikan. Periksa data terbaru. Isian tidak dihapus.',
                );

                return false;
            },
            onNetworkError: () => {
                setNeedsCheck(true);
                setError(
                    'Hasil pengiriman belum dapat dipastikan. Periksa data terbaru; tidak ada pengiriman ulang otomatis.',
                );

                return false;
            },
        })
            .then((response) => {
                if (!response?.data) {
                    return;
                }

                const item = response.data;
                setData((current) => ({
                    ...current,
                    requests: {
                        ...current.requests,
                        data: creating
                            ? [
                                  item,
                                  ...current.requests.data.filter(
                                      (entry) => entry.id !== item.id,
                                  ),
                              ].slice(0, 10)
                            : current.requests.data.map((entry) =>
                                  entry.id === item.id ? item : entry,
                              ),
                        total:
                            current.requests.total +
                            (creating &&
                            !current.requests.data.some(
                                (entry) => entry.id === item.id,
                            )
                                ? 1
                                : 0),
                    },
                }));
                setSelected(item);
                setReason('');
                setRole('');

                if (creating) {
                    setExplanation('');
                    setConsent(false);
                    setCommandKey(crypto.randomUUID());
                }

                setMessage(
                    creating
                        ? 'Permintaan tersimpan. Tidak ada kontak atau pengajuan tim otomatis.'
                        : action === 'accept'
                          ? 'Tawaran diterima. Jika berminat, ajukan minat lewat halaman proyek. Anda belum menjadi anggota.'
                          : action === 'withdraw'
                            ? 'Izin dicabut. Pembacaan kampus berikutnya tidak lagi membuka berkas ini.'
                            : action === 'note'
                              ? 'Catatan tersimpan. Ini bukan konfirmasi bahwa dukungan berhasil.'
                              : 'Keputusan tersimpan. Periksa data terbaru untuk menyelaraskan antrean.',
                );
            })
            .catch(() => undefined)
            .finally(() => {
                lock.current = false;
            });
    }

    function choose(item: SupportCase) {
        if (form.processing || read.processing) {
            return;
        }

        if (
            reason &&
            !window.confirm(
                'Ganti berkas dan buang catatan yang belum disimpan?',
            )
        ) {
            return;
        }

        if (selected?.id === item.id) {
            detailRef.current?.focus();
        } else {
            focusDetail.current = true;
        }

        setSelected(item);
        setReason('');
        setRole('');
        form.clearErrors();
    }

    return (
        <>
            <Head
                title={
                    data.reviewer
                        ? 'Tindak lanjut kesempatan'
                        : 'Bantuan kesempatan'
                }
            />
            <AppPage className="max-w-none [&_*]:motion-reduce:animate-none [&_*]:motion-reduce:transition-none">
                <div className="space-y-5">
                    <CampusOperationHeader
                        icon={HandHelping}
                        eyebrow={
                            data.reviewer
                                ? 'Operasi kampus'
                                : 'Kesempatan kolaborasi'
                        }
                        institution={data.institution.name}
                        title={
                            data.reviewer
                                ? 'Tindak lanjut kesempatan'
                                : 'Bantuan kesempatan'
                        }
                        description="Bantuan yang Anda pilih, bukan penilaian kepribadian. Tawaran membuka arahan, bukan kewajiban bergabung."
                    />
                    <div className="flex flex-wrap gap-3">
                        <Button variant="outline" asChild>
                            <Link
                                href={projectsIndex({
                                    query: {
                                        institution_id: data.institution.id,
                                    },
                                })}
                            >
                                Jelajahi proyek
                            </Link>
                        </Button>
                        <Button
                            variant="outline"
                            disabled={form.processing || read.processing}
                            onClick={() => checkLatest()}
                        >
                            <RefreshCw aria-hidden="true" className="size-4" />
                            {read.processing
                                ? 'Memeriksa data...'
                                : 'Periksa data terbaru'}
                        </Button>
                    </div>
                    {(error || errors.length > 0) && (
                        <div
                            ref={errorRef}
                            id="support-errors"
                            tabIndex={-1}
                            role="alert"
                            className="rounded-2xl border border-correction/40 bg-correction/5 p-4 focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <p>
                                {error ||
                                    'Isian belum sesuai. Perbaiki sebelum mengirim.'}
                            </p>
                            {errors.length > 0 && (
                                <ul className="mt-2 list-inside list-disc">
                                    {errors.map((value, i) => (
                                        <li key={i}>{value}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                    <p
                        role="status"
                        className="text-sm leading-6 text-muted-foreground"
                    >
                        {form.processing
                            ? 'Menyimpan keputusan...'
                            : read.processing
                              ? 'Membaca data terbaru. Isian tetap dipertahankan.'
                              : message}
                    </p>
                    {denied ? (
                        <section className={sheet}>
                            <h2 className="font-bold">Akses tidak tersedia</h2>
                            <p className="mt-2">
                                Data sebelumnya disembunyikan. Periksa data
                                terbaru setelah akses dipulihkan.
                            </p>
                        </section>
                    ) : (
                        <>
                            {(!data.enabled || !data.requests.installed) && (
                                <section className={sheet}>
                                    <h2 className="font-bold">
                                        Bantuan belum diaktifkan
                                    </h2>
                                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                        Proses, peninjau dan kebijakan privasi
                                        kampus perlu disetujui terlebih dahulu.
                                        Anda tetap dapat mencari peluang melalui
                                        Proyek. Riwayat milik Anda dan
                                        pencabutan izin tetap tersedia jika
                                        sudah ada.
                                    </p>
                                </section>
                            )}
                            {data.notice && (
                                <section
                                    id="support-notice"
                                    className="rounded-2xl border border-primary/15 bg-accent/60 p-4 text-sm leading-6"
                                >
                                    <p className="flex items-start gap-2 font-semibold">
                                        <ShieldCheck
                                            className="mt-1 size-4 shrink-0"
                                            aria-hidden="true"
                                        />
                                        Tujuan: {data.notice.purpose}
                                    </p>
                                    <p className="mt-2">
                                        Hanya peninjau kampus yang ditunjuk
                                        membaca kebutuhan dan penjelasan yang
                                        Anda kirim. Tidak membuka nomor kontak,
                                        bukti privat atau pesan. Akses berakhir{' '}
                                        {data.notice.access_days} hari setelah
                                        pengajuan; izin dapat dicabut lebih
                                        awal. Batas akses tidak berarti riwayat
                                        langsung dihapus.
                                    </p>
                                    <p className="mt-2 text-xs break-words">
                                        Pemberitahuan {data.notice.version}.{' '}
                                        {data.notice.dataset_kind ===
                                        'synthetic'
                                            ? 'Data synthetic. Bukan hasil pilot.'
                                            : 'Data operasional berizin. Bukan bukti dampak pilot.'}{' '}
                                        Manifest: {data.notice.dataset_manifest}
                                        .
                                    </p>
                                </section>
                            )}
                            <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]">
                                <div className="min-w-0 space-y-5">
                                    {data.can_create && (
                                        <form
                                            className={sheet}
                                            onSubmit={(event) => {
                                                event.preventDefault();
                                                send('create');
                                            }}
                                        >
                                            <h2 className="text-xl font-bold">
                                                Apa yang ingin dibantu?
                                            </h2>
                                            <fieldset
                                                disabled={blocked}
                                                className="mt-4 min-w-0 space-y-4"
                                            >
                                                <div>
                                                    <label
                                                        htmlFor="support-need"
                                                        className="text-sm font-semibold"
                                                    >
                                                        Kebutuhan pilihan Anda
                                                    </label>
                                                    <select
                                                        id="support-need"
                                                        aria-invalid={
                                                            !!form.errors.need
                                                        }
                                                        aria-errormessage="support-errors"
                                                        className={
                                                            campusControlClass +
                                                            ' mt-2 cursor-pointer'
                                                        }
                                                        value={need}
                                                        onChange={(e) =>
                                                            setNeed(
                                                                e.target.value,
                                                            )
                                                        }
                                                    >
                                                        {Object.entries(
                                                            needs,
                                                        ).map(
                                                            ([
                                                                value,
                                                                label,
                                                            ]) => (
                                                                <option
                                                                    key={value}
                                                                    value={
                                                                        value
                                                                    }
                                                                >
                                                                    {label}
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label
                                                        htmlFor="support-explanation"
                                                        className="text-sm font-semibold"
                                                    >
                                                        Penjelasan tambahan
                                                        (opsional)
                                                    </label>
                                                    <textarea
                                                        id="support-explanation"
                                                        aria-errormessage="support-errors"
                                                        className={
                                                            campusControlClass +
                                                            ' mt-2 min-h-28'
                                                        }
                                                        maxLength={1000}
                                                        value={explanation}
                                                        onChange={(e) =>
                                                            setExplanation(
                                                                e.target.value,
                                                            )
                                                        }
                                                        aria-describedby="support-private-help"
                                                        aria-invalid={
                                                            !!form.errors
                                                                .explanation
                                                        }
                                                    />
                                                    <p
                                                        id="support-private-help"
                                                        className="mt-2 text-sm text-muted-foreground"
                                                    >
                                                        Ceritakan kebutuhan
                                                        peran atau belajar.
                                                        Jangan sertakan nomor
                                                        kontak, rahasia tim atau
                                                        tautan bukti privat.
                                                    </p>
                                                </div>
                                                <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-input p-3 text-sm leading-6 focus-within:ring-2 focus-within:ring-ring has-[:disabled]:cursor-not-allowed">
                                                    <input
                                                        className="mt-1 size-5 shrink-0 cursor-pointer disabled:cursor-not-allowed"
                                                        type="checkbox"
                                                        aria-describedby="support-notice"
                                                        aria-errormessage="support-errors"
                                                        checked={consent}
                                                        onChange={(e) =>
                                                            setConsent(
                                                                e.target
                                                                    .checked,
                                                            )
                                                        }
                                                        aria-invalid={
                                                            !!form.errors
                                                                .consent
                                                        }
                                                    />
                                                    Saya mengizinkan kebutuhan
                                                    ini dibaca peninjau yang
                                                    ditunjuk untuk tujuan dan
                                                    masa akses di atas.
                                                </label>
                                                <Button
                                                    type="submit"
                                                    disabled={
                                                        !consent || blocked
                                                    }
                                                >
                                                    Ajukan bantuan
                                                </Button>
                                            </fieldset>
                                        </form>
                                    )}
                                    <section
                                        className={sheet}
                                        aria-busy={read.processing}
                                    >
                                        <h2 className="text-xl font-bold">
                                            {data.reviewer
                                                ? 'Permintaan yang diizinkan'
                                                : 'Permintaan Anda'}
                                        </h2>
                                        <p className="mt-2 text-sm text-muted-foreground">
                                            {data.requests.total} permintaan.
                                            Tidak memiliki permintaan bukan
                                            tanda kurang kemampuan.
                                        </p>
                                        <div className="mt-4 space-y-3">
                                            {data.requests.data.length === 0 ? (
                                                <p className="rounded-xl bg-accent/40 p-4 text-sm leading-6">
                                                    Belum ada berkas pada
                                                    halaman ini. Anda tetap
                                                    dapat mencari dan mengajukan
                                                    peluang sendiri.
                                                </p>
                                            ) : (
                                                data.requests.data.map(
                                                    (item) => (
                                                        <button
                                                            key={item.id}
                                                            type="button"
                                                            disabled={
                                                                form.processing ||
                                                                read.processing
                                                            }
                                                            onClick={() =>
                                                                choose(item)
                                                            }
                                                            aria-pressed={
                                                                selected?.id ===
                                                                item.id
                                                            }
                                                            className="min-h-11 w-full cursor-pointer rounded-2xl border border-primary/20 p-4 text-left focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed aria-pressed:bg-accent/70"
                                                        >
                                                            <span className="block font-semibold break-words">
                                                                {needs[
                                                                    item.need
                                                                ] ??
                                                                    'Kebutuhan kesempatan'}
                                                            </span>
                                                            {data.reviewer && (
                                                                <span className="mt-1 block text-sm break-words">
                                                                    {
                                                                        item.owner_name
                                                                    }
                                                                </span>
                                                            )}
                                                            <span className="mt-2 block text-sm text-muted-foreground">
                                                                {statuses[
                                                                    item.status
                                                                ] ??
                                                                    item.status}{' '}
                                                                · #{item.id}
                                                            </span>
                                                        </button>
                                                    ),
                                                )
                                            )}
                                        </div>
                                        {data.requests.last_page > 1 && (
                                            <nav
                                                aria-label="Halaman permintaan"
                                                className="mt-4 flex flex-wrap gap-2"
                                            >
                                                <Button
                                                    variant="outline"
                                                    disabled={
                                                        blocked ||
                                                        data.requests.page <= 1
                                                    }
                                                    onClick={() =>
                                                        checkLatest(
                                                            data.requests.page -
                                                                1,
                                                        )
                                                    }
                                                >
                                                    Sebelumnya
                                                </Button>
                                                <span className="self-center text-sm">
                                                    {data.requests.page} /{' '}
                                                    {data.requests.last_page}
                                                </span>
                                                <Button
                                                    variant="outline"
                                                    disabled={
                                                        blocked ||
                                                        data.requests.page >=
                                                            data.requests
                                                                .last_page
                                                    }
                                                    onClick={() =>
                                                        checkLatest(
                                                            data.requests.page +
                                                                1,
                                                        )
                                                    }
                                                >
                                                    Selanjutnya
                                                </Button>
                                            </nav>
                                        )}
                                    </section>
                                </div>
                                <section
                                    className={sheet}
                                    aria-label="Detail tindak lanjut"
                                >
                                    {!selected ? (
                                        <>
                                            <h2 className="text-xl font-bold">
                                                Kendali tetap pada mahasiswa
                                            </h2>
                                            <p className="mt-3 text-sm leading-6 text-muted-foreground">
                                                Pilih berkas untuk membaca
                                                tawaran dan riwayat. Kampus
                                                tidak menghubungi otomatis,
                                                memberi label, atau memasukkan
                                                mahasiswa ke tim.
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <h2
                                                ref={detailRef}
                                                tabIndex={-1}
                                                className="text-xl font-bold break-words focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-ring"
                                            >
                                                {needs[selected.need]}
                                            </h2>
                                            <p className="mt-2 text-sm text-muted-foreground">
                                                {statuses[selected.status]} ·
                                                revisi {selected.revision}
                                            </p>
                                            <p className="mt-3 text-sm leading-6 break-words whitespace-pre-wrap">
                                                {selected.explanation ||
                                                    'Tidak ada penjelasan tambahan.'}
                                            </p>
                                            <p className="mt-3 text-xs text-muted-foreground">
                                                Masa akses kampus sampai{' '}
                                                {date(selected.expires_at)}.
                                            </p>
                                            {stale && (
                                                <div className="mt-4 rounded-xl border border-pending/40 bg-pending/10 p-3 text-sm">
                                                    <p>
                                                        Berkas berubah. Catatan
                                                        Anda tidak diganti
                                                        otomatis.
                                                    </p>
                                                    <Button
                                                        className="mt-3"
                                                        variant="outline"
                                                        disabled={
                                                            form.processing ||
                                                            read.processing
                                                        }
                                                        onClick={() => {
                                                            if (
                                                                !fresh ||
                                                                (reason &&
                                                                    !window.confirm(
                                                                        'Gunakan data terbaru dan buang catatan yang belum disimpan?',
                                                                    ))
                                                            ) {
                                                                return;
                                                            }

                                                            setSelected(fresh);
                                                            setReason('');
                                                            setRole('');
                                                            requestAnimationFrame(
                                                                () =>
                                                                    detailRef.current?.focus(),
                                                            );
                                                        }}
                                                    >
                                                        Gunakan data terbaru
                                                    </Button>
                                                </div>
                                            )}
                                            {selected.permissions.review && (
                                                <form
                                                    className="mt-5 border-t border-border pt-5"
                                                    onSubmit={(event) => {
                                                        event.preventDefault();
                                                        send('offer');
                                                    }}
                                                >
                                                    <fieldset
                                                        disabled={blocked}
                                                        className="min-w-0 space-y-4"
                                                    >
                                                        {[
                                                            'requested',
                                                            'declined',
                                                        ].includes(
                                                            selected.status,
                                                        ) && (
                                                            <div>
                                                                <label
                                                                    htmlFor="support-role"
                                                                    className="text-sm font-semibold"
                                                                >
                                                                    Peran yang
                                                                    ditawarkan
                                                                </label>
                                                                <select
                                                                    id="support-role"
                                                                    aria-errormessage="support-errors"
                                                                    className={
                                                                        campusControlClass +
                                                                        ' mt-2 cursor-pointer'
                                                                    }
                                                                    value={role}
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        setRole(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    aria-invalid={
                                                                        !!form
                                                                            .errors
                                                                            .project_role_id
                                                                    }
                                                                >
                                                                    <option value="">
                                                                        Pilih
                                                                        peluang
                                                                        aktual
                                                                    </option>
                                                                    {data.opportunities
                                                                        .filter(
                                                                            (
                                                                                option,
                                                                            ) =>
                                                                                selected.need !==
                                                                                    'beginner_path' ||
                                                                                option.accepts_beginners ===
                                                                                    true,
                                                                        )
                                                                        .map(
                                                                            (
                                                                                option,
                                                                            ) => (
                                                                                <option
                                                                                    key={
                                                                                        option.id
                                                                                    }
                                                                                    value={
                                                                                        option.id
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        option.label
                                                                                    }
                                                                                </option>
                                                                            ),
                                                                        )}
                                                                </select>
                                                                <p className="mt-2 text-sm text-muted-foreground">
                                                                    Maksimal 100
                                                                    peran
                                                                    terbuka
                                                                    ditampilkan.
                                                                    Server
                                                                    memeriksa
                                                                    ulang izin
                                                                    dan
                                                                    kapasitas
                                                                    saat
                                                                    mengirim.
                                                                </p>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <label
                                                                htmlFor="support-reason"
                                                                className="text-sm font-semibold"
                                                            >
                                                                Alasan atau
                                                                catatan untuk
                                                                mahasiswa
                                                            </label>
                                                            <textarea
                                                                id="support-reason"
                                                                aria-errormessage="support-errors"
                                                                value={reason}
                                                                onChange={(e) =>
                                                                    setReason(
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                maxLength={1000}
                                                                className={
                                                                    campusControlClass +
                                                                    ' mt-2 min-h-28'
                                                                }
                                                                aria-invalid={
                                                                    !!form
                                                                        .errors
                                                                        .reason
                                                                }
                                                                aria-describedby="support-note-help"
                                                            />
                                                            <p
                                                                id="support-note-help"
                                                                className="mt-2 text-sm text-muted-foreground"
                                                            >
                                                                Jelaskan
                                                                relevansi
                                                                peluang atau
                                                                tindakan yang
                                                                benar-benar
                                                                dilakukan.
                                                                Catatan terbaca
                                                                pemilik; bukan
                                                                hasil dukungan
                                                                terverifikasi.
                                                            </p>
                                                        </div>

                                                        <div className="flex flex-wrap gap-3">
                                                            {[
                                                                'requested',
                                                                'declined',
                                                            ].includes(
                                                                selected.status,
                                                            ) && (
                                                                <Button
                                                                    type="submit"
                                                                    disabled={
                                                                        blocked ||
                                                                        !role ||
                                                                        !reason.trim()
                                                                    }
                                                                >
                                                                    Tawarkan
                                                                    peluang
                                                                </Button>
                                                            )}
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                disabled={
                                                                    blocked ||
                                                                    !reason.trim()
                                                                }
                                                                onClick={() =>
                                                                    send('note')
                                                                }
                                                            >
                                                                Simpan catatan
                                                                tindak lanjut
                                                            </Button>
                                                        </div>
                                                    </fieldset>
                                                </form>
                                            )}
                                            {selected.status === 'offered' &&
                                                selected.permissions
                                                    .respond && (
                                                    <div className="mt-5 rounded-2xl bg-accent/60 p-4">
                                                        <p className="text-sm leading-6">
                                                            Menerima tawaran
                                                            tidak memesan tempat
                                                            atau mengajukan
                                                            minat otomatis. Anda
                                                            boleh menolak tanpa
                                                            alasan.
                                                        </p>
                                                        <div className="mt-3 flex flex-wrap gap-3">
                                                            <Button
                                                                disabled={
                                                                    blocked
                                                                }
                                                                onClick={() =>
                                                                    send(
                                                                        'accept',
                                                                    )
                                                                }
                                                            >
                                                                Terima tawaran
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                disabled={
                                                                    blocked
                                                                }
                                                                onClick={() =>
                                                                    send(
                                                                        'decline',
                                                                    )
                                                                }
                                                            >
                                                                Tolak tawaran
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            {selected.status === 'accepted' &&
                                                latestOffer?.opportunity && (
                                                    <Button
                                                        variant="outline"
                                                        asChild
                                                        className="mt-5"
                                                    >
                                                        <Link
                                                            href={projectShow(
                                                                latestOffer
                                                                    .opportunity
                                                                    .project_id,
                                                            )}
                                                        >
                                                            Lihat peluang dan
                                                            ajukan minat
                                                        </Link>
                                                    </Button>
                                                )}
                                            {selected.permissions.withdraw && (
                                                <Button
                                                    variant="outline"
                                                    className="mt-4"
                                                    disabled={blocked}
                                                    onClick={() =>
                                                        send('withdraw')
                                                    }
                                                >
                                                    Cabut izin bantuan
                                                </Button>
                                            )}
                                            {!selected.permissions.review &&
                                                !selected.permissions.respond &&
                                                selected.status !==
                                                    'withdrawn' && (
                                                    <p className="mt-4 text-sm text-muted-foreground">
                                                        Tindak lanjut tidak
                                                        tersedia. Masa akses,
                                                        izin atau konfigurasi
                                                        mungkin berubah.
                                                        Pencabutan izin tetap
                                                        dapat dilakukan.
                                                    </p>
                                                )}
                                            <h3 className="mt-6 border-t border-border pt-5 font-semibold">
                                                Riwayat, bukan klaim
                                                keberhasilan
                                            </h3>
                                            <ol className="mt-4 space-y-4">
                                                {selected.events.map(
                                                    (event) => (
                                                        <li
                                                            key={event.id}
                                                            className="border-l-2 border-primary/20 pl-4"
                                                        >
                                                            <p className="text-sm font-semibold">
                                                                {actions[
                                                                    event.action
                                                                ] ??
                                                                    event.action}
                                                            </p>
                                                            <p className="mt-1 text-xs text-muted-foreground">
                                                                {date(
                                                                    event.created_at,
                                                                )}
                                                            </p>
                                                            {event.reason && (
                                                                <p className="mt-2 text-sm leading-6 break-words whitespace-pre-wrap">
                                                                    {
                                                                        event.reason
                                                                    }
                                                                </p>
                                                            )}
                                                            {event.opportunity && (
                                                                <p className="mt-2 text-sm break-words">
                                                                    {
                                                                        event
                                                                            .opportunity
                                                                            .project_title
                                                                    }{' '}
                                                                    /{' '}
                                                                    {
                                                                        event
                                                                            .opportunity
                                                                            .role_title
                                                                    }
                                                                </p>
                                                            )}
                                                        </li>
                                                    ),
                                                )}
                                            </ol>
                                        </>
                                    )}
                                </section>
                            </div>
                            {data.journey && (
                                <section
                                    className={sheet}
                                    aria-label="Ringkasan perjalanan operasional"
                                >
                                    <h2 className="text-xl font-bold">
                                        Jejak operasional, bukan hasil pilot
                                    </h2>
                                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                        Snapshot{' '}
                                        {date(data.journey.snapshot_at)}.
                                        Cakupan mahasiswa terverifikasi saat
                                        pembacaan, bukan kohort pada awal
                                        periode. Tidak memakai XP atau karya
                                        sebagai syarat. Riwayat sebelum
                                        instrumentasi tersedia mungkin tidak
                                        lengkap.
                                    </p>
                                    {data.journey.state !== 'available' ? (
                                        <p className="mt-4 rounded-xl bg-accent/50 p-4 text-sm">
                                            {data.journey.state === 'suppressed'
                                                ? 'Angka disembunyikan untuk menjaga privasi kelompok kecil atau cakupan kosong. Tidak ditampilkan sebagai 0%.'
                                                : 'Ringkasan belum diaktifkan. Persetujuan evaluasi dan ambang kelompok kecil khusus belum lengkap.'}
                                        </p>
                                    ) : (
                                        <>
                                            <p className="mt-4 font-semibold">
                                                Denominator:{' '}
                                                {data.journey.denominator}{' '}
                                                mahasiswa eligible saat
                                                snapshot.
                                            </p>
                                            <dl className="mt-4 grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
                                                {data.journey.metrics.map(
                                                    (metric) => (
                                                        <div
                                                            key={metric.label}
                                                            className="rounded-2xl border border-primary/15 bg-accent/30 p-4"
                                                        >
                                                            <dt className="text-sm font-semibold">
                                                                {metric.label}
                                                            </dt>
                                                            <dd className="mt-2 text-xl font-bold">
                                                                {metric.state ===
                                                                'suppressed'
                                                                    ? 'Disembunyikan untuk privasi'
                                                                    : metric.value ===
                                                                        null
                                                                      ? 'Belum dapat dihitung'
                                                                      : metric.value}
                                                            </dd>
                                                            <dd className="mt-2 text-sm leading-6 text-muted-foreground">
                                                                {metric.source}
                                                            </dd>
                                                        </div>
                                                    ),
                                                )}
                                            </dl>
                                        </>
                                    )}
                                    <p className="mt-4 text-sm leading-6 text-muted-foreground">
                                        Tahap tidak membentuk funnel berurutan.
                                        Bergabung bukan bukti kerja bersama;
                                        catatan bantuan bukan keberhasilan.
                                        Periode, populasi pilot, baseline dan
                                        target harus disepakati sebelum evaluasi
                                        manfaat.
                                    </p>
                                </section>
                            )}
                        </>
                    )}
                </div>
            </AppPage>
        </>
    );
}
