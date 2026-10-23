import { cn } from '@/lib/utils';

export function DashboardArchiveArt({ className }: { className?: string }) {
    return (
        <svg
            aria-hidden="true"
            focusable="false"
            viewBox="0 0 180 180"
            className={cn('pointer-events-none text-primary/25', className)}
        >
            <rect
                x="38"
                y="30"
                width="108"
                height="136"
                rx="12"
                className="fill-accent"
                stroke="currentColor"
                transform="rotate(9 92 98)"
            />
            <rect
                x="22"
                y="14"
                width="108"
                height="136"
                rx="12"
                className="fill-white"
                stroke="currentColor"
                transform="rotate(-7 76 82)"
            />
            <g transform="rotate(-7 76 82)">
                <path
                    d="M42 40h41M42 58h68M42 76h68M42 94h68M42 112h43"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                />
                <path
                    d="M92 14h18v28l-9-5-9 5z"
                    className="fill-satu-feather/70"
                />
                <path d="M55 54v71" fill="none" stroke="currentColor" />
            </g>
        </svg>
    );
}
