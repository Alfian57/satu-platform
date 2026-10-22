import { Check } from 'lucide-react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import type { TaskStatus } from '@/types';
import {
    firstError,
    statusLabels,
    statusOptions,
    transitions,
} from './workspace-utils';
import type { ErrorMap } from './workspace-utils';

type Props = {
    currentStatus: TaskStatus;
    canManage: boolean;
    processing: boolean;
    transitionErrors: ErrorMap;
    onTransition: (status: TaskStatus) => void;
};

export function TaskStatusTransitions({
    currentStatus,
    canManage,
    processing,
    transitionErrors,
    onTransition,
}: Props) {
    return (
        <section
            aria-labelledby="task-status-title"
            className="grid gap-3 border-t border-border pt-5"
        >
            <div className="grid gap-1">
                <h4
                    id="task-status-title"
                    className="font-label text-label text-muted-foreground"
                >
                    STATUS PEKERJAAN
                </h4>
                <p className="text-sm text-muted-foreground">
                    Gunakan tombol ini sebagai alternatif keyboard untuk
                    perpindahan status.
                </p>
            </div>
            <div className="flex flex-wrap gap-2">
                {statusOptions.map((status) => {
                    const isCurrent = status === currentStatus;
                    const isAllowed =
                        isCurrent ||
                        transitions[currentStatus].includes(status);

                    return (
                        <Button
                            key={status}
                            type="button"
                            size="sm"
                            variant={isCurrent ? 'default' : 'outline'}
                            className="cursor-pointer"
                            disabled={
                                !canManage ||
                                isCurrent ||
                                !isAllowed ||
                                processing
                            }
                            aria-current={isCurrent ? 'step' : undefined}
                            data-test={`task-status-${status}`}
                            onClick={() => onTransition(status)}
                        >
                            {isCurrent && <Check aria-hidden="true" />}
                            {statusLabels[status]}
                        </Button>
                    );
                })}
            </div>
            <InputError message={firstError(transitionErrors, 'status')} />
        </section>
    );
}
