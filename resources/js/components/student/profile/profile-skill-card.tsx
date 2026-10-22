import { ExternalLink, Trash2 } from 'lucide-react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { Proficiency } from '@/lib/student-capabilities';

export interface ProfileSkillCardProps {
    skill: {
        taxonomy_id: number;
        proficiency: Proficiency;
        evidence_metadata?: unknown[];
    };
    index: number;
    skillName: string;
    busy: boolean;
    error?: string;
    selectClass: string;
    levels: Record<Proficiency, string>;
    actions: {
        removeSkill: (index: number) => void;
        changeSkillProficiency: (
            index: number,
            proficiency: Proficiency,
        ) => void;
        setActiveEvidenceSkillIndex: (index: number) => void;
    };
}

export function ProfileSkillCard({
    skill,
    index,
    skillName,
    busy,
    error,
    selectClass,
    levels,
    actions,
}: ProfileSkillCardProps) {
    return (
        <article className="min-w-0 space-y-4 rounded-2xl border border-border bg-background/70 p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="font-semibold wrap-anywhere">{skillName}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Pernyataan sendiri
                    </p>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={busy}
                    aria-label={`Hapus keahlian ${skillName}`}
                    onClick={() => actions.removeSkill(index)}
                >
                    <Trash2 aria-hidden="true" />
                </Button>
            </div>
            <div className="space-y-2">
                <Label htmlFor={`capability-level-${index}`}>
                    Tingkat kesiapan
                </Label>
                <select
                    id={`capability-level-${index}`}
                    value={skill.proficiency}
                    className={selectClass}
                    disabled={busy}
                    onChange={(e) =>
                        actions.changeSkillProficiency(
                            index,
                            e.target.value as Proficiency,
                        )
                    }
                    aria-invalid={Boolean(error)}
                    aria-describedby={`capability-level-error-${index}`}
                >
                    {Object.entries(levels).map(([value, label]) => (
                        <option key={value} value={value}>
                            {label}
                        </option>
                    ))}
                </select>
                <InputError
                    id={`capability-level-error-${index}`}
                    message={error}
                />
            </div>

            <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-xs text-muted-foreground">
                    {skill.evidence_metadata?.length ?? 0} bukti awal dikaitkan
                </span>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => actions.setActiveEvidenceSkillIndex(index)}
                >
                    <ExternalLink
                        aria-hidden="true"
                        className="mr-1 size-3.5"
                    />
                    Kelola bukti awal
                </Button>
            </div>
        </article>
    );
}
