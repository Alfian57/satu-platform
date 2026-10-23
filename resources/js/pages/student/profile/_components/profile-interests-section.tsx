import { Plus, Trash2 } from 'lucide-react';
import InputError from '@/components/common/input-error';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { UseCapabilityProfileReturn } from '@/pages/student/profile/_hooks/useCapabilityProfile';

const selectClass =
    'h-11 w-full min-w-0 cursor-pointer rounded-xl border border-input bg-card pl-4 pr-10 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50';

export interface ProfileInterestsSectionProps {
    taxonomies: { id: number; name: string; category: string }[];
    state: UseCapabilityProfileReturn['state'];
    actions: UseCapabilityProfileReturn['actions'];
    lookup: Map<number, string>;
}

export function ProfileInterestsSection({
    taxonomies,
    state,
    actions,
    lookup,
}: ProfileInterestsSectionProps) {
    const { interests } = state.formData;
    const { interestChoice, errors, busy } = state;

    const availableInterests = taxonomies.filter(
        (t) => t.category === 'interest' && !interests.includes(t.id),
    );

    return (
        <section className="min-w-0 space-y-5 rounded-3xl border border-border bg-card p-5 shadow-md sm:p-6">
            <div className="space-y-1">
                <h2 className="text-xl font-bold">
                    Minat belajar dan kolaborasi
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                    Minat tidak berarti kamu sudah menguasainya. Maksimal 20
                    pilihan.
                </p>
            </div>

            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end">
                <div className="grid min-w-0 flex-1 gap-1.5">
                    <Label htmlFor="capability-interest-choice" optional>
                        Pilih minat
                    </Label>
                    <select
                        id="capability-interest-choice"
                        value={interestChoice}
                        disabled={busy}
                        onChange={(e) =>
                            actions.setInterestChoice(e.target.value)
                        }
                        className={selectClass}
                    >
                        <option value="">Pilih dari katalog</option>
                        {availableInterests.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.name}
                            </option>
                        ))}
                    </select>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    className="h-11 shrink-0 cursor-pointer disabled:cursor-not-allowed"
                    disabled={busy || !interestChoice || interests.length >= 20}
                    onClick={actions.addInterest}
                >
                    <Plus aria-hidden="true" />
                    Tambah minat
                </Button>
            </div>

            {taxonomies.filter((t) => t.category === 'interest').length ===
                0 && (
                <p className="text-sm text-muted-foreground">
                    Katalog minat belum tersedia.
                </p>
            )}

            <ul className="flex flex-wrap gap-2">
                {interests.map((id) => (
                    <li
                        key={id}
                        className="flex max-w-full min-w-0 items-center gap-2 rounded-xl border border-border bg-accent px-3 py-1"
                    >
                        <span className="text-sm wrap-anywhere">
                            {lookup.get(id) ?? 'Minat tersimpan'}
                        </span>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-6 cursor-pointer"
                            disabled={busy}
                            aria-label={`Hapus minat ${lookup.get(id) ?? id}`}
                            onClick={() => actions.removeInterest(id)}
                        >
                            <Trash2 aria-hidden="true" className="size-3.5" />
                        </Button>
                    </li>
                ))}
            </ul>
            <InputError message={errors.interests} />
        </section>
    );
}
