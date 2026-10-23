import { CheckCircle2, KeyRound, LockKeyhole, ShieldCheck } from 'lucide-react';
import { SettingsHelpCard } from '@/pages/settings/_components/settings-panel';

export function SecurityHelpAside() {
    return (
        <SettingsHelpCard icon={ShieldCheck} title="Jaga akses pribadimu">
            <div className="grid gap-5 text-sm leading-6 text-muted-foreground">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <LockKeyhole
                            aria-hidden="true"
                            className="size-4 shrink-0 text-primary"
                        />
                        <h3 className="font-semibold text-foreground">
                            Kerahasiaan akun
                        </h3>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                        Jangan bagikan password, termasuk kepada teman satu tim
                        atau pihak yang mengaku sebagai petugas.
                    </p>
                </div>
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <CheckCircle2
                            aria-hidden="true"
                            className="size-4 shrink-0 text-primary"
                        />
                        <h3 className="font-semibold text-foreground">
                            Pengelolaan aman
                        </h3>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                        Password manager dapat membantu menyimpan password yang
                        unik untuk setiap layanan.
                    </p>
                </div>
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <KeyRound
                            aria-hidden="true"
                            className="size-4 shrink-0 text-primary"
                        />
                        <h3 className="font-semibold text-foreground">
                            Pemeriksaan teliti
                        </h3>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                        Periksa ulang password baru sebelum menyimpan. Tombol
                        mata dapat menampilkan atau menyembunyikan isian.
                    </p>
                </div>
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <ShieldCheck
                            aria-hidden="true"
                            className="size-4 shrink-0 text-primary"
                        />
                        <h3 className="font-semibold text-foreground">
                            Cakupan pengaturan
                        </h3>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                        Mengubah password tidak mengubah karya, afiliasi kampus,
                        atau pilihan visibilitasmu.
                    </p>
                </div>
            </div>
        </SettingsHelpCard>
    );
}
