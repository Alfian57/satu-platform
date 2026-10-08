import { Form, Head, usePage } from '@inertiajs/react';
import {
    Ban,
    Download,
    FileEdit,
    RotateCcw,
    Shield,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SettingsLayout from '@/layouts/settings/layout';
import {
    correction,
    deleteMethod,
    exportMethod,
    restriction,
    withdrawal,
} from '@/routes/account/data-rights';
import { edit as editDataRights } from '@/routes/data-rights';

interface SummaryData {
    user: {
        id: number;
        name: string;
        username: string;
        created_at: string | null;
    };
    phone_numbers: Array<{
        masked: string;
        status: string;
        verified_at: string | null;
    }>;
    profile: {
        bio: string | null;
        visibility: string;
    } | null;
    memberships: Array<{
        institution: string | null;
        role: string;
        status: string;
    }>;
    consents: Array<{
        purpose: string;
        policy_version: string;
        granted_at: string | null;
        withdrawn_at: string | null;
        occurred_at: string;
    }>;
}

interface PageProps {
    summary: SummaryData;
    status?: string;
    [key: string]: unknown;
}

export default function DataRights({ summary }: PageProps) {
    const { flash } = usePage<{ flash?: { status?: string } }>().props;
    const [correctionOpen, setCorrectionOpen] = useState(false);
    const [restrictionOpen, setRestrictionOpen] = useState(false);
    const [withdrawalOpen, setWithdrawalOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);

    return (
        <SettingsLayout>
            <Head title="Hak Data dan Privasi" />

            <div className="grid gap-6">
                {flash?.status && (
                    <div
                        role="status"
                        className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
                    >
                        {flash.status}
                    </div>
                )}

                <section
                    aria-labelledby="data-rights-overview-title"
                    className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
                >
                    <header className="flex items-start gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
                            <Shield aria-hidden="true" className="size-5" />
                        </span>
                        <div className="grid gap-1">
                            <h2
                                id="data-rights-overview-title"
                                className="text-title font-bold tracking-[-0.02em] text-slate-950"
                            >
                                Hak Data dan Privasi
                            </h2>
                            <p className="text-sm leading-6 text-slate-600">
                                Sesuai regulasi pelindungan data pribadi, Anda
                                memiliki hak kendali atas data yang disimpan
                                dalam platform SATU.
                            </p>
                        </div>
                    </header>

                    <div className="grid gap-4 border-t border-slate-100 pt-6">
                        <h3 className="text-sm font-semibold text-slate-900">
                            Ringkasan Persetujuan Saat Ini
                        </h3>
                        {summary.consents && summary.consents.length > 0 ? (
                            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50/50">
                                {summary.consents.map((consent, index) => {
                                    const isGranted = Boolean(
                                        consent.granted_at,
                                    );

                                    return (
                                        <div
                                            key={index}
                                            className="flex flex-col justify-between gap-2 p-4 sm:flex-row sm:items-center"
                                        >
                                            <div className="grid gap-0.5">
                                                <p className="font-medium text-slate-900">
                                                    {consent.purpose}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    Versi Kebijakan:{' '}
                                                    {consent.policy_version}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                        isGranted
                                                            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
                                                            : 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20'
                                                    }`}
                                                >
                                                    {isGranted
                                                        ? 'Disetujui'
                                                        : 'Ditarik'}
                                                </span>
                                                <span className="text-xs text-slate-500">
                                                    {new Date(
                                                        consent.occurred_at,
                                                    ).toLocaleDateString(
                                                        'id-ID',
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500">
                                Belum ada riwayat persetujuan tercatat.
                            </p>
                        )}
                    </div>
                </section>

                <div className="grid gap-4 sm:grid-cols-2">
                    {/* Hak Akses & Ekspor Data */}
                    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="grid gap-2">
                            <div className="flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
                                <Download className="size-4" />
                            </div>
                            <h3 className="font-semibold text-slate-900">
                                Akses & Ekspor Data (Access)
                            </h3>
                            <p className="text-sm leading-relaxed text-slate-600">
                                Dapatkan salinan data pribadi Anda yang
                                tersimpan dalam format terstruktur (JSON).
                            </p>
                        </div>
                        <div className="mt-5 pt-3">
                            <Form action={exportMethod.url()} method="post">
                                {({ processing }) => (
                                    <Button
                                        type="submit"
                                        variant="outline"
                                        disabled={processing}
                                        className="w-full cursor-pointer"
                                    >
                                        <Download className="mr-2 size-4" />
                                        Unduh Data Pribadi
                                    </Button>
                                )}
                            </Form>
                        </div>
                    </div>

                    {/* Hak Koreksi Data */}
                    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="grid gap-2">
                            <div className="flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
                                <FileEdit className="size-4" />
                            </div>
                            <h3 className="font-semibold text-slate-900">
                                Permintaan Koreksi (Correction)
                            </h3>
                            <p className="text-sm leading-relaxed text-slate-600">
                                Ajukan pembaruan atau perbaikan data pribadi
                                jika terdapat kekeliruan pencatatan.
                            </p>
                        </div>
                        <div className="mt-5 pt-3">
                            <Dialog
                                open={correctionOpen}
                                onOpenChange={setCorrectionOpen}
                            >
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full cursor-pointer"
                                    >
                                        <FileEdit className="mr-2 size-4" />
                                        Ajukan Koreksi
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogTitle>
                                        Permintaan Koreksi Data
                                    </DialogTitle>
                                    <DialogDescription>
                                        Tuliskan data yang perlu diperbaiki
                                        beserta alasannya agar dapat
                                        diverifikasi oleh pengelola.
                                    </DialogDescription>
                                    <Form
                                        action={correction.url()}
                                        method="post"
                                        className="grid gap-4"
                                    >
                                        {({ processing, errors }) => (
                                            <>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="correction-reason">
                                                        Keterangan Koreksi
                                                    </Label>
                                                    <Input
                                                        id="correction-reason"
                                                        name="reason"
                                                        placeholder="Contoh: Perbaikan ejaan nama atau NIM..."
                                                        required
                                                    />
                                                    <InputError
                                                        message={errors.reason}
                                                    />
                                                </div>
                                                <DialogFooter>
                                                    <DialogClose asChild>
                                                        <Button
                                                            type="button"
                                                            variant="secondary"
                                                        >
                                                            Batal
                                                        </Button>
                                                    </DialogClose>
                                                    <Button
                                                        type="submit"
                                                        disabled={processing}
                                                    >
                                                        Kirim Permintaan
                                                    </Button>
                                                </DialogFooter>
                                            </>
                                        )}
                                    </Form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    {/* Pembatasan Pemrosesan */}
                    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="grid gap-2">
                            <div className="flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
                                <Ban className="size-4" />
                            </div>
                            <h3 className="font-semibold text-slate-900">
                                Batasi Pemrosesan (Restriction)
                            </h3>
                            <p className="text-sm leading-relaxed text-slate-600">
                                Batasi sementara aktivitas pemrosesan data
                                pribadi Anda pada layanan tertentu.
                            </p>
                        </div>
                        <div className="mt-5 pt-3">
                            <Dialog
                                open={restrictionOpen}
                                onOpenChange={setRestrictionOpen}
                            >
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full cursor-pointer"
                                    >
                                        <Ban className="mr-2 size-4" />
                                        Ajukan Pembatasan
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogTitle>
                                        Pembatasan Pemrosesan Data
                                    </DialogTitle>
                                    <DialogDescription>
                                        Sampaikan alasan permohonan pembatasan
                                        pemrosesan data profil dan aktivitas
                                        Anda.
                                    </DialogDescription>
                                    <Form
                                        action={restriction.url()}
                                        method="post"
                                        className="grid gap-4"
                                    >
                                        {({ processing, errors }) => (
                                            <>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="restriction-reason">
                                                        Alasan Pembatasan
                                                    </Label>
                                                    <Input
                                                        id="restriction-reason"
                                                        name="reason"
                                                        placeholder="Sebutkan batasan pemrosesan yang diinginkan..."
                                                        required
                                                    />
                                                    <InputError
                                                        message={errors.reason}
                                                    />
                                                </div>
                                                <DialogFooter>
                                                    <DialogClose asChild>
                                                        <Button
                                                            type="button"
                                                            variant="secondary"
                                                        >
                                                            Batal
                                                        </Button>
                                                    </DialogClose>
                                                    <Button
                                                        type="submit"
                                                        disabled={processing}
                                                    >
                                                        Kirim Permintaan
                                                    </Button>
                                                </DialogFooter>
                                            </>
                                        )}
                                    </Form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    {/* Tarik Persetujuan */}
                    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="grid gap-2">
                            <div className="flex size-9 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-700">
                                <RotateCcw className="size-4" />
                            </div>
                            <h3 className="font-semibold text-slate-900">
                                Penarikan Persetujuan (Withdrawal)
                            </h3>
                            <p className="text-sm leading-relaxed text-slate-600">
                                Tarik kembali persetujuan ketentuan layanan yang
                                sebelumnya telah Anda setujui.
                            </p>
                        </div>
                        <div className="mt-5 pt-3">
                            <Dialog
                                open={withdrawalOpen}
                                onOpenChange={setWithdrawalOpen}
                            >
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full cursor-pointer text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                                    >
                                        <RotateCcw className="mr-2 size-4" />
                                        Tarik Persetujuan
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogTitle>
                                        Tarik Persetujuan Ketentuan Layanan
                                    </DialogTitle>
                                    <DialogDescription>
                                        Dengan menarik persetujuan, sistem akan
                                        mencatat status pencabutan izin. Anda
                                        dapat diminta menyetujui kembali untuk
                                        melanjutkan aktivitas kolaborasi.
                                    </DialogDescription>
                                    <Form
                                        action={withdrawal.url()}
                                        method="post"
                                        className="grid gap-4"
                                    >
                                        {({ processing }) => (
                                            <DialogFooter>
                                                <DialogClose asChild>
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                    >
                                                        Batal
                                                    </Button>
                                                </DialogClose>
                                                <Button
                                                    type="submit"
                                                    variant="destructive"
                                                    disabled={processing}
                                                >
                                                    Konfirmasi Penarikan
                                                </Button>
                                            </DialogFooter>
                                        )}
                                    </Form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </div>

                {/* Penghapusan Akun Permanen */}
                <section
                    aria-labelledby="deletion-title"
                    className="grid gap-4 rounded-2xl border border-red-200 bg-red-50/50 p-5 sm:p-6"
                >
                    <div className="flex items-start gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-white text-red-600">
                            <Trash2 aria-hidden="true" className="size-5" />
                        </span>
                        <div className="grid gap-1">
                            <h3
                                id="deletion-title"
                                className="font-bold text-red-950"
                            >
                                Penghapusan Akun & Data (Deletion)
                            </h3>
                            <p className="text-sm leading-6 text-red-800">
                                Tindakan ini mengaburkan dan menganonimkan data
                                identitas Anda secara permanen. Akun Anda tidak
                                akan dapat dipulihkan kembali.
                            </p>
                        </div>
                    </div>
                    <div className="pt-2">
                        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    variant="destructive"
                                    className="cursor-pointer"
                                >
                                    <Trash2 className="mr-2 size-4" />
                                    Hapus Akun Permanen
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogTitle>
                                    Konfirmasi Penghapusan Akun
                                </DialogTitle>
                                <DialogDescription>
                                    Apakah Anda benar-benar yakin ingin
                                    menganonimkan identitas dan menghapus akun
                                    Anda secara permanen? Seluruh akses Anda ke
                                    SATU akan berakhir.
                                </DialogDescription>
                                <Form
                                    action={deleteMethod.url()}
                                    method="post"
                                    className="grid gap-4"
                                >
                                    {({ processing }) => (
                                        <DialogFooter>
                                            <DialogClose asChild>
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                >
                                                    Batal
                                                </Button>
                                            </DialogClose>
                                            <Button
                                                type="submit"
                                                variant="destructive"
                                                disabled={processing}
                                            >
                                                Ya, Hapus Akun Saya
                                            </Button>
                                        </DialogFooter>
                                    )}
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </section>
            </div>
        </SettingsLayout>
    );
}

DataRights.layout = {
    breadcrumbs: [
        {
            title: 'Hak Data dan Privasi',
            href: editDataRights(),
        },
    ],
};
