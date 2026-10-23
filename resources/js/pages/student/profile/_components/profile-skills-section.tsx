import { Plus } from 'lucide-react';
import InputError from '@/components/common/input-error';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { Proficiency } from '@/lib/student-capabilities';
import { ProfileSkillCard } from '@/pages/student/profile/_components/profile-skill-card';
import type { UseCapabilityProfileReturn } from '@/pages/student/profile/_hooks/useCapabilityProfile';

const levels: Record<Proficiency, string> = {
    beginner: 'Pemula',
    intermediate: 'Menengah',
    advanced: 'Lanjutan',
    expert: 'Mahir',
};

const selectClass =
    'h-11 w-full min-w-0 cursor-pointer rounded-xl border border-input bg-card pl-4 pr-10 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50';

export interface ProfileSkillsSectionProps {
    taxonomies: { id: number; name: string; category: string }[];
    state: UseCapabilityProfileReturn['state'];
    actions: UseCapabilityProfileReturn['actions'];
    lookup: Map<number, string>;
}

export function ProfileSkillsSection({
    taxonomies,
    state,
    actions,
    lookup,
}: ProfileSkillsSectionProps) {
    const { skills } = state.formData;
    const { skillChoice, proficiencyChoice, errors, busy } = state;

    const availableSkills = taxonomies.filter(
        (t) =>
            t.category !== 'interest' &&
            !skills.some((s) => s.taxonomy_id === t.id),
    );

    return (
        <section className="min-w-0 space-y-5 rounded-3xl border border-border bg-card p-5 shadow-md sm:p-6">
            <div className="space-y-1">
                <h2 className="text-xl font-bold">
                    Keahlian yang kamu nyatakan
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                    Pilih sesuai kesiapanmu saat ini. Tingkat ini adalah
                    pernyataan sendiri, bukan hasil validasi kampus.
                </p>
            </div>

            <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
                <div className="grid min-w-0 gap-1.5">
                    <Label htmlFor="capability-skill-choice" required>
                        Pilih keahlian
                    </Label>
                    <select
                        id="capability-skill-choice"
                        className={selectClass}
                        value={skillChoice}
                        disabled={busy}
                        onChange={(e) => actions.setSkillChoice(e.target.value)}
                    >
                        <option value="">Pilih dari katalog</option>
                        {availableSkills.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="grid min-w-0 gap-1.5">
                    <Label htmlFor="capability-proficiency-choice" required>
                        Tingkat kesiapan
                    </Label>
                    <select
                        id="capability-proficiency-choice"
                        className={selectClass}
                        value={proficiencyChoice}
                        disabled={busy}
                        onChange={(e) =>
                            actions.setProficiencyChoice(
                                e.target.value as Proficiency,
                            )
                        }
                    >
                        {Object.entries(levels).map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    className="h-11 shrink-0 cursor-pointer disabled:cursor-not-allowed"
                    disabled={busy || !skillChoice || skills.length >= 30}
                    onClick={actions.addSkill}
                >
                    <Plus aria-hidden="true" />
                    Tambah keahlian
                </Button>
            </div>

            {taxonomies.filter((t) => t.category !== 'interest').length ===
                0 && (
                <p className="text-sm text-muted-foreground">
                    Katalog keahlian belum tersedia. Kamu tetap dapat menyimpan
                    informasi profil.
                </p>
            )}
            {skills.length === 0 && (
                <p className="rounded-2xl border border-dashed border-border p-4 text-sm leading-6 text-muted-foreground">
                    Belum memilih keahlian? Kamu dapat mulai dari minat dan
                    mencari peluang secara langsung.
                </p>
            )}
            <InputError message={errors.skills} />

            <div className="space-y-4">
                {skills.map((skill, index) => (
                    <ProfileSkillCard
                        key={skill.taxonomy_id}
                        skill={skill}
                        index={index}
                        skillName={
                            lookup.get(skill.taxonomy_id) ??
                            'Keahlian tersimpan'
                        }
                        busy={busy}
                        error={errors[`skills.${index}.proficiency`]}
                        levels={levels}
                        actions={{
                            removeSkill: actions.removeSkill,
                            setActiveEvidenceSkillIndex:
                                actions.setActiveEvidenceSkillIndex,
                        }}
                    />
                ))}
            </div>
        </section>
    );
}
