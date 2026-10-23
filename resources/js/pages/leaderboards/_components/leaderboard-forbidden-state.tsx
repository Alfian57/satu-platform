import { Link } from '@inertiajs/react';
import { LockKeyhole, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { CampusOperationHeader } from '@/pages/campus/_components/campus-operation-layout';
import { LeaderboardNotice } from '@/pages/leaderboards/_components/leaderboard-notice';
import { dashboard } from '@/routes';

export interface LeaderboardForbiddenStateProps {
    isAdmin: boolean;
    loadError: string | null;
    busy: boolean;
    onRetry: () => void;
}

export function LeaderboardForbiddenState({
    isAdmin,
    loadError,
    busy,
    onRetry,
}: LeaderboardForbiddenStateProps) {
    return (
        <div className="grid w-full min-w-0 gap-6" data-test="leaderboard-root">
            {isAdmin ? (
                <CampusOperationHeader
                    theme="rankings"
                    icon={LockKeyhole}
                    title="Peringkat belum tersedia."
                    description="Akses Peringkat tidak tersedia. Hasil sebelumnya tidak ditampilkan. Periksa akses dan muat ulang setelah tersedia."
                    institution={null}
                    testId="leaderboard-header"
                />
            ) : (
                <header className="grid min-w-0 gap-4 rounded-4xl border border-white bg-linear-to-br from-accent via-card to-background p-5 shadow-md sm:p-7">
                    <LockKeyhole
                        aria-hidden="true"
                        className="size-10 text-primary"
                    />
                    <p className="text-sm font-semibold text-primary">
                        Akses kampus
                    </p>
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                        Peringkat belum tersedia.
                    </h1>
                    <p className="max-w-prose text-sm leading-7 text-muted-foreground">
                        Peringkat hanya tersedia bagi anggota kampus dengan
                        akses yang terverifikasi. Hasil sebelumnya tidak
                        ditampilkan.
                    </p>
                </header>
            )}
            <LeaderboardNotice tone="warning" title="Periksa akses kampus">
                <p>
                    {loadError ??
                        'Periksa status afiliasi di Beranda, lalu muat ulang setelah akses tersedia.'}
                </p>
            </LeaderboardNotice>
            <div className="flex flex-wrap gap-3">
                <Button asChild variant="outline" className="min-h-11">
                    <Link href={dashboard()}>Kembali ke Beranda</Link>
                </Button>
                <Button
                    onClick={onRetry}
                    disabled={busy}
                    className="min-h-11"
                    data-test="leaderboard-retry"
                >
                    {busy ? (
                        <Spinner
                            aria-hidden="true"
                            className="motion-reduce:animate-none"
                        />
                    ) : (
                        <RefreshCw aria-hidden="true" />
                    )}
                    Muat ulang
                </Button>
            </div>
        </div>
    );
}
