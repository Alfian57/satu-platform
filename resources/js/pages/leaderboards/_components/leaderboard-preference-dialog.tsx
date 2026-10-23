import { CircleAlert, LockKeyhole, ShieldCheck } from 'lucide-react';
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
import { Spinner } from '@/components/ui/spinner';
import { LeaderboardNotice } from '@/pages/leaderboards/_components/leaderboard-notice';

export interface LeaderboardPreferenceDialogProps {
    open: boolean;
    preferenceIntent: boolean | null;
    preferenceError: string | null;
    pendingPreference: boolean;
    needsPreferenceCheck: boolean;
    institutionName?: string | null;
    preferenceErrorRef: React.RefObject<HTMLDivElement | null>;
    returnFocusRef: React.RefObject<HTMLElement | null>;
    onOpenChange: (open: boolean) => void;
    onSubmit: (isOptedIn: boolean) => void;
}

export function LeaderboardPreferenceDialog({
    open,
    preferenceIntent,
    preferenceError,
    pendingPreference,
    needsPreferenceCheck,
    institutionName,
    preferenceErrorRef,
    returnFocusRef,
    onOpenChange,
    onSubmit,
}: LeaderboardPreferenceDialogProps) {
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
                        <LockKeyhole aria-hidden="true" className="size-6" />
                    </span>
                    <DialogTitle>
                        {preferenceIntent
                            ? 'Tampilkan peringkat individual?'
                            : 'Tarik persetujuan individual?'}
                    </DialogTitle>
                    <DialogDescription>
                        {preferenceIntent
                            ? 'Baca informasi yang akan terlihat sebelum menentukan pilihan.'
                            : 'Kamu tetap memiliki kendali atas visibilitas peringkatmu.'}
                    </DialogDescription>
                </DialogHeader>
                {preferenceIntent ? (
                    <div className="grid min-w-0 gap-4 text-sm leading-6">
                        <div className="rounded-2xl border border-primary/15 bg-linear-to-br from-card to-accent/60 p-4">
                            <h3 className="font-semibold">
                                Yang akan terlihat
                            </h3>
                            <p className="mt-2 text-muted-foreground">
                                Nama, peringkat, total XP terverifikasi, dan
                                jumlah anggota pembagi. Dapat dibaca mahasiswa
                                yang telah memberi persetujuan individual di{' '}
                                {institutionName ?? 'kampus yang sama'}.
                            </p>
                        </div>
                        <div>
                            <h3 className="flex items-center gap-2 font-semibold">
                                <ShieldCheck
                                    aria-hidden="true"
                                    className="size-4 shrink-0 text-primary"
                                />
                                Data privat tetap terlindungi
                            </h3>
                            <p className="mt-2 text-muted-foreground">
                                Bukti privat, isi diskusi, dan catatan audit
                                tidak masuk peringkat. Pengaturan ini tidak
                                mengubah jangkauan Portofolio.
                            </p>
                        </div>
                        <p className="border-t border-border pt-4 text-muted-foreground">
                            Kamu dapat menarik persetujuan kapan saja. Baris
                            peringkat muncul jika hasil perhitungan
                            terverifikasi sudah tersedia.
                        </p>
                    </div>
                ) : (
                    <LeaderboardNotice title="XP dan badge tetap tersimpan">
                        <p>
                            Baris individual tidak akan ditampilkan pada
                            pembacaan berikutnya. Penarikan tidak menghapus XP
                            atau badge milikmu, dan tidak menutup akses ke
                            peringkat program studi atau tim.
                        </p>
                    </LeaderboardNotice>
                )}
                {preferenceError && (
                    <div
                        ref={preferenceErrorRef}
                        tabIndex={-1}
                        role="alert"
                        data-test="leaderboard-preference-error"
                        className="flex min-w-0 items-start gap-3 rounded-2xl border border-correction/30 bg-correction-subtle p-4 text-sm leading-6 text-correction-subtle-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                        <CircleAlert
                            aria-hidden="true"
                            className="mt-1 size-4 shrink-0"
                        />
                        <p>{preferenceError}</p>
                    </div>
                )}
                <p
                    role="status"
                    aria-live="polite"
                    className="min-h-5 text-xs leading-5 text-muted-foreground"
                    data-test="leaderboard-preference-dialog-processing"
                >
                    {pendingPreference ? 'Menyimpan pilihanmu...' : ''}
                </p>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" className="min-h-11">
                            {preferenceIntent
                                ? 'Belum sekarang'
                                : 'Tetap tampil'}
                        </Button>
                    </DialogClose>
                    <Button
                        variant={preferenceIntent ? 'default' : 'destructive'}
                        className="min-h-11"
                        disabled={pendingPreference || needsPreferenceCheck}
                        onClick={() => onSubmit(preferenceIntent === true)}
                        data-test={
                            preferenceIntent
                                ? 'leaderboard-opt-in-confirm'
                                : 'leaderboard-withdraw-confirm'
                        }
                    >
                        {pendingPreference && (
                            <Spinner
                                aria-hidden="true"
                                className="motion-reduce:animate-none"
                            />
                        )}
                        {preferenceIntent
                            ? 'Setujui dan tampilkan'
                            : 'Tarik persetujuan'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
