import type { RefObject } from 'react';
import { SkillsCardItem } from './skills-card-item';
import { sheetClass } from './skills-types';
import type { Skill } from './skills-types';

export function SkillsListSection({
    skills,
    busy,
    actionBusy,
    needsCheck,
    headingRef,
    onEdit,
    onDelete,
}: {
    skills: Skill[];
    busy: boolean;
    actionBusy: boolean;
    needsCheck: boolean;
    headingRef: RefObject<HTMLHeadingElement | null>;
    onEdit: (skill: Skill) => void;
    onDelete: (skill: Skill) => void;
}) {
    return (
        <section aria-busy={busy} className={sheetClass}>
            <h2 ref={headingRef} tabIndex={-1} className="text-xl font-bold">
                Istilah dan penggunaannya
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Hitungan profil dan peran hanya pada universitas ini, bukan skor
                kompetensi atau popularitas.
            </p>
            <div className="mt-3 divide-y divide-border">
                {skills.length ? (
                    skills.map((item) => (
                        <SkillsCardItem
                            key={item.id}
                            item={item}
                            actionBusy={actionBusy}
                            needsCheck={needsCheck}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    ))
                ) : (
                    <p className="py-6 text-sm text-muted-foreground">
                        Belum ada istilah pada filter ini. Ubah filter atau
                        tambah keahlian secara eksplisit.
                    </p>
                )}
            </div>
        </section>
    );
}
