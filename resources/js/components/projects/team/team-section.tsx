import type { ReactNode } from 'react';

type Props = {
    title: string;
    id: string;
    children: ReactNode;
};

export function TeamSection({ title, id, children }: Props) {
    return (
        <section
            aria-labelledby={`${id}-title`}
            data-test={id}
            className="grid min-w-0 gap-4 rounded-2xl border border-border bg-background/65 p-4 sm:p-5"
        >
            <h3
                id={`${id}-title`}
                className="border-b border-border pb-3 text-title font-semibold"
            >
                {title}
            </h3>
            {children}
        </section>
    );
}
