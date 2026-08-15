import { useHttp } from '@inertiajs/react';
import { Check, Save } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { update as updateEntryVisibility } from '@/routes/student-profiles/portfolio/visibility';
import type {
    PortfolioEntry,
    PortfolioEntryApiResponse,
    PortfolioEntryVisibilityPayload,
    PortfolioVisibility,
} from '@/types/portfolio';

const entryVisibilityOptions: Array<{
    value: PortfolioVisibility;
    label: string;
}> = [
    { value: 'private', label: 'Hanya saya' },
    { value: 'institution', label: 'Kampus' },
    { value: 'recruiter', label: 'Perekrut' },
    { value: 'public', label: 'Publik' },
];

type Props = {
    entry: PortfolioEntry;
    profileId: number;
    onUpdated: (entry: PortfolioEntry) => void;
    dataTestPrefix?: string;
};

type ErrorMap = Record<string, unknown>;

function firstError(errors: ErrorMap): string | null {
    const value = errors.visibility;

    if (Array.isArray(value) && typeof value[0] === 'string') {
        return value[0];
    }

    return typeof value === 'string' ? value : null;
}

export function PortfolioEntryVisibilityControl({
    entry: initialEntry,
    profileId,
    onUpdated,
    dataTestPrefix = `portfolio-entry-${initialEntry.id}`,
}: Props) {
    const [entry, setEntry] = useState(initialEntry);
    const [actionMessage, setActionMessage] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const form = useHttp<
        PortfolioEntryVisibilityPayload,
        PortfolioEntryApiResponse
    >({
        visibility: initialEntry.visibility,
        expected_updated_at: initialEntry.updated_at,
    });
    const validationError = firstError(form.errors as ErrorMap);

    function submit(event: React.FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        setActionMessage(null);
        setActionError(null);
        form.transform((data) => ({
            ...data,
            expected_updated_at: entry.updated_at,
        }));
        form.patch(
            updateEntryVisibility({
                studentProfile: profileId,
                portfolioEntry: entry.id,
            }).url,
            {
                onHttpException: (response: { status: number }) => {
                    setActionError(
                        response.status === 409
                            ? 'Entry berubah di sesi lain. Muat ulang halaman lalu coba lagi.'
                            : response.status === 403
                              ? 'Audiens entry ini sudah tidak dapat diubah.'
                              : 'Audiens entry belum tersimpan. Coba lagi.',
                    );

                    return false;
                },
                onNetworkError: () => {
                    setActionError(
                        'Audiens entry belum tersimpan. Periksa koneksi lalu coba lagi.',
                    );

                    return false;
                },
            },
        )
            .then((response) => {
                setEntry(response.data);
                onUpdated(response.data);
                setActionMessage('Audiens entry sudah diperbarui.');
            })
            .catch(() => undefined);
    }

    return (
        <form
            className="grid gap-3 border-t border-slate-100 pt-4 md:border-t-0 md:border-l md:pt-0 md:pl-5"
            aria-busy={form.processing}
            onSubmit={submit}
            data-test={`${dataTestPrefix}-visibility-form`}
        >
            <div className="grid gap-1">
                <Label htmlFor={`${dataTestPrefix}-visibility`}>
                    Jangkauan karya
                </Label>
                <p className="text-xs leading-5 text-muted-foreground">
                    Status verifikasi mengikuti sumber contribution.
                </p>
            </div>
            <div className="flex flex-col gap-3">
                <select
                    id={`${dataTestPrefix}-visibility`}
                    className="min-h-control-md w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-hidden transition-[color,background-color,border-color,box-shadow] duration-fast ease-ledger hover:border-blue-300 focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                    value={form.data.visibility}
                    onChange={(event) =>
                        form.setData(
                            'visibility',
                            event.target.value as PortfolioVisibility,
                        )
                    }
                    disabled={form.processing}
                    data-test={`${dataTestPrefix}-visibility`}
                >
                    {entryVisibilityOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <Button
                    type="submit"
                    variant="outline"
                    className="w-fit cursor-pointer border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed"
                    disabled={form.processing}
                    data-test={`${dataTestPrefix}-visibility-save`}
                >
                    {form.processing ? (
                        <Spinner aria-hidden="true" />
                    ) : (
                        <Save aria-hidden="true" />
                    )}
                    Simpan audiens
                </Button>
            </div>
            {(validationError || actionError) && (
                <p role="alert" className="text-sm leading-6 text-correction">
                    {actionError ?? validationError}
                </p>
            )}
            {actionMessage && (
                <p
                    role="status"
                    className="flex items-center gap-2 text-sm text-verified"
                >
                    <Check aria-hidden="true" className="size-4" />
                    {actionMessage}
                </p>
            )}
        </form>
    );
}
