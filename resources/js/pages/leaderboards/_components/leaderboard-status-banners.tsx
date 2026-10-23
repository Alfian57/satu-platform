import { Button } from '@/components/ui/button';
import { LeaderboardNotice } from '@/pages/leaderboards/_components/leaderboard-notice';

export interface LeaderboardStatusBannersProps {
    feedback: string | null;
    needsCheck: boolean;
    loadError: string | null;
    busy: boolean;
    onRetry: () => void;
}

export function LeaderboardStatusBanners({
    feedback,
    needsCheck,
    loadError,
    busy,
    onRetry,
}: LeaderboardStatusBannersProps) {
    return (
        <>
            {feedback && (
                <div data-test="leaderboard-preference-success">
                    <LeaderboardNotice
                        tone="info"
                        title="Persetujuan berhasil diubah"
                    >
                        <p>{feedback}</p>
                    </LeaderboardNotice>
                </div>
            )}

            {needsCheck && (
                <div data-test="leaderboard-preference-check">
                    <LeaderboardNotice
                        tone="warning"
                        title="Periksa status persetujuan"
                    >
                        <p>
                            Persetujuan belum dapat dikonfirmasi. Muat ulang
                            untuk memastikan data terbaru sebelum mencoba
                            kembali.
                        </p>
                        <Button
                            type="button"
                            variant="outline"
                            className="mt-3 min-h-11 bg-card"
                            onClick={onRetry}
                            disabled={busy}
                        >
                            Muat ulang sekarang
                        </Button>
                    </LeaderboardNotice>
                </div>
            )}

            {loadError && (
                <div data-test="leaderboard-preference-command-error">
                    <LeaderboardNotice
                        tone="error"
                        title="Gagal memperbarui tampilan"
                    >
                        <p>{loadError}</p>
                    </LeaderboardNotice>
                </div>
            )}
        </>
    );
}
