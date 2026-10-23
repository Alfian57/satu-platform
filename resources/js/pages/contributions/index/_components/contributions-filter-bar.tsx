import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { contributionStatusMeta } from '@/pages/contributions/_components/contribution-status';
import type { ContributionStatus } from '@/types/contribution';

export interface ContributionsFilterBarProps {
    query: string;
    status: ContributionStatus | 'all';
    totalCount: number;
    visibleCount: number;
    onQueryChange: (query: string) => void;
    onStatusChange: (status: ContributionStatus | 'all') => void;
}

export function ContributionsFilterBar({
    query,
    status,
    totalCount,
    visibleCount,
    onQueryChange,
    onStatusChange,
}: ContributionsFilterBarProps) {
    return (
        <div className="grid min-w-0 gap-5 rounded-3xl border border-primary/20 bg-card p-5 shadow-md sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold text-primary">
                        Buku besar kontribusi
                    </p>
                    <h2
                        id="contributions-ledger-title"
                        className="mt-2 text-xl leading-snug font-bold tracking-tight"
                    >
                        Catatan pekerjaanmu
                    </h2>
                </div>
                <p
                    role="status"
                    aria-live="polite"
                    className="rounded-full border border-border bg-accent px-3 py-1.5 text-xs font-medium text-primary"
                >
                    {visibleCount} dari {totalCount} catatan
                </p>
            </div>
            <div className="grid min-w-0 gap-4 sm:grid-cols-[minmax(0,1fr)_14rem]">
                <div className="grid min-w-0 gap-2">
                    <Label htmlFor="contribution-search" optional>
                        Cari catatan
                    </Label>
                    <div className="relative">
                        <Search
                            aria-hidden="true"
                            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                        />
                        <Input
                            id="contribution-search"
                            className="h-11 pl-9"
                            value={query}
                            onChange={(event) =>
                                onQueryChange(event.target.value)
                            }
                            placeholder="Cari proyek atau tugas"
                        />
                    </div>
                </div>
                <div className="grid min-w-0 gap-2">
                    <Label htmlFor="contribution-status-filter" optional>
                        Status validasi
                    </Label>
                    <select
                        id="contribution-status-filter"
                        className="h-11 w-full min-w-0 cursor-pointer rounded-xl border border-input bg-background pr-10 pl-4 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:text-sm"
                        value={status}
                        onChange={(event) =>
                            onStatusChange(
                                event.target.value as
                                    ContributionStatus | 'all',
                            )
                        }
                    >
                        <option value="all">Semua status</option>
                        {Object.entries(contributionStatusMeta).map(
                            ([value, meta]) => (
                                <option key={value} value={value}>
                                    {meta.label}
                                </option>
                            ),
                        )}
                    </select>
                </div>
            </div>
            <p className="text-xs text-muted-foreground">
                Urutan mengikuti pembaruan terakhir. Pencarian hanya pada
                catatan yang tersedia di daftar ini.
            </p>
        </div>
    );
}
