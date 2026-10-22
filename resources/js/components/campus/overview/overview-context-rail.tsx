import { Link } from '@inertiajs/react';
import {
    ChevronRight,
    FileSpreadsheet,
    GraduationCap,
    Network,
} from 'lucide-react';
import { numberFormatter } from '@/components/campus/overview/overview-types';
import type { CampusOverviewProps } from '@/components/campus/overview/overview-types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { index as campusInclusionIndex } from '@/routes/campus/inclusion';
import { show as campusRoster } from '@/routes/campus/roster';

interface OverviewContextRailProps {
    institution: CampusOverviewProps['institution'];
    programDistribution: CampusOverviewProps['programDistribution'];
    isPending: boolean;
    isForbidden: boolean;
}

export function OverviewContextRail({
    institution,
    programDistribution,
    isPending,
    isForbidden,
}: OverviewContextRailProps) {
    const distributionTotal = programDistribution.reduce(
        (total, item) => total + item.count,
        0,
    );

    return (
        <aside
            aria-label="Konteks ringkasan kampus"
            className="min-w-0 space-y-4"
        >
            {!isForbidden && (
                <section
                    className="rounded-3xl border border-primary/15 bg-white p-4 shadow-sm sm:p-5"
                    aria-labelledby="campus-distribution-heading"
                    aria-busy={isPending}
                >
                    <span className="flex size-8 items-center justify-center rounded-xl bg-accent text-primary">
                        <GraduationCap aria-hidden="true" className="size-5" />
                    </span>
                    <h2
                        id="campus-distribution-heading"
                        className="mt-3 text-lg font-bold tracking-tight"
                    >
                        Sebaran program studi
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        Seluruh program pada periode terpilih, termasuk saat
                        daftar anggota difilter.
                    </p>
                    <p className="mt-3 text-xs leading-5 text-muted-foreground">
                        Dasar persentase:{' '}
                        {numberFormatter.format(distributionTotal)} profil
                        mahasiswa dengan program studi.
                    </p>
                    {programDistribution.length === 0 ? (
                        isPending ? (
                            <div aria-hidden="true" className="mt-5 space-y-4">
                                {[1, 2, 3].map((key) => (
                                    <div key={key} className="space-y-2">
                                        <Skeleton className="h-4 w-3/4 motion-reduce:animate-none" />
                                        <Skeleton className="h-2 w-full motion-reduce:animate-none" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="mt-5 rounded-2xl bg-accent/50 p-4 text-sm leading-6 text-muted-foreground">
                                Belum ada profil dengan program studi pada
                                periode ini.
                            </p>
                        )
                    ) : (
                        <ul className="mt-4 space-y-3">
                            {programDistribution.map((item) => {
                                const percent =
                                    distributionTotal > 0
                                        ? (item.count / distributionTotal) * 100
                                        : 0;

                                return (
                                    <li key={item.program}>
                                        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                                            <p className="min-w-0 text-sm leading-6 font-semibold break-words">
                                                {item.program}
                                            </p>
                                            <p className="font-label text-xs leading-5 text-muted-foreground">
                                                {numberFormatter.format(
                                                    item.count,
                                                )}{' '}
                                                profil (
                                                {numberFormatter.format(
                                                    percent,
                                                )}
                                                %)
                                            </p>
                                        </div>
                                        <div
                                            aria-hidden="true"
                                            className="mt-2 h-2 overflow-hidden rounded-full bg-accent"
                                        >
                                            <div
                                                className="h-full rounded-full bg-primary/75"
                                                style={{ width: `${percent}%` }}
                                            />
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>
            )}
            <section className="rounded-3xl border border-border bg-accent/35 p-4 sm:p-5">
                <h2 className="flex items-center gap-2 text-base font-semibold">
                    <FileSpreadsheet
                        aria-hidden="true"
                        className="size-4 text-primary"
                    />
                    Data kampus
                </h2>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    Buka antrean afiliasi atau kontribusi untuk meninjau
                    pengajuan mahasiswa.
                </p>
                <Button
                    asChild
                    variant="outline"
                    className="mt-3 h-auto min-h-11 w-full bg-white whitespace-normal"
                >
                    <Link href={campusRoster({ institution: institution.id })}>
                        Kelola roster mahasiswa
                    </Link>
                </Button>
            </section>
            <section className="border-t border-border px-1 pt-2">
                <details className="group">
                    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-xl text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
                        Tentang data ringkasan
                        <ChevronRight
                            aria-hidden="true"
                            className="size-4 shrink-0 transition-transform group-open:rotate-90 motion-reduce:transition-none"
                        />
                    </summary>
                    <p className="pb-3 text-xs leading-5 text-muted-foreground">
                        Angka mengikuti hasil server dan periode yang
                        diterapkan, bukan aktivitas hari ini atau penilaian
                        mahasiswa. Program studi tidak menyaring proyek maupun
                        waktu tinjauan. Filter tanggal membaca waktu pencatatan,
                        bukan waktu aktivitas terakhir. Gunakan nama program
                        yang sama dengan profil mahasiswa; kosongkan untuk semua
                        program. Grafik menunjukkan komposisi, bukan tren.
                    </p>
                </details>
                <details className="mt-2 border-t border-border pt-2">
                    <summary className="flex min-h-11 cursor-pointer items-center rounded-xl text-xs font-semibold text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                        Fitur lanjutan
                    </summary>
                    <Link
                        href={campusInclusionIndex({
                            institution: institution.id,
                        })}
                        className="mt-1 flex min-h-11 cursor-pointer items-center gap-3 rounded-xl py-3 transition-colors hover:bg-accent/60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                    >
                        <Network
                            aria-hidden="true"
                            className="size-5 shrink-0 text-primary"
                        />
                        <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold">
                                Peninjauan inklusi
                            </span>
                            <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                                Modul terpisah dengan akses dan aktivasi
                                terbatas.
                            </span>
                        </span>
                        <ChevronRight
                            aria-hidden="true"
                            className="size-4 shrink-0 text-muted-foreground"
                        />
                    </Link>
                </details>
            </section>
        </aside>
    );
}
