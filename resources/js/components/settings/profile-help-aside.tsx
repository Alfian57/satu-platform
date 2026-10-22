import { CircleUserRound, GraduationCap, ShieldCheck } from 'lucide-react';
import { SettingsHelpCard } from '@/components/settings/settings-panel';

export interface ProfileHelpAsideProps {
    isStudent: boolean;
}

export function ProfileHelpAside({ isStudent }: ProfileHelpAsideProps) {
    return (
        <SettingsHelpCard
            icon={ShieldCheck}
            eyebrow="Pahami perbedaannya"
            title="Akun dan ruang kolaborasi"
        >
            <div className="grid gap-4 text-sm leading-6 text-muted-foreground">
                <div className="rounded-2xl border border-primary/10 bg-accent/60 p-4">
                    <h3 className="font-semibold text-foreground">
                        Identitas untuk masuk
                    </h3>
                    <p className="mt-2">
                        Nama pengguna dan password adalah akses pribadimu.
                        Jangan bagikan kepada anggota tim.
                    </p>
                </div>
                <div className="flex items-start gap-3">
                    <GraduationCap
                        aria-hidden="true"
                        className="mt-1 size-4 shrink-0 text-primary"
                    />
                    <div>
                        <h3 className="font-semibold text-foreground">
                            Afiliasi kampus terpisah
                        </h3>
                        <p className="mt-1">
                            Mengubah nama akun tidak mengubah data akademik atau
                            status verifikasi afiliasi.
                        </p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <CircleUserRound
                        aria-hidden="true"
                        className="mt-1 size-4 shrink-0 text-primary"
                    />
                    <div>
                        <h3 className="font-semibold text-foreground">
                            {isStudent
                                ? 'Jangkauan karya tetap pilihanmu'
                                : 'Pengaturan universitas terpisah'}
                        </h3>
                        <p className="mt-1">
                            {isStudent
                                ? 'Pengaturan ini tidak mengubah siapa yang boleh melihat karya atau profil kemampuanmu.'
                                : 'Identitas akun pribadi tidak mengubah profil universitas atau kewenangan admin.'}
                        </p>
                    </div>
                </div>
            </div>
        </SettingsHelpCard>
    );
}
