import { Head } from '@inertiajs/react';
import { CheckCircle2, Eye, Keyboard, MousePointer2, Sun } from 'lucide-react';
import { AppearancePreview } from '@/components/settings/appearance-preview';
import {
    SettingsCardHeading,
    SettingsGrid,
    SettingsHelpCard,
} from '@/components/settings/settings-panel';
import { cn } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';

const palette = [
    { name: 'Langit', className: 'bg-satu-canvas border-border' },
    { name: 'Permukaan', className: 'bg-card border-border' },
    { name: 'Biru SATU', className: 'bg-satu-blue border-satu-blue' },
    { name: 'Oranye SATU', className: 'bg-satu-orange border-satu-orange' },
    { name: 'Teks', className: 'bg-satu-ink border-satu-ink' },
];

export default function Appearance() {
    return (
        <>
            <Head title="Pengaturan tampilan" />
            <SettingsGrid>
                <section
                    aria-labelledby="appearance-settings-title"
                    className="grid min-w-0 gap-6 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
                    data-test="appearance-settings-card"
                >
                    <SettingsCardHeading
                        id="appearance-settings-title"
                        icon={Sun}
                        title="Tampilan ruang kerja"
                        description="Biru yang tenang, putih yang lapang, dan oranye hangat. Satu identitas untuk ruang kolaborasimu."
                    />
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/10 bg-accent/60 p-4">
                        <div className="flex items-center gap-3">
                            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-card text-primary">
                                <Sun aria-hidden="true" className="size-5" />
                            </span>
                            <div>
                                <h3 className="text-sm font-semibold">
                                    Mode terang aktif
                                </h3>
                                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                    Tampilan yang digunakan SATU saat ini.
                                </p>
                            </div>
                        </div>
                        <p className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-card px-3 py-1 text-xs font-medium text-primary">
                            <CheckCircle2
                                aria-hidden="true"
                                className="size-3.5"
                            />
                            Aktif
                        </p>
                    </div>
                    <AppearancePreview />
                    <div
                        className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-5"
                        aria-label="Palet warna SATU"
                    >
                        {palette.map((item) => (
                            <div
                                key={item.name}
                                className="flex min-w-0 items-center gap-2 rounded-xl border border-border p-3"
                            >
                                <span
                                    aria-hidden="true"
                                    className={cn(
                                        'size-6 shrink-0 rounded-lg border',
                                        item.className,
                                    )}
                                />
                                <p className="min-w-0 text-xs font-medium [overflow-wrap:anywhere]">
                                    {item.name}
                                </p>
                            </div>
                        ))}
                    </div>
                    <p className="rounded-2xl border border-border bg-background/60 p-4 text-sm leading-6 text-muted-foreground">
                        Halaman ini menjelaskan tampilan aktif. Tidak ada
                        pilihan tema atau perubahan yang perlu kamu simpan.
                    </p>
                </section>
                <SettingsHelpCard
                    icon={Eye}
                    eyebrow="Nyaman saat digunakan"
                    title="Informasi tetap terbaca"
                >
                    <ul className="grid gap-4 text-sm leading-6 text-muted-foreground">
                        <li className="flex items-start gap-3">
                            <Sun
                                aria-hidden="true"
                                className="mt-1 size-4 shrink-0 text-primary"
                            />
                            <span>
                                Warna langit, permukaan putih, serta aksen biru
                                dan oranye digunakan secara konsisten di seluruh
                                ruang kerja.
                            </span>
                        </li>
                        <li className="flex items-start gap-3">
                            <Keyboard
                                aria-hidden="true"
                                className="mt-1 size-4 shrink-0 text-primary"
                            />
                            <span>
                                Gunakan Tab untuk berpindah kontrol. Penanda
                                fokus membantu mengetahui posisi pilihanmu.
                            </span>
                        </li>
                        <li className="flex items-start gap-3">
                            <MousePointer2
                                aria-hidden="true"
                                className="mt-1 size-4 shrink-0 text-primary"
                            />
                            <span>
                                Status disertai teks atau ikon, bukan hanya
                                perbedaan warna.
                            </span>
                        </li>
                    </ul>
                    <p className="rounded-2xl border border-primary/10 bg-accent/60 p-4 text-xs leading-6 text-muted-foreground">
                        Jika perangkat memakai preferensi pengurangan gerakan,
                        animasi pendukung menyesuaikan tanpa menghilangkan
                        informasi.
                    </p>
                </SettingsHelpCard>
            </SettingsGrid>
        </>
    );
}
Appearance.layout = {
    breadcrumbs: [{ title: 'Pengaturan tampilan', href: editAppearance() }],
};
