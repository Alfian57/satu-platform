import { LoaderCircle, UserCheck } from 'lucide-react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { campusControlClass } from '@/pages/campus/_components/campus-operation-layout';
import { conclusions } from '@/pages/campus/inclusion/_types/inclusion-types';

interface InclusionDecisionFormProps {
    form: {
        data: {
            human_conclusion: string;
            support_action: string;
            reason: string;
        };
        setData: (
            key: 'human_conclusion' | 'support_action' | 'reason',
            value: string,
        ) => void;
        errors: Partial<
            Record<'human_conclusion' | 'support_action' | 'reason', string>
        >;
        processing: boolean;
    };
    busy: boolean;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function InclusionDecisionForm({
    form,
    busy,
    onSubmit,
}: InclusionDecisionFormProps) {
    return (
        <form
            aria-label="Keputusan peninjauan inklusi"
            onSubmit={onSubmit}
            className="space-y-4 border-t border-border pt-4"
        >
            <h3 className="text-base font-bold">Catat tinjauan</h3>
            <div className="grid min-w-0 gap-1.5">
                <Label htmlFor="human-conclusion" required>
                    Kesimpulan peninjau
                </Label>
                <select
                    id="human-conclusion"
                    value={form.data.human_conclusion}
                    onChange={(event) =>
                        form.setData('human_conclusion', event.target.value)
                    }
                    disabled={busy}
                    aria-invalid={Boolean(form.errors.human_conclusion)}
                    aria-describedby={
                        form.errors.human_conclusion
                            ? 'conclusion-error'
                            : undefined
                    }
                    className={cn(campusControlClass, 'cursor-pointer')}
                >
                    {Object.entries(conclusions).map(([value, label]) => (
                        <option key={value} value={value}>
                            {label}
                        </option>
                    ))}
                </select>
                {form.errors.human_conclusion && (
                    <div className="grid min-w-0 gap-0.5">
                        <p
                            id="conclusion-error"
                            role="alert"
                            className="text-sm text-correction-subtle-foreground"
                        >
                            {form.errors.human_conclusion}
                        </p>
                    </div>
                )}
            </div>
            <div className="grid min-w-0 gap-1.5">
                <Label htmlFor="support-action" optional>
                    Tindakan pendukung
                </Label>
                <input
                    id="support-action"
                    value={form.data.support_action}
                    onChange={(event) =>
                        form.setData('support_action', event.target.value)
                    }
                    maxLength={255}
                    disabled={busy}
                    placeholder="Contoh: Menawarkan kesempatan proyek"
                    aria-invalid={Boolean(form.errors.support_action)}
                    aria-describedby="support-help support-error"
                    className={campusControlClass}
                />
                <div className="grid min-w-0 gap-0.5">
                    <p
                        id="support-help"
                        className="text-xs leading-normal text-muted-foreground"
                    >
                        Catatan ini tidak mengirim pesan atau kontak otomatis.
                    </p>
                    {form.errors.support_action && (
                        <p
                            id="support-error"
                            role="alert"
                            className="text-sm text-correction-subtle-foreground"
                        >
                            {form.errors.support_action}
                        </p>
                    )}
                </div>
            </div>
            <div className="grid min-w-0 gap-1.5">
                <Label htmlFor="inclusion-reason" required>
                    Alasan keputusan
                </Label>
                <textarea
                    id="inclusion-reason"
                    rows={3}
                    minLength={3}
                    maxLength={1000}
                    required
                    value={form.data.reason}
                    onChange={(event) =>
                        form.setData('reason', event.target.value)
                    }
                    disabled={busy}
                    placeholder="Tuliskan alasan faktual tanpa label diagnostik."
                    data-test="inclusion-reason"
                    aria-invalid={Boolean(form.errors.reason)}
                    aria-describedby="inclusion-reason-help inclusion-reason-error"
                    className={cn(campusControlClass, 'resize-y')}
                />
                <div className="grid min-w-0 gap-0.5">
                    <p
                        id="inclusion-reason-help"
                        className="text-xs leading-normal text-muted-foreground"
                    >
                        Maksimum 1.000 karakter. Riwayat peninjauan tidak
                        ditimpa.
                    </p>
                    {form.errors.reason && (
                        <p
                            id="inclusion-reason-error"
                            role="alert"
                            className="text-sm text-correction-subtle-foreground"
                        >
                            {form.errors.reason}
                        </p>
                    )}
                </div>
            </div>
            <Button
                type="submit"
                disabled={busy}
                data-test="inclusion-submit"
                className="min-h-11 w-full whitespace-normal"
            >
                {form.processing ? (
                    <LoaderCircle
                        aria-hidden="true"
                        className="size-4 animate-spin motion-reduce:animate-none"
                    />
                ) : (
                    <UserCheck aria-hidden="true" className="size-4" />
                )}
                {form.processing
                    ? 'Menyimpan keputusan...'
                    : 'Simpan keputusan'}
            </Button>
        </form>
    );
}
