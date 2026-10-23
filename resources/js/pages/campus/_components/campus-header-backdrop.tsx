import type { ReactNode } from 'react';

export type CampusHeaderTheme =
    | 'overview'
    | 'students'
    | 'affiliations'
    | 'roster'
    | 'validation'
    | 'rankings'
    | 'support'
    | 'settings'
    | 'admins'
    | 'skills'
    | 'inclusion'
    | 'credits'
    | 'integrations'
    | 'account';

const motifs: Record<string, ReactNode> = {
    panels: (
        <>
            <rect x="34" y="28" width="118" height="144" rx="12" />
            <rect x="168" y="28" width="118" height="64" rx="12" />
            <rect x="168" y="108" width="118" height="64" rx="12" />
            <path d="M54 55h40M54 75h76M188 135h38" />
        </>
    ),
    identity: (
        <>
            <rect x="42" y="24" width="236" height="152" rx="14" />
            <circle cx="94" cy="79" r="18" />
            <path d="M67 125c4-22 50-22 54 0M144 63h88M144 84h62M144 119h88M144 140h48" />
        </>
    ),
    ledger: (
        <>
            <rect x="34" y="26" width="252" height="148" rx="10" />
            <path d="M34 62h252M34 98h252M34 134h252M102 26v148M208 26v148" />
        </>
    ),
    document: (
        <>
            <path d="M79 39H48v139h175v-27M82 21h145l45 45v105H82zM227 21v45h45M105 88h132M105 112h132M105 136h76" />
        </>
    ),
    measure: (
        <>
            <path d="M36 162h250M54 162V42M90 162v-24M126 162v-48M162 162v-24M198 162v-48M234 162v-24M54 78h232M54 114h232" />
            <path
                d="M54 42h82"
                stroke="var(--color-satu-orange)"
                strokeWidth="3"
            />
        </>
    ),
    weave: (
        <>
            <path d="M18 150c42 0 42-100 85-100s43 100 85 100 42-100 86-100M18 174c42 0 42-100 85-100s43 100 85 100 42-100 86-100M18 126c42 0 42-100 85-100s43 100 85 100 42-100 86-100" />
        </>
    ),
    controls: (
        <>
            <path d="M72 28v148M160 28v148M248 28v148" />
            <rect x="56" y="66" width="32" height="36" rx="8" />
            <rect x="144" y="108" width="32" height="36" rx="8" />
            <rect x="232" y="46" width="32" height="36" rx="8" />
        </>
    ),
    tags: (
        <>
            <rect x="36" y="30" width="110" height="48" rx="10" />
            <rect x="162" y="30" width="120" height="48" rx="10" />
            <rect x="36" y="96" width="144" height="48" rx="10" />
            <rect x="196" y="96" width="86" height="48" rx="10" />
            <path d="M56 54h62M182 54h72M56 120h96M216 120h38" />
        </>
    ),
    exchange: (
        <>
            <rect x="34" y="40" width="72" height="112" rx="10" />
            <rect x="214" y="40" width="72" height="112" rx="10" />
            <path d="M106 75h108m-14-14 14 14-14 14M214 121H106m14-14-14 14 14 14M54 63h32M54 85h20M234 107h32M234 129h20" />
        </>
    ),
};

const themeMotifs: Record<CampusHeaderTheme, keyof typeof motifs> = {
    overview: 'panels',
    students: 'identity',
    affiliations: 'identity',
    roster: 'ledger',
    validation: 'document',
    rankings: 'measure',
    support: 'weave',
    settings: 'controls',
    admins: 'identity',
    skills: 'tags',
    inclusion: 'weave',
    credits: 'ledger',
    integrations: 'exchange',
    account: 'controls',
};

export default function CampusHeaderBackdrop({
    theme,
}: {
    theme: CampusHeaderTheme;
}) {
    return (
        <div className="campus-header-backdrop" aria-hidden="true">
            <svg
                viewBox="0 0 320 200"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.25"
                className="campus-header-backdrop__motif"
                focusable="false"
            >
                {motifs[themeMotifs[theme]]}
                <path
                    d="M288 26v28"
                    stroke="var(--color-satu-orange)"
                    strokeWidth="3"
                />
            </svg>
        </div>
    );
}
