import { usePage } from '@inertiajs/react';
import { cn } from '@/lib/utils';

type Props = {
    className?: string;
    compact?: boolean;
    ruleClassName?: string;
};

export default function AppLogo({ className, compact = false }: Props) {
    const { name } = usePage().props;

    return (
        <div
            className={cn(
                'flex min-w-0 items-center gap-2.5 text-foreground',
                className,
            )}
        >
            <img
                src="/images/logo.png"
                alt="Logo SATU"
                className="size-8 shrink-0 rounded-lg object-contain shadow-2xs"
            />
            <span className="flex min-w-0 flex-col justify-center">
                <span className="truncate text-xl leading-none font-bold tracking-[-0.025em]">
                    {name}
                </span>
                {!compact && (
                    <span className="mt-1 max-w-44 font-label text-[0.5625rem] leading-[1.45] tracking-[0.025em] opacity-60">
                        Sistem Aktivitas Talenta Universitas
                    </span>
                )}
            </span>
        </div>
    );
}
