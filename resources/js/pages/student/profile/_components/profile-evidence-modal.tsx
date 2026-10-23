import { Plus, Trash2 } from 'lucide-react';
import InputError from '@/components/common/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { UseCapabilityProfileReturn } from '@/pages/student/profile/_hooks/useCapabilityProfile';

export interface ProfileEvidenceModalProps {
    state: UseCapabilityProfileReturn['state'];
    actions: UseCapabilityProfileReturn['actions'];
    helpers: UseCapabilityProfileReturn['helpers'];
}

export function ProfileEvidenceModal({
    state,
    actions,
    helpers,
}: ProfileEvidenceModalProps) {
    const { activeEvidenceSkillIndex: skillIndex, errors } = state;
    const { activeSkill: skill, activeSkillName: skillName } = helpers;

    if (skillIndex === null || !skill) {
        return null;
    }

    const evidenceList = skill.evidence_metadata;
    const isLegacy = evidenceList === undefined;

    return (
        <Dialog
            open={skillIndex !== null}
            onOpenChange={(next) =>
                !next && actions.setActiveEvidenceSkillIndex(null)
            }
        >
            <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Bukti awal: {skillName}</DialogTitle>
                    <DialogDescription>
                        Tautan HTTPS privat untuk dirimu. Belum ditinjau kampus.
                        Berkas dan validasi tetap melalui menu Kontribusi.
                        Maksimal 10 tautan per keahlian.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {isLegacy ? (
                        <div className="space-y-3 rounded-xl border border-border p-4">
                            <p className="text-sm leading-6">
                                Metadata lama tetap tersimpan dan tidak
                                dijadikan tautan aktif. Perubahan lain tidak
                                menghapusnya.
                            </p>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                    actions.replaceLegacyEvidence(skillIndex)
                                }
                            >
                                Ganti bukti lama
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {evidenceList.map((evidence, evidenceIndex) => {
                                const titleKey = `skills.${skillIndex}.evidence_metadata.${evidenceIndex}.title`;
                                const urlKey = `skills.${skillIndex}.evidence_metadata.${evidenceIndex}.url`;

                                return (
                                    <div
                                        key={evidenceIndex}
                                        className="space-y-3 rounded-xl border border-border bg-card p-3"
                                    >
                                        <div className="space-y-2">
                                            <Label
                                                htmlFor={`proof-title-${skillIndex}-${evidenceIndex}`}
                                            >
                                                Judul bukti {evidenceIndex + 1}
                                            </Label>
                                            <Input
                                                id={`proof-title-${skillIndex}-${evidenceIndex}`}
                                                value={evidence.title}
                                                maxLength={120}
                                                required
                                                onChange={(e) =>
                                                    actions.changeEvidence(
                                                        skillIndex,
                                                        evidenceIndex,
                                                        {
                                                            title: e.target
                                                                .value,
                                                        },
                                                    )
                                                }
                                                aria-invalid={Boolean(
                                                    errors[titleKey],
                                                )}
                                                aria-describedby={`proof-title-error-${skillIndex}-${evidenceIndex}`}
                                            />
                                            <InputError
                                                id={`proof-title-error-${skillIndex}-${evidenceIndex}`}
                                                message={errors[titleKey]}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label
                                                htmlFor={`proof-url-${skillIndex}-${evidenceIndex}`}
                                            >
                                                Tautan HTTPS
                                            </Label>
                                            <Input
                                                id={`proof-url-${skillIndex}-${evidenceIndex}`}
                                                type="url"
                                                value={evidence.url}
                                                maxLength={2048}
                                                required
                                                onChange={(e) =>
                                                    actions.changeEvidence(
                                                        skillIndex,
                                                        evidenceIndex,
                                                        {
                                                            url: e.target.value,
                                                        },
                                                    )
                                                }
                                                aria-invalid={Boolean(
                                                    errors[urlKey],
                                                )}
                                                aria-describedby={`proof-url-error-${skillIndex}-${evidenceIndex}`}
                                            />
                                            <InputError
                                                id={`proof-url-error-${skillIndex}-${evidenceIndex}`}
                                                message={errors[urlKey]}
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() =>
                                                actions.removeEvidence(
                                                    skillIndex,
                                                    evidenceIndex,
                                                )
                                            }
                                        >
                                            <Trash2 aria-hidden="true" />
                                            Hapus tautan {evidenceIndex + 1}
                                        </Button>
                                    </div>
                                );
                            })}

                            <Button
                                type="button"
                                variant="outline"
                                disabled={evidenceList.length >= 10}
                                onClick={() => actions.addEvidence(skillIndex)}
                            >
                                <Plus aria-hidden="true" />
                                Tambah tautan
                            </Button>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        onClick={() =>
                            actions.setActiveEvidenceSkillIndex(null)
                        }
                    >
                        Selesai
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
