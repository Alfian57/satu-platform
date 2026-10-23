import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { DashboardArchiveArt as ArchiveArt } from '@/pages/dashboard/_components/dashboard-archive-art';
import { index as contributionsIndex } from '@/routes/contributions';

export function ContributionCreateHeader() {
    return (
        <header className="relative isolate grid min-w-0 gap-4 overflow-hidden rounded-4xl border border-white bg-linear-to-br from-accent to-accent/30 p-5 shadow-md sm:p-7 lg:pr-48">
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
                    Pilih tugas, ceritakan kontribusimu, dan tautkan bukti
                    privat. Simpan sebagai draft untuk diperiksa sebelum dikirim
                    ke kampus.
                </p>
            </div>
        </header>
    );
}
