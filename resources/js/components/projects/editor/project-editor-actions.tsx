import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type { ProjectDetail } from '@/types/project';
import type { EditorMode } from './editor-utils';

type Props = {
    mode: EditorMode;
    isProcessing: boolean;
    uncertainSave: boolean;
    savedDraft: ProjectDetail | null;
    submitIntent: 'draft' | 'open';
    formProcessing: boolean;
    openingProcessing: boolean;
    onSetSubmitIntent: (intent: 'draft' | 'open') => void;
};

export function ProjectEditorActions({
    mode,
    isProcessing,
    uncertainSave,
    savedDraft,
    submitIntent,
    formProcessing,
    openingProcessing,
    onSetSubmitIntent,
}: Props) {
    const disabled = isProcessing || uncertainSave || savedDraft !== null;

    return (
        <footer className="flex min-w-0 flex-col gap-4 rounded-3xl border border-primary/20 bg-linear-to-br from-card to-background p-5 shadow-md sm:p-6">
            <p className="max-w-xl text-xs leading-5 text-muted-foreground">
                {mode === 'create'
                    ? 'Simpan sebagai draft untuk melanjutkan nanti, atau buka sekarang jika kebutuhan tim sudah siap.'
                    : 'Perubahan disimpan ke proyek ini dan tetap mengikuti status proyek yang sedang berjalan.'}
            </p>
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
                {mode === 'create' && (
                    <Button
                        type="submit"
                        variant="outline"
                        className="h-auto min-h-11 cursor-pointer py-3 whitespace-normal motion-safe:transition-[background-color,border-color,transform] motion-safe:duration-standard motion-safe:active:translate-y-0.5"
                        disabled={disabled}
                        data-test="save-project-draft"
                        onClick={() => onSetSubmitIntent('draft')}
                    >
                        {formProcessing && submitIntent === 'draft' && (
                            <Spinner aria-hidden="true" />
                        )}
                        Simpan sebagai draft
                    </Button>
                )}
                <Button
                    type="submit"
                    className="h-auto min-h-11 cursor-pointer py-3 whitespace-normal shadow-sm hover:shadow-md motion-safe:transition-[background-color,box-shadow,transform] motion-safe:duration-standard motion-safe:active:translate-y-0.5"
                    disabled={disabled}
                    data-test={
                        mode === 'create'
                            ? 'save-open-project'
                            : 'save-project-changes'
                    }
                    onClick={() =>
                        onSetSubmitIntent(mode === 'create' ? 'open' : 'draft')
                    }
                >
                    {isProcessing &&
                        (mode === 'edit' || submitIntent === 'open') && (
                            <Spinner aria-hidden="true" />
                        )}
                    {mode === 'create'
                        ? 'Simpan dan buka proyek'
                        : 'Simpan perubahan'}
                </Button>
            </div>
            <p
                className="min-h-5 text-xs leading-5 font-medium text-primary"
                role="status"
                aria-live="polite"
            >
                {openingProcessing
                    ? 'Membuka draft yang sudah tersimpan...'
                    : formProcessing
                      ? 'Menyimpan proyek...'
                      : null}
            </p>
        </footer>
    );
}
