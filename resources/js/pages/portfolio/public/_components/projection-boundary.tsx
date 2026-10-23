import { BookOpenCheck } from 'lucide-react';
import type { PublicPortfolioProfile } from '@/types/portfolio';

export function ProjectionBoundary({
    profile,
}: {
    profile: PublicPortfolioProfile;
}) {
    return (
        <aside
            aria-labelledby="public-boundary-title"
            className="grid min-w-0 gap-4 rounded-2xl border border-white/80 bg-white/75 p-5 shadow-sm sm:p-6"
            data-test="public-projection-boundary"
        >
            <div className="flex items-center gap-2">
                <BookOpenCheck
                    aria-hidden="true"
                    className="size-5 shrink-0 text-primary"
                />
                <h2
                    id="public-boundary-title"
                    className="text-sm font-semibold [overflow-wrap:anywhere] text-primary"
                >
                    Dibagikan oleh pemilik
                </h2>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
                Halaman ini menampilkan karya yang dipilih Publik dan memiliki
                sumber kontribusi yang disetujui kampus.
            </p>
            <dl className="grid gap-3 border-t border-border pt-3 text-xs">
                <div className="grid gap-1">
                    <dt className="text-xs text-muted-foreground">Institusi</dt>
                    <dd className="font-semibold [overflow-wrap:anywhere]">
                        {profile.institution_name}
                    </dd>
                </div>
                <div className="grid gap-1">
                    <dt className="text-xs text-muted-foreground">
                        Batas data
                    </dt>
                    <dd className="font-semibold">
                        Tanpa bukti privat dan catatan kampus
                    </dd>
                </div>
            </dl>
        </aside>
    );
}
