import { Link } from '@inertiajs/react';
import {
    BookOpenCheck,
    CheckCircle2,
    Clock3,
    ExternalLink,
    LockKeyhole,
} from 'lucide-react';
import { DashboardArchiveArt } from '@/components/dashboard-archive-art';
import { Skeleton } from '@/components/ui/skeleton';
import { editableEvidence, safeEvidenceUrl } from '@/lib/student-capabilities';
import type { CapabilityProfile } from '@/lib/student-capabilities';
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
    missing: string[];
    refreshing: boolean;
}

export function ProfileContributionsSection({
    approvedSources,
    savedProfile,
    missing,
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
        <aside
            className="min-w-0 space-y-5"
            aria-label="Kesiapan dan sumber kemampuan"
        >
            <section className="space-y-4 rounded-3xl border border-primary/15 bg-accent/60 p-5">
                <Clock3 aria-hidden="true" className="text-primary" />
                <h2 className="text-lg font-bold">Mulai tanpa karya</h2>
                <p className="text-sm leading-6 text-muted-foreground">
                    Tidak ada syarat karya terdahulu, jumlah relasi, XP atau
                    kontribusi disetujui untuk menelusuri peluang.
                </p>
                <p className="text-sm font-semibold">
                    {savedProfile === null
                        ? 'Profil belum tersimpan'
                        : missing.length === 0
                          ? 'Bekal pencocokan tersedia'
                          : `Profil tersimpan. Lengkapi ${missing.join(' dan ')} untuk pencocokan.`}
                </p>
                <p className="text-xs leading-5 text-muted-foreground">
                    Kesiapan bukan validasi kompetensi atau jaminan diterima
                    tim. Profil tidak menghitung rekomendasi baru secara
                    otomatis.
                </p>
            </section>

            {refreshing && (
                <section
                    aria-busy="true"
                    aria-label="Memuat profil tersimpan"
                    className="space-y-3"
                >
                    <p role="status" className="text-sm">
                        Memuat data profil...
                    </p>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-20 w-full rounded-2xl" />
                </section>
            )}

            <section className="space-y-4 border-t border-border pt-5">
                <h2 className="flex items-center gap-2 text-lg font-bold">
                    <LockKeyhole
                        aria-hidden="true"
                        className="size-5 text-primary"
                    />
                    Bukti pribadi tersimpan
                </h2>
                <p className="text-xs leading-5 text-muted-foreground">
                    Tautan awal belum ditinjau dan tidak dibagikan ke kampus,
                    tim atau publik. Akses di situs tujuan tetap diatur
                    penyedianya.
                </p>
                <ul className="space-y-3">
                    {savedEvidenceList.map((evidence, idx) => (
                        <li
                            key={`${evidence.taxonomyId}-${idx}`}
                            className="min-w-0 rounded-2xl border border-border bg-card p-4"
                        >
                            <p className="text-xs text-muted-foreground">
                                Belum ditinjau. {evidence.skillName}
                            </p>
                            <a
                                href={evidence.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 inline-flex min-h-11 max-w-full cursor-pointer items-center gap-2 rounded-lg text-sm font-semibold wrap-anywhere text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                            >
                                {evidence.title}
                                <ExternalLink
                                    aria-hidden="true"
                                    className="size-4 shrink-0"
                                />
                                <span className="sr-only">
                                    {' '}
                                    (situs eksternal, tab baru)
                                </span>
                            </a>
                        </li>
                    ))}
                </ul>
                {savedEvidenceList.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                        Belum ada tautan awal yang dapat ditampilkan. Bukti
                        tidak wajib.
                    </p>
                )}
            </section>

            <section className="space-y-4 border-t border-border pt-5">
                <h2 className="flex items-center gap-2 text-lg font-bold">
                    <BookOpenCheck
                        aria-hidden="true"
                        className="size-5 text-primary"
                    />
                    Sumber kontribusi
                </h2>
                <p className="text-xs leading-5 text-muted-foreground">
                    Maksimal lima kontribusi disetujui terbaru. Persetujuan
                    berlaku pada kontribusi tersebut, bukan seluruh keahlian
                    pemilik.
                </p>
                {approvedSources.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border p-4">
                        <DashboardArchiveArt className="mb-3 w-20" />
                        <p className="text-sm leading-6 text-muted-foreground">
                            Belum ada kontribusi disetujui. Ini bukan penghalang
                            untuk mulai mencari peran.
                        </p>
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {approvedSources.map((source) => (
                            <li
                                key={source.id}
                                className="space-y-2 rounded-2xl border border-border bg-card p-4"
                            >
                                <h3 className="font-semibold wrap-anywhere">
                                    {source.title}
                                </h3>
                                <p className="flex items-start gap-2 text-xs leading-5">
                                    <CheckCircle2
                                        aria-hidden="true"
                                        className="size-4 shrink-0 text-primary"
                                    />
                                    {source.verification_label}. Versi{' '}
                                    {source.version}
                                </p>
                                {source.can_view && (
                                    <Link
                                        href={showContribution(source.id)}
                                        className="inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-primary hover:underline focus-visible:rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                                    >
                                        Baca kontribusi
                                    </Link>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </aside>
    );
}
