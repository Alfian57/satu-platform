import { Plus, Search, Trash2 } from 'lucide-react';
import type {
    Proficiency,
    UseOnboardingFlowReturn,
} from '@/components/onboarding/_hooks/use-onboarding-flow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';

const proficiencyLabels: Record<Proficiency, string> = {
    beginner: 'Pemula',
    intermediate: 'Menengah',
    advanced: 'Lanjutan',
    expert: 'Mahir',
};

export interface OnboardingSkillsStepProps {
    state: UseOnboardingFlowReturn['state'];
    actions: UseOnboardingFlowReturn['actions'];
    creatingSkill: boolean;
}

export function OnboardingSkillsStep({
    state,
    actions,
    creatingSkill,
}: OnboardingSkillsStepProps) {
    const {
        skills,
        searchQuery,
        searchResults,
        searchLoading,
        searchError,
        busy,
    } = state;

    return (
        <div className="space-y-5">
            <div className="grid gap-2">
                <Label htmlFor="skill-search">Keahlianmu</Label>
                <div className="relative">
                    <Search
                        aria-hidden="true"
                        className="absolute top-4 left-3 size-4 text-slate-500"
                    />
                    <Input
                        id="skill-search"
                        value={searchQuery}
                        onChange={(event) =>
                            actions.setSearchQuery(event.target.value)
                        }
                        placeholder="Cari desain, pemrograman, dan lainnya"
                        aria-describedby="skill-search-help"
                        className="h-12 rounded-xl pl-10"
                        disabled={busy}
                    />
                </div>
                <p
                    id="skill-search-help"
                    className="text-xs leading-5 text-slate-600"
                >
                    Keahlian boleh kosong dan dapat dilengkapi lewat Profil
                    kemampuan. Kamu bisa menambahkan yang belum tersedia.
                </p>
            </div>
            {searchQuery.trim() && (
                <div
                    className="space-y-2 rounded-2xl border border-blue-100 bg-blue-50/50 p-3"
                    aria-label="Hasil pencarian keahlian"
                >
                    {searchLoading && (
                        <p
                            role="status"
                            className="flex items-center gap-2 p-2 text-sm text-slate-600"
                        >
                            <Spinner />
                            Mencari keahlian...
                        </p>
                    )}
                    {searchError && (
                        <p role="alert" className="p-2 text-sm text-red-700">
                            {searchError}
                        </p>
                    )}
                    {!searchLoading &&
                        searchResults.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                disabled={skills.some(
                                    (skill) => skill.taxonomy_id === item.id,
                                )}
                                onClick={() => actions.addSkill(item)}
                                className="flex min-h-11 w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {item.name}
                                <Plus aria-hidden="true" className="size-4" />
                            </button>
                        ))}
                    {!searchLoading &&
                        !searchError &&
                        !searchResults.some(
                            (item) =>
                                item.name.toLowerCase() ===
                                searchQuery.trim().toLowerCase(),
                        ) && (
                            <Button
                                type="button"
                                variant="outline"
                                className="h-auto min-h-11 w-full justify-start text-left whitespace-normal"
                                onClick={actions.createSkill}
                                disabled={creatingSkill}
                            >
                                {creatingSkill ? (
                                    <Spinner />
                                ) : (
                                    <Plus
                                        aria-hidden="true"
                                        className="size-4"
                                    />
                                )}
                                Tambahkan “{searchQuery.trim()}”
                            </Button>
                        )}
                </div>
            )}
            {skills.length > 0 && (
                <ul className="space-y-3">
                    {skills.map((skill) => (
                        <li
                            key={skill.taxonomy_id}
                            className="flex flex-wrap items-center gap-3 rounded-2xl border border-blue-100 bg-white p-3"
                        >
                            <span className="min-w-0 flex-1 text-sm font-semibold break-words text-slate-800">
                                {skill.name}
                            </span>
                            <Select
                                value={skill.proficiency}
                                onValueChange={(value: Proficiency) =>
                                    actions.updateSkillProficiency(
                                        skill.taxonomy_id,
                                        value,
                                    )
                                }
                                disabled={busy}
                            >
                                <SelectTrigger
                                    aria-label={`Tingkat keahlian ${skill.name}`}
                                    className="w-32 rounded-xl"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(proficiencyLabels).map(
                                        ([value, label]) => (
                                            <SelectItem
                                                key={value}
                                                value={value}
                                            >
                                                {label}
                                            </SelectItem>
                                        ),
                                    )}
                                </SelectContent>
                            </Select>
                            <button
                                type="button"
                                onClick={() =>
                                    actions.removeSkill(skill.taxonomy_id)
                                }
                                aria-label={`Hapus keahlian ${skill.name}`}
                                className="flex size-10 cursor-pointer items-center justify-center rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-700"
                            >
                                <Trash2 aria-hidden="true" className="size-4" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
