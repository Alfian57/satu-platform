import { CheckCircle2, CircleDot, History, XCircle } from 'lucide-react';
import type { CreditMappingItem } from '@/components/campus/credits/credit-types';
import {
    activityLabels,
    mappingDate,
} from '@/components/campus/credits/credit-types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function CreditMappingCard({
    mapping,
    busy,
    onAction,
}: {
    mapping: CreditMappingItem;
    busy: boolean;
    onAction: (
        mapping: CreditMappingItem,
        action: 'activate' | 'retire',
    ) => void;
}) {
    const active = mapping.status === 'active';
    const draft = mapping.status === 'draft';
    const Icon = active ? CheckCircle2 : draft ? CircleDot : History;

    return (
        <article className="min-w-0 rounded-3xl border border-border bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-primary">
                        Versi {mapping.version}
                    </p>
                    <h3 className="mt-1 text-xl font-bold wrap-anywhere">
                        {activityLabels[mapping.activity_type] ??
                            mapping.activity_type.replaceAll('_', ' ')}
                    </h3>
                </div>
                <span
                    className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
                        active
                            ? 'border-verified/30 bg-verified-subtle text-verified-subtle-foreground'
                            : draft
                              ? 'border-pending/30 bg-pending-subtle text-pending-subtle-foreground'
                              : 'border-border bg-accent/40 text-muted-foreground',
                    )}
                >
                    <Icon aria-hidden="true" className="size-3.5" />
                    {active
                        ? 'Aktif'
                        : draft
                          ? 'Draft'
                          : mapping.status === 'retired'
                            ? 'Dihentikan'
                            : mapping.status}
                </span>
            </div>
            <p className="mt-4 text-2xl font-bold text-primary">
                {mapping.credit_amount}{' '}
                <span className="text-sm font-medium text-muted-foreground">
                    SKS
                </span>
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {active
                    ? 'Aturan yang berlaku untuk aktivitas ini.'
                    : draft
                      ? 'Belum berlaku. Periksa sebelum mengaktifkan.'
                      : 'Riwayat aturan. Tidak dipakai untuk pemetaan baru.'}
            </p>
            {mapping.reason && (
                <p className="mt-3 rounded-2xl bg-accent/50 p-3 text-sm leading-6 wrap-anywhere">
                    Catatan: {mapping.reason}
                </p>
            )}
            <dl className="mt-4 grid gap-3 border-y border-border py-3 sm:grid-cols-2">
                <div className="min-w-0">
                    <dt className="text-xs text-muted-foreground">
                        Berlaku mulai
                    </dt>
                    <dd className="mt-1 text-sm">
                        {mappingDate(mapping.effective_from)}
                    </dd>
                </div>
                <div className="min-w-0">
                    <dt className="text-xs text-muted-foreground">
                        Berlaku sampai
                    </dt>
                    <dd className="mt-1 text-sm">
                        {mapping.effective_to
                            ? mappingDate(mapping.effective_to)
                            : active
                              ? 'Belum dihentikan'
                              : 'Belum tersedia'}
                    </dd>
                </div>
                {mapping.approver_name && (
                    <div className="min-w-0 sm:col-span-2">
                        <dt className="text-xs text-muted-foreground">
                            Disetujui oleh
                        </dt>
                        <dd className="mt-1 text-sm wrap-anywhere">
                            {mapping.approver_name}
                        </dd>
                    </div>
                )}
            </dl>
            {(draft || active) && (
                <div className="mt-4 flex justify-end">
                    <Button
                        type="button"
                        variant={draft ? 'default' : 'outline'}
                        disabled={busy}
                        onClick={() =>
                            onAction(mapping, draft ? 'activate' : 'retire')
                        }
                    >
                        {draft ? (
                            <CheckCircle2
                                aria-hidden="true"
                                className="size-4"
                            />
                        ) : (
                            <XCircle aria-hidden="true" className="size-4" />
                        )}
                        {draft ? 'Aktifkan aturan' : 'Hentikan aturan'}
                    </Button>
                </div>
            )}
        </article>
    );
}
