import InputError from '@/components/common/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { TaskPriority } from '@/types';
import {
    firstError,
    priorityLabels,
    priorityOptions,
    selectClassName,
    textAreaClassName,
} from './workspace-utils';
import type { CreateTaskData, ErrorMap } from './workspace-utils';

export function TaskFormFields({
    data,
    errors,
    processing,
    onChange,
    idPrefix,
}: {
    data: CreateTaskData;
    errors: ErrorMap;
    processing: boolean;
    onChange: (field: keyof CreateTaskData, value: string) => void;
    idPrefix: string;
}) {
    const titleError = firstError(errors, 'title');
    const descriptionError = firstError(errors, 'description');
    const priorityError = firstError(errors, 'priority');
    const dueAtError = firstError(errors, 'due_at');

    return (
        <div className="grid gap-5">
            <div className="grid gap-2">
                <label
                    htmlFor={`${idPrefix}-title`}
                    className="text-sm font-semibold"
                >
                    Judul tugas
                </label>
                <Input
                    id={`${idPrefix}-title`}
                    data-test={`${idPrefix}-title`}
                    value={data.title}
                    onChange={(event) => onChange('title', event.target.value)}
                    maxLength={160}
                    disabled={processing}
                    aria-invalid={Boolean(titleError)}
                    aria-describedby={`${idPrefix}-title-error`}
                    placeholder="Contoh: Susun alur onboarding"
                />
                <InputError
                    id={`${idPrefix}-title-error`}
                    message={titleError}
                />
            </div>

            <div className="grid gap-2">
                <label
                    htmlFor={`${idPrefix}-description`}
                    className="text-sm font-semibold"
                >
                    Catatan kerja
                </label>
                <textarea
                    id={`${idPrefix}-description`}
                    data-test={`${idPrefix}-description`}
                    className={textAreaClassName}
                    value={data.description}
                    onChange={(event) =>
                        onChange('description', event.target.value)
                    }
                    maxLength={5000}
                    disabled={processing}
                    aria-invalid={Boolean(descriptionError)}
                    aria-describedby={`${idPrefix}-description-help ${idPrefix}-description-error`}
                    placeholder="Konteks singkat, hasil yang diharapkan, atau catatan handoff"
                />
                <InputError
                    id={`${idPrefix}-description-error`}
                    message={descriptionError}
                />
                <p
                    id={`${idPrefix}-description-help`}
                    className="text-sm leading-6 text-muted-foreground"
                >
                    Jelaskan hasil, bagian pekerjaanmu dan koordinasi dengan
                    rekan. Bukti serta pengakuan individual tetap diajukan
                    melalui Kontribusi.
                </p>
                <details
                    className="rounded-2xl border border-primary/15 bg-accent/40 p-3"
                    data-test={`${idPrefix}-collaboration-guidance`}
                >
                    <summary className="min-h-11 cursor-pointer rounded-xl px-2 py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                        Contoh pembagian pekerjaan
                    </summary>
                    <p className="px-2 text-sm leading-6 text-muted-foreground">
                        Satu anggota menyusun hasil, anggota lain memeriksanya
                        melalui tugas terpisah. Tentukan penanggung jawab
                        setelah tugas tersimpan. Contoh hanya mengisi catatan
                        yang kosong dan tidak membuat tugas lain otomatis.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 px-2 pb-1">
                        <Button
                            type="button"
                            variant="outline"
                            className="min-h-11 max-w-full bg-white whitespace-normal"
                            disabled={
                                processing || Boolean(data.description.trim())
                            }
                            onClick={() =>
                                onChange(
                                    'description',
                                    'Hasil yang diharapkan: rancangan satu halaman panduan.\nBagian saya: menyusun alur dan isi awal.\nKoordinasi dengan rekan: sepakati anggota yang memeriksa kejelasan melalui tugas pemeriksaan terpisah.\nBukti hasil: unggah rancangan dan jelaskan bagian individual pada Kontribusi.',
                                )
                            }
                            data-test={`${idPrefix}-example-create`}
                        >
                            Contoh penyusunan hasil
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="min-h-11 max-w-full bg-white whitespace-normal"
                            disabled={
                                processing || Boolean(data.description.trim())
                            }
                            onClick={() =>
                                onChange(
                                    'description',
                                    'Hasil yang diharapkan: catatan pemeriksaan panduan.\nBagian saya: memeriksa kejelasan informasi dan menuliskan usulan perbaikan.\nKoordinasi dengan rekan: baca hasil penyusun dan sepakati perbaikan yang diperlukan.\nBukti hasil: unggah catatan pemeriksaan dan jelaskan bagian individual pada Kontribusi.',
                                )
                            }
                            data-test={`${idPrefix}-example-review`}
                        >
                            Contoh pemeriksaan rekan
                        </Button>
                    </div>
                </details>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
                <div className="grid gap-2">
                    <label
                        htmlFor={`${idPrefix}-priority`}
                        className="text-sm font-semibold"
                    >
                        Prioritas
                    </label>
                    <select
                        id={`${idPrefix}-priority`}
                        data-test={`${idPrefix}-priority`}
                        className={selectClassName}
                        value={data.priority}
                        onChange={(event) =>
                            onChange(
                                'priority',
                                event.target.value as TaskPriority,
                            )
                        }
                        disabled={processing}
                        aria-invalid={Boolean(priorityError)}
                        aria-describedby={`${idPrefix}-priority-error`}
                    >
                        {priorityOptions.map((priority) => (
                            <option key={priority} value={priority}>
                                {priorityLabels[priority]}
                            </option>
                        ))}
                    </select>
                    <InputError
                        id={`${idPrefix}-priority-error`}
                        message={priorityError}
                    />
                </div>

                <div className="grid gap-2">
                    <label
                        htmlFor={`${idPrefix}-due-at`}
                        className="text-sm font-semibold"
                    >
                        Batas waktu
                    </label>
                    <Input
                        id={`${idPrefix}-due-at`}
                        data-test={`${idPrefix}-due-at`}
                        type="datetime-local"
                        value={data.due_at}
                        onChange={(event) =>
                            onChange('due_at', event.target.value)
                        }
                        disabled={processing}
                        aria-invalid={Boolean(dueAtError)}
                        aria-describedby={`${idPrefix}-due-at-error`}
                    />
                    <InputError
                        id={`${idPrefix}-due-at-error`}
                        message={dueAtError}
                    />
                </div>
            </div>
        </div>
    );
}
