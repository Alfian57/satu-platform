import { useHttp } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import type {
    PageData,
    University,
} from '@/components/university-settings-nav';
import { store as confirmPassword } from '@/routes/password/confirm';
import { revoke, store as invite } from '@/routes/platform/invitations';
import { index, status as changeStatus } from '@/routes/university/admins';

export type Admin = {
    id: number;
    user_id: number;
    name: string;
    status: string;
    revision: string;
};

export type Invitation = {
    id: number;
    phone_masked: string;
    status: string;
    delivery_status: string | null;
    expires_at: string;
    can_revoke: boolean;
};

export type UniversityAdminsProps = {
    institution: University;
    data: Admin[];
    invitations: PageData<Invitation>;
};

export type Decision =
    | { kind: 'invite' }
    | { kind: 'status'; admin: Admin }
    | { kind: 'revoke'; invitation: Invitation };

export function useUniversityAdmins(initial: UniversityAdminsProps) {
    const [snapshot, setSnapshot] = useState(initial);
    const [decision, setDecision] = useState<Decision | null>(null);
    const [phone, setPhone] = useState('');
    const [reason, setReason] = useState('');
    const [password, setPassword] = useState('');
    const [confirmed, setConfirmed] = useState(false);
    const [needsCheck, setNeedsCheck] = useState(false);
    const [denied, setDenied] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const lock = useRef(false);
    const feedbackRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);

    const confirmation = useHttp<{ password: string }, unknown>({
        password: '',
    });
    const command = useHttp<Record<string, string>, { data: { id: number } }>(
        {},
    );
    const read = useHttp<Record<string, never>, UniversityAdminsProps>({});

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
            feedbackRef.current?.focus();
        }
    }, [busy, error, errors.length]);

    function closeDecision(): void {
        if (lock.current || busy) {
            return;
        }

        setDecision(null);
        setPassword('');
        setConfirmed(false);
        confirmation.resetAndClearErrors();
        command.clearErrors();
    }

    function openDecision(next: Decision): void {
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

    function httpError(code: number, mutation: boolean): void {
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

    function refreshList(page = snapshot.invitations.current_page): void {
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

    async function submitDecision(): Promise<void> {
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

    return {
        snapshot,
        decision,
        phone,
        reason,
        password,
        confirmed,
        needsCheck,
        denied,
        message,
        error,
        busy,
        stale,
        errors,
        activeCount,
        decisionTitle,
        notice,
        feedbackRef,
        titleRef,
        readProcessing: read.processing,
        confirmationProcessing: confirmation.processing,
        commandErrors: command.errors,
        confirmationErrors: confirmation.errors,
        actions: {
            openDecision,
            closeDecision,
            refreshList,
            submitDecision,
            setPhone: (val: string) => {
                setPhone(val);
                command.clearErrors();
            },
            setReason: (val: string) => {
                setReason(val);
                command.clearErrors();
            },
            setPassword: (val: string) => {
                setPassword(val);
                confirmation.clearErrors();
            },
        },
    };
}
