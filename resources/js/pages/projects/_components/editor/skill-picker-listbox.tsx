import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import type { Taxonomy } from './editor-utils';

type Props = {
    id: string;
    open: boolean;
    isSearching: boolean;
    hasError: boolean;
    query: string;
    options: Taxonomy[];
    activeOptionIndex: number;
    onSelect: (option: Taxonomy) => void;
};

export function SkillPickerListbox({
    id,
    open,
    isSearching,
    hasError,
    query,
    options,
    activeOptionIndex,
    onSelect,
}: Props) {
    if (!open) {
        return null;
    }

    return (
        <div
            id={id}
            role="listbox"
            aria-label="Pilihan keahlian"
            className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-md"
        >
            {isSearching ? (
                <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
                    <Spinner aria-hidden="true" />
                    Mencari keahlian...
                </div>
            ) : hasError ? (
                <p className="px-3 py-3 text-sm text-correction-subtle-foreground">
                    Keahlian belum dapat dimuat. Coba lagi.
                </p>
            ) : query.trim() === '' ? (
                <p className="px-3 py-3 text-sm text-muted-foreground">
                    Ketik untuk mencari keahlian yang tersedia.
                </p>
            ) : options.length === 0 ? (
                <p
                    className="px-3 py-3 text-sm text-muted-foreground"
                    role="status"
                >
                    Tidak ada keahlian yang cocok.
                </p>
            ) : (
                options.map((option) => (
                    <button
                        key={option.id}
                        type="button"
                        role="option"
                        id={`${id}-${option.id}`}
                        aria-selected={
                            options[activeOptionIndex]?.id === option.id
                        }
                        tabIndex={-1}
                        className={cn(
                            'flex min-h-11 w-full cursor-pointer items-start gap-3 rounded-lg px-3 py-3 text-left text-sm outline-none hover:bg-muted focus-visible:bg-muted',
                            options[activeOptionIndex]?.id === option.id &&
                                'bg-accent text-accent-foreground',
                        )}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => onSelect(option)}
                    >
                        <span className="min-w-0">
                            <span className="block font-medium wrap-anywhere">
                                {option.name}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                                {option.category}
                            </span>
                        </span>
                    </button>
                ))
            )}
        </div>
    );
}
