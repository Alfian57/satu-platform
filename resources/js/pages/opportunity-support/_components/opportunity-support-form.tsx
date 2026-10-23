import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { campusControlClass } from '@/pages/campus/_components/campus-operation-layout';
import { needs, sheetClass } from './opportunity-support-constants';

export function OpportunitySupportForm({
    canCreate,
    blocked,
    need,
    explanation,
    consent,
    errors,
    onNeedChange,
    onExplanationChange,
    onConsentChange,
    onSubmit,
}: {
    canCreate: boolean;
    blocked: boolean;
    need: string;
    explanation: string;
    consent: boolean;
    errors: Record<string, string | undefined>;
    onNeedChange: (val: string) => void;
    onExplanationChange: (val: string) => void;
    onConsentChange: (val: boolean) => void;
    onSubmit: () => void;
}) {
    if (!canCreate) {
        return null;
    }

    return (
        <form
            className={sheetClass}
            onSubmit={(event) => {
                event.preventDefault();
                onSubmit();
            }}
        >
            <h2 className="text-xl font-bold">Apa yang ingin dibantu?</h2>
            <fieldset disabled={blocked} className="mt-4 min-w-0 space-y-4">
                <div className="grid min-w-0 gap-1.5">
                    <Label htmlFor="support-need" required>
                        Kebutuhan pilihan Anda
                    </Label>
                    <select
                        id="support-need"
                        aria-invalid={!!errors.need}
                        aria-errormessage="support-errors"
                        className={campusControlClass + ' cursor-pointer'}
                        value={need}
                        onChange={(e) => onNeedChange(e.target.value)}
                    >
                        {Object.entries(needs).map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="grid min-w-0 gap-1.5">
                    <Label htmlFor="support-explanation" optional>
                        Penjelasan tambahan
                    </Label>
                    <textarea
                        id="support-explanation"
                        aria-errormessage="support-errors"
                        placeholder="Jelaskan kebutuhan dukungan atau kendala kolaborasi yang kamu hadapi"
                        className={campusControlClass + ' min-h-28'}
                        maxLength={1000}
                        value={explanation}
                        onChange={(e) => onExplanationChange(e.target.value)}
                        aria-describedby="support-private-help"
                        aria-invalid={!!errors.explanation}
                    />
                    <div className="grid min-w-0 gap-0.5">
                        <p
                            id="support-private-help"
                            className="text-xs leading-normal text-muted-foreground"
                        >
                            Ceritakan kebutuhan peran atau belajar. Jangan
                            sertakan nomor kontak, rahasia tim atau tautan bukti
                            privat.
                        </p>
                    </div>
                </div>
                <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-input p-3 text-sm leading-6 focus-within:ring-2 focus-within:ring-ring has-[:disabled]:cursor-not-allowed">
                    <input
                        className="mt-1 size-5 shrink-0 cursor-pointer disabled:cursor-not-allowed"
                        type="checkbox"
                        aria-describedby="support-notice"
                        aria-errormessage="support-errors"
                        checked={consent}
                        onChange={(e) => onConsentChange(e.target.checked)}
                        aria-invalid={!!errors.consent}
                    />
                    Saya mengizinkan kebutuhan ini dibaca peninjau yang ditunjuk
                    untuk tujuan dan masa akses di atas.
                </label>
                <Button type="submit" disabled={!consent || blocked}>
                    Ajukan bantuan
                </Button>
            </fieldset>
        </form>
    );
}
