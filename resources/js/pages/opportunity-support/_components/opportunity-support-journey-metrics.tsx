import { formatSupportDate, sheetClass } from './opportunity-support-constants';
import type { OpportunitySupportProps } from './opportunity-support-constants';

export function OpportunitySupportJourneyMetrics({
    journey,
}: {
    journey: OpportunitySupportProps['journey'];
}) {
    if (!journey) {
        return null;
    }

    return (
        <section
            className={sheetClass}
            aria-label="Ringkasan perjalanan operasional"
        >
            <h2 className="text-xl font-bold">
                Jejak operasional, bukan hasil pilot
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Snapshot {formatSupportDate(journey.snapshot_at)}. Cakupan
                mahasiswa terverifikasi saat pembacaan, bukan kohort pada awal
                periode. Tidak memakai XP atau karya sebagai syarat. Riwayat
                sebelum instrumentasi tersedia mungkin tidak lengkap.
            </p>
            {journey.state !== 'available' ? (
                <p className="mt-4 rounded-xl bg-accent/50 p-4 text-sm">
                    {journey.state === 'suppressed'
                        ? 'Angka disembunyikan untuk menjaga privasi kelompok kecil atau cakupan kosong. Tidak ditampilkan sebagai 0%.'
                        : 'Ringkasan belum diaktifkan. Persetujuan evaluasi dan ambang kelompok kecil khusus belum lengkap.'}
                </p>
            ) : (
                <>
                    <p className="mt-4 font-semibold">
                        Denominator: {journey.denominator} mahasiswa eligible
                        saat snapshot.
                    </p>
                    <dl className="mt-4 grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
                        {journey.metrics.map((metric) => (
                            <div
                                key={metric.label}
                                className="rounded-2xl border border-primary/15 bg-accent/30 p-4"
                            >
                                <dt className="text-sm font-semibold">
                                    {metric.label}
                                </dt>
                                <dd className="mt-2 text-xl font-bold">
                                    {metric.state === 'suppressed'
                                        ? 'Disembunyikan untuk privasi'
                                        : metric.value === null
                                          ? 'Belum dapat dihitung'
                                          : metric.value}
                                </dd>
                                <dd className="mt-2 text-sm leading-6 text-muted-foreground">
                                    {metric.source}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </>
            )}
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
                Tahap tidak membentuk funnel berurutan. Bergabung bukan bukti
                kerja bersama; catatan bantuan bukan keberhasilan. Periode,
                populasi pilot, baseline dan target harus disepakati sebelum
                evaluasi manfaat.
            </p>
        </section>
    );
}
