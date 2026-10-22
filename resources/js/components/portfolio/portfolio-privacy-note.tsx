import { LockKeyhole } from 'lucide-react';

export function PortfolioPrivacyNote() {
    return (
        <section className="grid min-w-0 gap-4 border-t border-border px-1 pt-5">
            <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                    <LockKeyhole aria-hidden="true" className="size-5" />
                </span>
                <div className="grid gap-2">
                    <h2 className="text-title font-semibold">
                        Akses tetap terkendali.
                    </h2>
                    <p className="text-sm leading-6 text-muted-foreground">
                        Pengaturan tersedia bagi pemilik profil kampus yang siap
                        digunakan. Data privat tidak ditampilkan sebagai
                        pengganti.
                    </p>
                </div>
            </div>
        </section>
    );
}
