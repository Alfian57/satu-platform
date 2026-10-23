import { Head, Link } from '@inertiajs/react';
import { UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppPage } from '@/layouts/_components/app-page';
import { CampusOperationHeader } from '@/pages/campus/_components/campus-operation-layout';
import type {
    PageData,
    University,
} from '@/pages/university/_components/university-settings-nav';
import { UniversityStudentsFilterForm } from '@/pages/university/students/_components/university-students-filter-form';
import { UniversityStudentsList } from '@/pages/university/students/_components/university-students-list';
import { useUniversityStudents } from '@/pages/university/students/_hooks/use-university-students';
import { index as affiliations } from '@/routes/campus/affiliations';

interface Props {
    institution: University;
    filters: { q: string; status: string };
    students: PageData<{
        id: number;
        name: string;
        status: string;
        study_program: string | null;
    }>;
}

export default function UniversityStudents({
    institution,
    filters,
    students,
}: Props) {
    const { q, status, busy, error, denied, actions } = useUniversityStudents({
        institutionId: institution.id,
        initialFilters: filters,
    });

    return (
        <AppPage>
            <Head title="Mahasiswa" />
            <div className="grid min-w-0 gap-6" data-test="university-students">
                <CampusOperationHeader
                    theme="students"
                    title="Mahasiswa"
                    description="Kenali status afiliasi, lalu tindak lanjuti permintaan yang perlu ditinjau. Daftar ini bukan penilaian kompetensi atau popularitas."
                    institution={institution.name}
                    icon={UsersRound}
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="max-w-[65ch] text-sm leading-6 text-muted-foreground">
                        Roster adalah sumber pencocokan. Mahasiswa di bawah ini
                        adalah akun yang telah mengajukan afiliasi, bukan
                        seluruh isi roster.
                    </p>
                    <Button asChild className="cursor-pointer">
                        <Link href={affiliations(institution.id)}>
                            Tinjau afiliasi
                        </Link>
                    </Button>
                </div>
                <UniversityStudentsFilterForm
                    q={q}
                    status={status}
                    busy={busy}
                    onQueryChange={actions.setQ}
                    onStatusChange={actions.setStatus}
                    onSubmit={() => actions.visitPage(1, true)}
                />
                {error && (
                    <div
                        role="alert"
                        className="rounded-2xl border border-correction/30 bg-card p-5"
                    >
                        <p>{error}</p>
                        <Button
                            variant="outline"
                            className="mt-3 cursor-pointer disabled:cursor-not-allowed"
                            disabled={busy}
                            onClick={() =>
                                actions.visitPage(students.current_page)
                            }
                        >
                            Periksa daftar terbaru
                        </Button>
                    </div>
                )}
                {!denied && (
                    <UniversityStudentsList
                        students={students}
                        busy={busy}
                        onPageChange={actions.visitPage}
                    />
                )}
            </div>
        </AppPage>
    );
}
