import { LockKeyhole } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface LeaderboardConsentCardProps {
    isOptedIn: boolean;
    pending: boolean;
    savingPreference: boolean;
    onPreference: () => void;
}

export function LeaderboardConsentCard({
    isOptedIn,
    pending,
    savingPreference,
    onPreference,
}: LeaderboardConsentCardProps) {
    return (
        <section
            aria-labelledby="leaderboard-consent-title"
            className="grid min-w-0 scroll-mt-24 gap-4 rounded-3xl border border-primary/20 bg-linear-to-br from-card to-accent/60 p-5 shadow-md sm:p-6"
            data-test="leaderboard-consent"
        >
            <div className="flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent text-primary">
                    <LockKeyhole aria-hidden="true" className="size-5" />
                </span>
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-primary">
                        Pilihanmu
                    </p>
                    <h2
                        id="leaderboard-consent-title"
                        className="mt-1 text-title font-bold tracking-tight"
                    >
                        Peringkat individual
                    </h2>
                </div>
            </div>
            <Badge
                variant="outline"
                className="w-fit max-w-full border-primary/15 bg-accent whitespace-normal text-primary"
                data-test="leaderboard-preference-state"
            >
                {isOptedIn ? 'Persetujuan aktif' : 'Belum diaktifkan'}
            </Badge>
            <p className="text-sm leading-6 text-muted-foreground">
                {isOptedIn
                    ? 'Kamu mengizinkan namamu masuk peringkat individual. Baris muncul setelah data terverifikasi dihitung oleh sistem.'
                    : 'Namamu tidak masuk peringkat individual tanpa persetujuan. Program studi dan tim tetap dapat kamu baca.'}
            </p>
            <p
                role="status"
                aria-live="polite"
                className="min-h-5 text-xs leading-5 text-muted-foreground"
                data-test="leaderboard-preference-processing"
            >
                {savingPreference ? 'Menyimpan persetujuan...' : ''}
            </p>
            <Button
                type="button"
                variant={isOptedIn ? 'outline' : 'default'}
                className="min-h-11 w-full whitespace-normal"
                disabled={pending}
                onClick={onPreference}
                data-test="leaderboard-preference-action"
            >
                {savingPreference
                    ? 'Menyimpan persetujuan...'
                    : isOptedIn
                      ? 'Tarik persetujuan'
                      : 'Atur visibilitas individual'}
            </Button>
            <p className="border-t border-primary/10 pt-4 text-xs leading-5 text-muted-foreground">
                Pengaturan ini terpisah dari jangkauan Portofolio. XP dan badge
                tidak terhapus jika kamu menarik persetujuan.
            </p>
        </section>
    );
}
