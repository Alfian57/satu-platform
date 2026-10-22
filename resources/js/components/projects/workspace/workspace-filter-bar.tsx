import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { UseWorkspaceReturn } from '@/hooks/use-workspace';
import type { UseWorkspaceTaskFormReturn } from '@/hooks/use-workspace-task-form';
import type { TaskPriority, TaskStatus, TaskWorkspaceFilters } from '@/types';
import {
    priorityLabels,
    priorityOptions,
    selectClassName,
    statusLabels,
    statusOptions,
} from './workspace-utils';

type Props = {
    workspace: UseWorkspaceReturn;
    taskForm: UseWorkspaceTaskFormReturn;
    filters: TaskWorkspaceFilters;
};

export function WorkspaceFilterBar({ workspace, taskForm, filters }: Props) {
    const { state, actions } = workspace;
    const { filterDraft, isRefreshing, commandBusy } = state;

    function handleScopeChange(scope: 'all' | 'mine' | 'unassigned') {
        if (!actions.confirmDiscard()) {
            return;
        }

        taskForm.actions.setSelectedTaskId(null);
        taskForm.actions.setEditorMode('edit');
        actions.setFilterDraft({
            ...filterDraft,
            scope,
            page: 1,
            task: null,
        });
    }

    return (
        <section
            aria-labelledby="workspace-filters-title"
            className="grid gap-4 border-y border-border py-5"
        >
            <div className="flex items-start gap-3">
                <Filter
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-primary"
                />
                <div className="grid gap-1">
                    <h2
                        id="workspace-filters-title"
                        className="font-label text-label text-muted-foreground"
                    >
                        FILTER TUGAS
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Gunakan filter untuk menemukan pekerjaan tanpa mengubah
                        urutan ledger.
                    </p>
                </div>
            </div>
            <div className="flex flex-wrap gap-2" aria-label="Cakupan tugas">
                {(
                    [
                        ['all', 'Semua tugas'],
                        ['mine', 'Tugas saya'],
                        ['unassigned', 'Belum ditugaskan'],
                    ] as const
                ).map(([scope, label]) => (
                    <Button
                        key={scope}
                        type="button"
                        variant={
                            filters.scope === scope ? 'default' : 'outline'
                        }
                        aria-pressed={filters.scope === scope}
                        disabled={isRefreshing || commandBusy}
                        data-test={`workspace-scope-${scope}`}
                        onClick={() => handleScopeChange(scope)}
                    >
                        {label}
                    </Button>
                ))}
            </div>
            {filters.task !== null && (
                <p className="text-sm text-primary">
                    Sedang melihat satu tugas. Bersihkan filter untuk melihat
                    tugas lainnya.
                </p>
            )}
            <form
                className="grid gap-4 md:grid-cols-[minmax(0,1.5fr)_minmax(10rem,0.7fr)_minmax(10rem,0.7fr)_auto] md:items-end"
                onSubmit={actions.applyFilters}
                data-test="workspace-filters"
            >
                <div className="grid min-w-0 gap-2">
                    <label
                        htmlFor="workspace-search"
                        className="text-sm font-semibold"
                    >
                        Cari tugas
                    </label>
                    <Input
                        id="workspace-search"
                        value={filterDraft.q}
                        onChange={(event) =>
                            actions.setFilterDraft((current) => ({
                                ...current,
                                q: event.target.value,
                                page: 1,
                            }))
                        }
                        placeholder="Judul atau catatan kerja"
                    />
                </div>
                <div className="grid min-w-0 gap-2">
                    <label
                        htmlFor="workspace-status-filter"
                        className="text-sm font-semibold"
                    >
                        Status
                    </label>
                    <select
                        id="workspace-status-filter"
                        className={selectClassName}
                        value={filterDraft.status ?? ''}
                        onChange={(event) =>
                            actions.setFilterDraft((current) => ({
                                ...current,
                                status:
                                    (event.target.value as TaskStatus) || null,
                                page: 1,
                            }))
                        }
                    >
                        <option value="">Semua status</option>
                        {statusOptions.map((status) => (
                            <option key={status} value={status}>
                                {statusLabels[status]}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="grid min-w-0 gap-2">
                    <label
                        htmlFor="workspace-priority-filter"
                        className="text-sm font-semibold"
                    >
                        Prioritas
                    </label>
                    <select
                        id="workspace-priority-filter"
                        className={selectClassName}
                        value={filterDraft.priority ?? ''}
                        onChange={(event) =>
                            actions.setFilterDraft((current) => ({
                                ...current,
                                priority:
                                    (event.target.value as TaskPriority) ||
                                    null,
                                page: 1,
                            }))
                        }
                    >
                        <option value="">Semua prioritas</option>
                        {priorityOptions.map((priority) => (
                            <option key={priority} value={priority}>
                                {priorityLabels[priority]}
                            </option>
                        ))}
                    </select>
                </div>
                <Button
                    type="submit"
                    variant="outline"
                    className="cursor-pointer"
                    disabled={isRefreshing}
                >
                    Terapkan filter
                </Button>
            </form>
        </section>
    );
}
