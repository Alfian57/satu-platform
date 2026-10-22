import { Button } from '@/components/ui/button';
import { needs, sheetClass, statuses } from './opportunity-support-constants';
import type { SupportCase } from './opportunity-support-constants';

export function OpportunitySupportRequestList({
    reviewer,
    requests,
    page,
    lastPage,
    total,
    selectedId,
    blocked,
    isProcessing,
    isReading,
    onChoose,
    onPageChange,
}: {
    reviewer: boolean;
    requests: SupportCase[];
    page: number;
    lastPage: number;
    total: number;
    selectedId?: number;
    blocked: boolean;
    isProcessing: boolean;
    isReading: boolean;
    onChoose: (item: SupportCase) => void;
    onPageChange: (page: number) => void;
}) {
    return (
        <section className={sheetClass} aria-busy={isReading}>
            <h2 className="text-xl font-bold">
                {reviewer ? 'Permintaan yang diizinkan' : 'Permintaan Anda'}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
                {total} permintaan. Tidak memiliki permintaan bukan tanda kurang
                kemampuan.
            </p>
            <div className="mt-4 space-y-3">
                {requests.length === 0 ? (
                    <p className="rounded-xl bg-accent/40 p-4 text-sm leading-6">
                        Belum ada berkas pada halaman ini. Anda tetap dapat
                        mencari dan mengajukan peluang sendiri.
                    </p>
                ) : (
                    requests.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            disabled={isProcessing || isReading}
                            onClick={() => onChoose(item)}
                            aria-pressed={selectedId === item.id}
                            className="min-h-11 w-full cursor-pointer rounded-2xl border border-primary/20 p-4 text-left focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed aria-pressed:bg-accent/70"
                        >
                            <span className="block font-semibold break-words">
                                {needs[item.need] ?? 'Kebutuhan kesempatan'}
                            </span>
                            {reviewer && (
                                <span className="mt-1 block text-sm break-words">
                                    {item.owner_name}
                                </span>
                            )}
                            <span className="mt-2 block text-sm text-muted-foreground">
                                {statuses[item.status] ?? item.status} · #
                                {item.id}
                            </span>
                        </button>
                    ))
                )}
            </div>
            {lastPage > 1 && (
                <nav
                    aria-label="Halaman permintaan"
                    className="mt-4 flex flex-wrap gap-2"
                >
                    <Button
                        variant="outline"
                        disabled={blocked || page <= 1}
                        onClick={() => onPageChange(page - 1)}
                    >
                        Sebelumnya
                    </Button>
                    <span className="self-center text-sm">
                        {page} / {lastPage}
                    </span>
                    <Button
                        variant="outline"
                        disabled={blocked || page >= lastPage}
                        onClick={() => onPageChange(page + 1)}
                    >
                        Selanjutnya
                    </Button>
                </nav>
            )}
        </section>
    );
}
