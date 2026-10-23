import { router, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import type { RosterPreview } from '@/pages/campus/roster-import/_types/roster-types';
import {
    preview as previewRoster,
    store as storeRoster,
} from '@/routes/campus/roster';

export function useCampusRoster({
    institutionId,
    initialSemester = '',
    preview,
}: {
    institutionId: number;
    initialSemester?: string;
    preview?: RosterPreview;
}) {
    const form = useForm<{ file: File | null; semester: string }>({
        file: null,
        semester: initialSemester,
    });
    const [isCommitting, setIsCommitting] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [accessUnavailable, setAccessUnavailable] = useState(false);

    const requestFailure = (status?: number): false => {
        if (status === 403 || status === 404) {
            setAccessUnavailable(true);
        }

        setFeedback(
            'Hasil request belum dapat dikonfirmasi. Periksa koneksi atau akses, lalu muat ulang sebelum mencoba kembali.',
        );

        return false;
    };

    const reloadRoster = (): void => {
        if (isCommitting || form.processing) {
            return;
        }

        setIsCommitting(true);
        router.reload({
            onSuccess: () => {
                setAccessUnavailable(false);
                setFeedback(null);
            },
            onHttpException: (response) => requestFailure(response.status),
            onNetworkError: () => requestFailure(),
            onFinish: () => setIsCommitting(false),
        });
    };

    const submitPreview = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        if (form.processing || isCommitting) {
            return;
        }

        setFeedback(null);
        setSuccess(null);
        form.post(previewRoster({ institution: institutionId }).url, {
            forceFormData: true,
            preserveScroll: true,
            onError: () =>
                setFeedback(
                    'Pratinjau belum dibuat. Periksa isian yang ditandai.',
                ),
            onHttpException: (response) => requestFailure(response.status),
            onNetworkError: () => requestFailure(),
        });
    };

    const commitRoster = (): void => {
        if (
            isCommitting ||
            form.processing ||
            !preview ||
            preview.valid_rows === 0
        ) {
            return;
        }

        setIsCommitting(true);
        setFeedback(null);
        setSuccess(null);

        router.post(
            storeRoster({ institution: institutionId }).url,
            {},
            {
                preserveScroll: true,
                onSuccess: () =>
                    setSuccess(
                        'Roster berhasil diimpor. Periksa statusnya pada riwayat roster.',
                    ),
                onError: (errors) =>
                    setFeedback(
                        Object.values(errors)[0] ??
                            'Roster belum diimpor. Periksa pratinjau dan coba lagi.',
                    ),
                onHttpException: (response) => requestFailure(response.status),
                onNetworkError: () => requestFailure(),
                onFinish: () => setIsCommitting(false),
            },
        );
    };

    return {
        form,
        isCommitting,
        feedback,
        success,
        accessUnavailable,
        actions: {
            submitPreview,
            commitRoster,
            reloadRoster,
        },
    };
}
