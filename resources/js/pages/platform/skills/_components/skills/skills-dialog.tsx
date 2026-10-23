import type { RefObject } from 'react';
import { OptionalMark, RequiredMark } from '@/components/common';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { campusControlClass } from '@/pages/campus/_components/campus-operation-layout';
import type { Selection } from './skills-types';

export function SkillsDialog({
    selection,
    actionBusy,
    needsCheck,
    error,
    form,
    headingRef,
    feedbackRef,
    onClose,
    onSave,
    onRefresh,
}: {
    selection: Selection | null;
    actionBusy: boolean;
    needsCheck: boolean;
    error: string;
    form: {
        data: {
            name: string;
            category: string;
            description: string;
            is_verified: boolean;
        };
        errors: Record<string, string | undefined>;
        hasErrors: boolean;
        setData: (field: any, value: any) => void;
    };
    headingRef: RefObject<HTMLHeadingElement | null>;
    feedbackRef: RefObject<HTMLDivElement | null>;
    onClose: () => void;
    onSave: () => void;
    onRefresh: () => void;
}) {
    return (
        <Dialog
            open={!!selection}
            onOpenChange={(value) => {
                if (!value && !actionBusy) {
                    onClose();
                }
            }}
        >
            <DialogContent
                closeButtonDisabled={actionBusy}
                onCloseAutoFocus={(event) => {
                    event.preventDefault();
                    headingRef.current?.focus();
                }}
            >
                <DialogHeader>
                    <DialogTitle>
                        {selection?.mode === 'create'
                            ? 'Tambah keahlian'
                            : selection?.mode === 'delete'
                              ? 'Hapus istilah katalog'
                              : 'Ubah keahlian'}
                    </DialogTitle>
                    <DialogDescription>
                        {selection?.mode === 'delete'
                            ? 'Penghapusan memengaruhi pilihan katalog. Periksa penggunaan sebelum melanjutkan; riwayat tidak boleh dihapus hanya untuk merapikan istilah.'
                            : 'Istilah katalog membantu mahasiswa menyatakan kemampuan dan proyek menjelaskan kebutuhan. Bukan sertifikasi kemampuan.'}
                    </DialogDescription>
                </DialogHeader>
                <form
                    className="grid min-w-0 gap-4"
                    onSubmit={(event) => {
                        event.preventDefault();
                        onSave();
                    }}
                >
                    {(error || form.hasErrors) && (
                        <div
                            ref={feedbackRef}
                            id="catalog-errors"
                            tabIndex={-1}
                            role="alert"
                            className="rounded-xl border border-correction/30 p-3 text-sm"
                        >
                            <p>{error || 'Periksa isian sebelum menyimpan.'}</p>
                            {Object.entries(form.errors).map(
                                ([field, value]) => (
                                    <p key={field}>{value}</p>
                                ),
                            )}
                        </div>
                    )}
                    {selection?.mode === 'delete' ? (
                        <p className="rounded-xl bg-accent p-3 font-semibold wrap-anywhere">
                            {selection.skill?.name}
                        </p>
                    ) : (
                        <>
                            {(['name', 'category', 'description'] as const).map(
                                (field) => (
                                    <label
                                        key={field}
                                        className="grid gap-2 text-sm font-semibold"
                                    >
                                        <span>
                                            {field === 'name'
                                                ? 'Nama keahlian'
                                                : field === 'category'
                                                  ? 'Kategori'
                                                  : 'Uraian'}
                                            {field === 'description' ? (
                                                <OptionalMark />
                                            ) : (
                                                <RequiredMark />
                                            )}
                                        </span>
                                        <input
                                            className={campusControlClass}
                                            placeholder={
                                                field === 'name'
                                                    ? 'Contoh: Machine Learning'
                                                    : field === 'category'
                                                      ? 'Contoh: Teknologi Informasi'
                                                      : 'Jelaskan cakupan keahlian ini'
                                            }
                                            value={form.data[field]}
                                            maxLength={
                                                field === 'description'
                                                    ? 500
                                                    : field === 'category'
                                                      ? 50
                                                      : 100
                                            }
                                            required={field !== 'description'}
                                            disabled={actionBusy || needsCheck}
                                            onChange={(event) =>
                                                form.setData(
                                                    field,
                                                    event.target.value,
                                                )
                                            }
                                            aria-invalid={!!form.errors[field]}
                                            aria-describedby={
                                                form.errors[field]
                                                    ? 'catalog-errors'
                                                    : undefined
                                            }
                                        />
                                    </label>
                                ),
                            )}
                            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl bg-accent p-3 text-sm">
                                <input
                                    type="checkbox"
                                    className="size-5 cursor-pointer disabled:cursor-not-allowed"
                                    checked={form.data.is_verified}
                                    disabled={actionBusy || needsCheck}
                                    onChange={(event) =>
                                        form.setData(
                                            'is_verified',
                                            event.target.checked,
                                        )
                                    }
                                />
                                Disetujui sebagai istilah katalog, bukan skill
                                mahasiswa
                            </label>
                        </>
                    )}
                    {needsCheck && (
                        <Button
                            type="button"
                            variant="outline"
                            disabled={actionBusy}
                            onClick={onRefresh}
                        >
                            Periksa katalog terbaru
                        </Button>
                    )}
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={actionBusy}
                            onClick={onClose}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            variant={
                                selection?.mode === 'delete'
                                    ? 'destructive'
                                    : 'default'
                            }
                            disabled={actionBusy || needsCheck}
                        >
                            {selection?.mode === 'delete'
                                ? 'Konfirmasi hapus'
                                : 'Simpan katalog'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
