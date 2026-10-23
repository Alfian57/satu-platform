import { Link } from '@inertiajs/react';
import { FileText, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StudentMenuHero from '@/layouts/_components/student-menu-hero';
import { cn } from '@/lib/utils';
import { create as contributionsCreate } from '@/routes/contributions';

export interface ContributionsHeroProps {
    canCreate: boolean;
    isForbidden: boolean;
    isRefreshing: boolean;
    onRefresh: () => void;
}

export function ContributionsHero({
    canCreate,
    isForbidden,
    isRefreshing,
    onRefresh,
}: ContributionsHeroProps) {
    return (
        <div className="grid gap-4">
            <StudentMenuHero
                theme="contributions"
                icon={FileText}
                eyebrow="Catatan kontribusimu"
                title="Pekerjaanmu punya cerita."
                description="Catat bagian yang kamu kerjakan, sertakan bukti, lalu ikuti proses validasi kampus."
                pose="contribution-notes"
                testId="contributions-header"
            />
            <div
                className="flex flex-wrap items-center justify-between gap-3"
                data-test="contributions-action-bar"
            >
                <div>
                    {canCreate && !isForbidden && (
                        <Button
                            asChild
                            className="student-menu-hero__primary min-h-11 rounded-xl px-4"
                            data-test="create-contribution-link"
                        >
                            <Link href={contributionsCreate()}>
                                <Plus aria-hidden="true" />
                                Susun kontribusi
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
                    data-test="contributions-refresh"
                >
                    <RefreshCw
                        aria-hidden="true"
                        className={cn(
                            isRefreshing &&
                                'animate-spin motion-reduce:animate-none',
                        )}
                    />
                    Muat ulang
                </Button>
            </div>
        </div>
    );
}
