import { Plus, Trash2 } from 'lucide-react';
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
    'h-11 w-full min-w-0 cursor-pointer rounded-xl border border-input bg-card px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50';

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
    const { skills, interests } = state.formData;
    const { skillChoice, interestChoice, errors, busy } = state;

    const availableSkills = taxonomies.filter(
        (t) =>
            t.category !== 'interest' &&
            !skills.some((s) => s.taxonomy_id === t.id),
    );
    const availableInterests = taxonomies.filter(
        (t) => t.category === 'interest' && !interests.includes(t.id),
    );

    return (
        <section className="min-w-0 space-y-5 rounded-3xl border border-border bg-card p-5 shadow-md sm:p-6">
            <div className="space-y-2">
                <h2 className="text-xl font-bold">
                    Keahlian yang kamu nyatakan
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                    Pilih sesuai kesiapanmu saat ini. Tingkat ini adalah
                    pernyataan sendiri, bukan hasil validasi kampus.
                </p>
            </div>

            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1 space-y-2">
                    <Label htmlFor="capability-skill-choice">
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
                <Button
                    type="button"
                    variant="outline"
                    className="shrink-0"
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
                        selectClass={selectClass}
                        levels={levels}
                        actions={{
                            removeSkill: actions.removeSkill,
                            changeSkillProficiency:
                                actions.changeSkillProficiency,
                            setActiveEvidenceSkillIndex:
                                actions.setActiveEvidenceSkillIndex,
                        }}
                    />
                ))}
            </div>

            <div className="space-y-4 border-t border-border pt-5">
                <h3 className="text-lg font-semibold">
                    Minat belajar dan kolaborasi
                </h3>
                <p className="text-sm leading-6 text-muted-foreground">
                    Minat tidak berarti kamu sudah menguasainya. Maksimal 20
                    pilihan.
                </p>
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="min-w-0 flex-1 space-y-2">
                        <Label htmlFor="capability-interest-choice">
                            Pilih minat
                        </Label>
                        <select
                            id="capability-interest-choice"
                            value={interestChoice}
                            disabled={busy}
                            onChange={(e) =>
                                actions.setInterestChoice(e.target.value)
                            }
                            className={selectClass}
                        >
                            <option value="">Pilih dari katalog</option>
                            {availableInterests.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        className="shrink-0"
                        disabled={
                            busy || !interestChoice || interests.length >= 20
                        }
                        onClick={actions.addInterest}
                    >
                        <Plus aria-hidden="true" />
                        Tambah minat
                    </Button>
                </div>

                {taxonomies.filter((t) => t.category === 'interest').length ===
                    0 && (
                    <p className="text-sm text-muted-foreground">
                        Katalog minat belum tersedia.
                    </p>
                )}

                <ul className="flex flex-wrap gap-2">
                    {interests.map((id) => (
                        <li
                            key={id}
                            className="flex max-w-full min-w-0 items-center gap-2 rounded-xl border border-border bg-accent px-3 py-1"
                        >
                            <span className="text-sm wrap-anywhere">
                                {lookup.get(id) ?? 'Minat tersimpan'}
                            </span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-6"
                                disabled={busy}
                                aria-label={`Hapus minat ${lookup.get(id) ?? id}`}
                                onClick={() => actions.removeInterest(id)}
                            >
                                <Trash2
                                    aria-hidden="true"
                                    className="size-3.5"
                                />
                            </Button>
                        </li>
                    ))}
                </ul>
                <InputError message={errors.interests} />
            </div>
        </section>
    );
}
