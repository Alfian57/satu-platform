import { useHttp } from '@inertiajs/react';
import { Save, SlidersHorizontal } from 'lucide-react';
import { useRef, useState } from 'react';
import {
    PortfolioFormFeedback,
    portfolioFieldError,
} from '@/components/portfolio/portfolio-form-feedback';
import type { PortfolioErrorMap } from '@/components/portfolio/portfolio-form-feedback';
import {
    portfolioVisibilityLabel,
    portfolioVisibilityOptions,
} from '@/components/portfolio/portfolio-presentation';
import {
    PortfolioPrivacyRecoveryNotice,
    usePortfolioPrivacyRecovery,
} from '@/components/portfolio/portfolio-privacy-recovery';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { show as showEntry } from '@/routes/student-profiles/portfolio';
import { update as updateEntryVisibility } from '@/routes/student-profiles/portfolio/visibility';
import type {
    PortfolioEntry,
    PortfolioEntryApiResponse,
    PortfolioEntryVisibilityPayload,
    PortfolioVisibility,
} from '@/types/portfolio';

type Props = {
    entry: PortfolioEntry;
    profileId: number;
    onUpdated: (entry: PortfolioEntry) => void;
    dataTestPrefix?: string;
    onAccessRevoked?: () => void;
};

export function PortfolioEntryVisibilityControl({
    entry,
    profileId,
    onUpdated,
    dataTestPrefix = `portfolio-entry-${entry.id}`,
    onAccessRevoked,
}: Props) {
    const [actionMessage, setActionMessage] = useState<string | null>(null);
    const commandLock = useRef(false);
    const recovery = usePortfolioPrivacyRecovery<PortfolioEntry>({
        resourceId: entry.id,
        readUrl: showEntry({
            studentProfile: profileId,
            portfolioEntry: entry.id,
        }).url,
        onRead: onUpdated,
        onAccessRevoked,
    });
    const form = useHttp<
        PortfolioEntryVisibilityPayload,
        PortfolioEntryApiResponse
    >({
        visibility: entry.visibility,
        expected_updated_at: entry.updated_at,
        expected_privacy_revision: entry.privacy_revision,
    });
    const errors = form.errors as PortfolioErrorMap;
    const validationError = portfolioFieldError(errors, 'visibility');
    const isStale =
        form.data.expected_privacy_revision !== entry.privacy_revision;
    const hasChanges = form.data.visibility !== entry.visibility;
    const selection = portfolioVisibilityOptions.find(
        (option) => option.value === form.data.visibility,
    );

    function applyLatestSettings(): void {
        form.setData({
            visibility: entry.visibility,
            expected_updated_at: entry.updated_at,
            expected_privacy_revision: entry.privacy_revision,
        });
        form.clearErrors();
        setActionMessage(null);
    }

    function submit(event: React.FormEvent<HTMLFormElement>): void {
        event.preventDefault();

        if (
            commandLock.current ||
            form.processing ||
            isStale ||
            recovery.blocked
        ) {
            return;
        }

        setActionMessage(null);
        commandLock.current = true;
        form.patch(
            updateEntryVisibility({
                studentProfile: profileId,
                portfolioEntry: entry.id,
            }).url,
            {
                onHttpException: recovery.onHttpException,
                onNetworkError: recovery.onNetworkError,
            },
        )
            .then((response) => {
                form.setData({
                    visibility: response.data.visibility,
                    expected_updated_at: response.data.updated_at,
                    expected_privacy_revision: response.data.privacy_revision,
                });
                onUpdated(response.data);
                setActionMessage('Jangkauan karya sudah tersimpan.');
            })
            .catch(() => undefined)
            .finally(() => {
                commandLock.current = false;
            });
    }

    return (
        <form
            className="grid min-w-0 gap-4 rounded-2xl border border-primary/15 bg-linear-to-br from-card to-accent/30 p-4 sm:p-5"
            aria-label={`Jangkauan karya: ${entry.title}`}
            aria-busy={form.processing}
            onSubmit={submit}
            data-test={dataTestPrefix + '-visibility-form'}
        >
            <div className="flex min-w-0 items-start gap-2">
                <SlidersHorizontal
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-primary"
                />
                <div className="grid min-w-0 gap-1">
                    <Label htmlFor={dataTestPrefix + '-visibility'}>
                        Jangkauan karya
                    </Label>
                    <p
                        className="text-xs leading-5 text-muted-foreground"
                        data-test={dataTestPrefix + '-saved'}
                    >
                        Tersimpan:{' '}
                        <span className="font-semibold text-foreground">
                            {portfolioVisibilityLabel(entry.visibility)}
                        </span>
                    </p>
                </div>
            </div>
            <select
                id={dataTestPrefix + '-visibility'}
                className="h-11 w-full min-w-0 cursor-pointer rounded-xl border border-input bg-background px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                value={form.data.visibility}
                onChange={(event) => {
                    form.setData(
                        'visibility',
                        event.target.value as PortfolioVisibility,
                    );
                    form.clearErrors('visibility');
                    setActionMessage(null);
                }}
                disabled={form.processing || recovery.blocked}
                aria-invalid={Boolean(validationError)}
                aria-describedby={
                    dataTestPrefix +
                    '-hint' +
                    (validationError ? ' ' + dataTestPrefix + '-error' : '')
                }
                data-test={dataTestPrefix + '-visibility'}
            >
                {portfolioVisibilityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            <p
                id={dataTestPrefix + '-hint'}
                className="text-xs leading-5 text-muted-foreground"
            >
                {selection?.description} Pengaturan profil dan izin pembaca
                tetap berlaku.
            </p>
            {hasChanges && !isStale && (
                <p
                    role="status"
                    className="text-xs font-semibold text-primary"
                    data-test={dataTestPrefix + '-unsaved'}
                >
                    Pilihan baru belum disimpan.
                </p>
            )}
            <PortfolioPrivacyRecoveryNotice
                recovery={recovery}
                prefix={dataTestPrefix}
            />
            {isStale && !recovery.blocked && (
                <div
                    role="status"
                    className="grid gap-3 rounded-xl border border-pending/30 bg-pending-subtle p-3 text-sm leading-6 text-pending-subtle-foreground"
                    data-test={dataTestPrefix + '-stale'}
                >
                    <p>
                        Pengaturan tersimpan berubah. Ambil pengaturan terbaru
                        sebelum menyimpan kembali.
                    </p>
                    <Button
                        variant="outline"
                        type="button"
                        className="h-auto min-h-11 whitespace-normal"
                        onClick={applyLatestSettings}
                        disabled={form.processing}
                    >
                        Gunakan pengaturan terbaru
                    </Button>
                </div>
            )}
            <PortfolioFormFeedback
                errors={errors}
                actionError={recovery.error}
                uncertain={recovery.needsCheck}
                actionMessage={actionMessage}
                processing={form.processing}
                processingMessage="Menyimpan jangkauan karya..."
                prefix={dataTestPrefix}
            />
            <Button
                type="submit"
                className="h-auto min-h-11 w-full py-3 whitespace-normal"
                disabled={form.processing || isStale || recovery.blocked}
                data-test={dataTestPrefix + '-visibility-save'}
            >
                {form.processing ? (
                    <Spinner
                        aria-hidden="true"
                        className="motion-reduce:animate-none"
                    />
                ) : (
                    <Save aria-hidden="true" />
                )}
                Simpan jangkauan
            </Button>
        </form>
    );
}
