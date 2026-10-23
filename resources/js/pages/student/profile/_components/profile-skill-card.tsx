import { ExternalLink, Trash2 } from 'lucide-react';
import InputError from '@/components/common/input-error';
import { Button } from '@/components/ui/button';
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
    levels: Record<Proficiency, string>;
    actions: {
        removeSkill: (index: number) => void | Promise<void>;
        setActiveEvidenceSkillIndex: (index: number) => void;
    };
}

export function ProfileSkillCard({
    skill,
    index,
    skillName,
    busy,
    error,
    levels,
    actions,
}: ProfileSkillCardProps) {
    return (
        <article className="min-w-0 space-y-3 rounded-2xl border border-border bg-background/70 p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold wrap-anywhere">
                            {skillName}
                        </h3>
                        <span className="inline-flex items-center rounded-lg border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            {levels[skill.proficiency]}
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
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

            {error && <InputError message={error} />}

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
