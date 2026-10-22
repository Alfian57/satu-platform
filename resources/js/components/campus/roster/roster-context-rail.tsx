import { ShieldCheck } from 'lucide-react';
import { CampusWorkflowGuide } from '@/components/campus-operation-layout';

export function RosterContextRail() {
    return (
        <CampusWorkflowGuide
            title="Dari berkas ke roster aktif"
            steps={[
                {
                    title: 'Unggah berkas',
                    description: 'Pilih CSV dan isi label semester.',
                },
                {
                    title: 'Periksa pratinjau',
                    description:
                        'Cek data mahasiswa dan baris yang bermasalah.',
                },
                {
                    title: 'Impor setelah sesuai',
                    description:
                        'Impor baris valid. Riwayat roster tetap tersimpan.',
                },
            ]}
        >
            <p className="flex items-start gap-2">
                <ShieldCheck
                    aria-hidden="true"
                    className="mt-1 size-4 shrink-0 text-primary"
                />
                Nomor WhatsApp tidak ditampilkan dalam pratinjau.
            </p>
        </CampusWorkflowGuide>
    );
}
