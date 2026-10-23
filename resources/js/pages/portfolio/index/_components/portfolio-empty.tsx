import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardArchiveArt as ArchiveArt } from '@/pages/dashboard/_components/dashboard-archive-art';
import { dashboard } from '@/routes';
import { index as contributionsIndex } from '@/routes/contributions';
import type { PortfolioProfile } from '@/types/portfolio';

export function PortfolioEmpty({
    profile,
}: {
    profile: PortfolioProfile | null;
}) {
    return (
        <section
            className="grid min-w-0 justify-items-center gap-4 rounded-3xl border border-dashed border-primary/20 bg-linear-to-b from-card to-accent/40 px-5 py-10 text-center sm:p-10"
            data-test={
                profile === null
                    ? 'portfolio-profile-missing'
                    : 'portfolio-empty'
            }
        >
            <ArchiveArt className="w-28" />
            <h2 className="text-title font-semibold">
                {profile === null
                    ? 'Profil portofolio belum tersedia.'
                    : 'Karya pertamamu dimulai dari kontribusi.'}
            </h2>
            <p className="max-w-[58ch] text-sm leading-7 text-muted-foreground">
                {profile === null
                    ? 'Lengkapi profil dan periksa afiliasi kampus di Beranda. Pengaturan portofolio tersedia setelah profil kampusmu siap.'
                    : 'Kontribusi yang disetujui kampus menjadi sumber karya di sini. Setelah tersedia, kamu memilih sendiri siapa yang dapat melihatnya.'}
            </p>
            <Button asChild variant="outline" className="min-h-11">
                <Link
                    href={profile === null ? dashboard() : contributionsIndex()}
                >
                    {profile === null
                        ? 'Kembali ke Beranda'
                        : 'Lihat kontribusi'}
                    <ArrowRight aria-hidden="true" />
                </Link>
            </Button>
        </section>
    );
}
