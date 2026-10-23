import type { PropsWithChildren } from 'react';

export function SettingsGrid({ children }: PropsWithChildren) {
    return (
        <div
            className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]"
            data-test="settings-grid"
        >
            {children}
        </div>
    );
}
