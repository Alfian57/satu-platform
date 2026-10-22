import { campusControlClass } from '@/components/campus-operation-layout';
import { Button } from '@/components/ui/button';
import { sheetClass } from './skills-types';

export function SkillsFilterForm({
    q,
    category,
    status,
    categories,
    actionBusy,
    onQChange,
    onCategoryChange,
    onStatusChange,
    onApply,
}: {
    q: string;
    category: string;
    status: string;
    categories: string[];
    actionBusy: boolean;
    onQChange: (val: string) => void;
    onCategoryChange: (val: string) => void;
    onStatusChange: (val: string) => void;
    onApply: () => void;
}) {
    return (
        <form
            aria-label="Filter katalog"
            onSubmit={(event) => {
                event.preventDefault();
                onApply();
            }}
            className={
                sheetClass +
                ' grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_12rem_12rem_auto]'
            }
        >
            <label className="grid gap-2 text-sm font-semibold">
                Cari keahlian
                <input
                    className={campusControlClass}
                    value={q}
                    maxLength={100}
                    disabled={actionBusy}
                    onChange={(event) => onQChange(event.target.value)}
                />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
                Kategori
                <select
                    className={campusControlClass + ' cursor-pointer'}
                    value={category}
                    disabled={actionBusy}
                    onChange={(event) => onCategoryChange(event.target.value)}
                >
                    <option value="all">Semua kategori</option>
                    {categories.map((item) => (
                        <option key={item} value={item}>
                            {item}
                        </option>
                    ))}
                </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold">
                Status katalog
                <select
                    className={campusControlClass + ' cursor-pointer'}
                    value={status}
                    disabled={actionBusy}
                    onChange={(event) => onStatusChange(event.target.value)}
                >
                    <option value="all">Semua status</option>
                    <option value="verified">Disetujui</option>
                    <option value="unverified">Perlu tinjauan</option>
                </select>
            </label>
            <Button type="submit" disabled={actionBusy} className="self-end">
                Terapkan filter
            </Button>
        </form>
    );
}
