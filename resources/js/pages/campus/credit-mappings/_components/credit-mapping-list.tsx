import { History } from 'lucide-react';
import { CreditMappingCard } from '@/pages/campus/credit-mappings/_components/credit-mapping-card';
import type { CreditMappingItem } from '@/pages/campus/credit-mappings/_types/credit-types';
import { DashboardArchiveArt } from '@/pages/dashboard/_components/dashboard-archive-art';

export function CreditMappingList({
    mappings,
    activeCount,
    draftCount,
    busy,
    onAction,
}: {
    mappings: CreditMappingItem[];
    activeCount: number;
    draftCount: number;
    busy: boolean;
    onAction: (
        mapping: CreditMappingItem,
        action: 'activate' | 'retire',
    ) => void;
}) {
    return (
        <section
            aria-labelledby="credit-mappings-heading"
            aria-busy={busy}
            className="@container min-w-0 space-y-4"
        >
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2
                        id="credit-mappings-heading"
                        tabIndex={-1}
                        className="text-lg font-bold focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        Aturan dan riwayat versi
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {activeCount} aktif. {draftCount} draft.{' '}
                        {mappings.length} aturan tercatat.
                    </p>
                </div>
                <History aria-hidden="true" className="size-5 text-primary" />
            </div>
            {mappings.length === 0 ? (
                <div className="rounded-3xl border border-border bg-white p-6 text-center shadow-sm">
                    <DashboardArchiveArt className="mx-auto size-20" />
                    <h3 className="mt-3 text-lg font-bold">
                        Belum ada aturan kredit
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Buat draft melalui formulir di atas. Aturan tidak
                        langsung aktif setelah disimpan.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 @min-[56rem]:grid-cols-2">
                    {mappings.map((mapping) => (
                        <CreditMappingCard
                            key={mapping.id}
                            mapping={mapping}
                            busy={busy}
                            onAction={onAction}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
