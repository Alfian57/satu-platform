export function UniversitySettingsAside() {
    return (
        <aside className="min-w-0 space-y-4 text-sm leading-6">
            <section className="min-w-0 rounded-3xl border border-primary/15 bg-accent/40 p-5 shadow-sm sm:p-6">
                <h2 className="font-bold">Batas pengaturan</h2>
                <p className="mt-2 text-muted-foreground">
                    Kunci akses WhatsApp dan koneksi penyedia layanan ditangani
                    pengelola teknis, bukan melalui halaman ini.
                </p>
            </section>
            <section className="min-w-0 rounded-3xl border border-primary/15 bg-card p-5 shadow-sm sm:p-6">
                <h2 className="font-bold">Akun pribadi tetap terpisah</h2>
                <p className="mt-2 text-muted-foreground">
                    Ubah nama pengguna, sandi, dan hak data dari menu akun. Akun
                    admin universitas mengatur akses pengelola, bukan identitas
                    login mahasiswa.
                </p>
            </section>
        </aside>
    );
}
