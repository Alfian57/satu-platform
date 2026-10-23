import { router, useHttp } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import type {
    OpportunitySupportProps,
    SupportCase,
} from '@/pages/opportunity-support/_components/opportunity-support-constants';
import { index, store, transition } from '@/routes/opportunity-support';

export function useOpportunitySupport(initial: OpportunitySupportProps) {
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
    const read = useHttp<Record<string, never>, OpportunitySupportProps>({});

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

    function useLatestData() {
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
        requestAnimationFrame(() => detailRef.current?.focus());
    }

    return {
        state: {
            data,
            selected,
            need,
            explanation,
            consent,
            commandKey,
            reason,
            role,
            message,
            error,
            needsCheck,
            denied,
            form,
            read,
            fresh,
            stale,
            blocked,
            errors,
            latestOffer,
        },
        actions: {
            checkLatest,
            send,
            choose,
            useLatestData,
            setNeed,
            setExplanation,
            setConsent,
            setReason,
            setRole,
            setSelected,
            setError,
            setMessage,
        },
        refs: {
            errorRef,
            detailRef,
        },
    };
}
