import { useEffect } from 'react';
import { toast } from 'sonner';
import { outcomeCopy } from '@/pages/campus/affiliations/_types/affiliation-types';
import type { CampusAffiliationsProps } from '@/pages/campus/affiliations/_types/affiliation-types';

interface AffiliationOutcomeBannerProps {
    reviewOutcome: CampusAffiliationsProps['reviewOutcome'];
    reviewIssue: CampusAffiliationsProps['reviewIssue'];
    requestError: string | null;
    isForbidden: boolean;
}

export function AffiliationOutcomeBanner({
    reviewOutcome,
    reviewIssue,
    requestError,
    isForbidden,
}: AffiliationOutcomeBannerProps) {
    useEffect(() => {
        if (isForbidden) {
            return;
        }

        if (reviewOutcome && !requestError) {
            toast.success(outcomeCopy[reviewOutcome]);
        }
    }, [reviewOutcome, requestError, isForbidden]);

    useEffect(() => {
        if (isForbidden || !reviewIssue) {
            return;
        }

        const message =
            reviewIssue === 'stale_decision'
                ? 'Keputusan tidak disimpan. Muat ulang antrean dan periksa versi terbaru.'
                : 'Operator lain memegang kunci aktif. Pilih berkas lain atau coba lagi setelah kunci dilepas.';

        toast.warning(message);
    }, [reviewIssue, isForbidden]);

    return null;
}
