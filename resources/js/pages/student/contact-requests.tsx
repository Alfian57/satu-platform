import { Head, router } from '@inertiajs/react';
import {
    CheckCircle2,
    LockKeyhole,
    Mail,
    ShieldCheck,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';
import StudentContactRequestController from '@/actions/App/Http/Controllers/StudentContactRequestController';
import { AppPage } from '@/components/app-page';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';

interface StudentContactRequestItem {
    id: number;
    organization_name: string;
    recruiter_name: string;
    purpose: string;
    message: string | null;
    status: string;
    created_at: string;
    expires_at: string;
    responded_at: string | null;
}

interface StudentContactRequestsProps {
    requests: StudentContactRequestItem[];
}

interface RequestDecision {
    id: number;
    kind: 'accept' | 'decline';
    organizationName: string;
}

const statusMeta: Record<string, { label: string; className: string }> = {
    accepted: {
        label: 'Diterima',
        className:
            'border-verified/40 bg-verified-subtle text-verified-subtle-foreground',
    },
    declined: {
        label: 'Ditolak',
        className: 'border-destructive/40 bg-destructive/10 text-destructive',
    },
    pending: {
        label: 'Menunggu respons',
        className:
            'border-pending/40 bg-pending-subtle text-pending-subtle-foreground',
    },
    expired: {
        label: 'Kedaluwarsa',
        className: 'border-border bg-muted text-muted-foreground',
    },
    canceled: {
        label: 'Dibatalkan',
        className: 'border-border bg-muted text-muted-foreground',
    },
};

export default function StudentContactRequests({
    requests,
}: StudentContactRequestsProps) {
    const [decision, setDecision] = useState<RequestDecision | null>(null);
    const [confirming, setConfirming] = useState(false);
    const [confirmError, setConfirmError] = useState<string | null>(null);
    const isAccept = decision?.kind === 'accept';

    const confirm = () => {
        if (!decision) {
            return;
        }

        setConfirming(true);
        setConfirmError(null);

        const action =
            decision.kind === 'accept'
                ? StudentContactRequestController.accept
                : StudentContactRequestController.decline;

        router.post(
            action(decision.id).url,
            {},
            {
                preserveState: true,
                preserveScroll: true,
                onError: () => {
                    setConfirmError(
                        'Permintaan tidak dapat diproses. Periksa koneksi lalu coba lagi.',
                    );
                    setConfirming(false);
                },
                onFinish: () => setConfirming(false),
            },
        );
    };

    return (
        <AppPage className="max-w-5xl">
            <Head title="Permintaan Kontak Recruiter" />

            <Heading
                title="Permintaan kontak"
                description="Tinjau permintaan kontak dari organization recruiter terverifikasi. Nomor WhatsApp hanya dibagikan saat kamu menerima permintaan."
            />

            <div
                role="region"
                aria-labelledby="received-requests-title"
                className="space-y-4"
            >
                <h2
                    id="received-requests-title"
                    className="text-sm font-semibold tracking-wider text-muted-foreground uppercase"
                >
                    Permintaan diterima ({requests.length})
                </h2>

                {requests.length === 0 && (
                    <div className="grid gap-3 rounded-lg border border-border bg-muted/40 px-6 py-12 text-center">
                        <Mail
                            aria-hidden="true"
                            className="mx-auto size-10 text-muted-foreground"
                        />
                        <p className="font-medium text-foreground">
                            Belum ada permintaan kontak
                        </p>
                        <p className="mx-auto max-w-md text-sm leading-6 text-muted-foreground">
                            Kamu belum memiliki permintaan kontak aktif dari
                            recruiter. Jaga proyeksi portfolio tetap diperbarui
                            untuk menarik peluang terverifikasi.
                        </p>
                    </div>
                )}

                {requests.length > 0 && (
                    <ul className="grid gap-4">
                        {requests.map((req) => {
                            const meta =
                                statusMeta[req.status] ?? statusMeta.expired;

                            return (
                                <li
                                    key={req.id}
                                    className="grid gap-4 rounded-lg border border-border bg-card p-5"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="grid gap-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="font-semibold text-foreground">
                                                    {req.organization_name}
                                                </h3>
                                                <span className="text-xs text-muted-foreground">
                                                    ({req.recruiter_name})
                                                </span>
                                            </div>
                                            <span
                                                className={`w-fit rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.className}`}
                                            >
                                                {meta.label}
                                            </span>
                                        </div>

                                        {req.status === 'pending' && (
                                            <div className="flex shrink-0 items-center gap-2">
                                                <Button
                                                    onClick={() =>
                                                        setDecision({
                                                            id: req.id,
                                                            kind: 'accept',
                                                            organizationName:
                                                                req.organization_name,
                                                        })
                                                    }
                                                    data-test={`accept-request-${req.id}`}
                                                >
                                                    <CheckCircle2 aria-hidden="true" />
                                                    Terima
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    onClick={() =>
                                                        setDecision({
                                                            id: req.id,
                                                            kind: 'decline',
                                                            organizationName:
                                                                req.organization_name,
                                                        })
                                                    }
                                                    data-test={`decline-request-${req.id}`}
                                                >
                                                    <XCircle aria-hidden="true" />
                                                    Tolak
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid gap-1 rounded-lg border border-border bg-muted/40 p-4 text-sm">
                                        <p className="font-medium text-foreground">
                                            Tujuan: {req.purpose}
                                        </p>
                                        {req.message && (
                                            <p className="text-muted-foreground">
                                                "{req.message}"
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                        <span>
                                            Diterima{' '}
                                            {new Date(
                                                req.created_at,
                                            ).toLocaleDateString()}
                                        </span>
                                        <span>
                                            Berakhir{' '}
                                            {new Date(
                                                req.expires_at,
                                            ).toLocaleDateString()}
                                        </span>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            <div className="mt-6 flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4">
                <LockKeyhole
                    aria-hidden="true"
                    className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                />
                <div className="grid gap-1 text-sm leading-6">
                    <p className="font-medium text-foreground">
                        Jaminan kerahasiaan
                    </p>
                    <p className="text-muted-foreground">
                        Recruiter tidak pernah menerima nomor WhatsApp atau
                        kontak langsung sampai kamu menerima permintaan. Menolak
                        atau mengabaikan permintaan menjaga kredensial privatmu.
                    </p>
                </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4">
                <ShieldCheck
                    aria-hidden="true"
                    className="mt-0.5 size-5 shrink-0 text-verified"
                />
                <div className="grid gap-1 text-sm leading-6">
                    <p className="font-medium text-foreground">
                        Persetujuan terverifikasi
                    </p>
                    <p className="text-muted-foreground">
                        Menerima permintaan mencatat persetujuan (consent) yang
                        mengontrol handoff kontak. Data yang telah dibagikan
                        tetap mengikuti kebijakan retention.
                    </p>
                </div>
            </div>

            {decision && (
                <Dialog
                    open
                    onOpenChange={(open) => !open && setDecision(null)}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {isAccept
                                    ? 'Konfirmasi pembagian kontak'
                                    : 'Konfirmasi penolakan'}
                            </DialogTitle>
                            <DialogDescription>
                                {isAccept
                                    ? `Kamu akan membagikan nama dan nomor WhatsApp terverifikasimu ke ${decision.organizationName}. Tindakan ini tidak dapat dibatalkan melalui halaman ini.`
                                    : `Kamu akan menolak permintaan dari ${decision.organizationName}. Menolak tidak membagikan kontakmu dan recruiter tidak menerima alasan penolakan.`}
                            </DialogDescription>
                        </DialogHeader>

                        {confirmError && (
                            <p
                                role="alert"
                                className="border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                            >
                                {confirmError}
                            </p>
                        )}

                        <DialogFooter className="gap-2">
                            <Button
                                variant="secondary"
                                disabled={confirming}
                                onClick={() => setDecision(null)}
                            >
                                Batal
                            </Button>
                            <Button
                                variant={isAccept ? 'default' : 'destructive'}
                                disabled={confirming}
                                onClick={confirm}
                                data-test={
                                    isAccept
                                        ? `confirm-share-${decision.id}`
                                        : `confirm-decline-${decision.id}`
                                }
                            >
                                {confirming && <Spinner aria-hidden="true" />}
                                {isAccept ? 'Terima & bagikan kontak' : 'Tolak'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </AppPage>
    );
}
