import {
    controlClassName,
    matchCopy,
} from '@/pages/campus/affiliations/_types/affiliation-types';
import type {
    Filters,
    MatchResult,
} from '@/pages/campus/affiliations/_types/affiliation-types';

interface AffiliationFilterBarProps {
    filters: Filters;
    disabled: boolean;
    onChangeFilter: (key: keyof Filters, value: string) => void;
}

export function AffiliationFilterBar({
    filters,
    disabled,
    onChangeFilter,
}: AffiliationFilterBarProps) {
    return (
        <section
            aria-label="Filter antrean"
            className="@container rounded-3xl border border-border bg-white p-4 shadow-sm"
        >
            <div className="grid min-w-0 gap-3 @min-[34rem]:grid-cols-3">
                <div className="min-w-0 space-y-2">
                    <label
                        htmlFor="filter-match"
                        className="text-sm font-semibold"
                    >
                        Hasil awal roster
                    </label>
                    <select
                        id="filter-match"
                        value={filters.match ?? 'all'}
                        disabled={disabled}
                        onChange={(event) =>
                            onChangeFilter('match', event.target.value)
                        }
                        className={controlClassName}
                    >
                        <option value="all">Semua hasil</option>
                        {(Object.keys(matchCopy) as MatchResult[]).map(
                            (result) => (
                                <option key={result} value={result}>
                                    {matchCopy[result]}
                                </option>
                            ),
                        )}
                    </select>
                </div>
                <div className="min-w-0 space-y-2">
                    <label
                        htmlFor="filter-stale"
                        className="text-sm font-semibold"
                    >
                        Status data
                    </label>
                    <select
                        id="filter-stale"
                        value={
                            filters.stale === null
                                ? 'all'
                                : String(filters.stale)
                        }
                        disabled={disabled}
                        onChange={(event) =>
                            onChangeFilter('stale', event.target.value)
                        }
                        className={controlClassName}
                    >
                        <option value="all">Semua berkas</option>
                        <option value="false">Data terkini</option>
                        <option value="true">Perlu diajukan ulang</option>
                    </select>
                </div>
                <div className="min-w-0 space-y-2">
                    <label
                        htmlFor="filter-sort"
                        className="text-sm font-semibold"
                    >
                        Urutan pengajuan
                    </label>
                    <select
                        id="filter-sort"
                        value={filters.sort}
                        disabled={disabled}
                        onChange={(event) =>
                            onChangeFilter('sort', event.target.value)
                        }
                        className={controlClassName}
                    >
                        <option value="oldest">Paling lama</option>
                        <option value="newest">Paling baru</option>
                    </select>
                </div>
            </div>
        </section>
    );
}
