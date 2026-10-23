import { BookOpenCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    formatLeaderboardDate,
    formatNumber,
    formatScore,
} from '@/pages/leaderboards/_components/leaderboard-formatters';
import { LeaderboardNotice } from '@/pages/leaderboards/_components/leaderboard-notice';
import type { LeaderboardPageData, LeaderboardRow } from '@/types/leaderboard';

export interface LeaderboardExplanationDialogProps {
    open: boolean;
    explanationRow: LeaderboardRow | null;
    selectedCategoryLabel: string;
    semester: string | null;
    period: LeaderboardPageData['period'];
    returnFocusRef: React.RefObject<HTMLElement | null>;
    onOpenChange: (open: boolean) => void;
}

export function LeaderboardExplanationDialog({
    open,
    explanationRow,
    selectedCategoryLabel,
    semester,
    period,
    returnFocusRef,
    onOpenChange,
}: LeaderboardExplanationDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="min-w-0 [overflow-wrap:anywhere]"
                onCloseAutoFocus={(event) => {
                    event.preventDefault();
                    returnFocusRef.current?.focus();
                }}
            >
                <DialogHeader>
                    <span className="mb-2 grid size-12 place-items-center rounded-2xl bg-accent text-primary">
                        <BookOpenCheck aria-hidden="true" className="size-6" />
                    </span>
                    <DialogTitle>Penjelasan perhitungan</DialogTitle>
                    <DialogDescription>
                        Baca dasar angka dari snapshot server, tanpa membuka
                        data privat.
                    </DialogDescription>
                </DialogHeader>
                {explanationRow && (
                    <div className="grid min-w-0 gap-4">
                        <div className="rounded-2xl border border-primary/15 bg-linear-to-br from-card to-accent/60 p-4">
                            <h3 className="text-lg leading-7 font-bold tracking-tight">
                                {explanationRow.scopeLabel ??
                                    'Nama belum tersedia'}
                            </h3>
                            <p className="mt-2 text-xs leading-6 text-muted-foreground">
                                {selectedCategoryLabel}.{' '}
                                {semester || 'Semester belum tersedia'}.
                            </p>
                            {!explanationRow.suppressed && (
                                <p className="mt-2 text-sm font-medium">
                                    Peringkat{' '}
                                    {explanationRow.rank === null
                                        ? 'belum tersedia'
                                        : formatNumber(explanationRow.rank)}
                                    {explanationRow.sharedRankGroup !== null &&
                                        '. Peringkat sama dengan skor setara.'}
                                </p>
                            )}
                        </div>
                        {explanationRow.suppressed ? (
                            <LeaderboardNotice
                                tone="warning"
                                title="Angka kelompok dilindungi"
                            >
                                <p>
                                    {explanationRow.suppressionReason ===
                                    'cohort_below_minimum'
                                        ? 'Kelompok belum memenuhi minimum lima anggota aktif. Skor dan total XP tidak ditampilkan.'
                                        : 'Angka ditahan sampai memenuhi aturan publikasi.'}{' '}
                                    Jumlah anggota:{' '}
                                    {formatNumber(explanationRow.cohortSize)}.
                                </p>
                            </LeaderboardNotice>
                        ) : (
                            <>
                                <dl className="grid min-w-0 gap-3 text-sm">
                                    {[
                                        {
                                            label:
                                                explanationRow.scopeType ===
                                                'individual'
                                                    ? 'Total XP (skor)'
                                                    : 'Rata-rata XP (skor)',
                                            value:
                                                formatScore(
                                                    explanationRow.score,
                                                ) + ' XP',
                                        },
                                        {
                                            label: 'Total XP terverifikasi',
                                            value:
                                                formatNumber(
                                                    explanationRow.verifiedXpTotal,
                                                ) + ' XP',
                                        },
                                        {
                                            label: 'Anggota aktif pembagi',
                                            value:
                                                formatNumber(
                                                    explanationRow.activeMemberDenominator,
                                                ) + ' anggota',
                                        },
                                    ].map((item) => (
                                        <div
                                            key={item.label}
                                            className="grid min-w-0 gap-1 border-b border-border pb-3 sm:grid-cols-2"
                                        >
                                            <dt className="text-muted-foreground">
                                                {item.label}
                                            </dt>
                                            <dd className="min-w-0 font-label text-sm leading-6 font-semibold [overflow-wrap:anywhere] tabular-nums sm:text-right">
                                                {item.value}
                                            </dd>
                                        </div>
                                    ))}
                                </dl>
                                <p className="border-t border-border pt-4 text-xs leading-6 text-muted-foreground">
                                    {explanationRow.scopeType === 'individual'
                                        ? 'Skor individual adalah total XP terverifikasi. Tidak memakai minimum kelompok lima anggota.'
                                        : 'Total XP terverifikasi dibagi anggota aktif menghasilkan skor kelompok. Anggota aktif bukan jumlah seluruh mahasiswa kampus.'}
                                </p>
                            </>
                        )}
                        <div className="grid min-w-0 gap-2 text-xs leading-6 text-muted-foreground">
                            <p>
                                Versi aturan:{' '}
                                {period?.ruleVersion ?? 'belum tersedia'}.
                            </p>
                            <p>
                                Dihitung{' '}
                                {formatLeaderboardDate(
                                    period?.computedAt ?? null,
                                )}
                                .
                            </p>
                            {period?.isStale && (
                                <p className="font-medium text-pending-subtle-foreground">
                                    Snapshot menunggu perhitungan ulang.
                                </p>
                            )}
                        </div>
                    </div>
                )}
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" className="min-h-11">
                            Tutup penjelasan
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
