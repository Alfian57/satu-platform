import InputError from '@/components/common/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { errorMessage, textAreaClassName } from './editor-utils';
import type { FormErrorMap } from './editor-utils';

type Props = {
    title: string;
    description: string;
    errors: FormErrorMap;
    onTitleChange: (value: string) => void;
    onDescriptionChange: (value: string) => void;
};

export function ProjectEditorBasicInfo({
    title,
    description,
    errors,
    onTitleChange,
    onDescriptionChange,
}: Props) {
    const titleError = errorMessage(errors, 'title');
    const descriptionError = errorMessage(errors, 'description');

    return (
        <section className="grid min-w-0 gap-5 rounded-3xl border border-primary/20 bg-card p-5 shadow-md sm:p-7">
            <div>
                <p className="text-xs font-semibold text-primary">
                    01. Informasi proyek
                </p>
                <h2 className="mt-2 text-2xl leading-tight font-bold tracking-tight">
                    Apa yang akan dikerjakan bersama?
                </h2>
            </div>

            <div className="grid min-w-0 gap-2">
                <Label htmlFor="project-title">Judul proyek</Label>
                <Input
                    id="project-title"
                    aria-describedby={
                        titleError ? 'project-title-error' : undefined
                    }
                    data-test="project-title"
                    aria-invalid={titleError !== undefined}
                    value={title}
                    onChange={(event) => onTitleChange(event.target.value)}
                    placeholder="Contoh: Portal kontribusi mahasiswa"
                    maxLength={160}
                    required
                />
                <InputError id="project-title-error" message={titleError} />
            </div>

            <div className="grid min-w-0 gap-2">
                <Label htmlFor="project-description">
                    Tujuan dan hasil proyek
                </Label>
                <textarea
                    id="project-description"
                    aria-describedby={
                        descriptionError
                            ? 'project-description-error'
                            : undefined
                    }
                    data-test="project-description"
                    aria-invalid={descriptionError !== undefined}
                    className={textAreaClassName}
                    value={description}
                    onChange={(event) =>
                        onDescriptionChange(event.target.value)
                    }
                    placeholder="Jelaskan tujuan, ruang lingkup, dan hasil yang diharapkan."
                    maxLength={5000}
                />
                <InputError
                    id="project-description-error"
                    message={descriptionError}
                />
            </div>
        </section>
    );
}
