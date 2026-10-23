import { Link } from '@inertiajs/react';
import ProjectController from '@/actions/App/Http/Controllers/ProjectController';
import { Button } from '@/components/ui/button';
import { AppPage } from '@/layouts/_components/app-page';

type Props = {
    institutionId: number;
};

export function ProjectEditorAccessDenied({ institutionId }: Props) {
    return (
        <AppPage>
            <section
                data-test="project-editor-access-denied"
                className="space-y-4 rounded-3xl border border-border bg-card p-6"
            >
                <h1 className="text-2xl font-bold">
                    Editor proyek tidak dapat diakses
                </h1>
                <p>
                    Data sebelumnya disembunyikan. Periksa afiliasi dan izin
                    pemilik sebelum membuka proyek kembali.
                </p>
                <Button asChild variant="outline">
                    <Link
                        href={ProjectController.index({
                            query: {
                                view: 'mine',
                                institution_id: institutionId,
                            },
                        })}
                    >
                        Kembali ke Proyek saya
                    </Link>
                </Button>
            </section>
        </AppPage>
    );
}
