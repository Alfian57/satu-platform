import { FileCheck2, ShieldCheck } from 'lucide-react';
import { PortfolioPrivacyNote } from '@/components/portfolio/portfolio-privacy-note';
import { PortfolioVisibilitySettings } from '@/components/portfolio/portfolio-visibility-settings';
import type { PortfolioProfile } from '@/types/portfolio';

export interface PortfolioIndexAsideProps {
    resolvedProfile: PortfolioProfile | null;
    canManage: boolean;
    onProfileUpdated: (profile: PortfolioProfile) => void;
    onAccessRevoked: () => void;
}

export function PortfolioIndexAside({
    resolvedProfile,
    canManage,
    onProfileUpdated,
    onAccessRevoked,
}: PortfolioIndexAsideProps) {
    return (
        <aside
            className="grid min-w-0 content-start gap-5"
            aria-label="Pengaturan portofolio"
        >
            {resolvedProfile && canManage ? (
                <PortfolioVisibilitySettings
                    key={resolvedProfile.id}
                    profile={resolvedProfile}
                    onUpdated={onProfileUpdated}
                    onAccessRevoked={onAccessRevoked}
                />
            ) : (
                <PortfolioPrivacyNote />
            )}
            <section className="grid min-w-0 gap-4 border-t border-border px-1 pt-5">
                <div className="flex items-center gap-2 text-sm font-semibold">
                    <FileCheck2
                        aria-hidden="true"
                        className="size-4 shrink-0 text-primary"
                    />
                    Karya punya sumber yang jelas.
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                    Karya berasal dari kontribusi yang disetujui kampus.
                    Verifikasi tidak otomatis membuatnya terbuka untuk semua
                    orang.
                </p>
                <p className="flex items-start gap-2 border-t border-primary/10 pt-4 text-xs leading-5 text-muted-foreground">
                    <ShieldCheck
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0"
                    />
                    Bukti privat dan catatan kampus tidak ikut ditampilkan di
                    portofolio publik.
                </p>
            </section>
        </aside>
    );
}
