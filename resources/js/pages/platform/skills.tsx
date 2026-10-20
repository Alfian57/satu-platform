import { Head, router, useForm } from '@inertiajs/react';
import { LibraryBig, Plus } from 'lucide-react';
import { useRef, useState } from 'react';
import { AppPage } from '@/components/app-page';
import {
    CampusOperationHeader,
    campusControlClass,
} from '@/components/campus-operation-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { UniversitySettingsNav } from '@/components/university-settings-nav';
import type { University } from '@/components/university-settings-nav';
import { store, update, destroy } from '@/routes/platform/skills';
import { skills as index } from '@/routes/university/settings';

type Skill = {
    id: number;
    name: string;
    category: string;
    description: string | null;
    isVerified: boolean;
    profileSkillsCount: number;
    projectRoleSkillsCount: number;
    updatedAt: string;
};
type Props = {
    institution: University;
    filters: { q: string; category: string; status: string };
    categories: string[];
    skills: Skill[];
    summary: {
        totalSkills: number;
        verifiedSkills: number;
        unverifiedSkills: number;
        categoriesCount: number;
    };
};
type Selection = { mode: 'create' | 'edit' | 'delete'; skill?: Skill };
const sheet =
    'min-w-0 rounded-3xl border border-primary/15 bg-white p-5 shadow-sm sm:p-6';

export default function Skills({
    institution,
    filters,
    categories,
    skills,
    summary,
}: Props) {
    const [selection, setSelection] = useState<Selection | null>(null);
    const [q, setQ] = useState(filters.q),
        [category, setCategory] = useState(filters.category),
        [status, setStatus] = useState(filters.status);
    const [busy, setBusy] = useState(false),
        [error, setError] = useState(''),
        [denied, setDenied] = useState(false),
        [needsCheck, setNeedsCheck] = useState(false);
    const [message, setMessage] = useState('');
    const heading = useRef<HTMLHeadingElement>(null),
        feedback = useRef<HTMLDivElement>(null),
        lock = useRef(false);
    const form = useForm({
        name: '',
        category: '',
        description: '',
        is_verified: true,
    });
    function open(next: Selection) {
        if (busy || form.processing || needsCheck || denied) {
            return;
        }

        setSelection(next);
        setError('');
        form.clearErrors();
        form.setData({
            name: next.skill?.name ?? '',
            category: next.skill?.category ?? '',
            description: next.skill?.description ?? '',
            is_verified: next.skill?.isVerified ?? true,
        });
    }
    function read(apply = false) {
        if (busy || lock.current || form.processing) {
            return;
        }

        router.get(
            index.url(institution.id, {
                query: apply ? { q, category, status } : filters,
            }),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setBusy(true),
                onFinish: () => setBusy(false),
                onSuccess: () => {
                    setDenied(false);
                    setNeedsCheck(false);
                    setError('');
                },
                onNetworkError: () => {
                    setError(
                        'Koneksi tidak tersedia. Isian tetap ada; periksa lagi sebelum mengirim.',
                    );

                    return false;
                },
                onHttpException: (response) => {
                    if ([401, 403, 404, 419].includes(response.status)) {
                        setDenied(true);
                        setSelection(null);
                    }

                    setError(
                        'Daftar terbaru belum tersedia. Periksa akses dan muat ulang.',
                    );

                    return false;
                },
            },
        );
    }
    function save() {
        if (
            !selection ||
            busy ||
            lock.current ||
            form.processing ||
            needsCheck ||
            denied
        ) {
            return;
        }

        lock.current = true;
        const route =
            selection.mode === 'create'
                ? store()
                : selection.mode === 'delete'
                  ? destroy(selection.skill!.id)
                  : update(selection.skill!.id);
        form.submit(route, {
            preserveScroll: true,
            onStart: () => setError(''),
            onFinish: () => {
                lock.current = false;
            },
            onSuccess: () => {
                setSelection(null);
                form.resetAndClearErrors();
                setMessage(
                    'Perubahan katalog dikonfirmasi server. Ini bukan verifikasi kemampuan mahasiswa.',
                );
            },
            onError: () =>
                requestAnimationFrame(() => feedback.current?.focus()),
            onNetworkError: () => {
                setNeedsCheck(true);
                setError(
                    'Hasil penyimpanan belum pasti. Periksa katalog terbaru; jangan kirim ulang otomatis.',
                );
                requestAnimationFrame(() => feedback.current?.focus());

                return false;
            },
            onHttpException: (response) => {
                if ([401, 403, 404, 419].includes(response.status)) {
                    setDenied(true);
                    setSelection(null);
                }

                setNeedsCheck(true);
                setError(
                    'Respons belum tersedia. Periksa sumber terbaru sebelum tindakan lain.',
                );
                requestAnimationFrame(() => feedback.current?.focus());

                return false;
            },
        });
    }
    const actionBusy = busy || form.processing;

    return (
        <AppPage>
            <Head title="Katalog keahlian" />
            <div className="grid min-w-0 gap-6" data-test="university-skills">
                <CampusOperationHeader
                    theme="skills"
                    title="Katalog keahlian"
                    description="Rapikan istilah kemampuan untuk profil dan kebutuhan peran. Persetujuan katalog tidak memvalidasi keahlian setiap mahasiswa."
                    institution={institution.name}
                    icon={LibraryBig}
                />
                <UniversitySettingsNav
                    institution={institution.id}
                    active="skills"
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">
                        {summary.totalSkills} istilah. {summary.verifiedSkills}{' '}
                        disetujui dalam katalog. {summary.unverifiedSkills}{' '}
                        perlu tinjauan.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            disabled={actionBusy}
                            onClick={() => read()}
                        >
                            Periksa katalog terbaru
                        </Button>
                        <Button
                            disabled={actionBusy || denied || needsCheck}
                            onClick={() => open({ mode: 'create' })}
                        >
                            <Plus aria-hidden="true" className="size-4" />
                            Tambah keahlian
                        </Button>
                    </div>
                </div>
                {message && (
                    <p role="status" className="text-sm text-muted-foreground">
                        {message}
                    </p>
                )}
                {error && !selection && (
                    <div role="alert" className={sheet}>
                        {error}
                    </div>
                )}
                <form
                    aria-label="Filter katalog"
                    onSubmit={(event) => {
                        event.preventDefault();
                        read(true);
                    }}
                    className={
                        sheet +
                        ' grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_12rem_12rem_auto]'
                    }
                >
                    <label className="grid gap-2 text-sm font-semibold">
                        Cari keahlian
                        <input
                            className={campusControlClass}
                            value={q}
                            maxLength={100}
                            disabled={actionBusy}
                            onChange={(event) => setQ(event.target.value)}
                        />
                    </label>
                    <label className="grid gap-2 text-sm font-semibold">
                        Kategori
                        <select
                            className={campusControlClass + ' cursor-pointer'}
                            value={category}
                            disabled={actionBusy}
                            onChange={(event) =>
                                setCategory(event.target.value)
                            }
                        >
                            <option value="all">Semua kategori</option>
                            {categories.map((item) => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="grid gap-2 text-sm font-semibold">
                        Status katalog
                        <select
                            className={campusControlClass + ' cursor-pointer'}
                            value={status}
                            disabled={actionBusy}
                            onChange={(event) => setStatus(event.target.value)}
                        >
                            <option value="all">Semua status</option>
                            <option value="verified">Disetujui</option>
                            <option value="unverified">Perlu tinjauan</option>
                        </select>
                    </label>
                    <Button
                        type="submit"
                        disabled={actionBusy}
                        className="self-end"
                    >
                        Terapkan filter
                    </Button>
                </form>
                {denied ? (
                    <div role="alert" className={sheet}>
                        Akses tidak tersedia. Katalog sebelumnya disembunyikan;
                        masuk ulang atau periksa izin.
                    </div>
                ) : (
                    <section aria-busy={busy} className={sheet}>
                        <h2
                            ref={heading}
                            tabIndex={-1}
                            className="text-xl font-bold"
                        >
                            Istilah dan penggunaannya
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            Hitungan profil dan peran hanya pada universitas
                            ini, bukan skor kompetensi atau popularitas.
                        </p>
                        <div className="mt-3 divide-y divide-border">
                            {skills.length ? (
                                skills.map((item) => (
                                    <article
                                        key={item.id}
                                        className="grid min-w-0 gap-4 py-5 lg:grid-cols-[minmax(0,1fr)_auto]"
                                    >
                                        <div className="min-w-0">
                                            <h3 className="text-lg font-bold wrap-anywhere">
                                                {item.name}
                                            </h3>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {item.category}
                                            </p>
                                            <Badge
                                                className="mt-2"
                                                variant={
                                                    item.isVerified
                                                        ? 'verified'
                                                        : 'pending'
                                                }
                                            >
                                                {item.isVerified
                                                    ? 'Disetujui dalam katalog'
                                                    : 'Perlu tinjauan katalog'}
                                            </Badge>
                                            <p className="mt-2 text-sm leading-6 wrap-anywhere text-muted-foreground">
                                                {item.description ||
                                                    'Belum ada uraian.'}
                                            </p>
                                            <p className="mt-2 text-xs text-muted-foreground">
                                                {item.profileSkillsCount}{' '}
                                                profil.{' '}
                                                {item.projectRoleSkillsCount}{' '}
                                                kebutuhan peran.
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap items-start gap-2">
                                            <Button
                                                variant="outline"
                                                disabled={
                                                    actionBusy || needsCheck
                                                }
                                                onClick={() =>
                                                    open({
                                                        mode: 'edit',
                                                        skill: item,
                                                    })
                                                }
                                            >
                                                Ubah
                                            </Button>
                                            <Button
                                                variant="outline"
                                                disabled={
                                                    actionBusy || needsCheck
                                                }
                                                onClick={() =>
                                                    open({
                                                        mode: 'delete',
                                                        skill: item,
                                                    })
                                                }
                                            >
                                                Hapus
                                            </Button>
                                        </div>
                                    </article>
                                ))
                            ) : (
                                <p className="py-6 text-sm text-muted-foreground">
                                    Belum ada istilah pada filter ini. Ubah
                                    filter atau tambah keahlian secara
                                    eksplisit.
                                </p>
                            )}
                        </div>
                    </section>
                )}
                {actionBusy && (
                    <p role="status" className="text-sm text-muted-foreground">
                        {form.processing
                            ? 'Menyimpan katalog.'
                            : 'Memuat katalog terbaru.'}
                    </p>
                )}
            </div>
            <Dialog
                open={!!selection}
                onOpenChange={(value) => {
                    if (!value && !actionBusy) {
                        setSelection(null);
                    }
                }}
            >
                <DialogContent
                    closeButtonDisabled={actionBusy}
                    onCloseAutoFocus={(event) => {
                        event.preventDefault();
                        heading.current?.focus();
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
                            save();
                        }}
                    >
                        {(error || form.hasErrors) && (
                            <div
                                ref={feedback}
                                id="catalog-errors"
                                tabIndex={-1}
                                role="alert"
                                className="rounded-xl border border-correction/30 p-3 text-sm"
                            >
                                <p>
                                    {error ||
                                        'Periksa isian sebelum menyimpan.'}
                                </p>
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
                                {(
                                    ['name', 'category', 'description'] as const
                                ).map((field) => (
                                    <label
                                        key={field}
                                        className="grid gap-2 text-sm font-semibold"
                                    >
                                        {field === 'name'
                                            ? 'Nama keahlian'
                                            : field === 'category'
                                              ? 'Kategori'
                                              : 'Uraian (opsional)'}
                                        <input
                                            className={campusControlClass}
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
                                ))}
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
                                    Disetujui sebagai istilah katalog, bukan
                                    skill mahasiswa
                                </label>
                            </>
                        )}
                        {needsCheck && (
                            <Button
                                type="button"
                                variant="outline"
                                disabled={actionBusy}
                                onClick={() => read()}
                            >
                                Periksa katalog terbaru
                            </Button>
                        )}
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={actionBusy}
                                onClick={() => setSelection(null)}
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
        </AppPage>
    );
}
