import { Button } from '@/components/ui/button';
import { operations } from '@/pages/settings/data-rights/_hooks/use-data-rights-form';
import type { Operation } from '@/pages/settings/data-rights/_hooks/use-data-rights-form';

export interface DataRightsOperationsGridProps {
    onSelectOperation: (op: Operation) => void;
    disabled?: boolean;
}

export function DataRightsOperationsGrid({
    onSelectOperation,
    disabled = false,
}: DataRightsOperationsGridProps) {
    return (
        <div className="grid min-w-0 gap-3.5 sm:grid-cols-3">
            {(Object.keys(operations) as Operation[]).map((key) => {
                const item = operations[key];

                return (
                    <section
                        key={key}
                        className="flex min-w-0 flex-col justify-between rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors sm:p-5"
                    >
                        <div className="min-w-0">
                            <header className="flex items-center gap-3">
                                <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-satu-orange-border bg-satu-orange-soft text-satu-orange-ink">
                                    <item.Icon
                                        aria-hidden="true"
                                        className="size-4"
                                    />
                                </span>
                                <h3 className="text-sm leading-snug font-semibold text-foreground sm:text-base">
                                    {item.title}
                                </h3>
                            </header>
                            <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
                                {item.description}
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            className="mt-4 min-h-10 w-full cursor-pointer justify-center text-xs font-medium whitespace-normal disabled:cursor-not-allowed sm:text-sm"
                            disabled={disabled}
                            onClick={() => onSelectOperation(key)}
                        >
                            {item.title}
                        </Button>
                    </section>
                );
            })}
        </div>
    );
}
