import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { textAreaClassName } from '@/pages/contributions/_utils/contribution-helpers';

export interface ComposerNotesSectionProps {
    mode: 'create' | 'revision';
    claim: string;
    summary: string;
    processing: boolean;
    blocked: boolean;
    claimError?: string;
    summaryError?: string;
    onClaimChange: (claim: string) => void;
    onSummaryChange: (summary: string) => void;
}

export function ComposerNotesSection({
    mode,
    claim,
    summary,
    processing,
    blocked,
    claimError,
    summaryError,
    onClaimChange,
    onSummaryChange,
}: ComposerNotesSectionProps) {
    return (
        <section
            aria-labelledby={`contribution-${mode}-notes-title`}
            className="grid min-w-0 gap-5 rounded-3xl border border-primary/20 bg-card p-5 shadow-md sm:p-7"
        >
            <div>
                <p className="text-xs font-semibold text-primary">
                    02. Catatan kontribusi
                </p>
                <h2
                    id={`contribution-${mode}-notes-title`}
                    className="mt-2 text-xl leading-snug font-bold tracking-tight sm:text-2xl"
                >
                    Ceritakan peran dan hasil pekerjaanmu.
                </h2>
            </div>
            <div className="grid min-w-0 gap-1.5">
                <Label htmlFor={`contribution-${mode}-claim`} required>
                    Judul kontribusi
                </Label>
                <Input
                    id={`contribution-${mode}-claim`}
                    className="h-11"
                    value={claim}
                    maxLength={160}
                    placeholder="Contoh: Menyusun alur validasi kontribusi"
                    onChange={(event) => onClaimChange(event.target.value)}
                    disabled={processing || blocked}
                    aria-invalid={Boolean(claimError)}
                    aria-describedby={
                        claimError
                            ? `contribution-${mode}-claim-error`
                            : undefined
                    }
                    data-test="contribution-claim"
                />
                <div className="grid min-w-0 gap-0.5">
                    <div className="flex justify-between gap-3 text-xs leading-normal text-muted-foreground">
                        <span>
                            Ringkas, spesifik, dan terkait dengan tugas yang
                            kamu kerjakan.
                        </span>
                        <span>{claim.length}/160</span>
                    </div>
                    {claimError && (
                        <p
                            id={`contribution-${mode}-claim-error`}
                            className="text-sm text-correction-subtle-foreground"
                        >
                            {claimError}
                        </p>
                    )}
                </div>
            </div>

            <div className="grid min-w-0 gap-1.5">
                <Label htmlFor={`contribution-${mode}-summary`} required>
                    Ringkasan karya yang dapat dibagikan
                </Label>
                <textarea
                    id={`contribution-${mode}-summary`}
                    className={textAreaClassName}
                    value={summary}
                    maxLength={5000}
                    placeholder="Jelaskan bagian yang kamu kerjakan, peranmu, hasil, dan kaitannya dengan bukti. Hindari informasi rahasia."
                    onChange={(event) => onSummaryChange(event.target.value)}
                    disabled={processing || blocked}
                    aria-invalid={Boolean(summaryError)}
                    aria-describedby={
                        summaryError
                            ? `contribution-${mode}-summary-error`
                            : undefined
                    }
                    data-test="contribution-summary"
                />
                <div className="grid min-w-0 gap-0.5">
                    <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs leading-normal text-muted-foreground">
                        <p>
                            Ringkasan menjadi isi portofolio setelah disetujui.
                            Karya tetap privat sampai kamu memilih jangkauan.
                            Jangan sertakan kontak atau informasi rahasia.
                        </p>
                        <span className="shrink-0">{summary.length}/5000</span>
                    </div>
                    {summaryError && (
                        <p
                            id={`contribution-${mode}-summary-error`}
                            className="text-sm text-correction-subtle-foreground"
                        >
                            {summaryError}
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
}
