import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type { TaskPriority } from '@/types';
import { TaskFormFields } from './task-form-fields';
import type { CreateTaskData, ErrorMap } from './workspace-utils';

type Props = {
    data: CreateTaskData;
    errors: ErrorMap;
    processing: boolean;
    canWrite: boolean;
    onFieldChange: (
        field: keyof CreateTaskData,
        value: string | TaskPriority,
    ) => void;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export function TaskEditorCreate({
    data,
    errors,
    processing,
    canWrite,
    onFieldChange,
    onSubmit,
}: Props) {
    return (
        <form
            className="grid gap-6 p-4 sm:p-6"
            onSubmit={onSubmit}
            data-test="task-create-form"
        >
            <TaskFormFields
                data={data}
                errors={errors}
                processing={processing}
                onChange={onFieldChange}
                idPrefix="task-create"
            />
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
                <p className="text-xs leading-5 text-muted-foreground">
                    Tenggat tugas tidak boleh melewati tenggat proyek.
                </p>
                <Button
                    type="submit"
                    className="cursor-pointer"
                    disabled={!canWrite || processing}
                    data-test="task-create-submit"
                >
                    {processing && <Spinner aria-hidden="true" />}
                    <Plus aria-hidden="true" />
                    Tambahkan tugas
                </Button>
            </div>
        </form>
    );
}
