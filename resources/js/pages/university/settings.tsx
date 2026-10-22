import { Head } from '@inertiajs/react';
import { Settings2 } from 'lucide-react';
import { AppPage } from '@/components/app-page';
import { CampusOperationHeader } from '@/components/campus-operation-layout';
import { Button } from '@/components/ui/button';
import { UniversityProfileCard } from '@/components/university/university-profile-card';
import { UniversitySemesterCard } from '@/components/university/university-semester-card';
import { UniversitySettingsAside } from '@/components/university/university-settings-aside';
import { UniversitySettingsNav } from '@/components/university-settings-nav';
import type {
    PageData,
    University,
} from '@/components/university-settings-nav';
import { useUniversitySettings } from '@/hooks/use-university-settings';

interface Props {
    section?: 'profile' | 'semester';
    institution: University & { timezone: string; locale: string };
    rosters: PageData<{
        id: number;
        semester: string;
        status: string;
        activated_at: string | null;
        superseded_at: string | null;
    }>;
}

export default function UniversitySettings({
    institution,
    rosters,
    section = 'profile',
}: Props) {
    const { busy, error, denied, actions } = useUniversitySettings({
        institutionId: institution.id,
        section,
    });

    return (
        <AppPage>
            <Head title="Pengaturan universitas" />
            <div className="grid min-w-0 gap-6" data-test="university-settings">
                <CampusOperationHeader
                    theme="settings"
                    title="Pengaturan universitas"
                    description="Periksa profil universitas dan riwayat impor daftar mahasiswa. Keamanan akun pribadi dikelola terpisah."
                    institution={institution.name}
                    icon={Settings2}
                />
                <UniversitySettingsNav
                    institution={institution.id}
                    active={section}
                />
                {error && (
                    <div
                        role="alert"
                        className="min-w-0 rounded-3xl border border-primary/15 bg-card p-5 shadow-sm sm:p-6"
                    >
                        <p>{error}</p>
                        <Button
                            className="mt-3 cursor-pointer disabled:cursor-not-allowed"
                            variant="outline"
                            onClick={() =>
                                actions.visitPage(rosters.current_page)
                            }
                            disabled={busy}
                        >
                            Periksa kembali
                        </Button>
                    </div>
                )}
                {!denied && (
                    <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
                        <div className="grid min-w-0 gap-6">
                            <UniversityProfileCard institution={institution} />
                            <UniversitySemesterCard
                                rosters={rosters}
                                institutionId={institution.id}
                                busy={busy}
                                onPageChange={actions.visitPage}
                            />
                        </div>
                        <UniversitySettingsAside />
                    </div>
                )}
                {busy && (
                    <p role="status" className="text-sm text-muted-foreground">
                        Memuat semester terbaru.
                    </p>
                )}
            </div>
        </AppPage>
    );
}
