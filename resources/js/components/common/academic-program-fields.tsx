import InputError from '@/components/common/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
    prefix: string;
    options: Record<string, string[]>;
    faculty: string;
    program: string;
    disabled?: boolean;
    required?: boolean;
    showOptionalLabel?: boolean;
    showRequiredMark?: boolean;
    conciseHelp?: boolean;
    facultyReadOnly?: boolean;
    programReadOnly?: boolean;
    errors?: { faculty?: string; study_program?: string };
    onChange: (faculty: string, program: string) => void;
};
const selectClass =
    'h-12 w-full min-w-0 cursor-pointer rounded-xl border border-input bg-card pl-4 pr-10 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50';

export function AcademicProgramFields({
    prefix,
    options,
    faculty,
    program,
    disabled = false,
    required = false,
    showOptionalLabel = true,
    showRequiredMark = false,
    conciseHelp = false,
    facultyReadOnly = false,
    programReadOnly = false,
    errors = {},
    onChange,
}: Props) {
    const programs = Object.hasOwn(options, faculty) ? options[faculty] : [];
    const legacy = program !== '' && !programs.includes(program);
    const unavailable = Object.keys(options).length === 0;
    const readOnlyClass =
        'h-12 w-full min-w-0 cursor-default rounded-xl border border-input bg-muted/50 px-4 text-base text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

    return (
        <div className="grid min-w-0 gap-4 sm:col-span-2 sm:grid-cols-2">
            <div className="grid min-w-0 content-start gap-1.5">
                <Label
                    htmlFor={`${prefix}-faculty`}
                    required={showRequiredMark && required && !facultyReadOnly}
                    optional={
                        showOptionalLabel &&
                        (!required || !showRequiredMark) &&
                        !facultyReadOnly
                    }
                >
                    Fakultas
                </Label>
                {facultyReadOnly ? (
                    <Input
                        id={`${prefix}-faculty`}
                        placeholder="Contoh: Sains dan Teknologi"
                        value={faculty}
                        readOnly
                        disabled={disabled}
                        className={readOnlyClass}
                        aria-readonly="true"
                        aria-invalid={Boolean(errors.faculty)}
                        aria-describedby={`${prefix}-faculty-help ${prefix}-faculty-error`}
                    />
                ) : (
                    <select
                        id={`${prefix}-faculty`}
                        required={required}
                        value={Object.hasOwn(options, faculty) ? faculty : ''}
                        disabled={disabled || unavailable}
                        className={selectClass}
                        aria-invalid={Boolean(errors.faculty)}
                        aria-describedby={`${prefix}-faculty-help ${prefix}-faculty-error`}
                        onChange={(event) =>
                            onChange(
                                event.target.value,
                                programReadOnly ? program : '',
                            )
                        }
                    >
                        <option value="">Pilih fakultas</option>
                        {Object.keys(options).map((name) => (
                            <option key={name} value={name}>
                                {name}
                            </option>
                        ))}
                    </select>
                )}
                <div className="grid min-w-0 gap-0.5">
                    <p
                        id={`${prefix}-faculty-help`}
                        className="text-xs leading-normal text-muted-foreground"
                    >
                        {facultyReadOnly
                            ? 'Data yang sudah tercatat tidak dapat diubah dari menu mahasiswa.'
                            : unavailable
                              ? 'Daftar fakultas belum tersedia. Coba muat ulang halaman.'
                              : conciseHelp
                                ? 'Pilih fakultas untuk menampilkan program studi.'
                                : 'Pilih fakultas untuk melihat program studi yang sesuai.'}
                    </p>
                    <InputError
                        id={`${prefix}-faculty-error`}
                        message={errors.faculty}
                    />
                </div>
            </div>
            <div className="grid min-w-0 content-start gap-1.5">
                <Label
                    htmlFor={`${prefix}-program`}
                    required={showRequiredMark && required && !programReadOnly}
                    optional={
                        showOptionalLabel &&
                        (!required || !showRequiredMark) &&
                        !programReadOnly
                    }
                >
                    Program studi
                </Label>
                {programReadOnly ? (
                    <Input
                        id={`${prefix}-program`}
                        placeholder="Contoh: Informatika"
                        value={program}
                        readOnly
                        disabled={disabled}
                        className={readOnlyClass}
                        aria-readonly="true"
                        aria-invalid={Boolean(errors.study_program)}
                        aria-describedby={`${prefix}-program-help ${prefix}-program-error`}
                    />
                ) : (
                    <select
                        id={`${prefix}-program`}
                        required={required}
                        value={programs.includes(program) ? program : ''}
                        disabled={disabled || programs.length === 0}
                        className={selectClass}
                        aria-invalid={Boolean(errors.study_program)}
                        aria-describedby={`${prefix}-program-help ${prefix}-program-error`}
                        onChange={(event) =>
                            onChange(faculty, event.target.value)
                        }
                    >
                        <option value="">
                            {faculty
                                ? 'Pilih program studi'
                                : 'Pilih fakultas terlebih dahulu'}
                        </option>
                        {programs.map((name) => (
                            <option key={name} value={name}>
                                {name}
                            </option>
                        ))}
                    </select>
                )}
                <div className="grid min-w-0 gap-0.5">
                    <p
                        id={`${prefix}-program-help`}
                        className="text-xs leading-normal text-muted-foreground"
                    >
                        {programReadOnly
                            ? 'Data yang sudah tercatat tidak dapat diubah dari menu mahasiswa.'
                            : legacy
                              ? `Data lama tersimpan: ${program}. Pilih fakultas dan program studi untuk memperbaruinya.`
                              : conciseHelp
                                ? 'Pilih program studi beserta jenjangnya.'
                                : 'Pilih program studi beserta jenjangnya. Ini bukan verifikasi akademik.'}
                    </p>
                    <InputError
                        id={`${prefix}-program-error`}
                        message={errors.study_program}
                    />
                </div>
            </div>
        </div>
    );
}
