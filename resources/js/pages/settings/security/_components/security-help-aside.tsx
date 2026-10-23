import { CheckCircle2, KeyRound, LockKeyhole, ShieldCheck } from 'lucide-react';
import { SettingsHelpCard } from '@/pages/settings/_components/settings-panel';

export function SecurityHelpAside() {
    return (
        <SettingsHelpCard
            icon={ShieldCheck}
            eyebrow="Kebiasaan sederhana"
            title="Jaga akses pribadimu"
        >
            <ul className="grid gap-4 text-sm leading-6 text-muted-foreground">
                <li className="flex items-start gap-3">
                    <LockKeyhole
                        aria-hidden="true"
                        className="mt-1 size-4 shrink-0 text-primary"
                    />
                    <span>
                        Jangan bagikan password, termasuk kepada teman satu tim
                        atau pihak yang mengaku sebagai petugas.
                    </span>
                </li>
                <li className="flex items-start gap-3">
                    <CheckCircle2
                        aria-hidden="true"
                        className="mt-1 size-4 shrink-0 text-primary"
                    />
                    <span>
                        Password manager dapat membantu menyimpan password yang
                        unik untuk setiap layanan.
                    </span>
                </li>
                <li className="flex items-start gap-3">
                    <KeyRound
                        aria-hidden="true"
                        className="mt-1 size-4 shrink-0 text-primary"
                    />
                    <span>
                        Periksa ulang password baru sebelum menyimpan. Tombol
                        mata dapat menampilkan atau menyembunyikan isian.
                    </span>
                </li>
            </ul>
            <p className="rounded-2xl border border-satu-orange-border bg-card/80 p-4 text-xs leading-6 text-muted-foreground">
                Mengubah password tidak mengubah karya, afiliasi kampus, atau
                pilihan visibilitasmu.
            </p>
        </SettingsHelpCard>
    );
}
