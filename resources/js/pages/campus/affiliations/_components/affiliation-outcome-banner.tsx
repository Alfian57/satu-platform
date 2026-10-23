import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
    if (isForbidden) {
        return null;
    }

    return (
        <>
            {reviewOutcome && !requestError && (
                <Alert
                    role="status"
                    className="rounded-2xl border-verified/20 bg-verified-subtle text-verified-subtle-foreground"
                >
                    <CheckCircle2 aria-hidden="true" className="size-4" />
                    <AlertTitle>Perubahan tersimpan</AlertTitle>
                    <AlertDescription>
                        {outcomeCopy[reviewOutcome]}
                    </AlertDescription>
                </Alert>
            )}
            {reviewIssue && (
                <Alert className="rounded-2xl border-pending/20 bg-pending-subtle text-pending-subtle-foreground">
                    <AlertTriangle aria-hidden="true" className="size-4" />
                    <AlertTitle>
                        {reviewIssue === 'stale_decision'
                            ? 'Berkas sudah berubah'
                            : 'Berkas sedang ditinjau'}
                    </AlertTitle>
                    <AlertDescription>
                        {reviewIssue === 'stale_decision'
                            ? 'Keputusan tidak disimpan. Muat ulang antrean dan periksa versi terbaru.'
                            : 'Operator lain memegang kunci aktif. Pilih berkas lain atau coba lagi setelah kunci dilepas.'}
                    </AlertDescription>
                </Alert>
            )}
        </>
    );
}
