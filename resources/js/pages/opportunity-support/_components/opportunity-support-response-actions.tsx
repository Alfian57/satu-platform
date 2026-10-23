import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { show as projectShow } from '@/routes/projects';
import type {
    SupportCase,
    SupportEvent,
} from './opportunity-support-constants';

export function OpportunitySupportResponseActions({
    selected,
    latestOffer,
    blocked,
    onAccept,
    onDecline,
    onWithdraw,
}: {
    selected: SupportCase;
    latestOffer?: SupportEvent;
    blocked: boolean;
    onAccept: () => void;
    onDecline: () => void;
    onWithdraw: () => void;
}) {
    return (
        <>
            {selected.status === 'offered' && selected.permissions.respond && (
                <div className="mt-5 rounded-2xl bg-accent/60 p-4">
                    <p className="text-sm leading-6">
                        Menerima tawaran tidak memesan tempat atau mengajukan
                        minat otomatis. Anda boleh menolak tanpa alasan.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3">
                        <Button disabled={blocked} onClick={onAccept}>
                            Terima tawaran
                        </Button>
                        <Button
                            variant="outline"
                            disabled={blocked}
                            onClick={onDecline}
                        >
                            Tolak tawaran
                        </Button>
                    </div>
                </div>
            )}

            {selected.status === 'accepted' && latestOffer?.opportunity && (
                <Button variant="outline" asChild className="mt-5">
                    <Link
                        href={projectShow(latestOffer.opportunity.project_id)}
                    >
                        Lihat peluang dan ajukan minat
                    </Link>
                </Button>
            )}

            {selected.permissions.withdraw && (
                <Button
                    variant="outline"
                    className="mt-4"
                    disabled={blocked}
                    onClick={onWithdraw}
                >
                    Cabut izin bantuan
                </Button>
            )}

            {!selected.permissions.review &&
                !selected.permissions.respond &&
                selected.status !== 'withdrawn' && (
                    <p className="mt-4 text-sm text-muted-foreground">
                        Tindak lanjut tidak tersedia. Masa akses, izin atau
                        konfigurasi mungkin berubah. Pencabutan izin tetap dapat
                        dilakukan.
                    </p>
                )}
        </>
    );
}
