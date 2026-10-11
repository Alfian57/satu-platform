import { Head, router, useForm } from '@inertiajs/react';
import {
    Award,
    CheckCircle2,
    CircleDot,
    FilePlus2,
    History,
    LoaderCircle,
    Plus,
    XCircle,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { AppPage } from '@/components/app-page';
import {
    CampusOperationHeader,
    CampusWorkflowGuide,
    campusControlClass,
} from '@/components/campus-operation-layout';
import { DashboardArchiveArt } from '@/components/dashboard-archive-art';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
    activate,
    index,
    retire,
    store,
} from '@/routes/campus/credit-mappings';

interface CreditMappingItem {
    id: number;
    activity_type: string;
    version: number;
    credit_amount: number;
    status: string;
    effective_from: string | null;
    effective_to: string | null;
    approver_name: string | null;
    reason: string | null;
    created_at: string;
}

interface CampusCreditMappingsProps {
    mappings: CreditMappingItem[];
    institution: {
        id: number;
        name: string;
    };
}

const activityLabels: Record<string, string> = {
    project: 'Proyek terverifikasi',
    competition: 'Kompetisi / hackathon',
    research: 'Riset akademik',
    organization: 'Kepemimpinan organisasi mahasiswa',
};

function mappingDate(value: string | null) {
    if (!value || Number.isNaN(new Date(value).getTime())) {
        return 'Belum tersedia';
    }

    return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(
        new Date(value),
    );
}

export default function CampusCreditMappings({
    mappings,
    institution,
}: CampusCreditMappingsProps) {
    const form = useForm({
        activity_type: 'project',
        credit_amount: '3.0',
        reason: '',
    });
    const [confirmation, setConfirmation] = useState<{
        mapping: CreditMappingItem;
        action: 'activate' | 'retire';
    } | null>(null);
    const [processing, setProcessing] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [accessUnavailable, setAccessUnavailable] = useState(false);
    const busy = processing || form.processing;
    const activeCount = mappings.filter(
        (mapping) => mapping.status === 'active',
    ).length;
    const draftCount = mappings.filter(
        (mapping) => mapping.status === 'draft',
    ).length;

    function handleHttpFailure(status: number) {
        if (status === 403 || status === 404) {
            setAccessUnavailable(true);
            setConfirmation(null);
        }

        setFeedback(
            'Hasil perubahan belum dapat dikonfirmasi. Muat ulang aturan sebelum mencoba kembali.',
        );

        return false;
    }

    function handleNetworkFailure() {
        setFeedback(
            'Koneksi terputus. Hasil perubahan belum dapat dikonfirmasi. Periksa koneksi dan muat ulang aturan.',
        );

        return false;
    }

    function createDraft(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (busy || accessUnavailable) {
            return;
        }

        setFeedback(null);
        setSuccess(null);
        form.transform((data) => ({
            ...data,
            credit_amount: Number(data.credit_amount),
            reason: data.reason || undefined,
        }));
        form.post(store.url({ institution: institution.id }), {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                form.reset('reason');
                setSuccess(
                    'Draft pemetaan kredit tersimpan. Periksa aturan sebelum mengaktifkannya.',
                );
            },
            onError: () =>
                setFeedback(
                    'Draft belum disimpan. Periksa isian yang ditandai.',
                ),
            onHttpException: (response) => handleHttpFailure(response.status),
            onNetworkError: handleNetworkFailure,
        });
    }

    function confirmAction() {
        if (!confirmation || busy || accessUnavailable) {
            return;
        }

        setProcessing(true);
        setFeedback(null);
        setSuccess(null);
        const action = confirmation.action;
        const route = action === 'activate' ? activate : retire;
        router.post(
            route({
                institution: institution.id,
                mapping: confirmation.mapping.id,
            }).url,
            {},
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setConfirmation(null);
                    setSuccess(
                        action === 'activate'
                            ? 'Aturan pemetaan kredit diaktifkan. Riwayat versi tetap tersimpan.'
                            : 'Aturan pemetaan kredit dihentikan. Riwayat versi tetap tersimpan.',
                    );
                    window.setTimeout(
                        () =>
                            document
                                .getElementById('credit-mappings-heading')
                                ?.focus(),
                        0,
                    );
                },
                onError: (errors) =>
                    setFeedback(
                        errors.mapping ??
                            'Perubahan belum disimpan. Muat ulang aturan dan periksa statusnya.',
                    ),
                onHttpException: (response) =>
                    handleHttpFailure(response.status),
                onNetworkError: handleNetworkFailure,
                onFinish: () => setProcessing(false),
            },
        );
    }

    function reloadMappings() {
        if (busy) {
            return;
        }

        setProcessing(true);
        router.get(
            index({ institution: institution.id }).url,
            {},
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setAccessUnavailable(false);
                    setFeedback(null);
                    setConfirmation(null);
                },
                onHttpException: (response) =>
                    handleHttpFailure(response.status),
                onNetworkError: handleNetworkFailure,
                onFinish: () => setProcessing(false),
            },
        );
    }

    return (
        <>
            <Head title={`Pemetaan Kredit - ${institution.name} | SATU`} />
            <AppPage>
                <div
                    className="space-y-6"
                    data-test="campus-credit-mappings-root"
                >
                    <CampusOperationHeader
                        title="Pemetaan kredit"
                        description="Atur kredit akademik untuk jenis aktivitas melalui aturan berversi. Draft belum berlaku sampai diaktifkan."
                        institution={institution.name}
                        icon={Award}
                    />
                    {feedback && (
                        <div
                            role="alert"
                            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-correction/30 bg-correction-subtle p-4 text-sm text-correction-subtle-foreground"
                        >
                            <p>{feedback}</p>
                            <Button
                                variant="outline"
                                disabled={busy}
                                onClick={reloadMappings}
                            >
                                Muat ulang aturan
                            </Button>
                        </div>
                    )}
                    {success && (
                        <p
                            role="status"
                            className="flex items-start gap-2 rounded-2xl border border-verified/30 bg-verified-subtle p-4 text-sm text-verified-subtle-foreground"
                        >
                            <CheckCircle2
                                aria-hidden="true"
                                className="mt-0.5 size-4 shrink-0"
                            />
                            {success}
                        </p>
                    )}
                    {accessUnavailable ? (
                        <section className="rounded-3xl border border-border bg-white p-5">
                            <h2 className="text-lg font-bold">
                                Akses pemetaan kredit tidak tersedia
                            </h2>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                Data sebelumnya disembunyikan. Periksa izin
                                institusi sebelum memuat ulang.
                            </p>
                        </section>
                    ) : (
                        <>
                            <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]">
                                <form
                                    aria-labelledby="credit-draft-heading"
                                    onSubmit={createDraft}
                                    className="@container min-w-0 rounded-3xl border border-primary/15 bg-white p-4 shadow-sm sm:p-5"
                                >
                                    <div className="flex items-start gap-3 border-b border-border pb-4">
                                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                                            <FilePlus2
                                                aria-hidden="true"
                                                className="size-5"
                                            />
                                        </span>
                                        <div>
                                            <h2
                                                id="credit-draft-heading"
                                                className="text-lg font-bold"
                                            >
                                                Buat aturan baru
                                            </h2>
                                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                                Simpan sebagai draft untuk
                                                diperiksa terlebih dahulu.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-5 grid gap-4 @min-[32rem]:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                                        <div className="grid min-w-0 content-start gap-2">
                                            <label
                                                htmlFor="credit-activity"
                                                className="text-sm font-semibold"
                                            >
                                                Jenis aktivitas
                                            </label>
                                            <select
                                                id="credit-activity"
                                                value={form.data.activity_type}
                                                onChange={(event) =>
                                                    form.setData(
                                                        'activity_type',
                                                        event.target.value,
                                                    )
                                                }
                                                disabled={busy}
                                                className={cn(
                                                    campusControlClass,
                                                    'cursor-pointer',
                                                )}
                                                aria-invalid={Boolean(
                                                    form.errors.activity_type,
                                                )}
                                                aria-describedby={
                                                    form.errors.activity_type
                                                        ? 'credit-activity-error'
                                                        : undefined
                                                }
                                            >
                                                {Object.entries(
                                                    activityLabels,
                                                ).map(([value, label]) => (
                                                    <option
                                                        value={value}
                                                        key={value}
                                                    >
                                                        {label}
                                                    </option>
                                                ))}
                                            </select>
                                            {form.errors.activity_type && (
                                                <p
                                                    role="alert"
                                                    id="credit-activity-error"
                                                    className="text-sm text-correction-subtle-foreground"
                                                >
                                                    {form.errors.activity_type}
                                                </p>
                                            )}
                                        </div>
                                        <div className="grid min-w-0 content-start gap-2">
                                            <label
                                                htmlFor="credit-amount"
                                                className="text-sm font-semibold"
                                            >
                                                Jumlah kredit (SKS)
                                            </label>
                                            <input
                                                id="credit-amount"
                                                type="number"
                                                min="0.5"
                                                max="24"
                                                step="0.5"
                                                required
                                                value={form.data.credit_amount}
                                                onChange={(event) =>
                                                    form.setData(
                                                        'credit_amount',
                                                        event.target.value,
                                                    )
                                                }
                                                disabled={busy}
                                                className={campusControlClass}
                                                aria-invalid={Boolean(
                                                    form.errors.credit_amount,
                                                )}
                                                aria-describedby="credit-amount-help credit-amount-error"
                                            />
                                            <p
                                                id="credit-amount-help"
                                                className="text-xs leading-5 text-muted-foreground"
                                            >
                                                0,5 sampai 24 SKS.
                                            </p>
                                            {form.errors.credit_amount && (
                                                <p
                                                    role="alert"
                                                    id="credit-amount-error"
                                                    className="text-sm text-correction-subtle-foreground"
                                                >
                                                    {form.errors.credit_amount}
                                                </p>
                                            )}
                                        </div>
                                        <div className="grid gap-2 @min-[32rem]:col-span-2">
                                            <label
                                                htmlFor="credit-reason"
                                                className="text-sm font-semibold"
                                            >
                                                Catatan aturan (opsional)
                                            </label>
                                            <textarea
                                                id="credit-reason"
                                                rows={3}
                                                maxLength={1000}
                                                value={form.data.reason}
                                                onChange={(event) =>
                                                    form.setData(
                                                        'reason',
                                                        event.target.value,
                                                    )
                                                }
                                                disabled={busy}
                                                placeholder="Jelaskan dasar atau perubahan aturan kredit."
                                                className={cn(
                                                    campusControlClass,
                                                    'resize-y',
                                                )}
                                                aria-invalid={Boolean(
                                                    form.errors.reason,
                                                )}
                                                aria-describedby="credit-reason-help credit-reason-error"
                                            />
                                            <p
                                                id="credit-reason-help"
                                                className="text-xs leading-5 text-muted-foreground"
                                            >
                                                Maksimum 1.000 karakter.
                                            </p>
                                            {form.errors.reason && (
                                                <p
                                                    role="alert"
                                                    id="credit-reason-error"
                                                    className="text-sm text-correction-subtle-foreground"
                                                >
                                                    {form.errors.reason}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                                        <p className="text-xs leading-5 text-muted-foreground">
                                            Versi ditentukan oleh sistem saat
                                            disimpan.
                                        </p>
                                        <Button type="submit" disabled={busy}>
                                            {form.processing ? (
                                                <LoaderCircle
                                                    aria-hidden="true"
                                                    className="size-4 animate-spin motion-reduce:animate-none"
                                                />
                                            ) : (
                                                <Plus
                                                    aria-hidden="true"
                                                    className="size-4"
                                                />
                                            )}
                                            {form.processing
                                                ? 'Menyimpan draft...'
                                                : 'Buat draft'}
                                        </Button>
                                    </div>
                                </form>
                                <CampusWorkflowGuide
                                    title="Memahami versi aturan"
                                    steps={[
                                        {
                                            title: 'Draft belum berlaku',
                                            description:
                                                'Periksa aktivitas dan SKS sebelum mengaktifkan aturan.',
                                        },
                                        {
                                            title: 'Aktif untuk aktivitas yang sama',
                                            description:
                                                'Aktivasi menggantikan aturan aktif sebelumnya, tanpa menghapus riwayat.',
                                        },
                                        {
                                            title: 'Riwayat tetap tersimpan',
                                            description:
                                                'Aturan yang dihentikan tidak menulis ulang versi pada sinkronisasi historis.',
                                        },
                                    ]}
                                />
                            </div>
                            <section
                                aria-labelledby="credit-mappings-heading"
                                aria-busy={busy}
                                className="@container min-w-0 space-y-4"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <h2
                                            id="credit-mappings-heading"
                                            tabIndex={-1}
                                            className="text-lg font-bold focus-visible:ring-2 focus-visible:ring-ring"
                                        >
                                            Aturan dan riwayat versi
                                        </h2>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {activeCount} aktif. {draftCount}{' '}
                                            draft. {mappings.length} aturan
                                            tercatat.
                                        </p>
                                    </div>
                                    <History
                                        aria-hidden="true"
                                        className="size-5 text-primary"
                                    />
                                </div>
                                {mappings.length === 0 ? (
                                    <div className="rounded-3xl border border-border bg-white p-6 text-center shadow-sm">
                                        <DashboardArchiveArt className="mx-auto size-20" />
                                        <h3 className="mt-3 text-lg font-bold">
                                            Belum ada aturan kredit
                                        </h3>
                                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                            Buat draft melalui formulir di atas.
                                            Aturan tidak langsung aktif setelah
                                            disimpan.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4 @min-[56rem]:grid-cols-2">
                                        {mappings.map((mapping) => {
                                            const active =
                                                mapping.status === 'active';
                                            const draft =
                                                mapping.status === 'draft';
                                            const Icon = active
                                                ? CheckCircle2
                                                : draft
                                                  ? CircleDot
                                                  : History;

                                            return (
                                                <article
                                                    key={mapping.id}
                                                    className="min-w-0 rounded-3xl border border-border bg-white p-4 shadow-sm sm:p-5"
                                                >
                                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-semibold text-primary">
                                                                Versi{' '}
                                                                {
                                                                    mapping.version
                                                                }
                                                            </p>
                                                            <h3 className="mt-1 text-xl font-bold wrap-anywhere">
                                                                {activityLabels[
                                                                    mapping
                                                                        .activity_type
                                                                ] ??
                                                                    mapping.activity_type.replaceAll(
                                                                        '_',
                                                                        ' ',
                                                                    )}
                                                            </h3>
                                                        </div>
                                                        <span
                                                            className={cn(
                                                                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
                                                                active
                                                                    ? 'border-verified/30 bg-verified-subtle text-verified-subtle-foreground'
                                                                    : draft
                                                                      ? 'border-pending/30 bg-pending-subtle text-pending-subtle-foreground'
                                                                      : 'border-border bg-accent/40 text-muted-foreground',
                                                            )}
                                                        >
                                                            <Icon
                                                                aria-hidden="true"
                                                                className="size-3.5"
                                                            />
                                                            {active
                                                                ? 'Aktif'
                                                                : draft
                                                                  ? 'Draft'
                                                                  : mapping.status ===
                                                                      'retired'
                                                                    ? 'Dihentikan'
                                                                    : mapping.status}
                                                        </span>
                                                    </div>
                                                    <p className="mt-4 text-2xl font-bold text-primary">
                                                        {mapping.credit_amount}{' '}
                                                        <span className="text-sm font-medium text-muted-foreground">
                                                            SKS
                                                        </span>
                                                    </p>
                                                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                                        {active
                                                            ? 'Aturan yang berlaku untuk aktivitas ini.'
                                                            : draft
                                                              ? 'Belum berlaku. Periksa sebelum mengaktifkan.'
                                                              : 'Riwayat aturan. Tidak dipakai untuk pemetaan baru.'}
                                                    </p>
                                                    {mapping.reason && (
                                                        <p className="mt-3 rounded-2xl bg-accent/50 p-3 text-sm leading-6 wrap-anywhere">
                                                            Catatan:{' '}
                                                            {mapping.reason}
                                                        </p>
                                                    )}
                                                    <dl className="mt-4 grid gap-3 border-y border-border py-3 sm:grid-cols-2">
                                                        <div className="min-w-0">
                                                            <dt className="text-xs text-muted-foreground">
                                                                Berlaku mulai
                                                            </dt>
                                                            <dd className="mt-1 text-sm">
                                                                {mappingDate(
                                                                    mapping.effective_from,
                                                                )}
                                                            </dd>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <dt className="text-xs text-muted-foreground">
                                                                Berlaku sampai
                                                            </dt>
                                                            <dd className="mt-1 text-sm">
                                                                {mapping.effective_to
                                                                    ? mappingDate(
                                                                          mapping.effective_to,
                                                                      )
                                                                    : active
                                                                      ? 'Belum dihentikan'
                                                                      : 'Belum tersedia'}
                                                            </dd>
                                                        </div>
                                                        {mapping.approver_name && (
                                                            <div className="min-w-0 sm:col-span-2">
                                                                <dt className="text-xs text-muted-foreground">
                                                                    Disetujui
                                                                    oleh
                                                                </dt>
                                                                <dd className="mt-1 text-sm wrap-anywhere">
                                                                    {
                                                                        mapping.approver_name
                                                                    }
                                                                </dd>
                                                            </div>
                                                        )}
                                                    </dl>
                                                    {(draft || active) && (
                                                        <div className="mt-4 flex justify-end">
                                                            <Button
                                                                type="button"
                                                                variant={
                                                                    draft
                                                                        ? 'default'
                                                                        : 'outline'
                                                                }
                                                                disabled={busy}
                                                                onClick={() => {
                                                                    setFeedback(
                                                                        null,
                                                                    );
                                                                    setConfirmation(
                                                                        {
                                                                            mapping,
                                                                            action: draft
                                                                                ? 'activate'
                                                                                : 'retire',
                                                                        },
                                                                    );
                                                                }}
                                                            >
                                                                {draft ? (
                                                                    <CheckCircle2
                                                                        aria-hidden="true"
                                                                        className="size-4"
                                                                    />
                                                                ) : (
                                                                    <XCircle
                                                                        aria-hidden="true"
                                                                        className="size-4"
                                                                    />
                                                                )}
                                                                {draft
                                                                    ? 'Aktifkan aturan'
                                                                    : 'Hentikan aturan'}
                                                            </Button>
                                                        </div>
                                                    )}
                                                </article>
                                            );
                                        })}
                                    </div>
                                )}
                            </section>
                        </>
                    )}
                </div>
            </AppPage>
            <Dialog
                open={confirmation !== null}
                onOpenChange={(open) => {
                    if (!open && !busy) {
                        setConfirmation(null);
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
                        <DialogTitle>
                            {confirmation?.action === 'activate'
                                ? 'Aktifkan aturan kredit?'
                                : 'Hentikan aturan kredit?'}
                        </DialogTitle>
                        <DialogDescription>
                            {confirmation?.action === 'activate'
                                ? 'Aturan aktif sebelumnya untuk jenis aktivitas yang sama akan dihentikan. Riwayat versi tetap tersimpan.'
                                : 'Aturan ini tidak lagi berlaku untuk pemetaan baru. Sinkronisasi historis tidak berubah.'}
                        </DialogDescription>
                    </DialogHeader>
                    {confirmation && (
                        <p className="rounded-2xl bg-accent p-4 text-sm leading-6 wrap-anywhere">
                            {activityLabels[
                                confirmation.mapping.activity_type
                            ] ?? confirmation.mapping.activity_type}
                            . Versi {confirmation.mapping.version}.{' '}
                            {confirmation.mapping.credit_amount} SKS.
                        </p>
                    )}
                    {feedback && (
                        <p
                            role="alert"
                            className="text-sm leading-6 text-correction-subtle-foreground"
                        >
                            {feedback}
                        </p>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            disabled={busy}
                            onClick={() => setConfirmation(null)}
                        >
                            Batal
                        </Button>
                        <Button
                            disabled={busy}
                            onClick={confirmAction}
                            variant={
                                confirmation?.action === 'retire'
                                    ? 'destructive'
                                    : 'default'
                            }
                        >
                            {processing
                                ? 'Memproses...'
                                : confirmation?.action === 'activate'
                                  ? 'Ya, aktifkan'
                                  : 'Ya, hentikan'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

CampusCreditMappings.layout = {
    breadcrumbs: [
        { title: 'Operasi Kampus', href: '#' },
        { title: 'Pemetaan Kredit', href: '#' },
    ],
};
