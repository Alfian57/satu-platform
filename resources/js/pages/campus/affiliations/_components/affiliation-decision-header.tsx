import { LockKeyhole } from 'lucide-react';
import type { RefObject } from 'react';
import { AffiliationMatchBadge } from '@/pages/campus/affiliations/_components/affiliation-match-badge';
import { formatDate } from '@/pages/campus/affiliations/_types/affiliation-types';
import type { ReviewItem } from '@/pages/campus/affiliations/_types/affiliation-types';

interface AffiliationDecisionHeaderProps {
    selected: ReviewItem;
    decisionHeadingRef: RefObject<HTMLHeadingElement | null>;
}

export function AffiliationDecisionHeader({
    selected,
    decisionHeadingRef,
}: AffiliationDecisionHeaderProps) {
    return (
        <div className="border-b border-border pb-4">
            <p className="flex items-center gap-2 text-xs font-semibold text-primary">
                <LockKeyhole aria-hidden="true" className="size-4" /> Kunci
                tinjauanmu aktif
            </p>
            <h2
                id="decision-title"
                ref={decisionHeadingRef}
                tabIndex={-1}
                className="mt-2 rounded-lg text-xl font-bold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
                Tinjau berkas AF-{selected.id}
            </h2>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Versi {selected.version}. Kunci berakhir{' '}
                {formatDate(selected.lock?.expiresAt ?? null)}.
            </p>
            <dl className="mt-3 space-y-2 rounded-2xl bg-accent/40 p-3 text-sm">
                <div>
                    <dt className="text-xs text-muted-foreground">NIM</dt>
                    <dd className="mt-1 font-label break-words">
                        {selected.nim}
                    </dd>
                </div>
                <div>
                    <dt className="text-xs text-muted-foreground">
                        Nomor WhatsApp
                    </dt>
                    <dd className="mt-1 font-label break-words">
                        {selected.phone ?? 'Belum tersedia'}
                    </dd>
                </div>
                <div>
                    <dt className="mb-1 text-xs text-muted-foreground">
                        Hasil roster
                    </dt>
                    <dd>
                        <AffiliationMatchBadge result={selected.matchResult} />
                    </dd>
                </div>
            </dl>
        </div>
    );
}
