import { ClipboardList, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function WorkspaceEmptyState({
    filtered,
    onCreate,
    onResetFilters,
    canCreate,
}: {
    filtered: boolean;
    onCreate: () => void;
    onResetFilters: () => void;
    canCreate: boolean;
}) {
    return (
        <div
            data-test="workspace-empty-state"
            className="grid gap-4 border-y border-border px-4 py-10 text-center sm:px-8"
        >
            <ClipboardList
                aria-hidden="true"
                className="mx-auto size-8 text-primary"
            />
            <div className="grid gap-2">
                <h3 className="text-lg font-semibold">
                    {filtered
                        ? 'Tidak ada tugas yang cocok dengan filter'
                        : 'Belum ada tugas di workspace'}
                </h3>
                <p className="mx-auto max-w-[52ch] text-sm leading-6 text-muted-foreground">
                    {filtered
                        ? 'Coba ubah kata kunci atau bersihkan filter untuk melihat seluruh catatan kerja proyek.'
                        : 'Mulai dari satu pekerjaan yang jelas. Tim dapat memperbarui status, penanggung jawab, prioritas, dan due date tanpa bergantung pada koneksi realtime.'}
                </p>
            </div>
            {filtered ? (
                <Button
                    type="button"
                    variant="outline"
                    className="mx-auto w-fit cursor-pointer"
                    onClick={onResetFilters}
                    data-test="workspace-empty-reset"
                >
                    Bersihkan filter
                </Button>
            ) : (
                <Button
                    type="button"
                    className="mx-auto w-fit cursor-pointer"
                    onClick={onCreate}
                    disabled={!canCreate}
                    data-test="workspace-empty-create"
                >
                    <Plus aria-hidden="true" />
                    Buat tugas pertama
                </Button>
            )}
        </div>
    );
}
