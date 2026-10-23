import { Deferred, Head } from '@inertiajs/react';
import { FileCheck2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppPage } from '@/layouts/_components/app-page';
import {
    CampusOperationHeader,
    CampusTechnicalDetails,
} from '@/pages/campus/_components/campus-operation-layout';
import { ContributionFilterBar } from '@/pages/campus/contributions/_components/contribution-filter-bar';
import { ContributionQueueSkeleton } from '@/pages/campus/contributions/_components/contribution-queue-skeleton';
import { ContributionReviewWorkspace } from '@/pages/campus/contributions/_components/contribution-review-workspace';
import { ContributionSummaryRail } from '@/pages/campus/contributions/_components/contribution-summary-rail';
import { ContributionSummarySkeleton } from '@/pages/campus/contributions/_components/contribution-summary-skeleton';
import { useCampusContributions } from '@/pages/campus/contributions/_hooks/use-campus-contributions';
import type { CampusContributionsProps } from '@/pages/campus/contributions/_types/contribution-types';

export default function CampusContributions({
    institution,
    filters,
    reviewQueue,
}: CampusContributionsProps) {
    const {
        isFilterLoading,
        filterError,
        accessUnavailable,
        setAccessUnavailable,
        searchDraft,
        setSearchDraft,
        filterChangeGuardRef,
        updateFilters,
        retryFilter,
    } = useCampusContributions({ institution, filters });

    return (
        <>
            <Head
                title={`Validasi Kontribusi Mahasiswa - ${institution.name} | SATU`}
            />

            <AppPage>
                <div
                    className="space-y-6"
                    data-test="campus-contribution-review-root"
                >
                    <CampusOperationHeader
                        theme="validation"
                        title="Validasi kontribusi"
                        description="Periksa versi pekerjaan dan bukti privat, lalu berikan keputusan yang membantu mahasiswa memahami langkah berikutnya."
                        institution={institution.name}
                        icon={FileCheck2}
                        eyebrow="Meja peninjauan"
                    />
                    <Deferred
                        data="reviewQueue"
                        fallback={<ContributionSummarySkeleton />}
                    >
                        {!accessUnavailable && (
                            <ContributionSummaryRail
                                reviewQueue={reviewQueue!}
                            />
                        )}
                    </Deferred>

                    <ContributionFilterBar
                        filters={filters}
                        searchDraft={searchDraft}
                        onSearchDraftChange={setSearchDraft}
                        isFilterLoading={isFilterLoading}
                        filterError={filterError}
                        onUpdateFilters={updateFilters}
                        onRetryFilter={retryFilter}
                    />

                    <CampusTechnicalDetails title="Panduan keputusan dan privasi">
                        <p>
                            Periksa versi aktif dan bukti yang tersedia sebelum
                            memutuskan. Perbaikan atau penolakan memerlukan
                            alasan faktual. Bukti tetap privat dan keputusan
                            tersimpan bersama versi serta riwayat peninjauan.
                        </p>
                        <p className="mt-3">
                            Sepakati peninjau utama, cadangan dan jadwal
                            pemeriksaan bersama tim kampus. Gunakan notifikasi
                            aplikasi untuk pengajuan baru. Waktu kirim berasal
                            dari pengajuan versi ini; riwayat yang belum
                            tercatat tidak diberi tanggal perkiraan. Halaman ini
                            tidak menetapkan SLA atau jadwal kampus.
                        </p>
                    </CampusTechnicalDetails>

                    <Deferred
                        data="reviewQueue"
                        fallback={<ContributionQueueSkeleton />}
                    >
                        {!accessUnavailable ? (
                            <ContributionReviewWorkspace
                                institution={institution}
                                filters={filters}
                                reviewQueue={reviewQueue!}
                                isFilterLoading={isFilterLoading}
                                onAccessUnavailable={() =>
                                    setAccessUnavailable(true)
                                }
                                filterChangeGuardRef={filterChangeGuardRef}
                            />
                        ) : (
                            <section className="rounded-3xl border border-border bg-white p-5">
                                <h2 className="text-lg font-bold">
                                    Akses validasi tidak tersedia
                                </h2>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Data sebelumnya disembunyikan. Periksa izin
                                    institusi lalu muat ulang filter.
                                </p>
                                <Button
                                    variant="outline"
                                    disabled={isFilterLoading}
                                    onClick={() => updateFilters({})}
                                    className="mt-4"
                                >
                                    Muat ulang antrean
                                </Button>
                            </section>
                        )}
                    </Deferred>
                </div>
            </AppPage>
        </>
    );
}

CampusContributions.layout = {
    breadcrumbs: [
        { title: 'Operasi Kampus', href: '#' },
        { title: 'Validasi Kontribusi', href: '#' },
    ],
};
