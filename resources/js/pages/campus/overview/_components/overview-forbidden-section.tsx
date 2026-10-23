import { ShieldCheck } from 'lucide-react';

export function OverviewForbiddenSection() {
    return (
        <section className="rounded-3xl border border-border bg-white p-6 shadow-sm">
            <ShieldCheck aria-hidden="true" className="size-8 text-primary" />
            <h2 className="mt-4 text-xl font-semibold">
                Akses ringkasan tidak tersedia
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Data sebelumnya disembunyikan. Periksa kembali akses operator
                pada kampus ini dengan memuat ulang.
            </p>
        </section>
    );
}
