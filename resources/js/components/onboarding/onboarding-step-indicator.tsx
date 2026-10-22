import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const steps = ['Afiliasi kampus', 'Bekal kemampuan', 'Cara berkolaborasi'];

export interface OnboardingStepIndicatorProps {
    step: number;
}

export function OnboardingStepIndicator({
    step,
}: OnboardingStepIndicatorProps) {
    return (
        <ol aria-label="Tahapan profil" className="mt-5 flex gap-2">
            {steps.slice(1).map((label, index) => (
                <li
                    key={label}
                    aria-current={step - 1 === index ? 'step' : undefined}
                    className="flex min-w-0 flex-1 items-center gap-2"
                >
                    <span
                        className={cn(
                            'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                            index <= step - 1
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-slate-100 text-slate-600',
                        )}
                    >
                        {index < step - 1 ? (
                            <Check aria-hidden="true" className="size-4" />
                        ) : (
                            index + 1
                        )}
                    </span>
                    <span
                        className={cn(
                            'hidden text-xs font-semibold sm:block',
                            index === step - 1
                                ? 'text-primary'
                                : 'text-slate-600',
                        )}
                    >
                        {label}
                    </span>
                </li>
            ))}
        </ol>
    );
}
