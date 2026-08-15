import { Head, Link, router, useHttp } from '@inertiajs/react';
import { ArrowLeft, FolderOpen, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import ContributionController from '@/actions/App/Http/Controllers/ContributionController';
import { AppPage } from '@/components/app-page';
import { ContributionComposer } from '@/components/contributions/contribution-composer';
import { Button } from '@/components/ui/button';
import {
    index as contributionsIndex,
    show as contributionShow,
} from '@/routes/contributions';
import { index as projectsIndex } from '@/routes/projects';
import type {
    ContributionApiResponse,
    ContributionComposerValues,
    ContributionPayload,
    ContributionProjectOption,
} from '@/types/contribution';

type ContributionsCreateProps = {
    projects: ContributionProjectOption[];
    can_create: boolean;
};

export default function ContributionsCreate({
    projects,
    can_create: canCreate,
}: ContributionsCreateProps) {
    const [actionError, setActionError] = useState<string | null>(null);
    const form = useHttp<ContributionPayload, ContributionApiResponse>({
        task_id: '',
        claim: '',
        summary: '',
        declaration:
            'Saya menyatakan bahwa kontribusi ini merepresentasikan pekerjaan saya.',
        evidence: [],
    });

    function saveDraft(values: ContributionComposerValues): void {
        if (values.project_id === 0 || form.processing) {
            return;
        }

        setActionError(null);
        const payload: ContributionPayload = {
            task_id: values.task_id,
            claim: values.claim,
            summary: values.summary,
            declaration: values.declaration,
            evidence: values.evidence,
        };

        form.transform(() => payload);
        form.post(ContributionController.store(values.project_id).url, {
            onHttpException: (response: { status: number }) => {
                setActionError(
                    response.status === 403
                        ? 'Draft belum dapat dibuat karena akses project sudah berubah.'
                        : 'Draft belum tersimpan. Periksa field yang ditandai lalu coba lagi.',
                );

                return false;
            },
            onNetworkError: () => {
                setActionError(
                    'Draft belum tersimpan. Data yang sedang kamu isi tetap ada, periksa koneksi lalu coba lagi.',
                );

                return false;
            },
        })
            .then((response) => {
                router.visit(contributionShow(response.data.id), {
                    replace: true,
                });
            })
            .catch(() => undefined);
    }

    return (
        <>
            <Head title="Susun contribution" />
            <AppPage className="min-w-0">
                <div className="mx-auto grid max-w-4xl min-w-0 gap-7">
                    <header className="grid gap-4 border-b border-border pb-6">
                        <Link
                            href={contributionsIndex()}
                            className="inline-flex w-fit cursor-pointer items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline"
                            data-test="back-to-contributions"
                        >
                            <ArrowLeft aria-hidden="true" className="size-4" />
                            Kembali ke buku besar
                        </Link>
                        <div className="grid gap-3">
                            <p className="font-label text-label text-primary">
                                ENTRI BARU / DRAFT
                            </p>
                            <h1 className="text-headline font-bold text-balance">
                                Susun contribution dari pekerjaan yang sudah
                                kamu lakukan.
                            </h1>
                            <p className="max-w-[68ch] text-body text-muted-foreground">
                                Tautkan satu task, jelaskan pekerjaanmu, lalu
                                pilih evidence private yang dapat membantu
                                proses validasi. Menyimpan draft belum berarti
                                contribution disetujui.
                            </p>
                        </div>
                    </header>

                    {!canCreate || projects.length === 0 ? (
                        <section
                            data-test="contribution-create-forbidden"
                            className="grid gap-5 border-y border-border px-4 py-12 text-center md:px-8"
                        >
                            <ShieldAlert
                                aria-hidden="true"
                                className="mx-auto size-9 text-pending-subtle-foreground"
                            />
                            <div className="grid gap-2">
                                <h2 className="text-title font-semibold">
                                    Belum ada project yang bisa dipakai
                                </h2>
                                <p className="mx-auto max-w-[58ch] text-sm leading-6 text-muted-foreground">
                                    Contribution hanya dapat dibuat dari project
                                    aktif yang berada dalam afiliasi kampus dan
                                    bisa kamu akses.
                                </p>
                            </div>
                            <Button
                                asChild
                                variant="outline"
                                className="mx-auto cursor-pointer"
                            >
                                <Link href={projectsIndex()}>
                                    <FolderOpen aria-hidden="true" />
                                    Lihat project
                                </Link>
                            </Button>
                        </section>
                    ) : (
                        <section
                            aria-labelledby="contribution-composer-title"
                            className="grid gap-6 border-y border-border bg-card/30 px-4 py-6 md:px-8 md:py-8"
                        >
                            <div className="grid gap-2">
                                <p className="font-label text-label text-muted-foreground">
                                    PENYUSUN DRAFT
                                </p>
                                <h2
                                    id="contribution-composer-title"
                                    className="text-title font-semibold"
                                >
                                    Detail pekerjaan dan provenance
                                </h2>
                            </div>
                            {actionError && (
                                <div
                                    role="alert"
                                    data-test="contribution-create-error"
                                    className="border border-correction/30 bg-correction-subtle px-4 py-3 text-sm leading-6 text-correction-subtle-foreground"
                                >
                                    {actionError}
                                </div>
                            )}
                            <ContributionComposer
                                mode="create"
                                projects={projects}
                                processing={form.processing}
                                errors={form.errors as Record<string, unknown>}
                                onSubmit={saveDraft}
                            />
                        </section>
                    )}
                </div>
            </AppPage>
        </>
    );
}
