import { RotateCcw } from 'lucide-react';
import type { FormEvent } from 'react';
import { statusLabels } from '@/components/campus/integrations/integration-types';
import { campusControlClass } from '@/components/campus-operation-layout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface IntegrationFilterStripProps {
    statusFilter: string;
    setStatusFilter: (val: string) => void;
    connectionFilter: string;
    setConnectionFilter: (val: string) => void;
    statusOptions: { value: string; label: string }[];
    connectionOptions: { id: number; label: string }[];
    busy: boolean;
    onSubmit: () => void;
}

export function IntegrationFilterStrip({
    statusFilter,
    setStatusFilter,
    connectionFilter,
    setConnectionFilter,
    statusOptions,
    connectionOptions,
    busy,
    onSubmit,
}: IntegrationFilterStripProps) {
    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        onSubmit();
    }

    return (
        <form
            aria-label="Filter sinkronisasi akademik"
            onSubmit={handleSubmit}
            className="grid min-w-0 items-end gap-4 rounded-3xl border border-border bg-white p-4 shadow-sm sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:p-5"
        >
            <label className="grid min-w-0 gap-2 text-sm font-semibold">
                Status
                <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    disabled={busy}
                    className={cn(campusControlClass, 'cursor-pointer')}
                >
                    <option value="all">Semua status</option>
                    {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {statusLabels[option.value] ?? option.label}
                        </option>
                    ))}
                </select>
            </label>
            <label className="grid min-w-0 gap-2 text-sm font-semibold">
                Koneksi
                <select
                    value={connectionFilter}
                    onChange={(event) =>
                        setConnectionFilter(event.target.value)
                    }
                    disabled={busy}
                    className={cn(campusControlClass, 'cursor-pointer')}
                >
                    <option value="0">Semua koneksi</option>
                    {connectionOptions.map((option) => (
                        <option key={option.id} value={String(option.id)}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </label>
            <Button type="submit" disabled={busy}>
                <RotateCcw aria-hidden="true" className="size-4" />
                Terapkan
            </Button>
        </form>
    );
}
