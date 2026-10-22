import { GraduationCap, LockKeyhole, ShieldCheck } from 'lucide-react';
import { AcademicProgramFields } from '@/components/academic-program-fields';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { UseOnboardingFlowReturn } from '@/hooks/use-onboarding-flow';

export interface OnboardingAffiliationStepProps {
    state: UseOnboardingFlowReturn['state'];
    actions: UseOnboardingFlowReturn['actions'];
    fieldErrors: Record<string, string>;
}

export function OnboardingAffiliationStep({
    state,
    actions,
    fieldErrors,
}: OnboardingAffiliationStepProps) {
    const isVerified = state.membershipStatus === 'verified';
    const hasStoredFaculty = Boolean(state.faculty && isVerified);
    const hasStoredProgram = Boolean(state.studyProgram && isVerified);
    const hasStoredAdmissionYear = Boolean(state.admissionYear && isVerified);

    return (
        <div className="space-y-5">
            {state.hasLegacyAffiliation && !isVerified && (
                <p
                    className="rounded-2xl bg-accent/60 p-4 text-sm leading-6 text-muted-foreground"
                    data-test="onboarding-legacy"
                >
                    Afiliasi akunmu perlu ditinjau. Verifikasi status mahasiswa
                    dengan NIM yang sesuai. Profil, karya dan riwayat tersimpan
                    tidak diubah. Hubungi Admin Universitas jika membutuhkan
                    bantuan.
                </p>
            )}
            {(state.affiliationStatus === 'revision_required' ||
                state.affiliationStatus === 'rejected') && (
                <p
                    role="status"
                    className="rounded-2xl bg-pending-subtle p-4 text-sm leading-6 text-pending-subtle-foreground"
                >
                    {state.notice.description}
                </p>
            )}
            <div className="grid gap-5 sm:grid-cols-2">
                <section
                    className="affiliation-university space-y-2 rounded-2xl border border-primary/15 bg-accent/60 p-4 sm:col-span-2"
                    aria-label="Universitas"
                >
                    <GraduationCap
                        aria-hidden="true"
                        className="affiliation-university-icon"
                    />
                    <div>
                        <p className="text-xs font-semibold text-primary">
                            Universitas
                        </p>
                        <p
                            className="text-base font-bold wrap-anywhere text-foreground"
                            data-test="onboarding-university"
                        >
                            {state.institutionName}
                        </p>
                    </div>
                </section>
                <div className="grid content-start gap-2">
                    <Label htmlFor="nim">
                        Nomor Induk Mahasiswa
                        {!isVerified && (
                            <span
                                aria-hidden="true"
                                className="affiliation-required-marker"
                            >
                                *
                            </span>
                        )}
                    </Label>
                    <Input
                        id="nim"
                        value={state.nim}
                        onChange={(event) => actions.setNim(event.target.value)}
                        placeholder="NIM terdaftar"
                        maxLength={50}
                        required={!isVerified}
                        readOnly={isVerified}
                        aria-invalid={Boolean(state.error)}
                        aria-describedby={
                            state.error
                                ? 'onboarding-nim-help onboarding-error'
                                : 'onboarding-nim-help'
                        }
                        className="h-12 rounded-xl"
                    />
                    <p
                        id="onboarding-nim-help"
                        className="text-sm leading-6 text-muted-foreground"
                    >
                        {isVerified
                            ? 'Afiliasi sudah terverifikasi. NIM tidak diubah melalui profil.'
                            : 'Gunakan NIM yang tercatat pada roster mahasiswa.'}
                    </p>
                </div>
                <div className="grid content-start gap-2">
                    <Label htmlFor="admission_year">
                        Angkatan masuk
                        {!hasStoredAdmissionYear && (
                            <span
                                aria-hidden="true"
                                className="affiliation-required-marker"
                            >
                                *
                            </span>
                        )}
                    </Label>
                    <Input
                        id="admission_year"
                        type="number"
                        required
                        inputMode="numeric"
                        min={1900}
                        max={new Date().getFullYear()}
                        step={1}
                        placeholder="Contoh: 2023"
                        readOnly={hasStoredAdmissionYear}
                        value={state.admissionYear}
                        onChange={(event) =>
                            actions.setAdmissionYear(event.target.value)
                        }
                        disabled={state.busy}
                        aria-readonly={hasStoredAdmissionYear}
                        aria-invalid={Boolean(fieldErrors.admission_year)}
                        aria-describedby="admission-year-help admission-year-error"
                        className={`h-12 rounded-xl ${hasStoredAdmissionYear ? 'cursor-default bg-muted/50' : ''}`}
                    />
                    <p
                        id="admission-year-help"
                        className="text-xs leading-5 text-muted-foreground"
                    >
                        {hasStoredAdmissionYear
                            ? 'Data yang sudah tercatat tidak dapat diubah dari menu mahasiswa.'
                            : 'Tahun pertama masuk kuliah, bukan tingkat studi saat ini.'}
                    </p>
                    <InputError
                        id="admission-year-error"
                        message={fieldErrors.admission_year}
                    />
                </div>
                <AcademicProgramFields
                    prefix="onboarding"
                    showOptionalLabel={false}
                    showRequiredMark
                    conciseHelp
                    required
                    options={state.academicOptions}
                    faculty={state.faculty}
                    program={state.studyProgram}
                    disabled={state.busy}
                    facultyReadOnly={hasStoredFaculty}
                    programReadOnly={hasStoredProgram}
                    errors={fieldErrors}
                    onChange={(nextFaculty, nextProgram) => {
                        actions.setFaculty(nextFaculty);
                        actions.setStudyProgram(nextProgram);
                    }}
                />
                <p className="affiliation-academic-note flex items-start gap-2 text-xs leading-5 text-slate-600 sm:col-span-2">
                    <LockKeyhole
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0"
                    />
                    Fakultas, program studi, dan angkatan masuk tidak dapat
                    diubah dari menu mahasiswa setelah dikirim. Periksa kembali
                    sebelum mengajukan.
                </p>
                <p className="affiliation-match-note flex items-start gap-2 rounded-2xl bg-blue-50 p-4 text-sm leading-6 text-blue-900 sm:col-span-2">
                    <ShieldCheck
                        aria-hidden="true"
                        className="mt-1 size-4 shrink-0"
                    />
                    NIM dan nomor WhatsApp terverifikasi digunakan untuk
                    mencocokkan afiliasimu dengan data kampus.
                </p>
            </div>
        </div>
    );
}
