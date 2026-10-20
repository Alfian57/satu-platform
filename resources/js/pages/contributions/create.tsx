import { Head, Link, router, useHttp } from '@inertiajs/react';
import { ArrowLeft, FolderOpen, ShieldAlert } from 'lucide-react';
import { useRef, useState } from 'react';
import ContributionController from '@/actions/App/Http/Controllers/ContributionController';
import { AppPage } from '@/components/app-page';
import { ContributionComposer } from '@/components/contributions/contribution-composer';
import { DashboardArchiveArt as ArchiveArt } from '@/components/dashboard-archive-art';
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
    const commandLock = useRef(false);
    const saved = useRef(false);
    const [needsCheck, setNeedsCheck] = useState(false);
    const [accessDenied, setAccessDenied] = useState(false);
    const form = useHttp<ContributionPayload, ContributionApiResponse>({
        task_id: '',
        claim: '',
        summary: '',
        declaration:
            'Saya menyatakan bahwa kontribusi ini merepresentasikan pekerjaan saya.',
        evidence: [],
    });

    function saveDraft(values: ContributionComposerValues): void {
        if (
            values.project_id === 0 ||
            form.processing ||
            commandLock.current ||
            needsCheck ||
            accessDenied
        ) {
            return;
        }

        commandLock.current = true;
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
                if (response.status === 403 || response.status === 404) {
                    setAccessDenied(true);
                } else {
                    setNeedsCheck(true);
                }

                setActionError(
                    response.status === 403
                        ? 'Draft belum dapat dibuat karena akses proyek sudah berubah.'
                        : 'Hasil penyimpanan belum dapat dipastikan. Periksa daftar kontribusi sebelum membuat draft lagi.',
                );

                return false;
            },
            onNetworkError: () => {
                setNeedsCheck(true);
                setActionError(
                    'Hasil penyimpanan belum pasti. Isian tetap ada. Periksa daftar kontribusi untuk menghindari draft ganda.',
                );

                return false;
            },
        })
            .then((response) => {
                if (!response?.data) {
                    return;
                }

                saved.current = true;
                router.visit(contributionShow(response.data.id), {
                    replace: true,
                });
            })
            .catch(() => undefined)
            .finally(() => {
                commandLock.current = false;
            });
    }

    return (
        <>
            <Head title="Susun kontribusi" />
            <AppPage className="min-w-0">
                <div
                    data-test="contribution-create-root"
                    className="grid w-full min-w-0 gap-6"
                >
                    <header className="relative isolate grid min-w-0 gap-4 overflow-hidden rounded-4xl border border-white bg-linear-to-br from-accent to-sky-100 p-5 shadow-md sm:p-7 lg:pr-48">
                        <ArchiveArt className="absolute top-5 right-7 -z-10 hidden w-36 opacity-55 lg:block" />
                        <Link
                            href={contributionsIndex()}
                            className="inline-flex min-h-11 w-fit cursor-pointer items-center gap-2 rounded-sm text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                            data-test="back-to-contributions"
                        >
                            <ArrowLeft aria-hidden="true" className="size-4" />
                            Kembali ke kontribusi
                        </Link>
                        <div className="grid gap-3">
                            <p className="font-label text-label text-primary">
                                Kontribusi baru / Draft
                            </p>
                            <h1 className="max-w-2xl text-2xl leading-snug font-bold tracking-tight text-balance sm:text-3xl">
                                Catat hasil kerja yang sudah kamu lakukan.
                            </h1>
                            <p className="max-w-[68ch] text-body text-muted-foreground">
                                Pilih tugas, ceritakan kontribusimu, dan tautkan
                                bukti privat. Simpan sebagai draft untuk
                                diperiksa sebelum dikirim ke kampus.
                            </p>
                        </div>
                    </header>

                    {accessDenied || !canCreate || projects.length === 0 ? (
                        <section
                            data-test="contribution-create-forbidden"
                            className="grid min-w-0 gap-5 rounded-3xl border border-border bg-card px-5 py-12 text-center shadow-sm sm:px-8"
                        >
                            <ShieldAlert
                                aria-hidden="true"
                                className="mx-auto size-9 text-pending-subtle-foreground"
                            />
                            <div className="grid gap-2">
                                <h2 className="text-title font-semibold">
                                    Belum dapat menyusun kontribusi
                                </h2>
                                <p className="mx-auto max-w-[58ch] text-sm leading-6 text-muted-foreground">
                                    Kontribusi hanya dapat dibuat dari proyek
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
                                    Lihat proyek
                                </Link>
                            </Button>
                        </section>
                    ) : (
                        <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]">
                            <section
                                aria-labelledby="contribution-composer-title"
                                className="grid min-w-0 gap-5"
                            >
                                <div className="grid gap-2">
                                    <p className="text-xs font-semibold text-muted-foreground">
                                        Catatan pekerjaan
                                    </p>
                                    <h2
                                        id="contribution-composer-title"
                                        className="text-title font-semibold"
                                    >
                                        Susun draft selangkah demi selangkah.
                                    </h2>
                                </div>
                                {actionError && (
                                    <div
                                        role="alert"
                                        data-test="contribution-create-error"
                                        className="rounded-2xl border border-correction/30 bg-correction-subtle px-4 py-3 text-sm leading-6 text-correction-subtle-foreground"
                                    >
                                        {actionError}
                                    </div>
                                )}
                                {needsCheck && (
                                    <div
                                        className="grid gap-3 rounded-2xl border border-pending/30 bg-pending-subtle p-4 text-sm leading-6"
                                        data-test="contribution-create-recovery"
                                    >
                                        <a
                                            href={contributionsIndex().url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="min-h-11 cursor-pointer font-semibold text-primary underline focus-visible:outline-2 focus-visible:outline-ring"
                                        >
                                            Periksa daftar kontribusi di tab
                                            baru
                                        </a>
                                        <p>
                                            Jika draft sudah tercatat, lanjutkan
                                            dari detailnya. Hanya ulangi bila
                                            kamu telah memeriksa dan memastikan
                                            belum ada draft baru.
                                        </p>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="h-auto min-h-11 whitespace-normal"
                                            onClick={() => {
                                                if (
                                                    window.confirm(
                                                        'Sudah memeriksa daftar dan memastikan draft ini belum tercatat?',
                                                    )
                                                ) {
                                                    setNeedsCheck(false);
                                                    setActionError(null);
                                                }
                                            }}
                                        >
                                            Saya sudah memeriksa, belum ada
                                            draft baru
                                        </Button>
                                    </div>
                                )}
                                <ContributionComposer
                                    mode="create"
                                    projects={projects}
                                    processing={form.processing}
                                    blocked={needsCheck}
                                    canLeave={() => saved.current}
                                    errors={
                                        form.errors as Record<string, unknown>
                                    }
                                    onSubmit={saveDraft}
                                />
                            </section>
                            <aside
                                aria-label="Panduan penyusunan kontribusi"
                                className="grid min-w-0 gap-4 border-t border-border/70 px-1 pt-5"
                            >
                                <p className="text-xs font-semibold text-primary">
                                    Sebelum menyimpan
                                </p>
                                <h2 className="text-title font-semibold">
                                    Bantu kampus memahami pekerjaanmu.
                                </h2>
                                <ul className="grid gap-4 text-sm leading-6 text-muted-foreground">
                                    <li>
                                        <strong className="block text-foreground">
                                            Ceritakan peranmu
                                        </strong>
                                        Jelaskan pekerjaan dan hasil yang dapat
                                        diperiksa.
                                    </li>
                                    <li>
                                        <strong className="block text-foreground">
                                            Pilih bukti yang relevan
                                        </strong>
                                        Berkas berasal dari ruang kerja proyek
                                        dan tetap privat.
                                    </li>
                                    <li>
                                        <strong className="block text-foreground">
                                            Periksa draft lebih dulu
                                        </strong>
                                        Menyimpan draft belum mengirim
                                        pengajuan. Kirim untuk validasi dari
                                        halaman detail saat sudah siap.
                                    </li>
                                </ul>
                                <p className="border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
                                    Keputusan validasi berasal dari kampus.
                                    Pengajuan tidak menjamin persetujuan atau
                                    kredit akademik.
                                </p>
                            </aside>
                        </div>
                    )}
                </div>
            </AppPage>
        </>
    );
}

ContributionsCreate.layout = {
    breadcrumbs: [
        { title: 'Kontribusi', href: contributionsIndex() },
        { title: 'Susun draft' },
    ],
};
