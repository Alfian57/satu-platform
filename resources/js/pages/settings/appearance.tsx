import { Head } from '@inertiajs/react';
import { CheckCircle2, Eye, Keyboard, MousePointer2, Sun } from 'lucide-react';
import {
    SettingsCardHeading,
    SettingsGrid,
    SettingsHelpCard,
} from '@/components/settings/settings-panel';
import { edit as editAppearance } from '@/routes/appearance';

const palette = [
    { name: 'Langit', color: '#F3F9FF' },
    { name: 'Permukaan', color: '#FFFFFF' },
    { name: 'Biru SATU', color: '#1764E8' },
    { name: 'Oranye SATU', color: '#FFB85C' },
    { name: 'Teks', color: '#17345A' },
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
                            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-primary">
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
                        <p className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-white px-3 py-1 text-xs font-medium text-primary">
                            <CheckCircle2
                                aria-hidden="true"
                                className="size-3.5"
                            />
                            Aktif
                        </p>
                    </div>
                    <figure className="grid min-w-0 gap-4">
                        <div
                            aria-hidden="true"
                            className="grid min-w-0 gap-4 rounded-2xl border border-border bg-background p-4 sm:p-6"
                            data-test="appearance-preview"
                        >
                            <div className="flex items-center gap-2 border-b border-border pb-3">
                                <span className="grid size-8 place-items-center rounded-xl bg-accent text-primary">
                                    <Sun className="size-4" />
                                </span>
                                <span className="text-sm font-semibold">
                                    SATU
                                </span>
                                <span className="ml-auto rounded-full border border-border bg-card px-2 py-1 text-xs text-muted-foreground">
                                    Ruang kerja
                                </span>
                            </div>
                            <div className="relative overflow-hidden rounded-2xl border border-primary/10 bg-gradient-to-br from-accent to-white p-5">
                                <span className="absolute -top-5 -right-5 size-20 rounded-full border-[12px] border-satu-orange/25" />
                                <p className="text-xs font-medium text-primary">
                                    Buku Besar Kolaborasi
                                </p>
                                <p className="mt-2 text-title font-semibold">
                                    Ruang yang nyaman untuk berkarya.
                                </p>
                                <p className="mt-2 text-xs leading-6 text-muted-foreground">
                                    Informasi utama mendapat ruang. Detail tetap
                                    mudah dibaca.
                                </p>
                            </div>
                            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                                <div className="rounded-2xl border border-border bg-card p-4">
                                    <Eye className="size-5 text-satu-orange-ink" />
                                    <p className="mt-3 text-sm font-semibold">
                                        Hierarki yang jelas
                                    </p>
                                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                                        Judul, penjelasan, dan status dibedakan.
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-border bg-card p-4">
                                    <Keyboard className="size-5 text-primary" />
                                    <p className="mt-3 text-sm font-semibold">
                                        Fokus yang terlihat
                                    </p>
                                    <div className="mt-3 w-fit rounded-xl border-2 border-ring bg-accent px-3 py-2 text-xs text-primary">
                                        Contoh penanda fokus
                                    </div>
                                </div>
                            </div>
                        </div>
                        <figcaption className="text-xs leading-6 text-muted-foreground">
                            Pratinjau gaya visual SATU, bukan data akun atau
                            halaman yang dapat dioperasikan.
                        </figcaption>
                    </figure>
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
                                    className="size-6 shrink-0 rounded-lg border border-border"
                                    style={{ backgroundColor: item.color }}
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
