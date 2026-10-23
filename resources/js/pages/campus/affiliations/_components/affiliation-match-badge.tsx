import {
    AlertTriangle,
    CheckCircle2,
    FileSpreadsheet,
    FileWarning,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    matchClassName,
    matchCopy,
} from '@/pages/campus/affiliations/_types/affiliation-types';
import type { MatchResult } from '@/pages/campus/affiliations/_types/affiliation-types';

export function AffiliationMatchBadge({ result }: { result: MatchResult }) {
    const Icon =
        result === 'exact'
            ? CheckCircle2
            : result === 'roster_unavailable'
              ? FileSpreadsheet
              : result === 'ambiguous'
                ? AlertTriangle
                : FileWarning;

    return (
        <span
            className={cn(
                'inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1 text-xs leading-5 font-semibold',
                matchClassName[result],
            )}
        >
            <Icon aria-hidden="true" className="size-3.5 shrink-0" />
            {matchCopy[result]}
        </span>
    );
}
