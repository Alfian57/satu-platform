import { usePage } from '@inertiajs/react';
import { cn } from '@/lib/utils';

type Props = {
    className?: string;
    compact?: boolean;
    logoClassName?: string;
    ruleClassName?: string;
    variant?: 'default' | 'sidebar';
};

export default function AppLogo({
    className,
    compact = false,
    logoClassName,
    variant = 'default',
}: Props) {
    const { name } = usePage().props;
    const isSidebar = variant === 'sidebar';

    return (
        <div
            className={cn(
                'flex min-w-0 items-center gap-2.5 text-foreground',
                isSidebar && 'gap-3',
                className,
            )}
        >
            <img
                src="/images/logo.png?v=logo-02"
                alt="Logo SATU"
                width={256}
                height={256}
                className={cn(
                    'size-8 shrink-0 rounded-lg object-contain shadow-2xs',
                    isSidebar &&
                        'size-14 rounded-2xl border border-primary/10 bg-card p-0.5 shadow-sm',
                    logoClassName,
                )}
            />
            <span className="flex min-w-0 flex-col justify-center">
                <span
                    className={cn(
                        'truncate text-xl leading-none font-bold tracking-[-0.025em]',
                        isSidebar &&
                            'text-[1.625rem] leading-tight tracking-[-0.035em]',
                    )}
                >
                    {name}
                </span>
                {!compact && (
                    <span
                        className={cn(
                            'mt-1 max-w-44 font-label text-[0.5625rem] leading-[1.45] tracking-[0.025em] opacity-60',
                            isSidebar &&
                                'max-w-40 font-sans text-[0.6875rem] leading-[1.45] tracking-normal text-muted-foreground opacity-100',
                        )}
                    >
                        Sistem Aktivitas Talenta Universitas
                    </span>
                )}
            </span>
        </div>
    );
}
