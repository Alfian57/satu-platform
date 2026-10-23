export function ContributionCreateGuideSidebar() {
    return (
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
                    Jelaskan pekerjaan dan hasil yang dapat diperiksa.
                </li>
                <li>
                    <strong className="block text-foreground">
                        Pilih bukti yang relevan
                    </strong>
                    Berkas berasal dari ruang kerja proyek dan tetap privat.
                </li>
                <li>
                    <strong className="block text-foreground">
                        Periksa draft lebih dulu
                    </strong>
                    Menyimpan draft belum mengirim pengajuan. Kirim untuk
                    validasi dari halaman detail saat sudah siap.
                </li>
            </ul>
            <p className="border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
                Keputusan validasi berasal dari kampus. Pengajuan tidak menjamin
                persetujuan atau kredit akademik.
            </p>
        </aside>
    );
}
