import { UserRoundCheck } from 'lucide-react';

export function ContributionDetailEmpty() {
    return (
        <aside
            aria-labelledby="campus-review-decision-title"
            className="order-last min-w-0"
        >
            <div className="grid justify-items-center gap-3 rounded-3xl border border-border bg-white p-8 text-center shadow-sm xl:sticky xl:top-6">
                <div className="flex size-12 items-center justify-center rounded-3xl bg-accent/70 text-primary">
                    <UserRoundCheck aria-hidden="true" className="size-6" />
                </div>
                <h2 className="text-base font-bold text-foreground">
                    Pilih kontribusi untuk ditinjau
                </h2>
                <p className="text-xs leading-relaxed text-muted-foreground">
                    Klik salah satu baris kontribusi untuk memeriksa deskripsi
                    tugas, klaim hasil, dan tautan bukti privat.
                </p>
            </div>
        </aside>
    );
}
