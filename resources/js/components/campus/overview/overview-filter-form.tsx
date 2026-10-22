import { Filter, RefreshCw, RotateCcw } from 'lucide-react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

interface OverviewFilterFormProps {
    dateFrom: string;
    setDateFrom: (val: string) => void;
    dateTo: string;
    setDateTo: (val: string) => void;
    program: string;
    setProgram: (val: string) => void;
    fieldErrors: Record<string, string>;
    isPending: boolean;
    hasDraftChanges: boolean;
    hasAppliedFilters: boolean;
    onSubmit: (event: FormEvent) => void;
    onReset: () => void;
    onReload: () => void;
}

export function OverviewFilterForm({
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    program,
    setProgram,
    fieldErrors,
    isPending,
    hasDraftChanges,
    hasAppliedFilters,
    onSubmit,
    onReset,
    onReload,
}: OverviewFilterFormProps) {
    return (
        <form
            onSubmit={onSubmit}
            className="@container rounded-3xl border border-border bg-white p-4 shadow-sm"
            aria-label="Filter ringkasan kampus"
        >
            {hasDraftChanges && (
                <p className="mb-3 text-xs leading-5 font-semibold text-pending-subtle-foreground">
                    Pilihan belum diterapkan
                </p>
            )}
            <fieldset
                disabled={isPending}
                aria-describedby="campus-filter-help"
                className="grid min-w-0 items-start gap-3 @min-[28rem]:grid-cols-2 @min-[44rem]:grid-cols-3 @min-[56rem]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.4fr)_auto]"
            >
                <legend className="sr-only">Periode dan program studi</legend>
                <div className="min-w-0 space-y-2">
                    <label
                        htmlFor="campus-overview-date-from"
                        className="text-sm font-semibold"
                    >
                        Tanggal mulai
                    </label>
                    <Input
                        id="campus-overview-date-from"
                        type="date"
                        className="h-11 cursor-pointer text-base md:text-base"
                        value={dateFrom}
                        onChange={(event) => setDateFrom(event.target.value)}
                        aria-invalid={Boolean(fieldErrors.date_from)}
                        aria-describedby={
                            fieldErrors.date_from
                                ? 'date-from-error'
                                : undefined
                        }
                    />
                    {fieldErrors.date_from && (
                        <p
                            id="date-from-error"
                            className="text-sm text-correction"
                        >
                            {fieldErrors.date_from}
                        </p>
                    )}
                </div>
                <div className="min-w-0 space-y-2">
                    <label
                        htmlFor="campus-overview-date-to"
                        className="text-sm font-semibold"
                    >
                        Tanggal selesai
                    </label>
                    <Input
                        id="campus-overview-date-to"
                        type="date"
                        className="h-11 cursor-pointer text-base md:text-base"
                        value={dateTo}
                        onChange={(event) => setDateTo(event.target.value)}
                        aria-invalid={Boolean(fieldErrors.date_to)}
                        aria-describedby={
                            fieldErrors.date_to ? 'date-to-error' : undefined
                        }
                    />
                    {fieldErrors.date_to && (
                        <p
                            id="date-to-error"
                            className="text-sm text-correction"
                        >
                            {fieldErrors.date_to}
                        </p>
                    )}
                </div>
                <div className="min-w-0 space-y-2 @min-[28rem]:col-span-2 @min-[44rem]:col-span-1">
                    <label
                        htmlFor="campus-overview-program"
                        className="text-sm font-semibold"
                    >
                        Program studi
                    </label>
                    <Input
                        id="campus-overview-program"
                        type="text"
                        className="h-11 text-base md:text-base"
                        placeholder="Nama lengkap program studi"
                        value={program}
                        onChange={(event) => setProgram(event.target.value)}
                        aria-invalid={Boolean(fieldErrors.program)}
                        aria-describedby={
                            fieldErrors.program
                                ? 'campus-program-help campus-program-error'
                                : 'campus-program-help'
                        }
                    />
                    <p id="campus-program-help" className="sr-only">
                        Gunakan nama yang sama dengan profil mahasiswa.
                        Kosongkan untuk semua program.
                    </p>
                    {fieldErrors.program && (
                        <p
                            id="campus-program-error"
                            className="text-sm text-correction"
                        >
                            {fieldErrors.program}
                        </p>
                    )}
                </div>
                <div className="flex min-w-0 flex-wrap gap-2 @min-[28rem]:col-span-2 @min-[44rem]:col-span-3 @min-[56rem]:col-span-1 @min-[56rem]:max-w-72 @min-[56rem]:pt-6">
                    <Button type="submit" className="h-11" disabled={isPending}>
                        {isPending ? (
                            <Spinner aria-hidden="true" />
                        ) : (
                            <Filter aria-hidden="true" className="size-4" />
                        )}
                        Terapkan filter
                    </Button>
                    {(hasAppliedFilters || hasDraftChanges) && (
                        <Button
                            type="button"
                            variant="outline"
                            className="h-11"
                            disabled={isPending}
                            onClick={onReset}
                        >
                            <RotateCcw aria-hidden="true" className="size-4" />
                            Atur ulang
                        </Button>
                    )}
                    <Button
                        type="button"
                        variant="outline"
                        className="h-11"
                        disabled={isPending}
                        onClick={onReload}
                    >
                        <RefreshCw aria-hidden="true" className="size-4" />
                        Muat ulang
                    </Button>
                </div>
            </fieldset>
            <p id="campus-filter-help" className="sr-only">
                Tanggal membatasi waktu pencatatan. Program studi hanya
                menyaring keanggotaan dan daftar anggota.
            </p>
        </form>
    );
}
