import type {
    UseOnboardingFlowReturn,
    Visibility,
} from '@/components/onboarding/_hooks/use-onboarding-flow';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const days = [
    { value: 1, label: 'Sen', full: 'Senin' },
    { value: 2, label: 'Sel', full: 'Selasa' },
    { value: 3, label: 'Rab', full: 'Rabu' },
    { value: 4, label: 'Kam', full: 'Kamis' },
    { value: 5, label: 'Jum', full: 'Jumat' },
    { value: 6, label: 'Sab', full: 'Sabtu' },
    { value: 0, label: 'Min', full: 'Minggu' },
];

const visibilityChoices: {
    value: Visibility;
    label: string;
    detail: string;
}[] = [
    {
        value: 'private',
        label: 'Hanya saya',
        detail: 'Simpan portofolio untuk dirimu dahulu.',
    },
    {
        value: 'institution',
        label: 'Kampus',
        detail: 'Bagikan dalam lingkup kampusmu.',
    },
    {
        value: 'public',
        label: 'Publik',
        detail: 'Portofolio dapat dibuka melalui tautan publik.',
    },
];

export interface OnboardingAvailabilityStepProps {
    state: UseOnboardingFlowReturn['state'];
    actions: UseOnboardingFlowReturn['actions'];
}

export function OnboardingAvailabilityStep({
    state,
    actions,
}: OnboardingAvailabilityStepProps) {
    const { availabilityDays, startsAt, endsAt, timezone, visibility, busy } =
        state;

    return (
        <div className="space-y-6">
            <fieldset className="space-y-3">
                <legend className="mb-3 text-sm font-semibold text-slate-800">
                    Kapan kamu bisa berkolaborasi?
                </legend>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                    {days.map((day) => (
                        <button
                            key={day.value}
                            type="button"
                            aria-pressed={availabilityDays.includes(day.value)}
                            aria-label={day.full}
                            disabled={busy}
                            onClick={() =>
                                actions.toggleAvailabilityDay(day.value)
                            }
                            className={cn(
                                'flex min-h-11 cursor-pointer items-center justify-center rounded-xl border text-xs font-semibold transition-colors disabled:cursor-not-allowed',
                                availabilityDays.includes(day.value)
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-primary/60',
                            )}
                        >
                            {day.label}
                        </button>
                    ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                        <Label htmlFor="availability-start">Jam mulai</Label>
                        <Input
                            id="availability-start"
                            type="time"
                            value={startsAt}
                            onChange={(event) =>
                                actions.setStartsAt(event.target.value)
                            }
                            required
                            disabled={busy}
                            className="h-12 rounded-xl"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="availability-end">Jam selesai</Label>
                        <Input
                            id="availability-end"
                            type="time"
                            value={endsAt}
                            onChange={(event) =>
                                actions.setEndsAt(event.target.value)
                            }
                            required
                            disabled={busy}
                            className="h-12 rounded-xl"
                        />
                    </div>
                </div>
                <p className="text-xs text-slate-600">
                    Zona waktu: {timezone}. Jam yang sama berlaku pada hari
                    pilihanmu. Jadwal boleh kosong dan dapat dilengkapi nanti.
                </p>
            </fieldset>
            <fieldset>
                <legend className="mb-3 text-sm font-semibold text-slate-800">
                    Siapa yang boleh melihat portofoliomu?
                </legend>
                <div className="grid gap-2 sm:grid-cols-2">
                    {visibilityChoices.map((choice) => (
                        <label
                            key={choice.value}
                            className={cn(
                                'flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition-colors',
                                visibility === choice.value
                                    ? 'border-primary bg-secondary/50'
                                    : 'border-slate-200 bg-white',
                            )}
                        >
                            <input
                                type="radio"
                                name="portfolio-visibility"
                                value={choice.value}
                                checked={visibility === choice.value}
                                disabled={busy}
                                onChange={() =>
                                    actions.setVisibility(choice.value)
                                }
                                className="mt-1 size-4 accent-primary"
                            />
                            <span>
                                <span className="block text-sm font-semibold text-slate-800">
                                    {choice.label}
                                </span>
                                <span className="mt-1 block text-xs leading-5 text-slate-600">
                                    {choice.detail}
                                </span>
                            </span>
                        </label>
                    ))}
                </div>
            </fieldset>
        </div>
    );
}
