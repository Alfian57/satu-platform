import { CircleUserRound, GraduationCap, ShieldCheck } from 'lucide-react';
import { SettingsHelpCard } from '@/pages/settings/_components/settings-panel';

export interface ProfileHelpAsideProps {
    isStudent: boolean;
}

export function ProfileHelpAside({ isStudent }: ProfileHelpAsideProps) {
    return (
        <SettingsHelpCard icon={ShieldCheck} title="Akun dan ruang kolaborasi">
            <div className="grid gap-5 text-sm leading-6 text-muted-foreground">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <GraduationCap
                            aria-hidden="true"
                            className="size-4 shrink-0 text-primary"
                        />
                        <h3 className="font-semibold text-foreground">
                            Afiliasi kampus terpisah
                        </h3>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                        Mengubah nama akun tidak mengubah data akademik atau
                        status verifikasi afiliasi.
                    </p>
                </div>
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <CircleUserRound
                            aria-hidden="true"
                            className="size-4 shrink-0 text-primary"
                        />
                        <h3 className="font-semibold text-foreground">
                            {isStudent
                                ? 'Jangkauan karya tetap pilihanmu'
                                : 'Pengaturan universitas terpisah'}
                        </h3>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                        {isStudent
                            ? 'Pengaturan ini tidak mengubah siapa yang boleh melihat karya atau profil kemampuanmu.'
                            : 'Identitas akun pribadi tidak mengubah profil universitas atau kewenangan admin.'}
                    </p>
                </div>
            </div>
        </SettingsHelpCard>
    );
}
