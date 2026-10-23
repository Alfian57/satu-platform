import { cn } from '@/lib/utils';
import type { RecoveryDeliveryStatus } from '@/pages/auth/recover/_hooks/use-recovery-form';

type Props = {
    status?: RecoveryDeliveryStatus;
    maskedPhone: string;
    className?: string;
};

export default function RecoveryDeliveryStatus({
    status,
    maskedPhone,
    className,
}: Props) {
    const copy = {
        queued: `Jika nomor ${maskedPhone} terdaftar, kode akan segera dikirim ke WhatsApp.`,
        sent: `Jika nomor ${maskedPhone} terdaftar, kode verifikasi sudah dikirim ke WhatsApp.`,
        failed: 'Pengiriman belum berhasil. Coba kirim ulang setelah jeda selesai.',
        locked: 'Batas percobaan kode tercapai. Minta kode baru setelah jeda selesai.',
        unknown: `Jika nomor ${maskedPhone} terdaftar, kode akan dikirim ke WhatsApp.`,
    }[status ?? 'queued'];

    const isError = status === 'failed' || status === 'locked';

    return (
        <p
            role="status"
            aria-live="polite"
            data-test="recovery-delivery-status"
            className={cn(
                'rounded-md border px-3 py-2 text-sm leading-relaxed',
                isError
                    ? 'border-correction/35 bg-correction-subtle text-correction-subtle-foreground'
                    : 'border-verified/35 bg-verified-subtle text-verified-subtle-foreground',
                className,
            )}
        >
            {copy}
        </p>
    );
}
