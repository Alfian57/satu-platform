import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TaskPage } from '@/types';

type Props = {
    tasks: TaskPage;
    isRefreshing: boolean;
    onChangePage: (page: number) => void;
};

export function WorkspaceTaskPagination({
    tasks,
    isRefreshing,
    onChangePage,
}: Props) {
    if (tasks.meta.last_page <= 1) {
        return null;
    }

    return (
        <nav
            aria-label="Navigasi halaman task"
            className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between"
        >
            <p className="text-sm text-muted-foreground">
                Halaman {tasks.meta.current_page} dari {tasks.meta.last_page}
            </p>
            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                    disabled={isRefreshing || tasks.meta.current_page <= 1}
                    onClick={() => onChangePage(tasks.meta.current_page - 1)}
                >
                    <ChevronLeft aria-hidden="true" />
                    Sebelumnya
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                    disabled={
                        isRefreshing ||
                        tasks.meta.current_page >= tasks.meta.last_page
                    }
                    onClick={() => onChangePage(tasks.meta.current_page + 1)}
                >
                    Berikutnya
                    <ChevronRight aria-hidden="true" />
                </Button>
            </div>
        </nav>
    );
}
