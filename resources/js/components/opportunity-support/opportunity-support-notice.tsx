import { ShieldCheck } from 'lucide-react';
import type { OpportunitySupportNotice as NoticeType } from './opportunity-support-constants';

export function OpportunitySupportNotice({ notice }: { notice: NoticeType }) {
    if (!notice) {
        return null;
    }

    return (
        <section
            id="support-notice"
            className="rounded-2xl border border-primary/15 bg-accent/60 p-4 text-sm leading-6"
        >
            <p className="flex items-start gap-2 font-semibold">
                <ShieldCheck
                    className="mt-1 size-4 shrink-0"
                    aria-hidden="true"
                />
                Tujuan: {notice.purpose}
            </p>
            <p className="mt-2">
                Hanya peninjau kampus yang ditunjuk membaca kebutuhan dan
                penjelasan yang Anda kirim. Tidak membuka nomor kontak, bukti
                privat atau pesan. Akses berakhir {notice.access_days} hari
                setelah pengajuan; izin dapat dicabut lebih awal. Batas akses
                tidak berarti riwayat langsung dihapus.
            </p>
            <p className="mt-2 text-xs break-words">
                Pemberitahuan {notice.version}.{' '}
                {notice.dataset_kind === 'synthetic'
                    ? 'Data synthetic. Bukan hasil pilot.'
                    : 'Data operasional berizin. Bukan bukti dampak pilot.'}{' '}
                Manifest: {notice.dataset_manifest}.
            </p>
        </section>
    );
}
