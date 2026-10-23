interface StudentMenuTourSpotlightProps {
    spotlightId: string;
    rect: { left: number; top: number; width: number; height: number } | null;
    settled: boolean;
}

export function StudentMenuTourSpotlight({
    spotlightId,
    rect,
    settled,
}: StudentMenuTourSpotlightProps) {
    return (
        <>
            <svg
                aria-hidden="true"
                className="pointer-events-none fixed inset-0 size-full"
            >
                <defs>
                    <mask id={spotlightId} maskUnits="userSpaceOnUse">
                        <rect width="100%" height="100%" fill="white" />
                        <rect
                            x={rect?.left ?? 0}
                            y={rect?.top ?? 0}
                            width={rect?.width ?? 0}
                            height={rect?.height ?? 0}
                            rx="24"
                            fill="black"
                            className="student-tour-cutout"
                            data-visible={settled && !!rect}
                        />
                    </mask>
                </defs>
                <rect
                    width="100%"
                    height="100%"
                    fill="var(--color-satu-ink)"
                    fillOpacity={0.38}
                    mask={`url(#${spotlightId})`}
                />
            </svg>
            <div
                aria-hidden="true"
                data-test="student-menu-tour-spotlight"
                className="student-tour-spotlight pointer-events-none fixed rounded-3xl border-2 border-white/90 shadow-md ring-1 ring-primary/60 ring-offset-4 ring-offset-secondary/35"
                data-visible={settled && !!rect}
                style={rect ?? undefined}
            />
        </>
    );
}
