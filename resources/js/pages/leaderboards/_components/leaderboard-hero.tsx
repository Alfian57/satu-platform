import { BookOpenCheck, LockKeyhole, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StudentMenuHero from '@/layouts/_components/student-menu-hero';
import { cn } from '@/lib/utils';
import { CampusOperationHeader } from '@/pages/campus/_components/campus-operation-layout';

export interface LeaderboardHeroProps {
    isAdmin: boolean;
    institutionName?: string | null;
    busy: boolean;
    individual: boolean;
    onRefresh: () => void;
    onOpenPreference: () => void;
}

export function LeaderboardHero({
    isAdmin,
    institutionName,
    busy,
    individual,
    onRefresh,
    onOpenPreference,
}: LeaderboardHeroProps) {
    if (isAdmin) {
        return (
            <CampusOperationHeader
                theme="rankings"
                icon={BookOpenCheck}
                title="Peringkat kontribusi"
                description="Tinjau XP kontribusi terverifikasi per kelompok, semester dan dasar perhitungannya. Peringkat bukan penilaian kemampuan seluruh mahasiswa."
                institution={institutionName ?? null}
                testId="leaderboard-header"
            >
                <Button asChild variant="outline" className="min-h-11 bg-card">
                    <a href="#leaderboard-method">
                        <BookOpenCheck aria-hidden="true" />
                        Lihat panduan
                    </a>
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    className="min-h-11 bg-card"
                    onClick={onRefresh}
                    disabled={busy}
                    data-test="leaderboard-refresh"
                >
                    <RefreshCw
                        aria-hidden="true"
                        className={cn(
                            busy && 'animate-spin motion-reduce:animate-none',
                        )}
                    />
                    Muat ulang
                </Button>
            </CampusOperationHeader>
        );
    }

    return (
        <div className="grid gap-4">
            <StudentMenuHero
                theme="rankings"
                icon={BookOpenCheck}
                eyebrow="Peringkat kontribusi"
                title="Konteks, bukan sekadar angka."
                description="Bandingkan kontribusi terverifikasi berdasarkan kelompok dan semester, dengan dasar perhitungan yang transparan."
                pose="ranking-context"
                testId="leaderboard-header"
            />
            <div
                className="flex flex-wrap items-center justify-between gap-3"
                data-test="leaderboard-action-bar"
            >
                <div className="flex flex-wrap items-center gap-2.5">
                    <Button
                        asChild
                        variant="outline"
                        className="min-h-11 bg-card"
                    >
                        <a href="#leaderboard-method">
                            <BookOpenCheck aria-hidden="true" />
                            Lihat panduan
                        </a>
                    </Button>
                    {individual && (
                        <Button
                            type="button"
                            variant="outline"
                            className="min-h-11 bg-card"
                            onClick={onOpenPreference}
                            data-test="leaderboard-individual-settings"
                        >
                            <LockKeyhole aria-hidden="true" />
                            Pengaturan individual
                        </Button>
                    )}
                </div>
                <Button
                    type="button"
                    variant="outline"
                    className="min-h-11 bg-card"
                    onClick={onRefresh}
                    disabled={busy}
                    data-test="leaderboard-refresh"
                >
                    <RefreshCw
                        aria-hidden="true"
                        className={cn(
                            busy && 'animate-spin motion-reduce:animate-none',
                        )}
                    />
                    Muat ulang
                </Button>
            </div>
        </div>
    );
}
