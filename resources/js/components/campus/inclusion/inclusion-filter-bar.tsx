import { Filter } from 'lucide-react';
import type { FormEvent } from 'react';
import { campusControlClass } from '@/components/campus-operation-layout';
import { Button } from '@/components/ui/button';

interface InclusionFilterBarProps {
    period: string;
    setPeriod: (val: string) => void;
    restrictedOnly: boolean;
    setRestrictedOnly: (val: boolean) => void;
    busy: boolean;
    onSubmit: () => void;
}

export function InclusionFilterBar({
    period,
    setPeriod,
    restrictedOnly,
    setRestrictedOnly,
    busy,
    onSubmit,
}: InclusionFilterBarProps) {
    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        onSubmit();
    }

    return (
        <form
            aria-label="Filter peninjauan inklusi"
            onSubmit={handleSubmit}
            className="grid min-w-0 items-end gap-4 rounded-3xl border border-border bg-white p-4 shadow-sm sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] sm:p-5"
        >
            <label
                className="grid min-w-0 gap-2 text-sm font-semibold"
                htmlFor="filter-period"
            >
                Periode akademik
                <input
                    id="filter-period"
                    placeholder="Contoh: 2026-S1"
                    value={period}
                    onChange={(event) => setPeriod(event.target.value)}
                    disabled={busy}
                    className={campusControlClass}
                />
            </label>
            <label
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-2 text-sm leading-5"
                htmlFor="restrictedOnly"
            >
                <input
                    id="restrictedOnly"
                    type="checkbox"
                    checked={restrictedOnly}
                    onChange={(event) =>
                        setRestrictedOnly(event.target.checked)
                    }
                    disabled={busy}
                    className="size-5 cursor-pointer accent-primary disabled:cursor-not-allowed"
                />
                Hanya yang perlu tinjauan
            </label>
            <Button
                type="submit"
                disabled={busy}
                data-test="inclusion-filter-button"
            >
                <Filter aria-hidden="true" className="size-4" />
                Terapkan
            </Button>
        </form>
    );
}
