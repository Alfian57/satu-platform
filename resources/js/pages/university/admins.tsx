import { Head, useHttp, usePage } from '@inertiajs/react';
import { ShieldCheck, UserPlus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { AppPage } from '@/components/app-page';
import {
    CampusOperationHeader,
    campusControlClass,
} from '@/components/campus-operation-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    UniversityPagination,
    UniversitySettingsNav,
} from '@/components/university-settings-nav';
import type {
    University,
    PageData,
} from '@/components/university-settings-nav';
import { store as confirmPassword } from '@/routes/password/confirm';
import { store as invite } from '@/routes/platform/invitations';
import { revoke } from '@/routes/platform/invitations';
import { index, status as changeStatus } from '@/routes/university/admins';

type Admin = {
    id: number;
    user_id: number;
    name: string;
    status: string;
    revision: string;
};
type Invitation = {
    id: number;
    phone_masked: string;
    status: string;
    delivery_status: string | null;
    expires_at: string;
    can_revoke: boolean;
};
type Props = {
    institution: University;
    data: Admin[];
    invitations: PageData<Invitation>;
};
type Decision =
    | { kind: 'invite' }
    | { kind: 'status'; admin: Admin }
    | { kind: 'revoke'; invitation: Invitation };
const labels: Record<string, string> = {
    verified: 'Aktif',
    suspended: 'Ditangguhkan',
    pending: 'Menunggu',
    unverified: 'Belum terverifikasi',
    issued: 'Menunggu penerimaan',
    accepted: 'Diterima',
    revoked: 'Dicabut',
    expired: 'Kedaluwarsa',
};
const deliveries: Record<string, string> = {
    queued: 'Menunggu antrean WhatsApp',
    pending: 'Menunggu antrean WhatsApp',
    sent: 'Terkirim ke provider, belum berarti diterima',
    delivered: 'Delivery dikonfirmasi provider',
    failed: 'Pengiriman gagal',
    cancelled: 'Pengiriman dibatalkan',
};
const sheet =
    'min-w-0 rounded-3xl border border-primary/15 bg-white p-5 shadow-sm sm:p-6';
function date(value: string) {
    const parsed = new Date(value);

    return Number.isNaN(parsed.getTime())
        ? 'Waktu tidak tersedia'
        : new Intl.DateTimeFormat('id-ID', {
              dateStyle: 'medium',
              timeStyle: 'short',
          }).format(parsed);
}

export default function UniversityAdmins(initial: Props) {
    const { auth } = usePage().props;

    return (
        <AdminAccounts
            key={`${auth.user?.id}-${initial.institution.id}`}
            initial={initial}
        />
    );
}

function AdminAccounts({ initial }: { initial: Props }) {
    const [snapshot, setSnapshot] = useState(initial);
    const [decision, setDecision] = useState<Decision | null>(null);
    const [phone, setPhone] = useState(''),
        [reason, setReason] = useState(''),
        [password, setPassword] = useState('');
    const [confirmed, setConfirmed] = useState(false),
        [needsCheck, setNeedsCheck] = useState(false),
        [denied, setDenied] = useState(false);
    const [message, setMessage] = useState(''),
        [error, setError] = useState('');
    const lock = useRef(false),
        feedback = useRef<HTMLDivElement>(null),
        title = useRef<HTMLHeadingElement>(null);
    const confirmation = useHttp<{ password: string }, unknown>({
        password: '',
    });
    const command = useHttp<Record<string, string>, { data: { id: number } }>(
        {},
    );
    const read = useHttp<Record<string, never>, Props>({});
    const busy =
        confirmation.processing || command.processing || read.processing;
    const stale =
        decision?.kind === 'status' &&
        snapshot.data.find((item) => item.id === decision.admin.id)
            ?.revision !== decision.admin.revision;
    const errors = [
        ...Object.values(confirmation.errors),
        ...Object.values(command.errors),
    ];
    const activeCount = snapshot.data.filter(
        (item) => item.status === 'verified',
    ).length;

    useEffect(() => {
        if (!busy && (error || errors.length)) {
            feedback.current?.focus();
        }
    }, [busy, error, errors.length]);

    function close() {
        if (lock.current || busy) {
            return;
        }

        setDecision(null);
        setPassword('');
        setConfirmed(false);
        confirmation.resetAndClearErrors();
        command.clearErrors();
    }
    function open(next: Decision) {
        if (lock.current || busy || needsCheck || denied) {
            return;
        }

        setDecision(next);
        setConfirmed(false);
        setPassword('');
        setError('');
        command.clearErrors();
        confirmation.resetAndClearErrors();

        if (next.kind !== 'invite') {
            setReason('');
        }
    }
    function httpError(code: number, mutation: boolean) {
        if ([401, 403, 404, 419].includes(code)) {
            setDenied(true);
            setDecision(null);
            setPassword('');
            setConfirmed(false);
        }

        if (code === 423) {
            setConfirmed(false);
            setError(
                'Konfirmasi sandi kedaluwarsa. Masukkan sandi lagi; tindakan belum dikirim.',
            );

            return;
        }

        if (mutation) {
            setNeedsCheck(true);
        }

        setError(
            code === 409
                ? 'Keputusan memakai data lama. Periksa daftar terbaru, lalu tutup dan pilih ulang tindakan.'
                : 'Sesi, akses atau respons terbaru belum tersedia. Periksa daftar sebelum tindakan berikutnya.',
        );
    }
    function refresh(page = snapshot.invitations.current_page) {
        if (lock.current || busy) {
            return;
        }

        read.get(index.url(snapshot.institution.id, { query: { page } }), {
            onSuccess: (result) => {
                setSnapshot(result);
                setNeedsCheck(false);
                setDenied(false);
                setError('');
                command.clearErrors();
            },
            onHttpException: (response) => {
                httpError(response.status, false);

                return false;
            },
            onNetworkError: () => {
                setError(
                    'Koneksi belum tersedia. Draft tetap ada; tindakan ditahan sampai pembacaan berhasil.',
                );
                setNeedsCheck(true);

                return false;
            },
        }).catch(() => undefined);
    }
    async function submit() {
        if (
            !decision ||
            lock.current ||
            busy ||
            denied ||
            needsCheck ||
            stale
        ) {
            return;
        }

        lock.current = true;
        setError('');

        try {
            if (!confirmed) {
                confirmation.transform(() => ({ password }));
                await confirmation.post(confirmPassword.url(), {
                    onSuccess: () => {
                        setConfirmed(true);
                        setPassword('');
                        confirmation.resetAndClearErrors();
                    },
                    onHttpException: (response) => {
                        httpError(response.status, false);

                        return false;
                    },
                    onNetworkError: () => {
                        setError(
                            'Konfirmasi sandi belum berhasil dibaca. Tindakan belum dikirim; coba konfirmasi lagi.',
                        );

                        return false;
                    },
                });

                return;
            }

            const route =
                decision.kind === 'invite'
                    ? invite(snapshot.institution.id)
                    : decision.kind === 'revoke'
                      ? revoke(decision.invitation.id)
                      : changeStatus(decision.admin.id);
            command.transform(() =>
                decision.kind === 'invite'
                    ? { phone }
                    : decision.kind === 'revoke'
                      ? { reason }
                      : {
                            reason,
                            status:
                                decision.admin.status === 'verified'
                                    ? 'suspended'
                                    : 'verified',
                            expected_revision: decision.admin.revision,
                        },
            );
            await command.submit(route, {
                onError: () => {
                    setConfirmed(false);
                    setPassword('');
                },
                onSuccess: () => {
                    setMessage(
                        decision.kind === 'invite'
                            ? 'Undangan dijadwalkan melalui WhatsApp, belum berarti diterima.'
                            : 'Tindakan dikonfirmasi server. Periksa daftar terbaru.',
                    );
                    setNeedsCheck(true);
                    setDecision(null);
                    setPassword('');
                    setPhone('');
                    setReason('');
                    setConfirmed(false);
                },
                onHttpException: (response) => {
                    httpError(response.status, true);

                    return false;
                },
                onNetworkError: () => {
                    setNeedsCheck(true);
                    setError(
                        'Hasil tindakan belum pasti. Isian tetap ada; periksa daftar terbaru, jangan kirim ulang.',
                    );

                    return false;
                },
            });
        } catch {
            /* Error dan validasi ditampilkan oleh callback/useHttp. */
        } finally {
            lock.current = false;
        }
    }
    const decisionTitle =
        decision?.kind === 'invite'
            ? 'Undang Admin Universitas'
            : decision?.kind === 'revoke'
              ? 'Cabut undangan'
              : decision?.admin.status === 'verified'
                ? 'Tangguhkan akses admin'
                : 'Pulihkan akses admin';
    const notice =
        decision?.kind === 'invite'
            ? 'Penerima harus memverifikasi nomor yang sesuai dan menerima undangan. Undangan baru menggantikan undangan menunggu untuk nomor yang sama.'
            : decision?.kind === 'revoke'
              ? 'Tautan undangan tidak dapat digunakan lagi. Pencabutan dicatat, bukan penghapusan riwayat.'
              : 'Perubahan memengaruhi akses pengelolaan dan dicatat dengan alasan. Penangguhan membatalkan undangan menunggu yang diterbitkan admin tersebut. Admin aktif terakhir tidak dapat ditangguhkan.';

    return (
        <AppPage>
            <Head title="Akun Admin Universitas" />
            <div className="grid min-w-0 gap-6" data-test="university-admins">
                <CampusOperationHeader
                    theme="admins"
                    title="Akun admin"
                    description="Beberapa pengelola, satu ruang universitas. Setiap tindakan tetap mempunyai pelaku dan riwayatnya sendiri."
                    institution={snapshot.institution.name}
                    icon={ShieldCheck}
                />
                <UniversitySettingsNav
                    institution={snapshot.institution.id}
                    active="admins"
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="max-w-[65ch] text-sm leading-6 text-muted-foreground">
                        Registrasi publik tidak memberi akses admin. Undang
                        pengelola melalui nomor WhatsApp yang benar.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            onClick={() => refresh()}
                            disabled={busy}
                        >
                            Periksa daftar terbaru
                        </Button>
                        <Button
                            onClick={() => open({ kind: 'invite' })}
                            disabled={busy || needsCheck || denied}
                        >
                            <UserPlus aria-hidden="true" className="size-4" />
                            Undang admin
                        </Button>
                    </div>
                </div>
                {(message || error || needsCheck) && !decision && (
                    <div
                        ref={feedback}
                        tabIndex={-1}
                        className={sheet}
                        role={error ? 'alert' : 'status'}
                    >
                        <p>
                            {error ||
                                message ||
                                'Periksa daftar terbaru sebelum melanjutkan.'}
                        </p>
                        {needsCheck && (
                            <p className="mt-2 text-sm text-muted-foreground">
                                Command ditahan sampai pembacaan GET berhasil.
                            </p>
                        )}
                    </div>
                )}
                {denied ? (
                    <div role="alert" className={sheet}>
                        Akses atau sesi admin tidak tersedia. Data sebelumnya
                        disembunyikan. Masuk ulang atau minta pengelola lain
                        memeriksa akses.
                    </div>
                ) : (
                    <>
                        <section
                            className={sheet}
                            aria-busy={read.processing}
                            aria-labelledby="admin-list-title"
                        >
                            <h2
                                id="admin-list-title"
                                ref={title}
                                tabIndex={-1}
                                className="text-xl font-bold"
                            >
                                Pengelola universitas
                            </h2>
                            <p className="mt-2 text-sm text-muted-foreground">
                                {activeCount} admin aktif. Akun terakhir tetap
                                dilindungi.
                            </p>
                            <div className="mt-3 divide-y divide-border">
                                {snapshot.data.length ? (
                                    snapshot.data.map((admin) => (
                                        <article
                                            key={admin.id}
                                            className="flex flex-wrap items-center justify-between gap-4 py-4"
                                        >
                                            <div className="min-w-0 flex-1 basis-48">
                                                <h3 className="font-semibold wrap-anywhere">
                                                    {admin.name}
                                                </h3>
                                                <Badge
                                                    className="mt-2"
                                                    variant={
                                                        admin.status ===
                                                        'verified'
                                                            ? 'verified'
                                                            : 'correction'
                                                    }
                                                >
                                                    {labels[admin.status] ??
                                                        'Status belum tersedia'}
                                                </Badge>
                                            </div>
                                            {['verified', 'suspended'].includes(
                                                admin.status,
                                            ) && (
                                                <Button
                                                    variant="outline"
                                                    disabled={
                                                        busy ||
                                                        needsCheck ||
                                                        (admin.status ===
                                                            'verified' &&
                                                            activeCount <= 1)
                                                    }
                                                    onClick={() =>
                                                        open({
                                                            kind: 'status',
                                                            admin,
                                                        })
                                                    }
                                                >
                                                    {admin.status === 'verified'
                                                        ? activeCount <= 1
                                                            ? 'Admin aktif terakhir'
                                                            : 'Tangguhkan akses'
                                                        : 'Pulihkan akses'}
                                                </Button>
                                            )}
                                        </article>
                                    ))
                                ) : (
                                    <p className="py-4 text-muted-foreground">
                                        Belum ada akun admin yang dapat dibaca.
                                    </p>
                                )}
                            </div>
                        </section>
                        <section
                            className={sheet}
                            aria-busy={read.processing}
                            aria-labelledby="invitation-list-title"
                        >
                            <h2
                                id="invitation-list-title"
                                className="text-xl font-bold"
                            >
                                Riwayat undangan
                            </h2>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                Status pengiriman terpisah dari penerimaan
                                akses. Token dan nomor lengkap tidak
                                ditampilkan.
                            </p>
                            <div className="my-4 divide-y divide-border">
                                {snapshot.invitations.data.length ? (
                                    snapshot.invitations.data.map((item) => (
                                        <article
                                            key={item.id}
                                            className="flex flex-wrap justify-between gap-4 py-4"
                                        >
                                            <div className="min-w-0 flex-1 basis-48">
                                                <h3 className="font-semibold wrap-anywhere">
                                                    Undangan {item.id}.{' '}
                                                    {item.phone_masked}
                                                </h3>
                                                <Badge
                                                    className="mt-2"
                                                    variant={
                                                        item.status ===
                                                        'accepted'
                                                            ? 'verified'
                                                            : 'pending'
                                                    }
                                                >
                                                    {labels[item.status] ??
                                                        'Status belum tersedia'}
                                                </Badge>
                                                <p className="mt-2 text-sm text-muted-foreground">
                                                    {deliveries[
                                                        item.delivery_status ??
                                                            ''
                                                    ] ??
                                                        'Status delivery belum tersedia'}
                                                </p>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    Berlaku sampai{' '}
                                                    {date(item.expires_at)}
                                                </p>
                                            </div>
                                            {item.can_revoke && (
                                                <Button
                                                    variant="outline"
                                                    disabled={
                                                        busy || needsCheck
                                                    }
                                                    onClick={() =>
                                                        open({
                                                            kind: 'revoke',
                                                            invitation: item,
                                                        })
                                                    }
                                                >
                                                    Cabut undangan
                                                </Button>
                                            )}
                                        </article>
                                    ))
                                ) : (
                                    <p className="py-4 text-sm text-muted-foreground">
                                        Belum ada undangan. Gunakan Undang admin
                                        untuk menambah pengelola secara
                                        terkontrol.
                                    </p>
                                )}
                            </div>
                            <UniversityPagination
                                page={snapshot.invitations}
                                busy={busy}
                                onPage={refresh}
                            />
                        </section>
                    </>
                )}
                {busy && (
                    <p role="status" className="text-sm text-muted-foreground">
                        {read.processing
                            ? 'Memuat daftar terbaru.'
                            : confirmation.processing
                              ? 'Memeriksa sandi, belum mengubah akses.'
                              : 'Mengirim tindakan. Tunggu konfirmasi server.'}
                    </p>
                )}
            </div>
            <Dialog
                open={!!decision}
                onOpenChange={(value) => {
                    if (!value) {
                        close();
                    }
                }}
            >
                <DialogContent
                    closeButtonDisabled={busy}
                    onCloseAutoFocus={(event) => {
                        event.preventDefault();
                        title.current?.focus();
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>{decisionTitle}</DialogTitle>
                        <DialogDescription>{notice}</DialogDescription>
                    </DialogHeader>
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            void submit();
                        }}
                        className="grid min-w-0 gap-4"
                    >
                        <div className="rounded-2xl bg-accent p-4 text-sm leading-6">
                            {decision?.kind === 'status'
                                ? decision.admin.name
                                : decision?.kind === 'revoke'
                                  ? `Undangan ${decision.invitation.id}. ${decision.invitation.phone_masked}`
                                  : `Penerima diundang sebagai Admin Universitas untuk ${snapshot.institution.name}.`}
                        </div>
                        {(error || errors.length > 0 || stale) && (
                            <div
                                ref={feedback}
                                tabIndex={-1}
                                role="alert"
                                id="admin-command-errors"
                                className="rounded-xl border border-correction/30 p-3 text-sm"
                            >
                                <p>
                                    {stale
                                        ? 'Data admin berubah. Tutup dialog dan pilih ulang tindakan setelah memeriksa daftar.'
                                        : error}
                                </p>
                                {errors.map((item, i) => (
                                    <p key={i}>{item}</p>
                                ))}
                            </div>
                        )}
                        {decision?.kind === 'invite' ? (
                            <label className="grid gap-2 text-sm font-semibold">
                                Nomor WhatsApp
                                <input
                                    className={campusControlClass}
                                    type="tel"
                                    autoComplete="tel"
                                    value={phone}
                                    maxLength={20}
                                    onChange={(event) => {
                                        setPhone(event.target.value);
                                        command.clearErrors();
                                    }}
                                    required
                                    disabled={busy || needsCheck || confirmed}
                                    aria-invalid={!!command.errors.phone}
                                    aria-describedby={
                                        command.errors.phone
                                            ? 'admin-command-errors'
                                            : undefined
                                    }
                                />
                            </label>
                        ) : (
                            <label className="grid gap-2 text-sm font-semibold">
                                Alasan tindakan
                                <textarea
                                    className={campusControlClass}
                                    aria-label="Alasan tindakan"
                                    value={reason}
                                    minLength={3}
                                    maxLength={1000}
                                    rows={3}
                                    required
                                    disabled={busy || needsCheck || confirmed}
                                    onChange={(event) => {
                                        setReason(event.target.value);
                                        command.clearErrors();
                                    }}
                                    aria-invalid={!!command.errors.reason}
                                    aria-describedby={
                                        command.errors.reason
                                            ? 'admin-command-errors'
                                            : undefined
                                    }
                                />
                            </label>
                        )}
                        {!confirmed ? (
                            <label className="grid gap-2 text-sm font-semibold">
                                Sandi saat ini
                                <input
                                    className={campusControlClass}
                                    type="password"
                                    aria-label="Sandi saat ini"
                                    aria-describedby={
                                        confirmation.errors.password
                                            ? 'admin-password-help admin-command-errors'
                                            : 'admin-password-help'
                                    }
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(event) => {
                                        setPassword(event.target.value);
                                        confirmation.clearErrors();
                                    }}
                                    required
                                    disabled={busy || needsCheck}
                                    aria-invalid={
                                        !!confirmation.errors.password
                                    }
                                />
                                <span
                                    id="admin-password-help"
                                    className="text-xs leading-5 font-normal text-muted-foreground"
                                >
                                    Memeriksa sandi belum mengirim tindakan.
                                </span>
                            </label>
                        ) : (
                            <p
                                role="status"
                                className="rounded-xl bg-accent p-3 text-sm"
                            >
                                Sandi dikonfirmasi. Tindakan belum dikirim;
                                periksa kembali lalu konfirmasi.
                            </p>
                        )}
                        {needsCheck && (
                            <Button
                                type="button"
                                variant="outline"
                                disabled={busy}
                                onClick={() => refresh()}
                            >
                                Periksa daftar terbaru
                            </Button>
                        )}
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={close}
                                disabled={busy}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={busy || needsCheck || stale}
                            >
                                {confirmed
                                    ? 'Konfirmasi tindakan'
                                    : 'Konfirmasi sandi'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppPage>
    );
}
