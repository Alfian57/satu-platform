import { RefreshCw, Search } from 'lucide-react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { campusControlClass } from '@/pages/campus/_components/campus-operation-layout';
import type {
    ContributionStatus,
    ReviewFilters,
} from '@/pages/campus/contributions/_types/contribution-types';

interface ContributionFilterBarProps {
    filters: ReviewFilters;
    searchDraft: string;
    onSearchDraftChange: (value: string) => void;
    isFilterLoading: boolean;
    filterError: string | null;
    onUpdateFilters: (next: Partial<ReviewFilters>) => void;
    onRetryFilter: () => void;
}

export function ContributionFilterBar({
    filters,
    searchDraft,
    onSearchDraftChange,
    isFilterLoading,
    filterError,
    onUpdateFilters,
    onRetryFilter,
}: ContributionFilterBarProps) {
    function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        onUpdateFilters({ q: searchDraft.trim() });
    }

    return (
        <div className="space-y-6">
            {filterError && (
                <div
                    role="alert"
                    className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-correction/30 bg-correction-subtle p-4 text-xs font-semibold text-correction-subtle-foreground shadow-sm"
                    data-test="campus-contribution-filter-error"
                >
                    <span>{filterError}</span>
                    <Button
                        type="button"
                        variant="outline"
                        className="min-h-11 cursor-pointer rounded-xl bg-white text-xs disabled:cursor-not-allowed"
                        disabled={isFilterLoading}
                        onClick={onRetryFilter}
                        data-test="campus-contribution-filter-error-retry"
                    >
                        {isFilterLoading ? (
                            <Spinner className="mr-1 size-3" />
                        ) : (
                            <RefreshCw className="mr-1 size-3 text-muted-foreground" />
                        )}
                        Coba lagi
                    </Button>
                </div>
            )}

            <nav
                aria-label="Pilihan validasi kontribusi"
                className="flex flex-wrap gap-2"
                data-test="campus-contribution-views"
            >
                <Button
                    type="button"
                    variant={
                        filters.status === 'pending' ? 'default' : 'outline'
                    }
                    className="min-h-11"
                    disabled={isFilterLoading}
                    aria-pressed={filters.status === 'pending'}
                    onClick={() =>
                        onUpdateFilters({
                            status: 'pending',
                            sort: 'oldest',
                        })
                    }
                >
                    Pengajuan menunggu
                </Button>
                <Button
                    type="button"
                    variant={
                        filters.status === 'approved' ? 'default' : 'outline'
                    }
                    className="min-h-11"
                    disabled={isFilterLoading}
                    aria-pressed={filters.status === 'approved'}
                    onClick={() =>
                        onUpdateFilters({
                            status: 'approved',
                            sort: 'newest',
                        })
                    }
                >
                    Hasil disetujui
                </Button>
                <p className="basis-full text-sm leading-6 text-muted-foreground">
                    {filters.status === 'approved'
                        ? 'Temukan pekerjaan individual yang telah disetujui pada versi yang ditinjau. Ringkasan di atas mencakup seluruh berkas yang dapat ditinjau; hasil di bawah mengikuti pencarian.'
                        : 'Mulai dari pengajuan terlama. Ringkasan di atas mencakup seluruh berkas yang dapat ditinjau; hasil di bawah mengikuti filter.'}
                </p>
            </nav>

            <section
                aria-label="Filter antrean validasi kontribusi"
                aria-busy={isFilterLoading}
                className="grid gap-4 rounded-3xl border border-border bg-white p-4 shadow-sm sm:grid-cols-2 sm:p-5"
            >
                <form
                    className="grid gap-2 sm:col-span-2"
                    onSubmit={handleSearchSubmit}
                    data-test="campus-contribution-search-form"
                >
                    <label
                        htmlFor="contribution-review-search"
                        className="text-sm font-semibold"
                    >
                        Cari pengaju atau pekerjaan
                    </label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Input
                            id="contribution-review-search"
                            value={searchDraft}
                            onChange={(event) =>
                                onSearchDraftChange(event.target.value)
                            }
                            maxLength={100}
                            disabled={isFilterLoading}
                            className="min-h-11 min-w-0 flex-1 text-base"
                            aria-describedby="contribution-review-search-help"
                            placeholder="Nama tampilan, proyek, judul atau ringkasan karya"
                            data-test="campus-contribution-search"
                        />
                        <Button
                            type="submit"
                            variant="outline"
                            className="min-h-11"
                            disabled={isFilterLoading}
                        >
                            <Search aria-hidden="true" />
                            Cari kontribusi
                        </Button>
                    </div>
                    <p
                        id="contribution-review-search-help"
                        className="text-xs leading-5 text-muted-foreground"
                    >
                        Mencari versi yang sudah diajukan dalam universitas ini.
                        Kosongkan pencarian untuk melihat semua hasil sesuai
                        status.
                    </p>
                </form>

                <div className="space-y-1.5">
                    <label
                        htmlFor="filter-status"
                        className="text-sm font-semibold text-foreground"
                    >
                        Status Validasi
                    </label>
                    <select
                        id="filter-status"
                        value={filters.status}
                        disabled={isFilterLoading}
                        onChange={(event) =>
                            onUpdateFilters({
                                status: event.target.value as
                                    ContributionStatus | 'all',
                            })
                        }
                        className={cn(campusControlClass, 'cursor-pointer')}
                        data-test="campus-contribution-status-filter"
                    >
                        <option value="pending">Menunggu validasi</option>
                        <option value="all">Semua status</option>
                        <option value="approved">Tervalidasi</option>
                        <option value="revision">Perlu diperbaiki</option>
                        <option value="rejected">Ditolak</option>
                    </select>
                </div>

                <div className="space-y-1.5">
                    <label
                        htmlFor="filter-sort"
                        className="text-sm font-semibold text-foreground"
                    >
                        Urutan Pengajuan
                    </label>
                    <select
                        id="filter-sort"
                        value={filters.sort}
                        disabled={isFilterLoading}
                        onChange={(event) =>
                            onUpdateFilters({
                                sort: event.target.value as 'oldest' | 'newest',
                            })
                        }
                        className={cn(campusControlClass, 'cursor-pointer')}
                        data-test="campus-contribution-sort-filter"
                    >
                        <option value="oldest">Pengajuan terlama</option>
                        <option value="newest">Pengajuan terbaru</option>
                    </select>
                </div>
            </section>
        </div>
    );
}
