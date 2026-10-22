import { ShieldCheck } from 'lucide-react';
import { PortfolioAccessNote } from '@/components/portfolio/portfolio-access-note';
import { PortfolioVisibilitySettings } from '@/components/portfolio/portfolio-visibility-settings';
import type { PortfolioProfile } from '@/types/portfolio';

export interface PortfolioShowAsideProps {
    resolvedProfile: PortfolioProfile | null;
    canManageProfile: boolean;
    onProfileUpdated: (profile: PortfolioProfile) => void;
    onAccessRevoked: () => void;
}

export function PortfolioShowAside({
    resolvedProfile,
    canManageProfile,
    onProfileUpdated,
    onAccessRevoked,
}: PortfolioShowAsideProps) {
    return (
        <aside
            className="grid min-w-0 content-start gap-5"
            aria-label="Pengaturan profil dan batas berbagi"
        >
            {resolvedProfile && canManageProfile ? (
                <PortfolioVisibilitySettings
                    key={resolvedProfile.id}
                    profile={resolvedProfile}
                    onUpdated={onProfileUpdated}
                    onAccessRevoked={onAccessRevoked}
                />
            ) : (
                <PortfolioAccessNote />
            )}
            <div className="flex items-start gap-3 border-t border-border px-1 pt-5 text-sm leading-6 text-muted-foreground">
                <ShieldCheck
                    aria-hidden="true"
                    className="mt-1 size-5 shrink-0 text-primary"
                />
                <p>
                    Pengaturan profil tidak menggantikan jangkauan setiap karya.
                    Publikasi juga tidak otomatis membuka bukti privat.
                </p>
            </div>
        </aside>
    );
}
