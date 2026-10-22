import { campusControlClass } from '@/components/campus-operation-layout';
import { Button } from '@/components/ui/button';
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
                    <div>
                        <label
                            htmlFor="support-role"
                            className="text-sm font-semibold"
                        >
                            Peran yang ditawarkan
                        </label>
                        <select
                            id="support-role"
                            aria-errormessage="support-errors"
                            className={
                                campusControlClass + ' mt-2 cursor-pointer'
                            }
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
                        <p className="mt-2 text-sm text-muted-foreground">
                            Maksimal 100 peran terbuka ditampilkan. Server
                            memeriksa ulang izin dan kapasitas saat mengirim.
                        </p>
                    </div>
                )}
                <div>
                    <label
                        htmlFor="support-reason"
                        className="text-sm font-semibold"
                    >
                        Alasan atau catatan untuk mahasiswa
                    </label>
                    <textarea
                        id="support-reason"
                        aria-errormessage="support-errors"
                        value={reason}
                        onChange={(e) => onReasonChange(e.target.value)}
                        maxLength={1000}
                        className={campusControlClass + ' mt-2 min-h-28'}
                        aria-invalid={!!errors.reason}
                        aria-describedby="support-note-help"
                    />
                    <p
                        id="support-note-help"
                        className="mt-2 text-sm text-muted-foreground"
                    >
                        Jelaskan relevansi peluang atau tindakan yang
                        benar-benar dilakukan. Catatan terbaca pemilik; bukan
                        hasil dukungan terverifikasi.
                    </p>
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
