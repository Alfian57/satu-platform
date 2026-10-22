import { Link } from '@inertiajs/react';
import { ChevronRight, ClipboardCheck, FileCheck2 } from 'lucide-react';
import { numberFormatter } from '@/components/campus/overview/overview-types';
import { Button } from '@/components/ui/button';
import { index as affiliationIndex } from '@/routes/campus/affiliations';
import { index as campusContributionsIndex } from '@/routes/campus/contributions';

interface OverviewQuickActionsProps {
    institutionId: number;
    pendingMemberships: number;
}

export function OverviewQuickActions({
    institutionId,
    pendingMemberships,
}: OverviewQuickActionsProps) {
    return (
        <section
            className="rounded-3xl border border-primary/15 bg-white p-4 shadow-sm sm:p-5"
            aria-labelledby="campus-actions-heading"
        >
            <h2
                id="campus-actions-heading"
                className="text-lg font-bold tracking-tight"
            >
                Lanjutkan pekerjaan
            </h2>
            <div className="mt-3 divide-y divide-border">
                <div className="flex flex-wrap items-center gap-3 rounded-xl bg-accent/45 p-3">
                    <ClipboardCheck
                        aria-hidden="true"
                        className="size-5 shrink-0 text-primary"
                    />
                    <div className="min-w-0 flex-1 basis-48">
                        <h3 className="text-sm font-semibold">
                            Tinjau afiliasi kampus
                        </h3>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                            {numberFormatter.format(pendingMemberships)}{' '}
                            keanggotaan menunggu. Bukan total permintaan pada
                            antrean afiliasi.
                        </p>
                    </div>
                    <Button asChild className="h-11">
                        <Link
                            href={affiliationIndex({
                                institution: institutionId,
                            })}
                        >
                            Buka antrean afiliasi
                            <ChevronRight
                                aria-hidden="true"
                                className="size-4"
                            />
                        </Link>
                    </Button>
                </div>
                <div className="flex flex-wrap items-center gap-3 px-3 pt-3">
                    <FileCheck2
                        aria-hidden="true"
                        className="size-5 shrink-0 text-primary"
                    />
                    <div className="min-w-0 flex-1 basis-48">
                        <h3 className="text-sm font-semibold">
                            Validasi kontribusi mahasiswa
                        </h3>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                            Periksa pengajuan dan bukti. Jumlah kontribusi belum
                            tersedia pada ringkasan ini.
                        </p>
                    </div>
                    <Button asChild variant="outline" className="h-11">
                        <Link
                            href={campusContributionsIndex({
                                institution: institutionId,
                            })}
                        >
                            Buka antrean validasi
                            <ChevronRight
                                aria-hidden="true"
                                className="size-4"
                            />
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}
