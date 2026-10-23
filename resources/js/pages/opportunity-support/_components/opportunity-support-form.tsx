import { Button } from '@/components/ui/button';
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
                <div>
                    <label
                        htmlFor="support-need"
                        className="text-sm font-semibold"
                    >
                        Kebutuhan pilihan Anda
                    </label>
                    <select
                        id="support-need"
                        aria-invalid={!!errors.need}
                        aria-errormessage="support-errors"
                        className={campusControlClass + ' mt-2 cursor-pointer'}
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
                <div>
                    <label
                        htmlFor="support-explanation"
                        className="text-sm font-semibold"
                    >
                        Penjelasan tambahan (opsional)
                    </label>
                    <textarea
                        id="support-explanation"
                        aria-errormessage="support-errors"
                        className={campusControlClass + ' mt-2 min-h-28'}
                        maxLength={1000}
                        value={explanation}
                        onChange={(e) => onExplanationChange(e.target.value)}
                        aria-describedby="support-private-help"
                        aria-invalid={!!errors.explanation}
                    />
                    <p
                        id="support-private-help"
                        className="mt-2 text-sm text-muted-foreground"
                    >
                        Ceritakan kebutuhan peran atau belajar. Jangan sertakan
                        nomor kontak, rahasia tim atau tautan bukti privat.
                    </p>
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
