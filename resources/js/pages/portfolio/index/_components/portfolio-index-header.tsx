import { Link } from '@inertiajs/react';
import { ArrowRight, BookOpenCheck, Eye, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StudentMenuHero from '@/layouts/_components/student-menu-hero';
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
        <div className="grid gap-4">
            <StudentMenuHero
                theme="portfolio"
                icon={BookOpenCheck}
                eyebrow="Portofolio mahasiswa"
                title="Karyamu, ceritamu."
                description="Karya dari kontribusi yang disetujui kampus terkumpul di sini. Kamu menentukan siapa yang boleh melihatnya."
                pose="portfolio-showcase"
                testId="portfolio-header"
            />
            <div
                className="flex flex-wrap items-center justify-between gap-3"
                data-test="portfolio-action-bar"
            >
                <div className="flex flex-wrap items-center gap-2.5">
                    {!isForbidden && resolvedProfile && canManage && (
                        <Button
                            asChild
                            variant="outline"
                            className="min-h-11 bg-card"
                            data-test="portfolio-profile-jump"
                        >
                            <a href="#portfolio-profile-title">
                                <Eye aria-hidden="true" className="size-4" />
                                Kendali profil
                            </a>
                        </Button>
                    )}
                    {!isForbidden && profile && (
                        <Button
                            asChild
                            className="student-menu-hero__primary min-h-11"
                        >
                            <Link href={contributionsIndex()}>
                                Lihat kontribusi
                                <ArrowRight
                                    aria-hidden="true"
                                    className="size-4"
                                />
                            </Link>
                        </Button>
                    )}
                </div>
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
            </div>
        </div>
    );
}
