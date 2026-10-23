import { cn } from '@/lib/utils';
import type { RegistrationDeliveryStatus } from '@/pages/auth/register/_hooks/use-register-form';

type Props = {
    status?: RegistrationDeliveryStatus;
    maskedPhone: string;
    className?: string;
};

export default function DeliveryStatus({
    status,
    maskedPhone,
    className,
}: Props) {
    const copy = {
        queued: 'Permintaan pengiriman kode sedang diproses.',
        sent: `Kode dikirim ke WhatsApp ${maskedPhone}.`,
        failed: 'Pengiriman gagal. Periksa nomor atau coba kirim ulang.',
        locked: 'Batas percobaan kode tercapai. Minta kode baru setelah jeda selesai.',
    }[status ?? 'queued'];

    const isError = status === 'failed' || status === 'locked';

    return (
        <div
            role="status"
            aria-live="polite"
            data-test="register-delivery-status"
            className={className}
        >
            <p
                className={cn(
                    'rounded-xl border px-4 py-3 text-sm leading-relaxed',
                    isError
                        ? 'border-correction/30 bg-correction-subtle text-correction-subtle-foreground'
                        : 'border-verified/30 bg-verified-subtle text-verified-subtle-foreground',
                )}
            >
                {copy}
            </p>
        </div>
    );
}
