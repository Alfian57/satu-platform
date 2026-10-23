import { router, useForm } from '@inertiajs/react';
import { FileEdit, RotateCcw, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
    correction,
    restriction,
    withdrawal,
} from '@/routes/account/data-rights';

export const operations = {
    correction: {
        title: 'Ajukan koreksi data',
        description:
            'Permintaan dicatat untuk tindak lanjut. Ini tidak langsung mengubah nama, profil, atau data kampus.',
        action: correction,
        Icon: FileEdit,
    },
    restriction: {
        title: 'Ajukan pembatasan pemrosesan',
        description:
            'Jelaskan batasan yang diinginkan. Pencatatan permintaan bukan konfirmasi bahwa pemrosesan sudah dibatasi.',
        action: restriction,
        Icon: ShieldAlert,
    },
    withdrawal: {
        title: 'Tarik persetujuan ketentuan layanan',
        description:
            'Mencatat pencabutan persetujuan ketentuan layanan. Persetujuan kontak dan jangkauan karya merupakan kontrol terpisah.',
        action: withdrawal,
        Icon: RotateCcw,
    },
};

export type Operation = keyof typeof operations;

export type OperationConfig = (typeof operations)[Operation];

export function useDataRightsForm() {
    const form = useForm({ reason: '' });
    const [active, setActive] = useState<Operation | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [uncertain, setUncertain] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [forbidden, setForbidden] = useState(false);
    const busy = form.processing || refreshing;
    const operation = active ? operations[active] : null;

    function close(): void {
        if (busy) {
            return;
        }

        setActive(null);
        form.resetAndClearErrors();
    }

    function failure(statusCode?: number): boolean {
        setUncertain(true);

        if ([401, 403, 404, 419].includes(statusCode ?? 0)) {
            setForbidden(true);
            setActive(null);
            form.reset();
        }

        const errorMsg =
            'Hasil permintaan belum dapat dikonfirmasi. Periksa status melalui muat ulang sebelum mengirim lagi.';
        setMessage(errorMsg);
        toast.error(errorMsg);

        return false;
    }

    function refresh(): void {
        if (busy) {
            return;
        }

        setRefreshing(true);
        router.reload({
            onSuccess: () => {
                setUncertain(false);
                setForbidden(false);
                setMessage(null);
            },
            onHttpException: (response) => failure(response.status),
            onNetworkError: () => failure(),
            onFinish: () => setRefreshing(false),
        });
    }

    function submitRequest(event: React.FormEvent): void {
        event.preventDefault();

        if (!operation || busy || uncertain) {
            return;
        }

        setMessage(null);
        form.submit(operation.action(), {
            preserveScroll: true,
            onSuccess: () => {
                setActive(null);
                form.resetAndClearErrors();
            },
            onError: () =>
                document.getElementById('data-rights-reason')?.focus(),
            onHttpException: (response) => failure(response.status),
            onNetworkError: () => failure(),
        });
    }

    return {
        form,
        active,
        operation,
        message,
        uncertain,
        refreshing,
        forbidden,
        busy,
        actions: {
            openOperation: (op: Operation) => {
                form.resetAndClearErrors();
                setActive(op);
            },
            closeDialog: close,
            refreshStatus: refresh,
            submitRequest,
            setReason: (val: string) => form.setData('reason', val),
        },
    };
}
