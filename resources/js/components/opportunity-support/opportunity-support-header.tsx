import { Link } from '@inertiajs/react';
import { HandHelping, RefreshCw } from 'lucide-react';
import { CampusOperationHeader } from '@/components/campus-operation-layout';
import { Button } from '@/components/ui/button';
import { show as overview } from '@/routes/campus/overview';
import { index as projectsIndex } from '@/routes/projects';

export function OpportunitySupportHeader({
    administration,
    institutionId,
    institutionName,
    reviewer,
    isProcessing,
    isChecking,
    onCheckLatest,
}: {
    administration: boolean;
    institutionId: number;
    institutionName: string;
    reviewer: boolean;
    isProcessing: boolean;
    isChecking: boolean;
    onCheckLatest: () => void;
}) {
    return (
        <div className="space-y-5">
            <CampusOperationHeader
                theme="support"
                formal={administration}
                icon={HandHelping}
                eyebrow={
                    administration
                        ? 'Admin Universitas'
                        : 'Kesempatan kolaborasi'
                }
                institution={institutionName}
                title={
                    reviewer ? 'Tindak lanjut kesempatan' : 'Bantuan kesempatan'
                }
                description={
                    administration
                        ? 'Tindak lanjuti kebutuhan yang sengaja dibagikan mahasiswa, hanya sesuai penunjukan peninjau dan izin per berkas.'
                        : 'Bantuan yang Anda pilih, bukan penilaian kepribadian. Tawaran membuka arahan, bukan kewajiban bergabung.'
                }
            />
            <div className="flex flex-wrap gap-3">
                <Button variant="outline" asChild>
                    <Link
                        href={
                            administration
                                ? overview(institutionId)
                                : projectsIndex({
                                      query: {
                                          institution_id: institutionId,
                                      },
                                  })
                        }
                    >
                        {administration
                            ? 'Kembali ke ringkasan'
                            : 'Jelajahi proyek'}
                    </Link>
                </Button>
                <Button
                    variant="outline"
                    disabled={isProcessing || isChecking}
                    onClick={onCheckLatest}
                >
                    <RefreshCw aria-hidden="true" className="size-4" />
                    {isChecking ? 'Memeriksa data...' : 'Periksa data terbaru'}
                </Button>
            </div>
        </div>
    );
}
