import { Head } from '@inertiajs/react';
import { Eye, Sun } from 'lucide-react';
import { edit as editAppearance } from '@/routes/appearance';

export default function Appearance() {
    return (
        <>
            <Head title="Pengaturan tampilan" />

            <section
                aria-labelledby="appearance-settings-title"
                className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
                data-test="appearance-settings-card"
            >
                <header className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
                        <Sun aria-hidden="true" className="size-5" />
                    </span>
                    <div className="grid gap-1">
                        <h2
                            id="appearance-settings-title"
                            className="text-title font-bold tracking-[-0.02em] text-slate-950"
                        >
                            Tampilan ruang kerja
                        </h2>
                        <p className="text-sm leading-6 text-slate-600">
                            SATU memakai tampilan terang yang konsisten untuk
                            menjaga informasi kerja tetap mudah dipindai.
                        </p>
                    </div>
                </header>

                <div className="grid gap-5 border-t border-slate-100 pt-6">
                    <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                        <Eye
                            aria-hidden="true"
                            className="mt-0.5 size-4 shrink-0 text-blue-700"
                        />
                        <div className="grid gap-1">
                            <p className="font-semibold text-slate-950">
                                Mode terang aktif
                            </p>
                            <p className="text-sm leading-6 text-slate-600">
                                Warna, status, dan detail kolaborasi disusun
                                untuk penggunaan jangka panjang.
                            </p>
                        </div>
                    </div>

                    <p className="text-sm leading-6 text-slate-600">
                        Pengaturan tema tidak diubah dari halaman ini agar
                        pengalaman di seluruh ruang kerja tetap konsisten.
                    </p>
                </div>
            </section>
        </>
    );
}

Appearance.layout = {
    breadcrumbs: [
        {
            title: 'Pengaturan tampilan',
            href: editAppearance(),
        },
    ],
};
