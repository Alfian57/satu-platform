import InputError from '@/components/common/input-error';
import { Label } from '@/components/ui/label';
import type { ProjectFormRole } from '@/types/project';
import { selectClassName, textAreaClassName } from './editor-utils';

type Props = {
    index: number;
    acceptsBeginners: boolean | null;
    selectionCriteria: string;
    isProcessing: boolean;
    beginnerError?: string;
    criteriaError?: string;
    onUpdateRole: (index: number, patch: Partial<ProjectFormRole>) => void;
};

export function RoleCriteriaFields({
    index,
    acceptsBeginners,
    selectionCriteria,
    isProcessing,
    beginnerError,
    criteriaError,
    onUpdateRole,
}: Props) {
    return (
        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <div className="grid min-w-0 gap-1.5">
                <Label htmlFor={`project-role-${index}-beginner`} optional>
                    Penerimaan pemula
                </Label>
                <select
                    id={`project-role-${index}-beginner`}
                    className={selectClassName}
                    value={
                        acceptsBeginners === null
                            ? 'unspecified'
                            : acceptsBeginners
                              ? 'yes'
                              : 'no'
                    }
                    disabled={isProcessing}
                    onChange={(event) =>
                        onUpdateRole(index, {
                            accepts_beginners:
                                event.target.value === 'unspecified'
                                    ? null
                                    : event.target.value === 'yes',
                        })
                    }
                    aria-invalid={Boolean(beginnerError)}
                    aria-describedby={`project-role-${index}-beginner-help project-role-${index}-beginner-error`}
                >
                    <option value="unspecified">Belum dinyatakan</option>
                    <option value="yes">Menerima pemula</option>
                    <option value="no">Membutuhkan pengalaman</option>
                </select>
                <div className="grid min-w-0 gap-0.5">
                    <p
                        id={`project-role-${index}-beginner-help`}
                        className="text-xs leading-normal text-muted-foreground"
                    >
                        Nyatakan kebutuhan peran. Jangan mensyaratkan jumlah
                        relasi atau popularitas. Pemula tetap mengikuti kriteria
                        yang kamu jelaskan.
                    </p>
                    <InputError
                        id={`project-role-${index}-beginner-error`}
                        message={beginnerError}
                    />
                </div>
            </div>
            <div className="grid min-w-0 gap-1.5">
                <Label htmlFor={`project-role-${index}-criteria`} optional>
                    Kriteria pemilihan
                </Label>
                <textarea
                    id={`project-role-${index}-criteria`}
                    className={textAreaClassName}
                    value={selectionCriteria}
                    maxLength={2000}
                    disabled={isProcessing}
                    onChange={(event) =>
                        onUpdateRole(index, {
                            selection_criteria: event.target.value,
                        })
                    }
                    placeholder="Kemampuan, minat dan waktu yang dibutuhkan, serta dukungan belajar untuk pemula."
                    aria-invalid={Boolean(criteriaError)}
                    aria-describedby={`project-role-${index}-criteria-help project-role-${index}-criteria-error`}
                />
                <div className="grid min-w-0 gap-0.5">
                    <p
                        id={`project-role-${index}-criteria-help`}
                        className="text-xs leading-normal text-muted-foreground"
                    >
                        Maksimal 2000 karakter. Jelaskan kebutuhan kerja, bukan
                        kepribadian, IPK atau jumlah teman. Ini bukan skor atau
                        keputusan otomatis.
                    </p>
                    <InputError
                        id={`project-role-${index}-criteria-error`}
                        message={criteriaError}
                    />
                </div>
            </div>
        </div>
    );
}
