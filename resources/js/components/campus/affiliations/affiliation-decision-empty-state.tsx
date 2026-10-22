import { UserRoundCheck } from 'lucide-react';

export function AffiliationDecisionEmptyState() {
    return (
        <section className="rounded-3xl border border-primary/15 bg-linear-to-br from-accent/60 to-white p-4 shadow-sm sm:p-5">
            <span className="flex size-10 items-center justify-center rounded-xl bg-white text-primary">
                <UserRoundCheck aria-hidden="true" className="size-5" />
            </span>
            <h2 id="decision-title" className="mt-3 text-lg font-bold">
                Mulai dari satu berkas
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Pilih Tinjau berkas untuk mengambil kunci. Setelah itu, periksa
                data sebelum memilih keputusan.
            </p>
            <ol className="mt-3 space-y-2 border-t border-border pt-3 text-xs leading-5 text-muted-foreground">
                {[
                    'Ambil kunci berkas.',
                    'Cocokkan NIM dan nomor WhatsApp dengan data mahasiswa.',
                    'Simpan keputusan beserta alasan.',
                ].map((step, index) => (
                    <li key={step} className="flex gap-2">
                        <span className="font-label font-semibold text-primary">
                            {index + 1}.
                        </span>
                        {step}
                    </li>
                ))}
            </ol>
        </section>
    );
}
