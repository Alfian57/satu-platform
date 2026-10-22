import { useHttp } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import SkillTaxonomyController from '@/actions/App/Http/Controllers/SkillTaxonomyController';
import type {
    Taxonomy,
    TaxonomyResponse,
} from '@/components/projects/editor/editor-utils';
import type { ProjectSkill } from '@/types/project';

export interface UseSkillPickerOptions {
    skills: ProjectSkill[];
    onAdd: (skill: ProjectSkill) => void;
    listboxId: string;
}

export function useSkillPicker({
    skills,
    onAdd,
    listboxId,
}: UseSkillPickerOptions) {
    const request = useHttp<Record<string, never>, TaxonomyResponse>({});
    const [query, setQuery] = useState('');
    const [options, setOptions] = useState<Taxonomy[]>([]);
    const [open, setOpen] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [activeOptionIndex, setActiveOptionIndex] = useState(-1);

    const search = request.get;
    const cancel = request.cancel;

    useEffect(() => {
        if (query.trim() === '') {
            return;
        }

        const timeout = window.setTimeout(() => {
            setHasError(false);
            search(
                SkillTaxonomyController.index({
                    query: { query: query.trim() },
                }).url,
                {
                    onSuccess: (response) => setOptions(response.data),
                    onHttpException: () => {
                        setHasError(true);

                        return false;
                    },
                    onNetworkError: () => {
                        setHasError(true);

                        return false;
                    },
                },
            ).catch(() => undefined);
        }, 180);

        return () => {
            window.clearTimeout(timeout);
            cancel();
        };
    }, [cancel, query, search]);

    const availableOptions = options.filter(
        (option) =>
            option.category !== 'interest' &&
            !skills.some((skill) => skill.taxonomy_id === option.id),
    );

    function selectSkill(option: Taxonomy) {
        onAdd({
            taxonomy_id: option.id,
            name: option.name,
            proficiency: 'intermediate',
        });
        setQuery('');
        setOptions([]);
        setOpen(false);
        setActiveOptionIndex(-1);
    }

    function clearQuery() {
        setQuery('');
        setOptions([]);
    }

    function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'Escape') {
            setOpen(false);
            setActiveOptionIndex(-1);
        } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            setOpen(true);

            if (!request.processing && availableOptions.length > 0) {
                const direction = event.key === 'ArrowDown' ? 1 : -1;
                const nextIndex =
                    activeOptionIndex < 0
                        ? direction === 1
                            ? 0
                            : availableOptions.length - 1
                        : (activeOptionIndex +
                              direction +
                              availableOptions.length) %
                          availableOptions.length;
                setActiveOptionIndex(nextIndex);
                document
                    .getElementById(
                        `${listboxId}-${availableOptions[nextIndex].id}`,
                    )
                    ?.scrollIntoView({ block: 'nearest' });
            }
        } else if (event.key === 'Enter' && open) {
            event.preventDefault();

            if (!request.processing && availableOptions[activeOptionIndex]) {
                selectSkill(availableOptions[activeOptionIndex]);
            }
        }
    }

    return {
        query,
        setQuery,
        open,
        setOpen,
        availableOptions,
        activeOptionIndex,
        isProcessing: request.processing,
        hasError,
        selectSkill,
        clearQuery,
        handleKeyDown,
    };
}
