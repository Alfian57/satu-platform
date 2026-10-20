import { Head, Link, router } from '@inertiajs/react';
import { CalendarDays, Settings2 } from 'lucide-react';
import { useState } from 'react';
import { AppPage } from '@/components/app-page';
import { CampusOperationHeader } from '@/components/campus-operation-layout';
import { Button } from '@/components/ui/button';
import {
    UniversitySettingsNav,
    UniversityPagination,
} from '@/components/university-settings-nav';
import type {
    University,
    PageData,
} from '@/components/university-settings-nav';
import { show as roster } from '@/routes/campus/roster';
import { index } from '@/routes/university/settings';

type Props = {
    section?: 'profile' | 'semester';
    institution: University & { timezone: string; locale: string };
    rosters: PageData<{
        id: number;
        semester: string;
        status: string;
        activated_at: string | null;
        superseded_at: string | null;
    }>;
};
const sheet =
    'min-w-0 rounded-3xl border border-primary/15 bg-white p-5 shadow-sm sm:p-6';

export default function UniversitySettings({
    institution,
    rosters,
    section = 'profile',
}: Props) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [denied, setDenied] = useState(false);
    function page(next: number) {
        if (busy) {
            return;
        }

        router.get(
            index.url(institution.id, { query: { page: next, section } }),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setBusy(true),
                onFinish: () => setBusy(false),
                onSuccess: () => {
                    setError('');
                    setDenied(false);
                },
                onNetworkError: () => {
                    setError(
                        'Daftar semester belum dapat dibaca. Coba periksa kembali.',
                    );

                    return false;
                },
                onHttpException: (response) => {
                    if ([401, 403, 404, 419].includes(response.status)) {
                        setDenied(true);
                    }

                    setError(
                        'Sesi atau data terbaru belum tersedia. Periksa kembali atau masuk ulang.',
                    );

                    return false;
                },
            },
        );
    }

    return (
        <AppPage>
            <Head title="Pengaturan universitas" />
            <div className="grid min-w-0 gap-6" data-test="university-settings">
                <CampusOperationHeader
                    theme="settings"
                    title="Pengaturan universitas"
                    description="Periksa profil universitas dan riwayat impor daftar mahasiswa. Keamanan akun pribadi dikelola terpisah."
                    institution={institution.name}
                    icon={Settings2}
                />
                <UniversitySettingsNav
                    institution={institution.id}
                    active={section}
                />
                {error && (
                    <div role="alert" className={sheet}>
                        <p>{error}</p>
                        <Button
                            className="mt-3"
                            variant="outline"
                            onClick={() => page(rosters.current_page)}
                            disabled={busy}
                        >
                            Periksa kembali
                        </Button>
                    </div>
                )}
                {!denied && (
                    <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
                        <div className="grid min-w-0 gap-6">
                            <section
                                className={sheet}
                                aria-labelledby="university-profile"
                            >
                                <h2
                                    id="university-profile"
                                    className="text-xl font-bold"
                                >
                                    Profil universitas
                                </h2>
                                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                    Informasi universitas yang digunakan SATU.
                                    Hubungi pengelola teknis jika ada informasi
                                    yang perlu diperbaiki.
                                </p>
                                <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                                    {[
                                        ['Universitas', institution.name],
                                        ['Zona waktu', institution.timezone],
                                        [
                                            'Bahasa',
                                            institution.locale === 'id'
                                                ? 'Bahasa Indonesia'
                                                : institution.locale,
                                        ],
                                    ].map(([label, value]) => (
                                        <div
                                            key={label}
                                            className="min-w-0 border-t border-border pt-3"
                                        >
                                            <dt className="text-sm text-muted-foreground">
                                                {label}
                                            </dt>
                                            <dd className="mt-1 font-semibold wrap-anywhere">
                                                {value}
                                            </dd>
                                        </div>
                                    ))}
                                </dl>
                            </section>
                            <section
                                id="semester"
                                className={`${sheet} scroll-mt-24`}
                                aria-labelledby="semester-title"
                                aria-busy={busy}
                            >
                                <h2
                                    id="semester-title"
                                    className="flex items-center gap-2 text-xl font-bold"
                                >
                                    <CalendarDays
                                        aria-hidden="true"
                                        className="size-5 text-primary"
                                    />
                                    Semester dan sumber roster
                                </h2>
                                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                    Semester mengikuti roster yang diimpor.
                                    Impor baru mempertahankan sumber lama, bukan
                                    mengubah riwayat mahasiswa.
                                </p>
                                <Button
                                    asChild
                                    variant="outline"
                                    className="mt-4"
                                >
                                    <Link href={roster(institution.id)}>
                                        Kelola melalui roster
                                    </Link>
                                </Button>
                                <div className="my-5 divide-y divide-border">
                                    {rosters.data.length ? (
                                        rosters.data.map((item) => (
                                            <article
                                                key={item.id}
                                                className="py-4"
                                            >
                                                <h3 className="font-semibold wrap-anywhere">
                                                    {item.semester}
                                                </h3>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    Roster {item.id}.{' '}
                                                    {item.status === 'active'
                                                        ? 'Aktif'
                                                        : item.superseded_at
                                                          ? 'Digantikan, riwayat tetap tersedia'
                                                          : 'Belum aktif'}
                                                    .
                                                </p>
                                            </article>
                                        ))
                                    ) : (
                                        <p className="py-4 text-sm text-muted-foreground">
                                            Belum ada roster. Semester tidak
                                            dibuat otomatis saat halaman dibuka.
                                        </p>
                                    )}
                                </div>
                                <UniversityPagination
                                    page={rosters}
                                    busy={busy}
                                    onPage={page}
                                />
                            </section>
                        </div>
                        <aside className="min-w-0 space-y-4 text-sm leading-6">
                            <section className={`${sheet} bg-accent/40`}>
                                <h2 className="font-bold">Batas pengaturan</h2>
                                <p className="mt-2 text-muted-foreground">
                                    Kunci akses WhatsApp dan koneksi penyedia
                                    layanan ditangani pengelola teknis, bukan
                                    melalui halaman ini.
                                </p>
                            </section>
                            <section className={sheet}>
                                <h2 className="font-bold">
                                    Akun pribadi tetap terpisah
                                </h2>
                                <p className="mt-2 text-muted-foreground">
                                    Ubah nama pengguna, sandi, dan hak data dari
                                    menu akun. Akun admin universitas mengatur
                                    akses pengelola, bukan identitas login
                                    mahasiswa.
                                </p>
                            </section>
                        </aside>
                    </div>
                )}
                {busy && (
                    <p role="status" className="text-sm text-muted-foreground">
                        Memuat semester terbaru.
                    </p>
                )}
            </div>
        </AppPage>
    );
}
