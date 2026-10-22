import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProjectSkill } from '@/types/project';
import { proficiencyOptions, selectClassName } from './editor-utils';

type Props = {
    skills: ProjectSkill[];
    onUpdate: (skill: ProjectSkill) => void;
    onRemove: (taxonomyId: number) => void;
};

export function SelectedSkillsList({ skills, onUpdate, onRemove }: Props) {
    if (skills.length === 0) {
        return null;
    }

    return (
        <ul className="grid min-w-0 gap-2" aria-label="Keahlian terpilih">
            {skills.map((skill) => (
                <li
                    key={skill.taxonomy_id}
                    className="grid min-w-0 gap-3 rounded-xl border border-border bg-card p-3 sm:grid-cols-[minmax(0,1fr)_8rem_auto] sm:items-center"
                >
                    <span className="min-w-0 text-sm font-medium wrap-anywhere">
                        {skill.name ?? `Keahlian #${skill.taxonomy_id}`}
                    </span>
                    <select
                        aria-label={`Tingkat keahlian ${skill.name ?? skill.taxonomy_id}`}
                        className={cn(selectClassName, 'h-11')}
                        value={skill.proficiency}
                        onChange={(event) =>
                            onUpdate({
                                ...skill,
                                proficiency: event.target.value,
                            })
                        }
                    >
                        {proficiencyOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        aria-label={`Hapus keahlian ${skill.name ?? skill.taxonomy_id}`}
                        className="inline-flex size-11 cursor-pointer items-center justify-center rounded-xl text-muted-foreground hover:bg-correction-subtle hover:text-correction-subtle-foreground"
                        onClick={() => onRemove(skill.taxonomy_id)}
                    >
                        <X aria-hidden="true" className="size-4" />
                    </button>
                </li>
            ))}
        </ul>
    );
}
