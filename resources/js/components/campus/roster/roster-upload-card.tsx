import { FileUp, LoaderCircle, UploadCloud } from 'lucide-react';
import type { FormEvent } from 'react';
import { campusControlClass } from '@/components/campus-operation-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export function RosterUploadCard({
    form,
    isCommitting,
    onSubmit,
}: {
    form: {
        data: { file: File | null; semester: string };
        setData: (
            key: 'file' | 'semester',
            value: File | string | null,
        ) => void;
        errors: Partial<Record<'file' | 'semester', string>>;
        processing: boolean;
    };
    isCommitting: boolean;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
    return (
        <section
            aria-labelledby="roster-upload-heading"
            className="@container min-w-0 rounded-3xl border border-border bg-white p-4 shadow-sm sm:p-5"
        >
            <div className="flex items-center gap-2 border-b border-border pb-4">
                <UploadCloud className="size-5 text-primary" />
                <div>
                    <h2
                        id="roster-upload-heading"
                        className="text-base font-bold text-foreground"
                    >
                        Impor Roster Baru
                    </h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        Gunakan berkas CSV dengan kolom NIM, nama, program
                        studi, angkatan, semester, nomor telepon, dan status
                        aktif.
                    </p>
                </div>
            </div>

            <form onSubmit={onSubmit} className="mt-5 grid gap-5">
                <div className="grid min-w-0 gap-4 @min-[32rem]:grid-cols-[minmax(0,1fr)_minmax(0,0.7fr)]">
                    <div className="space-y-1.5">
                        <Label
                            htmlFor="roster-file"
                            className="text-sm font-semibold text-foreground"
                        >
                            Berkas CSV mahasiswa
                        </Label>
                        <Input
                            id="roster-file"
                            disabled={form.processing || isCommitting}
                            type="file"
                            accept=".csv,text/csv,text/plain"
                            onChange={(event) =>
                                form.setData(
                                    'file',
                                    event.currentTarget.files?.[0] ?? null,
                                )
                            }
                            aria-describedby="roster-file-help roster-file-error"
                            aria-invalid={Boolean(form.errors.file)}
                            className={cn(
                                campusControlClass,
                                'cursor-pointer file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-1 file:text-sm file:font-semibold file:text-primary',
                            )}
                        />
                        <p
                            id="roster-file-help"
                            className="text-xs text-muted-foreground"
                        >
                            Maksimum 10 MB. Format .csv atau .txt.
                        </p>
                        {form.errors.file && (
                            <p
                                id="roster-file-error"
                                className="text-xs font-semibold text-correction-subtle-foreground"
                            >
                                {form.errors.file}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label
                            htmlFor="roster-semester"
                            className="text-sm font-semibold text-foreground"
                        >
                            Label Semester
                        </Label>
                        <Input
                            id="roster-semester"
                            disabled={form.processing || isCommitting}
                            aria-describedby={
                                form.errors.semester
                                    ? 'roster-semester-error'
                                    : undefined
                            }
                            value={form.data.semester}
                            placeholder="Contoh: 2026/2027 Ganjil"
                            onChange={(event) =>
                                form.setData(
                                    'semester',
                                    event.currentTarget.value,
                                )
                            }
                            aria-invalid={Boolean(form.errors.semester)}
                            className={campusControlClass}
                        />
                        {form.errors.semester && (
                            <p
                                id="roster-semester-error"
                                role="alert"
                                className="text-xs font-semibold text-correction-subtle-foreground"
                            >
                                {form.errors.semester}
                            </p>
                        )}
                    </div>
                </div>

                <Button
                    type="submit"
                    disabled={form.processing || isCommitting}
                    className="min-h-11 w-full cursor-pointer justify-self-end rounded-xl bg-primary px-5 text-xs font-semibold text-white shadow-sm hover:bg-primary/90 disabled:cursor-not-allowed sm:w-auto"
                >
                    {form.processing ? (
                        <LoaderCircle
                            aria-hidden="true"
                            className="mr-1.5 size-3.5 animate-spin motion-reduce:animate-none"
                        />
                    ) : (
                        <FileUp
                            aria-hidden="true"
                            className="mr-1.5 size-3.5"
                        />
                    )}
                    {form.processing
                        ? 'Menyiapkan pratinjau...'
                        : 'Tinjau Berkas'}
                </Button>
            </form>
        </section>
    );
}
