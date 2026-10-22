import type { RefObject } from 'react';
import {
    formatSupportDate,
    needs,
    sheetClass,
    statuses,
} from './opportunity-support-constants';
import type {
    SupportCase,
    SupportEvent,
} from './opportunity-support-constants';
import { OpportunitySupportEventHistory } from './opportunity-support-event-history';
import { OpportunitySupportOfferForm } from './opportunity-support-offer-form';
import { OpportunitySupportResponseActions } from './opportunity-support-response-actions';
import { OpportunitySupportStaleAlert } from './opportunity-support-stale-alert';

export function OpportunitySupportDetail({
    selected,
    detailRef,
    stale,
    blocked,
    isProcessing,
    isReading,
    role,
    reason,
    errors,
    opportunities,
    latestOffer,
    onRoleChange,
    onReasonChange,
    onUseLatestData,
    onOffer,
    onNote,
    onAccept,
    onDecline,
    onWithdraw,
}: {
    selected: SupportCase | null;
    detailRef: RefObject<HTMLHeadingElement | null>;
    stale: boolean;
    blocked: boolean;
    isProcessing: boolean;
    isReading: boolean;
    role: string;
    reason: string;
    errors: Record<string, string | undefined>;
    opportunities: {
        id: number;
        label: string;
        accepts_beginners: boolean | null;
    }[];
    latestOffer?: SupportEvent;
    onRoleChange: (val: string) => void;
    onReasonChange: (val: string) => void;
    onUseLatestData: () => void;
    onOffer: () => void;
    onNote: () => void;
    onAccept: () => void;
    onDecline: () => void;
    onWithdraw: () => void;
}) {
    return (
        <section className={sheetClass} aria-label="Detail tindak lanjut">
            {!selected ? (
                <>
                    <h2 className="text-xl font-bold">
                        Kendali tetap pada mahasiswa
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        Pilih berkas untuk membaca tawaran dan riwayat. Kampus
                        tidak menghubungi otomatis, memberi label, atau
                        memasukkan mahasiswa ke tim.
                    </p>
                </>
            ) : (
                <>
                    <h2
                        ref={detailRef}
                        tabIndex={-1}
                        className="text-xl font-bold break-words focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        {needs[selected.need]}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {statuses[selected.status]} · revisi {selected.revision}
                    </p>
                    <p className="mt-3 text-sm leading-6 break-words whitespace-pre-wrap">
                        {selected.explanation ||
                            'Tidak ada penjelasan tambahan.'}
                    </p>
                    <p className="mt-3 text-xs text-muted-foreground">
                        Masa akses kampus sampai{' '}
                        {formatSupportDate(selected.expires_at)}.
                    </p>

                    <OpportunitySupportStaleAlert
                        stale={stale}
                        disabled={isProcessing || isReading}
                        onUseLatestData={onUseLatestData}
                    />

                    <OpportunitySupportOfferForm
                        selected={selected}
                        blocked={blocked}
                        role={role}
                        reason={reason}
                        errors={errors}
                        opportunities={opportunities}
                        onRoleChange={onRoleChange}
                        onReasonChange={onReasonChange}
                        onOffer={onOffer}
                        onNote={onNote}
                    />

                    <OpportunitySupportResponseActions
                        selected={selected}
                        latestOffer={latestOffer}
                        blocked={blocked}
                        onAccept={onAccept}
                        onDecline={onDecline}
                        onWithdraw={onWithdraw}
                    />

                    <OpportunitySupportEventHistory events={selected.events} />
                </>
            )}
        </section>
    );
}
