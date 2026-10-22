import { ShieldAlert } from 'lucide-react';
import { CampusWorkflowGuide } from '@/components/campus-operation-layout';

export function InclusionInactiveState({
    accessUnavailable,
}: {
    accessUnavailable: boolean;
}) {
    return (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <section className="rounded-3xl border border-border bg-white p-5 shadow-sm">
                <ShieldAlert
                    aria-hidden="true"
                    className="size-8 text-pending-subtle-foreground"
                />
                <h2 className="mt-4 text-xl font-bold">
                    {accessUnavailable
                        ? 'Akses peninjauan tidak tersedia'
                        : 'Fitur peninjauan belum aktif'}
                </h2>
                <p className="mt-2 max-w-[65ch] text-sm leading-6 text-muted-foreground">
                    {accessUnavailable
                        ? 'Data sebelumnya disembunyikan. Periksa izin peninjauan sebelum memuat ulang.'
                        : 'Antrean dan keputusan tidak tersedia saat fitur nonaktif. Penggunaan data nyata memerlukan persetujuan tata kelola dan otorisasi. Demonstrasi sintetis tidak menggantikan persetujuan tersebut.'}
                </p>
            </section>
            <CampusWorkflowGuide
                title="Batas peninjauan"
                steps={[
                    {
                        title: 'Baca konteks',
                        description:
                            'Kecukupan data dan versi sumber harus jelas sebelum menyimpulkan.',
                    },
                    {
                        title: 'Catat alasan faktual',
                        description:
                            'Hindari bahasa diagnostik atau stigmatisasi.',
                    },
                    {
                        title: 'Dukungan oleh manusia',
                        description:
                            'Mencatat tindakan tidak mengirim kontak atau melakukan eskalasi otomatis.',
                    },
                ]}
            />
        </div>
    );
}
