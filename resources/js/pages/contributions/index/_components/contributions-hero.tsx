import { Link } from '@inertiajs/react';
import { FileText, Plus, RefreshCw, ShieldCheck } from 'lucide-react';
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
        <StudentMenuHero
            theme="contributions"
            icon={FileText}
            eyebrow="Catatan kontribusimu"
            title="Pekerjaanmu punya cerita."
            description="Catat bagian yang kamu kerjakan, sertakan bukti, lalu ikuti proses validasi kampus."
            pose="contribution-notes"
            testId="contributions-header"
            note={
                <p className="flex min-w-0 items-start gap-2">
                    <ShieldCheck
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0 text-primary"
                    />
                    <span>
                        Bukti privat tetap mengikuti izin akses proyek dan
                        validasi kampus.
                    </span>
                </p>
            }
        >
            {canCreate && !isForbidden && (
                <Button
                    asChild
                    className="student-menu-hero__primary min-h-11 rounded-xl px-4"
                >
                    <Link
                        href={contributionsCreate()}
                        data-test="create-contribution-link"
                    >
                        <Plus aria-hidden="true" />
                        Susun kontribusi
                    </Link>
                </Button>
            )}
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
        </StudentMenuHero>
    );
}
