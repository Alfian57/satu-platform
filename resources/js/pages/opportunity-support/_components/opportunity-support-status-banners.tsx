import { sheetClass } from './opportunity-support-constants';

export function OpportunitySupportStatusBanners({
    administration,
    reviewer,
    isProcessing,
    isChecking,
    message,
    enabled,
    installed,
}: {
    administration: boolean;
    reviewer: boolean;
    isProcessing: boolean;
    isChecking: boolean;
    message: string;
    enabled: boolean;
    installed: boolean;
}) {
    return (
        <div className="space-y-5">
            {administration && !reviewer && (
                <section className={sheetClass}>
                    <h2 className="font-bold">
                        Anda belum ditunjuk sebagai peninjau bantuan
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Role Admin Universitas tidak otomatis membuka berkas
                        mahasiswa. Penunjukan, tujuan akses, consent dan gate
                        ditetapkan melalui proses terkontrol. Data bantuan
                        mahasiswa tidak ditampilkan.
                    </p>
                </section>
            )}

            <p
                role="status"
                className="text-sm leading-6 text-muted-foreground"
            >
                {isProcessing
                    ? 'Menyimpan keputusan...'
                    : isChecking
                      ? 'Membaca data terbaru. Isian tetap dipertahankan.'
                      : message}
            </p>

            {(!enabled || !installed) && (
                <section className={sheetClass}>
                    <h2 className="font-bold">Bantuan belum diaktifkan</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Proses, peninjau dan kebijakan privasi kampus perlu
                        disetujui terlebih dahulu.{' '}
                        {administration
                            ? 'Anda tetap dapat mengelola roster, afiliasi dan validasi melalui menu inti. Role admin tidak membuka berkas bantuan secara otomatis.'
                            : 'Anda tetap dapat mencari peluang melalui Proyek. Riwayat milik Anda dan pencabutan izin tetap tersedia jika sudah ada.'}
                    </p>
                </section>
            )}
        </div>
    );
}
