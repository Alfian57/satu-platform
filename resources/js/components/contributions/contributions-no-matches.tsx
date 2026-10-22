import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ContributionsNoMatchesProps {
    onReset: () => void;
}

export function ContributionsNoMatches({
    onReset,
}: ContributionsNoMatchesProps) {
    return (
        <div
            data-test="contributions-no-matches"
            className="grid justify-items-center gap-3 rounded-3xl border border-dashed border-border bg-card p-8 text-center"
        >
            <Search aria-hidden="true" className="size-8 text-primary" />
            <h3 className="text-title font-semibold">
                Belum ada catatan yang cocok.
            </h3>
            <p className="text-sm text-muted-foreground">
                Coba kata kunci lain atau tampilkan semua status.
            </p>
            <Button variant="outline" onClick={onReset}>
                Atur ulang pencarian
            </Button>
        </div>
    );
}
