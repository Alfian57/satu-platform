import { BookOpenCheck, LockKeyhole, RefreshCw, Users } from 'lucide-react';
import { CampusOperationHeader } from '@/components/campus-operation-layout';
import StudentMenuHero from '@/components/student-menu-hero';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
        <StudentMenuHero
            theme="rankings"
            icon={BookOpenCheck}
            eyebrow="Peringkat kontribusi"
            title="Konteks, bukan sekadar angka."
            description="Bandingkan kontribusi terverifikasi berdasarkan kelompok dan semester, dengan dasar perhitungan yang transparan."
            pose="ranking-context"
            testId="leaderboard-header"
            note={
                <p className="flex min-w-0 items-start gap-2">
                    <Users
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0 text-primary"
                    />
                    <span>
                        Peringkat dihitung dari kontribusi terverifikasi per
                        anggota aktif. Bukan ukuran kemampuan seluruh mahasiswa.
                    </span>
                </p>
            }
        >
            <Button asChild variant="outline" className="min-h-11 bg-card">
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
        </StudentMenuHero>
    );
}
