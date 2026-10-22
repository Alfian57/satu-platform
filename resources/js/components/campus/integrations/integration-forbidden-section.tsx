import { ShieldAlert } from 'lucide-react';

export function IntegrationForbiddenSection() {
    return (
        <section
            data-test="integrations-forbidden"
            className="rounded-3xl border border-correction/30 bg-correction-subtle p-5"
        >
            <ShieldAlert
                aria-hidden="true"
                className="size-6 text-correction-subtle-foreground"
            />
            <h2 className="mt-3 text-lg font-bold">
                Akses integrasi akademik tidak tersedia
            </h2>
            <p className="mt-2 text-sm leading-6 text-correction-subtle-foreground">
                Periksa akses Admin Universitas. Data sebelumnya tidak
                ditampilkan selama akses tidak tersedia.
            </p>
        </section>
    );
}
