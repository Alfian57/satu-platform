import { Head, router, useForm } from '@inertiajs/react';
import { FileEdit, RotateCcw, Shield, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import DeleteUser from '@/components/delete-user';
import ExportUserData from '@/components/export-user-data';
import InputError from '@/components/input-error';
import { SettingsCardHeading } from '@/components/settings/settings-panel';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    correction,
    restriction,
    withdrawal,
} from '@/routes/account/data-rights';
import { edit as editDataRights } from '@/routes/data-rights';

interface Props {
    summary: {
        consents: {
            purpose: string;
            policy_version: string;
            granted_at: string | null;
            withdrawn_at: string | null;
            occurred_at: string;
        }[];
    };
    status?: string | null;
}

const operations = {
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
type Operation = keyof typeof operations;

export default function DataRights({ summary, status }: Props) {
    const form = useForm({ reason: '' });
    const [active, setActive] = useState<Operation | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [uncertain, setUncertain] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [forbidden, setForbidden] = useState(false);
    const busy = form.processing || refreshing;
    const operation = active ? operations[active] : null;

    function close() {
        if (busy) {
            return;
        }

        setActive(null);
        form.resetAndClearErrors();
    }

    function failure(statusCode?: number) {
        setUncertain(true);

        if ([401, 403, 404, 419].includes(statusCode ?? 0)) {
            setForbidden(true);
            setActive(null);
            form.reset();
        }

        setMessage(
            'Hasil permintaan belum dapat dikonfirmasi. Periksa status melalui muat ulang sebelum mengirim lagi.',
        );

        return false;
    }

    function refresh() {
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

    return (
        <>
            <Head title="Hak Data dan Privasi" />
            <div className="grid min-w-0 gap-6">
                {status && (
                    <p
                        role="status"
                        className="rounded-2xl border border-verified/25 bg-verified-subtle p-4 text-sm leading-6 text-verified-subtle-foreground"
                    >
                        {status}
                    </p>
                )}
                {message && (
                    <div
                        role="alert"
                        className="grid gap-3 rounded-2xl border border-correction/25 bg-correction-subtle p-4 text-sm leading-6 text-correction-subtle-foreground"
                    >
                        <p>{message}</p>
                        <Button
                            type="button"
                            variant="outline"
                            className="min-h-11 w-fit"
                            disabled={busy}
                            onClick={refresh}
                        >
                            {refreshing ? 'Memeriksa...' : 'Muat ulang status'}
                        </Button>
                    </div>
                )}
                {forbidden ? (
                    <p role="status">
                        Akses tidak tersedia. Ringkasan privat sebelumnya tidak
                        ditampilkan.
                    </p>
                ) : (
                    <>
                        <section
                            aria-labelledby="data-rights-heading"
                            className="grid min-w-0 gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
                        >
                            <SettingsCardHeading
                                id="data-rights-heading"
                                icon={Shield}
                                title="Hak Data dan Privasi"
                                description="Unduh arsip dan ajukan kendali data pribadi. Riwayat persetujuan dibedakan dari status pemenuhan permintaan."
                            />
                            <h3 className="text-base font-semibold">
                                Riwayat persetujuan
                            </h3>
                            {summary.consents.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    Belum ada riwayat persetujuan tercatat.
                                    Riwayat akan tampil di sini setelah ada
                                    tindakan yang tercatat.
                                </p>
                            ) : (
                                <ul className="divide-y divide-border">
                                    {summary.consents.map((consent, index) => (
                                        <li
                                            key={
                                                consent.purpose +
                                                consent.occurred_at +
                                                index
                                            }
                                            className="flex min-w-0 flex-col justify-between gap-2 py-4 sm:flex-row sm:items-center"
                                        >
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold wrap-anywhere">
                                                    {consent.purpose}
                                                </p>
                                                <p className="mt-1 text-xs leading-5 wrap-anywhere text-muted-foreground">
                                                    Versi kebijakan:{' '}
                                                    {consent.policy_version}.{' '}
                                                    {new Date(
                                                        consent.occurred_at,
                                                    ).toLocaleDateString(
                                                        'id-ID',
                                                    )}
                                                </p>
                                            </div>
                                            <span className="w-fit shrink-0 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold">
                                                {consent.granted_at
                                                    ? 'Persetujuan dicatat'
                                                    : 'Pencabutan dicatat'}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                        <div className="grid min-w-0 gap-4 lg:grid-cols-2">
                            <ExportUserData />
                            {(Object.keys(operations) as Operation[]).map(
                                (key) => {
                                    const item = operations[key];

                                    return (
                                        <section
                                            key={key}
                                            className="grid min-w-0 content-between gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
                                        >
                                            <div className="min-w-0">
                                                <span className="grid size-10 place-items-center rounded-xl border border-satu-orange-border bg-satu-orange-soft text-satu-orange-ink">
                                                    <item.Icon
                                                        aria-hidden="true"
                                                        className="size-5"
                                                    />
                                                </span>
                                                <h3 className="mt-3 text-lg font-semibold">
                                                    {item.title}
                                                </h3>
                                                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                                    {item.description}
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="min-h-11 w-full whitespace-normal"
                                                disabled={busy || uncertain}
                                                onClick={() => {
                                                    form.resetAndClearErrors();
                                                    setActive(key);
                                                }}
                                            >
                                                {item.title}
                                            </Button>
                                        </section>
                                    );
                                },
                            )}
                        </div>
                        <DeleteUser />
                    </>
                )}
                <Dialog
                    open={active !== null}
                    onOpenChange={(open) => {
                        if (!open) {
                            close();
                        }
                    }}
                >
                    <DialogContent
                        closeButtonDisabled={busy}
                        onEscapeKeyDown={(event) => {
                            if (busy) {
                                event.preventDefault();
                            }
                        }}
                        onInteractOutside={(event) => {
                            if (busy) {
                                event.preventDefault();
                            }
                        }}
                    >
                        <DialogHeader>
                            <DialogTitle>{operation?.title}</DialogTitle>
                            <DialogDescription>
                                {operation?.description}
                            </DialogDescription>
                        </DialogHeader>
                        <form
                            className="grid gap-5"
                            onSubmit={(event) => {
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
                                        document
                                            .getElementById(
                                                'data-rights-reason',
                                            )
                                            ?.focus(),
                                    onHttpException: (response) =>
                                        failure(response.status),
                                    onNetworkError: () => failure(),
                                });
                            }}
                        >
                            {active !== 'withdrawal' && (
                                <div className="grid gap-2">
                                    <Label htmlFor="data-rights-reason">
                                        Keterangan dan alasan
                                    </Label>
                                    <textarea
                                        id="data-rights-reason"
                                        name="reason"
                                        required
                                        maxLength={500}
                                        disabled={busy}
                                        className="min-h-28 rounded-xl border border-input bg-transparent p-3 text-base focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed"
                                        value={form.data.reason}
                                        onChange={(event) =>
                                            form.setData(
                                                'reason',
                                                event.target.value,
                                            )
                                        }
                                        aria-invalid={Boolean(
                                            form.errors.reason,
                                        )}
                                        aria-describedby={
                                            form.errors.reason
                                                ? 'data-rights-reason-error'
                                                : undefined
                                        }
                                    />
                                    <InputError
                                        id="data-rights-reason-error"
                                        message={form.errors.reason}
                                    />
                                </div>
                            )}
                            {message && (
                                <p
                                    role="alert"
                                    className="text-sm leading-6 text-correction-subtle-foreground"
                                >
                                    {message}
                                </p>
                            )}
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="min-h-11"
                                    disabled={busy}
                                    onClick={close}
                                >
                                    Batal
                                </Button>
                                {uncertain ? (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="min-h-11"
                                        disabled={busy}
                                        onClick={refresh}
                                    >
                                        Periksa status
                                    </Button>
                                ) : (
                                    <Button
                                        type="submit"
                                        className="min-h-11"
                                        disabled={
                                            busy ||
                                            (active !== 'withdrawal' &&
                                                !form.data.reason.trim())
                                        }
                                    >
                                        {form.processing
                                            ? 'Mengirim...'
                                            : active === 'withdrawal'
                                              ? 'Konfirmasi penarikan'
                                              : 'Kirim permintaan'}
                                    </Button>
                                )}
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
DataRights.layout = {
    breadcrumbs: [{ title: 'Hak Data dan Privasi', href: editDataRights() }],
};
