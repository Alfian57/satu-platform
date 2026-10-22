import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { index as contributionsIndex } from '@/routes/contributions';

export function ContributionAccessDenied() {
    return (
        <section
            role="alert"
            className="grid gap-4 rounded-3xl border border-border bg-card p-6"
            data-test="contribution-access-denied"
        >
            <h1 className="text-2xl font-bold">
                Akses kontribusi tidak tersedia
            </h1>
            <p>
                Konten privat disembunyikan. Periksa afiliasi dan izin proyek
                sebelum membuka kembali.
            </p>
            <Button asChild variant="outline">
                <Link href={contributionsIndex()}>Kembali ke kontribusi</Link>
            </Button>
        </section>
    );
}
