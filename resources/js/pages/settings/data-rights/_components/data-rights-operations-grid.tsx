import { Button } from '@/components/ui/button';
import ExportUserData from '@/pages/settings/_components/export-user-data';
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
        <div className="grid min-w-0 gap-4 lg:grid-cols-2">
            <ExportUserData />
            {(Object.keys(operations) as Operation[]).map((key) => {
                const item = operations[key];

                return (
                    <section
                        key={key}
                        className="grid min-w-0 content-between gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
                    >
                        <div className="min-w-0">
                            <span className="grid size-10 place-items-center rounded-xl border border-satu-orange-border bg-satu-orange-soft text-satu-orange-ink">
                                <item.Icon
                                    aria-hidden="true"
                                    className="size-5"
                                />
                            </span>
                            <h3 className="mt-3 text-lg font-semibold">
                                {item.title}
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                {item.description}
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            className="min-h-11 w-full cursor-pointer whitespace-normal disabled:cursor-not-allowed"
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
