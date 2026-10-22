import { AcademicProgramFields } from '@/components/academic-program-fields';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { UseCapabilityProfileReturn } from '@/hooks/useCapabilityProfile';

export interface ProfileAcademicSectionProps {
    academicOptions: Record<string, string[]>;
    state: UseCapabilityProfileReturn['state'];
    actions: UseCapabilityProfileReturn['actions'];
}

export function ProfileAcademicSection({
    academicOptions,
    state,
    actions,
}: ProfileAcademicSectionProps) {
    const {
        formData,
        facultyReadOnly,
        programReadOnly,
        admissionYearReadOnly,
        busy,
        errors,
    } = state;

    return (
        <section className="min-w-0 space-y-5 rounded-3xl border border-border bg-card p-5 shadow-md sm:p-6">
            <h2 className="text-xl font-bold">Tentang dirimu</h2>
            {(facultyReadOnly || programReadOnly || admissionYearReadOnly) && (
                <p className="text-sm leading-6 text-muted-foreground">
                    Data akademik yang sudah tercatat bersifat tetap. Bagian
                    yang belum terisi masih dapat dilengkapi.
                </p>
            )}
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                <AcademicProgramFields
                    prefix="capability"
                    options={academicOptions}
                    faculty={formData.faculty}
                    program={formData.study_program}
                    disabled={busy}
                    showOptionalLabel={false}
                    facultyReadOnly={facultyReadOnly}
                    programReadOnly={programReadOnly}
                    errors={errors}
                    onChange={actions.setFacultyAndProgram}
                />
                <div className="min-w-0 space-y-2">
                    <Label htmlFor="capability-year">Angkatan masuk</Label>
                    <Input
                        id="capability-year"
                        type="number"
                        inputMode="numeric"
                        min={1900}
                        max={new Date().getFullYear()}
                        step={1}
                        placeholder="Contoh: 2023"
                        readOnly={admissionYearReadOnly}
                        value={formData.admission_year ?? ''}
                        onChange={(e) =>
                            actions.setAdmissionYear(
                                e.target.value === ''
                                    ? null
                                    : Number(e.target.value),
                            )
                        }
                        aria-invalid={Boolean(errors.admission_year)}
                        aria-describedby="capability-year-help capability-year-error"
                        aria-readonly={admissionYearReadOnly}
                        className={
                            admissionYearReadOnly
                                ? 'cursor-default bg-muted/50'
                                : undefined
                        }
                    />
                    <p
                        id="capability-year-help"
                        className="text-xs leading-5 text-muted-foreground"
                    >
                        {admissionYearReadOnly
                            ? 'Data yang sudah tercatat tidak dapat diubah dari menu mahasiswa.'
                            : 'Tahun pertama masuk kuliah, bukan tingkat studi saat ini. Setelah tercatat, data tidak dapat diubah dari menu mahasiswa.'}
                    </p>
                    <InputError
                        id="capability-year-error"
                        message={errors.admission_year}
                    />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="capability-bio">Cerita singkat</Label>
                <textarea
                    id="capability-bio"
                    value={formData.bio}
                    maxLength={2000}
                    rows={3}
                    className="min-h-28 w-full min-w-0 rounded-xl border border-input bg-card p-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed"
                    onChange={(e) => actions.setBio(e.target.value)}
                    aria-invalid={Boolean(errors.bio)}
                    aria-describedby="capability-bio-help capability-bio-error"
                />
                <p
                    id="capability-bio-help"
                    className="text-xs leading-5 text-muted-foreground"
                >
                    Ceritakan hal yang ingin kamu kerjakan, tanpa perlu menulis
                    kontak pribadi.
                </p>
                <InputError id="capability-bio-error" message={errors.bio} />
            </div>
        </section>
    );
}
