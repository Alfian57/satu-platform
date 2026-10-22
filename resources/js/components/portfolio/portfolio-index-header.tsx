import { Link } from '@inertiajs/react';
import {
    ArrowRight,
    BookOpenCheck,
    Eye,
    FolderOpen,
    RefreshCw,
} from 'lucide-react';
import StudentMenuHero from '@/components/student-menu-hero';
import { Button } from '@/components/ui/button';
import { index as contributionsIndex } from '@/routes/contributions';
import type { PortfolioProfile } from '@/types/portfolio';

export interface PortfolioIndexHeaderProps {
    isForbidden: boolean;
    resolvedProfile: PortfolioProfile | null;
    profile: PortfolioProfile | null;
    canManage: boolean;
    isRefreshing: boolean;
    onRefresh: () => void;
}

export function PortfolioIndexHeader({
    isForbidden,
    resolvedProfile,
    profile,
    canManage,
    isRefreshing,
    onRefresh,
}: PortfolioIndexHeaderProps) {
    return (
        <StudentMenuHero
            theme="portfolio"
            icon={BookOpenCheck}
            eyebrow="Portofolio mahasiswa"
            title="Karyamu, ceritamu."
            description="Karya dari kontribusi yang disetujui kampus terkumpul di sini. Kamu menentukan siapa yang boleh melihatnya."
            pose="portfolio-showcase"
            testId="portfolio-header"
            note={
                <p className="flex min-w-0 items-start gap-2">
                    <FolderOpen
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0 text-primary"
                    />
                    <span className="min-w-0 wrap-anywhere">
                        {!isForbidden && resolvedProfile
                            ? resolvedProfile.institution.name
                            : 'Karya dari kontribusi yang disetujui kampus'}
                    </span>
                </p>
            }
        >
            {!isForbidden && resolvedProfile && canManage && (
                <Button asChild variant="outline" className="min-h-11 bg-card">
                    <a
                        href="#portfolio-profile-title"
                        data-test="portfolio-profile-jump"
                    >
                        <Eye aria-hidden="true" />
                        Kendali profil
                    </a>
                </Button>
            )}
            {!isForbidden && profile && (
                <Button asChild className="student-menu-hero__primary min-h-11">
                    <Link href={contributionsIndex()}>
                        Lihat kontribusi
                        <ArrowRight aria-hidden="true" />
                    </Link>
                </Button>
            )}
            <Button
                type="button"
                variant="outline"
                className="min-h-11 bg-card"
                onClick={onRefresh}
                disabled={isRefreshing}
                data-test="portfolio-refresh"
            >
                <RefreshCw
                    aria-hidden="true"
                    className={
                        isRefreshing
                            ? 'animate-spin motion-reduce:animate-none'
                            : ''
                    }
                />
                Muat ulang
            </Button>
        </StudentMenuHero>
    );
}
