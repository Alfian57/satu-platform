import { FileText, Upload } from 'lucide-react';
import type { RefObject } from 'react';
import InputError from '@/components/common/input-error';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

type Props = {
    fileInputRef: RefObject<HTMLInputElement | null>;
    file: File | null;
    disabled: boolean;
    uncertain: boolean;
    isUploadProcessing: boolean;
    isReadProcessing: boolean;
    uploadPercentage: number;
    uploadError?: string;
    onFileChange: (file: File | null) => void;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export function EvidenceForm({
    fileInputRef,
    file,
    disabled,
    uncertain,
    isUploadProcessing,
    isReadProcessing,
    uploadPercentage,
    uploadError,
    onFileChange,
    onSubmit,
}: Props) {
    return (
        <form
            onSubmit={onSubmit}
            className="grid min-w-0 gap-3 rounded-2xl bg-accent/50 p-4"
            aria-busy={isUploadProcessing}
            data-test="evidence-form"
        >
            <div className="grid min-w-0 gap-1.5">
                <Label htmlFor="workspace-evidence-file" required>
                    Pilih bukti privat
                </Label>
                <input
                    ref={fileInputRef}
                    id="workspace-evidence-file"
                    type="file"
                    accept=".csv,.doc,.docx,.jpg,.jpeg,.pdf,.png,.ppt,.pptx,.txt,.webp,.xls,.xlsx"
                    onChange={(event) => {
                        onFileChange(event.target.files?.[0] ?? null);
                    }}
                    disabled={disabled || isUploadProcessing || uncertain}
                    className="min-h-11 w-full min-w-0 cursor-pointer text-sm file:mr-3 file:min-h-11 file:cursor-pointer file:rounded-xl file:border-0 file:bg-background file:px-3 file:text-foreground disabled:cursor-not-allowed"
                    aria-describedby="evidence-help evidence-file-error"
                    aria-invalid={Boolean(uploadError)}
                />
                <div className="grid min-w-0 gap-0.5">
                    <p
                        id="evidence-help"
                        className="text-xs leading-normal text-muted-foreground"
                    >
                        Dokumen, spreadsheet, presentasi, gambar, atau teks.
                        Maksimal 10 MB. Tidak perlu pesan atau portofolio
                        sebelumnya.
                    </p>
                    <InputError
                        id="evidence-file-error"
                        message={uploadError}
                    />
                </div>
            </div>
            {file && (
                <p className="text-sm wrap-anywhere">
                    <FileText
                        aria-hidden="true"
                        className="mr-2 inline size-4"
                    />
                    {file.name}
                </p>
            )}
            <Button
                type="submit"
                className="w-full sm:w-fit"
                disabled={
                    !file ||
                    disabled ||
                    uncertain ||
                    isUploadProcessing ||
                    isReadProcessing
                }
                data-test="evidence-submit"
            >
                {isUploadProcessing ? (
                    <Spinner aria-hidden="true" />
                ) : (
                    <Upload aria-hidden="true" />
                )}
                Unggah bukti privat
            </Button>
            {isUploadProcessing && (
                <div role="status">
                    <progress
                        max={100}
                        value={uploadPercentage}
                        className="w-full accent-primary"
                        aria-label="Kemajuan unggah bukti"
                    />
                    <p className="text-xs">
                        {uploadPercentage}% terkirim. Menunggu konfirmasi
                        server.
                    </p>
                </div>
            )}
        </form>
    );
}
