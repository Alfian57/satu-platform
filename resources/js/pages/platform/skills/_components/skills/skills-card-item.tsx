import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Skill } from './skills-types';

export function SkillsCardItem({
    item,
    actionBusy,
    needsCheck,
    onEdit,
    onDelete,
}: {
    item: Skill;
    actionBusy: boolean;
    needsCheck: boolean;
    onEdit: (skill: Skill) => void;
    onDelete: (skill: Skill) => void;
}) {
    return (
        <article className="grid min-w-0 gap-4 py-5 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div className="min-w-0">
                <h3 className="text-lg font-bold wrap-anywhere">{item.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    {item.category}
                </p>
                <Badge
                    className="mt-2"
                    variant={item.isVerified ? 'verified' : 'pending'}
                >
                    {item.isVerified
                        ? 'Disetujui dalam katalog'
                        : 'Perlu tinjauan katalog'}
                </Badge>
                <p className="mt-2 text-sm leading-6 wrap-anywhere text-muted-foreground">
                    {item.description || 'Belum ada uraian.'}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                    {item.profileSkillsCount} profil.{' '}
                    {item.projectRoleSkillsCount} kebutuhan peran.
                </p>
            </div>
            <div className="flex flex-wrap items-start gap-2">
                <Button
                    variant="outline"
                    disabled={actionBusy || needsCheck}
                    onClick={() => onEdit(item)}
                >
                    Ubah
                </Button>
                <Button
                    variant="outline"
                    disabled={actionBusy || needsCheck}
                    onClick={() => onDelete(item)}
                >
                    Hapus
                </Button>
            </div>
        </article>
    );
}
