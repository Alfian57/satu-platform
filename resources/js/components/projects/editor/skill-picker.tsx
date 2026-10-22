import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSkillPicker } from '@/hooks/use-skill-picker';
import type { ProjectSkill } from '@/types/project';
import { SelectedSkillsList } from './selected-skills-list';
import { SkillPickerListbox } from './skill-picker-listbox';

type Props = {
    roleIndex: number;
    skills: ProjectSkill[];
    onAdd: (skill: ProjectSkill) => void;
    onRemove: (taxonomyId: number) => void;
    validationError?: string;
};

export function SkillPicker({
    roleIndex,
    skills,
    onAdd,
    onRemove,
    validationError,
}: Props) {
    const listboxId = `project-role-${roleIndex}-skills-listbox`;
    const {
        query,
        setQuery,
        open,
        setOpen,
        availableOptions,
        activeOptionIndex,
        isProcessing,
        hasError,
        selectSkill,
        clearQuery,
        handleKeyDown,
    } = useSkillPicker({
        skills,
        onAdd,
        listboxId,
    });

    return (
        <div className="grid min-w-0 gap-2">
            <Label
                htmlFor={`project-role-${roleIndex}-skill-search`}
                className="text-xs text-muted-foreground"
            >
                Keahlian minimum
            </Label>
            <div className="relative">
                <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                    id={`project-role-${roleIndex}-skill-search`}
                    data-test={`project-role-${roleIndex}-skill-search`}
                    role="combobox"
                    aria-autocomplete="list"
                    aria-controls={listboxId}
                    aria-expanded={open}
                    aria-invalid={Boolean(validationError)}
                    aria-describedby={
                        validationError
                            ? `project-role-${roleIndex}-skills-error`
                            : undefined
                    }
                    aria-activedescendant={
                        open &&
                        !isProcessing &&
                        availableOptions[activeOptionIndex]
                            ? `${listboxId}-${availableOptions[activeOptionIndex].id}`
                            : undefined
                    }
                    className="h-11 pr-11 pl-9"
                    placeholder="Cari keahlian dari daftar SATU"
                    value={query}
                    onChange={(event) => {
                        setQuery(event.target.value);
                        setOpen(true);
                    }}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setOpen(true)}
                    onBlur={() => window.setTimeout(() => setOpen(false), 120)}
                />
                {query !== '' && (
                    <button
                        type="button"
                        aria-label="Hapus pencarian keahlian"
                        className="absolute top-1/2 right-0 inline-flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={clearQuery}
                    >
                        <X aria-hidden="true" className="size-4" />
                    </button>
                )}
                <SkillPickerListbox
                    id={listboxId}
                    open={open}
                    isSearching={isProcessing}
                    hasError={hasError}
                    query={query}
                    options={availableOptions}
                    activeOptionIndex={activeOptionIndex}
                    onSelect={selectSkill}
                />
            </div>
            <SelectedSkillsList
                skills={skills}
                onUpdate={onAdd}
                onRemove={onRemove}
            />
        </div>
    );
}
