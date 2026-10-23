import { Link } from '@inertiajs/react';
import {
    BookOpenCheck,
    CheckCircle2,
    Clock3,
    ExternalLink,
    LockKeyhole,
    ShieldCheck,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { editableEvidence, safeEvidenceUrl } from '@/lib/student-capabilities';
import type { CapabilityProfile } from '@/lib/student-capabilities';
import { DashboardArchiveArt } from '@/pages/dashboard/_components/dashboard-archive-art';
import { show as showContribution } from '@/routes/contributions';

export interface ProfileContributionsSectionProps {
    approvedSources: {
        id: number;
        title: string;
        version: number;
        can_view: boolean;
        verification_label: string;
    }[];
    savedProfile: CapabilityProfile | null;
    missing?: string[];
    refreshing: boolean;
}

export function ProfileContributionsSection({
    approvedSources,
    savedProfile,
    refreshing,
}: ProfileContributionsSectionProps) {
    const savedEvidenceList =
        savedProfile?.skills.flatMap((skill) =>
            (editableEvidence(skill.evidence_metadata) ?? [])
                .filter((evidence) => safeEvidenceUrl(evidence.url))
                .map((evidence) => ({
                    skillName: skill.name,
                    taxonomyId: skill.taxonomy_id,
                    ...evidence,
                })),
        ) ?? [];

    return (
        <div className="min-w-0 space-y-6">
            <section
                aria-label="Kesiapan dan bukti pribadi"
                className="settings-help grid min-w-0 content-start gap-5 rounded-2xl border border-satu-orange-border/80 p-5 sm:p-6"
            >
                <div className="flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full border border-satu-orange-border bg-card text-satu-orange-ink shadow-2xs">
                        <ShieldCheck aria-hidden="true" className="size-5" />
                    </span>
                    <div className="min-w-0">
                        <h2 className="text-base font-semibold text-foreground sm:text-lg">
                            Kesiapan dan bukti pribadi
                        </h2>
                    </div>
                </div>

                <div className="grid gap-5 text-sm leading-6 text-muted-foreground">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                            <Clock3
                                aria-hidden="true"
                                className="size-4 shrink-0 text-primary"
                            />
                            <h3 className="font-semibold text-foreground">
                                Mulai tanpa karya
                            </h3>
                        </div>
                        <p className="text-sm leading-6 text-muted-foreground">
                            Tidak ada syarat karya terdahulu, jumlah relasi, XP
                            atau kontribusi disetujui untuk menelusuri peluang.
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                            <LockKeyhole
                                aria-hidden="true"
                                className="size-4 shrink-0 text-primary"
                            />
                            <h3 className="font-semibold text-foreground">
                                Bukti pribadi tersimpan
                            </h3>
                        </div>
                        <p className="text-sm leading-6 text-muted-foreground">
                            Tautan awal belum ditinjau dan tidak dibagikan ke
                            kampus, tim atau publik. Akses di situs tujuan tetap
                            diatur penyedianya.
                        </p>
                        {savedEvidenceList.length > 0 ? (
                            <ul className="space-y-2 pt-1">
                                {savedEvidenceList.map((evidence, idx) => (
                                    <li
                                        key={`${evidence.taxonomyId}-${idx}`}
                                        className="min-w-0 rounded-xl border border-border/80 bg-card p-3 shadow-2xs"
                                    >
                                        <p className="text-xs text-muted-foreground">
                                            Belum ditinjau. {evidence.skillName}
                                        </p>
                                        <a
                                            href={evidence.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-1 inline-flex min-h-9 max-w-full cursor-pointer items-center gap-1.5 text-xs font-semibold wrap-anywhere text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                                        >
                                            {evidence.title}
                                            <ExternalLink
                                                aria-hidden="true"
                                                className="size-3.5 shrink-0"
                                            />
                                            <span className="sr-only">
                                                {' '}
                                                (situs eksternal, tab baru)
                                            </span>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-xs leading-normal text-muted-foreground">
                                Belum ada tautan awal yang dapat ditampilkan.
                                Bukti tidak wajib.
                            </p>
                        )}
                    </div>
                </div>

                {refreshing && (
                    <div
                        aria-busy="true"
                        aria-label="Memuat profil tersimpan"
                        className="space-y-2 rounded-xl border border-border/60 bg-card/60 p-3"
                    >
                        <p
                            role="status"
                            className="text-xs font-medium text-muted-foreground"
                        >
                            Memuat data profil...
                        </p>
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                )}
            </section>

            <section
                aria-label="Sumber kontribusi"
                className="grid min-w-0 content-start gap-5 rounded-2xl border border-border bg-card p-5 shadow-xs sm:p-6"
            >
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-full border border-primary/20 bg-primary/10 text-primary">
                            <BookOpenCheck
                                aria-hidden="true"
                                className="size-5"
                            />
                        </span>
                        <h2 className="text-base font-semibold text-foreground sm:text-lg">
                            Sumber kontribusi
                        </h2>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                        Maksimal lima kontribusi disetujui terbaru. Persetujuan
                        berlaku pada kontribusi tersebut, bukan seluruh keahlian
                        pemilik.
                    </p>
                </div>

                {approvedSources.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-accent/25 px-4 py-6 text-center">
                        <div className="mb-3 flex size-12 items-center justify-center rounded-xl border border-border/60 bg-card shadow-2xs">
                            <DashboardArchiveArt className="size-8 text-primary/40" />
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                            Belum ada kontribusi disetujui
                        </p>
                        <p className="mt-1 max-w-[260px] text-sm leading-6 text-muted-foreground">
                            Ini bukan penghalang untuk mulai mencari peran atau
                            berkolaborasi.
                        </p>
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {approvedSources.map((source) => (
                            <li
                                key={source.id}
                                className="group min-w-0 space-y-2 rounded-xl border border-border/80 bg-background/60 p-3.5 transition-colors hover:border-primary/40 hover:bg-background"
                            >
                                <h3 className="text-sm font-semibold wrap-anywhere text-foreground">
                                    {source.title}
                                </h3>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <CheckCircle2
                                        aria-hidden="true"
                                        className="size-3.5 shrink-0 text-emerald-600"
                                    />
                                    <span>
                                        {source.verification_label} &middot;
                                        Versi {source.version}
                                    </span>
                                </div>
                                {source.can_view && (
                                    <div className="pt-0.5">
                                        <Link
                                            href={showContribution(source.id)}
                                            className="inline-flex min-h-8 cursor-pointer items-center gap-1 text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                                        >
                                            <span>Baca kontribusi</span>
                                            <span aria-hidden="true">
                                                &rarr;
                                            </span>
                                        </Link>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}
