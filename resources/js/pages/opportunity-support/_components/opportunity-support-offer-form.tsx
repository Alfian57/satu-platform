import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { campusControlClass } from '@/pages/campus/_components/campus-operation-layout';
import type { SupportCase } from './opportunity-support-constants';

export function OpportunitySupportOfferForm({
    selected,
    blocked,
    role,
    reason,
    errors,
    opportunities,
    onRoleChange,
    onReasonChange,
    onOffer,
    onNote,
}: {
    selected: SupportCase;
    blocked: boolean;
    role: string;
    reason: string;
    errors: Record<string, string | undefined>;
    opportunities: {
        id: number;
        label: string;
        accepts_beginners: boolean | null;
    }[];
    onRoleChange: (val: string) => void;
    onReasonChange: (val: string) => void;
    onOffer: () => void;
    onNote: () => void;
}) {
    if (!selected.permissions.review) {
        return null;
    }

    const canOffer = ['requested', 'declined'].includes(selected.status);

    return (
        <form
            className="mt-5 border-t border-border pt-5"
            onSubmit={(event) => {
                event.preventDefault();
                onOffer();
            }}
        >
            <fieldset disabled={blocked} className="min-w-0 space-y-4">
                {canOffer && (
                    <div className="grid min-w-0 gap-1.5">
                        <Label htmlFor="support-role" required>
                            Peran yang ditawarkan
                        </Label>
                        <select
                            id="support-role"
                            aria-errormessage="support-errors"
                            className={campusControlClass + ' cursor-pointer'}
                            value={role}
                            onChange={(e) => onRoleChange(e.target.value)}
                            aria-invalid={!!errors.project_role_id}
                        >
                            <option value="">Pilih peluang aktual</option>
                            {opportunities
                                .filter(
                                    (option) =>
                                        selected.need !== 'beginner_path' ||
                                        option.accepts_beginners === true,
                                )
                                .map((option) => (
                                    <option key={option.id} value={option.id}>
                                        {option.label}
                                    </option>
                                ))}
                        </select>
                        <div className="grid min-w-0 gap-0.5">
                            <p className="text-xs leading-normal text-muted-foreground">
                                Maksimal 100 peran terbuka ditampilkan. Server
                                memeriksa ulang izin dan kapasitas saat
                                mengirim.
                            </p>
                        </div>
                    </div>
                )}
                <div className="grid min-w-0 gap-1.5">
                    <Label htmlFor="support-reason" required>
                        Alasan atau catatan untuk mahasiswa
                    </Label>
                    <textarea
                        id="support-reason"
                        aria-errormessage="support-errors"
                        placeholder="Tuliskan rencana atau rincian tawaran dukungan kolaborasi"
                        value={reason}
                        onChange={(e) => onReasonChange(e.target.value)}
                        maxLength={1000}
                        className={campusControlClass + ' min-h-28'}
                        aria-invalid={!!errors.reason}
                        aria-describedby="support-note-help"
                    />
                    <div className="grid min-w-0 gap-0.5">
                        <p
                            id="support-note-help"
                            className="text-xs leading-normal text-muted-foreground"
                        >
                            Jelaskan relevansi peluang atau tindakan yang
                            benar-benar dilakukan. Catatan terbaca pemilik;
                            bukan hasil dukungan terverifikasi.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    {canOffer && (
                        <Button
                            type="submit"
                            disabled={blocked || !role || !reason.trim()}
                        >
                            Tawarkan peluang
                        </Button>
                    )}
                    <Button
                        type="button"
                        variant="outline"
                        disabled={blocked || !reason.trim()}
                        onClick={onNote}
                    >
                        Simpan catatan tindak lanjut
                    </Button>
                </div>
            </fieldset>
        </form>
    );
}
