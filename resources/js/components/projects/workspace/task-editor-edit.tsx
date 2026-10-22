import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type { TaskPriority } from '@/types';
import { TaskFormFields } from './task-form-fields';
import { formatDateTime } from './workspace-utils';
import type {
    CreateTaskData,
    ErrorMap,
    UpdateTaskData,
} from './workspace-utils';

type Props = {
    data: UpdateTaskData;
    errors: ErrorMap;
    processing: boolean;
    canManage: boolean;
    updatedAt: string | null;
    onFieldChange: (
        field: keyof CreateTaskData,
        value: string | TaskPriority,
    ) => void;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export function TaskEditorEdit({
    data,
    errors,
    processing,
    canManage,
    updatedAt,
    onFieldChange,
    onSubmit,
}: Props) {
    return (
        <form
            className="grid gap-6"
            onSubmit={onSubmit}
            data-test="task-edit-form"
        >
            <TaskFormFields
                data={data}
                errors={errors}
                processing={processing}
                onChange={onFieldChange}
                idPrefix="task-edit"
            />
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
                <p className="text-xs leading-5 text-muted-foreground">
                    Terakhir diperbarui {formatDateTime(updatedAt)}
                </p>
                <Button
                    type="submit"
                    className="cursor-pointer"
                    disabled={!canManage || processing}
                    data-test="task-edit-submit"
                >
                    {processing && <Spinner aria-hidden="true" />}
                    <Save aria-hidden="true" />
                    Simpan perubahan
                </Button>
            </div>
        </form>
    );
}
