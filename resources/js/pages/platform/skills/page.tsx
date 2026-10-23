import { Head } from '@inertiajs/react';
import { AppPage } from '@/layouts/_components/app-page';
import { SkillsDialog } from '@/pages/platform/skills/_components/skills/skills-dialog';
import { SkillsFilterForm } from '@/pages/platform/skills/_components/skills/skills-filter-form';
import { SkillsHeaderBar } from '@/pages/platform/skills/_components/skills/skills-header-bar';
import { SkillsListSection } from '@/pages/platform/skills/_components/skills/skills-list-section';
import { sheetClass } from '@/pages/platform/skills/_components/skills/skills-types';
import type { SkillsProps } from '@/pages/platform/skills/_components/skills/skills-types';
import { usePlatformSkills } from '@/pages/platform/skills/_hooks/use-platform-skills';

export default function Skills(props: SkillsProps) {
    const { state, actions, refs } = usePlatformSkills(props);

    return (
        <AppPage>
            <Head title="Katalog keahlian" />
            <div className="grid min-w-0 gap-6" data-test="university-skills">
                <SkillsHeaderBar
                    institution={props.institution}
                    summary={props.summary}
                    actionBusy={state.actionBusy}
                    denied={state.denied}
                    needsCheck={state.needsCheck}
                    message={state.message}
                    error={state.error}
                    hasSelection={!!state.selection}
                    onRefresh={() => actions.read()}
                    onCreate={() => actions.open({ mode: 'create' })}
                />

                <SkillsFilterForm
                    q={state.q}
                    category={state.category}
                    status={state.status}
                    categories={props.categories}
                    actionBusy={state.actionBusy}
                    onQChange={actions.setQ}
                    onCategoryChange={actions.setCategory}
                    onStatusChange={actions.setStatus}
                    onApply={() => actions.read(true)}
                />

                {state.denied ? (
                    <div role="alert" className={sheetClass}>
                        Akses tidak tersedia. Katalog sebelumnya disembunyikan;
                        masuk ulang atau periksa izin.
                    </div>
                ) : (
                    <SkillsListSection
                        skills={props.skills}
                        busy={state.busy}
                        actionBusy={state.actionBusy}
                        needsCheck={state.needsCheck}
                        headingRef={refs.heading}
                        onEdit={(skill) =>
                            actions.open({ mode: 'edit', skill })
                        }
                        onDelete={(skill) =>
                            actions.open({ mode: 'delete', skill })
                        }
                    />
                )}

                {state.actionBusy && (
                    <p role="status" className="text-sm text-muted-foreground">
                        {state.form.processing
                            ? 'Menyimpan katalog.'
                            : 'Memuat katalog terbaru.'}
                    </p>
                )}
            </div>

            <SkillsDialog
                selection={state.selection}
                actionBusy={state.actionBusy}
                needsCheck={state.needsCheck}
                error={state.error}
                form={state.form}
                headingRef={refs.heading}
                feedbackRef={refs.feedback}
                onClose={actions.close}
                onSave={actions.save}
                onRefresh={() => actions.read()}
            />
        </AppPage>
    );
}
