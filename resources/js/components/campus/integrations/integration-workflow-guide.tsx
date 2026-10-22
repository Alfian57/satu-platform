import { CampusTechnicalDetails } from '@/components/campus-operation-layout';

export function IntegrationWorkflowGuide() {
    return (
        <CampusTechnicalDetails title="Kapan memilih Ulangi atau Rekonsiliasi?">
            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <p className="font-semibold text-foreground">
                        Ulangi pengiriman
                    </p>
                    <p className="mt-1">
                        Mengantrekan kembali payload yang sama sesuai status
                        yang diizinkan. Hasil akhir tetap mengikuti respons
                        penyedia.
                    </p>
                </div>
                <div>
                    <p className="font-semibold text-foreground">
                        Rekonsiliasi manual
                    </p>
                    <p className="mt-1">
                        Mencatat bahwa masalah sudah diselesaikan secara manual.
                        Wajib menyertakan alasan, bukan mengirim ulang payload.
                    </p>
                </div>
            </div>
        </CampusTechnicalDetails>
    );
}
