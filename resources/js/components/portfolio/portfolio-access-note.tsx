import { LockKeyhole } from 'lucide-react';

export function PortfolioAccessNote() {
    return (
        <section className="grid min-w-0 gap-4 border-t border-border px-1 pt-5">
            <div className="flex items-start gap-3">
                <LockKeyhole
                    aria-hidden="true"
                    className="mt-1 size-5 shrink-0 text-primary"
                />
                <div className="grid gap-2">
                    <h2 className="text-title font-semibold">
                        Informasi yang diizinkan.
                    </h2>
                    <p className="text-sm leading-6 text-muted-foreground">
                        Kamu membaca rincian karya yang tersedia sesuai izin
                        akses. Pengaturan jangkauan tetap dikelola pemilik.
                    </p>
                </div>
            </div>
        </section>
    );
}
