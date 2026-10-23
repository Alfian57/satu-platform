import { Link } from '@inertiajs/react';
import { FileCheck2, FileUp, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatFileSize } from '@/pages/contributions/_utils/contribution-helpers';
import { workspace as projectWorkspace } from '@/routes/projects';
import type { ContributionProjectOption } from '@/types/contribution';

export interface ComposerEvidenceSectionProps {
    mode: 'create' | 'revision';
    selectedProject: ContributionProjectOption | null;
    evidence: number[];
    processing: boolean;
    blocked: boolean;
    evidenceError?: string;
    onToggleEvidence: (attachmentId: number) => void;
}

export function ComposerEvidenceSection({
    mode,
    selectedProject,
    evidence,
    processing,
    blocked,
    evidenceError,
    onToggleEvidence,
}: ComposerEvidenceSectionProps) {
    return (
        <fieldset
            aria-describedby={
                evidenceError
                    ? `contribution-${mode}-evidence-hint contribution-${mode}-evidence-error`
                    : `contribution-${mode}-evidence-hint`
            }
            aria-invalid={Boolean(evidenceError)}
            className="grid min-w-0 gap-5 border-y border-border/70 px-1 py-6"
        >
            <legend className="px-2 text-xs font-semibold text-primary">
                03. Bukti dan pernyataan
            </legend>
            <h2 className="text-xl leading-snug font-bold tracking-tight">
                Lengkapi dengan bukti pekerjaanmu.
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
                Pilih berkas dari ruang kerja proyek. Jelaskan hubungan bukti
                dengan bagian pekerjaanmu. Berkas bersama bukan bukti bahwa
                semua pekerjaan tim milikmu. Bukti tidak dipublikasikan ke
                portofolio.
            </p>
            <details
                className="rounded-2xl border border-border bg-accent/30 p-4"
                data-test="contribution-evidence-guidance"
            >
                <summary className="min-h-11 cursor-pointer text-sm font-semibold focus-visible:outline-2 focus-visible:outline-ring">
                    Apa yang perlu dijelaskan dalam bukti?
                </summary>
                <ul className="mt-3 list-inside list-disc space-y-2 text-sm leading-6 text-muted-foreground">
                    <li>
                        Bagian yang kamu kerjakan dan hasil yang dapat
                        diperiksa, misalnya dokumen, desain, atau catatan
                        pengujian.
                    </li>
                    <li>
                        Kaitkan berkas dengan klaim individual. Nyatakan batas
                        peranmu bila memakai hasil bersama.
                    </li>
                    <li>
                        Pastikan kamu berhak mengirim berkas dan tidak
                        memasukkan data pribadi atau rahasia yang tidak
                        diperlukan.
                    </li>
                </ul>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Ini panduan teknis, bukan standar bukti final kampus. Kampus
                    dapat meminta perbaikan. Validasi menilai kontribusi versi
                    tertentu, bukan seluruh keahlian atau jaminan kualitas
                    mutlak. Tidak ada janji waktu pemeriksaan.
                </p>
            </details>
            {selectedProject === null ||
            selectedProject.evidence.length === 0 ? (
                <div
                    className="grid min-w-0 gap-3 rounded-2xl border border-dashed border-border bg-background/65 p-4 sm:p-5"
                    data-test="contribution-evidence-empty"
                >
                    <div className="flex items-start gap-3">
                        <FileUp
                            aria-hidden="true"
                            className="mt-1 size-5 shrink-0 text-primary"
                        />
                        <div className="grid gap-1">
                            <p className="font-semibold">
                                Belum ada bukti pekerjaan
                            </p>
                            <p className="text-sm leading-6 text-muted-foreground">
                                Kamu boleh menyimpan draft tanpa bukti. Unggah
                                berkas di ruang kerja proyek sebelum mengirim
                                untuk validasi.
                            </p>
                        </div>
                    </div>
                    {selectedProject !== null && (
                        <Link
                            href={projectWorkspace(selectedProject.id).url}
                            className="inline-flex min-h-11 w-fit cursor-pointer items-center gap-2 rounded-sm text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                            data-test="contribution-open-workspace"
                        >
                            <FolderOpen aria-hidden="true" className="size-4" />
                            Buka ruang kerja proyek
                        </Link>
                    )}
                </div>
            ) : (
                <div
                    className="grid max-h-80 min-w-0 auto-rows-max content-start gap-3 overflow-y-auto rounded-2xl p-1"
                    data-test="contribution-evidence-list"
                >
                    {selectedProject.evidence.map((item) => {
                        const checked = evidence.includes(item.id);

                        return (
                            <label
                                key={item.id}
                                className={cn(
                                    'flex min-h-16 min-w-0 items-start gap-3 rounded-2xl border p-4 motion-safe:transition-colors motion-safe:duration-standard',
                                    processing ||
                                        blocked ||
                                        (!checked && evidence.length >= 20)
                                        ? 'cursor-not-allowed opacity-60'
                                        : 'cursor-pointer hover:border-primary/30 hover:bg-accent/40',
                                    checked
                                        ? 'border-primary/40 bg-accent'
                                        : 'border-border bg-card shadow-sm',
                                )}
                            >
                                <input
                                    type="checkbox"
                                    className="mt-1 size-4 cursor-pointer accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed"
                                    checked={checked}
                                    disabled={
                                        processing ||
                                        blocked ||
                                        (!checked && evidence.length >= 20)
                                    }
                                    onChange={() => onToggleEvidence(item.id)}
                                    data-test={`contribution-evidence-${item.id}`}
                                />
                                <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-semibold wrap-anywhere">
                                        {item.original_name}
                                    </span>
                                    <span className="mt-1 block text-xs wrap-anywhere text-muted-foreground">
                                        {item.mime_type} ·{' '}
                                        {formatFileSize(item.size_bytes)}
                                    </span>
                                </span>
                                {checked && (
                                    <FileCheck2
                                        aria-label="Bukti dipilih"
                                        className="mt-0.5 size-4 shrink-0 text-verified"
                                    />
                                )}
                            </label>
                        );
                    })}
                </div>
            )}
            <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                <span role="status" aria-live="polite">
                    Bukti dipilih: {evidence.length}/20
                </span>
                <span id={`contribution-${mode}-evidence-hint`}>
                    {evidence.length >= 20
                        ? 'Batas 20 berkas tercapai. Lepas pilihan untuk menggantinya.'
                        : 'Bukti wajib saat dikirim untuk validasi.'}
                </span>
            </div>
            {evidenceError && (
                <p
                    id={`contribution-${mode}-evidence-error`}
                    className="text-sm text-correction-subtle-foreground"
                >
                    {evidenceError}
                </p>
            )}
        </fieldset>
    );
}
