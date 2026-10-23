import { Button } from '@/components/ui/button';
import { campusControlClass } from '@/pages/campus/_components/campus-operation-layout';

export const studentAffiliationStatuses: Record<string, string> = {
    all: 'Semua status',
    unverified: 'Belum terverifikasi',
    pending: 'Menunggu tinjauan',
    verified: 'Terverifikasi',
    suspended: 'Ditangguhkan',
};

export interface UniversityStudentsFilterFormProps {
    q: string;
    status: string;
    busy: boolean;
    onQueryChange: (q: string) => void;
    onStatusChange: (status: string) => void;
    onSubmit: () => void;
}

export function UniversityStudentsFilterForm({
    q,
    status,
    busy,
    onQueryChange,
    onStatusChange,
    onSubmit,
}: UniversityStudentsFilterFormProps) {
    return (
        <form
            aria-label="Filter mahasiswa"
            className="grid min-w-0 gap-4 rounded-3xl border border-primary/15 bg-card p-5 shadow-sm sm:grid-cols-[minmax(0,1fr)_14rem_auto]"
            onSubmit={(event) => {
                event.preventDefault();
                onSubmit();
            }}
        >
            <label className="grid gap-2 text-sm font-semibold">
                Cari nama
                <input
                    className={campusControlClass}
                    value={q}
                    maxLength={100}
                    disabled={busy}
                    onChange={(event) => onQueryChange(event.target.value)}
                    placeholder="Nama tampilan mahasiswa"
                />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
                Status afiliasi
                <select
                    className={`${campusControlClass} cursor-pointer`}
                    value={status}
                    disabled={busy}
                    onChange={(event) => onStatusChange(event.target.value)}
                >
                    {Object.entries(studentAffiliationStatuses).map(
                        ([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ),
                    )}
                </select>
            </label>
            <Button
                type="submit"
                className="cursor-pointer self-end disabled:cursor-not-allowed"
                disabled={busy}
            >
                Terapkan filter
            </Button>
        </form>
    );
}
