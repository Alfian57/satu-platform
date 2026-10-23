import { FilePlus2, LoaderCircle, Plus } from 'lucide-react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { campusControlClass } from '@/pages/campus/_components/campus-operation-layout';
import { activityLabels } from '@/pages/campus/credit-mappings/_types/credit-types';

export function CreditDraftForm({
    form,
    busy,
    onSubmit,
}: {
    form: {
        data: {
            activity_type: string;
            credit_amount: string;
            reason: string;
        };
        setData: (key: string, value: string) => void;
        errors: Partial<
            Record<'activity_type' | 'credit_amount' | 'reason', string>
        >;
        processing: boolean;
    };
    busy: boolean;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
    return (
        <form
            aria-labelledby="credit-draft-heading"
            onSubmit={onSubmit}
            className="@container min-w-0 rounded-3xl border border-primary/15 bg-white p-4 shadow-sm sm:p-5"
        >
            <div className="flex items-start gap-3 border-b border-border pb-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                    <FilePlus2 aria-hidden="true" className="size-5" />
                </span>
                <div>
                    <h2 id="credit-draft-heading" className="text-lg font-bold">
                        Buat aturan baru
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        Simpan sebagai draft untuk diperiksa terlebih dahulu.
                    </p>
                </div>
            </div>
            <div className="mt-5 grid gap-4 @min-[32rem]:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                <div className="grid min-w-0 content-start gap-1.5">
                    <Label htmlFor="credit-activity" required>
                        Jenis aktivitas
                    </Label>
                    <select
                        id="credit-activity"
                        value={form.data.activity_type}
                        onChange={(event) =>
                            form.setData('activity_type', event.target.value)
                        }
                        disabled={busy}
                        className={cn(campusControlClass, 'cursor-pointer')}
                        aria-invalid={Boolean(form.errors.activity_type)}
                        aria-describedby={
                            form.errors.activity_type
                                ? 'credit-activity-error'
                                : undefined
                        }
                    >
                        {Object.entries(activityLabels).map(
                            ([value, label]) => (
                                <option value={value} key={value}>
                                    {label}
                                </option>
                            ),
                        )}
                    </select>
                    {form.errors.activity_type && (
                        <div className="grid min-w-0 gap-0.5">
                            <p
                                role="alert"
                                id="credit-activity-error"
                                className="text-sm text-correction-subtle-foreground"
                            >
                                {form.errors.activity_type}
                            </p>
                        </div>
                    )}
                </div>
                <div className="grid min-w-0 content-start gap-1.5">
                    <Label htmlFor="credit-amount" required>
                        Jumlah kredit (SKS)
                    </Label>
                    <input
                        id="credit-amount"
                        type="number"
                        min="0.5"
                        max="24"
                        step="0.5"
                        placeholder="Contoh: 3"
                        required
                        value={form.data.credit_amount}
                        onChange={(event) =>
                            form.setData('credit_amount', event.target.value)
                        }
                        disabled={busy}
                        className={campusControlClass}
                        aria-invalid={Boolean(form.errors.credit_amount)}
                        aria-describedby="credit-amount-help credit-amount-error"
                    />
                    <div className="grid min-w-0 gap-0.5">
                        <p
                            id="credit-amount-help"
                            className="text-xs leading-normal text-muted-foreground"
                        >
                            0,5 sampai 24 SKS.
                        </p>
                        {form.errors.credit_amount && (
                            <p
                                role="alert"
                                id="credit-amount-error"
                                className="text-sm text-correction-subtle-foreground"
                            >
                                {form.errors.credit_amount}
                            </p>
                        )}
                    </div>
                </div>
                <div className="grid min-w-0 gap-1.5 @min-[32rem]:col-span-2">
                    <Label htmlFor="credit-reason" optional>
                        Catatan aturan
                    </Label>
                    <textarea
                        id="credit-reason"
                        rows={3}
                        maxLength={1000}
                        value={form.data.reason}
                        onChange={(event) =>
                            form.setData('reason', event.target.value)
                        }
                        disabled={busy}
                        placeholder="Jelaskan dasar atau perubahan aturan kredit."
                        className={cn(campusControlClass, 'resize-y')}
                        aria-invalid={Boolean(form.errors.reason)}
                        aria-describedby="credit-reason-help credit-reason-error"
                    />
                    <div className="grid min-w-0 gap-0.5">
                        <p
                            id="credit-reason-help"
                            className="text-xs leading-normal text-muted-foreground"
                        >
                            Maksimum 1.000 karakter.
                        </p>
                        {form.errors.reason && (
                            <p
                                role="alert"
                                id="credit-reason-error"
                                className="text-sm text-correction-subtle-foreground"
                            >
                                {form.errors.reason}
                            </p>
                        )}
                    </div>
                </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <p className="text-xs leading-5 text-muted-foreground">
                    Versi ditentukan oleh sistem saat disimpan.
                </p>
                <Button type="submit" disabled={busy}>
                    {form.processing ? (
                        <LoaderCircle
                            aria-hidden="true"
                            className="size-4 animate-spin motion-reduce:animate-none"
                        />
                    ) : (
                        <Plus aria-hidden="true" className="size-4" />
                    )}
                    {form.processing ? 'Menyimpan draft...' : 'Buat draft'}
                </Button>
            </div>
        </form>
    );
}
