import { router, useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';
import type {
    Selection,
    SkillsProps,
} from '@/components/platform/skills/skills-types';
import { destroy, store, update } from '@/routes/platform/skills';
import { skills as index } from '@/routes/university/settings';

export function usePlatformSkills(props: SkillsProps) {
    const [selection, setSelection] = useState<Selection | null>(null);
    const [q, setQ] = useState(props.filters.q);
    const [category, setCategory] = useState(props.filters.category);
    const [status, setStatus] = useState(props.filters.status);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [denied, setDenied] = useState(false);
    const [needsCheck, setNeedsCheck] = useState(false);
    const [message, setMessage] = useState('');

    const heading = useRef<HTMLHeadingElement>(null);
    const feedback = useRef<HTMLDivElement>(null);
    const lock = useRef(false);

    const form = useForm({
        name: '',
        category: '',
        description: '',
        is_verified: true,
    });

    function open(next: Selection) {
        if (busy || form.processing || needsCheck || denied) {
            return;
        }

        setSelection(next);
        setError('');
        form.clearErrors();
        form.setData({
            name: next.skill?.name ?? '',
            category: next.skill?.category ?? '',
            description: next.skill?.description ?? '',
            is_verified: next.skill?.isVerified ?? true,
        });
    }

    function close() {
        if (!actionBusy) {
            setSelection(null);
        }
    }

    function read(apply = false) {
        if (busy || lock.current || form.processing) {
            return;
        }

        router.get(
            index.url(props.institution.id, {
                query: apply ? { q, category, status } : props.filters,
            }),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setBusy(true),
                onFinish: () => setBusy(false),
                onSuccess: () => {
                    setDenied(false);
                    setNeedsCheck(false);
                    setError('');
                },
                onNetworkError: () => {
                    setError(
                        'Koneksi tidak tersedia. Isian tetap ada; periksa lagi sebelum mengirim.',
                    );

                    return false;
                },
                onHttpException: (response) => {
                    if ([401, 403, 404, 419].includes(response.status)) {
                        setDenied(true);
                        setSelection(null);
                    }

                    setError(
                        'Daftar terbaru belum tersedia. Periksa akses dan muat ulang.',
                    );

                    return false;
                },
            },
        );
    }

    function save() {
        if (
            !selection ||
            busy ||
            lock.current ||
            form.processing ||
            needsCheck ||
            denied
        ) {
            return;
        }

        lock.current = true;
        const route =
            selection.mode === 'create'
                ? store()
                : selection.mode === 'delete'
                  ? destroy(selection.skill!.id)
                  : update(selection.skill!.id);
        form.submit(route, {
            preserveScroll: true,
            onStart: () => setError(''),
            onFinish: () => {
                lock.current = false;
            },
            onSuccess: () => {
                setSelection(null);
                form.resetAndClearErrors();
                setMessage(
                    'Perubahan katalog dikonfirmasi server. Ini bukan verifikasi kemampuan mahasiswa.',
                );
            },
            onError: () =>
                requestAnimationFrame(() => feedback.current?.focus()),
            onNetworkError: () => {
                setNeedsCheck(true);
                setError(
                    'Hasil penyimpanan belum pasti. Periksa katalog terbaru; jangan kirim ulang otomatis.',
                );
                requestAnimationFrame(() => feedback.current?.focus());

                return false;
            },
            onHttpException: (response) => {
                if ([401, 403, 404, 419].includes(response.status)) {
                    setDenied(true);
                    setSelection(null);
                }

                setNeedsCheck(true);
                setError(
                    'Respons belum tersedia. Periksa sumber terbaru sebelum tindakan lain.',
                );
                requestAnimationFrame(() => feedback.current?.focus());

                return false;
            },
        });
    }

    const actionBusy = busy || form.processing;

    return {
        state: {
            selection,
            q,
            category,
            status,
            busy,
            error,
            denied,
            needsCheck,
            message,
            form,
            actionBusy,
        },
        actions: {
            open,
            close,
            read,
            save,
            setQ,
            setCategory,
            setStatus,
            setMessage,
            setError,
        },
        refs: {
            heading,
            feedback,
        },
    };
}
