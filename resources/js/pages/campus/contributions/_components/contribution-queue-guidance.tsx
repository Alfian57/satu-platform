export function ContributionQueueGuidance() {
    return (
        <details
            className="rounded-3xl border border-border bg-card p-5"
            data-test="campus-contribution-guidance"
        >
            <summary className="min-h-11 cursor-pointer font-semibold focus-visible:outline-2 focus-visible:outline-ring">
                Batas dan panduan validasi individual
            </summary>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Periksa bagian pekerjaan mahasiswa, hubungan klaim dengan bukti,
                dan pernyataannya. Berkas bersama tidak membuktikan semua
                anggota mengerjakan bagian yang sama. Persetujuan hanya menilai
                kontribusi pada versi ini, bukan semua keahlian atau kualitas
                mutlak. Ringkasan menjadi karya privat; bukti dan catatan
                keputusan tidak ikut dipublikasikan. Panduan teknis ini bukan
                standar final atau SLA kampus. Nyatakan bagian yang perlu
                diperbaiki pada alasan; catatan dapat dibaca pemilik.
            </p>
        </details>
    );
}
