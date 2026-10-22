import { PaginationControl } from '@/components/common/pagination-control';
import { Badge } from '@/components/ui/badge';
import { studentAffiliationStatuses } from '@/components/university/university-students-filter-form';
import type { PageData } from '@/components/university-settings-nav';

export interface UniversityStudentsListProps {
    students: PageData<{
        id: number;
        name: string;
        status: string;
        study_program: string | null;
    }>;
    busy: boolean;
    onPageChange: (page: number) => void;
}

export function UniversityStudentsList({
    students,
    busy,
    onPageChange,
}: UniversityStudentsListProps) {
    return (
        <section
            aria-label="Daftar mahasiswa"
            aria-busy={busy}
            className="min-w-0 rounded-3xl border border-primary/15 bg-card p-5 shadow-sm sm:p-6"
        >
            {busy && (
                <p role="status" className="mb-3 text-sm text-muted-foreground">
                    Memuat daftar mahasiswa.
                </p>
            )}
            <div className="divide-y divide-border">
                {students.data.length ? (
                    students.data.map((item) => (
                        <article
                            key={item.id}
                            className="flex flex-wrap items-start justify-between gap-3 py-4"
                        >
                            <div className="min-w-0 flex-1 basis-48">
                                <h2 className="text-lg font-bold wrap-anywhere">
                                    {item.name}
                                </h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {item.study_program ||
                                        'Program studi belum tersedia'}
                                </p>
                                <p className="mt-1 font-mono text-xs text-muted-foreground">
                                    Afiliasi {item.id}
                                </p>
                            </div>
                            <Badge
                                variant={
                                    item.status === 'verified'
                                        ? 'verified'
                                        : item.status === 'suspended'
                                          ? 'correction'
                                          : 'pending'
                                }
                            >
                                {studentAffiliationStatuses[item.status] ??
                                    item.status}
                            </Badge>
                        </article>
                    ))
                ) : (
                    <p className="py-6 text-sm leading-6 text-muted-foreground">
                        Tidak ada afiliasi mahasiswa pada cakupan ini. Coba ubah
                        filter; belum ada karya bukan alasan untuk dikeluarkan
                        dari daftar.
                    </p>
                )}
            </div>
            <PaginationControl
                meta={students}
                disabled={busy}
                onPageChange={onPageChange}
                itemName="mahasiswa"
            />
        </section>
    );
}
