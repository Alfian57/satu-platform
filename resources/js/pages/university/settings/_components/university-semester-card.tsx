import { Link } from '@inertiajs/react';
import { CalendarDays } from 'lucide-react';
import { PaginationControl } from '@/components/common/pagination-control';
import { Button } from '@/components/ui/button';
import type { PageData } from '@/pages/university/_components/university-settings-nav';
import { show as roster } from '@/routes/campus/roster';

export interface UniversitySemesterCardProps {
    rosters: PageData<{
        id: number;
        semester: string;
        status: string;
        activated_at: string | null;
        superseded_at: string | null;
    }>;
    institutionId: number;
    busy: boolean;
    onPageChange: (page: number) => void;
}

export function UniversitySemesterCard({
    rosters,
    institutionId,
    busy,
    onPageChange,
}: UniversitySemesterCardProps) {
    return (
        <section
            id="semester"
            className="min-w-0 scroll-mt-24 rounded-3xl border border-primary/15 bg-card p-5 shadow-sm sm:p-6"
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
                Semester mengikuti roster yang diimpor. Impor baru
                mempertahankan sumber lama, bukan mengubah riwayat mahasiswa.
            </p>
            <Button asChild variant="outline" className="mt-4 cursor-pointer">
                <Link href={roster(institutionId)}>Kelola melalui roster</Link>
            </Button>
            <div className="my-5 divide-y divide-border">
                {rosters.data.length ? (
                    rosters.data.map((item) => (
                        <article key={item.id} className="py-4">
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
                        Belum ada roster. Semester tidak dibuat otomatis saat
                        halaman dibuka.
                    </p>
                )}
            </div>
            <PaginationControl
                meta={rosters}
                disabled={busy}
                onPageChange={onPageChange}
                itemName="roster"
            />
        </section>
    );
}
