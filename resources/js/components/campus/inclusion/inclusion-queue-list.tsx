import { ChevronLeft, ChevronRight, LoaderCircle } from 'lucide-react';
import { InclusionQueueItem } from '@/components/campus/inclusion/inclusion-queue-item';
import type { PaginatedSignals } from '@/components/campus/inclusion/inclusion-types';
import { DashboardArchiveArt } from '@/components/dashboard-archive-art';
import { Button } from '@/components/ui/button';

interface InclusionQueueListProps {
    signals: PaginatedSignals;
    selectedSignalId?: number;
    isPending: boolean;
    busy: boolean;
    onSelectSignal: (signalId: number) => void;
    onPageChange: (page: number) => void;
}

export function InclusionQueueList({
    signals,
    selectedSignalId,
    isPending,
    busy,
    onSelectSignal,
    onPageChange,
}: InclusionQueueListProps) {
    return (
        <section
            aria-labelledby="inclusion-queue-heading"
            className="min-w-0 space-y-4"
        >
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2
                        id="inclusion-queue-heading"
                        className="text-lg font-bold"
                    >
                        Antrean peninjauan
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Pilih berkas untuk membaca konteks dan mencatat
                        tinjauan.
                    </p>
                </div>
                <span className="rounded-full border border-primary/15 bg-accent px-3 py-1 text-xs font-semibold">
                    {signals.pagination.total} sesuai filter
                </span>
            </div>
            <div
                className="space-y-3"
                aria-busy={isPending}
                data-test="inclusion-queue"
            >
                {isPending && (
                    <p
                        role="status"
                        className="flex items-center gap-2 rounded-xl bg-accent p-3 text-sm text-primary"
                    >
                        <LoaderCircle
                            aria-hidden="true"
                            className="size-4 animate-spin motion-reduce:animate-none"
                        />
                        Memuat antrean. Data sebelumnya tetap terlihat.
                    </p>
                )}
                {signals.items.length === 0 ? (
                    <div className="rounded-3xl border border-border bg-white p-6 text-center shadow-sm">
                        <DashboardArchiveArt className="mx-auto size-20" />
                        <h3 className="mt-2 text-lg font-bold">
                            Tidak ada hasil pada filter ini
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            Ubah periode atau pilihan tinjauan untuk melihat
                            berkas lain. Antrean kosong bukan kesimpulan tentang
                            keadaan mahasiswa.
                        </p>
                    </div>
                ) : (
                    signals.items.map((signal) => (
                        <InclusionQueueItem
                            key={signal.id}
                            signal={signal}
                            isSelected={selectedSignalId === signal.id}
                            busy={busy}
                            onSelect={onSelectSignal}
                        />
                    ))
                )}
            </div>
            {signals.pagination.last_page > 1 && (
                <nav
                    aria-label="Paginasi peninjauan inklusi"
                    className="flex flex-wrap items-center justify-between gap-3"
                >
                    <p className="text-xs text-muted-foreground">
                        Halaman {signals.pagination.current_page} dari{' '}
                        {signals.pagination.last_page}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            disabled={
                                busy || signals.pagination.current_page === 1
                            }
                            onClick={() =>
                                onPageChange(
                                    signals.pagination.current_page - 1,
                                )
                            }
                        >
                            <ChevronLeft
                                aria-hidden="true"
                                className="size-4"
                            />
                            Sebelumnya
                        </Button>
                        <Button
                            variant="outline"
                            disabled={
                                busy ||
                                signals.pagination.current_page ===
                                    signals.pagination.last_page
                            }
                            onClick={() =>
                                onPageChange(
                                    signals.pagination.current_page + 1,
                                )
                            }
                        >
                            Berikutnya
                            <ChevronRight
                                aria-hidden="true"
                                className="size-4"
                            />
                        </Button>
                    </div>
                </nav>
            )}
        </section>
    );
}
