import { Moon, Sun } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/button';
import { useAppearance } from '@/hooks/use-appearance';

const subscribeToHydration = () => () => undefined;

export function ThemeToggle() {
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const isHydrated = useSyncExternalStore(
        subscribeToHydration,
        () => true,
        () => false,
    );
    const resolvedNextAppearance =
        resolvedAppearance === 'dark' ? 'light' : 'dark';
    const nextAppearance = isHydrated ? resolvedNextAppearance : 'dark';
    const label =
        nextAppearance === 'light'
            ? 'Aktifkan mode terang'
            : 'Aktifkan mode gelap';
    const Icon = nextAppearance === 'light' ? Sun : Moon;

    return (
        <Button
            aria-label={label}
            className="size-control-lg min-h-control-lg min-w-control-lg shrink-0 rounded-sm md:size-control-md md:min-h-control-md md:min-w-control-md"
            data-test="theme-toggle"
            onClick={() => updateAppearance(nextAppearance)}
            size="icon"
            title={label}
            type="button"
            variant="ghost"
        >
            <Icon aria-hidden="true" />
        </Button>
    );
}
