import type { LucideIcon } from 'lucide-react';
import { Monitor, Moon, Sun } from 'lucide-react';
import type { HTMLAttributes } from 'react';
import type { Appearance } from '@/hooks/use-appearance';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';

export default function AppearanceToggleTab({
    className = '',
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    const { appearance, updateAppearance } = useAppearance();

    const tabs: { value: Appearance; icon: LucideIcon; label: string }[] = [
        { value: 'light', icon: Sun, label: 'Terang' },
        { value: 'dark', icon: Moon, label: 'Gelap' },
        { value: 'system', icon: Monitor, label: 'Sistem' },
    ];

    return (
        <div
            aria-label="Tampilan"
            className={cn(
                'inline-flex gap-1 rounded-md bg-muted p-1',
                className,
            )}
            role="group"
            {...props}
        >
            {tabs.map(({ value, icon: Icon, label }) => (
                <button
                    key={value}
                    aria-pressed={appearance === value}
                    type="button"
                    onClick={() => updateAppearance(value)}
                    className={cn(
                        'flex h-control-sm items-center rounded-sm px-3 text-sm font-medium transition-colors duration-fast ease-ledger motion-reduce:transition-none',
                        appearance === value
                            ? 'bg-background text-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    )}
                >
                    <Icon aria-hidden="true" className="-ml-0.5 size-4" />
                    <span className="ml-1.5">{label}</span>
                </button>
            ))}
        </div>
    );
}
