import { UsersRound } from 'lucide-react';
import { displayProficiency } from '@/components/projects/show/show-utils';
import { beginnerLabel, capacityLabel } from '@/lib/project-opportunities';
import type { ProjectRole } from '@/types/project';

export function ProjectRequirementsSection({
    roles,
    allSkillsCount,
}: {
    roles: ProjectRole[];
    allSkillsCount: number;
}) {
    return (
        <section
            aria-labelledby="project-requirements-title"
            className="grid min-w-0 gap-5 border-t border-border px-1 pt-6"
        >
            <div className="grid gap-2 border-b border-border pb-3">
                <p className="text-xs font-semibold text-primary">
                    Kebutuhan tim
                </p>
                <h2
                    id="project-requirements-title"
                    className="text-title font-semibold"
                >
                    Peran dan keahlian yang dibutuhkan
                </h2>
            </div>
            {roles.length > 0 ? (
                <ol
                    data-test="project-requirements"
                    className="grid min-w-0 gap-3"
                >
                    {roles.map((role, index) => (
                        <li
                            key={role.id}
                            className="grid min-w-0 gap-4 rounded-3xl border border-border bg-linear-to-br from-card to-accent/45 p-5 shadow-sm sm:grid-cols-[2rem_minmax(0,1fr)] sm:p-6"
                        >
                            <span className="font-label text-label text-primary">
                                {String(index + 1).padStart(2, '0')}
                            </span>
                            <div className="min-w-0 space-y-2">
                                <h3 className="text-xl leading-tight font-bold tracking-tight wrap-anywhere">
                                    {role.title}
                                </h3>
                                {role.description && (
                                    <p className="text-sm leading-6 wrap-anywhere whitespace-pre-line text-muted-foreground">
                                        {role.description}
                                    </p>
                                )}
                            </div>
                            <div className="grid min-w-0 gap-3 sm:col-start-2">
                                <p className="flex items-center gap-2 text-sm font-semibold">
                                    <UsersRound
                                        aria-hidden="true"
                                        className="size-4 shrink-0 text-primary"
                                    />
                                    Kapasitas peran: {role.capacity} orang
                                </p>
                                <p className="text-sm font-semibold text-primary">
                                    {beginnerLabel(role.accepts_beginners)}
                                </p>
                                <p className="text-sm leading-6">
                                    {capacityLabel(
                                        role.capacity_stats,
                                        role.capacity,
                                    )}
                                </p>
                                <p className="text-xs leading-5 text-muted-foreground">
                                    Sisa peran tetap dibatasi kapasitas tim.{' '}
                                    {role.capacity_stats?.accepting === false
                                        ? 'Peran ini belum menerima pengajuan baru.'
                                        : ''}
                                </p>
                                <div className="border-t border-border pt-3">
                                    <h4 className="text-sm font-semibold">
                                        Kriteria pemilihan
                                    </h4>
                                    <p className="mt-2 text-sm leading-6 wrap-anywhere whitespace-pre-line text-muted-foreground">
                                        {role.selection_criteria ||
                                            'Kriteria belum dinyatakan oleh pemilik.'}
                                    </p>
                                </div>
                                {role.skills.length > 0 ? (
                                    <ul className="flex min-w-0 flex-wrap gap-1.5">
                                        {role.skills.map((skill) => (
                                            <li
                                                key={skill.taxonomy_id}
                                                className="max-w-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs wrap-anywhere"
                                            >
                                                {skill.name ??
                                                    `Keahlian #${skill.taxonomy_id}`}{' '}
                                                <span className="text-muted-foreground">
                                                    (
                                                    {displayProficiency(
                                                        skill.proficiency,
                                                    )}
                                                    )
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-xs text-muted-foreground">
                                        Keahlian minimum belum dirinci.
                                    </p>
                                )}
                            </div>
                        </li>
                    ))}
                </ol>
            ) : (
                <p className="border-y border-border py-5 text-sm text-muted-foreground">
                    Kebutuhan peran belum tersedia.
                </p>
            )}
            {allSkillsCount > 0 && (
                <p className="text-xs leading-5 text-muted-foreground">
                    {allSkillsCount} keahlian minimum menjadi bagian dari
                    kebutuhan tim proyek ini.
                </p>
            )}
        </section>
    );
}
