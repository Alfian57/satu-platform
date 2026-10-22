import { LibraryBig, Plus } from 'lucide-react';
import { CampusOperationHeader } from '@/components/campus-operation-layout';
import { Button } from '@/components/ui/button';
import { UniversitySettingsNav } from '@/components/university-settings-nav';
import type { University } from '@/components/university-settings-nav';
import { sheetClass } from './skills-types';
import type { SkillsSummary } from './skills-types';

export function SkillsHeaderBar({
    institution,
    summary,
    actionBusy,
    denied,
    needsCheck,
    message,
    error,
    hasSelection,
    onRefresh,
    onCreate,
}: {
    institution: University;
    summary: SkillsSummary;
    actionBusy: boolean;
    denied: boolean;
    needsCheck: boolean;
    message: string;
    error: string;
    hasSelection: boolean;
    onRefresh: () => void;
    onCreate: () => void;
}) {
    return (
        <div className="space-y-6">
            <CampusOperationHeader
                theme="skills"
                title="Katalog keahlian"
                description="Rapikan istilah kemampuan untuk profil dan kebutuhan peran. Persetujuan katalog tidak memvalidasi keahlian setiap mahasiswa."
                institution={institution.name}
                icon={LibraryBig}
            />
            <UniversitySettingsNav
                institution={institution.id}
                active="skills"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                    {summary.totalSkills} istilah. {summary.verifiedSkills}{' '}
                    disetujui dalam katalog. {summary.unverifiedSkills} perlu
                    tinjauan.
                </p>
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        disabled={actionBusy}
                        onClick={onRefresh}
                    >
                        Periksa katalog terbaru
                    </Button>
                    <Button
                        disabled={actionBusy || denied || needsCheck}
                        onClick={onCreate}
                    >
                        <Plus aria-hidden="true" className="size-4" />
                        Tambah keahlian
                    </Button>
                </div>
            </div>
            {message && (
                <p role="status" className="text-sm text-muted-foreground">
                    {message}
                </p>
            )}
            {error && !hasSelection && (
                <div role="alert" className={sheetClass}>
                    {error}
                </div>
            )}
        </div>
    );
}
